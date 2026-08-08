import fitz
import os

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Intelegensi\WPT\WPT - Google Formulir.pdf"
out_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\public\soal\wpt"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
image_count = 0

for page_index in range(len(doc)):
    page = doc[page_index]
    image_list = page.get_images(full=True)
    
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Save image
        image_count += 1
        image_filename = f"image_{image_count}.{image_ext}"
        image_filepath = os.path.join(out_dir, image_filename)
        with open(image_filepath, "wb") as f:
            f.write(image_bytes)

print(f"Extracted {image_count} images from WPT PDF to {out_dir}")
