import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  await prisma.question.deleteMany({
    where: { testType: { in: ['TIKI 1', 'TIKI 2', 'TIKI 3', 'TIKI 4', 'TIKI 6'] } }
  });

  // TIKI 1: From JSON (40 questions, Options A-D)
  const tiki1Path = path.join(__dirname, 'tiki1_parsed.json');
  if (fs.existsSync(tiki1Path)) {
    const tiki1Data = JSON.parse(fs.readFileSync(tiki1Path, 'utf8'));
    for (const q of tiki1Data) {
      const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      const validOptions = parsedOptions.filter((opt: string) => opt.trim() !== "");
      await prisma.question.create({
        data: {
          testId: 1,
          testType: 'TIKI 1',
          content: q.content,
          options: JSON.stringify(validOptions.map((opt: string) => opt.replace(/^[A-D]\)\s*/, ''))), // clean up A) 
        }
      });
    }
    console.log('Seeded TIKI 1:', tiki1Data.length);
  }

  // TIKI 2: 26 questions, Images, Options A-F
  for (let i = 1; i <= 26; i++) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: 'TIKI 2',
        content: `/soal/tiki2/${i}.jpeg`, 
        options: JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F']),
      }
    });
  }
  console.log('Seeded TIKI 2: 26');

  // TIKI 3: From JSON (40 questions, Options A-D)
  const tiki3Path = path.join(__dirname, 'tiki3_parsed.json');
  if (fs.existsSync(tiki3Path)) {
    const tiki3Data = JSON.parse(fs.readFileSync(tiki3Path, 'utf8'));
    for (const q of tiki3Data) {
      await prisma.question.create({
        data: {
          testId: 1,
          testType: 'TIKI 3',
          content: q.content,
          options: JSON.stringify(q.options.map(opt => opt.replace(/^[A-D]\)\s*/, ''))), // clean up A) 
        }
      });
    }
    console.log('Seeded TIKI 3:', tiki3Data.length);
  }

  // TIKI 4: 30 questions, Images, Options A-F, select 2
  for (let i = 1; i <= 30; i++) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: 'TIKI 4',
        content: `/soal/tiki4/${i}.jpeg`, 
        options: JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F']),
      }
    });
  }
  console.log('Seeded TIKI 4: 30');

  // TIKI 6: From JSON (100 questions, Options S/TS)
  const tiki6Path = path.join(__dirname, 'tiki6_parsed.json');
  if (fs.existsSync(tiki6Path)) {
    const tiki6Data = JSON.parse(fs.readFileSync(tiki6Path, 'utf8'));
    for (const q of tiki6Data) {
      await prisma.question.create({
        data: {
          testId: 1,
          testType: 'TIKI 6',
          content: q.content,
          options: JSON.stringify(q.options),
        }
      });
    }
    console.log('Seeded TIKI 6:', tiki6Data.length);
  }

  console.log('Seeded TIKI questions successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
