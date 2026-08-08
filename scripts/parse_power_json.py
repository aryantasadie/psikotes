import re
import json

with open("scripts/power_raw.txt", "r", encoding="utf-8") as f:
    text = f.read()

lines = text.split('\n')
questions = []
current_a = None
current_b = None
state = 0 

for line in lines:
    line = line.strip()
    if not line:
        continue
        
    if re.match(r'^A\.', line) or re.match(r'^A\)', line):
        current_a = line
        state = 1
    elif re.match(r'^B\.', line) or re.match(r'^B\)', line):
        current_b = line
        state = 2
    elif state == 1 and not re.match(r'^\d+\.', line) and not re.match(r'^Tandai', line):
        current_a += " " + line
    elif state == 2 and not re.match(r'^\d+\.', line) and not re.match(r'^Tandai', line) and not '*' in line:
        current_b += " " + line
    elif state == 2 and (re.match(r'^\d+\.', line) or '*' in line):
        questions.append({
            "number": len(questions) + 1,
            "content": "Pilih salah satu jawaban yang menggambarkan karakteristik / kesesuaian dengan diri anda.",
            "options": [current_a, current_b],
            "is_image": False,
            "correct": ""
        })
        current_a = None
        current_b = None
        state = 0

if state == 2 and current_a and current_b:
    questions.append({
        "number": len(questions) + 1,
        "content": "Pilih salah satu jawaban yang menggambarkan karakteristik / kesesuaian dengan diri anda.",
        "options": [current_a, current_b],
        "is_image": False,
        "correct": ""
    })

print(f"Parsed {len(questions)} questions for POWER LEADER")

for q in questions:
    q["options"][0] = re.sub(r'^A[\.\)]\s*', '', q["options"][0]).strip()
    q["options"][1] = re.sub(r'^B[\.\)]\s*', '', q["options"][1]).strip()
    q["options"][0] = re.sub(r'\s*\d+\*$', '', q["options"][0]).strip()
    q["options"][1] = re.sub(r'\s*\d+\*$', '', q["options"][1]).strip()
    q["options"][0] = re.sub(r'IDENTITAS DIRI.*', '', q["options"][0], flags=re.IGNORECASE).strip()
    q["options"][1] = re.sub(r'IDENTITAS DIRI.*', '', q["options"][1], flags=re.IGNORECASE).strip()

with open("scripts/power_parsed.json", "w", encoding="utf-8") as out:
    json.dump(questions, out, indent=2)
