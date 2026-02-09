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
 */

// Canvas settings - smaller sizes
var PQ_CANVAS_WIDTH = 20;
var PQ_CANVAS_HEIGHT = 15;
var PQ_CELL_SIZE = 13; // smaller cells
var PQ_COLORS = [
    '#FFFFFF', '#C0C0C0', '#808080', '#000000',
    '#FF0000', '#FF8000', '#FFFF00', '#BFFF00',
    '#00AA00', '#00BFFF', '#0000FF', '#6c00d7',
    '#FF60B0', '#FFD180', '#804000'
];

$lib.Picture = {};

$lib.Picture.roundReady = function (data, spec) {
    clearBoard();
    $data._relay = true;
    $data._roundTime = $data.room.time * 1000;
    $data._fastTime = 10000;
    $data._pqDrawer = data.drawer;
    $data._pqTheme = data.theme;
    $data._pqAnswer = data.answer;
    $data._pqCanvas = {};
    $data._pqColor = '#808080';
    $data._pqIsDrawer = ($data.id === data.drawer);
    $data._pqPassCount = data.passCount || 0;
    $data._pqGameStarted = false;

    // Clear any existing pass button timer
    if ($data._pqPassBtnTimer) {
        clearTimeout($data._pqPassBtnTimer);
        $data._pqPassBtnTimer = null;
    }

    $(".jjoriping,.rounds,.game-body").addClass("cw");
    $(".jjoriping").css({
        "float": "none",
        "margin": "0 auto"
    });
    $stage.game.items.hide();
    $stage.game.bb.hide(); // Hide bb (used in Sock mode), not needed for Picture Quiz
    // 그림퀴즈는 채팅창으로 입력하므로 게임 입력창 숨김
    $stage.game.here.hide();

    $lib.Picture.drawDisplay();

    drawRound(data.round);
    if (!spec) playSound('round_start');
    clearInterval($data._tTime);

    // Reset UI states
    $(".game-user-bomb").removeClass("game-user-bomb");
    $stage.game.roundBar.css('background-color', '');
    $data._pqUrgent = false;
    stopBGM(); // Ensure clean audio state
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
        'padding': '0 20px',
        'box-sizing': 'border-box',
        'margin-bottom': '10px'
    });

    var isDrawer = $data._pqIsDrawer;
    var i, x, y;
    var canvasWidth = PQ_CANVAS_WIDTH * (PQ_CELL_SIZE + 1);

    // Topic (Top Left)
    var themeText = L['theme_' + $data._pqTheme] || $data._pqTheme;
    var $topic = $("<div>").css({
        'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
        'font-size': '12px',
        'font-weight': 'bold',
        'text-shadow': '1px 1px 1px #000'
    }).html(L['pqTheme'] + ": " + themeText);

    $header.append($topic);

    // Answer (Top Right) - Drawer only, Word only
    // Answer (Top Right) - Drawer only, Word only
    if (isDrawer && $data._pqAnswer) {
        var $answer = $("<div>").css({
            'color': ($data.room.opts.drg ? getRandomColor() : '#FFFFFF'),
            'font-size': '14px',
            'font-weight': 'bold',
            'text-shadow': '1px 1px 1px #000'
        }).html($data._pqAnswer); // Display only the word
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

    // Palette (for drawer) - smaller, above canvas
    if (isDrawer) {
        var $palette = $("<div>").css({
            'display': 'flex',
            'flex-wrap': 'wrap',
            'justify-content': 'center',
            'gap': '2px',
            'padding': '3px',
            'background-color': 'rgba(0,0,0,0.4)',
            'border-radius': '3px',
            'margin-bottom': '4px',
            'max-width': canvasWidth + 'px',
            'margin': '0 auto'
        });

        for (i = 0; i < PQ_COLORS.length; i++) {
            (function (color) {
                var $color = $("<div>")
                    .attr("data-color", color)
                    .css({
                        'width': '16px',
                        'height': '16px',
                        'border-radius': '50%',
                        'background-color': color,
                        'border': color === $data._pqColor ? '2px solid #FFD700' : '1px solid #555',
                        'cursor': 'pointer',
                        'box-sizing': 'border-box'
                    });

                $color.on('click', function () {
                    $palette.children().css('border', '1px solid #555');
                    $(this).css('border', '2px solid #FFD700');
                    $data._pqColor = color;
                });
                $palette.append($color);
            })(PQ_COLORS[i]);
        }
        $main.append($palette);

        $main.append($palette);
    }

    // Canvas - centered, smaller
    var $canvas = $("<div>").css({
        'display': 'grid',
        'grid-template-columns': 'repeat(' + PQ_CANVAS_WIDTH + ', ' + PQ_CELL_SIZE + 'px)',
        'grid-template-rows': 'repeat(' + PQ_CANVAS_HEIGHT + ', ' + PQ_CELL_SIZE + 'px)',
        'gap': '1px',
        'background-color': '#979797ff',
        'border': '2px solid #1565C0',
        'border-radius': '2px',
        'margin': '0 auto',
        'user-select': 'none', // Prevent selection
        '-webkit-user-drag': 'none', // Webkit specific
        '-webkit-user-select': 'none',
        '-moz-user-select': 'none',
        '-ms-user-select': 'none'
    });

    for (y = 0; y < PQ_CANVAS_HEIGHT; y++) {
        for (x = 0; x < PQ_CANVAS_WIDTH; x++) {
            (function (px, py) {
                var key = px + ',' + py;
                var color = $data._pqCanvas[key] || '#FFFFFF';
                var $cell = $("<div>")
                    .attr("data-x", px)
                    .attr("data-y", py)
                    .css({
                        'width': PQ_CELL_SIZE + 'px',
                        'height': PQ_CELL_SIZE + 'px',
                        'background-color': color,
                        'cursor': isDrawer ? 'crosshair' : 'default'
                    });

                if (isDrawer) {
                    $cell.on('mousedown', function (e) {
                        e.preventDefault(); // Prevent drag start
                        $lib.Picture.onCellClick(px, py);
                    });
                    $cell.on('mouseenter', function (e) {
                        if (e.buttons === 1) {
                            $lib.Picture.onCellClick(px, py);
                        }
                    });
                }
                $canvas.append($cell);
            })(x, y);
        }
    }
    $main.append($canvas);

    // Touch Support for Mobile Drawing
    if (isDrawer) {
        var lastTouchCell = null;
        var handleTouch = function (e) {
            e.preventDefault(); // Prevent scrolling
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            var rect = $canvas[0].getBoundingClientRect();
            // Account for border (2px) and grid gap (1px)
            // rect.left includes the border-box. The border is 2px. So content starts at rect.left + 2.
            // Grid cells are PQ_CELL_SIZE + 1 (gap).
            var x = Math.floor((touch.clientX - rect.left - 2) / (PQ_CELL_SIZE + 1));
            var y = Math.floor((touch.clientY - rect.top - 2) / (PQ_CELL_SIZE + 1));

            // Check bounds
            if (x >= 0 && x < PQ_CANVAS_WIDTH && y >= 0 && y < PQ_CANVAS_HEIGHT) {
                var cellKey = x + ',' + y;
                if (lastTouchCell !== cellKey) {
                    $lib.Picture.onCellClick(x, y);
                    lastTouchCell = cellKey;
                }
            }
        };

        $canvas.on('touchstart', function (e) {
            lastTouchCell = null; // Reset on new touch
            handleTouch(e);
        });
        $canvas.on('touchmove', handleTouch);
    }

    // Controls (Pass & Clear) - below canvas
    if (isDrawer) {
        var $controls = $("<div>").css({
            'display': 'flex',
            'justify-content': 'center',
            'gap': '10px',
            'margin-top': '8px',
            'width': '100%'
        });

        // Pass button
        if ($data._pqPassCount < 3) {
            var passRemaining = 3 - $data._pqPassCount;
            var $passBtn = $('<button>')
                .attr('id', 'pq-pass-btn')
                .css({
                    'padding': '6px 16px',
                    'background': 'linear-gradient(135deg, #FF6B6B, #EE5A5A)',
                    'color': '#FFFFFF',
                    'border': 'none',
                    'border-radius': '4px',
                    'cursor': 'pointer',
                    'font-size': '12px',
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
                'padding': '6px 16px',
                'background': 'linear-gradient(135deg, #FFB74D, #FFA726)',
                'color': '#FFFFFF',
                'border': 'none',
                'border-radius': '4px',
                'cursor': 'pointer',
                'font-size': '12px',
                'font-weight': 'bold',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.3)',
                'display': 'flex', // Flex to align icon/text if added later
                'align-items': 'center'
            })
            .html((L['pqClear'] || '모두 지우기'))
            .on('click', function () {
                showConfirm(L['pqSureClear'] || '정말 모두 지우시겠습니까?', function (res) {
                    if (res) {
                        // Client-side clear immediately for responsiveness
                        $data._pqCanvas = {};
                        $canvas.children().css('background-color', '#FFFFFF');
                        // Send clear to server
                        send('clear', {});
                    }
                });
            });
        $controls.append($clearBtn);

        $main.append($controls);
    }

    $stage.game.display.empty().append($main);
};

