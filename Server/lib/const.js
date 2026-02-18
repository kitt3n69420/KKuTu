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

var GLOBAL = require("./sub/global.json");

exports.KKUTU_MAX = 400;
exports.MAIN_PORTS = GLOBAL.MAIN_PORTS;
exports.TEST_PORT = 4040;
exports.SPAM_CLEAR_DELAY = 1600;
exports.SPAM_ADD_DELAY = 750;
exports.SPAM_LIMIT = 7;
exports.BLOCKED_LENGTH = 10000;
exports.KICK_BY_SPAM = 9;
exports.MAX_OBSERVER = 8;
exports.JAMSU_WARN_TIME = 90000; //10만보다 크면 안 된다!
exports.JAMSU_WARN2_TIME = 90000;
exports.JAMSU_BOOM_TIME = 60000;
exports.TESTER = GLOBAL.ADMIN.concat([
	"Input tester id here"
]);
exports.JAMSU_DELAY_WARN = 10000;
exports.JAMSU_DELAY_ACTION = 10000;
exports.IS_SECURED = GLOBAL.IS_SECURED;
exports.SSL_OPTIONS = GLOBAL.SSL_OPTIONS;
exports.WAF = GLOBAL.WAF;
exports.MASTER_PORTS = GLOBAL.MASTER_PORTS;
exports.ROOM_PORTS = GLOBAL.ROOM_PORTS;
exports.OPTIONS = {
	'man': { name: "Manner" },        //매너: 한 방 단어 금지
	'gen': { name: "Gentle" },        //젠틀: 남은 단어 5개 미만이면 금지
	'shi': { name: "Shield" },        //실드: 한 방 단어만 금지
	'etq': { name: "Etiquette" },     //에티켓: 어인정 비활성 기준 매너
	'ext': { name: "Injeong" },       //인정: 우리말샘 및 특수 단어 인정
	'mis': { name: "Mission" },       //미션: 특정 글자를 쓰면 보너스 점수
	'eam': { name: "EasyMission" },   //이지미션: 미션 판정을 널널하게
	'rdm': { name: "RndMission" },    //랜덤미션: 미션이 턴마다 바뀜
	'mpl': { name: "MissionPlus" },   //미션플러스: 다양한 글자가 미션으로
	'loa': { name: "Loanword" },      //외래어 금지: ㅈㄱㄴ
	'prv': { name: "Proverb" },       //속담: ㅈㄱㄴ
	'str': { name: "Strict" },        //깐깐: 일반어 명사만
	'k32': { name: "Sami" },          //삼이: 3232 쿵쿵따
	'k22': { name: "Twotwo" },        //둘둘, 넷넷, 사삼: 비슷함
	'k44': { name: "Fourfour" },
	'k43': { name: "Fourthree" },
	'no2': { name: "No2" },           //2글자 금지: ㅈㄱㄴ
	'unk': { name: "Unknown" },       //언노운 워드: 없는 단어만 쓰기
	'big': { name: "Big" },           //큰 보드: 솎솎 글자수가 2배가 됨
	'trp': { name: "Triple" },        //트리플: 주제 3개를 동시에 씀
	'one': { name: "One" },           //원찬스: 한번 틀리면 끝
	'mir': { name: "Mirror" },        //력입 로꾸거 를어단 :러미\\
	'ret': { name: "Return" },        //리턴: 쓴 단어 재사용 가능
	'mid': { name: "Middle" },        //미들잇기: 단어의 가운데 글자로 이음
	'sch': { name: "Second" },
	'vow': { name: "Vowel" },
	'lng': { name: "Long" },
	'ln3': { name: "Length3" },
	'ln4': { name: "Length4" },
	'ln5': { name: "Length5" },
	'ln6': { name: "Length6" },
	'ln7': { name: "Length7" },   //3, 4, 6, 7글자는 영어 쿵쿵따에 쓸 예정
	'unl': { name: "Unlimited" },
	'sur': { name: "Survival" },
	'fdu': { name: "FreeDueum" },
	'ndu': { name: "NoDueum" },
	'spd': { name: "Speed" },
	'drg': { name: "Drg" },
	'spt': { name: "SpeedToss" },
	'stt': { name: "Straight" },
	'fir': { name: "First" },
	'ran': { name: "Random" },
	'vin': { name: "VowelInv" },
	'apl': { name: "Apple" },
	'bbg': { name: "BbungTwigi" },
	'obk': { name: "Oneback" },
	'qz1': { name: "QuizEasy" },
	'qz2': { name: "QuizNormal" },
	'qz3': { name: "QuizHard" },
	'nar': { name: "Narak" },
	'god': { name: "Invincible" },
	'apd': { name: "AntiTroll" },
	'rnt': { name: "RandomTurn" },
	'nol': { name: "NoLong" },     // 장문 금지: 9글자 이상 금지
	'nos': { name: "NoShort" }     // 단문 금지: 8글자 이하 금지

};
exports.ROBOT_TIMEOUT_MESSAGES = [ // 다른 플레이어가 게임오버되면 봇이 보내는 메시지
	"저런", "ㅋㅋㅋㅋ", "안타깝네요", "아이고...", "바부", "컷~",
	"잘가시고~", "ㅋㅋㅋㅋㅋㅋ", "멍충이", "아이고야", "꽤나 따끔할거요",
];
exports.ROBOT_TIMEOUT_MESSAGES_SAMETEAM = [ // 다른 플레이어가 게임오버되면 봇이 보내는 메시지
	"저런", "아이고...", "멍충이", "그럴 수도 있지", "님 뭐함?",
	"어후", "바부", "정신차려!", "아오", "트롤하지마"
];
exports.ROBOT_DEFEAT_MESSAGES_2 = [ // 남은 단어가 없으면 봇이 보내는 메시지
	"뭐였더라?", "단어가 생각이 안나", "아 까먹었다", "GG", "모르겠어",
	"기억이 안 나...", "아 뭐지?", "생각이 안 나네", "단어 더 없나?",
	"에라이", "으앙", "ㅇㅅㅇ", "ㅁㄴㅇㄹ", "님들 헬프", "???"
];
exports.ROBOT_VICTORY_MESSAGES = [ // 봇이 한방단어를 주고 보내는 메시지
	"ㄴㅇㅅ", "ㅅㄱ", "ㅂㅂ", "잘가시게", "이거나 먹어라", ":3", ":)", "^-^", "OwO",
	"ㅋㅋㅋㅋ", "나이스~", "한번 당해봐라!", "바이바이~", "ㅋㅋㅋㅋㅋㅋ", "ㅎㅎ",
	"즐~", "ㅃㅃ", "ㅋㅋㅋㅋㅋㅋㅋㅋ", "수고~", "안녕은 영원한 헤어짐은 아니겠지요~",
	"이얍!", "이건 못 참지", "메롱~", "하핫!"
];
exports.ROBOT_DEFEAT_MESSAGES = [ // 봇이 한방단어를 받았을 때 보내는 메시지
	"아니", "살살 좀 해", "짜증나", "이건 너무하잖아...", "으앙", "히잉",
	"ㅁㄴㅇㄹ", "님아 제발", "아오 진짜", "아놔...", "ㅠㅠ", "너무해",
	"선넘네", "이렇게 가는구나...", "당했다!", "에라이", "하...", "엣?",
	"아니 님아", "아 제발", "뿌에엥", "뾄!", "악", "안돼", "ㅠㅠ", "저기요?",
	"이럴수가", "너 봇이지?", "으아악", "어...?", "???", "무...무슨?", "뭐...뭐야?"
];
exports.ROBOT_ANGRY_MESSAGES = [ //봇이 빡치면 보내는 메시지
	"이건 불공평해", "억까 제발좀", "아오!!!!!!", "개짜증나",
	"ㅁㄴㅇㄹㄹㅇㄴㄹㅇㄴㅁㄹㄴㅇㄹㅇㄴㄹㅇㄴㅁㄴㅇㄹ", "냥냥",
	"야!!!", "치트 쓰지마", "사기치지마", "너 어디사냐?"
]
exports.ROBOT_FINAL_MESSAGES = [ //봇이 중퇴하기 전에 보내는 메시지
	"나 안해", "망겜", "개노잼", "니들끼리나 잘 해라", "난 안할거임 ㅅㄱ",
	"내가 너희랑 다시 하나 봐라", "ㅇㅇ", "게임 뭣같이하네", "ㅂㅂ",
	"나 탈주함 ㅅㄱ", "이타치가 왜 강한지 알아? 탈주닌자라서"
]
exports.MOREMI_PART = ["back", "shoes", "clothes", "head", "eye", "mouth", "lhand", "rhand"];
exports.CATEGORIES = ["all", "spec", "skin", "badge", "head", "eye", "mouth", "clothes", "hs", "back"];
exports.AVAIL_EQUIP = [
	"NIK", "BDG1", "BDG2", "BDG3", "BDG4",
	"blackbere", "black_mask", "blue_headphone", "brownbere", "haksamo", "hamster_G", "hamster_O", "miljip", "nekomimi", "orange_headphone", "redbere", "twoeight", "white_mask",
	"bigeye", "brave_eyes", "close_eye", "cuspidal", "double_brows", "inverteye", "lazy_eye", "scouter", "sunglasses",
	"beardoll", "cat_mouth", "decayed_mouth", "laugh", "merong", "mustache", "oh",
	"blackrobe", "blue_vest", "medal", "orange_vest", "pants_china", "pants_japan", "pants_korea", "pink_vest", "sqpants", "water",
	"bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice",
	"black_oxford", "black_shoes", "brown_oxford", "loosesocks", "ilusweater", "kktpixel", "pixgradg", "pixgrado",
	"Mhead", "Meye", "Mmouth", "Mclothes", "Mshoes", "Mhand", "Mback", "Mfront"
];

