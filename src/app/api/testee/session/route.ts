import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'testee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const { name } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    // Update user's name in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() }
    });

    return NextResponse.json({ success: true, name: updatedUser.name });
  } catch (error: any) {
    console.error('Error updating testee name:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
