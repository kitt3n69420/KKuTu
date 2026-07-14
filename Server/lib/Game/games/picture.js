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
 * Picture Quiz (그림퀴즈) Game Mode
 * Drawer draws on a canvas, other players guess the word
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var File = require('fs');
var DB;
var DIC;

var CATCH_WORDS = [];
File.readFile(`${__dirname}/../../data/pquiz_catch.txt`, 'utf8', function (err, res) {
    if (err) {
        return;
    }
    CATCH_WORDS = res.split(/\r?\n/).map(function (w) { return w.trim(); }).filter(function (w) { return w.length > 0 && w[0] !== '#'; });
});

// Canvas size
var PQ_CANVAS_W = 288;
var PQ_CANVAS_H = 180;
var MAX_STROKES = 500;
var MAX_POINTS_PER_BATCH = 200;

function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
}

function buildThemeQueue(topics, rounds) {
    var pool = [];
    var remaining = rounds;

    while (remaining >= topics.length) {
        for (var i = 0; i < topics.length; i++) pool.push(topics[i]);
        remaining -= topics.length;
    }

    if (remaining > 0) {
        var rest = topics.slice();
        for (var j = 0; j < remaining; j++) {
            var idx = Math.floor(Math.random() * rest.length);
            pool.push(rest[idx]);
            rest.splice(idx, 1);
        }
    }

    for (var k = pool.length - 1; k > 0; k--) {
        var r = Math.floor(Math.random() * (k + 1));
        var tmp = pool[k]; pool[k] = pool[r]; pool[r] = tmp;
    }
    return pool;
}

exports.init = function (_DB, _DIC) {
    DB = _DB;
    DIC = _DIC;
};

exports.getTitle = function () {
    var R = new Lizard.Tail();
    var my = this;

    my.game.done = new Set();
    my.game.passCount = 0; // Reset pass count for new game
    my.game._lastPassRound = 0; // Reset last pass round tracker
    if (!my.opts.catch && my.opts.injpick && my.opts.injpick.length > 0) {
        my.game.themeQueue = buildThemeQueue(my.opts.injpick, my.round);
    }
    setTimeout(function () {
        R.go("①②③④⑤⑥⑦⑧⑨⑩");
    }, 500);
    return R;
};

