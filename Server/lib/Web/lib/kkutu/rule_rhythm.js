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

$lib.Rhythm = {};

// 리듬 게임 (XRG)
// - 게임 시계: audioContext.currentTime 기준 (Date.now()/setInterval은 밀릴 수 있어 쓰지 않음)
// - 시작 시각: 서버가 정한 절대 시각(startAt)을 xrgSync 왕복 측정으로 얻은 시계 차이로 로컬 시각으로 변환
// - 판정은 클라이언트가 하고, 서버는 노트 인덱스와 오차(dt)를 검증해 점수를 합산
var XRG_LEAD = 500;       // 마커가 나타나서 판정 시점에 닿기까지 (ms)
var XRG_WIN = [50, 150, 300]; // Perfect / Good / Bad 허용 오차 (ms)
var XRG_SCORE = [10, 5, 1];
var XRG_ROUND = 60000;
var XRG_SYNC_COUNT = 6;
var XRG_SYNC_GAP = 120;

$lib.Rhythm.s = null;

$lib.Rhythm.roundReady = function (data, spec) {
	var R = $lib.Rhythm;
	var s, i, j, k, c, charMs, $grid, $panel;

	clearBoard();
	stopBGM();
	$data.room.round = 1;
	if (data.time) $data.room.time = data.time;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".game-body").addClass("rhythm");

	// 채보 전개: 글자 1개 길이 = (60/BPM) x (4/해상도)초
	charMs = 60000 / data.bpm * 4 / data.res;
	s = R.s = {
		beat: 60000 / data.bpm,
		spec: !!spec,
		song: data.song,
		key: 'xrg_' + data.song,
		notes: [],
		lo: 0,
		ctxStart: null,
		best: null,
		syncN: 0,
		ended: false
	};
	for (i = 0; i < data.seq.length; i++) {
		c = data.seq.charAt(i);
		if (c == '.') continue;
		// 마커 색: 박 위(정박)=0 흰색, 8분음표 엇박=1 분홍, 16분음표 엇박=2 파랑
		k = Math.round(i * charMs / s.beat * 4) % 4;
		s.notes.push({ i: s.notes.length, lane: Number(c) - 1, t: i * charMs, m: k == 0 ? 0 : k == 2 ? 1 : 2, done: false, el: null });
	}

	$grid = $("<div>").addClass("rhythm-grid");
	s.panels = [];
	for (j = 0; j < 4; j++) {
		$panel = $("<div>").addClass("rhythm-panel").attr("data-lane", j);
		s.panels.push($panel);
		$grid.append($panel);
		(function (lane, el) {
			el.addEventListener("pointerdown", function (e) { R.onPress(e, lane); });
		})(j, $panel[0]);
	}
	s.$count = $("<div>").addClass("rhythm-count");
	// 곡 제목은 카운트다운이 시작되기 전까지만 판 위에 표시
	s.$title = $("<div>").addClass("rhythm-title").text("♪ " + data.song.replace(/_/g, " "));
	$grid.append(s.$count, s.$title);
	s.$grid = $grid;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	// 큰 보드(.jjo-display, 298x298) 안에 패널 판을 그림
	$stage.game.display.empty().append($grid);

	// 오디오 프리로드
	if ($sound[s.key]) s.loaded = true;
	else getAudio(s.key, "/media/common/bgms/" + data.song + ".opus", function () {
		if (R.s !== s) return;
		s.loaded = true;
		if (s.ctxStart !== null) R.playAudio();
	});
	R.startSync();
};
// 서버와의 시계 차이 측정: RTT가 가장 작은 표본을 채택
$lib.Rhythm.startSync = function () {
	var R = $lib.Rhythm;
	var s = R.s;

	if (s.spec) return;
	s.syncTimer = addInterval(function () {
		if (R.s !== s || ++s.syncN > XRG_SYNC_COUNT) return clearInterval(s.syncTimer);
		send('xrgSync', { c: Date.now() });
	}, XRG_SYNC_GAP);
};
$lib.Rhythm.onSync = function (data) {
	var s = $lib.Rhythm.s;
	var rtt = Date.now() - data.c;

	if (!s || rtt < 0) return;
	// 서버 시각 = 로컬 시각 + off
	if (!s.best || rtt < s.best.rtt) s.best = { rtt: rtt, off: data.s - (data.c + rtt / 2) };
};
$lib.Rhythm.turnStart = function (data) {
	var R = $lib.Rhythm;
	var s = R.s;
	var off, msUntil;

	if (!s) return;
	off = s.best ? s.best.off : (typeof data.now == 'number' ? data.now - Date.now() : 0);
	msUntil = (data.startAt - off) - Date.now();
	if (audioContext.state == 'suspended') audioContext.resume();
	s.ctxStart = audioContext.currentTime + msUntil / 1000;
	if (s.loaded) R.playAudio();
	cancelAnimationFrame(s.raf);
	s.raf = requestAnimationFrame(R.frame);
};
// 지정한 시각(ctxStart)에 BGM 재생 시작. 이미 지났으면 그만큼 건너뛰어 재생
$lib.Rhythm.playAudio = function () {
	var s = $lib.Rhythm.s;
	var buf = $sound[s.key];
	var now = audioContext.currentTime;
	var vol = $data.muteBGM ? 0 : ($data.BGMVolume === undefined ? 1 : $data.BGMVolume);
	var src, gain, wait;

	if (s.src || s.played) return;
	s.played = true;
	if (window.AudioBuffer && buf instanceof AudioBuffer) {
		src = audioContext.createBufferSource();
		src.buffer = buf;
		gain = audioContext.createGain();
		gain.gain.value = vol;
		src.connect(gain);
		gain.connect(audioContext.destination);
		src.gainNode = gain;
		src.start(Math.max(s.ctxStart, now), Math.max(0, now - s.ctxStart));
		s.src = $data.bgm = src;
	} else if (buf && buf.audio) {
		// 디코딩 실패로 HTMLAudio로 대체된 경우: 샘플 단위 정확도는 없음
		wait = (s.ctxStart - now) * 1000;
		buf.audio.volume = vol;
		buf.audio.loop = false;
		s.src = $data.bgm = buf;
		s.fbTimer = addTimeout(function () {
			buf.audio.currentTime = Math.max(0, -wait) / 1000;
			buf.start();
		}, Math.max(0, wait));
	}
};
// 현재 곡 위치(ms). 출력 지연을 빼서 "귀에 들리는" 위치 기준으로 맞춤
$lib.Rhythm.songTime = function () {
	var s = $lib.Rhythm.s;
	var lat = Math.min(0.25, audioContext.outputLatency || audioContext.baseLatency || 0);

	return (audioContext.currentTime - s.ctxStart - lat) * 1000;
};
$lib.Rhythm.frame = function () {
	var R = $lib.Rhythm;
	var s = R.s;
	var st, i, n, p, remain, txt;

	if (!s || s.ended) return;
	s.raf = requestAnimationFrame(R.frame);
	st = R.songTime();

	remain = Math.max(0, XRG_ROUND - Math.max(0, st));
	$stage.game.roundBar
		.width(remain / XRG_ROUND * 100 + "%")
		.html((Math.round(remain / 100) / 10).toFixed(1) + L['SECOND']);
	// 카운트다운은 곡의 박자에 맞춰 3, 2, 1, GO! (GO!가 곡 시작 = 0ms)
	txt = st < -3 * s.beat ? "" : st < 0 ? String(Math.ceil(-st / s.beat)) : st < s.beat ? (L['xrgGo'] || "GO!") : "";
	if (s.$title && st >= -3 * s.beat) {
		s.$title.remove();
		s.$title = null;
	}
	if (s.countTxt !== txt) {
		s.countTxt = txt;
		s.$count.text(txt);
	}

	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		if (n.t - st > XRG_LEAD) break;
		if (n.done) continue;
		if (st - n.t > XRG_WIN[2]) {
			// 못 누른 노트: 본인 화면에만 미스 표시 (감점 없음)
			n.done = true;
			R.removeMarker(n);
			if (!s.spec) R.splash(n.lane, 3);
			continue;
		}
		if (!n.el) {
			n.el = $("<div>").addClass("rhythm-marker rhythm-m" + n.m);
			s.panels[n.lane].append(n.el);
		}
		p = (n.t - st) / XRG_LEAD; // 1 -> 0: 커지며 패널 테두리에 닿는 순간이 판정 시점
		n.el.css({
			transform: "scale(" + (0.2 + 0.8 * Math.min(1, 1 - p)) + ")",
			opacity: p < 0 ? Math.max(0, 1 + p * XRG_LEAD / XRG_WIN[2]) : 1
		});
	}
	while (s.lo < s.notes.length && s.notes[s.lo].done) s.lo++;
};
$lib.Rhythm.removeMarker = function (n) {
	if (n.el) {
		n.el.remove();
		n.el = null;
	}
};
$lib.Rhythm.onPress = function (e, lane) {
	var R = $lib.Rhythm;
	var s = R.s;
	var st, i, n, d, best, bd, j, score;

	e.preventDefault();
	if (!s || s.spec || s.ended || s.ctxStart === null) return;
	st = R.songTime();
	bd = Infinity;
	// 눌린 레인에서 판정 범위 안의 미처리 노트 중 가장 가까운 것
	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		if (n.t - st > XRG_WIN[2]) break;
		if (n.done || n.lane != lane) continue;
		d = Math.abs(st - n.t);
		if (d <= XRG_WIN[2] && d < bd) {
			bd = d;
			best = n;
		}
	}
	if (!best) return;

	best.done = true;
	R.removeMarker(best);
	d = Math.round(st - best.t);
	j = bd <= XRG_WIN[0] ? 0 : bd <= XRG_WIN[1] ? 1 : 2;
	score = XRG_SCORE[j];
	R.splash(lane, j);
	send('xrgHit', { i: best.i, dt: d });

	// 내 점수는 서버 응답을 기다리지 않고 바로 반영 (이후 서버 합계로 보정됨)
	addScore($data.id, score);
	updateScore($data.id, getScore($data.id));
	drawObtainedScore($("#game-user-" + $data.id), $("<div>").addClass("deltaScore").html("+" + score));
};
// j: 0=Perfect, 1=Good, 2=Bad, 3=Miss
$lib.Rhythm.splash = function (lane, j) {
	var s = $lib.Rhythm.s;
	var $sp = $("<div>").addClass("rhythm-splash rhythm-j" + j).text(L['xrgJudge' + j] || ['PERFECT', 'GOOD', 'BAD', 'MISS'][j]);

	if (!s) return;
	s.panels[lane].append($sp);
	addTimeout(function () { $sp.remove(); }, 450);
};
$lib.Rhythm.turnEnd = function (id, data) {
	var R = $lib.Rhythm;
	var s = R.s;
	var i;

	// 라운드 종료 신호
	if (!data || !data.target) {
		if (s) {
			s.ended = true;
			cancelAnimationFrame(s.raf);
			for (i = 0; i < s.notes.length; i++) R.removeMarker(s.notes[i]);
			s.$count.text("");
		}
		stopBGM();
		playSound('horr');
		return;
	}
	// 내 타격은 onPress에서 이미 반영함 (서버 합계로 덮으면 RTT만큼 점수가 뒤로 갔다 오는 깜박임이 생김)
	if (id == $data.id) return;
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	drawObtainedScore($("#game-user-" + id), $("<div>").addClass("deltaScore").html("+" + data.score));
};
// 게임 화면 정리 (clearBoard / clearGame에서 호출)
$lib.Rhythm.cleanup = function () {
	var s = $lib.Rhythm.s;

	$(".game-body").removeClass("rhythm");
	if (!s) return;
	$lib.Rhythm.s = null;
	cancelAnimationFrame(s.raf);
	clearInterval(s.syncTimer);
	clearTimeout(s.fbTimer);
	if (s.src) {
		try { s.src.stop(); } catch (e) { }
		if ($data.bgm === s.src) $data.bgm = null;
	}
	s.$grid.remove();
};
