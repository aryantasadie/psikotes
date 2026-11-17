import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['client', 'superadmin'].includes((session.user as any)?.role)) {
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
        jobPosition: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        participants: {
          select: {
            id: true,
            status: true,
            psychoResults: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    let totalProjects = tests.length;
    let completedProjects = 0;
    let totalParticipants = 0;
    let completedParticipants = 0;
    let completedReports = 0;

    const batchesSummary = tests.map(t => {
      const pCount = t.participants.length;
      const cCount = t.participants.filter(p => p.status === 'completed').length;
      const rCount = t.participants.filter(p => p.psychoResults !== null && p.psychoResults !== undefined).length;

      totalParticipants += pCount;
      completedParticipants += cCount;
      completedReports += rCount;

      const isCompleted = pCount > 0 && cCount >= pCount;
      if (isCompleted) {
        completedProjects++;
      }

      let testToolsArr: string[] = [];
      if (t.sequence) {
        try { testToolsArr = JSON.parse(t.sequence); } catch {}
      }

      return {
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        jobPositionName: t.jobPosition?.name || 'Umum / Internal',
        clientName: client.name || 'Umum / Internal',
        testTools: testToolsArr,
        totalParticipants: pCount,
        completedParticipants: cCount,
        completedReports: rCount,
        isCompleted,
      };
    });

    const ongoingProjects = totalProjects - completedProjects;
    const pendingParticipants = Math.max(0, totalParticipants - completedParticipants);
    const pendingReports = Math.max(0, totalParticipants - completedReports);

    // Hitung total saldo kuota
    let quotas: Record<string, number> = {};
    let used: Record<string, number> = {};
    let totalQuotaCount = 0;
    let totalUsedCount = 0;

    if (client.testQuotas) {
      try {
        quotas = JSON.parse(client.testQuotas);
        totalQuotaCount = Object.values(quotas).reduce((a, b) => a + Number(b || 0), 0);
      } catch {}
    }
    if (client.usedQuotas) {
      try {
        used = JSON.parse(client.usedQuotas);
        totalUsedCount = Object.values(used).reduce((a, b) => a + Number(b || 0), 0);
      } catch {}
    }
    const remainingQuota = Math.max(0, totalQuotaCount - totalUsedCount);

    // Sort batches: terdekat / mendatang lebih dulu (seperti Superadmin)
    const sortedBatches = [...batchesSummary].sort((a, b) => {
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return timeA - timeB;
    });

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
        totalQuota: totalQuotaCount,
        usedQuota: totalUsedCount,
        remainingQuota,
      },
      stats: {
        totalProjects,
        ongoingProjects,
        completedProjects,
        totalParticipants,
        completedParticipants,
        pendingParticipants,
        completedReports,
        pendingReports,
        quota: remainingQuota,
      },
      batches: sortedBatches,
    });
  } catch (error: any) {
    console.error('Error in client dashboard API:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dashboard klien' }, { status: 500 });
  }
}
