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

var Lizard = require('../../sub/lizard');
var JLog = require('../../sub/jjlog');
var WordIndex = require('./center-word-index');
var DB;
var DIC;

var BOARD_W = 16;
var BOARD_H = 16;
var ODD_SIZES = [7, 9, 11, 13, 15];
var ROBOT_CATCH_RATE = [0.3, 0.6, 0.8, 0.9, 0.99];
var ROBOT_TYPE_COEF = [2000, 1200, 800, 300, 100];

// 서버 기동 시 딱 한 번만 계산되어 프로세스 수명 내내 고정되는 상위 256글자 풀.
// 단어 DB는 서버 실행 중 바뀌지 않으므로 이후 재계산은 절대 하지 않는다 — 매 라운드는
// 이 배열을 셔플만 해서 보드에 배치한다.
var TOP_CHARS = null;

// 글자별 (startall_0 - startshort_0) = 그 글자로 시작하는 장문(9글자+) 단어 수를 기준으로
// 내림차순 정렬해 상위 256글자를 고른다. 이 랭킹은 "보드에 어떤 글자가 올라가는지"만
// 결정할 뿐, 일단 보드에 올라온 글자에 대해서는 길이 무관 모든 사전 단어가 정답으로 유효하다.
function computeTopChars() {
	var statsKo = (DB.statsData && DB.statsData.ko) || {};
	var rows = Object.keys(statsKo).map(function (ch) {
		var row = statsKo[ch];
		var all = row.startall_0 || 0;
		var short = row.startshort_0 || 0;
		return { ch: ch, diff: all - short, all: all };
	});

	rows.sort(function (a, b) {
		if (b.diff !== a.diff) return b.diff - a.diff;
		if (b.all !== a.all) return b.all - a.all;
		return a.ch < b.ch ? -1 : (a.ch > b.ch ? 1 : 0);
	});

	if (rows.length < 256) {
		JLog.warn('[CENTER] Fewer than 256 qualifying characters (' + rows.length + '); using all of them.');
	}

	return rows.slice(0, 256).map(function (r) { return r.ch; });
}

// DB.statsData.ko는 kkutu.js가 서버 기동 시 비동기로 채우므로, 이 모듈의 init() 시점엔
// 아직 준비되지 않았을 수 있다. DB.statsReady.ko 플래그를 짧게 폴링해 기다린 뒤 딱 한 번만
// TOP_CHARS를 계산하고, 곧바로 봇용 단어 인덱스도 함께 빌드한다.
function initTopChars() {
	(function poll() {
		if (DB.statsReady && DB.statsReady.ko) {
			TOP_CHARS = computeTopChars();
			JLog.log('[CENTER] Top 256 characters fixed (' + TOP_CHARS.length + ')');
			WordIndex.build(DB, TOP_CHARS);
		} else {
			setTimeout(poll, 200);
		}
	})();
}

function shuffle(arr) {
	var a = arr.slice();
	for (var i = a.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var t = a[i]; a[i] = a[j]; a[j] = t;
	}
	return a;
}

function buildBoard() {
	return shuffle(TOP_CHARS);
}

