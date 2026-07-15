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
$lib.Shuk.drawMaps = function () {
	var len = $data._maps.length;
	var cols = Math.max(2, Math.ceil(len / 18));
	var widthPct = (100 / cols) + "%";

	$stage.game.bb.empty();
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	$data._maps.sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});
	function $word(text) {
		var $R = $("<div>").addClass("bb-word").css('width', widthPct);
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
