/**
 * Rule the words! KKuTu Online
 * WordStack (워드스택) client rule
 */

$lib.Wordstack = {};

$lib.Wordstack._strategy = 0;
$lib.Wordstack._stackLen = 0;
$lib.Wordstack._chars = [];
$lib.Wordstack._subChars = [];

$lib.Wordstack._updateStrategyUI = function () {
	var s = $lib.Wordstack._strategy;
	$(".raingame-strategy-btn").each(function () {
		$(this).toggleClass("toggled", parseInt($(this).attr("data-strategy"), 10) === s);
	});
};

$lib.Wordstack._updateStackBar = function (len) {
	$lib.Wordstack._stackLen = len;
	var pct = Math.min(100, (len / 8) * 100);
	var $bar = $(".jjo-turn-time .graph-bar");
	$bar.width(pct + "%");
	if (len > 8) $bar.addClass("overflow");
	else $bar.removeClass("overflow");
};

// rule_classic.js 방식 - 각 글자를 getCharText로 변환 후 공백 구분 HTML
$lib.Wordstack._renderStack = function () {
	var parts = $lib.Wordstack._chars.map(function (c, i) {
		var sub = $lib.Wordstack._subChars[i] || null;
		return getCharText(c, sub);
	});
	$stage.game.display.html(parts.join(' '));
	$lib.Wordstack._updateStackBar($lib.Wordstack._chars.length);
};

// 유저 표시 이름 조회
$lib.Wordstack._getName = function (id) {
	var u = ($data.users && $data.users[id]) || ($data.robots && $data.robots[id]);
	if (!u) return id;
	var p = u.profile || u;
	return p.title || p.name || id;
};

// 히스토리에 단어 + 공격 정보 추가
$lib.Wordstack._addHistory = function (word, label) {
	var $v = $("<div>").addClass("ellipse history-item").width(0).animate({ width: 200 }).text(word);
	$stage.game.history.prepend($v);
	if ($stage.game.history.children().length > 6) $stage.game.history.children().last().remove();
	$v.append($("<div>").addClass("history-mean ellipse").text(label));
};

$lib.Wordstack.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	if (mobile) $stage.game.here.css({ opacity: 0.5, top: "" }).show();
	else $stage.game.here.hide();
	$(".jjoriping").css({ "float": "none", "margin": "0 auto" });

	$lib.Wordstack._strategy = 0;
	$lib.Wordstack._stackLen = 0;
	$lib.Wordstack._chars = [];
	$lib.Wordstack._subChars = [];

	if (data.chars) {
		$lib.Wordstack._chars = data.chars.slice();
		$lib.Wordstack._subChars = data.subChars ? data.subChars.slice() : [];
		$lib.Wordstack._renderStack();
	}

	$("#raingame-strategy").show().find(".raingame-strategy-btn").show();
	$lib.Wordstack._updateStrategyUI();

	if (data.surHP && $data.room && $data.room.game && $data.room.game.seq) {
		var seq = $data.room.game.seq;
		for (var i = 0; i < seq.length; i++) {
			var uid = typeof seq[i] === 'string' ? seq[i] : seq[i].id;
			var u = $data.users[uid] || $data.robots[uid];
			if (u) { if (!u.game) u.game = {}; u.game.score = data.surHP; u.game.alive = true; }
			updateScore(uid, data.surHP);
		}
	}

	drawRound(data.round);
	if (!spec) playSound("round_start");
	clearInterval($data._tTime);
};

$lib.Wordstack.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._fastTime = 20000;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM("jaqwi");
};

// 공격 글자 수신: 내 스택에 추가 후 재렌더링
$lib.Wordstack.onAtk = function (data) {
	if (!data.char) return;
	$lib.Wordstack._chars.push(data.char);
	$lib.Wordstack._subChars.push(data.subChar || null);
	$lib.Wordstack._renderStack();
};

