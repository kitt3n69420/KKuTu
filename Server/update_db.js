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
        "ALTER TABLE users ADD COLUMN nickChanged BIGINT;"
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
