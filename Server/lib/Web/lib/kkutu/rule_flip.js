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

// 플레이어 배경색 (인덱스 0 = 미소유) — 라이트 모드, Tier 1 (1~10P)
$lib.Flip._PLAYER_COLORS = [
	'#42341a',  // 0: 미소유
	'#fffea4',  // 1P
	'#b7f3f1',  // 2P
	'#fda09b',  // 5P
	'#d0bcfe',  // 6P
	'#cfcfcf',  // 10P
	'#dfbb9c',  // 7P
	'#8ce7a1',  // 4P
	'#F7b1e6',  // 8P
	'#feb482',  // 3P
	'#a1cafe'   // 9P
];

// 플레이어 배경색 — 다크 모드 (HSL L-inversion 후 S×0.8, L×1.5), Tier 1 (1~10P)
$lib.Flip._PLAYER_COLORS_DARK = [
	'#000000',  // 0: 미소유  H39  S34  L100(cap)
	'#979516',  // 1P        H59  S80  L27
	'#2ca09a',  // 2P        H178 S58  L24
	'#b72018',  // 5P        H3   S77  L30
	'#592ac6',  // 6P        H258 S78  L20
	'#808080',  // 10P       H0   S0   L29
	'#957a4d',  // 7P        H28  S41  L39
	'#2fa54b',  // 4P        H134 S53  L41
	'#a131a3',  // 8P        H315 S66  L26
	'#d1741d',  // 3P        H24  S78  L38
	'#2265be'   // 9P        H214 S78  L29
];

// 채널별 formula 적용 후 0~255로 clamp해 새 팔레트를 파생 (11~20P/21~30P 티어용)
$lib.Flip._deriveTier = function (baseColors, formula) {
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
$lib.Flip._PLAYER_COLORS_TIER1 = $lib.Flip._PLAYER_COLORS.slice(1);
$lib.Flip._PLAYER_COLORS_TIER2 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_TIER1, function (x) { return 255 - (5 / 3) * (255 - x); });
$lib.Flip._PLAYER_COLORS_TIER3 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_TIER2, function (x) { return x * 0.7; });

$lib.Flip._PLAYER_COLORS_DARK_TIER1 = $lib.Flip._PLAYER_COLORS_DARK.slice(1);
$lib.Flip._PLAYER_COLORS_DARK_TIER2 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_DARK_TIER1, function (x) { return x * (4 / 3); });
$lib.Flip._PLAYER_COLORS_DARK_TIER3 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_DARK_TIER2, function (x) { return x * 0.6 + 255 * 0.4; });

// 조회용 통합 팔레트: 인덱스 0=미소유, 1~10=Tier1, 11~20=Tier2, 21~30=Tier3
$lib.Flip._PLAYER_COLORS_FULL = [$lib.Flip._PLAYER_COLORS[0]].concat($lib.Flip._PLAYER_COLORS_TIER1, $lib.Flip._PLAYER_COLORS_TIER2, $lib.Flip._PLAYER_COLORS_TIER3);
$lib.Flip._PLAYER_COLORS_DARK_FULL = [$lib.Flip._PLAYER_COLORS_DARK[0]].concat($lib.Flip._PLAYER_COLORS_DARK_TIER1, $lib.Flip._PLAYER_COLORS_DARK_TIER2, $lib.Flip._PLAYER_COLORS_DARK_TIER3);

// 팀 배경색 — 라이트 모드
$lib.Flip._TEAM_COLORS = [
	'',         // 0: 팀 없음
	'#92B2FF',  // 팀 1 (A)
	'#9B92F8',  // 팀 2 (B)
	'#EE76A4',  // 팀 3 (C)
	'#FF9A72',  // 팀 4 (D)
	'#FFCA7A',  // 팀 5 (E)
	'#81EB78'   // 팀 6 (F)
];

