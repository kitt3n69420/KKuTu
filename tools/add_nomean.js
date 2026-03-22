/*
 * 끄투 단어 추가 스크립트 (JS 버전)
 * kkutuAdd.py를 참고하여 작성됨
 *
 * 사용법: node kkutuAdd.js <단어목록.txt>
 */

'use strict';

var fs = require('fs');
var readline = require('readline');
var path = require('path');

// 모듈 경로 추가
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

var config = {
    user: GLOBAL.PG_USER || 'postgres',
    password: GLOBAL.PG_PASSWORD,
    host: GLOBAL.PG_HOST || 'localhost',
    port: GLOBAL.PG_PORT || 5432,
    database: GLOBAL.PG_DATABASE || 'kkutu'
};

var pool = new pg.Pool(config);
var DEFAULT_LANG = 'ko';

function getTableName(lang) {
    var tables = {
        'ko': 'kkutu_ko',
        'en': 'kkutu_en'
    };
    if (!tables[lang]) {
        throw new Error("지원하지 않는 언어입니다: " + lang);
    }
    return tables[lang];
}

async function addWords(client, lang, theme, words) {
    var tableName = getTableName(lang);
    var result = {
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: []
    };

    for (var i = 0; i < words.length; i++) {
        var word = words[i].trim();
        if (!word) continue;

        try {
            // 기존 단어 조회
            var res = await client.query('SELECT _id, type, theme, mean FROM ' + tableName + ' WHERE _id = $1', [word]);

            if (res.rowCount === 0) {
                // 새 단어 삽입
                await client.query(
                    'INSERT INTO ' + tableName + ' (_id, type, theme, mean, flag, hit) VALUES ($1, $2, $3, $4, $5, $6)',
                    [word, 'INJEONG', theme, '＂1＂', 2, 0]
                );
                result.inserted++;
                console.log('  ✓ 추가됨: ' + word);
            } else {
                var row = res.rows[0];
                var existing_theme = row.theme || '';
                var existing_themes = existing_theme.split(',').filter(function(t) { return t; });

                if (existing_themes.includes(theme)) {
                    result.skipped++;
                    console.log('  ⊘ 건너뜀 (이미 테마 있음): ' + word);
                } else {
                    var new_theme = existing_themes.concat([theme]).join(',');
                    
                    var existing_type = row.type || '';
                    var existing_types = existing_type.split(',').filter(function(t) { return t; });
                    var new_type = existing_types.includes('INJEONG') ? existing_type : (existing_type ? existing_type + ',INJEONG' : 'INJEONG');

                    var existing_mean = row.mean || '';
                    var means = existing_mean.split(/＂[0-9]+＂/).slice(1);
                    var new_mean_num = means.length + 1;
                    var new_mean = existing_mean ? existing_mean + '＂' + new_mean_num + '＂' : '＂' + new_mean_num + '＂';

                    await client.query(
                        'UPDATE ' + tableName + ' SET type = $1, theme = $2, mean = $3 WHERE _id = $4',
                        [new_type, new_theme, new_mean, word]
                    );
                    result.updated++;
                    console.log('  ↻ 업데이트됨: ' + word + ' (테마 추가)');
                }
            }
        } catch (e) {
            result.errors.push({ word: word, error: e.message });
            console.log('  ✗ 오류: ' + word + ' - ' + e.message);
        }
    }
    return result;
}

function loadWordsFromFile(filepath) {
    try {
        var content = fs.readFileSync(filepath, 'utf-8');
        var words = [];
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            for (var j = 0; j < parts.length; j++) {
                var w = parts[j].trim();
                if (w) words.push(w);
            }
        }
        return words;
    } catch (e) {
        throw new Error('파일을 읽을 수 없습니다: ' + e.message);
    }
}

async function main() {
    console.log('\n==================================================');
    console.log('       끄투 단어 추가 도구 (JS 버전)');
    console.log('==================================================');

    if (process.argv.length < 3) {
        console.log('\n[사용법]');
        console.log('단어가 들어있는 txt 파일을 이 스크립트의 인자로 전달하세요.');
        console.log('예시: node kkutuAdd.js 단어목록.txt');
        console.log('\n파일 형식:');
        console.log('  - 한 줄에 하나씩 단어를 적거나');
        console.log('  - 쉼표로 구분하여 단어를 나열');
        process.exit(1);
    }

    var filepath = process.argv[2];

    if (!fs.existsSync(filepath)) {
        console.log('\n오류: 파일을 찾을 수 없습니다 - ' + filepath);
        process.exit(1);
    }

    var words;
    try {
        words = loadWordsFromFile(filepath);
    } catch (e) {
        console.log('\n오류: ' + e.message);
        process.exit(1);
    }

    if (words.length === 0) {
        console.log('\n오류: 파일에 단어가 없습니다.');
        process.exit(1);
    }

    console.log('\n파일: ' + path.basename(filepath));
    console.log('단어 수: ' + words.length + '개');
    console.log('--------------------------------------------------');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var ask = function(question) {
        return new Promise(function(resolve) {
            rl.question(question, resolve);
        });
    };

    var t = await ask('\n테마를 입력하세요 (기본값: 0): ');
    var theme = t.trim() || '0';

    var l = await ask('언어를 선택하세요 (ko/en, 기본값: ' + DEFAULT_LANG + '): ');
    l = l.trim().toLowerCase();
    var lang = (l === 'ko' || l === 'en') ? l : DEFAULT_LANG;

    rl.close();

    console.log('\n설정: 언어=' + lang + ', 테마=' + theme);
    console.log('--------------------------------------------------');

    console.log('\n데이터베이스 연결 중...');
    
    var client;
    try {
        client = await pool.connect();
        console.log('✓ 연결 성공!\n');
    } catch (e) {
        console.log('\n✗ 데이터베이스 연결 실패: ' + e.message);
        console.log('\nDB_CONFIG 설정을 확인해주세요.');
        process.exit(1);
    }

    try {
        console.log('단어 추가 중...\n');
        var result = await addWords(client, lang, theme, words);

        console.log('\n==================================================');
        console.log('               결과 요약');
        console.log('==================================================');
        console.log('  ✓ 새로 추가됨: ' + result.inserted + '개');
        console.log('  ↻ 테마 추가됨: ' + result.updated + '개');
        console.log('  ⊘ 건너뜀:     ' + result.skipped + '개');
        console.log('  ✗ 오류:       ' + result.errors.length + '개');
        console.log('==================================================');

        if (result.errors.length > 0) {
            console.log('\n오류 상세:');
            for (var i = 0; i < result.errors.length; i++) {
                var err = result.errors[i];
                console.log('  - ' + err.word + ': ' + err.error);
            }
        }
    } finally {
        client.release();
        await pool.end();
        console.log('\n완료되었습니다.');
    }
}

if (require.main === module) {
    main().catch(function(e) {
        console.error(e);
        process.exit(1);
    });
}
