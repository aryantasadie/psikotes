import json
import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

text = open(os.path.join(base_dir, 'scripts', 'tiki_3.txt'), encoding='utf-8').read()
parts = text.split("SOAL TIKI TINGGI 3")
if len(parts) > 1:
    q_text = parts[-1]
else:
    q_text = text

lines = [l.strip() for l in q_text.splitlines() if l.strip()]

questions_dict = {}

i = 0
while i < len(lines):
    # Detect Question Block
    if lines[i].isdigit() and 1 <= int(lines[i]) <= 40:
        q_num = int(lines[i])
        
        # collect text until we hit another number
        curr = i + 1
        text_lines = []
        while curr < len(lines):
            l = lines[curr]
            if l.isdigit():
                break
            if l.endswith('.') and l[:-1].isdigit(): 
                break
            if l.startswith("A") and len(l) == 1: # "A" option
                break
            if l.startswith("Centang") or l.startswith("---"):
                break
            if l == "Konten ini tidak dibuat atau didukung oleh Google." or l == "Formulir":
                break
                
            text_lines.append(l)
            curr += 1
            
        questions_dict[q_num] = " ".join(text_lines)
        i = curr
        continue

    i += 1

print(f"Extracted {len(questions_dict)} question texts.")

final_questions = []
for n in range(1, 41):
    content = questions_dict.get(n, "")
    
    # We want to format the content as: "A) Kata1 B) Kata2 C) Kata3 D) Kata4"
    # Wait, the extracted text might just be "A) SEDIKIT B) TEPAT C) JERNIH D) BANYAK"
    # Let's clean it up slightly if needed, or just leave it.
    
    final_questions.append({
        "number": n,
        "content": content,
        "options": ["A", "B", "C", "D"]
    })
        
with open(os.path.join(base_dir, "scripts", "tiki3_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(final_questions, f, indent=2)

print("TIKI 3 parse complete!")
