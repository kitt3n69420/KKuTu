/**
 * Rule the words! KKuTu Online
 * Raingame (단어비) mode - server logic
 */

var Lizard = require('../../sub/lizard');
var DB;
var DIC;

var SCAN_INTERVAL     = 200;
var MAX_ACTIVE_WORDS  = 100;
var MAX_WORD_RETRIES  = 3;
var POOL_SIZE_PER_LEN = 100;

// 플레이어 수별 초기 단어 수 (index = 플레이어 수)
var INITIAL_ATTACKS_BY_COUNT = [0, 24, 12, 8, 6, 5, 4, 3, 3, 3, 2, 2, 2];

function getInitialAttacks(playerCount) {
	if (playerCount < 2) return 0;
	if (playerCount > 12) return 2;
	return INITIAL_ATTACKS_BY_COUNT[playerCount];
}

var BOT_CPM      = [30, 70, 150, 250, 500];
var BOT_ACCURACY = [0.9, 0.95, 0.98, 0.99, 1.0];

// nyh 한국어
var NYH_INITIALS = [1, 4, 8, 10, 13];
var NYH_VOWELS   = [3, 7, 9, 10, 11, 14, 15, 16, 19];
var NYH_FINALS   = [2, 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18, 20];

// nyh 영어
var EN_NYH_CHARS = 'abcdefghijklmnopqrstuvwxyz';

function generateNyhKoChar() {
	var ini = NYH_INITIALS[Math.floor(Math.random() * NYH_INITIALS.length)];
	var vow = NYH_VOWELS[Math.floor(Math.random() * NYH_VOWELS.length)];
	var fin = NYH_FINALS[Math.floor(Math.random() * NYH_FINALS.length)];
	return String.fromCharCode(0xAC00 + (ini * 21 + vow) * 28 + fin);
}

function generateNyhKoWord(len) {
	var w = '';
	for (var i = 0; i < len; i++) w += generateNyhKoChar();
	return w;
}

function generateNyhEnWord(len) {
	var w = '';
	for (var i = 0; i < len; i++) w += EN_NYH_CHARS[Math.floor(Math.random() * EN_NYH_CHARS.length)];
	return w;
}

function generateNyhPool(isEn) {
	var lens = isEn ? [3, 4, 5, 6, 7] : [2, 3, 4];
	var pool = {};
	lens.forEach(function(l) { pool[l] = []; });
	var gen = isEn ? generateNyhEnWord : generateNyhKoWord;
	lens.forEach(function(len) {
		var used = {};
		while (pool[len].length < POOL_SIZE_PER_LEN) {
			var word = gen(len);
			if (!used[word]) { used[word] = true; pool[len].push(word); }
		}
	});
	return pool;
}

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
		if (o.robot) clearTimeout(o.game.botTimer);
		if (o.game.sendTimers) {
			o.game.sendTimers.forEach(function(t) { clearTimeout(t); });
			o.game.sendTimers = [];
		}
	});
}

// 단어 전송 간격: 2000ms → 100ms 지수보간
function calcWordStagger(elapsed, T) {
	var ratio = Math.min(1, elapsed / T);
	return Math.max(100, Math.round(2000 * Math.pow(0.05, ratio)));
}

// 낙하 타임아웃: 20000ms → 1000ms 지수보간
function calcTimeout(elapsed, T) {
	var ratio = Math.min(1, elapsed / T);
	return Math.max(1000, Math.round(20000 * Math.pow(0.1, ratio)));
}

// 데미지 배율: 2x → 10x 보간
function calcDamage(elapsed, T, len) {
	var ratio = Math.min(1, elapsed / T);
	var mult = 2 +8 * ratio;
	return Math.round(len * mult);
}

// 자동공격 간격: 8000ms → 2000ms 지수보간
function calcAutoAtkInterval(elapsed, T) {
	var ratio = Math.min(1, elapsed / T);
	return Math.max(2000, Math.round(8000 * Math.pow(0.25, ratio)));
}

