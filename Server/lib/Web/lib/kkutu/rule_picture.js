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
    '#FF0000', '#FF8000', '#FFFF00', '#8df349',
    '#00AA00', '#00BFFF', '#0000FF', '#6c00d7',
    '#FF60B0', '#FFD180', '#804000'
];

$lib.Picture = {};

// --- Helpers ---
function pqHexToRgb(hex) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
}

function getCanvasPos(e) {
    var rect = $data._pqCanvasEl.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left) * (PQ_CANVAS_W / rect.width)),
        y: Math.round((e.clientY - rect.top) * (PQ_CANVAS_H / rect.height))
    };
}

// Pixel-perfect filled circle using scanline (no AA)
function pqFillCircle(ctx, cx, cy, r) {
    if (r === 0) { ctx.fillRect(cx, cy, 1, 1); return; }
    var r2 = r * r;
    for (var ry = -r; ry <= r; ry++) {
        var rx = Math.floor(Math.sqrt(r2 - ry * ry));
        ctx.fillRect(cx - rx, cy + ry, 2 * rx + 1, 1);
    }
}

// Pixel-perfect round brush stroke: stamps circles along the line (no AA)
function pqDrawPixelLine(ctx, x0, y0, x1, y1, color, width) {
    ctx.fillStyle = color;
    var r = Math.floor(width / 2);
    var dx = x1 - x0, dy = y1 - y0;
    var steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        pqFillCircle(ctx, Math.round(x0 + t * dx), Math.round(y0 + t * dy), r);
    }
}

