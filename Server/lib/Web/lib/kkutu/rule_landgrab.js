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

// 플레이어 배경색 (인덱스 0 = 미소유) — rule_flip.js와 동일한 팔레트, Tier 1 (1~10P)
$lib.Landgrab._PLAYER_COLORS = [
	'#42341a', '#fffea4', '#b7f3f1', '#fda09b', '#d0bcfe', '#cfcfcf',
	'#dfbb9c', '#8ce7a1', '#F7b1e6', '#feb482', '#a1cafe'
];
$lib.Landgrab._PLAYER_COLORS_DARK = [
	'#000000', '#979516', '#2ca09a', '#b72018', '#592ac6', '#808080',
	'#957a4d', '#2fa54b', '#a131a3', '#d1741d', '#2265be'
];
$lib.Landgrab._TEAM_COLORS = ['', '#92B2FF', '#9B92F8', '#EE76A4', '#FF9A72', '#FFCA7A', '#81EB78'];
$lib.Landgrab._TEAM_COLORS_DARK = ['', '#3B579E', '#483795', '#88134C', '#9E3900', '#9E6C00', '#108A0A'];

// 채널별 formula 적용 후 0~255로 clamp해 새 팔레트를 파생 (11~20P/21~30P 티어용)
$lib.Landgrab._deriveTier = function (baseColors, formula) {
	var clamp = function (x) { return Math.max(0, Math.min(255, Math.round(x))); };
	var out = [];
	for (var i = 0; i < baseColors.length; i++) {
		var hex = baseColors[i];
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		out.push('#' + ((1 << 24) + (clamp(formula(r)) << 16) + (clamp(formula(g)) << 8) + clamp(formula(b))).toString(16).slice(1));
	}
	return out;
};

// Tier 1(1~10P)에서 Tier 2(11~20P)를 파생하고, Tier 3(21~30P)는 Tier 2에서 이어서 파생 (라이트/다크 각자 독립적)
// 라이트: Tier2 = 5/3배 진하게, Tier3 = Tier2 색에 검정 30% 혼합
// 다크: Tier2 = 4/3배 밝게, Tier3 = Tier2 색에 흰색 40% 혼합
$lib.Landgrab._PLAYER_COLORS_TIER1 = $lib.Landgrab._PLAYER_COLORS.slice(1);
$lib.Landgrab._PLAYER_COLORS_TIER2 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_TIER1, function (x) { return 255 - (5 / 3) * (255 - x); });
$lib.Landgrab._PLAYER_COLORS_TIER3 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_TIER2, function (x) { return x * 0.7; });

$lib.Landgrab._PLAYER_COLORS_DARK_TIER1 = $lib.Landgrab._PLAYER_COLORS_DARK.slice(1);
$lib.Landgrab._PLAYER_COLORS_DARK_TIER2 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_DARK_TIER1, function (x) { return x * (4 / 3); });
$lib.Landgrab._PLAYER_COLORS_DARK_TIER3 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_DARK_TIER2, function (x) { return x * 0.6 + 255 * 0.4; });

// 조회용 통합 팔레트: 인덱스 0=미소유, 1~10=Tier1, 11~20=Tier2, 21~30=Tier3
$lib.Landgrab._PLAYER_COLORS_FULL = [$lib.Landgrab._PLAYER_COLORS[0]].concat($lib.Landgrab._PLAYER_COLORS_TIER1, $lib.Landgrab._PLAYER_COLORS_TIER2, $lib.Landgrab._PLAYER_COLORS_TIER3);
$lib.Landgrab._PLAYER_COLORS_DARK_FULL = [$lib.Landgrab._PLAYER_COLORS_DARK[0]].concat($lib.Landgrab._PLAYER_COLORS_DARK_TIER1, $lib.Landgrab._PLAYER_COLORS_DARK_TIER2, $lib.Landgrab._PLAYER_COLORS_DARK_TIER3);

// 게임 시작 시 컬러맵 생성 (게임마다 1회, 라운드마다 아님)
// N명분 색상 풀을 티어(1~10/11~20/21~30) 순서로 구성: 10명 단위는 전부, 나머지는 해당 티어에서 무작위 샘플
$lib.Landgrab._buildColorMap = function () {
	var seq = $data.room.game.seq;
	var n = seq.length;
	var map = {};
	var i, id;
	var tiers = [1, 2, 3]; // tier index offset은 (tier-1)*10 + 1
	var pool = [];
	var remaining = n;

	for (var t = 0; t < tiers.length && remaining > 0; t++) {
		var offset = (tiers[t] - 1) * 10 + 1;
		if (remaining >= 10) {
			for (i = 0; i < 10; i++) pool.push(offset + i);
			remaining -= 10;
		} else {
			var picks = [];
			for (i = 0; i < 10; i++) picks.push(offset + i);
			for (i = picks.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var pt = picks[i]; picks[i] = picks[j]; picks[j] = pt;
			}
			pool = pool.concat(picks.slice(0, remaining));
			remaining = 0;
		}
	}

	for (i = pool.length - 1; i > 0; i--) {
		var j2 = Math.floor(Math.random() * (i + 1));
		var t2 = pool[i]; pool[i] = pool[j2]; pool[j2] = t2;
	}
	for (i = 0; i < n; i++) {
		if (!seq[i]) continue;
		id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
		map[id] = pool[i];
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
	for (var c = 1; c <= 30; c++) {
		if (!used[c]) { $data._landgrabColorMap[ownerId] = c; return; }
	}
	// 활성 인원이 실제로 30명을 넘는 예외적인 경우에만 여기 도달한다 — 색 30개로는 원래 불가능한 상황.
	$data._landgrabColorMap[ownerId] = (Object.keys($data._landgrabColorMap).length % 30) + 1;
};
$lib.Landgrab._getPlayerColor = function (ownerId) {
	var colors = document.body.classList.contains('dark-mode') ? $lib.Landgrab._PLAYER_COLORS_DARK_FULL : $lib.Landgrab._PLAYER_COLORS_FULL;
	if (!ownerId) return colors[0];
	if (!$data._landgrabColorMap) $data._landgrabColorMap = {};
	if (!$data._landgrabColorMap[ownerId]) $lib.Landgrab._assignFallbackColor(ownerId);
	return colors[$data._landgrabColorMap[ownerId]];
};
$lib.Landgrab._applyUserCardColors = function () {
	if (!$data._landgrabColorMap) return;
	var colors = document.body.classList.contains('dark-mode') ? $lib.Landgrab._PLAYER_COLORS_DARK_FULL : $lib.Landgrab._PLAYER_COLORS_FULL;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			var seqId = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			if (!$data._landgrabColorMap[seqId]) $lib.Landgrab._assignFallbackColor(seqId);
		}
	}
	var isDarkMode = document.body.classList.contains('dark-mode');
	for (var id in $data._landgrabColorMap) {
		var idx = $data._landgrabColorMap[id];
		var color = colors[idx];
		// 다크 모드에서 11p 이상(Tier2/3)은 원래 색보다 밝아서 흰 글씨로는 안 보이므로 검은 글씨로
		$("#game-user-" + id).css({
			'background-color': color,
			'color': (isDarkMode && idx > 10) ? '#000000' : ''
		});
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
				// 다크 모드에서 11p 이상(Tier2/3) 소유 칸은 배경이 밝아서 흰 글씨 대신 검은 글씨 사용
				'color': ($data.room.opts.drg ? getRandomColor() : (isDark ? ((owner && $data._landgrabColorMap[owner] > 10) ? '#000' : '#FFF') : (owner ? '#000' : '#FFF')))
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
