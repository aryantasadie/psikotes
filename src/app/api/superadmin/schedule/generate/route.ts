import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

// Generate unique readable random password per participant (alphanumeric, 6 chars)
function generateRandomPassword(length = 6) {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      testId: jobPositionId,
      batchTitle,
      sessionDate,
      clientId,
      testerId,
      prefix,
      count,
      customSequence
    } = await req.json();

    if (!jobPositionId || !prefix || !count || count <= 0 || count > 200) {
      return NextResponse.json({ error: 'Input tidak valid. Jumlah akun harus 1-200.' }, { status: 400 });
    }

    // Get Job Position & its PsychographPreset
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: parseInt(jobPositionId) },
      include: {
        psychographPreset: true
      }
    });

    if (!jobPosition) {
      return NextResponse.json({ error: 'Standar Jabatan tidak ditemukan' }, { status: 400 });
    }

    let baseSequence: string[] = [];

    // 1. Get base sequence from template test or psychograph preset mapping
    if (jobPosition.psychographPresetId) {
      const templateTest = await prisma.test.findFirst({
        where: {
          psychographPresetId: jobPosition.psychographPresetId,
          jobPositionId: null
        },
        orderBy: { id: 'asc' }
      });
      if (templateTest?.sequence && templateTest.sequence.trim() !== '') {
        try { baseSequence = JSON.parse(templateTest.sequence); } catch (e) {}
      }
    }

    if (baseSequence.length === 0 && jobPosition.psychographPreset?.mapping) {
      try {
        const mapping = JSON.parse(jobPosition.psychographPreset.mapping);
        const instrumentsSet = new Set<string>();
        mapping.forEach((cat: any) => {
          cat.aspects?.forEach((asp: any) => {
            if (asp.checked && Array.isArray(asp.instruments)) {
              asp.instruments.forEach((inst: string) => {
                let clean = inst.replace(/Subtes \d+/g, '').replace(/Skala [A-Z]/g, '').trim();
                if (clean) instrumentsSet.add(clean);
              });
            }
          });
        });
        if (instrumentsSet.size > 0) {
          baseSequence = Array.from(instrumentsSet);
        }
      } catch (e) {}
    }

    if (baseSequence.length === 0) {
      baseSequence = ["WPT", "DISC", "PAPI KOSTICK"];
    }

    // 2. Combine base sequence with customSequence (if provided) without duplicates
    let finalSequenceArr = [...baseSequence];
    if (Array.isArray(customSequence) && customSequence.length > 0) {
      customSequence.forEach((tool: string) => {
        if (!finalSequenceArr.includes(tool)) {
          finalSequenceArr.push(tool);
        }
      });
    }

    const testSequence = JSON.stringify(finalSequenceArr);

    const startDate = sessionDate ? new Date(sessionDate) : new Date();
    const finalBatchTitle = batchTitle && batchTitle.trim() !== ''
      ? batchTitle.trim()
      : `Batch ${jobPosition.name} (${startDate.toLocaleDateString('id-ID')})`;

    // Create a new Batch Test Session
    const newTest = await prisma.test.create({
      data: {
        title: finalBatchTitle,
        jobPositionId: jobPosition.id,
        clientId: clientId ? parseInt(clientId) : null,
        startDate: startDate,
        sequence: testSequence,
        psychographPresetId: jobPosition.psychographPresetId || null,
      }
    });

    // If Tester is assigned, add this newTest.id to the tester's assignedTestIds
    if (testerId) {
      const tester = await prisma.user.findUnique({ where: { id: parseInt(testerId) } });
      if (tester) {
        let currentAssigned: number[] = [];
        if (tester.assignedTestIds) {
          try {
            currentAssigned = JSON.parse(tester.assignedTestIds);
          } catch (e) {}
        }
        if (!currentAssigned.includes(newTest.id)) {
          currentAssigned.push(newTest.id);
          await prisma.user.update({
            where: { id: tester.id },
            data: { assignedTestIds: JSON.stringify(currentAssigned) }
          });
        }
      }
    }

    const createdUsers = [];
    const usedPasswords = new Set<string>();

    for (let i = 1; i <= count; i++) {
      const numStr = i.toString().padStart(3, '0');
      const username = `${prefix.toLowerCase().trim()}_${numStr}`;
      
      // Ensure unique random password per participant
      let passwordPlain = generateRandomPassword();
      while (usedPasswords.has(passwordPlain)) {
        passwordPlain = generateRandomPassword();
      }
      usedPasswords.add(passwordPlain);

      const passwordHash = await bcrypt.hash(passwordPlain, 10);

      // Create User
      const user = await prisma.user.create({
        data: {
          name: `Peserta ${numStr} (${prefix})`,
          username,
          password: passwordHash,
          role: 'testee',
        }
      });

      // Assign to Test Participant
      await prisma.testParticipant.create({
        data: {
          userId: user.id,
          testId: newTest.id,
          jobPositionId: jobPosition.id,
          status: 'pending',
          plainPassword: passwordPlain
        }
      });

      createdUsers.push({
        username,
        password: passwordPlain
      });
    }

    return NextResponse.json({
      message: `Berhasil membuat Batch "${finalBatchTitle}" dan ${count} akun peserta`,
      accounts: createdUsers
    });

  } catch (error: any) {
    console.error('Error generating accounts:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat akun peserta.' }, { status: 500 });
  }
}
