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

var MODE;
var PACK_TOOLTIP = { '키뮤': 'Kimu-Nowchira 제공 · CC BY-NC 4.0' };
var BEAT = [null,
	"10000000",
	"10001000",
	"10101000",
	"11101000",
	"11111000",
	"11111010",
	"11111110",
	"11111111"
];
var BEAT_KM = [null,
	"10000000",
	"10000010",
	"10000011",
	"10011010",
	"11011010",
	"11011110",
	"11011111",
	"11111111"
];
var BEAT_Mid = [null,
	"10000000",
	"10001000",
	"10010010",
	"10011010",
	"11011010",
	"11011110",
	"11011111",
	"11111111"
];
var ACTIVE_BEAT = null;
var NULL_USER = {
	profile: { title: L['null'] },
	data: { score: 0 }
};
var MOREMI_PART;
var AVAIL_EQUIP;
var RULE;
var OPTIONS;
var MAX_LEVEL = 360;
var TICK = 30;
var EXP = [];
var BAD = new RegExp(["느으*[^가-힣]*금마?", 
	"(?<!밀레)니[^가-힣]*(엄|앰|엠)", 
	"(ㅄ|ㅅㅂ|ㅆㅂ|ㅂㅅ|ㄴㄱㅁ|ㄴㅇㅁ|ㅈㄹ)", 
	"미(친|띤)(년|놈)?", 
	"(병|븅|빙|벙)[^가-힣]*신", 
	"(새|섀|쌔|썌|색|섁|쌕|썍)[^가-힣]*(기|끼)", 
	"(섹|야)[^가-힣]*스", "교[^가-힣]*미", "발[^가-힣]*정",
	"(시|씨|쉬|쒸|슈|쓔)이*입?[^가-힣]*(발|빨|벌|뻘|팔|펄)", 
	"십[^가-힣]*새", "씹", "딸[^가-힣]*딸[^가-힣]*이",
	"(?<!(흰|노른|검은))자[^가-힣]*위",
	"(애|에)[^가-힣]*(미|비)", 
	"(자|보|쟈|쥬|뷰)[^가-힣]*지", 
	"(존|졸|ㅈ)[^가-힣]*(나|라)", "좆|죶|좃|죳", 
	"(지|야)[^가-힣]*랄", 
	"창[^가-힣]*(녀|년|놈)", 
	"야[^가-힣]*(동|덩|둉|짤)",
	"(?<!라)운[^가-힣]*지",
	"자[^가-힣]*(살|해)",
	"tlqkf", "torl", "tprtm", "wlfkf",
	"[mf][a4@][g]{2,}[o0][t+]",        // faggot, f4ggot, f@ggot
    "f[a4@]g",                         // fag
    "(r[e3]|[b8][a4@][s5])t[a4@]rd",   // retard, r3tard, bastard
    "n[i1!]gg([e3]r|[a4@])",           // nigger
    "b[i1!][t+0]ch",                   // bitch
    "sh[i1!][t+0]",                    // shit
    "f[u*u][c|k]{1,}",                 // fuck, f*ck
    "p[u*u][s]{2}y",                   // pussy
	"c(u|oo)m",
	"[s5][e3]x",
	"p[o0]rn", "kys",
	"y[i1!|]ff",
    "d[i1!]ck",
	"[s5]u[i!1]c[i!1]d[e3]",
	"m[a@4][s5]tur[b8][a4]t([i1!][o0]n|[e3]|[o0]r)",
	"j[]e3rk([1i]n|[0f]ff).*",
    "(h[a@4]nd|f[0o][0o]t|t[i1!]t|bl[0o]w)j[o0]b"
    ].join('|'), "g");

var ws, rws;
var $stage;
var $sound = {};
var $_sound = {}; // 현재 재생 중인 것들
var $data = {};
var $lib = { Classic: {}, Jaqwi: {}, Crossword: {}, Typing: {}, Hunmin: {}, Daneo: {}, Sock: {}, Picture: {}, Flip: {}, Raingame: {}, Shuk: {} };
var $rec;
var mobile;

var audioContext = window.hasOwnProperty("AudioContext") ? (new AudioContext()) : false;
var _WebSocket = window['WebSocket'];
var _setInterval = setInterval;
var _setTimeout = setTimeout;

function getDisplayName(user) {
	return user.nickname || user.profile.nickname || user.profile.title || user.profile.name;
}

