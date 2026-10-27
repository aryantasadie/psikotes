import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { calculateKraepelinFullAnalysis } from '@/lib/kraepelinScoring';
import { OFFICIAL_KRAEPELIN_MATRIX } from '@/lib/kraepelinMatrix';
import { isSequenceFinished, parseSequence } from '@/lib/testCompletion';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    const { testType, answers } = body;

    if (!testType || !answers) {
      return NextResponse.json({ success: false, error: 'Missing payload' }, { status: 400 });
    }

    // Find the current active participant for this user
    const participant = await prisma.testParticipant.findFirst({
      where: { userId },
      include: { test: true },
      orderBy: { id: 'desc' }
    });

    if (!participant) {
      return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
    }

    if (participant.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Ujian sudah diselesaikan dan tidak dapat diubah lagi' }, { status: 400 });
    }

    if (!participant.startTime) {
      await prisma.testParticipant.update({
        where: { id: participant.id },
        data: { startTime: new Date() }
      });
    }

    if (testType === 'KRAEPELIN' || testType === 'KREAPELIN') {
      let resultPayload: any;

      if (Array.isArray(answers)) {
        const analysis = calculateKraepelinFullAnalysis(OFFICIAL_KRAEPELIN_MATRIX, answers);
        resultPayload = {
          ...analysis,
          pankerRaw: analysis.panker.raw,
          tinkerRaw: analysis.tinker.raw,
          jankerRaw: analysis.janker.raw,
          pankerNorm: analysis.panker.scale1to5,
          tinkerNorm: analysis.tinker.scale1to5,
          jankerNorm: analysis.janker.scale1to5,
          hankerNorm: analysis.hanker.scale1to5,
        };
      } else if (typeof answers === 'object' && answers !== null) {
        resultPayload = answers;
      } else {
        return NextResponse.json({ success: false, error: 'Format jawaban Kraepelin tidak valid' }, { status: 400 });
      }

      const rawDataStr = JSON.stringify(resultPayload);

      await prisma.$transaction([
        prisma.testResultRaw.deleteMany({
          where: {
            participantId: participant.id,
            testType: 'KRAEPELIN'
          }
        }),
        prisma.testResultRaw.create({
          data: {
            participantId: participant.id,
            testType: 'KRAEPELIN',
            rawData: rawDataStr
          }
        })
      ]);

      await checkAndCompleteTest(participant);
      return NextResponse.json({ success: true });
    }

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

      // Save DISC marker into TestResultRaw so it's guaranteed to be recognized as completed
      ops.push(
        prisma.testResultRaw.deleteMany({
          where: {
            participantId: participant.id,
            testType: 'DISC'
          }
        }),
        prisma.testResultRaw.create({
          data: {
            participantId: participant.id,
            testType: 'DISC',
            rawData: JSON.stringify(discAns)
          }
        })
      );
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
      
      if (testType === 'WPT' && body.age !== undefined && body.age !== null) {
        ops.push(
          prisma.testResultRaw.deleteMany({
            where: {
              participantId: participant.id,
              testType: 'WPT_AGE'
            }
          }),
          prisma.testResultRaw.create({
            data: {
              participantId: participant.id,
              testType: 'WPT_AGE',
              rawData: String(body.age)
            }
          })
        );
      }

      ops.push(
        prisma.testResultRaw.deleteMany({
          where: {
            participantId: participant.id,
            testType: String(testType)
          }
        }),
        prisma.testResultRaw.create({
          data: {
            participantId: participant.id,
            testType: String(testType),
            rawData: JSON.stringify(answers || {})
          }
        })
      );
    }

    await prisma.$transaction([
      prisma.answer.deleteMany({
        where: {
          participantId: participant.id,
          question: { testType }
        }
      }),
      ...ops
    ]);

    await checkAndCompleteTest(participant);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Submit Answer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper to check if all tests in sequence are finished and mark participant as completed
async function checkAndCompleteTest(participant: any) {
  try {
    let sequence: string[] = [];
    if (participant.test?.sequence) {
      sequence = parseSequence(participant.test.sequence);
    } else {
      const testObj = await prisma.test.findUnique({
        where: { id: participant.testId },
        select: { sequence: true }
      });
      if (testObj?.sequence) sequence = parseSequence(testObj.sequence);
    }

    if (Array.isArray(sequence) && sequence.length > 0) {
      const [rawResults, answers] = await Promise.all([
        prisma.testResultRaw.findMany({
          where: { participantId: participant.id },
          select: { testType: true }
        }),
        prisma.answer.findMany({
          where: { participantId: participant.id },
          select: { question: { select: { testType: true } } }
        })
      ]);

      const doneTypes: string[] = [];
      rawResults.forEach(r => doneTypes.push(r.testType));
      answers.forEach(a => {
        if (a.question?.testType) doneTypes.push(a.question.testType);
      });

      if (isSequenceFinished(sequence, doneTypes)) {
        await prisma.testParticipant.update({
          where: { id: participant.id },
          data: {
            status: 'completed',
            endTime: new Date()
          }
        });
      }
    }
  } catch (e) {
    console.error('Error auto-completing participant:', e);
  }
}
