import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const userRole = (session.user as any).role;

    // Build filter: If role is client, strictly filter tests owned by this client
    let whereClause: any = {};
    if (userRole === 'client') {
      whereClause = {
        test: {
          clientId: userId
        }
      };
    }

    const [participants, clientTests] = await Promise.all([
      prisma.testParticipant.findMany({
        where: whereClause,
        include: {
          user: true,
          test: {
            include: { jobPosition: true }
          },
          rawResults: true,
          psychoResults: true
        },
        orderBy: {
          startTime: 'desc'
        }
      }),
      prisma.test.findMany({
        where: userRole === 'client' ? { clientId: userId } : {},
        include: {
          jobPosition: true,
          _count: {
            select: { participants: true }
          }
        },
        orderBy: { id: 'desc' }
      })
    ]);

    return NextResponse.json({
      participants,
      tests: clientTests,
      clientName: session.user.name || session.user.email
    });
  } catch (error: any) {
    console.error('Error fetching client reports:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data laporan klien' }, { status: 500 });
  }
}
