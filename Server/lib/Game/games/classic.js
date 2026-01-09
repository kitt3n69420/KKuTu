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
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [4, 2, 1, 0, 0];
const ROBOT_HIT_LIMIT = [4, 3, 2, 1, 0];
const ROBOT_LENGTH_LIMIT = [3, 6, 12, 24, 999];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];
const SPECIAL_MOVE_PROB = [0, 0, 0.1, 0.25, 0.4];
const PERSONALITY_CONST = [0, 0, 0.5, 0.8, 0.99];
const PREFERRED_CHAR_PROB = [0.6, 0.7, 0.8, 0.9, 1.0];
const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];
const PRIORITY_ATTACK_CHARS = ["렁", "듈", "븐", "튬", "쾃", "럿", "듐", "픔", "뮴", "읃", "읓", "읔", "읕", "읖", "읗", "냑", "녘"];
const PRIORITY_ATTACK_CHARS_MANNER = ["릇", "륨", "늄", "럴", "텝", "슭", "픈", "깟", "왑", "켓", "븨", "껏"];
const PRIORITY_KAP_ATTACK_CHARS = ["녈", "맞", "흰", "뉸", "뒷", "헛", "붉", "뻐", "첫", "룍", "뇩", "넓", "홑", "맆", "렾", "녚", "갯", "받", "뉼", "앉", "높", "롶", "돼", "윗", "넙", "랼", "된", "뾰", "햇", "엑", "좁", "굳", "왼", "뻔", "빤", "륽", "늙", "뺑", "엎", "같", "띾", "꺾", "닫", "랕", "뙤", "돋", "쨍", "씽", "꽈", "귓", "므", "쌩", "샐", "잦", "섞", "덮", "맏", "얽", "왱", "긁", "짧", "걷", "헥", "잿"];
const PRIORITY_KAP_ATTACK_CHARS_MANNER = ["겉", "쩔", "떠", "녑", "훌", "숫", "붙", "곧", "랒", "쫄", "쏠", "녓", "갸", "콧", "갖", "썰", "뻥", "삥", "쩌", "뗑", "꺄", "쐐", "헝", "갤", "촬", "옵", "찡", "믿", "줴", "촐", "놓", "쓴", "맑", "칡", "핸", "힌", "싀", "깁", "씀", "뭍"];
const DUBANG = ["괙", "귁", "껙", "꿕", "뀍", "늡", "릅", "돨", "똴", "뙁", "뛸", "뜩", "띡", "띨", "멫", "몇", "뱍", "뷩", "뷩", "븩", "뽓", "뿅", "솰", "쏼", "었", "쟘", "좍", "좜", "좸", "줅", "줍", "쥄", "쫙", "챱", "홱", "깟", "팅"]
const DUBANG_KAP = ["뒷", "쌩", "빤", "핫", "갤", "캘", "왱", "헛"];
const PRIORITY_ATTACK_CHARS_EN = ["ght", "ock", "ick", "ird", "ert", "ork", "eck", "nds", "uck", "ond", "lue", "lls", "elt", "rds", "arp", "uff", "erm", "irl", "ilt", "ilk", "ods", "cks", "ays", "iff", "ett", "olt", "ors", "erb", "ohn", "erk", "awk", "nks", "irs", "irm", "urd", "ilm", "nue", "rks", "arf", "nyx", "erd", "ryx", "olk", "itt", "rys", "gie", "url", "nck", "ils", "avy", "ynx", "ews", "mie", "irk", "cht", "cue", "ulb", "onk", "elp", "urk", "ldt", "aws"];
const PRIORITY_ATTACK_CHARS_MANNER_EN = ["ack", "ark", "ics", "orm", "ers", "ify", "ons", "omb", "ngs", "ump", "owl", "ift", "urn", "rie", "eek", "oud", "elf", "irt", "ild", "kie", "itz", "rld", "iew", "thm", "els", "awl", "awn", "rue", "yew", "eft", "oft", "ffy", "uld", "hew", "ivy", "rtz", "egs", "tew", "oux", "rns", "ebs", "tua", "tyl", "efy", "ohm", "omp", "bbs", "ltz", "ggs", "oek", "xxv", "few", "wyn", "orr", "utz", "enn", "ebb", "hns", "ogs", "ruz", "ibs", "uhr", "nyl"];
const PRIORITY_KAP_ATTACK_CHARS_EN = ["j", "q", "x", "z"];
const AVOID_FD = ["렁", "냑", "럿", "럴"];
const AVOID_VI = ["렁", "냑", "럿", "럴", "륨", "늄", "윰", "켓", "껏", "귬"];
const EKT_BIGRAMS = ["co", "un", "in", "re", "ca", "de", "ma", "pr", "di", "st", "pa", "ch", "se", "an", "ba", "pe", "tr", "su", "me", "ha", "sa", "po", "mo", "mi", "he", "sp", "la", "br", "no", "sh", "be", "ho", "sc", "cr", "li", "th", "te", "bo", "ar", "al", "gr", "ta", "fo", "so", "ex", "ra", "en", "lo", "ac", "si", "le", "ne", "pl", "pi", "bu", "to", "ga", "bl", "cl", "do", "bi", "hy", "fa", "fi", "ph", "fl", "ro", "im", "wa", "mu", "as", "vi", "fr", "pu", "am", "da", "ap", "ce", "cu", "ve", "ad", "na", "wi", "go", "ab", "ge", "hi", "va", "ti", "ov", "qu", "dr", "fe", "or", "sl", "ri", "gl", "au", "we", "tu", "wo", "sy", "ni", "fu", "hu", "el", "ru", "lu", "wh", "cy", "at", "gu", "du", "em", "ci", "ki", "ka", "ag", "my"];
const VOWEL_INV_MAP = {
	0: 4, 4: 0, 1: 5, 5: 1, 2: 6, 6: 2, 3: 7, 7: 3,
	8: 13, 13: 8, 9: 14, 14: 9, 10: 15, 15: 10, 11: 16, 16: 11,
	12: 17, 17: 12
};
var AttackCache = {};

