/**
 * 서버 시작 시 대용량 테이블을 메모리에 올리는 로더들을 위한 재시도 조정기.
 *
 * 1차 시도는 풀 기본 statement_timeout(Web/db.js)으로 돌린다. 실패한 테이블은 곧바로 재시도하지 않고,
 * 진행 중인 다른 테이블 로드가 모두 끝난 뒤 제한시간을 2배로 늘려 한 번씩 순서대로 다시 시도한다.
 * 그래도 실패하면 fallback을 호출한다.
 */
var JLog = require('./jjlog');

var BASE_TIMEOUT = 8000; // Web/db.js의 statement_timeout과 같은 값
var RETRY_TIMEOUT = BASE_TIMEOUT * 2;

var inflight = 0;
var retries = [];

function drain() {
	if (inflight > 0 || !retries.length) return;

	var job = retries.shift();
	inflight++;
	JLog.warn('[TABLE-LOADER] ' + job.name + ' retrying with statement_timeout ' + RETRY_TIMEOUT + 'ms');
	job.attempt(RETRY_TIMEOUT, function (err) {
		inflight--;
		if (err) {
			JLog.warn('[TABLE-LOADER] ' + job.name + ' failed again, using fallback: ' + (err && err.message || err));
			if (job.fallback) job.fallback();
		}
		drain();
	});
}

/**
 * @param {string} name 로그용 이름
 * @param {function(number|null, function(Error=))} attempt (timeoutMs, done) — 풀 기본값이면 timeoutMs는 null. 성공하면 done(), 실패하면 done(err)
 * @param {function} [fallback] 재시도까지 실패했을 때 호출
 */
exports.load = function (name, attempt, fallback) {
	inflight++;
	attempt(null, function (err) {
		inflight--;
		if (err) {
			JLog.warn('[TABLE-LOADER] ' + name + ' failed, will retry after other tables finish: ' + (err && err.message || err));
			retries.push({ name: name, attempt: attempt, fallback: fallback });
		}
		drain();
	});
};
