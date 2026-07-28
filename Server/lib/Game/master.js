/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var Cluster = require("cluster");
var File = require("fs");
var Path = require("path");
var ChildProcess = require("child_process");
var WebSocket = require("ws");
var https = require("https");
var HTTPS_Server;
// var Heapdump = require("heapdump");
var KKuTu = require("./kkutu");
var GLOBAL = require("../sub/global.json");
var Const = require("../const");
var JLog = require("../sub/jjlog");
var FallbackLog = require("../sub/discord-fallback-log");
var Secure = require("../sub/secure");
var Recaptcha = require("../sub/recaptcha");
var { validateInput, checkPrototypePollution } = require("../Web/validators");

var MainDB;

var Server;
var DIC = {};
var DNAME = {};
var ROOM = {};
var reportCooldown = {};

var T_ROOM = {};
var T_USER = {};

var SID;
var CHAN_DIC = {};
var WDIC = {};

const DEVELOP = (exports.DEVELOP = global.test || false);
const GUEST_PERMISSION = (exports.GUEST_PERMISSION = {
  create: true,
  enter: true,
  talk: true,
  practice: true,
  ready: true,
  start: true,
  invite: true,
  inviteRes: true,
  kick: true,
  kickVote: true,
  wp: true,
});
const ENABLE_ROUND_TIME = (exports.ENABLE_ROUND_TIME = [5, 10, 30, 60, 90, 120, 150]);
const ENABLE_FORM = (exports.ENABLE_FORM = ["S", "J"]);
const MODE_LENGTH = (exports.MODE_LENGTH = Const.GAME_TYPE.length);
const PORT = process.env["KKUTU_PORT"];

// === Discord child process management ===
var discordProcess = null;
var _shuttingDown = false;

function discordDisplayName(profile) {
  if (!profile) return "알 수 없음";
  return profile.title || profile.name || "알 수 없음";
}

// 손님은 아이디(guest__세션ID)만으로는 추적이 어려우므로 접속 IP를 함께 남김
function discordUserTag(data) {
  return data.guest ? `${data.id}, IP: ${data.ip}` : data.id;
}

// 디스코드 봇이 꺼져있거나(BOT_ENABLED=false) discordProcess가 아직 뜨지 않았을 때
// 이벤트를 그냥 버리지 않고 discord-fallback.log에 남기기 위한 텍스트 포맷
function formatDiscordFallback(type, data) {
  switch (type) {
    case "notify-user-join":
      return `[유저입장] ${discordDisplayName(data.profile)}(${discordUserTag(data)}) (현재 ${data.userCount}명)`;
    case "notify-user-leave":
      return `[유저퇴장] ${discordDisplayName(data.profile)}(${discordUserTag(data)}) (현재 ${data.userCount}명)`;
    case "notify-room-create":
      return `[방생성] ${data.roomId}번 방: ${(data.room && data.room.title) || "(없음)"}`;
    case "notify-room-delete":
      return `[방삭제] ${data.roomId}번 방`;
    case "notify-game-start":
      return `[게임시작] ${data.roomId}번 방`;
    case "notify-chat-log": {
      var location = (data.place === 0 || data.place === "0") ? "로비" : `${data.place}번 방`;
      return `[채팅|${location}] ${data.isRobot ? "[봇]" : ""}${discordDisplayName(data.profile)}: ${data.message}`;
    }
    case "notify-whisper-log":
      return `[귓속말] ${discordDisplayName(data.profile)} → ${data.targets}: ${data.message}`;
    case "notify-round-end": {
      var roundText = (data.round && data.totalRounds) ? ` (${data.round}/${data.totalRounds})` : "";
      var chainStr = (data.chainLog || []).map(function (entry) {
        if (entry.event === "timeout") return `${entry.player} 입력 실패`;
        if (entry.event === "ko") return `${entry.player} KO`;
        return `${entry.player}: ${entry.word}`;
      }).join(" > ");
      return `[라운드종료] ${data.roomId}번 방${roundText} ${chainStr}`;
    }
    case "notify-quiz-round-end": {
      var qd = data.data || {};
      var qRoundText = (qd.round && qd.totalRounds) ? ` (${qd.round}/${qd.totalRounds})` : "";
      var parts = [`정답: ${qd.answer}`];
      if (qd.winners && qd.winners.length) parts.push(`맞힘: ${qd.winners.join(", ")}`);
      if (qd.missed && qd.missed.length) parts.push(`못맞힘: ${qd.missed.join(", ")}`);
      if (qd.giveup && qd.giveup.length) parts.push(`포기: ${qd.giveup.join(", ")}`);
      return `[퀴즈라운드종료] ${data.roomId}번 방${qRoundText} ${parts.join(" | ")}`;
    }
    case "notify-game-over": {
      var lines = (data.rankings || []).map(function (r) {
        var score = (typeof r.score === "number") ? r.score : 0;
        return `${r.rank + 1}위 ${r.name}${r.robot ? "(봇)" : ""}: ${score}점`;
      });
      return `[게임종료] ${data.roomId}번 방 ${lines.join(", ")}`;
    }
    case "notify-room-settings":
      return `[방설정변경] ${data.roomId}번 방: ${(data.room && data.room.title) || "(없음)"}`;
    case "notify-bot-settings":
      return `[봇설정변경] ${data.roomId}번 방: ${data.botInfo && data.botInfo.name}`;
    case "notify-room-join":
      return `[방입장] ${data.name}${data.isRobot ? "(봇)" : ""} → ${data.roomId}번 방`;
    case "notify-room-leave":
      return `[방퇴장] ${data.name}${data.isRobot ? "(봇)" : ""} ← ${data.roomId}번 방 (${data.reason || "abnormal"})`;
    case "report":
      return `[신고] ${discordDisplayName(data.reporterProfile)}(${data.reporterId}) → ${discordDisplayName(data.targetProfile)}(${data.targetId}) - 사유: ${Const.REPORT_REASON_LABELS[data.reasonCode] || Const.REPORT_REASON_LABELS[6]}, 상세내용: ${data.detail || "(작성 안 함)"}`;
    default:
      return null;
  }
}

function discordSend(type, data) {
  if (!discordProcess) {
    var fallbackText = formatDiscordFallback(type, data);
    if (fallbackText) FallbackLog.logToFile(fallbackText);
    return;
  }
  try {
    discordProcess.send(Object.assign({ type: type }, data));
  } catch (e) {
    JLog.warn("[Discord] IPC send failed: " + e.message);
  }
}

