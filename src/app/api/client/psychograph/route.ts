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
        },
        tests: {
          select: { id: true, sequence: true },
          orderBy: { id: 'desc' }
        }
      },
      orderBy: { id: 'desc' }
    });

    const formattedPresets = presets.map(p => {
      let sequenceArr: string[] = [];
      const testWithSeq = p.tests.find(t => t.sequence && t.sequence.length > 2);
      if (testWithSeq?.sequence) {
        try {
          const parsed = JSON.parse(testWithSeq.sequence);
          if (Array.isArray(parsed) && parsed.length > 0) {
            sequenceArr = parsed;
          }
        } catch {}
      }

      return {
        id: p.id,
        name: p.name,
        mapping: p.mapping,
        createdAt: p.createdAt,
        jobPositions: p.jobPositions,
        sequence: sequenceArr,
      };
    });

    return NextResponse.json(formattedPresets);
  } catch (error) {
    console.error('Error fetching client psychograph presets:', error);
    return NextResponse.json({ error: 'Gagal mengambil data template kompetensi' }, { status: 500 });
  }
}
