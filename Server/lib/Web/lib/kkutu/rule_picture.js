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
 * Picture Quiz (그림퀴즈) Client-side Rule
 * Free-draw canvas version
 */

// Canvas settings
var PQ_CANVAS_W = 288;
var PQ_CANVAS_H = 180;
var PQ_BRUSH_SIZES = [3, 8, 16];
var PQ_THROTTLE_MS = 50;
var PQ_COLORS = [
    '#FFFFFF', '#C0C0C0', '#808080', '#000000',
    '#FF0000', '#FF8000', '#FFFF00', '#BFFF00',
    '#00AA00', '#00BFFF', '#0000FF', '#6c00d7',
    '#FF60B0', '#FFD180', '#804000'
];

$lib.Picture = {};

// --- Coordinate helper ---
function getCanvasPos(e) {
    var rect = $data._pqCanvasEl.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left) * (PQ_CANVAS_W / rect.width)),
        y: Math.round((e.clientY - rect.top) * (PQ_CANVAS_H / rect.height))
    };
}

// --- Drawing stroke functions (drawer only) ---
function startStroke(e) {
    var pos = getCanvasPos(e);
    var ctx = $data._pqCtx;
    var color = $data._pqEraser ? '#FFFFFF' : $data._pqColor;

    $data._pqDrawing = true;
    $data._pqCurrentStroke = { c: color, w: $data._pqBrushSize, pts: [pos] };
    $data._pqPendingPoints = [pos];

    ctx.strokeStyle = color;
    ctx.lineWidth = $data._pqBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    // Start throttled send
    $data._pqSendTimer = setInterval(flushPendingPoints, PQ_THROTTLE_MS);
}

function continueStroke(e) {
    if (!$data._pqDrawing) return;
    var pos = getCanvasPos(e);
    var ctx = $data._pqCtx;

    $data._pqCurrentStroke.pts.push(pos);
    $data._pqPendingPoints.push(pos);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function endStroke() {
    if (!$data._pqDrawing) return;
    $data._pqDrawing = false;

    // Clear throttle timer
    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }

    // Flush remaining points with end flag
    if ($data._pqPendingPoints.length > 0) {
        send('draw', {
            pts: $data._pqPendingPoints,
            c: $data._pqCurrentStroke.c,
            w: $data._pqCurrentStroke.w,
            cont: $data._pqCurrentStroke.pts.length > $data._pqPendingPoints.length,
            end: true
        });
    } else {
        // No pending points but stroke exists - send end marker
        send('draw', {
            pts: $data._pqCurrentStroke.pts.slice(-1),
            c: $data._pqCurrentStroke.c,
            w: $data._pqCurrentStroke.w,
            cont: true,
            end: true
        });
    }

    $data._pqPendingPoints = [];

    // Store completed stroke locally
    if ($data._pqCurrentStroke) {
        $data._pqStrokes.push($data._pqCurrentStroke);
        $data._pqCurrentStroke = null;
    }
}

function flushPendingPoints() {
    if (!$data._pqPendingPoints || $data._pqPendingPoints.length === 0) return;

    var isFirst = $data._pqCurrentStroke.pts.length <= $data._pqPendingPoints.length;
    send('draw', {
        pts: $data._pqPendingPoints,
        c: $data._pqCurrentStroke.c,
        w: $data._pqCurrentStroke.w,
        cont: !isFirst,
        end: false
    });
    $data._pqPendingPoints = [];
}

