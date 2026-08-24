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
var fs = require('fs');
var path = require('path');
var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var LANG = process.argv[2] === 'en' ? 'en' : 'ko';
var SOURCE_ARG = (process.argv[3] === 'arcade' || process.argv[3] === 'dic') ? process.argv[3] : 'main';
var MAPS = require('./cw_shapes').MAPS;

if (LANG !== 'ko' && SOURCE_ARG !== 'main') {
	console.log("[MAIN] arcade/dic 소스는 한국어(ko) 전용입니다. main으로 되돌립니다.");
	SOURCE_ARG = 'main';
}

// ===== 아케이드/기초사전 소스 데이터 로딩 (main/worker 스레드 공용) =====
var CW_DATA_DIR = process.env.CW_DATA_DIR || path.join(__dirname, '..', '..', '..', '..', '..', 'crossword_db');
var ARCADE_TSV = path.join(CW_DATA_DIR, 'arcade_final.tsv');
var BASICDICT_CSV = path.join(CW_DATA_DIR, 'basicdict_final.csv');
var MIN_BATCH = 1500; // 코어 하나가 "우선순위"를 유지하며 작업하기에 충분하다고 보는 최소 단어 풀 크기

function stripBOM(s) { return s.replace(/^﻿/, ''); }
function loadTSV(filePath) {
	var lines = stripBOM(fs.readFileSync(filePath, 'utf8')).split(/\r?\n/).filter(function (l) { return l.length; });
	return lines.map(function (line) {
		var parts = line.split('\t');
		return { _id: parts[0] };
	});
}
function parseCSVLine(line) {
	// 간단한 RFC4180 파서: "..."로 감싼 필드 안의 콤마는 리터럴, ""는 이스케이프된 "
	var fields = [], cur = '', inQuotes = false, i, c;
	for (i = 0; i < line.length; i++) {
		c = line.charAt(i);
		if (inQuotes) {
			if (c === '"') { if (line.charAt(i + 1) === '"') { cur += '"'; i++; } else inQuotes = false; }
			else cur += c;
		} else {
			if (c === '"') inQuotes = true;
			else if (c === ',') { fields.push(cur); cur = ''; }
			else cur += c;
		}
	}
	fields.push(cur);
	return fields;
}
function loadCSV(filePath) {
	var lines = stripBOM(fs.readFileSync(filePath, 'utf8')).split(/\r?\n/).filter(function (l) { return l.length; });
	lines.shift(); // 헤더(표제어,등급,뜻풀이) 제거
	return lines.map(function (line) {
		var f = parseCSVLine(line);
		return { _id: f[0], grade: f[1] };
	});
}
function shuffle(arr) {
	var res = arr.slice(0), i, j, t;
	for (i = res.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		t = res[i]; res[i] = res[j]; res[j] = t;
	}
	return res;
}
// coreCount개의 워커에 리스트를 배분: G(<=coreCount)명씩 묶은 "사이클"마다 전체를 새로 셔플해서 G등분.
// 코어가 G보다 많으면 다음 사이클도 독립적으로 재셔플(같은 배치를 재사용하지 않음).
function buildCycledPartitions(list, coreCount) {
	var N = list.length;
	var G = Math.min(coreCount, Math.max(1, Math.floor(N / MIN_BATCH)));
	var cycles = Math.ceil(coreCount / G);
	var result = new Array(coreCount);
	var cycle, shuffled, per, g, coreId;

	for (cycle = 0; cycle < cycles; cycle++) {
		shuffled = shuffle(list);
		per = Math.ceil(N / G);
		for (g = 0; g < G; g++) {
			coreId = cycle * G + g;
			if (coreId >= coreCount) break;
			result[coreId] = shuffled.slice(g * per, (g + 1) * per);
		}
	}
	return result;
}
// 풀이 작아서(MIN_BATCH 미만) 코어끼리 나누면 길이별 후보가 바닥나는 경우 전용: 나누지 않고
// 코어마다 전체를 독립적으로 재셔플해서 받는다(코어 간 단어 중복 허용 - 전체 다양성보다 코어별 성공률이 우선).
function buildFullPerCore(pool, coreCount) {
	var result = new Array(coreCount);
	var c;

	for (c = 0; c < coreCount; c++) result[c] = shuffle(pool);
	return result;
}
var PRUNE_KEEP_RATIO = 0.85; // 연결성 하위 15% 제거 - 이미 후보가 충분한 길이대에서만 씀(모자란 길이대는 절대 건드리지 않음)
// list 안에서 각 글자가 몇 개 단어에 등장하는지 센다(단어당 같은 글자는 한 번만 카운트).
function charFreqMap(list) {
	var freq = {}, i, j, w, c, seen;

	for (i = 0; i < list.length; i++) {
		w = list[i]._id;
		seen = {};
		for (j = 0; j < w.length; j++) {
			c = w.charAt(j);
			if (seen[c]) continue;
			seen[c] = true;
			freq[c] = (freq[c] || 0) + 1;
		}
	}
	return freq;
}
// 단어의 "연결성" 점수 = 그 단어를 이루는 (중복 제거한) 글자들이 풀 전체에서 평균적으로 얼마나 흔한가.
// 낮을수록 다른 단어와 교차할 가능성이 낮은 "고립 단어".
function connectivityScore(word, freq) {
	var i, c, seen = {}, sum = 0, uniq = 0;

	for (i = 0; i < word.length; i++) {
		c = word.charAt(i);
		if (seen[c]) continue;
		seen[c] = true;
		sum += freq[c] || 0;
		uniq++;
	}
	return sum / uniq;
}
// 연결성이 낮은 단어(다른 단어와 공유하는 글자가 적은 단어)부터 제거해 매칭 스캔/백트래킹 비용을 줄인다.
// 글자 빈도는 universe(교차 상대가 될 수 있는 전체 단어 - 길이 무관) 기준으로 재고, 실제로 쳐내는 건 candidates에서만 한다.
function pruneLowConnectivity(candidates, keepRatio, universe) {
	var freq = charFreqMap(universe || candidates);
	var scored = candidates.map(function (w) { return { w: w, score: connectivityScore(w._id, freq) }; });

	scored.sort(function (a, b) { return b.score - a.score; });
	return scored.slice(0, Math.round(candidates.length * keepRatio)).map(function (s) { return s.w; });
}
// list를 연결성 점수 내림차순으로 정렬한다 - matchPool은 같은 길이 버킷 안에서 앞에 오는 단어를 먼저 시도하므로,
// 이렇게 정렬해두면 매칭 시 항상 연결성 높은(교차하기 쉬운) 단어부터 쓰이고, words 제외 로직에 의해
// 그 단어가 소진되면 자연스럽게 다음으로 연결성 높은 단어로 넘어간다.
function sortByConnectivity(list, universe) {
	var freq = charFreqMap(universe || list);

	return list.map(function (w) { return { w: w, score: connectivityScore(w._id, freq) }; })
		.sort(function (a, b) { return b.score - a.score; })
		.map(function (s) { return s.w; });
}
function buildWorkerPools(source, coreCount) {
	var all, rows, cho, jung, choShares, jungShares, short, long, shortShares, longShares;

	if (source === 'arcade') {
		all = loadTSV(ARCADE_TSV);
		// 4글자 이상은 전체 10,139개 중 1,945개(19%)뿐이라 비례 분할하면 코어당 후보가 너무 적어진다.
		// 2~3글자(8,194개)는 충분하니 기존 사이클 분할, 4글자 이상만 코어마다 전체를 재셔플해서 보강한다.
		short = all.filter(function (r) { return r._id.length <= 3; });
		long = all.filter(function (r) { return r._id.length >= 4; });
		// 2~3글자는 이미 충분히 많아 매칭 스캔/백트래킹 비용이 큰 쪽 - 다른 단어와 공유 글자가 적은
		// 하위 15%(연결성 낮은=고립 단어)를 미리 쳐낸다. 4글자 이상(long)은 원래도 부족해 손대지 않는다.
		short = pruneLowConnectivity(short, PRUNE_KEEP_RATIO, all);
		shortShares = buildCycledPartitions(short, coreCount);
		longShares = buildFullPerCore(long, coreCount);
		// 연결성 내림차순 정렬 - 길이 구분 없이 통째로 정렬해도 무방(아케이드는 초급/중급 같은 등급 우선순위가 없음).
		return shortShares.map(function (s, i) { return sortByConnectivity(s.concat(longShares[i]), all); });
	}
	if (source === 'dic') {
		rows = loadCSV(BASICDICT_CSV);
		cho = rows.filter(function (r) { return r.grade === '초급'; });
		// 예전엔 중급을 4글자 이상만 썼다(2~3글자는 초급 1,122개로 "개수는" 충분하다고 판단했음).
		// 그런데 실측해보니 슬롯이 전부 2~3글자뿐인 모양(예: 울타리)도 계속 막혔다 - 개수는 충분해도
		// 초급 단어들끼리 공유하는 글자 조합이 부족(연결 다양성 부족)해서 생기는 문제로 보여, 중급 전체를 다 쓴다.
		// 연결성 낮은 단어가 섞여도 sortByConnectivity가 뒤로 밀어주므로 손해는 없다.
		jung = rows.filter(function (r) { return r.grade === '중급'; });
		choShares = buildFullPerCore(cho, coreCount);
		jungShares = buildFullPerCore(jung, coreCount);
		// 초급 배정분을 먼저, 중급 배정분을 나중에 이어붙임 - 길이별 버킷 내 순서가 matchPool의
		// 우선순위(먼저 오는 후보가 먼저 뽑힘)를 그대로 결정하므로 이 순서만으로 "초급 우선" 달성.
		// 각 등급 안에서는 연결성 내림차순으로 정렬(등급 우선순위는 그대로 유지 - 정렬은 그룹 안에서만).
		return choShares.map(function (choShare, i) {
			return sortByConnectivity(choShare, rows).concat(sortByConnectivity(jungShares[i], rows));
		});
	}
	return null; // 'main'은 기존 loadWordPool() 경로 사용
}
function buildPoolFromDocs(docs) {
	var pool = {}, i, len;
	for (i = 0; i < docs.length; i++) {
		len = docs[i]._id.length;
		(pool[len] || (pool[len] = [])).push(docs[i]);
	}
	return pool;
}

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
	// 아케이드/기초사전: 후보 단어가 2~5글자뿐이므로 6글자 이상 칸이 있는 모양도 추가로 제외
	ko_sub: ['럭키세븐','회오리','피젯스피너', '매듭1', '매듭2', '테스트블록', '와플', '수리검', '엔', '거북이', '열대어1', '제트팩', '보도블록', '선풍기','냥']
		.concat(shapeNamesWithLenAtLeast(MAPS, 6)),
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
		DB.kkutu_cw[LANG].find(['source', SOURCE_ARG]).on(function ($res) { // 소스별로만 카운트(전체를 세면 다른 소스 행까지 섞임)
			var i, idx;

			for (i in $res) {
				idx = mapIndex[$res[i].map];
				if (idx !== undefined) Atomics.add(sharedMC, idx, 1);
			}
			var pools = SOURCE_ARG === 'main' ? null : buildWorkerPools(SOURCE_ARG, coreCount);
			spawnWorkers(coreCount, mcBuffer, failBuffer, pools);
		});
	};
}
function spawnWorkers(coreCount, mcBuffer, failBuffer, pools) {
	var i;

	console.log("[MAIN] 코어 " + coreCount + "개로 " + LANG + " (" + SOURCE_ARG + ") 십자말풀이 생성을 시작합니다.");
	for (i = 0; i < coreCount; i++) spawnOne(i);

	function spawnOne(coreId) {
		var worker = new WT.Worker(__filename, {
			workerData: {
				coreId: coreId, solo: coreCount === 1, lang: LANG, source: SOURCE_ARG,
				sharedMC: mcBuffer, sharedFAIL: failBuffer,
				wordPoolDocs: pools ? pools[coreId] : null
			}
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
var CORE_ID, SOLO, sharedMC, sharedFAIL, MAP_INDEX, DB, SOURCE, EXCLUDED_KEY;

function runWorker() {
	var data = WT.workerData;
	var i;

	CORE_ID = data.coreId;
	SOLO = data.solo;
	LANG = data.lang; // worker_threads는 process.argv를 물려받지 않으므로 메인 스레드가 넘겨준 값을 써야 한다.
	SOURCE = data.source;
	TARGET = (SOURCE === 'main') ? 1000 : 500;
	EXCLUDED_KEY = (SOURCE === 'main') ? LANG : 'ko_sub';
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
		if (data.wordPoolDocs) {
			POOL = buildPoolFromDocs(data.wordPoolDocs);
			POOL_INDEX = buildPoolIndex(POOL);
			afterPoolReady();
		} else {
			loadWordPool(LANG).then(function (pool) {
				POOL = pool;
				POOL_INDEX = buildPoolIndex(POOL);
				afterPoolReady();
			});
		}
		function afterPoolReady() {
			function proceed() {
				if (isTargetReached()) {
					log("[DONE] " + renderBar(getTotalCount(), TARGET, 30));
					process.exit(0);
					return;
				}
				doMining();
			}
			if (SOURCE !== 'main') {
				// arcade/dic은 어휘 자체가 작아(기초사전 4글자 이상 746개뿐) 이전에 만들어둔 보드에 쓰인 단어까지
				// 시작하자마자 영구 제외해버리면, DB에 보드가 쌓일수록 새 워커가 시작할 때부터 남은 어휘가
				// 점점 줄어들어 생성이 갈수록 느려진다(WORD_RESET_BOARD_INTERVAL로 세션 안 재사용은 허용해뒀지만
				// 시작 지점 자체가 이미 고갈돼 있으면 그 리셋이 도움이 될 기회조차 못 얻는다).
				// 그래서 시작 시점엔 기존 보드에 쓰인 단어를 전혀 제외하지 않는다(판 내부 중복은 여전히 불가능).
				proceed();
				return;
			}
			// main은 어휘가 85,011개로 충분해 이미 쓰인 단어를 계속 피해도 고갈될 걱정이 없다 - 기존처럼 유지.
			DB.kkutu_cw[LANG].find(['source', SOURCE]).on(function ($res) {
				var j, lis, q;

				for (i in $res) {
					lis = $res[i].data.split('|');
					for (j in lis) {
						q = lis[j].slice(8);
						words.add(q);
					}
				}
				proceed();
			});
		}
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
				if (SOURCE !== 'main') {
					boardsSinceWordReset++;
					if (boardsSinceWordReset >= WORD_RESET_BOARD_INTERVAL) {
						words = new Set(BASE_WORDS[LANG]);
						boardsSinceWordReset = 0;
					}
				}
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
				// insert 완료(DB 반영)를 기다린 뒤에 진행률 판단/exit - 콜백 없이 fire-and-forget하면
				// 쿼리가 실제 DB에 반영되기 전에 process.exit()이 먼저 실행돼 마지막 행이 유실될 수 있다.
				DB.kkutu_cw[LANG].insert(['map', data.map.name], ['data', res.map(function (item) { return item.join(','); }).join('|')], ['source', SOURCE]).on(function () {
					log(renderBar(getTotalCount(), TARGET, 30));
					if (isTargetReached()) {
						log("[DONE]");
						process.exit(0);
						return;
					}
					setTimeout(doMining, 500);
				});
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
// arcade/dic는 어휘 자체가 작아(예: 기초사전 4글자 이상 746개) 500판을 채우려면 단어 재사용이 불가피하다.
// 그래서 실패와 무관하게 이 판 수마다 words만 초기화해 재사용을 허용한다(판 내부 중복은 matchPool의 words.has() 검사로 항상 방지되므로 안전).
// FAIL(모양별 실패 횟수)은 건드리지 않는다 - 그건 "이 모양 자체가 어렵다"는 정보라 words 재사용 주기와는 별개로 계속 누적되어야 한다.
var WORD_RESET_BOARD_INTERVAL = 3;
var boardsSinceWordReset = 0;
var GENERATE_TIMEOUT = 45000; // 퍼즐 한 판 생성에 이 시간(ms)이 넘게 걸리면 포기(=FAIL 카운터 증가 조건)
var TARGET; // 소스별 전체 퍼즐(kkutu_cw 행) 목표 개수 - runWorker()에서 SOURCE에 따라 설정(main=1000, arcade/dic=500). 코어 간 공유되는 MC 합으로 판정.
// 주의: 이 파일은 워커 스레드 진입 시 위쪽(line 68 부근) if(WT.isMainThread) 분기에서 runWorker()를 이미 호출한 뒤
// 이 줄까지 순차 실행되므로, 여기서 초기값을 대입하면 runWorker() 안에서 SOURCE별로 설정한 값을 덮어써버린다.
// TARGET은 반드시 runWorker() 안에서만 대입한다(메인 스레드 코드는 TARGET을 참조하지 않음).
var POOL = null; // { [lang]로 필터링된 단어를 길이별로 묶어 hit 내림차순 정렬한 캐시. 이 코어에서 1회 로드. }
var POOL_INDEX = null; // POOL과 함께 1회 구축. { 길이: [ {글자: [해당 위치에 그 글자가 오는 단어들]}, ... 위치별 ] } - matchPool이 전체를 순회하지 않고 이 색인으로 후보를 좁히는 데 씀.

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
	var excludedShapes = EXCLUDED_SHAPES[EXCLUDED_KEY] || [];

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
// POOL 구축 시 1회만 만드는 색인: 길이별로, 각 자리(위치)에 특정 글자가 오는 단어 목록을 미리 묶어둔다.
// { 길이: [ {글자: [단어들]}, ... 위치 0,1,2... 순 ] }
function buildPoolIndex(pool) {
	var index = {}, len, list, byPos, i, doc, w, p, c;

	for (len in pool) {
		list = pool[len];
		byPos = [];
		for (p = 0; p < Number(len); p++) byPos.push({});
		for (i = 0; i < list.length; i++) {
			doc = list[i];
			w = doc._id;
			for (p = 0; p < w.length; p++) {
				c = w.charAt(p);
				(byPos[p][c] || (byPos[p][c] = [])).push(doc);
			}
		}
		index[len] = byPos;
	}
	return index;
}
// 슬롯 패턴(reg)에 맞는 후보를 찾는다. (words에 이미 쓰인 단어는 제외)
// 예전엔 pool[len] 전체를 순회하며 정규식을 검사했다(O(그 길이의 전체 후보 수)).
// 지금은 POOL_INDEX에서 이미 확정된 글자들 중 후보가 가장 적은 자리 하나만 훑어 나머지 자리를 대조한다
// - 확정된 글자가 하나도 없는 경우(퍼즐의 첫 슬롯)만 예외적으로 전체를 훑는다(판당 한 번뿐이라 무시할 비용).
function matchPool(pool, len, reg) {
	var list = pool[len];
	var byPos = POOL_INDEX[len];
	var fixedPositions = [], i, j, p, c, doc, candidates, smallest, smallestPos, ok;
	var res = [];

	if (!list) return res;
	for (i = 0; i < len; i++) if (reg.charAt(i) !== '.') fixedPositions.push(i);

	if (!fixedPositions.length) {
		for (i = 0; i < list.length; i++) {
			if (!words.has(list[i]._id)) res.push(list[i]);
		}
		return res;
	}

	smallest = null;
	smallestPos = -1;
	for (i = 0; i < fixedPositions.length; i++) {
		p = fixedPositions[i];
		c = reg.charAt(p);
		candidates = (byPos[p] && byPos[p][c]) || [];
		if (smallest === null || candidates.length < smallest.length) {
			smallest = candidates;
			smallestPos = p;
		}
	}
	if (!smallest) return res;

	for (i = 0; i < smallest.length; i++) {
		doc = smallest[i];
		if (words.has(doc._id)) continue;
		ok = true;
		for (j = 0; j < fixedPositions.length; j++) {
			p = fixedPositions[j];
			if (p === smallestPos) continue;
			if (doc._id.charAt(p) !== reg.charAt(p)) { ok = false; break; }
		}
		if (ok) res.push(doc);
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
	var qi, mc, argC, regC, bestIdx, bestReg, bestArg;

	while (queue.length) {
		if (Date.now() - startTime > GENERATE_TIMEOUT) {
			placedWords.forEach(function (w) { words.delete(w); });
			if (SOLO) process.stdout.write("\n");
			log("[WARN] " + map.name + " 모양이 " + (GENERATE_TIMEOUT / 1000) + "초 안에 채워지지 않아 포기합니다.");
			R.go({ map: map, board: null });
			return R;
		}
		// MRV(Minimum Remaining Values): 큐에 정의된 고정 순서 그대로 채우면, 후보가 몇 개 없는(거의 막힌)
		// 칸을 다른 칸들을 먼저 다 채운 뒤에야 뒤늦게 발견하게 되어 대량 백트래킹(스래싱)이 발생한다.
		// 그래서 매 시도마다 남은 칸들의 "지금 시점 후보 수"를 다시 계산해, 후보가 가장 적은(=가장 급한) 칸부터 처리한다.
		bestIdx = -1;
		for (qi = 0; qi < queue.length; qi++) {
			mc = queue[qi];
			argC = [];
			regC = "";
			p = [mc[0], mc[1]];
			for (i = 0; i < mc[3]; i++) {
				k = p.join(',');
				if (board[k]) {
					argC.push(board[k].chain);
					regC += board[k].char;
				}
				else regC += ".";
				p[mc[2]]++;
			}
			if (!regCache[regC]) regCache[regC] = matchPool(pool, mc[3], regC);
			if (bestIdx === -1 || regCache[regC].length < regCache[bestReg].length) {
				bestIdx = qi;
				bestReg = regC;
				bestArg = argC;
			}
		}
		m = queue.splice(bestIdx, 1)[0];
		arg = bestArg;
		reg = bestReg;
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
