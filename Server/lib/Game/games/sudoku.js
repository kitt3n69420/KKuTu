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
var DB;
var DIC;

var POINTS_PER_CELL = 10;
var WRONG_PENALTY = 1;
// 레벨별 봇이 숫자 하나를 채우는 간격(ms). 십자말풀이(crossword.js ROBOT_CW_INTERVAL)와 같은 값
var ROBOT_INTERVAL = [48000, 24000, 12000, 6000, 3000, 100];
// DB의 difficulty: 1 = 6x6(서브블록 가로3 x 세로2), 2 = 9x9(서브블록 3x3)
var SPECS = {
	1: { size: 6, subW: 3, subH: 2 },
	2: { size: 9, subW: 3, subH: 3 }
};

function shuffle(arr) {
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
	}
	return arr;
}
function range(n) {
	var a = [];
	for (var i = 0; i < n; i++) a.push(i);
	return a;
}
// 블록 단위 순열 -> 각 블록 안 줄 순열 순으로 줄 순서를 만든다
function buildLineOrder(size, groupSize) {
	var order = [];
	shuffle(range(size / groupSize)).forEach(function (g) {
		shuffle(range(groupSize)).forEach(function (k) { order.push(g * groupSize + k); });
	});
	return order;
}
function rotate90(grid, size) {
	var out = [];
	for (var r = 0; r < size; r++) {
		out.push([]);
		for (var c = 0; c < size; c++) out[r].push(grid[size - 1 - c][r]);
	}
	return out;
}

/**
 * DB의 스도쿠 문자열을 무작위로 섞어 라운드용 퍼즐로 변환한다.
 * 1) 서브블록 행/열 순열  2) 각 서브블록 줄(행/열) 순열  3) 회전  4) 좌우반전  5) 알파벳 -> 숫자 무작위 대응
 * @returns {{size:number, subW:number, subH:number, given:number[], answer:number[]}}
 *   given/answer는 size*size 1차원 배열. given은 주어진 칸만 숫자, 나머지는 0.
 */
exports.buildPuzzle = function (difficulty, str) {
	var spec = SPECS[difficulty];
	var size = spec.size, subW = spec.subW, subH = spec.subH;
	var grid = [], r, c, i;

	for (r = 0; r < size; r++) grid.push(str.substr(r * size, size).split(''));

	var rowOrder = buildLineOrder(size, subH);
	var colOrder = buildLineOrder(size, subW);
	grid = rowOrder.map(function (sr) {
		return colOrder.map(function (sc) { return grid[sr][sc]; });
	});

	var rot = Math.floor(Math.random() * 4);
	for (i = 0; i < rot; i++) grid = rotate90(grid, size);
	if (rot % 2) { var t = subW; subW = subH; subH = t; }
	if (Math.random() < 0.5) grid.forEach(function (row) { row.reverse(); });

	var digits = shuffle(range(size).map(function (k) { return k + 1; }));
	var given = [], answer = [];
	for (r = 0; r < size; r++) {
		for (c = 0; c < size; c++) {
			var ch = grid[r][c];
			var isGiven = ch >= 'A' && ch <= 'Z';
			var d = digits[ch.toLowerCase().charCodeAt(0) - 97];
			answer.push(d);
			given.push(isGiven ? d : 0);
		}
	}
	return { size: size, subW: subW, subH: subH, given: given, answer: answer };
};

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var difficulty = my.opts.dic ? 1 : 2;

	my.game.started = false;
	DB.kkutu_sudoku.find(['difficulty', difficulty]).on(function ($box) {
		var puzzles = [];
		var pool = shuffle($box.slice());
		var i;

		if (!pool.length) return;
		// 라운드 수가 퍼즐 수보다 많으면 한 바퀴 돈 뒤 다시 뽑는다 (셔플이 매번 달라 같은 퍼즐도 다르게 보인다)
		for (i = 0; i < my.round; i++) {
			if (i > 0 && i % pool.length === 0) shuffle(pool);
			puzzles.push(exports.buildPuzzle(difficulty, pool[i % pool.length].sudoku));
		}
		my.game.puzzles = puzzles;
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	});
	return R;
};
// 십자말풀이처럼 한 라운드에 퍼즐 전체(①②③…)를 동시에 열고, 플레이어가 판을 골라 푼다
exports.roundReady = function () {
	var my = this;

	if (my.game.started) return my.roundEnd();

	my.game.started = true;
	my.game.roundTime = my.time * 1000;
	my.game.late = true;
	my.game.boards = my.game.puzzles.map(function (p) {
		return { cells: p.given.slice(), owners: {} };
	});
	my.game.remain = my.game.puzzles.reduce(function (n, p) {
		return n + p.given.filter(function (v) { return !v; }).length;
	}, 0);
	my.byMaster('roundReady', {
		seq: my.game.seq
	}, true);
	my.game.turnTimer = setTimeout(my.turnStart, 2400);
};
exports.turnStart = function () {
	var my = this;

	my.game.late = false;
	my.game.roundAt = (new Date()).getTime();
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', {
		boards: getBoardsData(my)
	}, true);

	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			robot._sdTimer = null;
			robot._sdBoard = undefined;
			my.readyRobot(robot);
		});
	}
};
exports.turnEnd = function () {
	var my = this;

	if (my.game.late) return;
	my.game.late = true;
	clearTimeout(my.game.qTimer);
	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			clearTimeout(robot._sdTimer);
			robot._sdTimer = null;
		});
	}
	my.byMaster('turnEnd', { ok: false }, true);
	my.game._rrt = setTimeout(my.roundReady, 2500);
};
// 클라이언트에 보낼 보드 목록: 정답(answer)은 보내지 않는다
function getBoardsData(my) {
	return my.game.puzzles.map(function (p, i) {
		return {
			size: p.size,
			subW: p.subW,
			subH: p.subH,
			cells: my.game.boards[i].cells,
			owners: my.game.boards[i].owners
		};
	});
}
// 관전/난입 클라이언트에 보낼 현재 상태 (room.js export)
exports.getSpecState = function () {
	var my = this;

	if (!my.game.boards) return null;
	return {
		boards: getBoardsData(my),
		roundTime: (!my.game.late && my.game.roundAt)
			? Math.max(0, my.game.roundTime - ((new Date()).getTime() - my.game.roundAt))
			: undefined
	};
};
// data: [보드 번호, 칸 번호]
exports.submit = function (client, text, data) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var b, p, board, idx, value;

	if (!text) return;
	if (!play || my.game.late || !my.game.boards || !client.game) return client.robot ? undefined : client.chat(text);
	if (!Array.isArray(data) || data.length < 2) return;

	b = Number(data[0]);
	p = my.game.puzzles[b];
	if (!Number.isInteger(b) || !p) return;
	idx = Number(data[1]);
	if (!Number.isInteger(idx) || idx < 0 || idx >= p.size * p.size) return;
	text = String(text).trim();
	if (!/^[1-9]$/.test(text)) return;
	value = Number(text);
	if (value > p.size) return;
	board = my.game.boards[b];
	// 이미 채워졌거나 처음부터 주어진 칸
	if (board.cells[idx]) return;

	if (p.answer[idx] === value) {
		board.cells[idx] = value;
		board.owners[idx] = client.id;
		client.game.score += POINTS_PER_CELL;
		client.publish('turnEnd', {
			target: client.id,
			pos: [b, idx],
			value: value,
			score: POINTS_PER_CELL,
			totalScore: client.game.score
		}, true);
		if (--my.game.remain < 1) my.turnEnd();
	} else {
		client.game.score -= WRONG_PENALTY;
		client.publish('turnEnd', {
			target: client.id,
			pos: [b, idx],
			wrong: true,
			score: -WRONG_PENALTY,
			totalScore: client.game.score
		}, true);
	}
};
exports.getScore = function () {
	return 0;
};

