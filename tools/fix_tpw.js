/*
 * fix_tpw.js
 *
 * kkutu_ko 테이블에서 topic(theme) 칼럼에 TPW가 포함된 단어를 찾아:
 *   - type를 -1로 변경
 *   - mean을 "＂1＂" (\uFF021\uFF02)로 변경
 *
 * TPW 말고 다른 주제가 함께 있으면 경고를 출력합니다.
 *
 * Usage: node fix_tpw.js
 */

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

var TPW_MEAN = "\uFF021\uFF02"; // ＂1＂

async function main() {
    var pool = new pg.Pool(config);
    var client;
    try {
        client = await pool.connect();

        // TPW가 포함된 단어 조회
        var res = await client.query(
            "SELECT _id, type, theme, mean FROM kkutu_ko WHERE theme ~ '(^|,)TPW(,|$)'"
        );

        if (res.rowCount === 0) {
            console.log("TPW topic을 가진 단어가 없습니다.");
            return;
        }

        console.log("TPW topic 단어 " + res.rowCount + "개 발견.");

        var stats = { updated: 0, warned: 0, skipped: 0, error: 0 };

        for (var row of res.rows) {
            var word = row._id;
            var themes = (row.theme || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
            var otherThemes = themes.filter(function (t) { return t !== 'TPW'; });

            if (otherThemes.length > 0) {
                console.warn("[WARN] '" + word + "': TPW 외에 다른 주제 포함 - [" + otherThemes.join(', ') + "]");
                stats.warned++;
                continue; // 경고 후 업데이트는 건너뜁니다. 필요에 따라 수정 가능
            }

            try {
                await client.query(
                    "UPDATE kkutu_ko SET type = $1, mean = $2 WHERE _id = $3",
                    ['-1', TPW_MEAN, word]
                );
                console.log("  [OK] '" + word + "' type=-1, mean 설정");
                stats.updated++;
            } catch (err) {
                console.error("  [ERR] '" + word + "':", err.message);
                stats.error++;
            }
        }

        console.log("\n=== 완료 ===");
        console.log("업데이트: " + stats.updated + ", 경고(다중주제): " + stats.warned + ", 오류: " + stats.error);

    } catch (e) {
        console.error("DB 오류:", e.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

main().catch(function (e) { console.error(e); });
