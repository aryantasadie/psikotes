import os
import re

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

examples = {
    # ------------------ TEXTUAL TESTS ------------------
    "IST2.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Ditentukan 5 kata. Pada 4 dari 5 kata itu terdapat suatu kesamaan. Carilah 1 kata yang tidak memiliki kesamaan dengan keempat kata lainnya.</p>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>a) Meja &nbsp; b) Kursi &nbsp; c) Burung &nbsp; d) Lemari &nbsp; e) Tempat Tidur</p>
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#e67e22', fontWeight: 'bold' }}>Jawaban: c (Burung)</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>Penjelasan: Meja, kursi, lemari, dan tempat tidur adalah perabot rumah, sedangkan "burung" bukanlah perabot rumah (tidak memiliki kesamaan dengan keempat kata lainnya).</p>
            </div>
    """,
    "IST3.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Ditentukan 3 kata. Antara kata pertama dan kata kedua terdapat suatu hubungan tertentu. Antara kata ketiga dan salah satu kata di antara pilihan terdapat hubungan yang sama pula. Carilah kata tersebut.</p>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Hutan : Pohon = Tembok : ?</p>
                <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}>a) Batu bata &nbsp; b) Rumah &nbsp; c) Semen &nbsp; d) Putih &nbsp; e) Dinding</p>
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#e74c3c', fontWeight: 'bold' }}>Jawaban: a (Batu bata)</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>Penjelasan: Hubungan antara hutan dan pohon adalah bahwa hutan terdiri atas pohon-pohon. Tembok terdiri atas batu bata.</p>
            </div>
    """,
    "IST6.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Pada angka-angka berikut terdapat suatu pola urutan. Angka berapakah yang akan muncul selanjutnya?</p>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>2 &nbsp; 4 &nbsp; 6 &nbsp; 8 &nbsp; 10 &nbsp; ?</p>
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#0984e3', fontWeight: 'bold' }}>Jawaban: 12</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>Penjelasan: Pada deret tersebut, setiap angka selalu ditambahkan 2 untuk mendapatkan angka berikutnya. Oleh karena itu, 10 + 2 = 12.</p>
            </div>
    """,
    "TIKI1.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>18 + 7 = .....</p>
                <p style={{ margin: '0 0 5px 0' }}>A) 25 &nbsp; B) 26 &nbsp; C) 24 &nbsp; D) 23</p>
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#e74c3c', fontWeight: 'bold' }}>Jawaban: A (25)</p>
            </div>
    """,
    "TIKI3.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Pilihlah DUA KATA diantara empat kata yang ada, yang artinya <strong>SAMA (S)</strong> atau <strong>BERLAWANAN (B)</strong>.</p>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 5px 0' }}>A) SEDIKIT &nbsp; B) TEPAT &nbsp; C) JERNIH &nbsp; D) BANYAK</p>
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#f39c12', fontWeight: 'bold' }}>Jawaban: A dan D</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>Penjelasan: Karena kata SEDIKIT dan BANYAK adalah dua kata yang mempunyai arti BERLAWANAN.</p>
            </div>
    """,
    "TIKI6.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>CONTOH 1</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '18px', letterSpacing: '1px' }}>216770 &nbsp; - &nbsp; 216770</p>
                  <p style={{ margin: '0', color: '#16a085', fontWeight: 'bold' }}>Jawaban: S</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>Rangkaian angka tersebut SAMA.</p>
                </div>
                
                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>CONTOH 2</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '18px', letterSpacing: '1px' }}>848217 &nbsp; - &nbsp; 845217</p>
                  <p style={{ margin: '0', color: '#c0392b', fontWeight: 'bold' }}>Jawaban: TS</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>Kedua rangkaian angka TIDAK SAMA.</p>
                </div>

                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>CONTOH 3</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '18px', letterSpacing: '1px' }}>ZRWRF &nbsp; - &nbsp; ZRWFR</p>
                  <p style={{ margin: '0', color: '#c0392b', fontWeight: 'bold' }}>Jawaban: TS</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>Kedua rangkaian huruf TIDAK SAMA.</p>
                </div>

                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>CONTOH 4</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '18px', letterSpacing: '1px' }}>BPADL &nbsp; - &nbsp; BPADL</p>
                  <p style={{ margin: '0', color: '#16a085', fontWeight: 'bold' }}>Jawaban: S</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>Kedua rangkaian huruf SAMA.</p>
                </div>
              </div>
            </div>
    """,
    # ------------------ VISUAL TESTS ------------------
    "CFIT1.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>4 buah kotak di sebelah kiri, 3 kotak diantaranya memiliki alur/pola yang saling berkaitan. Pilihlah salah satu jawaban yang benar dari A, B, C, D, E dan F untuk menjawab kotak yang keempat.</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/cfit1/contoh/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#3498db', fontWeight: 'bold' }}>CONTOH 1 : JAWABAN E</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/cfit1/contoh/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#3498db', fontWeight: 'bold' }}>CONTOH 2 : JAWABAN E</p>
              </div>

              <div>
                <img src="/soal/cfit1/contoh/contoh_3.jpeg" alt="Contoh 3" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#3498db', fontWeight: 'bold' }}>CONTOH 3 : JAWABAN E</p>
              </div>
            </div>
    """,
    "CFIT2.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Pilihlah <strong>2 jawaban</strong> yang memiliki perbedaan diantara jawaban A, B, C, D, dan E.</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/cfit2/contoh/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#8e44ad', fontWeight: 'bold' }}>CONTOH 1 : JAWABAN B DAN D</p>
              </div>

              <div>
                <img src="/soal/cfit2/contoh/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#8e44ad', fontWeight: 'bold' }}>CONTOH 2 : C DAN E</p>
              </div>
            </div>
    """,
    "CFIT3.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Ada 4 buah kotak di sebelah kiri, 3 kotak diantaranya memiliki alur/pola yang saling berkaitan. Pilihlah salah satu jawaban yang benar dari A, B, C, D, E dan F untuk menjawab kotak yang kosong/ kotak ke 4.</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/cfit3/contoh/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#d35400', fontWeight: 'bold' }}>CONTOH 1 : JAWABAN B</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/cfit3/contoh/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#d35400', fontWeight: 'bold' }}>CONTOH 2 : JAWABAN C</p>
              </div>

              <div>
                <img src="/soal/cfit3/contoh/contoh_3.jpeg" alt="Contoh 3" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#d35400', fontWeight: 'bold' }}>CONTOH 3 : JAWABAN F</p>
              </div>
            </div>
    """,
    "CFIT4.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Terdapat gambar di sebelah kiri sebagai contoh pola, dimana tugas peserta adalah mencari pola yang sama dengan contoh yang di sebelah kiri dari alternatif - alternatif jawaban yang disediakan.</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/cfit4/contoh/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#16a085', fontWeight: 'bold' }}>CONTOH 1 : JAWABAN C</p>
              </div>

              <div>
                <img src="/soal/cfit4/contoh/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#16a085', fontWeight: 'bold' }}>CONTOH 2 : JAWABAN D</p>
              </div>
            </div>
    """,
    "IST7.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Carilah diantara bentuk-bentuk yang ditentukan (A,B,C,D,E), bentuk yang dapat dibangun dengan cara menyusun potongan-potongan itu sedemikian rupa, sehingga tidak ada kelebihan sudut atau ruang di antaranya.</p>
              
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img src="/soal/ist7/contoh/contoh_1.jpeg" alt="Contoh 07" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ textAlign: 'left', marginTop: '10px', background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#9b59b6', fontWeight: 'bold' }}>CONTOH 07 : Jawaban A</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Jika potongan-potongan pada CONTOH 07 disusun (digabungkan), maka akan menghasilkan bentuk A.</p>
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <img src="/soal/ist7/contoh/contoh_2.jpeg" alt="Contoh 08-10" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ textAlign: 'left', marginTop: '10px', background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#9b59b6', fontWeight: 'bold' }}>CONTOH 08 : Jawaban E</p>
                  <p style={{ margin: '0 0 5px 0', color: '#9b59b6', fontWeight: 'bold' }}>CONTOH 09 : Jawaban B</p>
                  <p style={{ margin: '0 0 5px 0', color: '#9b59b6', fontWeight: 'bold' }}>CONTOH 10 : Jawaban D</p>
                </div>
              </div>
            </div>
    """,
    "TIKI2.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Gambar di sebelah kiri merupakan bentuk yang terpotong. Di sebelah kanannya terdapat 6 gambar A,B,C,D,E,F. <strong>Dua diantaranya</strong> terbuat dari bagian-bagian yang terdapat disebelah kiri. Carilah kedua gambar tersebut!</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki2/contoh/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 1 : Pilihlah jawaban dalam gambar yaitu B dan D</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki2/contoh/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 2 : Pilihlah jawaban dalam gambar yaitu C dan F</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki2/contoh/contoh_3.jpeg" alt="Contoh 3" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 3 : Pilihlah jawaban dalam gambar yaitu E dan F</p>
              </div>

              <div>
                <img src="/soal/tiki2/contoh/contoh_4.jpeg" alt="Contoh 4" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 4 : Pilihlah jawaban dalam gambar yaitu A dan D</p>
              </div>
            </div>
    """,
    "TIKI4.tsx": """
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Empat gambar pertama menunjukkan kesamaan. <strong>Dua</strong> diantara enam gambar A, B, C, D, E, dan F berikutnya menunjukkan kesamaan dengan keempat gambar pertama itu. Carilah kedua gambar tersebut!</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki4/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#e74c3c', fontWeight: 'bold' }}>CONTOH 1 : Jawaban A dan F</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Pada CONTOH 1, 4 gambar yang pertama semuanya adalah segiempat atau bujur sangkar. Dari 6 gambar berikutnya, hanya gambar A dan F saja yang berupa segiempat atau bujur sangkar.</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki4/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#e74c3c', fontWeight: 'bold' }}>CONTOH 2 : Jawaban C dan E</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Keempat gambar pertama semuanya dihitamkan dengan cara yang sama, diantara 6 gambar berikutnya, hanya gambar C dan E yang dihitamkan dengan cara yang sama.</p>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki4/contoh_3.jpeg" alt="Contoh 3" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#e74c3c', fontWeight: 'bold' }}>CONTOH 3 : Jawaban C dan E</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Keempat gambar pertama adalah garis-garis bengkok.</p>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki4/contoh_4.jpeg" alt="Contoh 4" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#e74c3c', fontWeight: 'bold' }}>CONTOH 4 : Jawaban D dan E</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Garis-garis dalam keempat gambar pertama hanya menyinggung lingkaran dan bukannya memotong.</p>
                </div>
              </div>
              
              <div>
                <img src="/soal/tiki4/contoh_5.jpeg" alt="Contoh 5" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#e74c3c', fontWeight: 'bold' }}>CONTOH 5 : Jawaban E dan F</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Bentuk-bentuk dalam keempat gambar pertama tidak ada yang bersudut tegak lurus.</p>
                </div>
              </div>
            </div>
    """
}

