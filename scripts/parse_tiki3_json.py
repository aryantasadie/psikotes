import os
import re
import json

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

t = open(os.path.join(base_dir, 'scripts', 'tiki_3.txt'), encoding='utf-8').read()
# Match A) B) C) D) where options might have newlines or whatever
m = re.findall(r'A\)\s*([\s\S]*?)\s+B\)\s*([\s\S]*?)\s+C\)\s*([\s\S]*?)\s+D\)\s*([^\n]*)', t)

# get last 40
q_matches = m[-40:]

questions = []
for i, (a, b, c, d) in enumerate(q_matches):
    questions.append({
        "number": i + 1,
        "content": "",
        "options": [f"A) {a.strip()}", f"B) {b.strip()}", f"C) {c.strip()}", f"D) {d.strip()}"]
    })

with open(os.path.join(base_dir, "scripts", "tiki3_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print(f"Parsed {len(questions)} questions for TIKI 3")
