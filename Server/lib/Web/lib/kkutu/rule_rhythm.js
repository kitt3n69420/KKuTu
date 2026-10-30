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
// - 클라이언트의 판정(PERFECT/GOOD/...)은 내 화면 표시용일 뿐, 서버에는 눌린 패널과 곡 기준 시각만 보냄
//   서버가 그 시각으로 노트를 찾아 직접 판정하고 점수를 합산해 모두에게 알림
var XRG_LEAD = 1000;      // 마커가 나타나서 판정 시점에 닿기까지 (ms): 기본값(보통 난이도). 실제는 서버가 보낸 난이도별 속도 배율로 나눔(s.lead)
var XRG_WIN = [50, 150, 300]; // Perfect / Good / Bad 허용 오차 (ms): 기본값. 실제 범위는 서버가 난이도별로 보내줌(s.win)
var XRG_ROUND = 60000;
var XRG_COUNT = 7;        // 카운트다운 7~0 (8박) 후 다음 박(-1)에 곡이 시작 (곡 시각 0ms = -1)
// 데스크톱 키 배치: D/R, K/U, F, J = 1, 2, 3, 4번 패널 (e.code 기준이라 한글 입력 상태에서도 동일)
var XRG_KEYS = { KeyD: 0, KeyR: 0, KeyK: 1, KeyU: 1, KeyF: 2, KeyJ: 3 };
var XRG_KEY_LABEL = ["D/R", "K/U", "F", "J"]; // 패널(레인) 순서
// Z/X: 누르는 순간 마우스가 올라가 있는 패널을 클릭한 것으로 처리
var XRG_AIM_KEYS = { KeyZ: true, KeyX: true };
var XRG_SYNC_MAX = 300;   // 개인 싱크 보정 한계 (+-ms). 설정의 슬라이더 값
var XRG_SYNC_COUNT = 6;
var XRG_SYNC_GAP = 120;

$lib.Rhythm.s = null;

