import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authOptions } from '@/lib/authOptions';

// GET: Fetch all clients, job positions, and psychograph presets
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['superadmin', 'tester', 'psikolog'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }

    const [clients, allTests, jobPositions, psychographPresets] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'client' },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          license: true,
          testQuotas: true,
          usedQuotas: true,
          logoUrl: true,
          failedAttempts: true,
          lockedUntil: true,
          isPermanentLocked: true,
          createdAt: true,
        },
        orderBy: { id: 'desc' }
      }),
      prisma.test.findMany({
        where: { clientId: { not: null } },
        include: {
          jobPosition: { select: { id: true, name: true } },
          participants: {
            select: {
              id: true,
              status: true,
              psychoResults: {
                select: {
                  status: true,
                  recommendation: true
                }
              }
            }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.jobPosition.findMany({
        include: {
          psychographPreset: { select: { id: true, name: true } },
          grayAreas: {
            select: {
              id: true,
              parameter: true,
              targetScore: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.psychographPreset.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      })
    ]);

    const result = clients.map((c) => {
      const clientBatches = allTests.filter(t => t.clientId === c.id);
      let totalCandidates = 0;
      let completedCandidates = 0;
      let managedBatches = 0;
      let saasBatches = 0;

      const formattedBatches = clientBatches.map(t => {
        const pCount = t.participants.length;
        const cCount = t.participants.filter(p => p.status === 'completed').length;
        totalCandidates += pCount;
        completedCandidates += cCount;

        const isManaged = Boolean(t.jobPosition || t.participants.some(p => p.psychoResults?.status === 'RELEASED'));
        if (isManaged) managedBatches++;
        else saasBatches++;

        return {
          id: t.id,
          title: t.title,
          startDate: t.startDate ? t.startDate.toISOString() : null,
          jobPositionName: t.jobPosition?.name || t.specification || 'Tes Bebas (Tanpa Psikogram)',
          totalParticipants: pCount,
          completedParticipants: cCount,
          scheme: isManaged ? 'Skema 1 (Managed)' : 'Skema 2 (SaaS)',
          status: cCount === pCount && pCount > 0 ? 'completed' : 'in_progress'
        };
      });

      // Parse license field: scheme, pic, batteryTest (locked), assignedJobPositionIds (bank psikogram)
      let serviceScheme = 'SKEMA_1_MANAGED';
      let picName = '';
      let batteryTest: string[] = ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'];
      let assignedJobPositionIds: number[] = [9]; // default ada Standar Umum (Cukup Semua)

      if (c.license) {
        try {
          const parsed = JSON.parse(c.license);
          if (typeof parsed === 'object' && parsed !== null) {
            serviceScheme = parsed.scheme || 'SKEMA_1_MANAGED';
            picName = parsed.pic || '';
            if (Array.isArray(parsed.batteryTest) && parsed.batteryTest.length > 0) {
              batteryTest = parsed.batteryTest;
            }
            if (Array.isArray(parsed.assignedJobPositionIds)) {
              assignedJobPositionIds = parsed.assignedJobPositionIds;
            }
          } else {
            serviceScheme = c.license;
          }
        } catch {
          serviceScheme = c.license;
        }
      } else {
        if (c.testQuotas && c.testQuotas !== '{}' && c.testQuotas !== 'null') {
          serviceScheme = managedBatches > 0 ? 'HYBRID' : 'SKEMA_2_SAAS';
        } else {
          serviceScheme = 'SKEMA_1_MANAGED';
        }
      }

      // Hitung total kuota dan used kuota
      let totalQuota = 0;
      let usedQuota = 0;

      if (c.testQuotas) {
        try {
          const q: any = JSON.parse(c.testQuotas);
          if (typeof q === 'object' && q !== null) {
            totalQuota = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
          } else {
            totalQuota = Number(q) || 0;
          }
        } catch {
          totalQuota = Number(c.testQuotas) || 0;
        }
      }

      if (c.usedQuotas) {
        try {
          const u: any = JSON.parse(c.usedQuotas);
          if (typeof u === 'object' && u !== null) {
            usedQuota = u.total !== undefined ? Number(u.total) : (Object.values(u).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
          } else {
            usedQuota = Number(u) || 0;
          }
        } catch {
          usedQuota = Number(c.usedQuotas) || 0;
        }
      }

      return {
        ...c,
        serviceScheme,
        picName,
        batteryTest,
        assignedJobPositionIds,
        totalQuota,
        usedQuota,
        totalBatches: clientBatches.length,
        totalCandidates,
        completedCandidates,
        managedBatches,
        saasBatches,
        batches: formattedBatches
      };
    });

    return NextResponse.json({
      clients: result,
      jobPositions: jobPositions.map(j => ({
        id: j.id,
        name: j.name,
        description: j.description,
        psychographPresetId: j.psychographPresetId,
        presetName: j.psychographPreset?.name || 'Standar HR Publik',
        grayAreasCount: j.grayAreas?.length || 0
      })),
      psychographPresets: psychographPresets.map(p => ({
        id: p.id,
        name: p.name
      }))
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Gagal mengambil data klien' }, { status: 500 });
  }
}

// POST: Create Client company (Mitra B2B)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
    }

    const body = await req.json();
    let { 
      name, 
      username, 
      email, 
      phone, 
      password, 
      status, 
      totalQuota, 
      logoUrl, 
      serviceScheme, 
      picName, 
      batteryTest, 
      assignedJobPositionIds 
    } = body;

    if (!name || !username) {
      return NextResponse.json({ error: 'Nama Perusahaan dan Username wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh akun lain' }, { status: 400 });
    }

    const rawPassword = password && password.trim() ? password.trim() : crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const schemeToSave = serviceScheme || 'SKEMA_2_SAAS';
    const licenseData = JSON.stringify({
      scheme: schemeToSave,
      pic: picName ? picName.trim() : '',
      batteryTest: Array.isArray(batteryTest) && batteryTest.length > 0 ? batteryTest : ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'],
      assignedJobPositionIds: Array.isArray(assignedJobPositionIds) && assignedJobPositionIds.length > 0 ? assignedJobPositionIds : [9]
    });

    const quotaNum = Number(totalQuota || 0);
    const quotasToSave = JSON.stringify({ total: quotaNum });
    const usedToSave = JSON.stringify({ total: 0 });

    const newClient = await prisma.user.create({
      data: {
        name,
        username,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: 'client',
        status: status || 'active',
        license: licenseData,
        testQuotas: quotasToSave,
        usedQuotas: usedToSave,
        logoUrl: logoUrl || null
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        license: true,
        testQuotas: true,
        usedQuotas: true,
        logoUrl: true,
        createdAt: true
      }
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Gagal membuat klien' }, { status: 500 });
  }
}

// PUT: Update Client company (Termasuk Setting Battery Test & Bank Psikogram Jabatan Mitra)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
    }

    const body = await req.json();
    let { 
      id, 
      name, 
      username, 
      email, 
      phone, 
      password, 
      status, 
      totalQuota, 
      logoUrl, 
      serviceScheme, 
      picName,
      batteryTest,
      assignedJobPositionIds
    } = body;

    if (!id || !name || !username) {
      return NextResponse.json({ error: 'ID, Nama Perusahaan, dan Username wajib diisi' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!target || target.role !== 'client') {
      return NextResponse.json({ error: 'Target bukan akun klien' }, { status: 400 });
    }

    const updateData: any = {
      name,
      username,
      email: email || null,
      phone: phone || null,
      status: status || 'active'
    };

    let existingPic = '';
    let existingScheme = 'SKEMA_2_SAAS';
    let existingBatteryTest = ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'];
    let existingAssignedJobs = [9];

    if (target.license) {
      try {
        const parsed = JSON.parse(target.license);
        existingScheme = parsed.scheme || target.license;
        existingPic = parsed.pic || '';
        if (Array.isArray(parsed.batteryTest)) existingBatteryTest = parsed.batteryTest;
        if (Array.isArray(parsed.assignedJobPositionIds)) existingAssignedJobs = parsed.assignedJobPositionIds;
      } catch {
        existingScheme = target.license;
      }
    }

    const finalBatteryTest = batteryTest !== undefined ? batteryTest : existingBatteryTest;
    const finalAssignedJobs = assignedJobPositionIds !== undefined ? assignedJobPositionIds : existingAssignedJobs;

    updateData.license = JSON.stringify({
      scheme: serviceScheme !== undefined ? serviceScheme : existingScheme,
      pic: picName !== undefined ? picName.trim() : existingPic,
      batteryTest: finalBatteryTest,
      assignedJobPositionIds: finalAssignedJobs
    });

    // Update Kuota Total jika disediakan
    if (totalQuota !== undefined) {
      const qNum = Number(totalQuota);
      updateData.testQuotas = JSON.stringify({ total: isNaN(qNum) || qNum < 0 ? 0 : qNum });
    }

    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl || null;
    }

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        license: true,
        testQuotas: true,
        usedQuotas: true,
        logoUrl: true,
        createdAt: true
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data klien' }, { status: 500 });
  }
}

// DELETE: Delete Client company with relational safety
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID klien wajib disertakan' }, { status: 400 });
    }

    const clientId = Number(id);

    // Keamanan: Cek apakah klien masih memiliki batch jadwal ujian aktif (ada peserta)
    const connectedBatches = await prisma.test.findMany({
      where: { 
        clientId,
        participants: { some: {} }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        _count: { select: { participants: true } }
      }
    });

    if (connectedBatches.length > 0) {
      return NextResponse.json({
        error: `Klien tidak dapat dihapus karena masih terhubung dengan ${connectedBatches.length} batch ujian aktif. Nonaktifkan status akun klien jika kemitraan telah berakhir agar rekam data historis peserta tetap aman.`,
        code: 'HAS_CONNECTED_DATA',
        connectedBatches: connectedBatches.map(b => ({
          id: b.id,
          title: b.title,
          participantCount: b._count.participants,
          startDate: b.startDate ? b.startDate.toISOString() : null
        }))
      }, { status: 400 });
    }

    // Bersihkan batch shell tanpa peserta jika ada yang mengaitkan klien ini
    await prisma.test.deleteMany({
      where: {
        clientId,
        participants: { none: {} }
      }
    });

    await prisma.user.delete({
      where: { id: clientId }
    });

    return NextResponse.json({ message: 'Klien berhasil dihapus dari sistem' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus klien' }, { status: 500 });
  }
}
