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

$lib.Raingame._LANES    = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];
$lib.Raingame._laneAt   = [0, 0, 0, 0, 0, 0, 0];
$lib.Raingame._lastLane = -1;
$lib.Raingame._words    = {};
$lib.Raingame._strategy = 0;

$lib.Raingame._pickLane = function () {
	var now = Date.now();
	var lanes = $lib.Raingame._laneAt;
	var last = $lib.Raingame._lastLane;
	var n = lanes.length;
	var i, idx, pool;

	function isAdj(j) { return last >= 0 && Math.abs(j - last) <= 1; }

	// pass 1: cooled-down AND non-adjacent
	pool = [];
	for (i = 0; i < n; i++) {
		if (!isAdj(i) && now - lanes[i] >= 1000) pool.push(i);
	}
	if (pool.length > 0) {
		idx = pool[Math.floor(Math.random() * pool.length)];
		lanes[idx] = now; $lib.Raingame._lastLane = idx; return idx;
	}

	// pass 2: non-adjacent only (ignore cooldown)
	pool = [];
	for (i = 0; i < n; i++) {
		if (!isAdj(i)) pool.push(i);
	}
	if (pool.length > 0) {
		idx = pool[Math.floor(Math.random() * pool.length)];
		lanes[idx] = now; $lib.Raingame._lastLane = idx; return idx;
	}

	// pass 3: any lane — pick oldest
	idx = 0;
	for (i = 1; i < n; i++) {
		if (lanes[i] < lanes[idx]) idx = i;
	}
	lanes[idx] = now; $lib.Raingame._lastLane = idx; return idx;
};

$lib.Raingame._updateStrategyUI = function () {
	var s = $lib.Raingame._strategy;
	$(".raingame-strategy-btn").each(function () {
		var v = parseInt($(this).attr("data-strategy"), 10);
		$(this).toggleClass("toggled", v === s);
	});
};

$lib.Raingame._showDamage = function (targetId, damage, newHP) {
	var $uc = $("#game-user-" + targetId);
	if (!$uc.length) return;

	var user = $data.users[targetId] || $data.robots[targetId];
	if (user && user.game) user.game.score = newHP;

	$uc.addClass("survival-damage");
	addTimeout(function () { $uc.removeClass("survival-damage"); }, 500);

	var $sc = $("<div>").addClass("deltaScore damage").css("color", "#FF6666").text("-" + damage);
	drawObtainedScore($uc, $sc);
	updateScore(targetId, newHP);
};

$lib.Raingame.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$data._fastTime = 20000;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping").addClass("flip");
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	if (mobile) $stage.game.here.css({ opacity: 0.3, top: "-35px" }).show();
	else $stage.game.here.hide();

	$lib.Raingame._words = {};
	$lib.Raingame._laneAt = [0, 0, 0, 0, 0, 0, 0];
	$lib.Raingame._lastLane = -1;
	$lib.Raingame._strategy = 0;

	$stage.game.display.empty().addClass("raingame-board");
	$("#raingame-strategy").show().find(".raingame-strategy-btn").show();
	$lib.Raingame._updateStrategyUI();

	// 초기 HP 표시
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

$lib.Raingame.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM("jaqwi");
};

$lib.Raingame.onWord = function (data) {
	var lane = $lib.Raingame._pickLane();
	var laneX = $lib.Raingame._LANES[lane];
	var word = data.word;
	var timeout = data.timeout;
	var wordId = data.wordId;

	if ($data.room && $data.room.opts && $data.room.opts.mirror) {
		word = word.split("").reverse().join("");
	}

	var $word = $("<div>")
		.addClass("raingame-word")
		.css({ left: laneX + "%", top: "-5%" })
		.text(word);

	$stage.game.display.append($word);

	// delay 1 frame so the initial position is painted before transition starts
	addTimeout(function () {
		$word.css({
			transition: "top " + timeout + "ms linear",
			top: "105%"
		});
	}, 20);

	// 하단 도달 시 DOM 자동 정리
	(function (wId) {
		$word.on("transitionend", function (e) {
			if (e.originalEvent.propertyName === "top") {
				$word.remove();
				delete $lib.Raingame._words[wId];
			}
		});
	})(wordId);

	if ($data.room && $data.room.opts && $data.room.opts.nyeohweok) {
		$word.css('font-weight', 'normal');
	}
	playSound("mission");
	$lib.Raingame._words[wordId] = { $el: $word, createdAt: Date.now(), timeout: timeout };
};

