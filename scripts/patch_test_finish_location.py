import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

def patch_file(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    slug = filename.replace('.tsx', '').lower().replace(' ', '')
    
    # We want to replace window.location.href = '...'; with localStorage.setItem(...) and window.location.href = '/testee/session';
    
    pattern = re.compile(r"window\.location\.href\s*=\s*['\"].*?['\"];")
    replacement = f"localStorage.setItem('test_completed_{slug}', 'true'); window.location.href = '/testee/session';"
    
    new_content, count = pattern.subn(replacement, content)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filename}")
    else:
        print(f"No match in {filename}")

for filename in ['DISC.tsx', 'MSDT.tsx', 'PAPI_KOSTICK.tsx', 'POWER.tsx']:
    patch_file(os.path.join(base_dir, filename), filename)
