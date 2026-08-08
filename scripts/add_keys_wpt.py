import json

keys = {
    1: '4', 2: '2', 3: '3', 4: '2', 5: '3', 6: '1', 7: '3', 8: '0.125', 9: '1', 10: '4',
    11: '3', 12: '6000', 13: '1', 14: '2', 15: '20', 16: '2', 17: 'A', 18: '13', 19: '3', 20: '1',
    21: '20', 22: 'S', 23: '25', 24: '2', 25: '3', 26: '1', 27: '0.03', 28: '3', 29: '6', 30: '10',
    31: 'E', 32: '1', 33: '3', 34: '18', 35: '0.25', 36: '24', 37: '0.0625', 38: 'C', 39: '2', 40: '1',
    41: '14', 42: 'C', 43: '4', 44: '2', 45: '2.4', 46: '2', 47: '3', 48: '675', 49: '1245', 50: '12'
}

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_cleaned.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    q["correct"] = keys.get(q["number"])
    # Map images manually
    if q["number"] in [7, 16, 31, 34, 42, 49]:
        q["is_image"] = True
    if q["number"] in [7, 16, 31, 34, 42, 49]:
        q["is_image"] = True
    else:
        q["is_image"] = False

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("WPT Final JSON prepared with answer keys!")
