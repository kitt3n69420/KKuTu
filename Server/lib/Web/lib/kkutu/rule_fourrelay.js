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

$lib.Fourrelay = {};

// 코옵 모드 체인 표시: "(현재 체인 수) / (목표 문제 수)"
function getFourrelayChainDisplay() {
	var target = ($data.room.coopTarget !== undefined) ? $data.room.coopTarget : $data.room.round;
	return $data.chain + " / " + target;
}
function getFourrelayClueHtml(clue) {
	var qStr = clue + new Array(clue.length + 1).join("○");
	if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
	return qStr;
}

$lib.Fourrelay.roundReady = function (data) {
	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$stage.game.display.html($data._question = getFourrelayClueHtml(data.clue));
	$data.chain = 0;
	$stage.game.chain.show().html(getFourrelayChainDisplay());
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Fourrelay.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	if (data.clue) {
		$stage.game.display.html($data._question = getFourrelayClueHtml(data.clue));
	}

	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
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
	recordEvent('turnStart', { data: data });
};

$lib.Fourrelay.turnGoing = $lib.Classic.turnGoing;

$lib.Fourrelay.turnEnd = function (id, data) {
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
		$data.chain++;
		$stage.game.chain.html(getFourrelayChainDisplay());

		// 코옵 목표 문제수를 채운 마지막 턴이면, pushDisplay 애니메이션이 다 끝난 뒤에
		// roundEnd의 "성공!" 표시가 뜨도록 완료 콜백으로 순서를 맞춘다(경쟁 상태 방지).
		var isCoopFinalTurn = data.coopTarget !== undefined && data.coopTurn !== undefined && data.coopTurn >= data.coopTarget;
		if (isCoopFinalTurn) {
			$data._coopFinalAnimPending = true;
			pushDisplay(data.value, null, null, null, false, null, false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, function () {
				$data._coopFinalAnimPending = false;
				if ($data._pendingCoopRoundEnd) {
					var pending = $data._pendingCoopRoundEnd;
					$data._pendingCoopRoundEnd = null;
					roundEnd(pending.result, pending.data);
				}
			});
		} else {
			// 정답 단어 4글자를 모두 보여준다.
			pushDisplay(data.value, null, null, null, false, null, false);
		}
		if (data.nextClue) {
			$data._question = getFourrelayClueHtml(data.nextClue);
		}
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
		if (data.answer !== undefined) {
			$stage.game.display.empty()
				.append($("<label>").html(data.answer));
			addTimeout(function () {
				$stage.game.display.html($data._question);
			}, 1500);
		}
	}
	drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	updateScore(id, getScore(id));
};
