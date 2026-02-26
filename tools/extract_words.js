const { Pool } = require('../Server/lib/node_modules/pg/lib');
const fs = require('fs');
const path = require('path');

// Load Global Config
const globalPath = path.join('../server', 'lib', 'sub', 'global.json');
let globalConfig;
try {
    globalConfig = require(globalPath);
} catch (e) {
    console.error(`Failed to load config from ${globalPath}:`, e.message);
    process.exit(1);
}

const pool = new Pool({
    user: globalConfig.PG_USER,
    password: globalConfig.PG_PASSWORD,
    host: globalConfig.PG_HOST,
    database: globalConfig.PG_DATABASE,
    port: globalConfig.PG_PORT
});

const KOR_GROUP = new RegExp("(,|^)(" + [
    "0", "1", "3", "7", "8", "11", "9",
    "16", "15", "17", "2", "18", "20", "26", "19",
    "INJEONG"
].join('|') + ")(,|$)");

async function main() {
    console.log("Connecting to database...");
    const client = await pool.connect();

    try {
        console.log("Fetching all words from kkutu_ko...");
        const res = await client.query("SELECT _id, type FROM kkutu_ko");

        let allWords = [];
        let playableWords = [];

        for (const row of res.rows) {
            const word = row._id;
            const type = row.type || "";

            allWords.push(word);

            // Check for playability: length >= 2 and type matches KOR_GROUP
            if (word.length >= 2 && KOR_GROUP.test(type)) {
                playableWords.push(word);
            }
        }

        console.log(`Extracted ${allWords.length} total words.`);
        console.log(`Extracted ${playableWords.length} playable words.`);

        const allWordsPath = path.join(__dirname, 'all_words.txt');
        const playableWordsPath = path.join(__dirname, 'kkutu_playable_words.txt');

        fs.writeFileSync(allWordsPath, allWords.join('\n'));
        fs.writeFileSync(playableWordsPath, playableWords.join('\n'));

        console.log(`Saved all words to: ${allWordsPath}`);
        console.log(`Saved playable words to: ${playableWordsPath}`);

    } catch (err) {
        console.error("Error connecting or querying:", err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