// 쉬운 미션: 초성과 중성이 일치하는지 확인
function matchesEasyMission(char, missionChar) {
	if (!$data.room.opts.easymission) return false;

	var charCode = char.charCodeAt(0) - 0xAC00;
	var missionCode = missionChar.charCodeAt(0) - 0xAC00;

	// 한글 범위 체크
	if (charCode < 0 || charCode > 11171 || missionCode < 0 || missionCode > 11171) {
		return false;
	}

	// 28로 나눈 몫이 같으면 초성+중성이 같음
	return Math.floor(charCode / 28) === Math.floor(missionCode / 28);
}
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
			afkWarn: $("#AfkWarnDiag"),
			afkWarnOk: $("#afk-warn-ok"),
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
			exchangeWorkshop: $("#ExchangeDiag"),
			excCompose: $("#exc-compose"),
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
		$sel.on('change', function() {
			var tip = PACK_TOOLTIP[$(this).val()];
			$('#sound-pack-info').toggle(!!tip).text(tip || '');
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
		var currentRule = RULE[MODE[$("#room-mode").val()]];
		var isCoopMode = currentRule && currentRule.coop;
		var outOfRange = isCoopMode ? (value < 5 || value > 50) : (value < 1 || value > 10);

		if (outOfRange) {
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
		var _spTip = PACK_TOOLTIP[$("#sound-pack").val()];
		$('#sound-pack-info').toggle(!!_spTip).text(_spTip || '');

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

		// 테마 설정
		$("#theme-setting").val(savedSettings.theme || 'blue');

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
		var scopeOpts = ['ext', 'str', 'loa', 'unk', 'lng', 'prv', 'ret', 'obo', 'alp'];
		var bonusOpts = ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'bbg', 'flu', 'jkp', 'dfb'];

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
			updateGameOptions(rule.opts, 'room-simple');
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
		// 코옵 모드: 라운드 수 입력칸을 목표 문제 수(5~50) 입력칸으로 전환
		// (updateSurvivalUI 호출 뒤에 와야 라벨이 덮어써지지 않음)
		if (rule.coop) {
			$("#room-round").attr({ min: 5, max: 50 }).val(Math.max(5, Math.min(50, Number($("#room-round").val()) || 5)));
			$("#room-round-label").text(L['coopTurns']);
		} else {
			$("#room-round").attr({ min: 1, max: 10 });
			$("#room-round-label").text(mobile ? L['numRound'] : L['roundSetting']);
		}
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
		var scopeOpts = ['ext', 'str', 'loa', 'unk', 'lng', 'prv', 'ret', 'obo', 'alp'];
		var bonusOpts = ['mis', 'eam', 'rdm', 'mpl', 'spt', 'stt', 'bbg', 'flu', 'jkp', 'dfb'];

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
			location.href = location.pathname + search;
			return; // 리로드 하니까 여기서 중단
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
	$stage.dialog.excCompose.on('click', function (e) {
		if (!$stage.dialog.excCompose.hasClass("exc-exchangeable")) return fail(458);
		if (!$data._excResult) return fail(458);

		showConfirm(L['excSureExchange'], function (res) {
			if (!res) return;

			$.post("/exchange", {
				items: JSON.stringify($data._excTray)
			}, function (res) {
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
			$("#room-flush, #view-all-flush, #view-all-flat-flush").prop('checked', false).prop('disabled', true);
		} else {
			if (!$("#room-random").is(':checked')) {
				$("#room-flush, #view-all-flush, #view-all-flat-flush").prop('disabled', false);
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
			$("#room-flush, #view-all-flush, #view-all-flat-flush").prop('checked', false).prop('disabled', true);
		} else {
			$("#room-second, #room-speedtoss").prop('disabled', false);
			$("#room-flat-second, #room-flat-speedtoss").prop('disabled', false);
			$("#room-simple-second, #room-simple-speedtoss").prop('disabled', false);
			$("#view-all-second, #view-all-speedtoss").prop('disabled', false);
			$("#view-all-flat-second, #view-all-flat-speedtoss").prop('disabled', false);
			if (!$("#room-first").is(':checked')) {
				$("#room-flush, #view-all-flush, #view-all-flat-flush").prop('disabled', false);
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

	// 8. 서바이벌 모드 UI 변경
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

$lib.Classic.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$stage.game.display.html(getCharText(data.char, data.subChar));
	$stage.game.chain.show().html($data.chain = 0);
	if ($data.room.opts.mission) {
		$stage.game.items.show().css('opacity', 1).html($data.mission = data.mission);
	}
	if (MODE[$data.room.mode] == "KAP" || MODE[$data.room.mode] == "KAK" || MODE[$data.room.mode] == "EAP" || MODE[$data.room.mode] == "EAK") {
		$(".jjoDisplayBar .graph-bar").css({ 'float': "right", 'text-align': "left" });
	}
	drawRound(data.round);
	playSound('round_start');
	$data._nextIsDefense = false;
	$data._nextIsFlushDefense = false;
	recordEvent('roundReady', { data: data });
};
$lib.Classic.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	if (!($data._tid = $data.room.game.seq[data.turn])) return;
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	var charHtml = getCharText(data.char, data.subChar, data.wordLength, data.sumiChar);
	$stage.game.display.html($data._char = charHtml);
	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		if (data.id == $data.id) {
			$stage.game.here.css('opacity', 1).show();
		} else if (mobile) {
			$stage.game.here.css('opacity', 0.5).show();
		} else {
			$stage.game.here.hide();
		}
		if (data.id == $data.id) {
			$data._relay = true;
			// 입력창 클리어 제거 - 사용자가 입력 중인 내용 유지
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}
	$stage.game.items.html($data.mission = data.mission);

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._chars = [data.char, data.subChar];
	$data._speed = data.speed;
	$data._isHanbang = data.isHanbang || false; // 한방 여부 저장
	$data._tTime = addInterval(turnGoing, TICK);
	$data.turnTime = data.turnTime;
	$data._turnTime = data.turnTime;
	$data._roundTime = data.roundTime;
	$data._turnSound = playSound("T" + data.speed);
	recordEvent('turnStart', {
		data: data
	});
};
$lib.Classic.turnGoing = function () {
	if (!$data.room) clearInterval($data._tTime);
	$data._turnTime -= TICK;
	$data._roundTime -= TICK;

	$stage.game.turnBar
		.width($data._timePercent())
		.html((Math.round($data._turnTime / 100) / 10).toFixed(1) + L['SECOND']);
	$stage.game.roundBar
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html((Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND']);

	if (!$stage.game.roundBar.hasClass("round-extreme")) if ($data._roundTime <= 5000) $stage.game.roundBar.addClass("round-extreme");
};
$lib.Classic.turnEnd = function (id, data) {
	var baseScore = data.score - (data.bonus || 0) - (data.speedToss || 0) - (data.straightBonus || 0) - (data.flushBonus || 0) - (data.jackpotBonus || 0) - (data.defenseBonus || 0);
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + baseScore) : data.score);
	var $uc = $(".game-user-current");
	var hi;

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	// ========== 서바이벌 모드 처리 ==========
	if (handleSurvivalKO(id, data, $sc, $uc)) return;
	handleSurvivalDamage(data);
	// ========== 서바이벌 모드 끝 ==========

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		checkFailCombo();
		clearTimeout($data._fail);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		$stage.game.chain.html(++$data.chain);
		// KJM: 자모 분해 문자열을 애니메이션으로 표시, 히스토리에는 원래 단어 기록
		var isDefense = !!$data._nextIsDefense || !!$data._nextIsFlushDefense;
		$data._nextIsDefense = !!data.isAttack;
		$data._nextIsFlushDefense = !!(data.flushBonus);
		if (data.jamoText) {
			var jamoDisplay = data.jamoText.slice(0, 500);
			var clampedLink = (typeof data.linkIndex !== 'undefined') ? Math.min(data.linkIndex, jamoDisplay.length - 1) : undefined;
			pushDisplay(jamoDisplay, data.mean, data.theme, data.wc, data.speedToss > 0, clampedLink, data.straightBonus > 0, data.isHanbang, data.fullHouseChars, data.value, !!data.isAttack, isDefense, !!(data.flushBonus), !!(data.jackpotBonus));
		} else {
			pushDisplay(data.value, data.mean, data.theme, data.wc, data.speedToss > 0, data.linkIndex, data.straightBonus > 0, data.isHanbang, data.fullHouseChars, undefined, !!data.isAttack, isDefense, !!(data.flushBonus), !!(data.jackpotBonus));
		}
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
	}
	if (data.hint) {
		data.hint = data.hint._id;
		hi = data.hint.indexOf($data._chars[0]);
		var matchedChar = $data._chars[0];
		if (hi == -1) {
			hi = data.hint.indexOf($data._chars[1]);
			matchedChar = $data._chars[1];
		}
		// 연결 글자 길이 (EKT/KKU는 2-3글자, 기본은 1글자)
		var charLen = matchedChar ? matchedChar.length : 1;

		if (MODE[$data.room.mode] == "KAP" || MODE[$data.room.mode] == "KAK" || MODE[$data.room.mode] == "EAP" || MODE[$data.room.mode] == "EAK") $stage.game.display.empty()
			.append($("<label>").css('color', "#AAAAAA").html(data.hint.slice(0, hi)))
			.append($("<label>").html(data.hint.slice(hi)));
		else {
			$stage.game.display.empty();
			if (hi > 0) $stage.game.display.append($("<label>").css('color', "#AAAAAA").html(data.hint.slice(0, hi)));
			$stage.game.display.append($("<label>").html(data.hint.slice(hi, hi + charLen)))
				.append($("<label>").css('color', "#AAAAAA").html(data.hint.slice(hi + charLen)));
		}
	}
	// 서바이벌 모드에서는 자신의 점수/보너스 스플래시 숨김 (데미지만 표시)
	if (!data.survival) {
		var nextDelay = 500;
		if (data.bonus) {
			mobile ? $sc.html("+" + baseScore + "+" + data.bonus) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore bonus").css('color', BONUS_COLORS.missionRev).html("+" + data.bonus));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		if (data.speedToss) {
			mobile ? $sc.append("+" + data.speedToss) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore sumi-sanggwan").css('color', BONUS_COLORS.sumi).html("+" + data.speedToss));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		if (data.straightBonus) {
			mobile ? $sc.append("+" + data.straightBonus) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore straight-bonus").css('color', BONUS_COLORS.straight).html("+" + data.straightBonus));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		if (data.fullHouseBonus) {
			mobile ? $sc.append("+" + data.fullHouseBonus) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore full-house-bonus").css('color', BONUS_COLORS.fullhouse).html("+" + data.fullHouseBonus));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		if (data.flushBonus) {
			mobile ? $sc.append("+" + data.flushBonus) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore flush-bonus").css('color', BONUS_COLORS.flush).html("+" + data.flushBonus));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		if (data.jackpotBonus) {
			mobile ? $sc.append("+" + data.jackpotBonus) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore jackpot-bonus").css({ 'color': BONUS_COLORS.jackpot, 'text-shadow': BONUS_COLORS.jackpotShadow }).html("+" + data.jackpotBonus));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		if (data.defenseBonus) {
			mobile ? $sc.append("+" + data.defenseBonus) : addTimeout((function ($target, d) {
				return function () {
					drawObtainedScore($target, $("<div>").addClass("deltaScore defense-bonus").css('color', BONUS_COLORS.defense).html("+" + data.defenseBonus));
				};
			})($uc, nextDelay), nextDelay);
			nextDelay += 100;
		}
		drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	} else {
		// 서바이벌 모드: 스플래시 없이 current 클래스만 제거
		$uc.removeClass("game-user-current").css('border-color', '');
	}
	updateScore(id, getScore(id));
};

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

$lib.Jaqwi.roundReady = function (data) {
	var tv = L['jqTheme'] + ": " + L['theme_' + data.theme];

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.display.html(tv);
	$stage.game.items.hide();
	$stage.game.hints.show();
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html(tv)
		.css('text-align', "center");
	drawRound(data.round);
	playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Jaqwi.turnStart = function (data) {
	$(".game-user-current").removeClass("game-user-current");
	$(".game-user-bomb").removeClass("game-user-bomb");
	if ($data.room.game.seq.indexOf($data.id) >= 0) {
		$stage.game.here.css('opacity', 1).show();
	} else if (mobile) {
		$stage.game.here.css('opacity', 0.5).show();
	} else {
		$stage.game.here.hide();
	}
	var tVal = data.char;
	if ($data.room.opts.drg) tVal = "<label style='color:" + getRandomColor() + "'>" + tVal + "</label>";
	$stage.game.display.html($data._char = tVal);
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Jaqwi.turnGoing = function () {
	var $rtb = $stage.game.roundBar;
	var bRate;
	var tt;

	if (!$data.room || !$data.room.gaming) clearInterval($data._tTime);
	$data._roundTime -= TICK;

	tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html(tt);

	if (!$rtb.hasClass("round-extreme")) if ($data._roundTime <= $data._fastTime) {
		if ($data.bgm) {
			bRate = $data.bgm.currentTime / $data.bgm.duration;
			if ($data.bgm.paused) stopBGM();
			else playBGM('jaqwiF');
			$data.bgm.currentTime = $data.bgm.duration * bRate;
		}
		$rtb.addClass("round-extreme");
	}
};
$lib.Jaqwi.turnHint = function (data) {
	playSound('mission');
	pushHint(data.hint);
};
$lib.Jaqwi.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (data.giveup) {
		$uc.addClass("game-user-bomb");
	} else if (data.answer) {
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		var ansColor = ($data.room.opts.drg) ? getRandomColor() : "#FFFF44";
		$stage.game.display.html($("<label>").css('color', ansColor).html(data.answer));
		stopBGM();
		playSound('horr');
	} else {
		// if(data.mean) turnHint(data);
		if (id == $data.id) mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		addScore(id, data.score, data.totalScore);
		if ($data._roundTime > 10000) $data._roundTime = 10000;
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id)).addClass("game-user-current");
		playSound('success');
	}
};

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

$lib.Crossword.roundReady = function (data, spec) {
	var turn = data.seq ? data.seq.indexOf($data.id) : -1;

	clearBoard();
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 30000;
	$data.selectedRound = (turn == -1) ? 1 : (turn % $data.room.round + 1);
	$stage.game.items.hide();
	$stage.game.cwcmd.show().css('opacity', 0);
	// 십자말풀이는 채팅창으로 입력하므로 게임 입력창 숨김
	$stage.game.here.hide();
	drawRound($data.selectedRound);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Crossword.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);
	var $cr;
	var key;

	if (data.score) {
		key = data.pos.join(',');
		if (id == $data.id) {
			$stage.game.cwcmd.css('opacity', 0);
			playSound('success');
		} else {
			if ($data._sel) if (data.pos.join(',') == $data._sel.join(',')) $stage.game.cwcmd.css('opacity', 0);
			playSound('mission');
		}
		$data._bdb[key][4] = data.value;
		$data._bdb[key][5] = id;
		if (data.pos[0] == $data.selectedRound - 1) $lib.Crossword.drawDisplay();
		else {
			$cr = $($stage.game.round.children("label").get(data.pos[0])).addClass("round-effect");
			addTimeout(function () { $cr.removeClass("round-effect"); }, 800);
		}
		addScore(id, data.score, data.totalScore);
		updateScore(id, getScore(id));
		drawObtainedScore($uc, $sc);
	} else {
		stopBGM();
		$stage.game.round.empty();
		playSound('horr');
	}
};
$lib.Crossword.drawDisplay = function () {
	var CELL = 100 / 8;
	var board = $data._boards[$data.selectedRound - 1];
	var $pane = $stage.game.display.empty();
	var $bar;
	var i, j, x, y, vert, len, word, key;
	var $w = {};

	for (i in board) {
		x = Number(board[i][0]);
		y = Number(board[i][1]);
		vert = board[i][2] == "1";
		len = Number(board[i][3]);
		word = board[i][4];
		$pane.append($bar = $("<div>").addClass("cw-bar")
			.attr('id', "cw-" + x + "-" + y + "-" + board[i][2])
			.css({
				top: y * CELL + "%", left: x * CELL + "%",
				width: (vert ? 1 : len) * CELL + "%",
				height: (vert ? len : 1) * CELL + "%"
			})
		);
		if (word) $bar.addClass("cw-open");
		if (board[i][5] == $data.id) $bar.addClass("cw-my-open");
		else $bar.on('click', $lib.Crossword.onBar).on('mouseleave', $lib.Crossword.onSwap);
		for (j = 0; j < len; j++) {
			key = x + "-" + y;

			if (word) $w[key] = word.charAt(j);
			$bar.append($("<div>").addClass("cw-cell")
				.attr('id', "cwc-" + key)
				.css({
					'box-sizing': 'border-box',
					width: vert ? 'calc(100% - 6px)' : 'calc(' + (100 / len) + '% - 6px)',
					height: vert ? 'calc(' + (100 / len) + '% - 6px)' : 'calc(100% - 6px)',
					color: ($data.room.opts.drg ? getRandomColor() : '')
				})
				.html($w[key] || "")
			);
			if (vert) y++; else x++;
		}
	}
};
$lib.Crossword.onSwap = function (e) {
	$stage.game.display.prepend($(e.currentTarget));
};
$lib.Crossword.onRound = function (e) {
	var round = $(e.currentTarget).html().charCodeAt(0) - 9311;

	drawRound($data.selectedRound = round);
	$(".rounds label").on('click', $lib.Crossword.onRound);
	$lib.Crossword.drawDisplay();
};
$lib.Crossword.onBar = function (e) {
	var $bar = $(e.currentTarget);
	var pos = $bar.attr('id').slice(3).split('-');
	var data = $data._means[$data.selectedRound - 1][pos.join(',')];
	var vert = data.dir == "1";

	$stage.game.cwcmd.css('opacity', 1);
	$data._sel = [$data.selectedRound - 1, Number(pos[0]), Number(pos[1]), pos[2]];
	$(".cw-q-head").html(L[vert ? 'cwVert' : 'cwHorz'] + data.len + L['cwL']);
	$("#cw-q-input").val("").focus();
	$(".cw-q-body").html(processWord("★", data.mean, data.theme, data.type.split(',')));
};
$lib.Crossword.turnStart = function (data, spec) {
	var i, j;

	$data._bdb = {};
	$data._boards = data.boards;
	$data._means = data.means;
	for (i in data.boards) {
		for (j in data.boards[i]) {
			$data._bdb[[i, data.boards[i][j][0], data.boards[i][j][1], data.boards[i][j][2]].join(',')] = data.boards[i][j];
		}
	}
	$(".rounds label").on('click', $lib.Crossword.onRound);
	$lib.Crossword.drawDisplay();
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Crossword.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Crossword.turnHint = function (data) {
	playSound('fail');
};

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

$lib.Typing = $lib.Typing || {};
$lib.Typing._restTimer = null;

$lib.Typing.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	// 이전 라운드의 restGoing 타이머 취소
	if ($lib.Typing._restTimer) {
		clearTimeout($lib.Typing._restTimer);
		$lib.Typing._restTimer = null;
	}

	$data._chatter = $stage.talk;
	clearBoard();
	$data._round = data.round;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data._list = data.list.concat(data.list);
	$data.chain = 0;
	$data.long = data.long;
	$(".game-user-bomb").removeClass("game-user-bomb");

	// 노란 바 초기화 (이전 라운드의 카운트다운 제거)
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html("")
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	var modeCode = MODE[$data.room.mode];
	var isTopicTypingMode = (modeCode === 'KTT' || modeCode === 'ETT');
	if (isTopicTypingMode) {
		var themeStr = (L['theme_' + data.theme]) || data.theme || '';
		var placeholderMark = data.hasPlaceholder ? " (!)" : "";
		$stage.game.display.html("&lt;" + themeStr + placeholderMark + "&gt;");
		var lv = data.long ? 2 : 5;
		$(".jjo-turn-time .graph-bar")
			.html($data._list.slice(0, lv).join(' '));
	} else {
		drawList();
	}
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};
function onSpace(e) {
	if (e.keyCode == 32 && $data._spaced) {
		$stage.chatBtn.trigger('click');
		e.preventDefault();
	}
}
function drawList() {
	var wl = $data._list.slice($data.chain);
	var lv = $data.room.opts.proverb ? 1 : ($data.long ? 2 : 5);
	var pts = "";
	var w0l = wl[0].length;

	if (w0l >= 20) pts = "18px";
	if (w0l >= 50) pts = "15px";
	$stage.game.display.css('font-size', pts);
	var wColor = ($data.room.opts.drg) ? getRandomColor() : "#FFFF44";
	wl[0] = "<label style='color: " + wColor + ";'>" + wl[0] + "</label>";
	$stage.game.display.html(wl.slice(0, lv).join(' '));
	$stage.game.chain.show().html($data.chain);
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html(wl.slice(lv, 2 * lv).join(' '))
		.css({ 'text-align': "center", 'background-color': "#70712D" });
}
$lib.Typing.spaceOn = function () {
	if ($data.room.opts.proverb) return;
	$data._spaced = true;
	$("body").on('keydown', "#" + $data._chatter.attr('id'), onSpace);
};
$lib.Typing.spaceOff = function () {
	delete $data._spaced;
	$("body").off('keydown', "#" + $data._chatter.attr('id'), onSpace);
};
$lib.Typing.turnStart = function (data) {
	var modeCode = MODE[$data.room.mode];
	if (modeCode === 'KTT' || modeCode === 'ETT') {
		drawList();
	}
	if (!$data._spectate) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		// 입력창 클리어 제거 - 사용자가 입력 중인 내용 유지
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		$lib.Typing.spaceOn();
	}
	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._tTime = addInterval(turnGoing, TICK);
	$data._roundTime = data.roundTime;
	playBGM('jaqwi');
	recordEvent('turnStart', {
		data: data
	});
};
$lib.Typing.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Typing.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (id == $data.id) $data._relay = false;

	if (data.error) {
		$data.chain++;
		drawList();
		playSound('fail');
	} else if (data.ok) {
		if ($data.id == id) {
			$data.chain++;
			drawList();
			playSound('mission');
			pushHistory(data.value, "");
		} else if ($data._spectate) {
			playSound('mission');
		}
		addScore(id, data.score, data.totalScore);
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id));
	} else {
		if (data.speed) {
			clearInterval($data._tTime);
			$data._relay = false;
			$lib.Typing.spaceOff();
			$stage.game.here.hide();

			addTimeout(drawSpeed, 1000, data.speed);
			stopBGM();
			playSound('horr');
			if ($data._round < $data.room.round) restGoing(10);
		} else {
			if (id == $data.id) {
				mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
				$(".jjo-turn-time .graph-bar")
					.html("GAME OVER")
					.css({ 'text-align': "center" });
			}
			$uc.addClass("game-user-bomb");
			playSound('timeout');
		}
	}
};
function restGoing(rest) {
	$(".jjo-turn-time .graph-bar")
		.html(rest + L['afterRun']);
	if (rest > 0) {
		$lib.Typing._restTimer = addTimeout(restGoing, 1000, rest - 1);
	} else {
		$lib.Typing._restTimer = null;
	}
}
function drawSpeed(table) {
	var i;

	for (i in table) {
		$("#game-user-" + i + " .game-user-score").empty()
			.append($("<div>").css({ 'float': "none", 'color': "#4444FF", 'text-align': "center" }).html(table[i] + "<label style='font-size: 11px;'>" + L['kpm'] + "</label>"));
	}
}

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

$lib.Hunmin.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	var tStr = "&lt;" + data.theme + "&gt;";
	if ($data.room.opts.drg) tStr = "<label style='color:" + getRandomColor() + "'>" + tStr + "</label>";
	$stage.game.display.html($data._char = tStr);
	$stage.game.chain.show().html($data.chain = 0);
	if ($data.room.opts.mission) {
		$stage.game.items.show().css('opacity', 1).html($data.mission = data.mission);
	}
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};
$lib.Hunmin.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	$stage.game.display.html($data._char);
	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		if (data.id == $data.id) {
			$stage.game.here.css('opacity', 1).show();
		} else if (mobile) {
			$stage.game.here.css('opacity', 0.5).show();
		} else {
			$stage.game.here.hide();
		}
		if (data.id == $data.id) {
			$data._relay = true;
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}
	$stage.game.items.html($data.mission = data.mission);

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._chars = [data.char, data.subChar];
	$data._speed = data.speed;
	$data._tTime = addInterval(turnGoing, TICK);
	$data.turnTime = data.turnTime;
	$data._turnTime = data.turnTime;
	$data._roundTime = data.roundTime;
	$data._turnSound = playSound("T" + data.speed);
	recordEvent('turnStart', {
		data: data
	});
};
$lib.Hunmin.turnGoing = $lib.Classic.turnGoing;
$lib.Hunmin.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + (data.score - (data.bonus || 0))) : data.score);
	var $uc = $(".game-user-current");
	var hi;

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	// ========== 서바이벌 모드 처리 ==========
	if (handleSurvivalKO(id, data, $sc, $uc)) return;
	handleSurvivalDamage(data);
	// ========== 서바이벌 모드 끝 ==========

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		checkFailCombo();
		clearTimeout($data._fail);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		$stage.game.chain.html(++$data.chain);
		pushDisplay(data.value, data.mean, data.theme, data.wc);
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
	}
	if (data.hint) {
		data.hint = data.hint._id;
		hi = data.hint.indexOf($data._chars[0]);
		if (hi == -1) hi = data.hint.indexOf($data._chars[1]);

		$stage.game.display.empty()
			.append($("<label>").html(data.hint.slice(0, hi + 1)))
			.append($("<label>").css('color', "#AAAAAA").html(data.hint.slice(hi + 1)));
	}
	// 서바이벌 모드에서는 자신의 점수/보너스 스플래시 숨김 (데미지만 표시)
	if (!data.survival) {
		if (data.bonus) {
			mobile ? $sc.html("+" + (data.score - data.bonus) + "+" + data.bonus) : addTimeout(function () {
				var $bc = $("<div>")
					.addClass("deltaScore bonus")
					.css('color', '#66FF66') // Green
					.html("+" + data.bonus);

				drawObtainedScore($uc, $bc);
			}, 500);
		}
		drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	} else {
		// 서바이벌 모드: 스플래시 없이 current 클래스만 제거
		$uc.removeClass("game-user-current").css('border-color', '');
	}
	updateScore(id, getScore(id));
};

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

$lib.Daneo.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	var theme = (typeof data.theme == "object")
		? data.theme.map(function (e) { return L['theme_' + e]; }).join(",")
		: L['theme_' + data.theme];
	var tStr = "&lt;" + theme + "&gt;";
	if ($data.room.opts.drg) tStr = "<label style='color:" + getRandomColor() + "'>" + tStr + "</label>";
	$stage.game.display.html($data._char = tStr);
	$stage.game.chain.show().html($data.chain = 0);
	if ($data.room.opts.mission) {
		$stage.game.items.show().css('opacity', 1).html($data.mission = data.mission);
	}
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};
$lib.Daneo.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	$stage.game.display.html($data._char);
	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		if (data.id == $data.id) {
			$stage.game.here.css('opacity', 1).show();
		} else if (mobile) {
			$stage.game.here.css('opacity', 0.5).show();
		} else {
			$stage.game.here.hide();
		}
		if (data.id == $data.id) {
			$data._relay = true;
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}
	$stage.game.items.html($data.mission = data.mission);

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._chars = [data.char, data.subChar];
	$data._speed = data.speed;
	$data._tTime = addInterval(turnGoing, TICK);
	$data.turnTime = data.turnTime;
	$data._turnTime = data.turnTime;
	$data._roundTime = data.roundTime;
	$data._turnSound = playSound("T" + data.speed);
	recordEvent('turnStart', {
		data: data
	});
};
$lib.Daneo.turnGoing = $lib.Classic.turnGoing;
$lib.Daneo.turnEnd = function (id, data) {
	var baseScore = data.score - (data.bonus || 0) - (data.straightBonus || 0);
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + baseScore) : data.score);
	var $uc = $(".game-user-current");
	var hi;

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	// ========== 서바이벌 모드 처리 ==========
	if (handleSurvivalKO(id, data, $sc, $uc)) return;
	handleSurvivalDamage(data);
	// ========== 서바이벌 모드 끝 ==========

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		clearTimeout($data._fail);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		$stage.game.chain.html(++$data.chain);
		pushDisplay(data.value, data.mean, data.theme, data.wc, false, null, data.straightBonus > 0, false, data.fullHouseChars);
	} else {
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
	}
	if (data.hint) {
		data.hint = data.hint._id;
		hi = data.hint.indexOf($data._chars[0]);
		if (hi == -1) hi = data.hint.indexOf($data._chars[1]);

		$stage.game.display.empty()
			.append($("<label>").html(data.hint.slice(0, hi + 1)))
			.append($("<label>").css('color', "#AAAAAA").html(data.hint.slice(hi + 1)));
	}
	// 서바이벌 모드에서는 자신의 점수/보너스 스플래시 숨김 (데미지만 표시)
	if (!data.survival) {
		if (data.bonus) {
			mobile ? $sc.html("+" + baseScore + "+" + data.bonus) : addTimeout((function ($target) {
				return function () {
					var $bc = $("<div>")
						.addClass("deltaScore bonus")
						.css('color', '#66FF66') // Green
						.html("+" + data.bonus);

					drawObtainedScore($target, $bc);
				};
			})($uc), 500);
		}
		if (data.straightBonus) {
			mobile ? $sc.append("+" + data.straightBonus) : addTimeout((function ($target) {
				return function () {
					var $bc = $("<div>")
						.addClass("deltaScore straight-bonus")
						.css('color', '#FFFF00') // Yellow
						.html("+" + data.straightBonus);

					drawObtainedScore($target, $bc);
				};
			})($uc), 800);
		}
		if (data.fullHouseBonus) {
			mobile ? $sc.append("+" + data.fullHouseBonus) : addTimeout((function ($target) {
				return function () {
					var $bc = $("<div>")
						.addClass("deltaScore full-house-bonus")
						.css('color', '#c26eff') // Purple
						.html("+" + data.fullHouseBonus);

					drawObtainedScore($target, $bc);
				};
			})($uc), 1100); // Trigger after straight bonus
		}
		drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	} else {
		// 서바이벌 모드: 스플래시 없이 current 클래스만 제거
		$uc.removeClass("game-user-current").css('border-color', '');
	}
	updateScore(id, getScore(id));
};

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

