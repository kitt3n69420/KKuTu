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

var Const = require('../../const');
var Const = require('../../const');
var Lizard = require('../../sub/lizard');

var DB, DIC, checkSwearWords;
var ctx = { DB: null, DIC: null, checkSwearWords: null };
exports.ctx = ctx;
exports.setContext = function (_DB, _DIC, _checkSwear) {
	DB = ctx.DB = _DB;
	DIC = ctx.DIC = _DIC;
	checkSwearWords = ctx.checkSwearWords = _checkSwear;
	[2, 3, 4, 5].forEach(function (len) {
		_fillTitlePool(false, 'ko', len);
		_fillTitlePool(true, 'ko', len);
	});
};
const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [4, 2, 1, 0, 0];
const ROBOT_HIT_LIMIT = [4, 3, 2, 1, 0];
const ROBOT_LENGTH_LIMIT = [3, 6, 12, 24, 80];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];
const SPECIAL_MOVE_PROB = [0, 0, 0.1, 0.25, 0.4];
const PERSONALITY_CONST = [0, 0, 0.5, 0.8, 0.99];
const PREFERRED_CHAR_PROB = [0.6, 0.7, 0.8, 0.9, 1.0];
const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];
const PRIORITY_ATTACK_CHARS = ["렁", "듈", "븐", "튬", "쾃", "럿", "듐", "픔", "뮴", "읃", "읓", "읔", "읕", "읖", "읗", "냑", "녘"];
const PRIORITY_ATTACK_CHARS_MANNER = ["릇", "럴", "텝", "슭", "픈", "깟", "왑", "븨", "껏"];
const PRIORITY_KAP_ATTACK_CHARS = ["녈", "맞", "흰", "뉸", "뒷", "헛", "붉", "뻐", "첫", "룍", "뇩", "넓", "홑", "맆", "렾", "녚", "갯", "받", "뉼", "앉", "높", "롶", "돼", "윗", "넙", "랼", "된", "뾰", "햇", "엑", "좁", "굳", "왼", "뻔", "빤", "륽", "늙", "뺑", "엎", "같", "띾", "꺾", "닫", "랕", "뙤", "돋", "쨍", "씽", "꽈", "귓", "므", "쌩", "샐", "잦", "섞", "덮", "맏", "얽", "왱", "긁", "짧", "걷", "헥", "잿"];
const PRIORITY_KAP_ATTACK_CHARS_MANNER = ["겉", "쩔", "떠", "녑", "훌", "숫", "붙", "곧", "랒", "쫄", "쏠", "녓", "갸", "콧", "갖", "썰", "뻥", "삥", "쩌", "뗑", "꺄", "쐐", "헝", "갤", "촬", "옵", "찡", "믿", "줴", "촐", "놓", "쓴", "맑", "칡", "핸", "힌", "싀", "깁", "씀", "뭍"];
const DUBANG = ["괙", "귁", "껙", "꿕", "뀍", "늡", "릅", "돨", "똴", "뙁", "뛸", "뜩", "띡", "띨", "멫", "몇", "뱍", "뷩", "뷩", "븩", "뽓", "뿅", "솰", "쏼", "었", "쟘", "좍", "좜", "좸", "줅", "줍", "쥄", "쫙", "챱", "홱", "깟", "팅", "넬"]
const DUBANG_KAP = ["뒷", "쌩", "빤", "핫", "갤", "캘", "왱", "헛", "삥", "쫄"];
const PRIORITY_ATTACK_CHARS_EN = ["ght", "ock", "ick", "ird", "ert", "ork", "eck", "nds", "uck", "ond", "lue", "lls", "elt", "rds", "arp", "uff", "erm", "irl", "ilt", "ilk", "ods", "cks", "ays", "iff", "ett", "olt", "ors", "erb", "ohn", "erk", "awk", "nks", "irs", "irm", "urd", "ilm", "nue", "rks", "arf", "nyx", "erd", "ryx", "olk", "itt", "rys", "gie", "url", "nck", "ils", "avy", "ynx", "ews", "mie", "irk", "cht", "cue", "ulb", "onk", "elp", "urk", "ldt", "aws"];
const PRIORITY_ATTACK_CHARS_MANNER_EN = ["ack", "ark", "ics", "orm", "ers", "ify", "ons", "omb", "ngs", "ump", "owl", "ift", "urn", "rie", "eek", "oud", "elf", "irt", "ild", "kie", "itz", "rld", "iew", "thm", "els", "awl", "awn", "rue", "yew", "eft", "oft", "ffy", "uld", "hew", "ivy", "rtz", "egs", "tew", "oux", "rns", "ebs", "tua", "tyl", "efy", "ohm", "omp", "bbs", "ltz", "ggs", "oek", "xxv", "few", "wyn", "orr", "utz", "enn", "ebb", "hns", "ogs", "ruz", "ibs", "uhr", "nyl"];
const PRIORITY_KAP_ATTACK_CHARS_EN = ["j", "q", "x", "z"];
const AVOID_FD = ["렁", "냑", "럿", "럴"];
const AVOID_VI = ["렁", "냑", "럿", "럴", "켓", "껏", "줘", "텝"];
const AVOID_RD = ["렁", "럿", "럴"];
const EKT_BIGRAMS = ["co", "un", "in", "re", "ca", "de", "ma", "pr", "di", "st", "pa", "ch", "se", "an", "ba", "pe", "tr", "su", "me", "ha", "sa", "po", "mo", "mi", "he", "sp", "la", "br", "no", "sh", "be", "ho", "sc", "cr", "li", "th", "te", "bo", "ar", "al", "gr", "ta", "fo", "so", "ex", "ra", "en", "lo", "ac", "si", "le", "ne", "pl", "pi", "bu", "to", "ga", "bl", "cl", "do", "bi", "hy", "fa", "fi", "ph", "fl", "ro", "im", "wa", "mu", "as", "vi", "fr", "pu", "am", "da", "ap", "ce", "cu", "ve", "ad", "na", "wi", "go", "ab", "ge", "hi", "va", "ti", "ov", "qu", "dr", "fe", "or", "sl", "ri", "gl", "au", "we", "tu", "wo", "sy", "ni", "fu", "hu", "el", "ru", "lu", "wh", "cy", "at", "gu", "du", "em", "ci", "ki", "ka", "ag", "my"];
const VOWEL_INV_MAP = {
	0: 4, 4: 0, 1: 5, 5: 1, 2: 6, 6: 2, 3: 7, 7: 3,
	8: 13, 13: 8, 9: 14, 14: 9, 10: 15, 15: 10, 11: 16, 16: 11,
	12: 17, 17: 12
};
var AttackCache = {};
var AttackCacheSize = 0;
var ATTACK_CACHE_MAX_BYTES = 1024 * 1024; // 1MB
// 매너 체크 DB 쿼리 결과 캐시 (5분 TTL, DB 부하 감소)
var MannerCache = {};
var MANNER_CACHE_TTL = 5 * 60 * 1000;
// getAuto(type=2) 결과 캐시: 봇 턴마다 같은 char로 반복 쿼리 방지 (TTL: 10초)
var _autoListCache = {};
var AUTO_LIST_CACHE_TTL = 10000;
// 제시어 후보 풀: key="f:ko:3" or "r:ko:3" → 18개 버킷 배열 (음절 그룹별)
var titlePool = {};
var titlePoolRefilling = {};
var TITLE_POOL_MIN = 8;

