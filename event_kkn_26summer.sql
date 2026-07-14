-- =============================================
-- 여름 이벤트: 끄투엔의 여름나기
-- 기간: 2026-07-15 00:00 ~ 2026-09-01 00:00 (KST)
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
-- 물방울 드롭률 = WPC(글자조각)의 100%, 얼음조각 드롭률 = WPC의 50% (itemmul 1.5를 2:1로 분배)

INSERT INTO event (_id, name, notice, start, "end", expmul, mnymul, eventitem, itemmul)
VALUES (
    'kkn_26summer',
    '끄투엔의 여름나기',
    '끄투엔의 이용약관이 8월 1일부터 변경됩니다. 변경된 이용 약관은 <a href="/legal/terms" target="_blank">여기</a>에서 확인하세요. <br>무더운 여름을 시원하게! 게임을 플레이하고 물방울과 얼음 조각을 모아 여름 한정 아이템으로 교환하세요.<br>이벤트 기간 중 경험치 2배! <a href="/event/events_26summer.html" target="_blank">자세히 보기</a>',
    1784073600000,
    1788220800000,
    2,
    1,
    '["waterdrop","waterdrop","ice_cube"]',
    1.5
)
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 3. kkutu_shop: 아이템 등록 (cost=-1: 구매 불가)
-- =============================================

-- 3-1. 이벤트 수집품 (물방울, 얼음 조각)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('waterdrop', -1, 0, 0, 'eventcol', 1784073600000, '{}'),
('ice_cube',  -1, 0, 0, 'eventcol', 1784073600000, '{}')
ON CONFLICT (_id) DO NOTHING;

-- 3-2. 직접구매 5종 (핑으로 상시 구매, term=0 영구)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('water_bottle', 200, 0, 0, 'Mhand',    1784073600000, '{"gMNY":0.01,"gEXP":0.01}'),
('iced_coffee',  300, 0, 0, 'Mhand',    1784073600000, '{"gMNY":0.01,"gEXP":0.02}'),
('hand_fan',     400, 0, 0, 'Mhand',    1784073600000, '{"gMNY":0.02,"gEXP":0.02}'),
('droplet_bere', 600, 0, 0, 'Mhead',    1784073600000, '{"gMNY":0.03,"gEXP":0.03}'),
('blue_tube',    700, 0, 0, 'Mclothes', 1784073600000, '{"gMNY":0.03,"gEXP":0.04}')
ON CONFLICT (_id) DO NOTHING;

-- 3-3. 교환 전용 8종 (cost=-1, 물의 휘장/얼음의 휘장만 3개월 기간제)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('b3_water',        -1, 0, 7776000, 'BDG3',     1784073600000, '{"gMNY":0.02}'),
('seawave_cloth',   -1, 0, 0,       'Mclothes', 1784073600000, '{"hMNY":5}'),
('flamingo_tube',   -1, 0, 0,       'Mclothes', 1784073600000, '{"hEXP":9}'),
('beach',           -1, 0, 0,       'Mback',    1784073600000, '{"gMNY":0.07}'),
('b3_ice',          -1, 0, 7776000, 'BDG3',     1784073600000, '{"gEXP":0.02}'),
('melted_icecream', -1, 0, 0,       'Mhead',    1784073600000, '{"hEXP":5}'),
('ice_bucket',      -1, 0, 0,       'Mhead',    1784073600000, '{"gEXP":0.05}'),
('bingsu',          -1, 0, 0,       'Mclothes', 1784073600000, '{"hMNY":13}')
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 4. kkutu_shop_desc: 아이템 설명 등록
-- =============================================

-- 4-1. 이벤트 수집품 설명
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya") VALUES
('waterdrop', '물방울', '당신의 끄투 플레이에 이끌려 맺힌 신비한 물방울입니다.',
              'Waterdrop', 'A mysterious droplet of water drawn to your KKuTu gameplay.',
              '물방울', '당신의 끄투 플레이에 이끌려 맺힌 신비한 물방울이다냥.'),
('ice_cube', '얼음 조각', '당신의 끄투 플레이에 이끌려 얼어붙은 신비한 얼음 조각입니다.',
              'Ice Shard', 'A mysterious ice shard frozen by your KKuTu gameplay.',
              '얼음 조각', '당신의 끄투 플레이에 이끌려 얼어붙은 신비한 얼음 조각이다냥.')
ON CONFLICT (_id) DO NOTHING;

-- 4-2. 직접구매 5종 설명
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya") VALUES
('water_bottle', '생수병', '무더운 여름, 목을 축여줄 시원한 생수 한 병입니다.',
                 'Water Bottle', 'A cool bottle of water to quench your thirst on a hot summer day.',
                 '생수병', '무더운 여름, 목을 축여줄 시원한 생수 한 병이다냥.'),
