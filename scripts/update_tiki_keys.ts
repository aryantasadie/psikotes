import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const keysTiki1 = ["B", "C", "C", "A", "B", "D", "D", "A", "D", "A", "B", "C", "B", "D", "B", "C", "C", "D", "A", "A", "C", "C", "D", "A", "A", "B", "B", "C", "C", "A", "B", "B", "B", "D", "A", "B", "A", "B", "A", "D"];
const keysTiki2 = ["AC", "AD", "DF", "BE", "BF", "BE", "BE", "AC", "BD", "BD", "AE", "DF", "BD", "CF", "CF", "CE", "BF", "CE", "CF", "BF", "BD", "CE", "AE", "CD", "AF", "CF"];
const keysTiki3 = ["AD", "AC", "AC", "AC", "AB", "AD", "AC", "AB", "AC", "CD", "AB", "AC", "AD", "CD", "BD", "BD", "AC", "BD", "AD", "BC", "AD", "AB", "AC", "AC", "BD", "CD", "AC", "AD", "BC", "AC", "BD", "CD", "BC", "BC", "AD", "CD", "BD", "AC", "BC", "BC"];
const keysTiki4 = ["BC", "DF", "AD", "BE", "CD", "AE", "AD", "BE", "DE", "BF", "BC", "DE", "AD", "EF", "CE", "AC", "CD", "CF", "AC", "BC", "DF", "AC", "AF", "BC", "AB", "BC", "AD", "BE", "EF", "AE"];
const keysTiki6 = ["S", "S", "TS", "TS", "S", "TS", "S", "S", "S", "TS", "S", "S", "TS", "S", "S", "S", "S", "TS", "TS", "TS", "S", "TS", "S", "TS", "TS", "S", "TS", "S", "S", "TS", "TS", "S", "S", "TS", "TS", "S", "S", "S", "TS", "S", "TS", "TS", "TS", "TS", "TS", "S", "S", "S", "TS", "TS", "S", "S", "TS", "S", "S", "TS", "TS", "S", "TS", "S", "TS", "TS", "TS", "TS", "TS", "S", "TS", "S", "S", "TS", "S", "TS", "S", "TS", "S", "S", "S", "TS", "TS", "TS", "S", "S", "S", "S", "TS", "S", "S", "TS", "TS", "S", "TS", "TS", "S", "TS", "S", "S", "S", "TS", "TS", "TS"];

async function updateKeys(testType: string, keys: string[], isMulti: boolean) {
  const questions = await prisma.question.findMany({
    where: { testType },
    orderBy: { id: 'asc' }
  });

  if (questions.length === 0) {
    console.log(`No questions found for ${testType}`);
    return;
  }

  if (questions.length !== keys.length) {
    console.warn(`Mismatch in ${testType}: found ${questions.length} questions but ${keys.length} keys`);
  }

  for (let i = 0; i < Math.min(questions.length, keys.length); i++) {
    const key = keys[i];
    // If it's a multi-answer (like AC), convert to JSON string array ["A", "C"]
    const correctVal = isMulti ? JSON.stringify(key.split('')) : key;

    await prisma.question.update({
      where: { id: questions[i].id },
      data: { correct: correctVal }
    });
  }

  console.log(`Successfully updated ${Math.min(questions.length, keys.length)} keys for ${testType}`);
}

async function main() {
  console.log('Starting TIKI key update...');
  await updateKeys('TIKI 1', keysTiki1, false);
  await updateKeys('TIKI 2', keysTiki2, true);
  await updateKeys('TIKI 3', keysTiki3, true);
  await updateKeys('TIKI 4', keysTiki4, true);
  await updateKeys('TIKI 6', keysTiki6, false);
  console.log('Done updating TIKI keys.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
