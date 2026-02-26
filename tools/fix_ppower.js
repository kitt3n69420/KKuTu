/*
 * fix_ppower.js
 *
 * mean이 '파워쿵쿵따 단어'인 단어들을 TPW 형식으로 변환합니다.
 *
 * Case 1: theme != '0' (실제 테마가 있음)
 *   - theme 배열에서 앞의 '0' 제거
 *   - 남은 테마 개수 N만큼 mean을 "＂1＂  ＂2＂  ...  ＂N＂" 형태로 변경
 *   - type를 -1로 변경
 *   - theme는 0 제거 후 유지
 *
 * Case 2: theme = '0' (또는 비어있음)
 *   - theme를 TPW로 변경
 *   - mean을 "＂1＂"로 변경
 *   - type를 -1로 변경
 *
 * Usage: node fix_ppower.js
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

// ＂1＂  ＂2＂  ...  ＂N＂ 형태의 mean 생성
function buildMean(count) {
    var parts = [];
    for (var i = 1; i <= count; i++) {
        parts.push("\uFF02" + i + "\uFF02"); // ＂N＂
    }
    return parts.join("  ");
}

async function main() {
    var pool = new pg.Pool(config);
    var client;
    try {
        client = await pool.connect();

        var res = await client.query(
            "SELECT _id, type, theme, mean FROM kkutu_ko WHERE mean = '파워쿵쿵따 단어'"
        );

        if (res.rowCount === 0) {
            console.log("처리할 단어가 없습니다 (mean='파워쿵쿵따 단어').");
            return;
        }

        console.log("발견된 단어: " + res.rowCount + "개\n");

        var stats = { case1: 0, case2: 0, error: 0 };

        for (var row of res.rows) {
            var word = row._id;
            var themeRaw = (row.theme || '').trim();

            // theme 배열 파싱 및 앞의 0 제거
            var themes = themeRaw.split(',')
                .map(function (t) { return t.trim(); })
                .filter(Boolean);

            // 앞에 오는 0만 제거 (배열 앞쪽 연속 0 제거)
            while (themes.length > 0 && themes[0] === '0') {
                themes.shift();
            }

            try {
                if (themes.length > 0) {
                    // Case 1: 실제 테마가 있음 → type=INJEONG
                    var newMean = buildMean(themes.length);
                    var newTheme = themes.join(',');

                    await client.query(
                        "UPDATE kkutu_ko SET type = $1, mean = $2, theme = $3 WHERE _id = $4",
                        ['INJEONG', newMean, newTheme, word]
                    );
                    console.log("[Case1] '" + word + "' theme=[" + newTheme + "] type=INJEONG -> mean='" + newMean + "'");
                    stats.case1++;
                } else {
                    // Case 2: theme가 '0'이거나 비어있음
                    var newMean = "\uFF021\uFF02"; // ＂1＂

                    await client.query(
                        "UPDATE kkutu_ko SET type = $1, mean = $2, theme = $3 WHERE _id = $4",
                        ['-1', newMean, 'TPW', word]
                    );
                    console.log("[Case2] '" + word + "' theme=TPW, mean='＂1＂'");
                    stats.case2++;
                }
            } catch (err) {
                console.error("[ERR] '" + word + "':", err.message);
                stats.error++;
            }
        }

        console.log("\n=== 완료 ===");
        console.log("Case1 (테마 있음): " + stats.case1 + "개");
        console.log("Case2 (TPW로 변경): " + stats.case2 + "개");
        console.log("오류: " + stats.error + "개");

    } catch (e) {
        console.error("DB 오류:", e.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

main().catch(function (e) { console.error(e); });
