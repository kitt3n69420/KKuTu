/**
 * 효과 없는 아이템에 gmny/gexp 효과를 부여하는 SQL 생성 스크립트
 *
 * 규칙:
 *   일반 아이템 : base = floor(cost / 100)
 *   조합 아이템 : base = floor((재료1_cost + 재료2_cost) * 1.7 / 100)
 *   분배 : gMNY = random(0~base) * 0.01, gEXP = (base - gMNY) * 0.01  → 퍼센트 배수 저장
 *   0인 항목은 options에 포함하지 않음 / 기존 options(gif 등)는 유지하며 추가
 *
 * 사용법:
 *   node item_effects.js              # 화면 출력
 *   node item_effects.js > out.sql    # 파일로 저장 후 psql로 실행
 */

'use strict';

const path = require('path');
const { Client } = require('../Server/lib/node_modules/pg');
const GLOBAL = require('../Server/lib/sub/global.json');

const client = new Client({
  host:     GLOBAL.PG_HOST,
  port:     GLOBAL.PG_PORT,
  database: GLOBAL.PG_DATABASE,
  user:     GLOBAL.PG_USER,
  password: GLOBAL.PG_PASSWORD,
});

async function main() {
  await client.connect();

  // gMNY/gEXP가 없는 아이템 (gif 등 기존 속성이 있어도 포함)
  const { rows: targets } = await client.query(`
    SELECT _id, cost, options
    FROM kkutu_shop
    WHERE options IS NULL
       OR options::text = '{}'
       OR (NOT (options::jsonb ? 'gMNY') AND NOT (options::jsonb ? 'gEXP'))
    ORDER BY _id
  `);

  // 전체 아이템 가격 맵 (재료 조회용)
  const { rows: allItems } = await client.query(`SELECT _id, cost FROM kkutu_shop`);
  const costMap = {};
  for (const row of allItems) costMap[row._id] = Number(row.cost);

  // 조합 레시피: result -> { item1, item2 }  (같은 result의 첫 번째 레시피만 사용)
  const { rows: recipes } = await client.query(`SELECT item1, item2, result FROM crafting`);
  const craftMap = {};
  for (const row of recipes) {
    if (!craftMap[row.result]) craftMap[row.result] = { item1: row.item1, item2: row.item2 };
  }

  await client.end();

  const lines = ['BEGIN;'];
  let updated = 0, skipped = 0;

  for (const { _id, cost, options } of targets) {
    const itemCost = Number(cost);
    let estimated;

    if (itemCost === -1) {
      // crafting 테이블에 레시피가 있으면 조합 아이템
      const recipe = craftMap[_id];
      if (!recipe) {
        lines.push(`-- SKIP ${_id}: 조합 레시피 없음`);
        skipped++;
        continue;
      }
      const c1 = Math.max(0, costMap[recipe.item1] || 0);
      const c2 = Math.max(0, costMap[recipe.item2] || 0);
      if (c1 === 0 && c2 === 0) {
        lines.push(`-- SKIP ${_id}: 재료(${recipe.item1}, ${recipe.item2}) 가격 불명`);
        skipped++;
        continue;
      }
      estimated = (c1 + c2) * 1.7;
    } else if (itemCost <= 0) {
      lines.push(`-- SKIP ${_id}: cost=${itemCost} (무료 또는 불명)`);
      skipped++;
      continue;
    } else {
      estimated = itemCost;
    }

    const base = Math.floor(estimated / 100);
    if (base <= 0) {
      lines.push(`-- SKIP ${_id}: base=0 (추정가=${Math.floor(estimated)})`);
      skipped++;
      continue;
    }

    // 0~base 균등 랜덤 → 0.01 곱해 퍼센트 배수로 저장, 0인 항목은 제외
    const rawGmny = Math.floor(Math.random() * (base + 1));
    const rawGexp = base - rawGmny;

    // 기존 options 유지 (gif 등) 후 gMNY/gEXP 추가
    const opts = Object.assign({}, options || {});
    if (rawGmny > 0) opts.gMNY = rawGmny * 0.01;
    if (rawGexp > 0) opts.gEXP = rawGexp * 0.01;

    const safeId = _id.replace(/'/g, "''");
    lines.push(`UPDATE kkutu_shop SET options = '${JSON.stringify(opts)}' WHERE _id = '${safeId}';`);
    updated++;
  }

  lines.push('COMMIT;');
  lines.push(`-- 완료: ${updated}개 업데이트 예정, ${skipped}개 스킵`);
  console.log(lines.join('\n'));
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
