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

var spamWarning = 0;
var spamCount = 0;
// var smile = 94, tag = 35;

function zeroPadding(num, len) {
	if (num < 0) {
		var s = Math.abs(num).toString();
		return "-" + "000000000000000".slice(0, Math.max(0, len - s.length) - 1) + s;
	}
	var s = num.toString();
	return "000000000000000".slice(0, Math.max(0, len - s.length)) + s;
}
function send(type, data, toMaster) {
	var i, r = { type: type };
	var subj = toMaster ? ws : (rws || ws);

	for (i in data) r[i] = data[i];

	/*if($data._talkValue == r.value){
		if(++$data._sameTalk >= 3) return fail();
	}else $data._sameTalk = 0;
	$data._talkValue = r.value;*/

	// WebSocket이 아직 연결 중인 경우 연결 완료 후 전송
	if (subj.readyState === _WebSocket.CONNECTING) {
		subj.addEventListener('open', function onOpen() {
			subj.removeEventListener('open', onOpen);
			subj.send(JSON.stringify(r));
		}, { once: true });
		return;
	}

	// WebSocket이 연결되지 않은 경우 전송하지 않음
	if (subj.readyState !== _WebSocket.OPEN) {
		return;
	}

	// Exempt 'draw' and 'test' from spam counter
	if (type != "test" && type != "draw" && type != "fill" && type != "team") if (spamCount++ > 10) {
		if (++spamWarning >= 3) return subj.close();
		spamCount = 5;
	}
	subj.send(JSON.stringify(r));
}
function loading(text) {
	if (text) {
		if ($("#Intro").is(':visible')) {
			$stage.loading.hide();
			$("#intro-text").html(text);
		} else $stage.loading.html(text).fadeIn(200);
	} else $stage.loading.fadeOut(200);
}
function escapeContent(text) {
	if (typeof text !== 'string') return text;
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}
function showDialog($d, noToggle) {
	var size = [$(window).width(), $(window).height()];

	if (!noToggle && $d.is(":visible")) {
		$d.hide();
		return false;
	} else {
		$(".dialog-front").removeClass("dialog-front");
		$d.show().addClass("dialog-front").css({
			'left': (size[0] - $d.width()) * 0.5,
			'top': (size[1] - $d.height()) * 0.5
		});
		return true;
	}
}
function showConfirm(msg, callback, yesText, noText) {
	if (typeof callback !== 'function') callback = function () { };
	$stage.dialog.confirmText.html(escapeContent(msg).replace(/\n/g, '<br>'));
	$stage.dialog.confirmOK.text(yesText || L['OK']);
	$stage.dialog.confirmNo.text(noText || L['NO']);
	showDialog($stage.dialog.confirm);

	$stage.dialog.confirmOK.off('click').on('click', function () {
		$stage.dialog.confirm.hide();
		callback(true);
	});
	$stage.dialog.confirmNo.off('click').on('click', function () {
		$stage.dialog.confirm.hide();
		callback(false);
	});
}
function showAlert(msg, callback) {
	$stage.dialog.alertText.html(escapeContent(msg).replace(/\n/g, '<br>'));
	showDialog($stage.dialog.alert, true);

	$stage.dialog.alertOK.off('click').on('click', function () {
		$stage.dialog.alert.hide();
		if (typeof callback === 'function') callback();
	});
}
function tryOpenLink(url) {
	showConfirm(L['linkWarning'], function (res) {
		if (res) window.open(url);
	});
}
function showPrompt(msg, value, callback) {
	if (typeof callback !== 'function') callback = function () { };
	$stage.dialog.inputText.html(escapeContent(msg).replace(/\n/g, '<br>'));
	$stage.dialog.inputInput.val(value || "");
	showDialog($stage.dialog.input);
	$stage.dialog.inputInput.focus();

	var onOK = function () {
		$stage.dialog.input.hide();
		callback($stage.dialog.inputInput.val());
	};
	var onNo = function () {
		$stage.dialog.input.hide();
		callback(null);
	};

	$stage.dialog.inputOK.off('click').on('click', onOK);
	$stage.dialog.inputNo.off('click').on('click', onNo);
	$stage.dialog.inputInput.off('keypress').on('keypress', function (e) {
		if (e.which == 13) onOK();
	});
}
function applyTheme(theme) {
	document.body.classList.remove('theme-red', 'theme-orange', 'theme-gray', 'theme-yellow', 'theme-green');
	if (theme === 'red') document.body.classList.add('theme-red');
	else if (theme === 'orange') document.body.classList.add('theme-orange');
	else if (theme === 'gray') document.body.classList.add('theme-gray');
	else if (theme === 'yellow') document.body.classList.add('theme-yellow');
	else if (theme === 'green') document.body.classList.add('theme-green');
}
function applyDarkMode(setting) {
	var isDark = setting === 'dark' || (setting === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
	if (isDark) document.body.classList.add('dark-mode');
	else document.body.classList.remove('dark-mode');
}
function rebuildInjeongExplHTML(dict) {
	function themeList(list) {
		return (list || []).map(function (item) { return dict['theme_' + item] || item; });
	}

	return "<h5>" + (dict['explInjeong'] || '') + "</h5>"
		+ "<h5 style='margin-top: 2px; border-top: 1px dashed #444444; padding-top: 2px; color: #BBBBBB;'>" + (dict['explInjeongListTitle'] || '') + "</h5>"
		+ "<h5>" + themeList(KO_INJEONG) + "</h5>"
		+ "<h5 style='margin-top: 2px; border-top: 1px dashed #444444; padding-top: 2px; color: #BBBBBB;'>" + (dict['explInjeongListTitle'] || '') + " (" + (dict['modeEKT'] || '') + ", " + (dict['modeESH'] || '') + ")</h5>"
		+ "<h5>" + themeList(EN_INJEONG) + "</h5>";
}
function retranslatePage(dict) {
	function faReplace(raw) {
		return raw.replace(/FA\{[^\}]+\}/g, function (seq) {
			return "<i class='fa fa-" + seq.slice(3, seq.length - 1) + "'></i>";
		});
	}
	function resolve(key, fallbackKey) {
		var v = dict[key];

		if (v === undefined && fallbackKey) v = dict[fallbackKey];
		if (v === undefined) v = "(L#" + key + ")";
		return v.toString();
	}

	$("[data-lang-key]").not("[data-lang-special]").each(function () {
		var $el = $(this);
		var value = resolve($el.attr('data-lang-key'), $el.attr('data-lang-fallback'));
		var suffix = $el.attr('data-lang-suffix');

		if (suffix !== undefined) value += suffix;
		if ($el.is('[data-lang-raw]')) $el.html(faReplace(value));
		else $el.text(value);
	});
	$("[data-lang-special='explInjeong']").html(rebuildInjeongExplHTML(dict));

	document.querySelectorAll('[data-lang-attr-placeholder], [data-lang-attr-label], [data-lang-attr-data-tooltip]').forEach(function (el) {
		for (var i = 0; i < el.attributes.length; i++) {
			var attr = el.attributes[i];

			if (attr.name.indexOf('data-lang-attr-') === 0) {
				el.setAttribute(attr.name.slice('data-lang-attr-'.length), resolve(attr.value));
			}
		}
	});

	var $roomTitle = $('#room-title');
	if ($roomTitle.length) {
		$roomTitle.attr('placeholder', ($roomTitle.attr('data-nick') || resolve('guest')) + resolve('roomDefault'));
	}
}

function applyOptions(opt) {
	$data.opts = opt;

	// localStorage에서 볼륨 설정 불러오기 (우선순위: localStorage > cookie)
	var savedSettings = loadVolumeSettings();

	// 음소거 상태 적용 (localStorage에 값이 있으면 localStorage, 없으면 cookie)
	$data.muteBGM = savedSettings.bgmMute !== null ? savedSettings.bgmMute : ($data.opts.mb || false);
	$data.muteEff = savedSettings.effectMute !== null ? savedSettings.effectMute : ($data.opts.me || false);

	// 볼륨 값 적용 (localStorage에 값이 있으면 localStorage, 없으면 cookie)
	if (savedSettings.bgmVolume !== null) {
		$data.BGMVolume = savedSettings.bgmVolume;
	} else {
		$data.BGMVolume = parseFloat($data.opts.bv);
		if (isNaN($data.BGMVolume)) $data.BGMVolume = 1;
	}

	if (savedSettings.effectVolume !== null) {
		$data.EffectVolume = savedSettings.effectVolume;
	} else {
		$data.EffectVolume = parseFloat($data.opts.ev);
		if (isNaN($data.EffectVolume)) $data.EffectVolume = 1;
	}

	// UI 요소에 값 설정
	$("#mute-bgm").prop('checked', $data.muteBGM);
	$("#mute-effect").prop('checked', $data.muteEff);
	$(".bgmVolume").prop('disabled', $data.muteBGM);
	$(".effectVolume").prop('disabled', $data.muteEff);
	$("#deny-invite").attr('checked', $data.opts.di);
	$("#deny-whisper").attr('checked', $data.opts.dw);
	$("#deny-friend").attr('checked', $data.opts.df);
	$("#auto-ready").attr('checked', $data.opts.ar);
	$("#sort-user").attr('checked', $data.opts.su);
	$("#only-waiting").attr('checked', $data.opts.ow);
	$("#only-unlock").attr('checked', $data.opts.ou);
	$("#show-rule-category").attr('checked', $data.opts.src === true);
	$("#simple-room-view").prop('checked', ($data.opts.srv !== undefined) ? $data.opts.srv : true);
	$("#no-filter").prop('checked', ($data.opts.nf !== undefined) ? $data.opts.nf : true);
	$("#no-shake").prop('checked', ($data.opts.ns === true));

	// 사운드팩 설정 (localStorage에 값이 있으면 localStorage, 없으면 cookie)
	var soundPack = savedSettings.soundPack !== null ? savedSettings.soundPack : ($data.opts.sp || "");
	$("#sound-pack").val(soundPack);

	// 슬라이더 값 설정
	$(".bgmVolume").val($data.BGMVolume * 100);
	$(".effectVolume").val($data.EffectVolume * 100);

	// 볼륨 적용
	updateBGMVol();
	updateEffectVol();

	// 테마 적용
	applyTheme(savedSettings.theme || 'blue');
	applyDarkMode(savedSettings.darkMode || 'light');
	ACTIVE_BEAT = resolveActiveBeat(savedSettings.beatMode || 'auto', savedSettings.soundPack || ($data.opts && $data.opts.sp) || '');
}

function resolveActiveBeat(beatMode, packName) {
	if (beatMode === 'km') return BEAT_KM;
	if (beatMode === 'mid') return BEAT_Mid;
	if (beatMode === 'default') return BEAT;
	// auto: 팩 이름 기반 자동 선택
	if (packName === '키뮤') return BEAT_KM;
	if (packName === '오리지널' || packName === '테크노' || packName === '병맛') return BEAT_Mid;
	return BEAT;
}

function loadVolumeSettings() {
	try {
		return JSON.parse(localStorage.getItem('kkutu_volume')) || { bgmMute: null, effectMute: null, bgmVolume: null, effectVolume: null, soundPack: null, lobbyBGM: null, noEasterEgg: null, aiAutoApply: null, levelPack: null, aiMuteGame: null, aiMuteLobby: null, aiRageQuit: null, aiFastMode: null, theme: null, darkMode: null, beatMode: null };
	} catch (e) {
		return { bgmMute: null, effectMute: null, bgmVolume: null, effectVolume: null, soundPack: null, lobbyBGM: null, noEasterEgg: null, aiAutoApply: null, levelPack: null, aiMute: null, aiRageQuit: null, aiFastMode: null, theme: null, darkMode: null };
	}
}

function saveVolumeSettings(data) {
	var current = loadVolumeSettings();
	for (var key in data) current[key] = data[key];
	localStorage.setItem('kkutu_volume', JSON.stringify(current));
}


function updateBGMVol() {
	// 실제 볼륨 업데이트 (각각의 음소거 상태 확인)
	var bgmVol = $data.muteBGM ? 0 : $data.BGMVolume;
	var effVol = $data.muteEff ? 0 : $data.EffectVolume;
	updateVolume(bgmVol, effVol);

	// UI 동기화 (슬라이더 값은 음소거 여부와 관계없이 유지)
	if ($("#mute-bgm").prop("checked") !== $data.muteBGM) {
		$("#mute-bgm").prop("checked", $data.muteBGM);
	}
	$(".bgmVolume").prop('disabled', $data.muteBGM);
	// 슬라이더는 항상 실제 볼륨 값을 표시 (음소거 상태와 무관)
	var currentSliderValue = $(".bgmVolume").val();
	var expectedSliderValue = Math.round($data.BGMVolume * 100);
	if (currentSliderValue != expectedSliderValue) {
		$(".bgmVolume").val(expectedSliderValue);
	}
}


function updateEffectVol() {
	// 실제 볼륨 업데이트 (각각의 음소거 상태 확인)
	var bgmVol = $data.muteBGM ? 0 : $data.BGMVolume;
	var effVol = $data.muteEff ? 0 : $data.EffectVolume;
	updateVolume(bgmVol, effVol);

	// UI 동기화 (슬라이더 값은 음소거 여부와 관계없이 유지)
	if ($("#mute-effect").prop("checked") !== $data.muteEff) {
		$("#mute-effect").prop("checked", $data.muteEff);
	}
	$(".effectVolume").prop('disabled', $data.muteEff);
	// 슬라이더는 항상 실제 볼륨 값을 표시 (음소거 상태와 무관)
	var currentSliderValue = $(".effectVolume").val();
	var expectedSliderValue = Math.round($data.EffectVolume * 100);
	if (currentSliderValue != expectedSliderValue) {
		$(".effectVolume").val(expectedSliderValue);
	}
}


