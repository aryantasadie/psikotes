import { prisma } from '@/lib/prisma';

/**
 * Memulai status pengerjaan peserta dan memotong kuota B2B (anti-ghosting).
 * Sesuai Dokumen Spesifikasi Teknis: Skema Ticketing & Dual-Wallet B2B Psikotes HRP:
 * - Titik Pemotongan: Kuota baru terpotong (-1) secara permanen saat kandidat menekan "Mulai Tes" (pending -> in_progress).
 * - Dua Dompet Kuota (Dual-Wallet):
 *     1. 'PACKAGE' (Mode Asesmen Jabatan / Dengan Lembar Psikogram)
 *     2. 'SINGLE'  (Mode Tes Bebas / Mandiri Tanpa Psikogram)
 * - Pencatatan Buku Besar (QuotaLedger) untuk audit trail non-finansial yang aman.
 * - Proteksi Disconnect / Refresh: Jika status sudah bukan 'pending', kuota TIDAK terpotong ulang.
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

    // Jika peserta sudah pernah dimulai atau selesai, proteksi agar tidak potong kuota ganda
    if (participant.status !== 'pending') {
      return participant;
    }

    const clientId = participant.test?.clientId;

    // Jika tes ini bukan milik klien B2B (misal tes mandiri internal / non-klien)
    if (!clientId) {
      return await prisma.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          startTime: participant.startTime || new Date(),
        }
      });
    }

    // Tentukan tipe kuota yang dikonsumsi
    // PACKAGE: Memiliki formasi jabatan, preset psikogram, atau bukan mode "Tes Bebas (Tanpa Psikogram)"
    const isSingleTest = 
      participant.test?.specification === 'Tes Bebas (Tanpa Psikogram)' ||
      (!participant.test?.jobPositionId && !participant.test?.psychographPresetId);
    
    const quotaType: 'PACKAGE' | 'SINGLE' = isSingleTest ? 'SINGLE' : 'PACKAGE';
    const participantLabel = participant.user?.name || participant.user?.username || `Kandidat #${participant.userId}`;
    const testTitle = participant.test?.title || `Sesi #${participant.testId}`;

    // Gunakan prisma transaction agar atomik dan aman di database bersama (shared DB)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data klien dengan lock
      const client = await tx.user.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          quotaPackage: true,
          quotaSingle: true,
          quotaExpiredAt: true,
          testQuotas: true,
          usedQuotas: true,
        }
      });

      let currentPackage = client?.quotaPackage ?? 0;
      let currentSingle = client?.quotaSingle ?? 0;

      // Migrasi on-the-fly jika klien lama belum punya saldo di kolom baru
      if (currentPackage === 0 && currentSingle === 0 && client?.testQuotas) {
        try {
          const q: any = JSON.parse(client.testQuotas);
          const totalQ = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
          let totalU = 0;
          if (client.usedQuotas) {
            const u: any = JSON.parse(client.usedQuotas);
            totalU = u.total !== undefined ? Number(u.total) : 0;
          }
          currentPackage = Math.max(0, totalQ - totalU);
        } catch {
          currentPackage = 0;
        }
      }

      // Hitung saldo baru
      let balanceAfter = 0;
      let updateClientData: any = {};

      if (quotaType === 'PACKAGE') {
        balanceAfter = Math.max(0, currentPackage - 1);
        updateClientData.quotaPackage = balanceAfter;
      } else {
        balanceAfter = Math.max(0, currentSingle - 1);
        updateClientData.quotaSingle = balanceAfter;
      }

      // Selaraskan juga usedQuotas (backward compatibility)
      let used: Record<string, number> = {};
      if (client?.usedQuotas) {
        try {
          used = JSON.parse(client.usedQuotas);
        } catch {
          used = {};
        }
      }
      used.total = (used.total !== undefined ? Number(used.total) : 0) + 1;
      const spec = participant.test?.specification || participant.test?.jobPosition?.name || (isSingleTest ? 'Tes Mandiri' : 'Asesmen Jabatan');
      used[spec] = (used[spec] || 0) + 1;
      updateClientData.usedQuotas = JSON.stringify(used);

      // 2. Update saldo klien
      await tx.user.update({
        where: { id: clientId },
        data: updateClientData
      });

      // 3. Catat di Buku Besar QuotaLedger
      await tx.quotaLedger.create({
        data: {
          clientId,
          quotaType,
          transactionType: 'USAGE',
          amount: -1,
          balanceAfter,
          testId: participant.testId,
          notes: `Penggunaan kuota ${quotaType === 'PACKAGE' ? 'Paket Asesmen' : 'Single Test'} oleh ${participantLabel} (Sesi: ${testTitle})`,
        }
      });

      // 4. Update status peserta menjadi in_progress
      const updatedParticipant = await tx.testParticipant.update({
        where: { id: participantId },
        data: {
          status: 'in_progress',
          startTime: participant.startTime || new Date(),
        }
      });

      return updatedParticipant;
    });

    return result;
  } catch (error) {
    console.error('Error in markParticipantStarted:', error);
    // Fallback: Jika terjadi error transaksi kuota, jangan gagalkan kandidat memulai ujian
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
