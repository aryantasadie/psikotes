import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['superadmin', 'tester', 'psikolog'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = await context.params;
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'ID klien tidak valid.' }, { status: 400 });
    }

    const ledgers = await prisma.quotaLedger.findMany({
      where: { clientId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            specification: true,
            startDate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ ledgers });
  } catch (error: any) {
    console.error('Error fetching client ledger:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat mutasi kuota.' }, { status: 500 });
  }
}
