import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.question.deleteMany({
    where: { testType: { in: ['CFIT 3', 'CFIT 4'] } }
  });

  // CFIT 3: 13 questions, Options A-F
  for (let i = 1; i <= 13; i++) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: 'CFIT 3',
        content: `/soal/cfit3/${i}.jpeg`, 
        options: JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F']),
      }
    });
  }

  // CFIT 4: 10 questions, Options A-E
  for (let i = 1; i <= 10; i++) {
    await prisma.question.create({
      data: {
        testId: 1,
        testType: 'CFIT 4',
        content: `/soal/cfit4/${i}.jpeg`, 
        options: JSON.stringify(['A', 'B', 'C', 'D', 'E']),
      }
    });
  }

  console.log('Seeded CFIT 3 and 4 questions!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
