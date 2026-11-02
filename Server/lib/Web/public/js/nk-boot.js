/**
 * 새로운 끄투(신 UI) 첫 준비 — 로딩 화면이 그려지기 전에 끝나야 하는 것만 모음.
 *
 * 게임 화면(kkutu.pug·모바일 m_kkutu.pug)의 <head>에서 theme-engine.js 뒤에 바로 실행됨(defer 아님).
 * 게임 번들(in_game_kkutu.min.js)은 로딩 화면부터 보이도록 defer로 늦게 실행되므로, 아래 두 가지는 번들 밖에 둠.
 * ① 보조 색: 테마 엔진 결과(--color-*)에서 신 UI 보조 색을 파생해 body에 넣음. layout.pug의 첫 테마 적용(body 시작 직후)부터 색이 맞게.
 *    원래 nk.js 맨 앞에 있던 코드를 그대로 옮김. 포탈(in_portal.js)에도 같은 계산 사본이 있으니 식을 고치면 같이 고칠 것.
 * ② UI 배율: 저장한 배율(kkutu_volume.nkScale)을 로딩 화면보다 먼저 적용 (kkutu.pug #Middle 맨 앞에서 NKBoot.scale()).
 *    배율 계산(upFor·scaleMax)은 nk.js도 여기 것을 씀.
 * 번들과 같이 ES5 문법만 사용할 것.
 */
