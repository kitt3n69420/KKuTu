-- =============================================
-- 끄투엔 0.5주년 이벤트: 숫자로 보는 끄투엔
-- 테스트 서버: 2025-05-20 ~ 2025-07-02
-- 정식 서버:   2025-05-25 ~ 2025-07-02
-- =============================================

-- 1. 테이블 생성 (없을 경우)
CREATE TABLE IF NOT EXISTS event (
    _id character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    notice text DEFAULT '',
    start bigint NOT NULL,
    "end" bigint NOT NULL,
    expmul double precision NOT NULL DEFAULT 1,
    mnymul double precision NOT NULL DEFAULT 1,
    eventitem json DEFAULT NULL,
    itemmul double precision NOT NULL DEFAULT 0,
    PRIMARY KEY (_id)
);
ALTER TABLE event ADD COLUMN IF NOT EXISTS eventitem json DEFAULT NULL;
ALTER TABLE event ADD COLUMN IF NOT EXISTS itemmul double precision NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS itemexc (
    _id serial PRIMARY KEY,
    recipe json NOT NULL,
    result character varying(64) NOT NULL,
    eventid character varying(64) DEFAULT NULL
);

-- 2. 이벤트 등록

INSERT INTO event (_id, name, notice, start, "end", expmul, mnymul, eventitem, itemmul)
VALUES (
    'kkn_half',
    '0.5주년 이벤트: 숫자로 보는 끄투엔',
    '끄투엔 0.5주년 기념 이벤트! 게임을 플레이하고 숫자 블록을 모아 특별한 아이템으로 교환하세요.<br>이벤트 기간 중 경험치/핑 1.5배! <a href="/event/event.html" target="_blank">자세히 보기</a>',
    1779634800000,
    1783004400000,
    1.5,
    1.5,
    '["np0","np1","np2","np3","np4","np5","np6","np7","np8","np9"]',
    0.6
)
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 3. kkutu_shop: 아이템 등록 (cost=-1: 구매 불가)
-- =============================================

-- 3-1. 숫자 블록 np0~np9
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('np0', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np1', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np2', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np3', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np4', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np5', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np6', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np7', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np8', -1, 0, 7776000, 'eventcol', 1747666800000, '{}'),
('np9', -1, 0, 7776000, 'eventcol', 1747666800000, '{}')
ON CONFLICT (_id) DO NOTHING;

-- 3-2. 휘장 hwi_0~hwi_9 (AI:true 포함)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('hwi_0', -1, 0, 7776000, 'BDG2', 1747666800000, '{"gMNY":0.5,"AI":true}'),
('hwi_1', -1, 0, 7776000, 'BDG2', 1747666800000, '{"hEXP":50,"gEXP":0.25,"AI":true}'),
('hwi_2', -1, 0, 7776000, 'BDG2', 1747666800000, '{"gEXP":0.25,"gMNY":0.25,"AI":true}'),
('hwi_3', -1, 0, 7776000, 'BDG2', 1747666800000, '{"gEXP":0.5,"AI":true}'),
('hwi_4', -1, 0, 7776000, 'BDG2', 1747666800000, '{"hEXP":50,"gMNY":0.25,"AI":true}'),
('hwi_5', -1, 0, 7776000, 'BDG2', 1747666800000, '{"gEXP":0.25,"hMNY":50,"AI":true}'),
('hwi_6', -1, 0, 7776000, 'BDG2', 1747666800000, '{"hEXP":100,"AI":true}'),
('hwi_7', -1, 0, 7776000, 'BDG2', 1747666800000, '{"hMNY":100,"AI":true}'),
('hwi_8', -1, 0, 7776000, 'BDG2', 1747666800000, '{"hMNY":50,"gMNY":0.25,"AI":true}'),
('hwi_9', -1, 0, 7776000, 'BDG2', 1747666800000, '{"hEXP":50,"hMNY":50,"AI":true}')
ON CONFLICT (_id) DO NOTHING;

