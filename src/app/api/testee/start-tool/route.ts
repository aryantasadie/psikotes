import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { deductToolQuotaOnStart } from '@/lib/b2bQuota';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'testee' && userRole !== 'user')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const body = await req.json().catch(() => ({}));
    const tool = String(body.tool || '').trim();

    if (!tool) {
      return NextResponse.json({ error: 'Nama alat tes wajib diisi' }, { status: 400 });
    }

    // Ambil data participant paling baru untuk testee ini
    const participant = await prisma.testParticipant.findFirst({
      where: { userId },
      orderBy: { id: 'desc' }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Data peserta ujian tidak ditemukan' }, { status: 404 });
    }

    if (participant.status === 'completed' || participant.status === 'stopped') {
      return NextResponse.json({ message: 'Ujian sudah berakhir' });
    }

    // Jalankan pemotongan kuota Single Test proporsional & atomik (jika mode Single Test)
    const result = await deductToolQuotaOnStart(participant.id, tool);

    return NextResponse.json({
      success: true,
      tool,
      result
    });
  } catch (error) {
    console.error('Error in /api/testee/start-tool:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
