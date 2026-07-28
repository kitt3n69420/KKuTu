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
const ProfanityFilter = require("./profanity-filter");

/**
 * 이미 저장되어 있는 닉네임이 지금 기준으로도 여전히 유효한지 확인합니다.
 * (예: 닉네임을 설정한 뒤 금지어 목록이 추가되었거나, 유일성 제약이 없던 시절의
 * legacy 데이터라 다른 유저와 닉네임이 중복되는 경우를 감지하기 위한 용도입니다.)
 * @param {object} MainDB
 * @param {string} nickname - 현재 저장된 닉네임
 * @param {string} myId - 자신의 유저 ID (중복 검사에서 제외)
 * @param {(invalid: boolean) => void} callback
 */
exports.isCurrentNicknameInvalid = function (MainDB, nickname, myId, callback) {
	if (!nickname) return callback(false);
	if (ProfanityFilter.isNicknameForbidden(nickname)) return callback(true);

	MainDB.users.find(["nickname", nickname]).on(
		function (rows) {
			callback(Array.isArray(rows) && rows.some(function (row) { return row._id !== myId; }));
		},
		null,
		function () { callback(false); },
	);
};
