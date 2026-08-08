const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.question.findMany({
    where: { testType: 'TIKI 4' },
    orderBy: { id: 'asc' }
  });
  console.log('TIKI 4 Count:', qs.length);
  qs.slice(20).forEach((q, i) => {
    console.log(`Q${21 + i} correct:`, q.correct);
  });
}

main().finally(() => prisma.$disconnect());
