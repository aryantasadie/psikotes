import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Rasio Resmi Spesifikasi: 1 Kuota Paket Asesmen = 3 Kuota Single Test
const RATIO = 3;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Number((session.user as any).id);
    const body = await req.json();
    const { direction, amount } = body;

    const nAmount = parseInt(amount, 10);
    if (isNaN(nAmount) || nAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah konversi harus berupa angka positif.' }, { status: 400 });
    }

    if (!['PACKAGE_TO_SINGLE', 'SINGLE_TO_PACKAGE'].includes(direction)) {
      return NextResponse.json({ error: 'Arah konversi tidak valid.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
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

      if (!client) {
        throw new Error('Klien tidak ditemukan.');
      }

      // Periksa masa aktif
      const now = new Date();
      if (client.quotaExpiredAt && new Date(client.quotaExpiredAt) < now) {
        throw new Error('Masa aktif kuota Anda telah kedaluwarsa. Silakan hubungi Superadmin untuk perpanjangan.');
      }

      let currentPackage = client.quotaPackage ?? 0;
      let currentSingle = client.quotaSingle ?? 0;

      // Migrasi on-the-fly jika saldo baru masih 0
      if (currentPackage === 0 && currentSingle === 0 && client.testQuotas) {
        try {
          const q: any = JSON.parse(client.testQuotas);
          const totalQ = q.total !== undefined ? Number(q.total) : (Object.values(q).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number);
          let totalU = 0;
          if (client.usedQuotas) {
            const u: any = JSON.parse(client.usedQuotas);
            totalU = u.total !== undefined ? Number(u.total) : 0;
          }
          currentPackage = Math.max(0, totalQ - totalU);
        } catch {}
      }

      let newPackage = currentPackage;
      let newSingle = currentSingle;

      if (direction === 'PACKAGE_TO_SINGLE') {
        // Konversi X Paket -> (X * 3) Single
        if (currentPackage < nAmount) {
          throw new Error(`Saldo Kuota Paket tidak mencukupi (Tersedia: ${currentPackage}, Dibutuhkan: ${nAmount}).`);
        }

        newPackage = currentPackage - nAmount;
        newSingle = currentSingle + (nAmount * RATIO);

        // Catat mutasi pengurangan Paket
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType: 'PACKAGE',
            transactionType: 'CONVERT',
            amount: -nAmount,
            balanceAfter: newPackage,
            notes: `Konversi ${nAmount} Kuota Paket Asesmen menjadi ${nAmount * RATIO} Kuota Single Test.`,
          }
        });

        // Catat mutasi penambahan Single
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType: 'SINGLE',
            transactionType: 'CONVERT',
            amount: nAmount * RATIO,
            balanceAfter: newSingle,
            notes: `Hasil penukaran dari ${nAmount} Kuota Paket Asesmen (Rasio 1 : 3).`,
          }
        });
      } else {
        // Konversi (Y * 3) Single -> Y Paket
        const requiredSingle = nAmount * RATIO;
        if (currentSingle < requiredSingle) {
          throw new Error(`Saldo Kuota Single tidak mencukupi (Tersedia: ${currentSingle}, Dibutuhkan: ${requiredSingle} untuk mendapatkan ${nAmount} Paket).`);
        }

        newSingle = currentSingle - requiredSingle;
        newPackage = currentPackage + nAmount;

        // Catat mutasi pengurangan Single
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType: 'SINGLE',
            transactionType: 'CONVERT',
            amount: -requiredSingle,
            balanceAfter: newSingle,
            notes: `Konversi ${requiredSingle} Kuota Single Test menjadi ${nAmount} Kuota Paket Asesmen.`,
          }
        });

        // Catat mutasi penambahan Paket
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType: 'PACKAGE',
            transactionType: 'CONVERT',
            amount: nAmount,
            balanceAfter: newPackage,
            notes: `Hasil penukaran dari ${requiredSingle} Kuota Single Test (Rasio 3 : 1).`,
          }
        });
      }

      // Update User
      const updatedUser = await tx.user.update({
        where: { id: clientId },
        data: {
          quotaPackage: newPackage,
          quotaSingle: newSingle,
        },
        select: {
          id: true,
          quotaPackage: true,
          quotaSingle: true,
          quotaExpiredAt: true,
        }
      });

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: direction === 'PACKAGE_TO_SINGLE'
        ? `Berhasil menukar ${nAmount} Kuota Paket menjadi ${nAmount * RATIO} Kuota Single Test.`
        : `Berhasil menukar ${nAmount * RATIO} Kuota Single menjadi ${nAmount} Kuota Paket Asesmen.`,
      quota: result,
    });
  } catch (error: any) {
    console.error('Error in quota conversion:', error);
    return NextResponse.json({ error: error.message || 'Gagal melakukan konversi kuota.' }, { status: 400 });
  }
}
