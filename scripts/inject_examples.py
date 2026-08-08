import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

examples = {
    "IST2.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Soal:</p>
              <p style={{ margin: '0 0 5px 0' }}>A. Meja &nbsp; B. Kursi &nbsp; C. Burung &nbsp; D. Lemari &nbsp; E. Tempat Tidur</p>
              <p style={{ margin: 0, color: '#e67e22', fontWeight: 'bold' }}>Jawaban: C (Burung)</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Alasan: Semuanya adalah perabotan rumah kecuali Burung (hewan).</p>
            </div>""",
            
    "IST3.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Soal:</p>
              <p style={{ margin: '0 0 5px 0' }}>Hutan : Pohon = Tembok : ?</p>
              <p style={{ margin: '0 0 5px 0' }}>A. Batu bata &nbsp; B. Rumah &nbsp; C. Semen &nbsp; D. Putih &nbsp; E. Dinding</p>
              <p style={{ margin: 0, color: '#e74c3c', fontWeight: 'bold' }}>Jawaban: A (Batu bata)</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Alasan: Hutan tersusun dari pohon, seperti tembok tersusun dari batu bata.</p>
            </div>""",
            
    "IST6.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Soal:</p>
              <p style={{ margin: '0 0 5px 0' }}>2 &nbsp; 4 &nbsp; 6 &nbsp; 8 &nbsp; 10 &nbsp; ?</p>
              <p style={{ margin: 0, color: '#0984e3', fontWeight: 'bold' }}>Jawaban: 12</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Alasan: Polanya adalah ditambah 2 setiap langkahnya.</p>
            </div>""",
            
    "IST7.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Jika ada 2 potongan setengah lingkaran, maka jika disatukan akan membentuk lingkaran utuh.</p>
              <p style={{ margin: 0, color: '#9b59b6', fontWeight: 'bold' }}>Jawaban: Opsi yang bergambar Lingkaran Utuh (misalnya A).</p>
            </div>""",
            
    "TIKI1.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Soal:</p>
              <p style={{ margin: '0 0 5px 0' }}>18 + 7 = .....</p>
              <p style={{ margin: '0 0 5px 0' }}>A) 25 &nbsp; B) 26 &nbsp; C) 24 &nbsp; D) 23</p>
              <p style={{ margin: 0, color: '#e74c3c', fontWeight: 'bold' }}>Jawaban: A</p>
            </div>""",
            
    "TIKI2.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Misalkan gambar soal adalah sebuah lingkaran. Dari 6 pilihan potongan (A-F), Anda mungkin perlu memilih 2 buah setengah lingkaran.</p>
              <p style={{ margin: 0, color: '#2980b9', fontWeight: 'bold' }}>Jawaban: 2 opsi yang melengkapi bentuk tersebut (misalnya A dan D).</p>
            </div>""",
            
    "TIKI3.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Soal:</p>
              <p style={{ margin: '0 0 5px 0' }}>A) SEDIKIT &nbsp; B) TEPAT &nbsp; C) JERNIH &nbsp; D) BANYAK</p>
              <p style={{ margin: 0, color: '#f39c12', fontWeight: 'bold' }}>Jawaban: A dan D</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Alasan: Sedikit dan Banyak adalah dua kata yang saling berlawanan arti.</p>
            </div>""",
            
    "TIKI4.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Jika 4 gambar pertama semuanya adalah bangun ruang bersudut tajam, cari 2 gambar dari pilihan A-F yang juga bersudut tajam.</p>
              <p style={{ margin: 0, color: '#e74c3c', fontWeight: 'bold' }}>Jawaban: Pilih 2 opsi yang sesuai prinsip tersebut.</p>
            </div>""",
            
    "TIKI6.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Soal 1:</p>
              <p style={{ margin: '0 0 5px 0' }}>726380 - 726380</p>
              <p style={{ margin: 0, color: '#16a085', fontWeight: 'bold' }}>Jawaban: S (Sama)</p>
              
              <p style={{ margin: '15px 0 10px 0', fontWeight: 'bold' }}>Contoh Soal 2:</p>
              <p style={{ margin: '0 0 5px 0' }}>848217 - 845217</p>
              <p style={{ margin: 0, color: '#c0392b', fontWeight: 'bold' }}>Jawaban: TS (Tidak Sama)</p>
            </div>""",
            
    "CFIT1.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Jika kotak pertama berisi 1 garis, kotak kedua 2 garis, kotak ketiga 3 garis...</p>
              <p style={{ margin: 0, color: '#2980b9', fontWeight: 'bold' }}>Jawaban: Pilih opsi kotak yang berisi 4 garis.</p>
            </div>""",
            
    "CFIT2.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Dari 5 gambar (misal 3 gambar segitiga dan 2 gambar lingkaran), temukan 2 yang berbeda.</p>
              <p style={{ margin: 0, color: '#8e44ad', fontWeight: 'bold' }}>Jawaban: Pilih 2 gambar lingkaran tersebut.</p>
            </div>""",
            
    "CFIT3.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Perhatikan pola baris dan kolom. Kotak di pojok kanan bawah kosong.</p>
              <p style={{ margin: 0, color: '#d35400', fontWeight: 'bold' }}>Jawaban: Pilih opsi yang melengkapi pola matriks tersebut secara logis.</p>
            </div>""",
            
    "CFIT4.tsx": """<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Contoh Pengerjaan (Visual):</p>
              <p style={{ margin: '0 0 5px 0' }}>Gambar soal: Sebuah titik berada di DALAM lingkaran tapi di LUAR persegi.</p>
              <p style={{ margin: 0, color: '#16a085', fontWeight: 'bold' }}>Jawaban: Pilih gambar di opsi A-E yang memungkinkan Anda meletakkan titik dengan syarat yang sama.</p>
            </div>"""
}

for filename, example_html in examples.items():
    filepath = os.path.join(base_dir, filename)
    if os.path.exists(filepath):
        content = open(filepath, 'r', encoding='utf-8').read()
        
        # We want to insert the example_html right before the closing </div> of the instruction box.
        # The instruction box ends right before the <button ...> Mulai Ujian </button>
        # A good anchor is </p>\n            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' ...
        # Or just before `          </div>\n          <button`
        
        # Regular expression to find the end of the instruction div block
        pattern = r"(</p>|</div>)\s*(</div>\s*<button[^>]*>[\s\S]*?Mulai Ujian)"
        
        if "Contoh Soal:" not in content and "Contoh Pengerjaan" not in content:
            # Only replace if not already added
            new_content = re.sub(pattern, r"\1\n" + "            " + example_html.replace('\n', '\n            ') + r"\n          \2", content, count=1)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"Skipped {filename} (already contains examples)")
    else:
        print(f"Not found: {filename}")
