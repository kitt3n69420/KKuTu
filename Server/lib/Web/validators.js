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
 * 재귀적으로 프로토타입 오염 키를 검사
 * @param {any} obj - 검사할 객체
 * @param {Set} visited - 순환 참조 방지를 위한 방문한 객체 추적
 * @returns {boolean} - 안전하면 true, 위험한 키 발견 시 false
 */
function checkPrototypePollution(obj, visited = new Set()) {
  // null, undefined, 원시 타입은 안전
  if (obj == null || typeof obj !== "object") {
    return true;
  }

  // 순환 참조 방지
  if (visited.has(obj)) {
    return true;
  }
  visited.add(obj);

  const forbiddenKeys = ["__proto__", "constructor", "prototype"];

  // 현재 객체의 키 검사 (직접 소유한 키만)
  for (let key of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }

  // 모든 속성값에 대해 재귀 검사
  try {
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // 키 이름 자체도 검사
        if (forbiddenKeys.includes(key)) {
          return false;
        }
        // 값이 객체나 배열이면 재귀 검사
        if (typeof obj[key] === "object" && obj[key] !== null) {
          if (!checkPrototypePollution(obj[key], visited)) {
            return false;
          }
        }
      }
    }
  } catch (e) {
    // 에러 발생 시 안전하지 않다고 간주
    return false;
  }

  return true;
}

/**
 * 입력 검증 함수
 * @param {any} input - 검증할 입력 값
 * @param {string} type - 예상 타입 ('string', 'number', 'boolean', 'object')
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
  if (type === "object" && (typeof input !== "object" || input === null || Array.isArray(input))) return false;

  // 길이 제한
  if (options.maxLength && typeof input === "string" && input.length > options.maxLength) return false;
  if (options.minLength && typeof input === "string" && input.length < options.minLength) return false;

  // 프로토타입 오염 방지 (재귀적 검사)
  if (typeof input === "object" && input !== null) {
    if (!checkPrototypePollution(input)) {
      return false;
    }
  }

  // 특수 문자 체크
  if (options.noSpecialChars && typeof input === "string" && /[<>\"'&]/.test(input)) return false;

  return true;
}

module.exports = {
  validateInput,
  checkPrototypePollution,
};
