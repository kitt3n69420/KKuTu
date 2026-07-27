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


function drawMyDress(avGroup, resetFields) {
	var $view = $("#dress-view");
	var my = $data.users[$data.id];

	renderMoremi($view, my.equip);
	$(".dress-type.selected").removeClass("selected");
	$("#dress-type-all").addClass("selected");
	$("#dress-category-select").val($("#dress-category-select option:first").val());
	if (resetFields) {
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
		tryDict(word, function (res) {
			var blend = false;

			if (res.error) {
				if (word.length == 3) {
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

function drawLeaderboard(data) {
	var $board = $stage.dialog.lbTable.empty();
	var fr = data.data[0] ? data.data[0].rank : 0;
	var page = (data.page || Math.floor(fr / 20)) + 1;

	data.data.forEach(function (item, index) {
		var profile = $data.users[item.id];

		if (profile) profile = profile.profile.title || profile.profile.name;
		else profile = L['hidden'];

		item.score = Number(item.score);
		$board.append($("<tr>").attr('id', "ranking-" + item.id)
			.addClass("ranking-" + (item.rank + 1))
			.append($("<td>").html(item.rank + 1))
			.append($("<td>")
				.append(getLevelImage(item.score).addClass("ranking-image"))
				.append($("<label>").css('padding-top', 2).html(getLevel(item.score)))
			)
			.append($("<td>").text(profile))
			.append($("<td>").html(commify(item.score)))
		);
	});
	$("#ranking-" + $data.id).addClass("ranking-me");
	$stage.dialog.lbPage.html(L['page'] + " " + page);
	$stage.dialog.lbPrev.attr('disabled', page <= 1);
	$stage.dialog.lbNext.attr('disabled', data.data.length < 12);
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
			.append($("<div>").addClass("profile-level-text").html(L['LEVEL'] + " " + (i = getLevel(o.data.score))))
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

	if ($data.id == id) $stage.dialog.profileDress.show();
	else if (!o.robot) {
		$stage.dialog.profileShut.show();
		$stage.dialog.profileWhisper.show();
		if (!$data.guest) $stage.dialog.profileReport.show();
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
		var dark = document.body.classList.contains('dark-mode');
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
	var isKKT = mode == "KKT" || mode == "EKK" || mode == "KAK" || mode == "EAK";
	var isRev = (mode == "KAP" || mode == "KAK" || mode == "EAP" || mode == "EAK");
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
function changeSoundPack(newPackName, callback) {
	// 현재 재생 중인 BGM 중지
	stopBGM();
	stopAllSounds();

	// 사운드 팩 목록 가져오기
	$.get("/soundpacks", function (packs) {
		var newPack = packs.find(function (p) { return p.name === newPackName; });
		var packFiles = newPack ? newPack.files : [];
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
			{ key: "defence", value: "/media/common/defence.mp3" }
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
				if (packFiles.indexOf(filename) != -1) {
					s.value = "/media/kkutu/" + newPack.name + "/" + filename;
				}
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