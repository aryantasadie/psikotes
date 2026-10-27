import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['superadmin', 'tester', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Akses khusus penguji' }, { status: 403 });
    }

    const userId = parseInt((session.user as any).id, 10);
    let whereClause: any = {};
    let assignedTests: any[] = [];

    if (userRole === 'tester' || userRole === 'psikolog') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { assignedTestIds: true }
      });
      const assignedTestIdsStr = dbUser?.assignedTestIds;

      if (assignedTestIdsStr) {
        try {
          const testIds: number[] = JSON.parse(assignedTestIdsStr);
          if (Array.isArray(testIds) && testIds.length > 0) {
            whereClause.testId = { in: testIds };
            
            assignedTests = await prisma.test.findMany({
              where: { id: { in: testIds } },
              include: {
                jobPosition: true,
                client: {
                  select: { id: true, name: true, username: true, email: true, role: true }
                }
              },
              orderBy: { id: 'desc' }
            });
          } else {
            whereClause.testId = -1;
          }
        } catch (e) {
          console.error('Failed to parse assignedTestIds:', e);
          whereClause.testId = -1;
        }
      } else {
        whereClause.testId = -1;
      }
    } else {
      assignedTests = await prisma.test.findMany({
        include: {
          jobPosition: true,
          client: {
            select: { id: true, name: true, username: true, email: true, role: true }
          }
        },
        orderBy: { id: 'desc' }
      });
    }

    const [rawParticipants, fetchedTests] = await Promise.all([
      prisma.testParticipant.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          testId: true,
          status: true,
          plainPassword: true,
          startTime: true,
          endTime: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phone: true,
              role: true,
              status: true,
              createdAt: true
            }
          },
          psychoResults: {
            select: { id: true, status: true }
          },
          rawResults: {
            select: { testType: true }
          },
          answers: {
            select: { question: { select: { testType: true } } }
          }
        },
        orderBy: { id: 'desc' }
      }),
      assignedTests.length > 0 ? Promise.resolve(assignedTests) : prisma.test.findMany({
        select: {
          id: true,
          title: true,
          sequence: true,
          startDate: true,
          jobPosition: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, username: true, email: true, role: true } }
        },
        orderBy: { id: 'desc' }
      })
    ]);

    const testMap = new Map<number, any>();
    fetchedTests.forEach((t: any) => testMap.set(t.id, t));

    const participants = rawParticipants.map((p: any) => ({
      ...p,
      test: testMap.get(p.testId) || null,
      jobPosition: testMap.get(p.testId)?.jobPosition || null,
      logs: [],
      answers: p.answers || [],
      rawResults: p.rawResults || []
    }));

    return NextResponse.json({ participants, assignedTests: fetchedTests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
