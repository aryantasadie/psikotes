import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf3 = os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 3 - Google Formulir.pdf")
pdf4 = os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 4 - Google Formulir.pdf")

out3 = os.path.join(base_dir, "psikotes-app", "public", "soal", "cfit3")
out4 = os.path.join(base_dir, "psikotes-app", "public", "soal", "cfit4")

os.makedirs(out3, exist_ok=True)
os.makedirs(out4, exist_ok=True)

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

# Test 3 has 16 images total. 3 are examples. 13 are questions.
s3 = extract_cfit(pdf3, out3, skip_first=3)
# Test 4 has 12 images total. 2 are examples. 10 are questions.
s4 = extract_cfit(pdf4, out4, skip_first=2)

print(f"Extracted {s3} images for CFIT 3")
print(f"Extracted {s4} images for CFIT 4")
