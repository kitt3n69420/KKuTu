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

$lib.Sock.roundReady = function (data, spec) {
	var turn = data.seq ? data.seq.indexOf($data.id) : -1;

	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._va = [];
	$data._lang = RULE[MODE[$data.room.mode]].lang;
	$data._board = data.board;
	$data._gameBoard = data.board;
	$data._maps = [];

	// apple 규칙 활성화 시 원래 설정 백업
	if ($data.room.opts && $data.room.opts.apple && !$data._originalSettings) {
		$data._originalSettings = {
			round: $data.room.round,
			time: $data.room.time
		};
	}

	// 서버에서 받은 effectiveRound와 effectiveTime을 사용 (apple 규칙 적용 시 서버에서 이미 계산됨)
	if (data.totalRound) $data.room.round = data.totalRound;
	if (data.time) $data.room.time = data.time;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.show();
	if (mobile) $stage.game.here.css({ 'opacity': 0.3, 'top': '-35px' }).show();
	else $stage.game.here.hide();
	$lib.Sock.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);

	// Bad Apple Logic
	if ($data._aplInterval) clearInterval($data._aplInterval);
	$data._aplMode = false;
	console.log("[APL] Checking apple option:", $data.room.opts, "apple=", $data.room.opts ? $data.room.opts.apple : "no opts");
	if ($data.room.opts && $data.room.opts.apple) {
		console.log("[APL] APL mode detected! Starting Bad Apple...");
		$data._aplMode = true;
		stopBGM();

		// 먼저 LZ-String 라이브러리 로드 (CDN 사용)
		$.getScript('https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js', function () {
			console.log("[APL] LZ-String library loaded");

			// 압축된 배드 애플 데이터 로드
			$.getScript('/js/bad_apple_data.js', function () {
				console.log("[APL] Compressed data loaded, decompressing...");

				// 압축 해제
				if (window.badAppleCompressed && window.LZString) {
					var decompressed = LZString.decompressFromBase64(window.badAppleCompressed);
					window.badAppleFrames = decompressed.split('|');
					console.log("[APL] Decompressed frames:", window.badAppleFrames.length);
				} else if (window.badAppleFrames) {
					// 이미 압축 해제된 데이터가 있는 경우 (하위 호환성)
					console.log("[APL] Using uncompressed frames:", window.badAppleFrames.length);
				} else {
					console.error("[APL] No frame data available!");
					return;
				}

				loadSounds([{ key: 'apple', value: '/media/common/apple.mp3' }], function () {
					console.log("[APL] Sound loaded, starting playback...");
					var frameIdx = 0;
					stopBGM();
					playSound('apple');
					$data._aplInterval = _setInterval(function () {
						if (frameIdx >= window.badAppleFrames.length) {
							clearInterval($data._aplInterval);
							return;
						}
						$data._aplFrame = window.badAppleFrames[frameIdx];
						$lib.Sock.drawDisplay();
						frameIdx++;
					}, 100);
				});
			});
		});
	}
};
$lib.Sock.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);
	var key;
	var i, j, l;

	if (data.score) {
		key = data.value;
		l = key.length;
		$data._maps.push(key);
		for (i = 0; i < l; i++) {
			if ($data._aplMode && $data._gameBoard) {
				$data._gameBoard = $data._gameBoard.replace(key.charAt(i), "　");
			} else {
				$data._board = $data._board.replace(key.charAt(i), "　");
			}
		}
		if (id == $data.id) {
			playSound('success');
		} else {
			playSound('mission');
		}
		$lib.Sock.drawDisplay();
		addScore(id, data.score, data.totalScore);
		updateScore(id, getScore(id));
		drawObtainedScore($uc, $sc);
	} else {
		stopBGM();
		$data._relay = false;
		playSound('horr');
	}
};
// 단어 수가 100개를 넘어가면 재렌더를 200ms 간격으로 몰아서 실행 (봇이 빠르게 연속 제출할 때 매번 전체 목록을 다시 그리며 버벅이는 것을 완화)
$lib.Sock.drawMaps = function () {
	if ($data._maps.length > 100) {
		if ($data._bbThrottleTimer) return;
		var wait = Math.max(0, 200 - (Date.now() - ($data._bbLastDraw || 0)));
		$data._bbThrottleTimer = setTimeout(function () {
			$data._bbThrottleTimer = null;
			$data._bbLastDraw = Date.now();
			$lib.Sock._renderMaps();
		}, wait);
		return;
	}
	$lib.Sock._renderMaps();
};
$lib.Sock._renderMaps = function () {
	var len = $data._maps.length;
	// 컬럼(=줄) 증가 간격(STEP)과 축소 시작 시점(MAX_COLS): 모바일은 표시 공간이 훨씬 좁으므로 데스크톱보다 촘촘하게 잡음
	// SWITCH 이전엔 STEP개당 1컬럼씩, 그 이후는 MAX_COLS²*DIVISOR, (MAX_COLS+1)²*DIVISOR ... 식으로 늘어남
	var STEP = mobile ? 12 : 18;
	var MAX_COLS = mobile ? 2 : 6;
	var SWITCH = STEP * MAX_COLS;
	var DIVISOR = STEP / MAX_COLS;
	var cols = (len <= SWITCH) ? Math.max(2, Math.ceil(len / STEP)) : Math.ceil(Math.sqrt(len / DIVISOR));

	$stage.game.bb.empty();
	// $stage.game.bb.css('--bb-cols', cols); // Removed CSS var approach
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	var widthPct = (100 / cols) + "%"; // Calculate percentage directly

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
			// if(text.charAt(i) != "？") $c.css('color', "#EEEEEE");
		}
		return $R;
	}
};
$lib.Sock.drawDisplay = function () {
	var $a = $("<div>").css('height', "100%"), $c;
	var boardStr = $data._board;

	// apple 모드: 배드 애플 프레임과 게임 보드 합성
	// 프레임 데이터는 14x11(154자), 위 1줄/아래 2줄은 항상 흰색(글자 표시)
	if ($data._aplMode && $data._aplFrame && $data._gameBoard) {
		var merged = '';
		for (var mi = 0; mi < 196; mi++) {
			var fi = mi - 14;
			var isBlack = (fi >= 0 && fi < $data._aplFrame.length && $data._aplFrame[fi] === '.');
			if (isBlack) {
				merged += '.';
			} else {
				var gc = mi < $data._gameBoard.length ? $data._gameBoard[mi] : '□';
				merged += (gc && gc !== '　') ? gc : '□';
			}
		}
		boardStr = merged;
	}

	var va = boardStr.split("");
	var len = Math.sqrt(boardStr.length);
	var size = (len >= 14) ? "7.1%" : "10%";
	var fontSize = (len > 10) ? "15px" : "";

	$a.css({ 'display': 'flex', 'flex-wrap': 'wrap', 'align-content': 'flex-start' });

	va.forEach(function (item, index) {
		$a.append($c = $("<div>").addClass("sock-char sock-" + item).css({ width: size, height: size, 'font-size': fontSize }).html(item));
		if ($data.room.opts.drg) $c.css('color', getRandomColor());
		if ($data._va[index] && $data._va[index] != item) {
			$c.html($data._va[index]).addClass("sock-picked").animate({ 'opacity': 0 }, 500);
		}
	});
	$data._va = va;
	$stage.game.display.empty().append($a);
	$lib.Sock.drawMaps();
};
$lib.Sock.turnStart = function (data, spec) {
	var i, j;

	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	// APL 모드에서는 jaqwi BGM 재생하지 않음
	if (!$data._aplMode) {
		playBGM('jaqwi');
	}
};
$lib.Sock.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Sock.turnHint = function (data) {
	playSound('fail');
};
