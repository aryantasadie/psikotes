import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const discScoringKeys: Record<number, { most: Record<string, string>, least: Record<string, string> }> = {
  1: { most: { A: 'S', B: 'I', C: 'B', D: 'C' }, least: { A: 'S', B: 'I', C: 'D', D: 'C' } },
  2: { most: { A: 'D', B: 'C', C: 'B', D: 'B' }, least: { A: 'D', B: 'C', C: 'I', D: 'S' } },
  3: { most: { A: 'B', B: 'D', C: 'S', D: 'I' }, least: { A: 'C', B: 'D', C: 'S', D: 'B' } },
  4: { most: { A: 'C', B: 'D', C: 'B', D: 'S' }, least: { A: 'B', B: 'D', C: 'I', D: 'S' } },
  5: { most: { A: 'B', B: 'D', C: 'S', D: 'I' }, least: { A: 'C', B: 'D', C: 'S', D: 'B' } },
  6: { most: { A: 'D', B: 'B', C: 'B', D: 'C' }, least: { A: 'D', B: 'I', C: 'S', D: 'B' } },
  7: { most: { A: 'I', B: 'B', C: 'B', D: 'D' }, least: { A: 'I', B: 'C', C: 'S', D: 'B' } },
  8: { most: { A: 'S', B: 'B', C: 'D', D: 'C' }, least: { A: 'B', B: 'I', C: 'D', D: 'C' } },
  9: { most: { A: 'D', B: 'S', C: 'I', D: 'B' }, least: { A: 'D', B: 'B', C: 'I', D: 'C' } },
  10: { most: { A: 'C', B: 'S', C: 'B', D: 'D' }, least: { A: 'C', B: 'S', C: 'I', D: 'D' } },
  11: { most: { A: 'B', B: 'C', C: 'I', D: 'D' }, least: { A: 'S', B: 'B', C: 'I', D: 'D' } },
  12: { most: { A: 'D', B: 'S', C: 'I', D: 'C' }, least: { A: 'B', B: 'S', C: 'I', D: 'B' } },
  13: { most: { A: 'I', B: 'D', C: 'S', D: 'B' }, least: { A: 'B', B: 'D', C: 'S', D: 'C' } },
  14: { most: { A: 'D', B: 'S', C: 'I', D: 'B' }, least: { A: 'D', B: 'B', C: 'B', D: 'C' } },
  15: { most: { A: 'S', B: 'D', C: 'I', D: 'B' }, least: { A: 'S', B: 'D', C: 'I', D: 'C' } },
  16: { most: { A: 'C', B: 'D', C: 'I', D: 'S' }, least: { A: 'B', B: 'D', C: 'I', D: 'S' } },
  17: { most: { A: 'C', B: 'I', C: 'S', D: 'D' }, least: { A: 'C', B: 'I', C: 'B', D: 'D' } },
  18: { most: { A: 'S', B: 'B', C: 'D', D: 'C' }, least: { A: 'S', B: 'I', C: 'D', D: 'C' } },
  19: { most: { A: 'S', B: 'I', C: 'B', D: 'B' }, least: { A: 'B', B: 'I', C: 'C', D: 'D' } },
  20: { most: { A: 'S', B: 'C', C: 'I', D: 'D' }, least: { A: 'S', B: 'B', C: 'I', D: 'D' } },
  21: { most: { A: 'B', B: 'I', C: 'S', D: 'B' }, least: { A: 'D', B: 'B', C: 'S', D: 'C' } },
  22: { most: { A: 'I', B: 'S', C: 'C', D: 'D' }, least: { A: 'I', B: 'S', C: 'C', D: 'D' } },
  23: { most: { A: 'B', B: 'C', C: 'I', D: 'S' }, least: { A: 'D', B: 'B', C: 'I', D: 'S' } },
  24: { most: { A: 'B', B: 'I', C: 'D', D: 'C' }, least: { A: 'S', B: 'I', C: 'B', D: 'B' } },
};

