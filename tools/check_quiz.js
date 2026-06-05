/*
 * KKuTu Quiz Inspector
 *
 * Usage: node check_quiz.js
 *
 * Checks:
 *   [DB]  1. 각 주제별 난이도(1/2/3)에 문제가 있는지
 *   [DB]  2. answer_ko가 NULL인 문제
 *   [DB]  3. 중복 (question, answer_ko) — PK 충돌 가능성
 *   [TSV] 4. 각 TSV 파일의 형식 유효성
 *   [TSV] 5. answer_ko가 NULL/"NULL"인 행
 *   [TSV] 6. 난이도 값이 1/2/3이 아닌 행
 *   [TSV] 7. topic 코드가 파일명 prefix와 다른 행
 *   [TSV] 8. TSV 내/파일간 중복 PK (question, answer_ko)
 */

var fs = require('fs');
var path = require('path');

module.paths.push(path.join(__dirname, '../Server/lib/node_modules'));
module.paths.push(path.join(__dirname, '../Server/node_modules'));

try {
    var pg = require('pg');
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

// nya.json 기준 알려진 주제 목록 (MATH는 실시간 생성이라 DB 미존재 정상)
var KNOWN_TOPICS = ['MATH', 'CHEM', 'CAPI', 'CNTR', 'UNIT', 'NUMG', 'ASTR', 'ARTS', 'ANML', 'GAME', 'LITR', 'DAJK', 'CHTR', 'FDCK'];
var DYNAMIC_TOPICS = ['MATH']; // DB에 없어도 되는 실시간 생성 주제
var VALID_DIFFICULTIES = [1, 2, 3];

var pool = new pg.Pool(config);

// 출력 헬퍼
var issueCount = 0;
function issue(tag, msg) {
    issueCount++;
    console.log('  [' + tag + '] ' + msg);
}
function ok(msg) {
    console.log('  [OK] ' + msg);
}
function section(title) {
    console.log('\n' + '='.repeat(60));
    console.log(' ' + title);
    console.log('='.repeat(60));
}

// ────────────────────────────────────────────────────────────
// DB 점검
// ────────────────────────────────────────────────────────────
async function checkDB(client) {
    section('DB 점검');

    // 1. 주제별 난이도 커버리지
    console.log('\n[1] 주제별 난이도 커버리지');
    var res = await client.query(
        "SELECT topic, difficulty, COUNT(*) as cnt FROM quiz GROUP BY topic, difficulty ORDER BY topic, difficulty"
    );

    // topic -> Set<difficulty>
    var topicDiff = {};
    for (var row of res.rows) {
        var t = row.topic;
        if (!topicDiff[t]) topicDiff[t] = {};
        topicDiff[t][parseInt(row.difficulty)] = parseInt(row.cnt);
    }

    var dbTopics = Object.keys(topicDiff).sort();
    if (dbTopics.length === 0) {
        issue('WARN', 'quiz 테이블에 데이터가 없습니다.');
    } else {
        for (var topic of dbTopics) {
            var diffs = topicDiff[topic];
            var missing = VALID_DIFFICULTIES.filter(function(d) { return !diffs[d]; });
            var summary = VALID_DIFFICULTIES.map(function(d) {
                return '난이도' + d + ':' + (diffs[d] ? diffs[d] + '문제' : '없음');
            }).join(', ');
            if (missing.length > 0) {
                issue('MISS', topic + ' — ' + summary + ' | 누락 난이도: ' + missing.join(', '));
            } else {
                ok(topic + ' — ' + summary);
            }
        }
    }

    // nya.json 기준 DB에 없는 주제 확인
    var missingTopics = KNOWN_TOPICS.filter(function(t) {
        return !DYNAMIC_TOPICS.includes(t) && !topicDiff[t];
    });
    if (missingTopics.length > 0) {
        issue('MISS', 'DB에 데이터 없는 주제: ' + missingTopics.join(', '));
    }

    // 2. answer_ko가 NULL인 문제
    console.log('\n[2] answer_ko가 NULL인 문제');
    var nullRes = await client.query(
        "SELECT topic, question, difficulty FROM quiz WHERE answer_ko IS NULL OR answer_ko = '' ORDER BY topic"
    );
    if (nullRes.rows.length === 0) {
        ok('answer_ko NULL 없음');
    } else {
        for (var row of nullRes.rows) {
            issue('NULL', '[' + row.topic + '] 난이도' + row.difficulty + ' — "' + row.question + '"');
        }
    }

    // 3. (question, answer_ko) 중복 확인
    console.log('\n[3] (question, answer_ko) 중복 PK 확인');
    var dupRes = await client.query(
        "SELECT question, answer_ko, COUNT(*) as cnt FROM quiz GROUP BY question, answer_ko HAVING COUNT(*) > 1"
    );
    if (dupRes.rows.length === 0) {
        ok('중복 PK 없음');
    } else {
        for (var row of dupRes.rows) {
            issue('DUP', '"' + row.question + '" + "' + row.answer_ko + '" — ' + row.cnt + '건 중복');
        }
    }

    // 4. 같은 question이 여러 topic에 등록된 경우 (데이터 품질 경고)
    console.log('\n[4] 동일 문장이 여러 주제에 등록된 문제 (품질 경고)');
    var multiTopicRes = await client.query(
        "SELECT question, array_agg(DISTINCT topic) as topics FROM quiz GROUP BY question HAVING COUNT(DISTINCT topic) > 1 ORDER BY question"
    );
    if (multiTopicRes.rows.length === 0) {
        ok('중복 없음');
    } else {
        for (var row of multiTopicRes.rows) {
            issue('WARN', '"' + row.question + '" — 주제: ' + row.topics.join(', '));
        }
    }
}

// ────────────────────────────────────────────────────────────
// TSV 점검
// ────────────────────────────────────────────────────────────
function checkTsv() {
    section('TSV 파일 점검');

    var files = fs.readdirSync(__dirname).filter(function(f) { return f.endsWith('.tsv'); });
    if (files.length === 0) {
        console.log('  TSV 파일이 없습니다.');
        return;
    }
    console.log('  발견된 TSV 파일: ' + files.join(', ') + '\n');

    // 전체 파일간 PK 중복 추적용
    var globalPkMap = {}; // "question\tanswerKo" -> "filename:lineNum"

    for (var filename of files) {
        var topicPrefix = filename.substring(0, 4).toUpperCase();
        console.log('--- ' + filename + ' (예상 주제: ' + topicPrefix + ')');

        var filePath = path.join(__dirname, filename);
        var content;
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            issue('ERR', filename + ' 읽기 실패: ' + e.message);
            continue;
        }

        var lines = content.split(/\r?\n/);
        var localPkMap = {}; // 파일 내 중복 추적
        var fileIssues = 0;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line.trim()) continue;
            var lineNum = i + 1;
            var cols = line.split('\t');

            // 컬럼 수 검사 (topic 컬럼 없는 6열도 허용)
            if (cols.length < 6) {
                issue('FMT', filename + ':' + lineNum + ' — 컬럼 수 부족 (' + cols.length + '개, 최소 6 필요)');
                fileIssues++;
                continue;
            }

            // topic 컬럼 있는 경우(7열) vs 없는 경우(6열) 정규화
            var hasTopic = (cols.length >= 7);
            var rowTopic   = hasTopic ? cols[0].trim() : topicPrefix;
            var question   = hasTopic ? cols[1].trim() : cols[0].trim();
            var ansKo      = hasTopic ? cols[2].trim() : cols[1].trim();
            var ansEn      = hasTopic ? cols[3].trim() : cols[2].trim();
            var diff       = hasTopic ? cols[6].trim() : cols[5].trim();

            // topic 코드 불일치
            if (rowTopic && rowTopic !== topicPrefix && rowTopic.toUpperCase() !== topicPrefix) {
                issue('TOPIC', filename + ':' + lineNum + ' — topic 코드 "' + rowTopic + '"이 파일명 prefix "' + topicPrefix + '"과 다름');
                fileIssues++;
            }

            // question 비어있음
            if (!question) {
                issue('NULL', filename + ':' + lineNum + ' — question이 비어있음');
                fileIssues++;
                continue;
            }

            // answer_ko NULL 검사
            var ansKoNull = (!ansKo || ansKo.toUpperCase() === 'NULL');
            if (ansKoNull) {
                issue('NULL', filename + ':' + lineNum + ' — answer_ko가 NULL: "' + question + '"');
                fileIssues++;
            }

            // 난이도 값 검사
            var diffNum = parseInt(diff);
            if (!diff || isNaN(diffNum) || !VALID_DIFFICULTIES.includes(diffNum)) {
                issue('DIFF', filename + ':' + lineNum + ' — 잘못된 난이도 값 "' + diff + '" (유효값: 1/2/3): "' + question + '"');
                fileIssues++;
            }

            // 파일 내 PK 중복
            var pk = question + '\t' + ansKo;
            if (localPkMap[pk]) {
                issue('DUP', filename + ':' + lineNum + ' — 파일 내 중복 PK (앞서 ' + localPkMap[pk] + '행에 동일 항목): "' + question + '"');
                fileIssues++;
            } else {
                localPkMap[pk] = lineNum;
            }

            // 파일간 PK 중복
            if (globalPkMap[pk]) {
                issue('DUP', filename + ':' + lineNum + ' — 다른 파일과 중복 PK (' + globalPkMap[pk] + '): "' + question + '"');
                fileIssues++;
            } else {
                globalPkMap[pk] = filename + ':' + lineNum;
            }
        }

        if (fileIssues === 0) {
            ok(filename + ' 이상 없음');
        } else {
            console.log('  => ' + fileIssues + '개 이슈 발견');
        }
    }

    // TSV 파일에 없는 주제 목록 (DB만 있거나 아예 없는 것)
    var tsvTopics = files.map(function(f) { return f.substring(0, 4).toUpperCase(); });
    var noTsvTopics = KNOWN_TOPICS.filter(function(t) {
        return !DYNAMIC_TOPICS.includes(t) && !tsvTopics.includes(t);
    });
    if (noTsvTopics.length > 0) {
        console.log('\n  TSV 파일 없는 주제 (DB 직접 입력이거나 미등록): ' + noTsvTopics.join(', '));
    }
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────
async function main() {
    console.log('='.repeat(60));
    console.log(' KKuTu 퀴즈 점검 스크립트');
    console.log(' ' + new Date().toLocaleString('ko-KR'));
    console.log('='.repeat(60));

    // TSV 점검은 DB 불필요
    checkTsv();

    // DB 점검
    var client;
    try {
        client = await pool.connect();
        await checkDB(client);
    } catch (e) {
        console.error('\nDB 연결 실패:', e.message);
        console.log('(DB 점검을 건너뜁니다)');
    } finally {
        if (client) client.release();
        pool.end();
    }

    section('점검 완료');
    console.log(' 총 이슈: ' + issueCount + '개');
    if (issueCount === 0) {
        console.log(' 이상 없음.');
    }
    console.log('');
}

main().catch(function(err) {
    console.error('Unhandled Error:', err);
    process.exit(1);
});
