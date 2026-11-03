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
    const positionId = parseInt(id);

    // Keamanan Data: Periksa apakah masih ada data aktif yang terhubung ke standar jabatan ini
    const [testCount, participantCount, psychoCount] = await Promise.all([
      prisma.test.count({ where: { jobPositionId: positionId } }),
      prisma.testParticipant.count({ where: { jobPositionId: positionId } }),
      prisma.testResultPsychograph.count({ where: { jobPositionId: positionId } })
    ]);

    if (testCount > 0 || participantCount > 0 || psychoCount > 0) {
      const reasons: string[] = [];
      if (testCount > 0) reasons.push(`${testCount} batch tes`);
      if (participantCount > 0) reasons.push(`${participantCount} peserta`);
      if (psychoCount > 0) reasons.push(`${psychoCount} laporan psikogram`);

      return NextResponse.json({ 
        error: `Tidak dapat menghapus: Standar jabatan ini masih terhubung dengan ${reasons.join(', ')}. Kosongkan atau hapus data terkait terlebih dahulu demi keamanan data.` 
      }, { status: 400 });
    }

    // Jika sudah kosong/bersih dari relasi data peserta, aman untuk dihapus
    await prisma.psychographGrayArea.deleteMany({
      where: { jobPositionId: positionId }
    });

    await prisma.jobPosition.delete({
      where: { id: positionId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job position:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
