import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const userRole = (session.user as any).role;

    if (userRole !== 'client' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find security logs of participants in tests owned by this client
    const logs = await prisma.securityLog.findMany({
      where: userRole === 'client' ? {
        participant: {
          test: {
            clientId: userId
          }
        }
      } : {},
      include: {
        participant: {
          include: {
            user: true,
            test: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: 200
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error fetching client token logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
