/*
 * KKuTu Interactive Word Adder
 *
 * Usage: node add_word_interactive.js
 *
 * 단어를 대화형으로 하나씩 추가합니다.
 * - 품사: INJEONG (어인정)
 * - 플래그: 10 (INJEONG=2 | SATURI=8 -> 기본값 2, 여기서는 flag=10)
 * - 새 단어인 경우 kkutu_stats_ko도 함께 업데이트합니다.
 */

'use strict';

var readline = require('readline');
var path = require('path');

module.paths.push(path.join(__dirname, '../Server/lib/node_modules'));
module.paths.push(path.join(__dirname, '../Server/node_modules'));

var pg;
try {
    pg = require('pg');
} catch (e) {
    console.error("Error: 'pg' module not found.");
    process.exit(1);
}

var GLOBAL;
try {
    GLOBAL = require('../Server/lib/sub/global.json');
} catch (e) {
    console.error("Error loading global.json:", e.message);
    process.exit(1);
}

var CONST;
try {
    CONST = require('../Server/lib/const.js');
} catch (e) {
    console.error("Error loading const.js:", e.message);
    process.exit(1);
}

var config = {
    user: GLOBAL.PG_USER || 'postgres',
    password: GLOBAL.PG_PASSWORD,
    host: GLOBAL.PG_HOST || 'localhost',
    port: GLOBAL.PG_PORT || 5432,
    database: GLOBAL.PG_DATABASE || 'kkutu'
};

var pool = new pg.Pool(config);

// flag=10 : INJEONG(2) | SATURI(8)
// (요청사항: 플래그 10)
var WORD_FLAG = 10;
var WORD_TYPE = 'INJEONG';

// KOR_FLAG 참조
// LOANWORD: 1, INJEONG: 2, SPACED: 4, SATURI: 8, OLD: 16, MUNHWA: 32
var isInjeong = !!(WORD_FLAG & CONST.KOR_FLAG.INJEONG); // true (flag&2)
var isLoan    = !!(WORD_FLAG & CONST.KOR_FLAG.LOANWORD); // false

// KOR_STRICT: /(^|,)(1|INJEONG)($|,)/
// KOR_GROUP: includes "INJEONG"
var isStrict = !!(WORD_TYPE.match(CONST.KOR_STRICT) && WORD_FLAG < 4); // flag=10 >= 4 → false
var isGroup  = !!(WORD_TYPE.match(CONST.KOR_GROUP));  // true

// =============================================
// 뜻 포맷: add_multi.js 방식 참고
// "\uFF021\uFF02" = ｢1｣ 형태
// =============================================
function buildMean(theme) {
    // add_multi.js 방식: "\uFF021\uFF02" (기본 뜻 없음)
    // 여기서는 테마 정보를 포함한 뜻으로 구성
    return '\uFF021\uFF02';
}

// =============================================
// kkutu_stats_ko 단일 단어 업데이트 (증분)
// stats_helper.js의 로직을 단일 단어에 적용
// =============================================
async function updateStatsKoForWord(client, word) {
    if (word.length <= 1) return;

    var startChar = word.charAt(0);
    var endChar   = word.charAt(word.length - 1);
    var len       = word.length;

    // 16개 state에 대해 이 단어가 유효한지 판단
    // bit0=noInjeong(1), bit1=strict(2), bit2=noLoan(4), bit3=allpos(8)
    var validStates = [];
    for (var state = 0; state < 16; state++) {
        var reqNoInjeong = (state & 1);
        var reqStrict    = (state & 2);
        var reqNoLoan    = (state & 4);
        var reqAllpos    = (state & 8);

        var valid = true;
        if (reqNoInjeong && isInjeong) valid = false;
        if (reqAllpos) {
            // allpos: 모든 단어 허용
        } else if (reqStrict) {
            if (!isStrict) valid = false;
        } else {
            if (!isGroup) valid = false;
        }
        if (reqNoLoan && isLoan) valid = false;

        if (valid) validStates.push(state);
    }

    if (validStates.length === 0) return;

    // start/end 각 글자에 대해 증분 UPDATE
    var charsToUpdate = [
        { char: startChar, kind: 'start' },
        { char: endChar,   kind: 'end' }
    ];

    // 두 글자가 같으면 중복 방지
    if (startChar === endChar) {
        charsToUpdate = [{ char: startChar, kind: 'both' }];
    }

    for (var entry of charsToUpdate) {
        var c = entry.char;
        var kind = entry.kind;

        // 현재 행이 있는지 확인
        var res = await client.query(
            'SELECT _id FROM kkutu_stats_ko WHERE _id = $1', [c]
        );

        if (res.rowCount === 0) {
            // 없으면 0으로 INSERT
            // 컬럼 목록 동적 생성 (stats_helper.js와 동일 스키마)
            var cols = ['_id'];
            var vals = [c];
            var placeholders = ['$1'];
            var idx = 2;
            for (var i = 0; i < 16; i++) {
                ['start2','start3','start4','startshort','startall',
                 'end2','end3','end4','endshort','endall'].forEach(function(col) {
                    cols.push(col + '_' + i);
                    vals.push(0);
                    placeholders.push('$' + idx);
                    idx++;
                });
            }
            await client.query(
                'INSERT INTO kkutu_stats_ko (' + cols.join(',') + ') VALUES (' + placeholders.join(',') + ') ON CONFLICT (_id) DO NOTHING',
                vals
            );
        }

        // 증분 UPDATE: 유효한 state에 대해 해당 컬럼들을 +1
        var setParts = [];
        for (var si = 0; si < validStates.length; si++) {
            var s = validStates[si];
            if (kind === 'start' || kind === 'both') {
                setParts.push('startall_' + s + ' = startall_' + s + ' + 1');
                if (len === 2) setParts.push('start2_' + s + ' = start2_' + s + ' + 1');
                if (len === 3) setParts.push('start3_' + s + ' = start3_' + s + ' + 1');
                if (len === 4) setParts.push('start4_' + s + ' = start4_' + s + ' + 1');
                if (len >= 2 && len <= 8) setParts.push('startshort_' + s + ' = startshort_' + s + ' + 1');
            }
            if (kind === 'end' || kind === 'both') {
                setParts.push('endall_' + s + ' = endall_' + s + ' + 1');
                if (len === 2) setParts.push('end2_' + s + ' = end2_' + s + ' + 1');
                if (len === 3) setParts.push('end3_' + s + ' = end3_' + s + ' + 1');
                if (len === 4) setParts.push('end4_' + s + ' = end4_' + s + ' + 1');
                if (len >= 2 && len <= 8) setParts.push('endshort_' + s + ' = endshort_' + s + ' + 1');
            }
        }

        if (setParts.length > 0) {
            await client.query(
                'UPDATE kkutu_stats_ko SET ' + setParts.join(', ') + ' WHERE _id = $1',
                [c]
            );
        }
    }
}

