/**
 * kkutu_classic_ko / _en 생성기: 레벨 5 봇(끝말잇기 계열)용 후보 단어 테이블
 *
 * 실행: cd KKuTu-master/tools && node build_classic_table.js [ko|en]   (언어를 생략하면 둘 다. kkutu_* 단어가 바뀌면 다시 실행)
 *       메모리가 모자라면 node --max-old-space-size=4096 build_classic_table.js
 *
 * 모든 단어를 저장하지 않고, 연결 글자(link)마다 "낼 만한" 후보만 상위 몇 개씩 남긴다. 테이블 구조와 풀(V/M/A/B)의
 * 의미는 Server/lib/Game/games/classic-table.js 머리말을 참고. 옵션에 따라 달라지는 판정은 런타임에서 한다.
 *
 * 자주 나오는 끝 글자: 한국어는 exit 글자 빈도 누적 COVER 비율을 덮는 연결 글자만 담는다. 나머지는 봇이 기존 로직을 쓴다. 영어는 전부 담는다.
 * 한방/공격 후보(A/B): exit 글자 뒤로 이어 갈 수 있는 단어 수(kkutu_stats_*, 표준 두음 합산)가 LOW 이하인 단어를
 *   방 상태(16가지)마다 따로 상위 몇 개씩 뽑아 합친다. 실제 판정은 런타임에서 방 옵션과 이미 나온 단어를 반영해 다시 한다.
 * 제외: 한국어에서 theme 가 정확히 'KPT'(국내 특허) 단독인 단어
 * 영어: 알파벳 단어(Const.ENG_ID)이고 4글자 이상인 단어만(getAuto ESH 규칙 / kkutu_stats_en과 같은 기준).
 */
var Const = require('../Server/lib/const');
var util = require('../Server/lib/Game/games/classic-util');
var T = require('../Server/lib/Game/games/classic-table');

var COVER = 0.97; // 한국어 연결 글자 커버리지
var LOW = 5; // 이 값 이하로 이을 단어가 남으면 공격 후보
var K_V = 6, K_V_UNI = 2; // V 풀: 길이 구간마다 상위 K_V개 + 범용 단어 보장
var K_M = 4, K_M_UNI = 1; // M 풀: 미션 글자마다
var K_A = 3, K_A_UNI = 1; // A/B 풀: 길이 구간 x 방 상태마다
var BUCKETS = ["all", "short", "2", "3", "4"];

var missionChars = T.MISSION_CHARS;

// 후보 비교. a가 b보다 좋은가
function betterV(a, b) {
	if (a.score !== b.score) return a.score > b.score;
	if (a.hit !== b.hit) return a.hit > b.hit;
	return a.word < b.word;
}
function betterA(a, b) {
	if (a.low !== b.low) return a.low < b.low; // 남는 단어가 적을수록 좋다
	return betterV(a, b);
}

function insert(arr, item, better, k) {
	if (arr.length >= k && !better(item, arr[arr.length - 1])) return;
	var i = arr.length;
	while (i > 0 && better(item, arr[i - 1])) i--;
	arr.splice(i, 0, item);
	if (arr.length > k) arr.pop();
}

function offer(map, key, item, better, k, kUni) {
	var e = map.get(key);
	if (!e) map.set(key, e = { main: [], uni: [], better: better });
	insert(e.main, item, better, k);
	if (item.uni) insert(e.uni, item, better, kUni);
}

/** 풀 하나를 순위 있는 행으로 (main + 범용 보강, 단어 중복 제거) */
function flush(map, out, keyParts) {
	map.forEach(function (e, key) {
		var p = key.split("");
		var seen = new Set();
		var merged = [];
		e.main.concat(e.uni).forEach(function (it) {
			if (seen.has(it.word)) return;
			seen.add(it.word);
			merged.push(it);
		});
		merged.sort(function (a, b) { return e.better(a, b) ? -1 : e.better(b, a) ? 1 : 0; });
		merged.forEach(function (it, idx) {
			out.push({ dir: p[0], link: p[1], pool: p[2], sub: p[3], rank: idx + 1, word: it.word, len: it.len, exitc: it.exitc, wflag: it.wflag, hit: it.hit });
		});
	});
}

