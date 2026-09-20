/**
 * 레벨 5 봇용 끝말잇기 후보 테이블 조회 (테이블: kkutu_classic_ko/en, 생성: tools/build_classic_table.js)
 *
 * 서버 기동 시 테이블 전체를 메모리에 올려 두고, 턴마다 DB 조회 없이 후보 단어를 돌려준다.
 * 이 모듈은 "낼 만한 후보 단어"만 담당한다. 상대가 이을 수 있는 단어 수(한방/공격 판정)는
 * 방 옵션에 따라 달라지므로 classic-bot.js가 stats 테이블로 런타임에 계산한다.
 *
 * 행 키: dir | link | pool | sub
 *   dir   E = 다음 단어가 앞 단어의 끝 글자로 시작(KSH/KKT/ESH), F = 다음 단어가 앞 단어의 첫 글자로 끝남(KAP/KAK/EAP)
 *   link  낼 단어의 진입 글자(E는 첫 글자, F는 끝 글자)
 *   pool  V = 길이 구간별 고득점, M = 미션 글자별, A = 한방/공격 후보(자유 길이), B = 한방/공격 후보(글자 수 고정 모드)
 *   sub   V/A/B는 길이 구간, M은 미션 글자
 * 행 값: word, len, exitc(상대가 이어야 할 글자), wflag, hit
 * wflag 비트: 1 외래어, 2 어인정, 4 깐깐 통과, 8 품사 통과
 */
var MissionTable = require('./mission-table');
var TableLoader = require('../../sub/table-loader');

// 게임 모드 -> 언어/방향. KKU, EKT, KJM, 일본어 모드와 영어 쿵쿵따 계열(EKK, EAK)은 지원하지 않는다.
var MODES = {
	KSH: { lang: "ko", dir: "E" },
	KKT: { lang: "ko", dir: "E" },
	KAP: { lang: "ko", dir: "F" },
	KAK: { lang: "ko", dir: "F" },
	ESH: { lang: "en", dir: "E" },
	EAP: { lang: "en", dir: "F" }
};
var CLASSES = ["2", "3", "4", "5-8", "9+"];

exports.MODES = MODES;
exports.CLASSES = CLASSES;
exports.MISSION_CHARS = MissionTable.MISSION_CHARS;

exports.lenClass = function (len) {
	if (len <= 4) return String(len);
	return len <= 8 ? "5-8" : "9+";
};

var WFLAG = { LOAN: 1, INJEONG: 2, STRICT: 4, GROUP: 8 };
exports.WFLAG = WFLAG;

/** 어떤 방 옵션에서도 통과하는 단어인가 (외래어/어인정이 아니고 깐깐/품사 통과) */
exports.isUniversal = function (wflag) {
	return (wflag & (WFLAG.LOAN | WFLAG.INJEONG)) === 0 && (wflag & (WFLAG.STRICT | WFLAG.GROUP)) === (WFLAG.STRICT | WFLAG.GROUP);
};

/** getMannerState 비트(1 어인정 금지, 2 깐깐, 4 외래어 금지, 8 전품사)에서 이 단어가 유효한가 (tools/stats_helper.js와 같은 규칙) */
exports.isValid = function (state, wflag) {
	if ((state & 1) && (wflag & WFLAG.INJEONG)) return false;
	if ((state & 4) && (wflag & WFLAG.LOAN)) return false;
	if (state & 8) return true;
	return !!(wflag & ((state & 2) ? WFLAG.STRICT : WFLAG.GROUP));
};

var store = {}; // lang -> Map(key -> [{ _id, len, exitc, wflag, hit }] (rank 순))

exports.load = function (DB, JLog) {
	["ko", "en"].forEach(function (lang) {
		TableLoader.load("kkutu_classic_" + lang, function (timeout, done) {
			var q = DB["kkutu_classic_" + lang].find();
			if (timeout) q.timeout(timeout);
			q.on(function ($rows) {
				var next = new Map();
				if ($rows) {
					$rows.sort(function (a, b) { return a.rank - b.rank; });
					$rows.forEach(function (r) {
						var key = r.dir + "|" + r.link + "|" + r.pool + "|" + r.sub;
						var arr = next.get(key);
						if (!arr) next.set(key, arr = []);
						arr.push({ _id: r.word, len: r.len, exitc: r.exitc, wflag: r.wflag, hit: r.hit });
					});
				}
				if (next.size) store[lang] = next;
				JLog.info("[CLASSIC-TABLE] kkutu_classic_" + lang + " loaded: " + next.size + " keys");
				done();
			}, null, done);
		}, function () {
			JLog.warn("[CLASSIC-TABLE] kkutu_classic_" + lang + " not available, level 5 bots will use the default logic");
		});
	});
};

exports.isReady = function (lang) {
	return !!store[lang];
};

/** 없으면 빈 배열 */
exports.get = function (lang, dir, link, pool, sub) {
	var table = store[lang];
	return (table && table.get(dir + "|" + link + "|" + pool + "|" + sub)) || [];
};