// 워커(방)가 IPC로 보내는 이벤트를 discordProcess로 중계하는 로직.
// 방/로비가 워커 없이 마스터 프로세스 안에서 직접 처리되는 경우(예: 로비 채팅)에도
// KKuTu.init()으로 주입되어 동일하게 사용된다 — 마스터 프로세스에는 실제로 로그인된
// 디스코드 클라이언트가 없으므로, 이 경로를 거치지 않으면 discordProcess로 전달될 수 없다.
function relayDiscordEvent(type, data) {
  switch (type) {
    case "game-start":
      discordSend("notify-game-start", { roomId: data.room });
      break;
    case "chat-log":
      discordSend("notify-chat-log", { profile: data.profile, message: data.message, place: data.place, isRobot: data.isRobot });
      break;
    case "whisper-log":
      discordSend("notify-whisper-log", { profile: data.profile, message: data.message, targets: data.targets });
      break;
    case "round-end":
      discordSend("notify-round-end", { roomId: data.room, chainLog: data.chainLog, round: data.round, totalRounds: data.totalRounds });
      break;
    case "quiz-round-end":
      discordSend("notify-quiz-round-end", { roomId: data.room, data: data.data });
      break;
    case "game-over":
      discordSend("notify-game-over", { roomId: data.room, rankings: data.rankings });
      break;
    case "room-settings":
      discordSend("notify-room-settings", { roomId: data.roomId, room: data.room });
      break;
    case "bot-settings":
      discordSend("notify-bot-settings", { roomId: data.roomId, botInfo: data.botInfo });
      break;
    case "room-join":
      discordSend("notify-room-join", { roomId: data.roomId, name: data.name, isRobot: data.isRobot });
      break;
    case "room-leave":
      discordSend("notify-room-leave", { roomId: data.roomId, name: data.name, isRobot: data.isRobot, reason: data.reason });
      break;
    default:
      JLog.warn("[Discord] Unhandled relay type: " + type);
  }
}

function handleDiscordProcessMessage(msg) {
  switch (msg.type) {
    case "query-online-user": {
      var foundUser = null;
      // O(1) 직접 ID 조회
      if (DIC[msg.query]) {
        var $du = DIC[msg.query];
        foundUser = { profile: $du.profile, data: $du.data };
      } else {
        // 닉네임/칭호 검색 fallback
        for (var uid in DIC) {
          var $u = DIC[uid];
          if (!$u) continue;
          var uTitle = $u.profile && $u.profile.title;
          var uName = $u.profile && $u.profile.name;
          if ((uTitle && uTitle === msg.query) || (uName && uName === msg.query)) {
            foundUser = { profile: $u.profile, data: $u.data };
            break;
          }
        }
      }
      try {
        discordProcess.send({ type: "query-online-user-result", _reqId: msg._reqId, user: foundUser });
      } catch (e) {}
      break;
    }
    case "send-roommsg": {
      var rid = msg.roomId;
      var rmRoom = ROOM && ROOM[rid];
      var rmExists = !!rmRoom;
      var rmSent = 0;
      if (rmExists) {
        var rmData = JSON.stringify({ type: "chat", value: msg.message, notice: true, profile: { title: "관리자" } });
        // players 배열 직접 순회 (전체 DIC 순회 대신) - O(n_room) vs O(n_total)
        var rmPlayers = rmRoom.players || [];
        for (var pi = 0; pi < rmPlayers.length; pi++) {
          var $p = DIC[rmPlayers[pi]];
          if ($p && $p.socket && $p.socket.readyState == 1) {
            $p.socket.send(rmData);
            rmSent++;
          }
        }
        JLog.info("[Discord] roommsg to room " + rid + ": " + msg.message);
      }
      try {
        discordProcess.send({ type: "send-roommsg-result", _reqId: msg._reqId, exists: rmExists, sent: rmSent });
      } catch (e) {}
      break;
    }
  }
}

function setDiscordCpuAffinity(pid) {
  var core = (GLOBAL.DISCORD_CPU_CORE !== undefined) ? GLOBAL.DISCORD_CPU_CORE : 0;
  var mask = 1 << core;
  if (process.platform === 'win32') {
    ChildProcess.exec(
      'powershell -Command "(Get-Process -Id ' + pid + ').ProcessorAffinity = ' + mask + '"',
      function (err) {
        if (err) JLog.warn('[Discord Process] CPU 어피니티 설정 실패: ' + err.message);
        else JLog.info('[Discord Process] CPU 코어 ' + core + '번에 고정됨 (PID ' + pid + ')');
      }
    );
  } else {
    ChildProcess.exec(
      'taskset -cp ' + core + ' ' + pid,
      function (err) {
        if (err) JLog.warn('[Discord Process] CPU 어피니티 설정 실패: ' + err.message);
        else JLog.info('[Discord Process] CPU 코어 ' + core + '번에 고정됨 (PID ' + pid + ')');
      }
    );
  }
}

function spawnDiscordProcess() {
  if (!GLOBAL.BOT_ENABLED || !GLOBAL.DISCORD_TOKEN) return;

  discordProcess = ChildProcess.fork(
    Path.join(__dirname, "../sub/discord-process.js"),
    { silent: false }
  );

  if (GLOBAL.DISCORD_CPU_CORE !== undefined) {
    setDiscordCpuAffinity(discordProcess.pid);
  }

  discordProcess.on("message", handleDiscordProcessMessage);

  discordProcess.on("error", function (err) {
    JLog.error("[Discord Process] Error: " + err.message);
  });

  discordProcess.on("exit", function (code, signal) {
    JLog.error("[Discord Process] Exited (code=" + code + ", signal=" + signal + ")");
    discordProcess = null;
    if (!_shuttingDown) {
      JLog.warn("[Discord Process] 30초 후 재시작합니다...");
      setTimeout(spawnDiscordProcess, 30000);
    }
  });
}

function shutdownDiscord(err, exitCode) {
  _shuttingDown = true;
  if (!discordProcess) {
    process.exit(exitCode);
    return;
  }
  var done = false;
  function finish() {
    if (done) return;
    done = true;
    if (discordProcess) {
      try { discordProcess.removeAllListeners(); discordProcess.kill(); } catch (e) {}
      discordProcess = null;
    }
    process.exit(exitCode);
  }
  setTimeout(finish, 5500);
  discordProcess.once("message", function (msg) {
    if (msg && msg.type === "shutdown-done") finish();
  });
  try {
    discordProcess.send({ type: "shutdown", error: err ? err.toString() : null });
  } catch (e) {
    finish();
  }
}
// === end Discord process management ===

