import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const keysTiki1 = ["B", "C", "C", "A", "B", "D", "D", "A", "D", "A", "B", "C", "B", "D", "B", "C", "C", "D", "A", "A", "C", "C", "D", "A", "A", "B", "B", "C", "C", "A", "B", "B", "B", "D", "A", "B", "A", "B", "A", "D"];
const keysTiki3 = ["AD", "AC", "AC", "AC", "AB", "AD", "AC", "AB", "AC", "CD", "AB", "AC", "AD", "CD", "BD", "BD", "AC", "BD", "AD", "BC", "AD", "AB", "AC", "AC", "BD", "CD", "AC", "AD", "BC", "AC", "BD", "CD", "BC", "BC", "AD", "CD", "BD", "AC", "BC", "BC"];

const charToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };

async function fixKeys() {
  const q1 = await prisma.question.findMany({ where: { testType: 'TIKI 1' }, orderBy: { id: 'asc' } });
  for (let i = 0; i < Math.min(q1.length, keysTiki1.length); i++) {
    const q = q1[i];
    const keyChar = keysTiki1[i];
    const opts = JSON.parse(q.options as string);
    const correctVal = opts[charToIndex[keyChar]];
    await prisma.question.update({ where: { id: q.id }, data: { correct: correctVal } });
  }
  console.log('Fixed TIKI 1 keys');

  const q3 = await prisma.question.findMany({ where: { testType: 'TIKI 3' }, orderBy: { id: 'asc' } });
  for (let i = 0; i < Math.min(q3.length, keysTiki3.length); i++) {
    const q = q3[i];
    const keyChars = keysTiki3[i];
    const opts = JSON.parse(q.options as string);
    const correctVals = keyChars.split('').map((c: string) => opts[charToIndex[c]]);
    await prisma.question.update({ where: { id: q.id }, data: { correct: JSON.stringify(correctVals) } });
  }
  console.log('Fixed TIKI 3 keys');
}

fixKeys().catch(console.error).finally(() => prisma.$disconnect());
