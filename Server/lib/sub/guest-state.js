/**
 * 게스트 접속/채팅 허용 여부의 실시간 토글 값을 담는 저장소.
 * global.json(DB 비번, 토큰 등 비밀값 포함)과 분리해, 비밀값이 없는
 * 이 파일만 Web 서버와 Game 서버가 함께 읽고 쓴다.
 */
var File = require("fs");
var Path = require("path");

var STATE_PATH = Path.join(__dirname, "guest-state.json");

function read(fallback) {
  try {
    var data = JSON.parse(File.readFileSync(STATE_PATH, "utf8"));
    return {
      connect: typeof data.connect === "boolean" ? data.connect : fallback.connect,
      chat: typeof data.chat === "boolean" ? data.chat : fallback.chat,
    };
  } catch (e) {
    return fallback;
  }
}
function write(state) {
  File.writeFileSync(STATE_PATH, JSON.stringify({ connect: state.connect, chat: state.chat }, null, 4), "utf8");
}

exports.read = read;
exports.write = write;
