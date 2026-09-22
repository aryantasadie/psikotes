import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { updateStreamSession } from '@/lib/streamStore';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const { participantId, name, username, testTitle, cameraFrame, screenFrame, violationCount, latestViolationReason } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: 'Missing participant ID' }, { status: 400 });
    }

    const pId = typeof participantId === 'number' ? participantId : parseInt(participantId, 10);
    if (isNaN(pId)) {
      return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const userRole = (session.user as any).role;

    // Validate ownership for testees
    if (userRole === 'testee' || userRole === 'user') {
      const participant = await prisma.testParticipant.findFirst({
        where: { id: pId, userId }
      });
      if (!participant) {
        return NextResponse.json({ error: 'Forbidden: ID Peserta tidak valid untuk sesi Anda' }, { status: 403 });
      }
    }

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
