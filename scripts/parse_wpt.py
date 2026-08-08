import json
import re

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_raw.txt", "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f.readlines()]

questions = []
current_q = None

# We look for a pattern where a line is just a number from 1 to 50.
# In Google Forms, the question number might be preceded by a line with X.
i = 0
while i < len(lines):
    line = lines[i]
    if line.isdigit() and 1 <= int(line) <= 50:
        # Check if previous line is a form item number (e.g. "4." or "10.")
        if i > 0 and re.match(r"^\d+\.$", lines[i-1]):
            q_num = int(line)
            
            # Start a new question
            if current_q:
                questions.append(current_q)
                
            current_q = {
                "number": q_num,
                "content": "",
                "options": [],
                "is_image": False
            }
            
            # The next line is the question text
            i += 1
            if i < len(lines):
                current_q["content"] = lines[i]
            
            # Now we look for options or just let the loop continue
            # Options start with "Tandai satu oval saja."
            j = i + 1
            while j < len(lines) and not (lines[j].isdigit() and j > 0 and re.match(r"^\d+\.$", lines[j-1])):
                if lines[j] == "Tandai satu oval saja.":
                    # Parse options
                    j += 1
                    while j < len(lines) and not (lines[j].isdigit() and j > 0 and re.match(r"^\d+\.$", lines[j-1])) and lines[j] != "---":
                        if lines[j]:
                            current_q["options"].append(lines[j])
                        j += 1
                    i = j - 1
                    break
                elif lines[j] != "---" and lines[j]:
                    # Append to content if not options
                    current_q["content"] += " " + lines[j]
                j += 1
    i += 1

if current_q:
    questions.append(current_q)

# Post process options to clean up prefixes like "1. "
for q in questions:
    cleaned_options = []
    for opt in q["options"]:
        # Match "1. Text" or just "1"
        match = re.match(r"^\d+\.\s*(.*)", opt)
        if match:
            cleaned_options.append(match.group(1))
        else:
            cleaned_options.append(opt)
    q["options"] = cleaned_options

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_parsed.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print(f"Parsed {len(questions)} questions!")