$lib.Free = {};
$lib.Free.roundReady = function (data) {
    var i, len = $data.room.game.title.length;

    clearBoard();
    $data._roundTime = $data.room.time * 1000;

    var modeCode = MODE[$data.room.mode];
    var isTopicFreeMode = (modeCode === 'KTF' || modeCode === 'ETF');
    var tStr;
    if (isTopicFreeMode && $data.room.opts.injpick && $data.room.opts.injpick.length) {
        var allPicks = $data.room.opts.injpick;
        var picks = allPicks.slice(0, 3);
        var names = picks.map(function (t) { return (L && L['theme_' + t]) || t; });
        var suffix = allPicks.length >= 4 ? ', ...' : '';
        tStr = "&lt;" + names.join(', ') + suffix + "&gt;";
    } else {
        tStr = "&lt;" + (L && L['anything'] ? L['anything'] : "아무거나") + "&gt;";
    }
    if ($data.room.opts.drg) tStr = "<label style='color:" + getRandomColor() + "'>" + tStr + "</label>";
    $stage.game.display.html($data._char = tStr);

    $stage.game.chain.show().html($data.chain = 0);
    if ($data.room.opts.mission) {
        $stage.game.items.show().css('opacity', 1).html($data.mission = data.mission);
    }
    drawRound(data.round);
    playSound('round_start');
    recordEvent('roundReady', { data: data });
};

$lib.Free.turnStart = function (data) {
    $data.room.game.turn = data.turn;
    if (data.seq) $data.room.game.seq = data.seq;
    if (!($data._tid = $data.room.game.seq[data.turn])) return;
    if ($data._tid.robot) $data._tid = $data._tid.id;
    data.id = $data._tid;

    // Keep the display as is (set in roundReady)
    $stage.game.display.html($data._char);

    var $u = $("#game-user-" + data.id).addClass("game-user-current");
    if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
    if (!$data._replay) {
        if (data.id == $data.id) {
            $stage.game.here.css('opacity', 1).show();
        } else if (mobile) {
            $stage.game.here.css('opacity', 0.5).show();
        } else {
            $stage.game.here.hide();
        }
        if (data.id == $data.id) {
            $data._relay = true;
            mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
        }
    }
    $stage.game.items.html($data.mission = data.mission);

    ws.onmessage = _onMessage;
    clearInterval($data._tTime);
    clearTrespasses();
    // No specific chars to track
    $data._chars = [];
    $data._speed = data.speed;
    $data._tTime = addInterval(turnGoing, TICK);
    $data.turnTime = data.turnTime;
    $data._turnTime = data.turnTime;
    $data._roundTime = data.roundTime;
    $data._turnSound = playSound("T" + data.speed);
    recordEvent('turnStart', {
        data: data
    });
};

$lib.Free.turnGoing = $lib.Classic.turnGoing;
$lib.Free.turnEnd = function (id, data) {
    var baseScore = data.score - (data.bonus || 0) - (data.straightBonus || 0);
    var $sc = $("<div>")
        .addClass("deltaScore")
        .html((data.score > 0) ? ("+" + baseScore) : data.score);
    var $uc = $(".game-user-current");
    var hi;

    if ($data._turnSound) $data._turnSound.stop();
    if (id == $data.id) $data._relay = false;
    clearInterval($data._tTime);

    // ========== 서바이벌 모드 처리 ==========
    if (handleSurvivalKO(id, data, $sc, $uc)) return;
    handleSurvivalDamage(data);
    // ========== 서바이벌 모드 끝 ==========

    addScore(id, data.score, data.totalScore);
    if (data.ok) {
        checkFailCombo();
        clearTimeout($data._fail);
        mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
        $stage.game.chain.html(++$data.chain);
        pushDisplay(data.value, data.mean, data.theme, data.wc, false, null, data.straightBonus > 0, false, data.fullHouseChars);
    } else {
        checkFailCombo(id);
        $sc.addClass("lost");
        $(".game-user-current").addClass("game-user-bomb");
        mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
        playSound('timeout');
    }
    if (data.hint) {
        // Just display the hint word without special highlighting
        $stage.game.display.empty()
            .append($("<label>").html(data.hint));
    }
    // 서바이벌 모드에서는 자신의 점수/보너스 스플래시 숨김 (데미지만 표시)
    if (!data.survival) {
        if (data.bonus) {
            mobile ? $sc.html("+" + baseScore + "+" + data.bonus) : addTimeout((function ($target) {
                return function () {
                    var $bc = $("<div>")
                        .addClass("deltaScore bonus")
                        .css('color', '#66FF66') // Green
                        .html("+" + data.bonus);

                    drawObtainedScore($target, $bc);
                };
            })($uc), 500);
        }
        if (data.straightBonus) {
            mobile ? $sc.append("+" + data.straightBonus) : addTimeout((function ($target) {
                return function () {
                    var $bc = $("<div>")
                        .addClass("deltaScore straight-bonus")
                        .css('color', '#FFFF00') // Yellow
                        .html("+" + data.straightBonus);

                    drawObtainedScore($target, $bc);
                };
            })($uc), 800);
        }
        if (data.fullHouseBonus) {
            mobile ? $sc.append("+" + data.fullHouseBonus) : addTimeout((function ($target) {
                return function () {
                    var $bc = $("<div>")
                        .addClass("deltaScore full-house-bonus")
                        .css('color', '#c26eff') // Purple
                        .html("+" + data.fullHouseBonus);

                    drawObtainedScore($target, $bc);
                };
            })($uc), 1100); // Trigger after straight bonus
        }
        drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
    } else {
        // 서바이벌 모드: 스플래시 없이 current 클래스만 제거
        $uc.removeClass("game-user-current").css('border-color', '');
    }
    updateScore(id, getScore(id));
};

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

$lib.Sock.roundReady = function (data, spec) {
	var turn = data.seq ? data.seq.indexOf($data.id) : -1;

	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._va = [];
	$data._lang = RULE[MODE[$data.room.mode]].lang;
	$data._board = data.board;
	$data._gameBoard = data.board;
	$data._maps = [];

	// apple 규칙 활성화 시 원래 설정 백업
	if ($data.room.opts && $data.room.opts.apple && !$data._originalSettings) {
		$data._originalSettings = {
			round: $data.room.round,
			time: $data.room.time
		};
	}

	// 서버에서 받은 effectiveRound와 effectiveTime을 사용 (apple 규칙 적용 시 서버에서 이미 계산됨)
	if (data.totalRound) $data.room.round = data.totalRound;
	if (data.time) $data.room.time = data.time;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.show();
	if (mobile) $stage.game.here.css({ 'opacity': 0.3, 'top': '-35px' }).show();
	else $stage.game.here.hide();
	$lib.Sock.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);

	// Bad Apple Logic
	if ($data._aplInterval) clearInterval($data._aplInterval);
	$data._aplMode = false;
	console.log("[APL] Checking apple option:", $data.room.opts, "apple=", $data.room.opts ? $data.room.opts.apple : "no opts");
	if ($data.room.opts && $data.room.opts.apple) {
		console.log("[APL] APL mode detected! Starting Bad Apple...");
		$data._aplMode = true;
		stopBGM();

		// 먼저 LZ-String 라이브러리 로드 (CDN 사용)
		$.getScript('https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js', function () {
			console.log("[APL] LZ-String library loaded");

			// 압축된 배드 애플 데이터 로드
			$.getScript('/js/bad_apple_data.js', function () {
				console.log("[APL] Compressed data loaded, decompressing...");

				// 압축 해제
				if (window.badAppleCompressed && window.LZString) {
					var decompressed = LZString.decompressFromBase64(window.badAppleCompressed);
					window.badAppleFrames = decompressed.split('|');
					console.log("[APL] Decompressed frames:", window.badAppleFrames.length);
				} else if (window.badAppleFrames) {
					// 이미 압축 해제된 데이터가 있는 경우 (하위 호환성)
					console.log("[APL] Using uncompressed frames:", window.badAppleFrames.length);
				} else {
					console.error("[APL] No frame data available!");
					return;
				}

				loadSounds([{ key: 'apple', value: '/media/common/apple.mp3' }], function () {
					console.log("[APL] Sound loaded, starting playback...");
					var frameIdx = 0;
					stopBGM();
					playSound('apple');
					$data._aplInterval = _setInterval(function () {
						if (frameIdx >= window.badAppleFrames.length) {
							clearInterval($data._aplInterval);
							return;
						}
						$data._aplFrame = window.badAppleFrames[frameIdx];
						$lib.Sock.drawDisplay();
						frameIdx++;
					}, 100);
				});
			});
		});
	}
};
$lib.Sock.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);
	var key;
	var i, j, l;

	if (data.score) {
		key = data.value;
		l = key.length;
		$data._maps.push(key);
		for (i = 0; i < l; i++) {
			if ($data._aplMode && $data._gameBoard) {
				$data._gameBoard = $data._gameBoard.replace(key.charAt(i), "　");
			} else {
				$data._board = $data._board.replace(key.charAt(i), "　");
			}
		}
		if (id == $data.id) {
			playSound('success');
		} else {
			playSound('mission');
		}
		$lib.Sock.drawDisplay();
		addScore(id, data.score, data.totalScore);
		updateScore(id, getScore(id));
		drawObtainedScore($uc, $sc);
	} else {
		stopBGM();
		$data._relay = false;
		playSound('horr');
	}
};
$lib.Sock.drawMaps = function () {
	var len = $data._maps.length;

	var cols = Math.max(2, Math.ceil(len / 18));

	$stage.game.bb.empty();
	// $stage.game.bb.css('--bb-cols', cols); // Removed CSS var approach
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	var widthPct = (100 / cols) + "%"; // Calculate percentage directly

	$data._maps.sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});
	function $word(text) {
		var $R = $("<div>").addClass("bb-word").css('width', widthPct);
		var i, len = text.length;
		var $c;

		for (i = 0; i < len; i++) {
			$R.append($c = $("<div>").addClass("bb-char").html(text.charAt(i)));
			if ($data.room.opts.drg) $c.css('color', getRandomColor());
			// if(text.charAt(i) != "？") $c.css('color', "#EEEEEE");
		}
		return $R;
	}
};
$lib.Sock.drawDisplay = function () {
	var $a = $("<div>").css('height', "100%"), $c;
	var boardStr = $data._board;

	// apple 모드: 배드 애플 프레임과 게임 보드 합성
	// 프레임 데이터는 14x11(154자), 위 1줄/아래 2줄은 항상 흰색(글자 표시)
	if ($data._aplMode && $data._aplFrame && $data._gameBoard) {
		var merged = '';
		for (var mi = 0; mi < 196; mi++) {
			var fi = mi - 14;
			var isBlack = (fi >= 0 && fi < $data._aplFrame.length && $data._aplFrame[fi] === '.');
			if (isBlack) {
				merged += '.';
			} else {
				var gc = mi < $data._gameBoard.length ? $data._gameBoard[mi] : '□';
				merged += (gc && gc !== '　') ? gc : '□';
			}
		}
		boardStr = merged;
	}

	var va = boardStr.split("");
	var len = Math.sqrt(boardStr.length);
	var size = (len >= 14) ? "7.1%" : "10%";
	var fontSize = (len > 10) ? "15px" : "";

	$a.css({ 'display': 'flex', 'flex-wrap': 'wrap', 'align-content': 'flex-start' });

	va.forEach(function (item, index) {
		$a.append($c = $("<div>").addClass("sock-char sock-" + item).css({ width: size, height: size, 'font-size': fontSize }).html(item));
		if ($data.room.opts.drg) $c.css('color', getRandomColor());
		if ($data._va[index] && $data._va[index] != item) {
			$c.html($data._va[index]).addClass("sock-picked").animate({ 'opacity': 0 }, 500);
		}
	});
	$data._va = va;
	$stage.game.display.empty().append($a);
	$lib.Sock.drawMaps();
};
$lib.Sock.turnStart = function (data, spec) {
	var i, j;

	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	// APL 모드에서는 jaqwi BGM 재생하지 않음
	if (!$data._aplMode) {
		playBGM('jaqwi');
	}
};
$lib.Sock.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Sock.turnHint = function (data) {
	playSound('fail');
};

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

// ㅁ 배치(1 2 3 / 8 · 4 / 7 6 5) 각 위치의 좌표(%)
var SHUK_SLOTS = [
	{ top: '0%', left: '0%' },
	{ top: '0%', left: '33.333%' },
	{ top: '0%', left: '66.667%' },
	{ top: '33.333%', left: '66.667%' },
	{ top: '66.667%', left: '66.667%' },
	{ top: '66.667%', left: '33.333%' },
	{ top: '66.667%', left: '0%' },
	{ top: '33.333%', left: '0%' }
];

$lib.Shuk.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._maps = [];
	if (data.totalRound) $data.room.round = data.totalRound;
	if (data.time) $data.room.time = data.time;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.show();
	if (mobile) $stage.game.here.css({ 'opacity': 0.3, 'top': '-35px' }).show();
	else $stage.game.here.hide();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Shuk.shukMove = function (data) {
	if ($data.room.opts.stop) return;
	var positions = data.positions;
	var i, $c;

	$data._positions = positions;
	if (!$data._shukEls) return;
	for (i = 0; i < positions.length; i++) {
		$c = $data._shukEls[positions[i]];
		if ($c) $c.css(SHUK_SLOTS[i]);
	}
};
$lib.Shuk.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (data.score) {
		$data._maps.push(data.value);
		if (id == $data.id) playSound('success');
		else playSound('mission');
		$lib.Shuk.drawMaps();
		addScore(id, data.score, data.totalScore);
		updateScore(id, getScore(id));
		drawObtainedScore($uc, $sc);
	} else {
		stopBGM();
		playSound('horr');
	}
};
$lib.Shuk.drawMaps = function () {
	var len = $data._maps.length;
	var cols = Math.max(2, Math.ceil(len / 18));
	var widthPct = (100 / cols) + "%";

	$stage.game.bb.empty();
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	$data._maps.sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});
	function $word(text) {
		var $R = $("<div>").addClass("bb-word").css('width', widthPct);
		var i, len = text.length;
		var $c;

		for (i = 0; i < len; i++) {
			$R.append($c = $("<div>").addClass("bb-char").html(text.charAt(i)));
			if ($data.room.opts.drg) $c.css('color', getRandomColor());
		}
		return $R;
	}
};
$lib.Shuk.drawDisplay = function () {
	var $a = $("<div>").addClass("shuk-board");
	var positions = $data._positions || [];
	var i, $c;

	$data._shukEls = {};
	for (i = 0; i < positions.length; i++) {
		$c = $("<div>").addClass("shuk-char").css(SHUK_SLOTS[i]).html(positions[i]);
		if ($data.room.opts.drg) $c.css('color', getRandomColor());
		$a.append($c);
		$data._shukEls[positions[i]] = $c;
	}
	$stage.game.display.empty().append($a);
	$a.height($stage.game.display.height());
	$lib.Shuk.drawMaps();
};
$lib.Shuk.turnStart = function (data, spec) {
	$data._positions = data.positions;
	$lib.Shuk.drawDisplay();
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Shuk.turnGoing = $lib.Jaqwi.turnGoing;

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

/**
 * Picture Quiz (그림퀴즈) Client-side Rule
 * Free-draw canvas version
 */

// Canvas settings
var PQ_CANVAS_W = 288;
var PQ_CANVAS_H = 180;
var PQ_BRUSH_SIZES = [3, 8, 16];
var PQ_THROTTLE_MS = 50;
var PQ_COLORS = [
    '#FFFFFF', '#C0C0C0', '#808080', '#000000',
    '#FF0000', '#FF8000', '#FFFF00', '#8df349',
    '#00AA00', '#00BFFF', '#0000FF', '#6c00d7',
    '#FF60B0', '#FFD180', '#804000'
];

$lib.Picture = {};

// --- Helpers ---
function pqHexToRgb(hex) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
}