for filename, example_html in examples.items():
    filepath = os.path.join(base_dir, filename)
    if os.path.exists(filepath):
        content = open(filepath, 'r', encoding='utf-8').read()
        
        # We need to replace the old example block first if it exists.
        # Let's use regex to remove the old <div style={{ marginTop: '20px', padding: '15px' ... </div> block that we injected previously.
        # The block always starts with <div style={{ marginTop: '20px', padding: '15px'
        old_pattern = r"(<div style={{ marginTop: '20px', padding: '15px'[^>]*>.*?</div>)"
        # Note: the previous block might span many lines. 
        # A safer way is to match <div ... >... </div> where it contains 'Contoh Soal' or 'Contoh Pengerjaan'
        # Since HTML replacement in python regex can be tricky with nested divs, 
        # let's just do a clean cut using the string we know.
        
        # Another approach: since we are replacing the exact same marker we inserted earlier,
        # we can just use string replacement on the start and end of that specific old div.
        
        # Actually, let's just strip out everything from `<div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>`
        # up to `          </button>\n        </div>\n      </div>`
        
        # A more robust regex: match from our old injected div until right before the button.
        # Old injection starts with: <div style={{ marginTop: '20px', padding: '15px', background: '#fff'
        match = re.search(r"(\s*<div style=\{\{ marginTop: '20px', padding: '15px', background: '#fff'.*?</div>)\s*</button>", content, flags=re.DOTALL)
        
        if match:
            # We found the old injection! Let's replace it with the new one.
            new_content = content.replace(match.group(1), "\n" + example_html + "\n          ")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename} (Replaced old example)")
        else:
            # Maybe it wasn't injected correctly, or it's TIKI 4 which was skipped earlier.
            # Let's do the same injection logic as before.
            pattern = r"(</p>|</div>)\s*(</div>\s*<button[^>]*>[\s\S]*?Mulai Ujian)"
            new_content = re.sub(pattern, r"\1\n" + example_html + r"\n          \2", content, count=1)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename} (Fresh injection)")
    else:
        print(f"File not found: {filename}")
