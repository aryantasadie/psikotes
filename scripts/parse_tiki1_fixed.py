import re
import json
import os

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

text = open(os.path.join(base_dir, 'scripts', 'tiki_1.txt'), encoding='utf-8').read()

# Split after "SOAL TIKI TINGGI 1"
parts = text.split("SOAL TIKI TINGGI 1")
if len(parts) > 1:
    q_text = parts[1]
else:
    q_text = text

# Strip page breaks
q_text = re.sub(r'---\s*Page\s*\d+\s*---', '', q_text)

# 1. Extract all Option Blocks
# An option block is A) ... B) ... C) ... D) ...
opt_pattern = re.compile(r'A\)\s*(.*?)\s+B\)\s*(.*?)\s+C\)\s*(.*?)\s+D\)\s*([^\n]*)')
options_matches = opt_pattern.findall(q_text)

print(f"Found {len(options_matches)} option blocks.")

# 2. Extract all Question Text Blocks
# We can just look for the question numbers 1 to 40 on their own line, followed by the text.
# The text might be on the same line or next line.
# Format from text:
# 1\n78 : 13 =.....\n
# 2\n ..... + 49 = 81\n
q_blocks = []

# To extract reliably, let's just find lines that are exactly '1', '2', ..., '40'
lines = [l.strip() for l in q_text.split('\n') if l.strip()]

q_texts = {}
for i in range(1, 41):
    # find the line that is exactly str(i)
    try:
        idx = lines.index(str(i))
        # The question text is the lines following it until we hit another number, or 'A)', or 'Tandai', etc.
        text_lines = []
        curr = idx + 1
        while curr < len(lines):
            l = lines[curr]
            # Stop if we hit something that looks like the start of another option block or question
            if l == str(i+1) or l.endswith('.') and l[:-1].isdigit():
                break
            if l.startswith("A)") or l.startswith("Tandai") or l.startswith("Centang"):
                break
            if l == "Konten ini tidak dibuat atau didukung oleh Google." or l == "Formulir":
                break
            text_lines.append(l)
            curr += 1
            
        q_texts[i] = " ".join(text_lines).strip()
    except ValueError:
        print(f"Could not find question number {i}")

print(f"Extracted {len(q_texts)} question texts.")

# Combine them
questions = []
for i in range(1, 41):
    if i-1 < len(options_matches):
        opts = options_matches[i-1]
        a, b, c, d = opts
        questions.append({
            "number": i,
            "content": q_texts.get(i, ""),
            "options": [f"A) {a.strip()}", f"B) {b.strip()}", f"C) {c.strip()}", f"D) {d.strip()}"]
        })

with open(os.path.join(base_dir, "scripts", "tiki1_parsed_fixed.json"), "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Done parsing TIKI 1.")
