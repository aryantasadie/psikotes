import { NextResponse } from 'next/server';
import { updateStreamSession } from '@/lib/streamStore';

export async function POST(req: Request) {
  try {
    const { participantId, name, username, testTitle, cameraFrame, screenFrame, violationCount, latestViolationReason } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: 'Missing participant ID' }, { status: 400 });
    }

    const pId = typeof participantId === 'number' ? participantId : parseInt(participantId, 10);

    updateStreamSession({
      participantId: pId,
      name: name || `Participant ${pId}`,
      username: username || `user_${pId}`,
      testTitle: testTitle || 'Psikotes Ujian',
      cameraFrameUrl: cameraFrame || null,
      screenFrameUrl: screenFrame || null,
      lastActive: Date.now(),
      violationCount: violationCount || 0,
      latestViolationReason: latestViolationReason || undefined
    });

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error('Error broadcasting live stream:', error);
    return NextResponse.json({ error: 'Failed to broadcast stream' }, { status: 500 });
  }
}
