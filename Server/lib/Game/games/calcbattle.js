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

/**
 * Calcbattle (계산 대결) - 타자대결 방식 + 수학 문제 풀이
 * 각 플레이어가 독립적으로 수학 문제를 풀어서 점수를 획득
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

// 봇 상수
const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [10, 5, 2, 1, 0];
const ROBOT_ACCURACY_COEF = [0.8, 1, 1.5, 2, 1];
const BOT_CPM = [30, 70, 150, 250, 500];
const BOT_ACCURACY = [0.9, 0.95, 0.98, 0.99, 1.0];

// 순회 헬퍼
function traverse(func) {
	var my = this;
	var i, o;

	for (i in my.game.seq) {
		var item = my.game.seq[i];
		if (typeof item === 'string') {
			if (!(o = DIC[item])) continue;
		} else {
			o = item;
		}
		if (!o.game) continue;
		func(o);
	}
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;

	// 각 플레이어별 상태 초기화
	traverse.call(my, function (o) {
		o.game.chain = 0;
		o.game.out = false;
	});

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};

exports.roundReady = function () {
	var my = this;
	var playerProblems = {};
	var playerNextProblems = {};

	clearTimeout(my.game.qTimer);
	clearTimeout(my.game._rrt);
	my.game.round++;
	my.game.roundTime = my.time * 1000;

	if (my.game.round <= my.round) {
		// 각 플레이어에게 첫 문제 할당
		traverse.call(my, function (o) {
			var problem1 = Const.generateCalcProblem(0);
			var problem2 = Const.generateCalcProblem(0);

			o.game.chain = 0;
			o.game.miss = 0;
			o.game.out = false;

			if (my.opts.oneback) {
				// oneback 모드: 현재 답은 problem1, 표시는 problem2
				o.game.question = problem2.question;
				o.game.answer = problem1.answer;
				o.game.displayQuestion = problem2.question;
				o.game.pendingAnswer = problem2.answer;
				// 다다음 문제 생성
				var problem3 = Const.generateCalcProblem(0);
				o.game.nextQuestion = problem3.question;
				o.game.nextAnswer = problem3.answer;
				playerProblems[o.id] = {
					first: problem1.question,
					display: problem2.question,
					next: problem3.question
				};
			} else {
				// 일반 모드
				o.game.question = problem1.question;
				o.game.answer = problem1.answer;
				playerProblems[o.id] = problem1.question;
				playerNextProblems[o.id] = problem2.question;
				o.game.nextQuestion = problem2.question;
				o.game.nextAnswer = problem2.answer;
			}
		});

		my.byMaster('roundReady', {
			round: my.game.round,
			problems: playerProblems,
			nextProblems: playerNextProblems,
			oneback: my.opts.oneback || false
		}, true);
		setTimeout(my.turnStart, 2400);
	} else {
		// 게임 종료
		var chains = {};
		traverse.call(my, function (o) {
			chains[o.id] = o.game.chain || 0;
		});
		my.roundEnd({ chains: chains });
	}
};

exports.turnStart = function () {
	var my = this;

	my.game.late = false;
	my.game.turnAt = (new Date()).getTime();

	// 모든 플레이어 동시 시작
	traverse.call(my, function (o) {
		o.game.miss = 0;
		if (o.robot) exports.playRobot.call(my, o);
	});

	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', { roundTime: my.game.roundTime }, true);
};

exports.turnEnd = function () {
	var my = this;
	var chains = {};

	my.game.late = true;
	clearTimeout(my.game.qTimer);

	traverse.call(my, function (o) {
		if (o.robot) clearTimeout(o.game.typingTimer);
		chains[o.id] = o.game.chain || 0;
	});

	my.byMaster('turnEnd', {
		ok: false,
		chains: chains
	});

	my.game._rrt = setTimeout(my.roundReady, (my.game.round == my.round) ? 3000 : 10000);
};

exports.submit = function (client, text) {
	var my = this;
	var score;
	var allOut = true;

	if (!client.game) return;
	if (client.game.out) return client.chat(text);
	if (my.game.late) return client.chat(text);

	// 포기 처리 (gg, ㅈㅈ)
	if (text === 'gg' || text === 'ㅈㅈ') {
		var penaltyScore = Const.getCalcBattleScore(client.game.answer) * 2;
		client.game.score -= penaltyScore;
		if (client.game.score < -9999) client.game.score = -9999;

		if (my.opts.one) {
			client.game.out = true;
			client.publish('turnEnd', {
				target: client.id,
				ok: false,
				out: true,
				giveup: true,
				value: text,
				score: -penaltyScore,
				totalScore: client.game.score
			}, true);

			// 모든 플레이어가 아웃인지 확인
			traverse.call(my, function (o) {
				if (!o.game.out) allOut = false;
			});
			if (allOut) my.turnEnd();
			return;
		}

		if (my.opts.oneback) {
			// oneback 모드: 문제 시프트
			client.game.answer = client.game.pendingAnswer;
			client.game.displayQuestion = client.game.nextQuestion;
			client.game.pendingAnswer = client.game.nextAnswer;
			var newProblem = Const.generateCalcProblem(client.game.chain);
			client.game.nextQuestion = newProblem.question;
			client.game.nextAnswer = newProblem.answer;

			client.publish('turnEnd', {
				target: client.id,
				ok: false,
				giveup: true,
				value: text,
				score: -penaltyScore,
				totalScore: client.game.score,
				chain: client.game.chain,
				nextQuestion: client.game.displayQuestion,
				nextNextQuestion: client.game.nextQuestion
			}, true);
		} else {
			// 일반 모드
			client.game.question = client.game.nextQuestion;
			client.game.answer = client.game.nextAnswer;
			var newProblem = Const.generateCalcProblem(client.game.chain);
			client.game.nextQuestion = newProblem.question;
			client.game.nextAnswer = newProblem.answer;

			client.publish('turnEnd', {
				target: client.id,
				ok: false,
				giveup: true,
				value: text,
				score: -penaltyScore,
				totalScore: client.game.score,
				chain: client.game.chain,
				nextQuestion: client.game.question,
				nextNextQuestion: client.game.nextQuestion
			}, true);
		}
		return;
	}

	// 숫자가 아닌 입력은 채팅으로 처리
	if (!/^\-?\d+$/.test(text)) {
		return client.chat(text);
	}

	var inputAnswer = parseInt(text, 10);

	if (inputAnswer === client.game.answer) {
		// 정답 처리
		score = Const.getCalcBattleScore(client.game.answer);
		client.game.chain++;
		client.game.score += score;

		if (my.opts.oneback) {
			// oneback 모드: 문제 시프트
			// 현재 표시 문제의 답이 다음 정답이 됨
			client.game.answer = client.game.pendingAnswer;
			// 다음 표시 문제가 현재 표시 문제가 됨
			client.game.displayQuestion = client.game.nextQuestion;
			client.game.pendingAnswer = client.game.nextAnswer;
			// 새 문제 생성 (다다음 문제)
			var newProblem = Const.generateCalcProblem(client.game.chain);
			client.game.nextQuestion = newProblem.question;
			client.game.nextAnswer = newProblem.answer;

			client.publish('turnEnd', {
				target: client.id,
				ok: true,
				value: text,
				score: score,
				totalScore: client.game.score,
				chain: client.game.chain,
				nextQuestion: client.game.displayQuestion,
				nextNextQuestion: client.game.nextQuestion
			}, true);
		} else {
			// 일반 모드: 다음 문제가 현재 문제가 됨
			client.game.question = client.game.nextQuestion;
			client.game.answer = client.game.nextAnswer;
			// 새 문제 생성 (다다음 문제)
			var newProblem = Const.generateCalcProblem(client.game.chain);
			client.game.nextQuestion = newProblem.question;
			client.game.nextAnswer = newProblem.answer;

			client.publish('turnEnd', {
				target: client.id,
				ok: true,
				value: text,
				score: score,
				totalScore: client.game.score,
				chain: client.game.chain,
				nextQuestion: client.game.question,
				nextNextQuestion: client.game.nextQuestion
			}, true);
		}

		// 봇이면 다음 문제 풀기
		if (client.robot) {
			exports.playRobot.call(my, client);
		}
	} else {
		// 오답 처리
		client.game.miss++;
		if (my.opts.one && client.game.miss >= 1) {
			client.game.out = true;
			client.publish('turnEnd', {
				target: client.id,
				ok: false,
				out: true,
				score: 0
			}, true);

			// 모든 플레이어가 아웃인지 확인
			traverse.call(my, function (o) {
				if (!o.game.out) allOut = false;
			});
			if (allOut) my.turnEnd();
			return;
		}
		client.send('turnEnd', { error: true });

		// 봇이면 재시도
		if (client.robot) {
			setTimeout(function () {
				exports.playRobot.call(my, client);
			}, 200);
		}
	}
};

exports.getScore = function (answer) {
	return Const.getCalcBattleScore(answer);
};

exports.playRobot = function (robot) {
	var my = this;
	var level, cpm, accuracy;
	var answer, response;
	var thinkTime, typeTime, totalDelay;

	if (my.game.late) return;
	if (robot.game.out) return;

	answer = robot.game.answer;
	if (!answer) return;

	level = robot.level;
	cpm = BOT_CPM[level];
	accuracy = BOT_ACCURACY[level];

	// 생각 시간 계산
	thinkTime = ROBOT_START_DELAY[level];
	thinkTime += 500 * Math.log10(answer + 1) * ROBOT_THINK_COEF[level];

	// 정답 또는 오답 결정
	if (Math.random() < accuracy) {
		response = String(answer);
	} else {
		response = Const.generateWrongAnswer(answer);
	}

	// 타이핑 시간 계산
	typeTime = (response.length * 60 * 1000) / cpm;
	typeTime += (Math.random() * 100 - 50);

	totalDelay = Math.max(500, thinkTime + typeTime);

	robot.game.typingTimer = setTimeout(function () {
		if (my.game.late) return;
		if (robot.game.out) return;

		my.submit(robot, response);
	}, totalDelay);
};
