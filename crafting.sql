-- =============================================
-- KKuTu Item Crafting System - Database Setup
-- =============================================

-- 1. Create crafting table
CREATE TABLE IF NOT EXISTS crafting (
    item1 character varying(64) NOT NULL,
    item2 character varying(64) NOT NULL,
    result character varying(64) NOT NULL,
    PRIMARY KEY (item1, item2)
);

-- 2. Add crafted result items to kkutu_shop (cost=-1 means not purchasable)

-- Rainbow Candy (Mhand)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options)
VALUES ('rainbowcandy', -1, 0, 0, 'Mhand', 0, '{}')
ON CONFLICT (_id) DO NOTHING;

-- RGB Headphone (Mhead)
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options)
VALUES ('rgb_headphone', -1, 0, 0, 'Mhead', 0, '{}')
ON CONFLICT (_id) DO NOTHING;

-- Gradient Names (NIK) - 28 items
INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options) VALUES
('gradientname_blueblue', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_greengreen', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_indigoindigo', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_orangeorange', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_pinkpink', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_purplepurple', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_redred', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_bluegreen', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_blueindigo', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_blueorange', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_bluepink', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_bluepurple', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_bluered', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_greenindigo', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_greenorange', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_greenpink', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_greenpurple', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_greenred', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_indigoorange', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_indigopink', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_indigopurple', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_indigored', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_orangepink', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_orangepurple', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_orangered', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_pinkpurple', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_pinkred', -1, 0, 0, 'NIK', 0, '{}'),
('gradientname_purplered', -1, 0, 0, 'NIK', 0, '{}')
ON CONFLICT (_id) DO NOTHING;

-- 3. Add item descriptions to kkutu_shop_desc

INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US") VALUES
('rainbowcandy', '무지개 막대 사탕', '두 사탕을 조합하여 만든 화려한 무지개 막대 사탕입니다.', 'Rainbow Candy', 'A rainbow candy crafted from two candies.'),
('rgb_headphone', 'RGB 헤드폰', '두 헤드폰을 조합하여 만든 화려한 RGB 헤드폰입니다.', 'RGB Headphone', 'An RGB headphone crafted from two headphones.')
ON CONFLICT (_id) DO NOTHING;

-- Gradient Names - Same color (7)
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US") VALUES
('gradientname_blueblue', '그라데이션 이름 (파랑)', '이름을 <label class=''x-gradientname_blueblue''>깊은 푸른빛 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue)', 'Paints your name in a <label class=''x-gradientname_blueblue''>deep blue gradient</label>.'),
('gradientname_greengreen', '그라데이션 이름 (초록)', '이름을 <label class=''x-gradientname_greengreen''>깊은 초록빛 그라데이션</label>으로 칠합니다.', 'Gradient Name (Green)', 'Paints your name in a <label class=''x-gradientname_greengreen''>deep green gradient</label>.'),
('gradientname_indigoindigo', '그라데이션 이름 (남색)', '이름을 <label class=''x-gradientname_indigoindigo''>깊은 남색 그라데이션</label>으로 칠합니다.', 'Gradient Name (Indigo)', 'Paints your name in a <label class=''x-gradientname_indigoindigo''>deep indigo gradient</label>.'),
('gradientname_orangeorange', '그라데이션 이름 (주황)', '이름을 <label class=''x-gradientname_orangeorange''>깊은 주황빛 그라데이션</label>으로 칠합니다.', 'Gradient Name (Orange)', 'Paints your name in a <label class=''x-gradientname_orangeorange''>deep orange gradient</label>.'),
('gradientname_pinkpink', '그라데이션 이름 (분홍)', '이름을 <label class=''x-gradientname_pinkpink''>깊은 분홍빛 그라데이션</label>으로 칠합니다.', 'Gradient Name (Pink)', 'Paints your name in a <label class=''x-gradientname_pinkpink''>deep pink gradient</label>.'),
('gradientname_purplepurple', '그라데이션 이름 (보라)', '이름을 <label class=''x-gradientname_purplepurple''>깊은 보랏빛 그라데이션</label>으로 칠합니다.', 'Gradient Name (Purple)', 'Paints your name in a <label class=''x-gradientname_purplepurple''>deep purple gradient</label>.'),
('gradientname_redred', '그라데이션 이름 (빨강)', '이름을 <label class=''x-gradientname_redred''>깊은 붉은빛 그라데이션</label>으로 칠합니다.', 'Gradient Name (Red)', 'Paints your name in a <label class=''x-gradientname_redred''>deep red gradient</label>.')
ON CONFLICT (_id) DO NOTHING;

