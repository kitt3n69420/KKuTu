// 이벤트 루프 랙 및 메모리 사용량 모니터링
// 30초마다 stats를 파일에 기록, 랙/메모리 임계치 초과 시 즉시 경고

var File = require('fs');
var Path = require('path');
var JLog = require('./jjlog');

var LOG_FILE = Path.join(__dirname, '../../monitor.log');
var TICK_INTERVAL = 1000;   // 이벤트 루프 랙 측정 주기 (ms)
var STATS_INTERVAL = 30000; // 정기 stats 기록 주기 (ms)
var LAG_WARN_MS = 300;      // 이 이상이면 경고
var LAG_CRIT_MS = 1000;     // 이 이상이면 심각
var HEAP_WARN_MB = 400;     // 힙 사용량 경고 임계치 (MB)

var _role = 'unknown';
var _lastTick = 0;
var _maxLag = 0;

function ts() {
    return new Date().toISOString();
}

function appendLog(line) {
    File.appendFile(LOG_FILE, line + '\n', function() {});
}

function measureLag() {
    var now = Date.now();
    if (_lastTick === 0) {
        _lastTick = now;
        return;
    }
    var lag = now - _lastTick - TICK_INTERVAL;
    _lastTick = now;

    if (lag > _maxLag) _maxLag = lag;

    if (lag >= LAG_CRIT_MS) {
        var msg = '[' + _role + '] 이벤트 루프 심각 랙: ' + lag + 'ms';
        JLog.error(msg);
        appendLog('[' + ts() + '] CRIT ' + msg);
    } else if (lag >= LAG_WARN_MS) {
        var msg = '[' + _role + '] 이벤트 루프 랙: ' + lag + 'ms';
        JLog.alert(msg);
        appendLog('[' + ts() + '] WARN ' + msg);
    }
}

function logStats(getExtra) {
    var mem = process.memoryUsage();
    var heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    var rssMB  = (mem.rss     / 1024 / 1024).toFixed(1);
    var extra  = getExtra ? getExtra() : '';

    var line = '[' + ts() + '] [' + _role + '] heap=' + heapMB + 'MB rss=' + rssMB + 'MB maxLag=' + _maxLag + 'ms' + (extra ? ' ' + extra : '');
    appendLog(line);
    _maxLag = 0;

    if (parseFloat(heapMB) >= HEAP_WARN_MB) {
        JLog.warn('[' + _role + '] 힙 사용량 높음: ' + heapMB + 'MB');
    }
}

// role: 로그에 표시할 프로세스 이름 (예: 'master:0', 'slave:8080')
// getExtra: 호출 시점에 추가 정보 문자열을 반환하는 함수 (옵션)
exports.start = function(role, getExtra) {
    _role = role || 'unknown';
    _lastTick = Date.now();

    setInterval(measureLag, TICK_INTERVAL);
    setInterval(function() { logStats(getExtra); }, STATS_INTERVAL);

    appendLog('[' + ts() + '] [' + _role + '] 모니터 시작 (pid=' + process.pid + ')');
    JLog.info('[Monitor] 시작: ' + _role);
};