exports.roundReady = function () {
    var my = this;
    var ijl = (my.opts.injpick && my.opts.injpick.length) ? my.opts.injpick.length : 0;

    clearTimeout(my.game.qTimer);
    clearTimeout(my.game._turnStartTimer);
    my.game.roundAt = null; // Reset so pass can work before turnStart
    my.game.round++;
    my.game.roundTime = my.time * 1000;

    // Reset passCount at start of each new round
    if (!my.game.passCount || my.game.round > (my.game._lastPassRound || 0)) {
        my.game.passCount = 0;
        my.game._lastPassRound = my.game.round;
    }

    if (my.game.round <= my.round) {
        // Select drawer based on active rule
        if (my.opts.order) {
            // 순서대로: seq 배열 순서대로 술래
            if (my.game.round === 1) {
                my.game.drawerIndex = 0;
            } else {
                my.game.drawerIndex = ((my.game.drawerIndex || 0) + 1) % my.game.seq.length;
            }
            my.game.drawer = my.game.seq[my.game.drawerIndex];
        } else if (my.opts.shuffle) {
            // 공정랜덤: 셔플 큐에서 한 명씩, 소진 시 재셔플
            if (my.game.round === 1 || !my.game.shuffleQueue) {
                my.game.shuffleQueue = shuffleArray(my.game.seq.slice());
                my.game.shufflePos = 0;
            } else if (my.game.shufflePos >= my.game.shuffleQueue.length) {
                my.game.shuffleQueue = shuffleArray(my.game.seq.slice());
                my.game.shufflePos = 0;
            }
            my.game.drawer = my.game.shuffleQueue[my.game.shufflePos];
            my.game.shufflePos++;
        } else {
            // 기존 동작: 첫 라운드 랜덤, 이후 정답자가 다음 술래
            if (my.game.round === 1) {
                var playerIdx = Math.floor(Math.random() * my.game.seq.length);
                my.game.drawer = my.game.seq[playerIdx];
            } else if (my.game.nextDrawer) {
                my.game.drawer = my.game.nextDrawer;
            } else {
                // No winner - pick random player EXCLUDING previous drawer
                var prevDrawer = my.game.drawer;
                if (prevDrawer && prevDrawer.id) prevDrawer = prevDrawer.id;

                var candidates = [];
                for (var i = 0; i < my.game.seq.length; i++) {
                    var pid = my.game.seq[i];
                    if (pid && pid.id) pid = pid.id;
                    if (pid !== prevDrawer) candidates.push(my.game.seq[i]);
                }
                if (candidates.length > 0) {
                    my.game.drawer = candidates[Math.floor(Math.random() * candidates.length)];
                } else {
                    my.game.drawer = my.game.seq[0];
                }
            }
        }
        my.game.nextDrawer = null;

        // Get drawer id
        var drawerId = my.game.drawer;
        if (drawerId && drawerId.id) drawerId = drawerId.id;

        // Select theme and answer
        if (my.opts.catch) {
            var catchWord = getCatchWord.call(my);
            my.game.theme = "catch";
            my.game.answer = catchWord ? { _id: catchWord } : { _id: "" };
            my.game.winner = [];
            my.game.giveup = [];
            my.game.scores = {};
            my.game.strokes = [];
            my.game._currentStroke = null;

            my.byMaster('roundReady', {
                round: my.game.round,
                theme: "catch",
                drawer: drawerId,
                answer: my.game.answer._id,
                passCount: my.game.passCount
            }, true);
            my.game._turnStartTimer = setTimeout(my.turnStart, 2400);
        } else {
            my.game.theme = (my.game.themeQueue && my.game.themeQueue.shift()) || my.opts.injpick[Math.floor(Math.random() * ijl)];
            getAnswer.call(my, my.game.theme).then(function ($ans) {
                if (!my.game.done) return;

                my.game.answer = $ans || {};
                my.game.winner = [];
                my.game.giveup = [];
                my.game.scores = {}; // Track scores for average calculation
                my.game.strokes = []; // Reset canvas strokes
                my.game._currentStroke = null;

                my.byMaster('roundReady', {
                    round: my.game.round,
                    theme: my.game.theme,
                    drawer: drawerId,
                    answer: my.game.answer._id, // Only drawer should see this (handled client-side)
                    passCount: my.game.passCount
                }, true);
                my.game._turnStartTimer = setTimeout(my.turnStart, 2400);
            });
        }
    } else {
        my.roundEnd();
    }
};

exports.turnStart = function () {
    var my = this;

    if (!my.game.answer) return;

    my.game.late = false;
    my.game.roundAt = (new Date()).getTime();
    my.game.primary = 0;
    my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);

    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;

    my.byMaster('turnStart', {
        drawer: drawerId,
        roundTime: my.game.roundTime
    }, true);
};

exports.turnEnd = function () {
    var my = this;
    var drawerScore = 0;
    var scoreCount = 0;

    // Calculate drawer score (average of guessers' scores)
    for (var id in my.game.scores) {
        drawerScore += my.game.scores[id];
        scoreCount++;
    }
    if (scoreCount > 0) {
        drawerScore = Math.round(drawerScore / scoreCount);
    } else {
        drawerScore = -10;
    }

    // Apply drawer score
    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;
    var drawerClient = DIC[drawerId] || my.game.drawer;
    if (drawerClient && drawerClient.game) {
        drawerClient.game.score += drawerScore;
    }

    my.game.late = true;
    my.byMaster('turnEnd', {
        answer: my.game.answer ? my.game.answer._id : "",
        drawerScore: drawerScore,
        drawer: drawerId
    });

    my.game._rrt = setTimeout(my.roundReady, 3000);
};

