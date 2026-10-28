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

var File = require('fs');
var Lizard = require('../../sub/lizard');
var JLog = require('../../sub/jjlog');

var CHART_DIR = `${__dirname}/../../data/Chart`; // 채보(.txt) 폴더
var BGM_DIR = `${__dirname}/../../Web/public/media/common/bgms`;

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
var COMBO_DIV = 200;       // 콤보 보너스 = floor(판정 점수 x 콤보 / COMBO_DIV). 콤보 = 이어진 성공 노트 수 - 1 (두 번째 노트가 1콤보), Bad/Miss에서 끊김

// 봇 레벨별(인덱스 = robot.level 0~5, 5가 가장 강함) 입력시간 편차(+-ms, 균등분포), 입력 지연(ms, 한 번 누른 뒤 다음 입력까지의 쿨다운), 다른 칸을 누를 확률
var BOT_DEV = [200, 150, 100, 50, 35, 0];
var BOT_DELAY = [300, 300, 200, 100, 50, 0];
var BOT_WRONG = [0.1, 0.07, 0.05, 0.02, 0, 0];

var SONGS = [];            // { name, bpm, charts: { easy|normal|hard|insane: { res, seq, win, penalty, notes:[{lane, t}] } } }
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
		var j, n;

		// 60초 이후 글자는 잘라서 클라이언트가 같은 시각 계산을 하도록 함
		c.seq = c.seq.slice(0, Math.ceil(ROUND_MS / charMs));
		c.bpm = song.bpm;
		c.win = WINDOWS[k];
		c.speed = SPEED[k];
		c.penalty = MISS_PENALTY[k];
		c.notes = [];
		c.lanes = [[], [], [], []]; // 레인별 노트 (시각 오름차순). 타격 판정 때 해당 레인만 훑기 위함
		for (j = 0; j < c.seq.length; j++) {
			if (c.seq.charAt(j) == '.') continue;
			n = { lane: Number(c.seq.charAt(j)) - 1, t: j * charMs, idx: j, i: c.notes.length };
			c.notes.push(n);
			c.lanes[n.lane].push(n);
		}
		if (!c.notes.length) delete song.charts[k]; // 노트가 없는 난이도는 선택 후보에서 제외
	});
	return song;
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
// upTo(ms)보다 판정 범위를 완전히 지난 미처리 노트를 놓친 것(Miss)으로 정산: 콤보를 끊고 미스당 감점 (점수가 0 아래로 내려갈 수 있음. 보상은 0으로 막힘)
function settleMisses(my, client, upTo) {
	var chart = my.game.chart;
	var hits = my.game.hits[client.id] || (my.game.hits[client.id] = {});
	var cb = my.game.combos[client.id] || (my.game.combos[client.id] = { chain: 0, mp: 0 });
	var miss = 0, lost;

	while (cb.mp < chart.notes.length && chart.notes[cb.mp].t + chart.win[2] < upTo) {
		if (!hits[chart.notes[cb.mp].i]) {
			cb.chain = 0;
			miss++;
		}
		cb.mp++;
	}
	lost = miss * chart.penalty;
	if (lost <= 0) return cb;
	client.game.score -= lost;
	client.publish('turnEnd', {
		target: client.id,
		score: -lost,
		judge: 3,
		totalScore: client.game.score
	}, true);
	return cb;
}

