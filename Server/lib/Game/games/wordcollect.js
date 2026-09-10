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

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

// 라운드 시작 시 서버가 무작위로 하나 골라 부여하는 단어 조건
var CONDITIONS = [
	{ code: 'LEN_4_5', test: function (w) { return w.length >= 4 && w.length <= 5; } },
	{ code: 'LEN_6_8', test: function (w) { return w.length >= 6 && w.length <= 8; } },
	{ code: 'LEN_9', test: function (w) { return w.length >= 9; } },
	{ code: 'INIT_O', test: function (w) { return Const.getJamoRegex('ㅇ').test(w[0]); } },
	{ code: 'INIT_G', test: function (w) { return Const.getJamoRegex('ㄱ').test(w[0]); } },
	{ code: 'INIT_S', test: function (w) { return Const.getJamoRegex('ㅅ').test(w[0]); } },
	{ code: 'INIT_M', test: function (w) { return Const.getJamoRegex('ㅁ').test(w[0]); } },
	{ code: 'INIT_D', test: function (w) { return Const.getJamoRegex('ㄷ').test(w[0]); } },
	// Const.KO_THEME/KO_INJEONG의 실제 분야 코드 (ko_KR.json의 theme_<코드> 라벨 기준: 310=언어, 240=수학, 530=화학, 190=동물, 270=식물, KPM=한국 대중음악, RAG=라면/간식)
	{ code: 'THEME_LANG', theme: '310' },
	{ code: 'THEME_MATH', theme: '240' },
	{ code: 'THEME_KPM', theme: 'KPM' },
	{ code: 'THEME_CHEM', theme: '530' },
	{ code: 'THEME_RAG', theme: 'RAG' },
	{ code: 'THEME_ANIMAL', theme: '190' },
	{ code: 'THEME_PLANT', theme: '270' }
];

function toRegex(theme) {
	return new RegExp('(^|,)' + theme + '($|,)');
}

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function () {
	var my = this;

	clearTimeout(my.game.turnTimer);
	my.game.round = 1;
	my.game.late = false;
	my.game.words = [];
	my.game.totalScore = 0;
	my.game.condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

	my.byMaster('roundReady', {
		round: my.game.round,
		condition: my.game.condition.code,
		time: my.time
	}, true);
	my.game.turnTimer = setTimeout(my.turnStart, 2400);
};
exports.turnStart = function () {
	var my = this;

	my.game.late = false;
	my.game.roundAt = (new Date()).getTime();
	my.game.roundTime = my.time * 1000;
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', {
		roundTime: my.game.roundTime
	}, true);
};
exports.turnEnd = function () {
	var my = this;

	my.game.late = true;
	clearTimeout(my.game.qTimer);
	my.byMaster('turnEnd', {});
	my.roundEnd();
};
exports.submit = function (client, text, data) {
	var my = this;
	var play = my.game.seq ? my.game.seq.includes(client.id) : false;
	var condition = my.game.condition;

	if (!text) return;
	if (my.game.late || !play || !condition) return client.chat(text);
	if (my.game.words.indexOf(text) != -1) return client.chat(text);

	DB.kkutu.ko.findOne(['_id', text]).limit(['theme', true]).on(function ($doc) {
		if (my.game.late) return;
		if (!$doc) return client.chat(text);
		if (my.game.words.indexOf(text) != -1) return client.chat(text);

		var ok = condition.theme
			? !!($doc.theme && $doc.theme.match(toRegex(condition.theme)))
			: condition.test(text);
		if (!ok) return client.chat(text);

		var score = my.getScore(text);
		my.game.words.push(text);
		my.game.totalScore += score;
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			value: text,
			score: score,
			totalScore: client.game.score,
			roomScore: my.game.totalScore
		}, true);
	});
};
exports.getScore = function (text) {
	return Math.floor(2 * Math.pow(text.length, 1.3));
};
