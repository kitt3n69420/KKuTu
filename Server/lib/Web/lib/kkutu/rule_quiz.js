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

$lib.Quiz = {};

$lib.Quiz.roundReady = function (data) {
	var tv = L['quiz_' + data.topic];
	var dv = "(" + L['quiz_' + data.difficulty] + ")";

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.display.html(tv + dv);
	$stage.game.items.hide();
	$stage.game.hints.show();
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html(tv)
		.css('text-align', "center");
	drawRound(data.round);
	playSound('round_start');
	clearInterval($data._tTime);
};

$lib.Quiz.turnStart = function (data) {
	$(".game-user-current").removeClass("game-user-current");
	$(".game-user-bomb").removeClass("game-user-bomb");
	if ($data.room.game.seq.indexOf($data.id) >= 0) {
		$stage.game.here.css('opacity', 1).show();
	} else {
		$stage.game.here.css('opacity', mobile ? 0.5 : 0).show();
	}

	// 문제 표시 (jaqwi와 다른 부분)
	var qVal = data.question;
	if ($data.room.opts.drg) qVal = "<label style='color:" + getRandomColor() + "'>" + qVal + "</label>";
	$stage.game.display.html($data._question = qVal);

	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};

$lib.Quiz.turnGoing = function () {
	var $rtb = $stage.game.roundBar;
	var bRate;
	var tt;

	if (!$data.room || !$data.room.gaming) clearInterval($data._tTime);
	$data._roundTime -= TICK;

	tt = $data._spectate ? L['stat_spectate'] : ($data._roundTime * 0.001).toFixed(1) + L['SECOND'];
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html(tt);

	if (!$rtb.hasClass("round-extreme")) if ($data._roundTime <= $data._fastTime) {
		if ($data.bgm) {
			bRate = $data.bgm.currentTime / $data.bgm.duration;
			if ($data.bgm.paused) stopBGM();
			else playBGM('jaqwiF');
			$data.bgm.currentTime = $data.bgm.duration * bRate;
		}
		$rtb.addClass("round-extreme");
	}
};

$lib.Quiz.turnHint = function (data) {
	playSound('mission');
	pushHint(data.hint);
};

$lib.Quiz.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (data.giveup) {
		$uc.addClass("game-user-bomb");
	} else if (data.answer) {
		$stage.game.here.css('opacity', mobile ? 0.5 : 0);
		var ansColor = ($data.room.opts.drg) ? getRandomColor() : "#FFFF44";
		$stage.game.display.html($("<label>").css('color', ansColor).html(data.answer));
		stopBGM();
		playSound('horr');
	} else {
		if (id == $data.id) $stage.game.here.css('opacity', mobile ? 0.5 : 0);
		addScore(id, data.score, data.totalScore);
		if ($data._roundTime > 10000) $data._roundTime = 10000;
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id)).addClass("game-user-current");
		playSound('success');
	}
};
