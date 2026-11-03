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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (query.length < 2) {
      return NextResponse.json({ participants: [] });
    }

    const userId = parseInt((session.user as any).id, 10);
    const whereClause: any = {
      OR: [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { username: { contains: query, mode: 'insensitive' } } }
      ]
    };

    // Restrict tester and psikolog to their assigned batches
    if (userRole === 'tester' || userRole === 'psikolog') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { assignedTestIds: true }
      });
      const assignedTestIdsStr = dbUser?.assignedTestIds;

      if (!assignedTestIdsStr) {
        return NextResponse.json({ participants: [] });
      }

      try {
        const testIds: number[] = JSON.parse(assignedTestIdsStr);
        if (!Array.isArray(testIds) || testIds.length === 0) {
          return NextResponse.json({ participants: [] });
        }
        whereClause.testId = { in: testIds };
      } catch (e) {
        return NextResponse.json({ participants: [] });
      }
    }

    const participants = await prisma.testParticipant.findMany({
      where: whereClause,
      take: 25,
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        testId: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        jobPosition: {
          select: {
            id: true,
            name: true,
          }
        },
        test: {
          select: {
            id: true,
            title: true,
            startDate: true,
            sequence: true,
            client: {
              select: {
                id: true,
                name: true,
              }
            },
            jobPosition: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        psychoResults: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ participants });
  } catch (error: any) {
    console.error('Error searching participants:', error);
    return NextResponse.json({ error: error.message || 'Gagal mencari peserta' }, { status: 500 });
  }
}
