import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Number((session.user as any).id);

    // Ambil data saldo klien saat ini
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        quotaPackage: true,
        quotaSingle: true,
        quotaExpiredAt: true,
        testQuotas: true,
        usedQuotas: true,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    let quotaPackage = client.quotaPackage ?? 0;
    let quotaSingle = client.quotaSingle ?? 0;

    // Migrasi on the fly jika saldo baru masih 0
    if (quotaPackage === 0 && quotaSingle === 0 && client.testQuotas) {
      try {
        const q: any = JSON.parse(client.testQuotas);
        const totalQ = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
        let totalU = 0;
        if (client.usedQuotas) {
          const u: any = JSON.parse(client.usedQuotas);
          totalU = u.total !== undefined ? Number(u.total) : 0;
        }
        quotaPackage = Math.max(0, totalQ - totalU);
      } catch {}
    }

    // Ambil buku besar mutasi (Ledger)
    const ledgers = await prisma.quotaLedger.findMany({
      where: { clientId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            specification: true,
            startDate: true,
            participants: {
              where: {
                status: { in: ['in_progress', 'completed'] }
              },
              select: {
                id: true,
                status: true,
                startTime: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // 100 mutasi terakhir
    });

    return NextResponse.json({
      wallet: {
        quotaPackage,
        quotaSingle,
        quotaExpiredAt: client.quotaExpiredAt,
      },
      ledgers: ledgers.map(l => ({
        id: l.id,
        quotaType: l.quotaType,
        transactionType: l.transactionType,
        amount: l.amount,
        balanceAfter: l.balanceAfter,
        referenceDoc: l.referenceDoc,
        notes: l.notes,
        createdAt: l.createdAt,
        testId: l.testId,
        testTitle: l.test?.title || null,
        testSpec: l.test?.specification || null,
        consumedCandidatesCount: l.test?.participants?.length || 0,
        consumedCandidates: l.test?.participants?.map(p => ({
          participantId: p.id,
          name: p.user?.name || '-',
          username: p.user?.username || '-',
          status: p.status,
          startTime: p.startTime,
        })) || []
      }))
    });
  } catch (error: any) {
    console.error('Error fetching client quota ledger:', error);
    return NextResponse.json({ error: 'Gagal mengambil data buku mutasi kuota.' }, { status: 500 });
  }
}
