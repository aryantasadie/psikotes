const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  for (let test of ['WPT', 'IST 2', 'IST 3', 'IST 6', 'IST 7']) {
    const q = await prisma.question.findFirst({
      where: { testType: test }
    });
    console.log(`\n--- ${test} ---`);
    if(q) {
      console.log('Options:', q.options);
    } else {
      console.log('Not found');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
