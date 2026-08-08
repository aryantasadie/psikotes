import json

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q["number"] in [7, 16, 38, 40, 42, 49]:
        q["is_image"] = True
    else:
        q["is_image"] = False

    if q["number"] == 23:
        q["content"] = "DUA DARI PERIBAHASA BERIKUT INI MEMILIKI ARTI SAMA. MANAKAH ITU? Centang semua yang sesuai."
        q["options"] = [
            "1. SEMAKIN BANYAK MEMILIKI SAPI, AKAN MEMILIKI SATU ANAK SAPI YANG BURUK.",
            "2. ANAK SEPERTI AYAHNYA.",
            "3. BILA TERTINGGAL SAMA JAUHNYA DENGAN SATU MIL.",
            "4. SEORANG DIKENAL DARI PERSAHABATAN YANG DIJALIN.",
            "5. MEREKA ADALAH BENIH DARI MANGKUK YANG SAMA"
        ]
        
    if q["number"] == 41:
        q["content"] = "DUA DARI PERIBAHASA INI MEMILIKI MAKNA YANG SERUPA. MANAKAH ITU? Centang semua yang sesuai."
        q["options"] = [
            "1. ANDA TIDAK DAPAT MEMBUAT DOMPET SUTRA DARI KUPING BABI BETINA.",
            "2. ORANG YANG MENCURI TELUR AKAN MENCURI SAPI.",
            "3. BATU YANG BERGULING TIDAK AKAN MENGUMPULKAN LUMUT.",
            "4. ANDA TIDAK MUNGKIN MENGHANCURKAN KAPAL YANG SUDAH RUSAK.",
            "5. INI KETIDAKMUNGKINAN YANG TERJADI"
        ]

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Fixed WPT data")
