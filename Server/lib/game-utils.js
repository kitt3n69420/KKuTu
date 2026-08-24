/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 *
 * 게임 로직 유틸리티 함수 모음
 * const.js의 연산 함수 + kkutu.js의 순수 유틸 함수를 통합.
 * 순수 데이터(const.js)와 런타임 상태(kkutu.js)에 의존하지 않아 어디서든 require 가능.
 */

// ========== 점수 계산 ==========

exports.getPreScore = function (text, chain, tr) {
	return 2 * (Math.pow(5 + 7 * (text || "").length, 0.74) + 1.18 * (chain || []).length) * (0.5 + 0.5 * tr);
};

exports.getCalcScore = function (chainLength, op, a, b, tr) {
	var raw = 30 * (1 + chainLength);
	var base = 1000 * (1 - Math.exp(-raw / 1200));
	var digA = String(Math.abs(a || 1)).length;
	var digB = String(Math.abs(b || 1)).length;
	var opBonus = (op === 2)
		? Math.min(1.4, 1.0 + 0.1 * (digA + digB - 2))
		: Math.min(1.2, 1.0 + 0.04 * (Math.max(digA, digB) - 1));
	return base * opBonus * (0.5 + 0.5 * tr);
};

exports.getPenalty = function (chain, score) {
	return -1 * Math.round(Math.max(50, 10 + (chain || []).length * 3 + score * 0.2));
};

exports.getCalcBattleScore = function (chainLength, op, a, b) {
	var base = 20 + 10 * Math.pow(1 + chainLength, 0.6);
	var digA = String(Math.abs(a || 1)).length;
	var digB = String(Math.abs(b || 1)).length;
	var opBonus = (op === 2)
		? Math.min(1.4, 1.0 + 0.1 * (digA + digB - 2))
		: Math.min(1.2, 1.0 + 0.04 * (Math.max(digA, digB) - 1));
	return Math.round(base * opBonus);
};

exports.generateCalcProblem = function (chainLength) {
	var c = chainLength || 0;
	var m = Math.min(10000000, Math.floor(15 * Math.pow(2, c / 8)));
	var op = Math.floor(Math.random() * 3);
	var a, b, question, answer, minVal;

	if (op === 0) {
		minVal = Math.floor(m / 10);
		a = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		b = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		question = a + " + " + b + " = ?";
		answer = (a + b) | 0;
	} else if (op === 1) {
		minVal = Math.floor(m / 10);
		a = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		b = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		question = (a + b) + " - " + a + " = ?";
		answer = b | 0;
	} else {
		var sqrtM = 2 * Math.min(Math.max(5, Math.floor(Math.pow(m, 0.6))), 10000);
		minVal = Math.max(2, Math.floor(sqrtM / 10));
		a = Math.max(2, Math.floor(Math.random() * (sqrtM - minVal) + minVal));
		b = Math.max(2, Math.floor(Math.random() * (sqrtM - minVal) + minVal));
		question = a + " × " + b + " = ?";
		answer = (a * b) | 0;
	}
	return { question: question, answer: answer, op: op, a: a, b: b };
};

exports.generateWrongAnswer = function (correct) {
	var digits = String(correct).split('');
	if (digits.length === 0) return "0";
	var idx = Math.floor(Math.random() * digits.length);
	var newDigit;
	do {
		newDigit = String(Math.floor(Math.random() * 10));
	} while (newDigit === digits[idx]);
	digits[idx] = newDigit;
	if (digits.length > 1 && digits[0] === '0') {
		digits[0] = String(Math.floor(Math.random() * 9) + 1);
	}
	return digits.join('');
};

exports.generateMathClue = function (answerDigits) {
	var V = parseInt(answerDigits, 10);
	var L = answerDigits.length;
	// 4자리 이상 정답은 덧셈/뺄셈만 사용 (곱셈/나눗셈은 3자리 이하에서만)
	var order = (L >= 4) ? ['+', '-'] : ['+', '-', '*', '/'];
	for (var i = order.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var t = order[i]; order[i] = order[j]; order[j] = t;
	}

	for (var k = 0; k < order.length; k++) {
		var res = _tryMathOp(order[k], V, L);
		if (res) return res;
	}
	return (V + 1) + "-1"; // 위 시도가 모두 실패하는 극단값(자릿수 경계)을 위한 최종 안전망
};

