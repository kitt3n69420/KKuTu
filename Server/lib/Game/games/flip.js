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

var Lizard = require('../../sub/lizard');
var DB;
var DIC;

var BOARD_SIZE = 50;
var POOL_SIZE = 200;
var BOT_CPM = [20, 40, 80, 160, 320];
var BOT_ACCURACY = [0.9, 0.95, 0.98, 0.99, 1.0];
var BOT_REST_TIME = 3000;

// 녜힁 모드용 한글 조합 테이블
var NYH_INITIALS = [1, 4, 8, 10, 13];       // ㄲ ㄸ ㅃ ㅆ ㅉ
var NYH_VOWELS = [3, 7, 9, 10, 11, 14, 15, 16, 19]; // ㅒ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ
var NYH_FINALS = [2, 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18, 20]; // ㄲ ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ ㅆ

function generateNyhChar() {
	var ini = NYH_INITIALS[Math.floor(Math.random() * NYH_INITIALS.length)];
	var vow = NYH_VOWELS[Math.floor(Math.random() * NYH_VOWELS.length)];
	var fin = NYH_FINALS[Math.floor(Math.random() * NYH_FINALS.length)];
	return String.fromCharCode(0xAC00 + (ini * 21 + vow) * 28 + fin);
}

function generateNyhWord() {
	return generateNyhChar() + generateNyhChar();
}

function generateNyhPool(size) {
	var pool = [];
	var used = {};
	while (pool.length < size) {
		var word = generateNyhWord();
		if (!used[word]) {
			used[word] = true;
			pool.push(word);
		}
	}
	return pool;
}

// 영어 녜힁 모드용 알파벳+숫자 4글자 조합
var EN_NYH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateEnNyhWord() {
	var word = '';
	for (var i = 0; i < 4; i++) {
		word += EN_NYH_CHARS[Math.floor(Math.random() * EN_NYH_CHARS.length)];
	}
	return word;
}

function generateEnNyhPool(size) {
	var pool = [];
	var used = {};
	while (pool.length < size) {
		var word = generateEnNyhWord();
		if (!used[word]) {
			used[word] = true;
			pool.push(word);
		}
	}
	return pool;
}

function traverse(my, func) {
	var i, o, item;

	for (i in my.game.seq) {
		item = my.game.seq[i];
		if (typeof item === 'string') {
			if (!(o = DIC[item])) continue;
		} else {
			o = item;
		}
		if (!o.game) continue;
		func(o);
	}
}

function getOwnerTeam(my, ownerId) {
	if (!ownerId) return 0;
	var i, item, o;
	for (i in my.game.seq) {
		item = my.game.seq[i];
		if (typeof item === 'string') {
			o = DIC[item];
		} else {
			o = item;
		}
		if (!o) continue;
		if (o.id !== ownerId) continue;
		return o.robot ? (o.game.team || 0) : (o.team || 0);
	}
	return 0;
}

