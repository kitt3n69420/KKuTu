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

var DATA_DIR = `${__dirname}/../../data`;
var BGM_DIR = `${__dirname}/../../Web/public/media/common/bgms`;

var ROUND_MS = 60000;      // 라운드 길이 (고정)
var START_LEAD = 2000;     // turnStart 방송 후 오디오 0ms까지의 최소 여유 (카운트다운 3박 + 마커 리드인 1초 + 클라이언트 스케줄 여유)
var END_GRACE = 400;       // 종료 직전 마지막 입력을 받아주는 유예
var HIT_SLACK = 1000;      // 클라이언트가 보고한 타격 시각보다 이 이상 일찍 서버에 도착한 보고는 거부
var WIN_PERFECT = 50, WIN_GOOD = 150, WIN_BAD = 300; // ms
var SCORE = [10, 5, 1];    // Perfect, Good, Bad

var SONGS = [];            // { name, bpm, charts: { easy|normal|hard: { res, seq, notes:[{lane, t}] } } }

function parseChart(name, text) {
	var lines = text.replace(/^﻿/, '').split(/\r?\n/);
	var song = { name: name, bpm: 0, charts: {} };
	var cur = null;
	var i, line, m;

	for (i = 0; i < lines.length; i++) {
		line = lines[i].trim();
		if (!line) continue;
		if (m = line.match(/^(Easy|Normal|Hard)\s+(\d+)$/i)) {
			cur = song.charts[m[1].toLowerCase()] = { res: Number(m[2]), seq: "" };
		} else if (cur) {
			if (/^[1-4.]+$/.test(line)) cur.seq += line;
		} else if (!song.bpm && /^\d{2,3}$/.test(line)) {
			song.bpm = Number(line);
		}
	}
	if (!song.bpm) return null;

	Object.keys(song.charts).forEach(function (k) {
		var c = song.charts[k];
		var charMs = 60000 / song.bpm * 4 / c.res;
		var j, n;

		// 60초 이후 글자는 잘라서 클라이언트가 같은 시각 계산을 하도록 함
		c.seq = c.seq.slice(0, Math.ceil(ROUND_MS / charMs));
		c.bpm = song.bpm;
		c.notes = [];
		c.lanes = [[], [], [], []]; // 레인별 노트 (시각 오름차순). 타격 판정 때 해당 레인만 훑기 위함
		for (j = 0; j < c.seq.length; j++) {
			if (c.seq.charAt(j) == '.') continue;
			n = { lane: Number(c.seq.charAt(j)) - 1, t: j * charMs, idx: j, i: c.notes.length };
			c.notes.push(n);
			c.lanes[n.lane].push(n);
		}
	});
	return song;
}
function judge(dt) {
	var a = Math.abs(dt);

	if (a <= WIN_PERFECT) return 0;
	if (a <= WIN_GOOD) return 1;
	return 2;
}

exports.init = function (_DB, _DIC) {
	SONGS = [];
	File.readdirSync(DATA_DIR).forEach(function (file) {
		var name, song;

		if (!/\.txt$/i.test(file)) return;
		name = file.replace(/\.txt$/i, '');
		if (!File.existsSync(`${BGM_DIR}/${name}.opus`)) return;
		try {
			song = parseChart(name, File.readFileSync(`${DATA_DIR}/${file}`, 'utf8'));
		} catch (e) {
			return JLog.warn(`[Rhythm] chart load failed: ${file}: ${e.toString()}`);
		}
		if (song) SONGS.push(song);
	});
	JLog.log(`[Rhythm] ${SONGS.length} songs loaded`);
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
	var diff = 'normal';
	var cands, song, chart;

	clearTimeout(my.game.turnTimer);
	my.game.round = 1;
	my.game.late = false;
	my.game.hits = {};
	my.game.startAt = 0;

	// rex와 rhd를 동시에 켜면 노멀
	if (my.opts.rhythmeasy && !my.opts.rhythmhard) diff = 'easy';
	else if (my.opts.rhythmhard && !my.opts.rhythmeasy) diff = 'hard';

	cands = SONGS.filter(function (s) { return s.charts[diff]; });
	if (!cands.length) {
		JLog.warn(`[Rhythm] no chart for difficulty: ${diff}`);
		return my.roundEnd();
	}
	song = cands[Math.floor(Math.random() * cands.length)];
	chart = song.charts[diff];
	my.game.song = song.name;
	my.game.chart = chart;

	my.byMaster('roundReady', {
		round: my.game.round,
		song: song.name,
		bpm: chart.bpm,
		res: chart.res,
		seq: chart.seq,
		time: my.time
	}, true);
	my.game.turnTimer = setTimeout(my.turnStart, 2400);
};
exports.turnStart = function () {
	var my = this;
	var now = (new Date()).getTime();
	// 카운트다운(3, 2, 1)이 3박이므로 느린 곡에서도 그만큼은 확보
	var lead = Math.max(START_LEAD, Math.ceil(3 * 60000 / my.game.chart.bpm) + 600);

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
};
exports.turnEnd = function () {
	var my = this;

	my.game.late = true;
	clearTimeout(my.game.qTimer);
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
	var notes, note, best, bd, hits, i, d, j, score;

	if (my.game.late || !chart || !my.game.startAt) return;
	if (!my.game.seq || my.game.seq.indexOf(client.id) == -1) return;
	if (!Number.isInteger(lane) || lane < 0 || lane >= chart.lanes.length) return;
	if (typeof t != 'number' || !isFinite(t)) return;
	if ((new Date()).getTime() < my.game.startAt + t - HIT_SLACK) return;

	hits = my.game.hits[client.id] || (my.game.hits[client.id] = {});
	notes = chart.lanes[lane];
	bd = Infinity;
	for (i = 0; i < notes.length; i++) {
		note = notes[i];
		if (note.t - t > WIN_BAD) break;
		if (hits[note.i]) continue;
		d = Math.abs(t - note.t);
		if (d <= WIN_BAD && d < bd) {
			bd = d;
			best = note;
		}
	}
	if (!best) return;

	hits[best.i] = true;
	j = judge(bd);
	score = SCORE[j];
	client.game.score += score;
	client.publish('turnEnd', {
		target: client.id,
		score: score,
		judge: j,
		totalScore: client.game.score
	}, true);
};
