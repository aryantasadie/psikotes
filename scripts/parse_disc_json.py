import re
import json

with open("disc_raw.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Clean up noise first
text = re.sub(r'MOST\s*\(.*?\)\s*\**', '', text, flags=re.IGNORECASE)
text = re.sub(r'LEAST\s*\(.*?\)\s*\**', '', text, flags=re.IGNORECASE)
text = re.sub(r'MOST\s*&\s*LEAST.*?\n', '', text, flags=re.IGNORECASE)
text = re.sub(r'MOST.*?\n', '', text, flags=re.IGNORECASE)

lines = text.split('\n')
options_blocks = []
current_block = []

for line in lines:
    line = line.strip()
    if re.match(r'^[A-D]\.', line):
        current_block.append(line)
        if line.startswith('D.'):
            options_blocks.append(current_block)
            current_block = []

unique_blocks = []
for block in options_blocks:
    if block not in unique_blocks:
        unique_blocks.append(block)
        if len(unique_blocks) == 24:
            break

questions = []
for i, block in enumerate(unique_blocks):
    questions.append({
        "number": i + 1,
        "content": f"Pilih satu pernyataan yang PALING MENGGAMBARKAN DIRI ANDA (MOST) dan satu yang PALING TIDAK MENGGAMBARKAN DIRI ANDA (LEAST).",
        "options": block,
        "is_image": False,
        "correct": ""
    })

print(f"Parsed {len(questions)} questions")

with open("scripts/disc_parsed.json", "w", encoding="utf-8") as out:
    json.dump(questions, out, indent=2)
