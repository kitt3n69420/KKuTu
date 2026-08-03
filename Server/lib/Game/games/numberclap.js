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

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [10, 5, 2, 1, 0];
const ROBOT_ACCURACY_COEF = [0.8, 1, 1.5, 2, 1];

var CLAP = '👏'; // 👏
var CLAP_TOKENS = [CLAP, '짝', 'ㅉ', 'clap', 'c', 'w'];

function getPlayerId(player) {
	return (typeof player === 'object' && player.id) ? player.id : player;
}

// 자릿수 내 3/6/9 등장 횟수 = 필요한 박수 수 (0이면 숫자 턴)
function requiredClaps(n) {
	var s = String(n), count = 0, i;
	for (i = 0; i < s.length; i++) {
		if (s[i] === '3' || s[i] === '6' || s[i] === '9') count++;
	}
	return count;
}

function clapString(count) {
	var out = '', i;
	for (i = 0; i < count; i++) out += CLAP;
	return out;
}

// 입력 분류: {type:'number', value} | {type:'clap', count} | {type:'invalid'}
function classifyInput(text) {
	var stripped = String(text).replace(/\s+/g, '');
	var normalized, chars, i, token, tokenChars, k;

	if (/^[0-9]+$/.test(stripped)) {
		return { type: 'number', value: parseInt(stripped, 10) };
	}

	normalized = stripped.toLowerCase();
	chars = Array.from(normalized);
	if (chars.length === 0) return { type: 'invalid' };

	for (i = 0; i < CLAP_TOKENS.length; i++) {
		token = CLAP_TOKENS[i];
		tokenChars = Array.from(token);
		if (chars.length % tokenChars.length !== 0) continue;
		k = chars.length / tokenChars.length;
		if (normalized === token.repeat(k)) {
			return { type: 'clap', count: k };
		}
	}
	return { type: 'invalid' };
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function () {
	var R = new Lizard.Tail();

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};

exports.roundReady = function () {
	var my = this;

	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	my.resetChain();
	my.game.n = 1;
	if (my.game.round <= my.round) {
		my.byMaster('roundReady', {
			round: my.game.round
		}, true);
		my.game.turnTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};

exports.turnStart = function (force) {
	var my = this;
	var speed;
	var si;

	if (!my.game.chain) return;
	my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.chain.length * 1500));
	speed = my.getTurnSpeed(my.opts.speed ? my.game.roundTime / 2 : my.game.roundTime);
	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.robotTimer);
	my.game.late = false;
	my.game.loading = false;
	my.game.turnTime = 15000 - 1400 * speed;
	my.game.turnAt = (new Date()).getTime();
	my.byMaster('turnStart', {
		turn: my.game.turn,
		speed: speed,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		seq: force ? my.game.seq : undefined
	}, true);
	var timeout = my.opts.survival
		? my.game.turnTime + 100
		: Math.min(my.game.roundTime, my.game.turnTime + 100);
	my.game.turnTimer = setTimeout(my.turnEnd, timeout);
	if (si = my.game.seq[my.game.turn]) if (si.robot) {
		my.readyRobot(si);
	}
};

exports.turnEnd = function () {
	var my = this;
	var target;
	var score = 0;
	var claps, hint;

	if (!my.game.seq) return;
	target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];

	if (my.game.loading) {
		clearTimeout(my.game.turnTimer);
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	clearTimeout(my.game.turnTimer);
	if (!my.game.chain) return;
	my.game.late = true;

	if (target) if (target.game) {
		score = Const.getPenalty(my.game.chain, target.game.score);
		if (score !== 0) target.game.score += score;
	}

	if (target && target.robot && target.adjustAnger) {
		target.adjustAnger(1);
	}

	claps = requiredClaps(my.game.n);
	hint = claps > 0 ? clapString(claps) : String(my.game.n);

	my.byMaster('turnEnd', {
		ok: false,
		target: target ? target.id : null,
		score: score,
		hint: hint
	}, true);

	// 봇 타임아웃 채팅 (다른 봇들이 50% 확률로 반응)
	if (target && my.game.seq) {
		var bots = [], i, p, item;
		var targetId = getPlayerId(target);

		for (i in my.game.seq) {
			item = my.game.seq[i];
			p = (typeof item === 'string') ? DIC[item] : item;
			if (p && p.robot && p.id !== targetId) bots.push(p);
		}
		for (i in bots) {
			(function (bot) {
				if (bot.adjustAnger) bot.adjustAnger(-0.5);
				if (Math.random() < 0.5 && !bot.muteGame) {
					setTimeout(function () {
						var msgs = Const.ROBOT_TIMEOUT_MESSAGES;
						bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
					}, 500 + Math.random() * 1000);
				}
			})(bots[i]);
		}
	}

	my.logChainEvent(target, 'timeout');
	my.game._rrt = setTimeout(my.roundReady, 3000);
	clearTimeout(my.game.robotTimer);
};