function getCanvasPos(e) {
    var rect = $data._pqCanvasEl.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left) * (PQ_CANVAS_W / rect.width)),
        y: Math.round((e.clientY - rect.top) * (PQ_CANVAS_H / rect.height))
    };
}

// Pixel-perfect filled circle using scanline (no AA)
function pqFillCircle(ctx, cx, cy, r) {
    if (r === 0) { ctx.fillRect(cx, cy, 1, 1); return; }
    var r2 = r * r;
    for (var ry = -r; ry <= r; ry++) {
        var rx = Math.floor(Math.sqrt(r2 - ry * ry));
        ctx.fillRect(cx - rx, cy + ry, 2 * rx + 1, 1);
    }
}

// Pixel-perfect round brush stroke: stamps circles along the line (no AA)
function pqDrawPixelLine(ctx, x0, y0, x1, y1, color, width) {
    ctx.fillStyle = color;
    var r = Math.floor(width / 2);
    var dx = x1 - x0, dy = y1 - y0;
    var steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        pqFillCircle(ctx, Math.round(x0 + t * dx), Math.round(y0 + t * dy), r);
    }
}

function pqFloodFill(ctx, startX, startY, fillColor) {
    if (startX < 0 || startX >= PQ_CANVAS_W || startY < 0 || startY >= PQ_CANVAS_H) return;
    startX = Math.floor(startX);
    startY = Math.floor(startY);
    var imgData = ctx.getImageData(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);
    var data = imgData.data;
    var fc = pqHexToRgb(fillColor);

    var baseIdx = (startY * PQ_CANVAS_W + startX) * 4;
    var tr = data[baseIdx], tg = data[baseIdx + 1], tb = data[baseIdx + 2];

    // No-op if same color (or very close, preventing infinite loops with tolerance)
    if (Math.abs(tr - fc.r) < 2 && Math.abs(tg - fc.g) < 2 && Math.abs(tb - fc.b) < 2) return;

    var queue = [startX, startY];
    // Visited array to prevent duplicate processing
    var visited = new Uint8Array(PQ_CANVAS_W * PQ_CANVAS_H);
    visited[startY * PQ_CANVAS_W + startX] = 1;

    while (queue.length > 0) {
        var py = queue.pop();
        var px = queue.pop();
        var idx = (py * PQ_CANVAS_W + px) * 4;

        data[idx] = fc.r;
        data[idx + 1] = fc.g;
        data[idx + 2] = fc.b;
        data[idx + 3] = 255;

        // check 4 neighbors
        var neighbors = [
            [px - 1, py],
            [px + 1, py],
            [px, py - 1],
            [px, py + 1]
        ];

        for (var i = 0; i < 4; i++) {
            var nx = neighbors[i][0];
            var ny = neighbors[i][1];

            if (nx >= 0 && nx < PQ_CANVAS_W && ny >= 0 && ny < PQ_CANVAS_H) {
                var nPos = ny * PQ_CANVAS_W + nx;
                if (!visited[nPos]) {
                    var ni = nPos * 4;
                    // Tolerance for rendering and anti-aliasing color artifacts
                    if (Math.abs(data[ni] - tr) <= 5 && Math.abs(data[ni + 1] - tg) <= 5 && Math.abs(data[ni + 2] - tb) <= 5) {
                        visited[nPos] = 1;
                        queue.push(nx, ny);
                    }
                }
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

// Draw a stroke segment with pixel-perfect lines (no AA)
function drawStrokeSegment(ctx, pts, color, width, fromPt) {
    if (!ctx || !pts || pts.length === 0) return;

    if (fromPt) {
        pqDrawPixelLine(ctx, fromPt.x, fromPt.y, pts[0].x, pts[0].y, color, width);
        for (var i = 1; i < pts.length; i++) {
            pqDrawPixelLine(ctx, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, color, width);
        }
    } else {
        // Single dot for first point
        pqDrawPixelLine(ctx, pts[0].x, pts[0].y, pts[0].x, pts[0].y, color, width);
        for (var i = 1; i < pts.length; i++) {
            pqDrawPixelLine(ctx, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, color, width);
        }
    }
}

// Selects a color or eraser/fill and updates tool row visuals
function pqSelectTool(toolRow, type, value) {
    if (type === 'color' || type === 'custom') {
        // Deselect previous colors
        toolRow.find('.pq-color-btn').css('border', '1px solid #555');
        toolRow.find('.pq-custom-btn').css('border', '1px solid #555');

        $data._pqEraser = false;
        // Keep fill mode if we were in it, otherwise default to brush
        if ($data._pqMode !== 'fill') $data._pqMode = 'brush';
        $data._pqColor = value;

        if (type === 'color') {
            toolRow.find('.pq-color-btn[data-color="' + value + '"]').css('border', '2px solid #FFD700');
            toolRow.find('.pq-custom-btn').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
        } else if (type === 'custom') {
            toolRow.find('.pq-custom-btn').css({ 'background': value, 'border': '2px solid #FFD700' });
        }

        // Update tool highlights since eraser is deactivated
        toolRow.find('.pq-eraser-btn').css('border', '1px solid #555');
        if ($data._pqMode === 'fill') {
            toolRow.find('.pq-fill-btn').css('border', '2px solid #FFD700');
            toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
        } else {
            toolRow.find('.pq-fill-btn').css('border', '1px solid #555');
            toolRow.find('.pq-brush-btn').each(function () {
                if ($(this).attr('data-size') == $data._pqBrushSize) $(this).css('border', '2px solid #FFD700');
                else $(this).css('border', '1px solid #555');
            });
        }
    } else {
        // A tool was selected
        toolRow.find('.pq-eraser-btn').css('border', '1px solid #555');
        toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
        toolRow.find('.pq-fill-btn').css('border', '1px solid #555');

        if (type === 'eraser') {
            $data._pqEraser = true;
            $data._pqMode = 'brush';
            toolRow.find('.pq-eraser-btn').css('border', '2px solid #FFD700');
            // Remove color highlights to indicate erasing
            toolRow.find('.pq-color-btn').css('border', '1px solid #555');
            toolRow.find('.pq-custom-btn').css('border', '1px solid #555').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
        } else {
            $data._pqEraser = false;

            if (type === 'fill') {
                $data._pqMode = 'fill';
                toolRow.find('.pq-fill-btn').css('border', '2px solid #FFD700');
            } else if (type === 'brush') {
                $data._pqMode = 'brush';
                $data._pqBrushSize = value;
                // Highlight will be handled by the caller or we can do it here
            }

            // Restore active color highlight
            toolRow.find('.pq-color-btn').css('border', '1px solid #555');
            var $preset = toolRow.find('.pq-color-btn[data-color="' + $data._pqColor + '"]');
            if ($preset.length) {
                $preset.css('border', '2px solid #FFD700');
                toolRow.find('.pq-custom-btn').css('border', '1px solid #555').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
            } else {
                toolRow.find('.pq-custom-btn').css({ 'background': $data._pqColor, 'border': '2px solid #FFD700' });
            }
        }
    }
}

// --- Drawing stroke functions (drawer only) ---
function startStroke(e) {
    // 기존 스트로크가 진행 중이면 먼저 종료
    if ($data._pqDrawing) endStroke();

    var pos = getCanvasPos(e);
    var color = $data._pqEraser ? '#FFFFFF' : $data._pqColor;

    if ($data._pqMode === 'fill') {
        pqFloodFill($data._pqCtx, pos.x, pos.y, color);
        send('fill', { x: pos.x, y: pos.y, c: color });
        $data._pqStrokes.push({ fill: true, x: pos.x, y: pos.y, c: color });
        return;
    }

    $data._pqDrawing = true;
    $data._pqCurrentStroke = { c: color, w: $data._pqBrushSize, pts: [pos] };
    $data._pqPendingPoints = [pos];
    $data._pqLastDrawnPt = pos;

    // Draw single dot at start
    pqDrawPixelLine($data._pqCtx, pos.x, pos.y, pos.x, pos.y, color, $data._pqBrushSize);

    // 기존 타이머를 반드시 먼저 clear한 뒤 새로 시작 (누수 방지)
    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }
    $data._pqSendTimer = setInterval(flushPendingPoints, PQ_THROTTLE_MS);
}

function continueStroke(e) {
    if (!$data._pqDrawing) return;
    var pos = getCanvasPos(e);
    var stroke = $data._pqCurrentStroke;

    pqDrawPixelLine($data._pqCtx, $data._pqLastDrawnPt.x, $data._pqLastDrawnPt.y, pos.x, pos.y, stroke.c, stroke.w);
    $data._pqLastDrawnPt = pos;

    stroke.pts.push(pos);
    $data._pqPendingPoints.push(pos);
}

function endStroke() {
    if (!$data._pqDrawing) return;
    $data._pqDrawing = false;

    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }

    if ($data._pqPendingPoints.length > 0) {
        send('draw', {
            pts: $data._pqPendingPoints,
            c: $data._pqCurrentStroke.c,
            w: $data._pqCurrentStroke.w,
            cont: $data._pqCurrentStroke.pts.length > $data._pqPendingPoints.length,
            end: true
        });
    } else {
        send('draw', {
            pts: $data._pqCurrentStroke.pts.slice(-1),
            c: $data._pqCurrentStroke.c,
            w: $data._pqCurrentStroke.w,
            cont: true,
            end: true
        });
    }

    $data._pqPendingPoints = [];

    if ($data._pqCurrentStroke) {
        $data._pqStrokes.push($data._pqCurrentStroke);
        $data._pqCurrentStroke = null;
    }
}

function flushPendingPoints() {
    if (!$data._pqPendingPoints || $data._pqPendingPoints.length === 0) return;

    var isFirst = $data._pqCurrentStroke.pts.length <= $data._pqPendingPoints.length;
    send('draw', {
        pts: $data._pqPendingPoints,
        c: $data._pqCurrentStroke.c,
        w: $data._pqCurrentStroke.w,
        cont: !isFirst,
        end: false
    });
    $data._pqPendingPoints = [];
}

// ============================
// Main $lib.Picture functions
// ============================

$lib.Picture.roundReady = function (data, spec) {
    clearBoard();
    $data._relay = true;
    $data._roundTime = $data.room.time * 1000;
    $data._fastTime = 10000;
    $data._pqDrawer = data.drawer;
    $data._pqTheme = data.theme;
    $data._pqAnswer = data.answer;
    $data._pqStrokes = [];
    $data._pqColor = '#000000';
    $data._pqBrushSize = PQ_BRUSH_SIZES[1]; // 8px default
    $data._pqEraser = false;
    $data._pqMode = 'brush';
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqPassCount = data.passCount || 0;
    $data._pqGameStarted = false;
    $data._pqDrawing = false;
    $data._pqCurrentStroke = null;
    $data._pqPendingPoints = [];
    $data._pqLastDrawnPt = null;
    $data._pqRemoteLastPt = null;

    if ($data._pqPassBtnTimer) {
        clearTimeout($data._pqPassBtnTimer);
        $data._pqPassBtnTimer = null;
    }
    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }

    $(".jjoriping,.rounds,.game-body").addClass("cw");
    $(".jjoriping").css({ "float": "none", "margin": "0 auto" });
    $stage.game.items.hide();
    $stage.game.bb.hide();
    $stage.game.here.hide();

    $lib.Picture.drawDisplay();

    drawRound(data.round);
    if (!spec) playSound('round_start');
    clearInterval($data._tTime);

    $(".game-user-bomb").removeClass("game-user-bomb");
    $stage.game.roundBar.css('background-color', '');
    $data._pqUrgent = false;
    stopBGM();
};

$lib.Picture.drawDisplay = function () {
    var $main = $("<div>").css({
        'display': 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'flex-start',
        'height': '100%',
        'width': '100%',
        'padding': '3px',
        'box-sizing': 'border-box'
    });

    // Header
    var $header = $("<div>").css({
        'display': 'flex',
        'justify-content': 'space-between',
        'width': '100%',
        'padding': '0 10px',
        'box-sizing': 'border-box',
        'margin-bottom': '4px'
    });

    var isDrawer = $data._pqIsDrawer;

    var themeText = L['theme_' + $data._pqTheme] || $data._pqTheme;
    var $topic = $("<div>").css({
        'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
        'font-size': '12px',
        'font-weight': 'bold',
        'text-shadow': '1px 1px 1px #000'
    }).html(L['pqTheme'] + ": " + themeText);
    $header.append($topic);

    if (isDrawer && $data._pqAnswer) {
        $header.append($("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px', 'font-weight': 'bold', 'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer));
    } else if ($data._pqAnswer) {
        $header.append($("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px', 'font-weight': 'bold', 'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer.replace(/\s/g, '').length + (L['pqChars'] || "글자")));
    }
    $main.append($header);

    // Palette + tools (drawer only)
    if (isDrawer) {
        var $toolRow = $("<div>").css({
            'display': 'flex',
            'align-items': 'center',
            'gap': '4px',
            'padding': '3px',
            'background-color': 'rgba(0,0,0,0.4)',
            'border-radius': '3px',
            'margin-bottom': '4px',
            'flex-wrap': 'wrap',
            'justify-content': 'center',
            'max-width': (PQ_CANVAS_W + 6) + 'px'
        });

        // Preset color palette
        for (var i = 0; i < PQ_COLORS.length; i++) {
            (function (color) {
                var isSelected = (!$data._pqEraser && $data._pqMode === 'brush' && color === $data._pqColor);
                var $color = $("<div>")
                    .attr("data-color", color)
                    .addClass("pq-color-btn")
                    .css({
                        'width': '14px', 'height': '14px',
                        'border-radius': '50%',
                        'background-color': color,
                        'border': isSelected ? '2px solid #FFD700' : '1px solid #555',
                        'cursor': 'pointer',
                        'box-sizing': 'border-box',
                        'flex-shrink': '0'
                    });
                $color.on('click', function () {
                    pqSelectTool($toolRow, 'color', color);
                });
                $toolRow.append($color);
            })(PQ_COLORS[i]);
        }

        // Separator
        $toolRow.append($("<div>").css({
            'width': '1px', 'height': '14px',
            'background-color': 'rgba(255,255,255,0.3)',
            'margin': '0 2px', 'flex-shrink': '0'
        }));

        // Custom color picker
        var $customWrap = $("<div>").css({ 'position': 'relative', 'width': '14px', 'height': '14px', 'flex-shrink': '0' });
        var $customPreview = $("<div>")
            .addClass("pq-color-btn pq-custom-btn")
            .css({
                'width': '14px', 'height': '14px',
                'border-radius': '50%',
                'background': 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                'border': '1px solid #555',
                'cursor': 'pointer',
                'box-sizing': 'border-box'
            });
        var customInput = document.createElement('input');
        customInput.type = 'color';
        customInput.value = $data._pqColor;
        $(customInput).css({ 'position': 'absolute', 'top': '0', 'left': '0', 'width': '14px', 'height': '14px', 'opacity': '0', 'cursor': 'pointer' });
        $(customInput).on('input', function () {
            pqSelectTool($toolRow, 'custom', this.value);
        });
        $customWrap.append($customPreview).append(customInput);
        $toolRow.append($customWrap);

        // Eraser button
        var $eraser = $("<div>")
            .addClass("pq-eraser-btn")
            .css({
                'width': '18px', 'height': '18px',
                'border-radius': '3px',
                'background': 'rgba(255,255,255,0.1)',
                'border': $data._pqEraser ? '2px solid #FFD700' : '1px solid #555',
                'cursor': 'pointer',
                'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
                'font-size': '11px', 'color': '#CCC',
                'flex-shrink': '0'
            }).html('<i class="fa fa-eraser"></i>');
        $eraser.on('click', function () {
            pqSelectTool($toolRow, 'eraser');
        });
        $toolRow.append($eraser);

        // Separator
        $toolRow.append($("<div>").css({
            'width': '1px', 'height': '14px',
            'background-color': 'rgba(255,255,255,0.3)',
            'margin': '0 2px', 'flex-shrink': '0'
        }));

        // Brush size options
        for (var b = 0; b < PQ_BRUSH_SIZES.length; b++) {
            (function (size) {
                var dotSize = Math.max(6, size);
                var isSelected = ($data._pqMode === 'brush' && !$data._pqEraser && size === $data._pqBrushSize);
                var $brush = $("<div>")
                    .addClass("pq-brush-btn")
                    .attr('data-size', size)
                    .css({
                        'width': '18px', 'height': '18px',
                        'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
                        'cursor': 'pointer',
                        'border': isSelected ? '2px solid #FFD700' : '1px solid #555',
                        'border-radius': '3px',
                        'background-color': 'rgba(255,255,255,0.1)',
                        'flex-shrink': '0'
                    });
                $brush.append($("<div>").css({
                    'width': dotSize + 'px', 'height': dotSize + 'px',
                    'border-radius': '50%', 'background-color': '#CCC'
                }));
                $brush.on('click', function () {
                    pqSelectTool($toolRow, 'brush', size);
                    $toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
                    $(this).css('border', '2px solid #FFD700');
                });
                $toolRow.append($brush);
            })(PQ_BRUSH_SIZES[b]);
        }

        // Paint bucket button
        var $fillBtn = $("<div>")
            .addClass("pq-fill-btn")
            .css({
                'width': '18px', 'height': '18px',
                'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
                'cursor': 'pointer',
                'border': ($data._pqMode === 'fill') ? '2px solid #FFD700' : '1px solid #555',
                'border-radius': '3px',
                'background-color': 'rgba(255,255,255,0.1)',
                'flex-shrink': '0',
                'font-size': '11px', 'color': '#CCC'
            }).html('<i class="fa fa-tint"></i>');
        $fillBtn.on('click', function () {
            pqSelectTool($toolRow, 'fill');
        });
        $toolRow.append($fillBtn);

        $main.append($toolRow);
    }

    // Canvas element
    var canvas = document.createElement('canvas');
    canvas.width = PQ_CANVAS_W;
    canvas.height = PQ_CANVAS_H;
    canvas.className = 'pq-canvas';
    canvas.style.cursor = isDrawer ? 'crosshair' : 'default';

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);

    $data._pqCanvasEl = canvas;
    $data._pqCtx = ctx;

    if (isDrawer) {
        canvas.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startStroke(e);
        });
        canvas.addEventListener('mousemove', function (e) {
            if ($data._pqDrawing) continueStroke(e);
        });
        canvas.addEventListener('mouseup', function () { endStroke(); });
        canvas.addEventListener('mouseleave', function () { if ($data._pqDrawing) endStroke(); });

        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            startStroke(e.touches[0]);
        });
        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if ($data._pqDrawing) continueStroke(e.touches[0]);
        });
        canvas.addEventListener('touchend', function (e) {
            e.preventDefault();
            endStroke();
        });
    }

    $main.append(canvas);

    // Controls (Pass & Clear)
    if (isDrawer) {
        var $controls = $("<div>").css({
            'display': 'flex', 'justify-content': 'center',
            'gap': '10px', 'margin-top': '4px', 'width': '100%'
        });

        if ($data._pqPassCount < 3) {
            var passRemaining = 3 - $data._pqPassCount;
            $controls.append(
                $('<button>').attr('id', 'pq-pass-btn').css({
                    'padding': '4px 12px',
                    'background': 'linear-gradient(135deg, #FF6B6B, #EE5A5A)',
                    'color': '#FFFFFF', 'border': 'none', 'border-radius': '4px',
                    'cursor': 'pointer', 'font-size': '11px', 'font-weight': 'bold',
                    'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
                })
                    .html((L['pqPass'] || '패스') + ' (' + passRemaining + ')')
                    .on('click', function () {
                        playSound('mission');
                        send('pass', {});
                        $(this).prop('disabled', true).css('opacity', '0.5');
                    })
            );
        }

        $controls.append(
            $('<button>').attr('id', 'pq-clear-btn').css({
                'padding': '4px 12px',
                'background': 'linear-gradient(135deg, #FFB74D, #FFA726)',
                'color': '#FFFFFF', 'border': 'none', 'border-radius': '4px',
                'cursor': 'pointer', 'font-size': '11px', 'font-weight': 'bold',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
            })
                .html((L['pqClear'] || '모두 지우기'))
                .on('click', function () {
                    showConfirm(L['pqSureClear'] || '정말 모두 지우시겠습니까?', function (res) {
                        if (res) {
                            $data._pqStrokes = [];
                            var c = $data._pqCtx;
                            if (c) { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H); }
                            send('clear', {});
                        }
                    });
                })
        );

        $main.append($controls);
    }

    $stage.game.display.empty().append($main);
};

