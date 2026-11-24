import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Superadmin yang dapat melakukan top-up kuota.' }, { status: 403 });
    }

    const { id } = await context.params;
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'ID klien tidak valid.' }, { status: 400 });
    }

    const body = await reqBody(request);
    const { quotaType, amount, referenceDoc, expiredAt, notes } = body;

    if (!['PACKAGE', 'SINGLE'].includes(quotaType)) {
      return NextResponse.json({ error: 'Tipe kuota harus PACKAGE atau SINGLE.' }, { status: 400 });
    }

    const nAmount = parseInt(amount, 10);
    if (isNaN(nAmount) || nAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah kuota top-up harus berupa angka positif.' }, { status: 400 });
    }

    if (!referenceDoc || !referenceDoc.trim()) {
      return NextResponse.json({ error: 'Nomor PO / Referensi Kontrak administratif wajib diisi.' }, { status: 400 });
    }

    if (!expiredAt) {
      return NextResponse.json({ error: 'Tanggal kedaluwarsa paket wajib diisi.' }, { status: 400 });
    }

    const newExpiredDate = new Date(expiredAt);
    if (isNaN(newExpiredDate.getTime())) {
      return NextResponse.json({ error: 'Format tanggal kedaluwarsa tidak valid.' }, { status: 400 });
    }

    // Eksekusi transaksi atomik di DB
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.user.findUnique({
        where: { id: clientId, role: 'client' },
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

      const now = new Date();
      const currentExpired = client.quotaExpiredAt ? new Date(client.quotaExpiredAt) : null;
      const isExpired = currentExpired !== null && currentExpired < now;

      let currentPackage = client.quotaPackage ?? 0;
      let currentSingle = client.quotaSingle ?? 0;

      // Migrasi on-the-fly untuk klien lama jika belum tercatat di kolom baru
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

      let prevBalance = quotaType === 'PACKAGE' ? currentPackage : currentSingle;
      let newBalance = 0;

      if (isExpired && prevBalance > 0) {
        // KASUS B: Top-up setelah kedaluwarsa - Hangus Kaku (Reset saldo lama)
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType,
            transactionType: 'EXPIRED',
            amount: -prevBalance,
            balanceAfter: 0,
            referenceDoc: referenceDoc.trim(),
            notes: `Sisa saldo hangus otomatis karena melewati batas kedaluwarsa (${currentExpired?.toLocaleDateString('id-ID')}).`,
          }
        });

        // Top up saldo murni dari awal
        newBalance = nAmount;
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType,
            transactionType: 'TOPUP',
            amount: nAmount,
            balanceAfter: newBalance,
            referenceDoc: referenceDoc.trim(),
            notes: notes?.trim() || 'Top-up baru setelah masa aktif kedaluwarsa.',
          }
        });
      } else {
        // KASUS A: Top-up sebelum kedaluwarsa / Fresh - Rollover Aktif (Akumulasi)
        newBalance = prevBalance + nAmount;
        await tx.quotaLedger.create({
          data: {
            clientId: client.id,
            quotaType,
            transactionType: 'TOPUP',
            amount: nAmount,
            balanceAfter: newBalance,
            referenceDoc: referenceDoc.trim(),
            notes: notes?.trim() || (prevBalance > 0 ? 'Top-up rollover akumulatif.' : 'Alokasi kuota awal.'),
          }
        });
      }

      // Update data User
      const updateData: any = {
        quotaExpiredAt: newExpiredDate,
      };

      if (quotaType === 'PACKAGE') {
        updateData.quotaPackage = newBalance;
      } else {
        updateData.quotaSingle = newBalance;
      }

      // Sync testQuotas untuk kompatibilitas backward
      const syncTotal = (quotaType === 'PACKAGE' ? newBalance : currentPackage) +
                        (quotaType === 'SINGLE' ? newBalance : currentSingle);
      let existingQ: any = {};
      try {
        existingQ = client.testQuotas ? JSON.parse(client.testQuotas) : {};
      } catch {
        existingQ = {};
      }
      existingQ.total = syncTotal;
      updateData.testQuotas = JSON.stringify(existingQ);

      const updatedUser = await tx.user.update({
        where: { id: clientId },
        data: updateData,
        select: {
          id: true,
          name: true,
          quotaPackage: true,
          quotaSingle: true,
          quotaExpiredAt: true,
        }
      });

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: `Top-up ${nAmount} kuota ${quotaType === 'PACKAGE' ? 'Paket Asesmen' : 'Single Test'} berhasil dicatat.`,
      client: result,
    });
  } catch (error: any) {
    console.error('Error topup client quota:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses top-up kuota.' }, { status: 500 });
  }
}

async function reqBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
