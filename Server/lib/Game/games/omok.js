/**
 * Rule the words! KKuTu Online
 * 단어 오목 (Korean Word Gomoku) - KOM mode
 */

var DB, DIC;
var Const = require('../../const');
var Lizard = require('../../sub/lizard');

// 서버 시작 시 계산된 최적 초성/중성 배열 (캐시)
var OPT_CONS = null;   // 15개 초성, 단어 수 내림차순 정렬
var OPT_VOWELS = null; // 15개 중성, 단어 수 내림차순 정렬

var CHOSEONG  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
var JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];

// fallback: 사전 계산된 최적 초성/중성
var FALLBACK_CONS   = ['ㅇ','ㄱ','ㅅ','ㅈ','ㅂ','ㅎ','ㄷ','ㅁ','ㄴ','ㅊ','ㅍ','ㅌ','ㅋ','ㄹ','ㅎ'];
var FALLBACK_VOWELS = ['ㅏ','ㅗ','ㅣ','ㅜ','ㅓ','ㅐ','ㅡ','ㅔ','ㅕ','ㅠ','ㅚ','ㅟ','ㅑ','ㅝ','ㅞ'];

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
	OPT_CONS   = FALLBACK_CONS.slice();
	OPT_VOWELS = FALLBACK_VOWELS.slice();
};

exports.getTitle = function () {
	var R = new Lizard.Tail();
	R.go({ title: '단어 오목' });
	return R;
};

// roundReady: 방에서 게임 시작 시 호출
exports.roundReady = function () {
	var my = this;
	var players = my.players.filter(function (p) {
		return p && !p.robot;
	});

	if (players.length % 2 !== 0) {
		my.byMaster('roundError', { code: 'odd_players' });
		return;
	}

	// 쌍 짓기
	var shuffled = _shuffle(players.slice());
	var boards = [];
	var consLayout = _buildLayout(OPT_CONS || FALLBACK_CONS);
	var vowelLayout = _buildLayout(OPT_VOWELS || FALLBACK_VOWELS);

	for (var i = 0; i < shuffled.length; i += 2) {
		var pair = _shuffle([_getId(shuffled[i]), _getId(shuffled[i + 1])]);
		boards.push({
			id: boards.length,
			players: pair,           // [0]=선공(파랑), [1]=후공(흰)
			board: _emptyBoard(),
			currentTurn: 0,
			timer: null,
			turnStart: null,         // 턴 시작 시각 (ms)
			skipCounts: [0, 0],
			lastPlaced: null,
			winner: null,
			finished: false,
			loading: false
		});
	}

	my.game.boards = boards;
	my.game.consLayout = consLayout;
	my.game.vowelLayout = vowelLayout;
	my.game.ended = false;

	// 각 플레이어 점수 초기화
	my.players.forEach(function (p) {
		if (p && DIC[p]) DIC[p].game = { score: 0, bonus: 0, team: 0 };
	});

	my.byMaster('omokRoundReady', {
		boards: boards.map(function (b) {
			return { id: b.id, players: b.players };
		}),
		consLayout: consLayout,
		vowelLayout: vowelLayout
	});

	// 모든 보드 첫 턴 시작
	boards.forEach(function (b) {
		_turnStart(my, b);
	});
};

exports.turnStart = function () {
	// 개별 보드 턴은 _turnStart 로 관리. 이 함수는 호환성을 위해 존재.
};

