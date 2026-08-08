import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'scripts', 'ist23_data.json');
  const fileData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(fileData);

  // Clean existing IST 2 and IST 3
  await prisma.question.deleteMany({
    where: { testType: { in: ['IST 2', 'IST 3'] } }
  });

  // Test ID for IST is 1
  for (const q of questions) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: q.testType,
        content: q.content,
        options: JSON.stringify(q.options),
      }
    });
  }

  console.log('Berhasil memasukkan 40 soal IST 2 dan IST 3 ke database!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
