import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'client' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Hanya untuk Portal Klien' }, { status: 403 });
    }

    const clientId = parseInt((session.user as any).id, 10);

    // Filter tes milik klien ini
    const whereClause: any = userRole === 'client' ? { clientId } : {};

    const [tests, participants] = await Promise.all([
      prisma.test.findMany({
        where: whereClause,
        include: {
          jobPosition: { select: { id: true, name: true } }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.testParticipant.findMany({
        where: { test: whereClause },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phone: true,
            }
          },
          test: {
            select: {
              id: true,
              title: true,
              sequence: true,
              isPaused: true,
              pauseMessage: true,
              jobPosition: { select: { name: true } }
            }
          },
          logs: {
            where: {
              logType: {
                in: ['camera_awal', 'camera_10min', 'camera', 'proctor_note', 'proctor_violation', 'blur_fullscreen', 'idle']
              }
            },
            orderBy: { id: 'desc' },
            take: 6
          }
        },
        orderBy: { id: 'desc' }
      })
    ]);

    const formattedParticipants = participants.map(p => {
      let sequenceArr: string[] = [];
      try {
        if (p.test?.sequence) sequenceArr = JSON.parse(p.test.sequence);
      } catch {}

      // Temukan foto webcam terbaru (camera_awal / camera_10min / camera)
      const latestPhotoLog = p.logs.find(l => 
        l.logType === 'camera_10min' || l.logType === 'camera_awal' || l.logType === 'camera'
      );

      // Hitung total pelanggaran
      const violationLogs = p.logs.filter(l => 
        l.logType.includes('blur') || l.logType.includes('violation') || l.logType.includes('idle')
      );

      return {
        id: p.id,
        userId: p.userId,
        testId: p.testId,
        status: p.status, // "pending", "in_progress", "completed", "stopped"
        currentTest: p.currentTest || '-',
        isPaused: Boolean(p.isPaused || p.test?.isPaused),
        startTime: p.startTime,
        endTime: p.endTime,
        user: p.user,
        test: {
          id: p.test?.id,
          title: p.test?.title,
          jobPositionName: p.test?.jobPosition?.name || 'Umum',
          sequence: sequenceArr,
          isPaused: Boolean(p.test?.isPaused)
        },
        latestPhotoUrl: latestPhotoLog?.mediaUrl || null,
        latestPhotoType: latestPhotoLog?.logType || null,
        photoLogs: p.logs.filter(l => l.logType.startsWith('camera')),
        violationCount: violationLogs.length,
        recentLogs: p.logs
      };
    });

    return NextResponse.json({
      batches: tests.map(t => ({
        id: t.id,
        title: t.title,
        jobPositionName: t.jobPosition?.name || 'Umum',
        isPaused: Boolean(t.isPaused),
        startDate: t.startDate
      })),
      participants: formattedParticipants
    });
  } catch (error: any) {
    console.error('Error fetching client proctor data:', error);
    return NextResponse.json({ error: 'Gagal memuat data pengawasan ujian' }, { status: 500 });
  }
}
