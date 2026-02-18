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
 * Chainbattle (잇기 대결) - 타자대결 + 끝말잇기 결합
 * 각 플레이어가 자신의 끝말을 이어가는 대결
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

// 봇 상수
const ROBOT_LENGTH_LIMIT = [2, 3, 4, 5, 6];
const BOT_CPM = [70, 150, 250, 500, 1000];
const BOT_ACCURACY = [0.9, 0.95, 0.98, 0.99, 1.0];

// 영어 단어 캐시 (글자별) - 2번, 3번 문제 해결
var EnglishWordCache = {};
const CACHE_EXPIRE_TIME = 300000;  // 5분

// 점수 계산용 상수
const DOUBLE_VOWELS = [9, 10, 11, 14, 15, 16, 19];
const DOUBLE_TAILS = [3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18];

// 두음법칙 상수
const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];

// 순회 헬퍼
function traverse(func) {
	var my = this;
	var i, o;

	for (i in my.game.seq) {
		var item = my.game.seq[i];
		if (typeof item === 'string') {
			if (!(o = DIC[item])) continue;
		} else {
			o = item;
		}
		if (!o.game) continue;
		func(o);
	}
}

// 정규식 이스케이프 헬퍼
function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 끝 글자 추출
function getChar(text, lang) {
	if (lang === 'ko') {
		return text.slice(-1);
	} else {
		return text.slice(-1).toLowerCase();
	}
}

// 두음법칙 적용 - 한국어 전용
function getSubChar(char) {
	var my = this;
	var r = null;

	if (my.rule.lang !== 'ko') return null;

	var c = char.charCodeAt(0);
	var k = c - 0xAC00;

	// 한글 범위 체크
	if (k < 0 || k > 11171) return null;

	// 초성, 중성, 종성 분리
	var ca = [Math.floor(k / 28 / 21), Math.floor(k / 28) % 21, k % 28];
	var cb = [ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7];
	var cc = false;

	// ㄹ -> ㄴ 또는 ㅇ
	if (cb[0] == 4357) {  // 초성이 ㄹ (4357 = 0x1105)
		cc = true;
		if (RIEUL_TO_NIEUN.includes(cb[1])) {
			cb[0] = 4354;  // ㄴ
		} else if (RIEUL_TO_IEUNG.includes(cb[1])) {
			cb[0] = 4363;  // ㅇ
		} else {
			cc = false;
		}
	}
	// ㄴ -> ㅇ
	else if (cb[0] == 4354) {  // 초성이 ㄴ (4354 = 0x1102)
		if (NIEUN_TO_IEUNG.includes(cb[1])) {
			cb[0] = 4363;  // ㅇ
			cc = true;
		}
	}

	if (cc) {
		cb[0] -= 0x1100;
		cb[1] -= 0x1161;
		cb[2] -= 0x11A7;
		r = String.fromCharCode(((cb[0] * 21) + cb[1]) * 28 + cb[2] + 0xAC00);
	}

	return r;
}

// 끝말 연결 체크 (두음법칙 포함)
function isChainable(text, char, subChar, lang) {
	if (!text || text.length < 2) return false;

	var firstChar;
	if (lang === 'ko') {
		firstChar = text.charAt(0);
	} else {
		firstChar = text.charAt(0).toLowerCase();
	}

	// 기본 글자 일치
	if (firstChar === char) return true;

	// 두음법칙 대체 글자 일치
	if (subChar && firstChar === subChar) return true;

	return false;
}