// =============================================
// 단어 추가 메인 함수
// =============================================
async function addWord(word, theme) {
    var client;
    try {
        client = await pool.connect();

        // 기존 단어 확인
        var res = await client.query(
            'SELECT _id, type, theme, mean, flag FROM kkutu_ko WHERE _id = $1', [word]
        );

        var isNew = (res.rowCount === 0);

        if (isNew) {
            // 새 단어 삽입
            var mean = buildMean(theme);
            await client.query(
                'INSERT INTO kkutu_ko (_id, type, theme, mean, flag, hit) VALUES ($1, $2, $3, $4, $5, 0)',
                [word, WORD_TYPE, theme, mean, WORD_FLAG]
            );
            console.log('  [추가됨] "' + word + '" (테마: ' + theme + ', 품사: ' + WORD_TYPE + ', 플래그: ' + WORD_FLAG + ')');

            // kkutu_stats_ko 업데이트
            await updateStatsKoForWord(client, word);
            console.log('  [통계 업데이트됨] kkutu_stats_ko - "' + word.charAt(0) + '", "' + word.charAt(word.length - 1) + '"');

        } else {
            var row = res.rows[0];
            var existingThemes = (row.theme || '').split(',').filter(function(t) { return t; });

            if (existingThemes.includes(theme)) {
                console.log('  [건너뜀] "' + word + '" 이미 테마 ' + theme + '로 등록되어 있습니다.');
            } else {
                var newTheme = existingThemes.concat([theme]).join(',');
                var existingTypes = (row.type || '').split(',').filter(function(t) { return t; });
                var newType = existingTypes.includes(WORD_TYPE) ? row.type : (row.type ? row.type + ',' + WORD_TYPE : WORD_TYPE);

                await client.query(
                    'UPDATE kkutu_ko SET type = $1, theme = $2 WHERE _id = $3',
                    [newType, newTheme, word]
                );
                console.log('  [업데이트됨] "' + word + '" 테마 추가: ' + theme + ' (기존: ' + row.theme + ')');
                // 기존 단어는 stats 변화 없음 (이미 카운트되어 있음)
            }
        }

    } catch (e) {
        console.error('  [오류]', e.message);
    } finally {
        if (client) client.release();
    }
}

// =============================================
// 대화형 루프
// =============================================
async function main() {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function ask(question) {
        return new Promise(function(resolve) {
            rl.question(question, function(answer) {
                resolve(answer.trim());
            });
        });
    }

    console.log('=== KKuTu 대화형 단어 추가 도구 ===');
    console.log('품사: INJEONG(어인정), 플래그: ' + WORD_FLAG);
    console.log('');

    while (true) {
        var wordInput = await ask('단어 입력 (공백으로 여러 단어 가능, 종료: q): ');
        if (wordInput === 'q' || wordInput === '') {
            console.log('종료합니다.');
            break;
        }

        var words = wordInput.split(/\s+/).filter(function(w) { return w; });

        var theme = await ask('테마 입력 (예: 190, 530, IMS 등): ');
        if (!theme) {
            console.log('  테마를 입력해야 합니다. 건너뜁니다.');
            continue;
        }

        for (var i = 0; i < words.length; i++) {
            await addWord(words[i], theme);
        }

        var cont = await ask('계속 추가하시겠습니까? (y/n, 기본: y): ');
        if (cont === 'n' || cont === 'N') {
            console.log('종료합니다.');
            break;
        }
        console.log('');
    }

    rl.close();
    await pool.end();
}

main().catch(function(e) {
    console.error('오류:', e);
    process.exit(1);
});
