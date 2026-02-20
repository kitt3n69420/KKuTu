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
		console.error("Language redirect error:", e);
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
			userList: $("#UserListBtn")
		},
		dialog: {
			setting: $("#SettingDiag"),
			settingServer: $("#setting-server"),
			settingOK: $("#setting-ok"),
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
			kickVote: $("#KickVoteDiag"),
			kickVoteY: $("#kick-vote-yes"),
			kickVoteN: $("#kick-vote-no"),
			purchase: $("#PurchaseDiag"),
			purchaseOK: $("#purchase-ok"),
			purchaseNO: $("#purchase-no"),
			replay: $("#ReplayDiag"),
			replayView: $("#replay-view"),
			leaderboard: $("#LeaderboardDiag"),
			lbTable: $("#ranking tbody"),
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
	$.get("/soundpacks", function (packs) {
		console.log("Loaded sound packs:", packs);
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


		// 로비 BGM 설정 가져오기
		$.get("/bgm", function (bgms) {
			console.log("Loaded bgms:", bgms);
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

		// focusout: cwcmd 영역 외부로 나갈 때만 숨김
		$cwInput.on('focusout', function (e) {
			// relatedTarget이 cwcmd 내부이면 숨기지 않음
			var $related = $(e.relatedTarget);
			if ($related.closest($stage.game.cwcmd).length > 0) {
				return;
			}
			// cwcmd 외부로 포커스가 나가면 숨김
			$(".cw-q-body").empty();
			$stage.game.cwcmd.css('opacity', 0);
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
	$("#room-round").on('change', function (e) {
		var $target = $(e.currentTarget);
		var value = $target.val();

		if (value < 1 || value > 10) {
			$target.css('color', "#FF4444");
		} else {
			$target.css('color', "");
		}
	});
	$stage.game.here.on('click', function (e) {
		// 모바일에서도 게임 입력창 클릭 시 포커스
		if (mobile) {
			$stage.game.hereText.focus();
		} else {
			$stage.talk.focus();
		}
	});
	// 양방향 실시간 입력 동기화
	$stage.talk.on('input', function (e) {
		$stage.game.hereText.val($stage.talk.val());
	});
	$stage.game.hereText.on('input', function (e) {
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
		$(".bgmVolume").val((bgmVol || 1) * 100);
		$(".effectVolume").val((effVol || 1) * 100);

		// 음소거 체크박스 설정
		var bgmMute = savedSettings.bgmMute !== null ? savedSettings.bgmMute : $data.muteBGM;
		var effMute = savedSettings.effectMute !== null ? savedSettings.effectMute : $data.muteEff;
		$("#mute-bgm").prop('checked', bgmMute || false);
		$("#mute-effect").prop('checked', effMute || false);

		// 사운드팩 선택 설정
		$("#sound-pack").val(savedSettings.soundPack || "");

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

		// 현재 로드된 언어 감지
		// L 객체로부터 실제 언어 감지 시도
		var detectedLang = null;
		try {
			// 한국어 체크
			if (L && L('language') === '한국어') detectedLang = 'ko_KR';
			else if (L && L('language') === 'English') detectedLang = 'en_US';
			else if (L && L('language') === '???') detectedLang = 'nya';
		} catch (e) { }

		// URL locale 파라미터 확인
		var match = location.href.match(/[?&]locale=([^&#]+)/);
		var pageLang = match ? match[1] : null;
		var savedLang = localStorage.getItem('kkutu_lang');

		// 우선순위: URL locale > 저장된 언어 > 감지된언어 > 한국어
		var currentLang = pageLang || savedLang || detectedLang || "ko_KR";
		$("#language-setting").val(currentLang);



		showDialog($stage.dialog.setting);
	});
	$stage.menu.community.on('click', function (e) {
		if ($data.guest) return fail(451);
		showDialog($stage.dialog.community);
	});
	$stage.dialog.commFriendAdd.on('click', function (e) {
		showPrompt(L['friendAddNotice'], "", function (id) {
			if (!id) return;
			if (!$data.users[id]) return fail(450);

			send('friendAdd', { target: id }, true);
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
			$("#room-" + k).attr('checked', $data.room.opts[k]);
			$("#room-flat-" + k).attr('checked', $data.room.opts[k]);
		}
		$data._injpick = $data.room.opts.injpick;

		// 서바이벌 HP 설정 복원
		if ($data.room.opts.surHP) {
			$("#room-sur-hp").val($data.room.opts.surHP);
		}

		// 미션 상태에 따라 관련 옵션 활성화/비활성화
		var missionEnabled = $data.room.opts.mission;
		if (!missionEnabled) {
			$("#room-easymission, #room-rndmission, #room-missionplus").prop('disabled', true);
			$("#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus").prop('disabled', true);
		} else {
			$("#room-easymission, #room-rndmission, #room-missionplus").prop('disabled', false);
			$("#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus").prop('disabled', false);
		}

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

			console.log("[Category Debug] Option:", modeIndex, modeName, shouldShow);
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


		// Check if category view is enabled (default: true)
		var showCategory = !($data.opts && $data.opts.src === false);

		// Define option groups
		var mannerOpts = ['man', 'gen', 'shi', 'etq'];
		var linkOpts = ['mid', 'fir', 'ran', 'sch'];
		var lenOpts = ['no2', 'k32', 'k22', 'k44', 'k43', 'unl', 'ln3', 'ln4', 'ln5', 'ln6', 'ln7', 'nol', 'nos'];
		var scopeOpts = ['ext', 'str', 'loa', 'unk', 'lng', 'prv'];
		var bonusOpts = ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'bbg'];

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
			console.log("[Simple Room] rule.opts:", rule.opts, "ijp:", rule.opts.indexOf("ijp"), "qij:", rule.opts.indexOf("qij"));
			if (rule.opts.indexOf("ijp") != -1) {
				console.log("[Simple Room] Showing ijp panel");
				$("#room-simple-injpick-panel").show();
			} else {
				$("#room-simple-injpick-panel").hide();
			}

			if (rule.opts.indexOf("qij") != -1) {
				console.log("[Simple Room] Showing qij panel");
				$("#room-simple-quizpick-panel").show();
			} else {
				$("#room-simple-quizpick-panel").hide();
			}

			// Update simple panel options visibility 
			updateGameOptions(rule.opts, 'room-simple');
		} else {
			$("#room-simple-rules-panel").hide();
			$("#view-all-rules-btn").hide();
		}

		// Dynamic RoomDiag width based on simple view
		if (!mobile) {
			if (simpleRoomView) {
				$("#RoomDiag").css("width", "330px");
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
		if (rule.rule == "Typing") $("#room-round").val(3);
		$("#room-time").children("option").each(function (i, o) {
			$(o).html(Number($(o).val()) * rule.time + L['SECOND']);
		});

		// 미션 상태에 따라 관련 옵션 활성화/비활성화
		var missionEnabled = $("#room-mission").is(':checked');
		if (!missionEnabled) {
			$("#room-easymission, #room-rndmission, #room-missionplus").prop('disabled', true);
			$("#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus").prop('disabled', true);
		} else {
			$("#room-easymission, #room-rndmission, #room-missionplus").prop('disabled', false);
			$("#room-flat-easymission, #room-flat-rndmission, #room-flat-missionplus").prop('disabled', false);
		}

		// 게임 모드 변경 시 서바이벌 UI 업데이트
		var survivalChecked = $("#room-survival").is(':checked') || $("#room-flat-survival").is(':checked');
		updateSurvivalUI(survivalChecked);
	});
	// 나락-무적 상호배타: 나락 체크시 무적 해제
	$("#room-narak, #room-flat-narak, #view-all-narak, #view-all-flat-narak").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-invincible, #room-flat-invincible, #view-all-invincible, #view-all-flat-invincible").prop('checked', false);
		}
	});
	// 무적(갓모드) 체크시 나락 해제
	$("#room-invincible, #room-flat-invincible, #view-all-invincible, #view-all-flat-invincible").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-narak, #room-flat-narak, #view-all-narak, #view-all-flat-narak").prop('checked', false);
		}
	});
	// 장문금지-단문금지 상호배타: 장문금지 체크시 단문금지 해제
	$("#room-nolong, #room-flat-nolong, #view-all-nolong, #view-all-flat-nolong").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-noshort, #room-flat-noshort, #view-all-noshort, #view-all-flat-noshort").prop('checked', false);
		}
	});
	// 단문금지 체크시 장문금지 해제, 2글자금지 해제
	$("#room-noshort, #room-flat-noshort, #view-all-noshort, #view-all-flat-noshort").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-nolong, #room-flat-nolong, #view-all-nolong, #view-all-flat-nolong").prop('checked', false);
			$("#room-no2, #room-flat-no2, #view-all-no2, #view-all-flat-no2").prop('checked', false);
		}
	});
	// 2글자금지 체크시 단문금지 해제
	$("#room-no2, #room-flat-no2, #view-all-no2, #view-all-flat-no2").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-noshort, #room-flat-noshort, #view-all-noshort, #view-all-flat-noshort").prop('checked', false);
		}
	});
	// 매너 그룹 상호배타: man, gen, shi, etq 중 하나만 선택 가능
	var mannerGroup = ['manner', 'gentle', 'shield', 'etiquette'];
	mannerGroup.forEach(function (opt) {
		var selectors = ['#room-' + opt, '#room-flat-' + opt, '#room-simple-' + opt,
		'#view-all-' + opt, '#view-all-flat-' + opt].join(', ');
		$(selectors).on('change', function () {
			if ($(this).is(':checked')) {
				mannerGroup.forEach(function (other) {
					if (other !== opt) {
						$('#room-' + other + ', #room-flat-' + other + ', #room-simple-' + other +
							', #view-all-' + other + ', #view-all-flat-' + other).prop('checked', false);
					}
				});
			}
		});
	});
	// View All Rules Dialog 버튼 핸들러
	$("#view-all-rules-btn").on('click', function () {
		var v = $("#room-mode").val();
		var rule = RULE[MODE[v]];

		// room- 체크박스 값을 view-all- 및 view-all-flat-에 복사
		for (var opt in OPTIONS) {
			var roomId = 'room-' + OPTIONS[opt].name.toLowerCase();
			var viewAllId = 'view-all-' + OPTIONS[opt].name.toLowerCase();
			var viewAllFlatId = 'view-all-flat-' + OPTIONS[opt].name.toLowerCase();
			var checked = $('#' + roomId).is(':checked');
			$('#' + viewAllId).prop('checked', checked);
			$('#' + viewAllFlatId).prop('checked', checked);
		}

		// view-all 패널의 옵션 표시/숨김 업데이트
		updateGameOptions(rule.opts, 'view-all');
		updateGameOptions(rule.opts, 'view-all-flat');

		// Check if category view is enabled (default: true)
		var showCategory = !($data.opts && $data.opts.src === false);

		// Define option groups
		var mannerOpts = ['man', 'gen', 'shi', 'etq'];
		var linkOpts = ['mid', 'fir', 'ran', 'sch'];
		var lenOpts = ['no2', 'k32', 'k22', 'k44', 'k43', 'unl', 'ln3', 'ln4', 'ln5', 'ln6', 'ln7', 'nol', 'nos'];
		var scopeOpts = ['ext', 'str', 'loa', 'unk', 'lng', 'prv'];
		var bonusOpts = ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'bbg'];

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
	// View All Rules OK 버튼 - 값을 room 옵션에 동기화
	$stage.dialog.viewAllRulesOK.on('click', function () {
		// view-all- 및 view-all-flat- 값들을 room-에 복사
		var showCategory = !($data.opts && $data.opts.src === false);

		for (var opt in OPTIONS) {
			var srcId = showCategory ? 'view-all-' : 'view-all-flat-';
			var viewAllId = srcId + OPTIONS[opt].name.toLowerCase();
			var roomId = 'room-' + OPTIONS[opt].name.toLowerCase();
			var simplId = 'room-simple-' + OPTIONS[opt].name.toLowerCase();
			var flatId = 'room-flat-' + OPTIONS[opt].name.toLowerCase();
			var checked = $('#' + viewAllId).is(':checked');
			$('#' + roomId).prop('checked', checked);
			$('#' + simplId).prop('checked', checked);
			$('#' + flatId).prop('checked', checked);
		}
		$stage.dialog.viewAllRules.hide();
	});
	// View All Injeong Pick 버튼 (category mode)
	$("#view-all-injeong-pick").on('click', function () {
		showDialog($stage.dialog.injPick);
	});
	// View All Quiz Pick 버튼 (category mode)
	$("#view-all-quiz-pick").on('click', function () {
		showDialog($stage.dialog.quizPick);
	});
	// View All Injeong Pick 버튼 (flat mode)
	$("#view-all-flat-injeong-pick").on('click', function () {
		showDialog($stage.dialog.injPick);
	});
	// View All Quiz Pick 버튼 (flat mode)
	$("#view-all-flat-quiz-pick").on('click', function () {
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

		filterShop(type == 'all' || $opt.attr('value'));
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
			$("#PracticeDiag .dialog-title").html(L['practice']);
			$("#ai-team").val(0).prop('disabled', true);
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
		} else $.get("/ranking", function (res) {
			drawLeaderboard(res);
			showDialog($stage.dialog.leaderboard);
		});
	});
	$stage.dialog.lbPrev.on('click', function (e) {
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?p=" + ($data._lbpage - 1), function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbMe.on('click', function (e) {
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?id=" + $data.id, function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbNext.on('click', function (e) {
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?p=" + ($data._lbpage + 1), function (res) {
			drawLeaderboard(res);
		});
	});
	$stage.dialog.settingServer.on('click', function (e) {
		location.href = "/";
	});
	$stage.dialog.settingOK.on('click', function (e) {
		e.preventDefault();
		var previousSoundPack = $data.opts.sp || "";
		var previousNoEasterEgg = loadVolumeSettings().noEasterEgg === true;
		var newSoundPack = $("#sound-pack").val();
		var newLobbyBGM = $("#lobby-bgm").val();
		var newLang = $("#language-setting").val();
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
			sp: newSoundPack
		};

		// localStorage에 볼륨 설정 저장
		saveVolumeSettings({
			bgmVolume: $data.BGMVolume,
			effectVolume: $data.EffectVolume,
			bgmMute: $data.opts.mb,
			effectMute: $data.opts.me,
			soundPack: $data.opts.sp,
			lobbyBGM: newLobbyBGM,
			noEasterEgg: $("#no-easter-egg").is(":checked"),
			aiAutoApply: $("#ai-auto-apply").is(":checked")
		});

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
			location.href = location.pathname + search;
			return; // 리로드 하니까 여기서 중단
		}

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

		// 병맛 사운드팩 이스터에그: 캐릭터 리렌더링
		// 병맛 팩 변경 또는 이스터에그 on/off 변경 시 리렌더링
		var newNoEasterEgg = $("#no-easter-egg").is(":checked");
		if (previousSoundPack === '병맛' || newSoundPack === '병맛' || newNoEasterEgg !== previousNoEasterEgg) {
			updateMe();
			updateUserList(true);
			if ($data.room) updateRoom(false);
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
		$("#PracticeDiag .dialog-title").html(L['robot']);
		$("#ai-team").prop('disabled', false);
		var bot = $data.robots[$data._profiled];
		if (bot && loadVolumeSettings().aiAutoApply === true) {
			$("#practice-level").val(bot.level != null ? bot.level : 2);
			$("#ai-team").val(bot.game ? (bot.game.team || 0) : 0);
			$("#ai-personality").val(bot.personality || 0);
			$("#ai-preferred-char").val(bot.preferredChar || '');
		}
		showDialog($stage.dialog.practice);
	});
	$stage.dialog.practiceOK.on('click', function (e) {
		var level = $("#practice-level").val();
		var team = $("#ai-team").val();

		$stage.dialog.practice.hide();
		if ($("#PracticeDiag .dialog-title").html() == L['robot']) {
			send('setAI', {
				target: $data._profiled,
				level: level,
				team: team,
				personality: $("#ai-personality").val(),
				preferredChar: $("#ai-preferred-char").val()
			});
		} else {
			var personality = $("#ai-personality").val();
			var preferredChar = $("#ai-preferred-char").val();
			console.log("Practice Mode Settings (Captured):", {
				level: level,
				personality: personality,
				preferredChar: preferredChar
			});
			send('practice', {
				level: level,
				personality: personality,
				preferredChar: preferredChar
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
		console.log("[DEBUG] surHP dropdown value:", surHPVal, "survival checked:", opts['survival']);
		if (surHPVal) opts['surHP'] = parseInt(surHPVal);
		console.log("[DEBUG] Final opts.surHP:", opts['surHP']);

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
		t = t.replace(/[^a-z가-힣]/g, "");
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
				if (cat === 'all' || cat === 'spec') return;
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
				if (cat === 'all' || cat === 'spec') return;
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
	// Quiz topic pick handlers
	$("#room-quiz-pick, #room-quiz-pick-flat").on('click', function (e) {
		var i;

		$("#quizpick-no").trigger('click');
		for (i in $data._quizpick) {
			$("#quiz-pick-" + $data._quizpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.quizPick);
	});
	$stage.dialog.quizPickAll.on('click', function (e) {
		$("#quizpick-list input").prop('checked', true);
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
		}
		$stage.dialog.injPickNo.trigger('click');
		for (i in $data._injpick) {
			$($data._ijkey + $data._injpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.injPick);
	});
	$("#room-simple-quiz-pick").on('click', function (e) {
		var i;

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
				console.warn(ex);
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
		} else {
			$("#room-second, #room-speedtoss").prop('disabled', false);
			$("#room-flat-second, #room-flat-speedtoss").prop('disabled', false);
			$("#room-simple-second, #room-simple-speedtoss").prop('disabled', false);
			$("#view-all-second, #view-all-speedtoss").prop('disabled', false);
			$("#view-all-flat-second, #view-all-flat-speedtoss").prop('disabled', false);
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

	// 4. 글자수 제한 (3-2, 2-2, 4-4, 4-3, 3, 4, 5, 6, 7)
	var lengthNames = ["sami", "twotwo", "fourfour", "fourthree", "length3", "length4", "length5", "length6", "length7"];
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

			// Uncheck other options in same group (Category View)
			$("#" + ids.join(", #")).not(this).prop('checked', false);

			// Get current key
			var currentKey = currentId.replace(/^(room-|view-all-flat-|view-all-)/, '');

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

	// 5. 속담 vs 장문
	$("#room-proverb, #view-all-proverb, #view-all-flat-proverb").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-long").prop('checked', false);
			$("#room-flat-long").prop('checked', false);
			$("#room-simple-long").prop('checked', false);
			$("#view-all-long, #view-all-flat-long").prop('checked', false);
		}
	});
	$("#room-long, #view-all-long, #view-all-flat-long").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-proverb").prop('checked', false);
			$("#room-flat-proverb").prop('checked', false);
			$("#room-simple-proverb").prop('checked', false);
			$("#view-all-proverb, #view-all-flat-proverb").prop('checked', false);
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

	// 7. 자유두음 vs 두음 없음 (상호 배제)
	$("#room-freedueum, #view-all-freedueum, #view-all-flat-freedueum").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-nodueum").prop('checked', false);
			$("#room-flat-nodueum").prop('checked', false);
			$("#room-simple-nodueum").prop('checked', false);
			$("#view-all-nodueum, #view-all-flat-nodueum").prop('checked', false);
		}
	});
	$("#room-nodueum, #view-all-nodueum, #view-all-flat-nodueum").on('change', function () {
		if ($(this).is(':checked')) {
			$("#room-freedueum").prop('checked', false);
			$("#room-flat-freedueum").prop('checked', false);
			$("#room-simple-freedueum").prop('checked', false);
			$("#view-all-freedueum, #view-all-flat-freedueum").prop('checked', false);
		}
	});

	// 8. 서바이벌 모드 UI 변경
	function updateSurvivalUI(isSurvival) {
		// 현재 선택된 게임 모드가 서바이벌을 지원하는지 확인
		var currentMode = $("#room-mode").val();
		var rule = RULE[MODE[currentMode]];
		var supportsSurvival = rule && rule.opts && rule.opts.indexOf("sur") !== -1;

		// 서바이벌이 활성화되었고, 해당 게임이 서바이벌을 지원하는 경우에만 HP UI 표시
		if (isSurvival && supportsSurvival) {
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

	// 웹소켓 연결
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
			}, 25000);
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
			var ct = L['closed'] + " (#" + e.code + ")";

			if (rws) rws.close();
			stopAllSounds();

			// 1004, 1005, 1006 에러 코드는 일반적인 연결 끊김이므로 alert 대신 오버레이로 표시
			if (e.code === 1004 || e.code === 1005 || e.code === 1006) {
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
			console.warn(L['error'], e);
		};
	}
});
