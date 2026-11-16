/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * 옷장 (사용자 사양 2026-11-16) — 지금 착용한 것을 4칸 중 하나에 저장하고, 언제든 저장한 모습 그대로 바꿔 입는다.
 * - 저장: 착용 칸 전부(모레미·이름 스킨 NIK·휘장 BDG·배경 등)를 그대로 복사. 이름 없이 칸만 있음.
 * - 입기: 저장한 모습 그대로 — 프리셋에 없는 칸은 벗는다.
 * - 프리셋 속 아이템을 더 이상 갖고 있지 않으면(되팔기·기간 만료·조합 재료·이벤트 종료 등) 그 칸을 뺀다.
 *   아이템이 사라지는 길이 여러 곳이라, 옷장을 읽거나 입을 때마다 여기서 한 번에 정리한다(prune).
 * 이 파일은 DB를 모른다. user = { box, equip, wardrobe } 를 받아 그 자리에서 고치고, 저장은 routes/major.js가 한다.
 */

var SLOTS = 4;

// box 한 칸에서 지금 꺼내 쓸 수 있는 개수. 기간제({value, expire(초)})는 기간이 지나면 0
function usable(box, id, now) {
  var bd = box[id];

  if (!bd) return 0;
  if (typeof bd === "number") return bd;
  if (bd.expire && bd.expire < now) return 0;
  return Number(bd.value) || 0;
}
// 실제 갖고 있는 개수 = box에 남은 개수 + 그 아이템을 입고 있는 칸 수
// (입으면 box에서 빠지므로 major.js의 getMoonOwnedCount와 같은 규칙). 기간이 지난 기간제는 입고 있어도 0
function owned(user, id, now) {
  var bd = user.box[id];
  var n = usable(user.box, id, now);
  var part;

  if (bd && typeof bd === "object" && bd.expire && bd.expire < now) return 0;
  for (part in user.equip) if (user.equip[part] === id) n++;
  return n;
}
// 벗은 아이템을 box에 되돌림 — major.js /equip의 해제와 같은 결과 (기간제는 value+1, 나머지는 개수+1)
function putBack(box, id) {
  var bd = box[id];

  if (bd && typeof bd === "object" && bd.expire) bd.value = (Number(bd.value) || 0) + 1;
  else box[id] = (Number(bd) || 0) + 1;
}
// 입을 아이템 하나를 box에서 꺼냄 — major.js consume(force 없이)과 같음 (기간제는 0이 돼도 칸을 남김)
function takeOne(box, id) {
  var bd = box[id];

  if (typeof bd === "object") {
    if ((bd.value -= 1) <= 0 && !bd.expire) delete box[id];
  } else if ((box[id] -= 1) <= 0) delete box[id];
}
// DB 값(null·옛 모양 등)을 항상 { slots: [4칸] } 으로 맞춤. 칸은 null 또는 { equip: {칸: id}, at }
function normalize(wardrobe) {
  var src = wardrobe && Array.isArray(wardrobe.slots) ? wardrobe.slots : [];
  var slots = [];
  var i, p, part;

  for (i = 0; i < SLOTS; i++) {
    p = src[i];
    if (!p || typeof p !== "object" || !p.equip || typeof p.equip !== "object") {
      slots.push(null);
      continue;
    }
    var equip = {};
    for (part in p.equip) if (typeof p.equip[part] === "string") equip[part] = p.equip[part];
    slots.push({ equip: equip, at: Number(p.at) || 0 });
  }
  return { slots: slots };
}
// 프리셋마다 갖고 있지 않은 아이템 칸을 뺀다. 같은 아이템이 두 칸(양손)이면 2개가 있어야 둘 다 남는다.
// user.wardrobe를 정리된 모양으로 바꾸고, 뺀 아이템 id 목록을 돌려준다 (비었으면 바뀐 것 없음)
function prune(user, now) {
  var removed = [];

  user.wardrobe = normalize(user.wardrobe);
  user.wardrobe.slots.forEach(function (p) {
    if (!p) return;
    var used = {};

    Object.keys(p.equip).forEach(function (part) {
      var id = p.equip[part];

      used[id] = (used[id] || 0) + 1;
      if (used[id] > owned(user, id, now)) {
        delete p.equip[part];
        if (removed.indexOf(id) === -1) removed.push(id);
      }
    });
  });
  return removed;
}
// 지금 착용한 것을 slot 칸에 저장 (덮어씀)
function save(user, slot, nowMs) {
  var equip = {};
  var part;

  user.wardrobe = normalize(user.wardrobe);
  for (part in user.equip) if (typeof user.equip[part] === "string") equip[part] = user.equip[part];
  user.wardrobe.slots[slot] = { equip: equip, at: nowMs };
}
// slot 칸의 모습 그대로 입는다: 먼저 정리 → 지금 입은 것을 전부 box로 되돌림 → 프리셋 칸마다 box에서 꺼내 입음.
// 먼저 다 벗기 때문에 "지금 입은 프리셋 다시 입기"나 "왼손→오른손"도 따로 처리할 필요가 없다.
// 칸이 비어 있으면 null, 아니면 정리 때 뺀 아이템 id 목록을 돌려준다
function apply(user, slot, now) {
  var removed = prune(user, now);
  var p = user.wardrobe.slots[slot];
  var part, id;

  if (!p) return null;
  for (part in user.equip) putBack(user.box, user.equip[part]);
  user.equip = {};
  for (part in p.equip) {
    id = p.equip[part];
    if (usable(user.box, id, now) < 1) continue; // 정리했으므로 오지 않지만, 혹시 모를 경우 그 칸은 비워 둠
    takeOne(user.box, id);
    user.equip[part] = id;
  }
  return removed;
}

exports.SLOTS = SLOTS;
exports.normalize = normalize;
exports.prune = prune;
exports.save = save;
exports.apply = apply;