$lib.Picture.handleDraw = function (data) {
    var ctx = $data._pqCtx;
    if (!ctx || !data.pts || data.pts.length === 0) return;

    var fromPt = (data.cont && $data._pqRemoteLastPt) ? $data._pqRemoteLastPt : null;
    drawStrokeSegment(ctx, data.pts, data.c, data.w, fromPt);
    $data._pqRemoteLastPt = data.pts[data.pts.length - 1];
    if (data.end) $data._pqRemoteLastPt = null;
};

$lib.Picture.handleFill = function (data) {
    var ctx = $data._pqCtx;
    if (!ctx) return;
    pqFloodFill(ctx, data.x, data.y, data.c);
};

$lib.Picture.handleClear = function () {
    $data._pqStrokes = [];
    $data._pqRemoteLastPt = null;
    var ctx = $data._pqCtx;
    if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H); }
};

$lib.Picture.replayStrokes = function (strokes) {
    var ctx = $data._pqCtx;
    if (!ctx || !strokes) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);

    for (var s = 0; s < strokes.length; s++) {
        var stroke = strokes[s];
        if (stroke.fill) {
            pqFloodFill(ctx, stroke.x, stroke.y, stroke.c);
        } else {
            drawStrokeSegment(ctx, stroke.pts, stroke.c, stroke.w, null);
        }
    }
    $data._pqStrokes = strokes.slice();
};

$lib.Picture.turnStart = function (data) {
    $(".game-user-current").removeClass("game-user-current");
    $(".game-user-bomb").removeClass("game-user-bomb");

    $data._pqDrawer = data.drawer;
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqGameStarted = true;

    if ($data._pqPassBtnTimer) clearTimeout($data._pqPassBtnTimer);
    $data._pqPassBtnTimer = setTimeout(function () { $('#pq-pass-btn').remove(); }, 5000);

    clearInterval($data._tTime);
    $data._tTime = addInterval($lib.Picture.turnGoing, TICK);
    playBGM('jaqwi');
    $data._pqUrgent = false;

    $("#game-user-" + data.drawer).addClass("game-user-current");
    $stage.game.here.hide();
};

$lib.Picture.turnGoing = function () {
    var $rtb = $stage.game.roundBar;
    if (!$data.room) { clearInterval($data._tTime); return; }
    $data._roundTime -= TICK;

    if ($data._relay && $data._roundTime <= $data.room.time * 1000 / 6 && !$data._pqUrgent) {
        $data._pqUrgent = true;
        $rtb.css('background-color', '#E57373');
        playBGM('jaqwiF');
    }

    var tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
    $rtb.width($data._roundTime / $data.room.time * 0.1 + "%").html(tt);
};

$lib.Picture.turnEnd = function (id, data) {
    var $uc = $("#game-user-" + id);

    if (data.giveup) {
        $uc.addClass("game-user-bomb");
        playSound('timeout');
        return;
    }

    if (data.ok) {
        var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
        playSound('success');
        addScore(id, data.score, data.totalScore);
        updateScore(id, getScore(id)).addClass("game-user-current");
        drawObtainedScore($uc, $sc);
        if ($data._roundTime > 10000) $data._roundTime = 10000;
    } else if (data.answer) {
        if (typeof data.drawerScore === 'number') {
            var $drawerUc = $("#game-user-" + data.drawer);
            var $drawerSc = $("<div>").addClass("deltaScore");
            if (data.drawerScore < 0) {
                $drawerSc.addClass("lost").html(data.drawerScore);
                $drawerUc.addClass("game-user-bomb");
            } else {
                $drawerSc.html("+" + data.drawerScore);
            }
            drawObtainedScore($drawerUc, $drawerSc);
            var newScore = getScore(data.drawer) + data.drawerScore;
            addScore(data.drawer, data.drawerScore, newScore);
            updateScore(data.drawer, newScore);
        }

        $stage.game.display.append(
            $("<div>").css({
                'position': 'absolute', 'top': '50%', 'left': '50%',
                'transform': 'translate(-50%, -50%)',
                'font-size': '18px', 'font-weight': 'bold',
                'color': '#FFFF00', 'text-shadow': '2px 2px 3px #000',
                'padding': '8px 15px', 'background': 'rgba(0,0,0,0.7)',
                'border-radius': '5px', 'z-index': '100'
            }).html(L['pqAnswer'] + ": " + data.answer)
        );
        $data._relay = false;
        clearInterval($data._tTime);
        if ($data._pqPassBtnTimer) {
            clearTimeout($data._pqPassBtnTimer);
            $data._pqPassBtnTimer = null;
        }
        if ($data._pqSendTimer) {
            clearInterval($data._pqSendTimer);
            $data._pqSendTimer = null;
        }
        $data._pqDrawing = false;
        stopBGM();
        playSound('horr');
        $stage.game.roundBar.css('background-color', '');
        $data._pqUrgent = false;
    }

    if (data.drawerLeft) notice(L['pqDrawerLeft'] || "술래가 나갔습니다");
};

$lib.Picture.turnHint = function () {
};

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

$lib.Calcrelay = {};

// 코옵 모드에서는 체인 표시를 "(현재 체인 수) / (목표 문제 수)"로 보여준다.
function getChainDisplay() {
	var rule = RULE[MODE[$data.room.mode]];
	if (rule && rule.coop) {
		var target = ($data.room.coopTarget !== undefined) ? $data.room.coopTarget : $data.room.round;
		return $data.chain + " / " + target;
	}
	return $data.chain;
}

$lib.Calcrelay.roundReady = function (data) {
	var i, len = $data.room.game.title.length;
	var $l;

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	var qStr = data.question;
	if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
	$stage.game.display.html($data._question = qStr);
	$data.chain = 0;
	$stage.game.chain.show().html(getChainDisplay());
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Calcrelay.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	if (data.question) {
		var qStr = data.question;
		if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
		$stage.game.display.html($data._question = qStr);
	}

	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		if (data.id == $data.id) {
			$stage.game.here.css('opacity', 1).show();
		} else if (mobile) {
			$stage.game.here.css('opacity', 0.5).show();
		} else {
			$stage.game.here.hide();
		}
		if (data.id == $data.id) {
			$data._relay = true;
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._speed = data.speed;
	$data._tTime = addInterval(turnGoing, TICK);
	$data.turnTime = data.turnTime;
	$data._turnTime = data.turnTime;
	$data._roundTime = data.roundTime;
	$data._turnSound = playSound("T" + data.speed);
	recordEvent('turnStart', {
		data: data
	});
};

$lib.Calcrelay.turnGoing = $lib.Classic.turnGoing;

$lib.Calcrelay.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + data.score) : data.score);
	var $uc = $(".game-user-current");

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	// ========== 서바이벌 모드 처리 ==========
	if (data.survival && data.ko) {
		// calcrelay 전용: 정답 표시
		if (data.answer !== undefined) {
			$stage.game.display.empty()
				.append($("<label>").html(data.answer));
		}
		if (handleSurvivalKO(id, data, $sc, $uc)) return;
	}
	handleSurvivalDamage(data);
	// ========== 서바이벌 모드 끝 ==========

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		checkFailCombo();
		clearTimeout($data._fail);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		$data.chain++;
		$stage.game.chain.html(getChainDisplay());
		// 코옵 모드에서 목표 문제 수를 채운 마지막 턴이면, pushDisplay 애니메이션이 다 끝난 뒤에
		// roundEnd의 "성공!" 표시가 뜨도록 완료 콜백으로 순서를 맞춘다(경쟁 상태 방지).
		var isCoopFinalTurn = data.coopTarget !== undefined && data.coopTurn !== undefined && data.coopTurn >= data.coopTarget;
		if (isCoopFinalTurn) {
			$data._coopFinalAnimPending = true;
			pushDisplay(data.value, null, null, null, false, null, false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, function () {
				$data._coopFinalAnimPending = false;
				if ($data._pendingCoopRoundEnd) {
					var pending = $data._pendingCoopRoundEnd;
					$data._pendingCoopRoundEnd = null;
					roundEnd(pending.result, pending.data);
				}
			});
		} else {
			// 정답 표시 (daneo/free처럼 pushDisplay 사용)
			pushDisplay(data.value, null, null, null, false, null, false);
		}
		// 다음 문제 표시 (pushDisplay 애니메이션 후)
		if (data.nextQuestion) {
			$data._question = data.nextQuestion;
		}
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
		// 정답 표시 후 원래 문제 복원
		if (data.answer !== undefined) {
			$stage.game.display.empty()
				.append($("<label>").html(data.answer));
			// 잠시 후 원래 문제로 복원
			addTimeout(function() {
				var qStr = $data._question;
				if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
				$stage.game.display.html(qStr);
			}, 1500);
		}
	}
	// 서바이벌 모드에서는 자신의 점수 스플래시 숨김 (데미지만 표시)
	if (!data.survival) {
		drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	} else {
		// 서바이벌 모드: 스플래시 없이 current 클래스만 제거
		$uc.removeClass("game-user-current").css('border-color', '');
	}
	updateScore(id, getScore(id));
};

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

$lib.Fourrelay = {};

// 코옵 모드 체인 표시: "(현재 체인 수) / (목표 문제 수)"
function getFourrelayChainDisplay() {
	var target = ($data.room.coopTarget !== undefined) ? $data.room.coopTarget : $data.room.round;
	return $data.chain + " / " + target;
}
function getFourrelayClueHtml(clue) {
	var qStr = clue + new Array(clue.length + 1).join("○");
	if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
	return qStr;
}

$lib.Fourrelay.roundReady = function (data) {
	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$stage.game.display.html($data._question = getFourrelayClueHtml(data.clue));
	$data.chain = 0;
	$stage.game.chain.show().html(getFourrelayChainDisplay());
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Fourrelay.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	$data._tid = $data.room.game.seq[data.turn];
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	if (data.clue) {
		$stage.game.display.html($data._question = getFourrelayClueHtml(data.clue));
	}

	var $u = $("#game-user-" + data.id).addClass("game-user-current");
	if ($data.room.opts.drg) $u.css('border-color', getRandomColor());
	if (!$data._replay) {
		if (data.id == $data.id) {
			$stage.game.here.css('opacity', 1).show();
		} else if (mobile) {
			$stage.game.here.css('opacity', 0.5).show();
		} else {
			$stage.game.here.hide();
		}
		if (data.id == $data.id) {
			$data._relay = true;
			mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
		}
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._speed = data.speed;
	$data._tTime = addInterval(turnGoing, TICK);
	$data.turnTime = data.turnTime;
	$data._turnTime = data.turnTime;
	$data._roundTime = data.roundTime;
	$data._turnSound = playSound("T" + data.speed);
	recordEvent('turnStart', { data: data });
};

$lib.Fourrelay.turnGoing = $lib.Classic.turnGoing;

$lib.Fourrelay.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score > 0) ? ("+" + data.score) : data.score);
	var $uc = $(".game-user-current");

	if ($data._turnSound) $data._turnSound.stop();
	if (id == $data.id) $data._relay = false;
	clearInterval($data._tTime);

	addScore(id, data.score, data.totalScore);
	if (data.ok) {
		checkFailCombo();
		clearTimeout($data._fail);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		$data.chain++;
		$stage.game.chain.html(getFourrelayChainDisplay());

		// 코옵 목표 문제수를 채운 마지막 턴이면, pushDisplay 애니메이션이 다 끝난 뒤에
		// roundEnd의 "성공!" 표시가 뜨도록 완료 콜백으로 순서를 맞춘다(경쟁 상태 방지).
		var isCoopFinalTurn = data.coopTarget !== undefined && data.coopTurn !== undefined && data.coopTurn >= data.coopTarget;
		if (isCoopFinalTurn) {
			$data._coopFinalAnimPending = true;
			pushDisplay(data.value, null, null, null, false, null, false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, function () {
				$data._coopFinalAnimPending = false;
				if ($data._pendingCoopRoundEnd) {
					var pending = $data._pendingCoopRoundEnd;
					$data._pendingCoopRoundEnd = null;
					roundEnd(pending.result, pending.data);
				}
			});
		} else {
			// 정답 단어 4글자를 모두 보여준다.
			pushDisplay(data.value, null, null, null, false, null, false);
		}
		if (data.nextClue) {
			$data._question = getFourrelayClueHtml(data.nextClue);
		}
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
		if (data.answer !== undefined) {
			$stage.game.display.empty()
				.append($("<label>").html(data.answer));
			addTimeout(function () {
				$stage.game.display.html($data._question);
			}, 1500);
		}
	}
	drawObtainedScore($uc, $sc).removeClass("game-user-current").css('border-color', '');
	updateScore(id, getScore(id));
};

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