exports.GROUPS = {
	'spec': ["PIX", "PIY", "PIZ", "CNS"],
	'skin': ["NIK"],
	'badge': ["BDG1", "BDG2", "BDG3", "BDG4"],
	'head': ["blackbere", "black_mask", "blue_headphone", "brownbere", "haksamo", "hamster_G", "hamster_O", "miljip", "nekomimi", "orange_headphone", "redbere", "twoeight", "white_mask", "Mhead"],
	'eye': ["bigeye", "brave_eyes", "close_eye", "cuspidal", "double_brows", "inverteye", "lazy_eye", "scouter", "sunglasses", "Meye"],
	'mouth': ["beardoll", "cat_mouth", "decayed_mouth", "laugh", "merong", "mustache", "oh", "Mmouth"],
	'clothes': ["blackrobe", "blue_vest", "medal", "orange_vest", "pants_china", "pants_japan", "pants_korea", "pink_vest", "sqpants", "water", "ilusweater", "kktpixel", "pixgradg", "pixgrado", "Mclothes"],
	'hs': ["bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice", "black_oxford", "black_shoes", "brown_oxford", "loosesocks", "Mshoes", "Mhand"],
	'back': ["Mback", "Mfront"]
};
exports.RULE = {
	/*
		유형: { lang: 언어,
			rule: 이름,
			opts: [ 추가 규칙 ],
			time: 시간 상수,
			ai: AI 가능?,
			big: 큰 화면?,
			ewq: 현재 턴 나가면 라운드 종료?
		}
	*/

	'EKT': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'ESH': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KKT': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "k32", "k22", "k44", "k43", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "vin", "spd", "drg", "spt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSH': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "vin", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'CSQ': {
		lang: "ko",
		rule: "Jaqwi",
		opts: ["ijp", "vow", "unl", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'KCW': {
		lang: "ko",
		rule: "Crossword",
		opts: ["drg"],
		time: 2,
		ai: false,
		big: true,
		ewq: false
	},
	'KTY': {
		lang: "ko",
		rule: "Typing",
		opts: ["prv", "mir", "one", "lng", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'ETY': {
		lang: "en",
		rule: "Typing",
		opts: ["prv", "mir", "one", "lng", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'KAP': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "vin", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'EAP': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},

	'HUN': {
		lang: "ko",
		rule: "Hunmin",
		opts: ["ext", "mis", "mpl", "eam", "rdm", "loa", "str", "one", "ret", "spd", "drg", "ln3", "bbg", "nar", "god", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KDA': {
		lang: "ko",
		rule: "Daneo",
		opts: ["ijp", "mis", "mpl", "eam", "rdm", "trp", "one", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		ewq: false
	},
	'EDA': {
		lang: "en",
		rule: "Daneo",
		opts: ["ijp", "mis", "rdm", "trp", "one", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSS': {
		lang: "ko",
		rule: "Sock",
		opts: ["no2", "big", "drg", "apl"],
		time: 1,
		ai: false,
		big: true,
		ewq: false
	},
	'ESS': {
		lang: "en",
		rule: "Sock",
		opts: ["no2", "big", "drg"],
		time: 1,
		ai: false,
		big: true,
		ewq: false
	},
	'KPQ': {
		lang: "ko",
		rule: "Picture",
		opts: ["ijp", "drg"],
		time: 2,
		ai: false,
		big: true,
		ewq: false
	},
	'KSC': {
		lang: "ko",
		rule: "Jaqwi",
		opts: ["ijp", "unl", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'KFR': {
		lang: "ko",
		rule: "Free",
		opts: ["ext", "mis", "mpl", "eam", "rdm", "one", "unk", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EFR': {
		lang: "en",
		rule: "Free",
		opts: ["ext", "mis", "rdm", "one", "unk", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EKK': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "fir", "ran", "ln3", "ln4", "ln6", "ln7", "bbg", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EPQ': {
		lang: "en",
		rule: "Picture",
		opts: ["ijp", "drg"],
		time: 2,
		ai: false,
		big: true,
		ewq: false
	},
	'KAK': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "k32", "k22", "k44", "k43", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "vin", "spd", "drg", "spt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'EAK': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "fir", "ran", "ln3", "ln4", "ln6", "ln7", "bbg", "sur"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'KKU': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "unk", "one", "mid", "sch", "spd", "drg", "stt", "fir", "bbg", "nar", "god", "apd", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'CRL': {
		lang: "etc",
		rule: "Calcrelay",
		opts: ["spd", "one", "drg", "nar", "god", "rnt", "sur"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KCB': {
		lang: "ko",
		rule: "Chainbattle",
		opts: ["ext", "str", "loa", "one", "drg"],
		time: 2,
		ai: true,
		big: false,
		ewq: false
	},
	'ECB': {
		lang: "en",
		rule: "Chainbattle",
		opts: ["ext", "one", "drg"],
		time: 2,
		ai: true,
		big: false,
		ewq: false
	},
	'CAL': {
		lang: "etc",
		rule: "Calcbattle",
		opts: ["one", "drg", "obk"],
		time: 2,
		ai: true,
		big: false,
		ewq: false
	},
	'KQZ': {
		lang: "ko",
		rule: "Quiz",
		opts: ["qij", "qz1", "qz2", "qz3", "drg"],
		time: 0.1,
		ai: true,
		big: false,
		ewq: false
	},
	'EQZ': {
		lang: "en",
		rule: "Quiz",
		opts: ["qij", "qz1", "qz2", "qz3", "drg"],
		time: 0.1,
		ai: true,
		big: false,
		ewq: false
	}

};
exports.GAME_CATEGORIES = {
	'classic': {
		name: 'GameCategoryClassic',
		modes: ['KKT', 'KSH', 'KAP', 'KAK', 'KKU', 'EKT', 'ESH', 'EKK', 'EAP', 'EAK']
	},
	'quiz': {
		name: 'GameCategoryQuiz',
		modes: ['CSQ', 'KCW', 'KSS', 'ESS', 'KPQ', 'EPQ', 'KSC', 'CRL', 'KQZ', 'EQZ']
	},
	'other': {
		name: 'GameCategoryOther',
		modes: ['KDA', 'EDA', 'KTY', 'ETY', 'HUN', 'KFR', 'EFR', 'KCB', 'ECB', 'CAL']
	},
	'etc': { //이건뭐지
		name: 'GameCategoryEtc',
		modes: ['CRL']
	}
};
exports.getPreScore = function (text, chain, tr) {
	return 2 * (Math.pow(5 + 7 * (text || "").length, 0.74) + 1.18 * (chain || []).length) * (0.5 + 0.5 * tr);
};
exports.getCalcScore = function (answer, tr) {
	return 2 * Math.pow(5 + 2800 * Math.atan(answer / 2000), 0.74) * (0.5 + 0.5 * tr);
};
exports.getPenalty = function (chain, score) {
	return -1 * Math.round(Math.max(50, 10 + (chain || []).length * 3 + score * 0.2));
};
// 계산 대결 점수 계산 (정답 기반)
exports.getCalcBattleScore = function (answer) {
	return Math.round(500 * Math.atan(answer / 1000) + 10);
};
// 수학 문제 생성 헬퍼 함수 (calcrelay, calcbattle 공용)
exports.generateCalcProblem = function (chainLength) {
	var c = chainLength || 0;
	var m = Math.min(10000000, Math.floor(15 * Math.pow(2, c / 8)));
	var op = Math.floor(Math.random() * 3);
	var a, b, question, answer;

	if (op === 0) { // 덧셈: a + b = ?
		var minVal = Math.floor(m / 10);
		a = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		b = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		question = a + " + " + b + " = ?";
		answer = (a + b) | 0;
	} else if (op === 1) { // 뺄셈: (a+b) - a = ?
		var minVal = Math.floor(m / 10);
		a = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		b = Math.max(1, Math.floor(Math.random() * (m - minVal) + minVal));
		question = (a + b) + " - " + a + " = ?";
		answer = b | 0;
	} else { // 곱셈: a × b = ?
		var sqrtM = 2 * Math.min(Math.max(5, Math.floor(Math.pow(m, 0.6))), 10000);
		var minVal = Math.max(2, Math.floor(sqrtM / 10));
		a = Math.max(2, Math.floor(Math.random() * (sqrtM - minVal) + minVal));
		b = Math.max(2, Math.floor(Math.random() * (sqrtM - minVal) + minVal));
		question = a + " × " + b + " = ?";
		answer = (a * b) | 0;
	}
	return { question: question, answer: answer };
};
// 봇 오답 생성 함수
exports.generateWrongAnswer = function (correct) {
	var digits = String(correct).split('');
	if (digits.length === 0) return "0";
	var idx = Math.floor(Math.random() * digits.length);
	var newDigit;
	do {
		newDigit = String(Math.floor(Math.random() * 10));
	} while (newDigit === digits[idx]);
	digits[idx] = newDigit;
	// 첫 자리가 0이 되면 안됨 (단, 한 자리 수는 0 가능)
	if (digits.length > 1 && digits[0] === '0') {
		digits[0] = String(Math.floor(Math.random() * 9) + 1);
	}
	return digits.join('');
};
exports.GAME_TYPE = Object.keys(exports.RULE);
exports.EXAMPLE_TITLE = {
	'ko': "이기자도지사리스트법",
	'en': "demography"
};
exports.KKU_START_BIGRAMS = [
	"아이", "국제", "자동", "전자", "자기", "전기", "사회", "사이",
	"직접", "이중", "환경", "방사", "한국", "다중", "자연", "공기",
	"단일", "완전", "기계", "항공", "고정", "국가", "기본", "공동",
	"자유", "중간", "경제", "문화", "일반", "신경", "작은", "복합",
	"표준", "이차", "시간", "세포", "화학", "간접", "세계", "지역",
	"유전", "생물", "정보", "지방"
];
exports.INIT_SOUNDS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
exports.VOWEL_SOUNDS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
exports.MISSION_ko = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"];
exports.MISSION_en = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

exports.KO_INJEONG = [
	"IMS", "VOC", "KRR", "KTV",
	"NSK", "KOT", "DOT", "DRR", "DGM", "RAG", "LVL",
	"LOL", "MRN", "MMM", "MAP", "MKK", "MNG",
	"MAM", "CKR", "BRS", "BTC", "BLA",
	"SAO", "WEB", "COL", "JAT", "INC", "HAR",
	"MOB", "HYK", "CYP", "HRH", "STA", "OIJ",
	"KGR", "ESB", "ELW", "OIM", "OVW", "NEX", /*"WOW",*/ //얘는 왜 주석임?
	"YRY", "KPO", "JLN", "JAN", "ZEL", "POK", "HAI",
	"HSS", "KMV", "HDC", "HOS", "FRC", "TPW", "MCJ" //,"WMV" // 아 까먹었다
];
exports.EN_INJEONG = [
	"LOL", "MCJ"
];
exports.KO_THEME = [
	"30", "40", "60", "80", "90",
	"140", "150", "160", "170", "190",
	"220", "230", "240", "270", "310",
	"320", "350", "360", "420", "430",
	"440", "450", "490", "530", "1001"
];
exports.EN_THEME = [
	"e05", "e08", "e12", "e13", "e15",
	"e18", "e20", "e43"
];
exports.IJP_EXCEPT = [
	"OIJ", "TPW"
];
exports.QUIZ_TOPIC = [
	"MATH", "CAPI", "CHEM", "UNIT", "NUMG", "ASTR", "ARTS" /*, "CNTR" */
];
exports.QUIZ_TOPIC_EN = [
	"MATH", "CAPI", "CHEM", "UNIT", "NUMG", "ASTR", "ARTS" /*, "CNTR" */
];
exports.KO_IJP = exports.KO_INJEONG.concat(exports.KO_THEME).filter(function (item) { return !exports.IJP_EXCEPT.includes(item); });
exports.EN_IJP = exports.EN_INJEONG.concat(exports.EN_THEME).filter(function (item) { return !exports.IJP_EXCEPT.includes(item); });
exports.REGION = {
	'en': "en",
	'ko': "kr"
};
exports.KOR_STRICT = /(^|,)(1|INJEONG)($|,)/;
exports.KOR_GROUP = new RegExp("(,|^)(" + [
	"0", "1", "3", "7", "8", "11", "9",
	"16", "15", "17", "2", "18", "20", "26", "19",
	"INJEONG"
].join('|') + ")(,|$)");
exports.ENG_ID = /^[a-z]+$/i;
exports.KOR_FLAG = {
	LOANWORD: 1, // 외래어
	INJEONG: 2,	// 어인정
	SPACED: 4, // 띄어쓰기를 해야 하는 어휘
	SATURI: 8, // 방언
	OLD: 16, // 옛말
	MUNHWA: 32 // 문화어
};
exports.WP_REWARD = function () {
	return 10 + Math.floor(Math.random() * 91);
};
exports.getRule = function (mode) {
	return exports.RULE[exports.GAME_TYPE[mode]];
};

exports.BOT_NAME_TEMPLATES = [
	"나는 {0}다", "{0} 끄돌이", "{0} 끄순이", "{0} 끄투 봇",
	"끄투잘하고싶어요", "완전 물렙", "모레미귀여워", "모레미는 세계최강",
	"유기농 감자", "평범한 끄투러", "끄투가좋아", "한판해요", "나는야끄투봇",
	"빛과부", "궁민연금", "아침마담", "휴지필름", "태조샷건", "콩쥐들쥐",
	"구타500", "브레드피토", "동생방신기", "피구왕한무", "피부암통키",
	"산드라불독", "뇌출혈씨티", "존트럭불타", "백마탄환자", "EF손아파",
	"추잡60분", "메뚜기쉰라면", "탈모엔안제모", "내자랑4가지", "추적60인분",
	"니콜키크드만", "낙동강효리알", "모르는개산책", "축구왕숯갈비",
	"옷삶아빛나데", "믹서기육천원", "투다리스머프", "이웃집또털어",
	"아기공룡둘째", "집수리오형제", "카드값줘체리", "독수리오년째",
	"출산드라블록", "명륜진샤오미", "브라운타이즈", "클레오파트너",
	"인사없음트롤", "배숙희나빈손", "말죽거리잠옷사",
	"백마타고온환자", "더블에스오지명", "그리움만싸인회", "노스트라단무지",
	"소리없는정우성", "소년탐정김정일", "반지의제왕절개", "발리에서쌩깐일",
	"태정태세문단속", "오른쪽이스웨인", "18K반지의제왕"
];

exports.BOT_LEVEL_NAMES = {
	"-1": "바보",
	"0": "왕초보",
	"1": "초보",
	"2": "중수",
	"3": "고수",
	"4": "초고수"
};

/**
 * 크래프트 그룹 시스템
 *
 * 아이템 ID를 크래프트 그룹명에 매핑.
 * crafting DB 테이블의 item1/item2에 아이템 ID 대신 그룹명을 넣으면,
 * 해당 그룹에 속한 아이템 아무 2개로 조합이 가능해짐.
 *
 * 예: "blue_name"은 "colored_name" 그룹에 속함.
 *     crafting 테이블에 item1="colored_name", item2="colored_name", result="rainbow_name" 레시피가 있으면
 *     colored_name 그룹의 아무 아이템 2개를 조합하면 rainbow_name이 됨.
 *
 * 형식: { "아이템ID": "크래프트그룹명", ... }
 */
exports.CRAFT_GROUPS = {
	// 예시: 색깔 이름 아이템들을 "colored_name" 그룹으로 묶기
	// "blue_name": "colored_name",
	// "green_name": "colored_name",
	// "red_name": "colored_name",
	// "orange_name": "colored_name",
	// "pink_name": "colored_name",
	// "purple_name": "colored_name",
	// "indigo_name": "colored_name",

	// 예시: 그라데이션 이름 아이템들을 "gradient_name" 그룹으로 묶기
	// "gradientname_blueblue": "gradient_name",
	// "gradientname_greengreen": "gradient_name",
	// ... (이 그룹의 아무 2개 → rainbow_name)
};

exports.getCraftGroup = function (itemId) {
	return exports.CRAFT_GROUPS[itemId] || null;
};

exports.BOT_ITEM_WEIGHTS = {
	// "item_id": weight (default: 10)
	"nekomimi": 20,
	"cuspidal": 3,
	"black_mask": 3,
	"white_mask": 3

};

// ========== 서바이벌 모드 공통 유틸리티 ==========

/**
 * 서바이벌 모드에서 생존자 수와 팀 수를 확인
 * @param {Object} my - Room 객체
 * @param {Object} DIC - 플레이어 사전
 * @returns {Object} { aliveCount, aliveTeams, hasTeams, gameOver }
 */
exports.checkSurvivalStatus = function (my, DIC) {
	var aliveCount = 0;
	var aliveTeams = new Set();
	var hasTeams = false;
	var individualCount = 0;

	for (var i in my.game.seq) {
		var p = DIC[my.game.seq[i]] || my.game.seq[i];
		if (p && p.game && p.game.alive) {
			aliveCount++;
			var team = p.robot ? p.game.team : p.team;
			// team이 1~4이면 팀전, 0이거나 undefined/null이면 개인전
			if (team && team >= 1 && team <= 4) {
				aliveTeams.add(team);
				hasTeams = true;
			} else {
				individualCount++;
			}
		}
	}

	// 게임 종료 조건: 팀 + 개인전 합쳐서 1개체만 남을 때
	// 팀은 같은 팀원끼리 1개체, 개인은 각자 1개체
	var totalEntities = aliveTeams.size + individualCount;
	var gameOver = totalEntities <= 1;

	return {
		aliveCount: aliveCount,
		aliveTeams: aliveTeams,
		hasTeams: hasTeams,
		gameOver: gameOver
	};
};

/**
 * 서바이벌 모드에서 다음 살아있는 플레이어에게 데미지 적용
 * @param {Object} my - Room 객체
 * @param {Object} DIC - 플레이어 사전
 * @param {number} damage - 가할 데미지
 * @param {number} currentTurn - 현재 턴 인덱스
 * @returns {Object|null} { targetId, damage, newHP, ko } 또는 null (대상 없음)
 */
exports.applySurvivalDamage = function (my, DIC, damage, currentTurn) {
	if (damage <= 0) return null;

	var nextTurn = currentTurn;
	var attempts = 0;

	while (attempts < my.game.seq.length) {
		nextTurn = (nextTurn + 1) % my.game.seq.length;
		if (nextTurn === currentTurn) {
			attempts++;
			continue;
		}

		var nextPlayer = DIC[my.game.seq[nextTurn]] || my.game.seq[nextTurn];
		if (nextPlayer && nextPlayer.game && nextPlayer.game.alive) {
			// 데미지 적용
			nextPlayer.game.score -= damage;
			var newHP = nextPlayer.game.score;
			var ko = newHP <= 0;

			if (ko) {
				nextPlayer.game.alive = false;
				nextPlayer.game.score = 0;
			}

			return {
				targetId: nextPlayer.id,
				damage: damage,
				newHP: ko ? 0 : newHP,
				ko: ko
			};
		}
		attempts++;
	}

	return null;
};

/**
 * 서바이벌 모드에서 타임아웃으로 인한 KO 처리
 * @param {Object} my - Room 객체
 * @param {Object} DIC - 플레이어 사전
 * @param {Object} target - 타임아웃된 플레이어
 * @param {Object} extraData - turnEnd에 추가할 데이터 (optional)
 * @returns {boolean} 게임이 종료되었으면 true
 */
exports.handleSurvivalTimeout = function (my, DIC, target, extraData) {
	if (!my.opts.survival || !target || !target.game || !target.game.alive) {
		return false;
	}

	target.game.alive = false;
	target.game.score = 0;

	var status = exports.checkSurvivalStatus(my, DIC);

	var turnEndData = {
		ok: false,
		target: target.id,
		score: 0,
		totalScore: 0,
		survival: true,
		ko: true,
		koReason: 'timeout'
	};

	// 추가 데이터 병합
	if (extraData) {
		for (var key in extraData) {
			turnEndData[key] = extraData[key];
		}
	}

	my.byMaster('turnEnd', turnEndData, true);

	if (status.gameOver) {
		clearTimeout(my.game.robotTimer);
		my.game._rrt = setTimeout(function () {
			my.roundEnd();
		}, 2000);
		return true;
	}

	return false;
};
