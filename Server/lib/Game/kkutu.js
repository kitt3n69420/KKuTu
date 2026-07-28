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

var GUEST_PERMISSION;
var Cluster = require("cluster");
var fs = require("fs");
var path = require("path");
var Const = require('../const');
var Lizard = require('../sub/lizard');
var JLog = require('../sub/jjlog');
// 마스터 프로세스 안에서 처리되는 이벤트(로비 채팅 등)는 discord-bot.js를 직접 물고 있으면
// 그 인스턴스가 한 번도 init()되지 않아 항상 오프라인 취급된다. 실제 로그인된 디스코드
// 클라이언트는 별도의 discordProcess 자식 프로세스에만 있으므로, master.js가 주입하는
// relayDiscordEvent(type, data)를 통해 그쪽으로 중계해야 한다.
var DiscordRelay = null;
var Room = require('./room');
// 망할 셧다운제 var Ajae = require("../sub/ajae");
var DB;
var SHOP;
var DIC;
var ROOM;
var _rid;
var Rule;
var guestProfiles = [];
var CHAN;
var channel = process.env['CHANNEL'] || 0;

const NUM_SLAVES = 4;
const GUEST_IMAGE = "/img/kkutu/guest.png";
const MAX_OKG = 63;
const PER_OKG = 600000;


// ========== Aho-Corasick 욕설 필터 ==========
var swearAutomaton = null;

(function buildSwearFilter() {
	var swearPath = path.join(__dirname, '../data/swearing.txt');
	var lines;
	try {
		lines = fs.readFileSync(swearPath, 'utf8').split(/\r?\n/).filter(function (w) { return w.length > 0; });
	} catch (e) {
		JLog.warn("[NOSWEAR] swearing.txt not found: " + e.message);
		return;
	}
	if (lines.length === 0) return;

	// Trie node: children map, fail link, output list (pattern lengths)
	var nodes = [{ children: {}, fail: 0, output: [] }];
	function addNode() {
		nodes.push({ children: {}, fail: 0, output: [] });
		return nodes.length - 1;
	}

	// Build trie
	var i, j, c, cur;
	for (i = 0; i < lines.length; i++) {
		cur = 0;
		for (j = 0; j < lines[i].length; j++) {
			c = lines[i][j];
			if (nodes[cur].children[c] === undefined) {
				nodes[cur].children[c] = addNode();
			}
			cur = nodes[cur].children[c];
		}
		nodes[cur].output.push(lines[i].length);
	}

	// Build failure links (BFS)
	var queue = [];
	for (c in nodes[0].children) {
		var child = nodes[0].children[c];
		nodes[child].fail = 0;
		queue.push(child);
	}
	var head = 0;
	while (head < queue.length) {
		var u = queue[head++];
		for (c in nodes[u].children) {
			var v = nodes[u].children[c];
			var f = nodes[u].fail;
			while (f !== 0 && nodes[f].children[c] === undefined) {
				f = nodes[f].fail;
			}
			if (nodes[f].children[c] !== undefined && nodes[f].children[c] !== v) {
				nodes[v].fail = nodes[f].children[c];
			} else {
				nodes[v].fail = 0;
			}
			// Merge output from fail chain
			nodes[v].output = nodes[v].output.concat(nodes[nodes[v].fail].output);
			queue.push(v);
		}
	}

	swearAutomaton = nodes;
	JLog.info("[NOSWEAR] Loaded " + lines.length + " words, Aho-Corasick automaton built");
})();

// 텍스트에서 욕설 매칭 구간 반환: [{start, end}]
function checkSwearWords(text) {
	if (!swearAutomaton) return [];
	var matches = [];
	var cur = 0;
	for (var i = 0; i < text.length; i++) {
		var c = text[i];
		while (cur !== 0 && swearAutomaton[cur].children[c] === undefined) {
			cur = swearAutomaton[cur].fail;
		}
		if (swearAutomaton[cur].children[c] !== undefined) {
			cur = swearAutomaton[cur].children[c];
		}
		var outputs = swearAutomaton[cur].output;
		for (var k = 0; k < outputs.length; k++) {
			matches.push({ start: i - outputs[k] + 1, end: i + 1 });
		}
	}
	return matches;
}

// 매칭된 구간을 '*'로 치환
function censorSwearWords(text) {
	var matches = checkSwearWords(text);
	if (matches.length === 0) return text;
	var arr = text.split('');
	for (var m = 0; m < matches.length; m++) {
		for (var i = matches[m].start; i < matches[m].end; i++) {
			arr[i] = '*';
		}
	}
	return arr.join('');
}

exports.checkSwearWords = checkSwearWords;
exports.censorSwearWords = censorSwearWords;
exports.Room = Room;

exports.NIGHT = false;

var _eventMults = { expmul: 1, mnymul: 1, eventItems: [], itemmul: 0 };
var _cachedEventList = [];

function refreshEventMults() {
	DB.event.find().on(function ($events) {
		_cachedEventList = $events || [];
		var expmul = 1, mnymul = 1, itemmul = 0, eventItems = [];
		(_cachedEventList).forEach(function (ev) {
			if (!Const.isEventActive(ev)) return;
			if (ev.expmul > 1) expmul = Math.max(expmul, ev.expmul);
			if (ev.mnymul > 1) mnymul = Math.max(mnymul, ev.mnymul);
			var eventItemArr = Array.isArray(ev.eventitem) ? ev.eventitem
				: (typeof ev.eventitem === 'string' ? JSON.parse(ev.eventitem) : null);
			if (ev.itemmul > 0 && eventItemArr && eventItemArr.length) {
				itemmul = Math.max(itemmul, ev.itemmul);
				eventItemArr.forEach(function (id) {
					if (eventItems.indexOf(id) === -1) eventItems.push(id);
				});
			}
		});
		_eventMults = { expmul: expmul, mnymul: mnymul, eventItems: eventItems, itemmul: itemmul };
	});
}