function shuffle(arr) {
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
	}
	return arr;
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var isEn = my.rule.lang === 'en';

	my.game.round = 0;

	if (my.opts.nyeohweok) {
		// 녜힁 모드: 랜덤 단어 200개 생성 (전 라운드 재사용)
		my.game.wordPool = isEn ? generateEnNyhPool(POOL_SIZE) : generateNyhPool(POOL_SIZE);
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	} else {
		// 일반 모드: DB에서 단어 200개 조회 (전 라운드 재사용)
		var table = isEn ? 'kkutu_en' : 'kkutu_ko';
		var wordLen = isEn ? 4 : 2;
		var filter = isEn ? "_id ~ '^[A-Za-z]+$'" : "_id NOT LIKE '% %'";
		var sql = "SELECT _id FROM " + table + " WHERE LENGTH(_id) = " + wordLen + " AND hit >= 1 AND " + filter + " ORDER BY log(greatest(hit, 2)) + random() * 3 DESC LIMIT 500";

		DB.kkutu[isEn ? 'en' : 'ko'].direct(sql, function (err, res) {
			if (err || !res || !res.rows) return;
			var rows = shuffle(res.rows.slice());
			my.game.wordPool = rows.slice(0, POOL_SIZE).map(function (item) { return item._id; });
			R.go("①②③④⑤⑥⑦⑧⑨⑩");
		});
	}

	return R;
};
exports.roundReady = function () {
	var my = this;
	var i;

	clearTimeout(my.game.qTimer);
	clearTimeout(my.game._rrt);
	my.game.round++;
	my.game.roundTime = my.time * 1000;

	if (my.game.round <= my.round) {
		var pool = shuffle(my.game.wordPool.slice());

		my.game.board = [];
		my.game.wordMap = {};
		for (i = 0; i < BOARD_SIZE; i++) {
			var word = pool[i];
			my.game.board.push({ word: word, owner: null });
			my.game.wordMap[word] = i;
		}
		my.game.reserve = pool.slice(BOARD_SIZE);

		my.byMaster('roundReady', {
			round: my.game.round,
			board: my.game.board.map(function (c) { return c.word; }),
			owners: my.game.board.map(function (c) { return c.owner; })
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

	traverse(my, function (o) {
		if (o.robot) exports.playRobot.call(my, o);
	});

	my.byMaster('turnStart', {
		roundTime: my.game.roundTime
	}, true);
};
exports.turnEnd = function () {
	var my = this;
	var scores = {};
	var cellCounts = {};
	var teamCells = {};
	var teamMembers = {};
	var totalPool = my.game.seq.length * 250;
	var i;

	my.game.late = true;
	clearTimeout(my.game.qTimer);

	// 봇 타이머 정리
	traverse(my, function (o) {
		if (o.robot && o.game.flipTimer) {
			clearTimeout(o.game.flipTimer);
			o.game.flipTimer = null;
		}
	});

	// 각 플레이어 소유 칸 카운트
	traverse(my, function (o) {
		cellCounts[o.id] = 0;
		var team = o.robot ? (o.game.team || 0) : (o.team || 0);
		if (team) {
			if (!teamCells[team]) { teamCells[team] = 0; teamMembers[team] = []; }
			teamMembers[team].push(o.id);
		}
	});

	for (i = 0; i < BOARD_SIZE; i++) {
		var owner = my.game.board[i].owner;
		if (owner && cellCounts.hasOwnProperty(owner)) {
			cellCounts[owner]++;
		}
	}

	// 팀별 셀 합산
	for (var team in teamMembers) {
		teamMembers[team].forEach(function (pid) {
			teamCells[team] += cellCounts[pid];
		});
	}

	// 점수 계산 및 적용
	traverse(my, function (o) {
		var t = o.robot ? (o.game.team || 0) : (o.team || 0);
		if (t && teamMembers[t]) {
			var tPool = Math.round(totalPool * teamCells[t] / BOARD_SIZE);
			scores[o.id] = Math.round(tPool / teamMembers[t].length);
		} else {
			scores[o.id] = Math.round(totalPool * (cellCounts[o.id] || 0) / BOARD_SIZE);
		}
		o.game.score += scores[o.id];
	});

	my.byMaster('turnEnd', { ok: false, scores: scores }, true);
	my.game._rrt = setTimeout(my.roundReady, 3000);
};
exports.submit = function (client, text) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var cellIndex, cell, previousOwner, newWord;

	if (!client.game) return;
	if (my.game.late) return client.chat(text);
	if (!play) return client.chat(text);
	if (!my.game.board) return;

	var expectedLen = (my.rule.lang === 'en') ? 4 : 2;
	if (text.length !== expectedLen) return client.chat(text);

	if (!my.game.wordMap.hasOwnProperty(text)) {
		client.send('turnEnd', { error: true });
		return;
	}

	cellIndex = my.game.wordMap[text];
	cell = my.game.board[cellIndex];

	if (cell.owner === client.id) {
		client.send('turnEnd', { error: true });
		return;
	}

	if (cell.owner) {
		var clientTeam = client.robot ? (client.game.team || 0) : (client.team || 0);
		var ownerTeam = getOwnerTeam(my, cell.owner);
		if (clientTeam && ownerTeam && clientTeam === ownerTeam) {
			client.send('turnEnd', { error: true });
			return;
		}
	}

	previousOwner = cell.owner;
	cell.owner = client.id;

	newWord = null;
	if (my.game.reserve.length > 0) {
		newWord = my.game.reserve.pop();
	}

	if (newWord) {
		delete my.game.wordMap[text];
		my.game.reserve.unshift(text);
		cell.word = newWord;
		my.game.wordMap[newWord] = cellIndex;
	}

	client.publish('turnEnd', {
		target: client.id,
		cellIndex: cellIndex,
		newWord: newWord || cell.word,
		owner: client.id,
		previousOwner: previousOwner
	}, true);
	client.invokeWordPiece(text, 1);
};
exports.getScore = function () {
	return 0;
};
exports.playRobot = function (robot) {
	if (robot.level === -1) return;
	var my = this;
	var level, cpm, accuracy;
	var botTeam, candidates, i, cell, ownerTeam;
	var targetIndex, targetWord, charCount, timeNeeded;

	if (my.game.late) return;
	if (!my.game.board) return;
	if (!robot.game) return;

	level = robot.level;
	cpm = BOT_CPM[level];
	accuracy = BOT_ACCURACY[level];
	botTeam = robot.game.team || 0;

	candidates = [];
	for (i = 0; i < BOARD_SIZE; i++) {
		cell = my.game.board[i];
		if (cell.owner === robot.id) continue;
		if (botTeam && cell.owner) {
			ownerTeam = getOwnerTeam(my, cell.owner);
			if (ownerTeam === botTeam) continue;
		}
		candidates.push(i);
	}

	if (candidates.length === 0) {
		robot.game.flipTimer = setTimeout(function () {
			if (!my.game.late && my.game.board) exports.playRobot.call(my, robot);
		}, BOT_REST_TIME + Math.floor(Math.random() * 2000));
		return;
	}

	targetIndex = candidates[Math.floor(Math.random() * candidates.length)];
	targetWord = my.game.board[targetIndex].word;

	charCount = targetWord.length;
	timeNeeded = (charCount * 60 * 1000) / cpm;
	if (my.opts.nyeohweok) timeNeeded *= 2;
	timeNeeded += (Math.random() * 200 - 100);

	robot.game.flipTimer = setTimeout(function () {
		if (my.game.late) return;
		if (!my.game.board) return;

		var isCorrect = Math.random() < accuracy;
		if (isCorrect) {
			my.submit(robot, targetWord);
		}

		exports.playRobot.call(my, robot);
	}, timeNeeded);
};
