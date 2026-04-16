/**
 * Rule the words! KKuTu Online
 * 단어 오목 (KOM) - 클라이언트 UI 핸들러
 *
 * 각 플레이어 쌍마다 독립된 .jjoDisplayBar 를 생성해 .jjoriping 안에 나란히 배치.
 */

$lib.Omok = {};

var _omokBoards  = [];   // boardObj[]
var _omokCons    = [];   // consLayout (15개 초성)
var _omokVowels  = [];   // vowelLayout (15개 중성)
var _omokTimers  = {};   // boardId → setInterval handle

var _OMOK_CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
var _OMOK_JUN = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];

// ─── roundReady ───────────────────────────────────────────────────────────────
$lib.Omok.roundReady = function (data) {
	clearBoard();
	$data._relay = true;
	$(".jjoriping,.rounds,.game-body").addClass("cw omok");

	_omokBoards  = [];
	_omokCons    = data.consLayout;
	_omokVowels  = data.vowelLayout;
	_omokTimers  = {};

	var myId       = $data.id;
	var $jjoriping = $(".jjoriping");

	// 기존 jjoDisplayBar 및 jjo 얼굴 이미지 숨김
	$jjoriping.find(".jjoDisplayBar").hide();
	$jjoriping.find(".jjoObj").hide();

	// 내 보드를 맨 앞으로 정렬
	var ordered = data.boards.slice();
	var mi = -1;
	for (var k = 0; k < ordered.length; k++) {
		if (ordered[k].players.indexOf(myId) !== -1) { mi = k; break; }
	}
	if (mi > 0) {
		var tmp = ordered.splice(mi, 1)[0];
		ordered.unshift(tmp);
	}

	// 최대 6판; 모바일은 내 판 1개만 표시
	var toShow = mobile ? ordered.slice(0, 1) : ordered.slice(0, 6);

	toShow.forEach(function (bd) {
		var obj = _omokMakeBoard(bd, myId);
		_omokBoards.push(obj);
		$jjoriping.append(obj.$bar);
	});

	// 화면에 없는 나머지 보드도 상태 추적용으로 등록 (DOM 없음)
	ordered.forEach(function (bd) {
		if (!_omokFindBoard(bd.id)) {
			_omokBoards.push(_omokMakeBoard(bd, myId, true));
		}
	});

	$stage.game.items.hide();
	$stage.game.bb.hide();
	$stage.game.cwcmd.hide();
	$stage.game.chain.hide();

	if (mobile) {
		$stage.game.here.css('opacity', 0.1).show();
	} else {
		$stage.game.here.hide();
	}

	playSound('round_start');
};

// ─── turnStart ────────────────────────────────────────────────────────────────
$lib.Omok.turnStart = function (data) {
	var obj = _omokFindBoard(data.boardId);
	if (!obj) return;

	var myId     = $data.id;
	var isMyTurn = (data.playerId === myId);
	var isMyBoard= (obj.players.indexOf(myId) !== -1);

	// 이전 타이머 정리
	if (_omokTimers[data.boardId]) {
		clearInterval(_omokTimers[data.boardId]);
		delete _omokTimers[data.boardId];
	}

	// 차례 표시
	if (obj.$bar) {
		obj.$bar.find('.omok-player').removeClass('omok-active');
		var ti = obj.players.indexOf(data.playerId);
		obj.$bar.find('.omok-player').eq(ti).addClass('omok-active');
	}

	// 타이머 바 애니메이션
	if (obj.$timerBar) {
		var elapsed   = 0;
		var timeLimit = data.timeLimit || 20000;
		obj.$timerBar.css({ width: '100%', 'background-color': '#4CAF50' });

		_omokTimers[data.boardId] = setInterval(function () {
			elapsed += TICK;
			var ratio = Math.max(0, 1 - elapsed / timeLimit);
			obj.$timerBar.css('width', (ratio * 100) + '%');
			if      (ratio < 0.3) obj.$timerBar.css('background-color', '#F44336');
			else if (ratio < 0.6) obj.$timerBar.css('background-color', '#FF9800');
			if (ratio <= 0) {
				clearInterval(_omokTimers[data.boardId]);
				delete _omokTimers[data.boardId];
			}
		}, TICK);
	}

	// 입력창 활성화 (모바일)
	if (mobile && isMyBoard) {
		$stage.game.here.css('opacity', isMyTurn ? 0.5 : 0.1);
	}
};

// ─── omokTurnEnd (돌 배치) ────────────────────────────────────────────────────
$lib.Omok.placeTurn = function (data) {
	var obj = _omokFindBoard(data.boardId);
	if (!obj || !obj.$bar) return;

	// cells[row+1][col+1]  (+1은 헤더 오프셋)
	var $cell = obj.cells[data.row + 1] && obj.cells[data.row + 1][data.col + 1];
	if (!$cell) return;

	$cell.removeClass('omok-empty omok-blue omok-white')
	     .addClass(data.owner === 0 ? 'omok-blue' : 'omok-white')
	     .text(data.wordLength);

	var myId      = $data.id;
	var isMyBoard = (obj.players.indexOf(myId) !== -1);

	if (data.playerId === myId) {
		playSound('success');
	} else if (isMyBoard) {
		playSound('mission');
	}
};

