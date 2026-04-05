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

// Load Korean language file for theme names
const langPath = path.join(__dirname, '../Server/lib/Web/lang/ko_KR.json');
let langKkutu;
try {
    langKkutu = JSON.parse(fs.readFileSync(langPath, 'utf8')).kkutu;
} catch (e) {
    console.error(`Failed to load language file from ${langPath}:`, e.message);
    process.exit(1);
}

// Build theme code -> Korean name map from theme_XXX keys
const themeNames = {};
for (const [key, val] of Object.entries(langKkutu)) {
    if (key.startsWith('theme_')) {
        themeNames[key.slice(6)] = val;
    }
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

function korSort(arr) {
    return arr.sort((a, b) => a.localeCompare(b, 'ko'));
}

// Replace characters invalid in Windows filenames: \ / : * ? " < > |
function sanitizeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_');
}

async function main() {
    console.log("Connecting to database...");
    const client = await pool.connect();

    try {
        console.log("Fetching all words from kkutu_ko...");
        const res = await client.query("SELECT _id, type FROM kkutu_ko");

        const allWords = [];
        const playableWords = [];
        const themeMap = {}; // theme code -> Set of words

        for (const row of res.rows) {
            const word = row._id;
            const type = row.type || "";

            allWords.push(word);

            if (word.length >= 2 && KOR_GROUP.test(type)) {
                playableWords.push(word);
            }

            // Group by theme codes found in the type field
            if (type) {
                for (const code of type.split(',')) {
                    if (themeNames[code] !== undefined) {
                        if (!themeMap[code]) themeMap[code] = new Set();
                        themeMap[code].add(word);
                    }
                }
            }
        }

        console.log(`Extracted ${allWords.length} total words.`);
        console.log(`Extracted ${playableWords.length} playable words.`);

        const allWordsPath = path.join(__dirname, 'all_words.txt');
        const playableWordsPath = path.join(__dirname, 'kkutu_playable_words.txt');

        fs.writeFileSync(allWordsPath, korSort(allWords).join('\n'), 'utf8');
        fs.writeFileSync(playableWordsPath, korSort(playableWords).join('\n'), 'utf8');

        console.log(`Saved all words to: ${allWordsPath}`);
        console.log(`Saved playable words to: ${playableWordsPath}`);

        // Create 주제 folder and write per-theme files sorted alphabetically
        const themeDirPath = path.join(__dirname, '주제');
        if (!fs.existsSync(themeDirPath)) {
            fs.mkdirSync(themeDirPath);
        }

        let themeCount = 0;
        for (const [code, wordSet] of Object.entries(themeMap)) {
            const korName = themeNames[code];
            const words = korSort(Array.from(wordSet));
            const filePath = path.join(themeDirPath, `${sanitizeFilename(korName)}.txt`);
            fs.writeFileSync(filePath, words.join('\n'), 'utf8');
            console.log(`  [${code}] ${korName}: ${words.length}개 -> ${korName}.txt`);
            themeCount++;
        }

        console.log(`Saved ${themeCount} theme files to: ${themeDirPath}`);

    } catch (err) {
        console.error("Error connecting or querying:", err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