exports.submit = function (client, text) {
	var my = this;
	if (!my.game.boards) return;

	// 해당 플레이어가 속한 보드 탐색
	var clientId = _getId(client);
	var board = null;
	for (var i = 0; i < my.game.boards.length; i++) {
		if (my.game.boards[i].players.indexOf(clientId) !== -1) {
			board = my.game.boards[i];
			break;
		}
	}
	if (!board || board.finished) return;
	if (board.loading) return;

	// 턴 소유자 확인
	if (board.players[board.currentTurn] !== clientId) {
		return client.publish('turnError', { code: 'not_your_turn', value: text }, true);
	}

	text = text.replace(/\s/g, '');
	if (!text) return;

	// 서로게이트 문자 거부
	if (/[\uD800-\uDFFF]/.test(text)) {
		return client.publish('turnError', { code: 'invalid_word', value: text }, true);
	}

	var firstChar = text[0];
	var code = firstChar.charCodeAt(0);
	var isSyllable = (code >= 0xAC00 && code <= 0xD7A3);

	// 한글이 아닌 첫 글자면 거부
	if (!isSyllable) {
		return client.publish('turnError', { code: 'invalid_word', value: text }, true);
	}

	// 첫 글자 초성+중성(받침 무시) → (row, col) 계산
	var offset = code - 0xAC00;
	var choIdx  = Math.floor(offset / 28 / 21);
	var jungIdx = Math.floor(offset / 28) % 21;
	var cho   = CHOSEONG[choIdx];
	var jung  = JUNGSEONG[jungIdx];

	var col = my.game.consLayout.indexOf(cho);
	var row = my.game.vowelLayout.indexOf(jung);

	if (col === -1 || row === -1) {
		return client.publish('turnError', { code: 'invalid_word', value: text }, true);
	}

	var cell = board.board[row][col];
	var owner = board.currentTurn;
	var opponent = 1 - owner;

	// 이미 내 돌
	if (cell && cell.owner === owner) {
		return client.publish('turnError', { code: 'cell_taken', value: text }, true);
	}

	// 상대 돌 → 뺏기 규칙 확인
	if (cell && cell.owner === opponent) {
		if (!my.opts.steal) {
			return client.publish('turnError', { code: 'cell_taken', value: text }, true);
		}
		// 직전 돌은 뺏기 불가
		if (board.lastPlaced && board.lastPlaced.row === row && board.lastPlaced.col === col) {
			return client.publish('turnError', { code: 'cannot_steal', value: text }, true);
		}
		// 길이 비교: text.length >= cell.length * 2
		var requiredLen = cell.length * 2;
		if (text.length < requiredLen) {
			return client.publish('turnError', { code: 'cannot_steal', value: text }, true);
		}
	}

	// 음절 단독 입력(1글자 한글 음절)이면 DB 검증 없이 통과
	var isSyllableOnly = (text.length === 1);

	if (isSyllableOnly) {
		// 음절이 해당 칸의 음절인지 확인
		var expectedSyllable = _makeSyllable(choIdx, jungIdx);
		if (text !== expectedSyllable) {
			return client.publish('turnError', { code: 'invalid_word', value: text }, true);
		}
		_doPlace(my, board, client, text, 0, row, col, owner, cell);
	} else {
		// DB 검증
		board.loading = true;
		DB.kkutu['ko'].findOne(['_id', text]).on(function ($doc) {
			board.loading = false;
			if (!board || board.finished) return;
			if (!$doc) {
				return client.publish('turnError', { code: 'invalid_word', value: text }, true);
			}
			_doPlace(my, board, client, text, text.length, row, col, owner, cell);
		});
	}
};

exports.turnEnd = function () {};

exports.getScore = function (text, delay) {
	var tr = Math.max(0, 1 - delay / 20000);
	var stonesOnBoard = _countStones(this.game && this.game.boards ? this.game.boards : []);
	return Math.round(
		2 * (Math.pow(5 + 7 * (text ? text.length : 0), 0.74) + 1.18 * stonesOnBoard) * (0.5 + 0.5 * tr)
	);
};

// ─────────────────────────────────────────────
// 내부 함수
// ─────────────────────────────────────────────

