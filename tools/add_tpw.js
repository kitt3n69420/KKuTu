/*
 * add_tpw.js
 *
 * TPW 주제 단어를 kkutu_ko 테이블에 추가합니다.
 *   - type: -1
 *   - mean: "＂1＂" (\uFF021\uFF02)
 *   - theme: TPW
 *   - flag: 2 (어인정)
 *
 * 이미 존재하는 단어는 추가하지 않습니다.
 *
 * Usage: node add_tpw.js <단어1> <단어2> ...
 *   또는: 같은 디렉토리에 tpw_words.txt 파일을 두고 실행 (한 줄에 한 단어, 또는 쉼표 구분)
 */

var fs = require('fs');
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

var config = {
    user: GLOBAL.PG_USER || 'postgres',
    password: GLOBAL.PG_PASSWORD,
    host: GLOBAL.PG_HOST || 'localhost',
    port: GLOBAL.PG_PORT || 5432,
    database: GLOBAL.PG_DATABASE || 'kkutu'
};

var TPW_TYPE = '-1';
var TPW_MEAN = "\uFF021\uFF02"; // ＂1＂
var TPW_THEME = 'TPW';
var TPW_FLAG = 2; // 어인정

function getWordsFromArgs() {
    // 커맨드라인 인자에서 단어 수집
    var args = process.argv.slice(2);
    if (args.length > 0) {
        return args.map(function (w) { return w.trim(); }).filter(Boolean);
    }

    // tpw_words.txt 파일 시도
    var txtPath = path.join(__dirname, 'tpw_words.txt');
    if (fs.existsSync(txtPath)) {
        console.log("tpw_words.txt 파일에서 단어를 읽습니다...");
        var content = fs.readFileSync(txtPath, 'utf8');
        var words = [];
        content.split(/\r?\n/).forEach(function (line) {
            line.split(',').forEach(function (w) {
                var trimmed = w.trim();
                if (trimmed) words.push(trimmed);
            });
        });
        return words;
    }

    return [];
}

async function main() {
    var words = getWordsFromArgs();

    if (words.length === 0) {
        console.log("Usage: node add_tpw.js <단어1> <단어2> ...");
        console.log("  또는: tpw_words.txt 파일을 tools 폴더에 두고 실행");
        process.exit(0);
    }

    // 중복 제거
    words = words.filter(function (w, i, arr) { return arr.indexOf(w) === i; });
    console.log("추가할 TPW 단어: " + words.length + "개");

    var pool = new pg.Pool(config);
    var client;
    try {
        client = await pool.connect();

        var stats = { inserted: 0, skipped: 0, error: 0 };

        for (var word of words) {
            try {
                var res = await client.query(
                    "SELECT _id FROM kkutu_ko WHERE _id = $1", [word]
                );

                if (res.rowCount > 0) {
                    console.log("  [SKIP] '" + word + "' - 이미 존재함");
                    stats.skipped++;
                } else {
                    await client.query(
                        "INSERT INTO kkutu_ko (_id, type, theme, mean, flag, hit) VALUES ($1, $2, $3, $4, $5, 0)",
                        [word, TPW_TYPE, TPW_THEME, TPW_MEAN, TPW_FLAG]
                    );
                    console.log("  [INSERT] '" + word + "'");
                    stats.inserted++;
                }
            } catch (err) {
                console.error("  [ERR] '" + word + "':", err.message);
                stats.error++;
            }
        }

        console.log("\n=== 완료 ===");
        console.log("추가: " + stats.inserted + ", 스킵(이미 존재): " + stats.skipped + ", 오류: " + stats.error);

    } catch (e) {
        console.error("DB 오류:", e.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

main().catch(function (e) { console.error(e); });
