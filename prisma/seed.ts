import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Create Job Position & Gray Area
  const jobPosition = await prisma.jobPosition.create({
    data: {
      name: 'Manager Operasional',
      description: 'Posisi managerial untuk operasional',
      grayAreas: {
        create: [
          { parameter: 'Kognitif (IQ)', targetScore: 3.0 },
          { parameter: 'Kepemimpinan', targetScore: 3.0 }
        ]
      }
    }
  })

  // 2. Create User (Testee)
  const user = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      username: 'budi',
      password: 'password123', // Dalam produksi wajib di-hash (misal bcrypt)
      role: 'user'
    }
  })

  // 3. Create a Test session
  const test = await prisma.test.create({
    data: {
      title: 'Seleksi Manager Operasional 2026',
      jobPositionId: jobPosition.id,
      specification: 'Minimal S1, Pengalaman 3 tahun',
      aspect: 'Kognitif & Kepribadian'
    }
  })

  // 4. Enroll the user to the test
  const participant = await prisma.testParticipant.create({
    data: {
      userId: user.id,
      testId: test.id,
      status: 'pending'
    }
  })

  // 5. Create Dummy Questions
  const questionsData = [
    // WPT (Wonderlic Personnel Test)
    { testId: test.id, testType: 'WPT', content: 'Jika apel berharga 500 dan jeruk berharga 300, berapa total 2 apel dan 3 jeruk?', options: JSON.stringify(['1600', '1900', '2100', '1500']), correct: '1900' },
    
    // TIKI (Tes Inteligensi Kolektif Indonesia)
    { testId: test.id, testType: 'TIKI', content: 'Lengkapi deret berikut: 2, 4, 8, 16, ...', options: JSON.stringify(['24', '32', '64', '20']), correct: '32' },
    
    // IST (Intelligenz Struktur Test)
    { testId: test.id, testType: 'IST', content: 'Cari kata yang tidak sekelompok: (A) Meja (B) Kursi (C) Burung (D) Lemari', options: JSON.stringify(['Meja', 'Kursi', 'Burung', 'Lemari']), correct: 'Burung' },
    
    // DISC
    { testId: test.id, testType: 'DISC', content: 'Pilih satu karakteristik yang PALING (Most) dan PALING TIDAK (Least) menggambarkan Anda di tempat kerja:', options: JSON.stringify(['Berani mengambil risiko (D)', 'Suka bergaul (I)', 'Sabar dan tenang (S)', 'Sangat teliti (C)']), correct: null },
    
    // PAPI KOSTICK
    { testId: test.id, testType: 'PAPI_KOSTICK', content: 'Pilih pernyataan yang paling sesuai dengan Anda:', options: JSON.stringify(['A. Saya adalah pemimpin yang baik', 'B. Saya suka bekerja dalam tim yang harmonis']), correct: null },
    
    // MSDT (Management Style Diagnostic Test)
    { testId: test.id, testType: 'MSDT', content: 'Dalam menghadapi konflik tim, saya biasanya:', options: JSON.stringify(['Mengambil alih keputusan', 'Mendengarkan semua pihak lalu memutuskan', 'Menghindari konflik', 'Menyerahkan pada prosedur standar']), correct: null }
  ]

  for (const q of questionsData) {
    await prisma.question.create({ data: q })
  }

  console.log('Seeding selesai! Dummy data (User, Test, Soal) berhasil dibuat.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