process.on("uncaughtException", function (err) {
  var text = `:${PORT} [${new Date().toLocaleString()}] MASTER_ERROR: ${err.toString()}\n${err.stack}\n`;

  // 이슈 4 진단: 잘못된 절대경로(/jjolol/...) 대신 슬레이브와 동일한 상대경로 사용
  // 그리고 콘솔에 즉시 출력해서 process.exit 전에 반드시 보이도록
  console.error("[MASTER UNCAUGHT]", text);
  JLog.error(`ERROR OCCURRED ON THE MASTER! ${err && err.stack || err}`);
  try { File.appendFileSync("../KKUTU_ERROR.log", text); } catch (_) {}

  shutdownDiscord(err, 1);
});

process.on("SIGINT", function () {
  JLog.info("Server shutting down (SIGINT)...");
  shutdownDiscord(null, 0);
});

process.on("SIGTERM", function () {
  JLog.info("Server shutting down (SIGTERM)...");
  shutdownDiscord(null, 0);
});

process.on("unhandledRejection", function (reason) {
  var stack = (reason && reason.stack) ? reason.stack : String(reason);
  var text = `:${PORT} [${new Date().toLocaleString()}] MASTER_UNHANDLED_REJECTION: ${stack}\n`;
  // 이슈 4 진단: 경로 정상화 + 콘솔 출력 보장
  try { File.appendFileSync("../KKUTU_ERROR.log", text); } catch (_) {}
  JLog.error(`Unhandled promise rejection (서버 계속 실행): ${stack}`);
  console.error("[Master Unhandled Rejection]", stack);
});

function processAdmin(id, value) {
  var cmd, temp, i, j;

  value = value.replace(/^(#\w+\s+)?(.+)/, function (v, p1, p2) {
    if (p1) cmd = p1.slice(1).trim();
    return p2;
  });
  switch (cmd) {
    case "yell":
      KKuTu.publish("yell", { value: value });
      return null;
    case "kill":
      if ((temp = DIC[value])) {
        temp.socket.send('{"type":"error","code":410}');
        temp.socket.close();
      }
      return null;
    case "tailroom":
      if ((temp = ROOM[value])) {
        if (T_ROOM[value] == id) {
          i = true;
          delete T_ROOM[value];
        } else T_ROOM[value] = id;
        if (DIC[id]) DIC[id].send("tail", { a: i ? "trX" : "tr", rid: temp.id, id: id, msg: { pw: temp.password, players: temp.players } });
      }
      return null;
    case "tailuser":
      if ((temp = DIC[value])) {
        if (T_USER[value] == id) {
          i = true;
          delete T_USER[value];
        } else T_USER[value] = id;
        temp.send("test");
        if (DIC[id]) DIC[id].send("tail", { a: i ? "tuX" : "tu", rid: temp.id, id: id, msg: temp.getData() });
      }
      return null;
    case "dump":
      if (DIC[id]) DIC[id].send("yell", { value: "This feature is not supported..." });
      /*Heapdump.writeSnapshot("/home/kkutu_memdump_" + Date.now() + ".heapsnapshot", function(err){
        if(err){
          JLog.error("Error when dumping!");
          return JLog.error(err.toString());
        }
        if(DIC[id]) DIC[id].send('yell', { value: "DUMP OK" });
        JLog.success("Dumping success.");
      });*/
      return null;
    case "roommsg":
      temp = value.match(/^(\d+)\s+(.+)$/);
      if (temp && ROOM[Number(temp[1])]) {
        var rid = Number(temp[1]);
        var message = temp[2];
        var r = JSON.stringify({ type: "chat", value: message, notice: true, profile: { title: "관리자" } });
        for (var k in DIC) {
          if (DIC[k].place == rid && DIC[k].socket && DIC[k].socket.readyState == 1) {
            DIC[k].socket.send(r);
          }
        }
        JLog.info(`[Admin] roommsg to room ${rid}: ${message}`);
      } else {
        if (DIC[id]) DIC[id].send("notice", { value: "방을 찾을 수 없습니다." });
      }
      return null;
    /* Enhanced User Block System [S] */
    case "ban":
      try {
        var args = value.split(",");
        var banUntil = 0;
        var banUntilStr = "";
        if (args.length == 2) {
          MainDB.users.update(["_id", args[0].trim()]).set(["black", args[1].trim()], ["blockeduntil", ""]).on();
        } else if (args.length == 3) {
          banUntil = addDate(parseInt(args[2].trim())) || 0;
          banUntilStr = banUntil ? String(banUntil) : "";
          MainDB.users
            .update(["_id", args[0].trim()])
            .set(["black", args[1].trim()], ["blockeduntil", banUntilStr])
            .on();
        } else return null;

        JLog.info(`[Block] 사용자 #${args[0].trim()}(이)가 이용제한 처리되었습니다.`);

        if ((temp = DIC[args[0].trim()])) {
          temp.send("error", { code: 410, message: args[1].trim(), blockedUntil: banUntilStr });
          temp.socket.close();
        }
      } catch (e) {
        processAdminErrorCallback(e, id);
      }
      return null;
    case "ipban":
      try {
        var args = value.split(",");
        if (args.length == 2) {
          MainDB.ip_block.update(["_id", args[0].trim()]).set(["reasonBlocked", args[1].trim()]).on();
        } else if (args.length == 3) {
          MainDB.ip_block
            .update(["_id", args[0].trim()])
            .set(["reasonBlocked", args[1].trim()], ["ipBlockedUntil", addDate(parseInt(args[2].trim()))])
            .on();
        } else return null;

        JLog.info(`[Block] IP 주소 ${args[0].trim()}(이)가 이용제한 처리되었습니다.`);
      } catch (e) {
        processAdminErrorCallback(e, id);
      }
      return null;
    case "unban":
      try {
        MainDB.users.update(["_id", value]).set(["black", null], ["blockeduntil", ""]).on();
        JLog.info(`[Block] 사용자 #${value}(이)가 이용제한 해제 처리되었습니다.`);
      } catch (e) {
        processAdminErrorCallback(e, id);
      }
      return null;
    case "ipunban":
      try {
        MainDB.ip_block.update(["_id", value]).set(["reasonBlocked", null], ["ipBlockedUntil", 0]).on();
        JLog.info(`[Block] IP 주소 ${value}(이)가 이용제한 해제 처리되었습니다.`);
      } catch (e) {
        processAdminErrorCallback(e, id);
      }
      return null;
    /* Enhanced User Block System [E] */
  }
  return value;
}
/* Enhanced User Block System [S] */
function addDate(num) {
  if (isNaN(num)) return;
  return Date.now() + num * 24 * 60 * 60 * 1000;
}

