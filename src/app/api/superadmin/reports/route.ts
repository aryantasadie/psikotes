import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let whereClause: any = {};

    if (session?.user) {
      const userRole = (session.user as any).role;
      const assignedTestIdsStr = (session.user as any).assignedTestIds;

      // If tester/admin has specific assigned Batch IDs, restrict results to those batches
      if ((userRole === 'tester' || userRole === 'psikolog') && assignedTestIdsStr) {
        try {
          const testIds: number[] = JSON.parse(assignedTestIdsStr);
          if (Array.isArray(testIds) && testIds.length > 0) {
            whereClause.testId = { in: testIds };
          }
        } catch (e) {
          console.error('Failed to parse assignedTestIds:', e);
        }
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

    return NextResponse.json(participants);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
