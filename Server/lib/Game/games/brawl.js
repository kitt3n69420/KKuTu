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
 * Brawl (난투 잇기) - 가운데 글자를 모두가 함께 쓰는 잇기 대결
 * 그 글자로 시작하는 유효한 단어를 먼저 낸 사람이 점수를 얻고, 그 단어의 끝 글자가 모두의 다음 글자가 된다.
 * 쿼드코어(quadcore): 글자 칸이 4개. 단어는 첫 글자가 맞는 칸 하나(같은 글자가 여럿이면 왼쪽 칸)를 잇고 그 칸만 바뀐다.
 * 사전 확인·두음법칙·점수는 잇기 대결(chainbattle.js)과 같고, 라운드 안에서 쓴 단어는 모두가 함께 못 쓴다.
 * 한방 단어(이을 단어가 남지 않는 단어)는 한국어·영어 모두 금지 — 아무도 못 잇는 글자가 나오지 않게.
 * 거의 동시에 낸 단어는 칸마다 붙인 번호(ver)로 가린다: 사전 확인이 끝났을 때 번호가 바뀌었으면 한발 늦은 것(실패 아님).
 */

var Const = require('../../const');
var CB = require('./chainbattle');
var DB;
var DIC;

// 봇 상수 (잇기 대결과 같음)
const ROBOT_LENGTH_LIMIT = [2, 3, 4, 5, 6, 80];
const BOT_CPM = [70, 150, 250, 500, 1000, 10000];
const BOT_ACCURACY = [0.9, 0.95, 0.98, 0.99, 1.0, 1.0];
// 글자가 바뀐 뒤 봇이 새 단어를 찾기 시작하기까지 (+0~500ms). 글자를 함께 쓰므로 사람도 먼저 낼 틈이 있게 함
const BOT_REACT = [1500, 1100, 800, 400, 200, 20];
const QUAD_SLOTS = 4;
const QUAD_MIN_WORDS = 200; // 쿼드코어 2~4칸 시작 글자: 그 글자로 시작하는 단어가 이만큼은 있는 글자 중에서 뽑음

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

// 시작 단어 수 통계표 열 (잇기 대결과 같은 방식: 어인정·깐깐·우리말 조합)
function statsCol(my) {
	var state = 0;
	if (!my.opts.injeong) state |= 1;
	if (my.opts.strict) state |= 2;
	if (my.opts.loanword) state |= 4;
	return (my.rule.lang === 'ko' ? 'startall_' : 'count_') + state;
}
function statsOf(my) {
	return (DB.statsData && DB.statsData[my.rule.lang === 'ko' ? 'ko' : 'en']) || {};
}
// 그 글자(두음법칙 글자 포함)로 시작하는 단어 수
function countStart(my, ch, sub) {
	var stats = statsOf(my), col = statsCol(my), total = 0;

	[ch, sub].forEach(function (c) {
		if (c && stats[c] && stats[c][col]) total += stats[c][col];
	});
	return total;
}
// 쓴 단어를 빼고 그 글자로 이을 수 있는 단어 수 (잇기 대결의 매너 판정과 같음)
function remaining(my, ch, sub, used) {
	var n = countStart(my, ch, sub);

	used.forEach(function (w) {
		var f = my.rule.lang === 'ko' ? w.charAt(0) : w.charAt(0).toLowerCase();
		if (f === ch || (sub && f === sub)) n--;
	});
	return n;
}
function players(my) {
	var R = [];

	my.game.seq.forEach(function (item) {
		var o = (typeof item === 'string') ? DIC[item] : item;
		if (o && o.game) R.push(o);
	});
	return R;
}
function publicSlots(my) {
	return my.game.slots.map(function (s) { return { char: s.char, subChar: s.subChar }; });
}
// 단어가 이을 칸: 첫 글자가 맞는 가장 왼쪽 칸 (없으면 -1)
function findSlot(my, text) {
	var i, s;

	for (i = 0; i < my.game.slots.length; i++) {
		s = my.game.slots[i];
		if (CB.isChainable(text, s.char, s.subChar, my.rule.lang)) return i;
	}
	return -1;
}
// 쿼드코어 2~4칸: 다른 칸의 글자(두음 포함)와 겹치지 않고 시작 단어가 넉넉한 글자를 무작위로
function addQuadSlots(my, slots) {
	var taken = {};
	var re = my.rule.lang === 'ko' ? /^[가-힣]$/ : /^[a-z]$/;
	var pool, c;

	slots.forEach(function (s) { taken[s.char] = true; if (s.subChar) taken[s.subChar] = true; });
	pool = Object.keys(statsOf(my)).filter(function (k) {
		return re.test(k) && !taken[k] && countStart(my, k, CB.getSubChar.call(my, k)) >= QUAD_MIN_WORDS;
	});
	while (slots.length < QUAD_SLOTS && pool.length) {
		c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
		if (taken[c]) continue;
		slots.push({ char: c, subChar: CB.getSubChar.call(my, c) });
		taken[c] = true;
		if (slots[slots.length - 1].subChar) taken[slots[slots.length - 1].subChar] = true;
	}
}