// 경량 getAuto - 두음법칙 포함, 영어 캐싱, 한국어 경량 쿼리
function getAuto(char, subChar, mode) {
	var R = new Lizard.Tail();
	var my = this;
	var lang = my.rule.lang;
	var isKo = lang === 'ko';

	if (mode === 1) {
		// 개수만 반환 (통계 테이블)
		var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;
		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;
		var col = isKo ? `startall_${state}` : `count_${state}`;

		var chars = [char];
		if (subChar) chars.push(subChar);
		var total = 0;
		var pending = chars.length;

		chars.forEach(function (c) {
			table.findOne(['_id', c]).on(function (doc) {
				if (doc && doc[col]) total += doc[col];
				if (--pending === 0) R.go(total);
			}, null, function () { if (--pending === 0) R.go(total); });
		});
	} else if (mode === 2) {
		// 후보 리스트 반환
		if (isKo) {
			// 한국어: 경량 쿼리 (필드 제한, 인덱스 활용)
			var chars = [char];
			if (subChar) chars.push(subChar);
			var regexStr = '^(' + chars.map(escapeRegExp).join('|') + ')';
			var regex = new RegExp(regexStr);

			// 필요한 필드만 조회
			var typeC = my.opts.strict ? Const.KOR_STRICT : Const.KOR_GROUP;
			var conditions = [
				['_id', regex],
				['type', typeC]
			];
			if (!my.opts.injeong) conditions.push(['flag', { '$not': Const.KOR_FLAG.INJEONG }]);
			if (my.opts.strict) conditions.push(['flag', { '$lt': 4 }]);
			if (my.opts.loanword) conditions.push(['flag', { '$not': Const.KOR_FLAG.LOANWORD }]);

			DB.kkutu['ko'].find.apply(DB.kkutu['ko'], conditions)
				.limit(['_id', true], ['flag', true], ['type', true])  // 필드 반환
				.limit(50)  // 50개로 제한 (성능)
				.on(function (docs) {
					if (!docs || docs.length === 0) {
						R.go([]);
						return;
					}
					// 옵션 필터링은 submit에서 처리되므로 여기선 기본 필터만
					R.go(docs);
				});
		} else {
			// 영어: 글자별 캐싱 (알파벳 26자만 있으므로 캐싱 효율적)
			var cacheKey = char.toLowerCase();
			var now = Date.now();

			// 캐시 확인
			if (EnglishWordCache[cacheKey] &&
				EnglishWordCache[cacheKey].time > now - CACHE_EXPIRE_TIME) {
				R.go(EnglishWordCache[cacheKey].data);
				return R;
			}

			// 캐시 없으면 DB 조회 후 캐싱
			DB.kkutu['en'].find(
				['_id', new RegExp('^' + escapeRegExp(char.toLowerCase()))],
				['_id', Const.ENG_ID]
			).limit(200)  // 영어는 더 많이 캐싱
				.on(function (docs) {
					var result = docs || [];
					// 캐시 저장
					EnglishWordCache[cacheKey] = {
						time: now,
						data: result
					};
					R.go(result);
				});
		}
	} else {
		// 힌트 단어 1개
		var chars = [char];
		if (subChar) chars.push(subChar);
		var regexStr = '^(' + chars.map(escapeRegExp).join('|') + ')';
		var regex = new RegExp(regexStr);

		DB.kkutu[lang].findOne(
			['_id', regex],
			isKo ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
		).on(function (doc) {
			R.go(doc);
		});
	}

	return R;
}

