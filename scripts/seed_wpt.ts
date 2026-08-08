import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'scripts', 'wpt_final.json');
  const fileData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(fileData);

  // Bersihkan soal WPT lama jika ada
  await prisma.question.deleteMany({
    where: {
      testType: 'WPT'
    }
  });

  let insertedCount = 0;
  for (const q of questions) {
    let content = q.content;
    if (q.is_image) {
      // mapping image paths, separated by ||| so UI can split
      if (q.number === 7) content += "|||/soal/wpt/image_1.jpeg";
      if (q.number === 16) content += "|||/soal/wpt/image_2.jpeg";
      if (q.number === 38) content += "|||/soal/wpt/image_3.png";
      if (q.number === 40) content += "|||/soal/wpt/image_4.jpeg";
      if (q.number === 42) content += "|||/soal/wpt/image_5.png";
      if (q.number === 49) content += "|||/soal/wpt/image_6.jpeg";
    }

    await prisma.question.create({
      data: {
        testId: 1, // Memakai testId 1 yang sudah kita buat sebelumnya
        testType: 'WPT',
        content: content,
        options: JSON.stringify(q.options),
        correct: q.correct
      }
    });
    insertedCount++;
  }
  
  console.log(`Sukses memasukkan ${insertedCount} soal WPT ke database!`);
}

main()
  .catch((e) => {
    console.error("Error seeding WPT:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