/** (방향, exit 글자, 구간)에서 이을 수 있는 단어 수를 상태(0~15)별 배열로 (표준 두음 합산). stats: Map(char -> doc) */
function makeLowCounter(lang, dir, stats) {
	var modeIdx = Const.GAME_TYPE.indexOf(lang === "ko" ? (dir === "E" ? "KSH" : "KAP") : (dir === "E" ? "ESH" : "EAP"));
	var fake = { mode: modeIdx, opts: {} };
	var cache = new Map();
	return function (ch, bucket) {
		var key = ch + "" + bucket;
		var hit = cache.get(key);
		if (hit !== undefined) return hit;
		var chars = [ch];
		if (lang === "ko") {
			var sc = util.getSubChar.call(fake, ch);
			if (sc) sc.split("|").forEach(function (c) { if (c && chars.indexOf(c) < 0) chars.push(c); });
		}
		var byState = [];
		for (var s = 0; s < 16; s++) {
			var col;
			if (lang === "ko") col = (dir === "E" ? "start" : "end") + bucket + "_" + s;
			else col = (bucket === "all" ? "count" : bucket === "short" ? "countshort" : "count" + bucket) + "_" + s;
			var total = 0;
			for (var i = 0; i < chars.length; i++) {
				var doc = stats.get(chars[i]);
				if (doc && doc[col]) total += doc[col];
			}
			byState.push(total);
		}
		cache.set(key, byState);
		return byState;
	};
}

/** 상태별 배열 두 개의 원소별 최솟값 */
function minByState(a, b) {
	return a.map(function (v, i) { return Math.min(v, b[i]); });
}

/**
 * 한방/공격 후보는 방 상태(어인정 금지/깐깐/외래어 금지/전품사 16가지)마다 "낮은 글자"가 다르다.
 * 상태별로 따로 상위 K개씩 뽑아 합쳐야, 가장 엄격한 상태에서만 낮은 글자가 후보를 독차지하지 않는다.
 */
function offerLow(map, dir, entry, pool, cls, item, lowByState) {
	for (var s = 0; s < 16; s++) {
		if (lowByState[s] > LOW || !T.isValid(s, item.wflag)) continue;
		var it = { word: item.word, len: item.len, exitc: item.exitc, wflag: item.wflag, hit: item.hit, uni: item.uni, score: item.score, low: lowByState[s] };
		offer(map, [dir, entry, pool, cls, s].join(""), it, betterA, K_A, K_A_UNI);
	}
}

/** 상태별로 나뉜 키(dir, link, pool, sub, state)를 (dir, link, pool, sub)로 합친다. 같은 단어는 가장 낮은 값으로 한 번만 */
function mergeStates(map) {
	var merged = new Map();
	map.forEach(function (e, key) {
		var p = key.split("");
		var base = p.slice(0, 4).join("");
		var m = merged.get(base);
		if (!m) merged.set(base, m = { main: [], uni: [], better: betterA });
		e.main.concat(e.uni).forEach(function (it) {
			var prev = null;
			for (var i = 0; i < m.main.length; i++) if (m.main[i].word === it.word) { prev = m.main[i]; break; }
			if (!prev) m.main.push(it);
			else if (it.low < prev.low) prev.low = it.low;
		});
	});
	return merged;
}

/**
 * rows: [{_id, type, flag, hit, theme}], stats: Map(char -> stats doc)
 * -> 테이블 행 배열
 */