function scheduleAutoAttack(my) {
	if (my.game.late) return;
	var elapsed = Date.now() - my.game.roundStartTime;
	var interval = calcAutoAtkInterval(elapsed, my.game.roundTime);
	my.game.autoAtkTimer = setTimeout(function() {
		if (my.game.late) return;
		autoAttack(my);
		scheduleAutoAttack(my);
	}, interval);
}

function randomLen(my) {
	if (my.rule.lang === 'en') return Math.floor(Math.random() * 5) + 3; // 3~7
	return Math.floor(Math.random() * 3) + 2; // 2~4
}

function selectWordForLen(my, player, len) {
	var pool = my.game.wordPool[len];
	if (!pool || pool.length === 0) return null;
	var activeSet = {};
	var i;
	for (i = 0; i < player.game.activeWords.length; i++) {
		activeSet[player.game.activeWords[i].word] = true;
	}
	var word;
	for (i = 0; i < MAX_WORD_RETRIES; i++) {
		word = pool[Math.floor(Math.random() * pool.length)];
		if (!activeSet[word]) return word;
	}
	return word;
}

function addToQueue(player, len) {
	player.game.attackQueue.push(len);
}

function tryPushFromQueue(my, player) {
	if (!player.game || !player.game.alive) return;
	if (player.game.activeWords.length >= MAX_ACTIVE_WORDS) return;
	if (player.game.attackQueue.length === 0) return;

	var len = player.game.attackQueue.shift();
	var word = selectWordForLen(my, player, len);

	// R16: 해당 길이 풀이 비었으면 다른 길이로 대체
	if (!word) {
		var poolLens = Object.keys(my.game.wordPool);
		for (var k = 0; k < poolLens.length; k++) {
			var fl = parseInt(poolLens[k]);
			if (fl !== len) {
				word = selectWordForLen(my, player, fl);
				if (word) { len = fl; break; }
			}
		}
	}
	if (!word) return;

	var now = Date.now();
	var T = my.game.roundTime;
	var isNyh = my.opts.nyeohweok;

	if (player.robot) {
		var elapsed = now - my.game.roundStartTime;
		var timeout = calcTimeout(elapsed, T);
		if (isNyh) timeout *= 2;
		var wordId = ++player.game.wordIdCounter;
		player.game.activeWords.push({ id: wordId, word: word, len: len, expiresAt: now + timeout });
	} else {
		var stagger = calcWordStagger(now - my.game.roundStartTime, T);
		player.game.nextWordTime = Math.max(now + 50, (player.game.nextWordTime || 0) + stagger);
		var sendDelay = player.game.nextWordTime - now;
		var sendElapsed = (now + sendDelay) - my.game.roundStartTime;
		var sendTimeout = calcTimeout(sendElapsed, T);
		if (isNyh) sendTimeout *= 2;
		var wId = ++player.game.wordIdCounter;
		var wordObj = { id: wId, word: word, len: len, expiresAt: now + sendDelay + sendTimeout };
		player.game.activeWords.push(wordObj);

		var c = DIC[player.id];
		if (c) {
			// R3: 전송 타이머 추적 (sendTimers에 등록, stopTimers 시 취소 가능)
			(function(wo, delay, tOut, gen) {
				var t = setTimeout(function() {
					if (player.game && player.game.sendTimers) {
						var idx = player.game.sendTimers.indexOf(t);
						if (idx !== -1) player.game.sendTimers.splice(idx, 1);
					}
					if (!my.game || my.game.gen !== gen || my.game.late || !player.game || !player.game.alive) return;
					c.send('raingameWord', { wordId: wo.id, word: wo.word, timeout: tOut });
				}, delay);
				if (player.game.sendTimers) player.game.sendTimers.push(t);
			})(wordObj, sendDelay, sendTimeout, my.game.gen);
		}
	}
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
		// 내가 공격을 가장 적게 보낸 상대 (동점이면 랜덤)
		var minSent = Infinity;
		targets.forEach(function(o) {
			var s = attacker.game.attacksSent[o.id] || 0;
			if (s < minSent) minSent = s;
		});
		var minTargets = targets.filter(function(o) {
			return (attacker.game.attacksSent[o.id] || 0) === minSent;
		});
		chosen = minTargets[Math.floor(Math.random() * minTargets.length)];
	} else if (strategy === 1) {
		var minHP = Infinity;
		targets.forEach(function(o) { if (o.game.score < minHP) minHP = o.game.score; });
		var minTargets = targets.filter(function(o) { return o.game.score === minHP; });
		chosen = minTargets[Math.floor(Math.random() * minTargets.length)];
	} else {
		if (attacker.game.lastAttacker) {
			var lastAtk = DIC[attacker.game.lastAttacker];
			var lastAtkRobot = null;
			if (!lastAtk) {
				traverse(my, function(o) { if (o.robot && o.id === attacker.game.lastAttacker) lastAtkRobot = o; });
			}
			var lastAtkObj = lastAtk || lastAtkRobot;
			if (lastAtkObj && lastAtkObj.game && lastAtkObj.game.alive) {
				var revengeId = attacker.game.lastAttacker;
				attacker.game.lastAttacker = null;
				return revengeId;
			}
		}
		chosen = targets[Math.floor(Math.random() * targets.length)];
	}

	return chosen ? chosen.id : null;
}