// 매너 체크 (통계 테이블 사용, 두음법칙 포함) - 한국어 전용
function checkManner(nextChar, nextSubChar, usedChain) {
	var R = new Lizard.Tail();
	var my = this;

	var state = 0;
	if (!my.opts.injeong) state |= 1;
	if (my.opts.strict) state |= 2;
	if (my.opts.loanword) state |= 4;

	var col = `startall_${state}`;

	// nextChar와 nextSubChar 모두 확인
	var charsToCheck = [nextChar];
	if (nextSubChar) charsToCheck.push(nextSubChar);

	var total = 0;
	var pending = charsToCheck.length;

	charsToCheck.forEach(function (c) {
		DB.kkutu_stats_ko.findOne(['_id', c]).on(function (doc) {
			if (doc && doc[col]) total += doc[col];

			if (--pending === 0) {
				// 이미 사용한 단어 수 계산
				var used = 0;
				usedChain.forEach(function (word) {
					var wFirst = word.charAt(0);
					if (wFirst === nextChar) used++;
					else if (nextSubChar && wFirst === nextSubChar) used++;
				});

				R.go(total - used);
			}
		}, null, function () {
			if (--pending === 0) R.go(0);
		});
	});

	return R;
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var lang = my.rule.lang;
	var isKo = lang === 'ko';
	var EXAMPLE = isKo ? "가나다라마바사아자차" : "abcdefghij";

	// 플레이어 상태 초기화
	traverse.call(my, function (o) {
		o.game.spl = 0;
	});

	// DB에서 제시어 찾기 (라운드 수 이상의 글자를 가진 단어)
	var minLen = my.round;
	var maxLen = my.round + 3;

	DB.kkutu[lang].find(
		['_id', new RegExp(`.{${minLen},${maxLen}}`)],
		isKo ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID],
		['hit', { '$gte': 1 }]
	).limit(100).on(function ($md) {
		if ($md && $md.length > 0) {
			// 셔플 후 검증 시도
			var shuffled = $md.sort(function () { return Math.random() - 0.5; });
			tryTitle(shuffled, 0);
		} else {
			R.go(EXAMPLE);
		}
	});

	// 제시어 검증 (classic.js 방식)
	function tryTitle(list, idx) {
		if (idx >= list.length) {
			R.go(EXAMPLE);
			return;
		}
		checkTitle(list[idx]._id).then(function (valid) {
			if (valid) {
				R.go(valid);
			} else {
				tryTitle(list, idx + 1);
			}
		});
	}

	// 제시어 각 글자별 연결 가능 단어 수 검증
	function checkTitle(title) {
		var CR = new Lizard.Tail();

		if (!title) {
			CR.go(false);
			return CR;
		}

		// 조건 1: 고유 음절 검증 (중복 글자가 너무 많으면 제외)
		var uniqueChars = new Set(title.split('')).size;
		if (title.length - uniqueChars >= 2) {
			CR.go(false);
			return CR;
		}

		// 조건 2: 각 글자에서 연결 가능한 단어가 충분한지 검증
		var checks = [];
		for (var i = 0; i < title.length; i++) {
			checks.push(countConnectable(title[i], getSubChar.call(my, title[i])));
		}

		Lizard.all(checks).then(function (res) {
			for (var j = 0; j < res.length; j++) {
				if (res[j] < 5) {
					CR.go(false);
					return;
				}
			}
			CR.go(title);
		});

		return CR;
	}

	// 글자에서 시작하는 단어 수 조회
	function countConnectable(char, subChar) {
		var CR = new Lizard.Tail();

		var state = 0;
		if (!my.opts.injeong) state |= 1;
		if (my.opts.strict) state |= 2;
		if (my.opts.loanword) state |= 4;

		var col = isKo ? `startall_${state}` : `count_${state}`;
		var table = isKo ? DB.kkutu_stats_ko : DB.kkutu_stats_en;

		var chars = [char];
		if (subChar) chars.push(subChar);

		var pending = chars.length;
		var total = 0;

		chars.forEach(function (c) {
			table.findOne(['_id', c]).on(function (doc) {
				if (doc && doc[col]) total += doc[col];
				if (--pending === 0) CR.go(total);
			}, null, function () {
				if (--pending === 0) CR.go(total);
			});
		});

		return CR;
	}

	return R;
};

exports.roundReady = function () {
	var my = this;

	if (!my.game) return;
	if (!my.game.title) return;

	clearTimeout(my.game.qTimer);
	clearTimeout(my.game._rrt);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	my.game.late = false;

	if (my.game.round <= my.round) {
		// 이번 라운드의 시작 글자
		var roundChar = my.game.title[my.game.round - 1];
		var roundSubChar = getSubChar.call(my, roundChar);

		// 모든 플레이어 상태 초기화
		my.game.playerStates = {};
		traverse.call(my, function (o) {
			my.game.playerStates[o.id] = {
				char: roundChar,
				subChar: roundSubChar,
				chain: [],
				dic: {}
			};
			o.game.out = false;
		});

		my.byMaster('roundReady', {
			round: my.game.round,
			char: roundChar,
			subChar: roundSubChar,
			title: my.game.title
		}, true);

		setTimeout(my.turnStart, 2400);
	} else {
		// 게임 종료
		var scores = {};
		traverse.call(my, function (o) {
			scores[o.id] = Math.round(o.game.spl / my.round);
		});
		my.roundEnd({ scores: scores });
	}
};

exports.turnStart = function () {
	var my = this;

	if (!my.game) return;

	my.game.late = false;

	// 모든 봇 시작
	traverse.call(my, function (o) {
		if (o.robot) {
			o.game.out = false;
			exports.playRobot.call(my, o);
		}
	});

	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', { roundTime: my.game.roundTime }, true);
};

