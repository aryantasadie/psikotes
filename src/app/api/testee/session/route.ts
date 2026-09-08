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
    include: { 
      test: true,
      rawResults: { select: { testType: true } },
      answers: { select: { question: { select: { testType: true } } } }
    },
    orderBy: { id: 'desc' }
  });

  if (!participant) {
    return NextResponse.json({ sequence: [], completedTests: [] });
  }

  let sequence: string[] = [];
  try {
    sequence = JSON.parse(participant.test?.sequence || '[]');
  } catch (e) {
    sequence = [];
  }

  const completedTypesInDb = new Set<string>();
  (participant.rawResults || []).forEach(r => {
    if (r.testType) completedTypesInDb.add(r.testType.toUpperCase().replace(/[\s\-_]+/g, ''));
  });
  (participant.answers || []).forEach(a => {
    if (a.question?.testType) completedTypesInDb.add(a.question.testType.toUpperCase().replace(/[\s\-_]+/g, ''));
  });

  const completedTests: string[] = [];
  for (const testName of sequence) {
    const slug = testName.toUpperCase().replace(/[\s\-_]+/g, '');
    if (
      completedTypesInDb.has(slug) ||
      (slug.includes('KRAEPELIN') && (completedTypesInDb.has('KRAEPELIN') || completedTypesInDb.has('KREAPELIN'))) ||
      (slug.includes('POWER') && (completedTypesInDb.has('POWER') || completedTypesInDb.has('POWERLEADER'))) ||
      (slug.includes('PAPI') && (completedTypesInDb.has('PAPI') || completedTypesInDb.has('PAPIKOSTICK'))) ||
      (slug.includes('DISC') && completedTypesInDb.has('DISC')) ||
      (slug.includes('MSDT') && completedTypesInDb.has('MSDT')) ||
      (slug.includes('WPT') && completedTypesInDb.has('WPT'))
    ) {
      completedTests.push(testName);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });

  return NextResponse.json({ 
    participantId: participant.id,
    userName: user?.name || null,
    sequence,
    completedTests
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
