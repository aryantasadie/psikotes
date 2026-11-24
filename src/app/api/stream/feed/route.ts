import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getAllActiveStreams } from '@/lib/streamStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !['superadmin', 'tester', 'psikolog', 'client'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus pengawas ujian' }, { status: 401 });
    }

    const activeStreams = getAllActiveStreams(25000);
    let filteredStreams = activeStreams;

    // Filter per perusahaan jika login sebagai mitra/client
    if (userRole === 'client') {
      const clientId = parseInt((session.user as any).id, 10);
      const clientBatches = await prisma.test.findMany({
        where: { clientId },
        select: { id: true, title: true }
      });
      const allowedTitles = new Set(clientBatches.map(b => b.title));
      filteredStreams = activeStreams.filter(s => s.testTitle && allowedTitles.has(s.testTitle));
    }

    return NextResponse.json({
      streams: filteredStreams,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}