exports.turnEnd = function () {
	var my = this;
	var spl = {};

	if (!my.game) return;

	my.game.late = true;
	clearTimeout(my.game.qTimer);

	// 각 플레이어의 속도 점수 계산 (체인 수 기반)
	traverse.call(my, function (o) {
		if (o.robot && o.game.typingTimer) clearTimeout(o.game.typingTimer);
		var state = my.game.playerStates[o.id];
		var chainCount = state ? state.chain.length : 0;
		spl[o.id] = chainCount;
		o.game.spl += chainCount;
	});

	my.byMaster('turnEnd', {
		ok: false,
		speed: spl
	});

	my.game._rrt = setTimeout(my.roundReady, (my.game.round == my.round) ? 3000 : 10000);
};

exports.submit = function (client, text) {
	var my = this;

	if (!my.game || !my.game.playerStates) return;
	var state = my.game.playerStates[client.id];

	if (!client.game) return;
	if (!state) return;
	if (my.game.late) return client.chat(text);
	if (client.game.out) return client.chat(text);

	var lang = my.rule.lang;
	var isKo = lang === 'ko';

	// 끝말 연결 체크 (두음법칙 포함)
	if (!isChainable(text, state.char, state.subChar, lang)) {
		return client.chat(text);
	}

	// 낙장불입 처리 함수 (one 옵션)
	function handleOut() {
		client.game.out = true;
		client.publish('turnEnd', { target: client.id, ok: false, out: true }, true);

		// 모든 플레이어가 아웃인지 확인
		var allOut = true;
		traverse.call(my, function (o) {
			if (!o.game.out) allOut = false;
		});
		if (allOut) my.turnEnd();
	}

	// 실패 처리 함수 (이유가 뭐든 무조건 아웃)
	function handleFail() {
		client.send('turnEnd', { target: client.id, error: true });
		if (my.opts.one) handleOut();
	}

	// 중복 체크
	if (state.chain.includes(text)) {
		handleFail();
		return;
	}

	// DB 조회
	DB.kkutu[lang].findOne(
		['_id', text],
		isKo ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
	).limit(['mean', true], ['theme', true], ['type', true], ['hit', true], ['flag', true])
		.on(function ($doc) {
			if (!$doc) {
				handleFail();
				return;
			}

			// 인정/엄격/외래어 옵션 체크
			if (isKo) {
				// injeong: false면 인정 단어 금지
				if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) {
					handleFail();
					return;
				}
				// strict: true면 명사가 아닌 낱말, 사투리, 옛말, 북한어 금지
				if (my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) {
					handleFail();
					return;
				}
				// loanword: true면 외래어 금지
				if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) {
					handleFail();
					return;
				}
			}

			// 다음 글자 및 두음법칙 적용
			var nextChar = getChar(text, lang);
			var nextSubChar = isKo ? getSubChar.call(my, nextChar) : null;

			// 매너 체크 (한국어만 - 한방 단어 금지)
			if (isKo) {
				checkManner.call(my, nextChar, nextSubChar, state.chain).then(function (remaining) {
					if (remaining <= 0) {
						handleFail();
						return;
					}
					approveWord(nextChar, nextSubChar);
				});
			} else {
				// 영어는 매너 체크 불필요
				approveWord(nextChar, null);
			}

			function approveWord(nChar, nSubChar) {
				if (my.game.late) return;

				var score = my.getScore(text);
				client.game.score += score;

				state.chain.push(text);
				state.dic[text] = (state.dic[text] || 0) + 1;
				state.char = nChar;
				state.subChar = nSubChar;

				client.publish('turnEnd', {
					target: client.id,
					ok: true,
					value: text,
					mean: $doc.mean,
					theme: $doc.theme,
					score: score,
					totalScore: client.game.score,
					char: nChar,
					subChar: nSubChar,
					chain: state.chain.length
				}, true);

				client.invokeWordPiece(text, 0.5);

				// 봇이면 다음 단어 진행
				if (client.robot) {
					exports.playRobot.call(my, client);
				}
			}
		});
};

exports.getScore = function (text) {
	var my = this;
	var r = 0;

	if (my.rule.lang === 'ko') {
		for (var i = 0; i < text.length; i++) {
			var s = text.charCodeAt(i);
			if (s < 44032) {
				r++;
			} else {
				var t = (s - 44032) % 28;
				r += t ? 3 : 2;
				if (DOUBLE_VOWELS.includes(Math.floor(((s - 44032) % 588) / 28))) r++;
				if (DOUBLE_TAILS.includes(t)) r++;
			}
		}
	} else {
		r = text.length;
	}

	return r;
};