// 가로/세로 각각 홀수값을 독립적으로 균등 추첨한 뒤, 그 크기가 16x16 안에 들어가는
// 좌상단 좌표를 유효 범위 내에서 균등 랜덤으로 고른다.
function pickRectangle() {
	var w = ODD_SIZES[Math.floor(Math.random() * ODD_SIZES.length)];
	var h = ODD_SIZES[Math.floor(Math.random() * ODD_SIZES.length)];
	var left = Math.floor(Math.random() * (BOARD_W - w + 1));
	var top = Math.floor(Math.random() * (BOARD_H - h + 1));
	var centerRow = top + (h - 1) / 2;
	var centerCol = left + (w - 1) / 2;

	return {
		top: top, left: left, w: w, h: h,
		centerRow: centerRow, centerCol: centerCol,
		centerIndex: centerRow * BOARD_W + centerCol
	};
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
	initTopChars();
};
exports.getTitle = function () {
	var R = new Lizard.Tail();

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳");
	}, 300);
	return R;
};
exports.roundReady = function () {
	var my = this;

	clearTimeout(my.game._rrt);
	clearTimeout(my.game.qTimer);
	my.game.winner = [];
	my.game.winnerWords = {};
	my.game.primary = 0;
	my.game.round++;
	my.game.roundTime = my.time * 1000;

	if (my.game.round <= my.round) {
		if (!TOP_CHARS) {
			// 극히 드문 부팅 타이밍 보호: 아직 통계 계산이 안 끝났으면 잠시 후 재시도.
			my.game._rrt = setTimeout(my.roundReady, 300);
			return;
		}

		my.game.board = buildBoard();
		my.game.rect = pickRectangle();
		my.game.centerChar = my.game.board[my.game.rect.centerIndex];
		my.game.late = true;

		my.byMaster('roundReady', {
			round: my.game.round,
			board: my.game.board
		}, true);
		setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};
exports.turnStart = function () {
	var my = this;
	var i;

	if (!my.game.board) return;

	my.game.late = false;
	my.game.roundAt = (new Date()).getTime();
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);

	my.byMaster('turnStart', {
		roundTime: my.game.roundTime,
		rect: my.game.rect
	}, true);

	for (i in my.game.robots) {
		my.readyRobot(my.game.robots[i]);
	}
};
exports.turnEnd = function () {
	var my = this;

	if (my.game.late) return;
	my.game.late = true;
	clearTimeout(my.game.qTimer);

	if (my.game.board) {
		my.byMaster('turnEnd', {
			centerIndex: my.game.rect.centerIndex,
			centerChar: my.game.centerChar
		});
		if (typeof my.sendQuizRoundEnd === 'function') {
			var _winners = (my.game.winner || []).slice();
			var _missed = (my.game.seq || []).filter(function (id) {
				return _winners.indexOf(id) === -1;
			});
			my.sendQuizRoundEnd(my.game.centerChar, _winners, _missed, [], my.game.round, my.game.winnerWords);
		}
	}

	clearTimeout(my.game._rrt);
	my.game._rrt = setTimeout(my.roundReady, 2500);
};
exports.submit = function (client, text) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var alreadyWon = my.game.winner ? my.game.winner.indexOf(client.id) !== -1 : true;

	if (my.game.late || !my.game.board) return;
	if (!text) return;
	text = text.trim(); // 내부 공백은 유지 — 공백 포함 관용구도 유효 단어일 수 있음

	// 이미 이번 라운드에 정답 처리됐거나, 참가자가 아니거나, 중심 글자로 시작하지 않으면
	// 채점하지 않고 그냥 채팅으로 흘려보낸다.
	if (!play || alreadyWon || text.charAt(0) !== my.game.centerChar) {
		client.chat(text);
		return;
	}

	if (client.data.centerBusy) return;
	client.data.centerBusy = true;

	DB.kkutu[my.rule.lang].findOne(['_id', text]).limit(['_id', true]).on(function ($doc) {
		client.data.centerBusy = false;
		if (my.game.late || !my.game.board) return;
		if (!$doc) {
			client.send('turnEnd', { error: true });
			return;
		}
		if (my.game.winner.indexOf(client.id) !== -1) return;

		var now = (new Date()).getTime();
		var t = now - my.game.roundAt;
		// 자퀴처럼: 이번 라운드 첫 정답이면, 남은 시간이 10초보다 많이 남았을 때 10초로 줄인다.
		if (my.game.primary === 0 && my.game.roundTime - t > 10000) {
			clearTimeout(my.game.qTimer);
			my.game.qTimer = setTimeout(my.turnEnd, 10000);
		}
		var score = my.getScore(text, t);
		if (typeof score !== 'number' || isNaN(score)) score = 0;

		my.game.primary++;
		my.game.winner.push(client.id);
		my.game.winnerWords[client.id] = text;
		if (!client.game) client.game = { score: 0, bonus: 0, team: 0 };
		if (typeof client.game.score !== 'number' || isNaN(client.game.score)) client.game.score = 0;
		client.game.score += score;

		client.publish('turnEnd', {
			target: client.id,
			ok: true,
			value: text,
			score: score,
			totalScore: client.game.score
		}, true);
		client.invokeWordPiece(text, 0.9);

		if (play) if (my.game.winner.length >= my.game.seq.length) {
			my.turnEnd();
		}
	});
};
exports.getScore = function (text, delay) {
	var my = this;
	var hum = (typeof my.game.hum === 'number') ? my.game.hum : 1;
	var primary = (typeof my.game.primary === 'number') ? my.game.primary : 0;
	var roundTime = (typeof my.game.roundTime === 'number' && my.game.roundTime > 0) ? my.game.roundTime : 1;

	var rank = Math.max(1, hum - primary + 3);
	var tr = 1 - delay / roundTime;
	if (isNaN(tr) || tr < 0) tr = 0;
	if (tr > 1) tr = 1;

	var wordLen = text ? text.length : 0;
	var score = Math.round(5 * Math.pow(rank, 1.4) * (0.5 + 0.5 * tr) * (10 + wordLen) / 5);

	return isNaN(score) ? 0 : score;
};
exports.readyRobot = function (robot) {
	if (robot.level === -1) return;
	var my = this;
	var level = robot.level;

	if (!my.game.board || !my.game.centerChar) return;
	clearTimeout(robot._timer);
	robot._delay = 99999999;

	for (var i = 0; i < 2; i++) {
		if (Math.random() < ROBOT_CATCH_RATE[level]) {
			var word = WordIndex.pick(my.game.centerChar);
			if (!word) continue;
			var randomDelay = Math.floor(Math.random() * 90) + 10;
			var delay = my.game.roundTime / 3 * i + word.length * ROBOT_TYPE_COEF[level] + randomDelay;
			robot._timer = setTimeout(my.turnRobot, delay, robot, word);
			robot._delay = delay;
			break;
		}
	}
};