function _koSyllableGroup(code) {
	var c = code - 44032;
	return (c >= 0 && c < 11172) ? Math.floor(c / 588) : -1;
}

function _fillTitlePool(isReverse, lang, wordLen) {
	var key = (isReverse ? 'r' : 'f') + ':' + lang + ':' + wordLen;
	if (titlePoolRefilling[key]) return;
	titlePoolRefilling[key] = true;
	var q = (lang === 'ko')
		? ('SELECT _id FROM kkutu_ko TABLESAMPLE BERNOULLI(10) WHERE LENGTH(_id) = ' + wordLen + ' AND type IS NOT NULL LIMIT 200')
		: ('SELECT _id FROM kkutu_en TABLESAMPLE BERNOULLI(10) WHERE LENGTH(_id) = ' + wordLen + ' LIMIT 200');
	DB.kkutu[lang].direct(q, function(err, res) {
		titlePoolRefilling[key] = false;
		if (err || !res || !res.rows) return;
		if (!titlePool[key]) {
			titlePool[key] = [];
			for (var _i = 0; _i < 19; _i++) titlePool[key].push([]);
		}
		res.rows.forEach(function(r) {
			var w = r._id;
			var refChar = isReverse ? w[w.length - 1] : w[0];
			if (!refChar) return;
			var g = _koSyllableGroup(refChar.charCodeAt(0));
			if (g >= 0) titlePool[key][g].push(w);
		});
	});
}
// stats 테이블 인메모리 조회 헬퍼
function getStatsDoc(lang, id) {
	return (DB.statsData && DB.statsData[lang] && DB.statsData[lang][id]) || null;
}
var _statsDocsCache = {};
function getAllStatsDocs(lang) {
	if (_statsDocsCache[lang]) return _statsDocsCache[lang];
	var docs = (DB.statsData && DB.statsData[lang]) ? Object.values(DB.statsData[lang]) : [];
	if (docs.length > 0) _statsDocsCache[lang] = docs;
	return docs;
}

// Helper function to get player ID (supports both robot objects and player ID strings)
function getPlayerId(player) {
	return (typeof player === 'object' && player.id) ? player.id : player;
}

// 매너 계열 규칙 활성화 여부 (manner, gentle, shield, etiquette)
function isMannerLike(opts) {
	return opts.manner || opts.gentle || opts.shield || opts.etiquette;
}

// 매너 최소 남은 단어 수 (gentle=5, 나머지=1)
function getMannerMinRemaining(opts) {
	if (opts.gentle) return 5;
	return 1;
}

// 깊은 체크(Stack Kill Prevention) 필요 여부 (shield는 불필요)
function shouldDeepCheck(opts) {
	if (opts.shield) return false;
	return true;
}

// 매너 체크용 state 비트마스크 (에티켓: 항상 injeong OFF 강제)
// bit0=noInjeong(1), bit1=strict(2), bit2=noLoan(4), bit3=allpos(8)
function getMannerState(opts) {
	var state = 0;
	if (!opts.injeong || opts.etiquette) state |= 1;
	if (opts.strict) state |= 2;
	if (opts.loanword) state |= 4;
	if (opts.allpos) state |= 8;
	return state;
}

// 매너 계열 캐시 키 접미사
function getMannerCacheKey(opts) {
	if (opts.gentle) return "G";
	if (opts.shield) return "S";
	if (opts.etiquette) return "E";
	if (opts.manner) return "M";
	return "0";
}

function getAttackChars(my) {
	return new Promise(function (resolve) {
		var state = getMannerState(my.opts);

		var isRev = !!my.rule._back;
		var col = isRev ? `end_${state}` : `start_${state}`;
		var key = my.rule.lang + "_" + col;

		var isKo = my.rule.lang === 'ko';
		var useCol = col;
		if (isKo) {
			var reqLen = getNextTurnLength.call(my);
			var lenSuffix = (reqLen === 2) ? "2" : (reqLen === 3) ? "3" : (reqLen === 4) ? "4" : "all";
			useCol = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
		} else {
			useCol = `count_${state}`;
		}
		// Update Cache Key to include useCol and Manner state
		key += "_" + useCol + "_M" + getMannerCacheKey(my.opts);

		// Cache Validity: 1 hour (or until restart)
		if (AttackCache[key]) {
			if (AttackCache[key].time > Date.now() - 3600000) {
				return resolve(AttackCache[key].data);
			}
			AttackCacheSize -= AttackCache[key]._size || 0;
			delete AttackCache[key];
		}

		// Parallel Fetch:
		// 1. Hard Killers (<= 2) - Tier 1 (One-shots)
		// 2. Soft Killers (3-5) - Tier 2
		// 3. Priority Lists (Manual) - Added to Tier 2
		var priorityList = [];
		var priorityMannerList = [];
		if (isKo) {
			priorityList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
			priorityMannerList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;
		} else {
			if (!isRev) {
				priorityList = PRIORITY_ATTACK_CHARS_EN;
				priorityMannerList = PRIORITY_ATTACK_CHARS_MANNER_EN;
			} else {
				priorityList = PRIORITY_KAP_ATTACK_CHARS_EN;
			}
		}

		// 인메모리 stats에서 직접 필터링
		var lang = isKo ? 'ko' : 'en';
		var allDocs = getAllStatsDocs(lang);
		var allPriority = priorityList.concat(priorityMannerList);

		// Tier 1: One-shot killers (count 0-2)
		var hardKillers, softKillerIds, priorityDocs;
		if (isMannerLike(my.opts)) {
			hardKillers = allDocs.filter(function (d) { var v = d[useCol] || 0; return v >= 1 && v <= 2; });
		} else {
			hardKillers = allDocs.filter(function (d) { var v = d[useCol] || 0; return v <= 2; });
		}
		hardKillers.sort(function (a, b) { return (a[useCol] || 0) - (b[useCol] || 0); });
		hardKillers = hardKillers.slice(0, 100);

		// Tier 2: Soft killers (count 3-5)
		var softDocs = allDocs.filter(function (d) { var v = d[useCol] || 0; return v >= 3 && v <= 5; });
		softDocs.sort(function (a, b) { return (a[useCol] || 0) - (b[useCol] || 0); });
		softKillerIds = softDocs.slice(0, 200).map(function (d) { return d._id; });

		// Priority chars from manual list
		priorityDocs = allPriority.map(function (id) { return getStatsDoc(lang, id); }).filter(Boolean);

		// Build Tier 1: Hard killers + Priority chars that are hard
		var tier1Set = new Set();
		var tier2Set = new Set(softKillerIds);

		hardKillers.forEach(function (doc) {
			tier1Set.add(doc._id);
		});

		// Process Priority Chars (Heuristics) - Add to Tier 1 or Tier 2
		priorityDocs.forEach(function (doc) {
			var count = doc[useCol];
			if (!count && count !== 0) count = 0;

			if (isMannerLike(my.opts)) {
				if (count === 0) return;
			}

			if (count <= 2) {
				tier1Set.add(doc._id);
			} else {
				tier2Set.add(doc._id);
			}
		});

		var tier1 = Array.from(tier1Set);
		var tier2 = Array.from(tier2Set);

		var data = {
			tier1: tier1,
			tier2: tier2
		};

		var entry = { time: Date.now(), data: data };
		var entrySize = (data.tier1.length + data.tier2.length) * 20;
		if (AttackCache[key]) {
			AttackCacheSize -= AttackCache[key]._size || 0;
		}
		if (AttackCacheSize + entrySize > ATTACK_CACHE_MAX_BYTES) {
			var now = Date.now();
			for (var ck in AttackCache) {
				if (now - AttackCache[ck].time > 3600000) {
					AttackCacheSize -= AttackCache[ck]._size || 0;
					delete AttackCache[ck];
				}
			}
			if (AttackCacheSize + entrySize > ATTACK_CACHE_MAX_BYTES) {
				AttackCache = {};
				AttackCacheSize = 0;
			}
		}
		entry._size = entrySize;
		AttackCacheSize += entrySize;
		AttackCache[key] = entry;
		resolve(data);
	});
}

