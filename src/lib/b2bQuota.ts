import { prisma } from '@/lib/prisma';

/**
 * Memulai status pengerjaan peserta dan memotong kuota B2B (anti-ghosting).
 * Kuota hanya terpotong jika peserta berstatus 'pending' dan benar-benar mulai mengerjakan ujian.
 * 1 Kuota = 1 Sesi Asesmen Lengkap untuk 1 Kandidat.
 */
export async function markParticipantStarted(participantId: number) {
  if (!participantId || isNaN(participantId)) return null;

  try {
    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            clientId: true,
            sequence: true,
            specification: true,
            jobPositionId: true,
            jobPosition: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!participant) return null;

    // Jika peserta sudah pernah dimulai atau selesai, jangan potong ulang kuota
    if (participant.status !== 'pending') {
      return participant;
    }

    // 1. Ubah status peserta menjadi in_progress
    const updatedParticipant = await prisma.testParticipant.update({
      where: { id: participantId },
      data: {
        status: 'in_progress',
        startTime: participant.startTime || new Date(),
      }
    });

    // 2. Jika sesi ini milik klien B2B (clientId ada), potong kuota mitra
    const clientId = participant.test?.clientId;
    if (clientId) {
      const client = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, license: true, usedQuotas: true, testQuotas: true }
      });

      if (client) {
        let used: Record<string, number> = {};
        if (client.usedQuotas) {
          try {
            used = JSON.parse(client.usedQuotas);
          } catch {
            used = {};
          }
        }

        // Potong kuota total
        used.total = (used.total !== undefined ? Number(used.total) : 0) + 1;

        // Potong juga per nama spesifikasi jika ada
        const spec = participant.test?.specification || participant.test?.jobPosition?.name;
        if (spec) {
          used[spec] = (used[spec] || 0) + 1;
        }

        await prisma.user.update({
          where: { id: client.id },
          data: {
            usedQuotas: JSON.stringify(used)
          }
        });
      }
    }

    return updatedParticipant;
  } catch (error) {
    console.error('Error in markParticipantStarted:', error);
    return null;
  }
}
