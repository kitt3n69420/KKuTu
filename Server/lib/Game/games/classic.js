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

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var JLog = require('../../sub/jjlog');
var util = require('./classic-util');
var bot = require('./classic-bot');

var DB;
var DIC;
var checkSwearWords;

var getAuto = util.getAuto;
var getChar = util.getChar;
var getSubChar = util.getSubChar;
var getRandomChar = util.getRandomChar;
var getMission = util.getMission;
var shuffle = util.shuffle;
var getLinkIndex = util.getLinkIndex;
var isDodoli = util.isDodoli;
var getNextTurnLength = util.getNextTurnLength;
var applyAlternating = util.applyAlternating;
var predictNextAlternating = util.predictNextAlternating;
var getPlayerId = util.getPlayerId;
var isMannerLike = util.isMannerLike;
var getMannerMinRemaining = util.getMannerMinRemaining;
var shouldDeepCheck = util.shouldDeepCheck;
var getMannerState = util.getMannerState;
var getMannerCacheKey = util.getMannerCacheKey;
var getAttackChars = util.getAttackChars;
var getStatsDoc = util.getStatsDoc;
var getAllStatsDocs = util.getAllStatsDocs;
var ROBOT_START_DELAY = util.ROBOT_START_DELAY;
var EKT_BIGRAMS = util.EKT_BIGRAMS;
var titlePool = util.titlePool;
var TITLE_POOL_MIN = util.TITLE_POOL_MIN;
var _fillTitlePool = util.fillTitlePool;


