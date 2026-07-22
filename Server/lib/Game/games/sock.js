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

// 보드 문자 집합별 단어 목록 캐시 (TTL: 3분)
var _sockWordCache = {};
var SOCK_CACHE_TTL = 3 * 60 * 1000;

const ROBOT_SOCK_START_DELAY = [5000, 3000, 1800, 900, 300];
const ROBOT_SOCK_MAX_WORDS = [10, 20, 30, 50, 999];
const BOT_SOCK_CPM = [30, 60, 120, 300, 800];
const ROBOT_SOCK_MAX_LEN_KO = [3, 2, 3, 4, 8];
const ROBOT_SOCK_MAX_LEN_EN = [4, 5, 7, 10, 20];

function buildFreqMap(str) {
	var map = {};
	for (var i = 0; i < str.length; i++) {
		var ch = str[i];
		if (ch !== '　') map[ch] = (map[ch] || 0) + 1;
	}
	return map;
}

function canMakeWord(boardFreq, word) {
	var need = {};
	for (var i = 0; i < word.length; i++) {
		var ch = word[i];
		need[ch] = (need[ch] || 0) + 1;
		if ((boardFreq[ch] || 0) < need[ch]) return false;
	}
	return true;
}

function fetchRobotWords(my) {
	if (my.game.robotWordsLoading) return;
	if (my.game.robotFetchExhausted) return;
	my.game.robotWordsLoading = true;
	my.game.robotWords = null;
	my.game.robotClaimed = new Set();

	var conf = LANG_STATS[my.rule.lang];
	var freq = my.game.robotBoardFreq;
	var sortedChars = Object.keys(freq).filter(function (ch) { return freq[ch] > 0; }).sort().join('');
	var lenMatch = conf.reg.source.match(/\{(\d+),(\d+)\}/);
	var minLen = lenMatch ? parseInt(lenMatch[1]) : 2;
	var maxLen = Math.max.apply(null, my.rule.lang === 'ko' ? ROBOT_SOCK_MAX_LEN_KO : ROBOT_SOCK_MAX_LEN_EN);
	if (my.opts.no2 && minLen < 3) minLen = 3;

	var cacheKey = my.rule.lang + ':' + minLen + ':' + maxLen + ':' + sortedChars;
	var now = Date.now();
	var cached = _sockWordCache[cacheKey];
	if (cached && now - cached.time < SOCK_CACHE_TTL) {
		var submitted = my.game.words || [];
		var submittedSet = new Set(submitted);
		var list = cached.words
			.filter(function (w) { return !submittedSet.has(w) && canMakeWord(my.game.robotBoardFreq, w); });
		for (var ii = list.length - 1; ii > 0; ii--) {
			var jj = Math.floor(Math.random() * (ii + 1));
			var tt = list[ii]; list[ii] = list[jj]; list[jj] = tt;
		}
		my.game.robotWords = list;
		my.game.robotClaimed = new Set();
		my.game.robotWordsLoading = false;
		return;
	}

	// uniqueChars (삽입 순서 유지, SQL용)
	var uniqueChars = Object.keys(freq).filter(function (ch) { return freq[ch] > 0; }).join('');
	var botSql = "SELECT _id FROM kkutu_" + my.rule.lang
		+ " WHERE _id ~ '^[" + uniqueChars + "]{" + minLen + "," + maxLen + "}$' AND hit >= 1";
	if (conf.add) botSql += " AND " + conf.add[0] + " ~ '" + conf.add[1].source + "'";
	botSql += " ORDER BY hit DESC LIMIT 2500";

	DB.kkutu[my.rule.lang].direct(botSql, function (err, res) {
		my.game.robotWordsLoading = false;
		if (err || !res || !my.game.robotBoardFreq) return;

		var rawList = res.rows.map(function (r) { return r._id; });
		_sockWordCache[cacheKey] = { time: Date.now(), words: rawList };

		var submitted = my.game.words || [];
		var submittedSet = new Set(submitted);
		var list = rawList.filter(function (w) { return !submittedSet.has(w) && canMakeWord(my.game.robotBoardFreq, w); });

		if (list.length === 0) {
			my.game.robotEmptyCount = (my.game.robotEmptyCount || 0) + 1;
			if (my.game.robotEmptyCount >= 10) my.game.robotFetchExhausted = true;
		} else {
			my.game.robotEmptyCount = 0;
		}
		for (var i = list.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = list[i]; list[i] = list[j]; list[j] = t;
		}
		my.game.robotWords = list;
		my.game.robotClaimed = new Set();
	});
}