function getAttackChars(my) {
	return new Promise(function (resolve) {
		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;

		var isRev = !!my.rule._back;
		var col = isRev ? `end_${state}` : `start_${state}`;
		var key = my.rule.lang + "_" + col;

		var isKo = my.rule.lang === 'ko';
		var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;
		var useCol = col;
		if (isKo) {
			var reqLen = getNextTurnLength.call(my);
			var lenSuffix = (reqLen === 2) ? "2" : (reqLen === 3) ? "3" : (reqLen === 4) ? "4" : "all";
			useCol = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
		} else {
			useCol = `count_${state}`;
		}
		// Update Cache Key to include useCol and Manner state
		key += "_" + useCol + "_M" + (my.opts.manner ? 1 : 0);

		// Cache Validity: 1 hour (or until restart)
		if (AttackCache[key] && AttackCache[key].time > Date.now() - 3600000) {
			return resolve(AttackCache[key].data);
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

		var p1 = new Promise(function (res1) {
			// Tier 1: One-shot killers (count 0-2)
			// Logic: If Manner mode, exclude 0. Count 1-2 allowed.
			// If Normal mode, include 0-2.

			var cond = {};
			if (my.opts.manner) {
				cond = { $gte: 1, $lte: 2 };
			} else {
				cond = { $lte: 2 };
			}

			table.find([useCol, cond]).sort({
				[useCol]: 1
			}).limit(100).on(function (docs) {
				res1(docs || []);
			}, null, () => res1([]));
		});

		var p2 = new Promise(function (res2) {
			// Tier 2: Soft killers (count 3-5)
			table.find([useCol, {
				$gte: 3
			}], [useCol, {
				$lte: 5
			}]).sort({
				[useCol]: 1
			}).limit(200).on(function (docs) {
				res2(docs ? docs.map(d => d._id) : []);
			}, null, () => res2([]));
		});

		var p3 = new Promise(function (res3) {
			// Priority chars from manual list
			var allPriority = priorityList.concat(priorityMannerList);
			var isKo = my.rule.lang === 'ko';
			var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;
			// Note: This promise just fetches documents by ID. Doesn't use columns yet.
			// But for consistency we should use the new table.
			table.find(['_id', {
				$in: allPriority
			}]).on(function (docs) {
				res3(docs || []);
			}, null, () => res3([]));
		});

		Promise.all([p1, p2, p3]).then(function (results) {
			var hardKillers = results[0]; // Tier 1 base
			var softKillers = results[1]; // Tier 2 base
			var priorityDocs = results[2]; // Full docs

			// Build Tier 1: Hard killers + Priority chars that are hard
			var tier1Set = new Set();
			var tier2Set = new Set(softKillers);

			// Process DB Hard Killers
			hardKillers.forEach(function (doc) {
				// DB query already filtered based on Manner (0 or 1-2).
				// So just add them.
				tier1Set.add(doc._id);
			});

			// Process Priority Chars (Heuristics) - Add to Tier 1 or Tier 2
			priorityDocs.forEach(function (doc) {
				var count = doc[useCol];
				if (!count && count !== 0) count = 0; // Normalize undefined to 0

				if (my.opts.manner) {
					// Manner Mode: Exclude ONLY if count is 0
					if (count === 0) return;
				}

				if (count <= 2) {
					// Hard Killer (Heuristic) -> Tier 1
					tier1Set.add(doc._id);
				} else {
					// Soft Killer (Heuristic) -> Tier 2
					tier2Set.add(doc._id);
				}
			});



			var tier1 = Array.from(tier1Set);
			var tier2 = Array.from(tier2Set);

			var data = {
				tier1: tier1,
				tier2: tier2
			};

			AttackCache[key] = {
				time: Date.now(),
				data: data
			};
			console.log(`[BOT] Updated Attack Cache for ${key}: Tier1=${tier1.length}, Tier2=${tier2.length} (Manner:${my.opts.manner})`);
			resolve(data);
		});
	});
}


exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var l = my.rule;
	var EXAMPLE;
	var eng, ja;

	if (!l) {
		R.go("undefinedd");
		return R;
	}
	if (!l.lang) {
		R.go("undefinedd");
		return R;
	}

	EXAMPLE = Const.EXAMPLE_TITLE[l.lang];
	my.game.dic = {};

	// EKT: 타이틀을 단어가 아니라 1~10 동그라미 숫자로 표시
	if (l.lang === 'en' && Const.GAME_TYPE[my.mode] === 'EKT') {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
		return R;
	}

	switch (Const.GAME_TYPE[my.mode]) {
		case 'EKK':
			if (my.opts.length7) my.game.wordLength = 7;
			else if (my.opts.length6) my.game.wordLength = 6;
			else if (my.opts.length5) my.game.wordLength = 5;
			else if (my.opts.length4) my.game.wordLength = 4;
			else if (my.opts.length3) my.game.wordLength = 3;
			else my.game.wordLength = 5;
		case 'ESH':
			eng = "^" + String.fromCharCode(97 + Math.floor(Math.random() * 26));
			break;
		case 'EKT':
			// EKT: 2글자 bigram 리스트에서 랜덤 선택
			eng = "^" + EKT_BIGRAMS[Math.floor(Math.random() * EKT_BIGRAMS.length)];
			break;
		case 'EAK':
			if (my.opts.length7) my.game.wordLength = 7;
			else if (my.opts.length6) my.game.wordLength = 6;
			else if (my.opts.length5) my.game.wordLength = 5;
			else if (my.opts.length4) my.game.wordLength = 4;
			else if (my.opts.length3) my.game.wordLength = 3;
			else my.game.wordLength = 5;
			eng = String.fromCharCode(97 + Math.floor(Math.random() * 26)) + "$";
			break;
		case 'KKT':
			my.game.wordLength = 3;
		case 'KSH':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "^[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]";
			break;
		case 'KAK':
			my.game.wordLength = 3;
		case 'KAP':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]$";
			break;
	}

	function tryTitle(h) {
		if (h > 50) {
			R.go(EXAMPLE);
			return;
		}
		DB.kkutu[l.lang].find(
			['_id', new RegExp(eng + ".{" + Math.max(1, my.round - 1) + "}$")],
			// [ 'hit', { '$lte': h } ],
			(l.lang == "ko") ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
			// '$where', eng+"this._id.length == " + Math.max(2, my.round) + " && this.hit <= " + h
		).limit(20).on(function ($md) {
			var list;

			if ($md.length) {
				list = shuffle($md);
				checkTitle(list.shift()._id).then(onChecked);

				function onChecked(v) {
					if (v) R.go(v);
					else if (list.length) checkTitle(list.shift()._id).then(onChecked);
					else R.go(EXAMPLE);
				}
			} else {
				tryTitle(h + 10);
			}
		});
	}

	function checkTitle(title) {
		var R = new Lizard.Tail();
		var i, list = [];
		var len;

		/* 부하가 너무 걸린다면 주석을 풀자.
		R.go(true);
		return R;
		*/
		if (title == null) {
			R.go(false);
			return R;
		}

		// Unknown Word 규칙: 모든 단어 허용 (검증 건너뜀)
		if (my.opts.unknown) {
			R.go(title);
			return R;
		}

		// 조건 1: 고유 음절 검증
		// 제시어의 고유한 음절 수가 제시어 글자수보다 2 이상 차이나면 부적절
		var uniqueChars = new Set(title.split('')).size;
		if (title.length - uniqueChars >= 2) {
			console.log(`[TITLE] Rejected "${title}": Too many duplicate chars (${uniqueChars} unique / ${title.length} total)`);
			R.go(false);
			return R;
		}

		// 조건 2: 연결 가능 단어 개수 검증 (kkutu_stats 사용)
		len = title.length;
		for (i = 0; i < len; i++) {
			list.push(countTitleWords.call(my, title[i], getSubChar.call(my, title[i])));
		}

		Lizard.all(list).then(function (res) {
			for (i = 0; i < res.length; i++) {
				if (res[i] < 5) {
					console.log(`[TITLE] Rejected "${title}": Char "${title[i]}" has only ${res[i]} connectable words`);
					return R.go(false);
				}
			}
			return R.go(title);
		});

		return R;
	}
	// 제시어 글자별 연결 가능 단어 수 조회 (kkutu_stats 사용)
	function countTitleWords(char, subChar) {
		var my = this;
		var R = new Lizard.Tail();
		var gameType = Const.GAME_TYPE[my.mode];
		var isRev = (gameType === 'KAP' || gameType === 'KAK' || gameType === 'EAP' || gameType === 'EAK');

		// State 비트마스크 계산 (stats_helper.js와 동일)
		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;

		var col = isRev ? `end_${state}` : `start_${state}`;

		// char와 subChar 모두에서 시작하는 단어를 합산
		// subChar가 파이프로 구분된 경우 분리하여 처리
		var chars = [char];
		if (subChar) {
			subChar.split('|').forEach(function (sc) {
				if (sc && sc !== char && chars.indexOf(sc) === -1) chars.push(sc);
			});
		}

		var pending = chars.length;
		var totalCount = 0;

		chars.forEach(function (c) {
			var isKo = my.rule.lang === 'ko';
			var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;
			var colName = col;

			if (isKo) {
				// Title check: usually standard "start_all" or specific? 
				// The game hasn't started, so wordLength might be default.
				// For KKT, wordLength is 3.
				var reqLen = my.game.wordLength || 0;
				var lenSuffix = (reqLen === 2) ? "2" : (reqLen === 3) ? "3" : (reqLen === 4) ? "4" : "all";
				colName = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
			} else {
				colName = `count_${state}`;
			}

			table.findOne(['_id', c]).on(function (doc) {
				if (doc && doc[colName]) {
					totalCount += doc[colName];
				}
				if (--pending === 0) {
					R.go(totalCount);
				}
			}, null, function () {
				if (--pending === 0) {
					R.go(totalCount);
				}
			});
		});

		return R;
	}
	tryTitle(10);

	return R;
};
exports.roundReady = function () {
	var my = this;
	if (!my.game.title) return;

	clearTimeout(my.game.turnTimer);
	my.game.round++;

	if (my.opts.straight && my.game.seq) {
		var i, p;
		for (i in my.game.seq) {
			p = (typeof my.game.seq[i] === 'string') ? DIC[my.game.seq[i]] : my.game.seq[i];
			if (p && p.game) {
				p.game.straightStreak = 0;
				delete p.game.lastWordLen;
			}
		}
	}
	my.game.roundTime = my.time * 1000;
	if (my.game.round <= my.round) {
		// EKT: 매 라운드마다 EKT_BIGRAMS에서 랜덤 bigram 직접 선택
		if (Const.GAME_TYPE[my.mode] === 'EKT') {
			my.game.char = EKT_BIGRAMS[Math.floor(Math.random() * EKT_BIGRAMS.length)];
		} else {
			my.game.char = my.game.title[my.game.round - 1];
		}
		my.game.subChar = getSubChar.call(my, my.game.char);
		my.game.chain = [];
		my.game.ektTrigramMode = (Const.GAME_TYPE[my.mode] === 'EKT'); // EKT: 항상 3-gram 모드 활성화
		if (my.opts.mission) my.game.mission = getMission(my.rule.lang);
		if (my.opts.sami) {
			my.game.wordLength = 2;
			my.game.samiCount = 0;
		}
		// 3-2 renamed to sami, but logic is same.
		// New rules:
		if (my.opts.twotwo) {
			my.game.wordLength = 2;
		}
		if (my.opts.fourfour) {
			my.game.wordLength = 4;
		}
		if (my.opts.fourthree) {
			my.game.wordLength = 4;
			my.game.samiCount = 0; // Reuse samiCount for alternating
		}

		// New Length Rules (Priority: 7 > 6 > 5 > 4 > 3)
		if (my.opts.length7) my.game.wordLength = 7;
		else if (my.opts.length6) my.game.wordLength = 6;
		else if (my.opts.length5) my.game.wordLength = 5;
		else if (my.opts.length4) my.game.wordLength = 4;
		else if (my.opts.length3) my.game.wordLength = 3;

		my.byMaster('roundReady', {
			round: my.game.round,
			char: my.game.char,
			subChar: my.game.subChar,
			mission: my.game.mission
		}, true);
		my.game.turnTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};
exports.turnStart = function (force) {
	var my = this;
	var speed;
	var si;

	if (!my.game.chain) return;
	my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.chain.length * 1500));
	speed = my.getTurnSpeed(my.opts.speed ? my.game.roundTime / 2 : my.game.roundTime);
	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.robotTimer);
	my.game.late = false;
	my.game.turnTime = 15000 - 1400 * speed;
	my.game.turnAt = (new Date()).getTime();
	//my.game.turnAt = (new Date()).getTime(); // 이건 콩의 저주야
	if (my.opts.sami) {
		var n = my.game.seq.length;
		if (n % 2 !== 0) {
			my.game.wordLength = (my.game.wordLength == 3) ? 2 : 3;
		} else {
			if (typeof my.game.samiCount === 'undefined') my.game.samiCount = 0;
			var idx = my.game.samiCount % (n + 1);
			my.game.wordLength = (idx % 2 === 0) ? 3 : 2;
			my.game.samiCount++;
		}
	} else if (my.opts.fourthree) {
		var n = my.game.seq.length;
		if (n % 2 !== 0) {
			my.game.wordLength = (my.game.wordLength == 4) ? 3 : 4;
		} else {
			if (typeof my.game.samiCount === 'undefined') my.game.samiCount = 0;
			var idx = my.game.samiCount % (n + 1);
			my.game.wordLength = (idx % 2 === 0) ? 4 : 3;
			my.game.samiCount++;
		}
	} else if (my.opts.twotwo) {
		my.game.wordLength = 2;
	} else if (my.opts.fourfour) {
		my.game.wordLength = 4;
	}

	// New Length Rules (Priority: 7 > 6 > 5 > 4 > 3)
	if (my.opts.length7) my.game.wordLength = 7;
	else if (my.opts.length6) my.game.wordLength = 6;
	else if (my.opts.length5) my.game.wordLength = 5;
	else if (my.opts.length4) my.game.wordLength = 4;
	else if (my.opts.length3) my.game.wordLength = 3;

	// 한방 체크: 매너 체크에서 저장된 값 재사용 또는 새로 계산
	if (typeof my.game.nextCharWordCount !== 'undefined') {
		// 매너 체크에서 저장된 값이 있으면 재사용 (중복 쿼리 방지)
		var isHanbang = (my.game.nextCharWordCount === 0);
		delete my.game.nextCharWordCount; // 사용 후 삭제

		my.byMaster('turnStart', {
			turn: my.game.turn,
			char: my.game.char,
			subChar: my.game.subChar,
			speed: speed,
			roundTime: my.game.roundTime,
			turnTime: my.game.turnTime,
			mission: my.game.mission,
			wordLength: my.game.wordLength,
			sumiChar: my.game.sumiChar,
			isHanbang: isHanbang,
			seq: force ? my.game.seq : undefined
		}, true);

		my.game.turnTimer = setTimeout(my.turnEnd, Math.min(my.game.roundTime, my.game.turnTime + 100));
		if (si = my.game.seq[my.game.turn])
			if (si.robot) {
				si._done = [];
				if (si.data) delete si.data.retryCount;
				my.readyRobot(si);
			}
	} else {
		// 저장된 값이 없으면 새로 계산 (첫 턴 등)
		getAuto.call(my, my.game.char, my.game.subChar, 1).then(function (w) {
			var count = (typeof w === 'number') ? w : (w ? 1 : 0);
			var used = 0;

			// 이미 사용된 단어 개수 계산
			if (my.game.chain) {
				var checkChars = [my.game.char];
				if (my.game.subChar) my.game.subChar.split("|").forEach(function (c) {
					if (c && checkChars.indexOf(c) == -1) checkChars.push(c);
				});
				var type = Const.GAME_TYPE[my.mode];
				var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

				my.game.chain.forEach(function (doneWord) {
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

			// 남은 단어가 0개면 한방
			var isHanbang = (count - used === 0);

			my.byMaster('turnStart', {
				turn: my.game.turn,
				char: my.game.char,
				subChar: my.game.subChar,
				speed: speed,
				roundTime: my.game.roundTime,
				turnTime: my.game.turnTime,
				mission: my.game.mission,
				wordLength: my.game.wordLength,
				sumiChar: my.game.sumiChar,
				isHanbang: isHanbang,
				seq: force ? my.game.seq : undefined
			}, true);

			my.game.turnTimer = setTimeout(my.turnEnd, Math.min(my.game.roundTime, my.game.turnTime + 100));
			if (si = my.game.seq[my.game.turn])
				if (si.robot) {
					si._done = [];
					if (si.data) delete si.data.retryCount; // Reset Retry Count for new turn
					my.readyRobot(si);
				}
		});
	}
};


function getNextTurnLength() {
	var my = this;
	if (my.opts.sami) {
		var n = my.game.seq.length;
		if (n % 2 !== 0) {
			return (my.game.wordLength == 3) ? 2 : 3;
		} else {
			var nextIdx = (my.game.samiCount + 1) % (n + 1);
			return (nextIdx % 2 === 0) ? 3 : 2;
		}
	}
	if (my.opts.fourthree) {
		var n = my.game.seq.length;
		if (n % 2 !== 0) {
			return (my.game.wordLength == 4) ? 3 : 4;
		} else {
			var nextIdx = (my.game.samiCount + 1) % (n + 1);
			return (nextIdx % 2 === 0) ? 4 : 3;
		}
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

exports.turnEnd = function () {
	var my = this;
	var target;
	var score;

	if (!my.game.seq) return;
	target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];

	if (my.game.loading) {
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	clearTimeout(my.game.turnTimer);
	my.game.late = true;
	if (target)
		if (target.game) {
			score = Const.getPenalty(my.game.chain, target.game.score);
			target.game.score += score;
		}
	getAuto.call(my, my.game.char, my.game.subChar, 0).then(function (w) {
		my.byMaster('turnEnd', {
			ok: false,
			target: target ? target.id : null,
			score: score,
			hint: w
		}, true);

		// Bot timeout message logic
		if (target && my.game.seq) {
			var bots = [];
			var i, p, item;
			var targetId = (typeof target === 'object') ? target.id : target;

			console.log("[DEBUG] TurnEnd Timeout: targetId=" + targetId);
			// if (!Const.ROBOT_TIMEOUT_MESSAGES) console.error("[ERROR] ROBOT_TIMEOUT_MESSAGES is undefined!");

			for (i in my.game.seq) {
				item = my.game.seq[i];
				if (typeof item === 'string') {
					p = DIC[item];
				} else {
					p = item;
				}

				if (p && p.robot) {
					console.log("[DEBUG] Found bot: " + p.id + " (Target: " + targetId + ")");
					if (p.id !== targetId) {
						bots.push(p);
					}
				}
			}

			// console.log("[DEBUG] Candidate bots count: " + bots.length);

			if (bots.length > 0) {
				var prob = 0.5 / bots.length;
				// console.log("[DEBUG] Probability per bot: " + prob);
				for (i in bots) {
					var rand = Math.random();
					// console.log("[DEBUG] Bot " + bots[i].id + " roll: " + rand + " vs " + prob);
					if (rand < prob) {
						(function (bot) {
							// console.log("[DEBUG] Scheduling message for bot " + bot.id);
							setTimeout(function () {
								var msg = Const.ROBOT_TIMEOUT_MESSAGES[Math.floor(Math.random() * Const.ROBOT_TIMEOUT_MESSAGES.length)];
								// console.log("[DEBUG] Bot " + bot.id + " saying: " + msg);
								bot.chat(msg);
							}, 500 + Math.random() * 1000);
						})(bots[i]);
					}
				}
			}
		}

		my.game._rrt = setTimeout(my.roundReady, 3000);
	});
	clearTimeout(my.game.robotTimer);
};
exports.submit = function (client, text) {
	var score, l, t;
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];

	if (!mgt) return;
	if (!mgt.robot)
		if (mgt != client.id) return;
	if (!my.game.char) return;

	if (!isChainable(text, my.mode, my.game.char, my.game.subChar)) return client.chat(text);

	// Surrogate character check: reject inputs containing surrogates (e.g., emojis)
	if (/[\uD800-\uDFFF]/.test(text)) {
		client.publish('turnError', { code: 404, value: text }, true);
		if (my.opts.one) my.turnEnd();
		return;
	}

	// EKT 3-gram 모드에서 3글자 이하 단어 입력 시 채팅으로 처리 (게임 진행 안함)
	if (Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode && text.length < 4) {
		return client.chat(text);
	}

	if (my.game.chain.indexOf(text) != -1) {
		var isRecentDuplicate = my.opts.return && my.game.chain.slice(-5).indexOf(text) != -1;

		if (my.opts.return && !isRecentDuplicate) {
			// Return rule: Allow duplicate but 0 score
		} else {
			if (client.robot && client.data.candidates && client.data.candidateIndex < client.data.candidates.length - 1) {
				client.data.candidateIndex++;
				var nextWord = client.data.candidates[client.data.candidateIndex];
				setTimeout(function () {
					my.turnRobot(client, nextWord._id);
				}, ROBOT_START_DELAY[client.level]);
				return;
			}
			client.publish('turnError', {
				code: isRecentDuplicate ? 411 : 409,
				value: text
			}, true);

			// Retry Logic for Bot: If candidates exhausted (duplicate word), try Tier 2.
			// Logic: Tier 1 Fail -> Retry (Count 1)
			//        Tier 2 Fail -> Retry (Count 2, 3, 4)
			// User requested "Retry up to 3 times more for Tier 2". So allow up to count 4.
			if (client.robot) {
				var rCount = client.data.retryCount || 0;
				if (rCount < 4) {
					client.data.retryCount = rCount + 1;
					// Force Tier 2 attack in next attempt
					setTimeout(function () {
						my.readyRobot(client);
					}, ROBOT_START_DELAY[client.level]);
				}
			}

			if (my.opts.one) my.turnEnd();
			return;
		}
	}

	l = my.rule.lang;
	my.game.loading = true;

	function onDB($doc) {
		if (!my.game.chain) return;
		var preChar = getChar.call(my, text);
		var preSubChar = getSubChar.call(my, preChar);
		var firstMove = my.game.chain.length < 1;

		// EKT: 3글자 이상 단어 입력 시, trigram 모드가 활성화될 것을 미리 예상하여 3-gram으로 매너 체크
		var gameType = Const.GAME_TYPE[my.mode];
		if (gameType === 'EKT' && text.length >= 3 && !my.game.ektTrigramMode) {
			preChar = text.slice(-3); // 강제로 마지막 3글자 사용
			preSubChar = preChar.slice(1); // 2-gram subChar
			console.log(`[EKT] PreManner: Forcing trigram check for word "${text}" -> preChar=${preChar}, preSubChar=${preSubChar}`);
		}



		function preApproved() {
			function approved() {
				if (my.game.late) return;
				if (!my.game.chain) return;
				if (!my.game.dic) return;

				my.game.loading = false;
				my.game.late = true;
				clearTimeout(my.game.turnTimer);
				t = tv - my.game.turnAt;
				var isReturn = my.opts.return && my.game.chain.includes(text);
				score = my.getScore(text, t, isReturn);

				// Sumi-Sanggwan Check (SpeedToss)
				var speedTossBonus = 0;
				my.game.sumiChar = null;
				if (my.opts.speedtoss && !my.opts.random) {
					var matchingSumiChar = checkspeedToss(my.game.chain[my.game.chain.length - 1], text);
					if (matchingSumiChar) {
						// 30% Bonus
						var bonusScore = Math.round(score * 0.3);
						score += bonusScore;
						speedTossBonus = bonusScore;
						my.game.sumiChar = matchingSumiChar; // Store for turnStart highlighting
					} else {
						delete my.game.sumiChar;
					}
				}

				// Straight Rule Logic
				var straightBonus = 0;
				if (my.opts.straight) {
					var currentLen = text.length;
					var prevLen = client.game.lastWordLen;

					if (typeof prevLen === 'undefined') {
						// First word for this player. Don't build streak.
						client.game.straightStreak = 0;
					} else if (currentLen - prevLen === 1) {
						// Condition met: increment streak
						client.game.straightStreak = (client.game.straightStreak || 0) + 1;
					} else {
						// Condition not met: reset streak
						client.game.straightStreak = 0;
					}

					client.game.lastWordLen = currentLen;

					if (client.game.straightStreak >= 2) {
						var multiplier = (Math.log(client.game.straightStreak - 1) / Math.log(4)) + 0.5;
						straightBonus = Math.round(score * multiplier);
						score += straightBonus;
					}
				}

				if (isReturn) score = 0;
				my.game.dic[text] = (my.game.dic[text] || 0) + 1;

				// EKT 모드 활성화는 단어가 완전히 승인된 후로 이동 (랜덤 체크 통과 후)

				my.game.chain.push(text);
				my.game.roundTime -= t;

				// Random Linking Logic
				if (my.opts.random && !my.opts.middle && !my.opts.first && !my.opts.second) {
					// 매너 체크는 preApproved에서 완료되었으므로 저장된 결과 사용
					var randomResult = my.game._pendingRandomResult;
					delete my.game._pendingRandomResult;

					// EKT: 3글자 이상 단어 사용 시 3-gram 모드 활성화
					var type = Const.GAME_TYPE[my.mode];
					if (type === 'EKT' && text.length >= 3 && !my.game.ektTrigramMode) {
						my.game.ektTrigramMode = true;
						console.log(`[EKT] Trigram mode activated by word: ${text}`);
					}
					my.game.char = randomResult.char;
					my.game.subChar = getSubChar.call(my, randomResult.char);
					// Pass link index to client
					finishTurn(randomResult.index);
				} else {
					// EKT: 3글자 이상 단어 사용 시 3-gram 모드 활성화 (비랜덤 모드)
					var type = Const.GAME_TYPE[my.mode];
					if (type === 'EKT' && text.length >= 3 && !my.game.ektTrigramMode) {
						my.game.ektTrigramMode = true;
						console.log(`[EKT] Trigram mode activated by word: ${text}`);
						// 모드 전환 후 preChar 재계산
						preChar = getChar.call(my, text);
						preSubChar = getSubChar.call(my, preChar);
						console.log(`[EKT] Recalculated preChar after mode activation: ${preChar}`);
					}
					my.game.char = preChar;
					my.game.subChar = preSubChar;
					// 서버에서 linkIndex 계산하여 클라이언트에 전달 (하이라이팅 위치 일원화)
					finishTurn(getLinkIndex.call(my, text));
				}

				function finishTurn(linkIdx) {
					// 1. 한방 체크 (모든 턴)
					// 최적화: 매너 체크에서 저장된 nextCharWordCount를 재사용하여 중복 쿼리 방지
					// 매너 모드 활성화 시 한방 단어는 이미 거부되었으므로 isHanbang = false

					if (my.opts.unknown) {
						// Unknown 모드는 한방 개념이 없음
						finalizeTurn(false);
						return;
					}

					// 매너 체크에서 저장된 결과가 있으면 재사용 (중복 쿼리 제거)
					if (typeof my.game.nextCharWordCount !== 'undefined') {
						// 매너 모드가 활성화되었다면 한방 단어는 이미 거부되었으므로 isHanbang = false
						// 매너 모드가 비활성화되었을 때만 실제 한방 여부 표시
						var isHanbang = !my.opts.manner && (my.game.nextCharWordCount <= 0);
						console.log(`[DEBUG] Hanbang Check (cached): nextCharWordCount=${my.game.nextCharWordCount}, manner=${my.opts.manner}, isHanbang=${isHanbang}`);

						finalizeTurn(isHanbang);

						// 봇 승리 메시지
						if (client.robot && isHanbang) {
							setTimeout(function () {
								client.chat(Const.ROBOT_VICTORY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_VICTORY_MESSAGES.length)]);
							}, 500);
						}
						return;
					}

					// Fallback: 캐시된 결과가 없으면 직접 계산 (첫 턴 등)
					getAuto.call(my, my.game.char, my.game.subChar, 1).then(function (w) {
						var count = (typeof w === 'number') ? w : (w ? 1 : 0);
						var used = 0;

						// 이미 사용된 단어 계산
						var debugCheckChars = [];
						if (my.game.chain) {
							var checkChars = [my.game.char];
							if (my.game.subChar) my.game.subChar.split("|").forEach(function (c) {
								if (c && checkChars.indexOf(c) == -1) checkChars.push(c);
							});
							debugCheckChars = checkChars;
							var type = Const.GAME_TYPE[my.mode];
							var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

							// 현재 단어는 이미 chain에 push되었으므로 제외 (마지막 요소)
							var checkChain = my.game.chain.slice(0, -1);
							if (my.opts.return) checkChain = checkChain.slice(-5);

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

						// 남은 단어가 0개 이하면 한방 (음수일 수도 있음)
						// 매너 모드가 활성화되었으면 isHanbang = false
						var remaining = count - used;
						var isHanbang = !my.opts.manner && (remaining <= 0);
						console.log(`[DEBUG] Hanbang Check (fallback): char=${my.game.char}, sub=${my.game.subChar}, count=${count}, used=${used}, remaining=${remaining}, manner=${my.opts.manner}, isHanbang=${isHanbang}, checkChars=${debugCheckChars.join(",")}`);

						// 결과 저장 (turnStart에서도 재사용 가능)
						my.game.nextCharWordCount = remaining;

						finalizeTurn(isHanbang);

						// 봇 승리 메시지
						if (client.robot && isHanbang) {
							setTimeout(function () {
								client.chat(Const.ROBOT_VICTORY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_VICTORY_MESSAGES.length)]);
							}, 500);
						}
					});

					function finalizeTurn(isHanbang) {
						client.game.score += score;
						client.publish('turnEnd', {
							ok: true,
							value: text,
							mean: $doc.mean,
							theme: $doc.theme,
							wc: $doc.type,
							score: score,
							bonus: (my.game.mission === true) ? score - my.getScore(text, t, true) : 0,
							speedToss: speedTossBonus,
							straightBonus: straightBonus, // Send Straight Bonus
							baby: $doc.baby,
							totalScore: client.game.score,
							linkIndex: linkIdx, // Send Link Index
							isHanbang: isHanbang // 한방 여부 전송!
						}, true);

						if (my.game.mission === true) {
							my.game.mission = getMission(my.rule.lang);
						}
						setTimeout(my.turnNext, my.game.turnTime / 6);

						if (!client.robot) {
							client.invokeWordPiece(text, 1);
							DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
						}
					}
				}
			}
			// 랜덤 모드: getRandomChar로 매너 체크
			var isRandomMode = my.opts.random && !my.opts.middle && !my.opts.first && !my.opts.second;
			if (!my.opts.unknown && isRandomMode) {
				// 랜덤 모드 매너 체크를 preApproved에서 실행
				getRandomChar.call(my, text).then(function (randomResult) {
					if (randomResult) {
						// 유효한 연결 글자 저장 (approved에서 사용)
						my.game._pendingRandomResult = randomResult;
						approved();
					} else {
						// 매너 실패
						denied(firstMove ? 402 : 403);
					}
				});
			}
			// 비랜덤 모드: 기존 매너 체크
			else if (!my.opts.unknown) getAuto.call(my, preChar, preSubChar, 1).then(function (w) {
				var count = (typeof w === 'number') ? w : (w ? 1 : 0);
				var used = 0;
				if (my.game.chain) {
					var checkChars = [preChar];
					if (preSubChar) preSubChar.split("|").forEach(function (c) { if (c && checkChars.indexOf(c) == -1) checkChars.push(c); });
					var type = Const.GAME_TYPE[my.mode];
					var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

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

				// 매너 한도: 최소 1단어
				var minRemaining = 1;
				var trigramRemaining = count - used;

				// EKT 3-gram 모드: 3-gram과 2-gram 개수의 합으로 매너 체크
				function checkMannerAndProceed(totalRemaining) {
					// 남은 단어 수를 저장하여 turnStart에서 재사용
					my.game.nextCharWordCount = totalRemaining;

					if ((firstMove || my.opts.manner) && totalRemaining >= minRemaining) {
						// Stack Kill Prevention for Manner Mode/First Turn (SafeGuard)
						// If the pool is small, check if it's a "Dead End Stack" (Recursive Trap)
						if (totalRemaining <= 10) {
							getAuto.call(my, preChar, preSubChar, 2).then(function (list) {
								if (!list || list.length === 0) {
									// Treat as Trap because Real DB found no words (contradicting Stats)
									denied(403);
									return;
								}

								var isStack = true;
								var i, w, nc, ns;

								// Prepare valid start characters (Original + Dueum Variations)
								var startChars = [preChar];
								if (preSubChar) {
									preSubChar.split('|').forEach(function (sc) {
										if (sc && startChars.indexOf(sc) === -1) startChars.push(sc);
									});
								}

								for (i = 0; i < list.length; i++) {
									w = list[i]._id;
									nc = getChar.call(my, w);
									ns = getSubChar.call(my, nc);

									var linksToSelf = false;

									// Check if nc matches any start char
									if (startChars.indexOf(nc) !== -1) linksToSelf = true;
									// Check if any subchar of nc matches any start char
									else if (ns) {
										var parts = ns.split('|');
										for (var k = 0; k < parts.length; k++) {
											if (startChars.indexOf(parts[k]) !== -1) {
												linksToSelf = true;
												break;
											}
										}
									}

									if (!linksToSelf) {
										isStack = false; // Found an escape!
										break;
									}
								}

								if (isStack && list.length > 0) {
									// Block!
									denied(403);
								} else {
									approved();
								}
							});
						} else {
							approved();
						}
					}
					else if (firstMove || my.opts.manner) {
						denied(firstMove ? 402 : 403);
					} else {
						approved();
					}
				}

				// EKT 3-gram 모드: 2-gram도 함께 조회하여 합산
				if (gameType === 'EKT' && preChar.length >= 3) {
					var bigramChar = preChar.slice(1); // 맨 앞 글자 제외한 2-gram
					getAuto.call(my, bigramChar, null, 1).then(function (bigramRes) {
						var bigramCount = (typeof bigramRes === 'number') ? bigramRes : (bigramRes ? 1 : 0);
						var bigramUsed = 0;

						// 2-gram 사용된 단어 계산
						if (my.game.chain) {
							var checkChain = my.game.chain;
							if (my.opts.return) checkChain = my.game.chain.slice(-5);

							checkChain.forEach(function (doneWord) {
								if (doneWord.indexOf(bigramChar) === 0) bigramUsed++;
							});
						}

						var bigramRemaining = bigramCount - bigramUsed;
						var totalRemaining = trigramRemaining + bigramRemaining;

						console.log(`[MannerDebug] Combined Check: 3-gram=${preChar}(${trigramRemaining}), 2-gram=${bigramChar}(${bigramRemaining}), total=${totalRemaining}`);

						checkMannerAndProceed(totalRemaining);
					});
				} else {
					checkMannerAndProceed(trigramRemaining);
				}
			});
			else approved();
		}

		function denied(code) {
			my.game.loading = false;
			client.publish('turnError', {
				code: code || 404,
				value: text
			}, true);
			if (my.opts.one) my.turnEnd();
			else if (client.robot && text.indexOf("T.T") == -1 && !Const.ROBOT_DEFEAT_MESSAGES.includes(text) && text.indexOf("..") == -1 && text.indexOf("??") == -1 && !(text.length === 3 && text[0] === text[1] && text[1] === text[2])) {
				setTimeout(function () {
					my.readyRobot(client);
				}, 1000);
			}
		}
		if (my.opts.unknown) {
			if ($doc) denied(410);
			else {
				var valid = true;
				if (my.opts.manner) {
					var nextLen = getNextTurnLength.call(my);
					if (my.rule.lang == "ko") {
						if (!preChar.match(/[가-힣ㄱ-ㅎㅏ-ㅣ0-9]/)) valid = false;
						// Additional length check for manner mode if needed?
						// Assuming getAuto handles the connectivity check.
					} else {
						if (!/^[a-zA-Z0-9]+$/.test(preChar)) valid = false;
					}
				}

				if (!valid) denied();
				else {
					// Construct mock $doc for unknown word
					$doc = {
						mean: "언노운 워드",
						theme: "",
						type: "unknown",
						hit: 0,
						baby: 0,
						flag: 0
					};
					preApproved();
				}
			}
		} else if ($doc) {
			if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) denied();
			else if (my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) denied(406);
			else if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) denied(405);
			else preApproved();
		} else {
			denied();
		}
	}

	function checkspeedToss(prevWord, currentWord) {
		if (!prevWord || !currentWord || currentWord.length < 3) return false;

		var type = Const.GAME_TYPE[my.mode];
		var isRev = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

		// Normal: prev(Start) == curr(End) ? No, Sumi-Sanggwan is:
		// Normal Word Chain: A -> B
		// Sumi-Sanggwan: B's linking char (End) == A's first char (Start)

		// Reverse Word Chain: A <- B
		// Sumi-Sanggwan: B's linking char (Start) == A's last char (End)

		var prevTargetChar, currLinkChar;

		if (isRev) {
			if (my.opts.first && !my.opts.middle && !my.opts.second) {
				// First Rule ONLY in Reverse (Link: Back->Back)
				// Bonus: Start == Back
				currLinkChar = currentWord.charAt(0);
				prevTargetChar = prevWord.slice(-1);
			} else {
				currLinkChar = getChar.call(my, currentWord);
				prevTargetChar = prevWord.slice(-1); // Last char of previous word
			}
		} else {
			// Normal Game (KKT):
			// currLinkChar = getChar(curr). (e.g., KKT: text.slice(-1) or text.slice(text.length-3) for EKT)
			// prevTargetChar = prevWord.charAt(0);

			if (my.opts.first && !my.opts.middle && !my.opts.second) {
				// First Rule ONLY in Normal (Link: Front->Front)
				// Bonus: End == Front
				currLinkChar = currentWord.slice(-1);
				prevTargetChar = prevWord.charAt(0);
			} else {
				currLinkChar = getChar.call(my, currentWord);
				prevTargetChar = prevWord.charAt(0);
			}
		}

		// Apply Head Rule (SubChar) to Current Link Char
		var subChars = getSubChar.call(my, currLinkChar);

		// Check exact match
		if (currLinkChar === prevTargetChar) return currLinkChar;

		// Check Head Rule match
		if (subChars) {
			var subs = subChars.split('|');
			for (var i = 0; i < subs.length; i++) {
				if (subs[i] === prevTargetChar) return subs[i];
			}
		}

		return false;
	}

	function isChainable() {
		var type = Const.GAME_TYPE[my.mode];
		var char = my.game.char,
			subChar = my.game.subChar;
		var l = char.length;
		// subChar를 배열로 분리 (파이프로 구분된 경우)
		var subChars = subChar ? subChar.split('|') : [];

		if (!text) return false;
		if (text.length <= l) return false;
		if (my.game.wordLength && text.length != my.game.wordLength) return false;
		if (type == "KAP" || type == "KAK" || type == "EAP" || type == "EAK") {
			var lastChar = text.slice(-1);
			return (lastChar == char) || subChars.some(function (sc) {
				return lastChar == sc;
			});
		}

		if (text.indexOf(char) === 0) return true;
		if (subChars.some(function (sc) {
			return text.indexOf(sc) === 0;
		})) return true;

		return false;
	}
	DB.kkutu[l].findOne(['_id', text],
		(l == "ko") ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
	).limit(['mean', true], ['theme', true], ['type', true], ['hit', true], ['flag', true]).on(onDB);
};
exports.getScore = function (text, delay, ignoreMission) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score, arr;

	if (!text || !my.game.chain || !my.game.dic) return 0;
	score = Const.getPreScore(text, my.game.chain, tr);

	if (my.game.dic[text]) score *= 15 / (my.game.dic[text] + 15);
	if (!ignoreMission)
		if (arr = text.match(new RegExp(my.game.mission, "g"))) {
			score += score * 0.5 * arr.length;
			my.game.mission = true;
		}
	return Math.round(score);
};
exports.readyRobot = function (robot) {
	var my = this;
	var level = robot.level;
	var delay = ROBOT_START_DELAY[level];
	var ended = {};
	var w, text, i;
	var lmax;
	var isRev = (Const.GAME_TYPE[my.mode] == "KAP" || Const.GAME_TYPE[my.mode] == "KAK" || Const.GAME_TYPE[my.mode] == "EAP" || Const.GAME_TYPE[my.mode] == "EAK");
	var personality = robot.data.personality || 0;
	var preferredChar = robot.data.preferredChar;

	console.log(`[BOT] readyRobot: Level=${level}, Personality=${personality}, PrefChar=${preferredChar}, Mode=${Const.GAME_TYPE[my.mode]}`);

	// Helper: Count next words for a given character
	// Helper: Count next words for a given character using Pre-calculated Stats
	function countNextWords(char) {
		return new Promise(function (resolve, reject) {
			if (!char) return resolve(0);

			// Determine State Index (0-15, bit 3 = freeDueum)
			var state = 0;
			if (!my.opts.injeong) state |= 1;
			if (my.opts.strict) state |= 2;
			if (my.opts.loanword) state |= 4;
			if (my.opts.freedueum) state |= 8;

			var isKo = my.rule.lang === 'ko';
			var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;

			// Determine Column
			var col;
			if (isKo) {
				var nextLen = getNextTurnLength.call(my);
				var lenSuffix = (nextLen === 2) ? "2" : (nextLen === 3) ? "3" : "all";
				col = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
			} else {
				col = `count_${state}`;
			}

			// Dueum/SubChar Logic (Read-Time)
			// Need to check char AND subChar(s) and SUM them?
			// But for Bot logic, we usually check if *any* next word exists.
			// Summing is safer.
			var chars = [char];
			var subChar = getSubChar.call(my, char);
			if (subChar) {
				subChar.split('|').forEach(sc => {
					if (sc && !chars.includes(sc)) chars.push(sc);
				});
			}

			var pending = chars.length;
			var total = 0;

			chars.forEach(c => {
				table.findOne(['_id', c]).on(function (doc) {
					if (doc && doc[col]) {
						total += doc[col];
					}
					if (--pending === 0) resolve(total);
				}, null, function () {
					if (--pending === 0) resolve(total);
				});
			});
		});
	}

	// EKT 매너 필터: 연결 가능한 단어가 있는 단어만 반환
	// 기존 플레이어 매너 체크 로직 (preApproved의 EKT 3-gram 체크)과 동일한 방식 사용
	function filterEKTManner(list) {
		return new Promise(function (resolve) {
			if (!list || list.length === 0) return resolve([]);

			var state = 0;
			if (!my.opts.injeong) state |= 1;
			if (my.opts.strict) state |= 2;
			if (my.opts.loanword) state |= 4;

			var table = DB.kkutu_stats_en;
			var col = `count_${state}`;

			var results = [];
			var pending = list.length;

			list.forEach(function (w) {
				var word = w._id;
				if (word.length < 4) {
					// EKT 3-gram 모드에서 4글자 미만은 이미 필터됨 (검사 불필요)
					results.push(w);
					if (--pending === 0) resolve(results);
					return;
				}

				// getChar를 사용하여 실제 연결 위치 결정 (EKT trigram 모드에서는 마지막 3글자)
				var trigram = getChar.call(my, word);
				// 2-gram subChar: trigram의 맨 앞 글자 제외 (플레이어 매너 체크와 동일)
				var bigram = trigram.slice(1);

				var trigramCount = 0;
				var bigramCount = 0;
				var checks = 2;

				// 3-gram 조회
				table.findOne(['_id', trigram]).on(function (doc) {
					trigramCount = (doc && doc[col]) ? doc[col] : 0;
					if (--checks === 0) checkResult();
				}, null, function () {
					if (--checks === 0) checkResult();
				});

				// 2-gram 조회
				table.findOne(['_id', bigram]).on(function (doc) {
					bigramCount = (doc && doc[col]) ? doc[col] : 0;
					if (--checks === 0) checkResult();
				}, null, function () {
					if (--checks === 0) checkResult();
				});

				function checkResult() {
					var totalCount = trigramCount + bigramCount;

					// 사용된 단어 수 계산 (플레이어 매너 체크와 동일한 로직)
					var trigramUsed = 0;
					var bigramUsed = 0;

					if (my.game.chain) {
						var checkChain = my.game.chain;
						if (my.opts.return) checkChain = my.game.chain.slice(-5);

						checkChain.forEach(function (doneWord) {
							// 3-gram으로 시작하는 단어
							if (doneWord.indexOf(trigram) === 0) trigramUsed++;
							// 2-gram으로 시작하는 단어
							if (doneWord.indexOf(bigram) === 0) bigramUsed++;
						});
					}

					// 주의: 현재 단어 자체는 카운트하지 않음
					// 봇이 선택한 단어는 "다음 턴에 상대가 이어야 할 글자"를 결정하는 것이지
					// 자신이 다시 그 글자로 시작하는 단어를 쓰는 게 아님

					var trigramRemaining = trigramCount - trigramUsed;
					var bigramRemaining = bigramCount - bigramUsed;
					var remaining = trigramRemaining + bigramRemaining;

					console.log(`[BOT] EKT Manner Check: word=${word}, trigram=${trigram}(${trigramCount}-${trigramUsed}=${trigramRemaining}), bigram=${bigram}(${bigramCount}-${bigramUsed}=${bigramRemaining}), remaining=${remaining}`);

					// 매너 조건: 최소 1단어 남아야 함
					if (remaining >= 1) {
						results.push(w);
					}

					if (--pending === 0) resolve(results);
				}
			});
		});
	}
	if (my.opts.unknown) {
		var gen = "";
		var len;
		var pool = [];
		var usePreferred = false;

		// Check if preferredChar matches the game language
		if (preferredChar) {
			if (my.rule.lang == "ko" && /[가-힣]/.test(preferredChar)) usePreferred = true;
			else if (my.rule.lang == "en" && /[a-zA-Z]/.test(preferredChar)) usePreferred = true;
		}

		if (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK") {
			len = my.game.wordLength - 1;
		} else {
			switch (level) {
				case 0:
					len = Math.floor(Math.random() * 2) + 1;
					break; // 1~2
				case 1:
					len = Math.floor(Math.random() * 3) + 2;
					break; // 2~4
				case 2:
					len = Math.floor(Math.random() * 5) + 4;
					break; // 4~8
				case 3:
					len = Math.floor(Math.random() * 9) + 8;
					break; // 8~16
				case 4:
					len = Math.floor(Math.random() * 17) + 16;
					break; // 16~32
				default:
					len = Math.floor(Math.random() * 5) + 2;
					break;
			}
		}

		if (my.game.mission) {
			// Mission active: use current mission char(s)
			pool = [my.game.mission];
		}

		for (i = 0; i < len; i++) {
			var usePool = pool.length > 0;
			if ((Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK") && i >= len - 1) usePool = false;

			// Determine if we should force preferred char
			// Normal: Last char of 'gen' (which becomes last char of word)
			// Reverse: First char of 'gen' (which becomes first char of word)
			var forceChar = false;
			if (usePreferred) {
				if (isRev) {
					if (i === 0) forceChar = true;
				} else {
					if (i === len - 1) forceChar = true;
				}
			}

			if (forceChar) {
				gen += preferredChar;
			} else if (usePool) {
				gen += pool[Math.floor(Math.random() * pool.length)];
			} else {
				if (my.rule.lang == "ko") {
					gen += String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));
				} else {
					gen += String.fromCharCode(97 + Math.floor(Math.random() * 26));
				}
			}
		}

		if (isRev) text = gen + my.game.char;
		else text = my.game.char + gen;

		delay += 400; // Basic delay
		after();
		return;
	}

	// Priority 1: Preferred Character Logic (Direct Query)
	if (preferredChar && Math.random() < PREFERRED_CHAR_PROB[level]) {
		var proceed = Promise.resolve(true);

		// Safety Check: On the first turn, ensure the preferred char doesn't lead to a dead end
		if (my.game.chain.length === 0) {
			proceed = countNextWords(preferredChar).then(function (count) {
				if (count === 0) {
					console.log(`[BOT] Skipping Preferred Char '${preferredChar}' on first turn (No next words)`);
					return false;
				}
				return true;
			});
		}

		proceed.then(function (canUse) {
			if (!canUse) {
				decideStrategy();
				return;
			}

			console.log(`[BOT] Priority 1: Trying Preferred Char: ${preferredChar}`);


			var adc = my.game.char + (my.game.subChar ? ("|" + my.game.subChar) : "");
			var regex;

			// Dynamic Regex Construction for Gaon/Second Rules
			if (my.opts.middle || my.opts.second) {
				var patterns = [];
				var minLen = 2;
				var maxLen = ROBOT_LENGTH_LIMIT[level];
				if (maxLen > 50) maxLen = 50; // Increased cap to 50 for better long word support

				// Fixed Word Length (KKT/Sami)
				if (my.game.wordLength > 0) {
					minLen = my.game.wordLength;
					maxLen = my.game.wordLength;
				}

				// Optimization for "Second Only" rule (No Loop needed)
				if (my.opts.second && !my.opts.middle) {
					if (isRev) {
						// KAP + Second: Link is at Index 1.
						// Pattern: Ends with 'adc', Char at 1 is 'preferredChar'.
						regex = `^.${preferredChar}.*(${adc})$`;
					} else {
						// Standard + Second: Link is at Index (Len-2).
						// Pattern: Starts with 'adc', Char at (Len-2) is 'preferredChar'.
						// This means the word ends with "PreferredChar + AnyChar".
						regex = `^(${adc}).*${preferredChar}.$`;
					}
				} else {
					// Middle Rule (requires loop)
					for (var len = minLen; len <= maxLen; len++) {
						var idx = -1;

						// Replicate getChar index logic
						if (my.opts.middle && my.opts.second) {
							if (len % 2 !== 0) idx = Math.floor(len / 2);
							else idx = isRev ? (len / 2) : (len / 2 - 1);
						} else if (my.opts.middle) {
							if (len % 2 !== 0) idx = Math.floor(len / 2);
							else idx = isRev ? (len / 2 - 1) : (len / 2);
						}
						// Note: Second-only is handled above, so no else needed here.

						if (idx >= 0 && idx < len) {
							var pre = idx;
							var post = len - 1 - idx;

							if (pre < 0) continue;
							patterns.push(`.{${pre}}${preferredChar}.{${post}}`);
						}
					}

					if (patterns.length > 0) {
						if (isRev) {
							// KAP: Matches Tail (adc)
							regex = `^(?=.*(${adc})$)(${patterns.join('|')})$`;
						} else {
							// Standard: Starts with adc.
							regex = `^(?=(${adc}))(${patterns.join('|')})$`;
						}
					} else {
						// Fallback if no patterns
						if (isRev) regex = `^${preferredChar}.*(${adc})$`;
						else regex = `^(${adc}).*${preferredChar}$`;
					}
				}
			} else {
				if (isRev) {
					// Ends with game char (adc), starts with preferred char
					var midPattern = ".*";
					if (my.game.wordLength) {
						var midLen = Math.max(0, my.game.wordLength - 2);
						midPattern = `.{${midLen}}`;
					}
					regex = `^${preferredChar}${midPattern}(${adc})$`;
				} else {
					// Starts with game char (adc), ends with preferred char
					var midPattern = ".*";
					if (my.game.wordLength) {
						var midLen = Math.max(0, my.game.wordLength - 2);
						midPattern = `.{${midLen}}`;
					}
					regex = `^(${adc})${midPattern}${preferredChar}$`;
				}
			}

			var query = [
				['_id', new RegExp(regex)]
			];
			var flagMask = 0;

			// Apply Rule Filters
			if (my.rule.lang == "ko") {
				// Injeong: If OFF, exclude INJEONG words
				if (!my.opts.injeong) flagMask |= Const.KOR_FLAG.INJEONG;

				// Loanword: If ON (Forbid), exclude LOANWORD words
				if (my.opts.loanword) flagMask |= Const.KOR_FLAG.LOANWORD;

				// Strict: If ON, exclude SPACED, SATURI, OLD, MUNHWA
				if (my.opts.strict) {
					flagMask |= (Const.KOR_FLAG.SPACED | Const.KOR_FLAG.SATURI | Const.KOR_FLAG.OLD | Const.KOR_FLAG.MUNHWA);
					query.push(['type', Const.KOR_STRICT]);
				} else {
					query.push(['type', Const.KOR_GROUP]);
				}

				if (flagMask > 0) {
					query.push(['flag', {
						'$nand': flagMask
					}]);
				}
			} else {
				// English rules
				query.push(['_id', Const.ENG_ID]);
			}

			DB.kkutu[my.rule.lang].find(
				...query
			).limit(20).on(function (list) {
				// Filter done words
				if (list && list.length) {
					list = list.filter(function (w) {
						if (my.game.wordLength > 0 && w._id.length !== my.game.wordLength) return false;
						return w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
					});
				}

				if (list && list.length > 0) {
					console.log(`[BOT] Priority 1 Success: Found ${list.length} candidates`);
					// Shuffle the list to add randomness
					list = shuffle(list);
					pickList(list);
				} else {
					console.log(`[BOT] Priority 1 Failed: No candidates found for regex ${regex} with flags ${flagMask}, falling back`);
					decideStrategy();
				}
			});
		});
	} else {
		decideStrategy();
	}

	function decideStrategy() {
		var strategy = "NORMAL";
		var isKKT = (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK" || Const.GAME_TYPE[my.mode] == "KAK" || Const.GAME_TYPE[my.mode] == "EAK");
		var decided = false;

		// Force Retry Logic
		if (robot.data.retryCount > 0) {
			console.log(`[BOT] Forced Retry (Count ${robot.data.retryCount}) with Tier 2 (Previous attempt failed)`);
			decided = true;
			strategy = "ATTACK";
		}

		// Mode Constraints
		if (my.opts.manner) { // 매너모드: 공격 금지
			strategy = "NORMAL";
			decided = true;
		}

		// First/Random Rules: Disable Attack
		if (!decided && (my.opts.first || my.opts.random)) {
			console.log("[BOT] First/Random Rule detected. Disabling Attack Strategy and Special Moves.");
			strategy = "NORMAL"; // Always Normal
			decided = true;
			// Personality Override if Aggressive (>0 -> 0)
			if (personality > 0) personality = 0;
		}

		var effPersonality = personality;
		if (isKKT && effPersonality < 0) effPersonality = 0; // KKT: No Long Word personality

		// Priority 2: Personality Check
		if (effPersonality !== 0 && level >= 2) {
			var roll = Math.random();
			var prob = PERSONALITY_CONST[level] * Math.abs(effPersonality);
			console.log(`[BOT] Priority 2 (Personality): Roll=${roll.toFixed(3)}, Prob=${prob.toFixed(3)}`);
			if (roll < prob) {
				// Prevent Attack on First Turn UNLESS Manner mode is ON (User Request)
				// NOW: User wants "Manner Attack" (Tier 2) on first turn even in Normal Mode.
				// So we allow ATTACK always, but enforce fairness in executeStrategy.
				var allowAttack = true;

				if (effPersonality > 0 && allowAttack) strategy = "ATTACK";
				else if (effPersonality < 0 && !isKKT) strategy = "LONG";
				else strategy = "NORMAL"; // Fallback if Attack is blocked or conditions met

				if (strategy !== "NORMAL") decided = true;
			}
		}

		// Priority 3: Fallback (Special Move vs Normal)
		if (!decided && level >= 2) {
			var roll = Math.random();
			var prob = SPECIAL_MOVE_PROB[level];
			console.log(`[BOT] Priority 3 (Special Move): Roll=${prob.toFixed(3)}, Prob=${prob.toFixed(3)}`);
			if (roll < prob) {
				var allowAttack = true;

				// Special Move Triggered
				if (isKKT && allowAttack) strategy = "ATTACK";
				else {
					// For non-KKT, pick randomly between ATTACK and LONG
					// Also check first turn for Attack
					if (Math.random() < 0.5 && allowAttack) strategy = "ATTACK";
					else strategy = "LONG";
				}
			} else {
				// Normal Strategy
				strategy = "NORMAL";
			}
		}

		console.log(`[BOT] Final Strategy: ${strategy}`);
		executeStrategy(strategy);
	}

	function executeStrategy(strategy) {
		var isKKT = (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK");
		var limitMultiplier = 1;
		if (strategy === "ATTACK" || strategy === "LONG") limitMultiplier = 4; // Fetch 4x for advanced selection (2x Freq + 2x Random)

		var sort = (strategy === "LONG") ? {
			'length(_id)': -1
		} : null;

		getAuto.call(my, my.game.char, my.game.subChar, 2, limitMultiplier, sort).then(function (list) {
			console.log(`[BOT] executeStrategy: ${strategy}, fetched ${list ? list.length : 0} words`);
			if (list) {
				// Filter by length limit and done list
				// EKT 3-gram 모드: 최소 4글자 이상 필터 추가
				var minLen = 1;
				if (Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode) {
					minLen = 4;
				}
				list = list.filter(function (w) {
					if (my.game.wordLength > 0 && w._id.length !== my.game.wordLength) return false;
					return w._id.length >= minLen && w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
				});

				if (list.length === 0) {
					if (strategy !== "NORMAL") {
						console.log(`[BOT] Strategy ${strategy} failed (no candidates), falling back to NORMAL`);
						executeStrategy("NORMAL");
					} else {
						denied();
					}
					return;
				}

				if (strategy === "LONG") {
					// 2x Frequency + 2x Random logic
					// Sort by Hit DESC first to identify "Frequency" pool
					// list.sort(function (a, b) { return b.hit - a.hit; }); 
					// User requested: Use DB sort. So 'list' is already sorted by Length DESC.

					// Just pick top ones.
					var top = list.slice(0, 30);
					pickList(shuffle(top)); // Pick randomly from top 30
				} else if (strategy === "ATTACK") {
					// Optimized Attack Strategy: Tiered Reverse Search
					// Tier 1: Priority + One-shots (Count 0)
					// Tier 2: Soft Killers (Count 1-3)

					getAttackChars(my).then(function (tiers) {
						var tier1 = tiers.tier1 || [];
						var tier2 = tiers.tier2 || [];

						// Level-based Constraints
						var heuristicRatio = 1.0;
						var tier2StartProb = 0.0;

						if (level <= 2) {
							heuristicRatio = 0.25;
							tier2StartProb = 0.5;
						} else if (level === 3) {
							heuristicRatio = 0.5;
							tier2StartProb = 0.25;
						}

						// Shuffle Tiers but keeping Priority Chars at the front
						// This ensures that when we slice (e.g. top 150), the Priority chars are included.
						function postShuffle(list) {
							var pList = [];
							var mList = [];
							if (my.rule.lang === 'ko') {
								pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
								mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;
							} else {
								if (isRev) {
									pList = PRIORITY_KAP_ATTACK_CHARS_EN;
								} else {
									pList = PRIORITY_ATTACK_CHARS_EN;
									mList = PRIORITY_ATTACK_CHARS_MANNER_EN;
								}
							}

							var pSlice = pList ? pList.slice(0, Math.ceil(pList.length * heuristicRatio)) : [];
							var mSlice = mList ? mList.slice(0, Math.ceil(mList.length * heuristicRatio)) : [];
							var allP = new Set(pSlice.concat(mSlice));

							var p = [],
								n = [];
							list.forEach(c => {
								if (allP.has(c)) p.push(c);
								else n.push(c);
							});
							// Shuffle both parts separately, but put Priority part first
							return shuffle(p).concat(shuffle(n));
						}

						tier1 = postShuffle(tier1);
						tier2 = postShuffle(tier2);

						// Helper to perform attack search (Optimized: Shuffle -> Slice -> Single Query)
						// Initialize Priority Set for Smart Shuffle
						var prioritySet = new Set();
						(function initPrioritySet() {
							var pList = [];
							var mList = [];

							if (my.rule.lang === 'ko') {
								pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
								mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;
							} else {
								if (isRev) {
									pList = PRIORITY_KAP_ATTACK_CHARS_EN;
								} else {
									pList = PRIORITY_ATTACK_CHARS_EN;
									mList = PRIORITY_ATTACK_CHARS_MANNER_EN;
								}
							}

							var pSlice = pList ? pList.slice(0, Math.ceil(pList.length * heuristicRatio)) : [];
							var mSlice = mList ? mList.slice(0, Math.ceil(mList.length * heuristicRatio)) : [];
							pSlice.forEach(c => prioritySet.add(c));
							mSlice.forEach(c => prioritySet.add(c));
						})();

						function tryAttack(killers, nextStepCallback) {
							if (my.rule.lang === "ko") tryAttackKO(killers, nextStepCallback);
							else tryAttackEN(killers, nextStepCallback);
						}

						function processList(list, nextStepCallback) {
							if (list && list.length) {
								list = list.filter(function (w) {
									// EKT 3-gram 모드: 최소 4글자 이상 필터
									var minLen = (Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode) ? 4 : 1;
									if (my.game.wordLength > 0 && w._id.length !== my.game.wordLength) return false;
									return w._id.length >= minLen && w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
								});

								if (list.length > 0) {
									console.log(`[BOT] ATTACK Success: Found ${list.length} words.`);

									if (Const.GAME_TYPE[my.mode] === "KSH" && my.game.seq && my.game.seq.length === 2) {
										var safe = list.filter(w => !DUBANG.includes(w._id.slice(-1)));
										var unsafe = list.filter(w => DUBANG.includes(w._id.slice(-1)));

										if (safe.length > 0) {
											console.log(`[BOT] Dubang Avoidance: Picking from ${safe.length} safe words.`);
											list = smartShuffle(safe).concat(smartShuffle(unsafe));
										} else {
											console.log(`[BOT] Dubang Avoidance: No safe words.`);
											list = smartShuffle(unsafe);
										}
									} else if (Const.GAME_TYPE[my.mode] === "KSH" && my.opts.freedueum) {
										var safe = list.filter(w => !AVOID_FD.includes(w._id.slice(-1)));
										var unsafe = list.filter(w => AVOID_FD.includes(w._id.slice(-1)));

										if (safe.length > 0) {
											console.log(`[BOT] FreeDueum Avoidance (KSH): Picking from ${safe.length} safe words.`);
											list = smartShuffle(safe).concat(smartShuffle(unsafe));
										} else {
											console.log(`[BOT] FreeDueum Avoidance (KSH): No safe words.`);
											list = smartShuffle(unsafe);
										}
									} else if (Const.GAME_TYPE[my.mode] === "KAP" && my.game.seq && my.game.seq.length === 2) {
										var safe = list.filter(w => !DUBANG_KAP.includes(w._id.charAt(0)));
										var unsafe = list.filter(w => DUBANG_KAP.includes(w._id.charAt(0)));

										if (safe.length > 0) {
											console.log(`[BOT] Dubang Avoidance (KAP): Picking from ${safe.length} safe words.`);
											list = smartShuffle(safe).concat(smartShuffle(unsafe));
										} else {
											console.log(`[BOT] Dubang Avoidance (KAP): No safe words.`);
											list = smartShuffle(unsafe);
										}
									} else {
										list = smartShuffle(list);
									}

									if (list.length > 0) pickList(list);
									else nextStepCallback();
								} else {
									nextStepCallback();
								}
							} else {
								nextStepCallback();
							}
						}

						function smartShuffle(list) {
							// Determine "Killer Char" for each word and check against prioritySet
							// Logic matches tryAttackKO: Standard/KKT/KSH checks last char. KAP checks first char.
							// Middle/Second logic is complex, so we skip prioritization for them (fallback to random).
							if (my.opts.middle || my.opts.second) return shuffle(list);
							if (prioritySet.size === 0) return shuffle(list);

							var p = [], n = [];
							list.forEach(function (w) {
								var char = "";
								if (isRev) char = w._id.charAt(0);
								else char = w._id.slice(-1);

								if (prioritySet.has(char)) p.push(w);
								else n.push(w);
							});

							if (p.length > 0) console.log(`[BOT] SmartShuffle: Prioritized ${p.length} / ${list.length} words.`);
							return shuffle(p).concat(shuffle(n));
						}

						function tryAttackKO(killers, nextStepCallback) {
							if (!killers || killers.length === 0) return nextStepCallback();

							// Optimization: For Middle/Second rules, use ONLY Heuristics
							if (my.opts.middle || my.opts.second) {
								var heuristicSet = new Set();
								var pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
								var mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;

								var pSlice = pList ? pList.slice(0, Math.ceil(pList.length * heuristicRatio)) : [];
								var mSlice = mList ? mList.slice(0, Math.ceil(mList.length * heuristicRatio)) : [];

								pSlice.forEach(c => heuristicSet.add(c));
								mSlice.forEach(c => heuristicSet.add(c));

								if (heuristicSet.size > 0) {
									killers = killers.filter(k => heuristicSet.has(k));
								}
							}

							// 자유 두음법칙 + KSH: AVOID_FD 글자 제외
							if ((Const.GAME_TYPE[my.mode] === "KSH" || Const.GAME_TYPE[my.mode] === "KKT") && my.opts.freedueum) {
								killers = killers.filter(k => !AVOID_FD.includes(k));
								if (killers.length === 0) return nextStepCallback();
							}

							// 모음 반전: AVOID_VI 글자 제외
							if (my.opts.vowelinv) {
								killers = killers.filter(k => !AVOID_VI.includes(k));
								if (killers.length === 0) return nextStepCallback();
							}

							var subsetSize = Math.max(10, Math.floor(150 * heuristicRatio));
							var subset = killers.slice(0, subsetSize);
							if (subset.length === 0) return nextStepCallback();

							var killerString = subset.join("").replace(/[\[\]\^\-\\]/g, "\\$&");
							var adc = escapeRegExp(my.game.char) + (my.game.subChar ? ("|" + my.game.subChar.split("|").map(escapeRegExp).join("|")) : "");
							var regex;

							if (my.opts.middle || my.opts.second) {
								var patterns = [];
								var minLen = 2; // Min word length
								var maxLen = ROBOT_LENGTH_LIMIT[level];

								// Fixed Word Length (KKT/Sami)
								if (my.game.wordLength > 0) {
									minLen = my.game.wordLength;
									maxLen = my.game.wordLength;
								} else {
									// Optimization: Cap Length at 20 for Complex Rules (Middle/Second)
									// Generating 50+ patterns kills performance. 20 is enough for attacks.
									if (maxLen > 20) maxLen = 20;
								}

								for (var len = minLen; len <= maxLen; len++) {
									var idx = -1;
									// Logic must match getChar shared block
									if (my.opts.middle && my.opts.second) {
										if (len % 2 !== 0) idx = Math.floor(len / 2);
										else idx = isRev ? (len / 2) : (len / 2 - 1);
									} else if (my.opts.middle) {
										if (len % 2 !== 0) idx = Math.floor(len / 2);
										else idx = isRev ? (len / 2 - 1) : (len / 2);
									} else { // Second only
										idx = isRev ? 1 : (len - 2);
									}

									if (idx >= 0 && idx < len) {
										// Pattern: .{idx}(killerString).{rest}
										var pre = idx;
										var post = len - 1 - idx;
										patterns.push(`.{${pre}}[${killerString}].{${post}}`);
									}
								}

								if (patterns.length > 0) {
									if (isRev) {
										// Ends with adc: (?=.*adc$)...
										regex = `^(?=.*(${adc})$)(${patterns.join('|')})$`;
									} else {
										// Starts with adc: (?=adc)...
										regex = `^(?=(${adc}))(${patterns.join('|')})$`;
									}
								} else {
									// Fallback
									if (isRev) regex = `^[${killerString}].*(${adc})$`;
									else regex = `^(${adc}).*[${killerString}]$`;
								}
							} else {
								var middlePattern = ".*";
								if (my.game.wordLength) {
									var midLen = Math.max(0, my.game.wordLength - 2);
									middlePattern = `.{${midLen}}`;
								}

								if (isRev) {
									regex = `^[${killerString}]${middlePattern}(${adc})$`;
								} else {
									regex = `^(${adc})${middlePattern}[${killerString}]$`;
								}
							}

							console.log(`[BOT] ATTACK KO: Optimized Query with ${subset.length} random killers...`);

							var query = [
								['_id', new RegExp(regex)]
							];
							var flagMask = ((my.game.history && my.game.history.length > 0) ? Const.KOR_FLAG.DELETED : 0);

							if (!my.opts.injeong) flagMask |= Const.KOR_FLAG.INJEONG;
							if (my.opts.loanword) flagMask |= Const.KOR_FLAG.LOANWORD;

							if (my.opts.strict) {
								flagMask |= (Const.KOR_FLAG.SPACED | Const.KOR_FLAG.SATURI | Const.KOR_FLAG.OLD | Const.KOR_FLAG.MUNHWA);
								query.push(['type', Const.KOR_STRICT]);
							} else {
								query.push(['type', Const.KOR_GROUP]);
							}

							if (flagMask > 0) query.push(['flag', {
								'$nand': flagMask
							}]);

							DB.kkutu['ko'].find(...query).limit(200).on(function (list) {
								processList(list, nextStepCallback);
							});
						}

						function tryAttackEN(killers, nextStepCallback) {
							if (!killers || killers.length === 0) return nextStepCallback();

							// Optimization: For Middle/Second rules, use ONLY Heuristics (Top 25)
							if (my.opts.middle || my.opts.second) {
								var heuristicSet = new Set();
								var hList = [];
								if (typeof PRIORITY_ATTACK_CHARS_EN !== 'undefined') hList = hList.concat(PRIORITY_ATTACK_CHARS_EN);
								if (typeof PRIORITY_ATTACK_CHARS_MANNER_EN !== 'undefined') hList = hList.concat(PRIORITY_ATTACK_CHARS_MANNER_EN);

								// Limit by Heuristic Ratio and Max 25
								var limitLen = Math.ceil(hList.length * heuristicRatio);
								if (limitLen > 25) limitLen = 25;
								hList = hList.slice(0, limitLen);

								hList.forEach(c => heuristicSet.add(c));

								// Strict Filter: If heuristics exist, use ONLY them.
								if (heuristicSet.size > 0) {
									killers = killers.filter(k => heuristicSet.has(k));
								} else {
									killers = [];
								}
							}

							if (killers.length === 0) return nextStepCallback();

							var subsetSize = Math.max(10, Math.floor(150 * heuristicRatio));
							var subset = killers.slice(0, subsetSize);
							if (subset.length === 0) return nextStepCallback();

							var adc = escapeRegExp(my.game.char) + (my.game.subChar ? ("|" + my.game.subChar.split("|").map(escapeRegExp).join("|")) : "");
							var killerPattern = subset.join("|");

							var regex;
							if (my.opts.middle || my.opts.second) {
								var patterns = [];
								var minLen = 2;
								var maxLen = ROBOT_LENGTH_LIMIT[level];

								// Fixed Word Length (EKK/Sami)
								if (my.game.wordLength > 0) {
									minLen = my.game.wordLength;
									maxLen = my.game.wordLength;
								} else {
									// Optimization: Cap to 20
									if (maxLen > 20) maxLen = 20;
								}
								var isEKT = Const.GAME_TYPE[my.mode] === "EKT";

								for (var len = minLen; len <= maxLen; len++) {
									var idx = -1;
									var rStart = -1;
									var linkLen = isEKT ? 3 : 1;

									if (isEKT) {
										// EKT Specific Logic (from getChar)
										if (my.opts.middle) {
											if (len % 2 !== 0) {
												idx = Math.floor(len / 2);
												rStart = idx - 1;
											} else {
												idx = len / 2;
												rStart = idx - 1;
											}
										} else if (my.opts.second) {
											// EKT Second:
											// if len >= 4: Link = text.slice(len - 4, len - 1) -> Start len-4, Len 3
											// if len === 3: Link = text -> Start 0, Len 3
											if (len >= 4) rStart = len - 4;
											else if (len === 3) rStart = 0;
										}
									} else {
										// EKK / General Logic (from getChar)
										// English EKK usually uses same logic as Korean (1 char link)
										if (my.opts.middle && my.opts.second) {
											if (len % 2 !== 0) idx = Math.floor(len / 2);
											else idx = len / 2 - 1;
										} else if (my.opts.middle) {
											if (len % 2 !== 0) idx = Math.floor(len / 2);
											else idx = len / 2; // Even: Latter
										} else { // Second only
											idx = len - 2;
										}
										rStart = idx;
									}

									if (rStart >= 0 && rStart + linkLen <= len) {
										var pre = rStart;
										var post = len - (rStart + linkLen);
										patterns.push(`.{${pre}}(${killerPattern}).{${post}}`);
									}
								}

								if (patterns.length > 0) {
									regex = `^(?=(${adc}))(${patterns.join('|')})$`;
								} else {
									regex = `^(${adc}).*(${killerPattern})$`;
								}
							} else {
								// End-to-End Attack (Normal)
								var middlePattern = ".*";
								var lenCheck = ""; // Lookahead length check

								// Fixed Word Length (EKK/Sami/KKT)
								if (my.game.wordLength > 0) {
									// Use Lookahead to strictly enforce length
									lenCheck = `(?=.{${my.game.wordLength}}$)`;
									middlePattern = ".*";
								} else if (Const.GAME_TYPE[my.mode] === "EKT") {

								}

								if (isRev) {
									regex = `^${lenCheck}(${killerPattern})${middlePattern}(${adc})$`;
								} else {
									regex = `^${lenCheck}(${adc})${middlePattern}(${killerPattern})$`;
								}
							}

							console.log(`[BOT] ATTACK EN: Optimized Query with ${subset.length} random killers...`);

							var query = [
								['_id', new RegExp(regex)]
							];
							query.push(['_id', Const.ENG_ID]);

							DB.kkutu['en'].find(...query).limit(200).on(function (list) {
								processList(list, nextStepCallback);
							});
						}

						// Execution Flow: Tier 1 -> Tier 2 -> Normal
						// Logic:
						// If First Turn (Chain 0): SKIP Tier 1. Go to Tier 2.
						// If Normal Turn: Start Tier 1.

						var startTier1 = true;
						if (!my.game.chain || my.game.chain.length === 0 || my.opts.manner) {
							console.log("[BOT] First Turn or Manner Mode detected. Skipping Tier 1 (Killer word unavailable).");
							startTier1 = false;
						} else if (Math.random() < tier2StartProb) {
							console.log(`[BOT] Stochastic Skip: Skipping Tier 1 with probability ${tier2StartProb.toFixed(2)}.`);
							startTier1 = false;
						}

						// Retry Tier 2 Logic Consumption
						if (robot.data.retryCount > 0) {
							console.log(`[BOT] Retry Tier 2 Flag detected (Count ${robot.data.retryCount}). Skipping Tier 1.`);
							startTier1 = false;
							// Do NOT delete retryCount here, as we need it for subsequent retries if this one fails too.
							// It will be cleared in turnStart or when turn ends successfully.
						}

						if (startTier1) {
							tryAttack(tier1, function () {
								console.log("[BOT] Tier 1 failed, trying Tier 2...");
								tryAttack(tier2, function () {
									console.log("[BOT] Tier 2 failed, falling back to NORMAL.");
									executeStrategy("NORMAL");
								});
							});
						} else {
							// Skip Tier 1, Start at Tier 2
							tryAttack(tier2, function () {
								console.log("[BOT] Tier 2 failed (First Turn), falling back to NORMAL.");
								executeStrategy("NORMAL");
							});
						}
					});




				} else {
					// NORMAL strategy
					list.sort(function (a, b) {
						return b.hit - a.hit;
					});
					var top = list.slice(0, ROBOT_CANDIDATE_LIMIT[level]);
					var rest = list.slice(ROBOT_CANDIDATE_LIMIT[level]);
					list = shuffle(top).concat(rest);

					// EKT 매너 모드: 연결 가능한 단어가 있는 단어만 선택
					if (my.opts.manner && Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode) {
						console.log(`[BOT] EKT Manner Filter: Checking ${list.length} words...`);
						filterEKTManner(list).then(function (filtered) {
							if (filtered.length > 0) {
								console.log(`[BOT] EKT Manner Filter: ${filtered.length}/${list.length} words passed`);
								pickList(filtered);
							} else {
								console.log(`[BOT] EKT Manner Filter: No valid words found`);
								denied();
							}
						});
					} else {
						pickList(list);
					}
				}
			} else {
				denied();
			}
		});
	}

	function denied() {
		// Prepare Defeat Message
		var secondMsg = Const.ROBOT_DEFEAT_MESSAGES[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES.length)];

		// If round is late (ended), only send Defeat Message and exit.
		// Do not send Char Message (spam) or queue any moves (after).
		if (my.game.late) {
			setTimeout(function () {
				robot.chat(secondMsg);
			}, 500);
			return;
		}

		var char = my.game.char;
		var charMsgs = [
			`${char}${char}${char}`,
			`${char}..`,
			`${char}??`,
			`${char}... T.T`
		];

		if (isRev) {
			charMsgs = [
				`${char}${char}${char}`,
				`..${char}`,
				`??${char}`,
				`T.T ...${char}`
			];
		}

		var firstMsg = charMsgs[Math.floor(Math.random() * charMsgs.length)];

		text = firstMsg;
		after();

		delay += 200;

		text = secondMsg;
		after();
	}

	function pickList(list) {
		if (my.game.late) return; // Prevent move after round end
		if (list && list.length > 0) {
			robot.data.candidates = list;
			robot.data.candidateIndex = 0;
			// Pick from the top of the list (since it's already sorted by Strategy)
			// For Attack: Sorted by NextCount ASC.
			// For Long: Sorted by Length DESC.
			// For Normal: Frequency/Random mix.

			var candidate = list[0];

			if (candidate) {
				w = candidate;
				text = w._id;
				delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
				console.log(`[BOT] Picked word: ${text} (Hit: ${w.hit}, Len: ${text.length}, Source: ${robot.data.candidates.length} candidates)`);
				after();
			} else denied();
		} else denied();
	}

	function after() {
		if (my.game.late) return; // Prevent scheduling after round end
		delay += text.length * ROBOT_TYPE_COEF[level];
		robot._done.push(text);
		setTimeout(my.turnRobot, delay, robot, text);
	}

	function getWishList(list) {
		var R = new Lizard.Tail();
		var wz = [];
		var res;

		for (i in list) wz.push(getWish(list[i]));
		Lizard.all(wz).then(function ($res) {
			if (!my.game.chain) return;
			$res.sort(function (a, b) {
				return a.length - b.length;
			});

			if (my.opts.manner || !my.game.chain.length) {
				while (res = $res.shift())
					if (res.length) break;
			} else res = $res.shift();
			R.go(res ? res.char : null);
		});
		return R;
	}

	function getWish(char) {
		var R = new Lizard.Tail();

		DB.kkutu[my.rule.lang].find(['_id', new RegExp(isRev ? `.${escapeRegExp(char)}$` : `^${escapeRegExp(char)}.`)]).limit(10).on(function ($res) {
			R.go({
				char: char,
				length: $res.length
			});
		});
		return R;
	}
};

function getMission(l) {
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
			break;;
		case 'KSH':
			adv = `^(${adc}).`;
			break;
		case 'ESH':
			adv = `^(${adc})...`;
			break;
		case 'KKT':
			adv = `^(${adc}).{${my.game.wordLength - char.length}}$`;
			break;
		case 'KAP':
		case 'EAP':
			adv = `.(${adc})$`;
			break;
		case 'KAK':
		case 'EAK':
			adv = `^.{${my.game.wordLength - char.length}}(${adc})$`;
			break;
	}
	if (!char) {
		console.log(`Undefined char detected! type=${type} adc=${adc}`);
	}

	// type=1 (존재 여부 확인 Check): kkutu_stats table check
	if (bool && char) {
		// Bitmask State (통계 테이블은 0-7만 지원, freedueum 비트 제외)
		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;
		// freedueum(bit 3)은 통계 테이블에 없으므로 제외

		var isKo = my.rule.lang === 'ko';
		var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;
		var col;

		if (isKo) {
			var nextLen = getNextTurnLength.call(my);
			var lenSuffix = (nextLen === 2) ? "2" : (nextLen === 3) ? "3" : "all";
			col = isKAP ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
		} else {
			col = `count_${state}`;
		}

		// Check both char and subChar (Read-Time Dueum)
		var charsToCheck = [char];
		if (subc) {
			subc.split("|").forEach(function (sc) {
				if (sc && charsToCheck.indexOf(sc) === -1) charsToCheck.push(sc);
			});
		}

		// 다중 findOne 병렬 호출 (안정성을 위해 $in 대신 사용)
		var pending = charsToCheck.length;
		var totalCount = 0;
		var debugCounts = [];

		charsToCheck.forEach(function (c) {
			table.findOne(['_id', c]).on(function ($st) {
				var charCount = ($st && $st[col]) ? $st[col] : 0;
				totalCount += charCount;
				debugCounts.push(`${c}:${charCount}`);

				if (--pending === 0) {
					console.log(`[DEBUG] getAuto stats: col=${col}, total=${totalCount}, details=[${debugCounts.join(", ")}]`);
					// 통계에 없으면 해당 글자로 시작/끝나는 단어가 없음 → 0 반환 (fallback 불필요)
					R.go(totalCount);
				}
			}, null, function () {
				// Error/Empty - 통계에 없으면 0으로 처리
				debugCounts.push(`${c}:0(missing)`);
				if (--pending === 0) {
					console.log(`[DEBUG] getAuto stats: col=${col}, total=${totalCount}, details=[${debugCounts.join(", ")}]`);
					R.go(totalCount);
				}
			});
		});
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
			if (my.opts.strict) aqs.push(['type', Const.KOR_STRICT], ['flag', {
				$lte: 3
			}]);
			else aqs.push(['type', Const.KOR_GROUP]);
		} else {
			aqs.push(['_id', Const.ENG_ID]);
		}
		switch (type) {
			case 0:
			default:
				aft = function ($md) {
					R.go($md[Math.floor(Math.random() * $md.length)]);
				};
				break;
			case 1:
				aft = function ($md) {
					R.go($md.length);
				};
				break;
			case 2:
				aft = function ($md) {
					R.go($md);
				};
				break;
		}
		var raiser = DB.kkutu[my.rule.lang].find.apply(this, aqs);
		if (sort) raiser.sort(sort);
		raiser.limit((bool ? 1 : 123) * (limit || 1)).on(function ($md) {
			if (my.game.chain) aft($md.filter(function (item) {
				return !my.game.chain.includes(item);
			}));
			else aft($md);
		});
	}
	return R;
}


