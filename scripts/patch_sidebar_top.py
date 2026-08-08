import os
import re

files_to_patch = [
    'CFIT1.tsx', 'CFIT2.tsx', 'CFIT3.tsx', 'CFIT4.tsx',
    'TIKI1.tsx', 'TIKI2.tsx', 'TIKI3.tsx', 'TIKI4.tsx', 'TIKI6.tsx',
    'IST2.tsx', 'IST3.tsx', 'IST6.tsx', 'IST7.tsx'
]

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

pattern_top = re.compile(
    r"(<div style={{ padding: '30px', fontFamily: '\"Inter\", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333' }}>\s*)"
    r"(<div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba\(0,0,0,0\.05\)' }}>)"
)
replace_top = (
    r"\1"
    r"<div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>\n"
    r"        {/* Main Test Card */}\n"
    r"        <div style={{ flex: '1 1 600px', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>"
)

def patch_file(filename):
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content, count = pattern_top.subn(replace_top, content)
    if count == 0:
        print(f"Failed top patch in {filename}")
        return

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully patched top of {filename}")

for f in files_to_patch:
    patch_file(f)
