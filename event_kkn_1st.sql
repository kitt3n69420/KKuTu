-- =============================================
-- 끄투엔 1주년 이벤트
--   이벤트 1 파티 (함께 플레이한 최대 인원) / 이벤트 2 별빛: 2-1 별가루 모으기, 2-2 별에게 소원 빌기
-- 기간: 2026-11-14 12:00 ~ 2026-12-16 00:00 (KST) = 12월 15일까지
-- 별가루와 파티 기록은 게임 서버가 게임이 끝날 때 남긴다 (Const.ANNIV 참고)
-- 이 파일은 여러 번 실행해도 된다 (이전 버전을 이미 적용했어도 그대로 실행)
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

-- 마일스톤 보상을 받은 기록 (별가루: eventid='kkn_1st', 파티: eventid='kkn_1st_party')
-- users.kkutu에 두면 게임 서버가 판 끝에 그 칸을 덮어써서 지워지므로 따로 둔다.
-- 기본키 덕분에 연타·동시 요청이 와도 한 단계는 한 번만 들어간다.
CREATE TABLE IF NOT EXISTS event_claim (
    uid character varying(64) NOT NULL,
    eventid character varying(64) NOT NULL,
    tier integer NOT NULL,
    claimed_at bigint NOT NULL,
    PRIMARY KEY (uid, eventid, tier)
);

-- 2-2 별에게 비는 소원 (기명, 하루에 하나). day = KST 날짜 번호 (Const.kstDayIndex)
-- 그날 자정 전까지는 고칠 수 있고, 자정이 지나면 디스코드로 보내져(discord_msg) 관리자 승인을 기다린다.
-- status: pending(대기) / approved(승인, 소원 벽에 익명으로 공개) / rejected(거절)
CREATE TABLE IF NOT EXISTS event_wish (
    id serial PRIMARY KEY,
    eventid character varying(64) NOT NULL,
    uid character varying(64) NOT NULL,
    day integer NOT NULL,
    nickname character varying(64),
    text text NOT NULL,
    created_at bigint NOT NULL,
    UNIQUE (eventid, uid, day)
);
ALTER TABLE event_wish ADD COLUMN IF NOT EXISTS updated_at bigint;
ALTER TABLE event_wish ADD COLUMN IF NOT EXISTS status character varying(16) NOT NULL DEFAULT 'pending';
ALTER TABLE event_wish ADD COLUMN IF NOT EXISTS discord_msg character varying(32);
ALTER TABLE event_wish ADD COLUMN IF NOT EXISTS reviewed_by character varying(64);
ALTER TABLE event_wish ADD COLUMN IF NOT EXISTS reviewed_at bigint;
CREATE INDEX IF NOT EXISTS event_wish_day ON event_wish (eventid, day);
CREATE INDEX IF NOT EXISTS event_wish_wall ON event_wish (eventid, status, id);

-- 이벤트 1 파티: 게임이 끝날 때 함께한 인원(봇 제외, 손님 포함)의 개인 최고 기록. 손님은 기록하지 않는다.
CREATE TABLE IF NOT EXISTS event_party (
    uid character varying(64) NOT NULL,
    eventid character varying(64) NOT NULL,
    best integer NOT NULL,
    updated_at bigint NOT NULL,
    PRIMARY KEY (uid, eventid)
);