function updateVolume(bgmVol, effectVol) { // bgmVol, effectVol
	var vol;
	if (!isFinite(bgmVol)) bgmVol = 1;
	if (bgmVol < 0) bgmVol = 0; else if (bgmVol > 1) bgmVol = 1;
	if (!isFinite(effectVol)) effectVol = 1;
	if (effectVol < 0) effectVol = 0; else if (effectVol > 1) effectVol = 1;

	for (var i in $_sound) {
		if ($_sound[i].__BGM) vol = bgmVol;
		else vol = effectVol;

		if ($_sound[i].gainNode) $_sound[i].gainNode.gain.value = vol;
		else if ($_sound[i].audio) $_sound[i].audio.volume = vol;
	}
}
function checkInput($input) {
	$input = $input || $stage.talk;
	var v = $input.val();

	if ($data.room && $data.room.gaming) {
		if (v.length - $data._kd.length >= 3) {
			$input.val("");
			$data._kd = "";
			return true;
		}
	}
	$data._kd = v;
	return false;
}
function addInterval(cb, v, a1, a2, a3, a4, a5) {
	var R = _setInterval(cb, v, a1, a2, a3, a4, a5);

	$data._timers.push(R);
	return R;
}
function addTimeout(cb, v, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
	var R = _setTimeout(cb, v, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);

	$data._timers.push(R);
	return R;
}
function clearTrespasses() {
	return; // 일단 비활성화
	var jt = [];
	var xStart = $data._xintv || 0;
	var xEnd = _setTimeout(checkInput, 1);
	var rem = 0;
	var i;

	for (i in $.timers) {
		jt.push($.timers[i].id);
	}
	function censor(id) {
		if (jt.indexOf(id) == -1 && $data._timers.indexOf(id) == -1) {
			rem++;
			clearInterval(id);
		}
	}
	for (i = 0; i < 53; i++) {
		censor(i);
	}
	for (i = xStart; i < xEnd; i++) {
		censor(i);
	}
	$data._xintv = xEnd;
}
function route(func, a0, a1, a2, a3, a4) {
	if (!$data.room) return;
	var r = RULE[MODE[$data.room.mode]];

	if (!r) return null;
	$lib[r.rule][func].call(this, a0, a1, a2, a3, a4);
}
function connectToRoom(chan, rid) {
	var url = $data.URL.replace(/:(\d+)/, function (v, p1) {
		return ":" + ($data.ROOM_PORT ? Number($data.ROOM_PORT) + Number(chan) - 1 : Number(p1) + Number(chan));
	}) + "&" + chan + "&" + rid;

	if (rws) return;
	rws = new _WebSocket(url + "&locale=" + (localStorage.getItem('kkutu_lang') || 'ko_KR'));

	loading(L['connectToRoom'] + "\n<center><button id='ctr-close'>" + L['ctrCancel'] + "</button></center>");
	$("#ctr-close").on('click', function () {
		loading();
		if (rws) rws.close();
	});
	rws.onopen = function (e) {
	};
	rws.onmessage = _onMessage;
	rws.onclose = function (e) {
		rws = undefined;
		clearInterval($data._tTime);
		clearBoard();
		if ($data.place != 0) {
			$data.place = 0;
			$data.room = null;
			updateUI();
			playBGM('lobby');
		}
	};
	rws.onerror = function (e) {
	};
}
function checkAge() {
	showConfirm(L['checkAgeAsk'], function (res) {
		if (!res) return send('caj', { answer: "no" }, true);
		askStep(1, []);
	});

	function askStep(lv, input) {
		if (lv > 3) {
			var msg = L['checkAgeSure'] + "\n"
				+ input[0] + L['YEAR'] + " "
				+ input[1] + L['MONTH'] + " "
				+ input[2] + L['DATE'];

			showConfirm(msg, function (res) {
				if (res) {
					send('caj', { answer: "yes", input: [input[1], input[2], input[0]] }, true);
				} else {
					showConfirm(L['checkAgeCancel'], function (res2) {
						if (res2) send('caj', { answer: "no" }, true);
						else askStep(1, []);
					});
				}
			});
			return;
		}

		showPrompt(L['checkAgeInput' + lv], "", function (str) {
			if (!str || isNaN(str = Number(str))) {
				if (lv > 1) askStep(lv - 1, input); // Go back one step
				else askStep(1, []); // Restart
				return;
			}

			if (lv == 1 && (str < 1000 || str > 2999)) {
				showAlert(str + ("\n" + L['checkAgeNo']), function () { askStep(lv, input); });
				return;
			}
			if (lv == 2 && (str < 1 || str > 12)) {
				showAlert(str + ("\n" + L['checkAgeNo']), function () { askStep(lv, input); });
				return;
			}
			if (lv == 3 && (str < 1 || str > 31)) {
				showAlert(str + ("\n" + L['checkAgeNo']), function () { askStep(lv, input); });
				return;
			}

			input[lv - 1] = str;
			askStep(lv + 1, input);
		});
	}
}
function onMessage(data) {
	var i;
	var $target;

	switch (data.type) {
		case 'updateUser':
			if ($data.users[data.id]) {
				$data.users[data.id].profile = data.profile;
				if (data.id === $data.id) {
					$data.nickname = data.profile.nickname;
					$data.exordial = data.profile.exordial;
					var _updName = getDisplayName($data.users[$data.id]);
					if (_updName) {
						$("#room-title").attr('placeholder', _updName + L['roomDefault']);
						$("#account-info").text(_updName);
					}
					updateMe();
				}
				// 로비 유저 목록/초대 목록에 이미 그려진 행이 있다면 새 프로필로 교체
				var $userRow = $("#users-item-" + data.id);
				if ($userRow.length) $userRow.replaceWith(userListBar($data.users[data.id]));
				var $inviteRow = $("#invite-item-" + data.id);
				if ($inviteRow.length) $inviteRow.replaceWith(userListBar($data.users[data.id], true));
				updateUserList();
				if ($data.room) updateRoom($data.room.gaming);
				// 해당 유저의 프로필 창이 열려 있으면 즉시 새로고침
				if ($data._profiled === data.id && $stage.dialog.profile.is(':visible')) {
					requestProfile(data.id);
				}
			}
			break;
		case 'recaptcha':
			var $introText = $("#intro-text");
			$introText.empty();
			$introText.html('게스트는 캡챠 인증이 필요합니다.' +
				'<br/>로그인을 하시면 캡챠 인증을 건너뛰실 수 있습니다.' +
				'<br/><br/>');
			$introText.append($('<div class="g-recaptcha" id="recaptcha" style="display: table; margin: 0 auto;"></div>'));

			grecaptcha.render('recaptcha', {
				'sitekey': data.siteKey,
				'callback': recaptchaCallback
			});
			break;
		case 'welcome':
			$data.id = data.id;
			$data.guest = data.guest;
			$data.admin = data.admin;
			$data.users = data.users;
			$data.robots = {};
			$data.rooms = data.rooms;
			$data.place = 0;
			$data.room = null;
			// 재접속 시 이전 방 소켓이 close 이벤트 없이 남아있는 경우를 대비해 정리
			if (rws) {
				rws.onclose = null;
				rws.close();
				rws = undefined;
			}
			$data.friends = data.friends;
			$data._friends = {};
			$data._playTime = data.playTime;
			$data._okg = data.okg;
			$data._gaming = false;
			$data.box = data.box;
			$stage.nickBlockOverlay.hide();
			if ($data.users[$data.id]) {
				var _me = $data.users[$data.id];
				var _myName = getDisplayName(_me);
				if (_myName) {
					$("#room-title").attr('placeholder', _myName + L['roomDefault']);
				}
				if (!$data.guest && (!(_me.profile && _me.profile.nickname) || data.nicknameInvalid)) {
					showDialog($stage.dialog.nickSetup, true);
					$stage.nickBlockOverlay.show();
				}
			}
			if (data.test) showAlert(L['welcomeTestServer']);
			if (location.hash[1]) tryJoin(location.hash.slice(1));
			updateUI(undefined, true);
			welcome();
			if (data.caj) checkAge();
			updateCommunity();
			runCommand(['/randomtip', '2']);
			break;
		case 'roomSync':
			$data.rooms = data.rooms;
			updateRoomList(true);
			break;
		case 'conn':
			$data.setUser(data.user.id, data.user);
			updateUserList();
			break;
		case 'disconn':
			$data.setUser(data.id, null);
			updateUserList();
			break;
		case 'connRoom':
			if ($data._preQuick) {
				playSound('success');
				$stage.dialog.quick.hide();
				delete $data._preQuick;
			}
			$stage.dialog.quick.hide();
			$data.setUser(data.user.id, data.user);
			$target = $data.usersR[data.user.id] = data.user;

			if ($target.id == $data.id) loading();
			else notice(($target.profile.title || $target.profile.name) + L['hasJoined']);
			updateUserList();
			break;
		case 'disconnRoom':
			$target = $data.usersR[data.id] || $data.users[data.id];

			if ($target) {
				delete $data.usersR[data.id];
				notice(($target.profile.title || $target.profile.name) + L['hasLeft']);
				updateUserList();
			} else if (data.robot && data.profile) {
				// 봇 퇴장 알림
				notice((data.profile.title || data.profile.name) + L['hasLeft']);
				delete $data.robots[data.id];
			}
			break;
		case 'yell':
			yell(data.value);
			notice(data.value, L['yell']);
			break;
		case 'dying':
			yell(L['dying']);
			notice(L['dying'], L['yell']);
			break;
		case 'tail':
			notice(data.a + "|" + data.rid + "@" + data.id + ": " + ((data.msg instanceof String) ? data.msg : JSON.stringify(data.msg)).replace(/</g, "&lt;").replace(/>/g, "&gt;"), "tail");
			break;
		case 'chat':
			if (data.notice) {
				notice(data.value || L[data.code] || L['error_' + data.code], data.head);
			} else {
				chat(data.profile || { title: L['robot'] }, data.value, data.from, data.timestamp);
			}
			break;
		case 'system':
			if (data.code === 'roomDestroyed' || data.code === 'room_destroy_warning') {
				showAlert(data.value || L[data.code]);
			} else {
				notice(data.value || L[data.code] || L['error_' + data.code]);
			}
			break;
		case 'roomStuck':
			if (rws) rws.close();
			break;
		case 'preRoom':
			connectToRoom(data.channel, data.id);
			break;
		case 'room':
			processRoom(data);
			checkRoom(data.modify && data.myRoom);
			updateUI(data.myRoom);
			if (data.modify && $data.room && data.myRoom) {
				if ($data._rTitle != $data.room.title) animModified('.room-head-title');
				if ($data._rMode != getOptions($data.room.mode, $data.room.opts, true)) animModified('.room-head-mode');
				if ($data._rLimit != $data.room.limit) animModified('.room-head-limit');
				if ($data._rRound != $data.room.round) animModified('.room-head-round');
				if ($data._rTime != $data.room.time) animModified('.room-head-time');
			}
			break;
		case 'user':
			$data.setUser(data.id, data);
			if ($data.room) updateUI($data.room.id == data.place);
			break;
		case 'friends':
			$data._friends = {};
			for (i in data.list) {
				data.list[i].forEach(function (v) {
					$data._friends[v] = { server: i };
				});
			}
			updateCommunity();
			break;
		case 'friend':
			$data._friends[data.id] = { server: (data.stat == "on") ? data.s : false };
			if ($data._friends[data.id] && $data.friends[data.id])
				notice(((data.stat == "on") ? ("[" + L['server_' + $data._friends[data.id].server] + "] ") : "")
					+ L['friend'] + " " + $data.friends[data.id] + L['fstat_' + data.stat]);
			updateCommunity();
			break;
		case 'friendAdd':
			$target = $data.users[data.from].profile;
			i = ($target.title || $target.name) + "(#" + String(data.from).substr(0, 5) + ")";
			if ($data.opts.df) {
				send('friendAddRes', { from: data.from, res: false }, true);
			} else {
				showConfirm(i + L['attemptFriendAdd'], function (res) {
					send('friendAddRes', { from: data.from, res: res }, true);
				});
			}
			break;
		case 'friendAddRes':
			$target = $data.users[data.target].profile;
			i = ($target.title || $target.name) + "(#" + String(data.target).substr(0, 5) + ")";
			notice(i + L['friendAddRes_' + (data.res ? 'ok' : 'no')]);
			if (data.res) {
				$data.friends[data.target] = $target.title || $target.name;
				$data._friends[data.target] = { server: $data.server };
				updateCommunity();
			}
			break;
		case 'friendEdit':
			$data.friends = data.friends;
			updateCommunity();
			break;
		case 'starting':
			loading(L['gameLoading']);
			break;
		case 'roundReady':
			$('.game-user-ko').removeClass('game-user-ko');
			$('.survival-ko').removeClass('survival-ko');
			$('.survival-ko-score').removeClass('survival-ko-score');
			initItemUI();
			route("roundReady", data);
			break;
		case 'turnStart':
			route("turnStart", data);
			break;
		case 'turnError':
			turnError(data.code, data.value);
			break;
		case 'turnHint':
			route("turnHint", data);
			break;
		case 'turnEnd':
			data.score = Number(data.score);
			data.bonus = Number(data.bonus);
			if ($data.room) {
				$data._tid = data.target || $data.room.game.seq[$data.room.game.turn];
				if ($data._tid) {
					if ($data._tid.robot) $data._tid = $data._tid.id;
					turnEnd($data._tid, data);
				}
				if (data.baby) {
					playSound('success');
				}
			}
			break;
		case 'survivalKO':
			// 서바이벌 모드: 중도 퇴장으로 인한 KO 처리
			var koTarget = data.target;
			if (data.reason === 'leave') {
				// 떠난 플레이어는 카드를 즉시 제거하고, 이후 updateRoom 재렌더에서도 스킵
				if (!$data._survivalLeftPlayers) $data._survivalLeftPlayers = {};
				$data._survivalLeftPlayers[koTarget] = true;
				$('#game-user-' + koTarget).remove();
			} else {
				applySurvivalKODisplay(koTarget);
			}

			var koUser = $data.users[koTarget] || $data.robots[koTarget];
			if (koUser && koUser.game) {
				koUser.game.alive = false;
				koUser.game.score = 0;
			}
			playSound('KO');
			playSound('timeout');
			break;
		case 'raingameWord':
			if ($lib.Raingame && $lib.Raingame.onWord) $lib.Raingame.onWord(data);
			break;
		case 'wordstackAtk':
			if ($lib.Wordstack && $lib.Wordstack.onAtk) $lib.Wordstack.onAtk(data);
			break;
		case 'shukMove':
			if ($lib.Shuk && $lib.Shuk.shukMove) $lib.Shuk.shukMove(data);
			break;
		case 'roundEnd':
			for (i in data.users) {
				if (data.users[i] && data.users[i].robot) {
					$data.robots[i] = data.users[i];
					continue;
				}
				$data.setUser(i, data.users[i]);
			}
			/*if($data.guest){
				$stage.menu.exit.trigger('click');
				alert(L['guestExit']);
			}*/
			// 서바이벌 모드: roundEnd 후 KO 상태 복원
			if ($data.room && $data.room.opts && $data.room.opts.survival) {
				for (i in data.users) {
					if (data.users[i] && data.users[i].game && data.users[i].game.alive === false) {
						applySurvivalKODisplay(i);
					}
				}
				for (i in $data.robots) {
					if ($data.robots[i] && $data.robots[i].game && $data.robots[i].game.alive === false) {
						applySurvivalKODisplay(i);
					}
				}
			}
			// 라운드 종료 시 아이템 큐 방지
			$('.ItemButton').addClass('item-disabled').css({'filter': 'grayscale(100%)', 'opacity': '0.5', 'cursor': 'not-allowed'}).removeClass('item-available item-queued');
			$data.pendingItem = null;
			$data._resultRank = data.ranks;
			// 코옵 마지막 문제의 pushDisplay 애니메이션이 아직 끝나지 않았으면, 그게 끝날 때까지
			// "성공!" 결과 화면 표시를 미룬다(완료 콜백이 오면 그때 roundEnd를 실행함).
			if ($data._coopFinalAnimPending) {
				$data._pendingCoopRoundEnd = { result: data.result, data: data.data };
			} else {
				roundEnd(data.result, data.data);
			}
			break;
		case 'draw':
			// Picture Quiz drawing sync
			if ($lib.Picture && $lib.Picture.handleDraw) {
				$lib.Picture.handleDraw(data);
			}
			break;
		case 'clear':
			if ($lib.Picture && $lib.Picture.handleClear) {
				$lib.Picture.handleClear(data);
			}
			break;
		case 'fill':
			if ($lib.Picture && $lib.Picture.handleFill) {
				$lib.Picture.handleFill(data);
			}
			break;
		case 'kickVote':
			$data._kickTarget = $data.users[data.target];
			if ($data.id != data.target && $data.id != $data.room.master) {
				kickVoting(data.target);
			}
			notice(($data._kickTarget.profile.title || $data._kickTarget.profile.name) + L['kickVoting']);
			break;
		case 'afkWarn':
			afkWarning(data.duration || 30);
			break;
		case 'kickDeny':
			notice(getKickText($data._kickTarget.profile, data));
			break;
		case 'invited':
			if ($data.opts.di) {
				send('inviteRes', { from: data.from, res: false });
			} else {
				showConfirm(data.from + L['invited'], function (res) {
					send('inviteRes', { from: data.from, res: res });
				});
			}
			break;
		case 'inviteNo':
			$target = $data.users[data.target];
			notice(($target.profile.title || $target.profile.name) + L['inviteDenied']);
			break;
		case 'okg':
			if ($data._playTime > data.time) {
				notice(L['okgExpired']);
			} else if ($data._okg != data.count) notice(L['okgNotice'] + " (" + L['okgCurrent'] + data.count + ")");
			$data._playTime = data.time;
			$data._okg = data.count;
			break;
		case 'obtain':
			queueObtain(data);
			// notice(L['obtained'] + ": " + iName(data.key) + " x" + data.q);
			break;
		case 'expired':
			for (i in data.list) {
				notice(iName(data.list[i]) + L['hasExpired']);
			}
			break;
		case 'blocked':
			notice(L['blocked']);
			break;
		case 'test':
			if ($data._test = !$data._test) {
				$data._testt = addInterval(function () {
					if ($stage.talk.val() != $data._ttv) {
						send('test', { ev: "c", v: $stage.talk.val() }, true);
						$data._ttv = $stage.talk.val();
					}
				}, 100);
				document.onkeydown = function (e) {
					send('test', { ev: "d", c: e.keyCode }, true);
				};
				document.onkeyup = function (e) {
					send('test', { ev: "u", c: e.keyCode }, true);
				};
			} else {
				clearInterval($data._testt);
				document.onkeydown = undefined;
				document.onkeyup = undefined;
			}
			break;
		case 'error':
			i = data.message || "";
			if (data.code == 401) {
				/* 로그인
				$.cookie('preprev', location.href);
				location.href = "/login?desc=login_kkutu"; */
			} else if (data.code == 403) {
				loading();
			} else if (data.code == 406) {
				if ($stage.dialog.quick.is(':visible')) {
					$data._preQuick = false;
					break;
				}
			} else if (data.code == 409) {
				i = L['server_' + i];
			} else if (data.code == 416) {
				// 게임 중
				showConfirm(L['error_' + data.code], function (res) {
					if (res) {
						stopBGM();
						$data._spectate = true;
						$data._gaming = true;
						send('enter', { id: data.target, password: $data._pw, spectate: true }, true);
					}
				});
				return;
			} else if (data.code == 413) {
				$stage.dialog.room.hide();
				$stage.menu.setRoom.trigger('click');
			} else if (data.code == 429) {
				playBGM('lobby');
			} else if (data.code == 430) {
				$data.setRoom(data.message, null);
				if ($stage.dialog.quick.is(':visible')) {
					$data._preQuick = false;
					break;
				}
			} else if (data.code == 431 || data.code == 432 || data.code == 433) {
				$stage.dialog.room.show();
			} else if (data.code == 444) {
				i = data.message;
				if (i.indexOf("생년월일") != -1) {
					showAlert(L['birthdate_invalid_game_block']);
					break;
				}
				/* Enhanced User Block System [S] */
				$data._bannedClose = true;
				var block444 = data.blockedUntil ? (function() {
					var d = new Date(parseInt(data.blockedUntil));
					return "\n제한 기한: " + d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " +
						d.getDate() + "일 " + d.getHours() + "시 " + d.getMinutes() + "분까지";
				})() : "\n제한 기한: 영구 제한";
				showAlert("[#444] " + L['error_444'] + i + block444);
				break;
			} else if (data.code == 446) {
				i = data.reasonBlocked;
				$data._bannedClose = true;
				var block446 = data.ipBlockedUntil ? (function() {
					var d = new Date(parseInt(data.ipBlockedUntil));
					return "\n제한 기한: " + d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " +
						d.getDate() + "일 " + d.getHours() + "시 " + d.getMinutes() + "분까지";
				})() : "\n제한 기한: 영구 제한";
				showAlert("[#446] " + L['error_446'] + i + block446);
				break;
				/* Enhanced User Block System [E] */
			} else if (data.code == 410) {
				if (i) {
					$data._bannedClose = true;
					var msg410 = "[#410] " + L['error_410'] + "\n차단 사유: " + i;
					if (data.blockedUntil) {
						var bu410 = new Date(parseInt(data.blockedUntil));
						msg410 += "\n제한 기한: " + bu410.getFullYear() + "년 " + (bu410.getMonth() + 1) + "월 " +
							bu410.getDate() + "일 " + bu410.getHours() + "시 " + bu410.getMinutes() + "분까지";
					} else {
						msg410 += "\n제한 기한: 영구 제한";
					}
					showAlert(msg410);
					break;
				}
			} else if (data.code === 447) {
				showAlert(L['security_bot_check_fail']);
				break;
			} else if (data.code == 470 || data.code == 471) {
				$data.place = 0;
				$data.room = null;
				updateUI();
				playBGM('lobby');
			}
			showAlert("[#" + data.code + "] " + L['error_' + data.code] + i);
			break;
		case 'item-given':
			$data.myItems[data.itemType] = data.count;
			updateItemUI();
			break;
		case 'item-queued':
			showPlayerPendingItem(data.playerId, data.itemType);
			break;
		case 'item-dequeued':
			hidePlayerPendingItem(data.playerId);
			break;
		case 'item-used':
			hidePlayerPendingItem(data.playerId);
			if (data.playerId === $data.id) {
				$data.myItems[data.itemType] = Math.max(0, ($data.myItems[data.itemType] || 1) - 1);
				$data.pendingItem = null;
				updateItemUI();
			}
			break;
		case 'chaos-notice':
			if (data.code === 'chaosShuffle' && data.seq && $data.room && $data.room.game) {
				$data.room.game.seq = data.seq;
				var $gameBody = $(".GameBox .game-body");
				for (var _csi = 0; _csi < data.seq.length; _csi++) {
					var $csel = $("#game-user-" + data.seq[_csi]);
					if ($csel.length) $gameBody.append($csel);
				}
				if (data.teams) {
					for (var _tid in data.teams) {
						var _nt = data.teams[_tid];
						$("#game-user-" + _tid + " .game-user-score")
							.removeClass("team-1 team-2 team-3 team-4")
							.toggleClass("team-" + _nt, _nt > 0);
					}
				}
			}
			notice(L[data.code + 'Body'], L[data.code]);
			break;
		default:
			break;
	}
	if ($data._record) recordEvent(data);

	function recaptchaCallback(response) {
		ws.send(JSON.stringify({ type: 'recaptcha', token: response }));
	}
}
function welcome() {
	playBGM('lobby');
	$("#Intro").animate({ 'opacity': 1 }, 1000).animate({ 'opacity': 0 }, 1000);
	$("#intro-text").text(L['welcome']);
	addTimeout(function () {
		$("#Intro").hide();
	}, 2000);

}