function _doPlace(my, board, client, text, wordLen, row, col, owner, prevCell) {
	// 선공 렌주 룰 검사 (배치 전 가상으로 놓아서 판단)
	if (owner === 0) {
		board.board[row][col] = { owner: owner, length: wordLen, word: text };
		var forbidden = _isForbidden(board.board, row, col, owner);
		board.board[row][col] = prevCell; // 원복
		if (forbidden) {
			return client.publish('turnError', { code: 'forbidden', value: text }, true);
		}
	}

	// 타이머 취소
	if (board.timer) {
		clearTimeout(board.timer);
		board.timer = null;
	}

	var elapsed = Date.now() - board.turnStart;
	var score = _calcScore(text, elapsed, board);

	// 돌 배치
	board.board[row][col] = { owner: owner, length: wordLen, word: text };
	board.lastPlaced = { row: row, col: col };

	// 스킵 카운터 리셋
	board.skipCounts[owner] = 0;

	// 점수 반영
	var clientId = _getId(client);
	if (DIC[clientId]) {
		DIC[clientId].game = DIC[clientId].game || { score: 0 };
		DIC[clientId].game.score += score;
		if (isNaN(DIC[clientId].game.score)) DIC[clientId].game.score = score;
	}

	var stolenFrom = (prevCell && prevCell.owner !== owner) ? board.players[1 - owner] : null;

	my.byMaster('omokTurnEnd', {
		boardId: board.id,
		playerId: clientId,
		row: row,
		col: col,
		owner: owner,
		wordLength: wordLen,
		word: text,
		score: score,
		totalScore: DIC[clientId] ? DIC[clientId].game.score : 0,
		stolenFrom: stolenFrom
	});

	// 승리 체크
	if (_checkWin(board.board, row, col, owner)) {
		return _finishBoard(my, board, owner);
	}

	// 보드 꽉 참 체크
	if (_isBoardFull(board.board)) {
		return _finishBoardByScore(my, board);
	}

	// 다음 턴
	board.currentTurn = 1 - owner;
	_turnStart(my, board);
}

function _turnStart(my, board) {
	if (board.finished) return;
	board.turnStart = Date.now();
	my.byMaster('omokTurnStart', {
		boardId: board.id,
		playerId: board.players[board.currentTurn],
		timeLimit: 20000
	});

	board.timer = setTimeout(function () {
		_handleTimeout(my, board);
	}, 20000);
}

function _handleTimeout(my, board) {
	if (board.finished) return;
	board.timer = null;
	var cur = board.currentTurn;
	var opp = 1 - cur;

	board.skipCounts[cur]++;

	my.byMaster('omokTimeout', {
		boardId: board.id,
		playerId: board.players[cur],
		skipCount: board.skipCounts[cur]
	});

	// 양쪽 각 1회씩 스킵 → 무승부
	if (board.skipCounts[0] >= 1 && board.skipCounts[1] >= 1) {
		return _finishBoard(my, board, 'draw');
	}

	// 단독 3회 연속 스킵 → 상대 승리
	if (board.skipCounts[cur] >= 3) {
		return _finishBoard(my, board, opp);
	}

	// 다음 턴
	board.currentTurn = opp;
	_turnStart(my, board);
}

function _finishBoard(my, board, winner) {
	if (board.finished) return;
	board.finished = true;
	board.winner = winner;

	if (board.timer) { clearTimeout(board.timer); board.timer = null; }

	// 승리자 +1000점
	if (winner === 0 || winner === 1) {
		var winnerId = board.players[winner];
		if (DIC[winnerId]) {
			DIC[winnerId].game = DIC[winnerId].game || { score: 0 };
			DIC[winnerId].game.score += 1000;
			if (isNaN(DIC[winnerId].game.score)) DIC[winnerId].game.score = 1000;
		}
	}

	my.byMaster('omokBoardEnd', {
		boardId: board.id,
		winner: winner,
		bonusScore: (winner === 0 || winner === 1) ? 1000 : 0,
		scores: _getBoardScores(board, DIC)
	});

	// 모든 보드 종료 시 라운드 종료
	if (!my.game.ended && my.game.boards.every(function (b) { return b.finished; })) {
		my.game.ended = true;
		_roundEnd(my);
	}
}

