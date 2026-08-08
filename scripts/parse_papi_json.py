import re
import json

with open("scripts/papi_raw.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Try a state machine to parse A) and B) including multiline
lines = text.split('\n')
questions = []
current_a = None
current_b = None
state = 0 # 0: looking for A, 1: reading A, 2: reading B

for line in lines:
    line = line.strip()
    if not line:
        continue
        
    if re.match(r'^A\)', line):
        current_a = line
        state = 1
    elif re.match(r'^B\)', line):
        current_b = line
        state = 2
    elif state == 1 and not re.match(r'^\d+\.', line) and not re.match(r'^Tandai', line):
        current_a += " " + line
    elif state == 2 and not re.match(r'^\d+\.', line) and not re.match(r'^Tandai', line) and not '*' in line:
        current_b += " " + line
    elif state == 2 and (re.match(r'^\d+\.', line) or '*' in line):
        # We finished reading a pair and hit something new
        questions.append({
            "number": len(questions) + 1,
            "content": "Pilih satu pernyataan yang PALING SESUAI dengan diri Anda.",
            "options": [current_a, current_b],
            "is_image": False,
            "correct": ""
        })
        current_a = None
        current_b = None
        state = 0

# Append the last one if it exists
if state == 2 and current_a and current_b:
    questions.append({
        "number": len(questions) + 1,
        "content": "Pilih satu pernyataan yang PALING SESUAI dengan diri Anda.",
        "options": [current_a, current_b],
        "is_image": False,
        "correct": ""
    })

print(f"Parsed {len(questions)} questions")

# Clean up options by replacing 'A) ' and 'B) ' and extraneous asterisks
for q in questions:
    q["options"][0] = re.sub(r'^A\)\s*', '', q["options"][0]).strip()
    q["options"][1] = re.sub(r'^B\)\s*', '', q["options"][1]).strip()
    # Remove any trailing numbers followed by asterisk (like 11*)
    q["options"][0] = re.sub(r'\s*\d+\*$', '', q["options"][0]).strip()
    q["options"][1] = re.sub(r'\s*\d+\*$', '', q["options"][1]).strip()
    # Remove page numbers or "IDENTITAS DIRI" if leaked
    q["options"][0] = re.sub(r'IDENTITAS DIRI P APIKOSTIK', '', q["options"][0]).strip()
    q["options"][1] = re.sub(r'IDENTITAS DIRI P APIKOSTIK', '', q["options"][1]).strip()

with open("scripts/papi_parsed.json", "w", encoding="utf-8") as out:
    json.dump(questions, out, indent=2)
