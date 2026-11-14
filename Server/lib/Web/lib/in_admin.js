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

// 주의: grunt의 uglify-js 2.x로 빌드하므로 ES5 문법만 사용
(function () {
	var $temp = {};

	// ===== 상수 =====
	var SHOP_GROUPS = {
		'spec': '특수', 'skin': '스킨', 'badge': '휘장', 'head': '머리',
		'eye': '눈', 'mouth': '입', 'clothes': '옷', 'hs': '손발', 'back': '배경'
	};
	var SHOP_LANGS = [['ko_KR', '한국어'], ['en_US', '영어'], ['ja_JP', '일본어']];
	var TERM_UNITS = [
		['초', 1], ['분', 60], ['시간', 3600], ['일', 86400], ['주', 604800], ['개월', 2592000]
	];
	var KOR_FLAG = { '외래어': 1, '어인정': 2, '띄어쓰기': 4, '방언': 8, '옛말': 16, '문화어': 32 };
	var WORD_TYPES = ['', '0', '1', '2', '3', '7', '8', '9', '11', '15', '16', '17', '18', '19', '20', '26', 'INJEONG'];
	// routes/admin.js의 ALLOWED_USER_FIELDS가 저장하는 칸만 edit: true. 나머지는 서버가 버리므로 보기 전용.
	var USER_FIELDS = [
		{ k: '_id', label: 'ID' },
		{ k: 'nickname', label: '닉네임', edit: true },
		{ k: 'money', label: '핑', edit: true, type: 'number' },
		{ k: 'exordial', label: '소개', edit: true },
		{ k: 'nickChanged', label: '닉네임 바꾼 때', date: true },
		{ k: 'server', label: '접속 서버' },
		{ k: 'lastLogin', label: '마지막 접속', date: true },
		{ k: 'black', label: '차단 사유' },
		{ k: 'blockedUntil', label: '차단 해제일', date: true },
		{ k: 'box', label: '보관함 (JSON)', edit: true, json: true },
		{ k: 'kkutu', label: '게임 기록 (JSON)', json: true },
		{ k: 'equip', label: '장착 (JSON)', json: true },
		{ k: 'friends', label: '친구 (JSON)', json: true }
	];
	var KO_THEME_MAP = {
		'30': '경제', '40': '고적', '60': '공업', '80': '교육', '90': '교통',
		'140': '농업', '150': '문학', '160': '물리', '170': '미술', '190': '동물',
		'220': '사회', '230': '생물', '240': '수학', '270': '식물',
		'310': '언어', '320': '역사', '350': '운동', '360': '음악',
		'420': '지리', '430': '지명', '440': '책명', '450': '천문',
		'490': '컴퓨터', '530': '화학', '1001': '냐라 이름과 수도'
	};
	var KO_INJEONG_MAP = {
		'KRR': '개구리 중사 케로로', 'KDI': '국내 디스코드 서버', 'KTV': '국내 방송 프로그램',
		'KBS': '국내 버스 정류장', 'KPT': '국내 특허', 'KHJ': '국내 행정구역', 'KSC': '국내 학교',
		'TPW': '끄투 끝말잇기', 'BTC': '냥코 대전쟁', 'KOT': '대한민국 철도역',
		'DOT': '도타 2', 'DGM': '디지몬', 'RAG': '라면/간식', 'JLN': '라이트 노벨',
		'LVL': '러브 라이브!', 'LOL': '리그 오브 레전드', 'MAM': '오락실 게임',
		'MMM': '마법소녀 마도카★마기카', 'MCJ': '마인크래프트', 'JAN': '만화/애니메이션',
		'MAP': '메이플스토리', 'MKK': '메카쿠시티 액터즈', 'MNG': '모노가타리 시리즈',
		'MOB': '모바일 어플', 'VAL': '발로란트', 'BRS': '브롤스타즈', 'BLA': '블루 아카이브',
		'NEX': '비디오 게임', 'INC': '사건사고', 'COL': '색깔 이름', 'SAO': '소드 아트 온라인',
		'HRH': '스즈미야 하루히', 'STA': '스타크래프트', 'OIJ': '신조어',
		'KGR': '아지랑이 프로젝트', 'ESB': '앙상블 스타즈!', 'ELW': '엘소드',
		'KMV': '영화', 'OVW': '오버워치', 'WEB': '웹툰', 'KPO': '유명인',
		'VOC': '음성 합성 엔진', 'JAT': '일본 철도역', 'ZEL': '젤다의 전설',
		'CKR': '쿠키런', 'FUR': '퍼슈트', 'POK': '포켓몬스터', 'FRC': '프랜차이즈/체인점',
		'HSS': '하스스톤', 'HAI': '하이큐!!', 'HDC': '함대 컬렉션', 'HAR': '해리포터 시리즈',
		'HOS': '히어로즈 오브 더 스톰', 'IMS': 'THE iDOLM@STER',
		'KPM': '한국 대중음악',
		'GNS': '원신', 'HNK': '붕괴: 스타레일', 'PSK': '프로젝트 세카이',
		'UNE': '유네스코 유산', 'ANC': '동물의 숲 시리즈', 'ETR': '이터널 리턴',
		'WCH': '끝말잇기', 'KTN': '끄투엔'
	};
	var EN_THEME_MAP = {
		'e05': '동물', 'e08': '인체', 'e12': '감정', 'e13': '음식',
		'e15': '지명', 'e18': '사람', 'e20': '식물', 'e43': '날씨'
	};
	var EN_INJEONG_MAP = { 'LOL': '리그 오브 레전드', 'MCJ': '마인크래프트' };
	var JA_THEME_MAP = {
		'j01': '경제', 'j02': '고적', 'j03': '공업', 'j04': '교통', 'j05': '농업',
		'j06': '동물', 'j07': '물리', 'j08': '미술', 'j09': '불교', 'j10': '사회',
		'j11': '생물', 'j12': '수학', 'j13': '식물', 'j14': '신체', 'j15': '언어',
		'j16': '운동', 'j17': '음식', 'j18': '음악', 'j19': '의학', 'j20': '전통게임',
		'j21': '지리', 'j22': '천문', 'j23': '컴퓨터', 'j24': '화학'
	};
	var JA_INJEONG_MAP = {
		'PLC': '지명', 'PSN': '인명', 'EKI': '역명', 'ORG': '조직', 'CMP': '회사',
		'WRK': '작품명', 'PRD': '제품명', 'SRV': '서비스명', 'CHR': '캐릭터', 'EVT': '사건/행사',
		'FIC': '픽션', '0': '무주제'
	};

	// ===== 헬퍼: DOM =====
	function getEl(id) { return document.getElementById(id); }
	function emptyRow(cols, text) {
		return $('<tr>').addClass('empty-row').append($('<td>').attr('colspan', cols).text(text));
	}
	function fmtDate(v) {
		if (!v || v === '0') return '-';
		var d = new Date(isNaN(v) ? v : Number(v));
		if (isNaN(d.getTime())) return String(v);
		function z(n) { return (n < 10 ? '0' : '') + n; }
		return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
	}

	// ===== 헬퍼: 알림·오류 =====
	function toast(msg, type) {
		var $t = $('<div>').addClass('toast toast-' + (type || 'ok')).text(msg)
			.on('click', function () { $t.remove(); })
			.appendTo('#admin-toast');
		setTimeout(function () { $t.fadeOut(300, function () { $t.remove(); }); }, type === 'err' ? 8000 : 4000);
	}
	var RES_ERROR_TEXT = {
		400: '관리자 권한이 없거나 로그인이 만료되었습니다. 다시 로그인해 주세요.',
		503: '관리 데이터 접근이 일시 차단되어 있습니다.\n(routes/admin.js의 ADMIN_DATA_ACCESS_BLOCKED)'
	};
	var HTTP_ERROR_TEXT = {
		400: '요청이 거부되었습니다. 관리 암호와 입력값을 확인하세요.',
		404: '찾을 수 없습니다.'
	};
	// checkAdmin()은 HTTP 200으로 { error } 를 돌려주므로 성공 콜백에서 따로 걸러냄
	function failed(res) {
		if (!res || typeof res !== 'object' || !res.error) return false;
		toast(RES_ERROR_TEXT[res.error] || ('오류: ' + JSON.stringify(res)), 'err');
		return true;
	}
	function password() {
		var v = $('#db-password').val();
		if (!v) {
			toast('관리 암호를 먼저 입력하세요.', 'err');
			$('#db-password').focus();
		}
		return v;
	}
	function dbLang() { return $('#db-lang').val(); }
	function dbLangName() { return $('#db-lang option:selected').text(); }

	// ===== 헬퍼: 테마 =====
	function getThemesForLang(lang) {
		var r = {}, k;
		if (lang === 'ko') {
			for (k in KO_THEME_MAP) r[k] = KO_THEME_MAP[k];
			for (k in KO_INJEONG_MAP) r[k] = KO_INJEONG_MAP[k];
		} else if (lang === 'en') {
			for (k in EN_THEME_MAP) r[k] = EN_THEME_MAP[k];
			for (k in EN_INJEONG_MAP) r[k] = EN_INJEONG_MAP[k];
		} else if (lang === 'ja') {
			for (k in JA_THEME_MAP) r[k] = JA_THEME_MAP[k];
			for (k in JA_INJEONG_MAP) r[k] = JA_INJEONG_MAP[k];
		}
		return r;
	}
	function themeNames(codes, lang) {
		var themes = getThemesForLang(lang);
		return String(codes || '').split(',').map(function (c) { return themes[c] || c; }).join(', ');
	}
	function populateThemeDatalist() {
		var themes = getThemesForLang(dbLang());
		var $list = $('#db-theme-list').empty();
		for (var k in themes) {
			$('<option>').val(k).text(k + ' - ' + themes[k]).appendTo($list);
		}
	}
	function updateThemeName() {
		var themes = getThemesForLang(dbLang());
		$('#db-theme-name').text(themes[$.trim($('#db-theme').val())] || '');
	}

	// ===== 헬퍼: select 생성 (목록에 없는 기존 값도 지워지지 않게 옵션으로 넣음) =====
	function selectOf(id, pairs, selected) {
		var $sel = $('<select>').attr('id', id), found = false;
		pairs.forEach(function (p) {
			if (p[0] === selected) found = true;
			$('<option>').val(p[0]).text(p[1]).prop('selected', p[0] === selected).appendTo($sel);
		});
		if (!found && selected) $('<option>').val(selected).text(selected + ' (목록 밖)').prop('selected', true).appendTo($sel);
		return $sel;
	}

	// ===== 단어 편집: 입력칸 =====
	function wrPutter(x1, x2, x3, k, v) {
		var id = 'word-' + [x1, x2, x3, k].join('-');
		if (k === 'y') {
			return selectOf(id, WORD_TYPES.map(function (t) { return [t, t || '--']; }), v || '').addClass('w-s');
		}
		if (k === 't') {
			var themes = getThemesForLang($temp.wordLang), pairs = [['', '--']];
			for (var t in themes) pairs.push([t, t + ' ' + themes[t]]);
			return selectOf(id, pairs, v || '').addClass('w-g');
		}
		return $('<input>').attr('id', id).addClass('w-m').val(v);
	}
	function wordRow(x1, x2, x3, type, theme, mean) {
		return $('<tr>').attr('id', ['wr', x1, x2, x3].join('-'))
			.append($('<td>').addClass('c-key').html([x1, x2, x3].join('-')))
			.append($('<td>').append(wrPutter(x1, x2, x3, 'y', type)))
			.append($('<td>').append(wrPutter(x1, x2, x3, 't', theme)))
			.append($('<td>').addClass('c-grow').append(wrPutter(x1, x2, x3, 'm', mean)))
			.append(actionTd(x1, x2, x3));
	}
	function askKey(msg, def) {
		var key = prompt(msg, def);
		if (!key) return null;
		key = $.trim(key);
		if (key === def && getEl('wr-' + key)) return null;
		if (!/^\d+-\d+-\d+$/.test(key)) {
			toast('번호는 0-0-0처럼 숫자 세 개를 -로 이어 적어야 합니다.', 'err');
			return null;
		}
		if (getEl('wr-' + key)) {
			toast(key + ' 번호가 이미 있습니다.', 'err');
			return null;
		}
		return key;
	}

	// ===== 단어 편집: 플래그 체크박스 =====
	function buildFlagCheckboxes(flagVal) {
		var $div = $('#wd-flag').empty();
		for (var name in KOR_FLAG) {
			var val = KOR_FLAG[name];
			$('<label>').append(
				$('<input>').attr({ 'type': 'checkbox', 'value': val }).addClass('wd-flag-cb')
					.prop('checked', (flagVal & val) !== 0)
			).append(' ' + name).appendTo($div);
		}
	}
	function readFlagFromCheckboxes() {
		var flag = 0;
		$('.wd-flag-cb:checked').each(function () { flag |= parseInt($(this).val()); });
		return flag;
	}

	// ===== 단어 편집: 행 액션 =====
	function actionTd(x1, x2, x3) {
		var key = ['wa', x1, x2, x3].join('-') + '-';
		function btn(code, html, title) {
			return $('<button>').attr({ 'id': key + code, 'title': title }).html(html).on('click', onAction);
		}
		return $('<td>').addClass('row-actions')
			.append(btn('u', '&uarr;', '위로 (Shift: 번호도 바꿈)'))
			.append(btn('d', '&darr;', '아래로 (Shift: 번호도 바꿈)'))
			.append(btn('e', '번호', '번호 바꾸기'))
			.append(btn('x', '삭제', '이 뜻 삭제').addClass('danger'));
	}
	function onAction(e) {
		var key = $(e.currentTarget).attr('id').slice(3).split('-');
		var code = key.pop();
		var $target = $('#wr-' + key.join('-'));
		var temp;
		switch (code) {
			case 'u':
				if (!$target.prev().length) return;
				if (e.shiftKey) { changeId($target, $target.prev().attr('id').slice(3)); changeId($target.prev(), key.join('-')); }
				$target.prev().before($target);
				break;
			case 'x':
				$target.remove();
				break;
			case 'e':
				if ((temp = askKey('새 번호 (예: 0-0-1)', key.join('-')))) changeId($target, temp);
				break;
			case 'd':
				if (!$target.next().length) return;
				if (e.shiftKey) { changeId($target, $target.next().attr('id').slice(3)); changeId($target.next(), key.join('-')); }
				$target.next().after($target);
				break;
		}
	}
	function changeId($target, cur) {
		var prev = $target.attr('id').slice(3);
		$target.attr('id', 'wr-' + cur).children('td').first().html(cur);
		$target.find('*').each(function (i, o) {
			var $o = $(o);
			if (!$o.attr('id') || $o.attr('id').indexOf(prev) === -1) return;
			$o.attr('id', $o.attr('id').replace(prev, cur));
		});
	}

	// ===== 상점: 입력칸 =====
	function termToDisplay(seconds) {
		if (!seconds) return { val: 0, unit: 1 };
		for (var i = TERM_UNITS.length - 1; i >= 0; i--) {
			var u = TERM_UNITS[i][1];
			if (seconds % u === 0) return { val: seconds / u, unit: u };
		}
		return { val: seconds, unit: 1 };
	}
	function termPutter(sid, termSeconds) {
		var disp = termToDisplay(termSeconds);
		var $wrap = $('<div>').addClass('term-wrap');
		$('<input>').attr({ 'id': sid + '-term-val', 'type': 'number', 'min': '0' })
			.val(disp.val).appendTo($wrap);
		var $sel = $('<select>').attr('id', sid + '-term-unit');
		TERM_UNITS.forEach(function (u) {
			$('<option>').val(u[1]).text(u[0]).prop('selected', u[1] === disp.unit).appendTo($sel);
		});
		$sel.appendTo($wrap);
		return $wrap;
	}
	function readTerm(sid) {
		var ev = getEl(sid + '-term-val'), eu = getEl(sid + '-term-unit');
		var val = ev ? (parseInt(ev.value) || 0) : 0;
		var unit = eu ? (parseInt(eu.value) || 1) : 1;
		return val > 0 ? val * unit : 0;
	}
	function groupPutter(id, selected) {
		var pairs = [];
		for (var k in SHOP_GROUPS) pairs.push([k, SHOP_GROUPS[k]]);
		return selectOf(id, pairs, selected);
	}
	function optionsPutter(sid, opts) {
		opts = opts || {};
		var $wrap = $('<div>').addClass('opts-editor');
		function numRow(label, key, isRatio) {
			var stored = opts[key];
			var display = stored !== undefined ? (isRatio ? Math.round(stored * 10000) / 100 : stored) : '';
			$wrap.append(
				$('<label>').attr('for', sid + '-opt-' + key).text(label),
				$('<input>').attr({ 'id': sid + '-opt-' + key, 'type': 'number', 'step': isRatio ? '0.01' : '1', 'placeholder': '0' }).val(display)
			);
		}
		numRow('경험치 배율 %', 'gEXP', true);
		numRow('핑 배율 %', 'gMNY', true);
		numRow('분당 경험치', 'hEXP', false);
		numRow('분당 핑', 'hMNY', false);
		$wrap.append(
			$('<div>').addClass('opt-gif-row').append(
				$('<label>').append(
					$('<input>').attr({ 'id': sid + '-opt-gif', 'type': 'checkbox' })
						.prop('checked', opts.hasOwnProperty('gif'))
				).append(' GIF')
			)
		);
		return $wrap;
	}
	function readOptions(sid) {
		var opts = {};
		var eGEXP = getEl(sid + '-opt-gEXP'), eGMNY = getEl(sid + '-opt-gMNY');
		var eHEXP = getEl(sid + '-opt-hEXP'), eHMNY = getEl(sid + '-opt-hMNY');
		var eGIF = getEl(sid + '-opt-gif');
		var gEXP = eGEXP ? (parseFloat(eGEXP.value) || 0) : 0;
		var gMNY = eGMNY ? (parseFloat(eGMNY.value) || 0) : 0;
		var hEXP = eHEXP ? (parseFloat(eHEXP.value) || 0) : 0;
		var hMNY = eHMNY ? (parseFloat(eHMNY.value) || 0) : 0;
		var gif = eGIF ? eGIF.checked : false;
		if (gEXP) opts.gEXP = gEXP / 100;
		if (gMNY) opts.gMNY = gMNY / 100;
		if (hEXP) opts.hEXP = hEXP;
		if (hMNY) opts.hMNY = hMNY;
		if (gif) opts.gif = true;
		return opts;
	}
	function buildShopRow(nid, item, isNew) {
		var sid = 'si-' + nid;
		var opts = isNew ? {} : (item.options || {});
		var termSec = isNew ? 0 : (item.term || 0);
		var group = isNew ? 'head' : (item.group || 'head');

		var $row = $('<tr>').attr({ 'id': 'gu-' + nid, 'data-id': nid });
		if (isNew) $row.addClass('gu-new');

		$row
			.append($('<td>').addClass('c-check').append($('<input>').attr('type', 'checkbox').addClass('shop-sel')))
			.append($('<td>').append($('<input>').attr('id', sid + '-_id').addClass('w-g').val(nid)))
			.append($('<td>').append(
				$('<input>').attr({ 'id': sid + '-cost', 'type': 'number', 'min': '0' }).addClass('w-s')
					.val(isNew ? '' : (item.cost || 0))
			))
			.append($('<td>').append(
				$('<input>').attr({ 'id': sid + '-hit', 'type': 'number', 'readonly': true }).addClass('w-s')
					.val(isNew ? 0 : (item.hit || 0))
			))
			.append($('<td>').append(termPutter(sid, termSec)))
			.append($('<td>').append(groupPutter(sid + '-group', group)))
			.append($('<td>').append(optionsPutter(sid, opts)));
		SHOP_LANGS.forEach(function (l) {
			$row.append($('<td>').addClass('lang-cell').append(
				$('<input>').attr({ 'id': sid + '-name_' + l[0], 'placeholder': l[1] + ' 이름' }),
				$('<textarea>').attr({ 'id': sid + '-desc_' + l[0], 'rows': 2, 'placeholder': l[1] + ' 설명' })
			));
		});
		return $row;
	}

	// ===== 유저: 카드 =====
	function buildUserCard(item) {
		var $card = $('<div>').addClass('user-card').attr('data-id', item._id);
		$('<div>').addClass('uc-title').text((item.nickname || '(닉네임 없음)') + ' · ' + item._id).appendTo($card);
		var $grid = $('<div>').addClass('uc-grid').appendTo($card);
		USER_FIELDS.forEach(function (f) {
			var v = item[f.k], $in;
			if (f.json) {
				$in = $('<textarea>').attr('rows', f.edit ? 4 : 2).val(JSON.stringify(v || {}));
			} else {
				$in = $('<input>').attr('type', f.type || 'text');
				$in.val(f.date ? fmtDate(v) : (v === null || v === undefined ? '' : v));
				if (f.date && v) $in.attr('title', v);
			}
			$in.addClass('uf-' + f.k);
			if (!f.edit) $in.prop('readonly', true);
			$('<div>').addClass('uc-field' + (f.json ? ' wide' : ''))
				.append($('<label>').text(f.label), $in)
				.appendTo($grid);
		});
		return $card;
	}

	$(document).ready(function () {
		// ===== 공통: 오류·진행 표시 =====
		$(document).ajaxError(function (e, xhr) {
			toast((HTTP_ERROR_TEXT[xhr.status] || '서버 오류가 발생했습니다.') + ' (' + (xhr.status || '연결 실패') + ')', 'err');
		});
		$(document).ajaxStart(function () { $('#admin-busy').addClass('on'); })
			.ajaxStop(function () { $('#admin-busy').removeClass('on'); });

		// ===== 공통: 탭 (주소 #으로 기억) =====
		function showTab(name) {
			var $btn = $('.admin-tab').filter(function () { return $(this).attr('data-tab') === name; });
			if (!$btn.length) $btn = $('.admin-tab').first();
			$('.admin-tab').removeClass('on');
			$btn.addClass('on');
			$('.admin-pane').removeClass('on');
			$('#pane-' + $btn.attr('data-tab')).addClass('on');
		}
		$('.admin-tab').on('click', function () {
			var name = $(this).attr('data-tab');
			showTab(name);
			if (window.history && history.replaceState) history.replaceState(null, '', '#' + name);
		});
		showTab(location.hash.slice(1));

		// ===== 공통: 검색칸에서 Enter (한글 입력 중 중복 실행을 피하려고 keyup 사용) =====
		$('#admin').on('keyup', 'input[data-enter]', function (e) {
			if (e.which !== 13 || (e.originalEvent && e.originalEvent.isComposing)) return;
			$($(this).attr('data-enter')).trigger('click');
		});

		populateThemeDatalist();
		$('#db-lang').on('change', function () { populateThemeDatalist(); updateThemeName(); });

		// ===== 어인정 신청 =====
		function updateInjeongCount() {
			var all = 0, on = 0;
			$('#injeong-data tr.ij-row').each(function () {
				var checked = $(this).find('.ij-check').is(':checked');
				$(this).toggleClass('ok', checked);
				all++;
				if (checked) on++;
			});
			$('#injeong-count').text(all ? ('승인 ' + on + ' · 거절 ' + (all - on)) : '');
		}
		$('#injeong-go').on('click', function () {
			$.get('/gwalli/injeong', function (res) {
				if (failed(res)) return;
				var $table = $('#injeong-data').empty();
				if (!res.list.length) $table.append(emptyRow(6, '처리할 신청이 없습니다.'));
				res.list.forEach(function (item) {
					$('<tr>').addClass('ij-row').attr('data-origin', item._id)
						.append($('<td>').addClass('c-check').append($('<input>').attr('type', 'checkbox').addClass('ij-check')))
						.append($('<td>').append($('<input>').addClass('ij-word w-l').val(item._id)))
						.append($('<td>').append(
							$('<input>').addClass('ij-theme w-g').val(item.theme),
							$('<div>').addClass('cell-hint').text(themeNames(item.theme, 'ko'))
						))
						.append($('<td>').text(item.writer || '-'))
						.append($('<td>').addClass('c-nowrap').text(fmtDate(item.createdAt)))
						.append($('<td>').append($('<a>').attr({ 'target': '_blank', 'rel': 'noopener noreferrer', 'href': 'https://namu.moe/w/' + encodeURI(item._id) }).text('나무위키')))
						.appendTo($table);
				});
				updateInjeongCount();
			});
		});
		$('#injeong-data')
			.on('click', 'tr.ij-row', function (e) {
				if ($(e.target).is('input, a')) return;
				var $c = $(this).find('.ij-check');
				$c.prop('checked', !$c.prop('checked'));
				updateInjeongCount();
			})
			.on('change', '.ij-check', updateInjeongCount)
			.on('input', '.ij-theme', function () {
				$(this).next('.cell-hint').text(themeNames($(this).val(), 'ko'));
			});
		$('#injeong-everything').on('click', function () { $('#injeong-data .ij-check').prop('checked', true); updateInjeongCount(); });
		$('#injeong-nothing').on('click', function () { $('#injeong-data .ij-check').prop('checked', false); updateInjeongCount(); });
		$('#injeong-apply').on('click', function () {
			var list = [];
			$('#injeong-data tr.ij-row').each(function (i, o) {
				var $o = $(o);
				list.push({ _origin: $o.attr('data-origin'), _id: $o.find('.ij-word').val(), theme: $o.find('.ij-theme').val(), ok: $o.find('.ij-check').is(':checked') });
			});
			if (!list.length) return toast('먼저 목록을 불러오세요.', 'err');
			var pw = password();
			if (!pw) return;
			var ok = list.filter(function (v) { return v.ok; }).length;
			if (!confirm('승인 ' + ok + '개, 거절 ' + (list.length - ok) + '개를 적용할까요?\n체크하지 않은 항목은 모두 거절됩니다.')) return;
			$.post('/gwalli/injeong', { list: JSON.stringify({ list: list }), pw: pw }, function (res) {
				if (failed(res)) return;
				toast('적용했습니다. 승인한 단어는 몇 초에 걸쳐 차례로 추가됩니다.');
				$('#injeong-data').empty().append(emptyRow(6, '적용했습니다. 다시 불러오면 남은 신청을 볼 수 있습니다.'));
				updateInjeongCount();
			});
		});

		// ===== 단어 편집 =====
		$('#db-go').on('click', function () {
			var word = $.trim($('#db-word').val()), lang = dbLang();
			if (!word) return toast('단어를 입력하세요.', 'err');
			$.get('/gwalli/kkutudb/' + encodeURIComponent(word) + '?lang=' + lang, function (res) {
				if (failed(res)) return;
				// 저장할 때 검색칸이나 언어를 바꿔도 불러온 단어에 저장되도록 고정
				$temp.word = word;
				$temp.wordLang = lang;
				$('#wd-id').empty().append(
					$('<div>').addClass('wd-word').text(word),
					$('<label>').addClass('badge').text(dbLangName()),
					res ? null : $('<label>').addClass('badge badge-new').text('DB에 없는 단어 · 뜻을 추가해 새로 등록')
				);
				var $table = $('#wd-data').empty();
				$('#word-data').addClass('on');
				buildFlagCheckboxes(res ? (res.flag || 0) : 0);
				if (!res) return;

				var types = res.type ? res.type.split(',') : [];
				var themes = res.theme ? res.theme.split(',') : [];
				var means = res.mean ? res.mean.split(/＂[0-9]+＂/).slice(1).map(function (m1) {
					return (m1.indexOf('［') === -1) ? [[m1]] : m1.split(/［[0-9]+］/).slice(1).map(function (m2) {
						return m2.split(/（[0-9]+）/).slice(1);
					});
				}) : [[[]]];

				means.forEach(function (m1, x1) {
					m1.forEach(function (m2, x2) {
						var type = types.shift(), theme;
						m2.forEach(function (m3, x3) {
							theme = themes.shift();
							$table.append(wordRow(x1, x2, x3, type, theme, m3));
						});
					});
				});
			});
		});
		$('#word-add').on('click', function () {
			var next = 0;
			$('#wd-data tr').each(function () {
				next = Math.max(next, parseInt($(this).attr('id').split('-')[1]) + 1);
			});
			var key = askKey('새 뜻의 번호 (뜻묶음-하위-세부)', next + '-0-0');
			if (!key) return;
			key = key.split('-');
			$('#wd-data').append(wordRow(key[0], key[1], key[2], '', '', ''));
			$('#word-' + key.join('-') + '-m').focus();
		});
		$('#db-apply').on('click', function () {
			if (!$temp.word) return toast('먼저 단어를 불러오세요.', 'err');
			var pw = password();
			if (!pw) return;
			if (!$('#wd-data tr').length && !confirm('뜻이 하나도 없습니다. 저장하면 \'' + $temp.word + '\' 단어가 DB에서 삭제됩니다. 계속할까요?')) return;
			var obj = { _id: $temp.word, flag: readFlagFromCheckboxes(), type: [], theme: [], mean: [] };
			var pvt = false;
			$('#wd-data tr').each(function (i, o) {
				var $o = $(o);
				var key = $o.children('td').first().html().split('-');
				var tk = key[0] + '-' + key[1];
				var data = {
					type: $('#word-' + [key[0], key[1], key[2], 'y'].join('-')).val(),
					theme: $('#word-' + [key[0], key[1], key[2], 't'].join('-')).val(),
					mean: $('#word-' + [key[0], key[1], key[2], 'm'].join('-')).val()
				};
				if (pvt !== tk) { obj.type.push(data.type); pvt = tk; }
				obj.theme.push(data.theme);
				if (!obj.mean[key[0]]) obj.mean[key[0]] = [];
				if (!obj.mean[key[0]][key[1]]) obj.mean[key[0]][key[1]] = [];
				obj.mean[key[0]][key[1]][key[2]] = data.mean;
			});
			obj.type = obj.type.join(',');
			obj.theme = obj.theme.join(',');
			obj.mean = obj.mean.map(function (m1, x1) {
				if ($temp.wordLang === 'ko') return '＂' + (x1 + 1) + '＂' + m1.map(function (m2, x2) {
					return '［' + (x2 + 1) + '］' + m2.map(function (m3, x3) {
						return '（' + (x3 + 1) + '）' + m3;
					}).join('');
				}).join('');
				else return '＂' + (x1 + 1) + '＂' + m1;
			}).join('');
			$.post('/gwalli/kkutudb/' + encodeURIComponent($temp.word), {
				pw: pw, lang: $temp.wordLang, data: JSON.stringify(obj)
			}, function (res) {
				if (failed(res)) return;
				toast('\'' + $temp.word + '\' 저장했습니다.');
			});
		});

		// ===== 단어 일괄 처리 =====
		function readWordList() {
			return $('#db-list').val().split(/[,\r\n]+/).map(function (w) { return $.trim(w); }).filter(Boolean);
		}
		$('#db-list').on('input', function () { $('#db-list-count').text(readWordList().length + '개'); });
		$('#db-theme').on('input', updateThemeName);
		$('#db-load').on('click', function () {
			var theme = $.trim($('#db-theme').val()).replace(/^~/, '');
			if (!theme) return toast('불러올 주제 ID를 입력하세요.', 'err');
			$.get('/gwalli/kkututheme?theme=' + encodeURIComponent(theme) + '&lang=' + dbLang(), function (res) {
				if (failed(res)) return;
				$('#db-list').val(res.list.join('\n')).trigger('input');
				toast(res.list.length + '개 단어를 불러왔습니다.');
			});
		});
		$('#db-ok').on('click', function () {
			var theme = $.trim($('#db-theme').val()), words = readWordList();
			if (!theme || theme.charAt(0) === '~') return toast('추가할 주제 ID를 입력하세요.', 'err');
			if (!words.length) return toast('추가할 단어를 입력하세요.', 'err');
			var pw = password();
			if (!pw) return;
			if (!confirm(dbLangName() + ' DB에 ' + words.length + '개 단어를 주제 ' + theme + '(으)로 추가할까요?')) return;
			$.post('/gwalli/kkutudb', {
				pw: pw,
				lang: dbLang(),
				theme: theme,
				list: $('#db-list').val()
			}, function (res) {
				if (failed(res)) return;
				toast(words.length + '개 단어 추가를 요청했습니다.');
			});
		});
		$('#db-delete').on('click', function () {
			var words = readWordList();
			if (!words.length) return toast('삭제할 단어를 입력하세요.', 'err');
			var pw = password();
			if (!pw) return;
			if (!confirm(dbLangName() + ' DB에서 ' + words.length + '개 단어를 삭제할까요?\n되돌릴 수 없습니다.')) return;
			$.post('/gwalli/kkutudb/bulkdelete', {
				pw: pw,
				lang: dbLang(),
				list: JSON.stringify(words)
			}, function (res) {
				if (failed(res)) return;
				toast(res);
			});
		});

		// ===== 상점 =====
		function setShopHide(hiding) {
			$('#shop-hide').toggleClass('on', hiding).text(hiding ? '전체 보기' : '새 품목만 보기');
			$('#shop-data tr:not(.gu-new)').toggle(!hiding);
		}
		$('#shop-go').on('click', function () {
			var key = $.trim($('#shop-word').val()) || '~ALL';
			$.get('/gwalli/shop/' + encodeURIComponent(key), function (res) {
				if (failed(res)) return;
				if (!res || !res.goods) return toast('조회 실패: ' + JSON.stringify(res), 'err');
				var $table = $('#shop-data').empty();
				setShopHide(false);
				if (!res.goods.length) $table.append(emptyRow(10, '품목이 없습니다.'));
				res.goods.forEach(function (item) {
					$table.append(buildShopRow(item._id, item, false));
				});
				res.desc.forEach(function (item) {
					var sid = 'si-' + item._id;
					['name_ko_KR', 'desc_ko_KR', 'name_en_US', 'desc_en_US', 'name_ja_JP', 'desc_ja_JP'].forEach(function (k) {
						var el = getEl(sid + '-' + k);
						if (el) el.value = item[k] || '';
					});
				});
			});
		});
		$('#shop-hide').on('click', function () { setShopHide(!$(this).hasClass('on')); });
		$('#shop-add').on('click', function () {
			var nid = prompt('새 품목 ID');
			if (!nid) return;
			nid = $.trim(nid);
			if (getEl('gu-' + nid)) return toast(nid + ' 품목이 이미 목록에 있습니다.', 'err');
			$('#shop-data .empty-row').remove();
			var $row = buildShopRow(nid, {}, true).appendTo('#shop-data');
			$row[0].scrollIntoView({ block: 'nearest' });
			getEl('si-' + nid + '-cost').focus();
		});
		$('#shop-apply').on('click', function () {
			var list = [];
			$('#shop-data tr:visible').each(function (i, o) {
				var nid = $(o).attr('data-id');
				if (!nid) return;
				var sid = 'si-' + nid;
				var elId = getEl(sid + '-_id'), elCost = getEl(sid + '-cost'), elGroup = getEl(sid + '-group');
				if (!elId || !elCost || !elGroup) return;
				var elHit = getEl(sid + '-hit');
				list.push({
					_id: elId.value,
					core: {
						cost: parseInt(elCost.value) || 0,
						hit: elHit ? (parseInt(elHit.value) || 0) : 0,
						term: readTerm(sid),
						group: elGroup.value,
						updatedAt: Date.now(),
						options: readOptions(sid)
					},
					text: {
						name_ko_KR: (getEl(sid + '-name_ko_KR') || {}).value || '',
						desc_ko_KR:  (getEl(sid + '-desc_ko_KR')  || {}).value || '',
						name_en_US: (getEl(sid + '-name_en_US') || {}).value || '',
						desc_en_US:  (getEl(sid + '-desc_en_US')  || {}).value || '',
						name_ja_JP: (getEl(sid + '-name_ja_JP') || {}).value || '',
						desc_ja_JP:  (getEl(sid + '-desc_ja_JP')  || {}).value || ''
					}
				});
			});
			if (!list.length) return toast('저장할 품목이 없습니다.', 'err');
			var pw = password();
			if (!pw) return;
			$.post('/gwalli/shop', { list: JSON.stringify({ list: list }), pw: pw }, function (res) {
				if (failed(res)) return;
				toast(list.length + '개 품목을 저장했습니다.');
			});
		});
		$('#shop-delete-selected').on('click', function () {
			var ids = [];
			$('#shop-data tr:visible').each(function (i, o) {
				if ($(o).find('.shop-sel').is(':checked')) ids.push($(o).attr('data-id'));
			});
			ids = ids.filter(Boolean);
			if (!ids.length) return toast('삭제할 품목을 체크하세요.', 'err');
			var pw = password();
			if (!pw) return;
			if (!confirm(ids.length + '개 품목을 삭제할까요?\n' + ids.join(', '))) return;
			$.post('/gwalli/shop/delete', { list: JSON.stringify(ids), pw: pw }, function (res) {
				if (failed(res)) return;
				ids.forEach(function (id) { $(getEl('gu-' + id)).remove(); });
				toast(res);
			});
		});

		// ===== 유저 =====
		$('#user-go').on('click', function () {
			var id = $.trim($('#user-id').val()), nick = $.trim($('#user-nick').val());
			if (!id && !nick) return toast('유저 ID나 닉네임을 입력하세요.', 'err');
			$.get('/gwalli/users?id=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(nick), function (res) {
				if (failed(res)) return;
				var $box = $('#user-data').empty();
				res.list.forEach(function (item) {
					if (item) $box.append(buildUserCard(item));
				});
				if (!$box.children().length) $box.append($('<div>').addClass('empty-box').text('유저가 없습니다.'));
			});
		});
		$('#user-apply').on('click', function () {
			var list = [], badJson = null;
			$('#user-data .user-card').each(function (i, o) {
				var $o = $(o), box = $o.find('.uf-box').val();
				try { JSON.parse(box); } catch (e) { badJson = $o.attr('data-id'); return false; }
				list.push({
					_id: $o.attr('data-id'),
					money: $o.find('.uf-money').val(),
					nickname: $o.find('.uf-nickname').val(),
					exordial: $o.find('.uf-exordial').val(),
					box: box
				});
			});
			if (badJson) return toast(badJson + '의 보관함 JSON 형식이 올바르지 않습니다.', 'err');
			if (!list.length) return toast('먼저 유저를 조회하세요.', 'err');
			var pw = password();
			if (!pw) return;
			$.post('/gwalli/users', { list: JSON.stringify({ list: list }), pw: pw }, function (res) {
				if (failed(res)) return;
				toast(list.length + '명의 정보를 저장했습니다.');
			});
		});

		// ===== 유저 감시 =====
		function stopGamsi() {
			if (!$temp._gamsi) return;
			clearInterval($temp._gamsi);
			$temp._gamsi = null;
			$('#gamsi-state').text('중지됨');
		}
		function checkGamsi(id) {
			var $row = $('#gamsi-data tr').filter(function () { return $(this).attr('data-id') === id; });
			// 없는 유저(404)를 10초마다 전역 오류 알림으로 띄우지 않도록 global: false
			$.ajax({ url: '/gwalli/gamsi?id=' + encodeURIComponent(id), global: false }).done(function (res) {
				if (res && res.error) { stopGamsi(); return failed(res); }
				var hasServer = res.server || res.server === 0;
				$row.children().eq(1).text(res.title || '-');
				$row.children().eq(2).empty().append(hasServer
					? $('<a>').attr({ 'target': '_blank', 'href': '/?server=' + res.server }).text(res.server + '번 서버')
					: '접속 안 함');
			}).fail(function (xhr) {
				$row.children().eq(1).text(xhr.status === 404 ? '(없는 유저)' : '(확인 실패 ' + xhr.status + ')');
			});
		}
		$('#gamsi-go').on('click', function () {
			var list = $('#gamsi-id').val().split(/[,\s]+/).filter(Boolean), i = 0;
			if (!list.length) return toast('감시할 유저 ID를 입력하세요.', 'err');
			stopGamsi();
			var $data = $('#gamsi-data').empty();
			list.forEach(function (id) {
				$('<tr>').attr('data-id', id).append($('<td>').text(id), $('<td>').text('확인 중…'), $('<td>').text('-')).appendTo($data);
				checkGamsi(id);
			});
			$temp._gamsi = setInterval(function () {
				checkGamsi(list[i]);
				i = (i + 1) % list.length;
			}, 10000);
			$('#gamsi-state').text('감시 중 · ' + list.length + '명');
		});
		$('#gamsi-stop').on('click', stopGamsi);

		// ===== 인기 단어 =====
		$('#kpw-query').on('click', function () {
			var FIELD = ['한국어 종합', '한국어 최근', '한국어 3글자', '한국어 어인정', '영어 종합'];
			$.get('/gwalli/kkutuhot', function (res) {
				if (failed(res)) return;
				var $table = $('#kpw-table').empty();
				res.data.splice(1, 0, getDeltaRank(res.prev, res.data[0]));
				FIELD.forEach(function (item, index) {
					$table.append($('<div>').append($('<h3>').html(item)).append(getTable(res.prev, res.data[index])));
				});
				$('#kpw-html').val($table.html());
			});
			function getDeltaRank(prev, data) {
				return data.slice(0).sort(function (a, b) { return b.hit - (prev[b._id] || 0) - a.hit + (prev[a._id] || 0); });
			}
			function getTable(prev, data) {
				var $R = $('<table>'), pr = 0, ph;
				data.forEach(function (item, index) {
					if (index >= 30) return;
					var pd = prev[item._id] || 0, rank = (item.hit === ph) ? pr : index;
					pd = item.hit - pd;
					item.delta = pd ? ('(+' + pd + ')') : '-';
					$R.append($('<tr>')
						.append($("<td style='width:20px;text-align:center;background:#EEE'>").html(rank + 1))
						.append($("<td style='width:200px'>").text(item._id))
						.append($("<td style='width:40px'>").html(item.hit))
						.append($("<td style='width:40px'>").html(item.delta))
					);
					pr = rank; ph = item.hit;
				});
				return $R;
			}
		});
		$('#kpw-flush').on('click', function () {
			var pw = password();
			if (!pw) return;
			if (!confirm('지금 사용 횟수를 새 기준으로 저장할까요?\n이후 조회의 (+숫자)는 지금부터 늘어난 양으로 바뀝니다.')) return;
			$.post('/gwalli/kkutuhot', { pw: pw }, function (res) {
				if (failed(res)) return;
				if (res) return toast('저장 실패: ' + JSON.stringify(res), 'err');
				toast('지금 순위를 기준으로 저장했습니다.');
			});
		});
	});
})();
