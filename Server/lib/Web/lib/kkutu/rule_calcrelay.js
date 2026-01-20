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

$lib.Calcrelay = {};

$lib.Calcrelay.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	var qStr = data.question;
	if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
	$stage.game.display.html($data._question = qStr);
	$stage.game.chain.show().html($data.chain = 0);
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Calcrelay.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	if (data.question) {
		var qStr = data.question;
		if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
		$stage.game.display.html($data._question = qStr);
	}

	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		var inactiveOpacity = mobile ? 0.5 : 0;
		$stage.game.here.css('opacity', (data.id == $data.id) ? 1 : inactiveOpacity).show();
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

$lib.Calcrelay.turnGoing = $lib.Classic.turnGoing;

$lib.Calcrelay.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + data.score) : data.score);
	var $uc = $(".game-user-current");

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	addScore(id, data.score, data.totalScore);
	clearInterval($data._tTime);
	if (data.ok) {
		clearTimeout($data._fail);
		$stage.game.here.css('opacity', mobile ? 0.5 : 0);
		$stage.game.chain.html(++$data.chain);
		// 정답 표시 (daneo/free처럼 pushDisplay 사용)
		pushDisplay(data.value, null, null, null, false, null, false);
		// 다음 문제 표시 (pushDisplay 애니메이션 후)
		if (data.nextQuestion) {
			$data._question = data.nextQuestion;
		}
	} else {
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		$stage.game.here.css('opacity', mobile ? 0.5 : 0);
		playSound('timeout');
		// 정답 표시 후 원래 문제 복원
		if (data.answer !== undefined) {
			$stage.game.display.empty()
				.append($("<label>").html(data.answer));
			// 잠시 후 원래 문제로 복원
			addTimeout(function() {
				var qStr = $data._question;
				if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
				$stage.game.display.html(qStr);
			}, 1500);
		}
	}
	drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	updateScore(id, getScore(id));
};
