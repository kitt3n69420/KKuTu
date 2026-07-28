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
const fs = require('fs');
const path = require('path');
const cenkor = require('cenkor');

// 닉네임 금지어 정규식 (head.js의 BAD와 같은 방식: 파일에 한 줄당 패턴 하나씩 적어두고 '|'로 합쳐 컴파일)
var nicknameBannedRegex = null;
(function loadNicknameBannedWords() {
	var listPath = path.join(__dirname, '../data/nickname_banned.txt');
	var lines;

	try {
		lines = fs.readFileSync(listPath, 'utf8').split(/\r?\n/).filter(function (w) { return w.length > 0; });
	} catch (e) {
		return;
	}
	if (!lines.length) return;

	nicknameBannedRegex = new RegExp(lines.join('|'), 'gi');
})();

/**
 * Cenkor 결과를 사용하여 욕설을 치환합니다.
 * @param {string} text - 원본 텍스트
 * @param {string} replacement - 욕설을 대체할 문자열
 * @returns {string} 필터링된 텍스트
 */
function replaceWithCenkor(text, replacement) {
	if (!text || typeof text !== 'string') return text;

	const result = cenkor(text);

	// 욕설이 감지되지 않으면 원본 반환
	if (!result.filtered) {
		return text;
	}

	// 모든 필터링된 위치를 수집하고 정렬
	const positions = [];
	for (const category in result.filters) {
		if (Array.isArray(result.filters[category])) {
			result.filters[category].forEach(item => {
				positions.push({
					from: item.from,
					to: item.to,
					word: item.word
				});
			});
		}
	}

	// from 기준으로 정렬 (뒤에서부터 치환하기 위해 역순)
	positions.sort((a, b) => b.from - a.from);

	// 뒤에서부터 치환 (인덱스 변경 방지)
	let filtered = text;
	positions.forEach(pos => {
		filtered = filtered.substring(0, pos.from) + replacement + filtered.substring(pos.to + 1);
	});

	return filtered;
}

/**
 * 텍스트에서 욕설을 필터링합니다.
 * @param {string} text - 필터링할 텍스트
 * @param {string} replacement - 욕설을 대체할 문자열 (기본값: '***')
 * @returns {string} 필터링된 텍스트
 */
exports.filterProfanity = function(text, replacement) {
	return replaceWithCenkor(text, replacement || '***');
};

/**
 * 텍스트에 욕설이 포함되어 있는지 확인합니다.
 * @param {string} text - 검사할 텍스트
 * @returns {boolean} 욕설 포함 여부
 */
exports.hasProfanity = function(text) {
	if (!text || typeof text !== 'string') return false;
	const result = cenkor(text);
	return result.filtered;
};

/**
 * 채팅 메시지용 필터 (200자 제한 고려)
 * 욕설이 감지되면 "냥냥"로 치환합니다.
 * @param {string} message - 채팅 메시지
 * @returns {string} 필터링된 메시지
 */
exports.filterChatMessage = function(message) {
	if (!message) return message;
	// 최대 200자로 제한 (slave.js의 제한 사항 반영)
	const truncated = message.substr(0, 200);
	// 욕설을 "냥냥"로 치환
	return replaceWithCenkor(truncated, "냥냥");
};

/**
 * 방 제목용 필터 (20자 제한 고려)
 * 욕설이 감지되면 "냥냥"로 치환합니다.
 * @param {string} title - 방 제목
 * @returns {string} 필터링된 방 제목
 */
exports.filterRoomTitle = function(title) {
	if (!title) return title;
	// 최대 20자로 제한 (slave.js의 제한 사항 반영)
	const truncated = title.length > 20 ? title.slice(0, 20) : title;
	// 욕설을 "냥냥"로 치환
	return replaceWithCenkor(truncated, "냥냥");
};

/**
 * 텍스트에 닉네임 금지어(lib/data/nickname_banned.txt)가 매치되는지 확인합니다.
 * 일부만 잘라내는 방식(치환 후 재사용)은 "씨섹스발"에서 "섹스"만 제거하면
 * 남은 부분이 "씨발"이 되어버리는 것처럼, 제거 후 새로운 금지어가 만들어질 수 있습니다.
 * 이를 피하기 위해 원본 텍스트 매치 여부만 검사하고, 통과하지 못하면 통째로 거부하는 용도로 씁니다.
 * @param {string} text - 검사할 텍스트
 * @returns {boolean} 금지어 매치 여부
 */
exports.containsBannedWord = function(text) {
	if (!text || !nicknameBannedRegex) return false;
	nicknameBannedRegex.lastIndex = 0;
	return nicknameBannedRegex.test(text);
};

/**
 * 닉네임으로 쓸 수 없는 표현(욕설 또는 금지어)이 포함되어 있는지 확인합니다.
 * @param {string} text - 검사할 텍스트
 * @returns {boolean} 금지된 표현 포함 여부
 */
exports.isNicknameForbidden = function(text) {
	return exports.hasProfanity(text) || exports.containsBannedWord(text);
};
