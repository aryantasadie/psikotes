import os
import re
import json

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

def get_clean_text(filename):
    with open(os.path.join(base_dir, "scripts", filename), "r", encoding="utf-8") as f:
        # strip page breaks entirely
        lines = []
        for l in f:
            if not l.startswith("--- Page"):
                lines.append(l)
    return "".join(lines)

def parse_tiki1():
    text = get_clean_text("tiki_1.txt")
    pattern = re.compile(r'Tandai satu oval saja\.\s*A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*?)\s*(\d+)\s*(.*?)(?=\d+\.\s*Tandai|\Z)', re.DOTALL)
    matches = pattern.findall(text)
    
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
    text = get_clean_text("tiki_3.txt")
    parts = text.split("SOAL TIKI TINGGI 3")
    if len(parts) < 2: return []
    
    q_text = parts[1]
    
    # Clean out "Centang semua yang sesuai", "A\nB\nC\nD", form numbers, etc.
    q_text = re.sub(r'\d+\.\nCentang semua yang sesuai\.\nA\nB\nC\nD\n', '', q_text)
    
    # Now we have lines like:
    # 1\nA) SEDIKIT      B) TEPAT       C) JERNIH      D) BANYAK
    # Pattern: number followed by A) B) C) D) until next number
    pattern = re.compile(r'\b(\d+)\n+A\)\s*(.*?)\s+B\)\s*(.*?)\s+C\)\s*(.*?)\s+D\)\s*(.*?)(?=\b\d+\n+A\)|\Z)', re.DOTALL)
    matches = pattern.findall(q_text)
    
    results = []
    for m in matches:
        qnum, optA, optB, optC, optD = m
        results.append({
            "number": int(qnum),
            "content": "",
            "options": [f"A) {optA.strip()}", f"B) {optB.strip()}", f"C) {optC.strip()}", f"D) {optD.strip()}"]
        })
            
    return sorted(results, key=lambda x: x["number"])

t1 = parse_tiki1()
print("Parsed TIKI 1:", len(t1))
t3 = parse_tiki3()
print("Parsed TIKI 3:", len(t3))

with open(os.path.join(base_dir, "scripts", "tiki1_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(t1, f, indent=2)
with open(os.path.join(base_dir, "scripts", "tiki3_parsed.json"), "w", encoding="utf-8") as f:
    json.dump(t3, f, indent=2)
