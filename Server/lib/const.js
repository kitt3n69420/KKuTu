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
exports.JAMSU_WARN_TIME = 300000; // 모두 잠수
exports.JAMSU_WARN2_TIME = 240000;
exports.JAMSU_BOOM_TIME = 60000;
exports.LOBBY_AFK_WARN_TIME = 30 * 60 * 1000 - 30 * 1000; // 로비 잠수 경고: 2시간 59분 30초
exports.LOBBY_AFK_KICK_TIME = 30000;    // 경고 후 30초 안에 응답 없으면 추방
exports.TESTER = GLOBAL.ADMIN.concat([
	"Input tester id here"
]);
exports.JAMSU_DELAY_WARN = 50000; //방장 잠수
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
	'kch': { name: "Change" },
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
	'ln2': { name: "Length2" }, // 한타대용
	'ln3': { name: "Length3" }, // 영쿵따, 훈민정음용
	'ln4': { name: "Length4" },
	'ln5': { name: "Length5" },
	'ln6': { name: "Length6" },
	'ln7': { name: "Length7" },   //3, 4, 6, 7글자는 영어 쿵쿵따에 쓸 예정
	'unl': { name: "Unlimited" },
	'sur': { name: "Survival" },
	'fdu': { name: "FreeDueum" },
	'ndu': { name: "NoDueum" },
	'rdu': { name: "RobloxDuum" },
	'spd': { name: "Speed" },
	'drg': { name: "Drg" },
	'spt': { name: "SpeedToss" },
	'stt': { name: "Straight" },
	'fho': { name: "FullHouse" },  // 풀하우스: 이전 단어의 문자를 포함하면 보너스
	'flu': { name: "Flush" },      // 플러시: 내 턴에서 같은 이을 글자 3연속 보너스
	'jkp': { name: "Jackpot" },    // 잭팟: 내 턴에서 7자+ 같은 이을 글자 3연속 보너스
	'dfb': { name: "DefenseBonus" }, // 디펜스 보너스: 공격/플러시 방어 시 보너스
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
	'nos': { name: "NoShort" },    // 단문 금지: 8글자 이하 금지
	'obo': { name: "OnlyOnce" },   // 한번만: 전체 게임에서 한 번 쓴 단어는 재사용 불가
	'alp': { name: "Allpos" },     // 모든 품사: 품사 제한 없이 모든 단어 사용 가능
	'itm': { name: "Item" },       // 아이템전: 아이템을 사용할 수 있는 모드
	'chs': { name: "Chaos" },      // 카오스: 매 턴 랜덤 아이템 효과 (itm과 함께 사용 불가)
	'nsw': { name: "Noswear" },    // 욕 금지: 욕이 포함된 단어 제출 시 채팅으로 처리
	'dod': { name: "NoDodoli" },   // 도돌이 금지: 이어지는 글자와 이을 글자가 같은 단어 금지
	'nyh': { name: "Nyeohweok" },  // 녜힁: 어려운 한글 조합으로 랜덤 생성
	'ctc': { name: "Catch" },      // 캐치: 그림퀴즈 전용 특수 데이터베이스 사용
	'ord': { name: "Order" },      // 순서대로: seq 순서로 술래
	'shf': { name: "Shuffle" },    // 공정랜덤: 셔플 후 한 명씩 술래
	'stp': { name: "Stop" }        // 멈춰!: 슉슉 글자 이동 정지, 경험치 40%로 감소

};

// ========== 아이템전 / 카오스 상수 ==========

exports.ITEM_TYPES = ['skip', 'reverse', 'pass', 'random', 'linkChange'];
exports.CHAOS_REVERSE_CHANCE = 0.10; // 매 턴 reverse 아이템 강제 발동 확률
exports.CHAOS_LINK_CHANCE    = 0.05; // 매 턴 linkChange 아이템 강제 발동 확률 (Classic 전용)
exports.ITEM_MAX_COUNT = 10;       // 종류별 최대 보유 개수
exports.ITEM_GRANT_INTERVAL = 6;  // 글로벌 N턴마다 전체 자동 지급
exports.ITEM_BONUS_THRESHOLD = 2; // 보너스 수치 N 이상이면 지급

