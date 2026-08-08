import fitz
import os

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf1 = os.path.join(base_dir, "soal", "Intelegensi", "TIKI", "TIKI TINGGI TEST 1 - Google Formulir.pdf")
pdf2 = os.path.join(base_dir, "soal", "Intelegensi", "TIKI", "TIKI TINGGI TEST 2 - Google Formulir.pdf")
pdf3 = os.path.join(base_dir, "soal", "Intelegensi", "TIKI", "TIKI TINGGI TEST 3 - Google Formulir.pdf")

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
    print("Images found:")
    for info in img_info[:10]:
        print(info)
    print("Total images:", len(img_info))
    print("\n")
    
    with open(f"scripts/{name.replace(' ', '_').lower()}.txt", "w", encoding="utf-8") as f:
        f.write(text)

inspect_pdf(pdf1, "TIKI 1")
inspect_pdf(pdf2, "TIKI 2")
inspect_pdf(pdf3, "TIKI 3")
