import { prisma } from '@/lib/prisma';

/**
 * Normalisasi nama alat tes agar seragam dalam audit trail dan referensi QuotaLedger.
 */
export function normalizeToolName(tool: string): string {
  const clean = (tool || '').trim().toUpperCase().replace(/[\s\-_]+/g, '');
  if (clean.startsWith('IST')) {
    const match = clean.match(/^IST([0-9]+)$/);
    return match ? `IST ${match[1]}` : 'IST';
  }
  if (clean.startsWith('CFIT')) {
    const match = clean.match(/^CFIT([0-9]+)$/);
    return match ? `CFIT ${match[1]}` : 'CFIT';
  }
  if (clean.startsWith('TIKI')) {
    const match = clean.match(/^TIKI([0-9]+)$/);
    return match ? `TIKI ${match[1]}` : 'TIKI';
  }
  if (clean.includes('PAPI')) return 'PAPI KOSTICK';
  if (clean.includes('KRAEPELIN') || clean.includes('KREAPELIN')) return 'Kraepelin';
  if (clean.includes('MSDT')) return 'MSDT';
  if (clean.includes('DISC')) return 'DISC';
  if (clean.includes('WPT')) return 'WPT';
  if (clean.includes('POWER')) return 'POWER';
  if (clean.includes('WARTEGG')) return 'Wartegg';
  if (clean.includes('GRAFIS')) return 'Tes Grafis';
  return (tool || '').trim();
}

/**
 * Memulai status pengerjaan peserta (anti-ghosting).
 * Sesuai Dokumen Spesifikasi Teknis: Skema Ticketing & Dual-Wallet B2B Psikotes HRP:
 * - Mode Asesmen Jabatan ('PACKAGE'):
 *     Memotong 1 Kuota Paket Asesmen saat peserta memulai sesi (setelah input nama / konfirmasi).
 *     Idempotent menggunakan referenceDoc: "PARTICIPANT_${participantId}_PACKAGE".
 * - Mode Tes Mandiri / Bebas ('SINGLE'):
 *     TIDAK memotong kuota di awal sesi secara gelondongan.
 *     Hanya mengubah status peserta menjadi 'in_progress'.
 *     Pemotongan kuota Single Test dihitung secara proporsional dan atomik: 1 kuota per 1 alat tes
 *     yang benar-benar dimulai oleh peserta via `deductToolQuotaOnStart`.
 */
