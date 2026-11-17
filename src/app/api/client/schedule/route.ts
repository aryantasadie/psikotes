import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/authOptions';
import { generateSecurePassword } from '@/lib/passwordGenerator';

// GET: Fetch client's locked battery test, bank psikogram, quotas, and existing batches
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Number((session.user as any).id);

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        license: true,
        testQuotas: true,
        usedQuotas: true,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    let batteryTest: string[] = ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'];
    let assignedJobPositionIds: number[] = [];

    // Cek Baterai Tes resmi klien langsung dari tabel Test (clientId = clientId)
    const clientBatteryRecord = await prisma.test.findFirst({
      where: { clientId, jobPositionId: null },
      orderBy: { id: 'desc' }
    });

    if (clientBatteryRecord?.sequence) {
      try {
        const parsedSeq = JSON.parse(clientBatteryRecord.sequence);
        if (Array.isArray(parsedSeq) && parsedSeq.length > 0) {
          batteryTest = parsedSeq;
        }
      } catch {}
    }

    if (client.license) {
      try {
        const parsed = JSON.parse(client.license);
        if ((!clientBatteryRecord || batteryTest.length === 0) && Array.isArray(parsed.batteryTest) && parsed.batteryTest.length > 0) {
          batteryTest = parsed.batteryTest;
        }
        if (Array.isArray(parsed.assignedJobPositionIds)) {
          assignedJobPositionIds = parsed.assignedJobPositionIds.map(Number).filter((id: number) => !isNaN(id) && id > 0);
        }
      } catch {}
    }

    // Ambil detail Bank Psikogram yang diizinkan untuk klien ini:
    // HANYA mencakup jabatan yang dibuat khusus untuk klien ini (clientId: clientId),
    // atau ID formasi jabatan yang dicentang aktif di assignedJobPositionIds (Tab 2 Superadmin)
    const orConditions: any[] = [
      { clientId }
    ];
    if (assignedJobPositionIds.length > 0) {
      orConditions.push({ id: { in: assignedJobPositionIds } });
    }

    const bankPsikogram = await prisma.jobPosition.findMany({
      where: {
        OR: orConditions
      },
      include: {
        psychographPreset: { select: { id: true, name: true } },
        grayAreas: {
          select: { id: true, parameter: true, targetScore: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Hitung Kuota Total & Terpakai
    let totalQuota = 0;
    let usedQuota = 0;

    if (client.testQuotas) {
      try {
        const q: any = JSON.parse(client.testQuotas);
        totalQuota = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
      } catch {
        totalQuota = Number(client.testQuotas) || 0;
      }
    }

    if (client.usedQuotas) {
      try {
        const u: any = JSON.parse(client.usedQuotas);
        usedQuota = u.total !== undefined ? Number(u.total) : (Object.values(u).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
      } catch {
        usedQuota = Number(client.usedQuotas) || 0;
      }
    }

    const remainingQuota = Math.max(0, totalQuota - usedQuota);

    // Batches created by this client
    const batches = await prisma.test.findMany({
      where: { clientId },
      include: {
        jobPosition: { select: { id: true, name: true } },
        psychographPreset: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { name: true, username: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const formattedBatches = batches.map(b => ({
      id: b.id,
      title: b.title,
      startDate: b.startDate,
      jobPositionName: b.jobPosition?.name || b.specification || 'Tes Bebas (Tanpa Psikogram)',
      presetName: b.psychographPreset?.name || (b.jobPosition ? 'Standar HR Publik' : 'Tanpa Psikogram'),
      totalParticipants: b.participants.length,
      completedParticipants: b.participants.filter(p => p.status === 'completed').length,
      participants: b.participants.map(p => ({
        id: p.id,
        name: p.user.name,
        username: p.user.username,
        status: p.status,
        plainPassword: p.plainPassword
      }))
    }));

    return NextResponse.json({
      batteryTest,
      bankPsikogram: bankPsikogram.map(j => ({
        id: j.id,
        name: j.name,
        description: j.description,
        presetName: j.psychographPreset?.name || 'FIX HR Publik',
        grayAreasCount: j.grayAreas?.length || 0,
        grayAreas: j.grayAreas
      })),
      totalQuota,
      usedQuota,
      remainingQuota,
      batches: formattedBatches
    });
  } catch (error: any) {
    console.error('Error fetching client batches:', error);
    return NextResponse.json({ error: 'Gagal mengambil data jadwal' }, { status: 500 });
  }
}

// POST: Client creates a self-service assessment batch (deducts candidate quota only when starting test)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Number((session.user as any).id);

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        license: true,
        testQuotas: true,
        usedQuotas: true,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    let batteryTest: string[] = ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'];
    if (client.license) {
      try {
        const parsed = JSON.parse(client.license);
        if (Array.isArray(parsed.batteryTest) && parsed.batteryTest.length > 0) {
          batteryTest = parsed.batteryTest;
        }
      } catch {}
    }

    // Hitung sisa kuota
    let totalQuota = 0;
    let usedQuota = 0;

    if (client.testQuotas) {
      try {
        const q: any = JSON.parse(client.testQuotas);
        totalQuota = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
      } catch {
        totalQuota = Number(client.testQuotas) || 0;
      }
    }

    if (client.usedQuotas) {
      try {
        const u: any = JSON.parse(client.usedQuotas);
        usedQuota = u.total !== undefined ? Number(u.total) : (Object.values(u).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
      } catch {
        usedQuota = Number(client.usedQuotas) || 0;
      }
    }

    const remainingQuota = Math.max(0, totalQuota - usedQuota);

    const body = await req.json();
    let { 
      sessionName, 
      mode, // 'PSIKOGRAM' | 'CUSTOM_TEST'
      jobPositionId, 
      selectedTools, 
      sessionDate, 
      prefix, 
      count,
      disableMedia
    } = body;

    const n = parseInt(count, 10);
    if (!prefix || isNaN(n) || n <= 0 || n > 200) {
      return NextResponse.json({ error: 'Prefix dan jumlah peserta harus valid (1 - 200).' }, { status: 400 });
    }

    if (remainingQuota < n) {
      return NextResponse.json({
        error: `Sisa kuota akun Anda tersisa ${remainingQuota} kandidat. Permintaan Anda: ${n} kandidat. Silakan hubungi Superadmin HR Publik untuk penambahan kuota.`
      }, { status: 400 });
    }

    let finalSequence: string[] = [];
    let finalJobPositionId: number | null = null;
    let finalPresetId: number | null = null;
    let finalSpecName = 'Asesmen Mandiri';

    if (mode === 'CUSTOM_TEST') {
      // Mode Tes Bebas (Tanpa Psikogram)
      if (!Array.isArray(selectedTools) || selectedTools.length === 0) {
        return NextResponse.json({ error: 'Pilih minimal satu alat tes untuk mode tes mandiri.' }, { status: 400 });
      }
      finalSequence = selectedTools;
      finalJobPositionId = null;
      finalPresetId = null;
      finalSpecName = 'Tes Bebas (Tanpa Psikogram)';
    } else {
      // Mode Asesmen Jabatan (Dengan Lembar Psikogram)
      if (!jobPositionId) {
        return NextResponse.json({ error: 'Pilih formasi jabatan dari Bank Psikogram Anda.' }, { status: 400 });
      }

      const jobPos = await prisma.jobPosition.findUnique({
        where: { id: Number(jobPositionId) },
        select: { id: true, name: true, psychographPresetId: true }
      });

      if (!jobPos) {
        return NextResponse.json({ error: 'Formasi jabatan tidak ditemukan.' }, { status: 404 });
      }

      finalJobPositionId = jobPos.id;
      finalPresetId = jobPos.psychographPresetId;
      finalSequence = batteryTest; // Menggunakan Battery Test resmi yang dikunci oleh Superadmin!
      finalSpecName = jobPos.name;
    }

    // Format Title
    const dateFormatted = sessionDate 
      ? new Date(sessionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const finalTitle = sessionName?.trim()
      ? `${sessionName.trim()} - ${client.name} (${dateFormatted})`
      : `Sesi ${finalSpecName} - ${client.name} (${dateFormatted})`;

    // Create Test
    const newTest = await prisma.test.create({
      data: {
        title: finalTitle,
        clientId: client.id,
        specification: finalSpecName,
        jobPositionId: finalJobPositionId,
        psychographPresetId: finalPresetId,
        startDate: sessionDate ? new Date(sessionDate) : new Date(),
        sequence: JSON.stringify(finalSequence),
        disableMedia: Boolean(disableMedia),
      }
    });

    // Generate Participant Accounts
    const generatedAccounts: any[] = [];
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    for (let i = 1; i <= n; i++) {
      const padNum = String(i).padStart(3, '0');
      let username = `${cleanPrefix}_${padNum}`;
      
      let attempt = 0;
      while (await prisma.user.findUnique({ where: { username } })) {
        attempt++;
        username = `${cleanPrefix}_${padNum}_${attempt}`;
      }

      const plainPassword = generateSecurePassword(8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const candidateName = `Kandidat ${padNum} (${client.name})`;

      const newUser = await prisma.user.create({
        data: {
          name: candidateName,
          username,
          password: hashedPassword,
          role: 'user',
          status: 'active',
        }
      });

      await prisma.testParticipant.create({
        data: {
          userId: newUser.id,
          testId: newTest.id,
          status: 'pending',
          plainPassword,
        }
      });

      generatedAccounts.push({
        id: newUser.id,
        username,
        name: candidateName,
        password: plainPassword
      });
    }

    return NextResponse.json({
      message: `Berhasil membuat sesi "${finalTitle}" dengan ${n} akun kandidat. Kuota hanya akan terpotong saat kandidat mulai mengerjakan ujian.`,
      testId: newTest.id,
      testTitle: finalTitle,
      accounts: generatedAccounts,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating client batch:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses sesi ujian' }, { status: 500 });
  }
}