// 제시어는 잇기 대결과 같은 방식 (라운드 수 이상 글자, 글자마다 시작 단어 5개 이상)
exports.getTitle = CB.getTitle;
exports.getScore = CB.getScore;

exports.roundReady = function () {
	var my = this;
	var c, slots;

	if (!my.game || !my.game.title) return;

	clearTimeout(my.game.qTimer);
	clearTimeout(my.game._rrt);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	my.game.late = true;

	if (my.game.round <= my.round) {
		c = my.game.title[my.game.round - 1];
		slots = [{ char: c, subChar: CB.getSubChar.call(my, c) }];
		if (my.opts.quadcore) addQuadSlots(my, slots);
		slots.forEach(function (s) { s.ver = 0; });
		my.game.slots = slots;
		my.game.used = [];
		my.game.brawlCount = 0;
		players(my).forEach(function (o) {
			o.game.brawlWords = 0;
			o.game.out = false;
		});

		my.byMaster('roundReady', {
			round: my.game.round,
			title: my.game.title,
			slots: publicSlots(my),
			chain: 0
		}, true);
		my.game._tsTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};

exports.turnStart = function () {
	var my = this;

	if (!my.game || !my.game.slots) return;

	my.game.late = false;
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', { roundTime: my.game.roundTime }, true);
	players(my).forEach(function (o) {
		if (o.robot) planRobot(my, o);
	});
};

exports.turnEnd = function () {
	var my = this;
	var spl = {};

	if (!my.game || my.game.late) return;

	my.game.late = true;
	clearTimeout(my.game.qTimer);
	players(my).forEach(function (o) {
		if (o.robot) {
			clearTimeout(o.game.typingTimer);
			o.game.brawlToken = (o.game.brawlToken || 0) + 1;
		}
		spl[o.id] = o.game.brawlWords || 0;
	});
	// 라운드에 각자 이은 단어 수는 잇기 대결처럼 플레이어 칸에 잠깐 보여 줌
	my.byMaster('turnEnd', { ok: false, speed: spl });
	my.game._rrt = setTimeout(my.roundReady, (my.game.round == my.round) ? 3000 : 10000);
};

exports.submit = function (client, text) {
	var my = this;
	var lang = my.rule.lang, isKo = lang === 'ko';
	var slots, idx, slot, ver;

	if (!my.game || !my.game.slots) return;
	// 관전자·라운드 사이·낙장불입으로 나간 사람·가운데 글자로 시작하지 않는 말은 채팅
	if (!client.game || (!client.robot && my.game.seq.indexOf(client.id) === -1)) return client.chat(text);
	if (my.game.late || client.game.out) return client.chat(text);
	if ((idx = findSlot(my, text)) === -1) return client.chat(text);

	slots = my.game.slots;
	slot = slots[idx];
	ver = slot.ver;

	function out() {
		client.game.out = true;
		client.publish('turnEnd', { target: client.id, ok: false, out: true }, true);
		if (players(my).every(function (o) { return o.game.out; })) my.turnEnd();
	}
	function fail(code) {
		client.send('turnError', { code: code, value: text });
		if (my.opts.one) out();
		else if (client.robot) planRobot(my, client);
	}

	if (my.game.used.indexOf(text) !== -1) return fail(409);

	DB.kkutu[lang].findOne(
		['_id', text],
		isKo ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
	).limit(['mean', true], ['theme', true], ['type', true], ['hit', true], ['flag', true])
		.on(function ($doc) {
			var nChar, nSub, score;

			// 사전을 보는 사이 라운드가 끝났거나 바뀌었으면 버림
			if (!my.game || my.game.slots !== slots || my.game.late || client.game.out) return;
			if (!$doc) return fail(404);
			if (isKo) {
				if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) return fail(404);
				if (my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) return fail(406);
				if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) return fail(405);
			}
			// 다른 사람이 이 칸을 먼저 이었음 — 실패가 아니라 한발 늦은 것 (낙장불입이어도 탈락 없음)
			if (slot.ver !== ver) {
				client.send('turnError', { code: 'late', value: text });
				if (client.robot) planRobot(my, client);
				return;
			}
			if (my.game.used.indexOf(text) !== -1) return fail(409);

			nChar = CB.getChar(text, lang);
			nSub = isKo ? CB.getSubChar.call(my, nChar) : null;
			if (remaining(my, nChar, nSub, my.game.used.concat([text])) <= 0) return fail(403);

			score = my.getScore(text);
			client.game.score += score;
			client.game.brawlWords = (client.game.brawlWords || 0) + 1;
			my.game.used.push(text);
			my.game.brawlCount++;
			slot.char = nChar;
			slot.subChar = nSub;
			slot.ver++;

			client.publish('turnEnd', {
				target: client.id,
				ok: true,
				value: text,
				mean: $doc.mean,
				theme: $doc.theme,
				score: score,
				totalScore: client.game.score,
				slot: idx,
				char: nChar,
				subChar: nSub,
				chain: my.game.brawlCount
			}, true);
			// 중간에 들어온 관전자는 마지막 roundReady를 다시 보므로 지금 글자로 바꿔 둠
			my.game.specRR = { round: my.game.round, title: my.game.title, slots: publicSlots(my), chain: my.game.brawlCount };
			client.invokeWordPiece(text, 0.5);

			// 이 칸을 노리던 봇(과 방금 낸 봇)은 새 글자로 다시 고름
			players(my).forEach(function (o) {
				if (!o.robot || o.game.out) return;
				if (o === client || (o.game.brawlPlan && o.game.brawlPlan.slot === idx)) planRobot(my, o);
			});
		});
};