$lib.Wordstack.turnEnd = function (id, data) {
	if (data.error) {
		playSound("fail");
		return;
	}

	// 라운드 종료
	if (data.timeUp) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound("horr");
		$stage.game.display.empty();
		$("#raingame-strategy").hide();
		$(".jjo-turn-time .graph-bar").width(0).removeClass("overflow");
		$(".jjo-round-time .graph-bar").width(0).removeClass("round-extreme");
		return;
	}

	// 오버플로우 페널티
	if (!data.ok && data.overflow) {
		if (data.hp !== undefined) updateScore(data.target, data.hp);
		if (data.damage) {
			var $uc = $("#game-user-" + data.target);
			drawObtainedScore($uc, $("<div>").addClass("deltaScore").css("color", "#FF6666").text("-" + data.damage));
		}
		if (data.ko) {
			applySurvivalKODisplay(data.target);
			var koU = $data.users[data.target] || $data.robots[data.target];
			if (koU && koU.game) koU.game.alive = false;
			playSound("KO");
		} else if (data.target === $data.id) {
			playSound("fail");
		}
		return;
	}

	// 단어 성공
	if (data.ok) {
		if (data.hp !== undefined) updateScore(data.target, data.hp);

		if (data.target === $data.id) {
			// 내 스택에서 사용된 글자 제거 후 재렌더링
			if (data.removed !== undefined) {
				var idx = $lib.Wordstack._chars.indexOf(data.removed);
				if (idx !== -1) {
					$lib.Wordstack._chars.splice(idx, 1);
					$lib.Wordstack._subChars.splice(idx, 1);
				}
				$lib.Wordstack._renderStack();
			}
			// HP 회복 표시
			if (data.recovered) {
				var $uc = $("#game-user-" + $data.id);
				var $sc = $("<div>").addClass("deltaScore").css("color", "#2255FF").text("+" + data.recovered);
				drawObtainedScore($uc, $sc);
			}
			playSound("success");
		}

		// 히스토리
		if (data.word) {
			var meKO = !$data._spectate && (function () {
				var me = $data.users[$data.id] || $data.robots[$data.id];
				return me && me.game && me.game.alive === false;
			}());
			var watchAll = $data._spectate || meKO;
			var label = "";
			if (data.attackTargets && data.attackTargets.length > 0) {
				if (data.target === $data.id) {
					var names = [];
					data.attackTargets.forEach(function (tid) {
						var n = $lib.Wordstack._getName(tid);
						if (names.indexOf(n) === -1) names.push(n);
					});
					label = "▶ " + names.join(", ");
				} else if (data.attackTargets.indexOf($data.id) !== -1) {
					label = "◀ " + $lib.Wordstack._getName(data.target);
				} else if (watchAll) {
					label = $lib.Wordstack._getName(data.target) + " ▶ " + data.attackTargets.map($lib.Wordstack._getName).join(", ");
				}
			} else if (watchAll) {
				label = $lib.Wordstack._getName(data.target);
			}
			if (label) $lib.Wordstack._addHistory(data.word, label);
		}

		return;
	}
};

$lib.Wordstack.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) {
		clearInterval($data._tTime);
		$(".jjo-round-time .graph-bar").removeClass("round-extreme");
		return;
	}
	$lib.Jaqwi.turnGoing.call(this);
};

// 전략 키 1/2/3
$(document).off("keydown.wordstack").on("keydown.wordstack", function (e) {
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWS" && mode !== "EWS") return;
	if (e.key === "1") { $lib.Wordstack._strategy = 0; $lib.Wordstack._updateStrategyUI(); }
	else if (e.key === "2") { $lib.Wordstack._strategy = 1; $lib.Wordstack._updateStrategyUI(); }
	else if (e.key === "3") { $lib.Wordstack._strategy = 2; $lib.Wordstack._updateStrategyUI(); }
});

// 전략 버튼 클릭
$(document).off("click.wordstack").on("click.wordstack", ".raingame-strategy-btn", function () {
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWS" && mode !== "EWS") return;
	$lib.Wordstack._strategy = parseInt($(this).attr("data-strategy"), 10);
	$lib.Wordstack._updateStrategyUI();
});