function applyAlternating(game, opts, n, hi, lo) {
	if (!opts.change) {
		game.wordLength = (game.wordLength == hi) ? lo : hi;
		return;
	}
	if (typeof game.samiCount === 'undefined') game.samiCount = 0;
	if (n % 2 === 0) {
		var idx = game.samiCount % (n + 1);
		game.wordLength = (idx % 2 === 0) ? hi : lo;
	} else {
		var period = 2 * (n + 1);
		var bigIdx = game.samiCount % period;
		var idx2 = (bigIdx < n + 1) ? bigIdx : (period - 1 - bigIdx);
		game.wordLength = (idx2 % 2 === 0) ? hi : lo;
	}
	game.samiCount++;
}

function predictNextAlternating(game, opts, n, hi, lo) {
	if (!opts.change) {
		return (game.wordLength == hi) ? lo : hi;
	}
	var cnt = (typeof game.samiCount !== 'undefined') ? game.samiCount : 0;
	if (n % 2 === 0) {
		var nextIdx = cnt % (n + 1);
		return (nextIdx % 2 === 0) ? hi : lo;
	} else {
		var period = 2 * (n + 1);
		var nextBig = cnt % period;
		var nextIdx2 = (nextBig < n + 1) ? nextBig : (period - 1 - nextBig);
		return (nextIdx2 % 2 === 0) ? hi : lo;
	}
}

function getNextTurnLength() {
	var my = this;
	if (!my.game || !my.game.seq) return my.game ? (my.game.wordLength || 0) : 0;
	if (my.opts.sami) {
		return predictNextAlternating(my.game, my.opts, my.game.seq.length, 3, 2);
	}
	if (my.opts.fourthree) {
		return predictNextAlternating(my.game, my.opts, my.game.seq.length, 4, 3);
	}
	if (my.opts.twotwo) return 2;
	if (my.opts.fourfour) return 4;

	// New Length Rules (Priority: 7 > 6 > 5 > 4 > 3)
	if (my.opts.length7) return 7;
	if (my.opts.length6) return 6;
	if (my.opts.length5) return 5;
	if (my.opts.length4) return 4;
	if (my.opts.length3) return 3;

	return my.game.wordLength || 0;
}
function getMission(l, opts, gameType) {
	// KJM: 26개 기본 자모에서 랜덤 선택
	if (gameType === 'KJM') {
		return Const.MISSION_jamo[Math.floor(Math.random() * Const.MISSION_jamo.length)];
	}
	// 미션플러스 옵션이 활성화되고 한국어 게임모드일 때
	if (opts && opts.missionplus && l === "ko") {
		// 초성 배열 (ㄱ~ㅎ, 쌍자음 제외)
		var initials = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
		// 모음 배열 (ㅏ, ㅓ, ㅔ, ㅗ, ㅜ, ㅣ)
		var vowels = ["ㅏ", "ㅓ", "ㅔ", "ㅗ", "ㅜ", "ㅣ"];

		// 무작위로 초성과 모음을 선택
		var initial = initials[Math.floor(Math.random() * initials.length)];
		var vowel = vowels[Math.floor(Math.random() * vowels.length)];

		// 유니코드로 한글 조합
		// 한글 음절 = 0xAC00 + (초성 인덱스 × 588) + (중성 인덱스 × 28) + 종성 인덱스
		var initialIndex = Const.INIT_SOUNDS.indexOf(initial);
		var vowelIndex = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"].indexOf(vowel);

		// 종성 없이 초성+중성만 조합
		var syllable = String.fromCharCode(0xAC00 + (initialIndex * 588) + (vowelIndex * 28));

		return syllable;
	}

	// 기본 미션 로직
	var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;

	if (!arr) return "-";
	return arr[Math.floor(Math.random() * arr.length)];
}

