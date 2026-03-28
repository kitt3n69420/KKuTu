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

// 플레이어 배경색 (인덱스 0 = 미소유)
$lib.Flip._PLAYER_COLORS = [
	'#42341a',  // 0: 미소유 (회색)
	'#fffea4',  // 1P: 연빨강
	'#b7f3f1',  // 9P: 연두색
	'#feb482',  // 3P: 연노랑
	'#8ce7a1',  // 4P: 연초록
	'#fda09b',  // 5P: 연보라
	'#d0bcfe',  // 6P: 연주황
	'#dfbb9c',  // 7P: 하늘색
	'#F7b1e6',  // 8P: 연분홍
	'#a1cafe',  // 2P: 남색 계열
	'#cfcfcf',  // 10P: 탁한 연빨강
	'#e178c2',  // 11P: 탁한 연노랑
	'#11bdce'   // 12P: 탁한 연파랑
];

// 팀 테두리색
$lib.Flip._TEAM_COLORS = [
	'',         // 0: 팀 없음
	'#8CA6FF',  // 팀 1
	'#9575CD',  // 팀 2
	'#F06292',  // 팀 3
	'#FFCA28'   // 팀 4
];

$lib.Flip._getPlayerIndex = function (ownerId) {
	if (!ownerId || !$data.room || !$data.room.game || !$data.room.game.seq) return 0;
	var seq = $data.room.game.seq;
	for (var i = 0; i < seq.length; i++) {
		var item = seq[i];
		var id = (typeof item === 'string') ? item : item.id;
		if (id === ownerId) return i + 1;
	}
	return 0;
};

// 게임 시작 시 컬러맵 생성 (게임마다 1회, 라운드마다 아님)
$lib.Flip._buildColorMap = function () {
	var seq = $data.room.game.seq;
	var n = seq.length;
	var map = {};
	var i, id, colors, offset;

	if (n >= 11) {
		// 11~12명: 1~12번 색상 전체를 셔플
		colors = [];
		for (i = 1; i <= 12; i++) colors.push(i);
		for (i = colors.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = colors[i]; colors[i] = colors[j]; colors[j] = t;
		}
		for (i = 0; i < n; i++) {
			id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			map[id] = colors[i];
		}
	} else {
		// 1~10명: 1~10번 색상에서 랜덤 오프셋으로 순환
		offset = Math.floor(Math.random() * 10);
		for (i = 0; i < n; i++) {
			id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			map[id] = ((i + offset) % 10) + 1;
		}
	}
	$data._flipColorMap = map;
};

$lib.Flip._getPlayerColor = function (ownerId) {
	if (!ownerId || !$data._flipColorMap || !$data._flipColorMap[ownerId]) return $lib.Flip._PLAYER_COLORS[0];
	return $lib.Flip._PLAYER_COLORS[$data._flipColorMap[ownerId]];
};

$lib.Flip._applyUserCardColors = function () {
	if (!$data._flipColorMap) return;
	for (var id in $data._flipColorMap) {
		var color = $lib.Flip._PLAYER_COLORS[$data._flipColorMap[id]];
		$("#game-user-" + id).css('background-color', color);
	}
};

$lib.Flip._getOwnerTeam = function (ownerId) {
	if (!ownerId || !$data.room || !$data.room.game || !$data.room.game.seq) return 0;
	var seq = $data.room.game.seq;
	for (var i = 0; i < seq.length; i++) {
		var item = seq[i];
		if (typeof item === 'string') {
			var u = $data.users[item];
			if (item === ownerId && u && u.game) return u.game.team || 0;
		} else {
			if (item.id === ownerId && item.game) return item.game.team || 0;
		}
	}
	return 0;
};

$lib.Flip.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping").addClass("flip");
	$data._board = data.board;
	$data._owners = data.owners;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	$stage.game.here.hide();
	if (!$data._flipColorMap) {
		$lib.Flip._buildColorMap();
	}
	$lib.Flip._applyUserCardColors();
	$lib.Flip.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Flip.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Flip.turnEnd = function (id, data) {
	var $sc, $uc, previousOwner;

	if (data.error) {
		playSound('fail');
		return;
	}

	// 라운드 종료 — 점수 표시
	if (data.ok === false) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound('horr');

		// 라운드별 점수 반영
		if (data.scores) {
			for (var pid in data.scores) {
				var sc = data.scores[pid];
				if (sc > 0) {
					$uc = $("#game-user-" + pid);
					$sc = $("<div>").addClass("deltaScore").html("+" + sc);
					addScore(pid, sc, getScore(pid) + sc);
					updateScore(pid, getScore(pid));
					drawObtainedScore($uc, $sc);
				}
			}
		}
		return;
	}

	// 칸 뒤집기 성공
	if (typeof data.cellIndex === 'number') {
		previousOwner = $data._owners[data.cellIndex];

		$data._board[data.cellIndex] = data.newWord;
		$data._owners[data.cellIndex] = data.owner;

		if (id === $data.id) {
			playSound('success');
		} else if (previousOwner === $data.id) {
			playSound('mission');
		}

		$lib.Flip.drawDisplay();
	}
};
$lib.Flip.drawDisplay = function () {
	var COLS = 5;
	var ROWS = 10;
	var CELL_W = 100 / COLS;
	var CELL_H = 100 / ROWS;
	var $pane = $stage.game.display.empty();
	var i, row, col, word, owner, playerColor, bgColor, borderColor, teamId;
	var $cell;

	var isNyh = $data.room.opts.nyeohweok;

	for (i = 0; i < 50; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		word = $data._board[i] || "";
		owner = $data._owners[i];
		playerColor = $lib.Flip._getPlayerColor(owner);

		borderColor = '';
		bgColor = playerColor;
		if (owner) {
			teamId = $lib.Flip._getOwnerTeam(owner);
			if (teamId) {
				bgColor = $lib.Flip._TEAM_COLORS[teamId] || playerColor;
				borderColor = playerColor;
			}
		}

		$pane.append($cell = $("<div>").addClass("flip-cell")
			.css({
				top: (row * CELL_H) + "%",
				left: (col * CELL_W) + "%",
				width: CELL_W + "%",
				height: CELL_H + "%",
				'background-color': bgColor,
				'border': borderColor ? ('3px solid ' + borderColor) : '1px solid #999',
				'color': (owner ? '#000' : '#FFF'),
				'font-weight': isNyh ? 'normal' : 'bold'
			})
			.html(word)
		);
	}
};
$lib.Flip.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Flip.turnHint = function (data) {
	playSound('fail');
};
