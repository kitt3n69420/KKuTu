/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [4, 2, 1, 0, 0];
const ROBOT_HIT_LIMIT = [4, 3, 2, 1, 0];
const ROBOT_LENGTH_LIMIT = [3, 7, 15, 31, 999];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];

// Helper function to get player ID (supports both robot objects and player ID strings)
function getPlayerId(player) {
    return (typeof player === 'object' && player.id) ? player.id : player;
}

exports.init = function (_DB, _DIC) {
    DB = _DB;
    DIC = _DIC;
};
exports.getTitle = function () {
    var R = new Lizard.Tail();
    var my = this;

    setTimeout(function () {
        if (Const.GAME_TYPE[my.mode] === 'KFR' || Const.GAME_TYPE[my.mode] === 'EFR') {
            R.go("①②③④⑤⑥⑦⑧⑨⑩");
        } else {
            R.go(Const.EXAMPLE_TITLE[my.rule.lang]);
        }
    }, 100);

    return R;
};
exports.roundReady = function () {
    var my = this;

    clearTimeout(my.game.turnTimer);
    my.game.round++;

    if (my.opts.straight && my.game.seq) {
        var i, p;
        for (i in my.game.seq) {
            p = (typeof my.game.seq[i] === 'string') ? DIC[my.game.seq[i]] : my.game.seq[i];
            if (p && p.game) {
                p.game.straightStreak = 0;
                delete p.game.lastWordLen;
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

    my.game.roundTime = my.time * 1000;
    if (!my.opts.onlyonce || my.game.round === 1) my.resetChain();
    if (my.game.round <= my.round) {
        if (my.opts.mission) my.game.mission = getMission(my.rule.lang, my.opts);

        my.byMaster('roundReady', {
            round: my.game.round,
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
    my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.chain.length * 1500));
    speed = my.getTurnSpeed(my.opts.speed ? my.game.roundTime / 2 : my.game.roundTime);
    clearTimeout(my.game.turnTimer);
    clearTimeout(my.game.robotTimer);
    my.game.late = false;
    my.game.turnTime = 15000 - 1400 * speed;
    my.game.turnAt = (new Date()).getTime();

    my.byMaster('turnStart', {
        turn: my.game.turn,
        speed: speed,
        roundTime: my.game.roundTime,
        turnTime: my.game.turnTime,
        mission: my.game.mission,
        seq: force ? my.game.seq : undefined
    }, true);
    // 서바이벌 모드: 라운드 시간 체크 제거 (턴 시간만 사용)
    var timeout = my.opts.survival
        ? my.game.turnTime + 100
        : Math.min(my.game.roundTime, my.game.turnTime + 100);
    my.game.turnTimer = setTimeout(my.turnEnd, timeout);
    if (si = my.game.seq[my.game.turn]) if (si.robot) {
        si._done = [];
        my.readyRobot(si);
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

    // ========== 서바이벌 모드: 타임아웃 = 즉시 KO ==========
    if (my.opts.survival && target && target.game && target.game.alive) {
        my.logChainEvent(target, 'ko');
        var gameOver = Const.handleSurvivalTimeout(my, DIC, target);

        if (!gameOver) {
            clearTimeout(my.game.robotTimer);
            my.game._rrt = setTimeout(function () {
                my.turnNext();
            }, 2000);
        }
        return;
    }
    // ========== 서바이벌 모드 끝 ==========

    if (target) if (target.game) {
        // 무적(god): 패널티 면제
        if (my.opts.invincible) {
            score = 0;
        } else {
            score = Const.getPenalty(my.game.chain, target.game.score);
            // 나락(nar): 최소 패널티 >= 점수일 때 적용 (점수가 0 이하가 됨)
            if (my.opts.narak && Math.abs(score) >= target.game.score) {
                score = -target.game.score;
            }
        }
        if (score !== 0) target.game.score += score;
    }

    // Hint logic: Just pick a random word since there's no restriction
    getAuto.call(my, null, 0).then(function (w) {
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
                    var rand = Math.random();
                    if (rand < prob) {
                        (function (bot) {
                            // Check team relation
                            var botTeam = bot.game.team || 0;
                            var isTeammate = (targetTeam !== 0 && targetTeam === botTeam);

                            setTimeout(function () {
                                var msgs = isTeammate ?
                                    Const.ROBOT_TIMEOUT_MESSAGES_SAMETEAM :
                                    Const.ROBOT_TIMEOUT_MESSAGES;

                                if (!msgs || msgs.length === 0) msgs = Const.ROBOT_TIMEOUT_MESSAGES;

                                var msg = msgs[Math.floor(Math.random() * msgs.length)];
                                bot.chat(msg);
                            }, 500 + Math.random() * 1000);
                        })(bots[i]);
                    }
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

    // Surrogate character check: reject inputs containing surrogates (e.g., emojis)
    if (/[\uD800-\uDFFF]/.test(text)) {
        client.publish('turnError', { code: 404, value: text }, true);
        if (my.opts.one) my.turnEnd();
        return;
    }

    // noLong/noShort/no2 길이 검증 (통과 못하면 채팅으로 처리)
    if (my.opts.nolong && text.length >= 9) return client.chat(text);
    if (my.opts.noshort && text.length <= 8) return client.chat(text);
    if (my.opts.no2 && text.length <= 2) return client.chat(text);

    // No chaining check needed for Free mode

    if (my.game.chain.indexOf(text) != -1) {
        if (my.opts.return) {
            // Return rule: Allow duplicate but 0 score
        } else {
            if (client.robot && client.data.candidates && client.data.candidateIndex < client.data.candidates.length - 1) {
                client.data.candidateIndex++;
                var nextWord = client.data.candidates[client.data.candidateIndex];
                if (nextWord) {
                    setTimeout(function () {
                        my.turnRobot(client, nextWord._id);
                    }, ROBOT_START_DELAY[client.level]);
                    return;
                }
            }
            client.publish('turnError', { code: 409, value: text }, true);
            if (my.opts.one) my.turnEnd();
            return;
        }
    }

    l = my.rule.lang;
    my.game.loading = true;
    function onDB($doc) {
        if (!my.game.chain) return;
        var firstMove = my.game.chain.length < 1;

        function preApproved() {
            function approved() {
                if (my.game.late) return;
                if (!my.game.chain) return;

                my.game.loading = false;
                my.game.late = true;
                clearTimeout(my.game.turnTimer);
                t = tv - my.game.turnAt;
                var isReturn = my.opts.return && my.game.chain.includes(text);

                // 기본 점수 계산 (미션 보너스 포함)
                var baseScore = my.getScore(text, t, isReturn);
                // 미션 보너스 제외한 순수 기본 점수
                var baseScoreWithoutMission = my.getScore(text, t, true);
                // 미션 보너스만 추출
                var missionBonus = (my.game.mission === true) ? baseScore - baseScoreWithoutMission : 0;

                score = baseScoreWithoutMission;

                // Straight Rule Logic
                var straightBonus = 0;
                if (my.opts.straight) {
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
                        var multiplier = (client.game.straightStreak - 1) / 2;
                        straightBonus = Math.round(baseScoreWithoutMission * multiplier);
                        if (my.opts.bbungtwigi) straightBonus *= 2; // 뻥튀기: 스트레이트 보너스 2배
                    }
                }

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
                        fullHouseBonus = Math.round(baseScoreWithoutMission * 1.5);
                        if (my.opts.bbungtwigi) fullHouseBonus *= 2; // 뻥튀기: 보너스 2배
                        fullHouseChars = matchedIndices;
                    }
                }
                client.game.lastWord = text;

                // 최종 점수 = 기본 점수 + 미션 보너스 + 스트레이트 보너스 + 풀하우스 보너스
                score = baseScoreWithoutMission + missionBonus + straightBonus + fullHouseBonus;

                if (isReturn) score = 0;
                my.logChainWord(text, client);
                my.game.roundTime -= t;

                // ========== 서바이벌 모드: 득점 = 다음 사람 데미지 ==========
                if (my.opts.survival) {
                    client.game.survivalSubmitted = true;
                    var survivalDamageInfo = Const.applySurvivalDamage(my, DIC, score, my.game.turn);
                    var status = Const.checkSurvivalStatus(my, DIC);

                    client.publish('turnEnd', {
                        ok: true,
                        value: text,
                        mean: $doc.mean,
                        theme: $doc.theme,
                        wc: $doc.type,
                        score: score,
                        bonus: missionBonus,
                        straightBonus: straightBonus,
                        fullHouseBonus: (typeof fullHouseBonus !== 'undefined' && fullHouseBonus > 0) ? fullHouseBonus : undefined,
                        fullHouseChars: (typeof fullHouseChars !== 'undefined') ? fullHouseChars : [],
                        baby: $doc.baby,
                        totalScore: client.game.score,
                        survival: true,
                        survivalDamage: survivalDamageInfo,
                        attackerHP: client.game.score
                    }, true);

                    if (status.gameOver) {
                        clearTimeout(my.game.turnTimer);
                        clearTimeout(my.game.robotTimer);
                        my.game._rrt = setTimeout(function () {
                            my.roundEnd();
                        }, 2000);
                    } else {
                        if (my.game.mission === true) {
                            my.game.mission = getMission(my.rule.lang, my.opts);
                        } else if (my.opts.rndmission) {
                            my.game.mission = getMission(my.rule.lang, my.opts);
                        }
                        clearTimeout(my.game.turnTimer);
                        clearTimeout(my.game.robotTimer);
                        my.game._rrt = setTimeout(function () {
                            my.turnNext();
                        }, my.game.turnTime / 6);
                    }

                    if (!client.robot) {
                        client.invokeWordPiece(text, 1);
                        DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
                    }
                    return;
                }
                // ========== 서바이벌 모드 끝 ==========

                client.game.score += score;
                client.publish('turnEnd', {
                    ok: true,
                    value: text,
                    mean: $doc.mean,
                    theme: $doc.theme,
                    wc: $doc.type,
                    score: score,
                    bonus: missionBonus,
                    straightBonus: straightBonus, // Send Straight Bonus
                    fullHouseBonus: (typeof fullHouseBonus !== 'undefined' && fullHouseBonus > 0) ? fullHouseBonus : undefined,
                    fullHouseChars: (typeof fullHouseChars !== 'undefined') ? fullHouseChars : [],
                    baby: $doc.baby,
                    totalScore: client.game.score
                }, true);
                if (my.game.mission === true) {
                    my.game.mission = getMission(my.rule.lang, my.opts);
                } else if (my.opts.rndmission) {
                    // 랜덤미션: 달성하지 않아도 매 턴마다 미션 변경
                    my.game.mission = getMission(my.rule.lang, my.opts);
                }
                setTimeout(my.turnNext, my.game.turnTime / 6);
                if (!client.robot) {
                    client.invokeWordPiece(text, 1);
                    DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
                }
            }
            approved();
        }
        function denied(code) {
            my.game.loading = false;
            client.publish('turnError', { code: code || 404, value: text }, true);
            if (my.opts.one) my.turnEnd();
            else if (client.robot && text.indexOf("T.T") == -1) {
                setTimeout(function () {
                    my.readyRobot(client);
                }, 1000);
            }
        }
        if (my.opts.unknown) {
            if ($doc) denied(410);
            else {
                var valid = true; //아무거나 쳐도 되므로 체크를 할 필요가 없다

                if (!valid) denied();
                else {
                    // Construct mock $doc for unknown word
                    $doc = {
                        mean: "Unknown Word",
                        theme: "",
                        type: "unknown",
                        hit: 0,
                        baby: 0,
                        flag: 0
                    };
                    preApproved();
                }
            }
        } else if ($doc) {
            // Injeong check applies to all languages if flag exists
            if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) denied();
            else if (l == "ko") {
                if (my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) denied(406);
                else if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) denied(405);
                else preApproved();
            } else {
                preApproved();
            }
        } else {
            denied();
        }
    }
    DB.kkutu[l].findOne(['_id', text],
        (l == "ko") ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
    ).limit(['mean', true], ['theme', true], ['type', true], ['hit', true], ['flag', true]).on(onDB);
};
exports.getScore = function (text, delay, ignoreMission) {
    var my = this;
    var tr = 1 - delay / my.game.turnTime;
    var score, arr;

    if (!text || !my.game.chain) return 0;
    score = Const.getPreScore(text, my.game.chain, tr);

    if (!ignoreMission) {
        // 쉬운 미션 (easymission) 규칙: 초성과 중성만 일치하면 미션 달성
        if (my.opts.easymission && my.rule.lang === "ko") {
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
                    var missionBonus = score * 0.5 * matchCount;
                    if (my.opts.bbungtwigi) missionBonus *= 2; // 뻥튀기: 미션 보너스 2배
                    score += missionBonus;
                    my.game.mission = true;
                }
            }
        } else {
            // 기본 미션 규칙
            if (arr = text.match(new RegExp(my.game.mission, "g"))) {
                var missionBonus = score * 0.5 * arr.length;
                if (my.opts.bbungtwigi) missionBonus *= 2; // 뻥튀기: 미션 보너스 2배
                score += missionBonus;
                my.game.mission = true;
            }
        }
    }
    return Math.round(score);
};
exports.readyRobot = function (robot) {
    var my = this;
    var level = robot.level;
    var delay = ROBOT_START_DELAY[level];
    var w, text, i;

    // Strategy 3: Unknown O
    if (my.opts.unknown) {
        var gen = "";
        var len;
        var usePreferred = false;
        var preferredChar = robot.data.preferredChar;

        // Check if preferredChar matches the game language
        if (preferredChar) {
            if (my.rule.lang == "ko" && /[가-힣]/.test(preferredChar)) usePreferred = true;
            else if (my.rule.lang == "en" && /[a-zA-Z]/.test(preferredChar)) usePreferred = true;
        }

        // Random length based on level
        switch (level) {
            case 0: len = Math.floor(Math.random() * 2) + 1; break; // 1~2
            case 1: len = Math.floor(Math.random() * 3) + 2; break; // 2~4
            case 2: len = Math.floor(Math.random() * 5) + 4; break; // 4~8
            case 3: len = Math.floor(Math.random() * 9) + 8; break; // 8~16
            case 4: len = Math.floor(Math.random() * 17) + 16; break; // 16~32
            default: len = Math.floor(Math.random() * 5) + 2; break;
        }
        // nolong 모드: 최대 8글자
        if (my.opts.nolong && len > 8) {
            len = Math.floor(Math.random() * 7) + 2; // 2~8글자
        }
        // noshort 모드: 최소 9글자, level 0,1은 최대 12글자
        if (my.opts.noshort) {
            var minLen = 9;
            var maxLen = (level <= 1) ? 12 : len;
            if (len < minLen) len = minLen;
            if (len > maxLen) len = maxLen;
        }
        // no2 모드: 최소 3글자
        if (my.opts.no2 && len < 3) {
            len = 3;
        }

        if (my.game.mission) {
            // Mission O: Repeat mission char
            for (i = 0; i < len; i++) {
                gen += my.game.mission;
            }
        } else {
            // Mission X: Random chars
            for (i = 0; i < len; i++) {
                var forceChar = false;
                if (usePreferred && i === len - 1) forceChar = true;

                if (forceChar) {
                    gen += preferredChar;
                } else {
                    if (my.rule.lang == "ko") {
                        gen += String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));
                    } else {
                        gen += String.fromCharCode(97 + Math.floor(Math.random() * 26));
                    }
                }
            }
        }

        text = gen;
        delay += 400;
        after();
        return;
    }

    // Strategy 1 & 2: Mission X/O, Unknown X
    var preferredChar = robot.data.preferredChar;
    var usePreferred = false;
    if (preferredChar) {
        if (my.rule.lang == "ko" && /[가-힣]/.test(preferredChar)) usePreferred = true;
        else if (my.rule.lang == "en" && /[a-zA-Z]/.test(preferredChar)) usePreferred = true;
    }

    getAuto.call(my, null, 2).then(function (list) {
        if (list.length) {
            // Filter by mission if active (Strategy 2)
            if (my.game.mission) {
                var missionList = list.filter(function (item) {
                    return item._id.includes(my.game.mission);
                });
                if (missionList.length > 0) {
                    list = missionList;
                }
            }

            // Sort by length (Long words first)
            list.sort(function (a, b) { return b._id.length - a._id.length; });

            // Add some randomness based on level to avoid always picking the longest
            if (level < 4) {
                list = list.slice(0, Math.min(list.length, ROBOT_CANDIDATE_LIMIT[level])); // Take top N
                list = shuffle(list); // Shuffle them
            }

            // Preferred char: prioritize words ending with preferredChar
            if (usePreferred) {
                var preferredList = list.filter(function (item) {
                    return item._id[item._id.length - 1] === preferredChar;
                });
                if (preferredList.length > 0) {
                    list = preferredList.concat(list.filter(function (item) {
                        return item._id[item._id.length - 1] !== preferredChar;
                    }));
                }
            }

            pickList(list);
        } else denied();
    });

    function denied() {
        text = Const.ROBOT_DEFEAT_MESSAGES_2[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES_2.length)];
        after();
    }
    function pickList(list) {
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
        if (list) do {
            if (!(w = list.shift())) break;
        } while (w._id.length < minLen || w._id.length > maxLen || robot._done.includes(w._id));
        if (w) {
            robot.data.candidates = [w].concat(list);
            robot.data.candidateIndex = 0;
            text = w._id;
            delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
            after();
        } else denied();
    }
    function after() {
        delay += text.length * ROBOT_TYPE_COEF[level];
        robot._done.push(text);
        my.game.robotTimer = setTimeout(my.turnRobot, delay, robot, text);
    }
};
function getMission(l, opts) {
    // 미션플러스 옵션이 활성화되고 한국어 게임모드일 때
    if (opts && opts.missionplus && l === "ko") {
        // 초성 배열 (ㄱ~ㅎ, 쌍자음 제외)
        var initials = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
        // 모음 배열 (ㅏ, ㅓ, ㅔ, ㅗ, ㅜ, ㅣ)
        var vowels = ["ㅏ", "ㅓ", "ㅔ", "ㅗ", "ㅜ", "ㅣ"];

        // 무작위로 초성과 모음을 선택
        var initial = initials[Math.floor(Math.random() * initials.length)];
        var vowel = vowels[Math.floor(Math.random() * vowels.length)];

        // 유니코드로 한글 조합
        var initialIndex = Const.INIT_SOUNDS.indexOf(initial);
        var vowelIndex = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"].indexOf(vowel);

        // 종성 없이 초성+중성만 조합
        return String.fromCharCode(0xAC00 + (initialIndex * 588) + (vowelIndex * 28));
    }

    // 기본 미션 로직
    var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;

    if (!arr) return "-";
    return arr[Math.floor(Math.random() * arr.length)];
}
function getAuto(char, type) {
    // char is ignored in Free mode
    var my = this;
    var R = new Lizard.Tail();
    var bool = type == 1;

    var aqs = [];
    var aft;
    var raiser;

    if (!my.opts.injeong) aqs.push(['flag', { '$nand': Const.KOR_FLAG.INJEONG }]);
    if (my.rule.lang == "ko") {
        if (my.opts.loanword) aqs.push(['flag', { '$nand': Const.KOR_FLAG.LOANWORD }]);
        if (my.opts.strict) aqs.push(['type', Const.KOR_STRICT], ['flag', { $lte: 3 }]);
        else aqs.push(['type', Const.KOR_GROUP]);
    } else {
        aqs.push(['_id', Const.ENG_ID]);
    }

    // In Free mode, fetch words starting with a random character to distribute load and get variety.

    if (type === 2) {
        // For bot list, pick a random start char to get a variety of words
        if (my.rule.lang == "ko") {
            var ja = 44032 + 588 * Math.floor(Math.random() * 19); // Random initial consonant group
            var range = `[\\u${ja.toString(16)}-\\u${(ja + 587).toString(16)}]`;
            aqs.push(['_id', new RegExp(`^${range}`)]);
        } else {
            var char = String.fromCharCode(97 + Math.floor(Math.random() * 26));
            aqs.push(['_id', new RegExp(`^${char}`, 'i')]);
        }
    }

    // noLong/noShort/no2 길이 필터 함수
    function filterByLengthRule($md) {
        if (my.opts.nolong) {
            $md = $md.filter(function (item) {
                return item._id && item._id.length <= 8;
            });
        }
        if (my.opts.noshort) {
            $md = $md.filter(function (item) {
                return item._id && item._id.length >= 9;
            });
        }
        if (my.opts.no2) {
            $md = $md.filter(function (item) {
                return item._id && item._id.length >= 3;
            });
        }
        return $md;
    }

    switch (type) {
        case 0:
        default:
            aft = function ($md) {
                $md = filterByLengthRule($md);
                R.go($md[Math.floor(Math.random() * $md.length)]);
            };
            break;
        case 1:
            aft = function ($md) {
                $md = filterByLengthRule($md);
                R.go($md.length ? true : false);
            };
            break;
        case 2:
            aft = function ($md) {
                R.go(filterByLengthRule($md));
            };
            break;
    }

    DB.kkutu[my.rule.lang].find.apply(this, aqs).limit(bool ? 1 : 100).on(function ($md) {
        if (my.game.chain) aft($md.filter(function (item) { return !my.game.chain.includes(item); }));
        else aft($md);
    });

    return R;
}
function shuffle(arr) {
    var r = arr.slice(); // 원본 배열 복사
    for (var i = r.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = r[i];
        r[i] = r[j];
        r[j] = temp;
    }
    return r;
}
