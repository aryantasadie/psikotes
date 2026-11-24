# Spesifikasi Teknis: Skema Ticketing & Manajemen Kuota Sesi (B2B Psikotes HRP)

Dokumen ini adalah acuan resmi arsitektur dan kebutuhan fungsional sistem kuota sesi / *ticketing* untuk implementasi tahap produksi.

---

## 1. Prinsip Dasar & Model Kuota

### 1.1. Dua Dompet Kuota Terpisah (*Dual-Wallet*)
Klien memiliki 2 saldo kuota independen sesuai kebutuhan bisnis:
1. **Kuota Paket Asesmen (Full Assessment):**
   * **Penggunaan:** Mode *Asesmen Jabatan*.
   * **Cakupan:** Rangkaian baterai tes lengkap (Kognitif, Kepribadian, Sikap Kerja) + Lembar Psikogram Terstandar / Review Psikolog.
   * **Karakter:** Nilai premium.
2. **Kuota Single Test (Tes Mandiri):**
   * **Penggunaan:** Mode *Tes Bebas / Mandiri*.
   * **Cakupan:** Hanya memilih 1 alat tes spesifik (misal: hanya Kraepelin, atau hanya DISC).
   * **Output:** Skor baku / profil instan alat tes tersebut (tanpa lembar psikogram analisis jabatan).
   * **Karakter:** Nilai ekonomis, cocok untuk screening massal cepat.

### 1.2. Aturan Pemotongan Kuota (*Deduct on Start*)
* **Tidak Ada Pemotongan di Depan:** Pembuatan sesi ujian dan pengiriman link/akun kandidat **TIDAK** memotong kuota.
* **Titik Pemotongan:** Kuota baru resmi terpotong (-1) secara permanen ketika kandidat menekan tombol **"Mulai Tes"** pertama kali (status pengerjaan berubah dari `pending` ke `in_progress`).
* **Proteksi Disconnect / Force Majeure:** Jika koneksi internet putus, browser tertutup, atau mati listrik saat ujian, kandidat login kembali melanjutkan sesi yang sama **tanpa memotong kuota baru**.

---

## 2. Kebijakan Masa Aktif & Rollover (Perpanjangan Akumulatif)

### 2.1. Formula Rollover Kuota
Sistem menganut skema akumulasi yang adil bagi klien korporat:
* **Kasus A (Top-Up Sebelum Kedaluwarsa - Rollover Aktif):**
  * Sisa kuota lama **tidak hangus**.
  * Sisa kuota lama dijumlahkan dengan kuota baru.
  * Tanggal kedaluwarsa seluruh saldo diperpanjang mengikuti masa aktif paket pembelian terbaru.
  * Label log: `TOPUP_ROLLOVER`.
* **Kasus B (Top-Up Setelah Kedaluwarsa - Hangus Kaku):**
  * Jika klien baru melakukan pembelian setelah melewati tanggal jatuh tempo, sisa kuota lama direset menjadi 0.
  * Saldo baru murni berisi kuota yang baru dibeli.
  * Label log: `EXPIRED_RESET` diikuti `TOPUP_FRESH`.

---

## 3. Konversi Antar Kuota (Paket $\leftrightarrow$ Single)

* **Rasio Resmi:** **1 Kuota Paket Asesmen = 3 Kuota Single Test** (dapat disesuaikan di konfigurasi global).
* **Dua Jalur Konversi:**
  1. **Jalur Mandiri (Dashboard Klien):**
     * Klien memiliki tombol *"Tukar Kuota"* di samping kartu saldo.
     * Klien dapat mengonversi kuota yang dimiliki sewaktu-waktu sesuai kebutuhan.
  2. **Jalur Otomatis (Saat Penjadwalan Sesi):**
     * Jika saat menjadwalkan tes single saldo `Kuota Single Test` tidak mencukupi, tetapi `Kuota Paket` tersedia, sistem menampilkan dialog interaktif:
       > *"Kuota Single Test tidak mencukupi. Tukar X Kuota Paket menjadi Y Kuota Single Test dan lanjutkan penjadwalan?"*

---

## 4. Keamanan & Pencatatan Transaksi (Buku Kas Non-Keuangan)

