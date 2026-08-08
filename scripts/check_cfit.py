import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf1 = os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 1 - Google Formulir.pdf")
pdf2 = os.path.join(base_dir, "soal", "Intelegensi", "CFIT", "CFIT 3.A TEST 2 - Google Formulir.pdf")

def inspect_pdf(pdf_path, name):
    doc = fitz.open(pdf_path)
    text = ""
    img_info = []
    for i, page in enumerate(doc):
        text += f"--- Page {i} ---\n"
        text += page.get_text()
        
        for j, img in enumerate(page.get_images(full=True)):
            b = doc.extract_image(img[0])['image']
            img_info.append(f"Page {i} Img {j}: {len(b)} bytes")
            
    print(f"=== {name} ===")
    print(text[:1000]) # Print first 1000 chars of text
    print("... (truncated)")
    print("Images found:")
    for info in img_info[:20]: # print first 20 image infos
        print(info)
    print("Total images:", len(img_info))
    print("\n")

inspect_pdf(pdf1, "CFIT TEST 1")
inspect_pdf(pdf2, "CFIT TEST 2")