function pqFloodFill(ctx, startX, startY, fillColor) {
    if (startX < 0 || startX >= PQ_CANVAS_W || startY < 0 || startY >= PQ_CANVAS_H) return;
    startX = Math.floor(startX);
    startY = Math.floor(startY);
    var imgData = ctx.getImageData(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);
    var data = imgData.data;
    var fc = pqHexToRgb(fillColor);

    var baseIdx = (startY * PQ_CANVAS_W + startX) * 4;
    var tr = data[baseIdx], tg = data[baseIdx + 1], tb = data[baseIdx + 2];

    // No-op if same color (or very close, preventing infinite loops with tolerance)
    if (Math.abs(tr - fc.r) < 2 && Math.abs(tg - fc.g) < 2 && Math.abs(tb - fc.b) < 2) return;

    var queue = [startX, startY];
    // Visited array to prevent duplicate processing
    var visited = new Uint8Array(PQ_CANVAS_W * PQ_CANVAS_H);
    visited[startY * PQ_CANVAS_W + startX] = 1;

    while (queue.length > 0) {
        var py = queue.pop();
        var px = queue.pop();
        var idx = (py * PQ_CANVAS_W + px) * 4;

        data[idx] = fc.r;
        data[idx + 1] = fc.g;
        data[idx + 2] = fc.b;
        data[idx + 3] = 255;

        // check 4 neighbors
        var neighbors = [
            [px - 1, py],
            [px + 1, py],
            [px, py - 1],
            [px, py + 1]
        ];

        for (var i = 0; i < 4; i++) {
            var nx = neighbors[i][0];
            var ny = neighbors[i][1];

            if (nx >= 0 && nx < PQ_CANVAS_W && ny >= 0 && ny < PQ_CANVAS_H) {
                var nPos = ny * PQ_CANVAS_W + nx;
                if (!visited[nPos]) {
                    var ni = nPos * 4;
                    // Tolerance for rendering and anti-aliasing color artifacts
                    if (Math.abs(data[ni] - tr) <= 5 && Math.abs(data[ni + 1] - tg) <= 5 && Math.abs(data[ni + 2] - tb) <= 5) {
                        visited[nPos] = 1;
                        queue.push(nx, ny);
                    }
                }
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

// Draw a stroke segment with pixel-perfect lines (no AA)
function drawStrokeSegment(ctx, pts, color, width, fromPt) {
    if (!ctx || !pts || pts.length === 0) return;

    if (fromPt) {
        pqDrawPixelLine(ctx, fromPt.x, fromPt.y, pts[0].x, pts[0].y, color, width);
        for (var i = 1; i < pts.length; i++) {
            pqDrawPixelLine(ctx, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, color, width);
        }
    } else {
        // Single dot for first point
        pqDrawPixelLine(ctx, pts[0].x, pts[0].y, pts[0].x, pts[0].y, color, width);
        for (var i = 1; i < pts.length; i++) {
            pqDrawPixelLine(ctx, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, color, width);
        }
    }
}

// Selects a color or eraser/fill and updates tool row visuals
function pqSelectTool(toolRow, type, value) {
    if (type === 'color' || type === 'custom') {
        // Deselect previous colors
        toolRow.find('.pq-color-btn').css('border', '1px solid #555');
        toolRow.find('.pq-custom-btn').css('border', '1px solid #555');

        $data._pqEraser = false;
        // Keep fill mode if we were in it, otherwise default to brush
        if ($data._pqMode !== 'fill') $data._pqMode = 'brush';
        $data._pqColor = value;

        if (type === 'color') {
            toolRow.find('.pq-color-btn[data-color="' + value + '"]').css('border', '2px solid #FFD700');
            toolRow.find('.pq-custom-btn').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
        } else if (type === 'custom') {
            toolRow.find('.pq-custom-btn').css({ 'background': value, 'border': '2px solid #FFD700' });
        }

        // Update tool highlights since eraser is deactivated
        toolRow.find('.pq-eraser-btn').css('border', '1px solid #555');
        if ($data._pqMode === 'fill') {
            toolRow.find('.pq-fill-btn').css('border', '2px solid #FFD700');
            toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
        } else {
            toolRow.find('.pq-fill-btn').css('border', '1px solid #555');
            toolRow.find('.pq-brush-btn').each(function () {
                if ($(this).attr('data-size') == $data._pqBrushSize) $(this).css('border', '2px solid #FFD700');
                else $(this).css('border', '1px solid #555');
            });
        }
    } else {
        // A tool was selected
        toolRow.find('.pq-eraser-btn').css('border', '1px solid #555');
        toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
        toolRow.find('.pq-fill-btn').css('border', '1px solid #555');

        if (type === 'eraser') {
            $data._pqEraser = true;
            $data._pqMode = 'brush';
            toolRow.find('.pq-eraser-btn').css('border', '2px solid #FFD700');
            // Remove color highlights to indicate erasing
            toolRow.find('.pq-color-btn').css('border', '1px solid #555');
            toolRow.find('.pq-custom-btn').css('border', '1px solid #555').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
        } else {
            $data._pqEraser = false;

            if (type === 'fill') {
                $data._pqMode = 'fill';
                toolRow.find('.pq-fill-btn').css('border', '2px solid #FFD700');
            } else if (type === 'brush') {
                $data._pqMode = 'brush';
                $data._pqBrushSize = value;
                // Highlight will be handled by the caller or we can do it here
            }

            // Restore active color highlight
            toolRow.find('.pq-color-btn').css('border', '1px solid #555');
            var $preset = toolRow.find('.pq-color-btn[data-color="' + $data._pqColor + '"]');
            if ($preset.length) {
                $preset.css('border', '2px solid #FFD700');
                toolRow.find('.pq-custom-btn').css('border', '1px solid #555').css('background', 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)');
            } else {
                toolRow.find('.pq-custom-btn').css({ 'background': $data._pqColor, 'border': '2px solid #FFD700' });
            }
        }
    }
}

// --- Drawing stroke functions (drawer only) ---
function startStroke(e) {
    // 기존 스트로크가 진행 중이면 먼저 종료
    if ($data._pqDrawing) endStroke();

    var pos = getCanvasPos(e);
    var color = $data._pqEraser ? '#FFFFFF' : $data._pqColor;

    if ($data._pqMode === 'fill') {
        pqFloodFill($data._pqCtx, pos.x, pos.y, color);
        send('fill', { x: pos.x, y: pos.y, c: color });
        $data._pqStrokes.push({ fill: true, x: pos.x, y: pos.y, c: color });
        return;
    }

    $data._pqDrawing = true;
    $data._pqCurrentStroke = { c: color, w: $data._pqBrushSize, pts: [pos] };
    $data._pqPendingPoints = [pos];
    $data._pqLastDrawnPt = pos;

    // Draw single dot at start
    pqDrawPixelLine($data._pqCtx, pos.x, pos.y, pos.x, pos.y, color, $data._pqBrushSize);

    // 기존 타이머를 반드시 먼저 clear한 뒤 새로 시작 (누수 방지)
    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }
    $data._pqSendTimer = setInterval(flushPendingPoints, PQ_THROTTLE_MS);
}

function continueStroke(e) {
    if (!$data._pqDrawing) return;
    var pos = getCanvasPos(e);
    var stroke = $data._pqCurrentStroke;

    pqDrawPixelLine($data._pqCtx, $data._pqLastDrawnPt.x, $data._pqLastDrawnPt.y, pos.x, pos.y, stroke.c, stroke.w);
    $data._pqLastDrawnPt = pos;

    stroke.pts.push(pos);
    $data._pqPendingPoints.push(pos);
}

function endStroke() {
    if (!$data._pqDrawing) return;
    $data._pqDrawing = false;

    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }

    if ($data._pqPendingPoints.length > 0) {
        send('draw', {
            pts: $data._pqPendingPoints,
            c: $data._pqCurrentStroke.c,
            w: $data._pqCurrentStroke.w,
            cont: $data._pqCurrentStroke.pts.length > $data._pqPendingPoints.length,
            end: true
        });
    } else {
        send('draw', {
            pts: $data._pqCurrentStroke.pts.slice(-1),
            c: $data._pqCurrentStroke.c,
            w: $data._pqCurrentStroke.w,
            cont: true,
            end: true
        });
    }

    $data._pqPendingPoints = [];

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
    $data._pqMode = 'brush';
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqPassCount = data.passCount || 0;
    $data._pqGameStarted = false;
    $data._pqDrawing = false;
    $data._pqCurrentStroke = null;
    $data._pqPendingPoints = [];
    $data._pqLastDrawnPt = null;
    $data._pqRemoteLastPt = null;

    if ($data._pqPassBtnTimer) {
        clearTimeout($data._pqPassBtnTimer);
        $data._pqPassBtnTimer = null;
    }
    if ($data._pqSendTimer) {
        clearInterval($data._pqSendTimer);
        $data._pqSendTimer = null;
    }

    $(".jjoriping,.rounds,.game-body").addClass("cw");
    $(".jjoriping").css({ "float": "none", "margin": "0 auto" });
    $stage.game.items.hide();
    $stage.game.bb.hide();
    $stage.game.here.hide();

    $lib.Picture.drawDisplay();

    drawRound(data.round);
    if (!spec) playSound('round_start');
    clearInterval($data._tTime);

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

    // Header
    var $header = $("<div>").css({
        'display': 'flex',
        'justify-content': 'space-between',
        'width': '100%',
        'padding': '0 10px',
        'box-sizing': 'border-box',
        'margin-bottom': '4px'
    });

    var isDrawer = $data._pqIsDrawer;

    var themeText = L['theme_' + $data._pqTheme] || $data._pqTheme;
    var $topic = $("<div>").css({
        'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
        'font-size': '12px',
        'font-weight': 'bold',
        'text-shadow': '1px 1px 1px #000'
    }).html(L['pqTheme'] + ": " + themeText);
    $header.append($topic);

    if (isDrawer && $data._pqAnswer) {
        $header.append($("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px', 'font-weight': 'bold', 'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer));
    } else if ($data._pqAnswer) {
        $header.append($("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px', 'font-weight': 'bold', 'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer.replace(/\s/g, '').length + (L['pqChars'] || "글자")));
    }
    $main.append($header);

    // Palette + tools (drawer only)
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

        // Preset color palette
        for (var i = 0; i < PQ_COLORS.length; i++) {
            (function (color) {
                var isSelected = (!$data._pqEraser && $data._pqMode === 'brush' && color === $data._pqColor);
                var $color = $("<div>")
                    .attr("data-color", color)
                    .addClass("pq-color-btn")
                    .css({
                        'width': '14px', 'height': '14px',
                        'border-radius': '50%',
                        'background-color': color,
                        'border': isSelected ? '2px solid #FFD700' : '1px solid #555',
                        'cursor': 'pointer',
                        'box-sizing': 'border-box',
                        'flex-shrink': '0'
                    });
                $color.on('click', function () {
                    pqSelectTool($toolRow, 'color', color);
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
        var $customWrap = $("<div>").css({ 'position': 'relative', 'width': '14px', 'height': '14px', 'flex-shrink': '0' });
        var $customPreview = $("<div>")
            .addClass("pq-color-btn pq-custom-btn")
            .css({
                'width': '14px', 'height': '14px',
                'border-radius': '50%',
                'background': 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                'border': '1px solid #555',
                'cursor': 'pointer',
                'box-sizing': 'border-box'
            });
        var customInput = document.createElement('input');
        customInput.type = 'color';
        customInput.value = $data._pqColor;
        $(customInput).css({ 'position': 'absolute', 'top': '0', 'left': '0', 'width': '14px', 'height': '14px', 'opacity': '0', 'cursor': 'pointer' });
        $(customInput).on('input', function () {
            pqSelectTool($toolRow, 'custom', this.value);
        });
        $customWrap.append($customPreview).append(customInput);
        $toolRow.append($customWrap);

        // Eraser button
        var $eraser = $("<div>")
            .addClass("pq-eraser-btn")
            .css({
                'width': '18px', 'height': '18px',
                'border-radius': '3px',
                'background': 'rgba(255,255,255,0.1)',
                'border': $data._pqEraser ? '2px solid #FFD700' : '1px solid #555',
                'cursor': 'pointer',
                'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
                'font-size': '11px', 'color': '#CCC',
                'flex-shrink': '0'
            }).html('<i class="fa fa-eraser"></i>');
        $eraser.on('click', function () {
            pqSelectTool($toolRow, 'eraser');
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
                var isSelected = ($data._pqMode === 'brush' && !$data._pqEraser && size === $data._pqBrushSize);
                var $brush = $("<div>")
                    .addClass("pq-brush-btn")
                    .attr('data-size', size)
                    .css({
                        'width': '18px', 'height': '18px',
                        'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
                        'cursor': 'pointer',
                        'border': isSelected ? '2px solid #FFD700' : '1px solid #555',
                        'border-radius': '3px',
                        'background-color': 'rgba(255,255,255,0.1)',
                        'flex-shrink': '0'
                    });
                $brush.append($("<div>").css({
                    'width': dotSize + 'px', 'height': dotSize + 'px',
                    'border-radius': '50%', 'background-color': '#CCC'
                }));
                $brush.on('click', function () {
                    pqSelectTool($toolRow, 'brush', size);
                    $toolRow.find('.pq-brush-btn').css('border', '1px solid #555');
                    $(this).css('border', '2px solid #FFD700');
                });
                $toolRow.append($brush);
            })(PQ_BRUSH_SIZES[b]);
        }

        // Paint bucket button
        var $fillBtn = $("<div>")
            .addClass("pq-fill-btn")
            .css({
                'width': '18px', 'height': '18px',
                'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
                'cursor': 'pointer',
                'border': ($data._pqMode === 'fill') ? '2px solid #FFD700' : '1px solid #555',
                'border-radius': '3px',
                'background-color': 'rgba(255,255,255,0.1)',
                'flex-shrink': '0',
                'font-size': '11px', 'color': '#CCC'
            }).html('<i class="fa fa-tint"></i>');
        $fillBtn.on('click', function () {
            pqSelectTool($toolRow, 'fill');
        });
        $toolRow.append($fillBtn);

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

    if (isDrawer) {
        canvas.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startStroke(e);
        });
        canvas.addEventListener('mousemove', function (e) {
            if ($data._pqDrawing) continueStroke(e);
        });
        canvas.addEventListener('mouseup', function () { endStroke(); });
        canvas.addEventListener('mouseleave', function () { if ($data._pqDrawing) endStroke(); });

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

    // Controls (Pass & Clear)
    if (isDrawer) {
        var $controls = $("<div>").css({
            'display': 'flex', 'justify-content': 'center',
            'gap': '10px', 'margin-top': '4px', 'width': '100%'
        });

        if ($data._pqPassCount < 3) {
            var passRemaining = 3 - $data._pqPassCount;
            $controls.append(
                $('<button>').attr('id', 'pq-pass-btn').css({
                    'padding': '4px 12px',
                    'background': 'linear-gradient(135deg, #FF6B6B, #EE5A5A)',
                    'color': '#FFFFFF', 'border': 'none', 'border-radius': '4px',
                    'cursor': 'pointer', 'font-size': '11px', 'font-weight': 'bold',
                    'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
                })
                    .html((L['pqPass'] || '패스') + ' (' + passRemaining + ')')
                    .on('click', function () {
                        playSound('mission');
                        send('pass', {});
                        $(this).prop('disabled', true).css('opacity', '0.5');
                    })
            );
        }

        $controls.append(
            $('<button>').attr('id', 'pq-clear-btn').css({
                'padding': '4px 12px',
                'background': 'linear-gradient(135deg, #FFB74D, #FFA726)',
                'color': '#FFFFFF', 'border': 'none', 'border-radius': '4px',
                'cursor': 'pointer', 'font-size': '11px', 'font-weight': 'bold',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.3)'
            })
                .html((L['pqClear'] || '모두 지우기'))
                .on('click', function () {
                    showConfirm(L['pqSureClear'] || '정말 모두 지우시겠습니까?', function (res) {
                        if (res) {
                            $data._pqStrokes = [];
                            var c = $data._pqCtx;
                            if (c) { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H); }
                            send('clear', {});
                        }
                    });
                })
        );

        $main.append($controls);
    }

    $stage.game.display.empty().append($main);
};

$lib.Picture.handleDraw = function (data) {
    var ctx = $data._pqCtx;
    if (!ctx || !data.pts || data.pts.length === 0) return;

    var fromPt = (data.cont && $data._pqRemoteLastPt) ? $data._pqRemoteLastPt : null;
    drawStrokeSegment(ctx, data.pts, data.c, data.w, fromPt);
    $data._pqRemoteLastPt = data.pts[data.pts.length - 1];
    if (data.end) $data._pqRemoteLastPt = null;
};

$lib.Picture.handleFill = function (data) {
    var ctx = $data._pqCtx;
    if (!ctx) return;
    pqFloodFill(ctx, data.x, data.y, data.c);
};

$lib.Picture.handleClear = function () {
    $data._pqStrokes = [];
    $data._pqRemoteLastPt = null;
    var ctx = $data._pqCtx;
    if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H); }
};

$lib.Picture.replayStrokes = function (strokes) {
    var ctx = $data._pqCtx;
    if (!ctx || !strokes) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PQ_CANVAS_W, PQ_CANVAS_H);

    for (var s = 0; s < strokes.length; s++) {
        var stroke = strokes[s];
        if (stroke.fill) {
            pqFloodFill(ctx, stroke.x, stroke.y, stroke.c);
        } else {
            drawStrokeSegment(ctx, stroke.pts, stroke.c, stroke.w, null);
        }
    }
    $data._pqStrokes = strokes.slice();
};

$lib.Picture.turnStart = function (data) {
    $(".game-user-current").removeClass("game-user-current");
    $(".game-user-bomb").removeClass("game-user-bomb");

    $data._pqDrawer = data.drawer;
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqGameStarted = true;

    if ($data._pqPassBtnTimer) clearTimeout($data._pqPassBtnTimer);
    $data._pqPassBtnTimer = setTimeout(function () { $('#pq-pass-btn').remove(); }, 5000);

    clearInterval($data._tTime);
    $data._tTime = addInterval($lib.Picture.turnGoing, TICK);
    playBGM('jaqwi');
    $data._pqUrgent = false;

    $("#game-user-" + data.drawer).addClass("game-user-current");
    $stage.game.here.hide();
};

$lib.Picture.turnGoing = function () {
    var $rtb = $stage.game.roundBar;
    if (!$data.room) { clearInterval($data._tTime); return; }
    $data._roundTime -= TICK;

    if ($data._relay && $data._roundTime <= $data.room.time * 1000 / 6 && !$data._pqUrgent) {
        $data._pqUrgent = true;
        $rtb.css('background-color', '#E57373');
        playBGM('jaqwiF');
    }

    var tt = $data._spectate ? L['stat_spectate'] : (Math.round($data._roundTime / 100) / 10).toFixed(1) + L['SECOND'];
    $rtb.width($data._roundTime / $data.room.time * 0.1 + "%").html(tt);
};

$lib.Picture.turnEnd = function (id, data) {
    var $uc = $("#game-user-" + id);

    if (data.giveup) {
        $uc.addClass("game-user-bomb");
        playSound('timeout');
        return;
    }

    if (data.ok) {
        var $sc = $("<div>").addClass("deltaScore").html("+" + data.score);
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
            var newScore = getScore(data.drawer) + data.drawerScore;
            addScore(data.drawer, data.drawerScore, newScore);
            updateScore(data.drawer, newScore);
        }

        $stage.game.display.append(
            $("<div>").css({
                'position': 'absolute', 'top': '50%', 'left': '50%',
                'transform': 'translate(-50%, -50%)',
                'font-size': '18px', 'font-weight': 'bold',
                'color': '#FFFF00', 'text-shadow': '2px 2px 3px #000',
                'padding': '8px 15px', 'background': 'rgba(0,0,0,0.7)',
                'border-radius': '5px', 'z-index': '100'
            }).html(L['pqAnswer'] + ": " + data.answer)
        );
        $data._relay = false;
        clearInterval($data._tTime);
        if ($data._pqPassBtnTimer) {
            clearTimeout($data._pqPassBtnTimer);
            $data._pqPassBtnTimer = null;
        }
        if ($data._pqSendTimer) {
            clearInterval($data._pqSendTimer);
            $data._pqSendTimer = null;
        }
        $data._pqDrawing = false;
        stopBGM();
        playSound('horr');
        $stage.game.roundBar.css('background-color', '');
        $data._pqUrgent = false;
    }

    if (data.drawerLeft) notice(L['pqDrawerLeft'] || "술래가 나갔습니다");
};

$lib.Picture.turnHint = function () {
};
