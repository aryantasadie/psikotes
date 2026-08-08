import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const [jobPositions, clients, testers] = await Promise.all([
      prisma.jobPosition.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.user.findMany({
        where: { role: 'client' },
        select: { id: true, name: true, username: true, email: true },
        orderBy: { name: 'asc' }
      }),
      prisma.user.findMany({
        where: { role: { in: ['admin', 'admin_tester', 'psikolog'] } },
        select: { id: true, name: true, username: true, role: true },
        orderBy: { name: 'asc' }
      })
    ]);

    return NextResponse.json({ jobPositions, clients, testers });
  } catch (error: any) {
    console.error('Error fetching schedule options:', error);
    return NextResponse.json({ error: 'Gagal mengambil data opsi penjadwalan' }, { status: 500 });
  }
}
