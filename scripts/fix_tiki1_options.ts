import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const tiki1Path = path.join(__dirname, 'tiki1_parsed.json');
  const tiki1Data = JSON.parse(fs.readFileSync(tiki1Path, 'utf8'));
  
  const tiki1Questions = await prisma.question.findMany({
    where: { testType: 'TIKI 1' },
    orderBy: { id: 'asc' }
  });

  for (let i = 0; i < 40; i++) {
    const qData = tiki1Data[i];
    const parsedOptions = typeof qData.options === 'string' ? JSON.parse(qData.options) : qData.options;
    const validOptions = parsedOptions.filter((opt: string) => opt.trim() !== "");
    const cleanedOptions = validOptions.map((opt: string) => opt.replace(/^[A-D]\)\s*/, ''));

    // Fix the /25 typos in Q16
    if (i === 15) { // Q16 is at index 15
      for (let j = 0; j < cleanedOptions.length; j++) {
         cleanedOptions[j] = cleanedOptions[j].replace('/5', '/25');
      }
    }

    await prisma.question.update({
      where: { id: tiki1Questions[i].id },
      data: { options: JSON.stringify(cleanedOptions) }
    });
  }

  console.log("Successfully fixed options for all 40 questions of TIKI 1.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
