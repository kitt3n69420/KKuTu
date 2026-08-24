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

// 봇 후보 단어 목록 캐시 (TTL: 3분) — sock.js와 동일한 패턴
var _shukWordCache = {};
var SHUK_CACHE_TTL = 3 * 60 * 1000;

const ROBOT_SHUK_START_DELAY = [8000, 5500, 3000, 1200, 500];
const ROBOT_SHUK_MAX_WORDS = [20, 50, 80, 150, 9999];
const BOT_SHUK_CPM = [25, 50, 100, 200, 500];
const ROBOT_SHUK_MAX_LEN_KO = [2, 3, 4, 6, 10];
const ROBOT_SHUK_MAX_LEN_EN = [3, 4, 6, 10, 20];
// 통계 테이블 state 비트마스크: bit0=noInjeong, bit1=strict, bit2=noLoan, bit3=allpos
// state=8 → 어인정 포함 + 외래어 포함 + 품사 제한 없음(특수단어 포함) = 가장 관대한 조합
const STATS_STATE = 8;

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

// 현재 자모 풀로 만들 수 있는 모든 음절을 통계(startall_8 + endall_8)로 정렬해 상위 100개만 취함.
// 통계가 아직 로딩되지 않았으면 모두 0점 취급되어 앞에서부터 100개가 그대로 쓰인다(동률 처리와 동일).
function rankTopChars(chars) {
	var scored = chars.map(function (ch) {
		var doc = DB.statsData && DB.statsData.ko && DB.statsData.ko[ch];
		var score = doc ? ((doc['startall_' + STATS_STATE] || 0) + (doc['endall_' + STATS_STATE] || 0)) : 0;
		return { ch: ch, score: score };
	});
	scored.sort(function (a, b) { return b.score - a.score; });
	return scored.slice(0, 100).map(function (s) { return s.ch; });
}

function fetchRobotWords(my) {
	if (my.game.robotWordsLoading) return;
	if (!my.game.botCharPool || my.game.botCharPool.length === 0) return;
	my.game.robotWordsLoading = true;
	my.game.robotWords = null;
	my.game.robotClaimed = new Set();

	var lang = my.rule.lang;
	var maxLen = Math.max.apply(null, lang === 'ko' ? ROBOT_SHUK_MAX_LEN_KO : ROBOT_SHUK_MAX_LEN_EN);
	var minLen = 2;
	var chars = my.game.botCharPool.slice().sort().join('');
	var cacheKey = lang + ':' + minLen + ':' + maxLen + ':' + chars;
	var now = Date.now();
	var cached = _shukWordCache[cacheKey];

	function applyList(rawList) {
		var submittedSet = new Set(my.game.words || []);
		var list = rawList.filter(function (w) { return !submittedSet.has(w); });
		for (var i = list.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = list[i]; list[i] = list[j]; list[j] = t;
		}
		my.game.robotWords = list;
		my.game.robotClaimed = new Set();
	}

	if (cached && now - cached.time < SHUK_CACHE_TTL) {
		my.game.robotWordsLoading = false;
		applyList(cached.words);
		return;
	}

	var sql = "SELECT _id FROM kkutu_" + lang
		+ " WHERE _id ~ '^[" + chars + "]{" + minLen + "," + maxLen + "}$' AND hit >= 1"
		+ " ORDER BY hit DESC LIMIT 2500";

	DB.kkutu[lang].direct(sql, function (err, res) {
		my.game.robotWordsLoading = false;
		if (err || !res || !my.game.botCharPool) return;
		var rawList = res.rows.map(function (r) { return r._id; });
		_shukWordCache[cacheKey] = { time: Date.now(), words: rawList };
		applyList(rawList);
	});
}

function pickForRobot(my, level) {
	var lang = my.rule.lang;
	var maxLen = (lang === 'ko') ? ROBOT_SHUK_MAX_LEN_KO[level] : ROBOT_SHUK_MAX_LEN_EN[level];
	var claimed = my.game.robotClaimed;
	var submitted = my.game.words;
	var words = my.game.robotWords;

	for (var i = 0; i < words.length; i++) {
		var w = words[i];
		if (w.length > maxLen) continue;
		if (submitted.indexOf(w) !== -1) continue;
		if (claimed.has(w)) continue;
		claimed.add(w);
		return w;
	}
	return null;
}

function robotSubmitOne(my, robot) {
	if (robot.level === -1) return;
	if (my.game.late || !my.gaming) return;

	var level = robot.level || 2;
	if ((robot._shukSubmitted || 0) >= ROBOT_SHUK_MAX_WORDS[level]) return;

	if (my.game.robotWordsLoading || !my.game.robotWords) {
		robot._shukTimer = setTimeout(function () { robotSubmitOne(my, robot); }, 500);
		return;
	}

	var picked = pickForRobot(my, level);

	if (!picked) {
		fetchRobotWords(my);
		robot._shukTimer = setTimeout(function () { robotSubmitOne(my, robot); }, 1000);
		return;
	}

	var cpm = BOT_SHUK_CPM[level];
	var typingTime = Math.max(200, (picked.length * 60000) / cpm + (Math.random() * 300 - 150));

	robot._shukTimer = setTimeout(function () {
		if (my.game.late || !my.gaming) return;
		var prevLen = my.game.words ? my.game.words.length : 0;
		my.turnRobot(robot, picked);
		if (my.game.words && my.game.words.length > prevLen) {
			robot._shukSubmitted = (robot._shukSubmitted || 0) + 1;
		}
		robotSubmitOne(my, robot);
	}, typingTime);
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

		if (my.rule.lang === 'ko') {
			my.game.botCharPool = rankTopChars(Const.buildSyllablesFromJamo(my.game.poolSet));
		} else {
			my.game.botCharPool = units.slice();
		}
		my.game.robotWords = null;
		my.game.robotClaimed = new Set();
		my.game.robotWordsLoading = false;
		if (my.game.robots && my.game.robots.length > 0) {
			fetchRobotWords(my);
		}

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

	if (!my.opts.stop) {
		my.game.moveTimer = setInterval(function () {
			applyMove(my);
		}, MOVE_INTERVAL);
	}

	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			robot._shukSubmitted = 0;
			robot._shukTimer = setTimeout(function () {
				robotSubmitOne(my, robot);
			}, ROBOT_SHUK_START_DELAY[robot.level || 2]);
		});
	}
};
exports.turnEnd = function () {
	var my = this;

	my.game.late = true;
	clearInterval(my.game.moveTimer);

	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			if (robot._shukTimer) {
				clearTimeout(robot._shukTimer);
				robot._shukTimer = null;
			}
		});
	}

	my.byMaster('turnEnd', {});
	my.game._rrt = setTimeout(my.roundReady, 3000);
};
exports.submit = function (client, text, data) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
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

	if (client.robot) {
		// 봇 후보 단어는 fetchRobotWords에서 이미 hit >= 1 조건으로 DB 검증을 마치고 나온 것이므로 재조회 생략
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
		return;
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