exports.init = function (_DB, _DIC, _checkSwear) {
	DB = _DB;
	DIC = _DIC;
	checkSwearWords = _checkSwear;
	util.setContext(_DB, _DIC, _checkSwear);
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var l = my.rule;
	var EXAMPLE;
	var eng, ja;

	if (!l) {
		R.go("undefinedd");
		return R;
	}
	if (!l.lang) {
		R.go("undefinedd");
		return R;
	}

	EXAMPLE = Const.EXAMPLE_TITLE[l.lang];
	my.game.dic = {};

	// EKT/KKU/KJM: 타이틀을 단어가 아니라 1~10 동그라미 숫자로 표시
	if (Const.GAME_TYPE[my.mode] === 'EKT' || Const.GAME_TYPE[my.mode] === 'KKU' || Const.GAME_TYPE[my.mode] === 'KJM') {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
		return R;
	}

	switch (Const.GAME_TYPE[my.mode]) {
		case 'EKK':
			if (my.opts.length7) my.game.wordLength = 7;
			else if (my.opts.length6) my.game.wordLength = 6;
			else if (my.opts.length5) my.game.wordLength = 5;
			else if (my.opts.length4) my.game.wordLength = 4;
			else if (my.opts.length3) my.game.wordLength = 3;
			else my.game.wordLength = 5;
		case 'ESH':
			eng = "^" + String.fromCharCode(97 + Math.floor(Math.random() * 26));
			break;
		case 'EKT':
			// EKT: 2글자 bigram 리스트에서 랜덤 선택
			eng = "^" + EKT_BIGRAMS[Math.floor(Math.random() * EKT_BIGRAMS.length)];
			break;
		case 'EAK':
			if (my.opts.length7) my.game.wordLength = 7;
			else if (my.opts.length6) my.game.wordLength = 6;
			else if (my.opts.length5) my.game.wordLength = 5;
			else if (my.opts.length4) my.game.wordLength = 4;
			else if (my.opts.length3) my.game.wordLength = 3;
			else my.game.wordLength = 5;
			eng = String.fromCharCode(97 + Math.floor(Math.random() * 26)) + "$";
			break;
		case 'KKT':
			my.game.wordLength = 3;
		case 'KSH':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "^[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]";
			break;
		case 'KAK':
			my.game.wordLength = 3;
		case 'KAP':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]$";
			break;
		case 'JKT':
			my.game.wordLength = 3;
		case 'JSH':
		case 'JAP':
			// 가나는 한글처럼 초성 블록으로 묶이지 않으므로 시작/끝 글자 제한 없이 길이만 맞춤
			// "^."로 1글자를 소비해야 뒤의 ".{round-1}$"와 합쳐 총 길이가 round와 일치함
			eng = "^.";
			break;
	}

	// DB 오류나 타임아웃 시 항상 결과를 반환하도록 보장하는 단일 resolve 래퍼
	var _titleResolved = false;
	function safeGo(val) {
		if (_titleResolved) return;
		_titleResolved = true;
		clearTimeout(_titleTimeout);
		R.go(val);
	}
	// 5초 안에 제시어를 못 찾으면 EXAMPLE로 폴백 (DB 쿼리 실패/풀 소진 시 게임 freezing 방지)
	var _titleTimeout = setTimeout(function () {
		if (!_titleResolved) {
			JLog.warn("[getTitle] Timeout for room " + my.id + ", falling back to EXAMPLE");
			safeGo(EXAMPLE);
		}
	}, 5000);

	function tryTitle(h) {
		if (h > 50) {
			safeGo(EXAMPLE);
			return;
		}
		// Re-randomize syllable range on each retry to avoid getting stuck on a bad range
		if (h > 10) {
			var gt = Const.GAME_TYPE[my.mode];
			if (gt === 'KSH' || gt === 'KKT') {
				ja = 44032 + 588 * Math.floor(Math.random() * 18);
				eng = "^[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]";
			} else if (gt === 'KAP' || gt === 'KAK') {
				ja = 44032 + 588 * Math.floor(Math.random() * 18);
				eng = "[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]$";
			}
		}
		// 제시어 풀에서 먼저 시도 (KSH/KAP 한국어, DB 쿼리 없음)
		if (l.lang === 'ko' && ja && h < 8) {
			var _gl = Math.floor((ja - 44032) / 588);
			var _wl = 1 + Math.max(1, my.round - 1);
			var _rgt = Const.GAME_TYPE[my.mode];
			var _rev = (_rgt === 'KAP' || _rgt === 'KAK');
			var _pk = (_rev ? 'r' : 'f') + ':ko:' + _wl;
			var _bk = titlePool[_pk] && titlePool[_pk][_gl];
			if (_bk && _bk.length > 0) {
				var _ci = Math.floor(Math.random() * _bk.length);
				var _cw = _bk.splice(_ci, 1)[0];
				if (_bk.length < TITLE_POOL_MIN) _fillTitlePool(_rev, 'ko', _wl);
				checkTitle(_cw).then(function(v) {
					if (_titleResolved) return;
					if (v) safeGo(v);
					else tryTitle(h + 1);
				});
				return;
			}
			_fillTitlePool(_rev, 'ko', _wl);
		}
		var titleTypeFilter = (l.lang == "ko") ? (my.opts.allpos ? null : ['type', Const.KOR_GROUP]) : (l.lang == "ja") ? null : ['_id', Const.ENG_ID];
		var titleArgs = [['_id', new RegExp(eng + ".{" + Math.max(1, my.round - 1) + "}$")]];
		if (titleTypeFilter) titleArgs.push(titleTypeFilter);
		DB.kkutu[l.lang].find.apply(DB.kkutu[l.lang], titleArgs
			// '$where', eng+"this._id.length == " + Math.max(2, my.round) + " && this.hit <= " + h
		).limit(20).on(function ($md) {
			if (_titleResolved) return;
			var list;

			if ($md && $md.length) {
				list = shuffle($md);
				checkTitle(list.shift()._id).then(onChecked);

				function onChecked(v) {
					if (_titleResolved) return;
					if (v) safeGo(v);
					else if (list.length) checkTitle(list.shift()._id).then(onChecked);
					else tryTitle(h + 10);
				}
			} else {
				tryTitle(h + 10);
			}
		}, null, function () {
			// DB 오류(커넥션 풀 소진 등) 시 즉시 EXAMPLE로 폴백
			JLog.warn("[getTitle] DB error in tryTitle for room " + my.id + ", falling back to EXAMPLE");
			safeGo(EXAMPLE);
		});
	}

	function checkTitle(title) {
		var R = new Lizard.Tail();
		var i, list = [];
		var len;

		if (title == null) {
			R.go(false);
			return R;
		}

		// Unknown Word 규칙: 모든 단어 허용 (검증 건너뜀)
		if (my.opts.unknown) {
			R.go(title);
			return R;
		}

		// stats 테이블이 아직 로딩 중이면 검증을 건너뛰어 재시도 루프 방지
		var statsLang = l.lang === 'ko' ? 'ko' : 'en';
		if (!DB.statsReady || !DB.statsReady[statsLang]) {
			R.go(title);
			return R;
		}

		// 조건 1: 고유 음절 검증
		// 제시어의 고유한 음절 수가 제시어 글자수보다 2 이상 차이나면 부적절
		var uniqueChars = new Set(title.split('')).size;
		if (title.length - uniqueChars >= 2) {
			R.go(false);
			return R;
		}

		// 일본어는 아직 kkutu_stats_ja가 없어 연결 가능 단어 수 휴리스틱을 적용할 수 없음 — 길이/중복 검증만으로 통과
		// 옛 가나(ゐ/ゑ)는 현대 표기로, 작은 가나(っゃゅょぁぃぅぇぉ)는 큰 가나로 정규화 (라운드 시작 글자로 그대로 쓰이므로)
		if (l.lang === 'ja') {
			var _jaTitle = util.expandJaSmallKana(util.normalizeJaText(title));
			// JSH/JKT(끝말잇기 계열): title의 각 글자가 라운드별 시작 글자로 쓰이는데, ん으로 시작하는 단어는 없으므로
			// title에 ん이 포함되면 그 라운드가 진행 불가능해짐 — 애초에 제시어로 뽑히지 않도록 차단
			if ((Const.GAME_TYPE[my.mode] === 'JSH' || Const.GAME_TYPE[my.mode] === 'JKT') && _jaTitle.indexOf('ん') !== -1) {
				R.go(false);
				return R;
			}
			R.go(_jaTitle);
			return R;
		}

		// 조건 2: 연결 가능 단어 개수 검증 (kkutu_stats 사용)
		len = title.length;
		for (i = 0; i < len; i++) {
			list.push(countTitleWords.call(my, title[i], getSubChar.call(my, title[i])));
		}

		Lizard.all(list).then(function (res) {
			for (i = 0; i < res.length; i++) {
				if (res[i] < 5) {
					return R.go(false);
				}
			}
			return R.go(title);
		});

		return R;
	}
	// 제시어 글자별 연결 가능 단어 수 조회 (kkutu_stats 사용)
	function countTitleWords(char, subChar) {
		var my = this;
		var R = new Lizard.Tail();
		var gameType = Const.GAME_TYPE[my.mode];
		var isRev = (gameType === 'KAP' || gameType === 'KAK' || gameType === 'EAP' || gameType === 'EAK');

		// State 비트마스크 계산 (에티켓: 항상 injeong OFF 강제)
		var state = getMannerState(my.opts);

		var col = isRev ? `end_${state}` : `start_${state}`;

		// char와 subChar 모두에서 시작하는 단어를 합산
		// subChar가 파이프로 구분된 경우 분리하여 처리
		var chars = [char];
		if (subChar) {
			subChar.split('|').forEach(function (sc) {
				if (sc && sc !== char && chars.indexOf(sc) === -1) chars.push(sc);
			});
		}

		var totalCount = 0;
		var totalShort = 0;
		var isKo = my.rule.lang === 'ko';
		var lang = isKo ? 'ko' : 'en';

		chars.forEach(function (c) {
			var colName = col;
			var shortColName = null;

			if (isKo) {
				if (my.opts.nolong) {
					colName = isRev ? `endshort_${state}` : `startshort_${state}`;
				} else if (my.opts.noshort) {
					colName = isRev ? `endall_${state}` : `startall_${state}`;
					shortColName = isRev ? `endshort_${state}` : `startshort_${state}`;
				} else if (my.opts.no2) {
					colName = isRev ? `endall_${state}` : `startall_${state}`;
					shortColName = isRev ? `end2_${state}` : `start2_${state}`;
				} else {
					var reqLen = my.game.wordLength || 0;
					var lenSuffix = (reqLen === 2) ? "2" : (reqLen === 3) ? "3" : (reqLen === 4) ? "4" : "all";
					colName = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
				}
			} else {
				if (my.opts.nolong) {
					colName = `countshort_${state}`;
				} else if (my.opts.noshort) {
					colName = `count_${state}`;
					shortColName = `countshort_${state}`;
				} else if (my.opts.no2) {
					colName = `count_${state}`;
					shortColName = `count2_${state}`;
				} else {
					colName = `count_${state}`;
				}
			}

			var doc = getStatsDoc(lang, c);
			if (doc && doc[colName]) totalCount += doc[colName];
			if (shortColName && doc && doc[shortColName]) totalShort += doc[shortColName];
		});
		var finalCount = totalShort ? (totalCount - totalShort) : totalCount;
		R.go(finalCount);

		return R;
	}
	tryTitle(10);

	return R;
};
exports.roundReady = function () {
	var my = this;
	if (!my.game.title) return;

	clearTimeout(my.game.turnTimer);
	my.game.round++;

	if (my.opts.straight && my.game.seq) {
		var i, p;
		for (i in my.game.seq) {
			p = (typeof my.game.seq[i] === 'string') ? DIC[my.game.seq[i]] : my.game.seq[i];
			if (p && p.game) {
				p.game.straightStreak = 0;
				delete p.game.lastWordLen;
				delete p.game.lastWord;
			}
		}
	}
	// Full House용 lastWord는 옵션과 무관하게 라운드마다 초기화
	if (my.game.seq) {
		var _i, _p;
		for (_i in my.game.seq) {
			_p = (typeof my.game.seq[_i] === 'string') ? DIC[my.game.seq[_i]] : my.game.seq[_i];
			if (_p && _p.game) delete _p.game.lastWord;
		}
	}
	// 플러시/잭팟 스트릭 및 디펜스 보너스 상태 초기화 (라운드마다)
	if (my.game.seq) {
		var fluI, fluP;
		for (fluI in my.game.seq) {
			fluP = (typeof my.game.seq[fluI] === 'string') ? DIC[my.game.seq[fluI]] : my.game.seq[fluI];
			if (fluP && fluP.game) {
				fluP.game.flush = null;
				fluP.game.jackpot = null;
			}
		}
	}
	my.game.pendingAttackDefense = null;
	my.game.pendingFlushDefense = null;
	my.game.flushDefenseState = {};
	// 전체 사용 가능 단어 수 (공격 판정 임계값용) — 서버 시작 시 캐싱된 값 사용
	if (my.game.round === 1) {
		var _wcLang = my.rule.lang === 'ko' ? 'ko' : 'en';
		var _wcKey = my.opts.allpos ? 'allpos' : 'normal';
		my.game.totalWordCount = (DB._cachedWordCount && DB._cachedWordCount[_wcLang] && DB._cachedWordCount[_wcLang][_wcKey]) || 0;
	}
	my.game.roundTime = my.time * 1000;
	// 라운드 시작 시 봇의 선호 글자 거부 상태 초기화
	if (my.game.seq) {
		for (var ri in my.game.seq) {
			var rp = (typeof my.game.seq[ri] === 'string') ? DIC[my.game.seq[ri]] : my.game.seq[ri];
			if (rp && rp.robot && rp.data) {
				rp.data._preferredCharRejected = false;
				rp.data._usingPreferredChar = false;
			}
		}
	}
	if (!my.opts.onlyonce || my.game.round === 1) my.resetChain();
	my.game.roundChainCount = 0;
	if (my.game.round <= my.round) {
		// EKT: 매 라운드마다 EKT_BIGRAMS에서 랜덤 bigram 직접 선택
		if (Const.GAME_TYPE[my.mode] === 'EKT') {
			my.game.char = EKT_BIGRAMS[Math.floor(Math.random() * EKT_BIGRAMS.length)];
		} else if (Const.GAME_TYPE[my.mode] === 'KKU') {
			// KKU: 매 라운드마다 KKU_START_BIGRAMS에서 랜덤 2그램 직접 선택
			my.game.char = Const.KKU_START_BIGRAMS[Math.floor(Math.random() * Const.KKU_START_BIGRAMS.length)];
		} else if (Const.GAME_TYPE[my.mode] === 'KJM') {
			// KJM: 26개 기본 자모에서 랜덤 선택
			my.game.char = Const.MISSION_jamo[Math.floor(Math.random() * Const.MISSION_jamo.length)];
			my.game.jamoRegex = Const.getJamoRegex(my.game.char);
		} else {
			my.game.char = my.game.title[my.game.round - 1];
		}
		my.game.subChar = getSubChar.call(my, my.game.char);
		my.game.ektTrigramMode = (Const.GAME_TYPE[my.mode] === 'EKT'); // EKT: 항상 3-gram 모드 활성화
		my.game.kkuTrigramMode = (Const.GAME_TYPE[my.mode] === 'KKU'); // KKU: 3-gram 모드 활성화 (EKT와 동일)

		// 서바이벌 클래식: 초기 글자 저장 (한방 복구용)
		if (my.opts.survival) {
			my.game.originalChar = my.game.char;
			my.game.originalSubChar = my.game.subChar;
			my.game.isHanbang = false;
		}

		if (my.opts.mission) my.game.mission = getMission(my.rule.lang, my.opts, Const.GAME_TYPE[my.mode]);
		if (my.opts.sami) {
			my.game.wordLength = 2;
			my.game.samiCount = 0;
		}
		// 3-2 renamed to sami, but logic is same.
		// New rules:
		if (my.opts.twotwo) {
			my.game.wordLength = 2;
		}
		if (my.opts.fourfour) {
			my.game.wordLength = 4;
		}
		if (my.opts.fourthree) {
			my.game.wordLength = 3; // lo값으로 초기화 → 첫 턴 토글 시 hi=4로 시작
			my.game.samiCount = 0; // Reuse samiCount for alternating
		}

		// New Length Rules (Priority: 7 > 6 > 5 > 4 > 3)
		if (my.opts.length7) my.game.wordLength = 7;
		else if (my.opts.length6) my.game.wordLength = 6;
		else if (my.opts.length5) my.game.wordLength = 5;
		else if (my.opts.length4) my.game.wordLength = 4;
		else if (my.opts.length3) my.game.wordLength = 3;

		my.byMaster('roundReady', {
			round: my.game.round,
			char: my.game.char,
			subChar: my.game.subChar,
			mission: my.game.mission
		}, true);
		my.game.turnTimer = setTimeout(my.turnStart, 2400);
	} else {
		my.roundEnd();
	}
};
exports.turnStart = function (force) {
	var my = this;
	var speed;
	var si;

	if (!my.game.chain) return;
	my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.roundChainCount * 1500));
	speed = my.getTurnSpeed(my.opts.speed ? my.game.roundTime / 2 : my.game.roundTime);
	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.robotTimer);
	my.game.late = false;
	my.game.loading = false;
	my.game.turnTime = 15000 - 1400 * speed;
	my.game.turnAt = (new Date()).getTime();
	//my.game.turnAt = (new Date()).getTime(); // 이건 콩의 저주야
	if (my.opts.sami) {
		applyAlternating(my.game, my.opts, my.game.seq.length, 3, 2);
	} else if (my.opts.fourthree) {
		applyAlternating(my.game, my.opts, my.game.seq.length, 4, 3);
	} else if (my.opts.twotwo) {
		my.game.wordLength = 2;
	} else if (my.opts.fourfour) {
		my.game.wordLength = 4;
	}

	// New Length Rules (Priority: 7 > 6 > 5 > 4 > 3)
	if (my.opts.length7) my.game.wordLength = 7;
	else if (my.opts.length6) my.game.wordLength = 6;
	else if (my.opts.length5) my.game.wordLength = 5;
	else if (my.opts.length4) my.game.wordLength = 4;
	else if (my.opts.length3) my.game.wordLength = 3;

	// 한방 체크: 매너 체크에서 저장된 값 재사용 또는 새로 계산
	if (typeof my.game.nextCharWordCount !== 'undefined') {
		// 매너 체크에서 저장된 값이 있으면 재사용 (중복 쿼리 방지)
		// 일본어(JSH/JAP)는 한방 개념이 없음
		var isJa = Const.GAME_TYPE[my.mode] === 'JSH' || Const.GAME_TYPE[my.mode] === 'JAP' || Const.GAME_TYPE[my.mode] === 'JKT';
		var isHanbang = !isJa && (my.game.nextCharWordCount === 0);
		my.game.isHanbang = isHanbang; // 억까 방지용 저장
		delete my.game.nextCharWordCount; // 사용 후 삭제

		my.byMaster('turnStart', {
			turn: my.game.turn,
			char: my.game.char,
			subChar: my.game.subChar,
			speed: speed,
			roundTime: my.game.roundTime,
			turnTime: my.game.turnTime,
			mission: my.game.mission,
			wordLength: my.game.wordLength,
			sumiChar: my.game.sumiChar,
			isHanbang: isHanbang,
			linkOverride: my.game.linkOverride || undefined,
			seq: force ? my.game.seq : undefined
		}, true);

		// 서바이벌 모드: 라운드 시간 체크 제거 (턴 시간만 사용)
		var timeout = my.opts.survival
			? my.game.turnTime + 100
			: Math.min(my.game.roundTime, my.game.turnTime + 100);
		my.game.turnTimer = setTimeout(my.turnEnd, timeout);
		if (si = my.game.seq[my.game.turn])
			if (si.robot) {
				si._done = new Set();
				if (si.data) delete si.data.retryCount;
				if (si._pendingAnger) { si.adjustAnger(si._pendingAnger); si._pendingAnger = 0; }
				my.readyRobot(si);
			}
	} else {
		// 저장된 값이 없으면 새로 계산 (첫 턴 등)
		getAuto.call(my, my.game.char, my.game.subChar, 1).then(function (w) {
			var count = (typeof w === 'number') ? w : (w ? 1 : 0);
			var used = 0;

			// 이미 사용된 단어 개수 계산
			if (my.game.chain) {
				var checkChars = [my.game.char];
				if (my.game.subChar) my.game.subChar.split("|").forEach(function (c) {
					if (c && checkChars.indexOf(c) == -1) checkChars.push(c);
				});
				var type = Const.GAME_TYPE[my.mode];
				var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

				my.game.chain.forEach(function (doneWord) {
					var match = false;
					checkChars.forEach(function (cc) {
						if (isKAP) {
							if (doneWord.slice(-cc.length) === cc) match = true;
						} else {
							if (doneWord.indexOf(cc) === 0) match = true;
						}
					});
					if (match) used++;
				});
			}

			// 남은 단어가 0개면 한방 (일본어(JSH/JAP)는 한방 개념이 없음)
			var isJa = Const.GAME_TYPE[my.mode] === 'JSH' || Const.GAME_TYPE[my.mode] === 'JAP' || Const.GAME_TYPE[my.mode] === 'JKT';
			var isHanbang = !isJa && (count - used === 0);
			my.game.isHanbang = isHanbang; // 억까 방지용 저장

			my.byMaster('turnStart', {
				turn: my.game.turn,
				char: my.game.char,
				subChar: my.game.subChar,
				speed: speed,
				roundTime: my.game.roundTime,
				turnTime: my.game.turnTime,
				mission: my.game.mission,
				wordLength: my.game.wordLength,
				sumiChar: my.game.sumiChar,
				isHanbang: isHanbang,
				linkOverride: my.game.linkOverride || undefined,
				seq: force ? my.game.seq : undefined
			}, true);

			// 서바이벌 모드: 라운드 시간 체크 제거 (턴 시간만 사용)
			var timeout = my.opts.survival
				? my.game.turnTime + 100
				: Math.min(my.game.roundTime, my.game.turnTime + 100);
			my.game.turnTimer = setTimeout(my.turnEnd, timeout);
			if (si = my.game.seq[my.game.turn])
				if (si.robot) {
					si._done = new Set();
					if (si.data) delete si.data.retryCount; // Reset Retry Count for new turn
					if (si._pendingAnger) { si.adjustAnger(si._pendingAnger); si._pendingAnger = 0; }
					my.readyRobot(si);
				}
		});
	}
};


