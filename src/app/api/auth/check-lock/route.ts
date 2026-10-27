import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.trim();

    if (!username) {
      return NextResponse.json({ isLocked: false });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' }
      },
      select: {
        id: true,
        isPermanentLocked: true,
        lockedUntil: true,
        failedAttempts: true,
      }
    });

    if (!user) {
      return NextResponse.json({ isLocked: false });
    }

    if (user.isPermanentLocked) {
      return NextResponse.json({
        isLocked: true,
        lockType: 'permanent',
        message: 'Akun terkunci secara permanen. Silakan hubungi Superadmin.',
      });
    }

    if (user.lockedUntil) {
      const now = Date.now();
      const lockTime = new Date(user.lockedUntil).getTime();
      if (lockTime > now) {
        const remainingSeconds = Math.ceil((lockTime - now) / 1000);
        return NextResponse.json({
          isLocked: true,
          lockType: 'temporary',
          remainingSeconds,
        });
      }
    }

    return NextResponse.json({
      isLocked: false,
      lockType: 'none',
      failedAttempts: user.failedAttempts,
    });
  } catch (e: any) {
    return NextResponse.json({ isLocked: false });
  }
}