exports.ROBOT_TIMEOUT_MESSAGES = [ // 다른 플레이어가 게임오버되면 봇이 보내는 메시지
	"저런", "ㅋㅋㅋㅋ", "안타깝네요", "아이고...", "바부", "컷~",
	"잘가시고~", "ㅋㅋㅋㅋㅋㅋ", "멍충이", "아이고야", "꽤나 따끔할거요",
	"빠이빠이~", "잘가~", "그럴 수도 있지"
];
exports.ROBOT_TIMEOUT_MESSAGES_SAMETEAM = [ // 다른 플레이어가 게임오버되면 봇이 보내는 메시지
	"저런", "아이고...", "멍충이", "그럴 수도 있지", "님 뭐함?",
	"어후", "바부", "정신차려!", "아오", "트롤하지마", "아잇",
	"좀 제대로 해", "어휴", "에휴", "실수지...?", "하..."
];
exports.ROBOT_DEFEAT_MESSAGES_2 = [ // 남은 단어가 없으면 봇이 보내는 메시지
	"뭐였더라?", "단어가 생각이 안나", "아 까먹었다", "GG", "모르겠어",
	"기억이 안 나...", "아 뭐지?", "생각이 안 나네", "단어 더 없나?",
	"에라이", "으앙", "ㅇㅅㅇ", "ㅁㄴㅇㄹ", "님들 헬프", "???", "쌰갈"
];
exports.ROBOT_VICTORY_MESSAGES = [ // 봇이 한방단어를 주고 보내는 메시지
	"ㄴㅇㅅ", "ㅅㄱ", "ㅂㅂ", "잘가시게", "이거나 먹어라", ":3", ":)", "^-^", "OwO",
	"ㅋㅋㅋㅋ", "나이스~", "한번 당해봐라!", "바이바이~", "ㅋㅋㅋㅋㅋㅋ", "ㅎㅎ",
	"즐~", "ㅃㅃ", "ㅋㅋㅋㅋㅋㅋㅋㅋ", "수고~", "안녕은 영원한 헤어짐은 아니겠지요~",
	"이얍!", "이건 못 참지", "메롱~", "하핫!", "이 맛이야!", "잘가~", "짠~"
];
exports.ROBOT_DEFEAT_MESSAGES = [ // 봇이 한방단어를 받았을 때 보내는 메시지
	"아니", "살살 좀 해", "짜증나", "이건 너무하잖아...", "으앙", "히잉",  
	"ㅁㄴㅇㄹ", "님아 제발", "아오 진짜", "아놔...", "ㅠㅠ", "너무해",
	"선넘네", "이렇게 가는구나...", "당했다!", "에라이", "하...", "엣?",
	"아니 님아", "아 제발", "뿌에엥", "뾄!", "악", "안돼", "ㅠㅠ", "저기요?",
	"이럴수가", "너 봇이지?", "으아악", "어...?", "???", "무...무슨?", "뭐...뭐야?",
	"한방 단어는 너무 하잖아... ㅠㅠ", "쌰갈", "아잇 진짜", "아", "?", "뭣"
];
exports.ROBOT_HANBANG_OBSERVE_MESSAGES = [ //봇이 다른 플레이어가 한방 단어를 맞는 걸 볼 때 보내는 메시지
	"헉", "헐", "헉헉헉헉", "한방?", "저런", "한방 ㄷㄷ", "어머",
	"어", "ㄷ", "ㄷㄷ", "어후"
];
exports.ROBOT_ANGRY_MESSAGES = [ //봇이 빡치면 보내는 메시지
	"아잇 진짜!", "으아아아아앙", "아오!!!!!!", "개짜증나", "쌰갈!!!!",
	"ㅁㄴㅇㄹㄹㅇㄴㄹㅇㄴㅁㄹㄴㅇㄹㅇㄴㄹㅇㄴㅁㄴㅇㄹ", "재밌냐?",
	"야!!!", "치트 쓰지마", "사기치지마", "끄글 꺼라", "더러운짓 하지마",
	"억까겜", "작작 해라?", "적당히 하자?", "뿌에에에에엥", "엿같네",
	 "한방은 싫어!!", "한방단어 멈춰!", "넌 8대가 탈모될거야!",
	 "바보멍청이똥개해삼멍게말미잘!!", "아 님신고"
]
exports.ROBOT_FINAL_MESSAGES = [ //봇이 중퇴하기 전에 보내는 메시지
	"나 안해", "망겜", "개노잼", "니들끼리나 잘 해라", "안할거임 ㅅㄱ", "ㄴㅈ",
	"내가 너랑 다시 하나 봐라", "안해", "게임 뭣같이하네", "억까겜", "냥냥",
	"탈주함 ㅂㅂ", "이타치가 왜 짱센지 알아? 탈주닌자라서", "ㅇ", ".", "ㅅㄱ",
	"이딴겜"
]
exports.ROBOT_GAME_WIN_MESSAGES = [ //봇이 게임 1등으로 끝냈을 때
	"EZ", "재밌다아~", "나이스~", "나 좀 잘하는듯?", "ㅖㅔㅔㅔ!", "1등이다!", "예스~", "쉽네요",
	 "굿 게임!", "GG", "ㅈㅈ", "재밌네요","즐거웠어요~", "한판 더?"
]
exports.ROBOT_GAME_LOSE_MESSAGES = [ //봇이 게임 꼴찌로 끝냈을 때
	"아잇", "다음엔 꼭 이긴다", "억까겜", "이 판 무효!", "다음판엔 내가 1등할거임 ㅇㅇ",
	"GG", "ㅈㅈ", "한판 더?", "뿌에엥", "살살 좀 해"
]
exports.ROBOT_GAME_MID_MESSAGES = [ //봇이 게임 중간 순위로 끝냈을 때
	 "아쉽네요", "쩝", "재밌네요", "뭔가 느낌 왔는데", "약간 아쉽", "잘하면 1등할듯?",
	 "굿 게임!", "GG", "ㅈㅈ", "재밌네요", "재밌었어요~", "한판 더?"
];
exports.ROBOT_GREET_MESSAGES = [ //봇이 방에 들어올 때 보내는 메시지
	"ㅎㅇㅎㅇ", "ㅎㅇ", "안녕하세요", "안녕하세요~", "한판 해봐요",
	"잘 부탁해요", "하이하이~", "반가워요", "하이~"
];
exports.ROBOT_IDLE_MESSAGES = [ //봇이 게임 끝난 후 대기 중 보내는 메시지
	"ㄹㄷㄹㄷ", "ㄱㄱ", "한판 더!", "빨리 시작해요", "고고",
	"시작!", "빨리빨리~", "ㄱㄱㄱ", "빨리 ㄱㄱ", "한판해요",
];
exports.ROBOT_IDLE2_MESSAGES = [ //봇이 게임 끝난 후 오랫동안 대기 중 보내는 메시지
	"ㄹㄷㄹㄷㄹㄷㄹㄷㄹㄷㄹㄷ", "ㄱㄱㄱㄱㄱㄱㄱ", "아 심심해", "빨리!!!!!",
	"빨리빨리", "ㅁㄴㅇㄹ", "잠수 아니지?",  "빨리 고고", "잔수 쳐내",
	"ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ", "빨리 좀 해요", "ㄹㄷㄹㄷ", "님들 뭐함?",
	"강퇴하실", "ㅃㄹㅃㄹ", "어디감?"
];