exports.turnEnd = function () {
	var my = this;
	var target;
	var score;

	if (!my.game.seq) return;
	target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];

	if (my.game.loading) {
		clearTimeout(my.game.turnTimer);
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	clearTimeout(my.game.turnTimer);
	my.game.late = true;
	// 아이템전: 타임아웃 시 linkOverride 해제 및 대기 아이템 큐 삭제
	if (my.game.linkOverride) my.game.linkOverride = null;
	if (my.opts.item && my.game.pendingItems && target && target.id) {
		if (my.game.pendingItems[target.id]) {
			delete my.game.pendingItems[target.id];
			my.byMaster('item-dequeued', { playerId: target.id }, true);
		}
	}

	// ========== 서바이벌 모드: 타임아웃 = 즉시 KO ==========
	if (my.opts.survival && target && target.game && target.game.alive) {
		target.game.alive = false;
		target.game.score = 0;
		Const.recordSurvivalKO(my, target);
		my.logChainEvent(target, 'ko');

		// 봇 분노: 타임아웃된 봇의 분노 조정
		if (target.robot && target.adjustAnger) {
			target.adjustAnger(1);
		}

		var wasHanbang = my.game.isHanbang;
		var status = Const.checkSurvivalStatus(my, DIC);

		my.byMaster('turnEnd', {
			ok: false,
			target: target.id,
			score: 0,
			totalScore: 0,
			survival: true,
			ko: true,
			koReason: 'timeout'
		}, true);

		// 봇 분노: 다른 봇들의 팀 관계 기반 분노 조정 (서바이벌)
		if (target && my.game.seq) {
			var targetTeamSv = target.robot ? (target.game.team || 0) : (target.team || 0);
			for (var si in my.game.seq) {
				var sp = (typeof my.game.seq[si] === 'string') ? DIC[my.game.seq[si]] : my.game.seq[si];
				if (sp && sp.robot && sp.id !== target.id && sp.adjustAnger) {
					var spTeam = sp.game.team || 0;
					var isTeammateSv = (targetTeamSv !== 0 && spTeam !== 0 && targetTeamSv === spTeam);
					if (isTeammateSv) {
						sp.adjustAnger(0.5);
					} else {
						sp.adjustAnger(-0.5);
					}
				}
			}
		}

		if (status.gameOver) {
			clearTimeout(my.game.robotTimer);
			if (my.game._rrt) clearTimeout(my.game._rrt);
			my.game._rrt = setTimeout(function () {
				my.roundEnd();
			}, 2000);
			return;
		}

		// 클래식 전용: 한방으로 KO되었으면 원래 글자로 복구
		if (wasHanbang && my.game.originalChar) {
			my.game.char = my.game.originalChar;
			my.game.subChar = my.game.originalSubChar;
			my.game.hanbangRecovery = true;
		}

		clearTimeout(my.game.robotTimer);
			if (my.game._rrt) clearTimeout(my.game._rrt);
			my.game._rrt = setTimeout(function () {
			my.turnNext();
		}, 2000);
		return;
	}
	// ========== 서바이벌 모드 끝 ==========

	// 서바이벌 모드: 이미 KO된 플레이어는 일반 turnEnd 처리하지 않음 (stale timer 방지)
	if (my.opts.survival) return;

	if (target)
		if (target.game) {
			if (typeof target.game.score !== 'number' || isNaN(target.game.score)) target.game.score = 0;
			// 무적(god): 패널티 면제
			if (my.opts.invincible) {
				score = 0;
				// 억까 방지(apd): 한방단어 받았을 때 패널티 면제
			} else if (my.opts.antitroll && my.game.isHanbang) {
				score = 0;
			} else {
				score = Const.getPenalty(my.game.chain, target.game.score);
				// 나락(nar): 패널티 적용 후에도 점수가 양수면 0으로 만듦
				if (my.opts.narak && (target.game.score + score) > 0) {
					score = -target.game.score;
				}
			}
			if (score !== 0) target.game.score += score;
		}

	// 봇 분노: 타임아웃된 봇의 분노 조정 (비서바이벌)
	if (target && target.robot && target.adjustAnger) {
		target.adjustAnger(1);
	}

	getAuto.call(my, my.game.char, my.game.subChar, 0).then(function (w) {
		my.byMaster('turnEnd', {
			ok: false,
			target: target ? target.id : null,
			score: score,
			hint: w
		}, true);

		// Bot timeout message logic
		if (target && my.game.seq) {
			var bots = [];
			var i, p, item;
			var targetId = (typeof target === 'object') ? target.id : target;

			// if (!Const.ROBOT_TIMEOUT_MESSAGES) console.error("[ERROR] ROBOT_TIMEOUT_MESSAGES is undefined!");

			for (i in my.game.seq) {
				item = my.game.seq[i];
				if (typeof item === 'string') {
					p = DIC[item];
				} else {
					p = item;
				}

				if (p && p.robot) {
					if (p.id !== targetId) {
						bots.push(p);
					}
				}
			}

			// console.log("[DEBUG] Candidate bots count: " + bots.length);

			if (bots.length > 0) {
				// Each bot has a 50% chance to send a timeout message
				var prob = 0.5;
				var targetTeam = 0;
				// Determine target team safely
				if (target && typeof target === 'object') {
					if (target.robot) {
						targetTeam = target.game.team || 0;
					} else {
						targetTeam = target.team || 0;
					}
				}

				for (i in bots) {
					(function (bot) {
						// Check team relation
						var botTeam = bot.game.team || 0;
						var isTeammate = (targetTeam !== 0 && botTeam !== 0 && targetTeam === botTeam);

						// 봇 분노: 팀 관계에 따른 분노 조정
						if (bot.adjustAnger) {
							if (isTeammate) {
								bot.adjustAnger(0.5);
							} else {
								bot.adjustAnger(-0.5);
							}
						}

						var rand = Math.random();
						if (rand < prob && !bot.muteGame) {
							setTimeout(function () {
								if (bot._rageQuitting || bot._removed) return;
								var msgs = isTeammate ?
									Const.ROBOT_TIMEOUT_MESSAGES_SAMETEAM :
									Const.ROBOT_TIMEOUT_MESSAGES;

								// Fallback just in case SAMETEAM array is missing/empty, though unlikely
								if (!msgs || msgs.length === 0) msgs = Const.ROBOT_TIMEOUT_MESSAGES;

								var msg = msgs[Math.floor(Math.random() * msgs.length)];
								bot.chat(msg);
							}, 500 + Math.random() * 1000);
						}
					})(bots[i]);
				}
			}
		}

		my.logChainEvent(target, 'timeout');
		my.game._rrt = setTimeout(my.roundReady, 3000);
	});
	clearTimeout(my.game.robotTimer);
};
exports.submit = function (client, text) {
	var score, l, t;
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];

	if (!mgt) return;
	// Turn check: Only the current turn owner can submit words
	if (getPlayerId(mgt) !== getPlayerId(client)) return client.chat(text);
	if (!my.game.char) return;
	// JSH/JAP/JKT: 가타카나→히라가나, 장음(ー)→직전 모음 정규화 (사전 _id와 동일 정규화를 적용해야 매칭됨)
	if (Const.GAME_TYPE[my.mode] === 'JSH' || Const.GAME_TYPE[my.mode] === 'JAP' || Const.GAME_TYPE[my.mode] === 'JKT') {
		text = util.normalizeJaText(text);
	}
	if (!isChainable(text, my.mode, my.game.char, my.game.subChar)) return client.chat(text);
	text = text.replace(/\s/g, '');
	// noLong/noShort/no2 길이 검증 (통과 못하면 채팅으로 처리)
	// KJM: 자모 분해 길이 기준 적용
	if (Const.GAME_TYPE[my.mode] === 'KJM') {
		var _kjmJamoLen = Const.decomposeToJamo(text).length;
		if (my.opts.nolong && _kjmJamoLen >= 9) return client.chat(text);
		if (my.opts.noshort && _kjmJamoLen <= 8) return client.chat(text);
		if (my.opts.no2 && _kjmJamoLen <= 2) return client.chat(text);
	} else {
		if (my.opts.nolong && text.length >= 9) return client.chat(text);
		if (my.opts.noshort && text.length <= 8) return client.chat(text);
		if (my.opts.no2 && text.length <= 2) return client.chat(text);
	}

	// Surrogate character check: reject inputs containing surrogates (e.g., emojis)
	if (/[\uD800-\uDFFF]/.test(text)) {
		client.publish('turnError', { code: 404, value: text }, true);
		if (my.opts.one) my.turnEnd();
		return;
	}

	// EKT 3-gram 모드에서 3글자 이하 단어 입력 시 채팅으로 처리 (게임 진행 안함)
	if (Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode && text.length < 4) {
		return client.chat(text);
	}

	// KKU 3-gram 모드에서 3글자 이하 단어 입력 시 채팅으로 처리 (게임 진행 안함)
	if (Const.GAME_TYPE[my.mode] === 'KKU' && my.game.kkuTrigramMode && text.length < 4) {
		return client.chat(text);
	}

	if (my.game.chain.indexOf(text) != -1) {
		var isRecentDuplicate = my.opts.return && my.game.chain.slice(-5).indexOf(text) != -1;

		if (my.opts.return && !isRecentDuplicate) {
			// Return rule: Allow duplicate but 0 score
		} else {
			if (client.robot && client.data.candidates && client.data.candidateIndex < client.data.candidates.length - 1) {
				client.data.candidateIndex++;
				var nextWord = client.data.candidates[client.data.candidateIndex];
				setTimeout(function () {
					my.turnRobot(client, nextWord._id);
				}, ROBOT_START_DELAY[client.level]);
				return;
			}
			client.publish('turnError', {
				code: isRecentDuplicate ? 411 : 409,
				value: text
			}, true);

			// Retry Logic for Bot: If candidates exhausted (duplicate word), try Tier 2.
			// Logic: Tier 1 Fail -> Retry (Count 1)
			//        Tier 2 Fail -> Retry (Count 2, 3, 4)
			// User requested "Retry up to 3 times more for Tier 2". So allow up to count 4.
			if (client.robot) {
				var rCount = client.data.retryCount || 0;
				if (rCount < 4) {
					client.data.retryCount = rCount + 1;
					// Force Tier 2 attack in next attempt
					setTimeout(function () {
						my.readyRobot(client);
					}, ROBOT_START_DELAY[client.level]);
				}
			}

			if (my.opts.one) my.turnEnd();
			return;
		}
	}

	l = my.rule.lang;
	my.game.loading = true;

	function onDB($doc) {
		if (!my.game.chain) return;
		var preChar = getChar.call(my, text);
		var preSubChar = getSubChar.call(my, preChar);
		var firstMove = my.game.roundChainCount < 1;

		// linkOverride 적용: 매너 체크를 변경된 이을 글자 기준으로 수행
		var _loSaved;
		if (my.game.linkOverride) {
			_loSaved = { middle: my.opts.middle, first: my.opts.first, second: my.opts.second };
			if (my.game.linkOverride === 'middle') {
				my.opts.middle = true; my.opts.first = false; my.opts.second = false;
			} else if (my.game.linkOverride === 'end') {
				my.opts.middle = false; my.opts.first = false; my.opts.second = false;
			}
			preChar = getChar.call(my, text);
			preSubChar = getSubChar.call(my, preChar);
		}

		// EKT: 3글자 이상 단어 입력 시, trigram 모드가 활성화될 것을 미리 예상하여 3-gram으로 매너 체크
		var gameType = Const.GAME_TYPE[my.mode];
		if (gameType === 'EKT' && text.length >= 3 && !my.game.ektTrigramMode) {
			preChar = text.slice(-3); // 강제로 마지막 3글자 사용
			preSubChar = preChar.slice(1); // 2-gram subChar
		}
		// KKU: 3글자 이상 단어 입력 시, trigram 모드 활성화를 예상하여 3-gram으로 매너 체크
		// 단, First/Middle 규칙에서는 getChar가 이미 올바른 연결 글자를 반환하므로 강제 변경하지 않음
		if (gameType === 'KKU' && text.length >= 3 && !my.game.kkuTrigramMode && !my.opts.first && !my.opts.middle) {
			preChar = text.slice(-3); // 강제로 마지막 3글자 사용
			preSubChar = preChar.slice(1); // 2-gram subChar
		}

		// linkOverride opts 복구
		if (_loSaved) {
			my.opts.middle = _loSaved.middle;
			my.opts.first = _loSaved.first;
			my.opts.second = _loSaved.second;
		}

		// JSH/JKT(일본어 끝말잇기 계열): ん으로 끝나는 단어는 다음 사람이 이을 방법이 없으므로 옵션과 무관하게 항상 제출 금지
		if ((gameType === 'JSH' || gameType === 'JKT') && preChar === 'ん') {
			denied(413);
			return;
		}

		function preApproved() {
			function approved() {
				if (my.game.late) return;
				if (!my.game.chain) return;
				if (!my.game.dic) return;
				// Stale callback: turn advanced while DB query was in flight
				if (getPlayerId(my.game.seq[my.game.turn]) !== getPlayerId(client)) return;

				if (client.robot) client.data._usingPreferredChar = false;
				my.game.loading = false;
				my.game.late = true;
				clearTimeout(my.game.turnTimer);
				t = tv - my.game.turnAt;
				var isReturn = my.opts.return && my.game.chain.includes(text);

				// 아이템전: 미션 글자 수를 getScore 이전에 계산 (getScore 내부에서 mission이 true로 바뀜)
				var itemMissionCount = (my.opts.item && my.game.mission && my.game.mission !== true && text.match(new RegExp(my.game.mission, 'g')))
					? text.match(new RegExp(my.game.mission, 'g')).length : 0;

				// 기본 점수 계산 (미션 보너스 포함)
				var baseScore = my.getScore(text, t, isReturn);
				// 미션 보너스 제외한 순수 기본 점수
				var baseScoreWithoutMission = my.getScore(text, t, true);
				// 미션 보너스만 추출
				var missionBonus = (my.game.mission === true) ? baseScore - baseScoreWithoutMission : 0;

				score = baseScoreWithoutMission;

				// Sumi-Sanggwan Check (SpeedToss)
				var speedTossBonus = 0;
				my.game.sumiChar = null;
				if (my.opts.speedtoss && !my.opts.random) {
					var matchingSumiChar = checkspeedToss(my.game.chain[my.game.chain.length - 1], text);
					if (matchingSumiChar) {
						var bonusScore = Math.round(baseScoreWithoutMission * 0.20);
						if (my.opts.bbungtwigi) bonusScore *= 2; // 뻥튀기: 스피드토스 보너스 2배
						speedTossBonus = bonusScore;
						my.game.sumiChar = matchingSumiChar; // Store for turnStart highlighting
					} else {
						delete my.game.sumiChar;
					}
				}

				// Straight Rule Logic
				var straightBonus = 0;
				if (my.opts.straight) {
					if (isReturn) {
						client.game.straightStreak = 0;
						client.game.lastWordLen = undefined;
					} else {
						var currentLen = text.length;
						var prevLen = client.game.lastWordLen;

						if (typeof prevLen === 'undefined') {
							// First word for this player. Don't build streak.
							client.game.straightStreak = 0;
						} else if (currentLen - prevLen === 1) {
							// Condition met: increment streak
							client.game.straightStreak = (client.game.straightStreak || 0) + 1;
						} else {
							// Condition not met: reset streak
							client.game.straightStreak = 0;
						}

						client.game.lastWordLen = currentLen;

						if (client.game.straightStreak >= 2) {
							var straightPct = Math.min(15 + (client.game.straightStreak - 2) * 5, 50);
							straightBonus = Math.round(baseScoreWithoutMission * (straightPct / 100));
							if (my.opts.bbungtwigi) straightBonus *= 2; // 뻥튀기: 스트레이트 보너스 2배
						}
					}
				}

				// 최종 점수 = 기본 점수 + 미션 보너스 + 스피드토스 보너스 + 스트레이트 보너스
				score = isReturn ? 0 : baseScoreWithoutMission + missionBonus + speedTossBonus + straightBonus;

				if (isReturn) {
					missionBonus = 0;
					speedTossBonus = 0;
				}
				my.game.dic[text] = (my.game.dic[text] || 0) + 1;

				// EKT 모드 활성화는 단어가 완전히 승인된 후로 이동 (랜덤 체크 통과 후)

				my.logChainWord(text, client);
				my.game.roundChainCount++;
				my.game.roundTime -= t;

				// Random Linking Logic
				if (my.opts.random && !my.opts.middle && !my.opts.first && !my.opts.second) {
					// 매너 체크는 preApproved에서 완료되었으므로 저장된 결과 사용
					var randomResult = my.game._pendingRandomResult;
					delete my.game._pendingRandomResult;

					// EKT: 3글자 이상 단어 사용 시 3-gram 모드 활성화
					var type = Const.GAME_TYPE[my.mode];
					if (type === 'EKT' && text.length >= 3 && !my.game.ektTrigramMode) {
						my.game.ektTrigramMode = true;
					}
					// KKU: 3글자 이상 단어 사용 시 3-gram 모드 활성화 (EKT와 동일)
					if (type === 'KKU' && text.length >= 3 && !my.game.kkuTrigramMode) {
						my.game.kkuTrigramMode = true;
					}
					my.game.char = randomResult.char;
					my.game.subChar = getSubChar.call(my, randomResult.char);
					// Pass link index to client
					finishTurn(randomResult.index);
				} else {
					// EKT: 3글자 이상 단어 사용 시 3-gram 모드 활성화 (비랜덤 모드)
					var type = Const.GAME_TYPE[my.mode];
					if (type === 'EKT' && text.length >= 3 && !my.game.ektTrigramMode) {
						my.game.ektTrigramMode = true;
						// 모드 전환 후 preChar 재계산
						preChar = getChar.call(my, text);
						preSubChar = getSubChar.call(my, preChar);
					}
					// KKU: 3글자 이상 단어 사용 시 3-gram 모드 활성화 (비랜덤 모드, EKT와 동일)
					if (type === 'KKU' && text.length >= 3 && !my.game.kkuTrigramMode) {
						my.game.kkuTrigramMode = true;
						// 모드 전환 후 preChar 재계산
						preChar = getChar.call(my, text);
						preSubChar = getSubChar.call(my, preChar);
					}
					// 아이템전: linkOverride 적용
					var linkOverrideActive = false;
					var savedMiddle, savedFirst, savedSecond;
					if (my.game.linkOverride) {
						linkOverrideActive = true;
						savedMiddle = my.opts.middle;
						savedFirst = my.opts.first;
						savedSecond = my.opts.second;
						if (my.game.linkOverride === 'middle') {
							my.opts.middle = true;
							my.opts.first = false;
							my.opts.second = false;
						} else if (my.game.linkOverride === 'end') {
							my.opts.middle = false;
							my.opts.first = false;
							my.opts.second = false;
						}
						preChar = getChar.call(my, text);
						preSubChar = getSubChar.call(my, preChar);
					}
					my.game.char = preChar;
					my.game.subChar = preSubChar;
					// KJM: 다음 체인 자모에 맞는 regex 업데이트
					if (Const.GAME_TYPE[my.mode] === 'KJM') {
						my.game.jamoRegex = Const.getJamoRegex(preChar);
					}
					// 서버에서 linkIndex 계산하여 클라이언트에 전달 (하이라이팅 위치 일원화)
					var linkIdx = getLinkIndex.call(my, text);
					if (linkOverrideActive) {
						my.opts.middle = savedMiddle;
						my.opts.first = savedFirst;
						my.opts.second = savedSecond;
						my.game.linkOverride = null;
					}
					finishTurn(linkIdx);
				}

				function finishTurn(linkIdx) {
					// 1. 한방 체크 (모든 턴)
					// 최적화: 매너 체크에서 저장된 nextCharWordCount를 재사용하여 중복 쿼리 방지
					// 매너 모드 활성화 시 한방 단어는 이미 거부되었으므로 isHanbang = false

					if (my.opts.unknown || gameType === 'KJM' || gameType === 'JSH' || gameType === 'JAP' || gameType === 'JKT') {
						// Unknown 모드, KJM(자모이어가기), 일본어(끝말잇기/앞말잇기/쿵쿵따)는 한방 개념이 없음
						finalizeTurn(false);
						return;
					}

					// 매너 체크에서 저장된 결과가 있으면 재사용 (중복 쿼리 제거)
					if (typeof my.game.nextCharWordCount !== 'undefined') {
						// 매너 모드가 활성화되었다면 한방 단어는 이미 거부되었으므로 isHanbang = false
						// 매너 모드가 비활성화되었을 때만 실제 한방 여부 표시
						var isHanbang = !isMannerLike(my.opts) && (my.game.nextCharWordCount <= 0);

						finalizeTurn(isHanbang);

						// 봇 승리 메시지
						if (client.robot && isHanbang) {
							if (client.adjustAnger) client.adjustAnger(-2);
							if (!client.muteGame) {
								setTimeout(function () {
									client.chat(Const.ROBOT_VICTORY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_VICTORY_MESSAGES.length)]);
								}, 500);
							}
						}
						// 한방을 받는 다음 차례 봇에게 분노 +2 예약 (턴 시작 시 적용)
						if (isHanbang && my.game.seq) {
							var _nextSeqIdx = (my.opts.randomturn && my.game.randomTurnOrder && my.game.randomTurnOrder.length > 0)
								? my.game.randomTurnOrder[(my.game.randomTurnIndex + 1) % my.game.randomTurnOrder.length]
								: (my.game.turn + 1) % my.game.seq.length;
							var nextPlayer = my.game.seq[_nextSeqIdx];
							if (typeof nextPlayer === 'string') nextPlayer = DIC[nextPlayer];
							if (nextPlayer && nextPlayer.robot) nextPlayer._pendingAnger = (nextPlayer._pendingAnger || 0) + 2;
						}
						// 관전 봇들의 한방 반응 (30% 확률)
						if (isHanbang && my.game.seq) {
							var _hObsMsgs = Const.ROBOT_HANBANG_OBSERVE_MESSAGES;
							for (var _hoi = 0; _hoi < my.game.seq.length; _hoi++) {
								var _hop = my.game.seq[_hoi];
								if (typeof _hop === 'string') _hop = DIC[_hop];
								if (!_hop || !_hop.robot || _hop === client || _hop === nextPlayer) continue;
								if (_hop.muteGame || _hop._rageQuitting) continue;
								if (Math.random() > 0.4) continue;
								(function (_ob) {
									setTimeout(function () {
										if (!_ob._rageQuitting && !_ob._removed) _ob.chat(_hObsMsgs[Math.floor(Math.random() * _hObsMsgs.length)]);
									}, 1000 + Math.floor(Math.random() * 3000));
								})(_hop);
							}
						}
						return;
					}

					// Fallback: 캐시된 결과가 없으면 직접 계산 (첫 턴 등)
					getAuto.call(my, my.game.char, my.game.subChar, 1).then(function (w) {
						var count = (typeof w === 'number') ? w : (w ? 1 : 0);
						var used = 0;

						// 이미 사용된 단어 계산
						var debugCheckChars = [];
						if (my.game.chain) {
							var checkChars = [my.game.char];
							if (my.game.subChar) my.game.subChar.split("|").forEach(function (c) {
								if (c && checkChars.indexOf(c) == -1) checkChars.push(c);
							});
							debugCheckChars = checkChars;
							var type = Const.GAME_TYPE[my.mode];
							var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

							// 현재 단어는 이미 chain에 push되었으므로 제외 (마지막 요소)
							var checkChain = my.game.chain.slice(0, -1);
							if (my.opts.return) checkChain = checkChain.slice(-5);

							checkChain.forEach(function (doneWord) {
								var match = false;
								checkChars.forEach(function (cc) {
									if (isKAP) {
										if (doneWord.slice(-cc.length) === cc) match = true;
									} else {
										if (doneWord.indexOf(cc) === 0) match = true;
									}
								});
								if (match) used++;
							});
						}

						// 남은 단어가 0개 이하면 한방 (음수일 수도 있음)
						// 매너 모드가 활성화되었으면 isHanbang = false
						var remaining = count - used;
						var isHanbang = !isMannerLike(my.opts) && (remaining <= 0);

						// 결과 저장 (turnStart에서도 재사용 가능)
						my.game.nextCharWordCount = remaining;

						finalizeTurn(isHanbang);

						// 봇 승리 메시지
						if (client.robot && isHanbang) {
							if (client.adjustAnger) client.adjustAnger(-2);
							if (!client.muteGame) {
								setTimeout(function () {
									client.chat(Const.ROBOT_VICTORY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_VICTORY_MESSAGES.length)]);
								}, 500);
							}
						}
						// 한방을 받는 다음 차례 봇에게 분노 +2 예약 (턴 시작 시 적용)
						if (isHanbang && my.game.seq) {
							var _nextSeqIdx2 = (my.opts.randomturn && my.game.randomTurnOrder && my.game.randomTurnOrder.length > 0)
								? my.game.randomTurnOrder[(my.game.randomTurnIndex + 1) % my.game.randomTurnOrder.length]
								: (my.game.turn + 1) % my.game.seq.length;
							var nextPlayer = my.game.seq[_nextSeqIdx2];
							if (typeof nextPlayer === 'string') nextPlayer = DIC[nextPlayer];
							if (nextPlayer && nextPlayer.robot) nextPlayer._pendingAnger = (nextPlayer._pendingAnger || 0) + 2;
						}
						// 관전 봇들의 한방 반응 (30% 확률)
						if (isHanbang && my.game.seq) {
							var _hObsMsgs2 = Const.ROBOT_HANBANG_OBSERVE_MESSAGES;
							for (var _hoi2 = 0; _hoi2 < my.game.seq.length; _hoi2++) {
								var _hop2 = my.game.seq[_hoi2];
								if (typeof _hop2 === 'string') _hop2 = DIC[_hop2];
								if (!_hop2 || !_hop2.robot || _hop2 === client || _hop2 === nextPlayer) continue;
								if (_hop2.muteGame || _hop2._rageQuitting) continue;
								if (Math.random() > 0.4) continue;
								(function (_ob2) {
									setTimeout(function () {
										if (!_ob2._rageQuitting && !_ob2._removed) _ob2.chat(_hObsMsgs2[Math.floor(Math.random() * _hObsMsgs2.length)]);
									}, 1000 + Math.floor(Math.random() * 3000));
								})(_hop2);
							}
						}
					});

					function finalizeTurn(isHanbang) {
						// ========== 공격/플러시/잭팟/디펜스 보너스 계산 ==========
						var givenChar = my.game.char;
						var givenSubChar = my.game.subChar;

						// 공격 판정: 이을 수 있는 단어가 전체의 0.01% 이하
						var isAttack = false;
						if (typeof my.game.nextCharWordCount !== 'undefined') {
							isAttack = (my.game.nextCharWordCount / Math.max(my.game.totalWordCount, 500000) <= 0.0001);
						}
						if (isAttack && my.game.seq) {
							var nextAtkIdx = (my.game.turn + 1) % my.game.seq.length;
							var nextAtkP = my.game.seq[nextAtkIdx];
							my.game.pendingAttackDefense = {
								playerId: typeof nextAtkP === 'string' ? nextAtkP : (nextAtkP && nextAtkP.id),
								wordCount: my.game.nextCharWordCount
							};
						}

						// 플러시 보너스 (앞말잇기·랜덤잇기 제외, 쿵쿵따/앞쿵따 포함)
						var flushBonus = 0;
						if (my.opts.flush && !my.opts.first && !my.opts.random) {
							if (!client.game.flush) client.game.flush = { char: null, subChar: null, streak: 0 };
							var f = client.game.flush;
							var flushCharMatch = f.char && (
								givenChar === f.char ||
								(givenSubChar && givenSubChar === f.char) ||
								(f.subChar && f.subChar === givenChar)
							);
							if (text.length <= 2) {
								f.char = null; f.subChar = null; f.streak = 0;
							} else if (flushCharMatch) {
								f.streak++;
								f.char = givenChar; f.subChar = givenSubChar;
							} else {
								f.char = givenChar; f.subChar = givenSubChar; f.streak = 1;
							}
							if (f.streak >= 3) {
								flushBonus = Math.round(baseScoreWithoutMission * 0.20);
								if (my.game.seq) {
									var nextFlIdx = (my.game.turn + 1) % my.game.seq.length;
									var nextFlP = my.game.seq[nextFlIdx];
									my.game.pendingFlushDefense = typeof nextFlP === 'string' ? nextFlP : (nextFlP && nextFlP.id);
								}
							}
						}

						// 잭팟 보너스 (쿵쿵따/앞쿵따에서는 opts에 없으므로 자동 비활성)
						var jackpotBonus = 0;
						if (my.opts.jackpot) {
							if (!client.game.jackpot) client.game.jackpot = { length: null, streak: 0 };
							var jp = client.game.jackpot;
							if (text.length >= 7 && jp.length === text.length) {
								jp.streak++;
							} else if (text.length >= 7) {
								jp.length = text.length;
								jp.streak = 1;
							} else {
								jp.length = null;
								jp.streak = 0;
							}
							if (jp.streak >= 3) {
								jackpotBonus = Math.round(baseScoreWithoutMission * 0.80);
							}
						}

						// 디펜스 보너스
						var defenseBonus = 0;
						var defenseType = null;
						if (my.opts.defensebonus) {
							my.game.flushDefenseState = my.game.flushDefenseState || {};
							// 공격 방어
							if (my.game.pendingAttackDefense &&
								my.game.pendingAttackDefense.playerId === client.id) {
								var atkWC = my.game.pendingAttackDefense.wordCount;
								var atkRatio = (my.game.totalWordCount > 0)
									? Math.max(0, Math.min(atkWC / my.game.totalWordCount, 0.0001)) : 0;
								defenseBonus += Math.round(baseScoreWithoutMission * (0.50 - (atkRatio / 0.0001) * 0.25));
								defenseType = 'attack';
								my.game.pendingAttackDefense = null;
							}
							// 플러시 방어
							if (my.game.pendingFlushDefense === client.id) {
								my.game.flushDefenseState[client.id] = (my.game.flushDefenseState[client.id] || 0) + 1;
								var fdStreak = my.game.flushDefenseState[client.id];
								defenseBonus += Math.round(baseScoreWithoutMission * Math.min(0.15 + (fdStreak - 1) * 0.05, 0.50));
								defenseType = defenseType || 'flush';
								my.game.pendingFlushDefense = null;
							} else {
								my.game.flushDefenseState[client.id] = 0;
							}
						}
						// ====================================================

						// KJM/일본어 모드: 공격/방어 효과 비활성화
						if (gameType === 'KJM' || gameType === 'JSH' || gameType === 'JAP' || gameType === 'JKT') {
							isAttack = false;
							defenseBonus = 0;
							defenseType = null;
							my.game.pendingAttackDefense = null;
							my.game.pendingFlushDefense = null;
						}

						// ========== 서바이벌 모드: 득점 = 다음 사람 데미지 ==========
						if (my.opts.survival) {
							client.game.survivalSubmitted = true;
							var damage = score + flushBonus + jackpotBonus + defenseBonus;
							var survivalDamageInfo = Const.applySurvivalDamage(my, DIC, damage, my.game.turn);

							// 한방 단어 감지 저장
							if (isHanbang) {
								my.game.isHanbang = true;
							}

							var status = Const.checkSurvivalStatus(my, DIC);

							client.publish('turnEnd', {
								ok: true,
								value: text,
								mean: $doc.mean,
								theme: $doc.theme,
								wc: $doc.type,
								score: damage,
								bonus: missionBonus,
								speedToss: speedTossBonus,
								straightBonus: straightBonus,
								baby: $doc.baby,
								totalScore: client.game.score,
								linkIndex: linkIdx,
								isHanbang: isHanbang,
								survival: true,
								survivalDamage: survivalDamageInfo,
								attackerHP: client.game.score,
								jamoText: (gameType === 'KJM') ? Const.decomposeToJamo(text) : undefined,
								isAttack: isAttack || undefined,
								flushBonus: flushBonus > 0 ? flushBonus : undefined,
								jackpotBonus: jackpotBonus > 0 ? jackpotBonus : undefined,
								defenseBonus: defenseBonus > 0 ? defenseBonus : undefined,
								defenseType: defenseType || undefined
							}, true);

							if (status.gameOver) {
								clearTimeout(my.game.turnTimer);
								clearTimeout(my.game.robotTimer);
								clearTimeout(my.game._rrt);
								my.game._rrt = setTimeout(function () {
									my.roundEnd();
								}, 2000);
								return;
							}

							// 한방 단어로 다음 사람이 데미지 즉사한 경우: originalChar 복구
							// (turnEnd 타임아웃 KO 경로와 동일 — 받은 사람이 죽었으면 더 이을 게 없으므로 라운드 시작 글자로 리셋)
							if (isHanbang && survivalDamageInfo && survivalDamageInfo.ko && my.game.originalChar) {
								my.game.char = my.game.originalChar;
								my.game.subChar = my.game.originalSubChar;
								my.game.hanbangRecovery = true;
							}

							// 미션 처리
							if (my.game.mission === true) {
								my.game.mission = getMission(my.rule.lang, my.opts, gameType);
							} else if (my.opts.rndmission) {
								my.game.mission = getMission(my.rule.lang, my.opts, gameType);
							}

							// 아이템전 / 카오스: 아이템 지급 판정 (서바이벌)
							if (my.opts.item || my.opts.chaos) {
								var bp = Const.calcItemBonusPoints(itemMissionCount, speedTossBonus > 0, client.game.straightStreak, false);
								my.checkItemGrant(client.id, bp, true);
							}

							// 다음 턴으로 진행
							clearTimeout(my.game.turnTimer);
							clearTimeout(my.game.robotTimer);
							clearTimeout(my.game._rrt);
							my.game._rrt = setTimeout(function () {
								my.turnNext();
							}, my.game.turnTime / 6);

							if (!client.robot) {
								client.invokeWordPiece(text, 1);
								DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
							}
							return;
						}
						// ========== 서바이벌 모드 끝 ==========

						// Full House Bonus Logic
						var fullHouseBonus = 0;
						var fullHouseChars = [];
						if (my.opts.fullhouse && client.game.lastWord && client.game.lastWord.length > 0 && text.length > client.game.lastWord.length) {
							var prevWord = client.game.lastWord;
							var prevChars = prevWord.split('');
							var currentChars = text.split('');
							var matchCount = 0;
							var matchedIndices = [];

							for (var k = 0; k < prevChars.length; k++) {
								var foundIdx = currentChars.indexOf(prevChars[k]);
								if (foundIdx !== -1) {
									matchCount++;
									matchedIndices.push(foundIdx);
									currentChars[foundIdx] = null; // Mark as used
								} else {
									break; // If any character is missing, fail Full House
								}
							}

							if (matchCount === prevChars.length) {
								fullHouseBonus = Math.round(baseScoreWithoutMission * 0.60);
								if (my.opts.bbungtwigi) fullHouseBonus *= 2; // 뻥튀기: 보너스 2배
								fullHouseChars = matchedIndices;
							}
						}
						client.game.lastWord = text;

						// 최종 점수 = 기본 점수 + 미션 보너스 + 스피드보너스 + 스트레이트 보너스 + 풀하우스 보너스 + 플러시/잭팟/디펜스 보너스
						score = baseScoreWithoutMission + missionBonus + speedTossBonus + straightBonus + fullHouseBonus + flushBonus + jackpotBonus + defenseBonus;

						if (isReturn) {
							score = 0;
							missionBonus = 0;
							speedTossBonus = 0;
							straightBonus = 0;
							fullHouseBonus = 0;
							fullHouseChars = [];
							flushBonus = 0;
							jackpotBonus = 0;
							defenseBonus = 0;
							client.game.straightStreak = 0;
							if (client.game.flush) client.game.flush = null;
							if (client.game.jackpot) client.game.jackpot = null;
						}

						if (!client.game) {
							client.game = { score: 0, bonus: 0, team: 0 };
						}
						if (typeof client.game.score !== 'number' || isNaN(client.game.score)) {
							client.game.score = 0;
						}
						client.game.score += score;
						client.publish('turnEnd', {
							ok: true,
							value: text,
							mean: $doc.mean,
							theme: $doc.theme,
							wc: $doc.type,
							score: score,
							bonus: missionBonus,
							speedToss: speedTossBonus,
							straightBonus: straightBonus,
							fullHouseBonus: fullHouseBonus > 0 ? fullHouseBonus : undefined,
							fullHouseChars: fullHouseChars,
							baby: $doc.baby,
							totalScore: client.game.score,
							linkIndex: linkIdx,
							isHanbang: isHanbang,
							jamoText: (gameType === 'KJM') ? Const.decomposeToJamo(text) : undefined,
							isAttack: isAttack || undefined,
							flushBonus: flushBonus > 0 ? flushBonus : undefined,
							jackpotBonus: jackpotBonus > 0 ? jackpotBonus : undefined,
							defenseBonus: defenseBonus > 0 ? defenseBonus : undefined,
							defenseType: defenseType || undefined
						}, true);

						if (my.game.mission === true) {
							my.game.mission = getMission(my.rule.lang, my.opts, gameType);
						} else if (my.opts.rndmission) {
							// 랜덤미션: 달성하지 않아도 매 턴마다 미션 변경
							my.game.mission = getMission(my.rule.lang, my.opts, gameType);
						}
						// 아이템전 / 카오스: 아이템 지급 판정 (일반)
						if (my.opts.item || my.opts.chaos) {
							var bp = Const.calcItemBonusPoints(itemMissionCount, speedTossBonus > 0, client.game.straightStreak, fullHouseBonus > 0);
							my.checkItemGrant(client.id, bp, true);
						}

						setTimeout(my.turnNext, my.game.turnTime / 6);

						if (!client.robot) {
							client.invokeWordPiece(text, 1);
							DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
						}
					}
				}
			}
			// 랜덤 모드: getRandomChar로 매너 체크
			var isRandomMode = my.opts.random && !my.opts.middle && !my.opts.first && !my.opts.second;
			if (my.opts.unknown && isRandomMode) {
				// unknown 단어는 DB 조회 없이 글자 중 무작위 선택
				var langCharRegex = my.rule.lang === 'ko' ? /[가-힣ㄱ-ㅣ0-9]/ : my.rule.lang === 'ja' ? /[ぁ-ん0-9]/ : /[a-zA-Z0-9]/;
				var validIndices = [];
				for (var i = 0; i < text.length; i++) {
					var ch = text.charAt(i);
					if (langCharRegex.test(ch)) {
						validIndices.push(i);
					}
				}
				if (validIndices.length > 0) {
					var randIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
					my.game._pendingRandomResult = { index: randIdx, char: text.charAt(randIdx) };
					approved();
				} else {
					denied();
				}
			} else if (!my.opts.unknown && isRandomMode) {
				// 랜덤 모드 매너 체크를 preApproved에서 실행
				getRandomChar.call(my, text).then(function (randomResult) {
					if (randomResult) {
						// 유효한 연결 글자 저장 (approved에서 사용)
						my.game._pendingRandomResult = randomResult;
						approved();
					} else {
						// 매너 실패
						denied(firstMove ? 402 : 403);
					}
				});
			}
			// 비랜덤 모드: 기존 매너 체크
			else if (!my.opts.unknown) getAuto.call(my, preChar, preSubChar, 1).then(function (w) {
				var count = (typeof w === 'number') ? w : (w ? 1 : 0);
				var used = 0;
				var checkChars = [preChar];
				if (preSubChar) preSubChar.split("|").forEach(function (c) { if (c && checkChars.indexOf(c) == -1) checkChars.push(c); });
				var type = Const.GAME_TYPE[my.mode];
				var isKAP = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

				// 현재 입력하는 단어도 used에 포함 (한방 체크: "둬둬둬" 같은 케이스)
				var textMatch = false;
				checkChars.forEach(function (cc) {
					if (isKAP) {
						if (text.slice(-cc.length) === cc) textMatch = true;
					} else {
						if (text.indexOf(cc) === 0) textMatch = true;
					}
				});
				if (textMatch) used++;

				if (my.game.chain) {
					var checkChain = my.game.chain;
					if (my.opts.return) checkChain = my.game.chain.slice(-5);

					checkChain.forEach(function (doneWord) {
						var match = false;
						checkChars.forEach(function (cc) {
							if (isKAP) {
								if (doneWord.slice(-cc.length) === cc) match = true;
							} else {
								if (doneWord.indexOf(cc) === 0) match = true;
							}
						});
						if (match) used++;
					});
				}

				var trigramRemaining = count - used;
				// 실드: 매너 체크용은 통계 테이블의 raw count만 참고 (사용된 단어 차감 안 함)
				var trigramMannerRemaining = my.opts.shield ? count : trigramRemaining;

				// EKT 3-gram 모드: 3-gram과 2-gram 개수의 합으로 매너 체크
				function checkMannerAndProceed(totalRemaining, displayRemaining) {
					if (displayRemaining === undefined) displayRemaining = totalRemaining;
					var mannerMinRemaining = getMannerMinRemaining(my.opts);
					// 빨간 글씨 표시용: 항상 사용된 단어를 차감한 값 사용
					my.game.nextCharWordCount = displayRemaining;

					// KJM(자모이어가기)은 일반 음절 체인이 아니므로 매너/첫턴 체크를 적용하지 않음
					if (gameType !== 'KJM' && gameType !== 'JSH' && gameType !== 'JAP' && gameType !== 'JKT' && (firstMove || isMannerLike(my.opts)) && totalRemaining >= mannerMinRemaining) {
						// Stack Kill Prevention for Manner Mode/First Turn (SafeGuard)
						// Shield 모드는 깊은 체크 생략
						if (shouldDeepCheck(my.opts) && totalRemaining <= 10) {
							getAuto.call(my, preChar, preSubChar, 2).then(function (list) {
								if (!list || list.length === 0) {
									// Treat as Trap because Real DB found no words (contradicting Stats)
									denied(403);
									return;
								}

								// 이미 사용된 단어 필터링
								var availableList = list.filter(function (item) {
									return !my.game.chain || !my.game.chain.includes(item._id);
								});

								if (availableList.length === 0) {
									denied(403);
									return;
								}

								// Prepare valid start characters (Original + Dueum Variations)
								var startChars = [preChar];
								if (preSubChar) {
									preSubChar.split('|').forEach(function (sc) {
										if (sc && startChars.indexOf(sc) === -1) startChars.push(sc);
									});
								}

								// 사용 가능 단어가 3개 이하일 때: 함정 체크 + 매너 체크 통합
								// 각 단어가 (1) 자기 자신으로 돌아오지 않고 (2) 이을 단어가 있는지 확인
								if (availableList.length <= 3) {
									var checkPending = availableList.length;
									var hasValidWord = false;

									availableList.forEach(function (item) {
										var candidateWord = item._id;
										var candidateChar = getChar.call(my, candidateWord);
										var candidateSubChar = getSubChar.call(my, candidateChar);

										// 1. 자기 자신으로 돌아오는지 체크 (함정 체크)
										var linksToSelf = false;
										if (startChars.indexOf(candidateChar) !== -1) {
											linksToSelf = true;
										} else if (candidateSubChar) {
											var parts = candidateSubChar.split('|');
											for (var k = 0; k < parts.length; k++) {
												if (startChars.indexOf(parts[k]) !== -1) {
													linksToSelf = true;
													break;
												}
											}
										}

										if (linksToSelf) {
											// 자기 자신으로 돌아오면 비매너
											checkPending--;
											if (checkPending === 0 && !hasValidWord) {
												denied(403);
											}
											return;
										}

										// 2. 이을 단어가 있는지 체크 (매너 체크) - 매너 계열 모드일 때만
										if (isMannerLike(my.opts)) {
											getAuto.call(my, candidateChar, candidateSubChar, 1).then(function (nextCount) {
												var nextTotal = (typeof nextCount === 'number') ? nextCount : (nextCount ? 1 : 0);

												// 해당 단어로 시작하는 이미 사용된 단어 개수 계산
												var nextUsed = 0;
												var nextCheckChars = [candidateChar];
												if (candidateSubChar) candidateSubChar.split("|").forEach(function (c) {
													if (c && nextCheckChars.indexOf(c) == -1) nextCheckChars.push(c);
												});

												// 후보 단어 자체가 다음 글자로 시작하는지 체크 (예: "섹스텟"이 "텟"으로 시작하지 않음)
												var candidateMatchesNext = false;
												nextCheckChars.forEach(function (cc) {
													if (isKAP) {
														if (candidateWord.slice(-cc.length) === cc) candidateMatchesNext = true;
													} else {
														if (candidateWord.indexOf(cc) === 0) candidateMatchesNext = true;
													}
												});
												if (candidateMatchesNext) nextUsed++;

												if (my.game.chain) {
													var nextCheckChain = my.game.chain;
													if (my.opts.return) nextCheckChain = my.game.chain.slice(-5);

													nextCheckChain.forEach(function (doneWord) {
														var match = false;
														nextCheckChars.forEach(function (cc) {
															if (isKAP) {
																if (doneWord.slice(-cc.length) === cc) match = true;
															} else {
																if (doneWord.indexOf(cc) === 0) match = true;
															}
														});
														if (match) nextUsed++;
													});
												}

												var nextRemaining = nextTotal - nextUsed;

												if (nextRemaining >= 1) {
													hasValidWord = true;
												}

												checkPending--;
												if (checkPending === 0) {
													if (hasValidWord) {
														approved();
													} else {
														denied(403);
													}
												}
											});
										} else {
											// 매너 모드가 아니면 함정만 아니면 통과
											hasValidWord = true;
											checkPending--;
											if (checkPending === 0) {
												if (hasValidWord) {
													approved();
												} else {
													denied(403);
												}
											}
										}
									});
								} else {
									// 4개 이상일 때: 기존 함정 체크만 수행
									var isStack = true;
									for (var i = 0; i < availableList.length; i++) {
										var w = availableList[i]._id;
										var nc = getChar.call(my, w);
										var ns = getSubChar.call(my, nc);

										var linksToSelf = false;
										if (startChars.indexOf(nc) !== -1) linksToSelf = true;
										else if (ns) {
											var parts = ns.split('|');
											for (var k = 0; k < parts.length; k++) {
												if (startChars.indexOf(parts[k]) !== -1) {
													linksToSelf = true;
													break;
												}
											}
										}

										if (!linksToSelf) {
											isStack = false;
											break;
										}
									}

									if (isStack) {
										denied(403);
									} else {
										approved();
									}
								}
							});
						} else {
							approved();
						}
					}
					else if (gameType !== 'KJM' && gameType !== 'JSH' && gameType !== 'JAP' && gameType !== 'JKT' && (firstMove || isMannerLike(my.opts))) {
						denied(firstMove ? 402 : 403);
					} else {
						approved();
					}
				}

				// EKT/KKU 3-gram 모드: 2-gram도 함께 조회하여 합산
				if ((gameType === 'EKT' || gameType === 'KKU') && preChar.length >= 3) {
					// First 규칙: 앞 2글자 (AB), 그 외: 뒤 2글자 (BC)
					var bigramChar = my.opts.first ? preChar.slice(0, 2) : preChar.slice(1);
					getAuto.call(my, bigramChar, null, 1).then(function (bigramRes) {
						var bigramCount = (typeof bigramRes === 'number') ? bigramRes : (bigramRes ? 1 : 0);
						var bigramUsed = 0;

						// 2-gram 사용된 단어 계산
						if (my.game.chain) {
							var checkChain = my.game.chain;
							if (my.opts.return) checkChain = my.game.chain.slice(-5);

							checkChain.forEach(function (doneWord) {
								if (doneWord.indexOf(bigramChar) === 0) bigramUsed++;
							});
						}

						var bigramRemaining = bigramCount - bigramUsed;
						var displayTotal = trigramRemaining + bigramRemaining;
						// 실드: 매너 체크용은 통계 테이블의 raw count만 참고
						var mannerTotal = my.opts.shield ? (count + bigramCount) : displayTotal;


						checkMannerAndProceed(mannerTotal, displayTotal);
					});
				} else {
					checkMannerAndProceed(trigramMannerRemaining, trigramRemaining);
				}
			});
			else approved();
		}

		function denied(code) {
			my.game.loading = false;
			// 매너 체크 실패(402/403)이고 선호 글자로 시도한 경우에만 선호 글자 거부 플래그 설정
			if (client.robot && (code === 402 || code === 403) && client.data._usingPreferredChar) {
				client.data._preferredCharRejected = true;
			}
			if (client.robot) client.data._usingPreferredChar = false;
			client.publish('turnError', {
				code: code || 404,
				value: text
			}, true);
			if (my.opts.one) my.turnEnd();
			else if (client.robot && text.indexOf("T.T") == -1 && !Const.ROBOT_DEFEAT_MESSAGES.includes(text) && !Const.ROBOT_ANGRY_MESSAGES.includes(text) && text.indexOf("..") == -1 && text.indexOf("??") == -1 && !(text.length === 3 && text[0] === text[1] && text[1] === text[2])) {
				setTimeout(function () {
					my.readyRobot(client);
				}, 1000);
			}
		}
		if (my.opts.unknown) {
			if ($doc) denied(410);
			else {
				var valid = true;
				var isRandomMode = my.opts.random && !my.opts.middle && !my.opts.first && !my.opts.second;
				if (isMannerLike(my.opts) && !isRandomMode) {
					if (my.rule.lang == "ko") {
						if (!preChar.match(/[가-힣ㄱ-ㅎㅏ-ㅣ0-9]/)) valid = false;
					} else if (my.rule.lang == "ja") {
						if (!/^[ぁ-ん0-9]+$/.test(preChar)) valid = false;
					} else {
						if (!/^[a-zA-Z0-9]+$/.test(preChar)) valid = false;
					}
				}

				if (!valid) denied();
				else {
					// Construct mock $doc for unknown word
					$doc = {
						mean: "언노운 워드",
						theme: "",
						type: "unknown",
						hit: 0,
						baby: 0,
						flag: 0
					};
					if (my.opts.nododoli && isDodoli.call(my, text)) denied(412);
					else preApproved();
				}
			}
		} else if ($doc) {
			if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) denied();
			else if (!my.opts.allpos && my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) denied(406);
			else if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) denied(405);
			else if (my.opts.nododoli && isDodoli.call(my, text)) denied(412);
			else preApproved();
		} else {
			denied();
		}
	}

	function checkspeedToss(prevWord, currentWord) {
		if (!prevWord || !currentWord || currentWord.length < 3) return false;

		var type = Const.GAME_TYPE[my.mode];
		var isRev = (type === 'KAP' || type === 'KAK' || type === 'EAP' || type === 'EAK');

		// Normal: prev(Start) == curr(End) ? No, Sumi-Sanggwan is:
		// Normal Word Chain: A -> B
		// Sumi-Sanggwan: B's linking char (End) == A's first char (Start)

		// Reverse Word Chain: A <- B
		// Sumi-Sanggwan: B's linking char (Start) == A's last char (End)

		var prevTargetChar, currLinkChar;

		if (isRev) {
			if (my.opts.first && !my.opts.middle && !my.opts.second) {
				// First Rule ONLY in Reverse (Link: Back->Back)
				// Bonus: Start == Back
				currLinkChar = currentWord.charAt(0);
				prevTargetChar = prevWord.slice(-1);
			} else {
				currLinkChar = getChar.call(my, currentWord);
				prevTargetChar = prevWord.slice(-1); // Last char of previous word
			}
		} else {
			// Normal Game (KKT):
			// currLinkChar = getChar(curr). (e.g., KKT: text.slice(-1) or text.slice(text.length-3) for EKT)
			// prevTargetChar = prevWord.charAt(0);

			if (my.opts.first && !my.opts.middle && !my.opts.second) {
				// First Rule ONLY in Normal (Link: Front->Front)
				// Bonus: End == Front
				currLinkChar = currentWord.slice(-1);
				prevTargetChar = prevWord.charAt(0);
			} else {
				currLinkChar = getChar.call(my, currentWord);
				prevTargetChar = prevWord.charAt(0);
			}
		}

		// Apply Head Rule (SubChar) to Current Link Char
		var subChars = getSubChar.call(my, currLinkChar);

		// Check exact match
		if (currLinkChar === prevTargetChar) return currLinkChar;

		// Check Head Rule match
		if (subChars) {
			var subs = subChars.split('|');
			for (var i = 0; i < subs.length; i++) {
				if (subs[i] === prevTargetChar) return subs[i];
			}
		}

		return false;
	}

	function isChainable() {
		var type = Const.GAME_TYPE[my.mode];
		var char = my.game.char,
			subChar = my.game.subChar;
		var l = char.length;
		// subChar를 배열로 분리 (파이프로 구분된 경우)
		var subChars = subChar ? subChar.split('|') : [];

		if (!text) return false;

		// KJM: 자모 체인 확인
		if (type === 'KJM') {
			var decomposed = Const.decomposeToJamo(text);
			if (decomposed.length <= 1) return false;
			if (my.game.wordLength && text.length != my.game.wordLength) return false;
			if (my.opts.middle) {
				var jamoLen = decomposed.length;
				var midIdx = (jamoLen % 2 !== 0)
					? Math.floor(jamoLen / 2)
					: (my.opts.second ? (jamoLen / 2 - 1) : (jamoLen / 2));
				if (midIdx < 0 || midIdx >= jamoLen) return false;
				return decomposed[midIdx] === char || subChars.indexOf(decomposed[midIdx]) !== -1;
			}
			return Const.kjmStartsWith(decomposed, my.game.char);
		}

		if (text.length <= l) return false;
		if (my.game.wordLength && text.length != my.game.wordLength) return false;
		if (type == "KAP" || type == "KAK" || type == "EAP" || type == "EAK") {
			var lastChar = text.slice(-1);
			return (lastChar == char) || subChars.some(function (sc) {
				return lastChar == sc;
			});
		}
		if (type == "JAP") {
			// 앞말잇기: 타겟(char)은 이전 단어의 첫 글자 — 작은 가나로 시작하는 단어는 체인 조회에서 제외되므로 항상 큰 가나.
			// 제출된 새 단어의 마지막 글자는 작은 가나일 수 있어 jaEdgeChar로 전처리 후 비교.
			return util.jaCharMatch(util.jaEdgeChar(text, my), char, my);
		}
		if (type == "JSH" || type == "JKT") {
			// 끝말잇기/쿵쿵따: 타겟(char)은 이전 단어의 마지막 글자를 jaEdgeChar로 이미 전처리한 값 (getChar 참고)
			return util.jaCharMatch(text.charAt(0), char, my);
		}

		if (text.indexOf(char) === 0) return true;
		if (subChars.some(function (sc) {
			return text.indexOf(sc) === 0;
		})) return true;

		return false;
	}
	// ja: 작은 가나로 시작하는 표제어도 사전엔 있지만, jaCharMatch가 항상 "정상 글자"만 타겟/비교값으로
	// 쓰도록 보장하므로 체인 후보로는 애초에 매칭될 수 없음 — 별도 쿼리 필터 불필요 (단어대결 등에서는 그대로 조회 가능)
	var typeFilter = (l == "ko") ? (my.opts.allpos ? null : ['type', Const.KOR_GROUP]) : (l == "ja") ? null : ['_id', Const.ENG_ID];
	var findArgs = [['_id', text]];
	if (typeFilter) findArgs.push(typeFilter);
	DB.kkutu[l].findOne.apply(DB.kkutu[l], findArgs
	).limit(['mean', true], ['theme', true], ['type', true], ['hit', true], ['flag', true]).on(onDB);
};
exports.getScore = function (text, delay, ignoreMission) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score, arr;
	var gameType = Const.GAME_TYPE[my.mode];

	if (!text || !my.game.chain || !my.game.dic) return 0;

	// 서바이벌 밸런스 보정: 아이템/카오스/랜덤턴이 모두 없는 순차 진행에서는
	// 턴 순서상 나중에 낼수록 체인이 길어져 유리해지므로, 같은 바퀴(생존자 수만큼 한 바퀴)
	// 내의 모든 플레이어에게 동일한 체인 값(바퀴 수 * 생존자 수)을 적용해 공정하게 만든다.
	var chainForScore = my.game.chain;
	if (my.opts.survival && !my.opts.item && !my.opts.chaos && !my.opts.randomturn) {
		var aliveN = Const.checkSurvivalStatus(my, DIC).aliveCount;
		if (aliveN > 0) {
			var lapIndex = Math.floor(my.game.chain.length / aliveN);
			chainForScore = new Array(lapIndex * aliveN);
		}
	}

	score = (gameType === 'KJM')
		? Const.getPreScoreJamo(text, chainForScore, tr)
		: Const.getPreScore(text, chainForScore, tr);

	if (my.game.dic[text]) score *= 15 / (my.game.dic[text] + 15);
	if (!ignoreMission && my.game.mission && typeof my.game.mission === "string") {
		// KJM: 자모 분해 문자열에서 미션 자모 개수 계산
		if (gameType === 'KJM') {
			var jamoStr = Const.decomposeToJamo(text);
			var missionJamo = my.game.mission;
			var mCount = 0;
			for (var ci = 0; ci < jamoStr.length; ci++) {
				if (jamoStr[ci] === missionJamo) mCount++;
			}
			if (mCount > 0) {
				var missionBonus = score * 0.30 * mCount;
				if (my.opts.bbungtwigi) missionBonus *= 2;
				score += missionBonus;
				my.game.mission = true;
			}
		// 쉬운 미션 (easymission) 규칙: 초성과 중성만 일치하면 미션 달성
		} else if (my.opts.easymission && my.rule.lang === "ko") {
			var missionChar = my.game.mission;
			var matchCount = 0;

			// 미션 글자의 초성+중성 값 (28로 나눈 몫)
			var missionCode = missionChar.charCodeAt(0) - 0xAC00;
			if (missionCode >= 0 && missionCode <= 11171) {
				var missionBase = Math.floor(missionCode / 28);

				// 입력 단어의 각 글자를 검사
				for (var i = 0; i < text.length; i++) {
					var charCode = text.charCodeAt(i) - 0xAC00;
					if (charCode >= 0 && charCode <= 11171) {
						// 초성+중성이 일치하면 카운트
						if (Math.floor(charCode / 28) === missionBase) {
							matchCount++;
						}
					}
				}

				if (matchCount > 0) {
					var missionBonus = score * 0.30 * matchCount;
					if (my.opts.bbungtwigi) missionBonus *= 2; // 뻥튀기: 미션 보너스 2배
					score += missionBonus;
					my.game.mission = true;
				}
			}
		} else {
			// 기본 미션 규칙
			if (arr = text.match(new RegExp(my.game.mission, "g"))) {
				var missionBonus = score * 0.30 * arr.length;
				if (my.opts.bbungtwigi) missionBonus *= 2; // 뻥튀기: 미션 보너스 2배
				score += missionBonus;
				my.game.mission = true;
			}
		}
	}
	var result = Math.round(score);
	return isNaN(result) ? 0 : result;
};
exports.readyRobot = bot.readyRobot;