function getAuto(char, subc, type, limit, sort) {
	/* type
		0 무작위 단어 하나
		1 존재 여부
		2 단어 목록
	*/
	var my = this;
	var R = new Lizard.Tail();
	var gameType = Const.GAME_TYPE[my.mode];
	var adv, adc;
	var bool = type == 1;
	var isKAP = (gameType === 'KAP' || gameType === 'KAK' || gameType === 'EAP' || gameType === 'EAK');

	adc = escapeRegExp(char) + (subc ? ("|" + subc.split("|").map(escapeRegExp).join("|")) : "");
	switch (gameType) {
		case 'EKK':
			adv = `^(${adc}).{${my.game.wordLength - char.length}}$`;
			break;
		case 'EKT':
			// EKT 3-gram 모드: 최소 4글자 이상 단어만 검색
			// char.length >= 2이면 trigram 모드 여부와 무관하게 4글자 최소 강제
			// (매너 체크 시 ektTrigramMode가 아직 false여도 4글자 기준 적용)
			if (my.game.ektTrigramMode || char.length >= 2) {
				var minExtraChars = Math.max(1, 4 - char.length);
				adv = `^(${adc})${'.'.repeat(minExtraChars)}`;
			} else {
				adv = `^(${adc}).`; // 비활성화 시 1글자 char: 2글자 이상
			}
			break;
		case 'KKU':
			// KKU 3-gram 모드: 최소 4글자 이상 단어만 검색
			if (my.game.kkuTrigramMode) {
				var minExtraChars = Math.max(1, 4 - char.length);
				adv = `^(${adc})${'.'.repeat(minExtraChars)}`;
			} else {
				// Standard KKU: Allow length >= 2
				if (char.length >= 2) {
					adv = `^(${adc})`;
				} else {
					adv = `^(${adc}).`;
				}
			}
			break;
		case 'KSH':
			if (my.opts.noshort) {
				adv = `^(${adc}).{8,}`;  // 9글자 이상
			} else if (my.opts.nolong) {
				adv = `^(${adc}).{1,7}`;  // 2~8글자
			} else if (my.opts.no2) {
				adv = `^(${adc}).{2,}`;  // 3글자 이상
			} else {
				adv = `^(${adc}).`;
			}
			break;
		case 'ESH':
			if (my.opts.noshort) {
				adv = `^(${adc}).{8,}`;  // 9글자 이상
			} else if (my.opts.nolong) {
				adv = `^(${adc}).{1,7}`;  // 2~8글자
			} else if (my.opts.no2) {
				adv = `^(${adc}).{2,}`;  // 3글자 이상
			} else {
				adv = `^(${adc})...`;
			}
			break;
		case 'KKT':
			adv = `^(${adc}).{${my.game.wordLength - char.length}}$`;
			break;
		case 'KAP':
			if (my.opts.noshort) {
				adv = `.{8,}(${adc})$`; // 9글자 이상
			} else if (my.opts.nolong) {
				adv = `.{1,7}(${adc})$`; // 2~8글자
			} else if (my.opts.no2) {
				adv = `.{2,}(${adc})$`; // 3글자 이상
			} else {
				adv = `.(${adc})$`;
			}
			break;
		case 'EAP':
			if (my.opts.noshort) {
				adv = `.{8,}(${adc})$`; // 9글자 이상
			} else if (my.opts.nolong) {
				adv = `.{1,7}(${adc})$`; // 2~8글자
			} else if (my.opts.no2) {
				adv = `.{2,}(${adc})$`; // 3글자 이상
			} else {
				adv = `.(${adc})$`;
			}
			break;
		case 'KAK':
		case 'EAK':
			adv = `^.{${my.game.wordLength - char.length}}(${adc})$`;
			break;
		case 'KJM': {
			adv = Const.getKjmStartRegex(char).source;
			break;
		}
	}
	if (!char) {
	}

	// type=1 (존재 여부 확인 Check): kkutu_stats table check
	// KKU/KJM은 통계 테이블이 없으므로 DB 직접 쿼리로 fallback
	if (bool && char && gameType !== 'KKU' && gameType !== 'KJM') {
		// Bitmask State (bit0=noInjeong, bit1=strict, bit2=noLoan, bit3=allpos)
		var state = getMannerState(my.opts);

		var isKo = my.rule.lang === 'ko';
		var lang = isKo ? 'ko' : 'en';
		var col;

		if (isKo) {
			if (my.opts.nolong) {
				col = isKAP ? `endshort_${state}` : `startshort_${state}`;
			} else if (my.opts.noshort) {
				// noshort는 별도 계산 필요 - 일단 all 컬럼 사용 후 short 빼기
				col = isKAP ? `endall_${state}` : `startall_${state}`;
			} else if (my.opts.no2) {
				// no2는 별도 계산 필요 - 일단 all 컬럼 사용 후 2글자 빼기
				col = isKAP ? `endall_${state}` : `startall_${state}`;
			} else {
				var nextLen = getNextTurnLength.call(my);
				var lenSuffix = (nextLen === 2) ? "2" : (nextLen === 3) ? "3" : (nextLen === 4) ? "4" : "all";
				col = isKAP ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
			}
		} else {
			// 영어: noLong 모드일 때 countshort 컬럼 사용 (2~8글자)
			// noShort 모드일 때 전체 - countshort = 9글자 이상
			// no2 모드일 때 전체 - count2 = 3글자 이상
			if (my.opts.nolong) {
				col = `countshort_${state}`;
			} else if (my.opts.noshort) {
				// noshort는 별도 계산 필요 - 일단 count 컬럼 사용 후 short 빼기
				col = `count_${state}`;
			} else if (my.opts.no2) {
				// no2는 별도 계산 필요 - 일단 count 컬럼 사용 후 2글자 빼기
				col = `count_${state}`;
			} else {
				col = `count_${state}`;
			}
		}

		// Check both char and subChar (Read-Time Dueum)
		var charsToCheck = [char];
		if (subc) {
			subc.split("|").forEach(function (sc) {
				if (sc && charsToCheck.indexOf(sc) === -1) charsToCheck.push(sc);
			});
		}

		// noshort/no2 모드일 때 short 컬럼 결정 (전체에서 빼기 위함)
		var shortCol = null;
		if (my.opts.noshort) {
			if (isKo) {
				shortCol = isKAP ? `endshort_${state}` : `startshort_${state}`;
			} else {
				shortCol = `countshort_${state}`;
			}
		} else if (my.opts.no2) {
			if (isKo) {
				shortCol = isKAP ? `end2_${state}` : `start2_${state}`;
			} else {
				shortCol = `count2_${state}`;
			}
		}

		var totalCount = 0;
		var totalShort = 0;

		charsToCheck.forEach(function (c) {
			var doc = getStatsDoc(lang, c);
			var charCount = (doc && doc[col]) ? doc[col] : 0;
			var shortCount = (shortCol && doc && doc[shortCol]) ? doc[shortCol] : 0;
			totalCount += charCount;
			totalShort += shortCount;
		});
		var finalCount = (my.opts.noshort || my.opts.no2) ? (totalCount - totalShort) : totalCount;
		R.go(finalCount);
	} else {
		// type=0 or type=2: Real DB Query needed
		produce();
	}

	function produce() {
		var aqs = [
			['_id', new RegExp(adv)]
		];
		var aft;

		if (!my.opts.injeong) aqs.push(['flag', {
			'$nand': Const.KOR_FLAG.INJEONG
		}]);
		if (my.rule.lang == "ko") {
			if (my.opts.loanword) aqs.push(['flag', {
				'$nand': Const.KOR_FLAG.LOANWORD
			}]);
			if (my.opts.allpos) {
				// allpos: 품사 필터 없이 모든 단어 허용
			} else if (my.opts.strict) {
				aqs.push(['type', Const.KOR_STRICT], ['flag', {
					$lte: 3
				}]);
			} else {
				aqs.push(['type', Const.KOR_GROUP]);
			}
		} else {
			aqs.push(['_id', Const.ENG_ID]);
		}
		// noLong/noShort/no2 길이 필터 함수
		// KJM: 자모 분해 길이 기준 적용
		function filterByLengthRule($md) {
			if (my.opts.nolong) {
				$md = $md.filter(function (item) {
					var len = (gameType === 'KJM') ? Const.decomposeToJamo(item._id).length : item._id.length;
					return item._id && len <= 8;
				});
			}
			if (my.opts.noshort) {
				$md = $md.filter(function (item) {
					var len = (gameType === 'KJM') ? Const.decomposeToJamo(item._id).length : item._id.length;
					return item._id && len >= 9;
				});
			}
			if (my.opts.no2) {
				$md = $md.filter(function (item) {
					var len = (gameType === 'KJM') ? Const.decomposeToJamo(item._id).length : item._id.length;
					return item._id && len >= 3;
				});
			}
			return $md;
		}

		switch (type) {
			case 0:
			default:
				aft = function ($md) {
					// EKT/KKU: 4글자 이상만 힌트로 표시
					if ((gameType === 'EKT' || gameType === 'KKU') && $md.length > 0) {
						$md = $md.filter(function (item) {
							return item._id && item._id.length >= 4;
						});
					}
					// noLong/noShort 필터 적용
					$md = filterByLengthRule($md);
					R.go($md[Math.floor(Math.random() * $md.length)]);
				};
				break;
			case 1:
				aft = function ($md) {
					// noLong/noShort 필터 적용
					$md = filterByLengthRule($md);
					R.go($md.length);
				};
				break;
			case 2:
				aft = function ($md) {
					// noLong/noShort 필터 적용
					R.go(filterByLengthRule($md));
				};
				break;
		}
		// KKU 모드에서는 매너 체크를 위해 실제 단어 개수를 세어야 하므로 limit을 크게 설정
		var limitValue = (bool && gameType === 'KKU') ? 10000 : ((bool ? 1 : 123) * (limit || 1));
		// MannerCache: type=2 결과를 5분간 캐시하여 반복 DB 쿼리 방지
		// 캐시 키에 limitValue와 sort 포함 — limit이 다르면 결과 크기가 달라서 별도 캐싱 필요
		var _mck = null;
		if (type === 2) {
			_mck = adv + ':' + my.rule.lang + ':' + (my.opts.injeong ? 1 : 0) + ':' + (my.opts.loanword ? 1 : 0) + ':' + (my.opts.allpos ? 1 : 0) + ':' + (my.opts.strict ? 1 : 0) + ':' + limitValue + (sort ? ':s' : '');
			if (MannerCache[_mck] && MannerCache[_mck].t > Date.now() - MANNER_CACHE_TTL) {
				var _mc = MannerCache[_mck].d;
				aft(my.game.chain ? _mc.filter(function(item) { return !my.game.chain.includes(item._id); }) : _mc);
				return;
			}
		}
		var raiser = DB.kkutu[my.rule.lang].find.apply(this, aqs);
		if (sort) raiser.sort(sort);
		raiser.limit(limitValue).on(function ($md) {
			if (_mck) {
				var _now = Date.now();
				if (Object.keys(MannerCache).length > 500) {
					for (var _k in MannerCache) {
						if (MannerCache[_k].t < _now - MANNER_CACHE_TTL) delete MannerCache[_k];
					}
				}
				MannerCache[_mck] = { t: _now, d: $md };
			}
			if (my.game.chain) aft($md.filter(function (item) {
				return !my.game.chain.includes(item._id);
			}));
			else aft($md);
		});
	}
	return R;
}