exports.MOREMI_PART = ["back", "shoes", "clothes", "head", "eye", "mouth", "lhand", "rhand", "front"];
exports.CATEGORIES = ["all", "spec", "event", "skin", "badge", "head", "eye", "mouth", "clothes", "hs", "back"];
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
	'event': ["eventshop", "eventcol"],
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
		opts: ["man", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "obo", "fho", "alp", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'ESH': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2", "obo", "fho", "alp", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KKT': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "k32", "k22", "k44", "k43", "kch", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "rdu", "vin", "spd", "drg", "spt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "obo", "alp", "itm", "chs", "nsw", "flu", "dfb"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSH': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "rdu", "vin", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "nol", "nos", "no2", "obo", "fho", "alp", "itm", "chs", "nsw", "flu", "jkp", "dfb"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'CSQ': {
		lang: "ko",
		rule: "Jaqwi",
		opts: ["ijp", "vow", "unl", "drg"],
		time: 0.5,
		ai: true,
		big: false,
		ewq: false
	},
	'KCW': {
		lang: "ko",
		rule: "Crossword",
		opts: ["drg"],
		time: 2,
		ai: true,
		big: true,
		ewq: false
	},
	'KTY': {
		lang: "ko",
		rule: "Typing",
		opts: ["prv", "mir", "one", "lng", "ln2", "ln5", "drg"],
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
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "rdu", "vin", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "nol", "nos", "no2", "obo", "fho", "alp", "itm", "chs", "nsw", "flu", "jkp", "dfb"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'EAP': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "dod", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "stt", "fir", "ran", "bbg", "rnt", "sur", "nol", "nos", "no2", "obo", "fho", "alp", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},

	'HUN': {
		lang: "ko",
		rule: "Hunmin",
		opts: ["ext", "mis", "mpl", "eam", "rdm", "loa", "str", "one", "ret", "spd", "drg", "ln3", "bbg", "nar", "god", "rnt", "sur", "obo", "fho", "itm", "chs", "nsw"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KDA': {
		lang: "ko",
		rule: "Daneo",
		opts: ["ijp", "mis", "mpl", "eam", "rdm", "trp", "one", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2", "obo", "fho", "itm", "chs", "nsw"],
		time: 1,
		ai: true,
		ewq: false
	},
	'EDA': {
		lang: "en",
		rule: "Daneo",
		opts: ["ijp", "mis", "rdm", "trp", "one", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2", "obo", "fho", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSS': {
		lang: "ko",
		rule: "Sock",
		opts: ["no2", "big", "drg", "apl", "nsw"],
		time: 1,
		ai: true,
		big: true,
		ewq: false
	},
	'ESS': {
		lang: "en",
		rule: "Sock",
		opts: ["no2", "big", "drg"],
		time: 1,
		ai: true,
		big: true,
		ewq: false
	},
	'KPQ': {
		lang: "ko",
		rule: "Picture",
		opts: ["ijp", "ctc", "drg", "ord", "shf"],
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
		opts: ["ext", "mis", "mpl", "eam", "rdm", "one", "unk", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2", "obo", "itm", "chs", "nsw"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EFR': {
		lang: "en",
		rule: "Free",
		opts: ["ext", "mis", "rdm", "one", "unk", "ret", "spd", "drg", "stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2", "obo", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EKK': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "fir", "ran", "ln3", "ln4", "ln6", "ln7", "bbg", "rnt", "sur", "obo", "alp", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EPQ': {
		lang: "en",
		rule: "Picture",
		opts: ["ijp", "drg", "ord", "shf"],
		time: 2,
		ai: false,
		big: true,
		ewq: false
	},
	'KAK': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "k32", "k22", "k44", "k43", "kch", "unk", "one", "ret", "mid", "sch", "fdu", "ndu", "rdu", "vin", "spd", "drg", "spt", "fir", "ran", "bbg", "nar", "god", "apd", "rnt", "sur", "obo", "alp", "itm", "chs", "nsw", "flu", "dfb"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'EAK': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "dod", "ext", "mis", "rdm", "unk", "one", "ret", "mid", "sch", "spd", "drg", "spt", "fir", "ran", "ln3", "ln4", "ln6", "ln7", "bbg", "sur", "obo", "alp", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'KKU': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "gen", "shi", "etq", "ext", "mis", "mpl", "eam", "rdm", "loa", "str", "unk", "one", "mid", "sch", "spd", "drg", "stt", "fir", "bbg", "nar", "god", "apd", "rnt", "sur", "obo", "fho", "alp", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'CRL': {
		lang: "etc",
		rule: "Calcrelay",
		opts: ["spd", "one", "drg", "nar", "god", "rnt", "sur", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KCB': {
		lang: "ko",
		rule: "Chainbattle",
		opts: ["ext", "str", "loa", "one", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'ECB': {
		lang: "en",
		rule: "Chainbattle",
		opts: ["ext", "one", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'CAL': {
		lang: "etc",
		rule: "Calcbattle",
		opts: ["one", "drg", "obk"],
		time: 1,
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
	},
	'ESQ': {
		lang: "en",
		rule: "Jaqwi",
		opts: ["ijp", "unl", "drg"],
		time: 0.5,
		ai: true,
		big: false,
		ewq: false
	},
	'KPF': {
		lang: "ko",
		rule: "Flip",
		opts: ["nyh", "drg"],
		time: 1,
		ai: true,
		big: true,
		ewq: false
	},
	'EPF': {
		lang: "en",
		rule: "Flip",
		opts: ["nyh", "drg"],
		time: 1,
		ai: true,
		big: true,
		ewq: false
	},
	'KJM': {
		lang: "ko",
		rule: "Classic",
		opts: ["ext", "mis", "rdm", "loa", "str", "one", "ret", "spd", "drg",
			"bbg", "nar", "god", "rnt", "sur", "obo", "itm", "chs", "nsw"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KWR': {
		lang: "ko",
		rule: "Raingame",
		opts: ["mir", "nyh", "drg"],
		time: 2,
		ai: true,
		big: true,
		ewq: false
	},
	'EWR': {
		lang: "en",
		rule: "Raingame",
		opts: ["mir", "nyh", "drg"],
		time: 2,
		ai: true,
		big: true,
		ewq: false
	},
	'KWS': {
		lang: "ko",
		rule: "Wordstack",
		opts: ["ext", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'EWS': {
		lang: "en",
		rule: "Wordstack",
		opts: ["drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'KTT': {
		lang: "ko",
		rule: "Typing",
		opts: ["ijp", "mir", "lng", "ln2", "ln5", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'ETT': {
		lang: "en",
		rule: "Typing",
		opts: ["ijp", "mir", "lng", "drg"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'KTF': {
		lang: "ko",
		rule: "Free",
		opts: ["ijp", "mis", "mpl", "eam", "rdm", "one", "ret", "spd", "drg",
			"stt", "bbg", "nar", "god", "rnt", "sur", "nol", "nos", "no2",
			"obo", "itm", "chs", "nsw"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'ETF': {
		lang: "en",
		rule: "Free",
		opts: ["ijp", "mis", "rdm", "one", "ret", "spd", "drg", "stt", "bbg",
			"nar", "god", "rnt", "sur", "nol", "nos", "no2", "obo", "itm", "chs"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSK': {
		lang: "ko",
		rule: "Shuk",
		opts: ["drg", "stp"],
		time: 1,
		ai: false,
		big: true,
		ewq: false
	},
	'ESK': {
		lang: "en",
		rule: "Shuk",
		opts: ["drg", "stp"],
		time: 1,
		ai: false,
		big: true,
		ewq: false
	}

};
exports.GAME_CATEGORIES = {
	'classic': {
		name: 'GameCategoryClassic',
		modes: ['KKT', 'KSH', 'KJM', 'KAP', 'KAK', 'KKU', 'EKT', 'ESH', 'EKK', 'EAP', 'EAK']
	},
	'quiz': {
		name: 'GameCategoryQuiz',
		modes: ['CSQ', 'KCW', 'KSS', 'ESS', 'KPQ', 'EPQ', 'KSC', 'CRL', 'KQZ', 'EQZ', 'ESQ', 'KSK', 'ESK']
	},
	'other': {
		name: 'GameCategoryOther',
		modes: ['KDA', 'EDA', 'KTY', 'ETY', 'HUN', 'KFR', 'EFR', 'KCB', 'ECB', 'CAL', 'KPF', 'EPF', 'KWR', 'EWR', 'KWS', 'EWS', 'KTT', 'ETT', 'KTF', 'ETF']
	},
	'etc': { //이건뭐지
		name: 'GameCategoryEtc',
		modes: ['CRL']
	}
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
exports.MISSION_jamo = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㅏ', 'ㅐ', 'ㅓ', 'ㅔ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'];

exports.KO_INJEONG = [
	"KRR", "KDI", "KTV", "KBS", 
	"KPT", "KHJ", "KSC", "TPW",
	"BTC", "KOT", "DOT", "ANC", "DGM", "RAG",
	"JLN", "LVL", "LOL", "MAM", "MMM",
	"MCJ", "JAN", "MAP", "MKK", "MNG",
	"MOB", "VAL", "HNK", "BRS", "BLA", "NEX", "INC",
	"COL", "SAO", "HRH", "STA", "OIJ",
	"KGR", "ESB", "ELW", "KMV", "OVW",
	"GNS", "WEB", "UNE", "KPO", 
	"VOC", "ETR", "JAT", "ZEL",
	"CKR", "FUR", "POK", "FRC", "PSK", "HSS",
	"HAI", "KPM", "HDC", "HAR", "HOS", "IMS"
	
];
exports.EN_INJEONG = [
	"LOL", "MCJ"
];
exports.KO_THEME = [
	"30", "40", "60", "80", "90",
	"140", "190", "150", "160",
	"170", "220", "230", "240", "270",
	"310", "320", "350", "360", "420",
	"430", "440", "450", "490", "530", "1001"
];
exports.EN_THEME = [
	"e05", "e08", "e12", "e13", "e15",
	"e18", "e20", "e43"
];
exports.IJP_EXCEPT = [
	"OIJ", "TPW", "40", "MMM", "MKK", "1001", "HRH", "MNG", "LVL", "KGR", "KRR", "DOT"
];
exports.QUIZ_TOPIC = [
	"MATH", "CAPI", "CHEM", "UNIT", "NUMG", "ASTR", "ARTS", "ANML", "GAME", "LITR", "DAJK", "CHTR", "FDCK", "SBTR" /*, "CNTR" */
];
exports.QUIZ_TOPIC_EN = [
	"CAPI", "CHEM", "UNIT", "ASTR", "ARTS", "ANML", "GAME", "LITR", "CHTR", "FDCK", "SBTR" /*, "CNTR" */
];
exports.KO_IJP = exports.KO_THEME.concat(exports.KO_INJEONG).filter(function (item) { return !exports.IJP_EXCEPT.includes(item); });
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
	"나는 {0}다", "{0} 끄돌이", "{0} 끄순이", "{0} 끄투 봇", "끄투잘하고싶어요",
	"완전 물렙", "모레미귀여워", "모레미는세계최강", "유기농 감자", "평범한 끄투러",
	"끄투가좋아", "한판해요", "나는야끄투봇", "일 동안 끄투중", "년 동안 초보",
	"우리집강아지는몹쓸강아지", "내이름은가난돈이없죠", "내이름은고난시련이죠",
	"너는내운명하셨습니다", "레몬나르고빚갚으리오", "슈크림도어가열립니다",
	"우리아이가갈라졌어요", "플란다스의개팥들었슈", "하울의무빙이오지는성",
	"헬리콥터와마법사의똥", "6백만달라는사나이", "꿔바로우많이두개더",
	"내이름은조난당했죠", "넌내게목욕값을줬어", "대추나무사람걸렸네",
	"맨체스터유나의비듬", "미녀는석유를좋아해", "외대맘을홍대는건대",
	"이상한나라의김정은", "잠자는숲속의이봉주", "지키는박사와하인들",
	"엘리베이터를위하여",
	"18K반지의제왕", "넌정말극악무도회", "누구나비닐은있다", "바른먹거리풀먹어",
	"부릅뜨니숲이었어", "아프리카청춘이다", "잠오는숲속의마녀", "조선왕조씰룩쌜룩",
	"킴가산디지털단지", "팁있는다방을싣고", "귀신이고칼로리", "그놈은맛있었다",
	"그리움만싸인회", "남녀칠세부동산", "노스트라단무지", "닥터전자레인지",
	"더블에스오지명", "많이화나그런데", "말죽거리잠옷사", "박수칠때손아파",
	"반지의제왕절개", "발리에서쌩깐일", "백마타고온환자", "버뮤다삼각팬티",
	"소년탐정김정일", "소리없는정우성", "오른쪽이스웨인", "은하철도구부려",
	"이태원큰일나쓰", "전이만갑오개혁", "태정태세문단속", "태정태세비욘세",
	"매관MAGIC", "낙동강효리알", "난닝구머스마", "내자랑4가지","뇌송송계념탁",
	"니콜키크드만", "독수리오년째", "띵호와의증인", "메뚜기쉰라면", "명륜진샤오미",
	"모르는개산책", "미션이빨썩을", "믹서기육천원", "배숙희나빈손", "봉구스박보검",
	"브라운타이즈", "빨간망또라이", "소주소년아톰", "숙취엔견디셔", "신밧드의보험",
	"쌓이면돈이니", "아기공룡둘째", "아줌마가대왕", "안졸리냐졸려", "양들의메밀묵",
	"옥다방고양이", "옷삶아빛나데", "이웃집또털어", "인사없음트롤", "장클로드분당",
	"집수리오형제", "짱구는옷말려", "추적60인분", "축구왕숯갈비", "출산드라블록",
	"카드값줘체리", "클레오빡돌아", "클레오파트너", "탈모엔안제모", "투다리스머프",
	"티끌모아파산", "피자헛둘셋넷", "하도깝쳐체리", "한방쓰면던짐", "헨젤와그랬대",
	"가불의위기", "구타500", "뇌출혈씨티", "달려야하니", "동생방신기", "명란젓코난",
	"바람의점심", "반지하재앙", "발광머리앤", "밥이브라운", "백마탄환자", "브레드피토",
	"비긴이계인", "산드라불독", "이쑤신장군", "쟤시켜알바", "제시간알바", "존트럭불타",
	"초록불고기", "추잡60분", "털민웨이터", "폭행몬스터", "피구왕한무", "피부암통키", 
	"호나우당뇨", "EF손아파", "SG원넓이", "공익인간", "궁민연금", "비달삼순", 
	"순데될라", "아침마담", "콩쥐들쥐", "태조샷건", "휴지필름", "빛과부",
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

exports.isEventActive = function (ev) {
	var now = new Date();
	var start = new Date(ev.start);
	var end = new Date(ev.end);
	if (start.getFullYear() === 1970) {
		var nowMD = now.getMonth() * 100 + now.getDate();
		var startMD = start.getMonth() * 100 + start.getDate();
		var endMD = end.getMonth() * 100 + end.getDate();
		return nowMD >= startMD && nowMD <= endMD;
	}
	return Date.now() >= ev.start && Date.now() <= ev.end;
};

exports.BOT_ITEM_WEIGHTS = {
	// "item_id": weight (default: 10)
	"nekomimi": 20,
	"cuspidal": 3,
	"black_mask": 3,
	"white_mask": 3

};
Object.assign(exports, require('./game-utils'));
