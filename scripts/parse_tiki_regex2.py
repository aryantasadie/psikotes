import os
import re
import json

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

def clean_text(filename):
    with open(os.path.join(base_dir, "scripts", filename), "r", encoding="utf-8") as f:
        # filter out page breaks entirely
        lines = [l for l in f if not l.startswith("--- Page")]
    return "\n".join(lines)

def parse_tiki1():
    text = clean_text("tiki_1.txt")
    parts = text.split("SOAL TIKI TINGGI 1")
    if len(parts) < 2: return []
    
    q_text = parts[1]
    
    # We look for: A) ... B) ... C) ... D) ... \n [number] \n [question text]
    # Google form format:
    # 4.\nTandai satu oval saja.\nA) 5\nB) 6\nC) 7\nD) 8\n1\n78 : 13 =.....
    pattern = re.compile(r'A\)\s*(.*?)\nB\)\s*(.*?)\nC\)\s*(.*?)\nD\)\s*(.*?)\n(\d+)\n(.*?)(?=\n\d+\.\nTandai|\Z)', re.DOTALL)
    
    matches = pattern.findall(q_text)
    results = []
    for m in matches:
        optA, optB, optC, optD, qnum, content = m
        content = content.strip().replace('\n', ' ')
        results.append({
            "number": int(qnum),
            "content": content,
            "options": [f"A) {optA.strip()}", f"B) {optB.strip()}", f"C) {optC.strip()}", f"D) {optD.strip()}"]
        })
    return sorted(results, key=lambda x: x["number"])

def parse_tiki3():
    text = clean_text("tiki_3.txt")
    parts = text.split("SOAL TIKI TINGGI 3")
    if len(parts) < 2: return []
    
    q_text = parts[1]
    
    # Format:
    # 4.\nCentang semua yang sesuai.\nA\nB\nC\nD\n1\nA) SEDIKIT      B) TEPAT       C) JERNIH      D) BANYAK
    pattern = re.compile(r'A\nB\nC\nD\n(\d+)\n(.*?)(?=\n\d+\.\nCentang|\Z)', re.DOTALL)
    
    matches = pattern.findall(q_text)
    results = []
    for m in matches:
        qnum, content = m
        content = content.strip().replace('\n', ' ')
        
        # We need to extract the A) B) C) D) from content
        sub_m = re.match(r'A\)\s*(.*?)\s+B\)\s*(.*?)\s+C\)\s*(.*?)\s+D\)\s*(.*)', content)
        if sub_m:
            optA, optB, optC, optD = sub_m.groups()
            results.append({
                "number": int(qnum),
                "content": "",
                "options": [f"A) {optA.strip()}", f"B) {optB.strip()}", f"C) {optC.strip()}", f"D) {optD.strip()}"]
            })
        else:
            print("Failed to parse options for TIKI 3 qnum:", qnum, "Content:", content)
    return sorted(results, key=lambda x: x["number"])

t1 = parse_tiki1()
print("Parsed TIKI 1:", len(t1))
t3 = parse_tiki3()
print("Parsed TIKI 3:", len(t3))

with open(os.path.join(base_dir, "scripts", "tiki1_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(t1, f, indent=2)
with open(os.path.join(base_dir, "scripts", "tiki3_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(t3, f, indent=2)
