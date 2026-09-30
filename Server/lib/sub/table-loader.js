/**
 * 서버 시작 시 대용량 테이블을 메모리에 올리는 로더들을 위한 직렬 실행 + 재시도 조정기.
 *
 * 시작 직후 여러 테이블(과 여러 워커)이 한꺼번에 DB를 두드리면 서로 느려져 statement_timeout에 걸리므로,
 * 프로세스 안에서는 한 번에 하나씩만 실행하고, 워커끼리는 채널 번호만큼 시작 시각을 밀어 겹치지 않게 한다.
 *
 * 1차 시도는 풀 기본 statement_timeout(Web/db.js)으로 돌린다. 실패한 테이블은 곧바로 재시도하지 않고,
 * 남은 1차 시도가 모두 끝난 뒤 제한시간을 2배로 늘려 한 번씩 순서대로 다시 시도한다.
 * 그래도 실패하면 fallback을 호출한다.
 */
var JLog = require('./jjlog');

var BASE_TIMEOUT = 8000; // Web/db.js의 statement_timeout과 같은 값
var RETRY_TIMEOUT = BASE_TIMEOUT * 2;
var WATCHDOG = RETRY_TIMEOUT * 2; // done이 끝내 호출되지 않아도 큐가 멈추지 않게 하는 상한
var GAP = 300; // 작업 사이 간격(ms). 다른 쿼리가 끼어들 틈을 준다
var STAGGER = 4000; // 채널 하나당 시작 지연(ms)

var queue = [];
var retries = [];
var running = false;
var startAt = Date.now() + Math.max((Number(process.env['CHANNEL']) || 1) - 1, 0) * STAGGER;

function pump() {
	if (running) return;

	var wait = startAt - Date.now();
	if (wait > 0) return void setTimeout(pump, wait);

	var job = queue.shift();
	var timeout = null;
	if (!job) {
		job = retries.shift();
		if (!job) return;
		timeout = RETRY_TIMEOUT;
		JLog.warn('[TABLE-LOADER] ' + job.name + ' retrying with statement_timeout ' + RETRY_TIMEOUT + 'ms');
	}

	running = true;
	var finished = false;
	var watchdog;
	function done(err) {
		if (finished) return;
		finished = true;
		clearTimeout(watchdog);
		running = false;
		if (err) {
			if (timeout === null) {
				JLog.warn('[TABLE-LOADER] ' + job.name + ' failed, will retry after other tables finish: ' + (err && err.message || err));
				retries.push(job);
			} else {
				JLog.warn('[TABLE-LOADER] ' + job.name + ' failed again, using fallback: ' + (err && err.message || err));
				if (job.fallback) job.fallback();
			}
		}
		setTimeout(pump, GAP);
	}
	watchdog = setTimeout(function () { done(new Error('no response for ' + WATCHDOG + 'ms')); }, WATCHDOG);
	job.attempt(timeout, done);
}

/**
 * @param {string} name 로그용 이름
 * @param {function(number|null, function(Error=))} attempt (timeoutMs, done) — 풀 기본값이면 timeoutMs는 null. 성공하면 done(), 실패하면 done(err)
 * @param {function} [fallback] 재시도까지 실패했을 때 호출
 */
exports.load = function (name, attempt, fallback) {
	queue.push({ name: name, attempt: attempt, fallback: fallback });
	pump();
};