-- 3-3. 버전 기념 아이템 7종
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
-- v0.0 (1125): 천지창조 배경 - 분당 경험치 30 + 분당 핑 30
('kkn_genbg',    -1, 0, 7776000, 'Mback',   1747666800000, '{"hEXP":30,"hMNY":30,"AI":true}'),
-- v0.1 (1203): 새싹 머리 - 경험치 배율 1.15배 + 핑 배율 1.15배
('kkn_sprout',   -1, 0, 7776000, 'Mhead',   1747666800000, '{"gEXP":0.15,"gMNY":0.15}'),
-- v0.2 (1206): 끄투엔모자 - 핑 배율 1.3배
('kkn_hat',      -1, 0, 7776000, 'Mhead',   1747666800000, '{"gMNY":0.3}'),
-- v0.3 (1225): 삼색 이름 - 분당 경험치 60
('kkn_triname',  -1, 0, 7776000, 'NIK',     1747666800000, '{"hEXP":60}'),
-- v0.4 (0208): 한글 배경 - 경험치 배율 1.3배
('kkn_hangulbg', -1, 0, 7776000, 'Mback',   1747666800000, '{"gEXP":0.3}'),
-- v0.5 (0321): 봄빛 앞배경 - 분당 경험치 30 + 분당 핑 15 (레시피 3개 → 효과 3/4)
('kkn_springbg', -1, 0, 7776000, 'Mfront',  1747666800000, '{"hEXP":30,"hMNY":15}'),
-- v0.6 (0507): 육각 배경 - 분당 핑 30 + 경험치 배율 1.15배
('kkn_hexbg',    -1, 0, 7776000, 'Mback',   1747666800000, '{"hMNY":30,"gEXP":0.15}')
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 4. kkutu_shop_desc: 아이템 설명 등록
-- =============================================

-- 4-1. 숫자 블록 설명
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya") VALUES
('np0', '0 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '0 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '0 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np1', '1 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '1 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '1 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np2', '2 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '2 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '2 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np3', '3 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '3 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '3 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np4', '4 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '4 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '4 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np5', '5 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '5 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '5 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np6', '6 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '6 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '6 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np7', '7 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '7 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '7 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np8', '8 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '8 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '8 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.'),
('np9', '9 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록입니다.', '9 Block', 'A mysterious number block drawn to your KKuTu gameplay.', '9 블록', '당신의 끄투 플레이에 이끌린 신비한 숫자 블록이다냥.')
ON CONFLICT (_id) DO NOTHING;

-- 4-2. 휘장 설명
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya") VALUES
('hwi_0', '0-절대의 휘장', '완전무결한 다이아몬드와 0의 원이 하나로 합쳐진 휘장입니다.',
          '0-Badge of Absoluteness', 'A badge where a flawless diamond and the circle of 0 become one.',
          '0-절대의 휘장', '완전무결한 다이아몬드와 0의 원이 하나로 합쳐진 휘장이다냥.'),
('hwi_1', '1-시작의 휘장', '단 하나의 씨앗에서 세상이 피어나듯, 1과 새싹이 하나로 합쳐진 휘장입니다.',
          '1-Badge of Beginning', 'A badge where 1 and a sprouting seedling become one, as the world blooms from a single seed.',
          '1-시작의 휘장', '단 하나의 씨앗에서 세상이 피어나듯, 1과 새싹이 하나로 합쳐진 휘장이다냥.'),
('hwi_2', '2-쌍대의 휘장', '서로 다른 두 색이 경계를 맞대고 공존하듯, 2와 반반으로 나뉜 색이 하나로 합쳐진 휘장입니다.',
          '2-Badge of Duality', 'A badge where 2 and two contrasting colors meet side by side, each holding its ground.',
          '2-쌍대의 휘장', '서로 다른 두 색이 경계를 맞대고 공존하듯, 2와 반반으로 나뉜 색이 하나로 합쳐진 휘장이다냥.'),
('hwi_3', '3-균형의 휘장', '천칭이 완벽한 균형을 이루듯, 3과 천칭이 하나로 합쳐진 휘장입니다.',
          '3-Badge of Balance', 'A badge where 3 and a set of scales become one, their three points holding all in perfect equilibrium.',
          '3-균형의 휘장', '천칭의 세 지점이 완벽한 균형을 이루듯, 3과 천칭이 하나로 합쳐진 휘장이다냥.'),