/**
 * Chainbattle (잇기 대결) - 클라이언트 UI
 * 타자대결 기반 + 끝말잇기 요소 (제시 글자, 히스토리)
 */

$lib.Chainbattle = {};
$lib.Chainbattle._restTimer = null;

$lib.Chainbattle.roundReady = function (data) {
	var i, len = data.title.length;

	// 이전 라운드의 restGoing 타이머 취소
	if ($lib.Chainbattle._restTimer) {
		clearTimeout($lib.Chainbattle._restTimer);
		$lib.Chainbattle._restTimer = null;
	}

	$data._chatter = $stage.talk;
	clearBoard();
	$data._round = data.round;
	$data._roundTime = $data.room.time * 1000;
	$data._char = data.char;
	$data._subChar = data.subChar;
	$data.chain = 0;

	// 제시 글자 표시 (끝말잇기 스타일)
	var tVal = getCharText(data.char, data.subChar);
	if ($data.room.opts.drg) tVal = "<label style='color:" + getRandomColor() + "'>" + tVal + "</label>";
	$stage.game.display.html(tVal);
	$stage.game.chain.show().html($data.chain);

	$(".game-user-bomb").removeClass("game-user-bomb");

	// 노란 바 초기화 (이전 라운드의 카운트다운 제거)
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html("")
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	$data._fastTime = 10000;
	$data._playerWords = {};

	// 초기 플레이어 단어 설정
	var seq = $data.room.game.seq;
	var initChar = getCharText(data.char, data.subChar);
	for (i in seq) {
		// seq에는 문자열 ID(플레이어) 또는 객체(봇)가 있음
		var pid = (typeof seq[i] === 'object' && seq[i].id) ? seq[i].id : seq[i];
		$data._playerWords[pid] = initChar;
	}

	drawRound(data.round);
	drawPlayerWords();

	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Chainbattle.turnStart = function (data) {
	// 모든 플레이어가 동시에 입력 (타자대결 스타일)
	if (!$data._spectate) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._tTime = addInterval($lib.Chainbattle.turnGoing, TICK);
	$data._roundTime = data.roundTime;

	playBGM('jaqwi');
	recordEvent('turnStart', { data: data });
};

$lib.Chainbattle.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) {
		clearInterval($data._tTime);
		return;
	}
	$data._roundTime -= TICK;

	// 라운드 바 업데이트 (타자대결/자퀴처럼 - 파란색 바)
	var $rtb = $stage.game.roundBar;
	var bRate;
	var tt;

	tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html(tt);

	// 턴 바는 플레이어 단어 표시 (어두운 색 바)
	drawPlayerWords();

	// 10초 경고
	if (!$rtb.hasClass("round-extreme")) {
		if ($data._roundTime <= $data._fastTime) {
			if ($data.bgm) {
				bRate = $data.bgm.currentTime / $data.bgm.duration;
				if ($data.bgm.paused) stopBGM();
				else playBGM('jaqwiF');
				$data.bgm.currentTime = $data.bgm.duration * bRate;
			}
			$rtb.addClass("round-extreme");
		}
	}
};

$lib.Chainbattle.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (id == $data.id) $data._relay = false;

	if (data.error) {
		// 에러 (잘못된 입력) - 서버에서 send로 본인에게만 전송됨
		playSound('fail');
		return;
	} else if (data.ok) {
		// 단어 입력 성공
		if ($data.id == id) {
			// 내가 입력한 단어
			$data.chain++;
			$data._char = data.char;
			$data._subChar = data.subChar;

			// 제시 글자 업데이트 (끝말잇기 스타일)
			var tVal = getCharText(data.char, data.subChar);
			if ($data.room.opts.drg) tVal = "<label style='color:" + getRandomColor() + "'>" + tVal + "</label>";
			$stage.game.display.html(tVal);
			$stage.game.chain.html($data.chain);

			// 히스토리에 추가
			pushHistory(data.value, data.mean);

			// 내 단어일 때만 mission 소리 재생
			playSound('mission');
		}

		// 플레이어 단어 업데이트 (다음 글자로)
		if ($data._playerWords) $data._playerWords[id] = getCharText(data.char, data.subChar);
		drawPlayerWords();

		addScore(id, data.score, data.totalScore);
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id));
	} else if (data.out) {
		// 게임오버 (one 규칙)
		if (id == $data.id) {
			mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
			$(".jjo-turn-time .graph-bar")
				.html("GAME OVER")
				.css({ 'text-align': "center" });
		}
		if ($data._playerWords) $data._playerWords[id] = "X";
		drawPlayerWords();
		$uc.addClass("game-user-bomb");
		playSound('timeout');
	} else if (data.speed) {
		// 라운드 종료 (시간 만료)
		clearInterval($data._tTime);
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();

		addTimeout(drawChainSpeed, 1000, data.speed);
		stopBGM();
		playSound('horr');

		if ($data._round < $data.room.round) restGoing(10);
	}
};

function restGoing(rest) {
	$(".jjo-turn-time .graph-bar")
		.html(rest + L['afterRun']);
	if (rest > 0) {
		$lib.Chainbattle._restTimer = addTimeout(restGoing, 1000, rest - 1);
	} else {
		$lib.Chainbattle._restTimer = null;
	}
}

function drawPlayerWords() {
	if (!$data.room || !$data._playerWords) return;

	// 내 상태가 GAME OVER면 업데이트하지 않음
	if ($(".jjo-turn-time .graph-bar").text() === "GAME OVER") return;

	var words = [];
	var seq = $data.room.game.seq;

	// 순서대로 단어 수집
	for (var i = 0; i < seq.length; i++) {
		// seq에는 문자열 ID(플레이어) 또는 객체(봇)가 있음
		var pid = (typeof seq[i] === 'object' && seq[i].id) ? seq[i].id : seq[i];
		var w = $data._playerWords[pid];
		if (w !== undefined && w !== null && w !== "") {
			words.push(w);
		}
	}

	// 단어가 있든 없든 항상 업데이트
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html(words.length > 0 ? words.join(" ") : "")
		.css({ 'text-align': "center", 'background-color': "#70712D" });
}

function drawChainSpeed(table) {
	var i;
	var chainLabel = L['chainCount'] || 'Chain';

	for (i in table) {
		$("#game-user-" + i + " .game-user-score").empty()
			.append($("<div>").css({
				'float': "none",
				'color': "#4444FF",
				'text-align': "center"
			}).html(table[i] + "<label style='font-size: 11px;'>" + chainLabel + "</label>"));
	}
}

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

/**
 * Calcbattle (계산 대결) - 클라이언트 UI
 * 타자대결 기반 + 수학 문제 풀이
 */

$lib.Calcbattle = {};
$lib.Calcbattle._restTimer = null;

$lib.Calcbattle.roundReady = function (data) {
	// 이전 라운드의 restGoing 타이머 취소
	if ($lib.Calcbattle._restTimer) {
		clearTimeout($lib.Calcbattle._restTimer);
		$lib.Calcbattle._restTimer = null;
	}
	$data._chatter = $stage.talk;
	clearBoard();
	$data._round = data.round;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data.chain = 0;
	$data._oneback = data.oneback || false;

	// 노란 바 초기화 (이전 라운드의 카운트다운 제거)
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html("")
		.css({ 'text-align': "center", 'background-color': "#70712D" });

	// 내 문제 표시
	var myProblem = data.problems[$data.id];
	if (myProblem) {
		if ($data._oneback) {
			// oneback 모드: 라운드 준비 중에는 첫 문제(풀어야 할 문제)를 보여줌
			$data._firstQuestion = myProblem.first;
			$data._displayQuestion = myProblem.display;
			$data._nextQuestion = myProblem.next;
			var qStr = myProblem.first;
			if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
			$stage.game.display.html(qStr);
			// 노란 바에는 두 번째 문제(다음에 표시될 문제)
			var nextStr = myProblem.display;
			if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
			$(".jjo-turn-time .graph-bar")
				.width("100%")
				.html(nextStr)
				.css({ 'text-align': "center", 'background-color': "#70712D" });
		} else {
			// 일반 모드
			var qStr = myProblem;
			if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
			$stage.game.display.html($data._question = qStr);
			// 노란 바에 다음 문제 표시
			var nextProblem = data.nextProblems[$data.id];
			if (nextProblem) {
				$data._nextQuestion = nextProblem;
				var nextStr = nextProblem;
				if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
				$(".jjo-turn-time .graph-bar")
					.width("100%")
					.html(nextStr)
					.css({ 'text-align': "center", 'background-color': "#70712D" });
			}
		}
	}

	$stage.game.chain.show().html($data.chain);

	$(".game-user-bomb").removeClass("game-user-bomb");

	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Calcbattle.turnStart = function (data) {
	// 모든 플레이어가 동시에 입력 (타자대결 스타일)
	if (!$data._spectate) {
		$data._relay = true;
		$stage.game.here.css('opacity', 1).show();
		mobile ? $stage.game.hereText.focus() : $stage.talk.focus();
	}

	// oneback 모드: 턴 시작 시 표시 문제를 두 번째 문제로 변경
	if ($data._oneback && $data._displayQuestion) {
		var qStr = $data._displayQuestion;
		if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
		$stage.game.display.html(qStr);
		// 노란 바에는 다다음 문제
		if ($data._nextQuestion) {
			var nextStr = $data._nextQuestion;
			if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
			$(".jjo-turn-time .graph-bar")
				.width("100%")
				.html(nextStr)
				.css({ 'text-align': "center", 'background-color': "#70712D" });
		}
	}

	ws.onmessage = _onMessage;
	clearInterval($data._tTime);
	clearTrespasses();
	$data._tTime = addInterval($lib.Calcbattle.turnGoing, TICK);
	$data._roundTime = data.roundTime;

	playBGM('jaqwi');
	recordEvent('turnStart', { data: data });
};

$lib.Calcbattle.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) {
		clearInterval($data._tTime);
		return;
	}
	$data._roundTime -= TICK;

	// 라운드 바 업데이트 (타자대결/자퀴처럼 - 파란색 바)
	var $rtb = $stage.game.roundBar;
	var bRate;
	var tt;

	tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html(tt);

	// 10초 경고
	if (!$rtb.hasClass("round-extreme")) {
		if ($data._roundTime <= $data._fastTime) {
			if ($data.bgm) {
				bRate = $data.bgm.currentTime / $data.bgm.duration;
				if ($data.bgm.paused) stopBGM();
				else playBGM('jaqwiF');
				$data.bgm.currentTime = $data.bgm.duration * bRate;
			}
			$rtb.addClass("round-extreme");
		}
	}
};

$lib.Calcbattle.turnEnd = function (id, data) {
	var $sc = $("<div>")
		.addClass("deltaScore")
		.html((data.score >= 0 ? "+" : "") + data.score);
	var $uc = $("#game-user-" + id);

	if (id == $data.id) $data._relay = false;

	if (data.error) {
		// 에러 (잘못된 입력) - 서버에서 send로 본인에게만 전송됨
		playSound('fail');
		return;
	} else if (data.giveup) {
		// 포기 처리
		if ($data.id == id) {
			// 다음 문제 표시
			if (data.nextQuestion) {
				var qStr = data.nextQuestion;
				if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
				$stage.game.display.html($data._question = qStr);

				if ($data._oneback) {
					$data._displayQuestion = data.nextQuestion;
				}
			}

			// 노란 바에 다다음 문제 표시
			if (data.nextNextQuestion) {
				$data._nextQuestion = data.nextNextQuestion;
				var nextStr = data.nextNextQuestion;
				if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
				$(".jjo-turn-time .graph-bar")
					.width("100%")
					.html(nextStr)
					.css({ 'text-align': "center", 'background-color': "#70712D" });
			}

			pushHistory(data.value, "?");
			playSound('fail');
		}

		addScore(id, data.score, data.totalScore);
		$sc.addClass("lost");
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id));
	} else if (data.ok) {
		// 정답 처리
		if ($data.id == id) {
			// 내가 맞힌 경우
			$data.chain = data.chain;
			$stage.game.chain.html($data.chain);

			// 다음 문제 표시
			if (data.nextQuestion) {
				var qStr = data.nextQuestion;
				if ($data.room.opts.drg) qStr = "<label style='color:" + getRandomColor() + "'>" + qStr + "</label>";
				$stage.game.display.html($data._question = qStr);

				// oneback 모드인 경우 내부 상태도 업데이트
				if ($data._oneback) {
					$data._displayQuestion = data.nextQuestion;
				}
			}

			// 노란 바에 다다음 문제 표시
			if (data.nextNextQuestion) {
				$data._nextQuestion = data.nextNextQuestion;
				var nextStr = data.nextNextQuestion;
				if ($data.room.opts.drg) nextStr = "<label style='color:" + getRandomColor() + "'>" + nextStr + "</label>";
				$(".jjo-turn-time .graph-bar")
					.width("100%")
					.html(nextStr)
					.css({ 'text-align': "center", 'background-color': "#70712D" });
			}

			// 정답 히스토리에 추가
			pushHistory(data.value, "");
			playSound('mission');
		}

		addScore(id, data.score, data.totalScore);
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id));
	} else if (data.out) {
		// 게임오버 (one 규칙)
		if (id == $data.id) {
			mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
			$(".jjo-turn-time .graph-bar")
				.html("GAME OVER")
				.css({ 'text-align': "center" });
		}
		$uc.addClass("game-user-bomb");
		playSound('timeout');
	} else if (data.chains) {
		// 라운드 종료 (시간 만료)
		clearInterval($data._tTime);
		$data._relay = false;
		$stage.game.here.hide();

		addTimeout(drawChainResult, 1000, data.chains);
		stopBGM();
		playSound('horr');

		if ($data._round < $data.room.round) restGoing(10);
	}
};

function restGoing(rest) {
	$(".jjo-turn-time .graph-bar")
		.html(rest + L['afterRun']);
	if (rest > 0) {
		$lib.Calcbattle._restTimer = addTimeout(restGoing, 1000, rest - 1);
	} else {
		$lib.Calcbattle._restTimer = null;
	}
}

function drawChainResult(table) {
	var i;
	var chainLabel = L['chainCount'] || 'Chain';

	for (i in table) {
		$("#game-user-" + i + " .game-user-score").empty()
			.append($("<div>").css({
				'float': "none",
				'color': "#4444FF",
				'text-align': "center"
			}).html(table[i] + "<label style='font-size: 11px;'>" + chainLabel + "</label>"));
	}
}

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

$lib.Quiz = {};

// 문제 표시 영역의 텍스트가 너무 길면 글자 크기를 자동으로 줄임
function fitQuizDisplay() {
	var $el = $stage.game.display;
	var el = $el[0];
	if (!el) return;
	var maxSize = 20;
	var minSize = 10;
	$el.css({ 'font-size': maxSize + 'px', 'white-space': 'nowrap' });
	while (el.scrollWidth > el.clientWidth && maxSize > minSize) {
		maxSize -= 1;
		$el.css('font-size', maxSize + 'px');
	}
}

$lib.Quiz.roundReady = function (data) {
	var tv = L['quiz_' + data.topic] + (data.isFallback ? '(!)' : '');
	var dv = "(" + L['quiz_' + data.difficulty] + ")";

	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.display.html(tv + dv);
	$stage.game.items.hide();
	$stage.game.hints.show();
	$(".jjo-turn-time .graph-bar")
		.width("100%")
		.html(tv)
		.css('text-align', "center");
	drawRound(data.round);
	playSound('round_start');
	clearInterval($data._tTime);
};

