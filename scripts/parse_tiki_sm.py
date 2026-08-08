import os
import json

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

def parse_tiki(filename, test_type):
    with open(os.path.join(base_dir, "scripts", filename), "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip() and not l.startswith("--- Page")]
    
    start_idx = 0
    for i, line in enumerate(lines):
        if line == f"SOAL TIKI TINGGI {test_type}":
            start_idx = i + 1
            break
            
    questions = []
    i = start_idx
    
    # States
    while i < len(lines):
        # Look for the google form question number e.g. "4."
        if lines[i].endswith("."):
            i += 1
            if i < len(lines) and ("Tandai satu oval saja" in lines[i] or "Centang semua yang sesuai" in lines[i]):
                i += 1
                # Read options
                options = []
                while i < len(lines) and (lines[i].startswith("A") or lines[i].startswith("B") or lines[i].startswith("C") or lines[i].startswith("D")):
                    options.append(lines[i])
                    i += 1
                
                if len(options) == 4:
                    # Now the next line is the test question number
                    test_q_num = lines[i]
                    i += 1
                    
                    # Next line(s) are the question text, until next google form question number or EOF
                    q_text_lines = []
                    while i < len(lines) and not (lines[i].endswith(".") and lines[i][:-1].isdigit()):
                        q_text_lines.append(lines[i])
                        i += 1
                        
                    q_content = " ".join(q_text_lines)
                    questions.append({
                        "number": int(test_q_num),
                        "content": q_content,
                        "options": options
                    })
                    continue
        i += 1
        
    return sorted(questions, key=lambda x: x["number"])

tiki1 = parse_tiki("tiki_1.txt", "1")
print("Parsed TIKI 1:", len(tiki1), "questions")

tiki3 = parse_tiki("tiki_3.txt", "3")
print("Parsed TIKI 3:", len(tiki3), "questions")

with open(os.path.join(base_dir, "scripts", "tiki1_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(tiki1, f, indent=2)
with open(os.path.join(base_dir, "scripts", "tiki3_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(tiki3, f, indent=2)