(function () {
	var root = document.documentElement;

	if (root.getAttribute('data-ui') !== 'new' || !window.ThemeEngine) return;

	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
	function oklchToLinear(L, C, H) {
		var h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
		var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
		var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
		var s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
		return [
			4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
		];
	}
	function inGamut(c) { return c[0] >= -1e-4 && c[0] <= 1.0001 && c[1] >= -1e-4 && c[1] <= 1.0001 && c[2] >= -1e-4 && c[2] <= 1.0001; }
	function oklchToHex(L, C, H) {
		var lo = 0, hi = C, mid, i, rgb = oklchToLinear(L, C, H);

		if (!inGamut(rgb)) {
			for (i = 0; i < 24; i++) {
				mid = (lo + hi) / 2;
				if (inGamut(oklchToLinear(L, mid, H))) lo = mid; else hi = mid;
			}
			rgb = oklchToLinear(L, lo, H);
		}
		return '#' + rgb.map(function (c) {
			c = clamp(c, 0, 1);
			c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
			var x = Math.round(c * 255).toString(16);
			return x.length === 1 ? '0' + x : x;
		}).join('');
	}
	// 프로토타입(nk-prototype.html)에서 프리셋 11종 × 라이트/다크 대비 검사를 거친 계산식
	function applyColors(themeName, darkSetting, g) {
		var TE = window.ThemeEngine;
		var inputs = TE.baseColorsFor(themeName);
		var dark = TE.isDarkActive(darkSetting);
		var p = TE.hexToOklch(g.primary.hex), m = TE.hexToOklch(inputs.medium), p0 = TE.hexToOklch(inputs.primary);
		var neutral = p0.C < 0.02 && m.C < 0.02;
		var mC = (neutral || m.C < 0.02) ? 0 : m.C;
		var dh, accent2, accent, white, black, second, ink, L, i;
		var b = document.body.style;

		// 장식용 그라데이션 끝색: 색깔 2의 색상(hue), 색깔 1과 25° 이내면 30°로 벌림
		dh = ((m.C >= 0.03 ? m.H : p.H + 35) - p.H + 540) % 360 - 180;
		if (Math.abs(dh) < 25) dh = (dh >= 0 ? 1 : -1) * 30;
		accent2 = oklchToHex(dark ? clamp(p.L - 0.05, 0.55, 0.9) : clamp(p.L + 0.07, 0.42, 0.78), neutral ? 0 : clamp(Math.max(m.C, p.C * 0.9), 0.05, 0.19), p.H + dh);
		// 다크 메인 색(사용자 선택 C): 테마 엔진의 파스텔(명도 0.83) 대신 명도 0.7·채도 1.9배, 메인 색 글자는 명도 0.82
		accent = g.primary.hex;
		if (dark) {
			accent = oklchToHex(0.7, Math.min(0.19, p.C * 1.9), p.H);
			b.setProperty('--nk-accent-d', accent);
			b.setProperty('--nk-accent-ink-d', oklchToHex(0.82, Math.min(0.15, p.C * 1.5), p.H));
		} else {
			b.removeProperty('--nk-accent-d');
			b.removeProperty('--nk-accent-ink-d');
		}
		// 강조 배경 위 글자: 버튼 글자는 굵은 15px 이상(큰 글자 기준 3:1)이라 흰 글자가 3:1을 넘으면 흰색 우선
		white = TE.contrastRatio('#FFFFFF', accent);
		black = TE.contrastRatio('#141414', accent);
		// 색깔 2: 라이트는 그대로, 다크는 테마 엔진의 --color-bg-medium이 거의 검정이라 같은 색상을 밝혀서 씀
		second = dark ? oklchToHex(0.78, Math.min(mC, 0.12), m.H) : inputs.medium;
		// 색깔 2 글자색: 같은 색상으로 배경 대비 5:1이 될 때까지 명도 조정
		L = dark ? 0.8 : 0.5;
		for (i = 0; i < 25; i++) {
			ink = oklchToHex(L, mC ? Math.min(Math.max(mC, 0.04), 0.16) : 0, m.H);
			if (TE.contrastRatio(ink, g.bgLight.hex) >= 5) break;
			L += dark ? 0.02 : -0.025;
		}
		b.setProperty('--nk-accent-2', accent2);
		b.setProperty('--nk-on-accent', (white >= 3 || white >= black) ? '#FFFFFF' : '#141414');
		b.setProperty('--nk-second', second);
		b.setProperty('--nk-second-ink', ink);
	}
	// layout.pug의 첫 테마 적용(body 시작 직후)보다 먼저 감쌈 → 이후 모든 테마 적용(설정 변경 등)에도 같이 계산
	var _themeApply = window.ThemeEngine.apply;
	window.ThemeEngine.apply = function (themeName, darkSetting) {
		var g = _themeApply.apply(this, arguments);
		try { applyColors(themeName || 'blue', darkSetting || 'light', g); } catch (e) { }
		return g;
	};

	// 배율을 키우면 실제로 쓸 수 있는 크기가 줄어듦 — 데스크톱 배치가 견디는 크기(약 1024×640, 1366×768 화면의 창)보다 작아지지 않게 (100%는 늘 됨)
	function scaleMax() { return Math.max(1, Math.floor(Math.min(2, innerWidth / 1024, innerHeight / 640) * 20) / 20); }
	// 고해상도 글자 단계(--nk-up)도 실제로 쓸 수 있는 폭(창 폭 ÷ 배율) 기준 — 브라우저 확대와 같게. nk.css의 min-width 단계와 같은 값 (100%면 nk.css 그대로)
	var UP_STEPS = [[2400, 3.5], [2100, 2.75], [1800, 2], [1700, 1.75], [1536, 1.25], [1366, .75], [1200, 0]];
	function upFor(w) {
		for (var i = 0; i < UP_STEPS.length; i++) if (w >= UP_STEPS[i][0]) return UP_STEPS[i][1];
		return -.5;
	}
	window.NKBoot = {
		upFor: upFor,
		scaleMax: scaleMax,
		// nk.js setZoom과 같은 방식(body zoom + html --nk-scale + body --nk-up). 번들이 오면 nk.js applyScale이 같은 값으로 이어받음
		scale: function () {
			var s, z;

			if (root.getAttribute('data-nk-device') === 'phone') return;
			try { s = JSON.parse(localStorage.getItem('kkutu_volume')) || {}; } catch (e) { s = {}; }
			z = Math.min(clamp(Number(s.nkScale) || 100, 50, 200) / 100, scaleMax());
			if (z === 1) return;
			root.style.setProperty('--nk-scale', z);
			document.body.style.zoom = z;
			document.body.style.setProperty('--nk-up', upFor(innerWidth / z));
		}
	};
})();
