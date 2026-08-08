import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const formattedQuestions = [
  "78 : 13 = .....",
  "..... + 49 = 81",
  "..... - 17 = 18",
  "9 X ..... = 117",
  "5/7 X 14 = .....",
  "13 X 4 = .....",
  "13 + 8 = ......",
  "32 : 8 = ......",
  "25 + 6 = .......",
  "0,25 + 0.07 = ......",
  "43 - ..... = 27",
  "22 - ...... = 9",
  "14/7 X 2/7 = ........",
  "6/8 - 2/4 = ......",
  "26 + ...... = 38",
  "...... + 1/5 = 5",
  "17 + 9 =.......",
  "27 + ........ = 51",
  "27 X 3 = ........",
  "0.03 + 0.2 = .........",
  "0.13 - 0.019 = .....",
  "8/9 + ...... = 1",
  "36 - 19 = .......",
  "...... + 2/3 = 7/6",
  "0.019 - 0.011 = ......",
  "0.14 + 0.023 = .......",
  "4/8 X 12/16 = ......",
  "0.47 - 0.024 = ......",
  "0.27 : 0.3 = .......",
  "6/7 + 18/21 = .......",
  "0.68 - 0.3 = .......",
  "3/8 - ...... = 1/8",
  "0.03 X ....... = 0.018",
  "0.3 + ....... = 0.43",
  "30 - 26/7 = ......",
  "26 - 26/8 = ......",
  "0.24 X ..... = 0.096",
  "7/8 X ...... = 7/6",
  "0.32 : 0.2 = .........",
  "0.33 : ...... = 0.03"
];

async function main() {
  const tiki1Questions = await prisma.question.findMany({
    where: { testType: 'TIKI 1' },
    orderBy: { id: 'asc' }
  });

  for (let i = 0; i < 40; i++) {
    await prisma.question.update({
      where: { id: tiki1Questions[i].id },
      data: { 
        content: formattedQuestions[i],
        options: '["A", "B", "C", "D"]'
      }
    });
  }

  console.log("Successfully reverted TIKI 1 formatting and set options to A, B, C, D.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
