import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authOptions } from '@/lib/authOptions';

function generateSecurePassword(length = 8): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// GET: Fetch client's existing batches and available quotas
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
        testQuotas: true,
        usedQuotas: true,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    let quotas: Record<string, number> = {};
    let used: Record<string, number> = {};
    if (client.testQuotas) {
      try { quotas = JSON.parse(client.testQuotas); } catch {}
    }
    if (client.usedQuotas) {
      try { used = JSON.parse(client.usedQuotas); } catch {}
    }

    // Also get presets / positions if any
    const jobPositions = await prisma.jobPosition.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    // Batches created by this client
    const batches = await prisma.test.findMany({
      where: { clientId },
      include: {
        jobPosition: { select: { name: true } },
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
      jobPositionName: b.jobPosition?.name || 'Mandiri',
      totalParticipants: b.participants.length,
      completedParticipants: b.participants.filter(p => p.status === 'completed').length,
      participants: b.participants.map(p => ({
        id: p.id,
        name: p.user.name,
        username: p.user.username,
        status: p.status,
        password: p.plainPassword || '******'
      }))
    }));

    return NextResponse.json({
      quotas,
      usedQuotas: used,
      jobPositions,
      batches: formattedBatches
    });
  } catch (error: any) {
    console.error('Error fetching client schedule data:', error);
    return NextResponse.json({ error: 'Gagal memuat data jadwal klien' }, { status: 500 });
  }
}

// POST: Create a new batch session & generate participant accounts within quota
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
        testQuotas: true,
        usedQuotas: true,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    let quotas: Record<string, number> = {};
    let used: Record<string, number> = {};
    if (client.testQuotas) {
      try { quotas = JSON.parse(client.testQuotas); } catch {}
    }
    if (client.usedQuotas) {
      try { used = JSON.parse(client.usedQuotas); } catch {}
    }

    const body = await req.json();
    const { sessionName, selectedTools, sessionDate, prefix, count } = body;

    const n = parseInt(count, 10);
    if (!prefix || isNaN(n) || n <= 0 || n > 200) {
      return NextResponse.json({ error: 'Prefix dan jumlah peserta harus valid (1 - 200).' }, { status: 400 });
    }

    if (!Array.isArray(selectedTools) || selectedTools.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu alat tes yang akan diujikan.' }, { status: 400 });
    }

    // Verify quota availability for ALL selected tools
    for (const tool of selectedTools) {
      const toolQuota = quotas[tool] || 0;
      const toolUsed = used[tool] || 0;
      const remaining = toolQuota - toolUsed;

      if (remaining < n) {
        return NextResponse.json({
          error: `Kuota tidak mencukupi untuk tes ${tool}. Sisa kuota: ${remaining}, Permintaan: ${n}.`
        }, { status: 400 });
      }
    }

    // Format Title
    const dateFormatted = sessionDate
      ? new Date(sessionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const finalTitle = sessionName?.trim()
      ? `${sessionName.trim()} - ${client.name} (${dateFormatted})`
      : `Sesi Asesmen - ${client.name} (${dateFormatted})`;

    // Create Test
    const newTest = await prisma.test.create({
      data: {
        title: finalTitle,
        clientId: client.id,
        startDate: sessionDate ? new Date(sessionDate) : new Date(),
        sequence: JSON.stringify(selectedTools),
        disableMedia: false,
      }
    });

    // Generate Participant Accounts
    const generatedAccounts: any[] = [];
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    for (let i = 1; i <= n; i++) {
      const padNum = String(i).padStart(3, '0');
      let username = `${cleanPrefix}_${padNum}`;
      
      // Ensure unique username
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

    // Deduct Quotas
    const newUsed = { ...used };
    for (const tool of selectedTools) {
      newUsed[tool] = (newUsed[tool] || 0) + n;
    }

    await prisma.user.update({
      where: { id: client.id },
      data: {
        usedQuotas: JSON.stringify(newUsed)
      }
    });

    return NextResponse.json({
      message: `Berhasil membuat sesi "${finalTitle}" dengan ${n} akun kandidat.`,
      testId: newTest.id,
      testTitle: finalTitle,
      accounts: generatedAccounts,
      remainingQuotas: Object.fromEntries(
        selectedTools.map((t: string) => [t, (quotas[t] || 0) - (newUsed[t] || 0)])
      )
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating client batch:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses sesi ujian' }, { status: 500 });
  }
}
