import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

for f in os.listdir(base_dir):
    if f.endswith('.tsx'):
        filepath = os.path.join(base_dir, f)
        content = open(filepath, 'r', encoding='utf-8').read()
        
        # We want to remove the old injected block which looks like:
        # <div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
        # ...
        # </div>
        # And it appears before the V2 block:
        # <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
        
        # Regex to capture the old block
        # It starts exactly with that string and ends with </div> before the V2 block or </button>.
        pattern = r"(\s*<div style=\{\{\s*marginTop:\s*'20px',\s*padding:\s*'15px',\s*background:\s*'#fff',\s*borderRadius:\s*'8px',\s*border:\s*'1px solid #ddd'\s*\}\}>.*?</p>\s*</div>\s*)(<div style=\{\{\s*background:\s*'#fff',\s*padding:\s*'20px')"
        
        new_content, count = re.subn(pattern, r"\2", content, flags=re.DOTALL)
        if count > 0:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Cleaned {f}")
        else:
            print(f"No match in {f}")
