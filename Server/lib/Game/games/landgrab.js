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
var ChosungIndex = require('./landgrab-chosung');
var DB;
var DIC;

var BOARD_W = 12;
var BOARD_H = 12;
var TOTAL_CELLS = BOARD_W * BOARD_H;
var POINTS_PER_CELL = 4;

// 레벨별 분당 타수(레벨 0 = 40타, 레벨 1당 2배)와 단어 사이 대기시간(레벨 0 = 8초, 레벨 1당 절반)
var ROBOT_TYPE_CPM = [40, 80, 160, 320, 640];
var ROBOT_INTER_WORD_DELAY = [8000, 4000, 2000, 1000, 500];
// 레벨별 최대 글자수: 0~1레벨 2글자, 2~3레벨 3글자, 4레벨 4글자
var ROBOT_MAX_LEN = [2, 2, 3, 3, 4];
// no2 옵션(2글자 이하 금지)에서는 0~1레벨도 3글자부터 시작
var ROBOT_MAX_LEN_NO2 = [3, 3, 3, 3, 4];

// 초성 그룹별 가중치 (그룹 점유율 ÷ 그룹 내 글자 수)
var CHOSUNG_WEIGHTS = (function () {
	var GROUP1 = ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㄱ', 'ㅅ', 'ㅈ', 'ㅎ']; // 그룹 점유율 17/25
	var GROUP2 = ['ㅂ', 'ㄷ', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ'];             // 그룹 점유율 7/25
	var GROUP3 = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'];                   // 그룹 점유율 1/25
	var list = [];
	GROUP1.forEach(function (c) { list.push({ ch: c, w: (17 / 25) / GROUP1.length }); });
	GROUP2.forEach(function (c) { list.push({ ch: c, w: (7 / 25) / GROUP2.length }); });
	GROUP3.forEach(function (c) { list.push({ ch: c, w: (1 / 25) / GROUP3.length }); });
	return list;
})();

function pickChosung() {
	var r = Math.random(), acc = 0;
	for (var i = 0; i < CHOSUNG_WEIGHTS.length; i++) {
		acc += CHOSUNG_WEIGHTS[i].w;
		if (r < acc) return CHOSUNG_WEIGHTS[i].ch;
	}
	return CHOSUNG_WEIGHTS[CHOSUNG_WEIGHTS.length - 1].ch;
}

function buildBoard() {
	var board = [];
	for (var i = 0; i < TOTAL_CELLS; i++) {
		board.push({ chosung: pickChosung(), owner: null, isHome: false });
	}
	return board;
}

// 12x12 테두리에서 한 칸 안쪽(10x10)의 둘레 — 36칸
function buildPerimeter() {
	var p = [];
	var r, c;
	for (c = 1; c <= 10; c++) p.push(1 * BOARD_W + c);        // 윗변
	for (r = 2; r <= 10; r++) p.push(r * BOARD_W + 10);       // 오른변
	for (c = 9; c >= 1; c--) p.push(10 * BOARD_W + c);        // 아랫변
	for (r = 9; r >= 2; r--) p.push(r * BOARD_W + 1);         // 왼변
	return p; // length 36
}

function assignStartCells(board, playerIds) {
	var perimeter = buildPerimeter();
	var n = playerIds.length;
	var offset = Math.floor(Math.random() * perimeter.length);

	for (var k = 0; k < n; k++) {
		var slot = Math.floor(k * perimeter.length / n);
		var idx = perimeter[(slot + offset) % perimeter.length];
		board[idx].owner = playerIds[k];
		board[idx].isHome = true;
	}
}

function wordToChosung(text) {
	var seq = [];
	for (var i = 0; i < text.length; i++) {
		var code = text.charCodeAt(i) - 0xAC00;
		if (code < 0 || code > 11171) return null;
		seq.push(Const.INIT_SOUNDS[Math.floor(code / 588)]);
	}
	return seq;
}

// 선택 칸(sIdx)을 포함하는 가로/세로 배치 후보를 모두 찾는다.
// 각 후보에 다른 플레이어의 시작칸이 포함되면 그 후보 자체를 무효 처리한다.
function findCandidates(board, sIdx, chosungSeq, clientId) {
	var L = chosungSeq.length;
	var sRow = Math.floor(sIdx / BOARD_W), sCol = sIdx % BOARD_W;
	var horiz = [], vert = [];

	function blockedByForeignHome(indices) {
		for (var k = 0; k < indices.length; k++) {
			var cell = board[indices[k]];
			if (cell.isHome && cell.owner !== clientId) return true;
		}
		return false;
	}

	for (var o = 0; o < L; o++) {
		// 가로: 선택 칸이 span 내 offset 위치에 오도록
		var startCol = sCol - o, endCol = startCol + L - 1;
		if (startCol >= 0 && endCol <= BOARD_W - 1) {
			var okH = true, idxH = [];
			for (var k = 0; k < L; k++) {
				var i = sRow * BOARD_W + startCol + k;
				idxH.push(i);
				if (board[i].chosung !== chosungSeq[k]) { okH = false; break; }
			}
			if (okH && !blockedByForeignHome(idxH)) {
				horiz.push({ dir: 'h', row: sRow, start: startCol, end: endCol, offset: o, len: L, cells: idxH });
			}
		}
		// 세로
		var startRow = sRow - o, endRow = startRow + L - 1;
		if (startRow >= 0 && endRow <= BOARD_H - 1) {
			var okV = true, idxV = [];
			for (var k2 = 0; k2 < L; k2++) {
				var i2 = (startRow + k2) * BOARD_W + sCol;
				idxV.push(i2);
				if (board[i2].chosung !== chosungSeq[k2]) { okV = false; break; }
			}
			if (okV && !blockedByForeignHome(idxV)) {
				vert.push({ dir: 'v', col: sCol, start: startRow, end: endRow, offset: o, len: L, cells: idxV });
			}
		}
	}
	return { horiz: horiz, vert: vert };
}

// 우선순위: 가로 우선 -> 중앙 우선(선택 칸이 span 중앙에 가까울수록) -> 왼쪽/위 우선(start가 작을수록)
function rankCandidates(cands) {
	function centerKey(c) { return Math.abs(2 * c.offset - (c.len - 1)); }
	function sortTier(arr) {
		arr.sort(function (a, b) {
			var d = centerKey(a) - centerKey(b);
			if (d !== 0) return d;
			return a.start - b.start;
		});
		return arr;
	}
	return sortTier(cands.horiz).concat(sortTier(cands.vert));
}

function traverse(my, func) {
	var i, o, item;

	for (i in my.game.seq) {
		item = my.game.seq[i];
		if (typeof item === 'string') {
			if (!(o = DIC[item])) continue;
		} else {
			o = item;
		}
		if (!o.game) continue;
		func(o);
	}
}

function buildPlayerMap(my) {
	var map = {};
	traverse(my, function (o) { map[o.id] = o; });
	return map;
}
function getTeam(o) {
	if (!o) return 0;
	return o.robot ? ((o.game && o.game.team) || 0) : (o.team || 0);
}
// ownerId가 robotId 자신이거나, 같은 팀 소속이면 "우호 칸"으로 취급한다.
function isFriendlyOwner(ownerId, robotId, robotTeam, playerMap) {
	if (!ownerId) return false;
	if (ownerId === robotId) return true;
	if (!robotTeam) return false;
	return getTeam(playerMap[ownerId]) === robotTeam;
}
// 빈 칸이거나, 상대의 기본 칸이 아닌 상대(비우호) 칸이면 "차지할 가치가 있는 칸"으로 취급한다.
function isCapturable(cell, robotId, robotTeam, playerMap) {
	if (!cell.owner) return true;
	if (cell.isHome) return false;
	return !isFriendlyOwner(cell.owner, robotId, robotTeam, playerMap);
}

// 봇 소유 칸 중, 상하좌우 이웃에 차지할 가치가 있는 칸(빈 칸/상대의 비기본 칸)이 붙어있는 칸만 추린다.
function getFrontierCells(board, robotId, robotTeam, playerMap) {
	var result = [];
	for (var i = 0; i < TOTAL_CELLS; i++) {
		if (board[i].owner !== robotId) continue;
		var row = Math.floor(i / BOARD_W), col = i % BOARD_W;
		var neighbors = [];
		if (row > 0) neighbors.push(i - BOARD_W);
		if (row < BOARD_H - 1) neighbors.push(i + BOARD_W);
		if (col > 0) neighbors.push(i - 1);
		if (col < BOARD_W - 1) neighbors.push(i + 1);
		for (var k = 0; k < neighbors.length; k++) {
			if (isCapturable(board[neighbors[k]], robotId, robotTeam, playerMap)) {
				result.push(i);
				break;
			}
		}
	}
	return result;
}

// sIdx를 지나는 가로/세로 배치 후보(길이 minLen~maxLen)를 모두 훑어, 초성 인덱스에 실제 존재하는
// 단어가 있는 후보만 모아서 반환한다. (findCandidates/rankCandidates는 "입력받은 단어"가 있다는
// 전제로 배치를 찾지만, 봇은 반대로 "배치 → 그 초성에 맞는 단어가 있는가"를 봐야 하므로 별도 구현)
function generateMoves(board, sIdx, minLen, maxLen, robotId, robotTeam, playerMap, usedWords) {
	var sRow = Math.floor(sIdx / BOARD_W), sCol = sIdx % BOARD_W;
	var moves = [];

	// 실제 엔진(findCandidates)과 동일하게, 남의 기본 칸을 지나는 배치는 무효 처리한다.
	function blockedByForeignHome(cells) {
		for (var k = 0; k < cells.length; k++) {
			var cell = board[cells[k]];
			if (cell.isHome && cell.owner !== robotId) return true;
		}
		return false;
	}
	// 같은 팀 칸은 "이미 내 땅"으로 보므로, 팀원 칸을 빼앗는 배치는 만들지 않는다.
	function blockedByTeammateCell(cells) {
		for (var k = 0; k < cells.length; k++) {
			var owner = board[cells[k]].owner;
			if (owner && owner !== robotId && isFriendlyOwner(owner, robotId, robotTeam, playerMap)) return true;
		}
		return false;
	}
	function tryCells(cells) {
		if (blockedByForeignHome(cells) || blockedByTeammateCell(cells)) return;

		var key = '';
		for (var k = 0; k < cells.length; k++) key += board[cells[k]].chosung;

		var candidates = ChosungIndex.get(key);
		if (!candidates.length) return;

		var word = null;
		for (var i = 0; i < candidates.length; i++) {
			if (!usedWords[candidates[i]._id]) { word = candidates[i]._id; break; }
		}
		if (!word) return;

		// 팀원 칸은 이미 걸러졌으므로, 여기서 owner !== robotId는 곧 "새로 얻는 칸" 수와 같다.
		var newCount = 0;
		for (var j = 0; j < cells.length; j++) {
			if (board[cells[j]].owner !== robotId) newCount++;
		}
		if (newCount === 0) return;

		moves.push({ sIdx: sIdx, word: word, newCount: newCount, len: cells.length });
	}

	for (var L = minLen; L <= maxLen; L++) {
		for (var o = 0; o < L; o++) {
			var startCol = sCol - o, endCol = startCol + L - 1;
			if (startCol >= 0 && endCol <= BOARD_W - 1) {
				var idxH = [];
				for (var kh = 0; kh < L; kh++) idxH.push(sRow * BOARD_W + startCol + kh);
				tryCells(idxH);
			}
			var startRow = sRow - o, endRow = startRow + L - 1;
			if (startRow >= 0 && endRow <= BOARD_H - 1) {
				var idxV = [];
				for (var kv = 0; kv < L; kv++) idxV.push((startRow + kv) * BOARD_W + sCol);
				tryCells(idxV);
			}
		}
	}
	return moves;
}

// 프런티어 칸들을 모두 훑어, 가장 많은 칸을 새로 얻는 배치를 고른다.
// (newCount가 같은 후보가 여러 개면, 맨 처음 찾은 것으로 고정하지 않고 그중에서 무작위로 고른다
//  — 그러지 않으면 항상 인덱스가 작은 칸(보드 위쪽)이 먼저 채택되어 그쪽으로만 쏠리게 된다.)
function decideMove(my, robot) {
	var board = my.game.board;
	var robotId = robot.id;
	var robotTeam = (robot.game && robot.game.team) || 0;
	var playerMap = buildPlayerMap(my);
	var level = robot.level;
	var maxLen = (my.opts.no2 ? ROBOT_MAX_LEN_NO2 : ROBOT_MAX_LEN)[level];
	var minLen = my.opts.no2 ? 3 : 2;
	var usedWords = (my.game.usedWords && my.game.usedWords[robotId]) || {};

	var frontier = getFrontierCells(board, robotId, robotTeam, playerMap);
	var bestScore = -1;
	var bestMoves = [];

	for (var i = 0; i < frontier.length; i++) {
		var moves = generateMoves(board, frontier[i], minLen, maxLen, robotId, robotTeam, playerMap, usedWords);
		for (var j = 0; j < moves.length; j++) {
			var m = moves[j];
			if (m.newCount > bestScore) {
				bestScore = m.newCount;
				bestMoves = [m];
			} else if (m.newCount === bestScore) {
				bestMoves.push(m);
			}
		}
	}
	if (!bestMoves.length) return null;
	return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
	ChosungIndex.build(DB);
};
exports.getTitle = function () {
	var R = new Lizard.Tail();

	this.game.round = 0;
	setTimeout(function () { R.go("①②③④⑤⑥⑦⑧⑨⑩"); }, 300);
	return R;
};
exports.roundReady = function () {
	var my = this;

	clearTimeout(my.game.qTimer);
	clearTimeout(my.game._rrt);
	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;

	if (my.game.round <= my.round) {
		var playerIds = [];
		traverse(my, function (o) { playerIds.push(o.id); });

		my.game.board = buildBoard();
		my.game.usedWords = {};
		if (playerIds.length > 0) assignStartCells(my.game.board, playerIds);

		my.byMaster('roundReady', {
			round: my.game.round,
			board: my.game.board.map(function (c) { return c.chosung; }),
			owners: my.game.board.map(function (c) { return c.owner; }),
			homes: my.game.board.map(function (c) { return c.isHome; })
		}, true);
		my.game.turnTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};
exports.turnStart = function () {
	var my = this;

	my.game.late = false;
	my.game.roundAt = (new Date()).getTime();
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);

	my.byMaster('turnStart', {
		roundTime: my.game.roundTime
	}, true);

	// 이 게임은 턴제가 아니라 라운드 내내 모두가 동시에 제출하는 방식이라,
	// 다른 게임들처럼 "현재 차례"에만 readyRobot을 부르는 게 아니라 봇 전원을 한 번에 깨운다.
	traverse(my, function (o) {
		if (o.robot) my.readyRobot(o);
	});
};
exports.turnEnd = function () {
	var my = this;
	var scores = {};
	var cellCounts = {};
	var teamCells = {};
	var teamMembers = {};
	var i;

	my.game.late = true;
	clearTimeout(my.game.qTimer);

	// 라운드 종료 시, 각 봇이 자기 타이머로 돌리고 있던 다음 제출 예약을 멈춘다.
	traverse(my, function (o) {
		if (o.robot && o.data && o.data.landgrabTimer) {
			clearTimeout(o.data.landgrabTimer);
			o.data.landgrabTimer = null;
		}
	});

	traverse(my, function (o) {
		cellCounts[o.id] = 0;
		var team = o.robot ? (o.game.team || 0) : (o.team || 0);
		if (team) {
			if (!teamMembers[team]) { teamCells[team] = 0; teamMembers[team] = []; }
			teamMembers[team].push(o.id);
		}
	});

	for (i = 0; i < TOTAL_CELLS; i++) {
		var owner = my.game.board[i].owner;
		if (owner && cellCounts.hasOwnProperty(owner)) cellCounts[owner]++;
	}
	for (var team in teamMembers) {
		teamMembers[team].forEach(function (pid) { teamCells[team] += cellCounts[pid]; });
	}

	traverse(my, function (o) {
		var t = o.robot ? (o.game.team || 0) : (o.team || 0);
		if (t && teamMembers[t]) {
			var tPool = teamCells[t] * POINTS_PER_CELL;
			scores[o.id] = Math.round(tPool / teamMembers[t].length);
		} else {
			scores[o.id] = (cellCounts[o.id] || 0) * POINTS_PER_CELL;
		}
		o.game.score += scores[o.id];
	});

	my.byMaster('turnEnd', { ok: false, scores: scores }, true);
	my.game._rrt = setTimeout(my.roundReady, 3000);
};
exports.submit = function (client, text, data) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;

	if (!client.game) return;
	if (my.game.late || !play || !my.game.board) return;
	if (!text) return;
	text = text.replace(/\s/g, '');
	if (my.opts.no2 && text.length <= 2) {
		client.send('turnEnd', { error: true });
		return;
	}

	if (!Array.isArray(data) || data.length < 1) return;
	var sIdx = Number(data[0]);
	if (isNaN(sIdx) || sIdx < 0 || sIdx >= TOTAL_CELLS) return;
	var startCell = my.game.board[sIdx];
	if (!startCell || startCell.owner !== client.id) {
		// 선택해 둔 칸을 그 사이 다른 플레이어가 가져간 경우 — 클라이언트가 입력창을 닫도록 알림
		client.send('turnEnd', { error: true, deselect: true });
		return;
	}

	// 가: 초성 패턴 매치 (다른 플레이어 시작칸을 포함하는 배치는 후보에서 이미 제외됨)
	var chosungSeq = wordToChosung(text);
	if (!chosungSeq || !chosungSeq.length) {
		client.send('turnEnd', { error: true });
		return;
	}
	var cands = findCandidates(my.game.board, sIdx, chosungSeq, client.id);
	var ranked = rankCandidates(cands);
	if (!ranked.length) {
		client.send('turnEnd', { error: true });
		return;
	}

	// 라: 새로 얻는 칸이 1개 이상인 첫 후보를 채택 (우선순위대로 순회)
	var chosen = null;
	for (var i = 0; i < ranked.length; i++) {
		var newCount = ranked[i].cells.filter(function (idx) {
			return my.game.board[idx].owner !== client.id;
		}).length;
		if (newCount > 0) { chosen = ranked[i]; break; }
	}
	if (!chosen) {
		client.send('turnEnd', { error: true });
		return;
	}

	// 다: 플레이어별 사용 단어 검사
	if (!my.game.usedWords[client.id]) my.game.usedWords[client.id] = {};
	if (my.game.usedWords[client.id][text]) {
		client.send('turnEnd', { error: true });
		return;
	}

	// 나: 사전 존재 여부 (비동기, 가장 마지막에 검사)
	// 같은 클라이언트가 응답을 기다리는 동안 또 제출하는 것을 막아 DB 조회 폭주를 방지
	if (client.data.landgrabBusy) return;
	client.data.landgrabBusy = true;

	DB.kkutu[my.rule.lang].findOne(['_id', text]).limit(['_id', true]).on(function ($doc) {
		client.data.landgrabBusy = false;
		if (!my.game.board || my.game.late) return;
		if (!$doc) {
			client.send('turnEnd', { error: true });
			return;
		}
		// DB 조회 대기 중 라운드가 바뀌었거나 대상 칸이 사라졌을 수 있으므로 재확인
		if (my.game.board[sIdx] !== startCell) return;

		my.game.usedWords[client.id][text] = true;

		var changes = [];
		chosen.cells.forEach(function (idx) {
			var cell = my.game.board[idx];
			var previousOwner = cell.owner;
			cell.owner = client.id;
			changes.push({ index: idx, owner: client.id, previousOwner: previousOwner });
		});

		client.publish('turnEnd', {
			target: client.id,
			selected: sIdx,
			word: text,
			changes: changes
		}, true);
		client.invokeWordPiece(text, 1);
	});
};
exports.getScore = function () {
	return 0;
};

