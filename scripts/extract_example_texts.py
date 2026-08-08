import fitz
import os
import glob

base_dir = r"d:\Kuliah\Kerja\psikotes"
app_dir = os.path.join(base_dir, "psikotes-app")

pdfs_to_extract = [
    os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 1 - Google Formulir.pdf"),
    os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 2 - Google Formulir.pdf"),
    os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 3 - Google Formulir.pdf"),
    os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 4 - Google Formulir.pdf"),
    os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST - 7 - Tes Logika Bentuk Ruang.pdf"),
    os.path.join(base_dir, "soal", "Intelegensi", "TIKI", "TIKI TINGGI TEST 2 - Google Formulir.pdf"),
]

for pdf_path in pdfs_to_extract:
    if os.path.exists(pdf_path):
        doc = fitz.open(pdf_path)
        text = "\n---Page---\n".join([page.get_text() for page in doc])
        basename = os.path.basename(pdf_path).replace(" ", "_")
        out_path = os.path.join(app_dir, "scripts", f"{basename}.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted text for {basename}")
    else:
        print(f"Not found: {pdf_path}")
