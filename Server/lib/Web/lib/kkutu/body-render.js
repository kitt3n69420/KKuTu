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


// 지금 내 별명: 바꾼 뒤·updateUser 때는 $data.nickname, 접속 직후에는 users의 profile.nickname
function myNickname() {
	var my = $data.users[$data.id];

	return $data.nickname || (my && my.profile && my.profile.nickname) || "";
}
function drawMyDress(avGroup, resetFields) {
	var $view = $("#dress-view");
	var my = $data.users[$data.id];

	renderMoremi($view, my.equip);
	$(".dress-type.selected").removeClass("selected");
	$("#dress-type-all").addClass("selected");
	$("#dress-category-select").val($("#dress-category-select option:first").val());
	if (resetFields) {
		$("#dress-nickname").val(myNickname());
		$("#dress-exordial").val(my.exordial);
	}
	drawMyGoods(avGroup || true);
}
function renderGoods($target, preId, filter, equip, onClick, exclude, excludeIds) {
	var $item;
	var list = [];
	var obj, q, g, equipped;
	var isAll = filter === true;
	var i;

	$target.empty();
	if (!equip) equip = {};
	for (i in equip) {
		if (!$data.box.hasOwnProperty(equip[i])) $data.box[equip[i]] = { value: 0 };
	}
	for (i in $data.box) list.push({ key: i, obj: iGoods(i), value: $data.box[i] });
	list.sort(function (a, b) {
		return (a.obj.name < b.obj.name) ? -1 : 1;
	});
	for (i in list) {
		obj = list[i].obj;
		q = list[i].value;
		g = obj.group;
		if (g.substr(0, 3) == "BDG") g = "BDG";
		equipped = (g == "Mhand") ? (equip['Mlhand'] == list[i].key || equip['Mrhand'] == list[i].key) : (equip[g] == list[i].key);

		if (typeof q == "number") q = {
			value: q
		};
		if (!q.hasOwnProperty("value") && !equipped) continue;
		if (!isAll) if (filter.indexOf(obj.group) == -1) continue;
		if (exclude && exclude.indexOf(obj.group) !== -1) continue;
		if (excludeIds && excludeIds.indexOf(list[i].key) !== -1) continue;
		$target.append($item = $("<div>").addClass("dress-item")
			.append(getImage(obj.image).addClass("dress-item-image").html("x" + q.value))
			.append(explainGoods(obj, equipped, q.expire))
		);
		$item.attr('id', preId + "-" + obj._id).on('click', onClick);
		if (equipped) $item.addClass("dress-equipped");
	}
	global.expl($target);
}
function drawMyGoods(avGroup) {
	var equip = $data.users[$data.id].equip || {};
	var filter;
	var isAll = avGroup === true;

	$data._avGroup = avGroup;
	if (isAll) filter = true;
	else filter = (avGroup || "").split(',');

	renderGoods($("#dress-goods"), 'dress', filter, equip, function (e) {
		var $target = $(e.currentTarget);
		var id = $target.attr('id').slice(6);
		var item = iGoods(id);
		var isLeft;

		if (e.ctrlKey) {
			if ($target.hasClass("dress-equipped")) return fail(426);
			showConfirm(L['surePayback'] + commify(Math.round((item.cost || 0) * 0.2)) + L['ping'], function (res) {
				if (res) {
					$.post("/payback/" + id, function (res) {
						if (res.error) return fail(res.error);
						showAlert(L['painback']);
						$data.box = res.box;
						$data.users[$data.id].money = res.money;

						drawMyDress($data._avGroup);
						updateUI(false);
					});
				}
			});
		} else if (AVAIL_EQUIP.indexOf(item.group) != -1) {
			if (item.group == "Mhand") {
				showConfirm(L['dressWhichHand'], function (isLeft) {
					requestEquip(id, isLeft);
				});
			} else {
				requestEquip(id);
			}
		} else if (item.group == "CNS") {
			showConfirm(L['sureConsume'], function (res) {
				if (res) {
					$.post("/consume/" + id, function (res) {
						if (res.exp) notice(L['obtainExp'] + ": " + commify(res.exp));
						if (res.money) notice(L['obtainMoney'] + ": " + commify(res.money));
						res.gain.forEach(function (item) { queueObtain(item); });
						$data.box = res.box;
						$data.users[$data.id].data = res.data;
						send('refresh');

						drawMyDress($data._avGroup);
						updateMe();
					});
				}
			});
		}
	});
}
function requestEquip(id, isLeft) {
	var my = $data.users[$data.id];
	var part = $data.shop[id].group;
	if (part == "Mhand") part = isLeft ? "Mlhand" : "Mrhand";
	if (part.substr(0, 3) == "BDG") part = "BDG";
	var already = my.equip[part] == id;

	var msg = L[already ? 'sureUnequip' : 'sureEquip'] + ": " + L[id][0];
	showConfirm(msg, function (res) {
		if (res) {
			$.post("/equip/" + id, { isLeft: isLeft }, function (res) {
				if (res.error) return fail(res.error);
				$data.box = res.box;
				my.equip = res.equip;

				drawMyDress($data._avGroup);
				send('refresh');
				updateUI(false);
			});
		}
	});
}
function drawCharFactory() {
	var $tray = $("#cf-tray");
	var $dict = $("#cf-dict");
	var $rew = $("#cf-reward");
	var $goods = $("#cf-goods");
	var $cost = $("#cf-cost");

	$data._tray = [];
	$dict.empty();
	$rew.empty();
	$cost.html("");
	$stage.dialog.cfCompose.removeClass("cf-composable");

	renderGoods($goods, 'cf', ['PIX', 'PIY', 'PIZ'], null, function (e) {
		var $target = $(e.currentTarget);
		var id = $target.attr('id').slice(3);
		var bd = $data.box[id];
		var i, c = 0;

		if ($data._tray.length >= 10) return fail(435);
		for (i in $data._tray) if ($data._tray[i] == id) c++;
		if (bd - c > 0) {
			$data._tray.push(id);
			drawCFTray();
		} else {
			fail(434);
		}
	});
	function trayEmpty() {
		$tray.html($("<h4>").css('padding-top', "8px").width("100%").html(L['cfTray']));
	}
	function drawCFTray() {
		var LEVEL = { 'WPC': 1, 'WPB': 2, 'WPA': 3 };
		var gd, word = "";
		var level = 0;

		$tray.empty();
		$(".cf-tray-selected").removeClass("cf-tray-selected");
		$data._tray.forEach(function (item) {
			gd = iGoods(item);
			word += item.slice(4);
			level += LEVEL[item.slice(1, 4)];
			$tray.append($("<div>").addClass("jt-image")
				.css('background-image', "url(" + gd.image + ")")
				.attr('id', "cf-tray-" + item)
				.on('click', onTrayClick)
			);
			$("#cf-\\" + item).addClass("cf-tray-selected");
		});
		$dict.html(L['searching']);
		$rew.empty();
		$stage.dialog.cfCompose.removeClass("cf-composable");
		$cost.html("");
		// 공백 글자 조각('　')은 매칭에서 항상 제외 — 서버 /cf 로직과 동일하게 처리(보상은 word 전체 길이 기준 유지)
		var matchWord = word.replace(/[　★]/g, "");
		tryDict(matchWord, function (res) {
			var blend = false;

			if (res.error) {
				if (matchWord.length == 3) {
					blend = true;
					$dict.html(L['cfBlend']);
				} else return $dict.html(L['wpFail_' + res.error]);
			}
			viewReward(word, level, blend);
			$stage.dialog.cfCompose.addClass("cf-composable");
			if (!res.error) $dict.html(processWord(res.word, res.mean, res.theme, res.type.split(',')));
		});
		if (word == "") trayEmpty();
	}
	function viewReward(text, level, blend) {
		$.get("/cf/" + text + "?l=" + level + "&b=" + (blend ? "1" : ""), function (res) {
			if (res.error) return fail(res.error);

			$rew.empty();
			res.data.forEach(function (item) {
				var bd = iGoods(item.key);
				var rt = (item.rate >= 1) ? L['cfRewAlways'] : ((item.rate * 100).toFixed(1) + '%');

				$rew.append($("<div>").addClass("cf-rew-item")
					.append($("<div>").addClass("jt-image cf-rew-image")
						.css('background-image', "url(" + bd.image + ")")
					)
					.append($("<div>").width(100)
						.append($("<div>").width(100).html(bd.name))
						.append($("<div>").addClass("cf-rew-value").html("x" + item.value))
					)
					.append($("<div>").addClass("cf-rew-rate").html(rt))
				);
			});
			$cost.html(L['cfCost'] + ": " + res.cost + L['ping']);
		});
	}
	function onTrayClick(e) {
		var id = $(e.currentTarget).attr('id').slice(8);
		var bi = $data._tray.indexOf(id);

		if (bi == -1) return;
		$data._tray.splice(bi, 1);
		drawCFTray();
	}
	trayEmpty();
}
function drawCraftWorkshop() {
	var $tray = $("#craft-tray");
	var $goods = $("#craft-goods");
	var $cost = $("#craft-cost");
	var $preview = $("#craft-result-preview");

	$data._craftTray = [];
	$data._craftCost = 0;
	$data._craftResult = null;
	$preview.empty();
	$cost.html("");
	$stage.dialog.craftCompose.removeClass("craft-composable");
	$("#craft-category-select").val($("#craft-category-select option:first").val());

	// Collect all groups except spec (word pieces) for craft display
	var craftFilter = [];
	$(".craft-type").each(function () {
		var cat = $(this).attr('id').slice(11);
		if (cat === 'all' || cat === 'spec') return;
		var vals = ($(this).attr('value') || "").split(',');
		for (var v = 0; v < vals.length; v++) {
			if (vals[v] && craftFilter.indexOf(vals[v]) === -1) craftFilter.push(vals[v]);
		}
	});

	renderCraftGoods(craftFilter);

	function renderCraftGoods(filter) {
		renderGoods($goods, 'craft', filter, null, onCraftGoodsClick);
	}

	function onCraftGoodsClick(e) {
		var $target = $(e.currentTarget);
		var id = $target.attr('id').slice(6);
		var bd = $data.box[id];
		var c = 0, ci;

		for (ci = 0; ci < $data._craftTray.length; ci++) {
			if ($data._craftTray[ci] === id) c++;
		}
		var available = (typeof bd === "number") ? bd : (bd && bd.value ? bd.value : 0);

		// Toggle: if item has only 1 and already in tray, remove it
		if (c > 0 && available <= 1) {
			var removeIdx = $data._craftTray.indexOf(id);
			$data._craftTray.splice(removeIdx, 1);
			drawCraftTray();
			return;
		}

		if ($data._craftTray.length >= 2) return;
		if (available - c > 0) {
			$data._craftTray.push(id);
			drawCraftTray();
		} else {
			fail(434);
		}
	}

	$data._craftGoodsClick = onCraftGoodsClick;
	$data._renderCraftGoods = renderCraftGoods;

	function trayEmpty() {
		$tray.html($("<span>").css({ 'font-size': "11px", 'color': "#999" }).html(L['craftTrayHint']));
		$("#craft-arrow").hide();
	}
	trayEmpty();

	function drawCraftTray() {
		var gd;
		$tray.empty();
		$(".craft-tray-selected").removeClass("craft-tray-selected");

		$data._craftTray.forEach(function (item, idx) {
			gd = iGoods(item);
			var bd = $data.box[item];
			var cnt = (typeof bd === 'number') ? bd : (bd && bd.value ? bd.value : 0);
			var $imgWrap = $("<div>").addClass("craft-img-wrap");
			var $img = $("<div>").addClass("jt-image")
				.css('background-image', "url(" + gd.image + ")")
				.attr('id', "craft-tray-" + idx)
				.attr('data-item', item)
				.on('click', function () {
					$data._craftTray.splice(idx, 1);
					drawCraftTray();
				});
			var $label = $("<span>").addClass("craft-count-label").text("x" + cnt);
			$imgWrap.append($img).append($label);
			var $wrap = $("<div>").css('display', 'inline-block').append($imgWrap).append(explainGoods(gd, false));
			$tray.append($wrap);
			$("#craft-" + item).addClass("craft-tray-selected");
		});
		global.expl($tray);

		$preview.empty();
		$cost.html("");
		$stage.dialog.craftCompose.removeClass("craft-composable");
		$data._craftResult = null;
		$data._craftCost = 0;

		if ($data._craftTray.length === 0) {
			trayEmpty();
			return;
		}

		$("#craft-arrow").show();

		if ($data._craftTray.length === 2) {
			var itemA = $data._craftTray[0];
			var itemB = $data._craftTray[1];

			$preview.html("<span style='color:#888; font-size:11px;'>" + L['searching'] + "</span>");
			$.get("/craft-check", { item1: itemA, item2: itemB }, function (res) {
				if (res.error || !res.result) {
					$preview.html("<span style='color:#CC3333; font-size:11px;'>" + L['craftNoRecipe'] + "</span>");
					return;
				}
				if (!$data.shop[res.result]) {
					$preview.html("<span style='color:#CC3333; font-size:11px;'>" + L['craftNoRecipe'] + "</span>");
					return;
				}
				var resultObj = iGoods(res.result);
				var $resultImg = getImage(resultObj.image).addClass("craft-result-image");
				var $resultWrap = $("<div>").css('display', 'inline-block').append($resultImg).append(explainGoods(resultObj, false));
				$preview.empty().append($resultWrap);
				global.expl($preview);
				$cost.html(commify(res.cost) + L['ping']);
				$data._craftCost = res.cost;
				$data._craftResult = res.result;
				$stage.dialog.craftCompose.addClass("craft-composable");
			});
		} else {
			$preview.html("<span style='color:#888; font-size:11px;'>" + L['craftSelectSecond'] + "</span>");
		}
	}
}
function drawExchangeWorkshop() {
	var $list = $("#exc-list");

	$list.empty();
	$.get("/exchange-offers", {}, function (res) {
		var offers = (res && res.offers) || [];

		$list.empty();
		if (!offers.length) {
			$list.append($("<div>").addClass("exc-list-empty").html(L['excNoOffers']));
			return;
		}
		offers.forEach(function (offer) {
			if (!$data.shop[offer.result]) return;
			var resultObj = iGoods(offer.result);
			var $row = $("<div>").addClass("exc-offer-row")
				.append($("<div>").addClass("jt-image exc-offer-image").css('background-image', "url(" + resultObj.image + ")"))
				.append($("<div>").addClass("exc-offer-name").html(resultObj.name))
				.append($("<div>").addClass("exc-offer-count").html("x1"))
				.append(explainExcRecipe(resultObj, offer.recipe));
			$row.on('click', function () { requestExchange(offer); });
			$list.append($row);
		});
		global.expl($list);
	});
}
function explainExcRecipe(resultObj, recipe) {
	var $R = $("<div>").addClass("expl dress-expl")
		.append($("<div>").addClass("dress-item-title").html(resultObj.name));
	var $opts = $("<div>").addClass("dress-item-opts");

	Object.keys(recipe).forEach(function (id) {
		var gd = iGoods(id);
		$opts.append($("<label>").addClass("item-opts-head").html(gd.name))
			.append($("<label>").addClass("item-opts-body").html("x" + recipe[id]))
			.append($("<br>"));
	});
	$R.append($opts);
	return $R;
}
function requestExchange(offer) {
	var lines = [L['excSureExchange']];
	Object.keys(offer.recipe).forEach(function (id) {
		var gd = iGoods(id);
		lines.push(gd.name + " x" + offer.recipe[id]);
	});
	showConfirm(lines.join('\n'), function (res) {
		if (!res) return;
		$.post("/exchange", { items: JSON.stringify(offer.recipe) }, function (res) {
			if (res.error) return fail(res.error);
			send('refresh');
			showAlert(L['excExchanged']);
			$data.box = res.box;
			queueObtain({ key: res.exchanged, value: 1 });

			drawMyDress($data._avGroup);
			updateMe();
			drawExchangeWorkshop();
		});
	});
}
// 추석 이벤트: 마일스톤 사이 구간을 선형 보간해 달의 위상(0=그믐~1=보름달)을 계산
// (마일스톤 임계값 간격이 서로 달라도, 마일스톤 하나를 넘길 때마다 동일한 폭만큼 위상이 진행됨)
function computeMoonPhase(amount, milestones) {
	var anchors = [{ threshold: 0, phase: 0 }];
	var n = milestones.length;

	milestones.forEach(function (m, i) {
		anchors.push({ threshold: m.threshold, phase: (i + 1) / n });
	});
	if (amount <= 0) return 0;
	for (var i = 1; i < anchors.length; i++) {
		if (amount <= anchors[i].threshold) {
			var prev = anchors[i - 1], cur = anchors[i];
			var t = (cur.threshold === prev.threshold) ? 1 : (amount - prev.threshold) / (cur.threshold - prev.threshold);
			return prev.phase + t * (cur.phase - prev.phase);
		}
	}
	return 1;
}
// 추석 이벤트: 달의 위상 경계(터미네이터)는 항상 원의 맨 위/맨 아래 점을 지나야 하고,
// 세 번째로 지나는 점(적도 위 한 점)만 진행률에 따라 좌우로 움직인다.
// 이 세 점을 지나는 원의 중심·반지름을 원의 방정식으로 구해 SVG 호로 그리되,
// 반달 부근(중심이 발산하는 구간)에서는 3차 베지어 곡선으로 대체한다.
// (viewBox 0 0 100 100, 중심 (50,50), 반지름 50 기준의 정규화 좌표)
function buildMoonMaskPath(progress) {
	var r = 50, cx = 50, cy = 50;
	var dx = -r * Math.cos(progress * Math.PI);
	var mx = cx + dx, my = cy;
	var topX = cx, topY = cy - r;
	var bottomX = cx, bottomY = cy + r;
	// 세 점(top, mid, bottom)을 지나는 원의 중심은 대칭성에 의해 항상 y=cy 위에 있다.
	var k = (dx * dx - r * r) / (2 * dx); // 중심 = (cx + k, cy); dx→0일수록 발산
	var terminator;

	if (Math.abs(k) > 1000) {
		// 원의 중심이 지나치게 멀어지는(거의 직선인) 구간은 3차 베지어로 대체
		// (2차 베지어가 mid를 정확히 지나도록 만든 뒤 표준 공식으로 3차 승격; dx=0이면 완전한 직선으로 수렴)
		var cpNearTopX = cx + 4 * dx / 3, cpNearTopY = cy - r / 3;
		var cpNearBottomX = cx + 4 * dx / 3, cpNearBottomY = cy + r / 3;
		terminator = "C " + cpNearBottomX + "," + cpNearBottomY + " " + cpNearTopX + "," + cpNearTopY + " " + topX + "," + topY;
	} else {
		var ox = cx + k, oy = cy;
		var R = Math.sqrt(k * k + r * r);
		var norm = function (a) { var t = a % (2 * Math.PI); return t < 0 ? t + 2 * Math.PI : t; };
		var angleTop = norm(Math.atan2(topY - oy, topX - ox));
		var angleBottom = norm(Math.atan2(bottomY - oy, bottomX - ox));
		var angleMid = norm(Math.atan2(my - oy, mx - ox));
		var sweepSpan = norm(angleTop - angleBottom); // sweep=1(양의 각) 방향으로 bottom->top까지의 각도
		var midSpan = norm(angleMid - angleBottom);
		var sweepFlag = (midSpan > 0 && midSpan < sweepSpan) ? 1 : 0;
		terminator = "A " + R + "," + R + " 0 0," + sweepFlag + " " + topX + "," + topY;
	}
	// 달 자신의 오른쪽 반원(고정) + 터미네이터(반보다 덜/더 참에 따라 저절로 안쪽/바깥쪽을 감싸게 됨)
	return "M " + topX + "," + topY +
		" A " + r + "," + r + " 0 0,1 " + bottomX + "," + bottomY +
		" " + terminator + " Z";
}
// 추석 이벤트: 달가루 위상 + 마일스톤 그리드
function drawMoonPanel() {
	var $panel = $("#event-moon-panel");

	$panel.empty();
	$.get("/event/moon-status", {}, function (res) {
		$panel.empty();
		if (!res || !res.active) {
			$panel.append($("<div>").addClass("exc-list-empty").html(L['excNoOffers']));
			return;
		}

		var progress = computeMoonPhase(res.amount, res.milestones);
		var $moonWrap = $("<div>").addClass("event-moon-wrap");
		var $moonCircle = $("<div>").addClass("event-moon-circle");
		// 0(그믐, 전부 어둡게 마스킹) ~ 1(보름, 마스킹 없음)
		var maskPath = buildMoonMaskPath(progress);
		// SVGElement.className은 이 jQuery 버전의 addClass()가 못 다루는 SVGAnimatedString(getter만 있음)이므로 attr("class", ...)로 설정
		var $moonMask = $(document.createElementNS("http://www.w3.org/2000/svg", "svg")).attr("class", "event-moon-mask").attr("viewBox", "0 0 100 100");
		var $moonMaskPath = $(document.createElementNS("http://www.w3.org/2000/svg", "path")).attr("d", maskPath);
		$moonMask.append($moonMaskPath);
		$moonWrap.append($moonCircle, $moonMask);

		var $amount = $("<div>").addClass("event-moon-amount").html(L['eventMoonAmount'] + ": " + commify(res.amount));
		$panel.append($moonWrap, $amount);

		if (!res.participated) {
			$panel.append($("<div>").addClass("event-moon-notice").html(L['eventMoonParticipateNotice']));
		}

		var $grid = $("<div>").addClass("event-moon-grid");
		res.milestones.forEach(function (m) {
			var $cell = $("<div>").addClass("event-moon-cell");
			if (m.unlocked && $data.shop[m.itemId]) {
				var gd = iGoods(m.itemId);
				$cell.append($("<div>").addClass("jt-image event-moon-cell-image").css('background-image', "url(" + gd.image + ")"));
				$cell.append($("<div>").addClass("event-moon-cell-name").html(gd.name));
				if (m.owned) {
					$cell.addClass("event-moon-cell-owned");
					$cell.append($("<div>").addClass("event-moon-cell-check").html("&#10003;"));
					$cell.append($("<div>").addClass("event-moon-cell-status").html(L['eventMoonClaimed']));
				} else if (res.participated) {
					var $btn = $("<button>").addClass("event-moon-claim-btn").html(L['eventMoonClaim']);
					$btn.on('click', function () { claimMilestone(m.tier); });
					$cell.append($btn);
				}
			} else {
				$cell.addClass("event-moon-cell-locked");
				$cell.append($("<div>").addClass("event-moon-cell-image event-moon-cell-question").html("?"));
				$cell.append($("<div>").addClass("event-moon-cell-name").html(L['eventMoonLocked']));
				$cell.append($("<div>").addClass("event-moon-cell-status").html(L['eventMoonLockedDescPrefix'] + commify(m.threshold) + L['eventMoonLockedDescSuffix']));
			}
			$grid.append($cell);
		});
		$panel.append($grid);
	});
}
function claimMilestone(tier) {
	$.post("/event/claim-milestone", { tier: tier }, function (res) {
		if (res.error) return fail(res.error);
		send('refresh');
		showAlert(L['obtained'] + '!');
		$data.box = res.box;
		queueObtain({ key: res.obtained, value: 1 });

		drawMyDress($data._avGroup);
		updateMe();
		drawMoonPanel();
	});
}

