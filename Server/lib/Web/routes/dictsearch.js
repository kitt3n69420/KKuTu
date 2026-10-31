/**
 * 단어 찾기 (신 UI 로비 사전) — GET /dict-search
 * 게임(classic.js)과 같은 기준으로 고름: 두음법칙(getSubChar), 다음 사람이 이을 단어 수(getAuto 개수 조회와 같은 길이 조건),
 * 매너일 때 한방·함정·n방 제외(classic.js submit의 checkMannerAndProceed와 같은 검사)
 *
 * lang=ko|en|ja, dir=end(끝말잇기)|front(앞말잇기), mode=long|attack|mission
 * q=이어 받을 글자(앞 사람 단어를 통째로 넣어도 됨 — 게임처럼 그 단어에서 이을 글자를 뽑음), mis=미션 글자
 * q를 비우면(긴 단어·미션만) 그 언어 전체에서 가장 긴 단어 / 미션 글자가 가장 많은 단어 (사용자 요청)
 * 한국어는 자모(ㄱ, ㅏ 등)로 된 단어도 받음
 * manner, injeong, allpos(특수 단어, 한국어만) = 1이면 켬
 * 영어·일본어는 공격적 모드 없음. 일본어는 게임처럼 매너를 따지지 않음(classic.js가 JSH/JAP 매너 검사를 건너뜀)
 * 일본어는 끝에 붙은 작은 가나(っゃゅょ 등)를 몇 개든 모두 건너뛰고 그 앞 글자로 이음 (게임의 jaEdgeChar와 같음)
 */
var MainDB = require("../db");
var Const = require("../../const");
var Util = require("../../Game/games/classic-util");

var LIMIT = 20;
var TYPE = { ko: { end: 'KSH', front: 'KAP' }, en: { end: 'ESH', front: 'EAP' }, ja: { end: 'JSH', front: 'JAP' } };
var CHARS = { ko: /^[가-힣ㄱ-ㆎ]+$/, en: /^[a-z]+$/, ja: /^[ぁ-ゖ]+$/ };
var JA_SMALL = "ゃゅょぁぃぅぇぉっゎ";
var COUNT_TTL = 3600000;
var RESULT_TTL = 600000;
var RESULT_MAX = 300;
var BUSY_MAX = 4;
var BATCH = 60;
var BATCH_MAX = 10;
var OPEN_MAX = 600; // 글자 없이 찾을 때 DB에서 가져올 후보 수 (매너로 걸러질 몫까지)

var counts = {}; // "lang_dir" → { t, map: { 글자: [기본, 어인정, 특수, 어인정+특수] }, wait: [] }
var results = {};
var resultN = 0;
var busy = 0;

exports.run = function (Server) {
	Server.get("/dict-search", function (req, res) {
		var o = parse(req.query);
		var key, hit;

		if (!o) return res.send({ error: 400 });
		key = [o.lang, o.dir, o.mode, o.q, o.mis, o.manner, o.injeong, o.allpos].join("|");
		hit = results[key];
		if (hit && hit.t > Date.now() - RESULT_TTL) return res.send(hit.data);
		if (busy >= BUSY_MAX) return res.send({ error: 429 });
		busy++;
		search(o, function (data) {
			busy--;
			if (!data.error) {
				if (++resultN > RESULT_MAX) {
					results = {};
					resultN = 1;
				}
				results[key] = { t: Date.now(), data: data };
			}
			res.send(data);
		});
	});
};

function parse(p) {
	var o = {
		lang: p.lang, dir: p.dir, mode: p.mode,
		manner: p.manner == "1" && p.lang != "ja", injeong: p.injeong == "1", allpos: p.lang == "ko" && p.allpos == "1"
	};
	var q = String(p.q || "").trim();
	var mis = String(p.mis || "").trim();

	if (!TYPE[o.lang] || !TYPE[o.lang][o.dir] || ["long", "attack", "mission"].indexOf(o.mode) == -1) return null;
	if (o.mode == "attack" && o.lang != "ko") return null;
	if (o.lang == "ja") {
		q = Util.normalizeJaText(q);
		mis = Util.normalizeJaText(mis);
	} else if (o.lang == "en") {
		q = q.toLowerCase();
		mis = mis.toLowerCase();
	}
	if (q ? (q.length > 30 || !CHARS[o.lang].test(q)) : o.mode == "attack") return null;
	if (o.mode == "mission" && (mis.length != 1 || !CHARS[o.lang].test(mis))) return null;
	o.q = q;
	o.mis = o.mode == "mission" ? mis : "";
	// 게임의 my 대신 쓰는 값 (getChar·getSubChar·jaEdgeChar가 mode·opts·rule만 봄)
	o.my = { mode: Const.GAME_TYPE.indexOf(TYPE[o.lang][o.dir]), opts: {}, rule: { lang: o.lang }, game: {} };
	o.front = o.dir == "front";
	o.state = (o.injeong ? 1 : 0) + (o.allpos || o.lang != "ko" ? 2 : 0);
	// 다음 사람이 이을 단어로 세는 최소 길이 (getAuto: 영어 끝말잇기는 4글자 이상)
	o.countMin = (o.lang == "en" && !o.front) ? 4 : 2;
	return o;
}

