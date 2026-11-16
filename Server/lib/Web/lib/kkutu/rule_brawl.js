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

/**
 * Brawl (난투 잇기) - 클라이언트 UI
 * 잇기 대결 화면을 바탕으로, 가운데 글자(쿼드코어는 4칸)를 모두가 함께 씀.
 * 누가 이은 단어든 모두의 글자·기록·체인 수가 바뀌고, 노란 바에는 마지막 단어와 이은 사람을 보여 줌.
 * 실패·한발 늦음은 서버가 본인에게만 turnError로 알림 (body.js turnError가 단어 창에 잠깐 띄우고 $data._char로 되돌림)
 */

$lib.Brawl = {};
$lib.Brawl._restTimer = null;

// 가운데 글자 칸을 그림. 쿼드코어는 칸마다 label, 방금 바뀐 칸(fresh)은 강조
$lib.Brawl.drawSlots = function (fresh) {
	var slots = $data._brawlSlots || [];
	var html = slots.map(function (s, i) {
		var t = getCharText(s.char, s.subChar);

		return slots.length > 1 ? "<label class='brawl-slot" + (i === fresh ? " brawl-fresh" : "") + "'>" + t + "</label>" : t;
	}).join("");

	$stage.game.display.toggleClass("brawl-quad", slots.length > 1).html($data._char = html);
};

$lib.Brawl.roundReady = function (data) {
	if ($lib.Brawl._restTimer) {
		clearTimeout($lib.Brawl._restTimer);
		$lib.Brawl._restTimer = null;
	}

	$data._chatter = $stage.talk;
	clearBoard();
	$data._round = data.round;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data._brawlSlots = data.slots || [];
	$data._brawlOut = false;
	$data.chain = data.chain || 0;

	$lib.Brawl.drawSlots(-1);
	$stage.game.chain.show().html($data.chain);
	$(".game-user-bomb").removeClass("game-user-bomb");
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.text(L['brawlHelp'])
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Brawl.turnStart = function (data) {
	// 모두가 동시에 입력 (잇기 대결과 같음)
	if (!$data._spectate && !$data._brawlOut) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._tTime = addInterval($lib.Brawl.turnGoing, TICK);
	$data._roundTime = data.roundTime;

	playBGM('jaqwi');
	recordEvent('turnStart', { data: data });
};

$lib.Brawl.turnGoing = function () {
	var $rtb = $stage.game.roundBar;
	var bRate;

	if (!$data.room || !$data.room.gaming) {
		clearInterval($data._tTime);
		return;
	}
	$data._roundTime -= TICK;
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html($data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND']);

	// 10초 경고
	if (!$rtb.hasClass("round-extreme") && $data._roundTime <= $data._fastTime) {
		if ($data.bgm) {
			bRate = $data.bgm.currentTime / $data.bgm.duration;
			if ($data.bgm.paused) stopBGM();
			else playBGM('jaqwiF');
			$data.bgm.currentTime = $data.bgm.duration * bRate;
		}
		$rtb.addClass("round-extreme");
	}
};

$lib.Brawl.turnEnd = function (id, data) {
	var $uc = $("#game-user-" + id);
	var u, name;

	if (data.ok) {
		// 누가 이었든 그 칸의 글자가 모두에게 바뀜 (실패 문구가 떠 있으면 바로 새 글자로)
		$data._brawlSlots[data.slot] = { char: data.char, subChar: data.subChar };
		clearTimeout($data._fail);
		$lib.Brawl.drawSlots($data._brawlSlots.length > 1 ? data.slot : -1);
		$stage.game.chain.html($data.chain = data.chain);
		pushHistory(data.value, data.mean, data.theme);

		u = $data.users[id] || $data.robots[id];
		name = u && u.profile ? (u.profile.title || u.profile.name) : "";
		$(".jjo-turn-time .graph-bar").text(badWords(data.value) + (name ? " · " + name : ""));

		if (id == $data.id) playSound('mission');
		addScore(id, data.score, data.totalScore);
		drawObtainedScore($uc, $("<div>").addClass("deltaScore").html("+" + data.score));
		updateScore(id, getScore(id));
	} else if (data.out) {
		// 낙장불입 탈락
		if (id == $data.id) {
			$data._brawlOut = true;
			$data._relay = false;
			mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
			$(".jjo-turn-time .graph-bar").html("GAME OVER");
		}
		$uc.addClass("game-user-bomb");
		playSound('timeout');
	} else if (data.speed) {
		// 라운드 종료: 이번 라운드에 각자 이은 단어 수를 잠깐 보여 줌 (잇기 대결의 drawChainSpeed)
		clearInterval($data._tTime);
		$data._relay = false;
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();

		addTimeout(drawChainSpeed, 1000, data.speed);
		stopBGM();
		playSound('horr');

		if ($data._round < $data.room.round) $lib.Brawl.restGoing(10);
	}
};

$lib.Brawl.restGoing = function (rest) {
	$(".jjo-turn-time .graph-bar").html(rest + L['afterRun']);
	$lib.Brawl._restTimer = (rest > 0) ? addTimeout($lib.Brawl.restGoing, 1000, rest - 1) : null;
};
