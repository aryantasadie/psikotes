const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const istKeys = {
  'IST 2': ['B', 'B', 'D', 'C', 'C', 'C', 'C', 'D', 'D', 'A', 'E', 'A', 'A', 'B', 'C', 'A', 'D', 'E', 'B', 'C'],
  'IST 3': ['C', 'E', 'D', 'D', 'D', 'B', 'D', 'B', 'E', 'D', 'C', 'C', 'C', 'C', 'D', 'C', 'C', 'E', 'E', 'E'],
  'IST 6': ['27', '25', '27', '15', '46', '10', '42', '7', '5', '14', '8', '14', '45', '63', '12', '80', '14', '12', '63', '10'],
  'IST 7': ['A', 'C', 'B', 'A', 'D', 'B', 'C', 'E', 'E', 'D', 'E', 'B', 'D', 'C', 'B', 'A', 'B', 'D', 'C', 'C']
};

const wptKeys = [
  '4', '2', '3', '2', '3', '1', '3', '0.125', '1', '4', 
  '3', '6000', '1', '2', '20', '2', 'A', '13', '3', '1', 
  '20', 'S', '25', '2', '3', '1', '0.03', '3', '6', '10', 
  'E', '1', '3', '18', '0.25', '24', '0.0625', 'C', '2', '1', 
  '14', 'C', '4', '2', '2.4', '2', '3', '675', '1245', '12'
];

async function updateKeys() {
  // 1. UPDATE IST KEYS
  for (const [testName, keys] of Object.entries(istKeys)) {
    const questions = await prisma.question.findMany({
      where: { testType: testName },
      orderBy: { id: 'asc' }
    });
    
    if (questions.length !== 20) {
      console.warn(`Warning: Expected 20 questions for ${testName}, found ${questions.length}`);
    }

    for (let i = 0; i < Math.min(questions.length, keys.length); i++) {
      await prisma.question.update({
        where: { id: questions[i].id },
        data: { correct: keys[i] }
      });
    }
    console.log(`Successfully updated ${Math.min(questions.length, keys.length)} answer keys for ${testName}.`);
  }

  // 2. UPDATE WPT KEYS
  const wptQuestions = await prisma.question.findMany({
    where: { testType: 'WPT' },
    orderBy: { id: 'asc' }
  });

  if (wptQuestions.length !== 50) {
    console.warn(`Warning: Expected 50 questions for WPT, found ${wptQuestions.length}`);
  }

  for (let i = 0; i < Math.min(wptQuestions.length, wptKeys.length); i++) {
    // For WPT, especially Q45, the DB might store it as a single string since the user inputs free text for some
    await prisma.question.update({
      where: { id: wptQuestions[i].id },
      data: { correct: wptKeys[i] }
    });
  }
  console.log(`Successfully updated ${Math.min(wptQuestions.length, wptKeys.length)} answer keys for WPT.`);
}

updateKeys()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