exports.submit = function (client, text) {
    var my = this;
    var score, t;
    var $ans = my.game.answer;
    var now = (new Date()).getTime();
    var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;

    // Get drawer id
    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;

    // Drawer cannot chat or guess (Modified: Drawer can chat but filtered)
    if (client.id === drawerId) {
        client.chat(maskText(text, my.game.answer ? my.game.answer._id : ""));
        return;
    }

    if (!my.game.winner) return;

    // Give up check (gg/ㅈㅈ)
    if (!my.game.giveup) my.game.giveup = [];
    var gu = my.game.giveup.indexOf(client.id) !== -1;

    // Check if already guessed or given up
    if (my.game.winner.indexOf(client.id) !== -1 || gu) {
        if (my.game.winner.indexOf(client.id) !== -1) {
            client.chat(maskText(text, my.game.answer ? my.game.answer._id : ""));
        } else {
            client.chat(text);
        }
        return;
    }

    // Handle give up
    if (play && (text === "gg" || text === "ㅈㅈ")) {
        my.game.giveup.push(client.id);
        client.publish('turnEnd', {
            target: client.id,
            giveup: true
        }, true);

        checkAllDone.call(my, drawerId);
        return;
    }

    // Check answer
    if (text === $ans._id && play) {
        t = now - my.game.roundAt;

        // First correct guesser becomes next drawer
        if (my.game.primary === 0) {
            my.game.nextDrawer = client.id;
            // Reduce time after first correct answer
            if (my.game.roundTime - t > 10000) {
                clearTimeout(my.game.qTimer);
                my.game.qTimer = setTimeout(my.turnEnd, 10000);
            }
        }

        score = my.getScore(text, t);
        // 방어 코드: score가 유효한 숫자인지 확인
        if (typeof score !== 'number' || isNaN(score)) {
            score = 0;
        }
        my.game.primary++;
        my.game.winner.push(client.id);
        my.game.scores[client.id] = score;
        // 방어 코드: client.game 및 client.game.score 확인
        if (!client.game) {
            client.game = { score: 0, bonus: 0, team: 0 };
        }
        if (typeof client.game.score !== 'number' || isNaN(client.game.score)) {
            client.game.score = 0;
        }
        client.game.score += score;

        client.publish('turnEnd', {
            target: client.id,
            ok: true,
            value: text,
            score: score,
            bonus: 0,
            totalScore: client.game.score
        }, true);
        client.invokeWordPiece(text, 0.9);

        checkAllDone.call(my, drawerId);
    } else {
        // Wrong answer - just chat it
        client.chat(text);
    }
};

function checkAllDone(drawerId) {
    var my = this;
    var allAnswered = true;
    for (var i in my.game.seq) {
        var playerId = my.game.seq[i];
        if (playerId && playerId.id) playerId = playerId.id;
        if (playerId === drawerId) continue; // Skip drawer
        if (my.game.winner.indexOf(playerId) === -1 &&
            my.game.giveup.indexOf(playerId) === -1) {
            allAnswered = false;
            break;
        }
    }
    if (allAnswered) {
        clearTimeout(my.game.qTimer);
        my.turnEnd();
    }
}

exports.onLeave = function (clientId) {
    var my = this;
    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;

    if (clientId === drawerId) {
        // Drawer left - end round immediately
        clearTimeout(my.game.qTimer);
        my.game.late = true;
        my.byMaster('turnEnd', {
            answer: my.game.answer ? my.game.answer._id : "",
            drawerLeft: true
        });
        my.game._rrt = setTimeout(my.roundReady, 3000);
    }
};

exports.getScore = function (text, delay) {
    var my = this;
    // 방어 코드: 필수 값들의 유효성 검증
    var hum = (typeof my.game.hum === 'number') ? my.game.hum : 1;
    var primary = (typeof my.game.primary === 'number') ? my.game.primary : 0;
    var roundTime = (typeof my.game.roundTime === 'number' && my.game.roundTime > 0) ? my.game.roundTime : 1;

    var rank = Math.max(1, hum - primary + 3); // 최소 1 보장
    var tr = 1 - delay / roundTime;
    if (isNaN(tr) || tr < 0) tr = 0;
    if (tr > 1) tr = 1;

    var score = 10 * Math.pow(rank, 1.4) * (0.5 + 0.5 * tr);
    var result = Math.round(score);

    // NaN 방어
    return isNaN(result) ? 0 : result;
};

