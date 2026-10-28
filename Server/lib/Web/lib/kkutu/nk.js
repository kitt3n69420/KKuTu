/**
 * 새로운 끄투, 새로운 시작 — 신 UI.
 *
 * html[data-ui="new"]일 때만 동작하고(kkutu.pug의 Preload 스크립트가 설정), 기본 UI에서는 아무것도 하지 않음.
 * 번들(IIFE) 안에 들어가므로 $data, $stage, L 등 번들 내부 변수를 그대로 씀.
 * uglify-js 2.8로 압축되므로 ES5 문법만 사용할 것.
 *
 * 1단계: 틀(헤더·탭·계정·공지·슬롯) + 기존 패널을 슬롯으로 옮김 + 신 UI 색 계산.
 * 2단계: 동작 줄, 방 카드·검색·필터·정렬, [접속자 | 친구] 탭. body.js의 roomListBar/userListBar 등이 신 UI일 때 여기로 넘김.
 * 3단계: 방 대기 화면 — 방 머리, 플레이어 카드 상태·빈자리, 준비 인원. 카드·팀 선택은 기존 DOM을 CSS로 다시 입힘.
 * 기존 버튼(#ShopBtn 등)은 숨긴 채 DOM에 남겨 두고, 신 UI는 그 버튼을 trigger만 함 → 기존 로직 재사용.
 */
