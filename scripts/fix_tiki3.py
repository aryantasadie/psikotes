import json
import re

with open('d:/Kuliah/Kerja/psikotes/psikotes-app/scripts/tiki3_parsed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for q in data:
    content = q['content']
    # content is like: "A) SEDIKIT         B) TEPAT             C) JERNIH              D) BANYAK"
    # We want to extract the 4 options.
    # Regex to find A), B), C), D) and capture the text after it
    pattern = r"A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*)"
    match = re.search(pattern, content)
    if match:
        q['options'] = [
            match.group(1).strip(),
            match.group(2).strip(),
            match.group(3).strip(),
            match.group(4).strip()
        ]
        q['content'] = "" # Clear the content
    else:
        print(f"Regex failed for question {q['number']}: {content}")

with open('d:/Kuliah/Kerja/psikotes/psikotes-app/scripts/tiki3_parsed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Fixed tiki3_parsed.json!")
