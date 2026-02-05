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

$lib.Daneo.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	var theme = (typeof data.theme == "object")
		? data.theme.map(function (e) { return L['theme_' + e]; }).join(",")
		: L['theme_' + data.theme];
	var tStr = "&lt;" + theme + "&gt;";
	if ($data.room.opts.drg) tStr = "<label style='color:" + getRandomColor() + "'>" + tStr + "</label>";
	$stage.game.display.html($data._char = tStr);
	$stage.game.chain.show().html($data.chain = 0);
	if ($data.room.opts.mission) {
		$stage.game.items.show().css('opacity', 1).html($data.mission = data.mission);
	}
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};
$lib.Daneo.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	$stage.game.display.html($data._char);
	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		// 입력창은 항상 표시, 자기 턴일 때만 불투명 (비활성: 모바일 0.5, 데스크톱 0)
		var inactiveOpacity = mobile ? 0.5 : 0;
		$stage.game.here.css('opacity', (data.id == $data.id) ? 1 : inactiveOpacity).show();
		if (data.id == $data.id) {
			$data._relay = true;
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}
	$stage.game.items.html($data.mission = data.mission);

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._chars = [data.char, data.subChar];
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
$lib.Daneo.turnGoing = $lib.Classic.turnGoing;
$lib.Daneo.turnEnd = function (id, data) {
	var baseScore = data.score - (data.bonus || 0) - (data.straightBonus || 0);
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + baseScore) : data.score);
	var $uc = $(".game-user-current");
	var hi;

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	// ========== 서바이벌 모드 처리 ==========
	if (handleSurvivalKO(id, data, $sc, $uc)) return;
	handleSurvivalDamage(data);
	// ========== 서바이벌 모드 끝 ==========

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		clearTimeout($data._fail);
		$stage.game.here.css('opacity', mobile ? 0.5 : 0);
		$stage.game.chain.html(++$data.chain);
		pushDisplay(data.value, data.mean, data.theme, data.wc, false, null, data.straightBonus > 0);
	} else {
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		$stage.game.here.css('opacity', mobile ? 0.5 : 0);
		playSound('timeout');
	}
	if (data.hint) {
		data.hint = data.hint._id;
		hi = data.hint.indexOf($data._chars[0]);
		if (hi == -1) hi = data.hint.indexOf($data._chars[1]);

		$stage.game.display.empty()
			.append($("<label>").html(data.hint.slice(0, hi + 1)))
			.append($("<label>").css('color', "#AAAAAA").html(data.hint.slice(hi + 1)));
	}
	// 서바이벌 모드에서는 자신의 점수/보너스 스플래시 숨김 (데미지만 표시)
	if (!data.survival) {
		if (data.bonus) {
			mobile ? $sc.html("+" + baseScore + "+" + data.bonus) : addTimeout((function ($target) {
				return function () {
					var $bc = $("<div>")
						.addClass("deltaScore bonus")
						.css('color', '#66FF66') // Green
						.html("+" + data.bonus);

					drawObtainedScore($target, $bc);
				};
			})($uc), 500);
		}
		if (data.straightBonus) {
			mobile ? $sc.append("+" + data.straightBonus) : addTimeout((function ($target) {
				return function () {
					var $bc = $("<div>")
						.addClass("deltaScore straight-bonus")
						.css('color', '#FFFF00') // Yellow
						.html("+" + data.straightBonus);

					drawObtainedScore($target, $bc);
				};
			})($uc), 800);
		}
		drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	} else {
		// 서바이벌 모드: 스플래시 없이 current 클래스만 제거
		$uc.removeClass("game-user-current").css('border-color', '');
	}
	updateScore(id, getScore(id));
};
