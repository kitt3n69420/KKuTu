import os
import json
import glob
import re
import psycopg2
import itertools

# =============================================
# 데이터베이스 설정 (환경에 맞게 수정하세요)
# =============================================
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'kkutu',
    'user': 'postgres',
    'password': 'your_password'
}

def is_valid_word(word):
    """
    단어가 유효한지 검사 (가~힣, 0~9만 허용)
    한자, 일본어, 특수문자 등은 허용하지 않음
    """
    if not word:
        return False
    for char in word:
        if not (('가' <= char <= '힣') or ('ㄱ' <= char <= 'ㅣ') or ('0' <= char <= '9')):
            return False
    return True

def generate_variants(word):
    """
    단어 내의 괄호 표현을 분석하여 가능한 모든 변형을 생성합니다.
    """
    if not word:
        return []

    # 모든 공백 제거 (끄투 단어는 띄어쓰기가 없음)
    word = word.replace(' ', '')

    tokens = word.split()
    all_token_variants = []
    
    bracket_pattern = re.compile(r'([\[\(\{（【「『].*?[\]\)\}）】」』])')
    
    selection_brackets = ('[', '【', '「', '『')
    optional_brackets = ('(', '（', '{')

    for token in tokens:
        parts = bracket_pattern.split(token)
        groups = []
        for i in range(0, len(parts) - 1, 2):
            text = parts[i]
            bracket = parts[i+1]
            groups.append((text, bracket))
        
        if len(parts) % 2 == 1:
            groups.append((parts[-1], None))
            
        group_options = []
        for text, bracket in groups:
            if not bracket:
                group_options.append([text])
                continue

            open_char = bracket[0]
            content = bracket[1:-1]

            if open_char in selection_brackets:
                options = [text] + content.split('/')
                group_options.append(options)
                
            elif open_char in optional_brackets:
                options = [text, text + content]
                group_options.append(options)
                
            else:
                options = [text, text + content]
                group_options.append(options)
            
        token_combos = []
        for combo in itertools.product(*group_options):
            token_combos.append("".join(combo))
            
        all_token_variants.append(token_combos)
        
    full_variants = []
    for combo in itertools.product(*all_token_variants):
        # 빈 문자열을 제외하고 공백으로 연결
        parts = [c for c in combo if c]
        full_variants.append(" ".join(parts))
        
    return full_variants

