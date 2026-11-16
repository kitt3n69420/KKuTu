-- =============================================
-- 옷장 (프로필 관리 → 옷장 탭)
--   지금 착용한 것(모레미·이름 스킨·휘장·배경 등 착용 칸 전부)을 4칸 중 하나에 저장하고, 언제든 그 모습으로 바꿔 입는다.
--   값 모양: {"slots": [ {"equip": {"Mhead": "nekomimi", ...}, "at": 1794...} 또는 null, ... 4개 ]}
--   (배열을 바로 두지 않고 객체로 감싼 이유: sub/collection.js가 JS 배열을 PostgreSQL 배열 문법으로 바꿔 저장하기 때문)
-- 게임 서버는 users를 저장할 때 money/kkutu/box/equip/friends만 고치므로 이 열은 덮어쓰지 않는다.
-- 이 파일은 여러 번 실행해도 된다.
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS wardrobe json;
