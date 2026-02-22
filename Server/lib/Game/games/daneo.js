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
const ROBOT_HIT_LIMIT = [4, 2, 1, 0, 0];
const ROBOT_LENGTH_LIMIT = [3, 6, 12, 24, 999];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];
const SPECIAL_MOVE_PROB = [0, 0, 0.1, 0.25, 0.4];
const PERSONALITY_CONST = [0, 0, 0.5, 0.8, 0.99];
const PREFERRED_CHAR_PROB = [0.6, 0.7, 0.8, 0.9, 1.0];

// Helper function to get player ID (supports both robot objects and player ID strings)
function getPlayerId(player) {
	return (typeof player === 'object' && player.id) ? player.id : player;
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

// 주제를 공평하게 분배한 순서 배열을 만든다.
// 주제 수 >= 라운드 수: 중복 없이 랜덤으로 라운드 수만큼 선택
// 주제 수 < 라운드 수: 주제를 한 번씩 돌고, 남은 라운드는 1번씩 반복하다가 마지막은 랜덤
// 결과 배열을 셔플해서 반환
function buildThemeQueue(topics, rounds) {
	var pool = [];
	var remaining = rounds;

	// 주제를 한 번씩 채울 수 있는 만큼 반복해서 채운다
	while (remaining >= topics.length) {
		for (var i = 0; i < topics.length; i++) pool.push(topics[i]);
		remaining -= topics.length;
	}

	// 남은 라운드만큼 중복 없이 랜덤으로 추가
	if (remaining > 0) {
		var rest = topics.slice();
		for (var j = 0; j < remaining; j++) {
			var idx = Math.floor(Math.random() * rest.length);
			pool.push(rest[idx]);
			rest.splice(idx, 1);
		}
	}

	// 전체 셔플
	for (var k = pool.length - 1; k > 0; k--) {
		var r = Math.floor(Math.random() * (k + 1));
		var tmp = pool[k]; pool[k] = pool[r]; pool[r] = tmp;
	}
	return pool;
}

exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;

	my.game.themeQueue = buildThemeQueue(my.opts.injpick, my.round);
	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function () {
	var my = this;
	var ijl = my.opts.injpick.length;

	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if (!my.opts.onlyonce || my.game.round === 1) my.resetChain();
	if (my.game.round <= my.round) {
		if (my.opts.triple) {
			my.game.theme = [];
			while (my.game.theme.length < 3 && my.game.theme.length < ijl) {
				var t = my.opts.injpick[Math.floor(Math.random() * ijl)];
				if (my.game.theme.indexOf(t) == -1) my.game.theme.push(t);
			}
		} else {
			my.game.theme = my.game.themeQueue.shift() || my.opts.injpick[Math.floor(Math.random() * ijl)];
		}
		if (my.opts.mission) my.game.mission = getMission(my.rule.lang, my.opts);
		my.byMaster('roundReady', {
			round: my.game.round,
			theme: my.game.theme,
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
	my.byMaster('turnStart', {
		turn: my.game.turn,
		speed: speed,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		mission: my.game.mission,
		seq: force ? my.game.seq : undefined
	}, true);
	// 서바이벌 모드: 라운드 시간 체크 제거 (턴 시간만 사용)
	var timeout = my.opts.survival
		? my.game.turnTime + 100
		: Math.min(my.game.roundTime, my.game.turnTime + 100);
	my.game.turnTimer = setTimeout(my.turnEnd, timeout);
	if (si = my.game.seq[my.game.turn]) if (si.robot) {
		si._done = [];
		my.readyRobot(si);
	}
};
exports.turnEnd = function () {
	var my = this;
	var target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
	var score;

	if (my.game.loading) {
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	clearTimeout(my.game.turnTimer);
	if (!my.game.chain) return;

	my.game.late = true;

	// ========== 서바이벌 모드: 타임아웃 = 즉시 KO ==========
	if (my.opts.survival && target && target.game && target.game.alive) {
		target.game.alive = false;
		target.game.score = 0;
		my.logChainEvent(target, 'ko');

		var status = Const.checkSurvivalStatus(my, DIC);

		my.byMaster('turnEnd', {
			ok: false,
			target: target.id,
			score: 0,
			totalScore: 0,
			survival: true,
			ko: true,
			koReason: 'timeout'
		}, true);

		if (status.gameOver) {
			clearTimeout(my.game.robotTimer);
			my.game._rrt = setTimeout(function () {
				my.roundEnd();
			}, 2000);
			return;
		}

		clearTimeout(my.game.robotTimer);
		my.game._rrt = setTimeout(function () {
			my.turnNext();
		}, 2000);
		return;
	}
	// ========== 서바이벌 모드 끝 ==========

	if (target) if (target.game) {
		// 무적(god): 패널티 면제
		if (my.opts.invincible) {
			score = 0;
		} else {
			score = Const.getPenalty(my.game.chain, target.game.score);
			// 나락(nar): 최소 패널티 >= 점수일 때 적용 (점수가 0 이하가 됨)
			if (my.opts.narak && Math.abs(score) >= target.game.score) {
				score = -target.game.score;
			}
		}
		if (score !== 0) target.game.score += score;
	}
	getAuto.call(my, my.game.theme, 0).then(function (w) {
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

			for (i in my.game.seq) {
				item = my.game.seq[i];
				if (typeof item === 'string') {
					p = DIC[item];
				} else {
					p = item;
				}

				if (p && p.robot) {
					if (p.id !== targetId) {
						bots.push(p);
					}
				}
			}

			if (bots.length > 0) {
				// Each bot has a 50% chance to send a timeout message
				var prob = 0.5;
				var targetTeam = 0;
				// Determine target team safely
				if (target && typeof target === 'object') {
					if (target.robot) {
						targetTeam = target.game.team || 0;
					} else {
						targetTeam = target.team || 0;
					}
				}

				for (i in bots) {
					var rand = Math.random();
					if (rand < prob) {
						(function (bot) {
							// Check team relation
							var botTeam = bot.game.team || 0;
							var isTeammate = (targetTeam !== 0 && targetTeam === botTeam);

							setTimeout(function () {
								var msgs = isTeammate ?
									Const.ROBOT_TIMEOUT_MESSAGES_SAMETEAM :
									Const.ROBOT_TIMEOUT_MESSAGES;

								if (!msgs || msgs.length === 0) msgs = Const.ROBOT_TIMEOUT_MESSAGES;

								var msg = msgs[Math.floor(Math.random() * msgs.length)];
								bot.chat(msg);
							}, 500 + Math.random() * 1000);
						})(bots[i]);
					}
				}
			}
		}

		my.logChainEvent(target, 'timeout');
		my.game._rrt = setTimeout(my.roundReady, 3000);
	});
	clearTimeout(my.game.robotTimer);
};
exports.submit = function (client, text, data) {
	var score, l, t;
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];

	if (!mgt) return;
	// Turn check: Only the current turn owner can submit words
	if (getPlayerId(mgt) !== getPlayerId(client)) return client.chat(text);
	if (!my.game.theme) return;

	// noLong/noShort/no2 길이 검증 (통과 못하면 채팅으로 처리)
	if (my.opts.nolong && text.length >= 9) return client.chat(text);
	if (my.opts.noshort && text.length <= 8) return client.chat(text);
	if (my.opts.no2 && text.length <= 2) return client.chat(text);

	if (my.game.chain.indexOf(text) == -1 || my.opts.return) {
		l = my.rule.lang;
		my.game.loading = true;
		function onDB($doc) {
			function preApproved() {
				if (my.game.late) return;
				if (!my.game.chain) return;

				my.game.loading = false;
				my.game.late = true;
				clearTimeout(my.game.turnTimer);
				t = tv - my.game.turnAt;
				var isReturn = my.opts.return && my.game.chain.includes(text);

				// 기본 점수 계산 (미션 보너스 포함)
				var baseScore = my.getScore(text, t, isReturn);
				// 미션 보너스 제외한 순수 기본 점수
				var baseScoreWithoutMission = my.getScore(text, t, true);
				// 미션 보너스만 추출
				var missionBonus = (my.game.mission === true) ? baseScore - baseScoreWithoutMission : 0;

				score = baseScoreWithoutMission;

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
						var multiplier = (client.game.straightStreak - 1) / 2;
						straightBonus = Math.round(baseScoreWithoutMission * multiplier);
						if (my.opts.bbungtwigi) straightBonus *= 2; // 뻥튀기: 스트레이트 보너스 2배
					}
				}

				// Full House Bonus Logic
				var fullHouseBonus = 0;
				var fullHouseChars = [];
				if (client.game.lastWord && client.game.lastWord.length > 0) {
					var prevWord = client.game.lastWord;
					var prevChars = prevWord.split('');
					var currentChars = text.split('');
					var matchCount = 0;
					var matchedIndices = [];

					for (var k = 0; k < prevChars.length; k++) {
						var foundIdx = currentChars.indexOf(prevChars[k]);
						if (foundIdx !== -1) {
							matchCount++;
							matchedIndices.push(foundIdx);
							currentChars[foundIdx] = null; // Mark as used
						} else {
							break; // If any character is missing, fail Full House
						}
					}

					if (matchCount === prevChars.length) {
						fullHouseBonus = Math.round(baseScoreWithoutMission * 1.5);
						if (my.opts.bbungtwigi) fullHouseBonus *= 2; // 뻥튀기: 보너스 2배
						fullHouseChars = matchedIndices;
					}
				}
				client.game.lastWord = text;

				// 최종 점수 = 기본 점수 + 미션 보너스 + 스트레이트 보너스 + 풀하우스 보너스
				score = baseScoreWithoutMission + missionBonus + straightBonus + fullHouseBonus;

				if (isReturn) score = 0;
				my.logChainWord(text, client);
				my.game.roundTime -= t;

				// ========== 서바이벌 모드: 득점 = 다음 사람 데미지 ==========
				if (my.opts.survival) {
					client.game.survivalSubmitted = true;
					var damage = score;
					var survivalDamageInfo = Const.applySurvivalDamage(my, DIC, damage, my.game.turn);
					var status = Const.checkSurvivalStatus(my, DIC);

					client.publish('turnEnd', {
						ok: true,
						value: text,
						mean: $doc.mean,
						theme: $doc.theme,
						wc: $doc.type,
						score: score,
						bonus: missionBonus,
						straightBonus: straightBonus,
						fullHouseBonus: fullHouseBonus > 0 ? fullHouseBonus : undefined,
						fullHouseChars: fullHouseChars,
						baby: $doc.baby,
						totalScore: client.game.score,
						survival: true,
						survivalDamage: survivalDamageInfo,
						attackerHP: client.game.score
					}, true);

					if (status.gameOver) {
						clearTimeout(my.game.turnTimer);
						clearTimeout(my.game.robotTimer);
						my.game._rrt = setTimeout(function () {
							my.roundEnd();
						}, 2000);
					} else {
						if (my.game.mission === true) {
							my.game.mission = getMission(my.rule.lang, my.opts);
						} else if (my.opts.rndmission) {
							my.game.mission = getMission(my.rule.lang, my.opts);
						}
						clearTimeout(my.game.turnTimer);
						clearTimeout(my.game.robotTimer);
						my.game._rrt = setTimeout(function () {
							my.turnNext();
						}, my.game.turnTime / 6);
					}

					if (!client.robot) {
						client.invokeWordPiece(text, 1);
						DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
					}
					return;
				}
				// ========== 서바이벌 모드 끝 ==========

				client.game.score += score;
				client.publish('turnEnd', {
					ok: true,
					value: text,
					mean: $doc.mean,
					theme: $doc.theme,
					wc: $doc.type,
					score: score,
					bonus: missionBonus,
					straightBonus: straightBonus, // Send Straight Bonus
					fullHouseBonus: (typeof fullHouseBonus !== 'undefined' && fullHouseBonus > 0) ? fullHouseBonus : undefined,
					fullHouseChars: (typeof fullHouseChars !== 'undefined') ? fullHouseChars : [],
					baby: $doc.baby,
					totalScore: client.game.score
				}, true);
				if (my.game.mission === true) {
					my.game.mission = getMission(my.rule.lang, my.opts);
				} else if (my.opts.rndmission) {
					// 랜덤미션: 달성하지 않아도 매 턴마다 미션 변경
					my.game.mission = getMission(my.rule.lang, my.opts);
				}
				setTimeout(my.turnNext, my.game.turnTime / 6);
				if (!client.robot) {
					client.invokeWordPiece(text, 1);
					DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
				}
			}
			function denied(code) {
				my.game.loading = false;
				client.publish('turnError', { code: code || 404, value: text }, true);
				if (my.opts.one) my.turnEnd();
			}
			if ($doc) {
				if ($doc.theme.match(toRegex(my.game.theme)) == null) denied(407);
				else preApproved();
			} else {
				denied();
			}
		}
		DB.kkutu[l].findOne(['_id', text]).limit(['mean', true], ['theme', true], ['type', true], ['hit', true]).on(onDB);
	} else {
		if (client.robot && client.data.candidates && client.data.candidateIndex < client.data.candidates.length - 1) {
			client.data.candidateIndex++;
			var nextWord = client.data.candidates[client.data.candidateIndex];
			setTimeout(function () {
				my.turnRobot(client, nextWord._id);
			}, ROBOT_START_DELAY[client.level]);
			return;
		}
		client.publish('turnError', { code: 409, value: text }, true);
		if (my.opts.one) my.turnEnd();
	}
};
exports.getScore = function (text, delay, ignoreMission) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score = Const.getPreScore(text, my.game.chain, tr);
	var arr;

	if (!ignoreMission) {
		// 쉬운 미션 (easymission) 규칙: 초성과 중성만 일치하면 미션 달성
		if (my.opts.easymission && my.rule.lang === "ko") {
			var missionChar = my.game.mission;
			var matchCount = 0;

			// 미션 글자의 초성+중성 값 (28로 나눈 몫)
			var missionCode = missionChar.charCodeAt(0) - 0xAC00;
			if (missionCode >= 0 && missionCode <= 11171) {
				var missionBase = Math.floor(missionCode / 28);

				// 입력 단어의 각 글자를 검사
				for (var i = 0; i < text.length; i++) {
					var charCode = text.charCodeAt(i) - 0xAC00;
					if (charCode >= 0 && charCode <= 11171) {
						// 초성+중성이 일치하면 카운트
						if (Math.floor(charCode / 28) === missionBase) {
							matchCount++;
						}
					}
				}

				if (matchCount > 0) {
					var missionBonus = score * 0.5 * matchCount;
					if (my.opts.bbungtwigi) missionBonus *= 2; // 뻥튀기: 미션 보너스 2배
					score += missionBonus;
					my.game.mission = true;
				}
			}
		} else {
			// 기본 미션 규칙
			if (arr = text.match(new RegExp(my.game.mission, "g"))) {
				var missionBonus = score * 0.5 * arr.length;
				if (my.opts.bbungtwigi) missionBonus *= 2; // 뻥튀기: 미션 보너스 2배
				score += missionBonus;
				my.game.mission = true;
			}
		}
	}
	return Math.round(score);
};
exports.readyRobot = function (robot) {
	var my = this;
	var level = robot.level;
	var delay = ROBOT_START_DELAY[level];
	var w, text;
	var personality = robot.data.personality || 0;
	var preferredChar = robot.data.preferredChar;

	// 1. Preferred Character Logic
	// Removed for Word Battle mode per user request.

	decideStrategy();

	function decideStrategy() {
		var strategy = "NORMAL";
		// Strategy logic: Attack matches are invalid here; default to Long Word strategy if personality triggers.

		var effPersonality = personality;
		if (effPersonality > 0) effPersonality = 0; // Treat attack personality as 0

		// Personality Check
		if (effPersonality !== 0 && level >= 2) {
			if (Math.random() < PERSONALITY_CONST[level] * Math.abs(effPersonality)) {
				if (effPersonality < 0) strategy = "LONG";
			}
		}

		// Neutral Check
		if (strategy === "NORMAL" && level >= 2) {
			if (Math.random() < SPECIAL_MOVE_PROB[level]) {
				strategy = "LONG";
			}
		}

		executeStrategy(strategy);
	}

	function executeStrategy(strategy) {
		var limit = 0;
		if (strategy === "LONG") limit = 3;

		var sort = (strategy === "LONG") ? { 'length(_id)': -1 } : null;

		getAuto.call(my, my.game.theme, 2, limit, sort).then(function (list) {
			if (list && list.length) {
				var minLen = 1;
				var maxLen = ROBOT_LENGTH_LIMIT[level];
				// nolong 모드: 최대 8글자
				if (my.opts.nolong) {
					maxLen = Math.min(maxLen, 8);
				}
				// noshort 모드: 최소 9글자, level 0,1 봇은 최대 12글자로 확장
				if (my.opts.noshort) {
					minLen = 9;
					if (level <= 1) {
						maxLen = Math.max(maxLen, 12);
					}
				}
				// no2 모드: 최소 3글자
				if (my.opts.no2) {
					minLen = Math.max(minLen, 3);
				}
				list = list.filter(function (w) {
					return w._id.length >= minLen && w._id.length <= maxLen && !robot._done.includes(w._id);
				});

				if (list.length === 0) {
					if (strategy !== "NORMAL") {
						executeStrategy("NORMAL");
					} else {
						denied();
					}
					return;
				}

				if (strategy === "LONG") {
					// list is already sorted by length desc from DB
					var top = list.slice(0, 30);
					pickList(shuffle(top)); // Pick randomly from top 30
				} else {
					// NORMAL (Attack is disabled in Daneo per user request for "Word Battle" types)
					list.sort(function (a, b) { return b.hit - a.hit; });
					var top = list.slice(0, ROBOT_CANDIDATE_LIMIT[level]);
					var rest = list.slice(ROBOT_CANDIDATE_LIMIT[level]);
					list = shuffle(top).concat(rest);
					pickList(list);
				}
			} else {
				if (strategy !== "NORMAL") {
					executeStrategy("NORMAL");
				} else {
					denied();
				}
			}
		});
	}

	function denied() {
		text = Const.ROBOT_DEFEAT_MESSAGES_2[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES_2.length)];
		after();
	}
	function pickList(list) {
		if (list && list.length > 0) {
			robot.data.candidates = list;
			robot.data.candidateIndex = 0;
			var candidate = list[0];
			if (candidate) {
				w = candidate;
				text = w._id;
				delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
				after();
			} else denied();
		} else denied();
	}
	function after() {
		delay += text.length * ROBOT_TYPE_COEF[level];
		my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, text);
	}
};
function toRegex(theme) {
	if (typeof theme == "object") return new RegExp(`(^|,)(${theme.join('|')})($|,)`);
	return new RegExp(`(^|,)${theme}($|,)`);
}
function getMission(l, opts) {
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
		var initialIndex = Const.INIT_SOUNDS.indexOf(initial);
		var vowelIndex = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"].indexOf(vowel);

		// 종성 없이 초성+중성만 조합
		return String.fromCharCode(0xAC00 + (initialIndex * 588) + (vowelIndex * 28));
	}

	// 기본 미션 로직
	var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;

	if (!arr) return "-";
	return arr[Math.floor(Math.random() * arr.length)];
}
function getAuto(theme, type, limit, sort) {
	/* type
		0 무작위 단어 하나
		1 존재 여부
		2 단어 목록
	*/
	var my = this;
	var R = new Lizard.Tail();
	var bool = type == 1;

	var aqs = [['theme', toRegex(theme)]];
	var aft;
	var raiser;
	var lst = false;

	if (my.game.chain) aqs.push(['_id', { '$nin': my.game.chain }]);
	raiser = DB.kkutu[my.rule.lang].find.apply(this, aqs);
	if (sort) raiser.sort(sort);
	raiser.limit((bool ? 1 : 123) * (limit || 1));
	// noLong/noShort/no2 길이 필터 함수
	function filterByLengthRule($md) {
		if (my.opts.nolong) {
			$md = $md.filter(function (item) {
				return item._id && item._id.length <= 8;
			});
		}
		if (my.opts.noshort) {
			$md = $md.filter(function (item) {
				return item._id && item._id.length >= 9;
			});
		}
		if (my.opts.no2) {
			$md = $md.filter(function (item) {
				return item._id && item._id.length >= 3;
			});
		}
		return $md;
	}

	switch (type) {
		case 0:
		default:
			aft = function ($md) {
				$md = filterByLengthRule($md);
				R.go($md[Math.floor(Math.random() * $md.length)]);
			};
			break;
		case 1:
			aft = function ($md) {
				$md = filterByLengthRule($md);
				R.go($md.length ? true : false);
			};
			break;
		case 2:
			aft = function ($md) {
				R.go(filterByLengthRule($md));
			};
			break;
	}
	raiser.on(aft);

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