// 팀 배경색 — 다크 모드 (기본색에 검은색 30% oklch 혼합)
$lib.Flip._TEAM_COLORS_DARK = [
	'',         // 0: 팀 없음
	'#3B579E',  // 팀 1 (A)
	'#483795',  // 팀 2 (B)
	'#88134C',  // 팀 3 (C)
	'#9E3900',  // 팀 4 (D)
	'#9E6C00',  // 팀 5 (E)
	'#108A0A'   // 팀 6 (F)
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
// N명분 색상 풀을 티어(1~10/11~20/21~30) 순서로 구성: 10명 단위는 전부, 나머지는 해당 티어에서 무작위 샘플
$lib.Flip._buildColorMap = function () {
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
	$data._flipColorMap = map;
};

// 컬러맵에 없는 플레이어(빌드 시점 이후 seq에 반영된 경우 등)를 위한 안전망 — 검은 화면 방지
$lib.Flip._assignFallbackColor = function (ownerId) {
	var used = {};
	for (var id in $data._flipColorMap) used[$data._flipColorMap[id]] = true;
	for (var c = 1; c <= 30; c++) {
		if (!used[c]) { $data._flipColorMap[ownerId] = c; return; }
	}
	$data._flipColorMap[ownerId] = (Object.keys($data._flipColorMap).length % 30) + 1;
};

$lib.Flip._getPlayerColor = function (ownerId) {
	var colors = document.body.classList.contains('dark-mode') ? $lib.Flip._PLAYER_COLORS_DARK_FULL : $lib.Flip._PLAYER_COLORS_FULL;
	if (!ownerId) return colors[0];
	if (!$data._flipColorMap) $data._flipColorMap = {};
	if (!$data._flipColorMap[ownerId]) $lib.Flip._assignFallbackColor(ownerId);
	return colors[$data._flipColorMap[ownerId]];
};

$lib.Flip._applyUserCardColors = function () {
	if (!$data._flipColorMap) return;
	var colors = document.body.classList.contains('dark-mode') ? $lib.Flip._PLAYER_COLORS_DARK_FULL : $lib.Flip._PLAYER_COLORS_FULL;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			var seqId = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			if (!$data._flipColorMap[seqId]) $lib.Flip._assignFallbackColor(seqId);
		}
	}
	var isDarkMode = document.body.classList.contains('dark-mode');
	for (var id in $data._flipColorMap) {
		var idx = $data._flipColorMap[id];
		var color = colors[idx];
		// 다크 모드에서 11p 이상(Tier2/3)은 원래 색보다 밝아서 흰 글씨로는 안 보이므로 검은 글씨로
		$("#game-user-" + id).css({
			'background-color': color,
			'color': (isDarkMode && idx > 10) ? '#000000' : ''
		});
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
	$(".jjoriping,.game-body").addClass("flip");
	$data._board = data.board;
	$data._owners = data.owners;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	if (mobile) $stage.game.here.css({ 'opacity': 0.3, 'top': '-35px' }).show();
	else $stage.game.here.hide();
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
	var isEnFlip = MODE[$data.room.mode] === 'EPF';

	for (i = 0; i < 50; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		word = $data._board[i] || "";
		owner = $data._owners[i];
		playerColor = $lib.Flip._getPlayerColor(owner);

		var isDark = document.body.classList.contains('dark-mode');
		var teamColors = isDark ? $lib.Flip._TEAM_COLORS_DARK : $lib.Flip._TEAM_COLORS;

		borderColor = '';
		bgColor = playerColor;
		if (owner) {
			teamId = $lib.Flip._getOwnerTeam(owner);
			if (teamId) {
				bgColor = teamColors[teamId] || playerColor;
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
				// 다크 모드에서 11p 이상(Tier2/3) 소유 칸은 배경이 밝아서 흰 글씨 대신 검은 글씨 사용
				'color': isDark ? ((owner && $data._flipColorMap[owner] > 10) ? '#000' : '#FFF') : (owner ? '#000' : '#FFF'),
				'font-weight': (isNyh || isEnFlip) ? 'normal' : 'bold',
				'font-size': isEnFlip ? '80%' : ''
			})
			.html(word)
		);
	}
};
$lib.Flip.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Flip.turnHint = function (data) {
	playSound('fail');
};
