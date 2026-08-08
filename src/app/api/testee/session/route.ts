import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'testee') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);

  const participant = await prisma.testParticipant.findFirst({
    where: { userId, status: { not: 'completed' } },
    include: { test: true },
    orderBy: { id: 'desc' }
  });

  if (!participant) {
    return NextResponse.json({ sequence: [] });
  }

  let sequence = [];
  try {
    sequence = JSON.parse(participant.test.sequence || '[]');
  } catch (e) {
    sequence = [];
  }

  return NextResponse.json({ 
    participantId: participant.id,
    sequence 
  });
}
