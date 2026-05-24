'use strict';

const DiscordBot = require('./discord-bot');
const GLOBAL = require('./global.json');
const JLog = require('./jjlog');

// Pending IPC request map: reqId → resolve callback
const _pending = new Map();
let _reqId = 0;
const IPC_TIMEOUT = 10000;

function ipcRequest(type, data) {
    return new Promise(function (resolve) {
        const id = ++_reqId;
        _pending.set(id, resolve);
        setTimeout(function () {
            if (_pending.has(id)) {
                _pending.delete(id);
                resolve(null);
            }
        }, IPC_TIMEOUT);
        try {
            process.send(Object.assign({ type: type, _reqId: id }, data));
        } catch (e) {
            if (_pending.has(id)) {
                _pending.delete(id);
                resolve(null);
            }
        }
    });
}

const proxyCallbacks = {
    queryOnlineUser: function (query) {
        return ipcRequest('query-online-user', { query: query });
    },
    sendRoomMsg: function (roomId, message) {
        return ipcRequest('send-roommsg', { roomId: roomId, message: message });
    }
};

process.on('message', function (msg) {
    // Response to a proxied request from master
    if (msg._reqId !== undefined && _pending.has(msg._reqId)) {
        var cb = _pending.get(msg._reqId);
        _pending.delete(msg._reqId);
        cb(msg);
        return;
    }

    switch (msg.type) {
        case 'notify-user-join':
            DiscordBot.notifyUserJoin(msg.profile, msg.userCount);
            break;
        case 'notify-user-leave':
            DiscordBot.notifyUserLeave(msg.profile, msg.userCount);
            break;
        case 'notify-room-create':
            DiscordBot.notifyRoomCreate(msg.roomId, msg.room, msg.realPassword);
            break;
        case 'notify-room-delete':
            DiscordBot.notifyRoomDelete(msg.roomId);
            break;
        case 'notify-game-start':
            DiscordBot.notifyGameStart(msg.roomId);
            break;
        case 'notify-chat-log':
            DiscordBot.logChat(msg.profile, msg.message, msg.place, msg.isRobot);
            break;
        case 'notify-round-end':
            DiscordBot.notifyRoundEnd(msg.roomId, msg.chainLog, msg.round, msg.totalRounds);
            break;
        case 'notify-game-over':
            DiscordBot.notifyGameOver(msg.roomId, msg.rankings);
            break;
        case 'notify-room-settings':
            DiscordBot.notifyRoomSettings(msg.roomId, msg.room);
            break;
        case 'notify-bot-settings':
            DiscordBot.notifyBotSettings(msg.roomId, msg.botInfo);
            break;
        case 'notify-room-join':
            DiscordBot.notifyRoomJoin(msg.roomId, msg.name, msg.isRobot);
            break;
        case 'notify-room-leave':
            DiscordBot.notifyRoomLeave(msg.roomId, msg.name, msg.isRobot, msg.reason);
            break;
        case 'shutdown':
            var shutErr = msg.error ? new Error(msg.error) : null;
            DiscordBot.notifyShutdown(shutErr).finally(function () {
                try { process.send({ type: 'shutdown-done' }); } catch (e) {}
                setTimeout(function () { process.exit(0); }, 100);
            });
            break;
        default:
            JLog.warn('[Discord Process] Unknown IPC type: ' + msg.type);
    }
});

process.on('uncaughtException', function (err) {
    JLog.error('[Discord Process] Uncaught exception: ' + err.message);
    console.error(err);
});

process.on('unhandledRejection', function (reason) {
    JLog.error('[Discord Process] Unhandled rejection: ' + String(reason));
});

var MainDB = require('../Web/db');
MainDB.ready = function () {
    JLog.success('[Discord Process] DB ready, initializing bot...');
    DiscordBot.init(GLOBAL.DISCORD_TOKEN, MainDB, null, {
        enabled: GLOBAL.BOT_ENABLED !== false,
        ROOM: null,
        ADMIN: GLOBAL.ADMIN,
        queryOnlineUser: proxyCallbacks.queryOnlineUser,
        sendRoomMsg: proxyCallbacks.sendRoomMsg
    });
};
