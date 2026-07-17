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
var File = require('fs');
var DB;
var DIC;

var ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
var ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
var ROBOT_ACCURACY = [0.9, 0.95, 0.99, 1, 1]; // 레벨(0~4)별 정답 제출 확률

var PROBLEMS4 = []; // [{ clue: "마을", candidates: ["버스", "회관"] }, ...] (4글자 문제)
var PROBLEMS6 = []; // 6글자 문제 (clue 3글자 + candidate 3글자)

File.readFile(`${__dirname}/../../data/fourrelay.txt`, 'utf8', function (err, res) {
	if (err) return;
	var parsed = res.split(/\r?\n/).map(function (line) {
		var parts = line.split(' / ');
		if (parts.length !== 2) return null;
		var clue = parts[0].trim();
		var candidates = parts[1].trim().split(/\s+/).filter(function (w) { return w.length === clue.length; });
		if ((clue.length !== 2 && clue.length !== 3) || candidates.length === 0) return null;
		return { clue: clue, candidates: candidates };
	}).filter(function (p) { return p !== null; });
	PROBLEMS4 = parsed.filter(function (p) { return p.clue.length === 2; });
	PROBLEMS6 = parsed.filter(function (p) { return p.clue.length === 3; });
});

// 헬퍼 함수 - 플레이어 ID 추출 (봇 객체와 문자열 ID 모두 지원)
function getPlayerId(player) {
	return (typeof player === 'object' && player.id) ? player.id : player;
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function () {
	var my = this;
	var R = new Lizard.Tail();
	var target = my.game.coopTarget || my.round;

	// 문제 생성: 후보를 셔플한 뒤 앞에서부터 목표 문제수만큼 고른다(겹치지 않음).
	my.game.problems = Const.shuffle(my.opts.length6 ? PROBLEMS6 : PROBLEMS4).slice(0, target);

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
	if (my.game.round <= my.round) {
		my.resetChain();
		my.game.currentProblem = my.game.problems[0];
		my.byMaster('roundReady', {
			round: my.game.round,
			clue: my.game.currentProblem ? my.game.currentProblem.clue : ""
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
	var problem;

	if (!my.game.chain) return;
	problem = my.game.problems[my.game.chain.length];

	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.robotTimer);
	if (!problem) {
		my.roundEnd({ coopSuccess: true });
		return;
	}
	my.game.currentProblem = problem;
	// 기본 턴제 시간 계산: 라운드 남은 시간(턴이 진행될수록 감소)을 속도 단계로 변환하고,
	// 그 속도 단계로부터 실제 턴 제한시간을 도출한다(Classic/Calcrelay와 동일한 공식).
	my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.chain.length * 1500));
	speed = my.getTurnSpeed(my.opts.speed ? my.game.roundTime / 2 : my.game.roundTime);
	my.game.turnTime = 15000 - 1400 * speed;
	my.game.turnAt = (new Date()).getTime();
	my.game.late = false;
	my.game.loading = false;

	my.byMaster('turnStart', {
		turn: my.game.turn,
		speed: speed,
		clue: problem.clue,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		seq: force ? my.game.seq : undefined
	}, true);
	my.game.turnTimer = setTimeout(my.turnEnd, my.game.turnTime + 100);

	if (si = my.game.seq[my.game.turn]) if (si.robot) {
		my.readyRobot(si);
	}
};

exports.turnEnd = function () {
	var my = this;
	var target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
	var problem = my.game.currentProblem;

	if (my.game.loading) {
		clearTimeout(my.game.turnTimer);
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.robotTimer);
	if (!my.game.chain) return;
	if (my.game.late) return;
	my.game.late = true;

	// 코옵 릴레이: 시간 초과 = 즉시 전체 실패. 정답 표시는 후보 목록의 첫 번째 항목으로 고정한다.
	my.byMaster('turnEnd', {
		ok: false,
		target: target ? getPlayerId(target) : null,
		score: 0,
		answer: problem ? (problem.clue + problem.candidates[0]) : ""
	}, true);

	// 봇 꼽주기: 코옵은 전원이 같은 팀이므로, 실패 시 다른 봇들이 같은 팀 실패 메시지를 보낸다
	if (target && my.game.seq) {
		var targetId = getPlayerId(target);
		var bots = [];
		for (var si in my.game.seq) {
			var sp = (typeof my.game.seq[si] === 'string') ? DIC[my.game.seq[si]] : my.game.seq[si];
			if (sp && sp.robot && sp.id !== targetId) bots.push(sp);
		}
		for (var bi in bots) {
			(function (bot) {
				if (bot.adjustAnger) bot.adjustAnger(0.5);
				if (Math.random() < 0.5 && !bot.muteGame) {
					setTimeout(function () {
						var msgs = Const.ROBOT_TIMEOUT_MESSAGES_SAMETEAM;
						bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
					}, 500 + Math.random() * 1000);
				}
			})(bots[bi]);
		}
	}

	if (my.game._rrt) clearTimeout(my.game._rrt);
	my.game._rrt = setTimeout(function () {
		my.roundEnd({ coopSuccess: false });
	}, 2000);
};

exports.submit = function (client, text, data) {
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];
	var problem = my.game.currentProblem;
	var answer, full;

	if (!mgt) return;
	// 자기 차례가 아니면 채팅으로 위임
	if (getPlayerId(mgt) !== getPlayerId(client)) return client.chat(text);
	if (my.game.late) return;
	if (!problem) return;
	if (typeof text !== 'string') return client.chat(text);

	// 뒤쪽 절반(정답)만 입력하거나, 단서를 포함한 전체를 입력해도 인정한다.
	// 길이는 현재 문제의 clue 길이에서 유도한다(4글자 모드: 2/4, 6글자 모드: 3/6).
	var clueLen = problem.clue.length;

	if (text.length === clueLen) {
		answer = text;
		full = problem.clue + text;
	} else if (text.length === clueLen * 2) {
		// 앞쪽이 이번 문제의 단서와 다르면 채팅으로 위임
		if (text.slice(0, clueLen) !== problem.clue) return client.chat(text);
		answer = text.slice(clueLen);
		full = text;
	} else {
		return client.chat(text);
	}

	function accept() {
		var score, nextProblem;

		if (my.game.late) return;
		my.game.loading = false;
		my.game.late = true;
		clearTimeout(my.game.turnTimer);
		score = my.getScore(answer, tv - my.game.turnAt);
		my.logChainWord(full, client);
		client.game.score += score;
		nextProblem = my.game.problems[my.game.chain.length];

		client.publish('turnEnd', {
			ok: true,
			value: full,
			score: score,
			totalScore: client.game.score,
			coopTurn: my.game.chain.length,
			coopTarget: my.game.problems.length,
			nextClue: nextProblem ? nextProblem.clue : undefined
		}, true);

		if (my.game.chain.length >= my.game.problems.length) {
			clearTimeout(my.game.robotTimer);
			my.game._rrt = setTimeout(function () {
				my.roundEnd({ coopSuccess: true });
			}, 1500);
		} else {
			setTimeout(my.turnNext, my.game.turnTime / 6);
		}
	}
	function reject() {
		my.game.loading = false;
		// 오답은 항상 4글자(단서+입력)로 표기한다.
		client.publish('turnError', { code: 404, value: full }, true);
		if (my.opts.one) my.turnEnd();
	}

	// 정답 판정: (1) 명시된 정답 후보이거나, (2) DB에 등재된 실제 단어(KOR_GROUP 품사)
	if (problem.candidates.indexOf(answer) !== -1) {
		accept();
		return;
	}
	my.game.loading = true;
	DB.kkutu.ko.findOne(['_id', full], ['type', Const.KOR_GROUP]).on(function ($doc) {
		if (my.game.late) return;
		if (!my.game.seq || getPlayerId(my.game.seq[my.game.turn]) !== getPlayerId(client)) return;
		if ($doc) accept();
		else reject();
	});
};

exports.getScore = function (text, delay) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;

	if (isNaN(tr) || tr < 0) tr = 0;
	if (tr > 1) tr = 1;
	// 기본 100점, 선형보간 50~100%
	return Math.round(100 * (0.5 + 0.5 * tr));
};

exports.readyRobot = function (robot) {
	var my = this;
	var problem = my.game.currentProblem;
	var level = robot.level;
	var answer, delay;

	if (!problem) return;
	// 레벨별 확률에 실패하면 침묵한다(오답 생성 로직 없음).
	if (Math.random() >= ROBOT_ACCURACY[level]) return;

	answer = problem.candidates[Math.floor(Math.random() * problem.candidates.length)];
	delay = ROBOT_START_DELAY[level] + answer.length * ROBOT_TYPE_COEF[level] + Math.random() * 300;
	delay = Math.max(50, delay);

	my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, answer);
};
