var DB = require('../Server/lib/Web/db');
var Const = require('../Server/lib/const');

DB.ready = function () {
    console.log("Stats Helper: DB Ready. Starting population...");
    populateStats();
};

function populateStats() {
    var statsKo = {};
    var statsEn = {};
    var langs = ['ko', 'en'];
    var pending = langs.length;

    langs.forEach(function (lang) {
        console.log(`Fetching words from kkutu_${lang}...`);
        DB.kkutu[lang].find().on(function (words) {
            if (!words) {
                console.error(`No words found for ${lang} or DB error.`);
                if (--pending === 0) finalize();
                return;
            }

            console.log(`Processing ${words.length} words for ${lang}...`);

            words.forEach(function (word) {
                var w = word._id;
                var flag = word.flag || 0;
                var type = word.type || "";

                // Exclude single character words
                if (w.length <= 1) return;

                // Determine Word Properties
                var isInjeong = (flag & Const.KOR_FLAG.INJEONG) ? true : false;
                var isLoan = (flag & Const.KOR_FLAG.LOANWORD) ? true : false;
                var isStrict = (type.match(Const.KOR_STRICT) && flag < 4) ? true : false;
                var isGroup = (type.match(Const.KOR_GROUP)) ? true : false; // Check for valid parts of speech in Normal mode

                if (lang === 'ko') {
                    // Korean Logic
                    // No Dueum Law applied here (Raw Stats)
                    // Length Categories: 2 (>=2), 3 (>=3), 4 (>=4), All (>=2)
                    var startChar = w.charAt(0);
                    var endChar = w.charAt(w.length - 1);

                    var len = w.length;

                    if (!statsKo[startChar]) statsKo[startChar] = createEmptyStatsKo();
                    if (!statsKo[endChar]) statsKo[endChar] = createEmptyStatsKo();

                    for (var state = 0; state < 16; state++) {
                        var reqNoInjeong = (state & 1);
                        var reqStrict = (state & 2);
                        var reqNoLoan = (state & 4);
                        var reqAllpos = (state & 8);

                        var valid = true;
                        if (reqNoInjeong && isInjeong) valid = false;
                        if (reqAllpos) {
                            // allpos: 품사 제한 없음 (모든 단어 허용)
                        } else if (reqStrict) {
                            if (!isStrict) valid = false;
                        } else {
                            // Normal mode: Must match KOR_GROUP (Valid POS)
                            if (!isGroup) valid = false;
                        }
                        if (reqNoLoan && isLoan) valid = false;

                        if (valid) {
                            // Update Start Stats
                            statsKo[startChar].startall[state]++;
                            if (len === 2) statsKo[startChar].start2[state]++;
                            if (len === 3) statsKo[startChar].start3[state]++;
                            if (len === 4) statsKo[startChar].start4[state]++;
                            if (len >= 2 && len <= 8) statsKo[startChar].startshort[state]++;

                            // End Stats
                            statsKo[endChar].endall[state]++;
                            if (len === 2) statsKo[endChar].end2[state]++;
                            if (len === 3) statsKo[endChar].end3[state]++;
                            if (len === 4) statsKo[endChar].end4[state]++;
                            if (len >= 2 && len <= 8) statsKo[endChar].endshort[state]++;
                        }
                    }

                } else {
                    // English Logic
                    // User Request: Only words with length >= 4
                    // Store 1~3 char n-grams (prefixes)
                    // 16 Columns (Start counts only, bit 3 = allpos reserved for EN future use)

                    if (w.indexOf(' ') >= 0) return;

                    if (w.length >= 4) {
                        var prefixes = [];
                        if (w.length >= 1) prefixes.push(w.substring(0, 1));
                        if (w.length >= 2) prefixes.push(w.substring(0, 2));
                        if (w.length >= 3) prefixes.push(w.substring(0, 3));

                        prefixes.forEach(function (pre) {
                            if (!statsEn[pre]) statsEn[pre] = createEmptyStatsEn();

                            for (var state = 0; state < 16; state++) {
                                var reqNoInjeong = (state & 1);
                                var reqStrict = (state & 2);
                                var reqNoLoan = (state & 4);

                                var valid = true;
                                if (reqNoInjeong && isInjeong) valid = false;
                                if (reqStrict && !isStrict) valid = false;
                                if (reqNoLoan && isLoan) valid = false;

                                if (valid) {
                                    statsEn[pre].count[state]++;
                                }
                            }
                        });
                    }
                }
            });

            if (--pending === 0) finalize();
        });
    });

    function finalize() {
        console.log("Aggregation done. Writing to DB...");
        saveStatsKo(statsKo).then(function () {
            return saveStatsEn(statsEn);
        }).then(function () {
            console.log("\nAll Done!");
            process.exit(0);
        });
    }
}

function createEmptyStatsKo() {
    return {
        start2: new Array(16).fill(0),
        start3: new Array(16).fill(0),
        start4: new Array(16).fill(0),
        startshort: new Array(16).fill(0),
        startall: new Array(16).fill(0),
        end2: new Array(16).fill(0),
        end3: new Array(16).fill(0),
        end4: new Array(16).fill(0),
        endshort: new Array(16).fill(0),
        endall: new Array(16).fill(0)
    };
}

