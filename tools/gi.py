"""
Generate gradient name images for KKuTu item crafting system.
Blends two color name images diagonally (top-left to bottom-right).
Same-color pairs: original + 70% brightness version.
Modification: Gradient transition constrained to 40%-60% range.
"""

import os
from PIL import Image, ImageEnhance
import numpy as np

COLORS = ['blue', 'green', 'indigo', 'orange', 'pink', 'purple', 'red']

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 경로는 사용자 환경에 맞게 유지
SHOP_DIR = os.path.join(BASE_DIR, 'Server', 'lib', 'Web', 'public', 'img', 'kkutu', 'shop')

def create_diagonal_mask(width, height):
    """
    Create a diagonal gradient mask.
    Range 0.0 ~ 0.4: Value 0 (Img1)
    Range 0.4 ~ 0.6: Gradient 0 -> 255
    Range 0.6 ~ 1.0: Value 255 (Img2)
    """
    max_val = width + height - 2
    if max_val <= 0:
        return Image.fromarray(np.zeros((height, width), dtype=np.uint8), mode='L')

    # 1. 그리드 생성 (이중 for문 대신 numpy 벡터 연산 사용으로 속도 대폭 향상)
    y, x = np.indices((height, width))
    
    # 2. 대각선 비율 계산 (0.0 ~ 1.0)
    ratios = (x + y) / max_val
    
    # 3. 40%~60% 범위로 정규화 및 클리핑
    # (ratio - 0.4) / 0.2 공식을 통해 0.4는 0이 되고, 0.6은 1이 됨
    gradients = (ratios - 0.4) / 0.2
    
    # 0보다 작은 값은 0으로, 1보다 큰 값은 1로 자르고 255를 곱함
    mask = np.clip(gradients, 0, 1) * 255
    
    return Image.fromarray(mask.astype(np.uint8), mode='L')

def generate_gradient_image(color1, color2):
    """Generate a blended gradient image from two color name images."""
    # 파일 경로 예외 처리 추가 (혹시 파일이 없을 경우를 대비)
    try:
        img1_path = os.path.join(SHOP_DIR, f'{color1}_name.png')
        img1 = Image.open(img1_path).convert('RGBA')
    except FileNotFoundError:
        print(f"Error: {color1}_name.png not found in {SHOP_DIR}")
        return

    if color1 == color2:
        enhancer = ImageEnhance.Brightness(img1)
        img2 = enhancer.enhance(0.7).convert('RGBA')
    else:
        try:
            img2_path = os.path.join(SHOP_DIR, f'{color2}_name.png')
            img2 = Image.open(img2_path).convert('RGBA')
        except FileNotFoundError:
            print(f"Error: {color2}_name.png not found in {SHOP_DIR}")
            return

    # Resize img2 to match img1 if different sizes
    if img1.size != img2.size:
        img2 = img2.resize(img1.size, Image.LANCZOS)

    w, h = img1.size
    mask = create_diagonal_mask(w, h)

    # Composite: mask=0 shows img1, mask=255 shows img2
    result = Image.composite(img2, img1, mask)

    output_name = f'gradientname_{color1}{color2}.png'
    output_path = os.path.join(SHOP_DIR, output_name)
    result.save(output_path)
    print(f'  Generated: {output_name}')

def main():
    if not os.path.exists(SHOP_DIR):
        print(f"Warning: Directory {SHOP_DIR} does not exist.")
        # 테스트를 위해 현재 폴더를 사용할 경우 아래 주석 해제
        # os.makedirs(SHOP_DIR, exist_ok=True)
        return

    print(f'Source directory: {SHOP_DIR}')
    print(f'Generating {len(COLORS) * (len(COLORS) + 1) // 2} gradient name images...\n')

    count = 0
    for i, c1 in enumerate(COLORS):
        for j, c2 in enumerate(COLORS):
            if j < i:
                continue  # Only generate for c1 <= c2 alphabetically
            generate_gradient_image(c1, c2)
            count += 1

    print(f'\nDone! Generated {count} images.')

if __name__ == '__main__':
    main()