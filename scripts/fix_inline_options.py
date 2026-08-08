import json
import re

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    c = q["content"]
    
    # Check for "1. BENAR ... 2. SALAH ... 3. TIDAK TAHU" or similar
    # e.g. "LALU, JAWABLAH APAKAH KALIMAT YANG TERAKHIR 1. BENAR \n\n 2. SALAH \n\n 3. TIDAK TAHU ?"
    # "APAKAH PERNYATAAN TERAKHIR: 1.BENAR 2.SALAH 3.TIDAK TAHU."
    # "PERNYATAAN TERAKHIR: 1. BENAR \n\n 2. SALAH \n\n 3. TIDAK TAHU"
    
    # We can just remove "1. BENAR \n\n 2. SALAH \n\n 3. TIDAK TAHU ?" and variations.
    c = re.sub(r'1\.\s*BENAR\s*2\.\s*SALAH\s*3\.\s*TIDAK TAHU\s*\??', '?', c, flags=re.IGNORECASE)
    # Handle with \n
    c = re.sub(r'1\.\s*BENAR\s*\n*\s*2\.\s*SALAH\s*\n*\s*3\.\s*TIDAK TAHU\s*\??', '?', c, flags=re.IGNORECASE)
    
    # For Q13 specifically from the screenshot:
    # "LALU, JAWABLAH APAKAH KALIMAT YANG TERAKHIR 1. BENAR \n\n 2. SALAH \n\n 3. TIDAK TAHU ?"
    c = re.sub(r'1\.\s*BENAR\s*\n*\s*2\.\s*SALAH\s*\n*\s*3\.\s*TIDAK TAHU\s*\?', '', c, flags=re.IGNORECASE)
    
    # Also clean up multiple spaces/newlines just in case
    c = re.sub(r'\s{3,}', '\n\n', c)
    c = c.replace('? ?', '?').replace('?  ?', '?')
    
    # Make sure we don't have dangling "?" if it was meant to end the sentence nicely
    
    # Q13 manual fix if needed
    if q["number"] == 13:
        c = "ANGGAPLAH DUA PERNYATAAN PERTAMA ADALAH BENAR. LALU, JAWABLAH APAKAH KALIMAT YANG TERAKHIR BENAR ATAU SALAH ATAU TIDAK TAHU?\n\nANAK-ANAK LELAKI INI ADALAH ANAK YANG NORMAL.\nSEMUA ANAK NORMAL SIFATNYA AKTIF.\nANAK-ANAK LEKAKI INI AKTIF."
        
    if q["number"] == 20:
        c = "ANGGAPLAH DUA PERNYATAAN PERTAMA ADALAH BENAR. APAKAH PERNYATAAN TERAKHIR BENAR, SALAH, ATAU TIDAK TAHU?\n\nJOHN SEUSIA DENGAN SALLY.\nSALLY LEBIH MUDA DARI BILL.\nJOHN LEBIH MUDA DARI BILL."
        
    if q["number"] == 26:
        c = "ANGGAPLAH DUA PERNYATAAN PERTAMA ADALAH BENAR. APAKAH PERNYATAAN TERAKHIR BENAR, SALAH, ATAU TIDAK TAHU?\n\nSEMUA SISWA MENGIKUTI UJIAN.\nBEBERAPA ORANG DI RUANGAN INI ADALAH SISWA.\nBEBERAPA ORANG DI RUANGAN INI MENGIKUTI UJIAN."
        
    if q["number"] == 47:
        c = "ANGGAPLAH DUA PERNYATAAN PERTAMA INI BENAR. APAKAH PERTANYAAN TERAKHIR BENAR, SALAH, ATAU TIDAK TAHU?\n\nORANG BESAR DIBODOHI.\nSAYA DIBODOHI.\nSAYA ADALAH ORANG BESAR."

    q["content"] = c

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Fixed inline options in questions")
