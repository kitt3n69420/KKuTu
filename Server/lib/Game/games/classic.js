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
const DUBANG = ["괙", "귁", "껙", "꿕", "뀍", "늡", "릅", "돨", "똴", "뙁", "뛸", "뜩", "띡", "띨", "멫", "몇", "뱍", "뷩", "뷩", "븩", "뽓", "뿅", "솰", "쏼", "었", "쟘", "좍", "좜", "좸", "줅", "줍", "쥄", "쫙", "챱", "홱"]
const DUBANG_KAP = ["뒷", "쌩", "빤", "핫", "갤", "캘", "왱"];
const PRIORITY_ATTACK_CHARS_EN = ["ght", "ock", "ick", "ird", "ert", "ork", "eck", "nds", "uck", "ond", "lue", "lls", "elt", "rds", "arp", "uff", "erm", "irl", "ilt", "ilk", "ods", "cks", "ays", "iff", "ett", "olt", "ors", "erb", "ohn", "erk", "awk", "nks", "irs", "irm", "urd", "ilm", "nue", "rks", "arf", "nyx", "erd", "ryx", "olk", "itt", "rys", "gie", "url", "nck", "ils", "avy", "ynx", "ews", "mie", "irk", "cht", "cue", "ulb", "onk", "elp", "urk", "ldt", "aws"];
const PRIORITY_ATTACK_CHARS_MANNER_EN = ["ack", "ark", "ics", "orm", "ers", "ify", "ons", "omb", "ngs", "ump", "owl", "ift", "urn", "rie", "eek", "oud", "elf", "irt", "ild", "kie", "itz", "rld", "iew", "thm", "els", "awl", "awn", "rue", "yew", "eft", "oft", "ffy", "uld", "hew", "ivy", "rtz", "egs", "tew", "oux", "rns", "ebs", "tua", "tyl", "efy", "ohm", "omp", "bbs", "ltz", "ggs", "oek", "xxv", "few", "wyn", "orr", "utz", "enn", "ebb", "hns", "ogs", "ruz", "ibs", "uhr", "nyl"];
const AVOID_FD = ["렁", "냑", "럿", "럴"];
var AttackCache = {};

