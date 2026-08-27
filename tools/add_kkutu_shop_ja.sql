-- 끄투 상점(kkutu_shop_desc) 설명에 일본어(ja_JP) 컬럼 추가.
-- main.js는 Language 객체의 각 키(ko_KR/en_US/ja_JP/nya)마다 name_${lang}/desc_${lang}
-- 컬럼을 읽어 Language[lang].SHOP을 구성하는데, ja_JP 언어팩은 이미 존재하지만
-- kkutu_shop_desc 테이블에는 해당 컬럼이 없어 일본어 클라이언트에는 상점 아이템명/설명이
-- 비어 보인다. 이 스크립트를 실제 DB에 한 번 적용해야 한다.
-- 신규 컬럼은 우선 name_en_US/desc_en_US 값을 플레이스홀더로 복사해 채운다
-- (추후 실제 일본어 번역으로 교체 예정).
-- 사용법: psql -d <dbname> -f add_kkutu_shop_ja.sql

ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "name_ja_JP" text;
ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "desc_ja_JP" text;

UPDATE kkutu_shop_desc
SET "name_ja_JP" = "name_en_US",
    "desc_ja_JP" = "desc_en_US"
WHERE "name_ja_JP" IS NULL;
