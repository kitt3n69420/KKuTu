/**
* Rule the words! KKuTu Online
* Copyright (C) 2017 JJoriping(op@jjo.kr)
*
* This program is free software: you can redistri-bute it and/or modify
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

var ROBOT_CATCH_RATE = [0.1, 0.3, 0.5, 0.7, 0.99];
var ROBOT_TYPE_COEF = [2000, 1200, 800, 300, 0];

var DIFFICULTY_CATCH_MOD = { 'qz1': 1.2, 'qz2': 0.8, 'qz3': 0.4 };
var DIFFICULTY_TYPE_MOD  = { 'qz1': 0.5, 'qz2': 1.0, 'qz3': 2.0 };

function getDiffMod(difficulty) {
	return {
		catchRate: DIFFICULTY_CATCH_MOD[difficulty] || 1.0,
		typeCoef:  DIFFICULTY_TYPE_MOD[difficulty]  || 1.0
	};
}

// 난이도별 MATH chain 값
var DIFFICULTY_CHAIN = {
	'qz1': 0,   // 쉬움
	'qz2': 20,  // 보통
	'qz3': 40   // 어려움
};

// 난이도별 점수 배수
var DIFFICULTY_BONUS = {
	'qz1': 20,  // 쉬움
	'qz2': 30,  // 보통
	'qz3': 40   // 어려움
};

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

// 주제를 공평하게 분배한 순서 배열을 만든다.
function buildThemeQueue(topics, rounds) {
	var pool = [];
	var remaining = rounds;

	while (remaining >= topics.length) {
		for (var i = 0; i < topics.length; i++) pool.push(topics[i]);
		remaining -= topics.length;
	}

	if (remaining > 0) {
		var rest = topics.slice();
		for (var j = 0; j < remaining; j++) {
			var idx = Math.floor(Math.random() * rest.length);
			pool.push(rest[idx]);
			rest.splice(idx, 1);
		}
	}

	for (var k = pool.length - 1; k > 0; k--) {
		var r = Math.floor(Math.random() * (k + 1));
		var tmp = pool[k]; pool[k] = pool[r]; pool[r] = tmp;
	}
	return pool;
}

exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;

	my.game.done = new Set();
	var topics = my.opts.quizpick;
	if (topics && Array.isArray(topics) && topics.length > 0) {
		my.game.themeQueue = buildThemeQueue(topics, my.round);
	} else {
		my.game.themeQueue = [];
	}
	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};

exports.roundReady = function () {
	var my = this;
	var topics = my.opts.quizpick;

	// 주제가 선택되지 않았거나 빈 배열이면 에러 처리
	if (!topics || !Array.isArray(topics) || topics.length === 0) {
		return;
	}

	var ijl = topics.length;

	clearTimeout(my.game.qTimer);
	clearTimeout(my.game.hintTimer);
	clearTimeout(my.game.hintTimer2);

	// 난이도 결정
	my.game.difficulty = getDifficulty(my.opts);
	my.game.difficultyBonus = DIFFICULTY_BONUS[my.game.difficulty] || 30;

	my.game.winner = [];
	my.game.giveup = [];
	my.game.primary = 0;
	my.game.round++;
	my.game.roundTime = my.time * 1000;

	if (my.game.round <= my.round) {
		my.game.topic = (my.game.themeQueue && my.game.themeQueue.length > 0)
			? my.game.themeQueue.shift()
			: topics[Math.floor(Math.random() * ijl)];

		tryQuizTopic.call(my, [my.game.topic], topics, 3);
	} else {
		my.roundEnd();
	}
};

exports.turnStart = function () {
	var my = this;
	var i;

	if (!my.game.question) return;

	my.game.roundAt = (new Date()).getTime();
	my.game.hintCount = 0;
	my.game.primary = 0;
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.game.hintTimer = setTimeout(function () { turnHint.call(my); }, my.game.roundTime * 0.333);
	my.game.hintTimer2 = setTimeout(function () { turnHint.call(my); }, my.game.roundTime * 0.667);

	my.byMaster('turnStart', {
		question: my.game.question,
		roundTime: my.game.roundTime
	}, true);

	for (i in my.game.robots) {
		my.readyRobot(my.game.robots[i]);
	}
};

function turnHint() {
	var my = this;

	my.byMaster('turnHint', {
		hint: my.game.hints[my.game.hintCount++]
	}, true);
}

exports.turnEnd = function () {
	var my = this;
	var i;

	if (my.game.late) return;

	if (my.game.question) {
		my.game.late = true;
		my.byMaster('turnEnd', {
			answer: my.game.answer || ""
		});
		if (typeof my.sendQuizRoundEnd === 'function') {
			var _ans = my.game.answer || "";
			var _winners = (my.game.winner || []).slice();
			var _giveup = (my.game.giveup || []).slice();
			var _missed = (my.game.seq || []).filter(function (id) {
				return _winners.indexOf(id) === -1 && _giveup.indexOf(id) === -1;
			});
			my.sendQuizRoundEnd(_ans, _winners, _missed, _giveup, my.game.round);
		}
	}

	// 봇 타이머 정리 (라운드 종료 시 봇이 답을 제출하지 않도록)
	for (i in my.game.robots) {
		clearTimeout(my.game.robots[i]._timer);
	}

	clearTimeout(my.game._rrt);
	my.game._rrt = setTimeout(my.roundReady, 2500);
};

exports.submit = function (client, text) {
	var my = this;
	var score, t, i;
	var now = (new Date()).getTime();
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var gu = my.game.giveup ? my.game.giveup.includes(client.id) : false;

	if (my.game.late) return;
	if (!my.game.winner) return;

	var isCorrect = checkAnswer(text, my.game.answer, my.game.aliases, my.game.topic, my.rule.lang);

	if (my.game.winner.indexOf(client.id) == -1 && isCorrect && play && !gu) {
		t = now - my.game.roundAt;
		if (my.game.primary == 0) if (my.game.roundTime - t > 10000) {
			clearTimeout(my.game.qTimer);
			my.game.qTimer = setTimeout(my.turnEnd, 10000);
			for (i in my.game.robots) {
				if (my.game.roundTime > my.game.robots[i]._delay) {
					clearTimeout(my.game.robots[i]._timer);
					if (client != my.game.robots[i]) {
						var mod = getDiffMod(my.game.difficulty);
						var catchRate = Math.min(1.0, ROBOT_CATCH_RATE[my.game.robots[i].level] * mod.catchRate);
						if (Math.random() < catchRate) {
							var randomDelay = Math.floor(Math.random() * 90) + 10;
							var typeDelay = Math.round(ROBOT_TYPE_COEF[my.game.robots[i].level] * mod.typeCoef);
							my.game.robots[i]._timer = setTimeout(my.turnRobot, typeDelay + randomDelay, my.game.robots[i], my.game.answer);
						}
					}
				}
			}
		}
		clearTimeout(my.game.hintTimer);
		clearTimeout(my.game.hintTimer2);
		score = my.getScore(text, t);
		if (typeof score !== 'number' || isNaN(score)) {
			score = 0;
		}
		my.game.primary++;
		my.game.winner.push(client.id);
		if (!client.game) {
			client.game = { score: 0, bonus: 0, team: 0 };
		}
		if (typeof client.game.score !== 'number' || isNaN(client.game.score)) {
			client.game.score = 0;
		}
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			ok: true,
			value: text,
			score: score,
			bonus: 0,
			totalScore: client.game.score
		}, true);
		client.invokeWordPiece(text, 0.9);
		while (my.game.hintCount < my.game.hints.length) {
			turnHint.call(my);
		}
	} else if (play && !gu && (text == "gg" || text == "ㅈㅈ")) {
		my.game.giveup.push(client.id);
		client.publish('turnEnd', {
			target: client.id,
			giveup: true
		}, true);
	} else {
		if (my.game.winner.indexOf(client.id) !== -1) {
			client.chat(maskText(text, my.game.answer));
		} else {
			client.chat(text);
		}
	}
	if (play) if (my.game.primary + my.game.giveup.length >= my.game.seq.length) {
		clearTimeout(my.game.hintTimer);
		clearTimeout(my.game.hintTimer2);
		clearTimeout(my.game.qTimer);
		my.turnEnd();
	}
};

exports.getScore = function (text, delay) {
	var my = this;
	var hum = (typeof my.game.hum === 'number') ? my.game.hum : 1;
	var primary = (typeof my.game.primary === 'number') ? my.game.primary : 0;
	var roundTime = (typeof my.game.roundTime === 'number' && my.game.roundTime > 0) ? my.game.roundTime : 1;
	var difficultyBonus = (typeof my.game.difficultyBonus === 'number') ? my.game.difficultyBonus : 30;

	var rank = Math.max(1, hum - primary + 3);
	var tr = 1 - delay / roundTime;
	if (isNaN(tr) || tr < 0) tr = 0;
	if (tr > 1) tr = 1;

	var score = Math.pow(rank, 1.4) * (0.5 + 0.5 * tr);
	var result = Math.round(score * difficultyBonus);

	return isNaN(result) ? 0 : result;
};

exports.readyRobot = function (robot) {
	var my = this;
	var level = robot.level;
	var delay;
	var i;

	if (!my.game.answer) return;
	clearTimeout(robot._timer);
	robot._delay = 99999999;
	var mod = getDiffMod(my.game.difficulty);
	var catchRate = Math.min(1.0, ROBOT_CATCH_RATE[level] * mod.catchRate);
	var typeCoef = Math.round(ROBOT_TYPE_COEF[level] * mod.typeCoef);
	for (i = 0; i < 2; i++) {
		if (Math.random() < catchRate) {
			var randomDelay = Math.floor(Math.random() * 90) + 10;
			delay = my.game.roundTime / 3 * i + my.game.answer.length * typeCoef + randomDelay;
			robot._timer = setTimeout(my.turnRobot, delay, robot, my.game.answer);
			robot._delay = delay;
			break;
		}
	}
};

// 난이도 결정 함수
function getDifficulty(opts) {
	var selected = [];

	if (opts.quizeasy) selected.push('qz1');
	if (opts.quiznormal) selected.push('qz2');
	if (opts.quizhard) selected.push('qz3');

	// 선택된 난이도가 있으면 그 중에서 랜덤 선택
	if (selected.length > 0) {
		var chosen = selected[Math.floor(Math.random() * selected.length)];
		return chosen;
	}

	// 아무것도 선택 안 됐으면 랜덤
	var difficulties = ['qz1', 'qz2', 'qz3'];
	var random = difficulties[Math.floor(Math.random() * difficulties.length)];
	return random;
}

// 문제 가져오기 함수
function getQuestion(topic, difficulty, ignoreDone) {
	var my = this;
	var R = new Lizard.Tail();
	var lang = my.rule.lang;

	// MATH는 실시간 생성
	if (topic === 'MATH') {
		var chain = DIFFICULTY_CHAIN[difficulty] || 0;
		var problem = Const.generateCalcProblem(chain);

		setTimeout(function () {
			R.go({
				topic: 'MATH',
				question: problem.question,
				answer: String(problem.answer),
				aliases: null,
				difficulty: difficulty === 'qz1' ? 1 : (difficulty === 'qz2' ? 2 : 3)
			});
		}, 10);
		return R;
	}

	// DB에서 문제 가져오기
	var difficultyNum = difficulty === 'qz1' ? 1 : (difficulty === 'qz2' ? 2 : 3);
	var args = [];

	// 조건 추가: topic과 difficulty는 항상 포함
	args.push(['topic', topic]);
	args.push(['difficulty', difficultyNum]);

	// ignoreDone이 false일 때만 done 제외 조건 추가
	if (!ignoreDone) {
		args.push(['question', { $nin: Array.from(my.game.done) }]);
	}

	DB.kkutu.quiz.find(...args).on(function ($res) {
		if (!$res || $res.length === 0) return R.go(null);

		var pick = Math.floor(Math.random() * $res.length);
		var q = $res[pick];

		R.go({
			topic: q.topic,
			question: q.question,
			answer: lang === 'ko' ? q.answer_ko : q.answer_en,
			aliases: lang === 'ko' ? q.aliases_ko : q.aliases_en,
			difficulty: q.difficulty
		});
	});

	return R;
}

// 주제별 문제 조회 재시도 — 최대 attemptsLeft번 시도 후 MATH 폴백
function tryQuizTopic(triedTopics, candidates, attemptsLeft) {
	var my = this;
	var topic = my.game.topic;

	getQuestion.call(my, topic, my.game.difficulty).then(function($q) {
		if (!my.game.done) return;
		if ($q) { processQuestion.call(my, $q, false); return; }

		getQuestion.call(my, topic, my.game.difficulty, true).then(function($q2) {
			if (!my.game.done) return;
			if ($q2) { processQuestion.call(my, $q2, false); return; }

			var remaining = candidates.filter(function(t) { return triedTopics.indexOf(t) === -1; });
			if (attemptsLeft > 1 && remaining.length > 0) {
				var next = remaining[Math.floor(Math.random() * remaining.length)];
				triedTopics.push(next);
				my.game.topic = next;
				tryQuizTopic.call(my, triedTopics, candidates, attemptsLeft - 1);
				return;
			}

			// MATH 폴백
			my.game.topic = 'MATH';
			getQuestion.call(my, 'MATH', my.game.difficulty).then(function($qm) {
				if (!my.game.done) return;
				if ($qm) processQuestion.call(my, $qm, true);
			});
		});
	});
}

// 문제 처리 함수
function processQuestion($q, isFallback) {
	var my = this;
	var lang = my.rule.lang;

	my.game.late = false;
	my.game.question = $q.question;
	my.game.answer = $q.answer;
	my.game.aliases = $q.aliases ? $q.aliases.split(',').map(function (s) { return s.trim(); }) : [];
	my.game.done.add($q.question);

	// 힌트 생성: 1차 = N글자, 2차 = 첫 글자
	my.game.hints = getHints($q.answer, lang);

	my.byMaster('roundReady', {
		round: my.game.round,
		topic: my.game.topic,
		difficulty: my.game.difficulty,
		isFallback: !!isFallback
	}, true);
	setTimeout(my.turnStart, 2400);
}

// 힌트 생성 함수
function getHints(answer, lang) {
	var hints = [];

	// 1차 힌트: N글자
	hints.push(answer.replace(/\s/g, '').length + (lang === 'ko' ? '글자' : ' letters'));

	// 2차 힌트: 첫 글자
	hints.push(answer.charAt(0).toUpperCase());
	return hints;
}

// 정답 체크 함수
function checkAnswer(input, answer, aliases, topic, lang) {
	if (!input || !answer) return false;

	// MATH: 숫자 비교
	if (topic === 'MATH') {
		return Number(input) === Number(answer);
	}

	// 영어: 대소문자/띄어쓰기 무시
	if (lang === 'en') {
		var normalize = function (s) {
			return s.toLowerCase().replace(/\s/g, '');
		};
		if (normalize(input) === normalize(answer)) return true;
		if (aliases) {
			for (var i = 0; i < aliases.length; i++) {
				if (normalize(input) === normalize(aliases[i])) return true;
			}
		}
		return false;
	}

	// 한국어: 띄어쓰기 무시
	if (input.replace(/\s/g, '') === answer.replace(/\s/g, '')) return true;
	if (aliases) {
		for (var i = 0; i < aliases.length; i++) {
			if (input.replace(/\s/g, '') === aliases[i].replace(/\s/g, '')) return true;
		}
	}
	return false;
}

// 텍스트 마스킹 함수
function maskText(text, answer) {
	if (!answer || answer.length === 0) return text;

	var mask = new Array(text.length).fill(false);
	var found = false;
	var lowerAns = answer.toLowerCase();
	var lowerText = text.toLowerCase();

	for (var i = 0; i < text.length; i++) {
		for (var len = 2; i + len <= text.length; len++) {
			var sub = lowerText.substr(i, len);
			if (lowerAns.includes(sub)) {
				for (var k = 0; k < len; k++) mask[i + k] = true;
				found = true;
			}
		}
	}

	if (found) {
		var censored = "";
		for (var j = 0; j < text.length; j++) {
			censored += mask[j] ? "○" : text[j];
		}
		return censored;
	} else {
		return text;
	}
}
