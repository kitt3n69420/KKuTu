/**
 * Input Validators
 * by Vientorepublic(op@viento.me)
 *
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

/**
 * 입력 검증 함수
 * @param {any} input - 검증할 입력 값
 * @param {string} type - 예상 타입 ('string', 'number', 'boolean')
 * @param {object} options - 추가 옵션 (maxLength, minLength, noSpecialChars 등)
 * @returns {boolean} - 검증 통과 여부
 */
function validateInput(input, type = "string", options = {}) {
  // 기본 null/undefined/빈 문자열 체크
  if (input == null || input === undefined || (typeof input === "string" && input.trim() === "")) {
    return false;
  }

  // 타입 체크
  if (type === "string" && typeof input !== "string") return false;
  if (type === "number" && isNaN(Number(input))) return false;
  if (type === "boolean" && typeof input !== "boolean" && input !== "true" && input !== "false") return false;

  // 길이 제한
  if (options.maxLength && typeof input === "string" && input.length > options.maxLength) return false;
  if (options.minLength && typeof input === "string" && input.length < options.minLength) return false;

  // 프로토타입 오염 방지
  if (typeof input === "object" && input !== null) {
    const forbiddenKeys = ["__proto__", "constructor", "prototype"];
    for (let key of forbiddenKeys) {
      if (key in input) return false;
    }
  }

  // 특수 문자 체크
  if (options.noSpecialChars && typeof input === "string" && /[<>\"'&]/.test(input)) return false;

  return true;
}

module.exports = {
  validateInput,
};
