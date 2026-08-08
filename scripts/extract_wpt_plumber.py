import pdfplumber

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Intelegensi\WPT\WPT - Google Formulir.pdf"

with pdfplumber.open(pdf_path) as pdf:
    with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_plumber.txt", "w", encoding="utf-8") as f:
        for page in pdf.pages:
            text = page.extract_text(layout=True)
            if text:
                f.write(text)
            f.write("\n---\n")

print("Extracted WPT using pdfplumber")