// KO된 플레이어의 남은 단어/공격을 살아있는 플레이어에게 분배
function distributeKOSpill(my, koPlayer) {
	var spillCount = Math.ceil((koPlayer.game.activeWords.length + koPlayer.game.attackQueue.length) / 2);
	if (spillCount === 0) return;

	var aliveTargets = [];
	traverse(my, function(t) {
		if (t.game.alive) aliveTargets.push(t);
	});
	if (aliveTargets.length === 0) return;

	// HP 높은 순으로 정렬 (높은 HP 플레이어가 나머지 가져감)
	aliveTargets.sort(function(a, b) { return b.game.score - a.game.score; });

	var base = Math.floor(spillCount / aliveTargets.length);
	var extra = spillCount % aliveTargets.length;

	for (var ti = 0; ti < aliveTargets.length; ti++) {
		var give = base + (ti < extra ? 1 : 0);
		for (var gi = 0; gi < give; gi++) {
			addToQueue(aliveTargets[ti], randomLen(my));
		}
		tryPushFromQueue(my, aliveTargets[ti]);
	}
}

function checkGameOver(my) {
	var aliveCount = 0;
	traverse(my, function(o) { if (o.game.alive) aliveCount++; });
	if (aliveCount <= 1) {
		my.game.late = true;
		stopTimers(my);
		var scores = {};
		traverse(my, function(o) { scores[o.id] = o.game.alive ? o.game.score : 0; });
		my.byMaster('turnEnd', { ok: false, timeUp: true, scores: scores }, true);
		my.game._rrt = setTimeout(function() { my.roundEnd(); }, 2000);
	}
}

function scanWords(my) {
	if (my.game.late) return;
	var now = Date.now();
	var elapsed = now - my.game.roundStartTime;
	var T = my.game.roundTime;

	traverse(my, function(o) {
		if (my.game.late) return; // R2: 다중 KO 시 중복 처리 방지
		if (!o.game.alive) return;
		var expired = [];
		var i;
		for (i = 0; i < o.game.activeWords.length; i++) {
			if (now >= o.game.activeWords[i].expiresAt) expired.push(o.game.activeWords[i]);
		}
		if (expired.length === 0) return;

		// R9: 만료된 단어를 id 집합으로 한 번에 필터링 (O(n) 단일 패스)
		var expiredSet = {};
		expired.forEach(function(w) { expiredSet[w.id] = true; });
		o.game.activeWords = o.game.activeWords.filter(function(a) { return !expiredSet[a.id]; });

		for (i = 0; i < expired.length; i++) {
			if (my.game.late) return;
			var w = expired[i];

			var damage = calcDamage(elapsed, T, w.len);
			o.game.score -= damage;
			var ko = o.game.score <= 0;
			if (ko) { o.game.score = 0; o.game.alive = false; }

			my.byMaster('turnEnd', {
				ok: false,
				target: o.id,
				wordId: w.id,
				damage: damage,
				hp: o.game.score,
				ko: ko
			}, true);

			if (ko) {
				// R8: KO된 플레이어를 다른 플레이어의 attacksSent에서 제거
				traverse(my, function(s) {
					if (s.game && s.game.attacksSent && s.id !== o.id) delete s.game.attacksSent[o.id];
				});
				distributeKOSpill(my, o);
				checkGameOver(my);
				return;
			} else {
				o.game.missCount++;
				if (o.game.missCount % 2 === 0) {
					addToQueue(o, randomLen(my));
				}
				tryPushFromQueue(my, o);
				tryPushFromQueue(my, o);
			}
		}
	});
}