-- Gradient Names - Different colors (21)
INSERT INTO kkutu_shop_desc (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US") VALUES
('gradientname_bluegreen', '그라데이션 이름 (파랑-초록)', '이름을 <label class=''x-gradientname_bluegreen''>파랑-초록 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue-Green)', 'Paints your name in a <label class=''x-gradientname_bluegreen''>blue-green gradient</label>.'),
('gradientname_blueindigo', '그라데이션 이름 (파랑-남색)', '이름을 <label class=''x-gradientname_blueindigo''>파랑-남색 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue-Indigo)', 'Paints your name in a <label class=''x-gradientname_blueindigo''>blue-indigo gradient</label>.'),
('gradientname_blueorange', '그라데이션 이름 (파랑-주황)', '이름을 <label class=''x-gradientname_blueorange''>파랑-주황 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue-Orange)', 'Paints your name in a <label class=''x-gradientname_blueorange''>blue-orange gradient</label>.'),
('gradientname_bluepink', '그라데이션 이름 (파랑-분홍)', '이름을 <label class=''x-gradientname_bluepink''>파랑-분홍 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue-Pink)', 'Paints your name in a <label class=''x-gradientname_bluepink''>blue-pink gradient</label>.'),
('gradientname_bluepurple', '그라데이션 이름 (파랑-보라)', '이름을 <label class=''x-gradientname_bluepurple''>파랑-보라 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue-Purple)', 'Paints your name in a <label class=''x-gradientname_bluepurple''>blue-purple gradient</label>.'),
('gradientname_bluered', '그라데이션 이름 (파랑-빨강)', '이름을 <label class=''x-gradientname_bluered''>파랑-빨강 그라데이션</label>으로 칠합니다.', 'Gradient Name (Blue-Red)', 'Paints your name in a <label class=''x-gradientname_bluered''>blue-red gradient</label>.'),
('gradientname_greenindigo', '그라데이션 이름 (초록-남색)', '이름을 <label class=''x-gradientname_greenindigo''>초록-남색 그라데이션</label>으로 칠합니다.', 'Gradient Name (Green-Indigo)', 'Paints your name in a <label class=''x-gradientname_greenindigo''>green-indigo gradient</label>.'),
('gradientname_greenorange', '그라데이션 이름 (초록-주황)', '이름을 <label class=''x-gradientname_greenorange''>초록-주황 그라데이션</label>으로 칠합니다.', 'Gradient Name (Green-Orange)', 'Paints your name in a <label class=''x-gradientname_greenorange''>green-orange gradient</label>.'),
('gradientname_greenpink', '그라데이션 이름 (초록-분홍)', '이름을 <label class=''x-gradientname_greenpink''>초록-분홍 그라데이션</label>으로 칠합니다.', 'Gradient Name (Green-Pink)', 'Paints your name in a <label class=''x-gradientname_greenpink''>green-pink gradient</label>.'),
('gradientname_greenpurple', '그라데이션 이름 (초록-보라)', '이름을 <label class=''x-gradientname_greenpurple''>초록-보라 그라데이션</label>으로 칠합니다.', 'Gradient Name (Green-Purple)', 'Paints your name in a <label class=''x-gradientname_greenpurple''>green-purple gradient</label>.'),
('gradientname_greenred', '그라데이션 이름 (초록-빨강)', '이름을 <label class=''x-gradientname_greenred''>초록-빨강 그라데이션</label>으로 칠합니다.', 'Gradient Name (Green-Red)', 'Paints your name in a <label class=''x-gradientname_greenred''>green-red gradient</label>.'),
('gradientname_indigoorange', '그라데이션 이름 (남색-주황)', '이름을 <label class=''x-gradientname_indigoorange''>남색-주황 그라데이션</label>으로 칠합니다.', 'Gradient Name (Indigo-Orange)', 'Paints your name in a <label class=''x-gradientname_indigoorange''>indigo-orange gradient</label>.'),
('gradientname_indigopink', '그라데이션 이름 (남색-분홍)', '이름을 <label class=''x-gradientname_indigopink''>남색-분홍 그라데이션</label>으로 칠합니다.', 'Gradient Name (Indigo-Pink)', 'Paints your name in a <label class=''x-gradientname_indigopink''>indigo-pink gradient</label>.'),
('gradientname_indigopurple', '그라데이션 이름 (남색-보라)', '이름을 <label class=''x-gradientname_indigopurple''>남색-보라 그라데이션</label>으로 칠합니다.', 'Gradient Name (Indigo-Purple)', 'Paints your name in a <label class=''x-gradientname_indigopurple''>indigo-purple gradient</label>.'),
('gradientname_indigored', '그라데이션 이름 (남색-빨강)', '이름을 <label class=''x-gradientname_indigored''>남색-빨강 그라데이션</label>으로 칠합니다.', 'Gradient Name (Indigo-Red)', 'Paints your name in a <label class=''x-gradientname_indigored''>indigo-red gradient</label>.'),
('gradientname_orangepink', '그라데이션 이름 (주황-분홍)', '이름을 <label class=''x-gradientname_orangepink''>주황-분홍 그라데이션</label>으로 칠합니다.', 'Gradient Name (Orange-Pink)', 'Paints your name in a <label class=''x-gradientname_orangepink''>orange-pink gradient</label>.'),
('gradientname_orangepurple', '그라데이션 이름 (주황-보라)', '이름을 <label class=''x-gradientname_orangepurple''>주황-보라 그라데이션</label>으로 칠합니다.', 'Gradient Name (Orange-Purple)', 'Paints your name in a <label class=''x-gradientname_orangepurple''>orange-purple gradient</label>.'),
('gradientname_orangered', '그라데이션 이름 (주황-빨강)', '이름을 <label class=''x-gradientname_orangered''>주황-빨강 그라데이션</label>으로 칠합니다.', 'Gradient Name (Orange-Red)', 'Paints your name in a <label class=''x-gradientname_orangered''>orange-red gradient</label>.'),
('gradientname_pinkpurple', '그라데이션 이름 (분홍-보라)', '이름을 <label class=''x-gradientname_pinkpurple''>분홍-보라 그라데이션</label>으로 칠합니다.', 'Gradient Name (Pink-Purple)', 'Paints your name in a <label class=''x-gradientname_pinkpurple''>pink-purple gradient</label>.'),
('gradientname_pinkred', '그라데이션 이름 (분홍-빨강)', '이름을 <label class=''x-gradientname_pinkred''>분홍-빨강 그라데이션</label>으로 칠합니다.', 'Gradient Name (Pink-Red)', 'Paints your name in a <label class=''x-gradientname_pinkred''>pink-red gradient</label>.'),
('gradientname_purplered', '그라데이션 이름 (보라-빨강)', '이름을 <label class=''x-gradientname_purplered''>보라-빨강 그라데이션</label>으로 칠합니다.', 'Gradient Name (Purple-Red)', 'Paints your name in a <label class=''x-gradientname_purplered''>purple-red gradient</label>.')
ON CONFLICT (_id) DO NOTHING;

-- 4. Insert crafting recipes (item1 <= item2 alphabetically)

-- Rainbow Candy recipes
INSERT INTO crafting (item1, item2, result) VALUES
('bluecandy', 'lemoncandy', 'rainbowcandy'),
('bluecandy', 'pinkcandy', 'rainbowcandy'),
('lemoncandy', 'pinkcandy', 'rainbowcandy')
ON CONFLICT (item1, item2) DO NOTHING;

-- RGB Headphone recipe
INSERT INTO crafting (item1, item2, result) VALUES
('blue_headphone', 'orange_headphone', 'rgb_headphone')
ON CONFLICT (item1, item2) DO NOTHING;

-- Gradient Name recipes (28)
INSERT INTO crafting (item1, item2, result) VALUES
-- Same color (7)
('blue_name', 'blue_name', 'gradientname_blueblue'),
('green_name', 'green_name', 'gradientname_greengreen'),
('indigo_name', 'indigo_name', 'gradientname_indigoindigo'),
('orange_name', 'orange_name', 'gradientname_orangeorange'),
('pink_name', 'pink_name', 'gradientname_pinkpink'),
('purple_name', 'purple_name', 'gradientname_purplepurple'),
('red_name', 'red_name', 'gradientname_redred'),
-- Different colors (21)
('blue_name', 'green_name', 'gradientname_bluegreen'),
('blue_name', 'indigo_name', 'gradientname_blueindigo'),
('blue_name', 'orange_name', 'gradientname_blueorange'),
('blue_name', 'pink_name', 'gradientname_bluepink'),
('blue_name', 'purple_name', 'gradientname_bluepurple'),
('blue_name', 'red_name', 'gradientname_bluered'),
('green_name', 'indigo_name', 'gradientname_greenindigo'),
('green_name', 'orange_name', 'gradientname_greenorange'),
('green_name', 'pink_name', 'gradientname_greenpink'),
('green_name', 'purple_name', 'gradientname_greenpurple'),
('green_name', 'red_name', 'gradientname_greenred'),
('indigo_name', 'orange_name', 'gradientname_indigoorange'),
('indigo_name', 'pink_name', 'gradientname_indigopink'),
('indigo_name', 'purple_name', 'gradientname_indigopurple'),
('indigo_name', 'red_name', 'gradientname_indigored'),
('orange_name', 'pink_name', 'gradientname_orangepink'),
('orange_name', 'purple_name', 'gradientname_orangepurple'),
('orange_name', 'red_name', 'gradientname_orangered'),
('pink_name', 'purple_name', 'gradientname_pinkpurple'),
('pink_name', 'red_name', 'gradientname_pinkred'),
('purple_name', 'red_name', 'gradientname_purplered')
ON CONFLICT (item1, item2) DO NOTHING;

-- $WPA: Rare Hangul Piece
UPDATE kkutu_shop_desc SET "name_en_US" = 'Rare Characrter Piece', "desc_en_US" = 'A mysterious text piece drawn to your KKuTu gameplay. Use its energy at the Letter Lab.' WHERE _id = '$WPA';

-- $WPB: Unique Hangul Piece
UPDATE kkutu_shop_desc SET "name_en_US" = 'Unique Characrter Piece', "desc_en_US" = 'A mysterious text piece drawn to your KKuTu gameplay. Use its energy at the Letter Lab.' WHERE _id = '$WPB';

-- $WPC: Hangul Piece
UPDATE kkutu_shop_desc SET "name_en_US" = 'Characrter Piece', "desc_en_US" = 'A mysterious text piece drawn to your KKuTu gameplay. Use its energy at the Letter Lab.' WHERE _id = '$WPC';

-- b1_gm: GN Badge
UPDATE kkutu_shop_desc SET "name_en_US" = 'GM Badge', "desc_en_US" = 'Work, GM, work!' WHERE _id = 'b1_gm';

-- b2_metal: Badge of Steel
UPDATE kkutu_shop_desc SET "name_en_US" = 'Badge of Steel', "desc_en_US" = 'A rare badge modeled after an unyielding spirit that endures any hardship.' WHERE _id = 'b2_metal';

-- b3_do: Badge of Challenge
UPDATE kkutu_shop_desc SET "name_en_US" = 'Badge of Challenge', "desc_en_US" = 'A cool badge modeled after the passion to challenge the Tower of Vocabulary.' WHERE _id = 'b3_do';

-- b3_hwa: Badge of Harmony
UPDATE kkutu_shop_desc SET "name_en_US" = 'Badge of Harmony', "desc_en_US" = 'A cool badge modeled after the harmony of using power efficiently.' WHERE _id = 'b3_hwa';

-- scouter: Scouter
UPDATE kkutu_shop_desc SET "name_en_US" = 'Scouter', "desc_en_US" = 'A device that looks like it could measure your opponent''s KKuTu power level.' WHERE _id = 'scouter';

-- sunglasses: Sunglasses
UPDATE kkutu_shop_desc SET "name_en_US" = 'Sunglasses', "desc_en_US" = 'High-end sunglasses to avoid the glaring sun.' WHERE _id = 'sunglasses';

-- taengja: Hardy Orange Wallpaper
UPDATE kkutu_shop_desc SET "name_en_US" = 'Hardy Orange Wallpaper', "desc_en_US" = 'A wallpaper with the scent of fresh hardy oranges.' WHERE _id = 'taengja';

-- twoeight: 2:8 Parting
UPDATE kkutu_shop_desc SET "name_en_US" = '2:8 Parting Hair', "desc_en_US" = 'Feels elegant. Looks like someone who might show off a bit.' WHERE _id = 'twoeight';

-- water: Water Suit
UPDATE kkutu_shop_desc SET "name_en_US" = 'Water Suit', "desc_en_US" = 'Moremi went underwater to enjoy a relaxing bath.' WHERE _id = 'water';

-- white_mask: White Mask
UPDATE kkutu_shop_desc SET "name_en_US" = 'White Mask', "desc_en_US" = 'A mask with a white and gloomy atmosphere. Sweep up all the points equipped with this.' WHERE _id = 'white_mask';

-- blue_vest: Blue Vest
UPDATE kkutu_shop_desc SET "name_en_US" = 'Blue Vest', "desc_en_US" = 'A fresh trapezoidal vest. Moremi is 2D, so they can wear trapezoids.' WHERE _id = 'blue_vest';

-- bluecandy: Grape Lollipop
UPDATE kkutu_shop_desc SET "name_en_US" = 'Grape Lollipop', "desc_en_US" = 'A sweet and sour giant grape flavored lollipop.' WHERE _id = 'bluecandy';

-- double_brows: Double Eyebrows
UPDATE kkutu_shop_desc SET "name_en_US" = 'Double Eyebrows', "desc_en_US" = 'One more eyebrow! Make a pretty Moremi with two pretty eyebrows.' WHERE _id = 'double_brows';

-- haksamo: Mortarboard
UPDATE kkutu_shop_desc SET "name_en_US" = 'Mortarboard', "desc_en_US" = 'Study English with KKuTu and aim for a perfect TOEIC score!' WHERE _id = 'haksamo';

-- hamster_O: Orange Hamster Head
UPDATE kkutu_shop_desc SET "name_en_US" = 'Orange Hamster Head', "desc_en_US" = 'Kkyu?', "name_nya" = '주황 햄스터 머리', "desc_nya" = '햄찌는 먹는게 아니다냥!' WHERE _id = 'hamster_O';

-- pants_china: Chinese Pants
UPDATE kkutu_shop_desc SET "name_en_US" = 'Chinese Pants', "desc_en_US" = 'Pants designed with inspiration from the Chinese flag.' WHERE _id = 'pants_china';

-- pants_japan: Japanese Pants
UPDATE kkutu_shop_desc SET "name_en_US" = 'Japanese Pants', "desc_en_US" = 'Pants designed with inspiration from the Japanese flag.' WHERE _id = 'pants_japan';

-- pants_korea: Korean Pants
UPDATE kkutu_shop_desc SET "name_en_US" = 'Korean Pants', "desc_en_US" = 'Pants designed with inspiration from the Korean flag.' WHERE _id = 'pants_korea';

-- pink_name: Pink Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Pink Name', "desc_en_US" = 'Paints your name in a <label class=''x-pink_name''>pretty pink color</label>.' WHERE _id = 'pink_name';

-- pixelemi: Pixelemi
UPDATE kkutu_shop_desc SET "name_en_US" = 'Pixelemi', "desc_en_US" = 'Moremi with low resolution.' WHERE _id = 'pixelemi';

-- pixgradg: Checkerboard Gradient (Green)
UPDATE kkutu_shop_desc SET "name_en_US" = 'Checkerboard Gradient (Green)', "desc_en_US" = 'Green clothes with a checkerboard pattern.' WHERE _id = 'pixgradg';

-- pixgrado: Checkerboard Gradient (Orange)
UPDATE kkutu_shop_desc SET "name_en_US" = 'Checkerboard Gradient (Orange)', "desc_en_US" = 'Orange clothes with a checkerboard pattern.' WHERE _id = 'pixgrado';

-- purple_name: Purple Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Purple Name', "desc_en_US" = 'Paints your name in a <label class=''x-purple_name''>hazy purple color</label>.' WHERE _id = 'purple_name';

-- sqpants: Square Pants
UPDATE kkutu_shop_desc SET "name_en_US" = 'Square Pants', "desc_en_US" = 'Dress your text friend Moremi in cool square pants.' WHERE _id = 'sqpants';

-- blue_headphone: Blue Headphone
UPDATE kkutu_shop_desc SET "name_en_US" = 'Blue Headphone', "desc_en_US" = 'Should be an essential item for pro gamer Moremi. Equip this and crush the newbies.' WHERE _id = 'blue_headphone';

-- b2_fire: Badge of Fire
UPDATE kkutu_shop_desc SET "name_en_US" = 'Badge of Fire', "desc_en_US" = 'A rare badge modeled after soaring freely into the sky engulfed in flames.' WHERE _id = 'b2_fire';

-- decayed_mouth: Rotten Smile
UPDATE kkutu_shop_desc SET "name_en_US" = 'Rotten Smile', "desc_en_US" = 'Put on this smile and say lines like "Heh, I''m better at KKuTu than you."' WHERE _id = 'decayed_mouth';

-- rainbowcandy: Rainbow Candy (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '무지개 막대 사탕', "desc_nya" = '화려한 무지개 막대 사탕이다냥. 어떤 맛이 날까냥?' WHERE _id = 'rainbowcandy';

-- rgb_headphone: RGB Headphone (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = 'RGB 헤드폰', "desc_nya" = '요즘 트렌드를 화려한 RGB 헤드폰이다냥.' WHERE _id = 'rgb_headphone';

-- gradientname_blueblue: Gradient Name (Blue) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑)', "desc_nya" = '이름을 <label class=''x-gradientname_blueblue''>깊은 푸른빛 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_blueblue';

-- gradientname_greengreen: Gradient Name (Green) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (초록)', "desc_nya" = '이름을 <label class=''x-gradientname_greengreen''>깊은 초록빛 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_greengreen';

-- gradientname_indigoindigo: Gradient Name (Indigo) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (남색)', "desc_nya" = '이름을 <label class=''x-gradientname_indigoindigo''>깊은 냠색 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_indigoindigo';

-- gradientname_orangeorange: Gradient Name (Orange) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (주황)', "desc_nya" = '이름을 <label class=''x-gradientname_orangeorange''>깊은 주황빛 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_orangeorange';

-- gradientname_pinkpink: Gradient Name (Pink) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (분홍)', "desc_nya" = '이름을 <label class=''x-gradientname_pinkpink''>깊은 분홍빛 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_pinkpink';

-- gradientname_purplepurple: Gradient Name (Purple) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (보라)', "desc_nya" = '이름을 <label class=''x-gradientname_purplepurple''>깊은 보랏빛 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_purplepurple';

-- gradientname_redred: Gradient Name (Red) (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_redred''>깊은 붉은빛 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_redred';

-- gradientname_bluegreen (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑-초록)', "desc_nya" = '이름을 <label class=''x-gradientname_bluegreen''>파랑-초록 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_bluegreen';

-- gradientname_blueindigo (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑-남색)', "desc_nya" = '이름을 <label class=''x-gradientname_blueindigo''>파랑-냠색 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_blueindigo';

-- gradientname_blueorange (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑-주황)', "desc_nya" = '이름을 <label class=''x-gradientname_blueorange''>파랑-주황 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_blueorange';

-- gradientname_bluepink (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑-분홍)', "desc_nya" = '이름을 <label class=''x-gradientname_bluepink''>파랑-분홍 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_bluepink';

-- gradientname_bluepurple (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑-보라)', "desc_nya" = '이름을 <label class=''x-gradientname_bluepurple''>파랑-보라 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_bluepurple';

-- gradientname_bluered (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (파랑-빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_bluered''>파랑-빨강 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_bluered';

-- gradientname_greenindigo (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (초록-남색)', "desc_nya" = '이름을 <label class=''x-gradientname_greenindigo''>초록-냠색 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_greenindigo';

-- gradientname_greenorange (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (초록-주황)', "desc_nya" = '이름을 <label class=''x-gradientname_greenorange''>초록-주황 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_greenorange';

-- gradientname_greenpink (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (초록-분홍)', "desc_nya" = '이름을 <label class=''x-gradientname_greenpink''>초록-분홍 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_greenpink';

-- gradientname_greenpurple (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (초록-보라)', "desc_nya" = '이름을 <label class=''x-gradientname_greenpurple''>초록-보라 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_greenpurple';

-- gradientname_greenred (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (초록-빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_greenred''>초록-빨강 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_greenred';

-- gradientname_indigoorange (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (남색-주황)', "desc_nya" = '이름을 <label class=''x-gradientname_indigoorange''>냠색-주황 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_indigoorange';

-- gradientname_indigopink (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (남색-분홍)', "desc_nya" = '이름을 <label class=''x-gradientname_indigopink''>냠색-분홍 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_indigopink';

-- gradientname_indigopurple (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (남색-보라)', "desc_nya" = '이름을 <label class=''x-gradientname_indigopurple''>냠색-보라 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_indigopurple';

-- gradientname_indigored (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (남색-빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_indigored''>냠색-빨강 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_indigored';

-- gradientname_orangepink (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (주황-분홍)', "desc_nya" = '이름을 <label class=''x-gradientname_orangepink''>주황-분홍 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_orangepink';

-- gradientname_orangepurple (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (주황-보라)', "desc_nya" = '이름을 <label class=''x-gradientname_orangepurple''>주황-보라 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_orangepurple';

-- gradientname_orangered (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (주황-빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_orangered''>주황-빨강 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_orangered';

-- gradientname_pinkpurple (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (분홍-보라)', "desc_nya" = '이름을 <label class=''x-gradientname_pinkpurple''>분홍-보라 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_pinkpurple';

-- gradientname_pinkred (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (분홍-빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_pinkred''>분홍-빨강 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_pinkred';

-- gradientname_purplered (Nya)
UPDATE kkutu_shop_desc SET "name_nya" = '그라데이션 이름 (보라-빨강)', "desc_nya" = '이름을 <label class=''x-gradientname_purplered''>보라-빨강 그라데이션</label>으로 칠한다냥.' WHERE _id = 'gradientname_purplered';

-- beardoll: Bear Doll Mouth
UPDATE kkutu_shop_desc SET "name_en_US" = 'Bear Doll Mouth', "desc_en_US" = 'A mouth that looks exactly like a cute bear doll.' WHERE _id = 'beardoll';

-- black_mask: Black Mask
UPDATE kkutu_shop_desc SET "name_en_US" = 'Black Mask', "desc_en_US" = 'A mask with a black and gloomy atmosphere. No one can stop you when you equip this.' WHERE _id = 'black_mask';

-- black_oxford: Black Oxfords
UPDATE kkutu_shop_desc SET "name_en_US" = 'Black Oxfords', "desc_en_US" = 'Neat black shoes said to be worn by Oxford students. You can feel the wisdom of an Oxford student.' WHERE _id = 'black_oxford';

-- black_shoes: Black Bean Shoes
UPDATE kkutu_shop_desc SET "name_en_US" = 'Black Bean Shoes', "desc_en_US" = 'Black shoes as small as beans.' WHERE _id = 'black_shoes';

-- blackbere: Black Beret
UPDATE kkutu_shop_desc SET "name_en_US" = 'Black Beret', "desc_en_US" = 'A truly black beret. It is said to be sought after by a certain class of people.' WHERE _id = 'blackbere';

-- blue_name: Blue Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Blue Name', "desc_en_US" = 'Paints your name in a <label class=''x-blue_name''>cool blue color</label>.' WHERE _id = 'blue_name';

-- laugh: Speak with a Smile
UPDATE kkutu_shop_desc SET "name_en_US" = 'Speak with a Smile', "desc_en_US" = 'Even if there are some who break the laughter, let''s speak with a smile in KKuTu!' WHERE _id = 'laugh';

-- lemoncandy: Lemon Lollipop
UPDATE kkutu_shop_desc SET "name_en_US" = 'Lemon Lollipop', "desc_en_US" = 'A sweet and sour giant lemon flavored lollipop.' WHERE _id = 'lemoncandy';

-- loosesocks: Loose Socks
UPDATE kkutu_shop_desc SET "name_en_US" = 'Loose Socks', "desc_en_US" = 'Moremi has short legs, so any socks become loose socks.' WHERE _id = 'loosesocks';

-- medal: Gold Medal
UPDATE kkutu_shop_desc SET "name_en_US" = 'Gold Medal', "desc_en_US" = 'A gold medal, the sign of 1st place. What is it 1st place for?' WHERE _id = 'medal';

-- merong: Teasing Mouth
UPDATE kkutu_shop_desc SET "name_en_US" = 'Teasing Mouth', "desc_en_US" = 'Make a Moremi sticking its tongue out.' WHERE _id = 'merong';

-- oh: Oh! Mouth
UPDATE kkutu_shop_desc SET "name_en_US" = 'Oh! Mouth', "desc_en_US" = 'Make a Moremi that cannot hide its admiration for something.' WHERE _id = 'oh';

-- brave_eyes: Brave Eyes
UPDATE kkutu_shop_desc SET "name_en_US" = 'Brave Eyes', "desc_en_US" = 'Eyes that feel an unknown courage.' WHERE _id = 'brave_eyes';

-- brown_oxford: Brown Oxfords
UPDATE kkutu_shop_desc SET "name_en_US" = 'Brown Oxfords', "desc_en_US" = 'Neat brown shoes said to be worn by Oxford students. You can feel the wealth of an Oxford student.' WHERE _id = 'brown_oxford';

-- cat_mouth: Cat Mouth
UPDATE kkutu_shop_desc SET "name_en_US" = 'Cat Mouth', "desc_en_US" = 'With this gull-like mouth, Moremi''s cuteness will amplify!' WHERE _id = 'cat_mouth';

-- cuspidal: Canine Decoration
UPDATE kkutu_shop_desc SET "name_en_US" = 'Cuspidal', "desc_en_US" = 'I basiccally dont konw what is this.' WHERE _id = 'cuspidal';

-- darkblack: Dark Darkness
UPDATE kkutu_shop_desc SET "name_en_US" = 'Darky Darkness', "desc_en_US" = 'It is truly a wallpaper of darkness.' WHERE _id = 'darkblack';

-- blackrobe: Black Robe
UPDATE kkutu_shop_desc SET "name_en_US" = 'Black Robe', "desc_en_US" = 'Heh heh... Darkness has come to me...' WHERE _id = 'blackrobe';

-- choco_ice: Choco Ice
UPDATE kkutu_shop_desc SET "name_en_US" = 'Choco Ice', "desc_en_US" = 'Sweet chocolate ice cream to blow away the heat.' WHERE _id = 'choco_ice';

-- green_name: Green Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Green Name', "desc_en_US" = 'Paints your name in a <label class=''x-green_name''>refreshing green color</label>.' WHERE _id = 'green_name';

-- b3_pok: Badge of Storm
UPDATE kkutu_shop_desc SET "name_en_US" = 'Badge of Storm', "desc_en_US" = 'A cool badge modeled after the appearance of sprinting like a storm with fierce eyes.' WHERE _id = 'b3_pok';

-- b4_hongsi: Tangerine Sash Badge
UPDATE kkutu_shop_desc SET "name_en_US" = 'Tangerine Sash Badge', "desc_en_US" = 'A sash-shaped badge of passionate orange light.' WHERE _id = 'b4_hongsi';

-- b4_mint: Mint Sash Badge
UPDATE kkutu_shop_desc SET "name_en_US" = 'Mint Sash Badge', "desc_en_US" = 'A sash-shaped badge of harmonious green light.' WHERE _id = 'b4_mint';

-- orange_vest: Tangerine Vest
UPDATE kkutu_shop_desc SET "name_en_US" = 'Tangerine Vest', "desc_en_US" = 'A refreshing trapezoidal vest. Moremi is 2D, so they can wear trapezoids.' WHERE _id = 'orange_vest';

-- pink_vest: Pink Vest
UPDATE kkutu_shop_desc SET "name_en_US" = 'Pink Vest', "desc_en_US" = 'A charming trapezoidal vest. Moremi is 2D, so they can wear trapezoids.' WHERE _id = 'pink_vest';

-- pinkcandy: Strawberry Lollipop
UPDATE kkutu_shop_desc SET "name_en_US" = 'Strawberry Lollipop', "desc_en_US" = 'A sweet and sour giant strawberry flavored lollipop.' WHERE _id = 'pinkcandy';

-- purple_ice: Purple Ice
UPDATE kkutu_shop_desc SET "name_en_US" = 'Purple Ice', "desc_en_US" = 'Cool purple flavored ice cream to blow away the heat.' WHERE _id = 'purple_ice';

-- red_name: Red Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Red Name', "desc_en_US" = 'Paints your name in a <label class=''x-red_name''>passionate red color</label>.' WHERE _id = 'red_name';

-- redbere: Red Beret
UPDATE kkutu_shop_desc SET "name_en_US" = 'Red Beret', "desc_en_US" = 'A red beret. I think I can make a slightly unconventional design.' WHERE _id = 'redbere';

-- rio_seonghwa: Rio Torch
UPDATE kkutu_shop_desc SET "name_en_US" = 'Rio Torch', "desc_en_US" = 'A torch commemorating the 2016 Rio Olympics. The strange energy of the torch cheers you on.' WHERE _id = 'rio_seonghwa';

-- melon_ice: Melon Ice
UPDATE kkutu_shop_desc SET "name_en_US" = 'Melon Ice', "desc_en_US" = 'Refreshing melon flavored ice cream to blow away the heat.' WHERE _id = 'melon_ice';

-- mustache: Mustache
UPDATE kkutu_shop_desc SET "name_en_US" = 'Mustache', "desc_en_US" = 'If you want to feel gentlemanly play, grow a mustache full of profound charm.' WHERE _id = 'mustache';

-- nekomimi: Cat Ears
UPDATE kkutu_shop_desc SET "name_en_US" = 'Cat Ears', "desc_en_US" = 'If Moremi had ears, they would surely look like this. Make a cute Moremi that calls for pings.' WHERE _id = 'nekomimi';

-- brownbere: Brown Beret
UPDATE kkutu_shop_desc SET "name_en_US" = 'Brown Beret', "desc_en_US" = 'A brown beret with a profound feeling.' WHERE _id = 'brownbere';

-- miljip: Straw Hat
UPDATE kkutu_shop_desc SET "name_en_US" = 'Straw Hat', "desc_en_US" = 'No matter what anyone says, I''m going to be the KKuTu King! A hat that feels his energy.' WHERE _id = 'miljip';

-- orange_headphone: Orange Headphone
UPDATE kkutu_shop_desc SET "name_en_US" = 'Orange Headphone', "desc_en_US" = 'An essential item for popular Moremi. Equip this headphone and go into serious mode.' WHERE _id = 'orange_headphone';

-- spanner: Spanner
UPDATE kkutu_shop_desc SET "name_en_US" = 'Spanner', "desc_en_US" = 'A gift for the special people who worked hard to test KKuTu. Please realize this!' WHERE _id = 'spanner';

-- stars: Stars of the Night Sky
UPDATE kkutu_shop_desc SET "name_en_US" = 'Stars of the Night Sky', "desc_en_US" = 'The stars embroidering the night sky are sending you light of support.' WHERE _id = 'stars';

-- tile: Tile
UPDATE kkutu_shop_desc SET "name_en_US" = 'Tile', "desc_en_US" = 'A wall made of square tiles.' WHERE _id = 'tile';

-- b4_bb: Blueberry Sash Badge
UPDATE kkutu_shop_desc SET "name_en_US" = 'Blueberry Sash Badge', "desc_en_US" = 'A sash-shaped badge of wealth-bringing blue light.' WHERE _id = 'b4_bb';

-- bigeye: Circle Lenses
UPDATE kkutu_shop_desc SET "name_en_US" = 'Circle Lenses', "desc_en_US" = 'Circle lenses that raise Moremi''s eye radius by about 3 pixels.' WHERE _id = 'bigeye';

-- boxB2: Rare Badge Box
UPDATE kkutu_shop_desc SET "name_en_US" = 'Rare Badge Box', "desc_en_US" = 'A box containing one of two rare badges. What is inside?' WHERE _id = 'boxB2';

-- boxB3: High-grade Badge Box
UPDATE kkutu_shop_desc SET "name_en_US" = 'High-grade Badge Box', "desc_en_US" = 'A box containing one of three high-grade badges. What is inside?' WHERE _id = 'boxB3';

-- hamster_G: Gray Hamster Head
UPDATE kkutu_shop_desc SET "name_en_US" = 'Gray Hamster Head', "desc_en_US" = 'Kkyu!', "name_nya" = '잿빛 햄스터 머리', "desc_nya" = '햄찌는 먹는게 아니다냥!' WHERE _id = 'hamster_G';

-- invaderb: Invader Hat (Blue)
UPDATE kkutu_shop_desc SET "name_en_US" = 'Invader Hat (Blue)', "desc_en_US" = 'I will conquer the Earth!' WHERE _id = 'invaderb';

-- invaderg: Invader Hat (Green)
UPDATE kkutu_shop_desc SET "name_en_US" = 'Invader Hat (Green)', "desc_en_US" = 'I will conquer the Earth!' WHERE _id = 'invaderg';

-- inverteye: Inverted Eyes
UPDATE kkutu_shop_desc SET "name_en_US" = 'Inverted Eyes', "desc_en_US" = 'What happens if Moremi''s eye color changes? It becomes exactly like this.' WHERE _id = 'inverteye';

-- kktpixel: KKuTu Pixel Art Clothes
UPDATE kkutu_shop_desc SET "name_en_US" = 'KKuTu Pixel Art Clothes', "desc_en_US" = 'Pixel art clothes that evoke nostalgia for the old days.' WHERE _id = 'kktpixel';

-- lazy_eye: Lazy Eyes
UPDATE kkutu_shop_desc SET "name_en_US" = 'Lazy Eyes', "desc_en_US" = 'Become a Moremi who finds everything bothersome.' WHERE _id = 'lazy_eye';

-- ledboard: LED Signboard
UPDATE kkutu_shop_desc SET "name_en_US" = 'LED Signboard', "desc_en_US" = 'Moremi is wearing a signboard!' WHERE _id = 'ledboard';

-- orange_name: Orange Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Orange Name', "desc_en_US" = 'Paints your name in a <label class=''x-orange_name''>fresh orange color</label>.' WHERE _id = 'orange_name';

-- boxB4: Normal Badge Box
UPDATE kkutu_shop_desc SET "name_en_US" = 'Normal Badge Box', "desc_en_US" = 'A box containing one of three normal badges. What is inside?' WHERE _id = 'boxB4';

-- close_eye: LEBS
UPDATE kkutu_shop_desc SET "name_en_US" = 'Closed Eyes', "desc_en_US" = 'Your eyes become comfortable.' WHERE _id = 'close_eye';

-- cwd: Blue House
UPDATE kkutu_shop_desc SET "name_en_US" = 'Blue House', "desc_en_US" = 'Now that it''s come to this...!' WHERE _id = 'cwd';

-- bokjori: Bokjori
UPDATE kkutu_shop_desc SET "name_en_US" = 'Bokjori', "desc_en_US" = 'Bokjori commemorating the 2017 Lunar New Year. Happy New Year!' WHERE _id = 'bokjori';

-- dictPage: Encyclopedia Page
UPDATE kkutu_shop_desc SET "name_en_US" = 'Encyclopedia Page', "desc_en_US" = 'A single sheet of paper that fell out of an encyclopedia. Gain a small amount of EXP when used.' WHERE _id = 'dictPage';

-- ilusweater: I ♥ U
UPDATE kkutu_shop_desc SET "name_en_US" = 'I ♥ U', "desc_en_US" = 'I love you~' WHERE _id = 'ilusweater';

-- indigo_name: Indigo Name
UPDATE kkutu_shop_desc SET "name_en_US" = 'Indigo Name', "desc_en_US" = 'Paints your name in a <label class=''x-indigo_name''>chilly indigo color</label>.' WHERE _id = 'indigo_name';