$lib.Picture.onCellClick = function (x, y) {
    if (!$data._pqIsDrawer) return;

    var key = x + ',' + y;
    var color = $data._pqColor;

    $data._pqCanvas[key] = color;
    $("div[data-x='" + x + "'][data-y='" + y + "']").css("background-color", color);

    send('draw', { x: x, y: y, color: color });
};

$lib.Picture.handleDraw = function (data) {
    var key = data.x + ',' + data.y;
    $data._pqCanvas[key] = data.color;
    $("div[data-x='" + data.x + "'][data-y='" + data.y + "']").css("background-color", data.color);
};

$lib.Picture.handleClear = function (data) {
    $data._pqCanvas = {};
    // Reset all cells to white
    // Assuming $stage.game.display contains the canvas cells
    // We can select them by attribute or just rebuild, but selecting is faster
    $("div[data-x][data-y]").css("background-color", "#FFFFFF");
};

$lib.Picture.turnStart = function (data, spec) {
    // Clear previous visual effects (like Jaqwi does)
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

    // 그림퀴즈는 채팅창으로 입력하므로 게임 입력창 숨김
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
                // Negative score (penalty)
                $drawerSc.addClass("lost").html(data.drawerScore);
                $drawerUc.addClass("game-user-bomb");
            } else {
                $drawerSc.html("+" + data.drawerScore);
            }
            drawObtainedScore($drawerUc, $drawerSc);

            // Update Drawer Total Score UI
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
        clearInterval($data._tTime); // Stop the timer
        stopBGM(); // Stop fast music if playing
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
