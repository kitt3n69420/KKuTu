/**
 * Discord Bot Module for KKuTu
 * Handles event notifications and slash commands
 */

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const safeRegex = require('safe-regex');
const JLog = require('./jjlog');
const LANG = require('../Web/lang/ko_KR.json');
const Const = require('../const');
const FallbackLog = require('./discord-fallback-log');

// Constants
const GUILD_ID = '1447976671805182086';
const CHANNEL_ID = '1485462715395870800';
const REPORT_CHANNEL_ID = '1529461366900133958';
const BOT_PERMISSIONS = '9193377795136';
const MAX_RESULTS = 20;
const MAX_REGEX_LENGTH = 200;
const MAX_RANDOM_COUNT = 50;
const MAX_REGEX_GROUPS = 5;
const MAX_REGEX_QUANTIFIERS = 5;
const VALID_WORD_CHARS = /^[0-9a-zㄱ-ㅣ가-힣]+$/;
const DB_TIMEOUT = 8000;
const logToFile = FallbackLog.logToFile;

function isBotAvailable() {
    return isEnabled && isReady && !!channel;
}

// State
let client = null;
let channel = null;
let reportChannel = null;
let DB = null;
let DIC = null;
let ROOM = null;
let ADMIN = [];
let isReady = false;
let isEnabled = true;  // Can be disabled for test servers
let _botToken = null;
let _reconnectTimer = null;
const RECONNECT_DELAY = 30000; // 30s before manual reconnect attempt

// Proxy callbacks set when running as a separate process
let _queryOnlineUser = null; // (query) => Promise<{profile, data}|null>
let _sendRoomMsg = null;     // (roomId, message) => Promise<{exists, sent}>

/**
 * Safe wrapper for async operations
 */
async function safeExecute(operation, context = 'Unknown') {
    try {
        await operation();
    } catch (err) {
        JLog.error(`[Discord Bot] ERROR in ${context}: ${err.message}`);
        console.error(`[Discord Bot] ERROR in ${context}:`, err);
    }
}

function scheduleReconnect() {
    if (_reconnectTimer || !isEnabled || !_botToken) return;
    _reconnectTimer = setTimeout(async () => {
        _reconnectTimer = null;
        if (isReady) return;
        JLog.warn('[Discord Bot] 수동 재접속 시도...');
        try {
            if (client) {
                client.removeAllListeners();
                await client.destroy().catch(() => {});
            }
            client = null;
            channel = null;
            await Promise.race([
                exports.init(_botToken, DB, DIC, { enabled: true, ROOM, ADMIN, queryOnlineUser: _queryOnlineUser, sendRoomMsg: _sendRoomMsg }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Reconnect timeout (35s)')), 35000))
            ]);
        } catch (err) {
            JLog.error(`[Discord Bot] 재접속 실패: ${err.message}`);
            scheduleReconnect();
        }
    }, RECONNECT_DELAY);
}

/**
 * Get display name for a user
 */
function getDisplayName(profile) {
    if (!profile) return '알 수 없음';
    return profile.title || profile.name || '알 수 없음';
}

/**
 * Parse word meaning from DB format to readable format
 * DB format: ＂1＂first meaning＂2＂second meaning
 */
function parseMeaning(mean) {
    if (!mean) return null;

    // Split by the numbered markers ＂N＂
    const parts = mean.split(/＂[0-9]+＂/g).filter(p => p.trim());

    if (parts.length === 0) return null;

    return parts.map((p, i) => `**${i + 1}.** ${p.trim()}`).join('\n');
}

/**
 * Get word type display name using KO_KR.json localization
 * Handles comma-separated type codes like "1,INJEONG"
 */
function getTypeDisplay(typeStr) {
    if (!typeStr) return '미분류';

    // Split comma-separated codes
    const codes = String(typeStr).split(',').map(c => c.trim()).filter(c => c && c !== '0');

    if (codes.length === 0) return '미분류';

    const translated = codes.map(code => {
        // Try numeric class_N key first
        if (/^[0-9]+$/.test(code)) {
            const key = `class_${code}`;
            if (LANG.kkutu && LANG.kkutu[key]) return LANG.kkutu[key];
        }
        // Try string keys like "INJEONG"
        if (code === 'INJEONG') return '어인정';
        return code;
    });

    return translated.join(', ');
}

/**
 * Get theme display name using KO_KR.json localization
 * Handles comma-separated theme codes like "270,320,210,0"
 */
function getThemeDisplay(themeStr) {
    if (!themeStr) return null;

    // Split comma-separated codes
    const codes = String(themeStr).split(',').map(c => c.trim()).filter(c => c && c !== '0');

    if (codes.length === 0) return null;

    const translated = codes.map(code => {
        // Try theme_N key
        const key = `theme_${code}`;
        if (LANG.kkutu && LANG.kkutu[key]) return LANG.kkutu[key];
        return code;
    });

    // Remove duplicates
    const unique = [...new Set(translated)];
    return unique.join(', ');
}

/**
 * Format a word with Discord markdown based on flag and type
 * - flag & 2 (INJEONG): bold only; otherwise bold + underline
 * - type not matching KOR_GROUP: strikethrough
 */
function formatWord(word, flag, type) {
    let text = word;
    const isInjeong = (flag || 0) & 2;
    const isValidType = type && Const.KOR_GROUP.test(String(type));

    if (!isValidType) {
        text = `~~${text}~~`;
    }

    if (isInjeong) {
        text = `**${text}**`;
    } else {
        text = `__**${text}**__`;
    }

    return text;
}

/**
 * Detect language from query string
 */
function detectLanguage(query) {
    // Check if query contains Korean characters
    if (/[가-힣]/.test(query)) return 'ko';
    // Check if query contains only English letters
    if (/^[a-zA-Z]+$/.test(query)) return 'en';
    // Default to Korean
    return 'ko';
}

/**
 * Initialize the Discord bot
 * @param {string} token - Discord bot token
 * @param {object} db - Database reference
 * @param {object} dic - Dictionary reference
 * @param {object} options - Optional settings
 * @param {boolean} options.enabled - Whether to enable the bot (default: true)
 */
exports.init = async function (token, db, dic, options = {}) {
    isEnabled = options.enabled !== false;

    if (!isEnabled) {
        JLog.info('[Discord Bot] Bot is disabled by configuration');
        return;
    }

    if (!token) {
        JLog.warn('[Discord Bot] No token provided, bot disabled');
        return;
    }

    _botToken = token;
    DB = db;
    DIC = dic;
    ROOM = options.ROOM || null;
    ADMIN = options.ADMIN || [];
    _queryOnlineUser = options.queryOnlineUser || null;
    _sendRoomMsg = options.sendRoomMsg || null;

    try {
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages
            ]
        });

        client.on('error', (err) => {
            JLog.error(`[Discord Bot] Client error: ${err.message}`);
        });

        client.on('warn', (msg) => {
            JLog.warn(`[Discord Bot] Warning: ${msg}`);
        });

        client.on('shardDisconnect', (event) => {
            JLog.warn(`[Discord Bot] Disconnected (code: ${event.code}), 재접속 대기 중...`);
            isReady = false;
            scheduleReconnect();
        });

        client.on('shardReconnecting', () => {
            JLog.info('[Discord Bot] Reconnecting...');
        });

        client.on('shardResume', () => {
            JLog.info('[Discord Bot] Connection resumed');
            if (!isReady && client) {
                client.channels.fetch(CHANNEL_ID).then(ch => {
                    if (ch) { channel = ch; isReady = true; }
                }).catch(err => JLog.error(`[Discord Bot] Failed to re-fetch channel on resume: ${err.message}`));
                client.channels.fetch(REPORT_CHANNEL_ID).then(ch => {
                    if (ch) reportChannel = ch;
                }).catch(err => JLog.error(`[Discord Bot] Failed to re-fetch report channel on resume: ${err.message}`));
            }
        });

        client.on('ready', async () => {
            try {
                JLog.success(`[Discord Bot] Connected as ${client.user.tag}`);

                channel = await client.channels.fetch(CHANNEL_ID);
                if (!channel) {
                    JLog.error(`[Discord Bot] Could not find channel ${CHANNEL_ID}`);
                } else {
                    JLog.success(`[Discord Bot] Target channel: #${channel.name}`);
                }

                reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID);
                if (!reportChannel) {
                    JLog.error(`[Discord Bot] Could not find report channel ${REPORT_CHANNEL_ID}`);
                } else {
                    JLog.success(`[Discord Bot] Report channel: #${reportChannel.name}`);
                }

                await registerCommands(token);
                isReady = true;
                JLog.success('[Discord Bot] Ready!');
            } catch (err) {
                JLog.error(`[Discord Bot] Error in ready event: ${err.message}`);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (interaction.isAutocomplete()) {
                await safeExecute(async () => {
                    await handleAutocomplete(interaction);
                }, `Autocomplete: ${interaction.commandName}`);
                return;
            }

            if (!interaction.isChatInputCommand()) return;
            if (interaction.guildId !== GUILD_ID) return;

            await safeExecute(async () => {
                await handleCommand(interaction);
            }, `Command: ${interaction.commandName}`);
        });

        await Promise.race([
            client.login(token),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Login timeout (30s)')), 30000))
        ]);
    } catch (err) {
        JLog.error(`[Discord Bot] Failed to initialize: ${err.message}`);
    }
};

