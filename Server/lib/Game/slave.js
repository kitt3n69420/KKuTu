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

var WebSocket = require("ws");
var File = require("fs");
var Const = require("../const");
var https = require("https");
var Secure = require("../sub/secure");
var ProfanityFilter = require("../sub/profanity-filter");
var { validateInput, checkPrototypePollution } = require("../Web/validators");
var Server;
var HTTPS_Server;

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
var Master = require("./master");
var KKuTu = require("./kkutu");
var Lizard = require("../sub/lizard");
var MainDB = require("../Web/db");
var JLog = require("../sub/jjlog");
var GLOBAL = require("../sub/global.json");

var DIC = {};
var DNAME = {};
var ROOM = {};
var RESERVED = {};

const CHAN = process.env["CHANNEL"];
const DEVELOP = Master.DEVELOP;
const GUEST_PERMISSION = Master.GUEST_PERMISSION;
const ENABLE_ROUND_TIME = Master.ENABLE_ROUND_TIME;
const ENABLE_FORM = Master.ENABLE_FORM;
const MODE_LENGTH = Master.MODE_LENGTH;

JLog.info(`<< KKuTu Server:${Server.options.port} >>`);

process.on("uncaughtException", function (err) {
  var text = `:${process.env["KKUTU_PORT"]} [${new Date().toLocaleString()}] ERROR: ${err.toString()}\n${err.stack}`;

  for (var i in DIC) {
    DIC[i].send("dying");
  }
  File.appendFile("../KKUTU_ERROR.log", text, function (res) {
    JLog.error(`ERROR OCCURRED! This worker will die in 10 seconds.`);
    console.log(text);
  });
  setTimeout(function () {
    process.exit();
  }, 10000);
});
process.on("message", function (msg) {
  switch (msg.type) {
    case "invite-error":
      if (!DIC[msg.target]) break;
      DIC[msg.target].sendError(msg.code);
      break;
    case "room-reserve":
      if (RESERVED[msg.session]) {
        // 이미 입장 요청을 했는데 또 하는 경우
        break;
      } else
        RESERVED[msg.session] = {
          profile: msg.profile,
          room: msg.room,
          spec: msg.spec,
          pass: msg.pass,
          _expiration: setTimeout(
            function (tg, create) {
              process.send({ type: "room-expired", id: msg.room.id, create: create });
              delete RESERVED[tg];
            },
            10000,
            msg.session,
            msg.create,
          ),
        };
      break;
    case "room-invalid":
      delete ROOM[msg.room.id];
      break;
    default:
      JLog.warn(`Unhandled IPC message type: ${msg.type}`);
  }
});
MainDB.ready = function () {
  JLog.success("DB is ready.");
  KKuTu.init(MainDB, DIC, ROOM, GUEST_PERMISSION);
};
Server.on("connection", function (socket, info) {
  var chunk = info.url.slice(1).split("&");
  var key = chunk[0];
  var reserve = RESERVED[key] || {},
    room;
  var $c;

  socket.on("error", function (err) {
    JLog.warn("Error on #" + key + " on ws: " + err.toString());
  });
  if (CHAN != Number(chunk[1])) {
    JLog.warn(`Wrong channel value ${chunk[1]} on @${CHAN}`);
    socket.close();
    return;
  }
  if ((room = reserve.room)) {
    if (room._create) {
      room._id = room.id;
      delete room.id;
    }
    clearTimeout(reserve._expiration);
    delete reserve._expiration;
    delete RESERVED[key];
  } else {
    JLog.warn(`Not reserved from ${key} on @${CHAN}`);
    socket.close();
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
        ? info.headers["x-forwarded-for"] || info.connection.remoteAddress
        : info.connection.remoteAddress;
      /* Enhanced User Block System [E] */

      // 기존 접속자 처리: _replaced 플래그로 레이스 컨디션 방지
      if (DIC[$c.id]) {
        DIC[$c.id]._replaced = true;
        DIC[$c.id].send("error", { code: 408 });
        DIC[$c.id].socket.close();
      }
      if (DEVELOP && !Const.TESTER.includes($c.id)) {
        $c.send("error", { code: 500 });
        $c.socket.close();
        return;
      }

      // IP 차단 확인 후 순차적으로 접속 처리
      function proceedAfterIpCheck() {
        $c.refresh().then(function (ref) {
          if (ref.result == 200) {
            DIC[$c.id] = $c;
            DNAME[($c.profile.title || $c.profile.name).replace(/\s/g, "")] = $c.id;

            $c.enter(room, reserve.spec, reserve.pass);
            if ($c.place == room.id) {
              $c.publish("connRoom", { user: $c.getData() });
            } else {
              // 입장 실패
              $c.socket.close();
            }
            JLog.info(`Chan @${CHAN} New #${$c.id}`);
          } else {
            $c.send("error", {
              code: ref.result,
              message: ref.black,
            });
            $c._error = ref.result;
            $c.socket.close();
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
          proceedAfterIpCheck();
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
KKuTu.onClientMessage = function ($c, msg) {
  var stable = true;
  var temp;
  var now = new Date().getTime();

  if (!msg) return;

  // 프로토타입 오염 방지 검사
  if (typeof msg === "object" && msg !== null) {
    if (!checkPrototypePollution(msg)) {
      console.log("[SECURITY] Prototype pollution attempt blocked from:", $c.id);
      console.log("[SECURITY] Message type:", msg.type);
      console.log("[SECURITY] Message keys:", Object.keys(msg));
      console.log("[SECURITY] Full message:", JSON.stringify(msg));
      $c.send("error", { code: 400 });
      return;
    }
  }

  switch (msg.type) {
    case "heartbeat":
      $c._lastHeartbeat = Date.now();
      break;
    case "yell":
      if (!msg.value) return;
      if (!validateInput(msg.value, "string", { maxLength: 200 })) return;
      if (!$c.admin) return;

      $c.publish("yell", { value: msg.value });
      break;
    case "refresh":
      $c.refresh();
      break;
    case "talk":
      if (!msg.value) return;
      if (!validateInput(msg.value, "string", { maxLength: 500 })) return;
      if (!msg.value.substr) return;
      if (!GUEST_PERMISSION.talk)
        if ($c.guest) {
          $c.send("error", { code: 401 });
          return;
        }
      msg.value = msg.value.substr(0, 500);
      // 서버에서는 욕설 필터링을 적용하지 않음 (클라이언트에서 표시 시 처리)
      if (msg.relay) {
        if ($c.subPlace) temp = $c.pracRoom;
        else if (!(temp = ROOM[$c.place])) return;
        if (!temp.gaming) return;
        if (temp.game.late) {
          $c.chat(msg.value);
        } else if (!temp.game.loading) {
          temp.submit($c, msg.value, msg.data);
        }
      } else {
        if ($c.admin) {
          if (msg.value.charAt() == "#") {
            process.send({ type: "admin", id: $c.id, value: msg.value });
            break;
          }
        }
        if (msg.whisper) {
          process.send({ type: "tail-report", id: $c.id, chan: CHAN, place: $c.place, msg: msg });
          msg.whisper.split(",").forEach((v) => {
            if ((temp = DIC[DNAME[v]])) {
              temp.send("chat", { from: $c.profile.title || $c.profile.name, profile: $c.profile, value: msg.value });
            } else {
              $c.sendError(424, v);
            }
          });
        } else {
          $c.chat(msg.value);
        }
      }
      break;
    case "enter":
    case "setRoom":
      if (!validateInput(msg.title, "string", { maxLength: 50 })) stable = false;
      if (!validateInput(msg.limit, "number")) stable = false;
      if (!validateInput(msg.round, "number")) stable = false;
      if (!validateInput(msg.time, "number")) stable = false;
      if (!validateInput(msg.opts, "object")) stable = false;

      // 서버에서는 욕설 필터링을 적용하지 않음 (클라이언트에서 표시 시 처리)

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
        if (msg.round < 1 || msg.round > 10) {
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
    case "leave":
      if (!$c.place) return;

      $c.leave();
      break;
    case "ready":
      if (!$c.place) return;
      if (!GUEST_PERMISSION.ready) if ($c.guest) return;

      $c.toggle();
      break;
    case "start":
      if (!$c.place) return;
      if (!ROOM[$c.place]) return;
      if (ROOM[$c.place].gaming) return;
      if (!GUEST_PERMISSION.start) if ($c.guest) return;

      $c.start();
      break;
    case "practice":
      // console.log("[DEBUG] practice case reached, msg:", JSON.stringify(msg));
      if (!ROOM[$c.place]) return;
      if (ROOM[$c.place].gaming) return;
      if (!GUEST_PERMISSION.practice) if ($c.guest) return;

      // 빈 문자열을 undefined로 변환
      if (msg.personality === "") msg.personality = undefined;
      if (msg.preferredChar === "") msg.preferredChar = undefined;

      if (!validateInput(msg.level, "number")) {
        // console.log("[DEBUG] practice: level validation failed", msg.level);
        return;
      }
      if (msg.personality !== undefined && !validateInput(msg.personality, "number")) {
        // console.log("[DEBUG] practice: personality validation failed", msg.personality);
        return;
      }
      if (msg.preferredChar !== undefined && !validateInput(msg.preferredChar, "string", { maxLength: 1 })) {
        // console.log("[DEBUG] practice: preferredChar validation failed", msg.preferredChar);
        return;
      }
      if (isNaN((msg.level = Number(msg.level)))) {
        // console.log("[DEBUG] practice: level NaN check failed");
        return;
      }
      if (ROOM[$c.place].rule.ai) {
        if (msg.level < 0 || msg.level >= 5) return;
      } else if (msg.level != -1) return;

      if (msg.personality !== undefined) msg.personality = Number(msg.personality);

      //console.log("[DEBUG] slave.js practice msg:", msg);

      $c.practice({
        level: msg.level,
        personality: msg.personality,
        preferredChar: msg.preferredChar,
        mute: !!msg.mute,
        canRageQuit: !!msg.canRageQuit,
        fastMode: !!msg.fastMode,
      });
      break;
    case "invite":
      if (!validateInput(msg.target, "string", { maxLength: 50 })) return;
      if (!ROOM[$c.place]) return;
      if (ROOM[$c.place].gaming) return;
      if (ROOM[$c.place].master != $c.id) return;
      if (!GUEST_PERMISSION.invite) if ($c.guest) return;
      if (msg.target == "AI") {
        ROOM[$c.place].addAI($c);
      } else {
        process.send({ type: "invite", id: $c.id, place: $c.place, target: msg.target });
      }
      break;
    case "inviteRes":
      if (!validateInput(msg.from, "string", { maxLength: 50 })) return;
      if (!validateInput(msg.res, "boolean")) return;
      if (!(temp = ROOM[msg.from])) return;
      if (!GUEST_PERMISSION.inviteRes) if ($c.guest) return;
      if (msg.res) {
        $c.enter({ id: msg.from }, false, true);
      } else {
        if (DIC[temp.master]) DIC[temp.master].send("inviteNo", { target: $c.id });
      }
      break;
    case "form":
      if (!validateInput(msg.mode, "string", { maxLength: 10 })) return;
      if (!msg.mode) return;
      if (!ROOM[$c.place]) return;
      if (ENABLE_FORM.indexOf(msg.mode) == -1) return;

      $c.setForm(msg.mode);
      break;
    case "team":
      if (!validateInput(msg.value, "number")) return;
      if (!ROOM[$c.place]) return;
      if (ROOM[$c.place].gaming) return;
      if ($c.ready) return;
      if (isNaN((temp = Number(msg.value)))) return;
      if (temp < 0 || temp > 4) return;

      $c.setTeam(Math.round(temp));
      break;
    case "kick":
      if (!validateInput(msg.target, "string", { maxLength: 50 })) return;
      if (msg.robot !== undefined && !validateInput(msg.robot, "boolean")) return;
      if (!msg.robot) if (!(temp = DIC[msg.target])) return;
      if (!ROOM[$c.place]) return;
      if (ROOM[$c.place].gaming) return;
      if (!msg.robot) if ($c.place != temp.place) return;
      if (ROOM[$c.place].master != $c.id) return;
      if (ROOM[$c.place].kickVote) return;
      if (!GUEST_PERMISSION.kick) if ($c.guest) return;

      if (msg.robot) $c.kick(null, msg.target);
      else $c.kick(msg.target);
      break;
    case "kickVote":
      if (!validateInput(msg.agree, "boolean")) return;
      if (!(temp = ROOM[$c.place])) return;
      if (!temp.kickVote) return;
      if ($c.id == temp.kickVote.target) return;
      if ($c.id == temp.master) return;
      if (temp.kickVote.list.indexOf($c.id) != -1) return;
      if (!GUEST_PERMISSION.kickVote) if ($c.guest) return;

      $c.kickVote($c, msg.agree);
      break;
    case "handover":
      if (!validateInput(msg.target, "string", { maxLength: 50 })) return;
      if (!DIC[msg.target]) return;
      if (!(temp = ROOM[$c.place])) return;
      if (temp.gaming) return;
      if ($c.place != DIC[msg.target].place) return;
      if (temp.master != $c.id) return;

      temp.master = msg.target;
      if (temp._jst) {
        clearTimeout(temp._jst);
        delete temp._jst;
      }
      if (temp._jst_stage2) {
        clearTimeout(temp._jst_stage2);
        delete temp._jst_stage2;
      }
      temp.export();
      break;
    case "wp":
      if (!validateInput(msg.value, "string", { maxLength: 200 })) return;
      if (!msg.value) return;
      if (!GUEST_PERMISSION.wp)
        if ($c.guest) {
          $c.send("error", { code: 401 });
          return;
        }

      msg.value = msg.value.substr(0, 200);
      msg.value = msg.value.replace(/[^a-z가-힣]/g, "");
      if (msg.value.length < 2) return;
      break;
    case "setAI":
      // 빈 문자열을 undefined로 변환
      if (msg.personality === "") msg.personality = undefined;
      if (msg.preferredChar === "") msg.preferredChar = undefined;

      if (!validateInput(msg.target, "string", { maxLength: 50 })) return;
      if (!validateInput(msg.level, "number")) return;
      if (!validateInput(msg.team, "number")) return;
      if (msg.personality !== undefined && !validateInput(msg.personality, "number")) return;
      if (msg.preferredChar !== undefined && !validateInput(msg.preferredChar, "string", { maxLength: 1 })) return;
      if (!msg.target) return;
      if (!ROOM[$c.place]) return;
      if (ROOM[$c.place].gaming) return;
      if (ROOM[$c.place].master != $c.id) return;
      if (isNaN((msg.level = Number(msg.level)))) return;
      if (msg.level < 0 || msg.level >= 5) return;
      if (isNaN((msg.team = Number(msg.team)))) return;
      if (msg.team < 0 || msg.team > 4) return;

      if (msg.team < 0 || msg.team > 4) return;
      if (msg.personality !== undefined) {
        msg.personality = Number(msg.personality);
        if (isNaN(msg.personality) || msg.personality < -1 || msg.personality > 1) return;
      }
      if (msg.preferredChar !== undefined) {
        if (typeof msg.preferredChar !== "string" || msg.preferredChar.length > 1) return;
      }
      if (msg.mute !== undefined && !validateInput(msg.mute, "boolean")) return;
      if (msg.canRageQuit !== undefined && !validateInput(msg.canRageQuit, "boolean")) return;
      if (msg.fastMode !== undefined && !validateInput(msg.fastMode, "boolean")) return;

      ROOM[$c.place].setAI(msg.target, Math.round(msg.level), Math.round(msg.team), msg.personality, msg.preferredChar, msg.mute, msg.canRageQuit, msg.fastMode);
      break;
    case "draw":
      // Picture Quiz drawing message handler
      if (!ROOM[$c.place]) return;
      if (!ROOM[$c.place].gaming) return;
      if (!ROOM[$c.place].handleDraw) return;
      ROOM[$c.place].handleDraw($c, msg);
      break;
    case "clear":
      // Picture Quiz clear handler
      if (!ROOM[$c.place]) return;
      if (!ROOM[$c.place].gaming) return;
      if (!ROOM[$c.place].handleClear) return;
      ROOM[$c.place].handleClear($c, msg);
      break;
    case "pass":
      // Picture Quiz pass button handler
      if (!ROOM[$c.place]) return;
      if (!ROOM[$c.place].gaming) return;
      if (!ROOM[$c.place].handlePass) return;
      ROOM[$c.place].handlePass($c);
      break;
    default:
      break;
  }
};
KKuTu.onClientClosed = function ($c, code) {
  if ($c.socket) $c.socket.removeAllListeners();

  // _replaced 플래그: 새 접속으로 교체된 소켓의 close 이벤트일 경우
  // DIC에서 삭제하면 새 접속까지 끊어지므로 무시
  if ($c._replaced) {
    JLog.info(`Chan @${CHAN} Replaced socket closed #${$c.id} (ignored)`);
    return;
  }

  // DIC에 현재 저장된 객체가 이 $c인지 확인 (이중 안전장치)
  if (DIC[$c.id] && DIC[$c.id] !== $c) {
    JLog.info(`Chan @${CHAN} Stale socket closed #${$c.id} (DIC has newer client, ignored)`);
    return;
  }

  // DIC에 등록되지 않은 클라이언트의 close 이벤트는 무시
  if (!DIC[$c.id]) {
    JLog.info(`Chan @${CHAN} Unregistered socket closed #${$c.id} (not in DIC, ignored)`);
    return;
  }

  delete DIC[$c.id];
  if ($c.profile) delete DNAME[$c.profile.title || $c.profile.name];
  KKuTu.publish("disconnRoom", { id: $c.id });

  JLog.alert(`Chan @${CHAN} Exit #${$c.id}`);
};