/* Item Mode */
var ITEM_SLOTS = {
	skip: { slot: 1, nameKey: 'itemSkip', icon: 'fa-forward' },
	reverse: { slot: 2, nameKey: 'itemReverse', icon: 'fa-exchange' },
	pass: { slot: 3, nameKey: 'itemPass', icon: 'fa-hand-stop-o' },
	random: { slot: 4, nameKey: 'itemRandom', icon: 'fa-random' },
	linkChange: { slot: 5, nameKey: null, icon: null }
};
function getItemTypeBySlot(slot) {
	for (var type in ITEM_SLOTS) {
		if (ITEM_SLOTS[type].slot === slot) return type;
	}
	return null;
}
function getItemName(itemType) {
	if (itemType === 'linkChange') {
		return $data.linkChangeItemName || L['itemLinkChange'];
	}
	var info = ITEM_SLOTS[itemType];
	return info && info.nameKey ? L[info.nameKey] : '';
}
function getPlayerCard(playerId) {
	return $('#game-user-' + playerId);
}
function initItemUI() {
	$data.myItems = {};
	$data.pendingItem = null;
	$('.ItemButton').removeClass('item-queued');
	$('.ItemOverlay, .MobileItemOverlay').removeClass('visible hiding');
	if (!$data.room || !$data.room.opts || !$data.room.opts.item) {
		$('.ItemBar').hide();
		return;
	}
	var r = RULE[MODE[$data.room.mode]];
	// linkChange 아이콘/이름 설정 (classic 전용)
	if (r && r.rule === 'Classic') {
		var opts = $data.room.opts;
		if (opts.middle || opts.random) {
			$data.linkChangeItemName = L['itemLinkEnd'];
			ITEM_SLOTS.linkChange.nameKey = 'itemLinkEnd';
			ITEM_SLOTS.linkChange.icon = 'fa-long-arrow-right';
		} else {
			$data.linkChangeItemName = L['itemLinkMiddle'];
			ITEM_SLOTS.linkChange.nameKey = 'itemLinkMiddle';
			ITEM_SLOTS.linkChange.icon = 'fa-compress';
		}
	}
	$('.ItemButton').each(function () {
		var slot = $(this).data('slot');
		var itemType = getItemTypeBySlot(slot);
		if (!itemType) { $(this).hide(); return; }
		var info = ITEM_SLOTS[itemType];
		// classic 아닌 모드에서 linkChange 숨김
		if (itemType === 'linkChange' && (!r || r.rule !== 'Classic')) {
			$(this).hide();
			return;
		}
		$(this).show();
		$(this).find('.ItemIcon').attr('class', 'fa ItemIcon ' + info.icon);
		$(this).find('.ItemName').text(info.nameKey ? L[info.nameKey] : '');
		$(this).find('.ItemCount').text('0');

		var descKey = (itemType === 'linkChange') ? (ITEM_SLOTS.linkChange.nameKey + 'Desc') : (info.nameKey + 'Desc');
		$(this).attr('data-tooltip', L[descKey] || '');

		$(this).removeAttr('disabled').addClass('item-disabled').css({'filter': 'grayscale(100%)', 'opacity': '0.5', 'cursor': 'not-allowed'}).removeClass('item-available item-queued');
		$data.myItems[itemType] = 0;
	});
	$('.ItemBar').show();
}
function updateItemUI() {
	if (!$data.room || !$data.room.opts || !$data.room.opts.item) return;
	$('.ItemButton').each(function () {
		var slot = $(this).data('slot');
		var itemType = getItemTypeBySlot(slot);
		if (!itemType) return;
		var count = $data.myItems[itemType] || 0;
		$(this).find('.ItemCount').text(count);
		$(this).removeClass('item-available item-queued item-disabled').css({'filter': '', 'opacity': '', 'cursor': ''});
		if ($data.pendingItem === itemType) {
			$(this).addClass('item-queued');
		} else if (count > 0) {
			$(this).addClass('item-available');
		} else {
			$(this).addClass('item-disabled').css({'filter': 'grayscale(100%)', 'opacity': '0.5', 'cursor': 'not-allowed'});
		}
	});
}

