import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        where: { role: { in: ['tester', 'psikolog'] } },
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
