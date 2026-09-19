/**
 * kkutu_mission_ko / _en / _ja 생성기: 레벨 5 봇(단어대결 daneo / 자유 free)용 "주제 x 미션글자" 상위 단어 테이블
 *
 * 실행: cd KKuTu-master/tools && node build_mission_table.js [ko|en|ja]   (언어를 생략하면 셋 다. kkutu_* 단어가 바뀌면 다시 실행)
 *
 * kkutu_<lang>을 한 번 훑으면서 키(theme|mission|cap)마다 가치 상위 TOP_K개만 유지한 뒤 kkutu_mission_<lang>에 채운다.
 *   theme    주제 코드. '*' 는 주제 무제한(전체 단어)
 *   mission  미션 글자(Const.MISSION_<lang>). '' 는 미션 없음 = 가장 긴 단어 순
 *   cap      0 = 길이 제한 없음, 8 = nolong(8글자 이하) 전용 행
 *   score    chainLen=0 기준 가치: (5+7L)^0.74 * (1 + 0.3 * mcount)  (game-utils.js getPreScore + 미션 보너스. 한/영/일 동일)
 *   flag     kkutu_<lang>.flag (1=외래어, 2=어인정). 방 옵션에 따라 런타임(mission-table.js)에서 거른다
 * 글자 개수는 미션 글자와 정확히 같은 글자만 센다(영어는 소문자 a-z, 일본어는 히라가나).
 * 제외: 한국어에서 theme 가 정확히 'KPT'(국내 특허) 단독인 단어
 */
var MissionTable = require('../Server/lib/Game/games/mission-table');

var TOP_K = 60;
var CAPS = [0, 8];

function better(a, b) { // a가 b보다 앞서는가
	if (a.score !== b.score) return a.score > b.score;
	if (a.hit !== b.hit) return a.hit > b.hit;
	return a.word < b.word;
}

function offer(map, key, item) {
	var arr = map.get(key);
	if (!arr) map.set(key, arr = []);
	if (arr.length >= TOP_K && !better(item, arr[arr.length - 1])) return;
	var i = arr.length;
	while (i > 0 && better(item, arr[i - 1])) i--;
	arr.splice(i, 0, item);
	if (arr.length > TOP_K) arr.pop();
}

/** rows: [{_id, theme, flag, hit}] -> Map(key -> 정렬된 상위 항목) */
function build(rows, lang) {
	var chars = MissionTable.MISSION_CHARS[lang];
	var map = new Map();
	rows.forEach(function (r) {
		var word = r._id;
		var len = word.length;
		if (!len || (lang === "ko" && r.theme === "KPT")) return;
		var hit = r.hit || 0;
		var flag = r.flag || 0;

		var themes = ["*"];
		if (r.theme) {
			r.theme.split(",").forEach(function (t) {
				t = t.trim();
				if (t) themes.push(t);
			});
		}

		var counts = {};
		for (var i = 0; i < len; i++) {
			var ch = word[i];
			if (chars.indexOf(ch) >= 0) counts[ch] = (counts[ch] || 0) + 1;
		}
		var missions = Object.keys(counts);
		var base = Math.pow(5 + 7 * len, 0.74);

		themes.forEach(function (theme) {
			CAPS.forEach(function (cap) {
				if (cap && len > cap) return;
				offer(map, theme + "||" + cap, { word: word, len: len, mcount: 0, score: base, hit: hit, flag: flag });
				missions.forEach(function (m) {
					var c = counts[m];
					offer(map, theme + "|" + m + "|" + cap, { word: word, len: len, mcount: c, score: base * (1 + 0.3 * c), hit: hit, flag: flag });
				});
			});
		});
	});
	return map;
}

/** Map -> 테이블 행 배열 */
function toRows(map) {
	var out = [];
	map.forEach(function (arr, key) {
		var p = key.split("|");
		arr.forEach(function (it, idx) {
			out.push({ theme: p[0], mission: p[1], cap: Number(p[2]), rank: idx + 1, word: it.word, len: it.len, mcount: it.mcount, score: it.score, hit: it.hit, flag: it.flag });
		});
	});
	return out;
}

function q(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

function run(DB, lang, sql) {
	return new Promise(function (resolve, reject) {
		DB["kkutu_mission_" + lang].direct(sql, function (err, res) {
			if (err) reject(err); else resolve(res);
		});
	});
}

/** toRows() 결과를 kkutu_mission_<lang> 테이블로 다시 만든다 (DROP 후 CREATE) */
function save(DB, lang, out) {
	var table = "kkutu_mission_" + lang;
	var chain = run(DB, lang, "DROP TABLE IF EXISTS " + table).then(function () {
		return run(DB, lang, "CREATE TABLE " + table + " (" +
			"theme varchar(16) NOT NULL, mission varchar(1) NOT NULL, cap smallint NOT NULL, rank smallint NOT NULL, " +
			"word varchar(256) NOT NULL, len smallint NOT NULL, mcount smallint NOT NULL, score real NOT NULL, " +
			"hit integer NOT NULL DEFAULT 0, flag integer NOT NULL DEFAULT 0, PRIMARY KEY (theme, mission, cap, rank))");
	});
	for (let i = 0; i < out.length; i += 1000) {
		chain = chain.then(function () {
			var values = out.slice(i, i + 1000).map(function (r) {
				return "(" + [q(r.theme), q(r.mission), r.cap, r.rank, q(r.word), r.len, r.mcount, r.score, r.hit, r.flag].join(",") + ")";
			});
			process.stdout.write("\r[" + lang + "] " + Math.min(i + 1000, out.length) + "/" + out.length);
			return run(DB, lang, "INSERT INTO " + table + " (theme, mission, cap, rank, word, len, mcount, score, hit, flag) VALUES " + values.join(","));
		});
	}
	return chain.then(function () {
		return run(DB, lang, "ANALYZE " + table);
	});
}

module.exports = { build: build, toRows: toRows, save: save };

if (require.main === module) {
	var DB = require('../Server/lib/Web/db');
	var langs = process.argv[2] ? [process.argv[2]] : ["ko", "en", "ja"];

	DB.ready = function () {
		langs.reduce(function (chain, lang) {
			return chain.then(function () { return process1(lang); });
		}, Promise.resolve()).then(function () {
			console.log("\nAll Done!");
			process.exit(0);
		}).catch(function (err) {
			console.error("\nFailed:", err);
			process.exit(1);
		});
	};

	function process1(lang) {
		if (!MissionTable.MISSION_CHARS[lang]) return Promise.reject(new Error("unknown lang: " + lang));
		return new Promise(function (resolve, reject) {
			console.log("[" + lang + "] Fetching kkutu_" + lang + "...");
			DB.kkutu[lang].find().limit(['_id', true], ['theme', true], ['flag', true], ['hit', true]).on(function (rows) {
				if (!rows) return reject(new Error("No words found or DB error for " + lang));
				console.log("[" + lang + "] Processing " + rows.length + " words...");
				var out = toRows(build(rows, lang));
				console.log("[" + lang + "] Built " + out.length + " rows. Writing to DB...");
				save(DB, lang, out).then(resolve, reject);
			});
		});
	}
}
