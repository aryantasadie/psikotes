import fitz
import os
import json
import re

base_dir = r"d:\Kuliah\Kerja\psikotes"
pdf_ist6 = os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST SOAL 6 - Google Formulir.pdf")
pdf_ist7 = os.path.join(base_dir, "soal", "Intelegensi", "IST", "IST SOAL 7 - Google Formulir.pdf")
out_img_dir = os.path.join(base_dir, "psikotes-app", "public", "soal", "ist7")
os.makedirs(out_img_dir, exist_ok=True)

ist6_data = []
ist7_data = []

ist6_keys = [27, 25, 27, 15, 46, 10, 42, 7, 6, 14, 8, 14, 45, 63, 12, 80, 14, 12, 63, 10]
ist7_keys = ['A', 'C', 'B', 'A', 'D', 'B', 'C', 'E', 'E', 'D', 'E', 'B', 'D', 'C', 'B', 'A', 'B', 'D', 'C', 'C']

# 1. Parse IST 6
try:
    doc6 = fitz.open(pdf_ist6)
    text6 = ""
    for page in doc6:
        text6 += page.get_text()

    # Ekstrak pola "97\n 6, 9, 12,..."
    matches = re.findall(r'(\d{2,3})\n([\d,\s]+,\.+[\?]?)', text6)
    
    if len(matches) >= 20:
        for i, match in enumerate(matches[:20]):
            q_text = match[1].strip().replace('\n', '')
            ist6_data.append({
                "testId": 1, # Dummy test ID dari seeder sebelumnya
                "testType": "IST",
                "content": q_text,
                "options": json.dumps([]),
                "correct": str(ist6_keys[i])
            })
    else:
        # Fallback jika Regex gagal
        for i in range(20):
            ist6_data.append({
                "testId": 1,
                "testType": "IST",
                "content": f"Soal IST 6 (Deret Angka) ke-{i+1}",
                "options": json.dumps([]), 
                "correct": str(ist6_keys[i])
            })
except Exception as e:
    print(f"Error parsing IST 6: {e}")

# 2. Parse IST 7 Images
try:
    doc7 = fitz.open(pdf_ist7)
    extracted_images = []
    
    for i, page in enumerate(doc7):
        image_list = page.get_images(full=True)
        for img in image_list:
            xref = img[0]
            base_image = doc7.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # Abaikan gambar kecil (ikon profil, logo google)
            if len(image_bytes) > 20000:
                extracted_images.append({
                    "bytes": image_bytes,
                    "ext": image_ext
                })
    
    # Biasanya ada gambar contoh di awal, kita buang jika jumlahnya berlebih (misal 21)
    if len(extracted_images) > 20:
        # Hapus gambar pertama (contoh soal)
        extracted_images = extracted_images[-20:]
        
    for idx, img_dict in enumerate(extracted_images):
        if idx < 20:
            filename = f"q_{idx+1}.{img_dict['ext']}"
            filepath = os.path.join(out_img_dir, filename)
            with open(filepath, "wb") as f:
                f.write(img_dict['bytes'])
                
            ist7_data.append({
                "testId": 1,
                "testType": "IST",
                "content": f"/soal/ist7/{filename}",
                "options": json.dumps(["A", "B", "C", "D", "E"]),
                "correct": ist7_keys[idx]
            })

    if len(ist7_data) == 0:
        for i in range(20):
            ist7_data.append({
                "testId": 1,
                "testType": "IST",
                "content": "Image not found",
                "options": json.dumps(["A", "B", "C", "D", "E"]),
                "correct": ist7_keys[i]
            })
            
except Exception as e:
    print(f"Error parsing IST 7: {e}")

# Save JSON
out_json = os.path.join(base_dir, "psikotes-app", "scripts", "ist_data.json")
with open(out_json, "w") as f:
    json.dump(ist6_data + ist7_data, f, indent=2)

print(f"Sukses! {len(ist6_data)} IST 6 dan {len(ist7_data)} IST 7 disimpan di JSON.")
