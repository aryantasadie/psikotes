const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.question.findMany({
    where: { testType: { startsWith: 'IST' } },
    select: { testType: true, correct: true }
  });

  const map = {};
  for(let q of qs) {
    if(!map[q.testType]) map[q.testType] = { total: 0, withKey: 0 };
    map[q.testType].total++;
    if(q.correct && q.correct !== "") {
      map[q.testType].withKey++;
    }
  }

  console.log(map);
}

main().catch(console.error).finally(() => prisma.$disconnect());