exports.submit = function (client, text, data) {
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];
	var input, expectedClaps, n, ok, t, value, isClap, clapCount, score;

	if (!mgt) return;
	// Turn check: Only the current turn owner can submit
	if (getPlayerId(mgt) !== getPlayerId(client)) return client.chat(text);
	if (my.game.late) return;

	n = my.game.n;
	expectedClaps = requiredClaps(n);
	input = classifyInput(text);

	if (expectedClaps > 0) {
		ok = (input.type === 'clap' && input.count === expectedClaps);
	} else {
		ok = (input.type === 'number' && input.value === n);
	}

	if (!ok) {
		client.publish('turnError', { code: 404, value: text }, true);
		if (my.opts.one) {
			my.turnEnd();
		} else if (client.robot && client.data && client.data.lastDelay) {
			var retryDelay = Math.max(50, client.data.lastDelay * 0.5);
			my.game.robotTimer = setTimeout(function () {
				my.readyRobot(client);
			}, retryDelay);
		}
		return;
	}

	my.game.loading = false;
	my.game.late = true;
	clearTimeout(my.game.turnTimer);
	t = tv - my.game.turnAt;

	isClap = expectedClaps > 0;
	clapCount = expectedClaps;
	value = isClap ? clapString(clapCount) : String(n);
	score = my.getScore(n, isClap ? clapCount : 0, t);

	my.logChainWord(n, client);
	my.game.roundTime -= t;
	my.game.n = n + 1;

	client.game.score += score;

	client.publish('turnEnd', {
		ok: true,
		value: value,
		isClap: isClap,
		clapCount: clapCount,
		score: score,
		totalScore: client.game.score
	}, true);

	if (my.opts.item || my.opts.chaos) {
		my.checkItemGrant(client.id, 0, true);
	}
	setTimeout(my.turnNext, my.game.turnTime / 6);
};

exports.getScore = function (n, claps, delay) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var raw = 20 * Math.log10(10 + n);
	var score = raw * (1 + 0.2 * claps) * ((1 + tr) / 2);
	return Math.round(score);
};

exports.readyRobot = function (robot) {
	var my = this;
	var level = robot.level;
	var delay = ROBOT_START_DELAY[level];
	var n = my.game.n;
	var claps = requiredClaps(n);
	var correctText = claps > 0 ? clapString(claps) : String(n);
	var accuracy, baseAccuracy, response, wrongCount;

	delay += 500 * Math.log10(n + 1) * ROBOT_THINK_COEF[level];

	if (level === 4) {
		accuracy = 1;
	} else {
		baseAccuracy = 10 / (Math.log10(n) + 10);
		accuracy = Math.max(0, Math.min(1, baseAccuracy * ROBOT_ACCURACY_COEF[level]));
	}

	if (Math.random() < accuracy) {
		response = correctText;
	} else if (claps > 0) {
		wrongCount = claps - 1;
		if (wrongCount < 1) wrongCount = claps + 1;
		response = clapString(wrongCount);
	} else {
		response = String(n + (Math.random() < 0.5 ? -1 : 1));
	}

	delay += response.length * ROBOT_TYPE_COEF[level];
	delay = Math.max(50, delay);
	robot.data.lastDelay = delay;

	my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, response);
};
