-- 끄투 상점(kkutu_shop_desc) 설명에 냥체 일본어(nyaj) 칼럼 추가.
-- main.js는 Language의 각 언어마다 name_${lang}/desc_${lang} 칼럼을 읽어 Language[lang].SHOP을 만든다.
-- 값이 비어 있으면(NULL·빈 문자열) main.js SHOP_FALLBACK을 따라 넘어간다:
--   en_US → ko_KR, ja_JP → en_US, nya → ko_KR, nyaj → ja_JP, lol(칼럼 없음) → en_US
-- 그래서 새 칼럼은 비워 둔 채로 두면 일본어 이름·설명이 보인다. 냥체 번역은 나중에 채우면 됨.
-- 사용법: psql -d <dbname> -f add_kkutu_shop_nyaj.sql

ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "name_nyaj" text;
ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "desc_nyaj" text;