// ===== 1주년 이벤트 창: 파티(이벤트 1) / 별가루(이벤트 2-1) / 소원(이벤트 2-2) 탭 =====
// 교환소 버튼으로 여는 창 하나 안에서 탭으로 나눈다. 서버는 major.js의 /event/anniv/* 를 쓴다.
var ANNIV_COLORS = { R: "#FF5C7A", Y: "#FFC93C", G: "#3CCB7F", B: "#4DA3FF", P: "#B07CFF" };
var ANNIV_WISH_COLORS = ["#FFB8C4", "#FFF0A8", "#BDF5CF", "#B8D9FF", "#DEC8FF"]; // 소원 별: 연한 빨·노·초·파·보
var ANNIV_PARTY_SEATS = 12; // 한 번에 앉는 모레미 수 (기록은 방 최대 인원 24명까지)
var ANNIV_PARTY_ROW = 6;

// 방 목록: 1주년 기간에는 모드 이름 앞에 그 모드에서 모으는 별가루 색의 별 (마우스를 올리면 별가루 이름)
function annivModeStar(mode) {
	var c = EVENT_ACTIVE_1ST && ANNIV_MODE_COLOR[MODE[mode]];
	var id;

	if (!c) return null;
	id = "stardust_" + c.toLowerCase();
	return $("<label>").addClass("anniv-mode-star anniv-dust-" + c).attr('title', (L[id] && L[id][0]) || L['annivColor_' + c]).text("★");
}
function drawAnnivPanel() {
	var old = $data._anniv || {};
	var $panel = $("#event-anniv-panel");

	// 창을 열 때마다 소원 목록은 새로 받는다 (그 사이 승인된 소원이 보이도록). 보던 탭과 고른 색은 그대로
	$data._anniv = { tab: old.tab || 'party', conv: old.conv || null, wishes: null, wishMore: false, scroll: old.res ? old.scroll : 0 };
	if (!old.res) $panel.empty();
	$.get("/event/anniv/status", {}, function (res) {
		if (!res || res.error || !res.active) {
			$panel.empty().append($("<div>").addClass("exc-list-empty").text(res && res.error ? L['error_' + res.error] : L['excNoOffers']));
			return;
		}
		$data._anniv.res = res;
		annivRender(true);
	});
}
function annivRender(keepScroll) {
	var st = $data._anniv;
	var $panel = $("#event-anniv-panel");
	var top = keepScroll ? $panel.find(".anniv-body").scrollTop() || st.scroll || 0 : 0;
	var $tabs = $("<div>").addClass("anniv-tabs");
	var $body = $("<div>").addClass("anniv-body");

	// 탭 순서: 이벤트 1 파티 → 이벤트 2 별빛(별가루·소원)
	[["party", "annivTabParty"], ["star", "annivTabStar"], ["wish", "annivTabWish"]].forEach(function (t) {
		$tabs.append($("<div>").addClass("anniv-tab" + (st.tab === t[0] ? " anniv-tab-on" : "")).text(L[t[1]]).on('click', function () {
			if (st.tab === t[0]) return;
			st.tab = t[0];
			annivRender(false);
		}));
	});
	$panel.empty().append($tabs, $body);
	if (st.tab === 'star') annivDrawStar($body, st.res);
	else if (st.tab === 'wish') annivDrawWish($body, st);
	else annivDrawParty($body, st.res);
	$body.scrollTop(top);
	$body.on('scroll', function () { st.scroll = $body.scrollTop(); });
}
function annivSvg(tag, attrs) {
	var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
	var k;

	for (k in attrs) el.setAttribute(k, attrs[k]);
	return el;
}
function annivPt(r, deg) {
	var a = deg * Math.PI / 180;
	return [r * Math.cos(a), r * Math.sin(a)];
}
// 별 모양: 안쪽 꼭짓점을 정오각별(0.382)보다 바깥에 두어 통통하게 하고, 바깥 끝은 둥글게 깎는다 (사용자 요청: 끝이 덜 날카롭게)
var ANNIV_STAR_INNER = 0.45;
var ANNIV_STAR_ROUND = 0.22; // 끝에서 양옆 변 길이의 이 비율만큼 들어간 두 점을 끝을 조절점으로 하는 곡선으로 잇는다
// pts를 s배 해서 잇는 SVG 경로. tips에 든 번호의 점은 둥근 끝
function annivStarPath(pts, tips, s) {
	var n = pts.length, d = "", i, p, prev, next;
	function at(q) { return (q[0] * s).toFixed(2) + "," + (q[1] * s).toFixed(2); }
	function toward(from, to) { return [from[0] + (to[0] - from[0]) * ANNIV_STAR_ROUND, from[1] + (to[1] - from[1]) * ANNIV_STAR_ROUND]; }

	for (i = 0; i < n; i++) {
		p = pts[i];
		if (tips.indexOf(i) === -1) {
			d += (i ? " L " : "M ") + at(p);
			continue;
		}
		prev = pts[(i + n - 1) % n];
		next = pts[(i + 1) % n];
		d += (i ? " L " : "M ") + at(toward(p, prev)) + " Q " + at(p) + " " + at(toward(p, next));
	}
	return d + " Z";
}
function annivDot(c) {
	return $("<div>").addClass("anniv-dot").css('background-color', ANNIV_COLORS[c]);
}
// 팔 길이(0~1): 단계마다 같은 길이만큼 자란다. 단계 기준이 5·10·25…로 벌어져도 화면에서는 고르게 = 로그 스케일
// 단계 안에서는 개수에 비례해서 자란다 (추석 달 위상과 같은 방식)
function annivStarProgress(n, tiers) {
	var prev = 0, i;

	if (n <= 0) return 0;
	for (i = 0; i < tiers.length; i++) {
		if (n < tiers[i]) return (i + (n - prev) / (tiers[i] - prev)) / tiers.length;
		prev = tiers[i];
	}
	return 1;
}
// 보상 칸 그림: 모레미 아이템은 모레미에 입혀서, 나머지(이름 등)는 상점 그림
function annivItemIcon(itemId) {
	var shop = $data.shop[itemId];
	var $icon = $("<div>").addClass("moremi anniv-cell-icon");
	var eq = {};

	if (!shop) return $icon;
	if (shop.group.charAt(0) === 'M') eq[shop.group === 'Mhand' ? 'Mlhand' : shop.group] = itemId;
	else if (shop.group.slice(0, 3) === 'BDG') eq.BDG = itemId;
	else return $icon.css('background-image', "url(" + iImage(itemId, shop) + ")"); // jt-image는 float이 붙어서 쓰지 않음
	renderMoremi($icon, eq);
	return $icon;
}
// 보상 칸 하나: 그림 / 이름 / 기준 / [받기]·받음
function annivRewardCell(itemId, tier, needText, reached, claimed, track) {
	var $cell = $("<div>").addClass("anniv-cell" + (claimed ? " anniv-cell-owned" : (reached ? " anniv-cell-ready" : " anniv-cell-locked")));
	var $name = $("<div>").addClass("anniv-cell-name");
	var name = (L[itemId] && L[itemId][0]) || itemId; // 아이템 SQL을 아직 안 넣었으면 ID로

	if ($data.shop[itemId] && $data.shop[itemId].group === 'NIK') $name.append($("<label>").addClass("x-" + itemId).text(name));
	else $name.text(name);
	var $act = $("<div>").addClass("anniv-cell-act"); // 받기·받음 자리: 모든 칸의 맨 아래 같은 높이

	$cell.append(annivItemIcon(itemId), $name, $("<div>").addClass("anniv-cell-need").text(needText), $act);
	if (claimed) {
		$cell.append($("<div>").addClass("anniv-cell-check").html("&#10003;"));
		$act.append($("<div>").addClass("anniv-cell-status").text(L['eventMoonClaimed']));
	} else if (reached) {
		$act.append($("<button>").addClass("anniv-claim-btn").text(L['eventMoonClaim']).on('click', function () { annivClaim(track, tier); }));
	}
	return $cell;
}
function annivClaim(track, tier) {
	$.post("/event/anniv/claim", { track: track, tier: tier }, function (res) {
		if (res.error) return fail(res.error);
		send('refresh');
		$data.box = res.box;
		queueObtain({ key: res.obtained, value: 1 });

		drawMyDress($data._avGroup);
		updateMe();
		drawAnnivPanel();
	});
}

