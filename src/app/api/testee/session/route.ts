import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || (userRole !== 'testee' && userRole !== 'user')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);

  const participant = await prisma.testParticipant.findFirst({
    where: { userId, status: { not: 'completed' } },
    include: { 
      test: true,
      rawResults: { select: { testType: true } },
      answers: { select: { question: { select: { testType: true } } } }
    },
    orderBy: { id: 'desc' }
  });

  if (!participant) {
    return NextResponse.json({ sequence: [], completedTests: [] });
  }

  if (participant.status === 'stopped') {
    return NextResponse.json({
      isStopped: true,
      participantId: participant.id,
      sequence: [],
      completedTests: [],
      message: 'Ujian Anda telah dihentikan oleh pengawas.'
    });
  }

  let sequence: string[] = [];
  try {
    sequence = JSON.parse(participant.test?.sequence || '[]');
  } catch (e) {
    sequence = [];
  }

  const completedTypesInDb = new Set<string>();
  (participant.rawResults || []).forEach(r => {
    if (r.testType) completedTypesInDb.add(r.testType.toUpperCase().replace(/[\s\-_]+/g, ''));
  });
  (participant.answers || []).forEach(a => {
    if (a.question?.testType) completedTypesInDb.add(a.question.testType.toUpperCase().replace(/[\s\-_]+/g, ''));
  });

  const completedTests: string[] = [];
  for (const testName of sequence) {
    const slug = testName.toUpperCase().replace(/[\s\-_]+/g, '');
    if (
      completedTypesInDb.has(slug) ||
      (slug.includes('KRAEPELIN') && (completedTypesInDb.has('KRAEPELIN') || completedTypesInDb.has('KREAPELIN'))) ||
      (slug.includes('POWER') && (completedTypesInDb.has('POWER') || completedTypesInDb.has('POWERLEADER'))) ||
      (slug.includes('PAPI') && (completedTypesInDb.has('PAPI') || completedTypesInDb.has('PAPIKOSTICK'))) ||
      (slug.includes('DISC') && completedTypesInDb.has('DISC')) ||
      (slug.includes('MSDT') && completedTypesInDb.has('MSDT')) ||
      (slug.includes('WPT') && completedTypesInDb.has('WPT'))
    ) {
      completedTests.push(testName);
    }
  }

  // Next test computation
  const nextTestIndex = sequence.findIndex(t => !completedTests.includes(t));
  const isAllCompleted = sequence.length > 0 && nextTestIndex === -1;
  const nextTest = isAllCompleted || sequence.length === 0 ? null : sequence[nextTestIndex];

  // Pause / Breakpoint check
  const isDirectlyPaused = Boolean(participant.isPaused) || Boolean(participant.test?.isPaused);
  let isPaused = isDirectlyPaused;
  let pausedMessage = participant.test?.pauseMessage || 'Ujian sedang dijeda oleh pengawas. Harap menunggu instruksi selanjutnya.';

  if (nextTest && !isAllCompleted) {
    let pausedTestsList: string[] = [];
    try { pausedTestsList = JSON.parse(participant.test?.pausedTests || '[]'); } catch (e) {}

    let unpausedList: string[] = [];
    try { unpausedList = JSON.parse(participant.unpausedTests || '[]'); } catch (e) {}

    const lastCompletedTest = completedTests.length > 0 ? completedTests[completedTests.length - 1] : null;
    const cleanLast = lastCompletedTest ? lastCompletedTest.toUpperCase().replace(/[\s\-_]+/g, '') : '';

    const breakKey = cleanLast ? `BREAK_AFTER_${cleanLast}` : null;
    const isTestSpecificallyPaused = Boolean(
      breakKey && pausedTestsList.some(pt => pt.toUpperCase() === breakKey)
    );
    const isTestUnpaused = Boolean(
      breakKey && unpausedList.some(ut => ut.toUpperCase() === breakKey)
    );

    const shouldPause = isDirectlyPaused || (isTestSpecificallyPaused && !isTestUnpaused);

    if (shouldPause) {
      isPaused = true;
      const pauseTitle = lastCompletedTest 
        ? `Jeda setelah ${lastCompletedTest}` 
        : (participant.test?.isPaused ? 'Ujian Dijeda' : `Jeda sebelum ${nextTest}`);

      pausedMessage = participant.test?.pauseMessage || (lastCompletedTest 
        ? `Jeda setelah tes ${lastCompletedTest}. Harap istirahat sejenak dan menunggu arahan pengawas untuk melanjutkan ke tes berikutnya.`
        : 'Sesi pengerjaan sedang dijeda oleh pengawas. Harap menunggu instruksi selanjutnya.');

      if (!participant.isPaused || participant.currentTest !== pauseTitle) {
        prisma.testParticipant.update({
          where: { id: participant.id },
          data: {
            isPaused: true,
            currentTest: pauseTitle
          }
        }).catch(() => {});
      }
    } else {
      isPaused = false;
      if (participant.isPaused) {
        prisma.testParticipant.update({
          where: { id: participant.id },
          data: {
            isPaused: false,
            currentTest: nextTest
          }
        }).catch(() => {});
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true }
  });

  const rawName = (user?.name || '').trim();
  const username = (user?.username || '').trim();
  const isDefaultName = !rawName || 
    rawName.toLowerCase().startsWith('peserta ') || 
    rawName.toLowerCase() === 'peserta' ||
    rawName.toLowerCase() === username.toLowerCase();

  return NextResponse.json({ 
    participantId: participant.id,
    userName: rawName,
    username: username,
    isDefaultName,
    sequence,
    completedTests,
    nextTest,
    isAllCompleted,
    isPaused,
    pausedMessage,
    isStopped: false
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'testee' && userRole !== 'user')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const { name } = await req.json();

    const sanitizedName = String(name || '').replace(/[<>]/g, '').trim();

    if (!sanitizedName) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    // Update user's name in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: sanitizedName }
    });

    return NextResponse.json({ success: true, name: updatedUser.name });
  } catch (error: any) {
    console.error('Error updating testee name:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