function shuffle(arr) {
	var r = arr.slice(); // 원본 배열 복사
	for (var i = r.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = r[i];
		r[i] = r[j];
		r[j] = temp;
	}
	return r;
}

function getChar(text) {
	var my = this;
	var type = Const.GAME_TYPE[my.mode];
	var len = text.length;
	var idx = -1;
	var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

	if (type === 'EKT' && my.rule.lang === 'en') {
		my._lastWordLen = len;
	}
	if (type === 'KKU' && my.rule.lang === 'ko') {
		my._lastWordLen = len;
	}

	// Priority 1: Middle Rule
	if (my.opts.middle) {
		if ((type === 'EKT' && my.rule.lang === 'en') || (type === 'KKU' && my.rule.lang === 'ko')) {
			if (len === 2) {
				if (my.opts.second) return text.charAt(0);
				return text.slice(-1);
			}
			if (len === 3) {
				// 3글자: 전체 반환
				return text;
			}
			// EKT/KKU Middle: 가운데 글자 기준으로 양옆 포함 (3글자)
			// Middle+Second (홀수): 가운데
			// Middle+Second (짝수): 인덱스를 하나 앞으로
			if (len % 2 !== 0) {
				// 홀수: 정확한 가운데 3글자
				idx = Math.floor(len / 2);
				return text.slice(idx - 1, idx + 2);
			} else {
				// 짝수
				if (my.opts.second) {
					// Middle+Second: 앞쪽 가운데
					idx = len / 2 - 1;
				} else {
					// Middle only: 뒤쪽 가운데
					idx = len / 2;
				}
				return text.slice(idx - 1, idx + 2);
			}
		}

		// KJM: 자모 분해 후 중간 자모 반환
		if (type === 'KJM') {
			var jamoStr = Const.decomposeToJamo(text);
			var jamoLen = jamoStr.length;
			var midIdx = (jamoLen % 2 !== 0)
				? Math.floor(jamoLen / 2)
				: (my.opts.second ? (jamoLen / 2 - 1) : (jamoLen / 2));
			if (midIdx >= 0 && midIdx < jamoLen) return jamoStr[midIdx];
			return jamoStr.slice(-1);
		}

		// Generic Middle (1글자 연결, 비-EKT 모드)
		// 홀수: 정확한 가운데 글자
		// 짝수 + 끝말: 뒤쪽 가운데 (len / 2)
		// 짝수 + 앞말(isKAP): 앞쪽 가운데 (len / 2 - 1)
		// Second: 반대
		if (len % 2 !== 0) {
			idx = Math.floor(len / 2);
		} else {
			// 짝수
			if (isKAP) {
				idx = my.opts.second ? (len / 2) : (len / 2 - 1);     // 앞말: 기본 앞쪽, 세컨드면 뒤쪽
			} else {
				idx = my.opts.second ? (len / 2 - 1) : (len / 2);     // 끝말: 기본 뒤쪽, 세컨드면 앞쪽
			}
		}
		if (idx >= 0 && idx < len) return text.charAt(idx);
	}

	// Priority 2: First Rule (첫말잇기)
	// 끝말: 앞에서 연결 / 앞말(isKAP): 뒤에서 연결
	// ABCDEFGH 예시: First=ABC(subChar=AB), First+Second=BCD(subChar=BC)
	// First가 들어가면 subChar는 3글자 중 앞 2글자
	if (my.opts.first) {
		if (my.opts.second) {
			// First+Second: 인덱스 1부터 3글자 (BCD)
			if (type === 'EKT' || type === 'KKU') return text.slice(1, 4); // EKT/KKU: 인덱스 1~3 (BCD)
			if (isKAP) return text.charAt(len - 2);       // 앞말: 끝에서 2번째
			return text.charAt(1);                         // 끝말: 앞에서 2번째
		}
		// First only: 맨 앞 3글자 (ABC)
		if (type === 'EKT' || type === 'KKU') return text.slice(0, 3);  // EKT/KKU: 인덱스 0~2 (ABC)
		if (isKAP) return text.charAt(len - 1);           // 앞말: 마지막
		return text.charAt(0);                             // 끝말: 첫번째
	}

	// Priority 3: Second Rule (세컨드)
	// 끝말: 끝에서 2번째 / 앞말(isKAP): 앞에서 2번째
	// ABCDEFGH 예시: Second=FG/EFG (끝에서 2번째까지, 마지막 글자 제외)
	if (my.opts.second) {
		if ((type === 'EKT' && my.rule.lang === 'en') || (type === 'KKU' && my.rule.lang === 'ko')) {
			// EKT/KKU: 끝에서 4~2번째 3글자 (EFG) - 마지막 글자(H) 제외
			if (len === 2) return text.charAt(0);
			if (len === 3) return text.slice(0, 2); // 2글자만 (AB)
			if (len >= 4) return text.slice(len - 4, len - 1); // EFG
		}
		// 1글자 연결
		if (isKAP) return text.charAt(1);                  // 앞말: 앞에서 2번째
		return text.charAt(len - 2);                       // 끝말: 끝에서 2번째
	}

	// Default
	switch (type) {
		case 'EKT':
			// EKT: 3-gram 모드가 활성화되지 않았으면 마지막 1글자, 활성화되었으면 마지막 3글자
			if (!my.game.ektTrigramMode) {
				return text.slice(-1);
			}
			return text.slice(-3);
		case 'KKU':
			// KKU: 3-gram 모드 - 마지막 3글자 (EKT와 동일)
			if (my.game.kkuTrigramMode) {
				return text.slice(-3);
			}
			return text.slice(-1);
		case 'EKK':
		case 'ESH':
		case 'KKT':
		case 'KSH':
			return text.slice(-1);
		case 'KJM':
			// KJM: 자모 분해 후 마지막 자모 반환
			return Const.decomposeToJamo(text).slice(-1);
		case 'KAP':
		case 'EAP':
		case 'KAK':
		case 'EAK':
			return text.charAt(0);
	}
};

