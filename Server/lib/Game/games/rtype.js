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

// 리듬 타이퍼 (KRT): 4패널 치기(rhythm.js)의 곡/채보를 그룹으로 나눠 그룹마다 단어를 배정하고,
// 단어의 자모(그룹 마지막 노트는 엔터)를 노트 시각에 맞춰 입력하는 모드
// 채보 파싱/곡 불러오기/판정 상수/시작·종료 처리는 rhythm.js에서 복사함 (두 모드가 서로 영향을 주지 않도록 따로 둠)

var File = require('fs');
var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var JLog = require('../../sub/jjlog');

var DATA_DIR = `${__dirname}/../../data`;
var CHART_DIR = `${DATA_DIR}/Chart`; // 채보(.txt) 폴더 (rhythm.js와 같음)
var BGM_DIR = `${__dirname}/../../Web/public/media/common/bgms`;
var WORD_FILE = `${DATA_DIR}/typewords.txt`;

var ROUND_MS = 60000;      // 라운드 길이 (고정)
var START_LEAD = 2000;     // turnStart 방송 후 오디오 0ms까지의 최소 여유 (카운트다운 8박 + 마커 리드인 1초 + 클라이언트 스케줄 여유)
var EARLY_END_DELAY = 1000; // 마지막 참가자가 끝난 뒤 이 시간이 지나면 라운드를 조기 종료 (마지막 스플래시 등을 볼 시간)
var END_GRACE = 2500;      // 종료 직전 마지막 입력을 받아주는 유예 (통신이 느려 늦게 도착하는 타격 보고용)
var HIT_SLACK = 1000;      // 클라이언트가 보고한 타격 시각보다 이 이상 일찍 서버에 도착한 보고는 거부
// 채보 난이도별 판정 범위 [Perfect, Good, Bad] (노트 시각 기준 +-ms)와 미스 1회당 감점
var WINDOWS = { easy: [60, 180, 300], normal: [50, 150, 250], hard: [40, 120, 200], insane: [30, 90, 150] };
// 난이도별 스크롤 속도 배율 (클라이언트가 노트 접근 시간 = 기본 시간 / 배율로 계산): 쉬움 2/3배, 보통 1배, 어려움 1.5배, 인세인 2배
var SPEED = { easy: 2 / 3, normal: 1, hard: 1.5, insane: 2 };
var MISS_PENALTY = { easy: 1, normal: 3, hard: 5, insane: 8 };
var SCORE = [10, 5, 1];    // Perfect, Good, Bad
var COMBO_DIV = 200;       // 콤보 보너스 = floor(판정 점수 x 콤보 / COMBO_DIV). 콤보 = 이어진 성공 노트 수 - 1 (두 번째 노트가 1콤보), Bad/Miss/공미스에서 끊김
var BONUS_MULT = [3, 1.5, 0.5]; // 단어 완성 보너스: 단어(엔터 포함) 최저 판정이 Perfect/Good/Bad일 때 자모 1개당 점수 (합계 소수점 버림)
var GROUP_MAX = 11;        // 그룹의 노트 수가 이 이상이면 반으로 나눔 (2마디 -> 1마디 -> 반 마디)
var KEYS = 'ㄱㄴㄷㅂㅅㅇㅈㅡㅣ'; // 단어에 쓸 수 있는 자모 (쿼티/단모음/천지인 모두 한 번에 누를 수 있는 것만)
var ENTER = '\n';          // 그룹 마지막 노트(엔터)의 키

// 봇 레벨별(인덱스 = robot.level 0~5, 5가 가장 강함) 입력시간 편차(+-ms, 균등분포), 입력 지연(ms, 한 번 누른 뒤 다음 입력까지의 쿨다운), 다른 자모를 누를 확률
var BOT_DEV = [200, 150, 100, 50, 35, 0];
var BOT_DELAY = [300, 300, 200, 100, 50, 0];
var BOT_WRONG = [0.1, 0.07, 0.05, 0.02, 0, 0];

var SONGS = [];            // { name, bpm, charts: { easy|normal|hard|insane: { res, seq, win, penalty, notes:[{t, idx}], groups:[노트 수], krt } } }
var WORDS = {};            // 자모 수 -> [{ text, jamo }]
var DIC = {};              // 접속 중인 클라이언트 (id -> client). 라운드 종료 때 남은 미스를 정산하는 데 사용