export async function markParticipantStarted(participantId: number) {
  if (!participantId || isNaN(participantId)) return null;

  try {
    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        test: {
          select: {
            id: true,
            title: true,
            clientId: true,
            sequence: true,
            specification: true,
            jobPositionId: true,
            psychographPresetId: true,
            jobPosition: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!participant) return null;

    // Tentukan apakah sesi ini adalah mode Single Test (Tes Bebas/Mandiri tanpa psikogram)
    const isSingleTest = 
      participant.test?.specification === 'Tes Bebas (Tanpa Psikogram)' ||
      (!participant.test?.jobPositionId && !participant.test?.psychographPresetId);

    // UNTUK MODE SINGLE TEST:
    // Sesuai aturan: pemotongan dihitung proporsional per alat tes yang benar-benar dimulai peserta.
    // Jadi di titik markParticipantStarted, HANYA ubah status peserta menjadi 'in_progress'.
    if (isSingleTest) {
      if (participant.status === 'pending') {
        return await prisma.testParticipant.update({
          where: { id: participantId },
          data: {
            status: 'in_progress',
            startTime: participant.startTime || new Date(),
          }
        });
      }
      return participant;
    }

    // UNTUK MODE PACKAGE (Asesmen Jabatan):
    // Proteksi anti-ghosting: potong 1 kuota paket sekali saat peserta pertama kali mulai
    const clientId = participant.test?.clientId;
    if (!clientId) {
      if (participant.status === 'pending') {
        return await prisma.testParticipant.update({
          where: { id: participantId },
          data: {
            status: 'in_progress',
            startTime: participant.startTime || new Date(),
          }
        });
      }
      return participant;
    }

    const packageRefDoc = `PARTICIPANT_${participantId}_PACKAGE`;

    // Cek apakah sudah pernah dipotong kuota paket untuk peserta ini
    const existingUsage = await prisma.quotaLedger.findFirst({
      where: {
        clientId,
        testId: participant.testId,
        transactionType: 'USAGE',
        referenceDoc: packageRefDoc,
      }
    });

    if (existingUsage || participant.status !== 'pending') {
      if (participant.status === 'pending') {
        return await prisma.testParticipant.update({
          where: { id: participantId },
          data: {
            status: 'in_progress',
            startTime: participant.startTime || new Date(),
          }
        });
      }
      return participant;
    }

    const participantLabel = participant.user?.name || participant.user?.username || `Kandidat #${participant.userId}`;
    const testTitle = participant.test?.title || `Sesi #${participant.testId}`;

    // Jalankan transaksi pemotongan kuota Paket
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.user.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          quotaPackage: true,
          testQuotas: true,
          usedQuotas: true,
        }
      });

      let currentPackage = client?.quotaPackage ?? 0;
      const balanceAfter = Math.max(0, currentPackage - 1);

      // Selaraskan usedQuotas
      let used: Record<string, number> = {};
      if (client?.usedQuotas) {
        try {
          used = JSON.parse(client.usedQuotas);
        } catch {
          used = {};
        }
      }
      used.total = (used.total !== undefined ? Number(used.total) : 0) + 1;
      const spec = participant.test?.specification || participant.test?.jobPosition?.name || 'Asesmen Jabatan';
      used[spec] = (used[spec] || 0) + 1;

      // Update client
      await tx.user.update({
        where: { id: clientId },
        data: {
          quotaPackage: balanceAfter,
          usedQuotas: JSON.stringify(used),
        }
      });

      // Catat QuotaLedger
      await tx.quotaLedger.create({
        data: {
          clientId,
          quotaType: 'PACKAGE',
          transactionType: 'USAGE',
          amount: -1,
          balanceAfter,
          testId: participant.testId,
          referenceDoc: packageRefDoc,
          notes: `Penggunaan 1 Kuota Paket Asesmen oleh ${participantLabel} (Sesi: ${testTitle})`,
        }
      });

      // Update status peserta
      return await tx.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          startTime: participant.startTime || new Date(),
        }
      });
    });

    return result;
  } catch (error) {
    console.error('Error in markParticipantStarted:', error);
    try {
      return await prisma.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          startTime: new Date(),
        }
      });
    } catch {
      return null;
    }
  }
}

/**
 * Pemotongan Kuota Single Test secara Proporsional & Atomik (1 kuota per 1 alat tes yang dimulai).
 * Jika peserta dijadwalkan 3 tes namun hanya memulai 2 tes, maka hanya 2 kuota yang terpotong.
 * Idempotent: Menggunakan referenceDoc `PARTICIPANT_${participantId}_TOOL_${normalizedToolName}`
 * sehingga refresh halaman atau reconnect tidak akan memotong kuota ganda.
 */