function autoAttack(my) {
	if (my.game.late) return;
	traverse(my, function(o) {
		if (!o.game.alive) return;
		addToQueue(o, randomLen(my));
		tryPushFromQueue(my, o);
	});
}

exports.init = function(_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};

exports.getTitle = function() {
	var R = new Lizard.Tail();
	var my = this;
	var isEn = my.rule.lang === 'en';

	my.game.round = 0;

	if (my.opts.nyeohweok) {
		my.game.wordPool = generateNyhPool(isEn);
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
		return R;
	}

	var table = isEn ? 'kkutu_en' : 'kkutu_ko';
	var filter = isEn ? "_id ~ '^[a-z]+$'" : "_id ~ '^[가-힣]+$'";
	var lens = isEn ? [3, 4, 5, 6, 7] : [2, 3, 4];
	var pool = {};
	lens.forEach(function(l) { pool[l] = []; });
	var pending = lens.length;

	function onDone() {
		pending--;
		if (pending === 0) {
			my.game.wordPool = pool;
			R.go("①②③④⑤⑥⑦⑧⑨⑩");
		}
	}

	lens.forEach(function(len) {
		var sql = "SELECT _id FROM " + table +
			" WHERE LENGTH(_id) = " + len +
			" AND hit >= 1 AND " + filter +
			" ORDER BY log(greatest(hit, 2)) + random() * 3 DESC LIMIT " + POOL_SIZE_PER_LEN;
		DB.kkutu[isEn ? 'en' : 'ko'].direct(sql, function(err, res) {
			if (!err && res && res.rows) {
				pool[len] = res.rows.map(function(r) { return r._id; });
			}
			onDone();
		});
	});

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

	my.game.roundTime = my.time * 1000;
	var surHP = Math.max(50, Math.min(2000, parseInt(my.opts.surHP) || 500));

	// 플레이어 수 계산
	var playerCount = 0;
	traverse(my, function() { playerCount++; });
	var initialCount = getInitialAttacks(playerCount);
	my.game.initialCount = initialCount;

	traverse(my, function(o) {
		o.game.score           = surHP;
		o.game.alive           = true;
		o.game.activeWords     = [];
		o.game.attackQueue     = [];
		o.game.sendTimers      = [];
		var p = (o.robot && o.data) ? (o.data.personality || 0) : 0;
		o.game.attackStrategy  = (p >= 0.6) ? 1 : (p <= -0.6) ? 2 : 0;
		o.game.attacksSent     = {};
		o.game.lastAttacker    = null;
		o.game.wordIdCounter   = 0;
		o.game.nextWordTime    = 0;
		o.game.missCount       = 0;
		for (var i = 0; i < initialCount; i++) addToQueue(o, randomLen(my));
	});

	my.byMaster('roundReady', { round: my.game.round, surHP: surHP }, true);
	my.game._tsTimer = setTimeout(my.turnStart, 2400);
};

