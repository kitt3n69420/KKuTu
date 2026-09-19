/**
 * 레벨 5 봇용 "주제 x 미션글자" 상위 단어 조회 (테이블: kkutu_mission_ko/en/ja, 생성: tools/build_mission_table.js)
 *
 * 서버 기동 시 테이블 전체를 메모리에 올려 두고, 턴마다 DB 조회 없이 후보를 돌려준다.
 * 조회할 수 없는 조건(미션이 기본 목록 밖, 한국어 easymission, 필터 후 후보 없음, 테이블 없음)이면
 * null을 돌려주니 호출부는 기존 로직으로 폴백하면 된다.
 *
 * 미션 글자는 게임이 쓰는 목록(Const.MISSION_*)을 그대로 쓴다. 글자 개수는 게임의 기본 미션 판정과 같이
 * 정확히 같은 글자만 센다(영어는 소문자 a-z, 일본어는 히라가나).
 */
var Const = require('../../const');

var MISSION_CHARS = {
	ko: Const.MISSION_ko.join(""),
	en: Const.MISSION_en.join(""),
	ja: Const.MISSION_ja.join("")
};
exports.MISSION_CHARS = MISSION_CHARS;

// lang -> Map(theme|mission|cap -> [{ _id, len, mcount, hit, flag }] (rank 순))
var store = {};

exports.load = function (DB, JLog) {
	Object.keys(MISSION_CHARS).forEach(function (lang) {
		var table = DB["kkutu_mission_" + lang];
		table.find().on(function ($rows) {
			var next = new Map();
			if ($rows) {
				$rows.sort(function (a, b) { return a.rank - b.rank; });
				$rows.forEach(function (r) {
					var key = r.theme + "|" + r.mission + "|" + r.cap;
					var arr = next.get(key);
					if (!arr) next.set(key, arr = []);
					arr.push({ _id: r.word, len: r.len, mcount: r.mcount, hit: r.hit, flag: r.flag });
				});
			}
			if (next.size) store[lang] = next;
			JLog.info("[MISSION-TABLE] kkutu_mission_" + lang + " loaded: " + next.size + " keys");
		}, null, function (err) {
			JLog.warn("[MISSION-TABLE] kkutu_mission_" + lang + " not available, level 5 bots will use the default logic: " + (err && err.message || err));
		});
	});
};

function value(item, chainLen) {
	return (Math.pow(5 + 7 * item.len, 0.74) + 1.18 * chainLen) * (1 + 0.3 * item.mcount);
}

/**
 * @param {string} lang 방 언어(my.rule.lang). ko / en / ja
 * @param {string|string[]|null} themes 주제 코드(들). null이면 주제 무제한
 * @param {string|boolean|undefined} mission 미션 글자. 없거나 이미 달성(true)이면 가장 긴 단어 순
 * @param {object} opts 방 옵션(nolong, noshort, no2, easymission)
 * @param {string[]} chain 이미 나온 단어 목록 (my.game.chain)
 * @param {Set<string>} done 이 봇이 이미 쓴 단어 (robot._done)
 * @param {{injeong: boolean, noLoan: boolean, idRegex: RegExp}} [wordRule] 어인정 허용 여부 / 외래어 금지 여부 / 단어 형식 제한. 생략한 항목은 거르지 않는다
 * @returns {Array|null} 가치 내림차순 후보. 폴백해야 하면 null
 */
exports.getCandidates = function (lang, themes, mission, opts, chain, done, wordRule) {
	var table = store[lang];
	if (!table) return null;

	var m = "";
	if (typeof mission === "string" && mission) {
		if (mission.length !== 1 || MISSION_CHARS[lang].indexOf(mission) < 0) return null;
		if (lang === "ko" && opts.easymission) return null; // 초성+중성 일치까지 인정하므로 글자 개수가 어긋난다
		m = mission;
	}

	var cap = opts.nolong ? 8 : 0;
	var themeList = Array.isArray(themes) ? themes : [themes || "*"];
	var seen = new Set();
	var list = [];
	themeList.forEach(function (t) {
		var arr = table.get(t + "|" + m + "|" + cap);
		if (!arr) return;
		arr.forEach(function (item) {
			if (seen.has(item._id)) return;
			seen.add(item._id);
			list.push(item);
		});
	});

	var chainSet = new Set(chain || []);
	var chainLen = (chain || []).length; // getPreScore의 chain 항과 같은 값
	list = list.filter(function (item) {
		if (opts.noshort && item.len < 9) return false;
		if (opts.no2 && item.len < 3) return false;
		if (wordRule) {
			if (wordRule.injeong === false && (item.flag & 2)) return false; // KOR_FLAG.INJEONG
			if (wordRule.noLoan && (item.flag & 1)) return false; // KOR_FLAG.LOANWORD
			if (wordRule.idRegex && !wordRule.idRegex.test(item._id)) return false;
		}
		return !chainSet.has(item._id) && !(done && done.has(item._id));
	});
	if (!list.length) return null;

	list.sort(function (a, b) {
		return value(b, chainLen) - value(a, chainLen) || b.hit - a.hit;
	});
	return list;
};
