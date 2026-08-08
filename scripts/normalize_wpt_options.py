import json

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q["options"]:
        new_options = []
        for i, opt in enumerate(q["options"]):
            opt = opt.strip()
            if not opt: continue
            
            # If it already starts with a letter/number and dot like "A. " or "1. "
            if len(opt) > 2 and opt[1] == '.' and opt[0].isalnum():
                new_options.append(opt)
            else:
                # Add "1. ", "2. " prefix
                new_options.append(f"{i+1}. {opt}")
        q["options"] = new_options

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_final.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Normalized WPT options")
