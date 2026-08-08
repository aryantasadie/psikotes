import fitz

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Intelegensi\WPT\WPT - Google Formulir.pdf"
doc = fitz.open(pdf_path)

with open(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts\wpt_raw.txt", "w", encoding="utf-8") as f:
    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("blocks")
        # Sort blocks by y0 (vertical position) and then x0 (horizontal position)
        blocks.sort(key=lambda b: (b[1], b[0]))
        
        for b in blocks:
            text = b[4].strip()
            if text:
                # Replace newlines with spaces for single blocks to make it cleaner
                f.write(text.replace('\n', ' ') + "\n")
        f.write("\n---\n")

print("Extracted WPT with blocks to wpt_raw.txt")
