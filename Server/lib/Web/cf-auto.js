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
 * 글자 조합소 자동 조합 (사용자 사양 2026-11-16) — 만들 단어 고르기와 조각 배정. DB·돈은 routes/major.js가 맡는다.
 * 단어 찾기는 솎솎 봇(Game/games/sock.js)과 같은 방식: 가진 글자들로만 된 단어를 정규식으로 받고(major.js),
 * 글자 개수가 충분한지는 canMakeWord로 확인한다.
 *  1. collectPieces: 내 조각을 글자별로 센다 (등급 무관, 공백 조각 제외)
 *  2. planWords: 긴 단어부터 채운 뒤(탐욕), "단어 몇 개를 빼고 다르게 다시 채워 보기"로 점수가 오르면 바꾸기를 시간 안에서 되풀이.
 *     점수 = 단어 길이 제곱의 합 → 짧은 단어 여러 개보다 긴 단어를 최대한 많이 쓰는 쪽을 고른다. 같은 단어를 여러 번 써도 된다.
 *  3. assignTiers: 긴 단어부터 희귀 → 고급 → 일반 조각 순으로 넣는다 (희귀 조각이 가장 긴 단어에 들어감)
 */

var TIER_LEVEL = { A: 3, B: 2, C: 1 }; // major.js /cf의 레벨 계산(68 - 등급 글자 코드)과 같음
var LANG_CHAR = { ko: /^[가-힣]$/, en: /^[a-z]$/, ja: /^[ぁ-ん]$/ };
var PIECE = /^\$WP([ABC])(.)$/;
var MIN_LEN = 2;
var MAX_LEN = 10; // 조합 칸이 최대 10개

function charLang(ch) {
  for (var lang in LANG_CHAR) if (LANG_CHAR[lang].test(ch)) return lang;
  return null;
}
// 내 상자의 글자 조각을 센다. 공백 조각('★', 옛 '　')과 모르는 글자는 뺀다.
// count: 글자 → 개수(등급 합), tiers: 글자 → { A, B, C }, chars: 언어 → 그 언어 글자들(중복 없이)
function collectPieces(box) {
  var count = {}, tiers = {}, chars = {};
  var key, m, n, ch, lang;

  for (key in box) {
    if (!(m = key.match(PIECE))) continue;
    ch = m[2];
    if (!(lang = charLang(ch))) continue;
    n = Number(box[key]) || 0;
    if (n <= 0) continue;
    if (!tiers[ch]) {
      tiers[ch] = { A: 0, B: 0, C: 0 };
      count[ch] = 0;
      chars[lang] = (chars[lang] || "") + ch;
    }
    tiers[ch][m[1]] += n;
    count[ch] += n;
  }
  return { count: count, tiers: tiers, chars: chars };
}
// 그 글자들로만 된 단어 정규식 (SQL 매개변수로 넘김). 글자는 collectPieces가 거른 것이라 정규식 특수문자가 없다
function wordRegex(chars) {
  return "^[" + chars + "]+$";
}

