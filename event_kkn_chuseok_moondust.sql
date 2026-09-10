-- =============================================
-- 추석 이벤트: 달, 달, 둥근 달 - 달가루 전역 카운터
-- =============================================

-- 이벤트 공용 누적치 테이블. 여러 이벤트가 각자의 id로 값을 공유해 쌓아갈 수 있도록 범용으로 둔다.
-- 워드컬렉트(달가루 모으기) 모드의 서버 전역 누적 달가루 수치는 id='moondust' 행에 저장한다.
-- 클러스터 구조상 여러 워커 프로세스가 방을 나눠 갖기 때문에,
-- 인메모리 전역 변수가 아닌 DB의 원자적 UPDATE로 누적해야 한다.
CREATE TABLE IF NOT EXISTS shared_collecting (
    id varchar(32) PRIMARY KEY,
    amount bigint NOT NULL DEFAULT 0
);
INSERT INTO shared_collecting (id, amount) VALUES ('moondust', 0) ON CONFLICT DO NOTHING;

-- =============================================
-- 2. 이벤트 등록 (기간: 2026-09-15 00:00 ~ 2026-10-16 00:00 KST)
-- =============================================

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

INSERT INTO event (_id, name, notice, start, "end", expmul, mnymul, eventitem, itemmul)
VALUES (
    'kkn_chuseok',
    '달, 달, 둥근 달',
    '한가위가 밝았어요! 새로 생긴 "달가루 모으기" 게임모드를 플레이해서 다 함께 달가루를 모아보세요. 달가루가 쌓일수록 달이 차오르고, 마일스톤을 달성할 때마다 모두에게 한정 아이템이 열려요.<br>이벤트 기간 중 경험치·핑 1.5배!',
    1789398000000,
    1792076400000,
    1.5,
    1.5,
    NULL,
    0
)
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 3. kkutu_shop: 상점 상시 판매 4종 (달 쿠키, 한복 3종, 단청 배경)
-- =============================================

INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('moon_cookie',  300, 0, 0, 'Mhand',    1789398000000, '{}'),
('hanbok_red',   500, 0, 0, 'Mclothes', 1789398000000, '{}'),
('hanbok_blue',  500, 0, 0, 'Mclothes', 1789398000000, '{}'),
('hanbok_gray',  500, 0, 0, 'Mclothes', 1789398000000, '{}'),
('dancheong_bg', 1000, 0, 0, 'Mback',   1789398000000, '{}')
ON CONFLICT (_id) DO NOTHING;

INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya", "name_ja_JP", "desc_ja_JP") VALUES
('moon_cookie', '달 쿠키', '뭔가 바나나 맛이 날 것 같아...',
                'Moon Cookies', 'Somehow it seems like it would taste like banana...',
                '달 쿠키', '뭔가 바나나 맛이 날 것 같다냥...',
                '月クッキー', 'なんだかバナナの味がしそう...'),
('hanbok_red', '한복 (분홍)', '한국의 멋을 살린 한복 의상입니다.',
               'Hanbok (Pink)', 'A hanbok outfit that captures the beauty of Korea.',
               '한복 (분홍)', '한국의 멋을 살린 한복 의상이다냥.',
               '韓服(紅)', '韓国の美しさを生かした韓服の衣装です。'),
('hanbok_blue', '한복 (파랑)', '한국의 멋을 살린 한복 의상입니다.',
                'Hanbok (Blue)', 'A hanbok outfit that captures the beauty of Korea.',
                '한복 (파랑)', '한국의 멋을 살린 한복 의상이다냥.',
                '韓服(青)', '韓国の美しさを生かした韓服の衣装です。'),
('hanbok_gray', '한복 (회색)', '한국의 멋을 살린 한복 의상입니다.',
                'Hanbok (Gray)', 'A hanbok outfit that captures the beauty of Korea.',
                '한복 (회색)', '한국의 멋을 살린 한복 의상이다냥.',
                '韓服(灰)', '韓国の美しさを生かした韓服の衣装です。'),
('dancheong_bg', '단청 배경', '한국의 멋스러운 문양을 담은 배경입니다.',
                 'Dancheong Background', 'A background featuring the elegant patterns of Korean dancheong.',
                 '단청 배경', '한국의 멋스러운 문양을 담은 배경이다냥.',
                 '丹青の背景', '韓国の優美な文様をあしらった背景です。')
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 4. kkutu_shop: 마일스톤 보상 6종 (cost=-1, 달가루 모으기 경험치 1 이상 기여자만 수령 가능)
-- 1단계 2000 / 2단계 5000 / 3단계 1만 / 4단계 2만 / 5단계 3만 / 6단계 5만
-- =============================================

INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('songpyeon',            -1, 0, 0, 'Mhand',    1789398000000, '{"gEXP":0.01,"gMNY":0.01}'),
('gat',                  -1, 0, 0, 'Mhead',    1789398000000, '{"gEXP":0.04,"gMNY":0.01}'),
('b3_moon',              -1, 0, 0, 'BDG3',     1789398000000, '{"gEXP":0.03,"gMNY":0.05}'),
('songpyeon_costume',    -1, 0, 0, 'Mclothes', 1789398000000, '{"gEXP":0.07,"gMNY":0.03}'),
('gradientname_moonlight', -1, 0, 0, 'NIK',    1789398000000, '{"gEXP":0.09,"gMNY":0.06}'),
('fullmoon_bg',          -1, 0, 0, 'Mback',    1789398000000, '{"gEXP":0.12,"gMNY":0.08}')
ON CONFLICT (_id) DO NOTHING;

INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya", "name_ja_JP", "desc_ja_JP") VALUES
('songpyeon', '손에 든 송편', '추석에만 맛볼 수 있는 맛있는 떡이에요.',
              'Songpyeon in Hand', 'A delicious rice cake you can only taste on Chuseok.',
              '손에 든 송편', '추석에만 맛볼 수 있는 맛있는 떡이다냥.',
              '手に持ったソンピョン', '秋夕(チュソク)にしか味わえないおいしいお餅です。'),
('gat', '갓', '이젠 모레미도 선비가 되었군요.',
        'Gat', 'Now Moremi has become a scholar too.',
        '갓', '이젠 모레미도 선비가 되었다냥.',
        'カッ(冠帽)', 'これでモレミも学者(ソンビ)になりましたね。'),
('b3_moon', '달의 휘장', '어두운 밤을 밝혀주는 달빛을 따서 만들어진 휘장입니다. 힘든 일이 있을 때에도 이 휘장이 달빛처럼 당신을 비춰 줄 거에요.',
            'Badge of the Moon', 'A badge made from moonlight that lights up the dark night. Even in hard times, this badge will shine on you like moonlight.',
            '달의 휘장', '어두운 밤을 밝혀주는 달빛을 따서 만들어진 휘장이다냥. 힘든 일이 있을 때에도 이 휘장이 달빛처럼 너를 비춰줄 거다냥.',
            '月の紋章', '暗い夜を照らしてくれる月明かりから作られた紋章です。つらいことがあっても、この紋章が月明かりのようにあなたを照らしてくれるでしょう。'),
('songpyeon_costume', '송편 옷', '깨송편일까? 콩송편일까? 모레미송편이었어!',
                      'Songpyeon Costume', 'Is it sesame? Is it bean? ... No, it''s Moremi!',
                      '송편 옷', '송편 속에 모레미가 쏙 들어갔다냥!',
                      'ソンピョンの衣装', 'ゴマ入り?豆入り?実はモレミソンピョンでした!'),
('gradientname_moonlight', '달빛 이름', '이름을 <label class=''x-gradientname_moonlight''>신비로운 달빛</label>으로 칠합니다.',
                           'Moonlight Name', 'Paints your name in <label class=''x-gradientname_moonlight''>mysterious moonlight</label>.',
                           '달빛 이름', '이름을 <label class=''x-gradientname_moonlight''>신비로운 달빛</label>으로 칠한다냥.',
                           '月明かりの名前', '名前を<label class=''x-gradientname_moonlight''>神秘的な月明かり</label>で彩ります。'),
('fullmoon_bg', '보름달 배경', '풍성한 한가위 보내세요!',
                'Full Moon Background', 'Wishing you a bountiful Chuseok!',
                '보름달 배경', '풍성한 한가위 보내라냥!',
                '満月の背景', '豊かなチュソクをお過ごしください!')
ON CONFLICT (_id) DO NOTHING;

-- 이미 위 INSERT가 적용된 DB에서는 ON CONFLICT DO NOTHING 때문에 아래 갱신이 반영되지 않으므로,
-- 달빛 이름 설명의 스타일 태그를 <span>에서 다른 상시 판매 그라데이션 이름과 동일한 <label> 표기로 맞춘다.
UPDATE kkutu_shop_desc SET
    "desc_ko_KR" = '이름을 <label class=''x-gradientname_moonlight''>신비로운 달빛</label>으로 칠합니다.',
    "desc_en_US" = 'Paints your name in <label class=''x-gradientname_moonlight''>mysterious moonlight</label>.',
    "desc_nya" = '이름을 <label class=''x-gradientname_moonlight''>신비로운 달빛</label>으로 칠한다냥.',
    "desc_ja_JP" = '名前を<label class=''x-gradientname_moonlight''>神秘的な月明かり</label>で彩ります。'
WHERE _id = 'gradientname_moonlight';