$lib.Rhythm.roundReady = function (data, spec) {
	var R = $lib.Rhythm;
	var s, i, j, k, x, c, charMs, $grid, $panel;

	// 처음부터 관전 중인 사람(참가자가 아님)과 리플레이도 관전자로 취급: 중간 입장 때만 spec 인자가 넘어옴
	spec = spec || !!$data._spectate || !!$data._replay;
	clearBoard();
	stopBGM();
	$data.room.round = 1;
	if (data.time) $data.room.time = data.time;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	// 큰 보드(.bb)를 숨기면 판이 왼쪽으로 쏠리므로, flip/center-board처럼 .jjoriping을 가운데 정렬
	$(".jjoriping,.game-body").addClass("rhythm");

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
		win: data.win || XRG_WIN,
		lead: XRG_LEAD / (data.speed || 1),
		sync: Math.max(-XRG_SYNC_MAX, Math.min(XRG_SYNC_MAX, Number(loadVolumeSettings().rhythmSync) || 0)),
		chain: 0,
		brk: false,      // Bad/Miss가 한 번이라도 나왔는지 (풀 콤보 판정용)
		allPerfect: true, // 지금까지 전부 Perfect인지 (올 퍼펙트 판정용)
		hover: null,     // 마우스가 올라가 있는 패널 번호 (Z/X 입력용)
		aim: {},         // Z/X 키별로 누를 때 고른 패널 번호 (뗄 때 눌린 모양을 되돌리기 위함)
		ended: false
	};
	for (i = 0; i < data.seq.length; i++) {
		c = data.seq.charAt(i);
		if (c == '.') continue;
		// 마커 색: 박 위(정박)=0 흰색, 8분음표 엇박=1 분홍, 16분음표 엇박=2 하늘색, 그 외(16분 격자에서 벗어남)=3 연두색
		x = i * charMs / s.beat * 4;
		k = Math.round(x) % 4;
		s.notes.push({ i: s.notes.length, lane: Number(c) - 1, t: i * charMs, m: Math.abs(x - Math.round(x)) > 0.05 ? 3 : k == 0 ? 0 : k == 2 ? 1 : 2, done: false, el: null });
	}

	s.left = s.notes.length; // 아직 처리(타격/미스)되지 않은 노트 수. 0이 되면 서버에 끝 신호를 보냄

	$grid = $("<div>").addClass("rhythm-grid");
	s.panels = [];
	for (j = 0; j < 4; j++) {
		$panel = $("<div>").addClass("rhythm-panel").attr("data-lane", j);
		s.panels.push($panel);
		$grid.append($panel);
		// 관전자는 노트만 보고 입력은 받지 않음 (클릭/터치 처리 없음)
		if (!spec) (function (lane, el) {
			el.addEventListener("pointerdown", function (e) { R.onPress(e, lane); });
			el.addEventListener("pointerenter", function () { s.hover = lane; });
			el.addEventListener("pointerleave", function () { if (s.hover === lane) s.hover = null; });
		})(j, $panel[0]);
	}
	if (spec) $grid.addClass("rhythm-spec");
	s.$count = $("<div>").addClass("rhythm-count");
	// 곡 제목은 카운트다운이 시작되기 전까지만 판 중앙에 겹쳐 표시. 판(.rhythm-grid) 안에는 패널만 둠
	s.$title = $("<div>").addClass("rhythm-title").text("♪ " + (data.title || data.song.replace(/_/g, " ")));
	s.$grid = $grid;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	// 채팅 외 입력이 없으므로 모바일 플로팅 입력창(.game-input)은 쓰지 않음 (clearBoard가 모바일에서 다시 켜므로 여기서 끔)
	$stage.game.here.hide();
	// 큰 보드(.jjo-display, 298x298) 안에 패널 판을 그리고, 제목/카운트는 판 위에 겹침
	$stage.game.display.empty().append($grid, s.$count, s.$title);

	if (!spec) {
		s.keyDown = function (e) { R.onKey(e, true); };
		s.keyUp = function (e) { R.onKey(e, false); };
		// 캡처 단계에서 받아 채팅창 등 다른 입력보다 먼저 처리 (플레이어의 조작 키는 항상 게임으로 들어감)
		document.addEventListener("keydown", s.keyDown, true);
		document.addEventListener("keyup", s.keyUp, true);
	}

	// 오디오 프리로드
	if ($sound[s.key]) s.loaded = true;
	else getAudio(s.key, "/media/common/bgms/" + data.song + ".opus", function () {
		if (R.s !== s) return;
		s.loaded = true;
		if (s.ctxStart !== null) R.playAudio();
	});
	// 카운트다운 박마다 울릴 효과음
	if (!$sound.xrg_hitsound) getAudio("xrg_hitsound", "/media/common/hitsound.wav", function () {
		if (R.s === s) R.playBeats();
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
	R.playBeats();
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
// 카운트다운 7~4 (GO!까지)에만 효과음을 예약 재생. 이미 지난 박은 건너뜀. 카운트 c는 곡 시작 (c+1)박 전
$lib.Rhythm.playBeats = function () {
	var s = $lib.Rhythm.s;
	var now = audioContext.currentTime;
	var k, when, src;

	if (!s || s.ctxStart === null || s.beatsPlayed) return;
	s.beatsPlayed = true;
	s.beatSrcs = [];
	for (k = XRG_COUNT; k >= 4; k--) {
		when = s.ctxStart - (k + 1) * s.beat / 1000;
		if (when < now) continue;
		if (src = $lib.Rhythm.hitSound(when)) s.beatSrcs.push(src);
	}
};
// 히트사운드를 지정한 오디오 시각(생략하면 즉시)에 재생. 효과음 볼륨/음소거를 따름
$lib.Rhythm.hitSound = function (when) {
	var buf = $sound.xrg_hitsound;
	var vol = $data.muteEff ? 0 : ($data.EffectVolume === undefined ? 1 : $data.EffectVolume);
	var src, gain;

	if (!(window.AudioBuffer && buf instanceof AudioBuffer)) return null;
	src = audioContext.createBufferSource();
	src.buffer = buf;
	gain = audioContext.createGain();
	gain.gain.value = vol;
	src.connect(gain);
	gain.connect(audioContext.destination);
	src.start(when || 0);
	return src;
};
// 현재 곡 위치(ms). 출력 지연을 빼서 "귀에 들리는" 위치 기준으로 맞춤
$lib.Rhythm.songTime = function () {
	var s = $lib.Rhythm.s;
	var lat = Math.min(0.25, audioContext.outputLatency || audioContext.baseLatency || 0);

	// s.sync(+면 노트가 일찍 나옴): 판정선 도달 시각과 눌린 시각(서버로 보내는 t)을 같은 만큼 옮겨, 화면과 판정이 함께 맞춰짐
	return (audioContext.currentTime - s.ctxStart - lat) * 1000 + s.sync;
};
$lib.Rhythm.frame = function () {
	var R = $lib.Rhythm;
	var s = R.s;
	var st, i, n, p, remain, txt, k, hint, dur;

	if (!s || s.ended) return;
	s.raf = requestAnimationFrame(R.frame);
	st = R.songTime();

	remain = Math.max(0, XRG_ROUND - Math.max(0, st));
	$stage.game.roundBar
		.width(remain / XRG_ROUND * 100 + "%")
		.html((Math.round(remain / 100) / 10).toFixed(1) + L['SECOND']);
	// 카운트다운은 곡의 박자에 맞춰 7~0 후 다음 박(-1)이 곡 시작 (-1 = 0ms). 7, 6, 5는 3, 2, 1로, 4는 GO!로 표시하고 3~0은 숫자 없이 쉼
	k = Math.ceil(-st / s.beat) - 1;
	// 숫자 없이 쉬는 3~0박에는 조작 안내(데스크톱 Click!, 모바일 Touch!)를 곡 시작까지 서서히 나타났다 사라지게 띄움
	hint = !s.spec && st < 0 && st >= -(XRG_COUNT + 1) * s.beat && k < 4;
	txt = st < -(XRG_COUNT + 1) * s.beat || st >= 0 ? "" : hint ? (mobile ? "Touch!" : "Click!") : k < 4 ? "" : k == 4 ? (L['xrgGo'] || "GO!") : String(k - 4);
	if (s.$title && st >= -(XRG_COUNT + 1) * s.beat) {
		s.$title.remove();
		s.$title = null;
	}
	if (s.$grid && st >= 0) {
		s.$grid.find(".rhythm-key").remove();
	}
	if (s.countTxt !== txt) {
		s.countTxt = txt;
		s.$count.text(txt).removeClass("rhythm-fade");
		if (hint) {
			dur = Math.round(-st) + "ms";
			s.$count.css("animation-duration", dur).addClass("rhythm-fade");
			// 각 패널 중앙에 조작 키 표시 (데스크톱)
			if (!mobile) $.each(s.panels, function (j, $p) {
				$p.append($("<div>").addClass("rhythm-key rhythm-fade").css("animation-duration", dur).text(XRG_KEY_LABEL[j]));
			});
		}
	}

	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		if (n.t - st > s.lead) break;
		if (n.done) continue;
		if (st - n.t > s.win[2]) {
			// 못 누른 노트: 본인 화면에만 미스 표시 (감점 없음)
			n.done = true;
			R.removeMarker(n);
			if (!s.spec) {
				R.splash(n.lane, 3);
				send('xrgMiss', { t: Math.ceil(st) }); // 서버가 이 시각까지의 미스를 정산해 감점 (점수는 서버 결과로 반영)
				s.chain = 0; // 미스에서 콤보 끊김
				R.showCombo(0);
				s.brk = true;
				s.allPerfect = false;
			}
			R.noteDone();
			continue;
		}
		if (!n.el) {
			// 패널 번호(1~4)에 따라 좌상/우상/좌하/우하 모서리 테두리만 그림
			n.el = $("<div>").addClass("rhythm-marker rhythm-m" + n.m + " rhythm-c" + n.lane);
			s.panels[n.lane].append(n.el);
		}
		p = (n.t - st) / s.lead; // 1 -> 0: 커지며 패널 테두리에 닿는 순간이 판정 시점
		n.el.css({
			transform: "scale(" + (0.2 + 0.8 * Math.min(1, 1 - p)) + ")",
			opacity: p < 0 ? Math.max(0, 1 + p * s.lead / s.win[2]) : 1
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
	var st, i, n, d, best, bd, j;

	e.preventDefault();
	if (!s || s.spec || s.ended || s.ctxStart === null) return;
	st = R.songTime();
	bd = Infinity;
	// 눌린 레인에서 판정 범위 안의 미처리 노트 중 가장 가까운 것
	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		if (n.t - st > s.win[2]) break;
		if (n.done || n.lane != lane) continue;
		d = Math.abs(st - n.t);
		if (d <= s.win[2] && d < bd) {
			bd = d;
			best = n;
		}
	}
	if (!best) {
		// 범위 밖(빈) 입력은 공푸어: 내 화면에 MISS만 띄우고 콤보/점수/서버에는 영향 없음
		R.splash(lane, 3);
		return;
	}

	best.done = true;
	R.removeMarker(best);
	j = bd <= s.win[0] ? 0 : bd <= s.win[1] ? 1 : 2;
	R.hitSound();
	R.splash(lane, j); // 내 화면에만 즉시 표시. 점수는 서버가 timestamp로 판정한 결과(turnEnd)로 반영
	// 콤보 표시도 내 화면용: Bad에서 끊기고 Perfect/Good은 이어짐. 두 번째 노트가 1콤보 (보너스 점수는 서버가 같은 규칙으로 계산)
	if (j != 0) s.allPerfect = false;
	if (j == 2) {
		s.chain = 0;
		R.showCombo(0);
		s.brk = true;
	} else R.showCombo(++s.chain - 1);
	send('xrgHit', { lane: lane, t: Math.round(st) });
	R.noteDone();
};
// 노트 하나가 처리(타격/미스)될 때마다 호출: 마지막 노트까지 처리하면 서버에 끝 신호를 보냄 (전원의 신호가 모이면 서버가 조기 종료)
$lib.Rhythm.noteDone = function () {
	var s = $lib.Rhythm.s;

	if (s.spec || --s.left != 0) return;
	send('xrgDone', {});
	// 마지막 노트까지 Bad/Miss 없이 처리했으면 풀 콤보, 전부 Perfect면 올 퍼펙트 (success 소리와 함께)
	if (!s.brk) {
		playSound('success');
		$lib.Rhythm.showFinish(s.allPerfect);
	}
};
// 마지막 스플래시: 풀 콤보(하늘색) / 올 퍼펙트(파스텔 무지개) 문구를 판 중앙에 1초 동안 띄움
$lib.Rhythm.showFinish = function (allPerfect) {
	var s = $lib.Rhythm.s;
	var $f = $("<div>").addClass("rhythm-finish " + (allPerfect ? "rhythm-allp" : "rhythm-fc")).text(allPerfect ? "ALL PERFECT" : "FULL COMBO");

	s.$finish = $f;
	$stage.game.display.append($f);
	addTimeout(function () { $f.remove(); }, 1000);
};
// 키보드 입력: 누르는 동안 패널을 눌린 모양으로 표시하고, 처음 누를 때만 타격 처리 (키 반복 무시)
// 채팅창에 포커스가 있어도 조작 키는 글자로 입력되지 않고 게임으로만 들어감 (포커스도 해제해 한글 조합이 남지 않게 함)
$lib.Rhythm.onKey = function (e, down) {
	var R = $lib.Rhythm;
	var s = R.s;
	var lane = XRG_KEYS[e.code];
	var aim = XRG_AIM_KEYS[e.code];

	if (!s || (lane === undefined && !aim) || e.ctrlKey || e.altKey || e.metaKey) return;
	e.preventDefault();
	if (down && e.target && e.target !== document.body && e.target.blur) e.target.blur();
	// Z/X: 처음 누를 때 마우스 아래 패널을 고르고, 뗄 때까지 그 패널을 눌린 모양으로 둠. 패널 밖이면 아무 일도 없음
	if (aim) {
		if (down && !e.repeat) s.aim[e.code] = s.hover;
		lane = s.aim[e.code];
		if (!down) s.aim[e.code] = null;
		if (lane == null) return;
	}
	s.panels[lane].toggleClass("rhythm-down", down);
	if (down && !e.repeat) R.onPress(e, lane);
};
// 판 중앙(패널 뒤)에 콤보 수를 반투명으로 계속 띄움: 투명도는 그대로, 콤보가 오를 때마다 살짝 커졌다 돌아옴. 1콤보부터 표시, 0이면(끊김) 지움
$lib.Rhythm.showCombo = function (n) {
	var s = $lib.Rhythm.s;

	if (!s) return;
	if (n < 1) {
		if (s.$combo) s.$combo.remove();
		s.$combo = null;
		return;
	}
	if (!s.$combo) {
		s.$combo = $("<div>").addClass("rhythm-combo");
		$stage.game.display.append(s.$combo);
	}
	s.$combo.text(n).removeClass("rhythm-pop");
	void s.$combo[0].offsetWidth; // 애니메이션을 처음부터 다시 재생
	s.$combo.addClass("rhythm-pop");
};
// 키보드 입력 가로채기 해제 (게임 종료/정리 때)
$lib.Rhythm.releaseKeys = function (s) {
	s = s || $lib.Rhythm.s;
	if (!s || !s.keyDown) return;
	document.removeEventListener("keydown", s.keyDown, true);
	document.removeEventListener("keyup", s.keyUp, true);
	s.keyDown = s.keyUp = null;
};
// j: 0=Perfect, 1=Good, 2=Bad, 3=Miss
$lib.Rhythm.splash = function (lane, j) {
	var s = $lib.Rhythm.s;
	var $sp = $("<div>").addClass("rhythm-splash rhythm-j" + j).text(L['xrgJudge' + j] || ['PERFECT', 'GOOD', 'BAD', 'MISS'][j]);

	if (!s) return;
	s.panels[lane].append($sp);
	addTimeout(function () { $sp.remove(); }, 450);
};
// 라운드 종료 처리: 진행을 멈추고 키 입력 가로채기를 풀고 채팅창으로 포커스를 돌려줌. 이미 끝났으면 아무것도 안 하고 false
// turnEnd 신호 없이 roundEnd만 오는 경우(2인 게임에서 한 명이 나가 서버가 바로 roundEnd 등)에도 body.js가 부름
$lib.Rhythm.finish = function () {
	var R = $lib.Rhythm;
	var s = R.s;
	var i;

	if (!s || s.ended) return false;
	s.ended = true;
	cancelAnimationFrame(s.raf);
	for (i = 0; i < s.notes.length; i++) R.removeMarker(s.notes[i]);
	s.$count.text("");
	R.releaseKeys();
	if (!s.spec && !mobile) $stage.talk.focus();
	return true;
};
$lib.Rhythm.turnEnd = function (id, data) {
	var R = $lib.Rhythm;
	var $sc;

	// 라운드 종료 신호
	if (!data || !data.target) {
		R.finish();
		stopBGM();
		playSound('horr');
		return;
	}
	// 내 점수를 포함해 모든 점수는 서버 판정 결과로만 반영
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	// 감점(미스)은 rule_free의 실패처럼 붉은 색(lost)으로 표시
	$sc = $("<div>").addClass("deltaScore").html((data.score > 0 ? "+" : "") + data.score);
	if (data.score < 0) $sc.addClass("lost");
	drawObtainedScore($("#game-user-" + id), $sc);
};
// 게임 화면 정리 (clearBoard / clearGame에서 호출)
$lib.Rhythm.cleanup = function () {
	var s = $lib.Rhythm.s;

	$(".jjoriping,.game-body").removeClass("rhythm");
	if (!s) return;
	$lib.Rhythm.s = null;
	cancelAnimationFrame(s.raf);
	clearInterval(s.syncTimer);
	clearTimeout(s.fbTimer);
	$lib.Rhythm.releaseKeys(s);
	if (s.src) {
		try { s.src.stop(); } catch (e) { }
		if ($data.bgm === s.src) $data.bgm = null;
	}
	(s.beatSrcs || []).forEach(function (b) {
		try { b.stop(); } catch (e) { }
	});
	s.$grid.remove();
	s.$count.remove();
	if (s.$title) s.$title.remove();
	if (s.$combo) s.$combo.remove();
	if (s.$finish) s.$finish.remove();
};
