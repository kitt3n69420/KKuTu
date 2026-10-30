-- =============================================
-- 처벌 내역 테이블
-- =============================================

-- 인게임 #ban/#ipban/#unban/#ipunban 과 디스코드 /ban /ipban /unban /ipunban 이 기록하고,
-- /legal/punishment 페이지가 이 테이블을 그대로 읽어 보여준다.
-- kind: ban(게임 차단), ipban(IP 차단), nick(닉네임 변경), reset(스탯 초기화). 쉼표로 여러 개를 함께 적을 수 있다. (예: 'ban,nick')
-- name: 페이지에 보일 별명. 기록할 때 이미 가린 상태로 저장한다.
-- expires: 제재 만료 시각(ms). NULL이면 영구.
-- liftedat/liftedby: unban 명령으로 해제된 시각/관리자.
CREATE TABLE IF NOT EXISTS punishment (
    _id serial PRIMARY KEY,
    target varchar(64) NOT NULL,
    name varchar(64),
    kind varchar(64) NOT NULL,
    reason text NOT NULL,
    note text,
    expires bigint,
    admin varchar(64),
    createdat bigint NOT NULL,
    liftedat bigint,
    liftedby varchar(64)
);
CREATE INDEX IF NOT EXISTS punishment_target_idx ON punishment (target);

-- =============================================
-- 기존 punishment.pug 에 손으로 적어 두던 내역 이관 (테이블이 비어 있을 때만)
-- 같은 날짜끼리는 _id가 클수록 위에 보이므로 오래된 것부터 넣는다.
-- =============================================
INSERT INTO punishment (target, name, kind, reason, note, expires, createdat)
SELECT target, name, kind, reason, note,
       CASE WHEN days IS NULL THEN NULL ELSE (EXTRACT(EPOCH FROM at + make_interval(days => days)) * 1000)::bigint END,
       (EXTRACT(EPOCH FROM at) * 1000)::bigint
FROM (VALUES
    (TIMESTAMPTZ '2026-03-19 23:19+09', 'discord-1153229325420740628', '고**', 'reset', '보안 취약점을 사용해 비정상적으로 많은 경험치를 얻음', NULL::text, NULL::int),
    (TIMESTAMPTZ '2026-06-05 20:18+09', '106918281277734572679', '스****함', 'ban', '비인가 프로그램의 사용 (복사 붙여넣기)', NULL, NULL),
    (TIMESTAMPTZ '2026-06-20 23:21+09', '101054477049982057464', '나****투', 'ban', '비인가 프로그램의 사용 (복사 붙여넣기)', NULL, NULL),
    (TIMESTAMPTZ '2026-06-26 21:20+09', '113378966148536389836', 'W*****정', 'ban', '비인가 프로그램의 사용 (복사 붙여넣기)', NULL, NULL),
    (TIMESTAMPTZ '2026-06-26 21:20+09', '110779070764239512441', '종*****의', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 종*** *베', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '107357686225601069374', '유*107**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 원*****쌈', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '101981882782568259320', '유*101**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 성*** **이', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '112697016224857212263', '유*112**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 비********섭', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '104451793668135991841', '유*104**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 미** *** *카', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '116729883510009148527', '유*116**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 느* *모', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '103768717304661402895', '유*103**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 노**********려', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '110684581019323486720', '유*110**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 굿**노', NULL),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '105159534396839887854', '유*105**', 'ban,nick', '닉네임에서의 부적절한 단어 사용 (성적 단어) 및 부적절한 채팅 (선정적인 언어)', '이전 닉네임: 사****이', 30),
    (TIMESTAMPTZ '2026-07-11 05:28+09', '114518727161207434891', '유*114**', 'ban,nick', '닉네임에서의 부적절한 단어 사용 (성적 단어) 및 부적절한 채팅 (선정적인 언어)', '이전 닉네임: 아*****기', 30),
    (TIMESTAMPTZ '2026-07-21 00:00+09', '116215902367063762718', '유*116**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 윤******)', NULL),
    (TIMESTAMPTZ '2026-07-21 00:00+09', '103316122080840187270', '유*103**', 'nick', '닉네임에서의 부적절한 단어 사용', '이전 닉네임: 포**** **이', NULL),
    (TIMESTAMPTZ '2026-07-21 00:00+09', '104451793668135991841', '유*104**', 'ban,nick', '닉네임에서의 부적절한 단어 사용 (2회)', '이전 닉네임: 윤****긔', 7),
    (TIMESTAMPTZ '2026-07-21 00:00+09', '101981882782568259320', '유*101**', 'ban,nick', '닉네임에서의 부적절한 단어 사용 (2회)', '이전 닉네임: 성*** **이', 7),
    (TIMESTAMPTZ '2026-07-24 22:25+09', '104643622207642729638', '기*********고', 'ban', '비인가 프로그램의 사용 (자동완성)', NULL, NULL),
    (TIMESTAMPTZ '2026-08-20 00:00+09', '107959728701161422252', '유저*107**', 'nick', '부적절한 닉네임', '이전 닉네임: 손*****3', NULL),
    (TIMESTAMPTZ '2026-08-20 00:00+09', '108637178540905719514', '유*108**', 'ban,nick', '부적절한 닉네임, 부적절한 채팅(욕설)', '이전 닉네임: 포*********이', 7),
    (TIMESTAMPTZ '2026-09-11 00:00+09', '211.182.***.***', NULL, 'ipban', '1, 지속적으로 유저들에게 불쾌한 방 이름 사용', NULL, NULL),
    (TIMESTAMPTZ '2026-09-11 00:00+09', '211.182.***.***', NULL, 'ipban', '1, 해당 아이피로 접속한 다수의 이용자가 부적절한 언행을 함', NULL, NULL)
) AS v(at, target, name, kind, reason, note, days)
WHERE NOT EXISTS (SELECT 1 FROM punishment);
