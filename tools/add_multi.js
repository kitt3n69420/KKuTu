/*
 * KKuTu Word Adder (Multi-file support: .txt + .tsv)
 *
 * Usage: node add_multi.js
 *
 * .txt 파일: 기존 방식 - 파일명 앞 3자리로 주제 결정, 나머지는 단어 목록
 * .tsv 파일: 파일명 앞 3자리로 주제 결정, TSV에서 단어 정보(품사, 플래그, 뜻 등) 추출
 *
 * 파일명 앞 3자리가 KO_THEME/EN_THEME/KO_INJEONG에 매칭되면 해당 주제로 추가됩니다.
 * 예: 530_화학단어.txt -> 주제 530(화학), 190동물.tsv -> 주제 190(동물)
 */

var fs = require('fs');
var path = require('path');

module.paths.push(path.join(__dirname, '../Server/lib/node_modules'));
module.paths.push(path.join(__dirname, '../Server/node_modules'));

try {
    var pg = require('pg');
} catch (e) {
    console.error("Error: 'pg' module not found. Please ensure 'pg' is installed in Server/node_modules or Server/lib/node_modules.");
    process.exit(1);
}

var CONST;
var GLOBAL;

try {
    CONST = require('../Server/lib/const.js');
    GLOBAL = require('../Server/lib/sub/global.json');
} catch (e) {
    console.error("Error loading const.js or global.json:", e.message);
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

// =============================================
// Theme Mapping (from tsv_to_sql.py)
// =============================================
var THEME_MAP = {
    // Original Short Codes
    '0': '0', '1': '320', '2': '380', '3': '410', '4': '270',
    '5': '230', '6': '530', '7': '190', '8': '220', '9': '430',
    '10': '30', '11': '170', '12': '160', '13': '60', '14': '60',
    '15': '100', '16': '240', '17': '0',
    '101': '0', '102': '0', '103': '0', '104': '0',

    // String Mappings
    '경제': '30', '경영': '30', '금융': '30', '무역': '30', '상업': '30',
    '산업 일반': '30', '산업일반': '30', '서비스업': '30',
    '고적': '40', '문화유산': '40',
    '공업': '60', '공학 일반': '60', '공학일반': '60',
    '건설': '60', '기계': '60', '광업': '60', '재료': '60',
    '전기': '60', '전자': '60', '전기·전자': '60',
    '자연 일반': '60', '자연일반': '60', '천연자원': '60',
    '교육': '80',
    '교통': '90', '항공': '90', '해운': '90',
    '농업': '140', '수산업': '140', '임업': '140', '축산': '140',
    '문학': '150',
    '물리': '160',
    '미술': '170', '공예': '170', '서예': '170', '회화': '170',
    '조각': '170', '사진': '170', '예체능 일반': '170', '예체능일반': '170',
    '예술': '170', '무용': '170', '연기': '170', '영상': '170',
    '동물': '190', '수의': '190',
    '사회 일반': '220', '사회일반': '220', '사회': '220',
    '정치': '220', '법률': '220', '행정': '220', '복지': '220',
    '생물': '230', '생명': '230',
    '의학': '230', '약학': '230', '한의': '230', '보건 일반': '230', '보건일반': '230',
    '수학': '240',
    '식물': '270',
    '언어': '310',
    '역사': '320', '민속': '320', '고고학': '320',
    '운동': '350', '체육': '350',
    '음악': '360',
    '지리': '420', '지구': '420', '해양': '420', '기상': '420',
    '지명': '430',
    '책명': '440',
    '천문': '450',
    '컴퓨터': '490', '정보·통신': '490', '통신': '490', '정보': '490',
    '화학': '530',
    '기독교': '120', '불교': '210', '가톨릭': '10',
    '철학': '460', '심리': '280',
    '군사': '100',
    '인명': '380', '고유명 일반': '50', '고유명일반': '50',
    '종교': '410', '종교 일반': '410', '종교일반': '410'
};

var KKUTU_THEMES = new Set([
    "30", "40", "60", "80", "90",
    "140", "150", "160", "170", "190",
    "220", "230", "240", "270", "310",
    "320", "350", "360", "420", "430",
    "440", "450", "490", "530", "1001"
]);

function getMappedTheme(themeStr) {
    var t = (themeStr || '').trim();
    if (KKUTU_THEMES.has(t)) return t;
    if (THEME_MAP[t] !== undefined) return THEME_MAP[t];
    return '0';
}

// =============================================
// 파일명 앞 3자리로 주제 결정
// =============================================
function resolveTopicFromFilename(filename) {
    var basename = path.basename(filename, path.extname(filename));
    var prefix = basename.substring(0, 3).trim();

    // 숫자인 경우 직접 테마 코드로 시도
    // 문자인 경우 THEME_MAP에서 매칭 시도
    // 또한 KO_INJEONG 코드도 체크 (3글자 코드: IMS, VOC, LOL 등)

    var lang = null;
    var tableName = null;
    var topic = null;

    // 1. KO_THEME에서 직접 매칭 (숫자 코드)
    if (CONST.KO_THEME.includes(prefix)) {
        lang = 'ko';
        tableName = 'kkutu_ko';
        topic = prefix;
    }
    // 2. EN_THEME에서 직접 매칭
    else if (CONST.EN_THEME.includes(prefix)) {
        lang = 'en';
        tableName = 'kkutu_en';
        topic = prefix;
    }
    // 3. KO_INJEONG에서 직접 매칭 (3글자 코드: IMS, VOC, LOL 등)
    else if (CONST.KO_INJEONG.includes(prefix)) {
        lang = 'ko';
        tableName = 'kkutu_ko';
        topic = prefix;
    }
    // 4. EN_INJEONG에서 직접 매칭
    else if (CONST.EN_INJEONG.includes(prefix)) {
        lang = 'en';
        tableName = 'kkutu_en';
        topic = prefix;
    }
    // 5. THEME_MAP을 통한 변환 시도
    else if (THEME_MAP[prefix] !== undefined && THEME_MAP[prefix] !== '0') {
        var mapped = THEME_MAP[prefix];
        if (CONST.KO_THEME.includes(mapped)) {
            lang = 'ko';
            tableName = 'kkutu_ko';
            topic = mapped;
        } else if (CONST.EN_THEME.includes(mapped)) {
            lang = 'en';
            tableName = 'kkutu_en';
            topic = mapped;
        }
    }

    return { lang: lang, tableName: tableName, topic: topic };
}

// =============================================
// 덮어씌우기 판단 (add_words.py 기반)
// =============================================

function shouldOverwrite(existingMean, existingTheme) {
    var meanEmptyOrMinimal = !existingMean || existingMean.trim() === '' || existingMean.trim() === '\uFF02\u0031\uFF02';
    var themeIsZero = !existingTheme || existingTheme.trim() === '0';

    if (meanEmptyOrMinimal && themeIsZero) return true;
    if (existingTheme && existingTheme.includes('TPW')) return true;

    return false;
}

// =============================================
// Main
// =============================================
async function main() {
    console.log("=== KKuTu Multi-File Word Adder (txt + tsv) ===");
    console.log("Scanning directory for .txt / .tsv files...");

    var files = fs.readdirSync(__dirname).filter(function (file) {
        return file.endsWith('.txt') || file.endsWith('.tsv');
    });

    if (files.length === 0) {
        console.log("No .txt or .tsv files found.");
        pool.end();
        process.exit(0);
    }

    console.log("Found " + files.length + " file(s).");

    for (var file of files) {
        var ext = path.extname(file).toLowerCase();
        if (ext === '.tsv') {
            await processTsvFile(file);
        } else {
            await processTxtFile(file);
        }
    }

    console.log("\n=== All done ===");
    pool.end();
}

// =============================================
// .txt 파일 처리 (파일명 앞 3자리로 주제 결정)
// =============================================
async function processTxtFile(filename) {
    console.log("\nProcessing [TXT] " + filename + "...");
    var filePath = path.join(__dirname, filename);
    var content = fs.readFileSync(filePath, 'utf8');
    var lines = content.split(/\r?\n/);

    if (lines.length === 0) {
        console.log("  [SKIP] File is empty.");
        return;
    }

    // 파일명 앞 3자리로 주제 결정
    var resolved = resolveTopicFromFilename(filename);

    if (!resolved.topic) {
        console.log("  [SKIP] Could not resolve topic from filename prefix '" + path.basename(filename).substring(0, 3) + "'.");
        return;
    }

    var tableName = resolved.tableName;
    var topic = resolved.topic;
    var lang = resolved.lang;

    console.log("  Topic: " + topic + " (" + lang + ") -> Table: " + tableName);

    // 모든 줄에서 단어 수집 (기존 첫 줄 주제 방식 제거)
    var words = [];
    for (var i = 0; i < lines.length; i++) {
        var lineParts = lines[i].split(',');
        for (var part of lineParts) {
            var w = part.trim();
            if (w) words.push(w);
        }
    }

    if (words.length === 0) {
        console.log("  [SKIP] No words found in file.");
        return;
    }

    console.log("  Found " + words.length + " words. Updating DB...");
    await updateDatabaseSimple(tableName, topic, words);
}

// =============================================
// .tsv 파일 처리 (파일명 앞 3자리로 주제 결정 + TSV 파싱)
// =============================================
async function processTsvFile(filename) {
    console.log("\nProcessing [TSV] " + filename + "...");
    var filePath = path.join(__dirname, filename);
    var content = fs.readFileSync(filePath, 'utf8');
    var lines = content.split(/\r?\n/);

    if (lines.length === 0) {
        console.log("  [SKIP] File is empty.");
        return;
    }

    // 파일명 앞 3자리로 글로벌 주제 결정
    var resolved = resolveTopicFromFilename(filename);
    var globalTopic = resolved.topic; // null이면 TSV 내부 주제 사용
    var tableName = resolved.tableName || 'kkutu_ko';
    var lang = resolved.lang || 'ko';

    if (globalTopic) {
        console.log("  Global Topic (from filename): " + globalTopic + " (" + lang + ") -> Table: " + tableName);
    } else {
        console.log("  No global topic from filename. Using per-row theme from TSV.");
        console.log("  -> Table: " + tableName);
    }

    // TSV 파싱: headword, input_word, pos, flag, theme, meaning
    // 같은 단어가 여러 행에 나올 수 있으므로 집계
    var wordsData = {};

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        var cols = line.split('\t');
        if (cols.length < 6) {
            console.log("  [WARN] Skipping row " + (i + 1) + " (cols < 6): " + line.substring(0, 50));
            continue;
        }

        var headword = cols[0].trim();
        var inputWord = cols[1].trim();
        var targetWord = inputWord || headword;
        var flagStr = cols[3].trim();
        var themeStr = cols[4].trim();

        // Flag 계산
        var userFlag = parseInt(flagStr) || 0;
        var dbFlag = 2; // 어인정 기본
        if (userFlag === 1) dbFlag |= 1; // 외래어

        // Theme 결정: 글로벌 주제 우선, 없으면 TSV 행의 theme 사용
        var finalTheme = globalTopic || getMappedTheme(themeStr);

        if (finalTheme.split(',').includes('1001')) {
            dbFlag |= 2;
        }

        if (!wordsData[targetWord]) {
            wordsData[targetWord] = {
                themes: new Set(),
                flag: dbFlag
            };
        }

        var entry = wordsData[targetWord];
        if (finalTheme !== '0' && finalTheme !== '') entry.themes.add(finalTheme);
        entry.flag |= dbFlag;
    }

    var wordKeys = Object.keys(wordsData);
    if (wordKeys.length === 0) {
        console.log("  [SKIP] No valid words found in TSV.");
        return;
    }

    console.log("  Parsed " + wordKeys.length + " unique words. Updating DB...");
    for (var theme of Array.from(new Set(Object.values(wordsData).flatMap(function (d) { return Array.from(d.themes); })))) {
        var wordsForTheme = Object.keys(wordsData).filter(function (w) { return wordsData[w].themes.has(theme); });
        await updateDatabaseSimple(tableName, theme, wordsForTheme);
    }
}