function fetchRobotWordsFallback(my) {
	if (my.game.robotWordsLoading) return;
	if (my.game.robotFallbackDone) return;
	my.game.robotWordsLoading = true;
	my.game.robotFallbackDone = true;
	my.game.robotWords = null;
	my.game.robotClaimed = new Set();

	var conf = LANG_STATS[my.rule.lang];
	var freq = my.game.robotBoardFreq;
	var exactLen = my.opts.no2 ? 3 : 2;
	var sortedChars = Object.keys(freq).filter(function (ch) { return freq[ch] > 0; }).sort().join('');
	var cacheKey = my.rule.lang + ':' + exactLen + ':' + exactLen + ':' + sortedChars;
	var now = Date.now();
	var cached = _sockWordCache[cacheKey];
	if (cached && now - cached.time < SOCK_CACHE_TTL) {
		var submitted = my.game.words || [];
		var submittedSet = new Set(submitted);
		var list = cached.words
			.filter(function (w) { return !submittedSet.has(w) && canMakeWord(my.game.robotBoardFreq, w); });
		for (var ii = list.length - 1; ii > 0; ii--) {
			var jj = Math.floor(Math.random() * (ii + 1));
			var tt = list[ii]; list[ii] = list[jj]; list[jj] = tt;
		}
		my.game.robotWords = list;
		my.game.robotClaimed = new Set();
		my.game.robotWordsLoading = false;
		return;
	}

	var uniqueChars = Object.keys(freq).filter(function (ch) { return freq[ch] > 0; }).join('');
	var botSql = "SELECT _id FROM kkutu_" + my.rule.lang
		+ " WHERE _id ~ '^[" + uniqueChars + "]{" + exactLen + "," + exactLen + "}$' AND hit >= 1";
	if (conf.add) botSql += " AND " + conf.add[0] + " ~ '" + conf.add[1].source + "'";

	DB.kkutu[my.rule.lang].direct(botSql, function (err, res) {
		my.game.robotWordsLoading = false;
		if (err || !res || !my.game.robotBoardFreq) return;
		var rawList = res.rows.map(function (r) { return r._id; });
		_sockWordCache[cacheKey] = { time: Date.now(), words: rawList };
		var submitted = my.game.words || [];
		var submittedSet = new Set(submitted);
		var list = rawList.filter(function (w) { return !submittedSet.has(w) && canMakeWord(my.game.robotBoardFreq, w); });
		for (var i = list.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = list[i]; list[i] = list[j]; list[j] = t;
		}
		my.game.robotWords = list;
		my.game.robotClaimed = new Set();
	});
}

function pickForRobot(my, level) {
	var maxLen = (my.rule.lang === 'ko') ? ROBOT_SOCK_MAX_LEN_KO[level] : ROBOT_SOCK_MAX_LEN_EN[level];
	var claimed = my.game.robotClaimed;
	var submitted = my.game.words;
	var freq = my.game.robotBoardFreq;
	var words = my.game.robotWords;

	for (var i = 0; i < words.length; i++) {
		var w = words[i];
		if (w.length > maxLen) continue;
		if (submitted.indexOf(w) !== -1) continue;
		if (claimed.has(w)) continue;
		if (!canMakeWord(freq, w)) continue;
		claimed.add(w);
		return w;
	}
	return null;
}

function robotSubmitOne(my, robot) {
	if (robot.level === -1) return;
	if (my.game.late || !my.gaming) return;

	var level = robot.level || 2;
	if ((robot._sockSubmitted || 0) >= ROBOT_SOCK_MAX_WORDS[level]) return;

	if (my.game.robotWordsLoading || !my.game.robotWords) {
		robot._sockTimer = setTimeout(function () { robotSubmitOne(my, robot); }, 500);
		return;
	}

	var picked = pickForRobot(my, level);

	if (!picked) {
		if (my.game.robotFetchExhausted) {
			fetchRobotWordsFallback(my);
		} else {
			fetchRobotWords(my);
		}
		robot._sockTimer = setTimeout(function () { robotSubmitOne(my, robot); }, 1000);
		return;
	}

	var cpm = BOT_SOCK_CPM[level] * (my.opts.no2 ? 0.5 : 1);
	var typingTime = Math.max(200, (picked.length * 60000) / cpm + (Math.random() * 300 - 150));

	robot._sockTimer = setTimeout(function () {
		if (my.game.late || !my.gaming) return;
		var prevLen = my.game.words ? my.game.words.length : 0;
		my.turnRobot(robot, picked);
		if (my.game.words && my.game.words.length > prevLen) {
			robot._sockSubmitted = (robot._sockSubmitted || 0) + 1;
		}
		robotSubmitOne(my, robot);
	}, typingTime);
}

