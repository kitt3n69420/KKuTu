var Const = require('../../const');
var util = require('./classic-util');

var ctx = util.ctx;
var getAuto = util.getAuto;
var getChar = util.getChar;
var getSubChar = util.getSubChar;
var getLinkIndex = util.getLinkIndex;
var isDodoli = util.isDodoli;
var shuffle = util.shuffle;
var getNextTurnLength = util.getNextTurnLength;
var getMannerState = util.getMannerState;
var getMannerCacheKey = util.getMannerCacheKey;
var getAttackChars = util.getAttackChars;
var isMannerLike = util.isMannerLike;
var getStatsDoc = util.getStatsDoc;
var getMannerMinRemaining = util.getMannerMinRemaining;
var shouldDeepCheck = util.shouldDeepCheck;
var escapeRegExp = util.escapeRegExp;
var ROBOT_START_DELAY = util.ROBOT_START_DELAY;
var ROBOT_TYPE_COEF = util.ROBOT_TYPE_COEF;
var ROBOT_THINK_COEF = util.ROBOT_THINK_COEF;
var ROBOT_HIT_LIMIT = util.ROBOT_HIT_LIMIT;
var ROBOT_LENGTH_LIMIT = util.ROBOT_LENGTH_LIMIT;
var ROBOT_CANDIDATE_LIMIT = util.ROBOT_CANDIDATE_LIMIT;
var SPECIAL_MOVE_PROB = util.SPECIAL_MOVE_PROB;
var PERSONALITY_CONST = util.PERSONALITY_CONST;
var PREFERRED_CHAR_PROB = util.PREFERRED_CHAR_PROB;
var RIEUL_TO_NIEUN = util.RIEUL_TO_NIEUN;
var RIEUL_TO_IEUNG = util.RIEUL_TO_IEUNG;
var NIEUN_TO_IEUNG = util.NIEUN_TO_IEUNG;
var PRIORITY_ATTACK_CHARS = util.PRIORITY_ATTACK_CHARS;
var PRIORITY_ATTACK_CHARS_MANNER = util.PRIORITY_ATTACK_CHARS_MANNER;
var PRIORITY_KAP_ATTACK_CHARS = util.PRIORITY_KAP_ATTACK_CHARS;
var PRIORITY_KAP_ATTACK_CHARS_MANNER = util.PRIORITY_KAP_ATTACK_CHARS_MANNER;
var PRIORITY_KAP_ATTACK_CHARS_EN = util.PRIORITY_KAP_ATTACK_CHARS_EN;
var PRIORITY_ATTACK_CHARS_EN = util.PRIORITY_ATTACK_CHARS_EN;
var PRIORITY_ATTACK_CHARS_MANNER_EN = util.PRIORITY_ATTACK_CHARS_MANNER_EN;
var DUBANG = util.DUBANG;
var DUBANG_KAP = util.DUBANG_KAP;
var AVOID_FD = util.AVOID_FD;
var AVOID_VI = util.AVOID_VI;

