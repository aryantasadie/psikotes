import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['superadmin', 'tester', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt((session.user as any).id, 10);
    let whereClause: any = {};

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
          } else {
            whereClause.testId = -1;
          }
        } catch (e) {
          whereClause.testId = -1;
        }
      } else {
        whereClause.testId = -1;
      }
    }

    const assignedTestsWhere: any = {};
    if (whereClause.testId) {
      assignedTestsWhere.id = whereClause.testId;
    }

    const [assignedTests, participants] = await Promise.all([
      prisma.test.findMany({
        where: assignedTestsWhere,
        include: {
          jobPosition: true,
          client: {
            select: { id: true, name: true, username: true, email: true, role: true }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.testParticipant.findMany({
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
          logs: {
            orderBy: { createdAt: 'desc' }
          },
          test: {
            include: {
              jobPosition: true,
              client: {
                select: { id: true, name: true, username: true, email: true, role: true }
              }
            }
          }
        },
        orderBy: { id: 'desc' }
      })
    ]);

    return NextResponse.json({ participants, assignedTests });
  } catch (error: any) {
    console.error('Error in /api/superadmin/proctor:', error);
    return NextResponse.json({ error: 'Gagal mengambil data proctor' }, { status: 500 });
  }
}
