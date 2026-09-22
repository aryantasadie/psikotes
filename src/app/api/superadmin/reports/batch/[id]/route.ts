import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['superadmin', 'tester', 'psikolog', 'client'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const testId = parseInt(id);

    if (isNaN(testId)) {
      return NextResponse.json({ error: 'ID Batch tidak valid' }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        jobPosition: true,
        client: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    // Role-based authorization
    if (userRole === 'client') {
      if (test.clientId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses ke batch ini' }, { status: 403 });
      }
    }

    if (userRole === 'tester' || userRole === 'psikolog') {
      const assignedTestIdsStr = (session.user as any).assignedTestIds;
      if (!assignedTestIdsStr) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak ditugaskan ke batch ini.' }, { status: 403 });
      }
      try {
        const testIds: number[] = JSON.parse(assignedTestIdsStr);
        if (!Array.isArray(testIds) || !testIds.includes(testId)) {
          return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk batch ini.' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Akses ditolak: Gagal memvalidasi wewenang batch.' }, { status: 403 });
      }
    }

    const participants = await prisma.testParticipant.findMany({
      where: { testId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true
          }
        },
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
