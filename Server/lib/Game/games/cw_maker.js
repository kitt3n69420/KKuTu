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

var WT = require('worker_threads');
var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var LANG = process.argv[2] === 'en' ? 'en' : 'ko';
var MAPS = require('./cw_shapes').MAPS;

// 언어별로 사용하지 않을 모양(패턴) 이름 배열. MAPS[i].queue가 아직 "5003 1103 ..." 원본 문자열일 때(파싱 전) 계산해야 한다.
function countLenSlots(queueStr, len) {
	return queueStr.split(' ').filter(function (token) { return token.charAt(3) === String(len); }).length;
}
function topNShapeNamesByLenCount(maps, len, topN) {
	var counts = maps.map(function (m) { return { name: m.name, count: countLenSlots(m.queue, len) }; });
	var sorted = counts.slice().sort(function (a, b) { return b.count - a.count; });
	var threshold;

	if (sorted.length <= topN) return sorted.map(function (c) { return c.name; });
	threshold = sorted[topN - 1].count; // 상위 topN번째 개수. 동점이면 그 개수 이상은 전부 포함(=전부 제외 대상)
	return counts.filter(function (c) { return c.count >= threshold; }).map(function (c) { return c.name; });
}
function shapeNamesWithLenAtLeast(maps, minLen) {
	// minLen 이상 길이의 단어 칸이 하나라도 있는 모양 이름 목록
	return maps.filter(function (m) {
		return m.queue.split(' ').some(function (token) { return Number(token.charAt(3)) >= minLen; });
	}).map(function (m) { return m.name; });
}
var EXCLUDED_SHAPES = {
	ko: ['럭키세븐','회오리','피젯스피너', '매듭1', '매듭2', '테스트블록', '와플', '수리검', '엔', '거북이', '열대어1', '제트팩', '보도블록', '선풍기','냥'] // 한국어는 제외한 모양 말고 모든 모양을 사용
		.concat(shapeNamesWithLenAtLeast(MAPS, 7)), // 7글자 이상 단어 칸이 있는 모양은 한국어에서 제외
	en: ['냥','게자리', '럭키세븐', '회오리'].concat(topNShapeNamesByLenCount(MAPS, 2, 30)) // 영어는 2글자 칸이 많은 상위 20개(동점 포함) 모양을 제외
};
// 언어별로 크로스워드 답으로 쓰지 않을 금칙어 목록. runWorker()가 동기적으로(디스패치 시점에) 읽으므로 dispatch보다 먼저 선언되어야 한다.
var BASE_WORDS = {
	ko: [
		"성교", "음경", "지랄", "불알", "자위", "자지", "보지", "보장지", "개새끼", "성관계", "창녀",
		"시발", "항문", "음순", "정액", "애액", "지랄병", "지랄버릇", "미친놈", "섹스", "섹스텟", "수자해좆", "교미", "발정", "발정기",
		"노무현", "윤석열", "이재명", "김문수", "무현"
	],
	en: [
		"fuck", "fucking", "fucked", "fucker", "motherfucker", "shit", "shitty", "bullshit",
		"bitch", "bastard", "asshole", "dick", "cock", "pussy", "cunt", "whore", "slut",
		"nigger", "nigga", "faggot", "fag", "retard", "sex", "sexy", "cum", "cumming",
		"porn", "rape", "penis", "vagina", "boob", "boobs", "tits", "nazi", "hitler"
	]
};
var words = new Set(); // 이 코어가 사용한 단어 목록(코어별 독립). runWorker()에서 언어별 BASE_WORDS로 채워짐.

if (WT.isMainThread) {
	runMain();
} else {
	runWorker();
}