$lib.Quiz.turnStart = function (data) {
	$(".game-user-current").removeClass("game-user-current");
	$(".game-user-bomb").removeClass("game-user-bomb");
	if ($data.room.game.seq.indexOf($data.id) >= 0) {
		$stage.game.here.css('opacity', 1).show();
	} else if (mobile) {
		$stage.game.here.css('opacity', 0.5).show();
	} else {
		$stage.game.here.hide();
	}

	// 문제 표시 (jaqwi와 다른 부분)
	var qVal = data.question;
	if ($data.room.opts.drg) qVal = "<label style='color:" + getRandomColor() + "'>" + qVal + "</label>";
	$stage.game.display.html($data._question = qVal);
	fitQuizDisplay();

	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};

$lib.Quiz.turnGoing = function () {
	var $rtb = $stage.game.roundBar;
	var bRate;
	var tt;

	if (!$data.room || !$data.room.gaming) clearInterval($data._tTime);
	$data._roundTime -= TICK;

	tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
	$rtb
		.width($data._roundTime / $data.room.time * 0.1 + "%")
		.html(tt);

	if (!$rtb.hasClass("round-extreme")) if ($data._roundTime <= $data._fastTime) {
		if ($data.bgm) {
			bRate = $data.bgm.currentTime / $data.bgm.duration;
			if ($data.bgm.paused) stopBGM();
			else playBGM('jaqwiF');
			$data.bgm.currentTime = $data.bgm.duration * bRate;
		}
		$rtb.addClass("round-extreme");
	}
};

$lib.Quiz.turnHint = function (data) {
	playSound('mission');
	pushHint(data.hint);
};

$lib.Quiz.turnEnd = function (id, data) {
	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	if (data.giveup) {
		$uc.addClass("game-user-bomb");
	} else if (data.answer) {
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		var ansColor = ($data.room.opts.drg) ? getRandomColor() : "#FFFF44";
		$stage.game.display.html($("<label>").css('color', ansColor).html(data.answer));
		fitQuizDisplay();
		stopBGM();
		playSound('horr');
	} else {
		if (id == $data.id) mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		addScore(id, data.score, data.totalScore);
		if ($data._roundTime > 10000) $data._roundTime = 10000;
		drawObtainedScore($uc, $sc);
		updateScore(id, getScore(id)).addClass("game-user-current");
		playSound('success');
	}
};

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

// 플레이어 배경색 (인덱스 0 = 미소유) — 라이트 모드
$lib.Flip._PLAYER_COLORS = [
	'#42341a',  // 0: 미소유
	'#fffea4',  // 1P
	'#b7f3f1',  // 2P
	'#fda09b',  // 5P
	'#d0bcfe',  // 6P
	'#cfcfcf',  // 10P
	'#dfbb9c',  // 7P
	'#8ce7a1',  // 4P
	'#F7b1e6',  // 8P
	'#feb482',  // 3P
	'#a1cafe',  // 9P
	'#e178c2',  // 11P
	'#11bdce'   // 12P
];

// 플레이어 배경색 — 다크 모드 (HSL L-inversion 후 S×0.8, L×1.5)
$lib.Flip._PLAYER_COLORS_DARK = [
	'#000000',  // 0: 미소유  H39  S34  L100(cap)
	'#979516',  // 1P        H59  S80  L27
	'#2ca09a',  // 2P        H178 S58  L24
	'#b72018',  // 5P        H3   S77  L30
	'#592ac6',  // 6P        H258 S78  L20
	'#808080',  // 10P       H0   S0   L29
	'#957a4d',  // 7P        H28  S41  L39
	'#2fa54b',  // 4P        H134 S53  L41
	'#a131a3',  // 8P        H315 S66  L26
	'#d1741d',  // 3P        H24  S78  L38
	'#2265be',  // 9P        H214 S78  L29
	'#cd678c',  // 11P       H318 S51  L48
	'#93c757'   // 12P       H185 S68  L84
];

// 팀 배경색 — 라이트 모드
$lib.Flip._TEAM_COLORS = [
	'',         // 0: 팀 없음
	'#8CA6FF',  // 팀 1
	'#9575CD',  // 팀 2
	'#F06292',  // 팀 3
	'#FFCA28'   // 팀 4
];

// 팀 배경색 — 다크 모드 (HSL L-inversion 후 S×0.8, L×1.5)
$lib.Flip._TEAM_COLORS_DARK = [
	'',         // 0: 팀 없음
	'#11319b',  // 팀 1  H226 S80  L34
	'#8263b8',  // 팀 2  H262 S37  L55
	'#d42e66',  // 팀 3  H340 S66  L51
	'#ecc756'   // 팀 4  H45  S80  L63
];

$lib.Flip._getPlayerIndex = function (ownerId) {
	if (!ownerId || !$data.room || !$data.room.game || !$data.room.game.seq) return 0;
	var seq = $data.room.game.seq;
	for (var i = 0; i < seq.length; i++) {
		var item = seq[i];
		var id = (typeof item === 'string') ? item : item.id;
		if (id === ownerId) return i + 1;
	}
	return 0;
};

// 게임 시작 시 컬러맵 생성 (게임마다 1회, 라운드마다 아님)
$lib.Flip._buildColorMap = function () {
	var seq = $data.room.game.seq;
	var n = seq.length;
	var map = {};
	var i, id, colors, offset;

	if (n >= 11) {
		// 11~12명: 1~12번 색상 전체를 셔플
		colors = [];
		for (i = 1; i <= 12; i++) colors.push(i);
		for (i = colors.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = colors[i]; colors[i] = colors[j]; colors[j] = t;
		}
		for (i = 0; i < n; i++) {
			id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			map[id] = colors[i];
		}
	} else {
		// 1~10명: 1~10번 색상에서 랜덤 오프셋으로 순환
		offset = Math.floor(Math.random() * 10);
		for (i = 0; i < n; i++) {
			id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			map[id] = ((i + offset) % 10) + 1;
		}
	}
	$data._flipColorMap = map;
};

$lib.Flip._getPlayerColor = function (ownerId) {
	var colors = document.body.classList.contains('dark-mode') ? $lib.Flip._PLAYER_COLORS_DARK : $lib.Flip._PLAYER_COLORS;
	if (!ownerId || !$data._flipColorMap || !$data._flipColorMap[ownerId]) return colors[0];
	return colors[$data._flipColorMap[ownerId]];
};

$lib.Flip._applyUserCardColors = function () {
	if (!$data._flipColorMap) return;
	var colors = document.body.classList.contains('dark-mode') ? $lib.Flip._PLAYER_COLORS_DARK : $lib.Flip._PLAYER_COLORS;
	for (var id in $data._flipColorMap) {
		var color = colors[$data._flipColorMap[id]];
		$("#game-user-" + id).css('background-color', color);
	}
};

$lib.Flip._getOwnerTeam = function (ownerId) {
	if (!ownerId || !$data.room || !$data.room.game || !$data.room.game.seq) return 0;
	var seq = $data.room.game.seq;
	for (var i = 0; i < seq.length; i++) {
		var item = seq[i];
		if (typeof item === 'string') {
			var u = $data.users[item];
			if (item === ownerId && u && u.game) return u.game.team || 0;
		} else {
			if (item.id === ownerId && item.game) return item.game.team || 0;
		}
	}
	return 0;
};

$lib.Flip.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping,.game-body").addClass("flip");
	$data._board = data.board;
	$data._owners = data.owners;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	if (mobile) $stage.game.here.css({ 'opacity': 0.3, 'top': '-35px' }).show();
	else $stage.game.here.hide();
	if (!$data._flipColorMap) {
		$lib.Flip._buildColorMap();
	}
	$lib.Flip._applyUserCardColors();
	$lib.Flip.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Flip.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Flip.turnEnd = function (id, data) {
	var $sc, $uc, previousOwner;

	if (data.error) {
		playSound('fail');
		return;
	}

	// 라운드 종료 — 점수 표시
	if (data.ok === false) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound('horr');

		// 라운드별 점수 반영
		if (data.scores) {
			for (var pid in data.scores) {
				var sc = data.scores[pid];
				if (sc > 0) {
					$uc = $("#game-user-" + pid);
					$sc = $("<div>").addClass("deltaScore").html("+" + sc);
					addScore(pid, sc, getScore(pid) + sc);
					updateScore(pid, getScore(pid));
					drawObtainedScore($uc, $sc);
				}
			}
		}
		return;
	}

	// 칸 뒤집기 성공
	if (typeof data.cellIndex === 'number') {
		previousOwner = $data._owners[data.cellIndex];

		$data._board[data.cellIndex] = data.newWord;
		$data._owners[data.cellIndex] = data.owner;

		if (id === $data.id) {
			playSound('success');
		} else if (previousOwner === $data.id) {
			playSound('mission');
		}

		$lib.Flip.drawDisplay();
	}
};
$lib.Flip.drawDisplay = function () {
	var COLS = 5;
	var ROWS = 10;
	var CELL_W = 100 / COLS;
	var CELL_H = 100 / ROWS;
	var $pane = $stage.game.display.empty();
	var i, row, col, word, owner, playerColor, bgColor, borderColor, teamId;
	var $cell;

	var isNyh = $data.room.opts.nyeohweok;
	var isEnFlip = MODE[$data.room.mode] === 'EPF';

	for (i = 0; i < 50; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		word = $data._board[i] || "";
		owner = $data._owners[i];
		playerColor = $lib.Flip._getPlayerColor(owner);

		var isDark = document.body.classList.contains('dark-mode');
		var teamColors = isDark ? $lib.Flip._TEAM_COLORS_DARK : $lib.Flip._TEAM_COLORS;

		borderColor = '';
		bgColor = playerColor;
		if (owner) {
			teamId = $lib.Flip._getOwnerTeam(owner);
			if (teamId) {
				bgColor = teamColors[teamId] || playerColor;
				borderColor = playerColor;
			}
		}

		$pane.append($cell = $("<div>").addClass("flip-cell")
			.css({
				top: (row * CELL_H) + "%",
				left: (col * CELL_W) + "%",
				width: CELL_W + "%",
				height: CELL_H + "%",
				'background-color': bgColor,
				'border': borderColor ? ('3px solid ' + borderColor) : '1px solid #999',
				'color': isDark ? ('#FFF') : (owner ? '#000' : '#FFF'),
				'font-weight': (isNyh || isEnFlip) ? 'normal' : 'bold',
				'font-size': isEnFlip ? '80%' : ''
			})
			.html(word)
		);
	}
};
$lib.Flip.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Flip.turnHint = function (data) {
	playSound('fail');
};

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

$lib.Raingame._LANES    = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];
$lib.Raingame._laneAt   = [0, 0, 0, 0, 0, 0, 0];
$lib.Raingame._lastLane = -1;
$lib.Raingame._words    = {};
$lib.Raingame._strategy = 0;

$lib.Raingame._pickLane = function () {
	var now = Date.now();
	var lanes = $lib.Raingame._laneAt;
	var last = $lib.Raingame._lastLane;
	var n = lanes.length;
	var i, idx, pool;

	function isAdj(j) { return last >= 0 && Math.abs(j - last) <= 1; }

	// pass 1: cooled-down AND non-adjacent
	pool = [];
	for (i = 0; i < n; i++) {
		if (!isAdj(i) && now - lanes[i] >= 1000) pool.push(i);
	}
	if (pool.length > 0) {
		idx = pool[Math.floor(Math.random() * pool.length)];
		lanes[idx] = now; $lib.Raingame._lastLane = idx; return idx;
	}

	// pass 2: non-adjacent only (ignore cooldown)
	pool = [];
	for (i = 0; i < n; i++) {
		if (!isAdj(i)) pool.push(i);
	}
	if (pool.length > 0) {
		idx = pool[Math.floor(Math.random() * pool.length)];
		lanes[idx] = now; $lib.Raingame._lastLane = idx; return idx;
	}

	// pass 3: any lane — pick oldest
	idx = 0;
	for (i = 1; i < n; i++) {
		if (lanes[i] < lanes[idx]) idx = i;
	}
	lanes[idx] = now; $lib.Raingame._lastLane = idx; return idx;
};

$lib.Raingame._updateStrategyUI = function () {
	var s = $lib.Raingame._strategy;
	$(".raingame-strategy-btn").each(function () {
		var v = parseInt($(this).attr("data-strategy"), 10);
		$(this).toggleClass("toggled", v === s);
	});
};

$lib.Raingame._showDamage = function (targetId, damage, newHP) {
	var $uc = $("#game-user-" + targetId);
	if (!$uc.length) return;

	var user = $data.users[targetId] || $data.robots[targetId];
	if (user && user.game) user.game.score = newHP;

	$uc.addClass("survival-damage");
	addTimeout(function () { $uc.removeClass("survival-damage"); }, 500);

	var $sc = $("<div>").addClass("deltaScore damage").css("color", "#FF6666").text("-" + damage);
	drawObtainedScore($uc, $sc);
	updateScore(targetId, newHP);
};

$lib.Raingame.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$data._fastTime = 20000;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping").addClass("flip");
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	if (mobile) $stage.game.here.css({ opacity: 0.3, top: "-35px" }).show();
	else $stage.game.here.hide();

	$lib.Raingame._words = {};
	$lib.Raingame._laneAt = [0, 0, 0, 0, 0, 0, 0];
	$lib.Raingame._lastLane = -1;
	$lib.Raingame._strategy = 0;

	$stage.game.display.empty().addClass("raingame-board");
	$("#raingame-strategy").show().find(".raingame-strategy-btn").show();
	$lib.Raingame._updateStrategyUI();

	// 초기 HP 표시
	if (data.surHP && $data.room && $data.room.game && $data.room.game.seq) {
		var seq = $data.room.game.seq;
		for (var i = 0; i < seq.length; i++) {
			var uid = typeof seq[i] === 'string' ? seq[i] : seq[i].id;
			var u = $data.users[uid] || $data.robots[uid];
			if (u) { if (!u.game) u.game = {}; u.game.score = data.surHP; u.game.alive = true; }
			updateScore(uid, data.surHP);
		}
	}

	drawRound(data.round);
	if (!spec) playSound("round_start");
	clearInterval($data._tTime);
};

$lib.Raingame.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM("jaqwi");
};

$lib.Raingame.onWord = function (data) {
	var lane = $lib.Raingame._pickLane();
	var laneX = $lib.Raingame._LANES[lane];
	var word = data.word;
	var timeout = data.timeout;
	var wordId = data.wordId;

	if ($data.room && $data.room.opts && $data.room.opts.mirror) {
		word = word.split("").reverse().join("");
	}

	var $word = $("<div>")
		.addClass("raingame-word")
		.css({ left: laneX + "%", top: "-5%" })
		.text(word);

	$stage.game.display.append($word);

	// delay 1 frame so the initial position is painted before transition starts
	addTimeout(function () {
		$word.css({
			transition: "top " + timeout + "ms linear",
			top: "105%"
		});
	}, 20);

	// 하단 도달 시 DOM 자동 정리
	(function (wId) {
		$word.on("transitionend", function (e) {
			if (e.originalEvent.propertyName === "top") {
				$word.remove();
				delete $lib.Raingame._words[wId];
			}
		});
	})(wordId);

	if ($data.room && $data.room.opts && $data.room.opts.nyeohweok) {
		$word.css('font-weight', 'normal');
	}
	playSound("mission");
	$lib.Raingame._words[wordId] = { $el: $word, createdAt: Date.now(), timeout: timeout };
};

$lib.Raingame.turnEnd = function (id, data) {
	var wObj, $el;

	if (data.error) {
		playSound("fail");
		return;
	}

	// round over (time expired)
	if (data.timeUp) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound("horr");
		// clear all falling words
		$stage.game.display.empty();
		$lib.Raingame._words = {};
		$("#raingame-strategy").hide();
		return;
	}

	// word timed out (server 스캔 감지)
	if (!data.ok && data.wordId !== undefined) {
		// 내 화면에서만 해당 단어 제거 (wordId가 플레이어별로 독립적이므로 target 확인)
		if (data.target === $data.id) {
			wObj = $lib.Raingame._words[data.wordId];
			if (wObj) {
				wObj.$el.remove();
				delete $lib.Raingame._words[data.wordId];
			}
			playSound("fail");
		}
		if (data.damage !== undefined && data.hp !== undefined) {
			$lib.Raingame._showDamage(data.target, data.damage, data.hp);
		}
		if (data.ko) {
			applySurvivalKODisplay(data.target);
			var koUser = $data.users[data.target] || $data.robots[data.target];
			if (koUser && koUser.game) koUser.game.alive = false;
			playSound("KO");
		}
		return;
	}

	// word typed successfully
	if (data.ok && data.wordId !== undefined) {
		// 단어를 입력한 플레이어의 화면에서만 제거
		if (data.target === $data.id) {
			wObj = $lib.Raingame._words[data.wordId];
			if (wObj) {
				$el = wObj.$el;
				$el.addClass("raingame-success");
				(function (wId, $e) {
					addTimeout(function () {
						$e.remove();
						delete $lib.Raingame._words[wId];
					}, 300);
				})(data.wordId, $el);
			}
		}
		if (data.target === $data.id) playSound("success");
		return;
	}
};

