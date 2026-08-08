import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    const { testType, answers } = body; // answers is { [questionId]: "A" }

    if (!testType || !answers) {
      return NextResponse.json({ success: false, error: 'Missing payload' }, { status: 400 });
    }

    // Find the current active participant for this user
    const participant = await prisma.testParticipant.findFirst({
      where: { userId },
      orderBy: { id: 'desc' }
    });

    if (!participant) {
      return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
    }

    // Prepare operations to save answers
    let ops: any[] = [];
    if (testType === 'DISC') {
      const discAns: Record<number, any> = {};
      for (const [key, val] of Object.entries(answers)) {
        const qId = parseInt(key, 10);
        const type = key.includes('most') ? 'most' : 'least';
        if (!discAns[qId]) discAns[qId] = {};
        discAns[qId][type] = val;
      }
      ops = Object.entries(discAns).map(([qId, obj]) => {
        return prisma.answer.create({
          data: {
            participantId: participant.id,
            questionId: parseInt(qId, 10),
            selectedOption: JSON.stringify(obj)
          }
        });
      });
    } else {
      ops = Object.entries(answers).map(([qId, selectedOption]) => {
        const questionId = parseInt(qId, 10);
        const optionStr = Array.isArray(selectedOption) ? JSON.stringify(selectedOption) : String(selectedOption);
        return prisma.answer.create({
          data: {
            participantId: participant.id,
            questionId,
            selectedOption: optionStr
          }
        });
      });
      
      // Khusus untuk WPT, simpan nilai umur peserta (jika ada) ke dalam tabel TestResultRaw
      if (testType === 'WPT' && body.age !== undefined && body.age !== null) {
        // Hapus dulu data umur WPT yang lama jika ada (agar tidak duplicate saat retake)
        ops.push(
          prisma.testResultRaw.deleteMany({
            where: {
              participantId: participant.id,
              testType: 'WPT_AGE'
            }
          })
        );
        ops.push(
          prisma.testResultRaw.create({
            data: {
              participantId: participant.id,
              testType: 'WPT_AGE',
              rawData: String(body.age)
            }
          })
        );
      }
    }

    // We first delete any existing answers from this participant for this testType to prevent duplicates
    await prisma.answer.deleteMany({
      where: {
        participantId: participant.id,
        question: { testType }
      }
    });

    // Execute insertion in a transaction
    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Submit Answer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
