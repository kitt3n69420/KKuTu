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

var Cluster = require("cluster");
var JLog = require('../sub/jjlog');
var Const = require('../const');
// 중도 입장 스냅샷에 roundReady/turnStart 재생을 쓰지 않는 규칙 (전용 처리가 있거나 정답이 노출됨)
var SPEC_REPLAY_SKIP = ["Crossword", "Landgrab", "Flip", "Center", "Sudoku", "Wordcollect", "Picture", "Rhythm", "Rtype"];
var DB, DIC, ROOM, CHAN, Rule, checkSwearWords, censorSwearWords, narrate, publish, Robot, getEventMults, DiscordRelay;

Room.setContext = function(ctx) {
    DB = ctx.DB;
    DIC = ctx.DIC;
    ROOM = ctx.ROOM;
    CHAN = ctx.CHAN;
    Rule = ctx.Rule;
    checkSwearWords = ctx.checkSwearWords;
    censorSwearWords = ctx.censorSwearWords;
    narrate = ctx.narrate;
    publish = ctx.publish;
    Robot = ctx.Robot;
    getEventMults = ctx.getEventMults;
    DiscordRelay = ctx.DiscordRelay;
};

function Room(room, channel) {
	var my = this;

	my.id = room.id;
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
				var i, p, humanCount = 0;
				for (i = my.players.length - 1; i >= 0; i--) {
					p = my.players[i];
					if (typeof p !== 'object') {
						if (!DIC[p] || DIC[p].place != my.id) {
							my.players.splice(i, 1);
						} else {
							humanCount++;
						}
					}
				}
				// 실제 유저가 0명이면 봇도 제거 후 방 삭제
				if (humanCount == 0) {
					while (my.removeAI(false, true));
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
				var i, p, humanCount = 0;
				for (i = my.players.length - 1; i >= 0; i--) {
					p = my.players[i];
					if (typeof p !== 'object') {
						if (!DIC[p] || DIC[p].place != my.id) {
							my.players.splice(i, 1);
						} else {
							humanCount++;
						}
					}
				}
				// 실제 유저가 0명이면 봇도 제거 후 방 삭제
				if (humanCount == 0) {
					while (my.removeAI(false, true));
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

				narrate(my.players, 'chat', { code: "room_will_be_deleted_1m", notice: true });
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

				narrate(my.players, 'chat', { code: "room_auto_delete_warning_1", notice: true });
				my.setAutoDelete('warn2');
			}, warnTime);
		}
	};

	my.checkJamsu = function () {
		// 마스터 프로세스에서는 잠수 체크하지 않음 (워커에서만 실행)
		if (Cluster.isMaster) return;
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
										if (my._jst) { clearTimeout(my._jst); delete my._jst; }
										if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
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

	// 정원 계산용 인원: 참가자(J)+관전자(S)와 봇. 정원 초과로 들어온 관전자(O)는 제외한다.
	// form은 getData와 같은 방식으로 읽는다 (워커는 client.form, 마스터는 user-publish로 받은 game.form)
	my.countSeated = function () {
		var n = 0, p, c, f;
		for (var i in my.players) {
			p = my.players[i];
			if (typeof p === 'object') { n++; continue; }
			c = DIC[p];
			f = c ? (c.form || (c.game && c.game.form)) : null;
			if (f !== "O") n++;
		}
		return n;
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
					t: o.team || o.game.team,
					profile: o.profile,
					equip: o.equip,
					score: o.data ? o.data.score : 0
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
			// 코옵 모드는 게임 중 my.round가 1로 고정되므로, 목표 문제 수는 별도 필드로 노출한다
			// (round 자체를 바꾸면 drawRound() 등 "실제 라운드 수" 가정 코드가 깨짐).
			// 게임 중이 아닐 때는 undefined로 둬서 클라이언트가 room.round(방금 바뀐 설정값)를 쓰게 한다.
			coopTarget: (my.gaming && my.rule && my.rule.coop && my.game) ? my.game.coopTarget : undefined,
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
		var botCount = 0;
		for (var _bci = 0; _bci < my.players.length; _bci++) {
			if (my.players[_bci] && my.players[_bci].robot) botCount++;
		}
		if (botCount >= 11) {
			return caller.sendError(472);
		}

		function pushRobot(robot) {
			// 기존 봇들이 새 봇에게 인사 (30% 확률, push 전에 순회)
			var greetMsgs = Const.ROBOT_GREET_MESSAGES;
			for (var _pgi = 0; _pgi < my.players.length; _pgi++) {
				var _pgp = my.players[_pgi];
				if (!_pgp || !_pgp.robot) continue;
				if (_pgp.muteLobby || _pgp._rageQuitting) continue;
				if (Math.random() > 0.5) continue;
				(function (_bot) {
					setTimeout(function () {
						if (!_bot._rageQuitting && !_bot._removed && typeof _bot.chat === 'function') _bot.chat(greetMsgs[Math.floor(Math.random() * greetMsgs.length)]);
					}, 800 + Math.floor(Math.random() * 1000));
				})(_pgp);
			}
			my.players.push(robot);
			my.export();
			my.checkJamsu();
			if (!robot.muteLobby && Math.random() < 0.7) {
				setTimeout(function () {
					if (!robot._rageQuitting && !robot._removed && typeof robot.chat === 'function') robot.chat(greetMsgs[Math.floor(Math.random() * greetMsgs.length)]);
				}, 500 + Math.floor(Math.random() * 2000));
			}
		}

		pushRobot(new Robot(null, my.id, 2));
	};

	my.setAI = function (target, level, team, personality, preferredChar, muteGame, muteLobby, canRageQuit, fastMode) {
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
				my.players[i].muteGame = !!muteGame;
				my.players[i].muteLobby = !!muteLobby;
				my.players[i].canRageQuit = !!canRageQuit;
				my.players[i].fastMode = !!fastMode;
				my.players[i].data.personality = personality;
				my.players[i].data.preferredChar = preferredChar;
				my.players[i].data.muteGame = !!muteGame;
				my.players[i].data.muteLobby = !!muteLobby;
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
					if (j != -1) {
						// 예전에는 seq만 splice해서 turn/랜덤 턴 가방이 어긋남 (방장 퇴장 시 봇 일괄 제거 → 현재 차례 주인이 바뀜).
						// 진행 중인 차례의 봇이 빠지면 사람이 나갈 때와 같게 그 차례를 끝낸다.
						// 이미 끝난 차례(late)면 turnEnd를 다시 부르지 않는다 (일괄 제거 중 벌점/라운드 종료가 겹치지 않게).
						var botTurn = my.game.turn == j;
						var liveTurn = botTurn && !my.game.late;
						var turnEnded = false;
						if (liveTurn) {
							clearTimeout(my.game.robotTimer);
							if (my.rule.ewq && !my.opts.survival && Cluster.isWorker) {
								clearTimeout(my.game._rrt);
								my.game.loading = false;
								try {
									my.turnEnd();
									turnEnded = true;
								} catch (_e) {
									JLog.error(`[diag#4] removeAI turnEnd THREW: ${_e && _e.stack || _e}`);
								}
							}
						}
						my.spliceSeq(j, botTurn && !my.opts.survival && (turnEnded || !liveTurn));
						if (liveTurn && !turnEnded && Cluster.isWorker) my.skipLeftTurn(j);
					}
					// game.robots에서 제거 (roundEnd까지 참조가 남는 누수 방지)
					if (my.game.robots) {
						var ri = my.game.robots.indexOf(removedBot);
						if (ri != -1) my.game.robots.splice(ri, 1);
					}
					// 봇 게임 타이머 정리
					if (removedBot._timer) { clearTimeout(removedBot._timer); removedBot._timer = null; }
					if (removedBot._timerCatch) { clearTimeout(removedBot._timerCatch); removedBot._timerCatch = null; }
					if (removedBot._cwTimer) { clearTimeout(removedBot._cwTimer); removedBot._cwTimer = null; }
					if (removedBot.game && removedBot.game.flipTimer) { clearTimeout(removedBot.game.flipTimer); removedBot.game.flipTimer = null; }
					// seq에서 빠진 봇은 interrupt()가 못 지우므로 여기서 정리 (계산 대결 등: 방 삭제 후 my.game={}에 제출해 크래시)
					if (removedBot.game && removedBot.game.typingTimer) { clearTimeout(removedBot.game.typingTimer); removedBot.game.typingTimer = null; }
					if (removedBot.game && removedBot.game.botTimer) { clearTimeout(removedBot.game.botTimer); removedBot.game.botTimer = null; }
				}
				my.players.splice(i, 1);
				// rageQuit 중인 봇은 이미 disconnRoom을 전송했으므로 제외
				if (Cluster.isWorker && !removedBot._rageQuitting) {
					var _dm = JSON.stringify({ type: "disconnRoom", id: removedBot.id, profile: removedBot.profile, robot: true });
					for (var _di in DIC) {
						if (DIC[_di].place == my.id && DIC[_di].socket && DIC[_di].socket.readyState == 1) {
							DIC[_di].socket.send(_dm);
						}
					}
				}
				removedBot.place = 0;
				removedBot._removed = true;
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
			// AFK 킥 타이머 정리 (방 입장 시 타이머가 남아있으면 취소)
			if (client._afkKickTimer) { clearTimeout(client._afkKickTimer); delete client._afkKickTimer; }
			client._afkWarned = false;
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

		// 기존 봇들이 새로 들어온 플레이어(사람 또는 봇)에게 인사 (30% 확률)
		if (!my.gaming) {
			var greetMsgs = Const.ROBOT_GREET_MESSAGES;
			for (var _gi = 0; _gi < my.players.length; _gi++) {
				var _gp = my.players[_gi];
				if (!_gp || !_gp.robot || _gp === client) continue;
				if (_gp.muteLobby || _gp._rageQuitting) continue;
				if (Math.random() > 0.3) continue;
				(function (_bot) {
					setTimeout(function () {
						if (!_bot._rageQuitting && !_bot._removed && typeof _bot.chat === 'function') _bot.chat(greetMsgs[Math.floor(Math.random() * greetMsgs.length)]);
					}, 500 + Math.floor(Math.random() * 1000));
				})(_gp);
			}
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
	my.go = function (client, kickVote, reason) {
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
				if (my.gaming) my.interrupt();
				if (my._adt) { clearTimeout(my._adt); delete my._adt; }
				if (my._jst) { clearTimeout(my._jst); delete my._jst; }
				if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
				delete ROOM[my.id];
				if (Cluster.isWorker) process.send({ type: "room-invalid", room: { id: my.id } });
			}
			return client.sendError(409);
		}
		my.players.splice(x, 1);
		// 서바이벌: game 초기화 전에 alive 상태 보존 (이미 KO된 플레이어 재처리 방지)
		var _wasAlive = client.game ? client.game.alive : undefined;
		// 게임 중 참여: 경기 중 나간 사람의 점수는 이번 게임 동안 보관했다가 다시 참여하면 되돌려 준다
		// (seq에 있을 때만 — 대기열/관전 중 나가면 이전에 보관한 점수를 덮어쓰지 않음)
		if (my.gaming && Cluster.isWorker && my.opts.latejoin && my.game.leftScores && my.game.seq && my.game.seq.indexOf(client.id) != -1
			&& client.game && typeof client.game.score === 'number' && !isNaN(client.game.score)) {
			my.game.leftScores[client.id] = client.game.score;
		}
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

				// 아이템전: 퇴장 시 대기 아이템 정리
				if (my.opts.item && my.game.pendingItems && my.game.pendingItems[client.id]) {
					delete my.game.pendingItems[client.id];
					my.byMaster('item-dequeued', { playerId: client.id }, true);
				}
				// 퇴장자의 아이템 보유량/보너스 누적치도 정리 (게임이 끝날 때까지 키가 쌓이는 것 방지)
				if (my.game.items) delete my.game.items[client.id];
				if (my.game.bonusScore) delete my.game.bonusScore[client.id];

				var seqIndex = my.game.seq.indexOf(client.id);
				if (seqIndex != -1) {
					// 코옵 모드: 자기 턴에 이탈하면 즉시 전원 실패, 남의 턴이면 로테이션에서만 제외하고 계속 진행
					if (my.rule.coop) {
						var coopIsTurn = (my.game.turn == seqIndex);

						if (my.game.pendingItems) delete my.game.pendingItems[client.id];
						my.game.seq.splice(seqIndex, 1);
						if (my.game.turn > seqIndex) {
							my.game.turn--;
							if (my.game.turn < 0) my.game.turn = my.game.seq.length - 1;
						}
						if (my.game.turn >= my.game.seq.length) my.game.turn = 0;

						if (coopIsTurn) {
							clearTimeout(my.game.turnTimer);
							clearTimeout(my.game.robotTimer);
							clearTimeout(my.game._rrt);
							if (Cluster.isWorker) {
								my.game._rrt = setTimeout(function () {
									my.roundEnd({ coopSuccess: false });
								}, 500);
							}
						}
						// 남의 턴에 이탈한 경우: 기존 턴 타이머가 그대로 유지되어 남은 인원이 계속 진행됨
					}
					// 서바이벌 모드: 중도 퇴장 시 KO 처리 (seq에서 제거하지 않음)
					else if (my.opts.survival || (my.gaming && my.rule && my.rule.survival)) {
						if (_wasAlive === false) {
							// 이미 KO된 플레이어 퇴장 (heartbeat 타임아웃 등):
							// turnEnd()가 이미 KO/타이머를 처리했으므로 게임 흐름에 영향 없음
						} else {
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
							// 다음 차례가 이미 예약됨: 정답 직후 틈, 또는 봇 일괄 제거(skipLeftTurn)로 차례가 퇴장자에게 넘어온 경우
							var nextPending = my.game.late && my.game.inTurn;
							if (isTurn && my.rule.ewq && !nextPending) {
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
									if (team && team >= 1 && team <= Const.TEAM_MAX) {
										aliveTeams.add(team);
									} else {
										individualCount++;
									}
								}
							}

							// 게임 종료 조건: 팀 + 개인전 합쳐서 1개체만 남을 때
							var totalEntities = aliveTeams.size + individualCount;
							var gameOver = totalEntities <= 1;
							// 마스터는 IPC로 직렬화된 봇/플레이어 사본을 가질 뿐 게임 콜백 실행 권한이 없음
							// (비서바이벌 분기는 이미 turnEnd를 Cluster.isWorker로 게이팅) — 동일하게 처리
							if (gameOver) {
								clearTimeout(my.game.turnTimer);
								clearTimeout(my.game.robotTimer);
								clearTimeout(my.game._rrt);
								if (Cluster.isWorker) {
									my.game._rrt = setTimeout(function () {
										my.roundEnd();
									}, 2000);
								}
							} else if (isTurn && !nextPending) {
								// 다음 턴으로 진행 (이미 예약된 turnNext가 있으면 그게 KO된 퇴장자를 건너뛰므로 다시 예약하지 않는다)
								clearTimeout(my.game.turnTimer);
								clearTimeout(my.game.robotTimer);
								clearTimeout(my.game._rrt);
								if (Cluster.isWorker) {
									my.game._rrt = setTimeout(function () {
										try {
											my.turnNext();
										} catch (_e) {
											JLog.error(`[diag#4] survival turnNext THREW: ${_e && _e.stack || _e}`);
											throw _e;
										}
									}, 2000);
								}
							}
						}
					} else {
						// 비서바이벌 모드: 기존 로직
						// 중퇴 플레이어의 pending item 정리 (stale _itemTurnActive 방지)
						if (my.game.pendingItems) delete my.game.pendingItems[client.id];
						if (my.game.seq.length <= 2) {
							my.game.seq.splice(seqIndex, 1);
							my.roundEnd();
						} else {
							var isTurn = my.game.turn == seqIndex;
							var turnEndFailed = false;
							// 이미 끝난 차례(late)면 turnEnd를 다시 부르지 않는다 (벌점·라운드 종료 중복 방지.
							// 예: 방장 퇴장으로 봇 차례가 먼저 끝난 뒤 차례가 방장 자리로 넘어온 경우)
							if (isTurn && my.rule.ewq && !my.game.late) {
								clearTimeout(my.game._rrt);
								my.game.loading = false;
								if (Cluster.isWorker) {
									// 게임 중 참여: 자기 차례에 나가면 시간 초과로 보고, 보관한 점수 기준으로 벌점을 매겨 다시 보관한다
									var hasLeftScore = my.game.leftScores && my.game.leftScores.hasOwnProperty(client.id);
									if (hasLeftScore) client.game.score = my.game.leftScores[client.id];
									try {
										my.turnEnd();
									} catch (_e) {
										// 다시 던지면 아래 seq 정리가 건너뛰어져 퇴장자가 seq에 유령으로 남는다
										// (매 라운드 유령 차례가 시간 초과로 소모됨) — 기록만 하고 정리는 계속한다
										JLog.error(`[diag#4] non-survival turnEnd THREW: ${_e && _e.stack || _e}`);
										turnEndFailed = true;
									}
									if (hasLeftScore && typeof client.game.score === 'number' && !isNaN(client.game.score)) {
										my.game.leftScores[client.id] = client.game.score;
									}
								}
							}
							// 랜덤 턴: 가방은 빠진 사람만 걸러내고, 차례 주인이 나가 라운드가 끝났으면 다음 첫 차례를 다시 뽑는다
							my.spliceSeq(seqIndex, isTurn && my.rule.ewq && !turnEndFailed);
							if (turnEndFailed) my.skipLeftTurn(seqIndex);
						}
					}
				}

				// 코옵 모드는 자체 종료 조건(목표 턴 달성/실패/자기 턴 이탈)만으로 끝나야 하므로
				// 인원이 줄었다는 이유만으로 강제 종료하지 않는다 (남의 턴 이탈 시 계속 진행).
				if (my.gaming && !my.rule.coop && my.game.seq.length < 2) my.roundEnd();
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
		// 킥 투표 타이머 정리 (disconnect 시 clearTimeout 없이 남는 문제 방지)
		if (client.kickTimer) { clearTimeout(client.kickTimer); delete client.kickTimer; }
		if (my.practice) {
			if (my.gaming) my.interrupt();
			client.subPlace = 0;
		} else {
			// place=0 초기화 전에 disconnRoom 전송 (이후엔 _place==0 이라 slave.js에서 전송 안 됨)
			if (Cluster.isWorker) {
				var _dm = JSON.stringify({ type: "disconnRoom", id: client.id });
				for (var _di in DIC) {
					if (DIC[_di] !== client && DIC[_di].place == my.id && DIC[_di].socket && DIC[_di].socket.readyState == 1) {
						DIC[_di].socket.send(_dm);
					}
				}
			}
			client.place = 0;
		}

		if (Cluster.isWorker) {
			if (!my.practice) {
				// Discord: 방 퇴장 로그
				process.send({
					type: "room-leave",
					roomId: my.id,
					name: (client.profile && (client.profile.title || client.profile.name)) || client.id,
					isRobot: false,
					reason: reason || "abnormal"
				});
				if (client.socket.readyState <= 1) client.socket.close();
				process.send({ type: "room-go", target: client.id, id: my.id, removed: !ROOM.hasOwnProperty(my.id) });
				// tail-report: 비정상 퇴장도 포함하여 전송 (연습방 제외)
				process.send({ type: "tail-report", id: client.id, place: my.id, msg: { type: "leave", reason: reason || "abnormal" } });
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
		my.limit = Math.max(Math.min(24, my.players.length), Math.round(room.limit));
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
				var rawInjpick = Array.isArray(room.opts.injpick) ? room.opts.injpick : [];
				my.opts.injpick = rawInjpick.filter(function (item) { return typeof item === 'string' && ij.includes(item); });
			} else my.opts.injpick = [];
			if (my.rule.opts.includes("qij")) {
				var rawQuizpick = Array.isArray(room.opts.quizpick) ? room.opts.quizpick : [];
				var allowedQuizTopics = my.rule.lang === 'en' ? Const.QUIZ_TOPIC_EN : Const.QUIZ_TOPIC;
				my.opts.quizpick = rawQuizpick.filter(function (item) { return typeof item === 'string' && allowedQuizTopics.indexOf(item) !== -1; });
			} else my.opts.quizpick = [];
			// 곡 선택: 채보 파일 이름(빈 문자열 = 무작위). 없는 곡이면 rhythm.js/rtype.js가 무작위로 고름
			if (my.rule.opts.includes("spk") && typeof room.opts.songpick === 'string' && /^[\w.-]{1,64}$/.test(room.opts.songpick)) {
				my.opts.songpick = room.opts.songpick;
			} else my.opts.songpick = "";
			// 서바이벌 HP 옵션 처리 (허용 값만 사용)
			var ALLOWED_SUR_HP = [200, 500, 1000, 2000];
			if (ALLOWED_SUR_HP.indexOf(room.opts.surHP) !== -1) {
				my.opts.surHP = room.opts.surHP;
			} else {
				my.opts.surHP = 500;
			}
		}
		// APL (Bad Apple) 옵션 체크: opts 복사 후에 수행
		if (my.opts && my.opts.apple) {
			my.round = 1;
			my.time = 220;
			my.opts.big = true;
		}
		// 달가루 모으기: 라운드 1, 제한시간 60초로 고정 (클라이언트 입력값 무시)
		if (my.rule && my.rule.rule === 'Wordcollect') {
			my.round = 1;
			my.time = 60;
		}
		// 리듬 게임/리듬 타이퍼: 라운드 1, 제한시간 60초로 고정
		if (my.rule && (my.rule.rule === 'Rhythm' || my.rule.rule === 'Rtype')) {
			my.round = 1;
			my.time = 60;
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
				for (i = 1; i <= Const.TEAM_MAX; i++) {
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
		if (my.rule.opts.includes("ijp") && !my.opts.catch) {
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
		// 코옵 턴 수 검사: 목표 턴 수가 참여 인원(봇 포함)보다 적으면 시작 불가
		if (my.rule.coop && teams) {
			var coopHeadcount = teams.reduce(function (p, t) { return p + t.length; }, 0);
			if (my.round < coopHeadcount) return 448;
		}
		return false;
	};
	my.ready = function () {
		var i, all = true;
		var len = 0;
		var teams = []; for (i = 0; i <= Const.TEAM_MAX; i++) teams.push([]);

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
	// 게임 참가자 한 명의 게임 상태 초기화 (게임 시작 시, 게임 중 참여 시 공용)
	my.initGamePlayer = function (o, now) {
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
		o.game.survivalKOOrder = 0;
		o.game.survivalDamageDealt = 0;
		o.game.coopTurns = 0;
		o.game.item = [/*0, 0, 0, 0, 0, 0*/];
		o.game.wpc = [];
		delete o.game.lastWord;
		delete o.game.lastWordLen;
		o.game.straightStreak = 0;
		// 플레이어별 아이템 초기화 (항상)
		var itemObj = { skip: 0, pass: 0, random: 0 };
		if (my.game.seq.length > 2) itemObj.reverse = 0;
		if (my.rule.rule === 'Classic') itemObj.linkChange = 0;
		my.game.items[o.id] = itemObj;
		my.game.bonusScore[o.id] = 0;
		if (my.game.pendingItems[o.id]) delete my.game.pendingItems[o.id];
	};
	// ========== 게임 중 참여(ljn) ==========
	// 참여 판정: 'open'(즉시) / 'queue'(다음 라운드부터) / 'full'(정원 초과) / 'closed'(참여 불가)
	// 턴제는 라운드 진행 중이면 즉시, 라운드가 끝난 뒤 다음 라운드 준비 전이면 대기열.
	// 라운드 단위 모드는 항상 다음 라운드부터. 마지막 라운드가 끝났거나(턴제)/진행 중이면(라운드 단위) 참여 불가.
	my.getLateJoinState = function (client) {
		var kind = my.rule && Const.LATE_JOIN_RULES[my.rule.rule];
		var i, seated;

		if (!my.gaming || my._roundEnding || my.practice || !my.opts.latejoin || !kind || !my.game.seq) return 'closed';
		for (i in my.game.seq) if (my.game.seq[i] === client.id) return 'closed';
		// 이미 관전자로 들어와 있으면 본인 자리는 빼고 센다
		seated = my.countSeated();
		if (my.players.indexOf(client.id) != -1 && client.form !== "O") seated--;
		if (seated >= my.limit) return 'full';
		if (kind === 'round' || my.game.roundOver) return (my.game.round >= my.round) ? 'closed' : 'queue';
		return 'open';
	};
	// 관전자로 입장한 client의 참여 요청 처리 (입장 확인창 이후 다시 판정 — 그 사이 상태가 바뀌었을 수 있음)
	my.requestLateJoin = function (client) {
		var state = my.getLateJoinState(client);

		if (state === 'open') {
			my.lateJoin(client);
		} else if (state === 'queue') {
			if (my.game.lateQueue.indexOf(client.id) == -1) my.game.lateQueue.push(client.id);
			client.send('lateJoinQueued', {});
		} else {
			client.send('lateJoinClosed', {});
		}
	};
	// 관전자를 경기에 넣는다: seq 맨 끝(팀전이어도 개인 자격), 점수 0부터 (이번 게임에서 나갔던 사람은 보관한 점수로)
	my.lateJoin = function (client) {
		var id;

		client.cameWhenGaming = false;
		client.setForm("J");
		my.game.seq.push(client.id);
		my.initGamePlayer(client, (new Date()).getTime());
		if (my.game.leftScores && my.game.leftScores.hasOwnProperty(client.id)) {
			client.game.score = my.game.leftScores[client.id];
			delete my.game.leftScores[client.id];
		}
		// 2인 → 3인: 뒤로가기 아이템 칸이 새로 생김
		if (my.game.seq.length === 3) {
			for (id in my.game.items) if (my.game.items[id].reverse === undefined) my.game.items[id].reverse = 0;
		}
		if (my.opts.randomturn && my.game.randomTurnOrder) my.addToRandomBag(my.game.seq.length - 1);
		if (typeof my.game.hum === 'number') my.game.hum++;
		my.byMaster('lateJoin', { id: client.id, seq: my.game.seq.map(filterRobot), score: client.game.score }, true);
	};
	// 대기열 반영: roundReady 첫머리에서, 다음 라운드가 있을 때만 호출
	my.drainLateQueue = function () {
		var queue = my.game.lateQueue || [];
		var i, c, state;

		my.game.lateQueue = [];
		for (i = 0; i < queue.length; i++) {
			c = DIC[queue[i]];
			// 대기 중 나간 사람은 버린다
			if (!c || c.place != my.id || my.players.indexOf(c.id) == -1) continue;
			state = my.getLateJoinState(c);
			if (state === 'open' || state === 'queue') my.lateJoin(c);
			else c.send('lateJoinClosed', {});
		}
	};
	my.start = function (pracLevel, personality, preferredChar, pracMuteGame, pracMuteLobby, pracCanRageQuit, pracFastMode) {
		if (my._adt) { clearTimeout(my._adt); delete my._adt; }
		if (my._jst) { clearTimeout(my._jst); delete my._jst; }
		if (my._jst_stage2) { clearTimeout(my._jst_stage2); delete my._jst_stage2; }
		var i, j, o, hum = 0;
		var now = (new Date()).getTime();

		// 이전 라운드의 비동기 roundEnd 콜백이 아직 pending일 수 있으므로 플래그 리셋
		my._roundEnding = false;
		// 봇 잡담 타이머 정리 (새 게임 시작 시 이전 타이머 제거)
		if (my._botIdleTimers) {
			for (var _bti = 0; _bti < my._botIdleTimers.length; _bti++) clearTimeout(my._botIdleTimers[_bti]);
			my._botIdleTimers = [];
		}
		my.gaming = true;
		//my.kicked = []; //클로드가 추가한 코드인데 얘는 한번 강퇴되면 다시 못들어오는 걸 이해못하나봄

		// Discord notification for game start
		if (Cluster.isMaster) {
			DiscordRelay("game-start", { room: my.id });
		} else if (Cluster.isWorker) {
			process.send({ type: "game-start", room: my.id });
		}

		my.game = {};
		my.game.late = true;
		my.game.round = 0;
		my.game.turn = 0;
		my.game.seq = [];
		my.game.robots = [];
		if (my.practice) {
			my.game.robots.push(o = new Robot(my.master, my.id, pracLevel, null, personality, preferredChar));
			o.muteGame = !!pracMuteGame;
			o.muteLobby = !!pracMuteLobby;
			o.canRageQuit = !!pracCanRageQuit;
			o.fastMode = !!pracFastMode;
			o.data.muteGame = o.muteGame;
			o.data.muteLobby = o.muteLobby;
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
				for (var k = 1; k <= Const.TEAM_MAX; k++) {
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
				for (var k = 0; k <= Const.TEAM_MAX; k++) {
					if (my._teams[k] && my._teams[k].length > 0) {
						allGroups.push({ id: k, count: my._teams[k].length });
						// Shuffle players within the team/pool for random order
						my._teams[k] = shuffle(my._teams[k]);
						totalPlayers += my._teams[k].length;
					}
				}

				// Sort groups by count descending; 동점 팀은 랜덤 순서
				allGroups.sort(function (a, b) {
					if (b.count !== a.count) return b.count - a.count;
					return Math.random() < 0.5 ? -1 : 1;
				});

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
						for (var k = 0; k <= Const.TEAM_MAX; k++) {
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
			// 랜덤 위상 시프트: 배열을 임의 위치만큼 원형 회전
			if (my.game.seq.length > 1) {
				var _startShift = Math.floor(Math.random() * my.game.seq.length);
				my.game.seq = my.game.seq.slice(_startShift).concat(my.game.seq.slice(0, _startShift));
			}
		}
		my.game.turn = 0;

		my.game.mission = null;

		// 아이템전 ↔ 카오스 ↔ 랜덤 턴 상호 배제 (우선순위: 아이템전 > 카오스 > 랜덤 턴)
		// 카오스 강제 아이템이 걸리면 turnNext가 랜덤 턴 가방 대신 순차 진행을 쓰고, 카오스 재배치는 가방의 seq 칸 번호를 어긋나게 함
		if (my.opts.item && my.opts.chaos) {
			my.opts.chaos = false;
		}
		if ((my.opts.item || my.opts.chaos) && my.opts.randomturn) {
			my.opts.randomturn = false;
		}
		// 소수 규칙: 차례가 고정이면 소수가 누구에게 걸릴지 미리 정해져 불공평하므로 랜덤 턴과만 허용, 랜덤 숫자와는 상호 배제
		if (my.opts.prime && !my.opts.randomturn) {
			my.opts.prime = false;
		}
		if (my.opts.prime && my.opts.randomnumber) {
			my.opts.randomnumber = false;
		}
		// 리턴 ↔ 한 번만! 상호 배제
		if (my.opts.return && my.opts.onlyonce) {
			my.opts.return = false;
		}
		// 게임 중 참여 ↔ 쿵쿵따 체인지·서바이벌 상호 배제 (인원이 바뀌면 교대 주기와 생존 판정이 깨짐)
		if (my.opts.latejoin && (my.opts.change || my.opts.survival)) {
			my.opts.latejoin = false;
		}
		// 게임 중 참여 상태: 대기열(id만 저장)과 "라운드가 끝나 다음 라운드 준비 전" 여부
		my.game.lateQueue = [];
		my.game.leftScores = {};
		my.game.roundOver = false;
		my.game.inTurn = false;
		delete my.game.turnOwnerLeft;

		// 서바이벌 추적 필드 초기화
		my.game.survivalKOCounter = 0;
		my.game.survivalDamageTracking = false;

		// 아이템 상태 초기화 (opts.item 여부와 무관하게 항상)
		my.game.items = {};
		my.game.itemGlobalTurnCount = 0;
		my.game.bonusScore = {};
		my.game.pendingItems = {};
		my.game.reversed = false;
		my.game.linkOverride = null;

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
			my.initGamePlayer(o, now);
		}
		// 서바이벌/코옵 모드는 my.round를 강제로 바꾸므로, 게임 종료 후 방 설정에 원래 값을 되돌리기 위해 백업
		if (my.opts.survival || my.rule.coop) {
			my.originalRound = my.round;
		}
		// 서바이벌 모드는 1라운드만 진행
		if (my.opts.survival) {
			my.round = 1;
			my.game.maxRound = 1;
		}
		// 코옵 모드: 라운드 수 입력값을 목표 턴 수로 전환하고 1라운드로 고정
		if (my.rule.coop) {
			my.game.coopTarget = my.round;
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

		// 게임 중 참여: 새 라운드가 시작되면 즉시 참여 구간으로 돌아가고, 다음 라운드가 있으면 대기열을 반영한다
		// (규칙 roundReady가 round++ 하기 전이므로 round < my.round면 다음 라운드가 있음. 카오스 재배치보다 먼저)
		my.game.roundOver = false;
		if (my.game.lateQueue && my.game.lateQueue.length && my.game.round < my.round) my.drainLateQueue();

		// 아이템전: 라운드 시작 시 아이템 리셋
		if (my.opts.item && my.game.seq) {
			for (var ii in my.game.seq) {
				var io = DIC[my.game.seq[ii]] || my.game.seq[ii];
				if (io && io.id) {
					var itemObj = { skip: 0, pass: 0, random: 0 };
					if (my.game.seq.length > 2) itemObj.reverse = 0;
					if (my.rule.rule === 'Classic') itemObj.linkChange = 0;
					my.game.items[io.id] = itemObj;
					my.game.bonusScore[io.id] = 0;
				}
			}
			// 남아있는 큐를 클라이언트에 해제 브로드캐스트
			if (my.game.pendingItems) {
				for (var rpi in my.game.pendingItems) {
					my.byMaster('item-dequeued', { playerId: rpi }, true);
				}
			}
			my.game.pendingItems = {};
			my.game.reversed = false;
			my.game.linkOverride = null;
		}

		// 카오스: 2라운드부터 아이템 리셋 + 순서 재배치
		if (my.opts.chaos && my.game.seq && my.game.round >= 1) {
			// 재배치 전에 타임아웃 플레이어 ID 기록 (재배치 후 새 위치를 찾기 위해)
			var _cTimedOutItem = my.game.seq[my.game.turn];
			var _cTimedOutId = (_cTimedOutItem && _cTimedOutItem.id) ? _cTimedOutItem.id : _cTimedOutItem;
			// 아이템 리셋 (chaos 아이템은 silent이므로 item-dequeued 브로드캐스트 없음)
			my.game.pendingItems = {};
			my.game.reversed = false;
			my.game.linkOverride = null;
			for (var ci in my.game.seq) {
				var co = DIC[my.game.seq[ci]] || my.game.seq[ci];
				if (co && co.id) {
					var cItemObj = { skip: 0, pass: 0, random: 0 };
					if (my.game.seq.length > 2) cItemObj.reverse = 0;
					if (my.rule.rule === 'Classic') cItemObj.linkChange = 0;
					my.game.items[co.id] = cItemObj;
					my.game.bonusScore[co.id] = 0;
				}
			}

			// 순서 재배치: 게임 시작과 동일 알고리즘 (스트라이드 → 위상 시프트)
			var _cTeams = {};
			for (var _ci = 0; _ci < my.game.seq.length; _ci++) {
				var _cp = (my.game.seq[_ci] && typeof my.game.seq[_ci] === 'object') ? my.game.seq[_ci] : DIC[my.game.seq[_ci]];
				var _ct = _cp ? (_cp.robot ? ((_cp.game && _cp.game.team) || 0) : (_cp.team || 0)) : 0;
				if (!_cTeams[_ct]) _cTeams[_ct] = [];
				_cTeams[_ct].push(my.game.seq[_ci]);
			}
			var _cHasTeams = Object.keys(_cTeams).some(function (t) { return +t > 0; });
			if (_cHasTeams) {
				var _cAllGroups = [];
				for (var _ct2 in _cTeams) {
					_cTeams[_ct2] = shuffle(_cTeams[_ct2]);
					_cAllGroups.push({ id: +_ct2, count: _cTeams[_ct2].length });
				}
				_cAllGroups.sort(function (a, b) {
					if (b.count !== a.count) return b.count - a.count;
					return Math.random() < 0.5 ? -1 : 1;
				});
				var _cTotal = my.game.seq.length;
				var _cAvail = [];
				for (var _ca = 0; _ca < _cTotal; _ca++) _cAvail.push(_ca);
				var _cPlacement = new Array(_cTotal);
				for (var _cg = 0; _cg < _cAllGroups.length; _cg++) {
					var _cGrp = _cAllGroups[_cg];
					if (_cGrp.count === 0) continue;
					var _cStep = _cAvail.length / _cGrp.count;
					var _cTaken = [];
					for (var _cpp = 0; _cpp < _cGrp.count; _cpp++) {
						var _cIdx = Math.floor(_cpp * _cStep);
						if (_cIdx >= _cAvail.length) _cIdx = _cAvail.length - 1;
						_cPlacement[_cAvail[_cIdx]] = _cGrp.id;
						_cTaken.push(_cAvail[_cIdx]);
					}
					_cAvail = _cAvail.filter(function (v) { return _cTaken.indexOf(v) === -1; });
				}
				var _cNewSeq = [];
				for (var _cni = 0; _cni < _cTotal; _cni++) {
					var _cPool = _cTeams[_cPlacement[_cni]];
					if (_cPool && _cPool.length > 0) _cNewSeq.push(_cPool.shift());
				}
				my.game.seq = _cNewSeq;
			} else {
				my.game.seq = shuffle(my.game.seq);
			}
			// 랜덤 위상 시프트
			if (my.game.seq.length > 1) {
				var _cShift = Math.floor(Math.random() * my.game.seq.length);
				my.game.seq = my.game.seq.slice(_cShift).concat(my.game.seq.slice(0, _cShift));
			}

			// 재배치 후 타임아웃 플레이어의 새 인덱스로 턴 설정 (없으면 0)
			my.game.turn = 0;
			for (var _cfi = 0; _cfi < my.game.seq.length; _cfi++) {
				var _cfs = my.game.seq[_cfi];
				var _cfId = (_cfs && _cfs.id) ? _cfs.id : _cfs;
				if (_cfId === _cTimedOutId) { my.game.turn = _cfi; break; }
			}
			var _shuffledSeqIds = my.game.seq.map(function (s) { return (s && s.id) ? s.id : s; });
			my.byMaster('chaos-notice', { code: 'chaosShuffle', seq: _shuffledSeqIds }, true);
		}

		return my.route("roundReady");
	};
	my.interrupt = function () {
		clearTimeout(my.game._rrt);
		clearTimeout(my.game.turnTimer);
		clearTimeout(my.game.hintTimer);
		clearTimeout(my.game.hintTimer2);
		clearTimeout(my.game.qTimer);
		clearTimeout(my.game.robotTimer);
		clearInterval(my.game.moveTimer);
		// 레인게임/워드스택: 방이 삭제되며 my.game이 교체되면 핸들을 잃어 영영 못 지우므로 여기서 정리한다
		clearInterval(my.game.scanTimer);
		clearTimeout(my.game.autoAtkTimer);
		if (my._botIdleTimers) {
			for (var _bti = 0; _bti < my._botIdleTimers.length; _bti++) clearTimeout(my._botIdleTimers[_bti]);
			my._botIdleTimers = [];
		}

		// 봇별 타이머 정리 (typingTimer, flipTimer, _timerCatch, _timer 등)
		if (my.game.seq) {
			for (var i in my.game.seq) {
				var o = my.game.seq[i];
				if (o && o.robot) {
					if (o.game && o.game.typingTimer) clearTimeout(o.game.typingTimer);
					if (o.game && o.game.botTimer) clearTimeout(o.game.botTimer);
					if (o.game && o.game.flipTimer) { clearTimeout(o.game.flipTimer); o.game.flipTimer = null; }
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
					if (r.game && r.game.flipTimer) { clearTimeout(r.game.flipTimer); r.game.flipTimer = null; }
					if (r._timerCatch) clearTimeout(r._timerCatch);
					if (r._timer) clearTimeout(r._timer);
					if (r._sockTimer) { clearTimeout(r._sockTimer); r._sockTimer = null; }
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
		if (Cluster.isMaster) {
			DiscordRelay("round-end", { room: my.id, chainLog: logCopy, round: r, totalRounds: totalRounds });
		} else if (Cluster.isWorker) {
			process.send({ type: "round-end", room: my.id, chainLog: logCopy, round: r, totalRounds: totalRounds });
		}
	};
	my.sendQuizRoundEnd = function (answer, winnerIds, missedIds, giveupIds, round, winnerWords) {
		var r = round || my.game.round || 0;
		var totalRounds = my.round || 0;
		function resolveId(id) {
			if (DIC[id]) return my.getPlayerName(DIC[id]);
			if (my.game.robots) {
				for (var k in my.game.robots) {
					if (my.game.robots[k] && my.game.robots[k].id === id) return my.getPlayerName(my.game.robots[k]);
				}
			}
			return String(id);
		}
		// winnerWords가 주어지면(정답자마다 답이 다를 수 있는 모드), 이름 옆에 각자 입력한 단어를 붙인다.
		function resolveWinner(id) {
			var name = resolveId(id);
			if (winnerWords && winnerWords[id]) return name + ': ' + winnerWords[id];
			return name;
		}
		var data = {
			answer: answer,
			winners: (winnerIds || []).map(resolveWinner),
			missed: (missedIds || []).map(resolveId),
			giveup: (giveupIds || []).map(resolveId),
			round: r,
			totalRounds: totalRounds
		};
		if (Cluster.isMaster) {
			DiscordRelay("quiz-round-end", { room: my.id, data: data });
		} else if (Cluster.isWorker) {
			process.send({ type: "quiz-round-end", room: my.id, data: data });
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
	// DB/Redis 콜백이 끝내 호출되지 않아도(연결 끊김 등) 해당 유저 몫만 fallback으로 처리하고
	// 나머지 유저는 정상 결과를 받을 수 있도록, tail 하나하나에 개별 타임아웃을 건다.
	function withTimeout(tail, ms, fallback) {
		return new Promise(function (resolve) {
			var settled = false;
			var timer = setTimeout(function () {
				if (settled) return;
				settled = true;
				resolve(fallback);
			}, ms);
			try {
				tail.then(function (data) {
					if (settled) return;
					settled = true;
					clearTimeout(timer);
					resolve(data);
				});
			} catch (_e) {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				resolve(fallback);
			}
		});
	}
	my.roundEnd = function (data) {
		if (my._roundEnding) return;
		if (!my.gaming) return;
		my._roundEnding = true;

		var i, o, rw;
		var res = [];
		var users = {};
		var rl;
		var pv = -1;
		var suv = [];
		var teams = [null]; for (i = 1; i <= Const.TEAM_MAX; i++) teams.push([]);
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
			// NaN/비숫자 점수가 팀 합산에 섞이면 팀 점수가 NaN이 되어 순위 정렬이 깨지므로 0으로 보정 (원인 추적용 로그 남김)
			if (typeof o.game.score !== 'number' || isNaN(o.game.score)) {
				JLog.warn(`Room ${my.id}: ${o.id} score was ${o.game.score} at roundEnd (mode ${Const.GAME_TYPE[my.mode]}), reset to 0`);
				o.game.score = 0;
			}
			if (o.robot) {
				if (o.game.team) teams[o.game.team].push(o.game.score);
			} else if (o.team) teams[o.team].push(o.game.score);
		}
		for (i = 1; i <= Const.TEAM_MAX; i++) if (o = teams[i].length) teams[i] = [o, teams[i].reduce(function (p, item) { return p + item; }, 0)];

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

			// Fix: null/undefined/NaN 점수를 0으로 처리 (typeof NaN === 'number'이므로 isNaN도 체크)
			var rawScore = (my.opts.survival && my.game.survivalDamageTracking)
				? o.game.survivalDamageDealt
				: o.game.score;
			var playerScore = (typeof rawScore === 'number' && !isNaN(rawScore)) ? rawScore : 0;
			// 음수 점수(리듬 미스 감점 등)는 합산 시 0으로 취급: 점차비(score/sumScore)가 0 근처 분모나 음수 분모로 왜곡되는 것 방지
			sumScore += Math.max(0, playerScore);

			var actualTeam = o.robot ? o.game.team : o.team;
			var teamScoreVal = playerScore; // 기본값은 개인 점수
			if (actualTeam && Array.isArray(teams[actualTeam]) && teams[actualTeam].length === 2) {
				teamScoreVal = teams[actualTeam][1];
			}

			res.push({
				id: o.id,
				score: playerScore,
				teamScore: teamScoreVal,
				dim: (actualTeam && Array.isArray(teams[actualTeam]) && teams[actualTeam].length === 2) ? teams[actualTeam][0] : 1,
				robot: o.robot,
				team: actualTeam,
				alive: o.game.alive,
				koOrder: o.game.survivalKOOrder || 0
			});
		}

		res.sort(function (a, b) {
			// 서바이벌 모드: KO 순서 기준 (먼저 KO = 낮은 순위, 생존자 우선)
			if (my.opts.survival) {
				var aAlive = a.koOrder === 0;
				var bAlive = b.koOrder === 0;
				if (aAlive !== bAlive) return bAlive ? 1 : -1;
				if (!aAlive && !bAlive) return b.koOrder - a.koOrder; // 늦게 KO = 높은 순위
				// 둘 다 생존: 데미지(또는 남은 HP) 내림차순 tiebreak
				return (b.score || 0) - (a.score || 0);
			}

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


		// 코옵 모드: 개별 기본 보상(아이템효과 적용 전)을 풀링해서 턴 수 비율로 재분배
		var coopRewardMap = null;
		if (my.rule.coop) {
			coopRewardMap = {};
			// 봇의 존재가 보상 곡선에 영향을 주지 않도록, 인원수(all)와 총점(ss) 모두 사람 기준으로만 계산한다.
			// "실인간 1명" 솔로 페널티는 getRewards 내부의 all<2 컷이 아니라 아래에서 실인간 수 기준으로 직접 적용한다.
			var coopFormulaAll = Math.max(2, humanCount);
			var coopHumanSumScore = 0;
			for (i in res) {
				if (!res[i].robot) coopHumanSumScore += res[i].score;
			}
			var coopActive = [];
			for (i in res) {
				if (res[i].robot) continue;
				var co = DIC[res[i].id];
				if (!co || !co.game) continue;
				var crw = getRewards(my.mode, res[i].score / res[i].dim, co.game.bonus, 1, coopFormulaAll, coopHumanSumScore, my.opts);
				var centry = { rw: crw, turns: co.game.coopTurns || 0 };
				coopRewardMap[co.id] = centry;
				coopActive.push(centry);
			}
			var coopPoolScore = 0, coopPoolMoney = 0, coopTurnDenom = 0;
			for (i in coopActive) {
				coopPoolScore += coopActive[i].rw.score;
				coopPoolMoney += coopActive[i].rw.money;
				coopTurnDenom += coopActive[i].turns;
			}
			if (coopActive.length === 1) {
				coopPoolScore *= 0.05;
				coopPoolMoney *= 0.5;
			}
			var coopSuccessMult = (data && data.coopSuccess) ? 1 : 0.1;
			for (i in coopActive) {
				var coopShare = coopTurnDenom > 0 ? coopActive[i].turns / coopTurnDenom : 0;
				coopActive[i].rw.score = Math.round(coopPoolScore * coopShare * coopSuccessMult);
				coopActive[i].rw.money = Math.round(coopPoolMoney * coopShare * coopSuccessMult);
				coopActive[i].rw.together = coopActive.length >= 2;
			}
		}

		// 달가루 모으기: 봇을 뺀 사람(손님 포함) 플레이어가 2명 이상 참여 시, 손님을 제외한 점수 합을 서버 전역 달가루 카운터에 누적
		if (my.rule.rule === 'Wordcollect') {
			var moonHumanCount = 0, moonSumScore = 0;
			for (i in res) {
				if (res[i].robot) continue;
				moonHumanCount++;
				var moPlayer = DIC[res[i].id];
				if (moPlayer && moPlayer.guest) continue;
				moonSumScore += res[i].score;
			}
			if (moonHumanCount >= 2) {
				var moonDelta = Math.floor(moonSumScore);
				if (moonDelta > 0) {
					if (DB.shared_collecting) {
						DB.shared_collecting.direct("UPDATE shared_collecting SET amount = amount + $1 WHERE id='moondust'", [moonDelta], function () {});
					}
					// 이번 판에서 모은 달가루 수를 공지 (조건 미충족/기여분 0이면 표출 안 함)
					narrate(my.players, 'chat', { code: 'wcRoundDust', v1: moonDelta, notice: true });
				}
			}
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

				// 클라이언트 explainReward()가 _score/_money/_blog를 읽으므로 누락 시 forEach 크래시 발생 → 초기화 필수
				res[i].reward = { score: 0, money: 0, _score: 0, _money: 0, _blog: [] };
				continue;
			}

			o = DIC[res[i].id];
			if (!o) continue; // Should not happen for non-robots
			var myHumanRank = userRankMap[o.id];
			// 서바이벌 모드: 한 번도 단어를 입력하지 않은 플레이어는 0점 처리 (경험치/보상 없음)
			var noReward = false;
			if (my.opts && my.opts.survival && !o.game.survivalSubmitted) {
				// applyEquipOptions를 스킵하므로 클라이언트 explainReward()가 참조하는 필드 직접 초기화
				rw = { score: 0, money: 0, _score: 0, _money: 0, _blog: [] };
				noReward = true;
			} else if (coopRewardMap) {
				rw = coopRewardMap[o.id] ? coopRewardMap[o.id].rw : { score: 0, money: 0, _score: 0, _money: 0, _blog: [] };
			} else {
				rw = getRewards(my.mode, res[i].score / res[i].dim, o.game.bonus, myHumanRank, humanCount, sumScore, my.opts);
			}

			rw.playTime = now - o.playAt;
			if (!noReward) o.applyEquipOptions(rw); // 착용 아이템 보너스 적용 (무행동 시 미적용)
			if (my.opts.unknown) {
				if (rw.score > 100) rw.score = 100;
				if (rw.money > 10) rw.money = 10;
			}
			// 바보 모드: 보상 항상 0 (착용 아이템 보너스 포함)
			if (Const.GAME_TYPE[my.mode] === 'XBB') {
				rw.score = 0;
				rw.money = 0;
			}
			// 슉슉/양말대전: 보드가 고갈되지 않아 누적 점수가 무제한으로 커질 수 있어 라운드당 소프트 트랜지션을 둔다
			// 참고: 클로드가 양말대전이라 한건 사실 솎솎(sock)이다
			if (['KSK', 'ESK', 'KSS', 'ESS', 'JSS'].indexOf(Const.GAME_TYPE[my.mode]) !== -1) rw.score = softTransition(rw.score);
			if (my.opts.stop) rw.score = Math.round(rw.score * 0.4);
			if (my.opts.big) {
				rw.score = Math.round(rw.score / 2);
				rw.money = Math.round(rw.money / 2);
			}
			var _em = getEventMults();
			if (rw.together) {
				if (o.game.wpc) o.game.wpc.forEach(function (item) { o.obtain("$WPC" + item, 1); }); // 글자 조각 획득 처리
				var _wpcCount = o.game.wpc ? o.game.wpc.length : 0;
				if (_wpcCount > 0 && _em.itemmul > 0 && _em.eventItems.length > 0) {
					var _rawCount = _wpcCount * _em.itemmul;
					var _giveCount = Math.floor(_rawCount) + (Math.random() < (_rawCount % 1) ? 1 : 0);
					for (var _ei = 0; _ei < _giveCount; _ei++) {
						var _item = _em.eventItems[Math.floor(Math.random() * _em.eventItems.length)];
						o.obtain(_item, 1);
					}
				}
				o.onOKG(rw.playTime);
			}
			rw.score = Math.round((rw.score || 0) * _em.expmul);
			rw.money = Math.round((rw.money || 0) * _em.mnymul);
			res[i].reward = rw;
			if (typeof o.data.score !== 'number' || isNaN(o.data.score)) o.data.score = 0;
			o.data.score += rw.score || 0;
			o.money += rw.money || 0;
			if (typeof o.data.record[Const.GAME_TYPE[my.mode]][2] !== 'number' || isNaN(o.data.record[Const.GAME_TYPE[my.mode]][2])) o.data.record[Const.GAME_TYPE[my.mode]][2] = 0;
			o.data.record[Const.GAME_TYPE[my.mode]][2] += rw.score || 0;
			o.data.record[Const.GAME_TYPE[my.mode]][3] += rw.playTime;
			if (!my.practice && rw.together) {
				o.data.record[Const.GAME_TYPE[my.mode]][0]++;
				if (res[i].rank == 0) o.data.record[Const.GAME_TYPE[my.mode]][1]++;
			}
			users[o.id] = o.getData();

			suv.push(withTimeout(o.flush(true), 5000, { id: o.id, prev: 0 }));
		}
		// 봇 결과 참조 캡처 (비동기 콜백 안에서 사용)
		var botResults = [];
		for (var _bi in res) {
			if (!res[_bi].robot) continue;
			var _bot = my.players.find(function (p) { return p && p.robot && p.id === res[_bi].id; });
			if (_bot) botResults.push({ bot: _bot, rank: res[_bi].rank, team: res[_bi].team || 0, teamScore: res[_bi].teamScore });
		}

		// 위 개별 타임아웃(5초 + 5초) 덕분에 정상적으로는 항상 그 안에 끝난다.
		// 이 타이머는 그래도 걸릴 경우를 대비한 최후 안전망이다.
		var _roundEndSettled = false;
		var _roundEndTimeoutTimer = setTimeout(function () {
			if (_roundEndSettled) return;
			_roundEndSettled = true;
			JLog.error(`[roundEnd] DB flush/rank lookup timed out, sending fallback result: room=${my.id}`);
			my.byMaster('roundEnd', { result: res, users: users, ranks: {}, data: data }, true);
			my._roundEnding = false;
		}, 11000);

		Promise.all(suv).then(function (uds) {
			if (_roundEndSettled) return;
			var o = {};

			suv = [];
			for (i in uds) {
				o[uds[i].id] = { prev: uds[i].prev };
				suv.push(withTimeout(DB.redis.getSurround(uds[i].id), 5000, { target: uds[i].id, data: [] }));
			}
			Promise.all(suv).then(function (ranks) {
				if (_roundEndSettled) return;
				clearTimeout(_roundEndTimeoutTimer);
				_roundEndSettled = true;
				var i, j;

				for (i in ranks) {
					if (!o[ranks[i].target]) continue;

					o[ranks[i].target].list = ranks[i].data;
				}
				my.byMaster('roundEnd', { result: res, users: users, ranks: o, data: data }, true);
				my._roundEnding = false;

				// 봇 게임 결과 반응 (40% 확률)
				var _isTeamGame = res.length > 0 && res[0].team > 0;
				var _topScore = res.length > 0 ? (_isTeamGame ? res[0].teamScore : res[0].score) : 0;
				var _lastScore = res.length > 0 ? (_isTeamGame ? res[res.length - 1].teamScore : res[res.length - 1].score) : 0;
				var _totalPlayers = res.length;
				for (var _ri = 0; _ri < botResults.length; _ri++) {
					(function (_br) {
						if (_br.bot.muteLobby || _br.bot._rageQuitting) return;
						if (Math.random() > 0.4) return;
						var myScore = _isTeamGame ? _br.teamScore : _br.rank;
						var isWinner = _isTeamGame
							? (_br.team > 0 && _br.teamScore === _topScore)
							: _br.rank === 0;
						var isLoser = _totalPlayers > 2 && (_isTeamGame
							? (_br.team > 0 && _br.teamScore === _lastScore && _br.teamScore !== _topScore)
							: (_br.rank === res[res.length - 1].rank && _br.rank !== 0));
						var msgs = isWinner ? Const.ROBOT_GAME_WIN_MESSAGES
							: isLoser ? Const.ROBOT_GAME_LOSE_MESSAGES
								: Const.ROBOT_GAME_MID_MESSAGES;
						setTimeout(function () {
							if (!_br.bot._rageQuitting && !_br.bot._removed && typeof _br.bot.chat === 'function') _br.bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
						}, 1500 + Math.floor(Math.random() * 2000));
					})(botResults[_ri]);
				}

				// 봇 대기 중 잡담 "ㄹㄷ/ㄱㄱ" (35% 확률, 게임이 다시 시작 안 됐을 때만)
				if (!my._botIdleTimers) my._botIdleTimers = [];
				for (var _ii = 0; _ii < botResults.length; _ii++) {
					(function (_br) {
						if (_br.bot.muteLobby || _br.bot._rageQuitting) return;
						if (Math.random() > 0.6) return;
						var _t = setTimeout(function () {
							var idx = my._botIdleTimers ? my._botIdleTimers.indexOf(_t) : -1;
							if (idx !== -1) my._botIdleTimers.splice(idx, 1);
							if (!my.gaming && !_br.bot._rageQuitting && !_br.bot._removed && typeof _br.bot.chat === 'function') {
								var msgs = Const.ROBOT_IDLE_MESSAGES;
								_br.bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
							}
						}, 5000 + Math.floor(Math.random() * 20000));
						if (my._botIdleTimers) my._botIdleTimers.push(_t);
					})(botResults[_ii]);
				}

				// 봇 장기 대기 잡담 (90% 확률, 게임 종료 후 1~5분 사이)
				for (var _li = 0; _li < botResults.length; _li++) {
					(function (_br) {
						if (_br.bot.muteLobby || _br.bot._rageQuitting) return;
						if (Math.random() > 0.9) return;
						var delay = 60000 + Math.floor(Math.random() * 240000); // 1~5분
						var _t2 = setTimeout(function () {
							var idx = my._botIdleTimers ? my._botIdleTimers.indexOf(_t2) : -1;
							if (idx !== -1) my._botIdleTimers.splice(idx, 1);
							if (!my.gaming && !_br.bot._rageQuitting && !_br.bot._removed && typeof _br.bot.chat === 'function') {
								var msgs = Const.ROBOT_IDLE2_MESSAGES;
								_br.bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
							}
						}, delay);
						if (my._botIdleTimers) my._botIdleTimers.push(_t2);
					})(botResults[_li]);
				}
			});
		});
		// 서바이벌/코옵 모드가 게임 중 강제로 바꿔둔 라운드 수를 방 설정용 원래 값으로 복원
		if (my.originalRound !== undefined) {
			my.round = my.originalRound;
			delete my.originalRound;
		}
		my.gaming = false;
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
			if (Cluster.isMaster) {
				DiscordRelay("game-over", { room: my.id, rankings: rankings });
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
		delete my.game.leftScores; // 게임 중 참여: 나간 사람의 보관 점수는 이번 게임 한정
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
		// 아이템전 상태 정리
		if (my.game.pendingItems) {
			for (var pid in my.game.pendingItems) {
				my.byMaster('item-dequeued', { playerId: pid }, true);
			}
		}
		delete my.game.items;
		delete my.game.itemGlobalTurnCount;
		delete my.game.bonusScore;
		delete my.game.pendingItems;
		delete my.game.reversed;
		delete my.game.linkOverride;
		my.setAutoDelete();
	};
	my.byMaster = function (type, data, nob) {
		// 중도 입장 관전자에게 현재 라운드/차례 정보를 다시 보여주기 위해 마지막 페이로드를 보관
		if (my.game && (type == "roundReady" || type == "turnStart")) {
			if (type == "roundReady") {
				my.game.specRR = data;
				my.game.specTS = null;
			} else {
				my.game.specTS = { data: data, at: (new Date()).getTime() };
			}
		}
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
			} else if (my.rule.rule == "Landgrab") {
				if (my.game.board) {
					obj.board = my.game.board.map(function (c) { return c.chosung; });
					obj.owners = my.game.board.map(function (c) { return c.owner; });
					obj.homes = my.game.board.map(function (c) { return c.isHome; });
					obj.round = my.game.round;
					if (!my.game.late && my.game.roundAt) {
						obj.roundTime = Math.max(0, my.game.roundTime - ((new Date()).getTime() - my.game.roundAt));
					}
				}
			} else if (my.rule.rule == "Flip") {
				if (my.game.board) {
					obj.board = my.game.board.map(function (c) { return c.word; });
					obj.owners = my.game.board.map(function (c) { return c.owner; });
					obj.round = my.game.round;
					if (!my.game.late && my.game.roundAt) {
						obj.roundTime = Math.max(0, my.game.roundTime - ((new Date()).getTime() - my.game.roundAt));
					}
				}
			} else if (my.rule.rule == "Center") {
				if (my.game.board) {
					obj.board = my.game.board;
					obj.rect = my.game.rect;
					obj.round = my.game.round;
					if (!my.game.late && my.game.roundAt) {
						obj.roundTime = Math.max(0, my.game.roundTime - ((new Date()).getTime() - my.game.roundAt));
					}
				}
			} else if (my.rule.rule == "Sudoku") {
				var sudokuState = Rule.Sudoku.getSpecState.call(my);
				if (sudokuState) obj.sudoku = sudokuState;
			} else if (my.rule.rule == "Wordcollect") {
				if (my.game.condition) {
					obj.round = my.game.round;
					obj.condition = my.game.condition.code;
					obj.words = my.game.words;
					obj.totalScore = my.game.totalScore;
					if (!my.game.late && my.game.roundAt) {
						obj.roundTime = Math.max(0, my.game.roundTime - ((new Date()).getTime() - my.game.roundAt));
					}
				}
			}
			if (my.rule.rule == "Rhythm" && my.game.chart) {
				obj.round = my.game.round;
				obj.rhythm = { song: my.game.song, title: my.game.title, bpm: my.game.chart.bpm, res: my.game.chart.res, seq: my.game.chart.seq, win: my.game.chart.win, speed: my.game.chart.speed, startAt: my.game.startAt, now: (new Date()).getTime() };
			}
			if (my.rule.rule == "Rtype" && my.game.notes) {
				obj.round = my.game.round;
				obj.rtype = {
					song: my.game.song, title: my.game.title, bpm: my.game.chart.bpm, res: my.game.chart.res, seq: my.game.chart.seq, win: my.game.chart.win, speed: my.game.chart.speed,
					keys: my.game.keys, words: my.game.words.map(function (w) { return { text: w.text, n: w.n }; }),
					startAt: my.game.startAt, now: (new Date()).getTime()
				};
			}
			// 보드형 모드는 위에서 따로 처리. 그림퀴즈는 roundReady에 정답이 들어 있어 제외
			if (SPEC_REPLAY_SKIP.indexOf(my.rule.rule) == -1 && my.game.specRR) {
				obj.specRound = my.game.specRR;
				if (!my.game.late && my.game.specTS) {
					var specElapsed = (new Date()).getTime() - my.game.specTS.at;
					obj.specTurn = {};
					for (i in my.game.specTS.data) obj.specTurn[i] = my.game.specTS.data[i];
					if (typeof obj.specTurn.turnTime == "number") obj.specTurn.turnTime = Math.max(0, obj.specTurn.turnTime - specElapsed);
					if (typeof obj.specTurn.roundTime == "number") obj.specTurn.roundTime = Math.max(0, obj.specTurn.roundTime - specElapsed);
				}
			}
			obj.spec = {};
			for (i in my.game.seq) {
				// Fix: 봇도 포함하도록 수정
				o = DIC[my.game.seq[i]] || my.game.seq[i];
				if (o && o.id) {
					// 서바이벌: 관전자/뒤늦게 들어온 클라이언트가 KO 상태를 알 수 있도록 alive 포함
					obj.spec[o.id] = {
						score: o.game ? o.game.score : 0,
						alive: o.game ? (o.game.alive !== false) : true
					};
				}
			}
			if (my.opts.item && my.game.pendingItems) {
				obj.pendingItems = my.game.pendingItems;
			}
		}
		if (my.practice) {
			if (DIC[my.master || target]) DIC[my.master || target].send('room', obj);
		} else {
			publish('room', obj, my.password);
		}
	};
	my.turnStart = function (force) {
		if (!my.gaming) return;

		// 차례 진행 중 표시: 정답 처리 후 turnNext 예약까지의 틈(late && inTurn)을 라운드 사이(late && !inTurn)와 구분한다
		my.game.inTurn = true;
		return my.route("turnStart", force);
	};
	// ========== 아이템전 큐/발동/지급 ==========
	my.queueItem = function (player, itemType) {
		if (!my.gaming || my._roundEnding || !my.game.items) { return; }
		var items = my.game.items[player.id];
		if (!items || (items[itemType] || 0) <= 0) { return; }

		my.dequeueItem(player);
		my.game.pendingItems[player.id] = { itemType: itemType };
		my.byMaster('item-queued', { playerId: player.id, itemType: itemType }, true);
	};
	my.dequeueItem = function (player) {
		if (!my.game.pendingItems || !my.game.pendingItems[player.id]) return;
		delete my.game.pendingItems[player.id];
		my.byMaster('item-dequeued', { playerId: player.id }, true);
	};
	my.consumeItem = function (playerId, itemType, silent) {
		var id = (playerId && typeof playerId === 'object' && playerId.id) ? playerId.id : playerId;
		var items = my.game.items[id];
		if (!items || (items[itemType] || 0) <= 0) return false;
		items[itemType]--;
		delete my.game.pendingItems[id];
		if (!silent) my.byMaster('item-used', { playerId: id, itemType: itemType }, true);
		return true;
	};
	my.getAvailableItems = function () {
		var items = ['skip', 'pass', 'random'];
		if (my.game.seq.length > 2) items.push('reverse');
		if (my.rule.rule === 'Classic') items.push('linkChange');
		return items;
	};
	my.giveRandomItem = function (playerId) {
		var id = (playerId && typeof playerId === 'object' && playerId.id) ? playerId.id : playerId;
		var pObj = (playerId && typeof playerId === 'object') ? playerId : DIC[id];
		if (pObj && pObj.robot) return;
		var availableItems = my.getAvailableItems();
		if (!my.game.items[id]) {
			var itemObj = { skip: 0, pass: 0, random: 0 };
			if (my.game.seq && my.game.seq.length > 2) itemObj.reverse = 0;
			if (my.rule && my.rule.rule === 'Classic') itemObj.linkChange = 0;
			my.game.items[id] = itemObj;
		}
		var items = my.game.items[id];
		var candidates = availableItems.filter(function (t) { return (items[t] || 0) < Const.ITEM_MAX_COUNT; });
		if (candidates.length === 0) { return; }
		var itemType = candidates[Math.floor(Math.random() * candidates.length)];
		items[itemType] = (items[itemType] || 0) + 1;
		var player = DIC[id];
		if (player && player.send) player.send('item-given', { itemType: itemType, count: items[itemType] });
	};
	my.checkItemGrant = function (playerId, bonusPoints, success) {
		if (!success) return;

		my.game.itemGlobalTurnCount = (my.game.itemGlobalTurnCount || 0) + 1;
		if (my.game.itemGlobalTurnCount % Const.ITEM_GRANT_INTERVAL === 0) {
			for (var i = 0; i < my.game.seq.length; i++) {
				var pid = my.game.seq[i];
				if (my.opts.survival) {
					var p = DIC[pid] || pid;
					if (!p || !p.game || !p.game.alive) continue;
				}
				my.giveRandomItem(pid);
			}
		}

		if (bonusPoints > 0) {
			my.game.bonusScore[playerId] = (my.game.bonusScore[playerId] || 0) + bonusPoints;
			if (my.game.bonusScore[playerId] >= Const.ITEM_BONUS_THRESHOLD) {
				my.giveRandomItem(playerId);
				my.game.bonusScore[playerId] = 0;
			}
		}

		if (my.opts.chaos) my.checkChaos();
	};
	my.checkChaos = function () {
		if (!my.gaming || !my.game.seq || my.game.seq.length === 0) return;

		// pending 없는 플레이어만 후보 (서바이벌: 생존자만)
		var candidates = my.game.seq.filter(function (seqItem) {
			var id = seqItem && seqItem.id ? seqItem.id : seqItem;
			if (my.game.pendingItems[id]) return false;
			if (my.opts.survival) {
				var p = DIC[id] || seqItem;
				if (!p || !p.game || !p.game.alive) return false;
			}
			return true;
		});

		// 10% 확률 reverse
		if (candidates.length > 0 && Math.random() < Const.CHAOS_REVERSE_CHANCE) {
			var pick = candidates[Math.floor(Math.random() * candidates.length)];
			var pickId = pick && pick.id ? pick.id : pick;
			if (my.game.items[pickId]) {
				my.game.items[pickId].reverse = (my.game.items[pickId].reverse || 0) + 1;
			}
			my.game.pendingItems[pickId] = { itemType: 'reverse', chaos: true };
			candidates = candidates.filter(function (c) {
				var id = c && c.id ? c.id : c;
				return id !== pickId;
			});
		}

		// 5% 확률 linkChange (Classic 전용)
		if (my.rule.rule === 'Classic' && candidates.length > 0 && Math.random() < Const.CHAOS_LINK_CHANCE) {
			var pick2 = candidates[Math.floor(Math.random() * candidates.length)];
			var pickId2 = pick2 && pick2.id ? pick2.id : pick2;
			if (my.game.items[pickId2]) {
				my.game.items[pickId2].linkChange = (my.game.items[pickId2].linkChange || 0) + 1;
			}
			my.game.pendingItems[pickId2] = { itemType: 'linkChange', chaos: true };
		}
	};
	my._defaultNextTurn = function (fromIndex) {
		var n = my.game.seq.length;
		var dir = my.game.reversed ? -1 : 1;
		var start = (fromIndex !== undefined) ? fromIndex : my.game.turn;
		var next = ((start + dir) % n + n) % n;
		if (my.opts.survival) {
			var attempts = 0;
			while (attempts < n) {
				var p = DIC[my.game.seq[next]] || my.game.seq[next];
				if (p && p.game && p.game.alive) break;
				next = ((next + dir) % n + n) % n;
				attempts++;
			}
		}
		return next;
	};
	// 랜덤턴 "2벌 가방" 셔플에서 다음 슬롯을 뽑아 전진하는 단일 창구.
	// applySurvivalDamage(제출 경로)와 turnNext(타임아웃 경로) 둘 다 이 함수만 호출해서
	// 가방 포인터를 갱신하므로, 두 경로가 각자 계산해서 어긋나는 일이 없음.
	// (예전에는 turnNext가 indexOf()로 포인터를 "해당 인덱스의 첫 번째 사본" 위치로
	// 되돌렸는데, 사본이 2개라 실제 스캔 위치와 달라져 포인터가 좁은 구간에 갇히는
	// 버그가 있었음 — 특정 인원 사이만 반복되거나 한 사람만 계속 걸리는 원인)
	// 랜덤턴: seq[seqIndex]가 빠질 때 가방을 새로 섞지 않고 남은 순서를 그대로 보정한다.
	// (예전에는 새로 섞고 turn을 가방 첫 칸으로 바꿔서, 남이 나가기만 해도 현재 차례 주인이 조용히 바뀌었음
	//  → 원래 차례인 사람의 제출이 거부되고, 시간 초과 벌점은 차례 알림을 못 받은 사람에게 감)
	// randomTurnIndex는 "마지막으로 뽑은 칸"이므로, 그 이하에서 빠진 칸 수만큼 당긴다.
	my.removeFromRandomBag = function (seqIndex) {
		var order = my.game.randomTurnOrder || [];
		var drawn = my.game.randomTurnIndex || 0; // 원래 위치와 비교해야 함 (줄여 가는 idx와 비교하면 둘째 칸을 덜 당김)
		var idx = drawn;
		var out = [];
		for (var k = 0; k < order.length; k++) {
			if (order[k] === seqIndex) {
				if (k <= drawn) idx--;
				continue;
			}
			out.push(order[k] > seqIndex ? order[k] - 1 : order[k]);
		}
		my.game.randomTurnOrder = out;
		my.game.randomTurnIndex = idx;
	};
	// 랜덤턴: 게임 중 참여한 seq[seqIndex]의 칸 2개를 남은 가방에 넣고 남은 부분만 다시 섞는다
	// (이미 뽑은 칸은 그대로라 현재 차례 주인은 바뀌지 않고, 가방이 끝날 때까지 기다리지 않아도 됨)
	my.addToRandomBag = function (seqIndex) {
		var order = my.game.randomTurnOrder || [];
		var cut = Math.max(0, Math.min((my.game.randomTurnIndex || 0) + 1, order.length));
		my.game.randomTurnOrder = order.slice(0, cut).concat(shuffle(order.slice(cut).concat([seqIndex, seqIndex])));
	};
	// 사람·봇 퇴장 공용: seq[seqIndex]를 빼고 turn과 랜덤 턴 가방을 맞춘다.
	// 현재 차례가 아닌 사람이 빠지면 현재 차례 주인을 그대로 유지한다.
	// 현재 차례 주인이 빠지면 순차 진행은 다음 사람이 그 자리를 잇고,
	// redraw면 랜덤 턴은 가방에서 다음 차례를 다시 뽑는다 (turnEnd로 라운드가 끝나 다음 라운드 첫 차례가 되는 경우).
	my.spliceSeq = function (seqIndex, redraw) {
		var isTurn = my.game.turn == seqIndex;
		// 정답 처리 후 turnNext가 이미 예약된 틈에 차례 주인이 빠짐: 라운드는 그대로 이어지고 예약된 turnNext가 다음 차례를 정한다
		var gap = isTurn && my.game.late && my.game.inTurn;
		my.game.seq.splice(seqIndex, 1);
		if (my.opts.randomturn) my.removeFromRandomBag(seqIndex);
		if (my.game.turn > seqIndex) {
			my.game.turn--;
			if (my.game.turn < 0) my.game.turn = my.game.seq.length - 1;
		}
		if (my.game.turn >= my.game.seq.length) my.game.turn = 0;
		if (gap) {
			my.setTurnAfterLeft(seqIndex);
			return;
		}
		if (isTurn && redraw && my.opts.randomturn && my.game.seq.length > 0) {
			var slot = my._nextRandomTurnSlot();
			if (slot !== null && slot !== undefined) my.game.turn = slot;
		}
	};
	// 현재 차례 주인이 빠졌는데 turnEnd로 라운드를 끝내지 못한 경우(서바이벌·turnEnd 예외 등):
	// 남은 턴 타이머가 다음 사람에게 대신 벌점을 주지 않도록 지우고, 2초 뒤 다음 차례로 넘긴다. spliceSeq 뒤에 호출.
	my.skipLeftTurn = function (seqIndex) {
		if (!my.game.seq.length) return;
		clearTimeout(my.game.turnTimer);
		clearTimeout(my.game.robotTimer);
		clearTimeout(my.game._rrt);
		my.game.late = true; // 다음 turnStart 전까지 제출을 막아 turnNext가 두 번 실행되지 않게 함
		my.setTurnAfterLeft(seqIndex);
		my.game._rrt = setTimeout(function () { if (my.gaming) my.turnNext(); }, 2000);
	};
	// 차례 주인 seq[seqIndex]가 빠진 직후(spliceSeq 뒤) 다음 turnNext가 원래 다음 사람에게 가도록 turn을 그 사람에게 두고 표시한다.
	// (예전에는 turn이 다음 사람을 가리킨 채 turnNext가 한 칸 더 넘겨서, 정답 직후 나가면 다음 사람이 건너뛰어졌음)
	// 진행 방향이 반대(reverse)면 다음 사람은 빠진 칸의 앞 칸이다.
	my.setTurnAfterLeft = function (seqIndex) {
		var n = my.game.seq.length;
		if (!n) return;
		my.game.turn = my.game.reversed ? (seqIndex - 1 + n) % n : seqIndex % n;
		my.game.turnOwnerLeft = true;
	};
	my._nextRandomTurnSlot = function () {
		var n = my.game.seq.length;
		var maxAttempts = n * 2 + 4;
		var attempts = 0;
		while (attempts < maxAttempts) {
			my.game.randomTurnIndex++;
			if (!my.game.randomTurnOrder || my.game.randomTurnIndex >= my.game.randomTurnOrder.length) {
				my.game.randomTurnIndex = 0;
				my.game.randomTurnOrder = [];
				for (var rt = 0; rt < n; rt++) {
					if (my.opts.survival) {
						var rp = DIC[my.game.seq[rt]] || my.game.seq[rt];
						if (rp && rp.game && rp.game.alive) {
							my.game.randomTurnOrder.push(rt);
							my.game.randomTurnOrder.push(rt);
						}
					} else {
						my.game.randomTurnOrder.push(rt);
						my.game.randomTurnOrder.push(rt);
					}
				}
				my.game.randomTurnOrder = shuffle(my.game.randomTurnOrder);
				if (my.game.randomTurnOrder.length === 0) return null;
			}
			var candidate = my.game.randomTurnOrder[my.game.randomTurnIndex];
			if (my.opts.survival) {
				var cp = DIC[my.game.seq[candidate]] || my.game.seq[candidate];
				if (!cp || !cp.game || !cp.game.alive) { attempts++; continue; }
			}
			return candidate;
		}
		return null;
	};
	// ownerLeft: 차례 주인이 빠져 turn이 이미 다음 사람을 가리킴(setTurnAfterLeft) — 그 사람부터 따지고, 그 사람의 차례 후 아이템은 발동하지 않는다
	my.calculateNextTurn = function (peek, ownerLeft) {
		var seq = my.game.seq;
		var n = seq.length;
		var cur = my.game.turn;
		var currentId = seq[cur];
		var pending = my.game.pendingItems;
		// seq에 봇 객체가 섞여 있을 수 있으므로 ID 문자열로 정규화
		var sid = function (s) { return (s && typeof s === 'object' && s.id) ? s.id : s; };
		var curPending = ownerLeft ? null : pending[sid(currentId)];
		var randomJump = false;
		var isReversed = my.game.reversed;

		// 1. 현재 플레이어의 afterTurn 아이템 처리 (skip, random)
		if (curPending) {
			if (curPending.itemType === 'random') {
				if (!peek) my.consumeItem(sid(currentId), 'random');
				var candidates = seq.filter(function (id) {
					if (my.opts.survival) { var p = DIC[sid(id)] || id; return p && p.game && p.game.alive; }
					return true;
				});
				if (candidates.length > 0) {
					var chosen = candidates[Math.floor(Math.random() * candidates.length)];
					var chosenIdx = seq.indexOf(chosen);
					var chosenPending = pending[sid(chosen)];
					if (chosenPending && chosenPending.itemType === 'pass') {
						if (!peek) my.consumeItem(sid(chosen), 'pass');
						cur = chosenIdx;
						randomJump = true;
					} else {
						return chosenIdx;
					}
				}
			}
		}

		var skipLeft = 0;
		if (!randomJump && curPending && curPending.itemType === 'skip') {
			skipLeft = 1;
			if (!peek) my.consumeItem(sid(currentId), 'skip');
		}

		// 2~3. 반복 계산 루프 (reverse, linkChange, pass를 도달 시 처리)
		var dir = isReversed ? -1 : 1;
		var next = ownerLeft ? ((cur - dir) % n + n) % n : cur;
		var visited = 0;
		var totalIter = 0; // 절대 카운터: visited--로 인한 무한 루프 방지

		while (visited <= n && totalIter <= n * 2 + n) {
			visited++;
			totalIter++;
			next = ((next + dir) % n + n) % n;
			if (my.opts.survival) {
				var p = DIC[seq[next]] || seq[next];
				if (!p || !p.game || !p.game.alive) {
					// KO된 플레이어의 stale pending item 즉시 정리
					delete pending[sid(seq[next])];
					visited--;
					continue;
				}
			}
			if (skipLeft > 0) { skipLeft--; continue; }
			var nextPending = pending[sid(seq[next])];
			if (!nextPending) break;

			// reverse: 해당 플레이어 도달 시 방향 반전, cur 위치로 리셋
			if (nextPending.itemType === 'reverse') {
				isReversed = !isReversed;
				dir = isReversed ? -1 : 1;
				if (!peek) {
					my.game.reversed = isReversed;
					my.consumeItem(sid(seq[next]), 'reverse', nextPending.chaos);
					if (nextPending.chaos) {
						my.byMaster('chaos-notice', {
							code: isReversed ? 'chaosReverseLeft' : 'chaosReverseRight'
						}, true);
					}
				}
				next = cur;
				continue;
			}
			// linkChange: 해당 플레이어 도달 시 linkOverride 설정, 해당 플레이어 턴 시작
			if (nextPending.itemType === 'linkChange') {
				if (!peek) {
					my.game.linkOverride = Const.getLinkOverrideType(my.opts);
					my.consumeItem(sid(seq[next]), 'linkChange', nextPending.chaos);
					if (nextPending.chaos) {
						my.byMaster('chaos-notice', {
							code: my.game.linkOverride === 'middle' ? 'chaosMidLink' : 'chaosEndLink'
						}, true);
					}
				}
				break;
			}
			// pass: 통과
			if (nextPending.itemType === 'pass') {
				if (!peek) my.consumeItem(sid(seq[next]), 'pass');
				continue;
			}
			break;
		}

		if (visited > n || totalIter > n * 2 + n) return ownerLeft ? cur : my._defaultNextTurn();
		return next;
	};
	// ========== 아이템전 끝 ==========

	my.readyRobot = function (robot) {
		if (!my.gaming) return;

		return my.route("readyRobot", robot);
	};
	my.turnRobot = function (robot, text, data) {
		if (!my.gaming) return;
		// 서바이벌: DB 조회 완료 전에 KO된 봇의 stale robotTimer 방지 (버그 #6 수정)
		if (my.opts.survival && robot && robot.game && !robot.game.alive) return;

		my.submit(robot, text, data);
		//return my.route("turnRobot", robot, text);
	};
	my.turnNext = function (force) {
		if (!my.gaming) return;
		if (!my.game.seq) return;
		var ownerLeft = my.game.turnOwnerLeft;
		delete my.game.turnOwnerLeft;

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
					if (team && team >= 1 && team <= Const.TEAM_MAX) {
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
				try {
					my.roundEnd();
				} catch (_e) {
					JLog.error(`[diag#4] roundEnd (from turnNext) THREW: ${_e && _e.stack || _e}`);
					throw _e;
				}
				return;
			}
		}

		// 아이템 효과 발동 조건 (opts.item이 없어도 실제 효과가 있으면 적용)
		var _itemTurnActive = my.opts.item || my.game.reversed ||
			(my.game.pendingItems && Object.keys(my.game.pendingItems).length > 0);
		if (_itemTurnActive) {
			if (my.game.hasOwnProperty('_survivalCachedTarget')) {
				// applySurvivalDamage가 이미 커밋한 타겟 — 재계산 없이 그대로 사용
				var _cachedIdx = my.game._survivalCachedTarget;
				delete my.game._survivalCachedTarget;
				my.game.turn = _cachedIdx;
				if (my.opts.survival) {
					var _cp = DIC[my.game.seq[_cachedIdx]] || my.game.seq[_cachedIdx];
					if (!_cp || !_cp.game || !_cp.game.alive) {
						// 데미지로 KO된 경우 현재 방향으로 다음 생존자 탐색
						my.game.turn = my._defaultNextTurn(_cachedIdx);
					}
				}
			} else {
				// 타임아웃 등 일반 경로
				var timedOutId = my.game.seq[my.game.turn];
				var timedOutIdStr = (timedOutId && typeof timedOutId === 'object' && timedOutId.id) ? timedOutId.id : timedOutId;
				if (force && !ownerLeft && my.game.pendingItems && my.game.pendingItems[timedOutIdStr]) {
					my.dequeueItem(DIC[timedOutIdStr] || { id: timedOutIdStr });
				}
				my.game.turn = my.calculateNextTurn(false, ownerLeft);
			}
		} else if (my.opts.randomturn) {
			var _slot;
			if (my.game.hasOwnProperty('_survivalCachedTarget')) {
				// applySurvivalDamage가 _nextRandomTurnSlot으로 이미 가방 포인터까지 커밋한 타겟
				_slot = my.game._survivalCachedTarget;
				delete my.game._survivalCachedTarget;
			} else {
				// 타임아웃 등 일반 경로: 같은 가방에서 이어서 추첨 (제출 경로와 동일한 창구)
				_slot = my._nextRandomTurnSlot();
			}
			my.game.turn = (_slot !== null && _slot !== undefined) ? _slot : my._defaultNextTurn();
			if (my.opts.survival) {
				var _tp = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
				if (!_tp || !_tp.game || !_tp.game.alive) {
					my.game.turn = my._defaultNextTurn();
				}
			}
		} else {
			// 기존 로직: 순차 진행
			my.game.turn = my.calculateNextTurn(false, ownerLeft);
			// 서바이벌 안전망: _defaultNextTurn 루프 소진 시 dead 플레이어 반환 방지 (버그 #2 수정)
			if (my.opts.survival) {
				var _nextP = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
				if (!_nextP || !_nextP.game || !_nextP.game.alive) {
					my.roundEnd();
					return;
				}
			}
		}

		my.turnStart(force);
	};
	my.turnEnd = function () {
		// 서바이벌 모드: 타임아웃 시 KO 처리는 각 게임 규칙 파일에서 처리
		// 여기서는 route만 호출
		my.game.inTurn = false;
		var r = my.route("turnEnd");
		// 게임 중 참여: 턴제는 시간 초과(차례 주인 퇴장 포함)로 라운드가 끝나므로 다음 roundReady 전까지는 대기열로 받는다
		if (my.gaming && my.game) my.game.roundOver = true;
		return r;
	};
	my.submit = function (client, text, data) {
		// 욕설 필터: 규칙 활성화 시 다른 조건보다 먼저 검사
		if (my.opts.noswear && text && checkSwearWords(text).length > 0) {
			if (client.robot) {
				// 봇: 후보 리스트에서 욕설을 일괄 제거 후 첫 번째 깨끗한 후보 제출
				if (client.data && client.data.candidates) {
					client.data.candidates = client.data.candidates.filter(function (w) {
						return w && checkSwearWords(w._id).length === 0;
					});
					client.data.candidateIndex = 0;
					if (client.data.candidates.length > 0) {
						return my.route("submit", client, client.data.candidates[0]._id, data);
					}
				}
				// 깨끗한 후보 없음: denied 동작 (charMsg + defeatMsg)
				if (!client.muteGame && !my.game.late) {
					if (my.game.char) {
						var char = my.game.char;
						var charMsgs = [char + char + char, char + "..", char + "??", char + "... T.T"];
						setTimeout(function () {
							client.chat(charMsgs[Math.floor(Math.random() * charMsgs.length)]);
						}, 300);
					}
					var defeatMsg = (client.anger >= 6)
						? Const.ROBOT_ANGRY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_ANGRY_MESSAGES.length)]
						: Const.ROBOT_DEFEAT_MESSAGES[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES.length)];
					setTimeout(function () {
						client.chat(defeatMsg);
					}, 800);
				}
				return; // 턴 타이머가 턴 종료 처리
			}
			client.chat(censorSwearWords(text));
			return;
		}
		return my.route("submit", client, text, data);
	};
	my.handleDraw = function (client, msg) {
		return my.route("handleDraw", client, msg);
	};
	my.handleFill = function (client, msg) {
		return my.route("handleFill", client, msg);
	};
	my.handleClear = function (client, msg) {
		return my.route("handleClear", client, msg);
	};
	my.handleUndo = function (client) {
		return my.route("handleUndo", client);
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

// 낮은 x → y ≈ x (기울기 1), 높은 x → y ≈ x*ratio (기울기 ratio), breakpoint 부근에서 부드럽게 전환
function softTransition(x, opts) {
	opts = opts || {};
	var breakpoint = typeof opts.breakpoint === 'undefined' ? 4000 : opts.breakpoint;
	var ratio = typeof opts.ratio === 'undefined' ? 0.1 : opts.ratio;
	var smoothness = typeof opts.smoothness === 'undefined' ? 3000000 : opts.smoothness;
	var offset = typeof opts.offset === 'undefined' ? 208.5 : opts.offset;
	var low = x + offset;
	var high = ratio * (x - breakpoint) + breakpoint;
	return (low + high - Math.sqrt((low - high) * (low - high) + smoothness)) / 2;
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
function getRewards(mode, score, bonus, rank, all, ss, opts) {
	var rw = { score: 0, money: 0 };
	var sr = score / ss;

	// all은 1~8
	// rank는 0~7
	switch (Const.GAME_TYPE[mode]) {
		case "EKT":
			rw.score += score * 1.8;
			break;
		case "ESH":
			rw.score += score * 1;
			break;
		case "EKK":
			rw.score += score * 1.77;
			break;
		case "KKT":
			rw.score += score * 1.64;
			break;
		case "JKT":
			rw.score += score * 1.7;
			break;
		case "KSH":
			rw.score += score * 1.4;
			break;
		case "JSH":
			rw.score += score * 1.2;
			break;
		case "CSQ":
			rw.score += score * 1.2;
			break;
		case "KSC":
			rw.score += score * 1.32;
			break;
		case 'KCW':
			rw.score += score * 2.0;
			break;
		case 'ECW':
			rw.score += score * 1.8;
			break;
		case 'CCW':
			rw.score += score * 1.5;
			break;
		case 'KTY':
			rw.score += score * 0.96;
			break;
		case 'ETY':
			rw.score += score * 0.936;
			break;
		case 'JTY':
			rw.score += score * 0.95;
			break;
		case 'KAP':
			rw.score += score * 1.9;
			break;
		case 'JAP':
			rw.score += score * 1.6;
			break;
		case 'HUN':
			rw.score += score * 1.5;
			break;
		case 'KDA':
			rw.score += score * 1.37;
			break;
		case 'EDA':
			rw.score += score * 1.25;
			break;
		case 'JDA':
			rw.score += score * 1.3;
			break;
		case 'KSS':
			rw.score += score * 1.1;
			break;
		case 'ESS':
			rw.score += score * 0.5;
			break;
		case 'JSS':
			rw.score += score * 0.9;
			break;
		case 'KFR':
			rw.score += score * 0.9;
			break;
		case 'EFR':
			rw.score += score * 0.75;
			break;
		case 'JFR':
			rw.score += score * 0.83;
			break;
		case 'XBB':
			rw.score = 0;
			break;
		case 'CSD':
			rw.score += score * 0.6;
			break;
		case "KPQ":
			rw.score += score * 2.72;
			break;
		case "EPQ":
			rw.score += score * 2.56;
			break;
		case "KJM":
		case "KJA":
			rw.score += score * 0.5;
			break;
		case "KWR":
			rw.score += score * 1.6;
			break;
		case "EWR":
			rw.score += score * 1.44;
			break;
		case 'KPF':
		case 'EPF':
			rw.score += score * 1.3;
			break;
		case 'KLG':
			rw.score += score * 0.8;
			break;
		case 'KCF':
			rw.score += score * 0.75;
			break;
		case 'KQZ':
			rw.score += score * 1.0;
			break;
		case 'EQZ':
			rw.score += score * 1.12;
			break;
		case 'CAL':
			rw.score += score * 0.75;
			break;
		case 'CNC':
			rw.score += score * 0.9;
			break;
		case 'KWS':
		case 'EWS':
		case 'KTT':
		case 'ETT':
			rw.score += score * 1.0;
			break;
		case 'KSK':
			rw.score += score * 0.70;
			break;
		case 'ESK':
			rw.score += score * 0.55;
			break;
		case 'XRG':
		case 'KRT':
			rw.score += score * 0.5;
			break;
		default:
			rw.score += score * 1.25;
			break;
	}
	if (opts && opts.bbungtwigi) rw.score *= 0.8; // 뻥튀기: 보너스는 이미 2배이므로 기본 경험치를 0.8배로 낮춰 균형 조정
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

module.exports = Room;
