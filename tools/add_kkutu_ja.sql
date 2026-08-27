-- 일본어 끝말잇기(JSH)/앞말잇기(JAP) 모드를 위한 kkutu_ja 테이블 생성.
-- db.js의 LANG 배열에 "ja"를 추가하면 DB.kkutu.ja / MainDB.kkutu['ja']를 코드 전반에서
-- 참조하게 되지만 db.sql 스키마에는 존재하지 않으므로, 이 스크립트를 실제 DB에 한 번 적용해야 한다.
-- (tools/add_kkutu_cw_en.sql과 동일한 목적/패턴)
-- 사용법: psql -d <dbname> -f add_kkutu_ja.sql

CREATE TABLE kkutu_ja (
    _id character varying(256) NOT NULL,
    headword text NOT NULL,
    type text,
    mean text NOT NULL,
    hit integer DEFAULT 100 NOT NULL,
    theme text,
    flag integer DEFAULT 0
);

ALTER TABLE kkutu_ja OWNER TO postgres;

-- KO/EN(kkutu_ko/kkutu_en)에는 명시적 PK가 없지만, jmdict_etl.js가 ON CONFLICT (_id)로
-- 재실행 시 중복 삽입을 막을 수 있도록 kkutu_ja에는 PK를 건다.
ALTER TABLE ONLY kkutu_ja
    ADD CONSTRAINT kkutu_ja_pkey PRIMARY KEY (_id);