/**
 * Register slash commands with localization
 */
async function registerCommands(token) {
    try {
        const commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setNameLocalizations({ ko: '핑' })
                .setDescription('Measure server and Discord latency')
                .setDescriptionLocalizations({
                    ko: '서버와 디스코드의 핑을 측정해요.'
                }),

            new SlashCommandBuilder()
                .setName('help')
                .setNameLocalizations({ ko: '도움말' })
                .setDescription('Show all available commands')
                .setDescriptionLocalizations({
                    ko: '사용 가능한 모든 명령어를 확인해요.'
                }),

            new SlashCommandBuilder()
                .setName('dict')
                .setNameLocalizations({ ko: '사전' })
                .setDescription('Search words (regex supported)')
                .setDescriptionLocalizations({
                    ko: '사전에서 단어를 찾아요. (정규표현식 지원)'
                })
                .addStringOption(opt =>
                    opt.setName('query')
                        .setNameLocalizations({ ko: '검색' })
                        .setDescription('Search query (regex allowed)')
                        .setDescriptionLocalizations({
                            ko: '검색어 (정규표현식 가능)'
                        })
                        .setRequired(true)
                        .setMaxLength(MAX_REGEX_LENGTH)
                ),

            new SlashCommandBuilder()
                .setName('char')
                .setNameLocalizations({ ko: '글자' })
                .setDescription('Search words by starting/ending character')
                .setDescriptionLocalizations({
                    ko: '특정 글자로 시작/끝나는 단어를 찾아요.'
                })
                .addStringOption(opt =>
                    opt.setName('char')
                        .setNameLocalizations({ ko: '글자' })
                        .setDescription('Character to search')
                        .setDescriptionLocalizations({
                            ko: '검색할 글자'
                        })
                        .setRequired(true)
                        .setMaxLength(1)
                )
                .addStringOption(opt =>
                    opt.setName('position')
                        .setNameLocalizations({ ko: '위치' })
                        .setDescription('Position')
                        .setDescriptionLocalizations({
                            ko: '글자의 위치'
                        })
                        .setRequired(true)
                        .addChoices(
                            { name: 'Start', name_localizations: { ko: '시작' }, value: 'start' },
                            { name: 'End', name_localizations: { ko: '끝' }, value: 'end' }
                        )
                ),

            new SlashCommandBuilder()
                .setName('meaning')
                .setNameLocalizations({ ko: '뜻' })
                .setDescription('Look up word definition')
                .setDescriptionLocalizations({
                    ko: '단어 뜻 검색'
                })
                .addStringOption(opt =>
                    opt.setName('word')
                        .setNameLocalizations({ ko: '단어' })
                        .setDescription('Word to look up')
                        .setDescriptionLocalizations({
                            ko: '검색할 단어'
                        })
                        .setRequired(true)
                        .setMaxLength(50)
                ),

            new SlashCommandBuilder()
                .setName('record')
                .setNameLocalizations({ ko: '전적' })
                .setDescription('Look up user game records')
                .setDescriptionLocalizations({
                    ko: '유저 전적을 찾아요. 그냥 쓰면 자신의 전적을 조회해요'
                })
                .addStringOption(opt =>
                    opt.setName('user')
                        .setNameLocalizations({ ko: '유저' })
                        .setDescription('User ID or nickname (optional, shows your record if empty)')
                        .setDescriptionLocalizations({
                            ko: '계정 ID 또는 별명'
                        })
                        .setRequired(false)
                        .setMaxLength(50)
                ),

            new SlashCommandBuilder()
                .setName('mission')
                .setNameLocalizations({ ko: '미션' })
                .setDescription('Find words with the most occurrences of a mission character')
                .setDescriptionLocalizations({
                    ko: '미션 글자가 가장 많이 포함된 단어를 찾아요.'
                })
                .addStringOption(opt =>
                    opt.setName('mission_char')
                        .setNameLocalizations({ ko: '미션글자' })
                        .setDescription('Mission character (single character)')
                        .setDescriptionLocalizations({
                            ko: '미션 글자 (한 글자)'
                        })
                        .setRequired(true)
                        .setMaxLength(1)
                )
                .addStringOption(opt =>
                    opt.setName('topic')
                        .setNameLocalizations({ ko: '주제' })
                        .setDescription('Filter by topic')
                        .setDescriptionLocalizations({
                            ko: '주제 필터'
                        })
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(opt =>
                    opt.setName('target_char')
                        .setNameLocalizations({ ko: '타겟글자' })
                        .setDescription('Filter by starting/ending character')
                        .setDescriptionLocalizations({
                            ko: '시작/끝 글자 필터'
                        })
                        .setRequired(false)
                        .setMaxLength(1)
                )
                .addStringOption(opt =>
                    opt.setName('position')
                        .setNameLocalizations({ ko: '위치' })
                        .setDescription('Position of target character (default: start)')
                        .setDescriptionLocalizations({
                            ko: '타겟 글자의 위치 (기본값: 시작)'
                        })
                        .setRequired(false)
                        .addChoices(
                            { name: 'Start', name_localizations: { ko: '시작' }, value: 'start' },
                            { name: 'End', name_localizations: { ko: '끝' }, value: 'end' }
                        )
                ),

            new SlashCommandBuilder()
                .setName('topic')
                .setNameLocalizations({ ko: '주제' })
                .setDescription('Find longest words belonging to a topic')
                .setDescriptionLocalizations({
                    ko: '특정 주제에 속하는 가장 긴 단어를 찾아요.'
                })
                .addStringOption(opt =>
                    opt.setName('topic')
                        .setNameLocalizations({ ko: '주제' })
                        .setDescription('Topic to search')
                        .setDescriptionLocalizations({
                            ko: '검색할 주제'
                        })
                        .setRequired(true)
                        .setAutocomplete(true)
                ),

            new SlashCommandBuilder()
                .setName('random')
                .setNameLocalizations({ ko: '랜덤' })
                .setDescription('Get random words from the dictionary')
                .setDescriptionLocalizations({
                    ko: '사전에서 랜덤 단어를 뽑아요.'
                })
                .addIntegerOption(opt =>
                    opt.setName('count')
                        .setNameLocalizations({ ko: '개수' })
                        .setDescription('Number of words (1-50, default: 1)')
                        .setDescriptionLocalizations({
                            ko: '단어 수 (1~50, 기본값: 1)'
                        })
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(MAX_RANDOM_COUNT)
                ),

            new SlashCommandBuilder()
                .setName('roommsg')
                .setNameLocalizations({ ko: '방메시지' })
                .setDescription('Send a notice message to a room (admin only)')
                .setDescriptionLocalizations({
                    ko: '방에 관리자 메시지를 보내요. (관리자 전용)'
                })
                .addIntegerOption(opt =>
                    opt.setName('room')
                        .setNameLocalizations({ ko: '방번호' })
                        .setDescription('Room number')
                        .setDescriptionLocalizations({
                            ko: '방 번호'
                        })
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('message')
                        .setNameLocalizations({ ko: '메시지' })
                        .setDescription('Message to send')
                        .setDescriptionLocalizations({
                            ko: '보낼 메시지'
                        })
                        .setRequired(true)
                        .setMaxLength(500)
                )
        ];

        const rest = new REST({ version: '10' }).setToken(token);

        await rest.put(
            Routes.applicationGuildCommands(client.user.id, GUILD_ID),
            { body: commands.map(cmd => cmd.toJSON()) }
        );

        JLog.success('[Discord Bot] Slash commands registered');
    } catch (err) {
        JLog.error(`[Discord Bot] Failed to register commands: ${err.message}`);
        console.error('[Discord Bot] Command registration error:', err);
    }
}

/**
 * Handle autocomplete interactions for topic selection
 */
