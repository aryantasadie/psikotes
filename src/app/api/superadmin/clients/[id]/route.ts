import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['superadmin', 'tester', 'psikolog'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }

    const { id } = await context.params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'ID klien tidak valid' }, { status: 400 });
    }

    const [client, clientTests, clientJobPositions, generalPositions, psychographPresets, clientBatches, allClients] = await Promise.all([
      prisma.user.findUnique({
        where: { id: clientId, role: 'client' },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          license: true,
          testQuotas: true,
          usedQuotas: true,
          logoUrl: true,
          createdAt: true,
        }
      }),
      prisma.test.findMany({
        where: { clientId },
        orderBy: { id: 'desc' }
      }),
      prisma.jobPosition.findMany({
        where: { clientId },
        include: {
          psychographPreset: true,
          grayAreas: true,
          tests: {
            select: {
              client: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.jobPosition.findMany({
        where: { clientId: null },
        include: {
          psychographPreset: true,
          grayAreas: true,
          tests: {
            select: {
              client: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.psychographPreset.findMany({
        include: {
          jobPositions: { select: { id: true, name: true } },
          tests: {
            where: { participants: { some: {} } },
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.test.findMany({
        where: { clientId },
        include: {
          jobPosition: { select: { id: true, name: true } },
          participants: {
            select: {
              id: true,
              status: true,
              psychoResults: {
                select: { status: true, recommendation: true }
              }
            }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.user.findMany({
        where: { role: 'client' },
        select: { id: true, name: true, license: true }
      })
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    // Helper untuk memetakan nama klien mitra lain yang menggunakan / terhubung dengan standar jabatan
    const attachOtherClients = (posList: any[]) => {
      return posList.map(pos => {
        const otherNames = new Set<string>();

        // 1. Dari lisensi mitra lain
        allClients.forEach(c => {
          if (c.id === clientId) return;
          if (c.license) {
            try {
              const parsed = JSON.parse(c.license);
              if (Array.isArray(parsed.assignedJobPositionIds) && parsed.assignedJobPositionIds.includes(pos.id)) {
                if (c.name) otherNames.add(c.name);
              }
            } catch {}
          }
          if (pos.clientId === c.id && c.name) {
            otherNames.add(c.name);
          }
        });

        // 2. Dari riwayat batch tes mitra lain
        (pos.tests || []).forEach((t: any) => {
          if (t.client && t.client.id !== clientId && t.client.name) {
            otherNames.add(t.client.name);
          }
        });

        return {
          ...pos,
          otherAssignedClients: Array.from(otherNames)
        };
      });
    };

    // Helper untuk memetakan nama klien mitra lain yang menggunakan preset kompetensi / baterai tes
    const attachOtherClientsToPresets = (presetList: any[]) => {
      return presetList.map(preset => {
        const otherNames = new Set<string>();

        // 1. Dari lisensi mitra lain
        allClients.forEach(c => {
          if (c.id === clientId) return;
          if (c.license) {
            try {
              const parsed = JSON.parse(c.license);
              if (Array.isArray(parsed.assignedPresetIds) && parsed.assignedPresetIds.includes(preset.id)) {
                if (c.name) otherNames.add(c.name);
              }
            } catch {}
          }
        });

        // 2. Dari riwayat batch tes mitra lain
        (preset.tests || []).forEach((t: any) => {
          if (t.client && t.client.id !== clientId && t.client.name) {
            otherNames.add(t.client.name);
          }
        });

        return {
          ...preset,
          otherAssignedClients: Array.from(otherNames)
        };
      });
    };

    // Format Baterai Tes resmi klien
    let batteryTest: string[] = ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'];
    let batteryTitle = `Baterai Tes Resmi - ${client.name}`;
    let batteryRecordId: number | null = null;

    // Cari test resmi yang template (tanpa jobPositionId atau dibuat khusus)
    const officialTest = clientTests.find(t => t.jobPositionId === null) || clientTests[0];
    if (officialTest) {
      batteryRecordId = officialTest.id;
      batteryTitle = officialTest.title;
      try {
        const parsed = JSON.parse(officialTest.sequence || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          batteryTest = parsed;
        }
      } catch {}
    } else if (client.license) {
      try {
        const parsed = JSON.parse(client.license);
        if (Array.isArray(parsed.batteryTest) && parsed.batteryTest.length > 0) {
          batteryTest = parsed.batteryTest;
        }
      } catch {}
    }

    // Parse license
    let serviceScheme = 'SKEMA_2_SAAS';
    let picName = '';
    let assignedJobPositionIds: number[] = [];
    let assignedPresetIds: number[] = [];

    if (client.license) {
      try {
        const parsed = JSON.parse(client.license);
        if (typeof parsed === 'object' && parsed !== null) {
          serviceScheme = parsed.scheme || 'SKEMA_2_SAAS';
          picName = parsed.pic || '';
          if (Array.isArray(parsed.assignedJobPositionIds)) {
            assignedJobPositionIds = parsed.assignedJobPositionIds.map(Number).filter((id: number) => !isNaN(id) && id > 0);
          }
          if (Array.isArray(parsed.assignedPresetIds)) {
            assignedPresetIds = parsed.assignedPresetIds.map(Number).filter((id: number) => !isNaN(id) && id > 0);
          }
        }
      } catch {}
    }

    // Parse kuota
    let totalQuota = 0;
    let usedQuota = 0;

    if (client.testQuotas) {
      try {
        const q: any = JSON.parse(client.testQuotas);
        totalQuota = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
      } catch {
        totalQuota = Number(client.testQuotas) || 0;
      }
    }

    if (client.usedQuotas) {
      try {
        const u: any = JSON.parse(client.usedQuotas);
        usedQuota = u.total !== undefined ? Number(u.total) : (Object.values(u).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
      } catch {
        usedQuota = Number(client.usedQuotas) || 0;
      }
    }

    // Format batches
    let totalCandidates = 0;
    let completedCandidates = 0;
    const formattedBatches = clientBatches.map(t => {
      const pCount = t.participants.length;
      const cCount = t.participants.filter(p => p.status === 'completed').length;
      totalCandidates += pCount;
      completedCandidates += cCount;

      const isManaged = Boolean(t.jobPosition || t.participants.some(p => p.psychoResults?.status === 'RELEASED'));
      return {
        id: t.id,
        title: t.title,
        startDate: t.startDate ? t.startDate.toISOString() : null,
        jobPositionName: t.jobPosition?.name || t.specification || 'Tes Bebas (Tanpa Psikogram)',
        totalParticipants: pCount,
        completedParticipants: cCount,
        scheme: isManaged ? 'Skema 1 (Managed)' : 'Skema 2 (SaaS)',
        status: cCount === pCount && pCount > 0 ? 'completed' : 'in_progress'
      };
    });

    return NextResponse.json({
      client: {
        ...client,
        serviceScheme,
        picName,
        totalQuota,
        usedQuota,
        remainingQuota: Math.max(0, totalQuota - usedQuota),
        totalBatches: formattedBatches.length,
        totalCandidates,
        completedCandidates
      },
      batteryTest: {
        id: batteryRecordId,
        title: batteryTitle,
        sequence: batteryTest
      },
      positions: {
        clientCustom: attachOtherClients(clientJobPositions),
        general: attachOtherClients(generalPositions),
        assignedIds: assignedJobPositionIds
      },
      presets: {
        list: attachOtherClientsToPresets(psychographPresets),
        assignedIds: assignedPresetIds
      },
      batches: formattedBatches
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 });
  }
}