// 서버가 시작될 때마다 data/Chart 폴더를 새로 읽어 곡 목록을 만듦: 채보(.txt)를 추가/삭제한 뒤 재시작하면 반영됨
exports.init = function (_DB, _DIC) {
	var loaded = [];

	DIC = _DIC;
	SONGS = [];
	File.readdirSync(CHART_DIR).forEach(function (file) {
		var name, text, song;

		if (!/\.txt$/i.test(file)) return;
		name = file.replace(/\.txt$/i, '');
		try {
			text = File.readFileSync(`${CHART_DIR}/${file}`, 'utf8').replace(/^﻿/, '');
			// 다른 용도의 txt(금칙어 목록 등)는 난이도 머리글(Easy 4 등)이 없으므로 채보로 보지 않음
			if (!/^(Easy|Normal|Hard|Insane)\s+\d+\s*$/im.test(text)) return;
			song = parseChart(name, text);
		} catch (e) {
			return JLog.warn(`[Rhythm] chart load failed: ${file}: ${e.toString()}`);
		}
		// 채보처럼 보이는데 못 쓰는 파일은 이유를 남김
		if (!song) return JLog.warn(`[Rhythm] ${file} skipped: BPM line missing (a 2-3 digit number line before the first difficulty header)`);
		if (!File.existsSync(`${BGM_DIR}/${name}.opus`)) return JLog.warn(`[Rhythm] ${file} skipped: bgms/${name}.opus not found`);
		if (!Object.keys(song.charts).length) return JLog.warn(`[Rhythm] ${file} skipped: no difficulty has notes`);
		SONGS.push(song);
		loaded.push(`${name}(${Object.keys(song.charts).join('/')})`);
	});
	JLog.log(`[Rhythm] ${SONGS.length} songs loaded: ${loaded.join(', ')}`);
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
	var cands, song, chart;

	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.endTimer);
	my.game.endTimer = null;
	my.game.round = 1;
	my.game.late = false;
	my.game.hits = {};
	my.game.combos = {};
	my.game.done = {};
	my.game.startAt = 0;

	// 기본은 이지 채보, 하드 옵션은 노멀 채보, 크레이지 옵션은 하드 채보, 둘 다 켜면 인세인 채보
	diff = my.opts.rhythmhard && my.opts.rhythmcrazy ? 'insane' : my.opts.rhythmcrazy ? 'hard' : my.opts.rhythmhard ? 'normal' : 'easy';

	cands = SONGS.filter(function (s) { return s.charts[diff]; });
	if (!cands.length) {
		JLog.warn(`[Rhythm] no chart for difficulty: ${diff}`);
		return my.roundEnd();
	}
	// 곡 선택(spk)으로 고른 곡이 있으면 그 곡, 없거나 이 난이도 채보가 없으면 무작위
	song = cands.find(function (s) { return s.name === my.opts.songpick; }) || cands[Math.floor(Math.random() * cands.length)];
	chart = song.charts[diff];
	my.game.song = song.name;
	my.game.title = song.title;
	my.game.chart = chart;

	my.byMaster('roundReady', {
		round: my.game.round,
		song: song.name,
		title: song.title,
		bpm: chart.bpm,
		res: chart.res,
		seq: chart.seq,
		win: chart.win,
		speed: chart.speed,
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
// 봇이 칠 타격({t, lane})을 미리 전부 계산해 두고 곡 시각에 맞춰 차례로 실행
// 각 노트: 희망 시각 = 노트 시각 + 편차. 직전 입력 후 지연이 안 지났으면 지연이 끝나는 시각까지 기다려 누르고, 그 시각이 노트의 Bad 범위를 넘으면 놓침
function playRobot(my, robot) {
	var game = my.game;
	var chart = game.chart;
	var lv = Math.min(5, robot.level);
	var plan = [], last = -Infinity;
	var i = 0;
	var j, note, t, lane;

	if (lv >= 0) {
		for (j = 0; j < chart.notes.length; j++) {
			note = chart.notes[j];
			t = Math.max(note.t + (Math.random() * 2 - 1) * BOT_DEV[lv], last + BOT_DELAY[lv]);
			if (t > note.t + chart.win[2]) continue;
			lane = note.lane;
			if (Math.random() < BOT_WRONG[lv]) lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
			plan.push({ t: t, lane: lane });
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
			applyHit(my, robot, plan[i].lane, plan[i].t);
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
	// 아직 정산되지 않은 미스(마지막 타격 이후의 노트 등)를 참가자별로 마저 감점
	if (my.game.chart && my.game.seq) my.game.seq.forEach(function (o) {
		var c = typeof o === 'string' ? DIC[o] : o;

		if (o.robot) clearTimeout(o._timer);
		if (c && c.game) settleMisses(my, c, Infinity);
	});
	my.byMaster('turnEnd', {});
	my.roundEnd();
};
// 채팅 입력은 그대로 채팅으로 처리 (리듬 게임에는 텍스트 제출이 없음)
exports.submit = function (client, text) {
	if (!text) return;
	client.chat(text);
};
// 클라이언트가 보낸 타격 {lane: 눌린 패널(0~3), t: 곡 시작 기준 눌린 시각(ms)}만으로
// 서버가 그 레인에서 가장 가까운 미처리 노트를 찾아 판정하고 점수를 합산 (클라이언트의 판정 표시는 참고하지 않음)
exports.hit = function (client, msg) {
	var my = this;
	var chart = my.game.chart;
	var lane = msg.lane, t = msg.t;

	if (my.game.late || !chart || !my.game.startAt) return;
	if (!inSeq(my, client)) return;
	if (!Number.isInteger(lane) || lane < 0 || lane >= chart.lanes.length) return;
	if (typeof t != 'number' || !isFinite(t)) return;
	if ((new Date()).getTime() < my.game.startAt + t - HIT_SLACK) return;

	applyHit(my, client, lane, t);
};
function applyHit(my, client, lane, t) {
	var chart = my.game.chart;
	var notes, note, best, bd, hits, cb, win, i, d, j, score;

	hits = my.game.hits[client.id] || (my.game.hits[client.id] = {});
	// 이 타격 시각보다 판정 범위를 완전히 지난 미처리 노트는 놓친 것(Miss)
	cb = settleMisses(my, client, t);
	win = chart.win;
	notes = chart.lanes[lane];
	bd = Infinity;
	for (i = 0; i < notes.length; i++) {
		note = notes[i];
		if (note.t - t > win[2]) break;
		if (hits[note.i]) continue;
		d = Math.abs(t - note.t);
		if (d <= win[2] && d < bd) {
			bd = d;
			best = note;
		}
	}
	if (!best) return;

	hits[best.i] = true;
	j = judge(bd, win);
	if (j == 2) cb.chain = 0;
	else cb.chain++;
	score = SCORE[j] + Math.floor(SCORE[j] * Math.max(0, cb.chain - 1) / COMBO_DIV);
	client.game.score += score;
	client.publish('turnEnd', {
		target: client.id,
		score: score,
		judge: j,
		totalScore: client.game.score
	}, true);
}
// 미스 알림: 클라이언트가 노트의 판정 범위가 지났음을 {t: 곡 기준 ms}로 알리면, 서버가 그 시각까지의 미처리 노트를 정산해 감점을 바로 반영
// (정산 기준은 타격과 같은 타임스탬프이므로 이후에 도착하는 타격과 순서가 어긋나지 않음)
exports.miss = function (client, msg) {
	var my = this;
	var t = msg.t;

	if (my.game.late || !my.game.chart || !my.game.startAt) return;
	if (!inSeq(my, client)) return;
	if (typeof t != 'number' || !isFinite(t)) return;
	if ((new Date()).getTime() < my.game.startAt + t - HIT_SLACK) return;
	settleMisses(my, client, t);
};
// 끝 신호: 클라이언트가 마지막 노트를 처리(미스 포함)했을 때 보냄. 현재 참가자 전원의 신호가 모이면 1초 뒤 라운드를 조기 종료
// (신호는 그 플레이어의 마지막 타격 뒤에 도착하므로 이미 받은 타격은 모두 집계된 상태)
exports.done = function (client, msg) {
	var my = this;
	var chart = my.game.chart;
	var last;

	if (my.game.late || !chart || !my.game.startAt) return;
	if (!inSeq(my, client)) return;
	// 마지막 노트의 판정 범위가 시작되기도 전에 온 신호는 무시
	last = chart.notes[chart.notes.length - 1];
	if ((new Date()).getTime() < my.game.startAt + last.t - chart.win[2] - HIT_SLACK) return;

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