// Handle stroke data from client
exports.handleDraw = function (client, msg) {
    var my = this;

    // Get drawer id
    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;

    // Only drawer can draw
    if (client.id !== drawerId) return;

    // Validate stroke data
    if (!Array.isArray(msg.pts) || msg.pts.length === 0) return;
    if (msg.pts.length > MAX_POINTS_PER_BATCH) return;
    if (typeof msg.c !== 'string' || msg.c.length > 20) return;
    if (typeof msg.w !== 'number' || msg.w < 1 || msg.w > 50) return;

    // Validate all points
    for (var i = 0; i < msg.pts.length; i++) {
        var pt = msg.pts[i];
        if (typeof pt.x !== 'number' || typeof pt.y !== 'number') return;
        if (pt.x < 0 || pt.x > PQ_CANVAS_W || pt.y < 0 || pt.y > PQ_CANVAS_H) return;
    }

    // Accumulate into current stroke or start a new one
    if (msg.end) {
        if (my.game._currentStroke) {
            for (var j = 0; j < msg.pts.length; j++) my.game._currentStroke.pts.push(msg.pts[j]);
            my.game.strokes.push(my.game._currentStroke);
            my.game._currentStroke = null;
        } else {
            my.game.strokes.push({ pts: msg.pts.slice(), c: msg.c, w: msg.w });
        }
    } else if (!my.game._currentStroke) {
        my.game._currentStroke = { pts: msg.pts.slice(), c: msg.c, w: msg.w };
    } else {
        for (var j = 0; j < msg.pts.length; j++) my.game._currentStroke.pts.push(msg.pts[j]);
    }

    // Limit total strokes to prevent memory abuse
    if (my.game.strokes.length > MAX_STROKES) {
        my.game.strokes.shift();
    }

    // Relay to all clients
    my.byMaster('draw', {
        pts: msg.pts,
        c: msg.c,
        w: msg.w,
        cont: msg.cont || false,
        end: msg.end || false
    }, true);
};

// Handle flood fill from drawer
exports.handleFill = function (client, msg) {
    var my = this;

    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;
    if (client.id !== drawerId) return;

    if (typeof msg.x !== 'number' || typeof msg.y !== 'number') return;
    if (msg.x < 0 || msg.x > PQ_CANVAS_W || msg.y < 0 || msg.y > PQ_CANVAS_H) return;
    if (typeof msg.c !== 'string' || msg.c.length > 20) return;

    my.game.strokes.push({ fill: true, x: msg.x, y: msg.y, c: msg.c });
    if (my.game.strokes.length > MAX_STROKES) my.game.strokes.shift();

    my.byMaster('fill', { x: msg.x, y: msg.y, c: msg.c }, true);
};

// Handle clear canvas from drawer
exports.handleClear = function (client) {
    var my = this;

    // Get drawer id
    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;

    // Only drawer can clear
    if (client.id !== drawerId) return;

    // Reset canvas state
    my.game.strokes = [];
    my.game._currentStroke = null;

    // Broadcast to all players
    my.byMaster('clear', {
        drawer: drawerId
    }, true);
};