('hwi_4', '4-사랑의 휘장', '카드의 네 무늬에 속하는 하트처럼 사방으로 넘치는 사랑, 4와 하트가 하나로 합쳐진 휘장입니다.',
          '4-Badge of Love', 'A badge where 4 and a heart become one, love overflowing in all four directions like a heart.',
          '4-사랑의 휘장', '카드의 네 무늬에 속하는 하트처럼 사방으로 넘치는 사랑, 4와 하트가 하나로 합쳐진 휘장이다냥.'),
('hwi_5', '5-조화의 휘장', '다섯 꼭짓점이 끊임없이 이어지는 펜타그램처럼, 5와 펜타그램이 하나로 합쳐진 휘장입니다.',
          '5-Badge of Harmony', 'A badge where 5 and a pentagram become one, five points endlessly connected in harmony.',
          '5-조화의 휘장', '다섯 꼭짓점이 끊임없이 이어지는 펜타그램처럼, 5와 펜타그램이 하나로 합쳐진 휘장이다냥.'),
('hwi_6', '6-흐름의 휘장', '모든 것을 적시며 쉼 없이 흐르는 물처럼, 6과 흐르는 물이 하나로 합쳐진 휘장입니다.',
          '6-Badge of Flow', 'A badge where 6 and flowing water become one, nourishing all as it flows without pause.',
          '6-흐름의 휘장', '모든 것을 적시며 쉼 없이 흐르는 물처럼, 6과 흐르는 물이 하나로 합쳐진 휘장이다냥.'),
('hwi_7', '7-행운의 휘장', '세상에서 가장 찾기 힘든 행운인 7과 네잎클로버가 하나로 합쳐진 휘장입니다.',
          '7-Badge of Fortune', 'A badge where 7 and a four-leaf clover become one — two of the rarest strokes of luck the world has to offer.',
          '7-행운의 휘장', '세상에서 가장 찾기 힘든 행운인 7과 네잎클로버가 하나로 합쳐진 휘장이다냥.'),
('hwi_8', '8-부의 휘장', '옆으로 누이면 무한(∞)이 되는 8과 끝없이 빛나는 보석이 하나로 합쳐진 휘장입니다.',
          '8-Badge of Wealth', 'A badge where 8 and brilliant jewels become one — turn it sideways and it becomes infinity (∞), wealth without end.',
          '8-부의 휘장', '옆으로 누이면 무한(∞)이 되는 8과 끝없이 빛나는 보석이 하나로 합쳐진 휘장이다냥.'),
('hwi_9', '9-영원의 휘장', '멈추지 않고 영원히 움직이는 시계처럼, 9와 시계가 하나로 합쳐진 휘장입니다.',
          '9-Badge of Eternity', 'A badge where 9 and a clock become one, ticking on forever without pause.',
          '9-영원의 휘장', '멈추지 않고 영원히 움직이는 시계처럼, 9와 시계가 하나로 합쳐진 휘장이다냥.')
ON CONFLICT (_id) DO NOTHING;

-- 4-3. 버전 기념 아이템 설명
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya") VALUES
('kkn_genbg',
 '천지창조 배경',
 '태초에 누군가가 끄투엔을 만들었다. 그가 말씀하시기를 ""서버가 생겨라"" 하시니, 서버가 생겼다.',
 'Genesis Background',
 'In the beginning, someone created the KKuTu_N and the server.',
 '천지창조 배경',
 '태초에 어떤 냥이가 끄투엔을 만들었다냥. 그 냥이가 말하기를 ""서버가 생겨라냥"" 하니, 서버가 생겼다냥.'),
('kkn_sprout',
 '새싹 머리',
 '될성부른 나무는 떡잎부터 다르대요. 끄투엔이 처음 세상에 나온 날, 어땠을까요?',
 'Sprout Head',
 'Sandalwood is fragrant even in seed leaf. What about here?',
 '새싹 머리',
 '될성부른 냐무는 떡잎부터 다르다냥. 끄투엔이 처음 세상에 냐온 냘, 어땠었냥?'),
('moremi_beanie',
 '모레미 비니',
 '모레미의 모습을 꼭 빼닮은 비니입니다.',
 'Moremi Beanie',
 'A beanie that closely resembles Moremi.',
 '모레미 비니',
 '모레미의 모습을 꼭 빼닮은 비니다냥.'),