$lib.Raingame.turnGoing = $lib.Jaqwi.turnGoing;

// strategy key handlers — attached once when this file loads
$(document).on("keydown.raingame", function (e) {
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWR" && mode !== "EWR") return;

	var key = e.key;
	if (key === "1") { $lib.Raingame._strategy = 0; $lib.Raingame._updateStrategyUI(); }
	else if (key === "2") { $lib.Raingame._strategy = 1; $lib.Raingame._updateStrategyUI(); }
	else if (key === "3") { $lib.Raingame._strategy = 2; $lib.Raingame._updateStrategyUI(); }
});

// strategy button clicks
$(document).on("click.raingame", ".raingame-strategy-btn", function () {
	$lib.Raingame._strategy = parseInt($(this).attr("data-strategy"), 10);
	$lib.Raingame._updateStrategyUI();
});

// 모바일: 전략 버튼 롱프레스 툴팁
(function () {
	var _lpt = null;
	$(document).on("touchstart", ".raingame-strategy-btn[data-tooltip]", function (e) {
		var $btn = $(this);
		_lpt = setTimeout(function () {
			_lpt = null;
			$(".item-tooltip-popup").remove();
			var $tip = $("<div>").addClass("item-tooltip-popup").text($btn.attr("data-tooltip"));
			$btn.append($tip);
			setTimeout(function () { $tip.remove(); }, 2000);
		}, 500);
	}).on("touchend touchcancel touchmove", ".raingame-strategy-btn", function () {
		if (_lpt) { clearTimeout(_lpt); _lpt = null; }
	});
})();

// 창 포커스 복귀 시 단어 위치 재계산
$(document).on("visibilitychange.raingame", function () {
	if (document.hidden) return;
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWR" && mode !== "EWR") return;

	var now = Date.now();
	$.each($lib.Raingame._words, function (wId, wObj) {
		if (!wObj || !wObj.$el) return;
		var elapsed = now - wObj.createdAt;
		var remaining = wObj.timeout - elapsed;
		if (remaining <= 0) {
			wObj.$el.css({ transition: 'none', top: '105%' });
		} else {
			var progress = Math.min(1, elapsed / wObj.timeout);
			var currentTop = -5 + 110 * progress;
			wObj.$el.css({ transition: 'none', top: currentTop + '%' });
			(function (el, rem) {
				addTimeout(function () {
					el.css({ transition: 'top ' + rem + 'ms linear', top: '105%' });
				}, 20);
			})(wObj.$el, remaining);
		}
	});
});

/**
 * Rule the words! KKuTu Online
 * WordStack (워드스택) client rule
 */

$lib.Wordstack = {};

$lib.Wordstack._strategy = 0;
$lib.Wordstack._stackLen = 0;
$lib.Wordstack._chars = [];
$lib.Wordstack._subChars = [];

$lib.Wordstack._updateStrategyUI = function () {
	var s = $lib.Wordstack._strategy;
	$(".raingame-strategy-btn").each(function () {
		$(this).toggleClass("toggled", parseInt($(this).attr("data-strategy"), 10) === s);
	});
};

$lib.Wordstack._updateStackBar = function (len) {
	$lib.Wordstack._stackLen = len;
	var pct = Math.min(100, (len / 8) * 100);
	var $bar = $(".jjo-turn-time .graph-bar");
	$bar.width(pct + "%");
	if (len > 8) $bar.addClass("overflow");
	else $bar.removeClass("overflow");
};

// rule_classic.js 방식 - 각 글자를 getCharText로 변환 후 공백 구분 HTML
$lib.Wordstack._renderStack = function () {
	var parts = $lib.Wordstack._chars.map(function (c, i) {
		var sub = $lib.Wordstack._subChars[i] || null;
		return getCharText(c, sub);
	});
	$stage.game.display.html(parts.join(' '));
	$lib.Wordstack._updateStackBar($lib.Wordstack._chars.length);
};

// 유저 표시 이름 조회
$lib.Wordstack._getName = function (id) {
	var u = ($data.users && $data.users[id]) || ($data.robots && $data.robots[id]);
	if (!u) return id;
	var p = u.profile || u;
	return p.title || p.name || id;
};

// 히스토리에 단어 + 공격 정보 추가
$lib.Wordstack._addHistory = function (word, label) {
	var $v = $("<div>").addClass("ellipse history-item").width(0).animate({ width: 200 }).text(word);
	$stage.game.history.prepend($v);
	if ($stage.game.history.children().length > 6) $stage.game.history.children().last().remove();
	$v.append($("<div>").addClass("history-mean ellipse").text(label));
};

$lib.Wordstack.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	if (mobile) $stage.game.here.css({ opacity: 0.5, top: "" }).show();
	else $stage.game.here.hide();
	$(".jjoriping").css({ "float": "none", "margin": "0 auto" });

	$lib.Wordstack._strategy = 0;
	$lib.Wordstack._stackLen = 0;
	$lib.Wordstack._chars = [];
	$lib.Wordstack._subChars = [];

	if (data.chars) {
		$lib.Wordstack._chars = data.chars.slice();
		$lib.Wordstack._subChars = data.subChars ? data.subChars.slice() : [];
		$lib.Wordstack._renderStack();
	}

	$("#raingame-strategy").show().find(".raingame-strategy-btn").show();
	$lib.Wordstack._updateStrategyUI();

	if (data.surHP && $data.room && $data.room.game && $data.room.game.seq) {
		var seq = $data.room.game.seq;
		for (var i = 0; i < seq.length; i++) {
			var uid = typeof seq[i] === 'string' ? seq[i] : seq[i].id;
			var u = $data.users[uid] || $data.robots[uid];
			if (u) { if (!u.game) u.game = {}; u.game.score = data.surHP; u.game.alive = true; }
			updateScore(uid, data.surHP);
		}
	}

	drawRound(data.round);
	if (!spec) playSound("round_start");
	clearInterval($data._tTime);
};

$lib.Wordstack.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._fastTime = 20000;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM("jaqwi");
};

// 공격 글자 수신: 내 스택에 추가 후 재렌더링
$lib.Wordstack.onAtk = function (data) {
	if (!data.char) return;
	$lib.Wordstack._chars.push(data.char);
	$lib.Wordstack._subChars.push(data.subChar || null);
	$lib.Wordstack._renderStack();
};

$lib.Wordstack.turnEnd = function (id, data) {
	if (data.error) {
		playSound("fail");
		return;
	}

	// 라운드 종료
	if (data.timeUp) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound("horr");
		$stage.game.display.empty();
		$("#raingame-strategy").hide();
		$(".jjo-turn-time .graph-bar").width(0).removeClass("overflow");
		$(".jjo-round-time .graph-bar").width(0).removeClass("round-extreme");
		return;
	}

	// 오버플로우 페널티
	if (!data.ok && data.overflow) {
		if (data.hp !== undefined) updateScore(data.target, data.hp);
		if (data.damage) {
			var $uc = $("#game-user-" + data.target);
			drawObtainedScore($uc, $("<div>").addClass("deltaScore").css("color", "#FF6666").text("-" + data.damage));
		}
		if (data.ko) {
			applySurvivalKODisplay(data.target);
			var koU = $data.users[data.target] || $data.robots[data.target];
			if (koU && koU.game) koU.game.alive = false;
			playSound("KO");
		} else if (data.target === $data.id) {
			playSound("fail");
		}
		return;
	}

	// 단어 성공
	if (data.ok) {
		if (data.hp !== undefined) updateScore(data.target, data.hp);

		if (data.target === $data.id) {
			// 내 스택에서 사용된 글자 제거 후 재렌더링
			if (data.removed !== undefined) {
				var idx = $lib.Wordstack._chars.indexOf(data.removed);
				if (idx !== -1) {
					$lib.Wordstack._chars.splice(idx, 1);
					$lib.Wordstack._subChars.splice(idx, 1);
				}
				$lib.Wordstack._renderStack();
			}
			// HP 회복 표시
			if (data.recovered) {
				var $uc = $("#game-user-" + $data.id);
				var $sc = $("<div>").addClass("deltaScore").css("color", "#2255FF").text("+" + data.recovered);
				drawObtainedScore($uc, $sc);
			}
			playSound("success");
		}

		// 히스토리
		if (data.word) {
			var meKO = !$data._spectate && (function () {
				var me = $data.users[$data.id] || $data.robots[$data.id];
				return me && me.game && me.game.alive === false;
			}());
			var watchAll = $data._spectate || meKO;
			var label = "";
			if (data.attackTargets && data.attackTargets.length > 0) {
				if (data.target === $data.id) {
					var names = [];
					data.attackTargets.forEach(function (tid) {
						var n = $lib.Wordstack._getName(tid);
						if (names.indexOf(n) === -1) names.push(n);
					});
					label = "▶ " + names.join(", ");
				} else if (data.attackTargets.indexOf($data.id) !== -1) {
					label = "◀ " + $lib.Wordstack._getName(data.target);
				} else if (watchAll) {
					label = $lib.Wordstack._getName(data.target) + " ▶ " + data.attackTargets.map($lib.Wordstack._getName).join(", ");
				}
			} else if (watchAll) {
				label = $lib.Wordstack._getName(data.target);
			}
			if (label) $lib.Wordstack._addHistory(data.word, label);
		}

		return;
	}
};

$lib.Wordstack.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) {
		clearInterval($data._tTime);
		$(".jjo-round-time .graph-bar").removeClass("round-extreme");
		return;
	}
	$lib.Jaqwi.turnGoing.call(this);
};

// 전략 키 1/2/3
$(document).off("keydown.wordstack").on("keydown.wordstack", function (e) {
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWS" && mode !== "EWS") return;
	if (e.key === "1") { $lib.Wordstack._strategy = 0; $lib.Wordstack._updateStrategyUI(); }
	else if (e.key === "2") { $lib.Wordstack._strategy = 1; $lib.Wordstack._updateStrategyUI(); }
	else if (e.key === "3") { $lib.Wordstack._strategy = 2; $lib.Wordstack._updateStrategyUI(); }
});

// 전략 버튼 클릭
$(document).off("click.wordstack").on("click.wordstack", ".raingame-strategy-btn", function () {
	if (!$data.room || !$data.room.gaming) return;
	var mode = MODE[$data.room.mode];
	if (mode !== "KWS" && mode !== "EWS") return;
	$lib.Wordstack._strategy = parseInt($(this).attr("data-strategy"), 10);
	$lib.Wordstack._updateStrategyUI();
});

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
	var $tray = $("#exc-tray");
	var $goods = $("#exc-goods");
	var $preview = $("#exc-result-preview");

	$data._excTray = {};
	$data._excResult = null;
	$preview.empty();
	$stage.dialog.excCompose.removeClass("exc-exchangeable");

	var specFilter = ($("#dress-type-spec").attr('value') || "").split(',').filter(Boolean);
	var excFilter = (specFilter.length ? specFilter : ['PIX', 'PIY', 'PIZ', 'CNS']).filter(function(g) { return g !== 'PIX'; }).concat(['eventcol']);
	renderGoods($goods, 'exc', excFilter, null, onExcGoodsClick);

	function onExcGoodsClick(e) {
		var $target = $(e.currentTarget);
		var id = $target.attr('id').slice(4);

		if ($data._excTray.hasOwnProperty(id)) {
			delete $data._excTray[id];
			drawExcTray();
			return;
		}

		var bd = $data.box[id];
		var available = (typeof bd === 'number') ? bd : (bd && bd.value ? bd.value : 0);
		if (available < 1) return fail(434);

		showPrompt(L['excHowMany'], "1", function (val) {
			if (val === null) return;
			var n = parseInt(val, 10);
			if (isNaN(n) || n < 1) return;
			if (n > available) n = available;
			$data._excTray[id] = n;
			drawExcTray();
		});
	}

	function trayEmpty() {
		$tray.html($("<span>").css({ 'font-size': "11px", 'color': "#999" }).html(L['excTrayHint']));
		$("#exc-arrow").hide();
		$("#exc-empty-slot").hide();
	}
	trayEmpty();

	function drawExcTray() {
		$tray.empty();
		$(".exc-tray-selected").removeClass("exc-tray-selected");
		$preview.empty();
		$stage.dialog.excCompose.removeClass("exc-exchangeable");
		$data._excResult = null;

		var ids = Object.keys($data._excTray);
		if (ids.length === 0) {
			trayEmpty();
			return;
		}

		ids.forEach(function (itemId) {
			var gd = iGoods(itemId);
			var cnt = $data._excTray[itemId];
			var $wrap = $("<div>").addClass("exc-tray-item");
			var $imgWrap = $("<div>").addClass("exc-img-wrap");
			var $img = $("<div>").addClass("jt-image")
				.css('background-image', "url(" + gd.image + ")")
				.attr('data-item', itemId);
			var $label = $("<span>").addClass("exc-count-label").text("x" + cnt);
			$imgWrap.append($img).append($label);
			$wrap.append($imgWrap).append(explainGoods(gd, false));
			$wrap.on('click', function () {
				delete $data._excTray[itemId];
				drawExcTray();
			});
			$tray.append($wrap);
			$("#exc-" + itemId).addClass("exc-tray-selected");
		});
		global.expl($tray);

		$("#exc-arrow").show();
		$("#exc-empty-slot").show();

		$preview.html("<span style='color:#888; font-size:11px;'>" + L['searching'] + "</span>");
		$.get("/exchange-check", { items: JSON.stringify($data._excTray) }, function (res) {
			if (res.error || !res.result) {
				$preview.html("<span style='color:#CC3333; font-size:11px;'>" + L['excNoRecipe'] + "</span>");
				return;
			}
			if (!$data.shop[res.result]) {
				$preview.html("<span style='color:#CC3333; font-size:11px;'>" + L['excNoRecipe'] + "</span>");
				return;
			}
			var resultObj = iGoods(res.result);
			var $resultImg = getImage(resultObj.image).addClass("exc-result-image");
			var $resultWrap = $("<div>").css('display', 'inline-block').append($resultImg).append(explainGoods(resultObj, false));
			$preview.empty().append($resultWrap);
			global.expl($preview);
			$data._excResult = res.result;
			$stage.dialog.excCompose.addClass("exc-exchangeable");
		});
	}
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

	if ($data.id == id) $stage.dialog.profileDress.show();
	else if (!o.robot) {
		$stage.dialog.profileShut.show();
		$stage.dialog.profileWhisper.show();
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
function checkInput() {
	/*var v = $stage.talk.val();
	var len = v.length;
	
	if($data.room) if($data.room.gaming){
		if(len - $data._kd.length > 3) $stage.talk.val($data._kd);
		if($stage.talk.is(':focus')){
			$data._kd = v;
		}else{
			$stage.talk.val($data._kd);
		}
	}
	$data._kd = v;*/
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
					}
				}
				updateUserList();
				if ($data.room) updateRoom($data.room.gaming);
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
			if ($data.users[$data.id]) {
				var _me = $data.users[$data.id];
				var _myName = getDisplayName(_me);
				if (_myName) {
					$("#room-title").attr('placeholder', _myName + L['roomDefault']);
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
	var savedLang = localStorage.getItem('kkutu_lang');
	var savedVolume = loadVolumeSettings();
	var easterEggDisabled = savedVolume.noEasterEgg === true;

	if (!easterEggDisabled && savedLang === 'nya') {
		equip['Mhead'] = 'nekomimi';
	}

	// Easter Egg for 'troll' sound pack
	if (!easterEggDisabled && savedVolume.soundPack === '병맛') {
		equip['Meye'] = 'hidden_eye';
		equip['Mmouth'] = 'nocomment';
		equip['Mclothes'] = 'troll';
	}

	// Random Moremi Item (Drug Mode) Logic Removed - Handled in Interval


	for (i in MOREMI_PART) {
		key = 'M' + MOREMI_PART[i];

		$obj.append($("<img>")
			.addClass("moremies moremi-" + key.slice(1))
			.attr('src', iImage(equip[key], LR[key] || key))
			.css({ 'width': "100%", 'height': "100%" })
		);
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

delete window.WebSocket;
delete window.setInterval;