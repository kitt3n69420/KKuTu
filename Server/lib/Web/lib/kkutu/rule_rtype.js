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

$lib.Rtype = {};

// 리듬 타이퍼 (KRT)
// - 쪼리핑 표시창(.jjo-display) 안에서 자모 노트가 오른쪽 -> 왼쪽으로 흐르고, 가운데 초록 판정선에 닿는 순간이 판정 시점
// - 노란 바(턴 시간 바)는 항상 가득 차 있고 지금 입력 중인 내용을 보여줌
// - 입력: 키 이벤트는 쓰지 않고 입력창(textarea) 값만 비교함 (쿼티/천지인/단모음/세벌식, 삼성/Gboard 공통)
//   값을 타수 순서 자모로 분해해 이전 값과 비교: 늘어난 자모 = 입력, 줄어듦 = 백스페이스, 값의 \n = 엔터
//   input 이벤트(주 경로)와 매 프레임 검사(안전망)가 같은 비교 함수를 부름
// - 오디오 시계/서버 시계 동기화/카운트다운은 4패널 치기(rule_rhythm.js)에서 복사함
// - 판정은 서버가 함. 클라이언트는 같은 규칙으로 내 화면에만 미리 표시하고, 입력 {k, t}를 모두 서버로 보냄
var RTP_LEAD = 1500;      // 노트가 오른쪽 끝에서 판정선(가운데)까지 오는 시간 (ms): 기본값(보통 난이도). 실제는 서버가 보낸 난이도별 속도 배율로 나눔(s.lead). 지난 노트는 같은 속도로 왼쪽 끝까지 흘러감
var RTP_WIN = [50, 150, 300]; // Perfect / Good / Bad 허용 오차 (ms): 기본값. 실제 범위는 서버가 난이도별로 보내줌(s.win)
var RTP_ROUND = 60000;
var RTP_COUNT = 7;        // 카운트다운 7~0 (8박) 후 다음 박(-1)에 곡이 시작 (곡 시각 0ms = -1)
var RTP_SYNC_MAX = 300;   // 개인 싱크 보정 한계 (+-ms). 설정의 리듬 보정 슬라이더 값 (4패널 치기와 공용)
var RTP_SYNC_COUNT = 6;
var RTP_SYNC_GAP = 120;
var RTP_BATCH = 20;       // 삼성 키보드는 받침이 다음 글자로 넘어갈 때 한 번 누름에 값이 2번 바뀜("읮"->"의"->"의지"). 이 시간 안의 변화는 하나로 묶음
var RTP_ENTER_DEDUP = 80; // 이 시간 안에 다시 들어온 엔터는 중복으로 무시 (macOS 조합 중 엔터 등)
var RTP_PASTE = 3;        // 한 번에 자모가 이 수 이상 늘면 붙여넣기로 보고 무시
var RTP_ENTER = "\n";
var RTP_CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
var RTP_JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅗㅏ", "ㅗㅐ", "ㅗㅣ", "ㅛ", "ㅜ", "ㅜㅓ", "ㅜㅔ", "ㅜㅣ", "ㅠ", "ㅡ", "ㅡㅣ", "ㅣ"];
var RTP_JONG = ["", "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
// 낱자로 들어온 겹모음/겹받침 (예: 초성 없이 조합 중인 ㅢ)
var RTP_COMPAT = { "ㅘ": "ㅗㅏ", "ㅙ": "ㅗㅐ", "ㅚ": "ㅗㅣ", "ㅝ": "ㅜㅓ", "ㅞ": "ㅜㅔ", "ㅟ": "ㅜㅣ", "ㅢ": "ㅡㅣ", "ㄳ": "ㄱㅅ", "ㄵ": "ㄴㅈ", "ㄶ": "ㄴㅎ", "ㄺ": "ㄹㄱ", "ㄻ": "ㄹㅁ", "ㄼ": "ㄹㅂ", "ㄽ": "ㄹㅅ", "ㄾ": "ㄹㅌ", "ㄿ": "ㄹㅍ", "ㅀ": "ㄹㅎ", "ㅄ": "ㅂㅅ" };

// 두벌식 타수 순서로 분해 (ㅢ = ㅡㅣ, ㄳ = ㄱㅅ)
function rtpDecompose(str) {
	var r = [];
	var i, c, ch;

	for (i = 0; i < str.length; i++) {
		ch = str.charAt(i);
		c = str.charCodeAt(i) - 0xAC00;
		if (c < 0 || c > 11171) {
			r = r.concat((RTP_COMPAT[ch] || ch).split(""));
			continue;
		}
		r = r.concat((RTP_CHO.charAt(Math.floor(c / 588)) + RTP_JUNG[Math.floor(c % 588 / 28)] + RTP_JONG[c % 28]).split(""));
	}
	return r;
}
// 앞부분이 같은 만큼을 빼고 늘어난/줄어든 자모
function rtpDiff(a, b) {
	var L = 0;

	while (L < a.length && L < b.length && a[L] == b[L]) L++;
	return { added: b.slice(L), removed: a.slice(L) };
}

$lib.Rtype.s = null;

$lib.Rtype.roundReady = function (data, spec) {
	var R = $lib.Rtype;
	var s, i, n, w, k, charMs;

	// 처음부터 관전 중인 사람(참가자가 아님)과 리플레이도 관전자로 취급: 중간 입장 때만 spec 인자가 넘어옴
	spec = spec || !!$data._spectate || !!$data._replay;
	clearBoard();
	stopBGM();
	$data.room.round = 1;
	if (data.time) $data.room.time = data.time;

	// 채보 전개: 글자 1개 길이 = (60/BPM) x (4/해상도)초. 노트 순서대로 keys의 글자(자모 또는 엔터)가 대응
	charMs = 60000 / data.bpm * 4 / data.res;
	s = R.s = {
		beat: 60000 / data.bpm,
		spec: !!spec,
		song: data.song,
		title: data.title || data.song.replace(/_/g, " "),
		key: 'xrg_' + data.song, // BGM 캐시 키 (4패널 치기와 같은 파일이므로 공유)
		notes: [],
		words: [],
		lo: 0,          // 그리기 시작할 노트 (왼쪽 끝을 지나 사라진 노트는 건너뜀)
		p: 0,           // 다음에 판정할 노트 (노트는 항상 앞에서부터 차례로 처리됨)
		dead: [],       // 단어별: 보너스 없음 (MISS 또는 입력 중 백스페이스)
		worst: [],      // 단어별: 최저 판정 (0 Perfect / 1 Good / 2 Bad)
		ctxStart: null,
		best: null,
		syncN: 0,
		win: data.win || RTP_WIN,
		lead: RTP_LEAD / (data.speed || 1),
		sync: Math.max(-RTP_SYNC_MAX, Math.min(RTP_SYNC_MAX, Number(loadVolumeSettings().rhythmSync) || 0)),
		chain: 0,
		brk: false,      // 콤보가 한 번이라도 끊겼는지 (풀 콤보 판정용)
		allPerfect: true,
		barTxt: null,
		msgTxt: null,
		ended: false
	};
	for (i = 0, n = 0; i < data.seq.length; i++) {
		if (data.seq.charAt(i) == '.') continue;
		s.notes.push({ t: i * charMs, k: data.keys.charAt(n), w: 0, done: false, el: null });
		n++;
	}
	for (w = 0, n = 0; w < data.words.length; w++) {
		s.words.push({ text: data.words[w].text, first: n });
		for (k = 0; k <= data.words[w].n; k++) s.notes[n++].w = w;
	}
	s.left = s.notes.length; // 아직 처리(입력/미스)되지 않은 노트 수. 0이 되면 서버에 끝 신호를 보냄

	s.$lane = $("<div>").addClass("rtype-lane").append($("<div>").addClass("rtype-line"));
	// 표시창 가운데 글자: 곡 시작 전에는 곡 이름/카운트다운, 마지막 노트 뒤에는 풀 콤보/올 퍼펙트
	s.$msg = $("<div>").addClass("rtype-msg").hide();
	// 왼쪽 미션 칸(.items)은 숨기지 않고 clearBoard가 둔 대로(투명) 남겨, 오른쪽 체인 칸과 좌우 균형을 맞춤
	$stage.game.display.empty().addClass("rtype-display").append(s.$lane, s.$msg);
	// 노란 바: 항상 가득 차 있고, 곡 시작 직전에는 조작 안내, 곡 중에는 지금 입력 중인 내용
	$stage.game.turnBar.width("100%").css('text-align', "center");
	R.setBar("");
	R.setMsg("♪ " + s.title);
	// 체인 칸: 내 콤보. 관전자는 비움
	$stage.game.chain.show().html(spec ? "" : 0);

	if (!spec) R.setupInput();

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
// 입력창
// - 모바일: 플로팅 입력창(.game-input) 자리에 한 줄짜리 textarea (엔터가 값에 \n으로 들어가고, 엔터를 쳐도 키보드가 닫히지 않음)
// - 데스크톱: 채팅창(#Talk)을 그대로 입력창으로 씀 (평소 포커스가 있는 곳). 엔터는 값에 남지 않으므로 키 이벤트로 받고 채팅 전송은 막음
$lib.Rtype.setupInput = function () {
	var R = $lib.Rtype;
	var s = R.s;

	s.inp = { lastVal: "", prevJ: [], batch: null, lastEnter: -Infinity, histW: -1 };
	s.onInput = function (e) {
		if (R.s === s) R.check(e.timeStamp);
	};
	if (mobile) {
		s.ownInput = true;
		s.$input = $("<textarea>").addClass("rtype-input").attr({ rows: 1, autocomplete: "off", autocorrect: "off", autocapitalize: "off", spellcheck: "false" });
		// 입력창을 누르면 .game-input의 기본 클릭 처리(숨긴 #game-input 포커스)가 포커스를 가져가지 않게 막음
		s.$input.on('click', function (e) { e.stopPropagation(); });
		$stage.game.hereText.hide();
		$stage.game.here.append(s.$input).css({ 'opacity': 1, 'top': "" }).show();
		// 입력창 주변(.game-input 여백)을 눌러도 이 입력창으로 포커스
		$stage.game.here.on('click.rtype', function () {
			if (R.s === s && s.$input) s.$input.focus();
		});
	} else {
		s.$input = $stage.talk;
		$stage.talk.val("");
		$stage.game.hereText.val("");
		// 캡처 단계에서 받아 채팅창의 엔터(채팅 전송)보다 먼저 처리
		s.onKey = function (e) { R.onKey(e); };
		document.addEventListener("keydown", s.onKey, true);
	}
	s.$input[0].addEventListener("input", s.onInput);
};
// 데스크톱 키 입력: 채팅창의 엔터는 게임 입력으로 바꾸고, 입력란 밖에서 누른 키는 채팅창으로 포커스를 옮겨 바로 칠 수 있게 함
$lib.Rtype.onKey = function (e) {
	var R = $lib.Rtype;
	var s = R.s;
	var tag = e.target && e.target.tagName;

	if (!s || !s.$input || e.ctrlKey || e.altKey || e.metaKey) return;
	if (e.key === "Enter" || e.keyCode === 13) {
		if (e.target !== s.$input[0]) return;
		// 꾹 누를 때의 자동 반복은 입력으로 치지 않음 (채팅 전송만 막음)
		if (e.repeat) {
			e.preventDefault();
			e.stopImmediatePropagation();
			return;
		}
		// macOS는 조합 중 엔터에 keydown이 두 번 옴(229 다음 13): 조합 중인 것은 기본 동작(조합 확정)을 막지 않고, 중복은 R.enter가 거름
		if (!e.isComposing && e.keyCode !== 229) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
		R.enter(e.timeStamp);
		return;
	}
	if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !e.target.isContentEditable) s.$input.focus();
};
$lib.Rtype.releaseInput = function (s) {
	s = s || $lib.Rtype.s;
	if (!s || !s.$input) return;
	clearTimeout(s.inp.batchTimer);
	s.$input[0].removeEventListener("input", s.onInput);
	if (s.onKey) document.removeEventListener("keydown", s.onKey, true);
	if (s.ownInput) {
		s.$input.remove();
		$stage.game.here.off('click.rtype');
		$stage.game.hereText.show();
	} else {
		$stage.talk.val("");
		$stage.game.hereText.val("");
	}
	s.$input = null;
};
// 서버와의 시계 차이 측정: RTT가 가장 작은 표본을 채택
$lib.Rtype.startSync = function () {
	var R = $lib.Rtype;
	var s = R.s;

	if (s.spec) return;
	s.syncTimer = addInterval(function () {
		if (R.s !== s || ++s.syncN > RTP_SYNC_COUNT) return clearInterval(s.syncTimer);
		send('xrgSync', { c: Date.now() });
	}, RTP_SYNC_GAP);
};
$lib.Rtype.onSync = function (data) {
	var s = $lib.Rtype.s;
	var rtt = Date.now() - data.c;

	if (!s || rtt < 0) return;
	// 서버 시각 = 로컬 시각 + off
	if (!s.best || rtt < s.best.rtt) s.best = { rtt: rtt, off: data.s - (data.c + rtt / 2) };
};
$lib.Rtype.turnStart = function (data) {
	var R = $lib.Rtype;
	var s = R.s;
	var off, msUntil;

	if (!s) return;
	off = s.best ? s.best.off : (typeof data.now == 'number' ? data.now - Date.now() : 0);
	msUntil = (data.startAt - off) - Date.now();
	if (audioContext.state == 'suspended') audioContext.resume();
	s.ctxStart = audioContext.currentTime + msUntil / 1000;
	if (s.loaded) R.playAudio();
	R.playBeats();
	if (s.$input && !mobile) s.$input.focus();
	cancelAnimationFrame(s.raf);
	s.raf = requestAnimationFrame(R.frame);
};
// 지정한 시각(ctxStart)에 BGM 재생 시작. 이미 지났으면 그만큼 건너뛰어 재생
$lib.Rtype.playAudio = function () {
	var s = $lib.Rtype.s;
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
$lib.Rtype.playBeats = function () {
	var s = $lib.Rtype.s;
	var now = audioContext.currentTime;
	var k, when, src;

	if (!s || s.ctxStart === null || s.beatsPlayed) return;
	s.beatsPlayed = true;
	s.beatSrcs = [];
	for (k = RTP_COUNT; k >= 4; k--) {
		when = s.ctxStart - (k + 1) * s.beat / 1000;
		if (when < now) continue;
		if (src = $lib.Rtype.hitSound(when)) s.beatSrcs.push(src);
	}
};
// 히트사운드를 지정한 오디오 시각(생략하면 즉시)에 재생. 효과음 볼륨/음소거를 따름
$lib.Rtype.hitSound = function (when) {
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
$lib.Rtype.songTime = function () {
	var s = $lib.Rtype.s;
	var lat = Math.min(0.25, audioContext.outputLatency || audioContext.baseLatency || 0);

	// s.sync(+면 노트가 일찍 나옴): 판정선 도달 시각과 입력 시각(서버로 보내는 t)을 같은 만큼 옮겨, 화면과 판정이 함께 맞춰짐
	return (audioContext.currentTime - s.ctxStart - lat) * 1000 + s.sync;
};
// 이벤트 시각(performance.now 기준 e.timeStamp)을 곡 위치(ms)로 바꿈
$lib.Rtype.toSongTime = function (ts) {
	return $lib.Rtype.songTime() - (performance.now() - ts);
};
$lib.Rtype.setBar = function (txt) {
	var s = $lib.Rtype.s;

	if (s.barTxt === txt) return;
	s.barTxt = txt;
	$stage.game.turnBar.text(txt);
};
// 표시창 가운데 글자. cls는 글자 색 클래스(풀 콤보/올 퍼펙트는 4패널 치기와 같은 색), 빈 문자열이면 숨김
// 글자는 label에 넣음 (style.css가 span을 전부 display: none으로 숨김)
$lib.Rtype.setMsg = function (txt, cls) {
	var s = $lib.Rtype.s;

	if (s.msgTxt === txt) return;
	s.msgTxt = txt;
	s.$msg.empty().append($("<label>").addClass(cls || "").text(txt)).toggle(!!txt);
};
$lib.Rtype.frame = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var st, i, n, dt, half, remain, k, missed;

	if (!s || s.ended) return;
	s.raf = requestAnimationFrame(R.frame);
	// 안전망: input 이벤트 없이 값이 바뀐 경우도 잡음 (값이 그대로면 아무것도 안 함)
	if (s.$input) R.check(performance.now());
	st = R.songTime();

	remain = Math.max(0, RTP_ROUND - Math.max(0, st));
	$stage.game.roundBar
		.width(remain / RTP_ROUND * 100 + "%")
		.html((Math.round(remain / 100) / 10).toFixed(1) + L['SECOND']);
	// 곡 시작 전: 표시창에 곡 이름 -> 카운트다운(7, 6, 5 = 3, 2, 1 / 4 = GO!), 3~0박에는 노란 바에 조작 안내. 곡 중에는 노란 바에 입력 중인 내용(R.drawTyped)
	if (st < 0) {
		k = Math.ceil(-st / s.beat) - 1;
		if (st < -(RTP_COUNT + 1) * s.beat) R.setMsg("♪ " + s.title);
		else if (k > 4) R.setMsg(String(k - 4));
		else if (k == 4) R.setMsg(L['xrgGo'] || "GO!");
		else {
			R.setMsg("");
			R.setBar(s.spec ? "" : mobile ? "Touch!" : "Type!");
		}
	} else if (!s.started) {
		R.setMsg("");
		s.started = true;
		R.drawTyped();
	}

	// 판정 범위를 지난 노트: 미스. 서버에도 이 시각까지의 미스를 정산하게 알림 (한 프레임에 한 번)
	if (!s.spec) {
		while (s.p < s.notes.length && st - s.notes[s.p].t > s.win[2]) {
			R.missNote();
			missed = true;
		}
		if (missed) send('rtpMiss', { t: Math.ceil(st) });
	}

	half = s.$lane[0].clientWidth / 2;
	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		dt = n.t - st;
		if (dt > s.lead) break;
		if (dt < -s.lead) {
			// 왼쪽 끝까지 흘러간 노트는 지움
			R.removeNote(n);
			if (i == s.lo) s.lo++;
			continue;
		}
		if (!n.el) {
			n.el = $("<div>").addClass("rtype-note" + (n.k == RTP_ENTER ? " rtype-enter" : "")).text(n.k == RTP_ENTER ? "⏎" : n.k);
			if (n.j !== undefined) n.el.addClass("rtype-j" + n.j);
			s.$lane.append(n.el);
		}
		n.el[0].style.transform = "translateX(" + (half + dt / s.lead * half).toFixed(1) + "px)";
	}
};
$lib.Rtype.removeNote = function (n) {
	if (n.el) {
		n.el.remove();
		n.el = null;
	}
};
// 노트 판정 결과를 색으로 표시: 0 퍼펙트 하늘 / 1 굿 초록 / 2 배드 빨강 / 3 미스 회색
$lib.Rtype.markNote = function (n, j) {
	n.done = true;
	n.j = j;
	if (n.el) n.el.addClass("rtype-j" + j);
};
// 노트 p를 처리했으니 다음으로. 단어의 마지막 노트(엔터)였으면 다음 단어 전에 입력창을 비움
$lib.Rtype.advance = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var n = s.notes[s.p++];
	var last = --s.left == 0;
	var fc = last && !s.brk;

	if (n.k == RTP_ENTER) {
		// 단어 완성: 전부 Perfect면 success, 최저 판정이 Good이면 mission 소리 (Bad가 있거나 보너스가 사라진 단어는 소리 없음)
		// 마지막 단어에서 풀 콤보/올 퍼펙트면 아래의 success 소리만 냄 (겹치지 않게)
		if (!fc && !s.dead[n.w] && s.worst[n.w] < 2) playSound(s.worst[n.w] == 0 ? 'success' : 'mission');
		R.clearInput();
	}
	if (last) {
		send('rtpDone', {});
		// 마지막 노트까지 콤보가 안 끊겼으면 풀 콤보, 전부 Perfect면 올 퍼펙트 (success 소리와 함께 표시창에 표시)
		if (fc) {
			playSound('success');
			R.setMsg(s.allPerfect ? "ALL PERFECT" : "FULL COMBO", s.allPerfect ? "rhythm-allp" : "rhythm-fc");
		}
	}
};
$lib.Rtype.missNote = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var n = s.notes[s.p];

	R.markNote(n, 3);
	s.dead[n.w] = true;
	s.brk = true;
	s.allPerfect = false;
	R.breakCombo();
	R.advance();
};
$lib.Rtype.hitNote = function (t) {
	var R = $lib.Rtype;
	var s = R.s;
	var n = s.notes[s.p];
	var d = Math.abs(t - n.t);
	var j = d <= s.win[0] ? 0 : d <= s.win[1] ? 1 : 2;

	R.markNote(n, j);
	R.hitSound();
	if (s.worst[n.w] === undefined || j > s.worst[n.w]) s.worst[n.w] = j;
	if (j != 0) s.allPerfect = false;
	// Bad에서 콤보가 끊기고 Perfect/Good은 이어짐 (보너스 점수는 서버가 같은 규칙으로 계산)
	if (j == 2) {
		s.brk = true;
		R.breakCombo();
	} else R.showCombo(++s.chain);
	R.advance();
};
// 콤보 끊김 (미스/배드/공미스). 이어지던 콤보가 없으면(곡 시작 전 입력 등) 풀 콤보 판정에는 영향 없음
$lib.Rtype.breakCombo = function () {
	var s = $lib.Rtype.s;

	if (s.chain > 0) {
		s.brk = true;
		s.allPerfect = false;
	}
	s.chain = 0;
	$lib.Rtype.showCombo(0);
};
// 체인 칸에 콤보 표시: 두 번째 연속 성공이 1콤보 (4패널 치기와 같음)
$lib.Rtype.showCombo = function (chain) {
	$stage.game.chain.html(Math.max(0, chain - 1));
};
// 입력 하나를 내 화면에서 판정하고 서버로 보냄. k = 자모 / 엔터 / 'BS', t = 곡 위치(ms)
// 규칙은 서버(rtype.js applyHit)와 같음: 맨 앞 노트와 같으면 판정, 다르지만 다음 노트와 같으면 앞 노트 MISS + 다음 노트 판정,
// 그 밖은 공미스(콤보만 끊김). 백스페이스는 단어 입력 중이면 그 단어 보너스만 없앰
$lib.Rtype.press = function (k, t) {
	var R = $lib.Rtype;
	var s = R.s;
	var f, n2;

	send('rtpHit', { k: k, t: Math.round(t) });
	while (s.p < s.notes.length && t - s.notes[s.p].t > s.win[2]) R.missNote();
	f = s.notes[s.p];
	n2 = s.notes[s.p + 1];
	if (k === 'BS') {
		if (f && s.p > s.words[f.w].first) s.dead[f.w] = true;
		return;
	}
	if (f && Math.abs(t - f.t) <= s.win[2] && f.k === k) return R.hitNote(t);
	if (f && n2 && Math.abs(t - n2.t) <= s.win[2] && n2.k === k) {
		R.missNote();
		return R.hitNote(t);
	}
	R.breakCombo();
};
// 입력창 값 비교 (input 이벤트와 매 프레임 검사가 같이 부름). 이전 값과 같으면 아무것도 안 함
$lib.Rtype.check = function (ts) {
	var R = $lib.Rtype;
	var s = R.s;
	var inp = s.inp;
	var v = s.$input.val();
	var nl;

	if (v === inp.lastVal) return;
	inp.lastVal = v;
	nl = v.indexOf(RTP_ENTER) != -1;
	if (!inp.batch) {
		inp.batch = { startJ: inp.prevJ, ts: ts };
		inp.batchTimer = addTimeout(R.closeBatch, RTP_BATCH);
	}
	inp.prevJ = rtpDecompose(v.replace(/\n/g, ""));
	if (nl) {
		// 엔터는 묶음을 기다리지 않고 바로 처리 (묶음 안의 자모를 먼저, 엔터를 나중에)
		inp.batch.enter = ts;
		R.closeBatch();
	}
	R.drawTyped();
};
// 키 이벤트로 받은 엔터 (데스크톱 채팅창: 엔터가 값에 남지 않음). 아직 못 본 값 변화(조합 확정)를 먼저 처리한 뒤 엔터
$lib.Rtype.enter = function (ts) {
	var R = $lib.Rtype;
	var inp = R.s.inp;

	R.check(ts);
	if (!inp.batch) inp.batch = { startJ: inp.prevJ, ts: ts };
	inp.batch.enter = ts;
	R.closeBatch();
};
// 묶음이 끝나면 묶음 시작 때와 지금의 자모를 비교해 입력으로 처리
$lib.Rtype.closeBatch = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var inp, b, d, t, i, v;

	if (!s || !s.inp || !(b = s.inp.batch)) return;
	inp = s.inp;
	inp.batch = null;
	clearTimeout(inp.batchTimer);
	// 곡 시각을 알기 전(시작 신호 전)이나 끝난 뒤의 입력은 버림
	if (s.ctxStart === null || s.ended) return R.clearInput();
	d = rtpDiff(b.startJ, inp.prevJ);
	t = R.toSongTime(b.ts);
	if (d.removed.length) R.press('BS', t);
	if (d.added.length < RTP_PASTE) {
		for (i = 0; i < d.added.length; i++) R.press(d.added[i], t);
	}
	if (b.enter) {
		if (b.enter - inp.lastEnter >= RTP_ENTER_DEDUP) {
			inp.lastEnter = b.enter;
			// 엔터를 누른 때 입력창에 입력이 있었으면 그 단어의 정답 단어를 히스토리에 (단어를 완성했든 못했든). 판정이 입력창을 비우므로 먼저 읽어 둠
			v = s.$input.val().replace(/\n/g, "");
			R.press(RTP_ENTER, R.toSongTime(b.enter));
			// 방금 처리한 노트가 엔터면 그 단어, 아니면(공미스) 지금 입력 중인 단어. 이미 넣은 단어는 다시 넣지 않음
			if (v) {
				i = s.p > 0 && s.notes[s.p - 1].k == RTP_ENTER ? s.notes[s.p - 1].w : s.p < s.notes.length ? s.notes[s.p].w : s.words.length - 1;
				if (i !== inp.histW) {
					inp.histW = i;
					pushHistory(s.words[i].text, "");
				}
			}
		}
		// 단어 끝 엔터였으면 위에서 이미 비워짐. 단어 중간 엔터(공미스)면 줄바꿈만 지우고 입력 중인 글자는 남김
		if (s.$input && (v = s.$input.val()).indexOf(RTP_ENTER) != -1) {
			s.$input.val(v.replace(/\n/g, ""));
			inp.lastVal = s.$input.val();
		}
	}
	R.drawTyped();
};
// 다음 단어 전에 입력창을 비움 (조합 중이어도 비움: 실기 테스트에서 지운 글자가 되살아나지 않음을 확인)
$lib.Rtype.clearInput = function () {
	var R = $lib.Rtype;
	var s = R.s;

	if (!s.$input) return;
	if (s.inp.batch) R.closeBatch();
	s.$input.val("");
	if (!s.ownInput) $stage.game.hereText.val(""); // 데스크톱: 채팅창과 동기화되는 플로팅 입력창도 같이 비움
	$data._kd = ""; // 붙여넣기 감지 기준선(checkInput)
	s.inp.lastVal = "";
	s.inp.prevJ = [];
	R.drawTyped();
};
// 노란 바에 지금 입력 중인 내용 (곡 시작 후에만)
$lib.Rtype.drawTyped = function () {
	var s = $lib.Rtype.s;

	if (!s.started) return;
	$lib.Rtype.setBar(s.$input ? s.$input.val().replace(/\n/g, "") : "");
};
$lib.Rtype.turnEnd = function (id, data) {
	var R = $lib.Rtype;
	var s = R.s;
	var i, $sc;

	// 라운드 종료 신호
	if (!data || !data.target) {
		if (s) {
			s.ended = true;
			cancelAnimationFrame(s.raf);
			for (i = 0; i < s.notes.length; i++) R.removeNote(s.notes[i]);
			R.releaseInput(s);
			if (!s.spec && !mobile) $stage.talk.focus();
		}
		stopBGM();
		playSound('horr');
		return;
	}
	// 내 점수를 포함해 모든 점수는 서버 판정 결과로만 반영 (judge 3 = 미스 감점, 4 = 단어 완성 보너스)
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	$sc = $("<div>").addClass("deltaScore").html((data.score > 0 ? "+" : "") + data.score);
	if (data.score < 0) $sc.addClass("lost");
	drawObtainedScore($("#game-user-" + id), $sc);
};
// 게임 화면 정리 (clearBoard / clearGame에서 호출)
$lib.Rtype.cleanup = function () {
	var s = $lib.Rtype.s;

	$stage.game.display.removeClass("rtype-display");
	if (!s) return;
	$lib.Rtype.s = null;
	cancelAnimationFrame(s.raf);
	clearInterval(s.syncTimer);
	clearTimeout(s.fbTimer);
	$lib.Rtype.releaseInput(s);
	if (s.src) {
		try { s.src.stop(); } catch (e) { }
		if ($data.bgm === s.src) $data.bgm = null;
	}
	(s.beatSrcs || []).forEach(function (b) {
		try { b.stop(); } catch (e) { }
	});
	s.$lane.remove();
	s.$msg.remove();
};
