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
var KO_INJEONG;
var EN_INJEONG;
var JA_INJEONG;
var MAX_LEVEL = 720;
var STAR_LEVEL = 360; // 이 레벨을 넘으면 3레벨씩 묶어 별렙(s1~)으로 표시
var UI_BETA_WARN = true; // 설정에서 기본 UI → 베타 UI를 고를 때 "불안정할 수 있음" 확인 창 (false면 묻지 않음)
var TICK = 30;
var EXP = [];
var BAD = new RegExp(["느으*[^가-힣]*금마?", "(?<!(밀레|심포|도미))니[^가-힣]*(엄|앰|엠)", "(ㅄ|[ㅅㅆ][^가-힣ㄱ-ㅎㅏ-ㅣ]*ㅂ|ㅂ[^가-힣ㄱ-ㅎㅏ-ㅣ]*ㅅ|ㄴ[^가-힣ㄱ-ㅎㅏ-ㅣ]*[ㄱㅇ][^가-힣ㄱ-ㅎㅏ-ㅣ]*ㅁ|ㅈ[^가-힣ㄱ-ㅎㅏ-ㅣ]*ㄹ|ㅗ|ㅅ[^가-힣ㄱ-ㅎㅏ-ㅣ]*ㄲ)", "미(친|찐|틴|띤)(년|놈)?", "(병|븅|빙|벙)[^가-힣]*신", 
		"(새|섀|쌔|썌|색|섁|쌕|썍)[^가-힣]*(기|끼)", "(섹|야|쎅|셱|쌕|떽|땍)[^가-힣]*(스|뜨|쓰|슈)(?!텟)", "교[^가-힣]*미", "발[^가-힣]*정", "(시|씨|쉬|쒸|슈|쓔|싯|씻|tl)이*입?[^가-힣]*(발|빨|벌|뻘|팔|펄|qkf)",
		"(십|씹)[^가-힣]*새", "(씹|씝)", "딸[^가-힣]*딸[^가-힣]*이", "(?<!(흰|노른|검은))자[^가-힣]*위", "(애|에)[^가-힣]*(미|비)", "(자|보|쟈|쥬|뷰)[^가-힣]*지", "(존|졸|ㅈ)[^가-힣]*(나|라)", "보[^가-힣]*빨",
		"꼴[^가-힣]*(리|릿)", "좆|죶|좃|죳|븃", "(지|야)[^가-힣]*랄", "창[^가-힣]*(녀|년|놈)", "야[^가-힣]*(동|덩|둉|짤)", "뷰[^가-힣]*(르[^가-힣]*)*릇", "(?!라운지)운[^가-힣]*지(?!법)", "일[^가-힣]*베",
		"메[^가-힣]*갈", "계[^가-힣]*엄([^가-힣]*령)?", "탄[^가-힣]*핵", "(좌|우)[^가-힣]*파", "빨[^가-힣]*갱[^가-힣]*이", "화[^가-힣]*짱[^가-힣]*조", "짱[^가-힣]*(개|깨)", "(이|리)[^가-힣]*(재|짜이)[^가-힣]*(명|밍)",
		"(이|리)[^가-힣]*(준)[^가-힣]*(석|썩)", "김[^가-힣]*문[^가-힣]*수", "(노[^가-힣]*|엠[^가-힣]*씨[^가-힣]*|[mM][^가-힣]*[Cc][^가-힣]*)무[^가-힣]*현", "노[^가-힣]*알[^가-힣]*라", "부[^가-힣]*엉[^가-힣]*이[^가-힣]*바[^가-힣]*위",
		"응[^가-힣]*(딩[^가-힣]*이|디|가)", "윤[^가-힣]*((석|썩)[^가-힣]*(열|렬)|카|어[^가-힣]*게[^가-힣]*인)", "한[^가-힣]*동[^가-힣]*훈", "홍[^가-힣]*준[^가-힣]*표", "오[^가-힣]*세[^가-힣]*훈", "안[^가-힣]*철[^가-힣]*수",
		"유[^가-힣]*승[^가-힣]*민", "김[^가-힣]*동[^가-힣]*연", "조[^가-힣]*국", "나[^가-힣]*경[^가-힣]*원", "추[^가-힣]*미[^가-힣]*애", "원[^가-힣]*희[^가-힣]*룡", "박[^가-힣]*용[^가-힣]*진", "김[^가-힣]*경[^가-힣]*수",
		"이[^가-힣]*승[^가-힣]*만", "윤[^가-힣]*보[^가-힣]*선", "박[^가-힣]*정[^가-힣]*희", "최[^가-힣]*규[^가-힣]*하", "전[^가-힣]*두[^가-힣]*환", "노[^가-힣]*태[^가-힣]*우", "김[^가-힣]*영[^가-힣]*삼", "김[^가-힣]*대[^가-힣]*중",
		"이[^가-힣]*명[^가-힣]*박", "박[^가-힣]*근[^가-힣]*혜", "문[^가-힣]*재[^가-힣]*인", "자[^가-힣]*(살|해)", "찐[^가-힣]*따", "(민[^가-힣]*주|진[^가-힣]*보|개[^가-힣]*혁[^가-힣]*신)[^가-힣]*당", "국[^가-힣]*민[^가-힣]*의[^가-힣]*힘",
		
		"tlqkf", "torl", "tprtm", "wlfkf", "\\b[mf][a4@][g]{2,}[o0][t+]", "\\bf[a4@]g", "\\b(r[e3]|[b8][a4@][s5])t[a4@]rd", "\\bn[i1!]gg([e3]r|[a4@])", "\\bb[i1!][t+0]ch", "\\bsh[i1!][t+0]", "\\bf[u*u](c|k){1,}", "\\bp[u*u][s]{2}y",
		"\\bc(u|oo)m", "\\b[s5][e3]x", "\\bp[o0]rn", "k[^a-zA-Z0-9]*y[^a-zA-Z0-9]*s", "\\by[i1!|]ff", "\\bd[i1!]ck", "\\b[s5]u[i!1]c[i!1]d[e3]", "\\bm[a@4][s5]tur[b8][a4]t([i1!][o0]n|[e3]|[o0]r)", "\\bjerk([i1]ng?)?[^a-zA-Z0-9]*[o0]ff",
		"\\b(h[a@4]nd|f[0o][0o]t|t[i1!]t|bl[0o]w)j[o0]b", "🤏", "🖕",
		
		"(염|옘|엠)[^가-힣]*병", "ㅂ[^가-힣ㄱ-ㅎㅏ-ㅣ]*ㅅ", "[개걔][^가-힣]*소[^가-힣]*리", "딜[^가-힣]*도", "오[^가-힣]*나[^가-힣]*홀", "ㅈ[^가-힣]*도", "조[^가-힣]*선[^가-힣]*족", "국[^가-힣]*뽕[^가-힣]*충", "[남북헬][^가-힣]*[조좆]선",
		"꺼[^가-힣]*(져|저|지)", "쳐[^가-힣]*맞", "[씨시][^가-힣]*부[^가-힣]*(리|려|랄|럴)", "능[^가-힣]*지[^가-힣]*(딸|달)", "개[^가-힣]*돼[^가-힣]*지", "[또도][^가-힣]*라[^가-힣]*이", "[돌똘][^가-힣]*아[^가-힣]*이", "[씹십][^가-힣]*(덕|뜨[^가-힣]*억)",
		"퐁퐁[^가-힣]*남", "방[^가-힣]*구[^가-힣]*석[^가-힣]*(여[^가-힣]*포|인[^가-힣]*생)", "어[^가-힣]*그[^가-힣]*로[^가-힣]", "긁[^가-힣]*힌", "[엠앰][^가-힣]*생", "보[^가-힣]*추", "종[^가-힣]*간[^가-힣]*나",
		"1[789]금[^가-힣]*영[^가-힣]*상", "[ㅓㅗ]ㅜㅑ", "르[^가-힣]*가[^가-힣]*[즘슴]", "정[^가-힣]*신[^가-힣]*(병|이[^가-힣]*상|개[^가-힣]*쑊)", "(한[^가-힣]*국|나[^가-힣]*라)[^가-힣]*망", "[한H][^가-힣]*남[^대역동]",
		"[한H][^가-힣]*[녀여]", "[그니너저샹썅][^가-힣]*년", "닥[^가-힣]*[치쳐처]", "(대|머|아)[^가-힣]*((갈[^가-힣]*[통빡])|가[^가-힣]*리)", "\\bwls\\b", "찐[^가-힣]*(따|평)", "쿨[^가-힣]*찐",
		
		"킁[^가-힣]*킁",
		"(死|氏|し)[^ぁ-んァ-ヶ一-龠]*(ね|ネ)(?![ぁ-んァ-ヶ一-龠])|タヒ[^ぁ-んァ-ヶ一-龠]*(ね|ネ)",
		"(殺|ころ|コロ)[^ぁ-んァ-ヶ一-龠]*す[^ぁ-んァ-ヶ一-龠]*(ぞ|ぜ)|ぶ[っち]殺|ブ[ッチ]殺|くたばれ|クタバレ",
		"(くそ|クソ|糞)",
		"(馬[^ぁ-んァ-ヶ一-龠]*鹿|莫[^ぁ-んァ-ヶ一-龠]*迦|ばか|バカ)(?!り)",
		"(あほ|アホ|阿[^ぁ-んァ-ヶ一-龠]*呆)",
		"ボケ(?!ット|ッ)|ぼけなす",
		"(ちくしょう|ちくしょー|チクショウ|チクショー|畜生)",
		"(てめえ|てめぇ|テメエ|テメェ|テメー|貴様|きさま|キサマ)",
		"野郎|やろう(?![ぁ-ん])|ヤロウ|ヤロー",
		"(きもい|キモい|キモイ|キモッ|キモ(?![ノちチ]))|気持ち[^ぁ-んァ-ヶ一-龠]*悪い",
		"(うざい|ウザい|ウザイ|うぜえ|うぜぇ|ウゼェ|ウゼー|ウザッ)",
		"(ブス|ぶす|デブ|ハゲ)",
		"(クズ|屑)",
		"(失せろ|うせろ|消えろ|黙れ|だまれ)",
		"(変態|へんたい|ヘンタイ)",
		"(淫乱|インラン|痴女|売女|あばずれ|アバズレ|ビッチ|ヤリマン|やりまん|ヤリチン|やりちん)",
		"(ち|チ)[^ぁ-んァ-ヶ一-龠]*(ん|ン)[^ぁ-んァ-ヶ一-龠]*(こ|コ|ぽ|ポ)",
		"(ま|マ)[^ぁ-んァ-ヶ一-龠]*(ん|ン)[^ぁ-んァ-ヶ一-龠]*(こ|コ)(?![ぁ-んァ-ヶ])",
		"(ちんちん|チンチン|まんまん|マンマン|うんこ|ウンコ)",
		"(セックス|せっくす|オナニー|おなにー|中出し|フェラ(?!ー)|パイズリ|ザーメン|強姦|レイプ)",
		"(ファック|ふぁっく|ファッキン|ファッカー)",
		"(ガイジ|池沼|きちがい|キチガイ|気違い|基地外|めくら|メクラ|つんぼ|ツンボ|かたわ|カタワ|びっこ|ビッコ)",
		"(ホモ(?!サピ|ジニ)|オカマ|おかま)",
		"(チョン(?!マゲ|ッ)|ジャップ|支那|シナ人|鮮人|土人|黒ん坊|黒んぼ|クロンボ|ニガー|チャンコロ)",
		"\\b([kK][uU][sS][oO]|[kK][iI][cC][hH][iI][gG][aA][iI]|[cC][hH][iI][kK][uU][sS][hH](?:[oO]|[oO][uU])|[cC][hH][iI][nN](?:[kK][oO]|[pP][oO])|[oO]?[mM][aA][nN][kK][oO]|[uU][nN][kK][oO]|[tT][eE][mM][eE][eE]|[kK][iI][sS][aA][mM][aA]|[bB][aA][kK][aA][yY][aA][rR][oO][uU]?|[yY][aA][rR][oO][uU])\\b"
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
	$data.RELAY_HOST = $("#RELAY_HOST").html() || "";
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
	var rawExp = [getRequiredScore(1)];
	for (i = 2; i < MAX_LEVEL; i++) {
		rawExp.push(rawExp[i - 2] + getRequiredScore(i));
	}
	// 별렙 구간은 3레벨마다 한 칸만 남겨 s레벨 하나의 목표 경험치로 쓴다
	for (i = 0; i < rawExp.length; i++) {
		if (i < STAR_LEVEL || (i - STAR_LEVEL) % 3 == 2) EXP.push(rawExp[i]);
	}
	EXP.push(Infinity, Infinity);
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
			songPick: $("#SongPickDiag"),
			songPickOK: $("#songpick-ok"),
			chatLog: $("#ChatLogDiag"),
			obtain: $("#ObtainDiag"),
			obtainOK: $("#obtain-ok"),
			help: $("#HelpDiag"),
			confirm: $("#ConfirmDiag"),
			confirmText: $("#confirm-text"),
			confirmOK: $("#confirm-ok"),
			confirmNo: $("#confirm-no"),
			lateJoin: $("#LateJoinDiag"),
			lateJoinText: $("#late-join-text"),
			lateJoinOK: $("#late-join-ok"),
			lateJoinSpectate: $("#late-join-spectate"),
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
				{ key: "moondust", value: "/media/common/moondust.opus" },
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
	EVENT_ACTIVE_KWC = $("#EVENT_ACTIVE_KWC").html() == "true";
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
	// 신 UI 데스크톱: 머리줄 어디를 눌러도 끌 수 있게 (설정 창 등은 제목 칸이 글자 폭뿐이라 글자 위에서만 끌렸음 — 사용자 요청)
	// 제목은 위에서 처리하고, 닫기 등 머리줄 안의 단추는 제외
	$(".dialog-head").on('mousedown', function (e) {
		var $pd = $(e.currentTarget).parents(".dialog");

		if (!NK.active || NK.phone || $(e.target).closest(".dialog-title, .closeBtn, button, input, select, a").length) return;
		$(".dialog-front").removeClass("dialog-front");
		$pd.addClass("dialog-front");
		startDrag($pd, e.pageX, e.pageY);
	}).on('mouseup', function (e) {
		if (NK.active) stopDrag();
	});
	// addInterval(checkInput, 1);
	$stage.chatBtn.on('click', function (e) {
		// 리듬 타이퍼(데스크톱): 채팅창이 게임 입력창으로 쓰이는 동안은 전송 버튼으로도 보내지 않음
		// (엔터는 rule_rtype.js가 막음. 버튼으로 보내면 입력 중인 자모가 채팅으로 나가고 입력창이 비워져 단어 보너스도 사라짐)
		if ($lib.Rtype && $lib.Rtype.s && $lib.Rtype.s.$input === $stage.talk) return;
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
			if ($data._sdk) $lib.Sudoku.drawDisplay();
			else if ($data._boards) $lib.Crossword.drawDisplay();
			else if ($data._board) $lib.Landgrab.drawDisplay();
		});

		// HTML 속성 설정
		$cwInput.attr('enterkeyhint', 'send');
	})();
	$("#room-limit").on('change', function (e) {
		var $target = $(e.currentTarget);
		var value = $target.val();

		if (value < 2 || value > 24) {
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
		var el = $input[0];
		var v = $input.val();
		var converted = convertHangulToKana(v);
		if (converted !== v) {
			// 조합이 끝난 시점의 커서 위치(변환 전 좌표)를 변환 후 좌표로 재계산.
			// 문장 끝이든 중간이든 방금 변환된 글자 바로 뒤로 커서가 오도록 한다(끝으로 강제 이동 아님).
			var caret = (typeof el.selectionStart === 'number') ? el.selectionStart : v.length;
			var newPos = convertHangulToKana(v.slice(0, caret)).length;
			$input.val(converted);
			el.setSelectionRange(newPos, newPos);
			// 크롬은 위 setSelectionRange가 그대로 유지되지만, 파이어폭스 모바일은 IME 합성 종료 후
			// 자체적으로(정확한 타이밍을 예측할 수 없게) 캐럿을 변환 전 글자수 기준(+1칸)으로 되돌려버림.
			// setTimeout/rAF 한두 번으로는 그 시점을 못 이기므로, selectionchange를 짧게 감시하며
			// 파이어폭스가 커서를 되돌릴 때마다 즉시 다시 바로잡는다.
			(function () {
				var tries = 0;
				function onSelChange() {
					if (el !== document.activeElement || ++tries > 20) { cleanup(); return; }
					if (el.selectionStart !== newPos || el.selectionEnd !== newPos) {
						el.setSelectionRange(newPos, newPos);
					}
				}
				function cleanup() {
					document.removeEventListener('selectionchange', onSelChange);
				}
				document.addEventListener('selectionchange', onSelChange);
				setTimeout(cleanup, 500);
			})();
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
		var pos = $diag.position(), z = NK.gameZoom; // 화면 값 → CSS 값 (신 UI UI 배율, 기본 UI는 1)
		$(window).on('mousemove', function (e) {
			var dx = e.pageX - sx, dy = e.pageY - sy;

			$diag.css('left', (pos.left + dx) / z);
			$diag.css('top', (pos.top + dy) / z);
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

		// 리듬 싱크 보정 슬라이더 (ms, 기본 0)
		var rhythmSync = Number(savedSettings.rhythmSync);
		if (!isFinite(rhythmSync)) rhythmSync = 0;
		$("#rhythm-sync").val(rhythmSync).trigger('input');

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

		// 플레이어 스크롤 설정 (기본 꺼짐)
		$("#player-scroll").prop('checked', ($data.opts && $data.opts.ps === true));

		// 가나 발음 보기 설정 (기본 켜짐)
		$("#kana-reading").prop('checked', (!$data.opts || $data.opts.kr !== false));

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

		// UI(기본/신) 설정
		$("#ui-setting").val(savedSettings.ui === 'new' ? 'new' : 'classic');
		// 신 UI 스타일은 당분간 단색만 (선택 칸은 숨김, 혼합은 다른 스타일로 바꿔 낼 예정 — 2026-11-01 사용자)
		$("#ui-style-setting").val('flat');

		// 비트 모드 설정
		$("#beat-setting").val(savedSettings.beatMode || 'auto');

		// 신 UI는 같은 입력 요소를 탭별로 옮겨 둔 새 설정 창을 띄움 (값·저장은 위·아래 기존 코드 그대로)
		if (NK.active) NK.openSettings();
		else showDialog($stage.dialog.setting);
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
		$data._songpick = $data.room.opts.songpick || "";

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
		var keyRules = ['man', 'gen', 'ext', "jre", "jdk", 'mis', 'rdm', 'loa', 'str', 'prv', 'k32', 'lng', 'no2', 'unk', 'trp', 'one', 'ret', 'sur', 'rnt', 'itm', 'ljn', 'mir', 'spd', 'big', 'qz1', 'qz2', 'qz3', 'ijp', 'qij', 'unl', 'vow', 'obo', 'alp', 'ctc', 'apl', 'obk', 'nyh', 'ord', 'shf', 'stp', 'rnm', 'prm', 'inf'];

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

			// Show/hide song pick panel
			if (rule.opts.indexOf("spk") != -1) $("#room-songpick-panel").show();
			else $("#room-songpick-panel").hide();
			$("#room-songpick-panel-flat").hide();
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
			$("#room-songpick-panel").hide();

			// Show flat panel and update options visibility
			$("#room-all-rules-panel").show();

			// Show/hide injeong pick panel in flat mode
			if (rule.opts.indexOf("ijp") != -1) $("#room-injpick-panel-flat").show();
			else $("#room-injpick-panel-flat").hide();

			// Show/hide quiz topic pick panel in flat mode
			if (rule.opts.indexOf("qij") != -1) $("#room-quizpick-panel-flat").show();
			else $("#room-quizpick-panel-flat").hide();

			// Show/hide song pick panel in flat mode
			if (rule.opts.indexOf("spk") != -1) $("#room-songpick-panel-flat").show();
			else $("#room-songpick-panel-flat").hide();
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
			$("#room-songpick-panel").hide();
			$("#room-songpick-panel-flat").hide();

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

			if (rule.opts.indexOf("spk") != -1) {
				$("#room-simple-songpick-panel").show();
			} else {
				$("#room-simple-songpick-panel").hide();
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
		if (!$data._songpick) $data._songpick = "";
		if (rule.rule == "Typing" || rule.rule == "Chainbattle" || rule.rule == "Flip" || rule.rule == "numberclap") $("#room-round").val(3);
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
		// 달가루 모으기: 라운드 1 / 60초 고정, 사용자가 바꿀 수 없게 잠금
		if (rule.rule === "Wordcollect" || rule.rule === "Rhythm" || rule.rule === "Rtype") {
			$("#room-round").val(1).prop('disabled', true);
			$("#room-time").val(60).prop('disabled', true);
		} else {
			$("#room-round").prop('disabled', false);
			$("#room-time").prop('disabled', false);
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

	// 아이템전·카오스·랜덤턴 상호배타: 셋 중 하나만 선택 가능
	var turnItemGroup = ['item', 'chaos', 'randomturn'];
	turnItemGroup.forEach(function (opt) {
		window.RULE_CHECKBOXES[opt].on('change', function () {
			if ($(this).is(':checked')) {
				turnItemGroup.forEach(function (other) {
					if (other !== opt) window.RULE_CHECKBOXES[other].prop('checked', false);
				});
			}
		});
	});

	// 소수-랜덤 숫자 상호배타 (랜덤 턴 종속은 updatePrimeAvailability)
	window.RULE_CHECKBOXES['prime'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['randomnumber'].prop('checked', false);
	});
	window.RULE_CHECKBOXES['randomnumber'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['prime'].prop('checked', false);
	});

	// 리턴-한 번만! 상호배타
	window.RULE_CHECKBOXES['return'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['onlyonce'].prop('checked', false);
	});
	window.RULE_CHECKBOXES['onlyonce'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['return'].prop('checked', false);
	});

	// 게임 중 참여 - 쿵쿵따 체인지/서바이벌 상호배타 (인원이 바뀌면 교대 주기·생존 판정이 깨짐)
	window.RULE_CHECKBOXES['latejoin'].on('change', function () {
		if ($(this).is(':checked')) {
			window.RULE_CHECKBOXES['change'].prop('checked', false);
			window.RULE_CHECKBOXES['survival'].prop('checked', false);
			// 카오스: 중도 참여자는 진행 중인 카오스 상태(배율·단두대 등)를 알 수 없음. change를 일으켜 카오스 플러스도 함께 정리
			if (window.RULE_CHECKBOXES['chaos'].first().is(':checked')) window.RULE_CHECKBOXES['chaos'].first().prop('checked', false).trigger('change');
		}
	});
	window.RULE_CHECKBOXES['chaos'].on('change', function () {
		if ($(this).is(':checked')) window.RULE_CHECKBOXES['latejoin'].prop('checked', false);
	});
	['change', 'survival'].forEach(function (opt) {
		window.RULE_CHECKBOXES[opt].on('change', function () {
			if ($(this).is(':checked')) window.RULE_CHECKBOXES['latejoin'].prop('checked', false);
		});
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
		// 켤 수 있는 규칙이 10개 이하면 각 규칙 50%, 그 이상이면 평균 5개가 켜지도록 확률을 낮춤
		var baseProb = Math.min(0.5, 5 / Math.max(opts.length, 1));

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
			target[n] = blocked ? false : Math.random() < (prob === undefined ? baseProb : prob);
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
			noshortOn = Math.random() < baseProb;
			target['noshort'] = noshortOn;
			decided['noshort'] = true;
		}
		pickUnlessBlocked('nol', noshortOn);
		pickUnlessBlocked('no2', noshortOn);

		// 아이템전/카오스/랜덤턴, 리턴/한 번만! (각각 상호배제)
		var turnPick = pickRadio(['itm', 'chs', 'rnt']);
		pickRadio(['ret', 'obo']);
		// 소수: 랜덤 턴이 켜졌을 때만, 랜덤 숫자와는 상호배제
		pickUnlessBlocked('prm', turnPick !== 'randomturn');
		// 카오스 플러스: 카오스가 켜졌을 때만
		pickUnlessBlocked('chp', turnPick !== 'chaos');
		pickUnlessBlocked('rnm', target['prime']);

		// 미션: 켜져 있을 때만 이지미션/랜덤미션/미션플러스 선택 가능
		var missionOn = false;
		if (has('mis')) {
			missionOn = Math.random() < baseProb;
			target['mission'] = missionOn;
			decided['mission'] = true;
		}
		['eam', 'rdm', 'mpl'].forEach(function (c) {
			if (!has(c)) return;
			var n = nameOf(c);
			target[n] = missionOn && Math.random() < baseProb;
			decided[n] = true;
		});

		// drg 규칙은 다른 단독 규칙과 달리 10% 확률로만 켜짐
		pickUnlessBlocked('drg', false, 0.1);

		// 나머지 단독 규칙은 1/2 확률로 독립적으로 선택
		for (i in OPTIONS) {
			if (!has(i)) continue;
			k = nameOf(i);
			if (decided[k]) continue;
			target[k] = Math.random() < baseProb;
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
		if (has('spk')) $data._songpick = "";

		// 4. 라운드/서바이벌 설정을 규칙이 허용하는 범위 내에서 랜덤화
		// 달가루 모으기는 라운드 1 / 60초로 고정이므로 랜덤화 대상에서 제외
		if (rule.rule !== "Wordcollect" && rule.rule !== "Rhythm" && rule.rule !== "Rtype") {
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
		}
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

			// song pick 패널 표시
			if (rule.opts.indexOf("spk") != -1) $("#view-all-songpick-panel").show();
			else $("#view-all-songpick-panel").hide();
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
			$("#view-all-songpick-panel").hide();

			// Show flat panel
			$("#view-all-flat-panel").show();

			// injeong pick 패널 표시 (flat mode)
			if (rule.opts.indexOf("ijp") != -1) $("#view-all-flat-injpick-panel").show();
			else $("#view-all-flat-injpick-panel").hide();

			// quiz pick 패널 표시 (flat mode)
			if (rule.opts.indexOf("qij") != -1) $("#view-all-flat-quizpick-panel").show();
			else $("#view-all-flat-quizpick-panel").hide();

			// song pick 패널 표시 (flat mode)
			if (rule.opts.indexOf("spk") != -1) $("#view-all-flat-songpick-panel").show();
			else $("#view-all-flat-songpick-panel").hide();
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
		var previousPlayerScroll = !!($data.opts && $data.opts.ps);
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
			ps: $("#player-scroll").is(":checked"),
			kr: $("#kana-reading").is(":checked"),
			sp: newSoundPack,
			lp: newLevelPack
		};

		// localStorage에 볼륨 설정 저장
		var newDarkMode = $("#dark-mode-setting").val() || 'light';
		var newBeatMode = $("#beat-setting").val() || 'auto';
		var newUI = $("#ui-setting").val() === 'new' ? 'new' : 'classic';
		var newUIStyle = $("#ui-style-setting").val() === 'flat' ? 'flat' : 'mixed';
		var uiChanged = (loadVolumeSettings().ui === 'new' ? 'new' : 'classic') !== newUI;
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
			beatMode: newBeatMode,
			rhythmSync: Number($("#rhythm-sync").val()) || 0,
			ui: newUI,
			uiStyle: newUIStyle
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

		// 기본/신 UI 전환은 화면 틀 전체가 바뀌므로 새로고침, 스타일(단색/혼합)은 즉시 반영
		if (uiChanged) {
			reloadWithUI(newUI);
			return;
		}
		if (NK.active) document.documentElement.setAttribute('data-nk-style', newUIStyle);

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
			// 현재 재생 중인 BGM 중지 (리듬/자음퀴즈 진행 중에는 그 게임의 BGM이므로 끊지 않음)
			if (!isGameBGMKept()) {
				var old = $data.bgm;
				$data.bgm = null;
				if (old) {
					old.stop();
				}
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

		// 플레이어 스크롤 옵션 변경 시 대기실 카드 UI 즉시 다시 그림 (게임 중에는 다음 라운드 렌더부터 반영)
		if (previousPlayerScroll !== $data.opts.ps && $data.room && !$data.room.gaming && previousLevelPack === newLevelPack) {
			updateRoom(false);
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

	// 기본 UI에서 베타 UI를 고르면 먼저 확인 (UI_BETA_WARN, head.js). 확인을 눌러야만 베타 UI로 남음
	$("#ui-setting").on('change', function () {
		var $sel = $(this);
		if (!UI_BETA_WARN || $sel.val() !== 'new' || loadVolumeSettings().ui === 'new') return;
		$sel.val('classic');
		showConfirm(L['uiBetaWarning'], function (ok) {
			if (ok) $sel.val('new');
		});
	});

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

	$("#rhythm-sync").on('input change', function () {
		var v = Number($(this).val()) || 0;

		$("#rhythm-sync-val").text((v > 0 ? "+" : "") + v + " ms");
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
			quizpick: $data._quizpick,
			songpick: $data._songpick
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
		// 신 UI는 탭으로 묶은 프로필 관리 창의 꾸미기 탭을 엶
		if (NK.active ? NK.openProfile('dress') : showDialog($stage.dialog.dress)) $.get("/box", function (res) {
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

		// 창을 열 때 지금 별명·소개말을 미리 채우므로 지금 값과 같으면 바꾸지 않음
		if ($("#dress-nickname").val() && $("#dress-nickname").val() !== myNickname()) data.nickname = $("#dress-nickname").val();
		if ($("#dress-exordial").val() !== undefined && $("#dress-exordial").val() !== ($data.users[$data.id].exordial || "")) data.exordial = $("#dress-exordial").val();


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
		if (NK.active ? NK.openProfile('cf') : showDialog($stage.dialog.charFactory)) drawCharFactory();
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
		if (NK.active ? NK.openProfile('craft') : showDialog($stage.dialog.craftWorkshop)) drawCraftWorkshop();
	});
	$stage.menu.exchange.on('click', function (e) {
		if ($data._gaming) return fail(438);
		if ($data.guest) return fail(459);
		if (showDialog($stage.dialog.exchangeWorkshop)) {
			// 추석 이벤트 기간에는 이 다이얼로그가 교환소 대신 달가루 패널을 보여준다 (아이템 교환소가 없는 이벤트라서)
			if (EVENT_ACTIVE_KWC) drawMoonPanel();
			else drawExchangeWorkshop();
		}
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
		// 보이는 주제만 (주제 검색 중이면 검색에 맞는 것만 — 퀴즈 주제와 같게)
		$("#injpick-list div:visible > input").prop('checked', true);
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
	// 주제 검색: 이름에 검색어가 들어간 주제만 보임(띄어쓰기·대소문자 무시). 언어별 목록·한국어 전용 퀴즈 주제를 고르는
	// 기존 show/hide와 겹치지 않게 클래스(pick-miss)로 숨김. 창을 열 때마다 비움(showDialog)
	function filterPicks($list, q) {
		var $rows = $list.find("input").parent();

		q = (q || "").replace(/\s/g, "").toLowerCase();
		$rows.each(function () {
			$(this).toggleClass("pick-miss", $(this).children("label").text().replace(/\s/g, "").toLowerCase().indexOf(q) === -1);
		});
		$list.find(".ijp-sec").each(function () {
			$(this).toggleClass("pick-miss", !$(this).nextUntil(".ijp-sec").not(".pick-miss").length);
		});
		$list.children(".pick-empty").toggle(!!q && !$rows.filter(":visible").length);
	}
	$("#injpick-search").on('input', function () { filterPicks($("#injpick-list"), $(this).val()); });
	$("#quizpick-search").on('input', function () { filterPicks($("#quizpick-list"), $(this).val()); });
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
	// Song pick handlers: 한 곡만 고름 (빈 값 = 무작위). 목록에 없는 곡이면 무작위에 체크
	$("#room-song-pick, #room-song-pick-flat, #room-simple-song-pick, #view-all-song-pick, #view-all-flat-song-pick").on('click', function (e) {
		var $inputs = $("#songpick-list input");
		var $cur = $inputs.filter(function () { return this.value === ($data._songpick || ""); });

		($cur.length ? $cur : $inputs.first()).prop('checked', true);
		showDialog($stage.dialog.songPick);
	});
	$stage.dialog.songPickOK.on('click', function (e) {
		$data._songpick = $("#songpick-list input:checked").val() || "";
		$stage.dialog.songPick.hide();
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
	for (i = 0; i < 7; i++) $("#team-" + i).on('click', onTeam);
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
	// 소수는 랜덤 턴이 켜져 있을 때만 선택 가능 (아이템전/카오스가 랜덤 턴을 끄는 경우도 포함)
	function updatePrimeAvailability() {
		var randomTurnOn = window.RULE_CHECKBOXES['randomturn'].first().is(':checked');
		if (!randomTurnOn) window.RULE_CHECKBOXES['prime'].prop('checked', false);
		window.RULE_CHECKBOXES['prime'].prop('disabled', !randomTurnOn);
	}
	['item', 'chaos', 'randomturn'].forEach(function (opt) {
		window.RULE_CHECKBOXES[opt].on('change', updatePrimeAvailability);
	});
	// 카오스 플러스는 카오스가 켜져 있을 때만 선택 가능 (아이템전/랜덤 턴이 카오스를 끄는 경우도 포함)
	function updateChaosPlusAvailability() {
		var chaosOn = window.RULE_CHECKBOXES['chaos'].first().is(':checked');
		if (!chaosOn) window.RULE_CHECKBOXES['chaosplus'].prop('checked', false);
		window.RULE_CHECKBOXES['chaosplus'].prop('disabled', !chaosOn);
	}
	['item', 'chaos', 'randomturn'].forEach(function (opt) {
		window.RULE_CHECKBOXES[opt].on('change', updateChaosPlusAvailability);
	});
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
		updatePrimeAvailability();
		updateChaosPlusAvailability();
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
		var relay = relayURL($data.URL);
		var opened = false;
		var sock = ws = new _WebSocket(relay || $data.URL);
		// 중계가 응답 없이 멈춰 있으면 5초 뒤 끊어서 기존 주소로 넘어가게 한다
		if (relay) _setTimeout(function () { if (!opened && sock.readyState === _WebSocket.CONNECTING) sock.close(); }, 5000);
		ws.onopen = function (e) {
			opened = true;
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

			// Worker 중계로 연결조차 못 했으면 이 페이지에서는 중계를 끄고 기존 주소로 바로 다시 접속
			if (relay && !opened) {
				$data._relayFailed = true;
				connect();
				return;
			}

			if (rws) rws.close();
			stopAllSounds();

			// 연결이 끊기면 재접속 성공 여부와 무관하게 즉시 로비 화면으로 전환한다.
			// (재접속 시 서버가 다시 'welcome'을 보내며 로비 상태로 초기화하므로,
			//  화면도 미리 로비로 돌려놓아 끊긴 방/게임 화면에 그대로 머무르지 않게 한다)
			// 방 소켓이 먼저 끊겨 place가 이미 0이어도 연습·게임 상태가 남아 있을 수 있으므로 resetRoomState가 판단한다
			if (resetRoomState()) {
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
			if (!$data._chaosHideTurn) mobile ? $stage.game.hereText.focus() : $stage.talk.focus(); // 카오스 플러스 차례 숨기기: 포커스로 차례를 알리지 않음
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

		if (MODE[$data.room.mode] == "KAP" || MODE[$data.room.mode] == "KAK" || MODE[$data.room.mode] == "EAP" || MODE[$data.room.mode] == "EAK" || MODE[$data.room.mode] == "JAP") $stage.game.display.empty()
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
	// 칩 글자(①②③…) 대신 순서로 — 신 UI는 칩을 그냥 숫자로 보여 줌
	var round = $(".rounds label").index(e.currentTarget) + 1;

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
			if (!$data._chaosHideTurn) mobile ? $stage.game.hereText.focus() : $stage.talk.focus(); // 카오스 플러스 차례 숨기기: 포커스로 차례를 알리지 않음
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
			if (!$data._chaosHideTurn) mobile ? $stage.game.hereText.focus() : $stage.talk.focus(); // 카오스 플러스 차례 숨기기: 포커스로 차례를 알리지 않음
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
        tStr = "&lt;" + (modeCode === 'XBB' ? L['modeXBB'] : (L && L['anything'] ? L['anything'] : "아무거나")) + "&gt;";
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
            if (!$data._chaosHideTurn) mobile ? $stage.game.hereText.focus() : $stage.talk.focus(); // 카오스 플러스 차례 숨기기: 포커스로 차례를 알리지 않음
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
// 단어 수가 100개를 넘어가면 재렌더를 200ms 간격으로 몰아서 실행 (봇이 빠르게 연속 제출할 때 매번 전체 목록을 다시 그리며 버벅이는 것을 완화)
$lib.Sock.drawMaps = function () {
	if ($data._maps.length > 100) {
		if ($data._bbThrottleTimer) return;
		var wait = Math.max(0, 200 - (Date.now() - ($data._bbLastDraw || 0)));
		$data._bbThrottleTimer = setTimeout(function () {
			$data._bbThrottleTimer = null;
			$data._bbLastDraw = Date.now();
			$lib.Sock._renderMaps();
		}, wait);
		return;
	}
	$lib.Sock._renderMaps();
};
$lib.Sock._renderMaps = function () {
	// 신 UI: 길이별로 묶은 단어 칩으로 그림 (nk.js renderFound)
	if (NK.active) return NK.renderFound($stage.game.bb, $data._maps);
	var len = $data._maps.length;
	// 컬럼(=줄) 증가 간격(STEP)과 축소 시작 시점(MAX_COLS): 모바일은 표시 공간이 훨씬 좁으므로 데스크톱보다 촘촘하게 잡음
	// SWITCH 이전엔 STEP개당 1컬럼씩, 그 이후는 MAX_COLS²*DIVISOR, (MAX_COLS+1)²*DIVISOR ... 식으로 늘어남
	var STEP = mobile ? 12 : 18;
	var MAX_COLS = mobile ? 2 : 6;
	var SWITCH = STEP * MAX_COLS;
	var DIVISOR = STEP / MAX_COLS;
	var cols = (len <= SWITCH) ? Math.max(2, Math.ceil(len / STEP)) : Math.ceil(Math.sqrt(len / DIVISOR));

	$stage.game.bb.empty();
	// $stage.game.bb.css('--bb-cols', cols); // Removed CSS var approach
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	var widthPct = (100 / cols) + "%"; // Calculate percentage directly

	$data._maps.sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});

	// 컬럼(줄) 수가 MAX_COLS를 넘으면 그 비율만큼 셀 크기(너비/글자/여백)를 통째로 줄임
	// padding·margin도 같이 줄여야 칸 너비 대비 여백 비중이 커지지 않아, 줄이 늘어도 한 줄에 들어가는 글자 수가 유지됨
	if (cols > MAX_COLS) {
		var $chars = $stage.game.bb.find(".bb-char");
		var $sample = $chars.first();
		if ($sample.length) {
			var MIN_FONT = 3;
			var baseWidth = parseFloat($sample.css('width'));
			var baseFont = parseFloat($sample.css('font-size'));
			var basePadding = parseFloat($sample.css('padding-left'));
			var baseMargin = parseFloat($sample.css('margin-left'));
			// 모바일은 원래 크기의 절반(0.5) 밑으로는 더 안 줄어들게 축소 하한을 둠
			var floor = MIN_FONT / baseFont;
			if (mobile) floor = Math.max(floor, 0.5);
			var scale = Math.max(MAX_COLS / cols, floor);
			$chars.css({
				'width': (baseWidth * scale) + 'px',
				'font-size': (baseFont * scale) + 'px',
				'padding': (basePadding * scale) + 'px',
				'margin': (baseMargin * scale) + 'px'
			});
		}
	}
	function $word(text) {
		// 모바일은 컬럼 폭 대신 일반 텍스트처럼 가로로 흐르다 줄바꿈되게 폭을 지정하지 않음
		var $R = $("<div>").addClass("bb-word");
		if (!mobile) $R.css('width', widthPct);
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
	$lib.Shuk.drawMaps(); // clearBoard()는 .bb를 숨기기만 할 뿐 비우지 않으므로, 이전 라운드 단어 DOM이 그대로 남아있지 않도록 여기서 명시적으로 다시 그림
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
// 단어 수가 100개를 넘어가면 재렌더를 200ms 간격으로 몰아서 실행 (봇이 빠르게 연속 제출할 때 매번 전체 목록을 다시 그리며 버벅이는 것을 완화)
$lib.Shuk.drawMaps = function () {
	if ($data._maps.length > 100) {
		if ($data._bbThrottleTimer) return;
		var wait = Math.max(0, 200 - (Date.now() - ($data._bbLastDraw || 0)));
		$data._bbThrottleTimer = setTimeout(function () {
			$data._bbThrottleTimer = null;
			$data._bbLastDraw = Date.now();
			$lib.Shuk._renderMaps();
		}, wait);
		return;
	}
	$lib.Shuk._renderMaps();
};
$lib.Shuk._renderMaps = function () {
	// 신 UI: 길이별로 묶은 단어 칩으로 그림 (nk.js renderFound)
	if (NK.active) return NK.renderFound($stage.game.bb, $data._maps);
	var len = $data._maps.length;
	// 컬럼(=줄) 증가 간격(STEP)과 축소 시작 시점(MAX_COLS): 모바일은 표시 공간이 훨씬 좁으므로 데스크톱보다 촘촘하게 잡음
	// SWITCH 이전엔 STEP개당 1컬럼씩, 그 이후는 MAX_COLS²*DIVISOR, (MAX_COLS+1)²*DIVISOR ... 식으로 늘어남
	var STEP = mobile ? 12 : 18;
	var MAX_COLS = mobile ? 2 : 6;
	var SWITCH = STEP * MAX_COLS;
	var DIVISOR = STEP / MAX_COLS;
	var cols = (len <= SWITCH) ? Math.max(2, Math.ceil(len / STEP)) : Math.ceil(Math.sqrt(len / DIVISOR));
	var widthPct = (100 / cols) + "%";

	$stage.game.bb.empty();
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	$data._maps.sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});

	// 컬럼(줄) 수가 MAX_COLS를 넘으면 그 비율만큼 셀 크기(너비/글자/여백)를 통째로 줄임
	// padding·margin도 같이 줄여야 칸 너비 대비 여백 비중이 커지지 않아, 줄이 늘어도 한 줄에 들어가는 글자 수가 유지됨
	if (cols > MAX_COLS) {
		var $chars = $stage.game.bb.find(".bb-char");
		var $sample = $chars.first();
		if ($sample.length) {
			var MIN_FONT = 3;
			var baseWidth = parseFloat($sample.css('width'));
			var baseFont = parseFloat($sample.css('font-size'));
			var basePadding = parseFloat($sample.css('padding-left'));
			var baseMargin = parseFloat($sample.css('margin-left'));
			// 모바일은 원래 크기의 절반(0.5) 밑으로는 더 안 줄어들게 축소 하한을 둠
			var floor = MIN_FONT / baseFont;
			if (mobile) floor = Math.max(floor, 0.5);
			var scale = Math.max(MAX_COLS / cols, floor);
			$chars.css({
				'width': (baseWidth * scale) + 'px',
				'font-size': (baseFont * scale) + 'px',
				'padding': (basePadding * scale) + 'px',
				'margin': (baseMargin * scale) + 'px'
			});
		}
	}
	function $word(text) {
		// 모바일은 컬럼 폭 대신 일반 텍스트처럼 가로로 흐르다 줄바꿈되게 폭을 지정하지 않음
		var $R = $("<div>").addClass("bb-word");
		if (!mobile) $R.css('width', widthPct);
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

$lib.Wordcollect = {};

// 방 전체 점수 합(S)을 0~100 밝기로 변환: 0~20은 선형(20당 10), 20 이상은 배로 늘 때마다 +10 (320→50, 10240→100), 100 이상은 고정
function wcMoonBrightness(roomScore) {
	var s = roomScore || 0;
	if (s <= 0) return 0;
	if (s <= 20) return s / 2;
	return Math.min(100, 10 + 10 * Math.log2(s / 20));
}
// 밝기(0~100)를 달 색으로 보간: 0=어두운 갈색, 50=금색, 100=크림색
var WC_MOON_STOPS = [
	{ p: 0, c: [57, 42, 24] },
	{ p: 50, c: [255, 200, 0] },
	{ p: 100, c: [253, 254, 241] }
];
function wcMoonColor(pct) {
	var i, a, b, t;
	pct = Math.max(0, Math.min(100, pct));
	for (i = 0; i < WC_MOON_STOPS.length - 1; i++) {
		a = WC_MOON_STOPS[i];
		b = WC_MOON_STOPS[i + 1];
		if (pct <= b.p) {
			t = (pct - a.p) / (b.p - a.p);
			return [
				Math.round(a.c[0] + (b.c[0] - a.c[0]) * t),
				Math.round(a.c[1] + (b.c[1] - a.c[1]) * t),
				Math.round(a.c[2] + (b.c[2] - a.c[2]) * t)
			];
		}
	}
	return WC_MOON_STOPS[WC_MOON_STOPS.length - 1].c;
}
function wcRgb(rgb) {
	return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
}
function wcBlendWhite(rgb, p) {
	return [
		Math.round(rgb[0] + (255 - rgb[0]) * p),
		Math.round(rgb[1] + (255 - rgb[1]) * p),
		Math.round(rgb[2] + (255 - rgb[2]) * p)
	];
}
function wcApplyMoonColor(pct) {
	var $moon = $data._wcNight ? $data._wcNight.find(".wc-moon") : null;
	var rgb;

	if (!$moon || !$moon.length) return;
	rgb = wcMoonColor(pct);
	// jQuery 1.9의 .css()는 CSS 커스텀 프로퍼티(--*)를 camelCase로 잘못 변환해 무시하므로 setProperty를 직접 사용
	$moon[0].style.setProperty('--moon-color', wcRgb(rgb));
	$moon[0].style.setProperty('--moon-highlight', wcRgb(wcBlendWhite(rgb, 0.1)));
	$moon[0].style.setProperty('--moon-glow', 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.6)');
}
function wcFlyWordToMoon($uc, text) {
	var $moon = $data._wcNight ? $data._wcNight.find(".wc-moon") : null;
	if (!$moon || !$moon.length || !$uc || !$uc.length) return;

	var start = $uc.offset();
	var end = $moon.offset();
	var z = NK.gameZoom; // offset()은 확대된 값, 폭·높이는 확대 전 값 (기본 UI는 1)
	// 날아가는 글자는 body에 붙으므로 화면 값을 CSS 값으로 (UI 배율 z로 나눔)
	var $fly = $("<div>").addClass("wc-fly-word").text(text).css({
		left: start.left / z + $uc.outerWidth() / 2,
		top: start.top / z + $uc.outerHeight() / 2
	});
	$("body").append($fly);
	$fly.animate({
		left: end.left / z + $moon.outerWidth() / 2,
		top: end.top / z + $moon.outerHeight() / 2,
		opacity: 0
	}, 700, function () { $fly.remove(); });
}

$lib.Wordcollect.roundReady = function (data, spec) {
	clearBoard();
	$data._relay = true;
	$data.room.round = 1;
	$data._maps = [];
	$(".jjoriping,.rounds,.game-body").addClass("cw wordcollect");

	if (!$data._wcNight) {
		$data._wcNight = $("<div>").addClass("wc-night-overlay").append(
			$("<div>").addClass("wc-stars"),
			$("<div>").addClass("wc-moon"),
			$("<div>").addClass("wc-condition"),
			$("<div>").addClass("wc-timer"),
			$("<div>").addClass("wc-dust-count")
		);
		$(".GameBox").prepend($data._wcNight);
	}
	wcApplyMoonColor(wcMoonBrightness(data.totalScore || 0));

	if (data.time) $data.room.time = data.time;
	$data._roundTime = $data.room.time * 1000;
	$data._wcNight.find(".wc-condition").html(L['wcCondition_' + data.condition] || '');
	$data._wcNight.find(".wc-timer").text((Math.max(0, $data._roundTime) / 1000).toFixed(1));
	$data._wcNight.find(".wc-dust-count").text(data.totalScore || 0);
	$stage.game.items.hide();
	$stage.game.bb.show();
	$lib.Wordcollect.drawMaps();
	$stage.game.display.html(L['wcCondition_' + data.condition] || '');
	drawRound(data.round || 1);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Wordcollect.turnStart = function (data) {
	$(".jjoriping,.rounds").addClass("wc-round-active");
	if ($data._wcNight) $data._wcNight.addClass("wc-active");
	if (typeof data.roundTime === 'number') $data._roundTime = data.roundTime;
	// 서버가 보낸 남은 시간을 벽시계 기준 종료 시각으로 고정해두고, 매 tick마다 setInterval 누적 오차 대신
	// Date.now()와의 차이로 다시 계산 (백그라운드 탭 등에서 setInterval이 밀려도 표시가 실제 서버 시간과 어긋나지 않음)
	$data._wcEndAt = Date.now() + $data._roundTime;
	clearInterval($data._tTime);
	$data._tTime = addInterval($lib.Wordcollect.turnGoing, TICK);
	playBGM('moondust');
};
$lib.Wordcollect.turnGoing = function () {
	if (!$data.room || !$data.room.gaming) return clearInterval($data._tTime);
	$data._roundTime = $data._wcEndAt - Date.now();

	if ($data._wcNight) {
		if ($data._roundTime <= 0) {
			$data._wcNight.find(".wc-timer").text(L['wcTimeUp'] || '');
			clearInterval($data._tTime);
			stopBGM();
		} else {
			$data._wcNight.find(".wc-timer").text(($data._roundTime / 1000).toFixed(1));
		}
	}
};
$lib.Wordcollect.turnEnd = function (id, data) {
	if (!data || !data.target) {
		stopBGM();
		playSound('horr');
		return;
	}

	var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
	var $uc = $("#game-user-" + id);

	$data._maps.push(data.value);
	$lib.Wordcollect.drawMaps();

	wcApplyMoonColor(wcMoonBrightness(data.roomScore));
	if ($data._wcNight) $data._wcNight.find(".wc-dust-count").text(data.roomScore);
	wcFlyWordToMoon($uc, data.value);

	if (id == $data.id) playSound('success');
	else playSound('mission');

	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	drawObtainedScore($uc, $sc);
};
// sock/shuk 모드의 공용 단어 목록 렌더링과 동일한 패턴 (칸 수에 따라 폰트/여백을 축소)
$lib.Wordcollect.drawMaps = function () {
	if ($data._maps.length > 100) {
		if ($data._bbThrottleTimer) return;
		var wait = Math.max(0, 200 - (Date.now() - ($data._bbLastDraw || 0)));
		$data._bbThrottleTimer = setTimeout(function () {
			$data._bbThrottleTimer = null;
			$data._bbLastDraw = Date.now();
			$lib.Wordcollect._renderMaps();
		}, wait);
		return;
	}
	$lib.Wordcollect._renderMaps();
};
$lib.Wordcollect._renderMaps = function () {
	var len = $data._maps.length;
	var STEP = mobile ? 12 : 18;
	var MAX_COLS = mobile ? 2 : 6;
	var SWITCH = STEP * MAX_COLS;
	var DIVISOR = STEP / MAX_COLS;
	var cols = (len <= SWITCH) ? Math.max(2, Math.ceil(len / STEP)) : Math.ceil(Math.sqrt(len / DIVISOR));
	var widthPct = (100 / cols) + "%";

	$stage.game.bb.empty();
	if (cols > 2) $stage.game.bb.addClass("many-cols");
	else $stage.game.bb.removeClass("many-cols");

	$data._maps.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (item) {
		$stage.game.bb.append($word(item));
	});

	if (cols > MAX_COLS) {
		var $chars = $stage.game.bb.find(".bb-char");
		var $sample = $chars.first();
		if ($sample.length) {
			var MIN_FONT = 3;
			var baseWidth = parseFloat($sample.css('width'));
			var baseFont = parseFloat($sample.css('font-size'));
			var basePadding = parseFloat($sample.css('padding-left'));
			var baseMargin = parseFloat($sample.css('margin-left'));
			var floor = MIN_FONT / baseFont;
			if (mobile) floor = Math.max(floor, 0.5);
			var scale = Math.max(MAX_COLS / cols, floor);
			$chars.css({
				'width': (baseWidth * scale) + 'px',
				'font-size': (baseFont * scale) + 'px',
				'padding': (basePadding * scale) + 'px',
				'margin': (baseMargin * scale) + 'px'
			});
		}
	}
	function $word(text) {
		var $R = $("<div>").addClass("bb-word");
		if (!mobile) $R.css('width', widthPct);
		var i, len = text.length;

		for (i = 0; i < len; i++) {
			$R.append($("<div>").addClass("bb-char").html(text.charAt(i)));
		}
		return $R;
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

$lib.Sudoku = {};

// 십자말풀이처럼 퍼즐 전체가 한 라운드에 열리고, 상단 라운드 번호(①②③…)를 눌러 판을 전환한다
$lib.Sudoku.roundReady = function (data, spec) {
	var turn = data.seq ? data.seq.indexOf($data.id) : -1;

	clearBoard();
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data.selectedRound = (turn == -1) ? 1 : (turn % $data.room.round + 1);
	$stage.game.items.hide();
	$stage.game.cwcmd.show().css('opacity', 0);
	// 스도쿠는 칸을 눌러 cwcmd 입력창으로 답을 내므로 게임 입력창 숨김
	$stage.game.here.hide();
	drawRound($data.selectedRound);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
// data: { boards: [{ size, subW, subH, cells[size*size](0=빈 칸), owners{idx: id} }], roundTime(관전/난입 시) }
$lib.Sudoku.turnStart = function (data) {
	$data._sdk = data.boards;
	if (typeof data.roundTime === 'number') $data._roundTime = data.roundTime;
	$(".rounds label").on('click', $lib.Sudoku.onRound);
	$lib.Sudoku.drawDisplay();
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Sudoku.onRound = function (e) {
	// 칩 글자(①②③…) 대신 순서로 — 신 UI는 칩을 그냥 숫자로 보여 줌
	var round = $(".rounds label").index(e.currentTarget) + 1;

	$data._sel = null;
	$stage.game.cwcmd.css('opacity', 0);
	drawRound($data.selectedRound = round);
	$(".rounds label").on('click', $lib.Sudoku.onRound);
	$lib.Sudoku.drawDisplay();
};
$lib.Sudoku.turnEnd = function (id, data) {
	var $uc = $("#game-user-" + id);
	var $sc, $cell, $cr, board;

	// 라운드 종료
	if (data.ok === false) {
		clearInterval($data._tTime);
		$data._sel = null;
		$stage.game.cwcmd.css('opacity', 0);
		stopBGM();
		playSound('horr');
		return;
	}
	if (!$data._sdk) return;

	$sc = $("<div>").addClass("deltaScore").html((data.score > 0 ? "+" : "") + data.score);
	if (data.score < 0) $sc.addClass("lost");
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	drawObtainedScore($uc, $sc);

	if (data.wrong) {
		if (id == $data.id) {
			playSound('fail');
			if (data.pos[0] == $data.selectedRound - 1) {
				$cell = $("#sdk-" + data.pos[1]).addClass("sd-wrong");
				addTimeout(function () { $cell.removeClass("sd-wrong"); }, 400);
			}
			$("#cw-q-input").focus();
		}
		return;
	}

	board = $data._sdk[data.pos[0]];
	board.cells[data.pos[1]] = data.value;
	board.owners[data.pos[1]] = id;
	playSound(id == $data.id ? 'success' : 'mission');
	// 지금 입력 중이던 칸이 채워졌으면 입력창 닫기
	if ($data._sel && $data._sel[0] == data.pos[0] && $data._sel[1] == data.pos[1]) {
		$data._sel = null;
		$stage.game.cwcmd.css('opacity', 0);
	}
	if (data.pos[0] == $data.selectedRound - 1) $lib.Sudoku.drawDisplay();
	else {
		$cr = $($stage.game.round.children("label").get(data.pos[0])).addClass("round-effect");
		addTimeout(function () { $cr.removeClass("round-effect"); }, 800);
	}
};
$lib.Sudoku.onCell = function (e) {
	var idx = Number($(e.currentTarget).attr('data-idx'));

	if ($data._sdk[$data.selectedRound - 1].cells[idx]) return;
	$data._sel = [$data.selectedRound - 1, idx];
	$stage.game.cwcmd.css('opacity', 1);
	$(".cw-q-head").html(L['sudokuPrompt']);
	$(".cw-q-body").html("");
	$("#cw-q-input").val("").focus();
	$lib.Sudoku.drawDisplay();
};
$lib.Sudoku.drawDisplay = function () {
	var sdk = $data._sdk[$data.selectedRound - 1];
	var $pane = $stage.game.display.empty();
	var size = sdk.size;
	var CELL = 100 / size;
	var bx, by, x, y, i, v, owner, $bar, $cell;

	// 십자말풀이와 같은 구조: 서브그리드마다 막대(.cw-bar) 하나, 그 안에 칸(.cw-cell)들
	for (by = 0; by < size / sdk.subH; by++) {
		for (bx = 0; bx < size / sdk.subW; bx++) {
			$bar = $("<div>").addClass("cw-bar")
				// 서브블록 좌표 (x, y)의 합이 홀수인 블록의 막대는 더 밝게, 아니면 더 어둡게
				.addClass((bx + by) % 2 ? "sd-light" : "sd-dark")
				.css({
					top: by * sdk.subH * CELL + "%",
					left: bx * sdk.subW * CELL + "%",
					width: sdk.subW * CELL + "%",
					height: sdk.subH * CELL + "%",
					display: 'flex',
					'flex-wrap': 'wrap',
					'align-content': 'flex-start'
				});
			for (y = 0; y < sdk.subH; y++) {
				for (x = 0; x < sdk.subW; x++) {
					i = (by * sdk.subH + y) * size + bx * sdk.subW + x;
					v = sdk.cells[i];
					owner = sdk.owners[i];
					$cell = $("<div>").addClass("cw-cell")
						.attr({ id: "sdk-" + i, 'data-idx': i })
						.css({
							'box-sizing': 'border-box',
							width: 'calc(' + (100 / sdk.subW) + '% - 6px)',
							height: 'calc(' + (100 / sdk.subH) + '% - 6px)',
							// 이지 모드(6x6)는 판이 커져 칸이 넓으므로 글자를 1.5배로
							'font-size': size == 6 ? '1.5em' : '',
							color: ($data.room.opts.drg ? getRandomColor() : '')
						})
						.html(v || "");
					// 주어진 칸/남이 맞힌 칸은 sd-open, 내가 맞힌 칸은 sd-my-open, 빈 칸은 눌러서 선택
					if (owner == $data.id) $cell.addClass("sd-open sd-my-open");
					else if (v) $cell.addClass("sd-open");
					else $cell.addClass("sd-empty").on('click', $lib.Sudoku.onCell);
					if ($data._sel && $data._sel[1] === i) $cell.addClass("sd-sel");
					$bar.append($cell);
				}
			}
			$pane.append($bar);
		}
	}
};
$lib.Sudoku.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Sudoku.turnHint = function (data) {
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

/**
 * Picture Quiz (그림퀴즈) Client-side Rule
 * Free-draw canvas version
 */

// Canvas settings
var PQ_CANVAS_W = 288;
var PQ_CANVAS_H = 180;
var PQ_BRUSH_SIZES = [3, 8, 16];
var PQ_THROTTLE_MS = 50;
var PQ_UNDO_MAX = 10;
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

// Undo history: canvas snapshots taken before each action (max PQ_UNDO_MAX)
// 스냅샷은 재사용 캔버스에 drawImage로 복사 (getImageData와 달리 매번 메모리를 새로 할당하지 않음).
// 캔버스는 스택 또는 풀 중 한 곳에만 있으므로 생성 개수는 최대 PQ_UNDO_MAX개.
var pqUndoPool = [];

function pqPushUndo() {
    if (!$data._pqCtx) return;
    var snap;
    if ($data._pqUndo.length >= PQ_UNDO_MAX) snap = $data._pqUndo.shift();
    else snap = pqUndoPool.pop();
    if (!snap) {
        snap = document.createElement('canvas');
        snap.width = PQ_CANVAS_W;
        snap.height = PQ_CANVAS_H;
    }
    var sctx = snap.getContext('2d');
    sctx.clearRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);
    sctx.drawImage($data._pqCanvasEl, 0, 0);
    $data._pqUndo.push(snap);
}

function pqPopUndo() {
    var ctx = $data._pqCtx;
    if (!ctx || $data._pqUndo.length === 0) return false;
    var snap = $data._pqUndo.pop();
    ctx.drawImage(snap, 0, 0);
    pqUndoPool.push(snap);
    return true;
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

    pqPushUndo();
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
    $data._pqSendTimer = _setInterval(flushPendingPoints, PQ_THROTTLE_MS);
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

// Canvas element (drawer gets the stroke listeners)
function pqMakeCanvas(isDrawer) {
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
    return canvas;
}

function pqPass() {
    playSound('mission');
    send('pass', {});
    $(this).prop('disabled', true).css('opacity', '0.5');
}

function pqUndo() {
    if ($data._pqDrawing) endStroke();
    if (pqPopUndo()) send('undo', {});
}

function pqClearAll() {
    showConfirm(L['pqSureClear'] || '정말 모두 지우시겠습니까?', function (res) {
        if (res) {
            pqPushUndo();
            $data._pqStrokes = [];
            var c = $data._pqCtx;
            if (c) { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H); }
            send('clear', {});
        }
    });
}

// 신 UI(H안, 사용자 결정): 직사각형 캔버스, 위에 색 팔레트(휴대폰은 간격 없는 한 줄)·붓 굵기·붓/채우기/지우개, 아래에 패스·모두 지우기.
// 모양은 nk.css, 고른 상태는 인라인 테두리 대신 on 클래스(pqMarkNK). 붓 굵기는 붓·지우개 모두에 씀
function pqDrawDisplayNK() {
    var isDrawer = $data._pqIsDrawer, $main = $("<div>").addClass("nk-pq").toggleClass("nk-pq-draw", isDrawer), $head = $("<div>").addClass("nk-pq-head"),
        $pal, $tool, $ctl, customInput;

    $head.append($("<div>").text(L['pqTheme'] + " · " + (L['theme_' + $data._pqTheme] || $data._pqTheme)));
    if ($data._pqAnswer) $head.append($("<div>").text(isDrawer ? L['pqAnswer'] + " " : "").append($("<b>").text(isDrawer ? $data._pqAnswer : pqLenText())));
    $main.append($head);
    if (isDrawer) {
        $pal = $("<div>").addClass("nk-pq-pal");
        PQ_COLORS.forEach(function (color) {
            $pal.append($("<div>").addClass("pq-color-btn").attr('data-color', color).css('background-color', color).on('click', function () { pqPickNK(color); }));
        });
        customInput = document.createElement('input');
        customInput.type = 'color';
        customInput.value = $data._pqColor;
        $(customInput).on('input', function () { pqPickNK(this.value); });
        $pal.append($("<div>").addClass("pq-color-btn pq-custom-btn").append(customInput));
        $tool = $("<div>").addClass("nk-pq-tool");
        PQ_BRUSH_SIZES.forEach(function (size) {
            var dot = Math.round(4 + size * 0.6);

            $tool.append($("<div>").addClass("pq-brush-btn").attr('data-size', size).append($("<div>").css({ width: dot, height: dot }))
                .on('click', function () { pqSizeNK(size); }));
        });
        [['brush', L['pqBrush']], ['fill', L['nkPqFill']], ['eraser', L['pqEraser']]].forEach(function (m) {
            $tool.append($("<div>").addClass("nk-pq-mode").attr('data-m', m[0]).text(m[1]).on('click', function () { pqModeNK(m[0]); }));
        });
        $main.append($("<div>").addClass("nk-pq-tools").append($pal, $tool));
    }
    $main.append(pqMakeCanvas(isDrawer));
    if (isDrawer) {
        $ctl = $("<div>").addClass("nk-pq-ctl");
        if ($data._pqPassCount < 3) $ctl.append($("<button>").attr('id', 'pq-pass-btn').text(L['pqPass'] + " (" + (3 - $data._pqPassCount) + ")").on('click', pqPass));
        $ctl.append($("<button>").attr('id', 'pq-undo-btn').text(L['pqUndo'] || '되돌리기').on('click', pqUndo));
        $ctl.append($("<button>").attr('id', 'pq-clear-btn').text(L['pqClear']).on('click', pqClearAll));
        $main.append($ctl);
    }
    $stage.game.display.empty().append($main);
    pqMarkNK();
}

function pqLenText() {
    return $data._pqAnswer.replace(/\s/g, '').length + (L['pqChars'] || "글자");
}

function pqMarkNK() {
    var $d = $stage.game.display, col = String($data._pqColor).toUpperCase(), preset = PQ_COLORS.indexOf(col) >= 0;

    $d.find(".pq-color-btn[data-color]").each(function () { $(this).toggleClass("on", !$data._pqEraser && $(this).attr('data-color') === col); });
    $d.find(".pq-custom-btn").toggleClass("on", !$data._pqEraser && !preset).css('background', preset ? '' : $data._pqColor);
    $d.find(".pq-brush-btn").each(function () { $(this).toggleClass("on", $data._pqMode !== 'fill' && $(this).attr('data-size') == $data._pqBrushSize); });
    $d.find(".nk-pq-mode").each(function () { $(this).toggleClass("on", $(this).attr('data-m') === ($data._pqEraser ? 'eraser' : $data._pqMode)); });
}

function pqPickNK(color) {
    $data._pqColor = color;
    if ($data._pqEraser) {
        $data._pqEraser = false;
        $data._pqMode = 'brush';
    }
    pqMarkNK();
}

function pqSizeNK(size) {
    $data._pqBrushSize = size;
    if ($data._pqMode === 'fill') $data._pqMode = 'brush';
    pqMarkNK();
}

function pqModeNK(m) {
    $data._pqEraser = m === 'eraser';
    $data._pqMode = m === 'fill' ? 'fill' : 'brush';
    pqMarkNK();
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
    if ($data._pqUndo) pqUndoPool = pqUndoPool.concat($data._pqUndo);
    $data._pqUndo = [];
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
    if (NK.active) return pqDrawDisplayNK();
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

    var canvas = pqMakeCanvas(isDrawer);

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
                    .on('click', pqPass)
            );
        }

        $controls.append(
            $('<button>').attr('id', 'pq-undo-btn').css({
                'padding': '4px 12px',
                'background': 'linear-gradient(135deg, #90A4AE, #78909C)',
                'color': '#FFFFFF', 'border': 'none', 'border-radius': '4px',
                'cursor': 'pointer', 'font-size': '11px', 'font-weight': 'bold',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
            })
                .html((L['pqUndo'] || '되돌리기'))
                .on('click', pqUndo)
        );

        $controls.append(
            $('<button>').attr('id', 'pq-clear-btn').css({
                'padding': '4px 12px',
                'background': 'linear-gradient(135deg, #FFB74D, #FFA726)',
                'color': '#FFFFFF', 'border': 'none', 'border-radius': '4px',
                'cursor': 'pointer', 'font-size': '11px', 'font-weight': 'bold',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
            })
                .html((L['pqClear'] || '모두 지우기'))
                .on('click', pqClearAll)
        );

        $main.append($controls);
    }

    $stage.game.display.empty().append($main);
};

// 술래는 이미 로컬에 그렸으므로 서버 에코는 무시 (되돌리기 직후 늦게 온 에코가 다시 그리는 것 방지)
$lib.Picture.handleDraw = function (data) {
    var ctx = $data._pqCtx;
    if ($data._pqIsDrawer) return;
    if (!ctx || !data.pts || data.pts.length === 0) return;

    if (!data.cont) pqPushUndo();
    var fromPt = (data.cont && $data._pqRemoteLastPt) ? $data._pqRemoteLastPt : null;
    drawStrokeSegment(ctx, data.pts, data.c, data.w, fromPt);
    $data._pqRemoteLastPt = data.pts[data.pts.length - 1];
    if (data.end) $data._pqRemoteLastPt = null;
};

$lib.Picture.handleFill = function (data) {
    var ctx = $data._pqCtx;
    if ($data._pqIsDrawer) return;
    if (!ctx) return;
    pqPushUndo();
    pqFloodFill(ctx, data.x, data.y, data.c);
};

$lib.Picture.handleClear = function () {
    if ($data._pqIsDrawer) return;
    pqPushUndo();
    $data._pqStrokes = [];
    $data._pqRemoteLastPt = null;
    var ctx = $data._pqCtx;
    if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H); }
};

$lib.Picture.handleUndo = function () {
    if ($data._pqIsDrawer) return;
    $data._pqRemoteLastPt = null;
    pqPopUndo();
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
            $("<div>").addClass("pq-answer").css({
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
	$stage.game.items.css('opacity', 0).html('');
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

$lib.Numberclap = {};

// 랜덤 숫자 규칙이면 "157 게임"처럼 뽑힌 숫자로, 소수 규칙이면 "소수 게임", 아니면 기본 "369 게임" 표지를 만든다.
function numberclapTitle(digits, prime) {
	var joined = digits ? digits.join('') : '';

	if (prime) return "&lt;" + L['modeCNCPrime'] + "&gt;";
	if (joined && joined !== '369') return "&lt;" + L['modeCNCRnm'].replace('{0}', joined) + "&gt;";
	return "&lt;" + L['modeCNC'] + "&gt;";
}

// 체인 수를 알려주면 게임이 쉬워지므로 항상 "-"로 고정 표시한다.
$lib.Numberclap.roundReady = function (data) {
	clearBoard();
	$data._roundTime = $data.room.time * 1000;
	// free 모드와 동일하게, 대기 중에는 "<369 게임>" 표지를 계속 띄워둔다.
	$stage.game.display.html($data._char = numberclapTitle(data.digits, data.prime));
	$stage.game.chain.show().html('-');
	drawRound(data.round);
	playSound('round_start');
	recordEvent('roundReady', { data: data });
};

$lib.Numberclap.turnStart = function (data) {
	$data.room.game.turn = data.turn;
	if (data.seq) $data.room.game.seq = data.seq;
	if (!($data._tid = $data.room.game.seq[data.turn])) return;
	if ($data._tid.robot) $data._tid = $data._tid.id;
	data.id = $data._tid;

	// 다음 숫자를 미리 보여주면 암산 게임이 무의미해지므로, 이전 턴 결과 대신
	// "<369 게임>" 표지로 되돌린다 (free 모드가 $data._char를 복원하는 것과 동일).
	if (data.digits || data.prime) $data._char = numberclapTitle(data.digits, data.prime);
	$stage.game.display.html($data._char);

	var $u = $("#game-user-" + data.id).addClass("game-user-current");
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
			if (!$data._chaosHideTurn) mobile ? $stage.game.hereText.focus() : $stage.talk.focus(); // 카오스 플러스 차례 숨기기: 포커스로 차례를 알리지 않음
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

$lib.Numberclap.turnGoing = $lib.Classic.turnGoing;

// pushDisplay(body-render.js)와 같은 beat(free 모드와 동일한 글자별 박자·낙하 애니메이션·끝 바운스)를 쓰는
// numberclap 전용 표시 함수. pushDisplay는 두 가지가 안 맞는다:
//   1) 글자를 UTF-16 코드유닛 단위(text.charAt)로 쪼개 반복 표시하므로, 서로게이트
//      페어인 👏(U+1F44F) 같은 이모지가 절반씩 별개로 그려져 깨진다.
//   2) 끝에 항상 pushHistory를 호출해 히스토리에 실제 값이 남는다.
// 이 함수는 Array.from으로 유니코드 코드포인트 단위로 순회해 이모지를 한 덩어리로
// 안전하게 표시하고, 히스토리는 아예 호출하지 않는다.
function pushNumberclapDisplay(text, useMissionSound) {
	var units = Array.from(text);
	var len = units.length;
	var beat = (ACTIVE_BEAT || BEAT)[len];
	var tick = $data.turnTime / 96;
	var sg = $data.turnTime / 12;
	var snd = useMissionSound ? 'mission' : ('As' + $data._speed);
	var j = '';
	var i, k = 0;
	var $l;

	$stage.game.display.empty();
	if (beat) {
		beat = beat.split("");
		for (i = 0; i < beat.length; i++) {
			if (beat[i] == "0") continue;
			$stage.game.display.append($l = $("<div>")
				.addClass("display-text")
				.css({ 'float': "left", 'margin-top': -6, 'font-size': 36 })
				.hide()
				.html(units[k++])
			);
			addTimeout(function ($l) {
				playSound(snd);
				$l.show().animate({ 'margin-top': 0, 'font-size': 20 }, 100);
			}, i * tick, $l);
		}
		$stage.game.display.children("div").first().css('margin-left', ($stage.game.display.width() - 20 * len) * 0.5);
	} else {
		// beat 표보다 긴 경우: pushDisplay처럼 sg 동안 고르게 표시
		for (i = 0; i < len; i++) {
			addTimeout(function (idx) {
				playSound(useMissionSound ? 'mission' : 'Al');
				j += units[idx];
				$stage.game.display.html(j);
			}, i * sg / len, i);
		}
	}
	addTimeout(function () {
		for (i = 0; i < 3; i++) {
			addTimeout(function () {
				(beat ? $stage.game.display.children(".display-text") : $stage.game.display)
					.css('font-size', 21)
					.animate({ 'font-size': 20 }, tick);
			}, i * tick * 2);
		}
		playSound('K' + $data._speed);
	}, sg);
}

function renderNumberclapResult(data) {
	pushNumberclapDisplay(data.value, data.isClap);
}

$lib.Numberclap.turnEnd = function (id, data) {
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
		renderNumberclapResult(data);
	} else {
		checkFailCombo(id);
		$sc.addClass("lost");
		$(".game-user-current").addClass("game-user-bomb");
		mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
		playSound('timeout');
		if (data.hint) {
			$stage.game.display.empty().append($("<label>").html(data.hint));
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
	// 관전자는 첫 번째 참가자의 문제를 보여줌
	if (!myProblem && $data._spectate) {
		var firstId = Object.keys(data.problems)[0];
		if (firstId !== undefined) myProblem = data.problems[firstId];
	}
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

// 문제 표시 영역 폭에 딱 맞는 가장 큰 글자 크기를 찾음 (classic/free와 같은 20px가 최대, 넘칠 때만 줄어듦)
function fitQuizDisplay() {
	var $el = $stage.game.display;
	var el = $el[0];
	if (!el) return;
	var lo = 10;
	var hi = 20;
	$el.css('white-space', 'nowrap');
	while (lo < hi) {
		var mid = Math.ceil((lo + hi) / 2);
		$el.css('font-size', mid + 'px');
		// 넘치지 않으면 scrollWidth == clientWidth이므로 여유값을 빼면 항상 넘치는 것으로 판정됨
		if (el.scrollWidth > el.clientWidth) hi = mid - 1;
		else lo = mid;
	}
	$el.css('font-size', lo + 'px');
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

// 플레이어 배경색 (인덱스 0 = 미소유) — 라이트 모드, Tier 1 (1~10P)
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
	'#a1cafe'   // 9P
];

// 플레이어 배경색 — 다크 모드 (HSL L-inversion 후 S×0.8, L×1.5), Tier 1 (1~10P)
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
	'#2265be'   // 9P        H214 S78  L29
];

// 채널별 formula 적용 후 0~255로 clamp해 새 팔레트를 파생 (11~20P/21~30P 티어용)
$lib.Flip._deriveTier = function (baseColors, formula) {
	var clamp = function (x) { return Math.max(0, Math.min(255, Math.round(x))); };
	var out = [];
	for (var i = 0; i < baseColors.length; i++) {
		var hex = baseColors[i];
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		out.push('#' + ((1 << 24) + (clamp(formula(r)) << 16) + (clamp(formula(g)) << 8) + clamp(formula(b))).toString(16).slice(1));
	}
	return out;
};

// Tier 1(1~10P)에서 Tier 2(11~20P)를 파생하고, Tier 3(21~30P)는 Tier 2에서 이어서 파생 (라이트/다크 각자 독립적)
// 라이트: Tier2 = 5/3배 진하게, Tier3 = Tier2 색에 검정 30% 혼합
// 다크: Tier2 = 4/3배 밝게, Tier3 = Tier2 색에 흰색 40% 혼합
$lib.Flip._PLAYER_COLORS_TIER1 = $lib.Flip._PLAYER_COLORS.slice(1);
$lib.Flip._PLAYER_COLORS_TIER2 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_TIER1, function (x) { return 255 - (5 / 3) * (255 - x); });
$lib.Flip._PLAYER_COLORS_TIER3 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_TIER2, function (x) { return x * 0.7; });

$lib.Flip._PLAYER_COLORS_DARK_TIER1 = $lib.Flip._PLAYER_COLORS_DARK.slice(1);
$lib.Flip._PLAYER_COLORS_DARK_TIER2 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_DARK_TIER1, function (x) { return x * (4 / 3); });
$lib.Flip._PLAYER_COLORS_DARK_TIER3 = $lib.Flip._deriveTier($lib.Flip._PLAYER_COLORS_DARK_TIER2, function (x) { return x * 0.6 + 255 * 0.4; });

// 조회용 통합 팔레트: 인덱스 0=미소유, 1~10=Tier1, 11~20=Tier2, 21~30=Tier3
$lib.Flip._PLAYER_COLORS_FULL = [$lib.Flip._PLAYER_COLORS[0]].concat($lib.Flip._PLAYER_COLORS_TIER1, $lib.Flip._PLAYER_COLORS_TIER2, $lib.Flip._PLAYER_COLORS_TIER3);
$lib.Flip._PLAYER_COLORS_DARK_FULL = [$lib.Flip._PLAYER_COLORS_DARK[0]].concat($lib.Flip._PLAYER_COLORS_DARK_TIER1, $lib.Flip._PLAYER_COLORS_DARK_TIER2, $lib.Flip._PLAYER_COLORS_DARK_TIER3);

// 팀 배경색 — 라이트 모드
$lib.Flip._TEAM_COLORS = [
	'',         // 0: 팀 없음
	'#92B2FF',  // 팀 1 (A)
	'#9B92F8',  // 팀 2 (B)
	'#EE76A4',  // 팀 3 (C)
	'#FF9A72',  // 팀 4 (D)
	'#FFCA7A',  // 팀 5 (E)
	'#81EB78'   // 팀 6 (F)
];

// 팀 배경색 — 다크 모드 (기본색에 검은색 30% oklch 혼합)
$lib.Flip._TEAM_COLORS_DARK = [
	'',         // 0: 팀 없음
	'#3B579E',  // 팀 1 (A)
	'#483795',  // 팀 2 (B)
	'#88134C',  // 팀 3 (C)
	'#9E3900',  // 팀 4 (D)
	'#9E6C00',  // 팀 5 (E)
	'#108A0A'   // 팀 6 (F)
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
// N명분 색상 풀을 티어(1~10/11~20/21~30) 순서로 구성: 10명 단위는 전부, 나머지는 해당 티어에서 무작위 샘플
$lib.Flip._buildColorMap = function () {
	var seq = $data.room.game.seq;
	var n = seq.length;
	var map = {};
	var i, id;
	var tiers = [1, 2, 3]; // tier index offset은 (tier-1)*10 + 1
	var pool = [];
	var remaining = n;

	for (var t = 0; t < tiers.length && remaining > 0; t++) {
		var offset = (tiers[t] - 1) * 10 + 1;
		if (remaining >= 10) {
			for (i = 0; i < 10; i++) pool.push(offset + i);
			remaining -= 10;
		} else {
			var picks = [];
			for (i = 0; i < 10; i++) picks.push(offset + i);
			for (i = picks.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var pt = picks[i]; picks[i] = picks[j]; picks[j] = pt;
			}
			pool = pool.concat(picks.slice(0, remaining));
			remaining = 0;
		}
	}

	for (i = pool.length - 1; i > 0; i--) {
		var j2 = Math.floor(Math.random() * (i + 1));
		var t2 = pool[i]; pool[i] = pool[j2]; pool[j2] = t2;
	}
	for (i = 0; i < n; i++) {
		if (!seq[i]) continue;
		id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
		map[id] = pool[i];
	}
	$data._flipColorMap = map;
};

// 컬러맵에 없는 플레이어(빌드 시점 이후 seq에 반영된 경우 등)를 위한 안전망 — 검은 화면 방지
$lib.Flip._assignFallbackColor = function (ownerId) {
	var used = {};
	for (var id in $data._flipColorMap) used[$data._flipColorMap[id]] = true;
	for (var c = 1; c <= 30; c++) {
		if (!used[c]) { $data._flipColorMap[ownerId] = c; return; }
	}
	$data._flipColorMap[ownerId] = (Object.keys($data._flipColorMap).length % 30) + 1;
};

$lib.Flip._getPlayerColor = function (ownerId) {
	var colors = document.body.classList.contains('dark-mode') ? $lib.Flip._PLAYER_COLORS_DARK_FULL : $lib.Flip._PLAYER_COLORS_FULL;
	if (!ownerId) return colors[0];
	if (!$data._flipColorMap) $data._flipColorMap = {};
	if (!$data._flipColorMap[ownerId]) $lib.Flip._assignFallbackColor(ownerId);
	return colors[$data._flipColorMap[ownerId]];
};

$lib.Flip._applyUserCardColors = function () {
	if (!$data._flipColorMap) return;
	var colors = document.body.classList.contains('dark-mode') ? $lib.Flip._PLAYER_COLORS_DARK_FULL : $lib.Flip._PLAYER_COLORS_FULL;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			var seqId = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			if (!$data._flipColorMap[seqId]) $lib.Flip._assignFallbackColor(seqId);
		}
	}
	var isDarkMode = document.body.classList.contains('dark-mode');
	for (var id in $data._flipColorMap) {
		var idx = $data._flipColorMap[id];
		var color = colors[idx];
		// 다크 모드에서 11p 이상(Tier2/3)은 원래 색보다 밝아서 흰 글씨로는 안 보이므로 검은 글씨로
		$("#game-user-" + id).css({
			'background-color': color,
			'color': (isDarkMode && idx > 10) ? '#000000' : ''
		});
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
	$data._chatter = $stage.talk;
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
	if (!$data._spectate && !$data._spaced) $lib.Typing.spaceOn();
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
		if ($data._spaced) $lib.Typing.spaceOff();
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
				// 다크 모드에서 11p 이상(Tier2/3) 소유 칸은 배경이 밝아서 흰 글씨 대신 검은 글씨 사용
				'color': isDark ? ((owner && $data._flipColorMap[owner] > 10) ? '#000' : '#FFF') : (owner ? '#000' : '#FFF'),
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

$lib.Landgrab = {};

// 플레이어 배경색 (인덱스 0 = 미소유) — rule_flip.js와 동일한 팔레트, Tier 1 (1~10P)
$lib.Landgrab._PLAYER_COLORS = [
	'#42341a', '#fffea4', '#b7f3f1', '#fda09b', '#d0bcfe', '#cfcfcf',
	'#dfbb9c', '#8ce7a1', '#F7b1e6', '#feb482', '#a1cafe'
];
$lib.Landgrab._PLAYER_COLORS_DARK = [
	'#000000', '#979516', '#2ca09a', '#b72018', '#592ac6', '#808080',
	'#957a4d', '#2fa54b', '#a131a3', '#d1741d', '#2265be'
];
$lib.Landgrab._TEAM_COLORS = ['', '#92B2FF', '#9B92F8', '#EE76A4', '#FF9A72', '#FFCA7A', '#81EB78'];
$lib.Landgrab._TEAM_COLORS_DARK = ['', '#3B579E', '#483795', '#88134C', '#9E3900', '#9E6C00', '#108A0A'];

// 채널별 formula 적용 후 0~255로 clamp해 새 팔레트를 파생 (11~20P/21~30P 티어용)
$lib.Landgrab._deriveTier = function (baseColors, formula) {
	var clamp = function (x) { return Math.max(0, Math.min(255, Math.round(x))); };
	var out = [];
	for (var i = 0; i < baseColors.length; i++) {
		var hex = baseColors[i];
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		out.push('#' + ((1 << 24) + (clamp(formula(r)) << 16) + (clamp(formula(g)) << 8) + clamp(formula(b))).toString(16).slice(1));
	}
	return out;
};

// Tier 1(1~10P)에서 Tier 2(11~20P)를 파생하고, Tier 3(21~30P)는 Tier 2에서 이어서 파생 (라이트/다크 각자 독립적)
// 라이트: Tier2 = 5/3배 진하게, Tier3 = Tier2 색에 검정 30% 혼합
// 다크: Tier2 = 4/3배 밝게, Tier3 = Tier2 색에 흰색 40% 혼합
$lib.Landgrab._PLAYER_COLORS_TIER1 = $lib.Landgrab._PLAYER_COLORS.slice(1);
$lib.Landgrab._PLAYER_COLORS_TIER2 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_TIER1, function (x) { return 255 - (5 / 3) * (255 - x); });
$lib.Landgrab._PLAYER_COLORS_TIER3 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_TIER2, function (x) { return x * 0.7; });

$lib.Landgrab._PLAYER_COLORS_DARK_TIER1 = $lib.Landgrab._PLAYER_COLORS_DARK.slice(1);
$lib.Landgrab._PLAYER_COLORS_DARK_TIER2 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_DARK_TIER1, function (x) { return x * (4 / 3); });
$lib.Landgrab._PLAYER_COLORS_DARK_TIER3 = $lib.Landgrab._deriveTier($lib.Landgrab._PLAYER_COLORS_DARK_TIER2, function (x) { return x * 0.6 + 255 * 0.4; });

// 조회용 통합 팔레트: 인덱스 0=미소유, 1~10=Tier1, 11~20=Tier2, 21~30=Tier3
$lib.Landgrab._PLAYER_COLORS_FULL = [$lib.Landgrab._PLAYER_COLORS[0]].concat($lib.Landgrab._PLAYER_COLORS_TIER1, $lib.Landgrab._PLAYER_COLORS_TIER2, $lib.Landgrab._PLAYER_COLORS_TIER3);
$lib.Landgrab._PLAYER_COLORS_DARK_FULL = [$lib.Landgrab._PLAYER_COLORS_DARK[0]].concat($lib.Landgrab._PLAYER_COLORS_DARK_TIER1, $lib.Landgrab._PLAYER_COLORS_DARK_TIER2, $lib.Landgrab._PLAYER_COLORS_DARK_TIER3);

// 게임 시작 시 컬러맵 생성 (게임마다 1회, 라운드마다 아님)
// N명분 색상 풀을 티어(1~10/11~20/21~30) 순서로 구성: 10명 단위는 전부, 나머지는 해당 티어에서 무작위 샘플
$lib.Landgrab._buildColorMap = function () {
	var seq = $data.room.game.seq;
	var n = seq.length;
	var map = {};
	var i, id;
	var tiers = [1, 2, 3]; // tier index offset은 (tier-1)*10 + 1
	var pool = [];
	var remaining = n;

	for (var t = 0; t < tiers.length && remaining > 0; t++) {
		var offset = (tiers[t] - 1) * 10 + 1;
		if (remaining >= 10) {
			for (i = 0; i < 10; i++) pool.push(offset + i);
			remaining -= 10;
		} else {
			var picks = [];
			for (i = 0; i < 10; i++) picks.push(offset + i);
			for (i = picks.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var pt = picks[i]; picks[i] = picks[j]; picks[j] = pt;
			}
			pool = pool.concat(picks.slice(0, remaining));
			remaining = 0;
		}
	}

	for (i = pool.length - 1; i > 0; i--) {
		var j2 = Math.floor(Math.random() * (i + 1));
		var t2 = pool[i]; pool[i] = pool[j2]; pool[j2] = t2;
	}
	for (i = 0; i < n; i++) {
		if (!seq[i]) continue;
		id = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
		map[id] = pool[i];
	}
	$data._landgrabColorMap = map;
};
// 게임 도중 나간 플레이어/제거된 봇의 색 배정이 맵에 그대로 남아있으면, 실제 동시 인원이
// 12명 이하여도 누적된 고유 id 수가 12개를 넘어 아래 폴백이 겹친 색을 내놓을 수 있다.
// 그래서 색을 새로 배정하기 전에, 지금 seq에 없는(=더 이상 활성 상태가 아닌) id는 먼저 지운다.
$lib.Landgrab._pruneColorMap = function () {
	if (!$data._landgrabColorMap) return;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	var active = {};
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			active[(typeof seq[i] === 'string') ? seq[i] : seq[i].id] = true;
		}
	}
	for (var id in $data._landgrabColorMap) {
		if (!active[id]) delete $data._landgrabColorMap[id];
	}
};
$lib.Landgrab._assignFallbackColor = function (ownerId) {
	$lib.Landgrab._pruneColorMap();
	var used = {};
	for (var id in $data._landgrabColorMap) used[$data._landgrabColorMap[id]] = true;
	for (var c = 1; c <= 30; c++) {
		if (!used[c]) { $data._landgrabColorMap[ownerId] = c; return; }
	}
	// 활성 인원이 실제로 30명을 넘는 예외적인 경우에만 여기 도달한다 — 색 30개로는 원래 불가능한 상황.
	$data._landgrabColorMap[ownerId] = (Object.keys($data._landgrabColorMap).length % 30) + 1;
};
$lib.Landgrab._getPlayerColor = function (ownerId) {
	var colors = document.body.classList.contains('dark-mode') ? $lib.Landgrab._PLAYER_COLORS_DARK_FULL : $lib.Landgrab._PLAYER_COLORS_FULL;
	if (!ownerId) return colors[0];
	if (!$data._landgrabColorMap) $data._landgrabColorMap = {};
	if (!$data._landgrabColorMap[ownerId]) $lib.Landgrab._assignFallbackColor(ownerId);
	return colors[$data._landgrabColorMap[ownerId]];
};
$lib.Landgrab._applyUserCardColors = function () {
	if (!$data._landgrabColorMap) return;
	var colors = document.body.classList.contains('dark-mode') ? $lib.Landgrab._PLAYER_COLORS_DARK_FULL : $lib.Landgrab._PLAYER_COLORS_FULL;
	var seq = $data.room && $data.room.game && $data.room.game.seq;
	if (seq) {
		for (var i = 0; i < seq.length; i++) {
			if (!seq[i]) continue;
			var seqId = (typeof seq[i] === 'string') ? seq[i] : seq[i].id;
			if (!$data._landgrabColorMap[seqId]) $lib.Landgrab._assignFallbackColor(seqId);
		}
	}
	var isDarkMode = document.body.classList.contains('dark-mode');
	for (var id in $data._landgrabColorMap) {
		var idx = $data._landgrabColorMap[id];
		var color = colors[idx];
		// 다크 모드에서 11p 이상(Tier2/3)은 원래 색보다 밝아서 흰 글씨로는 안 보이므로 검은 글씨로
		$("#game-user-" + id).css({
			'background-color': color,
			'color': (isDarkMode && idx > 10) ? '#000000' : ''
		});
	}
};
// hex 색상을 밝게(+)/어둡게(-) 보정. percent: -1 ~ 1
$lib.Landgrab._shadeColor = function (hex, percent) {
	var f = parseInt(hex.slice(1), 16);
	var t = percent < 0 ? 0 : 255;
	var p = percent < 0 ? -percent : percent;
	var R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
	return '#' + (0x1000000 +
		(Math.round((t - R) * p) + R) * 0x10000 +
		(Math.round((t - G) * p) + G) * 0x100 +
		(Math.round((t - B) * p) + B)
	).toString(16).slice(1);
};
$lib.Landgrab._getOwnerTeam = function (ownerId) {
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

$lib.Landgrab.roundReady = function (data, spec) {
	clearBoard();
	// 랜드그랩은 턴 단위가 아니라 칸 선택으로 답을 제출하므로(#cw-q-input, submitCwAnswer 참고)
	// _relay를 항상 켜두면 #Talk 채팅이 매번 서버로 relay-submit되어 사라진다(칸 데이터가 없어 서버가 무시함).
	// 채팅은 항상 일반 채팅으로 보내지도록 relay를 켜지 않는다.
	$data._relay = false;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping,.game-body").addClass("landgrab");
	$data._board = data.board;
	$data._owners = data.owners;
	$data._homes = data.homes;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$data._sel = null;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.show().css('opacity', 0);
	$stage.game.here.hide();
	if (!$data._landgrabColorMap) {
		$lib.Landgrab._buildColorMap();
	}
	$lib.Landgrab._applyUserCardColors();
	$lib.Landgrab.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Landgrab.turnStart = function (data) {
	clearInterval($data._tTime);
	$data._roundTime = data.roundTime;
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Landgrab.turnEnd = function (id, data) {
	var $sc, $uc;

	if (data.error) {
		playSound('fail');
		// 선택해 둔 칸을 그 사이 다른 플레이어가 가져가 서버가 거부한 경우 — 입력창을 닫는다
		if (data.deselect) {
			$data._sel = null;
			$stage.game.cwcmd.css('opacity', 0);
			$lib.Landgrab.drawDisplay();
		}
		return;
	}

	// 라운드 종료 — 점수 표시
	if (data.ok === false) {
		$data._relay = false;
		clearInterval($data._tTime);
		stopBGM();
		playSound('horr');

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

	// 칸 점령 성공
	if (data.changes) {
		var stolenFromMe = false;
		var selectionLost = false;

		data.changes.forEach(function (ch) {
			$data._owners[ch.index] = ch.owner;
			if (ch.previousOwner === $data.id && ch.owner !== $data.id) stolenFromMe = true;
			// 지금 선택(입력) 중인 칸을 다른 플레이어가 가져간 경우 — 서버 응답을 기다리지 않고 즉시 반영
			if ($data._sel && $data._sel[0] === ch.index && ch.owner !== $data.id) selectionLost = true;
		});

		if (id === $data.id) {
			playSound('success');
			// 정답을 입력해도 입력창은 닫지 않고 계속 같은 칸에서 이어서 입력할 수 있게 둔다
		} else if (stolenFromMe) {
			playSound('mission');
		}

		if (selectionLost) {
			$data._sel = null;
			$stage.game.cwcmd.css('opacity', 0);
		}

		$lib.Landgrab.drawDisplay();
	}
};
$lib.Landgrab.onCell = function (e) {
	var idx = Number($(e.currentTarget).attr('data-idx'));

	if ($data._owners[idx] !== $data.id) return;
	$data._sel = [idx];
	$stage.game.cwcmd.css('opacity', 1);
	$(".cw-q-head").html(L['landgrabPrompt']);
	$(".cw-q-body").html("");
	$("#cw-q-input").val("").focus();
	$lib.Landgrab.drawDisplay();
};
$lib.Landgrab.drawDisplay = function () {
	var COLS = 12;
	var ROWS = 12;
	var CELL = 100 / COLS;
	var $pane = $stage.game.display.empty();
	var i, row, col, chosung, owner, isHome, playerColor, bgColor, border, teamId;
	var $cell;
	var isDark = document.body.classList.contains('dark-mode');
	var teamColors = isDark ? $lib.Landgrab._TEAM_COLORS_DARK : $lib.Landgrab._TEAM_COLORS;

	for (i = 0; i < COLS * ROWS; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		chosung = $data._board[i] || "";
		owner = $data._owners[i];
		isHome = $data._homes && $data._homes[i];
		playerColor = $lib.Landgrab._getPlayerColor(owner);

		bgColor = playerColor;
		border = isDark ? '1px solid #333' : '1px solid #888';
		if (owner) {
			teamId = $lib.Landgrab._getOwnerTeam(owner);
			if (teamId) {
				bgColor = teamColors[teamId] || playerColor;
				border = '2px solid ' + playerColor;
			}
		}
		// 시작 칸(자신 포함)은 그 소유자의 원래 색보다 라이트 모드에서 더 진하게, 다크 모드에서 더 연하게 표시
		if (isHome && owner) {
			bgColor = $lib.Landgrab._shadeColor(bgColor, isDark ? 0.25 : -0.25);
		}
		// 자신의 시작 칸만 두꺼운 테두리로 표시 (라이트: 흰색 / 다크: 연한색)
		if (isHome && owner === $data.id) {
			border = isDark ? '3px solid #eee' : '3px solid #FFF';
		}

		$pane.append($cell = $("<div>").addClass("landgrab-cell")
			.attr('data-idx', i)
			.css({
				top: (row * CELL) + "%",
				left: (col * CELL) + "%",
				width: CELL + "%",
				height: CELL + "%",
				'background-color': bgColor,
				'border': border,
				// 다크 모드에서 11p 이상(Tier2/3) 소유 칸은 배경이 밝아서 흰 글씨 대신 검은 글씨 사용
				'color': ($data.room.opts.drg ? getRandomColor() : (isDark ? ((owner && $data._landgrabColorMap[owner] > 10) ? '#000' : '#FFF') : (owner ? '#000' : '#FFF')))
			})
			.html(chosung)
		);
		if (owner === $data.id) $cell.addClass("landgrab-mine").on('click', $lib.Landgrab.onCell);
		// 지금 선택(입력) 중인 칸 강조 — 배경색이 원래 색과 흰색(다크모드는 검정과 원래 색) 사이를 1초 주기로 오간다
		if ($data._sel && $data._sel[0] === i) {
			// jQuery.css()는 CSS 커스텀 프로퍼티(--*)를 정상적으로 설정하지 못하므로 DOM API를 직접 사용
			$cell.addClass("landgrab-selected");
			$cell[0].style.setProperty('--lg-pulse-a', isDark ? '#000' : bgColor);
			$cell[0].style.setProperty('--lg-pulse-b', isDark ? bgColor : '#FFF');
		}
	}
};
$lib.Landgrab.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Landgrab.turnHint = function (data) {
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

$lib.Center = {};

$lib.Center.roundReady = function (data, spec) {
	clearBoard();
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	$(".jjoriping,.game-body").addClass("center-board");
	$data._board = data.board;
	// 재접속/관전 중간 합류(spec)는 이미 진행 중인 라운드라 사각형을 바로 보여주고,
	// 새 라운드는 turnStart 전까지 사각형을 숨긴다.
	$data._rect = spec ? data.rect : null;
	$data._revealIndex = null;
	$data._roundTime = $data.room.time * 1000;
	$data._fastTime = 10000;
	$stage.game.items.hide();
	// 땅따먹기처럼 모바일 플로팅 입력창(.game-input)은 쓰지 않음 — 답은 항상 하단 채팅창으로 입력
	$stage.game.here.hide();
	$lib.Center.drawDisplay();
	drawRound(data.round);
	if (!spec) playSound('round_start');
	clearInterval($data._tTime);
};
$lib.Center.turnStart = function (data) {
	if (typeof data.roundTime === 'number') $data._roundTime = data.roundTime;
	if (data.rect) $data._rect = data.rect;
	$lib.Center.drawDisplay();
	if (!$data._spectate) $data._relay = true;
	clearInterval($data._tTime);
	$data._tTime = addInterval(turnGoing, TICK);
	playBGM('jaqwi');
};
$lib.Center.turnGoing = $lib.Jaqwi.turnGoing;
$lib.Center.turnEnd = function (id, data) {
	if (data.error) {
		playSound('fail');
		return;
	}
	if (data.ok) {
		if ($data._roundTime > 10000) $data._roundTime = 10000;
		addScore(id, data.score, data.totalScore);
		drawObtainedScore($("#game-user-" + id), $("<div>").addClass("deltaScore").html("+" + data.score));
		updateScore(id, getScore(id));
		playSound(id === $data.id ? 'success' : 'mission');
		return;
	}
	// 라운드 종료 브로드캐스트 (target/ok/error 없음) — 중심 칸을 강조해서 정답 위치를 공개
	$data._revealIndex = (typeof data.centerIndex === 'number') ? data.centerIndex : null;
	$lib.Center.drawDisplay();
	clearInterval($data._tTime);
	stopBGM();
	playSound('horr');
};
// 랜드그랩의 절대좌표 퍼센트 셀 렌더링(rule_landgrab.js drawDisplay)을 그대로 재사용 —
// 소유권/팀 개념이 없으므로 사각형 강조/정답 공개 여부에 따라 배경/글자/테두리색만 다르게 준다.
// 일반 칸은 배경을 따로 칠하지 않아 .jjo-display의 기본 보드 배경이 그대로 비치고, 글자는 흰색.
// 강조 칸(사각형 내부)은 밝은 배경 + 검은 글자, 칸 사이 테두리는 없음.
// 라운드 종료 후에는 중심 칸(_revealIndex)만 테두리 + 다른 색으로 한 번 더 강조해 정답 위치를 보여준다.
$lib.Center.drawDisplay = function () {
	var COLS = 16, ROWS = 16, CELL = 100 / COLS;
	var $pane = $stage.game.display.empty();
	var rect = $data._rect;
	var i, row, col, inRect, isReveal, $cell;

	for (i = 0; i < COLS * ROWS; i++) {
		row = Math.floor(i / COLS);
		col = i % COLS;
		inRect = !!rect && row >= rect.top && row < rect.top + rect.h
			&& col >= rect.left && col < rect.left + rect.w;
		isReveal = ($data._revealIndex === i);

		$pane.append($cell = $("<div>").addClass("landgrab-cell")
			.css({
				top: (row * CELL) + "%",
				left: (col * CELL) + "%",
				width: CELL + "%",
				height: CELL + "%",
				'background-color': isReveal ? '#FF6D6D' : (inRect ? '#FFE873' : 'transparent'),
				'border': isReveal ? '2px solid #FFFFFF' : 'none',
				'color': (isReveal || inRect) ? '#000000' : '#FFFFFF',
				'font-size': '10px'
			})
			.html(($data._board && $data._board[i]) || "")
		);
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
		// 신 UI: 두음법칙 글자는 작은 괄호로 (nk.css .nk-ws-sub)
		if (NK.active && sub) return getCharText(c) + "<label class='nk-ws-sub'>(" + getCharText(sub.split('|').join(', ')) + ")</label>";
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

$lib.Rhythm = {};

// 리듬 게임 (XRG)
// - 게임 시계: audioContext.currentTime 기준 (Date.now()/setInterval은 밀릴 수 있어 쓰지 않음)
// - 시작 시각: 서버가 정한 절대 시각(startAt)을 xrgSync 왕복 측정으로 얻은 시계 차이로 로컬 시각으로 변환
// - 클라이언트의 판정(PERFECT/GOOD/...)은 내 화면 표시용일 뿐, 서버에는 눌린 패널과 곡 기준 시각만 보냄
//   서버가 그 시각으로 노트를 찾아 직접 판정하고 점수를 합산해 모두에게 알림
var XRG_LEAD = 1000;      // 마커가 나타나서 판정 시점에 닿기까지 (ms): 기본값(보통 난이도). 실제는 서버가 보낸 난이도별 속도 배율로 나눔(s.lead)
var XRG_WIN = [50, 150, 300]; // Perfect / Good / Bad 허용 오차 (ms): 기본값. 실제 범위는 서버가 난이도별로 보내줌(s.win)
var XRG_ROUND = 60000;
var XRG_COUNT = 7;        // 카운트다운 7~0 (8박) 후 다음 박(-1)에 곡이 시작 (곡 시각 0ms = -1)
// 데스크톱 키 배치: D/R, K/U, F, J = 1, 2, 3, 4번 패널 (e.code 기준이라 한글 입력 상태에서도 동일)
var XRG_KEYS = { KeyD: 0, KeyR: 0, KeyK: 1, KeyU: 1, KeyF: 2, KeyJ: 3 };
var XRG_KEY_LABEL = ["D/R", "K/U", "F", "J"]; // 패널(레인) 순서
// Z/X: 누르는 순간 마우스가 올라가 있는 패널을 클릭한 것으로 처리
var XRG_AIM_KEYS = { KeyZ: true, KeyX: true };
var XRG_SYNC_MAX = 300;   // 개인 싱크 보정 한계 (+-ms). 설정의 슬라이더 값
var XRG_SYNC_COUNT = 6;
var XRG_SYNC_GAP = 120;

$lib.Rhythm.s = null;

$lib.Rhythm.roundReady = function (data, spec) {
	var R = $lib.Rhythm;
	var s, i, j, k, x, c, charMs, $grid, $panel;

	// 처음부터 관전 중인 사람(참가자가 아님)과 리플레이도 관전자로 취급: 중간 입장 때만 spec 인자가 넘어옴
	spec = spec || !!$data._spectate || !!$data._replay;
	clearBoard();
	stopBGM();
	$data.room.round = 1;
	if (data.time) $data.room.time = data.time;
	$(".jjoriping,.rounds,.game-body").addClass("cw");
	// 큰 보드(.bb)를 숨기면 판이 왼쪽으로 쏠리므로, flip/center-board처럼 .jjoriping을 가운데 정렬
	$(".jjoriping,.game-body").addClass("rhythm");

	// 채보 전개: 글자 1개 길이 = (60/BPM) x (4/해상도)초
	charMs = 60000 / data.bpm * 4 / data.res;
	s = R.s = {
		beat: 60000 / data.bpm,
		spec: !!spec,
		song: data.song,
		key: 'xrg_' + data.song,
		notes: [],
		lo: 0,
		ctxStart: null,
		best: null,
		syncN: 0,
		win: data.win || XRG_WIN,
		lead: XRG_LEAD / (data.speed || 1),
		sync: Math.max(-XRG_SYNC_MAX, Math.min(XRG_SYNC_MAX, Number(loadVolumeSettings().rhythmSync) || 0)),
		chain: 0,
		brk: false,      // Bad/Miss가 한 번이라도 나왔는지 (풀 콤보 판정용)
		allPerfect: true, // 지금까지 전부 Perfect인지 (올 퍼펙트 판정용)
		hover: null,     // 마우스가 올라가 있는 패널 번호 (Z/X 입력용)
		aim: {},         // Z/X 키별로 누를 때 고른 패널 번호 (뗄 때 눌린 모양을 되돌리기 위함)
		ended: false
	};
	for (i = 0; i < data.seq.length; i++) {
		c = data.seq.charAt(i);
		if (c == '.') continue;
		// 마커 색: 박 위(정박)=0 흰색, 8분음표 엇박=1 분홍, 16분음표 엇박=2 하늘색, 그 외(16분 격자에서 벗어남)=3 연두색
		x = i * charMs / s.beat * 4;
		k = Math.round(x) % 4;
		s.notes.push({ i: s.notes.length, lane: Number(c) - 1, t: i * charMs, m: Math.abs(x - Math.round(x)) > 0.05 ? 3 : k == 0 ? 0 : k == 2 ? 1 : 2, done: false, el: null });
	}

	s.left = s.notes.length; // 아직 처리(타격/미스)되지 않은 노트 수. 0이 되면 서버에 끝 신호를 보냄

	$grid = $("<div>").addClass("rhythm-grid");
	s.panels = [];
	for (j = 0; j < 4; j++) {
		$panel = $("<div>").addClass("rhythm-panel").attr("data-lane", j);
		s.panels.push($panel);
		$grid.append($panel);
		// 관전자는 노트만 보고 입력은 받지 않음 (클릭/터치 처리 없음)
		if (!spec) (function (lane, el) {
			el.addEventListener("pointerdown", function (e) { R.onPress(e, lane); });
			el.addEventListener("pointerenter", function () { s.hover = lane; });
			el.addEventListener("pointerleave", function () { if (s.hover === lane) s.hover = null; });
		})(j, $panel[0]);
	}
	if (spec) $grid.addClass("rhythm-spec");
	s.$count = $("<div>").addClass("rhythm-count");
	// 곡 제목은 카운트다운이 시작되기 전까지만 판 중앙에 겹쳐 표시. 판(.rhythm-grid) 안에는 패널만 둠
	s.$title = $("<div>").addClass("rhythm-title").text("♪ " + (data.title || data.song.replace(/_/g, " ")));
	s.$grid = $grid;
	$stage.game.items.hide();
	$stage.game.bb.hide();
	// 채팅 외 입력이 없으므로 모바일 플로팅 입력창(.game-input)은 쓰지 않음 (clearBoard가 모바일에서 다시 켜므로 여기서 끔)
	$stage.game.here.hide();
	// 큰 보드(.jjo-display, 298x298) 안에 패널 판을 그리고, 제목/카운트는 판 위에 겹침
	$stage.game.display.empty().append($grid, s.$count, s.$title);

	if (!spec) {
		s.keyDown = function (e) { R.onKey(e, true); };
		s.keyUp = function (e) { R.onKey(e, false); };
		// 캡처 단계에서 받아 채팅창 등 다른 입력보다 먼저 처리 (플레이어의 조작 키는 항상 게임으로 들어감)
		document.addEventListener("keydown", s.keyDown, true);
		document.addEventListener("keyup", s.keyUp, true);
	}

	// 오디오 프리로드
	if ($sound[s.key]) s.loaded = true;
	else getAudio(s.key, "/media/common/bgms/" + data.song + ".opus", function () {
		if (R.s !== s) return;
		s.loaded = true;
		if (s.ctxStart !== null) R.playAudio();
	});
	// 카운트다운 박마다 울릴 효과음
	if (!$sound.xrg_hitsound) getAudio("xrg_hitsound", "/media/common/hitsound.wav", function () {
		if (R.s === s) R.playBeats();
	});
	R.startSync();
};
// 서버와의 시계 차이 측정: RTT가 가장 작은 표본을 채택
$lib.Rhythm.startSync = function () {
	var R = $lib.Rhythm;
	var s = R.s;

	if (s.spec) return;
	s.syncTimer = addInterval(function () {
		if (R.s !== s || ++s.syncN > XRG_SYNC_COUNT) return clearInterval(s.syncTimer);
		send('xrgSync', { c: Date.now() });
	}, XRG_SYNC_GAP);
};
$lib.Rhythm.onSync = function (data) {
	var s = $lib.Rhythm.s;
	var rtt = Date.now() - data.c;

	if (!s || rtt < 0) return;
	// 서버 시각 = 로컬 시각 + off
	if (!s.best || rtt < s.best.rtt) s.best = { rtt: rtt, off: data.s - (data.c + rtt / 2) };
};
$lib.Rhythm.turnStart = function (data) {
	var R = $lib.Rhythm;
	var s = R.s;
	var off, msUntil;

	if (!s) return;
	off = s.best ? s.best.off : (typeof data.now == 'number' ? data.now - Date.now() : 0);
	msUntil = (data.startAt - off) - Date.now();
	if (audioContext.state == 'suspended') audioContext.resume();
	s.ctxStart = audioContext.currentTime + msUntil / 1000;
	if (s.loaded) R.playAudio();
	R.playBeats();
	cancelAnimationFrame(s.raf);
	s.raf = requestAnimationFrame(R.frame);
};
// 지정한 시각(ctxStart)에 BGM 재생 시작. 이미 지났으면 그만큼 건너뛰어 재생
$lib.Rhythm.playAudio = function () {
	var s = $lib.Rhythm.s;
	var buf = $sound[s.key];
	var now = audioContext.currentTime;
	var vol = $data.muteBGM ? 0 : ($data.BGMVolume === undefined ? 1 : $data.BGMVolume);
	var src, gain, wait;

	if (s.src || s.played) return;
	s.played = true;
	if (window.AudioBuffer && buf instanceof AudioBuffer) {
		src = audioContext.createBufferSource();
		src.buffer = buf;
		gain = audioContext.createGain();
		gain.gain.value = vol;
		src.connect(gain);
		gain.connect(audioContext.destination);
		src.gainNode = gain;
		src.start(Math.max(s.ctxStart, now), Math.max(0, now - s.ctxStart));
		s.src = $data.bgm = src;
	} else if (buf && buf.audio) {
		// 디코딩 실패로 HTMLAudio로 대체된 경우: 샘플 단위 정확도는 없음
		wait = (s.ctxStart - now) * 1000;
		buf.audio.volume = vol;
		buf.audio.loop = false;
		s.src = $data.bgm = buf;
		s.fbTimer = addTimeout(function () {
			buf.audio.currentTime = Math.max(0, -wait) / 1000;
			buf.start();
		}, Math.max(0, wait));
	}
};
// 카운트다운 7~4 (GO!까지)에만 효과음을 예약 재생. 이미 지난 박은 건너뜀. 카운트 c는 곡 시작 (c+1)박 전
$lib.Rhythm.playBeats = function () {
	var s = $lib.Rhythm.s;
	var now = audioContext.currentTime;
	var k, when, src;

	if (!s || s.ctxStart === null || s.beatsPlayed) return;
	s.beatsPlayed = true;
	s.beatSrcs = [];
	for (k = XRG_COUNT; k >= 4; k--) {
		when = s.ctxStart - (k + 1) * s.beat / 1000;
		if (when < now) continue;
		if (src = $lib.Rhythm.hitSound(when)) s.beatSrcs.push(src);
	}
};
// 히트사운드를 지정한 오디오 시각(생략하면 즉시)에 재생. 효과음 볼륨/음소거를 따름
$lib.Rhythm.hitSound = function (when) {
	var buf = $sound.xrg_hitsound;
	var vol = $data.muteEff ? 0 : ($data.EffectVolume === undefined ? 1 : $data.EffectVolume);
	var src, gain;

	if (!(window.AudioBuffer && buf instanceof AudioBuffer)) return null;
	src = audioContext.createBufferSource();
	src.buffer = buf;
	gain = audioContext.createGain();
	gain.gain.value = vol;
	src.connect(gain);
	gain.connect(audioContext.destination);
	src.start(when || 0);
	return src;
};
// 현재 곡 위치(ms). 출력 지연을 빼서 "귀에 들리는" 위치 기준으로 맞춤
$lib.Rhythm.songTime = function () {
	var s = $lib.Rhythm.s;
	var lat = Math.min(0.25, audioContext.outputLatency || audioContext.baseLatency || 0);

	// s.sync(+면 노트가 일찍 나옴): 판정선 도달 시각과 눌린 시각(서버로 보내는 t)을 같은 만큼 옮겨, 화면과 판정이 함께 맞춰짐
	return (audioContext.currentTime - s.ctxStart - lat) * 1000 + s.sync;
};
$lib.Rhythm.frame = function () {
	var R = $lib.Rhythm;
	var s = R.s;
	var st, i, n, p, remain, txt, k, hint, dur;

	if (!s || s.ended) return;
	s.raf = requestAnimationFrame(R.frame);
	st = R.songTime();

	remain = Math.max(0, XRG_ROUND - Math.max(0, st));
	$stage.game.roundBar
		.width(remain / XRG_ROUND * 100 + "%")
		.html((Math.round(remain / 100) / 10).toFixed(1) + L['SECOND']);
	// 카운트다운은 곡의 박자에 맞춰 7~0 후 다음 박(-1)이 곡 시작 (-1 = 0ms). 7, 6, 5는 3, 2, 1로, 4는 GO!로 표시하고 3~0은 숫자 없이 쉼
	k = Math.ceil(-st / s.beat) - 1;
	// 숫자 없이 쉬는 3~0박에는 조작 안내(데스크톱 Click!, 모바일 Touch!)를 곡 시작까지 서서히 나타났다 사라지게 띄움
	hint = !s.spec && st < 0 && st >= -(XRG_COUNT + 1) * s.beat && k < 4;
	txt = st < -(XRG_COUNT + 1) * s.beat || st >= 0 ? "" : hint ? (mobile ? "Touch!" : "Click!") : k < 4 ? "" : k == 4 ? (L['xrgGo'] || "GO!") : String(k - 4);
	if (s.$title && st >= -(XRG_COUNT + 1) * s.beat) {
		s.$title.remove();
		s.$title = null;
	}
	if (s.$grid && st >= 0) {
		s.$grid.find(".rhythm-key").remove();
	}
	if (s.countTxt !== txt) {
		s.countTxt = txt;
		s.$count.text(txt).removeClass("rhythm-fade");
		if (hint) {
			dur = Math.round(-st) + "ms";
			s.$count.css("animation-duration", dur).addClass("rhythm-fade");
			// 각 패널 중앙에 조작 키 표시 (데스크톱)
			if (!mobile) $.each(s.panels, function (j, $p) {
				$p.append($("<div>").addClass("rhythm-key rhythm-fade").css("animation-duration", dur).text(XRG_KEY_LABEL[j]));
			});
		}
	}

	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		if (n.t - st > s.lead) break;
		if (n.done) continue;
		if (st - n.t > s.win[2]) {
			// 못 누른 노트: 본인 화면에만 미스 표시 (감점 없음)
			n.done = true;
			R.removeMarker(n);
			if (!s.spec) {
				R.splash(n.lane, 3);
				send('xrgMiss', { t: Math.ceil(st) }); // 서버가 이 시각까지의 미스를 정산해 감점 (점수는 서버 결과로 반영)
				s.chain = 0; // 미스에서 콤보 끊김
				R.showCombo(0);
				s.brk = true;
				s.allPerfect = false;
			}
			R.noteDone();
			continue;
		}
		if (!n.el) {
			// 패널 번호(1~4)에 따라 좌상/우상/좌하/우하 모서리 테두리만 그림
			n.el = $("<div>").addClass("rhythm-marker rhythm-m" + n.m + " rhythm-c" + n.lane);
			s.panels[n.lane].append(n.el);
		}
		p = (n.t - st) / s.lead; // 1 -> 0: 커지며 패널 테두리에 닿는 순간이 판정 시점
		n.el.css({
			transform: "scale(" + (0.2 + 0.8 * Math.min(1, 1 - p)) + ")",
			opacity: p < 0 ? Math.max(0, 1 + p * s.lead / s.win[2]) : 1
		});
	}
	while (s.lo < s.notes.length && s.notes[s.lo].done) s.lo++;
};
$lib.Rhythm.removeMarker = function (n) {
	if (n.el) {
		n.el.remove();
		n.el = null;
	}
};
$lib.Rhythm.onPress = function (e, lane) {
	var R = $lib.Rhythm;
	var s = R.s;
	var st, i, n, d, best, bd, j;

	e.preventDefault();
	// preventDefault 때문에 탭해도 채팅창 포커스가 풀리지 않아, 모바일에서 패널을 칠 때마다 키보드가 다시 올라오므로 직접 해제
	if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
	if (!s || s.spec || s.ended || s.ctxStart === null) return;
	st = R.songTime();
	bd = Infinity;
	// 눌린 레인에서 판정 범위 안의 미처리 노트 중 가장 가까운 것
	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		if (n.t - st > s.win[2]) break;
		if (n.done || n.lane != lane) continue;
		d = Math.abs(st - n.t);
		if (d <= s.win[2] && d < bd) {
			bd = d;
			best = n;
		}
	}
	if (!best) {
		// 범위 밖(빈) 입력은 공푸어: 내 화면에 MISS만 띄우고 콤보/점수/서버에는 영향 없음
		R.splash(lane, 3);
		return;
	}

	best.done = true;
	R.removeMarker(best);
	j = bd <= s.win[0] ? 0 : bd <= s.win[1] ? 1 : 2;
	R.hitSound();
	R.splash(lane, j); // 내 화면에만 즉시 표시. 점수는 서버가 timestamp로 판정한 결과(turnEnd)로 반영
	// 콤보 표시도 내 화면용: Bad에서 끊기고 Perfect/Good은 이어짐. 두 번째 노트가 1콤보 (보너스 점수는 서버가 같은 규칙으로 계산)
	if (j != 0) s.allPerfect = false;
	if (j == 2) {
		s.chain = 0;
		R.showCombo(0);
		s.brk = true;
	} else R.showCombo(++s.chain - 1);
	send('xrgHit', { lane: lane, t: Math.round(st) });
	R.noteDone();
};
// 노트 하나가 처리(타격/미스)될 때마다 호출: 마지막 노트까지 처리하면 서버에 끝 신호를 보냄 (전원의 신호가 모이면 서버가 조기 종료)
$lib.Rhythm.noteDone = function () {
	var s = $lib.Rhythm.s;

	if (s.spec || --s.left != 0) return;
	send('xrgDone', {});
	// 마지막 노트까지 Bad/Miss 없이 처리했으면 풀 콤보, 전부 Perfect면 올 퍼펙트 (success 소리와 함께)
	if (!s.brk) {
		playSound('success');
		$lib.Rhythm.showFinish(s.allPerfect);
	}
};
// 마지막 스플래시: 풀 콤보(하늘색) / 올 퍼펙트(파스텔 무지개) 문구를 판 중앙에 1초 동안 띄움
$lib.Rhythm.showFinish = function (allPerfect) {
	var s = $lib.Rhythm.s;
	var $f = $("<div>").addClass("rhythm-finish " + (allPerfect ? "rhythm-allp" : "rhythm-fc")).text(allPerfect ? "ALL PERFECT" : "FULL COMBO");

	s.$finish = $f;
	$stage.game.display.append($f);
	addTimeout(function () { $f.remove(); }, 1000);
};
// 키보드 입력: 누르는 동안 패널을 눌린 모양으로 표시하고, 처음 누를 때만 타격 처리 (키 반복 무시)
// 채팅창에 포커스가 있어도 조작 키는 글자로 입력되지 않고 게임으로만 들어감 (포커스도 해제해 한글 조합이 남지 않게 함)
$lib.Rhythm.onKey = function (e, down) {
	var R = $lib.Rhythm;
	var s = R.s;
	var lane = XRG_KEYS[e.code];
	var aim = XRG_AIM_KEYS[e.code];

	if (!s || (lane === undefined && !aim) || e.ctrlKey || e.altKey || e.metaKey) return;
	e.preventDefault();
	if (down && e.target && e.target !== document.body && e.target.blur) e.target.blur();
	// Z/X: 처음 누를 때 마우스 아래 패널을 고르고, 뗄 때까지 그 패널을 눌린 모양으로 둠. 패널 밖이면 아무 일도 없음
	if (aim) {
		if (down && !e.repeat) s.aim[e.code] = s.hover;
		lane = s.aim[e.code];
		if (!down) s.aim[e.code] = null;
		if (lane == null) return;
	}
	s.panels[lane].toggleClass("rhythm-down", down);
	if (down && !e.repeat) R.onPress(e, lane);
};
// 판 중앙(패널 뒤)에 콤보 수를 반투명으로 계속 띄움: 투명도는 그대로, 콤보가 오를 때마다 살짝 커졌다 돌아옴. 1콤보부터 표시, 0이면(끊김) 지움
$lib.Rhythm.showCombo = function (n) {
	var s = $lib.Rhythm.s;

	if (!s) return;
	if (n < 1) {
		if (s.$combo) s.$combo.remove();
		s.$combo = null;
		return;
	}
	if (!s.$combo) {
		s.$combo = $("<div>").addClass("rhythm-combo");
		$stage.game.display.append(s.$combo);
	}
	s.$combo.text(n).removeClass("rhythm-pop");
	void s.$combo[0].offsetWidth; // 애니메이션을 처음부터 다시 재생
	s.$combo.addClass("rhythm-pop");
};
// 키보드 입력 가로채기 해제 (게임 종료/정리 때)
$lib.Rhythm.releaseKeys = function (s) {
	s = s || $lib.Rhythm.s;
	if (!s || !s.keyDown) return;
	document.removeEventListener("keydown", s.keyDown, true);
	document.removeEventListener("keyup", s.keyUp, true);
	s.keyDown = s.keyUp = null;
};
// j: 0=Perfect, 1=Good, 2=Bad, 3=Miss
$lib.Rhythm.splash = function (lane, j) {
	var s = $lib.Rhythm.s;
	var $sp = $("<div>").addClass("rhythm-splash rhythm-j" + j).text(L['xrgJudge' + j] || ['PERFECT', 'GOOD', 'BAD', 'MISS'][j]);

	if (!s) return;
	s.panels[lane].append($sp);
	addTimeout(function () { $sp.remove(); }, 450);
};
// 라운드 종료 처리: 진행을 멈추고 키 입력 가로채기를 풀고 채팅창으로 포커스를 돌려줌. 이미 끝났으면 아무것도 안 하고 false
// turnEnd 신호 없이 roundEnd만 오는 경우(2인 게임에서 한 명이 나가 서버가 바로 roundEnd 등)에도 body.js가 부름
$lib.Rhythm.finish = function () {
	var R = $lib.Rhythm;
	var s = R.s;
	var i;

	if (!s || s.ended) return false;
	s.ended = true;
	cancelAnimationFrame(s.raf);
	for (i = 0; i < s.notes.length; i++) R.removeMarker(s.notes[i]);
	s.$count.text("");
	R.releaseKeys();
	if (!s.spec && !mobile) $stage.talk.focus();
	return true;
};
$lib.Rhythm.turnEnd = function (id, data) {
	var R = $lib.Rhythm;
	var $sc;

	// 라운드 종료 신호
	if (!data || !data.target) {
		R.finish();
		stopBGM();
		playSound('horr');
		return;
	}
	// 내 점수를 포함해 모든 점수는 서버 판정 결과로만 반영
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	// 감점(미스)은 rule_free의 실패처럼 붉은 색(lost)으로 표시
	$sc = $("<div>").addClass("deltaScore").html((data.score > 0 ? "+" : "") + data.score);
	if (data.score < 0) $sc.addClass("lost");
	drawObtainedScore($("#game-user-" + id), $sc);
};
// 게임 화면 정리 (clearBoard / clearGame에서 호출)
$lib.Rhythm.cleanup = function () {
	var s = $lib.Rhythm.s;

	$(".jjoriping,.game-body").removeClass("rhythm");
	if (!s) return;
	$lib.Rhythm.s = null;
	cancelAnimationFrame(s.raf);
	clearInterval(s.syncTimer);
	clearTimeout(s.fbTimer);
	$lib.Rhythm.releaseKeys(s);
	if (s.src) {
		try { s.src.stop(); } catch (e) { }
		if ($data.bgm === s.src) $data.bgm = null;
	}
	(s.beatSrcs || []).forEach(function (b) {
		try { b.stop(); } catch (e) { }
	});
	s.$grid.remove();
	s.$count.remove();
	if (s.$title) s.$title.remove();
	if (s.$combo) s.$combo.remove();
	if (s.$finish) s.$finish.remove();
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

$lib.Rtype = {};

// 리듬 타이퍼 (KRT)
// - 쪼리핑 표시창(.jjo-display) 안에서 자모 노트가 오른쪽 -> 왼쪽으로 흐르고, 가운데 초록 판정선에 닿는 순간이 판정 시점
// - 노란 바(턴 시간 바)는 항상 가득 차 있고 지금 입력 중인 내용을 보여줌
// - 입력: 키 이벤트는 쓰지 않고 입력창(textarea) 값만 비교함 (쿼티/천지인/단모음/세벌식, 삼성/Gboard 공통)
//   값을 타수 순서 자모로 분해해 이전 값과 비교: 늘어난 자모 = 입력, 줄어듦 = 백스페이스, 값의 \n = 엔터
//   input 이벤트(주 경로)와 매 프레임 검사(안전망)가 같은 비교 함수를 부름
// - 오디오 시계/서버 시계 동기화/카운트다운은 4패널 치기(rule_rhythm.js)에서 복사함
// - 판정은 서버가 함. 클라이언트는 같은 규칙으로 내 화면에만 미리 표시하고, 입력 {k, t}를 모두 서버로 보냄
var RTP_LEAD = 1500;      // 노트가 오른쪽 끝에서 판정선(가운데)까지 오는 시간 (ms): 기본값(보통 난이도). 실제는 서버가 보낸 난이도별 속도 배율로 나눔(s.lead). 지난 노트는 같은 속도로 왼쪽 끝까지 흘러감
var RTP_WIN = [50, 150, 300]; // Perfect / Good / Bad 허용 오차 (ms): 기본값. 실제 범위는 서버가 난이도별로 보내줌(s.win)
var RTP_ROUND = 60000;
var RTP_COUNT = 7;        // 카운트다운 7~0 (8박) 후 다음 박(-1)에 곡이 시작 (곡 시각 0ms = -1)
var RTP_SYNC_MAX = 300;   // 개인 싱크 보정 한계 (+-ms). 설정의 리듬 보정 슬라이더 값 (4패널 치기와 공용)
var RTP_SYNC_COUNT = 6;
var RTP_SYNC_GAP = 120;
var RTP_BATCH = 20;       // 삼성 키보드는 받침이 다음 글자로 넘어갈 때 한 번 누름에 값이 2번 바뀜("읮"->"의"->"의지"). 이 시간 안의 변화는 하나로 묶음
var RTP_ENTER_DEDUP = 80; // 이 시간 안에 다시 들어온 엔터는 중복으로 무시 (macOS 조합 중 엔터 등)
var RTP_PASTE = 3;        // 한 번에 자모가 이 수 이상 늘면 붙여넣기로 보고 무시
var RTP_ENTER = "\n";
var RTP_CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
var RTP_JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅗㅏ", "ㅗㅐ", "ㅗㅣ", "ㅛ", "ㅜ", "ㅜㅓ", "ㅜㅔ", "ㅜㅣ", "ㅠ", "ㅡ", "ㅡㅣ", "ㅣ"];
var RTP_JONG = ["", "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
// 낱자로 들어온 겹모음/겹받침 (예: 초성 없이 조합 중인 ㅢ)
var RTP_COMPAT = { "ㅘ": "ㅗㅏ", "ㅙ": "ㅗㅐ", "ㅚ": "ㅗㅣ", "ㅝ": "ㅜㅓ", "ㅞ": "ㅜㅔ", "ㅟ": "ㅜㅣ", "ㅢ": "ㅡㅣ", "ㄳ": "ㄱㅅ", "ㄵ": "ㄴㅈ", "ㄶ": "ㄴㅎ", "ㄺ": "ㄹㄱ", "ㄻ": "ㄹㅁ", "ㄼ": "ㄹㅂ", "ㄽ": "ㄹㅅ", "ㄾ": "ㄹㅌ", "ㄿ": "ㄹㅍ", "ㅀ": "ㄹㅎ", "ㅄ": "ㅂㅅ" };

// 두벌식 타수 순서로 분해 (ㅢ = ㅡㅣ, ㄳ = ㄱㅅ)
function rtpDecompose(str) {
	var r = [];
	var i, c, ch;

	for (i = 0; i < str.length; i++) {
		ch = str.charAt(i);
		c = str.charCodeAt(i) - 0xAC00;
		if (c < 0 || c > 11171) {
			r = r.concat((RTP_COMPAT[ch] || ch).split(""));
			continue;
		}
		r = r.concat((RTP_CHO.charAt(Math.floor(c / 588)) + RTP_JUNG[Math.floor(c % 588 / 28)] + RTP_JONG[c % 28]).split(""));
	}
	return r;
}
// 앞부분이 같은 만큼을 빼고 늘어난/줄어든 자모
function rtpDiff(a, b) {
	var L = 0;

	while (L < a.length && L < b.length && a[L] == b[L]) L++;
	return { added: b.slice(L), removed: a.slice(L) };
}

$lib.Rtype.s = null;

$lib.Rtype.roundReady = function (data, spec) {
	var R = $lib.Rtype;
	var s, i, n, w, k, charMs;

	// 처음부터 관전 중인 사람(참가자가 아님)과 리플레이도 관전자로 취급: 중간 입장 때만 spec 인자가 넘어옴
	spec = spec || !!$data._spectate || !!$data._replay;
	clearBoard();
	stopBGM();
	$data.room.round = 1;
	if (data.time) $data.room.time = data.time;

	// 채보 전개: 글자 1개 길이 = (60/BPM) x (4/해상도)초. 노트 순서대로 keys의 글자(자모 또는 엔터)가 대응
	charMs = 60000 / data.bpm * 4 / data.res;
	s = R.s = {
		beat: 60000 / data.bpm,
		spec: !!spec,
		song: data.song,
		title: data.title || data.song.replace(/_/g, " "),
		key: 'xrg_' + data.song, // BGM 캐시 키 (4패널 치기와 같은 파일이므로 공유)
		notes: [],
		words: [],
		lo: 0,          // 그리기 시작할 노트 (왼쪽 끝을 지나 사라진 노트는 건너뜀)
		p: 0,           // 다음에 판정할 노트 (노트는 항상 앞에서부터 차례로 처리됨)
		dead: [],       // 단어별: 보너스 없음 (MISS 또는 입력 중 백스페이스)
		worst: [],      // 단어별: 최저 판정 (0 Perfect / 1 Good / 2 Bad)
		ctxStart: null,
		best: null,
		syncN: 0,
		win: data.win || RTP_WIN,
		lead: RTP_LEAD / (data.speed || 1),
		sync: Math.max(-RTP_SYNC_MAX, Math.min(RTP_SYNC_MAX, Number(loadVolumeSettings().rhythmSync) || 0)),
		chain: 0,
		brk: false,      // 콤보가 한 번이라도 끊겼는지 (풀 콤보 판정용)
		allPerfect: true,
		barTxt: null,
		msgTxt: null,
		ended: false
	};
	for (i = 0, n = 0; i < data.seq.length; i++) {
		if (data.seq.charAt(i) == '.') continue;
		s.notes.push({ t: i * charMs, k: data.keys.charAt(n), w: 0, done: false, el: null });
		n++;
	}
	for (w = 0, n = 0; w < data.words.length; w++) {
		s.words.push({ text: data.words[w].text, first: n });
		for (k = 0; k <= data.words[w].n; k++) s.notes[n++].w = w;
	}
	s.left = s.notes.length; // 아직 처리(입력/미스)되지 않은 노트 수. 0이 되면 서버에 끝 신호를 보냄

	s.$lane = $("<div>").addClass("rtype-lane").append($("<div>").addClass("rtype-line"));
	// 표시창 가운데 글자: 곡 시작 전에는 곡 이름/카운트다운, 마지막 노트 뒤에는 풀 콤보/올 퍼펙트
	s.$msg = $("<div>").addClass("rtype-msg").hide();
	// 왼쪽 미션 칸(.items)은 숨기지 않고 clearBoard가 둔 대로(투명) 남겨, 오른쪽 체인 칸과 좌우 균형을 맞춤
	$stage.game.display.empty().addClass("rtype-display").append(s.$lane, s.$msg);
	// 노란 바: 항상 가득 차 있고, 곡 시작 직전에는 조작 안내, 곡 중에는 지금 입력 중인 내용
	$stage.game.turnBar.width("100%").css('text-align', "center");
	R.setBar("");
	R.setMsg("♪ " + s.title);
	// 체인 칸: 내 콤보. 관전자는 비움
	$stage.game.chain.show().html(spec ? "" : 0);

	if (!spec) R.setupInput();

	// 오디오 프리로드
	if ($sound[s.key]) s.loaded = true;
	else getAudio(s.key, "/media/common/bgms/" + data.song + ".opus", function () {
		if (R.s !== s) return;
		s.loaded = true;
		if (s.ctxStart !== null) R.playAudio();
	});
	// 카운트다운 박마다 울릴 효과음
	if (!$sound.xrg_hitsound) getAudio("xrg_hitsound", "/media/common/hitsound.wav", function () {
		if (R.s === s) R.playBeats();
	});
	R.startSync();
};
// 입력창
// - 모바일: 플로팅 입력창(.game-input) 자리에 한 줄짜리 textarea (엔터가 값에 \n으로 들어가고, 엔터를 쳐도 키보드가 닫히지 않음)
// - 데스크톱: 채팅창(#Talk)을 그대로 입력창으로 씀 (평소 포커스가 있는 곳). 엔터는 값에 남지 않으므로 키 이벤트로 받고 채팅 전송은 막음
$lib.Rtype.setupInput = function () {
	var R = $lib.Rtype;
	var s = R.s;

	s.inp = { lastVal: "", prevJ: [], batch: null, lastEnter: -Infinity, histW: -1 };
	s.onInput = function (e) {
		if (R.s === s) R.check(e.timeStamp);
	};
	if (mobile) {
		s.ownInput = true;
		s.$input = $("<textarea>").addClass("rtype-input").attr({ rows: 1, autocomplete: "off", autocorrect: "off", autocapitalize: "off", spellcheck: "false" });
		// 입력창을 누르면 .game-input의 기본 클릭 처리(숨긴 #game-input 포커스)가 포커스를 가져가지 않게 막음
		s.$input.on('click', function (e) { e.stopPropagation(); });
		$stage.game.hereText.hide();
		$stage.game.here.append(s.$input).css({ 'opacity': 1, 'top': "" }).show();
		// 입력창 주변(.game-input 여백)을 눌러도 이 입력창으로 포커스
		$stage.game.here.on('click.rtype', function () {
			if (R.s === s && s.$input) s.$input.focus();
		});
	} else {
		s.$input = $stage.talk;
		$stage.talk.val("");
		$stage.game.hereText.val("");
		// 캡처 단계에서 받아 채팅창의 엔터(채팅 전송)보다 먼저 처리
		s.onKey = function (e) { R.onKey(e); };
		document.addEventListener("keydown", s.onKey, true);
	}
	s.$input[0].addEventListener("input", s.onInput);
};
// 데스크톱 키 입력: 채팅창의 엔터는 게임 입력으로 바꾸고, 입력란 밖에서 누른 키는 채팅창으로 포커스를 옮겨 바로 칠 수 있게 함
$lib.Rtype.onKey = function (e) {
	var R = $lib.Rtype;
	var s = R.s;
	var tag = e.target && e.target.tagName;

	if (!s || !s.$input || e.ctrlKey || e.altKey || e.metaKey) return;
	if (e.key === "Enter" || e.keyCode === 13) {
		if (e.target !== s.$input[0]) return;
		// 꾹 누를 때의 자동 반복은 입력으로 치지 않음 (채팅 전송만 막음)
		if (e.repeat) {
			e.preventDefault();
			e.stopImmediatePropagation();
			return;
		}
		// macOS는 조합 중 엔터에 keydown이 두 번 옴(229 다음 13): 조합 중인 것은 기본 동작(조합 확정)을 막지 않고, 중복은 R.enter가 거름
		if (!e.isComposing && e.keyCode !== 229) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
		R.enter(e.timeStamp);
		return;
	}
	if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !e.target.isContentEditable) s.$input.focus();
};
$lib.Rtype.releaseInput = function (s) {
	s = s || $lib.Rtype.s;
	if (!s || !s.$input) return;
	clearTimeout(s.inp.batchTimer);
	s.$input[0].removeEventListener("input", s.onInput);
	if (s.onKey) document.removeEventListener("keydown", s.onKey, true);
	if (s.ownInput) {
		s.$input.remove();
		$stage.game.here.off('click.rtype');
		$stage.game.hereText.show();
	} else {
		$stage.talk.val("");
		$stage.game.hereText.val("");
	}
	s.$input = null;
};
// 서버와의 시계 차이 측정: RTT가 가장 작은 표본을 채택
$lib.Rtype.startSync = function () {
	var R = $lib.Rtype;
	var s = R.s;

	if (s.spec) return;
	s.syncTimer = addInterval(function () {
		if (R.s !== s || ++s.syncN > RTP_SYNC_COUNT) return clearInterval(s.syncTimer);
		send('xrgSync', { c: Date.now() });
	}, RTP_SYNC_GAP);
};
$lib.Rtype.onSync = function (data) {
	var s = $lib.Rtype.s;
	var rtt = Date.now() - data.c;

	if (!s || rtt < 0) return;
	// 서버 시각 = 로컬 시각 + off
	if (!s.best || rtt < s.best.rtt) s.best = { rtt: rtt, off: data.s - (data.c + rtt / 2) };
};
$lib.Rtype.turnStart = function (data) {
	var R = $lib.Rtype;
	var s = R.s;
	var off, msUntil;

	if (!s) return;
	off = s.best ? s.best.off : (typeof data.now == 'number' ? data.now - Date.now() : 0);
	msUntil = (data.startAt - off) - Date.now();
	if (audioContext.state == 'suspended') audioContext.resume();
	s.ctxStart = audioContext.currentTime + msUntil / 1000;
	if (s.loaded) R.playAudio();
	R.playBeats();
	if (s.$input && !mobile) s.$input.focus();
	cancelAnimationFrame(s.raf);
	s.raf = requestAnimationFrame(R.frame);
};
// 지정한 시각(ctxStart)에 BGM 재생 시작. 이미 지났으면 그만큼 건너뛰어 재생
$lib.Rtype.playAudio = function () {
	var s = $lib.Rtype.s;
	var buf = $sound[s.key];
	var now = audioContext.currentTime;
	var vol = $data.muteBGM ? 0 : ($data.BGMVolume === undefined ? 1 : $data.BGMVolume);
	var src, gain, wait;

	if (s.src || s.played) return;
	s.played = true;
	if (window.AudioBuffer && buf instanceof AudioBuffer) {
		src = audioContext.createBufferSource();
		src.buffer = buf;
		gain = audioContext.createGain();
		gain.gain.value = vol;
		src.connect(gain);
		gain.connect(audioContext.destination);
		src.gainNode = gain;
		src.start(Math.max(s.ctxStart, now), Math.max(0, now - s.ctxStart));
		s.src = $data.bgm = src;
	} else if (buf && buf.audio) {
		// 디코딩 실패로 HTMLAudio로 대체된 경우: 샘플 단위 정확도는 없음
		wait = (s.ctxStart - now) * 1000;
		buf.audio.volume = vol;
		buf.audio.loop = false;
		s.src = $data.bgm = buf;
		s.fbTimer = addTimeout(function () {
			buf.audio.currentTime = Math.max(0, -wait) / 1000;
			buf.start();
		}, Math.max(0, wait));
	}
};
// 카운트다운 7~4 (GO!까지)에만 효과음을 예약 재생. 이미 지난 박은 건너뜀. 카운트 c는 곡 시작 (c+1)박 전
$lib.Rtype.playBeats = function () {
	var s = $lib.Rtype.s;
	var now = audioContext.currentTime;
	var k, when, src;

	if (!s || s.ctxStart === null || s.beatsPlayed) return;
	s.beatsPlayed = true;
	s.beatSrcs = [];
	for (k = RTP_COUNT; k >= 4; k--) {
		when = s.ctxStart - (k + 1) * s.beat / 1000;
		if (when < now) continue;
		if (src = $lib.Rtype.hitSound(when)) s.beatSrcs.push(src);
	}
};
// 히트사운드를 지정한 오디오 시각(생략하면 즉시)에 재생. 효과음 볼륨/음소거를 따름
$lib.Rtype.hitSound = function (when) {
	var buf = $sound.xrg_hitsound;
	var vol = $data.muteEff ? 0 : ($data.EffectVolume === undefined ? 1 : $data.EffectVolume);
	var src, gain;

	if (!(window.AudioBuffer && buf instanceof AudioBuffer)) return null;
	src = audioContext.createBufferSource();
	src.buffer = buf;
	gain = audioContext.createGain();
	gain.gain.value = vol;
	src.connect(gain);
	gain.connect(audioContext.destination);
	src.start(when || 0);
	return src;
};
// 현재 곡 위치(ms). 출력 지연을 빼서 "귀에 들리는" 위치 기준으로 맞춤
$lib.Rtype.songTime = function () {
	var s = $lib.Rtype.s;
	var lat = Math.min(0.25, audioContext.outputLatency || audioContext.baseLatency || 0);

	// s.sync(+면 노트가 일찍 나옴): 판정선 도달 시각과 입력 시각(서버로 보내는 t)을 같은 만큼 옮겨, 화면과 판정이 함께 맞춰짐
	return (audioContext.currentTime - s.ctxStart - lat) * 1000 + s.sync;
};
// 이벤트 시각(performance.now 기준 e.timeStamp)을 곡 위치(ms)로 바꿈
$lib.Rtype.toSongTime = function (ts) {
	return $lib.Rtype.songTime() - (performance.now() - ts);
};
$lib.Rtype.setBar = function (txt) {
	var s = $lib.Rtype.s;

	if (s.barTxt === txt) return;
	s.barTxt = txt;
	$stage.game.turnBar.text(txt);
};
// 표시창 가운데 글자. cls는 글자 색 클래스(풀 콤보/올 퍼펙트는 4패널 치기와 같은 색), 빈 문자열이면 숨김
// 글자는 label에 넣음 (style.css가 span을 전부 display: none으로 숨김)
$lib.Rtype.setMsg = function (txt, cls) {
	var s = $lib.Rtype.s;

	if (s.msgTxt === txt) return;
	s.msgTxt = txt;
	s.$msg.empty().append($("<label>").addClass(cls || "").text(txt)).toggle(!!txt);
};
$lib.Rtype.frame = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var st, i, n, dt, half, remain, k, missed;

	if (!s || s.ended) return;
	s.raf = requestAnimationFrame(R.frame);
	// 안전망: input 이벤트 없이 값이 바뀐 경우도 잡음 (값이 그대로면 아무것도 안 함)
	if (s.$input) R.check(performance.now());
	st = R.songTime();

	remain = Math.max(0, RTP_ROUND - Math.max(0, st));
	$stage.game.roundBar
		.width(remain / RTP_ROUND * 100 + "%")
		.html((Math.round(remain / 100) / 10).toFixed(1) + L['SECOND']);
	// 곡 시작 전: 표시창에 곡 이름 -> 카운트다운(7, 6, 5 = 3, 2, 1 / 4 = GO!), 3~0박에는 노란 바에 조작 안내. 곡 중에는 노란 바에 입력 중인 내용(R.drawTyped)
	if (st < 0) {
		k = Math.ceil(-st / s.beat) - 1;
		if (st < -(RTP_COUNT + 1) * s.beat) R.setMsg("♪ " + s.title);
		else if (k > 4) R.setMsg(String(k - 4));
		else if (k == 4) R.setMsg(L['xrgGo'] || "GO!");
		else {
			R.setMsg("");
			R.setBar(s.spec ? "" : mobile ? "Touch!" : "Type!");
		}
	} else if (!s.started) {
		R.setMsg("");
		s.started = true;
		R.drawTyped();
	}

	// 판정 범위를 지난 노트: 미스. 서버에도 이 시각까지의 미스를 정산하게 알림 (한 프레임에 한 번)
	if (!s.spec) {
		while (s.p < s.notes.length && st - s.notes[s.p].t > s.win[2]) {
			R.missNote();
			missed = true;
		}
		if (missed) send('rtpMiss', { t: Math.ceil(st) });
	}

	half = s.$lane[0].clientWidth / 2;
	for (i = s.lo; i < s.notes.length; i++) {
		n = s.notes[i];
		dt = n.t - st;
		if (dt > s.lead) break;
		if (dt < -s.lead) {
			// 왼쪽 끝까지 흘러간 노트는 지움
			R.removeNote(n);
			if (i == s.lo) s.lo++;
			continue;
		}
		if (!n.el) {
			n.el = $("<div>").addClass("rtype-note" + (n.k == RTP_ENTER ? " rtype-enter" : "")).text(n.k == RTP_ENTER ? "⏎" : n.k);
			if (n.j !== undefined) n.el.addClass("rtype-j" + n.j);
			s.$lane.append(n.el);
		}
		n.el[0].style.transform = "translateX(" + (half + dt / s.lead * half).toFixed(1) + "px)";
	}
};
$lib.Rtype.removeNote = function (n) {
	if (n.el) {
		n.el.remove();
		n.el = null;
	}
};
// 노트 판정 결과를 색으로 표시: 0 퍼펙트 하늘 / 1 굿 초록 / 2 배드 빨강 / 3 미스 회색
$lib.Rtype.markNote = function (n, j) {
	n.done = true;
	n.j = j;
	if (n.el) n.el.addClass("rtype-j" + j);
};
// 노트 p를 처리했으니 다음으로. 단어의 마지막 노트(엔터)였으면 다음 단어 전에 입력창을 비움
$lib.Rtype.advance = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var n = s.notes[s.p++];
	var last = --s.left == 0;
	var fc = last && !s.brk;

	if (n.k == RTP_ENTER) {
		// 단어 완성: 전부 Perfect면 success, 최저 판정이 Good이면 mission 소리 (Bad가 있거나 보너스가 사라진 단어는 소리 없음)
		// 마지막 단어에서 풀 콤보/올 퍼펙트면 아래의 success 소리만 냄 (겹치지 않게)
		if (!fc && !s.dead[n.w] && s.worst[n.w] < 2) playSound(s.worst[n.w] == 0 ? 'success' : 'mission');
		R.clearInput();
	}
	if (last) {
		send('rtpDone', {});
		// 마지막 노트까지 콤보가 안 끊겼으면 풀 콤보, 전부 Perfect면 올 퍼펙트 (success 소리와 함께 표시창에 표시)
		if (fc) {
			playSound('success');
			R.setMsg(s.allPerfect ? "ALL PERFECT" : "FULL COMBO", s.allPerfect ? "rhythm-allp" : "rhythm-fc");
		}
	}
};
$lib.Rtype.missNote = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var n = s.notes[s.p];

	R.markNote(n, 3);
	s.dead[n.w] = true;
	s.brk = true;
	s.allPerfect = false;
	R.breakCombo();
	R.advance();
};
$lib.Rtype.hitNote = function (t) {
	var R = $lib.Rtype;
	var s = R.s;
	var n = s.notes[s.p];
	var d = Math.abs(t - n.t);
	var j = d <= s.win[0] ? 0 : d <= s.win[1] ? 1 : 2;

	R.markNote(n, j);
	R.hitSound();
	if (s.worst[n.w] === undefined || j > s.worst[n.w]) s.worst[n.w] = j;
	if (j != 0) s.allPerfect = false;
	// Bad에서 콤보가 끊기고 Perfect/Good은 이어짐 (보너스 점수는 서버가 같은 규칙으로 계산)
	if (j == 2) {
		s.brk = true;
		R.breakCombo();
	} else R.showCombo(++s.chain);
	R.advance();
};
// 콤보 끊김 (미스/배드/공미스). 이어지던 콤보가 없으면(곡 시작 전 입력 등) 풀 콤보 판정에는 영향 없음
$lib.Rtype.breakCombo = function () {
	var s = $lib.Rtype.s;

	if (s.chain > 0) {
		s.brk = true;
		s.allPerfect = false;
	}
	s.chain = 0;
	$lib.Rtype.showCombo(0);
};
// 체인 칸에 콤보 표시: 두 번째 연속 성공이 1콤보 (4패널 치기와 같음)
$lib.Rtype.showCombo = function (chain) {
	$stage.game.chain.html(Math.max(0, chain - 1));
};
// 입력 하나를 내 화면에서 판정하고 서버로 보냄. k = 자모 / 엔터 / 'BS', t = 곡 위치(ms)
// 규칙은 서버(rtype.js applyHit)와 같음: 맨 앞 노트와 같으면 판정, 다르지만 다음 노트와 같으면 앞 노트 MISS + 다음 노트 판정,
// 그 밖은 공미스(콤보만 끊김). 백스페이스는 단어 입력 중이면 그 단어 보너스만 없앰
$lib.Rtype.press = function (k, t) {
	var R = $lib.Rtype;
	var s = R.s;
	var f, n2;

	send('rtpHit', { k: k, t: Math.round(t) });
	while (s.p < s.notes.length && t - s.notes[s.p].t > s.win[2]) R.missNote();
	f = s.notes[s.p];
	n2 = s.notes[s.p + 1];
	if (k === 'BS') {
		if (f && s.p > s.words[f.w].first) s.dead[f.w] = true;
		return;
	}
	if (f && Math.abs(t - f.t) <= s.win[2] && f.k === k) return R.hitNote(t);
	if (f && n2 && Math.abs(t - n2.t) <= s.win[2] && n2.k === k) {
		R.missNote();
		return R.hitNote(t);
	}
	R.breakCombo();
};
// 입력창 값 비교 (input 이벤트와 매 프레임 검사가 같이 부름). 이전 값과 같으면 아무것도 안 함
$lib.Rtype.check = function (ts) {
	var R = $lib.Rtype;
	var s = R.s;
	var inp = s.inp;
	var v = s.$input.val();
	var nl;

	if (v === inp.lastVal) return;
	inp.lastVal = v;
	nl = v.indexOf(RTP_ENTER) != -1;
	if (!inp.batch) {
		inp.batch = { startJ: inp.prevJ, ts: ts };
		inp.batchTimer = addTimeout(R.closeBatch, RTP_BATCH);
	}
	inp.prevJ = rtpDecompose(v.replace(/\n/g, ""));
	if (nl) {
		// 엔터는 묶음을 기다리지 않고 바로 처리 (묶음 안의 자모를 먼저, 엔터를 나중에)
		inp.batch.enter = ts;
		R.closeBatch();
	}
	R.drawTyped();
};
// 키 이벤트로 받은 엔터 (데스크톱 채팅창: 엔터가 값에 남지 않음). 아직 못 본 값 변화(조합 확정)를 먼저 처리한 뒤 엔터
$lib.Rtype.enter = function (ts) {
	var R = $lib.Rtype;
	var inp = R.s.inp;

	R.check(ts);
	if (!inp.batch) inp.batch = { startJ: inp.prevJ, ts: ts };
	inp.batch.enter = ts;
	R.closeBatch();
};
// 묶음이 끝나면 묶음 시작 때와 지금의 자모를 비교해 입력으로 처리
$lib.Rtype.closeBatch = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var inp, b, d, t, i, v;

	if (!s || !s.inp || !(b = s.inp.batch)) return;
	inp = s.inp;
	inp.batch = null;
	clearTimeout(inp.batchTimer);
	// 곡 시각을 알기 전(시작 신호 전)이나 끝난 뒤의 입력은 버림
	if (s.ctxStart === null || s.ended) return R.clearInput();
	d = rtpDiff(b.startJ, inp.prevJ);
	t = R.toSongTime(b.ts);
	if (d.removed.length) R.press('BS', t);
	if (d.added.length < RTP_PASTE) {
		for (i = 0; i < d.added.length; i++) R.press(d.added[i], t);
	}
	if (b.enter) {
		if (b.enter - inp.lastEnter >= RTP_ENTER_DEDUP) {
			inp.lastEnter = b.enter;
			// 엔터를 누른 때 입력창에 입력이 있었으면 그 단어의 정답 단어를 히스토리에 (단어를 완성했든 못했든). 판정이 입력창을 비우므로 먼저 읽어 둠
			v = s.$input.val().replace(/\n/g, "");
			R.press(RTP_ENTER, R.toSongTime(b.enter));
			// 방금 처리한 노트가 엔터면 그 단어, 아니면(공미스) 지금 입력 중인 단어. 이미 넣은 단어는 다시 넣지 않음
			if (v) {
				i = s.p > 0 && s.notes[s.p - 1].k == RTP_ENTER ? s.notes[s.p - 1].w : s.p < s.notes.length ? s.notes[s.p].w : s.words.length - 1;
				if (i !== inp.histW) {
					inp.histW = i;
					pushHistory(s.words[i].text, "");
				}
			}
		}
		// 단어 끝 엔터였으면 위에서 이미 비워짐. 단어 중간 엔터(공미스)면 줄바꿈만 지우고 입력 중인 글자는 남김
		if (s.$input && (v = s.$input.val()).indexOf(RTP_ENTER) != -1) {
			s.$input.val(v.replace(/\n/g, ""));
			inp.lastVal = s.$input.val();
		}
	}
	R.drawTyped();
};
// 다음 단어 전에 입력창을 비움 (조합 중이어도 비움: 실기 테스트에서 지운 글자가 되살아나지 않음을 확인)
$lib.Rtype.clearInput = function () {
	var R = $lib.Rtype;
	var s = R.s;

	if (!s.$input) return;
	if (s.inp.batch) R.closeBatch();
	s.$input.val("");
	if (!s.ownInput) $stage.game.hereText.val(""); // 데스크톱: 채팅창과 동기화되는 플로팅 입력창도 같이 비움
	$data._kd = ""; // 붙여넣기 감지 기준선(checkInput)
	s.inp.lastVal = "";
	s.inp.prevJ = [];
	R.drawTyped();
};
// 노란 바에 지금 입력 중인 내용 (곡 시작 후에만)
$lib.Rtype.drawTyped = function () {
	var s = $lib.Rtype.s;

	if (!s.started) return;
	$lib.Rtype.setBar(s.$input ? s.$input.val().replace(/\n/g, "") : "");
};
// 라운드 종료 처리: 진행을 멈추고 채팅창을 입력창에서 풀어 줌. 이미 끝났으면 아무것도 안 하고 false
// turnEnd 신호 없이 roundEnd만 오는 경우(2인 게임에서 한 명이 나가 서버가 바로 roundEnd 등)에도 body.js가 부름
$lib.Rtype.finish = function () {
	var R = $lib.Rtype;
	var s = R.s;
	var i;

	if (!s || s.ended) return false;
	s.ended = true;
	cancelAnimationFrame(s.raf);
	for (i = 0; i < s.notes.length; i++) R.removeNote(s.notes[i]);
	R.releaseInput(s);
	if (!s.spec && !mobile) $stage.talk.focus();
	return true;
};
$lib.Rtype.turnEnd = function (id, data) {
	var R = $lib.Rtype;
	var $sc;

	// 라운드 종료 신호
	if (!data || !data.target) {
		R.finish();
		stopBGM();
		playSound('horr');
		return;
	}
	// 내 점수를 포함해 모든 점수는 서버 판정 결과로만 반영 (judge 3 = 미스 감점, 4 = 단어 완성 보너스)
	addScore(id, data.score, data.totalScore);
	updateScore(id, getScore(id));
	$sc = $("<div>").addClass("deltaScore").html((data.score > 0 ? "+" : "") + data.score);
	if (data.score < 0) $sc.addClass("lost");
	drawObtainedScore($("#game-user-" + id), $sc);
};
// 게임 화면 정리 (clearBoard / clearGame에서 호출)
$lib.Rtype.cleanup = function () {
	var s = $lib.Rtype.s;

	$stage.game.display.removeClass("rtype-display");
	if (!s) return;
	$lib.Rtype.s = null;
	cancelAnimationFrame(s.raf);
	clearInterval(s.syncTimer);
	clearTimeout(s.fbTimer);
	$lib.Rtype.releaseInput(s);
	if (s.src) {
		try { s.src.stop(); } catch (e) { }
		if ($data.bgm === s.src) $data.bgm = null;
	}
	(s.beatSrcs || []).forEach(function (b) {
		try { b.stop(); } catch (e) { }
	});
	s.$lane.remove();
	s.$msg.remove();
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
function changeSoundPack(newPackName, callback) {
	// 현재 재생 중인 BGM/소리 중지 (리듬/자음퀴즈 진행 중에는 $_sound에 든 BGM도 끊기므로 통째로 유지)
	if (!isGameBGMKept()) {
		stopBGM();
		stopAllSounds();
	}

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
	if (type != "test" && type != "draw" && type != "fill" && type != "team" && type != "xrgHit" && type != "xrgSync" && type != "rtpHit" && type != "rtpMiss") if (spamCount++ > 10) {
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
	// 창 크기는 화면 값이고 창의 left·top은 CSS 값이라 UI 배율로 나눔 (신 UI 데스크톱 — 기본 UI는 1)
	var size = [$(window).width() / NK.gameZoom, $(window).height() / NK.gameZoom];

	if (!noToggle && $d.is(":visible")) {
		$d.hide();
		return false;
	} else {
		$(".dialog-front").removeClass("dialog-front");
		// 주제 고르기 창: 열 때마다 검색어를 비움 (ready.js filterPicks)
		$d.find(".pick-search").val("").trigger('input');
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
	$data._activeTheme = theme || 'blue';
	if (window.ThemeEngine) window.ThemeEngine.apply($data._activeTheme, $data._activeDarkMode || 'light');
}
function applyDarkMode(setting) {
	$data._activeDarkMode = setting || 'light';
	if (window.ThemeEngine) window.ThemeEngine.apply($data._activeTheme || 'blue', $data._activeDarkMode);
}
function rebuildInjeongExplHTML(dict) {
	function themeList(list) {
		return (list || []).map(function (item) { return dict['theme_' + item] || item; });
	}

	return "<h5>" + (dict['explInjeong'] || '') + "</h5>"
		+ "<h5 style='margin-top: 2px; border-top: 1px dashed #444444; padding-top: 2px; color: #BBBBBB;'>" + (dict['explInjeongListTitle'] || '') + "</h5>"
		+ "<h5>" + themeList(KO_INJEONG) + "</h5>"
		+ "<h5 style='margin-top: 2px; border-top: 1px dashed #444444; padding-top: 2px; color: #BBBBBB;'>" + (dict['explInjeongListTitle'] || '') + " (" + (dict['modeEKT'] || '') + ", " + (dict['modeESH'] || '') + ")</h5>"
		+ "<h5>" + themeList(EN_INJEONG) + "</h5>"
		+ "<h5 style='margin-top: 2px; border-top: 1px dashed #444444; padding-top: 2px; color: #BBBBBB;'>" + (dict['explInjeongListTitle'] || '') + " (" + (dict['modeJSH'] || '') + ", " + (dict['modeJAP'] || '') + ", " + (dict['modeJKT'] || '') + ")</h5>"
		+ "<h5>" + themeList(JA_INJEONG) + "</h5>";
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
	$("#player-scroll").prop('checked', ($data.opts.ps === true));
	$("#kana-reading").prop('checked', ($data.opts.kr !== false));

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
	if (beatMode === 'mid') return BEAT_Mid;
	if (beatMode === 'default') return BEAT;
	// auto: 팩 이름 기반 자동 선택
	if (!packName || packName === '기본' || packName === '레트로' || packName === '물방울') return BEAT;
	return BEAT_Mid;
}

function loadVolumeSettings() {
	try {
		return JSON.parse(localStorage.getItem('kkutu_volume')) || { bgmMute: null, effectMute: null, bgmVolume: null, effectVolume: null, soundPack: null, lobbyBGM: null, noEasterEgg: null, aiAutoApply: null, jaAutoConvert: null, levelPack: null, aiMuteGame: null, aiMuteLobby: null, aiRageQuit: null, aiFastMode: null, theme: null, darkMode: null, beatMode: null, rhythmSync: null };
	} catch (e) {
		return { bgmMute: null, effectMute: null, bgmVolume: null, effectVolume: null, soundPack: null, lobbyBGM: null, noEasterEgg: null, aiAutoApply: null, jaAutoConvert: null, levelPack: null, aiMute: null, aiRageQuit: null, aiFastMode: null, theme: null, darkMode: null };
	}
}

function saveVolumeSettings(data) {
	var current = loadVolumeSettings();
	for (var key in data) current[key] = data[key];
	localStorage.setItem('kkutu_volume', JSON.stringify(current));
}

// UI 전환 후 새로고침. 주소에 ?ui= 가 남아 있으면 로드 때 다시 덮어쓰므로 같이 바꾼다.
function reloadWithUI(ui) {
	var search = location.search.replace(/([?&])ui=(new|classic)(&|$)/, function (m, pre, v, post) { return post ? pre : ''; });
	if (/[?&]ui=/.test(location.search)) search += (search ? '&' : '?') + 'ui=' + ui;
	if (search !== location.search) location.replace(location.pathname + search + location.hash);
	else location.reload();
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
// Worker 중계 주소: wss://<RELAY_HOST>/<원래 포트>/<원래 경로>
// 중계가 꺼져 있거나(global.json WORKER_RELAY) 이 페이지에서 중계 접속이 한 번 실패했으면 null → 기존 주소 사용
function relayURL(url) {
	if (!$data.RELAY_HOST || $data._relayFailed) return null;
	var m = /^wss?:\/\/[^\/:]+:(\d+)\/(.*)$/.exec(url);
	if (!m) return null;
	return "wss://" + $data.RELAY_HOST + "/" + m[1] + "/" + m[2];
}
function connectToRoom(chan, rid) {
	var url = $data.URL.replace(/:(\d+)/, function (v, p1) {
		return ":" + ($data.ROOM_PORT ? Number($data.ROOM_PORT) + Number(chan) - 1 : Number(p1) + Number(chan));
	}) + "&" + chan + "&" + rid;

	if (rws) return;
	var target = url + "&locale=" + (localStorage.getItem('kkutu_lang') || 'ko_KR');
	var relay = relayURL(target);
	var opened = false;
	var cancelled = false;
	var sock = rws = new _WebSocket(relay || target);
	// 중계가 응답 없이 멈춰 있으면 5초 뒤 끊어서 기존 주소로 넘어가게 한다
	if (relay) _setTimeout(function () { if (!opened && sock.readyState === _WebSocket.CONNECTING) sock.close(); }, 5000);

	loading(L['connectToRoom'] + "\n<center><button id='ctr-close'>" + L['ctrCancel'] + "</button></center>");
	$("#ctr-close").on('click', function () {
		cancelled = true;
		loading();
		if (rws) rws.close();
	});
	rws.onopen = function (e) {
		opened = true;
	};
	rws.onmessage = _onMessage;
	rws.onclose = function (e) {
		rws = undefined;
		// Worker 중계로 연결조차 못 했으면 중계를 끄고 같은 방에 기존 주소로 다시 접속 (방 예약은 서버에 닿지 않았으므로 그대로 남아 있음)
		if (relay && !opened && !cancelled) {
			$data._relayFailed = true;
			connectToRoom(chan, rid);
			return;
		}
		// 정상 퇴장은 방 정보(processRoom)가 상태를 먼저 지우므로, 여기서는 남은 상태가 있을 때만(워커 재시작 등으로 끊김) 로비로 되돌림
		if (resetRoomState()) {
			updateUI();
			playBGM('lobby');
		} else {
			clearInterval($data._tTime);
			clearBoard();
		}
	};
	rws.onerror = function (e) {
	};
}
// 방 소켓이 갑자기 끊기거나 마스터에 다시 접속했을 때, 남은 방·게임·연습·결과 상태를 정상 퇴장(processRoom)과 같은 범위로 로비 상태로 되돌림.
// 연습 중이었으면 돌아갈 방(연습 전 방)도 버림. 되돌릴 상태가 없으면 아무것도 하지 않고 false
function resetRoomState() {
	var me = $data.users && $data.users[$data.id];

	if (!$data.place && !$data.practicing && !$data._gaming && !$data.resulting && !$data._players) return false;
	if ($data._gaming || $data.practicing) stopAllSounds();
	clearInterval($data._tTime);
	clearBoard();
	if (me && me.game) {
		me.game.ready = false;
		me.game.team = 0;
		me.game.form = "J";
	}
	$stage.menu.spectate.removeClass("toggled");
	$stage.menu.ready.removeClass("toggled");
	$data.practicing = false;
	$data._gaming = false;
	$data._spectate = false;
	$data.resulting = false;
	$data.room = null;
	$data.robots = {};
	clearTimeout($data._jamsu);
	delete $data._jamsu;
	$data._players = null;
	$data._master = null;
	$data.place = 0;
	if ($data.users) delete $data.users[0];
	delete $data._room;
	delete $data._place;
	delete $data.__master;
	delete $data.__players;
	return true;
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
			// 위에서 onclose 없이 닫았으므로 끊긴 방의 게임·연습·결과 상태도 여기서 로비 상태로 되돌림
			resetRoomState();
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
				var noticeMsg = data.value || L[data.code] || L['error_' + data.code];
				if (data.v1 !== undefined) noticeMsg = noticeMsg.replace('{V1}', data.v1);
				notice(noticeMsg, data.head);
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
			$data.mission = null;
			chaosResetVisual();
			route("roundReady", data);
			break;
		case 'turnStart':
			route("turnStart", data);
			if ($data._chaosHideTurn) chaosHideCurrentTurn();
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
				// 카오스 플러스 차례 숨기기: 규칙의 turnEnd가 .game-user-current로 카드를 찾으므로 되돌려 둠 (같은 작업 안에서 지워져 화면에는 안 보임)
				chaosRestoreCurrentTurn();
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
		case 'xrgSync':
			if ($lib.Rhythm && $lib.Rhythm.onSync) $lib.Rhythm.onSync(data);
			if ($lib.Rtype && $lib.Rtype.onSync) $lib.Rtype.onSync(data);
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
			// 리듬 게임/리듬 타이퍼: 인원 이탈 등으로 서버가 turnEnd 없이 바로 roundEnd하면
			// 키 입력 가로채기/채팅창 점유와 곡 재생이 다음 게임까지 남으므로 여기서 마저 정리 (정상 종료면 이미 끝나 있어 아무것도 안 함)
			chaosResetVisual();
			var xrgCut = !!($lib.Rhythm && $lib.Rhythm.finish());
			if ($lib.Rtype && $lib.Rtype.finish()) xrgCut = true;
			if (xrgCut) stopBGM();
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
		case 'undo':
			if ($lib.Picture && $lib.Picture.handleUndo) {
				$lib.Picture.handleUndo(data);
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
			} else if (data.code == 420) {
				// 게스트 접속 차단
				showConfirm(L['error_420'], function (res) {
					if (res) {
						location.href = "/login?desc=login_kkutu";
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
							.removeClass("team-1 team-2 team-3 team-4 team-5 team-6")
							.toggleClass("team-" + _nt, _nt > 0);
					}
				}
			}
			// 카오스 플러스 시각 효과 토글 (서바이벌의 점수 가리기는 ...Dmg 코드)
			var _cv = /^chaos(HideScore|HideTurn)(On|Off)/.exec(data.code);
			if (_cv) {
				if (_cv[1] === 'HideScore') setChaosHideScore(_cv[2] === 'On');
				else $data._chaosHideTurn = (_cv[2] === 'On');
			}
			// 카오스 플러스 힐/딜: 서버가 보낸 생존자 HP로 갱신
			if (data.hp) {
				for (var _hid in data.hp) {
					var _hu = $data.users[_hid] || $data.robots[_hid];
					if (_hu && _hu.game) _hu.game.score = data.hp[_hid];
					updateScore(_hid, data.hp[_hid]);
				}
			}
			var _chaosBody = L[data.code + 'Body'];
			if (data.arg !== undefined && _chaosBody) _chaosBody = _chaosBody.replace('{0}', data.arg);
			notice(_chaosBody, L[data.code]);
			break;
		case 'lateJoinAsk':
			// 게임 중 참여 방 입장: [참여] → 관전으로 들어간 뒤 참여 / [관전] → 관전만 / 닫기 → 입장하지 않음
			(function (target, queue) {
				var enterAs = function (join) {
					$stage.dialog.lateJoin.hide();
					stopBGM();
					$data._spectate = true;
					$data._gaming = true;
					send('enter', { id: target, password: $data._pw, spectate: true, lateJoin: join }, true);
				};
				$stage.dialog.lateJoinText.html(escapeContent(L[queue ? 'lateJoinAskQueue' : 'lateJoinAsk']).replace(/\n/g, '<br>'));
				$stage.dialog.lateJoinOK.off('click').on('click', function () { enterAs(true); });
				$stage.dialog.lateJoinSpectate.off('click').on('click', function () { enterAs(false); });
				showDialog($stage.dialog.lateJoin);
			})(data.target, data.queue);
			break;
		case 'lateJoinQueued':
		case 'lateJoinClosed':
			notice(L[data.type]);
			break;
		case 'lateJoin':
			// 누군가 게임 중 참여: seq를 갱신하고 카드를 다시 그린다 (인원에 따라 카드 레이아웃이 바뀔 수 있음).
			// 기존 카드는 떼어 두었다가 그대로 끼워 넣어 점수·현재 차례 강조·아이템 대기 표시를 보존한다
			if ($data.room && $data.room.game && data.seq) {
				var $ljOld = {}, ljGoals = {}, ljId;
				$(".GameBox .game-body").children("[id^='game-user-']").each(function () {
					ljId = this.id.slice(10);
					if ($data["_s" + ljId]) ljGoals[ljId] = $data["_s" + ljId].goal;
					$ljOld[this.id] = $(this).detach();
				});
				$data.room.game.seq = data.seq;
				if (data.id == $data.id) $data._spectate = false;
				// 되살린 점수를 저장해 둔다: 앞서 온 'user'(setForm)는 점수 복원 전 값(0)이라, 카드를 다시 그리거나 getScore를 쓰면 0으로 돌아갔음
				if ($data.users[data.id] && $data.users[data.id].game) $data.users[data.id].game.score = data.score || 0;
				updateRoom(true);
				for (var ljKey in $ljOld) {
					var $ljNew = $("#" + ljKey);
					if ($ljNew.length) $ljNew.replaceWith($ljOld[ljKey]);
				}
				for (ljId in ljGoals) updateScore(ljId, ljGoals[ljId]);
				updateScore(data.id, data.score || 0);
				var ljUser = $data.users[data.id];
				notice(L['lateJoinNotice'].replace("{0}", ljUser ? getDisplayName(ljUser) : data.id));
			}
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
	if (NK.active) NK.loadDone();
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
	// 자모(ㄱ~ㅎ, ㅏ~ㅣ)로 된 단어도 한국어로 찾음
	var text = text.replace(/[^\sa-zA-Zㄱ-ㆎ0-9가-힣ぁ-んァ-ヶ]/g, "");
	var lang = text.match(/[ㄱ-ㆎ가-힣]/) ? 'ko' : (text.match(/[ぁ-んァ-ヶ]/) ? 'ja' : 'en');

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
				$data._songpick = $data.room.opts.songpick || "";

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
				if (data.board) {
					// board/owners 필드는 Flip과 초성 땅따먹기가 같은 모양을 쓰므로 실제 모드로 구분해서 라우팅
					var specRule = RULE[MODE[data.room.mode]];
					if (specRule && specRule.rule === 'Landgrab') {
						$lib.Landgrab.roundReady(data, true);
						if (typeof data.roundTime === 'number') {
							$lib.Landgrab.turnStart({ roundTime: data.roundTime });
						}
					} else if (specRule && specRule.rule === 'Flip') {
						$lib.Flip.roundReady(data, true);
						if (typeof data.roundTime === 'number') {
							$lib.Flip.turnStart({ roundTime: data.roundTime });
						}
					} else if (specRule && specRule.rule === 'Center') {
						$lib.Center.roundReady(data, true);
						if (typeof data.roundTime === 'number') {
							$lib.Center.turnStart({ roundTime: data.roundTime });
						}
					}
				}
				if (data.sudoku) {
					$data.selectedRound = 1;
					$lib.Sudoku.roundReady({}, true);
					$lib.Sudoku.turnStart(data.sudoku);
				}
				if (data.rhythm) {
					$lib.Rhythm.roundReady(data.rhythm, true);
					if (data.rhythm.startAt) $lib.Rhythm.turnStart({ startAt: data.rhythm.startAt, now: data.rhythm.now });
				}
				if (data.rtype) {
					$lib.Rtype.roundReady(data.rtype, true);
					if (data.rtype.startAt) $lib.Rtype.turnStart({ startAt: data.rtype.startAt, now: data.rtype.now });
				}
				if (data.condition) {
					$lib.Wordcollect.roundReady(data, true);
					$data._maps = data.words || [];
					$lib.Wordcollect.drawMaps();
					if (typeof data.roundTime === 'number') {
						$lib.Wordcollect.turnStart({ roundTime: data.roundTime });
					}
				}
				// 그 밖의 모드: 서버가 보관한 마지막 roundReady/turnStart를 그대로 재생해 라운드·제시어·미션·남은 시간을 보여줌
				if (data.specRound) {
					var replayRule = RULE[MODE[data.room.mode]];
					var replayLib = replayRule && $lib[replayRule.rule];
					if (replayLib && replayLib.roundReady) {
						replayLib.roundReady(data.specRound, true);
						if (typeof data.chain == 'number') $stage.game.chain.html($data.chain = data.chain);
						if (data.specTurn && replayLib.turnStart) replayLib.turnStart(data.specTurn);
					}
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
	// 신 UI는 패널 크기를 CSS 그리드로 정하므로 고정 크기를 넣지 않음
	if (NK.active) $stage.box.chat.show();
	else {
		$stage.box.chat.show().width(790).height(190);
		$stage.chat.height(120);
	}

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
		$stage.box.room.show();
		if (!NK.active) $stage.box.room.height(360);
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
		if (!NK.active) {
			$(".ChatBox").width(1000).height(140);
			$stage.chat.height(70);
		}
		updateRoom(true);
	}
	if (only !== 'for-gaming') {
		$('.ItemBar').hide();
	} else if (!$data.room || !$data.room.opts || !$data.room.opts.item) {
		$('.ItemBar').hide(); // Even if for-gaming, hide if no item mode
	}
	$data._only = only;
	setLocation($data.place);
	$(".kkutu-menu ." + only).not(".ItemBar").show();
	if (NK.active) NK.onState(only);
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
			if (NK.active) NK.releaseGameLayout(); // 결과를 닫지 않고 바로 다음 게임이 시작돼도 지난 게임에서 잡아 둔 자리를 풂
			gameReady();
			$data._replay = false;
			startRecord($data.room.game.title);
		} else {
			if ($data._spectate) {
				$stage.dialog.resultSave.hide();
				$data._spectate = false;
				playBGM('lobby');
			} else {
				// 신 UI: 서버는 결과(roundEnd)보다 게임 끝 방 정보를 먼저 보내고, 곧이어 updateUI가 플레이어 카드를 비우므로 지금 판 자리를 잡아 둠
				if (NK.active) NK.holdGameLayout();
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
	$(".my-level").html(L['LEVEL'] + " " + getLevelText(lv));
	$(".my-gauge .graph-bar").css('width', ((my.data.score - prev) / (goal - prev) * 100) + "%");
	$(".my-gauge-text").html(commify(my.data.score) + " / " + commify(goal));
	if (NK.active) NK.renderAccount();
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
	if (NK.active && !refresh && getOnly() != "for-lobby") NK.queueUserList();
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
	if (NK.active) NK.afterUserList(len);
}
function userListBar(o, forInvite) {
	var $R;

	if (NK.active && !forInvite) return NK.userRow(o);
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

	// 신 UI는 자체 필터·빈 화면을 씀
	if (NK.active) return NK.afterRoomList();
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
	if (NK.active) return NK.roomCard(o);
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
			.append($("<div>").addClass("expl").html(L['LEVEL'] + " " + getLevelText(getLevel(o.data.score))))
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
// 플레이어 스크롤 옵션(클라이언트 옵션, $data.opts.ps)
function isPlayerScroll() {
	return !!($data.opts && $data.opts.ps === true);
}
// 플레이어 스크롤: 카드를 .game-body 안에서만 스크롤해 중앙에 오게 함 (0.2초 애니메이션)
// scrollLeft/scrollTop은 0~최대 범위로 제한하므로 영역을 넘지 않음
var PLAYER_SCROLL_TURN_RULES = ["Classic", "Hunmin", "Daneo", "Free", "Calcrelay", "Fourrelay", "Numberclap"]; // game-user-current로 차례를 표시하는 턴제 규칙
function isTurnBasedRule() {
	var rule = $data.room && RULE[MODE[$data.room.mode]];
	return !!rule && PLAYER_SCROLL_TURN_RULES.indexOf(rule.rule) >= 0;
}
function centerPlayerCard(c) {
	var $b = $(".GameBox .game-body");
	if (!c || !$b.hasClass("player-scroll")) return;
	var b = $b[0];
	var br = b.getBoundingClientRect(), cr = c.getBoundingClientRect();
	var horizontal = !mobile && !$b.hasClass("cw");
	var prop = horizontal ? "scrollLeft" : "scrollTop";
	var max = horizontal ? b.scrollWidth - b.clientWidth : b.scrollHeight - b.clientHeight;
	// 화면 좌표 차이 → 스크롤 단위 (신 UI는 게임 화면을 확대하므로 배율로 나눔, 기본 UI는 1)
	var delta = (horizontal
		? (cr.left + cr.width / 2) - (br.left + br.width / 2)
		: (cr.top + cr.height / 2) - (br.top + br.height / 2)) / NK.gameZoom;
	var to = Math.max(0, Math.min(max, b[prop] + delta));
	var anim = {};
	anim[prop] = to;
	$b.stop(true).animate(anim, 200);
}
// 턴제 규칙: 현재 차례 카드를 중앙으로 (game-user-current 클래스는 규칙 파일마다 따로 붙이므로 MutationObserver로 한 곳에서 감지)
function scrollToCurrentPlayer() {
	var $b = $(".GameBox .game-body");
	if (!$b.hasClass("player-scroll") || !isTurnBasedRule()) return;
	var c = $b.find(".game-user-current")[0];
	if (c === $data._psLastCurrent) return; // 같은 카드에 대한 클래스 변경(점수 등)으로는 다시 스크롤하지 않음
	$data._psLastCurrent = c;
	centerPlayerCard(c);
}
// 턴제가 아닌 규칙(및 첫 렌더 직후): 내 카드를 중앙으로
function scrollToMyPlayer() {
	centerPlayerCard(document.getElementById("game-user-" + $data.id));
}
function bindPlayerScrollWatcher(el) {
	if (!el || $data._psObserved === el) return;
	if ($data._psObserver) $data._psObserver.disconnect();
	$data._psObserved = el;
	if (window.MutationObserver) {
		$data._psObserver = new MutationObserver(scrollToCurrentPlayer);
		$data._psObserver.observe(el, { attributes: true, attributeFilter: ['class'], subtree: true });
	}
	// 데스크톱 가로 스크롤: 마우스 휠(세로)을 가로 스크롤로 변환
	$(el).on('wheel', function (e) {
		var oe = e.originalEvent;
		if (mobile || !$(this).hasClass("player-scroll") || $(this).hasClass("cw")) return;
		if (!oe.deltaY || oe.deltaX || this.scrollWidth <= this.clientWidth) return;
		$(this).stop(true); // 진행 중인 중앙 정렬 애니메이션 중단
		this.scrollLeft += oe.deltaY;
		e.preventDefault();
	});
}
// 말풍선 기준 위치가 스크롤로 컨테이너 밖에 있는 카드면, 스크롤 방향 축으로만 컨테이너 안으로 끌어당김
function clampPlayerScrollOffset(offset, $card) {
	var $gb = $(".GameBox .game-body"), go = $gb.offset();
	if (!go || !$card.length) return offset;
	var r = { top: offset.top, left: offset.left };
	var z = NK.gameZoom; // offset()은 확대된 값, 폭·높이는 확대 전 값 (기본 UI는 1)
	if (!mobile && !$gb.hasClass("cw")) {
		r.left = Math.max(go.left, Math.min(r.left, go.left + ($gb.innerWidth() - $card.outerWidth()) * z));
	} else {
		r.top = Math.max(go.top, Math.min(r.top, go.top + ($gb.innerHeight() - $card.outerHeight()) * z));
	}
	return r;
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
	// 플레이어 스크롤 옵션: 켜져 있으면 인원수와 무관하게 기본(~8명) 카드 UI를 유지하고 넘치면 스크롤
	var _ps = isPlayerScroll();

	setRoomHead($(".RoomBox .product-title"), $data.room);
	setRoomHead($(".GameBox .product-title"), $data.room);
	if (NK.active) NK.renderRoomHead($data.room);



	if (gaming) {
		$r = $(".GameBox .game-body").empty();
		bindPlayerScrollWatcher($r[0]);
		$data._psLastCurrent = undefined;
		// Apply appropriate CSS class based on mode and player count
		if (rule.big) {
			$(".jjoriping,.rounds,.game-body").addClass("cw");
			$r.toggleClass("player-scroll", _ps);
			$r.removeClass("small-mode"); // small-mode는 모레미 카드 전용 클래스라 큰 보드 모드에서는 절대 쓰지 않음(이름만 목록과 이름 충돌 방지)
			// 큰 보드 모드(이름만 목록)도 13명부터 2열이 되어 실제 줄 수가 늘어나므로,
			// 그 줄 수(인원수/2 올림)가 9줄 이상(=17명↑)이면 더 촘촘한 행 스타일(cw-dense)을 쓴다
			var _seqLenCw = $data.room.game.seq.length;
			var _effectiveRowsCw = (_seqLenCw >= 13) ? Math.ceil(_seqLenCw / 2) : _seqLenCw;
			if (_effectiveRowsCw >= 9 && !_ps) {
				$r.addClass("cw-dense");
			} else {
				$r.removeClass("cw-dense");
			}
		} else {
			$(".jjoriping,.rounds,.game-body").removeClass("cw");
			$r.removeClass("cw-dense");
			$r.toggleClass("player-scroll", _ps);
			var _seqLen = $data.room.game.seq.length;
			// 모바일: 13명부터 2열이 되며, 13~20명은 지금 16명 이하가 쓰는(일반) 패널 크기를 그대로 쓰고
			// 21명부터만 축소된 small-mode 패널을 쓴다. 13명 미만은 기존과 동일하게 9명부터 small-mode.
			// 데스크톱(모레미 카드): 기존과 동일하게 9명부터 small-mode.
			var _useSmall = !_ps && ((mobile && _seqLen >= 13) ? (_seqLen >= 21) : (_seqLen >= 9));
			if (_useSmall) {
				$r.addClass("small-mode");
			} else {
				$r.removeClass("small-mode");
			}
			// 데스크톱 모레미 카드(일반 게임모드, 모바일 제외): 14명까지는 1줄로 들어가는 현재
			// small-mode 카드를 쓰고, 15명부터는 2줄 전용으로 촘촘하게 재배치한 카드를 씀.
			// 카드 폭은 항상 24명(12+12) 기준으로 고정(CSS). 위/아래 줄 인원이 균등하도록(홀수면 위쪽에
			// 1명 더) 위쪽 줄 인원수만 --moremi-top으로 넘기면 CSS가 컨테이너 좌우 여백으로 줄바꿈 지점을 맞춘다.
			if (!mobile && _seqLen >= 15 && !_ps) {
				$r.addClass("moremi-dense");
				var _topCount = Math.ceil(_seqLen / 2);
				// jQuery .css()는 버전에 따라 커스텀 프로퍼티(--변수)를 제대로 못 다룰 수 있어 DOM API로 직접 설정
				if ($r[0]) $r[0].style.setProperty('--moremi-top', _topCount);
			} else {
				$r.removeClass("moremi-dense");
				if ($r[0]) $r[0].style.removeProperty('--moremi-top');
			}
		}
		// 이름만 나오는 목록(모바일 및 큰 보드 모드) 13명부터 2열 표시 — cw/small-mode와 무관하게 인원수만으로 토글
		if ($data.room.game.seq.length >= 13 && !_ps) {
			$(".game-body").addClass("name-2col");
		} else {
			$(".game-body").removeClass("name-2col");
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
		if (_ps) scrollToMyPlayer();
		clearTimeout($data._jamsu);
		delete $data._jamsu;
	} else {
		$r = $(".room-users").empty();
		$r.removeClass("small-mode size-5col size-6col size-6col-4row");
		if (_ps) { /* 플레이어 스크롤: 기본 카드 크기 유지 */ }
		else if ($data.room.players.length >= 19) $r.addClass("size-6col-4row");
		else if ($data.room.players.length >= 16) $r.addClass("size-6col");
		else if ($data.room.players.length >= 13) $r.addClass("size-5col");
		else if ($data.room.players.length >= 9) $r.addClass("small-mode");
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
		if (NK.active) NK.afterRoomUsers();
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
	var i, d, m, sc, lead, neg;

	// 카오스 플러스 점수 가리기: 모든 점수(서바이벌은 체력)를 ?????로
	if ($data._chaosHideScore) {
		$obj.empty().removeClass("nk-neg");
		for (i = 0; i < 5; i++) $obj.append($("<div>").addClass("game-user-score-char").html("?"));
		return;
	}

	if (Math.round(score * 0.001) > 9999) {
		// 10000k부터는 지수 표기, 다섯 칸에 맞게 소수 자리를 줄임: 1.23e7 → 1.2e10 → 1e100
		// 칸에는 "123e7"처럼 점 없이, 점은 첫째·둘째 칸 사이에 칸 없이 얹음
		// 반올림으로 지수가 올라가면(9.96e99 → 1.0e100) 한 자리 줄여 다시 계산
		for (d = 2; ; d--) {
			m = score.toExponential(d).split('e');
			if (+m[1] < [Infinity, 100, 10][d]) break;
		}
		sc = m[0].replace('.', '') + 'e' + (+m[1]);
	} else sc = (score > 99999) ? (zeroPadding(Math.round(score * 0.001), 4) + 'k') : zeroPadding(score, 5);

	// 앞자리 0 (신 UI가 흐리게 표시, 마지막 자리는 0이어도 제외). 마이너스 점수는 '-' 뒤의 0들 — 신 UI는 마이너스 점수를 빨갛게(nk-neg)
	neg = sc.charAt(0) === '-';
	lead = neg ? 1 : 0;
	while (lead < sc.length - 1 && sc.charAt(lead) === '0') lead++;

	$obj.empty().toggleClass("nk-neg", neg);
	for (i = 0; i < sc.length; i++) {
		$obj.append($("<div>").addClass("game-user-score-char" + (i < lead && sc[i] === '0' ? " nk-z" : "")).html(sc[i]));
		if (i === 0 && d) $obj.append($("<div>").addClass("game-user-score-dot").html("."));
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

	// 게임 중 나가기는 clearBoard()를 거치지 않으므로, 모드 전용 클래스가 다음 게임(다른 모드)까지
	// 남아 화면이 깨지지 않도록 여기서도 방어적으로 정리 (clearBoard()의 해당 줄들과 동일)
	$(".jjoriping,.game-body").removeClass("flip");
	$(".jjoriping,.rounds,.game-body").removeClass("landgrab");
	$(".jjoriping,.game-body").removeClass("center-board");
	$(".jjoriping,.rounds,.game-body").removeClass("wordcollect wc-round-active");
	if ($lib.Rhythm) $lib.Rhythm.cleanup();
	if ($lib.Rtype) $lib.Rtype.cleanup();
	if ($data._wcNight) {
		$data._wcNight.remove();
		$data._wcNight = null;
	}

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
	if (NK.active) NK.prepareBoard();
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
	if (NK.active) NK.setReplay(true);
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
	if (NK.active) NK.setReplay(false);
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
	$data._sel = null;
	$data._sdk = null;
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
	$(".jjoriping,.rounds,.game-body").removeClass("landgrab");
	$(".jjoriping,.game-body").removeClass("center-board");
	$(".jjoriping,.rounds,.game-body").removeClass("wordcollect wc-round-active");
	if ($lib.Rhythm) $lib.Rhythm.cleanup();
	if ($lib.Rtype) $lib.Rtype.cleanup();
	if ($data._wcNight) {
		$data._wcNight.remove();
		$data._wcNight = null;
	}
	$(".jjoriping").css({ "float": "", "margin": "" });
	// Small-mode class is managed by updateRoom() based on player count, don't remove it here
	$stage.game.display.removeClass("raingame-board").css({ 'white-space': '', 'font-size': '' }).empty();
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
	var total = $data.room.round;
	var isTwoRow = mobile && total > 10;
	var topCount = isTwoRow ? Math.ceil(total / 2) : total;

	$stage.game.round.toggleClass("rounds-2row", isTwoRow);
	$stage.game.round.empty();
	for (i = 0; i < total; i++) {
		if (i == topCount) $stage.game.round.append($("<br>"));
		$stage.game.round.append($l = $("<label>").html($data.room.game.title[i]));
		if ((i + 1) == round) $l.addClass("rounds-current");
	}
	if (NK.active) NK.renderGameHead(round);
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
	if (code === 411 && NK.active) NK.pulseHistory(text);
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
			// 늦게 도착한 'user' 이벤트가 game.score를 undefined로 덮어쓴 경우 NaN 방지
			if (typeof u.game.score !== 'number' || isNaN(u.game.score)) u.game.score = 0;
			u.game.score += score;
		}
	}
}
function drawObtainedScore($uc, $sc) {
	// 카오스 플러스 점수 가리기: 얻은 점수·데미지는 +? / -?로 (숫자로 시작하는 표시만)
	if ($data._chaosHideScore) {
		var _t = $sc.text();
		if (/^\s*[+-]?\d/.test(_t)) $sc.text((/^\s*-/.test(_t) ? "-" : "+") + "?");
	}
	$uc.append($sc);
	addTimeout(function () { $sc.remove(); }, 2000);

	return $uc;
}

// ========== 카오스 플러스 시각 효과 (점수 가리기 / 차례 숨기기) ==========
// 점수 가리기를 켜고 끌 때 모든 카드의 점수를 다시 그림 (KO 카드는 그대로)
function setChaosHideScore(on) {
	var seq = $data.room && $data.room.game && $data.room.game.seq;

	$data._chaosHideScore = on;
	if (!seq) return;
	seq.forEach(function (t) {
		var id = (t && t.id) ? t.id : t;
		var u = $data.users[id] || $data.robots[id];
		var o = $data["_s" + id];

		if ($("#game-user-" + id).hasClass("game-user-ko")) return;
		if (o) drawScore(o.$obj, Math.round(o.now));
		else if (u && u.game && typeof u.game.score === 'number') drawScore($("#game-user-" + id + " .game-user-score"), u.game.score);
	});
}
// 차례 숨기기: 규칙의 turnStart가 붙인 차례 강조를 표시 없는 chaos-cur로 바꾸고, 입력창을 남의 차례 모양으로
// (데스크톱은 입력창 숨김 — 채팅칸으로 그대로 제출, 신 UI는 남의 차례와 같은 흐린 칸. 휴대폰은 늘 반투명)
function chaosHideCurrentTurn() {
	$(".game-user-current").removeClass("game-user-current").addClass("chaos-cur").css('border-color', '');
	if ($data._replay) return;
	mobile ? $stage.game.here.css('opacity', 0.5).show() : $stage.game.here.hide();
}
function chaosRestoreCurrentTurn() {
	$(".chaos-cur").removeClass("chaos-cur").addClass("game-user-current");
}
// 라운드가 바뀌거나 게임이 끝나면 서버 상태와 함께 초기화
function chaosResetVisual() {
	$(".chaos-cur").removeClass("chaos-cur");
	$data._chaosHideTurn = false;
	if ($data._chaosHideScore) setChaosHideScore(false);
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
	if (NK.active) NK.holdGameLayout();
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

		$(".result-me-level-body").html(getLevelText($data._result.level));
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
	var kanaReading = getKanaReadingText(char);

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

	var res = char + (displaySubChar ? ("(" + displaySubChar + ")") : "") + kanaReading;

	if (wordLength) res += "<label class='jjo-display-word-length'>(" + wordLength + ")</label>";

	return res;
}
// 가나 발음 보기($data.opts.kr): 클래식 일본어 모드(JSH/JAP/JKT)의 이을 가나 뒤에 발음을 쿵쿵따 글자수 표시와 같은 모양으로 붙임.
// 한국어/냥냥 화면은 한글 발음(あ(아)), 그 밖의 언어(영어/일본어 등)는 헵번식 로마자(あ(a))
var KANA_HANGUL = {
	'あ': '아', 'い': '이', 'う': '우', 'え': '에', 'お': '오',
	'か': '카', 'き': '키', 'く': '쿠', 'け': '케', 'こ': '코',
	'が': '가', 'ぎ': '기', 'ぐ': '구', 'げ': '게', 'ご': '고',
	'さ': '사', 'し': '시', 'す': '스', 'せ': '세', 'そ': '소',
	'ざ': '자', 'じ': '지', 'ず': '즈', 'ぜ': '제', 'ぞ': '조',
	'た': '타', 'ち': '치', 'つ': '츠', 'て': '테', 'と': '토',
	'だ': '다', 'ぢ': '지', 'づ': '즈', 'で': '데', 'ど': '도',
	'な': '나', 'に': '니', 'ぬ': '누', 'ね': '네', 'の': '노',
	'は': '하', 'ひ': '히', 'ふ': '후', 'へ': '헤', 'ほ': '호',
	'ば': '바', 'び': '비', 'ぶ': '부', 'べ': '베', 'ぼ': '보',
	'ぱ': '파', 'ぴ': '피', 'ぷ': '푸', 'ぺ': '페', 'ぽ': '포',
	'ま': '마', 'み': '미', 'む': '무', 'め': '메', 'も': '모',
	'や': '야', 'ゆ': '유', 'よ': '요',
	'ら': '라', 'り': '리', 'る': '루', 'れ': '레', 'ろ': '로',
	'わ': '와', 'ゐ': '이', 'ゑ': '에', 'を': '오', 'ん': '응', 'ゔ': '부'
};
var KANA_ROMAJI = {
	'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
	'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
	'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
	'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
	'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
	'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
	'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
	'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
	'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
	'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
	'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
	'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
	'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
	'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
	'わ': 'wa', 'ゐ': 'i', 'ゑ': 'e', 'を': 'o', 'ん': 'n', 'ゔ': 'vu'
};
function getKanaReadingText(char) {
	if (($data.opts && $data.opts.kr === false) || !$data.room) return "";
	var rule = RULE[MODE[$data.room.mode]];
	if (!rule || rule.rule !== "Classic" || rule.lang !== "ja") return "";
	var lang = localStorage.getItem('kkutu_lang') || 'ko_KR';
	var reading = (lang === 'ko_KR' || lang === 'nya') ? KANA_HANGUL[char] : KANA_ROMAJI[char];
	return reading ? "<label class='jjo-display-word-length'>(" + reading + ")</label>" : "";
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
function getLevelText(lv) {
	return lv > STAR_LEVEL ? "s" + (lv - STAR_LEVEL) : lv;
}
function getLevelImage(score) {
	var lv = getLevel(score) - 1;
	if (lv >= STAR_LEVEL) lv += 15; // 별렙 아이콘은 레벨 팩 16번째 줄(375번 칸)부터
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
	// 곡 선택: 고른 곡 이름은 곡 선택 창(#songpick-list)의 이름표에서 가져옴 (무작위면 표시 안 함)
	if (rule && rule.opts.indexOf("spk") != -1 && opts.songpick) {
		var $song = $("#songpick-list input").filter(function () { return this.value === opts.songpick; });
		if ($song.length) topics.push($song.next("label").find(".song-title").text());
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
	// 신 UI 방 화면: 옆이 아니라 캐릭터 위에 띄움 (게임 화면과 같은 아래 꼬리 모양)
	var nkUp = NK.active && !(flag & 2);
	var img = (flag == 2 || nkUp) ? "chat-balloon-bot" : "chat-balloon-tip";
	var $obj = $("<div>").addClass("chat-balloon");
	var targetWidth = 0, nkFit = false;
	if ((flag & 2) && $data.room && $data.room.game && $data.room.game.seq && $data.room.game.seq.length > 8 && !isPlayerScroll()) {
		$obj.addClass("small-balloon");
		var $target = $("#game-user-" + id);
		if ($target.length) targetWidth = $target.width();
	} else if ((flag & 2) && NK.active && !NK.phone) {
		// 신 UI 데스크톱 게임 화면: 말풍선 폭 = 카드 폭 (말풍선 글자가 커서 기존 폭은 줄이 많고, 좁은 카드에서는 옆 말풍선과 겹침)
		targetWidth = $("#game-user-" + id).outerWidth() || 0;
		nkFit = true;
	}
	$obj.attr('id', "cb-" + id)
		.append($("<div>").addClass("jt-image " + img))
	[(flag == 2 || nkUp) ? 'prepend' : 'append']($("<h4>").text(text));
	var ot, ol;

	if (!offset) return;
	if ((flag & 2) && isPlayerScroll()) offset = clampPlayerScrollOffset(offset, $("#game-user-" + id));
	$stage.balloons.append($obj);
	// 높이(ot)를 재기 전에 폭부터 맞춤 — 폭이 줄면 줄 수가 늘어남
	if (nkFit && targetWidth) $obj.width(targetWidth);
	if (flag == 1) ot = 0, ol = 220;
	else if (flag == 2) ot = 35 - $obj.height(), ol = -2;
	else if (flag == 3) ot = 5, ol = 210;
	else ot = 40, ol = 110;
	if (nkUp) {
		var $img = $("#room-user-" + id + " .room-user-image");
		if ($img.length) {
			offset = $img.offset();
			ot = 8 - $obj.height();
			// 말풍선 폭은 CSS가 정함 (데스크톱 신 UI 160px, 그 밖 123px)
			ol = ($img.outerWidth() - $obj.outerWidth()) / 2;
		}
	}

	if (targetWidth) {
		$obj.width(targetWidth);
		// Adjust left offset explicitly to align because width changed? 
		// Original 'ol = -2' relies on 123px width centering or overflow. 
		// If width matches card, left should be offset.left (ol=0).
		ol = 0;
	}

	// offset()은 화면 값, 말풍선의 위치는 CSS 값 → UI 배율로 나눔 (기본 UI는 1)
	$obj.css({ top: offset.top / NK.gameZoom + ot, left: offset.left / NK.gameZoom + ol });
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

	/* 색 — 신 UI 보조 색 계산은 /js/nk-boot.js (번들보다 먼저 <head>에서 실행, 로딩 화면부터 색이 맞게) */

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
	// UI 배율(데스크톱 신 UI는 body에 zoom): 화면 좌표(getBoundingClientRect·마우스·창 크기)는 확대된 값, CSS로 주는 위치·크기는 확대 전 값이라
	// 배율(my.gameZoom — 기존 코드도 같은 값으로 나눔, 기본 UI·휴대폰은 1)로 나눠서 씀
	function crect(el) {
		var r = el.getBoundingClientRect(), z = my.gameZoom;

		return { left: r.left / z, top: r.top / z, right: r.right / z, bottom: r.bottom / z, width: r.width / z, height: r.height / z };
	}
	function winW() { return innerWidth / my.gameZoom; }
	function winH() { return innerHeight / my.gameZoom; }
	function tip($el, content) { return $el.attr('data-nk-tip', "").data('nkTip', content); }
	// 고른 주제·퀴즈 주제·곡 — 곡 선택 모드(spk)는 "선택된 곡"으로, 고르지 않았으면 "무작위" (사용자 요청)
	function pickInfo(room) {
		var rule = RULE[MODE[room.mode]], song = rule.opts.indexOf("spk") != -1, list = getPickTopicExpl(rule, room.opts);

		return { title: song ? text('nkSong') : L['pickTopicTitle'], list: song && !list.length ? [L['songRandom']] : list };
	}
	function tipMove(e) {
		if (!$tip) return;
		$tip.css({
			left: Math.min(e.clientX / my.gameZoom + 5, winW() - $tip.outerWidth() - 12),
			top: Math.min(e.clientY / my.gameZoom + 23, winH() - $tip.outerHeight() - 12)
		});
	}
	function tipFill(c) {
		$tip = $tip || $("<div>").addClass("nk-tip").appendTo("body");
		$tip.empty();
		if (c.title) $tip.append($("<div>").addClass("nk-tip-title").text(c.title));
		$tip.append($("<div>").addClass("nk-tip-body").toggleClass("nk-col", !!c.col).append((c.lines || c).map(function (l) { return $("<div>").text(l); })));
		// 고른 주제(게임 화면 상단 바): 규칙 아래에 제목과 함께 한 묶음 더
		if (c.topics && c.topics.length) $tip.append($("<div>").addClass("nk-tip-title").text(c.topicsTitle || L['pickTopicTitle']))
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
		r = crect(el);
		w = $tip.outerWidth();
		h = $tip.outerHeight();
		top = r.bottom + 6;
		if (top + h > winH() - 8) top = Math.max(8, r.top - h - 6);
		$tip.css({ left: clamp(r.left, 8, winW() - w - 8), top: top });
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
		r = crect(anchor);
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
				.append($("<div>").text(L['LEVEL'] + " " + getLevelText(lv)))
				.append($("<div>").addClass("nk-mini-bar").append($("<div>").css('width', pct + "%")))
				.append($("<div>").text(commify(me.money) + L['ping'])))
		).append(ico('chev'));
	};
	function accountHead() {
		var me = $data.users && $data.users[$data.id];

		if (!me) return null;
		return $("<div>").addClass("nk-pop-head").append($("#nk-account .nk-account-text").clone());
	}
	// 오끄감 버프 (기본 UI는 내 정보 칸에 막대·시간): 쌓인 버프 수/18, 다음 버프까지(10분마다) 막대, 오늘 플레이 시간
	function okgNode() {
		var t = $data._playTime || 0;

		return $("<div>").addClass("nk-okg")
			.append($("<div>").addClass("nk-okg-top")
				.append($("<div>").addClass("nk-okg-k").attr('data-lang-key', 'nkOkg').text(text('nkOkg')))
				.append($("<div>").addClass("nk-okg-n").text(($data._okg || 0) + "/18"))
				.append($("<div>").addClass("nk-okg-t").text(prettyTime(t))))
			.append($("<div>").addClass("nk-mini-bar").append($("<div>").css('width', (t % 600000) / 6000 + "%")));
	}
	function openAccount(anchor) {
		var head = my.phone && accountHead();

		if (my._pop) return closePop();
		openPop(anchor, (head ? [{ node: head }] : []).concat([{ node: okgNode() }, { sep: true }]).concat([
			{ icon: 'user', labelKey: 'nkMyProfile', run: function () { requestProfile($data.id); } },
			{ icon: 'shirt', labelKey: 'dress', disabled: $data._gaming, run: function () { $stage.dialog.profileDress.trigger('click'); } },
			{ icon: 'heart', labelKey: 'nkFriends', run: function () { $stage.menu.community.trigger('click'); } },
			{ sep: true },
			{ icon: 'sliders', labelKey: 'nkSettings', run: function () { $stage.menu.setting.trigger('click'); } },
			{ icon: 'layout', labelKey: 'nkToClassic', run: function () { saveVolumeSettings({ ui: 'classic' }); reloadWithUI('classic'); } },
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
	   항목 id(li#c4p57 → div.page-body#box-c4p57)는 help.pug에 직접 적힌 것을 그대로 씀 (기존 도움말 스크립트와 같음). 스크립트는 실행하지 않음(DOMParser)
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
		var pick = pickInfo(o), pickTopics = pick.list;
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
		if (opts.length > 1 || pickTopics.length) tip($rules, { title: opts[0], lines: opts.slice(1), topics: pickTopics, topicsTitle: pick.title });
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
		var pick = pickInfo(room);
		var ri = roundInfo(room);
		var $h = $("#nk-roomhead").empty(), $rules, $meta, keys = [], i;

		if (!$h.length) return;
		// 켜진 규칙의 이름 — getOptions와 같은 순서라 opts[1..]과 짝이 맞음
		for (i in OPTIONS) if (room.opts[OPTIONS[i].name.toLowerCase()]) keys.push(OPTIONS[i].name);
		// 방 번호·제목은 동작 줄(데스크톱)·상단 바(휴대폰)에 있고, 여기는 방 정보 글자만 (사용자 결정, 정리안 — 칩 대신 글자).
		// 모드·규칙 이름마다 마우스를 올리면(휴대폰은 누르면) 설명 (사용자 요청)
		$h.append($rules = $("<div>").addClass("nk-rh-rules room-head-mode").append(explTip($("<b>"), opts[0], L['modex' + room.mode])))
			.append($meta = $("<div>").addClass("nk-rh-meta"));
		opts.slice(1).forEach(function (c, j) {
			$rules.append(document.createTextNode(" · ")).append(explTip($("<label>").addClass("nk-rh-rule"), c, L['expl' + keys[j]]));
		});
		meta(L['players'] + " " + room.players.length + "/" + room.limit, "room-head-limit");
		meta(ri.text, "room-head-round");
		meta((Math.round(room.time * 10) / 10) + L['SECOND'], "room-head-time");
		if (pick.list.length) meta(pick.title + " " + pick.list.join(", "), "room-head-pick");

		renderActRoom();
		my.renderGameHead();

		function meta(txt, cls) {
			$meta.append($("<div>").addClass(cls).text(txt));
		}
		function explTip($e, name, expl) {
			$e.text(name);
			return expl ? tip($e, { title: name, col: true, lines: expl.split(/<br\s*\/?>/i).map(function (l) { return $("<div>").html(l).text(); }) }) : $e;
		}
	};

	/* ------------------------------------------------------------------
	   게임 화면 — 게임 중에는 상단 바 한 줄에 방 정보·나가기·아이템 (A안).
	   게임 화면은 H안(nk.css 17)으로 기존 DOM을 다시 배치하며 게임 화면만 따로 확대하지 않음 → NK.gameZoom은 UI 배율(applyScale, 기본 1)
	   (화면 좌표를 섞어 쓰는 기존 코드가 NK.gameZoom으로 나눔)
	   ------------------------------------------------------------------ */
	my.gameZoom = 1;
	// 상단 바의 방 정보: 번호 · 제목 · 모드 · 현재/전체 라운드 · 시간. updateRoom(renderRoomHead)과 drawRound(라운드 바뀔 때)에서 갱신
	my.renderGameHead = function (round) {
		var room = $data.room;
		var opts, pick, ri, rtext, $sub;

		if (round !== undefined) my._round = round;
		if (!room) return;
		// 시작 글자가 없는 모드의 라운드 칩(서버가 ①②③…을 보냄)은 그냥 숫자로 (사용자 요청)
		if (round !== undefined) $stage.game.round.children("label").each(function () {
			var c = this.textContent.charCodeAt(0);

			if (this.textContent.length === 1 && c >= 0x2460 && c <= 0x2473) this.textContent = c - 0x245F;
		});
		opts = getOptions(room.mode, room.opts, false, false);
		pick = pickInfo(room);
		ri = roundInfo(room);
		// 라운드제는 "현재/전체" (생존 HP·협동 목표는 기존 표시 그대로)
		rtext = (ri.icon === 'rounds' && room.coopTarget === undefined && my._round) ? my._round + "/" + ri.text : ri.text;
		// 지금 게임 규칙 이름 — 모드별 배치·모양(nk.css 18)이 씀
		root.setAttribute('data-nk-rule', RULE[MODE[room.mode]].rule);
		// 게임 화면 미션·체인 칸 이름표 (nk.css 17이 data-k를 보여 줌). 리듬 타이퍼의 체인 칸은 내 콤보 (사용자 결정)
		$stage.game.items.attr('data-k', L['optMission']);
		$stage.game.hints.attr('data-k', L['nkHint']);
		$stage.game.chain.attr('data-k', L[RULE[MODE[room.mode]].rule === 'Rtype' ? 'nkCombo' : 'chainCount']);
		$sub = $("<div>").addClass("nk-gamehead-sub").text([opts[0], rtext, (Math.round(room.time * 10) / 10) + L['SECOND']].join(" · "));
		// 휴대폰은 말풍선 대신 상단 바를 누르면 방 정보 시트 (buildGameSheet)
		if (!my.phone && (opts.length > 1 || pick.list.length)) tip($sub, { title: opts[0], lines: opts.slice(1), topics: pick.list, topicsTitle: pick.title });
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
	// 게임 판이 게임 칸보다 커서 아래(채팅)로 넘치는지
	function gameOverflow() {
		var gb = $stage.box.game[0], pb = gb && gb.querySelector(".product-body");

		return !!pb && pb.offsetHeight > gb.clientHeight + 1;
	}
	function fitGame() {
		var area = document.getElementById("nk-center-body"), app = document.getElementById("nk-app");

		if (!area) return;
		fitGameZoom();
		area.style.removeProperty('--nk-gz');
		app.style.removeProperty('--nk-gw');
		app.style.removeProperty('--nk-cz');
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
		// 겉보기 폭(양옆 여백 뺀 글자 칸)·높이는 배율을 바꿔도 같음 (nk.css가 여백·높이를 배율만큼 되돌림)
		wv = (d.clientWidth - pw) * z0;
		// 타자 대결(단어 다섯 개): 단어마다 크기가 바뀌지 않게 "5글자 단어 5개"가 들어가는 크기로 고정, 그보다 긴 줄만 더 줄임 (사용자 요청)
		if (RULE[MODE[$data.room.mode]].rule === 'Typing' && !$data.room.opts.proverb && !$data.long) {
			z = Math.min(z0, wv / textWidth(Array(6).join((MODE[$data.room.mode] === 'ETT' ? "abcde" : "가나다라마") + " ").trim(), cs), wv / (sw - pw));
			d.style.setProperty('--nk-dz', Math.floor(z * 100) / 100);
			return;
		}
		if (sw <= d.clientWidth + 1) return;
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
	var SQUARE_BOARD = /^(Crossword|Sudoku)$/;
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
		dv = crect(d).height;
		rows = getComputedStyle(pb).gridTemplateRows.split(" ").reduce(function (a, v) { return a + (parseFloat(v) || 0); }, 0);
		other = rows - dv;
		if (root.getAttribute('data-nk-rule') === 'Picture') return fitPicture(d, jj, pb, cb, other);
		// 휴대폰: 폭에 맞추고, 높이가 모자라면 세로로만 줄임(직사각형) — 떠 있는 입력창 모드는 채팅 몫(140px)을 남김.
		// 십자말·스도쿠는 정사각형을 지킴(폭과 높이 중 작은 쪽에 맞춤), 채팅 몫은 입력줄까지 180px (사용자 결정, M8)
		if (my.phone) {
			w = jj.clientWidth - 16;
			if (SQUARE_BOARD.test(root.getAttribute('data-nk-rule'))) {
				h = $(".nk-main")[0].clientHeight - 192 - other - (cb.offsetHeight - pb.offsetHeight) - 12;
				jj.style.setProperty('--nk-bz', (Math.max(140, Math.min(w, h, 760)) / 308).toFixed(4));
				jj.style.removeProperty('--nk-bh');
				return placeBubble();
			}
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
			extra = crect(d).height - crect(cv).height;
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
		r = crect(sel);
		pr = crect(pb);
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
		left = Math.max(10, 10 - pr.left, Math.min(pr.width - bw - 10, winW() - pr.left - bw - 10, r.left + r.width / 2 - pr.left - bw / 2));
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
	// 십자말풀이: 맞힌 개수 + 지금 고른 단어의 [번호 · 방향 · 글자 수 · 뜻풀이] — 데스크톱은 뜻풀이를 여기서 보고 말풍선은 입력칸만 (사용자 결정, 단어 목록은 뺌).
	//   번호는 시작 칸을 읽는 순서(위 → 아래, 왼쪽 → 오른쪽)로 매기고 판의 첫 칸에도 붙임(data-n)
	// 스도쿠: 남은 칸 · 내가 채운 칸 · 틀린 횟수. 남이 채운 칸은 주어진 칸과 구별되게 nk-other
	function renderCwSide() {
		var $s = my.$cwside, rule = $data.room && RULE[MODE[$data.room.mode]], sel = $data._sel, open = $stage.game.cwcmd.css('opacity') !== "0",
			b, nums = {}, starts, done = 0, left = 0, mine = 0, known = {}, cur, m;

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
			// 겹치는 칸: 고른 막대를 맨 위로 올리므로(nk.css) 맞힌 단어의 글자를 아래에 깔린 다른 막대의 같은 칸에도 채움 — 기존 코드는 먼저 그린 막대 글자만 나중 막대에 채움
			b.forEach(function (w) {
				var x = Number(w[0]), y = Number(w[1]), j;

				if (w[4]) for (j = 0; j < w[3]; j++) known[(w[2] == "1" ? x + "-" + (y + j) : (x + j) + "-" + y)] = [w[4].charAt(j), w[5] == $data.id];
			});
			$stage.game.display.find(".cw-bar:not(.cw-open) .cw-cell").each(function () {
				var k = known[this.id.slice(4)];

				if (k && !this.textContent) this.textContent = k[0];
				this.classList.toggle("nk-known", !!k && !k[1]);
				this.classList.toggle("nk-known-mine", !!k && k[1]);
			});
			b.forEach(function (w) {
				var on = !!(open && sel && sel.length === 4 && sel[1] == w[0] && sel[2] == w[1] && sel[3] == w[2]);

				if (w[4]) done++;
				$("#cw-" + w[0] + "-" + w[1] + "-" + w[2]).toggleClass("nk-sel", on).children(".cw-cell").first().attr('data-n', nums[[Number(w[0]), Number(w[1])]]);
				if (on) cur = w;
			});
			$s.append($("<div>").addClass("nk-cwside-head").text(L['nkCwMean']).append($("<label>").text(done + " / " + b.length + " " + L['nkCwSolved'])));
			m = cur && ($data._means[$data.selectedRound - 1] || {})[[cur[0], cur[1], cur[2]].join(',')];
			if (m) $s.append($("<div>").addClass("nk-cw-cur")
				.append($("<div>").addClass("nk-cw-no").text(nums[[Number(cur[0]), Number(cur[1])]]))
				.append($("<div>").addClass("nk-cw-dir").text(L[cur[2] == "1" ? 'cwVert' : 'cwHorz'] + cur[3] + L['cwL'])),
				$("<div>").addClass("nk-cw-mean").append(processWord("★", m.mean, m.theme, m.type.split(','))));
			else $s.append($("<div>").addClass("nk-cw-pick").text(L['nkCwPick']));
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
	// 게임 시작 ~ 첫 라운드 사이(잠시 후 게임이 시작됩니다!)에도 판 틀을 미리 그려 둠 — 첫 라운드에 라운드 칩·체인 칸이 생기며
	// 판이 밀리지 않게 (사용자 요청). 각 모드의 roundReady가 그리는 것만: 라운드 칩은 리듬류 빼고 모두, 체인 칸은 아래 모드 (rule_*.js)
	var ROUND_RULES = /^(Rhythm|Rtype)$/, CHAIN_RULES = /^(Classic|Daneo|Free|Hunmin|Typing|Rtype|Numberclap|Calcbattle|Calcrelay|Chainbattle|Fourrelay)$/;
	my.prepareBoard = function () {
		var room = $data.room, rule = room && RULE[MODE[room.mode]].rule;

		if (!rule || !room.game || !room.game.title) return;
		if (!ROUND_RULES.test(rule)) drawRound(0);
		if (CHAIN_RULES.test(rule)) $stage.game.chain.show().html("");
	};
	// 리턴: 최근 다섯 단어와 겹친 단어(turnError 411)를 기록에서 빨갛게 깜빡임 (사용자 요청) — 휴대폰은 줄인 단어라 원래 단어(data-w)로 찾음
	my.pulseHistory = function (text) {
		var w = badWords(text);

		$stage.game.history.children(".history-item").each(function () {
			var t = this.getAttribute('data-w') || (this.firstChild && this.firstChild.nodeType === 3 ? this.firstChild.data : "");

			if (t !== w) return;
			this.classList.remove("nk-dup");
			void this.offsetWidth;
			this.classList.add("nk-dup");
		});
	};
	// 단어 창 글꼴(굵기·글꼴은 cs, 크기는 잴 때의 21px)로 쓴 글의 폭
	var measureCtx;
	function textWidth(text, cs) {
		measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
		measureCtx.font = cs.fontWeight + " 21px " + cs.fontFamily;
		return measureCtx.measureText(text).width;
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
	// 데스크톱 단어 창 모드의 위쪽 입력창을 쓰는 중인지 (네모 판·리듬 타이퍼는 자기 입력창을 씀)
	function topInputOn() {
		return !my.phone && my._only === 'for-gaming' && root.getAttribute('data-nk-rule') !== 'Rtype'
			&& !$stage.box.game.find(".game-body").hasClass("cw") && $stage.game.hereText.is(":visible");
	}
	// fromTalk: 게임 화면에 들어올 때는 방에서 쓰던 채팅칸의 포커스도 위 칸으로 옮김
	// 위 칸은 내 차례에만 보임(nk.css 33) — 내 차례가 끝나 위 칸이 숨으면 쓰던 포커스를 아래 채팅칸으로 넘김
	function focusTopInput(fromTalk) {
		var a = document.activeElement;

		if ((!a || a === document.body || (fromTalk === true && a === $stage.talk[0])) && topInputOn()) $stage.game.hereText.focus();
		else if (a === $stage.game.hereText[0] && !my.phone && !topInputOn()) $stage.talk.focus();
	}
	// H안 게임 화면 준비: 미션·체인 이름표, 시간 막대 글자(막대 끝 고정 · nk.css가 data-t를 보여 줌), 단어 창 글자 맞춤
	function initGameH() {
		var $d = $stage.game.display, gb = $stage.box.game.find(".game-body")[0];

		// 휴대폰 떠 있는 입력창 안내 글 (모드와 상관없이 기본 문구, 사용자 결정)
		$stage.game.hereText.attr('placeholder', L['inputHere']);
		// 데스크톱 리듬 타이퍼: 입력창 자리에 흐린 "채팅" 칸 (nk.css 22) ::after가 이 글자를 씀)
		$stage.box.game.children(".product-body").attr('data-nk-chat', text('Chat').replace(/FA\{[^}]*\}/g, ""));
		// 데스크톱 위쪽 입력창: 기존 코드는 데스크톱에서 아래 채팅칸에 포커스를 주고 위 칸은 비춰 보이기만 함 →
		// 신 UI는 위 칸에서 바로 입력 (남 차례에도 보임, nk.css 22) — 남 차례에 보낸 말은 서버가 채팅으로 처리, 휴대폰과 같음).
		// 코드가 부르는 $stage.talk.focus()만 위 칸으로 돌림 — 아래 채팅칸을 직접 누르면 그대로 아래에서 입력
		var talkFocus = $stage.talk.focus;
		$stage.talk.focus = function () {
			if (topInputOn()) {
				$stage.game.hereText.focus();
				return this;
			}
			return talkFocus.apply(this, arguments);
		};
		// 남 차례에도 위 칸에 포커스 — 기존 코드는 내 차례에만 포커스를 줌. 차례가 바뀔 때(입력창 style이 바뀜)·게임 화면에 들어올 때,
		// 아무 입력칸에도 포커스가 없을 때만 (아래 채팅칸·창 안 입력칸은 뺏지 않음)
		new MutationObserver(focusTopInput).observe($stage.game.here[0], { attributes: true, attributeFilter: ['style'] });
		// 위 칸·아래 채팅칸은 글을 서로 베껴 쓰는데(ready.js), 포커스 없는 쪽은 스크롤이 처음에 머물러 오른쪽으로 넘친 글이 안 보였음
		// → 베낀 쪽도 커서 위치(글자 순서 비율로 어림)가 보이게 스크롤 (사용자 요청)
		[[$stage.talk, $stage.game.hereText], [$stage.game.hereText, $stage.talk]].forEach(function (p) {
			p[0].on('input compositionend keyup', function () {
				var a = this, b = p[1][0];

				requestAnimationFrame(function () {
					var f = a.value.length ? a.selectionStart / a.value.length : 0, x = b.scrollWidth * f;

					if (!b.offsetWidth || b === document.activeElement) return;
					if (f >= 1) b.scrollLeft = b.scrollWidth;
					else if (x < b.scrollLeft + 16) b.scrollLeft = x - 16;
					else if (x > b.scrollLeft + b.clientWidth - 16) b.scrollLeft = x - b.clientWidth + 16;
				});
			});
		});

		[$stage.game.turnBar, $stage.game.roundBar].forEach(function ($b) {
			var g = $b.parent()[0], b = $b[0];

			new MutationObserver(function () {
				var t = b.textContent, w = b.style.width;

				// 채운 비율(--nk-gp)·막대 폭(--nk-gw): 막대 위 글자가 채움 끝을 따라가고, 채움 위·빈 칸 위에서 다른 색으로 (nk.css 17 막대 글자)
				g.style.setProperty('--nk-gp', clamp((/%$/.test(w) ? parseFloat(w) / 100 : b.offsetWidth / (g.clientWidth || 1)) || 0, 0, 1));
				g.style.setProperty('--nk-gw', g.clientWidth + "px");
				// 남은 시간이 0 아래로 내려가 "-0.3초"처럼 보이던 것은 0으로 (사용자 요청 — 기존 코드는 틱마다 그대로 빼서 적음)
				t = t.replace(/^-(\d+(?:\.\d+)?)/, function (m, n) { return n.replace(/\d/g, "0"); });
				if (g.getAttribute('data-t') === t) return;
				g.setAttribute('data-t', t);
				if (t.length > 12) g.setAttribute('data-long', "");
				else g.removeAttribute('data-long');
			}).observe(b, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['style'] });
		});
		// 긴 힌트(자음퀴즈 뜻풀이)는 미션 칸 자리에서 작은 글자로 (nk.css 17 힌트)
		new MutationObserver(function () {
			$stage.game.hints.children(".hint-item").each(function () {
				$(this).toggleClass("nk-long", $(this).children("label").text().length > 12);
			});
		}).observe($stage.game.hints[0], { childList: true });
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
		// UI 배율이 있을 때 카드 등이 나중에 그려져 판이 넘치면 배율을 다시 맞춤 (다음 그림 때 — ResizeObserver 안에서 크기를 바꾸지 않게)
		if (window.ResizeObserver) new ResizeObserver(function () {
			if (my.gameZoom === 1 || my._only !== 'for-gaming' || !gameOverflow()) return;
			requestAnimationFrame(function () {
				fitGameZoom();
				fitDisplay();
				fitHistory();
				fitBoard();
			});
		}).observe(gb.parentNode);
		// 라운드 줄 높이가 바뀌어도(라운드 칩이 나중에 그려짐) 판을 다시 맞춤
		if (window.ResizeObserver) new ResizeObserver(function () {
			if (my._only === 'for-gaming') requestAnimationFrame(fitBoard);
		}).observe($stage.game.round[0]);
		// 라운드가 끝나 칩이 지워져도(십자말풀이 시간 끝 등 — 기존 코드가 비움) 줄 높이는 그대로 — 판이 위로 올라가거나 커지지 않게 (사용자 요청)
		new MutationObserver(function () {
			var r = $stage.game.round[0];

			if (r.children.length) {
				r.style.minHeight = "";
				my._roundH = parseFloat(getComputedStyle(r).height);
			} else if (my._roundH) r.style.minHeight = my._roundH + "px";
		}).observe($stage.game.round[0], { childList: true });
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
		// 신 UI 전용 "UI 배율"(데스크톱, 사용자 요청): 50~200%. 손을 떼면 바로 적용해 보고 [저장]해야 남음, 저장 없이 닫으면 되돌림
		// 화면이 작으면 최대값이 줄어듦(scaleMax)
		$("#nk-settings").append($("<input type='range' min='50' max='200' step='5'>").attr('id', "nk-scale"),
			$("<div>").addClass("nk-set-val").attr('id', "nk-scale-val"));
		$("#nk-scale").on('input', function () { $("#nk-scale-val").text(this.value + "%"); })
			.on('change', function () { applyScale(this.value); });
		setRefresh.push(function () { $("#nk-scale").attr('max', Math.floor(scaleMax() * 20) * 5).val(savedScale()).trigger('input'); });

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

		$("#nk-settings .nk-dlg-close").on('click', function () {
			$("#nk-settings").hide();
			applyScale(savedScale());
		});
		$("#nk-set-server").on('click', function () { $stage.dialog.settingServer.trigger('click'); });
		// 저장은 기존 저장 단추가 함 (UI를 바꿨으면 거기서 새로고침)
		$("#nk-set-save").on('click', function () {
			saveVolumeSettings({ nkRuleOpen: $("#nk-rule-open").is(':checked'), nkScale: Number($("#nk-scale").val()) });
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
	// UI 배율 (%, 저장값 nkScale): 데스크톱은 body zoom + html의 --nk-scale (nk.css 28). 휴대폰은 늘 1.
	// 브라우저 확대처럼: 200%면 모든 것이 두 배로 그려지고, 배치는 화면의 절반 크기(실제로 쓸 수 있는 크기)에 맞춤
	function savedScale() { return clamp(Number(loadVolumeSettings().nkScale) || 100, 50, 200); }
	// 배율 최대값(작은 창에서 제한)·고해상도 글자 단계(--nk-up) 계산은 /js/nk-boot.js (로딩 화면 전에 같은 계산으로 먼저 적용함).
	// 창이 커지면 저장한 배율까지 다시 올라감
	function scaleMax() { return NKBoot.scaleMax(); }
	function upFor(w) { return NKBoot.upFor(w); }
	// 배율 z를 실제로 적용 (바뀌었으면 true). zoom은 스타일시트에서 var()를 못 받아(크롬) body에 직접 줌. --nk-scale은 창 높이·창 크기 단위 계산용 (nk.css 28)
	function setZoom(z) {
		if (z === my.gameZoom && (z === 1 || document.body.style.getPropertyValue('--nk-up') == upFor(innerWidth / z))) return false;
		if (z === 1) root.style.removeProperty('--nk-scale');
		else root.style.setProperty('--nk-scale', z);
		document.body.style.zoom = z === 1 ? "" : z;
		if (z === 1) document.body.style.removeProperty('--nk-up');
		else document.body.style.setProperty('--nk-up', upFor(innerWidth / z));
		my.gameZoom = z;
		return true;
	}
	// 게임 중에는 100% 배치(게임 화면 높이 단계는 창 높이 그대로)가 들어가는 만큼만 배율을 올림 (5% 단위, 100% 밑으로는 안 내림).
	// 큰 화면은 100%에서도 게임 판이 높이를 거의 다 써서, 배율대로 키우면 판이 채팅 밑으로 넘치고, 작은 화면용 단계로 바꾸면 판·글자·카드가 오히려 작아짐 (사용자 지적)
	// 돌려주는 값: 들어올 때와 비교해 배율·글자 단계가 실제로 바뀌었는지 (게임 중에는 먼저 원하는 배율로 놓고 줄여 가므로 중간 값은 따지지 않음)
	function fitGameZoom() {
		var want = my._scaleZ || 1, lo = 1, hi = want, z0 = my.gameZoom, u0 = document.body.style.getPropertyValue('--nk-up'), i, mid;

		setZoom(want);
		if (want > 1 && my._only === 'for-gaming' && gameOverflow()) {
			for (i = 0; i < 7; i++) {
				mid = (lo + hi) / 2;
				setZoom(mid);
				if (gameOverflow()) hi = mid;
				else lo = mid;
			}
			setZoom(Math.floor(lo * 20) / 20);
		}
		return my.gameZoom !== z0 || document.body.style.getPropertyValue('--nk-up') !== u0;
	}
	function applyScale(pct) {
		// 아래에서 일으킨 resize가 창 크기 감시(applyScale)를 다시 부르면 끝없이 되풀이돼 브라우저가 멈췄음
		// (게임 중 배율 100% 초과 — 예전에는 fitGameZoom이 늘 "바뀜"을 돌려줌. 사용자 신고: 십자말풀이 시작·게임 중 창 크기 조정 때 응답 없음)
		if (my._scaling) return;
		my._scalePct = pct;
		my._scaleZ = my.phone ? 1 : Math.min(clamp(Number(pct) || 100, 50, 200) / 100, scaleMax());
		if (!fitGameZoom()) return;
		$tip && $tip.hide();
		closePop();
		my._scaling = true;
		try {
			$(window).trigger('resize');
		} finally {
			my._scaling = false;
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
		{ tab: 'screen', labelKey: 'nkScale', descKey: 'nkDescScale', controls: ['#nk-scale', '#nk-scale-val', '#nk-scale-reset'] },
		{ tab: 'screen', labelKey: 'theme', controls: ['#theme-setting', '#theme-setting-edit', '#dark-mode-setting'] },
		{ tab: 'screen', labelKey: 'levelPack', descKey: 'nkDescLevelPack', controls: ['#level-pack'] },
		// 간단 방 보기·규칙 묶어보기는 기본 UI 전용(사용자) — 값은 기존대로 저장되게 줄은 두고 숨김. 신 UI는 아래 "항상 규칙 펼치기"
		{ tab: 'screen', section: 'visual', labelKey: 'simpleRoomView', descKey: 'nkDescSimpleRoomView', controls: ['#simple-room-view'], kind: 'toggle', hidden: true },
		{ tab: 'screen', section: 'visual', labelKey: 'showRuleCategory', descKey: 'nkDescShowRuleCategory', controls: ['#show-rule-category'], kind: 'toggle', hidden: true },
		{ tab: 'screen', section: 'visual', labelKey: 'nkRuleOpen', descKey: 'nkDescRuleOpen', controls: ['#nk-rule-open'], kind: 'toggle' },
		{ tab: 'screen', section: 'visual', labelKey: 'noShake', descKey: 'nkDescNoShake', controls: ['#no-shake'], kind: 'toggle' },
		{ tab: 'screen', section: 'visual', labelKey: 'playerScroll', descKey: 'nkDescPlayerScroll', controls: ['#player-scroll'], kind: 'toggle' },
		{ tab: 'screen', section: 'visual', labelKey: 'kanaReading', descKey: 'nkDescKanaReading', controls: ['#kana-reading'], kind: 'toggle' }
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

		// 로고·진행 막대는 kkutu.pug에 처음부터 있음(스크립트보다 먼저 보이게). 기존 이미지 로고는 nk.css가 숨김
		introWords($intro);
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
	// 로딩 화면 장식 단어 (목록은 사용자 지정). 묶음마다 랜덤으로 뽑음:
	// 이어지는 단어 4개 한 줄(차례대로 약한 선으로 이음), 긴 단어 2개, 일반 2·공격 2·방어 1 (자리는 섞음). 같은 단어는 두 번 안 나옴
	var INTRO_WORDS = {
		chain: [
			["이빨", "빨대", "대나무", "무지개"],
			["늣하르방", "방듸", "듸림부채", "채그릇"],
			["늣치", "치마기슭", "슭곰", "곰븨님븨"],
			["션믈", "믈구븨", "븨피", "피넬"],
			["다람쥐", "쥐덫", "덫사냥", "냥냥"],
			["이믜", "믜신것", "것셥", "셥삭질"],
			["다다이즘", "즘슉", "슉슉로봇", "봇짐"]
		],
		normal: ["늠름", "기러기", "이빨", "빨대", "대나무", "무지개", "레미콘", "다람쥐", "역지사지", "트라이앵글", "역사", "기체", "값어치", "사랑", "아이스크림", "나라"],
		attack: ["이리듐", "기쁨", "법딍", "기동돓", "다이디뮴", "곰븨님븨", "이수산화크로뮴", "지르코늄", "수산화나트륨", "산기슭", "방듸", "지읒", "리튬", "마그네슘", "구듨곬", "치읓", "다다이즘", "스좌좡", "이렁셩", "이제껏", "왕듸", "이슷"],
		defense: ["늣치", "윰라대왕", "늣하르방", "슭곰", "션믈", "즈믄", "윰차", "슘페터", "븨피"],
		long: ["기체크로마토질량분석법", "스리랑카민주사회주의공화국", "자라투스트라는이렇게말했다", "이상한나라의앨리스", "이멋진세계에축복을", "기체크로마토그래피", "트라이메틸렌트라이나이트라민", "터미네이터미래전쟁의시작"]
	};
	// 자리 = [단어 칸 가운데 x %, y %, 크기 배율]. 가운데(로고·진행 막대)와 아래 팁 칸은 비움.
	// chain = 위쪽에 물결 모양으로 왼쪽→오른쪽, word = 로고를 둘러싼 고리 위에 양쪽으로(바깥일수록 조금 작게),
	// long = 왼쪽 아래 중간·오른쪽 아래 고정, 일반 단어와 같은 크기 (사용자 지정)
	var INTRO_SLOTS = {
		chain: [[18, 15, 1.05], [39, 24, 1.05], [61, 13, 1.05], [82, 22, 1.05]],
		word: [[19, 40, 1], [13, 87, .88], [81, 38, 1], [75, 61, .88], [89, 77, .8]],
		long: [[23, 67, 1], [71.5, 89, 1]]
	};
	// 휴대폰(세로 화면): 단어 7개만 (사용자 지정) — 이어지는 단어 4개는 위에서부터 왼쪽·오른쪽 번갈아 내려가고,
	// 짧은 단어 2개는 진행 막대와 팁 사이 양쪽, 긴 단어 1개는 맨 아래. 짧은 단어는 일반·공격·방어를 섞은 것 중 앞의 2개
	var INTRO_SLOTS_PHONE = {
		chain: [[28, 7, 1], [72, 15, 1], [28, 23, 1], [72, 31, 1]],
		word: [[26, 64, 1], [74, 64, 1]],
		long: [[50, 91, 1]]
	};
	function introWords($intro) {
		var S = my.phone ? INTRO_SLOTS_PHONE : INTRO_SLOTS;
		var used = {}, $w = $("<div>").addClass("nk-intro-words").attr('aria-hidden', 'true');
		var chain = INTRO_WORDS.chain[Math.floor(Math.random() * INTRO_WORDS.chain.length)];
		var items = [], words, lines = "", i, j, t;

		function pick(list, n, kind) {
			var pool = list.filter(function (w) { return !used[w]; }), out = [], w;

			while (out.length < n && pool.length) {
				w = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
				used[w] = true;
				out.push([w, kind]);
			}
			return out;
		}
		// --s 크기 배율, --d 나타나는 때, --f 떠 있는 움직임의 시작점 (jQuery 1.9 .css는 변수를 못 넣으므로 setProperty)
		function put(w, kind, at, delay) {
			var el = $("<div>").addClass("nk-iw nk-iw-" + kind).text(w)[0];

			el.style.setProperty('--s', at[2]);
			el.style.setProperty('--d', delay.toFixed(2) + "s");
			el.style.setProperty('--f', (-Math.random() * 7).toFixed(1) + "s");
			$w.append(el);
			items.push({ el: el, at: at });
		}
		// 자리 잡기: 글자 가운데를 자리 %에 두되 화면 밖으로 나가지 않게 안쪽으로 당김.
		// 이어지는 단어 사이 선은 글자를 지나지 않도록 글자 상자에서 조금 떨어진 곳에서 시작·끝 (items 앞 4개 = 이어지는 단어)
		function layout() {
			var W = $w.width(), H = $w.height();

			items.forEach(function (o) {
				var w = o.el.offsetWidth, h = o.el.offsetHeight;

				o.x = clamp(o.at[0] * W / 100, w / 2 + 16, W - w / 2 - 16);
				o.y = o.at[1] * H / 100;
				o.el.style.left = o.x + "px";
				o.el.style.top = o.y + "px";
				o.hw = w / 2 + 14;
				o.hh = h * 0.36 + 8;
			});
			$w.find("line").each(function (k) {
				var a = items[k], b = items[k + 1], dx = b.x - a.x, dy = b.y - a.y;
				var ta = Math.min(a.hw / Math.abs(dx || 1e-6), a.hh / Math.abs(dy || 1e-6));
				var tb = Math.min(b.hw / Math.abs(dx || 1e-6), b.hh / Math.abs(dy || 1e-6));

				this.setAttribute('x1', a.x + dx * ta);
				this.setAttribute('y1', a.y + dy * ta);
				this.setAttribute('x2', b.x - dx * tb);
				this.setAttribute('y2', b.y - dy * tb);
			});
		}

		chain.forEach(function (w) { used[w] = true; });
		words = pick(INTRO_WORDS.normal, 2, 'normal').concat(pick(INTRO_WORDS.attack, 2, 'attack'), pick(INTRO_WORDS.defense, 1, 'defense'));
		for (i = words.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			t = words[i]; words[i] = words[j]; words[j] = t;
		}
		// 이어지는 단어: 하나씩 나타나고 그 사이 선이 차례로 그어짐
		for (i = 0; i < chain.length - 1; i++) lines += "<line pathLength='1' style='--d: " + (i * 0.3 + 0.2).toFixed(2) + "s'/>";
		$w.append("<svg class='nk-intro-chain'>" + lines + "</svg>");
		chain.forEach(function (w, k) { put(w, 'chain', S.chain[k], k * 0.3); });
		words.slice(0, S.word.length).forEach(function (o, k) { put(o[0], o[1], S.word[k], 0.5 + k * 0.12); });
		pick(INTRO_WORDS.long, S.long.length, 'long').forEach(function (o, k) { put(o[0], o[1], S.long[k], 0.9 + k * 0.15); });
		$intro.prepend($w);
		layout();
		// 글꼴을 다 받으면 글자 폭이 바뀌므로 다시, 창 크기가 바뀌어도 다시 (로딩 화면이 보일 때만)
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
		$(window).on('resize', function () { if ($intro.is(":visible")) layout(); });
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
	// 키보드로 창 다루기 (keydown.nkesc). 맨 앞 창 = 보이는 창 중 z-index가 가장 높은 것(띄우거나 끈 창은 .dialog-front), 같으면 문서에서 뒤쪽
	function frontDialog() {
		var best = null, bz = -Infinity;

		$(".dialog:visible").not(".nk-dlg-ghost").each(function () {
			var z = parseInt($(this).css('z-index'), 10) || 0;

			if (z >= bz) {
				bz = z;
				best = this;
			}
		});
		return best && $(best);
	}
	// Esc: 닫기(×) → 없으면 [아니요](확인·입력 창) → 입력칸 없는 알림 창은 [확인]. 닉네임 정하기처럼 입력이 있는 창은 그대로 둠
	function dlgEsc() {
		var $d = frontDialog(), $b;

		if (!$d) return false;
		$b = $d.children(".dialog-head").find(".closeBtn:visible");
		if (!$b.length) $b = $d.find("button[id$='-no']:visible");
		if (!$b.length && !$d.find("input:visible, textarea:visible").length) $b = $d.find(".tail-button button[id$='-ok']:visible");
		if (!$b.length) return false;
		$b.first().trigger('click');
		return true;
	}
	// Enter: 맨 앞 창의 확인 단추(-ok, 신고, 신 UI 창의 주 단추). 찬반 투표는 넣지 않음.
	// 창 밖 입력칸(채팅·게임 입력)에서 친 Enter는 그대로 — 갑자기 뜬 창을 치던 중에 누르지 않게. 창 안의 여러 줄 칸·목록·단추·링크도 원래 동작
	function dlgEnter(e) {
		var oe = e.originalEvent || {}, a = document.activeElement, $d, $ok, inside;

		if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || oe.isComposing || e.isDefaultPrevented()) return;
		if (!($d = frontDialog())) return;
		inside = a && $.contains($d[0], a);
		if (inside && $(a).is("textarea, select, button, a, [contenteditable='true']")) return;
		if (!inside && a && ($(a).is("textarea, select, [contenteditable='true']") || ($(a).is("input") && !/^(button|submit|reset|checkbox|radio|range|color|file)$/.test(a.type)))) return;
		$ok = $d.find("button[id$='-ok'], #report-submit, .nk-btn.primary").filter(":visible").not(":disabled").first();
		if (!$ok.length) return;
		// 창 밖 단추에 포커스가 있으면(창을 연 단추 등) Enter가 그 단추를 다시 누르지 않게 막음
		e.preventDefault();
		$ok.trigger('click');
	}
	// 데스크톱 공지 띠: 넘치면 글자를 줄임 (최소 10px, 그래도 넘치면 말줄임). 띠(높이 고정)를 지켜봐서 글자 크기를 바꿔도 다시 불리지 않음
	function fitNotice() {
		var el = document.getElementById("nk-notice-text"), fs;

		el.style.fontSize = "";
		if (!el.clientWidth || el.scrollWidth <= el.clientWidth) return;
		fs = parseFloat(getComputedStyle(el).fontSize);
		fs = Math.max(10, Math.floor(fs * el.clientWidth / el.scrollWidth * 4) / 4);
		el.style.fontSize = fs + "px";
		while (fs > 10 && el.scrollWidth > el.clientWidth) el.style.fontSize = (fs -= .25) + "px";
	}
	// 휴대폰 공지 띠: 넘치는 만큼(--nk-run-x)을 초당 40px로 흘림. 처음·끝에서 잠깐 멈춤(nk.css 34 — 움직이는 구간이 전체의 65%)
	function runNotice() {
		var el = document.getElementById("nk-notice-text"), run = el.firstElementChild, d;

		if (!run || !run.classList.contains("nk-notice-run")) return;
		d = el.clientWidth ? run.offsetWidth - el.clientWidth : 0;
		el.classList.toggle("is-run", d > 0);
		if (d <= 0) return;
		el.style.setProperty('--nk-run-x', -d + "px");
		el.style.setProperty('--nk-run-t', Math.max(6, d / 40 / .65).toFixed(1) + "s");
	}
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
			var vv = window.visualViewport, vw = (vv ? vv.width : innerWidth) / my.gameZoom, vh = (vv ? vv.height : innerHeight) / my.gameZoom, r, t, l;

			if (!el.classList.contains("dialog") || el.classList.contains("nk-dlg-ghost") || !el.offsetWidth) return;
			r = crect(el);
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
		// 채팅은 화면이 아니라 채팅 시트를 엶 — 아래 채팅 줄 대신 (사용자 결정 B안), 안 읽은 말이 있으면 점
		{ id: 'chat', icon: 'chat', labelKey: 'nkChat' },
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
		if (id === 'more' || id === 'chat') return openSheet(id);
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
		var pick = pickInfo(room);

		group(pick.title, pick.list);
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
		$("#nk-tabbar > .nk-tabbar-btn[data-tab='chat']").toggleClass("has-new", my._unread > 0);
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
		// 방 대기·게임 화면: 로고 자리에 뒤로(= 나가기, 리플레이 중에는 리플레이 끝내기) 단추 (사용자 결정, 정리안·조작 자리 통일)
		$(".nk-header").prepend($("<button type='button'>").addClass("nk-icon-btn nk-head-back").attr('id', "nk-head-back")
			.attr('aria-label', text('exit')).html(ico('back')).on('click', function () { (my._replay ? $stage.menu.replay : $stage.menu.exit).trigger('click'); }));
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
	var KEY_RULES = ['man', 'gen', 'ext', "jre", "jdk", 'mis', 'rdm', 'loa', 'str', 'prv', 'k32', 'lng', 'no2', 'unk', 'trp', 'one', 'ret', 'sur', 'rnt', 'itm', 'ljn', 'mir', 'spd', 'big', 'qz1', 'qz2', 'qz3', 'ijp', 'qij', 'unl', 'vow', 'obo', 'alp', 'ctc', 'apl', 'obk', 'nyh', 'ord', 'shf', 'stp', 'rnm', 'prm', 'inf'];
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
			var r = crect(el), s = crect(seg);

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
		// 시간 칸은 같은 폭 — 모드 배수로 글자가 바뀌어도 칸 자리가 그대로 (nk.css .nk-fd-num)
		$info.append(fdRow('nkRdTime', $("#room-time").prev(".nk-fd-seg").addClass("nk-fd-num")).append($("#room-time")));

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
			w = Math.min(on ? 840 : 600, winW() - 16);
			if (opening) {
				// 열 때는 효과 없이 바꾸고 바뀐 폭으로 다시 가운데 (showDialog는 이전 폭으로 맞췄음)
				$d.toggleClass("is-wide", on).css('left', Math.max(8, (winW() - w) / 2));
				return;
			}
			left = parseFloat($d.css('left')) || 0;
			clearTimeout(my._rdAnim);
			$d.addClass("nk-rd-anim").toggleClass("is-wide", on);
			if (left + w > winW() - 8) $d.css('left', Math.max(8, winW() - 8 - w));
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
		// 보일 때만 — 기존 Esc(모든 창의 닫기를 누름)가 한 번도 안 연 이 창도 눌러서, lang이 없는 채 그려 오류가 났음
		$d.on('change click', function () { setTimeout(my.quickRefresh, 0); });
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

	// 알림·확인·입력 등 작은 창 — 가운데 카드: 위 아이콘 · 제목 · 내용 · 폭을 나눈 단추 (CSS nk.css 16). warn: 빨간 아이콘
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
		// 결과창 1~3등 메달 색(nk.css 31)은 순위 숫자로 — 2쪽(랭킹)은 41등부터일 수 있어 줄 순서로는 안 됨
		new MutationObserver(function () {
			$("#ResultDiag .result-board-rank").each(function () {
				if (+this.textContent <= 3) this.setAttribute('data-medal', this.textContent);
			});
		}).observe($("#ResultDiag .result-board")[0], { childList: true });
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
		applyScale(savedScale());
		$(window).on('resize', function () { if (my._scalePct !== undefined) applyScale(my._scalePct); });
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
		if (gn.length > 1) {
			my._gn = gn;
			// 휴대폰: 넘치면 흐르게(runNotice) — 움직일 안쪽 칸으로 감쌈. 움직임 줄이기 설정이면 원래대로 말줄임
			if (my.phone && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) $("#nk-notice-text").empty().append($("<div>").addClass("nk-notice-run").html(gn));
			else $("#nk-notice-text").html(gn);
		} else $("#nk-notice").addClass("is-empty");
		$("#nk-notice-close").on('click', function () { $("#nk-notice").addClass("is-empty"); });
		// 공지가 칸을 넘으면 데스크톱은 글자를 줄여 다 들어오게, 휴대폰은 흐르는 글자로 (사용자 요청).
		// 띠 크기가 바뀔 때마다(창 크기·로비↔방 자리 이동·휴대폰 화면 전환으로 다시 보일 때) 다시 맞춤
		if (window.ResizeObserver) {
			new ResizeObserver(my.phone ? runNotice : fitNotice).observe(document.getElementById("nk-notice"));
			// 웹 글꼴이 늦게 들어오면 띠 크기는 그대로인데 글자 폭만 바뀜
			if (document.fonts) document.fonts.ready.then(my.phone ? runNotice : fitNotice);
		}

		$("#nk-account").on('click', function (e) { openAccount(e.currentTarget); });
		$(window).on('resize', function () { layoutNav(); closePop(); });
		// Esc = 메뉴 → (휴대폰) 시트 → 맨 앞 창 순서로 하나만 닫음, Enter = 맨 앞 창의 확인 단추 (사용자 요청).
		// 처리하면 기존 Esc(window — 모든 창의 닫기를 한꺼번에 누름, ready.js)까지는 안 내려보냄
		$(document).on('keydown.nkesc', function (e) {
			if (e.which === 13) return dlgEnter(e);
			if (e.which !== 27) return;
			if (my._pop) {
				closePop();
				return false;
			}
			if (my.phone && my._sheet) {
				closeSheet();
				return false;
			}
			if (dlgEsc()) return false;
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
		// 게임에서 나오면 게임 중에 낮춘 UI 배율을 설정값으로 되돌림 (fitGameZoom)
		if (prev === 'gaming' && place !== 'gaming') fitGameZoom();
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
			if (place === 'gaming') setTimeout(function () { focusTopInput(true); }, 0);
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