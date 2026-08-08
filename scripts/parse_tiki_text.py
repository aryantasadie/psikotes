import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app"

def parse_tiki1():
    with open(os.path.join(base_dir, "scripts", "tiki_1.txt"), "r", encoding="utf-8") as f:
        text = f.read()

    # The questions start after "SOAL TIKI TINGGI 1"
    parts = text.split("SOAL TIKI TINGGI 1")
    if len(parts) < 2: return []
    
    questions_text = parts[1]
    
    # We need to extract the question number, the question text, and the options A-D.
    # We will use regex to find the patterns.
    # The pattern seems to be:
    # A) ...
    # B) ...
    # C) ...
    # D) ...
    # [number]
    # [question text]
    # --- Page X ---
    # Or something similar.
    # Let's extract block by block. A block starts with A) ... D) then number then question text.
    
    # Actually, the google form PDF extraction is:
    # [Google form question number].
    # Tandai satu oval saja.
    # A) [option]
    # B) [option]
    # C) [option]
    # D) [option]
    # [Test question number]
    # [Question text]
    
    q_pattern = re.compile(r'(\d+)\.\s*Tandai satu oval saja\.\s*A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*?)\s*(\d+)\s*(.*?)(?=\d+\.\s*Tandai satu oval saja|--- Page|$)', re.DOTALL)
    
    matches = q_pattern.findall(questions_text)
    
    results = []
    for m in matches:
        _, optA, optB, optC, optD, qnum, qtext = m
        qtext = qtext.strip().replace('\n', ' ')
        
        # Clean up any page breaks inside qtext
        qtext = re.sub(r'---\s*Page\s*\d+\s*---', '', qtext).strip()
        
        results.append({
            "number": int(qnum),
            "content": qtext,
            "options": [f"A) {optA}", f"B) {optB}", f"C) {optC}", f"D) {optD}"]
        })
    
    return sorted(results, key=lambda x: x["number"])

def parse_tiki3():
    with open(os.path.join(base_dir, "scripts", "tiki_3.txt"), "r", encoding="utf-8") as f:
        text = f.read()

    parts = text.split("SOAL TIKI TINGGI 3")
    if len(parts) < 2: return []
    
    questions_text = parts[1]
    
    # Google form extraction:
    # [Form Q num].
    # Centang semua yang sesuai.
    # A
    # B
    # C
    # D
    # [Test Q num]
    # A) [Word1] B) [Word2] C) [Word3] D) [Word4]
    
    q_pattern = re.compile(r'(\d+)\.\s*Centang semua yang sesuai\.\s*A\s*B\s*C\s*D\s*(\d+)\s*(.*?)(?=\d+\.\s*Centang semua yang sesuai|--- Page|$)', re.DOTALL)
    
    matches = q_pattern.findall(questions_text)
    
    results = []
    for m in matches:
        _, qnum, qtext_block = m
        qtext_block = qtext_block.strip().replace('\n', ' ')
        qtext_block = re.sub(r'---\s*Page\s*\d+\s*---', '', qtext_block).strip()
        
        # We need to extract the 4 words from qtext_block: A) W1 B) W2 C) W3 D) W4
        # Sometimes there are multiple spaces.
        sub_m = re.match(r'A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*)', qtext_block)
        
        if sub_m:
            optA, optB, optC, optD = sub_m.groups()
            results.append({
                "number": int(qnum),
                "content": "", # Content is empty, options are the words themselves
                "options": [f"A) {optA.strip()}", f"B) {optB.strip()}", f"C) {optC.strip()}", f"D) {optD.strip()}"]
            })
        else:
            print("Failed to match options in TIKI 3 for question", qnum)
    
    return sorted(results, key=lambda x: x["number"])

tiki1 = parse_tiki1()
print("Parsed TIKI 1:", len(tiki1), "questions")
if len(tiki1) > 0: print("Sample TIKI 1:", tiki1[0])

tiki3 = parse_tiki3()
print("Parsed TIKI 3:", len(tiki3), "questions")
if len(tiki3) > 0: print("Sample TIKI 3:", tiki3[0])

import json
with open(os.path.join(base_dir, "scripts", "tiki1_parsed.json"), "w") as f:
    json.dump(tiki1, f, indent=2)
with open(os.path.join(base_dir, "scripts", "tiki3_parsed.json"), "w") as f:
    json.dump(tiki3, f, indent=2)
