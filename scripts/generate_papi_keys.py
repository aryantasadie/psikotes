import re
import json

with open(r"d:\Kuliah\Kerja\psikotes\kunci jawab dan skema\ref_papi_disc_msdt.md", "r", encoding="utf-8") as f:
    text = f.read()

# Extract the table lines
# | **1** | G | E | **31** | G | R | **61** | G | T |
matches = re.findall(r'\|\s*\**(\d+)\**\s*\|\s*([A-Z])\s*\|\s*([A-Z])\s*\|\s*(?:\**(\d+)\**\s*\|\s*([A-Z])\s*\|\s*([A-Z])\s*\|)?\s*(?:\**(\d+)\**\s*\|\s*([A-Z])\s*\|\s*([A-Z])\s*\|)?', text)

lookup = {}
for m in matches:
    if m[0]: lookup[int(m[0])] = {"A": m[1], "B": m[2]}
    if m[3]: lookup[int(m[3])] = {"A": m[4], "B": m[5]}
    if m[6]: lookup[int(m[6])] = {"A": m[7], "B": m[8]}

print("const papiScoringKeys: Record<number, { A: string, B: string }> = " + json.dumps(lookup, indent=2) + ";")
