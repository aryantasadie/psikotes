import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'client') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Portal Klien' }, { status: 401 });
    }

    const clientId = Number((session.user as any).id);

    // Fetch client profile including quotas
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        testQuotas: true,
        usedQuotas: true,
        logoUrl: true,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Akun klien tidak ditemukan' }, { status: 404 });
    }

    // Fetch tests owned by this client
    const tests = await prisma.test.findMany({
      where: { clientId },
      include: {
        jobPosition: { select: { name: true } },
        participants: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    let totalBatches = tests.length;
    let totalParticipants = 0;
    let completedParticipants = 0;

    const batchesSummary = tests.map(t => {
      const pCount = t.participants.length;
      const cCount = t.participants.filter(p => p.status === 'completed').length;
      totalParticipants += pCount;
      completedParticipants += cCount;

      let testToolsArr: string[] = [];
      if (t.sequence) {
        try { testToolsArr = JSON.parse(t.sequence); } catch {}
      }

      return {
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        jobPositionName: t.jobPosition?.name || 'Umum',
        testTools: testToolsArr,
        totalParticipants: pCount,
        completedParticipants: cCount,
      };
    });

    let quotas: Record<string, number> = {};
    let used: Record<string, number> = {};

    if (client.testQuotas) {
      try { quotas = JSON.parse(client.testQuotas); } catch {}
    }
    if (client.usedQuotas) {
      try { used = JSON.parse(client.usedQuotas); } catch {}
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        username: client.username,
        email: client.email,
        phone: client.phone,
        logoUrl: client.logoUrl,
        quotas,
        usedQuotas: used,
      },
      stats: {
        totalBatches,
        totalParticipants,
        completedParticipants,
      },
      recentBatches: batchesSummary.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Error in client dashboard API:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dashboard klien' }, { status: 500 });
  }
}