// 연결 글자의 시작 인덱스를 반환 (클라이언트 하이라이팅용)
// getChar와 동일한 로직을 사용하되, 글자 대신 인덱스를 반환
function getLinkIndex(text) {
	var my = this;
	var type = Const.GAME_TYPE[my.mode];
	var len = text.length;
	var idx = -1;
	var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

	// Priority 1: Middle Rule
	if (my.opts.middle) {
		if ((type === 'EKT' && my.rule.lang === 'en') || (type === 'KKU' && my.rule.lang === 'ko')) {
			if (len === 2) {
				return my.opts.second ? 0 : 1;
			}
			// EKT/KKU Middle: 가운데 글자의 시작 인덱스
			// getChar에서 3글자를 반환하므로 시작 인덱스는 항상 idx - 1
			if (len % 2 !== 0) {
				idx = Math.floor(len / 2);
				return idx - 1; // 홀수: 가운데 3글자 시작 (idx-1부터 idx+1까지)
			} else {
				if (my.opts.second) {
					idx = len / 2 - 1;
				} else {
					idx = len / 2;
				}
				return idx - 1; // 짝수: 가운데 3글자 시작
			}
		}

		// KJM: 자모 분해 후 중간 자모의 인덱스 반환
		if (type === 'KJM') {
			var jamoStr = Const.decomposeToJamo(text);
			var jamoLen = jamoStr.length;
			var midIdx = (jamoLen % 2 !== 0)
				? Math.floor(jamoLen / 2)
				: (my.opts.second ? (jamoLen / 2 - 1) : (jamoLen / 2));
			return midIdx >= 0 ? midIdx : jamoLen - 1;
		}

		// Generic Middle (1글자)
		if (len % 2 !== 0) {
			return Math.floor(len / 2);
		} else {
			if (isKAP) {
				return my.opts.second ? (len / 2) : (len / 2 - 1);
			} else {
				return my.opts.second ? (len / 2 - 1) : (len / 2);
			}
		}
	}

	// Priority 2: First Rule
	if (my.opts.first) {
		if (my.opts.second) {
			if (type === 'EKT') return 1; // EKT: 1~3번째 시작
			if (type === 'KKU') return 1; // KKU: 1~2번째 시작
			if (isKAP) return len - 2;
			return 1;
		}
		if (type === 'EKT') return 0; // EKT: 0~2번째 시작
		if (type === 'KKU') return 0; // KKU: 0~1번째 시작
		if (isKAP) return len - 1;
		return 0;
	}

	// Priority 3: Second Rule
	if (my.opts.second) {
		if (type === 'EKT' && my.rule.lang === 'en') {
			if (len === 2) return 0;
			if (len >= 4) return len - 4; // 끝에서 4~2번째 시작
			else if (len === 3) return 0;
		}
		if (type === 'KKU' && my.rule.lang === 'ko') {
			if (len === 2) return 0;
			if (len >= 4) return len - 3; // 끝에서 3~1번째 시작
			else if (len === 3) return 0;
		}
		if (isKAP) return 1;
		return len - 2;
	}

	// Default
	switch (type) {
		case 'EKT':
			if (!my.game.ektTrigramMode) {
				return len - 1;
			}
			return len - 3; // 마지막 3글자 시작 인덱스
		case 'KKU':
			// KKU: 3-gram 모드 - 마지막 3글자 시작 인덱스 (EKT와 동일)
			if (my.game.kkuTrigramMode) {
				return len - 3;
			}
			return len - 1;
		case 'EKK':
		case 'ESH':
		case 'KKT':
		case 'KSH':
			return len - 1;
		case 'KJM':
			// KJM: 자모 분해 문자열에서 마지막 자모의 인덱스
			return Const.decomposeToJamo(text).length - 1;
		case 'KAP':
		case 'EAP':
		case 'KAK':
		case 'EAK':
			return 0;
	}
	return -1;
}

function getSubChar(char) {
	var my = this;
	var r;
	if (char.length > 1 && Const.GAME_TYPE[my.mode] !== "EKT" && Const.GAME_TYPE[my.mode] !== "KKU") return r;
	var c = char.charCodeAt();
	var k;
	var ca, cb, cc;
	var isKAP = (Const.GAME_TYPE[my.mode] === "KAP" || Const.GAME_TYPE[my.mode] === "KAK" || Const.GAME_TYPE[my.mode] === "EAP" || Const.GAME_TYPE[my.mode] === "EAK");

	switch (Const.GAME_TYPE[my.mode]) {
		case "EKT":
		case "KKU":
			// EKT/KKU 3-gram subChar 계산
			// char이 3글자인 경우:
			// - First 규칙: subChar는 앞 2글자 (ABC -> AB, BCD -> BC)
			// - 그 외: subChar는 뒤 2글자 (ABC -> BC, DEF -> EF)
			if (char.length >= 3) {
				if (my.opts.first) {
					r = char.slice(0, 2); // First 규칙: 앞 2글자
				} else {
					r = char.slice(1); // 그 외: 뒤 2글자
				}
			}
			break;
		case "EKK":
		case "KKT":
		case "KSH":
		case "KAP":
		case "KAK":
			k = c - 0xAC00;
			if (k < 0 || k > 11171) break;

			var srcCodes = [c];
			if (my.opts.vowelinv) {
				var medial = Math.floor(k / 28) % 21;
				if (VOWEL_INV_MAP[medial] !== undefined) {
					var initial = Math.floor(k / 588);
					var final = k % 28;
					var invCode = ((initial * 21) + VOWEL_INV_MAP[medial]) * 28 + final + 0xAC00;
					srcCodes.push(invCode);
				}
			}

			var resSet = new Set();

			srcCodes.forEach(function (cd) {
				if (cd !== c) resSet.add(String.fromCharCode(cd));

				// nodueum 옵션이 활성화되면 두음법칙 처리를 건너뜀
				if (my.opts.nodueum) {
					return; // 두음법칙 subChar 추가 안함
				}

				var k_sub = cd - 0xAC00;
				var ca = [Math.floor(k_sub / 588), Math.floor(k_sub / 28) % 21, k_sub % 28];
				var cb = [ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7];

				function buildChar(initial, medial, final) {
					return String.fromCharCode(((initial * 21) + medial) * 28 + final + 0xAC00);
				}

				if (my.opts.freedueum) {
					if (isKAP) {
						if (cb[0] === 4363) {
							resSet.add(buildChar(2, ca[1], ca[2]));
							resSet.add(buildChar(5, ca[1], ca[2]));
						} else if (cb[0] === 4354) {
							resSet.add(buildChar(5, ca[1], ca[2]));
						}
					} else {
						if (cb[0] === 4357) {
							resSet.add(buildChar(2, ca[1], ca[2]));
							resSet.add(buildChar(11, ca[1], ca[2]));
						} else if (cb[0] === 4354) {
							resSet.add(buildChar(11, ca[1], ca[2]));
						}
					}
				} else if (my.opts.robloxduum) {
					if (isKAP) {
						if (cb[0] === 4363) {
							if (NIEUN_TO_IEUNG.indexOf(cb[1]) !== -1) {
								resSet.add(buildChar(2, ca[1], ca[2]));
							}
							if (!RIEUL_TO_NIEUN.includes(cb[1])) {
								resSet.add(buildChar(5, ca[1], ca[2]));
							}
						} else if (cb[0] === 4354 && RIEUL_TO_NIEUN.indexOf(cb[1]) !== -1) {
							resSet.add(buildChar(5, ca[1], ca[2]));
						}
					} else {
						if (cb[0] === 4357) {
							if (RIEUL_TO_NIEUN.includes(cb[1])) {
								resSet.add(buildChar(2, ca[1], ca[2]));
							} else {
								resSet.add(buildChar(11, ca[1], ca[2]));
							}
						} else if (cb[0] === 4354) {
							if (NIEUN_TO_IEUNG.indexOf(cb[1]) !== -1) {
								resSet.add(buildChar(11, ca[1], ca[2]));
							}
						}
					}
				} else {
					if (isKAP) {
						if (cb[0] === 4363 && NIEUN_TO_IEUNG.indexOf(cb[1]) !== -1) {
							resSet.add(buildChar(2, ca[1], ca[2]));
						}
						if (cb[0] === 4363 && RIEUL_TO_IEUNG.indexOf(cb[1]) !== -1) {
							resSet.add(buildChar(5, ca[1], ca[2]));
						}
						if (cb[0] === 4354 && RIEUL_TO_NIEUN.indexOf(cb[1]) !== -1) {
							resSet.add(buildChar(5, ca[1], ca[2]));
						}
					} else {
						if (cb[0] === 4357) {
							if (RIEUL_TO_NIEUN.includes(cb[1])) {
								resSet.add(buildChar(2, ca[1], ca[2]));
							} else if (RIEUL_TO_IEUNG.includes(cb[1])) {
								resSet.add(buildChar(11, ca[1], ca[2]));
							}
						} else if (cb[0] === 4354) {
							if (NIEUN_TO_IEUNG.indexOf(cb[1]) != -1) {
								resSet.add(buildChar(11, ca[1], ca[2]));
							}
						}
					}
				}
			});

			if (resSet.size > 0) r = Array.from(resSet).join("|");
			break;
		case "ESH":
		default:
			break;
	}
	return r;
}

