import json

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q["number"] == 43:
        q["options"] = [
            "1. 10",
            "2. 1",
            "3. 0.999",
            "4. 0.33",
            "5. 11"
        ]

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Fixed Q43 options")