function processAdminErrorCallback(error, id) {
  DIC[id].send("notice", { value: `명령을 처리하는 도중 오류가 발생하였습니다: ${error}` });
  JLog.warn(`[Block] 명령을 처리하는 도중 오류가 발생하였습니다: ${error}`);
}
/* Enhanced User Block System [E] */
function checkTailUser(id, place, msg) {
  var temp;

  if ((temp = T_USER[id])) {
    if (!DIC[temp]) {
      delete T_USER[id];
      return;
    }
    DIC[temp].send("tail", { a: "user", rid: place, id: id, msg: msg });
  }
}
function narrateFriends(id, friends, stat) {
  if (!friends) return;
  var fl = Object.keys(friends);

  if (!fl.length) return;

  MainDB.users
    .find(["_id", { $in: fl }], ["server", /^\w+$/])
    .limit(["server", true])
    .on(function ($fon) {
      var i,
        sf = {},
        s;

      for (i in $fon) {
        if (!sf[(s = $fon[i].server)]) sf[s] = [];
        sf[s].push($fon[i]._id);
      }
      if (DIC[id]) DIC[id].send("friends", { list: sf });

      if (sf[SID]) {
        KKuTu.narrate(sf[SID], "friend", { id: id, s: SID, stat: stat });
        delete sf[SID];
      }
      for (i in WDIC) {
        WDIC[i].send("narrate-friend", { id: id, s: SID, stat: stat, list: sf });
        break;
      }
    });
}
Cluster.on("message", function (worker, msg) {
  var temp;

  switch (msg.type) {
    case "admin":
      if (DIC[msg.id] && DIC[msg.id].admin) processAdmin(msg.id, msg.value);
      break;
    case "tail-report":
      if ((temp = T_ROOM[msg.place])) {
        if (!DIC[temp]) delete T_ROOM[msg.place];
        DIC[temp].send("tail", { a: "room", rid: msg.place, id: msg.id, msg: msg.msg });
      }
      checkTailUser(msg.id, msg.place, msg.msg);
      break;
    case "okg":
      if (DIC[msg.id]) DIC[msg.id].onOKG(msg.time);
      break;
    case "kick":
      if (DIC[msg.target]) DIC[msg.target].socket.close();
      break;
    case "invite":
      if (!DIC[msg.target]) {
        worker.send({ type: "invite-error", target: msg.id, code: 417 });
        break;
      }
      if (DIC[msg.target].place != 0) {
        worker.send({ type: "invite-error", target: msg.id, code: 417 });
        break;
      }
      if (!GUEST_PERMISSION.invite)
        if (DIC[msg.target].guest) {
          worker.send({ type: "invite-error", target: msg.id, code: 422 });
          break;
        }
      if (DIC[msg.target]._invited) {
        worker.send({ type: "invite-error", target: msg.id, code: 419 });
        break;
      }
      DIC[msg.target]._invited = msg.place;
      DIC[msg.target].send("invited", { from: msg.place });
      break;
    case "room-new":
      if (ROOM[msg.room.id] || !DIC[msg.target]) {
        // 이미 그런 ID의 방이 있다... 그 방은 없던 걸로 해라.
        JLog.warn(`[IPC] room-new rejected: Room ${msg.room.id} already exists or target ${msg.target} not found`);
        worker.send({ type: "room-invalid", room: msg.room });
      } else {
        ROOM[msg.room.id] = new KKuTu.Room(msg.room, msg.room.channel);
        JLog.info(`[IPC] room-new: Room ${msg.room.id} created on master (channel: ${msg.room.channel})`);
        // Discord notification - readies/players/game 등 불필요한 필드 제외하고 Discord가 실제 쓰는 필드만 전송
        discordSend("notify-room-create", {
          roomId: msg.room.id,
          room: { title: msg.room.title, mode: msg.room.mode, limit: msg.room.limit, round: msg.room.round, time: msg.room.time, opts: msg.room.opts },
          realPassword: msg.realPassword
        });
      }
      break;
    case "room-come":
      if (ROOM[msg.id] && DIC[msg.target]) {
        ROOM[msg.id].come(DIC[msg.target]);
      } else {
        JLog.warn(`Wrong room-come id=${msg.id}&target=${msg.target}`);
      }
      break;
    case "room-spectate":
      if (ROOM[msg.id] && DIC[msg.target]) {
        ROOM[msg.id].spectate(DIC[msg.target], msg.pw);
      } else {
        JLog.warn(`Wrong room-spectate id=${msg.id}&target=${msg.target}`);
      }
      break;
    case "room-go":
      if (ROOM[msg.id] && DIC[msg.target]) {
        ROOM[msg.id].go(DIC[msg.target]);
        if (msg.removed && ROOM[msg.id]) {
          delete ROOM[msg.id];
          JLog.warn(`Room ${msg.id} sync-deleted (master)`);
          KKuTu.publish("room", { room: { id: msg.id, players: [] } });
        }
      } else {
        // 나가기 말고 연결 자체가 끊겼을 때 생기는 듯 하다.
        JLog.warn(`Wrong room-go id=${msg.id}&target=${msg.target}`);
        if (DIC[msg.target]) DIC[msg.target].place = 0;
        // FIX: slave에도 room-go를 전달하여 disconnRoom 알림이 발행되도록 함
        if (ROOM[msg.id] && ROOM[msg.id].channel && CHAN_DIC[ROOM[msg.id].channel]) {
          CHAN_DIC[ROOM[msg.id].channel].send({ type: "room-go", id: msg.id, target: msg.target, removed: msg.removed });
        }
        if (ROOM[msg.id] && ROOM[msg.id].players) {
          // 이 때 수동으로 지워준다.
          var x = ROOM[msg.id].players.indexOf(msg.target);

          if (x != -1) {
            ROOM[msg.id].players.splice(x, 1);
            JLog.warn(`^ OK (removed from players)`);

            // FIX: 방장이 나간 경우 master 재할당
            if (ROOM[msg.id].master === msg.target) {
              var newMaster = null;
              for (var j = 0; j < ROOM[msg.id].players.length; j++) {
                var p = ROOM[msg.id].players[j];
                if (typeof p !== 'object' && DIC[p]) {
                  newMaster = p;
                  break;
                }
              }
              if (newMaster) {
                ROOM[msg.id].master = newMaster;
                DIC[newMaster].ready = false;
                JLog.warn(`^ Master reassigned to ${newMaster}`);
              } else if (ROOM[msg.id].players.length > 0) {
                // DIC에 없지만 players에는 있는 경우 (cross-channel)
                ROOM[msg.id].master = ROOM[msg.id].players[0];
                JLog.warn(`^ Master set to ${ROOM[msg.id].master} (cross-channel, not in DIC)`);
              } else {
                // 플레이어가 없으면 방 삭제
                JLog.warn(`^ No players left, deleting room ${msg.id}`);
                delete ROOM[msg.id];
                KKuTu.publish("room", { room: { id: msg.id, players: [] } });
                break;
              }
            }

            // FIX: 방 상태 변경을 브로드캐스트
            if (ROOM[msg.id]) {
              KKuTu.publish("room", { room: ROOM[msg.id].getData() });
            }
          }
        }
        if (msg.removed) {
          delete ROOM[msg.id];
          KKuTu.publish("room", { room: { id: msg.id, players: [] } });
        }
      }
      // 로비 복귀 유저에게 최신 방 목록 전송 (방에 있는 동안 놓친 업데이트 보상)
      if (DIC[msg.target] && DIC[msg.target].place == 0) {
        DIC[msg.target].send("roomSync", { rooms: KKuTu.getRoomList() });
      }
      break;
    case "user-publish":
      if ((temp = DIC[msg.data.id])) {
        // 허용된 속성만 화이트리스트 방식으로 병합
        const ALLOWED_USER_PROPS = ['id', 'type', 'game', 'place', 'data', 'profile', 'money', 'equip', 'exordial', 'guest'];
        for (var i in msg.data) {
          if (!msg.data.hasOwnProperty(i)) continue;
          // Prototype Pollution 방어
          if (i === '__proto__' || i === 'constructor' || i === 'prototype') {
            JLog.warn(`[SECURITY] Blocked dangerous key in user-publish: ${i}`);
            continue;
          }
          // 화이트리스트 검증
          if (!ALLOWED_USER_PROPS.includes(i)) {
            JLog.warn(`[SECURITY] Blocked non-whitelisted key in user-publish: ${i}`);
            continue;
          }
          // slim 모드: data에 record가 없으면 score만 업데이트하고 기존 data 유지
          if (i === 'data' && temp.data && msg.data.data && !msg.data.data.record) {
            temp.data.score = msg.data.data.score || 0;
            continue;
          }
          temp[i] = msg.data[i];
        }
      }
      // 로비 유저들에게도 user 이벤트 전달 — master DIC 동기화 후 broadcast
      KKuTu.publish("user", msg.data);
      // 방 안 유저(slave)에게도 전달
      for (var _ch in CHAN_DIC) CHAN_DIC[_ch].send({ type: "broadcast", event: "user", data: msg.data });
      break;
    case "room-publish":
      if ((temp = ROOM[msg.data.room.id])) {
        // 허용된 속성만 화이트리스트 방식으로 병합
        const ALLOWED_ROOM_PROPS = [
          'id', 'channel', 'title', 'password', 'limit', 'mode', 'round', 'time',
          'master', 'players', 'readies', 'gaming', 'game', 'practice', 'opts'
        ];
        for (var i in msg.data.room) {
          if (!msg.data.room.hasOwnProperty(i)) continue;
          // Prototype Pollution 방어
          if (i === '__proto__' || i === 'constructor' || i === 'prototype') {
            JLog.warn(`[SECURITY] Blocked dangerous key in room-publish: ${i}`);
            continue;
          }
          // 화이트리스트 검증
          if (!ALLOWED_ROOM_PROPS.includes(i)) {
            JLog.warn(`[SECURITY] Blocked non-whitelisted key in room-publish: ${i}`);
            continue;
          }
          temp[i] = msg.data.room[i];
        }
        temp.password = msg.password;
        KKuTu.publish("room", msg.data);
      }
      break;
    case "room-expired":
      if (msg.create && ROOM[msg.id]) {
        for (var i in ROOM[msg.id].players) {
          var $c = DIC[ROOM[msg.id].players[i]];

          if ($c) $c.send("roomStuck");
        }
        delete ROOM[msg.id];
      }
      break;
    case "room-invalid":
      if (ROOM[msg.room.id]) {
        delete ROOM[msg.room.id];
        JLog.info(`[IPC] room-invalid: Room ${msg.room.id} deleted from master`);
        KKuTu.publish("room", { room: { id: msg.room.id, players: [] } });
        // Discord notification
        discordSend("notify-room-delete", { roomId: msg.room.id });
      } else {
        JLog.warn(`[IPC] room-invalid: Room ${msg.room.id} not found on master (already deleted?)`);
      }
      break;
    case "game-start":
    case "chat-log":
    case "whisper-log":
    case "round-end":
    case "quiz-round-end":
    case "game-over":
    case "room-settings":
    case "bot-settings":
    case "room-join":
    case "room-leave":
      relayDiscordEvent(msg.type, msg);
      break;
    default:
      JLog.warn(`Unhandled IPC message type: ${msg.type}`);
  }
});
// FIX: Worker 크래시 시 해당 채널의 방을 Master에서 정리
exports.cleanupDeadWorkerRooms = function (deadChannel) {
  var deadRooms = [];
  for (var id in ROOM) {
    if (ROOM[id].channel == deadChannel) {
      deadRooms.push(id);
    }
  }
  deadRooms.forEach(function (id) {
    JLog.warn(`Cleaning up room ${id} from dead worker @${deadChannel}`);
    delete ROOM[id];
    KKuTu.publish("room", { room: { id: id, players: [] } });
  });
  if (deadRooms.length > 0) {
    JLog.warn(`Cleaned up ${deadRooms.length} rooms from dead worker @${deadChannel}`);
  }
};
// Worker 크래시 시 해당 채널에 있던 유저 정리
exports.cleanupDeadWorkerUsers = function (deadChannel) {
  var deadUsers = [];
  for (var id in DIC) {
    // place가 있는 유저 중 해당 채널의 방에 있던 유저 정리
    var $c = DIC[id];
    if ($c.place && ROOM[$c.place] && ROOM[$c.place].channel == deadChannel) {
      deadUsers.push(id);
    }
  }
  deadUsers.forEach(function (id) {
    var $c = DIC[id];
    if (!$c) return;
    JLog.warn(`Cleaning up user ${id} from dead worker @${deadChannel}`);
    $c.place = 0;
    // 소켓을 닫아 onClientClosed 정리 경로를 통해 DIC에서도 제거
    if ($c.socket && $c.socket.readyState === 1) {
      $c.send('roomStuck');
      $c.socket.close();
    } else {
      // 소켓이 이미 닫혔으면 직접 DIC에서 제거
      KKuTu.onClientClosed($c, 1000);
    }
  });
  if (deadUsers.length > 0) {
    JLog.warn(`Cleaned up ${deadUsers.length} users from dead worker @${deadChannel}`);
  }
};

