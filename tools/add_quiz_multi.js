/*
 * KKuTu Quiz Adder (Multi-file TSV support)
 * 
 * Usage: node add_quiz_multi.js
 * 
 * Place .tsv files in the same directory.
 * The first 4 characters of the filename MUST be the quiz topic code (e.g. NUMG_quiz.tsv -> NUMG).
 * 
 * TSV Format:
 * [Topic]	[Question]	[Answer_KO]	[Answer_EN]	[Alias_KO]	[Alias_EN]	[Difficulty]
 * (Topic column is optional if filename provides it, but helps verify)
 */

var fs = require('fs');
var path = require('path');

// Ensure module paths are correct (relative to tools folder)
module.paths.push(path.join(__dirname, '../Server/lib/node_modules'));
module.paths.push(path.join(__dirname, '../Server/node_modules'));

try {
    var pg = require('pg');
} catch (e) {
    console.error("Error: 'pg' module not found. Please ensure 'pg' is installed in Server/node_modules or Server/lib/node_modules.");
    process.exit(1);
}

var GLOBAL;
try {
    GLOBAL = require('../Server/lib/sub/global.json');
} catch (e) {
    console.error("Error loading global.json:", e.message);
    process.exit(1);
}

// Database Configuration
var config = {
    user: GLOBAL.PG_USER || 'postgres',
    password: GLOBAL.PG_PASSWORD,
    host: GLOBAL.PG_HOST || 'localhost',
    port: GLOBAL.PG_PORT || 5432,
    database: GLOBAL.PG_DATABASE || 'kkutu'
};

var pool = new pg.Pool(config);

async function main() {
    console.log("=== KKuTu Multi-File Quiz Adder ===");
    console.log("Scanning directory for .tsv files...");

    try {
        var files = fs.readdirSync(__dirname).filter(function (file) {
            return file.endsWith('.tsv');
        });

        if (files.length === 0) {
            console.log("No .tsv files found.");
            pool.end();
            return;
        }

        console.log("Found " + files.length + " file(s).");

        for (var file of files) {
            await processTsvFile(file);
        }

        console.log("\n=== All done ===");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

async function processTsvFile(filename) {
    console.log("\nProcessing [TSV] " + filename + "...");

    // Extract topic from filename (first 4 chars)
    var topicPrefix = filename.substring(0, 4).toUpperCase();
    if (topicPrefix.length < 4) {
        console.log("  [WARN] Filename too short to extract 4-char topic prefix. Skipping.");
        return;
    }

    console.log("  Topic: " + topicPrefix);

    var filePath = path.join(__dirname, filename);
    var content = fs.readFileSync(filePath, 'utf8');
    var lines = content.split(/\r?\n/);

    if (lines.length === 0) {
        console.log("  [SKIP] File is empty.");
        return;
    }

    var client;
    try {
        client = await pool.connect();
        var insertedCount = 0;
        var skipCount = 0;
        var errorCount = 0;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            var cols = line.split('\t');
            // Expected columns: Topic, Question, AnsKO, AnsEN, AliasKO, AliasEN, Diff
            // But we treat Topic (col 0) as override if needed, or if file only has 6 cols, shift?
            // Let's assume standard format:
            // Col 0: Topic (can be ignored)
            // Col 1: Question
            // Col 2: Ans KO
            // Col 3: Ans EN
            // Col 4: Alias KO
            // Col 5: Alias EN
            // Col 6: Diff

            if (cols.length < 7) {
                // If fewer cols, maybe it's missing the topic column?
                // Let's be strict for now to avoid bad data.
                if (cols.length >= 6) {
                    // Assume missing topic col
                    cols.unshift(topicPrefix);
                } else {
                    console.log("  [WARN] Row " + (i + 1) + " has insufficient columns (" + cols.length + "). Skipping.");
                    skipCount++;
                    continue;
                }
            }

            var question = cols[1].trim();
            var ansKo = cols[2].trim();
            var ansEn = cols[3].trim();
            var aliasKo = (cols[4] || "").split(",").map(s => s.trim()).filter(s => s).join(",") || null;
            var aliasEn = (cols[5] || "").split(",").map(s => s.trim()).filter(s => s).join(",") || null;
            var diff = parseInt((cols[6] || "1").trim()) || 1;

            // Basic validation
            if (!question || (!ansKo && !ansEn)) {
                console.log("  [WARN] Row " + (i + 1) + " missing question or answer. Skipping.");
                skipCount++;
                continue;
            }

            try {
                // Check for duplicate (simple check on question+topic)
                var checkRes = await client.query(
                    "SELECT 1 FROM quiz WHERE topic = $1 AND question = $2",
                    [topicPrefix, question]
                );

                if (checkRes.rowCount > 0) {
                    // Update? Or skip? Let's skip duplicates for now to be safe, or update if explicitly requested.
                    // Let's update in case of correction.
                    await client.query(
                        "UPDATE quiz SET answer_ko = $3, answer_en = $4, aliases_ko = $5, aliases_en = $6, difficulty = $7 WHERE topic = $1 AND question = $2",
                        [topicPrefix, question, ansKo, ansEn, aliasKo, aliasEn, diff]
                    );
                    // console.log("    Updated: " + question);
                    insertedCount++; // Count as processed
                } else {
                    await client.query(
                        "INSERT INTO quiz (topic, question, answer_ko, answer_en, aliases_ko, aliases_en, difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                        [topicPrefix, question, ansKo, ansEn, aliasKo, aliasEn, diff]
                    );
                    insertedCount++;
                }

            } catch (err) {
                console.error("    ! DB Error on row " + (i + 1) + ":", err.message);
                errorCount++;
            }
        }

        console.log("  Stats: Processed " + insertedCount + ", Skipped " + skipCount + ", Errors " + errorCount);

    } catch (e) {
        console.error("  DB Connection Error:", e.message);
    } finally {
        if (client) client.release();
    }
}

main().catch(function (err) {
    console.error("Unhandled Error:", err);
});