-- 2. 이벤트 등록
-- eventitem/itemmul은 비운다: 기존 무작위 이벤트 아이템 드롭을 쓰지 않음
-- 안내 페이지: /event/events_1st.html (첫 탭 이벤트 1 파티, #star는 이벤트 2 별빛). TODO: 배너 /event/kkn_1st.png는 임시 그림
INSERT INTO event (_id, name, notice, start, "end", expmul, mnymul, eventitem, itemmul)
VALUES (
    'kkn_1st',
    '끄투엔 1주년 이벤트',
    '끄투엔이 한 살이 되었어요! 같이 게임을 즐기면서 별가루를 모으고, 별에게 소원도 빌어 봐요! <a href="/event/events_1st.html" target="_blank">자세히 보기</a>',
    1794625200000,
    1797346800000,
    2,
    2,
    NULL,
    0
)
ON CONFLICT (_id) DO NOTHING;
-- 경험치·핑 2배 (이미 등록돼 있어도 반영되도록)
UPDATE event SET expmul = 2, mnymul = 2 WHERE _id = 'kkn_1st';

-- 2-1. 소원 벽에 처음부터 떠 있는 기본 소원 2개 (승인된 상태, 이벤트 첫날 날짜)
-- uid는 실제 계정과 겹치지 않는 값. 승인 상태라 디스코드로 보내지지 않는다.
INSERT INTO event_wish (eventid, uid, day, nickname, text, created_at, updated_at, status, reviewed_by, reviewed_at) VALUES
('kkn_1st', 'kkn-default-1', 20771, '끄투엔','서버 렉이 덜 걸렸으면 좋겠어요', 1794625200000, 1794625200000, 'approved', 'system', 1794625200000),
('kkn_1st', 'kkn-default-2', 20771, '끄투엔','갑자기 튕기는 걸 줄여줬으면 좋겠어요', 1794625200000, 1794625200000, 'approved', 'system', 1794625200000),
('kkn_1st', 'kkn-default-3', 20771, '끄투엔','제가 지원한 대학에 합격하고 싶어요', 1794625200000, 1794625200000, 'approved', 'system', 1794625200000)
ON CONFLICT (eventid, uid, day) DO NOTHING;

-- =============================================
-- 3. 이전 버전에서 쓰던 별가루 ID 정리 (이전 버전을 적용하지 않았으면 아무 일도 없음)
-- =============================================
DELETE FROM kkutu_shop_desc WHERE _id IN ('stardust_passion', 'stardust_dream', 'stardust_happiness', 'stardust_hope', 'stardust_courage');
DELETE FROM kkutu_shop WHERE _id IN ('stardust_passion', 'stardust_dream', 'stardust_happiness', 'stardust_hope', 'stardust_courage');

-- =============================================
-- 4. kkutu_shop: 아이템 등록
-- 효과: 핑 환산치 / 100 = 경험치% + 핑% (gEXP 0.02 = 경험치 +2%)
-- term은 모두 0(영구). 별가루는 반드시 0: 게임 서버는 box 값을 숫자로만 더하므로 기간제({value, expire})면 깨진다.
-- =============================================

-- 4-1. 별가루 5종 (구매 불가, 그림은 임시)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('stardust_r', -1, 0, 0, 'eventcol', 1795100400000, '{}'),
('stardust_y', -1, 0, 0, 'eventcol', 1795100400000, '{}'),
('stardust_g', -1, 0, 0, 'eventcol', 1795100400000, '{}'),
('stardust_b', -1, 0, 0, 'eventcol', 1795100400000, '{}'),
('stardust_p', -1, 0, 0, 'eventcol', 1795100400000, '{}')
ON CONFLICT (_id) DO NOTHING;

-- 4-2. 이벤트 2-1 별가루 마일스톤 보상 (구매 불가, 다섯 별가루 5/10/25/50/75/100. 단계 기준은 Const.ANNIV.TIERS)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('star_wand',       -1, 0, 0, 'Mhand',    1795100400000, '{"gEXP":0.02,"gMNY":0.01}'),
('star_hat',        -1, 0, 0, 'Mhead',    1795100400000, '{"gEXP":0.03,"gMNY":0.02}'),
('star_sunglasses', -1, 0, 0, 'Meye',     1795100400000, '{"gEXP":0.03,"gMNY":0.07}'),
('galaxy_cloth',    -1, 0, 0, 'Mclothes', 1795100400000, '{"gEXP":0.10,"gMNY":0.05}'),
('shooting_stars',  -1, 0, 0, 'Mback',    1795100400000, '{"gEXP":0.10,"gMNY":0.10,"gif":true, "ai":true}'),
('rainbow_nick',    -1, 0, 0, 'NIK',      1795100400000, '{"gEXP":0.18,"gMNY":0.07}')
ON CONFLICT (_id) DO NOTHING;

-- 4-3. 이벤트 1 파티 마일스톤 보상 (구매 불가, 함께한 인원 3/4/5/6/8/10명)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('party_horn',  -1, 0, 0, 'Mmouth',   1795100400000, '{"gEXP":0.01,"gMNY":0.02}'),
('conical_hat', -1, 0, 0, 'Mhead',    1795100400000, '{"gEXP":0.03,"gMNY":0.02}'),
('b2_1staniv',  -1, 0, 0, 'BDG2',     1795100400000, '{"gEXP":0.03,"gMNY":0.04}'),
('shine_nick',  -1, 0, 0, 'NIK',      1795100400000, '{"gEXP":0.05,"gMNY":0.05}'),
('kkt_garland', -1, 0, 0, 'Mfront',   1795100400000, '{"gEXP":0.09,"gMNY":0.06}'),
('cake_cloth',  -1, 0, 0, 'Mclothes', 1795100400000, '{"gEXP":0.05,"gMNY":0.15}')
ON CONFLICT (_id) DO NOTHING;

-- 4-4. 상점 풍선 3종 (핑으로 상시 구매, 이 SQL을 실행하는 순간부터 상점에 나옴)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('rabbit_balloon', 500, 0, 0, 'Mhand', 1795100400000, '{"gEXP":0.03,"gMNY":0.02}'),
('round_balloon',  500, 0, 0, 'Mhand', 1795100400000, '{"gEXP":0.02,"gMNY":0.03}'),
('cat_balloon',    500, 0, 0, 'Mhand', 1795100400000, '{"gEXP":0.04,"gMNY":0.01}')
ON CONFLICT (_id) DO NOTHING;

-- =============================================
-- 5. kkutu_shop_desc: 이름·설명
-- =============================================

-- 일본어 칸이 없는 DB(tools/add_kkutu_shop_ja.sql을 안 돌린 경우)에서도 실패하지 않게 먼저 만든다
ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "name_ja_JP" text;
ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "desc_ja_JP" text;

INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya", "name_ja_JP", "desc_ja_JP") VALUES
('stardust_r', '열정의 별가루', '식을 줄 모르는 열정처럼 붉게 타오르는 별가루입니다.',
               'Stardust of Passion', 'Red stardust that burns like a passion that never cools.',
               '열정의 별가루', '식을 줄 모르는 열정처럼 붉게 타오르는 별가루다냥.',
               '情熱の星くず', '冷めることのない情熱のように赤く燃える星くずです。'),
('stardust_y', '꿈의 별가루', '꿈꾸는 이의 머리맡에 살며시 내려앉는 노란 별가루입니다.',
               'Stardust of Dreams', 'Yellow stardust that settles softly beside every dreamer.',
               '꿈의 별가루', '꿈꾸는 냥이의 머리맡에 살며시 내려앉는 노란 별가루다냥.',
               '夢の星くず', '夢見る人の枕元にそっと降り積もる黄色い星くずです。'),
('stardust_g', '행복의 별가루', '웃음이 터질 때마다 반짝이며 모여드는 초록 별가루입니다.',
               'Stardust of Happiness', 'Green stardust that gathers with every burst of laughter.',
               '행복의 별가루', '웃음이 터질 때마다 반짝이며 모여드는 초록 별가루다냥.',
               '幸せの星くず', '笑い声がはじけるたびにきらめいて集まる緑の星くずです。'),
('stardust_b', '희망의 별가루', '아무리 어두운 밤에도 길을 비춰 주는 파란 별가루입니다.',
               'Stardust of Hope', 'Blue stardust that lights the way even on the darkest night.',
               '희망의 별가루', '아무리 어두운 밤에도 길을 비춰 주는 파란 별가루다냥.',
               '希望の星くず', 'どんなに暗い夜でも道を照らしてくれる青い星くずです。'),
('stardust_p', '용기의 별가루', '망설이는 발걸음을 한 걸음 앞으로 내딛게 해 주는 보라 별가루입니다.',
               'Stardust of Courage', 'Purple stardust that helps a hesitant foot take one step forward.',
               '용기의 별가루', '망설이는 냥발을 한 걸음 앞으로 내딛게 해 주는 보라 별가루다냥.',
               '勇気の星くず', 'ためらう足をもう一歩前へ踏み出させてくれる紫の星くずです。'),

('star_wand', '별 요술봉', '뿅!',
              'Star Wand', 'Kapow!',
              '별 요술봉', '뿅!',
              '星のステッキ', 'ポン!'),
('star_hat', '머리 위 별', '머리 위에서 반짝반짝 빛나는 별입니다. 다른 모레미들의 관심을 한 눈에 받을 수 있습니다.',
             'Star Above', 'A little star twinkling right above your head. You can catch the attention of other moremis at a glance.',
             '머리 위 별', '머리 위에서 반짝반짝 빛나는 별이다냥. 다른 모레냥들의 관심을 한 눈에 받을지도?',
             '頭の上の星', '頭の上でキラキラ輝く星です。ほかのモレミたちの注目をひと目で集められます。'),
('star_sunglasses', '별 선글라스', '멋진 별 모양 선글라스입니다.',
                    'Star Sunglasses', 'Cool star-shaped sunglasses, why not?',
                    '별 선글라스', '멋진 별 모양 선글라스다냥.',
                    '星のサングラス', 'かっこいい星形のサングラスです。'),
('galaxy_cloth', '은하수 옷', '밤하늘의 은하수를 그대로 담은 옷입니다.',
                 'Galaxy Outfit', 'An cloth woven from the Milky Way itself.',
                 '은하수 옷', '밤하늘의 은하수를 그대로 담은 옷이다냥.',
                 '天の川の服', '夜空の天の川をそのまま閉じ込めた服です。'),
('shooting_stars', '별똥별', '색색의 별똥별이 떨어지는 밤하늘입니다. 소원을 빌어 보세요!',
                   'Shooting Stars', 'A night sky full of falling stars. Make a wish!',
                   '별똥별', '색색의 별똥별이 떨어지는 밤하늘이다냥. 소원을 빌어 보라냥!',
                   '流れ星', '色とりどりの流れ星が降る夜空です。願い事をしてみましょう!'),
('rainbow_nick', '무지개 이름', '이름을 <label class=''x-rainbow_nick''>아름다운 무지갯빛</label>으로 칠합니다.',
                 'Rainbow Name', 'A name painted in <label class=''x-rainbow_nick''>beautiful rainbow colors</label>.',
                 '무지개 이름', '아니, 냥이들이 그토록 원하던 <label class=''x-rainbow_nick''>무지개 이름</label>을 이벤트템으로 출시하면 어떡하냥!',
                 '虹色の名前', '名前を<label class=''x-rainbow_nick''>美しい虹色</label>で彩ります。'),

('party_horn', '파티 호른', '신단다!',
               'Party Horn', 'Yeah~',
               '파티 호른', '신냔다냥!',
               'パーティーホーン', 'イェーイ!'),
('conical_hat', '고깔모자', '생일 파티에 빠질 수 없는 고깔모자입니다.',
                'Party Hat', 'No birthday party is complete without one.',
                '고깔모자', '생일 파티에 빠질 수 없는 고깔모자다냥. 생일 축하해, 끄투엔!',
                'とんがり帽子', '誕生日パーティーに欠かせないとんがり帽子です。'),
('b2_1staniv', '1주년의 휘장', '끄투엔의 첫 번째 생일을 함께한 증표입니다.',
               'Badge of the 1st Anniversary', 'Proof that you celebrated KKuTuN''s first birthday together.',
               '1주년의 휘장', '끄투엔의 첫 번째 생일을 함께한 증표다냥.',
               '1周年の紋章', 'クトゥエンの初めての誕生日を一緒に祝った証です。'),
('shine_nick', '반짝이는 이름', '이름을 <label class=''x-shine_nick''>묘한 색</label>으로 칠합니다.',
               'Shining Name', 'Paints name with <label class=''x-shine_nick''>a mysterious color</label>.',
               '반짝이는 이름', '이름을 <label class=''x-shine_nick''>묘한 색</label>으로 칠한다냥',
               'きらめく名前', '名前を<label class=''x-shine_nick''>不思議な色</label>で彩ります。'),
('kkt_garland', '끄투 가랜드', '파티장을 꾸미는 끄투 가랜드입니다.',
                'KKuTu Garland', 'A KKuTu garland to decorate the party.',
                '끄투 가랜드', '파티장을 꾸미는 끄투 가랜드다냥.',
                'クトゥのガーランド', 'パーティー会場を飾るクトゥのガーランドです。'),
('cake_cloth', '케이크 옷', '모레미는 먹으면 곤란하다고요!',
               'Cake Outfit', 'I repeat, Moremi is not edible!!',
               '케이크 옷', '모레미는 먹으면 곤란하다냥!',
               'ケーキの服', 'モレミは食べちゃダメですってば!'),

('rabbit_balloon', '토끼 풍선', '두둥실 떠오르는 분홍 토끼 풍선입니다.',
                   'Bunny Balloon', 'A pink bunny balloon floating up high.',
                   '토끼 풍선', '두둥실 떠오르는 분홍 토끼 풍선이다냥.',
                   'ウサギの風船', 'ふわふわ浮かぶピンクのウサギの風船です。'),
('round_balloon', '동그란 풍선', '어디서나 잘 보이는 노란 풍선입니다. 놓치면 끝이에요!',
                  'Round Balloon', 'A bright yellow balloon you can spot from anywhere.',
                  '동그란 풍선', '어디서나 잘 보이는 노란 풍선이다냥. 놓치면 끝이다냥!',
                  'まんまる風船', 'どこからでもよく見える黄色い風船です。手を離したらおしまいですよ!'),
('cat_balloon', '고양이 풍선', '파란 고양이 풍선입니다.',
                'Kitty Balloon', 'A balloon shaped like a blue cat''s face.',
                '고양이 풍선', '파란 야옹이 풍선이다냥.',
                'ネコの風船', '青いネコの風船です。')
-- 설명은 다시 실행하면 이 파일 내용으로 덮어쓴다 (이미 적용한 뒤에 문구를 고쳐도 반영되도록)
ON CONFLICT (_id) DO UPDATE SET
    "name_ko_KR" = EXCLUDED."name_ko_KR", "desc_ko_KR" = EXCLUDED."desc_ko_KR",
    "name_en_US" = EXCLUDED."name_en_US", "desc_en_US" = EXCLUDED."desc_en_US",
    "name_nya" = EXCLUDED."name_nya", "desc_nya" = EXCLUDED."desc_nya",
    "name_ja_JP" = EXCLUDED."name_ja_JP", "desc_ja_JP" = EXCLUDED."desc_ja_JP";

-- =============================================
-- 6. 이벤트가 끝난 뒤 실행 (지금 실행하지 말 것): 남은 별가루 정리
-- =============================================
-- UPDATE users SET box = (box::jsonb - 'stardust_r' - 'stardust_y' - 'stardust_g' - 'stardust_b' - 'stardust_p')::json
-- WHERE box::jsonb ?| array['stardust_r', 'stardust_y', 'stardust_g', 'stardust_b', 'stardust_p'];
