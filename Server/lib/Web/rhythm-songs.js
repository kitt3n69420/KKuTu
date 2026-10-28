// 리듬 게임류 곡 선택(spk) 목록: 게임 서버(rhythm.js)와 같은 기준으로 data/Chart의 채보 중 BGM이 있는 것만. 재시작해야 반영됨
// 곡마다 채보 난이도별 숫자 레벨(1~30)을 붙임 — 곡 선택 창에 N/H/C/A 배지로 표시

var fs = require("fs");
var path = require("path");
var JLog = require("../sub/jjlog");

var CHART_DIR = path.join(__dirname, "..", "data", "Chart");
var BGM_DIR = path.join(__dirname, "public", "media", "common", "bgms");
var ROUND_MS = 60000; // 라운드 길이 (rhythm.js와 같음): 이후 노트는 레벨 계산에서 뺌
var DIFFS = ["easy", "normal", "hard", "insane"];
// 판정 범위가 좁아지는 만큼 (rhythm.js WINDOWS: 300 -> 250 -> 200 -> 150ms) 같은 밀도라도 어렵게 침
var TIER = { easy: 1, normal: 1.1, hard: 1.2, insane: 1.3 };

// 같은 칸을 다시 누르기까지의 간격(ms)이 짧을수록 어려움: 패턴을 따로 찾지 않아도
// 따닥(11, 간격 = 노트 간격) > 왕복·고정발(1212·1214, 2배) > 회전·지그재그(1243·1234, 4배) 순이 되고, BPM은 실제 ms로 반영됨
var REHIT_HARD = 150; // 이 이하면 가산 최대
var REHIT_EASY = 450; // 이 이상이면 가산 없음 (사이는 비례)
var REHIT_BONUS = 0.6; // 가산 최대치: 노트 하나의 가중치가 최대 1.6

// 채보 레벨: 노트마다 같은 칸 재타격 간격으로 가중치를 매기고, 가중치 합으로 평균 밀도(초당)와 순간 밀도(2초·4초 구간 최대)를 섞은 뒤 판정 폭으로 보정.
// 지금 곡들(가장 쉬운 채보 3 ~ 가장 어려운 채보 25)에 맞춘 선형 변환, 1~30으로 자름
function chartLevel(diff, times, lanes) {
	var n = times.length;
	var dur = Math.max(1, (times[n - 1] - times[0]) / 1000);
	var weights = [], total = 0, last = {}, i, rehit, d;

	function peak(win) {
		var best = 0, sum = 0, s = 0, e;

		for (e = 0; e < n; e++) {
			sum += weights[e];
			while (times[e] - times[s] >= win) sum -= weights[s++];
			best = Math.max(best, sum);
		}
		return best * 1000 / win;
	}
	for (i = 0; i < n; i++) {
		rehit = last[lanes[i]] === undefined ? Infinity : times[i] - last[lanes[i]];
		last[lanes[i]] = times[i];
		weights.push(1 + REHIT_BONUS * Math.max(0, Math.min(1, (REHIT_EASY - rehit) / (REHIT_EASY - REHIT_HARD))));
		total += weights[i];
	}
	d = (0.5 * total / dur + 0.25 * peak(2000) + 0.25 * peak(4000)) * TIER[diff];
	return Math.max(1, Math.min(30, Math.round(2.16 * d - 0.76)));
}
function parseSong(name, text) {
	var song = { name: name, title: "", levels: {} };
	var bpm = 0, cur = null, charts = {};

	text.split(/\r?\n/).forEach(function (line) {
		var m;

		line = line.trim();
		if (!line) return;
		if (m = line.match(/^(Easy|Normal|Hard|Insane)\s+(\d+)$/i)) {
			cur = charts[m[1].toLowerCase()] = { res: Number(m[2]), seq: "" };
		} else if (cur) {
			line = line.replace(/\s+/g, "");
			if (/^[1-4.]+$/.test(line)) cur.seq += line;
		} else if (!bpm && /^\d{2,3}$/.test(line)) {
			bpm = Number(line);
		} else if (!bpm && !song.title) {
			song.title = line; // 첫 줄: 화면에 표시할 곡 이름
		}
	});
	if (!bpm) return null;
	if (!song.title) song.title = name.replace(/_/g, " ");
	DIFFS.forEach(function (k) {
		var c = charts[k], charMs, seq, times = [], lanes = [], j;

		if (!c) return;
		charMs = 60000 / bpm * 4 / c.res;
		seq = c.seq.slice(0, Math.ceil(ROUND_MS / charMs));
		for (j = 0; j < seq.length; j++) {
			if (seq.charAt(j) === ".") continue;
			times.push(j * charMs);
			lanes.push(seq.charAt(j));
		}
		if (times.length) song.levels[k] = chartLevel(k, times, lanes);
	});
	return Object.keys(song.levels).length ? song : null;
}

module.exports = (function () {
	var list = [];

	try {
		fs.readdirSync(CHART_DIR).forEach(function (file) {
			var name = file.replace(/\.txt$/i, "");
			var text, song;

			if (name === file || !fs.existsSync(path.join(BGM_DIR, name + ".opus"))) return;
			text = fs.readFileSync(path.join(CHART_DIR, file), "utf8").replace(/^﻿/, "");
			if (!/^(Easy|Normal|Hard|Insane)\s+\d+\s*$/im.test(text)) return;
			if (song = parseSong(name, text)) list.push(song);
		});
	} catch (e) {
		JLog.warn("[Web] rhythm song list failed: " + e.toString());
	}
	return list;
})();