function isDodoli(text) {
	var my = this;
	var type = Const.GAME_TYPE[my.mode];
	var isRev = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

	// 인덱스 비교: 이을 글자 인덱스 == 이어지는 글자 인덱스면 항상 같은 글자 → skip
	var entryIndex = isRev ? text.length - 1 : 0;
	var linkIndex = getLinkIndex.call(my, text);
	if (entryIndex === linkIndex) return false;

	// 이어지는 글자
	var exitChar = getChar.call(my, text);
	if (exitChar.length > 1) return false; // 다글자 링킹(EKT/KKU trigram) skip

	// 이을 글자
	var entryChar = text.charAt(entryIndex);

	// 정확 일치
	if (entryChar === exitChar) return true;

	// getSubChar로 두음법칙 체크 (nodueum/freedueum/vowelinv/KAP 반전 자동 처리)
	var subChars = getSubChar.call(my, entryChar);
	if (subChars) {
		var subs = subChars.split('|');
		for (var i = 0; i < subs.length; i++) {
			if (subs[i] === exitChar) return true;
		}
	}

	return false;
}

function getReverseDueumChars(char) {
	var c = char.charCodeAt() - 0xAC00;
	if (c < 0 || c > 11171) return [];
	var medial = Math.floor(c / 28) % 21;
	var initial = Math.floor(c / 28 / 21);
	var final = c % 28;

	// Initial Codes: ㄴ(2, 4354), ㄹ(5, 4357), ㅇ(11, 4363)
	var curInitialCode = initial + 0x1100;
	var medialCode = medial + 0x1161;
	var results = [];

	// From ㄴ?
	if (curInitialCode === 4354) { // Current is ㄴ
		if (RIEUL_TO_NIEUN.includes(medialCode)) {
			results.push(String.fromCharCode(0xAC00 + (5 * 21 + medial) * 28 + final));
		}
	}
	// From ㅇ?
	else if (curInitialCode === 4363) { // Current is ㅇ
		if (RIEUL_TO_IEUNG.includes(medialCode)) {
			results.push(String.fromCharCode(0xAC00 + (5 * 21 + medial) * 28 + final));
		}
		if (NIEUN_TO_IEUNG.includes(medialCode)) {
			results.push(String.fromCharCode(0xAC00 + (2 * 21 + medial) * 28 + final));
		}
	}

	return results;
}

