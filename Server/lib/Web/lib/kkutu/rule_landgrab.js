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

$lib.Landgrab = {};

// 플레이어 배경색 (인덱스 0 = 미소유) — rule_flip.js와 동일한 팔레트
$lib.Landgrab._PLAYER_COLORS = [
	'#42341a', '#fffea4', '#b7f3f1', '#fda09b', '#d0bcfe', '#cfcfcf',
	'#dfbb9c', '#8ce7a1', '#F7b1e6', '#feb482', '#a1cafe', '#e178c2', '#11bdce'
];
$lib.Landgrab._PLAYER_COLORS_DARK = [
	'#000000', '#979516', '#2ca09a', '#b72018', '#592ac6', '#808080',
	'#957a4d', '#2fa54b', '#a131a3', '#d1741d', '#2265be', '#cd678c', '#93c757'
];
$lib.Landgrab._TEAM_COLORS = ['', '#8CA6FF', '#9575CD', '#F06292', '#FFCA28'];
$lib.Landgrab._TEAM_COLORS_DARK = ['', '#11319b', '#8263b8', '#d42e66', '#ecc756'];

// 게임 시작 시 컬러맵 생성 (게임마다 1회, 라운드마다 아님)
$lib.Landgrab._buildColorMap = function () {
	var seq = $data.room.game.seq;
	var n = seq.length;
	var map = {};
	var i, id, colors, offset;

	if (n >= 11) {
		colors = [];
		for (i = 1; i <= 12; i++) colors.push(i);
		for (i = colors.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = colors[i]; colors[i] = colors[j]; colors[j] = t;
		}
		for (i = 0; i < n; i++) {
			if (!seq[i]) continue;
			id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			map[id] = colors[i];
		}
	} else {
		offset = Math.floor(Math.random() * 10);
		for (i = 0; i < n; i++) {
			if (!seq[i]) continue;
			id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			map[id] = ((i + offset) % 10) + 1;
		}
	}
	$data._landgrabColorMap = map;
};
// 게임 도중 나간 플레이어/제거된 봇의 색 배정이 맵에 그대로 남아있으면, 실제 동시 인원이
// 12명 이하여도 누적된 고유 id 수가 12개를 넘어 아래 폴백이 겹친 색을 내놓을 수 있다.
// 그래서 색을 새로 배정하기 전에, 지금 seq에 없는(=더 이상 활성 상태가 아닌) id는 먼저 지운다.
$lib.Landgrab._pruneColorMap = function () {
	if (!$data._landgrabColorMap) return;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	var active = {};
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			active[(typeof seq[i] === 'string') ? seq[i] : seq[i].id] = true;
		}
	}
	for (var id in $data._landgrabColorMap) {
		if (!active[id]) delete $data._landgrabColorMap[id];
	}
};
$lib.Landgrab._assignFallbackColor = function (ownerId) {
	$lib.Landgrab._pruneColorMap();
	var used = {};
	for (var id in $data._landgrabColorMap) used[$data._landgrabColorMap[id]] = true;
	for (var c = 1; c <= 12; c++) {
		if (!used[c]) { $data._landgrabColorMap[ownerId] = c; return; }
	}
	// 활성 인원이 실제로 12명을 넘는 예외적인 경우에만 여기 도달한다 — 색 12개로는 원래 불가능한 상황.
	$data._landgrabColorMap[ownerId] = (Object.keys($data._landgrabColorMap).length % 12) + 1;
};
$lib.Landgrab._getPlayerColor = function (ownerId) {
	var colors = document.body.classList.contains('dark-mode') ? $lib.Landgrab._PLAYER_COLORS_DARK : $lib.Landgrab._PLAYER_COLORS;
	if (!ownerId) return colors[0];
	if (!$data._landgrabColorMap) $data._landgrabColorMap = {};
	if (!$data._landgrabColorMap[ownerId]) $lib.Landgrab._assignFallbackColor(ownerId);
	return colors[$data._landgrabColorMap[ownerId]];
};
$lib.Landgrab._applyUserCardColors = function () {
	if (!$data._landgrabColorMap) return;
	var colors = document.body.classList.contains('dark-mode') ? $lib.Landgrab._PLAYER_COLORS_DARK : $lib.Landgrab._PLAYER_COLORS;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			var seqId = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			if (!$data._landgrabColorMap[seqId]) $lib.Landgrab._assignFallbackColor(seqId);
		}
	}
	for (var id in $data._landgrabColorMap) {
		var color = colors[$data._landgrabColorMap[id]];
		$("#game-user-" + id).css('background-color', color);
	}
};
// hex 색상을 밝게(+)/어둡게(-) 보정. percent: -1 ~ 1
$lib.Landgrab._shadeColor = function (hex, percent) {
	var f = parseInt(hex.slice(1), 16);
	var t = percent < 0 ? 0 : 255;
	var p = percent < 0 ? -percent : percent;
	var R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
	return '#' + (0x1000000 +
		(Math.round((t - R) * p) + R) * 0x10000 +
		(Math.round((t - G) * p) + G) * 0x100 +
		(Math.round((t - B) * p) + B)
	).toString(16).slice(1);
};
$lib.Landgrab._getOwnerTeam = function (ownerId) {
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

$lib.Landgrab.roundReady = function (data, spec) {
	clearBoard();
	// 랜드그랩은 턴 단위가 아니라 칸 선택으로 답을 제출하므로(#cw-q-input, submitCwAnswer 참고)
	// _relay를 항상 켜두면 #Talk 채팅이 매번 서버로 relay-submit되어 사라진다(칸 데이터가 없어 서버가 무시함).
	// 채팅은 항상 일반 채팅으로 보내지도록 relay를 켜지 않는다.
	$data._relay = false;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping,.game-body").addClass("landgrab");
	$data._board = data.board;
	$data._owners = data.owners;
	$data._homes = data.homes;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data._sel = null;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.show().css('opacity', 0);
	$stage.game.here.hide();
	if (!$data._landgrabColorMap) {
		$lib.Landgrab._buildColorMap();
	}
	$lib.Landgrab._applyUserCardColors();
	$lib.Landgrab.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Landgrab.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Landgrab.turnEnd = function (id, data) {
	var $sc, $uc;

	if (data.error) {
		playSound('fail');
		// 선택해 둔 칸을 그 사이 다른 플레이어가 가져가 서버가 거부한 경우 — 입력창을 닫는다
		if (data.deselect) {
			$data._sel = null;
			$stage.game.cwcmd.css('opacity', 0);
			$lib.Landgrab.drawDisplay();
		}
		return;
	}

	// 라운드 종료 — 점수 표시
	if (data.ok === false) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound('horr');

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

	// 칸 점령 성공
	if (data.changes) {
		var stolenFromMe = false;
		var selectionLost = false;

		data.changes.forEach(function (ch) {
			$data._owners[ch.index] = ch.owner;
			if (ch.previousOwner === $data.id && ch.owner !== $data.id) stolenFromMe = true;
			// 지금 선택(입력) 중인 칸을 다른 플레이어가 가져간 경우 — 서버 응답을 기다리지 않고 즉시 반영
			if ($data._sel && $data._sel[0] === ch.index && ch.owner !== $data.id) selectionLost = true;
		});

		if (id === $data.id) {
			playSound('success');
			// 정답을 입력해도 입력창은 닫지 않고 계속 같은 칸에서 이어서 입력할 수 있게 둔다
		} else if (stolenFromMe) {
			playSound('mission');
		}

		if (selectionLost) {
			$data._sel = null;
			$stage.game.cwcmd.css('opacity', 0);
		}

		$lib.Landgrab.drawDisplay();
	}
};
$lib.Landgrab.onCell = function (e) {
	var idx = Number($(e.currentTarget).attr('data-idx'));

	if ($data._owners[idx] !== $data.id) return;
	$data._sel = [idx];
	$stage.game.cwcmd.css('opacity', 1);
	$(".cw-q-head").html(L['landgrabPrompt']);
	$(".cw-q-body").html("");
	$("#cw-q-input").val("").focus();
	$lib.Landgrab.drawDisplay();
};
$lib.Landgrab.drawDisplay = function () {
	var COLS = 12;
	var ROWS = 12;
	var CELL = 100 / COLS;
	var $pane = $stage.game.display.empty();
	var i, row, col, chosung, owner, isHome, playerColor, bgColor, border, teamId;
	var $cell;
	var isDark = document.body.classList.contains('dark-mode');
	var teamColors = isDark ? $lib.Landgrab._TEAM_COLORS_DARK : $lib.Landgrab._TEAM_COLORS;

	for (i = 0; i < COLS * ROWS; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		chosung = $data._board[i] || "";
		owner = $data._owners[i];
		isHome = $data._homes && $data._homes[i];
		playerColor = $lib.Landgrab._getPlayerColor(owner);

		bgColor = playerColor;
		border = isDark ? '1px solid #333' : '1px solid #888';
		if (owner) {
			teamId = $lib.Landgrab._getOwnerTeam(owner);
			if (teamId) {
				bgColor = teamColors[teamId] || playerColor;
				border = '2px solid ' + playerColor;
			}
		}
		// 시작 칸(자신 포함)은 그 소유자의 원래 색보다 라이트 모드에서 더 진하게, 다크 모드에서 더 연하게 표시
		if (isHome && owner) {
			bgColor = $lib.Landgrab._shadeColor(bgColor, isDark ? 0.25 : -0.25);
		}
		// 자신의 시작 칸만 두꺼운 테두리로 표시 (라이트: 흰색 / 다크: 연한색)
		if (isHome && owner === $data.id) {
			border = isDark ? '3px solid #eee' : '3px solid #FFF';
		}

		$pane.append($cell = $("<div>").addClass("landgrab-cell")
			.attr('data-idx', i)
			.css({
				top: (row * CELL) + "%",
				left: (col * CELL) + "%",
				width: CELL + "%",
				height: CELL + "%",
				'background-color': bgColor,
				'border': border,
				'color': ($data.room.opts.drg ? getRandomColor() : (isDark ? '#FFF' : (owner ? '#000' : '#FFF')))
			})
			.html(chosung)
		);
		if (owner === $data.id) $cell.addClass("landgrab-mine").on('click', $lib.Landgrab.onCell);
		// 지금 선택(입력) 중인 칸 강조 — 배경색이 원래 색과 흰색(다크모드는 검정과 원래 색) 사이를 1초 주기로 오간다
		if ($data._sel && $data._sel[0] === i) {
			// jQuery.css()는 CSS 커스텀 프로퍼티(--*)를 정상적으로 설정하지 못하므로 DOM API를 직접 사용
			$cell.addClass("landgrab-selected");
			$cell[0].style.setProperty('--lg-pulse-a', isDark ? '#000' : bgColor);
			$cell[0].style.setProperty('--lg-pulse-b', isDark ? bgColor : '#FFF');
		}
	}
};
$lib.Landgrab.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Landgrab.turnHint = function (data) {
	playSound('fail');
};
