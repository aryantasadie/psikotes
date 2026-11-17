import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['client', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clientId = Number((session.user as any).id);

    // Cek assignedPresetIds dari user license
    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, license: true }
    });

    let assignedPresetIds: number[] = [];
    if (clientUser?.license) {
      try {
        const parsed = JSON.parse(clientUser.license);
        if (Array.isArray(parsed.assignedPresetIds)) {
          assignedPresetIds = parsed.assignedPresetIds.map(Number).filter(Boolean);
        }
      } catch {}
    }

    // Ambil presets:
    // Jika ada assignedPresetIds, ambil yang di-assign ATAU yang umum. Jika kosong, ambil semua preset yang tersedia.
    let whereClause: any = {};
    if (assignedPresetIds.length > 0) {
      whereClause = {
        id: { in: assignedPresetIds }
      };
    }

    const presets = await prisma.psychographPreset.findMany({
      where: whereClause,
      include: {
        jobPositions: {
          select: { id: true, name: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(presets);
  } catch (error) {
    console.error('Error fetching client psychograph presets:', error);
    return NextResponse.json({ error: 'Gagal mengambil data template kompetensi' }, { status: 500 });
  }
}