function shuffle(arr) {
	var i, r = [];

	for (i in arr) r.push(arr[i]);
	r.sort(function (a, b) {
		return Math.random() - 0.5;
	});

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

	// Priority 1: Middle Rule
	if (my.opts.middle) {
		if (type === 'EKT' && my.rule.lang === 'en') {
			if (len === 2) {
				if (my.opts.second) return text.charAt(0);
				return text.slice(-1);
			}
			// EKT Middle: 한국어처럼 가운데 글자 기준으로 양옆 포함 3글자
			// Middle+Second (홀수): 가운데 3글자
			// Middle+Second (짝수): 인덱스를 하나 앞으로 (앞쪽 가운데 3글자)
			if (len % 2 !== 0) {
				// 홀수: 정확한 가운데 3글자
				idx = Math.floor(len / 2);
				return text.slice(idx - 1, idx + 2);
			} else {
				// 짝수
				if (my.opts.second) {
					// Middle+Second: 앞쪽 가운데 3글자 (인덱스 앞으로 당김)
					idx = len / 2 - 1;
				} else {
					// Middle only: 뒤쪽 가운데 3글자
					idx = len / 2;
				}
				return text.slice(idx - 1, idx + 2);
			}
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
	// Second: 인덱스를 하나 당김
	if (my.opts.first) {
		if (my.opts.second) {
			// First+Second
			if (type === 'EKT') return text.slice(1, 4); // EKT: 1~3번째 3글자
			if (isKAP) return text.charAt(len - 2);       // 앞말: 끝에서 2번째
			return text.charAt(1);                         // 끝말: 앞에서 2번째
		}
		// First only
		if (type === 'EKT') return text.slice(0, 3);      // EKT: 0~2번째 3글자
		if (isKAP) return text.charAt(len - 1);           // 앞말: 마지막
		return text.charAt(0);                             // 끝말: 첫번째
	}

	// Priority 3: Second Rule (세컨드)
	// 끝말: 끝에서 2번째 / 앞말(isKAP): 앞에서 2번째
	if (my.opts.second) {
		if (type === 'EKT' && my.rule.lang === 'en') {
			// EKT: 마지막 3글자 → 끝에서 4~2번째
			if (len === 2) return text.charAt(0);
			if (len >= 4) return text.slice(len - 4, len - 1);
			else if (len === 3) return text;
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
		case 'EKK':
		case 'ESH':
		case 'KKT':
		case 'KSH':
			return text.slice(-1);
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
		if (type === 'EKT' && my.rule.lang === 'en') {
			if (len === 2) {
				return my.opts.second ? 0 : 1;
			}
			// EKT Middle: 가운데 3글자의 시작 인덱스
			if (len % 2 !== 0) {
				idx = Math.floor(len / 2);
				return idx - 1; // 3글자의 시작 인덱스
			} else {
				if (my.opts.second) {
					idx = len / 2 - 1;
				} else {
					idx = len / 2;
				}
				return idx - 1;
			}
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
			if (isKAP) return len - 2;
			return 1;
		}
		if (type === 'EKT') return 0; // EKT: 0~2번째 시작
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
		case 'EKK':
		case 'ESH':
		case 'KKT':
		case 'KSH':
			return len - 1;
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
	if (char.length > 1 && Const.GAME_TYPE[my.mode] !== "EKT") return r;
	var c = char.charCodeAt();
	var k;
	var ca, cb, cc;
	var isKAP = (Const.GAME_TYPE[my.mode] === "KAP" || Const.GAME_TYPE[my.mode] === "KAK" || Const.GAME_TYPE[my.mode] === "EAP" || Const.GAME_TYPE[my.mode] === "EAK");

	switch (Const.GAME_TYPE[my.mode]) {
		case "EKT":
			// EKT 3-gram subChar 계산
			// char이 3글자인 경우, subChar는 앞 1글자를 제외한 2글자 (2-gram)
			if (char.length >= 3) {
				r = char.slice(1); // 기본: 앞 1글자 제외한 2글자
			}
			// Middle/Second/First 규칙에 따른 subChar 조정은 불필요
			// getChar에서 이미 올바른 3-gram을 반환하고, subChar는 항상 마지막 2글자
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
		if (!my.opts.manner && !firstMove) {
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
						console.log(`[RandomDebug] Cache HIT (2-gram): ${bigramCacheKey}=${bigramCount}, combined=${totalCount}`);
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
							console.log(`[RandomDebug] Cache MISS (2-gram): ${bigramCacheKey}=${bigramCount}, combined=${totalCount}`);
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
			console.log(`[RandomDebug] Word: ${text}, Idx: ${idx}, Char: ${char}, Count: ${count}, Used: ${used}, Remaining: ${remaining}, Cached: ${isCached}, FirstMove: ${firstMove}`);

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
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}