function _finishBoardByScore(my, board) {
	var s0 = DIC[board.players[0]] ? DIC[board.players[0]].game.score : 0;
	var s1 = DIC[board.players[1]] ? DIC[board.players[1]].game.score : 0;
	var winner = s0 > s1 ? 0 : s1 > s0 ? 1 : 'draw';
	_finishBoard(my, board, winner);
}

function _roundEnd(my) {
	var scores = {};
	my.players.forEach(function (p) {
		var id = _getId(p);
		if (id && DIC[id]) scores[id] = DIC[id].game ? DIC[id].game.score : 0;
	});
	my.byMaster('omokRoundEnd', { scores: scores });
	if (my.roundEnd) my.roundEnd();
}

// 중퇴 처리: kkutu.js의 leave 이벤트에서 호출
exports.onLeave = function (my, clientId) {
	if (!my.game || !my.game.boards) return;
	my.game.boards.forEach(function (board) {
		if (board.finished) return;
		var idx = board.players.indexOf(clientId);
		if (idx === -1) return;
		var opponent = 1 - idx;
		_finishBoard(my, board, opponent);
	});
};

// ─────────────────────────────────────────────
// 렌주 룰 (선공 금수 판정)
// ─────────────────────────────────────────────

function _isForbidden(board, row, col, owner) {
	// owner=0(선공)만 적용
	if (owner !== 0) return false;

	// 6목 이상
	if (_countLine(board, row, col, owner) >= 6) return true;

	// 3-3: 열린 3이 2개 이상
	if (_countOpenThrees(board, row, col, owner) >= 2) return true;

	// 4-4: 4(open or closed)가 2개 이상
	if (_countFours(board, row, col, owner) >= 2) return true;

	return false;
}

// 해당 위치를 포함한 최장 연속 길이
function _countLine(board, row, col, owner) {
	var dirs = [[0,1],[1,0],[1,1],[1,-1]];
	var max = 0;
	for (var d = 0; d < dirs.length; d++) {
		var len = 1
			+ _extend(board, row, col, owner, dirs[d][0], dirs[d][1])
			+ _extend(board, row, col, owner, -dirs[d][0], -dirs[d][1]);
		if (len > max) max = len;
	}
	return max;
}

function _extend(board, row, col, owner, dr, dc) {
	var count = 0;
	var r = row + dr, c = col + dc;
	while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] && board[r][c].owner === owner) {
		count++;
		r += dr;
		c += dc;
	}
	return count;
}

// 열린 3 개수
function _countOpenThrees(board, row, col, owner) {
	var dirs = [[0,1],[1,0],[1,1],[1,-1]];
	var count = 0;
	for (var d = 0; d < dirs.length; d++) {
		if (_isOpenThree(board, row, col, owner, dirs[d][0], dirs[d][1])) count++;
	}
	return count;
}

function _isOpenThree(board, row, col, owner, dr, dc) {
	var line = _getLine(board, row, col, owner, dr, dc, 5);
	// 3개 연속이 되는 패턴 중 양 끝이 열린 경우
	var len = line.stones;
	var openEnds = line.openEnds;
	return len === 3 && openEnds === 2;
}

function _countFours(board, row, col, owner) {
	var dirs = [[0,1],[1,0],[1,1],[1,-1]];
	var count = 0;
	for (var d = 0; d < dirs.length; d++) {
		var len = 1
			+ _extend(board, row, col, owner, dirs[d][0], dirs[d][1])
			+ _extend(board, row, col, owner, -dirs[d][0], -dirs[d][1]);
		if (len === 4) count++;
	}
	return count;
}

