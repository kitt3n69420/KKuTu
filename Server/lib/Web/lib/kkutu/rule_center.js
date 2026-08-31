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

$lib.Center = {};

$lib.Center.roundReady = function (data, spec) {
	clearBoard();
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping,.game-body").addClass("center-board");
	$data._board = data.board;
	// 재접속/관전 중간 합류(spec)는 이미 진행 중인 라운드라 사각형을 바로 보여주고,
	// 새 라운드는 turnStart 전까지 사각형을 숨긴다.
	$data._rect = spec ? data.rect : null;
	$data._revealIndex = null;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	// 땅따먹기처럼 모바일 플로팅 입력창(.game-input)은 쓰지 않음 — 답은 항상 하단 채팅창으로 입력
	$stage.game.here.hide();
	$lib.Center.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Center.turnStart = function (data) {
	if (typeof data.roundTime === 'number') $data._roundTime = data.roundTime;
	if (data.rect) $data._rect = data.rect;
	$lib.Center.drawDisplay();
	if (!$data._spectate) $data._relay = true;
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Center.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Center.turnEnd = function (id, data) {
	if (data.error) {
		playSound('fail');
		return;
	}
	if (data.ok) {
		if ($data._roundTime > 10000) $data._roundTime = 10000;
		addScore(id, data.score, data.totalScore);
		drawObtainedScore($("#game-user-" + id), $("<div>").addClass("deltaScore").html("+" + data.score));
		updateScore(id, getScore(id));
		playSound(id === $data.id ? 'success' : 'mission');
		return;
	}
	// 라운드 종료 브로드캐스트 (target/ok/error 없음) — 중심 칸을 강조해서 정답 위치를 공개
	$data._revealIndex = (typeof data.centerIndex === 'number') ? data.centerIndex : null;
	$lib.Center.drawDisplay();
	clearInterval($data._tTime);
	stopBGM();
	playSound('horr');
};
// 랜드그랩의 절대좌표 퍼센트 셀 렌더링(rule_landgrab.js drawDisplay)을 그대로 재사용 —
// 소유권/팀 개념이 없으므로 사각형 강조/정답 공개 여부에 따라 배경/글자/테두리색만 다르게 준다.
// 일반 칸은 배경을 따로 칠하지 않아 .jjo-display의 기본 보드 배경이 그대로 비치고, 글자는 흰색.
// 강조 칸(사각형 내부)은 밝은 배경 + 검은 글자, 칸 사이 테두리는 없음.
// 라운드 종료 후에는 중심 칸(_revealIndex)만 테두리 + 다른 색으로 한 번 더 강조해 정답 위치를 보여준다.
$lib.Center.drawDisplay = function () {
	var COLS = 16, ROWS = 16, CELL = 100 / COLS;
	var $pane = $stage.game.display.empty();
	var rect = $data._rect;
	var i, row, col, inRect, isReveal, $cell;

	for (i = 0; i < COLS * ROWS; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		inRect = !!rect && row >= rect.top && row < rect.top + rect.h
			&& col >= rect.left && col < rect.left + rect.w;
		isReveal = ($data._revealIndex === i);

		$pane.append($cell = $("<div>").addClass("landgrab-cell")
			.css({
				top: (row * CELL) + "%",
				left: (col * CELL) + "%",
				width: CELL + "%",
				height: CELL + "%",
				'background-color': isReveal ? '#FF6D6D' : (inRect ? '#FFE873' : 'transparent'),
				'border': isReveal ? '2px solid #FFFFFF' : 'none',
				'color': (isReveal || inRect) ? '#000000' : '#FFFFFF',
				'font-size': '10px'
			})
			.html(($data._board && $data._board[i]) || "")
		);
	}
};