// --- Drawing a stroke on canvas (used by receiver and replay) ---
function drawStrokeSegment(ctx, pts, color, width, fromPt) {
    if (!ctx || !pts || pts.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    var startPt = fromPt || pts[0];
    ctx.moveTo(startPt.x, startPt.y);

    var startIdx = fromPt ? 0 : 1;
    if (pts.length === 1 && !fromPt) {
        // Single dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    for (var i = startIdx; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
}

// ============================
// Main $lib.Picture functions
// ============================

$lib.Picture.roundReady = function (data, spec) {
    clearBoard();
    $data._relay = true;
    $data._roundTime = $data.room.time * 1000;
    $data._fastTime = 10000;
    $data._pqDrawer = data.drawer;
    $data._pqTheme = data.theme;
    $data._pqAnswer = data.answer;
    $data._pqStrokes = [];
    $data._pqColor = '#000000';
    $data._pqBrushSize = PQ_BRUSH_SIZES[1]; // 8px default
    $data._pqEraser = false;
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqPassCount = data.passCount || 0;
    $data._pqGameStarted = false;
    $data._pqDrawing = false;
    $data._pqCurrentStroke = null;
    $data._pqPendingPoints = [];
    $data._pqRemoteLastPt = null;

    // Clear any existing timers
    if ($data._pqPassBtnTimer) {
        clearTimeout($data._pqPassBtnTimer);
        $data._pqPassBtnTimer = null;
    }
    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }

    $(".jjoriping,.rounds,.game-body").addClass("cw");
    $(".jjoriping").css({
        "float": "none",
        "margin": "0 auto"
    });
    $stage.game.items.hide();
    $stage.game.bb.hide();
    $stage.game.here.hide();

    $lib.Picture.drawDisplay();

    drawRound(data.round);
    if (!spec) playSound('round_start');
    clearInterval($data._tTime);

    // Reset UI states
    $(".game-user-bomb").removeClass("game-user-bomb");
    $stage.game.roundBar.css('background-color', '');
    $data._pqUrgent = false;
    stopBGM();
};

$lib.Picture.drawDisplay = function () {
    var $main = $("<div>").css({
        'display': 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'flex-start',
        'height': '100%',
        'width': '100%',
        'padding': '3px',
        'box-sizing': 'border-box'
    });

    // Header for Topic (Left) and Answer (Right)
    var $header = $("<div>").css({
        'display': 'flex',
        'justify-content': 'space-between',
        'width': '100%',
        'padding': '0 10px',
        'box-sizing': 'border-box',
        'margin-bottom': '4px'
    });

    var isDrawer = $data._pqIsDrawer;

    // Topic (Top Left)
    var themeText = L['theme_' + $data._pqTheme] || $data._pqTheme;
    var $topic = $("<div>").css({
        'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
        'font-size': '12px',
        'font-weight': 'bold',
        'text-shadow': '1px 1px 1px #000'
    }).html(L['pqTheme'] + ": " + themeText);

    $header.append($topic);

    // Answer (Top Right) - Drawer sees word, others see length
    if (isDrawer && $data._pqAnswer) {
        var $answer = $("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px',
            'font-weight': 'bold',
            'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer);
        $header.append($answer);
    } else if ($data._pqAnswer) {
        var $answer = $("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px',
            'font-weight': 'bold',
            'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer.length + (L['pqChars'] || "글자"));
        $header.append($answer);
    }

    $main.append($header);

    // Palette + brush tools (for drawer only)
    if (isDrawer) {
        var $toolRow = $("<div>").css({
            'display': 'flex',
            'align-items': 'center',
            'gap': '4px',
            'padding': '3px',
            'background-color': 'rgba(0,0,0,0.4)',
            'border-radius': '3px',
            'margin-bottom': '4px',
            'flex-wrap': 'wrap',
            'justify-content': 'center',
            'max-width': (PQ_CANVAS_W + 6) + 'px'
        });

        // Color palette
        for (var i = 0; i < PQ_COLORS.length; i++) {
            (function (color) {
                var isSelected = (!$data._pqEraser && color === $data._pqColor);
                var $color = $("<div>")
                    .attr("data-color", color)
                    .addClass("pq-color-btn")
                    .css({
                        'width': '14px',
                        'height': '14px',
                        'border-radius': '50%',
                        'background-color': color,
                        'border': isSelected ? '2px solid #FFD700' : '1px solid #555',
                        'cursor': 'pointer',
                        'box-sizing': 'border-box',
                        'flex-shrink': '0'
                    });

                $color.on('click', function () {
                    $data._pqEraser = false;
                    $data._pqColor = color;
                    $toolRow.find('.pq-color-btn').css('border', '1px solid #555');
                    $(this).css('border', '2px solid #FFD700');
                    $toolRow.find('.pq-eraser-btn').css('border', '1px solid #555');
                    $toolRow.find('.pq-custom-btn').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
                });
                $toolRow.append($color);
            })(PQ_COLORS[i]);
        }

        // Separator
        $toolRow.append($("<div>").css({
            'width': '1px', 'height': '14px',
            'background-color': 'rgba(255,255,255,0.3)',
            'margin': '0 2px', 'flex-shrink': '0'
        }));

        // Custom color picker
        var $customWrap = $("<div>").css({
            'position': 'relative',
            'width': '14px',
            'height': '14px',
            'flex-shrink': '0'
        });
        var $customPreview = $("<div>")
            .addClass("pq-color-btn pq-custom-btn")
            .css({
                'width': '14px',
                'height': '14px',
                'border-radius': '50%',
                'background': 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                'border': '1px solid #555',
                'cursor': 'pointer',
                'box-sizing': 'border-box'
            });
        var customInput = document.createElement('input');
        customInput.type = 'color';
        customInput.value = $data._pqColor;
        $(customInput).css({
            'position': 'absolute',
            'top': '0', 'left': '0',
            'width': '14px', 'height': '14px',
            'opacity': '0',
            'cursor': 'pointer'
        });
        $(customInput).on('input', function () {
            var color = this.value;
            $data._pqEraser = false;
            $data._pqColor = color;
            $toolRow.find('.pq-color-btn').css('border', '1px solid #555');
            $toolRow.find('.pq-eraser-btn').css('border', '1px solid #555');
            $customPreview.css({
                'background': color,
                'border': '2px solid #FFD700'
            });
        });
        $customWrap.append($customPreview).append(customInput);
        $toolRow.append($customWrap);

        // Eraser button
        var $eraser = $("<div>")
            .addClass("pq-eraser-btn")
            .css({
                'width': '14px',
                'height': '14px',
                'border-radius': '3px',
                'background': '#FFFFFF',
                'border': $data._pqEraser ? '2px solid #FFD700' : '1px solid #555',
                'cursor': 'pointer',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'font-size': '9px',
                'font-weight': 'bold',
                'color': '#FF4444',
                'flex-shrink': '0'
            }).html("X");

        $eraser.on('click', function () {
            $data._pqEraser = true;
            $toolRow.find('.pq-color-btn').css('border', '1px solid #555');
            $(this).css('border', '2px solid #FFD700');
        });
        $toolRow.append($eraser);

        // Separator
        $toolRow.append($("<div>").css({
            'width': '1px', 'height': '14px',
            'background-color': 'rgba(255,255,255,0.3)',
            'margin': '0 2px', 'flex-shrink': '0'
        }));

        // Brush size options
        for (var b = 0; b < PQ_BRUSH_SIZES.length; b++) {
            (function (size) {
                var dotSize = Math.max(6, size);
                var isSelected = (size === $data._pqBrushSize);
                var $brush = $("<div>")
                    .addClass("pq-brush-btn")
                    .css({
                        'width': '18px',
                        'height': '18px',
                        'display': 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'cursor': 'pointer',
                        'border': isSelected ? '2px solid #FFD700' : '1px solid #555',
                        'border-radius': '3px',
                        'background-color': 'rgba(255,255,255,0.1)',
                        'flex-shrink': '0'
                    });

                var $dot = $("<div>").css({
                    'width': dotSize + 'px',
                    'height': dotSize + 'px',
                    'border-radius': '50%',
                    'background-color': '#CCC'
                });
                $brush.append($dot);

                $brush.on('click', function () {
                    $data._pqBrushSize = size;
                    $toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
                    $(this).css('border', '2px solid #FFD700');
                });
                $toolRow.append($brush);
            })(PQ_BRUSH_SIZES[b], b);
        }

        $main.append($toolRow);
    }

    // Canvas element
    var canvas = document.createElement('canvas');
    canvas.width = PQ_CANVAS_W;
    canvas.height = PQ_CANVAS_H;
    canvas.className = 'pq-canvas';
    canvas.style.cursor = isDrawer ? 'crosshair' : 'default';

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);

    $data._pqCanvasEl = canvas;
    $data._pqCtx = ctx;

    // Drawing event handlers (drawer only)
    if (isDrawer) {
        canvas.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startStroke(e);
        });
        canvas.addEventListener('mousemove', function (e) {
            if ($data._pqDrawing) continueStroke(e);
        });
        canvas.addEventListener('mouseup', function () {
            endStroke();
        });
        canvas.addEventListener('mouseleave', function () {
            if ($data._pqDrawing) endStroke();
        });

        // Touch support
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            startStroke(e.touches[0]);
        });
        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if ($data._pqDrawing) continueStroke(e.touches[0]);
        });
        canvas.addEventListener('touchend', function (e) {
            e.preventDefault();
            endStroke();
        });
    }

    $main.append(canvas);

    // Controls (Pass & Clear) - below canvas
    if (isDrawer) {
        var $controls = $("<div>").css({
            'display': 'flex',
            'justify-content': 'center',
            'gap': '10px',
            'margin-top': '4px',
            'width': '100%'
        });

        // Pass button
        if ($data._pqPassCount < 3) {
            var passRemaining = 3 - $data._pqPassCount;
            var $passBtn = $('<button>')
                .attr('id', 'pq-pass-btn')
                .css({
                    'padding': '4px 12px',
                    'background': 'linear-gradient(135deg, #FF6B6B, #EE5A5A)',
                    'color': '#FFFFFF',
                    'border': 'none',
                    'border-radius': '4px',
                    'cursor': 'pointer',
                    'font-size': '11px',
                    'font-weight': 'bold',
                    'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
                })
                .html((L['pqPass'] || '패스') + ' (' + passRemaining + ')')
                .on('click', function () {
                    playSound('mission');
                    send('pass', {});
                    $(this).prop('disabled', true).css('opacity', '0.5');
                });
            $controls.append($passBtn);
        }

        // Clear All button
        var $clearBtn = $('<button>')
            .attr('id', 'pq-clear-btn')
            .css({
                'padding': '4px 12px',
                'background': 'linear-gradient(135deg, #FFB74D, #FFA726)',
                'color': '#FFFFFF',
                'border': 'none',
                'border-radius': '4px',
                'cursor': 'pointer',
                'font-size': '11px',
                'font-weight': 'bold',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
            })
            .html((L['pqClear'] || '모두 지우기'))
            .on('click', function () {
                showConfirm(L['pqSureClear'] || '정말 모두 지우시겠습니까?', function (res) {
                    if (res) {
                        $data._pqStrokes = [];
                        var ctx = $data._pqCtx;
                        if (ctx) {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);
                        }
                        send('clear', {});
                    }
                });
            });
        $controls.append($clearBtn);

        $main.append($controls);
    }

    $stage.game.display.empty().append($main);
};

