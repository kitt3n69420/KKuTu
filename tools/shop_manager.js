'use strict';

/**
 * 상점 아이템 관리 도구 (로컬 전용)
 *
 * moremi 이미지 폴더에 있지만 DB에 없는 아이템을 감지하여
 * 웹 UI로 편집 후 kkutu_shop / kkutu_shop_desc에 삽입합니다.
 *
 * 사용법:
 *   node tools/shop_manager.js
 *   브라우저에서 http://localhost:3737 접속
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

module.paths.push(path.join(__dirname, '../Server/lib/node_modules'));
module.paths.push(path.join(__dirname, '../Server/node_modules'));

let pg;
try {
  pg = require('pg');
} catch (e) {
  console.error("오류: 'pg' 모듈을 찾을 수 없습니다.");
  process.exit(1);
}

let GLOBAL;
try {
  GLOBAL = require('../Server/lib/sub/global.json');
} catch (e) {
  console.error("오류: global.json 로드 실패:", e.message);
  process.exit(1);
}

const PORT = 3737;
const MOREMI_BASE = path.resolve(__dirname, '../Server/lib/Web/public/img/kkutu/moremi');

// 폴더명 → DB group 코드 매핑
const FOLDER_TO_GROUP = {
  head:    'Mhead',
  eye:     'Meye',
  mouth:   'Mmouth',
  clothes: 'Mclothes',
  shoes:   'Mshoes',
  hand:    'Mhand',
  back:    'Mback',
  front:   'Mfront',
  badge:   null   // BDG1~BDG4 중 사용자 선택
};

const BADGE_PREFIX_MAP = { b1: 'BDG1', b2: 'BDG2', b3: 'BDG3', b4: 'BDG4' };

const pool = new pg.Pool({
  host:     GLOBAL.PG_HOST,
  port:     GLOBAL.PG_PORT,
  database: GLOBAL.PG_DATABASE,
  user:     GLOBAL.PG_USER,
  password: GLOBAL.PG_PASSWORD,
});

async function runMigration() {
  await pool.query(`ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "name_nya" text`);
  await pool.query(`ALTER TABLE kkutu_shop_desc ADD COLUMN IF NOT EXISTS "desc_nya" text`);
  console.log('[마이그레이션] kkutu_shop_desc nya 컬럼 확인 완료');
}

// moremi 하위 폴더 스캔 → Map<id, {folders, ext}>
function scanFolders() {
  const result = new Map();
  for (const folder of Object.keys(FOLDER_TO_GROUP)) {
    const dir = path.join(MOREMI_BASE, folder);
    let files;
    try { files = fs.readdirSync(dir); } catch { continue; }
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext !== '.png' && ext !== '.gif') continue;
      const base = path.basename(file, ext);
      if (base === 'def') continue;
      if (!result.has(base)) result.set(base, { folders: [], ext: 'png' });
      result.get(base).folders.push(folder);
      if (ext === '.gif') result.get(base).ext = 'gif';
    }
  }
  return result;
}

// badge 이름 패턴으로 BDG 그룹 추측 (b1_* → BDG1 등)
function guessBadgeGroup(id) {
  const prefix = id.split('_')[0];
  return BADGE_PREFIX_MAP[prefix] || null;
}

async function getMissingItems() {
  const folderItems = scanFolders();
  const { rows } = await pool.query('SELECT _id FROM kkutu_shop');
  const dbIds = new Set(rows.map(r => r._id));

  const missing = [];
  for (const [id, info] of folderItems) {
    if (dbIds.has(id)) continue;

    let suggestedGroup = null;
    let badgeHint = null;

    if (info.folders.length === 1) {
      const group = FOLDER_TO_GROUP[info.folders[0]];
      if (group !== null) {
        suggestedGroup = group;
      } else {
        // badge 폴더 → 이름 패턴으로 힌트
        badgeHint = guessBadgeGroup(id);
      }
    }

    missing.push({
      id,
      folders: info.folders,
      ext: info.ext,
      suggestedGroup,
      badgeHint,
      isBadge: info.folders.includes('badge'),
      needsSelection: info.folders.length > 1 || info.folders.includes('badge'),
    });
  }

  missing.sort((a, b) => {
    if (a.needsSelection !== b.needsSelection) return a.needsSelection ? 1 : -1;
    return a.id < b.id ? -1 : 1;
  });
  return missing;
}

// cost < 0 이면 manual 효과 사용, cost > 0 이면 자동 계산
// manual: { gMNY(%), gEXP(%), hMNY(raw), hEXP(raw) } — gMNY/gEXP는 % 단위로 전달됨
function computeEffects(cost, isGif, isAI, manual) {
  const opts = {};
  if (isGif) opts.gif = true;
  if (isAI) opts.AI = true;
  if (cost < 0) {
    if (manual) {
      const gMNY = parseFloat(manual.gMNY) || 0;
      const gEXP  = parseFloat(manual.gEXP)  || 0;
      const hMNY = parseFloat(manual.hMNY) || 0;
      const hEXP  = parseFloat(manual.hEXP)  || 0;
      if (gMNY > 0) opts.gMNY = gMNY / 100;  // % → 소수
      if (gEXP  > 0) opts.gEXP  = gEXP  / 100;
      if (hMNY > 0) opts.hMNY = hMNY;
      if (hEXP  > 0) opts.hEXP  = hEXP;
    }
  } else if (cost > 0) {
    const base = Math.floor(cost / 100);
    if (base > 0) {
      const rawGmny = Math.floor(Math.random() * (base + 1));
      const rawGexp = base - rawGmny;
      if (rawGmny > 0) opts.gMNY = rawGmny * 0.01;
      if (rawGexp > 0) opts.gEXP = rawGexp * 0.01;
    }
  }
  return opts;
}

async function saveItems(items) {
  const now = Date.now();
  const results = [];
  for (const item of items) {
    try {
      const cost = parseInt(item.cost, 10) || 0;
      const term = (parseInt(item.termDays, 10) || 0) * 86400;
      const opts = computeEffects(cost, !!item.isGif, !!item.isAI, item.manual);

      await pool.query(
        `INSERT INTO kkutu_shop (_id, cost, hit, term, "group", "updatedAt", options)
         VALUES ($1,$2,0,$3,$4,$5,$6)
         ON CONFLICT (_id) DO UPDATE SET
           cost=$2, term=$3, "group"=$4, "updatedAt"=$5, options=$6`,
        [item.id, cost, term, item.group, now, JSON.stringify(opts)]
      );

      await pool.query(
        `INSERT INTO kkutu_shop_desc
           (_id, "name_ko_KR", "desc_ko_KR", "name_en_US", "desc_en_US", "name_nya", "desc_nya")
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (_id) DO UPDATE SET
           "name_ko_KR"=$2, "desc_ko_KR"=$3,
           "name_en_US"=$4, "desc_en_US"=$5,
           "name_nya"=$6,   "desc_nya"=$7`,
        [item.id,
         item.name_ko || '', item.desc_ko || '',
         item.name_en || '', item.desc_en || '',
         item.name_nya || '', item.desc_nya || '']
      );

      results.push({ id: item.id, ok: true });
    } catch (e) {
      results.push({ id: item.id, ok: false, error: e.message });
    }
  }
  return results;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveImage(res, folder, filename) {
  if (!Object.prototype.hasOwnProperty.call(FOLDER_TO_GROUP, folder)) {
    res.writeHead(404); res.end(); return;
  }
  const filePath = path.join(MOREMI_BASE, folder, path.basename(filename));
  if (!filePath.startsWith(path.join(MOREMI_BASE, folder))) {
    res.writeHead(403); res.end(); return;
  }
  const ext = path.extname(filename).toLowerCase();
  const mime = ext === '.gif' ? 'image/gif' : 'image/png';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── HTML 페이지 ──────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>상점 아이템 관리</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic',Consolas,sans-serif;background:#0f0f1a;color:#dde;padding:16px;font-size:13px}
h1{color:#e76f51;margin-bottom:12px;font-size:20px}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
#msg{color:#aaa;font-size:12px;margin-left:4px}
button{background:#1e1e3a;color:#dde;border:1px solid #44447a;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px}
button:hover{background:#2e2e5a}
.btn-primary{background:#e76f51;border-color:#e76f51;color:#fff}
.btn-primary:hover{background:#c85e41}
.btn-save{background:#2a7a3a;border-color:#2a7a3a;color:#fff;padding:4px 10px;font-size:11px}
.btn-save:hover{background:#1f5e2c}
.btn-small{padding:3px 8px;font-size:11px}

table{width:100%;border-collapse:collapse}
thead th{background:#181830;padding:7px 6px;text-align:center;border-bottom:2px solid #44447a;white-space:nowrap;position:sticky;top:0;z-index:10}
tbody tr.main-row{border-bottom:1px solid #2a2a4a}
tbody tr.main-row:hover td{background:#1a1a30}
tbody tr.main-row.saved td{background:#0d2a18 !important}
tbody tr.main-row.error td{background:#2a0d0d !important}
td{padding:5px 6px;vertical-align:middle}

img.thumb{width:48px;height:48px;object-fit:contain;background:#fff3;border-radius:4px;image-rendering:pixelated;display:block;margin:auto}
.id-cell{font-family:Consolas,monospace;font-size:12px;white-space:nowrap}
.ext-badge{font-size:10px;color:#f4a;border:1px solid #f4a;border-radius:2px;padding:1px 4px;margin-left:4px}

select,input[type=number],input[type=text],textarea{
  background:#16162e;color:#dde;border:1px solid #44447a;
  padding:4px 6px;border-radius:3px;font-size:12px;width:100%}
select{cursor:pointer}
.group-wrap{display:flex;gap:4px;align-items:center;min-width:170px}
.group-wrap select{flex:1}
.hint{color:#fa0;font-size:10px;white-space:nowrap}

.eff-cell{font-size:11px;text-align:center}
.eff-auto{color:#6f6}
.eff-note{color:#666;font-size:10px}
.eff-manual{font-size:11px}
.eff-manual table{border-collapse:collapse;width:100%}
.eff-manual td{padding:2px 3px;white-space:nowrap}
.eff-manual td:first-child{color:#aaa;text-align:right;padding-right:4px;min-width:65px}
.eff-manual input[type=number]{width:64px;padding:2px 4px;font-size:11px}
.ai-check{font-size:11px;color:#fc9;margin-bottom:4px;display:flex;align-items:center;gap:4px;justify-content:center;white-space:nowrap}

.status-cell{text-align:center;white-space:nowrap;min-width:70px}
.ok-badge{color:#5f5;font-size:11px}
.err-badge{color:#f55;font-size:11px}

/* 설명 확장 행 */
.desc-row td{padding:0}
.desc-inner{padding:10px 16px;background:#12122a;display:none}
.desc-inner.open{display:block}
.tabs{display:flex;gap:2px;margin-bottom:0}
.tab{padding:5px 14px;cursor:pointer;background:#1e1e3a;border:1px solid #44447a;border-bottom:none;border-radius:4px 4px 0 0;color:#aaa;font-size:12px}
.tab.active{background:#16162e;color:#fff;border-color:#6af;border-bottom-color:#16162e}
.tab-panel{display:none;padding:10px;background:#16162e;border:1px solid #44447a;border-radius:0 4px 4px 4px}
.tab-panel.active{display:grid;grid-template-columns:60px 1fr;gap:6px;align-items:start}
.tab-panel label{font-size:11px;color:#aaa;padding-top:4px}
textarea{resize:vertical;min-height:52px;font-family:inherit}
.toggle-desc{background:none;border:none;color:#6af;font-size:15px;cursor:pointer;padding:2px 6px;width:auto}

.needs-sel-label{color:#fa0;font-size:10px;font-weight:bold}
#empty-msg{color:#777;padding:20px;text-align:center;display:none}
</style>
</head>
<body>
<h1>상점 아이템 관리 — 미등록 감지</h1>
<div class="toolbar">
  <button class="btn-primary" onclick="load()">DB에 없는 아이템 불러오기</button>
  <button onclick="saveAll()">전체 저장</button>
  <span id="msg">서버 연결됨</span>
</div>

<table id="tbl">
  <thead>
    <tr>
      <th style="width:56px">미리보기</th>
      <th>ID</th>
      <th style="width:190px">부위 (group)</th>
      <th style="width:90px">가격</th>
      <th style="width:90px">기한(일)<br><span style="font-weight:normal;font-size:10px">0=영구</span></th>
      <th style="width:140px">AI / 효과</th>
      <th style="width:40px">설명</th>
      <th style="width:80px">저장</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>
<div id="empty-msg">미등록 아이템이 없습니다.</div>

<script>
const ALL_GROUPS = [
  ['Mhead','머리 (Mhead)'],['Meye','눈 (Meye)'],['Mmouth','입 (Mmouth)'],
  ['Mclothes','옷 (Mclothes)'],['Mshoes','신발 (Mshoes)'],['Mhand','손 (Mhand)'],
  ['Mback','배경 (Mback)'],['Mfront','앞배경 (Mfront)'],
  ['BDG1','휘장 1등급 (BDG1)'],['BDG2','휘장 2등급 (BDG2)'],
  ['BDG3','휘장 3등급 (BDG3)'],['BDG4','휘장 4등급 (BDG4)']
];

let itemData = {};  // id → server item object

function msg(s) { document.getElementById('msg').textContent = s; }

function effText(cost) {
  const c = parseInt(cost, 10) || 0;
  if (c < 0) return '';
  const base = Math.floor(c / 100);
  if (base <= 0) return '<span class="eff-note">없음 (base=0)</span>';
  return '<b>합 ' + base + '%</b>';
}

function updateEffect(id, costVal) {
  const cost = parseInt(costVal, 10);
  const isNeg = cost < 0;
  document.getElementById('eff-auto-' + id).style.display = isNeg ? 'none' : '';
  document.getElementById('eff-manual-' + id).style.display = isNeg ? '' : 'none';
  if (!isNeg) {
    document.getElementById('eff-' + id).innerHTML = effText(cost);
  }
}

function makeGroupSelect(item, idSafe) {
  const wrap = document.createElement('div');
  wrap.className = 'group-wrap';

  const sel = document.createElement('select');
  sel.id = 'grp-' + idSafe;
  for (const [val, label] of ALL_GROUPS) {
    const o = document.createElement('option');
    o.value = val; o.textContent = label;
    const picked = item.suggestedGroup || item.badgeHint;
    if (picked === val) o.selected = true;
    sel.appendChild(o);
  }

  wrap.appendChild(sel);

  if (item.suggestedGroup) {
    // 자동 감지 → 잠금 + 변경 버튼
    sel.disabled = true;
    sel.style.opacity = '0.75';
    const btn = document.createElement('button');
    btn.textContent = '변경'; btn.className = 'btn-small';
    btn.onclick = () => { sel.disabled = false; sel.style.opacity = '1'; btn.remove(); };
    wrap.appendChild(btn);
  } else {
    // 선택 필요
    const lbl = document.createElement('span');
    lbl.className = item.isBadge ? 'hint' : 'needs-sel-label';
    lbl.textContent = item.isBadge ? (item.badgeHint ? '↑힌트' : '선택 필요') : '선택 필요';
    wrap.appendChild(lbl);
  }
  return wrap;
}

function buildRow(item) {
  const idSafe = CSS.escape(item.id);
  itemData[item.id] = item;

  // Main row
  const tr = document.createElement('tr');
  tr.className = 'main-row';
  tr.id = 'mrow-' + item.id;

  // 미리보기
  const imgTd = document.createElement('td');
  imgTd.style.textAlign = 'center';
  const imgEl = document.createElement('img');
  imgEl.className = 'thumb';
  imgEl.src = '/img/' + item.folders[0] + '/' + item.id + '.' + item.ext;
  imgEl.alt = item.id;
  imgEl.title = item.id + '.' + item.ext;
  imgTd.appendChild(imgEl);

  // ID
  const idTd = document.createElement('td');
  idTd.className = 'id-cell';
  idTd.textContent = item.id;
  if (item.ext === 'gif') {
    const b = document.createElement('span');
    b.className = 'ext-badge'; b.textContent = 'GIF';
    idTd.appendChild(b);
  }

  // 부위
  const grpTd = document.createElement('td');
  grpTd.appendChild(makeGroupSelect(item, item.id));

  // 가격
  const costTd = document.createElement('td');
  const costIn = document.createElement('input');
  costIn.type = 'number'; costIn.min = '0'; costIn.value = '1000';
  costIn.id = 'cost-' + item.id;
  costIn.oninput = function() { updateEffect(item.id, this.value); };
  costTd.appendChild(costIn);

  // 기한
  const termTd = document.createElement('td');
  const termIn = document.createElement('input');
  termIn.type = 'number'; termIn.min = '0'; termIn.value = '0';
  termIn.id = 'term-' + item.id;
  termTd.appendChild(termIn);

  // 효과
  const effTd = document.createElement('td');
  effTd.className = 'eff-cell';

  // AI 체크박스
  const aiLabel = document.createElement('label');
  aiLabel.className = 'ai-check';
  const aiCheck = document.createElement('input');
  aiCheck.type = 'checkbox'; aiCheck.id = 'ai-' + item.id;
  aiLabel.append(aiCheck, 'AI 제작');
  effTd.appendChild(aiLabel);

  // 자동 효과 미리보기 (cost >= 0)
  const effAuto = document.createElement('div');
  effAuto.id = 'eff-auto-' + item.id;
  effAuto.className = 'eff-auto';
  const effSpan = document.createElement('span');
  effSpan.id = 'eff-' + item.id;
  effSpan.innerHTML = effText(1000);
  const effNote = document.createElement('div');
  effNote.className = 'eff-note'; effNote.textContent = '(저장 시 랜덤 분배)';
  effAuto.append(effSpan, effNote);

  // 수동 효과 입력 (cost < 0)
  const effManual = document.createElement('div');
  effManual.id = 'eff-manual-' + item.id;
  effManual.className = 'eff-manual';
  effManual.style.display = 'none';
  effManual.innerHTML =
    '<table>' +
    '<tr><td>gMNY %</td><td><input type="number" id="gMNY-' + item.id + '" min="0" step="0.01" value="0"></td></tr>' +
    '<tr><td>gEXP %</td><td><input type="number" id="gEXP-' + item.id + '" min="0" step="0.01" value="0"></td></tr>' +
    '<tr><td>hMNY (분당)</td><td><input type="number" id="hMNY-' + item.id + '" min="0" step="1" value="0"></td></tr>' +
    '<tr><td>hEXP (분당)</td><td><input type="number" id="hEXP-' + item.id + '" min="0" step="1" value="0"></td></tr>' +
    '</table>';

  effTd.append(effAuto, effManual);

  // 설명 토글
  const descTd = document.createElement('td');
  descTd.style.textAlign = 'center';
  const togBtn = document.createElement('button');
  togBtn.className = 'toggle-desc'; togBtn.textContent = '▼';
  togBtn.title = '언어별 설명 펼치기';
  togBtn.onclick = () => {
    const inner = document.getElementById('desc-' + item.id);
    const open = inner.classList.toggle('open');
    togBtn.textContent = open ? '▲' : '▼';
  };
  descTd.appendChild(togBtn);

  // 저장
  const saveTd = document.createElement('td');
  saveTd.className = 'status-cell';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-save'; saveBtn.textContent = '저장';
  saveBtn.onclick = () => saveOne(item.id);
  const stSpan = document.createElement('span');
  stSpan.id = 'st-' + item.id;
  stSpan.style.display = 'block';
  stSpan.style.marginTop = '3px';
  saveTd.append(saveBtn, stSpan);

  tr.append(imgTd, idTd, grpTd, costTd, termTd, effTd, descTd, saveTd);

  // Desc row
  const dr = document.createElement('tr');
  dr.className = 'desc-row';
  const dc = document.createElement('td');
  dc.colSpan = 8;

  const inner = document.createElement('div');
  inner.className = 'desc-inner';
  inner.id = 'desc-' + item.id;

  // Tabs
  const langs = [
    {key:'ko', label:'한국어'},
    {key:'en', label:'English'},
    {key:'nya', label:'Nya'},
  ];
  const tabBar = document.createElement('div');
  tabBar.className = 'tabs';
  const panels = [];

  langs.forEach((lang, li) => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (li === 0 ? ' active' : '');
    tab.textContent = lang.label;
    tab.onclick = () => {
      tabBar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      panels[li].classList.add('active');
    };
    tabBar.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'tab-panel' + (li === 0 ? ' active' : '');
    panel.innerHTML =
      '<label>이름</label><input type="text" id="nm-' + lang.key + '-' + item.id + '" placeholder="아이템 이름">' +
      '<label>설명</label><textarea id="dc-' + lang.key + '-' + item.id + '" placeholder="아이템 설명"></textarea>';
    panels.push(panel);
  });

  inner.appendChild(tabBar);
  panels.forEach(p => inner.appendChild(p));
  dc.appendChild(inner);
  dr.appendChild(dc);

  return [tr, dr];
}

async function load() {
  msg('불러오는 중...');
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  try {
    const res = await fetch('/api/missing');
    const list = await res.json();
    if (list.error) { msg('오류: ' + list.error); return; }
    msg(list.length + '개 미등록 아이템');
    document.getElementById('empty-msg').style.display = list.length ? 'none' : 'block';
    list.forEach(item => {
      const [main, desc] = buildRow(item);
      tbody.append(main, desc);
    });
  } catch (e) {
    msg('불러오기 실패: ' + e.message);
  }
}

function collectItem(id) {
  const grpEl = document.getElementById('grp-' + id);
  const cost = parseInt(document.getElementById('cost-' + id).value, 10) || 0;
  const aiEl = document.getElementById('ai-' + id);
  let manual = null;
  if (cost < 0) {
    manual = {
      gMNY: parseFloat((document.getElementById('gMNY-' + id) || {}).value) || 0,
      gEXP:  parseFloat((document.getElementById('gEXP-'  + id) || {}).value) || 0,
      hMNY: parseFloat((document.getElementById('hMNY-' + id) || {}).value) || 0,
      hEXP:  parseFloat((document.getElementById('hEXP-'  + id) || {}).value) || 0,
    };
  }
  return {
    id,
    group:    grpEl ? grpEl.value : '',
    cost,
    termDays: parseInt(document.getElementById('term-' + id).value, 10) || 0,
    isGif:    itemData[id] ? itemData[id].ext === 'gif' : false,
    isAI:     aiEl ? aiEl.checked : false,
    manual,
    name_ko:  (document.getElementById('nm-ko-'  + id) || {}).value || '',
    desc_ko:  (document.getElementById('dc-ko-'  + id) || {}).value || '',
    name_en:  (document.getElementById('nm-en-'  + id) || {}).value || '',
    desc_en:  (document.getElementById('dc-en-'  + id) || {}).value || '',
    name_nya: (document.getElementById('nm-nya-' + id) || {}).value || '',
    desc_nya: (document.getElementById('dc-nya-' + id) || {}).value || '',
  };
}

function applyResult(r) {
  const st = document.getElementById('st-' + r.id);
  const row = document.getElementById('mrow-' + r.id);
  if (!st) return;
  if (r.ok) {
    st.innerHTML = '<span class="ok-badge">✓ 저장됨</span>';
    if (row) row.classList.add('saved');
  } else {
    st.innerHTML = '<span class="err-badge" title="' + (r.error||'').replace(/"/g,'&quot;') + '">✗ 오류</span>';
    if (row) row.classList.add('error');
  }
}

async function saveOne(id) {
  const st = document.getElementById('st-' + id);
  if (st) st.textContent = '저장 중...';
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([collectItem(id)])
    });
    const results = await res.json();
    (Array.isArray(results) ? results : [results]).forEach(applyResult);
  } catch (e) {
    if (st) st.innerHTML = '<span class="err-badge">실패</span>';
  }
}

async function saveAll() {
  const rows = document.querySelectorAll('#tbody tr.main-row');
  if (!rows.length) { msg('먼저 아이템을 불러오세요.'); return; }
  msg('전체 저장 중...');
  const all = Array.from(rows).map(tr => collectItem(tr.id.slice(5)));
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all)
    });
    const results = await res.json();
    if (!Array.isArray(results)) { msg('서버 오류: ' + JSON.stringify(results)); return; }
    results.forEach(applyResult);
    const ok = results.filter(r => r.ok).length;
    msg(ok + '/' + results.length + '개 저장됨');
  } catch (e) {
    msg('전체 저장 실패: ' + e.message);
  }
}