('iced_coffee', '아이스커피', '얼어 죽어도 아이스커피!',
                'Iced Coffee', 'I`ll drink iced coffee even if I freeze to death!',
                '아이스커피', '얼어 죽어도 아이스커피다냥!'),
('hand_fan', '손 선풍기', '하나만 가지고 있어도 여름날이 시원해져요.',
             'Hand Fan', 'A portable hand fan that brings a cool breeze wherever you go.',
             '손 선풍기', '하냐만 가지고 있어도 여름냘이 시원해진다냥.'),
('droplet_bere', '물방울 베레모', '동글동글 물방울 모양의 귀여운 베레모입니다.',
                 'Droplet Beret', 'A cute beret shaped like a round little water droplet.',
                 '물방울 베레모', '동글동글 물방울 모양이 귀여운 베레모다냥.'),
('blue_tube', '파란 튜브', '시원한 파란빛 튜브를 몸에 두르고 물놀이를 즐겨보세요.',
              'Blue Tube', 'Wrap yourself in a cool blue tube and enjoy the water.',
              '파란 튜브', '시원한 파란빛 튜브를 몸에 두르고 물놀이를 즐겨보라냥. <small>근데 냥이들은 물 싫어하지 않냥...? </small>')
ON CONFLICT (_id) DO NOTHING;

-- 4-3. 교환 전용 8종 설명
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya") VALUES
('b3_water', '물의 휘장', '물의 휘장과 함께 시원한 여름을 보내세요!',
             'Badge of Water', 'Enjoy a cool summer with the Badge of Water.',
             '물의 휘장', '물의 휘장과 함께 시원한 여름을 보내라냥!'),
('seawave_cloth', '파도 옷', '넘실대는 파도 무늬를 옷으로 담았습니다.',
                  'Seawave Shirt', 'Shirt patterned with cool, rolling ocean waves.',
                  '파도 옷', '넘실대는 파도 무늬를 옷으로 만들어봤다냥.'),
('flamingo_tube', '플라밍고 튜브', '분홍빛 플라밍고 모양의 화려한 튜브입니다.',
                  'Flamingo Tube', 'A flashy pink flamingo-shaped pool float.',
                  '플라밍고 튜브', '분홍빛 플라밍고 모양의 화려한 튜브다냥.'),
('beach', '바닷가', '다시 돌아온 바닷가, 왠지 그녀도 왔을까?<small>박명수, 바다의 왕자</small>',
          'Beach', 'The beach is back, and maybe she is too?<small>Park Myung Soo, Prince of the sea</small>',
          '바닷가', '다시 돌아온 바닷가, 왠지 그녀도 왔을까?<small>박명수, 바다의 왕자</small>'),
('b3_ice', '얼음의 휘장', '무더운 여름, 이 얼음 휘장이 당신을 지켜줄 거에요.',
           'Badge of Ice', 'This badge of ice will protect you from the hot summer.',
           '얼음의 휘장', '무더운 여름, 이 얼음 휘장이 너를 지켜줄 거다냥.'),
('melted_icecream', '머리 위 아이스크림', '누가 내 머리에 아이스크림 던졌어?',
                    'Melting Ice Cream', 'Who threw ice cream on my head?',
                    '머리 위 아이스크림', '누가 내 머리 위에 아이스크림 던졌냥?'),
('ice_bucket', '아이스 버킷 챌린지', '모레미도 아이스 버킷 챌린지에 참여했나 봐요!',
               'Ice Bucket Challenge', 'Moremi did the ice bucket challenge, too!',
               '아이스 버킷 챌린지', '촤아악... 쪼리핑! 김대운! 김도훈!'),
('bingsu', '팥빙수', '모레미는 먹으면 곤란해요.',
           'Patbingsu', 'You cant eat the Moremi, though.',
           '팥빙수', '모레냥은 먹으면 곤란하다냥.')
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 5. itemexc: 교환 레시피 등록
-- =============================================

INSERT INTO itemexc (recipe, result, eventid) VALUES
('{"waterdrop":3}',  'b3_water',        'kkn_26summer'),
('{"waterdrop":5}',  'seawave_cloth',   'kkn_26summer'),
('{"waterdrop":10}', 'flamingo_tube',   'kkn_26summer'),
('{"waterdrop":15}', 'beach',           'kkn_26summer'),
('{"ice_cube":2}',   'b3_ice',          'kkn_26summer'),
('{"ice_cube":3}',   'melted_icecream', 'kkn_26summer'),
('{"ice_cube":5}',   'ice_bucket',      'kkn_26summer'),
('{"ice_cube":7}',   'bingsu',          'kkn_26summer');