function calculateDiscProfile(answersMap: Record<string, string>): string {
  let mostD = 0, mostI = 0, mostS = 0, mostC = 0;
  let leastD = 0, leastI = 0, leastS = 0, leastC = 0;

  for (let q = 1; q <= 24; q++) {
    const key = discScoringKeys[q];
    if (!key) continue;

    // Search answer for question number q
    for (const [k, v] of Object.entries(answersMap)) {
      if (k.endsWith('_most')) {
        const val = key.most[v];
        if (val === 'D') mostD++;
        else if (val === 'I') mostI++;
        else if (val === 'S') mostS++;
        else if (val === 'C') mostC++;
      } else if (k.endsWith('_least')) {
        const val = key.least[v];
        if (val === 'D') leastD++;
        else if (val === 'I') leastI++;
        else if (val === 'S') leastS++;
        else if (val === 'C') leastC++;
      }
    }
  }

  const diffD = mostD - leastD;
  const diffI = mostI - leastI;
  const diffS = mostS - leastS;
  const diffC = mostC - leastC;

  const maxVal = Math.max(diffD, diffI, diffS, diffC);
  if (maxVal === diffD) return 'Dominance (D)';
  if (maxVal === diffI) return 'Influence (I)';
  if (maxVal === diffS) return 'Steadiness (S)';
  return 'Compliance (C)';
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Number((session.user as any).id);
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    const whereCondition: any = { clientId };
    if (batchId && !isNaN(Number(batchId))) {
      whereCondition.id = Number(batchId);
    }

    const tests = await prisma.test.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        startDate: true,
        sequence: true,
        jobPosition: { select: { name: true } },
        participants: {
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              }
            },
            rawResults: {
              select: {
                testType: true,
                rawData: true,
              }
            },
            answers: {
              select: {
                questionId: true,
                selectedOption: true,
                question: {
                  select: {
                    testType: true,
                  }
                }
              }
            },
            psychoResults: {
              select: {
                recommendation: true,
                status: true,
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { id: 'desc' }
    });

    const result = tests.map(t => ({
      batchId: t.id,
      batchTitle: t.title,
      startDate: t.startDate,
      jobPositionName: t.jobPosition?.name || 'Umum',
      totalCandidates: t.participants.length,
      completedCandidates: t.participants.filter(p => p.status === 'completed' || p.answers.length > 0).length,
      candidates: t.participants.map(p => {
        const testScores: Record<string, any> = {};

        // Parse from rawResults
        p.rawResults.forEach(r => {
          try {
            const parsed = typeof r.rawData === 'string' ? JSON.parse(r.rawData) : r.rawData;
            const type = (r.testType || '').toUpperCase();

            if (type.includes('WPT')) {
              testScores['WPT'] = {
                score: parsed.score || parsed.correctCount || parsed.totalCorrect || 0,
                iq: parsed.iq || '-',
                category: parsed.category || '-'
              };
            } else if (type.includes('KRAEPELIN') || type.includes('KREAPELIN')) {
              testScores['Kraepelin'] = {
                kecepatan: parsed.pankerRaw || parsed.panker?.raw || parsed.kecepatan || '-',
                ketelitian: parsed.tinkerRaw || parsed.tinker?.raw || parsed.ketelitian || '-',
                ketahanan: parsed.hankerNorm || parsed.hanker?.scale1to5 || parsed.ketahanan || '-'
              };
            } else if (type.includes('DISC')) {
              testScores['DISC'] = {
                profile: calculateDiscProfile(parsed) || 'Selesai Dikerjakan'
              };
            } else {
              testScores[r.testType] = { completed: true };
            }
          } catch {
            testScores[r.testType] = { completed: true };
          }
        });

        // Fallback for DISC if only in answers
        if (!testScores['DISC']) {
          const discAnswers = p.answers.filter(a => a.question?.testType === 'DISC');
          if (discAnswers.length > 0) {
            const discMap: Record<string, string> = {};
            discAnswers.forEach(a => {
              try {
                const opt = JSON.parse(a.selectedOption);
                if (opt.most) discMap[`${a.questionId}_most`] = opt.most;
                if (opt.least) discMap[`${a.questionId}_least`] = opt.least;
              } catch {}
            });
            testScores['DISC'] = {
              profile: calculateDiscProfile(discMap)
            };
          }
        }

        const isCompleted = p.status === 'completed' || Object.keys(testScores).length > 0;

        return {
          id: p.id,
          name: p.user.name,
          username: p.user.username,
          status: isCompleted ? 'completed' : p.status,
          startTime: p.startTime,
          endTime: p.endTime,
          scores: testScores,
          recommendation: p.psychoResults?.status === 'RELEASED' ? p.psychoResults.recommendation : 'Dalam Penilaian',
        };
      })
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching client reports:', error);
    return NextResponse.json({ error: 'Gagal mengambil laporan hasil' }, { status: 500 });
  }
}