window.onload = load;
</script>
</body>
</html>`;

// ── HTTP 서버 ────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  // 이미지 서빙: /img/:folder/:filename
  const imgMatch = pathname.match(/^\/img\/([^/]+)\/([^/]+)$/);
  if (req.method === 'GET' && imgMatch) {
    serveImage(res, imgMatch[1], imgMatch[2]);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/missing') {
    try {
      const items = await getMissingItems();
      sendJson(res, 200, items);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/save') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const items = JSON.parse(body);
        if (!Array.isArray(items)) throw new Error('배열을 전달해야 합니다');
        const results = await saveItems(items);
        sendJson(res, 200, results);
      } catch (e) {
        sendJson(res, 400, { error: e.message });
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

async function main() {
  try {
    await runMigration();
  } catch (e) {
    console.warn('[마이그레이션 경고]', e.message, '(이미 존재하는 컬럼일 수 있습니다)');
  }

  server.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('  상점 아이템 관리 도구 시작됨');
    console.log('  ─────────────────────────────────');
    console.log('  http://localhost:' + PORT);
    console.log('');
    console.log('  브라우저에서 위 주소를 여세요. Ctrl+C 로 종료.');
    console.log('');
  });

  process.on('SIGINT', async () => {
    console.log('\n[종료 중...]');
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
  });
}

main().catch(e => {
  console.error('시작 오류:', e.message);
  process.exit(1);
});
