import { NextResponse } from 'next/server';
import { getAllActiveStreams } from '@/lib/streamStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeStreams = getAllActiveStreams(25000);
    return NextResponse.json({
      streams: activeStreams,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}