async function handleAutocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();

    const choices = Const.KO_IJP.map(code => ({
        name: `${getIjpName(code)} (${code})`,
        value: code
    }));

    const filtered = focused
        ? choices.filter(c => c.name.toLowerCase().includes(focused) || c.value.toLowerCase().includes(focused))
        : choices;

    await interaction.respond(filtered.slice(0, 25));
}

/**
 * Handle slash commands
 */
async function handleCommand(interaction) {
    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'ping':
                await handlePing(interaction);
                break;
            case 'help':
                await handleHelp(interaction);
                break;
            case 'dict':
                await handleDict(interaction);
                break;
            case 'char':
                await handleChar(interaction);
                break;
            case 'meaning':
                await handleDefine(interaction);
                break;
            case 'record':
                await handleRecord(interaction);
                break;
            case 'mission':
                await handleMission(interaction);
                break;
            case 'topic':
                await handleTopic(interaction);
                break;
            case 'random':
                await handleRandom(interaction);
                break;
            case 'roommsg':
                await handleRoomMsg(interaction);
                break;
            default:
                await interaction.reply({ content: '알 수 없는 명령어입니다. 어떻게 하신 거죠?', ephemeral: true });
        }
    } catch (err) {
        JLog.error(`[Discord Bot] Command error (${commandName}): ${err.message}`);

        try {
            const errorMsg = { content: `❌ 오류가 발생했습니다: ${err.message}`, ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        } catch (replyErr) {
            console.error('[Discord Bot] Failed to send error reply:', replyErr);
        }
    }
}

/**
 * /ping command
 */
