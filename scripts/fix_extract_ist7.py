import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf_ist7 = os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST SOAL 7 - Google Formulir.pdf")
out_img_dir = os.path.join(base_dir, "psikotes-app", "public", "soal", "ist7")
os.makedirs(out_img_dir, exist_ok=True)

doc7 = fitz.open(pdf_ist7)

# Pertanyaan dimulai dari halaman 2 (indeks 2) sampai 21 (indeks 21). Total 20 soal.
question_idx = 1
for i in range(2, 22):
    page = doc7[i]
    images = page.get_images(full=True)
    if len(images) >= 2:
        # Gambar kedua (indeks 1) adalah potongan puzzle (soal yang dilingkari merah oleh user)
        xref = images[1][0]
        base_image = doc7.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        filename = f"q_{question_idx}.{image_ext}"
        filepath = os.path.join(out_img_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        print(f"Extracted {filename} from Page {i} (Size: {len(image_bytes)} bytes)")
        question_idx += 1
    else:
        print(f"Page {i} does not have enough images.")

print("Selesai mengekstrak ulang gambar soal yang benar!")