// =============================================
// DB 업데이트: .txt 단어 (기존 로직 + 덮어씌우기)
// =============================================
async function updateDatabaseSimple(table, theme, words) {
    var client;
    try {
        client = await pool.connect();

        var stats = { inserted: 0, updated: 0, skipped: 0, overwritten: 0, error: 0 };

        for (var word of words) {
            try {
                var res = await client.query(
                    "SELECT _id, type, theme, mean FROM " + table + " WHERE _id = $1", [word]
                );

                if (res.rowCount === 0) {
                    await client.query(
                        "INSERT INTO " + table + " (_id, type, theme, mean, flag, hit) VALUES ($1, 'INJEONG', $2, $3, 2, 0)",
                        [word, theme, "\uFF021\uFF02"]
                    );
                    stats.inserted++;
                } else {
                    var row = res.rows[0];

                    if (shouldOverwrite(row.mean, row.theme)) {
                        await client.query(
                            "UPDATE " + table + " SET type = $1, theme = $2, mean = $3, flag = $4 WHERE _id = $5",
                            ['INJEONG', theme, "\uFF021\uFF02", 2, word]
                        );
                        stats.overwritten++;
                    } else {
                        var existingTheme = row.theme || "";
                        var existingThemes = existingTheme.split(',');

                        if (existingThemes.includes(theme)) {
                            stats.skipped++;
                        } else {
                            var newTheme = existingTheme ? existingTheme + "," + theme : theme;
                            var newType = row.type ? row.type + ",INJEONG" : "INJEONG";

                            await client.query(
                                "UPDATE " + table + " SET type = $1, theme = $2 WHERE _id = $3",
                                [newType, newTheme, word]
                            );
                            stats.updated++;
                        }
                    }
                }
            } catch (err) {
                console.error("    ! Error processing word '" + word + "':", err.message);
                stats.error++;
            }
        }

        console.log("  Stats: Inserted " + stats.inserted + ", Overwritten " + stats.overwritten +
            ", Updated " + stats.updated + ", Skipped " + stats.skipped + ", Errors " + stats.error);

    } catch (e) {
        console.error("  DB Connection Error:", e.message);
    } finally {
        if (client) client.release();
    }
}


main().catch(function (e) { console.error(e); });
