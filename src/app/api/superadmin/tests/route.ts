import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tests = await prisma.test.findMany({
      orderBy: { id: 'desc' },
      include: {
        jobPosition: true,
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
    const { title, jobPositionId, sequence } = body;

    const test = await prisma.test.create({
      data: {
        title,
        jobPositionId: jobPositionId || null,
        sequence: JSON.stringify(sequence),
        startDate: new Date(),
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
