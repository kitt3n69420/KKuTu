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

// ㅁ 배치(1 2 3 / 8 · 4 / 7 6 5) 각 위치의 좌표(%)
var SHUK_SLOTS = [
	{ top: '0%', left: '0%' },
	{ top: '0%', left: '33.333%' },
	{ top: '0%', left: '66.667%' },
	{ top: '33.333%', left: '66.667%' },
	{ top: '66.667%', left: '66.667%' },
	{ top: '66.667%', left: '33.333%' },
	{ top: '66.667%', left: '0%' },
	{ top: '33.333%', left: '0%' }
];

$lib.Shuk.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._maps = [];
	$lib.Shuk.drawMaps(); // clearBoard()는 .bb를 숨기기만 할 뿐 비우지 않으므로, 이전 라운드 단어 DOM이 그대로 남아있지 않도록 여기서 명시적으로 다시 그림
	if (data.totalRound) $data.room.round = data.totalRound;
	if (data.time) $data.room.time = data.time;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.show();
	if (mobile) $stage.game.here.css({ 'opacity': 0.3, 'top': '-35px' }).show();
	else $stage.game.here.hide();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Shuk.shukMove = function (data) {
	if ($data.room.opts.stop) return;
	var positions = data.positions;
	var i, $c;

	$data._positions = positions;
	if (!$data._shukEls) return;
	for (i = 0; i < positions.length; i++) {
		$c = $data._shukEls[positions[i]];
		if ($c) $c.css(SHUK_SLOTS[i]);
	}
};
$lib.Shuk.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (data.score) {
		$data._maps.push(data.value);
		if (id == $data.id) playSound('success');
		else playSound('mission');
		$lib.Shuk.drawMaps();
		addScore(id, data.score, data.totalScore);
		updateScore(id, getScore(id));
		drawObtainedScore($uc, $sc);
	} else {
		stopBGM();
		playSound('horr');
	}
};
// 단어 수가 100개를 넘어가면 재렌더를 200ms 간격으로 몰아서 실행 (봇이 빠르게 연속 제출할 때 매번 전체 목록을 다시 그리며 버벅이는 것을 완화)
$lib.Shuk.drawMaps = function () {
	if ($data._maps.length > 100) {
		if ($data._bbThrottleTimer) return;
		var wait = Math.max(0, 200 - (Date.now() - ($data._bbLastDraw || 0)));
		$data._bbThrottleTimer = setTimeout(function () {
			$data._bbThrottleTimer = null;
			$data._bbLastDraw = Date.now();
			$lib.Shuk._renderMaps();
		}, wait);
		return;
	}
	$lib.Shuk._renderMaps();
};
$lib.Shuk._renderMaps = function () {
	var len = $data._maps.length;
	// 컬럼(=줄) 증가 간격(STEP)과 축소 시작 시점(MAX_COLS): 모바일은 표시 공간이 훨씬 좁으므로 데스크톱보다 촘촘하게 잡음
	// SWITCH 이전엔 STEP개당 1컬럼씩, 그 이후는 MAX_COLS²*DIVISOR, (MAX_COLS+1)²*DIVISOR ... 식으로 늘어남
	var STEP = mobile ? 12 : 18;
	var MAX_COLS = mobile ? 2 : 6;
	var SWITCH = STEP * MAX_COLS;
	var DIVISOR = STEP / MAX_COLS;
	var cols = (len <= SWITCH) ? Math.max(2, Math.ceil(len / STEP)) : Math.ceil(Math.sqrt(len / DIVISOR));
	var widthPct = (100 / cols) + "%";

	$stage.game.bb.empty();
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	$data._maps.sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});

	// 컬럼(줄) 수가 MAX_COLS를 넘으면 그 비율만큼 셀 크기(너비/글자/여백)를 통째로 줄임
	// padding·margin도 같이 줄여야 칸 너비 대비 여백 비중이 커지지 않아, 줄이 늘어도 한 줄에 들어가는 글자 수가 유지됨
	if (cols > MAX_COLS) {
		var $chars = $stage.game.bb.find(".bb-char");
		var $sample = $chars.first();
		if ($sample.length) {
			var MIN_FONT = 3;
			var baseWidth = parseFloat($sample.css('width'));
			var baseFont = parseFloat($sample.css('font-size'));
			var basePadding = parseFloat($sample.css('padding-left'));
			var baseMargin = parseFloat($sample.css('margin-left'));
			// 모바일은 원래 크기의 절반(0.5) 밑으로는 더 안 줄어들게 축소 하한을 둠
			var floor = MIN_FONT / baseFont;
			if (mobile) floor = Math.max(floor, 0.5);
			var scale = Math.max(MAX_COLS / cols, floor);
			$chars.css({
				'width': (baseWidth * scale) + 'px',
				'font-size': (baseFont * scale) + 'px',
				'padding': (basePadding * scale) + 'px',
				'margin': (baseMargin * scale) + 'px'
			});
		}
	}
	function $word(text) {
		// 모바일은 컬럼 폭 대신 일반 텍스트처럼 가로로 흐르다 줄바꿈되게 폭을 지정하지 않음
		var $R = $("<div>").addClass("bb-word");
		if (!mobile) $R.css('width', widthPct);
		var i, len = text.length;
		var $c;

		for (i = 0; i < len; i++) {
			$R.append($c = $("<div>").addClass("bb-char").html(text.charAt(i)));
			if ($data.room.opts.drg) $c.css('color', getRandomColor());
		}
		return $R;
	}
};
$lib.Shuk.drawDisplay = function () {
	var $a = $("<div>").addClass("shuk-board");
	var positions = $data._positions || [];
	var i, $c;

	$data._shukEls = {};
	for (i = 0; i < positions.length; i++) {
		$c = $("<div>").addClass("shuk-char").css(SHUK_SLOTS[i]).html(positions[i]);
		if ($data.room.opts.drg) $c.css('color', getRandomColor());
		$a.append($c);
		$data._shukEls[positions[i]] = $c;
	}
	$stage.game.display.empty().append($a);
	$a.height($stage.game.display.height());
	$lib.Shuk.drawMaps();
};
$lib.Shuk.turnStart = function (data, spec) {
	$data._positions = data.positions;
	$lib.Shuk.drawDisplay();
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Shuk.turnGoing = $lib.Jaqwi.turnGoing;
