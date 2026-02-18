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
 * Calcbattle (계산 대결) - 클라이언트 UI
 * 타자대결 기반 + 수학 문제 풀이
 */

$lib.Calcbattle = {};
$lib.Calcbattle._restTimer = null;

$lib.Calcbattle.roundReady = function (data) {
	// 이전 라운드의 restGoing 타이머 취소
	if ($lib.Calcbattle._restTimer) {
		clearTimeout($lib.Calcbattle._restTimer);
		$lib.Calcbattle._restTimer = null;
	}
	$data._chatter = $stage.talk;
	clearBoard();
	$data._round = data.round;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data.chain = 0;
	$data._oneback = data.oneback || false;

	// 노란 바 초기화 (이전 라운드의 카운트다운 제거)
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html("")
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	// 내 문제 표시
	var myProblem = data.problems[$data.id];
	if (myProblem) {
		if ($data._oneback) {
			// oneback 모드: 라운드 준비 중에는 첫 문제(풀어야 할 문제)를 보여줌
			$data._firstQuestion = myProblem.first;
			$data._displayQuestion = myProblem.display;
			$data._nextQuestion = myProblem.next;
			var qStr = myProblem.first;
			if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
			$stage.game.display.html(qStr);
			// 노란 바에는 두 번째 문제(다음에 표시될 문제)
			var nextStr = myProblem.display;
			if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
			$(".jjo-turn-time .graph-bar")
				.width("100%")
				.html(nextStr)
				.css({ 'text-align': "center", 'background-color': "#70712D" });
		} else {
			// 일반 모드
			var qStr = myProblem;
			if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
			$stage.game.display.html($data._question = qStr);
			// 노란 바에 다음 문제 표시
			var nextProblem = data.nextProblems[$data.id];
			if (nextProblem) {
				$data._nextQuestion = nextProblem;
				var nextStr = nextProblem;
				if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
				$(".jjo-turn-time .graph-bar")
					.width("100%")
					.html(nextStr)
					.css({ 'text-align': "center", 'background-color': "#70712D" });
			}
		}
	}

	$stage.game.chain.show().html($data.chain);

	$(".game-user-bomb").removeClass("game-user-bomb");

	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Calcbattle.turnStart = function (data) {
	// 모든 플레이어가 동시에 입력 (타자대결 스타일)
	if (!$data._spectate) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
	}

	// oneback 모드: 턴 시작 시 표시 문제를 두 번째 문제로 변경
	if ($data._oneback && $data._displayQuestion) {
		var qStr = $data._displayQuestion;
		if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
		$stage.game.display.html(qStr);
		// 노란 바에는 다다음 문제
		if ($data._nextQuestion) {
			var nextStr = $data._nextQuestion;
			if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
			$(".jjo-turn-time .graph-bar")
				.width("100%")
				.html(nextStr)
				.css({ 'text-align': "center", 'background-color': "#70712D" });
		}
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._tTime = addInterval($lib.Calcbattle.turnGoing, TICK);
	$data._roundTime = data.roundTime;

	playBGM('jaqwi');
	recordEvent('turnStart', { data: data });
};

$lib.Calcbattle.turnGoing = function () {
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

$lib.Calcbattle.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score >= 0 ? "+" : "") + data.score);
	var $uc = $("#game-user-" + id);

	if (id == $data.id) $data._relay = false;

	if (data.error) {
		// 에러 (잘못된 입력) - 서버에서 send로 본인에게만 전송됨
		playSound('fail');
		return;
	} else if (data.giveup) {
		// 포기 처리
		if ($data.id == id) {
			// 다음 문제 표시
			if (data.nextQuestion) {
				var qStr = data.nextQuestion;
				if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
				$stage.game.display.html($data._question = qStr);

				if ($data._oneback) {
					$data._displayQuestion = data.nextQuestion;
				}
			}

			// 노란 바에 다다음 문제 표시
			if (data.nextNextQuestion) {
				$data._nextQuestion = data.nextNextQuestion;
				var nextStr = data.nextNextQuestion;
				if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
				$(".jjo-turn-time .graph-bar")
					.width("100%")
					.html(nextStr)
					.css({ 'text-align': "center", 'background-color': "#70712D" });
			}

			pushHistory(data.value, "?");
			playSound('fail');
		}

		addScore(id, data.score, data.totalScore);
		$sc.addClass("lost");
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id));
	} else if (data.ok) {
		// 정답 처리
		if ($data.id == id) {
			// 내가 맞힌 경우
			$data.chain = data.chain;
			$stage.game.chain.html($data.chain);

			// 다음 문제 표시
			if (data.nextQuestion) {
				var qStr = data.nextQuestion;
				if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
				$stage.game.display.html($data._question = qStr);

				// oneback 모드인 경우 내부 상태도 업데이트
				if ($data._oneback) {
					$data._displayQuestion = data.nextQuestion;
				}
			}

			// 노란 바에 다다음 문제 표시
			if (data.nextNextQuestion) {
				$data._nextQuestion = data.nextNextQuestion;
				var nextStr = data.nextNextQuestion;
				if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
				$(".jjo-turn-time .graph-bar")
					.width("100%")
					.html(nextStr)
					.css({ 'text-align': "center", 'background-color': "#70712D" });
			}

			// 정답 히스토리에 추가
			pushHistory(data.value, "");
			playSound('mission');
		}

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
		$uc.addClass("game-user-bomb");
		playSound('timeout');
	} else if (data.chains) {
		// 라운드 종료 (시간 만료)
		clearInterval($data._tTime);
		$data._relay = false;
		$stage.game.here.hide();

		addTimeout(drawChainResult, 1000, data.chains);
		stopBGM();
		playSound('horr');

		if ($data._round < $data.room.round) restGoing(10);
	}
};

function restGoing(rest) {
	$(".jjo-turn-time .graph-bar")
		.html(rest + L['afterRun']);
	if (rest > 0) {
		$lib.Calcbattle._restTimer = addTimeout(restGoing, 1000, rest - 1);
	} else {
		$lib.Calcbattle._restTimer = null;
	}
}

function drawChainResult(table) {
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
