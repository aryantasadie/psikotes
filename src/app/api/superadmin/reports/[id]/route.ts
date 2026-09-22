import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole === 'testee' || userRole === 'user') {
      return NextResponse.json({ error: 'Forbidden: Akses ditolak' }, { status: 403 });
    }

    const params = await context.params;
    const participantId = parseInt(params.id);

    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        jobPosition: {
          include: { grayAreas: true, psychographPreset: true }
        },
        test: {
          include: { 
            jobPosition: {
              include: { grayAreas: true, psychographPreset: true }
            }
          }
        },
        rawResults: true,
        normResults: true,
        psychoResults: true,
        answers: {
          include: {
            question: true
          }
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Client authorization check
    if (userRole === 'client') {
      if (participant.test.clientId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Akses ditolak: Batch bukan milik akun Anda' }, { status: 403 });
      }
    }

    // Restrict tester and psikolog to their assigned batches
    if (userRole === 'tester' || userRole === 'psikolog') {
      const assignedTestIdsStr = (session.user as any).assignedTestIds;
      if (!assignedTestIdsStr) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak ditugaskan ke batch ini.' }, { status: 403 });
      }
      try {
        const testIds: number[] = JSON.parse(assignedTestIdsStr);
        if (!Array.isArray(testIds) || !testIds.includes(participant.testId)) {
          return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk batch ini.' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Akses ditolak: Gagal memvalidasi wewenang batch.' }, { status: 403 });
      }
    }

    return NextResponse.json(participant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['superadmin', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Hanya Superadmin dan Psikolog yang dapat menyimpan evaluasi.' }, { status: 403 });
    }

    const params = await context.params;
    const participantId = parseInt(params.id);

    if (userRole === 'psikolog') {
      const participant = await prisma.testParticipant.findUnique({
        where: { id: participantId },
        select: { testId: true }
      });
      if (!participant) {
        return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
      }
      const assignedTestIdsStr = (session.user as any).assignedTestIds;
      if (!assignedTestIdsStr) {
        return NextResponse.json({ error: 'Forbidden: Anda tidak ditugaskan ke batch ini.' }, { status: 403 });
      }
      try {
        const testIds: number[] = JSON.parse(assignedTestIdsStr);
        if (!Array.isArray(testIds) || !testIds.includes(participant.testId)) {
          return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses ke batch ini.' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Forbidden: Gagal memvalidasi wewenang batch.' }, { status: 403 });
      }
    }

    const body = await request.json();

    const {
      recommendation,
      tindakLanjut,
      status,
      dinamika,
      kelebihan,
      kelemahan,
      modifiedScores,
      jobPositionId
    } = body;

    // Check if psychoResults already exists
    const existing = await prisma.testResultPsychograph.findUnique({
      where: { participantId }
    });

    if (existing) {
      const updated = await prisma.testResultPsychograph.update({
        where: { participantId },
        data: {
          recommendation: recommendation || existing.recommendation,
          tindakLanjut: tindakLanjut || existing.tindakLanjut,
          status: status || existing.status,
          dinamika: dinamika ? JSON.stringify(dinamika) : existing.dinamika,
          kelebihan: kelebihan !== undefined ? kelebihan : existing.kelebihan,
          kelemahan: kelemahan !== undefined ? kelemahan : existing.kelemahan,
          modifiedScores: modifiedScores ? JSON.stringify(modifiedScores) : existing.modifiedScores
        }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.testResultPsychograph.create({
        data: {
          participantId,
          jobPositionId: parseInt(jobPositionId),
          recommendation: recommendation || 'DIPERTIMBANGKAN',
          tindakLanjut: tindakLanjut || null,
          status: status || 'DRAFT',
          dinamika: dinamika ? JSON.stringify(dinamika) : null,
          kelebihan: kelebihan || null,
          kelemahan: kelemahan || null,
          modifiedScores: modifiedScores ? JSON.stringify(modifiedScores) : null
        }
      });
      return NextResponse.json(created);
    }
  } catch (error: any) {
    console.error("PUT PsychoResults Error:", error);
    return NextResponse.json({ error: 'Failed to update psychograph evaluation' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin yang boleh menghapus laporan' }, { status: 403 });
    }

    const params = await context.params;
    const participantId = parseInt(params.id);
    
    // Check if participant exists
    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Use atomic transaction for deleting participant and related data
    await prisma.$transaction([
      prisma.answer.deleteMany({ where: { participantId } }),
      prisma.testResultRaw.deleteMany({ where: { participantId } }),
      prisma.testResultPsychograph.deleteMany({ where: { participantId } }),
      prisma.testResultNormalized.deleteMany({ where: { participantId } }),
      prisma.securityLog.deleteMany({ where: { participantId } }),
      prisma.testParticipant.delete({ where: { id: participantId } })
    ]);

    return NextResponse.json({ success: true, message: 'Participant deleted successfully' });
  } catch (error: any) {
    console.error("Delete Participant Error:", error);
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 });
  }
}
