/**
 * 중심찾기 봇용 글자 → 단어 인메모리 인덱스.
 *
 * 상위 256글자(center.js의 TOP_CHARS)로 시작하는 단어만 첫 글자별로 버킷에 모아 두고,
 * 봇이 라운드의 중심 글자에 맞는 단어를 즉시 뽑아 쓸 수 있게 한다.
 * 서버 기동 시 TOP_CHARS 확정 직후 1회만 빌드하며, 이후 재빌드 없음(단어 DB는 실행 중 안 바뀜).
 */

var JLog = require('../../sub/jjlog');

var MAX_PER_CHAR = 50;

var index = null; // Map<char, Array<{ _id, hit }>>
var buildingPromise = null;

exports.build = function (DB, topChars) {
	if (buildingPromise) return buildingPromise;

	buildingPromise = new Promise(function (resolve) {
		var wanted = new Set(topChars);

		DB.kkutu.ko.find().limit(['hit', true]).on(function (docs) {
			var raw = new Map(); // char -> {_id, hit}[]

			for (var i = 0; i < docs.length; i++) {
				var doc = docs[i];
				var ch = doc._id.charAt(0);
				if (!wanted.has(ch)) continue;

				var bucket = raw.get(ch);
				if (!bucket) raw.set(ch, bucket = []);
				bucket.push({ _id: doc._id, hit: doc.hit || 0 });
			}

			var built = new Map();
			raw.forEach(function (words, ch) {
				words.sort(function (a, b) { return b.hit - a.hit; });
				built.set(ch, words.slice(0, MAX_PER_CHAR));
			});

			index = built;
			JLog.log('[CENTER] Word index built: ' + index.size + ' character buckets');
			resolve();
		});
	});

	return buildingPromise;
};

exports.isReady = function () {
	return index !== null;
};

// 해당 글자로 시작하는 단어 중 하나를 랜덤으로 반환 (없으면 null)
exports.pick = function (ch) {
	if (!index) return null;
	var bucket = index.get(ch);
	if (!bucket || !bucket.length) return null;
	return bucket[Math.floor(Math.random() * bucket.length)]._id;
};