function parseChart(name, text) {
	var lines = text.replace(/^﻿/, '').split(/\r?\n/);
	var song = { name: name, bpm: 0, charts: {} };
	var cur = null;
	var i, line, m;

	for (i = 0; i < lines.length; i++) {
		line = lines[i].trim();
		if (!line) continue;
		if (m = line.match(/^(Easy|Normal|Hard|Insane)\s+(\d+)$/i)) {
			cur = song.charts[m[1].toLowerCase()] = { res: Number(m[2]), seq: "" };
		} else if (cur) {
			line = line.replace(/\s+/g, ''); // 박 단위로 띄워 쓴 공백 허용
			if (/^[1-4.]+$/.test(line)) cur.seq += line;
		} else if (!song.bpm && /^\d{2,3}$/.test(line)) {
			song.bpm = Number(line);
		} else if (!song.bpm && !song.title) {
			song.title = line; // 첫 줄: 화면에 표시할 곡 이름
		}
	}
	if (!song.bpm) return null;
	if (!song.title) song.title = name.replace(/_/g, ' ');

	Object.keys(song.charts).forEach(function (k) {
		var c = song.charts[k];
		var charMs = 60000 / song.bpm * 4 / c.res;
		var j;

		// 60초 이후 글자는 잘라서 클라이언트가 같은 시각 계산을 하도록 함
		c.seq = c.seq.slice(0, Math.ceil(ROUND_MS / charMs));
		c.bpm = song.bpm;
		c.win = WINDOWS[k];
		c.speed = SPEED[k];
		c.penalty = MISS_PENALTY[k];
		c.notes = [];
		for (j = 0; j < c.seq.length; j++) {
			if (c.seq.charAt(j) != '.') c.notes.push({ t: j * charMs, idx: j });
		}
		if (!c.notes.length) delete song.charts[k]; // 노트가 없는 난이도는 선택 후보에서 제외
	});
	return song;
}
// typewords.txt: 숫자 줄(자모 수) 아래에 그 자모 수의 단어를 한 줄에 하나씩. 자모 수는 타수 순서(ㅢ = ㅡㅣ)로 셈
function loadWords() {
	var lines, i, line, jamo;
	var cur = 0, count = 0, bad = [];

	WORDS = {};
	try {
		lines = File.readFileSync(WORD_FILE, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
	} catch (e) {
		return JLog.warn(`[Rtype] word list load failed: ${e.toString()}`);
	}
	for (i = 0; i < lines.length; i++) {
		line = lines[i].trim();
		if (!line) continue;
		if (/^\d+$/.test(line)) {
			cur = Number(line);
			continue;
		}
		jamo = Const.decomposeToJamo(line);
		// 자모 수가 머리글과 다르거나, 허용 외 자모가 있거나, 같은 자모가 연속되면(천지인 등에서 한 번에 못 침) 제외
		if (jamo.length != cur || !new RegExp(`^[${KEYS}]+$`).test(jamo) || /(.)\1/.test(jamo)) {
			bad.push(line);
			continue;
		}
		(WORDS[cur] || (WORDS[cur] = [])).push({ text: line, jamo: jamo });
		count++;
	}
	if (bad.length) JLog.warn(`[Rtype] ${bad.length} words skipped (jamo count differs from header / jamo outside ${KEYS} / same jamo twice in a row): ${bad.join(', ')}`);
	JLog.log(`[Rtype] ${count} words loaded`);
}
// 채보를 단어 그룹으로 나눔 (곡마다 고정이므로 서버 시작 때 한 번). c.groups = 그룹별 노트 수 (노트 순서대로 이어짐)
function buildGroups(c, label) {
	var R = c.res;
	var notes = c.notes;
	var pos = [];
	var groups = [];
	var i, j, k, b, g;

	// 1) 끝 1/8 보정: 마디의 노트가 전부 마지막 1/8에 있으면(다음 마디로 가는 못갖춘 노트) 그룹 계산 위치만 다음 마디 시작으로 옮김
	for (i = 0; i < notes.length; i++) pos[i] = notes[i].idx;
	for (i = 0; i < notes.length; i = j) {
		b = Math.floor(notes[i].idx / R);
		for (j = i; j < notes.length && Math.floor(notes[j].idx / R) == b; j++);
		if ((b + 1) * R < c.seq.length && notes[i].idx - b * R >= R * 7 / 8) {
			for (k = i; k < j; k++) pos[k] = (b + 1) * R;
		}
	}
	// 2) 2마디 단위로 묶고, 노트가 GROUP_MAX 이상이면 1마디 -> 반 마디로 나눔 (반 마디보다 짧게는 안 나눔)
	function split(from, len) {
		var n = 0, x;

		for (x = 0; x < notes.length; x++) {
			if (pos[x] >= from && pos[x] < from + len) n++;
		}
		if (!n) return;
		if (n >= GROUP_MAX && len > R / 2) {
			split(from, len / 2);
			split(from + len / 2, len / 2);
			return;
		}
		groups.push(n);
	}
	for (b = 0; b * 2 * R < c.seq.length; b++) split(b * 2 * R, 2 * R);
	// 3) 노트가 1개뿐인 그룹(엔터만 남음)은 앞 그룹에 붙임 (첫 그룹이면 다음 그룹에)
	for (g = 0; g < groups.length && groups.length > 1; g++) {
		if (groups[g] > 1) continue;
		if (g > 0) groups[g - 1] += groups[g];
		else groups[1] += groups[0];
		groups.splice(g, 1);
		g--;
	}
	c.groups = groups;
	// 4) 모든 그룹에 맞는 길이(노트 수 - 1)의 단어가 있어야 이 난이도를 리듬 타이퍼에 씀
	c.krt = groups.every(function (n) { return WORDS[n - 1] && WORDS[n - 1].length; });
	if (!c.krt) JLog.warn(`[Rtype] ${label} skipped: no word for some group sizes [${groups.join(',')}]`);
}
// seq에는 사람은 id 문자열, 봇은 Robot 객체로 들어 있음
function seqId(o) {
	return typeof o === 'string' ? o : o.id;
}
function inSeq(my, client) {
	return !!my.game.seq && (my.game.seq.indexOf(client.id) != -1 || my.game.seq.indexOf(client) != -1);
}
function judge(dt, win) {
	var a = Math.abs(dt);

	if (a <= win[0]) return 0;
	if (a <= win[1]) return 1;
	return 2;
}
function shuffle(arr) {
	var r = arr.slice();
	var i, j, tmp;

	for (i = r.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		tmp = r[i];
		r[i] = r[j];
		r[j] = tmp;
	}
	return r;
}
// 직전 단어와 같은 단어, 직전 단어 끝 자모로 시작하는 단어는 피함 (엔터를 놓쳤을 때 천지인 등에서 두 자모가 합쳐지는 것 방지)
function fits(w, prev) {
	return !prev || (w.text != prev.text && w.jamo.charAt(0) != prev.jamo.charAt(prev.jamo.length - 1));
}
// 길이별로 섞은 단어 묶음에서 차례로 꺼냄. 묶음을 다 쓰기 전에는 같은 단어가 다시 나오지 않음
function pickWord(decks, n, prev) {
	var d = decks[n] || (decks[n] = { order: [], i: 0 });
	var j, w;

	if (d.i >= d.order.length) {
		d.order = shuffle(WORDS[n]);
		d.i = 0;
	}
	for (j = d.i; j < d.order.length; j++) {
		if (fits(d.order[j], prev)) break;
	}
	// 조건에 맞는 단어를 지금 위치로 당겨 옴. 남은 단어 중 맞는 게 없으면 그냥 다음 단어를 씀
	if (j < d.order.length) {
		w = d.order[j];
		d.order[j] = d.order[d.i];
		d.order[d.i] = w;
	}
	return d.order[d.i++];
}

// 사람마다 판정 상태: p = 다음에 처리할 노트 (노트는 항상 앞에서부터 차례로 처리됨), chain = 콤보, worst/dead = 단어별 최저 판정/보너스 없음
function getState(my, client) {
	return my.game.st[client.id] || (my.game.st[client.id] = { p: 0, chain: 0, worst: [], dead: [] });
}
function publishScore(client, score, j, w) {
	var data = {
		target: client.id,
		score: score,
		judge: j,
		totalScore: client.game.score
	};

	if (w !== undefined) data.word = w;
	client.publish('turnEnd', data, true);
}
// 노트 p를 처리했으니 다음으로 넘어감. 단어의 마지막 노트(엔터)였고 보너스가 남아 있으면 단어 완성 보너스
function advance(my, client, st) {
	var note = my.game.notes[st.p++];
	var word = my.game.words[note.w];
	var score;

	if (st.p - 1 != word.last || st.dead[note.w]) return;
	score = Math.floor(BONUS_MULT[st.worst[note.w]] * word.n);
	if (score <= 0) return;
	client.game.score += score;
	publishScore(client, score, 4, note.w);
}
// 노트 p를 MISS로 처리: 콤보와 그 단어의 보너스가 사라짐. 감점량을 돌려줌 (알림은 호출한 쪽에서 모아서)
function missNote(my, client, st) {
	st.chain = 0;
	st.dead[my.game.notes[st.p].w] = true;
	advance(my, client, st);
	return my.game.chart.penalty;
}
function applyLost(client, lost) {
	if (lost <= 0) return;
	client.game.score -= lost;
	publishScore(client, -lost, 3);
}
// upTo(ms)보다 판정 범위를 완전히 지난 미처리 노트를 놓친 것(Miss)으로 정산 (점수가 0 아래로 내려갈 수 있음. 보상은 0으로 막힘)
function settle(my, client, upTo) {
	var notes = my.game.notes;
	var win = my.game.chart.win;
	var st = getState(my, client);
	var lost = 0;

	while (st.p < notes.length && notes[st.p].t + win[2] < upTo) lost += missNote(my, client, st);
	applyLost(client, lost);
	return st;
}
function hitNote(my, client, st, t) {
	var note = my.game.notes[st.p];
	var j = judge(t - note.t, my.game.chart.win);
	var score;

	if (j == 2) st.chain = 0;
	else st.chain++;
	if (st.worst[note.w] === undefined || j > st.worst[note.w]) st.worst[note.w] = j;
	score = SCORE[j] + Math.floor(SCORE[j] * Math.max(0, st.chain - 1) / COMBO_DIV);
	client.game.score += score;
	publishScore(client, score, j);
	advance(my, client, st);
}
// 입력 하나 판정. k = 자모 / ENTER / 'BS', t = 곡 시작 기준 입력 시각(ms)
// - 맨 앞 미처리 노트와 같으면 그 노트를 판정
// - 다르지만 바로 다음 노트가 판정 범위 안이고 같으면, 앞 노트는 MISS로 하고 다음 노트를 판정 (한 글자 건너뜀)
// - 그 밖(오타, 범위 밖 입력, 중간 엔터)은 공미스: 콤보만 끊김
// - BS: 단어를 입력하는 중이면(그 단어의 노트를 하나라도 처리했으면) 그 단어의 보너스만 사라짐
function applyHit(my, client, k, t) {
	var notes = my.game.notes;
	var win = my.game.chart.win;
	var st = settle(my, client, t);
	var f = notes[st.p];
	var n2 = notes[st.p + 1];

	if (k === 'BS') {
		if (f && st.p > my.game.words[f.w].first) st.dead[f.w] = true;
		return;
	}
	if (f && Math.abs(t - f.t) <= win[2] && f.k === k) return hitNote(my, client, st, t);
	if (f && n2 && Math.abs(t - n2.t) <= win[2] && n2.k === k) {
		applyLost(client, missNote(my, client, st));
		return hitNote(my, client, st, t);
	}
	st.chain = 0;
}

// 서버가 시작될 때마다 단어 목록과 data/Chart 폴더의 채보를 새로 읽음
exports.init = function (_DB, _DIC) {
	var loaded = [];

	DIC = _DIC;
	SONGS = [];
	loadWords();
	File.readdirSync(CHART_DIR).forEach(function (file) {
		var name, text, song, ok;

		if (!/\.txt$/i.test(file)) return;
		name = file.replace(/\.txt$/i, '');
		try {
			text = File.readFileSync(`${CHART_DIR}/${file}`, 'utf8').replace(/^﻿/, '');
			// 다른 용도의 txt(단어 목록, 금칙어 목록 등)는 난이도 머리글(Easy 4 등)이 없으므로 채보로 보지 않음
			if (!/^(Easy|Normal|Hard|Insane)\s+\d+\s*$/im.test(text)) return;
			song = parseChart(name, text);
		} catch (e) {
			return JLog.warn(`[Rtype] chart load failed: ${file}: ${e.toString()}`);
		}
		// 채보 자체의 문제는 rhythm.js가 이미 경고하므로 조용히 건너뜀
		if (!song || !File.existsSync(`${BGM_DIR}/${name}.opus`)) return;
		ok = Object.keys(song.charts).filter(function (k) {
			buildGroups(song.charts[k], `${name} ${k}`);
			return song.charts[k].krt;
		});
		if (!ok.length) return;
		SONGS.push(song);
		loaded.push(`${name}(${ok.map(function (k) { return k + ' ' + song.charts[k].groups.length + 'g'; }).join('/')})`);
	});
	JLog.log(`[Rtype] ${SONGS.length} songs loaded: ${loaded.join(', ')}`);
};
exports.getTitle = function () {
	var R = new Lizard.Tail();

	setTimeout(function () {
		R.go("♪♪♪♪♪♪♪♪♪♪");
	}, 500);
	return R;
};
exports.roundReady = function () {
	var my = this;
	var diff;
	var cands, song, chart, notes, words, g, j, n, i, w, prev;

	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.endTimer);
	my.game.endTimer = null;
	my.game.round = 1;
	my.game.late = false;
	my.game.st = {};
	my.game.done = {};
	my.game.startAt = 0;

	// 기본은 이지 채보, 하드 옵션은 노멀 채보, 크레이지 옵션은 하드 채보, 둘 다 켜면 인세인 채보
	diff = my.opts.rhythmhard && my.opts.rhythmcrazy ? 'insane' : my.opts.rhythmcrazy ? 'hard' : my.opts.rhythmhard ? 'normal' : 'easy';

	cands = SONGS.filter(function (s) { return s.charts[diff] && s.charts[diff].krt; });
	if (!cands.length) {
		JLog.warn(`[Rtype] no chart for difficulty: ${diff}`);
		return my.roundEnd();
	}
	song = cands[Math.floor(Math.random() * cands.length)];
	chart = song.charts[diff];

	// 그룹마다 단어를 배정: 그룹의 노트는 단어의 자모 순서대로, 마지막 노트는 엔터
	notes = [];
	words = [];
	i = 0;
	prev = null;
	my.game.decks = {};
	for (g = 0; g < chart.groups.length; g++) {
		n = chart.groups[g] - 1;
		prev = pickWord(my.game.decks, n, prev);
		w = { text: prev.text, n: n, first: notes.length, last: notes.length + n };
		for (j = 0; j <= n; j++, i++) {
			notes.push({ t: chart.notes[i].t, k: j < n ? prev.jamo.charAt(j) : ENTER, w: words.length });
		}
		words.push(w);
	}
	my.game.song = song.name;
	my.game.title = song.title;
	my.game.chart = chart;
	my.game.notes = notes;
	my.game.words = words;
	my.game.keys = notes.map(function (o) { return o.k; }).join('');

	my.byMaster('roundReady', {
		round: my.game.round,
		song: song.name,
		title: song.title,
		bpm: chart.bpm,
		res: chart.res,
		seq: chart.seq,
		win: chart.win,
		speed: chart.speed,
		keys: my.game.keys,
		words: words.map(function (o) { return { text: o.text, n: o.n }; }),
		time: my.time
	}, true);
	my.game.turnTimer = setTimeout(my.turnStart, 2400);
};
exports.turnStart = function () {
	var my = this;
	var now = (new Date()).getTime();
	// 카운트다운 7~0이 8박이고 그 다음 박(-1)에 곡이 시작하므로 느린 곡에서도 그만큼은 확보
	var lead = Math.max(START_LEAD, Math.ceil(8 * 60000 / my.game.chart.bpm) + 600);

	my.game.late = false;
	my.game.startAt = now + lead;
	my.game.roundAt = my.game.startAt;
	my.game.roundTime = ROUND_MS;
	my.game.qTimer = setTimeout(my.turnEnd, lead + ROUND_MS + END_GRACE);
	my.byMaster('turnStart', {
		startAt: my.game.startAt,
		now: now,
		roundTime: ROUND_MS
	}, true);
	my.game.seq.forEach(function (o) {
		if (o.robot) playRobot(my, o);
	});
};
// 봇이 칠 입력({t, k})을 미리 전부 계산해 두고 곡 시각에 맞춰 차례로 실행
// 각 노트: 희망 시각 = 노트 시각 + 편차. 직전 입력 후 지연이 안 지났으면 지연이 끝나는 시각까지 기다려 누르고, 그 시각이 노트의 Bad 범위를 넘으면 놓침
// 오타 확률에 걸리면 다른 자모를 누름 (엔터 노트면 아무 자모). 백스페이스는 쓰지 않음
function playRobot(my, robot) {
	var game = my.game;
	var notes = game.notes;
	var win = game.chart.win;
	var lv = Math.min(5, robot.level);
	var plan = [], last = -Infinity;
	var i = 0;
	var j, note, t, k, others;

	if (lv >= 0) {
		for (j = 0; j < notes.length; j++) {
			note = notes[j];
			t = Math.max(note.t + (Math.random() * 2 - 1) * BOT_DEV[lv], last + BOT_DELAY[lv]);
			if (t > note.t + win[2]) continue;
			k = note.k;
			if (Math.random() < BOT_WRONG[lv]) {
				others = KEYS.replace(k, '');
				k = others.charAt(Math.floor(Math.random() * others.length));
			}
			plan.push({ t: t, k: k });
			last = t;
		}
	}
	// 입력 계획이 없는 봇(레벨 -1 포함)은 처음부터 끝난 것으로 쳐 사람의 조기 종료를 막지 않음
	function next() {
		var wait;

		if (my.game !== game || game.late || game.seq.indexOf(robot) == -1) return;
		if (i >= plan.length) {
			game.done[robot.id] = true;
			return checkAllDone(my);
		}
		wait = game.startAt + plan[i].t - (new Date()).getTime();
		robot._timer = setTimeout(function () {
			if (my.game !== game || game.late || game.seq.indexOf(robot) == -1) return;
			applyHit(my, robot, plan[i].k, plan[i].t);
			i++;
			next();
		}, Math.max(0, wait));
	}
	next();
}
exports.turnEnd = function () {
	var my = this;

	my.game.late = true;
	clearTimeout(my.game.qTimer);
	clearTimeout(my.game.endTimer);
	// 아직 정산되지 않은 미스(마지막 입력 이후의 노트 등)를 참가자별로 마저 감점
	if (my.game.notes && my.game.seq) my.game.seq.forEach(function (o) {
		var c = typeof o === 'string' ? DIC[o] : o;

		if (o.robot) clearTimeout(o._timer);
		if (c && c.game) settle(my, c, Infinity);
	});
	my.byMaster('turnEnd', {});
	my.roundEnd();
};
// 참가자의 채팅은 막음 (입력창은 게임 입력 전용). 관전자의 채팅만 그대로 채팅으로 처리
exports.submit = function (client, text) {
	if (!text || inSeq(this, client)) return;
	client.chat(text);
};
// 클라이언트가 보낸 입력 {k: 자모 / '\n'(엔터) / 'BS', t: 곡 시작 기준 입력 시각(ms)}만으로 서버가 판정하고 점수를 합산
exports.hit = function (client, msg) {
	var my = this;
	var k = msg.k, t = msg.t;

	if (my.game.late || !my.game.notes || !my.game.startAt) return;
	if (!inSeq(my, client)) return;
	if (typeof k != 'string' || !k || k.length > 2) return;
	if (typeof t != 'number' || !isFinite(t)) return;
	if ((new Date()).getTime() < my.game.startAt + t - HIT_SLACK) return;

	applyHit(my, client, k, t);
};
// 미스 알림: 클라이언트가 노트의 판정 범위가 지났음을 {t: 곡 기준 ms}로 알리면, 서버가 그 시각까지의 미처리 노트를 정산해 감점을 바로 반영
exports.miss = function (client, msg) {
	var my = this;
	var t = msg.t;

	if (my.game.late || !my.game.notes || !my.game.startAt) return;
	if (!inSeq(my, client)) return;
	if (typeof t != 'number' || !isFinite(t)) return;
	if ((new Date()).getTime() < my.game.startAt + t - HIT_SLACK) return;
	settle(my, client, t);
};
// 끝 신호: 클라이언트가 마지막 노트를 처리(미스 포함)했을 때 보냄. 현재 참가자 전원의 신호가 모이면 1초 뒤 라운드를 조기 종료
exports.done = function (client, msg) {
	var my = this;
	var last;

	if (my.game.late || !my.game.notes || !my.game.startAt) return;
	if (!inSeq(my, client)) return;
	// 마지막 노트의 판정 범위가 시작되기도 전에 온 신호는 무시
	last = my.game.notes[my.game.notes.length - 1];
	if ((new Date()).getTime() < my.game.startAt + last.t - my.game.chart.win[2] - HIT_SLACK) return;

	my.game.done[client.id] = true;
	checkAllDone(my);
};
// 참가자(봇 포함) 전원이 끝났으면, 마지막 참가자가 끝난 시점에서 1초 뒤에 라운드를 조기 종료
function checkAllDone(my) {
	var game = my.game;
	var i;

	for (i = 0; i < game.seq.length; i++) {
		if (!game.done[seqId(game.seq[i])]) return;
	}
	if (game.endTimer) return;
	game.endTimer = setTimeout(function () {
		// 그 사이 라운드가 다른 이유로 끝났거나 새 게임이 시작됐으면 무시
		if (my.game === game && !game.late) my.turnEnd();
	}, EARLY_END_DELAY);
}
