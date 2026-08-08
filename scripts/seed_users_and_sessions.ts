import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users and test sessions...');

  // Hash passwords
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Create Superadmin
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      password: passwordHash,
      role: 'superadmin',
    },
  });
  console.log('Created Superadmin:', superadmin.username);

  // 2. Create Client
  const client = await prisma.user.upsert({
    where: { username: 'hrd_perusahaan' },
    update: {},
    create: {
      name: 'HRD Perusahaan',
      username: 'hrd_perusahaan',
      password: passwordHash,
      role: 'client',
    },
  });
  console.log('Created Client:', client.username);

  // 3. Create Testee (Kandidat)
  const testee = await prisma.user.upsert({
    where: { username: 'budi_kandidat' },
    update: {},
    create: {
      name: 'Budi Santoso',
      username: 'budi_kandidat',
      password: passwordHash,
      role: 'testee',
    },
  });
  console.log('Created Testee:', testee.username);

  // 4. Create Job Position
  const jobPosition = await prisma.jobPosition.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Management Trainee 2026',
      description: 'Program Rekrutmen MT Batch 1',
    },
  });
  console.log('Created Job Position:', jobPosition.name);

  // 5. Create Test Session (Battery)
  // Define sequence of tests for this recruitment batch
  const testSequence = JSON.stringify(['CFIT 1', 'WPT', 'DISC']);

  const testSession = await prisma.test.upsert({
    where: { id: 1 },
    update: {
      sequence: testSequence,
    },
    create: {
      title: 'Seleksi MT Batch 1 - 2026',
      jobPositionId: jobPosition.id,
      sequence: testSequence,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });
  console.log('Created Test Session with Sequence:', testSession.sequence);

  // 6. Assign Testee to Test Session
  const participant = await prisma.testParticipant.upsert({
    where: { id: 1 },
    update: {
      userId: testee.id,
      testId: testSession.id,
    },
    create: {
      userId: testee.id,
      testId: testSession.id,
      status: 'pending',
    },
  });
  console.log('Assigned Testee to Session! Participant ID:', participant.id);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
