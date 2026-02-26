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
var Const = require('../const');
var Lizard = require('../sub/lizard');
var JLog = require('../sub/jjlog');
var DiscordBot = Cluster.isMaster ? require('../sub/discord-bot') : null;
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

// AI 봇 이름 캐시 (DB 조회 횟수 최소화)
var aiNameCacheSingle = []; // 단일 단어용 (2~7글자)
var aiNameCacheFirst = [];  // 두 단어 조합용 첫 번째 (2~5글자)
var aiNameCacheSecond = []; // 두 단어 조합용 두 번째 (2~5글자)
var aiNameCacheRefilling = false; // 리필 중 플래그
const AI_NAME_CACHE_SIZE = 100;  // 한 번에 가져올 단어 수
const AI_NAME_CACHE_THRESHOLD = 20; // 리필 시작 임계값

exports.NIGHT = false;
exports.init = function (_DB, _DIC, _ROOM, _GUEST_PERMISSION, _CHAN) {
	var i, k;

	DB = _DB;
	DIC = _DIC;
	ROOM = _ROOM;
	GUEST_PERMISSION = _GUEST_PERMISSION;
	CHAN = _CHAN;
	_rid = 100;
	// 망할 셧다운제 if(Cluster.isMaster) setInterval(exports.processAjae, 60000);
	DB.kkutu_shop.find().on(function ($shop) {
		SHOP = {};

		$shop.forEach(function (item) {
			SHOP[item._id] = item;
		});
	});
	Rule = {};
	for (i in Const.RULE) {
		k = Const.RULE[i].rule;
		Rule[k] = require(`./games/${k.toLowerCase()}`);
		Rule[k].init(DB, DIC);
	}

	// AI 이름 캐시 초기화
	refillAiNameCache();
};

