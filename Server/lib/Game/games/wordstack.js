/**
 * Rule the words! KKuTu Online
 * WordStack (워드스택) mode - server logic
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

var CHAR_POOL_KO = [
	'가','나','다','라','마','바','사','아','자','차','카','타','파','하',
	'거','너','더','러','머','버','서','어','저','처','커','터','퍼','허',
	'게','네','데','레','메','베','세','에','제','체','케','테','페','헤',
	'고','노','도','로','모','보','소','오','조','초','코','토','포','호',
	'구','누','두','루','무','부','수','우','주','추','쿠','투','푸','후',
	'기','니','디','리','미','비','시','이','지','치','키','티','피','히'
];
var CHAR_POOL_EN = 'abcdefghijklmnopqrstuvwxyz'.split('');

var INIT_STACK_SIZE    = 5;
var OVERFLOW_THRESHOLD = 8;
var AUTO_ATK_START     = 5000;
var AUTO_ATK_END       = 3000;
var ATK_QUEUE_INTERVAL = 200;
var SCAN_INTERVAL      = 1000;
var ROBOT_MIN_DELAY    = 500;
var OVERFLOW_X_START   = 3;
var OVERFLOW_X_END     = 12;
var ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];

// 두음법칙 상수 (chainbattle.js 동일)
var RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
var RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
var NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];

function traverse(my, func) {
	var i, o, item;
	for (i in my.game.seq) {
		item = my.game.seq[i];
		if (typeof item === 'string') {
			if (!(o = DIC[item])) continue;
		} else {
			o = item;
		}
		if (!o.game) continue;
		func(o);
	}
}

function stopTimers(my) {
	clearInterval(my.game.scanTimer);
	clearTimeout(my.game.autoAtkTimer);
	clearTimeout(my.game._rrt);
	clearTimeout(my.game._turnEndTimer);
	clearTimeout(my.game._tsTimer);
	my.game.scanTimer = null;
	my.game.autoAtkTimer = null;
	my.game._turnEndTimer = null;
	my.game._tsTimer = null;
	traverse(my, function(o) {
		if (!o.game) return;
		clearTimeout(o.game.botTimer);
		clearTimeout(o.game.atkTimer);
		o.game.botTimer = null;
		o.game.atkTimer = null;
	});
}

function pickChars(pool, n) {
	var arr = pool.slice();
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
	}
	return arr.slice(0, n);
}

function getSubChar(my, char) {
	if (my.rule.lang !== 'ko') return null;
	var c = char.charCodeAt(0);
	var k = c - 0xAC00;
	if (k < 0 || k > 11171) return null;

	var ca = [Math.floor(k / 28 / 21), Math.floor(k / 28) % 21, k % 28];
	var cb = [ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7];
	var cc = false;

	if (cb[0] === 4357) {
		cc = true;
		if (RIEUL_TO_NIEUN.indexOf(cb[1]) !== -1) {
			cb[0] = 4354;
		} else if (RIEUL_TO_IEUNG.indexOf(cb[1]) !== -1) {
			cb[0] = 4363;
		} else {
			cc = false;
		}
	} else if (cb[0] === 4354) {
		if (NIEUN_TO_IEUNG.indexOf(cb[1]) !== -1) {
			cb[0] = 4363;
			cc = true;
		}
	}

	if (!cc) return null;
	cb[0] -= 0x1100; cb[1] -= 0x1161; cb[2] -= 0x11A7;
	return String.fromCharCode(((cb[0] * 21) + cb[1]) * 28 + cb[2] + 0xAC00);
}

// 스택에서 text의 첫 글자 (또는 두음법칙 대안)와 일치하는 첫 번째 인덱스 반환
function findMatchInStack(my, stack, text) {
	var isKo = my.rule.lang === 'ko';
	var first = isKo ? text.charAt(0) : text.charAt(0).toLowerCase();
	for (var i = 0; i < stack.length; i++) {
		if (stack[i] === first) return i;
		if (isKo) {
			var sub = getSubChar(my, stack[i]);
			if (sub && sub === first) return i;
		}
	}
	return -1;
}

// 단어 길이에 따른 공격 글자 수 계산
function calcAttacks(wordLen, aliveCount, isEn) {
	var len = isEn ? Math.ceil(wordLen / 2) : wordLen;
	if (aliveCount <= 2) {
		return len >= 7 ? 2 : (len >= 3 ? 1 : 0);
	}
	if (aliveCount === 3) {
		return len >= 7 ? 3 : (len >= 5 ? 2 : (len >= 3 ? 1 : 0));
	}
	return len >= 10 ? 4 : (len >= 7 ? 3 : (len >= 5 ? 2 : (len >= 3 ? 1 : 0)));
}

function selectTarget(my, attacker) {
	var targets = [];
	traverse(my, function(o) {
		if (o.id === attacker.id) return;
		if (!o.game.alive) return;
		targets.push(o);
	});
	if (targets.length === 0) return null;

	var strategy = attacker.game.attackStrategy || 0;
	var chosen;

	if (strategy === 0) {
		var minSent = Infinity;
		targets.forEach(function(o) {
			var s = attacker.game.attacksSent[o.id] || 0;
			if (s < minSent) minSent = s;
		});
		var pool0 = targets.filter(function(o) {
			return (attacker.game.attacksSent[o.id] || 0) === minSent;
		});
		chosen = pool0[Math.floor(Math.random() * pool0.length)];
	} else if (strategy === 1) {
		var minHP = Infinity;
		targets.forEach(function(o) { if (o.game.score < minHP) minHP = o.game.score; });
		var pool1 = targets.filter(function(o) { return o.game.score === minHP; });
		chosen = pool1[Math.floor(Math.random() * pool1.length)];
	} else {
		if (attacker.game.lastAttacker) {
			var la = DIC[attacker.game.lastAttacker];
			if (!la) {
				traverse(my, function(o) {
					if (o.robot && o.id === attacker.game.lastAttacker) la = o;
				});
			}
			if (la && la.game && la.game.alive) return attacker.game.lastAttacker;
		}
		chosen = targets[Math.floor(Math.random() * targets.length)];
	}
	return chosen ? chosen.id : null;
}

function calcAutoAtkInterval(elapsed, roundTime) {
	var t = Math.min(1, elapsed / roundTime);
	return Math.round(AUTO_ATK_START + (AUTO_ATK_END - AUTO_ATK_START) * t);
}

function calcOverflowX(elapsed, roundTime) {
	var t = Math.min(1, elapsed / roundTime);
	return OVERFLOW_X_START * Math.pow(OVERFLOW_X_END / OVERFLOW_X_START, t);
}

// 공격 큐에서 글자 하나를 스택으로 이동시키고 다음 처리를 예약
function processAtkQueue(my, player, gen) {
	if (my.game.gen !== gen || my.game.late || !player.game || !player.game.alive) return;
	if (player.game.attackQueue.length === 0) {
		player.game.atkTimer = null;
		return;
	}

	var c = player.game.attackQueue.shift();
	player.game.stack.push(c);

	var client = player.robot ? null : DIC[player.id];
	if (client) {
		var sub = my.rule.lang === 'ko' ? getSubChar(my, c) : null;
		client.send('wordstackAtk', { char: c, subChar: sub, stackLen: player.game.stack.length });
	}

	if (player.game.attackQueue.length > 0) {
		player.game.atkTimer = setTimeout(function() {
			processAtkQueue(my, player, gen);
		}, ATK_QUEUE_INTERVAL);
	} else {
		player.game.atkTimer = null;
	}
}

function enqueueChar(my, target, char) {
	if (!target.game || !target.game.alive) return;
	target.game.attackQueue.push(char);
	if (!target.game.atkTimer) {
		var gen = my.game.gen;
		target.game.atkTimer = setTimeout(function() {
			processAtkQueue(my, target, gen);
		}, ATK_QUEUE_INTERVAL);
	}
}

function scheduleAutoAttack(my) {
	if (my.game.late) return;
	var elapsed = Date.now() - my.game.roundStartTime;
	var interval = calcAutoAtkInterval(elapsed, my.game.roundTime);
	my.game.autoAtkTimer = setTimeout(function() {
		if (my.game.late) return;
		var pool = my.rule.lang === 'ko' ? CHAR_POOL_KO : CHAR_POOL_EN;
		traverse(my, function(o) {
			if (!o.game.alive) return;
			var c = pool[Math.floor(Math.random() * pool.length)];
			enqueueChar(my, o, c);
		});
		scheduleAutoAttack(my);
	}, interval);
}

function scanHP(my) {
	if (my.game.late) return;
	var elapsed = Date.now() - my.game.roundStartTime;
	var x = calcOverflowX(elapsed, my.game.roundTime);

	traverse(my, function(o) {
		if (my.game.late) return;
		if (!o.game.alive) return;
		var overflow = o.game.stack.length - OVERFLOW_THRESHOLD;
		if (overflow <= 0) return;

		var dmg = Math.round(overflow * x);
		o.game.score -= dmg;
		var ko = o.game.score <= 0;
		if (ko) { o.game.score = 0; o.game.alive = false; }

		my.byMaster('turnEnd', {
			ok: false,
			overflow: true,
			target: o.id,
			damage: dmg,
			hp: o.game.score,
			ko: ko
		}, true);

		if (ko) {
			traverse(my, function(s) {
				if (s.game && s.game.attacksSent && s.id !== o.id) delete s.game.attacksSent[o.id];
			});
			var pool = my.rule.lang === 'ko' ? CHAR_POOL_KO : CHAR_POOL_EN;
			traverse(my, function(s) {
				if (!s.game.alive) return;
				enqueueChar(my, s, pool[Math.floor(Math.random() * pool.length)]);
			});
			checkGameOver(my);
		}
	});
}

function checkGameOver(my) {
	var aliveCount = 0;
	traverse(my, function(o) { if (o.game.alive) aliveCount++; });
	if (aliveCount <= 1) {
		my.game.late = true;
		stopTimers(my);
		var scores = {};
		traverse(my, function(o) { scores[o.id] = o.game.score; });
		my.byMaster('turnEnd', { ok: false, timeUp: true, scores: scores }, true);
		my.game._rrt = setTimeout(function() { my.roundEnd(); }, 2000);
	}
}

// 끝 글자가 한방 단어인지 확인 (한국어 전용, true=OK false=한방)
function checkManner(my, endChar, endSubChar) {
	var state = 0;
	if (!my.opts.injeong) state |= 1;
	if (my.opts.strict)   state |= 2;
	if (my.opts.loanword) state |= 4;
	var col = 'startall_' + state;
	var total = 0;
	var chars = [endChar];
	if (endSubChar) chars.push(endSubChar);
	chars.forEach(function(c) {
		var doc = (DB.statsData && DB.statsData.ko && DB.statsData.ko[c]) || null;
		if (doc && doc[col]) total += doc[col];
	});
	return total > 0;
}

function getAutoWords(my, char, subChar, callback) {
	var isKo = my.rule.lang === 'ko';
	if (isKo) {
		var chars = [char];
		if (subChar) chars.push(subChar);
		var regexStr = '^(' + chars.map(function(c) {
			return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}).join('|') + ')';
		var conditions = [
			['_id', new RegExp(regexStr)],
			['type', Const.KOR_GROUP]
		];
		if (!my.opts.injeong) conditions.push(['flag', { '$not': Const.KOR_FLAG.INJEONG }]);
		if (my.opts.strict)   conditions.push(['flag', { '$lt': 4 }]);
		DB.kkutu['ko'].find.apply(DB.kkutu['ko'], conditions)
			.limit(['_id', true], ['flag', true], ['type', true])
			.limit(50)
			.on(function(docs) { callback(docs || []); });
	} else {
		DB.kkutu['en'].find(
			['_id', new RegExp('^' + char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))],
			['_id', Const.ENG_ID]
		).limit(['_id', true]).limit(50)
		 .on(function(docs) { callback(docs || []); });
	}
}

exports.init = function(_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function() {
	var R = new Lizard.Tail();
	this.game.round = 0;
	R.go("①");
	return R;
};

exports.roundReady = function() {
	var my = this;

	stopTimers(my);
	clearTimeout(my.game._rrt);
	my.game.gen = (my.game.gen || 0) + 1;
	my.game.round++;

	if (my.game.round > my.round) {
		my.roundEnd();
		return;
	}

	var isEn = my.rule.lang === 'en';
	var pool = isEn ? CHAR_POOL_EN : CHAR_POOL_KO;
	var surHP = Math.max(50, Math.min(1000, parseInt(my.opts.surHP) || 200));
	var initChars = pickChars(pool, INIT_STACK_SIZE);

	my.game.roundTime = my.time * 1000;
	my.game.initChars = initChars;

	traverse(my, function(o) {
		o.game.score          = surHP;
		o.game.alive          = true;
		o.game.stack          = initChars.slice();
		o.game.attackQueue    = [];
		o.game.atkTimer       = null;
		o.game.usedWords      = {};
		o.game.pendingWords   = {};
		o.game.attacksSent    = {};
		o.game.lastAttacker   = null;
		o.game.botRetryCount  = 0;
		var p = (o.robot && o.data) ? (o.data.personality || 0) : 0;
		o.game.attackStrategy = (p >= 0.6) ? 1 : (p <= -0.6) ? 2 : 0;
	});

	var subChars = isEn ? [] : initChars.map(function(c) { return getSubChar(my, c); });
	my.byMaster('roundReady', { round: my.game.round, surHP: surHP, chars: initChars, subChars: subChars }, true);
	my.game._tsTimer = setTimeout(my.turnStart, 2400);
};

exports.turnStart = function() {
	var my = this;

	if (!my.gaming || !my.game) return;
	my.game.late = false;
	my.game.roundStartTime = Date.now();

	my.game.scanTimer = setInterval(function() { scanHP(my); }, SCAN_INTERVAL);
	scheduleAutoAttack(my);

	traverse(my, function(o) {
		if (o.robot) exports.playRobot.call(my, o);
	});

	my.game._turnEndTimer = setTimeout(function() {
		if (!my.game.late) exports.turnEnd.call(my);
	}, my.game.roundTime);

	my.byMaster('turnStart', { roundTime: my.game.roundTime }, true);
};

exports.turnEnd = function() {
	var my = this;

	my.game.late = true;
	stopTimers(my);

	var scores = {};
	traverse(my, function(o) { scores[o.id] = o.game.score; });

	my.byMaster('turnEnd', { ok: false, timeUp: true, scores: scores }, true);
	my.game._rrt = setTimeout(my.roundEnd, 3000);
};

exports.submit = function(client, text, data) {
	var my = this;

	if (!client.game || !client.game.alive) {
		if (!client.robot) client.chat(text);
		return;
	}
	if (my.game.late) return;

	// 전략 업데이트
	if (data && typeof data.strategy === 'number' && Number.isInteger(data.strategy) && data.strategy >= 0 && data.strategy <= 2) {
		if (data.strategy === 0 && client.game.attackStrategy !== 0) {
			client.game.attacksSent = {};
		}
		client.game.attackStrategy = data.strategy;
	}

	var isKo = my.rule.lang === 'ko';
	var stack = client.game.stack;
	var queryText = isKo ? text : text.toLowerCase();

	// 스택에서 일치하는 글자 인덱스 탐색
	var idx = findMatchInStack(my, stack, queryText);
	if (idx === -1) {
		if (!client.robot) client.send('turnEnd', { error: true });
		return;
	}

	// 중복 단어 거부 — usedWords(확정) + pendingWords(비동기 처리 중) 모두 체크
	if (client.game.usedWords[queryText] || (client.game.pendingWords && client.game.pendingWords[queryText])) {
		if (!client.robot) client.send('turnEnd', { error: true });
		return;
	}
	if (!client.game.pendingWords) client.game.pendingWords = {};
	client.game.pendingWords[queryText] = true;

	var matchedChar = stack[idx];
	var gen = my.game.gen;

	DB.kkutu[isKo ? 'ko' : 'en'].findOne(
		['_id', queryText],
		isKo ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
	).limit(['mean', true], ['flag', true], ['type', true])
	 .on(function($doc) {
		function releasePending() {
			if (client.game && client.game.pendingWords) delete client.game.pendingWords[queryText];
		}

		if (my.game.gen !== gen || my.game.late || !client.game || !client.game.alive) {
			releasePending();
			return;
		}

		if (!$doc) {
			releasePending();
			if (!client.robot) client.send('turnEnd', { error: true });
			return;
		}

		// 어인정/깐깐 체크
		if (isKo) {
			if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) {
				releasePending();
				if (!client.robot) client.send('turnEnd', { error: true });
				return;
			}
			if (my.opts.strict && (!$doc.type || !$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) {
				releasePending();
				if (!client.robot) client.send('turnEnd', { error: true });
				return;
			}
		}

		// 비동기 완료 후 스택에서 matchedChar 재확인
		var currentIdx = client.game.stack.indexOf(matchedChar);
		if (currentIdx === -1) {
			releasePending();
			if (!client.robot) client.send('turnEnd', { error: true });
			return;
		}

		var endChar    = queryText.charAt(queryText.length - 1);
		var endSubChar = isKo ? getSubChar(my, endChar) : null;

		// 한방 단어 거부 (한국어)
		if (isKo && !checkManner(my, endChar, endSubChar)) {
			releasePending();
			if (!client.robot) client.send('turnEnd', { error: true });
			return;
		}

		var surHP = Math.max(50, Math.min(1000, parseInt(my.opts.surHP) || 200));
		client.game.stack.splice(currentIdx, 1);
		client.game.usedWords[queryText] = true;
		releasePending();
		var recovered = isKo ? queryText.length : Math.ceil(queryText.length / 2);
		client.game.score = Math.min(surHP, client.game.score + recovered);

		var aliveCount = 0;
		traverse(my, function(o) { if (o.game.alive) aliveCount++; });

		var attackCount = calcAttacks(queryText.length, aliveCount, !isKo);
		var attackTargets = [];
		for (var i = 0; i < attackCount; i++) {
			var targetId = selectTarget(my, client);
			if (!targetId) break;
			var target = DIC[targetId] || null;
			if (!target) {
				traverse(my, function(o) { if (o.robot && o.id === targetId) target = o; });
			}
			if (target && target.game && target.game.alive) {
				client.game.attacksSent[targetId] = (client.game.attacksSent[targetId] || 0) + 1;
				target.game.lastAttacker = client.id;
				enqueueChar(my, target, endChar);
				if (attackTargets.indexOf(targetId) === -1) attackTargets.push(targetId);
			}
		}

		client.publish('turnEnd', {
			target:        client.id,
			ok:            true,
			word:          queryText,
			removed:       matchedChar,
			recovered:     recovered,
			hp:            client.game.score,
			stackLen:      client.game.stack.length,
			attackTargets: attackTargets,
			endChar:       endChar
		}, true);

		client.invokeWordPiece(queryText, 0.5);

		if (client.robot) {
			client.game.botRetryCount = 0;
			clearTimeout(client.game.botTimer);
			exports.playRobot.call(my, client);
		}
	});
};

exports.getScore = function() {
	return 0;
};

exports.playRobot = function(robot) {
	var my = this;

	if (my.game.late || !robot.game || !robot.game.alive) return;

	var isKo = my.rule.lang === 'ko';
	var level = robot.level;
	var stack = robot.game.stack;

	if (stack.length === 0) {
		robot.game.botTimer = setTimeout(function() {
			if (!my.game.late && robot.game && robot.game.alive) exports.playRobot.call(my, robot);
		}, ROBOT_MIN_DELAY);
		return;
	}

	// 스택을 섞어서 순서에 편향 없이 탐색
	var shuffled = stack.slice().sort(function() { return Math.random() - 0.5; });
	var charIdx = 0;

	function tryNextChar() {
		if (my.game.late || !robot.game || !robot.game.alive) return;
		if (charIdx >= shuffled.length) {
			robot.game.botRetryCount = (robot.game.botRetryCount || 0) + 1;
			var backoff = Math.min(ROBOT_MIN_DELAY * Math.pow(2, robot.game.botRetryCount - 1), 8000);
			robot.game.botTimer = setTimeout(function() {
				exports.playRobot.call(my, robot);
			}, backoff);
			return;
		}

		var char    = shuffled[charIdx++];
		var subChar = isKo ? getSubChar(my, char) : null;

		getAutoWords(my, char, subChar, function(list) {
			if (my.game.late || !robot.game || !robot.game.alive) return;

			list = list.filter(function(w) {
				if (w._id.length < 2) return false;
				if (robot.game.usedWords[w._id]) return false;
				if (isKo) {
					if (!my.opts.injeong && (w.flag & Const.KOR_FLAG.INJEONG)) return false;
					if (my.opts.strict && (!w.type || !w.type.match(Const.KOR_STRICT) || w.flag >= 4)) return false;
				}
				return true;
			});

			if (isKo) {
				list = list.filter(function(w) {
					var ec = w._id.charAt(w._id.length - 1);
					return checkManner(my, ec, getSubChar(my, ec));
				});
			}

			if (list.length === 0) {
				tryNextChar();
				return;
			}

			// 레벨 3+ 봇은 긴 단어 선호
			var word;
			if (level >= 3) {
				list.sort(function(a, b) { return b._id.length - a._id.length; });
				var topN = Math.max(1, Math.ceil(list.length * 0.3));
				word = list[Math.floor(Math.random() * topN)];
			} else {
				word = list[Math.floor(Math.random() * list.length)];
			}

			var delay = ROBOT_MIN_DELAY + word._id.length * ROBOT_TYPE_COEF[level];
			delay += (Math.random() * 200 - 100);
			delay = Math.max(ROBOT_MIN_DELAY, delay);

			robot.game.botTimer = setTimeout(function() {
				if (my.game.late || !robot.game || !robot.game.alive) return;
				robot.game.botRetryCount = 0;
				my.submit(robot, word._id, {});
			}, delay);
		});
	}

	tryNextChar();
};
