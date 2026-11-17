import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get('clientId');

    const whereClause: any = {};
    if (clientIdParam) {
      whereClause.clientId = parseInt(clientIdParam);
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      include: {
        jobPosition: true,
        client: {
          select: { id: true, name: true, username: true }
        },
        _count: {
          select: { participants: true }
        }
      }
    });
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, jobPositionId, sequence, clientId } = body;

    const test = await prisma.test.create({
      data: {
        title,
        jobPositionId: jobPositionId || null,
        clientId: clientId ? parseInt(clientId) : null,
        sequence: JSON.stringify(sequence),
        startDate: new Date(),
      },
      include: {
        jobPosition: true,
        client: { select: { id: true, name: true } }
      }
    });

    // DEMO PURPOSE: Automatically assign budi_kandidat to this new test
    const budi = await prisma.user.findUnique({ where: { username: 'budi_kandidat' } });
    if (budi) {
      await prisma.testParticipant.updateMany({
        where: { userId: budi.id },
        data: { status: 'completed' } // Mark old tests as completed
      });
      await prisma.testParticipant.create({
        data: {
          userId: budi.id,
          testId: test.id,
          status: 'pending'
        }
      });
    }

    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create Test Battery' }, { status: 500 });
  }
}
