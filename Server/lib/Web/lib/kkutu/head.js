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
var KO_INJEONG;
var EN_INJEONG;
var MAX_LEVEL = 360;
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
		"[한H][^가-힣]*[녀여]", "[그니너저샹썅][^가-힣]*년", "닥[^가-힣]*[치쳐처]", "(대|머|아)[^가-힣]*((갈[^가-힣]*[통빡])|가[^가-힣]*리)", "\\bwls\\b", "찐[^가-힣]*(따|평)", "쿨[^가-힣]*찐"
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