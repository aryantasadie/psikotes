import re
import json

def parse_ist2():
    with open("scripts/ist2_raw.txt", "r", encoding="utf-8") as f:
        text = f.read()
    
    matches = re.findall(r'A\) (.*?)\nB\) (.*?)\nC\) (.*?)\nD\) (.*?)\nE\) (.*?)\n', text)
    
    questions = []
    for i, m in enumerate(matches):
        if i >= 20: break
        questions.append({
            "testType": "IST 2",
            "content": "Temukan satu kata yang tidak memiliki kesamaan dengan empat kata lainnya.",
            "options": [m[0].strip(), m[1].strip(), m[2].strip(), m[3].strip(), m[4].strip()]
        })
    return questions

def parse_ist3():
    with open("scripts/ist3_raw.txt", "r", encoding="utf-8") as f:
        text = f.read()
    
    # Matches analogies: 41\nMENEMUKAN : MENGHILANGKAN = MENGINGAT : ?
    analogies = re.findall(r'(\d+)\n(.*?\?)\n', text)
    
    # Matches options
    opt_matches = re.findall(r'A\) (.*?)\nB\) (.*?)\nC\) (.*?)\nD\) (.*?)\nE\) (.*?)\n', text)
    
    questions = []
    # Note: opt_matches includes the example questions too. We need the last 20 options.
    # The analogies regex should capture questions 41 to 60. Let's just zip them carefully.
    
    # Filter analogies to just those starting with 41, 42... up to 60.
    valid_analogies = [a[1].strip().replace('\xa0', ' ') for a in analogies if 41 <= int(a[0]) <= 60]
    
    valid_options = opt_matches[-20:]
    
    for i in range(min(len(valid_analogies), len(valid_options))):
        m = valid_options[i]
        questions.append({
            "testType": "IST 3",
            "content": valid_analogies[i],
            "options": [m[0].strip(), m[1].strip(), m[2].strip(), m[3].strip(), m[4].strip()]
        })
    return questions

q2 = parse_ist2()
q3 = parse_ist3()

print("IST 2 Questions:", len(q2))
print("IST 3 Questions:", len(q3))

with open("scripts/ist23_data.json", "w", encoding="utf-8") as f:
    json.dump(q2 + q3, f, indent=2, ensure_ascii=False)
