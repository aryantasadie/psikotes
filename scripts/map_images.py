import fitz
import os

pdf_path = r"d:\Kuliah\Kerja\psikotes\soal\Intelegensi\WPT\WPT - Google Formulir.pdf"
doc = fitz.open(pdf_path)

for page_num in range(len(doc)):
    page = doc[page_num]
    
    # Get all text blocks
    text_blocks = page.get_text("blocks")
    
    # Get images
    image_list = page.get_images(full=True)
    
    if image_list:
        print(f"\n--- Page {page_num + 1} ---")
        for img_info in image_list:
            xref = img_info[0]
            bbox = page.get_image_bbox(img_info)
            # Find the text block immediately above this image
            closest_text = ""
            min_dist = float('inf')
            
            for b in text_blocks:
                # b[0]-b[3] are coords. b[3] is y1 (bottom of text box)
                # bbox.y0 is top of image box
                dist = bbox.y0 - b[3]
                if 0 < dist < min_dist:
                    min_dist = dist
                    closest_text = b[4].strip()
                    
            print(f"Image xref {xref} is near text:\n{closest_text}\n")
