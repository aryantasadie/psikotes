import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
    }

    const body = await req.json();
    const userId = Number(body?.userId);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid' }, { status: 400 });
    }

    // Reset status lockout user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        isPermanentLocked: false,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil membuka kunci akun ${updatedUser.name} (${updatedUser.username})`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error unlocking user:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuka kunci akun' }, { status: 500 });
  }
}