// ===== 메인 스레드: 코어 개수 입력 받고, 기존 저장된 퍼즐 개수(MC)를 한 번만 집계한 뒤 워커를 띄운다 =====
function runMain() {
	var readline = require('readline');
	var os = require('os');
	var maxCores = os.cpus().length;
	var rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	rl.question("사용할 코어 개수를 입력하세요 (1~" + maxCores + ", 기본값 " + maxCores + "): ", function (answer) {
		var coreCount = parseInt(answer, 10);

		rl.close();
		if (!coreCount || coreCount < 1) coreCount = maxCores;
		if (coreCount > maxCores) coreCount = maxCores;
		seedSharedCounts(coreCount);
	});
}
function seedSharedCounts(coreCount) {
	var DB = require('../../Web/db');
	var mcBuffer = new SharedArrayBuffer(MAPS.length * 4);
	var failBuffer = new SharedArrayBuffer(MAPS.length * 4);
	var sharedMC = new Int32Array(mcBuffer);
	var mapIndex = {};
	var i;

	for (i = 0; i < MAPS.length; i++) mapIndex[MAPS[i].name] = i;

	DB.ready = function () {
		DB.kkutu_cw[LANG].find().on(function ($res) {
			var i, idx;

			for (i in $res) {
				idx = mapIndex[$res[i].map];
				if (idx !== undefined) Atomics.add(sharedMC, idx, 1);
			}
			spawnWorkers(coreCount, mcBuffer, failBuffer);
		});
	};
}
function spawnWorkers(coreCount, mcBuffer, failBuffer) {
	var i;

	console.log("[MAIN] 코어 " + coreCount + "개로 " + LANG + " 십자말풀이 생성을 시작합니다.");
	for (i = 0; i < coreCount; i++) spawnOne(i);

	function spawnOne(coreId) {
		var worker = new WT.Worker(__filename, {
			workerData: { coreId: coreId, solo: coreCount === 1, lang: LANG, sharedMC: mcBuffer, sharedFAIL: failBuffer }
		});

		worker.on('error', function (err) {
			console.log("[MAIN] Core " + coreId + " 오류: " + err.stack);
		});
		worker.on('exit', function (code) {
			console.log("[MAIN] Core " + coreId + " 종료(code " + code + ")");
		});
	}
}

// ===== 워커 스레드: 실제 퍼즐 생성. words/POOL/실패 스트릭 등은 코어마다 완전히 독립, MC/FAIL만 공유 =====
var CORE_ID, SOLO, sharedMC, sharedFAIL, MAP_INDEX, DB;