function search(o, cb) {
	var link = o.q ? Util.getChar.call(o.my, o.q) : "";
	var S = o.q ? starts(o, link) : [];

	getCounts(o, function (map) {
		if (!map) return cb({ error: 500 });
		(o.q ? fetchWords : fetchOpen)(o, S, 2, function (list) {
			var ranked;

			if (!list) return cb({ error: 500 });
			list.forEach(function (x) { annotate(o, map, x); });
			if (o.mode == "mission") list = list.filter(function (x) { return x.m > 0; });
			ranked = list.sort(COMPARE[o.mode]);
			pick(o, map, ranked, function (out) {
				if (!out) return cb({ error: 500 });
				cb({
					q: link,
					subs: S.slice(1),
					total: o.q ? ranked.length : null,
					list: out.map(function (x) {
						var r = { w: x.w, e: x.e, n: x.n };

						if (x.hw && x.hw != x.w) r.hw = x.hw;
						if (o.mode == "mission") r.m = x.m;
						if (x.i) r.i = 1;
						if (x.s) r.s = 1;
						return r;
					})
				});
			});
		});
	});
}

var COMPARE = {
	long: function (a, b) { return (b.w.length - a.w.length) || (a.n - b.n) || cmp(a.w, b.w); },
	attack: function (a, b) { return (a.n - b.n) || (b.w.length - a.w.length) || cmp(a.w, b.w); },
	mission: function (a, b) { return (b.m - a.m) || (b.w.length - a.w.length) || (a.n - b.n) || cmp(a.w, b.w); }
};
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

// 이을 글자와 두음법칙 글자 (게임의 char + subChar)
function starts(o, c) {
	var sub = Util.getSubChar.call(o.my, c);
	var r = [c];

	if (sub) sub.split("|").forEach(function (s) { if (s && r.indexOf(s) == -1) r.push(s); });
	return r;
}
// 이 단어가 앞 단어에 붙는 글자 (끝말잇기: 첫 글자, 앞말잇기: 끝 글자 — 일본어는 끝의 작은 가나를 뺌)
function head(o, w) {
	if (!o.front) return w.charAt(0);
	return o.lang == "ja" ? Util.jaEdgeChar(w, o.my) : w.slice(-1);
}
// 이 단어 다음 사람이 이을 수 있는 단어 수 — 게임의 매너 검사처럼, 이 단어 자신이 그 글자로 이어지는 단어면 뺌
function annotate(o, map, x) {
	var mis;

	x.e = Util.getChar.call(o.my, x.w);
	x.S = starts(o, x.e);
	x.n = x.S.reduce(function (a, c) { return a + (map[c] ? map[c][o.state] : 0); }, 0);
	if (x.w.length >= o.countMin && x.S.indexOf(head(o, x.w)) != -1) x.n--;
	if (o.mis) {
		mis = x.w.split(o.mis).length - 1;
		x.m = mis;
	}
}

// 매너: 한방(이을 단어 없음)을 빼고, 이을 단어가 10개 이하면 그 단어들을 직접 보고 함정(자기 글자로 돌아옴)·n방(이을 단어마다 다시 한방)을 뺌
function pick(o, map, ranked, cb) {
	var out = [];
	var i = 0;
	var round = 0;

	if (!o.manner) return cb(ranked.slice(0, LIMIT));
	(function step() {
		var batch = [];
		var need = [];

		while (i < ranked.length && batch.length < BATCH) {
			var x = ranked[i++];

			if (x.n < 1) continue;
			batch.push(x);
			if (x.n <= 10) x.S.forEach(function (c) { if (need.indexOf(c) == -1) need.push(c); });
		}
		if (!batch.length || ++round > BATCH_MAX) return cb(out);
		if (!need.length) return check([]);
		fetchWords(o, need, o.countMin, function (pool) {
			if (!pool) return cb(null);
			pool.forEach(function (y) { annotate(o, map, y); });
			check(pool);
		});
		function check(pool) {
			batch.forEach(function (x) {
				if (out.length < LIMIT && (x.n > 10 || mannerOK(o, x, pool))) out.push(x);
			});
			if (out.length >= LIMIT) cb(out);
			else step();
		}
	})();
}
function mannerOK(o, x, pool) {
	var avail = pool.filter(function (y) { return y.w != x.w && x.S.indexOf(head(o, y.w)) != -1; });
	var loops = function (y) { return y.S.some(function (c) { return x.S.indexOf(c) != -1; }); };

	if (!avail.length) return false;
	if (avail.length <= 3) return avail.some(function (y) { return !loops(y) && y.n >= 1; });
	return avail.some(function (y) { return !loops(y); });
}