export async function deductToolQuotaOnStart(participantId: number, rawToolName: string) {
  if (!participantId || isNaN(participantId) || !rawToolName) return null;

  const normalizedTool = normalizeToolName(rawToolName);
  if (!normalizedTool) return null;

  try {
    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        test: {
          select: {
            id: true,
            title: true,
            clientId: true,
            specification: true,
            jobPositionId: true,
            psychographPresetId: true,
          }
        }
      }
    });

    if (!participant) return null;

    // Cek apakah tes ini merupakan Single Test (Tes Bebas/Mandiri tanpa psikogram)
    const isSingleTest = 
      participant.test?.specification === 'Tes Bebas (Tanpa Psikogram)' ||
      (!participant.test?.jobPositionId && !participant.test?.psychographPresetId);

    // Jika bukan single test (mode paket asesmen), tidak perlu memotong kuota per tool (sudah dipotong paket)
    if (!isSingleTest) {
      if (participant.currentTest !== normalizedTool) {
        await prisma.testParticipant.update({
          where: { id: participantId },
          data: { currentTest: normalizedTool }
        }).catch(() => {});
      }
      return { deducted: false, isSingleTest: false };
    }

    const clientId = participant.test?.clientId;
    // Jika tidak ada clientId (bukan klien B2B terdaftar), cukup perbarui currentTest
    if (!clientId) {
      await prisma.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          currentTest: normalizedTool,
          startTime: participant.startTime || new Date(),
        }
      }).catch(() => {});
      return { deducted: false, isB2B: false };
    }

    const toolRefDoc = `PARTICIPANT_${participantId}_TOOL_${normalizedTool}`;

    // Cek apakah kuota untuk alat tes ini sudah pernah dipotong untuk peserta ini
    const existingToolUsage = await prisma.quotaLedger.findFirst({
      where: {
        clientId,
        testId: participant.testId,
        transactionType: 'USAGE',
        referenceDoc: toolRefDoc,
      }
    });

    if (existingToolUsage) {
      // Sudah pernah terpotong (idempotent): perbarui currentTest jika perlu
      if (participant.currentTest !== normalizedTool || participant.status === 'pending') {
        await prisma.testParticipant.update({
          where: { id: participantId },
          data: {
            status: 'in_progress',
            currentTest: normalizedTool,
            startTime: participant.startTime || new Date(),
          }
        }).catch(() => {});
      }
      return { deducted: false, alreadyDeducted: true, tool: normalizedTool };
    }

    const participantLabel = participant.user?.name || participant.user?.username || `Kandidat #${participant.userId}`;
    const testTitle = participant.test?.title || `Sesi #${participant.testId}`;

    // Eksekusi pemotongan kuota 1 Single Test secara atomik
    const result = await prisma.$transaction(async (tx) => {
      // Kunci dan ambil saldo klien
      const client = await tx.user.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          quotaSingle: true,
          usedQuotas: true,
        }
      });

      const currentSingle = client?.quotaSingle ?? 0;
      const balanceAfter = Math.max(0, currentSingle - 1);

      // Sinkronkan usedQuotas
      let used: Record<string, number> = {};
      if (client?.usedQuotas) {
        try {
          used = JSON.parse(client.usedQuotas);
        } catch {
          used = {};
        }
      }
      used.total = (used.total !== undefined ? Number(used.total) : 0) + 1;
      used[normalizedTool] = (used[normalizedTool] || 0) + 1;

      // 1. Update saldo Single Test klien
      await tx.user.update({
        where: { id: clientId },
        data: {
          quotaSingle: balanceAfter,
          usedQuotas: JSON.stringify(used),
        }
      });

      // 2. Catat riwayat audit di QuotaLedger
      await tx.quotaLedger.create({
        data: {
          clientId,
          quotaType: 'SINGLE',
          transactionType: 'USAGE',
          amount: -1,
          balanceAfter,
          testId: participant.testId,
          referenceDoc: toolRefDoc,
          notes: `Pemotongan kuota Single Test: Peserta ${participantLabel} memulai alat tes ${normalizedTool} (Sesi: ${testTitle})`,
        }
      });

      // 3. Update status dan currentTest peserta
      const updatedPart = await tx.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          currentTest: normalizedTool,
          startTime: participant.startTime || new Date(),
        }
      });

      return { deducted: true, balanceAfter, tool: normalizedTool, participant: updatedPart };
    });

    return result;
  } catch (error) {
    console.error(`Error in deductToolQuotaOnStart for tool ${rawToolName}:`, error);
    try {
      await prisma.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          currentTest: normalizedTool,
          startTime: new Date(),
        }
      });
    } catch {}
    return null;
  }
}