function runWorker() {
	var data = WT.workerData;
	var i;

	CORE_ID = data.coreId;
	SOLO = data.solo;
	LANG = data.lang; // worker_threads는 process.argv를 물려받지 않으므로 메인 스레드가 넘겨준 값을 써야 한다.
	words = new Set(BASE_WORDS[LANG]);
	sharedMC = new Int32Array(data.sharedMC);
	sharedFAIL = new Int32Array(data.sharedFAIL);
	MAP_INDEX = {};
	for (i = 0; i < MAPS.length; i++) MAP_INDEX[MAPS[i].name] = i;

	DB = require('../../Web/db');

	DB.ready = function () {
		var i;

		for (i in MAPS) {
			MAPS[i].queue = MAPS[i].queue.split(' ').map(function (item) { return item.split(''); });
		}
		loadWordPool(LANG).then(function (pool) {
			POOL = pool;
			DB.kkutu_cw[LANG].find().on(function ($res) {
				var j, lis, q;

				for (i in $res) {
					lis = $res[i].data.split('|');
					for (j in lis) {
						q = lis[j].slice(8);
						words.add(q);
					}
				}
				if (isTargetReached()) {
					log("[DONE] " + renderBar(getTotalCount(), TARGET, 30));
					process.exit(0);
					return;
				}
				doMining();
			});
		});
		function doMining() {
			getBoard(LANG).then(function (data) {
				var j, o, s, t;
				var res = [];

				if (!data.board) {
					if (failInc(data.map.name) >= FAIL_LIMIT) {
						log("[WARN] " + data.map.name + " 모양이 " + FAIL_LIMIT + "번 이상 실패해 이후 선택에서 제외됩니다.");
					}
					lastFailedMap = data.map.name;

					consecutiveFails++;
					if (consecutiveFails >= CONSECUTIVE_FAIL_LIMIT) {
						log("[WARN] " + CONSECUTIVE_FAIL_LIMIT + "회 연속 실패 - 사용 단어 목록과 모양별 실패 카운터를 초기화합니다.");
						resetWords();
						consecutiveFails = 0;
					}

					totalFails++;
					if (totalFails >= TOTAL_FAIL_LIMIT) {
						log("[WARN] 누적 " + TOTAL_FAIL_LIMIT + "회 실패 - 사용 단어 목록과 모양별 실패 카운터를 초기화합니다.");
						resetWords();
						totalFails = 0;
					}
					setTimeout(doMining, 0);
					return;
				}
				consecutiveFails = 0;
				log(data.map.name + "\n  0 1 2 3 4 5 6 7");
				for (i = 0; i < 8; i++) {
					s = i + " ";
					for (j = 0; j < 8; j++) {
						if (o = data.board[`${j},${i}`]) {
							s += LANG === 'en' ? (o.char + " ") : o.char;
						} else {
							s += LANG === 'en' ? "  " : "　";
						}
					}
					log(s);
				}
				for (i in data.map.queue) {
					s = data.map.queue[i];
					t = data.board[`${s[0]},${s[1]}`];
					for (j in t.chain) {
						o = t.chain[j];
						if (o.pos[2] == s[2]) break;
					}
					res.push([s[0], s[1], s[2], s[3], o.word]);
				}
				mcInc(data.map.name);
				DB.kkutu_cw[LANG].insert(['map', data.map.name], ['data', res.map(function (item) { return item.join(','); }).join('|')]).on();
				log(renderBar(getTotalCount(), TARGET, 30));
				if (isTargetReached()) {
					log("[DONE]");
					process.exit(0);
					return;
				}
				setTimeout(doMining, 500);
			});
		}
	};
}

var FAIL_LIMIT = 5; // 이 횟수 이상 실패한 모양은 선택에서 제외
var lastFailedMap = null; // 이 코어가 직전에 실패한 모양 이름(바로 다음 선택에서만 한 번 제외해 다른 모양으로 넘어가게 함)
var consecutiveFails = 0; // 이 코어가 성공 없이 연속으로 실패한 횟수
var CONSECUTIVE_FAIL_LIMIT = 5; // 연속 실패가 이 횟수에 도달하면 words와 FAIL을 초기화
var totalFails = 0; // 이 코어의, 연속 여부와 무관한 누적 실패 횟수(성공해도 리셋되지 않음)
var TOTAL_FAIL_LIMIT = 20; // 누적 실패가 이 횟수에 도달하면 words를 초기화
var GENERATE_TIMEOUT = 30000; // 퍼즐 한 판 생성에 이 시간(ms)이 넘게 걸리면 포기(=FAIL 카운터 증가 조건)
var TARGET = 1000; // 언어(LANG)별 전체 퍼즐(kkutu_cw 행) 목표 개수. 코어 간 공유되는 MC 합으로 판정.
var POOL = null; // { [lang]로 필터링된 단어를 길이별로 묶어 hit 내림차순 정렬한 캐시. 이 코어에서 1회 로드. }

