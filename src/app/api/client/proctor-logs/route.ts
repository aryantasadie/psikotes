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
    if (!['client', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientId = parseInt((session.user as any).id, 10);

    const [assignedTests, participants] = await Promise.all([
      prisma.test.findMany({
        where: { clientId },
        include: {
          jobPosition: true,
          client: {
            select: { id: true, name: true }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.testParticipant.findMany({
        where: {
          test: { clientId }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            }
          },
          test: {
            select: {
              id: true,
              title: true,
              sequence: true,
              startDate: true,
              client: { select: { id: true, name: true } },
              jobPosition: { select: { name: true } }
            }
          },
          logs: {
            select: {
              id: true,
              logType: true,
              mediaUrl: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { id: 'desc' }
      })
    ]);

    return NextResponse.json({
      assignedTests,
      participants
    });
  } catch (error) {
    console.error('Error fetching client proctor logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
