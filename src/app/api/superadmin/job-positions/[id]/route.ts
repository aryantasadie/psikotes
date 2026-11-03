import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: parseInt(id) },
      include: {
        psychographPreset: true,
        grayAreas: true
      }
    });
    
    if (!jobPosition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(jobPosition);
  } catch (error) {
    console.error('Error fetching job position:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    const { name, description, psychographPresetId, grayAreas } = body;

    await prisma.psychographGrayArea.deleteMany({
      where: { jobPositionId: parseInt(id) }
    });

    const updated = await prisma.jobPosition.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        psychographPresetId: parseInt(psychographPresetId),
        grayAreas: {
          create: (grayAreas || []).map((ga: any) => ({
            parameter: ga.parameter,
            targetScore: ga.targetScore
          }))
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating job position:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const jobPositionId = parseInt(id);

    // Keamanan: Cek apakah standar psikogram jabatan masih terhubung dengan batch ujian aktif (ada peserta)
    const connectedBatches = await prisma.test.findMany({
      where: { 
        jobPositionId,
        participants: { some: {} }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        client: { select: { name: true } },
        _count: { select: { participants: true } }
      }
    });

    const connectedParticipantsCount = await prisma.testParticipant.count({
      where: { jobPositionId }
    });

    if (connectedBatches.length > 0 || connectedParticipantsCount > 0) {
      return NextResponse.json({
        error: `Standar jabatan tidak dapat dihapus karena masih digunakan oleh ${connectedBatches.length} batch ujian (${connectedParticipantsCount} peserta).`,
        code: 'HAS_CONNECTED_DATA',
        connectedBatches: connectedBatches.map(b => ({
          id: b.id,
          title: b.title,
          clientName: b.client?.name || 'Umum / Semua Klien',
          participantCount: b._count.participants,
          startDate: b.startDate
        })),
        totalParticipants: connectedParticipantsCount
      }, { status: 400 });
    }

    // Bersihkan batch dummy shell (tanpa peserta) jika ada yang mengaitkan job position ini
    await prisma.test.deleteMany({
      where: {
        jobPositionId,
        participants: { none: {} }
      }
    });

    await prisma.psychographGrayArea.deleteMany({
      where: { jobPositionId }
    });

    await prisma.jobPosition.delete({
      where: { id: jobPositionId }
    });
    return NextResponse.json({ success: true, message: 'Standar psikogram jabatan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting job position:', error);
    return NextResponse.json({ error: 'Gagal menghapus standar jabatan' }, { status: 500 });
  }
}