exports.readyRobot = function (robot) {
	var my = this;
	var level = robot.level;
	var delay = ROBOT_START_DELAY[level];
	var ended = {};
	var w, text, i;
	var lmax;
	var isRev = (Const.GAME_TYPE[my.mode] == "KAP" || Const.GAME_TYPE[my.mode] == "KAK" || Const.GAME_TYPE[my.mode] == "EAP" || Const.GAME_TYPE[my.mode] == "EAK");
	var personality = robot.data.personality || 0;
	var preferredChar = robot.data.preferredChar;
	var isKKU = (Const.GAME_TYPE[my.mode] === "KKU");

	// KKU 모드: 성격 값이 0보다 크면 0으로 취급
	if (isKKU && personality > 0) {
		personality = 0;
	}


	// Helper: Count next words for a given character
	// Helper: Count next words for a given character using Pre-calculated Stats
	function countNextWords(char) {
		return new Promise(function (resolve, reject) {
			if (!char) return resolve(0);

			// Determine State Index (0-15, bit3=allpos, 에티켓: 항상 injeong OFF 강제)
			var state = getMannerState(my.opts);

			var isKo = my.rule.lang === 'ko';

			// Determine Column
			var col;
			var shortCol = null;
			if (isKo) {
				// noLong 모드: startshort/endshort 컬럼 사용 (2~8글자 단어 수)
				// noShort 모드: 전체(start_all) - startshort = 9글자 이상 단어 수
				// no2 모드: 전체(start_all) - start2 = 3글자 이상 단어 수
				if (my.opts.nolong) {
					col = isRev ? `endshort_${state}` : `startshort_${state}`;
				} else if (my.opts.noshort) {
					col = isRev ? `endall_${state}` : `startall_${state}`;
					shortCol = isRev ? `endshort_${state}` : `startshort_${state}`;
				} else if (my.opts.no2) {
					col = isRev ? `endall_${state}` : `startall_${state}`;
					shortCol = isRev ? `end2_${state}` : `start2_${state}`;
				} else {
					var nextLen = getNextTurnLength.call(my);
					var lenSuffix = (nextLen === 2) ? "2" : (nextLen === 3) ? "3" : (nextLen === 4) ? "4" : "all";
					col = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
				}
			} else {
				// 영어: noLong 모드일 때 countshort 컬럼 사용 (2~8글자)
				// noShort 모드일 때 전체 - countshort = 9글자 이상
				// no2 모드일 때 전체 - count2 = 3글자 이상
				if (my.opts.nolong) {
					col = `countshort_${state}`;
				} else if (my.opts.noshort) {
					col = `count_${state}`;
					shortCol = `countshort_${state}`;
				} else if (my.opts.no2) {
					col = `count_${state}`;
					shortCol = `count2_${state}`;
				} else {
					col = `count_${state}`;
				}
			}

			// Dueum/SubChar Logic (Read-Time)
			// Need to check char AND subChar(s) and SUM them?
			// But for Bot logic, we usually check if *any* next word exists.
			// Summing is safer.
			var chars = [char];
			var subChar = getSubChar.call(my, char);
			if (subChar) {
				subChar.split('|').forEach(sc => {
					if (sc && !chars.includes(sc)) chars.push(sc);
				});
			}

			var total = 0;
			var totalShort = 0;
			var lang = isKo ? 'ko' : 'en';

			chars.forEach(function (c) {
				var doc = getStatsDoc(lang, c);
				var charCount = (doc && doc[col]) ? doc[col] : 0;
				var shortCount = (shortCol && doc && doc[shortCol]) ? doc[shortCol] : 0;
				total += charCount;
				totalShort += shortCount;
			});
			var finalTotal = shortCol ? (total - totalShort) : total;
			resolve(finalTotal);
		});
	}

	// EKT 매너 필터: 연결 가능한 단어가 있는 단어만 반환 (통계 테이블 사용)
	function filterEKTManner(list) {
		return new Promise(function (resolve) {
			if (!list || list.length === 0) return resolve([]);

			var state = getMannerState(my.opts);
			var col = `count_${state}`;
			var results = [];

			list.forEach(function (w) {
				var word = w._id;
				if (word.length < 4) {
					results.push(w);
					return;
				}

				var trigram = getChar.call(my, word);
				var bigram = null;
				if (!(my.opts.first && (Const.GAME_TYPE[my.mode] === 'KKU' || Const.GAME_TYPE[my.mode] === 'EKT'))) {
					bigram = trigram.slice(1);
				}

				var triDoc = getStatsDoc('en', trigram);
				var trigramCount = (triDoc && triDoc[col]) ? triDoc[col] : 0;
				var bigramCount = 0;
				if (bigram) {
					var biDoc = getStatsDoc('en', bigram);
					bigramCount = (biDoc && biDoc[col]) ? biDoc[col] : 0;
				}

				var trigramUsed = 0;
				var bigramUsed = 0;
				if (my.game.chain) {
					var checkChain = my.game.chain;
					if (my.opts.return) checkChain = my.game.chain.slice(-5);
					checkChain.forEach(function (doneWord) {
						if (doneWord.indexOf(trigram) === 0) trigramUsed++;
						if (bigram && doneWord.indexOf(bigram) === 0) bigramUsed++;
					});
				}

				var remaining = (trigramCount - trigramUsed) + (bigramCount - bigramUsed);
				if (remaining >= 1) results.push(w);
			});
			resolve(results);
		});
	}

	// KKU 전용 봇 로직: 단어 가져오기 → 셔플 → 하나씩 매너 체크 → 첫 통과 단어 사용
	function executeKKUBot() {
		var FETCH_SIZE = 50;
		var fetched = [];
		var fetchAttempt = 1;

		function fetchWords(offset) {
			getAuto.call(my, my.game.char, my.game.subChar, 2, 1).then(function (list) {
				if (!list || list.length === 0) {
					if (fetched.length === 0) {
						return denied();
					}
					// 더 이상 가져올 단어가 없으면 현재 fetched에서 시도
					return tryFromList(fetched);
				}

				// 4글자 이상, 사용되지 않은 단어만 필터
				list = list.filter(function (w) {
					if (w._id.length < 4) return false;
					if (robot._done.has(w._id)) return false;
					if (my.game.chain && my.game.chain.includes(w._id)) return false;
					// 도돌이 금지: 봇도 도돌이 단어 제외
					if (my.opts.nododoli && isDodoli.call(my, w._id)) return false;
					if (my.opts.noswear && ctx.checkSwearWords && ctx.checkSwearWords(w._id).length > 0) return false;
					return true;
				});

				if (list.length === 0) {
					if (fetched.length === 0) {
						return denied();
					}
					return tryFromList(fetched);
				}

				// 셔플해서 fetched에 추가
				list = shuffle(list);
				fetched = fetched.concat(list);

				tryFromList(fetched);
			});
		}

		function tryFromList(list) {
			if (list.length === 0) {
				return denied();
			}

			// 매너 모드가 아니면 첫 번째 단어 바로 사용
			if (!isMannerLike(my.opts)) {
				return pickWord(list[0]);
			}

			// 매너 모드: 하나씩 체크
			checkNextWord(list, 0);
		}

		function checkNextWord(list, index) {
			if (index >= list.length) {
				// 모든 단어가 매너 체크 실패 → 더 가져오기
				fetchAttempt++;
				getAuto.call(my, my.game.char, my.game.subChar, 2, fetchAttempt).then(function (moreList) {
					if (!moreList || moreList.length === 0) {
						return denied();
					}
					moreList = moreList.filter(function (w) {
						if (w._id.length < 4) return false;
						if (robot._done.has(w._id)) return false;
						if (my.game.chain && my.game.chain.includes(w._id)) return false;
						if (fetched.some(function (existing) { return existing._id === w._id; })) return false;
						if (my.opts.nododoli && isDodoli.call(my, w._id)) return false;
						if (my.opts.noswear && ctx.checkSwearWords && ctx.checkSwearWords(w._id).length > 0) return false;
						return true;
					});

					if (moreList.length === 0) {
						return denied();
					}

					fetched = fetched.concat(moreList);
					moreList = shuffle(moreList);
					checkNextWord(moreList, 0);
				});
				return;
			}

			var w = list[index];
			var word = w._id;
			var trigram = getChar.call(my, word);
			var bigram = null;
			// KKU First Rule: 2-char connection.
			if (!(my.opts.first && Const.GAME_TYPE[my.mode] === 'KKU')) {
				bigram = trigram.slice(1);
			}

			// DB에서 다음 단어 존재 여부 확인
			var regexStr = `^(${escapeRegExp(trigram)}`;
			if (bigram) {
				regexStr += `|${escapeRegExp(bigram)}`;
			}
			regexStr += ').';

			var query = [
				['_id', new RegExp(regexStr)]
			];

			if (!my.opts.injeong) query.push(['flag', { '$nand': Const.KOR_FLAG.INJEONG }]);
			if (my.opts.loanword) query.push(['flag', { '$nand': Const.KOR_FLAG.LOANWORD }]);
			if (my.opts.allpos) {
				// allpos: 품사 필터 없음
			} else if (my.opts.strict) {
				query.push(['type', Const.KOR_STRICT], ['flag', { $lte: 3 }]);
			} else {
				query.push(['type', Const.KOR_GROUP]);
			}

			util.ctx.DB.kkutu.ko.find(...query).limit(5).on(function (docs) {
				var available = docs ? docs.filter(function (d) {
					return !my.game.chain || !my.game.chain.includes(d._id);
				}).length : 0;


				if (available > 0) {
					// 매너 통과
					return pickWord(w);
				}

				// 다음 단어로
				checkNextWord(list, index + 1);
			}, null, function () {
				// DB 에러 → 다음 단어로
				checkNextWord(list, index + 1);
			});
		}

		function pickWord(w) {
			if (my.game.late) return;
			text = w._id;
			delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
			robot._done.add(text);
			my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, text);
		}

		// 시작
		fetchWords(0);
	}
	if (my.opts.unknown) {
		var gen = "";
		var len;
		var pool = [];
		var usePreferred = false;

		// Check if preferredChar matches the game language
		if (preferredChar) {
			if (my.rule.lang == "ko" && /[가-힣]/.test(preferredChar)) usePreferred = true;
			else if (my.rule.lang == "en" && /[a-zA-Z]/.test(preferredChar)) usePreferred = true;
		}

		if (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK") {
			len = my.game.wordLength - 1;
		} else {
			switch (level) {
				case 0:
					len = Math.floor(Math.random() * 2) + 1;
					break; // 1~2
				case 1:
					len = Math.floor(Math.random() * 3) + 2;
					break; // 2~4
				case 2:
					len = Math.floor(Math.random() * 5) + 4;
					break; // 4~8
				case 3:
					len = Math.floor(Math.random() * 9) + 8;
					break; // 8~16
				case 4:
					len = Math.floor(Math.random() * 17) + 16;
					break; // 16~32
				default:
					len = Math.floor(Math.random() * 5) + 2;
					break;
			}
			// nolong 모드: 최대 7글자 (char 포함 8글자)
			if (my.opts.nolong && len > 7) {
				len = Math.floor(Math.random() * 6) + 1; // 1~7 -> 최종 2~8글자
			}
			// noshort 모드: 최소 8글자 (char 포함 9글자), level 0,1은 최대 11글자
			if (my.opts.noshort) {
				var minUnkLen = 8; // char 포함 최소 9글자
				var maxUnkLen = (level <= 1) ? 11 : len; // level 0,1은 최대 12글자
				if (len < minUnkLen) len = minUnkLen;
				if (len > maxUnkLen) len = maxUnkLen;
			}
			// no2 모드: 최소 2글자 (char 포함 최소 3글자)
			if (my.opts.no2 && len < 2) {
				len = 2;
			}
		}

		if (my.game.mission) {
			// Mission active: use current mission char(s)
			pool = [my.game.mission];
		}

		for (i = 0; i < len; i++) {
			var usePool = pool.length > 0;
			if ((Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK") && i >= len - 1) usePool = false;

			// Determine if we should force preferred char
			// Normal: Last char of 'gen' (which becomes last char of word)
			// Reverse: First char of 'gen' (which becomes first char of word)
			var forceChar = false;
			if (usePreferred) {
				if (isRev) {
					if (i === 0) forceChar = true;
				} else {
					if (i === len - 1) forceChar = true;
				}
			}

			if (forceChar) {
				gen += preferredChar;
			} else if (usePool) {
				gen += pool[Math.floor(Math.random() * pool.length)];
			} else {
				if (my.rule.lang == "ko") {
					gen += String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));
				} else {
					gen += String.fromCharCode(97 + Math.floor(Math.random() * 26));
				}
			}
		}

		if (isRev) text = gen + my.game.char;
		else text = my.game.char + gen;

		delay += 400; // Basic delay
		after();
		return;
	}

	// Priority 1: Preferred Character Logic (Direct Query)
	// 매너 계열 규칙에서 선호 글자가 한번 거부당하면 다시 시도하지 않음
	if (preferredChar && robot.data._preferredCharRejected) {
		preferredChar = null;
	}
	if (preferredChar && Math.random() < PREFERRED_CHAR_PROB[level]) {
		var proceed = Promise.resolve(true);

		// Safety Check: On the first turn, ensure the preferred char doesn't lead to a dead end
		if (my.game.chain.length === 0) {
			proceed = countNextWords(preferredChar).then(function (count) {
				if (count === 0) {
					return false;
				}
				return true;
			});
		}

		proceed.then(function (canUse) {
			if (!canUse) {
				decideStrategy();
				return;
			}



			var adc = my.game.char + (my.game.subChar ? ("|" + my.game.subChar) : "");
			var regex;

			// Dynamic Regex Construction for Gaon/Second/First Rules
			// getChar() 우선순위: middle > first > second > default
			// 조합에 따라 연결 위치가 달라지므로 케이스별 분기
			var needJSCheck = false; // true면 DB에서 느슨하게 가져온 뒤 JS에서 getChar() 검증

			if (my.opts.middle) {
				// 미들: 길이에 따라 위치가 변동 → 정규식 불가, JS 필터링
				needJSCheck = true;
				if (isRev) {
					regex = `^.*${preferredChar}.*(${adc})$`;
				} else {
					regex = `^(${adc}).*${preferredChar}.*$`;
				}
			} else if (my.opts.first && my.opts.second) {
				// 첫말+세컨드: 위치 고정 (끝말:idx=1, 앞말:idx=len-2)
				if (isRev) {
					// KAP+first+second: preferredChar at len-2
					regex = `^(${adc}).*${preferredChar}.$`;
				} else {
					// 끝말+first+second: preferredChar at idx=1
					regex = `^.${preferredChar}.*(${adc})$`;
				}
			} else if (my.opts.first) {
				// 첫말만: 위치 고정 (끝말:idx=0, 앞말:idx=len-1)
				if (isRev) {
					regex = `^(${adc}).*${preferredChar}$`;
				} else {
					regex = `^${preferredChar}.*(${adc})$`;
				}
			} else if (my.opts.second) {
				// 세컨드만: 위치 고정 (끝말:idx=len-2, 앞말:idx=1)
				if (isRev) {
					regex = `^.${preferredChar}.*(${adc})$`;
				} else {
					regex = `^(${adc}).*${preferredChar}.$`;
				}
			} else {
				if (isRev) {
					// Ends with game char (adc), starts with preferred char
					var midPattern = ".*";
					if (my.game.wordLength) {
						var midLen = Math.max(0, my.game.wordLength - 2);
						midPattern = `.{${midLen}}`;
					}
					regex = `^${preferredChar}${midPattern}(${adc})$`;
				} else {
					// Starts with game char (adc), ends with preferred char
					var midPattern = ".*";
					if (my.game.wordLength) {
						var midLen = Math.max(0, my.game.wordLength - 2);
						midPattern = `.{${midLen}}`;
					}
					regex = `^(${adc})${midPattern}${preferredChar}$`;
				}
			}

			var query = [
				['_id', new RegExp(regex)]
			];
			var flagMask = 0;

			// Apply Rule Filters
			if (my.rule.lang == "ko") {
				// Injeong: If OFF, exclude INJEONG words
				if (!my.opts.injeong) flagMask |= Const.KOR_FLAG.INJEONG;

				// Loanword: If ON (Forbid), exclude LOANWORD words
				if (my.opts.loanword) flagMask |= Const.KOR_FLAG.LOANWORD;

				// Strict: If ON, exclude SPACED, SATURI, OLD, MUNHWA
				if (my.opts.allpos) {
					// allpos: 품사 필터 없음
				} else if (my.opts.strict) {
					flagMask |= (Const.KOR_FLAG.SPACED | Const.KOR_FLAG.SATURI | Const.KOR_FLAG.OLD | Const.KOR_FLAG.MUNHWA);
					query.push(['type', Const.KOR_STRICT]);
				} else {
					query.push(['type', Const.KOR_GROUP]);
				}

				if (flagMask > 0) {
					query.push(['flag', {
						'$nand': flagMask
					}]);
				}
			} else {
				// English rules
				query.push(['_id', Const.ENG_ID]);
			}

			// needJSCheck: DB에서 넉넉히 가져온 뒤 JS에서 getChar() 위치 필터링
			var dbLimit = needJSCheck ? 200 : 20;
			util.ctx.DB.kkutu[my.rule.lang].find(
				...query
			).limit(dbLimit).on(function (list) {
				// Filter done words + 미들 위치 검증
				if (list && list.length) {
					var minLen = 1;
					var maxLen = ROBOT_LENGTH_LIMIT[level];
					// nolong 모드: 최대 8글자
					if (my.opts.nolong) {
						maxLen = Math.min(maxLen, 8);
					}
					// noshort 모드: 최소 9글자, level 0,1 봇은 최대 12글자로 확장
					if (my.opts.noshort) {
						minLen = 9;
						if (level <= 1) {
							maxLen = Math.max(maxLen, 12);
						}
					}
					// no2 모드: 최소 3글자
					if (my.opts.no2) {
						minLen = Math.max(minLen, 3);
					}
					list = list.filter(function (w) {
						if (my.game.wordLength > 0 && w._id.length !== my.game.wordLength) return false;
						var wLen = w._id.length;
						if (Const.GAME_TYPE[my.mode] === 'KJM') {
							// KJM: ROBOT_LENGTH_LIMIT은 원 문자열 기준
							if (wLen > ROBOT_LENGTH_LIMIT[level]) return false;
							// nolong/noshort/no2는 자모 길이 기준 (submit 검증과 일치)
							if (my.opts.nolong || my.opts.noshort || my.opts.no2) {
								var _jl = Const.decomposeToJamo(w._id).length;
								if (my.opts.nolong && _jl >= 9) return false;
								if (my.opts.noshort && _jl <= 8) return false;
								if (my.opts.no2 && _jl <= 2) return false;
							}
						} else {
							if (wLen < minLen || wLen > maxLen) return false;
						}
						if (robot._done.has(w._id)) return false;
						// JS 위치 검증: getChar()로 실제 연결 글자를 구해서 preferredChar와 비교
						if (needJSCheck) {
							var linkChar = getChar.call(my, w._id);
							if (linkChar !== preferredChar) return false;
						}
						return true;
					});
				}

				if (list && list.length > 0) {
					// Shuffle the list to add randomness
					list = shuffle(list);
					robot.data._usingPreferredChar = true;
					pickList(list);
				} else {
					decideStrategy();
				}
			});
		});
	} else {
		decideStrategy();
	}

	function decideStrategy() {
		// Validate game state
		if (!my.game || !my.game.seq) {
			console.error(`[BOT] ERROR: Game state is invalid (game.seq is undefined). Aborting bot action.`);
			return;
		}

		// KKU 모드: 별도의 간단한 봇 로직 사용
		if (isKKU) {
			executeKKUBot();
			return;
		}

		// KJM 모드: 스탯 테이블 없음, ATTACK 전략 불가
		if (Const.GAME_TYPE[my.mode] === 'KJM') {
			executeStrategy("NORMAL");
			return;
		}

		var strategy = "NORMAL";
		var isKKT = (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK" || Const.GAME_TYPE[my.mode] == "KAK" || Const.GAME_TYPE[my.mode] == "EAK");
		var decided = false;

		// 첫 턴: 매너 체크와 같은 이유로 Attack 전략 금지
		if (my.game.roundChainCount < 1) {
			strategy = "NORMAL";
			decided = true;
		}

		// Force Retry Logic
		if (!decided && robot.data.retryCount > 0) {
			decided = true;
			strategy = "ATTACK";
		}

		// Mode Constraints
		var mannerMode = isMannerLike(my.opts); // 매너모드: 공격만 금지 (LONG은 허용)

		// 젠틀 모드: 공격만 금지 (LONG 전략은 매너/젠틀에 영향받지 않음)
		// mannerMode가 이미 isMannerLike(my.opts)로 설정되어 allowAttack에서 처리됨

		// Team Check: Disable attack if next player is teammate
		var currentTeam = robot.game.team || 0;

		if (currentTeam !== 0 || my.opts.randomturn) {
			var nextTurnIndex = (my.game.turn + 1) % my.game.seq.length;
			var nextPlayer = my.game.seq[nextTurnIndex];

			if (typeof nextPlayer === 'string') {
				nextPlayer = util.ctx.DIC[nextPlayer];
			}

			if (nextPlayer) {
				var nextTeam = nextPlayer.robot ? (nextPlayer.game.team || 0) : (nextPlayer.team || 0);

				if (nextTeam !== 0 && nextTeam === currentTeam) {
					strategy = "NORMAL";
					decided = true;
				} else {
				}
			} else {
			}
		} else {
		}

		// First/Random Rules: Disable Attack
		if (!decided && (my.opts.first || my.opts.random)) {
			strategy = "NORMAL"; // Always Normal
			decided = true;
			// Personality Override if Aggressive (>0 -> 0)
			if (personality > 0) personality = 0;
		}

		var effPersonality = personality;
		if (isKKT && effPersonality < 0) effPersonality = 0; // KKT: No Long Word personality

		// Priority 2: Personality Check
		if (!decided && effPersonality !== 0 && level >= 2) {
			var roll = Math.random();
			var prob = PERSONALITY_CONST[level] * Math.abs(effPersonality);
			if (roll < prob) {
				// 매너 모드에서는 공격만 금지
				var allowAttack = !mannerMode;

				if (effPersonality > 0 && allowAttack) strategy = "ATTACK";
				else if (effPersonality < 0 && !isKKT) strategy = "LONG";
				else strategy = "NORMAL"; // Fallback if Attack is blocked or conditions met

				if (strategy !== "NORMAL") decided = true;
			}
		}

		// Priority 3: Fallback (Special Move vs Normal)
		if (!decided && level >= 2) {
			var roll = Math.random();
			var prob = SPECIAL_MOVE_PROB[level];
			if (roll < prob) {
				// 매너 모드에서는 공격만 금지
				var allowAttack = !mannerMode;

				// KKU 모드: 스페셜 무브는 항상 LONG 전략
				if (isKKU) {
					strategy = "LONG";
				}
				// Special Move Triggered
				else if (isKKT && allowAttack) strategy = "ATTACK";
				else {
					// For non-KKT, pick randomly between ATTACK and LONG
					// Also check first turn for Attack
					if (Math.random() < 0.5 && allowAttack) strategy = "ATTACK";
					else strategy = "LONG";
				}
			} else {
				// Normal Strategy
				strategy = "NORMAL";
			}
		}

		// 빠른 모드: ATTACK/LONG 전략 금지
		if (robot.fastMode && (strategy === "ATTACK" || strategy === "LONG")) strategy = "NORMAL";

		executeStrategy(strategy);
	}

	function executeStrategy(strategy) {
		var isKKT = (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK");
		var limitMultiplier = 1;
		if (strategy === "ATTACK" || strategy === "LONG") limitMultiplier = 4; // Fetch 4x for advanced selection (2x Freq + 2x Random)

		var sort = (strategy === "LONG") ? {
			'length(_id)': -1
		} : null;

		getAuto.call(my, my.game.char, my.game.subChar, 2, limitMultiplier, sort).then(function (list) {
			if (list) {
				// Filter by length limit and done list
				// EKT 3-gram 모드: 최소 4글자 이상 필터 추가
				var minLen = 1;
				var maxLen = ROBOT_LENGTH_LIMIT[level];
				if (Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode) {
					minLen = 4;
				}
				// nolong 모드: 최대 8글자
				if (my.opts.nolong) {
					maxLen = Math.min(maxLen, 8);
				}
				// noshort 모드: 최소 9글자, level 0,1 봇은 최대 12글자로 확장
				if (my.opts.noshort) {
					minLen = Math.max(minLen, 9);
					if (level <= 1) {
						maxLen = Math.max(maxLen, 12);
					}
				}
				// no2 모드: 최소 3글자
				if (my.opts.no2) {
					minLen = Math.max(minLen, 3);
				}
				list = list.filter(function (w) {
					if (my.game.wordLength > 0 && w._id.length !== my.game.wordLength) return false;
					var wLen = w._id.length;
					if (Const.GAME_TYPE[my.mode] === 'KJM') {
						// KJM: ROBOT_LENGTH_LIMIT은 원 문자열 기준
						if (wLen > ROBOT_LENGTH_LIMIT[level]) return false;
						// nolong/noshort/no2는 자모 길이 기준 (submit 검증과 일치)
						if (my.opts.nolong || my.opts.noshort || my.opts.no2) {
							var _jl = Const.decomposeToJamo(w._id).length;
							if (my.opts.nolong && _jl >= 9) return false;
							if (my.opts.noshort && _jl <= 8) return false;
							if (my.opts.no2 && _jl <= 2) return false;
						}
					} else {
						if (wLen < minLen || wLen > maxLen) return false;
					}
					if (robot._done.has(w._id)) return false;
					if (my.opts.nododoli && isDodoli.call(my, w._id)) return false;
					if (my.opts.noswear && ctx.checkSwearWords && ctx.checkSwearWords(w._id).length > 0) return false;
					return true;
				});

				if (list.length === 0) {
					if (strategy !== "NORMAL") {
						executeStrategy("NORMAL");
					} else {
						denied();
					}
					return;
				}

				if (strategy === "LONG") {
					// 2x Frequency + 2x Random logic
					// Sort by Hit DESC first to identify "Frequency" pool
					// list.sort(function (a, b) { return b.hit - a.hit; }); 
					// User requested: Use DB sort. So 'list' is already sorted by Length DESC.

					// Just pick top ones.
					var top = list.slice(0, 30);
					pickList(shuffle(top)); // Pick randomly from top 30
				} else if (strategy === "ATTACK") {
					// Optimized Attack Strategy: Tiered Reverse Search
					// Tier 1: Priority + One-shots (Count 0)
					// Tier 2: Soft Killers (Count 1-3)

					getAttackChars(my).then(function (tiers) {
						var tier1 = tiers.tier1 || [];
						var tier2 = tiers.tier2 || [];

						// Level-based Constraints
						var heuristicRatio = 1.0;
						var tier2StartProb = 0.0;

						if (level <= 2) {
							heuristicRatio = 0.25;
							tier2StartProb = 0.5;
						} else if (level === 3) {
							heuristicRatio = 0.5;
							tier2StartProb = 0.25;
						}

						// Shuffle Tiers but keeping Priority Chars at the front
						// This ensures that when we slice (e.g. top 150), the Priority chars are included.
						function postShuffle(list) {
							var pList = [];
							var mList = [];
							if (my.rule.lang === 'ko') {
								pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
								mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;
							} else {
								if (isRev) {
									pList = PRIORITY_KAP_ATTACK_CHARS_EN;
								} else {
									pList = PRIORITY_ATTACK_CHARS_EN;
									mList = PRIORITY_ATTACK_CHARS_MANNER_EN;
								}
							}

							var pSlice = pList ? pList.slice(0, Math.ceil(pList.length * heuristicRatio)) : [];
							var mSlice = mList ? mList.slice(0, Math.ceil(mList.length * heuristicRatio)) : [];
							var allP = new Set(pSlice.concat(mSlice));

							var p = [],
								n = [];
							list.forEach(c => {
								if (allP.has(c)) p.push(c);
								else n.push(c);
							});
							// Shuffle both parts separately, but put Priority part first
							return shuffle(p).concat(shuffle(n));
						}

						tier1 = postShuffle(tier1);
						tier2 = postShuffle(tier2);

						// Helper to perform attack search (Optimized: Shuffle -> Slice -> Single Query)
						// Initialize Priority Set for Smart Shuffle
						var prioritySet = new Set();
						(function initPrioritySet() {
							var pList = [];
							var mList = [];

							if (my.rule.lang === 'ko') {
								pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
								mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;
							} else {
								if (isRev) {
									pList = PRIORITY_KAP_ATTACK_CHARS_EN;
								} else {
									pList = PRIORITY_ATTACK_CHARS_EN;
									mList = PRIORITY_ATTACK_CHARS_MANNER_EN;
								}
							}

							var pSlice = pList ? pList.slice(0, Math.ceil(pList.length * heuristicRatio)) : [];
							var mSlice = mList ? mList.slice(0, Math.ceil(mList.length * heuristicRatio)) : [];
							pSlice.forEach(c => prioritySet.add(c));
							mSlice.forEach(c => prioritySet.add(c));
						})();

						function tryAttack(killers, nextStepCallback) {
							if (my.rule.lang === "ko") tryAttackKO(killers, nextStepCallback);
							else tryAttackEN(killers, nextStepCallback);
						}

						function processList(list, nextStepCallback) {
							if (list && list.length) {
								list = list.filter(function (w) {
									// EKT 3-gram 모드: 최소 4글자 이상 필터
									var minLen = (Const.GAME_TYPE[my.mode] === 'EKT' && my.game.ektTrigramMode) ? 4 : 1;
									var maxLen = ROBOT_LENGTH_LIMIT[level];

									// nolong 모드: 최대 8글자
									if (my.opts.nolong) {
										maxLen = Math.min(maxLen, 8);
									}
									// noshort 모드: 최소 9글자, level 0,1 봇은 최대 12글자로 확장
									if (my.opts.noshort) {
										minLen = Math.max(minLen, 9);
										if (level <= 1) {
											maxLen = Math.max(maxLen, 12);
										}
									}
									// no2 모드: 최소 3글자
									if (my.opts.no2) {
										minLen = Math.max(minLen, 3);
									}
									if (my.game.wordLength > 0 && w._id.length !== my.game.wordLength) return false;
									if (w._id.length < minLen || w._id.length > maxLen) return false;
									if (robot._done.has(w._id)) return false;
									if (my.opts.nododoli && isDodoli.call(my, w._id)) return false;
									if (my.opts.noswear && ctx.checkSwearWords && ctx.checkSwearWords(w._id).length > 0) return false;
									return true;
								});

								if (list.length > 0) {

									if (Const.GAME_TYPE[my.mode] === "KSH" && my.game.seq && my.game.seq.length === 2) {
										var safe = list.filter(w => !DUBANG.includes(w._id.slice(-1)));
										var unsafe = list.filter(w => DUBANG.includes(w._id.slice(-1)));

										if (safe.length > 0) {
											list = smartShuffle(safe).concat(smartShuffle(unsafe));
										} else {
											list = smartShuffle(unsafe);
										}
									} else if (Const.GAME_TYPE[my.mode] === "KSH" && my.opts.freedueum) {
										var safe = list.filter(w => !AVOID_FD.includes(w._id.slice(-1)));
										var unsafe = list.filter(w => AVOID_FD.includes(w._id.slice(-1)));

										if (safe.length > 0) {
											list = smartShuffle(safe).concat(smartShuffle(unsafe));
										} else {
											list = smartShuffle(unsafe);
										}
									} else if (Const.GAME_TYPE[my.mode] === "KAP" && my.game.seq && my.game.seq.length === 2) {
										var safe = list.filter(w => !DUBANG_KAP.includes(w._id.charAt(0)));
										var unsafe = list.filter(w => DUBANG_KAP.includes(w._id.charAt(0)));

										if (safe.length > 0) {
											list = smartShuffle(safe).concat(smartShuffle(unsafe));
										} else {
											list = smartShuffle(unsafe);
										}
									} else {
										list = smartShuffle(list);
									}

									if (list.length > 0) pickList(list);
									else nextStepCallback();
								} else {
									nextStepCallback();
								}
							} else {
								nextStepCallback();
							}
						}

						function smartShuffle(list) {
							// Determine "Killer Char" for each word and check against prioritySet
							// Logic matches tryAttackKO: Standard/KKT/KSH checks last char. KAP checks first char.
							// Middle/Second logic is complex, so we skip prioritization for them (fallback to random).
							if (my.opts.middle || my.opts.second) return shuffle(list);
							if (prioritySet.size === 0) return shuffle(list);

							var p = [], n = [];
							list.forEach(function (w) {
								var char = "";
								if (isRev) char = w._id.charAt(0);
								else char = w._id.slice(-1);

								if (prioritySet.has(char)) p.push(w);
								else n.push(w);
							});

							return shuffle(p).concat(shuffle(n));
						}

						function tryAttackKO(killers, nextStepCallback) {
							if (!killers || killers.length === 0) return nextStepCallback();

							// Optimization: For Middle/Second rules, use ONLY Heuristics
							if (my.opts.middle || my.opts.second) {
								var heuristicSet = new Set();
								var pList = isRev ? PRIORITY_KAP_ATTACK_CHARS : PRIORITY_ATTACK_CHARS;
								var mList = isRev ? PRIORITY_KAP_ATTACK_CHARS_MANNER : PRIORITY_ATTACK_CHARS_MANNER;

								var pSlice = pList ? pList.slice(0, Math.ceil(pList.length * heuristicRatio)) : [];
								var mSlice = mList ? mList.slice(0, Math.ceil(mList.length * heuristicRatio)) : [];

								pSlice.forEach(c => heuristicSet.add(c));
								mSlice.forEach(c => heuristicSet.add(c));

								if (heuristicSet.size > 0) {
									killers = killers.filter(k => heuristicSet.has(k));
								}
								// 숫자도 공격 대상에 추가 (세컨드/미들에서 숫자가 오면 이을 글자가 거의 없음)
								["0","1","2","3","4","5","6","7","8","9"].forEach(function(n) {
									if (killers.indexOf(n) === -1) killers.push(n);
								});
							}

							// 자유 두음법칙 + KSH: AVOID_FD 글자 제외
							if ((Const.GAME_TYPE[my.mode] === "KSH" || Const.GAME_TYPE[my.mode] === "KKT") && my.opts.freedueum) {
								killers = killers.filter(k => !AVOID_FD.includes(k));
								if (killers.length === 0) return nextStepCallback();
							}

							// 모음 반전: AVOID_VI 글자 제외
							if (my.opts.vowelinv) {
								killers = killers.filter(k => !AVOID_VI.includes(k));
								if (killers.length === 0) return nextStepCallback();
							}

							var subsetSize = Math.max(10, Math.floor(150 * heuristicRatio));
							var subset = killers.slice(0, subsetSize);
							if (subset.length === 0) return nextStepCallback();

							var killerString = subset.join("").replace(/[\[\]\^\-\\]/g, "\\$&");
							var adc = escapeRegExp(my.game.char) + (my.game.subChar ? ("|" + my.game.subChar.split("|").map(escapeRegExp).join("|")) : "");
							var regex;

							if (my.opts.middle || my.opts.second) {
								var patterns = [];
								var minLen = 2; // Min word length
								var maxLen = ROBOT_LENGTH_LIMIT[level];

								// Fixed Word Length (KKT/Sami)
								if (my.game.wordLength > 0) {
									minLen = my.game.wordLength;
									maxLen = my.game.wordLength;
								} else {
									// Optimization: Cap Length at 20 for Complex Rules (Middle/Second)
									// Generating 50+ patterns kills performance. 20 is enough for attacks.
									if (maxLen > 20) maxLen = 20;
								}

								for (var len = minLen; len <= maxLen; len++) {
									var idx = -1;
									// Logic must match getChar shared block
									if (my.opts.middle && my.opts.second) {
										if (len % 2 !== 0) idx = Math.floor(len / 2);
										else idx = isRev ? (len / 2) : (len / 2 - 1);
									} else if (my.opts.middle) {
										if (len % 2 !== 0) idx = Math.floor(len / 2);
										else idx = isRev ? (len / 2 - 1) : (len / 2);
									} else { // Second only
										idx = isRev ? 1 : (len - 2);
									}

									if (idx >= 0 && idx < len) {
										// Pattern: .{idx}(killerString).{rest}
										var pre = idx;
										var post = len - 1 - idx;
										patterns.push(`.{${pre}}[${killerString}].{${post}}`);
									}
								}

								if (patterns.length > 0) {
									if (isRev) {
										// Ends with adc: (?=.*adc$)...
										regex = `^(?=.*(${adc})$)(${patterns.join('|')})$`;
									} else {
										// Starts with adc: (?=adc)...
										regex = `^(?=(${adc}))(${patterns.join('|')})$`;
									}
								} else {
									// Fallback
									if (isRev) regex = `^[${killerString}].*(${adc})$`;
									else regex = `^(${adc}).*[${killerString}]$`;
								}
							} else {
								var middlePattern = ".*";
								if (my.game.wordLength) {
									var midLen = Math.max(0, my.game.wordLength - 2);
									middlePattern = `.{${midLen}}`;
								}

								if (isRev) {
									regex = `^[${killerString}]${middlePattern}(${adc})$`;
								} else {
									regex = `^(${adc})${middlePattern}[${killerString}]$`;
								}
							}


							var query = [
								['_id', new RegExp(regex)]
							];
							var flagMask = ((my.game.history && my.game.history.length > 0) ? Const.KOR_FLAG.DELETED : 0);

							if (!my.opts.injeong) flagMask |= Const.KOR_FLAG.INJEONG;
							if (my.opts.loanword) flagMask |= Const.KOR_FLAG.LOANWORD;

							if (my.opts.allpos) {
								// allpos: 품사 필터 없음
							} else if (my.opts.strict) {
								flagMask |= (Const.KOR_FLAG.SPACED | Const.KOR_FLAG.SATURI | Const.KOR_FLAG.OLD | Const.KOR_FLAG.MUNHWA);
								query.push(['type', Const.KOR_STRICT]);
							} else {
								query.push(['type', Const.KOR_GROUP]);
							}

							if (flagMask > 0) query.push(['flag', {
								'$nand': flagMask
							}]);

							util.ctx.DB.kkutu['ko'].find(...query).limit(200).on(function (list) {
								processList(list, nextStepCallback);
							});
						}

						function tryAttackEN(killers, nextStepCallback) {
							if (!killers || killers.length === 0) return nextStepCallback();

							// Optimization: For Middle/Second rules, use ONLY Heuristics (Top 25)
							if (my.opts.middle || my.opts.second) {
								var heuristicSet = new Set();
								var hList = [];
								if (typeof PRIORITY_ATTACK_CHARS_EN !== 'undefined') hList = hList.concat(PRIORITY_ATTACK_CHARS_EN);
								if (typeof PRIORITY_ATTACK_CHARS_MANNER_EN !== 'undefined') hList = hList.concat(PRIORITY_ATTACK_CHARS_MANNER_EN);

								// Limit by Heuristic Ratio and Max 25
								var limitLen = Math.ceil(hList.length * heuristicRatio);
								if (limitLen > 25) limitLen = 25;
								hList = hList.slice(0, limitLen);

								hList.forEach(c => heuristicSet.add(c));

								// Strict Filter: If heuristics exist, use ONLY them.
								if (heuristicSet.size > 0) {
									killers = killers.filter(k => heuristicSet.has(k));
								} else {
									killers = [];
								}
							}

							if (killers.length === 0) return nextStepCallback();

							var subsetSize = Math.max(10, Math.floor(150 * heuristicRatio));
							var subset = killers.slice(0, subsetSize);
							if (subset.length === 0) return nextStepCallback();

							var adc = escapeRegExp(my.game.char) + (my.game.subChar ? ("|" + my.game.subChar.split("|").map(escapeRegExp).join("|")) : "");
							var killerPattern = subset.join("|");

							var regex;
							if (my.opts.middle || my.opts.second) {
								var patterns = [];
								var minLen = 2;
								var maxLen = ROBOT_LENGTH_LIMIT[level];

								// Fixed Word Length (EKK/Sami)
								if (my.game.wordLength > 0) {
									minLen = my.game.wordLength;
									maxLen = my.game.wordLength;
								} else {
									// Optimization: Cap to 20
									if (maxLen > 20) maxLen = 20;
								}
								var isEKT = Const.GAME_TYPE[my.mode] === "EKT";

								for (var len = minLen; len <= maxLen; len++) {
									var idx = -1;
									var rStart = -1;
									var linkLen = isEKT ? 3 : 1;

									if (isEKT) {
										// EKT Specific Logic (from getChar)
										if (my.opts.middle) {
											if (len % 2 !== 0) {
												idx = Math.floor(len / 2);
												rStart = idx - 1;
											} else {
												idx = len / 2;
												rStart = idx - 1;
											}
										} else if (my.opts.second) {
											// EKT Second:
											// if len >= 4: Link = text.slice(len - 4, len - 1) -> Start len-4, Len 3
											// if len === 3: Link = text -> Start 0, Len 3
											if (len >= 4) rStart = len - 4;
											else if (len === 3) rStart = 0;
										}
									} else {
										// EKK / General Logic (from getChar)
										// English EKK usually uses same logic as Korean (1 char link)
										if (my.opts.middle && my.opts.second) {
											if (len % 2 !== 0) idx = Math.floor(len / 2);
											else idx = len / 2 - 1;
										} else if (my.opts.middle) {
											if (len % 2 !== 0) idx = Math.floor(len / 2);
											else idx = len / 2; // Even: Latter
										} else { // Second only
											idx = len - 2;
										}
										rStart = idx;
									}

									if (rStart >= 0 && rStart + linkLen <= len) {
										var pre = rStart;
										var post = len - (rStart + linkLen);
										patterns.push(`.{${pre}}(${killerPattern}).{${post}}`);
									}
								}

								if (patterns.length > 0) {
									regex = `^(?=(${adc}))(${patterns.join('|')})$`;
								} else {
									regex = `^(${adc}).*(${killerPattern})$`;
								}
							} else {
								// End-to-End Attack (Normal)
								var middlePattern = ".*";
								var lenCheck = ""; // Lookahead length check

								// Fixed Word Length (EKK/Sami/KKT)
								if (my.game.wordLength > 0) {
									// Use Lookahead to strictly enforce length
									lenCheck = `(?=.{${my.game.wordLength}}$)`;
									middlePattern = ".*";
								} else if (Const.GAME_TYPE[my.mode] === "EKT") {

								}

								if (isRev) {
									regex = `^${lenCheck}(${killerPattern})${middlePattern}(${adc})$`;
								} else {
									regex = `^${lenCheck}(${adc})${middlePattern}(${killerPattern})$`;
								}
							}


							var query = [
								['_id', new RegExp(regex)]
							];
							query.push(['_id', Const.ENG_ID]);

							util.ctx.DB.kkutu['en'].find(...query).limit(200).on(function (list) {
								processList(list, nextStepCallback);
							});
						}

						// Execution Flow: Tier 1 -> Tier 2 -> Normal
						// Logic:
						// If First Turn (Chain 0): SKIP Tier 1. Go to Tier 2.
						// If Normal Turn: Start Tier 1.

						var startTier1 = true;
						if (!my.game.chain || my.game.chain.length === 0 || isMannerLike(my.opts)) {
							startTier1 = false;
						} else if (Math.random() < tier2StartProb) {
							startTier1 = false;
						}

						// Retry Tier 2 Logic Consumption
						if (robot.data.retryCount > 0) {
							startTier1 = false;
							// Do NOT delete retryCount here, as we need it for subsequent retries if this one fails too.
							// It will be cleared in turnStart or when turn ends successfully.
						}

						if (startTier1) {
							tryAttack(tier1, function () {
								tryAttack(tier2, function () {
									executeStrategy("NORMAL");
								});
							});
						} else {
							// Skip Tier 1, Start at Tier 2
							tryAttack(tier2, function () {
								executeStrategy("NORMAL");
							});
						}
					});




				} else {
					// NORMAL strategy
					list.sort(function (a, b) {
						return b.hit - a.hit;
					});
					var top = list.slice(0, ROBOT_CANDIDATE_LIMIT[level]);
					var rest = list.slice(ROBOT_CANDIDATE_LIMIT[level]);
					list = shuffle(top).concat(rest);

					// Team-based Manner Check: Apply manner filter for teammates
					var isNextTeammate = false;
					var currentTeam = robot.game.team || 0;
					if (currentTeam !== 0) {
						var nextTurnIndex = (my.game.turn + 1) % my.game.seq.length;
						var nextPlayer = my.game.seq[nextTurnIndex];
						if (typeof nextPlayer === 'string') {
							nextPlayer = util.ctx.DIC[nextPlayer];
						}
						if (nextPlayer) {
							var nextTeam = nextPlayer.robot ? (nextPlayer.game.team || 0) : (nextPlayer.team || 0);
							if (nextTeam !== 0 && nextTeam === currentTeam) {
								isNextTeammate = true;
							}
						}
					}

					var isEKT = Const.GAME_TYPE[my.mode] === 'EKT';
					var needsMannerFilter = isMannerLike(my.opts) || isNextTeammate;
					var useEKTManner = needsMannerFilter && isEKT && my.game.ektTrigramMode;
					var useGeneralManner = needsMannerFilter && !useEKTManner;

					if (useEKTManner) {
						filterEKTManner(list).then(function (filtered) {
							if (filtered.length > 0) {
								pickList(filtered);
							} else {
								denied();
							}
						});
					} else if (useGeneralManner) {
						filterManner(list).then(function (filtered) {
							if (filtered.length > 0) {
								pickList(filtered);
							} else {
								denied();
							}
						});
					} else {
						pickList(list);
					}
				}
			} else {
				denied();
			}
		});
	}

	// General Manner Filter: Check if next word exists (connectivity check)
	function filterManner(list) {
		return new Promise(function (resolve) {
			if (!list || list.length === 0) return resolve([]);

			// For KKU mode, we use a simple check (already handled in executeKKUBot, but adding here just in case)
			// For standard modes (KKT, KSH, etc.), we use the stats table.
			// 에티켓: 항상 injeong OFF 강제
			var state = getMannerState(my.opts);
			// Note: freedueum bit (8) is not in standard stats tables 0-7, usually handled by query or separate check.
			// Start/End stats cols usually cover standard rules.

			var isKo = my.rule.lang === 'ko';
			var lang = isKo ? 'ko' : 'en';
			var isRev = !!my.rule._back;

			var col;
			if (isKo) {
				var nextLen = getNextTurnLength.call(my);
				var lenSuffix = (nextLen === 2) ? "2" : (nextLen === 3) ? "3" : (nextLen === 4) ? "4" : "all";
				col = isRev ? `end${lenSuffix}_${state}` : `start${lenSuffix}_${state}`;
			} else {
				col = `count_${state}`;
			}

			var results = [];
			var checkList = list.slice(0, 50);
			var restList = list.slice(50);
			if (checkList.length === 0) return resolve([]);

			checkList.forEach(function (w) {
				var linkChar = getChar.call(my, w._id);
				var subChar = getSubChar.call(my, linkChar);
				var charsToCheck = [linkChar];
				if (subChar) {
					subChar.split('|').forEach(function (sc) {
						if (sc && !charsToCheck.includes(sc)) charsToCheck.push(sc);
					});
				}

				var valid = false;
				charsToCheck.forEach(function (c) {
					var doc = getStatsDoc(lang, c);
					if (doc && doc[col] > 0) valid = true;
				});
				if (valid) results.push(w);
			});
			resolve(results.concat(restList));
		});
	}

	function denied() {
		if (robot._rageQuitting) return;
		// Prepare Defeat Message (분노 6 이상이면 ANGRY 메시지)
		var secondMsg;
		if (robot.anger >= 6) {
			secondMsg = Const.ROBOT_ANGRY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_ANGRY_MESSAGES.length)];
		} else {
			secondMsg = Const.ROBOT_DEFEAT_MESSAGES[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES.length)];
		}

		// If round is late (ended), only send Defeat Message and exit.
		// Do not send Char Message (spam) or queue any moves (after).
		if (my.game.late) {
			if (!robot.muteGame) {
				setTimeout(function () {
					robot.chat(secondMsg);
				}, 500);
			}
			return;
		}

		var char = my.game.char;
		var charMsgs = [
			`${char}${char}${char}`,
			`${char}..`,
			`${char}??`,
			`${char}... T.T`
		];

		if (isRev) {
			charMsgs = [
				`${char}${char}${char}`,
				`..${char}`,
				`??${char}`,
				`T.T ...${char}`
			];
		}

		var firstMsg = charMsgs[Math.floor(Math.random() * charMsgs.length)];

		text = firstMsg;
		after();

		if (!robot.muteGame) {
			delay += 200;

			text = secondMsg;
			after();
		}
	}

	function pickList(list) {
		if (my.game.late) return; // Prevent move after round end
		if (list && list.length > 0) {
			robot.data.candidates = list;
			robot.data.candidateIndex = 0;
			// Pick from the top of the list (since it's already sorted by Strategy)
			// For Attack: Sorted by NextCount ASC.
			// For Long: Sorted by Length DESC.
			// For Normal: Frequency/Random mix.

			var candidate = list[0];

			if (candidate) {
				w = candidate;
				text = w._id;
				delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
				after();
			} else denied();
		} else denied();
	}

	function after() {
		if (my.game.late) return; // Prevent scheduling after round end
		delay += text.length * ROBOT_TYPE_COEF[level];
		robot._done.add(text);
		my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, text);
	}

	function getWishList(list) {
		var R = new Lizard.Tail();
		var wz = [];
		var res;

		for (i in list) wz.push(getWish(list[i]));
		Lizard.all(wz).then(function ($res) {
			if (!my.game.chain) return;
			$res.sort(function (a, b) {
				return a.length - b.length;
			});

			if (isMannerLike(my.opts) || !my.game.chain.length) {
				while (res = $res.shift())
					if (res.length) break;
			} else res = $res.shift();
			R.go(res ? res.char : null);
		});
		return R;
	}

	function getWish(char) {
		var R = new Lizard.Tail();

		util.ctx.DB.kkutu[my.rule.lang].find(['_id', new RegExp(isRev ? `.${escapeRegExp(char)}$` : `^${escapeRegExp(char)}.`)]).limit(10).on(function ($res) {
			R.go({
				char: char,
				length: $res.length
			});
		});
		return R;
	}
};