function build(rows, lang, stats) {
	var isKo = lang === "ko";
	var words = [];

	// 1. 유효 단어와 wflag 정리
	rows.forEach(function (r) {
		var word = r._id;
		if (!word) return;
		var len = word.length;
		var flag = r.flag || 0;
		var wflag;
		if (isKo) {
			if (len < 2 || r.theme === "KPT") return; // 주제가 'KPT'(국내 특허) 단독인 단어는 제외
			var type = r.type || "";
			wflag = 0;
			if (flag & Const.KOR_FLAG.LOANWORD) wflag |= T.WFLAG.LOAN;
			if (flag & Const.KOR_FLAG.INJEONG) wflag |= T.WFLAG.INJEONG;
			if (type.match(Const.KOR_STRICT) && flag < 4) wflag |= T.WFLAG.STRICT;
			if (type.match(Const.KOR_GROUP)) wflag |= T.WFLAG.GROUP;
		} else {
			if (len < 4 || !Const.ENG_ID.test(word)) return;
			// 영어는 어인정만 방 옵션으로 갈린다(외래어/깐깐/품사 판정 없음)
			wflag = (flag & Const.KOR_FLAG.INJEONG ? T.WFLAG.INJEONG : 0) | T.WFLAG.STRICT | T.WFLAG.GROUP;
		}
		words.push({ word: word, len: len, hit: r.hit || 0, wflag: wflag });
	});

	// 2. 방향별 연결 글자 커버리지
	var covered = { E: new Set(), F: new Set() };
	["E", "F"].forEach(function (dir) {
		var pop = new Map();
		words.forEach(function (w) {
			var exitc = dir === "E" ? w.word[w.len - 1] : w.word[0];
			pop.set(exitc, (pop.get(exitc) || 0) + 1);
		});
		if (!isKo) { words.forEach(function (w) { covered[dir].add(w.word[0]); covered[dir].add(w.word[w.len - 1]); }); return; }
		var sorted = Array.from(pop.entries()).sort(function (a, b) { return b[1] - a[1]; });
		var acc = 0, total = words.length;
		for (var i = 0; i < sorted.length && acc < total * COVER; i++) {
			covered[dir].add(sorted[i][0]);
			acc += sorted[i][1];
		}
	});

	// 3. 풀 만들기
	var counters = { E: makeLowCounter(lang, "E", stats), F: makeLowCounter(lang, "F", stats) };
	var pools = { V: new Map(), M: new Map(), A: new Map(), B: new Map() };
	var SEP = "";

	words.forEach(function (w) {
		var word = w.word, len = w.len;
		var cls = T.lenClass(len);
		var base = Math.pow(5 + 7 * len, 0.74);
		var uni = T.isUniversal(w.wflag);

		var counts = null;
		["E", "F"].forEach(function (dir) {
			var entry = dir === "E" ? word[0] : word[len - 1];
			if (!covered[dir].has(entry)) return;
			var exitc = dir === "E" ? word[len - 1] : word[0];
			var base_item = { word: word, len: len, exitc: exitc, wflag: w.wflag, hit: w.hit, uni: uni, score: base, low: 0 };

			offer(pools.V, [dir, entry, "V", cls].join(SEP), base_item, betterV, K_V, K_V_UNI);

			if (!counts) {
				counts = {};
				for (var i = 0; i < len; i++) {
					var ch = word[i];
					if (missionChars[lang].indexOf(ch) >= 0) counts[ch] = (counts[ch] || 0) + 1;
				}
			}
			Object.keys(counts).forEach(function (m) {
				var mi = { word: word, len: len, exitc: exitc, wflag: w.wflag, hit: w.hit, uni: uni, score: base * (1 + 0.3 * counts[m]), low: 0 };
				offer(pools.M, [dir, entry, "M", m].join(SEP), mi, betterV, K_M, K_M_UNI);
			});

			var lowAll = isKo ? minByState(counters[dir](exitc, "all"), counters[dir](exitc, "short")) : counters[dir](exitc, "all"); // 영어 통계에는 구간 컬럼이 없다
			offerLow(pools.A, dir, entry, "A", cls, base_item, lowAll);
			if (isKo && len >= 2 && len <= 4) { // 글자 수 고정 모드(쿵쿵따 등)는 다음 단어도 같은 길이
				offerLow(pools.B, dir, entry, "B", cls, base_item, counters[dir](exitc, String(len)));
			}
		});
	});

	var out = [];
	["V", "M", "A", "B"].forEach(function (p) { flush(p === "A" || p === "B" ? mergeStates(pools[p]) : pools[p], out); });
	return out;
}

