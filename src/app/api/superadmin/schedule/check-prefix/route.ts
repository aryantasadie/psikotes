import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !['superadmin', 'tester', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawPrefix = searchParams.get('prefix');

    if (!rawPrefix || !rawPrefix.trim()) {
      return NextResponse.json({ exists: false, message: 'Prefix kosong' });
    }

    const cleanPrefix = rawPrefix.toLowerCase().trim().replace(/_+$/, '');

    // Find existing testee users with this prefix
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: `${cleanPrefix}_`,
          mode: 'insensitive',
        },
        role: 'testee',
      },
      select: {
        id: true,
        username: true,
        participants: {
          select: {
            test: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },
        },
      },
    });

    let maxIndex = 0;
    const batchMap = new Map<number, { id: number; title: string; formattedDate: string }>();

    users.forEach((u) => {
      if (u.username.toLowerCase().startsWith(`${cleanPrefix}_`)) {
        const numPart = u.username.slice(cleanPrefix.length + 1);
        if (/^\d+$/.test(numPart)) {
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxIndex) {
            maxIndex = num;
          }
        }
      }

      u.participants.forEach((tp) => {
        if (tp.test) {
          const rawDate = tp.test.startDate;
          const formattedDate = rawDate
            ? new Date(rawDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-';

          batchMap.set(tp.test.id, {
            id: tp.test.id,
            title: tp.test.title,
            formattedDate,
          });
        }
      });
    });

    const exists = maxIndex > 0;
    const nextNumber = maxIndex + 1;
    const lastUsername = exists ? `${cleanPrefix}_${maxIndex.toString().padStart(3, '0')}` : null;
    const nextUsername = `${cleanPrefix}_${nextNumber.toString().padStart(3, '0')}`;

    return NextResponse.json({
      exists,
      prefix: cleanPrefix,
      totalExisting: users.length,
      lastNumber: maxIndex,
      nextNumber,
      lastUsername,
      nextUsername,
      batches: Array.from(batchMap.values()),
    });
  } catch (error: any) {
    console.error('Error checking prefix:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengecek prefix' }, { status: 500 });
  }
}