// ========== 봇: 잇기 대결 봇과 같은 후보 검색·타수·정확도에 반응 시간을 더함 ==========
function planRobot(my, robot) {
	var token;

	if (robot.level === -1) return;
	clearTimeout(robot.game.typingTimer);
	token = robot.game.brawlToken = (robot.game.brawlToken || 0) + 1;
	robot.game.brawlPlan = null;
	if (!my.game || my.game.late || robot.game.out) return;

	robot.game.typingTimer = setTimeout(function () {
		findWord(my, robot, token);
	}, BOT_REACT[robot.level] + Math.random() * 500);
}
function stale(my, robot, token) {
	return !my.game || !my.game.slots || my.game.late || robot.game.out || robot.game.brawlToken !== token;
}
function robotCanUse(my, robot, w) {
	var id = w._id, isKo = my.rule.lang === 'ko';
	var n;

	if (id.length < 2 || id.length > ROBOT_LENGTH_LIMIT[robot.level]) return false;
	if (my.game.used.indexOf(id) !== -1) return false;
	if (isKo) {
		if (!my.opts.injeong && (w.flag & Const.KOR_FLAG.INJEONG)) return false;
		if (my.opts.strict && (w.flag >= 4 || (w.type && !w.type.match(Const.KOR_STRICT)))) return false;
		if (my.opts.loanword && (w.flag & Const.KOR_FLAG.LOANWORD)) return false;
	}
	n = CB.getChar(id, my.rule.lang);
	return remaining(my, n, isKo ? CB.getSubChar.call(my, n) : null, my.game.used.concat([id])) > 0;
}
// 칸을 무작위 순서로 보며 낼 단어가 있는 칸을 찾아 타자를 친 뒤 냄. 낼 단어가 없으면 1초 뒤 다시
function findWord(my, robot, token) {
	var order;

	if (stale(my, robot, token)) return;
	order = my.game.slots.map(function (s, i) { return i; }).sort(function () { return Math.random() - 0.5; });

	(function next(k) {
		var idx, slot, ver;

		if (stale(my, robot, token)) return;
		if (k >= order.length) {
			robot.game.typingTimer = setTimeout(function () { findWord(my, robot, token); }, 1000);
			return;
		}
		idx = order[k];
		slot = my.game.slots[idx];
		ver = slot.ver;
		CB.getAuto.call(my, slot.char, slot.subChar, 2).then(function (list) {
			var cands, word, typeTime;

			if (stale(my, robot, token)) return;
			if (slot.ver !== ver) return findWord(my, robot, token);
			cands = (list || []).filter(function (w) { return robotCanUse(my, robot, w); });
			if (!cands.length) return next(k + 1);

			word = cands[Math.floor(Math.random() * cands.length)]._id;
			robot.game.brawlPlan = { slot: idx };
			typeTime = (word.length * 60 * 1000) / BOT_CPM[robot.level] + Math.random() * 100 - 50;
			robot.game.typingTimer = setTimeout(function () {
				if (stale(my, robot, token)) return;
				if (slot.ver !== ver) return planRobot(my, robot);
				// 오타율: 잇기 대결처럼 "글자?"를 냄 (사전에 없어 실패)
				my.submit(robot, Math.random() < BOT_ACCURACY[robot.level] ? word : slot.char + "?");
			}, Math.max(0, typeTime));
		});
	})(0);
}
