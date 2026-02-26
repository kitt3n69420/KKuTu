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
var $lib = { Classic: {}, Jaqwi: {}, Crossword: {}, Typing: {}, Hunmin: {}, Daneo: {}, Sock: {}, Picture: {} };
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