function useItemSlot(slot) {
	var $btn = $('.ItemButton[data-slot=' + slot + ']');
	if (!$btn.length || $btn.hasClass('item-disabled')) return;
	$btn.trigger('click');
}
function showPlayerPendingItem(playerId, itemType) {
	var $card = getPlayerCard(playerId);
	var $overlay = $card.find('.ItemOverlay, .MobileItemOverlay');
	if (!$overlay.length) {
		// 오버레이가 없으면 동적 생성
		var cls = mobile ? 'MobileItemOverlay' : 'ItemOverlay';
		$overlay = $('<div>').addClass(cls);
		$card.append($overlay);
	}
	$overlay.text(getItemName(itemType));
	$overlay.removeClass('hiding').show();
	requestAnimationFrame(function () { $overlay.addClass('visible'); });
}
function hidePlayerPendingItem(playerId) {
	var $card = getPlayerCard(playerId);
	var $overlay = $card.find('.ItemOverlay, .MobileItemOverlay');
	$overlay.addClass('hiding').removeClass('visible');
	setTimeout(function () { $overlay.removeClass('hiding'); }, 150);
}
function getKickText(profile, vote) {
	var vv = L['agree'] + " " + vote.Y + ", " + L['disagree'] + " " + vote.N + L['kickCon'];
	if (vote.Y >= vote.N) {
		vv += (profile.title || profile.name) + L['kicked'];
	} else {
		vv += (profile.title || profile.name) + L['kickDenied'];
	}
	return vv;
}
function runCommand(cmd) {
	var i, c, CMD = {
		'/ㄱ': L['cmd_r'],
		'/청소': L['cmd_cls'],
		'/ㄹ': L['cmd_f'],
		'/ㄷ': L['cmd_e'],
		'/ㄷㄷ': L['cmd_ee'],
		'/무시': L['cmd_wb'],
		'/차단': L['cmd_shut'],
		'/id': L['cmd_id'],
		'/친추': L['cmd_fa'],
		'/신고': L['cmd_report'],
		'/사전': L['cmd_dict'],
		'/팁': L['cmd_tip'],
		'/랜덤팁': L['cmd_randomtip']
	};

	switch (cmd[0].toLowerCase()) {
		case "/ㄱ":
		case "/r":
			if ($data.room) {
				if ($data.room.master == $data.id) $stage.menu.start.trigger('click');
				else $stage.menu.ready.trigger('click');
			}
			break;
		case "/청소":
		case "/cls":
			clearChat();
			break;
		case "/ㄹ":
		case "/f":
			showDialog($stage.dialog.chatLog);
			$stage.chatLog.scrollTop(999999999);
			break;
		case "/귓":
		case "/ㄷ":
		case "/e":
			sendWhisper(cmd[1], cmd.slice(2).join(' '));
			break;
		case "/답":
		case "/ㄷㄷ":
		case "/ee":
			if ($data._recentFrom) {
				sendWhisper($data._recentFrom, cmd.slice(1).join(' '));
			} else {
				notice(L['error_425']);
			}
			break;
		case "/무시":
		case "/wb":
			toggleWhisperBlock(cmd[1]);
			break;
		case "/차단":
		case "/shut":
			toggleShutBlock(cmd.slice(1).join(' '));
			break;
		case "/id":
			if (cmd[1]) {
				c = 0;
				cmd[1] = cmd.slice(1).join(' ');
				for (i in $data.users) {
					if (($data.users[i].profile.title || $data.users[i].profile.name) == cmd[1]) {
						notice("[" + (++c) + "] " + i);
					}
				}
				if (!c) notice(L['error_405']);
			} else {
				notice(L['myId'] + $data.id);
			}
			break;
		case "/친추":
		case "/ㅊㅊ":
		case "/cc":
			if (cmd[1]) {
				var targetName = cmd.slice(1).join(' ');
				var targetId = null;
				for (i in $data.users) {
					var u = $data.users[i];
					if (i == targetName || (u.profile.title || u.profile.name) == targetName) {
						targetId = i;
						break;
					}
				}
				if (targetId) {
					if (targetId == $data.id) {
						notice(L['error_449']);
					} else {
						send('friendAdd', { target: targetId }, true);
						notice(L['cmd_fa_sent'] + targetName);
					}
				} else {
					notice(L['error_405']);
				}
			} else {
				notice(L['cmd_fa']);
			}
			break;
		case "/신고":
		case "/ㅅㄱ":
		case "/report":
			if (cmd[1]) {
				var reportTargetName = cmd.slice(1).join(' ');
				var reportTargetId = null;
				for (i in $data.users) {
					var ru = $data.users[i];
					if (i == reportTargetName || (ru.profile.title || ru.profile.name) == reportTargetName) {
						reportTargetId = i;
						break;
					}
				}
				if (reportTargetId) {
					openReportDialog(reportTargetId);
				} else {
					notice(L['error_405']);
				}
			} else {
				notice(L['cmd_report']);
			}
			break;
		case "/사전":
		case "/ㅅㅈ":
		case "/dict":
			if (cmd[1]) {
				var word = cmd.slice(1).join(' ');
				tryDict(word, function (res) {
					if (res.error) {
						notice(L['cmd_dict_not_found']);
					} else {
						var themes = [];
						if (res.theme) {
							res.theme.split(',').forEach(function (t) {
								if (t && t !== '0') {
									var name = L['theme_' + t];
									if (name && themes.indexOf(name) === -1) themes.push(name);
								}
							});
						}
						var prefix = themes.length > 0 ? '주제: ' + themes.join(', ') + ' / 뜻: ' : '';
						var mean = (res.mean || "").replace(/＂[0-9]+＂/g, " ").replace(/［[0-9]+］/g, " ").replace(/（[0-9]+）/g, " ").trim();
						if ((prefix + mean).length > 200) mean = mean.substr(0, 200 - prefix.length) + "...";
						notice(prefix + mean, res.word);
					}
				});
			} else {
				notice(L['cmd_dict']);
			}
			break;
		case "/tip":
		case "/팁":
		case "/ㅌ":
		
			var _tips = L.tips || [];
			if (_tips.length) {
				var _tipN = Math.min(Math.max(parseInt(cmd[1]) || 1, 1), _tips.length);
				var _tipNum = String(_tipN).padStart(2, '0');
				var _tipTot = String(_tips.length).padStart(2, '0');
				notice("[" + _tipNum + "/" + _tipTot + "] " + _tips[_tipN - 1], "TIP");
			}
			break;
		case "/randomtip":
		case "/랜덤팁":
		case "/ㄹㄷㅌ":
			var _rtips = L.tips || [];
			if (_rtips.length) {
				var _rCount = Math.min(Math.max(parseInt(cmd[1]) || 1, 1), _rtips.length);
				var _rTot = String(_rtips.length).padStart(2, '0');
				var _rIdx = _rtips.map(function (_, i) { return i; });
				for (var _rk = _rIdx.length - 1; _rk > 0; _rk--) {
					var _rj = Math.floor(Math.random() * (_rk + 1));
					var _rt = _rIdx[_rk]; _rIdx[_rk] = _rIdx[_rj]; _rIdx[_rj] = _rt;
				}
				_rIdx.slice(0, _rCount).forEach(function (idx) {
					var _n = String(idx + 1).padStart(2, '0');
					notice("[" + _n + "/" + _rTot + "] " + _rtips[idx], "TIP");
				});
			}
			break;
		case "/1":
		case "/2":
		case "/3":
		case "/4":
		case "/5":
			if ($data.room && $data.room.gaming && $data.room.opts && $data.room.opts.item) {
				useItemSlot(parseInt(cmd[0].charAt(1)));
			}
			break;
		default:
			for (i in CMD) notice(CMD[i], i);
			break;
	}
}
function sendWhisper(target, text) {
	if (text.length) {
		$data._whisper = target;
		send('talk', { whisper: target, value: text }, true);
		chat({ title: "→" + target }, text, true);
	}
}
function toggleWhisperBlock(target) {
	if ($data._wblock.hasOwnProperty(target)) {
		delete $data._wblock[target];
		notice(L['wnblocked'].replace('{V1}', target));
	} else {
		$data._wblock[target] = true;
		notice(L['wblocked'].replace('{V1}', target));
	}
}
function toggleShutBlock(target) {
	if ($data._shut.hasOwnProperty(target)) {
		delete $data._shut[target];
		notice(L['userNShut'].replace('{V1}', target));
	} else {
		$data._shut[target] = true;
		notice(L['userShut'].replace('{V1}', target));
	}
}
function tryDict(text, callback) {
	var text = text.replace(/[^\sa-zA-Zㄱ-ㅎ0-9가-힣]/g, "");
	var lang = text.match(/[ㄱ-ㅎ가-힣]/) ? 'ko' : 'en';

	if (text.length < 1) return callback({ error: 404 });
	$.get("/dict/" + text + "?lang=" + lang, callback);
}
function processRoom(data) {
	var i, j, key, o;

	data.myRoom = ($data.place == data.room.id) || (data.target == $data.id);
	if (data.myRoom) {
		$target = $data.users[data.target];
		if (data.kickVote) {
			notice(getKickText($target.profile, data.kickVote));
			if ($target.id == data.id) showAlert(L['hasKicked']);
		}
		if (data.room.players.indexOf($data.id) == -1) {
			if ($data.room) {
				if ($data.room.gaming) {
					stopAllSounds();
					$data.practicing = false;
					$data._gaming = false;
					$stage.box.room.height(360);
					playBGM('lobby');
				}
				clearBoard();
			}
			$data.users[$data.id].game.ready = false;
			$data.users[$data.id].game.team = 0;
			$data.users[$data.id].game.form = "J";
			$stage.menu.spectate.removeClass("toggled");
			$stage.menu.ready.removeClass("toggled");
			$data.room = null;
			$data.robots = {};
			clearTimeout($data._jamsu);
			delete $data._jamsu;
			$data.resulting = false;
			$data._players = null;
			$data._master = null;
			$data.place = 0;
			if (data.room.practice) {
				delete $data.users[0];
				$data.room = $data._room;
				$data.place = $data._place;
				$data.master = $data.__master;
				$data._players = $data.__players;
				delete $data._room;
			}
		} else {
			if (data.room.practice && !$data.practicing) {
				$data.practicing = true;
				$data._room = $data.room;
				$data._place = $data.place;
				$data.__master = $data.master;
				$data.__players = $data._players;
			}
			if ($data.room) {
				$data._players = $data.room.players.toString();
				$data._master = $data.room.master;
				$data._rTitle = $data.room.title;
				$data._rMode = getOptions($data.room.mode, $data.room.opts, true);
				$data._rLimit = $data.room.limit;
				$data._rRound = $data.room.round;
				$data._injpick = $data.room.opts.injpick;

				// Set Linking Method Dropdown
				var linkVal = 'std';
				if ($data.room.opts.middle) linkVal = 'mid';
				else if ($data.room.opts.first) linkVal = 'fir';
				else if ($data.room.opts.random) linkVal = 'ran';
				$("#room-link-method").val(linkVal);
			}
			$data.room = data.room;
			$data.place = $data.room.id;
			$data.master = $data.room.master == $data.id;
			// 게임 중일 때 spec 데이터로 플레이어 점수 동기화 (서바이벌 HP 포함)
			// spec[id]는 구버전(숫자=점수) 또는 신버전({score, alive}) 모두 처리
			if (data.spec && data.room.gaming) {
				for (i in data.spec) {
					if (!$data.users[i] || !$data.users[i].game) continue;
					var _sv = data.spec[i];
					if (_sv !== null && typeof _sv === 'object') {
						$data.users[i].game.score = _sv.score;
						// 서바이벌: alive를 동기화해야 관전자/뒤늦은 진입자가 KO 상태를 볼 수 있고,
						// 다음 판에 stale alive=false가 남아 KO 라벨이 다시 그려지는 문제도 막힘
						$data.users[i].game.alive = (_sv.alive !== false);
					} else {
						$data.users[i].game.score = _sv;
					}
				}
			}
			if (data.spec && data.target == $data.id) {
				$stage.game.here.css('top', '');
				if (!$data._spectate) {
					$data._spectate = true;
					clearBoard();
					drawRound();
				}
				// 아이템전: 관전자 입장 시 기존 대기 상태 복원
				if (data.pendingItems) {
					for (var pid in data.pendingItems) {
						showPlayerPendingItem(pid, data.pendingItems[pid].itemType);
					}
				}
				if (data.boards) {
					// 십자말풀이 처리
					$data.selectedRound = 1;
					for (i in data.prisoners) {
						key = i.split(',');
						for (j in data.boards[key[0]]) {
							o = data.boards[key[0]][j];
							if (o[0] == key[1] && o[1] == key[2] && o[2] == key[3]) {
								o[4] = data.prisoners[i];
								break;
							}
						}
					}
					$lib.Crossword.roundReady(data, true);
					$lib.Crossword.turnStart(data, true);
				}
			}
		}
		if (!data.modify && data.target == $data.id) forkChat();
	}
	if (data.target) {
		if ($data.users[data.target]) {
			if (data.room.players.indexOf(data.target) == -1) {
				$data.users[data.target].place = 0;
			} else {
				$data.users[data.target].place = data.room.id;
			}
		}
	}
	if (!data.room.practice) {
		if (data.room.players.length) {
			$data.setRoom(data.room.id, data.room);
			for (i in data.room.readies) {
				if (!$data.users[i]) continue;
				$data.users[i].game.ready = data.room.readies[i].r;
				$data.users[i].game.form = data.room.readies[i].f;
				$data.users[i].game.team = data.room.readies[i].t;
			}
		} else {
			$data.setRoom(data.room.id, null);
		}
	}
	// 봇 데이터 실시간 동기화: room.players에서 봇 정보를 $data.robots에 반영
	if (data.myRoom && data.room.players) {
		for (i in data.room.players) {
			o = data.room.players[i];
			if (o && o.robot && o.id) {
				$data.robots[o.id] = o;
				// roundEnd에서 $data.users에 저장된 stale 봇 데이터 제거
				delete $data.users[o.id];
			}
		}
		// 프로필 다이얼로그가 봇을 표시 중이면 갱신
		if ($data._profiled && $data.robots[$data._profiled] && $stage.dialog.profile.is(':visible')) {
			requestProfile($data._profiled);
		}
	}
}
function getOnly() {
	return $data.place ? (($data.room && $data.room.gaming || $data.resulting) ? "for-gaming" : ($data.master ? "for-master" : "for-normal")) : "for-lobby";
}
function updateUI(myRoom, refresh) {
	/*
		myRoom이 undefined인 경우: 상점/결과 확인
		myRoom이 true/false인 경우: 그 외
	*/
	var only = getOnly();
	var i;

	if ($data._replay) {
		if (myRoom === undefined || myRoom) {
			replayStop();
		} else return;
	}
	if ($data._replay) return;
	if (only == "for-gaming" && !myRoom) return;
	if ($data.practicing) only = "for-gaming";

	$(".kkutu-menu button").not(".ItemButton").hide();
	$("#raingame-strategy").hide();
	for (i in $stage.box) $stage.box[i].hide();
	if (!mobile) $stage.box.me.show();
	$stage.box.chat.show().width(790).height(190);
	$stage.chat.height(120);

	if (only == "for-lobby") {
		$data._ar_first = true;
		$stage.box.userList.show();
		if ($data._shop) {
			$stage.box.roomList.hide();
			$stage.box.shop.show();
			if (mobile) $stage.box.me.hide();
			else $stage.box.me.show();
		} else {
			$stage.box.me.show();
			$stage.box.roomList.show();
			$stage.box.shop.hide();
		}
		updateUserList(refresh || only != $data._only);
		updateRoomList(refresh || only != $data._only);
		updateMe();
		if ($data._jamsu) {
			clearTimeout($data._jamsu);
			delete $data._jamsu;
		}
	} else if (only == "for-master" || only == "for-normal") {
		$(".team-chosen").removeClass("team-chosen");
		if ($data.users[$data.id].game.ready || $data.users[$data.id].game.form == "S") {
			$stage.menu.ready.addClass("toggled");
			$(".team-selector").addClass("team-unable");
		} else {
			$stage.menu.ready.removeClass("toggled");
			$(".team-selector").removeClass("team-unable");
			$("#team-" + $data.users[$data.id].game.team).addClass("team-chosen");
			if ($data.opts.ar && $data._ar_first) {
				$stage.menu.ready.addClass("toggled");
				$stage.menu.ready.trigger('click');
				$data._ar_first = false;
			}
		}
		$data._shop = false;
		$stage.box.room.show().height(360);
		if (only == "for-master") if ($stage.dialog.inviteList.is(':visible')) updateUserList();
		updateRoom(false);
		updateMe();
	} else if (only == "for-gaming") {
		if ($data._gAnim) {
			$stage.box.room.show();
			$data._gAnim = false;
		}
		$data._shop = false;
		$data._ar_first = true;
		$stage.box.me.hide();
		$stage.box.game.show();
		$(".ChatBox").width(1000).height(140);
		$stage.chat.height(70);
		updateRoom(true);
		initItemUI();
	}
	if (only !== 'for-gaming') {
		$('.ItemBar').hide();
	} else if (!$data.room || !$data.room.opts || !$data.room.opts.item) {
		$('.ItemBar').hide(); // Even if for-gaming, hide if no item mode
	}
	$data._only = only;
	setLocation($data.place);
	$(".kkutu-menu ." + only).not(".ItemBar").show();
	if (mobile) {
		if (only == "for-lobby") {
			$("body").css("overflow-y", "auto");
		} else {
			$("body").css("overflow-y", "hidden");
			window.scrollTo(0, 0);
		}
	}
}
function animModified(cls) {
	$(cls).addClass("room-head-modified");
	addTimeout(function () { $(cls).removeClass("room-head-modified"); }, 3000);
}
function checkRoom(modify) {
	if (!$data._players) return;
	if (!$data.room) return;

	var OBJ = {} + '';
	var i, arr = $data._players.split(',');
	var lb = arr.length, la = $data.room.players.length;
	var u;

	for (i in arr) {
		if (arr[i] == OBJ) lb--;
	}
	for (i in $data.room.players) {
		if ($data.room.players[i].robot) la--;
	}
	if (modify) {
		for (i in arr) {
			if (arr[i] != OBJ) $data.users[arr[i]].game.ready = false;
		}
		notice(L['hasModified']);
	}
	if ($data._gaming != $data.room.gaming) {
		if ($data.room.gaming) {
			gameReady();
			$data._replay = false;
			startRecord($data.room.game.title);
		} else {
			if ($data._spectate) {
				$stage.dialog.resultSave.hide();
				$data._spectate = false;
				playBGM('lobby');
			} else {
				$stage.dialog.resultSave.show();
				$data.resulting = true;
			}
			clearInterval($data._tTime);
		}
	}
	if ($data._master != $data.room.master) {
		u = $data.users[$data.room.master];
		notice((u.profile.title || u.profile.name) + L['hasMaster']);
	}
	$data._players = $data.room.players.toString();
	$data._master = $data.room.master;
	$data._gaming = $data.room.gaming;
}
function updateMe() {
	var my = $data.users[$data.id];
	var i, gw = 0;
	var lv = getLevel(my.data.score);
	var prev = EXP[lv - 2] || 0;
	var goal = EXP[lv - 1];

	for (i in my.data.record) gw += my.data.record[i][1];
	renderMoremi(".my-image", my.equip);
	// $(".my-image").css('background-image', "url('"+my.profile.image+"')");
	$(".my-stat-level").replaceWith(getLevelImage(my.data.score).addClass("my-stat-level"));
	$(".my-stat-name").text(my.profile.title || my.profile.name);
	$(".my-stat-record").html(L['globalWin'] + " " + gw + L['W']);
	$(".my-stat-ping").html(commify(my.money) + L['ping']);
	$(".my-okg .graph-bar").width(($data._playTime % 600000) / 6000 + "%");
	$(".my-okg-text").html(prettyTime($data._playTime));
	$(".my-level").html(L['LEVEL'] + " " + lv);
	$(".my-gauge .graph-bar").css('width', ((my.data.score - prev) / (goal - prev) * 100) + "%");
	$(".my-gauge-text").html(commify(my.data.score) + " / " + commify(goal));
}
function prettyTime(time) {
	var min = Math.floor(time / 60000) % 60, sec = Math.floor(time * 0.001) % 60;
	var hour = Math.floor(time / 3600000);
	var txt = [];

	if (hour) txt.push(hour + L['HOURS']);
	if (min) txt.push(min + L['MINUTE']);
	if (!hour) txt.push(sec + L['SECOND']);
	return txt.join(' ');
}
function updateUserList(refresh) {
	var $bar;
	var i, o, len = 0;
	var arr;

	// refresh = true;
	// if(!$stage.box.userList.is(':visible')) return;
	if ($data.opts.su) {
		arr = [];
		for (i in $data.users) {
			if (!$data.users[i].robot) len++;
			arr.push($data.users[i]);
		}
		arr.sort(function (a, b) { return b.data.score - a.data.score; });
		refresh = true;
	} else {
		arr = $data.users;

		for (i in $data.users) {
			if (!$data.users[i].robot) len++;
		}
	}
	$stage.lobby.userListTitle.html("<i class='fa fa-users'></i>"
		+ "&lt;<b>" + L['server_' + $data.server] + "</b>&gt; "
		+ L['UserList'].replace("FA{users}", "")
		+ " [" + len + L['MN'] + "]");

	if (refresh) {
		$stage.lobby.userList.empty();
		$stage.dialog.inviteList.empty();
		if ($stage.dialog.userListBoard && $stage.dialog.userListBoard.length) $stage.dialog.userListBoard.empty();
		for (i in arr) {
			o = arr[i];
			if (o.robot) continue;

			$stage.lobby.userList.append(userListBar(o));
			if ($stage.dialog.userListBoard && $stage.dialog.userListBoard.length) {
				var $ul = $("<div>").addClass("invite-item users-item")
					.append($("<div>").addClass("jt-image users-image").css('background-image', "url('" + o.profile.image + "')"))
					.append(getLevelImage(o.data.score).addClass("users-level"))
					.append($("<div>").addClass("users-name").text(getDisplayName(o)))
					.data('userId', o.id)
					.on('click', function () {
						requestProfile($(this).data('userId'));
					});
				addonNickname($ul, o);
				$stage.dialog.userListBoard.append($ul);
			}
			if (o.place == 0) $stage.dialog.inviteList.append(userListBar(o, true));
		}
	}
}
function userListBar(o, forInvite) {
	var $R;

	if (forInvite) {
		$R = $("<div>").attr('id', "invite-item-" + o.id).addClass("invite-item users-item")
			.append($("<div>").addClass("jt-image users-image").css('background-image', "url('" + o.profile.image + "')"))
			.append(getLevelImage(o.data.score).addClass("users-level"))
			// .append($("<div>").addClass("jt-image users-from").css('background-image', "url('/img/kkutu/"+o.profile.type+".png')"))
			.append($("<div>").addClass("users-name").text(getDisplayName(o)))
			.on('click', function (e) {
				requestInvite($(e.currentTarget).attr('id').slice(12));
			});
	} else {
		$R = $("<div>").attr('id', "users-item-" + o.id).addClass("users-item")
			.append($("<div>").addClass("jt-image users-image").css('background-image', "url('" + o.profile.image + "')"))
			.append(getLevelImage(o.data.score).addClass("users-level"))
			// .append($("<div>").addClass("jt-image users-from").css('background-image', "url('/img/kkutu/"+o.profile.type+".png')"))
			.append($("<div>").addClass("users-name ellipse").text(getDisplayName(o)))
			.on('click', function (e) {
				requestProfile($(e.currentTarget).attr('id').slice(11));
			});
	}
	addonNickname($R, o);

	return $R;
}
function addonNickname($R, o) {
	if (o.equip['NIK']) {
		var cls = "x-" + o.equip['NIK'];
		$R.addClass(cls);
		// For gradient names, also apply to the direct text child for proper text clipping
		if (o.equip['NIK'].indexOf("gradientname_") === 0 || o.equip['NIK'].indexOf("kkn_triname") === 0) {
			var $text = $R.find(".users-name, .room-user-name, .game-user-name, .chat-head").first();
			if ($text.length) $text.addClass(cls);
		}
	}
	if (o.equip['BDG'] == "b1_gm") $R.addClass("x-gm");
}
function updateRoomList(refresh) {
	var i;
	var len = 0;

	if (!refresh) {
		$(".rooms-create").remove();
		for (i in $data.rooms) len++;
	} else {
		$stage.lobby.roomList.empty();
		for (i in $data.rooms) {
			$stage.lobby.roomList.append(roomListBar($data.rooms[i]));
			len++;
		}
	}
	$stage.lobby.roomListTitle.html(L['RoomList'].replace("FA{bars}", "<i class='fa fa-bars'></i>") + " [" + len + L['GAE'] + "]");

	if (len) {
		$(".rooms-gaming").css('display', $data.opts.ow ? "none" : "");
		$(".rooms-locked").css('display', $data.opts.ou ? "none" : "");
	} else {
		$stage.lobby.roomList.append($stage.lobby.createBanner.clone().on('click', onBanner));
	}
	function onBanner(e) {
		$stage.menu.newRoom.trigger('click');
	}
}
function roomListBar(o) {
	var $R, $ch, $rm;
	var opts = getOptions(o.mode, o.opts, false, mobile);
	var rule = RULE[MODE[o.mode]];
	var isAlwaysSurvival = !!(rule && rule.survival);
	var isSurvival = isAlwaysSurvival || (o.opts && o.opts.survival);
	var isCoop = !!(rule && rule.coop);
	var displayRound = (o.coopTarget !== undefined) ? o.coopTarget : o.round;
	var roundOrHP = isSurvival ? ((o.opts && o.opts.surHP || 500) + " HP") : ((isCoop ? L['coopRound'] : L['rounds']) + " " + displayRound);

	$R = $("<div>").attr('id', "room-" + o.id).addClass("rooms-item")
		.append($ch = $("<div>").addClass("rooms-channel channel-" + o.channel).on('click', function (e) { requestRoomInfo(o.id); }))
		.append($("<div>").addClass("rooms-number").text(o.id))
		.append($("<div>").addClass("rooms-title ellipse").text(badWords(o.title)))
		.append($("<div>").addClass("rooms-limit").text(o.players.length + " / " + o.limit))
		.append($("<div>").width(270)
			.append($rm = $("<div>").addClass("rooms-mode").html(opts.join(" / ").toString()))
			.append($("<div>").addClass("rooms-round").text(roundOrHP))
			.append($("<div>").addClass("rooms-time").html(o.time + L['SECOND']))
		)
		.append($("<div>").addClass("rooms-lock").html(o.password ? "<i class='fa fa-lock'></i>" : "<i class='fa fa-unlock'></i>"))
		.on('click', function (e) {
			if (e.target == $ch.get(0)) return;
			tryJoin($(e.currentTarget).attr('id').slice(5));
		});

	var pickTopics = getPickTopicExpl(rule, o.opts);
	if (pickTopics.length) {
		var tooltipWidth = mobile ? 250 : 300;
		$rm.append($("<div>").addClass("expl pick-topic-expl").css({ 'width': tooltipWidth, 'white-space': "normal", 'text-align': "left" })
			.html("<h5 style='color: #BBBBBB;'>" + L['pickTopicTitle'] + "</h5>" + pickTopics.join(", "))
		);
		if (mobile) {
			$rm.on('touchstart', function (e) {
				var $e = $(this).children(".expl");
				if ($e.hasClass("expl-active")) {
					$e.removeClass("expl-active");
				} else {
					$(".expl-active").removeClass("expl-active");
					$e.addClass("expl-active").css({
						'left': Math.min(e.originalEvent.touches[0].clientX + 5, $(window).width() - $e.width() - 12),
						'top': Math.min(e.originalEvent.touches[0].clientY + 23, $(window).height() - $e.height() - 12)
					});
				}
				e.stopPropagation();
			});
		}
	}
	global.expl($R);

	if (o.gaming) $R.addClass("rooms-gaming");
	if (o.password) $R.addClass("rooms-locked");

	return $R;
}
function normalGameUserBar(o) {
	var $m, $n, $bar;
	var $R = $("<div>").attr('id', "game-user-" + o.id).addClass("game-user")
		.append($m = $("<div>").addClass("moremi game-user-image"))
		.append($("<div>").addClass("game-user-title")
			.append(getLevelImage(o.data.score).addClass("game-user-level"))
			.append($bar = $("<div>").addClass("game-user-name ellipse").text(getDisplayName(o)))
			.append($("<div>").addClass("expl").html(L['LEVEL'] + " " + getLevel(o.data.score)))
		)
		.append($n = $("<div>").addClass("game-user-score"));
	renderMoremi($m, o.equip);
	global.expl($R);
	addonNickname($bar, o);
	if (o.game.team) $n.addClass("team-" + o.game.team);

	return $R;
}
function miniGameUserBar(o) {
	var $n, $bar;
	var $R = $("<div>").attr('id', "game-user-" + o.id).addClass("game-user")
		.append($("<div>").addClass("game-user-title")
			.append(getLevelImage(o.data.score).addClass("game-user-level"))
			.append($bar = $("<div>").addClass("game-user-name ellipse").text(getDisplayName(o)))
		)
		.append($n = $("<div>").addClass("game-user-score"));

	// Add classes for small-mode styling compatibility if needed
	if ($(".game-body").hasClass("small-mode")) {
		// No specific changes needed here if CSS covers .game-body.small-mode .game-user
		// But let's ensure structure matches what CSS expects
	}

	if (o.id == $data.id) $bar.addClass("game-user-my-name");
	addonNickname($bar, o);
	if (o.game.team) $n.addClass("team-" + o.game.team);

	return $R;
}
function getAIProfile(level) {
	return {
		title: L['aiLevel' + level] + ' ' + L['robot'],
		image: "/img/kkutu/robot.png"
	};
}
function updateRoom(gaming) {
	var i, o, $r;
	var $y, $z;
	var $m;
	var $bar;
	var rule = RULE[MODE[$data.room.mode]];
	var renderer = (mobile || rule.big) ? miniGameUserBar : normalGameUserBar;
	var spec;
	var arAcc = false, allReady = true;

	setRoomHead($(".RoomBox .product-title"), $data.room);
	setRoomHead($(".GameBox .product-title"), $data.room);



	if (gaming) {
		$r = $(".GameBox .game-body").empty();
		// Apply appropriate CSS class based on mode and player count
		if (rule.big) {
			$r.removeClass("small-mode");
			$(".jjoriping,.rounds,.game-body").addClass("cw");
		} else {
			$(".jjoriping,.rounds,.game-body").removeClass("cw");
			if ($data.room.game.seq.length >= 9) {
				$r.addClass("small-mode");
			} else {
				$r.removeClass("small-mode");
			}
		}
		// updateScore(true);
		// 서바이벌 모드: 초기 HP 결정
		var survivalHP = ($data.room.opts && $data.room.opts.survival) ? ($data.room.opts.surHP || 500) : 0;

		for (i in $data.room.game.seq) {
			// 서바이벌: 떠난 플레이어는 카드 렌더에서 스킵 (서버 seq에는 KO 상태로 남아 있음)
			var _seqEntry = $data.room.game.seq[i];
			var _seqEntryId = (_seqEntry && typeof _seqEntry === 'object') ? _seqEntry.id : _seqEntry;
			if ($data._survivalLeftPlayers && $data._survivalLeftPlayers[_seqEntryId]) continue;
			if ($data._replay) {
				o = $rec.users[$data.room.game.seq[i]] || $data.room.game.seq[i];
			} else {
				// 서버에서 보낸 새 봇 데이터를 우선 사용하여 점수 동기화
				var serverData = $data.room.game.seq[i];
				if (serverData && serverData.robot) {
					// 캐시된 봇이 있으면 서버 데이터로 전체 속성 동기화
					if ($data.robots[serverData.id]) {
						var cached = $data.robots[serverData.id];
						cached.game = serverData.game;
						if (serverData.profile) cached.profile = serverData.profile;
						if (serverData.equip) cached.equip = serverData.equip;
						if (serverData.data) cached.data = serverData.data;
						if (serverData.level !== undefined) cached.level = serverData.level;
					}
					o = $data.robots[serverData.id] || serverData;
				} else {
					o = $data.users[$data.room.game.seq[i]] || $data.robots[$data.room.game.seq[i].id] || $data.room.game.seq[i];
				}
			}
			if (o.robot) {
				if (!o.profile) o.profile = getAIProfile(o.level);
				$data.robots[o.id] = o;
			}
			$r.append(renderer(o));
			// 서바이벌 모드에서 플레이어 초기 HP 설정
			// 단, 게임이 끝난 후(gaming=false)에는 폴백 적용하지 않음 (KO된 플레이어 점수 0 유지)
			var initialScore = o.game.score;
			if (survivalHP > 0 && !o.robot && (initialScore === undefined || initialScore === 0) && o.game.alive !== false) {
				// 게임이 진행 중일 때만 폴백 적용 (라운드 시작 시) — KO된 플레이어(alive===false)는 제외
				if ($data.room.gaming) {
					initialScore = survivalHP;
					if (o.game) o.game.score = survivalHP;
				}
			}
			updateScore(o.id, initialScore || 0);
			if ($data.room.opts && $data.room.opts.survival && o.game && o.game.alive === false) {
				applySurvivalKODisplay(o.id);
			}
		}
		clearTimeout($data._jamsu);
		delete $data._jamsu;
	} else {
		$r = $(".room-users").empty();
		if ($data.room.players.length >= 9) $r.addClass("small-mode");
		else $r.removeClass("small-mode");
		spec = $data.users[$data.id].game.form == "S";
		// 참가자
		for (i in $data.room.players) {
			o = $data.users[$data.room.players[i]] || $data.room.players[i];
			if (!o.game) continue;

			var prac = o.game.practice ? ('/' + L['stat_practice']) : '';
			var spec = (o.game.form == "S") ? ('/' + L['stat_spectate']) : false;

			if (o.robot) {
				if (!o.profile) o.profile = getAIProfile(o.level);
				$data.robots[o.id] = o;
			}
			$r.append($("<div>").attr('id', "room-user-" + o.id).addClass("room-user")
				.append($m = $("<div>").addClass("moremi room-user-image"))
				.append($("<div>").addClass("room-user-stat")
					.append($y = $("<div>").addClass("room-user-ready"))
					.append($z = $("<div>").addClass("room-user-team team-" + o.game.team).html($("#team-" + o.game.team).html()))
				)
				.append($("<div>").addClass("room-user-title")
					.append(getLevelImage(o.data.score).addClass("room-user-level"))
					.append($bar = $("<div>").addClass("room-user-name").text(getDisplayName(o)))
				).on('click', function (e) {
					requestProfile($(e.currentTarget).attr('id').slice(10));
				})
			);
			renderMoremi($m, o.equip);
			if (spec) $z.hide();
			if (o.id == $data.room.master) {
				$y.addClass("room-user-master").html(L['master'] + prac + (spec || ''));
			} else if (spec) {
				$y.addClass("room-user-spectate").html(L['stat_spectate'] + prac);
			} else if (o.game.ready || o.robot) {
				$y.addClass("room-user-readied").html(L['stat_ready']);
				if (!o.robot) arAcc = true;
			} else if (o.game.practice) {
				$y.addClass("room-user-practice").html(L['stat_practice']);
				allReady = false;
			} else {
				$y.html(L['stat_noready']);
				allReady = false;
			}
			addonNickname($bar, o);
		}
		if (arAcc && $data.room.master == $data.id && allReady) {
			if (!$data._jamsu) $data._jamsu = addTimeout(onMasterSubJamsu, 15000);
		} else {
			clearTimeout($data._jamsu);
			delete $data._jamsu;
		}
	}
	if ($stage.dialog.profile.is(':visible')) {
		requestProfile($data._profiled);
	}

	// Drug Mode: Rainbow Timer & Shake Elements (Independent)
	if ($data.room.opts.drg) {
		$(".GameBox").addClass("psychedelic-bg");
		$(".jjo-turn-time .graph-bar, .jjo-round-time .graph-bar").addClass("rainbow");
		if (!mobile && !($data.opts && $data.opts.ns)) {
			var $targets = $(".game-user, .jjoriping, .items, .clock-canvas, .game-input, .chain");
			$targets.each(function () {
				var $t = $(this);
				if (!$t.hasClass("shake")) {
					$t.addClass("shake").css("animation-duration", (Math.random() * 2 + 1) + "s");
				}
			});
			$(".GameBox .game-head, .GameBox .game-body").removeClass("shake");
		}

		// Random Card Background
		if (!$data._drgBgInterval) {
			$data._drgBgInterval = addInterval(function () {
				// Apply shake to dynamic elements
				if (!mobile && !($data.opts && $data.opts.ns)) {
					$(".game-input, .chain, .history-item").each(function () {
						var $t = $(this);
						if (!$t.hasClass("shake")) {
							$t.addClass("shake").css("animation-duration", (Math.random() * 2 + 1) + "s");
						}
					});
				}

				$(".game-user").each(function () {
					var $t = $(this);
					if (!$data._flipColorMap) $t.css("background-color", "hsl(" + (Math.random() * 360) + ", 70%, 80%)");

					// Random Moremi Item Update
					if (!mobile) {
						var id = $t.attr('id').replace('game-user-', '');
						var user = $data.users[id] || $data.robots[id];
						var equip = {};

						// Generate Random Equip
						var GROUPS = {
							'head': ["blackbere", "black_mask", "blue_headphone", "brownbere", "haksamo", "hamster_G", "hamster_O", "miljip", "nekomimi", "orange_headphone", "redbere", "twoeight", "white_mask"],
							'eye': ["bigeye", "brave_eyes", "close_eye", "cuspidal", "double_brows", "inverteye", "lazy_eye", "scouter", "sunglasses"],
							'mouth': ["beardoll", "cat_mouth", "decayed_mouth", "laugh", "merong", "mustache", "oh"],
							'clothes': ["blackrobe", "blue_vest", "medal", "orange_vest", "pants_china", "pants_japan", "pants_korea", "pink_vest", "sqpants", "water", "ilusweater", "kktpixel", "pixgradg", "pixgrado"],
							'hs': ["bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice", "black_oxford", "black_shoes", "brown_oxford", "loosesocks"],
							'back': []
						};
						var PART_MAP = {
							'head': 'head', 'eye': 'eye', 'mouth': 'mouth', 'clothes': 'clothes', 'back': 'back',
							'shoes': 'hs', 'lhand': 'hs', 'rhand': 'hs'
						};
						var MOREMI_PART = ["back", "shoes", "clothes", "head", "eye", "mouth", "lhand", "rhand"];

						for (var i in MOREMI_PART) {
							var partName = MOREMI_PART[i];
							var groupKey = PART_MAP[partName];
							if (groupKey && GROUPS[groupKey] && Math.random() < 0.5) {
								var group = GROUPS[groupKey];
								equip['M' + partName] = group[Math.floor(Math.random() * group.length)];
							}
						}

						renderMoremi($t.find('.moremi'), equip);
					}
				});
			}, 500);
		}
		// Periodic Random Sound (1-5s)
		if (!$data._drgSoundLoop && $data.room.gaming) {
			var playRandomSound = function () {
				if (!$data.room || !$data.room.opts.drg || !$data.room.gaming) {
					delete $data._drgSoundLoop;
					return;
				}

				// 1~5초 사이 랜덤 간격
				$data._drgSoundLoop = addTimeout(playRandomSound, Math.random() * 4000 + 1000);

				// 무조건 소리 재생 (Common 1~30)
				if (!$data.muteEff) {
					var r = Math.floor(Math.random() * 30) + 1;
					try {
						var audio = new Audio('/media/common/' + r + '.mp3');
						audio.volume = ($data.EffectVolume !== undefined) ? $data.EffectVolume : 0.5;
						audio.play().catch(function (e) { });
					} catch (e) { }
				}
			};
			$data._drgSoundLoop = addTimeout(playRandomSound, Math.random() * 4000 + 1000);
		}
	} else {
		$(".GameBox").removeClass("psychedelic-bg");
		$(".jjo-turn-time .graph-bar, .jjo-round-time .graph-bar").removeClass("rainbow");
		$(".jjo-display, .jjo-turn-time, .jjo-round-time, .jjoObj, .jjoriping, .items, .game-user, .moremi, .GameBox .game-head, .GameBox .game-body, .clock-canvas, .game-input, .chain, .history-item")
			.removeClass("shake").css("animation-duration", "");

		if ($data._drgBgInterval) {
			clearInterval($data._drgBgInterval);
			delete $data._drgBgInterval;
			$(".game-user").css("background-color", "");
		}
		if ($data._drgSoundLoop) {
			clearTimeout($data._drgSoundLoop);
			delete $data._drgSoundLoop;
		}
	}
}
function onMasterSubJamsu() {
	if (!$data.room || $data.room.master != $data.id) return;
	// 서버에서 이미 'subJamsu' 시스템 메시지를 보내므로 
	// 클라이언트에서 중복 알림을 방지하기 위해 notice() 호출 제거
	// 타이머만 정리
	delete $data._jamsu;
}
function updateScore(id, score) {
	var i, o, t;
	var $userCard = $("#game-user-" + id);

	if ($userCard.hasClass("game-user-ko")) return $userCard;

	if (o = $data["_s" + id]) {
		clearTimeout(o.timer);
		o.$obj = $("#game-user-" + id + " .game-user-score");
		o.goal = score;
	} else {
		o = $data["_s" + id] = {
			$obj: $("#game-user-" + id + " .game-user-score"),
			goal: score,
			now: 0
		};
	}
	animateScore(o);
	/*if(id === true){
		// 팀 정보 초기화
		$data.teams = [];
		for(i=0; i<5; i++) $data.teams.push({ list: [], score: 0 });
		for(i in $data.room.game.seq){
			t = $data.room.game.seq[i];
			o = $data.users[t] || $data.robots[t] || t;
			if(o){
				$data.teams[o.game.team].list.push(t.id ? t.id : t);
				$data.teams[o.game.team].score += o.game.score;
			}
		}
		for(i in $data.room.game.seq){
			t = $data.room.game.seq[i];
			o = $data.users[t] || $data.robots[t] || t;
			updateScore(t.id || t, o.game.score);
		}
	}else{
		o = $data.users[id] || $data.robots[id];
		if(o.game.team){
			t = $data.teams[o.game.team];
			i = $data["_s"+id];
			t.score += score - (i ? i.goal : 0);
		}else{
			t = { list: [ id ], score: score };
		}
		for(i in t.list){
			if(o = $data["_s"+t.list[i]]){
				clearTimeout(o.timer);
				o.$obj = $("#game-user-"+t.list[i]+" .game-user-score");
				o.goal = t.score;
			}else{
				o = $data["_s"+t.list[i]] = {
					$obj: $("#game-user-"+t.list[i]+" .game-user-score"),
					goal: t.score,
					now: 0
				};
			}
			animateScore(o);
		}
		return $("#game-user-" + id);
	}*/
	return $("#game-user-" + id);
}
function animateScore(o) {
	var v = (o.goal - o.now) * Math.min(1, TICK * 0.01);

	if (v < 0.1) v = o.goal - o.now;
	else o.timer = addTimeout(animateScore, TICK, o);

	o.now += v;
	drawScore(o.$obj, Math.round(o.now));
}
function drawScore($obj, score) {
	var i, sc = (score > 99999) ? (zeroPadding(Math.round(score * 0.001), 4) + 'k') : zeroPadding(score, 5);

	$obj.empty();
	for (i = 0; i < sc.length; i++) {
		$obj.append($("<div>").addClass("game-user-score-char").html(sc[i]));
	}
}
function checkFailCombo(id) {
	if (!$data._replay && $data.lastFail == $data.id && $data.id == id) {
		$data.failCombo++;
		if ($data.failCombo == 1) notice(L['trollWarning']);
		if ($data.failCombo > 1) {
			send('leave');
			fail(437);
		}
	} else {
		$data.failCombo = 0;
	}
	$data.lastFail = id;
}
function clearGame() {
	if ($data._spaced) $lib.Typing.spaceOff();
	clearInterval($data._tTime);
	$data._relay = false;
	delete $data._flipColorMap;
	$(".game-user").css("background-color", "");

	// apple 규칙으로 변경된 설정을 원래대로 복구
	if ($data._originalSettings && $data.room) {
		$data.room.round = $data._originalSettings.round;
		$data.room.time = $data._originalSettings.time;
		delete $data._originalSettings;
	}

	// apple 모드 관련 정리
	if ($data._aplInterval) {
		clearInterval($data._aplInterval);
		delete $data._aplInterval;
	}
	if ($data._aplMode) {
		delete $data._aplMode;
	}
	delete $data._aplFrame;
	delete $data._gameBoard;
}
function gameReady() {
	var i, u;

	// 서바이벌: 새 게임 시작 시 이전 게임의 leaver set 초기화 (재입장한 플레이어 카드가 다시 보이도록)
	$data._survivalLeftPlayers = {};

	for (i in $data.room.players) {
		if ($data._replay) {
			u = $rec.users[$data.room.players[i]] || $data.room.players[i];
		} else {
			u = $data.users[$data.room.players[i]] || $data.robots[$data.room.players[i].id];
		}
		if (!u) continue;
		u.game.score = 0;
		// 서바이벌: 이전 게임에서 KO/leave로 alive=false였다면 초기화 (자기 자신 포함)
		u.game.alive = true;
		delete $data["_s" + $data.room.players[i]];
	}
	delete $data.lastFail;
	$data.failCombo = 0;
	$data._spectate = $data.room.game.seq.indexOf($data.id) == -1;
	$data._gAnim = true;
	$stage.box.room.show().height(360).animate({ 'height': 1 }, 500);
	$stage.box.game.height(1).animate({ 'height': 410 }, 500);
	stopBGM();
	$stage.dialog.resultSave.attr('disabled', false);
	clearBoard();
	$stage.game.display.html(L['soon']);
	playSound('game_start');
	forkChat();
	addTimeout(function () {
		$stage.box.room.height(360).hide();
		$stage.chat.scrollTop(999999999);
	}, 500);
}
function replayPrevInit() {
	var i;

	for (i in $data.room.game.seq) {
		if ($data.room.game.seq[i].robot) {
			$data.room.game.seq[i].game.score = 0;
		}
	}
	$rec.users = {};
	for (i in $rec.players) {
		var id = $rec.players[i].id;
		var rd = $rec.readies[id] || {};
		var u = $data.users[id] || $data.robots[id];
		var po = id;

		if ($rec.players[i].robot) {
			u = $rec.users[id] = { robot: true };
			po = $rec.players[i];
			po.game = {};
		} else {
			u = $rec.users[id] = {};
		}
		$data.room.players.push(po);
		u.id = po;
		u.profile = $rec.players[i];
		u.data = u.profile.data;
		u.equip = u.profile.equip;
		u.game = { score: 0, team: rd.t };
	}
	$data._rf = 0;
}
function replayReady() {
	var i;

	replayStop();
	$data._replay = true;
	$data.room = {
		title: $rec.title,
		players: [],
		events: [],
		time: $rec.roundTime,
		round: $rec.round,
		mode: $rec.mode,
		limit: $rec.limit,
		game: $rec.game,
		opts: $rec.opts,
		readies: $rec.readies
	};
	replayPrevInit();
	for (i in $rec.events) {
		$data.room.events.push($rec.events[i]);
	}
	$stage.box.userList.hide();
	$stage.box.roomList.hide();
	$stage.box.game.show();
	$stage.dialog.replay.hide();
	gameReady();
	updateRoom(true);
	$data.$gp = $(".GameBox .product-title").empty()
		.append($data.$gpt = $("<div>").addClass("game-replay-title"))
		.append($data.$gpc = $("<div>").addClass("game-replay-controller")
			.append($("<button>").html(L['replayNext']).on('click', replayNext))
			.append($("<button>").html(L['replayPause']).on('click', replayPause))
			.append($("<button>").html(L['replayPrev']).on('click', replayPrev))
		);
	$data._gpp = L['replay'] + " - " + (new Date($rec.time)).toLocaleString();
	$data._gtt = $data.room.events[$data.room.events.length - 1].time;
	$data._eventTime = 0;
	$data._rt = addTimeout(replayTick, 2000);
	$data._rprev = 0;
	$data._rpause = false;
	replayStatus();
	$stage.menu.replay.html(L['exit']).show();
}
function replayPrev(e) {
	var ev = $data.room.events[--$data._rf];
	var c;
	var to;

	if (!ev) return;
	c = ev.time;
	do {
		if (!(ev = $data.room.events[--$data._rf])) break;
	} while (c - ev.time < 1000);

	to = $data._rf - 1;
	replayPrevInit();
	c = $data.muteEff;
	$data.muteEff = true;
	for (i = 0; i < to; i++) {
		replayTick();
	}
	$(".deltaScore").remove();
	$data.muteEff = c;
	replayTick();
	/*var pev, ev = $data.room.events[--$data._rf];
	var c;
	
	if(!ev) return;
	
	c = ev.time;
	clearTimeout($data._rt);
	do{
		if(ev.data.type == 'turnStart'){
			$(".game-user-current").removeClass("game-user-current");
			if((pev = $data.room.events[$data._rf - 1]).data.profile) $("#game-user-" + pev.data.profile.id).addClass("game-user-current");
		}
		if(ev.data.type == 'turnEnd'){
			$stage.game.chain.html(--$data.chain);
			if(ev.data.profile){
				addScore(ev.data.profile.id, -(ev.data.score + ev.data.bonus));
				updateScore(ev.data.profile.id, getScore(ev.data.profile.id));
			}
		}
		if(!(ev = $data.room.events[--$data._rf])) break;
	}while(c - ev.time < 1000);
	if($data._rf < 0) $data._rf = 0;
	if(ev) if(ev.data.type == 'roundReady'){
		$(".game-user-current").removeClass("game-user-current");
	}
	replayTick(true);*/
}
function replayPause(e) {
	var p = $data._rpause = !$data._rpause;

	$(e.target).html(p ? L['replayResume'] : L['replayPause']);
}
function replayNext(e) {
	clearTimeout($data._rt);
	replayTick();
}
function replayStatus() {
	$data.$gpt.html($data._gpp
		+ " (" + ($data._eventTime * 0.001).toFixed(1) + L['SECOND']
		+ " / " + ($data._gtt * 0.001).toFixed(1) + L['SECOND']
		+ ")"
	);
}
function replayTick(stay) {
	var event = $data.room.events[$data._rf];
	var args, i;

	clearTimeout($data._rt);
	if (!stay) $data._rf++;
	if (!event) {
		replayStop();
		return;
	}
	if ($data._rpause) {
		$data._rf--;
		return $data._rt = addTimeout(replayTick, 100);
	}
	args = event.data;
	if (args.hint) args.hint = { _id: args.hint };
	if (args.type == 'chat') args.timestamp = $rec.time + event.time;

	onMessage(args);

	$data._eventTime = event.time;
	replayStatus();
	if ($data.room.events.length > $data._rf) $data._rt = addTimeout(replayTick,
		$data.room.events[$data._rf].time - event.time
	);
	else replayStop();
}
function replayStop() {
	stopAllSounds();
	delete $data.room;
	$data._replay = false;
	$stage.box.room.height(360);
	clearTimeout($data._rt);
	updateUI();
	playBGM('lobby');
	$stage.menu.replay.html(L['replay']);
}
function startRecord(title) {
	var i, u;

	$rec = {
		version: $data.version,
		me: $data.id,
		players: [],
		events: [],
		title: $data.room.title,
		roundTime: $data.room.time,
		round: $data.room.round,
		mode: $data.room.mode,
		limit: $data.room.limit,
		game: $data.room.game,
		opts: $data.room.opts,
		readies: $data.room.readies,
		time: (new Date()).getTime()
	};
	for (i in $data.room.players) {
		var o;

		u = $data.users[$data.room.players[i]] || $data.room.players[i];
		o = { id: u.id, score: 0 };
		if (u.robot) {
			o.id = u.id;
			o.robot = true;
			o.data = { score: 0 };
			u = { profile: getAIProfile(u.level) };
		} else {
			o.data = u.data;
			o.equip = u.equip;
		}
		o.title = "#" + u.id; // u.profile.title;
		// o.image = u.profile.image;
		$rec.players.push(o);
	}
	$data._record = true;
}
function stopRecord() {
	$data._record = false;
}
function recordEvent(data) {
	if ($data._replay) return;
	if (!$rec) return;
	var i, _data = data;

	if (!data.hasOwnProperty('type')) return;
	if (data.type == "room") return;
	if (data.type == "obtain") return;
	data = {};
	for (i in _data) data[i] = _data[i];
	if (data.profile) data.profile = { id: data.profile.id, title: "#" + data.profile.id };
	if (data.user) data.user = { id: data.user.profile.id, profile: { id: data.user.profile.id, title: "#" + data.user.profile.id }, data: { score: 0 }, equip: {} };

	$rec.events.push({
		data: data,
		time: (new Date()).getTime() - $rec.time
	});
}
function clearBoard() {
	$data._relay = false;
	// APL (Bad Apple) 정리
	if ($data._aplInterval) {
		clearInterval($data._aplInterval);
		$data._aplInterval = null;
	}
	if ($data._aplMode) {
		$data._aplMode = false;
		if ($_sound['apple']) {
			$_sound['apple'].stop();
			delete $_sound['apple'];
		}
		// 메모리 해제
		if (window.badAppleFrames) window.badAppleFrames = null;
	}
	loading();
	$stage.game.here.css('top', '');
	if (mobile) {
		$stage.game.here.css('opacity', 0.5).show();
	} else {
		$stage.game.here.hide();
	}
	$stage.dialog.result.hide();
	$stage.dialog.dress.hide();
	$stage.dialog.charFactory.hide();
	$(".jjoriping,.rounds,.game-body").removeClass("cw");
	$(".jjoriping,.game-body").removeClass("flip");
	$(".jjoriping").css({ "float": "", "margin": "" });
	// Small-mode class is managed by updateRoom() based on player count, don't remove it here
	$stage.game.display.removeClass("raingame-board").empty();
	$stage.game.chain.hide();
	$stage.game.hints.empty().hide();
	$stage.game.cwcmd.hide();
	$stage.game.bb.hide();
	$stage.game.round.empty();
	$stage.game.history.empty();
	$stage.game.items.show().css('opacity', 0);
	$(".jjo-turn-time .graph-bar").width(0).css({ 'float': "", 'text-align': "", 'background-color': "" }).removeClass("overflow").html("");
	$(".jjo-round-time .graph-bar").width(0).css({ 'float': "", 'text-align': "" }).removeClass("round-extreme").html("");
	$(".game-user-bomb").removeClass("game-user-bomb");
	$("#raingame-strategy").hide();
}
function drawRound(round) {
	var i;

	$stage.game.round.empty();
	for (i = 0; i < $data.room.round; i++) {
		$stage.game.round.append($l = $("<label>").html($data.room.game.title[i]));
		if ((i + 1) == round) $l.addClass("rounds-current");
	}
}
function turnGoing() {
	route("turnGoing");
}
function turnHint(data) {
	route("turnHint", data);
}
function turnError(code, text) {
	$stage.game.display.empty().append($("<label>").addClass("game-fail-text")
		.text((L['turnError_' + code] ? (L['turnError_' + code] + ": ") : "") + text)
	);
	playSound('fail');
	clearTimeout($data._fail);
	$data._fail = addTimeout(function () {
		// 계산 릴레이 / 네글자 이어말하기 모드에서는 _question을 복원, 다른 모드에서는 _char를 복원
		var restoreContent = ($data.room && (MODE[$data.room.mode] === 'CRL' || MODE[$data.room.mode] === 'K4R'))
			? $data._question
			: $data._char;
		$stage.game.display.html(restoreContent);
	}, 1800);
}
function getScore(id) {
	if ($data._replay) {
		var u = $rec.users[id];
		return u ? u.game.score : 0;
	} else {
		var u = $data.users[id] || $data.robots[id];
		return u ? u.game.score : 0;
	}
}
function addScore(id, score, totalScore) {
	var u;
	if ($data._replay) u = $rec.users[id];
	else u = $data.users[id] || $data.robots[id];

	if (u && u.game) {
		// totalScore가 있으면 서버 점수로 동기화 (봇 점수 비주얼 버그 수정)
		if (typeof totalScore === 'number') {
			u.game.score = totalScore;
		} else {
			u.game.score += score;
		}
	}
}
function drawObtainedScore($uc, $sc) {
	$uc.append($sc);
	addTimeout(function () { $sc.remove(); }, 2000);

	return $uc;
}