exports.init = function (_DB, _DIC, _ROOM, _GUEST_PERMISSION, _CHAN, _DiscordRelay) {
	var i, k;

	DB = _DB;
	DIC = _DIC;
	ROOM = _ROOM;
	GUEST_PERMISSION = _GUEST_PERMISSION;
	CHAN = _CHAN;
	DiscordRelay = _DiscordRelay;
	_rid = 100;
	refreshEventMults();
	setInterval(refreshEventMults, 300000); // 5분마다 갱신 (이벤트는 자주 바뀌지 않음)
	// 망할 셧다운제 if(Cluster.isMaster) setInterval(exports.processAjae, 60000);
	DB.kkutu_shop.find().on(function ($shop) {
		SHOP = {};

		$shop.forEach(function (item) {
			SHOP[item._id] = item;
		});
	});
	// stats 테이블 전체 메모리 로드 (서버 실행 중 변하지 않는 정적 데이터)
	DB.statsData = { ko: {}, en: {} };
	DB.statsReady = { ko: false, en: false };
	DB.kkutu_stats_ko.find().on(function ($rows) {
		if ($rows) {
			$rows.forEach(function (row) { DB.statsData.ko[row._id] = row; });
		}
		DB.statsReady.ko = true;
		JLog.info("[STATS] kkutu_stats_ko loaded: " + Object.keys(DB.statsData.ko).length + " rows");
	});
	DB.kkutu_stats_en.find().on(function ($rows) {
		if ($rows) {
			$rows.forEach(function (row) { DB.statsData.en[row._id] = row; });
		}
		DB.statsReady.en = true;
		JLog.info("[STATS] kkutu_stats_en loaded: " + Object.keys(DB.statsData.en).length + " rows");
	});
	// roundReady에서 매번 COUNT 쿼리를 날리지 않도록 서버 시작 시 단어 수 캐시
	DB._cachedWordCount = { ko: { normal: 0, allpos: 0 }, en: { normal: 0, allpos: 0 } };
	DB.kkutu['ko'].count(['type', Const.KOR_GROUP]).on(function (n) { if (typeof n === 'number' && n > 0) DB._cachedWordCount.ko.normal = n; });
	DB.kkutu['ko'].count().on(function (n) { if (typeof n === 'number' && n > 0) DB._cachedWordCount.ko.allpos = n; });
	DB.kkutu['en'].count(['_id', Const.ENG_ID]).on(function (n) { if (typeof n === 'number' && n > 0) DB._cachedWordCount.en.normal = n; });
	DB.kkutu['en'].count().on(function (n) { if (typeof n === 'number' && n > 0) DB._cachedWordCount.en.allpos = n; });
	Rule = {};
	for (i in Const.RULE) {
		k = Const.RULE[i].rule;
		Rule[k] = require(`./games/${k.toLowerCase()}`);
		Rule[k].init(DB, DIC, checkSwearWords);
	}
	Room.setContext({ DB: DB, DIC: DIC, ROOM: ROOM, CHAN: CHAN, Rule: Rule, checkSwearWords: checkSwearWords, censorSwearWords: censorSwearWords, narrate: exports.narrate, publish: exports.publish, Robot: exports.Robot, getEventMults: function() { return _eventMults; }, DiscordRelay: DiscordRelay });

	// === 글로벌 heartbeat 타이머 (per-client setInterval 대체) ===
	// 모든 클라이언트를 20초마다 한 번에 순회하여 heartbeat 전송 + 타임아웃 감지
	var _heartbeatMsg = JSON.stringify({ type: 'heartbeat' });
	setInterval(function () {
		var now = Date.now();
		for (var id in DIC) {
			var c = DIC[id];
			if (!c || !c.socket) continue;
			var elapsed = now - c._lastHeartbeat;
			if (elapsed > 100000) {
				JLog.warn('Heartbeat timeout #' + c.id + ' (' + Math.round(elapsed / 1000) + 's)');
				c._ghostCleaned = true;
				c.socket.terminate();
				// 방 정리는 다음 틱에 실행하여 heartbeat 루프 블로킹 방지
				(function(_c) {
					setImmediate(function() {
						try {
							if (ROOM[_c.place]) ROOM[_c.place].go(_c, null, "timeout");
							if (_c.subPlace && _c.pracRoom) {
								if (_c.pracRoom.gaming) _c.pracRoom.interrupt();
								_c.pracRoom.go(_c);
								_c.pracRoom = null;
								_c.subPlace = 0;
							}
						} catch (e) {
							JLog.error('Heartbeat cleanup error #' + _c.id + ': ' + e.toString());
						}
						exports.onClientClosed(_c, 4000);
					});
				})(c);
				continue;
			}
			if (c.socket.readyState === 1) {
				c.socket.send(_heartbeatMsg);
			}
		}
	}, 20000);

	// === 유령 유저 스위프 (60초마다) ===
	// CLOSING/CLOSED 상태로 오래 머무는 소켓 정리
	setInterval(function () {
		var now = Date.now();
		for (var id in DIC) {
			var c = DIC[id];
			if (!c) { delete DIC[id]; continue; }
			if (!c.socket) {
				JLog.warn('Ghost user (no socket) #' + id);
				exports.onClientClosed(c, 4001);
				continue;
			}
			// readyState 2(CLOSING) 또는 3(CLOSED)이 30초 이상 지속
			if (c.socket.readyState >= 2 && (now - c._lastHeartbeat > 30000)) {
				JLog.warn('Ghost user (stale socket state=' + c.socket.readyState + ') #' + id);
				try {
					if (ROOM[c.place]) ROOM[c.place].go(c, null, "ghost");
				} catch (e) {
					JLog.error('Ghost sweep cleanup error #' + id + ': ' + e.toString());
				}
				c._ghostCleaned = true;
				exports.onClientClosed(c, 4002);
				c.socket.terminate();
			}
		}
	}, 60000);
};