// 항상 같은 박자로 움직이면 티가 나므로, 딜레이마다 0.8~1.2배를 곱해 흔든다.
function jitter(ms) {
	return Math.round(ms * (0.8 + Math.random() * 0.4));
}

// 턴제가 아니라 라운드 내내 스스로 반복 제출해야 하므로, robot.data.landgrabTimer 하나로
// "다음 단어를 타이핑 중" / "다음 수를 생각 중" 상태를 번갈아 예약하는 자기 호출 루프로 구현한다.
exports.readyRobot = function (robot) {
	var my = this;
	loop();

	function loop() {
		if (robot.data.landgrabTimer) {
			clearTimeout(robot.data.landgrabTimer);
			robot.data.landgrabTimer = null;
		}
		if (my.game.late || !my.game.board) return;

		var level = robot.level;
		var interDelay = jitter(ROBOT_INTER_WORD_DELAY[level]);
		var move = decideMove(my, robot);

		if (move) {
			var typeDelay = jitter(move.word.length * (60000 / ROBOT_TYPE_CPM[level]));
			robot.data.landgrabTimer = setTimeout(function () {
				if (my.game.late || !my.game.board) return;
				my.turnRobot(robot, move.word, [move.sIdx]);
				robot.data.landgrabTimer = setTimeout(loop, interDelay);
			}, typeDelay);
		} else {
			// 지금 당장 둘 곳이 없어도, 다른 플레이어들이 칸을 옮기며 판이 바뀌므로 잠시 후 다시 시도한다.
			robot.data.landgrabTimer = setTimeout(loop, interDelay);
		}
	}
};
