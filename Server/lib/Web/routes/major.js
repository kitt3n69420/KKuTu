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

var Web = require("request");
var MainDB = require("../db");
var Lizard = require("../../sub/lizard");
var JLog = require("../../sub/jjlog");
var GLOBAL = require("../../sub/global.json");
var Const = require("../../const");
var ProfanityFilter = require("../../sub/profanity-filter");
var NicknameGuard = require("../../sub/nickname-guard");
var { validateInput } = require("../validators");
var KO_KR_LANG = require("../lang/ko_KR.json");

function obtain($user, key, value, term, addValue) {
  var now = new Date().getTime();

  if (term) {
    if ($user.box[key]) {
      if (addValue) $user.box[key].value += value;
      else $user.box[key].expire += term;
    } else $user.box[key] = { value: value, expire: Math.round(now * 0.001 + term) };
  } else {
    $user.box[key] = ($user.box[key] || 0) + value;
  }
}
function consume($user, key, value, force) {
  var bd = $user.box[key];

  if (bd.value) {
    // 기한이 끝날 때까지 box 자체에서 사라지지는 않는다. 기한 만료 여부 확인 시점: 1. 로그인 2. box 조회 3. 게임 결과 반영 직전 4. 해당 항목 사용 직전
    if ((bd.value -= value) <= 0) {
      if (force || !bd.expire) delete $user.box[key];
    }
  } else {
    if (($user.box[key] -= value) <= 0) delete $user.box[key];
  }
}