('kkn_triname',
 '삼색 이름',
 '파랑, 주황, 빨강으로 아름답게 장식된 이름입니다.',
 'Tricolor Name',
 'A name beautifully decorated in blue, orange, and red.',
 '삼색 이름',
 '파랑, 주황, 빨강으로 아름답게 장식된 이름이다냥.'),
('kkn_hangulbg',
 '한글 배경',
 '끄투엔의 0.4 버전 출시를 기념하는 한글 배경입니다. 잘 찾아보면 뭔가 숨겨놓은 게 있을지도?',
 'Hangul Background',
 'A background commemorating the release of KKuTuEn version 0.4. If you look closely, you might find something hidden?',
 '한글 배경',
 '끄투엔의 0.4 버전 출시를 기념하는 한글 배경이다냥. 잘 찾아보면 뭔가 숨겨놓은 게 있을지도?' ),
('kkn_springbg',
 '봄빛 앞배경',
 '따스한 봄처럼 0.5 버전은 찾아왔어요.',
 'Spring Front Background',
 'Like a warm spring, version 0.5 has arrived.',
 '봄빛 앞배경',
 '따스한 봄처럼 0.5 버전은 찾아왔다냥.'),
('kkn_hexbg',
 '육각 배경',
 'K to the T to the N! 끄투엔 0.6 버전 출시를 기념하는 6각형 패턴의 배경입니다.',
 'Hexagonal Background',
 'K to the T to the N! A hexa6onal-patterned background commemorating the release of KKuTuEn version 0.6.',
 '육각 배경',
 'K to the T to the N! 끄투엔 0.6 버전 출시를 기념하는 6각형 패턴의 배경이다냥.')
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 5. itemexc: 교환 레시피 등록
-- =============================================

-- 5-1. 휘장 교환 (같은 숫자 블록 5개 → 해당 휘장)
INSERT INTO itemexc (recipe, result, eventid) VALUES
('{"np0":5}', 'hwi_0', 'kkn_half'),
('{"np1":5}', 'hwi_1', 'kkn_half'),
('{"np2":5}', 'hwi_2', 'kkn_half'),
('{"np3":5}', 'hwi_3', 'kkn_half'),
('{"np4":5}', 'hwi_4', 'kkn_half'),
('{"np5":5}', 'hwi_5', 'kkn_half'),
('{"np6":5}', 'hwi_6', 'kkn_half'),
('{"np7":5}', 'hwi_7', 'kkn_half'),
('{"np8":5}', 'hwi_8', 'kkn_half'),
('{"np9":5}', 'hwi_9', 'kkn_half');

-- 5-2. 버전 기념 아이템 교환 (날짜 숫자 조합)
INSERT INTO itemexc (recipe, result, eventid) VALUES
-- v0.0: 1125 → np1(2) + np2(1) + np5(1)
('{"np1":2,"np2":1,"np5":1}',         'kkn_genbg',    'kkn_half'),
-- v0.1: 1203 → np0(1) + np1(1) + np2(1) + np3(1)
('{"np0":1,"np1":1,"np2":1,"np3":1}', 'kkn_sprout',   'kkn_half'),
-- v0.2: 1206 → np0(1) + np1(1) + np2(1) + np6(1)
('{"np0":1,"np1":1,"np2":1,"np6":1}', 'kkn_hat',      'kkn_half'),
-- v0.3: 1225 → np1(1) + np2(2) + np5(1)
('{"np1":1,"np2":2,"np5":1}',         'kkn_triname',  'kkn_half'),
-- v0.4: 0208 → np0(2) + np2(1) + np8(1)
('{"np0":2,"np2":1,"np8":1}',         'kkn_hangulbg', 'kkn_half'),
-- v0.5: 0321 중 0 제외 → np1(1) + np2(1) + np3(1) (효과 3/4)
('{"np1":1,"np2":1,"np3":1}',         'kkn_springbg', 'kkn_half'),
-- v0.6: 0507 → np0(2) + np5(1) + np7(1)
('{"np0":2,"np5":1,"np7":1}',         'kkn_hexbg',    'kkn_half');