exports.playRobot = function (robot) {
	var my = this;

	if (!my.game || !my.game.playerStates) return;
	var state = my.game.playerStates[robot.id];

	if (my.game.late) return;
	if (!state) return;
	if (robot.game && robot.game.out) return;

	var level = robot.level;
	var cpm = BOT_CPM[level];
	var accuracy = BOT_ACCURACY[level];
	var maxLen = ROBOT_LENGTH_LIMIT[level];
	var isKo = my.rule.lang === 'ko';

	// 1번: 랜덤 시작 딜레이 (0~500ms)
	var startDelay = Math.random() * 500;

	robot.game.typingTimer = setTimeout(function () {
		if (!my.game || !my.game.playerStates) return;
		if (my.game.late) return;
		if (robot.game && robot.game.out) return;

		// 후보 단어 가져오기
		getAuto.call(my, state.char, state.subChar, 2).then(function (list) {
			// 2번: 후보가 없으면 잠시 후 재시도 (영어 봇 멈춤 방지)
			if (!list || list.length === 0) {
				retryLater();
				return;
			}

			// 필터링: 길이 제한, 미사용 단어
			list = list.filter(function (w) {
				return w._id.length >= 2 &&
					w._id.length <= maxLen &&
					!state.chain.includes(w._id);
			});

			if (list.length === 0) {
				retryLater();
				return;
			}

			// 한국어: 플래그 필터링 (어인정, 깐깐, 우리말)
			if (isKo) {
				list = list.filter(function (w) {
					// 어인정
					if (!my.opts.injeong && (w.flag & Const.KOR_FLAG.INJEONG)) return false;
					// 깐깐
					if (my.opts.strict) {
						if (w.flag >= 4) return false;
						if (w.type && !w.type.match(Const.KOR_STRICT)) return false;
					}
					// 우리말
					if (my.opts.loanword && (w.flag & Const.KOR_FLAG.LOANWORD)) return false;

					return true;
				});
			}

			if (list.length === 0) {
				retryLater();
				return;
			}

			// 한국어: 매너 체크 통과하는 단어 필터
			if (isKo) {
				filterMannerWords(list).then(function (safeList) {
					if (!safeList || safeList.length === 0) {
						retryLater();
						return;
					}
					pickAndType(safeList);
				});
			} else {
				pickAndType(list);
			}

			// 재시도 함수 (500ms 후)
			function retryLater() {
				if (my.game.late) return;
				if (robot.game && robot.game.out) return;
				robot.game.typingTimer = setTimeout(function () {
					exports.playRobot.call(my, robot);
				}, 500);
			}

			function filterMannerWords(wordList) {
				return new Promise(function (resolve) {
					var safe = [];
					var pending = wordList.length;

					if (pending === 0) return resolve([]);

					wordList.forEach(function (w) {
						if (!state) return;
						var nextC = getChar(w._id, 'ko');
						var nextS = getSubChar.call(my, nextC);
						checkManner.call(my, nextC, nextS, state.chain.concat([w._id])).then(function (rem) {
							if (rem > 0) safe.push(w);
							if (--pending === 0) resolve(safe);
						});
					});
				});
			}

			function pickAndType(safeList) {
				if (!safeList || safeList.length === 0) {
					retryLater();
					return;
				}

				// 랜덤 선택
				var word = safeList[Math.floor(Math.random() * safeList.length)];
				var typeTime = (word._id.length * 60 * 1000) / cpm;
				typeTime += Math.random() * 100 - 50;

				robot.game.typingTimer = setTimeout(function () {
					if (!my.game || !my.game.playerStates) return;
					if (my.game.late) return;
					if (robot.game && robot.game.out) return;

					// 오타율 적용
					if (Math.random() < accuracy) {
						my.submit(robot, word._id);
					} else {
						// 5번: 오답 출력 (현재 글자 + ?)
						var typo = state.char + '?';
						my.submit(robot, typo);
					}
				}, typeTime);
			}
		});
	}, startDelay);
};
