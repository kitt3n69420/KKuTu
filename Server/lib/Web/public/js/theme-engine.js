/*
 * ThemeEngine: 4 base colors (primary / medium / lightBase / darkBase) -> the 5 real theme
 * CSS variables (--color-primary/-primary-dark/-bg-light/-bg-medium/-border) plus two extra
 * variables consumed additively by style.css/in_kkutu.css (--theme-text, --theme-surface) and
 * the intro/GameBox filter (--theme-filter). Loaded as a plain early <script> (see module.pug's
 * PageHead) so it's available both to the synchronous FOUC-prevention snippet in layout.pug and
 * to the later-loaded body.js/ready.js bundle. Ported from the theme-lab.html prototype.
 */
(function (global) {
	"use strict";

	/* ---------- OKLab / OKLCH <-> sRGB ---------- */
	function srgbToLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
	function linearToSrgb(c) { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }

	function hexToRgb(hex) {
		hex = hex.replace('#', '');
		if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
		var n = parseInt(hex, 16);
		return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
	}
	function rgbToHex(r, g, b) {
		function h(v) { v = Math.round(Math.max(0, Math.min(1, v)) * 255); var s = v.toString(16); return s.length === 1 ? '0' + s : s; }
		return '#' + h(r) + h(g) + h(b);
	}

	function linearRgbToOklab(r, g, b) {
		var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
		var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
		var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
		var l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
		return [
			0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
			1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
			0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
		];
	}
	function oklabToLinearRgb(L, a, b) {
		var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
		var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
		var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
		var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
		return [
			+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
		];
	}

	function hexToOklab(hex) {
		var rgb = hexToRgb(hex).map(srgbToLinear);
		return linearRgbToOklab(rgb[0], rgb[1], rgb[2]);
	}
	function hexToOklch(hex) {
		var lab = hexToOklab(hex);
		var C = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
		var H = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (H < 0) H += 360;
		return { L: lab[0], C: C, H: H };
	}

	function oklchToLinearRgb(L, C, H) {
		var hr = H * Math.PI / 180;
		return oklabToLinearRgb(L, C * Math.cos(hr), C * Math.sin(hr));
	}
	function inGamut(rgb) { return rgb[0] >= -1e-4 && rgb[0] <= 1.0001 && rgb[1] >= -1e-4 && rgb[1] <= 1.0001 && rgb[2] >= -1e-4 && rgb[2] <= 1.0001; }

	function oklchToHex(L, C, H) {
		L = Math.max(0, Math.min(1, L));
		var lo = 0, hi = Math.max(0, C), clamped = false;
		var rgb = oklchToLinearRgb(L, hi, H);
		if (!inGamut(rgb)) {
			clamped = true;
			for (var i = 0; i < 24; i++) {
				var mid = (lo + hi) / 2;
				rgb = oklchToLinearRgb(L, mid, H);
				if (inGamut(rgb)) lo = mid; else hi = mid;
			}
			rgb = oklchToLinearRgb(L, lo, H);
		}
		var srgb = rgb.map(linearToSrgb);
		return { hex: rgbToHex(srgb[0], srgb[1], srgb[2]), l: L, c: (clamped ? lo : C), h: H, clamped: clamped };
	}

	function mixOklab(hexA, hexB, t) {
		var a = hexToOklab(hexA), b = hexToOklab(hexB);
		var L = a[0] + (b[0] - a[0]) * t, A = a[1] + (b[1] - a[1]) * t, B = a[2] + (b[2] - a[2]) * t;
		var C = Math.sqrt(A * A + B * B);
		var H = Math.atan2(B, A) * 180 / Math.PI; if (H < 0) H += 360;
		return oklchToHex(L, C, H);
	}

	function normHue(h) { h = h % 360; if (h > 180) h -= 360; if (h < -180) h += 360; return h; }
	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

	/* ---------- config (calibrated in theme-lab.html against the 6 shipped themes) ---------- */
	var CFG = {
		border: { light: 0.35, dark: 0.62, darkLift: 0.12 },
		l: {
			primaryDark: { dL: 0.075, kC: 0.97 }
		},
		d: {
			primary: { L: 0.830, C: 0.110, lFollow: 0.35 },
			primaryDark: { L: 0.770, C: 0.140, lFollow: 0.35 },
			bgMedium: { L: 0.173, C: 0.025 }
		},
		surface: { toWhite: 0.096 },
		menuBtn: { toWhite: 0.5, toBlack: 0.5 },
		scrollTrack: { light: 0.2, dark: 0.2 },
		f: { satMax: 200, briMin: 60, briMax: 150 },
		// dark-mode GameBox/Intro tile filter: darkTarget's own gamma-space luma * k is the luma the
		// filtered tile should land on (k>1 keeps the tile a bit lighter than the page background,
		// matching the old hand-tuned invert(1) saturate(0%) brightness(0.45) rule's ~0.147 output
		// luma against the default #151515/#1A1A1A darkBase); refC is the darkBase chroma treated as
		// 100% saturate.
		fd: { k: 1.6, refC: 0.05, satMax: 150, briMin: 10, briMax: 60 }
	};

	/* 6 shipped themes' base colors + their real (hand-tuned) in_kkutu.css filter, used as an
	   exact lookup when the current inputs match a preset exactly (hue-rotate() is a matrix
	   operation, not a hue-space rotation, so no formula reproduces it perfectly). */
	var PRESETS = [
		{ key: 'grape', name: '포도', primary: '#8e18af', medium: '#e7b2f5', lightBase: '#FFFFFF', darkBase: '#1A1A1A', filter: 'hue-rotate(68deg) saturate(120%) brightness(102%)' },
		{ key: 'blue', name: '소다', primary: '#1976D2', medium: '#90CAF9', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'none' },
		{ key: 'green', name: '녹차', primary: '#558B2F', medium: '#AED581', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'hue-rotate(-120deg) saturate(80%)' },
		{ key: 'yellow', name: '망고', primary: '#F9A825', medium: '#FFE082', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'hue-rotate(-167deg) saturate(130%) brightness(130%)' },
		{ key: 'orange', name: '오렌지', primary: '#e67300', medium: '#FFCC80', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'hue-rotate(-180deg) saturate(130%) brightness(110%)' },
		{ key: 'red', name: '딸기', primary: '#C62828', medium: '#EF9A9A', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'hue-rotate(135deg)' },
		{ key: 'gray', name: '모노크롬', primary: '#616161', medium: '#BDBDBD', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'saturate(0)' },
		{ key: 'slate', name: '슬레이트', primary: '#798ba9', medium: '#cddde5', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'hue-rotate(-23deg) saturate(23%) brightness(109%)' },
		{ key: 'watermelon', name: '수박', primary: '#27b300', medium: '#fed2d2', lightBase: '#FFFFFF', darkBase: '#151515', filter: 'hue-rotate(134deg) saturate(55%) brightness(110%)' },
		{ key: 'sweetpotato', name: '고구마', primary: '#992C66', medium: '#ffe642', lightBase: '#FFFFFF', darkBase: '#1A1A1A', filter: 'hue-rotate(-160deg) saturate(193%) brightness(113%)' },
		{ key: 'cottoncandy', name: '솜사탕', primary: '#33c2ff', medium: '#ffc2dc', lightBase: '#FFFFFF', darkBase: '#1A1A1A', filter: 'hue-rotate(105deg) saturate(86%) brightness(107%)' }
	];
	var PRESETS_BY_KEY = {};
	PRESETS.forEach(function (p) { PRESETS_BY_KEY[p.key] = p; });
	var DEFAULT_LIGHT_BASE = '#FFFFFF';
	var DEFAULT_DARK_BASE = '#1A1A1A';

	// lightBase/darkBase are compared per-preset (not against the global DEFAULT_LIGHT_BASE/
	// DEFAULT_DARK_BASE) now that each preset carries its own hand-tuned base pair.
	function matchPreset(inputs) {
		for (var i = 0; i < PRESETS.length; i++) {
			var p = PRESETS[i];
			if (p.primary.toLowerCase() === inputs.primary.toLowerCase() &&
				p.medium.toLowerCase() === inputs.medium.toLowerCase() &&
				p.lightBase.toLowerCase() === inputs.lightBase.toLowerCase() &&
				p.darkBase.toLowerCase() === inputs.darkBase.toLowerCase()) return p;
		}
		return null;
	}

	function wrap(res, source) { return { hex: res.hex, l: res.l, c: res.c, h: res.h, clamped: res.clamped, src: source }; }
	function wrapHex(hex, source) { var o = hexToOklch(hex); return { hex: hex, l: o.L, c: o.C, h: o.H, clamped: false, src: source }; }

	function genLight(inputs) {
		var oPrimary = hexToOklch(inputs.primary);
		var out = { clamped: false };
		out.primary = wrap(oklchToHex(oPrimary.L, oPrimary.C, oPrimary.H), '색깔 1');
		var pdRes = oklchToHex(oPrimary.L - CFG.l.primaryDark.dL, oPrimary.C < 0.01 ? 0 : oPrimary.C * CFG.l.primaryDark.kC, oPrimary.H);
		out.primaryDark = wrap(pdRes, '색깔 1 자동 보정(어둡게)');
		out.bgLight = wrapHex(inputs.lightBase, '밝은 색');
		out.bgMedium = wrapHex(inputs.medium, '색깔 2');
		var borderRes = mixOklab(out.bgLight.hex, out.bgMedium.hex, 1 - CFG.border.light);
		out.border = wrap(borderRes, '밝은 색↔색깔 2 보간');
		out.text = wrapHex(inputs.darkBase, '어두운 색');
		out.surface = wrap(mixOklab(out.bgLight.hex, '#FFFFFF', CFG.surface.toWhite), '밝은 색↔흰색 보정(버튼/입력 배경)');
		out.menuBtn = wrap(mixOklab(out.bgLight.hex, '#FFFFFF', CFG.menuBtn.toWhite), '밝은 색↔흰색 보정(kkutu-menu/raingame-strategy 버튼)');
		out.scrollTrack = wrap(mixOklab(inputs.lightBase, inputs.medium, CFG.scrollTrack.light), '밝은 색 80%+색깔 2 20%(스크롤바 트랙)');
		['primary', 'primaryDark', 'border', 'surface', 'menuBtn', 'scrollTrack'].forEach(function (k) { out.clamped = out.clamped || out[k].clamped; });
		return out;
	}

	function genDark(inputs) {
		var oPrimary = hexToOklch(inputs.primary);
		var oMedium = hexToOklch(inputs.medium);
		var neutralP = oPrimary.C < 0.01, neutralM = oMedium.C < 0.01;
		var out = { clamped: false };
		// 채도는 색깔 1의 라이트 모드 채도를 파랑 기준 대비 비율로 그대로 따라가고(진하면 다크도 진하게),
		// 명도는 다크 배경 가독성을 위한 고정 타깃을 기준으로 색깔 1의 명도 편차를 lFollow 비율만큼만
		// 끌어온다(완전히 따라가면 어두운 primary가 다크 배경에 묻혀 안 보이게 됨).
		var cRatio = neutralP ? 0 : oPrimary.C / BASE_PRIMARY.C;
		var lRatio = oPrimary.L / BASE_PRIMARY.L;
		var pC = neutralP ? 0 : clamp(CFG.d.primary.C * cRatio, 0, 0.2);
		var pL = clamp(CFG.d.primary.L * (1 + (lRatio - 1) * CFG.d.primary.lFollow), 0.6, 0.95);
		var pRes = oklchToHex(pL, pC, oPrimary.H);
		out.primary = wrap(pRes, '색깔 1 자동 보정(밝게)');
		var pdC = neutralP ? 0 : clamp(CFG.d.primaryDark.C * cRatio, 0, 0.22);
		var pdL = clamp(CFG.d.primaryDark.L * (1 + (lRatio - 1) * CFG.d.primaryDark.lFollow), 0.5, 0.95);
		var dRes = oklchToHex(pdL, pdC, oPrimary.H);
		out.primaryDark = wrap(dRes, '색깔 1 자동 보정(밝게)');
		out.bgLight = wrapHex(inputs.darkBase, '어두운 색');
		var bgMediumRes = oklchToHex(CFG.d.bgMedium.L, neutralM ? 0 : CFG.d.bgMedium.C, oMedium.H);
		out.bgMedium = wrap(bgMediumRes, '색깔 2 자동 보정(어둡게)');
		// bg-medium is deliberately near-black in dark mode (used as a "pressed" background elsewhere),
		// so mixing straight toward it makes the border barely lighter than -- sometimes even darker
		// than -- bgLight, reading as "no border at all". Take the mix's hue/chroma (theme color) but
		// force L to sit clearly above bgLight's so the border is always visibly brighter than the page.
		var borderMix = hexToOklch(mixOklab(out.bgLight.hex, out.bgMedium.hex, 1 - CFG.border.dark).hex);
		var borderRes = oklchToHex(clamp(out.bgLight.l + CFG.border.darkLift, 0, 0.95), borderMix.C, borderMix.H);
		out.border = wrap(borderRes, '어두운 색보다 밝게(색상은 bg-medium 보간에서)');
		out.text = wrapHex(inputs.lightBase, '밝은 색');
		out.surface = wrap(mixOklab(out.bgLight.hex, '#FFFFFF', CFG.surface.toWhite), '어두운 색↔흰색 보정(버튼/입력 배경)');
		out.menuBtn = wrap(mixOklab(out.bgLight.hex, '#000000', CFG.menuBtn.toBlack), '어두운 색↔검정 보정(kkutu-menu/raingame-strategy 버튼)');
		out.scrollTrack = wrap(mixOklab(inputs.darkBase, inputs.lightBase, CFG.scrollTrack.dark), '어두운 색 80%+밝은 색 20%(스크롤바 트랙)');
		['primary', 'primaryDark', 'border', 'surface', 'menuBtn', 'scrollTrack'].forEach(function (k) { out.clamped = out.clamped || out[k].clamped; });
		return out;
	}

	var BASE_PRIMARY = hexToOklch('#1976D2');
	var BASE_MEDIUM = hexToOklch('#90CAF9');

	/* CSS hue-rotate() isn't a hue-space rotation, it's a fixed 3x3 matrix (NTSC-luma-based) applied
	   to raw sRGB. So "hue-rotate degrees needed" can't be read off as an OKLCH hue difference -- it
	   has to be solved for: apply the real matrix to the actual pixel color being filtered and see
	   what hue comes out. BASE_IMAGE_RGB is the dominant sampled pixel color of in_kkutu.css's
	   #Intro img / .GameBox background art (gamebg.png/intro.png, both ~#7EB2F6/#5A98EC, OKLCH
	   H=255deg) -- i.e. the color that's actually being rotated in the browser. */
	var BASE_IMAGE_RGB = hexToRgb('#7EB2F6');
	// SVG/CSS filter luma weights (the same 0.213/0.715/0.072 constants the hue-rotate matrix above
	// reduces to at full desaturation) -- hue-rotate() and saturate() both preserve this luma exactly,
	// so brightness() alone determines the final tile luma regardless of the hue/saturate chosen.
	function gammaLuma(rgb) { return 0.213 * rgb[0] + 0.715 * rgb[1] + 0.072 * rgb[2]; }
	var BASE_IMAGE_LUMA = gammaLuma(BASE_IMAGE_RGB);

	function hueRotateMatrix(deg) {
		var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
		return [
			[0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
			[0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283],
			[0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072]
		];
	}
	function applyColorMatrix(m, rgb) {
		return [
			m[0][0] * rgb[0] + m[0][1] * rgb[1] + m[0][2] * rgb[2],
			m[1][0] * rgb[0] + m[1][1] * rgb[1] + m[1][2] * rgb[2],
			m[2][0] * rgb[0] + m[2][1] * rgb[1] + m[2][2] * rgb[2]
		];
	}
	function oklchOfRgb01(rgb) {
		var lin = rgb.map(function (c) { return srgbToLinear(Math.max(0, Math.min(1, c))); });
		var lab = linearRgbToOklab(lin[0], lin[1], lin[2]);
		var C = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
		var H = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (H < 0) H += 360;
		return { L: lab[0], C: C, H: H };
	}

	// numerically solves for the hue-rotate() angle that turns BASE_IMAGE_RGB into targetHue: scan
	// for the bracket where the (circular) hue error changes sign, then bisect it down.
	function solveHueRotateDeg(targetHue) {
		function hueErr(deg) { return normHue(oklchOfRgb01(applyColorMatrix(hueRotateMatrix(deg), BASE_IMAGE_RGB)).H - targetHue); }
		var STEPS = 72, prevDeg = -180, prevErr = hueErr(-180);
		for (var i = 1; i <= STEPS; i++) {
			var deg = -180 + 360 * i / STEPS, err = hueErr(deg);
			if ((prevErr < 0) !== (err < 0) && Math.abs(prevErr - err) < 180) {
				var lo = prevDeg, hi = deg, loErr = prevErr;
				for (var j = 0; j < 40; j++) {
					var mid = (lo + hi) / 2, midErr = hueErr(mid);
					if ((loErr < 0) !== (midErr < 0)) hi = mid; else { lo = mid; loErr = midErr; }
				}
				return (lo + hi) / 2;
			}
			prevDeg = deg; prevErr = err;
		}
		return 0;
	}

	// intro/GameBox filter is driven entirely by 색깔 2(medium) -- hue from border (bgLight+medium
	// blend), saturate/brightness from medium's own chroma/lightness. 색깔 1(primary) has no input
	// here at all: it used to gate/set saturate+brightness, which meant e.g. an achromatic (white/
	// black) primary forced a flat saturate(0) regardless of medium, and any primary lightness
	// change visibly dimmed/brightened the intro image even with medium held fixed.
	function genFilter(borderHex, mediumHex) {
		var oBorder = hexToOklch(borderHex);
		var oMedium = hexToOklch(mediumHex);
		if (oMedium.C < 0.01) { return { css: 'saturate(0)' }; }
		var hue = solveHueRotateDeg(oBorder.H);
		var sat = clamp(oMedium.C / BASE_MEDIUM.C * 100, 0, CFG.f.satMax);
		var bri = clamp(oMedium.L / BASE_MEDIUM.L * 100, CFG.f.briMin, CFG.f.briMax);
		var parts = [];
		if (Math.abs(hue) > 1) parts.push('hue-rotate(' + hue.toFixed(0) + 'deg)');
		if (Math.abs(sat - 100) > 1) parts.push('saturate(' + sat.toFixed(0) + '%)');
		if (Math.abs(bri - 100) > 1) parts.push('brightness(' + bri.toFixed(0) + '%)');
		return { css: parts.length ? parts.join(' ') : 'none' };
	}

	function computeFilter(inputs, light) {
		var preset = matchPreset(inputs);
		if (preset) return { css: preset.filter, src: '실측값 (프리셋)' };
		var f = genFilter(light.border.hex, light.bgMedium.hex);
		f.src = '근사 공식';
		return f;
	}

	/* 다크 모드 GameBox/Intro 타일 필터: 어두운 색(darkBase, 다크 모드의 실제 페이지 배경색)을 그대로
	   따라간다 -- 무채색이면(기본 프리셋들처럼) 예전 하드코딩 규칙과 거의 같은 결과(회색조+어둡게)가
	   나오고, 사용자가 유채색 어두운 색을 고르면 그 색상으로 물든 어두운 타일이 나온다. */
	function genFilterDark(darkHex) {
		var oDark = hexToOklch(darkHex);
		var targetLuma = clamp(gammaLuma(hexToRgb(darkHex)) * CFG.fd.k, 0.02, 0.5);
		var bri = clamp(targetLuma / BASE_IMAGE_LUMA * 100, CFG.fd.briMin, CFG.fd.briMax);
		if (oDark.C < 0.01) {
			return { css: 'saturate(0) brightness(' + bri.toFixed(0) + '%)', src: '근사 공식(무채색)' };
		}
		var hue = solveHueRotateDeg(oDark.H);
		var sat = clamp(oDark.C / CFG.fd.refC * 100, 0, CFG.fd.satMax);
		var parts = [];
		if (Math.abs(hue) > 1) parts.push('hue-rotate(' + hue.toFixed(0) + 'deg)');
		if (Math.abs(sat - 100) > 1) parts.push('saturate(' + sat.toFixed(0) + '%)');
		parts.push('brightness(' + bri.toFixed(0) + '%)');
		return { css: parts.join(' '), src: '근사 공식' };
	}

	function computeFilterDark(inputs) {
		return genFilterDark(inputs.darkBase);
	}

	/* ---------- WCAG contrast ---------- */
	function relLuminance(hex) {
		var rgb = hexToRgb(hex).map(function (c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
		return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
	}
	function contrastRatio(hexA, hexB) {
		var La = relLuminance(hexA) + 0.05, Lb = relLuminance(hexB) + 0.05;
		return La > Lb ? La / Lb : Lb / La;
	}

	/* 확인 시 호출: 핵심 색 조합의 대비가 너무 낮으면(거의 안 보이는 수준) 경고 대상 목록을 반환.
	   빈 배열이면 문제 없음. 강제 차단이 아니라 경고용이므로 임계값은 보수적으로 낮게 잡는다. */
	var MIN_CONTRAST = 2.2;
	function checkContrast(inputs) {
		var light = genLight(inputs), dark = genDark(inputs);
		var problems = [];
		function check(mode, label, a, b) {
			var ratio = contrastRatio(a, b);
			if (ratio < MIN_CONTRAST) problems.push({ mode: mode, label: label, ratio: ratio });
		}
		check('light', '글씨/배경', light.text.hex, light.bgLight.hex);
		check('light', '글씨/버튼', light.text.hex, light.surface.hex);
		check('dark', '글씨/배경', dark.text.hex, dark.bgLight.hex);
		check('dark', '글씨/버튼', dark.text.hex, dark.surface.hex);
		return problems;
	}

	/* ---------- Hangul theme code (100 bits = 4 colors x (24-bit RGB + 1 parity) = 10 syllables x 10 bits) ---------- */
	var INITIAL_MAP = [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18, 1, 10]; // custom idx(0-15) -> standard initial idx(0-18)
	var VOWEL_MAP = [0, 4, 8, 13, 18, 20, 5, 16]; // custom idx(0-7) -> standard medial idx(0-20)
	var FINAL_MAP = [0, 1, 4, 8, 16, 17, 19, 21]; // custom idx(0-7) -> standard final idx(0-27)

	function intToBits(n, width) {
		var bits = [];
		for (var i = width - 1; i >= 0; i--) bits.push((n >> i) & 1);
		return bits;
	}
	function bitsToInt(bits) {
		var n = 0;
		for (var i = 0; i < bits.length; i++) n = (n << 1) | bits[i];
		return n;
	}
	function colorToBits24(hex) {
		hex = hex.replace('#', '');
		if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
		var n = parseInt(hex, 16);
		return intToBits(n, 24);
	}
	function bitsToColorHex(bits24) {
		var n = bitsToInt(bits24);
		var s = n.toString(16);
		while (s.length < 6) s = '0' + s;
		return '#' + s.toUpperCase();
	}
	function sum(bits) { var s = 0; for (var i = 0; i < bits.length; i++) s += bits[i]; return s; }

	function encodeThemeCode(colors) {
		// colors: [primary, medium, lightBase, darkBase] hex strings
		var bits = [];
		colors.forEach(function (hex) {
			var b = colorToBits24(hex);
			var parity = sum(b) % 2;
			bits = bits.concat(b);
			bits.push(parity);
		});
		var chars = [];
		for (var i = 0; i < 10; i++) {
			var chunk = bits.slice(i * 10, i * 10 + 10);
			var initIdx = bitsToInt(chunk.slice(0, 4));
			var vowIdx = bitsToInt(chunk.slice(4, 7));
			var finIdx = bitsToInt(chunk.slice(7, 10));
			var stdInit = INITIAL_MAP[initIdx], stdVow = VOWEL_MAP[vowIdx], stdFin = FINAL_MAP[finIdx];
			var cp = 0xAC00 + (stdInit * 21 + stdVow) * 28 + stdFin;
			chars.push(String.fromCharCode(cp));
		}
		return chars.join('');
	}

	function decodeThemeCode(code) {
		if (typeof code !== 'string') return null;
		code = code.trim();
		if (code.length !== 10) return null;
		var bits = [];
		for (var i = 0; i < 10; i++) {
			var cp = code.charCodeAt(i);
			if (cp < 0xAC00 || cp > 0xD7A3) return null;
			var off = cp - 0xAC00;
			var stdFin = off % 28; off = (off - stdFin) / 28;
			var stdVow = off % 21; var stdInit = (off - stdVow) / 21;
			var initIdx = INITIAL_MAP.indexOf(stdInit);
			var vowIdx = VOWEL_MAP.indexOf(stdVow);
			var finIdx = FINAL_MAP.indexOf(stdFin);
			if (initIdx === -1 || vowIdx === -1 || finIdx === -1) return null;
			bits = bits.concat(intToBits(initIdx, 4), intToBits(vowIdx, 3), intToBits(finIdx, 3));
		}
		var colors = [];
		for (var c = 0; c < 4; c++) {
			var chunk = bits.slice(c * 25, c * 25 + 25);
			var colorBits = chunk.slice(0, 24), parityBit = chunk[24];
			if (sum(colorBits) % 2 !== parityBit) return null; // corrupted code
			colors.push(bitsToColorHex(colorBits));
		}
		return { primary: colors[0], medium: colors[1], lightBase: colors[2], darkBase: colors[3] };
	}

	/* ---------- localStorage + apply ---------- */
	function loadVolumeSettings() {
		try {
			return JSON.parse(global.localStorage.getItem('kkutu_volume')) || {};
		} catch (e) {
			return {};
		}
	}
	function isDarkActive(darkModeSetting) {
		return darkModeSetting === 'dark' || (darkModeSetting === 'system' && global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
	}
	function baseColorsFor(themeName) {
		if (themeName === 'custom') {
			var saved = loadVolumeSettings().customTheme;
			if (saved && saved.primary && saved.medium && saved.lightBase && saved.darkBase) return saved;
			themeName = 'blue';
		}
		var preset = PRESETS_BY_KEY[themeName] || PRESETS_BY_KEY.blue;
		return { primary: preset.primary, medium: preset.medium, lightBase: preset.lightBase, darkBase: preset.darkBase };
	}

	var THEME_CLASSES = ['theme-grape', 'theme-green', 'theme-yellow', 'theme-orange', 'theme-red', 'theme-gray', 'theme-slate', 'theme-watermelon', 'theme-sweetpotato', 'theme-cottoncandy', 'theme-custom'];

	// single source of truth for theme/dark-mode application: toggles both the theme-*/dark-mode
	// classes (still needed for the many rules that aren't driven by --color-*/--theme-* vars, e.g.
	// #Top's image-vs-solid-color swap) and computes+injects the CSS custom properties. Called from
	// body.js's applyTheme/applyDarkMode (game page) and directly from layout.pug/m_layout.pug's
	// synchronous bootstrap script (every page, including the portal/main screen), so this is the
	// only place that needs to know how theme selection maps to visible output.
	function apply(themeName, darkModeSetting) {
		themeName = themeName || 'blue';
		var inputs = baseColorsFor(themeName);
		var dark = isDarkActive(darkModeSetting);
		var light = genLight(inputs);
		var g = dark ? genDark(inputs) : light;
		var f = computeFilter(inputs, light);
		var fd = computeFilterDark(inputs);

		var body = global.document.body;
		var cl = body.classList;
		THEME_CLASSES.forEach(function (c) { cl.remove(c); });
		if (themeName === 'custom') cl.add('theme-custom');
		else if (themeName !== 'blue' && PRESETS_BY_KEY[themeName]) cl.add('theme-' + themeName);
		if (dark) cl.add('dark-mode'); else cl.remove('dark-mode');

		var b = body.style;
		b.setProperty('--color-primary', g.primary.hex);
		b.setProperty('--color-primary-dark', g.primaryDark.hex);
		b.setProperty('--color-bg-light', g.bgLight.hex);
		b.setProperty('--color-bg-medium', g.bgMedium.hex);
		b.setProperty('--color-border', g.border.hex);
		b.setProperty('--theme-text', g.text.hex);
		b.setProperty('--theme-surface', g.surface.hex);
		b.setProperty('--theme-menu-btn', g.menuBtn.hex);
		b.setProperty('--theme-menu-btn-rgb', hexToRgb(g.menuBtn.hex).map(function (c) { return Math.round(c * 255); }).join(', '));
		b.setProperty('--theme-scrollbar-track', g.scrollTrack.hex);
		b.setProperty('--theme-filter', f.css);
		b.setProperty('--theme-filter-dark', fd.css);
		return g;
	}

	global.ThemeEngine = {
		PRESETS: PRESETS,
		PRESETS_BY_KEY: PRESETS_BY_KEY,
		DEFAULT_LIGHT_BASE: DEFAULT_LIGHT_BASE,
		DEFAULT_DARK_BASE: DEFAULT_DARK_BASE,
		hexToOklch: hexToOklch,
		mixOklab: mixOklab,
		genLight: genLight,
		genDark: genDark,
		computeFilter: computeFilter,
		computeFilterDark: computeFilterDark,
		matchPreset: matchPreset,
		contrastRatio: contrastRatio,
		checkContrast: checkContrast,
		encodeThemeCode: encodeThemeCode,
		decodeThemeCode: decodeThemeCode,
		baseColorsFor: baseColorsFor,
		isDarkActive: isDarkActive,
		apply: apply
	};
})(typeof window !== 'undefined' ? window : this);