// AI 이름 캐시 리필 함수
function refillAiNameCache() {
	if (aiNameCacheRefilling) return;
	aiNameCacheRefilling = true;

	var pending = 0;

	// 단일 단어 캐시 리필 (2~7글자)
	if (aiNameCacheSingle.length < AI_NAME_CACHE_THRESHOLD) {
		pending++;
		var q1 = `SELECT _id FROM kkutu_ko WHERE LENGTH(_id) BETWEEN 2 AND 7 OFFSET floor(random() * (SELECT GREATEST(1, reltuples::bigint - ${AI_NAME_CACHE_SIZE}) FROM pg_class WHERE relname = 'kkutu_ko')) LIMIT ${AI_NAME_CACHE_SIZE}`;
		DB.kkutu['ko'].direct(q1, function (err, res) {
			if (!err && res && res.rows) {
				var shuffled = res.rows.slice();
				for (var si = shuffled.length - 1; si > 0; si--) {
					var sj = Math.floor(Math.random() * (si + 1));
					var st = shuffled[si]; shuffled[si] = shuffled[sj]; shuffled[sj] = st;
				}
				shuffled.forEach(function (row) { aiNameCacheSingle.push(row._id); });
				JLog.info(`[AI_NAME_CACHE] Single cache refilled: ${aiNameCacheSingle.length} words`);
			}
			pending--;
			if (pending === 0) aiNameCacheRefilling = false;
		});
	}

	// 첫 번째 단어 캐시 리필 (2~5글자)
	if (aiNameCacheFirst.length < AI_NAME_CACHE_THRESHOLD) {
		pending++;
		var q2 = `SELECT _id FROM kkutu_ko WHERE LENGTH(_id) BETWEEN 2 AND 5 OFFSET floor(random() * (SELECT GREATEST(1, reltuples::bigint - ${AI_NAME_CACHE_SIZE}) FROM pg_class WHERE relname = 'kkutu_ko')) LIMIT ${AI_NAME_CACHE_SIZE}`;
		DB.kkutu['ko'].direct(q2, function (err, res) {
			if (!err && res && res.rows) {
				res.rows.forEach(function (row) { aiNameCacheFirst.push(row._id); });
				JLog.info(`[AI_NAME_CACHE] First cache refilled: ${aiNameCacheFirst.length} words`);
			}
			pending--;
			if (pending === 0) aiNameCacheRefilling = false;
		});
	}

	// 두 번째 단어 캐시 리필 (2~5글자)
	if (aiNameCacheSecond.length < AI_NAME_CACHE_THRESHOLD) {
		pending++;
		var q3 = `SELECT _id FROM kkutu_ko WHERE LENGTH(_id) BETWEEN 2 AND 5 OFFSET floor(random() * (SELECT GREATEST(1, reltuples::bigint - ${AI_NAME_CACHE_SIZE}) FROM pg_class WHERE relname = 'kkutu_ko')) LIMIT ${AI_NAME_CACHE_SIZE}`;
		DB.kkutu['ko'].direct(q3, function (err, res) {
			if (!err && res && res.rows) {
				res.rows.forEach(function (row) { aiNameCacheSecond.push(row._id); });
				JLog.info(`[AI_NAME_CACHE] Second cache refilled: ${aiNameCacheSecond.length} words`);
			}
			pending--;
			if (pending === 0) aiNameCacheRefilling = false;
		});
	}

	// 모든 캐시가 충분하면 플래그 해제
	if (pending === 0) aiNameCacheRefilling = false;
}
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
exports.getUserList = function () {
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

		if (type == "conn" || type == "disconn") {
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
		if (type == "room") process.send({ type: "room-publish", data: data, password: _room });
		else {
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
	my.mute = true;
	my.anger = 0;
	my.canRageQuit = false;
	my.fastMode = false;
	my.data.personality = my.personality;
	my.data.preferredChar = my.preferredChar;
	my.data.mute = my.mute;
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
			mute: my.mute,
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
		my.data.score = Math.round(Math.pow(10, level + 2) * (0.5 + Math.random()));
		my.profile.title = generateBotName(level);
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
			for (i in DIC) {
				if (DIC[i].place == place) DIC[i].send(type, data);
			}
		} else if (DIC[my.target]) {
			DIC[my.target].send(type, data);
		}
	};
	my.chat = function (msg, code) {
		my.publish('chat', { value: msg });
		// Log robot chat
		if (Cluster.isMaster && DiscordBot && !code) {
			DiscordBot.logChat(my.profile, msg, my.place, true);
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
						room.byMaster('survivalKO', { target: my.id, reason: 'ragequit' }, true);
						var isTurn = room.game.turn == seqIndex;
						var status = Const.checkSurvivalStatus(room, DIC);
						if (status.gameOver) {
							clearTimeout(room.game._rrt);
							room.game._rrt = setTimeout(function () { room.roundEnd(); }, 2000);
						} else if (isTurn) {
							clearTimeout(room.game._rrt);
							room.game.loading = false;
							room.game._rrt = setTimeout(function () { room.turnNext(); }, 2000);
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
	// Cloudflare 환경 대응: 앱 레벨 heartbeat
	// Cloudflare 프록시가 WebSocket ping/pong 프레임을 인터셉트하므로
	// 앱 레벨 JSON 메시지로 양방향 heartbeat를 수행하여 idle timeout(100s) 방지
	my._lastHeartbeat = Date.now();
	my._heartbeat = setInterval(function () {
		if (socket.readyState === 1) {
			// 서버→클라이언트 앱 레벨 heartbeat (Cloudflare를 통과하는 일반 메시지)
			my.send('heartbeat', {});

			// heartbeat 타임아웃 체크: 클라이언트로부터 90초간 응답이 없으면 유령으로 판단하여 종료
			var elapsed = Date.now() - my._lastHeartbeat;
			if (elapsed > 90000) {
				JLog.warn(`Heartbeat timeout #${my.id} (${Math.round(elapsed / 1000)}s), closing ghost connection`);
				socket.close();
			}
		}
	}, 25000);

	socket.on('close', function (code) {
		var elapsed = Math.round((Date.now() - my._lastHeartbeat) / 1000);
		JLog.warn(`Socket closed #${my.id} code=${code} lastHeartbeat=${elapsed}s ago`);
		clearInterval(my._heartbeat);
		if (ROOM[my.place]) ROOM[my.place].go(my);
		if (my.subPlace) my.pracRoom.go(my);
		exports.onClientClosed(my, code);
	});
	socket.on('message', function (msg) {
		var data, room = ROOM[my.place];
		if (!my) return;
		if (!msg) return;

		try { data = JSON.parse(msg); } catch (e) { data = { error: 400 }; }
		const TAIL_TYPES = ["enter","setRoom","leave","start","kick","kickVote","handover","setAI","form","team"];
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
	my.getData = function (gaming) {
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
			o.data = my.data;
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
							return my.socket.close();
						}
						return my.send('blocked');
					} else my.blocked = false;
				}
			}
		}
		data.profile = my.profile;
		if (my.subPlace && type != 'chat') my.send(type, data);
		else for (i in DIC) {
			if (DIC[i].place == my.place) DIC[i].send(type, data);
		}
		if (Cluster.isWorker && type == 'user') process.send({ type: "user-publish", data: data });
	};
	my.chat = function (msg, code) {
		if (my.noChat) return my.send('chat', { notice: true, code: 443 });
		my.publish('chat', { value: msg, notice: code ? true : false, code: code });
		// Log chat to Discord
		if (!code) {
			if (Cluster.isMaster && DiscordBot) {
				DiscordBot.logChat(my.profile, msg, my.place, false);
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
	my.updateProfile = function (profile) {
		if (profile.nickname) {
			my.profile.nickname = my.profile.title = my.profile.name = profile.nickname;
			my.publish('chat', {
				value: "님께서 별명을 " + profile.nickname + "(으)로 변경하셨습니다."
			});
		}
		if (profile.exordial) my.profile.exordial = profile.exordial;
		my.publish('updateUser', {
			id: my.id,
			profile: my.profile
		});
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
			const blockedUntil = (first || !$user.blockedUntil) ? null : $user.blockedUntil;
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

		if (Math.random() <= 0.04 * coef) {
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

				process.send({ type: "room-new", target: my.id, room: $room.getData() });
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
			my.pracRoom.go(my);
			if ($room) my.send('room', { target: my.id, room: $room.getData() });
			my.publish('user', my.getData());
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
			$room.go(my, kickVote);
			$room.checkJamsu();
		}
	};
	my.setForm = function (mode) {
		var $room = ROOM[my.place];

		if (!$room) return;

		my.form = mode;
		my.ready = false;
		my.publish('user', my.getData());
	};
	my.setTeam = function (team) {
		my.team = team;
		my.publish('user', my.getData());
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
		my.publish('user', my.getData());
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
		ud = my.getData();
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
		my.pracRoom.start(data.level, data.personality, data.preferredChar, data.mute, data.canRageQuit, data.fastMode);
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
						opts: $room.opts
					};
					if (Cluster.isMaster && DiscordBot) {
						DiscordBot.notifyRoomSettings($room.id, roomData);
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

// ========== 서바이벌 모드 공통 유틸리티 ==========

/**
 * 서바이벌 모드에서 생존자 수와 팀 수를 확인
 * @param {Object} my - Room 객체
 * @returns {Object} { aliveCount, aliveTeams, hasTeams, gameOver }
 */
exports.checkSurvivalStatus = function (my) {
	var aliveCount = 0;
	var aliveTeams = new Set();
	var hasTeams = false;
	var individualCount = 0;

	for (var i in my.game.seq) {
		var p = DIC[my.game.seq[i]] || my.game.seq[i];
		if (p && p.game && p.game.alive) {
			aliveCount++;
			var team = p.robot ? p.game.team : p.team;
			// team이 1~4이면 팀전, 0이거나 undefined/null이면 개인전
			if (team && team >= 1 && team <= 4) {
				aliveTeams.add(team);
				hasTeams = true;
			} else {
				individualCount++;
			}
		}
	}

	// 게임 종료 조건: 팀 + 개인전 합쳐서 1개체만 남을 때
	// (예: 개인 1명 또는 팀 1개 또는 개인 0명+팀 1개 또는 개인 1명+팀 0개)
	var totalEntities = aliveTeams.size + individualCount;
	var gameOver = totalEntities <= 1;

	return {
		aliveCount: aliveCount,
		aliveTeams: aliveTeams,
		hasTeams: hasTeams,
		gameOver: gameOver
	};
};

/**
 * 서바이벌 모드에서 다음 살아있는 플레이어에게 데미지 적용
 * @param {Object} my - Room 객체
 * @param {number} damage - 가할 데미지
 * @param {number} currentTurn - 현재 턴 인덱스
 * @returns {Object|null} { targetId, damage, newHP, ko } 또는 null (대상 없음)
 */
exports.applySurvivalDamage = function (my, damage, currentTurn) {
	if (damage <= 0) return null;

	var nextTurn = currentTurn;
	var attempts = 0;

	while (attempts < my.game.seq.length) {
		nextTurn = (nextTurn + 1) % my.game.seq.length;
		if (nextTurn === currentTurn) {
			attempts++;
			continue;
		}

		var nextPlayer = DIC[my.game.seq[nextTurn]] || my.game.seq[nextTurn];
		if (nextPlayer && nextPlayer.game && nextPlayer.game.alive) {
			// 데미지 적용
			nextPlayer.game.score -= damage;
			var newHP = nextPlayer.game.score;
			var ko = newHP <= 0;

			if (ko) {
				nextPlayer.game.alive = false;
				nextPlayer.game.score = 0;
			}

			return {
				targetId: nextPlayer.id,
				damage: damage,
				newHP: ko ? 0 : newHP,
				ko: ko
			};
		}
		attempts++;
	}

	return null;
};

/**
 * 서바이벌 모드에서 타임아웃으로 인한 KO 처리
 * @param {Object} my - Room 객체
 * @param {Object} target - 타임아웃된 플레이어
 * @param {Object} extraData - turnEnd에 추가할 데이터 (optional)
 * @returns {boolean} 게임이 종료되었으면 true
 */
exports.handleSurvivalTimeout = function (my, target, extraData) {
	if (!my.opts.survival || !target || !target.game || !target.game.alive) {
		return false;
	}

	target.game.alive = false;
	target.game.score = 0;

	var status = exports.checkSurvivalStatus(my);

	var turnEndData = {
		ok: false,
		target: target.id,
		score: 0,
		totalScore: 0,
		survival: true,
		ko: true,
		koReason: 'timeout'
	};

	// 추가 데이터 병합
	if (extraData) {
		for (var key in extraData) {
			turnEndData[key] = extraData[key];
		}
	}

	my.byMaster('turnEnd', turnEndData, true);

	if (status.gameOver) {
		clearTimeout(my.game.robotTimer);
		my.game._rrt = setTimeout(function () {
			my.roundEnd();
		}, 2000);
		return true;
	}

	return false;
};

exports.Room = function (room, channel) {
	var my = this;

	my.id = room.id || _rid;
	my.channel = channel;
	my.opts = {};
	/*my.title = room.title;
	my.password = room.password;
	my.limit = Math.round(room.limit);
	my.mode = room.mode;
	my.rule = Const.getRule(room.mode);
	my.round = Math.round(room.round);
	my.time = room.time * my.rule.time;
	my.opts = {
		manner: room.opts.manner,
		extend: room.opts.injeong,
		mission: room.opts.mission,
		loanword: room.opts.loanword,
		injpick: room.opts.injpick || []
	};*/
	my.master = null;
	my.tail = [];
	my.players = [];
	my.kicked = [];
	my.kickVote = null;

	my.gaming = false;
	my.game = {};

	my.setAutoDelete = function (stage) {
		// 마스터 프로세스에서는 타이머 설정하지 않음 (워커에서만 실행)
		if (Cluster.isMaster) return;

		if (my.practice) return;
		// 연습 중이거나 게임 중이면 기존 타이머 정리 후 return
		if (my.isPracticing || my.gaming) {
			if (my._adt) { clearTimeout(my._adt); delete my._adt; }
			if (my._jst) { clearTimeout(my._jst); delete my._jst; }
			if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
			return;
		}
		if (my.password) return;

		if (my._adt) { clearTimeout(my._adt); delete my._adt; }
		// 버그 수정: _jst 타이머도 함께 정리하여 중복 알림 방지
		if (my._jst) { clearTimeout(my._jst); delete my._jst; }
		if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
		var warnTime = Const.JAMSU_WARN_TIME; // 1.5 minutes
		var warn2Time = Const.JAMSU_WARN2_TIME; // 1 minute
		var boomTime = Const.JAMSU_BOOM_TIME;  // 30 seconds

		if (stage === 'destroy') {
			// 폭파 단계: 30초 후 방 삭제
			my._adt = setTimeout(function () {
				// 좀비 타이머 방지: 방이 이미 삭제되었는지 확인
				if (!ROOM[my.id]) return;

				// 게임 중이면 타이머 삭제 후 게임 종료 시 재설정됨
				if (my.gaming) {
					delete my._adt;
					return;
				}

				// Phantom Player Cleanup
				var i, p;
				for (i = my.players.length - 1; i >= 0; i--) {
					p = my.players[i];
					if (typeof p !== 'object') {
						if (!DIC[p] || DIC[p].place != my.id) {
							my.players.splice(i, 1);
						}
					}
				}
				if (my.players.length == 0) {
					if (my._adt) { clearTimeout(my._adt); delete my._adt; }
					if (my._jst) { clearTimeout(my._jst); delete my._jst; }
					if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
					delete ROOM[my.id];
					if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: my.id } });
					return;
				}

				// 연습 중이면 타이머 삭제 후 연습 종료 시 재설정됨
				if (my.isPracticing) {
					delete my._adt;
					return;
				}

				// 방 삭제 직전 한번 더 상태 확인
				if (my.gaming || my.isPracticing) {
					delete my._adt;
					return;
				}

				// 타이머 정리
				if (my._jst) {
					clearTimeout(my._jst);
					delete my._jst;
				}

				// 방 ID 저장 후 방 먼저 삭제 (중복 알림 방지)
				var roomId = my.id;
				var users = my.players.slice();

				delete ROOM[roomId];
				if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: roomId } });

				// 모든 플레이어에게 방 삭제 알림 전송
				for (i in users) {
					if (typeof users[i] !== 'object' && DIC[users[i]]) {
						// 시스템 알림으로 방 삭제 메시지 전송 (알림창 표시용)
						DIC[users[i]].send('system', { code: 'roomDestroyed' });
						DIC[users[i]].place = 0;
					}
				}

				// 클라이언트가 메시지를 받을 시간 확보 후 소켓 닫기 (딜레이 증가)
				setTimeout(function () {
					// Redundant sync to ensure Master deletes the room
					if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: roomId } });

					for (var j in users) {
						if (typeof users[j] !== 'object' && DIC[users[j]]) {
							if (Cluster.isWorker) {
								DIC[users[j]].socket.close();
								process.send({ type: "room-go", target: users[j], id: roomId, removed: true });
							}
						}
					}
				}, 2000);
			}, boomTime);
		} else if (stage === 'warn2') {
			my._adt = setTimeout(function () {
				// 좀비 타이머 방지: 방이 이미 삭제되었는지 확인
				if (!ROOM[my.id]) return;

				// 게임 중이면 타이머 삭제 후 게임 종료 시 재설정됨
				if (my.gaming) {
					delete my._adt;
					return;
				}

				// Phantom Player Cleanup
				var i, p;
				for (i = my.players.length - 1; i >= 0; i--) {
					p = my.players[i];
					if (typeof p !== 'object') {
						if (!DIC[p] || DIC[p].place != my.id) {
							my.players.splice(i, 1);
						}
					}
				}
				if (my.players.length == 0) {
					if (my._adt) { clearTimeout(my._adt); delete my._adt; }
					if (my._jst) { clearTimeout(my._jst); delete my._jst; }
					if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
					delete ROOM[my.id];
					if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: my.id } });
					return;
				}

				// 연습 중이면 타이머 삭제 후 연습 종료 시 재설정됨
				if (my.isPracticing) {
					delete my._adt;
					return;
				}

				// 메시지 전송 직전 한번 더 상태 확인
				if (my.gaming || my.isPracticing) {
					delete my._adt;
					return;
				}

				exports.narrate(my.players, 'chat', { code: "room_will_be_deleted_1m", notice: true });
				my.setAutoDelete('destroy');
			}, warn2Time);
		} else {
			my._adt = setTimeout(function () {
				// 좀비 타이머 방지: 방이 이미 삭제되었는지 확인
				if (!ROOM[my.id]) return;

				// 게임 중이면 타이머 삭제 후 게임 종료 시 재설정됨
				if (my.gaming) {
					delete my._adt;
					return;
				}

				// Fix: Phantom Player Cleanup
				var i, p;
				for (i = my.players.length - 1; i >= 0; i--) {
					p = my.players[i];
					if (typeof p !== 'object') {
						if (!DIC[p] || DIC[p].place != my.id) {
							my.players.splice(i, 1);
						}
					}
				}
				if (my.players.length == 0) {
					if (my._adt) { clearTimeout(my._adt); delete my._adt; }
					if (my._jst) { clearTimeout(my._jst); delete my._jst; }
					if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
					delete ROOM[my.id];
					if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: my.id } });
					return;
				}

				// 연습 중이면 타이머 삭제 후 연습 종료 시 재설정됨
				if (my.isPracticing) {
					delete my._adt;
					return;
				}

				// 메시지 전송 직전 한번 더 상태 확인
				if (my.gaming || my.isPracticing) {
					delete my._adt;
					return;
				}

				exports.narrate(my.players, 'chat', { code: "room_auto_delete_warning_1", notice: true });
				my.setAutoDelete('warn2');
			}, warnTime);
		}
	};

	my.checkJamsu = function () {
		// 마스터 프로세스에서는 잠수 체크하지 않음 (워커에서만 실행)
		if (Cluster.isMaster) return;
		if (my.password) return;
		// 게임 중이거나 연습 중이면 잠수 체크 안 함
		if (my.gaming || my.isPracticing) {
			if (my._jst) {
				clearTimeout(my._jst);
				delete my._jst;
			}
			if (my._jst_stage2) {
				clearTimeout(my._jst_stage2);
				delete my._jst_stage2;
			}
			return;
		}
		var i, o, allReady = true;
		var h_count = 0; // Human count (including master)
		var b_count = 0; // Bot count
		var waitingHumans = 0;



		for (i in my.players) {
			o = my.players[i];
			if (o.robot) b_count++;
			else if (DIC[o]) {
				h_count++;
				if (DIC[o].id !== my.master) {
					waitingHumans++;
					if (!DIC[o].ready) allReady = false;
				}
			}
		}

		// 조건: 
		// 1. 방장 외 대기하는 사람(봇 포함X, 사람만)이 최소 1명 이상 있어야 함 (waitingHumans > 0)
		// 2. 그 대기하는 모든 사람이 준비 상태여야 함 (allReady)
		if (waitingHumans > 0 && allReady) {
			if (!my._jst) {
				// 1단계: 경고 전 대기 (10초)
				my._jst = setTimeout(function () {
					try {
						delete my._jst;
						// 좀비 타이머 방지: 방이 이미 삭제되었는지 확인
						if (!ROOM[my.id]) return;
						if (my.gaming) return;

						// Phantom Player Cleanup (생략 - 위에서 처리되었거나 2단계에서 처리됨)
						// 1단계 후 조건 재확인
						var hc = 0, bc = 0, wh = 0, ar = true;
						for (var j in my.players) {
							var p = my.players[j];
							if (p.robot) bc++;
							else if (DIC[p]) {
								hc++;
								if (DIC[p].id !== my.master) {
									wh++;
									if (!DIC[p].ready) ar = false;
								}
							}
						}

						if (wh > 0 && ar) {
							var others_count = wh + bc;
							var masterClient = DIC[my.master];
							var masterIsPlayer = masterClient && masterClient.form == 'J';
							var masterIsPractice = masterClient && masterClient.subPlace;
							var masterIsSpectator = masterClient && masterClient.form == 'S';

							// 경고 메시지 전송
							if (masterClient) {
								if (masterIsPractice) {
									masterClient.send('system', { code: 'subJamsu4' });
								} else if (masterIsSpectator) {
									if (others_count >= 2) masterClient.send('system', { code: 'subJamsu3' });
									else masterClient.send('system', { code: 'subJamsu' }); // 1명: 경고만
								} else if (others_count >= 2) {
									masterClient.send('system', { code: 'subJamsu2' });
								} else {
									// 1명만: 게임 불가 상황, 일반 경고
									masterClient.send('system', { code: 'subJamsu' });
								}
							}

							// 비호스트 플레이어들에게 준비 경고 알림
							for (var j in my.players) {
								var pl = my.players[j];
								if (typeof pl !== 'object' && DIC[pl] && DIC[pl].id !== my.master && DIC[pl].ready) {
									DIC[pl].send('system', { code: 'guestJamsu' });
								}
							}

							// 2단계: 조치 전 대기 (10초) - 별도 변수로 관리하여 경쟁 조건 방지
							if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
							my._jst_stage2 = setTimeout(function () {
								try {
									delete my._jst_stage2;
									// 좀비 타이머 방지: 방이 이미 삭제되었는지 확인
									if (!ROOM[my.id]) return;
									if (my.gaming) return;

									// Phantom Player Cleanup
									var i, p;
									for (i = my.players.length - 1; i >= 0; i--) {
										p = my.players[i];
										if (typeof p !== 'object') {
											if (!DIC[p] || DIC[p].place != my.id) {
												my.players.splice(i, 1);
											}
										}
									}
									if (my.players.length == 0) {
										if (my._adt) { clearTimeout(my._adt); delete my._adt; }
										delete ROOM[my.id];
										if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: my.id } });
										return;
									}

									// 타이머 만료 시 재검사
									var hc = 0, bc = 0, wh = 0, ar = true;
									for (var j in my.players) {
										var p = my.players[j];
										if (p.robot) bc++;
										else if (DIC[p]) {
											hc++;
											if (DIC[p].id !== my.master) {
												wh++;
												if (!DIC[p].ready) ar = false;
											}
										}
									}

									// 조건 재확인 및 조치 실행
									if (wh > 0 && ar) {
										var others_count = wh + bc;
										var masterClient = DIC[my.master];
										var masterIsPlayer = masterClient && masterClient.form == 'J';
										var masterIsPractice = masterClient && masterClient.subPlace;
										var masterIsSpectator = masterClient && masterClient.form == 'S';

										if (masterIsPractice) {
											// 방장이 연습 중인 경우: 1명 이상이면 시작
											if (masterClient && others_count >= 1) {
												masterClient.leave(); // 연습 종료
												masterClient.form = 'J';
												masterClient.ready = false;
												my.export();
												setTimeout(function () {
													if (my.gaming) return;
													if (!ROOM[my.id]) return;
													my.ready();
												}, 1000);
											}
										} else if (masterIsPlayer) {
											// 방장이 플레이어: 2명 이상이면 관전 전환 후 시작
											if (others_count >= 2) {
												if (masterClient) {
													masterClient.ready = false;
													masterClient.setForm("S");
													my.export();
													setTimeout(function () {
														if (my.gaming) return;
														if (!ROOM[my.id]) return;
														my.ready();
													}, 500);
												}
											}
										} else if (masterIsSpectator) {
											// 방장이 관전: 2명 이상이면 시작
											if (others_count >= 2) {
												setTimeout(function () {
													if (my.gaming) return;
													if (!ROOM[my.id]) return;
													my.ready();
												}, 500);
											}
										}
									}
								} catch (err) {
									JLog.error(`checkJamsu Action error in room ${my.id}: ${err.toString()}`);
									if (my._jst_stage2) {
										clearTimeout(my._jst_stage2);
										delete my._jst_stage2;
									}
								}
							}, Const.JAMSU_DELAY_ACTION);

						}
					} catch (err) {
						JLog.error(`checkJamsu Warn error in room ${my.id}: ${err.toString()}`);
						if (my._jst) {
							clearTimeout(my._jst);
							delete my._jst;
						}
					}
				}, Const.JAMSU_DELAY_WARN);
			}
		} else {
			if (my._jst) {
				clearTimeout(my._jst);
				delete my._jst;
			}
			if (my._jst_stage2) {
				clearTimeout(my._jst_stage2);
				delete my._jst_stage2;
			}
		}
	};

	my.getData = function () {
		var i, readies = {};
		var pls = [];
		var seq = my.game.seq ? my.game.seq.map(filterRobot) : [];
		var o;

		for (i in my.players) {
			if (o = DIC[my.players[i]]) {
				readies[my.players[i]] = {
					r: o.ready || o.game.ready,
					f: o.form || o.game.form,
					t: o.team || o.game.team
				};
			}
			pls.push(filterRobot(my.players[i]));
		}
		return {
			id: my.id,
			channel: my.channel,
			title: my.title,
			password: my.password ? true : false,
			limit: my.limit,
			mode: my.mode,
			round: my.round,
			time: my.time,
			master: my.master,
			players: pls,
			readies: readies,
			gaming: my.gaming,
			game: {
				round: my.game.round,
				turn: my.game.turn,
				seq: seq,
				title: my.game.title,
				mission: my.game.mission
			},
			practice: my.practice ? true : false,
			opts: my.opts
		};
	};
	my.addAI = function (caller) {
		if (my.players.length >= my.limit) {
			return caller.sendError(429);
		}
		if (my.gaming) {
			return caller.send('error', { code: 416, target: my.id });
		}
		if (!my.rule.ai) {
			return caller.sendError(415);
		}

		function pushRobot(robot) {
			my.players.push(robot);
			my.export();
			my.checkJamsu();
		}

		// 95% chance to use a custom bot name from the dictionary
		if (Math.random() < 0.95) {
			if (Math.random() < 0.5) {
				// Logic 1: Single word 2~7 chars - USE CACHE
				var name = aiNameCacheSingle.pop();
				if (name) {
					// 캐시에서 가져옴
					pushRobot(new exports.Robot(null, my.id, 2, name));
					// 캐시 부족 시 백그라운드 리필
					if (aiNameCacheSingle.length < AI_NAME_CACHE_THRESHOLD) {
						refillAiNameCache();
					}
				} else {
					// 캐시 비어있음 - DB에서 조회
					var q = "SELECT _id FROM kkutu_ko WHERE LENGTH(_id) BETWEEN 2 AND 7 OFFSET floor(random() * 1200000) LIMIT 1";
					DB.kkutu['ko'].direct(q, function (err, res) {
						if (my.players.length >= my.limit) return;
						var dbName;

						if (!err && res && res.rows && res.rows.length > 0) {
							dbName = res.rows[0]._id;
						}

						pushRobot(new exports.Robot(null, my.id, 2, dbName));
						// 리필 트리거
						refillAiNameCache();
					});
				}
			} else {
				// Logic 2: Two words, combined length max 7 - USE CACHE
				var w1 = aiNameCacheFirst.pop();
				if (w1) {
					// 첫 번째 단어 캐시에서 가져옴
					var rem = 7 - w1.length;
					// 두 번째 단어도 캐시에서 가져옴 (길이 체크)
					var w2 = null;
					for (var i = aiNameCacheSecond.length - 1; i >= 0; i--) {
						if (aiNameCacheSecond[i].length <= rem) {
							w2 = aiNameCacheSecond.splice(i, 1)[0];
							break;
						}
					}
					var combinedName = w1 + (w2 || '');
					pushRobot(new exports.Robot(null, my.id, 2, combinedName));
					// 캐시 부족 시 백그라운드 리필
					if (aiNameCacheFirst.length < AI_NAME_CACHE_THRESHOLD || aiNameCacheSecond.length < AI_NAME_CACHE_THRESHOLD) {
						refillAiNameCache();
					}
				} else {
					// 캐시 비어있음 - DB에서 조회
					var q1 = "SELECT _id FROM kkutu_ko WHERE LENGTH(_id) BETWEEN 2 AND 5 OFFSET floor(random() * 1200000) LIMIT 1";
					DB.kkutu['ko'].direct(q1, function (err, res) {
						if (my.players.length >= my.limit) return;

						if (err || !res || !res.rows || res.rows.length === 0) {
							pushRobot(new exports.Robot(null, my.id, 2));
							refillAiNameCache();
							return;
						}

						var dbW1 = res.rows[0]._id;
						var dbRem = 7 - dbW1.length;

						var q2 = `SELECT _id FROM kkutu_ko WHERE LENGTH(_id) BETWEEN 2 AND ${dbRem} OFFSET floor(random() * 1200000) LIMIT 1`;
						DB.kkutu['ko'].direct(q2, function (err2, res2) {
							if (my.players.length >= my.limit) return;

							var dbName = dbW1;
							if (!err2 && res2 && res2.rows && res2.rows.length > 0) {
								dbName += res2.rows[0]._id;
							}

							pushRobot(new exports.Robot(null, my.id, 2, dbName));
							refillAiNameCache();
						});
					});
				}
			}
		} else {
			pushRobot(new exports.Robot(null, my.id, 2));
		}
	};

	my.setAI = function (target, level, team, personality, preferredChar, mute, canRageQuit, fastMode) {
		var i;

		for (i in my.players) {
			if (!my.players[i]) continue;
			if (!my.players[i].robot) continue;
			if (my.players[i].id == target) {
				my.players[i].setLevel(level);
				my.players[i].setTeam(team);
				if (!my.players[i].data) my.players[i].data = {};
				my.players[i].personality = personality;
				my.players[i].preferredChar = preferredChar;
				my.players[i].mute = !!mute;
				my.players[i].canRageQuit = !!canRageQuit;
				my.players[i].fastMode = !!fastMode;
				my.players[i].data.personality = personality;
				my.players[i].data.preferredChar = preferredChar;
				my.players[i].data.mute = !!mute;
				my.players[i].data.canRageQuit = !!canRageQuit;
				my.players[i].data.fastMode = !!fastMode;
				my.export();
				// Discord: 봇 설정 변경 로그
				if (Cluster.isWorker) {
					process.send({
						type: "bot-settings",
						roomId: my.id,
						botInfo: {
							name: my.players[i].profile ? my.players[i].profile.title : target,
							level: level,
							personality: personality,
							preferredChar: preferredChar
						}
					});
				}
				return true;
			}
		}
		return false;
	};
	my.removeAI = function (target, noEx) {
		var j;

		// Fix: 역순 for 루프 사용 (splice 시 인덱스 문제 방지)
		for (var i = my.players.length - 1; i >= 0; i--) {
			if (!my.players[i]) continue;
			if (!my.players[i].robot) continue;
			if (!target || my.players[i].id == target) {
				var removedBot = my.players[i];
				if (my.gaming) {
					j = my.game.seq.indexOf(removedBot);
					if (j != -1) my.game.seq.splice(j, 1);
				}
				my.players.splice(i, 1);
				if (!noEx) {
					my.export();
					my.checkJamsu();
				}
				return true;
			}
		}
		return false;
	};
	my.come = function (client) {
		if (!my.practice) client.place = my.id;

		if (my.players.push(client.id) == 1) {
			my.master = client.id;
		}

		// 버그 수정: 새 플레이어 입장 시 잠수 타이머 리셋
		if (!my.practice && !my.gaming) {
			if (my._adt) { clearTimeout(my._adt); delete my._adt; }
			if (my._jst) { clearTimeout(my._jst); delete my._jst; }
			if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
			my.setAutoDelete();
		}

		if (Cluster.isWorker) {
			client.ready = false;
			client.team = 0;
			client.cameWhenGaming = false;
			client.form = "J";

			if (!my.practice) {
				process.send({ type: "room-come", target: client.id, id: my.id });
				// Discord: 방 입장 로그
				process.send({
					type: "room-join",
					roomId: my.id,
					name: (client.profile && (client.profile.title || client.profile.name)) || client.id,
					isRobot: false
				});
			}
			my.export(client.id);
		}
	};
	my.spectate = function (client, password) {
		if (!my.practice) client.place = my.id;
		var len = my.players.push(client.id);

		// 버그 수정: 관전자 입장 시에도 잠수 타이머 리셋
		if (!my.practice && !my.gaming) {
			if (my._adt) { clearTimeout(my._adt); delete my._adt; }
			if (my._jst) { clearTimeout(my._jst); delete my._jst; }
			if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
			my.setAutoDelete();
		}

		if (Cluster.isWorker) {
			client.ready = false;
			client.team = 0;
			client.cameWhenGaming = true;
			client.form = (len > my.limit) ? "O" : "S";

			process.send({ type: "room-spectate", target: client.id, id: my.id, pw: password });
			// Discord: 방 입장 로그 (관전자)
			process.send({
				type: "room-join",
				roomId: my.id,
				name: (client.profile && (client.profile.title || client.profile.name)) || client.id,
				isRobot: false
			});
			my.export(client.id, false, true);
		}
	};
	my.go = function (client, kickVote) {
		// Fix: 방이 이미 삭제되었는지 확인 (재귀 호출 방지)
		// 주의: 연습방(practice)은 ROOM[]에 저장되지 않으므로 이 체크를 스킵
		if (!my.practice && !ROOM[my.id]) {
			JLog.warn(`Room.go: Room ${my.id} already deleted, skipping for client ${client.id}`);
			client.place = 0;
			if (Cluster.isWorker) {
				client.socket.close();
			}
			return;
		}

		var x = my.players.indexOf(client.id);
		var me;

		// 문제 3: 플레이어가 players 배열에 없는 경우 처리 개선
		if (x == -1) {
			JLog.warn(`Room.go: Client ${client.id} not found in room ${my.id} players array`);
			client.place = 0;
			// 방에 플레이어가 아무도 없으면 방 삭제
			if (my.players.length < 1) {
				JLog.info(`Room ${my.id} has no players, deleting room`);
				if (my._adt) { clearTimeout(my._adt); delete my._adt; }
				if (my._jst) { clearTimeout(my._jst); delete my._jst; }
				if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
				delete ROOM[my.id];
				if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: my.id } });
			}
			return client.sendError(409);
		}
		my.players.splice(x, 1);
		client.game = {};
		if (client.id == my.master) {
			while (my.removeAI(false, true));
			my.master = my.players[0];
		}
		// ========== Cross-Channel 버그 수정: 마스터 검증 강화 ==========
		var validMaster = false;
		var newMaster = null;

		// 1단계: DIC에 마스터가 있는지 확인
		if (my.master && DIC[my.master]) {
			validMaster = true;
		}

		// 2단계: DIC에 없으면 players에서 확인 (Cross-Channel 가능성)
		if (!validMaster && my.players.length > 0) {
			// 2-1: players에 마스터가 있는지 확인
			var masterInPlayers = false;
			for (var i = 0; i < my.players.length; i++) {
				if (my.players[i] === my.master) {
					masterInPlayers = true;
					break;
				}
			}

			if (masterInPlayers) {
				// Cross-Channel 마스터로 간주 (다른 채널에 있지만 방 유지)
				validMaster = true;
				JLog.warn(`Room ${my.id}: Master ${my.master} not in DIC but in players (cross-channel?)`);
			} else {
				// 2-2: players에도 없으면 새 마스터 찾기
				for (var j = 0; j < my.players.length; j++) {
					var p = my.players[j];
					// 봇이 아니고 DIC에 있는 플레이어만 마스터 후보
					if (typeof p !== 'object' && DIC[p]) {
						newMaster = p;
						break;
					}
				}
			}
		}

		// 3단계: 새 마스터로 재할당
		if (!validMaster && newMaster) {
			my.master = newMaster;
			validMaster = true;
			DIC[newMaster].ready = false;
			JLog.info(`Room ${my.id}: Master reassigned from ${client.id} to ${newMaster}`);
		}

		// 4단계: validMaster에 따라 분기
		if (validMaster) {
			// ========== 정상 처리 로직 ==========
			if (DIC[my.master]) {
				DIC[my.master].ready = false;
			}

			// 플레이어 퇴장 후 상태 확인
			if (!my.gaming) {
				var canPlay = my.players.some(function (p) {
					if (typeof p === 'object' && p.robot) return true;
					var client = DIC[p];
					return client && client.form === 'J';
				});

				// 관전자만 남은 경우: 방 즉시 삭제하지 않고 타이머 재시작
				if (!canPlay && my.players.length > 0) {
					JLog.info(`Room ${my.id}: Only spectators remain, starting auto-delete timer`);
					// 잠수 타이머 정리 후 재시작
					if (my._jst) { clearTimeout(my._jst); delete my._jst; }
					if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
					my.setAutoDelete();
				}
			}

			// 게임 중이면 게임 로직 처리
			if (my.gaming) {
				// onLeave 함수가 게임 모드에 존재할 때만 호출 (picture.js 등에서만 정의됨)
				if (Rule[my.rule.rule] && Rule[my.rule.rule].onLeave) {
					my.route("onLeave", client.id);
				}

				var seqIndex = my.game.seq.indexOf(client.id);
				if (seqIndex != -1) {
					// 서바이벌 모드: 중도 퇴장 시 KO 처리 (seq에서 제거하지 않음)
					if (my.opts.survival) {
						// 퇴장하는 플레이어 KO 처리
						var leavingPlayer = my.game.seq[seqIndex];
						var pObj = DIC[leavingPlayer] || leavingPlayer;
						if (pObj && pObj.game) {
							pObj.game.alive = false;
							pObj.game.score = 0;
						}

						// 클라이언트에게 KO 알림
						my.byMaster('survivalKO', {
							target: client.id,
							reason: 'leave'
						}, true);

						// 현재 턴인 경우 다음 턴으로 진행
						var isTurn = my.game.turn == seqIndex;
						if (isTurn && my.rule.ewq) {
							clearTimeout(my.game._rrt);
							my.game.loading = false;
						}

						// 남은 생존자 체크
						var aliveCount = 0;
						var aliveTeams = new Set();
						var individualCount = 0;

						for (var si in my.game.seq) {
							var sp = DIC[my.game.seq[si]] || my.game.seq[si];
							if (sp && sp.game && sp.game.alive) {
								aliveCount++;
								var team = sp.robot ? sp.game.team : sp.team;
								// team이 1~4이면 팀전, 0이거나 undefined/null이면 개인전
								if (team && team >= 1 && team <= 4) {
									aliveTeams.add(team);
								} else {
									individualCount++;
								}
							}
						}

						// 게임 종료 조건: 팀 + 개인전 합쳐서 1개체만 남을 때
						var totalEntities = aliveTeams.size + individualCount;
						var gameOver = totalEntities <= 1;
						if (gameOver) {
							clearTimeout(my.game._rrt);
							my.game._rrt = setTimeout(function () {
								my.roundEnd();
							}, 2000);
						} else if (isTurn) {
							// 다음 턴으로 진행
							clearTimeout(my.game._rrt);
							my.game._rrt = setTimeout(function () {
								my.turnNext();
							}, 2000);
						}
					} else {
						// 비서바이벌 모드: 기존 로직
						if (my.game.seq.length <= 2) {
							my.game.seq.splice(seqIndex, 1);
							my.roundEnd();
						} else {
							var isTurn = my.game.turn == seqIndex;
							if (isTurn && my.rule.ewq) {
								clearTimeout(my.game._rrt);
								my.game.loading = false;
								if (Cluster.isWorker) my.turnEnd();
							}
							my.game.seq.splice(seqIndex, 1);

							// 랜덤 턴 모드: 배열 재생성
							if (my.opts.randomturn) {
								my.game.randomTurnOrder = [];
								my.game.randomTurnIndex = 0;

								for (var rt = 0; rt < my.game.seq.length * 2; rt++) {
									my.game.randomTurnOrder.push(rt % my.game.seq.length);
								}

								my.game.randomTurnOrder = shuffle(my.game.randomTurnOrder);
								my.game.turn = my.game.randomTurnOrder[0];
							} else {
								if (my.game.turn > seqIndex) {
									my.game.turn--;
									if (my.game.turn < 0) my.game.turn = my.game.seq.length - 1;
								}
								if (my.game.turn >= my.game.seq.length) my.game.turn = 0;
							}
						}
					}
				}

				if (my.gaming && my.game.seq.length < 2) my.roundEnd();
			}

		} else {
			// ========== 방 삭제 로직 ==========
			JLog.warn(`Room ${my.id}: No valid master found, deleting room`);

			if (my.gaming) {
				my.interrupt();
				my.game.late = true;
				my.gaming = false;
				my.game = {};
			}

			var roomId = my.id;
			var remainingPlayers = my.players.slice();

			// 타이머 정리 및 방 먼저 삭제 (재귀 호출 방지)
			if (my._adt) { clearTimeout(my._adt); delete my._adt; }
			if (my._jst) { clearTimeout(my._jst); delete my._jst; }
			if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
			delete ROOM[roomId];

			if (Cluster.isWorker) {
				process.send({ type: "room-invalid", room: { id: roomId } });
			}

			// 남은 플레이어가 있다면 강제 퇴장 (leave() 대신 직접 처리)
			if (remainingPlayers.length > 0) {
				JLog.warn(`Room ${roomId} deleting without master. Kicking ${remainingPlayers.length} remaining players.`);
				remainingPlayers.forEach(function (p) {
					if (typeof p !== 'object' && DIC[p]) {
						DIC[p].sendError(471);
						DIC[p].place = 0;
						if (Cluster.isWorker) {
							DIC[p].socket.close();
							process.send({ type: "room-go", target: p, id: roomId, removed: true });
						}
					}
				});
			}
		}
		// ========== 수정 구간 종료 ==========
		if (my.practice) {
			clearTimeout(my.game.turnTimer);
			client.subPlace = 0;
		} else client.place = 0;

		if (Cluster.isWorker) {
			if (!my.practice) {
				// Discord: 방 퇴장 로그
				process.send({
					type: "room-leave",
					roomId: my.id,
					name: (client.profile && (client.profile.title || client.profile.name)) || client.id,
					isRobot: false
				});
				client.socket.close();
				process.send({ type: "room-go", target: client.id, id: my.id, removed: !ROOM.hasOwnProperty(my.id) });
			}
			my.export(client.id, kickVote);
		} else if (Cluster.isMaster && !my.practice) {
			// master에서 소켓이 끊겨 Room.go가 실행된 경우, slave에게도 퇴장 알림
			if (CHAN[my.channel]) {
				CHAN[my.channel].send({ type: "room-go", target: client.id, id: my.id, removed: !ROOM.hasOwnProperty(my.id) });
			}
		}
	};
	my.set = function (room) {
		var i, k, ijc, ij;

		my.title = room.title;
		my.password = room.password;
		my.limit = Math.max(Math.min(12, my.players.length), Math.round(room.limit));
		my.mode = room.mode;
		my.rule = Const.getRule(room.mode);
		my.round = Math.round(room.round);
		my.time = room.time * my.rule.time;
		// 연습방 플래그 설정
		if (room.practice) my.practice = true;
		if (room.opts && my.opts) {
			for (i in Const.OPTIONS) {
				k = Const.OPTIONS[i].name.toLowerCase();
				my.opts[k] = room.opts[k] && my.rule.opts.includes(i);
			}
			if (ijc = my.rule.opts.includes("ijp")) {
				ij = Const[`${my.rule.lang.toUpperCase()}_IJP`];
				my.opts.injpick = (room.opts.injpick || []).filter(function (item) { return ij.includes(item); });
			} else my.opts.injpick = [];
			if (my.rule.opts.includes("qij")) {
				my.opts.quizpick = room.opts.quizpick || [];
			} else my.opts.quizpick = [];
			// 서바이벌 HP 옵션 처리
			if (room.opts.surHP) {
				my.opts.surHP = room.opts.surHP;
			}
		}
		// APL (Bad Apple) 옵션 체크: opts 복사 후에 수행
		if (my.opts && my.opts.apple) {
			my.round = 1;
			my.time = 220;
			my.opts.big = true;
		}
		if (!my.rule.ai) {
			while (my.removeAI(false, true));
		}
		for (i in my.players) {
			if (DIC[my.players[i]]) DIC[my.players[i]].ready = false;
		}
	};
	my.preReady = function (teams) {
		var i, j, t = 0, l = 0;
		var avTeam = [];

		// 팀 검사
		if (teams) {
			if (teams[0].length) {
				// if (teams[1].length > 1 || teams[2].length > 1 || teams[3].length > 1 || teams[4].length > 1) return 418;
			} else {
				for (i = 1; i < 5; i++) {
					if (j = teams[i].length) {
						if (t) {
							// if (t != j) return 418;
						} else t = j;
						l++;
						avTeam.push(i);
					}
				}
				if (l < 2) return 418;
				my._avTeam = shuffle(avTeam);
			}
		}
		// 인정픽 검사
		if (!my.rule) return 400;
		if (my.rule.opts.includes("ijp")) {
			if (!my.opts.injpick) return 400;
			if (!my.opts.injpick.length) return 413;
			if (!my.opts.injpick.every(function (item) {
				return !Const.IJP_EXCEPT.includes(item);
			})) return 414;
		}
		// 퀴즈픽 검사
		if (my.rule.opts.includes("qij")) {
			if (!my.opts.quizpick) return 400;
			if (!my.opts.quizpick.length) return 413;
		}
		return false;
	};
	my.ready = function () {
		var i, all = true;
		var len = 0;
		var teams = [[], [], [], [], []];

		for (i in my.players) {
			if (my.players[i].robot) {
				len++;
				teams[my.players[i].game.team].push(my.players[i]);
				continue;
			}
			if (!DIC[my.players[i]]) continue;
			if (DIC[my.players[i]].form == "S") continue;

			len++;
			teams[DIC[my.players[i]].team].push(my.players[i]);

			if (my.players[i] == my.master) continue;
			if (!DIC[my.players[i]].ready) {
				all = false;
				break;
			}
		}
		if (!DIC[my.master]) return;
		if (len < 2) return DIC[my.master].sendError(411);
		if (i = my.preReady(teams)) return DIC[my.master].sendError(i);
		if (all) {
			my._teams = teams;
			my.start();
		} else DIC[my.master].sendError(412);
	};
	my.start = function (pracLevel, personality, preferredChar, pracMute, pracCanRageQuit, pracFastMode) {
		if (my._adt) { clearTimeout(my._adt); delete my._adt; }
		if (my._jst) { clearTimeout(my._jst); delete my._jst; }
		if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
		var i, j, o, hum = 0;
		var now = (new Date()).getTime();

		my.gaming = true;
		//my.kicked = []; //클로드가 추가한 코드인데 얘는 한번 강퇴되면 다시 못들어오는 걸 이해못하나봄

		// Discord notification for game start
		if (Cluster.isWorker) {
			process.send({ type: "game-start", room: my.id });
		}

		my.game = {};
		my.game.late = true;
		my.game.round = 0;
		my.game.turn = 0;
		my.game.seq = [];
		my.game.robots = [];
		if (my.practice) {
			my.game.robots.push(o = new exports.Robot(my.master, my.id, pracLevel, null, personality, preferredChar));
			o.mute = !!pracMute;
			o.canRageQuit = !!pracCanRageQuit;
			o.fastMode = !!pracFastMode;
			o.data.mute = o.mute;
			o.data.canRageQuit = o.canRageQuit;
			o.data.fastMode = o.fastMode;
			my.game.seq.push(o, my.master);
		} else {
			for (i in my.players) {
				if (my.players[i].robot) {
					my.game.robots.push(my.players[i]);
					// Ensure bot game state is reset for new game
					my.players[i].game = { score: 0, bonus: 0, team: my.players[i].game ? my.players[i].game.team : 0 };
				} else {
					if (!(o = DIC[my.players[i]])) continue;
					if (o.form != "J") continue;
					hum++;
				}
				if (my.players[i]) my.game.seq.push(my.players[i]);
			}
			// Check if we have any teams (1~4)
			var hasTeams = false;
			if (my._teams) {
				for (var k = 1; k <= 4; k++) {
					if (my._teams[k] && my._teams[k].length > 0) {
						hasTeams = true;
						break;
					}
				}
			}

			if (hasTeams && my._teams) {
				// Stride Scheduling for Team Placement
				var allGroups = [];
				var totalPlayers = 0;
				for (var k = 0; k < 5; k++) {
					if (my._teams[k] && my._teams[k].length > 0) {
						allGroups.push({ id: k, count: my._teams[k].length });
						// Shuffle players within the team/pool for random order
						my._teams[k] = shuffle(my._teams[k]);
						totalPlayers += my._teams[k].length;
					}
				}

				// Sort groups by count descending
				allGroups.sort(function (a, b) { return b.count - a.count; });

				// Prepare slots
				var placement = new Array(totalPlayers);
				var available = [];
				for (var i = 0; i < totalPlayers; i++) available.push(i);

				// Place teams
				for (var g = 0; g < allGroups.length; g++) {
					var group = allGroups[g];
					if (group.count === 0) continue;

					var step = available.length / group.count;
					var indicesToTake = [];

					for (var i = 0; i < group.count; i++) {
						var targetIdx = Math.floor(i * step);
						// Safety check
						if (targetIdx >= available.length) targetIdx = available.length - 1;

						var realIdx = available[targetIdx];
						placement[realIdx] = group.id;
						indicesToTake.push(realIdx);
					}

					// Remove used indices from available
					available = available.filter(function (val) { return indicesToTake.indexOf(val) === -1; });
				}

				// Fill game sequence
				my.game.seq = [];
				for (var i = 0; i < totalPlayers; i++) {
					var tid = placement[i];
					// Fallback if null (shouldn't happen)
					if (tid === undefined || tid === null) {
						// Find any remaining
						for (var k = 0; k < 5; k++) {
							if (my._teams[k] && my._teams[k].length > 0) {
								tid = k;
								break;
							}
						}
					}

					if (tid !== undefined && my._teams[tid].length > 0) {
						var p = my._teams[tid].shift();
						my.game.seq.push(p);
					}
				}
				// Fix: 누락된 봇 추가 (비동기로 늦게 추가되었거나 team 0인 봇)
				for (var bi = 0; bi < my.players.length; bi++) {
					var bot = my.players[bi];
					if (bot && bot.robot && my.game.seq.indexOf(bot) === -1) {
						my.game.seq.push(bot);
					}
				}
			} else {
				my.game.seq = shuffle(my.game.seq);
			}
		}
		my.game.mission = null;

		// 랜덤 턴 옵션 활성화 시 턴 순서 배열 초기화
		if (my.opts.randomturn) {
			my.game.randomTurnOrder = [];
			my.game.randomTurnIndex = 0;

			// 플레이어 인덱스를 2벌 만들기
			for (var rt = 0; rt < my.game.seq.length * 2; rt++) {
				my.game.randomTurnOrder.push(rt % my.game.seq.length);
			}

			// 셔플
			my.game.randomTurnOrder = shuffle(my.game.randomTurnOrder);
		}
		for (i in my.game.seq) {
			o = DIC[my.game.seq[i]] || my.game.seq[i];
			if (!o) continue;
			if (!o.game) continue;

			o.playAt = now;
			o.ready = false;
			// 서바이벌 모드: 점수 대신 체력으로 초기화
			if (my.opts.survival) {
				var survivalHP = my.opts.surHP || 500;
				o.game.score = survivalHP;
				o.game.alive = true;  // 생존 상태
				o.game.survivalSubmitted = false;  // 단어 입력 여부 추적
			} else {
				o.game.score = 0;
			}
			o.game.bonus = 0;
			o.game.item = [/*0, 0, 0, 0, 0, 0*/];
			o.game.wpc = [];
			delete o.game.lastWord;
			delete o.game.lastWordLen;
			o.game.straightStreak = 0;
		}
		// 서바이벌 모드는 1라운드만 진행
		if (my.opts.survival) {
			my.round = 1;
			my.game.maxRound = 1;
		}
		my.game.hum = hum;
		my.getTitle().then(function (title) {
			my.game.title = title;
			my.export(null, null, true);  // spec=true로 점수 정보 포함 (서바이벌 HP 등)
			setTimeout(my.roundReady, 2000);
		});
		my.byMaster('starting', { target: my.id });
		delete my._avTeam;
		delete my._teams;
	};
	my.roundReady = function () {
		clearTimeout(my.game._rrt);
		if (!my.gaming) return;

		return my.route("roundReady");
	};
	my.interrupt = function () {
		clearTimeout(my.game._rrt);
		clearTimeout(my.game.turnTimer);
		clearTimeout(my.game.hintTimer);
		clearTimeout(my.game.hintTimer2);
		clearTimeout(my.game.qTimer);
		clearTimeout(my.game.robotTimer);

		// 봇별 타이머 정리 (typingTimer, _timerCatch, _timer 등)
		if (my.game.seq) {
			for (var i in my.game.seq) {
				var o = my.game.seq[i];
				if (o && o.robot) {
					if (o.game && o.game.typingTimer) clearTimeout(o.game.typingTimer);
					if (o._timerCatch) clearTimeout(o._timerCatch);
					if (o._timer) clearTimeout(o._timer);
				}
			}
		}
		// robots 배열에서도 타이머 정리 (seq에 없는 봇 포함)
		if (my.game.robots) {
			for (var j in my.game.robots) {
				var r = my.game.robots[j];
				if (r) {
					if (r._timerCatch) clearTimeout(r._timerCatch);
					if (r._timer) clearTimeout(r._timer);
				}
			}
		}
	};
	// Helper: 플레이어/봇 객체에서 표시 이름 추출
	my.getPlayerName = function (target) {
		if (!target) return '?';
		if (target.profile) return target.profile.title || target.profile.name || '?';
		return (typeof target === 'string') ? target : '?';
	};
	my.sendRoundEndNotification = function (round) {
		if (!my.game.chainLog || my.game.chainLog.length === 0) return;
		var r = round || my.game.round || 0;
		var totalRounds = my.round || 0;
		var logCopy = my.game.chainLog.slice();
		if (Cluster.isMaster && DiscordBot) {
			DiscordBot.notifyRoundEnd(my.id, logCopy, r, totalRounds);
		} else if (Cluster.isWorker) {
			process.send({ type: "round-end", room: my.id, chainLog: logCopy, round: r, totalRounds: totalRounds });
		}
	};
	// Helper: 라운드 전환 시 알림 전송 후 chainLog 초기화
	my.resetChain = function () {
		if (my.game.round > 1) my.sendRoundEndNotification(my.game.round - 1);
		my.game.chain = [];
		my.game.chainLog = [];
		// 메모리 누수 방지: 라운드마다 글자 수 캐시 초기화
		delete my.game._charCountCache;
	};
	// Helper: chain에 단어 추가 + chainLog에 플레이어 정보 기록
	my.logChainWord = function (text, client) {
		my.game.chain.push(text);
		if (my.game.chainLog) {
			my.game.chainLog.push({ word: String(text), player: my.getPlayerName(client) });
		}
	};
	// Helper: turnEnd 시 타임아웃/KO를 chainLog에 기록
	my.logChainEvent = function (target, event) {
		if (!my.game.chainLog) my.game.chainLog = [];
		my.game.chainLog.push({ player: my.getPlayerName(target), event: event });
	};
	my.roundEnd = function (data) {
		if (my._roundEnding) return;
		my._roundEnding = true;

		var i, o, rw;
		var res = [];
		var users = {};
		var rl;
		var pv = -1;
		var suv = [];
		var teams = [null, [], [], [], []];
		var sumScore = 0;
		var now = (new Date()).getTime();

		my.interrupt();
		for (i in my.players) {
			o = DIC[my.players[i]];
			if (!o) continue;
			if (o.cameWhenGaming) {
				o.cameWhenGaming = false;
				if (o.form == "O") {
					o.sendError(428);
					o.leave();
					continue;
				}
				o.setForm("J");
			}
		}
		for (i in my.game.seq) {
			o = DIC[my.game.seq[i]] || my.game.seq[i];
			if (!o) continue;
			if (!o.game) continue; // Fix: o.game이 없으면 스킵
			if (o.robot) {
				if (o.game.team) teams[o.game.team].push(o.game.score);
			} else if (o.team) teams[o.team].push(o.game.score);
		}
		for (i = 1; i < 5; i++) if (o = teams[i].length) teams[i] = [o, teams[i].reduce(function (p, item) { return p + item; }, 0)];

		// 1. Calculate Human Count first (for XP calculation)
		var humanCount = 0;
		for (i in my.game.seq) {
			o = DIC[my.game.seq[i]] || my.game.seq[i];
			if (!o) continue;
			if (!o.robot) humanCount++;
		}

		// 2. Build Result List (Including Bots)
		for (i in my.game.seq) {
			o = DIC[my.game.seq[i]] || my.game.seq[i];
			if (!o) continue;
			if (!o.game) continue; // Fix: o.game이 없으면 스킵

			// Fix: null/undefined 점수를 0으로 처리
			var playerScore = (typeof o.game.score === 'number') ? o.game.score : 0;
			sumScore += playerScore;

			var actualTeam = o.robot ? o.game.team : o.team;
			var teamScoreVal = playerScore; // 기본값은 개인 점수
			if (actualTeam && Array.isArray(teams[actualTeam]) && teams[actualTeam].length === 2) {
				teamScoreVal = teams[actualTeam][1];
			}

			res.push({
				id: o.id,
				score: playerScore, // Display Score: Individual
				teamScore: teamScoreVal, // Sorting Score: Team Total
				dim: (actualTeam && Array.isArray(teams[actualTeam]) && teams[actualTeam].length === 2) ? teams[actualTeam][0] : 1,
				robot: o.robot,
				team: actualTeam,
				alive: o.game.alive  // 서바이벌 모드: 생존 상태
			});
		}

		// Sort: 1. Team Score (Desc), 2. Team ID (Group ties), 3. Individual Score (Desc)
		// 서바이벌 모드: alive 상태 기준으로 정렬 (생존자가 위)
		res.sort(function (a, b) {
			// 서바이벌 모드: 생존자가 먼저
			if (my.opts.survival) {
				if (a.alive !== b.alive) return b.alive ? 1 : -1;
			}

			// Ensure scores are numbers to prevent undefined comparison issues
			var aTeamScore = typeof a.teamScore === 'number' ? a.teamScore : 0;
			var bTeamScore = typeof b.teamScore === 'number' ? b.teamScore : 0;
			var aScore = typeof a.score === 'number' ? a.score : 0;
			var bScore = typeof b.score === 'number' ? b.score : 0;

			if (aTeamScore != bTeamScore) return bTeamScore - aTeamScore;
			var tA = a.team || 0;
			var tB = b.team || 0;
			if (tA != tB) return tB - tA;
			return bScore - aScore;
		});
		rl = res.length;


		var currentHumanRank = 0;
		var userRankMap = {};

		for (i in res) {

			var key = res[i].teamScore + "_" + res[i].score;
			if (pv == key) {
				res[i].rank = res[Number(i) - 1].rank;
			} else {
				res[i].rank = Number(i);
			}
			pv = key;
		}


		var humanRes = res.filter(function (r) { return !r.robot; });
		var h_pv = -1;
		for (i in humanRes) {
			// Fix: i가 0일 때 humanRes[-1] 접근 방지
			if (Number(i) > 0 && h_pv == humanRes[i].score) {
				humanRes[i].humanRank = humanRes[Number(i) - 1].humanRank;
			} else {
				humanRes[i].humanRank = Number(i);
			}
			h_pv = humanRes[i].score;
			userRankMap[humanRes[i].id] = humanRes[i].humanRank;
		}

		for (i in res) {

			if (res[i].robot) {
				o = DIC[res[i].id] || my.players.find(function (p) { return p.id == res[i].id; });
				if (o) {
					users[o.id] = o.getData();
				}

				res[i].reward = { score: 0, money: 0 };
				continue;
			}

			o = DIC[res[i].id];
			if (!o) continue; // Should not happen for non-robots
			var myHumanRank = userRankMap[o.id];
			// 서바이벌 모드: 한 번도 단어를 입력하지 않은 플레이어는 0점 처리 (경험치/보상 없음)
			if (my.opts && my.opts.survival && !o.game.survivalSubmitted) {
				rw = { score: 0, money: 0 };
			} else if (my.opts && my.opts.apple) {
				rw = { score: 0, money: 0 };
			} else {
				rw = getRewards(my.mode, o.game.score / res[i].dim, o.game.bonus, myHumanRank, humanCount, sumScore);
			}

			rw.playTime = now - o.playAt;
			o.applyEquipOptions(rw); // 착용 아이템 보너스 적용
			if (my.opts.unknown) {
				if (rw.score > 100) rw.score = 100;
				if (rw.money > 10) rw.money = 10;
			}
			if (rw.together) {
				if (o.game.wpc) o.game.wpc.forEach(function (item) { o.obtain("$WPC" + item, 1); }); // 글자 조각 획득 처리
				o.onOKG(rw.playTime);
			}
			res[i].reward = rw;
			o.data.score += rw.score || 0;
			o.money += rw.money || 0;
			o.data.record[Const.GAME_TYPE[my.mode]][2] += rw.score || 0;
			o.data.record[Const.GAME_TYPE[my.mode]][3] += rw.playTime;
			if (!my.practice && rw.together) {
				o.data.record[Const.GAME_TYPE[my.mode]][0]++;
				if (res[i].rank == 0) o.data.record[Const.GAME_TYPE[my.mode]][1]++;
			}
			users[o.id] = o.getData();

			suv.push(o.flush(true));
		}
		Lizard.all(suv).then(function (uds) {
			var o = {};

			suv = [];
			for (i in uds) {
				o[uds[i].id] = { prev: uds[i].prev };
				suv.push(DB.redis.getSurround(uds[i].id));
			}
			Lizard.all(suv).then(function (ranks) {
				var i, j;

				for (i in ranks) {
					if (!o[ranks[i].target]) continue;

					o[ranks[i].target].list = ranks[i].data;
				}
				my.byMaster('roundEnd', { result: res, users: users, ranks: o, data: data }, true);
			});
		});
		my.gaming = false;
		my._roundEnding = false;
		my.checkJamsu();
		my.export();
		// Discord notification for last round end (game over)
		my.sendRoundEndNotification();
		// Discord notification for game over with score rankings
		{
			var rankings = res.map(function (r) {
				var p = DIC[r.id] || (my.players && my.players.find ? my.players.find(function (pl) { return pl && pl.id === r.id; }) : null);
				var name = (p && p.profile) ? (p.profile.title || p.profile.name) : r.id;
				return { name: name, score: r.score, rank: r.rank, robot: r.robot };
			});
			if (Cluster.isMaster && DiscordBot) {
				DiscordBot.notifyGameOver(my.id, rankings);
			} else if (Cluster.isWorker) {
				process.send({ type: "game-over", room: my.id, rankings: rankings });
			}
		}
		// 게임 종료 시 봇 분노 수치 절반으로 감소
		if (my.game.robots) {
			for (i in my.game.robots) {
				o = my.game.robots[i];
				if (o && o.robot) {
					o.anger /= 2;
					o.data.anger = o.anger;
				}
			}
		}
		// 메모리 누수 방지: 게임 종료 시 모든 게임 상태 정리
		delete my.game.seq;
		delete my.game.wordLength;
		delete my.game.dic;
		delete my.game.chain;
		delete my.game.chainLog;
		delete my.game.robots;
		delete my.game.randomTurnOrder;
		delete my.game.randomTurnIndex;
		delete my.game._charCountCache;
		delete my.game.mission;
		delete my.game.title;
		// 게임 모드별 상태 정리
		delete my.game.theme;
		delete my.game.conso;
		delete my.game.prisoners;
		delete my.game.boards;
		delete my.game.means;
		my.setAutoDelete();
	};
	my.byMaster = function (type, data, nob) {
		if (DIC[my.master]) DIC[my.master].publish(type, data, nob);
	};
	my.export = function (target, kickVote, spec) {
		var obj = { room: my.getData() };
		var i, o;

		if (!my.rule) return;
		if (target) obj.target = target;
		if (kickVote) obj.kickVote = kickVote;
		if (spec && my.gaming) {
			if (my.rule.rule == "Classic") {
				if (my.game.chain) obj.chain = my.game.chain.length;
			} else if (my.rule.rule == "Jaqwi") {
				obj.theme = my.game.theme;
				obj.conso = my.game.conso;
			} else if (my.rule.rule == "Crossword") {
				obj.prisoners = my.game.prisoners;
				obj.boards = my.game.boards;
				obj.means = my.game.means;
			}
			obj.spec = {};
			for (i in my.game.seq) {
				// Fix: 봇도 포함하도록 수정
				o = DIC[my.game.seq[i]] || my.game.seq[i];
				if (o && o.id) {
					obj.spec[o.id] = o.game ? o.game.score : 0;
				}
			}
		}
		if (my.practice) {
			if (DIC[my.master || target]) DIC[my.master || target].send('room', obj);
		} else {
			exports.publish('room', obj, my.password);
		}
	};
	my.turnStart = function (force) {
		if (!my.gaming) return;

		return my.route("turnStart", force);
	};
	my.readyRobot = function (robot) {
		if (!my.gaming) return;

		return my.route("readyRobot", robot);
	};
	my.turnRobot = function (robot, text, data) {
		if (!my.gaming) return;

		my.submit(robot, text, data);
		//return my.route("turnRobot", robot, text);
	};
	my.turnNext = function (force) {
		if (!my.gaming) return;
		if (!my.game.seq) return;

		// 서바이벌 모드: 생존자 확인 및 게임 종료 체크
		if (my.opts.survival) {
			var aliveCount = 0;
			var aliveTeams = new Set();
			var individualCount = 0;

			for (var i in my.game.seq) {
				var p = DIC[my.game.seq[i]] || my.game.seq[i];
				if (p && p.game && p.game.alive) {
					aliveCount++;
					var team = p.robot ? p.game.team : p.team;
					// team이 1~4이면 팀전, 0이거나 undefined/null이면 개인전
					if (team && team >= 1 && team <= 4) {
						aliveTeams.add(team);
					} else {
						individualCount++;
					}
				}
			}

			// 게임 종료 조건: 팀 + 개인전 합쳐서 1개체만 남을 때
			// (예: 팀1만 남음 / 개인1명만 남음 / 아무도 없음)
			var totalEntities = aliveTeams.size + individualCount;
			var gameOver = totalEntities <= 1;
			if (gameOver) {
				my.roundEnd();
				return;
			}
		}

		// 랜덤 턴 옵션 체크
		if (my.opts.randomturn) {
			// 랜덤 턴 배열 인덱스 증가
			my.game.randomTurnIndex++;

			// 배열 끝에 도달하면 재셔플
			if (my.game.randomTurnIndex >= my.game.randomTurnOrder.length) {
				my.game.randomTurnIndex = 0;

				// 플레이어 인덱스를 2벌 만들기 (서바이벌: 살아있는 플레이어만)
				my.game.randomTurnOrder = [];
				for (var rt = 0; rt < my.game.seq.length; rt++) {
					if (my.opts.survival) {
						var rp = DIC[my.game.seq[rt]] || my.game.seq[rt];
						if (rp && rp.game && rp.game.alive) {
							my.game.randomTurnOrder.push(rt);
							my.game.randomTurnOrder.push(rt);  // 2벌
						}
					} else {
						my.game.randomTurnOrder.push(rt);
						my.game.randomTurnOrder.push(rt);  // 2벌
					}
				}

				// 재셔플
				my.game.randomTurnOrder = shuffle(my.game.randomTurnOrder);
			}

			// 랜덤 턴 배열에서 다음 플레이어 선택
			my.game.turn = my.game.randomTurnOrder[my.game.randomTurnIndex];

			// 서바이벌 모드: 선택된 플레이어가 KO된 경우 다시 선택
			if (my.opts.survival) {
				var attempts = 0;
				var maxAttempts = my.game.seq.length * 2;
				while (attempts < maxAttempts) {
					var nextPlayer = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
					if (nextPlayer && nextPlayer.game && nextPlayer.game.alive) {
						break;
					}
					my.game.randomTurnIndex++;
					if (my.game.randomTurnIndex >= my.game.randomTurnOrder.length) {
						my.game.randomTurnIndex = 0;
					}
					my.game.turn = my.game.randomTurnOrder[my.game.randomTurnIndex];
					attempts++;
				}
			}
		} else {
			// 기존 로직: 순차 진행
			my.game.turn = (my.game.turn + 1) % my.game.seq.length;

			// 서바이벌 모드: KO된 플레이어 건너뛰기
			if (my.opts.survival) {
				var attempts = 0;
				var maxAttempts = my.game.seq.length;
				while (attempts < maxAttempts) {
					var nextPlayer = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
					if (nextPlayer && nextPlayer.game && nextPlayer.game.alive) {
						break;
					}
					my.game.turn = (my.game.turn + 1) % my.game.seq.length;
					attempts++;
				}
			}
		}

		my.turnStart(force);
	};
	my.turnEnd = function () {
		// 서바이벌 모드: 타임아웃 시 KO 처리는 각 게임 규칙 파일에서 처리
		// 여기서는 route만 호출
		return my.route("turnEnd");
	};
	my.submit = function (client, text, data) {
		return my.route("submit", client, text, data);
	};
	my.handleDraw = function (client, msg) {
		return my.route("handleDraw", client, msg);
	};
	my.handleClear = function (client, msg) {
		return my.route("handleClear", client, msg);
	};
	my.handlePass = function (client) {
		return my.route("handlePass", client);
	};
	my.getScore = function (text, delay, ignoreMission) {
		return my.routeSync("getScore", text, delay, ignoreMission);
	};
	my.getTurnSpeed = function (rt) {
		if (rt < 5000) return 10;
		else if (rt < 11000) return 9;
		else if (rt < 18000) return 8;
		else if (rt < 26000) return 7;
		else if (rt < 35000) return 6;
		else if (rt < 45000) return 5;
		else if (rt < 56000) return 4;
		else if (rt < 68000) return 3;
		else if (rt < 81000) return 2;
		else if (rt < 95000) return 1;
		else return 0;
	};
	my.getTitle = function () {
		return my.route("getTitle");
	};
	/*my.route = function(func, ...args){
		var cf;
		
		if(!(cf = my.checkRoute(func))) return;
		return Slave.run(my, func, args);
	};*/
	my.route = my.routeSync = function (func, ...args) {
		var cf;

		if (!(cf = my.checkRoute(func))) return;
		return cf.apply(my, args);
	};
	my.checkRoute = function (func) {
		var c;

		if (!my.rule) return JLog.warn("Unknown mode: " + my.mode), false;
		if (!(c = Rule[my.rule.rule])) return JLog.warn("Unknown rule: " + my.rule.rule), false;
		if (!c[func]) return JLog.warn("Unknown function: " + func), false;
		return c[func];
	};
	my.set(room);
	// 연습방이 아닌 경우에만 자동 삭제 타이머 시작
	// (연습방은 생성 후 practice=true로 설정되므로 여기서 체크해도 안전)
	if (!room.practice && !my.practice) {
		my.setAutoDelete();
	}
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
function getRewards(mode, score, bonus, rank, all, ss) {
	var rw = { score: 0, money: 0 };
	var sr = score / ss;

	// all은 1~8
	// rank는 0~7
	switch (Const.GAME_TYPE[mode]) {
		case "EKT":
			rw.score += score * 1.9;
			break;
		case "ESH":
			rw.score += score * 1.5;
			break;
		case "EKK":
			rw.score += score * 1.89;
			break;
		case "KKT":
			rw.score += score * 1.82;
			break;
		case "KSH":
			rw.score += score * 1.55;
			break;
		case "CSQ":
			rw.score += score * 1.4;
			break;
		case "KSC":
			rw.score += score * 1.52;
			break;
		case 'KCW':
			rw.score += score * 2.0;
			break;
		case 'KTY':
			rw.score += score * 1.3;
			break;
		case 'ETY':
			rw.score += score * 1.37;
			break;
		case 'KAP':
			rw.score += score * 1.8;
			break;
		case 'HUN':
			rw.score += score * 1.5;
			break;
		case 'KDA':
			rw.score += score * 1.57;
			break;
		case 'EDA':
			rw.score += score * 1.65;
			break;
		case 'KSS':
			rw.score += score * 1.5;
			break;
		case 'ESS':
			rw.score += score * 1.22;
			break;
		case 'KFR':
			rw.score += score * 1.15;
			break;
		case 'EFR':
			rw.score += score * 1.15;
			break;
		case "KPQ":
			rw.score += score * 2.72;
			break;
		case "EPQ":
			rw.score += score * 2.56;
			break;
		default:
			rw.score += score * 1.25;
			break;
	}
	rw.score = rw.score
		* (0.77 + 0.05 * (all - rank) * (all - rank)) // 순위
		* 1.5 / (1 + 1.25 * sr * sr) // 점차비(양학했을 수록 ↓)
		;
	rw.money = 1 + rw.score * 0.15; //0.01에서 대폭 상승한 것이다.
	if (all < 2) {
		rw.score = rw.score * 0.05;
		rw.money = rw.money * 0.5;
	} else {
		rw.together = true;
	}
	rw.score += bonus;
	rw.score = rw.score || 0;
	rw.money = rw.money || 0;
	if (rw.score < 0) rw.score = 0;
	if (rw.money < 0) rw.money = 0;

	// applyEquipOptions에서 반올림한다.
	return rw;
}
function filterRobot(item) {
	if (!item) return {};
	return (item.robot && item.getData) ? item.getData() : item;
}
