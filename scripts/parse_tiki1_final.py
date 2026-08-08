import json
import os

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

text = open(os.path.join(base_dir, 'scripts', 'tiki_1.txt'), encoding='utf-8').read()
parts = text.split("SOAL TIKI TINGGI 1")
if len(parts) > 1:
    q_text = parts[-1]
else:
    q_text = text

lines = [l.strip() for l in q_text.splitlines() if l.strip()]

options_list = []
questions_dict = {}

i = 0
while i < len(lines):
    # Detect Option Block
    if lines[i].startswith("A)") and i+3 < len(lines):
        if lines[i+1].startswith("B)") and lines[i+2].startswith("C)") and lines[i+3].startswith("D)"):
            optA = lines[i][2:].strip()
            optB = lines[i+1][2:].strip()
            optC = lines[i+2][2:].strip()
            optD = lines[i+3][2:].strip()
            options_list.append([f"A) {optA}", f"B) {optB}", f"C) {optC}", f"D) {optD}"])
            i += 4
            continue
            
    # Detect Question Text Block
    # Look for exact numbers 1 to 40
    if lines[i].isdigit() and 1 <= int(lines[i]) <= 40:
        q_num = int(lines[i])
        
        # collect text until we hit another number, or an option block, or standard google form text
        curr = i + 1
        text_lines = []
        while curr < len(lines):
            l = lines[curr]
            if l.isdigit():
                break
            if l.endswith('.') and l[:-1].isdigit(): # google form numbers like 4.
                break
            if l.startswith("A)") or l.startswith("Tandai") or l.startswith("---"):
                break
            if l == "Konten ini tidak dibuat atau didukung oleh Google." or l == "Formulir":
                break
                
            text_lines.append(l)
            curr += 1
            
        questions_dict[q_num] = " ".join(text_lines)
        i = curr
        continue

    i += 1

print(f"Extracted {len(options_list)} options and {len(questions_dict)} question texts.")

final_questions = []
for n in range(1, 41):
    if n <= len(options_list):
        opts = options_list[n-1]
        content = questions_dict.get(n, "")
        final_questions.append({
            "number": n,
            "content": content,
            "options": opts
        })
        
with open(os.path.join(base_dir, "scripts", "tiki1_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(final_questions, f, indent=2)

print("TIKI 1 parse complete!")