var NK = (function () {
	var my = {};
	var root = document.documentElement;

	my.active = root.getAttribute('data-ui') === 'new';
	// 휴대폰 = 모바일 화면(m_kkutu.pug)이 Preload에서 표시함. 배치는 nk.css 15), 동작은 아래 "휴대폰" 부분
	my.phone = my.active && root.getAttribute('data-nk-device') === 'phone';
	// 터치 위주 기기 = 휴대폰, 또는 마우스를 올릴 수 없는 기기(PC 화면을 받는 태블릿, M7) — 툴팁을 눌러서 봄
	my.touch = my.phone || !!(window.matchMedia && window.matchMedia('(hover: none)').matches);

	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

	/* ------------------------------------------------------------------
	   색 — 테마 엔진 결과(--color-*)에서 신 UI 보조 색을 파생
	   ------------------------------------------------------------------ */
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
		var dh, accent2, white, black, second, ink, L, i;
		var b = document.body.style;

		// 장식용 그라데이션 끝색: 색깔 2의 색상(hue), 색깔 1과 25° 이내면 30°로 벌림
		dh = ((m.C >= 0.03 ? m.H : p.H + 35) - p.H + 540) % 360 - 180;
		if (Math.abs(dh) < 25) dh = (dh >= 0 ? 1 : -1) * 30;
		accent2 = oklchToHex(dark ? clamp(p.L - 0.05, 0.55, 0.9) : clamp(p.L + 0.07, 0.42, 0.78), neutral ? 0 : clamp(Math.max(m.C, p.C * 0.9), 0.05, 0.19), p.H + dh);
		// 강조 배경 위 글자: 버튼 글자는 굵은 15px 이상(큰 글자 기준 3:1)이라 흰 글자가 3:1을 넘으면 흰색 우선
		white = TE.contrastRatio('#FFFFFF', g.primary.hex);
		black = TE.contrastRatio('#141414', g.primary.hex);
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
	// 번들은 <head>에서 실행되므로, layout.pug의 첫 테마 적용(body 시작 직후)보다 먼저 감쌀 수 있음 → 깜빡임 없음
	if (my.active && window.ThemeEngine) {
		var _themeApply = window.ThemeEngine.apply;
		window.ThemeEngine.apply = function (themeName, darkSetting) {
			var g = _themeApply.apply(this, arguments);
			try { applyColors(themeName || 'blue', darkSetting || 'light', g); } catch (e) { }
			return g;
		};
	}

	/* ------------------------------------------------------------------
	   공용 조각
	   ------------------------------------------------------------------ */
	function ico(id) { return '<svg class="nk-i"><use href="#nk-i-' + id + '"/></svg>'; }
	function text(key) { return (window.L && L[key] !== undefined) ? L[key] : key; }
	// div로 만든 카드도 키보드로 쓸 수 있게: 포커스된 상태에서 Enter·Space = 클릭 (안쪽 버튼에서 누른 키는 제외)
	function keyClick($el) {
		return $el.on('keydown', function (e) {
			if (e.target !== e.currentTarget || (e.which !== 13 && e.which !== 32)) return;
			e.preventDefault();
			$el.trigger('click');
		});
	}

	/* ------------------------------------------------------------------
	   상단 탭 레지스트리 — 새 기능은 NK.registerTab 한 번으로 탭에 추가됨.
	   o = { id, icon, labelKey, order, places: ['for-lobby', ...](생략 시 모든 상태), isActive(only), run(), avail() }
	   places에 없는 상태에서는 숨기지 않고 비활성으로 둠(탭 위치가 흔들리지 않도록).
	   avail()이 false면 아예 그리지 않음 — 화면에 그 기능이 없을 때(예: 모바일 화면에는 리플레이 단추가 없음)
	   ------------------------------------------------------------------ */
	var tabs = [];
	my.registerTab = function (o) {
		tabs.push(o);
		tabs.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
		if (my._inited) renderNav();
	};
	function tabEnabled(t) { return !t.places || t.places.indexOf(my._only) !== -1; }

	// updateUI는 방 하나만 바뀌어도 불리므로, 탭·동작 줄·계정은 바뀐 게 있을 때만 다시 그림 (방이 수백 개일 때 비용 절약)
	function renderNav() {
		if (my.phone) renderTabbar();
		var sig = my._only + "|" + !!$data._shop + "|" + tabs.map(function (t) { return t.id + !!(t.isActive && t.isActive(my._only)) + tabEnabled(t); }).join(",");
		var $nav;

		if (sig === my._navSig) return;
		my._navSig = sig;
		$nav = $("#nk-nav").empty();
		tabs.forEach(function (t) {
			if (t.avail && !t.avail()) return;
			var on = t.isActive ? t.isActive(my._only) : false;
			var $t = $("<button type='button'>").addClass("nk-tab").attr('data-nk-tab', t.id)
				.toggleClass("active", !!on).toggleClass("disabled", !tabEnabled(t))
				.html(ico(t.icon) + "<label></label>" + (t.dot ? "<div class='nk-dot-new'></div>" : ""));

			$t.children("label").attr('data-lang-key', t.labelKey).text(text(t.labelKey));
			$t.on('click', function () { runTab(t); });
			$nav.append($t);
		});
		$nav.append($("<button type='button'>").addClass("nk-tab nk-more").attr('id', "nk-more")
			.html(ico('more') + "<label data-lang-key='nkMore'></label>")
			.on('click', function (e) { openMore(e.currentTarget); }));
		$("#nk-more label").text(text('nkMore'));
		layoutNav();
	}
	function runTab(t) {
		closePop();
		if (!tabEnabled(t)) return;
		t.run();
	}
	// 넘치는 탭은 뒤에서부터 더보기로 — 기능이 늘어도 한 줄 유지
	function layoutNav() {
		var nav = document.getElementById("nk-nav");
		var $tabs, more, i;

		if (!nav) return;
		$tabs = $(nav).children(".nk-tab").not(".nk-more").removeClass("is-overflow");
		more = document.getElementById("nk-more");
		more.style.display = 'none';
		if (nav.scrollWidth <= nav.clientWidth) return;
		more.style.display = '';
		for (i = $tabs.length - 1; i >= 0 && nav.scrollWidth > nav.clientWidth; i--) {
			if ($tabs.eq(i).hasClass("active")) continue;
			$tabs.eq(i).addClass("is-overflow");
		}
	}
	function openMore(anchor) {
		var items = [];

		if (my._pop) return closePop();
		$("#nk-nav .nk-tab.is-overflow").each(function () {
			var id = $(this).attr('data-nk-tab');
			tabs.forEach(function (t) {
				if (t.id === id) items.push({ icon: t.icon, labelKey: t.labelKey, disabled: !tabEnabled(t), run: function () { runTab(t); } });
			});
		});
		openPop(anchor, items, 'right');
	}

	/* ------------------------------------------------------------------
	   공용 툴팁 — 방 카드는 성능을 위해 content-visibility를 쓰는데, 그러면 안쪽의 기존 .expl(position: fixed)
	   기준이 카드로 바뀌어 엉뚱한 곳에 뜸. 그래서 카드 안 툴팁은 body에 하나 둔 이 툴팁을 씀.
	   쓰는 법: 요소에 tip(el, [줄, 줄...] 또는 { title, lines }) — 마우스를 올리면 마우스 옆에 표시
	   ------------------------------------------------------------------ */
	var $tip;
	function tip($el, content) { return $el.attr('data-nk-tip', "").data('nkTip', content); }
	function tipMove(e) {
		if (!$tip) return;
		$tip.css({
			left: Math.min(e.clientX + 5, window.innerWidth - $tip.outerWidth() - 12),
			top: Math.min(e.clientY + 23, window.innerHeight - $tip.outerHeight() - 12)
		});
	}
	function tipFill(c) {
		$tip = $tip || $("<div>").addClass("nk-tip").appendTo("body");
		$tip.empty();
		if (c.title) $tip.append($("<div>").addClass("nk-tip-title").text(c.title));
		$tip.append($("<div>").addClass("nk-tip-body").append((c.lines || c).map(function (l) { return $("<div>").text(l); })));
		// 고른 주제(게임 화면 상단 바): 규칙 아래에 제목과 함께 한 묶음 더
		if (c.topics && c.topics.length) $tip.append($("<div>").addClass("nk-tip-title").text(L['pickTopicTitle']))
			.append($("<div>").addClass("nk-tip-body").append(c.topics.map(function (l) { return $("<div>").text(l); })));
		$tip.show();
	}
	function tipShow(e) {
		var c = $(e.currentTarget).data('nkTip');

		if (!c) return;
		tipFill(c);
		tipMove(e);
	}
	function tipHide() { if ($tip) $tip.hide(); }
	// 휴대폰: 마우스를 올리는 대신 눌러서 보는 말풍선 — 가려진 규칙(+N) 등을 모두 볼 수 있게 (사용자 요청).
	// 누른 요소 아래(자리가 없으면 위)에 뜨고, 같은 요소를 다시 누르거나 다른 곳을 누르면·스크롤하면 닫힘
	function tapTip(e) {
		var el = e.currentTarget, c = $(el).data('nkTip'), r, w, h, top;

		if (!c) return;
		if (my._tipOwner === el) return tapTipHide();
		tipFill(c);
		my._tipOwner = el;
		r = el.getBoundingClientRect();
		w = $tip.outerWidth();
		h = $tip.outerHeight();
		top = r.bottom + 6;
		if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
		$tip.css({ left: clamp(r.left, 8, window.innerWidth - w - 8), top: top });
	}
	function tapTipHide() {
		my._tipOwner = null;
		tipHide();
	}

	/* ------------------------------------------------------------------
	   팝오버 메뉴
	   ------------------------------------------------------------------ */
	function closePop() {
		if (my._pop) my._pop.remove();
		my._pop = null;
		$(document).off('mousedown.nkpop');
	}
	function openPop(anchor, items, align) {
		var $p = $("<div>").addClass("nk-pop");
		var r, w;

		closePop();
		items.forEach(function (it) {
			var $it;

			if (it.sep) return $p.append($("<div>").css({ height: 1, margin: "6px 4px", background: "var(--nk-line)" }));
			if (it.node) return $p.append(it.node);
			$it = $("<button type='button'>").addClass("nk-menu-item").toggleClass("disabled", !!it.disabled)
				.html(ico(it.icon) + "<label></label>");
			$it.children("label").text(text(it.labelKey));
			$it.on('click', function () {
				if (it.disabled) return;
				closePop();
				it.run();
			});
			$p.append($it);
		});
		$("body").append($p);
		r = anchor.getBoundingClientRect();
		w = $p.outerWidth();
		$p.css({ top: r.bottom + 6, left: Math.max(8, align === 'right' ? r.right - w : r.left) });
		my._pop = $p;
		$(document).on('mousedown.nkpop', function (e) {
			if (!$(e.target).closest(".nk-pop, #nk-more, #nk-account").length) closePop();
		});
	}

	/* ------------------------------------------------------------------
	   계정 (기존 내 정보 패널 대체)
	   ------------------------------------------------------------------ */
	my.renderAccount = function () {
		var me = $data.users && $data.users[$data.id];
		var lv, prev, goal, pct, $a, $ava, $m;

		if (!my._inited || !me) return;
		lv = JSON.stringify([me.data.score, me.money, me.equip, getDisplayName(me), L['LEVEL']]);
		if (lv === my._accSig) return;
		my._accSig = lv;
		renderShopMoney();
		lv = getLevel(me.data.score);
		prev = EXP[lv - 2] || 0;
		goal = EXP[lv - 1];
		pct = clamp((me.data.score - prev) / (goal - prev) * 100, 0, 100);
		$a = $("#nk-account").empty();
		$ava = $("<div>").addClass("nk-ava").css({ width: 36, height: 36 });
		$m = $("<div>").addClass("moremi");
		$ava.append($m);
		renderMoremi($m, me.equip);
		$a.append($ava).append($("<div>").addClass("nk-account-text")
			.append($("<div>").addClass("nk-account-name")
				.append(getLevelImage(me.data.score).addClass("nk-lv").css({ 'float': "none", width: 15, height: 15, flex: "none" }))
				.append($("<div>").text(getDisplayName(me))))
			.append($("<div>").addClass("nk-account-sub")
				.append($("<div>").text(L['LEVEL'] + " " + lv))
				.append($("<div>").addClass("nk-mini-bar").append($("<div>").css('width', pct + "%")))
				.append($("<div>").text(commify(me.money) + L['ping'])))
		).append(ico('chev'));
	};
	function accountHead() {
		var me = $data.users && $data.users[$data.id];

		if (!me) return null;
		return $("<div>").addClass("nk-pop-head").append($("#nk-account .nk-account-text").clone());
	}
	function openAccount(anchor) {
		var head = my.phone && accountHead();

		if (my._pop) return closePop();
		openPop(anchor, (head ? [{ node: head }, { sep: true }] : []).concat([
			{ icon: 'user', labelKey: 'nkMyProfile', run: function () { requestProfile($data.id); } },
			{ icon: 'shirt', labelKey: 'dress', disabled: $data._gaming, run: function () { $stage.dialog.profileDress.trigger('click'); } },
			{ icon: 'heart', labelKey: 'nkFriends', run: function () { $stage.menu.community.trigger('click'); } },
			{ sep: true },
			{ icon: 'sliders', labelKey: 'nkSettings', run: function () { $stage.menu.setting.trigger('click'); } },
			{ icon: 'layout', labelKey: 'nkToClassic', run: function () { saveVolumeSettings({ ui: 'classic' }); location.reload(); } },
			{ sep: true },
			// 기존 #account-info 클릭이 손님이면 로그인, 회원이면 로그아웃을 함 (global.js)
			$data.guest
				? { icon: 'login', labelKey: 'LOGIN', run: function () { $("#account-info").trigger('click'); } }
				: { icon: 'logout', labelKey: 'nkLogout', run: function () { $("#account-info").trigger('click'); } }
		]), 'right');
	}

	/* ------------------------------------------------------------------
	   기본 탭 — 기존 버튼을 trigger해서 기존 로직을 그대로 씀
	   ------------------------------------------------------------------ */
	function inPlay(only) { return only !== 'for-lobby' || (!$data._shop && !my._page); }
	function pageTab(id) { return function (only) { return only === 'for-lobby' && my._page === id; }; }
	my.registerTab({ id: 'lobby', icon: 'home', labelKey: 'nkLobby', order: 10, isActive: inPlay,
		run: function () {
			if (my._only !== 'for-lobby') return;
			if (my._page) closePage();
			else if ($data._shop) $stage.menu.shop.trigger('click');
		} });
	my.registerTab({ id: 'shop', icon: 'bag', labelKey: 'shop', order: 20, places: ['for-lobby'],
		isActive: function (only) { return only === 'for-lobby' && !!$data._shop; },
		run: function () {
			my._page = null;
			if (!$data._shop) $stage.menu.shop.trigger('click');
		} });
	// 사전: 로비에서는 가운데 화면(뜻풀이 + 단어 찾기), 방·게임에서는 기존 작은 사전 창
	my.registerTab({ id: 'dict', icon: 'book', labelKey: 'dict', order: 30, isActive: pageTab('dict'),
		run: function () {
			if (my._only === 'for-lobby') openPage('dict');
			else $stage.menu.dict.trigger('click');
		} });
	my.registerTab({ id: 'rank', icon: 'trophy', labelKey: 'nkRank', order: 40, places: ['for-lobby'], isActive: pageTab('rank'), run: function () { openPage('rank'); } });
	my.registerTab({ id: 'replay', icon: 'replay', labelKey: 'replay', order: 50, places: ['for-lobby'], avail: function () { return $stage.menu.replay.length > 0; }, run: function () { $stage.menu.replay.trigger('click'); } });
	my.registerTab({ id: 'event', icon: 'gift', labelKey: 'nkEvent', order: 60, places: ['for-lobby'], run: function () { $stage.menu.exchange.trigger('click'); } });
	// 도움말: 로비에서는 가운데 전체 화면(목차 + 본문), 방·게임에서는 기존 도움말 창 그대로
	my.registerTab({ id: 'help', icon: 'help', labelKey: 'nkHelp', order: 90, isActive: pageTab('help'),
		run: function () {
			if (my._only === 'for-lobby') openPage('help');
			else $stage.menu.help.trigger('click');
		} });

	/* ------------------------------------------------------------------
	   로비 가운데 화면 (랭킹·도움말) — 상점처럼 방 목록 자리를 차지함. 패널은 kkutu_nk.pug의 .nk-page.
	   updateUI가 방 목록을 다시 보이게 해도 onState에서 다시 가림. 로비를 벗어나면 닫힘
	   ------------------------------------------------------------------ */
	var PAGES = {
		rank: function () {
			// 기존 랭킹 단추 처리와 같은 요청 (탭·페이지 단추는 기존 처리 그대로)
			$data._lbpage = 0;
			$.get("/ranking?type=" + ($data._lbtype || 'exp'), function (res) { drawLeaderboard(res); });
		},
		help: function () {
			if (!HELP.state) loadHelp();
		},
		dict: function () {}
	};
	my._page = null;
	function openPage(id) {
		// 로비 전용 화면 — 게임·리플레이 중에는 막음 (사용자 요청)
		if (my._only !== 'for-lobby') return showAlert(text('error_438'));
		// 상점을 닫는 것은 기존 상점 단추 처리로 (updateUI까지 거침)
		if ($data._shop) $stage.menu.shop.trigger('click');
		my._page = id;
		PAGES[id]();
		applyPage();
		renderNav();
	}
	function closePage() {
		my._page = null;
		applyPage();
		renderNav();
	}
	function applyPage() {
		if (my._only !== 'for-lobby') my._page = null;
		$("#nk-center-body > .nk-page").each(function () { $(this).toggle($(this).attr('data-page') === my._page); });
		if (my._only !== 'for-lobby') return;
		$stage.box.roomList.toggle(!my._page && !$data._shop);
		$stage.box.shop.toggle(!my._page && !!$data._shop);
	}
	function initRank() {
		$("#nk-rank-tabs").append($stage.dialog.lbTabs.addClass("nk-seg-btn"));
		$("#nk-rank-body").append($("#ranking"));
		$("#nk-rank-foot").append(
			$stage.dialog.lbMe.addClass("nk-btn"),
			$("<div>").addClass("nk-spacer"),
			$stage.dialog.lbPrev.addClass("nk-btn"),
			$stage.dialog.lbPage,
			$stage.dialog.lbNext.addClass("nk-btn"));
	}
	/* ------------------------------------------------------------------
	   도움말 화면 (로비) — 기존 도움말 페이지(/help)의 목차(#list)와 본문(.page-body)을 그대로 가져와 신 UI로 그림.
	   항목 번호(c1, c1p2 …)는 기존 도움말 스크립트(in_game_kkutu_help.js)와 같은 규칙. 스크립트는 실행하지 않음(DOMParser)
	   본문은 고른 것 하나만 화면에 넣음 (동영상 iframe 등이 미리 불러와지지 않게)
	   ------------------------------------------------------------------ */
	var HELP = { state: 0, pages: {}, order: [], titles: {}, path: {}, cur: null };
	function loadHelp() {
		HELP.state = 1;
		$("#nk-help-page").empty().append($("<div>").addClass("nk-help-msg").text(text('nkHelpLoading')));
		$.get("/help", function (html) {
			var doc = new DOMParser().parseFromString(html, "text/html");
			var list = doc.getElementById("list");
			var lp;

			if (!list) return helpFail();
			$(doc).find("script").remove();
			$(list).children("li").each(function (i) {
				var p = "c" + (i + 1);

				$(this).attr('id', p).find("li").each(function (j) { $(this).attr('id', p + "p" + (j + 1)); });
			});
			// 레벨 아이콘 표: 설정한 레벨 아이콘으로 (기존 도움말 페이지와 같은 처리)
			try { lp = (JSON.parse(localStorage.getItem("kkutu_volume")) || {}).levelPack; } catch (e) { }
			$(doc).find(".page-body").each(function () {
				var $p = $(this);

				if (lp) $p.find("[style*='newlv.png']").css('background-image', "url('/img/kkutu/lv/" + lp + ".png')");
				HELP.pages[this.id.replace(/^box-/, "")] = document.importNode(this, true);
			});
			HELP.titles.intro = text('nkHelpHome');
			HELP.path.intro = [];
			HELP.order.push('intro');
			$("#nk-help-nav").empty().append($("<button type='button'>").addClass("nk-help-item nk-help-home").attr('data-id', "intro").text(text('nkHelpHome')))
				.append(helpNav($(list), 0, []));
			HELP.state = 2;
			showHelp('intro');
		}).fail(helpFail);
	}
	function helpFail() {
		HELP.state = 0;
		$("#nk-help-page").empty().append($("<div>").addClass("nk-help-msg").text(text('nkHelpFail')));
	}
	// 목차: 하위 목록이 있는 항목은 접히는 묶음, 나머지는 본문 항목
	function helpNav($ul, depth, trail) {
		var $box = $("<div>").addClass("nk-help-items");

		$ul.children("li").each(function () {
			var $li = $(this), label = $.trim($li.children("label").text()), $sub = $li.children("ul"), id = $li.attr('id');

			if ($sub.length) {
				$box.append($("<div>").addClass("nk-help-group collapsed").attr('data-depth', depth)
					.append($("<button type='button'>").addClass("nk-help-gh").html(ico('chev')).append($("<label>").text(label)))
					.append(helpNav($sub, depth + 1, trail.concat(label))));
			} else if (HELP.pages[id]) {
				HELP.order.push(id);
				HELP.titles[id] = label;
				HELP.path[id] = trail;
				$box.append($("<button type='button'>").addClass("nk-help-item").attr({ 'data-id': id, 'data-depth': depth }).text(label));
			}
		});
		return $box;
	}
	function showHelp(id) {
		var i = HELP.order.indexOf(id), $item, prev, next;

		if (!HELP.pages[id]) return;
		HELP.cur = id;
		HELP.pages[id].style.display = "";
		$("#nk-help-page").empty().append(HELP.pages[id]).scrollTop(0);
		$("#nk-help-title").text(HELP.titles[id]);
		$("#nk-help-crumb").text(HELP.path[id].join(" \u203A "));
		$("#nk-help-nav .nk-help-item.on").removeClass("on");
		$item = $("#nk-help-nav .nk-help-item[data-id='" + id + "']").addClass("on");
		$item.parents(".nk-help-group").removeClass("collapsed");
		if ($item.length && $item[0].scrollIntoView) $item[0].scrollIntoView({ block: 'nearest' });
		prev = HELP.order[i - 1];
		next = HELP.order[i + 1];
		$("#nk-help-prev").prop('disabled', !prev).attr('data-id', prev || "");
		$("#nk-help-prev-t").text(prev ? HELP.titles[prev] : "");
		$("#nk-help-next").prop('disabled', !next).attr('data-id', next || "");
		$("#nk-help-next-t").text(next ? HELP.titles[next] : "");
	}
	// 검색: 항목 이름이나 본문에 글자가 있는 항목만 남기고 그 묶음을 펼침. 비우면 원래대로(지금 항목의 묶음만 펼침)
	function filterHelp(q) {
		var $nav = $("#nk-help-nav"), any = false;

		q = $.trim(q).toLowerCase();
		// "searching"은 기존 style.css의 전역 클래스(회색 배경)라 신 UI 이름을 씀
		$nav.toggleClass("nk-searching", !!q);
		$nav.find(".nk-help-item").each(function () {
			var id = $(this).attr('data-id'), page = HELP.pages[id];
			var hit = !q || HELP.titles[id].toLowerCase().indexOf(q) !== -1 || (page && (page.textContent || "").toLowerCase().indexOf(q) !== -1);

			$(this).toggleClass("nk-hide", !hit);
			if (q && hit) any = true;
		});
		$nav.find(".nk-help-group").each(function () {
			var has = $(this).find(".nk-help-item:not(.nk-hide)").length > 0;

			$(this).toggleClass("nk-hide", !has);
			if (q) $(this).toggleClass("collapsed", !has);
		});
		if (!q) {
			$nav.find(".nk-help-group").addClass("collapsed");
			$nav.find(".nk-help-item.on").parents(".nk-help-group").removeClass("collapsed");
		}
		$nav.children(".nk-help-none").remove();
		if (q && !any) $nav.append($("<div>").addClass("nk-help-none").text(text('nkHelpNone')));
	}
	function initHelp() {
		$("#nk-help-nav").on('click', ".nk-help-item", function () {
			showHelp($(this).attr('data-id'));
			if (my.phone) closeSheet();
		})
			.on('click', ".nk-help-gh", function () { $(this).parent().toggleClass("collapsed"); });
		$("#nk-help-prev, #nk-help-next").on('click', function () { showHelp($(this).attr('data-id')); });
		$("#nk-help-q").on('input', function () { if (HELP.state === 2) filterHelp($(this).val()); });
		// 본문 그림은 기존 도움말처럼 눌러서 크게
		$("#nk-help-page").on('click', "img", function () { window.open($(this).attr('src'), "", "resizable=no,status=no"); });
	}

	/* ------------------------------------------------------------------
	   사전 화면 (로비) — 왼쪽 뜻풀이는 기존 tryDict·processWord, 오른쪽 단어 찾기는 /dict-search(routes/dictsearch.js).
	   공격적 모드는 한국어만, 매너는 일본어 게임에 없으므로 일본어에서는 끔 (서버도 같은 기준).
	   언어는 넣은 글자로 정함(한글·자모 → 한국어, 가나 → 일본어, 로마자 → 영어). 아무것도 안 넣으면 마지막 언어.
	   글자 없이 찾으면: 긴 단어는 언어 전체에서 가장 긴 단어, 미션은 미션 글자가 가장 많은 단어 (사용자 요청)
	   ------------------------------------------------------------------ */
	var DICT_LANGS = { ko: 'nkDictKo', en: 'nkDictEn', ja: 'nkDictJa' };
	function dictLangOf(s) {
		if (/[가-힣ㄱ-ㆎ]/.test(s)) return 'ko';
		if (/[ぁ-ゖァ-ヺー]/.test(s)) return 'ja';
		if (/[a-z]/i.test(s)) return 'en';
		return null;
	}
	// 첫 글자 칸 우선, 비었으면 미션 칸. 둘의 언어가 다르면 false
	function dictDetect() {
		var a = dictLangOf($("#nk-dict-char").val());
		var b = DICT.mode === 'mission' ? dictLangOf($("#nk-dict-mis").val()) : null;

		if (a && b && a !== b) return false;
		if (a || b) DICT.lang = a || b;
		return true;
	}
	var DICT = { lang: 'ko', dir: 'end', mode: 'long', manner: false, injeong: false, allpos: false, seq: 0, mseq: 0 };
	var DICT_RECENT = "nkDictRecent";
	function initDict() {
		$("#nk-dict-word").on('keydown', function (e) { if (e.which === 13) dictMean($(this).val()); });
		$("#nk-dict-char, #nk-dict-mis").on('keydown', function (e) { if (e.which === 13) dictFind(); })
			.on('input', function () { if (dictDetect()) dictSync(); });
		$("#nk-dict-go").on('click', function () { dictFind(); });
		$("#nk-dict-mode").on('click', ".nk-seg-btn", function () { DICT.mode = $(this).attr('data-v'); dictChanged(); });
		$("#nk-dict-dir").on('change', function () { DICT.dir = $(this).val(); dictChanged(); });
		$("#nk-page-dict").on('click', ".nk-chip[data-opt]", function () {
			var k = $(this).attr('data-opt');

			if ($(this).prop('disabled')) return;
			DICT[k] = !DICT[k];
			dictChanged();
		});
		$("#nk-dict-list").on('click', "tr[data-w]", function () {
			$(this).addClass("sel").siblings().removeClass("sel");
			dictMean($(this).attr('data-w'), $(this).data('r'));
			if (my.phone) dictTab('mean');
		});
		$("#nk-dict-tabs").on('click', ".nk-seg-btn", function () { dictTab($(this).attr('data-tab')); });
		dictTab('mean');
		$("#nk-dict-recent").on('click', ".nk-tag", function () { dictMean($(this).text()); });
		dictSync();
		dictSum(text('nkDictHint'));
		dictRecent();
	}
	// 휴대폰 사전 탭 (데스크톱은 두 칸이 다 보이므로 표시만 바뀌고 영향 없음)
	function dictTab(t) {
		$("#nk-page-dict").attr('data-tab', t);
		$("#nk-dict-tabs > .nk-seg-btn").each(function () { $(this).toggleClass("on", $(this).attr('data-tab') === t); });
	}
	function dictChanged() {
		dictSync();
		dictFind(true);
	}
	// 고른 값에 맞게 단추·칸 상태를 맞춤
	function dictSync() {
		var ja = DICT.lang === 'ja';

		if (DICT.lang !== 'ko' && DICT.mode === 'attack') DICT.mode = 'long';
		$("#nk-dict-lang").text(text(DICT_LANGS[DICT.lang]));
		$("#nk-dict-mode .nk-seg-btn").each(function () {
			var v = $(this).attr('data-v');

			$(this).toggleClass("on", v === DICT.mode).toggle(v !== 'attack' || DICT.lang === 'ko');
		});
		$("#nk-dict-mis").prop('disabled', DICT.mode !== 'mission');
		$("#nk-dict-char").attr('placeholder', text(DICT.dir === 'end' ? 'nkDictFirst' : 'nkDictLast'));
		$("#nk-dict-col-link").text(text(DICT.dir === 'end' ? 'nkDictLast' : 'nkDictFirst'));
		$("#nk-page-dict .nk-chip[data-opt]").each(function () {
			var k = $(this).attr('data-opt');
			var off = (k === 'manner' && ja) || (k === 'allpos' && DICT.lang !== 'ko');

			$(this).toggleClass("on", DICT[k] && !off).prop('disabled', off);
		});
		$("#nk-page-dict .nk-chip[data-opt='allpos']").toggle(DICT.lang === 'ko');
		$("#nk-page-dict .nk-chip[data-opt='manner']").attr('data-nk-tip', text(ja ? 'nkDictTipJaManner' : 'nkDictTipManner'));
		$(".nk-dict-table").toggleClass("is-mis", DICT.mode === 'mission');
	}
	function dictSum(msg) {
		$("#nk-dict-sum").empty().append($("<div>").addClass("nk-dict-msg").text(msg));
	}
	// auto: 조건을 바꿔서 다시 찾는 경우 — 넣은 글자가 없으면 조용히 넘어감
	function dictFind(auto) {
		var q = $.trim($("#nk-dict-char").val());
		var mission = DICT.mode === 'mission';
		var mis = mission ? $.trim($("#nk-dict-mis").val()) : "";
		var seq;

		if (!dictDetect()) return dictSum(text('nkDictLangMix'));
		dictSync();
		// 공격적은 첫 글자, 미션은 미션 글자가 있어야 함. 긴 단어는 비워도 됨(언어 전체)
		if ((DICT.mode === 'attack' && !q) || (mission && !mis) || (auto && !q && !mis)) {
			if (!auto) dictSum(text(mission ? 'nkDictNeedMis' : 'nkDictHint'));
			return;
		}
		seq = ++DICT.seq;
		dictSum(text('searching'));
		$.get("/dict-search", {
			lang: DICT.lang, dir: DICT.dir, mode: DICT.mode, q: q, mis: mis,
			manner: DICT.manner && DICT.lang !== 'ja' ? 1 : 0, injeong: DICT.injeong ? 1 : 0, allpos: DICT.allpos && DICT.lang === 'ko' ? 1 : 0
		}, function (res) {
			if (seq === DICT.seq) dictDraw(res, mis);
		}).fail(function () {
			if (seq === DICT.seq) dictSum(text('nkDictFail'));
		});
	}
	function dictDraw(res, mis) {
		var $list = $("#nk-dict-list").empty();
		var $sum, head, what;

		if (!res || res.error) return dictSum(text(res && res.error === 429 ? 'nkDictBusy' : 'nkDictFail'));
		head = res.q ? text(DICT.dir === 'end' ? 'nkDictSumEnd' : 'nkDictSumFront').replace('{V1}', res.q).replace('(으)로', josaRo(res.q))
			: text('nkDictSumAll').replace('{V1}', text(DICT_LANGS[DICT.lang]));
		what = DICT.mode === 'long' ? text('nkDictSumLong') : DICT.mode === 'attack' ? text('nkDictSumAttack') : text('nkDictSumMission').replace('{V1}', mis);
		$sum = $("#nk-dict-sum").empty().append($("<b>").text(head + " " + what));
		if (res.subs && res.subs.length) $sum.append($("<div>").addClass("nk-tag").text(text('nkDictDueum').replace('{V1}', res.subs.join(', '))));
		if (res.total !== null) $sum.append($("<div>").addClass("nk-dict-total").text(text('nkDictTotal').replace('{V1}', res.total.toLocaleString())));
		if (!res.list.length) {
			$list.append($("<tr>").append($("<td>").addClass("nk-dict-none").attr('colspan', 5).text(text('nkDictNone'))));
			return;
		}
		res.list.forEach(function (r, i) {
			var $w = $("<td>").addClass("w");
			var zero = r.n <= 0;

			// 미션 글자는 강조 (단어는 텍스트로만 넣음)
			if (r.m) r.w.split(mis).forEach(function (part, x) {
				if (x) $w.append($("<b>").addClass("nk-dict-hl").text(mis));
				$w.append(document.createTextNode(part));
			});
			else $w.text(r.w);
			if (r.hw) $w.append($("<em>").addClass("nk-dict-hw").text(r.hw));
			if (r.i) $w.append($("<i>").addClass("nk-dict-badge inj").text(text('optInjeong')));
			if (r.s) $w.append($("<i>").addClass("nk-dict-badge sp").text(text('optAllpos')));
			$("<tr>").attr('data-w', r.w).data('r', r)
				.append($("<td>").addClass("n").text(i + 1), $w)
				.append($("<td>").addClass("m").text(r.m ? "×" + r.m : ""))
				.append($("<td>").addClass("e").append($("<b>").addClass("nk-dict-end").toggleClass("zero", zero).text(r.e)))
				.append($("<td>").addClass("r").toggleClass("zero", zero).text(zero ? text('nkDictOneShot') : text('nkDictCount').replace('{V1}', r.n.toLocaleString())))
				.appendTo($list);
		});
		$list.closest(".nk-dict-res").scrollTop(0);
	}
	// 한국어 문구의 (으)로 — 받침이 있으면(ㄹ 빼고) 으로
	function josaRo(c) {
		var k = c.charCodeAt(0) - 0xAC00;
		var j = k % 28;

		return (k >= 0 && k <= 11171 && j && j !== 8) ? "으로" : "로";
	}
	// 뜻풀이. r: 단어 찾기 결과 줄에서 눌렀을 때 그 줄 정보(이을 글자·단어 수)
	function dictMean(word, r) {
		var $out = $("#nk-dict-out");
		var seq;

		word = $.trim(word || "");
		if (!word) return;
		$("#nk-dict-word").val(word);
		seq = ++DICT.mseq;
		$out.empty().append($("<div>").addClass("nk-dict-empty").text(text('searching')));
		tryDict(word, function (res) {
			var $tags;

			if (seq !== DICT.mseq) return;
			$out.empty();
			if (res.error) return $out.append($("<div>").addClass("nk-dict-empty").text(res.error + ": " + text('wpFail_' + res.error)));
			$tags = $("<div>").addClass("nk-dict-tags");
			// 품사 이름(class_)은 한국어 사전 기준이라 한국어 단어에만
			if (/[가-힣]/.test(res.word)) (res.type || "").split(',').forEach(function (t) { if (L['class_' + t]) $tags.append($("<div>").addClass("nk-tag").text(L['class_' + t])); });
			if (r) {
				$tags.append($("<div>").addClass("nk-tag").text(text(DICT.dir === 'end' ? 'nkDictLast' : 'nkDictFirst') + " ‘" + r.e + "’"));
				$tags.append($("<div>").addClass("nk-tag").toggleClass("zero", r.n <= 0)
					.text(r.n <= 0 ? text('nkDictOneShot') : text('nkDictNext') + " " + text('nkDictCount').replace('{V1}', r.n.toLocaleString())));
			}
			$out.append($("<div>").addClass("nk-dict-head").text(res.word), $tags,
				processWord(res.word, res.mean, res.theme, (res.type || "").split(',')).addClass("nk-dict-mean-body"));
			dictRecent(res.word);
		});
	}
	// 최근 찾은 단어 (이 브라우저에만, 10개)
	function dictRecent(add) {
		var list = [];
		var $box = $("#nk-dict-recent").empty();

		try { list = JSON.parse(localStorage.getItem(DICT_RECENT)) || []; } catch (e) { }
		if (add) {
			list = [add].concat(list.filter(function (w) { return w !== add; })).slice(0, 10);
			try { localStorage.setItem(DICT_RECENT, JSON.stringify(list)); } catch (e) { }
		}
		list.forEach(function (w) { $box.append($("<button type='button'>").addClass("nk-tag").text(w)); });
	}

	/* ------------------------------------------------------------------
	   동작 줄 레지스트리 — 새 동작은 NK.registerAction 한 번으로 추가됨.
	   o = { id, icon, labelKey, order, target() → 기존 버튼, cls: 'primary lg' 등, end: 오른쪽 끝 배치,
	         onIcon / onLabelKey: 기존 버튼이 .toggled일 때 }
	   노출 여부는 기존 버튼을 그대로 따름(updateUI가 상태별로 .show()/.hide()) → 상태별 규칙을 다시 만들지 않음
	   ------------------------------------------------------------------ */
	var actions = [];
	my.registerAction = function (o) {
		actions.push(o);
		actions.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
		if (my._inited) renderActions();
	};
	function renderActions() {
		var sig = my._only + "|" + !!my._replay + "|" + actions.map(function (a) {
			var $t = a.target();
			return (!$t.length || $t[0].style.display === 'none') ? "" : a.id + $t.hasClass("toggled");
		}).join(",");
		var room = my._only === 'for-master' || my._only === 'for-normal';
		var $box, $end, $cnt;

		if (sig === my._actSig) return;
		my._actSig = sig;
		$box = $("#nk-actions").empty();
		$end = $("<div>").addClass("nk-actions-end");

		// 방 대기 화면: 준비 인원 (afterRoomUsers가 계산) — 시작/준비 단추 안에 작게 (사용자 결정, 정리안)
		if (room) {
			$cnt = $("<div>").addClass("nk-ready-count").attr('id', "nk-ready-count");
			renderReadyCount($cnt);
		}
		actions.forEach(function (a) {
			var $t = a.target(), on, key, $b;

			// 리플레이 중에는 리플레이용 동작만 (로비 단추가 그대로 보이는 상태라서)
			if (!!a.replay !== !!my._replay) return;
			if (!$t.length || $t[0].style.display === 'none') return;
			on = $t.hasClass("toggled");
			key = (on && a.onLabelKey) || a.labelKey;
			$b = $("<button type='button'>").addClass("nk-btn " + (a.cls || "")).toggleClass("toggled", on)
				.attr('data-nk-action', a.id).html(ico((on && a.onIcon) || a.icon) + "<label></label>");
			$b.children("label").attr('data-lang-key', key).text(text(key));
			$b.on('click', function () {
				$t.trigger('click');
				setTimeout(renderActions, 0);
			});
			(a.end ? $end : $box).append($b);
			if (room && a.end) $b.append($cnt);
			// 방 대기 화면: 나가기 다음에 방 번호·제목 — 단추와 같은 줄 (데스크톱 정리안, 휴대폰은 상단 바에 제목)
			if (room && a.id === 'exit') $box.append($("<div>").addClass("nk-act-room").attr('id', "nk-act-room"));
		});
		$box.append($end);
		renderActRoom();
	}
	function renderActRoom() {
		var room = $data.room, $t = $("#nk-act-room");

		if (!$t.length || !room) return;
		$t.empty().append($("<div>").addClass("nk-room-no").text(room.practice ? L['practice'] : room.id))
			.append($("<div>").addClass("nk-act-title room-head-title").text(badWords(room.title)));
		if (room.password) $t.append($("<div>").addClass("nk-room-lock").html(ico('lock')));
	}
	function menuBtn(k) { return function () { return $stage.menu[k]; }; }
	my.registerAction({ id: 'newRoom', icon: 'plus', labelKey: 'newRoom', order: 10, cls: 'primary lg', target: menuBtn('newRoom') });
	my.registerAction({ id: 'quickRoom', icon: 'zap', labelKey: 'quickRoom', order: 20, cls: 'ghost', target: menuBtn('quickRoom') });
	// 방 버튼: 나가기는 맨 앞, 나머지는 기본 UI(.kkutu-menu)와 같은 순서 — 관전, 방 설정, 초대, 연습 (사용자 요청)
	my.registerAction({ id: 'exit', icon: 'back', labelKey: 'exit', order: 10, cls: 'danger', target: menuBtn('exit') });
	// 리플레이 끝내기: 리플레이 중에는 기존 리플레이 단추가 "나가기"가 됨
	my.registerAction({ id: 'replayExit', icon: 'back', labelKey: 'exit', order: 10, cls: 'danger', replay: true, target: menuBtn('replay') });
	my.registerAction({ id: 'spectate', icon: 'eye', labelKey: 'spectate', order: 20, target: menuBtn('spectate') });
	my.registerAction({ id: 'setRoom', icon: 'sliders', labelKey: 'setRoom', order: 30, target: menuBtn('setRoom') });
	my.registerAction({ id: 'invite', icon: 'userplus', labelKey: 'invite', order: 40, target: menuBtn('invite') });
	my.registerAction({ id: 'practice', icon: 'target', labelKey: 'practice', order: 50, target: menuBtn('practice') });
	my.registerAction({ id: 'ready', icon: 'check', labelKey: 'ready', onLabelKey: 'nkReadyDone', order: 90, cls: 'primary lg', end: true, target: menuBtn('ready') });
	my.registerAction({ id: 'start', icon: 'replay', labelKey: 'start', order: 90, cls: 'primary lg', end: true, target: menuBtn('start') });

	/* ------------------------------------------------------------------
	   방 목록 — roomListBar()가 신 UI일 때 my.roomCard()를 씀.
	   ready.js의 부분 갱신($("#room-"+id).replaceWith(roomListBar(..)))도 이 카드를 받으므로,
	   카드가 만들어질 때 현재 필터·정렬을 스스로 적용함. 필터 상태는 kkutu_volume.nkRooms에 저장
	   ------------------------------------------------------------------ */
	var F = (function () {
		var s = (my.active && loadVolumeSettings().nkRooms) || {};
		return { w: !!s.w, o: !!s.o, c: s.c || 'all', s: s.s || 'id', q: "" };
	})();

	function saveFilter() { saveVolumeSettings({ nkRooms: { w: F.w, o: F.o, c: F.c, s: F.s } }); }
	function roomMatch(o) {
		var cat = F.c !== 'all' && GAME_CATEGORIES[F.c];

		// "대기 중만" = 카드 상태가 "대기 중"인 방 (게임 중·만원 제외)
		if (F.w && (o.gaming || o.players.length >= o.limit)) return false;
		if (F.o && o.password) return false;
		if (cat && cat.modes.indexOf(MODE[o.mode]) === -1) return false;
		if (F.q && (o.id + " " + o.title + " " + getOptions(o.mode, o.opts).join(" ")).toLowerCase().indexOf(F.q) === -1) return false;
		return true;
	}
	// 정렬은 DOM을 옮기지 않고 그리드의 order로 처리 (부분 갱신된 카드도 자기 자리를 찾아감)
	function roomOrder(o) {
		var n = Number(o.id) || 0;

		if (F.s === 'open') return (o.gaming ? 2 : o.players.length >= o.limit ? 1 : 0) * 1000000 + n;
		if (F.s === 'players') return clamp(100 - o.players.length, 0, 100) * 1000000 + n;
		return n;
	}
	function applyRoom($R, o) { $R.toggleClass("nk-hide", !roomMatch(o)).css('order', roomOrder(o)); }

	// 라운드 또는 HP 표시 (기존 roomListBar·setRoomHead와 같은 판정)
	function roundInfo(o) {
		var rule = RULE[MODE[o.mode]];
		var isSurvival = !!(rule && rule.survival) || !!(o.opts && o.opts.survival);
		var isCoop = !!(rule && rule.coop);
		var displayRound = (o.coopTarget !== undefined) ? o.coopTarget : o.round;

		return isSurvival
			? { icon: 'heart', text: (o.opts && o.opts.surHP || 500) + " HP" }
			: { icon: 'rounds', text: displayRound + " " + (isCoop ? L['coopRound'] : L['rounds']) };
	}
	// 방 카드 — 카드 간소형 (사용자 선택 B안, 2026-10-26, 데스크톱·휴대폰 같은 모양).
	// [번호 제목 🔒 …… 인원] / 모드 · 규칙(한 줄, 넘치면 …) / 라운드 · 시간 …… 상태 ⓘ — 칩·인원 막대·상태 알약 대신 글자
	my.roomCard = function (o) {
		var opts = getOptions(o.mode, o.opts, false, false);
		var ri = roundInfo(o);
		var full = o.players.length >= o.limit;
		var state = o.gaming ? 'gaming' : full ? 'full' : 'waiting';
		var stKey = state === 'gaming' ? 'nkGaming' : state === 'full' ? 'nkFull' : 'nkWaiting';
		var pickTopics = getPickTopicExpl(RULE[MODE[o.mode]], o.opts);
		var $R, $top, $rules;

		$R = $("<div>").attr('id', "room-" + o.id).addClass("nk-room").attr('data-state', state)
			.append($top = $("<div>").addClass("nk-room-top")
				.append($("<div>").addClass("nk-room-no").text(o.id))
				.append($("<div>").addClass("nk-room-title").text(badWords(o.title))))
			.append($rules = $("<div>").addClass("nk-room-rules").append($("<b>").text(opts[0])))
			.append($("<div>").addClass("nk-room-foot")
				.append($("<div>").addClass("nk-room-meta").text(ri.text + " · " + o.time + L['SECOND']))
				.append($("<div>").addClass("nk-status " + state).append($("<label>").attr('data-lang-key', stKey).text(text(stKey))))
				.append($("<button type='button'>").addClass("nk-icon-btn nk-room-info").attr('title', o.id + L['sRoomInfo']).html(ico('info'))
					.on('click', function () { requestRoomInfo(o.id); })))
			.on('click', function (e) {
				if ($(e.target).closest(".nk-room-info").length) return;
				tryJoin(o.id);
			});
		keyClick($R.attr('tabindex', 0));
		if (full) $R.attr('data-full', "");
		if (o.password) $top.append($("<div>").addClass("nk-room-lock").html(ico('lock')));
		$top.append($("<div>").addClass("nk-room-cap").text(o.players.length + "/" + o.limit));
		opts.slice(1).forEach(function (c) { $rules.append(document.createTextNode(" · " + c)); });
		// 한 줄에 다 안 들어가는 규칙·고른 주제는 마우스를 올리면 전부 (휴대폰은 ⓘ 방 정보)
		if (opts.length > 1 || pickTopics.length) tip($rules, { title: opts[0], lines: opts.slice(1), topics: pickTopics });
		applyRoom($R, o);
		return $R;
	};
	function refilterRooms() {
		var i, $r;

		for (i in $data.rooms) {
			$r = $("#room-" + i);
			if ($r.length) applyRoom($r, $data.rooms[i]);
		}
		my.afterRoomList();
	}
	// updateRoomList() 끝에서 호출 — 개수 표시와 빈 화면
	my.afterRoomList = function () {
		var total = 0, shown = 0, i, empty;

		if (!my._inited) return;
		if (my.quickRefresh) my.quickRefresh();
		for (i in $data.rooms) {
			total++;
			if (roomMatch($data.rooms[i])) shown++;
		}
		$("#nk-room-count").text((shown === total ? total : shown + " / " + total) + L['GAE']);
		empty = total ? (shown ? "" : 'filter') : 'none';
		$("#nk-rooms-empty").attr('data-empty', empty).toggle(!!empty);
		$stage.box.roomList.toggleClass("nk-is-empty", !!empty);
		if (!empty) return;
		$("#nk-rooms-empty-title").attr('data-lang-key', empty === 'none' ? 'nkNoRooms' : 'nkNoMatch').text(text(empty === 'none' ? 'nkNoRooms' : 'nkNoMatch'));
		$("#nk-rooms-empty-sub").attr('data-lang-key', empty === 'none' ? 'nkNoRoomsSub' : 'nkNoMatchSub').text(text(empty === 'none' ? 'nkNoRoomsSub' : 'nkNoMatchSub'));
		$("#nk-rooms-empty-btn use").attr('href', empty === 'none' ? "#nk-i-plus" : "#nk-i-x");
		$("#nk-rooms-empty-btn").toggleClass("primary", empty === 'none').children("label")
			.attr('data-lang-key', empty === 'none' ? 'newRoom' : 'nkResetFilter').text(text(empty === 'none' ? 'newRoom' : 'nkResetFilter'));
	};
	function initRoomTools() {
		var $seg = $("#nk-f-cat"), cats = ['all'], k;

		for (k in GAME_CATEGORIES) if (k !== 'event') cats.push(k);
		if (GAME_CATEGORIES.event) cats.push('event');
		// 휴대폰은 장르별 보기를 뺐으므로(사용자 요청) 늘 전체 — 예전에 고른 장르가 보이지 않는 채로 걸러 내지 않게
		if (my.phone || cats.indexOf(F.c) === -1) F.c = 'all';
		cats.forEach(function (c) {
			var key = 'category' + c.charAt(0).toUpperCase() + c.slice(1);

			$seg.append($("<button type='button'>").addClass("nk-seg-btn").toggleClass("on", F.c === c)
				.append($("<label>").attr('data-lang-key', key).text(text(key)))
				.on('click', function () {
					F.c = c;
					$seg.children().removeClass("on");
					$(this).addClass("on");
					saveFilter();
					refilterRooms();
				}));
		});
		$("#nk-f-wait").toggleClass("on", F.w).on('click', function () {
			$(this).toggleClass("on", F.w = !F.w);
			saveFilter();
			refilterRooms();
		});
		$("#nk-f-open").toggleClass("on", F.o).on('click', function () {
			$(this).toggleClass("on", F.o = !F.o);
			saveFilter();
			refilterRooms();
		});
		// 휴대폰은 정렬 칸이 아이콘만 보이므로 기본(번호 순)이 아닐 때 표시용으로 값을 속성에도 둠
		$("#nk-f-sort").val(F.s).attr('data-v', F.s).on('change', function () {
			F.s = $(this).val();
			$(this).attr('data-v', F.s);
			saveFilter();
			refilterRooms();
		});
		if (my.phone) $("#nk-room-q").attr({ 'data-lang-attr-placeholder': 'nkRoomSearchShort', placeholder: text('nkRoomSearchShort') });
		$("#nk-room-q").on('input', function () {
			F.q = $.trim($(this).val()).toLowerCase();
			refilterRooms();
		});
		$("#nk-rooms-empty-btn").on('click', function () {
			if ($("#nk-rooms-empty").attr('data-empty') === 'none') return $stage.menu.newRoom.trigger('click');
			F.w = F.o = false;
			F.c = 'all';
			F.q = "";
			$("#nk-f-wait, #nk-f-open").removeClass("on");
			$seg.children().removeClass("on").first().addClass("on");
			$("#nk-room-q").val("");
			saveFilter();
			refilterRooms();
		});
		$stage.box.roomList.children(".product-title").after($("#nk-room-tools"));
		$stage.box.roomList.append($("#nk-rooms-empty").hide());
	}

	/* ------------------------------------------------------------------
	   상점 — 기존 loadShop()/filterShop()이 그린 상품(.goods, #goods_{id})과 분류(.shop-type)·검색(#shop-search)을
	   그대로 쓰고(클릭하면 기존 구매 창), 머리 줄로 옮겨 카드 모양만 바꿈. 모레미 미리보기는 카드가 보일 때 그림
	   ------------------------------------------------------------------ */
	function initShopTools() {
		$("#nk-shop-search").append($("#shop-search").addClass("nk-input").attr('autocomplete', "off"));
		// 모바일 화면은 분류가 탭 대신 드롭다운(#m-shop-category, 동작은 ready.js) — 검색 칸 앞으로 (사용자 요청: 드롭다운 + 검색)
		$("#nk-shop-search").before($("#m-shop-category").addClass("nk-select"));
		$stage.box.shop.find(".shop-type").addClass("nk-seg-btn");
		$("#nk-shop-cats").append($stage.box.shop.find(".shop-categories").addClass("nk-seg"));
		$stage.box.shop.children(".product-title").after($("#nk-shop-tools"));
	}
	// 꾸미기 아이템·휘장을 기본 모레미에 입혀 보여 줄 장착 정보 (그 밖의 상품은 기존 이미지 그대로)
	function goodsEquip(item) {
		var g = item.group, dir;
		var eq = {};

		if (g.slice(0, 3) === 'BDG') return { BDG: item._id };
		if (g.charAt(0) !== 'M') return null;
		if (g === 'Mhand' || g === 'Mhs') {
			dir = (iImage(item._id) || "").split('/').slice(-2, -1)[0];
			g = dir === 'shoes' ? 'Mshoes' : 'Mlhand';
		}
		eq[g] = item._id;
		return eq;
	}
	function drawGoods(el) {
		var item = $data.shop[el.id.slice(6)];
		var eq = item && goodsEquip(item);
		var $m;

		if (!eq) return;
		$m = $("<div>").addClass("moremi nk-goods-moremi");
		$(el).children(".goods-image").addClass("nk-has-moremi").append($m);
		renderMoremi($m, eq);
	}
	// loadShop()에서 상품을 다 붙인 뒤 호출
	my.afterShop = function () {
		var $goods = $("#shop-shelf > .goods");

		if (my._goodsIO) my._goodsIO.disconnect();
		my._goodsIO = window.IntersectionObserver ? new IntersectionObserver(function (list, io) {
			list.forEach(function (en) {
				if (!en.isIntersecting) return;
				io.unobserve(en.target);
				drawGoods(en.target);
			});
		}, { root: document.getElementById("shop-shelf"), rootMargin: "200px 0px" }) : null;
		$goods.each(function () {
			$(this).append($("<button type='button'>").addClass("nk-btn primary nk-goods-buy")
				.append($("<label>").attr('data-lang-key', "purchase").text(text('purchase'))));
			if (my._goodsIO) my._goodsIO.observe(this);
			else drawGoods(this);
		});
		renderShopMoney();
	};
	// filterShop()에서 보이는 상품 수를 넘겨줌
	my.shopCount = function (n) { $("#nk-shop-count").text(n); };
	function renderShopMoney() {
		var me = $data.users && $data.users[$data.id];

		if (me) $("#nk-shop-money").text(text('nkBalance') + " " + commify(me.money) + L['ping']);
	}

	/* ------------------------------------------------------------------
	   방 대기 화면 — 플레이어 카드는 기존 updateRoom()이 그린 것(.room-user, #room-user-{id})을 CSS로 다시 입힘.
	   여기서는 상태 속성·"나" 표시·빈자리 카드만 덧붙임 → 말풍선 위치, 준비·잠수 판정 같은 기존 로직은 그대로.
	   팀 선택도 기존 .team-selector(#team-N, .team-chosen/.team-unable)를 CSS로 왼쪽 세로 줄로 만듦
	   ------------------------------------------------------------------ */
	// updateRoom()에서 setRoomHead() 다음에 호출. 깜빡임은 기존 animModified('.room-head-*')가 같은 클래스에 걸어 줌
	my.renderRoomHead = function (room) {
		var opts = getOptions(room.mode, room.opts, false, false);
		var pick = getPickTopicExpl(RULE[MODE[room.mode]], room.opts);
		var ri = roundInfo(room);
		var $h = $("#nk-roomhead").empty(), $rules, $meta;

		if (!$h.length) return;
		// 방 번호·제목은 동작 줄(데스크톱)·상단 바(휴대폰)에 있고, 여기는 방 정보 글자만 (사용자 결정, 정리안 — 칩 대신 글자)
		$h.append($rules = $("<div>").addClass("nk-rh-rules room-head-mode").append($("<b>").text(opts[0])))
			.append($meta = $("<div>").addClass("nk-rh-meta"));
		opts.slice(1).forEach(function (c) { $rules.append(document.createTextNode(" · " + c)); });
		meta(L['players'] + " " + room.players.length + "/" + room.limit, "room-head-limit");
		meta(ri.text, "room-head-round");
		meta((Math.round(room.time * 10) / 10) + L['SECOND'], "room-head-time");
		if (pick.length) meta(L['pickTopicTitle'] + " " + pick.join(", "), "room-head-pick");

		renderActRoom();
		my.renderGameHead();

		function meta(txt, cls) {
			$meta.append($("<div>").addClass(cls).text(txt));
		}
	};

	/* ------------------------------------------------------------------
	   게임 화면 — 게임 중에는 상단 바 한 줄에 방 정보·나가기·아이템 (A안).
	   게임 화면은 H안(nk.css 17)으로 기존 DOM을 다시 배치하며 확대하지 않음 → NK.gameZoom은 늘 1
	   (화면 좌표를 섞어 쓰는 기존 코드가 NK.gameZoom으로 나누므로 남겨 둠)
	   ------------------------------------------------------------------ */
	my.gameZoom = 1;
	// 상단 바의 방 정보: 번호 · 제목 · 모드 · 현재/전체 라운드 · 시간. updateRoom(renderRoomHead)과 drawRound(라운드 바뀔 때)에서 갱신
	my.renderGameHead = function (round) {
		var room = $data.room;
		var opts, pick, ri, rtext, $sub;

		if (round !== undefined) my._round = round;
		if (!room) return;
		opts = getOptions(room.mode, room.opts, false, false);
		pick = getPickTopicExpl(RULE[MODE[room.mode]], room.opts);
		ri = roundInfo(room);
		// 라운드제는 "현재/전체" (생존 HP·협동 목표는 기존 표시 그대로)
		rtext = (ri.icon === 'rounds' && room.coopTarget === undefined && my._round) ? my._round + "/" + ri.text : ri.text;
		// 지금 게임 규칙 이름 — 모드별 배치·모양(nk.css 18)이 씀
		root.setAttribute('data-nk-rule', RULE[MODE[room.mode]].rule);
		// 게임 화면 미션·체인 칸 이름표 (nk.css 17이 data-k를 보여 줌). 리듬 타이퍼의 체인 칸은 내 콤보 (사용자 결정)
		$stage.game.items.attr('data-k', L['optMission']);
		$stage.game.chain.attr('data-k', L[RULE[MODE[room.mode]].rule === 'Rtype' ? 'nkCombo' : 'chainCount']);
		$sub = $("<div>").addClass("nk-gamehead-sub").text([opts[0], rtext, (Math.round(room.time * 10) / 10) + L['SECOND']].join(" · "));
		// 휴대폰은 말풍선 대신 상단 바를 누르면 방 정보 시트 (buildGameSheet)
		if (!my.phone && (opts.length > 1 || pick.length)) tip($sub, { title: opts[0], lines: opts.slice(1), topics: pick });
		$("#nk-gamehead").empty()
			.append($("<div>").addClass("nk-room-no").text(my._replay ? L['replay'] : room.practice ? L['practice'] : room.id))
			.append($("<div>").addClass("nk-gamehead-title").text(badWords(room.title)))
			.append($("<div>").addClass("nk-gamehead-more").html(ico('chev')))
			.append($sub);
		if (my._sheet === 'game') buildGameSheet();
	};
	// 게임 화면(기본 1010×420)을 남는 칸에 맞춰 키움 — 배율은 #nk-center-body의 --nk-gz (게임 화면 자체의 style은 기존 코드 몫).
	// 채팅 칸도 확대된 게임 화면과 같은 폭으로 맞춤 (#nk-app의 --nk-gw, 사용자 요청)
	// H안(nk.css 17): 게임 화면은 확대하지 않고 칸에 맞춰 다시 배치하므로 배율은 늘 1, 채팅도 전체 폭.
	// 칸 크기가 바뀌면 단어 창 글자 맞춤만 다시 함
	function fitGame() {
		var area = document.getElementById("nk-center-body"), app = document.getElementById("nk-app");

		if (!area) return;
		area.style.removeProperty('--nk-gz');
		app.style.removeProperty('--nk-gw');
		app.style.removeProperty('--nk-cz');
		my.gameZoom = 1;
		if (my._only === 'for-gaming') {
			fitDisplay();
			fitHistory();
			fitBoard();
		}
	}
	// 단어 창 글자 맞춤 (H안): 단어 창은 기존 크기를 zoom(--nk-dz0)으로 키운 것이므로, 넘치면 zoom을 줄임.
	// 원래의 1/4보다 작아져야 하면 여러 줄(nk-multi)로 바꾸고 3줄 안에 들어갈 때까지 줄임 (사용자 결정).
	// 기존 코드가 글자 크기를 직접 정한 경우(타자 등)와 큰 판 모드는 건드리지 않음 — 단어를 다 보여 준 뒤 "쿵" 효과가 남기는 20~21px는 제외.
	// 단어 창의 겉보기 높이는 배율과 상관없이 같음(nk.css가 높이를 배율로 되돌림) → 글자가 줄어도 아래 요소가 움직이지 않음.
	// 글자마다 나타나는 박자 표시(.display-text)는 아직 숨은 글자까지 펼쳐 놓고(nk-dfull) 잼 — 한 줄 고정, 여러 줄로 넘기지 않음
	function fitDisplay() {
		var d = $stage.game.display[0], cs, fs, beat, sw, pw, z0, z, wv, hv, h, lo, hi, mid, i;

		if (!d || !d.offsetWidth) return;
		d.classList.remove('nk-multi');
		d.style.removeProperty('--nk-dz');
		d.style.removeProperty('--nk-dpt');
		fs = parseFloat(d.style.fontSize);
		if ((fs && (fs < 20 || fs > 21)) || $(d).closest(".cw").length || /rtype-display|raingame-board/.test(d.className)) return;
		cs = getComputedStyle(d);
		z0 = parseFloat(cs.getPropertyValue('--nk-dz0')) || 1;
		pw = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
		beat = !!d.querySelector(".display-text");
		d.classList.add('nk-dfull');
		// 잴 때는 글자를 21px로 둠(nk-dfull) — "쿵" 효과가 글자를 20 → 21px로 잠깐 키워도 넘치지 않게 (박자 표시는 글자 칸 폭이 고정)
		sw = d.scrollWidth;
		d.classList.remove('nk-dfull');
		if (sw <= d.clientWidth + 1) return;
		// 겉보기 폭(양옆 여백 뺀 글자 칸)·높이는 배율을 바꿔도 같음 (nk.css가 여백·높이를 배율만큼 되돌림)
		wv = (d.clientWidth - pw) * z0;
		hv = d.clientHeight * z0;
		z = wv / (sw - pw);
		if (z >= z0 / 4 || beat) {
			d.style.setProperty('--nk-dz', Math.floor(z * 100) / 100);
			return;
		}
		// 여러 줄: 높이를 풀어(nk-dfull) 글자 높이를 잰 뒤, 겉보기 높이 안에 드는 가장 큰 배율을 찾음.
		// 먼저 2줄로 맞추고, 2줄로도 원래의 1/4보다 작아지면 3줄 (사용자 결정)
		d.classList.add('nk-multi', 'nk-dfull');
		[2, 3].some(function (n) {
			lo = 0.3;
			hi = z0 / 2;
			for (i = 0; i < 8; i++) {
				mid = (lo + hi) / 2;
				d.style.setProperty('--nk-dz', mid);
				h = d.offsetHeight;
				if (h * mid <= hv + 1 && lineCount(d) <= n) lo = mid;
				else hi = mid;
			}
			return lo >= z0 / 4;
		});
		d.style.setProperty('--nk-dz', lo);
		h = d.offsetHeight;
		d.classList.remove('nk-dfull');
		d.style.setProperty('--nk-dpt', Math.max(0, (hv / lo - h) / 2) + "px");
	}
	// 네모 판 모드(H안 2단계, nk.css 18): 판(기존 308px)을 남는 칸에 맞게 확대 — 배율은 .jjoriping의 --nk-bz.
	// 높이는 게임 화면 칸에서 판을 뺀 나머지 줄(라운드·막대·여백)을 빼고, 폭은 데스크톱은 양옆 칸(300px씩)을, 휴대폰은 판 여백을 뺌
	// 휴대폰에서 떠 있는 입력창을 쓰는 모드(입력줄이 채팅 대신, 채팅은 남는 높이 — 최소 140px)는 높이가 모자라면 판을 세로로만 줄임(직사각형, --nk-bh)
	var FLOAT_INPUT = /^(Sock|Shuk|Flip|Raingame|Center|Picture)$/;
	function fitBoard() {
		var d = $stage.game.display[0], jj = $(d).closest(".jjoriping")[0], pb, cb = document.getElementById("nk-center-body"), dv, rows, other, w, h, z;

		if (!jj) return;
		if (!jj.classList.contains("cw") || !d.offsetWidth) {
			jj.style.removeProperty('--nk-bz');
			jj.style.removeProperty('--nk-bh');
			jj.style.removeProperty('--nk-pw');
			jj.style.removeProperty('--nk-cw');
			return;
		}
		pb = $(jj).closest(".product-body")[0];
		dv = d.getBoundingClientRect().height;
		rows = getComputedStyle(pb).gridTemplateRows.split(" ").reduce(function (a, v) { return a + (parseFloat(v) || 0); }, 0);
		other = rows - dv;
		if (root.getAttribute('data-nk-rule') === 'Picture') return fitPicture(d, jj, pb, cb, other);
		// 휴대폰: 폭에 맞추고, 높이가 모자라면 세로로만 줄임(직사각형) — 떠 있는 입력창 모드는 채팅 몫(140px)을 남김
		if (my.phone) {
			w = jj.clientWidth - 16;
			if (FLOAT_INPUT.test(root.getAttribute('data-nk-rule'))) h = $(".nk-main")[0].clientHeight - 140 - other - (cb.offsetHeight - pb.offsetHeight) - 12;
			else h = cb.clientHeight - other - 6;
			z = Math.max(140, Math.min(w, 760)) / 308;
			jj.style.setProperty('--nk-bz', z.toFixed(4));
			jj.style.setProperty('--nk-bh', Math.min(308, Math.max(120, h) / z).toFixed(1) + "px");
		} else {
			h = cb.clientHeight - other - 6;
			w = pb.clientWidth - 36 - 600 - 80 - 28;
			jj.style.setProperty('--nk-bz', (Math.max(140, Math.min(w, h, 760)) / 308).toFixed(4));
			jj.style.removeProperty('--nk-bh');
		}
		placeBubble();
	}
	// 그림퀴즈 판: 확대(zoom) 없이 실제 크기로 — 캔버스 폭(--nk-cw)을 남는 폭과 높이(캔버스 비율 288:180) 중 작은 쪽에 맞춤.
	// 판 폭(--nk-pw)은 휴대폰은 칸 폭 전체, 데스크톱은 캔버스 폭이되 도구 줄이 들어가게 최소 600px — 높이가 모자라면 캔버스만 줄어듦.
	// 도구 줄은 판 폭에 따라 줄바꿈되므로 한 번 더 재서 맞춤
	function fitPicture(d, jj, pb, cb, other) {
		var cv = d.querySelector(".pq-canvas"), i, extra, w, h, c;

		if (!cv) return;
		for (i = 0; i < 2; i++) {
			extra = d.getBoundingClientRect().height - cv.getBoundingClientRect().height;
			if (my.phone) {
				w = parseFloat(getComputedStyle(pb).gridTemplateColumns.split(" ")[1]) - 16;
				h = $(".nk-main")[0].clientHeight - 140 - other - (cb.offsetHeight - pb.offsetHeight) - 12;
			} else {
				w = pb.clientWidth - 36 - 600 - 80 - 28;
				h = cb.clientHeight - other - 6;
			}
			c = Math.round(Math.max(160, Math.min(w, (h - extra) * 288 / 180, 900)));
			jj.style.setProperty('--nk-pw', Math.round(my.phone ? w : Math.max(c, Math.min(w, 600))) + "px");
			jj.style.setProperty('--nk-cw', c + "px");
		}
	}
	// 솎솎·슉슉 찾은 단어(H안, 사용자 결정): 기존의 글자 칸 표(칸이 늘면 글자를 줄임) 대신 길이별로 묶은 단어 칩 — 긴 단어부터, 묶음 안은 최근 것부터.
	// 데스크톱은 왼쪽 칸(.bb), 휴대폰은 입력줄의 "찾은 단어 N" 단추를 누르면 판 위에 뜨는 목록. 규칙 파일의 _renderMaps가 신 UI일 때 부름 (달가루 모으기는 제외)
	my.renderFound = function ($bb, words) {
		var groups = {}, $all = $bb.add(my.$foundPop || $());

		words.forEach(function (w) {
			(groups[w.length] = groups[w.length] || []).unshift(w);
		});
		$all.empty().append($("<div>").addClass("nk-cwside-head").text(L['nkFound']).append($("<label>").text(words.length)));
		Object.keys(groups).sort(function (a, b) { return b - a; }).forEach(function (n) {
			$all.append($("<div>").addClass("nk-found-group")
				.append($("<div>").addClass("nk-found-len").text(n + L['cwL'] + " · " + groups[n].length))
				.append($("<div>").addClass("nk-found-words").append(groups[n].map(function (w) { return $("<div>").addClass("nk-found-word").text(w); }))));
		});
		if (my.$foundBtn) my.$foundBtn.text(L['nkFound'] + " " + words.length);
	};
	// 문제·입력 말풍선(.cwcmd): 선택한 칸(십자말풀이 단어 막대·스도쿠 칸·땅따먹기 칸) 아래에, 아래 자리가 없으면 위에. 꼬리는 칸 가운데를 가리킴
	function placeBubble() {
		var c = $stage.game.cwcmd[0], sel = $data._sel, pb, r, pr, bw, bh, left, top, up, inp, sdk;

		if (!c || c.style.display === "none" || c.style.opacity === "0") return;
		sel = (sel && sel.length === 4 && document.getElementById("cw-" + sel[1] + "-" + sel[2] + "-" + sel[3])) || $stage.game.display.find(".sd-sel, .landgrab-selected")[0];
		if (!sel) return;
		pb = $(c).closest(".product-body")[0];
		r = sel.getBoundingClientRect();
		pr = pb.getBoundingClientRect();
		inp = document.getElementById("cw-q-input");
		sdk = root.getAttribute('data-nk-rule') === 'Sudoku';
		c.classList.toggle("nk-incell", sdk);
		// 휴대폰 숫자 자판 (스도쿠만 — 같은 입력칸을 십자말풀이·땅따먹기도 씀)
		if (inp && (inp.getAttribute('inputmode') === 'numeric') !== sdk) {
			if (sdk) inp.setAttribute('inputmode', 'numeric');
			else inp.removeAttribute('inputmode');
		}
		// 스도쿠(사용자 결정): 말풍선 대신 고른 칸 위에 입력칸을 그대로 겹침 — 칸에 바로 숫자를 치고 엔터(제출·오답·닫기는 기존 입력칸 동작 그대로)
		if (sdk) {
			pb.style.setProperty('--nk-bl', (r.left - pr.left) + "px");
			pb.style.setProperty('--nk-bt', (r.top - pr.top) + "px");
			pb.style.setProperty('--nk-cs', r.width + "px");
			pb.style.setProperty('--nk-ch', r.height + "px");
			return;
		}
		bw = c.offsetWidth;
		bh = c.offsetHeight;
		// 게임 화면 칸과 실제 화면(창) 모두의 안쪽으로
		left = Math.max(10, 10 - pr.left, Math.min(pr.width - bw - 10, innerWidth - pr.left - bw - 10, r.left + r.width / 2 - pr.left - bw / 2));
		top = r.bottom - pr.top + 12;
		up = top + bh > pr.height - 10 && r.top - pr.top - bh - 12 > 0;
		if (up) top = r.top - pr.top - bh - 12;
		// 위치는 게임 화면 칸(.product-body)에 둠 — 말풍선의 style을 바꾸면 위 감시가 다시 불림
		c.classList.toggle("nk-up", up);
		pb.style.setProperty('--nk-bl', left + "px");
		pb.style.setProperty('--nk-bt', top + "px");
		pb.style.setProperty('--nk-ba', Math.max(18, Math.min(bw - 18, r.left + r.width / 2 - pr.left - left)) + "px");
	}
	// 네모 판 모드 왼쪽 부가 칸(.nk-cwside, 데스크톱 — nk.css 18). 판을 다시 그리거나 선택이 바뀔 때마다 새로 그림
	// 십자말풀이: 이 판의 단어 [번호 · 방향 · 글자 수 · 맞힌 단어] — 뜻은 기존 UI와 맞추려고 뺌(나중에 다시 넣을 수 있음, 사용자 결정).
	//   번호는 시작 칸을 읽는 순서(위 → 아래, 왼쪽 → 오른쪽)로 매기고 판의 첫 칸에도 붙임(data-n). 눌러서 그 단어를 고름
	// 스도쿠: 남은 칸 · 내가 채운 칸 · 틀린 횟수. 남이 채운 칸은 주어진 칸과 구별되게 nk-other
	function renderCwSide() {
		var $s = my.$cwside, rule = $data.room && RULE[MODE[$data.room.mode]], sel = $data._sel, open = $stage.game.cwcmd.css('opacity') !== "0",
			b, nums = {}, starts, done = 0, $l, left = 0, mine = 0;

		if (!$s) return;
		$s.empty();
		if (!rule || my._only !== 'for-gaming') return;
		if (rule.rule === 'Crossword' && $data._boards) {
			b = $data._boards[$data.selectedRound - 1] || [];
			starts = b.map(function (w) { return [Number(w[0]), Number(w[1])]; })
				.sort(function (p, q) { return p[1] - q[1] || p[0] - q[0]; });
			starts.forEach(function (p) {
				if (!nums[p]) nums[p] = Object.keys(nums).length + 1;
			});
			$stage.game.display.find(".cw-bar").removeClass("nk-sel");
			$l = $("<div>").addClass("nk-cw-list");
			b.forEach(function (w) {
				var n = nums[[Number(w[0]), Number(w[1])]], on = !!(open && sel && sel.length === 4 && sel[1] == w[0] && sel[2] == w[1] && sel[3] == w[2]),
					$bar = $("#cw-" + w[0] + "-" + w[1] + "-" + w[2]);

				if (w[4]) done++;
				$bar.children(".cw-cell").first().attr('data-n', n);
				if (on) $bar.addClass("nk-sel");
				$l.append($("<div>").addClass("nk-cw-item").toggleClass("mine", !!w[4] && w[5] == $data.id).toggleClass("open", !!w[4] && w[5] != $data.id).toggleClass("sel", on)
					.append($("<div>").addClass("nk-cw-no").text(n))
					.append($("<div>").addClass("nk-cw-dir").text(L[w[2] == "1" ? 'cwVert' : 'cwHorz'] + w[3] + L['cwL']))
					.append($("<div>").addClass("nk-cw-word").text(w[4] || ""))
					.on('click', function () {
						if (!w[4]) $bar.trigger('click');
					}));
			});
			$l.children().sort(function (p, q) { return $(p).children(".nk-cw-no").text() - $(q).children(".nk-cw-no").text(); }).appendTo($l);
			$s.append($("<div>").addClass("nk-cwside-head").text(L['nkCwWords']).append($("<label>").text(done + " / " + b.length + " " + L['nkCwSolved'])), $l);
		} else if (rule.rule === 'Sudoku' && $data._sdk) {
			b = $data._sdk[$data.selectedRound - 1];
			if (my._sdkRef !== $data._sdk) {
				my._sdkRef = $data._sdk;
				my._sdWrong = 0;
			}
			b.cells.forEach(function (v, i) {
				var o = b.owners[i];

				if (!v) left++;
				if (o == $data.id) mine++;
				else if (o) $("#sdk-" + i).addClass("nk-other");
			});
			$s.append($("<div>").addClass("nk-cwside-head").text(L['nkSdTitle']),
				[[L['nkSdLeft'], left], [L['nkSdMine'], mine], [L['nkSdWrong'], my._sdWrong]].map(function (r, i) {
					return $("<div>").addClass("nk-sd-stat nk-sd-" + i).append($("<div>").text(r[0]), $("<div>").text(r[1]));
				}));
		} else if (rule.rule === 'Picture' && $data._pqDrawer) {
			// 그림퀴즈: 이번 그림 정보(주제·정답 또는 글자 수·술래). 휴대폰은 판 안 머리줄(.nk-pq-head)이 대신함
			$s.append($("<div>").addClass("nk-cwside-head").text(L['nkPqNow']),
				[[L['pqTheme'], L['theme_' + $data._pqTheme] || $data._pqTheme],
					$data._pqIsDrawer ? [L['pqAnswer'], $data._pqAnswer || ""] : [L['nkPqLen'], ($data._pqAnswer || "").replace(/\s/g, '').length + L['pqChars']],
					[L['pqDrawer'], $("#game-user-" + $data._pqDrawer + " .game-user-name").text()]].map(function (r, i) {
					return $("<div>").addClass("nk-sd-stat nk-pq-stat nk-pq-" + i).toggleClass("nk-pq-ans", i === 1 && $data._pqIsDrawer).append($("<div>").text(r[0]), $("<div>").text(r[1]));
				}));
		}
	}
	// 판 뒤집기·땅따먹기·중심 찾기 칸 색 (사용자 결정) — 기존 코드가 판을 그릴 때 칸마다 인라인 색을 칠하므로 그린 뒤에 고쳐 칠함.
	// 판 뒤집기·땅따먹기: 주인 없는 칸은 기본 칸 색(nk-free, 기존 진갈색·검정 대신), 주인 있는 칸 글자는 바탕 밝기에 따라 검정/흰색, 1px 칸 테두리는 뺌(팀·시작 칸 테두리는 둠).
	//   플레이어 줄은 카드 전체를 플레이어 색으로 칠하던 것을 색 띠(--nk-pc) + 옅은 바탕(팀이면 팀 색, --nk-pt)으로. 휴대폰 입력줄·말풍선은 내 색으로 옅게(--nk-mc)
	// 중심 찾기: 일반 칸 = 기본 칸 색, 사각형 칸 = 강조색 섞음(nk-rect), 정답 칸 = 반전(nk-ans)
	function paintColorBoard() {
		var rule = root.getAttribute('data-nk-rule'), lib = $lib[rule], dark = document.body.classList.contains('dark-mode'), pb = $stage.box.game.children(".product-body")[0], rect;

		if (rule === 'Center') {
			rect = $data._rect;
			$stage.game.display.children(".landgrab-cell").each(function (i) {
				var row = Math.floor(i / 16), col = i % 16;

				this.style.backgroundColor = this.style.border = this.style.color = "";
				this.classList.toggle("nk-rect", !!rect && row >= rect.top && row < rect.top + rect.h && col >= rect.left && col < rect.left + rect.w);
				this.classList.toggle("nk-ans", $data._revealIndex === i);
			});
			return;
		}
		if ((rule !== 'Flip' && rule !== 'Landgrab') || !$data._owners) return;
		$stage.game.display.children(rule === 'Flip' ? ".flip-cell" : ".landgrab-cell").each(function (i) {
			var s = this.style, rgb;

			this.classList.toggle("nk-free", !$data._owners[i]);
			if (s.borderWidth === "1px") s.border = "";
			if (!$data._owners[i]) {
				s.backgroundColor = s.color = "";
				return;
			}
			rgb = (s.backgroundColor.match(/\d+/g) || [0, 0, 0]).map(Number);
			if (!$data.room.opts.drg) s.color = rgb[0] * .299 + rgb[1] * .587 + rgb[2] * .114 > 150 ? "#111" : "#fff";
		});
		$stage.box.game.find(".game-body .game-user").each(function () {
			var id = this.id.slice(10), team = lib._getOwnerTeam(id), pc = lib._getPlayerColor(id);

			this.style.backgroundColor = this.style.color = "";
			this.style.setProperty('--nk-pc', pc);
			this.style.setProperty('--nk-pt', (team && (dark ? lib._TEAM_COLORS_DARK : lib._TEAM_COLORS)[team]) || pc);
		});
		pb.style.setProperty('--nk-mc', lib._getPlayerColor($data.id));
	}
	// 휴대폰 기록: 한 줄에 다섯 칸 고정(nk.css). 단어가 칸보다 길면 가운데를 …로 줄여 앞뒤 글자만 남김 (사용자 결정) — 원래 단어는 data-w
	function fitHistory() {
		var h = $stage.game.history[0], ctx, avail;

		if (!my.phone || !h.firstChild) return;
		ctx = my._hctx || (my._hctx = document.createElement('canvas').getContext('2d'));
		avail = (h.clientWidth - 4 * (parseFloat(getComputedStyle(h).columnGap) || 0)) / 5;
		$(h).children(".history-item").each(function () {
			var t = this.firstChild, cs = getComputedStyle(this), w, s, n;

			if (!t || t.nodeType !== 3) return;
			w = this.getAttribute('data-w');
			if (w === null) this.setAttribute('data-w', w = t.data);
			ctx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
			s = w;
			for (n = w.length - 1; n > 1 && ctx.measureText(s).width > avail - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); n--) {
				s = w.slice(0, Math.ceil(n / 2)) + "…" + w.slice(w.length - Math.floor(n / 2));
			}
			if (t.data !== s) t.data = s;
		});
	}
	// 글자가 실제로 차지한 줄 수 (한글 글꼴은 줄 높이 값보다 줄이 높게 잡혀 높이 ÷ 줄 높이로는 더 많이 셈) — 글자 조각들의 서로 다른 윗선 개수
	function lineCount(d) {
		var r = document.createRange(), tops = [];

		r.selectNodeContents(d);
		[].forEach.call(r.getClientRects(), function (x) {
			var t = x.top;

			if (x.width && tops.every(function (v) { return Math.abs(v - t) > 3; })) tops.push(t);
		});
		return tops.length;
	}
	// 게임이 끝나 결과를 보는 동안 기존 코드가 휴대폰 입력창을 숨기고(roundEnd) 플레이어 카드를 비워도(updateRoom) 판이 움직이지 않게
	// 지금 자리를 잡아 둠 — body.js가 게임 끝 방 정보(checkRoom)와 roundEnd 중 먼저 오는 쪽에서 부르고, 두 번째는 이미 잡은 자리를 그대로 둠.
	// 게임 화면을 떠날 때 풂
	my.holdGameLayout = function () {
		var $pb = $stage.box.game.children(".product-body"), $gb = $pb.children(".game-body");

		if (!$gb[0].style.minHeight) $gb.css('min-height', $gb.outerHeight());
		if ($stage.game.here.is(":visible")) $pb.addClass("nk-hold-in");
	};
	my.releaseGameLayout = releaseGameLayout;
	function releaseGameLayout() {
		var $pb = $stage.box.game.children(".product-body");

		$pb.removeClass("nk-hold-in nk-found-open").children(".game-body").css('min-height', "");
	}
	// H안 게임 화면 준비: 미션·체인 이름표, 시간 막대 글자(막대 끝 고정 · nk.css가 data-t를 보여 줌), 단어 창 글자 맞춤
	function initGameH() {
		var $d = $stage.game.display, gb = $stage.box.game.find(".game-body")[0];

		// 휴대폰 떠 있는 입력창 안내 글 (모드와 상관없이 기본 문구, 사용자 결정)
		$stage.game.hereText.attr('placeholder', L['inputHere']);

		[$stage.game.turnBar, $stage.game.roundBar].forEach(function ($b) {
			var g = $b.parent()[0], b = $b[0];

			new MutationObserver(function () {
				var t = b.textContent;

				if (g.getAttribute('data-t') === t) return;
				g.setAttribute('data-t', t);
				if (t.length > 12) g.setAttribute('data-long', "");
				else g.removeAttribute('data-long');
			}).observe(b, { childList: true, characterData: true, subtree: true });
		});
		new MutationObserver(function () {
			if (my._only !== 'for-gaming' || my._dispRaf) return;
			my._dispRaf = requestAnimationFrame(function () {
				my._dispRaf = 0;
				fitDisplay();
			});
		}).observe($d[0], { childList: true, characterData: true, subtree: true });
		new MutationObserver(fitHistory).observe($stage.game.history[0], { childList: true });
		// 네모 판 모드: 판이 생기거나(.cw) 바뀌면 크기 맞춤, 말풍선이 나타나거나 문제가 바뀌면 위치 맞춤, 플레이어 목록 이름표(인원)
		new MutationObserver(function () {
			requestAnimationFrame(fitBoard);
		}).observe($d.closest(".jjoriping")[0], { attributes: true, attributeFilter: ['class'] });
		// 라운드 줄 높이가 바뀌어도(라운드 칩이 나중에 그려짐) 판을 다시 맞춤
		if (window.ResizeObserver) new ResizeObserver(function () {
			if (my._only === 'for-gaming') requestAnimationFrame(fitBoard);
		}).observe($stage.game.round[0]);
		new MutationObserver(function () {
			requestAnimationFrame(function () {
				renderCwSide();
				placeBubble();
			});
		}).observe($stage.game.cwcmd[0], { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
		my.$cwside = $("<div>").addClass("nk-cwside").appendTo(gb.parentNode);
		// 휴대폰 떠 있는 입력줄: [찾은 단어 N(솎솎·슉슉) | 입력칸 | 전송] — 채팅 입력줄 대신 씀(nk.css 18). 찾은 단어를 누르면 판 위에 목록, 목록을 누르면 닫힘
		if (my.phone) {
			my.$foundBtn = $("<button>").attr('type', "button").addClass("nk-found-btn").text(L['nkFound'] + " 0").on('click', function (e) {
				e.stopPropagation();
				$(gb.parentNode).toggleClass("nk-found-open");
			});
			$stage.game.here.prepend(my.$foundBtn).append($("<button>").attr('type', "button").addClass("nk-send-btn").text(L['send']).on('click', function (e) {
				e.stopPropagation();
				$stage.chatBtn.trigger('click');
				$stage.game.hereText.focus();
			}));
			my.$foundPop = $("<div>").addClass("nk-found-pop").appendTo(gb.parentNode).on('click', function () {
				$(gb.parentNode).removeClass("nk-found-open");
			});
		}
		// 판을 다시 그리면 왼쪽 칸도 새로, 스도쿠에서 내가 틀린 칸(sd-wrong이 잠깐 붙음)은 틀린 횟수로 셈
		new MutationObserver(function (list) {
			var redraw = false;

			list.forEach(function (m) {
				if (m.type === 'childList' && m.target === $d[0]) redraw = true;
				else if (m.type === 'attributes' && m.target.classList.contains("sd-wrong") && !/\bsd-wrong\b/.test(m.oldValue || "")) {
					my._sdWrong = (my._sdWrong || 0) + 1;
					redraw = true;
				}
			});
			// 칸 색은 그린 직후 바로 고침(다음 화면 그리기 전 — 기존 색이 한 번이라도 보이면 깜빡임)
			if (redraw) paintColorBoard();
			if (redraw && !my._sideRaf) my._sideRaf = requestAnimationFrame(function () {
				my._sideRaf = 0;
				renderCwSide();
			});
		}).observe($d[0], { childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
		new MutationObserver(function () {
			gb.setAttribute('data-k', L['players'] + " " + gb.children.length);
		}).observe(gb, { childList: true });
		// 플레이어 카드가 좌우로 넘치면(데스크톱 12명부터, nk.css) 차례인 카드를 가운데로 (기존 플레이어 스크롤 옵션은 body.js가 따로 처리)
		new MutationObserver(function () {
			var c = gb.querySelector(".game-user-current");

			if (c === my._curCard) return;
			my._curCard = c;
			if (c && gb.scrollWidth > gb.clientWidth + 1 && !gb.classList.contains("player-scroll")) {
				gb.scrollTo({ left: c.offsetLeft - (gb.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
			}
		}).observe(gb, { attributes: true, attributeFilter: ['class'], subtree: true });
	}
	var STATE_ICON = { master: 'crown', ready: 'check', spectate: 'eye', practice: 'target' };
	// updateRoom()이 대기 화면 카드를 다 그린 뒤 호출
	my.afterRoomUsers = function () {
		var room = $data.room, $r = $(".RoomBox .room-users");
		var isMaster = room && room.master == $data.id;
		var total = 0, ready = 0, empty, i;

		if (!my._inited || !room) return;
		$r.children(".room-user").each(function () {
			var $u = $(this), $y = $u.find(".room-user-ready");
			var team = ($u.find(".room-user-team").attr('class') || "").match(/team-(\d)/);
			var st = $y.hasClass("room-user-master") ? 'master'
				: $y.hasClass("room-user-spectate") ? 'spectate'
				: $y.hasClass("room-user-readied") ? 'ready'
				: $y.hasClass("room-user-practice") ? 'practice' : 'wait';

			$u.attr('data-state', st).attr('data-team', team ? team[1] : "0");
			keyClick($u.attr('tabindex', 0));
			// 상태 배지: 방장 = 강조 색, 준비 = 메인 색 (사용자 결정). 관전·연습은 휴대폰에서만 아이콘(데스크톱은 이름 아래 글자)
			$u.children(".nk-st").remove();
			if (STATE_ICON[st]) $u.append($("<div>").addClass("nk-st " + st).html(ico(STATE_ICON[st])));
			if (st !== 'spectate') {
				total++;
				if (st === 'master' || st === 'ready') ready++;
			}
			if ($u.attr('id') === "room-user-" + $data.id) $u.addClass("nk-me");
		});
		// 빈자리: 방장이면 누르면 초대 창
		empty = Math.max(0, room.limit - room.players.length);
		for (i = 0; i < empty; i++) {
			$r.append($("<div>").addClass("nk-seat").toggleClass("can-invite", isMaster)
				.html(ico(isMaster ? 'userplus' : 'user'))
				.append($("<label>").attr('data-lang-key', isMaster ? 'invite' : 'nkEmptySeat').text(text(isMaster ? 'invite' : 'nkEmptySeat')))
				.on('click', function () { if (isMaster) $stage.menu.invite.trigger('click'); }));
			if (isMaster) keyClick($r.children(".nk-seat").last().attr('tabindex', 0));
		}
		my._ready = { n: ready, t: total };
		renderReadyCount($("#nk-ready-count"));
	};
	function renderReadyCount($c) {
		var r = my._ready;

		if (!$c.length || !r) return;
		$c.empty().append($("<label>").attr('data-lang-key', 'stat_ready').text(text('stat_ready')))
			.append($("<b>").text(r.n)).append(document.createTextNode("/" + r.t));
	}

	/* ------------------------------------------------------------------
	   오른쪽 열 — [접속자 | 친구] 탭. 접속자 줄은 userListBar()가 신 UI일 때 my.userRow()를 씀
	   ------------------------------------------------------------------ */
	var userQ = "";

	function userMatch(o) { return !userQ || getDisplayName(o).toLowerCase().indexOf(userQ) !== -1; }
	my.userRow = function (o) {
		var $R = $("<div>").attr('id', "users-item-" + o.id).addClass("users-item")
			.append(getLevelImage(o.data.score).addClass("users-level"))
			.append($("<div>").addClass("users-name").text(getDisplayName(o)))
			.on('click', function () { requestProfile(o.id); });

		keyClick($R.attr('tabindex', 0));
		if (o.place) $R.append($("<div>").addClass("nk-place").text("#" + o.place));
		addonNickname($R, o);
		return $R.toggleClass("nk-hide", !userMatch(o));
	};
	// updateUserList() 끝에서 호출
	my.afterUserList = function (len) {
		if (my._inited) $("#nk-users-count").text(len);
	};
	// 방·게임 화면에서는 기존 코드가 접속자 줄을 갱신하지 않으므로(기본 UI에선 목록이 안 보임) 모아서 다시 그림
	my.queueUserList = function () {
		if (my._userTimer) return;
		my._userTimer = setTimeout(function () {
			my._userTimer = null;
			updateUserList(true);
		}, 1500);
	};
	function setPeopleTab(tab) {
		$("#nk-people").attr('data-ptab', tab);
		$(".nk-ptab").removeClass("on").filter("[data-ptab='" + tab + "']").addClass("on");
	}
	// updateCommunity() 끝에서 호출. 메모 수정·삭제는 커뮤니티 창의 기존 아이콘을 trigger함
	my.renderFriends = function () {
		var $l = $("#nk-friend-list"), list = [], on = 0, i;

		if (!my._inited) return;
		$l.empty();
		for (i in $data.friends) {
			list.push({ id: i, memo: $data.friends[i], server: ($data._friends[i] || {}).server, p: ($data.users[i] || {}).profile });
		}
		list.sort(function (a, b) { return (b.server ? 1 : 0) - (a.server ? 1 : 0); });
		list.forEach(function (f) {
			var name = f.p && (f.p.title || f.p.name);

			if (f.server) on++;
			$l.append($("<div>").addClass("nk-person").toggleClass("offline", !f.server)
				.append($("<div>").addClass("nk-dot").toggleClass("on", !!f.server))
				.append($("<div>").addClass("nk-person-main")
					.append($("<div>").addClass("nk-person-name").text(f.memo))
					.append($("<div>").addClass("nk-person-sub")
						.text((f.server ? L['server_' + f.server] : text('nkOffline')) + (name && name !== f.memo ? " · " + name : ""))))
				.append($("<div>").addClass("nk-row-actions")
					.append(rowBtn('pencil', "#cfi-" + f.id + " .fa-pencil"))
					.append(rowBtn('trash', "#cfi-" + f.id + " .fa-remove")))
				.on('click', function () { if ($data.users[f.id]) requestProfile(f.id); }));
			keyClick($l.children().last().attr('tabindex', 0));
		});
		if (!list.length) $l.append($("<div>").addClass("nk-empty small").attr('data-lang-key', 'nkNoFriends').text(text('nkNoFriends')));
		$("#nk-friends-count").text(on + "/" + list.length);

		function rowBtn(icon, sel) {
			return $("<button type='button'>").addClass("nk-icon-btn").html(ico(icon)).on('click', function (e) {
				e.stopPropagation();
				$(sel).trigger('click');
			});
		}
	};

	/* ------------------------------------------------------------------
	   설정 창 — 탭·줄 레지스트리. 줄에는 기존 설정 창(#SettingDiag)의 입력 요소를 그대로 옮겨 담음
	   → 값 채우기는 기존 설정 단추의 클릭 처리, 저장은 기존 #setting-ok(같은 localStorage·쿠키)가 그대로 함.
	   기존 설정 창에 입력이 새로 생겼는데 등록하지 않았으면 "기타" 탭에 원래 모양 그대로 들어감.
	   탭 t = { id, icon, labelKey, order }
	   줄 s = { tab, section(소제목 키), labelKey, descKey, controls: [선택자, ...](이 순서로 담음), kind: 'toggle'|'volume'|생략, order }
	   ------------------------------------------------------------------ */
	var setTabs = [], setRows = [], setRefresh = [];
	my.registerSettingTab = function (t) { setTabs.push(t); };
	my.registerSetting = function (s) { setRows.push(s); };
	function byOrder(a, b) { return (a.order || 0) - (b.order || 0); }

	function settingText(s) {
		var $t = $("<div>").addClass("nk-set-text")
			.append($("<div>").addClass("nk-set-label").attr('data-lang-key', s.labelKey).text(text(s.labelKey)));

		if (s.descKey) $t.append($("<div>").addClass("nk-set-desc").attr('data-lang-key', s.descKey).text(text(s.descKey)));
		return $t;
	}
	function settingRow(s) {
		var $ctl = $("<div>").addClass("nk-set-ctl");
		var $row, $in, $range, $val;

		if (s.kind === 'toggle') {
			// 줄 전체가 체크박스의 label → 어디를 눌러도 켜고 끔
			$in = $(s.controls[0]).addClass("nk-switch");
			return $("<label>").addClass("nk-set-row").attr('for', $in.attr('id')).append(settingText(s), $ctl.append($in));
		}
		$row = $("<div>").addClass("nk-set-row").append(settingText(s), $ctl);
		if (s.kind === 'volume') {
			// [슬라이더][값 %][음소거]: 슬라이더·음소거의 기존 처리(바로 들리는 볼륨, 음소거 시 슬라이더 잠금)는 그대로
			$range = $(s.controls[0]);
			$val = $("<div>").addClass("nk-set-val");
			$in = $(s.controls[1]).addClass("nk-switch sm");
			$ctl.append($range, $val, $("<label>").addClass("nk-set-check").append($in, $("<div>").attr('data-lang-key', 'mute').text(text('mute'))));
			$range.on('input change', show);
			setRefresh.push(show);
			return $row;
		}
		s.controls.forEach(function (sel) { $ctl.append($(sel)); });
		return $row;

		function show() { $val.text(Math.round(Number($range.val()) || 0) + "%"); }
	}
	function buildSettings() {
		var $tabs = $("#nk-set-tabs"), $panes = $("#nk-set-panes");
		var $src = $stage.dialog.setting.children(".dialog-body");
		var $left;

		// 신 UI 전용 설정 "항상 규칙 펼치기": 기존 설정 창에 없으므로 입력을 만들어 두고, 열 때 읽고 [저장] 때 같은 localStorage에 씀
		$("#nk-settings").append($("<input type='checkbox'>").attr('id', "nk-rule-open"));
		setRefresh.push(function () { $("#nk-rule-open").prop('checked', loadVolumeSettings().nkRuleOpen === true); });

		setTabs.sort(byOrder);
		setRows.sort(byOrder);
		setTabs.forEach(function (t) {
			var $pane = $("<div>").addClass("nk-set-pane").attr('data-tab', t.id);
			var section = null;

			setRows.forEach(function (s) {
				if (s.tab !== t.id) return;
				if (s.section && s.section !== section) $pane.append($("<div>").addClass("nk-set-section").attr('data-lang-key', s.section).text(text(s.section)));
				section = s.section;
				$pane.append(settingRow(s).toggleClass("nk-hide", !!s.hidden));
			});
			addSettingTab(t, $pane);
		});
		// 등록하지 않은 기존 입력 → "기타" 탭에 그 줄(.dialog-bar)째로
		$left = $src.children(".dialog-bar").not(".tail-button").filter(function () { return $(this).find("input, select, textarea").length; });
		if ($left.length) addSettingTab({ id: 'etc', icon: 'grid', labelKey: 'etc' }, $("<div>").addClass("nk-set-pane nk-set-legacy").attr('data-tab', 'etc').append($left));

		$("#nk-settings .nk-dlg-close").on('click', function () { $("#nk-settings").hide(); });
		$("#nk-set-server").on('click', function () { $stage.dialog.settingServer.trigger('click'); });
		// 저장은 기존 저장 단추가 함 (UI를 바꿨으면 거기서 새로고침)
		$("#nk-set-save").on('click', function () {
			saveVolumeSettings({ nkRuleOpen: $("#nk-rule-open").is(':checked') });
			$stage.dialog.settingOK.trigger('click');
			$("#nk-settings").hide();
		});

		function addSettingTab(t, $pane) {
			var $b = $("<button type='button'>").addClass("nk-set-tab").attr('data-tab', t.id).html(ico(t.icon) + "<label></label>");

			$b.children("label").attr('data-lang-key', t.labelKey).text(text(t.labelKey));
			$tabs.append($b.on('click', function () { setSettingTab(t.id); }));
			$panes.append($pane);
		}
	}
	// 탭 창(.nk-dlg) 공용: 탭 단추와 내용 칸 전환
	function dlgTab($d, id) {
		$d.find(".nk-dlg-tabs > .nk-set-tab").each(function () { $(this).toggleClass("on", $(this).attr('data-tab') === id); });
		$d.find(".nk-dlg-panes > .nk-set-pane").each(function () { $(this).toggle($(this).attr('data-tab') === id); });
	}
	function setSettingTab(id) {
		my._setTab = id;
		dlgTab($("#nk-settings"), id);
	}
	// 기존 설정 단추의 클릭 처리가 값을 다 채운 뒤 호출 (ready.js)
	my.openSettings = function () {
		var $d = $("#nk-settings");

		if (!$d.is(":visible")) setSettingTab(my._setTab || setTabs[0].id);
		setRefresh.forEach(function (f) { f(); });
		showDialog($d, true);
	};

	my.registerSettingTab({ id: 'basic', icon: 'sliders', labelKey: 'nkSetBasic', order: 10 });
	my.registerSettingTab({ id: 'sound', icon: 'volume', labelKey: 'nkSetSound', order: 20 });
	my.registerSettingTab({ id: 'screen', icon: 'monitor', labelKey: 'nkSetScreen', order: 30 });
	[
		{ tab: 'basic', labelKey: 'language', controls: ['#language-setting'] },
		{ tab: 'basic', section: 'denyReq', labelKey: 'denyInvite', descKey: 'nkDescDenyInvite', controls: ['#deny-invite'], kind: 'toggle' },
		{ tab: 'basic', section: 'denyReq', labelKey: 'whisper', descKey: 'nkDescDenyWhisper', controls: ['#deny-whisper'], kind: 'toggle' },
		{ tab: 'basic', section: 'denyReq', labelKey: 'friendAdd', descKey: 'nkDescDenyFriend', controls: ['#deny-friend'], kind: 'toggle' },
		{ tab: 'basic', section: 'ingames', labelKey: 'autoReady', descKey: 'nkDescAutoReady', controls: ['#auto-ready'], kind: 'toggle' },
		{ tab: 'basic', section: 'ingames', labelKey: 'aiAutoApply', descKey: 'nkDescAiAutoApply', controls: ['#ai-auto-apply'], kind: 'toggle' },
		{ tab: 'basic', section: 'ingames', labelKey: 'jaAutoConvert', descKey: 'nkDescJaAutoConvert', controls: ['#ja-auto-convert'], kind: 'toggle' },
		{ tab: 'basic', section: 'etc', labelKey: 'noFilter', descKey: 'nkDescNoFilter', controls: ['#no-filter'], kind: 'toggle' },
		{ tab: 'basic', section: 'etc', labelKey: 'noEasterEgg', descKey: 'nkDescNoEasterEgg', controls: ['#no-easter-egg'], kind: 'toggle' },
		{ tab: 'sound', labelKey: 'bgm', controls: ['#SettingDiag .bgmVolume', '#mute-bgm'], kind: 'volume' },
		{ tab: 'sound', labelKey: 'effect', controls: ['#SettingDiag .effectVolume', '#mute-effect'], kind: 'volume' },
		{ tab: 'sound', labelKey: 'lobbyBgm', descKey: 'nkDescLobbyBgm', controls: ['#lobby-bgm'] },
		{ tab: 'sound', labelKey: 'soundPack', descKey: 'nkDescSoundPack', controls: ['#sound-pack', '#beat-setting'] },
		{ tab: 'sound', labelKey: 'rhythmSync', descKey: 'rhythmSyncExpl', controls: ['#rhythm-sync', '#rhythm-sync-val'] },
		{ tab: 'screen', labelKey: 'uiSetting', descKey: 'nkDescUi', controls: ['#ui-setting', '#ui-style-setting'] },
		{ tab: 'screen', labelKey: 'theme', controls: ['#theme-setting', '#theme-setting-edit', '#dark-mode-setting'] },
		{ tab: 'screen', labelKey: 'levelPack', descKey: 'nkDescLevelPack', controls: ['#level-pack'] },
		// 간단 방 보기·규칙 묶어보기는 기본 UI 전용(사용자) — 값은 기존대로 저장되게 줄은 두고 숨김. 신 UI는 아래 "항상 규칙 펼치기"
		{ tab: 'screen', section: 'visual', labelKey: 'simpleRoomView', descKey: 'nkDescSimpleRoomView', controls: ['#simple-room-view'], kind: 'toggle', hidden: true },
		{ tab: 'screen', section: 'visual', labelKey: 'showRuleCategory', descKey: 'nkDescShowRuleCategory', controls: ['#show-rule-category'], kind: 'toggle', hidden: true },
		{ tab: 'screen', section: 'visual', labelKey: 'nkRuleOpen', descKey: 'nkDescRuleOpen', controls: ['#nk-rule-open'], kind: 'toggle' },
		{ tab: 'screen', section: 'visual', labelKey: 'noShake', descKey: 'nkDescNoShake', controls: ['#no-shake'], kind: 'toggle' },
		{ tab: 'screen', section: 'visual', labelKey: 'playerScroll', descKey: 'nkDescPlayerScroll', controls: ['#player-scroll'], kind: 'toggle' }
	].forEach(function (s, i) { s.order = i; my.registerSetting(s); });

	/* ------------------------------------------------------------------
	   프로필 관리 창 — 기존 프로필 관리(#DressDiag)·글자 조합소(#CharFactoryDiag)·아이템 조합소(#CraftingDiag)의
	   내용을 탭으로 옮겨 담음. 여는 것은 기존 단추 처리(ready.js)가 NK.openProfile로, 저장·조합은 기존 코드 그대로.
	   기존 확인·글자 조합소·아이템 조합소·환급 단추는 꾸미기 탭 아래에 그대로 둠 (조합소 단추 = 그 탭으로 이동)
	   ------------------------------------------------------------------ */
	var PF_TABS = [
		{ id: 'dress', icon: 'shirt', labelKey: 'nkTabDress', src: "#DressDiag", run: function () { dlgTab($("#nk-profile"), 'dress'); } },
		// 조합소 탭은 기존 단추와 똑같이(게임 중 막기·목록 그리기) 기존 단추 처리를 거침
		{ id: 'cf', icon: 'letters', labelKey: 'charFactory', src: "#CharFactoryDiag", run: function () { $("#dress-cf").trigger('click'); } },
		{ id: 'craft', icon: 'merge', labelKey: 'craftWorkshop', src: "#CraftingDiag", run: function () { $("#dress-craft").trigger('click'); } }
	];
	function buildProfile() {
		var $tabs = $("#nk-pf-tabs"), $panes = $("#nk-pf-panes");

		PF_TABS.forEach(function (t) {
			var $b = $("<button type='button'>").addClass("nk-set-tab").attr('data-tab', t.id).html(ico(t.icon) + "<label></label>");

			$b.children("label").attr('data-lang-key', t.labelKey).text(text(t.labelKey));
			$tabs.append($b.on('click', t.run));
			$panes.append($("<div>").addClass("nk-set-pane nk-pf-pane").attr('data-tab', t.id).append($(t.src).children(".dialog-body").children()));
		});
		// 기존 줄(.dialog-bar)에는 id가 없으므로 배치용 이름표를 붙임 (nk.css 11)
		[["#dress-nickname", "nick"], ["#dress-exordial", "exor"], ["#dress-view", "view"], ["#dress-goods", "goods"], ["#dress-ok", "foot"],
			["#cf-tray", "work"], ["#cf-reward", "rew"], ["#cf-cost", "cost"], ["#cf-goods", "goods"], ["#cf-compose", "foot"],
			["#craft-goods", "list"]].forEach(function (p) { $(p[0]).closest(".dialog-bar").addClass("nk-pf-" + p[1]); });
		// 아래 단추 중 조합소 두 개는 탭과 겹치고 되팔기는 안내만 띄우는 단추라 nk.css가 숨김 → 되팔기 안내는 글로 남김
		$("#dress-ok").before($("<div>").addClass("nk-pf-hint").attr('data-lang-key', 'paybackHelp').text(text('paybackHelp')));
		$("#dress-type-all").parent().addClass("nk-seg nk-pf-cats").children().addClass("nk-seg-btn");
		$("#craft-type-all").parent().addClass("nk-seg nk-pf-cats").children().addClass("nk-seg-btn");

		$("#nk-profile .nk-dlg-close").on('click', function () { $("#nk-profile").hide(); });
		// 기존 코드가 닫는 창(프로필 저장 후, 게임 시작 때)을 이 창으로 바꿔 둠
		$stage.dialog.dress = $stage.dialog.charFactory = $("#nk-profile");
	}
	// 기존 프로필 관리·조합소 단추 처리에서 호출 (ready.js). true를 돌려주면 기존 코드가 내용을 불러와 그림
	my.openProfile = function (tab) {
		var $d = $("#nk-profile");

		dlgTab($d, tab);
		if (!$d.is(":visible")) showDialog($d, true);
		return true;
	};

	/* ------------------------------------------------------------------
	   로딩 화면 (#Intro) — 가운데 글자 로고, 그 밑에 기존 안내 글(#intro-text: 불러오는 중·캡챠 등)과 진행 막대,
	   아래 25% 지점에 10초마다 바뀌는 랜덤 팁(L.tips = 채팅 /tip과 같은 목록). 로딩 화면이 사라지면 멈춤
	   ------------------------------------------------------------------ */
	function initIntro() {
		var tips = (window.L && L.tips) || [];
		var $intro = $("#Intro"), $tip, $tipText, n = -1, timer;

		// 기존 이미지 로고는 nk.css가 숨김
		$intro.prepend($("#nk-logo").clone().removeAttr('id href title').removeClass("nk-logo").addClass("nk-intro-logo"));
		$("#intro-text").after($("<div>").addClass("nk-intro-load")
			.append($("<div>").addClass("nk-intro-bar").append($("<div>")), $("<div>").addClass("nk-intro-pct").text("0%")));
		if (!tips.length) return;
		$tipText = $("<div>").addClass("nk-intro-tip-text");
		$tip = $("<div>").addClass("nk-intro-tip").append($("<div>").addClass("nk-intro-tip-label").text("TIP"), $tipText).appendTo($intro);
		next();
		// 전역 setInterval은 기존 코드가 막아 두므로 head.js의 별칭을 씀
		timer = _setInterval(function () {
			if (!$intro.is(":visible")) return clearInterval(timer);
			$tip.addClass("is-out");
			setTimeout(function () {
				next();
				$tip.removeClass("is-out");
			}, 350);
		}, 10000);

		function next() {
			var i = Math.floor(Math.random() * tips.length);

			if (tips.length > 1 && i === n) i = (i + 1) % tips.length;
			n = i;
			$tipText.text(tips[i]);
		}
	}
	// 진행률(0~1): 효과음·배경음 파일을 받는 동안 0→90% (loadSounds), 서버 접속이 끝나면 100% (welcome).
	// 로딩 화면이 사라진 뒤(음향 팩 변경 등의 loadSounds)는 무시하고, 뒤로 가지 않음
	// 표시 방식 (사용자 지정): 음향 파일 = 0~70%, 다 받은 뒤에는 3초마다 남은 부분의 절반씩 지수적으로 참
	// (3초 85%, 6초 92.5% …), 접속이 끝나면(welcome) 그때 값에서 0.5초 동안 100%로
	var LOAD_FILES = 0.7, LOAD_HALF = 3000, LOAD_END = 500;
	var LD = { files: 0, shown: 0, creepAt: 0, endAt: 0, endFrom: 0, raf: 0, last: 0 };
	my.loadProgress = function (p) {
		if (LD.endAt || !$("#Intro").is(":visible")) return;
		LD.files = Math.max(LD.files, clamp(p, 0, 1) * LOAD_FILES);
		if (p >= 1 && !LD.creepAt) LD.creepAt = Date.now();
		loadTick();
	};
	my.loadDone = function () {
		if (LD.endAt || !$("#Intro").is(":visible")) return;
		LD.endAt = Date.now();
		LD.endFrom = LD.shown;
		loadTick();
	};
	function loadTarget(now) {
		if (!LD.creepAt) return LD.files;
		return 1 - (1 - LOAD_FILES) * Math.pow(0.5, (now - LD.creepAt) / LOAD_HALF);
	}
	function loadTick() {
		if (!LD.raf) LD.raf = requestAnimationFrame(loadFrame);
	}
	function loadFrame() {
		var now = Date.now(), dt = now - (LD.last || now), t, done = false;

		LD.raf = 0;
		LD.last = now;
		if (LD.endAt) {
			// 끝: 0.5초 동안 100%로 (끝으로 갈수록 느려지게)
			t = clamp((now - LD.endAt) / LOAD_END, 0, 1);
			LD.shown = LD.endFrom + (1 - LD.endFrom) * (1 - Math.pow(1 - t, 3));
			done = t >= 1;
		} else {
			// 파일 단계는 받은 만큼 부드럽게 따라감(약 0.15초), 그 뒤 지수 보간 값은 그대로 따라감
			LD.shown = Math.max(LD.shown, LD.shown + (loadTarget(now) - LD.shown) * (1 - Math.exp(-dt / 150)));
		}
		$(".nk-intro-bar > div").css('width', LD.shown * 100 + "%");
		// 69.98%가 69%로 보이지 않게 약간 올려 내림, 끝나기 전에는 99%까지만
		$(".nk-intro-pct").text(Math.min(Math.floor(LD.shown * 100 + 0.05), done ? 100 : 99) + "%");
		// 끝났거나 로딩 화면이 사라지면 멈춤. 파일 단계에서 목표에 닿았으면 다음 파일까지 쉼
		if (done || !$("#Intro").is(":visible")) return;
		if (!LD.creepAt && LD.files - LD.shown < 0.0005) {
			LD.last = 0;
			return;
		}
		loadTick();
	}

	/* ------------------------------------------------------------------
	   대화상자 닫기 효과: 기존 코드는 .hide()로 바로 숨기고 곧바로 :visible을 확인하기도 하므로
	   실제 창은 그대로 바로 숨기고, 겉모습만 복제해 같은 자리에서 사라지게 함 (nk.css .nk-dlg-ghost)
	   ------------------------------------------------------------------ */
	function watchDialogs() {
		var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
		var mo;

		if (!window.MutationObserver) return;
		mo = new MutationObserver(function (list) {
			var done = [];
			var i, el;

			if (reduce && reduce.matches) return;
			for (i = 0; i < list.length; i++) {
				el = list[i].target;
				if (done.indexOf(el) !== -1 || el.style.display !== 'none') continue;
				if (!/display:\s*(?!none)\w/.test(list[i].oldValue || "")) continue;
				done.push(el);
				ghost(el);
			}
		});
		$(".dialog").each(function () { mo.observe(this, { attributes: true, attributeFilter: ['style'], attributeOldValue: true }); });
		// 창이 화면(보이는 영역) 밖으로 나가지 않게 — 기존 showDialog는 띄우는 순간의 창 크기로 한 번만 가운데에 놓으므로
		// 그 뒤 화면 크기가 바뀌면(휴대폰 주소 표시줄·키보드·회전) 밖으로 나감. 나타날 때·화면 크기가 바뀔 때 안으로 끌어옴
		mo = new MutationObserver(function (list) {
			list.forEach(function (m) {
				if (m.target.style.display !== 'none') requestAnimationFrame(function () { clampDialog(m.target); });
			});
		});
		$(".dialog").each(function () { mo.observe(this, { attributes: true, attributeFilter: ['style'] }); });
		$(window).on('resize', function () {
			$(".dialog:visible").each(function () { clampDialog(this); });
		});
		if (window.visualViewport) visualViewport.addEventListener('resize', function () {
			$(".dialog:visible").each(function () { clampDialog(this); });
		});
		function clampDialog(el) {
			var vv = window.visualViewport, vw = vv ? vv.width : innerWidth, vh = vv ? vv.height : innerHeight, r, t, l;

			if (!el.classList.contains("dialog") || el.classList.contains("nk-dlg-ghost") || !el.offsetWidth) return;
			r = el.getBoundingClientRect();
			t = Math.max(8, Math.min(r.top, vh - r.height - 8));
			if (Math.abs(t - r.top) > 1) el.style.top = (parseFloat(el.style.top) || 0) + t - r.top + "px";
			// 휴대폰은 CSS가 가로 가운데에 고정함
			if (my.phone) return;
			l = Math.max(8, Math.min(r.left, vw - r.width - 8));
			if (Math.abs(l - r.left) > 1) el.style.left = (parseFloat(el.style.left) || 0) + l - r.left + "px";
		}

		function ghost(el) {
			var g = el.cloneNode(true);
			var $g = $(g);

			// 같은 name의 라디오가 실제 창의 선택을 풀지 않게, iframe 등이 다시 불러오지 않게 함.
			// ID는 남겨 둠 (ID별 스타일 유지, 실제 창이 문서 순서상 앞이라 #id 조회는 실제 창을 찾음)
			$g.find("[name]").removeAttr('name');
			$g.find("iframe, video, audio, object, embed").remove();
			$g.addClass("nk-dlg-ghost").attr({ 'aria-hidden': "true", 'inert': "" }).css('display', "block");
			el.parentNode.insertBefore(g, el.nextSibling);
			g.addEventListener('animationend', done);
			setTimeout(done, 400);
			function done() { if (g.parentNode) g.parentNode.removeChild(g); }
		}
	}

	/* ------------------------------------------------------------------
	   초기화 / 상태 변경
	   ------------------------------------------------------------------ */
	/* ------------------------------------------------------------------
	   휴대폰 (모바일 화면) — 시안 A (사용자 선택): 아래 탭 [로비 | 접속자 | 상점 | 더보기].
	   로비 = 방 목록 + 맨 아래 채팅 한 줄(최근 말·안 읽은 수, 누르면 채팅 시트), 방 만들기는 떠 있는 단추.
	   터치 조작: 스와이프 없이 누르기로만 열고 닫음(사용자 지시). 시트는 닫기·바깥·뒤로 가기로 닫힘
	   ------------------------------------------------------------------ */
	var PHONE_TABS = [
		{ id: 'lobby', icon: 'home', labelKey: 'nkLobby' },
		{ id: 'people', icon: 'users', labelKey: 'nkUsers' },
		{ id: 'shop', icon: 'bag', labelKey: 'shop' },
		{ id: 'more', icon: 'grid', labelKey: 'nkMore' }
	];
	function findTab(id) {
		var r = null;

		tabs.forEach(function (t) { if (t.id === id) r = t; });
		return r;
	}
	// 로비에서 지금 보이는 화면: 접속자 > 상점 > 가운데 화면(사전·랭킹·도움말 = 더보기에서 엶) > 방 목록. 로비가 아니면 없음
	function phoneView() {
		if (my._only !== 'for-lobby') return "";
		if (my._mtab === 'people') return 'people';
		if ($data._shop) return 'shop';
		if (my._page) return 'more';
		return 'lobby';
	}
	function renderTabbar() {
		var v = phoneView();

		if (v === my._pview) return;
		my._pview = v;
		if (v) root.setAttribute('data-nk-view', v);
		else root.removeAttribute('data-nk-view');
		$("#nk-tabbar > .nk-tabbar-btn").each(function () { $(this).toggleClass("active", $(this).attr('data-tab') === v); });
	}
	function runPhoneTab(id) {
		if (id === 'more') return openSheet('more');
		closeSheet();
		my._mtab = id === 'people' ? 'people' : null;
		if (id !== 'people') runTab(findTab(id));
		renderTabbar();
	}
	// 시트 — 열면 방문 기록을 하나 넣어서 안드로이드 뒤로 가기가 페이지를 떠나지 않고 시트를 닫게 함
	function openSheet(name) {
		if (my._sheet === name) return;
		closePop();
		if (name === 'more') buildMoreSheet();
		if (name === 'notice') $("#nk-notice-body").html(my._gn || "");
		if (name === 'game') buildGameSheet();
		try {
			if (my._sheet && my._sheetHist) history.replaceState({ nkSheet: name }, "");
			else {
				history.pushState({ nkSheet: name }, "");
				my._sheetHist = true;
			}
		} catch (e) { my._sheetHist = false; }
		my._sheet = name;
		root.setAttribute('data-nk-sheet', name);
		if (name === 'chat') {
			my._unread = 0;
			renderChatbar();
			$stage.chat.scrollTop($stage.chat[0].scrollHeight);
		}
	}
	function closeSheet(fromHistory) {
		var hist = my._sheetHist;

		if (!my._sheet) return;
		my._sheet = null;
		my._sheetHist = false;
		root.removeAttribute('data-nk-sheet');
		// 시트 안 입력창에 포커스가 남으면 키보드가 그대로 떠 있으므로 내림
		if (document.activeElement && $(document.activeElement).closest(".nk-sheet, #nk-chat").length) document.activeElement.blur();
		if (hist && !fromHistory) {
			my._skipPop = true;
			history.back();
		}
	}
	function buildMoreSheet() {
		var $grid = $("<div>").addClass("nk-more-grid");

		// 위 탭 레지스트리에서 로비·상점을 뺀 나머지 (새 탭을 등록하면 여기에도 나옴)
		tabs.forEach(function (t) {
			var $it;

			if (t.id === 'lobby' || t.id === 'shop' || (t.avail && !t.avail())) return;
			$it = $("<button type='button'>").addClass("nk-more-item").toggleClass("disabled", !tabEnabled(t)).html(ico(t.icon) + "<label></label>");
			$it.children("label").text(text(t.labelKey));
			$it.on('click', function () {
				if (!tabEnabled(t)) return;
				closeSheet();
				my._mtab = null;
				runTab(t);
				renderTabbar();
			});
			$grid.append($it);
		});
		// 모바일 화면은 아래쪽 안내 링크(#Bottom)를 숨기므로 여기에 둠
		$("#nk-more-body").empty().append($grid, $("<div>").addClass("nk-more-links").append($("#Bottom a.bottom-contact").clone()));
	}
	// 게임 중 방 정보 시트(휴대폰): 상단 바에는 번호·제목만 들어가므로 누르면 전체 제목 · 모드·라운드·시간 · 규칙 · 고른 주제 (사용자 결정, 시안 v_phone_i)
	function buildGameSheet() {
		var room = $data.room, opts, $b;

		if (!room) return;
		opts = getOptions(room.mode, room.opts, false, false);
		$b = $("<div>").addClass("nk-gs-body")
			.append($("<div>").addClass("nk-gs-top").append($("#nk-gamehead > .nk-room-no").clone(), $("<div>").addClass("nk-gs-title").text(badWords(room.title))))
			.append($("<div>").addClass("nk-gs-sub").text($("#nk-gamehead > .nk-gamehead-sub").text()));
		group(L['nkRdRules'], opts.slice(1));
		group(L['pickTopicTitle'], getPickTopicExpl(RULE[MODE[room.mode]], room.opts));
		$("#nk-game-sheet").empty().append($b);

		function group(title, list) {
			if (!list.length) return;
			$b.append($("<div>").addClass("nk-gs-k").text(title),
				$("<div>").addClass("nk-gs-tags").append(list.map(function (c) { return $("<div>").addClass("nk-tag").text(c); })));
		}
	}
	// 채팅 한 줄: 마지막 말과 안 읽은 수. 기존 채팅 목록(#Chat)에 붙는 줄을 지켜봄 (채팅 코드는 그대로)
	function chatInfo(el) {
		var $e = $(el);

		return { who: $e.children(".chat-head").text(), msg: $e.children(".chat-body").text(), notice: $e.hasClass("chat-notice") };
	}
	function renderChatbar() {
		var c = my._lastChat;

		$("#nk-chatbar-who").text(c ? c.who : text('Chat').replace(/FA\{[^}]*\}/g, ""));
		$("#nk-chatbar-text").text(c ? c.msg : "");
		$("#nk-chatbar-n").text(my._unread > 99 ? "99+" : my._unread).toggle(my._unread > 0);
	}
	function watchChat() {
		var last = $stage.chat.children(".chat-item").not("hr").last()[0];

		if (last) my._lastChat = chatInfo(last);
		my._unread = 0;
		renderChatbar();
		if (!window.MutationObserver) return;
		new MutationObserver(function (list) {
			var changed = false;

			list.forEach(function (m) {
				var i, n;

				for (i = 0; i < m.addedNodes.length; i++) {
					n = m.addedNodes[i];
					if (n.nodeType !== 1 || n.tagName === 'HR' || !$(n).hasClass("chat-item")) continue;
					my._lastChat = chatInfo(n);
					// 안 읽은 수는 사람이 쓴 말만(팁·알림 제외), 로비에서 채팅 시트가 닫혀 있을 때만
					if (!my._lastChat.notice && my._sheet !== 'chat' && my._only === 'for-lobby') my._unread++;
					changed = true;
				}
			});
			if (changed) renderChatbar();
		}).observe($stage.chat[0], { childList: true });
	}
	// 모바일 화면에는 접속자 목록 칸(.UserListBox)이 없음(기본 UI는 창으로 봄) → 신 UI가 칸을 만들어 기존 코드가 채우게 함
	function phoneUserList() {
		var $box;

		if ($stage.box.userList.length) return;
		$box = $("<div>").addClass("UserListBox Product").append($("<h5>").addClass("product-title"), $("<div>").addClass("product-body"));
		$stage.box.userList = $box;
		$stage.lobby.userList = $box.children(".product-body");
		$stage.lobby.userListTitle = $box.children(".product-title");
		if ($data.id) updateUserList(true);
	}
	function initPhone() {
		var $bar = $("#nk-tabbar");

		PHONE_TABS.forEach(function (t) {
			var $b = $("<button type='button'>").addClass("nk-tabbar-btn").attr('data-tab', t.id).html(ico(t.icon) + "<label></label>");

			$b.children("label").attr('data-lang-key', t.labelKey).text(text(t.labelKey));
			$b.on('click', function () { runPhoneTab(t.id); });
			$bar.append($b);
		});
		$("#nk-chatbar").on('click', function () { openSheet('chat'); });
		// 도움말: 본문이 화면 전체를 쓰도록 검색 칸·목차를 시트로 옮김 (사용자 요청)
		$("#nk-help-sheet-body").append($("#nk-page-help .nk-help-q"), $("#nk-help-nav"));
		$("#nk-help-toc").on('click', function () { openSheet('help'); });
		// 공지는 한 줄로 잘려 보이므로 누르면 전체를 시트로
		$("#nk-notice-text").on('click', function () { if (my._gn) openSheet('notice'); });
		// 게임 중 상단 바의 방 정보를 누르면 방 정보 시트 (위에서 내려옴, 바깥·뒤로 가기로 닫힘)
		$("#nk-help-sheet").after($("<div>").addClass("nk-sheet").attr('id', "nk-game-sheet"));
		$("#nk-gamehead").on('click', function () { if (my._only !== 'for-lobby') openSheet('game'); });
		// 방 대기 화면: 로고 자리에 뒤로(= 나가기) 단추 (사용자 결정, 정리안)
		$(".nk-header").prepend($("<button type='button'>").addClass("nk-icon-btn nk-head-back").attr('id', "nk-head-back")
			.attr('aria-label', text('exit')).html(ico('back')).on('click', function () { $stage.menu.exit.trigger('click'); }));
		$("#nk-dim, #nk-app .nk-sheet-x").on('click', function () { closeSheet(); });
		$(window).on('popstate', function () {
			if (my._skipPop) {
				my._skipPop = false;
				return;
			}
			if (my._sheet) closeSheet(true);
		});
		watchChat();
	}
	function phoneState(place, prev) {
		if (place === prev) return;
		// 채팅 시트·접속자 화면은 로비 전용. 방·게임에서 돌아오면 안 읽은 수는 0부터 (방에서는 채팅이 보였으므로)
		closeSheet();
		my._mtab = null;
		if (place === 'lobby') {
			my._unread = 0;
			renderChatbar();
		}
	}
	/* ------------------------------------------------------------------
	   작은 창 리워크 (사용자 결정 2026-10-21) — 기존 창의 입력 요소를 새 배치로 옮겨 담고, 칩·세그먼트·스테퍼·팀 단추는
	   기존 입력을 대신 눌러 주거나 값을 넣고 change를 일으킴 → 서로 배제·잠금 규칙, 저장, 전송은 기존 코드(ready.js) 그대로.
	   방 만들기 A(두 칸, 휴대폰은 [방 정보|규칙] 탭) · 빠른 입장 B(모드 카드 + 들어갈 수 있는 방 수) ·
	   봇 C(왼쪽 미리보기 카드, 휴대폰은 미리보기 없이) · 알림·확인 등 작은 창 A(아이콘 · 제목 · 내용 · 오른쪽 단추)
	   ------------------------------------------------------------------ */
	// 기존 방 만들기 창과 같은 규칙 묶음 (ready.js #room-mode 처리와 같은 목록, 나머지는 특수 규칙)
	var RULE_GROUPS = [
		{ key: 'mannerGroup', opts: ['man', 'gen', 'shi', 'etq'] },
		{ key: 'wordScope', opts: ['ext', 'loa', 'str', 'unk', 'prv', 'lng', 'ret', 'obo', 'alp', 'dic', 'arc'] },
		{ key: 'linkMethod', opts: ['mid', 'fir', 'ran', 'sch'] },
		{ key: 'lenLimit', opts: ['no2', 'k32', 'k22', 'k44', 'k43', 'unl', 'ln2', 'ln3', 'ln4', 'ln5', 'ln6', 'ln7', 'nol', 'nos'] },
		{ key: 'bonus', opts: ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'fho', 'bbg', 'flu', 'jkp', 'dfb'] },
		{ key: 'misc', opts: null }
	];
	var LANG_GROUPS = [{ lang: 'ko', key: 'mcKorean' }, { lang: 'en', key: 'mcEnglish' }, { lang: 'ja', key: 'mcJapanese' }, { lang: 'etc', key: 'mcEtc' }];

	// 창이 열릴 때마다(숨김 → 보임) fn — 기존 코드가 값을 다 넣은 뒤 보이게 하므로 그때 새 요소를 맞춤
	function onShow($d, fn) {
		var el = $d[0], was = false;

		if (!el || !window.MutationObserver) return;
		new MutationObserver(function () {
			var now = !!el.style.display && el.style.display !== 'none';

			if (now && !was) fn();
			was = now;
		}).observe(el, { attributes: true, attributeFilter: ['style'] });
	}
	function plain(html) { return $("<div>").html(html || "").text(); }
	function optLabel(name) { return text('opt' + name); }
	// 간단 방 보기의 핵심 규칙 (ready.js #room-mode 처리의 keyRules와 같은 목록 — 바꾸면 같이 바꿀 것)
	var KEY_RULES = ['man', 'gen', 'ext', "jre", "jdk", 'mis', 'rdm', 'loa', 'str', 'prv', 'k32', 'lng', 'no2', 'unk', 'trp', 'one', 'ret', 'sur', 'rnt', 'itm', 'ljn', 'mir', 'spd', 'big', 'qz1', 'qz2', 'qz3', 'ijp', 'qij', 'unl', 'vow', 'obo', 'alp', 'ctc', 'apl', 'obk', 'nyh', 'ord', 'shf', 'stp', 'rnm'];
	var SIMPLE_ALL = 20; // 접힌 상태여도 모드의 규칙이 이 개수 이하면 전부 보임 (사용자 지정, 기존 UI 간단 방 보기는 10)
	// 규칙 칩: 묶음별 제목 + 칩. 칩 = 기존 체크박스(prefix-이름)를 대신 누름.
	// 접힘(기본): 핵심 규칙만 묶음 제목 없이 한 덩어리로 + [규칙 모두 보기] / 펼침: 묶음별 전체 (사용자 원칙).
	// 기존 간단 방 보기·규칙 묶어보기 설정은 기본 UI 전용 — 신 UI 방 만들기는 "항상 규칙 펼치기"(nkRuleOpen)가 처음 상태를 정함.
	// 켜 둔 규칙은 핵심이 아니어도 보임(랜덤·방 설정에서 켜진 규칙이 숨지 않게)
	function ruleChips($box, prefix, picks) {
		var chips = [], heads = [], all = false;
		var $groups = $("<div>").addClass("nk-fd-groups");
		var $all = $("<button type='button'>").addClass("nk-chip nk-fd-all").on('click', function () {
			var h = $groups[0].offsetHeight, was = my.phone && $groups.find(".nk-chip:visible, .nk-fd-sec:visible").get();

			all = !all;
			$box.trigger('change');
			// 휴대폰은 접고 펼 때 효과 (사용자 요청) — 바뀐 목록은 기존 처리(setTimeout 0) 뒤에 잼
			if (was) setTimeout(function () { foldAnim($groups, h, was); }, 0);
		});

		RULE_GROUPS.forEach(function (g) {
			var $sec = $("<div>").addClass("nk-fd-sec").attr('data-lang-key', g.key).text(text(g.key));
			var $wrap = $("<div>").addClass("nk-fd-chips");
			var codes = [], code;

			for (code in OPTIONS) {
				if (g.opts ? g.opts.indexOf(code) !== -1 : !RULE_GROUPS.some(function (o) { return o.opts && o.opts.indexOf(code) !== -1; })) codes.push(code);
			}
			codes.forEach(function (c) {
				var name = OPTIONS[c].name, sid = name.toLowerCase();
				var $c = $("<button type='button'>").addClass("nk-chip nk-fd-chip").attr('data-opt', c)
					.html('<svg class="nk-i nk-i-on"><use href="#nk-i-check"/></svg><label></label>');

				$c.children("label").attr('data-lang-key', 'opt' + name).text(optLabel(name));
				if (!my.phone) tip($c, { title: optLabel(name), lines: [plain(text('expl' + name))] });
				$c.on('click', function () {
					var cb = document.getElementById(prefix + "-" + sid);

					if (cb && !cb.disabled) cb.click();
				});
				chips.push({ code: c, sid: sid, $el: $c });
				$wrap.append($c);
			});
			// 인정 주제·퀴즈 주제·곡 고르기 단추는 특수 규칙 끝에
			if (!g.opts && picks) picks.forEach(function (p) {
				var $p = $("<button type='button'>").addClass("nk-chip nk-fd-pick").attr('data-opt', p.code).html(ico('sliders') + "<label></label>");

				$p.children("label").attr('data-lang-key', p.labelKey).text(text(p.labelKey));
				$p.on('click', function () { $(p.target).trigger('click'); });
				chips.push({ code: p.code, pick: true, $el: $p });
				$wrap.append($p);
			});
			heads.push({ $sec: $sec, $wrap: $wrap });
			$groups.append($sec, $wrap);
		});
		// [규칙 모두 보기]는 목록 끝 칸에 (접힘에서는 규칙 줄과 같은 칸 하나 — 휴대폰에서 줄 하나를 아낌)
		$box.append($groups.append($all));
		// opts: 이 모드에서 쓸 수 있는 규칙 코드 목록
		function sync(opts) {
			var many = opts.length > SIMPLE_ALL;
			var simple = many && !all;
			var hidden = 0, on = 0;

			chips.forEach(function (c) {
				var cb = !c.pick && document.getElementById(prefix + "-" + c.sid);
				var avail = opts.indexOf(c.code) !== -1;
				var show = avail && (!simple || KEY_RULES.indexOf(c.code) !== -1 || !!(cb && cb.checked));

				c.$el.toggle(show);
				if (avail && !show) hidden++;
				if (c.pick) return;
				c.$el.toggleClass("on", !!(cb && cb.checked)).prop('disabled', !cb || cb.disabled);
				if (avail && cb && cb.checked) on++;
			});
			// 접힘은 기존 간단 방 보기처럼 묶음 제목 없이, 펼침은 묶음별
			$box.toggleClass("nk-fd-flat", !all);
			$all.toggle(many).text(all ? text('nkRuleLess') : text('viewAllRules') + " (+" + hidden + ")");
			heads.forEach(function (h) {
				var any = h.$wrap.children().filter(function () { return this.style.display !== 'none'; }).length;

				// show()/hide()는 숨기기 전 display(간단 보기의 contents)를 되살리므로 클래스로
				h.$sec.add(h.$wrap).toggleClass("nk-hide", !any);
			});
			return on;
		}
		// 창을 열 때마다 처음 상태로 (open: 펼침)
		sync.reset = function (open) { all = !!open; };
		sync.all = function () { return all; };
		return sync;
	}
	// 규칙 접기·펼치기 효과: 목록 높이가 이전 높이에서 부드럽게 바뀌고, 펼칠 때 새로 보이는 줄은 살짝 내려오며 나타남.
	// 접을 때는 남은 줄이 다시 배치되므로 목록 전체를 짧게 흐렸다 보임
	function foldAnim($g, h0, was) {
		var el = $g[0], h1 = el.offsetHeight;
		var ease = 'cubic-bezier(.2, .8, .3, 1)';

		if (!el.animate || h0 === h1 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
		el.style.overflow = 'hidden';
		el.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 280, easing: ease }).onfinish = function () { el.style.overflow = ''; };
		if (h1 < h0) {
			el.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
			return;
		}
		$g.find(".nk-chip:visible, .nk-fd-sec:visible").each(function () {
			if (was.indexOf(this) === -1) this.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 40, easing: ease, fill: 'backwards' });
		});
	}
	// 트레이(.nk-seg) 선택 이동 효과 (사용자 요청): 다른 칸을 고르면 선택 바탕이 이전 칸에서 새 칸으로 미끄러져 감.
	// 무엇이 선택인지(.on/.selected/.active)는 화면마다 기존 코드가 정하므로, 누른 뒤 트레이 안의 선택이 바뀌는 순간(MutationObserver)
	// 트레이의 ::before를 이전 칸 자리에서 새 칸 자리로 옮기고 그동안 칸 바탕은 투명하게 (모양은 nk.css)
	function initSegSlide() {
		var SEL = ".on, .selected, .active";

		if (!window.MutationObserver || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
		document.addEventListener('click', function (e) {
			var btn = e.target.closest && e.target.closest(".nk-seg > *"), seg, from, box, cs, mo;

			if (!btn) return;
			seg = btn.parentNode;
			from = $(seg).children(SEL).filter(":visible")[0];
			if (!from || from === btn) return;
			box = place(from, seg);
			// 이전 칸의 선택 모양(바탕·그림자·모서리)을 지금 값으로 복사 (getComputedStyle은 바뀌면 따라 바뀜)
			cs = getComputedStyle(from);
			cs = { bg: cs.backgroundColor, sh: cs.boxShadow, r: cs.borderRadius };
			mo = new MutationObserver(function () {
				var to = $(seg).children(SEL).filter(":visible")[0];

				if (!to || to === from) return;
				mo.disconnect();
				slide(seg, box, place(to, seg), cs);
			});
			mo.observe(seg, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
			setTimeout(function () { mo.disconnect(); }, 400);
		}, true);
		function place(el, seg) {
			var r = el.getBoundingClientRect(), s = seg.getBoundingClientRect();

			return { x: r.left - s.left - seg.clientLeft, y: r.top - s.top - seg.clientTop, w: r.width, h: r.height };
		}
		function slide(seg, a, b, cs) {
			var st = seg.style;

			clearTimeout(seg._nkSlide);
			seg.classList.remove("nk-seg-anim");
			void seg.offsetWidth;
			['x', 'y', 'w', 'h'].forEach(function (k) {
				st.setProperty('--nk-s0' + k, a[k] + 'px');
				st.setProperty('--nk-s1' + k, b[k] + 'px');
			});
			st.setProperty('--nk-sbg', cs.bg);
			st.setProperty('--nk-ssh', cs.sh);
			st.setProperty('--nk-sr', cs.r);
			seg.classList.add("nk-seg-anim");
			seg._nkSlide = setTimeout(function () {
				// 끝날 때 칸 바탕이 다시 서서히 나타나지 않게 한 번만 전환 효과 없이 되돌림
				seg.classList.add("nk-seg-settle");
				seg.classList.remove("nk-seg-anim");
				void seg.offsetWidth;
				seg.classList.remove("nk-seg-settle");
			}, 260);
		}
	}
	// 숫자 입력 양옆 −/+ (min·max는 기존 코드가 모드마다 바꾸는 속성 그대로)
	function stepper($in) {
		var $w = $("<div>").addClass("nk-step");

		$in.before($w);
		$w.append(bump(-1, "−"), $in, bump(1, "+"));
		return function sync() {
			$w.toggle($in[0].style.display !== 'none').toggleClass("is-off", $in.prop('disabled'));
		};
		function bump(d, t) {
			return $("<button type='button'>").addClass("nk-step-btn").text(t).on('click', function () {
				var el = $in[0], v = (Number(el.value) || 0) + d;

				if (el.disabled) return;
				if (el.min !== "") v = Math.max(Number(el.min), v);
				if (el.max !== "") v = Math.min(Number(el.max), v);
				el.value = v;
				$in.trigger('input').trigger('change');
			});
		}
	}
	// 선택 칸 → 세그먼트 (선택 칸은 숨겨 두고 값만 바꿈). fmt: 단추 글자
	function selSeg($sel, fmt) {
		var $s = $("<div>").addClass("nk-seg nk-fd-seg");

		$sel.addClass("nk-hide").before($s);
		$s.on('click', ".nk-seg-btn", function () {
			if ($sel.prop('disabled')) return;
			$sel.val($(this).attr('data-v')).trigger('change');
		});
		return function sync() {
			var v = $sel.val();

			$s.empty().toggleClass("is-off", $sel.prop('disabled'));
			$sel.children("option").each(function () {
				if (this.style.display === 'none') return;
				$s.append($("<button type='button'>").addClass("nk-seg-btn").toggleClass("on", this.value === v)
					.toggleClass("is-fast", !!this.style.color).attr('data-v', this.value).text(fmt ? fmt(this) : $(this).text()));
			});
		};
	}
	function fdRow(labelKey, $ctl) {
		var $l = $("<div>").addClass("nk-fd-k");

		if (labelKey) $l.attr('data-lang-key', labelKey).text(text(labelKey));
		return $("<div>").addClass("nk-fd-row").append($l, $ctl);
	}
	function fdSec(key) { return $("<div>").addClass("nk-fd-sec").attr('data-lang-key', key).text(text(key)); }

	// 방 만들기 · 방 설정 (#RoomDiag)
	function initRoomDlg() {
		var $d = $stage.dialog.room, $b = $d.children(".dialog-body");
		var $info = $("<div>").addClass("nk-rd-info nk-scroll"), $rules = $("<div>").addClass("nk-rd-rules nk-scroll");
		// 휴대폰은 두 단계(사용자 지시): ① 방 정보 [다음] → ② 규칙 [이전][확인]. 데스크톱은 두 칸이라 단계 표시·단추를 숨김 (nk.css)
		var $steps = $("<div>").addClass("nk-rd-steps");
		var $round = $("<div>").addClass("nk-fd-inline");
		var syncs = [], syncRules, $rulesStep;

		$d.addClass("nk-fdlg nk-rd").attr('data-tab', 'info');
		$steps.append(
			step('info', 1, 'nkRdInfo'),
			$("<div>").addClass("nk-rd-step-line"),
			$rulesStep = step('rules', 2, 'nkRdRules').append($("<em>").addClass("nk-rd-n"))
		).on('click', ".nk-rd-step", function () { rdTab($(this).attr('data-tab')); });
		$("#room-ok").before(
			$("<button type='button'>").addClass("nk-rd-prev").attr('data-lang-key', 'prevPage').text(text('prevPage')).on('click', function () { rdTab('info'); }),
			$("<button type='button'>").addClass("nk-rd-next").attr('data-lang-key', 'nextPage').text(text('nextPage')).on('click', function () { rdTab('rules'); })
		);

		$info.append(fdSec('nkRdInfo'), $("#room-title"), $("#room-pw"));
		syncs.push(stepper($("#room-limit")));
		$info.append(fdRow('userLimit', $("#room-limit").parent()));
		$info.append(fdSec('nkRdGame'));
		syncs.push(selSeg($("#room-category")));
		$info.append($("#room-category").prev(".nk-fd-seg"), $("#room-category"), $("#room-mode"), $("#game-mode-expl").addClass("nk-fd-help"));
		// 라운드 줄의 이름(#room-round-label)은 기존 코드가 모드·서바이벌에 따라 바꾸므로 그대로 옮겨 씀
		syncs.push(stepper($("#room-round")));
		$round.append($("#room-round").parent(), $("#room-sur-hp"));
		$info.append($("<div>").addClass("nk-fd-row").append($("#room-round-label").addClass("nk-fd-k"), $round));
		syncs.push(selSeg($("#room-time"), function (o) { return $(o).text().replace(/[^\d.]/g, ""); }));
		$info.append(fdRow('nkRdTime', $("#room-time").prev(".nk-fd-seg")).append($("#room-time")));

		syncRules = ruleChips($rules, 'room', [
			{ code: 'ijp', labelKey: 'pickInjeong', target: "#room-injeong-pick" },
			{ code: 'qij', labelKey: 'pickQuizTopic', target: "#room-quiz-pick" },
			{ code: 'spk', labelKey: 'pickSong', target: "#room-song-pick" }
		]);
		$rules.prepend(fdSec('nkRdRules').addClass("nk-rd-rules-title"));

		$b.children().not(".tail-button").addClass("nk-hide");
		$b.prepend($steps, $("<div>").addClass("nk-rd-main").append($info, $rules));

		// 기존 처리(모드·장르 바꾸기, 랜덤, 서로 배제)가 끝난 뒤에 맞춤
		$d.on('change input click', function () { setTimeout(sync, 0); });
		onShow($d, function () {
			rdTab('info');
			syncRules.reset(loadVolumeSettings().nkRuleOpen === true);
			sync(true);
		});

		function step(id, n, key) {
			return $("<button type='button'>").addClass("nk-rd-step").attr('data-tab', id)
				.append($("<b>").text(n), $("<label>").attr('data-lang-key', key).text(text(key)));
		}
		function rdTab(id) {
			$d.attr('data-tab', id);
			$steps.children(".nk-rd-step").each(function () { $(this).toggleClass("on", $(this).attr('data-tab') === id); });
			$info.add($rules).scrollTop(0);
		}
		function sync(opening) {
			var rule = RULE[MODE[$("#room-mode").val()]];
			var n;

			syncs.forEach(function (f) { f(); });
			n = rule ? syncRules(rule.opts) : 0;
			$rulesStep.children(".nk-rd-n").text(n ? n : "");
			wide(syncRules.all(), opening);
		}
		// PC: 접힘은 규칙 한 줄 2개(좁은 창), 펼침은 4개 — 창이 오른쪽으로 넓어짐(화면을 넘으면 그만큼 왼쪽으로). 폭은 nk.css와 같게
		function wide(on, opening) {
			var w, left;

			if (my.phone || $d.hasClass("is-wide") === on) return;
			w = Math.min(on ? 840 : 600, window.innerWidth - 16);
			if (opening) {
				// 열 때는 효과 없이 바꾸고 바뀐 폭으로 다시 가운데 (showDialog는 이전 폭으로 맞췄음)
				$d.toggleClass("is-wide", on).css('left', Math.max(8, (window.innerWidth - w) / 2));
				return;
			}
			left = parseFloat($d.css('left')) || 0;
			clearTimeout(my._rdAnim);
			$d.addClass("nk-rd-anim").toggleClass("is-wide", on);
			if (left + w > window.innerWidth - 8) $d.css('left', Math.max(8, window.innerWidth - 8 - w));
			my._rdAnim = setTimeout(function () { $d.removeClass("nk-rd-anim"); }, 320);
		}
	}

	// 빠른 입장 (#QuickDiag) — 언어 탭 · 모드 카드(들어갈 수 있는 방 수) · 규칙 조건(접힘) · 입장
	function initQuickDlg() {
		var $d = $stage.dialog.quick, $b = $d.children(".dialog-body");
		var $langs = $("<div>").addClass("nk-seg nk-qk-langs"), $modes = $("<div>").addClass("nk-qk-modes nk-scroll");
		var $fold = $("<button type='button'>").addClass("nk-qk-fold").html(ico('chev') + "<label></label>");
		var $conds = $("<div>").addClass("nk-qk-conds"), $sum = $("<div>").addClass("nk-qk-sum");
		var syncConds = ruleChips($conds, 'quick');
		var lang = null, open = false;

		var $main = $("<div>").addClass("nk-qk-main").append($langs, $modes, $fold, $conds);
		var $foot = $("<div>").addClass("nk-fd-foot nk-qk-foot").append($sum, $("#quick-queue").removeClass("dialog-bar"), $("<div>").addClass("nk-spacer"), $("#quick-ok"));

		$d.addClass("nk-fdlg nk-qk");
		$b.append($main, $foot).children().not($main).not($foot).addClass("nk-hide");

		$langs.on('click', ".nk-seg-btn", function () {
			if (busy()) return;
			lang = $(this).attr('data-lang');
			draw();
		});
		$modes.on('click', ".nk-qk-mode", function () {
			if (busy()) return;
			$("#quick-mode").val($(this).attr('data-mode')).trigger('change');
		});
		$fold.on('click', function () {
			open = !open;
			draw();
		});
		$d.on('change click', function () { setTimeout(draw, 0); });
		onShow($d, function () {
			lang = langOf($("#quick-mode").val());
			open = false;
			syncConds.reset();
			draw();
		});
		my.quickRefresh = function () { if ($d.is(":visible")) draw(); };

		function busy() { return $("#quick-ok").hasClass("searching"); }
		function langOf(v) {
			var r = RULE[MODE[v]];
			var l = r && r.lang;

			return LANG_GROUPS.some(function (g) { return g.lang === l; }) ? l : 'etc';
		}
		function conds() {
			var o = [];

			$("#QuickDiag .game-option:checked").each(function () { o.push(this.id.slice(6)); });
			return o;
		}
		// 지금 들어갈 수 있는 방(대기 중 · 비밀번호 없음 · 자리 있음 · 고른 규칙 모두) — ready.js quickTick과 같은 조건
		function count(v, need) {
			var c = { open: 0, wait: 0, play: 0 };
			var i, r;

			for (i in $data.rooms) {
				r = $data.rooms[i];
				if (String(r.mode) !== String(v)) continue;
				if (r.gaming) c.play++;
				else c.wait++;
				if (r.gaming || r.password || r.players.length >= r.limit) continue;
				if (need.some(function (k) { return !r.opts[k]; })) continue;
				c.open++;
			}
			return c;
		}
		function draw() {
			var v = $("#quick-mode").val(), need = conds(), per = {}, cards = [];
			var on, name, prefix, c, picked = [];

			LANG_GROUPS.forEach(function (g) { per[g.lang] = 0; });
			$("#quick-mode option").each(function () {
				var l = langOf(this.value), cc = count(this.value, this.value === v ? need : []);

				per[l] += cc.open;
				if (l === lang) cards.push({ v: this.value, t: $(this).text(), c: cc, i: cards.length });
			});
			$langs.empty();
			LANG_GROUPS.forEach(function (g) {
				$langs.append($("<button type='button'>").addClass("nk-seg-btn").toggleClass("on", g.lang === lang).attr('data-lang', g.lang)
					.append($("<label>").text(text(g.key)), $("<b>").text(per[g.lang])));
			});
			// 방이 있는 모드를 앞으로 (같으면 원래 순서)
			cards.sort(function (a, b) { return (b.c.open - a.c.open) || (b.c.wait + b.c.play - a.c.wait - a.c.play) || (a.i - b.i); });
			prefix = text(LANG_GROUPS.filter(function (g) { return g.lang === lang; })[0].key) + " ";
			$modes.empty();
			cards.forEach(function (o) {
				var any = o.c.wait + o.c.play;
				var sub = any ? [o.c.wait ? text('nkQkWait').replace('{V1}', o.c.wait) : "", o.c.play ? text('nkQkPlay').replace('{V1}', o.c.play) : ""].filter(Boolean).join(" · ") : text('nkQkNone');

				$modes.append($("<button type='button'>").addClass("nk-qk-mode").toggleClass("on", o.v === v).toggleClass("is-none", !o.c.open)
					.attr('data-mode', o.v).append(
						$("<b>").text(o.t.indexOf(prefix) === 0 ? o.t.slice(prefix.length) : o.t),
						$("<small>").text(sub),
						$("<em>").addClass("nk-qk-n").text(o.c.open)
					));
			});
			on = syncConds(RULE[MODE[v]] ? RULE[MODE[v]].opts : []);
			$("#QuickDiag .game-option:checked").each(function () { picked.push(optLabel(OPTIONS[codeOf(this.id.slice(6))].name)); });
			$fold.toggleClass("open", open).toggle(!!$conds.find(".nk-fd-chips").not(".nk-hide").length)
				.children("label").text(text('nkQkConds') + (picked.length ? " (" + picked.join(", ") + ")" : ""));
			$conds.toggle(open);
			c = count(v, need);
			name = $("#quick-mode option:selected").text();
			$sum.text(c.open ? text('nkQkSum').replace('{V1}', name).replace('{V2}', c.open) : text('nkQkSumNone'));
			$d.toggleClass("is-busy", busy());
			$sum.toggle(!busy());
		}
		function codeOf(sid) {
			var k;

			for (k in OPTIONS) if (OPTIONS[k].name.toLowerCase() === sid) return k;
		}
	}

	// 연습 · 봇 설정 (#PracticeDiag) — 왼쪽 미리보기 카드(휴대폰은 없음) + 오른쪽 설정
	function initBotDlg() {
		var $d = $stage.dialog.practice, $b = $d.children(".dialog-body");
		var $card = $("<div>").addClass("nk-bot-card"), $av = $("<div>").addClass("moremi nk-bot-av");
		var $name = $("<div>").addClass("nk-bot-name"), $lv = $("<div>").addClass("nk-bot-lv"), $tags = $("<div>").addClass("nk-bot-tags");
		var $form = $("<div>").addClass("nk-bot-form"), $teams = $("<div>").addClass("nk-fd-teams");
		var $range = $("<div>").addClass("nk-bot-range"), $sw = $("<div>").addClass("nk-bot-sw");
		var syncLevel;

		$d.addClass("nk-fdlg nk-bot");
		$card.append($av, $("<div>").addClass("nk-bot-title").append($name, $lv), $tags);
		syncLevel = selSeg($("#practice-level"));
		$form.append(fdRow('selectLevel', $("#practice-level").prev(".nk-fd-seg")).append($("#practice-level")));
		$("#ai-team").addClass("nk-hide").children("option").each(function () {
			var v = this.value;

			$teams.append($("<button type='button'>").addClass("nk-fd-team" + (v !== "0" ? " team-" + v : "")).attr('data-v', v)
				.append(v === "0" ? $("<label>").attr('data-lang-key', 'teamSolo').text(text('teamSolo')) : $("<label>").text($(this).text())));
		});
		$teams.on('click', ".nk-fd-team", function () {
			if ($("#ai-team").prop('disabled')) return;
			$("#ai-team").val($(this).attr('data-v')).trigger('change');
		});
		$form.append(fdRow('team', $teams).append($("#ai-team")));
		$range.append($("#ai-personality"), $("<div>").addClass("nk-bot-ends").append(
			['aiPersonality_long', 'aiPersonality_neutral', 'aiPersonality_aggressive'].map(function (k) { return $("<label>").attr('data-lang-key', k).text(text(k)); })));
		$form.append(fdRow('aiPersonality', $range));
		$form.append(fdRow('aiPreferredChar', $("#ai-preferred-char")));
		[['#ai-fast-mode', 'aiFastMode'], ['#ai-rage-quit', 'aiRageQuit'], ['#ai-mute-game', 'aiMuteGame'], ['#ai-mute-lobby', 'aiMuteLobby']].forEach(function (p) {
			$sw.append($("<label>").addClass("nk-bot-swrow").attr('for', p[0].slice(1)).append(
				$("<div>").attr('data-lang-key', p[1]).text(text(p[1])), $(p[0]).addClass("nk-switch")));
		});
		$form.append($sw);
		$b.children().not(".tail-button").addClass("nk-hide");
		$b.prepend($("<div>").addClass("nk-bot-main").append($card, $form));

		$d.on('change input click', function () { setTimeout(sync, 0); });
		onShow($d, function () {
			var bot = !$("#ai-team").prop('disabled') && $data.robots && $data.robots[$data._profiled];
			var u = bot && $data.users && $data.users[$data._profiled];

			renderMoremi($av, (u && u.equip) || (bot && bot.equip) || {});
			$name.text((u && u.profile && (u.profile.title || u.profile.name)) || $d.find(".dialog-title").text());
			sync();
		});

		function sync() {
			var t = $("#ai-team").val(), p = Number($("#ai-personality").val()) || 0;
			var tags = [];

			syncLevel();
			$teams.toggleClass("is-off", $("#ai-team").prop('disabled')).children().each(function () { $(this).toggleClass("on", $(this).attr('data-v') === t); });
			$lv.text($("#practice-level option:selected").text());
			tags.push(text(p < -0.3 ? 'aiPersonality_long' : p > 0.3 ? 'aiPersonality_aggressive' : 'aiPersonality_neutral'));
			if (t !== "0") tags.push(text('team') + " " + $("#ai-team option:selected").text());
			if ($("#ai-fast-mode").is(':checked')) tags.push(text('aiFastMode'));
			if ($("#ai-mute-game").is(':checked')) tags.push(text('nkBotChatGame'));
			if ($("#ai-mute-lobby").is(':checked')) tags.push(text('nkBotChatLobby'));
			$tags.empty().append(tags.map(function (s) { return $("<div>").addClass("nk-tag").text(s); }));
			$card.attr('class', "nk-bot-card" + (t !== "0" ? " team-" + t : ""));
		}
	}

	// 알림·확인·입력 등 작은 창 — 아이콘 · 제목 · 내용 · 오른쪽 단추 (CSS nk.css 16). warn: 빨간 아이콘
	var SMALL_DLGS = [
		["#AlertDiag", 'info'], ["#ConfirmDiag", 'help'], ["#InputDiag", 'pencil'], ["#LateJoinDiag", 'gamepad'],
		["#NickSetupDiag", 'user'], ["#ObtainDiag", 'gift'], ["#KickVoteDiag", 'users', true], ["#AfkWarnDiag", 'clock', true]
	];
	function initSmallDlgs() {
		SMALL_DLGS.forEach(function (s) {
			$(s[0]).addClass("nk-sdlg" + (s[2] ? " nk-sdlg-warn" : "")).prepend($("<div>").addClass("nk-sd-ic").html(ico(s[1])));
		});
		// 주제 고르기: 규칙 줄과 같은 체크 목록 (사용자 요청). 기존 label(for)이 체크박스를 켜고 끄므로 모양만 바꿈 (nk.css)
		$("#InjPickDiag, #QuizPickDiag, #SongPickDiag").addClass("nk-fdlg nk-pk");
	}
	my.init = function () {
		var gn = $.trim($("#gn-content").html() || "");

		if (my.phone) phoneUserList();

		// 기존 패널을 신 UI 슬롯으로 옮김 (DOM 이동이라 이벤트 바인딩·ID 유지)
		// 기존 메뉴 버튼은 CSS로 숨기고 동작 줄이 trigger함. 아이템바·레인게임 전략은 .kkutu-menu 안에서 그대로 보임
		$("#nk-actionbar").append($(".kkutu-menu"));
		$("#nk-center-body").append($stage.box.roomList, $stage.box.shop, $stage.box.room, $stage.box.game);
		$("#nk-pbody-users").append($stage.box.userList);
		$("#nk-chat").append($stage.box.chat);
		initRoomTools();
		initShopTools();
		initRank();
		// 랭킹: 신 UI는 한 페이지 50개 — 기존 랭킹 요청(탭·이전·다음·내 순위)에 개수만 붙임
		$.ajaxPrefilter(function (o) {
			if (/^\/ranking(\?|$)/.test(o.url)) o.url += (o.url.indexOf("?") === -1 ? "?" : "&") + "n=50";
		});
		initDict();
		initHelp();
		initIntro();
		buildSettings();
		buildProfile();
		initRoomDlg();
		initQuickDlg();
		initBotDlg();
		initSmallDlgs();
		initSegSlide();
		initGameH();
		$stage.box.room.children(".product-title").after($("<div>").addClass("nk-roomhead").attr('id', "nk-roomhead"));

		// 방 대기 화면(데스크톱)은 오른쪽 열을 [채팅 | 접속자 | 친구] 탭 하나로 — 채팅이 열 전체 높이 (사용자 결정, 정리안)
		$(".nk-ptabs").prepend($("<button type='button'>").addClass("nk-ptab nk-ptab-chat").attr('data-ptab', "chat")
			.html(ico('chat') + "<label></label>").children("label").text(text('Chat').replace(/FA\{[^}]*\}/g, "")).end());
		$(".nk-ptab").on('click', function () { setPeopleTab($(this).attr('data-ptab')); });
		$("#nk-user-q").on('input', function () {
			var i;

			userQ = $.trim($(this).val()).toLowerCase();
			for (i in $data.users) $("#users-item-" + i).toggleClass("nk-hide", !userMatch($data.users[i]));
		});
		$("#nk-friend-add").on('click', function () { $("#comm-friend-add").trigger('click'); });

		// 공지
		if (gn.length > 1) $("#nk-notice-text").html(my._gn = gn);
		else $("#nk-notice").addClass("is-empty");
		$("#nk-notice-close").on('click', function () { $("#nk-notice").addClass("is-empty"); });

		$("#nk-account").on('click', function (e) { openAccount(e.currentTarget); });
		$(window).on('resize', function () { layoutNav(); closePop(); });
		$(document).on('keydown.nkesc', function (e) {
			if (e.which !== 27) return;
			closePop();
			if (my.phone) closeSheet();
		});
		// 마우스를 올리는 툴팁은 터치에서 눌러도 뜬 채 남으므로 휴대폰·태블릿에서는 쓰지 않음
		if (!my.touch) $(document).on('mouseenter', "[data-nk-tip]", tipShow).on('mousemove', "[data-nk-tip]", tipMove).on('mouseleave', "[data-nk-tip]", tipHide);
		else {
			// 방 카드 안(규칙 줄)은 말풍선 없이 그대로 입장 — 모든 규칙은 ⓘ 방 정보로 봄
			$(document).on('click', "[data-nk-tip]", function (e) {
				if ($(e.currentTarget).closest(".nk-room").length) return;
				tapTip(e);
			});
			$(document).on('touchstart mousedown', function (e) {
				if (my._tipOwner && !$(e.target).closest(my._tipOwner).length) tapTipHide();
			});
			document.addEventListener('scroll', function () { if (my._tipOwner) tapTipHide(); }, true);
		}
		if (window.ResizeObserver) new ResizeObserver(function () { layoutNav(); }).observe(document.getElementById("nk-nav"));
		// 게임 화면: 칸 크기가 바뀌면(창 크기, 채팅 줄 등) 단어 창 글자를 다시 맞춤 — 다음 프레임에 한 번만 (ResizeObserver 반복 경고 방지)
		if (window.ResizeObserver) new ResizeObserver(function () {
			if (my._only !== 'for-gaming' || my._fitRaf) return;
			my._fitRaf = requestAnimationFrame(function () {
				my._fitRaf = 0;
				if (my._only === 'for-gaming') fitGame();
			});
		}).observe(document.getElementById("nk-center-body"));
		watchDialogs();
		if (my.phone) initPhone();

		my._inited = true;
		my._only = getOnly();
		renderNav();
		renderActions();
		my.renderFriends();
	};
	// 리플레이: 기존 코드는 로비 상태 그대로 게임 화면만 띄우므로(updateUI를 거치지 않음), 신 UI는 게임 중과 같은 배치로 바꿈.
	// 끝나면 replayStop → updateUI → onState(로비)로 돌아옴
	my.setReplay = function (on) {
		var $bar = $("#nk-replay").empty();

		my._replay = !!on;
		if (on) root.setAttribute('data-nk-replay', "");
		else root.removeAttribute('data-nk-replay');
		if (!on || !my._inited) return;
		// 로비에 열려 있던 상점·가운데 화면(사전·랭킹·도움말)은 닫음 — 기존 코드는 방 목록만 숨김.
		// 상점 단추 처리는 updateUI를 불러 리플레이를 끝내므로 직접 닫음
		if ($data._shop) {
			$data._shop = false;
			$stage.menu.shop.removeClass("toggled");
		}
		$stage.box.shop.hide();
		my._page = null;
		// 진행 시간(replayStatus가 갱신)과 ← ❚❚ → (기존 순서는 float: right로 뒤집혀 보였으므로 CSS에서 거꾸로 놓음)
		$bar.append($data.$gpt, $data.$gpc);
		$data.$gpc.children("button").addClass("nk-btn");
		my.onState('for-gaming');
		// 오른쪽 묶음 순서: 리플레이 조작 · 나가기 · 계정 (onState가 나가기 줄을 맨 앞에 넣으므로 그 앞으로)
		$("#nk-head-end").prepend($bar);
		my.renderGameHead();
	};
	my.onState = function (only) {
		var place = only === 'for-lobby' ? 'lobby' : only === 'for-gaming' ? 'gaming' : 'room';
		var prev = root.getAttribute('data-nk-place');

		if (!my._inited) return;
		my._only = only;
		root.setAttribute('data-nk-place', place);
		if (place !== 'gaming') releaseGameLayout();
		if (my.phone) phoneState(place, prev);
		// 화면 전환 효과 (nk.css): 방 → 게임은 방 화면이 왼쪽으로 빠지고 게임 화면이 나타나며 채팅이 아래에서 올라옴,
		// 게임 → 방은 방 화면이 다시 나타남. updateUI가 자주 불리므로 바뀌는 순간에만 잠깐 켬
		if (prev && prev !== place && (place === 'gaming' || prev === 'gaming')) {
			root.setAttribute('data-nk-anim', place === 'gaming' ? 'game' : 'room');
			clearTimeout(my._animTimer);
			my._animTimer = setTimeout(function () { root.removeAttribute('data-nk-anim'); }, 900);
		}
		// 게임 중에는 나가기 줄을 상단 바 오른쪽 묶음(계정 앞)으로, 끝나면 원래 자리로. 확대 배율은 게임 화면이 보인 뒤 맞춤
		if (prev !== place) {
			if (place === 'room') setPeopleTab('chat');
			else if ($("#nk-people").attr('data-ptab') === 'chat') setPeopleTab('users');
			// 데스크톱 로비: 공지는 동작 줄의 단추 오른쪽 빈자리를 다 씀 (사용자 결정), 방·게임에서는 원래 자리(머리줄 아래)
			if (!my.phone) {
				if (place === 'lobby') $("#nk-actionbar").append($("#nk-notice"));
				else $("#nk-notice").insertAfter($("#nk-app > .nk-header"));
			}
		}
		if (prev !== place && (place === 'gaming' || prev === 'gaming')) {
			// 아이템·전략 단추는 게임 판의 입력창 아래 줄로 (사용자 결정 — 휴대폰 M2, 데스크톱도 같이), 끝나면 원래 자리(.kkutu-menu 끝)로
			if (place === 'gaming') {
				$("#nk-head-end").prepend($("#nk-actionbar"));
				$stage.box.game.children(".product-body").append($(".ItemBar, #raingame-strategy"));
			} else {
				$("#nk-center").prepend($("#nk-actionbar"));
				$(".kkutu-menu").append($(".ItemBar, #raingame-strategy"));
				my._round = 0;
			}
			setTimeout(fitGame, 0);
		}
		// 기본 UI는 방·게임 화면에서 접속자 목록을 숨기지만, 신 UI는 오른쪽 열에 둠 (게임 중에는 nk.css가 숨김)
		$stage.box.userList.show();
		applyPage();
		renderNav();
		renderActions();
		my.renderAccount();
	};

	return my;
})();

$(document).ready(function () {
	if (NK.active) NK.init();
});
