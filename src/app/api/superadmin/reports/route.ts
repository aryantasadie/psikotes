import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let whereClause: any = {};
    let assignedTests: any[] = [];

    if (session?.user) {
      const userRole = (session.user as any).role;
      const userId = parseInt((session.user as any).id);

      if (userRole === 'tester' || userRole === 'psikolog') {
        // Fetch fresh assignedTestIds from database to bypass NextAuth token caching
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
              
              // Fetch details of tests assigned to this tester/psychologist
              assignedTests = await prisma.test.findMany({
                where: { id: { in: testIds } },
                include: {
                  jobPosition: true,
                  client: true
                },
                orderBy: { id: 'desc' }
              });
            } else {
              whereClause.testId = -1; // Block access to everything
            }
          } catch (e) {
            console.error('Failed to parse assignedTestIds:', e);
            whereClause.testId = -1; // Block access on parse failure
          }
        } else {
          whereClause.testId = -1; // Block access if no test IDs are assigned
        }
      } else {
        // Superadmin gets all tests
        assignedTests = await prisma.test.findMany({
          include: {
            jobPosition: true,
            client: true
          },
          orderBy: { id: 'desc' }
        });
      }
    }

    const participants = await prisma.testParticipant.findMany({
      where: whereClause,
      include: {
        user: true,
        jobPosition: true,
        psychoResults: true,
        logs: true,
        test: {
          include: {
            jobPosition: true,
            client: true
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
