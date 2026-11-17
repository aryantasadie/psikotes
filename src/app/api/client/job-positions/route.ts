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

    // Dapatkan data klien untuk cek assignedJobPositionIds di license
    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, license: true }
    });

    let assignedIds: number[] = [];
    if (clientUser?.license) {
      try {
        const parsed = JSON.parse(clientUser.license);
        if (Array.isArray(parsed.assignedJobPositionIds)) {
          assignedIds = parsed.assignedJobPositionIds.map(Number).filter(Boolean);
        }
      } catch {}
    }

    // Ambil formasi jabatan yang relevan untuk klien ini:
    // 1. Yang khusus dibuat untuk client ini (clientId === clientId)
    // 2. Yang di-assign ke client ini (assignedIds)
    // 3. Yang umum / template standar (clientId === null)
    const jobPositions = await prisma.jobPosition.findMany({
      where: {
        OR: [
          { clientId: clientId },
          ...(assignedIds.length > 0 ? [{ id: { in: assignedIds } }] : []),
          { clientId: null }
        ]
      },
      include: {
        psychographPreset: true,
        grayAreas: true,
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(jobPositions);
  } catch (error) {
    console.error('Error fetching client job positions:', error);
    return NextResponse.json({ error: 'Gagal mengambil data formasi jabatan' }, { status: 500 });
  }
}