function log(msg) {
	console.log("[Core " + CORE_ID + "] " + msg);
}
// ===== MC(모양별 저장된 퍼즐 개수)/FAIL(모양별 실패 횟수): 코어 간 SharedArrayBuffer로 공유 =====
function mcGet(name) {
	return Atomics.load(sharedMC, MAP_INDEX[name]);
}
function mcInc(name) {
	Atomics.add(sharedMC, MAP_INDEX[name], 1);
}
function failGet(name) {
	return Atomics.load(sharedFAIL, MAP_INDEX[name]);
}
function failInc(name) {
	return Atomics.add(sharedFAIL, MAP_INDEX[name], 1) + 1;
}
function failResetAll() {
	var i;

	for (i = 0; i < sharedFAIL.length; i++) Atomics.store(sharedFAIL, i, 0);
}
function getTotalCount() {
	var i, total = 0;

	for (i = 0; i < sharedMC.length; i++) total += Atomics.load(sharedMC, i);
	return total;
}
function isTargetReached() {
	return getTotalCount() >= TARGET;
}
function renderBar(current, total, width) {
	var ratio = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 1;
	var filled = Math.round(width * ratio);

	return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "] " + current + "/" + total;
}
function resetWords() {
	words = new Set(BASE_WORDS[LANG]);
	failResetAll(); // 모양별 실패 카운터(제외 패턴 목록)도 함께 초기화 - 공유 자원이라 전체 코어에 적용됨
}

