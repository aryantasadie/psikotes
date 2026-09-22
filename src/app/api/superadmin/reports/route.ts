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

    const participants = await prisma.testParticipant.findMany({
      where: whereClause,
      include: {
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
        jobPosition: true,
        psychoResults: true,
        logs: true,
        test: {
          include: {
            jobPosition: true,
            client: {
              select: { id: true, name: true, username: true, email: true, role: true }
            }
          }
        },
        rawResults: true,
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return NextResponse.json({ participants, assignedTests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