$lib.Picture.handleDraw = function (data) {
    var ctx = $data._pqCtx;
    if (!ctx || !data.pts || data.pts.length === 0) return;

    var fromPt = null;
    if (data.cont && $data._pqRemoteLastPt) {
        fromPt = $data._pqRemoteLastPt;
    }

    drawStrokeSegment(ctx, data.pts, data.c, data.w, fromPt);
    $data._pqRemoteLastPt = data.pts[data.pts.length - 1];

    // Reset remote tracking on stroke end
    if (data.end) {
        $data._pqRemoteLastPt = null;
    }
};

$lib.Picture.handleClear = function (data) {
    $data._pqStrokes = [];
    $data._pqRemoteLastPt = null;
    var ctx = $data._pqCtx;
    if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);
    }
};

$lib.Picture.replayStrokes = function (strokes) {
    var ctx = $data._pqCtx;
    if (!ctx || !strokes) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);

    for (var s = 0; s < strokes.length; s++) {
        var stroke = strokes[s];
        drawStrokeSegment(ctx, stroke.pts, stroke.c, stroke.w, null);
    }
    $data._pqStrokes = strokes.slice();
};

$lib.Picture.turnStart = function (data) {
    // Clear previous visual effects
    $(".game-user-current").removeClass("game-user-current");
    $(".game-user-bomb").removeClass("game-user-bomb");

    $data._pqDrawer = data.drawer;
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqGameStarted = true;

    // Clear any existing pass button timer
    if ($data._pqPassBtnTimer) {
        clearTimeout($data._pqPassBtnTimer);
    }

    // Hide pass button after 5 seconds grace period
    $data._pqPassBtnTimer = setTimeout(function () {
        $('#pq-pass-btn').remove();
    }, 5000);

    clearInterval($data._tTime);
    $data._tTime = addInterval($lib.Picture.turnGoing, TICK);
    playBGM('jaqwi');
    $data._pqUrgent = false;

    $(".game-user-current").removeClass("game-user-current");
    $("#game-user-" + data.drawer).addClass("game-user-current");

    $stage.game.here.hide();
};