// ─── omokBoardEnd (한 판 종료) ────────────────────────────────────────────────
$lib.Omok.boardEnd = function (data) {
	var obj = _omokFindBoard(data.boardId);
	if (!obj) return;

	if (_omokTimers[data.boardId]) {
		clearInterval(_omokTimers[data.boardId]);
		delete _omokTimers[data.boardId];
	}
	if (obj.$timerBar) obj.$timerBar.css('width', '0%');

	var myId      = $data.id;
	var winner    = data.winner;
	var isMyBoard = (obj.players.indexOf(myId) !== -1);

	var txt;
	if (winner === 'draw') {
		txt = L['omok_draw'] || '무승부';
		if (isMyBoard) playSound('horr');
	} else {
		var wid  = obj.players[winner];
		var wname = _omokName(wid);
		if (isMyBoard) {
			if (wid === myId) {
				txt = (L['omok_win'] || '승리!');
				if (data.bonusScore) txt += ' (+' + data.bonusScore + ')';
				playSound('success');
			} else {
				txt = L['omok_lose'] || '패배';
				playSound('horr');
			}
		} else {
			txt = (wname || wid.substr(0, 6)) + ' ' + (L['omok_win'] || '승리');
		}
	}

	if (obj.$bar) {
		obj.$bar.find('.omok-player').removeClass('omok-active');
		obj.$bar.addClass('omok-finished');
		obj.$bar.append(
			$("<div>").addClass("omok-result-overlay").text(txt)
		);
	}

	if (mobile && isMyBoard) {
		$stage.game.here.css('opacity', 0.1);
	}
};

// ─── omokTimeout 알림 ─────────────────────────────────────────────────────────
$lib.Omok.timeout = function (data) {
	var obj = _omokFindBoard(data.boardId);
	if (!obj || !obj.$bar) return;

	var myId = $data.id;
	if (data.playerId === myId && obj.players.indexOf(myId) !== -1) {
		playSound('fail');
	}
};

// ─── turnEnd (표준 route 호환 – 오목에서는 사용 안 함) ──────────────────────
$lib.Omok.turnEnd = function () {};

// ─── 내부: 보드 객체 생성 ─────────────────────────────────────────────────────
// headless=true면 DOM 없이 상태 추적용으로만 생성
function _omokMakeBoard(bd, myId, headless) {
	var obj = {
		id:       bd.id,
		players:  bd.players,
		cells:    [],       // cells[r][c], 인덱스 0 = 헤더
		$bar:     null,
		$timerBar: null
	};

	if (headless) return obj;

	/* ── 보드 래퍼 (.jjoDisplayBar 역할) ── */
	var $bar = $("<div>").addClass("jjoDisplayBar omok-bar");
	obj.$bar = $bar;

	/* ── 타이머 바 ── */
	var $timerWrap = $("<div>").addClass("omok-timer-wrap");
	var $timerBar  = $("<div>").addClass("omok-timer-bar");
	$timerWrap.append($timerBar);
	obj.$timerBar  = $timerBar;

	/* ── 보드 테이블 ── */
	var $table = $("<table>").addClass("omok-board");
	var numR   = _omokVowels.length;  // 15
	var numC   = _omokCons.length;    // 15

	// 헤더 행 (초성)
	var hRow = [null];
	var $htr = $("<tr>");
	$htr.append($("<th>").addClass("omok-corner"));
	for (var c = 0; c < numC; c++) {
		var $th = $("<th>").addClass("omok-lbl-c").text(_omokCons[c]);
		$htr.append($th);
		hRow.push($th);
	}
	$table.append($htr);
	obj.cells.push(hRow);

	// 데이터 행 (중성 × 초성)
	for (var r = 0; r < numR; r++) {
		var row = [];
		var $tr = $("<tr>");
		var $rh = $("<th>").addClass("omok-lbl-r").text(_omokVowels[r]);
		$tr.append($rh);
		row.push($rh);

		for (var cc = 0; cc < numC; cc++) {
			var syl = _omokSyl(_omokCons[cc], _omokVowels[r]);
			var $td = $("<td>")
				.addClass("omok-cell omok-empty flip-cell")
				.attr({ 'data-r': r, 'data-c': cc })
				.text(syl);
			$tr.append($td);
			row.push($td);
		}
		$table.append($tr);
		obj.cells.push(row);
	}

	/* ── 플레이어 표시 ── */
	var $players = $("<div>").addClass("omok-players");
	bd.players.forEach(function (pid, idx) {
		var name = _omokName(pid);
		var $p   = $("<div>")
			.addClass("omok-player " + (idx === 0 ? "omok-blue-p" : "omok-white-p"))
			.append($("<span>").addClass("omok-mark").text(idx === 0 ? '●' : '○'))
			.append($("<span>").addClass("omok-pname ellipse").text(name || pid.substr(0, 8)));
		if (pid === myId) $p.addClass("omok-me");
		$players.append($p);
	});

	$bar.append($timerWrap).append($table).append($players);
	return obj;
}

// ─── 유틸 ──────────────────────────────────────────────────────────────────────
function _omokFindBoard(id) {
	for (var i = 0; i < _omokBoards.length; i++) {
		if (_omokBoards[i].id === id) return _omokBoards[i];
	}
	return null;
}

function _omokName(pid) {
	if (!pid) return '';
	var u = ($data.users && $data.users[pid]);
	if (u && u.profile) return u.profile.title || u.profile.name || '';
	if (pid === $data.id && $data.profile) return $data.profile.title || $data.profile.name || '';
	return '';
}

function _omokSyl(cho, jung) {
	var ci = _OMOK_CHO.indexOf(cho);
	var vi = _OMOK_JUN.indexOf(jung);
	if (ci === -1 || vi === -1) return '?';
	return String.fromCharCode(0xAC00 + (ci * 21 + vi) * 28);
}