exports.init = function (_SID, CHAN) {
  SID = _SID;
  CHAN_DIC = CHAN;
  MainDB = require("../Web/db");
  MainDB.ready = function () {
    JLog.success("Master DB is ready.");

    // Spawn Discord bot as a separate child process
    spawnDiscordProcess();

    MainDB.users.update(["server", SID]).set(["server", ""]).on();
    if (Const.IS_SECURED || Const.WAF) {
      const options = Secure();
      HTTPS_Server = https.createServer(options).listen(global.test ? Const.TEST_PORT + 30 : process.env["KKUTU_PORT"]);
      Server = new WebSocket.Server({ server: HTTPS_Server });
    } else {
      Server = new WebSocket.Server({
        port: global.test ? Const.TEST_PORT + 30 : process.env["KKUTU_PORT"],
        perMessageDeflate: false,
      });
    }
    Server.on("connection", function (socket, info) {
      var key = info.url.slice(1);
      var $c;

      if (!validateInput(key, "string", { maxLength: 100 })) {
        socket.close();
        return;
      }

      socket.on("error", function (err) {
        JLog.warn("Error on #" + key + " on ws: " + err.toString());
      });
      // 웹 서버
      if (info.headers.host.startsWith(GLOBAL.GAME_SERVER_HOST + ":")) {
        if (WDIC[key]) WDIC[key].socket.close();
        WDIC[key] = new KKuTu.WebServer(socket);
        JLog.info(`New web server #${key}`);
        WDIC[key].socket.on("close", function () {
          JLog.alert(`Exit web server #${key}`);
          WDIC[key].socket.removeAllListeners();
          delete WDIC[key];
        });
        return;
      }
      if (Object.keys(DIC).length >= Const.KKUTU_MAX) {
        socket.send(`{ "type": "error", "code": "full" }`);
        return;
      }
      MainDB.session
        .findOne(["_id", key])
        .limit(["profile", true])
        .on(function ($body) {
          $c = new KKuTu.Client(socket, $body ? $body.profile : null, key);
          $c.admin = GLOBAL.ADMIN.indexOf($c.id) != -1;
          /* Enhanced User Block System [S] */
          $c.remoteAddress = GLOBAL.USER_BLOCK_OPTIONS.USE_X_FORWARDED_FOR
            ? info.headers["cf-connecting-ip"] || info.headers["x-forwarded-for"] || info.connection.remoteAddress
            : info.connection.remoteAddress;
          /* Enhanced User Block System [E] */

          // 기존 접속자 처리: DIC에서 즉시 제거하고 disconn 발행 후 소켓 닫기
          if (DIC[$c.id]) {
            var old = DIC[$c.id];
            old._replaced = true;
            // 동기적으로 방에서 먼저 제거 (socket.close는 비동기라 Room.go보다 늦게 처리됨)
            if (old.place && ROOM[old.place]) {
              ROOM[old.place].go(old);
            }
            delete DIC[$c.id];
            if (old.profile) delete DNAME[(old.profile.title || old.profile.name).replace(/\s/g, "")];
            if (!old.guest) MainDB.users.update(["_id", old.id]).set(["server", ""]).on();
            if (old.friends) narrateFriends(old.id, old.friends, "off");
            KKuTu.publish("disconn", { id: old.id });
            old.sendError(408);
            old.socket.close();
          }
          if (DEVELOP && !Const.TESTER.includes($c.id)) {
            $c.sendError(500);
            $c.socket.close();
            return;
          }
          if ($c.guest) {
            if (SID != "0") {
              $c.sendError(402);
              $c.socket.close();
              return;
            }
            if (KKuTu.NIGHT) {
              $c.sendError(440);
              $c.socket.close();
              return;
            }
          }

          // IP 차단 및 refresh를 순차적으로 처리하는 함수
          function proceedAfterIpCheck() {
            if ($c.isAjae === null) {
              $c.sendError(441);
              $c.socket.close();
              return;
            }
            $c.refresh().then(function (ref) {
            /* Enhanced User Block System [S] */
            let isBlockRelease = false;

            if (ref.blockedUntil < Date.now()) {
              DIC[$c.id] = $c;
              MainDB.users.update(["_id", $c.id]).set(["blockeduntil", ""], ["black", null]).on();
              JLog.info(`사용자 #${$c.id}의 이용제한이 해제되었습니다.`);
              isBlockRelease = true;
            }
            /* Enhanced User Block System [E] */

            /* Enhanced User Block System [S] */
            if (ref.result == 200 || isBlockRelease) {
              /* Enhanced User Block System [E] */
              DIC[$c.id] = $c;
              DNAME[($c.profile.title || $c.profile.name).replace(/\s/g, "")] = $c.id;
              MainDB.users.update(["_id", $c.id]).set(["server", SID]).on();

              if (($c.guest && GLOBAL.GOOGLE_RECAPTCHA_TO_GUEST) || GLOBAL.GOOGLE_RECAPTCHA_TO_USER) {
                $c.socket.send(
                  JSON.stringify({
                    type: "recaptcha",
                    siteKey: GLOBAL.GOOGLE_RECAPTCHA_SITE_KEY,
                  }),
                );
              } else {
                $c.passRecaptcha = true;

                joinNewUser($c);
              }
            } else {
              /* Enhanced User Block System [S] */
              $c.send("error", {
                code: ref.result,
                message: ref.black,
                blockedUntil: ref.blockedUntil || 0,
              });
              /* Enhanced User Block System [E] */

              $c._error = ref.result;
              $c.socket.close();
              // JLog.info("Black user #" + $c.id);
            }
          });
          }

          /* Enhanced User Block System [S] */
          if (
            GLOBAL.USER_BLOCK_OPTIONS.USE_MODULE &&
            ((GLOBAL.USER_BLOCK_OPTIONS.BLOCK_IP_ONLY_FOR_GUEST && $c.guest) || !GLOBAL.USER_BLOCK_OPTIONS.BLOCK_IP_ONLY_FOR_GUEST)
          ) {
            MainDB.ip_block.findOne(["_id", $c.remoteAddress]).on(function ($body) {
              if ($body && $body.reasonBlocked) {
                if ($body.ipBlockedUntil < Date.now()) {
                  MainDB.ip_block.update(["_id", $c.remoteAddress]).set(["ipBlockedUntil", 0], ["reasonBlocked", null]).on();
                  JLog.info(`IP 주소 ${$c.remoteAddress}의 이용제한이 해제되었습니다.`);
                  proceedAfterIpCheck();
                } else {
                  $c.socket.send(
                    JSON.stringify({
                      type: "error",
                      code: 446,
                      reasonBlocked: !$body.reasonBlocked ? GLOBAL.USER_BLOCK_OPTIONS.DEFAULT_BLOCKED_TEXT : $body.reasonBlocked,
                      ipBlockedUntil: !$body.ipBlockedUntil ? GLOBAL.USER_BLOCK_OPTIONS.BLOCKED_FOREVER : $body.ipBlockedUntil,
                    }),
                  );
                  $c.socket.close();
                  return;
                }
              } else {
                proceedAfterIpCheck();
              }
            });
          } else {
            proceedAfterIpCheck();
          }
          /* Enhanced User Block System [E] */
        });
    });
    Server.on("error", function (err) {
      JLog.warn("Error on ws: " + err.toString());
    });
    KKuTu.init(MainDB, DIC, ROOM, GUEST_PERMISSION, CHAN, relayDiscordEvent);
  };
};