// ========== 서바이벌 모드 공통 클라이언트 함수 ==========

/**
 * 서바이벌 모드 KO 처리 (타임아웃 또는 데미지로 인한 KO)
 * @param {string} id - 현재 턴 플레이어 ID
 * @param {Object} data - turnEnd 데이터
 * @param {jQuery} $sc - 점수 표시 요소
 * @param {jQuery} $uc - 현재 유저 요소
 * @returns {boolean} KO 처리가 되었으면 true (이후 로직 스킵)
 */
function handleSurvivalKO(id, data, $sc, $uc) {
	if (!data.survival || !data.ko) return false;

	var koTarget = data.target || id;
	applySurvivalKODisplay(koTarget);

	var koUser = $data.users[koTarget] || $data.robots[koTarget];
	if (koUser && koUser.game) {
		koUser.game.alive = false;
		koUser.game.score = 0;
	}

	playSound('KO');
	playSound('timeout');
	$sc.addClass("lost");
	$(".game-user-current").addClass("game-user-bomb");
	mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();

	drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	return true;
}

/**
 * 서바이벌 모드 데미지 처리 (정답 입력 시 다음 플레이어에게 데미지)
 * @param {Object} data - turnEnd 데이터
 */
function handleSurvivalDamage(data) {
	if (!data.survival || !data.survivalDamage) return;

	var dmgInfo = data.survivalDamage;
	var $dmgTarget = $(document.getElementById("game-user-" + dmgInfo.targetId));

	var dmgUser = $data.users[dmgInfo.targetId] || $data.robots[dmgInfo.targetId];
	if (dmgUser && dmgUser.game) {
		dmgUser.game.score = dmgInfo.newHP;
	}

	if ($dmgTarget.length) {
		$dmgTarget.addClass("survival-damage");
		addTimeout(function () {
			$dmgTarget.removeClass("survival-damage");
		}, 500);

		var $dmgSc = $("<div>")
			.addClass("deltaScore damage")
			.css('color', '#FF6666')
			.text("-" + dmgInfo.damage);
		drawObtainedScore($dmgTarget, $dmgSc);

		if (dmgInfo.ko) {
			// 기존 스코어 애니메이션 취소 (KO 텍스트 덮어쓰기 방지)
			var existingAnim = $data["_s" + dmgInfo.targetId];
			if (existingAnim) {
				clearTimeout(existingAnim.timer);
				delete $data["_s" + dmgInfo.targetId];
			}
			applySurvivalKODisplay(dmgInfo.targetId);

			if (dmgUser && dmgUser.game) {
				dmgUser.game.alive = false;
			}
			playSound('KO');
			playSound('timeout');
		} else {
			updateScore(dmgInfo.targetId, dmgInfo.newHP);
		}
	}
}
/**
 * 서바이벌 KO 상태를 DOM에 반영하는 공통 함수
 * @param {string} targetId - KO된 플레이어/봇 ID
 */