function getRandomChar(text) {
	var my = this;
	var type = Const.GAME_TYPE[my.mode];
	var len = text.length;
	var indices = [];
	var isEKT = (type === 'EKT');
	// 참고: getRandomChar 호출 시점에 현재 단어가 이미 chain에 push된 상태
	// 그래서 첫 턴인지 확인하려면 chain.length <= 1 체크 필요
	var firstMove = my.game.chain.length <= 1;

	// 게임 단위 글자별 캐시 초기화 (매너 체크용)
	if (!my.game._charCountCache) {
		my.game._charCountCache = {};
	}

	// EKT 모드 로직
	if (isEKT) {
		if (len === 2) {
			// 2글자 단어: 첫 글자(0) 또는 끝 글자(1) 중 선택
			indices = [0, 1];
		} else if (len >= 3) {
			// 3글자 이상: 3-gram 슬라이딩 윈도우
			for (var i = 0; i <= len - 3; i++) {
				if (!/[0-9\s]/.test(text.slice(i, i + 3))) indices.push(i);
			}
		}
	} else {
		// General Logic: All single characters
		for (var i = 0; i < len; i++) {
			if (!/[0-9\s]/.test(text.charAt(i))) indices.push(i);
		}
	}

	return new Promise(function (resolve) {
		// EKT 2글자 단어: 매너 체크 불필요 (다음 턴이 1글자 모드)
		if (isEKT && len === 2) {
			var randIdx = Math.floor(Math.random() * 2);
			return resolve({ index: randIdx, char: text.charAt(randIdx) });
		}

		// 매너 모드가 아니고 첫 턴도 아닌 경우: 랜덤 선택
		if (!isMannerLike(my.opts) && !firstMove) {
			if (indices.length > 0) {
				var randIdx = Math.floor(Math.random() * indices.length);
				return resolve({ index: indices[randIdx], char: getCharFromIndex(indices[randIdx]) });
			}
			return resolve(null);
		}

		// 매너 모드 또는 첫 턴: 셔플 후 순차 체크
		indices = shuffle(indices);
		var currentIndex = 0;

		var checkNext = function () {
			if (currentIndex >= indices.length) return resolve(null); // 모든 체크 실패 → 비매너 처리

			var idx = indices[currentIndex++];
			var char = getCharFromIndex(idx);
			var subChar = getSubChar.call(my, char);

			// 캐시 키 생성 (char + subChar 조합)
			var cacheKey = char + (subChar ? '|' + subChar : '');

			// 캐시된 결과가 있으면 사용
			if (my.game._charCountCache.hasOwnProperty(cacheKey)) {
				var cachedCount = my.game._charCountCache[cacheKey];
				processCount(cachedCount, idx, char, subChar, cacheKey, true);
				return;
			}

			// 해당 글자로 연결 가능한 단어 체크
			getAuto.call(my, char, subChar, 1).then(function (res) {
				var count = (typeof res === 'number') ? res : (res ? 1 : 0);

				// EKT 3-gram 모드: 3-gram과 2-gram 개수의 합으로 캐시
				if (isEKT && char.length >= 3) {
					var bigramChar = char.slice(1); // 맨 앞 글자 제외한 2-gram
					var bigramCacheKey = bigramChar;

					// 2-gram도 캐시 확인
					if (my.game._charCountCache.hasOwnProperty(bigramCacheKey)) {
						var bigramCount = my.game._charCountCache[bigramCacheKey];
						var totalCount = count + bigramCount;
						// 3-gram에 2-gram을 포함한 총합을 캐시
						my.game._charCountCache[cacheKey] = totalCount;
						processCount(totalCount, idx, char, subChar, cacheKey, false);
					} else {
						// 2-gram도 조회 필요
						getAuto.call(my, bigramChar, null, 1).then(function (bigramRes) {
							var bigramCount = (typeof bigramRes === 'number') ? bigramRes : (bigramRes ? 1 : 0);
							// 2-gram 캐시 저장
							my.game._charCountCache[bigramCacheKey] = bigramCount;
							var totalCount = count + bigramCount;
							// 3-gram에 2-gram을 포함한 총합을 캐시
							my.game._charCountCache[cacheKey] = totalCount;
							processCount(totalCount, idx, char, subChar, cacheKey, false);
						});
					}
				} else {
					// 비 EKT 또는 non-trigram: 단일 값 캐시
					my.game._charCountCache[cacheKey] = count;
					processCount(count, idx, char, subChar, cacheKey, false);
				}
			});
		};

		function processCount(count, idx, char, subChar, cacheKey, isCached) {
			var used = 0;

			// 이미 사용된 단어 계산 (한국어 끝말잇기와 동일한 로직)
			var checkChars = [char];
			if (subChar) subChar.split("|").forEach(function (c) {
				if (c && checkChars.indexOf(c) == -1) checkChars.push(c);
			});
			var gameType = Const.GAME_TYPE[my.mode];
			var isKAP = (gameType === 'KAP' || gameType === 'KAK' || gameType === 'EAP' || gameType === 'EAK');

			if (my.game.chain) {
				var checkChain = my.game.chain;
				if (my.opts.return) checkChain = my.game.chain.slice(-5);

				checkChain.forEach(function (doneWord) {
					var match = false;
					checkChars.forEach(function (cc) {
						if (isKAP) {
							if (doneWord.slice(-cc.length) === cc) match = true;
						} else {
							if (doneWord.indexOf(cc) === 0) match = true;
						}
					});
					if (match) used++;
				});
			}

			// 제출할 단어 자체도 연결 글자로 시작하면 used로 카운트
			checkChars.forEach(function (cc) {
				if (isKAP) {
					if (text.slice(-cc.length) === cc) used++;
				} else {
					if (text.indexOf(cc) === 0) used++;
				}
			});

			// EKT 3-gram: 2-gram 사용된 단어도 계산
			if (isEKT && char.length >= 3) {
				var bigramChar = char.slice(1);
				if (my.game.chain) {
					var checkChain = my.game.chain;
					if (my.opts.return) checkChain = my.game.chain.slice(-5);
					checkChain.forEach(function (doneWord) {
						if (doneWord.indexOf(bigramChar) === 0) used++;
					});
				}
				if (text.indexOf(bigramChar) === 0) used++;
			}

			var remaining = count - used;

			// 매너 한도: 최소 1단어
			var minRemaining = 1;
			if (remaining >= minRemaining) {
				// 성공한 글자의 남은 단어 수를 저장 (finishTurn에서 재사용)
				my.game.nextCharWordCount = remaining;
				resolve({ index: idx, char: char });
			} else {
				// 한방 (비매너), 다음 후보 체크
				checkNext();
			}
		}

		checkNext();
	});

	function getCharFromIndex(idx) {
		if (isEKT) {
			if (len === 2) {
				return text.charAt(idx); // 1글자
			}
			return text.slice(idx, idx + 3); // 3-gram
		}
		return text.charAt(idx);
	}
}

function escapeRegExp(string) {
	if (string === undefined || string === null) {
		return '';
	}
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.titlePool = titlePool;
exports.TITLE_POOL_MIN = TITLE_POOL_MIN;
exports.fillTitlePool = _fillTitlePool;

// Exports: constants
exports.ROBOT_START_DELAY = ROBOT_START_DELAY;
exports.ROBOT_TYPE_COEF = ROBOT_TYPE_COEF;
exports.ROBOT_THINK_COEF = ROBOT_THINK_COEF;
exports.ROBOT_HIT_LIMIT = ROBOT_HIT_LIMIT;
exports.ROBOT_LENGTH_LIMIT = ROBOT_LENGTH_LIMIT;
exports.ROBOT_CANDIDATE_LIMIT = ROBOT_CANDIDATE_LIMIT;
exports.SPECIAL_MOVE_PROB = SPECIAL_MOVE_PROB;
exports.PERSONALITY_CONST = PERSONALITY_CONST;
exports.PREFERRED_CHAR_PROB = PREFERRED_CHAR_PROB;
exports.RIEUL_TO_NIEUN = RIEUL_TO_NIEUN;
exports.RIEUL_TO_IEUNG = RIEUL_TO_IEUNG;
exports.NIEUN_TO_IEUNG = NIEUN_TO_IEUNG;
exports.PRIORITY_ATTACK_CHARS = PRIORITY_ATTACK_CHARS;
exports.PRIORITY_ATTACK_CHARS_MANNER = PRIORITY_ATTACK_CHARS_MANNER;
exports.PRIORITY_KAP_ATTACK_CHARS = PRIORITY_KAP_ATTACK_CHARS;
exports.PRIORITY_KAP_ATTACK_CHARS_MANNER = PRIORITY_KAP_ATTACK_CHARS_MANNER;
exports.PRIORITY_KAP_ATTACK_CHARS_EN = PRIORITY_KAP_ATTACK_CHARS_EN;
exports.PRIORITY_ATTACK_CHARS_EN = PRIORITY_ATTACK_CHARS_EN;
exports.PRIORITY_ATTACK_CHARS_MANNER_EN = PRIORITY_ATTACK_CHARS_MANNER_EN;
exports.DUBANG = DUBANG;
exports.DUBANG_KAP = DUBANG_KAP;
exports.AVOID_FD = AVOID_FD;
exports.AVOID_VI = AVOID_VI;
exports.EKT_BIGRAMS = EKT_BIGRAMS;
exports.VOWEL_INV_MAP = VOWEL_INV_MAP;
exports.escapeRegExp = escapeRegExp;

// Exports: functions
exports.getStatsDoc = getStatsDoc;
exports.getAllStatsDocs = getAllStatsDocs;
exports.getPlayerId = getPlayerId;
exports.isMannerLike = isMannerLike;
exports.getMannerMinRemaining = getMannerMinRemaining;
exports.shouldDeepCheck = shouldDeepCheck;
exports.getMannerState = getMannerState;
exports.getMannerCacheKey = getMannerCacheKey;
exports.getAttackChars = getAttackChars;
exports.applyAlternating = applyAlternating;
exports.predictNextAlternating = predictNextAlternating;
exports.getNextTurnLength = getNextTurnLength;
exports.getMission = getMission;
exports.getAuto = getAuto;
exports.shuffle = shuffle;
exports.getChar = getChar;
exports.getLinkIndex = getLinkIndex;
exports.getSubChar = getSubChar;
exports.isDodoli = isDodoli;
exports.getReverseDueumChars = getReverseDueumChars;
exports.getRandomChar = getRandomChar;