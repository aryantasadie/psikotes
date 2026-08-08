const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.question.findMany({
    where: { testType: { startsWith: 'W' } },
    select: { testType: true }
  });
  console.log([...new Set(qs.map(q => q.testType))]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