/* 망할 셧다운제
exports.processAjae = function(){
	var i;
	
	exports.NIGHT = (new Date()).getHours() < 6;
	if(exports.NIGHT){
		for(i in DIC){
			if(!DIC[i].isAjae){
				DIC[i].sendError(440);
				DIC[i].socket.close();
			}
		}
	}
};
*/
exports.getUserList = function (selfId) {
	var i, res = {};

	for (i in DIC) {
		res[i] = DIC[i].getData();
	}

	return res;
};
exports.getRoomList = function () {
	var i, res = {};

	for (i in ROOM) {
		res[i] = ROOM[i].getData();
	}

	return res;
};
exports.narrate = function (list, type, data) {
	list.forEach(function (v) {
		if (DIC[v]) DIC[v].send(type, data);
	});
};
exports.publish = function (type, data, _room) {
	var i;

	if (Cluster.isMaster) {
		var r = Object.assign({ type: type }, data);
		var msg = JSON.stringify(r);

		if (type == "conn" || type == "disconn" || type == "room") {
			// conn/disconn: 로비 유저에게만 전달 (방 안 유저는 connRoom/disconnRoom 사용)
			// room: 로비 유저에게만 전달 (방 안 유저는 slave에서 직접 전송)
			for (i in DIC) {
				if (DIC[i].place == 0 && DIC[i].socket && DIC[i].socket.readyState == 1) {
					DIC[i].socket.send(msg);
				}
			}
		} else {
			for (i in DIC) {
				if (DIC[i].socket && DIC[i].socket.readyState == 1) {
					DIC[i].socket.send(msg);
				}
			}
		}
	} else if (Cluster.isWorker) {
		if (type == "room") {
			process.send({ type: "room-publish", data: data, password: _room });
			// 방 안의 클라이언트(slave DIC)에게도 직접 전송 — room 이벤트가 방 내 유저에게 전달되지 않던 버그 수정
			var r = Object.assign({ type: type }, data);
			var msg = JSON.stringify(r);
			var roomId = data && data.room && data.room.id;
			for (i in DIC) {
				if (DIC[i].place == roomId && DIC[i].socket && DIC[i].socket.readyState == 1) {
					DIC[i].socket.send(msg);
				}
			}
		} else {
			var r = Object.assign({ type: type }, data);
			var msg = JSON.stringify(r);
			for (i in DIC) {
				if (DIC[i].socket && DIC[i].socket.readyState == 1) {
					DIC[i].socket.send(msg);
				}
			}
		}
	}
};
exports.Robot = function (target, place, level, customName, personality, preferredChar) {
	var my = this;

	my.id = target + place + Math.floor(Math.random() * 1000000000);
	my.robot = true;
	my.game = { score: 0, bonus: 0, team: 0 };
	my.data = {};
	my.place = place;
	my.target = target;
	my.equip = { robot: true };
	my.personality = personality || 0;
	my.preferredChar = preferredChar || "";
	my.muteGame = true;
	my.muteLobby = true;
	my.anger = 0;
	my.canRageQuit = false;
	my.fastMode = false;
	my.data.personality = my.personality;
	my.data.preferredChar = my.preferredChar;
	my.data.muteGame = my.muteGame;
	my.data.muteLobby = my.muteLobby;
	my.data.canRageQuit = my.canRageQuit;
	my.data.anger = my.anger;
	my.data.fastMode = my.fastMode;

	// Randomly equip items
	(function () {
		var count = Math.floor(Math.random() * 5) + 2; // 2 ~ 6
		var shuffled = Const.AVAIL_EQUIP.slice().sort(function (a, b) {
			var wa = Const.BOT_ITEM_WEIGHTS[a] || 10;
			var wb = Const.BOT_ITEM_WEIGHTS[b] || 10;

			// Weighted random shuffle: Math.random() ^ (1 / weight) descending
			return Math.pow(Math.random(), 1 / wb) - Math.pow(Math.random(), 1 / wa);
		});
		var i, group;

		for (i = 0; i < count; i++) {
			var item = shuffled[i];
			// Skip default items (starting with 'M') and Badges (starting with 'BDG') to prevent client-side errors
			if (item.charAt(0) === 'M' || item.substring(0, 3) === 'BDG') continue;

			for (var group in Const.GROUPS) {
				if (Const.GROUPS[group].indexOf(item) !== -1) {
					if (group === 'hs') {
						var HAND_ITEMS = ["bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice", "rio_seonghwa", "spanner"];
						var SHOES_ITEMS = ["black_oxford", "black_shoes", "brown_oxford", "loosesocks"];
						if (HAND_ITEMS.indexOf(item) !== -1) my.equip['Mrhand'] = item; // Assign to Right Hand by default
						else if (SHOES_ITEMS.indexOf(item) !== -1) my.equip['Mshoes'] = item;
					} else if (group === 'skin') {
						my.equip['NIK'] = item;
					} else {
						var key = (group === 'badge') ? 'BDG' : ('M' + group);
						my.equip[key] = item;
					}
					break;
				}
			}
		}
	})();

	my.getData = function () {
		return {
			id: my.id,
			robot: true,
			game: {
				score: my.game.score || 0,
				team: my.game.team || 0,
				bonus: my.game.bonus || 0,
				item: my.game.item ? my.game.item.slice() : [],
				alive: my.game.alive  // 서바이벌 모드: 생존 상태 추가
			},
			data: my.data,
			place: my.place,
			target: target,
			equip: my.equip,
			level: my.level,
			profile: my.profile,
			personality: my.personality,
			preferredChar: my.preferredChar,
			muteGame: my.muteGame,
			muteLobby: my.muteLobby,
			canRageQuit: my.canRageQuit,
			anger: my.anger,
			fastMode: my.fastMode,
			ready: true
		};
	};
	function generateBotName(level) {
		if (customName) return customName;
		var tpl = Const.BOT_NAME_TEMPLATES;
		var name = Const.BOT_LEVEL_NAMES[level] || Const.BOT_LEVEL_NAMES[2];

		return tpl[Math.floor(Math.random() * tpl.length)].replace("{0}", name);
	}
	my.setLevel = function (level) {
		my.level = level;
		my.data.score = Math.round(Math.pow(10, level + 2) * (0.3 + Math.random() * 1.7));
	};
	my.setTeam = function (team) {
		my.game.team = team;
	};
	my.send = function () { };
	my.obtain = function () { };
	my.invokeWordPiece = function (text, coef) { };
	my.publish = function (type, data, noBlock) {
		var i;

		data.profile = my.profile;
		if (my.target == null) {
			var r = Object.assign({ type: type }, data);
			var msg = JSON.stringify(r);
			for (i in DIC) {
				if (DIC[i].place == place && DIC[i].socket && DIC[i].socket.readyState == 1) {
					DIC[i].socket.send(msg);
				}
			}
		} else if (DIC[my.target]) {
			DIC[my.target].send(type, data);
		}
	};
	my.chat = function (msg, code) {
		my.publish('chat', { value: msg });
		// Log robot chat
		if (Cluster.isMaster && !code) {
			DiscordRelay("chat-log", { profile: my.profile, message: msg, place: my.place, isRobot: true });
		} else if (Cluster.isWorker) {
			process.send({ type: "chat-log", profile: my.profile, message: msg, place: my.place, isRobot: true });
		}
	};
	my._rageQuitting = false;
	my.adjustAnger = function (delta) {
		if (my._rageQuitting) return;
		my.anger = Math.max(0, Math.min(10, my.anger + delta));
		my.data.anger = my.anger;
		if (my.canRageQuit && my.anger >= 10) {
			my.rageQuit();
		}
	};
	my.rageQuit = function () {
		if (my._rageQuitting) return;
		my._rageQuitting = true;
		var msg = Const.ROBOT_FINAL_MESSAGES[Math.floor(Math.random() * Const.ROBOT_FINAL_MESSAGES.length)];
		my.chat(msg);
		setTimeout(function () {
			var room = ROOM[place] || (DIC[my.target] && DIC[my.target].pracRoom);
			if (!room) return;
			// 봇 퇴장 알림 전송
			my.publish('disconnRoom', { id: my.id, profile: my.profile, robot: true });
			if (room.gaming && room.game && room.game.seq) {
				var seqIndex = room.game.seq.indexOf(my);
				if (seqIndex != -1) {
					if (room.opts && room.opts.survival) {
						// 서바이벌 모드: KO 처리
						my.game.alive = false;
						my.game.score = 0;
						Const.recordSurvivalKO(room, my);
						room.byMaster('survivalKO', { target: my.id }, true);
						var isTurn = room.game.turn == seqIndex;
						clearTimeout(room.game.turnTimer);
						clearTimeout(room.game.robotTimer);
						clearTimeout(room.game._rrt);
						var status = Const.checkSurvivalStatus(room, DIC);
						if (status.gameOver) {
							room.game._rrt = setTimeout(function () { if (room.gaming) room.roundEnd(); }, 2000);
						} else if (isTurn) {
							room.game.loading = false;
							room.game._rrt = setTimeout(function () { if (room.gaming) room.turnNext(); }, 2000);
						}
						// 봇은 퇴장하므로 seq에서 제거하고 turn 인덱스 보정 (버그 #1 수정)
						room.game.seq.splice(seqIndex, 1);
						if (room.game.seq.length > 0) {
							if (room.opts.randomturn) {
								// randomturn: splice 후 stale 인덱스 방지를 위해 재생성 (alive 플레이어만)
								room.game.randomTurnOrder = [];
								room.game.randomTurnIndex = 0;
								for (var rt = 0; rt < room.game.seq.length; rt++) {
									var rp = DIC[room.game.seq[rt]] || room.game.seq[rt];
									if (rp && rp.game && rp.game.alive) {
										room.game.randomTurnOrder.push(rt);
										room.game.randomTurnOrder.push(rt);
									}
								}
								room.game.randomTurnOrder = shuffle(room.game.randomTurnOrder);
								if (room.game.randomTurnOrder.length > 0) {
									room.game.turn = room.game.randomTurnOrder[0];
								}
							} else {
								if (isTurn) {
									// 현재 턴 봇 제거: turn을 seqIndex-1로 맞춰 turnNext가 seqIndex를 가리키게 함
									room.game.turn = (seqIndex - 1 + room.game.seq.length) % room.game.seq.length;
								} else if (room.game.turn > seqIndex) {
									// 현재 턴 앞의 봇 제거: 현재 턴 인덱스 보정
									room.game.turn--;
									if (room.game.turn < 0) room.game.turn = room.game.seq.length - 1;
								}
								if (room.game.turn >= room.game.seq.length) room.game.turn = 0;
							}
						}
					} else {
						// 비서바이벌 모드
						var isTurn = room.game.turn == seqIndex;
						if (room.game.seq.length <= 2) {
							room.game.seq.splice(seqIndex, 1);
							room.roundEnd();
						} else {
							if (isTurn && room.rule.ewq) {
								clearTimeout(room.game._rrt);
								room.game.loading = false;
								if (Cluster.isWorker) room.turnEnd();
							}
							room.game.seq.splice(seqIndex, 1);
							if (room.opts && room.opts.randomturn) {
								room.game.randomTurnOrder = [];
								room.game.randomTurnIndex = 0;
								for (var rt = 0; rt < room.game.seq.length * 2; rt++) {
									room.game.randomTurnOrder.push(rt % room.game.seq.length);
								}
								room.game.randomTurnOrder = shuffle(room.game.randomTurnOrder);
								room.game.turn = room.game.randomTurnOrder[0];
							} else {
								if (room.game.turn > seqIndex) {
									room.game.turn--;
									if (room.game.turn < 0) room.game.turn = room.game.seq.length - 1;
								}
								if (room.game.turn >= room.game.seq.length) room.game.turn = 0;
							}
						}
					}
				}
				// players에서도 제거
				var pIdx = room.players.indexOf(my);
				if (pIdx != -1) room.players.splice(pIdx, 1);
				room.export();
				room.checkJamsu();
			} else {
				room.removeAI(my.id);
			}
		}, 500);
	};
	my.profile = {
		id: my.id,
		image: "/img/kkutu/robot.png",
		title: generateBotName(level)
	};
	my.setLevel(level);
	my.setTeam(0);
};
exports.Data = function (data) {
	var i, j;

	if (!data) data = {};

	this.score = data.score || 0;
	this.playTime = data.playTime || 0;
	this.connectDate = data.connectDate || 0;
	this.record = {};
	for (i in Const.GAME_TYPE) {
		this.record[j = Const.GAME_TYPE[i]] = data.record ? (data.record[Const.GAME_TYPE[i]] || [0, 0, 0, 0]) : [0, 0, 0, 0];
		if (!this.record[j][3]) this.record[j][3] = 0;
	}
	// 전, 승, 점수
};
exports.WebServer = function (socket) {
	var my = this;

	my.socket = socket;

	my.send = function (type, data) {
		var i, r = data || {};

		r.type = type;

		if (socket.readyState == 1) socket.send(JSON.stringify(r));
	};
	my.onWebServerMessage = function (msg) {
		try { msg = JSON.parse(msg); } catch (e) { return; }

		switch (msg.type) {
			case 'seek':
				my.send('seek', { value: Object.keys(DIC).length });
				break;
			case 'narrate-friend':
				exports.narrate(msg.list, 'friend', { id: msg.id, s: msg.s, stat: msg.stat });
				break;
			default:
		}
	};
	socket.on('message', my.onWebServerMessage);
};
exports.Client = function (socket, profile, sid) {
	var my = this;
	var gp, okg;

	if (profile) {
		my.id = profile.id;
		my.profile = profile;
		/* 망할 셧다운제
		if(Cluster.isMaster){
			my.isAjae = Ajae.checkAjae(profile.birth, profile._age);
		}else{
			my.isAjae = true;
		}
		my._birth = profile.birth;
		my._age = profile._age;
		delete my.profile.birth;
		delete my.profile._age;
		*/
		delete my.profile.token;
		delete my.profile.sid;

		if (my.profile.title) my.profile.name = "anonymous";
	} else {
		gp = guestProfiles[Math.floor(Math.random() * guestProfiles.length)];

		my.id = "guest__" + sid;
		my.guest = true;
		my.isAjae = false;
		my.profile = {
			id: my.id,
			title: getGuestName(sid),
			image: GUEST_IMAGE
		};
	}
	my.socket = socket;
	my.place = 0;
	my.team = 0;
	my.ready = false;
	my.game = {};

	my.subPlace = 0;
	my.error = false;
	my.blocked = false;
	my.spam = 0;
	my._pub = new Date();

	if (Cluster.isMaster) {
		my.onOKG = function (time) {
			// ?? 이럴 일이 없어야 한다.
		};
	} else {
		my.onOKG = function (time) {
			var d = (new Date()).getDate();

			if (my.guest) return;
			if (d != my.data.connectDate) {
				my.data.connectDate = d;
				my.data.playTime = 0;
				my.okgCount = 0;
			}
			my.data.playTime += time;

			while (my.data.playTime >= PER_OKG * (my.okgCount + 1)) {
				if (my.okgCount >= MAX_OKG) return;
				my.okgCount++;
			}
			my.send('okg', { time: my.data.playTime, count: my.okgCount });
			// process.send({ type: 'okg', id: my.id, time: time });
		};
	}
	// heartbeat 타임스탬프 (글로벌 heartbeat 타이머에서 사용)
	my._lastHeartbeat = Date.now();
	// 클라이언트가 보고하는 마지막 visibility 상태 (모바일 백그라운드 진단용)
	my._lastVisibility = null;

	// 소켓 에러 핸들러 (미등록 시 에러로 소켓이 깨져도 DIC에 잔류 — 유령 유저 원인)
	socket.on('error', function (err) {
		JLog.warn('Socket error #' + my.id + ': ' + err.toString());
		if (socket.readyState !== 3) {
			socket.terminate();
		}
	});

	socket.on('close', function (code) {
		var elapsed = Math.round((Date.now() - my._lastHeartbeat) / 1000);
		var visInfo = my._lastVisibility
			? (my._lastVisibility.state + ' ' + Math.round((Date.now() - my._lastVisibility.at) / 1000) + 's ago')
			: 'unknown';
		// go()가 이미 호출된 경우(place==0): 서버 측에서 소켓을 닫은 것이므로 info 레벨로 기록
		// 그 외 비정상 종료(place가 남아있는 경우)는 warn 레벨
		if (my.place === 0) {
			JLog.info('Socket closed (post-go) #' + my.id + ' code=' + code);
		} else {
			JLog.warn('Socket closed #' + my.id + ' code=' + code + ' lastHeartbeat=' + elapsed + 's ago' + ' lastVisibility=' + visInfo);
		}
		// 글로벌 heartbeat에서 이미 cleanup 한 경우 중복 방지
		if (my._ghostCleaned) return;
		try {
			if (ROOM[my.place]) ROOM[my.place].go(my, null, my._leaveReason || "disconnect");
			if (my.subPlace && my.pracRoom) {
				if (my.pracRoom.gaming) my.pracRoom.interrupt();
				my.pracRoom.go(my);
				my.pracRoom = null;
				my.subPlace = 0;
			}
		} catch (e) {
			JLog.error('Socket close cleanup error #' + my.id + ': ' + e.toString());
		}
		exports.onClientClosed(my, code);
	});
	socket.on('message', function (msg) {
		var data, room = ROOM[my.place];
		if (!my) return;
		if (!msg) return;

		try { data = JSON.parse(msg); } catch (e) { data = { error: 400 }; }
		const TAIL_TYPES = ["enter", "setRoom", "leave", "start", "kick", "kickVote", "handover", "setAI", "form", "team"];
		if (Cluster.isWorker && !data.error && TAIL_TYPES.indexOf(data.type) !== -1) {
			process.send({ type: "tail-report", id: my.id, chan: channel, place: my.place, msg: data });
		}

		exports.onClientMessage(my, data);
	});
	/* 망할 셧다운제
	my.confirmAjae = function(input){
		if(Ajae.confirmAjae(input, my._birth, my._age)){
			DB.users.update([ '_id', my.id ]).set([ 'birthday', input.join('-') ]).on(function(){
				my.sendError(445);
			});
		}else{
			DB.users.update([ '_id', my.id ]).set([ 'black', `[${input.join('-')}] 생년월일이 올바르게 입력되지 않았습니다. 잠시 후 다시 시도해 주세요.` ]).on(function(){
				my.socket.close();
			});
		}
	};
	*/
	my.getData = function (gaming, slim) {
		var o = {
			id: my.id,
			guest: my.guest,
			game: {
				ready: my.ready,
				form: my.form,
				team: my.team,
				practice: my.subPlace,
				score: my.game.score,
				item: my.game.item,
				alive: my.game.alive  // 서바이벌 모드: 생존 상태 추가
			}
		};
		if (!gaming) {
			o.profile = my.profile;
			o.place = my.place;
			if (slim) {
				o.data = { score: my.data.score || 0 };
			} else {
				o.data = my.data;
			}
			o.money = my.money;
			o.equip = my.equip;
			o.exordial = my.exordial;
		}
		return o;
	};
	my.send = function (type, data) {
		var i, r = data || {};

		r.type = type;

		if (socket.readyState == 1) socket.send(JSON.stringify(r));
	};
	my.sendError = function (code, msg) {
		my.send('error', { code: code, message: msg });
	};
	my.publish = function (type, data, noBlock) {
		var i;
		var now = new Date(), st = now - my._pub;

		if (type == 'chat') {
			if (st <= Const.SPAM_ADD_DELAY) my.spam++;
			else if (st >= Const.SPAM_CLEAR_DELAY) my.spam = 0;
		}
		if (type == 'chat') {
			if (my.spam >= Const.SPAM_LIMIT) {
				if (!my.blocked) my.numSpam = 0;
				my.blocked = true;
			}
			if (!noBlock) {
				my._pub = now;
				if (my.blocked) {
					if (st < Const.BLOCKED_LENGTH) {
						if (++my.numSpam >= Const.KICK_BY_SPAM) {
							if (Cluster.isWorker) process.send({ type: "kick", target: my.id });
							my._leaveReason = "spam";
							return my.socket.close();
						}
						return my.send('blocked');
					} else my.blocked = false;
				}
			}
		}
		data.profile = my.profile;
		if (my.subPlace && type != 'chat') my.send(type, data);
		else {
			var r = Object.assign({ type: type }, data);
			var msg = JSON.stringify(r);
			for (i in DIC) {
				if (DIC[i].place == my.place && DIC[i].socket && DIC[i].socket.readyState == 1) {
					DIC[i].socket.send(msg);
				}
			}
		}
		if (Cluster.isWorker && type == 'user') process.send({ type: "user-publish", data: data });
	};
	my.chat = function (msg, code) {
		if (my.noChat) return my.send('chat', { notice: true, code: 443 });
		my.publish('chat', { value: msg, notice: code ? true : false, code: code });
		// Log chat to Discord
		if (!code) {
			if (Cluster.isMaster) {
				DiscordRelay("chat-log", { profile: my.profile, message: msg, place: my.place, isRobot: false });
			} else if (Cluster.isWorker) {
				process.send({ type: "chat-log", profile: my.profile, message: msg, place: my.place, isRobot: false });
			}
		}
	};
	my.checkExpire = function () {
		var now = new Date();
		var d = now.getDate();
		var i, expired = [];
		var gr;

		now = now.getTime() * 0.001;
		if (d != my.data.connectDate) {
			my.data.connectDate = d;
			my.data.playTime = 0;
		}
		for (i in my.box) {
			if (!my.box[i]) {
				delete my.box[i];
				continue;
			}
			if (!my.box[i].expire) continue;
			if (my.box[i].expire < now) {
				gr = SHOP[i].group;

				if (gr.substr(0, 3) == "BDG") gr = "BDG";
				if (my.equip[gr] == i) delete my.equip[gr];
				delete my.box[i];
				expired.push(i);
			}
		}
		if (expired.length) {
			my.send('expired', { list: expired });
			my.flush(my.box, my.equip);
		}
	};
	my.checkEventItems = function () {
		var $events = _cachedEventList;
		if (!$events || !$events.length) return;
		var toRemove = {};
		var activeProtected = {};
		$events.forEach(function (ev) {
			if (!ev.eventitem || !ev.eventitem.length) return;
			if (Const.isEventActive(ev)) {
				ev.eventitem.forEach(function (id) { activeProtected[id] = true; });
			} else {
				ev.eventitem.forEach(function (id) { toRemove[id] = true; });
			}
		});
		var removed = [];
		Object.keys(toRemove).forEach(function (id) {
			if (activeProtected[id]) return;
			if (!my.box[id]) return;
			delete my.box[id];
			removed.push(id);
		});
		if (removed.length) {
			my.send('expired', { list: removed });
			my.flush(my.box, my.equip);
		}
	};
	my.updateProfile = function (profile) {
		if (profile.nickname) {
			my.profile.nickname = my.profile.title = my.profile.name = profile.nickname;
		}
		if (profile.exordial) my.profile.exordial = profile.exordial;

		var payload = { id: my.id, profile: my.profile };
		// my.publish는 같은 방/로비 사용자에게만 전달되므로, 닉네임 변경처럼 접속 중인
		// 모든 사용자에게 즉시 반영되어야 하는 이벤트는 exports.publish로 전체 브로드캐스트한다.
		exports.publish('updateUser', payload);
		// 방 안(worker 프로세스) 유저에게도 전달
		if (CHAN) for (var ch in CHAN) CHAN[ch].send({ type: "broadcast", event: "updateUser", data: payload });
	};
	my.refresh = function () {
		var R = new Lizard.Tail();

		if (my.guest) {
			my.equip = {};
			my.data = new exports.Data();
			my.money = 0;
			my.friends = {};

			R.go({ result: 200 });
		} else DB.users.findOne(['_id', my.id]).on(function ($user) {
			var first = !$user;
			var black = first ? "" : $user.black;
			/* Enhanced User Block System [S] */
			const blockedUntil = (first || !$user.blockeduntil) ? null : $user.blockeduntil;
			/* Enhanced User Block System [E] */

			if (first) $user = { money: 0 };
			if (black == "null") black = false;
			if (black == "chat") {
				black = false;
				my.noChat = true;
			}
			/* 망할 셧다운제
			if(Cluster.isMaster && !my.isAjae){ // null일 수는 없다.
				my.isAjae = Ajae.checkAjae(($user.birthday || "").split('-'));
				if(my.isAjae === null){
					if(my._birth) my._checkAjae = setTimeout(function(){
						my.sendError(442);
						my.socket.close();
					}, 300000);
					else{
						my.sendError(441);
						my.socket.close();
						return;
					}
				}
			}*/
			my.exordial = $user.exordial || "";
			my.equip = $user.equip || {};
			my.box = $user.box || {};
			my.data = new exports.Data($user.kkutu);
			my.money = Number($user.money);
			my.friends = $user.friends || {};
			if (first) my.flush();
			else {
				my.checkExpire();
				my.checkEventItems();
				my.okgCount = Math.floor((my.data.playTime || 0) / PER_OKG);
			}
			/* Enhanced User Block System [S] */
			if (black) {
				if (blockedUntil) R.go({ result: 444, black: black, blockedUntil: blockedUntil });
				else R.go({ result: 444, black: black });
			}
			/* Enhanced User Block System [E] */
			else if (Cluster.isMaster && $user.server && DIC[my.id]) R.go({ result: 409, black: $user.server })
			else if (exports.NIGHT && my.isAjae === false) R.go({ result: 440 });
			else R.go({ result: 200 });
		});
		return R;
	};
	my.flush = function (box, equip, friends) {
		var R = new Lizard.Tail();

		if (my.guest) {
			R.go({ id: my.id, prev: 0 });
			return R;
		}
		DB.users.upsert(['_id', my.id]).set(
			!isNaN(my.money) ? ['money', my.money] : undefined,
			(my.data && !isNaN(my.data.score)) ? ['kkutu', my.data] : undefined,
			box ? ['box', my.box] : undefined,
			equip ? ['equip', my.equip] : undefined,
			friends ? ['friends', my.friends] : undefined
		).on(function (__res) {
			var prevRank = DB.redis.getGlobal(my.id);
			DB.redis.putGlobal(my.id, my.data.score);
			prevRank.then(function (_res) {
				R.go({ id: my.id, prev: _res });
			});
		});
		return R;
	};
	my.invokeWordPiece = function (text, coef) {
		if (!my.game.wpc) return;
		var v;
		if (Math.random() <= Const.WORD_PIECE_CHANCE * coef) {
			v = text.charAt(Math.floor(Math.random() * text.length));
			if (!v.match(/[a-z가-힣]/)) return;
			my.game.wpc.push(v);
		}
	};
	my.enter = function (room, spec, pass) {
		var $room, i;

		if (my.place) {
			my.send('roomStuck');
			JLog.warn(`Enter the room ${room.id} in the place ${my.place} by ${my.id}!`);
			return;
		} else if (room.id) {
			// 이미 있는 방에 들어가기... 여기서 유효성을 검사한다.
			$room = ROOM[room.id];

			if (!$room) {
				if (Cluster.isMaster) {
					for (i in CHAN) CHAN[i].send({ type: "room-invalid", room: room });
				} else {
					process.send({ type: "room-invalid", room: room });
				}
				return my.sendError(430, room.id);
			}
			if (!spec) {
				if ($room.gaming) {
					return my.send('error', { code: 416, target: $room.id });
				} else if (my.guest) if (!GUEST_PERMISSION.enter) {
					return my.sendError(401);
				}
			}
			if ($room.players.length >= $room.limit + (spec ? Const.MAX_OBSERVER : 0)) {
				return my.sendError(429);
			}
			if ($room.players.indexOf(my.id) != -1) {
				// 재접속으로 인해 이전 자신이 players에 남아있는 경우 자동 정리
				if (DIC[my.id] === my) {
					var staleIdx = $room.players.indexOf(my.id);
					$room.players.splice(staleIdx, 1);
					JLog.warn(`enter: Auto-removed stale self ${my.id} from room ${$room.id} players`);
				} else {
					return my.sendError(409);
				}
			}
			if (Cluster.isMaster) {
				my.send('preRoom', { id: $room.id, pw: room.password, channel: $room.channel });
				CHAN[$room.channel].send({ type: "room-reserve", session: sid, room: room, spec: spec, pass: pass });

				$room = undefined;
			} else {
				if (!pass && $room) {
					if ($room.kicked.indexOf(my.id) != -1) {
						return my.sendError(406);
					}
					if ($room.password != room.password && $room.password) {
						$room = undefined;
						return my.sendError(403);
					}
				}
			}
		} else if (my.guest && !GUEST_PERMISSION.enter) {
			my.sendError(401);
		} else {
			// 새 방 만들어 들어가기
			/*
				1. 마스터가 ID와 채널을 클라이언트로 보낸다.
				2. 클라이언트가 그 채널 일꾼으로 접속한다.
				3. 일꾼이 만든다.
				4. 일꾼이 만들었다고 마스터에게 알린다.
				5. 마스터가 방 정보를 반영한다.
			*/
			if (Cluster.isMaster) {
				var av = getFreeChannel();

				room.id = _rid;
				room._create = true;
				my.send('preRoom', { id: _rid, channel: av });
				CHAN[av].send({ type: "room-reserve", create: true, session: sid, room: room });

				do {
					if (++_rid > 999) _rid = 100;
				} while (ROOM[_rid]);
			} else {
				if (room._id) {
					room.id = room._id;
					delete room._id;
				}
				if (my.place != 0) {
					my.sendError(409);
				}
				$room = new exports.Room(room, getFreeChannel());

				process.send({ type: "room-new", target: my.id, room: $room.getData(), realPassword: $room.password || "" });
				ROOM[$room.id] = $room;
				spec = false;
			}
		}
		if ($room) {
			if (spec) $room.spectate(my, room.password);
			else $room.come(my, room.password, pass);
			$room.checkJamsu();
		}
	};
	my.leave = function (kickVote) {
		var $room = ROOM[my.place];

		if (my.subPlace) {
			if (my.pracRoom) {
				if (my.pracRoom.gaming) my.pracRoom.interrupt();
				my.pracRoom.go(my);
				my.pracRoom = null;
			}
			my.subPlace = 0;
			if ($room) my.send('room', { target: my.id, room: $room.getData() });
			my.publish('user', my.getData(false, true));
			// 버그 수정: 연습 종료 전에 먼저 타이머 정리, 그 후 isPracticing=false
			if ($room) {
				// 타이머 먼저 정리 (isPracticing=true 상태에서)
				if ($room._adt) { clearTimeout($room._adt); delete $room._adt; }
				if ($room._jst) { clearTimeout($room._jst); delete $room._jst; }
				if ($room._jst_stage2) { clearTimeout($room._jst_stage2); delete $room._jst_stage2; }
				// 그 다음 isPracticing 해제
				$room.isPracticing = false;
				// 잠수 체크 및 타이머 재설정
				$room.checkJamsu();
				if ($room.master === my.id) $room.setAutoDelete();
			}
			if (!kickVote) return;
		}
		if ($room) {
			$room.go(my, kickVote, kickVote ? "kick" : "normal");
			$room.checkJamsu();
		}
	};
	my.setForm = function (mode) {
		var $room = ROOM[my.place];

		if (!$room) return;

		my.form = mode;
		my.ready = false;
		my.publish('user', my.getData(false, true));
		$room.checkJamsu();
	};
	my.setTeam = function (team) {
		my.team = team;
		my.publish('user', my.getData(false, true));
	};
	my.kick = function (target, kickVote) {
		var $room = ROOM[my.place];
		var i, $c;
		var len = $room.players.length;

		if (target == null) { // 로봇 (이 경우 kickVote는 로봇의 식별자)
			$room.removeAI(kickVote);
			return;
		}
		for (i in $room.players) {
			if ($room.players[i].robot) len--;
		}
		if (len < 4) kickVote = { target: target, Y: 1, N: 0 };
		if (kickVote) {
			$room.kicked.push(target);
			$room.kickVote = null;
			if (DIC[target]) DIC[target].leave(kickVote);
		} else {
			$room.kickVote = { target: target, Y: 1, N: 0, list: [] };
			for (i in $room.players) {
				$c = DIC[$room.players[i]];
				if (!$c) continue;
				if ($c.id == $room.master) continue;

				$c.kickTimer = setTimeout($c.kickVote, 10000, $c, true);
			}
			my.publish('kickVote', $room.kickVote, true);
		}
	};
	my.kickVote = function (client, agree) {
		var $room = ROOM[client.place];
		var $m;

		if (!$room) return;

		$m = DIC[$room.master];
		if ($room.kickVote) {
			$room.kickVote[agree ? 'Y' : 'N']++;
			if ($room.kickVote.list.push(client.id) >= $room.players.length - 2) {
				if ($room.gaming) return;

				if ($room.kickVote.Y >= $room.kickVote.N) $m.kick($room.kickVote.target, $room.kickVote);
				else $m.publish('kickDeny', { target: $room.kickVote.target, Y: $room.kickVote.Y, N: $room.kickVote.N }, true);

				$room.kickVote = null;
			}
		}
		clearTimeout(client.kickTimer);
	};
	my.toggle = function () {
		var $room = ROOM[my.place];

		if (!$room) return;
		if ($room.master == my.id) return;
		if (my.form != "J") return;

		my.ready = !my.ready;
		my.publish('user', my.getData(false, true));
		$room.checkJamsu();
	};
	my.start = function () {
		if (my.subPlace) my.leave();
		var $room = ROOM[my.place];

		if (!$room) return;
		if ($room.master != my.id) return;
		if ($room.players.length < 2) return my.sendError(411);

		$room.ready();
	};
	my.practice = function (data) {
		var $room = ROOM[my.place];
		var ud;
		var pr;

		if (typeof data == "number") data = { level: data };

		if (!$room) return;
		if (my.subPlace) return;
		if (my.form != "J") return;

		// 버그 수정: 방장이 연습 시작 시 잠수 타이머 정리
		if ($room.master == my.id) {
			$room.isPracticing = true;
			if ($room._jst) { clearTimeout($room._jst); delete $room._jst; }
			if ($room._jst_stage2) { clearTimeout($room._jst_stage2); delete $room._jst_stage2; }
			if ($room._adt) { clearTimeout($room._adt); delete $room._adt; }
		}

		my.team = 0;
		my.ready = false;
		ud = my.getData(false, true);
		// 연습방 데이터 생성 시 practice=true를 미리 설정
		var pracRoomData = $room.getData();
		pracRoomData.practice = true;  // Room 생성자에서 setAutoDelete() 호출 방지
		my.pracRoom = new exports.Room(pracRoomData);
		// 버그 수정: 연습방은 생성 직후 practice=true 확인 (이미 위에서 설정됨)
		// 추가 안전장치: 타이머가 있으면 클리어
		if (my.pracRoom._adt) { clearTimeout(my.pracRoom._adt); delete my.pracRoom._adt; }
		if (my.pracRoom._jst) { clearTimeout(my.pracRoom._jst); delete my.pracRoom._jst; }
		if (my.pracRoom._jst_stage2) { clearTimeout(my.pracRoom._jst_stage2); delete my.pracRoom._jst_stage2; }
		my.pracRoom.id = $room.id + 1000;
		ud.game.practice = my.pracRoom.id;
		if (pr = $room.preReady()) return my.sendError(pr);
		my.publish('user', ud);
		my.pracRoom.time /= my.pracRoom.rule.time;
		my.pracRoom.limit = 1;
		my.pracRoom.password = "";
		// practice는 이미 위에서 설정했으므로 제거
		my.subPlace = my.pracRoom.id;
		my.pracRoom.come(my);
		// 연습 중에는 checkJamsu 호출하지 않음 (isPracticing=true 상태)
		my.pracRoom.start(data.level, data.personality, data.preferredChar, data.muteGame, data.muteLobby, data.canRageQuit, data.fastMode);
		my.pracRoom.game.hum = 1;

	};
	my.setRoom = function (room) {
		var $room = ROOM[my.place];

		if ($room) {
			if (!$room.gaming) {
				if ($room.master == my.id) {
					$room.set(room);
					exports.publish('room', { target: my.id, room: $room.getData(), modify: true }, room.password);
					// Discord: 방 설정 변경 로그
					var roomData = {
						title: $room.title,
						password: $room.password,
						limit: $room.limit,
						mode: $room.mode,
						round: $room.round,
						time: $room.time,
						opts: $room.opts
					};
					if (Cluster.isMaster) {
						DiscordRelay("room-settings", { roomId: $room.id, room: roomData });
					} else if (Cluster.isWorker) {
						process.send({ type: "room-settings", roomId: $room.id, room: roomData });
					}
				} else {
					my.sendError(400);
				}
			}
		} else {
			my.sendError(400);
		}
	};
	my.applyEquipOptions = function (rw) {
		var $obj;
		var i, j;
		var pm = rw.playTime / 60000;

		rw._score = Math.round(rw.score);
		rw._money = Math.round(rw.money);
		rw._blog = [];
		my.checkExpire();
		for (i in my.equip) {
			$obj = SHOP[my.equip[i]];
			if (!$obj) continue;
			if (!$obj.options) continue;
			for (j in $obj.options) {
				if (j == "gEXP") rw.score += rw._score * $obj.options[j];
				else if (j == "hEXP") rw.score += $obj.options[j] * pm;
				else if (j == "gMNY") rw.money += rw._money * $obj.options[j];
				else if (j == "hMNY") rw.money += $obj.options[j] * pm;
				else continue;
				rw._blog.push("q" + j + $obj.options[j]);
			}
		}
		if (rw.together && my.okgCount > 0) {
			i = 0.05 * my.okgCount;
			j = 0.05 * my.okgCount;

			rw.score += rw._score * i;
			rw.money += rw._money * j;
			rw._blog.push("kgEXP" + i);
			rw._blog.push("kgMNY" + j);
		}
		rw.score = Math.round(rw.score);
		rw.money = Math.round(rw.money);
	};
	my.obtain = function (k, q, flush) {
		if (my.guest) return;
		if (my.box[k]) my.box[k] += q;
		else my.box[k] = q;

		my.send('obtain', { key: k, q: q });
		if (flush) my.flush(true);
	};
	my.addFriend = function (id) {
		var fd = DIC[id];

		if (!fd) return;
		my.friends[id] = fd.profile.title || fd.profile.name;
		my.flush(false, false, true);
		my.send('friendEdit', { friends: my.friends });
	};
	my.removeFriend = function (id) {
		DB.users.findOne(['_id', id]).limit(['friends', true]).on(function ($doc) {
			if (!$doc) return;

			var f = $doc.friends;

			delete f[my.id];
			DB.users.update(['_id', id]).set(['friends', f]).on();
		});
		delete my.friends[id];
		my.flush(false, false, true);
		my.send('friendEdit', { friends: my.friends });
	};
};



function getFreeChannel() {
	var i, list = {};

	if (Cluster.isMaster) {
		var mk = 1;

		for (i in CHAN) {
			// if(CHAN[i].isDead()) continue;
			list[i] = 0;
		}
		for (i in ROOM) {
			// if(!list.hasOwnProperty(i)) continue;
			mk = ROOM[i].channel;
			list[mk]++;
		}
		for (i in list) {
			if (list[i] < list[mk]) mk = i;
		}
		return Number(mk);
	} else {
		return channel || 0;
	}
}
function getGuestName(sid) {
	var i, len = sid.length, res = 0;

	for (i = 0; i < len; i++) {
		res += sid.charCodeAt(i) * (i + 1);
	}
	return "손님" + (1000 + (res % 9000));
}
function shuffle(arr) {
	var r = arr.slice(); // 원본 배열 복사
	for (var i = r.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = r[i];
		r[i] = r[j];
		r[j] = temp;
	}
	return r;
}