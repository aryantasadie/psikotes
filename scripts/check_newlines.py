import json

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if not q["is_image"] and '\n' in q["content"]:
        print(f"Q{q['number']}:\n{q['content']}\n" + "-"*40)
