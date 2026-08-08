import PyPDF2

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Leadership\POWER LEADER - Google Formulir.pdf"
try:
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        with open("scripts/power_raw.txt", "w", encoding="utf-8") as out:
            out.write(text)
        print(text[:1000])
except Exception as e:
    print("Error:", e)
