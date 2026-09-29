import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateStreamSession } from '@/lib/streamStore';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !['superadmin', 'tester', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized: Akses ditolak' }, { status: 401 });
    }

    const body = await req.json();
    const { action, participantId, batchId, pausedTests, pauseMessage, nextTest } = body;
    const authorName = session.user?.name || 'Pengawas';

    // 1. STOP SINGLE PARTICIPANT
    if (action === 'stop_participant') {
      const pId = parseInt(String(participantId), 10);
      if (isNaN(pId)) {
        return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
      }

      const updated = await prisma.testParticipant.update({
        where: { id: pId },
        data: {
          status: 'stopped',
          endTime: new Date()
        },
        include: { user: true }
      });

      // Record to SecurityLog
      await prisma.securityLog.create({
        data: {
          participantId: pId,
          logType: 'proctor_note',
          mediaUrl: `[${authorName}] Pengerjaan ujian peserta dihentikan secara manual oleh pengawas.`
        }
      });

      // Update stream store
      updateStreamSession({
        participantId: pId,
        name: updated.user.name,
        username: updated.user.username,
        cameraFrameUrl: null,
        screenFrameUrl: null,
        lastActive: Date.now(),
        violationCount: 0,
        status: 'stopped',
        isPaused: false
      });

      return NextResponse.json({ success: true, message: `Ujian peserta ${updated.user.name} berhasil dihentikan.` });
    }

    // 1B. PAUSE SINGLE PARTICIPANT IN REAL-TIME
    if (action === 'pause_participant') {
      const pId = parseInt(String(participantId), 10);
      if (isNaN(pId)) {
        return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
      }

      const updated = await prisma.testParticipant.update({
        where: { id: pId },
        data: { isPaused: true },
        include: { user: true }
      });

      await prisma.securityLog.create({
        data: {
          participantId: pId,
          logType: 'proctor_note',
          mediaUrl: `[${authorName}] Ujian peserta dijeda secara manual oleh pengawas.`
        }
      }).catch(() => {});

      updateStreamSession({
        participantId: pId,
        name: updated.user.name,
        username: updated.user.username,
        cameraFrameUrl: null,
        screenFrameUrl: null,
        lastActive: Date.now(),
        violationCount: 0,
        isPaused: true
      });

      return NextResponse.json({ success: true, isPaused: true, message: `Peserta ${updated.user.name} berhasil dijeda.` });
    }

    // 2. STOP ENTIRE BATCH
    if (action === 'stop_batch') {
      const bId = parseInt(String(batchId), 10);
      if (isNaN(bId)) {
        return NextResponse.json({ error: 'ID Batch tidak valid' }, { status: 400 });
      }

      const participants = await prisma.testParticipant.findMany({
        where: { testId: bId, status: { not: 'completed' } },
        include: { user: true }
      });

      await prisma.testParticipant.updateMany({
        where: { testId: bId, status: { not: 'completed' } },
        data: {
          status: 'stopped',
          endTime: new Date()
        }
      });

      // Log and update streamStore for all
      for (const p of participants) {
        await prisma.securityLog.create({
          data: {
            participantId: p.id,
            logType: 'proctor_note',
            mediaUrl: `[${authorName}] Ujian seluruh peserta pada sesi ini dihentikan oleh pengawas.`
          }
        }).catch(() => {});

        updateStreamSession({
          participantId: p.id,
          name: p.user.name,
          username: p.user.username,
          cameraFrameUrl: null,
          screenFrameUrl: null,
          lastActive: Date.now(),
          violationCount: 0,
          status: 'stopped'
        });
      }

      await prisma.test.update({
        where: { id: bId },
        data: {
          isPaused: true,
          pauseMessage: 'Ujian sedang dihentikan sementara oleh pengawas.'
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: `Seluruh pengerjaan pada sesi (${participants.length} peserta) berhasil dihentikan.` 
      });
    }

    // 3. SET PAUSED TESTS FOR A BATCH (Breakpoints before tests)
    if (action === 'set_paused_tests') {
      const bId = parseInt(String(batchId), 10);
      if (isNaN(bId)) {
        return NextResponse.json({ error: 'ID Batch tidak valid' }, { status: 400 });
      }

      const safePausedTests = Array.isArray(pausedTests) ? JSON.stringify(pausedTests) : null;

      await prisma.test.update({
        where: { id: bId },
        data: {
          pausedTests: safePausedTests,
          pauseMessage: pauseMessage ? String(pauseMessage).trim() : null
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Pengaturan jeda tes berhasil diperbarui.' 
      });
    }

    // 4. PAUSE / RESUME BATCH TRANSITIONS
    if (action === 'pause_batch') {
      const bId = parseInt(String(batchId), 10);
      if (isNaN(bId)) return NextResponse.json({ error: 'ID Batch tidak valid' }, { status: 400 });

      await prisma.test.update({
        where: { id: bId },
        data: {
          isPaused: true,
          pauseMessage: pauseMessage || 'Sesi sedang dijeda oleh pengawas. Harap menunggu instruksi selanjutnya.'
        }
      });

      return NextResponse.json({ success: true, isPaused: true, message: 'Jeda transisi sesi diaktifkan.' });
    }

    if (action === 'resume_batch') {
      const bId = parseInt(String(batchId), 10);
      if (isNaN(bId)) return NextResponse.json({ error: 'ID Batch tidak valid' }, { status: 400 });

      await prisma.test.update({
        where: { id: bId },
        data: { isPaused: false }
      });

      // Also unpause all participants currently waiting at this break
      const participants = await prisma.testParticipant.findMany({
        where: { testId: bId },
        include: { user: true }
      });

      const cleanNext = nextTest ? String(nextTest).toUpperCase().replace(/[\s\-_]+/g, '') : '';

      for (const p of participants) {
        let unpausedList: string[] = [];
        try {
          unpausedList = JSON.parse(p.unpausedTests || '[]');
        } catch (e) {}

        if (nextTest) {
          if (!unpausedList.includes(nextTest)) unpausedList.push(nextTest);
          if (cleanNext && !unpausedList.includes(cleanNext)) unpausedList.push(cleanNext);
        }

        if (p.currentTest) {
          const cleanCurrent = p.currentTest.toUpperCase().replace(/^JEDA\s+(STLH|SETELAH|SEBELUM)\s+/i, '').replace(/[\s\-_]+/g, '');
          const breakKey = `BREAK_AFTER_${cleanCurrent}`;
          if (!unpausedList.includes(breakKey)) {
            unpausedList.push(breakKey);
          }
        }

        await prisma.testParticipant.update({
          where: { id: p.id },
          data: {
            status: p.status === 'stopped' ? 'in_progress' : p.status,
            endTime: p.status === 'stopped' ? null : p.endTime,
            isPaused: false,
            unpausedTests: JSON.stringify(unpausedList)
          }
        });

        updateStreamSession({
          participantId: p.id,
          name: p.user.name,
          username: p.user.username,
          cameraFrameUrl: null,
          screenFrameUrl: null,
          lastActive: Date.now(),
          violationCount: 0,
          status: p.status === 'stopped' ? 'in_progress' : p.status,
          isPaused: false
        });
      }

      return NextResponse.json({ 
        success: true, 
        isPaused: false, 
        message: 'Sesi dilanjutkan! Peserta yang tertahan di ruang jeda akan otomatis masuk ke tes berikutnya.' 
      });
    }

    // 5. RESUME SINGLE PARTICIPANT
    if (action === 'resume_participant') {
      const pId = parseInt(String(participantId), 10);
      if (isNaN(pId)) return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });

      const p = await prisma.testParticipant.findUnique({
        where: { id: pId },
        include: { user: true, test: true }
      });

      if (!p) return NextResponse.json({ error: 'Peserta tidak ditemukan' }, { status: 404 });

      let unpausedList: string[] = [];
      try {
        unpausedList = JSON.parse(p.unpausedTests || '[]');
      } catch (e) {}

      if (nextTest) {
        const cleanNext = String(nextTest).toUpperCase().replace(/[\s\-_]+/g, '');
        if (!unpausedList.includes(nextTest)) unpausedList.push(nextTest);
        if (cleanNext && !unpausedList.includes(cleanNext)) unpausedList.push(cleanNext);
      }
      
      if (p.currentTest) {
        const cleanCurrent = p.currentTest.toUpperCase().replace(/^JEDA\s+(STLH|SETELAH|SEBELUM)\s+/i, '').replace(/[\s\-_]+/g, '');
        const breakKey = `BREAK_AFTER_${cleanCurrent}`;
        if (!unpausedList.includes(breakKey)) {
          unpausedList.push(breakKey);
        }
      }

      await prisma.testParticipant.update({
        where: { id: pId },
        data: {
          status: p.status === 'stopped' ? 'in_progress' : p.status,
          endTime: p.status === 'stopped' ? null : p.endTime,
          isPaused: false,
          unpausedTests: JSON.stringify(unpausedList)
        }
      });

      updateStreamSession({
        participantId: pId,
        name: p.user.name,
        username: p.user.username,
        cameraFrameUrl: null,
        screenFrameUrl: null,
        lastActive: Date.now(),
        violationCount: 0,
        status: p.status === 'stopped' ? 'in_progress' : p.status,
        isPaused: false
      });

      return NextResponse.json({ 
        success: true, 
        message: `Peserta ${p.user.name} berhasil dilanjutkan.` 
      });
    }

    // 6. TOGGLE PAUSE AFTER A SPECIFIC TEST
    if (action === 'toggle_test_pause') {
      const bId = parseInt(String(batchId), 10);
      if (isNaN(bId) || (!body.prevTest && !body.nextTest)) {
        return NextResponse.json({ error: 'ID Batch atau prevTest/nextTest tidak valid' }, { status: 400 });
      }

      const testObj = await prisma.test.findUnique({ where: { id: bId } });
      if (!testObj) return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });

      let currentPaused: string[] = [];
      try { currentPaused = JSON.parse(testObj.pausedTests || '[]'); } catch (e) {}

      // Clean helper — strips spaces/dashes/underscores, uppercase
      const clean = (s: string) => s.toUpperCase().replace(/[\s\-_]+/g, '');

      const prevRaw = String(body.prevTest || '').trim();
      const nextRaw = String(body.nextTest || '').trim();
      const cleanPrev = clean(prevRaw);   // e.g. "WPT" or "PAPIKOSTICK"

      // Canonical key format: "BREAK_AFTER_WPT" — no colons, unambiguous
      const canonicalKey = `BREAK_AFTER_${cleanPrev}`;

      // Find existing entry for this exact boundary
      const existingIdx = currentPaused.findIndex(t => t.toUpperCase() === canonicalKey);
      const exists = existingIdx !== -1;

      let updatedList: string[] = [];
      if (exists) {
        // Turn OFF: remove only this exact key
        updatedList = currentPaused.filter((_, i) => i !== existingIdx);

        // Auto-unpause participants waiting at this boundary
        const pausedParticipants = await prisma.testParticipant.findMany({
          where: { testId: bId, isPaused: true },
          include: { user: true }
        });

        for (const p of pausedParticipants) {
          let unpausedList: string[] = [];
          try { unpausedList = JSON.parse(p.unpausedTests || '[]'); } catch (e) {}

          if (!unpausedList.includes(canonicalKey)) {
            unpausedList.push(canonicalKey);
          }

          await prisma.testParticipant.update({
            where: { id: p.id },
            data: { isPaused: false, unpausedTests: JSON.stringify(unpausedList) }
          });

          updateStreamSession({
            participantId: p.id,
            name: p.user.name,
            username: p.user.username,
            cameraFrameUrl: null,
            screenFrameUrl: null,
            lastActive: Date.now(),
            violationCount: 0,
            status: p.status === 'stopped' ? 'in_progress' : p.status,
            isPaused: false
          });
        }
      } else {
        // Turn ON: add canonical key
        updatedList = [...currentPaused, canonicalKey];

        // Reset canonicalKey from unpausedTests of participants in this batch so they will hit this break
        const allParticipants = await prisma.testParticipant.findMany({
          where: { testId: bId }
        });
        for (const p of allParticipants) {
          if (p.unpausedTests) {
            try {
              const uList: string[] = JSON.parse(p.unpausedTests);
              const filtered = uList.filter(k => k.toUpperCase() !== canonicalKey && k.toUpperCase() !== cleanPrev);
              if (filtered.length !== uList.length) {
                await prisma.testParticipant.update({
                  where: { id: p.id },
                  data: { unpausedTests: JSON.stringify(filtered) }
                });
              }
            } catch (e) {}
          }
        }
      }

      await prisma.test.update({
        where: { id: bId },
        data: {
          pausedTests: JSON.stringify(updatedList)
        }
      });

      return NextResponse.json({
        success: true,
        pausedTests: updatedList,
        message: exists 
          ? `Jeda setelah tes ${prevRaw} berhasil dimatikan.` 
          : `Jeda setelah tes ${prevRaw} berhasil diaktifkan!`
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in proctor control:', error);
    return NextResponse.json({ error: 'Gagal memproses kontrol pengawas: ' + error.message }, { status: 500 });
  }
}
