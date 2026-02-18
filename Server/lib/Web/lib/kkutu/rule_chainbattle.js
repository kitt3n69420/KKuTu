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
 * Chainbattle (잇기 대결) - 클라이언트 UI
 * 타자대결 기반 + 끝말잇기 요소 (제시 글자, 히스토리)
 */

$lib.Chainbattle = {};
$lib.Chainbattle._restTimer = null;

$lib.Chainbattle.roundReady = function (data) {
	var i, len = data.title.length;

	// 이전 라운드의 restGoing 타이머 취소
	if ($lib.Chainbattle._restTimer) {
		clearTimeout($lib.Chainbattle._restTimer);
		$lib.Chainbattle._restTimer = null;
	}

	$data._chatter = $stage.talk;
	clearBoard();
	$data._round = data.round;
	$data._roundTime = $data.room.time * 1000;
	$data._char = data.char;
	$data._subChar = data.subChar;
	$data.chain = 0;

	// 제시 글자 표시 (끝말잇기 스타일)
	var tVal = getCharText(data.char, data.subChar);
	if ($data.room.opts.drg) tVal = "<label style='color:" + getRandomColor() + "'>" + tVal + "</label>";
	$stage.game.display.html(tVal);
	$stage.game.chain.show().html($data.chain);

	$(".game-user-bomb").removeClass("game-user-bomb");

	// 노란 바 초기화 (이전 라운드의 카운트다운 제거)
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html("")
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	$data._fastTime = 10000;
	$data._playerWords = {};

	// 초기 플레이어 단어 설정
	var seq = $data.room.game.seq;
	var initChar = getCharText(data.char, data.subChar);
	for (i in seq) {
		// seq에는 문자열 ID(플레이어) 또는 객체(봇)가 있음
		var pid = (typeof seq[i] === 'object' && seq[i].id) ? seq[i].id : seq[i];
		$data._playerWords[pid] = initChar;
	}

	drawRound(data.round);
	drawPlayerWords();

	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Chainbattle.turnStart = function (data) {
	// 모든 플레이어가 동시에 입력 (타자대결 스타일)
	if (!$data._spectate) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._tTime = addInterval($lib.Chainbattle.turnGoing, TICK);
	$data._roundTime = data.roundTime;

	playBGM('jaqwi');
	recordEvent('turnStart', { data: data });
};

$lib.Chainbattle.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) {
		clearInterval($data._tTime);
		return;
	}
	$data._roundTime -= TICK;

	// 라운드 바 업데이트 (타자대결/자퀴처럼 - 파란색 바)
	var $rtb = $stage.game.roundBar;
	var bRate;
	var tt;

	tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html(tt);

	// 턴 바는 플레이어 단어 표시 (어두운 색 바)
	drawPlayerWords();

	// 10초 경고
	if (!$rtb.hasClass("round-extreme")) {
		if ($data._roundTime <= $data._fastTime) {
			if ($data.bgm) {
				bRate = $data.bgm.currentTime / $data.bgm.duration;
				if ($data.bgm.paused) stopBGM();
				else playBGM('jaqwiF');
				$data.bgm.currentTime = $data.bgm.duration * bRate;
			}
			$rtb.addClass("round-extreme");
		}
	}
};

$lib.Chainbattle.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (id == $data.id) $data._relay = false;

	if (data.error) {
		// 에러 (잘못된 입력) - 서버에서 send로 본인에게만 전송됨
		playSound('fail');
		return;
	} else if (data.ok) {
		// 단어 입력 성공
		if ($data.id == id) {
			// 내가 입력한 단어
			$data.chain++;
			$data._char = data.char;
			$data._subChar = data.subChar;

			// 제시 글자 업데이트 (끝말잇기 스타일)
			var tVal = getCharText(data.char, data.subChar);
			if ($data.room.opts.drg) tVal = "<label style='color:" + getRandomColor() + "'>" + tVal + "</label>";
			$stage.game.display.html(tVal);
			$stage.game.chain.html($data.chain);

			// 히스토리에 추가
			pushHistory(data.value, data.mean);

			// 내 단어일 때만 mission 소리 재생
			playSound('mission');
		}

		// 플레이어 단어 업데이트 (다음 글자로)
		if ($data._playerWords) $data._playerWords[id] = getCharText(data.char, data.subChar);
		drawPlayerWords();

		addScore(id, data.score, data.totalScore);
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id));
	} else if (data.out) {
		// 게임오버 (one 규칙)
		if (id == $data.id) {
			mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
			$(".jjo-turn-time .graph-bar")
				.html("GAME OVER")
				.css({ 'text-align': "center" });
		}
		if ($data._playerWords) $data._playerWords[id] = "X";
		drawPlayerWords();
		$uc.addClass("game-user-bomb");
		playSound('timeout');
	} else if (data.speed) {
		// 라운드 종료 (시간 만료)
		clearInterval($data._tTime);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();

		addTimeout(drawChainSpeed, 1000, data.speed);
		stopBGM();
		playSound('horr');

		if ($data._round < $data.room.round) restGoing(10);
	}
};

function restGoing(rest) {
	$(".jjo-turn-time .graph-bar")
		.html(rest + L['afterRun']);
	if (rest > 0) {
		$lib.Chainbattle._restTimer = addTimeout(restGoing, 1000, rest - 1);
	} else {
		$lib.Chainbattle._restTimer = null;
	}
}

function drawPlayerWords() {
	if (!$data.room || !$data._playerWords) return;

	// 내 상태가 GAME OVER면 업데이트하지 않음
	if ($(".jjo-turn-time .graph-bar").text() === "GAME OVER") return;

	var words = [];
	var seq = $data.room.game.seq;

	// 순서대로 단어 수집
	for (var i = 0; i < seq.length; i++) {
		// seq에는 문자열 ID(플레이어) 또는 객체(봇)가 있음
		var pid = (typeof seq[i] === 'object' && seq[i].id) ? seq[i].id : seq[i];
		var w = $data._playerWords[pid];
		if (w !== undefined && w !== null && w !== "") {
			words.push(w);
		}
	}

	// 단어가 있든 없든 항상 업데이트
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html(words.length > 0 ? words.join(" ") : "")
		.css({ 'text-align': "center", 'background-color': "#70712D" });
}

function drawChainSpeed(table) {
	var i;
	var chainLabel = L['chainCount'] || 'Chain';

	for (i in table) {
		$("#game-user-" + i + " .game-user-score").empty()
			.append($("<div>").css({
				'float': "none",
				'color': "#4444FF",
				'text-align': "center"
			}).html(table[i] + "<label style='font-size: 11px;'>" + chainLabel + "</label>"));
	}
}