$lib.Picture.turnGoing = function () {
    var $rtb = $stage.game.roundBar;
    var tt;

    if (!$data.room) {
        clearInterval($data._tTime);
        return;
    }
    $data._roundTime -= TICK;

    if ($data._relay && $data._roundTime <= $data.room.time * 1000 / 6 && !$data._pqUrgent) {
        $data._pqUrgent = true;
        $rtb.css('background-color', '#E57373');
        playBGM('jaqwiF');
    }

    tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
    $rtb.width($data._roundTime / $data.room.time * 0.1 + "%").html(tt);
};

$lib.Picture.turnEnd = function (id, data) {
    var $uc = $("#game-user-" + id);
    var $sc;

    if (data.giveup) {
        $uc.addClass("game-user-bomb");
        playSound('timeout');
        return;
    }

    if (data.ok) {
        $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
        playSound('success');
        addScore(id, data.score, data.totalScore);
        updateScore(id, getScore(id)).addClass("game-user-current");
        drawObtainedScore($uc, $sc);
        if ($data._roundTime > 10000) $data._roundTime = 10000;
    } else if (data.answer) {
        if (typeof data.drawerScore === 'number') {
            var $drawerUc = $("#game-user-" + data.drawer);
            var $drawerSc = $("<div>").addClass("deltaScore");
            if (data.drawerScore < 0) {
                $drawerSc.addClass("lost").html(data.drawerScore);
                $drawerUc.addClass("game-user-bomb");
            } else {
                $drawerSc.html("+" + data.drawerScore);
            }
            drawObtainedScore($drawerUc, $drawerSc);

            var currentScore = getScore(data.drawer);
            var newScore = currentScore + data.drawerScore;
            addScore(data.drawer, data.drawerScore, newScore);
            updateScore(data.drawer, newScore);
        }

        // Show answer in YELLOW when revealed
        $stage.game.display.append(
            $("<div>").css({
                'position': 'absolute',
                'top': '50%',
                'left': '50%',
                'transform': 'translate(-50%, -50%)',
                'font-size': '18px',
                'font-weight': 'bold',
                'color': '#FFFF00',
                'text-shadow': '2px 2px 3px #000',
                'padding': '8px 15px',
                'background': 'rgba(0,0,0,0.7)',
                'border-radius': '5px',
                'z-index': '100'
            }).html(L['pqAnswer'] + ": " + data.answer)
        );
        $data._relay = false;
        clearInterval($data._tTime);
        stopBGM();
        playSound('horr');

        // Reset UI states
        $stage.game.roundBar.css('background-color', '');
        $data._pqUrgent = false;
    }

    if (data.drawerLeft) {
        notice(L['pqDrawerLeft'] || "술래가 나갔습니다");
    }
};

$lib.Picture.turnHint = function (data) {
};
