import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAllActiveStreams } from '@/lib/streamStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !['superadmin', 'tester', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus pengawas ujian' }, { status: 401 });
    }

    const activeStreams = getAllActiveStreams(25000);
    return NextResponse.json({
      streams: activeStreams,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}
