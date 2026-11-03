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
    const preset = await prisma.psychographPreset.findUnique({
      where: { id: parseInt(id) },
      include: { tests: true }
    });
    
    if (!preset) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    const responseData = {
      ...preset,
      testSequence: preset.tests && preset.tests.length > 0 ? preset.tests[0].sequence : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching psychograph preset:', error);
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
    const { name, mapping, sequence } = body;

    const updated = await prisma.psychographPreset.update({
      where: { id: parseInt(id) },
      data: {
        name,
        mapping: JSON.stringify(mapping)
      }
    });

    await prisma.test.updateMany({
      where: { psychographPresetId: updated.id },
      data: {
        title: name,
        sequence: JSON.stringify(sequence || [])
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating psychograph preset:', error);
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
    const presetId = parseInt(id);

    // Keamanan: Cek apakah template kompetensi masih terhubung dengan standar jabatan atau batch ujian
    const connectedPositions = await prisma.jobPosition.findMany({
      where: { psychographPresetId: presetId },
      select: { id: true, name: true }
    });

    // Cek batch ujian aktif yang menggunakan preset ini
    const connectedBatches = await prisma.test.findMany({
      where: { 
        psychographPresetId: presetId,
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

    if (connectedPositions.length > 0 || connectedBatches.length > 0) {
      return NextResponse.json({
        error: `Template kompetensi tidak dapat dihapus karena masih digunakan oleh ${connectedPositions.length} standar jabatan dan ${connectedBatches.length} batch ujian.`,
        code: 'HAS_CONNECTED_DATA',
        connectedPositions: connectedPositions.map(p => ({ id: p.id, name: p.name })),
        connectedBatches: connectedBatches.map(b => ({
          id: b.id,
          title: b.title,
          clientName: b.client?.name || 'Umum / Semua Klien',
          participantCount: b._count.participants,
          startDate: b.startDate
        }))
      }, { status: 400 });
    }

    // Bersihkan batch dummy shell (tanpa peserta) yang dibuat otomatis saat preset dibuat
    await prisma.test.deleteMany({
      where: {
        psychographPresetId: presetId,
        participants: { none: {} }
      }
    });

    await prisma.psychographPreset.delete({
      where: { id: presetId }
    });
    return NextResponse.json({ success: true, message: 'Template kompetensi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting psychograph preset:', error);
    return NextResponse.json({ error: 'Gagal menghapus template kompetensi' }, { status: 500 });
  }
}
