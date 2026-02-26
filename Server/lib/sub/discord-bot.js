/**
 * Discord Bot Module for KKuTu
 * Handles event notifications and slash commands
 */

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const safeRegex = require('safe-regex');
const JLog = require('./jjlog');
const LANG = require('../Web/lang/ko_KR.json');
const Const = require('../const');

// Constants
const GUILD_ID = '1447976671805182086';
const CHANNEL_ID = '1469632601089245408';
const BOT_PERMISSIONS = '9193377795136';
const MAX_RESULTS = 20;
const MAX_REGEX_LENGTH = 100;
const MAX_RANDOM_COUNT = 50;

// State
let client = null;
let channel = null;
let DB = null;
let DIC = null;
let isReady = false;
let isEnabled = true;  // Can be disabled for test servers

/**
 * Safe wrapper for async operations
 */
async function safeExecute(operation, context = 'Unknown') {
    try {
        await operation();
    } catch (err) {
        JLog.error(`[Discord Bot] ERROR in ${context}: ${err.message}`);
        console.error(`[Discord Bot] ERROR in ${context}:`, err);
        try {
            if (channel && isReady) {
                await channel.send(`# 오류가 났어요!\n(${context}): ${err.message}`);
            }
        } catch (sendErr) {
            console.error('[Discord Bot] ERROR: Failed to send error message:', sendErr);
        }
    }
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

    DB = db;
    DIC = dic;

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

        client.on('disconnect', () => {
            JLog.warn('[Discord Bot] Disconnected, will attempt to reconnect...');
            isReady = false;
        });

        client.on('reconnecting', () => {
            JLog.info('[Discord Bot] Reconnecting...');
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

        await client.login(token);
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
            }
        )
        .setFooter({ text: '한국어 사용자는 괄호 안의 한국어 명령어도 사용할 수 있습니다' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

/**
 * /dict command - Word search with regex support
 */
async function handleDict(interaction) {
    const query = interaction.options.getString('query');

    if (!safeRegex(query)) {
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
            .setDescription(results.map((w, i) => `${i + 1}. **${w._id}**`).join('\n'))
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
 */
function searchWords(query, regex, lang = 'ko') {
    return new Promise((resolve, reject) => {
        const dbLang = lang === 'en' ? 'en' : 'ko';
        if (!DB || !DB.kkutu || !DB.kkutu[dbLang]) {
            reject(new Error(`데이터베이스(${dbLang})가 준비되지 않았습니다.`));
            return;
        }

        DB.kkutu[dbLang].find().on(function (words) {
            try {
                if (!words || !Array.isArray(words)) {
                    resolve([]);
                    return;
                }

                const startTime = Date.now();
                const timeoutMs = 5000;
                const filtered = [];

                for (const word of words) {
                    if (Date.now() - startTime > timeoutMs) {
                        JLog.warn('[Discord Bot] Word search timeout');
                        break;
                    }

                    // Skip words with spaces
                    if (word._id && word._id.includes(' ')) continue;

                    if (word._id && regex.test(word._id)) {
                        filtered.push(word);
                    }
                }

                filtered.sort((a, b) => {
                    const aId = a._id;
                    const bId = b._id;

                    const aExact = aId === query;
                    const bExact = bId === query;
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;

                    const aStarts = aId.startsWith(query);
                    const bStarts = bId.startsWith(query);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;

                    if (aStarts && bStarts) {
                        if (bId.length !== aId.length) return bId.length - aId.length;
                        return aId.localeCompare(bId, 'ko');
                    }

                    if (bId.length !== aId.length) return bId.length - aId.length;
                    return aId.localeCompare(bId, 'ko');
                });

                resolve(filtered.slice(0, MAX_RESULTS));
            } catch (err) {
                reject(err);
            }
        });
    });
}

/**
 * /char command - Search by starting/ending character
 */
async function handleChar(interaction) {
    const char = interaction.options.getString('char');
    const position = interaction.options.getString('position');

    if (char.length !== 1) {
        await interaction.reply({ content: '❌ 글자는 1자여야 합니다.', ephemeral: true });
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
 */
function searchByChar(char, position, lang = 'ko') {
    return new Promise((resolve, reject) => {
        const dbLang = lang === 'en' ? 'en' : 'ko';
        if (!DB || !DB.kkutu || !DB.kkutu[dbLang]) {
            reject(new Error(`데이터베이스(${dbLang})가 준비되지 않았습니다.`));
            return;
        }

        DB.kkutu[dbLang].find().on(function (words) {
            try {
                if (!words || !Array.isArray(words)) {
                    resolve([]);
                    return;
                }

                const filtered = words.filter(word => {
                    if (!word._id) return false;
                    // Skip words with spaces
                    if (word._id.includes(' ')) return false;
                    if (position === 'start') {
                        return word._id.charAt(0) === char;
                    } else {
                        return word._id.charAt(word._id.length - 1) === char;
                    }
                });

                filtered.sort((a, b) => {
                    if (b._id.length !== a._id.length) return b._id.length - a._id.length;
                    return a._id.localeCompare(b._id, 'ko');
                });

                resolve(filtered.slice(0, MAX_RESULTS));
            } catch (err) {
                reject(err);
            }
        });
    });
}

/**
 * /define command - Look up word definition
 */
async function handleDefine(interaction) {
    const word = interaction.options.getString('word');

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
 * Look up a word in the database (with language detection)
 */
function lookupWord(word, lang = 'ko') {
    return new Promise((resolve, reject) => {
        const dbLang = lang === 'en' ? 'en' : 'ko';
        if (!DB || !DB.kkutu || !DB.kkutu[dbLang]) {
            reject(new Error(`데이터베이스(${dbLang})가 준비되지 않았습니다.`));
            return;
        }

        DB.kkutu[dbLang].findOne(['_id', word]).on(function ($word) {
            resolve($word);
        });
    });
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
            // Argument provided: search online users by nickname or account ID
            if (!DIC) {
                await interaction.editReply({ content: '❌ 해당 유저가 없거나 오프라인이에요.' });
                return;
            }

            // Try direct ID match first, then nickname match
            let found = null;
            for (const id in DIC) {
                const client = DIC[id];
                if (!client) continue;

                // Match by account ID
                if (id === userQuery) {
                    found = client;
                    break;
                }

                // Match by nickname (profile.title or profile.name)
                const title = client.profile && client.profile.title;
                const name = client.profile && client.profile.name;
                if ((title && title === userQuery) || (name && name === userQuery)) {
                    found = client;
                    break;
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

            userData = await new Promise((resolve, reject) => {
                if (!DB || !DB.users) {
                    reject(new Error('데이터베이스가 준비되지 않았습니다.'));
                    return;
                }

                DB.users.findOne(['_id', kkutuId]).on(function ($user) {
                    resolve($user);
                });
            });

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

    if (!missionChar || missionChar.length !== 1) {
        await interaction.reply({ content: '❌ 미션 글자는 1자여야 합니다.', ephemeral: true });
        return;
    }

    if (targetChar && targetChar.length !== 1) {
        await interaction.reply({ content: '❌ 타겟 글자는 1자여야 합니다.', ephemeral: true });
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

        const safeMissionChar = missionChar.replace(/'/g, "''");
        const conditions = ["_id NOT LIKE '% %'"];

        if (targetChar) {
            const safeTargetChar = targetChar.replace(/'/g, "''");
            if (position === 'end') {
                conditions.push(`_id LIKE '%${safeTargetChar}'`);
            } else {
                conditions.push(`_id LIKE '${safeTargetChar}%'`);
            }
        }

        if (topic) {
            const safeTopic = topic.replace(/'/g, "''");
            conditions.push(`theme ~ '(^|,)${safeTopic}($|,)'`);
        }

        const whereClause = conditions.join(' AND ');
        const sql = `SELECT _id FROM kkutu_ko WHERE ${whereClause} ORDER BY (LENGTH(_id) - LENGTH(REPLACE(_id, '${safeMissionChar}', ''))) DESC, LENGTH(_id) DESC LIMIT ${MAX_RESULTS}`;

        const results = await new Promise((resolve, reject) => {
            DB.kkutu['ko'].direct(sql, function (err, res) {
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
            return `${i + 1}. **${w._id}** (${w._id.length}자, 미션 ${count}개)`;
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

        const safeTopic = topic.replace(/'/g, "''");
        const sql = `SELECT _id FROM kkutu_ko WHERE theme ~ '(^|,)${safeTopic}($|,)' AND _id NOT LIKE '% %' ORDER BY LENGTH(_id) DESC LIMIT ${MAX_RESULTS}`;

        const results = await new Promise((resolve, reject) => {
            DB.kkutu['ko'].direct(sql, function (err, res) {
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

        const sql = `SELECT _id, mean FROM kkutu_ko WHERE _id NOT LIKE '% %' OFFSET floor(random() * GREATEST(1, (SELECT reltuples::bigint - ${safeCount * 3} FROM pg_class WHERE relname = 'kkutu_ko'))) LIMIT ${safeCount * 3}`;

        let results = await new Promise((resolve, reject) => {
            DB.kkutu['ko'].direct(sql, function (err, res) {
                if (err) return reject(err);
                resolve(res && res.rows ? res.rows : []);
            });
        });
        // 셔플 후 요청 개수만큼 자르기
        for (var i = results.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = results[i]; results[i] = results[j]; results[j] = t;
        }
        results = results.slice(0, safeCount);

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

    if (!isEnabled || !isReady || !channel) return;

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
 * Notify user join - only if enabled
 */
exports.notifyUserJoin = function (profile, userCount) {
    if (!isEnabled || !isReady || !channel) return;

    safeExecute(async () => {
        const name = getDisplayName(profile);

        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setDescription(`**${name}**님이 서버에 들어왔어요\n현재 서버에는 **${userCount}**명이 있어요`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyUserJoin');
};

/**
 * Notify user leave - only if enabled
 */
exports.notifyUserLeave = function (profile, userCount) {
    if (!isEnabled || !isReady || !channel) return;

    safeExecute(async () => {
        const name = getDisplayName(profile);

        const embed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setDescription(`**${name}**님이 서버에서 나갔어요\n현재 서버에는 **${userCount}**명이 있어요`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyUserLeave');
};

/**
 * Notify room creation - only if enabled
 * @param {number} roomId - Room ID
 * @param {object} room - Room data (title, password, limit, mode, opts, etc.)
 */
exports.notifyRoomCreate = function (roomId, room) {

    if (!isEnabled || !isReady || !channel) return;

    safeExecute(async () => {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`🚪 ${roomId}번 방이 생겼어요`);

        if (room) {
            const modeName = getModeName(room.mode);
            const passwordDisplay = room.password ? `||${room.password}||` : '없음';

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

    if (!isEnabled || !isReady || !channel) return;

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

    if (!isEnabled || !isReady || !channel) return;

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
    if (!isEnabled || !isReady || !channel) return;
    if (!chainLog || !Array.isArray(chainLog) || chainLog.length === 0) return;

    safeExecute(async () => {
        // Format chain: words show as "player: word", events show as "player 입력 실패" or "player KO"
        var wordCount = 0;
        const chainStr = chainLog.map(function (entry) {
            if (entry.event === 'timeout') return `**${entry.player}** 입력 실패`;
            if (entry.event === 'ko') return `**${entry.player}** KO`;
            wordCount++;
            return `**${entry.player}**: ${entry.word}`;
        }).join(' > ');

        // Show tail (last 1000 chars) with ellipsis prefix if truncated
        const maxLen = 1000;
        const displayChain = chainStr.length > maxLen
            ? '...' + chainStr.substring(chainStr.length - maxLen)
            : chainStr;

        const roundText = (round && totalRounds)
            ? ` (${round}/${totalRounds})`
            : '';

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(`📝 ${roomId}번 방 라운드 종료${roundText}`)
            .setDescription(displayChain)
            .setFooter({ text: `총 ${wordCount}개 단어` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyRoundEnd');
};

/**
 * Notify game over with score rankings
 * @param {number} roomId - Room ID
 * @param {Array} rankings - Array of {name, score, rank, robot} sorted by score
 */
exports.notifyGameOver = function (roomId, rankings) {

    if (!isEnabled || !isReady || !channel) return;
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) return;

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
    if (!isEnabled || !isReady || !channel) return;

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
    if (!isEnabled || !isReady || !channel) return;

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
    if (!isEnabled || !isReady || !channel) return;

    safeExecute(async () => {
        const tag = isRobot ? ' 🤖' : '';
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setDescription(`➡️ **${name}**${tag}님이 **${roomId}**번 방에 입장했어요`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyRoomJoin');
};

/**
 * Notify player left a room (including bots)
 * @param {number} roomId - Room ID
 * @param {string} name - Player display name
 * @param {boolean} isRobot - Whether the player is a bot
 */
exports.notifyRoomLeave = function (roomId, name, isRobot) {
    if (!isEnabled || !isReady || !channel) return;

    safeExecute(async () => {
        const tag = isRobot ? ' 🤖' : '';
        const embed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setDescription(`⬅️ **${name}**${tag}님이 **${roomId}**번 방에서 나갔어요`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }, 'notifyRoomLeave');
};

/**
 * Get invite URL
 */
exports.getInviteUrl = function () {
    if (!client || !client.user) return null;
    return `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands`;
};