$lib.Raingame.turnEnd = function (id, data) {
	var wObj, $el;

	if (data.error) {
		playSound("fail");
		return;
	}

	// round over (time expired)
	if (data.timeUp) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound("horr");
		// clear all falling words
		$stage.game.display.empty();
		$lib.Raingame._words = {};
		$("#raingame-strategy").hide();
		return;
	}

	// word timed out (server 스캔 감지)
	if (!data.ok && data.wordId !== undefined) {
		// 내 화면에서만 해당 단어 제거 (wordId가 플레이어별로 독립적이므로 target 확인)
		if (data.target === $data.id) {
			wObj = $lib.Raingame._words[data.wordId];
			if (wObj) {
				wObj.$el.remove();
				delete $lib.Raingame._words[data.wordId];
			}
			playSound("fail");
		}
		if (data.damage !== undefined && data.hp !== undefined) {
			$lib.Raingame._showDamage(data.target, data.damage, data.hp);
		}
		if (data.ko) {
			applySurvivalKODisplay(data.target);
			var koUser = $data.users[data.target] || $data.robots[data.target];
			if (koUser && koUser.game) koUser.game.alive = false;
			playSound("KO");
		}
		return;
	}

	// word typed successfully
	if (data.ok && data.wordId !== undefined) {
		// 단어를 입력한 플레이어의 화면에서만 제거
		if (data.target === $data.id) {
			wObj = $lib.Raingame._words[data.wordId];
			if (wObj) {
				$el = wObj.$el;
				$el.addClass("raingame-success");
				(function (wId, $e) {
					addTimeout(function () {
						$e.remove();
						delete $lib.Raingame._words[wId];
					}, 300);
				})(data.wordId, $el);
			}
		}
		if (data.target === $data.id) playSound("success");
		return;
	}
};

$lib.Raingame.turnGoing = $lib.Jaqwi.turnGoing;

// strategy key handlers — attached once when this file loads
$(document).on("keydown.raingame", function (e) {
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWR" && mode !== "EWR") return;

	var key = e.key;
	if (key === "1") { $lib.Raingame._strategy = 0; $lib.Raingame._updateStrategyUI(); }
	else if (key === "2") { $lib.Raingame._strategy = 1; $lib.Raingame._updateStrategyUI(); }
	else if (key === "3") { $lib.Raingame._strategy = 2; $lib.Raingame._updateStrategyUI(); }
});

// strategy button clicks
$(document).on("click.raingame", ".raingame-strategy-btn", function () {
	$lib.Raingame._strategy = parseInt($(this).attr("data-strategy"), 10);
	$lib.Raingame._updateStrategyUI();
});

// 모바일: 전략 버튼 롱프레스 툴팁
(function () {
	var _lpt = null;
	$(document).on("touchstart", ".raingame-strategy-btn[data-tooltip]", function (e) {
		var $btn = $(this);
		_lpt = setTimeout(function () {
			_lpt = null;
			$(".item-tooltip-popup").remove();
			var $tip = $("<div>").addClass("item-tooltip-popup").text($btn.attr("data-tooltip"));
			$btn.append($tip);
			setTimeout(function () { $tip.remove(); }, 2000);
		}, 500);
	}).on("touchend touchcancel touchmove", ".raingame-strategy-btn", function () {
		if (_lpt) { clearTimeout(_lpt); _lpt = null; }
	});
})();

// 창 포커스 복귀 시 단어 위치 재계산
$(document).on("visibilitychange.raingame", function () {
	if (document.hidden) return;
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWR" && mode !== "EWR") return;

	var now = Date.now();
	$.each($lib.Raingame._words, function (wId, wObj) {
		if (!wObj || !wObj.$el) return;
		var elapsed = now - wObj.createdAt;
		var remaining = wObj.timeout - elapsed;
		if (remaining <= 0) {
			wObj.$el.css({ transition: 'none', top: '105%' });
		} else {
			var progress = Math.min(1, elapsed / wObj.timeout);
			var currentTop = -5 + 110 * progress;
			wObj.$el.css({ transition: 'none', top: currentTop + '%' });
			(function (el, rem) {
				addTimeout(function () {
					el.css({ transition: 'top ' + rem + 'ms linear', top: '105%' });
				}, 20);
			})(wObj.$el, remaining);
		}
	});
});
