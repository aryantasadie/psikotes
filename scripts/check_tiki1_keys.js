const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.question.findMany({
    where: { testType: 'TIKI 1' },
    orderBy: { id: 'asc' }
  });
  console.log('Count:', qs.length);
  for(let i = 30; i < 40; i++) {
    console.log(`Q${i+1} correct: ${qs[i].correct}`);
  }
}

main().finally(() => prisma.$disconnect());