exports.run = function (Server, page) {
  Server.get("/box", function (req, res) {
    if (req.session.profile) {
      /*if(Const.ADMIN.indexOf(req.session.profile.id) == -1){
        return res.send({ error: 555 });
      }*/
    } else {
      return res.send({ error: 400 });
    }
    MainDB.users
      .findOne(["_id", req.session.profile.id])
      .limit(["box", true])
      .on(function ($body) {
        if (!$body) {
          res.send({ error: 400 });
        } else {
          res.send($body.box);
        }
      });
  });
  Server.get("/help", function (req, res) {
    page(req, res, "help", {
      KO_INJEONG: Const.KO_INJEONG,
      KO_LANG: KO_KR_LANG.kkutu,
    });
  });
  Server.get("/ranking", function (req, res) {
    var pg = Number(req.query.p);
    var id = req.query.id;
    var RANK_TABLES = { exp: MainDB.redis, ksh: MainDB.redis_ksh, money: MainDB.redis_money };
    var type = RANK_TABLES.hasOwnProperty(req.query.type) ? req.query.type : 'exp';
    var table = RANK_TABLES[type];

    // 입력 검증
    if (id && !validateInput(id, "string", { maxLength: 50, noSpecialChars: true })) {
      return res.send({ error: 400, message: "Invalid id" });
    }
    if (req.query.p && !validateInput(req.query.p, "number")) {
      return res.send({ error: 400, message: "Invalid page number" });
    }

    // 한끝/부자 랭킹의 LEVEL 표시는 해당 탭의 점수(모드별 점수/money)가 아니라
    // 유저의 전체 경험치 점수를 기준으로 해야 하므로 exp 랭킹에서 별도 조회한다.
    function withExpScore($body) {
      var R = new Lizard.Tail();

      if (type === 'exp' || !$body.data.length) {
        $body.data.forEach(function (item) { item.expScore = item.score; });
        R.go($body);
        return R;
      }
      Lizard.all($body.data.map(function (item) { return MainDB.redis.getScore(item.id); })).then(function (scores) {
        $body.data.forEach(function (item, i) { item.expScore = scores[i] || 0; });
        R.go($body);
      });
      return R;
    }

    if (id) {
      table.getSurround(id, 12).then(function ($body) {
        withExpScore($body).then(function ($body) {
          res.send($body);
        });
      });
    } else {
      if (isNaN(pg)) pg = 0;
      table.getPage(pg, 12).then(function ($body) {
        withExpScore($body).then(function ($body) {
          res.send($body);
        });
      });
    }
  });
  Server.get("/injeong/:word", function (req, res) {
    if (!req.session.profile) return res.send({ error: 402 });
    var word = req.params.word;
    var theme = req.query.theme;
    var now = Date.now();

    // 입력 검증
    if (!validateInput(word, "string", { maxLength: 50, noSpecialChars: true })) {
      return res.send({ error: 400, message: "Invalid word" });
    }
    if (theme && !validateInput(theme, "string", { maxLength: 20 })) {
      return res.send({ error: 400, message: "Invalid theme" });
    }

    if (now - req.session.injBefore < 2000) return res.send({ error: 429 });
    req.session.injBefore = now;

    MainDB.kkutu["ko"].findOne(["_id", word.replace(/[^가-힣0-9]/g, "")]).on(function ($word) {
      if ($word) return res.send({ error: 409 });
      MainDB.kkutu_injeong.findOne(["_id", word]).on(function ($ij) {
        if ($ij) {
          if ($ij.theme == "~") return res.send({ error: 406 });
          else return res.send({ error: 403 });
        }
        Web.get("https://namu.moe/w/" + encodeURI(word), function (err, _res) {
          if (err) return res.send({ error: 400 });
          else if (_res.statusCode != 200) return res.send({ error: 405 });
          MainDB.kkutu_injeong.insert(["_id", word], ["theme", theme], ["createdAt", now], ["writer", req.session.profile.id]).on(function ($res) {
            res.send({ message: "OK" });
          });
        });
      });
    });
  });
  Server.get("/cf/:word", function (req, res) {
    res.send(getCFRewards(req.params.word, Number(req.query.l || 0), req.query.b == "1"));
  });
  Server.get("/shop", function (req, res) {
    MainDB.kkutu_shop
      .find()
      .limit(["cost", true], ["term", true], ["group", true], ["options", true], ["updatedAt", true])
      .on(function ($goods) {
        res.json({ goods: $goods });
      });
    // res.json({ error: 555 });
  });

  // 시스템 오류(DB 오류 등)로 닉네임 저장이 실패했을 때만 사용하는 대체 닉네임 생성/부여
  function makeFallbackCandidates(id) {
    return ["유저" + id.slice(-5), "유저" + id.slice(-8), "유저" + id];
  }
  function assignFallbackNickname(req, res, candidates) {
    candidates = candidates || makeFallbackCandidates(req.session.profile.id);
    if (!candidates.length) return res.send({ error: 500 });

    const candidate = candidates[0];
    const rest = candidates.slice(1);

    MainDB.users
      .update(["_id", req.session.profile.id])
      .set(["nickname", candidate])
      .on(
        function () {
          req.session.profile = { ...req.session.profile, name: candidate, title: candidate, nickname: candidate };
          MainDB.session.update(["_id", req.session.id]).set(["profile", req.session.profile]).on();
          res.send({ result: 200, nickname: candidate, autoAssigned: true });
        },
        null,
        function () {
          assignFallbackNickname(req, res, rest);
        },
      );
  }

  // POST
  Server.post("/profile", function (req, res) {
    let nickname = req.body.nickname;
    const exordial = req.body.exordial;
    const rawNickname = req.body.rawNickname;

    if (!req.session.profile) return res.send({ error: 400 });

    // 입력 검증
    if (nickname && !validateInput(nickname, "string", { maxLength: 12, noSpecialChars: true })) {
      return res.send({ error: 400, message: "Invalid nickname" });
    }
    if (exordial && !validateInput(exordial, "string", { maxLength: 100 })) {
      return res.send({ error: 400, message: "Invalid exordial" });
    }
    if (rawNickname && !validateInput(rawNickname, "string", { maxLength: 50 })) {
      return res.send({ error: 400, message: "Invalid raw nickname" });
    }

    if (exordial !== undefined)
      MainDB.users
        .update(["_id", req.session.profile.id])
        .set(["exordial", exordial.slice(0, 100)])
        .on();
    // console.log("[DEBUG] /profile received nickname:", nickname);
    // if (rawNickname) console.log("[DEBUG] /profile received raw nickname: " + rawNickname + " -> " + nickname);
    if (!nickname) return res.send({ result: 200 });

    // 서버 측 닉네임 욕설/금지어 검사
    // 주의: 일부만 잘라내는 필터링(치환)은 쓰지 않는다.
    // 예) "씨섹스발"에서 "섹스"만 제거하면 남은 부분이 "씨발"이 되어버리는 것처럼,
    // 치환 결과에 새로운 금지어가 생겨날 수 있기 때문에 포함 여부만 검사해 통째로 거부한다.
    if (nickname.length > 12) nickname = nickname.slice(0, 12);
    if (ProfanityFilter.isNicknameForbidden(nickname)) {
      return res.send({ error: 462, message: "Nickname contains a forbidden word" });
    }

    // 서버 측 허용 문자 검증 (클라이언트 우회 대비)
    if (GLOBAL.NICKNAME_LIMIT.REGEX) {
      const policy = new RegExp(GLOBAL.NICKNAME_LIMIT.REGEX[0], GLOBAL.NICKNAME_LIMIT.REGEX[1]);
      if (policy.test(nickname)) {
        return res.send({ error: 400, message: "Invalid nickname characters" });
      }
    }

    MainDB.users.findOne(["nickname", nickname]).on(
      function (data) {
        if (data && data._id !== req.session.profile.id) return res.send({ error: 456 });
        MainDB.users.findOne(["_id", req.session.profile.id]).on(
          function (requester) {
            const now = Number(new Date());

            function proceedToUpdate() {
              MainDB.users
                .update(["_id", req.session.profile.id])
                .set(["nickname", nickname], ["nickChanged", now])
                .on(
                  function () {
                    req.session.profile = { ...req.session.profile, name: nickname, title: nickname, nickname };
                    MainDB.session.update(["_id", req.session.id]).set(["profile", req.session.profile]).on();
                    return res.send({ result: 200 });
                  },
                  null,
                  function (err) {
                    // 사전 검사를 통과했지만 동시 요청으로 유일성 제약이 걸린 경우: 중복으로 안내하고 재시도 유도
                    if (err && err.code === "23505") return res.send({ error: 456 });
                    assignFallbackNickname(req, res);
                  },
                );
            }

            if (GLOBAL.NICKNAME_LIMIT.TERM > 0) {
              // 현재 닉네임이 금지어를 포함하거나 다른 유저와 중복되는 상태라면
              // (금지어 목록이 나중에 추가되었거나, 유일성 제약 이전의 legacy 데이터인 경우)
              // 정상적으로 고칠 기회를 줘야 하므로 변경 주기 제한을 적용하지 않는다.
              NicknameGuard.isCurrentNicknameInvalid(
                MainDB,
                requester.nickname,
                requester._id,
                function (currentInvalid) {
                  if (!currentInvalid) {
                    const changedDate = new Date(Number(requester.nickChanged));

                    changedDate.setDate(changedDate.getDate() + GLOBAL.NICKNAME_LIMIT.TERM);

                    const remaining = Number(changedDate) - now;
                    if (remaining > 0) return res.send({ error: 457, remaining });
                  }
                  proceedToUpdate();
                },
              );
            } else {
              proceedToUpdate();
            }
          },
          null,
          function () {
            assignFallbackNickname(req, res);
          },
        );
      },
      null,
      function () {
        assignFallbackNickname(req, res);
      },
    );
  });

  // 강제 닉네임 설정 흐름에서 /profile 호출 자체가 실패(네트워크 오류 등)했을 때 클라이언트가 호출하는 안전망
  Server.post("/profile/fallback", function (req, res) {
    if (!req.session.profile) return res.send({ error: 400 });

    MainDB.users.findOne(["_id", req.session.profile.id]).on(
      function (requester) {
        if (requester && requester.nickname) {
          return res.send({ result: 200, nickname: requester.nickname });
        }
        assignFallbackNickname(req, res);
      },
      null,
      function () {
        assignFallbackNickname(req, res);
      },
    );
  });
  Server.post("/buy/:id", function (req, res) {
    if (req.session.profile) {
      var uid = req.session.profile.id;
      var gid = req.params.id;

      // 입력 검증
      if (!validateInput(gid, "string", { maxLength: 50, noSpecialChars: true })) {
        return res.json({ error: 400, message: "Invalid item id" });
      }

      MainDB.kkutu_shop.findOne(["_id", gid]).on(function ($item) {
        if (!$item) return res.json({ error: 400 });
        if ($item.cost < 0) return res.json({ error: 400 });
        MainDB.users
          .findOne(["_id", uid])
          .limit(["money", true], ["box", true])
          .on(function ($user) {
            if (!$user) return res.json({ error: 400 });
            if (!$user.box) $user.box = {};
            var postM = $user.money - $item.cost;

            if (postM < 0) return res.send({ result: 400 });

            obtain($user, gid, 1, $item.term);
            MainDB.users
              .update(["_id", uid])
              .set(["money", postM], ["box", $user.box])
              .on(function ($fin) {
                res.send({ result: 200, money: postM, box: $user.box });
                JLog.log("[PURCHASED] " + gid + " by " + uid);
              });
            // HIT를 올리는 데에 동시성 문제가 발생한다. 조심하자.
            MainDB.kkutu_shop
              .update(["_id", gid])
              .set(["hit", $item.hit + 1])
              .on();
          });
      });
    } else res.json({ error: 423 });
  });
  Server.post("/equip/:id", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var uid = req.session.profile.id;
    var gid = req.params.id;
    var isLeft = req.body.isLeft == "true";
    var now = Date.now() * 0.001;

    // 입력 검증
    if (!validateInput(gid, "string", { maxLength: 50, noSpecialChars: true })) {
      return res.json({ error: 400, message: "Invalid item id" });
    }
    if (req.body.isLeft && !validateInput(req.body.isLeft, "boolean")) {
      return res.json({ error: 400, message: "Invalid isLeft value" });
    }

    MainDB.users
      .findOne(["_id", uid])
      .limit(["box", true], ["equip", true])
      .on(function ($user) {
        if (!$user) return res.json({ error: 400 });
        if (!$user.box) $user.box = {};
        if (!$user.equip) $user.equip = {};
        var q = $user.box[gid],
          r;

        MainDB.kkutu_shop
          .findOne(["_id", gid])
          .limit(["group", true])
          .on(function ($item) {
            if (!$item) return res.json({ error: 430 });
            if (!Const.AVAIL_EQUIP.includes($item.group)) return res.json({ error: 400 });

            var part = $item.group;
            if (part.substr(0, 3) == "BDG") part = "BDG";
            if (part == "Mhand") part = isLeft ? "Mlhand" : "Mrhand";
            var qid = $user.equip[part];

            if (qid) {
              r = $user.box[qid];
              if (r && r.expire) {
                obtain($user, qid, 1, r.expire, true);
              } else {
                obtain($user, qid, 1, now + $item.term, true);
              }
            }
            if (qid == $item._id) {
              delete $user.equip[part];
            } else {
              if (!q) return res.json({ error: 430 });
              consume($user, gid, 1);
              $user.equip[part] = $item._id;
            }
            MainDB.users
              .update(["_id", uid])
              .set(["box", $user.box], ["equip", $user.equip])
              .on(function ($res) {
                res.send({ result: 200, box: $user.box, equip: $user.equip });
              });
          });
      });
  });
  Server.post("/payback/:id", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var uid = req.session.profile.id;
    var gid = req.params.id;
    var isDyn = gid.charAt() == "$";

    MainDB.users
      .findOne(["_id", uid])
      .limit(["money", true], ["box", true], ["equip", true])
      .on(function ($user) {
        if (!$user) return res.json({ error: 400 });
        if (!$user.box) $user.box = {};
        var q = $user.box[gid];

        if (!q) return res.json({ error: 430 });
        // 장착 중인 아이템은 환불 불가
        if ($user.equip) {
          for (var part in $user.equip) {
            if ($user.equip[part] === gid) return res.json({ error: 426 });
          }
        }
        MainDB.kkutu_shop
          .findOne(["_id", isDyn ? gid.slice(0, 4) : gid])
          .limit(["cost", true])
          .on(function ($item) {
            if (!$item) return res.json({ error: 430 });

            consume($user, gid, 1, true);
            $user.money = Number($user.money) + Math.round(0.2 * Number($item.cost));
            MainDB.users
              .update(["_id", uid])
              .set(["money", $user.money], ["box", $user.box])
              .on(function ($res) {
                res.send({ result: 200, box: $user.box, money: $user.money });
              });
          });
      });
  });
  function blendWord(word) {
    var lang = parseLanguage(word);
    var i,
      kl = [];
    var kr = [];

    if (lang == "en") return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    if (lang == "ko") {
      for (i = word.length - 1; i >= 0; i--) {
        var k = word.charCodeAt(i) - 0xac00;

        kl.push([Math.floor(k / 28 / 21), Math.floor(k / 28) % 21, k % 28]);
      }
      [0, 1, 2]
        .sort((a, b) => Math.random() < 0.5)
        .forEach((v, i) => {
          kr.push(kl[v][i]);
        });
      return String.fromCharCode((kr[0] * 21 + kr[1]) * 28 + kr[2] + 0xac00);
    }
  }
  function parseLanguage(word) {
    return word.match(/[a-zA-Z]/) ? "en" : "ko";
  }
  Server.post("/cf", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var uid = req.session.profile.id;
    var tray = (req.body.tray || "").split("|");
    var i, o;

    if (tray.length < 1 || tray.length > 10) return res.json({ error: 400 });
    MainDB.users
      .findOne(["_id", uid])
      .limit(["money", true], ["box", true])
      .on(function ($user) {
        if (!$user) return res.json({ error: 400 });
        if (!$user.box) $user.box = {};
        var req = {},
          word = "",
          level = 0;
        var cfr,
          gain = [];
        var blend;

        for (i in tray) {
          word += tray[i].slice(4);
          level += 68 - tray[i].charCodeAt(3);
          req[tray[i]] = (req[tray[i]] || 0) + 1;
          if (($user.box[tray[i]] || 0) < req[tray[i]]) return res.json({ error: 434 });
        }
        MainDB.kkutu[parseLanguage(word)].findOne(["_id", word]).on(function ($dic) {
          if (!$dic) {
            if (word.length == 3) {
              blend = true;
            } else return res.json({ error: 404 });
          }
          cfr = getCFRewards(word, level, blend);
          if ($user.money < cfr.cost) return res.json({ error: 407 });
          for (i in req) consume($user, i, req[i]);
          for (i in cfr.data) {
            o = cfr.data[i];

            if (Math.random() >= o.rate) continue;
            if (o.key.charAt(4) == "?") {
              o.key = o.key.slice(0, 4) + (blend ? blendWord(word) : word.charAt(Math.floor(Math.random() * word.length)));
            }
            obtain($user, o.key, o.value, o.term);
            gain.push(o);
          }
          $user.money -= cfr.cost;
          MainDB.users
            .update(["_id", uid])
            .set(["money", $user.money], ["box", $user.box])
            .on(function ($res) {
              res.send({ result: 200, box: $user.box, money: $user.money, gain: gain });
            });
        });
      });
    // res.send(getCFRewards(req.params.word, Number(req.query.l || 0)));
  });
  Server.get("/craft-check", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var a = req.query.item1;
    var b = req.query.item2;

    if (!a || !b) return res.json({ error: 400 });
    if (!validateInput(a, "string", { maxLength: 64, noSpecialChars: true })) return res.json({ error: 400 });
    if (!validateInput(b, "string", { maxLength: 64, noSpecialChars: true })) return res.json({ error: 400 });

    var items = [a, b].sort();

    // itemA, itemB, recipe 3개 쿼리를 병렬 실행
    var _itemA = null, _itemB = null, _recipe = null, _done = 0, _failed = false;
    function craftCheckDone() {
      if (_failed) return;
      if (++_done < 3) return;
      if (!_itemA || !_itemB) { _failed = true; return res.json({ error: 400 }); }

      function sendResult(recipe) {
        var costA = Math.abs(_itemA.cost || 0);
        var costB = Math.abs(_itemB.cost || 0);
        var craftCost = Math.round(Math.sqrt(costA * costA + costB * costB) / 3);
        res.json({ result: recipe.result, cost: craftCost });
      }

      if (_recipe) return sendResult(_recipe);

      // 정확한 아이템 ID 레시피가 없으면 크래프트 그룹으로 검색
      var gA = Const.getCraftGroup(a);
      var gB = Const.getCraftGroup(b);
      if (!gA && !gB) { _failed = true; return res.json({ result: null, reason: "no_recipe" }); }
      // 그룹명 또는 원래 아이템 ID를 사용하여 검색
      var lookupA = gA || a;
      var lookupB = gB || b;
      var groupItems = [lookupA, lookupB].sort();
      MainDB.crafting.findOne(["item1", groupItems[0]], ["item2", groupItems[1]]).on(function ($gr) {
        if (!$gr) { _failed = true; return res.json({ result: null, reason: "no_recipe" }); }
        sendResult($gr);
      });
    }
    MainDB.kkutu_shop.findOne(["_id", a]).limit(["group", true], ["cost", true]).on(function ($r) { _itemA = $r; craftCheckDone(); });
    MainDB.kkutu_shop.findOne(["_id", b]).limit(["group", true], ["cost", true]).on(function ($r) { _itemB = $r; craftCheckDone(); });
    MainDB.crafting.findOne(["item1", items[0]], ["item2", items[1]]).on(function ($r) { _recipe = $r; craftCheckDone(); });
  });
  Server.post("/craft", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var uid = req.session.profile.id;
    var a = req.body.item1;
    var b = req.body.item2;

    if (!a || !b) return res.json({ error: 400 });
    if (!validateInput(a, "string", { maxLength: 64, noSpecialChars: true })) return res.json({ error: 400 });
    if (!validateInput(b, "string", { maxLength: 64, noSpecialChars: true })) return res.json({ error: 400 });

    var items = [a, b].sort();

    // recipe, user 쿼리를 병렬 실행
    var _recipe = null, _user = null, _phase1 = 0, _failed = false;
    function craftPhase1() {
      if (_failed) return;
      if (++_phase1 < 2) return;
      if (!_user) { _failed = true; return res.json({ error: 400 }); }
      if (!_user.box) _user.box = {};

      function executeCraft(recipe) {
        if (a === b) {
          var bd = _user.box[a];
          var count = (typeof bd === "number") ? bd : (bd && bd.value ? bd.value : 0);
          if (count < 2) { _failed = true; return res.json({ error: 434 }); }
        } else {
          var bdA = _user.box[a];
          var bdB = _user.box[b];
          var countA = (typeof bdA === "number") ? bdA : (bdA && bdA.value ? bdA.value : 0);
          var countB = (typeof bdB === "number") ? bdB : (bdB && bdB.value ? bdB.value : 0);
          if (countA < 1 || countB < 1) { _failed = true; return res.json({ error: 434 }); }
        }

        // itemA, itemB 가격 조회도 병렬 실행
        var _itemA = null, _itemB = null, _phase2 = 0;
        function craftPhase2() {
          if (_failed) return;
          if (++_phase2 < 2) return;
          var costA = Math.abs(_itemA ? _itemA.cost : 0);
          var costB = Math.abs(_itemB ? _itemB.cost : 0);
          var craftCost = Math.round(Math.sqrt(costA * costA + costB * costB) / 3);

          if (_user.money < craftCost) { _failed = true; return res.json({ error: 407 }); }

          consume(_user, a, 1, true);
          consume(_user, b, 1, true);
          obtain(_user, recipe.result, 1);
          _user.money -= craftCost;

          MainDB.users.update(["_id", uid]).set(["money", _user.money], ["box", _user.box]).on(function ($fin) {
            res.send({ result: 200, box: _user.box, money: _user.money, crafted: recipe.result });
            JLog.log("[CRAFTED] " + a + " + " + b + " => " + recipe.result + " by " + uid);
          });
        }
        MainDB.kkutu_shop.findOne(["_id", a]).limit(["cost", true]).on(function ($r) { _itemA = $r; craftPhase2(); });
        MainDB.kkutu_shop.findOne(["_id", b]).limit(["cost", true]).on(function ($r) { _itemB = $r; craftPhase2(); });
      }

      if (_recipe) return executeCraft(_recipe);

      // 정확한 아이템 ID 레시피가 없으면 크래프트 그룹으로 검색
      var gA = Const.getCraftGroup(a);
      var gB = Const.getCraftGroup(b);
      if (!gA && !gB) { _failed = true; return res.json({ error: 400 }); }
      var lookupA = gA || a;
      var lookupB = gB || b;
      var groupItems = [lookupA, lookupB].sort();
      MainDB.crafting.findOne(["item1", groupItems[0]], ["item2", groupItems[1]]).on(function ($gr) {
        if (!$gr) { _failed = true; return res.json({ error: 400 }); }
        executeCraft($gr);
      });
    }
    MainDB.crafting.findOne(["item1", items[0]], ["item2", items[1]]).on(function ($r) { _recipe = $r; craftPhase1(); });
    MainDB.users.findOne(["_id", uid]).limit(["money", true], ["box", true]).on(function ($r) { _user = $r; craftPhase1(); });
  });
  Server.get("/exchange-offers", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var uid = req.session.profile.id;
    var _events = null, _recipes = null, _user = null, _done = 0;

    function done() {
      if (++_done < 3) return;
      if (!_user) return res.json({ error: 400 });
      if (!_user.box) _user.box = {};

      var activeEventIds = (_events || []).filter(Const.isEventActive).map(function (e) { return e._id; });
      var validRecipes = (_recipes || []).filter(function (r) {
        return r.eventid === null || activeEventIds.indexOf(r.eventid) !== -1;
      });
      var offers = validRecipes.filter(function (r) {
        var keys = Object.keys(r.recipe);
        for (var i = 0; i < keys.length; i++) {
          var bd = _user.box[keys[i]];
          var have = (typeof bd === 'number') ? bd : (bd && bd.value ? bd.value : 0);
          if (have < r.recipe[keys[i]]) return false;
        }
        return true;
      }).map(function (r) { return { recipe: r.recipe, result: r.result }; });

      res.json({ offers: offers });
    }
    MainDB.event.find().on(function ($r) { _events = $r || []; done(); });
    MainDB.itemexc.find().on(function ($r) { _recipes = $r || []; done(); });
    MainDB.users.findOne(["_id", uid]).limit(["box", true]).on(function ($r) { _user = $r; done(); });
  });
  Server.post("/exchange", function (req, res) {
    if (!req.session.profile) return res.json({ error: 400 });
    var uid = req.session.profile.id;

    var itemsParam = req.body.items;
    if (!itemsParam) return res.json({ error: 400 });

    var tray;
    try { tray = JSON.parse(itemsParam); } catch (e) { return res.json({ error: 400 }); }
    if (typeof tray !== 'object' || Array.isArray(tray) || tray === null) return res.json({ error: 400 });

    var trayKeys = Object.keys(tray);
    if (trayKeys.length === 0) return res.json({ error: 400 });
    for (var k = 0; k < trayKeys.length; k++) {
      if (!validateInput(trayKeys[k], "string", { maxLength: 64, noSpecialChars: true })) return res.json({ error: 400 });
      if (typeof tray[trayKeys[k]] !== 'number' || tray[trayKeys[k]] < 1 || !Number.isInteger(tray[trayKeys[k]])) return res.json({ error: 400 });
    }

    var _events = null, _recipes = null, _user = null, _phase1 = 0, _failed = false;
    function excPhase1() {
      if (_failed) return;
      if (++_phase1 < 3) return;
      if (!_user) { _failed = true; return res.json({ error: 400 }); }
      if (!_user.box) _user.box = {};

      var activeEventIds = (_events || []).filter(Const.isEventActive).map(function (e) { return e._id; });
      var validRecipes = (_recipes || []).filter(function (r) {
        return r.eventid === null || activeEventIds.indexOf(r.eventid) !== -1;
      });
      var match = null;
      for (var i = 0; i < validRecipes.length; i++) {
        var recipe = validRecipes[i].recipe;
        var recipeKeys = Object.keys(recipe);
        if (recipeKeys.length !== trayKeys.length) continue;
        var ok = true;
        for (var j = 0; j < recipeKeys.length; j++) {
          if (tray[recipeKeys[j]] !== recipe[recipeKeys[j]]) { ok = false; break; }
        }
        if (ok) { match = validRecipes[i]; break; }
      }
      if (!match) { _failed = true; return res.json({ error: 458 }); }

      var matchRecipe = match.recipe;
      var matchKeys = Object.keys(matchRecipe);
      for (var m = 0; m < matchKeys.length; m++) {
        var itemId = matchKeys[m];
        var needed = matchRecipe[itemId];
        var bd = _user.box[itemId];
        var have = (typeof bd === 'number') ? bd : (bd && bd.value ? bd.value : 0);
        if (have < needed) { _failed = true; return res.json({ error: 434 }); }
      }

      for (var c = 0; c < matchKeys.length; c++) {
        consume(_user, matchKeys[c], matchRecipe[matchKeys[c]], true);
      }
      obtain(_user, match.result, 1);

      MainDB.users.update(["_id", uid]).set(["box", _user.box]).on(function () {
        res.json({ result: 200, box: _user.box, exchanged: match.result });
        JLog.log("[EXCHANGED] " + JSON.stringify(tray) + " => " + match.result + " by " + uid);
      });
    }
    MainDB.event.find().on(function ($r) { _events = $r || []; excPhase1(); });
    MainDB.itemexc.find().on(function ($r) { _recipes = $r || []; excPhase1(); });
    MainDB.users.findOne(["_id", uid]).limit(["box", true]).on(function ($r) { _user = $r; excPhase1(); });
  });
  Server.get("/dict/:word", function (req, res) {
    var word = req.params.word;
    var lang = req.query.lang;
    var DB = MainDB.kkutu[lang];

    if (!DB) return res.send({ error: 400 });
    if (!DB.findOne) return res.send({ error: 400 });
    DB.findOne(["_id", word]).on(function ($word) {
      if (!$word) return res.send({ error: 404 });
      res.send({
        word: $word._id,
        mean: $word.mean,
        theme: $word.theme,
        type: $word.type,
      });
    });
  });
};
function getCFRewards(word, level, blend) {
  var R = [];
  var f = {
    len: word.length, // 최대 10
    lev: level, // 최대 18
  };
  var cost = 20 * f.lev;
  var wur = f.len / 36; // 최대 2.867

  if (blend) {
    if (wur >= 0.5) {
      R.push({ key: "$WPA?", value: 1, rate: 1 });
    } else if (wur >= 0.35) {
      R.push({ key: "$WPB?", value: 1, rate: 1 });
    } else if (wur >= 0.05) {
      R.push({ key: "$WPC?", value: 1, rate: 1 });
    }
    cost = Math.round(cost * 0.2);
  } else {
    R.push({ key: "dictPage", value: Math.round(f.len * 0.6), rate: 1 });
    R.push({ key: "boxB4", value: 1, rate: Math.min(1, f.lev / 7) });
    if (f.lev >= 5) {
      R.push({ key: "boxB3", value: 1, rate: Math.min(1, f.lev / 15) });
      cost += 10 * f.lev;
      wur += f.lev / 20;
    }
    if (f.lev >= 10) {
      R.push({ key: "boxB2", value: 1, rate: Math.min(1, f.lev / 30) });
      cost += 20 * f.lev;
      wur += f.lev / 10;
    }
    if (wur >= 0.05) {
      if (wur > 1) R.push({ key: "$WPC?", value: Math.floor(wur), rate: 1 });
      R.push({ key: "$WPC?", value: 1, rate: wur % 1 });
    }
    if (wur >= 0.35) {
      if (wur > 2) R.push({ key: "$WPB?", value: Math.floor(wur / 2), rate: 1 });
      R.push({ key: "$WPB?", value: 1, rate: (wur / 2) % 1 });
    }
    if (wur >= 0.5) {
      R.push({ key: "$WPA?", value: 1, rate: wur / 3 });
    }
  }
  return { data: R, cost: cost };
}
