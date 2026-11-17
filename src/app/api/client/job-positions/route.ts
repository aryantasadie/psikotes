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
          assignedIds = parsed.assignedJobPositionIds.map(Number).filter((id: number) => !isNaN(id) && id > 0);
        }
      } catch {}
    }

    // Ambil formasi jabatan yang HANYA diizinkan / dicentang oleh superadmin untuk mitra ini:
    // 1. Yang khusus dibuat untuk client ini (clientId === clientId)
    // 2. Yang ID-nya dicentang aktif di Tab 2 (assignedIds)
    const orConditions: any[] = [
      { clientId: clientId }
    ];

    if (assignedIds.length > 0) {
      orConditions.push({ id: { in: assignedIds } });
    }

    const jobPositions = await prisma.jobPosition.findMany({
      where: {
        OR: orConditions
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
