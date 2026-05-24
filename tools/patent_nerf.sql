-- 특허 (KPT 테마) 단어 너프
-- kkutu_ko 테이블에서 theme에 KPT가 포함된 단어에 대해
--   8글자 이상  → hit = 6
--   16글자 이상 → hit = 3
--   24글자 이상 → hit = 1
--
-- CHAR_LENGTH: 한글 등 멀티바이트 문자를 글자 수로 계산
-- theme ~ '...' : KPT가 다른 코드의 일부가 아닌 독립 값임을 보장

UPDATE kkutu_ko
SET hit = CASE
    WHEN CHAR_LENGTH(_id) >= 26 THEN -999
    WHEN CHAR_LENGTH(_id) >= 24 THEN 0
    WHEN CHAR_LENGTH(_id) >= 22 THEN 1
    WHEN CHAR_LENGTH(_id) >= 20 THEN 2
    WHEN CHAR_LENGTH(_id) >= 18 THEN 3
    WHEN CHAR_LENGTH(_id) >= 16 THEN 4
    WHEN CHAR_LENGTH(_id) >= 14 THEN 5
    WHEN CHAR_LENGTH(_id) >= 12 THEN 6
    WHEN CHAR_LENGTH(_id) >= 10 THEN 7
    ELSE 8
END
WHERE theme = 'KPT'
  AND CHAR_LENGTH(_id) >= 8;
