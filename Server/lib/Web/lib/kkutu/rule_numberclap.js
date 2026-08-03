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

$lib.Numberclap = {};

// 체인 수를 알려주면 게임이 쉬워지므로 항상 "-"로 고정 표시한다.
$lib.Numberclap.roundReady = function (data) {
	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	// free 모드와 동일하게, 대기 중에는 "<369 게임>" 표지를 계속 띄워둔다.
	$stage.game.display.html($data._char = "&lt;" + L['modeCNC'] + "&gt;");
	$stage.game.chain.show().html('-');
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Numberclap.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	if (!($data._tid = $data.room.game.seq[data.turn])) return;
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	// 다음 숫자를 미리 보여주면 암산 게임이 무의미해지므로, 이전 턴 결과 대신
	// "<369 게임>" 표지로 되돌린다 (free 모드가 $data._char를 복원하는 것과 동일).
	$stage.game.display.html($data._char);

	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if (!$data._replay) {
		if (data.id == $data.id) {
			$stage.game.here.css('opacity', 1).show();
		} else if (mobile) {
			$stage.game.here.css('opacity', 0.5).show();
		} else {
			$stage.game.here.hide();
		}
		if (data.id == $data.id) {
			$data._relay = true;
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._speed = data.speed;
	$data._tTime = addInterval(turnGoing, TICK);
	$data.turnTime = data.turnTime;
	$data._turnTime = data.turnTime;
	$data._roundTime = data.roundTime;
	$data._turnSound = playSound("T" + data.speed);
	recordEvent('turnStart', {
		data: data
	});
};

$lib.Numberclap.turnGoing = $lib.Classic.turnGoing;

// pushDisplay(body-render.js)와 같은 느낌(순차 페이드인 + 타이핑/미션 사운드)의
// numberclap 전용 표시 함수. pushDisplay는 두 가지가 안 맞는다:
//   1) 글자를 UTF-16 코드유닛 단위(text.charAt)로 쪼개 반복 표시하므로, 서로게이트
//      페어인 👏(U+1F44F) 같은 이모지가 절반씩 별개로 그려져 깨진다.
//   2) 끝에 항상 pushHistory를 호출해 히스토리에 실제 값이 남는다.
// 이 함수는 Array.from으로 유니코드 코드포인트 단위로 순회해 이모지를 한 덩어리로
// 안전하게 표시하고, 히스토리는 아예 호출하지 않는다.
function pushNumberclapDisplay(text, useMissionSound) {
	var units = Array.from(text);
	var len = units.length;
	var sg = $data.turnTime / 12;
	var j = '';
	var i;

	$stage.game.display.empty();
	for (i = 0; i < len; i++) {
		addTimeout((function (idx) {
			return function () {
				playSound(useMissionSound ? 'mission' : ('As' + $data._speed));
				j += units[idx];
				$stage.game.display.html(j);
			};
		})(i), i * sg / len);
	}
	addTimeout(function () {
		playSound('K' + $data._speed);
	}, sg);
}

function renderNumberclapResult(data) {
	pushNumberclapDisplay(data.value, data.isClap);
}

$lib.Numberclap.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + data.score) : data.score);
	var $uc = $(".game-user-current");

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		checkFailCombo();
		clearTimeout($data._fail);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		renderNumberclapResult(data);
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
		if (data.hint) {
			$stage.game.display.empty().append($("<label>").html(data.hint));
		}
	}
	drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	updateScore(id, getScore(id));
};
