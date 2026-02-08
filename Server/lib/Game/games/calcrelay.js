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
const ROBOT_THINK_COEF = [10, 5, 2, 1, 0];
const ROBOT_ACCURACY_COEF = [0.8, 1, 1.5, 2, 1];

// Helper function to get player ID (supports both robot objects and player ID strings)
function getPlayerId(player) {
	return (typeof player === 'object' && player.id) ? player.id : player;
}

// 문제 생성 함수 - const.js의 헬퍼 함수 사용
function generateProblem(chainLength) {
	return Const.generateCalcProblem(chainLength);
}

// 봇 오답 생성 함수 - const.js의 헬퍼 함수 사용
function generateWrongAnswer(correct) {
	return Const.generateWrongAnswer(correct);
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function () {
	var R = new Lizard.Tail();

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};

exports.roundReady = function () {
	var my = this;

	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	my.resetChain();
	if (my.game.round <= my.round) {
		var problem = generateProblem(0);
		my.game.question = problem.question;
		my.game.answer = problem.answer;
		my.byMaster('roundReady', {
			round: my.game.round,
			question: my.game.question
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
		question: my.game.question,
		seq: force ? my.game.seq : undefined
	}, true);
	// 서바이벌 모드: 라운드 시간 체크 제거 (턴 시간만 사용)
	var timeout = my.opts.survival
		? my.game.turnTime + 100
		: Math.min(my.game.roundTime, my.game.turnTime + 100);
	my.game.turnTimer = setTimeout(my.turnEnd, timeout);
	if (si = my.game.seq[my.game.turn]) if (si.robot) {
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
			answer: my.game.answer,
			survival: true,
			ko: true,
			koReason: 'timeout'
		}, true);

		if (status.gameOver) {
			clearTimeout(my.game.robotTimer);
			my.game._rrt = setTimeout(function() {
				my.roundEnd();
			}, 2000);
			return;
		}

		clearTimeout(my.game.robotTimer);
		my.game._rrt = setTimeout(function() {
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
	my.byMaster('turnEnd', {
		ok: false,
		target: target ? target.id : null,
		score: score,
		answer: my.game.answer
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
	clearTimeout(my.game.robotTimer);
};

exports.submit = function (client, text, data) {
	var score, t;
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];

	if (!mgt) return;
	// Turn check: Only the current turn owner can submit
	if (getPlayerId(mgt) !== getPlayerId(client)) return client.chat(text);
	if (my.game.late) return;

	// 숫자만 입력 확인 - 숫자가 아니면 채팅으로 처리
	if (!/^\-?\d+$/.test(text)) {
		return client.chat(text);
	}

	var inputAnswer = parseInt(text, 10);

	if (inputAnswer === my.game.answer) {
		// 정답 처리
		my.game.loading = false;
		my.game.late = true;
		clearTimeout(my.game.turnTimer);
		t = tv - my.game.turnAt;

		score = my.getScore(my.game.answer, t);
		my.logChainWord(inputAnswer, client);
		my.game.roundTime -= t;

		// 새 문제 생성
		var problem = generateProblem(my.game.chain.length);
		my.game.question = problem.question;
		my.game.answer = problem.answer;

		// ========== 서바이벌 모드: 득점 = 다음 사람 데미지 ==========
		if (my.opts.survival) {
			var damage = score;
			var survivalDamageInfo = Const.applySurvivalDamage(my, DIC, damage, my.game.turn);
			var status = Const.checkSurvivalStatus(my, DIC);

			client.publish('turnEnd', {
				ok: true,
				value: text,
				score: score,
				totalScore: client.game.score,
				nextQuestion: my.game.question,
				survival: true,
				survivalDamage: survivalDamageInfo,
				attackerHP: client.game.score
			}, true);

			if (status.gameOver) {
				clearTimeout(my.game.turnTimer);
				clearTimeout(my.game.robotTimer);
				my.game._rrt = setTimeout(function() {
					my.roundEnd();
				}, 2000);
			} else {
				clearTimeout(my.game.turnTimer);
				clearTimeout(my.game.robotTimer);
				my.game._rrt = setTimeout(function() {
					my.turnNext();
				}, my.game.turnTime / 6);
			}
			return;
		}
		// ========== 서바이벌 모드 끝 ==========

		client.game.score += score;

		client.publish('turnEnd', {
			ok: true,
			value: text,
			score: score,
			totalScore: client.game.score,
			nextQuestion: my.game.question
		}, true);

		setTimeout(my.turnNext, my.game.turnTime / 6);
	} else {
		// 오답 처리
		client.publish('turnError', { code: 404, value: text }, true);
		if (my.opts.one) {
			my.turnEnd();
		} else if (client.robot && client.data && client.data.lastDelay) {
			// 봇인 경우 재시도 (원래 딜레이의 0.5배 후)
			var retryDelay = Math.max(50, client.data.lastDelay * 0.5);
			my.game.robotTimer = setTimeout(function () {
				my.readyRobot(client);
			}, retryDelay);
		}
	}
};

exports.getScore = function (answer, delay) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score = Const.getCalcScore(answer, tr);
	return Math.round(score);
};

exports.readyRobot = function (robot) {
	var my = this;
	var level = robot.level;
	var delay = ROBOT_START_DELAY[level];
	var answer = my.game.answer;

	// 생각 시간 계산: 500 * log10(정답+1) * ROBOT_THINK_COEF
	delay += 500 * Math.log10(answer + 1) * ROBOT_THINK_COEF[level];

	// 정답률 계산: 10 / (log10(정답) + 10) * ROBOT_ACCURACY_COEF, clamped to [0, 1]
	// 레벨 4는 항상 정답률 1
	var accuracy;
	if (level === 4) {
		accuracy = 1;
	} else {
		var baseAccuracy = 10 / (Math.log10(answer) + 10);
		accuracy = Math.max(0, Math.min(1, baseAccuracy * ROBOT_ACCURACY_COEF[level]));
	}

	var response;
	if (Math.random() < accuracy) {
		response = String(answer);
	} else {
		response = generateWrongAnswer(answer);
	}

	// 타이핑 시간 추가
	delay += response.length * ROBOT_TYPE_COEF[level];

	// 최소 50ms 지연 시간 보장
	delay = Math.max(50, delay);

	// 딜레이 저장 (재시도 시 사용)
	robot.data.lastDelay = delay;

	my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, response);
};