// 로비 잠수 유저 주기적 검사 (1분마다)
setInterval(function () {
  var now = Date.now();
  for (var _afkId in DIC) {
    var _afkC = DIC[_afkId];
    if (_afkC.place) continue;         // 방 안 유저는 제외
    if (_afkC._afkWarned) continue;    // 이미 경고 중
    if (now - (_afkC._lastActivity || now) >= Const.LOBBY_AFK_WARN_TIME) {
      _afkC._afkWarned = true;
      _afkC.send("afkWarn", { duration: Const.LOBBY_AFK_KICK_TIME / 1000 });
      (function (c) {
        c._afkKickTimer = setTimeout(function () {
          if (!c._afkWarned) return;    // ping으로 취소됨
          if (c.place) return;           // 방에 입장했으면 취소
          // setImmediate: I/O poll 단계(afkPing 처리)가 완료된 후 소켓 닫기
          // timers 단계와 poll 단계의 레이스 컨디션 방지
          setImmediate(function () {
            if (!c._afkWarned) return;
            if (c.place) return;
            if (c.socket) c.socket.close();
          });
        }, Const.LOBBY_AFK_KICK_TIME + 2000); // 클라이언트 RTT 여유 2초
      })(_afkC);
    }
  }
}, 60000);

function joinNewUser($c) {
  $c._lastActivity = Date.now();
  $c.send("welcome", {
    id: $c.id,
    guest: $c.guest,
    box: $c.box,
    playTime: $c.data.playTime,
    okg: $c.okgCount,
    users: KKuTu.getUserList($c.id),
    rooms: KKuTu.getRoomList(),
    friends: $c.friends,
    admin: $c.admin,
    test: global.test,
    caj: $c._checkAjae ? true : false,
  });
  narrateFriends($c.id, $c.friends, "on");
  KKuTu.publish("conn", { user: $c.getData() });
  // 방 안 유저(slave)에게도 전달
  for (var _ch in CHAN_DIC) CHAN_DIC[_ch].send({ type: "broadcast", event: "conn", data: { user: $c.getData() } });

  // Discord notification
  discordSend("notify-user-join", { profile: $c.profile, userCount: Object.keys(DIC).length, id: $c.id, guest: !!$c.guest, ip: $c.remoteAddress });

  JLog.info("New user #" + $c.id);

}

