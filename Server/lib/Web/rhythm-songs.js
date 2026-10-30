// 리듬 게임류 곡 선택(spk) 목록: 게임 서버(rhythm.js)와 같은 기준으로 data/Chart의 채보 중 BGM이 있는 것만. 재시작해야 반영됨
// 곡마다 채보 난이도별 숫자 레벨(1~30)과 배지 색을 붙임 — 곡 선택 창에 N/H/C/A 배지로 표시, 쉬운 곡부터 정렬

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
var REHIT_HARD = 100; // 이 이하면 가산 최대
var REHIT_EASY = 450; // 이 이상이면 가산 없음 (사이는 비례)
var REHIT_BONUS = 0.6; // 가산 최대치: 노트 하나의 가중치가 최대 1.6
// 마우스 이동: 패널 배치(1 왼위·2 오위·3 왼아래·4 오아래) 좌표로 거리를 잼 — 같은 칸 0, 옆 칸(1-2·3-4·1-3·2-4) 1, 대각선(1-4·2-3) √2.
// 앞 노트와의 간격이 짧을수록 이동이 어려움 (간격 비례는 재타격과 같은 방식)
var MOVE_HARD = 100;
var MOVE_EASY = 400;
var MOVE_BONUS = 0.2; // 거리 1당 가산 최대치
// 가독성: 이동 방향이 꺾이는 각도로 채보 전체에서 구함 — 90°(회전처럼 돌아감) 0, 135°(대각선을 끼고 꺾임) 0.5, 180°(되돌아감: 왕복·고정발) 1.
// 빠른 구간(노트 3개가 READ_* x2 안에 들어옴)일수록 크게 쳐서 평균을 내고, 그 평균으로 채보 전체 밀도를 키움. 따닥(이동 없음)은 각도에서 빼고 앞 이동 방향을 이어 씀
var READ_HARD = 100;
var READ_EASY = 400;
var READ_BONUS = 0.15; // 전부 되돌아가는 채보면 x1.15

function ramp(gap, hard, easy) {
	return Math.max(0, Math.min(1, (easy - gap) / (easy - hard)));
}
// 채보 레벨: 노트마다 같은 칸 재타격 간격·마우스 이동으로 가중치를 매기고, 가중치 합으로 평균 밀도(초당)와 순간 밀도(2초·4초 구간 최대)를 섞은 뒤 가독성·판정 폭으로 보정.
// 지금 곡들(가장 쉬운 채보 3 ~ 가장 어려운 채보 25)에 맞춘 선형 변환, 1~30으로 자름
function chartLevel(diff, times, lanes) {
	var n = times.length;
	var dur = Math.max(1, (times[n - 1] - times[0]) / 1000);
	var weights = [], total = 0, last = {}, i, rehit, d;
	var dx, dy, px = 0, py = 0, turn, f, turnSum = 0, turnW = 0;

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
		weights.push(1 + REHIT_BONUS * ramp(rehit, REHIT_HARD, REHIT_EASY));
		if (i) {
			dx = (lanes[i] - 1) % 2 - (lanes[i - 1] - 1) % 2;
			dy = Math.floor((lanes[i] - 1) / 2) - Math.floor((lanes[i - 1] - 1) / 2);
			weights[i] += MOVE_BONUS * Math.sqrt(dx * dx + dy * dy) * ramp(times[i] - times[i - 1], MOVE_HARD, MOVE_EASY);
			if ((dx || dy) && (px || py)) {
				turn = Math.acos((dx * px + dy * py) / Math.sqrt((dx * dx + dy * dy) * (px * px + py * py))) * 180 / Math.PI;
				f = ramp(times[i] - times[i - 2], 2 * READ_HARD, 2 * READ_EASY);
				turnSum += (turn - 90) / 90 * f;
				turnW += f;
			}
			if (dx || dy) { px = dx; py = dy; }
		}
		total += weights[i];
	}
	d = (0.5 * total / dur + 0.25 * peak(2000) + 0.25 * peak(4000)) * TIER[diff] * (1 + READ_BONUS * (turnW ? turnSum / turnW : 0));
	return Math.max(1, Math.min(30, Math.round(1.825 * d - 0.18)));
}
// 레벨 배지 색: 0 파랑 · 6 초록 · 12 노랑 · 18 빨강 · 24 보라 · 30 검정, 사이는 RGB 보간. 밝은 배경(노랑 근처)이면 글자를 어둡게
var LV_COLORS = [[28, 126, 214], [47, 158, 68], [240, 180, 0], [224, 49, 49], [142, 68, 217], [0, 0, 0]];
function lvColor(lv) {
	var k = Math.min(LV_COLORS.length - 2, Math.floor(lv / 6));
	var t = Math.min(1, lv / 6 - k);
	var rgb = LV_COLORS[k].map(function (v, j) { return Math.round(v + (LV_COLORS[k + 1][j] - v) * t); });

	return {
		bg: "rgb(" + rgb.join(",") + ")",
		fg: 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 160 ? "#222222" : "#FFFFFF"
	};
}
function parseSong(name, text) {
	var song = { name: name, title: "", levels: {}, colors: {} };
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
		if (!times.length) return;
		song.levels[k] = chartLevel(k, times, lanes);
		song.colors[k] = lvColor(song.levels[k]);
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
	// 곡 선택 창 순서: 채보 레벨 평균이 낮은(쉬운) 곡부터, 같으면 곡 이름 가나다순
	list.forEach(function (song) {
		var lvs = Object.keys(song.levels).map(function (k) { return song.levels[k]; });

		song.avg = lvs.reduce(function (a, b) { return a + b; }, 0) / lvs.length;
	});
	list.sort(function (a, b) { return a.avg - b.avg || a.title.localeCompare(b.title, "ko"); });
	return list;
})();