exports.turnStart = function() {
	var my = this;

	if (!my.gaming || !my.game) return;
	my.game.late = false;
	my.game.roundStartTime = Date.now();

	my.game.scanTimer = setInterval(function() { scanWords(my); }, SCAN_INTERVAL);
	scheduleAutoAttack(my);

	traverse(my, function(o) {
		while (o.game.activeWords.length < MAX_ACTIVE_WORDS && o.game.attackQueue.length > 0) {
			tryPushFromQueue(my, o);
		}
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
	traverse(my, function(o) {
		scores[o.id] = o.game.alive ? o.game.score : 0;
	});

	my.byMaster('turnEnd', { ok: false, timeUp: true, scores: scores }, true);
	my.game._rrt = setTimeout(my.roundEnd, 3000);
};

exports.submit = function(client, text, data) {
	var my = this;

	if (!client.game || !client.game.alive) {
		client.chat(text);
		return;
	}
	if (my.game.late) return;

	if (data && typeof data.strategy === 'number' && Number.isInteger(data.strategy) && data.strategy >= 0 && data.strategy <= 2) {
		if (data.strategy === 0 && client.game.attackStrategy !== 0) {
			client.game.attacksSent = {};
		}
		client.game.attackStrategy = data.strategy;
	}

	var matchText = my.opts.mirror ? text.split('').reverse().join('') : text;

	var found = null;
	var minExpiry = Infinity;
	var i;
	for (i = 0; i < client.game.activeWords.length; i++) {
		var w = client.game.activeWords[i];
		if (w.word === matchText && w.expiresAt < minExpiry) {
			minExpiry = w.expiresAt;
			found = w;
		}
	}

	if (!found) {
		client.send('turnEnd', { error: true });
		return;
	}

	client.game.activeWords = client.game.activeWords.filter(function(a) { return a.id !== found.id; });
	tryPushFromQueue(my, client);

	var targetId = selectTarget(my, client);
	if (targetId) {
		var target = DIC[targetId];
		if (!target) {
			traverse(my, function(o) { if (o.robot && o.id === targetId) target = o; });
		}
		if (!target || !target.game || !target.game.alive) {
			var fallback = [];
			traverse(my, function(o) { if (o.id !== client.id && o.game && o.game.alive) fallback.push(o); });
			target = fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)] : null;
			if (target) targetId = target.id;
		}
		if (target && target.game && target.game.alive) {
			client.game.attacksSent[targetId] = (client.game.attacksSent[targetId] || 0) + 1;
			target.game.lastAttacker = client.id;
			addToQueue(target, found.len);
			tryPushFromQueue(my, target);
		}
	}

	client.publish('turnEnd', {
		target: client.id,
		ok: true,
		wordId: found.id,
		attackTarget: targetId
	}, true);
};

exports.getScore = function() {
	return 0;
};

exports.playRobot = function(robot) {
	var my = this;

	if (my.game.late || !robot.game || !robot.game.alive) return;

	var words = robot.game.activeWords;
	if (words.length === 0) {
		robot.game.botTimer = setTimeout(function() {
			if (!my.game.late && robot.game && robot.game.alive) exports.playRobot.call(my, robot);
		}, 500);
		return;
	}

	var target = null;
	var minExpiry = Infinity;
	for (var i = 0; i < words.length; i++) {
		if (words[i].expiresAt < minExpiry) { minExpiry = words[i].expiresAt; target = words[i]; }
	}
	if (!target) return;

	var level = robot.level;
	var cpm = BOT_CPM[level];
	var accuracy = BOT_ACCURACY[level];
	var word = target.word;
	var typeTime = (word.length * 60000) / cpm;
	if (my.opts.mirror) typeTime *= 1.25;
	typeTime += (Math.random() * 100 - 50);

	robot.game.botTimer = setTimeout(function() {
		if (my.game.late || !robot.game || !robot.game.alive) return;
		var isCorrect = Math.random() < accuracy;
		if (isCorrect) {
			var submitText = my.opts.mirror ? word.split('').reverse().join('') : word;
			my.submit(robot, submitText, {});
		}
		exports.playRobot.call(my, robot);
	}, Math.max(50, typeTime));
};