KKuTu.onClientMessage = function ($c, msg) {
  if (!msg) return;

  // 프로토타입 오염 방지 검사
  if (typeof msg === "object" && msg !== null) {
    if (!checkPrototypePollution(msg)) {
      JLog.warn(`[SECURITY] Prototype pollution attempt blocked from: ${$c.id}`);
      $c.send("error", { code: 400 });
      return;
    }
  }

  // heartbeat는 recaptcha 여부와 무관하게 항상 처리 (Cloudflare idle timeout 방지)
  if (msg.type === "heartbeat") {
    $c._lastHeartbeat = Date.now();
    return;
  }

  // 클라이언트의 탭 visibility 변화 보고 (모바일 백그라운드 disconnect 진단용)
  if (msg.type === "visibility") {
    if (validateInput(msg.state, "string", { maxLength: 20 })) {
      $c._lastVisibility = { state: msg.state, at: Date.now() };
    }
    return;
  }

  if ($c.passRecaptcha) {
    processClientRequest($c, msg);
  } else {
    if (msg.type === "recaptcha") {
      Recaptcha.verifyRecaptcha(msg.token, $c.remoteAddress, function (success) {
        if (success) {
          $c.passRecaptcha = true;

          joinNewUser($c);

          processClientRequest($c, msg);
        } else {
          JLog.warn(`Recaptcha failed from IP ${$c.remoteAddress}`);

          $c.sendError(447);
          $c.socket.close();
        }
      });
    }
  }
};

