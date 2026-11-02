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

(function(){
	var $stage;
	var LIMIT = 400;
	var LIST;
	// 신형 포탈(신 UI): portal.pug의 Preload가 html[data-ui="new"]를 정함. 화면은 portal_nk.pug, 모양은 nk_portal.css
	var NP = document.documentElement.getAttribute('data-ui') === 'new';

	// 신 UI 보조 색 — 포탈은 게임 쪽 nk-boot.js를 읽지 않으므로 그 applyColors와 같은 계산을 여기서 함.
	// 한쪽 식을 고치면 다른 쪽도 같이 고칠 것. 번들은 <head>에서 실행되므로 layout.pug의 첫 테마 적용보다 먼저 감쌈
	if (NP && window.ThemeEngine) (function () {
		var _themeApply = window.ThemeEngine.apply;

		window.ThemeEngine.apply = function (themeName, darkSetting) {
			var g = _themeApply.apply(this, arguments);
			try { npColors(themeName || 'blue', darkSetting || 'light', g); } catch (e) { }
			return g;
		};
	})();
	function npClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
	function npOklchToLinear(L, C, H) {
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
	function npInGamut(c) { return c[0] >= -1e-4 && c[0] <= 1.0001 && c[1] >= -1e-4 && c[1] <= 1.0001 && c[2] >= -1e-4 && c[2] <= 1.0001; }
	function npOklchToHex(L, C, H) {
		var lo = 0, hi = C, mid, i, rgb = npOklchToLinear(L, C, H);

		if (!npInGamut(rgb)) {
			for (i = 0; i < 24; i++) {
				mid = (lo + hi) / 2;
				if (npInGamut(npOklchToLinear(L, mid, H))) lo = mid; else hi = mid;
			}
			rgb = npOklchToLinear(L, lo, H);
		}
		return '#' + rgb.map(function (c) {
			c = npClamp(c, 0, 1);
			c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
			var x = Math.round(c * 255).toString(16);
			return x.length === 1 ? '0' + x : x;
		}).join('');
	}
	// nk-boot.js applyColors에서 포탈이 쓰는 값만(장식 그라데이션 끝색 --nk-accent-2는 단색 고정이라 뺌)
	// 값만 계산 (null = 그 속성을 지움). 커스텀 테마 편집 창 미리보기도 같은 값을 씀
	function npColorVars(inputs, dark, g) {
		var TE = window.ThemeEngine;
		var p = TE.hexToOklch(g.primary.hex), m = TE.hexToOklch(inputs.medium), p0 = TE.hexToOklch(inputs.primary);
		var neutral = p0.C < 0.02 && m.C < 0.02;
		var mC = (neutral || m.C < 0.02) ? 0 : m.C;
		var accent, white, black, second, ink, L, i;
		var R = { '--nk-accent-d': null, '--nk-accent-ink-d': null };

		accent = g.primary.hex;
		if (dark) {
			accent = npOklchToHex(0.7, Math.min(0.19, p.C * 1.9), p.H);
			R['--nk-accent-d'] = accent;
			R['--nk-accent-ink-d'] = npOklchToHex(0.82, Math.min(0.15, p.C * 1.5), p.H);
		}
		white = TE.contrastRatio('#FFFFFF', accent);
		black = TE.contrastRatio('#141414', accent);
		second = dark ? npOklchToHex(0.78, Math.min(mC, 0.12), m.H) : inputs.medium;
		L = dark ? 0.8 : 0.5;
		for (i = 0; i < 25; i++) {
			ink = npOklchToHex(L, mC ? Math.min(Math.max(mC, 0.04), 0.16) : 0, m.H);
			if (TE.contrastRatio(ink, g.bgLight.hex) >= 5) break;
			L += dark ? 0.02 : -0.025;
		}
		R['--nk-on-accent'] = (white >= 3 || white >= black) ? '#FFFFFF' : '#141414';
		R['--nk-second'] = second;
		R['--nk-second-ink'] = ink;
		return R;
	}
	function npSetVars(style, vars) {
		var k;

		for (k in vars) {
			if (vars[k] === null) style.removeProperty(k);
			else style.setProperty(k, vars[k]);
		}
	}
	function npColors(themeName, darkSetting, g) {
		var TE = window.ThemeEngine;

		npSetVars(document.body.style, npColorVars(TE.baseColorsFor(themeName), TE.isDarkActive(darkSetting), g));
	}

	$(document).ready(function(){
		try {
			var savedLang = localStorage.getItem('kkutu_lang');
			var match = location.href.match(/[?&]locale=([^&#]+)/);
			var urlLang = match ? match[1] : null;
			var currentLang = urlLang || "ko_KR";
			if (savedLang && savedLang !== currentLang) {
				var search = location.search;
				if (search.indexOf('locale=') >= 0) {
					search = search.replace(/locale=[^&]+/, 'locale=' + savedLang);
				} else {
					search = search + (search ? '&' : '?') + 'locale=' + savedLang;
				}
				location.replace(location.pathname + search);
				return;
			}
		} catch (e) {}

		$stage = {
			list: $("#server-list"),
			total: $("#server-total"),
			start: $("#game-start"),
			ref: $("#server-refresh"),
			refi: $("#server-refresh>i")
		};

		$("#Background").attr('src', "").addClass("jt-image").css({
			'background-image': "url(/img/kkutu/gamebg.png)",
			'background-size': "200px 200px"
		});
		$stage.start.prop('disabled', true).on('click', function(e){
			var i, j;

			if($stage.start.attr('data-guest-blocked') === 'true'){
				return location.href = "/login?desc=login_kkutu";
			}
			if($("#account-info").html() === L['LOGIN']){
				return $("#server-0").trigger('click');
			}
			for(i=0.9; i<1; i+=0.01){
				for(j in LIST){
					if(LIST[j] < i * LIMIT){
						$("#server-" + j).trigger('click');
						return;
					}
				}
			}
		});
		$stage.ref.on('click', function(e){
			if($stage.refi.hasClass("fa-spin")){
				return alert(L['serverWait']);
			}
			$stage.refi.addClass("fa-spin");
			setTimeout(seekServers, 1000);
		});
		setInterval(function(){
			$stage.ref.trigger('click');
		}, 60000);
		seekServers();
		if(NP) initPortal();
	});
	function seekServers(){
		$.get("/servers", function(data){
			var sum = 0;

			$stage.list.empty();
			LIST = data.list;
			data.list.forEach(function(v, i){
				var status = (v === null) ? "x" : "o";
				var people = (status == "x") ? "-" : (v + " / " + LIMIT);
				var limp = v / LIMIT * 100;
				var $e;

				sum += v || 0;
				if(status == "o"){
					if(limp >= 99) status = "q";
					else if(limp >= 90) status = "p";
				}
				$stage.list.append($e = $("<div>").addClass("server").attr('id', "server-" + i)
					.append($("<div>").addClass("server-status ss-" + status))
					.append($("<div>").addClass("server-name").html(L['server_' + i]))
					.append($("<div>").addClass("server-people graph")
						.append($("<div>").addClass("graph-bar").width(limp + "%"))
						.append($("<label>").html(people))
					)
					.append($("<div>").addClass("server-enter").html(L['serverEnter']))
				);
				if (status != "x") $e.on('click', function (e) {
					if($stage.start.attr('data-guest-blocked') === 'true'){
						return location.href = "/login?desc=login_kkutu";
					}
					location.href = "/?server=" + i;
				}); else $e.children(".server-enter").html("-");
			});
			$stage.total.html("&nbsp;" + L['TOTAL'] + " " + sum + L['MN']);
			$stage.refi.removeClass("fa-spin");
			$stage.start.prop('disabled', false);
			if(NP) $("#np-start").prop('disabled', false);
		});
	}

	/* ------------------------------------------------------------------
	   신형 포탈 — 기존 단추(#game-start, #account-info)는 숨긴 채 두고 trigger만 함 → 시작·로그인 동작은 기존 그대로
	   ------------------------------------------------------------------ */
	function npL(key, v1){
		return (L[key] || key).replace("{V1}", v1);
	}
	function npMsg(key){
		return $("<div>").addClass("np-msg").text(L[key]);
	}
	function npIcon(id){
		return "<svg class='np-i'><use href='#np-i-" + id + "'/></svg>";
	}
	function npCommify(n){
		return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	function initPortal(){
		var $p = $("#nk-portal");

		$("#np-start").on('click', function(){ $stage.start.trigger('click'); });
		// 계정 단추: 로그인했으면 내 프로필 창, 아니면 기존 로그인 동작
		$("#np-account").on('click', function(){
			if($p.attr('data-me')) openProfile();
			else $("#account-info").trigger('click');
		});
		// 모드 카드·모든 모드 → 도움말의 게임 유형 설명을 창으로 (도움말 페이지로 이동하지 않음)
		$p.on('click', ".np-mode", function(){ openModes($(this).attr('data-help')); });
		$("#np-modes-all").on('click', function(){ openModes(); });
		$("#np-modal-close").on('click', closeModes);
		$("#np-modal").on('click', function(e){ if(e.target === this) closeModes(); });
		$("#np-modal-nav").on('click', ".np-nav-item", function(){ showMode($(this).attr('data-id')); });
		$(document).on('keydown', function(e){
			if(e.keyCode != 27) return;
			// 맨 위 창 하나만 닫음
			if($("#np-msg").hasClass("on")) return closeMsg(false);
			if($("#np-theme").hasClass("on")) return closeOverlay("#np-theme");
			if($("#np-prof").hasClass("on")) return closeOverlay("#np-prof");
			closeModes();
			closeSettings();
		});
		// 업데이트 로그
		$("#np-upd-tabs").on('click', "button", function(){
			$(this).addClass("on").siblings().removeClass("on");
			drawBulletin($(this).attr('data-tab'));
		});
		$("#np-upd-body").on('click', ".np-ver-h", function(){ $(this).parent().toggleClass("open"); });
		initNotice();
		$("#np-updp-tabs").on('click', "button", function(){
			$(this).addClass("on").siblings().removeClass("on");
			drawUpdPage($(this).attr('data-tab'));
		});
		loadBulletin();
		// 랭킹 (첫 화면 10명 + 전체 랭킹 화면 #ranking)
		$("#np-rank .np-rank-tabs").on('click', "button", function(){
			$(this).addClass("on").siblings().removeClass("on");
			RANK.homeType = $(this).attr('data-type');
			loadRankHome();
		});
		$("#np-rank-page .np-rank-tabs").on('click', "button", function(){
			$(this).addClass("on").siblings().removeClass("on");
			RANK.type = $(this).attr('data-type');
			loadRankPage(0);
		});
		$("#np-rank-all").on('click', function(){
			VIEW.pushed = true;
			location.hash = "ranking";
		});
		$("#np-rank-prev").on('click', function(){ loadRankPage(RANK.page - 1); });
		$("#np-rank-next").on('click', function(){ loadRankPage(RANK.page + 1); });
		$("#np-rank-mine").on('click', findMyRank);
		// 전체 화면(#ranking, #help, #updates): 포탈 안 링크로 들어왔으면 돌아가기 = 브라우저 뒤로
		$p.on('click', "a[href^='#']", function(){ VIEW.pushed = true; });
		$p.on('click', ".np-view-back", function(){
			if(VIEW.pushed) history.back();
			else location.hash = "";
		});
		// 도움말 화면
		$("#np-help-nav").on('click', ".np-hn-item", function(){ pickHelp($(this).attr('data-id')); })
			.on('click', ".np-hn-gh", function(){ $(this).parent().toggleClass("collapsed"); });
		$("#np-help-prev, #np-help-next").on('click', function(){ pickHelp($(this).attr('data-id')); });
		$("#np-help-q").on('input', function(){ filterHelp($(this).val()); });
		initSettings();
		$(window).on('hashchange', applyHash);
		loadRankHome();
		applyHash();
	}

	/* 위쪽 공지 — 기존 틀의 전체 공지(#gn-content: 손님 차단·이벤트·global_notice.html)를 그대로 옮겨 보임 (게임 신 UI nk.js와 같은 출처).
	   화면 위에 떠 있는 띠(nk_portal.css)라 스크롤해도 보임. 닫으면 이번 화면에서만 숨김 */
	function initNotice(){
		var gn = $.trim($("#gn-content").html() || "");

		if(gn.length > 1){
			$("#np-notice-text").html(gn);
			$("#np-notice").addClass("on");
		}
		$("#np-notice-close").on('click', function(){ $("#np-notice").removeClass("on"); });
	}

	/* 업데이트 로그 — 글과 목차만 있는 kkutu_bulletin.html(목차 nav + section#updates/#issues/#plans > article)을 읽어 그림.
	   그 파일에 걸린 기본 모양(kkutu_bulletin.css)은 쓰지 않음(DOMParser는 스타일을 읽지 않음) */
	var BULL = null;
	function loadBulletin(){
		$.get("/kkutu_bulletin.html", function(html){
			var doc = new DOMParser().parseFromString(html, "text/html");

			$(doc).find("script").remove();
			BULL = { updates: [], issues: doc.getElementById("issues"), plans: doc.getElementById("plans") };
			$(doc.getElementById("updates")).children("article").each(function(){
				var title = $.trim($(this).children("h3").first().text());
				// "N0.8.6b [261031]" → 버전 N0.8.6b, 날짜 2026.10.31
				var m = title.match(/^(.*?)\s*\[(\d\d)(\d\d)(\d\d)\]$/);

				BULL.updates.push({
					ver: m ? m[1] : title,
					date: m ? "20" + m[2] + "." + m[3] + "." + m[4] : "",
					items: $(this).find("li").map(function(){ return this.innerHTML; }).get(),
					node: this
				});
			});
			drawLatest();
			drawBulletin($("#np-upd-tabs > .on").attr('data-tab'));
			drawUpdPage($("#np-updp-tabs > .on").attr('data-tab'));
		}).fail(function(){
			$("#np-upd-body, #np-updp-body").empty().append(npMsg('npLoadFail'));
		});
	}
	function drawLatest(){
		var u = BULL.updates[0];
		var first;

		if(!u) return;
		first = $("<div>").html(u.items[0] || "").text();
		$("#np-latest-title").text(npL('npLatest', u.ver));
		$("#np-latest-sub").text(u.date + (first ? " · " + first : "") + (u.items.length > 1 ? " " + npL('npMoreItems', u.items.length - 1) : ""));
		$("#np-latest").show();
	}
	function drawBulletin(tab){
		var $b = $("#np-upd-body").empty();

		if(!BULL) return $b.append(npMsg('npLoading'));
		if(tab == "updates"){
			// 최신 버전만 펼치고 그 아래 3개는 접음. 전부는 "전체 보기"(#updates 화면)
			BULL.updates.slice(0, 4).forEach(function(u, i){
				var $ul = $("<ul>");

				u.items.forEach(function(item){ $ul.append($("<li>").html(item)); });
				$b.append($("<div>").addClass("np-ver" + (i ? "" : " open"))
					.append($("<button type='button'>").addClass("np-ver-h")
						.append($("<div>").text(u.ver))
						.append($("<div>").addClass("np-ver-date").text(u.date))
						.append($("<div>").addClass("np-ver-n").text(npL('npChanges', u.items.length)))
						.append(npIcon('down'))
					)
					.append($ul)
				);
			});
		}else{
			// 알려진 문제·추가 예정: 묶음 제목(h3)과 목록(ul)만 옮김
			$(BULL[tab]).children("article").children("h3, ul").each(function(){
				var $ul;

				if(this.tagName == "H3") return $b.append($("<div>").addClass("np-list-h").text($.trim($(this).text())));
				$ul = $("<ul>").addClass("np-list");
				$(this).children("li").each(function(){ $ul.append($("<li>").html(this.innerHTML)); });
				$b.append($ul);
			});
		}
		if(!$b.children().length) $b.append(npMsg('npEmpty'));
	}
	// 업데이트 로그 화면(#updates): 고른 칸의 내용 전체(목록·표·글)를 그대로 옮김. 버전 제목만 버전·날짜로 나눠 그림
	function drawUpdPage(tab){
		var $b = $("#np-updp-body").empty();

		if(!BULL) return $b.append(npMsg('npLoading'));
		if(tab == "updates"){
			BULL.updates.forEach(function(u){
				$b.append($("<div>").addClass("np-updp-ver")
					.append($("<div>").addClass("np-updp-h")
						.append($("<div>").text(u.ver))
						.append($("<div>").addClass("np-ver-date").text(u.date))
					)
					.append($("<div>").addClass("np-updp-doc").append($(u.node).children().not($(u.node).children("h3").first()).clone()))
				);
			});
		}else{
			$(BULL[tab]).children("article").each(function(){
				$b.append($("<div>").addClass("np-updp-doc").append($(this).children().clone()));
			});
		}
		if(!$b.children().length) $b.append(npMsg('npEmpty'));
	}

	/* 랭킹 — /ranking?names=1 (접속하지 않은 유저 이름도 받음. 지금은 서버가 늘 붙여 줌). 레벨은 게임(body.js·ready.js)과 같은 계산 */
	var RANK = { homeType: 'exp', type: 'exp', page: 0, loaded: false, seq: 0, homeSeq: 0 };
	var MAX_LEVEL = 720, STAR_LEVEL = 360;
	var EXP = null;
	function getRequiredScore(lv){
		return Math.round(
			(!(lv % 5) * 0.3 + 1) * (!(lv % 15) * 0.4 + 1) * (!(lv % 45) * 0.5 + 1) * (
				120 + Math.floor(lv / 5) * 60 + Math.floor(lv * lv / 225) * 120 + Math.floor(lv * lv / 2025) * 180
			)
		);
	}
	function getLevel(score){
		var i, l, rawExp;

		if(!EXP){
			EXP = [];
			rawExp = [getRequiredScore(1)];
			for(i = 2; i < MAX_LEVEL; i++) rawExp.push(rawExp[i - 2] + getRequiredScore(i));
			for(i = 0; i < rawExp.length; i++){
				if(i < STAR_LEVEL || (i - STAR_LEVEL) % 3 == 2) EXP.push(rawExp[i]);
			}
			EXP.push(Infinity, Infinity);
		}
		l = EXP.length;
		for(i = 0; i < l; i++) if(score < EXP[i]) break;
		return i + 1;
	}
	function levelIcon(lv){
		var pack;
		var i = lv - 1;

		try{ pack = (JSON.parse(localStorage.getItem("kkutu_volume")) || {}).levelPack; }catch(e){}
		if(i >= STAR_LEVEL) i += 15;
		return $("<div>").css({
			'background-image': "url('/img/kkutu/lv/" + (pack || "newlv") + ".png')",
			'background-position': ((i % 25) * -100) + "% " + (Math.floor(i * 0.04) * -100) + "%",
			'background-size': "2560%"
		});
	}
	function rankRow(item, me){
		var lv = getLevel(Number(item.expScore));
		var rank = item.rank + 1;

		return $("<div>").addClass("np-rk" + (item.id == me ? " me" : ""))
			.append($("<div>").addClass("np-rk-n" + (rank <= 3 ? " m" + rank : "")).text(npCommify(rank)))
			.append($("<div>").addClass("np-rk-lv").append(levelIcon(lv)).append($("<div>").text(lv > STAR_LEVEL ? "s" + (lv - STAR_LEVEL) : lv)))
			.append($("<div>").addClass("np-rk-name" + (item.name ? "" : " hidden")).text(item.name || L['hidden']))
			.append($("<div>").addClass("np-rk-s").text(npCommify(Number(item.score))));
	}
	function loadRankHome(){
		var me = $("#nk-portal").attr('data-me');
		var type = RANK.homeType;
		var seq = ++RANK.homeSeq;

		$.get("/ranking?names=1&type=" + type, function(res){
			var $l = $("#np-rank-list");
			var mine = false;

			if(seq != RANK.homeSeq) return;
			$l.empty();
			if(!res.data || !res.data.length) return $l.append(npMsg('npEmpty'));
			res.data.slice(0, 10).forEach(function(item){
				if(item.id == me) mine = true;
				$l.append(rankRow(item, me));
			});
			// 로그인했고 10위 안이 아니면 내 줄을 아래에 덧붙임
			if(me && !mine) $.get("/ranking?names=1&type=" + type + "&id=" + encodeURIComponent(me), function(r){
				var i;

				if(seq != RANK.homeSeq || !r.data) return;
				for(i in r.data) if(r.data[i].id == me) return $l.append(rankRow(r.data[i], me));
			});
		}).fail(function(){
			if(seq == RANK.homeSeq) $("#np-rank-list").empty().append(npMsg('npLoadFail'));
		});
	}
	function loadRankPage(pg, toMe){
		var me = $("#nk-portal").attr('data-me');
		var seq = ++RANK.seq;

		if(pg < 0) return;
		$("#np-rank-prev, #np-rank-next").prop('disabled', true);
		$.get("/ranking?names=1&n=50&type=" + RANK.type + "&p=" + pg, function(res){
			var $l = $("#np-rank-full");

			if(seq != RANK.seq) return;
			$l.empty();
			RANK.page = pg;
			RANK.loaded = true;
			(res.data || []).forEach(function(item){ $l.append(rankRow(item, me)); });
			if(!$l.children().length) $l.append(npMsg('npEmpty'));
			$("#np-rank-pg").text(L['page'] + " " + (pg + 1));
			$("#np-rank-prev").prop('disabled', pg <= 0);
			$("#np-rank-next").prop('disabled', !res.data || res.data.length < 50);
			if(toMe && $l.children(".me").length) $l.children(".me")[0].scrollIntoView({ block: 'center' });
		}).fail(function(){
			if(seq == RANK.seq) $("#np-rank-full").empty().append(npMsg('npLoadFail'));
		});
	}
	// 내 순위: 내 주변을 받아 순위를 알아낸 뒤 그 순위가 있는 50개 페이지를 엶
	function findMyRank(){
		var me = $("#nk-portal").attr('data-me');

		if(!me) return;
		$.get("/ranking?type=" + RANK.type + "&id=" + encodeURIComponent(me), function(r){
			var i;

			if(r.data) for(i in r.data) if(r.data[i].id == me) return loadRankPage(Math.floor(r.data[i].rank / 50), true);
		});
	}
	/* 전체 화면 — 주소 #ranking / #help / #updates 로 열고 닫음 (뒤로 가기 됨) */
	var VIEW = { pushed: false };
	function applyHash(){
		var view = { "#ranking": "ranking", "#help": "help", "#updates": "updates" }[location.hash];

		closeModes();
		if(!view){
			VIEW.pushed = false;
			$("#nk-portal").removeAttr('data-view');
			return;
		}
		$("#nk-portal").attr('data-view', view);
		window.scrollTo(0, 0);
		if(view == "ranking" && !RANK.loaded){
			RANK.type = RANK.homeType;
			$("#np-rank-page .np-rank-tabs > button").each(function(){ $(this).toggleClass("on", $(this).attr('data-type') == RANK.type); });
			loadRankPage(0);
		}
		if(view == "help") openHelp();
	}

	/* 도움말 — 기존 도움말 페이지(/help)의 목차(#list)와 본문(.page-body)을 한 번만 가져와 두 곳에서 씀. 스크립트는 실행하지 않음(DOMParser).
	   ① 도움말 화면(#help): 신 UI 로비 도움말(nk.js loadHelp·helpNav·showHelp·filterHelp)과 같은 동작
	   ② 게임 모드 설명 창: 목차 중 "게임 유형"(li#c3)만
	   항목 id(li#c3p5 → div.page-body#box-c3p5)는 help.pug에 직접 적힌 것을 그대로 씀 */
	var HELP = { state: 0, wait: [], list: null, pages: {}, titles: {}, path: {}, order: [], cur: null, navReady: false, modesReady: false, modeFirst: null };
	function loadHelp(cb){
		if(HELP.state == 2) return cb(true);
		HELP.wait.push(cb);
		if(HELP.state == 1) return;
		HELP.state = 1;
		$.get("/help", function(html){
			var doc = new DOMParser().parseFromString(html, "text/html");
			var lp;

			HELP.list = doc.getElementById("list");
			if(!HELP.list) return helpDone(false);
			$(doc).find("script").remove();
			// 레벨 아이콘 표: 설정한 레벨 아이콘으로 (nk.js·기존 도움말 페이지와 같은 처리)
			try{ lp = (JSON.parse(localStorage.getItem("kkutu_volume")) || {}).levelPack; }catch(e){}
			$(doc).find(".page-body").each(function(){
				if(lp) $(this).find("[style*='newlv.png']").css('background-image', "url('/img/kkutu/lv/" + lp + ".png')");
				HELP.pages[this.id.replace(/^box-/, "")] = document.importNode(this, true);
			});
			HELP.titles.intro = L['nkHelpHome'];
			HELP.path.intro = [];
			HELP.order = ['intro'];
			helpIndex($(HELP.list), []);
			helpDone(true);
		}).fail(function(){ helpDone(false); });
	}
	function helpDone(ok){
		var wait = HELP.wait;

		HELP.state = ok ? 2 : 0;
		HELP.wait = [];
		wait.forEach(function(cb){ cb(ok); });
	}
	// 목차 순서·제목·경로(묶음 이름들)
	function helpIndex($ul, trail){
		$ul.children("li").each(function(){
			var $li = $(this), label = $.trim($li.children("label").text()), id = $li.attr('id');

			if($li.children("ul").length) helpIndex($li.children("ul"), trail.concat(label));
			else if(HELP.pages[id]){
				HELP.order.push(id);
				HELP.titles[id] = label;
				HELP.path[id] = trail;
			}
		});
	}
	// 본문 노드는 한 곳에만 있을 수 있으므로 보여 줄 때마다 그 자리로 옮김
	function helpPage(id, $box){
		HELP.pages[id].style.display = "";
		$box.empty().append(HELP.pages[id]).scrollTop(0);
	}

	/* ① 도움말 화면 */
	function openHelp(){
		if(HELP.navReady) return showHelp(HELP.cur);
		$("#np-help-nav").empty().append(npMsg('nkHelpLoading'));
		loadHelp(function(ok){
			if(!ok) return $("#np-help-nav").empty().append(npMsg('nkHelpFail'));
			$("#np-help-nav").empty()
				.append($("<button type='button'>").addClass("np-hn-item np-hn-home").attr('data-id', "intro").text(L['nkHelpHome']))
				.append(helpNav($(HELP.list)));
			HELP.navReady = true;
			showHelp('intro');
		});
	}
	// 목차: 하위 목록이 있는 항목은 접히는 묶음, 나머지는 본문 항목
	function helpNav($ul){
		var $box = $("<div>").addClass("np-hn-items");

		$ul.children("li").each(function(){
			var $li = $(this), label = $.trim($li.children("label").text()), $sub = $li.children("ul"), id = $li.attr('id');

			if($sub.length){
				$box.append($("<div>").addClass("np-hn-group collapsed")
					.append($("<button type='button'>").addClass("np-hn-gh").html(npIcon('down')).append($("<div>").text(label)))
					.append(helpNav($sub)));
			}else if(HELP.pages[id]){
				$box.append($("<button type='button'>").addClass("np-hn-item").attr('data-id', id).text(label));
			}
		});
		return $box;
	}
	// 목차·이전/다음으로 고를 때. 휴대폰은 본문이 목차 아래에 있으므로 고른 항목 제목으로 내려 줌 (nk_portal.css 8)
	function pickHelp(id){
		showHelp(id);
		if(document.documentElement.getAttribute('data-nk-device') === 'phone') document.getElementById("np-help-crumb").scrollIntoView({ block: 'start' });
	}
	function showHelp(id){
		var i, prev, next, $item;

		if(!HELP.pages[id]) id = 'intro';
		if(!HELP.pages[id]) return;
		HELP.cur = id;
		helpPage(id, $("#np-help-doc"));
		$("#np-help-title").text(HELP.titles[id]);
		$("#np-help-crumb").text(HELP.path[id].join(" › "));
		$("#np-help-nav .np-hn-item.on").removeClass("on");
		$item = $("#np-help-nav .np-hn-item[data-id='" + id + "']").addClass("on");
		$item.parents(".np-hn-group").removeClass("collapsed");
		if($item.length && $item[0].scrollIntoView) $item[0].scrollIntoView({ block: 'nearest' });
		i = HELP.order.indexOf(id);
		prev = HELP.order[i - 1];
		next = HELP.order[i + 1];
		$("#np-help-prev").prop('disabled', !prev).attr('data-id', prev || "");
		$("#np-help-prev-t").text(prev ? HELP.titles[prev] : "");
		$("#np-help-next").prop('disabled', !next).attr('data-id', next || "");
		$("#np-help-next-t").text(next ? HELP.titles[next] : "");
	}
	// 검색: 항목 이름이나 본문에 글자가 있는 항목만 남기고 그 묶음을 펼침. 비우면 원래대로(지금 항목의 묶음만 펼침)
	function filterHelp(q){
		var $nav = $("#np-help-nav"), any = false;

		if(!HELP.navReady) return;
		q = $.trim(q).toLowerCase();
		$nav.find(".np-hn-item").each(function(){
			var id = $(this).attr('data-id'), page = HELP.pages[id];
			var hit = !q || HELP.titles[id].toLowerCase().indexOf(q) != -1 || (page && (page.textContent || "").toLowerCase().indexOf(q) != -1);

			$(this).toggleClass("np-hn-hide", !hit);
			if(q && hit) any = true;
		});
		$nav.find(".np-hn-group").each(function(){
			var has = $(this).find(".np-hn-item:not(.np-hn-hide)").length > 0;

			$(this).toggleClass("np-hn-hide", !has);
			if(q) $(this).toggleClass("collapsed", !has);
		});
		if(!q){
			$nav.find(".np-hn-group").addClass("collapsed");
			$nav.find(".np-hn-item.on").parents(".np-hn-group").removeClass("collapsed");
		}
		$nav.children(".np-msg").remove();
		if(q && !any) $nav.append(npMsg('nkHelpNone'));
	}

	/* ② 게임 모드 설명 창 — 묶음(끄투류 등)은 머리글, 그 안 항목이 단추. 묶음 밖 항목(개요)은 맨 위 "게임 유형" 아래 */
	function openModes(id){
		$("#np-modal").addClass("on");
		$("body").css('overflow', "hidden");
		if(HELP.modesReady) return showMode(id);
		$("#np-modal-title").text(L['npModesTitle']);
		$("#np-modal-body").empty().append(npMsg('npLoading'));
		loadHelp(function(ok){
			var $c3 = $(HELP.list).children("#c3"), $nav = $("#np-modal-nav").empty();

			if(!ok || !$c3.length) return $("#np-modal-body").empty().append(npMsg('npLoadFail'));
			$nav.append($("<div>").addClass("np-nav-h").text($.trim($c3.children("label").text())));
			$c3.children("ul").children("li").each(function(){
				var $li = $(this);

				if($li.children("ul").length){
					$nav.append($("<div>").addClass("np-nav-h").text($.trim($li.children("label").text())));
					$li.children("ul").children("li").each(function(){ modeItem($nav, $(this).attr('id')); });
				}else modeItem($nav, $li.attr('id'));
			});
			HELP.modesReady = true;
			if($("#np-modal").hasClass("on")) showMode(id);
		});
	}
	function modeItem($nav, id){
		if(!HELP.pages[id]) return;
		if(!HELP.modeFirst) HELP.modeFirst = id;
		$nav.append($("<button type='button'>").addClass("np-nav-item").attr('data-id', id).text(HELP.titles[id]));
	}
	function showMode(id){
		var $item = $("#np-modal-nav .np-nav-item[data-id='" + id + "']");

		if(!$item.length){
			id = HELP.modeFirst;
			$item = $("#np-modal-nav .np-nav-item[data-id='" + id + "']");
		}
		if(!id) return;
		helpPage(id, $("#np-modal-body"));
		$("#np-modal-title").text(HELP.titles[id]);
		$("#np-modal-crumb").text(HELP.path[id].join(" › "));
		$("#np-modal-nav .np-nav-item.on").removeClass("on");
		$item.addClass("on");
		if($item[0].scrollIntoView) $item[0].scrollIntoView({ block: 'nearest' });
	}
	function closeModes(){
		if(!$("#np-modal").hasClass("on")) return;
		$("#np-modal").removeClass("on");
		$("body").css('overflow', "");
	}

	/* 설정 — 게임 설정 중 테마·밝기·언어·UI만. 저장은 게임 설정 창과 같은 곳(localStorage kkutu_volume의 theme·darkMode·ui, kkutu_lang)
	   테마·밝기는 바로 적용, 언어·UI는 다시 불러옴 */
	function loadVolume(){
		try{ return JSON.parse(localStorage.getItem('kkutu_volume')) || {}; }catch(e){ return {}; }
	}
	function saveVolume(data){
		var s = loadVolume(), k;

		for(k in data) s[k] = data[k];
		try{ localStorage.setItem('kkutu_volume', JSON.stringify(s)); }catch(e){}
		return s;
	}
	function currentLang(){
		var m = location.href.match(/[?&]locale=([^&#]+)/);
		var saved;

		try{ saved = localStorage.getItem('kkutu_lang'); }catch(e){}
		return saved || (m ? m[1] : "ko_KR");
	}
	// 테마 견본: 메인 색 | 강조 색. 커스텀은 만든 것이 있을 때만 (설정 창과 테마 편집 창의 프리셋 견본)
	function paintSwatches(){
		var TE = window.ThemeEngine;
		var custom = loadVolume().customTheme;

		$("#np-set-theme .np-swatch, #np-theme-preset .np-swatch").each(function(){
			var c = themeInputsFor($(this).attr('data-v'), custom);

			$(this).toggle(!!c);
			if(c) $(this).children(".np-swatch-dot").css('background', "linear-gradient(135deg, " + c.primary + " 50%, " + c.medium + " 50%)");
		});
	}
	function themeInputsFor(key, custom){
		var TE = window.ThemeEngine;
		var p;

		if(key == "custom") return (custom && themeValid(custom)) ? custom : null;
		p = TE && TE.PRESETS_BY_KEY[key];
		return p ? { primary: p.primary, medium: p.medium, lightBase: p.lightBase, darkBase: p.darkBase } : null;
	}
	function initSettings(){
		var TE = window.ThemeEngine;

		paintSwatches();
		initThemeEditor();
		initProfile();
		$("#np-msg-ok").on('click', function(){ closeMsg(true); });
		$("#np-msg-no").on('click', function(){ closeMsg(false); });
		$("#np-set-open").on('click', openSettings);
		$("#np-set-close").on('click', closeSettings);
		$("#np-set").on('click', function(e){ if(e.target === this) closeSettings(); });
		$("#np-set-theme").on('click', ".np-swatch", function(){
			var s = saveVolume({ theme: $(this).attr('data-v') });

			if(TE) TE.apply(s.theme, s.darkMode || 'light');
			drawSettings();
		});
		$("#np-set-dark").on('click', "button", function(){
			var s = saveVolume({ darkMode: $(this).attr('data-v') });

			if(TE) TE.apply(s.theme || 'blue', s.darkMode);
			drawSettings();
		});
		$("#np-set-lang").on('click', "button", function(){
			var v = $(this).attr('data-v');

			if(v == currentLang()) return;
			try{ localStorage.setItem('kkutu_lang', v); }catch(e){}
			// 다시 불러오면 위 ready가 저장된 언어로 주소(locale=)를 맞춤
			location.reload();
		});
		// 로그아웃: 내 프로필 창의 로그아웃과 같음 (로그인했을 때만 단추가 있음)
		$("#np-set-logout").on('click', function(){
			npConfirm(L['ASK_LOGOUT'], function(ok){ if(ok) location.href = "/logout"; });
		});
		$("#np-set-classic").on('click', function(){
			var search;

			saveVolume({ ui: "classic" });
			// 주소에 ?ui= 가 남아 있으면 로드 때 다시 덮어쓰므로 같이 바꿈 (body.js reloadWithUI와 같음)
			search = location.search.replace(/([?&])ui=(new|classic)(&|$)/, function(m, pre, v, post){ return post ? pre : ""; });
			if(/[?&]ui=/.test(location.search)) search += (search ? "&" : "?") + "ui=classic";
			if(search !== location.search) location.replace(location.pathname + search + location.hash);
			else location.reload();
		});
	}
	function markSetting(sel, v){
		$(sel).children().each(function(){ $(this).toggleClass("on", $(this).attr('data-v') == v); });
	}
	function drawSettings(){
		var s = loadVolume();

		markSetting("#np-set-theme", s.theme || 'blue');
		markSetting("#np-set-dark", s.darkMode || 'light');
		markSetting("#np-set-lang", currentLang());
	}
	function openSettings(){
		drawSettings();
		openOverlay("#np-set");
	}
	function closeSettings(){
		closeOverlay("#np-set");
	}

	/* 포탈 안 창 — 설정 위에 테마 편집, 그 위에 알림·확인이 겹칠 수 있음. 하나라도 열려 있으면 뒤 화면 스크롤을 막음 */
	function openOverlay(sel){
		$(sel).addClass("on");
		$("body").css('overflow', "hidden");
	}
	function closeOverlay(sel){
		$(sel).removeClass("on");
		if(!$(".np-overlay.on, #np-modal.on").length) $("body").css('overflow', "");
	}
	var MSG = { cb: null };
	function npAlert(text, cb){
		MSG.cb = cb || null;
		$("#np-msg").addClass("alert");
		$("#np-msg-text").text(text);
		openOverlay("#np-msg");
	}
	function npConfirm(text, cb){
		MSG.cb = cb;
		$("#np-msg").removeClass("alert");
		$("#np-msg-text").text(text);
		openOverlay("#np-msg");
	}
	function closeMsg(ok){
		var cb = MSG.cb;

		MSG.cb = null;
		closeOverlay("#np-msg");
		if(cb) cb(ok);
	}

	/* 커스텀 테마 편집 — 게임 ThemeDiag(ready.js)와 같은 계산·저장: 미리보기 genLight/genDark, 테마 코드, 대비 경고, kkutu_volume { theme: 'custom', customTheme } */
	function themeValid(t){
		var re = /^#[0-9a-fA-F]{6}$/;

		return re.test(t.primary) && re.test(t.medium) && re.test(t.lightBase) && re.test(t.darkBase);
	}
	function themeRead(){
		var t = {};

		$("#np-theme .np-tcolor-in .np-input").each(function(){ t[$(this).attr('data-k')] = $.trim($(this).val()); });
		return t;
	}
	function themeSet(t){
		$("#np-theme .np-tcolor-in input").each(function(){ $(this).val(t[$(this).attr('data-k')]); });
		themePreview(true);
	}
	// 미리보기 = 신 UI 색: 테마 엔진 결과(--color-*·--theme-text)와 신 UI 보조 색(npColorVars)을 상자에 넣으면
	// nk_portal.css 1)의 토큰 식이 그 상자 안에서 다시 계산됨 (라이트 상자 / 다크 상자)
	function themePreviewVars(el, t, dark){
		var g = dark ? window.ThemeEngine.genDark(t) : window.ThemeEngine.genLight(t);

		npSetVars(el.style, {
			'--color-primary': g.primary.hex,
			'--color-primary-dark': g.primaryDark.hex,
			'--color-bg-light': g.bgLight.hex,
			'--theme-text': g.text.hex
		});
		npSetVars(el.style, npColorVars(t, dark, g));
	}
	// writeCode: 테마 코드 칸에 붙여 넣는 중에는 그 칸을 덮어쓰지 않음
	function themePreview(writeCode){
		var TE = window.ThemeEngine;
		var t = themeRead();

		if(!TE || !themeValid(t)) return;
		themePreviewVars(document.getElementById("np-tprev-light"), t, false);
		themePreviewVars(document.getElementById("np-tprev-dark"), t, true);
		if(writeCode) $("#np-theme-code").val(TE.encodeThemeCode([t.primary, t.medium, t.lightBase, t.darkBase]));
		$("#np-theme-warn").toggleClass("on", TE.checkContrast(t).length > 0);
	}
	function openThemeEditor(){
		var s = loadVolume();

		if(!window.ThemeEngine) return;
		// 만든 커스텀이 있으면 그것, 없으면 지금 쓰는 프리셋에서 시작
		themeSet(themeInputsFor("custom", s.customTheme) || themeInputsFor(s.theme, null) || themeInputsFor("blue", null));
		openOverlay("#np-theme");
	}
	function initThemeEditor(){
		var TE = window.ThemeEngine;

		$("#np-theme-edit").on('click', openThemeEditor);
		$("#np-theme-close, #np-theme-cancel").on('click', function(){ closeOverlay("#np-theme"); });
		$("#np-theme").on('click', function(e){ if(e.target === this) closeOverlay("#np-theme"); });
		$("#np-theme-preset").on('click', ".np-swatch", function(){ themeSet(themeInputsFor($(this).attr('data-v'), null)); });
		// 색 고르기 ↔ 글자 칸
		$("#np-theme .np-color").on('input', function(){
			$(this).siblings(".np-input").val($(this).val());
			themePreview(true);
		});
		$("#np-theme .np-tcolor-in .np-input").on('input', function(){
			var v = $.trim($(this).val());

			if(!/^#[0-9a-fA-F]{6}$/.test(v)) return;
			$(this).siblings(".np-color").val(v);
			themePreview(true);
		});
		// 테마 코드를 붙여 넣으면 그 색으로 (게임의 "코드 불러오기"와 같은 해석)
		$("#np-theme-code").on('input', function(){
			var t = TE && TE.decodeThemeCode($.trim($(this).val()));

			if(!t) return;
			$("#np-theme .np-tcolor-in input").each(function(){ $(this).val(t[$(this).attr('data-k')]); });
			themePreview(false);
		});
		$("#np-theme-copy").on('click', function(){
			var code = $("#np-theme-code").val();

			if(code && navigator.clipboard) navigator.clipboard.writeText(code);
		});
		$("#np-theme-ok").on('click', function(){
			var t = themeRead();
			var commit = function(){
				var s = saveVolume({ theme: 'custom', customTheme: t });

				TE.apply('custom', s.darkMode || 'light');
				paintSwatches();
				drawSettings();
				closeOverlay("#np-theme");
			};

			if(!TE || !themeValid(t)) return;
			if(TE.checkContrast(t).length) npConfirm(L['themeContrastWarning'], function(ok){ if(ok) commit(); });
			else commit();
		});
	}

	/* 내 프로필 — 별명·소개말. 게임 꾸미기 창(ready.js dressOK)과 같은 순서: 별명 정책 확인 → 변경 확인(주기 안내) → POST /profile */
	var PROF = { nick: "", exor: "" };
	function nickLimit(){
		var o = {};

		try{ o = JSON.parse($("#nk-portal").attr('data-nick-limit') || "{}"); }catch(e){}
		if(o.REGEX) o.REGEX = new RegExp(o.REGEX[0], o.REGEX[1]);
		return o;
	}
	function openProfile(){
		$("#np-prof-nick, #np-prof-exor").val("").prop('disabled', true);
		$("#np-prof-ok").prop('disabled', true);
		openOverlay("#np-prof");
		$.get("/profile/me", function(res){
			if(res.error) return npAlert(L['error_' + res.error] || L['npLoadFail']);
			PROF.nick = res.nickname;
			PROF.exor = res.exordial;
			$("#np-prof-nick").val(res.nickname);
			$("#np-prof-exor").val(res.exordial);
			$("#np-prof-nick, #np-prof-exor, #np-prof-ok").prop('disabled', false);
		}).fail(function(){ npAlert(L['npLoadFail']); });
	}
	function initProfile(){
		$("#np-prof-close, #np-prof-cancel").on('click', function(){ closeOverlay("#np-prof"); });
		$("#np-prof").on('click', function(e){ if(e.target === this) closeOverlay("#np-prof"); });
		$("#np-prof-logout").on('click', function(){
			npConfirm(L['ASK_LOGOUT'], function(ok){ if(ok) location.href = "/logout"; });
		});
		$("#np-prof-ok").on('click', saveProfile);
	}
	function saveProfile(){
		var lim = nickLimit();
		var nick = $.trim($("#np-prof-nick").val()), exor = $("#np-prof-exor").val();
		var data = {};

		if(nick && nick !== PROF.nick) data.nickname = data.rawNickname = nick;
		if(exor !== PROF.exor) data.exordial = exor;
		if(!data.nickname && data.exordial === undefined) return closeOverlay("#np-prof");
		if(data.nickname && lim.REGEX && lim.REGEX.test(data.nickname)){
			lim.REGEX.lastIndex = 0;
			return npConfirm(L['confirmNickPolicy'], function(ok){
				if(ok) data.nickname = data.nickname.replace(lim.REGEX, "");
				else delete data.nickname;
				if(!data.nickname) delete data.rawNickname;
				if(!data.nickname && data.exordial === undefined) return;
				askProfile(data, lim);
			});
		}
		askProfile(data, lim);
	}
	function askProfile(data, lim){
		npConfirm(lim.TERM > 0 ? L['confirmNickChangeLimit'].replace("{V1}", lim.TERM) : L['confirmNickChange'], function(ok){
			if(!ok) return;
			$.post("/profile", data, function(res){
				var msg = [];
				var mins;

				if(res.error){
					if(res.error == 457 && res.remaining){
						mins = Math.max(1, Math.ceil(res.remaining / 60000));
						return npAlert(L['error_457'].replace("{V1}", Math.floor(mins / 60)).replace("{V2}", mins % 60));
					}
					return npAlert(L['error_' + res.error] || L['npLoadFail']);
				}
				if(data.nickname){
					PROF.nick = data.nickname;
					$("#np-account .np-ellipsis").text(data.nickname);
					$(".np-go-hint").text(npL('npPlayHintMe', data.nickname));
					msg.push(L['nickChanged'].replace("{V1}", data.nickname));
				}
				if(data.exordial !== undefined){
					PROF.exor = data.exordial;
					msg.push(L['exorChanged'].replace("{V1}", data.exordial));
				}
				closeOverlay("#np-prof");
				npAlert(msg.join("\n"));
			}).fail(function(){ npAlert(L['npLoadFail']); });
		});
	}
})();