> [!IMPORTANT]
> **Kebijakan Non-Keuangan:**
> Sistem **TIDAK** mencatat informasi rekening bank, nominal rupiah, dan **TIDAK** menyediakan fitur upload bukti transfer/struk pembayaran guna menjaga kepatuhan data dan mencegah celah keamanan.

### 4.1. Model Buku Kas (*Ledger / Audit Trail*)
Semua mutasi dicatat secara terperinci dalam tabel mutasi (`QuotaLedger`):
* `clientId`: ID Klien B2B
* `quotaType`: `PACKAGE` | `SINGLE`
* `transactionType`: `TOPUP` | `USAGE` | `CONVERT` | `EXPIRED` | `ADJUSTMENT`
* `amount`: Jumlah mutasi positif atau negatif (+100, -1, -5)
* `balanceAfter`: Sisa saldo setelah mutasi
* `referenceDoc`: Nomor PO / Kontrak administratif (misal: `PO-HRP-2026-089`)
* `testSessionId`: ID sesi ujian terkait (jika mutasi adalah pemakaian)
* `notes`: Deskripsi operasional
* `createdAt`: Timestamp mutasi

---

## 5. Tampilan & Alur Pengguna

### 5.1. Sisi Superadmin (Ringkas & Manajerial)
1. **Daftar Klien:**
   * Kolom Saldo Paket & Saldo Single.
   * Tanggal Kedaluwarsa + Badge Status (🟢 Aktif / 🟡 Menipis < 14 Hari / 🔴 Kedaluwarsa).
2. **Form Top-Up Kuota Klien:**
   * Pilihan Tipe Kuota (Paket / Single).
   * Input Jumlah Kuota (+N).
   * Input Tanggal Kedaluwarsa Baru.
   * No. Dokumen / Referensi Kontrak / PO (Wajib).
   * Catatan Singkat (Opsional).
3. **Log Riwayat Superadmin:**
   * Hanya menampilkan rekap tingkat tinggi: Tanggal, Klien, Tipe Mutasi, Jumlah, Ref Dokumen, dan Nama Sesi.

### 5.2. Sisi Client (Berbasis Sesi + Drill-down)
1. **Header Dashboard:**
   * Kartu Kuota Paket (Sisa Saldo & Masa Aktif).
   * Kartu Kuota Single (Sisa Saldo & Masa Aktif).
   * Tombol *Tukar Kuota*.
2. **Buku Mutasi Kuota (Parent-Child / Sesi-Kandidat):**
   * **Baris Utama (Parent):** Menampilkan per transaksi/sesi:
     * Waktu transaksi.
     * Jenis Aktivitas (*Top-Up*, *Sesi Ujian*, *Konversi*).
     * Judul Sesi / Keterangan.
     * Tipe Kuota & Jumlah Terpotong (misal: `-12 Kuota`).
     * Saldo Akhir.
     * Tombol Aksi: `[Lihat Peserta 👁️]`.
   * **Modal / Drawer Detail (Child):**
     * Terbuka saat `[Lihat Peserta]` diklik.
     * Menampilkan daftar kandidat dari sesi tersebut yang kuotanya sudah terkonsumsi (Nama, Username, Waktu Mulai, Status Ujian).

---

## 6. Rancangan Struktur Data (Prisma Blueprint)

```prisma
// Penyesuaian pada model User (Klien)
model User {
  // ... field eksisting ...
  quotaPackage       Int       @default(0)
  quotaSingle        Int       @default(0)
  quotaExpiredAt     DateTime?
  
  quotaLedgers       QuotaLedger[]
}

// Model Baru: Buku Besar Mutasi Kuota
model QuotaLedger {
  id              Int      @id @default(autoincrement())
  clientId        Int
  quotaType       String   // "PACKAGE" | "SINGLE"
  transactionType String   // "TOPUP", "USAGE", "CONVERT", "EXPIRED", "ADJUSTMENT"
  amount          Int      // +100, -1, -5
  balanceAfter    Int
  referenceDoc    String?  // No PO / No Kontrak
  testId          Int?     // Relasi ke sesi Test terkait
  notes           String?
  createdAt       DateTime @default(now())

  client          User     @relation(fields: [clientId], references: [id])
  test            Test?    @relation(fields: [testId], references: [id])

  @@index([clientId])
  @@index([createdAt])
}
```
