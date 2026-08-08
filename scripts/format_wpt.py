import json
import re

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    content = q["content"]
    # Clean up massive spaces
    content = re.sub(r'\s{3,}', ' \n\n ', content)
    # also strip trailing numbers if any are left like " 21." or " 25."
    content = re.sub(r'\s+\d+\.$', '', content)
    q["content"] = content

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Cleaned spaces and trailing numbers in WPT final JSON")
