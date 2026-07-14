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

var MOVE_INTERVAL = 500;

var KO_CONSO_1 = ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅅ', 'ㅇ'];
var KO_CONSO_2 = ['ㄷ', 'ㅂ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
var KO_VOWEL_1 = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅔ'];
var KO_VOWEL_2 = ['ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅠ'];

var EN_VOWEL = ['a', 'e', 'i', 'o', 'u'];
var EN_CONSO_1 = ['r', 's', 'n', 't', 'h', 'd', 'l', 'c', 'm', 'w', 'y'];
var EN_CONSO_2 = ['b', 'f', 'g', 'j', 'k', 'p', 'q', 'v', 'x', 'z'];

var DRAW = {
	'ko': [[KO_VOWEL_1, 2], [KO_VOWEL_2, 1], [KO_CONSO_1, 3], [KO_CONSO_2, 2]],
	'en': [[EN_VOWEL, 3], [EN_CONSO_1, 2], [EN_CONSO_2, 3]]
};

// ㅁ 배치(1 2 3 / 8 · 4 / 7 6 5, 0-indexed) 기준 10가지 순열: next[i] = prev[MOVES[k][i]]
var MOVES = [
	[1, 0, 3, 2, 5, 4, 7, 6], // 인접쌍 교환 12 34 56 78
	[7, 2, 1, 4, 3, 6, 5, 0], // 인접쌍 교환 23 45 67 81
	[6, 5, 4, 3, 2, 1, 0, 7], // 상하 대칭
	[0, 7, 6, 5, 4, 3, 2, 1], // 1-5 대각 대칭
	[2, 1, 0, 7, 6, 5, 4, 3], // 좌우 대칭
	[4, 3, 2, 1, 0, 7, 6, 5], // 3-7 대각 대칭
	[4, 5, 6, 7, 0, 1, 2, 3], // 180도 회전
	[6, 3, 0, 5, 2, 7, 4, 1], // 모서리 1-3-5-7, 변 8-6-4-2 정방향 회전
	[2, 3, 4, 5, 6, 7, 0, 1], // 모서리만 역방향 (1-7-5-3)
	[2, 7, 4, 1, 6, 3, 0, 5]  // 모서리, 변 모두 역방향
];

function drawGroup(list, n) {
	return Const.shuffle(list).slice(0, n);
}
function buildPool(lang) {
	var groups = DRAW[lang];
	var units = [];
	var i, vowelIndex;

	for (i = 0; i < groups.length; i++) {
		units = units.concat(drawGroup(groups[i][0], groups[i][1]));
	}
	if (lang === 'en' && units.indexOf('q') != -1 && units.indexOf('u') == -1) {
		for (i = 0; i < units.length; i++) {
			if (EN_VOWEL.indexOf(units[i]) != -1) { vowelIndex = i; break; }
		}
		units[vowelIndex] = 'u';
	}
	return Const.shuffle(units);
}
function applyMove(my) {
	var perm = MOVES[Math.floor(Math.random() * MOVES.length)];
	var prev = my.game.positions;
	var next = new Array(8);

	for (var i = 0; i < 8; i++) next[i] = prev[perm[i]];
	my.game.positions = next;
	my.byMaster('shukMove', { positions: next }, true);
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
	var units;

	clearInterval(my.game.moveTimer);
	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;

	if (my.game.round <= my.round) {
		units = buildPool(my.rule.lang);
		my.game.positions = units;
		my.game.poolSet = new Set(units);
		my.game.words = [];

		my.byMaster('roundReady', {
			round: my.game.round,
			totalRound: my.round,
			time: my.time
		}, true);
		my.game.turnTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};
exports.turnStart = function () {
	var my = this;

	my.game.late = false;
	my.game.roundAt = (new Date()).getTime();
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', {
		roundTime: my.game.roundTime,
		positions: my.game.positions
	}, true);

	if (!my.opts.stp) {
		my.game.moveTimer = setInterval(function () {
			applyMove(my);
		}, MOVE_INTERVAL);
	}
};
exports.turnEnd = function () {
	var my = this;

	my.game.late = true;
	clearInterval(my.game.moveTimer);
	my.byMaster('turnEnd', {});
	my.game._rrt = setTimeout(my.roundReady, 3000);
};
exports.submit = function (client, text, data) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false);
	var score, units, i;

	if (!my.game.words) return;
	if (!text) return;
	if (!play) return client.chat(text);
	if (/\s/.test(text)) return client.chat(text);
	if (my.game.words.indexOf(text) != -1) return client.chat(text);

	if (my.rule.lang === "ko") {
		if (!/^[가-힣]+$/.test(text)) return client.chat(text);
	} else {
		if (text.length < 2) return client.chat(text);
	}

	units = (my.rule.lang === "ko") ? Const.decomposeToJamo(text).split('') : text.toLowerCase().split('');
	for (i = 0; i < units.length; i++) {
		if (!my.game.poolSet.has(units[i])) return client.chat(text);
	}

	DB.kkutu[my.rule.lang].findOne(['_id', text]).limit(['_id', true]).on(function ($doc) {
		if (!my.game.poolSet) return;
		if (!$doc) return client.chat(text);

		score = my.getScore(text);
		my.game.words.push(text);
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			value: text,
			score: score,
			totalScore: client.game.score
		}, true);
		client.invokeWordPiece(text, 1.1);
	});
};
exports.getScore = function (text) {
	var my = this;
	var units = (my.rule && my.rule.lang === "ko") ? Const.decomposeToJamo(text) : text;

	return units.length * 5;
};