function processClientRequest($c, msg) {
  var stable = true;
  var temp;
  var now = new Date().getTime();

  // heartbeat는 이미 onClientMessage에서 걸러졌으므로 여기 오는 메시지는 모두 활동으로 간주
  $c._lastActivity = Date.now();

  switch (msg.type) {
    case "afkPing":
      // 잠수 경고 다이얼로그에서 확인 버튼을 눌렀을 때
      if ($c._afkKickTimer) {
        clearTimeout($c._afkKickTimer);
        delete $c._afkKickTimer;
      }
      $c._afkWarned = false;
      break;
    case "yell":
      if (!msg.value) return;
      if (!$c.admin) return;

      $c.publish("yell", { value: msg.value });
      break;
    case "refresh":
      $c.refresh();
      break;
    case "talk":
      if (!msg.value) return;
      if (!msg.value.substr) return;
      if (!GUEST_PERMISSION.talk)
        if ($c.guest) {
          $c.send("error", { code: 401 });
          return;
        }
      msg.value = msg.value.substr(0, 500);
      if ($c.admin) {
        if (!processAdmin($c.id, msg.value)) break;
      }
      checkTailUser($c.id, $c.place, msg);
      if (msg.whisper) {
        msg.whisper.split(",").forEach((v) => {
          if ((temp = DIC[DNAME[v]])) {
            temp.send("chat", {
              from: $c.profile.title || $c.profile.name,
              profile: $c.profile,
              value: msg.value,
            });
          } else {
            $c.sendError(424, v);
          }
        });
      } else {
        $c.chat(msg.value);
      }
      break;
    case "friendAdd":
      if (!msg.target) return;
      if ($c.guest) return;
      if ($c.id == msg.target) return;
      if (Object.keys($c.friends).length >= 100) return $c.sendError(452);
      if ((temp = DIC[msg.target])) {
        if (temp.guest) return $c.sendError(453);
        if ($c._friend) return $c.sendError(454);
        $c._friend = temp.id;
        temp.send("friendAdd", { from: $c.id });
      } else {
        $c.sendError(450);
      }
      break;
    case "report":
      if (typeof msg.target !== "string" || !msg.target) return;
      if (!msg.reasonCode || typeof msg.detail !== "string") return;
      if ($c.guest) return $c.sendError(451);
      if ($c.id == msg.target) return $c.sendError(460);
      if (!(temp = DIC[msg.target]) || temp.id !== msg.target) return $c.sendError(405);
      var reportKey = $c.id + ":" + msg.target;
      if (reportCooldown[reportKey]) return $c.sendError(461);
      reportCooldown[reportKey] = now;
      setTimeout(function () { delete reportCooldown[reportKey]; }, 5 * 60 * 1000);
      discordSend("report", {
        reporterProfile: $c.profile,
        reporterGuest: !!$c.guest,
        reporterId: $c.id,
        targetProfile: temp.profile,
        targetGuest: !!temp.guest,
        targetId: temp.id,
        reasonCode: Math.min(Math.max(parseInt(msg.reasonCode) || 6, 1), 6),
        detail: msg.detail.substr(0, 200)
      });
      break;
    case "friendAddRes":
      if (!(temp = DIC[msg.from])) return;
      if (temp._friend != $c.id) return;
      if (msg.res) {
        // $c와 temp가 친구가 되었다.
        $c.addFriend(temp.id);
        temp.addFriend($c.id);
      }
      temp.send("friendAddRes", { target: $c.id, res: msg.res });
      delete temp._friend;
      break;
    case "friendEdit":
      if (!$c.friends) return;
      if (!$c.friends[msg.id]) return;
      $c.friends[msg.id] = (msg.memo || "").slice(0, 50);
      $c.flush(false, false, true);
      $c.send("friendEdit", { friends: $c.friends });
      break;
    case "friendRemove":
      if (!$c.friends) return;
      if (!$c.friends[msg.id]) return;
      $c.removeFriend(msg.id);
      break;
    case "enter":
    case "setRoom":
      if (!msg.title) stable = false;
      if (!msg.limit) stable = false;
      if (!msg.round) stable = false;
      if (!msg.time) stable = false;
      if (!msg.opts) stable = false;

      msg.code = false;
      msg.limit = Number(msg.limit);
      msg.mode = Number(msg.mode);
      msg.round = Number(msg.round);
      msg.time = Number(msg.time);

      if (isNaN(msg.limit)) stable = false;
      if (isNaN(msg.mode)) stable = false;
      if (isNaN(msg.round)) stable = false;
      if (isNaN(msg.time)) stable = false;

      if (stable) {
        if (msg.title.length > 20) stable = false;
        if (msg.password.length > 20) stable = false;
        if (msg.limit < 2 || msg.limit > 12) {
          msg.code = 432;
          stable = false;
        }
        if (msg.mode < 0 || msg.mode >= MODE_LENGTH) stable = false;
        var _coopRule = Const.getRule(msg.mode);
        if (_coopRule && _coopRule.coop) {
          if (msg.round < 5 || msg.round > 50) {
            msg.code = 433;
            stable = false;
          }
        } else if (msg.round < 1 || msg.round > 10) {
          msg.code = 433;
          stable = false;
        }
        if (ENABLE_ROUND_TIME.indexOf(msg.time) == -1) stable = false;
      }
      if (msg.type == "enter") {
        if (msg.id || stable) $c.enter(msg, msg.spectate);
        else $c.sendError(msg.code || 431);
      } else if (msg.type == "setRoom") {
        if (stable) $c.setRoom(msg);
        else $c.sendError(msg.code || 431);
      }
      break;
    case "inviteRes":
      if (!(temp = ROOM[msg.from])) return;
      if (!GUEST_PERMISSION.inviteRes) if ($c.guest) return;
      if ($c._invited != msg.from) return;
      if (msg.res) {
        $c.enter({ id: $c._invited }, false, true);
      } else {
        if (DIC[temp.master]) DIC[temp.master].send("inviteNo", { target: $c.id });
      }
      delete $c._invited;
      break;
    /* 망할 셧다운제
    case 'caj':
      if(!$c._checkAjae) return;
      clearTimeout($c._checkAjae);
      if(msg.answer == "yes") $c.confirmAjae(msg.input);
      else if(KKuTu.NIGHT){
        $c.sendError(440);
        $c.socket.close();
      }
      break;
    */
    case "test":
      checkTailUser($c.id, $c.place, msg);
      break;
    case "updateProfile":
      if (!$c.profile) return;
      var safeProfile = {};
      // 닉네임은 HTTP /profile 라우트에서만 변경 가능 (소켓 우회 방지)
      // 소개글만 길이 제한 적용하여 허용
      if (msg && typeof msg.exordial === 'string') {
        safeProfile.exordial = msg.exordial.slice(0, 100);
      }
      if (msg && typeof msg.nickname === 'string') {
        safeProfile.nickname = msg.nickname.slice(0, 12);
      }
      $c.updateProfile(safeProfile);
      break;
    default:
      break;
  }
}

KKuTu.onClientClosed = function ($c, code) {
  if ($c.socket) $c.socket.removeAllListeners();

  // _replaced 플래그: 새 접속으로 교체된 소켓의 close 이벤트일 경우
  // DIC에서 삭제하면 새 접속까지 끊어지므로 무시
  if ($c._replaced) {
    JLog.info(`Replaced socket closed #${$c.id} (ignored)`);
    return;
  }

  // DIC에 현재 저장된 객체가 이 $c인지 확인 (이중 안전장치)
  if (DIC[$c.id] && DIC[$c.id] !== $c) {
    JLog.info(`Stale socket closed #${$c.id} (DIC has newer client, ignored)`);
    return;
  }

  // DIC에 등록되지 않은 클라이언트의 close 이벤트는 무시
  // (접속 과정에서 실패한 경우 등)
  if (!DIC[$c.id]) {
    JLog.info(`Unregistered socket closed #${$c.id} (not in DIC, ignored)`);
    // server 필드는 정리 (접속 과정에서 설정되었을 수 있음)
    if (!$c.guest) MainDB.users.update(["_id", $c.id]).set(["server", ""]).on();
    return;
  }

  delete DIC[$c.id];

  // Discord notification (삭제 후 정확한 카운트)
  discordSend("notify-user-leave", { profile: $c.profile, userCount: Object.keys(DIC).length, id: $c.id, guest: !!$c.guest, ip: $c.remoteAddress });

  // server 필드를 항상 정리 (유령 방지)
  if (!$c.guest) MainDB.users.update(["_id", $c.id]).set(["server", ""]).on();
  if ($c.profile) delete DNAME[($c.profile.title || $c.profile.name).replace(/\s/g, "")];
  if ($c.friends) narrateFriends($c.id, $c.friends, "off");
  KKuTu.publish("disconn", { id: $c.id });
  // 방 안 유저(slave)에게도 전달
  for (var _ch in CHAN_DIC) CHAN_DIC[_ch].send({ type: "broadcast", event: "disconn", data: { id: $c.id } });

  JLog.alert("Exit #" + $c.id);
};
