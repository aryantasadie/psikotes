import json

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q["number"] == 17:
        q["content"] = "SUSUNLAH KATA-KATA BERIKUT SEHINGGA MENJADI PERNYATAAN YANG BENAR. LALU TULISKAN HURUF TERAKHIR DARI KATA TERAKHIR SEBAGAI JAWABAN.\nSELALU - SEBUAH - KATA - KERJA - KALIMAT - SUATU - MEMILIKI"
    if q["number"] == 19:
        q["content"] = "IT'S - ITS\nAPAKAH KATA-KATA INI :"
    if q["number"] == 22:
        q["content"] = "SUSUNLAH KATA-KATA BERIKUT SEHINGGA MENJADI KALIMAT LENGKAP. JIKA KALIMAT ITU BENAR, PILIHLAH (B). JIKA KALIMAT ITU SALAH, PILIHLAH (S)\nTELUR - MENGHASILKAN - SEMUA - AYAM"

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Fixed Q17, Q19, Q22")