function random(a, b) {
	// [a ~ b) 범위 정수
	return a + Math.floor(Math.random() * (b - a));
}
function getMap() {
	/* 희소 행렬 표기법
		[ x, y, 세로?, 길이 ]
	*/
	var i, candidates;
	var excludeName = lastFailedMap;
	var excludedShapes = EXCLUDED_SHAPES[LANG] || [];

	lastFailedMap = null; // 직전 실패 모양은 이번 한 번만 제외한다.

	function collect(skipFail, skipLast) {
		var res = [];
		var best = 99999999;

		for (i in MAPS) {
			if (excludedShapes.indexOf(MAPS[i].name) !== -1) continue;
			if (skipFail && failGet(MAPS[i].name) >= FAIL_LIMIT) continue;
			if (skipLast && MAPS[i].name === excludeName) continue;
			if (mcGet(MAPS[i].name) < best) {
				best = mcGet(MAPS[i].name);
				res = [i];
			} else if (mcGet(MAPS[i].name) === best) {
				res.push(i);
			}
		}
		return res;
	}

	candidates = collect(true, true);
	// 제외 조건 때문에 고를 게 없으면 단계적으로 제외를 풀고 다시 고른다.
	if (!candidates.length) candidates = collect(true, false);
	if (!candidates.length) candidates = collect(false, false);

	return MAPS[candidates[random(0, candidates.length)]];
}
var CW_POS = new RegExp("(^|,)(1|8)(,|$)"); // 명사(1) 또는 부사(8)
var CW_BAD_FLAG = Const.KOR_FLAG.INJEONG | Const.KOR_FLAG.SATURI | Const.KOR_FLAG.OLD | Const.KOR_FLAG.MUNHWA; // 어인정|방언|옛말|북한말
var CW_POS_EN = new RegExp("(^|,)[nvasr](,|$)"); // WordNet 품사표기: n=명사, v=동사, a/s=형용사, r=부사
var PURE_ALPHA = new RegExp("^[A-Za-z]+$"); // 띄어쓰기/숫자/문장부호 없이 알파벳만
var MEAN = ['mean', new RegExp("^.{9}[^=→][^\.]{15}")];
var NO_BUL = new RegExp("^(500|210|120|10)$");
function isBadAdverb(doc) {
	// 명사 자격이 없는 순수 부사이면서 '이'/'히'로 끝나는 단어는 제외
	var isNoun = /(^|,)1(,|$)/.test(doc.type);
	var isAdverb = /(^|,)8(,|$)/.test(doc.type);
	if (isNoun || !isAdverb) return false;
	return /[이히]$/.test(doc._id);
}
// 보드 상태와 무관한 정적 조건(품사/flag/theme/mean)은 여기서 한 번만 조회해 길이별로 묶어둔다.
function loadWordPool(lang) {
	var R = new Lizard.Tail();
	var conditions = [
		['theme', { $not: NO_BUL }],
		MEAN
	];

	if (lang === 'ko') {
		conditions.push(['type', CW_POS], ['flag', { $nand: CW_BAD_FLAG }]);
	} else {
		conditions.push(['type', CW_POS_EN], ['_id', PURE_ALPHA]);
	}
	DB.kkutu[lang].find.apply(DB.kkutu[lang], conditions).on(function ($docs) {
		var pool = {};
		var i, doc, id;

		for (i in $docs) {
			doc = $docs[i];
			if (lang === 'ko' && isBadAdverb(doc)) continue;
			id = doc._id;
			(pool[id.length] || (pool[id.length] = [])).push(doc);
		}
		for (i in pool) pool[i].sort(function (a, b) { return b.hit - a.hit; });
		R.go(pool);
	});
	return R;
}
// 슬롯 패턴(reg)에 맞는 후보를 메모리 풀에서 hit 내림차순으로 찾는다. (words에 이미 쓰인 단어는 제외)
function matchPool(pool, len, reg) {
	var list = pool[len];
	var re, i, doc;
	var res = [];

	if (!list) return res;
	re = new RegExp("^" + reg + "$");
	for (i = 0; i < list.length; i++) {
		doc = list[i];
		if (words.has(doc._id)) continue;
		if (re.test(doc._id)) res.push(doc);
	}
	return res;
}
function getBoard(lang) {
	var R = new Lizard.Tail();
	var board = {};
	var map = getMap();
	var queue = map.queue.slice(0);
	var regCache = {};
	var pool = POOL;
	var totalSlots = queue.length;
	var placed = 0;
	var startTime = Date.now();
	var placedWords = new Set(); // 이번 getBoard 호출에서 words에 추가한 단어(포기 시 반납용)
	var i, m, arg, reg, p, k, pick, obj, j, l, n;

	while (queue.length) {
		if (Date.now() - startTime > GENERATE_TIMEOUT) {
			placedWords.forEach(function (w) { words.delete(w); });
			if (SOLO) process.stdout.write("\n");
			log("[WARN] " + map.name + " 모양이 " + (GENERATE_TIMEOUT / 1000) + "초 안에 채워지지 않아 포기합니다.");
			R.go({ map: map, board: null });
			return R;
		}
		m = queue.shift();
		arg = [];
		reg = "";

		p = [m[0], m[1]];
		for (i = 0; i < m[3]; i++) {
			k = p.join(',');
			if (board[k]) {
				arg.push(board[k].chain);
				reg += board[k].char;
			}
			else reg += ".";
			p[m[2]]++;
		}
		if (!regCache[reg]) regCache[reg] = matchPool(pool, m[3], reg);
		pick = regCache[reg].shift();

		if (pick && !words.has(pick._id)) {
			obj = {};
			obj.word = pick._id;
			obj.mean = pick.mean;
			obj.pos = m;
			p = [m[0], m[1]];
			for (j = 0; j < m[3]; j++) {
				k = p.join(',');
				if (!board[k]) board[k] = { chain: {}, char: obj.word.charAt(j) };
				board[k].chain[obj.word] = obj;
				p[m[2]]++;
			}
			words.add(obj.word);
			placedWords.add(obj.word);
			placed++;
		} else {
			queue.push(m);
			for (j in arg) {
				for (n in arg[j]) {
					// arg[j][k]를 지운다
					queue.push(m = arg[j][n].pos);
					p = [m[0], m[1]];
					for (l = 0; l < m[3]; l++) {
						k = p.join(',');
						delete board[k].chain[n];
						if (!Object.keys(board[k].chain).length) delete board[k];
						p[m[2]]++;
					}
					words.delete(n);
					placedWords.delete(n);
					placed--;
				}
			}
		}
		if (SOLO) process.stdout.write("\r\x1b[2K" + renderBar(placed, totalSlots, 30));
	}
	if (SOLO) process.stdout.write("\n");
	R.go({ map: map, board: board });
	return R;
}
