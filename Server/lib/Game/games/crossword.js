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
var Shapes = require('./cw_shapes').MAPS;
var DB;
var DIC;

const ROBOT_CW_INTERVAL = [48000, 24000, 12000, 6000, 3000];

function getBoardQuestions(my, boardIdx) {
	var board = my.game.boards[boardIdx];
	var qs = board.map(function (item) {
		return {
			key: boardIdx + ',' + item[0] + ',' + item[1] + ',' + item[2],
			data: [boardIdx, Number(item[0]), Number(item[1]), Number(item[2])]
		};
	});
	for (var i = qs.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var t = qs[i]; qs[i] = qs[j]; qs[j] = t;
	}
	return qs;
}

function pickRandomUnsolvedBoard(my) {
	var available = [];
	for (var i = 0; i < my.game.boards.length; i++) {
		var board = my.game.boards[i];
		for (var j = 0; j < board.length; j++) {
			var key = i + ',' + board[j][0] + ',' + board[j][1] + ',' + board[j][2];
			if (my.game.answers[key]) { available.push(i); break; }
		}
	}
	if (available.length === 0) return -1;
	return available[Math.floor(Math.random() * available.length)];
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var my = this;
	if (my.rule.calc) return getTitleCalc(my);
	return getTitleWord.call(my);
};
function getTitleWord() {
	var R = new Lizard.Tail();
	var my = this;
	var means = [];
	var mdb = [];

	my.game.started = false;
	DB.kkutu_cw[my.rule.lang].find().on(function ($box) {
		var answers = {};
		var boards = [];
		var maps = [];
		var left = my.round;
		var pick, pi, i, j;
		// 슬롯마다 findOne을 따로 날리던 것을 뜻 조회 단일 IN 쿼리로 묶기 위한 목록
		var items = [];
		var wordSet = {};

		while (left) {
			pick = $box[pi = Math.floor(Math.random() * $box.length)];
			if (!pick) return;
			$box.splice(pi, 1);
			if (maps.includes(pick.map)) continue;
			means.push({});
			mdb.push({});
			maps.push(pick.map);
			boards.push(pick.data.split('|').map(function (item) { return item.split(','); }));
			left--;
		}
		for (i in boards) {
			for (j in boards[i]) {
				pi = boards[i][j];
				items.push({ round: i, bItem: pi, word: pi[4] });
				wordSet[pi[4]] = true;
				answers[`${i},${pi[0]},${pi[1]},${pi[2]}`] = pi.pop();
			}
		}
		my.game.numQ = items.length;

		var words = Object.keys(wordSet);
		if (!words.length) return finish({});
		DB.kkutu[my.rule.lang].find(['_id', { '$in': words }]).limit(['mean', true], ['type', true], ['theme', true]).on(function (rows) {
			var byId = {};
			rows.forEach(function (row) { byId[row._id] = row; });
			finish(byId);
		});

		function finish(byId) {
			items.forEach(function (item) {
				applyMeaning(item.round, item.bItem, item.word, byId[item.word]);
			});
			my.game.prisoners = {};
			my.game.answers = answers;
			my.game.boards = boards;
			my.game.means = means;
			my.game.mdb = mdb;
			R.go("①②③④⑤⑥⑦⑧⑨⑩");
		}
	});
	function applyMeaning(round, bItem, word, doc) {
		if (!doc) return;
		var x = Number(bItem[0]), y = Number(bItem[1]);
		var rk = `${x},${y}`;
		var i, o;

		means[round][`${rk},${bItem[2]}`] = o = {
			count: 0,
			x: x, y: y,
			dir: Number(bItem[2]), len: Number(bItem[3]),
			type: doc.type,
			theme: doc.theme,
			mean: doc.mean.replace(new RegExp(word.split('').map(function (w) { return w + "\\s?"; }).join(''), "g"), "★")
		};
		for (i = 0; i < o.len; i++) {
			rk = `${x},${y}`;
			if (!mdb[round][rk]) mdb[round][rk] = [];
			mdb[round][rk].push(o);
			if (o.dir) y++; else x++;
		}
	}
	return R;
}
function getTitleCalc(my) {
	var R = new Lizard.Tail();
	var means = [], mdb = [], boards = [], answers = {};
	var i;

	my.game.started = false;
	for (i = 0; i < my.round; i++) {
		var round = buildCalcRound();
		means.push({});
		mdb.push({});
		boards.push(round);
		fillCalcMeaning(i, round, means, mdb);
		round.forEach(function (item) {
			answers[`${i},${item[0]},${item[1]},${item[2]}`] = item.pop();
		});
	}
	my.game.numQ = boards.reduce(function (s, b) { return s + b.length; }, 0);
	my.game.prisoners = {};
	my.game.answers = answers;
	my.game.boards = boards;
	my.game.means = means;
	my.game.mdb = mdb;
	R.go("①②③④⑤⑥⑦⑧⑨⑩");
	return R;
}
function fillCalcMeaning(round, board, means, mdb) {
	board.forEach(function (item) {
		var x = item[0], y = item[1], dir = item[2], len = item[3], digits = item[4];
		var cx = x, cy = y, i, rk;
		var o = means[round][`${x},${y},${dir}`] = {
			count: 0, x: x, y: y,
			dir: dir, len: len,
			type: "", theme: "",
			mean: Const.generateMathClue(digits)
		};
		for (i = 0; i < len; i++) {
			rk = `${cx},${cy}`;
			if (!mdb[round][rk]) mdb[round][rk] = [];
			mdb[round][rk].push(o);
			if (dir) cy++; else cx++;
		}
	});
}
function buildCalcRound() {
	var shape = Shapes[Math.floor(Math.random() * Shapes.length)];
	var queue = shape.queue.split(' ').map(function (s) { return s.split('').map(Number); });
	var board = {}; // "x,y" -> 한 자리 숫자 문자
	var starts = {}; // "x,y" -> 이 칸이 어떤 슬롯의 첫 칸이면 true(0 금지)
	var x, y, i;

	queue.forEach(function (slot) { starts[`${slot[0]},${slot[1]}`] = true; });
	queue.forEach(function (slot) {
		x = slot[0]; y = slot[1];
		for (i = 0; i < slot[3]; i++) {
			var rk = `${x},${y}`;
			if (board[rk] === undefined) {
				var d = starts[rk] ? (1 + Math.floor(Math.random() * 9)) : Math.floor(Math.random() * 10);
				board[rk] = String(d);
			}
			if (slot[2]) y++; else x++;
		}
	});
	return queue.map(function (slot) {
		var digits = '', px = slot[0], py = slot[1];
		for (var j = 0; j < slot[3]; j++) {
			digits += board[`${px},${py}`];
			if (slot[2]) py++; else px++;
		}
		return [slot[0], slot[1], slot[2], slot[3], digits];
	});
}
exports.roundReady = function () {
	var my = this;

	if (!my.game.started) {
		my.game.started = true;
		my.game.roundTime = my.time * 1000;
		my.byMaster('roundReady', {
			seq: my.game.seq
		}, true);
		setTimeout(my.turnStart, 2400);
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
		boards: my.game.boards,
		means: my.game.means
	}, true);

	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			robot._cwBoard = undefined;
			robot._cwQuestions = null;
			robot._cwQIdx = 0;
			robot._cwTimer = null;
			my.readyRobot(robot);
		});
	}
};
function turnHint() {
	var my = this;

	my.byMaster('turnHint', {
		hint: my.game.hint[my.game.meaned++]
	}, true);
}
exports.turnEnd = function () {
	var my = this;
	var i;

	my.game.late = true;
	if (my.game.robots) {
		my.game.robots.forEach(function (robot) {
			clearTimeout(robot._cwTimer);
			robot._cwTimer = null;
		});
	}
	my.byMaster('turnEnd', {});
	my.game._rrt = setTimeout(my.roundReady, 2500);
};
exports.submit = function (client, text, data) {
	var my = this;
	var obj, score, mbjs, mbj, jx, jy, v;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var i, j, key;

	if (!my.game.boards) return;
	if (!my.game.answers) return;
	if (!my.game.mdb) return;
	if (data && play) {
		if (!Array.isArray(data) || data.length < 4) return;
		if (typeof data[0] !== 'number' || typeof data[1] !== 'number' || typeof data[2] !== 'number') return;
		if (data[3] !== "0" && data[3] !== "1" && data[3] !== 0 && data[3] !== 1) return;
		key = `${data[0]},${data[1]},${data[2]},${data[3]}`;
		obj = my.game.answers[key];
		mbjs = my.game.mdb[data[0]];
		if (!mbjs) return;
		if (obj && obj == text) {
			score = text.length * 10;

			jx = Number(data[1]), jy = Number(data[2]);
			my.game.prisoners[key] = text;
			my.game.answers[key] = false;
			for (i = 0; i < obj.length; i++) {
				if (mbj = mbjs[`${jx},${jy}`]) {
					for (j in mbj) {
						key = [data[0], mbj[j].x, mbj[j].y, mbj[j].dir];
						if (++mbj[j].count == mbj[j].len) {
							if (v = my.game.answers[key.join(',')]) setTimeout(my.submit, 1, client, v, key);
						}
					}
				}
				if (data[3] == "1") jy++; else jx++;
			}
			// 방어 코드: score가 유효한 숫자인지 확인
			if (typeof score !== 'number' || isNaN(score)) {
				score = 0;
			}
			// 방어 코드: client.game 및 client.game.score 확인
			if (!client.game) {
				client.game = { score: 0, bonus: 0, team: 0 };
			}
			if (typeof client.game.score !== 'number' || isNaN(client.game.score)) {
				client.game.score = 0;
			}
			client.game.score += score;
			client.publish('turnEnd', {
				target: client.id,
				pos: data,
				value: text,
				score: score,
				totalScore: client.game.score
			});
			client.invokeWordPiece(text, 1.2);
			if (--my.game.numQ < 1) {
				clearTimeout(my.game.qTimer);
				my.turnEnd();
			}
		} else client.send('turnHint', { value: text });
	} else {
		client.chat(text);
	}
};
exports.getScore = function (text, delay) {
	var my = this;
	// 방어 코드: 필수 값들의 유효성 검증
	var hum = (typeof my.game.hum === 'number') ? my.game.hum : 1;
	var primary = (typeof my.game.primary === 'number') ? my.game.primary : 0;
	var roundTime = (typeof my.game.roundTime === 'number' && my.game.roundTime > 0) ? my.game.roundTime : 1;
	var themeBonus = (typeof my.game.themeBonus === 'number' && !isNaN(my.game.themeBonus)) ? my.game.themeBonus : 1;

	var rank = Math.max(1, hum - primary + 3); // 최소 1 보장
	var tr = 1 - delay / roundTime;
	if (isNaN(tr) || tr < 0) tr = 0;
	if (tr > 1) tr = 1;

	var score = (rank * rank * 3) * (0.5 + 0.5 * tr);
	var result = Math.round(score * themeBonus);

	// NaN 방어
	return isNaN(result) ? 0 : result;
};
exports.readyRobot = function (robot) {
	if (robot.level === -1) return;
	var my = this;
	if (my.game.late || !my.gaming) return;

	var level = robot.level || 2;

	function getNextQuestion() {
		// 현재 보드의 남은 문제 시도
		while (robot._cwBoard !== undefined && robot._cwBoard !== -1 &&
			robot._cwQuestions && robot._cwQIdx < robot._cwQuestions.length) {
			var q = robot._cwQuestions[robot._cwQIdx++];
			if (my.game.answers[q.key]) return q;
		}
		// 현재 보드 소진 → 새 보드 선택
		var newBoard = pickRandomUnsolvedBoard(my);
		if (newBoard === -1) return null;
		robot._cwBoard = newBoard;
		robot._cwQuestions = getBoardQuestions(my, newBoard);
		robot._cwQIdx = 0;
		while (robot._cwQIdx < robot._cwQuestions.length) {
			var q = robot._cwQuestions[robot._cwQIdx++];
			if (my.game.answers[q.key]) return q;
		}
		return null;
	}

	var q = getNextQuestion();
	if (!q) return;

	var interval = ROBOT_CW_INTERVAL[level];
	interval += Math.round((Math.random() * 0.4 - 0.2) * interval);

	robot._cwTimer = setTimeout(function () {
		if (my.game.late || !my.gaming) return;
		var answer = my.game.answers[q.key];
		if (answer) my.turnRobot(robot, answer, q.data);
		my.readyRobot(robot);
	}, interval);
};