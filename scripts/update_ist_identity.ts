import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    where: { testType: 'IST' },
    orderBy: { id: 'asc' }
  });
  
  let count6 = 0;
  let count7 = 0;

  for (let i = 0; i < questions.length; i++) {
    const newType = i < 20 ? 'IST 6' : 'IST 7';
    await prisma.question.update({
      where: { id: questions[i].id },
      data: { testType: newType }
    });
    if (newType === 'IST 6') count6++;
    if (newType === 'IST 7') count7++;
  }
  
  console.log(`Berhasil memperbarui identitas soal: ${count6} soal menjadi IST 6, dan ${count7} soal menjadi IST 7.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
