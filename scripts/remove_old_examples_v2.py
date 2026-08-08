import os

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

for f in os.listdir(base_dir):
    if f.endswith('.tsx'):
        filepath = os.path.join(base_dir, f)
        content = open(filepath, 'r', encoding='utf-8').read()
        
        # The block we want to delete starts with:
        marker_start = "<div style={{ marginTop: '20px', padding: '15px', background: '#fff'"
        marker_end = "</div>\n\n            <div style={{ background: '#fff', padding: '20px'"
        
        if marker_start in content:
            # We can split by the start, find the next </div>, and so on...
            # But the easiest is to just use string indexing.
            start_idx = content.find(marker_start)
            # Find the start of the V2 block
            v2_marker = "<div style={{ background: '#fff', padding: '20px'"
            v2_idx = content.find(v2_marker, start_idx)
            
            if start_idx != -1 and v2_idx != -1:
                # We also need to back up to the start of the line for start_idx to avoid leaving spaces
                line_start = content.rfind("\n", 0, start_idx)
                if line_start != -1:
                    new_content = content[:line_start] + "\n" + content[v2_idx - 12:] # -12 is to keep indent spaces before v2_marker, but wait, just content[:line_start] + content[v2_idx:] is safer?
                    
                    # Actually, v2_idx points to the `<div` of V2. 
                    # If we just do content[:start_idx] + content[v2_idx:] it will leave the indentation of start_idx.
                    new_content = content[:start_idx] + content[v2_idx:]
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    print(f"Cleaned {f} perfectly!")
