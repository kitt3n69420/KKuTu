// 게임 소켓 접속자의 실제 IP 판별
// Worker 중계(global.json의 WORKER_RELAY)를 거친 접속은 Cloudflare가 Worker의 IP를 넘겨주므로,
// Worker가 붙인 X-Relay-* 헤더를 쓴다. 단, 비밀값(SECRET)이 일치할 때만 믿는다(위조 방지).

var Crypto = require('crypto');
var GLOBAL = require('./global.json');

function sameSecret(a, b) {
    var x = Buffer.from(String(a || ''));
    var y = Buffer.from(String(b || ''));
    return x.length === y.length && x.length > 0 && Crypto.timingSafeEqual(x, y);
}

// 신뢰할 수 있는 중계 접속이면 { ip, colo }, 아니면 null
function relayInfo(headers) {
    var cfg = GLOBAL.WORKER_RELAY;
    if (!cfg || !cfg.ENABLED || !headers) return null;
    if (!sameSecret(headers['x-relay-secret'], cfg.SECRET)) return null;
    return {
        ip: String(headers['x-relay-client-ip'] || ''),
        colo: String(headers['x-relay-colo'] || '')
    };
}

// 기존 규칙(USER_BLOCK_OPTIONS.USE_X_FORWARDED_FOR)은 그대로 따르고, 중계 접속일 때만 중계 헤더를 우선한다
function remoteAddress(info) {
    if (!GLOBAL.USER_BLOCK_OPTIONS.USE_X_FORWARDED_FOR) return info.connection.remoteAddress;
    var relay = relayInfo(info.headers);
    if (relay && relay.ip) return relay.ip;
    return info.headers["cf-connecting-ip"] || info.headers["x-forwarded-for"] || info.connection.remoteAddress;
}

exports.relayInfo = relayInfo;
exports.remoteAddress = remoteAddress;
