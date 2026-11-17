import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'client' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    const { action, batchId, participantId, pauseMessage } = body;

    // 1. PAUSE / RESUME ENTIRE BATCH
    if (action === 'pause_batch' || action === 'resume_batch') {
      const bId = parseInt(String(batchId), 10);
      if (isNaN(bId)) {
        return NextResponse.json({ error: 'ID Sesi Ujian tidak valid' }, { status: 400 });
      }

      // Verifikasi batch adalah milik klien ini
      const batch = await prisma.test.findFirst({
        where: userRole === 'client' ? { id: bId, clientId } : { id: bId }
      });

      if (!batch) {
        return NextResponse.json({ error: 'Sesi ujian tidak ditemukan atau bukan milik Anda' }, { status: 404 });
      }

      const shouldPause = action === 'pause_batch';
      await prisma.test.update({
        where: { id: bId },
        data: {
          isPaused: shouldPause,
          pauseMessage: shouldPause ? (pauseMessage || 'Ujian sedang dijeda oleh penyelenggara/HR.') : null
        }
      });

      return NextResponse.json({
        success: true,
        message: shouldPause ? 'Sesi ujian berhasil dijeda' : 'Sesi ujian berhasil dilanjutkan'
      });
    }

    // 2. STOP SINGLE PARTICIPANT
    if (action === 'stop_participant') {
      const pId = parseInt(String(participantId), 10);
      if (isNaN(pId)) {
        return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
      }

      const participant = await prisma.testParticipant.findFirst({
        where: {
          id: pId,
          ...(userRole === 'client' ? { test: { clientId } } : {})
        }
      });

      if (!participant) {
        return NextResponse.json({ error: 'Peserta tidak ditemukan atau bukan bagian dari ujian Anda' }, { status: 404 });
      }

      await prisma.testParticipant.update({
        where: { id: pId },
        data: {
          status: 'stopped',
          endTime: new Date()
        }
      });

      await prisma.securityLog.create({
        data: {
          participantId: pId,
          logType: 'proctor_note',
          mediaUrl: `[HR Klien: ${session.user.name}] Ujian peserta dihentikan secara manual oleh HR perusahaan.`
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Peserta berhasil dihentikan dari pengerjaan ujian'
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error('Error controlling client proctor:', error);
    return NextResponse.json({ error: 'Gagal memproses kontrol pengawasan' }, { status: 500 });
  }
}
