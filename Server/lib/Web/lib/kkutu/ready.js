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

$(document).ready(function () {
	// 언어 설정 확인 및 리다이렉트
	try {
		var savedLang = localStorage.getItem('kkutu_lang');
		var match = location.href.match(/[?&]locale=([^&#]+)/);
		var urlLang = match ? match[1] : null;
		var currentLang = urlLang || "ko_KR";

		// localStorage에 저장된 언어가 없으면 현재 URL의 언어를 저장
		if (!savedLang && urlLang) {
			localStorage.setItem('kkutu_lang', urlLang);
			savedLang = urlLang;
		}

		if (savedLang && savedLang !== currentLang) {
			// URL에 locale 파라미터가 없거나 다른 경우 리다이렉트
			// 단, 사용자가 명시적으로 URL을 변경한 경우는 제외해야 하지만,
			// 여기서는 저장된 설정을 우선시하여 리다이렉트 (설정에서 언어를 바꾸면 저장되므로)
			var search = location.search;
			if (search.indexOf('locale=') >= 0) {
				search = search.replace(/locale=[^&]+/, 'locale=' + savedLang);
			} else {
				search = search + (search ? '&' : '?') + 'locale=' + savedLang;
			}
			location.replace(location.pathname + search);
			return;
		}
	} catch (e) {
	}

	var i;

	$data.PUBLIC = $("#PUBLIC").html() == "true";
	$data.URL = $("#URL").html();
	$data.ROOM_PORT = $("#ROOM_PORT").html();
	$data.version = $("#version").html();
	$data.NICKNAME_LIMIT = JSON.parse($("body #NICKNAME_LIMIT").text() || "{}");
	if ($data.NICKNAME_LIMIT.REGEX) $data.NICKNAME_LIMIT.REGEX = new RegExp($data.NICKNAME_LIMIT.REGEX[0], $data.NICKNAME_LIMIT.REGEX[1]);
	var serverMatch = location.href.match(/[?&]server=(\d+)/);
	$data.server = serverMatch ? serverMatch[1] : null;
	$data.shop = {};
	$data._okg = 0;
	$data._playTime = 0;
	$data._kd = "";
	$data._timers = [];
	$data._obtain = [];
	$data._wblock = {};
	$data._shut = {};
	$data.usersR = {};
	EXP.push(getRequiredScore(1));
	for (i = 2; i < MAX_LEVEL; i++) {
		EXP.push(EXP[i - 2] + getRequiredScore(i));
	}
	EXP[MAX_LEVEL - 1] = Infinity;
	EXP.push(Infinity);
	$stage = {
		loading: $("#Loading"),
		nickBlockOverlay: $("#NickBlockOverlay"),
		lobby: {
			userListTitle: $(".UserListBox .product-title"),
			userList: $(".UserListBox .product-body"),
			roomListTitle: $(".RoomListBox .product-title"),
			roomList: $(".RoomListBox .product-body"),
			createBanner: $("<div>").addClass("rooms-item rooms-create").append($("<div>").html(L['newRoom']))
		},
		chat: $("#Chat"),
		chatLog: $("#chat-log-board"),
		talk: $("#Talk"),
		chatBtn: $("#ChatBtn"),
		menu: {
			help: $("#HelpBtn"),
			setting: $("#SettingBtn"),
			community: $("#CommunityBtn"),
			newRoom: $("#NewRoomBtn"),
			setRoom: $("#SetRoomBtn"),
			quickRoom: $("#QuickRoomBtn"),
			spectate: $("#SpectateBtn"),
			shop: $("#ShopBtn"),
			dict: $("#DictionaryBtn"),
			wordPlus: $("#WordPlusBtn"),
			invite: $("#InviteBtn"),
			practice: $("#PracticeBtn"),
			ready: $("#ReadyBtn"),
			start: $("#StartBtn"),
			exit: $("#ExitBtn"),
			notice: $("#NoticeBtn"),
			replay: $("#ReplayBtn"),
			leaderboard: $("#LeaderboardBtn"),
			userList: $("#UserListBtn"),
			exchange: $("#ExchangeBtn")
		},
		dialog: {
			setting: $("#SettingDiag"),
			settingServer: $("#setting-server"),
			settingOK: $("#setting-ok"),
			theme: $("#ThemeDiag"),
			themePreviewLight: $("#theme-preview-light"),
			themePreviewDark: $("#theme-preview-dark"),
			themePreset: $("#theme-preset"),
			themeCPrimary: $("#theme-c-primary"),
			themeCPrimaryHex: $("#theme-c-primary-hex"),
			themeCMedium: $("#theme-c-medium"),
			themeCMediumHex: $("#theme-c-medium-hex"),
			themeCLight: $("#theme-c-light"),
			themeCLightHex: $("#theme-c-light-hex"),
			themeCDark: $("#theme-c-dark"),
			themeCDarkHex: $("#theme-c-dark-hex"),
			themeCode: $("#theme-code"),
			themeCodeCopy: $("#theme-code-copy"),
			themeContrastWarning: $("#theme-contrast-warning"),
			themeLoad: $("#theme-load"),
			themeCancel: $("#theme-cancel"),
			themeOK: $("#theme-ok"),
			themeSettingEdit: $("#theme-setting-edit"),
			themePresetReset: $("#theme-preset-reset"),
			community: $("#CommunityDiag"),
			commFriends: $("#comm-friends"),
			commFriendAdd: $("#comm-friend-add"),
			room: $("#RoomDiag"),
			roomOK: $("#room-ok"),
			quick: $("#QuickDiag"),
			quickOK: $("#quick-ok"),
			result: $("#ResultDiag"),
			resultOK: $("#result-ok"),
			resultSave: $("#result-save"),
			practice: $("#PracticeDiag"),
			practiceOK: $("#practice-ok"),
			dict: $("#DictionaryDiag"),
			dictInjeong: $("#dict-injeong"),
			dictSearch: $("#dict-search"),
			wordPlus: $("#WordPlusDiag"),
			wordPlusOK: $("#wp-ok"),
			invite: $("#InviteDiag"),
			inviteList: $(".invite-board"),
			inviteRobot: $("#invite-robot"),
			roomInfo: $("#RoomInfoDiag"),
			roomInfoJoin: $("#room-info-join"),
			profile: $("#ProfileDiag"),
			profileShut: $("#profile-shut"),
			profileHandover: $("#profile-handover"),
			profileKick: $("#profile-kick"),
			profileLevel: $("#profile-level"),
			profileDress: $("#profile-dress"),
			profileWhisper: $("#profile-whisper"),
			profileReport: $("#profile-report"),
			profileFriendAdd: $("#profile-friend-add"),
			report: $("#ReportDiag"),
			reportTarget: $("#report-target"),
			reportReason: $("#report-reason"),
			reportDetail: $("#report-detail"),
			reportSubmit: $("#report-submit"),
			kickVote: $("#KickVoteDiag"),
			kickVoteY: $("#kick-vote-yes"),
			kickVoteN: $("#kick-vote-no"),
			afkWarn: $("#AfkWarnDiag"),
			afkWarnOk: $("#afk-warn-ok"),
			purchase: $("#PurchaseDiag"),
			purchaseOK: $("#purchase-ok"),
			purchaseNO: $("#purchase-no"),
			replay: $("#ReplayDiag"),
			replayView: $("#replay-view"),
			leaderboard: $("#LeaderboardDiag"),
			lbTable: $("#ranking tbody"),
			lbTabs: $(".ranking-tab"),
			lbScoreHeader: $("#ranking thead td:last-child"),
			lbPage: $("#lb-page"),
			lbNext: $("#lb-next"),
			lbMe: $("#lb-me"),
			lbPrev: $("#lb-prev"),
			dress: $("#DressDiag"),
			dressOK: $("#dress-ok"),
			charFactory: $("#CharFactoryDiag"),
			cfCompose: $("#cf-compose"),
			craftWorkshop: $("#CraftingDiag"),
			craftCompose: $("#craft-compose"),
			exchangeWorkshop: $("#ExchangeDiag"),
			injPick: $("#InjPickDiag"),
			injPickAll: $("#injpick-all"),
			injPickNo: $("#injpick-no"),
			injPickOK: $("#injpick-ok"),
			quizPick: $("#QuizPickDiag"),
			quizPickAll: $("#quizpick-all"),
			quizPickNo: $("#quizpick-no"),
			quizPickOK: $("#quizpick-ok"),
			chatLog: $("#ChatLogDiag"),
			obtain: $("#ObtainDiag"),
			obtainOK: $("#obtain-ok"),
			help: $("#HelpDiag"),
			confirm: $("#ConfirmDiag"),
			confirmText: $("#confirm-text"),
			confirmOK: $("#confirm-ok"),
			confirmNo: $("#confirm-no"),
			alert: $("#AlertDiag"),
			alertText: $("#alert-text"),
			alertOK: $("#alert-ok"),
			input: $("#InputDiag"),
			inputText: $("#input-text"),
			inputInput: $("#input-input"),
			inputOK: $("#input-ok"),
			inputNo: $("#input-no"),
			nickSetup: $("#NickSetupDiag"),
			nickSetupInput: $("#nickSetup-input"),
			nickSetupError: $("#nickSetup-error"),
			nickSetupOk: $("#nickSetup-ok"),
			viewAllRules: $("#ViewAllRulesDiag"),
			viewAllRulesOK: $("#view-all-ok"),
			userListDiag: $("#UserListDiag"),
			userListBoard: $(".userlist-board")
		},
		box: {
			chat: $(".ChatBox"),
			userList: $(".UserListBox"),
			roomList: $(".RoomListBox"),
			shop: $(".ShopBox"),
			room: $(".RoomBox"),
			game: $(".GameBox"),
			me: $(".MeBox")
		},
		game: {
			display: $(".jjo-display"),
			hints: $(".GameBox .hints"),
			cwcmd: $(".GameBox .cwcmd"),
			bb: $(".GameBox .bb"),
			items: $(".GameBox .items"),
			chain: $(".GameBox .chain"),
			round: $(".rounds"),
			here: $(".game-input").hide(),
			hereText: $("#game-input"),
			history: $(".history"),
			roundBar: $(".jjo-round-time .graph-bar"),
			turnBar: $(".jjo-turn-time .graph-bar")
		},
		yell: $("#Yell").hide(),
		balloons: $("#Balloons")
	};
	if (_WebSocket == undefined) {
		loading(L['websocketUnsupport']);
		showAlert(L['websocketUnsupport']);
		return;
	}
	// 레벨 아이콘 팩 목록 로드
	$.get("/levelpacks", function (levelPacks) {
		var $lpSel = $("#level-pack");
		levelPacks.forEach(function (name) {
			$lpSel.append($("<option>").val(name).text(name));
		});
	});

	$.get("/soundpacks", function (packs) {
		var $sel = $("#sound-pack");
		packs.forEach(function (pack) {
			$sel.append($("<option>").val(pack.name).text(pack.name));
		});

		var cookieVal = $.cookie('kks');
		try {
			$data.opts = JSON.parse(decodeURIComponent(cookieVal));
		} catch (e) {
			try {
				$data.opts = JSON.parse(cookieVal);
			} catch (e2) {
				$data.opts = {};
			}
		}
		if (!$data.opts) $data.opts = {};

		// 간단 방 보기 기본값 설정
		if ($data.opts.srv === undefined) $data.opts.srv = true;

		// localStorage에서 볼륨 설정 먼저 로드 (사운드 로드 전에 적용)
		var savedSettings = loadVolumeSettings();
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
		$data.muteBGM = savedSettings.bgmMute !== null ? savedSettings.bgmMute : ($data.opts.mb || false);
		$data.muteEff = savedSettings.effectMute !== null ? savedSettings.effectMute : ($data.opts.me || false);

		// beat 모드 초기화 (저장된 설정 기반)
		var initPackName = savedSettings.soundPack !== null ? savedSettings.soundPack : ($data.opts.sp || '');
		ACTIVE_BEAT = resolveActiveBeat(savedSettings.beatMode || 'auto', initPackName);

		// 레벨 아이콘 팩 설정 적용
		var currentLevelPack = savedSettings.levelPack !== null ? savedSettings.levelPack : ($data.opts && $data.opts.lp);
		$data.levelPackUrl = currentLevelPack ? '/img/kkutu/lv/' + currentLevelPack + '.png' : '/img/kkutu/lv/newlv.png';

		// 로비 BGM 설정 가져오기
		$.get("/bgm", function (bgms) {
			var $bgmSel = $("#lobby-bgm");
			bgms.forEach(function (bgm) {
				$bgmSel.append($("<option>").val(bgm).text(bgm.replace(".mp3", "")));
			});

			// 사운드 리스트 초기화 후 로드
			var currentPackName = savedSettings.soundPack !== null ? savedSettings.soundPack : ($data.opts && $data.opts.sp);
			var currentPack = packs.find(function (p) { return p.name === currentPackName; });
			var packFiles = currentPack ? currentPack.files : [];

			$data._soundList = [
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
				{ key: "KO", value: "/media/common/ko.mp3" },
				{ key: "attack", value: "/media/common/attack.mp3" },
				{ key: "defence", value: "/media/common/defence.mp3" },
			];
			for (i = 0; i <= 10; i++) $data._soundList.push(
				{ key: "T" + i, value: "/media/kkutu/T" + i + ".mp3" },
				{ key: "K" + i, value: "/media/kkutu/K" + i + ".mp3" },
				{ key: "As" + i, value: "/media/kkutu/As" + i + ".mp3" }
			);

			if (currentPack) {
				$data._soundList.forEach(function (s) {
					var filename = s.value.split('/').pop();
					if (packFiles.indexOf(filename) != -1) {
						s.value = "/media/kkutu/" + currentPack.name + "/" + filename;
					}
				});
			}

			// 로비 BGM 설정 적용
			if (savedSettings.lobbyBGM) {
				var lobbySound = $data._soundList.find(function (s) { return s.key === "lobby"; });
				if (lobbySound) {
					lobbySound.value = "/media/bgm/" + savedSettings.lobbyBGM;
				}
			}

			loadSounds($data._soundList, function () {
				processShop(connect);
			});
			delete $data._soundList;
		});
	});

	MOREMI_PART = $("#MOREMI_PART").html().split(',');
	AVAIL_EQUIP = $("#AVAIL_EQUIP").html().split(',');
	RULE = JSON.parse($("#RULE").html());
	OPTIONS = JSON.parse($("#OPTIONS").html());
	GAME_CATEGORIES = JSON.parse($("#GAME_CATEGORIES").html());
	KO_INJEONG = JSON.parse($("#KO_INJEONG").html() || "[]");
	EN_INJEONG = JSON.parse($("#EN_INJEONG").html() || "[]");
	JA_INJEONG = JSON.parse($("#JA_INJEONG").html() || "[]");
	MODE = Object.keys(RULE);
	mobile = $("#mobile").html() == "true";
	if (mobile) TICK = 60;
	$data.NICKNAME_LIMIT = JSON.parse($("#NICKNAME_LIMIT").html() || "{}");
	if ($data.NICKNAME_LIMIT.REGEX) $data.NICKNAME_LIMIT.REGEX = new RegExp($data.NICKNAME_LIMIT.REGEX[0], $data.NICKNAME_LIMIT.REGEX[1]);
	$data._timePercent = false ? function () {
		return $data._turnTime / $data.turnTime * 100 + "%";
	} : function () {
		var pos = $data._turnSound.audio ? $data._turnSound.audio.currentTime : (audioContext.currentTime - $data._turnSound.startedAt);

		return (100 - pos / $data.turnTime * 100000) + "%";
	};
	$data.setRoom = function (id, data) {
		var isLobby = getOnly() == "for-lobby";

		if (data == null) {
			delete $data.rooms[id];
			if (isLobby) $("#room-" + id).remove();
		} else {
			// $data.rooms[id] = data;
			if (isLobby && !$data.rooms[id]) $stage.lobby.roomList.append($("<div>").attr('id', "room-" + id));
			$data.rooms[id] = data;
			if (isLobby) $("#room-" + id).replaceWith(roomListBar(data));
		}
		updateRoomList();
	};
	$data.setUser = function (id, data) {
		var only = getOnly();
		var needed = only == "for-lobby" || only == "for-master";
		var $obj;

		if ($data._replay) {
			$rec.users[id] = data;
			return;
		}
		if (data == null) {
			delete $data.users[id];
			if (needed) $("#users-item-" + id + ",#invite-item-" + id).remove();
		} else {
			if (needed && !$data.users[id]) {
				$obj = userListBar(data, only == "for-master");

				if (only == "for-master") $stage.dialog.inviteList.append($obj);
				else $stage.lobby.userList.append($obj);
			}
			var prev = $data.users[id];
			if (prev && prev.data && prev.data.record && data.data && !data.data.record) {
				data.data = $.extend({}, prev.data, data.data);
			}
			$data.users[id] = data;
			if (needed) {
				if ($obj) $("#" + $obj.attr('id')).replaceWith($obj);
				else $("#" + ((only == "for-lobby") ? "users-item-" : "invite-item") + id).replaceWith(userListBar(data, only == "for-master"));
			}
		}
	};

	// 객체 설정
	/*addTimeout(function(){
		$("#intro-start").hide();
		$("#intro").show();
	}, 1400);*/
	$(document).on('paste', function (e) {
		if ($data.room) if ($data.room.gaming) {
			e.preventDefault();
			return false;
		}
	});
	$stage.talk.on('drop', function (e) {
		if ($data.room) if ($data.room.gaming) {
			e.preventDefault();
			return false;
		}
	});

	$(".dialog-head .dialog-title").on('mousedown', function (e) {
		var $pd = $(e.currentTarget).parents(".dialog");

		$(".dialog-front").removeClass("dialog-front");
		$pd.addClass("dialog-front");
		startDrag($pd, e.pageX, e.pageY);
	}).on('mouseup', function (e) {
		stopDrag();
	});
	// addInterval(checkInput, 1);
	$stage.chatBtn.on('click', function (e) {
		checkInput();

		// hereText를 메인 입력창으로 사용 (talk와 동기화됨)
		var value = $stage.game.hereText.val() || $stage.talk.val();
		if (!value) return;
		var o = { value: value.trim() };
		if (o.value[0] == "/") {
			o.cmd = o.value.split(" ");
			runCommand(o.cmd);
		} else {
			if ($stage.game.here.is(":visible") || $data._relay) {
				o.relay = true;
				var _mode = $data.room && MODE[$data.room.mode];
				if (_mode === 'KWR' || _mode === 'EWR') {
					o.strategy = $lib.Raingame._strategy || 0;
				}
			}
			send('talk', o);
		}
		if ($data._whisper) {
			$stage.talk.val("/e " + $data._whisper + " ");
			$stage.game.hereText.val("/e " + $data._whisper + " ");
			delete $data._whisper;
		} else {
			$stage.talk.val("");
			$stage.game.hereText.val("");
		}
	}).hotkey($stage.talk, 13).hotkey($stage.game.hereText, 13);
	// 십자말풀이 입력창 처리
	(function () {
		var $cwInput = $("#cw-q-input");
		var cwIsComposing = false;

		// 정답 제출 함수
		function submitCwAnswer() {
			var value = $cwInput.val();
			if (!value) return;
			var o = { relay: true, data: $data._sel, value: value };
			send('talk', o);
			$cwInput.val("");
			// 제출 후에도 포커스 유지 (오답이면 계속 입력 가능)
			$cwInput.focus();
		}

		// IME composition 상태 추적
		$cwInput.on('compositionstart', function () {
			cwIsComposing = true;
		});
		$cwInput.on('compositionend', function () {
			cwIsComposing = false;
		});

		// keydown 엔터 처리
		$cwInput.on('keydown', function (e) {
			if (!cwIsComposing && (e.keyCode == 13 || e.key == 'Enter') && !e.shiftKey) {
				e.preventDefault();
				e.stopPropagation();
				submitCwAnswer();
				return false;
			}
		});

		// beforeinput 폴백 (모바일)
		if ($cwInput[0]) {
			$cwInput[0].addEventListener('beforeinput', function (e) {
				if (e.inputType === 'insertLineBreak') {
					e.preventDefault();
					submitCwAnswer();
				}
			});
		}

		// input 폴백 (개행 문자 감지)
		$cwInput.on('input.newline', function () {
			var val = $(this).val();
			if (val.indexOf('\n') !== -1 || val.indexOf('\r') !== -1) {
				$(this).val(val.replace(/[\r\n]/g, ''));
				submitCwAnswer();
			}
		});

		// 보드(칸) 및 cwcmd 영역 밖을 클릭/터치하면 선택 해제
		// 모바일에서는 blur 시 relatedTarget이 비어있는 경우가 많아 focusout으로는
		// "입력창을 누른 것"과 "다른 곳을 누른 것"을 구분할 수 없다.
		// 대신 mousedown/touchstart 시점의 실제 클릭 대상(e.target)으로 안/밖을 판정한다.
		$(document).on('mousedown touchstart', function (e) {
			if (!$stage.game.cwcmd.is(':visible')) return;
			if ($stage.game.cwcmd.css('opacity') == 0) return;
			var $target = $(e.target);
			if ($target.closest($stage.game.cwcmd).length > 0) return;
			if ($target.closest($stage.game.display).length > 0) return;
			$data._sel = null;
			$(".cw-q-body").empty();
			$stage.game.cwcmd.css('opacity', 0);
			if ($data._boards) $lib.Crossword.drawDisplay();
			else if ($data._board) $lib.Landgrab.drawDisplay();
		});

		// HTML 속성 설정
		$cwInput.attr('enterkeyhint', 'send');
	})();
	$("#room-limit").on('change', function (e) {
		var $target = $(e.currentTarget);
		var value = $target.val();

		if (value < 2 || value > 12) {
			$target.css('color', "#FF4444");
		} else {
			$target.css('color', "");
		}
	});
	window.updateRoundColor = function () {
		var $target = $("#room-round");
		var value = $target.val();
		var currentRule = RULE[MODE[$("#room-mode").val()]];
		var isCoopMode = currentRule && currentRule.coop;
		var isQuizMode = currentRule && (currentRule.rule === "Jaqwi" || currentRule.rule === "Quiz");
		var outOfRange = isCoopMode ? (value < 5 || value > 50) : isQuizMode ? (value < 1 || value > 20) : (value < 1 || value > 10);

		if (outOfRange) {
			$target.css('color', "#FF4444");
		} else {
			$target.css('color', "");
		}
	};
	$("#room-round").on('change', window.updateRoundColor);
	$stage.game.here.on('click', function (e) {
		// 모바일에서도 게임 입력창 클릭 시 포커스
		if (mobile) {
			$stage.game.hereText.focus();
		} else {
			$stage.talk.focus();
		}
	});
	// 일본어(JSH/JAP) 방일 때만 로마자를 실시간으로 히라가나로 변환 (WanaKana, IMEMode: true — 일본어 IME 조합 중에도 자연스럽게 동작)
	// 커서 위치 보정까지는 하지 않음 — 변환 후 커서가 끝으로 이동하는 정도는 v1에서 감수 (알려진 제약)
	function isJaRoom() {
		var rule = $data.room ? RULE[MODE[$data.room.mode]] : null;
		if (!($data.room && $data.room.gaming && rule && rule.lang === 'ja')) return false;
		return loadVolumeSettings().jaAutoConvert !== false; // 설정에서 끄지 않았으면 기본 켜짐
	}
	// 일부 기호는 WanaKana가 일본어 문장부호로 자동 변환하므로, 원래 기호 그대로 유지되도록 예외 처리
	var WANAKANA_SYMBOL_PASSTHROUGH = { '[': '[', ']': ']', '.': '.', ',': ',', '?': '?', ':': ':', '/': '/', '{': '{', '}': '}', '(': '(', ')': ')', '!': '!', '~': '~' };
	function applyWanaKana($input) {
		if (!isJaRoom() || typeof wanakana === 'undefined') return;
		var v = $input.val();
		var converted = wanakana.toKana(v, { IMEMode: true, customKanaMapping: WANAKANA_SYMBOL_PASSTHROUGH });
		if (converted !== v) $input.val(converted);
		// 변환으로 늘어난 글자수를 checkInput의 붙여넣기 감지 기준선에도 반영 (그래야 다음 입력에서 오탐 안 함)
		$data._kd = $input.val();
	}
	// ===== 두벌식 한글 → 히라가나 변환 테이블 (일본어 모드 전용) =====
	// 서버(classic-util.js의 normalizeJaText/convertHangulToKana)와 동일한 표를 사용한다.
	// 표를 고칠 때는 반드시 양쪽을 같이 수정할 것.
	var HG_CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
	var HG_JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
	var HG_JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
	// 유니코드 종성 인덱스 그대로 조회해야 하므로 HG_JONG은 반드시 28칸 전체를 유지한다(축약 금지).
	// 비음(ㄴㅁㅇ)→ん, ㄱㄷㅅㅆ→っ, 그 외 받침은 미변환 — 정밀 표기법이 아닌 게임 매칭용 근사치.
	var HG_JONG_NASAL = { 'ㄴ': true, 'ㅁ': true, 'ㅇ': true };
	var HG_JONG_SOKUON = { 'ㄱ': true, 'ㄷ': true, 'ㅅ': true, 'ㅆ': true };
	function decomposeHangul(ch) {
		var code = ch.charCodeAt(0) - 0xAC00;
		if (code < 0 || code > 11171) return null;
		return {
			cho: HG_CHO[Math.floor(code / 588)],
			jung: HG_JUNG[Math.floor((code % 588) / 28)],
			jong: HG_JONG[code % 28]
		};
	}
	var HG_CHO_TO_ROW = {
		'ㄱ': 'ga', 'ㅋ': 'ka', 'ㄲ': 'ka',
		'ㄴ': 'na', 'ㄷ': 'da', 'ㄹ': 'ra', 'ㅁ': 'ma',
		'ㅂ': 'ba', 'ㅍ': 'pa', 'ㅃ': 'pa',
		'ㅅ': 'sa', 'ㅆ': 'sa',
		'ㅇ': 'a0',
		'ㅈ': 'ja',
		'ㅊ': 'ta_ch', 'ㅉ': 'ta_ch',
		'ㅌ': 'ta_t',
		'ㄸ': 'ta_t',
		'ㅎ': 'ha'
	};
	// ㅐ/ㅔ, ㅒ/ㅖ, ㅙ/ㅚ/ㅞ는 현대 한국어 발음이 사실상 합류되어 있어 각각 같은 목표음으로 묶는다.
	// ㅢ는 비어두 위치에서 흔히 [i]로 약화 발음되므로 'i'로 근사.
	var HG_JUNG_TO_DAN = {
		'ㅏ': 'a', 'ㅐ': 'e', 'ㅔ': 'e', 'ㅣ': 'i', 'ㅓ': 'o', 'ㅗ': 'o', 'ㅜ': 'u', 'ㅡ': 'u',
		'ㅑ': 'ya', 'ㅛ': 'yo', 'ㅠ': 'yu', 'ㅕ': 'yo', 'ㅒ': 'ye', 'ㅖ': 'ye',
		'ㅘ': 'wa', 'ㅟ': 'wi', 'ㅞ': 'we', 'ㅝ': 'wo', 'ㅙ': 'we', 'ㅚ': 'we', 'ㅢ': 'i'
	};
	var ROW_TABLE = {
		ka: { a: 'か', i: 'き', u: 'く', e: 'け', o: 'こ' },
		ga: { a: 'が', i: 'ぎ', u: 'ぐ', e: 'げ', o: 'ご' },
		sa: { a: 'さ', i: 'し', u: 'す', e: 'せ', o: 'そ' },
		ja: { a: 'ざ', i: 'じ', u: 'ず', e: 'ぜ', o: 'ぞ' },
		na: { a: 'な', i: 'に', u: 'ぬ', e: 'ね', o: 'の' },
		ha: { a: 'は', i: 'ひ', u: 'ふ', e: 'へ', o: 'ほ' },
		ba: { a: 'ば', i: 'び', u: 'ぶ', e: 'べ', o: 'ぼ' },
		pa: { a: 'ぱ', i: 'ぴ', u: 'ぷ', e: 'ぺ', o: 'ぽ' },
		ma: { a: 'ま', i: 'み', u: 'む', e: 'め', o: 'も' },
		ra: { a: 'ら', i: 'り', u: 'る', e: 'れ', o: 'ろ' },
		a0: { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' }
	};
	// 완성형 한글 음절 1개를 히라가나로. 매핑에 없는 조합은 null 반환 → 원문 유지
	function hangulSyllableToKana(ch) {
		var d = decomposeHangul(ch);
		if (!d) return null;
		var row = HG_CHO_TO_ROW[d.cho];
		if (!row) return null;
		var dan = HG_JUNG_TO_DAN[d.jung];
		if (!dan) return null;

		var base = null;
		if (row === 'ta_t') {
			base = { a: 'た', e: 'て', o: 'と', i: 'てぃ', u: 'とぅ' }[dan] || null;
		} else if (row === 'da') {
			// ㄷ+ㅣ/ㅜ는 ぢ/づ 대신 でぃ/どぅ(외래어 표기용)로 배정 — ぢ/づ는 じ/ず와 발음이 같아(よつがな)
			// 지/주 입력으로도 도달 가능(서버 normalizeJaText의 JA_YOTSUGANA_FOLD가 매칭 키에서 접어줌).
			base = { a: 'だ', e: 'で', o: 'ど', i: 'でぃ', u: 'どぅ' }[dan] || null;
		} else if (row === 'ta_ch') {
			// ち/つ는 파찰음이라 단모음이어도 요음화된 형태로 표기(차→ちゃ, 체→ちぇ, 초→ちょ)
			base = {
				a: 'ちゃ', e: 'ちぇ', o: 'ちょ', i: 'ち', u: 'つ',
				ya: 'ちゃ', yu: 'ちゅ', yo: 'ちょ', ye: 'ちぇ',
				wi: 'つぃ', we: 'つぇ', wo: 'つぉ', wa: 'つぁ'
			}[dan] || null;
		} else {
			var r = ROW_TABLE[row];
			if (dan === 'a' || dan === 'i' || dan === 'u' || dan === 'e' || dan === 'o') {
				base = r[dan];
			} else if (dan === 'ya' || dan === 'yu' || dan === 'yo') {
				base = (row === 'a0')
					? { ya: 'や', yu: 'ゆ', yo: 'よ' }[dan]
					: r.i + { ya: 'ゃ', yu: 'ゅ', yo: 'ょ' }[dan];
			} else if (dan === 'ye') {
				base = (row === 'a0') ? 'いぇ' : r.i + 'ぇ';
			} else if (dan === 'wa') {
				base = (row === 'a0') ? 'わ' : (r.u + 'ぁ');
			} else {
				base = r.u + { wi: 'ぃ', we: 'ぇ', wo: 'ぉ' }[dan];
			}
		}
		if (base === null) return null;

		var suffix = '';
		if (d.jong) {
			if (HG_JONG_NASAL[d.jong]) suffix = 'ん';
			else if (HG_JONG_SOKUON[d.jong]) suffix = 'っ';
			else return null; // 미지원 받침: 음절 전체를 원문 그대로 유지
		}
		return base + suffix;
	}
	function convertHangulToKana(text) {
		if (!text) return text;
		var out = [];
		for (var i = 0; i < text.length; i++) {
			var kana = hangulSyllableToKana(text[i]);
			out.push(kana !== null ? kana : text[i]);
		}
		return out.join('');
	}
	function applyHangulToKana($input) {
		if (!isJaRoom()) return;
		var v = $input.val();
		var converted = convertHangulToKana(v);
		if (converted !== v) {
			$input.val(converted);
			// 크롬은 .val() 세팅 시 커서가 끝으로 이동하지만, 파이어폭스 모바일은 compositionend 처리 후
			// 비동기로 캐럿을 조합 전 오프셋으로 되돌려버려 커서가 중간에 남는 경우가 있음.
			// 다음 tick에 한 번 더 끝으로 보정해서 이를 이긴다.
			var el = $input[0];
			var end = converted.length;
			setTimeout(function () {
				if (el === document.activeElement) el.setSelectionRange(end, end);
			}, 0);
		}
		// 변환으로 늘어난 글자수를 checkInput의 붙여넣기 감지 기준선에도 반영 (그래야 다음 입력에서 오탐 안 함)
		$data._kd = $input.val();
	}
	// 양방향 실시간 입력 동기화
	$stage.talk.on('input', function (e) {
		if (checkInput($(this))) { $stage.game.hereText.val(""); return; }
		if (!(e.originalEvent && e.originalEvent.isComposing)) {
			applyWanaKana($(this));
			applyHangulToKana($(this));
		}
		$stage.game.hereText.val($stage.talk.val());
	});
	$stage.game.hereText.on('input', function (e) {
		if (checkInput($(this))) { $stage.talk.val(""); return; }
		if (!(e.originalEvent && e.originalEvent.isComposing)) {
			applyWanaKana($(this));
			applyHangulToKana($(this));
		}
		$stage.talk.val($stage.game.hereText.val());
	});
	// 한글 IME 조합이 끝나는 시점에 한글→가나 변환 실행 (조합 중에는 .val()을 건드리면 안 되므로 여기서만)
	$stage.talk.on('compositionend', function () {
		applyHangulToKana($(this));
		$stage.game.hereText.val($stage.talk.val());
	});
	$stage.game.hereText.on('compositionend', function () {
		applyHangulToKana($(this));
		$stage.talk.val($stage.game.hereText.val());
	});
	// 모바일 가상 키보드 엔터 제출 처리
	// hotkey가 keydown으로 엔터를 처리하지만, 모바일 IME에서는 keyCode가 229로 전달됨
	// 따라서 여러 폴백 방법으로 모바일 엔터를 감지
	// hereText와 talk 모두에 적용 (둘이 같은 입력란처럼 동작)

	// HTML 속성 설정 - 모바일 키보드에 "보내기" 버튼 표시
	$stage.game.hereText.attr('enterkeyhint', 'send');
	$stage.talk.attr('enterkeyhint', 'send');

	function setupMobileEnter($input) {
		var isComposing = false;

		// IME composition 상태 추적
		$input.on('compositionstart', function () {
			isComposing = true;
		});
		$input.on('compositionend', function (e) {
			isComposing = false;
			// composition 종료 후 값 확인 (개행 문자 감지)
			var val = $(this).val();
			if (val.indexOf('\n') !== -1 || val.indexOf('\r') !== -1) {
				$(this).val(val.replace(/[\r\n]/g, ''));
				syncInputs($(this));
				$stage.chatBtn.trigger('click');
			}
		});

		// keydown에서 엔터 감지 (IME 상태와 무관하게)
		$input.on('keydown.mobileEnter', function (e) {
			// Enter 키 (keyCode 13 또는 key 'Enter')
			// isComposing이 false일 때만 처리 (IME 입력 완료 후)
			if (!isComposing && (e.keyCode == 13 || e.key == 'Enter') && !e.shiftKey) {
				e.preventDefault();
				e.stopPropagation();
				$stage.chatBtn.trigger('click');
				return false;
			}
		});

		// beforeinput 이벤트 (모바일 가상 키보드 엔터 감지)
		if ($input[0]) {
			$input[0].addEventListener('beforeinput', function (e) {
				if (e.inputType === 'insertLineBreak') {
					e.preventDefault();
					$stage.chatBtn.trigger('click');
				}
			});
		}

		// input 이벤트에서 개행 문자 감지 (최종 폴백)
		$input.on('input.newline', function () {
			var val = $(this).val();
			if (val.indexOf('\n') !== -1 || val.indexOf('\r') !== -1) {
				$(this).val(val.replace(/[\r\n]/g, ''));
				syncInputs($(this));
				$stage.chatBtn.trigger('click');
			}
		});
	}

	// 입력 동기화 헬퍼
	function syncInputs($input) {
		if ($input.is($stage.game.hereText)) {
			$stage.talk.val($input.val());
		} else {
			$stage.game.hereText.val($input.val());
		}
	}

	setupMobileEnter($stage.game.hereText);
	setupMobileEnter($stage.talk);
	$(window).on('beforeunload', function (e) {
		if ($data.room) return L['sureExit'];
	});
	function startDrag($diag, sx, sy) {
		var pos = $diag.position();
		$(window).on('mousemove', function (e) {
			var dx = e.pageX - sx, dy = e.pageY - sy;

			$diag.css('left', pos.left + dx);
			$diag.css('top', pos.top + dy);
		});
	}
	function stopDrag($diag) {
		$(window).off('mousemove');
	}
	$(".result-me-gauge .graph-bar").addClass("result-me-before-bar");
	$(".result-me-gauge")
		.append($("<div>").addClass("graph-bar result-me-current-bar"))
		.append($("<div>").addClass("graph-bar result-me-bonus-bar"));
	// 메뉴 버튼
	for (i in $stage.dialog) {
		if ($stage.dialog[i].children(".dialog-head").hasClass("no-close")) continue;

		$stage.dialog[i].children(".dialog-head").append($("<div>").addClass("closeBtn").on('click', function (e) {
			$(e.currentTarget).parent().parent().hide();
		}).hotkey(false, 27));
	}
	$stage.menu.help.on('click', function (e) {
		$("#help-board").attr('src', "/help");
		showDialog($stage.dialog.help);
	});
	$stage.menu.setting.on('click', function (e) {
		// 설정 창을 열 때 현재 값으로 UI 업데이트
		var savedSettings = loadVolumeSettings();

		// 슬라이더 값 설정
		var bgmVol = savedSettings.bgmVolume !== null ? savedSettings.bgmVolume : $data.BGMVolume;
		var effVol = savedSettings.effectVolume !== null ? savedSettings.effectVolume : $data.EffectVolume;
		$(".bgmVolume").val((isFinite(bgmVol) ? bgmVol : 1) * 100);
		$(".effectVolume").val((isFinite(effVol) ? effVol : 1) * 100);

		// 음소거 체크박스 설정
		var bgmMute = savedSettings.bgmMute !== null ? savedSettings.bgmMute : $data.muteBGM;
		var effMute = savedSettings.effectMute !== null ? savedSettings.effectMute : $data.muteEff;
		$("#mute-bgm").prop('checked', bgmMute || false);
		$("#mute-effect").prop('checked', effMute || false);
		$(".bgmVolume").prop('disabled', bgmMute || false);
		$(".effectVolume").prop('disabled', effMute || false);

		// 사운드팩 선택 설정
		$("#sound-pack").val(savedSettings.soundPack || "");

		// 레벨 아이콘 팩 선택 설정
		$("#level-pack").val(savedSettings.levelPack || "");

		// 로비 BGM 선택 설정
		$("#lobby-bgm").val(savedSettings.lobbyBGM || "");

		// 규칙 카테고리 보기 설정
		$("#show-rule-category").prop('checked', ($data.opts && $data.opts.src !== undefined) ? $data.opts.src : true);

		// 간단 방 보기 설정
		$("#simple-room-view").prop('checked', ($data.opts && $data.opts.srv !== undefined) ? $data.opts.srv : true);

		// 욕 필터링 설정 (기본 켜짐)
		$("#no-filter").prop('checked', ($data.opts && $data.opts.nf !== undefined) ? $data.opts.nf : true);

		// 흔들림 없애기 설정 (기본 꺼짐)
		$("#no-shake").prop('checked', ($data.opts && $data.opts.ns === true));

		// 이스터에그 끄기 설정 (기본 꺼짐)
		$("#no-easter-egg").prop('checked', savedSettings.noEasterEgg === true);
		// 봇 설정 자동 적용 (기본 꺼짐)
		$("#ai-auto-apply").prop('checked', savedSettings.aiAutoApply === true);
		// 일본어 자동 변환 설정 (기본 켜짐)
		$("#ja-auto-convert").prop('checked', savedSettings.jaAutoConvert !== false);

		// 현재 로드된 언어 감지
		// L 객체로부터 실제 언어 감지 시도
		var detectedLang = null;
		try {
			// 한국어 체크
			if (L && L('language') === '한국어') detectedLang = 'ko_KR';
			else if (L && L('language') === 'English') detectedLang = 'en_US';
			else if (L && L('language') === '言語') detectedLang = 'ja_JP';
			else if (L && L('language') === '???') detectedLang = 'nya';
		} catch (e) { }

		// URL locale 파라미터 확인
		var match = location.href.match(/[?&]locale=([^&#]+)/);
		var pageLang = match ? match[1] : null;
		var savedLang = localStorage.getItem('kkutu_lang');

		// 우선순위: URL locale > 저장된 언어 > 감지된언어 > 한국어
		var currentLang = pageLang || savedLang || detectedLang || "ko_KR";
		$("#language-setting").val(currentLang);

		// 테마 설정
		$("#theme-setting").val(savedSettings.theme || 'blue');
		$data._themeSettingPrevValue = savedSettings.theme || 'blue';
		updateThemeSettingEditIcon();

		// 다크 모드 설정
		$("#dark-mode-setting").val(savedSettings.darkMode || 'light');

		// 비트 모드 설정
		$("#beat-setting").val(savedSettings.beatMode || 'auto');

		showDialog($stage.dialog.setting);
	});
	$stage.menu.community.on('click', function (e) {
		if ($data.guest) return fail(451);
		showDialog($stage.dialog.community);
	});
	$stage.dialog.commFriendAdd.on('click', function (e) {
		showPrompt(L['friendAddNotice'], "", function (input) {
			if (!input) return;
			var targetId = null;
			if ($data.users[input]) {
				targetId = input;
			} else {
				for (var uid in $data.users) {
					var u = $data.users[uid];
					if ((u.profile.title || u.profile.name) == input) {
						targetId = uid;
						break;
					}
				}
			}
			if (!targetId) return fail(450);

			send('friendAdd', { target: targetId }, true);
		});
	});
	$stage.menu.newRoom.on('click', function (e) {
		var $d;

		$stage.dialog.quick.hide();

		$data.typeRoom = 'enter';
		showDialog($d = $stage.dialog.room);
		$d.find(".dialog-title").html(L['newRoom']);
		$("#room-mode").trigger('change');
	});

	window.updateViewAllRulesBtn = function () {
		var count = 0;
		for (var i in OPTIONS) {
			var name = OPTIONS[i].name.toLowerCase();
			if (window.RULE_CHECKBOXES[name] && window.RULE_CHECKBOXES[name].first().is(':checked')) {
				count++;
			}
		}
		var baseText = L['viewAllRules'];
		if (count > 0) {
			$("#view-all-rules-btn").text(baseText + " (" + count + ")");
		} else {
			$("#view-all-rules-btn").text(baseText);
		}
	};

	window.RULE_CHECKBOXES = window.RULE_CHECKBOXES || {};
	for (var opt_i in OPTIONS) {
		var name = OPTIONS[opt_i].name.toLowerCase();
		window.RULE_CHECKBOXES[name] = $('#room-' + name + ', #room-flat-' + name + ', #room-simple-' + name + ', #view-all-' + name + ', #view-all-flat-' + name);
		window.RULE_CHECKBOXES[name].data('opt-name', name);

		window.RULE_CHECKBOXES[name].on('change', function () {
			var n = $(this).data('opt-name');
			window.RULE_CHECKBOXES[n].prop('checked', $(this).is(':checked'));
			setTimeout(function () {
				if (window.updateViewAllRulesBtn) window.updateViewAllRulesBtn();
			}, 10);
		});
	}

	$stage.menu.setRoom.on('click', function (e) {
		var $d;
		var rule = RULE[MODE[$data.room.mode]];
		var i, k;

		$data.typeRoom = 'setRoom';
		$("#room-title").val($data.room.title);
		$("#room-limit").val($data.room.limit);
		$("#room-mode").val($data.room.mode).trigger('change');
		$("#room-round").val($data.room.round);
		$("#room-time").val($data.room.time / rule.time);
		for (i in OPTIONS) {
			k = OPTIONS[i].name.toLowerCase();
			if (window.RULE_CHECKBOXES[k]) window.RULE_CHECKBOXES[k].prop('checked', $data.room.opts[k] || false);
		}
		if (window.updateViewAllRulesBtn) window.updateViewAllRulesBtn();
		$data._injpick = $data.room.opts.injpick;

		// 서바이벌 HP 설정 복원
		if ($data.room.opts.surHP) {
			$("#room-sur-hp").val($data.room.opts.surHP);
		}

		// 미션/뻥튀기/랜덤잇기 등 서로 종속된 규칙들의 disabled 표시를 현재 체크 상태에 맞게 동기화
		syncRoomDialogDisabledStates();

		showDialog($d = $stage.dialog.room);
		$d.find(".dialog-title").html(L['setRoom']);
	});
	function updateGameOptions(opts, prefix) {
		var i, k;

		for (i in OPTIONS) {
			k = OPTIONS[i].name.toLowerCase();
			if (opts.indexOf(i) == -1) $("#" + prefix + "-" + k + "-panel").hide();
			else $("#" + prefix + "-" + k + "-panel").show();
		}
	}
	function getGameOptions(prefix) {
		var i, name, opts = {};

		for (i in OPTIONS) {
			name = OPTIONS[i].name.toLowerCase();

			if ($("#" + prefix + "-" + name).is(':checked')) opts[name] = true;
		}

		return opts;
	}
	function isRoomMatched(room, mode, opts, all) {
		var i;

		if (!all) {
			if (room.gaming) return false;
			if (room.password) return false;
			if (room.players.length >= room.limit) return false;
		}
		if (room.mode != mode) return false;
		for (i in opts) if (!room.opts[i]) return false;
		return true;
	}
	$("#quick-mode, #QuickDiag .game-option").on('change', function (e) {
		var val = $("#quick-mode").val();
		var ct = 0;
		var i, opts;

		if (e.currentTarget.id == "quick-mode") {
			$("#QuickDiag .game-option").prop('checked', false);
		}
		opts = getGameOptions('quick');
		updateGameOptions(RULE[MODE[val]].opts, 'quick');
		for (i in $data.rooms) {
			if (isRoomMatched($data.rooms[i], val, opts, true)) ct++;
		}
		$("#quick-status").html(L['quickStatus'] + " " + ct);
	});
	$stage.menu.quickRoom.on('click', function (e) {
		$stage.dialog.room.hide();
		showDialog($stage.dialog.quick);
		if ($stage.dialog.quick.is(':visible')) {
			$("#QuickDiag>.dialog-body").find("*").prop('disabled', false);
			$("#quick-mode").trigger('change');
			$("#quick-queue").html("");
			$stage.dialog.quickOK.removeClass("searching").html(L['OK']);
		}
	});
	$stage.dialog.quickOK.on('click', function (e) {
		var mode = $("#quick-mode").val();
		var opts = getGameOptions('quick');

		if (getOnly() != "for-lobby") return;
		if ($stage.dialog.quickOK.hasClass("searching")) {
			$stage.dialog.quick.hide();
			quickTick();
			$stage.menu.quickRoom.trigger('click');
			return;
		}
		$("#QuickDiag>.dialog-body").find("*").prop('disabled', true);
		$stage.dialog.quickOK.addClass("searching").html("<i class='fa fa-spinner fa-spin'></i> " + L['NO']).prop('disabled', false);
		$data._quickn = 0;
		$data._quickT = addInterval(quickTick, 1000);
		function quickTick() {
			var i, arr = [];

			if (!$stage.dialog.quick.is(':visible')) {
				clearTimeout($data._quickT);
				return;
			}
			$("#quick-queue").html(L['quickQueue'] + " " + prettyTime($data._quickn++ * 1000));
			for (i in $data.rooms) {
				if (isRoomMatched($data.rooms[i], mode, opts)) arr.push(i);
			}
			if (arr.length) {
				i = arr[Math.floor(Math.random() * arr.length)];
				$data._preQuick = true;
				$("#room-" + i).trigger('click');
			}
		}
	});
	$("#room-category").on('change', function (e) {
		var category = $(this).val();
		var modeSelect = $("#room-mode");
		var allowedModes = category === 'all' ? null : GAME_CATEGORIES[category].modes;

		//console.log("[Category Debug] Selected:", category);
		//console.log("[Category Debug] Allowed Modes:", allowedModes);
		//console.log("[Category Debug] MODE array:", MODE);
		//console.log("[Category Debug] Total Options found:", modeSelect.find("option").length);

		// Filter modes based on category
		modeSelect.find("option").each(function () {
			var modeIndex = $(this).val();
			var modeName = MODE[modeIndex];
			var shouldShow = !allowedModes || !modeName || (allowedModes.indexOf(modeName) !== -1);

			$(this).toggle(shouldShow);
		});

		// Hide empty optgroups
		modeSelect.find("optgroup").each(function () {
			var hasVisibleOptions = $(this).find("option").filter(function () {
				return $(this).css('display') !== 'none';
			}).length > 0;
			$(this).toggle(hasVisibleOptions);
		});

		// Select first visible option
		var firstVisible = modeSelect.find("option").filter(function () {
			return $(this).css('display') !== 'none';
		}).first();

		if (firstVisible.length > 0) {
			modeSelect.val(firstVisible.val()).trigger('change');
		}
	});
	$("#room-mode").on('change', function (e) {
		var v = $("#room-mode").val();
		var rule = RULE[MODE[v]];
		$("#game-mode-expl").html(L['modex' + v]);

		updateGameOptions(rule.opts, 'room');
		updateGameOptions(rule.opts, 'room-flat');

		// 현재 모드에서 지원하지 않는 규칙 강제 해제
		for (var k in OPTIONS) {
			var optName = OPTIONS[k].name.toLowerCase();
			if (rule.opts.indexOf(k) === -1 && window.RULE_CHECKBOXES[optName]) {
				window.RULE_CHECKBOXES[optName].prop('checked', false);
			}
		}

		// Check if category view is enabled (default: true)
		var showCategory = !($data.opts && $data.opts.src === false);

		// Define option groups
		var mannerOpts = ['man', 'gen', 'shi', 'etq'];
		var linkOpts = ['mid', 'fir', 'ran', 'sch'];
		var lenOpts = ['no2', 'k32', 'k22', 'k44', 'k43', 'unl', 'ln2', 'ln3', 'ln4', 'ln5', 'ln6', 'ln7', 'nol', 'nos'];
		var scopeOpts = ['ext', 'str', 'loa', 'unk', 'lng', 'prv', 'ret', 'obo', 'alp', 'dic', 'arc'];
		var bonusOpts = ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'fho', 'bbg', 'flu', 'jkp', 'dfb'];
		var keyRules = ['man', 'gen', 'ext', "jre", "jdk", 'mis', 'rdm', 'loa', 'str', 'prv', 'k32', 'lng', 'no2', 'unk', 'trp', 'one', 'ret', 'sur', 'rnt', 'itm', 'chs', 'mir', 'spd', 'big', 'qz1', 'qz2', 'qz3', 'ijp', 'qij', 'unl', 'vow', 'obo', 'alp', 'ctc', 'apl', 'obk', 'nyh', 'ord', 'shf', 'stp'];

		if (showCategory) {
			// Categorized view - hide flat panel, show category panels
			$("#room-all-rules-panel").hide();

			// Check and toggle Link Method panel
			var hasLinkOpt = linkOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasLinkOpt) $("#room-link-method-panel").show();
			else $("#room-link-method-panel").hide();

			// Check and toggle Length Limit panel
			var hasLenOpt = lenOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasLenOpt) $("#room-len-limit-panel").show();
			else $("#room-len-limit-panel").hide();

			// Check and toggle Word Scope panel
			var hasScopeOpt = scopeOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasScopeOpt) $("#room-word-settings-wrapper").show();
			else $("#room-word-settings-wrapper").hide();

			// Check if bonus panel should be shown
			var hasBonusOpt = bonusOpts.some(function (opt) {
				return rule.opts.indexOf(opt) !== -1;
			});
			if (hasBonusOpt) {
				$("#room-bonus-panel").show();
			} else {
				$("#room-bonus-panel").hide();
			}

			// Check and toggle Manner panel
			var hasMannerOpt = mannerOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasMannerOpt) $("#room-manner-panel").show();
			else $("#room-manner-panel").hide();

			// Check if special rules panel should be shown
			var excludedOpts = mannerOpts.concat(linkOpts).concat(lenOpts).concat(scopeOpts).concat(bonusOpts);
			var hasSpecialOpt = false;
			for (var i in OPTIONS) {
				if (excludedOpts.indexOf(i) === -1 && rule.opts.indexOf(i) !== -1) {
					hasSpecialOpt = true;
					break;
				}
			}
			if (hasSpecialOpt) {
				$("#room-misc-panel").show();
			} else {
				$("#room-misc-panel").hide();
			}

			// Show/hide injeong pick panel
			if (rule.opts.indexOf("ijp") != -1) $("#room-injpick-panel").show();
			else $("#room-injpick-panel").hide();
			$("#room-injpick-panel-flat").hide();

			// Show/hide quiz topic pick panel
			if (rule.opts.indexOf("qij") != -1) $("#room-quizpick-panel").show();
			else $("#room-quizpick-panel").hide();
			$("#room-quizpick-panel-flat").hide();
		} else {
			// Flat view - hide all category panels, show flat panel
			$("#room-manner-panel").hide();
			$("#room-link-method-panel").hide();
			$("#room-len-limit-panel").hide();
			$("#room-word-settings-wrapper").hide();
			$("#room-bonus-panel").hide();
			$("#room-misc-panel").hide();
			$("#room-injpick-panel").hide();
			$("#room-quizpick-panel").hide();

			// Show flat panel and update options visibility
			$("#room-all-rules-panel").show();

			// Show/hide injeong pick panel in flat mode
			if (rule.opts.indexOf("ijp") != -1) $("#room-injpick-panel-flat").show();
			else $("#room-injpick-panel-flat").hide();

			// Show/hide quiz topic pick panel in flat mode
			if (rule.opts.indexOf("qij") != -1) $("#room-quizpick-panel-flat").show();
			else $("#room-quizpick-panel-flat").hide();
		}

		// Check if simple room view is enabled
		var simpleRoomView = $data.opts && $data.opts.srv;
		if (simpleRoomView) {
			// Simple view takes priority - hide ALL other rule panels
			$("#room-all-rules-panel").hide();
			$("#room-manner-panel").hide();
			$("#room-link-method-panel").hide();
			$("#room-len-limit-panel").hide();
			$("#room-word-settings-wrapper").hide();
			$("#room-bonus-panel").hide();
			$("#room-misc-panel").hide();
			$("#room-injpick-panel").hide();
			$("#room-quizpick-panel").hide();
			$("#room-injpick-panel-flat").hide();
			$("#room-quizpick-panel-flat").hide();

			// Show simple panel instead
			$("#room-simple-rules-panel").show();

			// Show view all rules button in footer
			$("#view-all-rules-btn").show();

			// Show/hide topic selection buttons in simple view
			if (rule.opts.indexOf("ijp") != -1) {
				$("#room-simple-injpick-panel").show();
			} else {
				$("#room-simple-injpick-panel").hide();
			}

			if (rule.opts.indexOf("qij") != -1) {
				$("#room-simple-quizpick-panel").show();
			} else {
				$("#room-simple-quizpick-panel").hide();
			}

			// Update simple panel options visibility
			// 규칙 개수가 10개 이하인 모드는 keyRules와 무관하게 전부 노출
			var simplePanelOpts = rule.opts.length <= 10 ? rule.opts : rule.opts.filter(function (opt) { return keyRules.indexOf(opt) !== -1; });
			updateGameOptions(simplePanelOpts, 'room-simple');
		} else {
			$("#room-simple-rules-panel").hide();
			$("#view-all-rules-btn").hide();
		}

		// Dynamic RoomDiag width based on simple view
		if (!mobile) {
			if (simpleRoomView) {
				$("#RoomDiag").css("width", "330px");
				$("#RoomDiag .dialog-title").css("width", "310px");
				// Adjust internal widths for narrow layout
				$("#room-title, #room-pw, #room-limit, #room-category, #room-mode").css("width", "200px");
				// Adjust round/time/sur-hp elements for narrow layout
				$("#room-round").css("width", "95px");
				$("#room-sur-hp").css("width", "95px");
				$("#room-time").css({ "width": "95px", "margin-left": "3px" });
				// Panel widths
				$("#room-word-settings-wrapper > div, #room-link-method-panel > div, #room-len-limit-panel > div, #room-bonus-panel > div, #room-misc-panel > div, #room-all-rules-panel > div, #room-simple-rules-panel > div").css("width", "210px");
				// Compact rule spacing for simple view
				$("#room-simple-rules-panel .dialog-opt").css({ "margin": "0px", "padding": "1px 0px" });
			} else {
				$("#RoomDiag").css("width", "415px");
				$("#RoomDiag .dialog-title").css("width", "395px");
				// Restore original widths for wide layout
				$("#room-title, #room-pw, #room-limit, #room-category, #room-mode").css("width", "283px");
				// Restore round/time/sur-hp original widths
				$("#room-round").css("width", "133px");
				$("#room-sur-hp").css("width", "133px");
				$("#room-time").css({ "width": "133px", "margin-left": "5px" });
				// Panel widths
				$("#room-word-settings-wrapper > div, #room-link-method-panel > div, #room-len-limit-panel > div, #room-bonus-panel > div, #room-misc-panel > div, #room-all-rules-panel > div").css("width", "300px");
			}
		}

		// Update survival UI for simple view panel
		var survivalChecked = $("#room-survival").is(':checked') || $("#room-flat-survival").is(':checked') || $("#room-simple-survival").is(':checked');
		updateSurvivalUI(survivalChecked);

		// Hide Special Rules Panel if empty
		if (!$data._injpick) $data._injpick = [];
		if (!$data._quizpick) $data._quizpick = [];
		if (rule.rule == "Typing" || rule.rule == "Chainbattle" || rule.rule == "Flip") $("#room-round").val(3);
		$("#room-time").children("option").each(function (i, o) {
			$(o).html(Number($(o).val()) * rule.time + L['SECOND']);
		});

		// 미션/뻥튀기/랜덤잇기 등 서로 종속된 규칙들의 disabled 표시를 현재 체크 상태에 맞게 동기화
		syncRoomDialogDisabledStates();

		// 게임 모드 변경 시 서바이벌 UI 업데이트
		var survivalChecked = $("#room-survival").is(':checked') || $("#room-flat-survival").is(':checked');
		updateSurvivalUI(survivalChecked);
		// 코옵 모드: 라운드 수 입력칸을 목표 문제 수(5~50) 입력칸으로 전환
		// (updateSurvivalUI 호출 뒤에 와야 라벨이 덮어써지지 않음)
		if (rule.coop) {
			$("#room-round").attr({ min: 5, max: 50 }).val(Math.max(5, Math.min(50, Number($("#room-round").val()) || 5)));
			$("#room-round-label").text(L['coopTurns']);
		} else if (rule.rule === "Jaqwi" || rule.rule === "Quiz") {
			$("#room-round").attr({ min: 1, max: 20 }).val(Math.max(1, Math.min(20, Number($("#room-round").val()) || 5)));
			$("#room-round-label").text(mobile ? L['numRound'] : L['roundSetting']);
		} else {
			$("#room-round").attr({ min: 1, max: 10 });
			$("#room-round-label").text(mobile ? L['numRound'] : L['roundSetting']);
		}
		if (window.updateRoundColor) window.updateRoundColor();
		if (window.updateViewAllRulesBtn) setTimeout(window.updateViewAllRulesBtn, 10);
	});
	// 나락-무적 상호배타: 나락 체크시 무적 해제
	window.RULE_CHECKBOXES['narak'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['invincible'].prop('checked', false);
	});
	// 무적(갓모드) 체크시 나락 해제
	window.RULE_CHECKBOXES['invincible'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['narak'].prop('checked', false);
	});
	// 장문금지-단문금지 상호배타: 장문금지 체크시 단문금지 해제
	window.RULE_CHECKBOXES['nolong'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['noshort'].prop('checked', false);
	});
	// 단문금지 체크시 장문금지 해제, 2글자금지 해제
	window.RULE_CHECKBOXES['noshort'].on('change', function () {
		if ($(this).is(':checked')) {
			window.RULE_CHECKBOXES['nolong'].prop('checked', false);
			window.RULE_CHECKBOXES['no2'].prop('checked', false);
		}
	});
	// 2글자금지 체크시 단문금지 해제
	window.RULE_CHECKBOXES['no2'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['noshort'].prop('checked', false);
	});
	// 순서대로-공정랜덤 상호배타: 그림퀴즈 술래 결정 방식
	window.RULE_CHECKBOXES['order'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['shuffle'].prop('checked', false);
	});
	window.RULE_CHECKBOXES['shuffle'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['order'].prop('checked', false);
	});
	// 매너 그룹 상호배타: man, gen, shi, etq 중 하나만 선택 가능
	var mannerGroup = ['manner', 'gentle', 'shield', 'etiquette'];
	mannerGroup.forEach(function (opt) {
		window.RULE_CHECKBOXES[opt].on('change', function () {
			if ($(this).is(':checked')) {
				mannerGroup.forEach(function (other) {
					if (other !== opt) window.RULE_CHECKBOXES[other].prop('checked', false);
				});
			}
		});
	});

	// 아이템전-랜덤턴 상호배타
	window.RULE_CHECKBOXES['item'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['randomturn'].prop('checked', false);
	});
	window.RULE_CHECKBOXES['randomturn'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['item'].prop('checked', false);
	});

	// 아이템전-카오스 상호배타
	window.RULE_CHECKBOXES['item'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['chaos'].prop('checked', false);
	});
	window.RULE_CHECKBOXES['chaos'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['item'].prop('checked', false);
	});

	// 도돌이 금지 - 첫말잇기/랜덤잇기 상호배타
	window.RULE_CHECKBOXES['nododoli'].on('change', function () {
		if ($(this).is(':checked')) {
			window.RULE_CHECKBOXES['first'].prop('checked', false);
			window.RULE_CHECKBOXES['random'].prop('checked', false);
		}
	});
	window.RULE_CHECKBOXES['first'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['nododoli'].prop('checked', false);
	});
	window.RULE_CHECKBOXES['random'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['nododoli'].prop('checked', false);
	});

	// View All Rules Dialog 버튼 핸들러
	// 랜덤 방 설정 버튼: 모드 → 규칙 → 라운드/서바이벌 설정 순서로 랜덤화
	$("#room-random-btn").on('click', function () {
		showConfirm(L['randomRoomWarning'], function (res) {
			if (res) applyRandomRoomSettings();
		});
	});
	function applyRandomRoomSettings() {
		var i, k;

		// 1. 모드를 랜덤으로 선택
		var $modeOptions = $("#room-mode option:not(:disabled)");
		var modeVal = $modeOptions.eq(Math.floor(Math.random() * $modeOptions.length)).val();
		$("#room-mode").val(modeVal).trigger('change');

		var rule = RULE[MODE[modeVal]];
		var opts = rule.opts || [];
		var has = function (c) { return opts.indexOf(c) !== -1; };
		var nameOf = function (c) { return OPTIONS[c].name.toLowerCase(); };

		// 2. 규칙을 랜덤으로 선택 (상호배제/의존관계를 순서대로 반영)
		var target = {};   // name -> boolean
		var decided = {};  // name -> true (그룹 처리로 이미 값이 정해짐)

		// 그룹 내 유효한 옵션 중 하나(또는 없음)를 균등 확률로 선택
		function pickRadio(codes) {
			var names = codes.filter(has).map(nameOf);
			if (!names.length) return null;
			var idx = Math.floor(Math.random() * (names.length + 1)); // names.length = "없음"
			var winner = idx < names.length ? names[idx] : null;
			names.forEach(function (n) { target[n] = (n === winner); decided[n] = true; });
			return winner;
		}
		// blocked가 참이면 강제로 끄고, 아니면 주어진 확률(기본 1/2)로 켜는 규칙
		function pickUnlessBlocked(code, blocked, prob) {
			if (!has(code)) return;
			var n = nameOf(code);
			target[n] = blocked ? false : Math.random() < (prob === undefined ? 0.5 : prob);
			decided[n] = true;
		}

		// 연결 방식: 가온잇기/첫말잇기/랜덤잇기 (3자 상호배제)
		var link = pickRadio(['mid', 'fir', 'ran']);
		// 도돌이금지·플러시: 첫말잇기/랜덤잇기와 상호배제 (가온잇기·없음과는 호환)
		pickUnlessBlocked('dod', link === 'first' || link === 'random');
		pickUnlessBlocked('flu', link === 'first' || link === 'random');
		// 세컨드·스피드토스: 랜덤잇기와만 상호배제 (둘끼리는 서로 호환)
		pickUnlessBlocked('sch', link === 'random');
		pickUnlessBlocked('spt', link === 'random');

		// 글자수 제한 (10자 상호배제)
		var lenName = pickRadio(['ln2', 'k32', 'k22', 'k44', 'k43', 'ln3', 'ln4', 'ln5', 'ln6', 'ln7']);
		// 속담·장문: 서로 상호배제, 2글자/5글자 제한과도 상호배제 (그 외 글자수 제한과는 호환)
		if (lenName === 'length2' || lenName === 'length5') {
			pickUnlessBlocked('prv', true);
			pickUnlessBlocked('lng', true);
		} else {
			pickRadio(['prv', 'lng']);
		}

		// 나락/무적, 순서대로/공정랜덤, 매너 그룹 (각각 상호배제)
		pickRadio(['nar', 'god']);
		pickRadio(['ord', 'shf']);
		pickRadio(['man', 'gen', 'shi', 'etq']);

		// 단문금지: 장문금지/2글자금지 모두와 상호배제 (장문금지·2글자금지는 서로 호환)
		var noshortOn = false;
		if (has('nos')) {
			noshortOn = Math.random() < 0.5;
			target['noshort'] = noshortOn;
			decided['noshort'] = true;
		}
		pickUnlessBlocked('nol', noshortOn);
		pickUnlessBlocked('no2', noshortOn);

		// 아이템전: 카오스/랜덤턴 모두와 상호배제 (카오스·랜덤턴은 서로 호환)
		var itemOn = false;
		if (has('itm')) {
			itemOn = Math.random() < 0.5;
			target['item'] = itemOn;
			decided['item'] = true;
		}
		pickUnlessBlocked('chs', itemOn);
		pickUnlessBlocked('rnt', itemOn);

		// 미션: 켜져 있을 때만 이지미션/랜덤미션/미션플러스 선택 가능
		var missionOn = false;
		if (has('mis')) {
			missionOn = Math.random() < 0.5;
			target['mission'] = missionOn;
			decided['mission'] = true;
		}
		['eam', 'rdm', 'mpl'].forEach(function (c) {
			if (!has(c)) return;
			var n = nameOf(c);
			target[n] = missionOn && Math.random() < 0.5;
			decided[n] = true;
		});

		// drg 규칙은 다른 단독 규칙과 달리 10% 확률로만 켜짐
		pickUnlessBlocked('drg', false, 0.1);

		// 나머지 단독 규칙은 1/2 확률로 독립적으로 선택
		for (i in OPTIONS) {
			if (!has(i)) continue;
			k = nameOf(i);
			if (decided[k]) continue;
			target[k] = Math.random() < 0.5;
		}

		// 3. 체크박스에 반영 (기본 뷰만 갱신하면 상호배제 핸들러가 나머지 뷰를 동기화함)
		for (i in OPTIONS) {
			k = nameOf(i);
			var $primary = $("#room-" + k);
			if (!$primary.length) continue;
			var val = has(i) ? !!target[k] : false;
			if ($primary.is(':checked') !== val) {
				$primary.prop('checked', val).trigger('change');
			}
		}

		// 3.5 어인정/퀴즈 주제를 랜덤으로 선택 (주제 하나는 반드시 선택되고, 나머지는 각각 확률적으로 추가 선택됨)
		function sampleTopics($inputs, prefixLen, extraProb) {
			var ids = $inputs.map(function (idx, o) { return $(o).attr('id').slice(prefixLen); }).get();
			if (!ids.length) return [];
			var guaranteedIdx = Math.floor(Math.random() * ids.length);
			var list = [];
			ids.forEach(function (id, idx) {
				if (idx === guaranteedIdx || Math.random() < extraProb) list.push(id);
			});
			return list;
		}
		if (has('ijp')) {
			var ijListSel = rule.lang == "en" ? "#en-pick-list" : rule.lang == "ja" ? "#ja-pick-list" : "#ko-pick-list";
			var ijExtraProb = rule.lang == "en" ? 0.2 : rule.lang == "ja" ? 0.15 : 0.1;
			$data._injpick = sampleTopics($(ijListSel + " input"), 8, ijExtraProb);
		}
		if (has('qij')) {
			applyQuizTopicLang(rule.lang);
			$data._quizpick = sampleTopics($("#quizpick-list div:visible input"), 10, 0.2);
		}

		// 4. 라운드/서바이벌 설정을 규칙이 허용하는 범위 내에서 랜덤화
		var survivalOn = !!rule.survival || !!target['survival'];
		if (survivalOn) {
			var hpOptions = [200, 500, 1000, 2000];
			$("#room-sur-hp").val(hpOptions[Math.floor(Math.random() * hpOptions.length)]);
		} else {
			var min = Number($("#room-round").attr('min')) || 1;
			var max = Number($("#room-round").attr('max')) || 10;
			$("#room-round").val(min + Math.floor(Math.random() * (max - min + 1)));
		}
		// 라운드 시간도 랜덤으로 선택
		var $timeOptions = $("#room-time option");
		var timeVal = $timeOptions.eq(Math.floor(Math.random() * $timeOptions.length)).val();
		$("#room-time").val(timeVal);
		if (window.updateRoundColor) window.updateRoundColor();
	}
	$("#view-all-rules-btn").on('click', function () {
		var v = $("#room-mode").val();
		var rule = RULE[MODE[v]];

		// view-all 패널의 옵션 표시/숨김 업데이트
		updateGameOptions(rule.opts, 'view-all');
		updateGameOptions(rule.opts, 'view-all-flat');

		// Check if category view is enabled (default: true)
		var showCategory = !($data.opts && $data.opts.src === false);

		// Define option groups
		var mannerOpts = ['man', 'gen', 'shi', 'etq'];
		var linkOpts = ['mid', 'fir', 'ran', 'sch'];
		var lenOpts = ['no2', 'k32', 'k22', 'k44', 'k43', 'unl', 'ln2', 'ln3', 'ln4', 'ln5', 'ln6', 'ln7', 'nol', 'nos'];
		var scopeOpts = ['ext', 'str', 'loa', 'unk', 'lng', 'prv', 'ret', 'obo', 'alp', 'dic', 'arc'];
		var bonusOpts = ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'fho', 'bbg', 'flu', 'jkp', 'dfb'];

		if (showCategory) {
			// Categorized view - hide flat panel, show category panels
			$("#view-all-flat-panel").hide();

			// Check and toggle Link Method panel
			var hasLinkOpt = linkOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasLinkOpt) $("#view-all-link-method-panel").show();
			else $("#view-all-link-method-panel").hide();

			// Check and toggle Length Limit panel
			var hasLenOpt = lenOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasLenOpt) $("#view-all-len-limit-panel").show();
			else $("#view-all-len-limit-panel").hide();

			// Check and toggle Word Scope panel
			var hasScopeOpt = scopeOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasScopeOpt) $("#view-all-word-settings-wrapper").show();
			else $("#view-all-word-settings-wrapper").hide();

			// Check if bonus panel should be shown
			var hasBonusOpt = bonusOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasBonusOpt) $("#view-all-bonus-panel").show();
			else $("#view-all-bonus-panel").hide();

			// Check and toggle Manner panel
			var hasMannerOpt = mannerOpts.some(function (opt) { return rule.opts.indexOf(opt) !== -1; });
			if (hasMannerOpt) $("#view-all-manner-panel").show();
			else $("#view-all-manner-panel").hide();

			// Check if misc panel should be shown
			var excludedOpts = mannerOpts.concat(linkOpts).concat(lenOpts).concat(scopeOpts).concat(bonusOpts);
			var hasSpecialOpt = false;
			for (var i in OPTIONS) {
				if (excludedOpts.indexOf(i) === -1 && rule.opts.indexOf(i) !== -1) {
					hasSpecialOpt = true;
					break;
				}
			}
			if (hasSpecialOpt) $("#view-all-misc-panel").show();
			else $("#view-all-misc-panel").hide();

			// injeong pick 패널 표시
			if (rule.opts.indexOf("ijp") != -1) $("#view-all-injpick-panel").show();
			else $("#view-all-injpick-panel").hide();

			// quiz pick 패널 표시
			if (rule.opts.indexOf("qij") != -1) $("#view-all-quizpick-panel").show();
			else $("#view-all-quizpick-panel").hide();
		} else {
			// Flat view - hide all category panels, show flat panel
			$("#view-all-manner-panel").hide();
			$("#view-all-link-method-panel").hide();
			$("#view-all-len-limit-panel").hide();
			$("#view-all-word-settings-wrapper").hide();
			$("#view-all-bonus-panel").hide();
			$("#view-all-misc-panel").hide();
			$("#view-all-injpick-panel").hide();
			$("#view-all-quizpick-panel").hide();

			// Show flat panel
			$("#view-all-flat-panel").show();

			// injeong pick 패널 표시 (flat mode)
			if (rule.opts.indexOf("ijp") != -1) $("#view-all-flat-injpick-panel").show();
			else $("#view-all-flat-injpick-panel").hide();

			// quiz pick 패널 표시 (flat mode)
			if (rule.opts.indexOf("qij") != -1) $("#view-all-flat-quizpick-panel").show();
			else $("#view-all-flat-quizpick-panel").hide();
		}

		showDialog($stage.dialog.viewAllRules);
	});
	// View All Rules OK 버튼
	$stage.dialog.viewAllRulesOK.on('click', function () {
		$stage.dialog.viewAllRules.hide();
	});
	// View All Rules 모두 해제 버튼
	$("#view-all-uncheck-all").on('click', function () {
		for (var k in OPTIONS) {
			var name = OPTIONS[k].name.toLowerCase();
			if (window.RULE_CHECKBOXES[name]) {
				var $primary = $("#room-" + name);
				if ($primary.length && $primary.is(':checked')) {
					$primary.prop('checked', false).trigger('change');
				}
			}
		}
	});
	// View All Injeong Pick 버튼 (category mode)
	$("#view-all-injeong-pick").on('click', function () {
		showDialog($stage.dialog.injPick);
	});
	// View All Quiz Pick 버튼 (category mode)
	$("#view-all-quiz-pick").on('click', function () {
		var rule = $data.room ? RULE[MODE[$data.room.mode]] : null;
		applyQuizTopicLang(rule ? rule.lang : 'ko');
		showDialog($stage.dialog.quizPick);
	});
	// View All Injeong Pick 버튼 (flat mode)
	$("#view-all-flat-injeong-pick").on('click', function () {
		showDialog($stage.dialog.injPick);
	});
	// View All Quiz Pick 버튼 (flat mode)
	$("#view-all-flat-quiz-pick").on('click', function () {
		var rule = $data.room ? RULE[MODE[$data.room.mode]] : null;
		applyQuizTopicLang(rule ? rule.lang : 'ko');
		showDialog($stage.dialog.quizPick);
	});
	$stage.menu.spectate.on('click', function (e) {
		var mode = $stage.menu.spectate.hasClass("toggled");

		if (mode) {
			send('form', { mode: "J" });
			$stage.menu.spectate.removeClass("toggled");
		} else {
			send('form', { mode: "S" });
			$stage.menu.spectate.addClass("toggled");
		}
	});
	$stage.menu.shop.on('click', function (e) {
		if ($data._shop = !$data._shop) {
			loadShop();
			$stage.menu.shop.addClass("toggled");
		} else {
			$stage.menu.shop.removeClass("toggled");
		}
		updateUI();
	});
	$(".shop-type").on('click', function (e) {
		var $target = $(e.currentTarget);
		var type = $target.attr('id').slice(10);

		$(".shop-type.selected").removeClass("selected");
		$target.addClass("selected");

		filterShop(type == 'all' || $target.attr('value'));
	});
	$("#m-shop-category").on('change', function (e) {
		var $opt = $(this).find(':selected');
		var type = $opt.data('type');

		filterShop(type == 'all' ? true : $opt.attr('value'));
	});
	$("#shop-search").on('input', function () {
		var $mCat = $("#m-shop-category");
		if ($mCat.length) {
			var $opt = $mCat.find(':selected');
			var type = $opt.data('type');
			filterShop(type == 'all' ? true : $opt.attr('value'));
		} else {
			var $cat = $(".shop-type.selected");
			var type = $cat.attr('id').slice(10);
			filterShop(type == 'all' ? true : $cat.attr('value'));
		}
	});
	$stage.menu.dict.on('click', function (e) {
		showDialog($stage.dialog.dict);
	});
	$stage.menu.wordPlus.on('click', function (e) {
		showDialog($stage.dialog.wordPlus);
	});
	$stage.menu.invite.on('click', function (e) {
		showDialog($stage.dialog.invite);
		updateUserList(true);
	});
	$stage.menu.userList.on('click', function (e) {
		updateUserList(true);
		showDialog($stage.dialog.userListDiag);
	});
	$stage.menu.practice.on('click', function (e) {
		if (RULE[MODE[$data.room.mode]].ai) {
			$("#practice-level option[value='-1']").toggle(!RULE[MODE[$data.room.mode]].ewq);
			if (RULE[MODE[$data.room.mode]].ewq && $("#practice-level").val() == -1) $("#practice-level").val(2);
			$("#PracticeDiag .dialog-title").html(L['practice']);
			$("#ai-team").val(0).prop('disabled', true);
			var saved = loadVolumeSettings();
			$("#ai-mute-game").prop('checked', saved.aiMuteGame != null ? !saved.aiMuteGame : false);
			$("#ai-mute-lobby").prop('checked', saved.aiMuteLobby != null ? !saved.aiMuteLobby : false);
			$("#ai-rage-quit").prop('checked', saved.aiRageQuit != null ? saved.aiRageQuit : false);
			$("#ai-fast-mode").prop('checked', saved.aiFastMode != null ? saved.aiFastMode : false);
			showDialog($stage.dialog.practice);
		} else {
			send('practice', { level: -1 });
		}
	});
	$stage.menu.ready.on('click', function (e) {
		send('ready');
	});
	$stage.menu.start.on('click', function (e) {
		send('start');
	});
	$stage.menu.exit.on('click', function (e) {
		if ($data.room.gaming) {
			showConfirm(L['sureExit'], function (res) {
				if (res) {
					clearGame();
					send('leave');
				}
			});
		} else {
			if ($data.practicing) {
				$data.room.gaming = true;
			}
			if ($data.resulting) {
				$data.resulting = false;
				$stage.dialog.result.hide();
				delete $data._replay;
				delete $data._resultRank;
				$stage.box.room.height(360);
				playBGM('lobby');
				forkChat();
			}
			send('leave');
		}
	});
	$stage.menu.replay.on('click', function (e) {
		if ($data._replay) {
			replayStop();
		}
		showDialog($stage.dialog.replay);
		initReplayDialog();
		if ($stage.dialog.replay.is(':visible')) {
			$("#replay-file").trigger('change');
		}
	});
	$stage.menu.leaderboard.on('click', function (e) {
		$data._lbpage = 0;
		if ($stage.dialog.leaderboard.is(":visible")) {
			$stage.dialog.leaderboard.hide();
		} else $.get("/ranking?type=" + ($data._lbtype || 'exp'), function (res) {
			drawLeaderboard(res);
			showDialog($stage.dialog.leaderboard);
		});
	});
	$stage.dialog.lbTabs.on('click', function (e) {
		var type = $(e.currentTarget).data('rankType');
		if ($data._lbtype === type) return;
		$data._lbtype = type;
		$stage.dialog.lbTabs.removeClass('active');
		$(e.currentTarget).addClass('active');
		$.get("/ranking?type=" + type, function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbPrev.on('click', function (e) {
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?type=" + ($data._lbtype || 'exp') + "&p=" + ($data._lbpage - 1), function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbMe.on('click', function (e) {
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?type=" + ($data._lbtype || 'exp') + "&id=" + $data.id, function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbNext.on('click', function (e) {
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?type=" + ($data._lbtype || 'exp') + "&p=" + ($data._lbpage + 1), function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.settingServer.on('click', function (e) {
		location.href = "/";
	});
	$stage.dialog.settingOK.on('click', function (e) {
		e.preventDefault();
		var previousSoundPack = $data.opts.sp || "";
		var previousLevelPack = $data.opts.lp || "";
		var previousNoEasterEgg = loadVolumeSettings().noEasterEgg === true;
		var newSoundPack = $("#sound-pack").val();
		var newLevelPack = $("#level-pack").val();
		var newLobbyBGM = $("#lobby-bgm").val();
		var newLang = $("#language-setting").val();
		var newTheme = $("#theme-setting").val() || 'blue';
		var savedLang = localStorage.getItem('kkutu_lang'); // 이전에 저장된 언어 확인

		// 먼저 모든 설정을 저장 (언어 변경으로 리로드되더라도 설정이 보존되도록)
		$data.opts = {
			mb: $("#mute-bgm").is(":checked"),
			me: $("#mute-effect").is(":checked"),
			bv: $data.BGMVolume,
			ev: $data.EffectVolume,
			di: $("#deny-invite").is(":checked"),
			dw: $("#deny-whisper").is(":checked"),
			df: $("#deny-friend").is(":checked"),
			ar: $("#auto-ready").is(":checked"),
			su: $("#sort-user").is(":checked"),
			ow: $("#only-waiting").is(":checked"),
			ou: $("#only-unlock").is(":checked"),
			src: $("#show-rule-category").is(":checked"),
			srv: $("#simple-room-view").is(":checked"),
			nf: $("#no-filter").is(":checked"),
			ns: $("#no-shake").is(":checked"),
			sp: newSoundPack,
			lp: newLevelPack
		};

		// localStorage에 볼륨 설정 저장
		var newDarkMode = $("#dark-mode-setting").val() || 'light';
		var newBeatMode = $("#beat-setting").val() || 'auto';
		saveVolumeSettings({
			bgmVolume: $data.BGMVolume,
			effectVolume: $data.EffectVolume,
			bgmMute: $data.opts.mb,
			effectMute: $data.opts.me,
			soundPack: $data.opts.sp,
			levelPack: newLevelPack,
			lobbyBGM: newLobbyBGM,
			noEasterEgg: $("#no-easter-egg").is(":checked"),
			aiAutoApply: $("#ai-auto-apply").is(":checked"),
			jaAutoConvert: $("#ja-auto-convert").is(":checked"),
			theme: newTheme,
			darkMode: newDarkMode,
			beatMode: newBeatMode
		});
		ACTIVE_BEAT = resolveActiveBeat(newBeatMode, newSoundPack);

		// 언어 설정 저장
		if (newLang) {
			localStorage.setItem('kkutu_lang', newLang);
		}

		// 쿠키에 설정 저장
		$.cookie('kks', encodeURIComponent(JSON.stringify($data.opts)), { expires: 365, path: '/' });

		// 언어 변경 로직 (페이지 리로드)
		var match = location.href.match(/[?&]locale=([^&#]+)/);
		var pageLang = match ? match[1] : null;
		// 현재 페이지의 실제 언어 (URL에 locale이 없으면 기본 ko_KR)
		var actualCurrentLang = pageLang || "ko_KR";

		if (newLang && newLang !== actualCurrentLang) {
			var search = location.search;
			if (search.indexOf('locale=') >= 0) {
				search = search.replace(/locale=[^&]+/, 'locale=' + newLang);
			} else {
				search = search + (search ? '&' : '?') + 'locale=' + newLang;
			}
			if (window.LANG_ALL && window.LANG_ALL[newLang]) {
				// 언어 사전이 이미 클라이언트에 모두 로드되어 있으므로 리로드 없이 즉시 반영
				window.L = window.LANG_ALL[newLang];
				retranslatePage(window.L);
				history.replaceState(null, '', location.pathname + search);
			} else {
				location.href = location.pathname + search;
				return; // 리로드 하니까 여기서 중단
			}
		}

		applyTheme(newTheme);
		applyDarkMode(newDarkMode);
		$stage.dialog.setting.hide();

		var updateLobbyBGM = function (bgmName, packName) {
			var url;
			if (bgmName) {
				// 특정 BGM 선택됨
				url = "/media/bgm/" + bgmName;
				reloadBGM(url);
			} else {
				// '기본' 선택됨 -> 사운드팩의 BGM 또는 기본 BGM 사용
				// 사운드팩 정보를 가져와야 함.
				$.get("/soundpacks", function (packs) {
					var pack = packs.find(function (p) { return p.name === packName; });
					url = "/media/kkutu/LobbyBGM.mp3"; // Default fallback
					if (pack && pack.files.indexOf("LobbyBGM.mp3") != -1) {
						url = "/media/kkutu/" + packName + "/LobbyBGM.mp3";
					}
					reloadBGM(url);
				});
			}
		};

		var reloadBGM = function (url) {
			// 현재 재생 중인 BGM 중지
			var old = $data.bgm;
			$data.bgm = null;
			if (old) {
				old.stop();
			}

			// $sound 캐시 업데이트
			getAudio("lobby", url, function () {
				// 로비에 있다면 재생
				if (!$data._replay && (!$data.room || !$data.room.gaming)) {
					playBGM("lobby");
				}
			});
		};

		// 사운드팩이 변경되었을 때 동적으로 사운드 로드
		if (previousSoundPack !== newSoundPack) {
			changeSoundPack(newSoundPack, function () {
				updateLobbyBGM(newLobbyBGM, newSoundPack);
			});
		} else {
			updateLobbyBGM(newLobbyBGM, newSoundPack);
		}

		// 흔들림 끄기 옵션 즉시 적용
		if ($data.opts.ns) {
			$(".shake").removeClass("shake").css("animation-duration", "");
		}

		// 레벨 아이콘 팩 변경 시 리렌더링
		if (previousLevelPack !== newLevelPack) {
			$data.levelPackUrl = newLevelPack ? '/img/kkutu/lv/' + newLevelPack + '.png' : '/img/kkutu/lv/newlv.png';
			updateMe();
			updateUserList(true);
			if ($data.room) {
				if ($data.room.gaming) updateRoom(true);
				else updateRoom(false);
			}
		}

		// 병맛 사운드팩 이스터에그: 캐릭터 리렌더링
		// 병맛 팩 변경 또는 이스터에그 on/off 변경 시 리렌더링
		var newNoEasterEgg = $("#no-easter-egg").is(":checked");
		if (previousSoundPack === '병맛' || newSoundPack === '병맛' || newNoEasterEgg !== previousNoEasterEgg) {
			updateMe();
			updateUserList(true);
			if ($data.room) {
				if ($data.room.gaming) updateRoom(true);
				else updateRoom(false);
			}
		}
	});

	/* ---------- 커스텀 테마 에디터 (ThemeDiag) ---------- */
	function themeReadInputs() {
		return {
			primary: $stage.dialog.themeCPrimaryHex.val(),
			medium: $stage.dialog.themeCMediumHex.val(),
			lightBase: $stage.dialog.themeCLightHex.val(),
			darkBase: $stage.dialog.themeCDarkHex.val()
		};
	}
	function themeSetInputs(inputs) {
		$stage.dialog.themeCPrimary.val(inputs.primary); $stage.dialog.themeCPrimaryHex.val(inputs.primary);
		$stage.dialog.themeCMedium.val(inputs.medium); $stage.dialog.themeCMediumHex.val(inputs.medium);
		$stage.dialog.themeCLight.val(inputs.lightBase); $stage.dialog.themeCLightHex.val(inputs.lightBase);
		$stage.dialog.themeCDark.val(inputs.darkBase); $stage.dialog.themeCDarkHex.val(inputs.darkBase);
	}
	function themeValidInputs(inputs) {
		var re = /^#[0-9a-fA-F]{6}$/;
		return re.test(inputs.primary) && re.test(inputs.medium) && re.test(inputs.lightBase) && re.test(inputs.darkBase);
	}
	function themeApplyPreviewVars(el, g) {
		if (!el) return;
		el.style.setProperty('--tp-primary', g.primary.hex);
		el.style.setProperty('--tp-primary-dark', g.primaryDark.hex);
		el.style.setProperty('--tp-bg-light', g.bgLight.hex);
		el.style.setProperty('--tp-bg-medium', g.bgMedium.hex);
		el.style.setProperty('--tp-border', g.border.hex);
		el.style.setProperty('--tp-text', g.text.hex);
	}
	function themeUpdatePreview() {
		if (!window.ThemeEngine) return;
		var inputs = themeReadInputs();
		if (!themeValidInputs(inputs)) return;
		themeApplyPreviewVars($stage.dialog.themePreviewLight[0], window.ThemeEngine.genLight(inputs));
		themeApplyPreviewVars($stage.dialog.themePreviewDark[0], window.ThemeEngine.genDark(inputs));
		$stage.dialog.themeCode.val(window.ThemeEngine.encodeThemeCode([inputs.primary, inputs.medium, inputs.lightBase, inputs.darkBase]));
		$stage.dialog.themeContrastWarning.toggle(window.ThemeEngine.checkContrast(inputs).length > 0);
	}
	function themeInputsForKey(key) {
		if (!window.ThemeEngine) return null;
		if (key === 'custom') {
			var saved = loadVolumeSettings().customTheme;
			if (saved && themeValidInputs(saved)) return saved;
			key = 'blue';
		}
		var preset = window.ThemeEngine.PRESETS_BY_KEY[key] || window.ThemeEngine.PRESETS_BY_KEY.blue;
		return { primary: preset.primary, medium: preset.medium, lightBase: preset.lightBase, darkBase: preset.darkBase };
	}
	function wireThemeColorInput(colorEl, hexEl) {
		colorEl.on('input', function () {
			hexEl.val(colorEl.val());
			themeUpdatePreview();
		});
		hexEl.on('input', function () {
			var v = hexEl.val().trim();
			if (/^#[0-9a-fA-F]{6}$/.test(v)) {
				colorEl.val(v);
				themeUpdatePreview();
			}
		});
	}
	wireThemeColorInput($stage.dialog.themeCPrimary, $stage.dialog.themeCPrimaryHex);
	wireThemeColorInput($stage.dialog.themeCMedium, $stage.dialog.themeCMediumHex);
	wireThemeColorInput($stage.dialog.themeCLight, $stage.dialog.themeCLightHex);
	wireThemeColorInput($stage.dialog.themeCDark, $stage.dialog.themeCDarkHex);

	function applyPresetToThemeDiag(key) {
		var inputs = themeInputsForKey(key);
		if (!inputs) return;
		themeSetInputs(inputs);
		themeUpdatePreview();
	}
	function openThemeEditor() {
		if (!window.ThemeEngine) return;
		applyPresetToThemeDiag('custom');
		$stage.dialog.themePreset.val('blue');
		showDialog($stage.dialog.theme, true);
	}
	// native <select> doesn't fire 'change' when the user re-picks the value it already had, and
	// there's no reliable way to tell "re-picked the same option" apart from "opened the dropdown
	// and clicked away without choosing anything" from blur/mousedown alone. So instead of guessing,
	// #theme-setting-edit / #theme-preset-reset give an explicit, always-deterministic way back in.
	function updateThemeSettingEditIcon() {
		$stage.dialog.themeSettingEdit.toggle($("#theme-setting").val() === 'custom');
	}

	$stage.dialog.themePreset.on('change', function () { applyPresetToThemeDiag($(this).val()); });
	$stage.dialog.themePresetReset.on('click', function () { applyPresetToThemeDiag($stage.dialog.themePreset.val()); });

	$("#theme-setting").on('change', function () {
		updateThemeSettingEditIcon();
		if ($(this).val() === 'custom') openThemeEditor();
	});
	$stage.dialog.themeSettingEdit.on('click', function () { openThemeEditor(); });

	$stage.dialog.themeCodeCopy.on('click', function () {
		var code = $stage.dialog.themeCode.val();
		if (code && navigator.clipboard) navigator.clipboard.writeText(code);
	});

	$stage.dialog.themeLoad.on('click', function () {
		showPrompt(L['themeLoadPrompt'] || '테마 코드를 입력하세요', '', function (code) {
			if (!code || !window.ThemeEngine) return;
			var decoded = window.ThemeEngine.decodeThemeCode(code.trim());
			if (!decoded) {
				showAlert(L['themeLoadInvalid'] || '올바르지 않은 테마 코드입니다.');
				return;
			}
			themeSetInputs(decoded);
			themeUpdatePreview();
		});
	});

	$stage.dialog.themeCancel.on('click', function () {
		$("#theme-setting").val($data._themeSettingPrevValue || 'blue');
		updateThemeSettingEditIcon();
		$stage.dialog.theme.hide();
	});

	$stage.dialog.themeOK.on('click', function (e) {
		e.preventDefault();
		var inputs = themeReadInputs();
		if (!window.ThemeEngine || !themeValidInputs(inputs)) return;

		var commit = function () {
			saveVolumeSettings({ theme: 'custom', customTheme: inputs });
			$data._themeSettingPrevValue = 'custom';
			// applyTheme() renders using $data._activeDarkMode, which is only synced by
			// applyDarkMode() -- normally called from SettingDiag's own save button. ThemeDiag can be
			// opened on top of an still-open, unsaved SettingDiag (e.g. user just flipped the dark
			// mode dropdown to 'dark' but hasn't hit Save yet), so without this the theme would commit
			// against the stale last-saved dark mode and visibly fall back to light.
			$data._activeDarkMode = $("#dark-mode-setting").val() || $data._activeDarkMode || 'light';
			applyTheme('custom');
			$stage.dialog.theme.hide();
		};
		var problems = window.ThemeEngine.checkContrast(inputs);
		if (problems.length > 0) {
			showConfirm(L['themeContrastWarning'] || '글씨가 잘 안 보일 수 있습니다. 그래도 적용할까요?', function (ok) {
				if (ok) commit();
			});
		} else {
			commit();
		}
	});

	$("#mute-bgm").on('click', function () {
		$data.muteBGM = !$data.muteBGM;
		saveVolumeSettings({ bgmMute: $data.muteBGM }); // localStorage에 즉시 저장
		updateBGMVol();
	});
	$(".bgmVolume").on('input change', function () {
		$data.BGMVolume = $(this).val() / 100;
		saveVolumeSettings({ bgmVolume: $data.BGMVolume }); // localStorage에 즉시 저장
		updateBGMVol();
	});
	$("#mute-effect").on('click', function () {
		$data.muteEff = !$data.muteEff;
		saveVolumeSettings({ effectMute: $data.muteEff }); // localStorage에 즉시 저장
		updateEffectVol();
	});
	$(".effectVolume").on('input change', function () {
		$data.EffectVolume = $(this).val() / 100;
		saveVolumeSettings({ effectVolume: $data.EffectVolume }); // localStorage에 즉시 저장
		updateEffectVol();
	});
	$stage.dialog.profileLevel.on('click', function (e) {
		$("#practice-level option[value='-1']").hide();
		if ($("#practice-level").val() == -1) $("#practice-level").val(2);
		$("#PracticeDiag .dialog-title").html(L['robot']);
		$("#ai-team").prop('disabled', false);
		var bot = $data.robots[$data._profiled];
		var saved = loadVolumeSettings();
		if (bot && saved.aiAutoApply === true) {
			$("#practice-level").val(bot.level != null ? bot.level : 2);
			$("#ai-team").val(bot.game ? (bot.game.team || 0) : 0);
			$("#ai-personality").val(bot.personality || 0);
			$("#ai-preferred-char").val(bot.preferredChar || '');
			$("#ai-mute-game").prop('checked', !bot.muteGame);
			$("#ai-mute-lobby").prop('checked', !bot.muteLobby);
			$("#ai-rage-quit").prop('checked', bot.canRageQuit || false);
			$("#ai-fast-mode").prop('checked', bot.fastMode || false);
		} else {
			$("#ai-mute-game").prop('checked', saved.aiMuteGame != null ? !saved.aiMuteGame : false);
			$("#ai-mute-lobby").prop('checked', saved.aiMuteLobby != null ? !saved.aiMuteLobby : false);
			$("#ai-rage-quit").prop('checked', saved.aiRageQuit != null ? saved.aiRageQuit : false);
			$("#ai-fast-mode").prop('checked', saved.aiFastMode != null ? saved.aiFastMode : false);
		}
		showDialog($stage.dialog.practice);
	});
	$stage.dialog.practiceOK.on('click', function (e) {
		var level = $("#practice-level").val();
		var team = $("#ai-team").val();
		var aiMuteGame = !$("#ai-mute-game").is(':checked');
		var aiMuteLobby = !$("#ai-mute-lobby").is(':checked');
		var aiRageQuit = $("#ai-rage-quit").is(':checked');
		var aiFastMode = $("#ai-fast-mode").is(':checked');

		saveVolumeSettings({ aiMuteGame: aiMuteGame, aiMuteLobby: aiMuteLobby, aiRageQuit: aiRageQuit, aiFastMode: aiFastMode });

		$stage.dialog.practice.hide();
		if ($("#PracticeDiag .dialog-title").html() == L['robot']) {
			send('setAI', {
				target: $data._profiled,
				level: level,
				team: team,
				personality: $("#ai-personality").val(),
				preferredChar: $("#ai-preferred-char").val(),
				muteGame: aiMuteGame,
				muteLobby: aiMuteLobby,
				canRageQuit: aiRageQuit,
				fastMode: aiFastMode
			});
		} else {
			var personality = $("#ai-personality").val();
			var preferredChar = $("#ai-preferred-char").val();
			send('practice', {
				level: level,
				personality: personality,
				preferredChar: preferredChar,
				muteGame: aiMuteGame,
				muteLobby: aiMuteLobby,
				canRageQuit: aiRageQuit,
				fastMode: aiFastMode
			});
		}
	});
	$stage.dialog.roomOK.on('click', function (e) {
		var i, k, opts = {
			injpick: $data._injpick,
			quizpick: $data._quizpick
		};
		for (i in OPTIONS) {
			k = OPTIONS[i].name.toLowerCase();
			opts[k] = $("#room-" + k).is(':checked');
		}

		// Read Linking Method Dropdown
		var linkVal = $("#room-link-method").val();
		if (linkVal == 'mid') opts['middle'] = true;
		else if (linkVal == 'fir') opts['first'] = true;
		else if (linkVal == 'ran') opts['random'] = true;

		// Read Syllable Limit Dropdown
		var lenVal = $("#room-len-limit").val();
		if (lenVal == 'no2') opts['no2'] = true;
		else if (lenVal == 'k32') opts['sami'] = true;
		else if (lenVal == 'k22') opts['twotwo'] = true;
		else if (lenVal == 'k44') opts['fourfour'] = true;
		else if (lenVal == 'k43') opts['fourthree'] = true;
		else if (lenVal == 'unl') opts['unlimited'] = true;
		else if (lenVal == 'nol') opts['nolong'] = true;
		else if (lenVal == 'nos') opts['noshort'] = true;

		// Read Word Scope Dropdown
		var scopeVal = $("#room-word-scope").val();
		if (scopeVal == 'ext') opts['injeong'] = true;
		else if (scopeVal == 'str') opts['strict'] = true;
		else if (scopeVal == 'unk') opts['unknown'] = true;

		// Read Survival HP Dropdown
		var surHPVal = $("#room-sur-hp").val();
		// console.log("[DEBUG] surHP dropdown value:", surHPVal, "survival checked:", opts['survival']);
		if (surHPVal) opts['surHP'] = parseInt(surHPVal);
		// console.log("[DEBUG] Final opts.surHP:", opts['surHP']);

		send($data.typeRoom, {
			title: $("#room-title").val().trim() || $("#room-title").attr('placeholder').trim(),
			password: $("#room-pw").val(),
			limit: $("#room-limit").val(),
			mode: $("#room-mode").val(),
			round: $("#room-round").val(),
			time: $("#room-time").val(),
			opts: opts,
		});
		$stage.dialog.room.hide();
	});
	$stage.dialog.resultOK.on('click', function (e) {
		if ($data._resultPage == 1 && $data._resultRank) {
			drawRanking($data._resultRank[$data.id]);
			return;
		}
		if ($data.practicing) {
			$data.room.gaming = true;
			send('leave');
		}
		$data.resulting = false;
		$stage.dialog.result.hide();
		delete $data._replay;
		delete $data._resultRank;
		$stage.box.room.height(360);
		playBGM('lobby');
		forkChat();
		updateUI();
	});
	$stage.dialog.resultSave.on('click', function (e) {
		var date = new Date($rec.time);
		var blob = new Blob([JSON.stringify($rec)], { type: "text/plain" });
		var url = URL.createObjectURL(blob);
		var fileName = "KKuTu" + (
			date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " "
			+ date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds()
		) + ".kkt";
		var $a = $("<a>").attr({
			'download': fileName,
			'href': url
		}).on('click', function (e) {
			$a.remove();
		});
		$("#Jungle").append($a);
		$a[0].click();
	});
	$stage.dialog.dictInjeong.on('click', function (e) {
		var $target = $(e.currentTarget);

		if ($target.is(':disabled')) return;
		if (!$("#dict-theme").val()) return;
		$target.prop('disabled', true);
		$("#dict-output").html(L['searching']);
		$.get("/injeong/" + $("#dict-input").val() + "?theme=" + $("#dict-theme").val(), function (res) {
			addTimeout(function () {
				$target.prop('disabled', false);
			}, 2000);
			if (res.error) return $("#dict-output").html(res.error + ": " + L['wpFail_' + res.error]);

			$("#dict-output").html(L['wpSuccess'] + "(" + res.message + ")");
		});
	});
	$stage.dialog.dictSearch.on('click', function (e) {
		var $target = $(e.currentTarget);

		if ($target.is(':disabled')) return;
		$target.prop('disabled', true);
		$("#dict-output").html(L['searching']);
		tryDict($("#dict-input").val(), function (res) {
			addTimeout(function () {
				$target.prop('disabled', false);
			}, 500);
			if (res.error) return $("#dict-output").html(res.error + ": " + L['wpFail_' + res.error]);

			$("#dict-output").html(processWord(res.word, res.mean, res.theme, res.type.split(',')));
		});
	}).hotkey($("#dict-input"), 13);
	$stage.dialog.wordPlusOK.on('click', function (e) {
		var t;
		if ($stage.dialog.wordPlusOK.hasClass("searching")) return;
		if (!(t = $("#wp-input").val())) return;
		t = t.replace(/[^a-z가-힣あ-ん]/g, "");
		if (t.length < 2) return;

		$("#wp-input").val("");
		$(e.currentTarget).addClass("searching").html("<i class='fa fa-spin fa-spinner'></i>");
		send('wp', { value: t });
	}).hotkey($("#wp-input"), 13);
	$stage.dialog.inviteRobot.on('click', function (e) {
		requestInvite("AI");
	});
	$stage.box.me.on('click', function (e) {
		requestProfile($data.id);
	});
	$stage.dialog.roomInfoJoin.on('click', function (e) {
		$stage.dialog.roomInfo.hide();
		tryJoin($data._roominfo);
	});
	$stage.dialog.profileHandover.on('click', function (e) {
		showConfirm(L['sureHandover'], function (res) {
			if (res) send('handover', { target: $data._profiled });
		});
	});
	$stage.dialog.profileKick.on('click', function (e) {
		send('kick', { robot: $data.robots.hasOwnProperty($data._profiled), target: $data._profiled });
	});
	$stage.dialog.profileShut.on('click', function (e) {
		var o = $data.users[$data._profiled];

		if (!o) return;
		toggleShutBlock(o.profile.title || o.profile.name);
	});
	$stage.dialog.profileWhisper.on('click', function (e) {
		var o = $data.users[$data._profiled];

		$stage.talk.val("/e " + (o.profile.title || o.profile.name).replace(/\s/g, "") + " ").focus();
	});
	$stage.dialog.profileReport.on('click', function (e) {
		openReportDialog($data._profiled);
	});
	$stage.dialog.profileFriendAdd.on('click', function (e) {
		var o = $data.users[$data._profiled];

		send('friendAdd', { target: $data._profiled }, true);
		notice(L['cmd_fa_sent'] + (o.profile.title || o.profile.name));
	});
	$stage.dialog.reportSubmit.on('click', function (e) {
		var reasonCode = parseInt($stage.dialog.reportReason.val());
		var detail = $stage.dialog.reportDetail.val().substr(0, 200);

		send('report', { target: $data._reportTarget, reasonCode: reasonCode, detail: detail }, true);
		$stage.dialog.report.hide();
		notice(L['report_sent']);
	});
	$stage.dialog.profileDress.on('click', function (e) {
		// alert(L['error_555']);
		if ($data.guest) return fail(421);
		if ($data._gaming) return fail(438);
		if (showDialog($stage.dialog.dress)) $.get("/box", function (res) {
			if (res.error) return fail(res.error);

			$data.box = res;
			if (!Object.keys($data.shop).length) {
				processShop(function () { drawMyDress(undefined, true); });
			} else {
				drawMyDress(undefined, true);
			}
		});
	});
	$stage.dialog.dressOK.on('click', function (e) {
		const data = {};

		$(e.currentTarget).attr('disabled', true);

		if ($("#dress-nickname").val() && $("#dress-nickname").val() !== $data.nickname) data.nickname = $("#dress-nickname").val();
		if ($("#dress-exordial").val() !== undefined && $("#dress-exordial").val() !== $data.exordial) data.exordial = $("#dress-exordial").val();


		var processProfile = function (data) {
			showConfirm($data.NICKNAME_LIMIT.TERM > 0 ? L.confirmNickChangeLimit.replace("{V1}", $data.NICKNAME_LIMIT.TERM) : L.confirmNickChange, function (res) {
				if (res) {
					$.post("/profile", data, function (res) {
						if (res.error) {
							if (res.error === 457 && res.remaining) return showAlert(nickCooldownMessage(res.remaining));
							return fail(res.error);
						}
						const message = [];
						if (data.nickname) {
							$("#account-info").text($data.users[$data.id].nickname = $data.users[$data.id].profile.title = $data.users[$data.id].profile.name = $data.nickname = data.nickname);
							message.push(L.nickChanged.replace("{V1}", data.nickname));
						}
						if (data.exordial !== undefined) message.push(L.exorChanged.replace("{V1}", $data.users[$data.id].exordial = $data.exordial = data.exordial));

						send("updateProfile", data, true);
						showAlert(message.join("\n"));
					});
					$stage.dialog.dressOK.attr("disabled", false);
					$stage.dialog.dress.hide();
				} else {
					$stage.dialog.dressOK.attr("disabled", false);
					$stage.dialog.dress.hide();
				}
			});
		};

		var checkEmpty = function () {
			if (!data.nickname && data.exordial === undefined) {
				$stage.dialog.dressOK.attr("disabled", false);
				$stage.dialog.dress.hide();
				return;
			}
			processProfile(data);
		};


		if (data.nickname && $data.NICKNAME_LIMIT.REGEX && $data.NICKNAME_LIMIT.REGEX.test(data.nickname)) {
			data.rawNickname = data.nickname;
			showConfirm(L.confirmNickPolicy, function (res) {
				if (res) {
					data.nickname = data.nickname.replace($data.NICKNAME_LIMIT.REGEX, "");
					checkEmpty();
				} else {
					data.nickname = undefined;
					checkEmpty();
				}
			});
		} else {
			if (data.nickname) data.rawNickname = data.nickname;
			checkEmpty();
		}
	});
	$stage.dialog.nickSetupOk.on('click', function (e) {
		var raw = $stage.dialog.nickSetupInput.val();
	
		$stage.dialog.nickSetupError.text('');
	
		if (!raw) {
			$stage.dialog.nickSetupError.text(L.nickSetupEmpty);
			return;
		}
	
		var nickname = raw;
		if ($data.NICKNAME_LIMIT.REGEX && $data.NICKNAME_LIMIT.REGEX.test(nickname)) {
			nickname = nickname.replace($data.NICKNAME_LIMIT.REGEX, "");
		}
		if (!nickname) {
			$stage.dialog.nickSetupError.text(L.nickSetupEmpty);
			return;
		}
	
		function applyNickname(finalNickname, autoAssigned) {
			$data.nickname = finalNickname;
			$data.users[$data.id].nickname = finalNickname;
			$data.users[$data.id].profile.nickname = finalNickname;
			$data.users[$data.id].profile.title = finalNickname;
			$data.users[$data.id].profile.name = finalNickname;
			$("#account-info").text(finalNickname);
			send("updateProfile", { nickname: finalNickname }, true);
			$stage.dialog.nickSetup.hide();
			$stage.nickBlockOverlay.hide();
			if (autoAssigned) showAlert(L.nickSetupAutoAssigned.replace("{V1}", finalNickname));
		}
	
		function requestFallback() {
			$stage.dialog.nickSetupOk.attr('disabled', true);
			$.post("/profile/fallback", {}, function (res) {
				$stage.dialog.nickSetupOk.attr('disabled', false);
				if (res && res.result === 200 && res.nickname) {
					applyNickname(res.nickname, true);
				} else {
					$stage.dialog.nickSetupError.text(L.nickSetupFailed);
				}
			}).fail(function () {
				$stage.dialog.nickSetupOk.attr('disabled', false);
				$stage.dialog.nickSetupError.text(L.nickSetupFailed);
			});
		}
	
		$stage.dialog.nickSetupOk.attr('disabled', true);
	
		$.post("/profile", { nickname: nickname }, function (res) {
			$stage.dialog.nickSetupOk.attr('disabled', false);
	
			if (res && res.result === 200) {
				applyNickname(res.nickname || nickname, res.autoAssigned);
			} else if (res && res.error) {
				if (res.error === 457 && res.remaining) {
					$stage.dialog.nickSetupError.text(nickCooldownMessage(res.remaining));
				} else {
					$stage.dialog.nickSetupError.text(L['error_' + res.error] || L.nickSetupFailed);
				}
			} else {
				requestFallback();
			}
		}).fail(function () {
			requestFallback();
		});
	});
	$("#DressDiag .dress-type").on('click', function (e) {
		var $target = $(e.currentTarget);
		var type = $target.attr('id').slice(11);

		$(".dress-type.selected").removeClass("selected");
		$target.addClass("selected");

		drawMyGoods(type == 'all' || $target.attr('value'));
	});
	$("#dress-category-select").on('change', function (e) {
		var $opt = $(this).find(':selected');
		var type = $opt.data('type');

		$(".dress-type.selected").removeClass("selected");
		$("#dress-type-" + type).addClass("selected");

		drawMyGoods(type == 'all' || $opt.val());
	});
	$("#dress-cf").on('click', function (e) {
		if ($data._gaming) return fail(438);
		if (showDialog($stage.dialog.charFactory)) drawCharFactory();
	});
	$stage.dialog.cfCompose.on('click', function (e) {
		if (!$stage.dialog.cfCompose.hasClass("cf-composable")) return fail(436);
		showConfirm(L['cfSureCompose'], function (res) {
			if (!res) return;

			$.post("/cf", { tray: $data._tray.join('|') }, function (res) {
				var i;

				if (res.error) return fail(res.error);
				send('refresh');
				showAlert(L['cfComposed']);
				$data.users[$data.id].money = res.money;
				$data.box = res.box;
				for (i in res.gain) queueObtain(res.gain[i]);

				drawMyDress($data._avGroup);
				updateMe();
				drawCharFactory();
			});
		});
	});
	$("#dress-craft").on('click', function (e) {
		if ($data._gaming) return fail(438);
		if (showDialog($stage.dialog.craftWorkshop)) drawCraftWorkshop();
	});
	$stage.menu.exchange.on('click', function (e) {
		if ($data._gaming) return fail(438);
		if ($data.guest) return fail(459);
		if (showDialog($stage.dialog.exchangeWorkshop)) drawExchangeWorkshop();
	});
	$(".craft-type").on('click', function (e) {
		var $target = $(e.currentTarget);
		var type = $target.attr('id').slice(11);

		$(".craft-type.selected").removeClass("selected");
		$target.addClass("selected");

		var filter;
		if (type === 'all') {
			var craftFilter = [];
			$(".craft-type").each(function () {
				var cat = $(this).attr('id').slice(11);
				if (cat === 'all' || cat === 'spec' || cat === 'event') return;
				var vals = ($(this).attr('value') || "").split(',');
				for (var v = 0; v < vals.length; v++) {
					if (vals[v] && craftFilter.indexOf(vals[v]) === -1) craftFilter.push(vals[v]);
				}
			});
			filter = craftFilter;
		} else {
			filter = ($target.attr('value') || "").split(',');
		}
		if ($data._renderCraftGoods) $data._renderCraftGoods(filter);
	});
	$("#craft-category-select").on('change', function () {
		var $opt = $(this).find(':selected');
		var type = $opt.data('type');

		$(".craft-type.selected").removeClass("selected");
		$("#craft-type-" + type).addClass("selected");

		var filter;
		if (type === 'all') {
			var craftFilter = [];
			$(".craft-type").each(function () {
				var cat = $(this).attr('id').slice(11);
				if (cat === 'all' || cat === 'spec' || cat === 'event') return;
				var vals = ($(this).attr('value') || "").split(',');
				for (var v = 0; v < vals.length; v++) {
					if (vals[v] && craftFilter.indexOf(vals[v]) === -1) craftFilter.push(vals[v]);
				}
			});
			filter = craftFilter;
		} else {
			filter = ($opt.val() || "").split(',');
		}
		if ($data._renderCraftGoods) $data._renderCraftGoods(filter);
	});
	$stage.dialog.craftCompose.on('click', function (e) {
		if (!$stage.dialog.craftCompose.hasClass("craft-composable")) return fail(439);
		if (!$data._craftTray || $data._craftTray.length !== 2) return fail(439);

		showConfirm(L['craftSureCompose'], function (res) {
			if (!res) return;

			$.post("/craft", {
				item1: $data._craftTray[0],
				item2: $data._craftTray[1]
			}, function (res) {
				if (res.error) return fail(res.error);
				send('refresh');
				showAlert(L['craftComposed']);
				$data.users[$data.id].money = res.money;
				$data.box = res.box;
				queueObtain({ key: res.crafted, value: 1 });

				drawMyDress($data._avGroup);
				updateMe();
				drawCraftWorkshop();
			});
		});
	});
	$("#room-injeong-pick").on('click', function (e) {
		var rule = RULE[MODE[$("#room-mode").val()]];
		var i;

		$("#injpick-list>div").hide();
		if (rule.lang == "ko") {
			$data._ijkey = "#ko-pick-";
			$("#ko-pick-list").show();
		} else if (rule.lang == "en") {
			$data._ijkey = "#en-pick-";
			$("#en-pick-list").show();
		} else if (rule.lang == "ja") {
			$data._ijkey = "#ja-pick-";
			$("#ja-pick-list").show();
		}
		$stage.dialog.injPickNo.trigger('click');
		for (i in $data._injpick) {
			$($data._ijkey + $data._injpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.injPick);
	});
	$("#room-injeong-pick-flat").on('click', function (e) {
		var rule = RULE[MODE[$("#room-mode").val()]];
		var i;

		$("#injpick-list>div").hide();
		if (rule.lang == "ko") {
			$data._ijkey = "#ko-pick-";
			$("#ko-pick-list").show();
		} else if (rule.lang == "en") {
			$data._ijkey = "#en-pick-";
			$("#en-pick-list").show();
		} else if (rule.lang == "ja") {
			$data._ijkey = "#ja-pick-";
			$("#ja-pick-list").show();
		}
		$stage.dialog.injPickNo.trigger('click');
		for (i in $data._injpick) {
			$($data._ijkey + $data._injpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.injPick);
	});
	$stage.dialog.injPickAll.on('click', function (e) {
		$("#injpick-list input").prop('checked', true);
	});
	$stage.dialog.injPickNo.on('click', function (e) {
		$("#injpick-list input").prop('checked', false);
	});
	$stage.dialog.injPickOK.on('click', function (e) {
		var $target = $($data._ijkey + "list");
		var list = [];

		$data._injpick = $target.find("input").each(function (i, o) {
			var $o = $(o);
			var id = $o.attr('id').slice(8);

			if ($o.is(':checked')) list.push(id);
		});
		$data._injpick = list;
		$stage.dialog.injPick.hide();
	});
	function applyQuizTopicLang(lang) {
		if (lang === 'en') {
			$("#quizpick-list div[data-ko-only='true']").hide().find('input').prop('checked', false);
		} else {
			$("#quizpick-list div[data-ko-only='true']").show();
		}
	}

	// Quiz topic pick handlers
	$("#room-quiz-pick, #room-quiz-pick-flat").on('click', function (e) {
		var i;
		var rule = RULE[MODE[$("#room-mode").val()]];

		applyQuizTopicLang(rule ? rule.lang : 'ko');
		$("#quizpick-no").trigger('click');
		for (i in $data._quizpick) {
			$("#quiz-pick-" + $data._quizpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.quizPick);
	});
	$stage.dialog.quizPickAll.on('click', function (e) {
		$("#quizpick-list div:visible input").prop('checked', true);
	});
	$stage.dialog.quizPickNo.on('click', function (e) {
		$("#quizpick-list input").prop('checked', false);
	});
	$stage.dialog.quizPickOK.on('click', function (e) {
		var list = [];

		$("#quizpick-list").find("input").each(function (i, o) {
			var $o = $(o);
			var id = $o.attr('id').slice(10); // "quiz-pick-" length

			if ($o.is(':checked')) list.push(id);
		});
		$data._quizpick = list;
		$stage.dialog.quizPick.hide();
	});
	// Simple room view - Topic selection button handlers
	$("#room-simple-injeong-pick").on('click', function (e) {
		var rule = RULE[MODE[$("#room-mode").val()]];
		var i;

		$("#injpick-list>div").hide();
		if (rule.lang == "ko") {
			$data._ijkey = "#ko-pick-";
			$("#ko-pick-list").show();
		} else if (rule.lang == "en") {
			$data._ijkey = "#en-pick-";
			$("#en-pick-list").show();
		} else if (rule.lang == "ja") {
			$data._ijkey = "#ja-pick-";
			$("#ja-pick-list").show();
		}
		$stage.dialog.injPickNo.trigger('click');
		for (i in $data._injpick) {
			$($data._ijkey + $data._injpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.injPick);
	});
	$("#room-simple-quiz-pick").on('click', function (e) {
		var i;
		var rule = RULE[MODE[$("#room-mode").val()]];

		applyQuizTopicLang(rule ? rule.lang : 'ko');
		$("#quizpick-no").trigger('click');
		for (i in $data._quizpick) {
			$("#quiz-pick-" + $data._quizpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.quizPick);
	});
	$stage.dialog.kickVoteY.on('click', function (e) {
		send('kickVote', { agree: true });
		clearTimeout($data._kickTimer);
		$stage.dialog.kickVote.hide();
	});
	$stage.dialog.kickVoteN.on('click', function (e) {
		send('kickVote', { agree: false });
		clearTimeout($data._kickTimer);
		$stage.dialog.kickVote.hide();
	});
	$stage.dialog.afkWarnOk.on('click', function (e) {
		send('afkPing', {});
		clearTimeout($data._afkTimer);
		$stage.dialog.afkWarn.hide();
	});
	$stage.dialog.purchaseOK.on('click', function (e) {
		$.post("/buy/" + $data._sgood, function (res) {
			var my = $data.users[$data.id];

			if (res.error) return fail(res.error);
			showAlert(L['purchased']);
			my.money = res.money;
			my.box = res.box;
			updateMe();
		});
		$stage.dialog.purchase.hide();
	});
	$stage.dialog.purchaseNO.on('click', function (e) {
		$stage.dialog.purchase.hide();
	});
	$stage.dialog.obtainOK.on('click', function (e) {
		var obj = $data._obtain.shift();

		if (obj) drawObtain(obj);
		else $stage.dialog.obtain.hide();
	});
	for (i = 0; i < 5; i++) $("#team-" + i).on('click', onTeam);
	function onTeam(e) {
		if ($(".team-selector").hasClass("team-unable")) return;

		send('team', { value: $(e.currentTarget).attr('id').slice(5) });
	}
	// 리플레이
	function initReplayDialog() {
		$stage.dialog.replayView.attr('disabled', true);
	}
	$("#replay-file").on('change', function (e) {
		var file = e.target.files[0];
		var reader = new FileReader();
		var $date = $("#replay-date").html("-");
		var $version = $("#replay-version").html("-");
		var $players = $("#replay-players").html("-");

		$rec = false;
		$stage.dialog.replayView.attr('disabled', true);
		if (!file) return;
		reader.readAsText(file);
		reader.onload = function (e) {
			var i, data;

			try {
				data = JSON.parse(e.target.result);
				$date.html((new Date(data.time)).toLocaleString());
				$version.html(data.version);
				$players.empty();
				for (i in data.players) {
					var u = data.players[i];
					var $p;

					$players.append($p = $("<div>").addClass("replay-player-bar ellipse")
						.text(u.title)
						.prepend(getLevelImage(u.data.score).addClass("users-level"))
					);
					if (u.id == data.me) $p.css('font-weight', "bold");
				}
				$rec = data;
				$stage.dialog.replayView.attr('disabled', false);
			} catch (ex) {
				return showAlert(L['replayError']);
			}
		};
	});
	$stage.dialog.replayView.on('click', function (e) {
		replayReady();
	});

	// 스팸
	addInterval(function () {
		if (spamCount > 0) spamCount = 0;
		else if (spamWarning > 0) spamWarning -= 0.03;
	}, 1000);

	// 규칙 옵션 동기화 (Category View <-> Flat View <-> Simple View)
	$(document).on('change', '.game-option', function (e) {
		var id = $(this).attr('id');
		if (!id || id.indexOf('room-') !== 0) return;

		var isFlat = id.indexOf('room-flat-') === 0;
		var isSimple = id.indexOf('room-simple-') === 0;
		var key;
		if (isSimple) {
			key = id.replace('room-simple-', '');
		} else if (isFlat) {
			key = id.replace('room-flat-', '');
		} else {
			key = id.replace('room-', '');
		}

		var checked = $(this).prop('checked');
		var targets = ['room-' + key, 'room-flat-' + key, 'room-simple-' + key];
		for (var i = 0; i < targets.length; i++) {
			if (targets[i] === id) continue;
			var $target = $("#" + targets[i]);
			if ($target.length && $target.prop('checked') !== checked) {
				$target.prop('checked', checked);
			}
		}
		// room-flat-* 또는 room-simple-* 변경 시 room-* 변경을 트리거하여 상호 배제 로직 등이 실행되도록 함
		// room-* 변경 시에는 무한 루프 방지를 위해 트리거하지 않음 (상호 배제 로직은 room-* 기준으로 동작)
		if (isFlat || isSimple) {
			$("#room-" + key).trigger('change');
		}
	});

	// 상호 배제 규칙 적용
	// 1. Unknown Word vs (Injeong, Strict, Loanword)
	$("#room-unknown, #view-all-unknown, #view-all-flat-unknown").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-injeong, #room-strict, #room-loanword").prop('checked', false);
			$("#room-flat-injeong, #room-flat-strict, #room-flat-loanword").prop('checked', false);
			$("#room-simple-injeong, #room-simple-strict, #room-simple-loanword").prop('checked', false);
			$("#view-all-injeong, #view-all-strict, #view-all-loanword").prop('checked', false);
			$("#view-all-flat-injeong, #view-all-flat-strict, #view-all-flat-loanword").prop('checked', false);
		}
	});
	$("#room-injeong, #room-strict, #room-loanword, #view-all-injeong, #view-all-strict, #view-all-loanword, #view-all-flat-injeong, #view-all-flat-strict, #view-all-flat-loanword").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-unknown").prop('checked', false);
			$("#room-flat-unknown").prop('checked', false);
			$("#room-simple-unknown").prop('checked', false);
			$("#view-all-unknown, #view-all-flat-unknown").prop('checked', false);
		}
	});

	// 2. 가온잇기 vs 첫말잇기 vs 랜덤잇기
	$("#room-middle, #view-all-middle, #view-all-flat-middle").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-first, #room-random").prop('checked', false).trigger('change');
			$("#room-flat-first, #room-flat-random").prop('checked', false);
			$("#room-simple-first, #room-simple-random").prop('checked', false);
			$("#view-all-first, #view-all-random").prop('checked', false);
			$("#view-all-flat-first, #view-all-flat-random").prop('checked', false);
		}
	});
	$("#room-first, #view-all-first, #view-all-flat-first").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-middle, #room-random").prop('checked', false).trigger('change');
			$("#room-flat-middle, #room-flat-random").prop('checked', false);
			$("#room-simple-middle, #room-simple-random").prop('checked', false);
			$("#view-all-middle, #view-all-random").prop('checked', false);
			$("#view-all-flat-middle, #view-all-flat-random").prop('checked', false);
			$("#room-flush, #room-flat-flush, #room-simple-flush, #view-all-flush, #view-all-flat-flush").prop('checked', false).prop('disabled', true);
		} else {
			if (!$("#room-random").is(':checked')) {
				$("#room-flush, #room-flat-flush, #room-simple-flush, #view-all-flush, #view-all-flat-flush").prop('disabled', false);
			}
		}
	});

	// 3. 랜덤잇기 vs (세컨드, 부메랑)
	$("#room-random, #view-all-random, #view-all-flat-random").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-middle, #room-first").prop('checked', false);
			$("#room-flat-middle, #room-flat-first").prop('checked', false);
			$("#room-simple-middle, #room-simple-first").prop('checked', false);
			$("#view-all-middle, #view-all-first").prop('checked', false);
			$("#view-all-flat-middle, #view-all-flat-first").prop('checked', false);
			$("#room-second, #room-speedtoss").prop('checked', false).prop('disabled', true);
			$("#room-flat-second, #room-flat-speedtoss").prop('checked', false).prop('disabled', true);
			$("#room-simple-second, #room-simple-speedtoss").prop('checked', false).prop('disabled', true);
			$("#view-all-second, #view-all-speedtoss").prop('checked', false).prop('disabled', true);
			$("#view-all-flat-second, #view-all-flat-speedtoss").prop('checked', false).prop('disabled', true);
			$("#room-flush, #room-flat-flush, #room-simple-flush, #view-all-flush, #view-all-flat-flush").prop('checked', false).prop('disabled', true);
		} else {
			$("#room-second, #room-speedtoss").prop('disabled', false);
			$("#room-flat-second, #room-flat-speedtoss").prop('disabled', false);
			$("#room-simple-second, #room-simple-speedtoss").prop('disabled', false);
			$("#view-all-second, #view-all-speedtoss").prop('disabled', false);
			$("#view-all-flat-second, #view-all-flat-speedtoss").prop('disabled', false);
			if (!$("#room-first").is(':checked')) {
				$("#room-flush, #room-flat-flush, #room-simple-flush, #view-all-flush, #view-all-flat-flush").prop('disabled', false);
			}
		}
	});

	$("#room-second, #room-speedtoss, #view-all-second, #view-all-speedtoss, #view-all-flat-second, #view-all-flat-speedtoss").on('change', function () {
		if ($("#room-second").is(':checked') || $("#room-speedtoss").is(':checked') ||
			$("#view-all-second").is(':checked') || $("#view-all-speedtoss").is(':checked') ||
			$("#view-all-flat-second").is(':checked') || $("#view-all-flat-speedtoss").is(':checked')) {
			$("#room-random").prop('checked', false).prop('disabled', true);
			$("#room-flat-random").prop('checked', false).prop('disabled', true);
			$("#room-simple-random").prop('checked', false).prop('disabled', true);
			$("#view-all-random").prop('checked', false).prop('disabled', true);
			$("#view-all-flat-random").prop('checked', false).prop('disabled', true);
		} else {
			$("#room-random").prop('disabled', false);
			$("#room-flat-random").prop('disabled', false);
			$("#room-simple-random").prop('disabled', false);
			$("#view-all-random").prop('disabled', false);
			$("#view-all-flat-random").prop('disabled', false);
		}
	});

	// 4. 글자수 제한 (2, 3-2, 2-2, 4-4, 4-3, 3, 4, 5, 6, 7)
	var lengthNames = ["length2", "sami", "twotwo", "fourfour", "fourthree", "length3", "length4", "length5", "length6", "length7"];
	var lengthRoomSel = lengthNames.map(function (n) { return "#room-" + n; }).join(", ");
	var lengthViewAllSel = lengthNames.map(function (n) { return "#view-all-" + n; }).join(", ");
	var lengthViewAllFlatSel = lengthNames.map(function (n) { return "#view-all-flat-" + n; }).join(", ");
	$(lengthRoomSel + ", " + lengthViewAllSel + ", " + lengthViewAllFlatSel).on('change', function () {
		if ($(this).is(':checked')) {
			var currentId = $(this).attr('id');
			// room-* 그룹
			var ids = lengthNames.map(function (n) { return "room-" + n; });
			var flatIds = lengthNames.map(function (n) { return "room-flat-" + n; });
			var simpleIds = lengthNames.map(function (n) { return "room-simple-" + n; });
			// view-all-* 그룹
			var vaIds = lengthNames.map(function (n) { return "view-all-" + n; });
			var vaFlatIds = lengthNames.map(function (n) { return "view-all-flat-" + n; });

			// Get current key
			var currentKey = currentId.replace(/^(room-|view-all-flat-|view-all-)/, '');

			// Uncheck other options in same group (Category View)
			for (var i = 0; i < ids.length; i++) {
				if (ids[i] !== "room-" + currentKey) {
					$("#" + ids[i]).prop('checked', false);
				}
			}

			// Uncheck others in Flat View
			for (var i = 0; i < flatIds.length; i++) {
				if (flatIds[i] !== "room-flat-" + currentKey) {
					$("#" + flatIds[i]).prop('checked', false);
				}
			}
			// Uncheck others in Simple View
			for (var i = 0; i < simpleIds.length; i++) {
				if (simpleIds[i] !== "room-simple-" + currentKey) {
					$("#" + simpleIds[i]).prop('checked', false);
				}
			}
			// Uncheck others in View All (Category)
			for (var i = 0; i < vaIds.length; i++) {
				if (vaIds[i] !== "view-all-" + currentKey) {
					$("#" + vaIds[i]).prop('checked', false);
				}
			}
			// Uncheck others in View All (Flat)
			for (var i = 0; i < vaFlatIds.length; i++) {
				if (vaFlatIds[i] !== "view-all-flat-" + currentKey) {
					$("#" + vaFlatIds[i]).prop('checked', false);
				}
			}
		}
	});

	// 5. 속담 vs 장문 vs 2글자 vs 5글자 (타자 대회 단어 범위 - 4자 상호 배제)
	$("#room-proverb, #view-all-proverb, #view-all-flat-proverb").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-long, #room-length2, #room-length5").prop('checked', false);
			$("#room-flat-long, #room-flat-length2, #room-flat-length5").prop('checked', false);
			$("#room-simple-long, #room-simple-length2, #room-simple-length5").prop('checked', false);
			$("#view-all-long, #view-all-length2, #view-all-length5").prop('checked', false);
			$("#view-all-flat-long, #view-all-flat-length2, #view-all-flat-length5").prop('checked', false);
		}
	});
	$("#room-long, #view-all-long, #view-all-flat-long").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-proverb, #room-length2, #room-length5").prop('checked', false);
			$("#room-flat-proverb, #room-flat-length2, #room-flat-length5").prop('checked', false);
			$("#room-simple-proverb, #room-simple-length2, #room-simple-length5").prop('checked', false);
			$("#view-all-proverb, #view-all-length2, #view-all-length5").prop('checked', false);
			$("#view-all-flat-proverb, #view-all-flat-length2, #view-all-flat-length5").prop('checked', false);
		}
	});
	$("#room-length2, #view-all-length2, #view-all-flat-length2").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-proverb, #room-long").prop('checked', false);
			$("#room-flat-proverb, #room-flat-long").prop('checked', false);
			$("#room-simple-proverb, #room-simple-long").prop('checked', false);
			$("#view-all-proverb, #view-all-long").prop('checked', false);
			$("#view-all-flat-proverb, #view-all-flat-long").prop('checked', false);
		}
	});
	$("#room-length5, #view-all-length5, #view-all-flat-length5").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-proverb, #room-long").prop('checked', false);
			$("#room-flat-proverb, #room-flat-long").prop('checked', false);
			$("#room-simple-proverb, #room-simple-long").prop('checked', false);
			$("#view-all-proverb, #view-all-long").prop('checked', false);
			$("#view-all-flat-proverb, #view-all-flat-long").prop('checked', false);
		}
	});

	// 6. 미션이 꺼져있으면 이지미션, 랜덤미션, 미션플러스 비활성화
	$("#room-mission, #view-all-mission, #view-all-flat-mission").on('change', function () {
		var missionEnabled = $(this).is(':checked');
		if (!missionEnabled) {
			// 미션이 꺼지면 관련 옵션들도 끄고 비활성화
			$("#room-easymission, #room-rndmission, #room-missionplus").prop('checked', false).prop('disabled', true);
			$("#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus").prop('checked', false).prop('disabled', true);
			$("#room-simple-easymission, #room-simple-rndmission, #room-simple-missionplus").prop('checked', false).prop('disabled', true);
			$("#view-all-easymission, #view-all-rndmission, #view-all-missionplus").prop('checked', false).prop('disabled', true);
			$("#view-all-flat-easymission, #view-all-flat-rndmission, #view-all-flat-missionplus").prop('checked', false).prop('disabled', true);
		} else {
			// 미션이 켜지면 관련 옵션들 활성화
			$("#room-easymission, #room-rndmission, #room-missionplus").prop('disabled', false);
			$("#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus").prop('disabled', false);
			$("#room-simple-easymission, #room-simple-rndmission, #room-simple-missionplus").prop('disabled', false);
			$("#view-all-easymission, #view-all-rndmission, #view-all-missionplus").prop('disabled', false);
			$("#view-all-flat-easymission, #view-all-flat-rndmission, #view-all-flat-missionplus").prop('disabled', false);
		}
	});

	// 7. 자유두음 vs 두음 없음 vs 로블두음 (상호 배제)
	$("#room-freedueum, #view-all-freedueum, #view-all-flat-freedueum").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-nodueum").prop('checked', false);
			$("#room-flat-nodueum").prop('checked', false);
			$("#room-simple-nodueum").prop('checked', false);
			$("#view-all-nodueum, #view-all-flat-nodueum").prop('checked', false);
			$("#room-robloxduum").prop('checked', false);
			$("#room-flat-robloxduum").prop('checked', false);
			$("#room-simple-robloxduum").prop('checked', false);
			$("#view-all-robloxduum, #view-all-flat-robloxduum").prop('checked', false);
		}
	});
	$("#room-nodueum, #view-all-nodueum, #view-all-flat-nodueum").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-freedueum").prop('checked', false);
			$("#room-flat-freedueum").prop('checked', false);
			$("#room-simple-freedueum").prop('checked', false);
			$("#view-all-freedueum, #view-all-flat-freedueum").prop('checked', false);
			$("#room-robloxduum").prop('checked', false);
			$("#room-flat-robloxduum").prop('checked', false);
			$("#room-simple-robloxduum").prop('checked', false);
			$("#view-all-robloxduum, #view-all-flat-robloxduum").prop('checked', false);
		}
	});
	$("#room-robloxduum, #view-all-robloxduum, #view-all-flat-robloxduum").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-freedueum").prop('checked', false);
			$("#room-flat-freedueum").prop('checked', false);
			$("#room-simple-freedueum").prop('checked', false);
			$("#view-all-freedueum, #view-all-flat-freedueum").prop('checked', false);
			$("#room-nodueum").prop('checked', false);
			$("#room-flat-nodueum").prop('checked', false);
			$("#room-simple-nodueum").prop('checked', false);
			$("#view-all-nodueum, #view-all-flat-nodueum").prop('checked', false);
		}
	});

	// 8. 십자말풀이 기초사전 vs 아케이드 (상호 배제 - 둘 다 안 켜면 기존 공용 사전 출처)
	$("#room-dic, #view-all-dic, #view-all-flat-dic").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-arc").prop('checked', false);
			$("#room-flat-arc").prop('checked', false);
			$("#room-simple-arc").prop('checked', false);
			$("#view-all-arc, #view-all-flat-arc").prop('checked', false);
		}
	});
	$("#room-arc, #view-all-arc, #view-all-flat-arc").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-dic").prop('checked', false);
			$("#room-flat-dic").prop('checked', false);
			$("#room-simple-dic").prop('checked', false);
			$("#view-all-dic, #view-all-flat-dic").prop('checked', false);
		}
	});

	// 9. 뻥튀기: 다른 보너스 규칙이 하나도 켜져 있지 않으면 켤 수 없음
	var bbungBonusKeys = ['mission', 'easymission', 'rndmission', 'missionplus', 'speedtoss', 'straight', 'fullhouse', 'flush', 'jackpot', 'defensebonus'];
	function hasOtherBonusOn() {
		return bbungBonusKeys.some(function (key) {
			return $("#room-" + key).is(':checked') || $("#view-all-" + key).is(':checked') || $("#view-all-flat-" + key).is(':checked');
		});
	}
	function disableBbungtwigi() {
		$("#room-bbungtwigi").prop('checked', false);
		$("#room-flat-bbungtwigi").prop('checked', false);
		$("#room-simple-bbungtwigi").prop('checked', false);
		$("#view-all-bbungtwigi, #view-all-flat-bbungtwigi").prop('checked', false);
	}
	// 체크 여부뿐 아니라 disabled 표시도 항상 최신 상태로 맞춘다 (방만들기/설정 진입 시 초기화 포함)
	function updateBbungtwigiAvailability() {
		var enabled = hasOtherBonusOn();
		if (!enabled) disableBbungtwigi();
		$("#room-bbungtwigi, #room-flat-bbungtwigi, #room-simple-bbungtwigi, #view-all-bbungtwigi, #view-all-flat-bbungtwigi").prop('disabled', !enabled);
	}
	$("#room-bbungtwigi, #view-all-bbungtwigi, #view-all-flat-bbungtwigi").on('change', function () {
		if ($(this).is(':checked') && !hasOtherBonusOn()) disableBbungtwigi();
	});
	var bbungWatchSel = bbungBonusKeys.map(function (n) { return "#room-" + n; })
		.concat(bbungBonusKeys.map(function (n) { return "#view-all-" + n; }))
		.concat(bbungBonusKeys.map(function (n) { return "#view-all-flat-" + n; }))
		.join(", ");
	$(bbungWatchSel).on('change', updateBbungtwigiAvailability);

	// 미션 서브옵션(이지미션/랜덤미션/미션플러스), 랜덤잇기<->세컨드/부메랑, 첫말잇기/랜덤잇기->플러시도
	// 마찬가지로 체크 상태에 종속된 disabled 표시가 있는데, 지금까지는 변경 이벤트에서만 갱신되고
	// 방만들기/설정 다이얼로그를 처음 열 때는 갱신되지 않아 시각적으로 어긋났다. 진입 시점에 한 번에 동기화한다.
	function updateMissionSubAvailability() {
		var missionOn = $("#room-mission").is(':checked') || $("#view-all-mission").is(':checked') || $("#view-all-flat-mission").is(':checked');
		var sel = "#room-easymission, #room-rndmission, #room-missionplus, " +
			"#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus, " +
			"#room-simple-easymission, #room-simple-rndmission, #room-simple-missionplus, " +
			"#view-all-easymission, #view-all-rndmission, #view-all-missionplus, " +
			"#view-all-flat-easymission, #view-all-flat-rndmission, #view-all-flat-missionplus";
		if (!missionOn) $(sel).prop('checked', false);
		$(sel).prop('disabled', !missionOn);
	}
	function updateLinkExclusionAvailability() {
		var randomOn = $("#room-random").is(':checked') || $("#view-all-random").is(':checked') || $("#view-all-flat-random").is(':checked');
		var secondSpeedSel = "#room-second, #room-speedtoss, #room-flat-second, #room-flat-speedtoss, " +
			"#room-simple-second, #room-simple-speedtoss, #view-all-second, #view-all-speedtoss, " +
			"#view-all-flat-second, #view-all-flat-speedtoss";
		if (randomOn) $(secondSpeedSel).prop('checked', false);
		$(secondSpeedSel).prop('disabled', randomOn);

		var secondSpeedOn = $("#room-second").is(':checked') || $("#room-speedtoss").is(':checked') ||
			$("#view-all-second").is(':checked') || $("#view-all-speedtoss").is(':checked') ||
			$("#view-all-flat-second").is(':checked') || $("#view-all-flat-speedtoss").is(':checked');
		var randomSel = "#room-random, #room-flat-random, #room-simple-random, #view-all-random, #view-all-flat-random";
		if (secondSpeedOn) $(randomSel).prop('checked', false);
		$(randomSel).prop('disabled', secondSpeedOn);

		var firstOn = $("#room-first").is(':checked') || $("#view-all-first").is(':checked') || $("#view-all-flat-first").is(':checked');
		var flushSel = "#room-flush, #room-flat-flush, #room-simple-flush, #view-all-flush, #view-all-flat-flush";
		var flushDisabled = firstOn || randomOn;
		if (flushDisabled) $(flushSel).prop('checked', false);
		$(flushSel).prop('disabled', flushDisabled);
	}
	// 방만들기/설정 다이얼로그가 열릴 때 호출해 체크박스 disabled 표시를 현재 상태에 맞게 초기화
	function syncRoomDialogDisabledStates() {
		updateMissionSubAvailability();
		updateLinkExclusionAvailability();
		updateBbungtwigiAvailability();
	}

	// 10. 아이템전 vs 카오스 (상호 배제 - 카오스는 아이템전과 함께 사용 불가)
	$("#room-item, #view-all-item, #view-all-flat-item").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-chaos").prop('checked', false);
			$("#room-flat-chaos").prop('checked', false);
			$("#room-simple-chaos").prop('checked', false);
			$("#view-all-chaos, #view-all-flat-chaos").prop('checked', false);
		}
	});
	$("#room-chaos, #view-all-chaos, #view-all-flat-chaos").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-item").prop('checked', false);
			$("#room-flat-item").prop('checked', false);
			$("#room-simple-item").prop('checked', false);
			$("#view-all-item, #view-all-flat-item").prop('checked', false);
		}
	});

	// 11. 서바이벌 모드 UI 변경
	function updateSurvivalUI(isSurvival) {
		// 현재 선택된 게임 모드가 서바이벌을 지원하는지 확인
		var currentMode = $("#room-mode").val();
		var rule = RULE[MODE[currentMode]];
		var isAlwaysSurvival = !!(rule && rule.survival);
		var supportsSurvival = isAlwaysSurvival || (rule && rule.opts && rule.opts.indexOf("sur") !== -1);

		// 서바이벌이 활성화되었고, 해당 게임이 서바이벌을 지원하는 경우에만 HP UI 표시
		if ((isSurvival || isAlwaysSurvival) && supportsSurvival) {
			// 라운드 수 1로 고정하고 숨김
			$("#room-round").val(1).prop('disabled', true).hide();
			// HP 선택 드롭다운 표시 (라운드 위치에)
			$("#room-sur-hp").show();
			// 라벨 변경
			$("#room-round-label").text(L['survivalHP']);
		} else {
			// 원상복구
			$("#room-round").prop('disabled', false).show();
			// HP 선택 드롭다운 숨김
			$("#room-sur-hp").hide();
			// 라벨 원상복구 (모바일: 라운드 수, 데스크톱: 라운드 설정)
			$("#room-round-label").text(mobile ? L['numRound'] : L['roundSetting']);
		}
	}

	$("#room-survival, #room-flat-survival, #room-simple-survival").on('change', function () {
		updateSurvivalUI($(this).is(':checked'));
	});

	// 아이템 버튼 클릭
	$(document).on('click', '.ItemButton', function () {
		if ($(this).hasClass('item-disabled')) return;
		var slot = $(this).data('slot');
		var itemType = getItemTypeBySlot(slot);
		if (!itemType) return;

		if ($data.pendingItem === itemType) {
			$data.pendingItem = null;
			send('item-dequeue', {});
		} else {
			$data.pendingItem = itemType;
			send('item-queue', { itemType: itemType });
		}
		updateItemUI();
	});

	// 모바일: 롱프레스로 아이템 툴팁 표시
	(function () {
		var longPressTimer = null;
		$(document).on('touchstart', '.ItemButton[data-tooltip]', function (e) {
			var $btn = $(this);
			longPressTimer = setTimeout(function () {
				longPressTimer = null;
				$('.item-tooltip-popup').remove();
				var $tip = $('<div>').addClass('item-tooltip-popup').text($btn.attr('data-tooltip'));
				$btn.append($tip);
				setTimeout(function () { $tip.remove(); }, 2000);
			}, 100);
		}).on('touchend touchcancel touchmove', '.ItemButton', function () {
			if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
		});
	})();

	// 아이템 키보드 단축키 (1~5)
	$(document).on('keydown', function (e) {
		if (e.originalEvent && e.originalEvent.repeat) return;
		if (!$data.room || !$data.room.opts || !$data.room.opts.item) return;
		if (!$data.room.gaming) return;
		if ($data.room.mode === undefined) return;

		// 캘크 중에는 무시 (숫자 필수 입력) - MODE 배열에서 CAL 또는 Relay-Calc 확인
		var currentModeStr = window.MODE ? window.MODE[$data.room.mode] : "";
		if (currentModeStr && currentModeStr.toLowerCase().indexOf('calc') !== -1) return;
		if (currentModeStr && currentModeStr.toUpperCase() === 'CRL') return;

		// 입력창 밸류 체크 (Talk 또는 hereText)
		var val = ($stage.game.hereText.is(':visible') ? $stage.game.hereText.val() : $stage.talk.val()) || '';
		if (val.length > 0) return; // 단어 입력 중이면 아이템 큐 동작 차단

		var slot = e.which - 48; // 1(49) ~ 5(53)
		var numpadSlot = e.which - 96; // NumPad 1(97) ~ 5(101)

		var finalSlot = -1;
		if (slot >= 1 && slot <= 5) finalSlot = slot;
		else if (numpadSlot >= 1 && numpadSlot <= 5) finalSlot = numpadSlot;

		if (finalSlot !== -1) {
			e.preventDefault();
			useItemSlot(finalSlot);
		}
	});

	// 웹소켓 연결
	// 모바일 브라우저(특히 파이어폭스)는 백그라운드로 전환되면 JS 타이머가 정지되어
	// heartbeat가 끊기고, 복귀 시점에 code=1006(비정상 종료)으로 소켓이 닫혀 있는 경우가 많다.
	// 이때는 사용자가 새로고침하지 않아도 자동으로 재접속을 시도한다.
	var _reconnectPending = false;
	function scheduleReconnect() {
		if (_reconnectPending) return;
		_reconnectPending = true;
		// 화면이 보이는 상태면 바로 시도, 백그라운드면 다시 보일 때까지 대기
		// (백그라운드에서의 재시도는 네트워크가 살아있지 않은 경우가 많아 낭비)
		if (document.visibilityState === 'visible') {
			setTimeout(doReconnect, 1500);
		}
	}
	function doReconnect() {
		_reconnectPending = false;
		connect();
	}
	document.addEventListener('visibilitychange', function () {
		var state = document.visibilityState;
		// 진단용: 서버 로그에서 disconnect 직전 visibility 상태를 확인할 수 있도록 표시
		if (ws && ws.readyState === _WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'visibility', state: state }));
		}
		if (state === 'visible' && _reconnectPending) {
			doReconnect();
		}
	});
	function connect() {
		var heartbeatInterval;
		ws = new _WebSocket($data.URL);
		ws.onopen = function (e) {
			if (heartbeatInterval) clearInterval(heartbeatInterval);
			heartbeatInterval = _setInterval(function () {
				// master 소켓(ws)에 항상 heartbeat 전송 — Cloudflare idle timeout 방지
				if (ws && ws.readyState === _WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: 'heartbeat' }));
				}
				// 게임방 소켓(rws)이 열려 있으면 별도로 전송
				if (rws && rws.readyState === _WebSocket.OPEN) {
					rws.send(JSON.stringify({ type: 'heartbeat' }));
				}
			}, 20000);
			loading();
			/*if($data.PUBLIC && mobile) $("#ad").append($("<ins>").addClass("daum_ddn_area")
				.css({ 'display': "none", 'margin-top': "10px", 'width': "100%" })
				.attr({
					'data-ad-unit': "DAN-1ib8r0w35a0qb",
					'data-ad-media': "4I8",
					'data-ad-pubuser': "3iI",
					'data-ad-type': "A",
					'data-ad-width': "320",
					'data-ad-height': "100"
				})
			).append($("<script>")
				.attr({
					'type': "text/javascript",
					'src': "//t1.daumcdn.net/adfit/static/ad.min.js"
				})
			);*/
		};
		ws.onmessage = _onMessage = function (e) {
			onMessage(JSON.parse(e.data));
		};
		ws.onclose = function (e) {
			if (heartbeatInterval) clearInterval(heartbeatInterval);

			if (rws) rws.close();
			stopAllSounds();

			// 연결이 끊기면 재접속 성공 여부와 무관하게 즉시 로비 화면으로 전환한다.
			// (재접속 시 서버가 다시 'welcome'을 보내며 로비 상태로 초기화하므로,
			//  화면도 미리 로비로 돌려놓아 끊긴 방/게임 화면에 그대로 머무르지 않게 한다)
			if ($data.place) {
				clearInterval($data._tTime);
				clearBoard();
				$data.place = 0;
				$data.room = null;
				// practicing이 true면 updateUI()가 강제로 게임 화면을 유지시키므로 함께 해제한다
				$data.practicing = false;
				$data.resulting = false;
				updateUI();
				playBGM('lobby');
			}

			if ($data._bannedClose) {
				$.get("/kkutu_notice.html", function (res) { loading(res); });
				return;
			}

			// code=1006(비정상 종료)은 모바일 백그라운드 전환 등으로 인한 순간적인 연결 유실이
			// 대부분이므로, 사용자에게 alert를 띄우는 대신 조용히 재접속을 시도한다.
			if (e.code === 1006) {
				loading(L['reconnecting']);
				scheduleReconnect();
				return;
			}

			var ct = L['closed'] + " (#" + e.code + ")";
			// 1004, 1005 에러 코드는 일반적인 연결 끊김이므로 alert 대신 오버레이로 표시
			if (e.code === 1004 || e.code === 1005) {
				loading(ct);
			} else {
				showAlert(ct, function () {
					$.get("/kkutu_notice.html", function (res) {
						loading(res);
					});
				});
			}
		};
		ws.onerror = function (e) {
		};
	}
});
