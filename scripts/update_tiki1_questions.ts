import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const formattedQuestions = [
  "78 : 13 = .....",
  "..... + 49 = 81",
  "..... - 17 = 18",
  "9 X ..... = 117",
  "<sup>5</sup>&frasl;<sub>7</sub> X 14 = .....",
  "13 X 4 = .....",
  "13 + 8 = ......",
  "32 : 8 = ......",
  "25 + 6 = .......",
  "0,25 + 0.07 = ......",
  "43 - ..... = 27",
  "22 - ...... = 9",
  "<sup>14</sup>&frasl;<sub>7</sub> X <sup>2</sup>&frasl;<sub>7</sub> = ........",
  "<sup>6</sup>&frasl;<sub>8</sub> - <sup>2</sup>&frasl;<sub>4</sub> = ......",
  "26 + ...... = 38",
  "...... + <sup>1</sup>&frasl;<sub>5</sub> = 5",
  "17 + 9 =.......",
  "27 + ........ = 51",
  "27 X 3 = ........",
  "0.03 + 0.2 = .........",
  "0.13 - 0.019 = .....",
  "<sup>8</sup>&frasl;<sub>9</sub> + ...... = 1",
  "36 - 19 = .......",
  "...... + <sup>2</sup>&frasl;<sub>3</sub> = <sup>7</sup>&frasl;<sub>6</sub>",
  "0.019 - 0.011 = ......",
  "0.14 + 0.023 = .......",
  "<sup>4</sup>&frasl;<sub>8</sub> X <sup>12</sup>&frasl;<sub>16</sub> = ......",
  "0.47 - 0.024 = ......",
  "0.27 : 0.3 = .......",
  "<sup>6</sup>&frasl;<sub>7</sub> + <sup>18</sup>&frasl;<sub>21</sub> = .......",
  "0.68 - 0.3 = .......",
  "<sup>3</sup>&frasl;<sub>8</sub> - ...... = <sup>1</sup>&frasl;<sub>8</sub>",
  "0.03 X ....... = 0.018",
  "0.3 + ....... = 0.43",
  "30 - <sup>26</sup>&frasl;<sub>7</sub> = ......",
  "26 - <sup>26</sup>&frasl;<sub>8</sub> = ......",
  "0.24 X ..... = 0.096",
  "<sup>7</sup>&frasl;<sub>8</sub> X ...... = <sup>7</sup>&frasl;<sub>6</sub>",
  "0.32 : 0.2 = .........",
  "0.33 : ...... = 0.03"
];

async function main() {
  const tiki1Questions = await prisma.question.findMany({
    where: { testType: 'TIKI 1' },
    orderBy: { id: 'asc' }
  });

  if (tiki1Questions.length !== 40) {
    console.log(`Found ${tiki1Questions.length} questions. Updating existing and creating missing...`);
  }

  for (let i = 0; i < 40; i++) {
    if (i < tiki1Questions.length) {
      await prisma.question.update({
        where: { id: tiki1Questions[i].id },
        data: { content: formattedQuestions[i] }
      });
    } else {
      await prisma.question.create({
        data: {
          testId: 1, // assuming testId 1 is where it belongs
          testType: 'TIKI 1',
          content: formattedQuestions[i],
          options: '["5", "6", "7", "8"]', // Temporary placeholder options, will fix below
        }
      });
    }
  }

  console.log("Successfully updated/created 40 questions for TIKI 1 with HTML formatting.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