function applySurvivalKODisplay(targetId) {
	var el = document.getElementById("game-user-" + targetId);
	if (!el) return;
	var $el = $(el);
	$el.find(".game-user-image").addClass("survival-ko");
	$el.find(".game-user-score").text("KO").addClass("survival-ko-score");
	$el.addClass("game-user-ko");
}
// ========== 서바이벌 모드 공통 끝 ==========
function turnEnd(id, data) {
	route("turnEnd", id, data);
}
function roundEnd(result, data) {
	if (!data) data = {};
	var i, o, r;
	var $b = $(".result-board").empty();
	var $o, $p;
	var lvUp, sc;
	var addit, addp;

	// 게임 입력창 숨기기 및 relay 플래그 초기화
	// (게임 끝 후 채팅이 relay=true로 전송되어 서버에서 차단되는 문제 방지)
	$stage.game.here.hide();
	$data._relay = false;

	$(".result-me-expl").empty();
	if (data && data.coopSuccess) {
		$stage.game.display.removeClass("raingame-board").html(L['coopSuccess']);
		playSound('success');
	} else {
		$stage.game.display.removeClass("raingame-board").html(L['roundEnd']);
	}
	$data._resultPage = 1;
	$data._result = null;
	for (i in result) {
		r = result[i];
		if ($data._replay) {
			o = $rec.users[r.id];
		} else {
			o = $data.users[r.id] || $data.robots[r.id];
		}
		if (!o) {
			o = NULL_USER;
		}
		if (!o.data) continue;
		if (!r.reward) continue;

		r.reward.score = $data._replay ? 0 : Math.round(r.reward.score);
		lvUp = getLevel(sc = o.data.score) > getLevel(o.data.score - r.reward.score);

		// 서바이벌 모드: KO된 플레이어 점수 표시
		var isSurvival = $data.room && $data.room.opts && $data.room.opts.survival;
		var isKO = isSurvival && r.alive === false;
		var chainLabel = L['chainCount'] || 'Chain';
		var scoreDisplay = data.chains
			? (commify(data.chains[r.id] || 0) + " " + chainLabel)
			: data.scores
				? (L['avg'] + " " + commify(data.scores[r.id]) + L['kpm'])
				: (isKO ? "KO" : (commify(r.score || 0) + (isSurvival ? " HP" : L['PTS'])));

		$b.append($o = $("<div>").addClass("result-board-item")
			.append($p = $("<div>").addClass("result-board-rank").html(r.rank + 1))
			.append(getLevelImage(sc).addClass("result-board-level"))
			.append($("<div>").addClass("result-board-name").text(o.profile.title || o.profile.name))
			.append($("<div>").addClass("result-board-score")
				.html(scoreDisplay)
			)
			.append($("<div>").addClass("result-board-reward").html(r.reward.score ? ("+" + commify(r.reward.score)) : "-"))
			.append($("<div>").addClass("result-board-lvup").css('display', lvUp ? "block" : "none")
				.append($("<i>").addClass("fa fa-arrow-up"))
				.append($("<div>").html(L['lvUp']))
			)
		);
		if (isKO) $o.addClass("survival-ko-result");
		if (o.game.team) $p.addClass("team-" + o.game.team);
		if (r.id == $data.id) {
			r.exp = o.data.score - r.reward.score;
			r.level = getLevel(r.exp);
			$data._result = r;
			$o.addClass("result-board-me");
			$(".result-me-expl").append(explainReward(r.reward._score, r.reward._money, r.reward._blog));
		}
	}
	$(".result-me").css('opacity', 0);
	$data._coef = 0;
	if ($data._result) {
		addit = $data._result.reward.score - $data._result.reward._score;
		addp = $data._result.reward.money - $data._result.reward._money;

		$data._result._exp = $data._result.exp;
		$data._result._score = $data._result.reward.score;
		$data._result._bonus = addit;
		$data._result._boing = $data._result.reward._score;
		$data._result._addit = addit;
		$data._result._addp = addp;

		if (addit > 0) {
			addit = "<label class='result-me-bonus'>(+" + commify(addit) + ")</label>";
		} else addit = "";
		if (addp > 0) {
			addp = "<label class='result-me-bonus'>(+" + commify(addp) + ")</label>";
		} else addp = "";

		notice(L['scoreGain'] + ": " + commify($data._result.reward.score) + ", " + L['moneyGain'] + ": " + commify($data._result.reward.money));
		$(".result-me").css('opacity', 1);
		$(".result-me-score").html(L['scoreGain'] + " +" + commify($data._result.reward.score) + addit);
		$(".result-me-money").html(L['moneyGain'] + " +" + commify($data._result.reward.money) + addp);
	}
	function roundEndAnimation(first) {
		var v, nl;
		var going;

		$data._result.goal = EXP[$data._result.level - 1];
		$data._result.before = EXP[$data._result.level - 2] || 0;
		/*if(first){
			$data._result._before = $data._result.before;
		}*/
		if ($data._result.reward.score > 0) {
			v = $data._result.reward.score * $data._coef;
			if (v < 0.05 && $data._coef) v = $data._result.reward.score;

			$data._result.reward.score -= v;
			$data._result.exp += v;
			nl = getLevel($data._result.exp);
			if ($data._result.level != nl) {
				$data._result._boing -= $data._result.goal - $data._result._exp;
				$data._result._exp = $data._result.goal;
				playSound('lvup');
			}
			$data._result.level = nl;

			addTimeout(roundEndAnimation, 50);
		}
		going = $data._result.exp - $data._result._exp;
		draw('before', $data._result._exp, $data._result.before, $data._result.goal);
		draw('current', Math.min(going, $data._result._boing), 0, $data._result.goal - $data._result.before);
		draw('bonus', Math.max(0, going - $data._result._boing), 0, $data._result.goal - $data._result.before);

		$(".result-me-level-body").html($data._result.level);
		$(".result-me-score-text").html(commify(Math.round($data._result.exp)) + " / " + commify($data._result.goal));
	}
	function draw(phase, val, before, goal) {
		$(".result-me-" + phase + "-bar").width((val - before) / (goal - before) * 100 + "%");
	}
	function explainReward(orgX, orgM, list) {
		var $sb, $mb;
		var $R = $("<div>")
			.append($("<h4>").html(L['scoreGain']))
			.append($sb = $("<div>"))
			.append($("<h4>").html(L['moneyGain']))
			.append($mb = $("<div>"));

		row($sb, L['scoreOrigin'], orgX);
		row($mb, L['moneyOrigin'], orgM);
		list.forEach(function (item) {
			var from = item.charAt(0);
			var type = item.charAt(1);
			var target = item.slice(2, 5);
			var value = Number(item.slice(5));
			var $t, vtx, org;

			if (target == 'EXP') $t = $sb, org = orgX;
			else if (target == 'MNY') $t = $mb, org = orgM;

			if (type == 'g') vtx = "+" + (org * value).toFixed(1);
			else if (type == 'h') vtx = "+" + Math.floor(value);

			row($t, L['bonusFrom_' + from], vtx);
		});
		function row($t, h, b) {
			$t.append($("<h5>").addClass("result-me-blog-head").html(h))
				.append($("<h5>").addClass("result-me-blog-body").html(b));
		}
		return $R;
	}
	addTimeout(function () {
		showDialog($stage.dialog.result);
		if ($data._result) roundEndAnimation(true);
		$stage.dialog.result.css('opacity', 0).animate({ opacity: 1 }, 500);
		addTimeout(function () {
			$data._coef = 0.05;
		}, 500);
	}, 2000);
	stopRecord();
}
function drawRanking(ranks) {
	var $b = $(".result-board").empty();
	var $o, $v;
	var me;

	$data._resultPage = 2;
	if (!ranks) return $stage.dialog.resultOK.trigger('click');
	for (i in ranks.list) {
		r = ranks.list[i];
		o = $data.users[r.id] || {
			profile: { title: L['hidden'] }
		};
		me = r.id == $data.id;

		$b.append($o = $("<div>").addClass("result-board-item")
			.append($("<div>").addClass("result-board-rank").html(r.rank + 1))
			.append(getLevelImage(r.score).addClass("result-board-level"))
			.append($("<div>").addClass("result-board-name").text(o.profile.title || o.profile.name))
			.append($("<div>").addClass("result-board-score").html(commify(r.score) + L['PTS']))
			.append($("<div>").addClass("result-board-reward").html(""))
			.append($v = $("<div>").addClass("result-board-lvup").css('display', me ? "block" : "none")
				.append($("<i>").addClass("fa fa-arrow-up"))
				.append($("<div>").html(ranks.prev - r.rank))
			)
		);

		if (me) {
			if (ranks.prev - r.rank <= 0) $v.hide();
			$o.addClass("result-board-me");
		}
	}
}
function kickVoting(target) {
	var op = $data.users[target].profile;

	$("#kick-vote-text").text((op.title || op.name) + L['kickVoteText']);
	$data.kickTime = 10;
	$data._kickTime = 10;
	$data._kickTimer = addTimeout(kickVoteTick, 1000);
	showDialog($stage.dialog.kickVote);
}
function kickVoteTick() {
	$(".kick-vote-time .graph-bar").width($data.kickTime / $data._kickTime * 300);
	if (--$data.kickTime > 0) $data._kickTimer = addTimeout(kickVoteTick, 1000);
	else $stage.dialog.kickVoteY.trigger('click');
}
function afkWarning(duration) {
	$("#afk-warn-text").text(L['afkWarnText']);
	$data._afkEndTime = Date.now() + duration * 1000;
	$data._afkDuration = duration * 1000;
	clearTimeout($data._afkTimer);
	$data._afkTimer = addTimeout(afkWarnTick, 50);
	showDialog($stage.dialog.afkWarn);
}
function afkWarnTick() {
	var remaining = $data._afkEndTime - Date.now();
	if (remaining <= 0) {
		$(".afk-warn-time .graph-bar").width(0);
		// 바 만료 시에는 서버 킥 타이머가 소켓을 닫음. 클라이언트에서 afkPing을 보내지 않음.
		return;
	}
	$(".afk-warn-time .graph-bar").width(remaining / $data._afkDuration * 300);
	$data._afkTimer = addTimeout(afkWarnTick, 50);
}
function processNormal(word, mean) {
	return $("<label>").addClass("word").html(mean);
}
function processWord(word, _mean, _theme, _wcs) {
	if (!_mean || _mean.indexOf("＂") == -1) return processNormal(word, _mean);
	var $R = $("<label>").addClass("word");
	var means = _mean.split(/＂[0-9]+＂/).slice(1).map(function (m1) {
		return (m1.indexOf("［") == -1) ? [[m1]] : m1.split(/［[0-9]+］/).slice(1).map(function (m2) {
			return m2.split(/（[0-9]+）/).slice(1);
		});
	});
	var types = _wcs ? _wcs.map(function (_wc) {
		return L['class_' + _wc];
	}) : [];
	var themes = _theme ? _theme.split(',').map(function (_t) {
		return L['theme_' + _t];
	}) : [];
	var ms = means.length > 1;

	means.forEach(function (m1, x1) {
		var $m1 = $("<label>").addClass("word-m1");
		var m1s = m1.length > 1;

		if (ms) $m1.append($("<label>").addClass("word-head word-m1-head").html(x1 + 1));
		m1.forEach(function (m2, x2) {
			var $m2 = $("<label>").addClass("word-m2");
			var m2l = m2.length;
			var m2s = m2l > 1;
			var tl = themes.splice(0, m2l);

			if (m1s) $m2.append($("<label>").addClass("word-head word-m2-head").html(x2 + 1));
			m2.forEach(function (m3, x3) {
				var $m3 = $("<label>").addClass("word-m3");
				var _t = tl.shift();

				if (m2s) $m3.append($("<label>").addClass("word-head word-m3-head").html(x3 + 1));
				if (_t) $m3.append($("<label>").addClass("word-theme").html(_t));
				$m3.append($("<label>").addClass("word-m3-body").html(formMean(m3)));

				$m2.append($m3);
			});
			$m1.append($m2);
		});
		$R.append($m1);
	});
	function formMean(v) {
		return v.replace(/\$\$[^\$]+\$\$/g, function (item) {
			var txt = item.slice(2, item.length - 2)
				.replace(/\^\{([^\}]+)\}/g, "<sup>$1</sup>")
				.replace(/_\{([^\}]+)\}/g, "<sub>$1</sub>")
				.replace(/\\geq/g, "≥")
				;

			return "<equ>" + txt + "</equ>";
		})
			.replace(/\*\*([^\*]+)\*\*/g, "<sup>$1</sup>")
			.replace(/\*([^\*]+)\*/g, "<sub>$1</sub>");
	}
	return $R;
}
function getCharText(char, subChar, wordLength) {
	// subChar가 파이프로 구분된 경우 콤마로 표시
	var displaySubChar = subChar ? subChar.split('|').join(', ') : null;

	if ($data.room && $data.room.opts && $data.room.opts.drg) {
		char = char.split('').map(function (c) {
			return "<label style='color:" + getRandomColor() + "'>" + c + "</label>";
		}).join('');

		if (displaySubChar) {
			displaySubChar = displaySubChar.split('').map(function (c) {
				return "<label style='color:" + getRandomColor() + "'>" + c + "</label>";
			}).join('');
		}
	}

	var res = char + (displaySubChar ? ("(" + displaySubChar + ")") : "");

	if (wordLength) res += "<label class='jjo-display-word-length'>(" + wordLength + ")</label>";

	return res;
}
function getRequiredScore(lv) {
	return Math.round(
		(!(lv % 5) * 0.3 + 1) * (!(lv % 15) * 0.4 + 1) * (!(lv % 45) * 0.5 + 1) * (
			120 + Math.floor(lv / 5) * 60 + Math.floor(lv * lv / 225) * 120 + Math.floor(lv * lv / 2025) * 180
		)
	);
}
function getLevel(score) {
	var i, l = EXP.length;

	for (i = 0; i < l; i++) if (score < EXP[i]) break;
	return i + 1;
}
function getLevelImage(score) {
	var lv = getLevel(score) - 1;
	var lX = (lv % 25) * -100;
	var lY = Math.floor(lv * 0.04) * -100;

	// return getImage("/img/kkutu/lv/lv" + zeroPadding(lv+1, 4) + ".png");
	return $("<div>").css({
		'float': "left",
		'background-image': "url('" + ($data.levelPackUrl || '/img/kkutu/lv/newlv.png') + "')",
		'background-position': lX + "% " + lY + "%",
		'background-size': "2560%"
	});
}
function getImage(url) {
	return $("<div>").addClass("jt-image").css('background-image', "url('" + url + "')");
}
function getOptions(mode, opts, hash, abbr) {
	var R = [abbr && L["mode" + MODE[mode] + "_abbr"] ? L["mode" + MODE[mode] + "_abbr"] : L["mode" + MODE[mode]]];
	var i, k;

	for (i in OPTIONS) {
		k = OPTIONS[i].name.toLowerCase();
		if (opts[k]) R.push(abbr && L['opt' + OPTIONS[i].name + "_abbr"] ? L['opt' + OPTIONS[i].name + "_abbr"] : L['opt' + OPTIONS[i].name]);
	}
	if (hash) R.push(opts.injpick.join('|'));

	return hash ? R.toString() : R;
}
function getPickTopicExpl(rule, opts) {
	var topics = [];
	var pickArr, prefix;

	if (rule && rule.opts.indexOf("ijp") != -1 && opts.injpick && opts.injpick.length) {
		pickArr = opts.injpick;
		prefix = "theme_";
		for (var i = 0; i < pickArr.length; i++) {
			var name = L[prefix + pickArr[i]];
			if (name) topics.push(name);
		}
	}
	if (rule && rule.opts.indexOf("qij") != -1 && opts.quizpick && opts.quizpick.length) {
		pickArr = opts.quizpick;
		prefix = "quiz_";
		for (var i = 0; i < pickArr.length; i++) {
			var name = L[prefix + pickArr[i]];
			if (name) topics.push(name);
		}
	}
	return topics;
}
function setRoomHead($obj, room) {
	var opts = getOptions(room.mode, room.opts, false, false);
	var rule = RULE[MODE[room.mode]];
	var $rm;
	var isAlwaysSurvival = !!(rule && rule.survival);
	var isSurvival = isAlwaysSurvival || (room.opts && room.opts.survival);
	var isCoop = !!(rule && rule.coop);
	var displayRound = (room.coopTarget !== undefined) ? room.coopTarget : room.round;
	var roundOrHP = isSurvival ? ((room.opts && room.opts.surHP || 500) + " HP") : (displayRound + " " + (isCoop ? L['coopRound'] : L['rounds']));

	$obj.empty()
		.append($("<h5>").addClass("room-head-number").text("[" + (room.practice ? L['practice'] : room.id) + "]"))
		.append($("<h5>").addClass("room-head-title").text(badWords(room.title)))
		.append($rm = $("<h5>").addClass("room-head-mode").html(opts.join(" / ")))
		.append($("<h5>").addClass("room-head-limit").text((mobile ? "" : (L['players'] + " ")) + room.players.length + " / " + room.limit))
		.append($("<h5>").addClass("room-head-round").text(roundOrHP))
		.append($("<h5>").addClass("room-head-time").html((Math.round(room.time * 10) / 10) + L['SECOND']));

	var pickTopics = getPickTopicExpl(rule, room.opts);
	var tooltipWidth = mobile ? 250 : 300;

	setTimeout(function () {
		var isOverflow = $rm[0].scrollWidth > $rm[0].clientWidth;
		if (!isOverflow && !pickTopics.length) return;

		var tooltipHtml = "";
		if (isOverflow) {
			tooltipHtml += opts.join(" / ");
		}
		if (pickTopics.length) {
			if (isOverflow) tooltipHtml += "<br>";
			tooltipHtml += "<h5 style='color: #BBBBBB;'>" + L['pickTopicTitle'] + "</h5>" + pickTopics.join(", ");
		}
		$rm.append($("<div>").addClass("expl pick-topic-expl").css({ 'width': tooltipWidth, 'white-space': "normal", 'text-align': "left" })
			.html(tooltipHtml)
		);
		if (mobile) {
			$rm.off('touchstart.roomhead').on('touchstart.roomhead', function (e) {
				var $e = $(this).children(".expl");
				if ($e.hasClass("expl-active")) {
					$e.removeClass("expl-active");
				} else {
					$(".expl-active").removeClass("expl-active");
					$e.addClass("expl-active").css({
						'left': Math.min(e.originalEvent.touches[0].clientX + 5, $(window).width() - $e.width() - 12),
						'top': Math.min(e.originalEvent.touches[0].clientY + 23, $(window).height() - $e.height() - 12)
					});
				}
				e.stopPropagation();
			});
		}
		global.expl($obj);
	}, 0);

	global.expl($obj);
}
function tryJoin(id) {
	if (!$data.rooms[id]) return;

	if ($data.rooms[id].password) {
		showPrompt(L['putPassword'], "", function (pw) {
			if (pw === null) return; // Cancelled
			join(pw);
		});
	} else {
		join();
	}

	function join(pw) {
		$data._pw = pw;
		send('enter', { id: id, password: pw });
	}
}
function clearChat() {
	$("#Chat").empty();
}
function forkChat() {
	var $cs = $("#Chat,#chat-log-board");
	var lh = $cs.children(".chat-item").last().get(0);

	if (lh) if (lh.tagName == "HR") return;
	$cs.append($("<hr>").addClass("chat-item"));
	$stage.chat.scrollTop(999999999);
}
function badWords(text) {
	if ($data.opts && $data.opts.nf === false) return text;
	return text.replace(BAD, L['captured_nyan']);
}
function chatBalloon(text, id, flag) {
	$("#cb-" + id).remove();
	var offset = ((flag & 2) ? $("#game-user-" + id) : $("#room-user-" + id)).offset();
	var img = (flag == 2) ? "chat-balloon-bot" : "chat-balloon-tip";
	var $obj = $("<div>").addClass("chat-balloon");
	var targetWidth = 0;
	if ((flag & 2) && $data.room && $data.room.game && $data.room.game.seq && $data.room.game.seq.length > 8) {
		$obj.addClass("small-balloon");
		var $target = $("#game-user-" + id);
		if ($target.length) targetWidth = $target.width();
	}
	$obj.attr('id', "cb-" + id)
		.append($("<div>").addClass("jt-image " + img))
	[(flag == 2) ? 'prepend' : 'append']($("<h4>").text(text));
	var ot, ol;

	if (!offset) return;
	$stage.balloons.append($obj);
	if (flag == 1) ot = 0, ol = 220;
	else if (flag == 2) ot = 35 - $obj.height(), ol = -2;
	else if (flag == 3) ot = 5, ol = 210;
	else ot = 40, ol = 110;

	if (targetWidth) {
		$obj.width(targetWidth);
		// Adjust left offset explicitly to align because width changed? 
		// Original 'ol = -2' relies on 123px width centering or overflow. 
		// If width matches card, left should be offset.left (ol=0).
		ol = 0;
	}

	$obj.css({ top: offset.top + ot, left: offset.left + ol });
	addTimeout(function () {
		$obj.animate({ 'opacity': 0 }, 500, function () { $obj.remove(); });
	}, 2500);
}
function chat(profile, msg, from, timestamp) {
	var time = timestamp ? new Date(timestamp) : new Date();
	var equip = $data.users[profile.id] ? $data.users[profile.id].equip : {};
	var $bar, $msg, $item;
	var link;

	if ($data._shut[profile.title || profile.name]) return;
	if (from) {
		if ($data.opts.dw) return;
		if ($data._wblock[from]) return;
	}
	msg = badWords(msg);
	playSound('k');
	stackChat();
	if (!mobile && $data.room) {
		$bar = ($data.room.gaming ? 2 : 0) + ($(".jjoriping").hasClass("cw") ? 1 : 0);
		chatBalloon(msg, profile.id, $bar);
	}
	$stage.chat.append($item = $("<div>").addClass("chat-item")
		.append($bar = $("<div>").addClass("chat-head ellipse").text(profile.title || profile.name))
		.append($msg = $("<div>").addClass("chat-body").text(msg))
		.append($("<div>").addClass("chat-stamp").text(time.toLocaleTimeString()))
	);
	if (timestamp) $bar.prepend($("<i>").addClass("fa fa-video-camera"));
	$bar.on('click', function (e) {
		requestProfile(profile.id);
	});
	$stage.chatLog.append($item = $item.clone());
	$item.append($("<div>").addClass("expl").css('font-weight', "normal").html("#" + String(profile.id || "").substr(0, 5)));

	if (link = msg.match(/https?:\/\/[\w\.\?\/&#%=-_\+]+/g)) {
		msg = $msg.html();
		link.forEach(function (item) {
			var safeItem = item.replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			msg = msg.replace(item, "<a href='#' style='color: #2222FF;' onclick='tryOpenLink(\"" + safeItem + "\");'>" + safeItem + "</a>");
		});
		$msg.html(msg);
	}
	if (from) {
		if (from !== true) $data._recentFrom = from;
		$msg.html("<label style='color: #7777FF; font-weight: bold;'>&lt;" + L['whisper'] + "&gt;</label>" + $msg.html());
	}
	addonNickname($bar, { equip: equip });
	$stage.chat.scrollTop(999999999);
}
function notice(msg, head) {
	var time = new Date();

	playSound('k');
	stackChat();
	$("#Chat,#chat-log-board").append($("<div>").addClass("chat-item chat-notice")
		.append($("<div>").addClass("chat-head").text(head || L['notice']))
		.append($("<div>").addClass("chat-body").text(msg))
		.append($("<div>").addClass("chat-stamp").text(time.toLocaleTimeString()))
	);
	$stage.chat.scrollTop(999999999);
}
function stackChat() {
	var $v = $("#Chat .chat-item");
	var $w = $("#chat-log-board .chat-item");

	if ($v.length > 99) {
		$v.first().remove();
	}
	if ($w.length > 199) {
		$w.first().remove();
	}
}
function iGoods(key) {
	var obj;

	if (key.charAt() == "$") {
		obj = $data.shop[key.slice(0, 4)];
	} else {
		obj = $data.shop[key];
	}
	return {
		_id: key,
		group: obj.group,
		term: obj.term,
		name: iName(key),
		cost: obj.cost,
		image: iImage(key, obj),
		desc: iDesc(key),
		options: obj.options
	};
}
function iName(key) {
	if (key.charAt() == "$") return L[key.slice(0, 4)][0] + ' - ' + key.slice(4);
	else return L[key][0];
}
function iDesc(key) {
	if (key.charAt() == "$") return L[key.slice(0, 4)][1];
	else return L[key][1];
}
function iImage(key, sObj) {
	var obj;
	var gif;

	if (key) {
		if (key.charAt() == "$") {
			return iDynImage(key.slice(1, 4), key.slice(4));
		}
	} else if (typeof sObj == "string") sObj = { _id: "def", group: sObj, options: {} };
	obj = $data.shop[key];
	if (!obj && key) {
		var group = (typeof sObj == "string") ? sObj : sObj.group;
		obj = { _id: key, group: group, options: {} };
	}
	if (!obj) obj = sObj;
	gif = obj.options.hasOwnProperty('gif') ? ".gif" : ".png";
	if (obj.group.slice(0, 3) == "BDG") return "/img/kkutu/moremi/badge/" + obj._id + gif;
	if (obj.group.charAt(0) == 'M') {
		var g = obj.group.slice(1);
		if (g == "hs") {
			var HAND_ITEMS = ["bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice", "rio_seonghwa", "spanner"];
			var SHOES_ITEMS = ["black_oxford", "black_shoes", "brown_oxford", "loosesocks"];
			if (HAND_ITEMS.indexOf(obj._id) != -1) return "/img/kkutu/moremi/hand/" + obj._id + gif;
			if (SHOES_ITEMS.indexOf(obj._id) != -1) return "/img/kkutu/moremi/shoes/" + obj._id + gif;
		}
		return "/img/kkutu/moremi/" + g + "/" + obj._id + gif;
	}
	// Fallback for raw group names (head, eye, etc.)
	if (["head", "eye", "mouth", "skin", "back", "clothes", "fly", "badge", "hs"].indexOf(obj.group) != -1) {
		if (obj.group == "hs") {
			var HAND_ITEMS = ["bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice", "rio_seonghwa", "spanner"];
			var SHOES_ITEMS = ["black_oxford", "black_shoes", "brown_oxford", "loosesocks"];
			if (HAND_ITEMS.indexOf(obj._id) != -1) return "/img/kkutu/moremi/hand/" + obj._id + gif;
			if (SHOES_ITEMS.indexOf(obj._id) != -1) return "/img/kkutu/moremi/shoes/" + obj._id + gif;
		}
		return "/img/kkutu/moremi/" + obj.group + "/" + obj._id + gif;
	}
	return "/img/kkutu/shop/" + obj._id + ".png";
}
function iDynImage(group, data) {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext('2d');
	var i;

	canvas.width = canvas.height = 50;
	ctx.font = "24px NBGothic";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	switch (group) {
		case 'WPC':
		case 'WPB':
		case 'WPA':
			i = ['WPC', 'WPB', 'WPA'].indexOf(group);
			ctx.beginPath();
			ctx.arc(25, 25, 25, 0, 2 * Math.PI);
			ctx.fillStyle = ["#DDDDDD", "#A6C5FF", "#FFEF31"][i];
			ctx.fill();
			ctx.fillStyle = ["#000000", "#4465C3", "#E69D12"][i];
			ctx.fillText(data, 25, 25);
			break;
		default:
	}
	return canvas.toDataURL();
}
function queueObtain(data) {
	if ($stage.dialog.obtain.is(':visible')) {
		$data._obtain.push(data);
	} else {
		drawObtain(data);
		showDialog($stage.dialog.obtain, true);
	}
}
function drawObtain(data) {
	playSound('success');
	$("#obtain-image").css('background-image', "url(" + iImage(data.key) + ")");
	$("#obtain-name").html(iName(data.key));
}
function renderMoremi(target, equip) {
	var $obj = $(target).empty();
	var LR = { 'Mlhand': "Mhand", 'Mrhand': "Mhand" };
	var i, key;

	if (!equip) equip = {};
	else equip = $.extend({}, equip); // Create a shallow copy to prevent mutation

	// Easter Egg for 'nya' language
	var HAMSTER_HEAD_ITEMS = ['hamster_G', 'hamster_O'];
	var savedLang = localStorage.getItem('kkutu_lang');
	var savedVolume = loadVolumeSettings();
	var easterEggDisabled = savedVolume.noEasterEgg === true;
	var showCatEars = false;

	if (!easterEggDisabled && savedLang === 'nya') {
		if (HAMSTER_HEAD_ITEMS.indexOf(equip['Mhead']) != -1) {
			equip['Mhead'] = 'nekomimi';
		} else {
			showCatEars = true;
		}
	}

	// Easter Egg for 'troll' sound pack
	var showTrollFace = !easterEggDisabled && savedVolume.soundPack === '병맛';
	if (showTrollFace) {
		equip['Meye'] = 'hidden_eye';
		equip['Mmouth'] = 'nocomment';
	}

	// Random Moremi Item (Drug Mode) Logic Removed - Handled in Interval


	for (i in MOREMI_PART) {
		key = 'M' + MOREMI_PART[i];

		$obj.append($("<img>")
			.addClass("moremies moremi-" + key.slice(1))
			.attr('src', iImage(equip[key], LR[key] || key))
			.css({ 'width': "100%", 'height': "100%" })
		);
		if (key == 'Mhead' && showCatEars) {
			$obj.append($("<img>")
				.addClass("moremies moremi-catears")
				.attr('src', iImage('nekomimi', 'Mhead'))
				.css({ 'width': "100%", 'height': "100%" })
			);
		}
	}
	if (key = equip['BDG']) {
		$obj.append($("<img>")
			.addClass("moremies moremi-badge")
			.attr('src', iImage(key))
			.css({ 'width': "100%", 'height': "100%" })
		);
	}
	$obj.children(".moremi-back").after($("<img>").addClass("moremies moremi-body")
		.attr('src', equip.robot ? "/img/kkutu/moremi/robot.png" : "/img/kkutu/moremi/body.png")
		.css({ 'width': "100%", 'height': "100%" })
	);
	$obj.children(".moremi-rhand").css('transform', "scaleX(-1)");

	if (showTrollFace) {
		$obj.append($("<img>")
			.addClass("moremies moremi-trollface")
			.attr('src', iImage('troll', 'Mclothes'))
			.css({ 'width': "100%", 'height': "100%" })
		);
	}
}
function commify(val) {
	var tester = /(^[+-]?\d+)(\d{3})/;

	if (val === null) return "?";

	val = val.toString();
	while (tester.test(val)) val = val.replace(tester, "$1,$2");

	return val;
}
function setLocation(place) {
	if (place) location.hash = "#" + place;
	else location.hash = "";
}
function fail(code) {
	return showAlert(L['error_' + code]);
}
function nickCooldownMessage(remaining) {
	var totalMinutes = Math.max(1, Math.ceil(remaining / 60000));
	var hours = Math.floor(totalMinutes / 60);
	var minutes = totalMinutes % 60;

	return L.error_457.replace("{V1}", hours).replace("{V2}", minutes);
}
function yell(msg) {
	$stage.yell.show().css('opacity', 1).text(msg);
	addTimeout(function () {
		$stage.yell.animate({ 'opacity': 0 }, 3000);
		addTimeout(function () {
			$stage.yell.hide();
		}, 3000);
	}, 1000);
}

// Override playSound for Random Type Sound (Drg Mode)
(function () {
	var checkAndOverride = function () {
		if (typeof playSound === 'function' && !playSound._isOverridden) {
			var originalPlaySound = playSound;
			window.playSound = function (id, loop) {
				var result = originalPlaySound(id, loop);

				// Random Type Sound Logic
				if ($data.room && $data.room.opts && $data.room.opts.drg) {
					var triggers = ['chat', 'Al', 'fail', 'success'];
					var isTrigger = false;

					if (triggers.indexOf(id) >= 0) isTrigger = true;
					// Check As0 ~ As10
					else if (typeof id === 'string' && id.indexOf('As') === 0) {
						var num = parseInt(id.substring(2));
						if (!isNaN(num) && num >= 0 && num <= 10) isTrigger = true;
					}

					if (isTrigger) {
						if (Math.random() < 0.20) {
							var r = Math.floor(Math.random() * 30) + 1;
							try {
								var audio = new Audio('/media/common/' + r + '.mp3');
								audio.volume = $data.muteEff ? 0 : (($data.EffectVolume !== undefined) ? $data.EffectVolume : 0.5);
								audio.play().catch(function (e) { });
							} catch (e) { }
						}
					}
				}
				return result;
			};
			window.playSound._isOverridden = true;
		}
	};

	checkAndOverride();
	setTimeout(checkAndOverride, 100);
	setTimeout(checkAndOverride, 1000);
})();