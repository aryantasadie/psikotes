import fitz
import os
import glob

base_dir = r"d:\Kuliah\Kerja\psikotes"
app_dir = os.path.join(base_dir, "psikotes-app")
public_dir = os.path.join(app_dir, "public", "soal")

pdfs = {
    "cfit1": os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 1 - Google Formulir.pdf"),
    "cfit2": os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 2 - Google Formulir.pdf"),
    "cfit3": os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 3 - Google Formulir.pdf"),
    "cfit4": os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 4 - Google Formulir.pdf"),
    "ist7": os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST SOAL 7 - Google Formulir.pdf"),
    "tiki2": os.path.join(base_dir, "soal", "Intelegensi", "TIKI", "TIKI TINGGI TEST 2 - Google Formulir.pdf"),
}

for test_name, pdf_path in pdfs.items():
    if not os.path.exists(pdf_path):
        print(f"Skipping {test_name}, not found.")
        continue
        
    doc = fitz.open(pdf_path)
    out_dir = os.path.join(public_dir, test_name, "contoh")
    os.makedirs(out_dir, exist_ok=True)
    
    # Just extract ALL images in the first 2 pages. Examples are always at the beginning.
    count = 1
    for i in range(min(3, len(doc))):
        page = doc[i]
        image_list = page.get_images(full=True)
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image['image']
            image_ext = base_image['ext']
            
            if len(image_bytes) < 10000: # skip small logos
                continue
                
            out_path = os.path.join(out_dir, f"contoh_{count}.{image_ext}")
            with open(out_path, "wb") as f:
                f.write(image_bytes)
            print(f"Extracted {test_name}/contoh_{count}.{image_ext}")
            count += 1