function createEmptyStatsEn() {
    return {
        count: new Array(16).fill(0)
    };
}

function saveStatsKo(stats) {
    return new Promise(function (resolveMain) {
        var keys = Object.keys(stats);
        var total = keys.length;
        var current = 0;

        // Generate Columns String (16 states: bit0=noInjeong, bit1=strict, bit2=noLoan, bit3=allpos)
        var cols = [];
        for (let i = 0; i < 16; i++) {
            cols.push(`start2_${i} INTEGER DEFAULT 0`);
            cols.push(`start3_${i} INTEGER DEFAULT 0`);
            cols.push(`start4_${i} INTEGER DEFAULT 0`);
            cols.push(`startshort_${i} INTEGER DEFAULT 0`);
            cols.push(`startall_${i} INTEGER DEFAULT 0`);
            cols.push(`end2_${i} INTEGER DEFAULT 0`);
            cols.push(`end3_${i} INTEGER DEFAULT 0`);
            cols.push(`end4_${i} INTEGER DEFAULT 0`);
            cols.push(`endshort_${i} INTEGER DEFAULT 0`);
            cols.push(`endall_${i} INTEGER DEFAULT 0`);
        }

        // Drop existing table first to apply new schema
        DB.kkutu_stats_ko.direct("DROP TABLE IF EXISTS kkutu_stats_ko", function (err) {
            if (err && err.code) { // Ignore error if table doesn't exist? But IF EXISTS should handle it.
                // Just log
                console.log("Notice during DROP TABLE:", err);
            }

            var createTableQuery = `
                CREATE TABLE IF NOT EXISTS kkutu_stats_ko (
                    _id VARCHAR(10) PRIMARY KEY,
                    ${cols.join(', ')}
                );
            `;

            // Direct query to create table
            DB.kkutu_stats_ko.direct(createTableQuery, function (err, res) {
                if (err) {
                    console.error("Failed to create table kkutu_stats_ko:", err);
                    process.exit(1);
                }

                console.log("Table kkutu_stats_ko verified. Inserting data...");
                if (total === 0) {
                    resolveMain();
                    return;
                }

                var promises = keys.map(function (key) {
                    return new Promise(function (resolve, reject) {
                        var d = stats[key];
                        var data = { _id: key };

                        for (let i = 0; i < 16; i++) {
                            data[`start2_${i}`] = d.start2[i];
                            data[`start3_${i}`] = d.start3[i];
                            data[`start4_${i}`] = d.start4[i];
                            data[`startshort_${i}`] = d.startshort[i];
                            data[`startall_${i}`] = d.startall[i];
                            data[`end2_${i}`] = d.end2[i];
                            data[`end3_${i}`] = d.end3[i];
                            data[`end4_${i}`] = d.end4[i];
                            data[`endshort_${i}`] = d.endshort[i];
                            data[`endall_${i}`] = d.endall[i];
                        }

                        DB.kkutu_stats_ko.upsert(['_id', key]).set(data).on(function (res) {
                            process.stdout.write(`\r[KO] Progress: ${++current}/${total}`);
                            resolve();
                        }, null, function (err) {
                            console.error(`Error saving ${key}:`, err);
                            resolve();
                        });
                    });
                });

                Promise.all(promises).then(function () {
                    console.log("\nKO Stats Saved.");
                    resolveMain();
                });
            });
        });
    });
}

function saveStatsEn(stats) {
    return new Promise(function (resolveMain) {
        var keys = Object.keys(stats);
        var total = keys.length;
        var current = 0;

        var cols = [];
        for (let i = 0; i < 16; i++) {
            cols.push(`count_${i} INTEGER DEFAULT 0`);
        }

        var createTableQuery = `
            CREATE TABLE IF NOT EXISTS kkutu_stats_en (
                _id VARCHAR(10) PRIMARY KEY,
                ${cols.join(', ')}
            );
        `;

        DB.kkutu_stats_en.direct(createTableQuery, function (err, res) {
            if (err) {
                console.error("Failed to create table kkutu_stats_en:", err);
                process.exit(1);
            }

            console.log("Table kkutu_stats_en verified. Inserting data...");
            if (total === 0) {
                resolveMain();
                return;
            }

            var promises = keys.map(function (key) {
                return new Promise(function (resolve, reject) {
                    var d = stats[key];
                    var data = { _id: key };

                    for (let i = 0; i < 16; i++) {
                        data[`count_${i}`] = d.count[i];
                    }

                    DB.kkutu_stats_en.upsert(['_id', key]).set(data).on(function (res) {
                        process.stdout.write(`\r[EN] Progress: ${++current}/${total}`);
                        resolve();
                    }, null, function (err) {
                        console.error(`Error saving ${key}:`, err);
                        resolve();
                    });
                });
            });

            Promise.all(promises).then(function () {
                console.log("\nEN Stats Saved.");
                resolveMain();
            });
        });
    });
}