// Handle pass button from drawer
exports.handlePass = function (client) {
    var my = this;
    var ijl = (my.opts.injpick && my.opts.injpick.length) ? my.opts.injpick.length : 0;

    // Get drawer id
    var drawerId = my.game.drawer;
    if (drawerId && drawerId.id) drawerId = drawerId.id;

    // Only drawer can pass
    if (client.id !== drawerId) {
        return;
    }

    // Can pass before game starts or within 5 seconds after start
    if (my.game.roundAt) {
        var now = (new Date()).getTime();
        var timeSinceStart = now - my.game.roundAt;
        if (timeSinceStart > 5000) {
            return;
        }
    }

    // Check pass count limit (3 passes per round)
    if (my.game.passCount >= 3) {
        return;
    }

    // Increment pass count
    my.game.passCount++;

    // Reset round state for fresh start
    my.game.roundAt = null; // Allow pass button for new drawer
    my.game.roundTime = my.time * 1000; // Reset to full round time

    // Cancel pending turnStart
    clearTimeout(my.game._turnStartTimer);
    clearTimeout(my.game.qTimer);

    // Select new drawer based on active rule
    if (my.opts.order) {
        // 순서대로: 다음 인덱스로 이동
        my.game.drawerIndex = ((my.game.drawerIndex || 0) + 1) % my.game.seq.length;
        my.game.drawer = my.game.seq[my.game.drawerIndex];
    } else if (my.opts.shuffle) {
        // 공정랜덤: 큐에서 다음 사람 꺼냄, 소진 시 재셔플
        if (!my.game.shuffleQueue || my.game.shufflePos >= my.game.shuffleQueue.length) {
            my.game.shuffleQueue = shuffleArray(my.game.seq.slice());
            my.game.shufflePos = 0;
        }
        my.game.drawer = my.game.shuffleQueue[my.game.shufflePos];
        my.game.shufflePos++;
    } else {
        // 기존: 현재 술래 제외 랜덤
        var candidates = [];
        for (var i = 0; i < my.game.seq.length; i++) {
            var pid = my.game.seq[i];
            if (pid && pid.id) pid = pid.id;
            if (pid !== drawerId) candidates.push(my.game.seq[i]);
        }
        if (candidates.length > 0) {
            my.game.drawer = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            my.game.drawer = my.game.seq[0];
        }
    }

    var newDrawerId = my.game.drawer;
    if (newDrawerId && newDrawerId.id) newDrawerId = newDrawerId.id;

    // Select new theme and answer
    if (my.opts.catch) {
        var catchWord = getCatchWord.call(my);
        my.game.theme = "catch";
        my.game.answer = catchWord ? { _id: catchWord } : { _id: "" };
        my.game.winner = [];
        my.game.giveup = [];
        my.game.scores = {};
        my.game.strokes = [];
        my.game._currentStroke = null;

        my.byMaster('roundReady', {
            round: my.game.round,
            theme: "catch",
            drawer: newDrawerId,
            answer: my.game.answer._id,
            passCount: my.game.passCount,
            passed: true
        }, true);
        my.game._turnStartTimer = setTimeout(my.turnStart, 2400);
    } else {
        my.game.theme = (my.game.themeQueue && my.game.themeQueue.shift()) || my.opts.injpick[Math.floor(Math.random() * ijl)];
        getAnswer.call(my, my.game.theme).then(function ($ans) {
            if (!my.game.done) return;

            my.game.answer = $ans || {};
            my.game.winner = [];
            my.game.giveup = [];
            my.game.scores = {};
            my.game.strokes = []; // Reset canvas strokes
            my.game._currentStroke = null;

            my.byMaster('roundReady', {
                round: my.game.round,
                theme: my.game.theme,
                drawer: newDrawerId,
                answer: my.game.answer._id,
                passCount: my.game.passCount,
                passed: true // Flag to indicate this is a pass
            }, true);
            my.game._turnStartTimer = setTimeout(my.turnStart, 2400);
        });
    }
};

function getCatchWord() {
    var my = this;
    if (!CATCH_WORDS.length) return null;

    var available = CATCH_WORDS.filter(function (w) {
        return !my.game.done.has(w);
    });
    if (!available.length) available = CATCH_WORDS.slice();

    var word = available[Math.floor(Math.random() * available.length)];
    my.game.done.add(word);
    return word;
}

function maskText(text, answer) {
    if (!answer || answer.length === 0) return text;

    var mask = new Array(text.length).fill(false);
    var found = false;

    for (var i = 0; i < text.length; i++) {
        for (var len = 2; i + len <= text.length; len++) {
            var sub = text.substr(i, len);
            if (answer.includes(sub)) {
                for (var k = 0; k < len; k++) mask[i + k] = true;
                found = true;
            }
        }
    }

    if (found) {
        var censored = "";
        for (var j = 0; j < text.length; j++) {
            censored += mask[j] ? "○" : text[j];
        }
        return censored;
    } else {
        return text;
    }
}

function getAnswer(theme) {
    var my = this;
    var R = new Lizard.Tail();
    var args = [['_id', { $nin: Array.from(my.game.done) }]];
    var lang = my.rule.lang;

    args.push(['theme', new RegExp("(,|^)(" + theme + ")(,|$)")]);
    args.push(['type', Const.KOR_GROUP]);
    args.push(['flag', { $lte: 7 }]);

    DB.kkutu[lang].find.apply(my, args).on(function ($res) {
        if (!my.game.done) return R.go(null);
        if (!$res) return R.go(null);
        var pick;
        var len = $res.length;

        if (!len) return R.go(null);
        do {
            pick = Math.floor(Math.random() * len);
            var word = $res[pick];
            var isValid = true;
            var wlen = word._id.length;

            // Filter: 2-10 character words
            if (wlen < 2 || wlen > 10) isValid = false;
            if (word.type !== "INJEONG" && word.mean && word.mean.length < 1) isValid = false;

            if (isValid) {
                my.game.done.add(word._id);
                return R.go(word);
            }
            $res.splice(pick, 1);
            len--;
        } while (len > 0);
        R.go(null);
    });
    return R;
}
