import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.question.deleteMany({
    where: { testType: { in: ['CFIT 1', 'CFIT 2'] } }
  });

  // CFIT 1: 13 questions, Options A-F
  for (let i = 1; i <= 13; i++) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: 'CFIT 1',
        content: `/soal/cfit1/${i}.jpeg`, // Assumes jpeg based on fitz extraction
        options: JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F']),
      }
    });
  }

  // CFIT 2: 14 questions, Options A-E
  for (let i = 1; i <= 14; i++) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: 'CFIT 2',
        content: `/soal/cfit2/${i}.jpeg`, 
        options: JSON.stringify(['A', 'B', 'C', 'D', 'E']),
      }
    });
  }

  console.log('Seeded CFIT 1 and 2 questions!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
