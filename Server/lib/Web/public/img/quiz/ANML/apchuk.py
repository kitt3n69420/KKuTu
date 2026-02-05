from PIL import Image
for i in range(50):
    original = Image.open(f"{i}.jpg")
    original.save(f"_{i}.jpg","JPEG",quality=30)
