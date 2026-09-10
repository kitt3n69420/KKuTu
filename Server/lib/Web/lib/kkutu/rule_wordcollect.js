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

$lib.Wordcollect = {};

// 방 전체 점수 합(S)을 0~100 밝기로 변환: 0~20은 선형(20당 10), 20 이상은 배로 늘 때마다 +10 (320→50, 10240→100), 100 이상은 고정
function wcMoonBrightness(roomScore) {
	var s = roomScore || 0;
	if (s <= 0) return 0;
	if (s <= 20) return s / 2;
	return Math.min(100, 10 + 10 * Math.log2(s / 20));
}
// 밝기(0~100)를 달 색으로 보간: 0=어두운 갈색, 50=금색, 100=크림색
var WC_MOON_STOPS = [
	{ p: 0, c: [57, 42, 24] },
	{ p: 50, c: [255, 200, 0] },
	{ p: 100, c: [253, 254, 241] }
];
function wcMoonColor(pct) {
	var i, a, b, t;
	pct = Math.max(0, Math.min(100, pct));
	for (i = 0; i < WC_MOON_STOPS.length - 1; i++) {
		a = WC_MOON_STOPS[i];
		b = WC_MOON_STOPS[i + 1];
		if (pct <= b.p) {
			t = (pct - a.p) / (b.p - a.p);
			return [
				Math.round(a.c[0] + (b.c[0] - a.c[0]) * t),
				Math.round(a.c[1] + (b.c[1] - a.c[1]) * t),
				Math.round(a.c[2] + (b.c[2] - a.c[2]) * t)
			];
		}
	}
	return WC_MOON_STOPS[WC_MOON_STOPS.length - 1].c;
}
function wcRgb(rgb) {
	return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
}
function wcBlendWhite(rgb, p) {
	return [
		Math.round(rgb[0] + (255 - rgb[0]) * p),
		Math.round(rgb[1] + (255 - rgb[1]) * p),
		Math.round(rgb[2] + (255 - rgb[2]) * p)
	];
}
function wcApplyMoonColor(pct) {
	var $moon = $data._wcNight ? $data._wcNight.find(".wc-moon") : null;
	var rgb;

	if (!$moon || !$moon.length) return;
	rgb = wcMoonColor(pct);
	// jQuery 1.9의 .css()는 CSS 커스텀 프로퍼티(--*)를 camelCase로 잘못 변환해 무시하므로 setProperty를 직접 사용
	$moon[0].style.setProperty('--moon-color', wcRgb(rgb));
	$moon[0].style.setProperty('--moon-highlight', wcRgb(wcBlendWhite(rgb, 0.1)));
	$moon[0].style.setProperty('--moon-glow', 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.6)');
}
function wcFlyWordToMoon($uc, text) {
	var $moon = $data._wcNight ? $data._wcNight.find(".wc-moon") : null;
	if (!$moon || !$moon.length || !$uc || !$uc.length) return;

	var start = $uc.offset();
	var end = $moon.offset();
	var $fly = $("<div>").addClass("wc-fly-word").text(text).css({
		left: start.left + $uc.outerWidth() / 2,
		top: start.top + $uc.outerHeight() / 2
	});
	$("body").append($fly);
	$fly.animate({
		left: end.left + $moon.outerWidth() / 2,
		top: end.top + $moon.outerHeight() / 2,
		opacity: 0
	}, 700, function () { $fly.remove(); });
}

