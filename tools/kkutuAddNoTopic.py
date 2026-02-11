#!/usr/bin/env python3
"""
끄투 단어 추가 스크립트 (무주제)
파일을 드래그 앤 드롭하면 실행되고, 주제를 0으로 고정하여 추가합니다.
이미 존재하는 단어는 건너뜁니다.
"""

import psycopg2
from psycopg2 import sql
import sys
import os
import re


# =============================================
# 데이터베이스 설정 (환경에 맞게 수정하세요)
# =============================================
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'kkutu',
    'user': 'postgres',
    'password': 'wlq@rkrh10ek'  
}

# 기본 언어 설정 (ko: 한국어, en: 영어)
DEFAULT_LANG = 'ko'


def get_table_name(lang: str) -> str:
    """언어에 따른 테이블 이름 반환"""
    tables = {
        'ko': 'kkutu_ko',
        'en': 'kkutu_en'
    }
    if lang not in tables:
        raise ValueError(f"지원하지 않는 언어입니다: {lang}")
    return tables[lang]


def add_words(conn, lang: str, words: list[str]) -> dict:
    """
    단어 목록을 데이터베이스에 추가합니다. (주제 없이)
    """
    table_name = get_table_name(lang)
    result = {
        'inserted': 0,
        'skipped': 0,
        'errors': []
    }
    
    cursor = conn.cursor()
    
    for word in words:
        word = word.strip()
        if not word:
            continue
            
        try:
            # 기존 단어 조회
            cursor.execute(
                sql.SQL("SELECT _id FROM {} WHERE _id = %s").format(
                    sql.Identifier(table_name)
                ),
                (word,)
            )
            row = cursor.fetchone()
            
            if row is None:
                # 새 단어 삽입 (theme='0')
                cursor.execute(
                    sql.SQL("""
                        INSERT INTO {} (_id, type, theme, mean, flag, hit)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """).format(sql.Identifier(table_name)),
                    (word, 'INJEONG', '0', '＂1＂', 2, 0)
                )
                result['inserted'] += 1
                print(f"  ✓ 추가됨: {word}")
            else:
                # 이미 존재하면 건너뜀
                result['skipped'] += 1
                print(f"  ⊘ 건너뜀 (이미 존재함): {word}")
                    
        except Exception as e:
            result['errors'].append({'word': word, 'error': str(e)})
            print(f"  ✗ 오류: {word} - {e}")
    
    conn.commit()
    cursor.close()
    
    return result


def load_words_from_file(filepath: str) -> list[str]:
    """파일에서 단어 목록 로드 (줄바꿈 또는 쉼표로 구분)"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    words = []
    for line in content.split('\n'):
        for word in line.split(','):
            word = word.strip()
            if word:
                words.append(word)
    return words


def main():
    print("\n" + "=" * 50)
    print("       끄투 단어 추가 도구 (무주제)")
    print("=" * 50)
    
    # 드래그 앤 드롭된 파일 확인
    if len(sys.argv) < 2:
        print("\n[사용법]")
        print("단어가 들어있는 txt 파일을 이 스크립트에 드래그 앤 드롭하세요.")
        print("\n파일 형식:")
        print("  - 한 줄에 하나씩 단어를 적거나")
        print("  - 쉼표로 구분하여 단어를 나열")
        input("\n아무 키나 누르면 종료됩니다...")
        sys.exit(0)
    
    filepath = sys.argv[1]
    
    # 파일 존재 확인
    if not os.path.exists(filepath):
        print(f"\n오류: 파일을 찾을 수 없습니다 - {filepath}")
        input("\n아무 키나 누르면 종료됩니다...")
        sys.exit(1)
    
    # 파일에서 단어 로드
    try:
        words = load_words_from_file(filepath)
    except Exception as e:
        print(f"\n오류: 파일을 읽을 수 없습니다 - {e}")
        input("\n아무 키나 누르면 종료됩니다...")
        sys.exit(1)
    
    if not words:
        print("\n오류: 파일에 단어가 없습니다.")
        input("\n아무 키나 누르면 종료됩니다...")
        sys.exit(1)
    
    print(f"\n파일: {os.path.basename(filepath)}")
    print(f"단어 수: {len(words)}개")
    print("-" * 50)
    
    # 언어 선택 (기본값 사용 또는 입력)
    lang_input = input(f"언어를 선택하세요 (ko/en, 기본값: {DEFAULT_LANG}): ").strip().lower()
    lang = lang_input if lang_input in ['ko', 'en'] else DEFAULT_LANG
    
    print(f"\n설정: 언어={lang}, 테마='0' (자동)")
    print("-" * 50)
    
    # 데이터베이스 연결
    print("\n데이터베이스 연결 중...")
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        print("✓ 연결 성공!\n")
    except Exception as e:
        print(f"\n✗ 데이터베이스 연결 실패: {e}")
        print("\nDB_CONFIG 설정을 확인해주세요.")
        input("\n아무 키나 누르면 종료됩니다...")
        sys.exit(1)
    
    try:
        # 단어 추가 실행
        print("단어 추가 중...\n")
        result = add_words(conn, lang, words)
        
        # 결과 출력
        print("\n" + "=" * 50)
        print("               결과 요약")
        print("=" * 50)
        print(f"  ✓ 새로 추가됨: {result['inserted']}개 (테마: 0)")
        print(f"  ⊘ 건너뜀:     {result['skipped']}개 (이미 존재)")
        print(f"  ✗ 오류:       {len(result['errors'])}개")
        print("=" * 50)
        
        if result['errors']:
            print("\n오류 상세:")
            for err in result['errors']:
                print(f"  - {err['word']}: {err['error']}")
        
    finally:
        conn.close()
    
    input("\n완료! 아무 키나 누르면 종료됩니다...")


if __name__ == '__main__':
    main()
