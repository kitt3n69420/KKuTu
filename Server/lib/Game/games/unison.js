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
 * Unison (이구동성) - 질문과 선택지 2개를 보고 라운드 동안 1 또는 2를 한 번 고른다 (바꿀 수 없음).
 * 라운드가 끝나거나 모두 고르면, 더 많이 고른 쪽을 고른 사람이 라운드당 100점. 동률이면 아무도 못 받음.
 * 소수결(minority): 적게 고른 쪽이 점수. 동률이거나 한쪽을 아무도 안 골랐으면(만장일치) 아무도 못 받음.
 * 삼지선다(threeway): 선택지가 3개인 문제만 나오고 1, 2, 3 중에서 고름. 가장 많이 고른 쪽이 둘이면 둘 다 점수, 셋 다 같으면 아무도 못 받음.
 *   소수결과 함께면 누군가 고른 쪽 중 가장 적게 고른 쪽(둘이면 둘 다)이 점수. 고른 쪽끼리 모두 같으면 아무도 못 받음.
 * 문제는 data/xig.txt (한 줄에 "질문 | 선택 1 | 선택 2" 또는 "질문 | 선택 1 | 선택 2 | 선택 3", #으로 시작하는 줄은 설명).
 * 삼지선다가 꺼져 있으면 모든 문제를 앞의 선택지 2개로만 낸다. 봇은 들어올 수 없다(const.js ai: false).
 * 참가자의 채팅 금지는 slave.js, 방 안 귓속말 금지는 master.js·slave.js에서 막는다. 관전자는 채팅할 수 있다.
 */

var Lizard = require('../../sub/lizard');
var File = require('fs');
var DIC;

var SCORE = 100;
var QUESTIONS = []; // [{ q: "휴양지로 더 가고 싶은 곳은?", a: ["산", "바다", "계곡"] }, ...] (선택지는 2개 또는 3개)

File.readFile(`${__dirname}/../../data/xig.txt`, 'utf8', function (err, res) {
	if (err) return;
	QUESTIONS = res.split(/\r?\n/).map(function (line) {
		var p;

		if (!line.trim() || line.trim().charAt(0) === '#') return null;
		p = line.split('|').map(function (s) { return s.trim(); });
		return ((p.length === 3 || p.length === 4) && p.every(function (s) { return s; })) ? { q: p[0], a: p.slice(1) } : null;
	}).filter(function (x) { return x; });
});

exports.init = function (_DB, _DIC) {
	DIC = _DIC;
};

// 경기 중인 사람(봇 없음)이 모두 골랐는지
function allVoted(my) {
	var ids = my.game.seq.filter(function (id) { return typeof id === 'string'; });

	return ids.length > 0 && ids.every(function (id) { return my.game.votes[id]; });
}

// 점수를 받을 선택지 번호들(1부터)과, 아무도 못 받았을 때 그 까닭이 동률인지(tie, 아니면 모두 같은 쪽을 고름)
// 소수결은 아무도 안 고른 쪽을 빼고 셈. 후보가 모두 같은 인원이면 동률
function pickSides(counts, minority) {
	var idx = [], target, best;

	counts.forEach(function (c, i) {
		if (!minority || c) idx.push(i);
	});
	if (idx.length < 2) return { sides: [], tie: !idx.length };
	target = Math[minority ? 'min' : 'max'].apply(null, idx.map(function (i) { return counts[i]; }));
	best = idx.filter(function (i) { return counts[i] === target; });
	if (best.length === idx.length) return { sides: [], tie: true };
	return { sides: best.map(function (i) { return i + 1; }), tie: false };
}

// 라운드 수만큼 겹치지 않게 문제를 뽑아 둠. 제시어 칸(라운드 표시)은 자음퀴즈처럼 ①②③…
// 삼지선다면 선택지 3개짜리 문제만, 아니면 모든 문제를 앞의 선택지 2개로
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var n = my.opts.threeway ? 3 : 2;
	var pool = QUESTIONS.filter(function (x) { return x.a.length >= n; }), list = [], q;

	while (list.length < my.round && pool.length) {
		q = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
		list.push({ q: q.q, a: q.a.slice(0, n) });
	}
	my.game.questions = list;
	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};

exports.roundReady = function () {
	var my = this;
	var q;

	clearTimeout(my.game.qTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	my.game.late = true;
	my.game.votes = {};
	q = my.game.questions && my.game.questions[my.game.round - 1];
	if (my.game.round <= my.round && q) {
		my.game.question = q;
		my.byMaster('roundReady', { round: my.game.round, question: q.q, choices: q.a }, true);
		my.game._tsTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};

exports.turnStart = function () {
	var my = this;

	if (!my.game || !my.game.question) return;

	my.game.late = false;
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', { roundTime: my.game.roundTime, voted: [] }, true);
};

exports.submit = function (client, text) {
	var my = this;
	var pick = String(text).trim();
	var n;

	if (!my.game || !my.game.votes) return;
	// 관전자는 채팅할 수 있음
	if (client.robot || my.game.seq.indexOf(client.id) === -1) return client.chat(text);
	if (my.game.late) return client.send('chat', { notice: true, code: 'unisonNoChat' });
	if (my.game.votes[client.id]) return client.send('chat', { notice: true, code: 'unisonAlready' });
	n = my.game.question.a.length;
	if (!/^[1-3]$/.test(pick) || Number(pick) > n) return client.send('chat', { notice: true, code: n === 3 ? 'unisonOnly123' : 'unisonOnly12' });

	my.game.votes[client.id] = Number(pick);
	// 모두에게는 고른 사실만, 본인에게는 고른 번호까지
	client.publish('turnEnd', { target: client.id, voted: true }, true);
	client.send('turnEnd', { target: client.id, voted: true, pick: Number(pick) });
	// 중간에 들어온 관전자가 누가 골랐는지 보도록 마지막 turnStart에 반영
	if (my.game.specTS) my.game.specTS.data.voted = Object.keys(my.game.votes);
	if (allVoted(my)) my.turnEnd();
};

exports.turnEnd = function () {
	var my = this;
	var counts, picks = {}, win = [], scores = {};
	var res;

	if (!my.game || my.game.late) return;

	my.game.late = true;
	clearTimeout(my.game.qTimer);
	counts = my.game.question.a.map(function () { return 0; });
	my.game.seq.forEach(function (id) {
		var v = my.game.votes[id];

		if (v) {
			counts[v - 1]++;
			picks[id] = v;
		}
	});
	res = pickSides(counts, my.opts.minority);
	my.game.seq.forEach(function (id) {
		var o = DIC[id];

		if (!o || !o.game) return;
		if (res.sides.indexOf(picks[id]) !== -1) {
			o.game.score += SCORE;
			win.push(id);
		}
		scores[id] = o.game.score;
	});
	my.byMaster('turnEnd', { counts: counts, sides: res.sides, tie: res.tie, picks: picks, win: win, scores: scores, score: SCORE });
	if (typeof my.sendUnisonRoundEnd === 'function') my.sendUnisonRoundEnd(my.game.question.q, my.game.question.a, picks, res.sides, res.tie);
	my.game._rrt = setTimeout(my.roundReady, 4000);
};

// 아직 안 고른 사람이 나가 남은 사람이 모두 골랐으면 라운드를 바로 끝냄 (room.js가 seq에서 뺀 다음에 판단)
exports.onLeave = function () {
	var my = this;

	setTimeout(function () {
		if (my.gaming && my.game && my.game.votes && !my.game.late && allVoted(my)) my.turnEnd();
	}, 0);
};