async function handlePing(interaction) {
    const start = Date.now();
    await interaction.deferReply();
    const latency = Date.now() - start;
    const wsLatency = client.ws.ping;

    const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setColor(0x00FF00)
        .addFields(
            { name: '서버 응답 시간', value: `${latency}ms`, inline: true },
            { name: '디스코드 웹소켓', value: `${wsLatency}ms`, inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

/**
 * /help command - Show all available commands
 */
async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📋 명령어 목록')
        .setColor(0x5865F2)
        .setDescription('사용 가능한 모든 슬래시 명령어입니다.')
        .addFields(
            {
                name: '🏓 /ping (핑)',
                value: '서버 및 디스코드 핑 측정',
                inline: false
            },
            {
                name: '📋 /help (도움말)',
                value: '사용 가능한 모든 명령어 보기',
                inline: false
            },
            {
                name: '🔍 /dict (검색) `<검색어>`',
                value: '단어 검색 (정규표현식 지원)\n예: `/dict 사과`, `/dict ^사.*과$`',
                inline: false
            },
            {
                name: '🔤 /char (글자) `<글자>` `<위치>`',
                value: '특정 글자로 시작/끝나는 단어 검색\n예: `/char 가 시작`, `/char 다 끝`',
                inline: false
            },
            {
                name: '📖 /meaning (뜻) `<단어>`',
                value: '단어 뜻 검색 (품사, 주제 포함)\n예: `/meaning 사과`',
                inline: false
            },
            {
                name: '📊 /record (전적) `[유저]`',
                value: '유저 전적 조회\n비우면 자신의 전적 (오프라인 가능)\n유저 지정 시 온라인 유저만 조회 가능\n예: `/record`, `/record 별명`',
                inline: false
            },
            {
                name: '🎯 /mission (미션) `<미션글자>` `[주제]` `[타겟글자]` `[위치]`',
                value: '미션 글자가 가장 많이 들어간 단어 검색\n예: `/mission 가`, `/mission 가 LOL 나 시작`',
                inline: false
            },
            {
                name: '📂 /topic (주제) `<주제>`',
                value: '특정 주제의 가장 긴 단어 검색\n예: `/topic LOL`, `/topic 경제`',
                inline: false
            },
            {
                name: '🎲 /random (랜덤) `[개수]`',
                value: '랜덤 단어 뽑기 (최대 50개)\n예: `/random`, `/random 10`',
                inline: false
            },
            {
                name: '📢 /roommsg (방메시지) `<방번호>` `<메시지>`',
                value: '방에 관리자 공지 메시지 전송 (관리자 전용)\n예: `/roommsg 102 안녕하세요`',
                inline: false
            }
        )
        .setFooter({ text: '한국어 사용자는 괄호 안의 한국어 명령어도 사용할 수 있습니다' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

/**
 * Validate regex safety (safe-regex + additional checks for known bypasses)
 */
function isRegexSafe(pattern) {
    if (!safeRegex(pattern)) return false;

    // Count unescaped groups
    const groups = pattern.replace(/\\./g, '').match(/\(/g);
    if (groups && groups.length > MAX_REGEX_GROUPS) return false;

    // Count unescaped quantifiers
    const quantifiers = pattern.replace(/\\./g, '').match(/[*+]\??|\{\d+,?\d*\}/g);
    if (quantifiers && quantifiers.length > MAX_REGEX_QUANTIFIERS) return false;

    // Block nested quantifiers like (a+)+ or (a*){2,}
    if (/(\([^)]*[*+][^)]*\))[*+{]/.test(pattern.replace(/\\./g, ''))) return false;

    return true;
}

/**
 * /dict command - Word search with regex support
 */
async function handleDict(interaction) {
    const query = interaction.options.getString('query');

    if (!isRegexSafe(query)) {
        await interaction.reply({
            content: '❌ 위험한 정규표현식 패턴입니다. 더 간단한 패턴을 사용해주세요.',
            ephemeral: true
        });
        return;
    }

    await interaction.deferReply();

    try {
        let regex;
        try {
            regex = new RegExp(query);
        } catch (regexErr) {
            await interaction.editReply({ content: `❌ 잘못된 정규표현식: ${regexErr.message}` });
            return;
        }

        const lang = detectLanguage(query);
        const results = await searchWords(query, regex, lang);

        if (results.length === 0) {
            await interaction.editReply({ content: `🔍 "${query}"에 대한 검색 결과가 없습니다.` });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🔍 "${query}" 검색 결과`)
            .setColor(0x3498DB)
            .setDescription(results.map((w, i) => `${i + 1}. ${formatWord(w._id, w.flag, w.type)}`).join('\n'))
            .setFooter({ text: `총 ${results.length}개 결과` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Dict search error: ${err.message}`);
        await interaction.editReply({ content: `❌ 검색 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * Search words in database (with language detection)
 * SQL 서버사이드 필터링: 기존 SELECT * 풀스캔 → WHERE ~ $1 로 PG에서 직접 정규식 매칭
 */
function searchWords(query, regex, lang = 'ko') {
    return new Promise((resolve, reject) => {
        const dbLang = lang === 'en' ? 'en' : 'ko';
        if (!DB || !DB.kkutu || !DB.kkutu[dbLang]) {
            reject(new Error(`데이터베이스(${dbLang})가 준비되지 않았습니다.`));
            return;
        }

        // PostgreSQL ~ 연산자로 정규식 매칭, 정확 매치/접두사 우선 정렬
        var sql = "SELECT _id, flag, type FROM kkutu_" + dbLang
            + " WHERE _id ~ $1 AND _id NOT LIKE '% %'"
            + " ORDER BY"
            + " CASE WHEN _id = $2 THEN 0"
            + "      WHEN _id LIKE $3 THEN 1"
            + "      ELSE 2 END,"
            + " LENGTH(_id) DESC"
            + " LIMIT " + MAX_RESULTS;

        DB.kkutu[dbLang].direct(sql, [regex.source, query, query + '%'], function (err, res) {
            if (err) return reject(err);
            resolve(res && res.rows ? res.rows : []);
        });
    });
}

/**
 * /char command - Search by starting/ending character
 */
async function handleChar(interaction) {
    const char = interaction.options.getString('char');
    const position = interaction.options.getString('position');

    if (char.length !== 1 || !VALID_WORD_CHARS.test(char)) {
        await interaction.reply({ content: '❌ 올바른 글자 1자를 입력해주세요.', ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const lang = detectLanguage(char);
    try {
        const results = await searchByChar(char, position, lang);

        if (results.length === 0) {
            const posText = position === 'start' ? '시작하는' : '끝나는';
            await interaction.editReply({ content: `🔍 "${char}"(으)로 ${posText} 단어가 없습니다.` });
            return;
        }

        const posText = position === 'start' ? '시작하는' : '끝나는';
        const embed = new EmbedBuilder()
            .setTitle(`🔤 "${char}"(으)로 ${posText} 단어`)
            .setColor(0x9B59B6)
            .setDescription(results.map((w, i) => `${i + 1}. **${w._id}** (${w._id.length}자)`).join('\n'))
            .setFooter({ text: `총 ${results.length}개 결과` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Char search error: ${err.message}`);
        await interaction.editReply({ content: `❌ 검색 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * Search words by starting/ending character (with language detection)
 * SQL 서버사이드 필터링: 기존 SELECT * 풀스캔 → WHERE LIKE 로 PG에서 직접 필터링
 */
function searchByChar(char, position, lang = 'ko') {
    return new Promise((resolve, reject) => {
        const dbLang = lang === 'en' ? 'en' : 'ko';
        if (!DB || !DB.kkutu || !DB.kkutu[dbLang]) {
            reject(new Error(`데이터베이스(${dbLang})가 준비되지 않았습니다.`));
            return;
        }

        var likePattern = position === 'start' ? (char + '%') : ('%' + char);
        var sql = "SELECT _id, flag, type FROM kkutu_" + dbLang
            + " WHERE _id LIKE $1 AND _id NOT LIKE '% %'"
            + " ORDER BY LENGTH(_id) DESC"
            + " LIMIT " + MAX_RESULTS;

        DB.kkutu[dbLang].direct(sql, [likePattern], function (err, res) {
            if (err) return reject(err);
            resolve(res && res.rows ? res.rows : []);
        });
    });
}

/**
 * /define command - Look up word definition
 */
async function handleDefine(interaction) {
    const word = interaction.options.getString('word');

    if (!VALID_WORD_CHARS.test(word)) {
        await interaction.reply({ content: '❌ 올바른 단어를 입력해주세요.', ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const lang = detectLanguage(word);
    try {
        const result = await lookupWord(word, lang);

        if (!result) {
            await interaction.editReply({ content: `📖 "${word}" 단어를 찾을 수 없습니다.` });
            return;
        }

        const meaning = parseMeaning(result.mean);

        const embed = new EmbedBuilder()
            .setTitle(`📖 ${result._id}`)
            .setColor(0xF39C12);

        if (result.type) {
            embed.addFields({ name: '품사', value: getTypeDisplay(result.type), inline: true });
        }

        if (result.theme) {
            const themeDisplay = getThemeDisplay(result.theme);
            if (themeDisplay) {
                embed.addFields({ name: '주제', value: themeDisplay, inline: true });
            }
        }

        if (meaning) {
            embed.setDescription(meaning);
        } else {
            embed.setDescription('*뜻 정보가 없습니다.*');
        }

        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Define error: ${err.message}`);
        await interaction.editReply({ content: `❌ 검색 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * Wraps the DB .on() callback pattern with a timeout to prevent hanging Promises.
 */
function dbFindOne(table, key) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('DB 응답 시간 초과')), DB_TIMEOUT);
        table.findOne(key).on(function (result) {
            clearTimeout(timer);
            resolve(result);
        });
    });
}

/**
 * Look up a word in the database (with language detection)
 */
function lookupWord(word, lang = 'ko') {
    const dbLang = lang === 'en' ? 'en' : 'ko';
    if (!DB || !DB.kkutu || !DB.kkutu[dbLang]) {
        return Promise.reject(new Error(`데이터베이스(${dbLang})가 준비되지 않았습니다.`));
    }
    return dbFindOne(DB.kkutu[dbLang], ['_id', word]);
}

/**
 * /record command - Look up user game records
 * - No argument: look up by discord__<discordId> in DB (works offline)
 * - With argument: search online users (DIC) by nickname or account ID
 */
async function handleRecord(interaction) {
    const userQuery = interaction.options.getString('user');
    const discordUser = interaction.user;

    await interaction.deferReply();

    try {
        let userData;
        let displayName;

        if (userQuery) {
            let found = null;

            if (_queryOnlineUser) {
                // Separate process mode: proxy query to master
                found = await _queryOnlineUser(userQuery);
            } else if (DIC) {
                // Same process mode: direct DIC access
                for (const id in DIC) {
                    const client = DIC[id];
                    if (!client) continue;
                    if (id === userQuery) {
                        found = { profile: client.profile, data: client.data };
                        break;
                    }
                    const title = client.profile && client.profile.title;
                    const name = client.profile && client.profile.name;
                    if ((title && title === userQuery) || (name && name === userQuery)) {
                        found = { profile: client.profile, data: client.data };
                        break;
                    }
                }
            }

            if (!found) {
                await interaction.editReply({ content: '❌ 해당 유저가 없거나 오프라인이에요.' });
                return;
            }

            displayName = (found.profile && found.profile.title) || (found.profile && found.profile.name) || userQuery;
            userData = found.data || {};
        } else {
            // No argument: look up own record by Discord ID in DB
            const kkutuId = `discord-${discordUser.id}`;

            if (!DB || !DB.users) throw new Error('데이터베이스가 준비되지 않았습니다.');
            userData = await dbFindOne(DB.users, ['_id', kkutuId]);

            if (!userData) {
                await interaction.editReply({ content: '❌ 디스코드 계정과 연동되어있지 않아요. 디스코드 계정으로 로그인을 하면 자신의 전적을 볼 수 있어요.' });
                return;
            }

            displayName = userData.nick || userData.idt || discordUser.displayName || discordUser.username;
            userData = userData.kkutu || {};
        }

        const record = userData.record || {};

        // Calculate total stats
        let totalPlays = 0, totalWins = 0, totalScore = 0;
        const modeStats = [];

        for (const mode in record) {
            const rec = record[mode];
            if (!rec || !Array.isArray(rec)) continue;

            const plays = rec[0] || 0;
            const wins = rec[1] || 0;
            const score = rec[2] || 0;

            totalPlays += plays;
            totalWins += wins;
            totalScore += score;

            if (plays > 0 || score > 0) {
                // Get localized mode name
                const modeKey = `mode${mode}`;
                const modeName = (LANG.kkutu && LANG.kkutu[modeKey]) || mode;

                modeStats.push({
                    mode: modeName,
                    plays,
                    wins,
                    score,
                    winRate: plays > 0 ? ((wins / plays) * 100).toFixed(1) : '0.0'
                });
            }
        }

        // Sort by score descending
        modeStats.sort((a, b) => b.score - a.score);

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${displayName}님의 전적`)
            .setColor(0x9B59B6);

        // Total stats
        const overallWinRate = totalPlays > 0 ? ((totalWins / totalPlays) * 100).toFixed(1) : '0.0';
        const totalScoreDisplay = (userData.score || 0).toLocaleString();
        embed.addFields(
            { name: '총 점수', value: totalScoreDisplay + '점', inline: true },
            { name: '전체 전적', value: `${totalPlays}전 ${totalWins}승 (${overallWinRate}%)`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true }
        );

        // Mode-by-mode stats (top 10)
        if (modeStats.length > 0) {
            const modeLines = modeStats.slice(0, 10).map((m, i) =>
                `**${i + 1}. ${m.mode}**: ${m.score.toLocaleString()}점 (${m.plays}전 ${m.wins}승, ${m.winRate}%)`
            );
            embed.addFields({ name: '게임모드별 전적 (점수순)', value: modeLines.join('\n') || '없음' });
        } else {
            embed.addFields({ name: '게임모드별 전적', value: '전적이 없습니다.' });
        }

        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Record error: ${err.message}`);
        await interaction.editReply({ content: `❌ 전적 조회 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * /mission command - Find words with most occurrences of a mission character
 */
async function handleMission(interaction) {
    const missionChar = interaction.options.getString('mission_char');
    const topic = interaction.options.getString('topic');
    const targetChar = interaction.options.getString('target_char');
    const position = interaction.options.getString('position') || 'start';

    if (!missionChar || missionChar.length !== 1 || !VALID_WORD_CHARS.test(missionChar)) {
        await interaction.reply({ content: '❌ 올바른 미션 글자 1자를 입력해주세요.', ephemeral: true });
        return;
    }

    if (targetChar && (targetChar.length !== 1 || !VALID_WORD_CHARS.test(targetChar))) {
        await interaction.reply({ content: '❌ 올바른 타겟 글자 1자를 입력해주세요.', ephemeral: true });
        return;
    }

    if (topic && !Const.KO_IJP.includes(topic)) {
        await interaction.reply({ content: '❌ 유효하지 않은 주제입니다. 자동완성 목록에서 선택해주세요.', ephemeral: true });
        return;
    }

    await interaction.deferReply();

    try {
        if (!DB || !DB.kkutu || !DB.kkutu['ko']) {
            await interaction.editReply({ content: '❌ 데이터베이스가 준비되지 않았습니다.' });
            return;
        }

        const conditions = ["_id NOT LIKE '% %'"];
        const params = [];
        let paramIndex = 1;

        if (targetChar) {
            if (position === 'end') {
                conditions.push(`_id LIKE $${paramIndex}`);
                params.push(`%${targetChar}`);
            } else {
                conditions.push(`_id LIKE $${paramIndex}`);
                params.push(`${targetChar}%`);
            }
            paramIndex++;
        }

        if (topic) {
            conditions.push(`theme ~ $${paramIndex}`);
            params.push(`(^|,)${topic}($|,)`);
            paramIndex++;
        }

        params.push(missionChar);
        const missionParamIndex = paramIndex;

        const whereClause = conditions.join(' AND ');
        const sql = `SELECT _id, flag, type FROM kkutu_ko WHERE ${whereClause} ORDER BY (LENGTH(_id) - LENGTH(REPLACE(_id, $${missionParamIndex}, ''))) DESC, LENGTH(_id) DESC LIMIT ${MAX_RESULTS}`;

        const results = await new Promise((resolve, reject) => {
            DB.kkutu['ko'].direct(sql, params, function (err, res) {
                if (err) return reject(err);
                resolve(res && res.rows ? res.rows : []);
            });
        });

        if (results.length === 0) {
            const descParts = [`미션 "${missionChar}"`];
            if (targetChar) descParts.push(`"${targetChar}"(으)로 ${position === 'end' ? '끝나는' : '시작하는'}`);
            if (topic) descParts.push(`주제: ${getIjpName(topic)}`);
            await interaction.editReply({ content: `🔍 ${descParts.join(' / ')} 조건에 맞는 단어가 없습니다.` });
            return;
        }

        const escapedChar = missionChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const missionRegex = new RegExp(escapedChar, 'g');
        const resultLines = results.map((w, i) => {
            const count = (w._id.match(missionRegex) || []).length;
            return `${i + 1}. ${formatWord(w._id, w.flag, w.type)} (${w._id.length}자, 미션 ${count}개)`;
        });

        const titleParts = [];
        if (targetChar) titleParts.push(`${position === 'end' ? '끝' : '시작'} 글자: ${targetChar}`);
        if (topic) titleParts.push(`주제: ${getIjpName(topic)}`);

        const embed = new EmbedBuilder()
            .setTitle(`🎯 미션 "${missionChar}" 검색 결과`)
            .setColor(0xE91E63)
            .setDescription(
                (titleParts.length > 0 ? titleParts.join(' | ') + '\n\n' : '') +
                resultLines.join('\n')
            )
            .setFooter({ text: `총 ${results.length}개 결과` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Mission search error: ${err.message}`);
        await interaction.editReply({ content: `❌ 검색 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * /topic command - Find longest words belonging to a topic
 */
async function handleTopic(interaction) {
    const topic = interaction.options.getString('topic');

    if (!Const.KO_IJP.includes(topic)) {
        await interaction.reply({ content: '❌ 유효하지 않은 주제입니다. 자동완성 목록에서 선택해주세요.', ephemeral: true });
        return;
    }

    await interaction.deferReply();

    try {
        if (!DB || !DB.kkutu || !DB.kkutu['ko']) {
            await interaction.editReply({ content: '❌ 데이터베이스가 준비되지 않았습니다.' });
            return;
        }

        const sql = `SELECT _id FROM kkutu_ko WHERE theme ~ $1 AND _id NOT LIKE '% %' ORDER BY LENGTH(_id) DESC LIMIT ${MAX_RESULTS}`;

        const results = await new Promise((resolve, reject) => {
            DB.kkutu['ko'].direct(sql, [`(^|,)${topic}($|,)`], function (err, res) {
                if (err) return reject(err);
                resolve(res && res.rows ? res.rows : []);
            });
        });

        const topicName = getIjpName(topic);

        if (results.length === 0) {
            await interaction.editReply({ content: `🔍 주제 "${topicName}" (${topic})에 해당하는 단어가 없습니다.` });
            return;
        }

        const resultLines = results.map((w, i) =>
            `${i + 1}. **${w._id}** (${w._id.length}자)`
        );

        const embed = new EmbedBuilder()
            .setTitle(`📂 주제: ${topicName} (${topic})`)
            .setColor(0x2ECC71)
            .setDescription(resultLines.join('\n'))
            .setFooter({ text: `총 ${results.length}개 결과 (길이순)` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Topic search error: ${err.message}`);
        await interaction.editReply({ content: `❌ 검색 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * /random command - Get random words from dictionary
 */
async function handleRandom(interaction) {
    const count = interaction.options.getInteger('count') || 1;
    const safeCount = Math.max(1, Math.min(count, MAX_RANDOM_COUNT));

    await interaction.deferReply();

    try {
        if (!DB || !DB.kkutu || !DB.kkutu['ko']) {
            await interaction.editReply({ content: '❌ 데이터베이스가 준비되지 않았습니다.' });
            return;
        }

        const sql = `SELECT _id, mean FROM kkutu_ko WHERE _id NOT LIKE '% %' ORDER BY RANDOM() LIMIT ${safeCount}`;

        const results = await new Promise((resolve, reject) => {
            DB.kkutu['ko'].direct(sql, function (err, res) {
                if (err) return reject(err);
                resolve(res && res.rows ? res.rows : []);
            });
        });

        if (results.length === 0) {
            await interaction.editReply({ content: '🔍 단어를 찾을 수 없습니다.' });
            return;
        }

        const resultLines = results.map((w, i) => {
            const meaning = parseMeaning(w.mean);
            const shortMeaning = meaning
                ? meaning.split('\n')[0].substring(0, 80)
                : '*뜻 없음*';
            return `${i + 1}. **${w._id}** - ${shortMeaning}`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`🎲 랜덤 단어 ${results.length}개`)
            .setColor(0xF39C12)
            .setDescription(resultLines.join('\n'))
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        JLog.error(`[Discord Bot] Random search error: ${err.message}`);
        await interaction.editReply({ content: `❌ 검색 중 오류가 발생했습니다: ${err.message}` });
    }
}

/**
 * /roommsg command - Send admin notice to a room (admin only)
 */
async function handleRoomMsg(interaction) {
    var discordId = 'discord-' + interaction.user.id;
    if (ADMIN.indexOf(discordId) === -1) {
        await interaction.reply({ content: '❌ 관리자만 사용할 수 있는 명령어입니다.', ephemeral: true });
        return;
    }

    var rid = interaction.options.getInteger('room');
    var message = interaction.options.getString('message');

    if (_sendRoomMsg) {
        // Separate process mode: proxy to master
        const result = await _sendRoomMsg(rid, message);
        if (!result || !result.exists) {
            await interaction.reply({ content: `❌ ${rid}번 방을 찾을 수 없습니다.`, ephemeral: true });
            return;
        }
        JLog.info(`[Discord Bot] roommsg to room ${rid} by ${discordId}: ${message}`);
        await interaction.reply({ content: `✅ ${rid}번 방에 메시지를 보냈습니다. (${result.sent}명에게 전달)`, ephemeral: true });
        return;
    }

    // Same process mode: direct DIC/ROOM access
    if (!ROOM || !ROOM[rid]) {
        await interaction.reply({ content: `❌ ${rid}번 방을 찾을 수 없습니다.`, ephemeral: true });
        return;
    }

    var r = JSON.stringify({ type: "chat", value: message, notice: true, profile: { title: "관리자" } });
    var sent = 0;
    for (var k in DIC) {
        if (DIC[k].place == rid && DIC[k].socket && DIC[k].socket.readyState == 1) {
            DIC[k].socket.send(r);
            sent++;
        }
    }

    JLog.info(`[Discord Bot] roommsg to room ${rid} by ${discordId}: ${message}`);
    await interaction.reply({ content: `✅ ${rid}번 방에 메시지를 보냈습니다. (${sent}명에게 전달)`, ephemeral: true });
}

// === 고빈도 알림 배칭 시스템 ===
// 유저 입퇴장, 방 입퇴장을 모아서 5초마다 한 번에 전송 (Discord API 부하 감소)
const _notifyQueue = { join: [], leave: [], roomJoin: [], roomLeave: [] };
const NOTIFY_FLUSH_DELAY = 5000;
var _notifyTimer = null;

function scheduleNotifyFlush() {
    if (_notifyTimer) return;
    _notifyTimer = setTimeout(flushNotifyQueue, NOTIFY_FLUSH_DELAY);
}

function flushNotifyQueue() {
    _notifyTimer = null;
    if (!isBotAvailable()) {
        _notifyQueue.join.forEach(function (e) { logToFile(`[유저입장] ${e.name} (현재 ${e.count}명)`); });
        _notifyQueue.leave.forEach(function (e) { logToFile(`[유저퇴장] ${e.name} (현재 ${e.count}명)`); });
        _notifyQueue.roomJoin.forEach(function (e) { logToFile(`[방입장] ${e.name} → ${e.roomId}번 방`); });
        _notifyQueue.roomLeave.forEach(function (e) { logToFile(`[방퇴장] ${e.name} ← ${e.roomId}번 방 (${e.reason})`); });
        _notifyQueue.join = [];
        _notifyQueue.leave = [];
        _notifyQueue.roomJoin = [];
        _notifyQueue.roomLeave = [];
        return;
    }

    // 유저 입퇴장 배칭
    if (_notifyQueue.join.length > 0 || _notifyQueue.leave.length > 0) {
        var lines = [];
        var lastCount = 0;
        _notifyQueue.join.forEach(function (e) {
            lines.push('\u{1F7E2} **' + e.name + '** 입장');
            lastCount = e.count;
        });
        _notifyQueue.leave.forEach(function (e) {
            lines.push('\u{1F534} **' + e.name + '** 퇴장');
            lastCount = e.count;
        });
        var desc = lines.join('\n') + '\n현재 **' + lastCount + '**명';
        safeExecute(async () => {
            var embed = new EmbedBuilder()
                .setColor(0x95A5A6)
                .setDescription(desc)
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }, 'notifyBatch-user');
        _notifyQueue.join = [];
        _notifyQueue.leave = [];
    }

    // 방 입퇴장 배칭
    if (_notifyQueue.roomJoin.length > 0 || _notifyQueue.roomLeave.length > 0) {
        var lines = [];
        _notifyQueue.roomJoin.forEach(function (e) {
            lines.push('\u{27A1}\u{FE0F} **' + e.name + '** \u{2192} ' + e.roomId + '번 방');
        });
        _notifyQueue.roomLeave.forEach(function (e) {
            var prefix;
            if (e.reason === 'kick') prefix = '\uD83D\uDEAB';       // 🚫 강퇴
            else if (e.reason === 'disconnect') prefix = '\uD83D\uDD0C'; // 🔌 소켓 단절
            else if (e.reason === 'timeout') prefix = '\u23F1\uFE0F';   // ⏱️ 타임아웃
            else if (e.reason === 'ghost') prefix = '\uD83D\uDC7B';     // 👻 유령 유저
            else if (e.reason === 'spam') prefix = '\uD83D\uDD07';      // 🔇 스팸 강퇴
            else prefix = '\u2B05\uFE0F';                               // ⬅️ 정상 퇴장
            lines.push(prefix + ' **' + e.name + '** \u2190 ' + e.roomId + '\uBC88 \uBC29');
        });
        safeExecute(async () => {
            var embed = new EmbedBuilder()
                .setColor(0x7F8C8D)
                .setDescription(lines.join('\n'))
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }, 'notifyBatch-room');
        _notifyQueue.roomJoin = [];
        _notifyQueue.roomLeave = [];
    }
}

// Chat merge state: buffer messages per location, flush after 2s idle with debounce
const _chatMerge = {};
const CHAT_MERGE_DELAY = 2000; // 2초 동안 새 메시지 없으면 전송
const CHAT_MERGE_MAX = 20;     // 최대 20개 합침

/**
 * Flush a chat merge entry: send new or edit existing Discord message
 */
function flushChatEntry(entry, mergeKey) {
    const desc = `${entry.location}:\n${entry.lines.join('\n')}`;
    const truncated = desc.length > 4000 ? desc.substring(0, 4000) : desc;

    if (!isBotAvailable()) {
        logToFile(`[채팅|${entry.location}] ${entry.lines.join(' / ')}`);
        entry.lines = null;
        entry.discordMessage = null;
        if (mergeKey) delete _chatMerge[mergeKey];
        return;
    }

    if (entry.discordMessage) {
        // Already sent once - edit
        safeExecute(async () => {
            const embed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setDescription(truncated)
                .setTimestamp();
            await entry.discordMessage.edit({ embeds: [embed] });
        }, 'logChat-edit');
    } else {
        // First send
        safeExecute(async () => {
            const embed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setDescription(truncated)
                .setTimestamp();
            const sent = await channel.send({ embeds: [embed] });
            // 메모리 누수 방지: sent 참조를 저장하지 않음 (이미 flush 완료)
        }, 'logChat-send');
    }
    // 메모리 누수 방지: flush 완료 후 엔트리 삭제
    entry.lines = null;
    entry.discordMessage = null;
    if (mergeKey) delete _chatMerge[mergeKey];
}

/**
 * Log chat message - called when users or bots send chat messages
 * Buffers messages per location, flushes after 2s of inactivity
 * @param {object} profile - User profile
 * @param {string} message - Chat message
 * @param {number|string} place - Location (0 = lobby, number = room ID)
 * @param {boolean} isRobot - Whether the sender is a bot
 */
exports.logChat = function (profile, message, place, isRobot = false) {
    const name = getDisplayName(profile);
    const location = place === 0 || place === '0' ? '로비' : `${place}번 방`;
    const senderType = isRobot ? '[봇]' : '';
    const line = `${senderType}**${name}**: ${message}`;

    if (!isBotAvailable()) {
        logToFile(`[채팅|${location}] ${senderType}${name}: ${message}`);
        return;
    }

    const now = Date.now();
    const mergeKey = `place_${place}`;
    const prev = _chatMerge[mergeKey];

    if (prev && prev.lines && (now - prev.time) < CHAT_MERGE_DELAY && prev.lines.length < CHAT_MERGE_MAX) {
        // Append to existing buffer
        prev.lines.push(line);
        prev.time = now;

        // Reset debounce timer
        clearTimeout(prev.timer);
        prev.timer = setTimeout(function () { flushChatEntry(prev, mergeKey); }, CHAT_MERGE_DELAY);
    } else {
        // New buffer entry
        if (prev && prev.timer) clearTimeout(prev.timer);

        const entry = {
            lines: [line],
            time: now,
            discordMessage: null,
            location: location,
            timer: null
        };
        _chatMerge[mergeKey] = entry;

        // Flush after delay
        entry.timer = setTimeout(function () { flushChatEntry(entry, mergeKey); }, CHAT_MERGE_DELAY);
    }
};

/**
 * Log a whisper - called when a user sends a whisper
 * Sent immediately (not merged) since whispers are moderation-sensitive.
 * @param {object} profile - Sender profile
 * @param {string} message - Whisper content
 * @param {string} targets - Comma-separated recipient nicknames as typed by the sender
 */
exports.logWhisper = function (profile, message, targets) {
    const name = getDisplayName(profile);

    if (!isBotAvailable()) {
        logToFile(`[귓속말] ${name} → ${targets}: ${message}`);
        return;
    }

    safeExecute(async () => {
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(`\u{1F512} **${name}** → ${targets}: ${message}`)
            .setTimestamp();
        await channel.send({ embeds: [embed] });
    }, 'logWhisper');
};

/**
 * Log a user report - sends a short notice to the general log channel,
 * then forwards a link to that message plus the reason/detail to the dedicated report channel.
 */
exports.logReport = function (reporterProfile, reporterGuest, targetProfile, targetGuest, targetId, reasonCode, detail) {
    const reporterName = getDisplayName(reporterProfile) + (reporterGuest ? ' (손님)' : '');
    const targetName = getDisplayName(targetProfile) + (targetGuest ? ' (손님)' : '');
    const reasonLabel = Const.REPORT_REASON_LABELS[reasonCode] || Const.REPORT_REASON_LABELS[6];

    if (!isBotAvailable()) {
        logToFile(`[신고] ${reporterName} → ${targetName} (${reasonLabel}): ${detail}`);
        return;
    }

    safeExecute(async () => {
        const logEmbed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setDescription(`\u{1F6A8} **${reporterName}**님이 **${targetName}**(${targetId})님을 신고했습니다.`)
            .setTimestamp();
        const sentMsg = await channel.send({ embeds: [logEmbed] });

        if (!reportChannel) return;

        const reportEmbed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setDescription(`[${reporterName} → ${targetName} 신고 로그](${sentMsg.url})`)
            .addFields(
                { name: '사유', value: reasonLabel },
                { name: '상세 내용', value: detail || '(작성 안 함)' }
            )
            .setTimestamp();
        await reportChannel.send({ embeds: [reportEmbed] });
    }, 'logReport');
};

/**
 * Notify user join - only if enabled
 */
exports.notifyUserJoin = function (profile, userCount) {
    if (!isBotAvailable()) {
        logToFile(`[유저입장] ${getDisplayName(profile)} (현재 ${userCount}명)`);
        return;
    }
    if (userCount <= 10) {
        safeExecute(async () => {
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setDescription('\u{1F7E2} **' + getDisplayName(profile) + '** 입장\n현재 **' + userCount + '**명')
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }, 'notifyUserJoin-instant');
        return;
    }
    _notifyQueue.join.push({ name: getDisplayName(profile), count: userCount });
    scheduleNotifyFlush();
};

/**
 * Notify user leave - only if enabled
 */
exports.notifyUserLeave = function (profile, userCount) {
    if (!isBotAvailable()) {
        logToFile(`[유저퇴장] ${getDisplayName(profile)} (현재 ${userCount}명)`);
        return;
    }
    if (userCount <= 10) {
        safeExecute(async () => {
            const embed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription('\u{1F534} **' + getDisplayName(profile) + '** 퇴장\n현재 **' + userCount + '**명')
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }, 'notifyUserLeave-instant');
        return;
    }
    _notifyQueue.leave.push({ name: getDisplayName(profile), count: userCount });
    scheduleNotifyFlush();
};

/**
 * Notify room creation - only if enabled
 * @param {number} roomId - Room ID
 * @param {object} room - Room data (title, password, limit, mode, opts, etc.)
 */
exports.notifyRoomCreate = function (roomId, room, realPassword) {

    if (!isBotAvailable()) {
        logToFile(`[방생성] ${roomId}번 방: ${room && room.title || '(없음)'}`);
        return;
    }

    safeExecute(async () => {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`🚪 ${roomId}번 방이 생겼어요`);

        if (room) {
            const modeName = getModeName(room.mode);
            const passwordDisplay = realPassword ? `||${realPassword}||` : '없음';

            // Build active special rules list
            const rule = Const.getRule(room.mode);
            const activeOpts = [];
            if (rule && rule.opts && room.opts) {
                for (const optKey of rule.opts) {
                    if (optKey === 'ijp' || optKey === 'qij') continue;
                    const k = Const.OPTIONS[optKey] ? Const.OPTIONS[optKey].name.toLowerCase() : optKey;
                    if (room.opts[k]) {
                        activeOpts.push(getOptionName(optKey));
                    }
                }
            }

            embed.addFields(
                { name: '방 이름', value: room.title || '(없음)', inline: true },
                { name: '비밀번호', value: passwordDisplay, inline: true },
                { name: '인원', value: `${room.limit}명`, inline: true },
                { name: '게임 모드', value: modeName, inline: true },
                { name: '라운드 / 시간', value: `${room.round}라운드 / ${room.time}초`, inline: true },
                { name: '특수 규칙', value: activeOpts.length > 0 ? activeOpts.join(', ') : '없음', inline: false }
            );

            // Show injpick (어인정 주제) if present
            if (room.opts && room.opts.injpick && room.opts.injpick.length > 0) {
                const ijpNames = room.opts.injpick.map(getIjpName);
                embed.addFields({ name: '어인정 주제', value: ijpNames.join(', '), inline: false });
            }

            // Show quizpick (퀴즈 주제) if present
            if (room.opts && room.opts.quizpick && room.opts.quizpick.length > 0) {
                const qijNames = room.opts.quizpick.map(getIjpName);
                embed.addFields({ name: '퀴즈 주제', value: qijNames.join(', '), inline: false });
            }
        }

        embed.setTimestamp();
        await channel.send({ embeds: [embed] });
    }, 'notifyRoomCreate');
};

/**
 * Notify room deletion - only if enabled
 */
exports.notifyRoomDelete = function (roomId) {

    if (!isBotAvailable()) {
        logToFile(`[방삭제] ${roomId}번 방`);
        return;
    }

    safeExecute(async () => {
        const embed = new EmbedBuilder()
            .setColor(0x95A5A6)
            .setDescription(`🚪 **${roomId}**번 방이 사라졌어요`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyRoomDelete');
};

/**
 * Notify game start - only if enabled
 */
exports.notifyGameStart = function (roomId) {

    if (!isBotAvailable()) {
        logToFile(`[게임시작] ${roomId}번 방`);
        return;
    }

    safeExecute(async () => {
        const embed = new EmbedBuilder()
            .setColor(0xE91E63)
            .setDescription(`🎮 **${roomId}**번 방에서 게임이 시작됐어요`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyGameStart');
};

/**
 * Notify round end with word chain - only if enabled
 * @param {number} roomId - Room ID
 * @param {Array} chainLog - Array of {word, player} or {player, event} objects
 * @param {number} round - Current round number
 * @param {number} totalRounds - Total number of rounds
 */
exports.notifyRoundEnd = function (roomId, chainLog, round, totalRounds) {
    if (!chainLog || !Array.isArray(chainLog) || chainLog.length === 0) return;

    if (!isBotAvailable()) {
        const roundText = (round && totalRounds) ? ` (${round}/${totalRounds})` : '';
        const chainStr = chainLog.map(function (entry) {
            if (entry.event === 'timeout') return `${entry.player} 입력 실패`;
            if (entry.event === 'ko') return `${entry.player} KO`;
            return `${entry.player}: ${entry.word}`;
        }).join(' > ');
        logToFile(`[라운드종료] ${roomId}번 방${roundText} ${chainStr}`);
        return;
    }

    safeExecute(async () => {
        // Format chain: words show as "player: word", events show as "player 입력 실패" or "player KO"
        var wordCount = 0;
        const entries = chainLog.map(function (entry) {
            if (entry.event === 'timeout') return `**${entry.player}** 입력 실패`;
            if (entry.event === 'ko') return `**${entry.player}** KO`;
            wordCount++;
            return `**${entry.player}**: ${entry.word}`;
        });

        // 1800자를 넘으면 잘라내지 않고 단어(체인 항목) 단위로 여러 메시지로 나눠 보낸다.
        const MAX_CHUNK_LEN = 1800;
        const SEP = ' > ';
        const chunks = [];
        let current = '';
        for (const entry of entries) {
            const piece = current ? SEP + entry : entry;
            if (current && (current.length + piece.length) > MAX_CHUNK_LEN) {
                chunks.push(current);
                current = entry;
            } else {
                current += piece;
            }
        }
        if (current) chunks.push(current);

        const roundText = (round && totalRounds)
            ? ` (${round}/${totalRounds})`
            : '';

        for (let i = 0; i < chunks.length; i++) {
            const partText = chunks.length > 1 ? ` [${i + 1}/${chunks.length}]` : '';
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle(`📝 ${roomId}번 방 라운드 종료${roundText}${partText}`)
                .setDescription(chunks[i])
                .setTimestamp();
            if (i === chunks.length - 1) {
                embed.setFooter({ text: `총 ${wordCount}개 단어` });
            }
            await channel.send({ embeds: [embed] });
        }
    }, 'notifyRoundEnd');
};

/**
 * Notify quiz/jaqwi round end with answer and player results
 * @param {number} roomId - Room ID
 * @param {object} data - { answer, winners, missed, giveup, round, totalRounds }
 */
exports.notifyQuizRoundEnd = function (roomId, data) {
    if (!data) return;

    if (!isBotAvailable()) {
        const { answer, winners, missed, giveup, round, totalRounds } = data;
        const roundText = (round && totalRounds) ? ` (${round}/${totalRounds})` : '';
        const parts = [`정답: ${answer}`];
        if (winners && winners.length > 0) parts.push(`맞힘: ${winners.join(', ')}`);
        if (missed && missed.length > 0) parts.push(`못맞힘: ${missed.join(', ')}`);
        if (giveup && giveup.length > 0) parts.push(`포기: ${giveup.join(', ')}`);
        logToFile(`[퀴즈라운드종료] ${roomId}번 방${roundText} ${parts.join(' | ')}`);
        return;
    }

    safeExecute(async () => {
        const { answer, winners, missed, giveup, round, totalRounds } = data;
        const roundText = (round && totalRounds) ? ` (${round}/${totalRounds})` : '';

        const lines = [];
        lines.push(`**정답: ${answer}**`);

        if (winners && winners.length > 0) {
            lines.push('');
            lines.push('✅ **맞힌 사람**');
            winners.forEach(function (name, i) { lines.push(`${i + 1}. ${name}`); });
        }

        if (missed && missed.length > 0) {
            lines.push('');
            lines.push('❌ **맞히지 못한 사람**');
            missed.forEach(function (name) { lines.push(`• ${name}`); });
        }

        if (giveup && giveup.length > 0) {
            lines.push('');
            lines.push('🏳️ **포기한 사람**');
            giveup.forEach(function (name) { lines.push(`• ${name}`); });
        }

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`📝 ${roomId}번 방 라운드 종료${roundText}`)
            .setDescription(lines.join('\n'))
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyQuizRoundEnd');
};

/**
 * Notify game over with score rankings
 * @param {number} roomId - Room ID
 * @param {Array} rankings - Array of {name, score, rank, robot} sorted by score
 */
exports.notifyGameOver = function (roomId, rankings) {

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) return;

    if (!isBotAvailable()) {
        const lines = rankings.map(function (r) {
            const score = (typeof r.score === 'number') ? r.score : 0;
            return `${r.rank + 1}위 ${r.name}${r.robot ? '(봇)' : ''}: ${score}점`;
        });
        logToFile(`[게임종료] ${roomId}번 방 ${lines.join(', ')}`);
        return;
    }

    safeExecute(async () => {
        const medals = ['🥇', '🥈', '🥉'];
        const lines = rankings.map(function (r, i) {
            const medal = medals[r.rank] || `**${r.rank + 1}.**`;
            const bot = r.robot ? ' 🤖' : '';
            const score = (typeof r.score === 'number') ? r.score : 0;
            return `${medal} ${r.name}${bot}: ${score.toLocaleString()}점`;
        });

        const embed = new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle(`🏆 ${roomId}번 방 게임 종료`)
            .setDescription(lines.join('\n'))
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyGameOver');
};

/**
 * Get game mode name from mode index using ko_KR.json localization
 */
function getModeName(modeIndex) {
    const modeKey = Const.GAME_TYPE[modeIndex];
    if (!modeKey) return `모드 ${modeIndex}`;
    const langKey = `mode${modeKey}`;
    if (LANG.kkutu && LANG.kkutu[langKey]) return LANG.kkutu[langKey];
    return modeKey;
}

/**
 * Get option display name from option key using ko_KR.json localization
 */
function getOptionName(optKey) {
    const opt = Const.OPTIONS[optKey];
    if (!opt) return optKey;
    const langKey = `opt${opt.name}`;
    if (LANG.kkutu && LANG.kkutu[langKey]) return LANG.kkutu[langKey];
    return opt.name;
}

/**
 * Get injpick/quizpick theme name from code
 */
function getIjpName(code) {
    // Try theme_CODE
    const themeKey = `theme_${code}`;
    if (LANG.kkutu && LANG.kkutu[themeKey]) return LANG.kkutu[themeKey];
    // Try quiz_CODE
    const quizKey = `quiz_${code}`;
    if (LANG.kkutu && LANG.kkutu[quizKey]) return LANG.kkutu[quizKey];
    return code;
}

/**
 * Notify room settings change - called when room master changes room settings
 * @param {number} roomId - Room ID
 * @param {object} room - Room data (title, password, limit, mode, opts, etc.)
 */
exports.notifyRoomSettings = function (roomId, room) {
    if (!isBotAvailable()) {
        logToFile(`[방설정변경] ${roomId}번 방: ${room && room.title || '(없음)'}`);
        return;
    }

    safeExecute(async () => {
        const modeName = getModeName(room.mode);
        const passwordDisplay = room.password ? `||${room.password}||` : '없음';

        // Build active special rules list
        const rule = Const.getRule(room.mode);
        const activeOpts = [];
        if (rule && rule.opts && room.opts) {
            for (const optKey of rule.opts) {
                if (optKey === 'ijp' || optKey === 'qij') continue; // Handled separately
                const k = Const.OPTIONS[optKey] ? Const.OPTIONS[optKey].name.toLowerCase() : optKey;
                if (room.opts[k]) {
                    activeOpts.push(getOptionName(optKey));
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`⚙️ ${roomId}번 방 설정 변경`)
            .addFields(
                { name: '방 이름', value: room.title || '(없음)', inline: true },
                { name: '비밀번호', value: passwordDisplay, inline: true },
                { name: '인원', value: `${room.limit}명`, inline: true },
                { name: '게임 모드', value: modeName, inline: true },
                { name: '라운드 / 시간', value: `${room.round}라운드 / ${room.time}초`, inline: true },
                { name: '특수 규칙', value: activeOpts.length > 0 ? activeOpts.join(', ') : '없음', inline: false }
            );

        // Show injpick (어인정 주제) if present
        if (room.opts && room.opts.injpick && room.opts.injpick.length > 0) {
            const ijpNames = room.opts.injpick.map(getIjpName);
            embed.addFields({ name: '어인정 주제', value: ijpNames.join(', '), inline: false });
        }

        // Show quizpick (퀴즈 주제) if present
        if (room.opts && room.opts.quizpick && room.opts.quizpick.length > 0) {
            const qijNames = room.opts.quizpick.map(getIjpName);
            embed.addFields({ name: '퀴즈 주제', value: qijNames.join(', '), inline: false });
        }

        embed.setTimestamp();
        await channel.send({ embeds: [embed] });
    }, 'notifyRoomSettings');
};

/**
 * Notify bot settings change - called when room master changes a bot's settings
 * @param {number} roomId - Room ID
 * @param {object} botInfo - Bot info { name, level, personality, preferredChar }
 */
exports.notifyBotSettings = function (roomId, botInfo) {
    if (!isBotAvailable()) {
        logToFile(`[봇설정변경] ${roomId}번 방: ${botInfo && botInfo.name}`);
        return;
    }

    safeExecute(async () => {
        const levelName = Const.BOT_LEVEL_NAMES[botInfo.level] || `레벨 ${botInfo.level}`;

        let personalityText = '보통';
        if (botInfo.personality !== undefined && botInfo.personality !== null) {
            if (botInfo.personality > 0.5) personalityText = '공격적';
            else if (botInfo.personality > 0) personalityText = '약간 공격적';
            else if (botInfo.personality < -0.5) personalityText = '수비적';
            else if (botInfo.personality < 0) personalityText = '약간 수비적';
            else personalityText = '보통';
        }

        const preferredCharText = botInfo.preferredChar || '없음';

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(`🤖 ${roomId}번 방 봇 설정 변경`)
            .setDescription(
                `**봇 이름**: ${botInfo.name}\n` +
                `**봇 레벨**: ${levelName}\n` +
                `**성향**: ${personalityText}\n` +
                `**선호 글자**: ${preferredCharText}`
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyBotSettings');
};

/**
 * Notify player joined a room (including bots)
 * @param {number} roomId - Room ID
 * @param {string} name - Player display name
 * @param {boolean} isRobot - Whether the player is a bot
 */
exports.notifyRoomJoin = function (roomId, name, isRobot) {
    if (!isBotAvailable()) {
        logToFile(`[방입장] ${name}${isRobot ? '(봇)' : ''} → ${roomId}번 방`);
        return;
    }
    _notifyQueue.roomJoin.push({ roomId: roomId, name: name + (isRobot ? ' \u{1F916}' : '') });
    scheduleNotifyFlush();
};

/**
 * Notify player left a room (including bots)
 * @param {number} roomId - Room ID
 * @param {string} name - Player display name
 * @param {boolean} isRobot - Whether the player is a bot
 * @param {string} [reason] - Leave reason: "normal", "kick", "disconnect", "timeout", "ghost", or "spam"
 */
exports.notifyRoomLeave = function (roomId, name, isRobot, reason) {
    if (!isBotAvailable()) {
        logToFile(`[방퇴장] ${name}${isRobot ? '(봇)' : ''} ← ${roomId}번 방 (${reason || 'abnormal'})`);
        return;
    }
    _notifyQueue.roomLeave.push({ roomId: roomId, name: name + (isRobot ? ' \u{1F916}' : ''), reason: reason || 'abnormal' });
    scheduleNotifyFlush();
};

/**
 * Get invite URL
 */
exports.getInviteUrl = function () {
    if (!client || !client.user) return null;
    return `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands`;
};

const SHUTDOWN_CHANNEL_ID = '1447978640913469521';

/**
 * Send shutdown notification and destroy client
 * @param {Error|null} err - Error object if crashed, null if planned maintenance
 * @returns {Promise<void>}
 */
exports.notifyShutdown = async function (err) {
    if (!client || !isReady) return;

    const reason = err
        ? `서버에 예기치 않은 오류가 생겨서`
        : `서버 점검으로 인해`;

    let message = `<@&1463396681646215392> ${reason} 서버가 종료됩니다. 이용에 불편을 드려서 죄송합니다.`;

    if (err) {
        message += `\n\n**오류 사유:**\n\`\`\`\n${err.toString()}\n\`\`\``;
    }

    const sendOp = async () => {
        const shutdownChannel = await client.channels.fetch(SHUTDOWN_CHANNEL_ID);
        if (shutdownChannel) await shutdownChannel.send(message);
    };

    try {
        await Promise.race([
            sendOp(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
    } catch (e) {
        JLog.error(`[Discord Bot] Failed to send shutdown notification: ${e.message}`);
    }
};
