import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { updateStreamSession } from '@/lib/streamStore';

// In-memory cache (30s TTL) so live frame broadcasts don't query PostgreSQL on every frame
const ownershipCache = new Map<string, { valid: boolean; status: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const { 
      participantId, 
      name, 
      username, 
      testTitle, 
      cameraFrame, 
      screenFrame, 
      violationCount, 
      latestViolationReason,
      currentTestName,
      timerRemaining,
      completedTests,
      status,
      isPaused
    } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: 'Missing participant ID' }, { status: 400 });
    }

    const pId = typeof participantId === 'number' ? participantId : parseInt(participantId, 10);
    if (isNaN(pId)) {
      return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const userRole = (session.user as any).role;

    let finalStatus = status;
    let finalIsPaused = isPaused;

    // Validate ownership for testees & check authoritative DB status (cached for 30s in RAM)
    if (userRole === 'testee' || userRole === 'user') {
      const cacheKey = `${pId}:${userId}`;
      const now = Date.now();
      const cached = ownershipCache.get(cacheKey);

      if (cached && cached.expiresAt > now) {
        if (!cached.valid) {
          return NextResponse.json({ error: 'Forbidden: ID Peserta tidak valid untuk sesi Anda' }, { status: 403 });
        }
        if (cached.status === 'stopped') {
          finalStatus = 'stopped';
          finalIsPaused = false;
        }
      } else {
        const participant = await prisma.testParticipant.findFirst({
          where: { id: pId, userId },
          select: { id: true, status: true }
        });
        if (!participant) {
          ownershipCache.set(cacheKey, { valid: false, status: 'invalid', expiresAt: now + 10000 });
          return NextResponse.json({ error: 'Forbidden: ID Peserta tidak valid untuk sesi Anda' }, { status: 403 });
        }
        ownershipCache.set(cacheKey, { valid: true, status: participant.status, expiresAt: now + 30000 });
        if (participant.status === 'stopped') {
          finalStatus = 'stopped';
          finalIsPaused = false;
        }
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
      latestViolationReason: latestViolationReason || undefined,
      currentTestName: currentTestName || undefined,
      timerRemaining: timerRemaining !== undefined ? timerRemaining : undefined,
      completedTests: Array.isArray(completedTests) ? completedTests : undefined,
      status: finalStatus || undefined,
      isPaused: finalIsPaused !== undefined ? finalIsPaused : undefined
    });

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error('Error broadcasting live stream:', error);
    return NextResponse.json({ error: 'Failed to broadcast stream' }, { status: 500 });
  }
}
