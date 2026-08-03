-- 영어 십자말풀이(ECW) 모드를 위한 kkutu_cw_en 테이블 생성.
-- db.js가 LANG=["ko","en"]를 순회하며 DB.kkutu_cw['en']을 이미 코드상으로 참조하지만
-- db.sql 스키마에는 kkutu_cw_ko만 존재하므로, 이 스크립트를 실제 DB에 한 번 적용해야 한다.
-- 사용법: psql -d <dbname> -f add_kkutu_cw_en.sql

CREATE TABLE kkutu_cw_en (
    _id integer NOT NULL,
    map text,
    data text
);

ALTER TABLE kkutu_cw_en OWNER TO postgres;

CREATE SEQUENCE kkutu_cw_en__id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE kkutu_cw_en__id_seq OWNER TO postgres;

ALTER SEQUENCE kkutu_cw_en__id_seq OWNED BY kkutu_cw_en._id;

ALTER TABLE ONLY kkutu_cw_en ALTER COLUMN _id SET DEFAULT nextval('kkutu_cw_en__id_seq'::regclass);

ALTER TABLE ONLY kkutu_cw_en
    ADD CONSTRAINT kkutu_cw_en_key PRIMARY KEY (_id);