// --- 이벤트 2-1 별가루: 다섯 팔이 순환 순서(꿈→희망→열정→행복→용기)대로 시계 방향. 바꾸기의 재료가 별에서 바로 양옆 팔이 된다
function annivDrawStar($body, res) {
	var R = 86, r = R * ANNIV_STAR_INNER, n = res.tiers.length;
	var min = Math.min.apply(null, res.cycle.map(function (c) { return res.stars[c] || 0; }));
	var svg = annivSvg("svg", { "class": "anniv-star-svg", viewBox: "-160 -122 320 238" });
	var outline = [], arms = [], k;
	var $grid = $("<div>").addClass("anniv-grid");
	var $conv = $("<div>").addClass("anniv-sec");
	var $legend = $("<div>").addClass("anniv-sec");

	// 단계 눈금: 단계마다 별 윤곽 하나. 다섯 팔이 모두 넘은 단계는 밝게
	for (k = 0; k < 10; k++) outline.push(annivPt(k % 2 ? r : R, -90 + 36 * k));
	for (k = 1; k <= n; k++) {
		svg.appendChild(annivSvg("path", { d: annivStarPath(outline, [0, 2, 4, 6, 8], k / n), "class": "anniv-star-guide" + (min >= res.tiers[k - 1] ? " anniv-star-guide-on" : "") }));
	}
	res.cycle.forEach(function (c, i) {
		var a = -90 + 72 * i;
		var kite = [[0, 0], annivPt(r, a - 36), annivPt(R, a), annivPt(r, a + 36)];
		var arm = annivSvg("path", { d: annivStarPath(kite, [2], 0), fill: ANNIV_COLORS[c], "class": "anniv-star-arm" });
		var lp = annivPt(R + 12, a), cos = Math.cos(a * Math.PI / 180), sin = Math.sin(a * Math.PI / 180);
		var dy = sin < -0.9 ? [-16, 0] : (sin > 0.5 ? [8, 23] : [-4, 11]);
		var text = annivSvg("text", { "text-anchor": Math.abs(cos) < 0.3 ? "middle" : (cos > 0 ? "start" : "end"), fill: ANNIV_COLORS[c], "class": "anniv-star-label" });
		var t1 = annivSvg("tspan", { x: lp[0].toFixed(1), y: (lp[1] + dy[0]).toFixed(1), "class": "anniv-star-label-name" });
		var t2 = annivSvg("tspan", { x: lp[0].toFixed(1), y: (lp[1] + dy[1]).toFixed(1), "class": "anniv-star-label-count" });

		svg.appendChild(annivSvg("path", { d: annivStarPath(kite, [2], 1), fill: ANNIV_COLORS[c], stroke: ANNIV_COLORS[c], "class": "anniv-star-track" }));
		svg.appendChild(arm);
		arms.push([arm, annivStarProgress(res.stars[c] || 0, res.tiers), kite]);
		t1.textContent = L['annivColor_' + c];
		t2.textContent = commify(res.stars[c] || 0);
		text.appendChild(t1);
		text.appendChild(t2);
		svg.appendChild(text);
	});
	$body.append($("<div>").addClass("anniv-sky anniv-star-sky").append(svg));
	// 팔이 가운데에서부터 커지는 모습 (SVG 안 CSS transform-origin은 브라우저마다 달라서 꼭짓점을 직접 늘린다)
	var t0 = null;
	function grow(ts) {
		var k, e;

		if (t0 === null) t0 = ts;
		k = Math.min(1, (ts - t0) / 900);
		e = 1 - Math.pow(1 - k, 3);
		arms.forEach(function (a) { a[0].setAttribute("d", annivStarPath(a[2], [2], a[1] * e)); });
		if (k < 1 && document.body.contains(svg)) requestAnimationFrame(grow);
	}
	requestAnimationFrame(grow);

	$body.append($("<div>").addClass("anniv-help").text(L['annivStarHelp']));
	res.tiers.forEach(function (need, i) {
		$grid.append(annivRewardCell(res.rewards[i], i + 1, L['annivNeedEach'].replace("{V1}", commify(need)), min >= need, res.claimed.indexOf(i + 1) !== -1, 'star'));
	});
	$body.append($grid, $conv, $legend);
	annivDrawConvert($conv, res);

	$legend.append($("<div>").addClass("anniv-sec-title").text(L['annivModesTitle']));
	res.cycle.forEach(function (c) {
		var names = (res.modes[c] || []).map(function (m) { return L['mode' + m] || m; }).join(", ");
		$legend.append($("<div>").addClass("anniv-legend-row").append(
			annivDot(c),
			$("<div>").addClass("anniv-legend-name").text(L['annivColor_' + c]),
			$("<div>").addClass("anniv-legend-modes").text(names)
		));
	});
}
// 별가루 바꾸기: 받을 색을 고르면 순환 순서에서 그 양옆 두 색을 n개씩 낸다 (서버 Const.annivConvertSources와 같은 규칙)
function annivDrawConvert($box, res) {
	var st = $data._anniv, cyc = res.cycle;
	var $targets = $("<div>").addClass("anniv-conv-targets");
	var i, a, b, max, $n;

	$box.empty().append(
		$("<div>").addClass("anniv-sec-title").text(L['annivConvertTitle']),
		$("<div>").addClass("anniv-help").text(L['annivConvertHelp']),
		$targets
	);
	cyc.forEach(function (c) {
		$targets.append($("<div>").addClass("anniv-conv-target" + (st.conv === c ? " anniv-conv-on" : "")).css('border-color', ANNIV_COLORS[c])
			.append(annivDot(c), $("<div>").text(L['annivColor_' + c]))
			.on('click', function () { st.conv = c; annivDrawConvert($box, res); }));
	});
	if (!st.conv) return;
	i = cyc.indexOf(st.conv);
	a = cyc[(i + cyc.length - 1) % cyc.length];
	b = cyc[(i + 1) % cyc.length];
	max = Math.min(res.stars[a] || 0, res.stars[b] || 0, 999);
	$n = $("<input>").attr({ type: "number", min: 1, max: Math.max(1, max) }).addClass("anniv-conv-n").val(1);
	$box.append(
		$("<div>").addClass("anniv-conv-formula").append(
			annivDot(a), $("<div>").text(L['annivColor_' + a] + " " + commify(res.stars[a] || 0)),
			$("<div>").text("+"),
			annivDot(b), $("<div>").text(L['annivColor_' + b] + " " + commify(res.stars[b] || 0)),
			$("<div>").html("&rarr;"),
			annivDot(st.conv), $("<div>").text(L['annivColor_' + st.conv])
		),
		$("<div>").addClass("anniv-conv-row").append(
			$n,
			$("<button>").text(L['annivConvertMax']).prop('disabled', max < 1).on('click', function () { $n.val(max); }),
			$("<button>").text(L['annivConvertDo']).prop('disabled', max < 1).on('click', function () {
				var n = parseInt($n.val(), 10);

				if (!(n >= 1)) return;
				if (n > max) return fail(474);
				showConfirm(L['annivConvertSure'].replace("{V1}", L['annivColor_' + a]).replace("{V2}", L['annivColor_' + b])
					.replace("{V3}", L['annivColor_' + st.conv]).replace(/\{V4\}/g, n), function (ok) {
					if (!ok) return;
					$.post("/event/anniv/convert", { to: st.conv, n: n }, function (r) {
						if (r.error) return fail(r.error);
						send('refresh');
						$data.box = r.box;
						updateMe();
						showAlert(L['annivConverted']);
						drawAnnivPanel();
					});
				});
			})
		)
	);
}

