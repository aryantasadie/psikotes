import json
import re

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    c = q["content"]
    
    # Q8
    if q["number"] == 8:
        c = "PERHATIKAN URUTAN ANGKA BERIKUT, ANGKA BERAPA YANG SELANJUTNYA MUNCUL:\n8, 4, 2, 1, 0.5, 0.25, ?"
    
    # Q31
    if q["number"] == 31:
        c = "SATU ANGKA DARI RANGKAIAN BERIKUT TIDAK COCOK DENGAN POLA ANGKA YANG LAINNYA. ANGKA BERAPAKAH ITU ?\n½, ¼, 1/6, 1/8, 1/9, 1/12"
        
    # Q37
    if q["number"] == 37:
        c = "APAKAH ANGKA SELANJUTNYA DARI SERI INI ?\n1, 0.5, 0.25, 0.125, ?"
        
    # Q25
    if q["number"] == 25:
        c = "CANVASS - CANVAS\nAPAKAH KATA-KATA INI :"
        
    # Q28
    if q["number"] == 28:
        c = "INGENIOUS - INGENUOUS\nAPAKAH KATA-KATA INI :"
        
    # Q33
    if q["number"] == 33:
        c = "DAPAT DIPERCAYA - GAMPANG DIPERCAYA\nAPAKAH KATA-KATA INI :"
        
    # Q39
    if q["number"] == 39:
        c = "APAKAH ARTI DARI KALIMAT BERIKUT:\nSEBUAH SAPU YANG BARU MENYAPU DENGAN BERSIH. SEPATU YANG SUDAH LAMA SIFATNYA MAKIN LUNAK"
        
    # Q44
    if q["number"] == 44:
        c = "APAKAH MAKNA DARI KALIMAT BERIKUT:\nTIDAK ADA ORANG JUJUR MEMINTA MAAF ATAS KEJUJURANNYA. KEJUJURAN DIHORMATI DAN LAPAR PUJIAN"
        
    # Q50
    if q["number"] == 50:
        c = c.replace("Konten ini tidak dibuat atau didukung oleh Google. Formulir", "").strip()
        
    q["content"] = c

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Fixed specific WPT questions texts")