const LANG_STATS = {
	'ko': {
		reg: /^[가-힣]{2,5}$/,
		add: ['type', Const.KOR_GROUP],
		len: 100,
		min: 5
	}, 'en': {
		reg: /^[a-z]{4,10}$/,
		len: 100,
		min: 10
	}
};

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function () {
	var my = this;
	var words = [];
	var conf = LANG_STATS[my.rule.lang];
	var i, w;

	// APL 모드에서는 설정을 직접 변경하지 않고 간주함
	var effectiveRound = my.opts.apple ? 1 : my.round;
	var effectiveTime = my.opts.apple ? 220 : my.time;
	var effectiveBig = my.opts.apple ? true : my.opts.big;

	var len = effectiveBig ? 196 : 100;

	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = effectiveTime * 1000;
	if (my.game.round <= effectiveRound) {
		var sql = "SELECT _id FROM kkutu_" + my.rule.lang + " WHERE _id ~ '" + conf.reg.source + "' AND hit >= 1";
		if (conf.add) sql += " AND " + conf.add[0] + " ~ '" + conf.add[1].source + "'";
		sql += " ORDER BY log(greatest(hit, 2)) + random() * 3 DESC LIMIT 1500";

		DB.kkutu[my.rule.lang].direct(sql, function (err, res) {
			if (err || !res) {
				my.game.round--;
				my.game.turnTimer = setTimeout(my.roundReady, 3000);
				return;
			}
			var $docs = res.rows.slice();
			for (var si = $docs.length - 1; si > 0; si--) {
				var sj = Math.floor(Math.random() * (si + 1));
				var st = $docs[si]; $docs[si] = $docs[sj]; $docs[sj] = st;
			}
			while (w = $docs.shift()) {
				words.push(w._id);
				i = w._id.length;
				if ((len -= i) <= conf.min) break;
			}
			words.sort(function (a, b) { return b.length - a.length; });
			my.game.words = [];
			my.game.board = getBoard(words, effectiveBig ? 196 : 100);
			my.game.robotBoardFreq = buildFreqMap(my.game.board);
			my.game.robotWords = null;
			my.game.robotClaimed = new Set();
			my.game.robotWordsLoading = false;
			my.game.robotEmptyCount = 0;
			my.game.robotFetchExhausted = false;
			my.game.robotFallbackDone = false;

			if (my.game.robots && my.game.robots.length > 0) {
				fetchRobotWords(my);
			}

			my.byMaster('roundReady', {
				round: my.game.round,
				board: my.game.board,
				totalRound: effectiveRound,
				time: effectiveTime
			}, true);
			my.game.turnTimer = setTimeout(my.turnStart, 2400);
		});
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
		roundTime: my.game.roundTime
	}, true);

	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			robot._sockSubmitted = 0;
			robot._sockTimer = setTimeout(function () {
				robotSubmitOne(my, robot);
			}, ROBOT_SOCK_START_DELAY[robot.level || 2]);
		});
	}
};
exports.turnEnd = function () {
	var my = this;

	my.game.late = true;

	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			if (robot._sockTimer) {
				clearTimeout(robot._sockTimer);
				robot._sockTimer = null;
			}
		});
	}

	my.byMaster('turnEnd', {});
	my.game._rrt = setTimeout(my.roundReady, 3000);
};
exports.submit = function (client, text, data) {
	var my = this;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var score, i;

	if (!my.game.words) return;
	if (!text) return;

	if (!play) return client.chat(text);
	if (text.length < (my.opts.no2 ? 3 : 2)) {
		return client.chat(text);
	}
	if (my.game.words.indexOf(text) != -1) {
		return client.chat(text);
	}

	if (client.robot) {
		if (!my.game.board) return;
		var newBoard = my.game.board;
		var _newBoard = newBoard;
		var wl = text.split('');
		for (i = 0; i < wl.length; i++) {
			newBoard = newBoard.replace(wl[i], "");
			if (newBoard === _newBoard) return;
			_newBoard = newBoard;
		}
		score = my.getScore(text);
		my.game.words.push(text);
		my.game.board = newBoard;
		if (my.game.robotBoardFreq) {
			for (i = 0; i < wl.length; i++) {
				if (my.game.robotBoardFreq[wl[i]] > 0) my.game.robotBoardFreq[wl[i]]--;
			}
		}
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
		if (!my.game.board) return;

		var newBoard = my.game.board;
		var _newBoard = newBoard;
		var wl;

		if ($doc) {
			wl = $doc._id.split('');
			for (i in wl) {
				newBoard = newBoard.replace(wl[i], "");
				if (newBoard == _newBoard) { // 그런 글자가 없다.
					client.chat(text);
					return;
				}
				_newBoard = newBoard;
			}
			// 성공
			score = my.getScore(text);
			my.game.words.push(text);
			my.game.board = newBoard;
			if (my.game.robotBoardFreq) {
				for (i = 0; i < wl.length; i++) {
					if (my.game.robotBoardFreq[wl[i]] > 0) my.game.robotBoardFreq[wl[i]]--;
				}
			}
			client.game.score += score;
			client.publish('turnEnd', {
				target: client.id,
				value: text,
				score: score,
				totalScore: client.game.score
			}, true);
			client.invokeWordPiece(text, 1.1);
		} else {
			client.chat(text);
		}
	});

};
exports.getScore = function (text, delay) {
	var my = this;
	var len = (my.rule && my.rule.lang === "en") ? Math.round(text.length / 2) : text.length;

	return Math.round(Math.pow(len - 1, 1.6) * 8);
};
function getBoard(words, len) {
	var str = words.join("").split("");
	var sl = str.length;

	while (sl++ < len) str.push("　");

	// Fisher-Yates shuffle
	for (var i = str.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = str[i];
		str[i] = str[j];
		str[j] = temp;
	}

	return str.join("");
}