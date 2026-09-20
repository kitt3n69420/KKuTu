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

$lib.Sudoku = {};

// 십자말풀이처럼 퍼즐 전체가 한 라운드에 열리고, 상단 라운드 번호(①②③…)를 눌러 판을 전환한다
$lib.Sudoku.roundReady = function (data, spec) {
	var turn = data.seq ? data.seq.indexOf($data.id) : -1;

	clearBoard();
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data.selectedRound = (turn == -1) ? 1 : (turn % $data.room.round + 1);
	$stage.game.items.hide();
	$stage.game.cwcmd.show().css('opacity', 0);
	// 스도쿠는 칸을 눌러 cwcmd 입력창으로 답을 내므로 게임 입력창 숨김
	$stage.game.here.hide();
	drawRound($data.selectedRound);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
// data: { boards: [{ size, subW, subH, cells[size*size](0=빈 칸), owners{idx: id} }], roundTime(관전/난입 시) }
$lib.Sudoku.turnStart = function (data) {
	$data._sdk = data.boards;
	if (typeof data.roundTime === 'number') $data._roundTime = data.roundTime;
	$(".rounds label").on('click', $lib.Sudoku.onRound);
	$lib.Sudoku.drawDisplay();
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Sudoku.onRound = function (e) {
	var round = $(e.currentTarget).html().charCodeAt(0) - 9311;

	$data._sel = null;
	$stage.game.cwcmd.css('opacity', 0);
	drawRound($data.selectedRound = round);
	$(".rounds label").on('click', $lib.Sudoku.onRound);
	$lib.Sudoku.drawDisplay();
};
$lib.Sudoku.turnEnd = function (id, data) {
	var $uc = $("#game-user-" + id);
	var $sc, $cell, $cr, board;

	// 라운드 종료
	if (data.ok === false) {
		clearInterval($data._tTime);
		$data._sel = null;
		$stage.game.cwcmd.css('opacity', 0);
		stopBGM();
		playSound('horr');
		return;
	}
	if (!$data._sdk) return;

	$sc = $("<div>").addClass("deltaScore").html((data.score > 0 ? "+" : "") + data.score);
	if (data.score < 0) $sc.addClass("lost");
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	drawObtainedScore($uc, $sc);

	if (data.wrong) {
		if (id == $data.id) {
			playSound('fail');
			if (data.pos[0] == $data.selectedRound - 1) {
				$cell = $("#sdk-" + data.pos[1]).addClass("sd-wrong");
				addTimeout(function () { $cell.removeClass("sd-wrong"); }, 400);
			}
			$("#cw-q-input").focus();
		}
		return;
	}

	board = $data._sdk[data.pos[0]];
	board.cells[data.pos[1]] = data.value;
	board.owners[data.pos[1]] = id;
	playSound(id == $data.id ? 'success' : 'mission');
	// 지금 입력 중이던 칸이 채워졌으면 입력창 닫기
	if ($data._sel && $data._sel[0] == data.pos[0] && $data._sel[1] == data.pos[1]) {
		$data._sel = null;
		$stage.game.cwcmd.css('opacity', 0);
	}
	if (data.pos[0] == $data.selectedRound - 1) $lib.Sudoku.drawDisplay();
	else {
		$cr = $($stage.game.round.children("label").get(data.pos[0])).addClass("round-effect");
		addTimeout(function () { $cr.removeClass("round-effect"); }, 800);
	}
};
$lib.Sudoku.onCell = function (e) {
	var idx = Number($(e.currentTarget).attr('data-idx'));

	if ($data._sdk[$data.selectedRound - 1].cells[idx]) return;
	$data._sel = [$data.selectedRound - 1, idx];
	$stage.game.cwcmd.css('opacity', 1);
	$(".cw-q-head").html(L['sudokuPrompt']);
	$(".cw-q-body").html("");
	$("#cw-q-input").val("").focus();
	$lib.Sudoku.drawDisplay();
};
$lib.Sudoku.drawDisplay = function () {
	var sdk = $data._sdk[$data.selectedRound - 1];
	var $pane = $stage.game.display.empty();
	var size = sdk.size;
	var CELL = 100 / size;
	var bx, by, x, y, i, v, owner, $bar, $cell;

	// 십자말풀이와 같은 구조: 서브그리드마다 막대(.cw-bar) 하나, 그 안에 칸(.cw-cell)들
	for (by = 0; by < size / sdk.subH; by++) {
		for (bx = 0; bx < size / sdk.subW; bx++) {
			$bar = $("<div>").addClass("cw-bar")
				// 서브블록 좌표 (x, y)의 합이 홀수인 블록의 막대는 더 밝게, 아니면 더 어둡게
				.addClass((bx + by) % 2 ? "sd-light" : "sd-dark")
				.css({
					top: by * sdk.subH * CELL + "%",
					left: bx * sdk.subW * CELL + "%",
					width: sdk.subW * CELL + "%",
					height: sdk.subH * CELL + "%",
					display: 'flex',
					'flex-wrap': 'wrap',
					'align-content': 'flex-start'
				});
			for (y = 0; y < sdk.subH; y++) {
				for (x = 0; x < sdk.subW; x++) {
					i = (by * sdk.subH + y) * size + bx * sdk.subW + x;
					v = sdk.cells[i];
					owner = sdk.owners[i];
					$cell = $("<div>").addClass("cw-cell")
						.attr({ id: "sdk-" + i, 'data-idx': i })
						.css({
							'box-sizing': 'border-box',
							width: 'calc(' + (100 / sdk.subW) + '% - 6px)',
							height: 'calc(' + (100 / sdk.subH) + '% - 6px)',
							// 이지 모드(6x6)는 판이 커져 칸이 넓으므로 글자를 1.5배로
							'font-size': size == 6 ? '1.5em' : '',
							color: ($data.room.opts.drg ? getRandomColor() : '')
						})
						.html(v || "");
					// 주어진 칸/남이 맞힌 칸은 sd-open, 내가 맞힌 칸은 sd-my-open, 빈 칸은 눌러서 선택
					if (owner == $data.id) $cell.addClass("sd-open sd-my-open");
					else if (v) $cell.addClass("sd-open");
					else $cell.addClass("sd-empty").on('click', $lib.Sudoku.onCell);
					if ($data._sel && $data._sel[1] === i) $cell.addClass("sd-sel");
					$bar.append($cell);
				}
			}
			$pane.append($bar);
		}
	}
};
$lib.Sudoku.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Sudoku.turnHint = function (data) {
	playSound('fail');
};
