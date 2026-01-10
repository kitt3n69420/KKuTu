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
	// 솎솎은 채팅창으로 입력하므로 게임 입력창 숨김
	$stage.game.here.hide();
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

		// 먼저 LZ-String 라이브러리 로드
		$.getScript('/js/lz-string.min.js', function () {
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
						$data._board = window.badAppleFrames[frameIdx];
						while ($data._board.length < 196) $data._board += ".";
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
			$data._board = $data._board.replace(key.charAt(i), "　");
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
$lib.Sock.drawMaps = function () {
	var len = $data._maps.length;

	var cols = Math.max(2, Math.ceil(len / 18));

	$stage.game.bb.empty();
	// $stage.game.bb.css('--bb-cols', cols); // Removed CSS var approach
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	var widthPct = (100 / cols) + "%"; // Calculate percentage directly

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
			// if(text.charAt(i) != "？") $c.css('color', "#EEEEEE");
		}
		return $R;
	}
};
$lib.Sock.drawDisplay = function () {
	var $a = $("<div>").css('height', "100%"), $c;
	var va = $data._board.split("");
	var len = Math.sqrt($data._board.length);
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
