/**
 * 초성 땅따먹기 봇용 초성 조합 → 단어 인메모리 인덱스.
 *
 * 실측 결과(kkutu_ko, 약 139만 단어) 기준 글자 수별 분포:
 *   2글자: 조합 361개,   조합당 평균 287.3개 단어 (조합 공간 100% 커버)
 *   3글자: 조합 5,405개, 조합당 평균 46.9개 단어  (조합 공간 78.8% 커버)
 *   4글자: 조합 39,681개, 조합당 평균 8.09개 단어  (조합 공간 30.4% 커버)
 * 봇은 2~4글자 단어만 사용하므로(레벨별 최대 길이는 landgrab.js 쪽 설정) 인덱스도 4글자까지만 둔다.
 *
 * 그래서 조합당 저장 개수(K)를 글자 수별로 다르게 둔다:
 * 2~3글자는 조합 수가 적고 단어가 많아 다양성을 위해 넉넉히,
 * 4글자는 조합 수가 급증하고 조합당 단어가 평균 8개 수준으로 줄어 그만큼만 저장한다.
 */

var JLog = require('../../sub/jjlog');

var INIT_SOUNDS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
var MIN_LEN = 2;
var MAX_LEN = 4;
var K_BY_LEN = { 2: 10, 3: 10, 4: 2 };

var index = null; // Map<chosungKey, Array<{ _id, hit }>>
var buildingPromise = null;

function toChosung(text) {
	var seq = '';
	for (var i = 0; i < text.length; i++) {
		var code = text.charCodeAt(i) - 0xAC00;
		if (code < 0 || code > 11171) return null;
		seq += INIT_SOUNDS[Math.floor(code / 588)];
	}
	return seq;
}

// DB: 초기화 시 1회 전달받는 DB 핸들 (landgrab.js의 exports.init에서 호출)
exports.build = function (DB) {
	if (buildingPromise) return buildingPromise;

	buildingPromise = new Promise(function (resolve) {
		DB.kkutu.ko.find().limit(['hit', true]).on(function (docs) {
			var raw = new Map(); // chosungKey -> {_id, hit}[] (아직 K로 자르기 전)

			for (var i = 0; i < docs.length; i++) {
				var doc = docs[i];
				var text = doc._id.replace(/\s/g, '');
				if (text.length < MIN_LEN || text.length > MAX_LEN) continue;

				var key = toChosung(text);
				if (key === null) continue;

				var bucket = raw.get(key);
				if (!bucket) raw.set(key, bucket = []);
				bucket.push({ _id: doc._id, hit: doc.hit || 0 });
			}

			var built = new Map();
			raw.forEach(function (words, key) {
				var K = K_BY_LEN[key.length] || 1;
				words.sort(function (a, b) { return b.hit - a.hit; });
				built.set(key, words.slice(0, K));
			});

			index = built;
			JLog.log('[landgrab] Chosung index built: ' + index.size + ' keys');
			resolve();
		});
	});

	return buildingPromise;
};

exports.isReady = function () {
	return index !== null;
};

// chosungSeq: landgrab.js의 wordToChosung()이 반환하는 자모 배열, 또는 이미 합쳐진 문자열
// 반환값: [{ _id, hit }, ...] (없으면 빈 배열)
exports.get = function (chosungSeq) {
	if (!index) return [];
	var key = Array.isArray(chosungSeq) ? chosungSeq.join('') : chosungSeq;
	return index.get(key) || [];
};
