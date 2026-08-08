import PyPDF2
import json

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Kepribadian\PAPIKOSTIK - Google Formulir.pdf"
try:
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        with open("scripts/papi_raw.txt", "w", encoding="utf-8") as out:
            out.write(text)
        print("Successfully extracted PAPI Kostick text")
except Exception as e:
    print("Error:", e)