// 단어에 글자가 몇 개씩 드는지 [글자, 개수, 글자, 개수, ...] — 솎솎 봇 canMakeWord의 개수 확인을 후보마다 미리 계산해 둔 것
function needOf(w) {
  var m = {}, list = [];
  var i, ch;

  for (i = 0; i < w.length; i++) m[w[i]] = (m[w[i]] || 0) + 1;
  for (ch in m) list.push(ch, m[ch]);
  return list;
}
function fits(rem, need) {
  for (var i = 0; i < need.length; i += 2) if ((rem[need[i]] || 0) < need[i + 1]) return false;
  return true;
}
function take(rem, w, d) {
  for (var i = 0; i < w.length; i++) rem[w[i]] -= d;
}
function score(plan) {
  var s = 0;

  for (var i = 0; i < plan.length; i++) s += plan[i].length * plan[i].length;
  return s;
}
function pieceCount(plan) {
  var n = 0;

  for (var i = 0; i < plan.length; i++) n += plan[i].length;
  return n;
}
// 씨앗이 같으면 같은 수열을 내는 난수 (mulberry32) — 같은 조각이면 시간 안에서 같은 결과가 나오게
function seededRandom(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(count) {
  var s = 0;

  Object.keys(count).sort().forEach(function (ch) {
    s = (Math.imul(s, 31) + ch.charCodeAt(0) * 7 + count[ch]) | 0;
  });
  return s;
}
// cand(긴 단어부터)를 차례로 보며 만들 수 있는 동안 넣는다. rand가 있으면 후보를 skipRate 확률로 건너뜀(다른 조합을 시험해 보려고)
function fill(rem, cand, plan, max, rand, skipRate) {
  for (var i = 0; i < cand.length && plan.length < max; i++) {
    if (rand && rand() < skipRate) continue;
    while (plan.length < max && fits(rem, cand[i].need)) {
      take(rem, cand[i].w, 1);
      plan.push(cand[i].w);
    }
  }
}
// 만들 단어 고르기. count: 글자 → 개수, words: 후보 단어(어느 순서든), max: 최대 단어 수, budgetMs: 개선에 쓸 시간
function planWords(count, words, max, budgetMs) {
  var deadline = Date.now() + (budgetMs === undefined ? 150 : budgetMs);
  var seen = new Set();
  var cand = [], rem, plan, rand, cur, curRem, curScore, bestScore, tries;

  // 길이·글자 조건과 한 번은 만들 수 있는지로 거르고, 긴 단어부터 (같은 길이는 받은 순서 = 자주 쓰는 순)
  words.forEach(function (w) {
    if (seen.has(w)) return;
    seen.add(w);
    if (w.length < MIN_LEN || w.length > MAX_LEN) return;
    var need = needOf(w);

    if (fits(count, need)) cand.push({ w: w, need: need });
  });
  cand.sort(function (a, b) { return b.w.length - a.w.length; });

  // 1. 탐욕: 긴 단어부터 채움
  rem = Object.assign({}, count);
  plan = [];
  fill(rem, cand, plan, max);

  // 2. 개선: 지금 고른 것에서 단어 1~4개를 무작위로 빼고, 후보를 절반쯤 건너뛰며 다시 채운 뒤 남은 자리를 탐욕으로 마저 채움.
  //    점수가 같거나 오르면 그쪽으로 옮겨 가고(같은 점수끼리도 옮겨 다녀야 막힌 데서 빠져나옴), 가장 좋았던 것을 남김.
  //    시간(budgetMs)이나 시도 횟수가 다 되면 멈춤
  rand = seededRandom(seedOf(count));
  cur = plan;
  curRem = rem;
  curScore = bestScore = score(plan);
  for (tries = 0; cur.length && tries < 3000 && Date.now() < deadline; tries++) {
    var next = cur.slice();
    var nextRem = Object.assign({}, curRem);
    var k = 1 + Math.floor(rand() * Math.min(4, next.length));

    while (k--) take(nextRem, next.splice(Math.floor(rand() * next.length), 1)[0], -1);
    fill(nextRem, cand, next, max, rand, 0.5);
    fill(nextRem, cand, next, max);

    var s = score(next);

    if (s < curScore) continue;
    cur = next;
    curRem = nextRem;
    curScore = s;
    if (s > bestScore || (s === bestScore && pieceCount(next) > pieceCount(plan))) {
      plan = next;
      bestScore = s;
    }
  }
  return plan.slice().sort(function (a, b) { return b.length - a.length; });
}
// 긴 단어부터 글자마다 희귀 → 고급 → 일반 조각 순으로 넣는다. 돌려주는 것: [{ word, tray: [조각 id], level }] (긴 단어부터)
function assignTiers(plan, tiers) {
  var left = {};
  var ch;

  for (ch in tiers) left[ch] = { A: tiers[ch].A, B: tiers[ch].B, C: tiers[ch].C };
  return plan.map(function (word) {
    var tray = [], level = 0;

    for (var i = 0; i < word.length; i++) {
      var t = left[word[i]];
      var tier = t.A > 0 ? "A" : t.B > 0 ? "B" : "C";

      t[tier]--;
      tray.push("$WP" + tier + word[i]);
      level += TIER_LEVEL[tier];
    }
    return { word: word, tray: tray, level: level };
  });
}

exports.MAX_LEN = MAX_LEN;
exports.collectPieces = collectPieces;
exports.wordRegex = wordRegex;
exports.planWords = planWords;
exports.assignTiers = assignTiers;
