/**
 * 성능/메모리 진단 전용 로그. 콘솔에는 안 찍고 파일에만 남긴다.
 * 위치: Server/KKUTU_DIAG.log (KKUTU_ERROR.log와 같은 위치)
 *
 * write()는 메모리 배열에 push만 하는 동기 연산이라 호출부(쿼리 콜백 등)를 전혀 블록하지 않는다.
 * 실제 파일 I/O는 1초마다 한 번, 미리 열어둔 스트림에 몰아서 쓴다.
 * (fs.appendFile을 매 호출마다 쓰면 호출마다 open+write+close가 libuv 스레드풀에 올라가서,
 *  SLOWQ가 몰릴 때 스레드풀을 점유해 DB 커넥션의 DNS 조회 등과 경합할 수 있어 이 방식으로 변경함)
 */
var File = require("fs");
var Path = require("path");

var LOG_PATH = Path.join(__dirname, "../../KKUTU_DIAG.log");
var stream = File.createWriteStream(LOG_PATH, { flags: "a" });
var buffer = [];

function pad(n, len) {
	n = String(n);
	while (n.length < (len || 2)) n = "0" + n;
	return n;
}
function timestamp() {
	var d = new Date();
	return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
		pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + "." + pad(d.getMilliseconds(), 3);
}

exports.write = function (tag, text) {
	buffer.push("[" + timestamp() + "] [" + tag + "] " + text);
};

setInterval(function () {
	if (!buffer.length) return;
	var chunk = buffer.join("\n") + "\n";
	buffer.length = 0;
	stream.write(chunk);
}, 1000);