function q(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

function run(DB, lang, sql) {
	return new Promise(function (resolve, reject) {
		DB["kkutu_classic_" + lang].direct(sql, function (err, res) {
			if (err) reject(err); else resolve(res);
		});
	});
}

/** build() 결과를 kkutu_classic_<lang> 테이블로 다시 만든다 (DROP 후 CREATE) */
function save(DB, lang, out) {
	var table = "kkutu_classic_" + lang;
	var chain = run(DB, lang, "DROP TABLE IF EXISTS " + table).then(function () {
		return run(DB, lang, "CREATE TABLE " + table + " (" +
			"dir varchar(1) NOT NULL, link varchar(1) NOT NULL, pool varchar(1) NOT NULL, sub varchar(4) NOT NULL, rank smallint NOT NULL, " +
			"word varchar(256) NOT NULL, len smallint NOT NULL, exitc varchar(1) NOT NULL, wflag smallint NOT NULL, hit integer NOT NULL DEFAULT 0, " +
			"PRIMARY KEY (dir, link, pool, sub, rank))");
	});
	for (let i = 0; i < out.length; i += 1000) {
		chain = chain.then(function () {
			var values = out.slice(i, i + 1000).map(function (r) {
				return "(" + [q(r.dir), q(r.link), q(r.pool), q(r.sub), r.rank, q(r.word), r.len, q(r.exitc), r.wflag, r.hit].join(",") + ")";
			});
			process.stdout.write("\r[" + lang + "] " + Math.min(i + 1000, out.length) + "/" + out.length);
			return run(DB, lang, "INSERT INTO " + table + " (dir, link, pool, sub, rank, word, len, exitc, wflag, hit) VALUES " + values.join(","));
		});
	}
	return chain.then(function () {
		return run(DB, lang, "ANALYZE " + table);
	});
}

module.exports = { build: build, save: save };

if (require.main === module) {
	var DB = require('../Server/lib/Web/db');
	var langs = process.argv[2] ? [process.argv[2]] : ["ko", "en"];

	DB.ready = function () {
		langs.reduce(function (chain, lang) {
			return chain.then(function () { return processLang(lang); });
		}, Promise.resolve()).then(function () {
			console.log("\nAll Done!");
			process.exit(0);
		}).catch(function (err) {
			console.error("\nFailed:", err);
			process.exit(1);
		});
	};

	function processLang(lang) {
		if (lang !== "ko" && lang !== "en") return Promise.reject(new Error("unknown lang: " + lang));
		return new Promise(function (resolve, reject) {
			console.log("[" + lang + "] Fetching kkutu_stats_" + lang + "...");
			DB["kkutu_stats_" + lang].find().on(function (statRows) {
				if (!statRows) return reject(new Error("No stats found for " + lang));
				var stats = new Map();
				statRows.forEach(function (row) { stats.set(row._id, row); });
				console.log("[" + lang + "] Fetching kkutu_" + lang + "...");
				DB.kkutu[lang].find().limit(['_id', true], ['type', true], ['flag', true], ['hit', true], ['theme', true]).on(function (rows) {
					if (!rows) return reject(new Error("No words found or DB error for " + lang));
					console.log("[" + lang + "] Processing " + rows.length + " words...");
					var out = build(rows, lang, stats);
					var perPool = {};
					out.forEach(function (r) { perPool[r.pool] = (perPool[r.pool] || 0) + 1; });
					console.log("[" + lang + "] Built " + out.length + " rows " + JSON.stringify(perPool) + ". Writing to DB...");
					save(DB, lang, out).then(resolve, reject);
				});
			});
		});
	}
}