function hasBlank(my, b) {
	return my.game.boards[b].cells.some(function (v) { return !v; });
}
// 봇이 풀 판을 정한다: 지금 하던 판에 빈 칸이 남아 있으면 계속, 다 풀었으면 빈 칸이 남은 판 중 무작위로 새로 고른다.
// 다른 봇이 잡고 있지 않은 판을 우선한다.
function pickRobotBoard(my, robot) {
	var open = [], free;

	if (robot._sdBoard !== undefined && robot._sdBoard !== -1 && hasBlank(my, robot._sdBoard)) return robot._sdBoard;
	my.game.puzzles.forEach(function (p, b) { if (hasBlank(my, b)) open.push(b); });
	if (!open.length) return -1;
	free = open.filter(function (b) {
		return !my.game.robots.some(function (r) { return r !== robot && r._sdBoard === b; });
	});
	if (free.length) open = free;
	return open[Math.floor(Math.random() * open.length)];
}
// 정한 판의 빈 칸 중, 가로줄/세로줄/서브블록에 이미 들어간 숫자를 제외한 후보 숫자가 가장 적은 칸을 고른다 (동률이면 무작위)
function pickRobotMove(my, robot) {
	var b = pickRobotBoard(my, robot);
	var p, cells, size, best = [], bestN = Infinity;
	var idx, r, c, r0, c0, k, x, y, used, n, digit;

	robot._sdBoard = b;
	if (b === -1) return null;
	p = my.game.puzzles[b];
	cells = my.game.boards[b].cells;
	size = p.size;
	for (idx = 0; idx < size * size; idx++) {
		if (cells[idx]) continue;
		r = Math.floor(idx / size);
		c = idx % size;
		r0 = r - r % p.subH;
		c0 = c - c % p.subW;
		used = {};
		for (k = 0; k < size; k++) {
			used[cells[r * size + k]] = true;
			used[cells[k * size + c]] = true;
		}
		for (y = 0; y < p.subH; y++) {
			for (x = 0; x < p.subW; x++) used[cells[(r0 + y) * size + c0 + x]] = true;
		}
		n = 0;
		for (digit = 1; digit <= size; digit++) if (!used[digit]) n++;
		if (n < bestN) { bestN = n; best = []; }
		if (n === bestN) best.push(idx);
	}
	idx = best[Math.floor(Math.random() * best.length)];
	return { b: b, idx: idx, value: p.answer[idx] };
}
exports.readyRobot = function (robot) {
	var my = this;
	if (robot.level === -1) return;
	if (my.game.late || !my.gaming) return;

	// 십자말풀이와 동일: level이 0이면 2로 취급
	var level = robot.level || 2;
	var interval = ROBOT_INTERVAL[level];
	interval += Math.round((Math.random() * 0.4 - 0.2) * interval);

	robot._sdTimer = setTimeout(function () {
		var move;

		if (my.game.late || !my.gaming) return;
		move = pickRobotMove(my, robot);
		if (!move) return;
		my.turnRobot(robot, String(move.value), [move.b, move.idx]);
		my.readyRobot(robot);
	}, interval);
};
