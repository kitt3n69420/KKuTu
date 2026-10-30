/**
 * 처벌 내역(punishment 테이블) 기록/조회.
 * 인게임 #명령어(master.js)와 디스코드 슬래시 명령어(discord-bot.js)가 함께 기록하고,
 * /legal/punishment 페이지가 toView로 바꿔 보여준다. 테이블 정의는 punishment_log.sql 참고.
 */
var JLog = require("./jjlog");

var KST_OFFSET = 9 * 60 * 60 * 1000;
var DAY = 24 * 60 * 60 * 1000;

// 첫 글자와 마지막 글자만 남기고 가린다. 띄어쓰기는 그대로 둔다.
function maskName(name) {
  if (name.length <= 2) return name.charAt(0) + "*".repeat(name.length - 1);
  return name.charAt(0) + name.slice(1, -1).replace(/\S/g, "*") + name.charAt(name.length - 1);
}
function maskIp(ip) {
  var v4 = ip.split(".");
  if (v4.length == 4) return v4.slice(0, 2).join(".") + ".***.***";
  return ip.split(":").slice(0, 2).join(":") + ":***";
}
function kstDay(ms) {
  return Math.floor((Number(ms) + KST_OFFSET) / DAY);
}
function formatDate(ms) {
  return new Date(Number(ms) + KST_OFFSET).toISOString().slice(0, 10);
}

function insert(DB, target, name, kind, reason, expires, admin, note) {
  DB.punishment.direct(
    "INSERT INTO punishment (target, name, kind, reason, expires, admin, createdat, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [target, name, kind, reason, expires || null, admin, Date.now(), note || null],
    function (err) {
      if (err) JLog.error(`[Punishment] 처벌 내역 기록 실패 (${kind} ${target}): ${err.toString()}`);
    },
  );
}

// kind: "ban" | "ipban", expires: 만료 시각(ms, 없으면 영구), admin: 처리한 관리자 아이디
function add(DB, target, kind, reason, expires, admin) {
  if (kind != "ban") return insert(DB, target, null, kind, reason, expires, admin);

  DB.users.findOne(["_id", target]).on(function (user) {
    if (!user) return JLog.warn(`[Punishment] 없는 유저 #${target}의 제재는 기록하지 않습니다.`);
    insert(DB, target, user.nickname ? maskName(user.nickname) : null, kind, reason, expires, admin);
  });
}

// 아직 해제되지 않은 해당 대상의 kind 처벌을 해제 처리한다.
function lift(DB, target, kind, admin) {
  DB.punishment.direct(
    "UPDATE punishment SET liftedat = $1, liftedby = $2 WHERE target = $3 AND $4 = ANY(string_to_array(kind, ',')) AND liftedat IS NULL",
    [Date.now(), admin, target, kind],
    function (err) {
      if (err) JLog.error(`[Punishment] 처벌 해제 기록 실패 (${kind} ${target}): ${err.toString()}`);
    },
  );
}

// 별명을 기본 별명(유저 + 아이디에서 처음 나오는 숫자 5개)으로 강제로 바꾸고 기록한다.
// 다른 유저와 겹치면 숫자를 8개, 10개로 늘린다. callback(err, 바뀐 별명)
function resetNickname(DB, target, reason, admin, callback) {
  DB.users.findOne(["_id", target]).on(function (user) {
    if (!user) return callback(new Error(`아이디 "${target}"를 가진 유저를 찾을 수 없습니다.`));

    var digits = target.replace(/\D/g, "");
    var candidates = [5, 8, 10]
      .map(function (n) {
        return "유저" + digits.slice(0, n);
      })
      .filter(function (nick, i, list) {
        return list.indexOf(nick) == i;
      });

    (function tryNext() {
      var nick = candidates.shift();
      if (!nick) return callback(new Error("기본 별명이 모두 다른 유저와 겹칩니다."));

      DB.users.direct("UPDATE users SET nickname = $1 WHERE _id = $2", [nick, target], function (err) {
        if (err && err.code === "23505") return tryNext();
        if (err) return callback(err);

        // 게임 서버는 재접속할 때 session 테이블의 profile을 읽으므로 같이 바꿔 둔다.
        DB.session.direct(
          "UPDATE session SET profile = (profile::jsonb || jsonb_build_object('nickname', $1::text, 'name', $1::text, 'title', $1::text))::json WHERE profile->>'id' = $2",
          [nick, target],
          function (err) {
            if (err) JLog.error(`[Punishment] 세션 별명 갱신 실패 (#${target}): ${err.toString()}`);
          },
        );
        insert(DB, target, maskName(nick), "nick", reason, null, admin, user.nickname ? "이전 닉네임: " + maskName(user.nickname) : null);
        callback(null, nick);
      });
    })();
  });
}

function toView(row) {
  var kinds = row.kind.split(",");
  var days = row.expires ? kstDay(row.expires) - kstDay(row.createdat) : 0;
  var isBan = kinds.indexOf("ban") != -1 || kinds.indexOf("ipban") != -1;

  return {
    date: formatDate(row.createdat) + (isBan && row.expires ? " ~ " + formatDate(row.expires) : ""),
    user: kinds.indexOf("ipban") != -1 ? maskIp(row.target) : row.name ? `${row.name} (${row.target})` : row.target,
    types: kinds.map(function (kind) {
      switch (kind) {
        case "ban":
          return days ? `게임 이용 제한 ${days}일` : "게임 영구 차단";
        case "ipban":
          return days ? `아이피 차단 ${days}일` : "아이피 영구 차단";
        case "nick":
          return "닉네임 변경";
        case "reset":
          return "스탯 초기화";
      }
      return kind;
    }),
    cls: isBan ? (row.expires ? "ban-temp" : "ban-perm") : null,
    reason: row.reason,
    note: row.note,
    lifted: row.liftedat ? `${formatDate(row.liftedat)}에 해제됨` : null,
  };
}

exports.add = add;
exports.lift = lift;
exports.resetNickname = resetNickname;
exports.toView = toView;
exports.formatDate = formatDate;
