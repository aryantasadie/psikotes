import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'scripts', 'power_parsed.json');
  const fileData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(fileData);

  await prisma.question.deleteMany({
    where: {
      testType: 'POWER'
    }
  });

  let insertedCount = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        testId: 1, 
        testType: 'POWER',
        content: q.content,
        options: JSON.stringify(q.options),
        correct: q.correct
      }
    });
    insertedCount++;
  }
  
  console.log(`Sukses memasukkan ${insertedCount} soal POWER LEADER ke database!`);
}

main()
  .catch((e) => {
    console.error("Error seeding POWER:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
