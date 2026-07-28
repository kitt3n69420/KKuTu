// Add search path for node_modules
module.paths.push(__dirname + '/lib/node_modules');
var pg = require('pg');
var global = require('./lib/sub/global.json');

var pool = new pg.Pool({
    user: global.PG_USER,
    password: global.PG_PASSWORD,
    host: global.PG_HOST,
    port: global.PG_PORT,
    database: global.PG_DATABASE
});

pool.connect(function (err, client, done) {
    if (err) {
        return console.error('Connection error', err);
    }

    var queries = [
        "ALTER TABLE users ADD COLUMN nickname VARCHAR(20);",
        "ALTER TABLE users ADD COLUMN nickChanged BIGINT;",
        // 닉네임이 겹치는 기존 유저들 중 최근에 바꾼 1명만 남기고 나머지는 재설정하도록 null 처리
        `WITH ranked AS (
            SELECT _id, ROW_NUMBER() OVER (
                PARTITION BY nickname
                ORDER BY nickChanged DESC NULLS LAST, _id
            ) AS rn
            FROM users WHERE nickname IS NOT NULL
        )
        UPDATE users SET nickname = NULL, nickChanged = NULL
        WHERE _id IN (SELECT _id FROM ranked WHERE rn > 1);`,
        // 닉네임 값이 있는 행끼리만 유일성을 강제 (미설정 유저는 NULL 여러 개 허용)
        "CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_unique ON users (nickname) WHERE nickname IS NOT NULL;"
    ];

    var runNext = function (i) {
        if (i >= queries.length) {
            console.log("Migration complete in a way (errors ignored if columns exist).");
            client.release();
            pool.end();
            return;
        }
        client.query(queries[i], function (err, result) {
            if (err) {
                console.log("Query " + i + " failed (might already exist): " + err.message);
            } else {
                console.log("Query " + i + " success.");
            }
            runNext(i + 1);
        });
    };

    runNext(0);
});
