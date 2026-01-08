const { Pool } = require('./lib/node_modules/pg');
const fs = require('fs');
const path = require('path');

// Load Global Config
const globalPath = path.join(__dirname, 'lib', 'sub', 'global.json');
let globalConfig;
try {
    globalConfig = require(globalPath);
} catch (e) {
    console.error(`Failed to load config from ${globalPath}:`, e.message);
    process.exit(1);
}

// Choseong List
const CHOSEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

function getChoseong(char) {
    const code = char.charCodeAt(0);
    // Hangul Syllables: 0xAC00 ~ 0xD7A3
    if (code >= 0xAC00 && code <= 0xD7A3) {
        const choseongIndex = Math.floor((code - 0xAC00) / 28 / 21);
        return CHOSEONG[choseongIndex];
    }
    return char;
}

function getInitialString(word) {
    let result = "";
    for (let i = 0; i < word.length; i++) {
        result += getChoseong(word[i]);
    }
    return result;
}

const pool = new Pool({
    user: globalConfig.PG_USER,
    password: globalConfig.PG_PASSWORD,
    host: globalConfig.PG_HOST,
    database: globalConfig.PG_DATABASE,
    port: globalConfig.PG_PORT
});

async function main() {
    try {
        const client = await pool.connect();
        console.log("Connected to database.");

        // Query for 3-letter words
        const res = await client.query("SELECT _id FROM kkutu_ko WHERE length(_id) = 3");
        console.log(`Fetched ${res.rows.length} words.`);

        const stats = {};

        res.rows.forEach(row => {
            const word = row._id;
            const initials = getInitialString(word);

            if (initials.length === 3) {
                if (!stats[initials]) {
                    stats[initials] = 0;
                }
                stats[initials]++;
            }
        });

        const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

        console.log("=== 3-Letter Word Initial Consonant Statistics ===");
        sortedStats.forEach(([initials, count]) => {
            console.log(`${initials}: ${count}`);
        });

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

main();
