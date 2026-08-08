import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf2 = os.path.join(base_dir, "soal", "Intelegensi", "TIKI", "TIKI TINGGI TEST 2 - Google Formulir.pdf")

out2 = os.path.join(base_dir, "psikotes-app", "public", "soal", "tiki2")
os.makedirs(out2, exist_ok=True)

doc = fitz.open(pdf2)
img_idx = 0
saved = 0
for i, page in enumerate(doc):
    for j, img in enumerate(page.get_images(full=True)):
        if img_idx >= 4: # skip 4 examples
            b = doc.extract_image(img[0])['image']
            ext = doc.extract_image(img[0])['ext']
            with open(os.path.join(out2, f"{saved + 1}.{ext}"), "wb") as f:
                f.write(b)
            saved += 1
        img_idx += 1

print(f"Extracted {saved} images for TIKI 2")
