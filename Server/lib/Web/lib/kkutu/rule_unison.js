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
 * Unison (이구동성) - 클라이언트 UI
 * 라운드 준비 중에는 질문이 단어 창, 선택지가 노란 바에 나오고, 라운드가 시작되면 서로 자리를 바꿔 선택지가 단어 창으로 감.
 * 내가 고른 선택지는 단어 창에서 노랗게. 라운드 중에는 아직 안 고른 사람 카드에 차례 효과(game-user-current)를 주고,
 * 고르면 그 카드에서 뺌. 라운드가 끝나면 점수를 못 받은 사람 카드에 실패 효과(game-user-bomb), 누가 무엇을 골랐는지는 알림으로.
 * 한 번 고르면 입력창을 닫음 (그 뒤 입력과 채팅은 서버가 막고 알림을 보냄)
 */

$lib.Unison = {};

function unisonSeqIds() {
	return ($data.room.game.seq || []).map(function (s) { return (typeof s === 'object' && s.id) ? s.id : s; });
}
function unisonChoiceText(n) {
	return n + ". " + $data._unison.choices[n - 1];
}
function unisonChoiceLabel(n) {
	return $("<label>").addClass("unison-choice").attr('data-n', n).text(unisonChoiceText(n));
}
function unisonCloseInput() {
	$data._relay = false;
	mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
}

$lib.Unison.roundReady = function (data) {
	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data._unison = { question: data.question, choices: data.choices || ["", ""], pick: 0 };

	$(".game-user-current").removeClass("game-user-current");
	$stage.game.display.addClass("unison-q").empty().append($("<label>").text(data.question));
	$data._char = $stage.game.display.html();
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.text(unisonChoiceText(1) + "   /   " + unisonChoiceText(2))
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Unison.turnStart = function (data) {
	var voted = data.voted || [];
	var ids = unisonSeqIds();
	var mine = !$data._spectate && ids.indexOf($data.id) !== -1 && voted.indexOf($data.id) === -1;

	// 라운드 시작: 선택지는 단어 창, 질문은 노란 바로
	if ($data._unison) {
		$stage.game.display.addClass("unison-q").empty().append(unisonChoiceLabel(1), unisonChoiceLabel(2));
		$data._char = $stage.game.display.html();
		$(".jjo-turn-time .graph-bar").text($data._unison.question);
	}
	// 차례 효과: 아직 고르지 않은 사람 모두
	$(".game-user-current").removeClass("game-user-current");
	$(".game-user-bomb").removeClass("game-user-bomb");
	ids.forEach(function (id) {
		if (voted.indexOf(id) === -1) $("#game-user-" + id).addClass("game-user-current");
	});
	if (mine) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
	} else {
		unisonCloseInput();
	}

	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval($lib.Unison.turnGoing, TICK);
	playBGM('jaqwi');
	recordEvent('turnStart', { data: data });
};

$lib.Unison.turnGoing = function () {
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

$lib.Unison.turnEnd = function (id, data) {
	var ch, ids, names, line;

	if (data.voted) {
		// 누가 골랐는지만 모두에게. 본인에게는 고른 번호(pick)가 함께 옴
		$("#game-user-" + id).removeClass("game-user-current");
		if (id == $data.id) {
			unisonCloseInput();
			if (data.pick && $data._unison) {
				$data._unison.pick = data.pick;
				$stage.game.display.find(".unison-choice[data-n='" + data.pick + "']").addClass("unison-picked");
				playSound('mission');
			}
		}
		return;
	}
	if (!data.counts) return;

	// 라운드 결과
	clearInterval($data._tTime);
	unisonCloseInput();
	stopBGM();
	$(".game-user-current").removeClass("game-user-current");
	ch = ($data._unison && $data._unison.choices) || ["", ""];
	$stage.game.display.empty().append($("<label>").text(ch[0] + " " + data.counts[0] + " : " + data.counts[1] + " " + ch[1]));
	if (data.side) line = L['unisonWin'].replace('{V1}', data.side + ". " + ch[data.side - 1]);
	else line = (data.counts[0] === data.counts[1]) ? L['unisonTie'] : L['unisonNoWin'];
	$(".jjo-turn-time .graph-bar").text(line);

	ids = unisonSeqIds();
	ids.forEach(function (uid) {
		var $uc = $("#game-user-" + uid);

		if (data.win.indexOf(uid) !== -1) {
			addScore(uid, data.score, data.scores[uid]);
			drawObtainedScore($uc, $("<div>").addClass("deltaScore").html("+" + data.score));
			updateScore(uid, getScore(uid));
		} else {
			$uc.addClass("game-user-bomb");
		}
	});
	if (data.win.indexOf($data.id) !== -1) playSound('success');
	else if (ids.indexOf($data.id) !== -1) playSound('fail');
	else playSound('horr');

	// 누가 무엇을 골랐는지 (안 고른 사람은 빠짐)
	names = [[], []];
	ids.forEach(function (uid) {
		var u = $data.users[uid] || $data.robots[uid];

		if (data.picks[uid] && u && u.profile) names[data.picks[uid] - 1].push(u.profile.title || u.profile.name);
	});
	notice([1, 2].map(function (n) {
		return n + ". " + ch[n - 1] + " (" + names[n - 1].length + "): " + (names[n - 1].join(", ") || "-");
	}).join("  /  "), L['modeXIG']);
};
