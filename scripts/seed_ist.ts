import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'scripts', 'ist_data.json');
  const fileData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(fileData);

  // Bersihkan soal IST lama jika ada agar tidak double
  await prisma.question.deleteMany({
    where: {
      testType: 'IST'
    }
  });

  let insertedCount = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        testId: 1, // Memakai testId 1 yang sudah kita buat sebelumnya
        testType: q.testType,
        content: q.content,
        options: q.options,
        correct: q.correct
      }
    });
    insertedCount++;
  }
  
  console.log(`Sukses memasukkan ${insertedCount} soal IST ke database!`);
}

main()
  .catch((e) => {
    console.error("Error seeding IST:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
