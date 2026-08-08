import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'scripts', 'papi_parsed.json');
  const fileData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(fileData);

  // Bersihkan soal PAPI lama jika ada
  await prisma.question.deleteMany({
    where: {
      testType: 'PAPI_KOSTICK'
    }
  });

  let insertedCount = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        testId: 1, // Atau Test ID yang relevan
        testType: 'PAPI_KOSTICK',
        content: q.content,
        options: JSON.stringify(q.options),
        correct: q.correct
      }
    });
    insertedCount++;
  }
  
  console.log(`Sukses memasukkan ${insertedCount} soal PAPI KOSTICK ke database!`);
}

main()
  .catch((e) => {
    console.error("Error seeding PAPI:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
