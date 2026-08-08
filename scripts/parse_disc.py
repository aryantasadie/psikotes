import PyPDF2
import json

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Kepribadian\DISC - Google Formulir.pdf"
try:
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        print(text[:2000])  # Print first 2000 chars to understand structure
        
        with open("disc_raw.txt", "w", encoding="utf-8") as out:
            out.write(text)
except Exception as e:
    print("Error:", e)