def process_fix():
    base_dir = input("JSON 파일이 있는 폴더 경로를 입력하세요: ").strip()

    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        print("데이터베이스 연결 성공!")
    except Exception as e:
        print(f"데이터베이스 연결 실패: {e}")
        print("DB_CONFIG 설정을 확인해주세요.")
        return

    cursor = conn.cursor()

    print("\n" + "=" * 50)
    print("[1단계] JSON 파일에서 괄호가 있는 표제어 수집")
    print("=" * 50)

    # 1. 괄호가 있는 모든 단어 수집
    bracket_items = []
    
    # DB에서 조회할 '잘못된' 키 집합 (기존 메타데이터 조회용)
    wrong_keys_to_query = set()
    
    files = glob.glob(os.path.join(base_dir, "**/*.json"), recursive=True)
    print(f"총 {len(files)}개의 파일을 찾았습니다.")

    bracket_pattern = re.compile(r'[\[\(\{（【「『]')

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                items = data.get('channel', {}).get('item', [])
                for item in items:
                    word_info = item.get('wordinfo', {})
                    word = word_info.get('word', "")
                    
                    if bracket_pattern.search(word):
                        variants = generate_variants(word)
                        
                        valid_variants = set()
                        for v in variants:
                            clean = re.sub(r'[\s\d\W_]', '', v)
                            if clean and is_valid_word(clean):
                                valid_variants.add(clean)
                        
                        if not valid_variants:
                            continue
                            
                        # JSON 메타데이터 추출
                        mean = word_info.get('mech', '＂1＂')
                        w_type = word_info.get('class', 'INJEONG')
                        theme = '' # 테마는 파일별로 다를 수 있어서 빈 값 기본
                        hit = 0
                        flag = 2 
                        
                        json_meta = {
                            'type': w_type,
                            'mean': mean,
                            'hit': hit,
                            'flag': flag,
                            'theme': theme 
                        }
                        
                        # 잘못 등록된 형태 키 (공백/특수문자 제거)
                        wrong_key = re.sub(r'[\s\d\W_]', '', word)
                        
                        bracket_items.append({
                            'original': word,
                            'wrong_key': wrong_key,
                            'variants': valid_variants,
                            'json_meta': json_meta
                        })
                        
                        # 모든 잘못된 키를 우선 조회 대상에 추가 (DB에 있으면 메타데이터 복제용)
                        wrong_keys_to_query.add(wrong_key)

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"처리할 괄호 표제어 항목: {len(bracket_items)}개")
    print("[1단계 완료]")

    # =============================================
    # 2단계: DB 업데이트 (삭제 및 추가)
    # =============================================
    print("\n" + "=" * 50)
    print("[2단계] DB 업데이트 (기원 단어 복제 포함)")
    print("=" * 50)

    # 2-1. 기존 '잘못된' 단어 메타데이터 조회
    print("기존 DB 데이터 조회 중...")
    
    db_meta_map = {} # { word_id: { type, mean, hit, flag, theme } }
    
    if wrong_keys_to_query:
        w_keys_list = list(wrong_keys_to_query)
        batch_size = 1000
        for i in range(0, len(w_keys_list), batch_size):
            batch = w_keys_list[i:i+batch_size]
            query = "SELECT _id, type, mean, hit, flag, theme FROM kkutu_ko WHERE _id IN %s"
            cursor.execute(query, (tuple(batch),))
            rows = cursor.fetchall()
            for r in rows:
                db_meta_map[r[0]] = {
                    'type': r[1],
                    'mean': r[2],
                    'hit': r[3],
                    'flag': r[4],
                    'theme': r[5]
                }
    
    print(f"  -> {len(db_meta_map)}개의 기존 메타데이터 확보")

    # 2-2. 추가 및 삭제 리스트 구성
    to_delete = []
    to_add = {} 
    
    # 전체 존재하는 ID 조회 (추가 여부 판단용)
    cursor.execute("SELECT _id FROM kkutu_ko")
    existing_all = set(row[0] for row in cursor.fetchall())
    
    skipped_count = 0
    
    # 삭제 목록부터 확정 (DB에 있는 잘못된 단어들)
    # 중복 제거를 위해 set 사용
    for item in bracket_items:
        wrong_key = item['wrong_key']
        if wrong_key in db_meta_map:
            to_delete.append(wrong_key)
            
    to_delete = list(set(to_delete))
    
    # 추가 목록 구성
    for item in bracket_items:
        wrong_key = item['wrong_key']
        variants = item['variants']
        
        # 메타데이터: DB에 있으면 복제(히트, 플래그 등), 없으면 JSON
        if wrong_key in db_meta_map:
            meta = db_meta_map[wrong_key].copy()
        else:
            meta = item['json_meta'].copy()
        
        for variant in variants:
            # 변형 단어가 이미 DB에 있고, 삭제 예정이 아니라면 건너뜀
            # (삭제 예정이면 다시 추가해야 하므로 건너뛰지 않음)
            if variant in existing_all and variant not in to_delete:
                skipped_count += 1
                continue
            
            # 추가 목록에 등록 (이미 있으면 덮어쓰거나 무시 - 여기선 무시)
            if variant not in to_add:
                new_meta = meta.copy()
                new_meta['_id'] = variant
                to_add[variant] = new_meta

    print(f"\n처리 예정:")
    print(f"  - 삭제될 단어 (DB에 존재했던 원본): {len(to_delete)}개")
    print(f"  - 신규 추가될 단어 (복제 및 변형): {len(to_add)}개")
    print(f"  - 이미 존재하여 건너뜀 (다른 단어): {skipped_count} (중복 포함)")

    if to_delete or to_add:
        confirm = input("\nDB 업데이트를 진행하시겠습니까? (y/n): ").lower()
        if confirm == 'y':
            # 삭제 실행
            if to_delete:
                del_cnt = 0
                for word_id in to_delete:
                    try:
                        cursor.execute("DELETE FROM kkutu_ko WHERE _id = %s", (word_id,))
                        del_cnt += 1
                    except Exception as e:
                        print(f"✗ 삭제 오류: {word_id} - {e}")
                print(f"총 {del_cnt}개 삭제 완료")
            
            # 추가 실행
            if to_add:
                add_cnt = 0
                for word_data in to_add.values():
                    try:
                        cursor.execute(
                            """
                            INSERT INTO kkutu_ko (_id, type, mean, hit, flag, theme)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (word_data['_id'], word_data['type'], word_data['mean'],
                             word_data['hit'], word_data['flag'], word_data['theme'])
                        )
                        add_cnt += 1
                        if add_cnt % 100 == 0:
                            print(f"  {add_cnt}개 추가됨...")
                    except Exception as e:
                        print(f"✗ 추가 오류: {word_data['_id']} - {e}")
                print(f"총 {add_cnt}개 추가 완료")

            conn.commit()
            print("\nDB 업데이트가 완료되었습니다.")
        else:
            print("작업이 취소되었습니다.")
    else:
        print("변경할 사항이 없습니다.")
        
    print("[2단계 완료]")

    # =============================================
    # 3단계: 잔여 데이터 정리
    # =============================================
    print("\n" + "=" * 50)
    print("[3단계] 유효하지 않은 문자가 포함된 단어 삭제 (잔여 데이터 정리)")
    print("=" * 50)

    cursor.execute("SELECT _id FROM kkutu_ko")
    current_ids = [row[0] for row in cursor.fetchall()]

    invalid_words = []
    for word_id in current_ids:
        if not is_valid_word(word_id):
            invalid_words.append(word_id)

    print(f"\n유효하지 않은 문자가 포함된 단어: {len(invalid_words)}개 발견")

    if invalid_words:
        print("샘플 (최대 10개):")
        for word in invalid_words[:10]:
            print(f"  - {word}")

        confirm = input("\n삭제를 진행하시겠습니까? (y/n): ").lower()
        if confirm == 'y':
            deleted_count = 0
            for word_id in invalid_words:
                try:
                    cursor.execute("DELETE FROM kkutu_ko WHERE _id = %s", (word_id,))
                    deleted_count += 1
                except Exception as e:
                    print(f"✗ 삭제 오류: {word_id} - {e}")

            conn.commit()
            print(f"총 {deleted_count}개 삭제 완료")
        else:
            print("삭제가 취소되었습니다.")
    
    print("[3단계 완료]")

    cursor.close()
    conn.close()

    print("\n" + "=" * 50)
    print("               작업 완료")
    print("=" * 50)

if __name__ == "__main__":
    process_fix()