function _tryMathOp(op, V, L) {
	var lo = Math.pow(10, L - 1), hi = Math.pow(10, L) - 1;
	var tries = 20, A, B, f, factors, chosen, d;

	switch (op) {
		case '+':
			while (tries--) {
				A = lo + Math.floor(Math.random() * (hi - lo + 1));
				B = V - A;
				if (B > 0) return A + " + " + B + ' = ?';
			}
			return null;
		case '-':
			while (tries--) {
				A = lo + Math.floor(Math.random() * (hi - lo + 1));
				B = A - V;
				if (A > V && B > 0) return A + " - " + B + ' = ?';
			}
			return null;
		case '*':
			factors = [];
			for (f = 2; f <= 20; f++) if (V % f === 0) factors.push(f);
			if (!factors.length) return null;
			chosen = factors[Math.floor(Math.random() * factors.length)];
			return chosen + " × " + (V / chosen) + ' = ?';
		case '/':
			d = 2 + Math.floor(Math.random() * 8); // [2,9]
			return (V * d) + " ÷ " + d + ' = ?';
	}
}

// ========== 한글 자모 시스템 ==========

var _JAMO_INITIALS = ['ㄱ', 'ㄱㄱ', 'ㄴ', 'ㄷ', 'ㄷㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂㅂ', 'ㅅ', 'ㅅㅅ', 'ㅇ', 'ㅈ', 'ㅈㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
var _JAMO_MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅑㅣ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅕㅣ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
var _JAMO_FINALS = ['', 'ㄱ', 'ㄱㄱ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅅㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
var _NUM_KO = { '0': '영', '1': '일', '2': '이', '3': '삼', '4': '사', '5': '오', '6': '육', '7': '칠', '8': '팔', '9': '구' };
// 음절 블록이 아닌, 단독으로 등장하는 겹자음/겹모음(호환 자모)을 구성 자모로 분리
var _COMPAT_JAMO_DECOMPOSE = {
	'ㄲ': 'ㄱㄱ', 'ㄳ': 'ㄱㅅ',
	'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ',
	'ㄸ': 'ㄷㄷ',
	'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ',
	'ㅃ': 'ㅂㅂ', 'ㅄ': 'ㅂㅅ',
	'ㅆ': 'ㅅㅅ',
	'ㅉ': 'ㅈㅈ',
	'ㅒ': 'ㅑㅣ', 'ㅖ': 'ㅕㅣ',
	'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ',
	'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ', 'ㅟ': 'ㅜㅣ',
	'ㅢ': 'ㅡㅣ'
};

exports.decomposeToJamo = function (text) {
	text = text.replace(/[0-9]/g, function (d) { return _NUM_KO[d]; });
	var result = '';
	for (var i = 0; i < text.length; i++) {
		var code = text.charCodeAt(i) - 0xAC00;
		if (code < 0 || code > 11171) { result += _COMPAT_JAMO_DECOMPOSE[text[i]] || text[i]; continue; }
		result += _JAMO_INITIALS[Math.floor(code / 588)]
			+ _JAMO_MEDIALS[Math.floor((code % 588) / 28)]
			+ _JAMO_FINALS[code % 28];
	}
	return result;
};

var _JAMO_RANGES = {
	'ㄱ': '가-낗', 'ㄴ': '나-닣', 'ㄷ': '다-띻',
	'ㄹ': '라-맇', 'ㅁ': '마-밓', 'ㅂ': '바-삫',
	'ㅅ': '사-앃', 'ㅇ': '아-잏', 'ㅈ': '자-찧',
	'ㅊ': '차-칳', 'ㅋ': '카-킿', 'ㅌ': '타-팋',
	'ㅍ': '파-핗', 'ㅎ': '하-힣',
	'ㅏ': '아-앟', 'ㅐ': '애-앻',
	'ㅑ': '야-얳', 'ㅓ': '어-엏',
	'ㅔ': '에-엫', 'ㅕ': '여-옣',
	'ㅗ': '오-욓', 'ㅛ': '요-욯',
	'ㅜ': '우-윟',
	'ㅠ': '유-윻', 'ㅡ': '으-읳',
	'ㅣ': '이-잏'
};

exports.getJamoRegex = function (jamo) {
	var range = _JAMO_RANGES[jamo];
	if (!range) return /(?!)/;
	return new RegExp('^[' + range + ']');
};

exports.kjmStartsWith = function (decomposed, jamo) {
	if (!decomposed || !jamo) return false;
	var isVowel = jamo.charCodeAt(0) >= 0x314F;
	if (isVowel) {
		for (var i = 0; i < decomposed.length; i++) {
			if (decomposed.charCodeAt(i) >= 0x314F) return decomposed[i] === jamo;
		}
		return false;
	}
	return decomposed[0] === jamo;
};

exports.getKjmStartRegex = function (jamo) {
	var jamoCode = jamo.charCodeAt(0);
	var isVowel = jamoCode >= 0x314F && jamoCode <= 0x3163;
	if (!isVowel) {
		var range = _JAMO_RANGES[jamo];
		if (!range) return /(?!)/;
		return new RegExp('^[' + jamo + range + ']');
	}
	var medialIndex = _JAMO_MEDIALS.indexOf(jamo);
	if (medialIndex === -1) return /(?!)/;
	var chars = jamo;
	for (var i = 0; i < 19; i++) {
		var start = 0xAC00 + i * 588 + medialIndex * 28;
		chars += String.fromCharCode(start) + '-' + String.fromCharCode(start + 27);
	}
	return new RegExp('^[' + chars + ']');
};

function _producible(entry, poolSet) {
	for (var i = 0; i < entry.length; i++) if (!poolSet.has(entry[i])) return false;
	return true;
}
// 주어진 자모 집합(Set)만으로 조립 가능한 모든 완성형 음절 문자를 나열 (사전 존재 여부는 따지지 않음)
exports.buildSyllablesFromJamo = function (poolSet) {
	var chos = [], jungs = [], jongs = [];
	var i;

	for (i = 0; i < _JAMO_INITIALS.length; i++) if (_producible(_JAMO_INITIALS[i], poolSet)) chos.push(i);
	for (i = 0; i < _JAMO_MEDIALS.length; i++) if (_producible(_JAMO_MEDIALS[i], poolSet)) jungs.push(i);
	for (i = 0; i < _JAMO_FINALS.length; i++) if (_producible(_JAMO_FINALS[i], poolSet)) jongs.push(i);

	var result = [];
	for (var c = 0; c < chos.length; c++) {
		for (var v = 0; v < jungs.length; v++) {
			for (var f = 0; f < jongs.length; f++) {
				result.push(String.fromCharCode(0xAC00 + (chos[c] * 21 + jungs[v]) * 28 + jongs[f]));
			}
		}
	}
	return result;
};

exports.getPreScoreJamo = function (text, chain, tr) {
	var jamoLen = exports.decomposeToJamo(text || '').length;
	return 2 * (Math.pow(5 + 7 * jamoLen, 0.74) + 1.18 * (chain || []).length) * (0.5 + 0.5 * tr);
};

// ========== 아이템 시스템 ==========

exports.calcItemBonusPoints = function (missionCount, toss, straightStreak, fullhouse) {
	var points = 0;
	points += missionCount;
	if (toss) points += 1;
	if (straightStreak >= 1) points += Math.min(straightStreak, 3);
	if (fullhouse) points += 3;
	return points;
};

exports.getLinkOverrideType = function (opts) {
	if (opts.middle || opts.random) return 'end';
	return 'middle';
};

// ========== 서바이벌 모드 ==========

exports.checkSurvivalStatus = function (my, DIC) {
	var aliveCount = 0;
	var aliveTeams = new Set();
	var hasTeams = false;
	var individualCount = 0;

	for (var i in my.game.seq) {
		var p = DIC[my.game.seq[i]] || my.game.seq[i];
		if (p && p.game && p.game.alive) {
			aliveCount++;
			var team = p.robot ? p.game.team : p.team;
			if (team && team >= 1 && team <= 4) {
				aliveTeams.add(team);
				hasTeams = true;
			} else {
				individualCount++;
			}
		}
	}

	var totalEntities = aliveTeams.size + individualCount;
	var gameOver = totalEntities <= 1;

	return {
		aliveCount: aliveCount,
		aliveTeams: aliveTeams,
		hasTeams: hasTeams,
		gameOver: gameOver
	};
};

exports.recordSurvivalKO = function (my, player) {
	if (!my.game || !player.game) return;
	player.game.survivalKOOrder = ++(my.game.survivalKOCounter);
};

exports.applySurvivalDamage = function (my, DIC, damage, currentTurn) {
	if (damage <= 0) return null;
	if (!my.game.seq || my.game.seq.length === 0) return null;

	var nextTurn;
	var found = false;
	var _itemActive = my.opts.item || my.game.reversed ||
		(my.game.pendingItems && Object.keys(my.game.pendingItems).length > 0);

	if (_itemActive) {
		nextTurn = my.calculateNextTurn(false);
		var p = DIC[my.game.seq[nextTurn]] || my.game.seq[nextTurn];
		found = p && p.game && p.game.alive;
		if (found) my.game._survivalCachedTarget = nextTurn;
	} else if (my.opts.randomturn) {
		// my._nextRandomTurnSlot()이 가방 포인터 전진/재셔플까지 전담해서 커밋하므로,
		// turnNext는 그 결과(targetIndex)를 그대로 읽기만 하면 됨 (재조회로 인한 어긋남 방지).
		var _slot = my._nextRandomTurnSlot();
		if (_slot !== null && _slot !== undefined) {
			nextTurn = _slot;
			found = true;
			my.game._survivalCachedTarget = nextTurn;
		}
	} else {
		nextTurn = currentTurn;
		for (var attempts = 0; attempts < my.game.seq.length; attempts++) {
			nextTurn = (nextTurn + 1) % my.game.seq.length;
			if (nextTurn === currentTurn) continue;
			var nextPlayer = DIC[my.game.seq[nextTurn]] || my.game.seq[nextTurn];
			if (nextPlayer && nextPlayer.game && nextPlayer.game.alive) {
				found = true;
				break;
			}
		}
	}

	if (!found) return null;
	var targetPlayer = DIC[my.game.seq[nextTurn]] || my.game.seq[nextTurn];
	if (targetPlayer && targetPlayer.game && targetPlayer.game.alive) {
		var preHP = targetPlayer.game.score;
		targetPlayer.game.score -= damage;
		var newHP = targetPlayer.game.score;
		var ko = newHP <= 0;
		var actualDamage = ko ? preHP : damage;

		if (ko) {
			targetPlayer.game.alive = false;
			targetPlayer.game.score = 0;
			exports.recordSurvivalKO(my, targetPlayer);
		}

		my.game.survivalDamageTracking = true;
		var attackerEntry = my.game.seq[currentTurn];
		var attacker = (typeof attackerEntry === 'string') ? DIC[attackerEntry] : attackerEntry;
		if (attacker && attacker.game) {
			attacker.game.survivalDamageDealt = (attacker.game.survivalDamageDealt || 0) + actualDamage;
		}

		return {
			targetId: targetPlayer.id,
			targetIndex: nextTurn,
			damage: damage,
			newHP: ko ? 0 : newHP,
			ko: ko
		};
	}

	return null;
};

exports.handleSurvivalTimeout = function (my, DIC, target, extraData) {
	if (!my.opts.survival || !target || !target.game || !target.game.alive) {
		return false;
	}

	target.game.alive = false;
	target.game.score = 0;
	exports.recordSurvivalKO(my, target);

	var status = exports.checkSurvivalStatus(my, DIC);

	var turnEndData = {
		ok: false,
		target: target.id,
		score: 0,
		totalScore: 0,
		survival: true,
		ko: true,
		koReason: 'timeout'
	};

	if (extraData) {
		for (var key in extraData) {
			turnEndData[key] = extraData[key];
		}
	}

	my.byMaster('turnEnd', turnEndData, true);

	if (status.gameOver) {
		clearTimeout(my.game.robotTimer);
		clearTimeout(my.game._rrt);
		my.game._rrt = setTimeout(function () {
			my.roundEnd();
		}, 2000);
		return true;
	}

	return false;
};

// ========== 공통 유틸 (kkutu.js에서 이동) ==========

exports.shuffle = function (arr) {
	var r = arr.slice();
	for (var i = r.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = r[i];
		r[i] = r[j];
		r[j] = temp;
	}
	return r;
};

exports.getGuestName = function (sid) {
	var i, len = sid.length, res = 0;
	for (i = 0; i < len; i++) {
		res += sid.charCodeAt(i) * (i + 1);
	}
	return "손님" + (1000 + (res % 9000));
};

exports.filterRobot = function (item) {
	if (!item) return {};
	return (item.robot && item.getData) ? item.getData() : item;
};
