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

var File = require("fs");
var MainDB = require("../db");
var GLOBAL = require("../../sub/global.json");
var JLog = require("../../sub/jjlog");
var Lizard = require("../../sub/lizard.js");
var { validateInput } = require("../validators");

exports.run = function (Server, page) {
  Server.get("/gwalli", function (req, res) {
    if (!checkAdmin(req, res)) return;

    req.session.admin = true;
    page(req, res, "gwalli");
  });
  Server.get("/gwalli/injeong", function (req, res) {
    if (!checkAdmin(req, res)) return;

    MainDB.kkutu_injeong
      .find(["theme", { $not: "~" }])
      .limit(100)
      .on(function ($list) {
        res.send({ list: $list });
      });
  });
  Server.get("/gwalli/gamsi", function (req, res) {
    if (!checkAdmin(req, res)) return;

    // Validate inputs
    if (!validateInput(req.query.id, "string", { maxLength: 50, noSpecialChars: true })) {
      return res.sendStatus(400);
    }

    MainDB.users
      .findOne(["_id", req.query.id])
      .limit(["server", true])
      .on(function ($u) {
        if (!$u) return res.sendStatus(404);
        var data = { _id: $u._id, server: $u.server };

        MainDB.session
          .findOne(["profile.id", $u._id])
          .limit(["profile", true])
          .on(function ($s) {
            if ($s) data.title = $s.profile.title || $s.profile.name;
            res.send(data);
          });
      });
  });
  Server.get("/gwalli/users", function (req, res) {
    if (!checkAdmin(req, res)) return;

    // Validate inputs
    if (req.query.name && !validateInput(req.query.name, "string", { maxLength: 50, noSpecialChars: true })) {
      return res.sendStatus(400);
    }
    if (req.query.id && !validateInput(req.query.id, "string", { maxLength: 50, noSpecialChars: true })) {
      return res.sendStatus(400);
    }

    if (req.query.name) {
      MainDB.session.find(["profile.title", req.query.name]).on(function ($u) {
        if ($u) return onSession($u);
        MainDB.session.find(["profile.name", req.query.name]).on(function ($u) {
          if ($u) return onSession($u);
          res.sendStatus(404);
        });
      });
    } else {
      MainDB.users.findOne(["_id", req.query.id]).on(function ($u) {
        if ($u) return res.send({ list: [$u] });
        res.sendStatus(404);
      });
    }
    function onSession(list) {
      var board = {};

      Lizard.all(
        list.map(function (v) {
          if (board[v.profile.id]) return null;
          else {
            board[v.profile.id] = true;
            return getProfile(v.profile.id);
          }
        }),
      ).then(function (data) {
        res.send({ list: data });
      });
    }
    function getProfile(id) {
      var R = new Lizard.Tail();

      if (id)
        MainDB.users.findOne(["_id", id]).on(function ($u) {
          R.go($u);
        });
      else R.go(null);
      return R;
    }
  });
  Server.get("/gwalli/kkutudb/:word", function (req, res) {
    if (!checkAdmin(req, res)) return;

    // lang 파라미터 화이트리스트 검증
    const ALLOWED_LANGS = ['ko', 'en', 'ja', 'th'];
    if (!ALLOWED_LANGS.includes(req.query.lang)) {
      JLog.warn('[SECURITY] Invalid lang parameter:', req.query.lang);
      return res.sendStatus(400);
    }

    var TABLE = MainDB.kkutu[req.query.lang];

    if (!TABLE) return res.sendStatus(400);
    if (!TABLE.findOne) return res.sendStatus(400);
    TABLE.findOne(["_id", req.params.word]).on(function ($doc) {
      res.send($doc);
    });
  });
  Server.get("/gwalli/kkututheme", function (req, res) {
    if (!checkAdmin(req, res)) return;

    // lang 파라미터 화이트리스트 검증
    const ALLOWED_LANGS = ['ko', 'en', 'ja', 'th'];
    if (!ALLOWED_LANGS.includes(req.query.lang)) {
      JLog.warn('[SECURITY] Invalid lang parameter:', req.query.lang);
      return res.sendStatus(400);
    }

    var TABLE = MainDB.kkutu[req.query.lang];

    if (!TABLE) return res.sendStatus(400);
    if (!TABLE.find) return res.sendStatus(400);

    // ReDoS 방어: theme 파라미터 검증
    if (!req.query.theme || typeof req.query.theme !== 'string') {
      JLog.warn('[SECURITY] Invalid theme parameter type');
      return res.sendStatus(400);
    }
    if (req.query.theme.length > 50) {
      JLog.warn('[SECURITY] theme parameter too long');
      return res.sendStatus(400);
    }
    // 위험한 정규식 패턴 차단 (중첩된 반복자, 백트래킹 유발 패턴)
    if (/[*+]{2,}/.test(req.query.theme) || /\(.*[*+].*\).*[*+]/.test(req.query.theme)) {
      JLog.warn('[SECURITY] Dangerous regex pattern detected:', req.query.theme);
      return res.sendStatus(400);
    }

    try {
      var regex = new RegExp(req.query.theme);
      TABLE.find(["theme", regex])
        .limit(["_id", true])
        .on(function ($docs) {
          res.send({ list: $docs.map((v) => v._id) });
        });
    } catch (e) {
      JLog.warn('[SECURITY] Invalid regex pattern:', e.message);
      return res.sendStatus(400);
    }
  });
  Server.get("/gwalli/kkutuhot", function (req, res) {
    if (!checkAdmin(req, res)) return;

    File.readFile(GLOBAL.KKUTUHOT_PATH, function (err, file) {
      var data = JSON.parse(file.toString());

      parseKKuTuHot().then(function ($kh) {
        res.send({ prev: data, data: $kh });
      });
    });
  });
  Server.get("/gwalli/shop/:key", function (req, res) {
    if (!checkAdmin(req, res)) return;

    var q = req.params.key == "~ALL" ? undefined : ["_id", req.params.key];

    MainDB.kkutu_shop.find(q).on(function ($docs) {
      MainDB.kkutu_shop_desc.find(q).on(function ($desc) {
        res.send({ goods: $docs, desc: $desc });
      });
    });
  });
  Server.post("/gwalli/injeong", function (req, res) {
    if (!checkAdmin(req, res)) return;

    // Validate inputs
    if (!validateInput(req.body.pw, "string", { maxLength: 100 })) {
      return res.sendStatus(400);
    }
    if (!validateInput(req.body.list, "string", { maxLength: 10000 })) {
      return res.sendStatus(400);
    }

    if (req.body.pw != GLOBAL.PASS) return res.sendStatus(400);

    // JSON.parse 검증
    if (!req.body.list || typeof req.body.list !== 'string') {
      JLog.warn('[SECURITY] Invalid req.body.list type');
      return res.sendStatus(400);
    }

    var parsed, list;
    try {
      parsed = JSON.parse(req.body.list);
      list = parsed.list;
    } catch (e) {
      JLog.warn('[SECURITY] JSON.parse failed for req.body.list:', e.message);
      return res.sendStatus(400);
    }

    // Validate parsed list
    if (!Array.isArray(list)) return res.sendStatus(400);
    list.forEach(function (v) {
      if (v && typeof v === "object") {
        if (!validateInput(v.theme, "string", { maxLength: 50 })) return res.sendStatus(400);
      }
    });

    var themes;

    list.forEach(function (v) {
      if (v.ok) {
        req.body.nof = true;
        req.body.lang = "ko";
        v.theme.split(",").forEach(function (w, i) {
          setTimeout(
            function (lid, x) {
              req.body.list = lid;
              req.body.theme = x;
              onKKuTuDB(req, res);
            },
            i * 1000,
            v._id.replace(/[^가-힣0-9]/g, ""),
            w,
          );
        });
      } else {
        MainDB.kkutu_injeong.update(["_id", v._origin]).set(["theme", "~"]).on();
      }
      // MainDB.kkutu_injeong.remove([ '_id', v._origin ]).on();
    });
    res.sendStatus(200);
  });
  Server.post("/gwalli/kkutudb", onKKuTuDB);
  function onKKuTuDB(req, res) {
    if (!checkAdmin(req, res)) return;
    if (req.body.pw != GLOBAL.PASS) return res.sendStatus(400);

    // lang 파라미터 화이트리스트 검증
    const ALLOWED_LANGS = ['ko', 'en', 'ja', 'th'];
    if (!ALLOWED_LANGS.includes(req.body.lang)) {
      JLog.warn('[SECURITY] Invalid lang parameter:', req.body.lang);
      return res.sendStatus(400);
    }

    var theme = req.body.theme;
    var list = req.body.list;
    var TABLE = MainDB.kkutu[req.body.lang];

    if (list) list = list.split(/[,\r\n]+/);
    else return res.sendStatus(400);
    if (!TABLE) return res.sendStatus(400);
    if (!TABLE.insert) return res.sendStatus(400);

    noticeAdmin(req, theme, list.length);
    list.forEach(function (item) {
      if (!item) return;
      item = item.trim();
      if (!item.length) return;
      TABLE.findOne(["_id", item]).on(function ($doc) {
        if (!$doc) return TABLE.insert(["_id", item], ["type", "INJEONG"], ["theme", theme], ["mean", "＂1＂"], ["flag", 2]).on();
        var means = $doc.mean.split(/＂[0-9]+＂/g).slice(1);
        var len = means.length;

        if ($doc.theme.indexOf(theme) == -1) {
          $doc.type += ",INJEONG";
          $doc.theme += "," + theme;
          $doc.mean += `＂${len + 1}＂`;
          TABLE.update(["_id", item]).set(["type", $doc.type], ["theme", $doc.theme], ["mean", $doc.mean]).on();
        } else {
          JLog.warn(`Word '${item}' already has the theme '${theme}'!`);
        }
      });
    });
    if (!req.body.nof) res.sendStatus(200);
  }
  Server.post("/gwalli/kkutudb/:word", function (req, res) {
    if (!checkAdmin(req, res)) return;
    if (req.body.pw != GLOBAL.PASS) return res.sendStatus(400);

    // lang 파라미터 화이트리스트 검증
    const ALLOWED_LANGS = ['ko', 'en', 'ja', 'th'];
    if (!ALLOWED_LANGS.includes(req.body.lang)) {
      JLog.warn('[SECURITY] Invalid lang parameter:', req.body.lang);
      return res.sendStatus(400);
    }

    var TABLE = MainDB.kkutu[req.body.lang];

    // JSON.parse 검증
    if (!req.body.data || typeof req.body.data !== 'string') {
      JLog.warn('[SECURITY] Invalid req.body.data type');
      return res.sendStatus(400);
    }

    var data;
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      JLog.warn('[SECURITY] JSON.parse failed for req.body.data:', e.message);
      return res.sendStatus(400);
    }

    if (!TABLE) return res.sendStatus(400);
    if (!TABLE.upsert) return res.sendStatus(400);

    noticeAdmin(req, data._id);
    if (data.mean == "") {
      TABLE.remove(["_id", data._id]).on(function ($res) {
        res.send($res.toString());
      });
    } else {
      TABLE.upsert(["_id", data._id])
        .set(["flag", data.flag], ["type", data.type], ["theme", data.theme], ["mean", data.mean])
        .on(function ($res) {
          res.send($res.toString());
        });
    }
  });
  Server.post("/gwalli/kkutuhot", function (req, res) {
    if (!checkAdmin(req, res)) return;
    if (req.body.pw != GLOBAL.PASS) return res.sendStatus(400);

    noticeAdmin(req);
    parseKKuTuHot().then(function ($kh) {
      var i,
        j,
        obj = {};

      for (i in $kh) {
        for (j in $kh[i]) {
          obj[$kh[i][j]._id] = $kh[i][j].hit;
        }
      }
      File.writeFile(GLOBAL.KKUTUHOT_PATH, JSON.stringify(obj), function (err) {
        res.send(err);
      });
    });
  });
  Server.post("/gwalli/users", function (req, res) {
    if (!checkAdmin(req, res)) return;
    if (req.body.pw != GLOBAL.PASS) return res.sendStatus(400);

    // JSON.parse 검증
    if (!req.body.list || typeof req.body.list !== 'string') {
      JLog.warn('[SECURITY] Invalid req.body.list type');
      return res.sendStatus(400);
    }

    var parsed, list;
    try {
      parsed = JSON.parse(req.body.list);
      list = parsed.list;
    } catch (e) {
      JLog.warn('[SECURITY] JSON.parse failed for req.body.list:', e.message);
      return res.sendStatus(400);
    }

    if (!Array.isArray(list)) {
      JLog.warn('[SECURITY] list is not an array');
      return res.sendStatus(400);
    }

    // 필드 화이트리스트 검증
    const ALLOWED_USER_FIELDS = ['_id', 'money', 'score', 'box', 'exordial', 'nickname', 'record'];
    list.forEach(function (item) {
      if (!item || typeof item !== 'object' || !item._id) {
        JLog.warn('[SECURITY] Invalid item in users list');
        return;
      }

      // 화이트리스트 필드만 추출
      var safeData = {};
      for (var key in item) {
        if (item.hasOwnProperty(key) && ALLOWED_USER_FIELDS.includes(key)) {
          safeData[key] = item[key];
        }
      }

      MainDB.users.upsert(["_id", item._id]).set(safeData).on();
    });
    res.sendStatus(200);
  });
  Server.post("/gwalli/shop", function (req, res) {
    if (!checkAdmin(req, res)) return;
    if (req.body.pw != GLOBAL.PASS) return res.sendStatus(400);

    // JSON.parse 검증
    if (!req.body.list || typeof req.body.list !== 'string') {
      JLog.warn('[SECURITY] Invalid req.body.list type');
      return res.sendStatus(400);
    }

    var parsed, list;
    try {
      parsed = JSON.parse(req.body.list);
      list = parsed.list;
    } catch (e) {
      JLog.warn('[SECURITY] JSON.parse failed for req.body.list:', e.message);
      return res.sendStatus(400);
    }

    if (!Array.isArray(list)) {
      JLog.warn('[SECURITY] list is not an array');
      return res.sendStatus(400);
    }

    // 필드 화이트리스트 검증
    const ALLOWED_SHOP_FIELDS = ['_id', 'cost', 'term', 'group', 'options'];
    list.forEach(function (item) {
      if (!item || typeof item !== 'object' || !item._id || !item.core) {
        JLog.warn('[SECURITY] Invalid item in shop list');
        return;
      }

      // options는 JSON 문자열일 수 있으므로 파싱
      if (typeof item.core.options === 'string') {
        try {
          item.core.options = JSON.parse(item.core.options);
        } catch (e) {
          JLog.warn('[SECURITY] JSON.parse failed for item.core.options:', e.message);
          return;
        }
      }

      // 화이트리스트 필드만 추출
      var safeCore = {};
      for (var key in item.core) {
        if (item.core.hasOwnProperty(key) && ALLOWED_SHOP_FIELDS.includes(key)) {
          safeCore[key] = item.core[key];
        }
      }

      MainDB.kkutu_shop.upsert(["_id", item._id]).set(safeCore).on();
      if (item.text) {
        MainDB.kkutu_shop_desc.upsert(["_id", item._id]).set(item.text).on();
      }
    });
    res.sendStatus(200);
  });
};
function noticeAdmin(req, ...args) {
  JLog.info(`[ADMIN] ${req.originalUrl} ${req.ip} | ${args.join(" | ")}`);
}
function checkAdmin(req, res) {
  if (global.isPublic) {
    if (req.session.profile) {
      if (GLOBAL.ADMIN.indexOf(req.session.profile.id) == -1) {
        req.session.admin = false;
        return (res.send({ error: 400 }), false);
      }
    } else {
      req.session.admin = false;
      return (res.send({ error: 400 }), false);
    }
  }
  return true;
}
function parseKKuTuHot() {
  var R = new Lizard.Tail();

  Lizard.all([
    query(`SELECT * FROM kkutu_ko WHERE hit > 0 ORDER BY hit DESC LIMIT 50`),
    query(`SELECT * FROM kkutu_ko WHERE _id ~ '^...$' AND hit > 0 ORDER BY hit DESC LIMIT 50`),
    query(`SELECT * FROM kkutu_ko WHERE type = 'INJEONG' AND hit > 0 ORDER BY hit DESC LIMIT 50`),
    query(`SELECT * FROM kkutu_en WHERE hit > 0 ORDER BY hit DESC LIMIT 50`),
  ]).then(function ($docs) {
    R.go($docs);
  });
  function query(q) {
    var R = new Lizard.Tail();

    MainDB.kkutu["ko"].direct(q, function (err, $docs) {
      if (err) return JLog.error(err.toString());
      R.go($docs.rows);
    });
    return R;
  }
  return R;
}
