'use strict';

// 디스코드 봇이 꺼져있거나(BOT_ENABLED=false) 아직 연결되지 않았을 때
// 디스코드로 보내지 못하는 로그/알림을 대신 남기는 파일. master.js와 discord-bot.js
// (별도 프로세스) 양쪽에서 공용으로 사용한다.

const File = require('fs');
const Path = require('path');

const LOG_FILE = Path.join(__dirname, '../../discord-fallback.log');

exports.logToFile = function (text) {
    const line = `[${new Date().toLocaleString()}] ${text}\n`;
    File.appendFile(LOG_FILE, line, function () {});
};