function _getLine(board, row, col, owner, dr, dc, range) {
	var forward = _extend(board, row, col, owner, dr, dc);
	var backward = _extend(board, row, col, owner, -dr, -dc);
	var stones = 1 + forward + backward;

	// 앞쪽 열린 끝
	var fr = row + (forward + 1) * dr;
	var fc = col + (forward + 1) * dc;
	var frontOpen = fr >= 0 && fr < 15 && fc >= 0 && fc < 15 && !board[fr][fc];

	// 뒤쪽 열린 끝
	var br = row - (backward + 1) * dr;
	var bc = col - (backward + 1) * dc;
	var backOpen = br >= 0 && br < 15 && bc >= 0 && bc < 15 && !board[br][bc];

	return { stones: stones, openEnds: (frontOpen ? 1 : 0) + (backOpen ? 1 : 0) };
}

// ─────────────────────────────────────────────
// 승리 체크
// ─────────────────────────────────────────────

function _checkWin(board, row, col, owner) {
	var dirs = [[0,1],[1,0],[1,1],[1,-1]];
	for (var d = 0; d < dirs.length; d++) {
		var len = 1
			+ _extend(board, row, col, owner, dirs[d][0], dirs[d][1])
			+ _extend(board, row, col, owner, -dirs[d][0], -dirs[d][1]);
		if (owner === 0 && len === 5) return true;   // 선공: 정확히 5
		if (owner === 1 && len >= 5) return true;    // 후공: 5 이상
	}
	return false;
}

// ─────────────────────────────────────────────
// 보드 레이아웃 생성
// ─────────────────────────────────────────────

function _buildLayout(sorted15) {
	// sorted15: 단어 수 내림차순 정렬된 15개 음소
	var cons = sorted15.slice();

	// CCCCC 그룹: 상위 5개
	var CCCCC = cons.slice(0, 5);

	// BBB/DDD 그룹: #6~11 쌍으로 분배
	var BBB = [], DDD = [];
	for (var i = 5; i < 11; i += 2) {
		var pair = _shuffle([cons[i], cons[i + 1]]);
		BBB.push(pair[0]);
		DDD.push(pair[1]);
	}

	// AA/EE 그룹: #12~15 쌍으로 분배
	var AA = [], EE = [];
	for (var j = 11; j < 15; j += 2) {
		var pair2 = _shuffle([cons[j], cons[j + 1]]);
		AA.push(pair2[0]);
		EE.push(pair2[1]);
	}

	// 각 그룹 내부 셔플
	_shuffle(CCCCC);
	_shuffle(BBB);
	_shuffle(DDD);
	_shuffle(AA);
	_shuffle(EE);

	return AA.concat(BBB, CCCCC, DDD, EE);
}

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

function _getId(p) {
	if (!p) return null;
	if (typeof p === 'string') return p;
	return p.id || (p.profile && p.profile.id) || null;
}

function _makeSyllable(choIdx, jungIdx) {
	return String.fromCharCode(0xAC00 + choIdx * 21 * 28 + jungIdx * 28);
}

function _emptyBoard() {
	return Array.from({ length: 15 }, function () { return new Array(15).fill(null); });
}

function _isBoardFull(board) {
	for (var r = 0; r < 15; r++) {
		for (var c = 0; c < 15; c++) {
			if (!board[r][c]) return false;
		}
	}
	return true;
}

function _countStones(boards) {
	var total = 0;
	boards.forEach(function (b) {
		b.board.forEach(function (row) {
			row.forEach(function (cell) { if (cell) total++; });
		});
	});
	return total;
}

function _calcScore(text, elapsed, board) {
	var tr = Math.max(0, 1 - elapsed / 20000);
	var stoneCount = 0;
	board.board.forEach(function (row) {
		row.forEach(function (cell) { if (cell) stoneCount++; });
	});
	return Math.round(
		2 * (Math.pow(5 + 7 * (text ? text.length : 1), 0.74) + 1.18 * stoneCount) * (0.5 + 0.5 * tr)
	);
}

function _getBoardScores(board, dic) {
	var scores = {};
	board.players.forEach(function (id) {
		scores[id] = (dic[id] && dic[id].game) ? dic[id].game.score : 0;
	});
	return scores;
}

function _shuffle(arr) {
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
	}
	return arr;
}

