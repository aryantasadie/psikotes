import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf1 = os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 1 - Google Formulir.pdf")
pdf2 = os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 2 - Google Formulir.pdf")

out1 = os.path.join(base_dir, "psikotes-app", "public", "soal", "cfit1")
out2 = os.path.join(base_dir, "psikotes-app", "public", "soal", "cfit2")

os.makedirs(out1, exist_ok=True)
os.makedirs(out2, exist_ok=True)

def extract_cfit(pdf_path, out_dir, skip_first):
    doc = fitz.open(pdf_path)
    img_idx = 0
    saved = 0
    for i, page in enumerate(doc):
        for j, img in enumerate(page.get_images(full=True)):
            if img_idx >= skip_first:
                b = doc.extract_image(img[0])['image']
                ext = doc.extract_image(img[0])['ext']
                # Saving 1-indexed to match DB numbering
                with open(os.path.join(out_dir, f"{saved + 1}.{ext}"), "wb") as f:
                    f.write(b)
                saved += 1
            img_idx += 1
    return saved

# Test 1 has 16 images total. 3 are examples. 13 are questions.
s1 = extract_cfit(pdf1, out1, skip_first=3)
# Test 2 has 16 images total. 2 are examples. 14 are questions.
s2 = extract_cfit(pdf2, out2, skip_first=2)

print(f"Extracted {s1} images for CFIT 1")
print(f"Extracted {s2} images for CFIT 2")