function getAttackChars(my) {
	return new Promise(function (resolve) {
		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;
		if (my.opts.freedueum) state |= 8;

		var isRev = Const.GAME_TYPE[my.mode] == "KAP";
		var col = isRev ? `end_${state}` : `start_${state}`;
		var key = my.rule.lang + "_" + col;

		var isKo = my.rule.lang === 'ko';
		var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;
		var useCol = col;
		if (isKo) {
			var reqLen = getNextTurnLength.call(my);
			var lenSuffix = (reqLen === 2) ? "2" : (reqLen === 3) ? "3" : "all";
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
		var priorityList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
		var priorityMannerList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;

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

	switch (Const.GAME_TYPE[my.mode]) {
		case 'EKK':
			my.game.wordLength = 5;
		case 'EKT':
		case 'ESH':
			eng = "^" + String.fromCharCode(97 + Math.floor(Math.random() * 26));
			break;
		case 'EAK':
			my.game.wordLength = 5;
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
		if (my.opts.freedueum) state |= 8;

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
				var lenSuffix = (reqLen === 2) ? "2" : (reqLen === 3) ? "3" : "all";
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
	my.game.roundTime = my.time * 1000;
	if (my.game.round <= my.round) {
		my.game.char = my.game.title[my.game.round - 1];
		my.game.subChar = getSubChar.call(my, my.game.char);
		my.game.chain = [];
		if (my.opts.mission) my.game.mission = getMission(my.rule.lang);
		if (my.opts.sami) {
			my.game.wordLength = 2;
			my.game.samiCount = 0;
		}

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
	}

	my.byMaster('turnStart', {
		turn: my.game.turn,
		char: my.game.char,
		subChar: my.game.subChar,
		speed: speed,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		mission: my.game.mission,
		wordLength: my.game.wordLength,
		seq: force ? my.game.seq : undefined
	}, true);
	my.game.turnTimer = setTimeout(my.turnEnd, Math.min(my.game.roundTime, my.game.turnTime + 100));
	if (si = my.game.seq[my.game.turn])
		if (si.robot) {
			si._done = [];
			if (si.data) delete si.data.retryCount; // Reset Retry Count for new turn
			my.readyRobot(si);
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
				if (isReturn) score = 0;
				my.game.dic[text] = (my.game.dic[text] || 0) + 1;
				my.game.chain.push(text);
				my.game.roundTime -= t;
				my.game.char = preChar;
				my.game.subChar = preSubChar;
				client.game.score += score;
				client.publish('turnEnd', {
					ok: true,
					value: text,
					mean: $doc.mean,
					theme: $doc.theme,
					wc: $doc.type,
					score: score,
					bonus: (my.game.mission === true) ? score - my.getScore(text, t, true) : 0,
					baby: $doc.baby,
					totalScore: client.game.score // 봇 점수 동기화용
				}, true);
				if (my.game.mission === true) {
					my.game.mission = getMission(my.rule.lang);
				}
				setTimeout(my.turnNext, my.game.turnTime / 6);
				if (!client.robot) {
					client.invokeWordPiece(text, 1);
					DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
				} else {
					getAuto.call(my, my.game.char, my.game.subChar, 1).then(function (w) {
						if (!w) {
							setTimeout(function () {
								if (!my.opts.unknown) client.chat(Const.ROBOT_VICTORY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_VICTORY_MESSAGES.length)]);
							}, 500);
						}
					});
				}
			}
			if ((firstMove || my.opts.manner) && !my.opts.unknown) getAuto.call(my, preChar, preSubChar, 1).then(function (w) {
				if (w) approved();
				else {
					my.game.loading = false;
					client.publish('turnError', {
						code: firstMove ? 402 : 403,
						value: text
					}, true);
					if (client.robot) {
						my.readyRobot(client);
					}
					if (my.opts.one) my.turnEnd();
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
				// English: Use simplified 'count' columns (Start stats only)
				// Note: Stats only track words starting with the char. 
				// If isRev (KAP), this is technically checking if words START with the char, 
				// which is not what KAP needs (words ENDING with the char). 
				// But user specified English manner is for KKuTu (Standard) only.
				// If KAP, this might return irrelevant counts, but typically EN KAP is rare/not focused.
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
		var isKKT = (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK");
		var decided = false;

		// Force Retry Logic
		if (robot.data.retryCount > 0) {
			console.log(`[BOT] Forced Retry (Count ${robot.data.retryCount}) with Tier 2 (Previous attempt failed)`);
			decided = true;
			strategy = "ATTACK";
		}

		// Mode Constraints
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
			if (list && list.length) {
				// Filter by length limit and done list
				list = list.filter(function (w) {
					return w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
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
							var pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
							var mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;

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
							var pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
							var mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;
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
									return w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
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

							var subsetSize = Math.max(10, Math.floor(150 * heuristicRatio));
							var subset = killers.slice(0, subsetSize);
							if (subset.length === 0) return nextStepCallback();

							var killerString = subset.join("").replace(/[\[\]\^\-\\]/g, "\\$&");
							var adc = my.game.char + (my.game.subChar ? ("|" + my.game.subChar) : "");
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

							var adc = my.game.char + (my.game.subChar ? ("|" + my.game.subChar) : "");
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

								// Fixed Word Length (EKK/Sami/KKT)
								if (my.game.wordLength > 0) {
									// Assumes killer is 1 char (Simple Logic) or EKT uses 3 char logic (but EKT has no wordLimit usually)
									// For EKK, killers are 1 char.
									// Length = 1(adc) + Mid + 1(killer) = wordLength
									// Mid = wordLength - 2
									var midLen = Math.max(0, my.game.wordLength - 2);
									middlePattern = `.{${midLen}}`;
								} else if (Const.GAME_TYPE[my.mode] === "EKT") {

								}

								regex = `^(${adc})${middlePattern}(${killerPattern})$`;
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
						if (my.game.chain.length === 0 || my.opts.manner) {
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
					pickList(list);
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

		DB.kkutu[my.rule.lang].find(['_id', new RegExp(isRev ? `.${char}$` : `^${char}.`)]).limit(10).on(function ($res) {
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

	adc = char + (subc ? ("|" + subc) : "");
	switch (gameType) {
		case 'EKK':
			adv = `^(${adc}).{${my.game.wordLength - 1}}$`;
			break;
		case 'EKT':
			adv = `^(${adc})..`;
			break;
		case 'KSH':
			adv = `^(${adc}).`;
			break;
		case 'ESH':
			adv = `^(${adc})...`;
			break;
		case 'KKT':
			adv = `^(${adc}).{${my.game.wordLength - 1}}$`;
			break;
		case 'KAP':
		case 'EAP':
			adv = `.(${adc})$`;
			break;
		case 'KAK':
		case 'EAK':
			adv = `^.{${my.game.wordLength - 1}}(${adc})$`;
			break;
	}
	if (!char) {
		console.log(`Undefined char detected! type=${type} adc=${adc}`);
	}

	// type=1 (존재 여부 확인 Check): kkutu_stats table check
	if (bool && char) {
		// Bitmask State
		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;
		if (my.opts.freedueum) state |= 8;

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

		var pending = charsToCheck.length;
		var totalCount = 0;

		charsToCheck.forEach(function (c) {
			table.findOne(['_id', c]).on(function ($st) {
				if ($st && $st[col]) {
					totalCount += $st[col];
				}
				if (--pending === 0) {
					// Done
					if (totalCount > 0) {
						R.go(true);
					} else {
						// Fallback to real DB check if stats say 0 (or cache miss)
						produce();
					}
				}
			}, null, function () {
				// Error/Empty
				if (--pending === 0) {
					if (totalCount > 0) R.go(true);
					else produce();
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
					R.go($md.length ? true : false);
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

	if (type === 'EKT' && my.rule.lang === 'en' && (my.opts.middle || my.opts.second)) {
		my._lastWordLen = len;
		if (len === 2) {
			if (my.opts.second) return text.charAt(0);
			return text.slice(-1);
		}

		if (my.opts.middle) {
			if (len % 2 !== 0) {
				idx = Math.floor(len / 2);
				return text.slice(idx - 1, idx + 2);
			} else {
				idx = len / 2;
				return text.slice(idx - 1, idx + 2);
			}
		}

		if (my.opts.second) {
			if (len >= 4) return text.slice(len - 4, len - 1);
			else if (len === 3) return text;
		}
	}

	if (my.opts.middle || my.opts.second) {
		if (my.opts.middle && my.opts.second) {
			if (len % 2 !== 0) idx = Math.floor(len / 2);
			else idx = isKAP ? (len / 2) : (len / 2 - 1);
		} else if (my.opts.middle) {
			if (len % 2 !== 0) idx = Math.floor(len / 2);
			else idx = isKAP ? (len / 2 - 1) : (len / 2);
		} else {
			idx = isKAP ? 1 : (len - 2);
		}

		if (idx >= 0 && idx < len) return text.charAt(idx);
	}

	switch (type) {
		case 'EKT':
			return text.slice(text.length - 3);
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

function getSubChar(char) {
	var my = this;
	var r;
	var c = char.charCodeAt();
	var k;
	var ca, cb, cc;
	var isKAP = (Const.GAME_TYPE[my.mode] === "KAP" || Const.GAME_TYPE[my.mode] === "KAK" || Const.GAME_TYPE[my.mode] === "EAP" || Const.GAME_TYPE[my.mode] === "EAK");

	switch (Const.GAME_TYPE[my.mode]) {
		case "EKT":
			if (my.rule.lang === 'en' && (my.opts.middle || my.opts.second)) {
				var len = my._lastWordLen;
				if (len && len !== 2) {
					if (my.opts.middle) {
						if (len % 2 !== 0) r = char.slice(1);
						else r = char.slice(1);
					} else if (my.opts.second) {
						if (len >= 4) r = char.slice(1);
						else if (len === 3) r = char.slice(0, 2);
					}
				}
				if (r) break;
			}
			if (char.length > 2) r = char.slice(1);
			break;
		case "EKK":
		case "KKT":
		case "KSH":
		case "KAP":
			k = c - 0xAC00;
			if (k < 0 || k > 11171) break;
			ca = [Math.floor(k / 28 / 21), Math.floor(k / 28) % 21, k % 28];
			cb = [ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7];
			cc = false;

			// Helper to build a character from initial, medial, final
			function buildChar(initial, medial, final) {
				return String.fromCharCode(((initial * 21) + medial) * 28 + final + 0xAC00);
			}

			if (my.opts.freedueum) {
				// 자유 두음법칙: 모음 조건 무시, 두 번째 변환까지 모두 포함
				var results = [];
				var medial = ca[1];
				var final = ca[2];

				if (isKAP) {
					// 앞말잇기: ㅇ→ㄴ|ㄹ, ㄴ→ㄹ
					if (cb[0] === 4363) { // ㅇ -> ㄴ, ㄹ
						results.push(buildChar(2, medial, final)); // ㄴ (initial index 2)
						results.push(buildChar(5, medial, final)); // ㄹ (initial index 5)
					} else if (cb[0] === 4354) { // ㄴ -> ㄹ
						results.push(buildChar(5, medial, final)); // ㄹ (initial index 5)
					}
				} else {
					// 끝말잇기/쿵쿵따: ㄹ→ㄴ|ㅇ, ㄴ→ㅇ
					if (cb[0] === 4357) { // ㄹ -> ㄴ, ㅇ
						results.push(buildChar(2, medial, final)); // ㄴ (initial index 2)
						results.push(buildChar(11, medial, final)); // ㅇ (initial index 11)
					} else if (cb[0] === 4354) { // ㄴ -> ㅇ
						results.push(buildChar(11, medial, final)); // ㅇ (initial index 11)
					}
				}

				if (results.length > 0) {
					r = results.join("|");
				}
			} else {
				// 기존 두음법칙 로직 (모음 조건 적용)
				if (cb[0] == 4357) { // ㄹ에서 ㄴ, ㅇ
					cc = true;
					if (RIEUL_TO_NIEUN.includes(cb[1])) cb[0] = 4354;
					else if (RIEUL_TO_IEUNG.includes(cb[1])) cb[0] = 4363;
					else cc = false;
				} else if (cb[0] == 4354) { // ㄴ에서 ㅇ
					if (NIEUN_TO_IEUNG.indexOf(cb[1]) != -1) {
						cb[0] = 4363;
						cc = true;
					}
				}
				if (cc) {
					cb[0] -= 0x1100;
					cb[1] -= 0x1161;
					cb[2] -= 0x11A7;
					r = String.fromCharCode(((cb[0] * 21) + cb[1]) * 28 + cb[2] + 0xAC00);
				}
			}
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