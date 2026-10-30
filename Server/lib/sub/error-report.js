'use strict';

// 서버 오류(JLog.error, 크래시)와 Node 경고(process 'warning')를 디스코드 오류 로그 채널로 보낸다.
// 오류는 서버 주인을 멘션하고, 경고는 멘션하지 않는다. 게임 마스터/슬레이브, 웹 서버처럼
// 로그인된 디스코드 클라이언트가 없는 프로세스에서도 보낼 수 있도록 REST로 직접 전송한다.
// jjlog.js가 이 모듈을 불러오므로 jjlog를 다시 불러오면 순환 참조가 되어 console만 사용한다.

const Path = require('path');
const GLOBAL = require('./global.json');

const GUILD_ID = '1447976671805182086';
const ERROR_CHANNEL_ID = '1565020411186511982';
const MAX_CONTENT = 2000;
const ENABLED = !!(GLOBAL.BOT_ENABLED && GLOBAL.DISCORD_TOKEN);
const PROCESS_LABEL = [
    Path.basename(process.argv[1] || 'node'),
    process.env.KKUTU_PORT && `port ${process.env.KKUTU_PORT}`,
    process.env.WS_KEY && `web #${process.env.WS_KEY}`,
    `pid ${process.pid}`
].filter(Boolean).join(', ');

let rest = null;
let ownerIdPromise = null;
const pending = new Set();

// discord.js는 무거우므로 실제로 보낼 일이 생겼을 때만 불러온다.
function getRest() {
    if (!rest) {
        const { REST } = require('discord.js');
        rest = new REST({ version: '10' }).setToken(GLOBAL.DISCORD_TOKEN);
    }
    return rest;
}

function getOwnerId() {
    if (!ownerIdPromise) {
        const { Routes } = require('discord.js');
        ownerIdPromise = getRest().get(Routes.guild(GUILD_ID)).then(guild => guild.owner_id);
        ownerIdPromise.catch(() => { ownerIdPromise = null; });
    }
    return ownerIdPromise.catch(() => null);
}

function send(isError, log) {
    if (!ENABLED) return;
    const p = (isError ? getOwnerId() : Promise.resolve(null)).then(ownerId => {
        const { Routes } = require('discord.js');
        const mention = ownerId ? `<@${ownerId}> ` : '';
        const header = `${mention}${isError ? '🚨 **서버 오류**' : '⚠️ **서버 경고**'} (${PROCESS_LABEL}, ${new Date().toLocaleString()})`;
        const allowed_mentions = { parse: [], users: ownerId ? [ownerId] : [] };
        const content = `${header}\n\`\`\`\n${log.replace(/```/g, '`​``')}\n\`\`\``;

        if (content.length <= MAX_CONTENT) {
            return getRest().post(Routes.channelMessages(ERROR_CHANNEL_ID), { body: { content, allowed_mentions } });
        }
        // 2000자를 넘으면 잘리지 않도록 전체 로그를 파일로 첨부
        return getRest().post(Routes.channelMessages(ERROR_CHANNEL_ID), {
            body: { content: `${header}\n전체 로그는 첨부 파일을 확인하세요.`, allowed_mentions },
            files: [{ name: 'log.txt', data: Buffer.from(log) }]
        });
    }).catch(err => {
        console.error('[ErrorReport] 디스코드 전송 실패:', err);
    }).finally(() => {
        pending.delete(p);
    });
    pending.add(p);
}

/**
 * @param {string} text - 로그 메시지
 * @param {Error} [err] - 원인 오류. 없으면 호출 위치의 스택을 붙인다.
 */
exports.error = function (text, err) {
    const stack = (err && err.stack) ? `[오류 스택]\n${err.stack}` : `[호출 위치]\n${new Error().stack.split('\n').slice(3).join('\n')}`;
    send(true, `${text}\n\n${stack}`);
};

exports.warn = function (warning) {
    send(false, warning.stack || String(warning));
};

// 프로세스가 종료되기 전에 아직 보내는 중인 로그를 기다린다.
exports.flush = function (timeout) {
    if (!pending.size) return Promise.resolve();
    return Promise.race([
        Promise.allSettled([...pending]),
        new Promise(resolve => setTimeout(resolve, timeout))
    ]);
};

process.on('warning', exports.warn);
