import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const testId = parseInt(id);

    if (isNaN(testId)) {
      return NextResponse.json({ error: 'ID Batch tidak valid' }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        jobPosition: true,
        client: true
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    const participants = await prisma.testParticipant.findMany({
      where: { testId },
      include: {
        user: true,
        jobPosition: true,
        psychoResults: true
      },
      orderBy: { id: 'asc' }
    });

    return NextResponse.json({
      test,
      participants
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat batch' }, { status: 500 });
  }
}
