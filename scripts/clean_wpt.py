import json
import re

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_parsed.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    # Remove empty options
    q["options"] = [opt for opt in q["options"] if opt.strip()]
    
    # Strip trailing numbers like " 12." or " 16."
    content = q["content"]
    content = re.sub(r"\s+\d+\.$", "", content).strip()
    q["content"] = content
    
    if "GAMBAR" in content.upper():
        print(f"Q{q['number']}: {content}")
        q["is_image"] = True

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_cleaned.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Cleaned WPT JSON!")
