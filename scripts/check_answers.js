const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ans = await prisma.answer.findMany({
    where: { question: { testType: 'TIKI 4' } },
    include: { question: true },
    orderBy: { questionId: 'asc' }
  });
  const map = {};
  for(let a of ans) {
    if(!map[a.participantId]) map[a.participantId] = [];
    map[a.participantId].push({ qNum: a.question.id, val: a.selectedOption, qCorrect: a.question.correct });
  }
  for(let p in map) {
    console.log("Participant", p, ":");
    const last2 = map[p].slice(-5);
    console.log(last2);
  }
}
main().finally(() => prisma.$disconnect());