// S의 글자로 이어지는 단어들 (규칙에 맞는 것만)
function fetchWords(o, S, minLen, cb) {
	var alt = S.map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|");
	var re = !o.front ? "^(" + alt + ")" : o.lang == "ja" ? "(" + alt + ")[" + JA_SMALL + "]*$" : "(" + alt + ")$";
	var q = [["_id", new RegExp(re)]];
	var cols = [["_id", true], ["flag", true], ["type", true]];
	var db = MainDB.kkutu[o.lang];
	var find;

	if (!o.injeong) q.push(["flag", { $nand: Const.KOR_FLAG.INJEONG }]);
	if (o.lang == "ko" && !o.allpos) q.push(["type", Const.KOR_GROUP]);
	if (o.lang == "en") q.push(["_id", Const.ENG_ID]);
	if (o.lang == "ja") cols.push(["headword", true]);
	find = db.find.apply(db, q);
	find.limit.apply(find, cols).on(function ($md) {
		cb(($md || []).filter(function (d) {
			return d._id.length >= minLen && S.indexOf(head(o, d._id)) != -1;
		}).map(function (d) {
			return {
				w: d._id, hw: d.headword,
				i: (d.flag & Const.KOR_FLAG.INJEONG) ? 1 : 0,
				s: (o.lang == "ko" && !Const.KOR_GROUP.test(d.type || "")) ? 1 : 0
			};
		}));
	}, null, function () { cb(null); });
}

// 글자 없이: 언어 전체에서 가장 긴 단어 / 미션 글자가 가장 많은 단어 (규칙에 맞는 것만, 앞쪽 OPEN_MAX개)
function fetchOpen(o, S, minLen, cb) {
	var where = ["char_length(_id) >= " + o.countMin];
	var params = [];
	var order = "char_length(_id) DESC, _id";

	if (!o.injeong) where.push("flag & " + Const.KOR_FLAG.INJEONG + " = 0");
	if (o.lang == "ko" && !o.allpos) where.push("type ~ '" + Const.KOR_GROUP.source.replace(/'/g, "''") + "'");
	if (o.lang == "en") where.push("_id ~* '" + Const.ENG_ID.source + "'");
	if (o.mis) {
		params.push(o.mis);
		where.push("strpos(_id, $1) > 0");
		order = "char_length(_id) - char_length(replace(_id, $1, '')) DESC, " + order;
	}
	MainDB.kkutu[o.lang].direct("SELECT _id, flag, type" + (o.lang == "ja" ? ", headword" : "") + " FROM kkutu_" + o.lang
		+ " WHERE " + where.join(" AND ") + " ORDER BY " + order + " LIMIT " + OPEN_MAX, params, function (err, res) {
		if (err || !res) return cb(null);
		cb(res.rows.map(function (d) {
			return {
				w: d._id, hw: d.headword,
				i: (d.flag & Const.KOR_FLAG.INJEONG) ? 1 : 0,
				s: (o.lang == "ko" && !Const.KOR_GROUP.test(d.type || "")) ? 1 : 0
			};
		}));
	});
}

// 글자별 이을 단어 수 (규칙 조합 4가지를 한 번에 세서 1시간 보관). 게임의 kkutu_stats와 같은 조건
function getCounts(o, cb) {
	var k = o.lang + "_" + o.dir;
	var c = counts[k];
	var key, g, sql;

	if (c && c.map && c.t > Date.now() - COUNT_TTL) return cb(c.map);
	if (c && c.wait) return c.wait.push(cb);
	c = counts[k] = { wait: [cb] };
	key = !o.front ? "left(_id, 1)"
		: o.lang == "ja" ? "right(regexp_replace(_id, '[" + JA_SMALL + "]+$', ''), 1)"
		: "right(_id, 1)";
	g = o.lang == "ko" ? "type ~ '" + Const.KOR_GROUP.source.replace(/'/g, "''") + "'" : "TRUE";
	sql = "SELECT " + key + " AS k"
		+ ", count(*) FILTER (WHERE " + g + " AND flag & " + Const.KOR_FLAG.INJEONG + " = 0) AS c0"
		+ ", count(*) FILTER (WHERE " + g + ") AS c1"
		+ ", count(*) FILTER (WHERE flag & " + Const.KOR_FLAG.INJEONG + " = 0) AS c2"
		+ ", count(*) AS c3"
		+ " FROM kkutu_" + o.lang + " WHERE char_length(_id) >= " + o.countMin
		+ (o.lang == "en" ? " AND _id ~ '" + Const.ENG_ID.source + "'" : "")
		+ " GROUP BY 1";
	MainDB.kkutu[o.lang].direct(sql, function (err, res) {
		var wait = c.wait;
		var map = null;

		delete c.wait;
		if (!err && res && res.rows) {
			map = {};
			res.rows.forEach(function (r) { map[r.k] = [+r.c0, +r.c1, +r.c2, +r.c3]; });
			c.map = map;
			c.t = Date.now();
		} else delete counts[k];
		wait.forEach(function (f) { f(map); });
	});
}
