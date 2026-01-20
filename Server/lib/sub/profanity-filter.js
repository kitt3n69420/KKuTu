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
const cenkor = require('cenkor');

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
 * 닉네임용 필터 (12자 제한 고려)
 * 욕설이 감지되면 해당 부분을 제거합니다.
 * @param {string} nickname - 닉네임
 * @returns {string} 필터링된 닉네임
 */
exports.filterNickname = function(nickname) {
	if (!nickname) return nickname;
	// 최대 12자로 제한 (major.js의 제한 사항 반영)
	const truncated = nickname.length > 12 ? nickname.slice(0, 12) : nickname;
	// 욕설을 빈 문자열로 치환 (제거)
	return replaceWithCenkor(truncated, "");
};
