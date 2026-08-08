import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf_ist2 = os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST SOAL 2 - Google Formulir.pdf")
pdf_ist3 = os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST SOAL 3 - Google Formulir.pdf")

with open(os.path.join(base_dir, "psikotes-app", "scripts", "ist2_raw.txt"), "w", encoding="utf-8") as f:
    doc2 = fitz.open(pdf_ist2)
    for page in doc2:
        f.write(page.get_text())

with open(os.path.join(base_dir, "psikotes-app", "scripts", "ist3_raw.txt"), "w", encoding="utf-8") as f:
    doc3 = fitz.open(pdf_ist3)
    for page in doc3:
        f.write(page.get_text())

print("Done extracting raw text.")
