import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

def patch_file(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    slug = filename.replace('.tsx', '').lower().replace(' ', '')
    
    # We want to replace router.push('/'); with localStorage.setItem(...) and router.push('/testee/session');
    # There are variations like router.push('/') or router.push( '/' )
    
    pattern = re.compile(r"router\.push\(\s*['\"]/['\"]\s*\);")
    replacement = f"localStorage.setItem('test_completed_{slug}', 'true'); router.push('/testee/session');"
    
    new_content, count = pattern.subn(replacement, content)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filename}")
    else:
        print(f"No match in {filename}")

for filename in os.listdir(base_dir):
    if filename.endswith(".tsx"):
        patch_file(os.path.join(base_dir, filename), filename)
