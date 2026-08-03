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

(function () {
	var WIDTH = { 'y': 50, 't': 50, 'g': 100, 'l': 200, 'm': 600 };
	var $temp = {};

	// ===== 상수 =====
	var SHOP_GROUPS = {
		'spec': '특수', 'skin': '스킨', 'badge': '휘장', 'head': '머리',
		'eye': '눈', 'mouth': '입', 'clothes': '옷', 'hs': '손발', 'back': '배경'
	};
	var TERM_UNITS = [
		['초', 1], ['분', 60], ['시간', 3600], ['일', 86400], ['주', 604800], ['개월', 2592000]
	];
	var KOR_FLAG = { '외래어': 1, '어인정': 2, '띄어쓰기': 4, '방언': 8, '옛말': 16, '문화어': 32 };
	var WORD_TYPES = ['', '0', '1', '2', '3', '7', '8', '9', '11', '15', '16', '17', '18', '19', '20', '26', 'INJEONG'];
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
		'WCH': '끝말잇기'
	};
	var EN_THEME_MAP = {
		'e05': '동물', 'e08': '인체', 'e12': '감정', 'e13': '음식',
		'e15': '지명', 'e18': '사람', 'e20': '식물', 'e43': '날씨'
	};
	var EN_INJEONG_MAP = { 'LOL': '리그 오브 레전드', 'MCJ': '마인크래프트' };

	// ===== 헬퍼: DOM =====
	function getEl(id) { return document.getElementById(id); }

	// ===== 헬퍼: 기본 입력 =====
	function putter(id, w, value) {
		return $('<input>').attr('id', id).css('width', WIDTH[w]).val(value);
	}
	function wrPutter(x1, x2, x3, k, v) {
		var id = 'word-' + [x1, x2, x3, k].join('-');
		if (k === 'y') return wordTypePutter(id, v);
		if (k === 't') return wordThemePutter(id, v);
		return putter(id, k, v);
	}
	function wordTypePutter(id, selected) {
		var $sel = $('<select>').attr('id', id).css('width', 90);
		WORD_TYPES.forEach(function (t) {
			$('<option>').val(t).text(t || '--').prop('selected', t === selected).appendTo($sel);
		});
		return $sel;
	}
	function wordThemePutter(id, selected) {
		var themes = getThemesForLang($('#db-lang').val());
		var $sel = $('<select>').attr('id', id).css('width', 130);
		$('<option>').val('').text('--').appendTo($sel);
		for (var k in themes) {
			$('<option>').val(k).text(k + ' ' + themes[k]).prop('selected', k === selected).appendTo($sel);
		}
		return $sel;
	}

	// ===== 헬퍼: 테마 =====
	function getThemesForLang(lang) {
		var r = {}, k;
		if (lang === 'ko') {
			for (k in KO_THEME_MAP) r[k] = KO_THEME_MAP[k];
			for (k in KO_INJEONG_MAP) r[k] = KO_INJEONG_MAP[k];
		} else if (lang === 'en') {
			for (k in EN_THEME_MAP) r[k] = EN_THEME_MAP[k];
			for (k in EN_INJEONG_MAP) r[k] = EN_INJEONG_MAP[k];
		}
		return r;
	}
	function populateThemeDatalist() {
		var themes = getThemesForLang($('#db-lang').val());
		var $list = $('#db-theme-list').empty();
		for (var k in themes) {
			$('<option>').val(k).text(k + ' - ' + themes[k]).appendTo($list);
		}
	}

	// ===== 헬퍼: 플래그 체크박스 =====
	function buildFlagCheckboxes(flagVal) {
		var $div = $('#wd-flag').empty();
		for (var name in KOR_FLAG) {
			var val = KOR_FLAG[name];
			$('<label>').css('margin-right', '8px').append(
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

	// ===== 헬퍼: 상점 term =====
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
		var $wrap = $('<span>').addClass('term-wrap');
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

	// ===== 헬퍼: 상점 group =====
	function groupPutter(id, selected) {
		var $sel = $('<select>').attr('id', id);
		for (var k in SHOP_GROUPS) {
			$('<option>').val(k).text(SHOP_GROUPS[k]).prop('selected', k === selected).appendTo($sel);
		}
		return $sel;
	}

	// ===== 헬퍼: 상점 options =====
	function optionsPutter(sid, opts) {
		opts = opts || {};
		var $wrap = $('<div>').addClass('opts-editor');
		function numRow(label, key, isRatio) {
			var stored = opts[key];
			var display = stored !== undefined ? (isRatio ? Math.round(stored * 10000) / 100 : stored) : '';
			$wrap.append(
				$('<label>').text(label),
				$('<input>').attr({ 'id': sid + '-opt-' + key, 'type': 'number', 'step': isRatio ? '0.01' : '1', 'placeholder': '0' }).val(display)
			);
		}
		numRow('경험치배율%', 'gEXP', true);
		numRow('핑배율%', 'gMNY', true);
		numRow('분당경험치', 'hEXP', false);
		numRow('분당핑', 'hMNY', false);
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

	// ===== 헬퍼: 상점 행 생성 =====
	function buildShopRow(nid, item, isNew) {
		var sid = 'si-' + nid;
		var opts = isNew ? {} : (item.options || {});
		var termSec = isNew ? 0 : (item.term || 0);
		var group = isNew ? 'head' : (item.group || 'head');

		var $row = $('<tr>').attr({ 'id': 'gu-' + nid, 'data-id': nid });
		if (isNew) $row.addClass('gu-new');

		$row
			.append($('<td>').append($('<input>').attr('type', 'checkbox').addClass('shop-sel')))
			.append($('<td>').append(putter(sid + '-_id', 'g', nid)))
			.append($('<td>').append(
				$('<input>').attr({ 'id': sid + '-cost', 'type': 'number', 'min': '0' })
					.val(isNew ? '' : (item.cost || 0))
			))
			.append($('<td>').append(
				$('<input>').attr({ 'id': sid + '-hit', 'type': 'number', 'min': '0' })
					.val(isNew ? 0 : (item.hit || 0))
			))
			.append($('<td>').append(termPutter(sid, termSec)))
			.append($('<td>').append(groupPutter(sid + '-group', group)))
			.append($('<td>').append(optionsPutter(sid, opts)))
			.append($('<td>').append(putter(sid + '-name_ko_KR', 'l', '')))
			.append($('<td>').append(putter(sid + '-desc_ko_KR', 'l', '')))
			.append($('<td>').append(putter(sid + '-name_en_US', 'l', '')))
			.append($('<td>').append(putter(sid + '-desc_en_US', 'l', '')));

		return $row;
	}

	// ===== 끄투 DB 다루기: 행 액션 =====
	function actionTd(x1, x2, x3) {
		var key = ['wa', x1, x2, x3].join('-') + '-';
		return $('<td>')
			.append($('<button>').attr('id', key + 'u').css('float', 'left').html('&uarr;').on('click', onAction))
			.append($('<button>').attr('id', key + 'x').css('float', 'left').html('X').on('click', onAction))
			.append($('<button>').attr('id', key + 'e').css('float', 'left').html('?').on('click', onAction))
			.append($('<button>').attr('id', key + 'd').css('float', 'left').html('&darr;').on('click', onAction));
	}
	function onAction(e) {
		var key = $(e.currentTarget).attr('id').slice(3).split('-');
		var code = key.pop();
		var $target = $('#wr-' + key.join('-'));
		var temp;
		switch (code) {
			case 'u':
				if (e.shiftKey) { changeId($target, $target.prev().attr('id').slice(3)); changeId($target.prev(), key.join('-')); }
				$target.prev().before($target);
				break;
			case 'x':
				$target.remove();
				break;
			case 'e':
				if ((temp = prompt('새 key'))) changeId($target, temp);
				break;
			case 'd':
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

	$(document).ready(function () {
		populateThemeDatalist();
		$('#db-lang').on('input', populateThemeDatalist);

		// ===== 끄투 DB에 단어 추가하기 =====
		$('#db-ok').on('click', function () {
			var forView = $('#db-theme').val().charAt(0) === '~';
			if (forView) {
				$('#db-list').val('');
				$.get('/gwalli/kkututheme?theme=' + $('#db-theme').val().slice(1) + '&lang=' + $('#db-lang').val(), function (res) {
					$('#db-list').val(res.list.join('\n'));
				});
			} else {
				$.post('/gwalli/kkutudb', {
					pw: $('#db-password').val(),
					lang: $('#db-lang').val(),
					theme: $('#db-theme').val(),
					list: $('#db-list').val()
				}, function (res) { alert(res); });
			}
		});
		$('#db-delete').on('click', function () {
			var words = $('#db-list').val().split(/[,\r\n]+/).map(function (w) { return w.trim(); }).filter(Boolean);
			if (!words.length) return alert('삭제할 단어를 입력하세요.');
			if (!confirm(words.length + '개 단어를 삭제하시겠습니까?')) return;
			$.post('/gwalli/kkutudb/bulkdelete', {
				pw: $('#db-password').val(),
				lang: $('#db-lang').val(),
				list: JSON.stringify(words)
			}, function (res) {
				alert(res);
			}).fail(function (xhr) {
				alert('오류가 발생했습니다.\n' + (xhr.responseText || xhr.statusText));
			});
		});

		// ===== 어인정 신청 =====
		$('#injeong-go').on('click', function () {
			$.get('/gwalli/injeong', function (res) {
				var $table = $('#injeong-data').empty(), $r;
				res.list.forEach(function (item) {
					$table.append($r = $('<tr>').attr('id', ['ir', item._id.replace(/ /g, '-')].join('-')));
					$r
						.append($('<td>').append(putter('ij-' + item._id + '-check', 'y').attr('type', 'checkbox')))
						.append($('<td>').append($('<a>').attr({ 'target': '_blank', 'href': 'https://namu.moe/w/' + encodeURI(item._id) }).html('이동')))
						.append($('<td>').append(putter('ij-' + item._id + '-_id', 'l', item._id)))
						.append($('<td>').append(putter('ij-' + item._id + '-theme', 'g', item.theme)))
						.append($('<td>').append(putter('ij-' + item._id + '-writer', 'g', item.writer)))
						.append($('<td>').append(putter('ij-' + item._id + '-createdAt', 'g', item.createdAt)));
				});
			});
		});
		$('#injeong-everything').on('click', function () { $('#injeong-data input[type="checkbox"]').prop('checked', true); });
		$('#injeong-nothing').on('click', function () { $('#injeong-data input[type="checkbox"]').prop('checked', false); });
		$('#injeong-apply').on('click', function () {
			var list = [];
			$('#injeong-data tr:visible').each(function (i, o) {
				var $data = $(o).find('td>input');
				list.push({ _origin: o.id.slice(3).replace(/-/g, ' '), _id: $data.get(1).value, theme: $data.get(2).value, ok: $($data.get(0)).is(':checked') });
			});
			$.post('/gwalli/injeong', { list: JSON.stringify({ list: list }), pw: $('#db-password').val() }, function (res) { alert(res); });
		});

		// ===== 상점 DB 다루기 =====
		$('#shop-go').on('click', function () {
			$.get('/gwalli/shop/' + $('#shop-word').val(), function (res) {
				if (!res || !res.goods) return alert('조회 실패: ' + JSON.stringify(res));
				var $table = $('#shop-data').empty();
				res.goods.forEach(function (item) {
					$table.append(buildShopRow(item._id, item, false));
				});
				res.desc.forEach(function (item) {
					var sid = 'si-' + item._id;
					['name_ko_KR', 'desc_ko_KR', 'name_en_US', 'desc_en_US'].forEach(function (k) {
						var el = getEl(sid + '-' + k);
						if (el) el.value = item[k] || '';
					});
				});
			});
		});
		$('#shop-hide').on('click', function () { $('#shop-data tr:not(.gu-new)').toggle(); });
		$('#shop-add').on('click', function () {
			var nid = prompt('식별자');
			if (!nid) return;
			$('#shop-data').append(buildShopRow(nid, {}, true));
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
						desc_en_US:  (getEl(sid + '-desc_en_US')  || {}).value || ''
					}
				});
			});
			$.post('/gwalli/shop', { list: JSON.stringify({ list: list }), pw: $('#db-password').val() }, function (res) {
				alert('적용되었습니다 (' + res + ')');
			}).fail(function (xhr) {
				alert('오류가 발생했습니다.\n상태: ' + xhr.status + '\n내용: ' + (xhr.responseText || xhr.statusText));
			});
		});
		$('#shop-delete-selected').on('click', function () {
			var ids = [];
			$('#shop-data tr:visible').each(function (i, o) {
				if ($(o).find('.shop-sel').is(':checked')) ids.push($(o).attr('data-id'));
			});
			ids = ids.filter(Boolean);
			if (!ids.length) return alert('선택된 항목이 없습니다.');
			if (!confirm(ids.length + '개 아이템을 삭제하시겠습니까?')) return;
			$.post('/gwalli/shop/delete', { list: JSON.stringify(ids), pw: $('#db-password').val() }, function (res) {
				ids.forEach(function (id) {
					$('#shop-data tr[data-id="' + id.replace(/"/g, '\\"') + '"]').remove();
				});
				alert(res);
			}).fail(function (xhr) {
				alert('오류가 발생했습니다.\n' + (xhr.responseText || xhr.statusText));
			});
		});

		// ===== 유저 DB 다루기 =====
		$('#user-go').on('click', function () {
			$.get('/gwalli/users?id=' + $('#user-id').val() + '&name=' + $('#user-nick').val(), function (res) {
				var $table = $('#user-data').empty(), $r;
				res.list.forEach(function (item) {
					$table.append($r = $('<tr>').attr('id', ['ur', item._id].join('-')));
					$r
						.append($('<td>').append(putter('ud-' + item._id + '-_id', 'g', item._id)))
						.append($('<td>').append(putter('ud-' + item._id + '-money', 'g', item.money)))
						.append($('<td>').append(putter('ud-' + item._id + '-kkutu', 'l', JSON.stringify(item.kkutu || {}))))
						.append($('<td>').append(putter('ud-' + item._id + '-box', 'l', JSON.stringify(item.box || {}))))
						.append($('<td>').append(putter('ud-' + item._id + '-equip', 'l', JSON.stringify(item.equip || {}))))
						.append($('<td>').append(putter('ud-' + item._id + '-exordial', 'g', item.exordial)))
						.append($('<td>').append(putter('ud-' + item._id + '-nickname', 'g', item.nickname)))
						.append($('<td>').append(putter('ud-' + item._id + '-nickChanged', 'g', item.nickChanged)))
						.append($('<td>').append(putter('ud-' + item._id + '-server', 't', item.server)))
						.append($('<td>').append(putter('ud-' + item._id + '-lastLogin', 't', item.lastLogin)))
						.append($('<td>').append(putter('ud-' + item._id + '-black', 'g', item.black)))
						/* Enhanced User Block System [S] */
						.append($('<td>').append(putter('ud-' + item._id + '-blockedUntil', 'g', item.blockedUntil)))
						/* Enhanced User Block System [E] */
						.append($('<td>').append(putter('ud-' + item._id + '-friends', 'g', JSON.stringify(item.friends || {}))));
				});
			});
		});
		$('#user-apply').on('click', function () {
			var list = [];
			$('#user-data tr:visible').each(function (i, o) {
				var $data = $(o).find('td>input');
				list.push({
					_id: $data.get(0).value, money: $data.get(1).value,
					kkutu: $data.get(2).value, box: $data.get(3).value, equip: $data.get(4).value,
					exordial: $data.get(5).value, nickname: $data.get(6).value, nickChanged: $data.get(7).value,
					server: $data.get(8).value, lastLogin: $data.get(9).value, black: $data.get(10).value,
					/* Enhanced User Block System [S] */
					blockedUntil: $data.get(11).value,
					friends: $data.get(12).value
					/* Enhanced User Block System [E] */
				});
			});
			$.post('/gwalli/users', { list: JSON.stringify({ list: list }), pw: $('#db-password').val() }, function (res) { alert(res); });
		});

		// ===== 유저 감시하기 =====
		$('#gamsi-go').on('click', function () {
			clearInterval($temp._gamsi);
			var $data = $('#gamsi-data').empty();
			var list = $('#gamsi-id').val().split(/,\s*/), i, len = list.length;
			for (i in list) {
				$data.append($('<tr>').attr('id', 'gamsi-' + list[i]).html('<td>(' + list[i] + ') 감시 시작</td>'));
				onGamsi();
			}
			i = 0;
			$temp._gamsi = setInterval(onGamsi, 10000);
			function onGamsi() {
				var cid = list[i], $obj = $('#gamsi-' + cid);
				$.get('/gwalli/gamsi?id=' + cid, function (res) {
					if (!res) return $obj.html('(없는 사용자)' + cid);
					$obj.html([res._id, res.title || '-', "<a target='_blank' href='/?server=" + res.server + "'>" + res.server + '</a>'].map(function (v) { return '<td>' + v + '</td>'; }));
				});
				i = (i + 1) % len;
			}
		});

		// ===== 끄투 DB 다루기 =====
		$('#db-go').on('click', function () {
			$.get('/gwalli/kkutudb/' + $('#db-word').val() + '?lang=' + $('#db-lang').val(), function (res) {
				if (!res) return;
				var $table = $('#wd-data').empty();
				var types = res.type ? res.type.split(',') : [];
				var themes = res.theme ? res.theme.split(',') : [];
				var means = res.mean ? res.mean.split(/＂[0-9]+＂/).slice(1).map(function (m1) {
					return (m1.indexOf('［') === -1) ? [[m1]] : m1.split(/［[0-9]+］/).slice(1).map(function (m2) {
						return m2.split(/（[0-9]+）/).slice(1);
					});
				}) : [[[]]];

				buildFlagCheckboxes(res.flag || 0);

				means.forEach(function (m1, x1) {
					m1.forEach(function (m2, x2) {
						var type = types.shift(), theme;
						m2.forEach(function (m3, x3) {
							theme = themes.shift();
							$table.append($('<tr>').attr('id', ['wr', x1, x2, x3].join('-'))
								.append($('<td>').html([x1, x2, x3].join('-')))
								.append($('<td>').append(wrPutter(x1, x2, x3, 'y', type)))
								.append($('<td>').append(wrPutter(x1, x2, x3, 't', theme)))
								.append($('<td>').append(wrPutter(x1, x2, x3, 'm', m3)))
								.append(actionTd(x1, x2, x3))
							);
						});
					});
				});
			});
		});
		$('#word-add').on('click', function () {
			var key = prompt('key (-로 구분)');
			if (!key) return;
			key = key.split('-');
			$('#wd-data').append($('<tr>').attr('id', ['wr', key[0], key[1], key[2]].join('-'))
				.append($('<td>').html([key[0], key[1], key[2]].join('-')))
				.append($('<td>').append(wrPutter(key[0], key[1], key[2], 'y', '')))
				.append($('<td>').append(wrPutter(key[0], key[1], key[2], 't', '')))
				.append($('<td>').append(wrPutter(key[0], key[1], key[2], 'm', '')))
				.append(actionTd(key[0], key[1], key[2]))
			);
		});
		$('#db-apply').on('click', function () {
			var obj = { _id: $('#db-word').val(), flag: readFlagFromCheckboxes(), type: [], theme: [], mean: [] };
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
				if ($('#db-lang').val() === 'ko') return '＂' + (x1 + 1) + '＂' + m1.map(function (m2, x2) {
					return '［' + (x2 + 1) + '］' + m2.map(function (m3, x3) {
						return '（' + (x3 + 1) + '）' + m3;
					}).join('');
				}).join('');
				else return '＂' + (x1 + 1) + '＂' + m1;
			}).join('');
			$.post('/gwalli/kkutudb/' + $('#db-word').val(), {
				pw: $('#db-password').val(), lang: $('#db-lang').val(), data: JSON.stringify(obj)
			}, function (res) { alert(res); });
		});

		// ===== 끄투에서의 인기 단어 =====
		$('#kpw-query').on('click', function () {
			var FIELD = ['한국어 종합', '한국어 최근', '한국어 3글자', '한국어 어인정', '영어 종합'];
			$.get('/gwalli/kkutuhot', function (res) {
				var $table = $('#kpw-table').empty();
				res.data.splice(1, 0, getDeltaRank(res.prev, res.data[0]));
				FIELD.forEach(function (item, index) {
					$table.append($('<div>').append($('<h3>').html(item)).append(getTable(res.prev, res.data[index])));
				});
				$('#kpw-html').html($table.html());
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
						.append($("<td style='width:200px'>").html(item._id))
						.append($("<td style='width:40px'>").html(item.hit))
						.append($("<td style='width:40px'>").html(item.delta))
					);
					pr = rank; ph = item.hit;
				});
				return $R;
			}
		});
		$('#kpw-flush').on('click', function () {
			$.post('/gwalli/kkutuhot', { pw: $('#db-password').val() }, function (res) { alert(res); });
		});
	});
})();