$lib.Wordcollect.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$data.room.round = 1;
	$data._maps = [];
	$(".jjoriping,.rounds,.game-body").addClass("cw wordcollect");

	if (!$data._wcNight) {
		$data._wcNight = $("<div>").addClass("wc-night-overlay").append(
			$("<div>").addClass("wc-stars"),
			$("<div>").addClass("wc-moon"),
			$("<div>").addClass("wc-condition"),
			$("<div>").addClass("wc-timer"),
			$("<div>").addClass("wc-dust-count")
		);
		$(".GameBox").prepend($data._wcNight);
	}
	wcApplyMoonColor(wcMoonBrightness(data.totalScore || 0));

	if (data.time) $data.room.time = data.time;
	$data._roundTime = $data.room.time * 1000;
	$data._wcNight.find(".wc-condition").html(L['wcCondition_' + data.condition] || '');
	$data._wcNight.find(".wc-timer").text((Math.max(0, $data._roundTime) / 1000).toFixed(1));
	$data._wcNight.find(".wc-dust-count").text(data.totalScore || 0);
	$stage.game.items.hide();
	$stage.game.bb.show();
	$lib.Wordcollect.drawMaps();
	$stage.game.display.html(L['wcCondition_' + data.condition] || '');
	drawRound(data.round || 1);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Wordcollect.turnStart = function (data) {
	$(".jjoriping,.rounds").addClass("wc-round-active");
	if ($data._wcNight) $data._wcNight.addClass("wc-active");
	if (typeof data.roundTime === 'number') $data._roundTime = data.roundTime;
	// 서버가 보낸 남은 시간을 벽시계 기준 종료 시각으로 고정해두고, 매 tick마다 setInterval 누적 오차 대신
	// Date.now()와의 차이로 다시 계산 (백그라운드 탭 등에서 setInterval이 밀려도 표시가 실제 서버 시간과 어긋나지 않음)
	$data._wcEndAt = Date.now() + $data._roundTime;
	clearInterval($data._tTime);
	$data._tTime = addInterval($lib.Wordcollect.turnGoing, TICK);
	playBGM('moondust');
};
$lib.Wordcollect.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) return clearInterval($data._tTime);
	$data._roundTime = $data._wcEndAt - Date.now();

	if ($data._wcNight) {
		if ($data._roundTime <= 0) {
			$data._wcNight.find(".wc-timer").text(L['wcTimeUp'] || '');
			clearInterval($data._tTime);
			stopBGM();
		} else {
			$data._wcNight.find(".wc-timer").text(($data._roundTime / 1000).toFixed(1));
		}
	}
};
$lib.Wordcollect.turnEnd = function (id, data) {
	if (!data || !data.target) {
		stopBGM();
		playSound('horr');
		return;
	}

	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	$data._maps.push(data.value);
	$lib.Wordcollect.drawMaps();

	wcApplyMoonColor(wcMoonBrightness(data.roomScore));
	if ($data._wcNight) $data._wcNight.find(".wc-dust-count").text(data.roomScore);
	wcFlyWordToMoon($uc, data.value);

	if (id == $data.id) playSound('success');
	else playSound('mission');

	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	drawObtainedScore($uc, $sc);
};
// sock/shuk 모드의 공용 단어 목록 렌더링과 동일한 패턴 (칸 수에 따라 폰트/여백을 축소)
$lib.Wordcollect.drawMaps = function () {
	if ($data._maps.length > 100) {
		if ($data._bbThrottleTimer) return;
		var wait = Math.max(0, 200 - (Date.now() - ($data._bbLastDraw || 0)));
		$data._bbThrottleTimer = setTimeout(function () {
			$data._bbThrottleTimer = null;
			$data._bbLastDraw = Date.now();
			$lib.Wordcollect._renderMaps();
		}, wait);
		return;
	}
	$lib.Wordcollect._renderMaps();
};
$lib.Wordcollect._renderMaps = function () {
	var len = $data._maps.length;
	var STEP = mobile ? 12 : 18;
	var MAX_COLS = mobile ? 2 : 6;
	var SWITCH = STEP * MAX_COLS;
	var DIVISOR = STEP / MAX_COLS;
	var cols = (len <= SWITCH) ? Math.max(2, Math.ceil(len / STEP)) : Math.ceil(Math.sqrt(len / DIVISOR));
	var widthPct = (100 / cols) + "%";

	$stage.game.bb.empty();
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	$data._maps.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});

	if (cols > MAX_COLS) {
		var $chars = $stage.game.bb.find(".bb-char");
		var $sample = $chars.first();
		if ($sample.length) {
			var MIN_FONT = 3;
			var baseWidth = parseFloat($sample.css('width'));
			var baseFont = parseFloat($sample.css('font-size'));
			var basePadding = parseFloat($sample.css('padding-left'));
			var baseMargin = parseFloat($sample.css('margin-left'));
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
		var $R = $("<div>").addClass("bb-word");
		if (!mobile) $R.css('width', widthPct);
		var i, len = text.length;

		for (i = 0; i < len; i++) {
			$R.append($("<div>").addClass("bb-char").html(text.charAt(i)));
		}
		return $R;
	}
};
