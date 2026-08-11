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

    // Retrieve schedules (tests) for this client
    const tests = await prisma.test.findMany({
      where: userRole === 'client' ? { clientId: userId } : {},
      include: {
        jobPosition: true,
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ success: true, tests });
  } catch (error: any) {
    console.error('Error fetching client schedules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
