/**
 * 네트워크 상태 진단 로그 (Windows 전용, 마스터 프로세스에서 한 번만 start()).
 *
 * - 5초마다 공유기(게이트웨이)와 외부(1.1.1.1)에 ping 1회. 타임아웃/300ms 초과는 즉시 [PING]으로 남긴다.
 * - 1분마다 [NET] 요약: 각 대상의 평균/최대/손실 + Wi-Fi 신호·채널·BSSID. BSSID가 바뀌면(로밍/재연결) 따로 표시.
 *
 * ping/netsh는 execFile로 띄워서 비동기로만 받으므로 이벤트루프를 막지 않는다.
 * 게이트웨이가 문제면 집 Wi-Fi 구간, 게이트웨이는 멀쩡한데 외부만 나쁘면 회선/ISP 쪽이다.
 */
var ChildProcess = require("child_process");
var DiagLog = require("./diag-log");

var TARGETS = {
  gw: "192.168.219.1", // 기본 게이트웨이 (Get-NetRoute 0.0.0.0/0 기준). 공유기를 바꾸면 여기도 바꿀 것
  ext: "1.1.1.1",
};
var PING_INTERVAL = 5000;
var PING_TIMEOUT = 1000;
var SLOW_PING = 300;
var SUMMARY_INTERVAL = 60000;

var stats = {};
var wifi = null;
var lastBssid = null;

function resetStats() {
  Object.keys(TARGETS).forEach(function (k) { stats[k] = { sum: 0, max: 0, ok: 0, lost: 0 }; });
}

// 한글 Windows의 ping 출력은 CP949라 "시간" 글자는 깨지지만 "=12ms TTL" / "<1ms TTL" 부분은 ASCII라 그대로 읽힌다
function pingOnce(name, host) {
  ChildProcess.execFile("ping", ["-n", "1", "-w", String(PING_TIMEOUT), host], { timeout: PING_TIMEOUT + 2000, windowsHide: true }, function (err, stdout) {
    var m = /[=<](\d+)ms\s+TTL/i.exec(stdout || "");
    var s = stats[name];
    if (!m) {
      s.lost++;
      DiagLog.write("PING", name + "(" + host + ") timeout");
      return;
    }
    var ms = Number(m[1]);
    s.ok++;
    s.sum += ms;
    if (ms > s.max) s.max = ms;
    if (ms > SLOW_PING) DiagLog.write("PING", name + "(" + host + ") " + ms + "ms");
  });
}

// netsh는 한글 Windows에서 항목 이름까지 한글(CP949)로 내보내 파싱이 안 되므로, 코드페이지 437로 바꿔 영어로 받는다
function readWifi() {
  ChildProcess.execFile("cmd", ["/d", "/c", "chcp 437 >nul & netsh wlan show interfaces"], { timeout: 5000, windowsHide: true }, function (err, stdout) {
    if (err || !stdout) { wifi = null; return; }
    var pick = function (re) { var m = re.exec(stdout); return m ? m[1] : "?"; };
    wifi = {
      state: pick(/^\s*State\s*:\s*(\S+)/m),
      ssid: pick(/^\s*SSID\s*:\s*(.+?)\s*$/m),
      band: pick(/^\s*Band\s*:\s*([\d.]+)/m),
      signal: pick(/^\s*Signal\s*:\s*(\d+%)/m),
      channel: pick(/^\s*Channel\s*:\s*(\d+)/m),
      bssid: pick(/^\s*AP BSSID\s*:\s*(\S+)/m),
      rx: pick(/^\s*Receive rate \(Mbps\)\s*:\s*([\d.]+)/m),
    };
    // 같은 공유기의 2.4GHz/5GHz SSID를 오가는 것도 여기서 드러난다
    if (lastBssid && wifi.bssid !== "?" && wifi.bssid !== lastBssid) {
      DiagLog.write("NET", "wifi changed " + lastBssid + " -> " + wifi.bssid + " (" + wifi.ssid + " " + wifi.band + "GHz ch=" + wifi.channel + ")");
    }
    if (wifi.bssid !== "?") lastBssid = wifi.bssid;
  });
}

function writeSummary() {
  var parts = Object.keys(TARGETS).map(function (k) {
    var s = stats[k];
    return k + " avg=" + (s.ok ? Math.round(s.sum / s.ok) : "-") + "ms max=" + s.max + "ms loss=" + s.lost + "/" + (s.ok + s.lost);
  });
  if (wifi) parts.push("wifi " + wifi.state + " " + wifi.ssid + " " + wifi.band + "GHz ch=" + wifi.channel + " signal=" + wifi.signal + " rx=" + wifi.rx + "Mbps bssid=" + wifi.bssid);
  DiagLog.write("NET", parts.join(" | "));
  resetStats();
  readWifi(); // 다음 요약에 쓸 값을 미리 읽어 둔다
}

exports.start = function () {
  if (process.platform !== "win32") return;
  resetStats();
  readWifi();
  setInterval(function () {
    Object.keys(TARGETS).forEach(function (k) { pingOnce(k, TARGETS[k]); });
  }, PING_INTERVAL);
  setInterval(writeSummary, SUMMARY_INTERVAL);
};