// --- 이벤트 2-2 소원: 승인된 소원 하나가 밤하늘의 별 하나. 누르면 그 소원이 보이고, 쓴 사람은 보이지 않는다
function annivRand(seed) {
	return function () {
		seed = (seed + 0x6D2B79F5) | 0;
		var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
// 별 자리·색은 소원 id로 정한다 (창을 다시 열어도 같은 별이 같은 자리·색). 후보 10곳 중 다른 별과 가장 먼 곳에 둔다
function annivWishLayout(wishes) {
	var placed = [];

	return wishes.map(function (w) {
		var rnd = annivRand(w.id * 7919 + 17), best = null, bestD = -1, k, x, y, d;

		for (k = 0; k < 10; k++) {
			x = 5 + rnd() * 88;
			y = 6 + rnd() * 80;
			d = placed.reduce(function (m, p) {
				var dx = (p[0] - x) * 3.2, dy = (p[1] - y) * 2.4;
				return Math.min(m, dx * dx + dy * dy);
			}, Infinity);
			if (d > bestD) { bestD = d; best = [x, y]; }
		}
		placed.push(best);
		return { x: best[0], y: best[1], color: ANNIV_WISH_COLORS[Math.floor(rnd() * ANNIV_WISH_COLORS.length)], size: 13 + Math.floor(rnd() * 7), delay: (rnd() * 3).toFixed(2) };
	});
}
function annivLoadWishes(done) {
	var st = $data._anniv;
	var last = st.wishes && st.wishes.length ? st.wishes[st.wishes.length - 1].id : 0;

	$.get("/event/anniv/wishes", last ? { before: last } : {}, function (res) {
		if (res.error) return fail(res.error);
		st.wishes = (st.wishes || []).concat(res.wishes || []);
		st.wishMore = (res.wishes || []).length >= 20;
		done();
	});
}
function annivDrawWish($body, st) {
	var $wrap = $("<div>").addClass("anniv-wish-wrap");
	var $sky = $("<div>").addClass("anniv-sky anniv-wish-sky");
	var $bubble = $("<div>").addClass("anniv-wish-bubble").hide();
	var $info = $("<div>").addClass("anniv-wish-info");
	var $mine = $("<div>").addClass("anniv-wish-mine");

	$sky.on('click', function () { $bubble.hide(); $sky.find(".anniv-wish-star-on").removeClass("anniv-wish-star-on"); });
	$bubble.on('click', function (e) { e.stopPropagation(); });
	$wrap.append($sky.append($bubble));
	if (st.res.wish) {
		$mine.append($("<div>").addClass("anniv-wish-mine-label").text(L['annivWishToday']), $("<div>").addClass("anniv-wish-mine-text").text(st.res.wish));
	}
	$mine.append($("<button>").addClass("anniv-wish-open").text(L[st.res.wish ? 'annivWishEdit' : 'annivWishMake']).on('click', function () { annivWishForm($wrap, st); }));
	$body.append($wrap, $info, $mine, $("<div>").addClass("anniv-help").text(L['annivWishNote']));

	function drawStars() {
		$sky.find(".anniv-wish-star").remove();
		annivWishLayout(st.wishes).forEach(function (p, i) {
			var w = st.wishes[i];
			var $star = $("<div>").addClass("anniv-wish-star").html("&#9733;").css({
				left: p.x + "%", top: p.y + "%", color: p.color, 'font-size': p.size + "px", 'animation-delay': p.delay + "s"
			});

			$star.on('click', function (e) {
				e.stopPropagation();
				$sky.find(".anniv-wish-star-on").removeClass("anniv-wish-star-on");
				$star.addClass("anniv-wish-star-on");
				$bubble.css('border-left-color', p.color).empty().append(
					$("<div>").addClass("anniv-wish-bubble-date")
						.text(L['annivWishDate'].replace("{V1}", parseInt(w.date.slice(5, 7), 10)).replace("{V2}", parseInt(w.date.slice(8, 10), 10))),
					$("<div>").addClass("anniv-wish-bubble-text").text(w.text)
				).show();
			});
			$sky.append($star);
		});
		$info.empty().append($("<div>").text(L['annivWishCount'].replace("{V1}", st.wishes.length) + " · " + L['annivWishHelp']));
		if (st.wishMore) {
			$info.append($("<button>").addClass("anniv-wish-more").text(L['annivWishMore']).on('click', function () { annivLoadWishes(drawStars); }));
		}
	}
	if (st.wishes) drawStars();
	else annivLoadWishes(drawStars);
}
// 소원 쓰는 칸: 버튼을 누르면 창 안의 밤하늘 위에 열린다. 오늘 쓴 소원이 있으면 그 내용으로 시작 (자정 전까지 고치기)
function annivWishForm($wrap, st) {
	var $ta = $("<textarea>").addClass("anniv-wish-text").attr({ maxlength: 200, placeholder: L['annivWishPlaceholder'] }).val(st.res.wish || "");
	var $cnt = $("<div>").addClass("anniv-wish-cnt");
	var $form = $("<div>").addClass("anniv-wish-form");
	var update = function () { $cnt.text($ta.val().length + " / 200"); };

	$wrap.find(".anniv-wish-form").remove();
	$ta.on('input', update);
	update();
	$form.append($ta, $("<div>").addClass("anniv-wish-form-row").append(
		$cnt,
		$("<button>").text(L['NO']).on('click', function () { $form.remove(); }),
		$("<button>").addClass("anniv-wish-send").text(L['annivWishSend']).on('click', function () {
			$.post("/event/anniv/wish", { text: $ta.val() }, function (res) {
				if (res.error) return fail(res.error);
				st.res.wish = res.wish;
				showAlert(L['annivWishSaved']);
				annivRender(true);
			});
		})
	));
	$wrap.append($form);
	$ta.focus();
}

// --- 이벤트 1 파티: 처음엔 모레미 둘이 앉아 있고, 최고 기록만큼 늘어나 한 번에 12명까지 앉는다 (그 위는 +N으로)
// 앞줄(식탁 뒤) 6자리를 먼저 채우고 뒷줄 6자리. 내 모레미는 앞줄 가운데
function annivMyEquip() {
	var me = $data.users[$data.id];
	var eq = $.extend({}, me && me.equip);

	// 배경·앞 배경·휘장은 장면을 가려서 뺀다
	delete eq.Mback;
	delete eq.Mfront;
	delete eq.BDG;
	return eq;
}
// 함께 앉은 모레미 꾸미기: 상점에서 파는 아이템 중에서 부위마다 확률로 고른다. 자리 번호로 정해서 창을 다시 열어도 같은 모습
var ANNIV_FRIEND_SLOTS = [
	["Mhead", ["Mhead", "head"], 0.5],
	["Meye", ["Meye", "eye"], 0.35],
	["Mmouth", ["Mmouth", "mouth"], 0.3],
	["Mclothes", ["Mclothes", "clothes"], 0.55],
	["Mlhand", ["Mhand"], 0.35],
	["Mshoes", ["Mshoes"], 0.25]
];
function annivFriendPools() {
	var pools = {};

	// 상점 목록을 다시 받으면($data.shop이 새 객체) 다시 만든다
	if ($data._annivPools && $data._annivPoolsOf === $data.shop) return $data._annivPools;
	ANNIV_FRIEND_SLOTS.forEach(function (s) { pools[s[0]] = []; });
	Object.keys($data.shop).sort().forEach(function (id) {
		var it = $data.shop[id];

		if (!(it.cost > 0)) return; // 구매 불가(이벤트·관리용) 아이템은 빼서 이상한 모습이 안 나오게
		ANNIV_FRIEND_SLOTS.forEach(function (s) { if (s[1].indexOf(it.group) !== -1) pools[s[0]].push(id); });
	});
	$data._annivPoolsOf = $data.shop;
	return ($data._annivPools = pools);
}
function annivFriendEquip(seat) {
	var rnd = annivRand(seat * 104729 + 7), pools = annivFriendPools(), eq = {};

	if (rnd() < 0.45) eq.Mhead = 'conical_hat'; // 파티라서 고깔모자를 자주 씀
	ANNIV_FRIEND_SLOTS.forEach(function (s) {
		var pool = pools[s[0]], pick = rnd();

		if (eq[s[0]] || !pool.length || pick >= s[2]) return;
		eq[s[0]] = pool[Math.floor(rnd() * pool.length)];
	});
	return eq;
}
function annivDrawParty($body, res) {
	var p = res.party, best = p.best || 0;
	var seats = Math.min(ANNIV_PARTY_SEATS, Math.max(2, best));
	var front = Math.min(seats, ANNIV_PARTY_ROW), back = seats - front;
	var $scene = $("<div>").addClass("anniv-party-scene");
	var $bunting = $("<div>").addClass("anniv-bunting");
	var $grid = $("<div>").addClass("anniv-grid");
	var w, gap, size, tableTop = 128, i;

	for (i = 0; i < 16; i++) $bunting.append($("<div>").addClass("anniv-flag").css('border-top-color', ANNIV_WISH_COLORS[i % ANNIV_WISH_COLORS.length]));
	$body.append($scene.append($bunting));
	// 창 폭(모바일 최소 360px 화면에서 약 290px)에 맞춰 자리 간격과 모레미 크기를 정한다
	w = $scene.width() || 330;
	gap = Math.min(52, (w - 40) / 6.2);
	size = Math.min(54, gap * 1.08);
	function seat(idx, cnt, isBack) {
		var s = isBack ? size * 0.86 : size;
		var x = (idx - (cnt - 1) / 2) * gap;
		var frontTop = tableTop - size * 0.82;
		var $m = $("<div>").addClass("moremi anniv-party-moremi").css({
			width: s, height: s,
			left: "calc(50% + " + (x - s / 2).toFixed(1) + "px)",
			top: isBack ? frontTop - size * 0.6 : frontTop,
			'animation-delay': ((idx * 0.37 + (isBack ? 0.6 : 0)) % 1.4).toFixed(2) + "s"
		});
		var me = !isBack && idx === Math.floor((cnt - 1) / 2);

		renderMoremi($m, me ? annivMyEquip() : annivFriendEquip((isBack ? ANNIV_PARTY_ROW : 0) + idx));
		$scene.append($m);
	}
	for (i = 0; i < back; i++) seat(i, back, true);
	for (i = 0; i < front; i++) seat(i, front, false);
	$scene.append($("<div>").addClass("anniv-party-table").css('top', tableTop));
	if (best > ANNIV_PARTY_SEATS) $scene.append($("<div>").addClass("anniv-party-more").text("+" + (best - ANNIV_PARTY_SEATS)));

	$body.append(
		$("<div>").addClass("anniv-party-best").text(best ? L['annivPartyRecord'].replace("{V1}", best) : L['annivPartyNone']),
		$("<div>").addClass("anniv-help").text(L['annivPartyHelp']),
		$grid
	);
	p.tiers.forEach(function (need, i) {
		$grid.append(annivRewardCell(p.rewards[i], i + 1, L['annivPartyNeed'].replace("{V1}", need), best >= need, p.claimed.indexOf(i + 1) !== -1, 'party'));
	});
}

function drawLeaderboard(data) {
	var $board = $stage.dialog.lbTable.empty();
	var fr = data.data[0] ? data.data[0].rank : 0;
	// 신 UI 랭킹 화면은 한 페이지 50개 (nk.js가 /ranking 요청에 n=50을 붙임)
	var lpp = NK.active ? 50 : 12;
	var page = (data.page || Math.floor(fr / (NK.active ? 50 : 20))) + 1;
	var type = $data._lbtype || 'exp';
	var scoreLabelKey = { exp: 'recordScore', ksh: 'rankScoreKsh', money: 'rankScoreMoney' }[type];

	$stage.dialog.leaderboard.removeClass('rank-type-exp rank-type-ksh rank-type-money').addClass('rank-type-' + type);
	$stage.dialog.lbScoreHeader.text(L[scoreLabelKey]);

	data.data.forEach(function (item, index) {
		var profile = $data.users[item.id];

		if (profile) profile = profile.profile.title || profile.profile.name;
		// 접속하지 않은 유저는 /ranking이 붙여 준 별명
		else profile = item.name || L['hidden'];

		item.score = Number(item.score);
		item.expScore = Number(item.expScore);
		$board.append($("<tr>").attr('id', "ranking-" + item.id)
			.addClass("ranking-" + (item.rank + 1))
			.append($("<td>").html(item.rank + 1))
			.append($("<td>")
				.append(getLevelImage(item.expScore).addClass("ranking-image"))
				.append($("<label>").css('padding-top', 2).html(getLevelText(getLevel(item.expScore))))
			)
			.append($("<td>").text(profile))
			.append($("<td>").html(commify(item.score)))
		);
	});
	$("#ranking-" + $data.id).addClass("ranking-me");
	$stage.dialog.lbPage.html(L['page'] + " " + page);
	$stage.dialog.lbPrev.attr('disabled', page <= 1);
	$stage.dialog.lbNext.attr('disabled', data.data.length < lpp);
	$stage.dialog.lbMe.attr('disabled', !!$data.guest);
	$data._lbpage = page - 1;
}
function updateCommunity() {
	var i, o, p, memo;
	var len = 0;

	$stage.dialog.commFriends.empty();
	for (i in $data.friends) {
		len++;
		memo = $data.friends[i];
		o = $data._friends[i] || {};
		p = ($data.users[i] || {}).profile;

		$stage.dialog.commFriends.append($("<div>").addClass("cf-item").attr('id', "cfi-" + i)
			.append($("<div>").addClass("cfi-status cfi-stat-" + (o.server ? 'on' : 'off')))
			.append($("<div>").addClass("cfi-server").html(o.server ? L['server_' + o.server] : "-"))
			.append($("<div>").addClass("cfi-name ellipse").text(p ? (p.title || p.name) : L['hidden']))
			.append($("<div>").addClass("cfi-memo ellipse").text(memo))
			.append($("<div>").addClass("cfi-menu")
				.append($("<i>").addClass("fa fa-pencil").on('click', requestEditMemo))
				.append($("<i>").addClass("fa fa-remove").on('click', requestRemoveFriend))
			)
		);
	}
	function requestEditMemo(e) {
		var id = $(e.currentTarget).parent().parent().attr('id').slice(4);
		var _memo = $data.friends[id];

		showPrompt(L['friendEditMemo'], _memo, function (memo) {
			if (!memo) return;
			send('friendEdit', { id: id, memo: memo }, true);
		});
	}
	function requestRemoveFriend(e) {
		var id = $(e.currentTarget).parent().parent().attr('id').slice(4);
		var memo = $data.friends[id];

		if ($data._friends[id].server) return fail(455);
		showConfirm(memo + "(#" + String(id).substr(0, 5) + ")\n" + L['friendSureRemove'], function (res) {
			if (res) send('friendRemove', { id: id }, true);
		});
	}
	$("#CommunityDiag .dialog-title").html(L['communityText'] + " (" + len + " / 100)");
	if (NK.active) NK.renderFriends();
}
function requestRoomInfo(id) {
	var o = $data.rooms[id];
	var $pls = $("#ri-players").empty();

	$data._roominfo = id;
	$("#RoomInfoDiag .dialog-title").html(id + L['sRoomInfo']);
	$("#ri-title").empty();
	if (o.password) $("#ri-title").append($("<i>").addClass("fa fa-lock")).append("&nbsp;");
	$("#ri-title").append(document.createTextNode(badWords(o.title)));
	$("#ri-mode").html(L['mode' + MODE[o.mode]]);
	$("#ri-round").html(o.round + ", " + o.time + L['SECOND']);
	$("#ri-limit").html(o.players.length + " / " + o.limit);
	o.players.forEach(function (p, i) {
		var $p, $moremi;
		var rd = o.readies[p] || {};
		var isRobot = o.players[i].robot;

		if (isRobot) {
			p = o.players[i];
		} else {
			p = $data.users[p] || (rd.profile ? { id: p, profile: rd.profile, equip: rd.equip || {}, data: { score: rd.score || 0 } } : NULL_USER);
			rd.t = rd.t || 0;
		}

		$pls.append($("<div>").addClass("ri-player")
			.append($moremi = $("<div>").addClass("moremi rip-moremi"))
			.append($p = $("<div>").addClass("ellipse rip-title").text(p.profile.title || p.profile.name))
			.append($("<div>").addClass("rip-team team-" + rd.t).html($("#team-" + rd.t).html()))
			.append($("<div>").addClass("rip-form").html(L['pform_' + rd.f]))
		);
		if (p.id == o.master) $p.prepend($("<label>").addClass("rip-master").html("[" + L['master'] + "]&nbsp;"));
		$p.prepend(getLevelImage(p.data.score).addClass("profile-level rip-level"));

		renderMoremi($moremi, p.equip);
	});
	showDialog($stage.dialog.roomInfo);
	$stage.dialog.roomInfo.show();
}
function requestProfile(id) {
	var o = $data.users[id] || $data.robots[id];
	var $rec = $("#profile-record").empty();
	var $pi, $ex;
	var i;

	if (!o) {
		notice(L['error_405']);
		return;
	}
	$("#ProfileDiag .dialog-title").text((o.profile.title || o.profile.name) + L['sProfile']);
	$(".profile-head").empty().append($pi = $("<div>").addClass("moremi profile-moremi"))
		.append($("<div>").addClass("profile-head-item")
			.append(getImage(o.profile.image).addClass("profile-image"))
			.append($("<div>").addClass("profile-title ellipse").text(o.profile.title || o.profile.name)
				.append($("<label>").addClass("profile-tag").html(" #" + String(o.id).substr(0, 5)))
			)
		)
		.append($("<div>").addClass("profile-head-item")
			.append(getLevelImage(o.data.score).addClass("profile-level"))
			.append($("<div>").addClass("profile-level-text").html(L['LEVEL'] + " " + getLevelText(i = getLevel(o.data.score))))
			.append($("<div>").addClass("profile-score-text").html(commify(o.data.score) + " / " + commify(EXP[i - 1]) + L['PTS']))
		)
		.append($ex = $("<div>").addClass("profile-head-item profile-exordial ellipse").text(badWords(o.exordial || ""))
			.append($("<div>").addClass("expl").css({ 'white-space': "normal", 'width': 300, 'font-size': "11px" }).text(o.exordial))
		);
	if (o.robot) {
		$stage.dialog.profileLevel.show();
		$stage.dialog.profileLevel.prop('disabled', $data.id != $data.room.master);
		$("#profile-place").html($data.room.id + L['roomNumber']);

		var $header = $rec.parent().find(".profile-record-field").first();
		$header.find(".profile-field-name").html(L['selectLevel']);
		$header.find(".profile-field-record").html(L['aiPersonality']);
		$header.find(".profile-field-score").html(L['aiPreferredChar']);

		var levelText = L['aiLevel' + (o.level != null ? o.level : 2)] || '';
		var personalityVal = o.personality || 0;
		var personalityText;
		if (personalityVal < -0.3) personalityText = L['aiPersonality_long'];
		else if (personalityVal > 0.3) personalityText = L['aiPersonality_aggressive'];
		else personalityText = L['aiPersonality_neutral'];
		personalityText += ' (' + (Math.round(personalityVal * 100) / 100) + ')';
		var prefCharText = o.preferredChar || '-';

		$rec.css('width', '100%').append($("<div>").addClass("profile-record-field")
			.append($("<div>").addClass("profile-field-name").html(levelText))
			.append($("<div>").addClass("profile-field-record").html(personalityText))
			.append($("<div>").addClass("profile-field-score").html(prefCharText))
		);

		// 봇 옵션 표시 (한 줄 3열)
		var fastText = o.fastMode ? L['aiFastMode_on'] : L['aiFastMode_off'];
		var muteGameText = !o.muteGame ? L['aiMuteGame_on'] : L['aiMuteGame_off'];
		var muteLobbyText = !o.muteLobby ? L['aiMuteLobby_on'] : L['aiMuteLobby_off'];
		var rqText = o.canRageQuit ? L['aiRageQuit_on'] : L['aiRageQuit_off'];
		$rec.append($("<div>").addClass("profile-record-field")
			.append($("<div>").addClass("profile-field-name").css({ textAlign: 'center', fontSize: '11px' }).html(fastText))
			.append($("<div>").addClass("profile-field-record").css({ textAlign: 'center', fontSize: '11px' }).html(muteGameText))
			.append($("<div>").addClass("profile-field-score").css({ textAlign: 'center', fontSize: '11px' }).html(muteLobbyText))
		);
		$rec.append($("<div>").addClass("profile-record-field")
			.append($("<div>").addClass("profile-field-name").css({ textAlign: 'center', fontSize: '11px' }).html(rqText))
		);
	} else {
		$stage.dialog.profileLevel.hide();
		$("#profile-place").html(o.place ? (o.place + L['roomNumber']) : L['lobby']);
		var $header = $rec.parent().find(".profile-record-field").first();
		$header.find(".profile-field-name").html(L['gameMode']);
		$header.find(".profile-field-record").html(L['record']);
		$header.find(".profile-field-score").html(L['recordScore']);
		for (i in o.data.record) {
			var r = o.data.record[i];

			$rec.append($("<div>").addClass("profile-record-field")
				.append($("<div>").addClass("profile-field-name").html(L['mode' + i]))
				.append($("<div>").addClass("profile-field-record").html(r[0] + L['P'] + " " + r[1] + L['W']))
				.append($("<div>").addClass("profile-field-score").html(commify(r[2]) + L['PTS']))
			);
		}
	}
	renderMoremi($pi, o.equip);
	$data._profiled = id;
	$stage.dialog.profileKick.hide();
	$stage.dialog.profileShut.hide();
	$stage.dialog.profileDress.hide();
	$stage.dialog.profileWhisper.hide();
	$stage.dialog.profileHandover.hide();
	$stage.dialog.profileReport.hide();
	$stage.dialog.profileFriendAdd.hide();

	if ($data.id == id) $stage.dialog.profileDress.show();
	else if (!o.robot) {
		$stage.dialog.profileShut.show();
		$stage.dialog.profileWhisper.show();
		if (!$data.guest) {
			$stage.dialog.profileReport.show();
			$stage.dialog.profileFriendAdd.show();
		}
	}
	if ($data.room) {
		if ($data.id != id && $data.id == $data.room.master) {
			$stage.dialog.profileKick.show();
			$stage.dialog.profileHandover.show();
		}
	}
	showDialog($stage.dialog.profile);
	$stage.dialog.profile.show();
	global.expl($ex);
}
function openReportDialog(id) {
	var o = $data.users[id];

	if ($data.guest) return fail(451);
	if (!o) return notice(L['error_405']);
	if ($data.id == id) return fail(460);

	$stage.dialog.reportTarget.text(o.profile.title || o.profile.name);
	$stage.dialog.reportReason.val(1);
	$stage.dialog.reportDetail.val('');
	$data._reportTarget = id;
	showDialog($stage.dialog.report);
}
function requestInvite(id) {
	var nick;

	if (id != "AI") {
		nick = $data.users[id].profile.title || $data.users[id].profile.name;
		showConfirm(nick + L['sureInvite'], function (res) {
			if (res) send('invite', { target: id });
		});
		return;
	}
	send('invite', { target: id });
}

function loadShop() {
	var $body = $("#shop-shelf");

	$body.html(L['LOADING']);
	processShop(function (res) {
		$body.empty();
		if ($data.guest) res.error = 423;
		if (res.error) {
			$stage.menu.shop.trigger('click');
			return fail(res.error);
		}
		res.goods.sort(function (a, b) { return b.updatedAt - a.updatedAt; }).forEach(function (item, index, my) {
			if (item.cost < 0) return;
			if (!L[item._id]) return;
			var url = iImage(false, item);

			$body.append($("<div>").attr('id', "goods_" + item._id).addClass("goods")
				.append($("<div>").addClass("jt-image goods-image").css('background-image', "url(" + url + ")"))
				.append($("<div>").addClass("goods-title").html(iName(item._id)))
				.append($("<div>").addClass("goods-cost").html(commify(item.cost) + L['ping']))
				.append(explainGoods(item, false))
				.on('click', onGoods));
		});
		global.expl($body);
		filterShop(true);
		if (NK.active) NK.afterShop();
	});
	$(".shop-type.selected").removeClass("selected");
	$("#shop-type-all").addClass("selected");
	$("#m-shop-category").val($("#m-shop-category option:first").val());
	$("#shop-search").val("");
}
function filterShop(by) {
	var isAll = by === true;
	var $o, obj;
	var i;
	var searchTerm = ($("#shop-search").val() || "").toLowerCase().trim();
	var visibleCount = 0;

	if (!isAll) by = by.split(',');
	for (i in $data.shop) {
		obj = $data.shop[i];
		if (obj.cost < 0) continue;
		$o = $("#goods_" + i);
		var show = isAll || by.indexOf(obj.group) !== -1;
		if (show && searchTerm !== '' && iName(i).toLowerCase().indexOf(searchTerm) === -1) show = false;
		if (show) {
			$o.show();
			visibleCount++;
		} else {
			$o.hide();
		}
	}
	var $empty = $("#shop-search-empty");
	if (visibleCount === 0) {
		if (!$empty.length) {
			$("<div>").attr('id', 'shop-search-empty').html(L['shopNoResults']).appendTo("#shop-shelf");
		}
		$empty.show();
	} else {
		$empty.hide();
	}
	if (NK.active) NK.shopCount(visibleCount);
}
function explainGoods(item, equipped, expire) {
	var i;
	var $R = $("<div>").addClass("expl dress-expl")
		.append($("<div>").addClass("dress-item-title").html(iName(item._id) + (equipped ? L['equipped'] : "")))
		.append($("<div>").addClass("dress-item-group").html(L['GROUP_' + item.group]))
		.append($("<div>").addClass("dress-item-expl").html(iDesc(item._id)));
	var $opts = $("<div>").addClass("dress-item-opts");
	var txt;

	if (item.term) $R.append($("<div>").addClass("dress-item-term").html(Math.floor(item.term / 86400) + L['DATE'] + " " + L['ITEM_TERM']));
	if (expire) $R.append($("<div>").addClass("dress-item-term").html((new Date(expire * 1000)).toLocaleString() + L['ITEM_TERMED']));
	for (i in item.options) {
		if (i == "gif" || i == "AI") continue;
		var k = i.charAt(0);

		txt = item.options[i];
		if (k == 'g') txt = "+" + (txt * 100).toFixed(1) + "%p";
		else if (k == 'h') txt = "+" + txt;

		$opts.append($("<label>").addClass("item-opts-head").html(L['OPTS_' + i]))
			.append($("<label>").addClass("item-opts-body").html(txt))
			.append($("<br>"));
	}
	if (txt) $R.append($opts);
	if (item.options && item.options.AI) $R.append($("<div>").addClass("dress-item-ai").html(L['ITEM_AI_MADE']));
	return $R;
}
function processShop(callback) {
	var i;

	$.get("/shop", function (res) {
		$data.shop = {};
		for (i in res.goods) {
			$data.shop[res.goods[i]._id] = res.goods[i];
		}
		if (callback) callback(res);
	});
}
function onGoods(e) {
	var id = $(e.currentTarget).attr('id').slice(6);
	var $obj = $data.shop[id];
	var my = $data.users[$data.id];
	var ping = my.money;
	var after = ping - $obj.cost;
	var $oj;
	var spt = L['surePurchase'];
	var i, ceq = {};

	if ($data.box) if ($data.box[id]) spt = L['alreadyGot'] + " " + spt;
	showDialog($stage.dialog.purchase, true);
	$("#purchase-ping-before").html(commify(ping) + L['ping']);
	$("#purchase-ping-cost").html(commify($obj.cost) + L['ping']);
	$("#purchase-item-name").html(L[id][0]);
	$oj = $("#purchase-ping-after").html(commify(after) + L['ping']);
	$("#purchase-item-desc").html((after < 0) ? L['notEnoughMoney'] : spt);
	for (i in my.equip) ceq[i] = my.equip[i];
	ceq[($obj.group == "Mhand") ? ["Mlhand", "Mrhand"][Math.floor(Math.random() * 2)] : $obj.group] = id;

	renderMoremi("#moremi-after", ceq);

	$data._sgood = id;
	$stage.dialog.purchaseOK.attr('disabled', after < 0);
	if (after < 0) {
		$oj.addClass("purchase-not-enough");
	} else {
		$oj.removeClass("purchase-not-enough");
	}
}

function vibrate(level) {
	if (level < 1) return;

	$("#Middle").css('padding-top', level);
	addTimeout(function () {
		$("#Middle").css('padding-top', 0);
		addTimeout(vibrate, 50, level * 0.7);
	}, 50);
}
function getRandomColor() {
	return "hsl(" + Math.floor(Math.random() * 360) + ", 100%, 85%)";
}
var BONUS_COLORS = {
	hanbang: '#FF6666',
	jackpot: '#000000',
	jackpotShadow: '-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff',
	attack: '#ff9e59',
	flush: '#ff52cb',
	sumi: '#00FFFF',
	straight: '#FFFF00',
	mission: '#00FF00',
	missionRev: '#66FF66',
	fullhouse: '#c26eff',
	defense: '#647bff',
};
Object.defineProperty(BONUS_COLORS, 'linking', {
	get: function() {
		// 신 UI: 흰색에 메인 색(테마 설정의 "메인 색")을 조금 섞은 색 (사용자 요청)
		if (typeof NK !== 'undefined' && NK.active) return 'color-mix(in oklch, var(--nk-second) 30%, #fff)';
		var dark = document.body.classList.contains('dark-mode');
		if (document.body.classList.contains('theme-grape')) return dark ? 'rgb(239, 205, 249)' : 'rgb(239, 205, 249)';
		if (document.body.classList.contains('theme-slate')) return dark ? 'rgb(223, 233, 238)' : 'rgb(223, 233, 238)';
		if (document.body.classList.contains('theme-sweetpotato')) return dark ? 'rgb(255, 239, 132)' : 'rgb(255, 239, 132)';
		if (document.body.classList.contains('theme-cottoncandy')) return dark ? 'rgb(255, 215, 232)' : 'rgb(255, 215, 232)';
		if (document.body.classList.contains('theme-watermelon')) return dark ? 'rgb(254, 226, 226)' : 'rgb(254, 226, 226)';
		if (document.body.classList.contains('theme-red')) return dark ? 'rgb(239, 154, 154)' : 'rgb(239, 154, 154)';
		if (document.body.classList.contains('theme-orange')) return dark ? 'rgb(255, 204, 128)' : 'rgb(255, 204, 128)';
		if (document.body.classList.contains('theme-gray')) return dark ? 'rgb(189, 189, 189)' : 'rgb(189, 189, 189)';
		if (document.body.classList.contains('theme-yellow')) return dark ? 'rgb(255, 224, 130)' : 'rgb(255, 224, 130)';
		if (document.body.classList.contains('theme-green')) return dark ? 'rgb(174, 213, 129)' : 'rgb(174, 213, 129)';
		return dark ? 'rgb(144, 202, 249)' : 'rgb(146, 203, 250)';
	},
	enumerable: true,
	configurable: true
});
function pushDisplay(text, mean, theme, wc, isSumi, overrideLinkIndex, isStraight, isHanbang, fullHouseChars, historyOverride, isAttack, isDefense, isFlush, isJackpot, onComplete) {
	var len;
	var mode = MODE[$data.room.mode];
	var isKKT = mode == "KKT" || mode == "EKK" || mode == "KAK" || mode == "EAK" || mode == "JKT";
	var isRev = (mode == "KAP" || mode == "KAK" || mode == "EAP" || mode == "EAK" || mode == "JAP");
	var beat = (ACTIVE_BEAT || BEAT)[len = text.length];
	var ta, kkt;
	var i, j = 0;
	var $l;
	var tick = $data.turnTime / 96;
	var sg = $data.turnTime / 12;
	var displayText = text.replace(/</g, '〈').replace(/&/g, '＆').replace(/>/g, '〉');

	// Sumi-Sanggwan Highlight Index: Last Char for Normal, First Char for Reverse

	var linkIdx = -1;
	var linkingIndices = [];

	// Priority 0: 서버에서 전송한 linkIndex 사용 (모든 규칙)
	// 서버의 getLinkIndex 함수가 정확한 시작 인덱스를 계산하여 전송
	if (typeof overrideLinkIndex !== 'undefined' && overrideLinkIndex !== null) {
		linkIdx = overrideLinkIndex;
	}
	// Priority 1: Middle (서버 linkIndex 미지원 시 fallback)
	else if ($data.room.opts.middle) {
		if (isRev) {
			linkIdx = Math.floor((len - 1) / 2); // Reverse: Middle
		} else {
			linkIdx = Math.ceil((len - 1) / 2); // Normal: Middle
		}
	}
	// Priority 2: First
	else if ($data.room.opts.first) {
		if ($data.room.opts.second) {
			// First + Second
			if (isRev) linkIdx = len - 2; // KAP: Back-2
			else linkIdx = 1; // Normal: Front-2 (Index 1)
			if (mode == 'EKT') linkIdx = 1; // EKT: Front-2 (Start index 1)
		} else {
			// First Only
			if (isRev) linkIdx = len - 1; // KAP: Back-1 (End)
			else linkIdx = 0; // Normal: Front-1 (Start)
		}
	}
	// Priority 3: Second
	else if ($data.room.opts.second) {
		if (isRev) linkIdx = 1; // KAP: Front-2
		else linkIdx = len - 2; // Normal: Back-2
	}
	// Default
	else {
		if (isRev) linkIdx = 0; // KAP: Front-1
		else linkIdx = len - 1; // Normal: Back-1
	}

	// [New Logic] Sumi-Sanggwan Highlight Index
	var sumiIdx = linkIdx;

	// [Exception] Boomerang Conflict with First Rule (Pure First Only)
	if ($data.room.opts.first && !$data.room.opts.middle && !$data.room.opts.second) {
		// If First rule is active (and no Middle/Second), linking is trivial (Start==Start).
		// Force Boomerang to use Cyclic Linking (End<->Start).
		if (isRev) sumiIdx = 0; // Reverse: Check Start (vs Prev End)
		else sumiIdx = len - 1; // Normal: Check End (vs Prev Start)
	}

	// [New Logic] Linking Indices (Purple)
	if ((RULE[mode].lang == 'en' && mode == 'EKT') || mode == 'KKU') {
		// EKT/KKU Special Multi-Char Logic (3-gram)
		// EKT/KKU Linking usually length 3 (or 2 for First+Second).
		// If First rule active, starting from linkIdx (which is Start for First rule).
		// If Second... 
		// Wait, let's keep it simple based on the start index found.

		var startK = linkIdx;
		if (typeof overrideLinkIndex !== 'undefined' && overrideLinkIndex !== null) {
			// If override is present (Random Rule), assume linkIdx is the correct start index
			// Just highlight 3 chars from there.
			for (var k = startK; k < startK + 3; k++) {
				if (k >= 0 && k < len) linkingIndices.push(k);
			}
		}
		else if ($data.room.opts.middle) {
			// Middle for EKT/KKU: 서버에서 시작 인덱스를 반환 (getLinkIndex)
			// linkIdx는 3글자 연결의 시작 인덱스
			// 예: "ABCDE" (len=5) -> linkIdx=1 -> 강조 인덱스 1,2,3 ("BCD")
			for (var k = startK; k < startK + 3; k++) {
				if (k >= 0 && k < len) linkingIndices.push(k);
			}
		}
		else if ($data.room.opts.first) {
			// ABCDEFGH 예시: First=ABC(0~2), First+Second=BCD(1~3)
			if ($data.room.opts.second) {
				// First+Second: 인덱스 1부터 3글자 (BCD)
				for (var k = 1; k < 4; k++) {
					if (k >= 0 && k < len) linkingIndices.push(k);
				}
			} else {
				// First only: 맨 앞 3글자 (ABC)
				for (var k = 0; k < 3; k++) {
					if (k >= 0 && k < len) linkingIndices.push(k);
				}
			}
		}
		else if ($data.room.opts.second) {
			// Second Rule EKT/KKU: slice(len-4, len-1) - 끝에서 4~2번째 3글자 (EFG)
			// ABCDEFGH 예시: 인덱스 4, 5, 6 (EFG) - 마지막 글자(H) 제외
			var secondStart = len - 4;
			for (var k = 0; k < 3; k++) {
				var idx = secondStart + k;
				if (idx >= 0 && idx < len - 1) linkingIndices.push(idx); // len-1 제외 (마지막 글자 제외)
			}
		}
		else {
			// Default EKT/KKU: slice(-3) - 마지막 3글자
			// linkIdx above: len-1.
			// slice(-3) start index is len-3.
			// Adjust linkIdx to be start?
			// Default logic above gave len-1.
			// Let's override for EKT default.
			if (startK == len - 1) {
				for (var k = 0; k < 3; k++) {
					if (len - 1 - k >= 0) linkingIndices.push(len - 1 - k);
				}
			} else {
				// Fallback
				linkingIndices.push(startK);
			}
		}
	} else {
		// All others (1 char)
		linkingIndices.push(linkIdx);
	}

	$stage.game.display.empty();
	if ($data.room.opts.drg) $stage.game.display.css('box-shadow', '0px 0px 20px ' + getRandomColor());
	else $stage.game.display.css('box-shadow', '');

	if (beat) {
		ta = 'As' + $data._speed;
		beat = beat.split("");
	} else if (RULE[mode].lang == "en" && len < 10) {
		ta = 'As' + $data._speed;
	} else {
		ta = 'Al';
		if (!($data.opts && $data.opts.ns)) vibrate(len);
	}
	kkt = 'K' + $data._speed;

	if (beat) {
		for (i in beat) {
			if (beat[i] == "0") continue;

			var charIdx = isRev ? len - j - 1 : j;
			var isSumiChar = isSumi && (charIdx === sumiIdx);
			var isStraightChar = isStraight && (isRev ? (charIdx === 0) : (charIdx === len - 1));
			var isLinking = (RULE[mode].rule === "Classic") && (linkingIndices.indexOf(charIdx) !== -1);
			var isFullHouseChar = fullHouseChars && fullHouseChars.indexOf(charIdx) !== -1;
			var isLinkPos = linkingIndices.indexOf(charIdx) !== -1;
			var isDefPos = isRev ? (charIdx === len - 1) : (charIdx === 0);

			$stage.game.display.append($l = $("<div>")
				.addClass("display-text")
				.css({ 'float': isRev ? "right" : "left", 'margin-top': -6, 'font-size': 36 })
				.hide()
				.css('color', ($data.room.opts.drg) ? getRandomColor() : "")
				.html(displayText.charAt(charIdx))
			);
			j++;
			addTimeout(function ($l, snd, isSumiChar, isStraightChar, isLinking, isHanbang, originalChar, isFullHouseChar, isLinkPos, isDefPos) {
				var anim = { 'margin-top': 0 };

				playSound(snd);
				if (isHanbang && isLinkPos) {
					playSound('missing');
					$l.css({ 'color': BONUS_COLORS.hanbang });
					anim['font-size'] = 20;
				} else if (isJackpot && isLinkPos) {
					playSound('mission');
					$l.css({ 'color': BONUS_COLORS.jackpot, 'text-shadow': BONUS_COLORS.jackpotShadow });
					anim['font-size'] = 28;
				} else if (isAttack && isLinkPos) {
					playSound('attack');
					$l.css({ 'color': BONUS_COLORS.attack });
					anim['font-size'] = 28;
				} else if (isFlush && isLinkPos) {
					playSound('mission');
					$l.css({ 'color': BONUS_COLORS.flush });
					anim['font-size'] = 28;
				} else if (isSumiChar) {
					playSound('mission');
					$l.css({ 'color': BONUS_COLORS.sumi });
					anim['font-size'] = 24;
				} else if (isStraightChar) {
					playSound('mission');
					$l.css({ 'color': BONUS_COLORS.straight });
					anim['font-size'] = 24;
				} else if (originalChar == $data.mission || matchesEasyMission(originalChar, $data.mission)) {
					playSound('mission');
					$l.css({ 'color': BONUS_COLORS.mission });
					anim['font-size'] = 24;
				} else if (isFullHouseChar) {
					playSound('mission');
					$l.css({ 'color': BONUS_COLORS.fullhouse });
					anim['font-size'] = 24;
				} else if (isDefense && isDefPos) {
					playSound('defence');
					$l.css({ 'color': BONUS_COLORS.defense });
					anim['font-size'] = 28;
				} else if (isLinking) {
					$l.css({ 'color': BONUS_COLORS.linking });
					anim['font-size'] = 20;
				} else {
					anim['font-size'] = 20;
				}
				$l.show().animate(anim, 100);
				// 신 UI(단어 창이 크게 확대됨): 공격·방어·미션 등으로 커진 글자도 다른 글자처럼 곧바로 원래 크기로 돌아옴 (색은 그대로)
				if (NK.active && anim['font-size'] > 20) $l.animate({ 'font-size': 20 }, 200);
			}, Number(i) * tick, $l, ta, isSumiChar, isStraightChar, isLinking, isHanbang, text.charAt(charIdx), isFullHouseChar, isLinkPos, isDefPos);
		}
		i = $stage.game.display.children("div").get(0);
		$(i).css(isRev ? 'margin-right' : 'margin-left', ($stage.game.display.width() - 20 * len) * 0.5);
	} else {
		j = "";
		if (isRev) for (i = 0; i < len; i++) {
			addTimeout(function (t, idx, _h, t_disp) {
				playSound(ta);
				var isSumiChar = isSumi && (idx === sumiIdx);
				var isLinking = linkingIndices.indexOf(idx) !== -1;
				var isStraightChar = isStraight && (idx === 0);
				var isFullHouseChar = fullHouseChars && fullHouseChars.indexOf(idx) !== -1;
				var isLinkPos = linkingIndices.indexOf(idx) !== -1;
				var isDefPos = (idx === len - 1); // Rev: defense char = last char

				if (isHanbang && isLinkPos) {
					playSound('missing');
					j = "<label style='color: " + BONUS_COLORS.hanbang + ";'>" + t_disp + "</label>" + j;
				} else if (isJackpot && isLinkPos) {
					playSound('mission');
					j = "<label style='color: " + BONUS_COLORS.jackpot + "; text-shadow: " + BONUS_COLORS.jackpotShadow + ";'>" + t_disp + "</label>" + j;
				} else if (isAttack && isLinkPos) {
					playSound('attack');
					j = "<label style='color: " + BONUS_COLORS.attack + ";'>" + t_disp + "</label>" + j;
				} else if (isFlush && isLinkPos) {
					playSound('mission');
					j = "<label style='color: " + BONUS_COLORS.flush + ";'>" + t_disp + "</label>" + j;
				} else if (isSumiChar) {
					playSound('mission');
					j = "<label style='color: " + BONUS_COLORS.sumi + ";'>" + t_disp + "</label>" + j;
				} else if (isStraightChar) {
					playSound('mission');
					j = "<label style='color: " + BONUS_COLORS.straight + ";'>" + t_disp + "</label>" + j;
				} else if (t == $data.mission || matchesEasyMission(t, $data.mission)) {
					playSound('mission');
					j = "<label style='color: " + BONUS_COLORS.missionRev + ";'>" + t_disp + "</label>" + j;
				} else if (isFullHouseChar) {
					playSound('mission');
					j = "<label style='color: " + BONUS_COLORS.fullhouse + ";'>" + t_disp + "</label>" + j;
				} else if (isDefense && isDefPos) {
					playSound('defence');
					j = "<label style='color: " + BONUS_COLORS.defense + ";'>" + t_disp + "</label>" + j;
				} else if (isLinking) {
					j = "<label style='color: " + BONUS_COLORS.linking + ";'>" + t_disp + "</label>" + j;
				} else {
					j = ($data.room.opts.drg ? ("<label style='color:" + getRandomColor() + "'>" + t_disp + "</label>") : t_disp) + j;
				}
				$stage.game.display.html(j);
			}, Number(i) * sg / len, text[len - i - 1], len - i - 1, isHanbang, displayText[len - i - 1]);
		}
		else for (i = 0; i < len; i++) {
			addTimeout(function (t, idx, _h, t_disp) {
				playSound(ta);
				var isSumiChar = isSumi && (idx === sumiIdx);
				var isStraightChar = isStraight && (idx === len - 1); // Normal: Last char
				var isLinking = (RULE[mode].rule === "Classic") && (linkingIndices.indexOf(idx) !== -1);
				var isFullHouseChar = fullHouseChars && fullHouseChars.indexOf(idx) !== -1;
				var isLinkPos = linkingIndices.indexOf(idx) !== -1;
				var isDefPos = (idx === 0); // Normal: defense char = first char

				if (isHanbang && isLinkPos) {
					playSound('missing');
					j += "<label style='color: " + BONUS_COLORS.hanbang + ";'>" + t_disp + "</label>";
				} else if (isJackpot && isLinkPos) {
					playSound('mission');
					j += "<label style='color: " + BONUS_COLORS.jackpot + "; text-shadow: " + BONUS_COLORS.jackpotShadow + ";'>" + t_disp + "</label>";
				} else if (isAttack && isLinkPos) {
					playSound('attack');
					j += "<label style='color: " + BONUS_COLORS.attack + ";'>" + t_disp + "</label>";
				} else if (isFlush && isLinkPos) {
					playSound('mission');
					j += "<label style='color: " + BONUS_COLORS.flush + ";'>" + t_disp + "</label>";
				} else if (isSumiChar) {
					playSound('mission');
					j += "<label style='color: " + BONUS_COLORS.sumi + ";'>" + t_disp + "</label>";
				} else if (isStraightChar) {
					playSound('mission');
					j += "<label style='color: " + BONUS_COLORS.straight + ";'>" + t_disp + "</label>";
				} else if (t == $data.mission || matchesEasyMission(t, $data.mission)) {
					playSound('mission');
					j += "<label style='color: " + BONUS_COLORS.mission + ";'>" + t_disp + "</label>";
				} else if (isFullHouseChar) {
					playSound('mission');
					j += "<label style='color: " + BONUS_COLORS.fullhouse + ";'>" + t_disp + "</label>";
				} else if (isDefense && isDefPos) {
					playSound('defence');
					j += "<label style='color: " + BONUS_COLORS.defense + ";'>" + t_disp + "</label>";
				} else if (isLinking) {
					j += "<label style='color: " + BONUS_COLORS.linking + ";'>" + t_disp + "</label>";
				} else {
					j += ($data.room.opts.drg ? ("<label style='color:" + getRandomColor() + "'>" + t_disp + "</label>") : t_disp);
				}
				$stage.game.display.html(j);
			}, Number(i) * sg / len, text[i], i, isHanbang, displayText[i]);
		}
	}
	addTimeout(function () {
		for (i = 0; i < 3; i++) {
			addTimeout(function (v) {
				if (isKKT) {
					if (v == 1) return;
					else playSound('kung');
				}
				(beat ? $stage.game.display.children(".display-text") : $stage.game.display)
					.css('font-size', 21)
					.animate({ 'font-size': 20 }, tick);
			}, i * tick * 2, i);
		}
		addTimeout(pushHistory, tick * 4, (historyOverride !== undefined ? historyOverride : displayText), mean, theme, wc);
		if (!isKKT) playSound(kkt);
		if (onComplete) addTimeout(onComplete, tick * 4 + 50);
	}, sg);
}
function pushHint(hint) {
	var v = processWord("", hint);
	var $obj;

	$stage.game.hints.append(
		$obj = $("<div>").addClass("hint-item")
			.append($("<label>").html(v))
			.append($("<div>").addClass("expl").css({ 'white-space': "normal", 'width': 200 }).html(v.html()))
	);
	if (!mobile) $obj.width(0).animate({ width: 215 });
	global.expl($obj);
}
function pushHistory(text, mean, theme, wc) {
	var $v, $w, $x;
	var wcs = wc ? wc.split(',') : [], wd = {};
	var val;
	var displayText = badWords(text);  // 표시용 텍스트는 비속어 필터링

	$stage.game.history.prepend($v = $("<div>")
		.addClass("ellipse history-item")
		.width(0)
		.animate({ width: 200 })
		.css('color', ($data.room.opts.drg) ? getRandomColor() : "")
		.html(displayText)
	);
	$w = $stage.game.history.children();
	if ($w.length > 6) {
		$w.last().remove();
	}
	val = processWord(text, mean, theme, wcs);
	/*val = mean;
	if(theme) val = "<label class='history-theme-c'>&lt;" + theme + "&gt;</label> " + val;*/

	wcs.forEach(function (item) {
		if (wd[item]) return;
		if (!L['class_' + item]) return;
		wd[item] = true;
		$v.append($("<label>").addClass("history-class").html(L['class_' + item]));
	});
	$v.append($w = $("<div>").addClass("history-mean ellipse").append(val))
		.append($x = $("<div>").addClass("expl").css({ 'width': 200, 'white-space': "normal" })
			.html("<h5 style='color: #FFFFFF; margin-bottom: 4px;'>" + displayText + "</h5><h5 style='color: #BBBBBB;'>" + val.html() + "</h5>")
		);
	global.expl($v);
}

function loadSounds(list, callback, silent) {
	var remain = list.length;
	var onDone = function () {
		if (NK.active && !silent) NK.loadProgress((list.length - remain + 1) / list.length);
		if (--remain <= 0) {
			if (callback) callback();
		} else if (!silent) {
			loading(L['loadRemain'] + remain);
		}
	};

	if (remain === 0) {
		if (callback) callback();
		return;
	}

	list.forEach(function (v) {
		getAudio(v.key, v.value, onDone);
	});
}
function getAudio(k, url, cb) {
	var req = new XMLHttpRequest();

	req.open("GET", /*($data.PUBLIC ? "http://jjo.kr" : "") +*/ url);
	req.responseType = "arraybuffer";
	req.onload = function (e) {
		if (audioContext) audioContext.decodeAudioData(e.target.response, function (buf) {
			$sound[k] = buf;
			if (cb) cb();
		}, onErr); else onErr();
	};
	function onErr(err) {
		$sound[k] = new AudioSound(url);
		if (cb) cb();
	}
	function AudioSound(url) {
		var my = this;

		this.audio = new Audio(url);
		this.audio.load();
		this.start = function () {
			my.audio.play();
		};
		this.stop = function () {
			my.audio.currentTime = 0;
			my.audio.pause();
		};
	}
	req.send();
}
function playBGM(key, force) {
	var old = $data.bgm;
	$data.bgm = null;
	if (old) old.stop();

	if ($data.bgmList && $data.bgmList[key] && !$sound[key]) {
		getAudio(key, $data.bgmList[key], function () {
			// If different BGM was requested while loading, don't play this one
			// However, we don't have a good way to track "requested" BGM here without more state.
			// But since we just stopped previous BGM, let's assume if we match logic we play.
			$data.bgm = playSound(key, true);
		});
		return;
	}

	return $data.bgm = playSound(key, true);
}
// 나가도 라운드가 끝나지 않는(ewq가 거짓인) 게임 모드는 진행 중인 BGM이 게임 그 자체라서, 설정 저장 등으로 끊지 않아야 함
function isGameBGMKept() {
	var r = $data.room && $data.room.gaming && RULE[MODE[$data.room.mode]];

	return !!r && !r.ewq;
}
function stopBGM() {
	var old = $data.bgm;
	$data.bgm = null;
	if (old) old.stop();
}
function playSound(key, loop) {
	var src, sound;
	var mute = (loop && $data.muteBGM) || (!loop && $data.muteEff);
	var vol = loop ? $data.BGMVolume : $data.EffectVolume;
	if (typeof vol === 'undefined') vol = 1;

	sound = $sound[key] || $sound.missing;
	if (window.hasOwnProperty("AudioBuffer") && sound instanceof AudioBuffer) {
		src = audioContext.createBufferSource();
		src.startedAt = audioContext.currentTime;
		src.loop = loop;
		src.buffer = sound;
		if (loop) {
			src.loopStart = 0;
			src.loopEnd = sound.duration;
			src.onended = function () {
				if ($data.bgm === src) {
					$data.bgm = playSound(key, true);
				}
			};
		}

		var gain = audioContext.createGain();
		gain.gain.value = mute ? 0 : vol;
		src.connect(gain);
		gain.connect(audioContext.destination);
		src.gainNode = gain;
	} else {
		if (sound.audio.readyState) sound.audio.currentTime = 0;
		sound.audio.loop = loop || false;
		sound.audio.volume = mute ? 0 : vol;
		src = sound;
	}
	if ($_sound[key]) $_sound[key].stop();
	$_sound[key] = src;
	src.key = key;
	src.__BGM = loop;
	src.start();
	/*if(sound.readyState) sound.currentTime = 0;
	sound.loop = loop || false;
	sound.volume = ((loop && $data.muteBGM) || (!loop && $data.muteEff)) ? 0 : 1;
	sound.play();*/

	return src;
}
function stopAllSounds() {
	var i;

	for (i in $_sound) $_sound[i].stop();
}
// 사운드팩에 없는 파일의 대체 팩 (예: 차누 팩에 없는 소리는 오리지널 팩 것을 사용)
var SOUND_PACK_FALLBACK = { "차누": "오리지널" };
// 팩에 filename이 있으면 팩 경로, 없으면 대체 팩 경로, 그것도 없으면 null (호출부가 기본 경로 유지)
function resolvePackSoundPath(packs, pack, filename) {
	var seen = {};
	while (pack && !seen[pack.name]) {
		if (pack.files.indexOf(filename) != -1) return "/media/kkutu/" + pack.name + "/" + filename;
		seen[pack.name] = true;
		var fbName = SOUND_PACK_FALLBACK[pack.name];
		pack = fbName ? packs.find(function (p) { return p.name === fbName; }) : null;
	}
	return null;
}
function changeSoundPack(newPackName, callback) {
	// 현재 재생 중인 BGM/소리 중지 (리듬/자음퀴즈 진행 중에는 $_sound에 든 BGM도 끊기므로 통째로 유지)
	if (!isGameBGMKept()) {
		stopBGM();
		stopAllSounds();
	}

	// 사운드 팩 목록 가져오기
	$.get("/soundpacks", function (packs) {
		var newPack = packs.find(function (p) { return p.name === newPackName; });
		var i;

		// 기본 사운드 리스트 구성
		var soundList = [
			{ key: "k", value: "/media/kkutu/k.mp3" },
			{ key: "lobby", value: "/media/kkutu/LobbyBGM.mp3" },
			{ key: "jaqwi", value: "/media/kkutu/JaqwiBGM.mp3" },
			{ key: "jaqwiF", value: "/media/kkutu/JaqwiFastBGM.mp3" },
			{ key: "game_start", value: "/media/kkutu/game_start.mp3" },
			{ key: "round_start", value: "/media/kkutu/round_start.mp3" },
			{ key: "fail", value: "/media/kkutu/fail.mp3" },
			{ key: "timeout", value: "/media/kkutu/timeout.mp3" },
			{ key: "lvup", value: "/media/kkutu/lvup.mp3" },
			{ key: "Al", value: "/media/kkutu/Al.mp3" },
			{ key: "success", value: "/media/kkutu/success.mp3" },
			{ key: "missing", value: "/media/kkutu/missing.mp3" },
			{ key: "mission", value: "/media/kkutu/mission.mp3" },
			{ key: "kung", value: "/media/kkutu/kung.mp3" },
			{ key: "horr", value: "/media/kkutu/horr.mp3" },
			{ key: "attack", value: "/media/common/attack.mp3" },
			{ key: "defence", value: "/media/common/defence.mp3" },
			{ key: "moondust", value: "/media/common/moondust.opus" }
		];
		for (i = 0; i <= 10; i++) {
			soundList.push(
				{ key: "T" + i, value: "/media/kkutu/T" + i + ".mp3" },
				{ key: "K" + i, value: "/media/kkutu/K" + i + ".mp3" },
				{ key: "As" + i, value: "/media/kkutu/As" + i + ".mp3" }
			);
		}

		// 사운드 팩에 있는 파일로 경로 교체
		if (newPack) {
			soundList.forEach(function (s) {
				var filename = s.value.split('/').pop();
				var packPath = resolvePackSoundPath(packs, newPack, filename);
				if (packPath) s.value = packPath;
			});
		}

		// 새 사운드 로드 (silent=true로 오버레이 없이 로드)
		loadSounds(soundList, function () {
			// 로비에 있으면 로비 BGM 재생 (리플레이 중에는 제외)
			if (!$data._replay && (!$data.room || !$data.room.gaming)) {
				playBGM("lobby");
			}
			if (callback) callback();
		}, true);
	});
}