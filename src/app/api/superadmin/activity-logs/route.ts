import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus Superadmin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const status = searchParams.get('status'); // 'SUCCESS' | 'FAILED'
    const reason = searchParams.get('reason');
    const search = searchParams.get('search')?.trim();

    const where: any = {};

    if (status && ['SUCCESS', 'FAILED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    if (reason && reason !== 'ALL') {
      where.reason = reason;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.accountActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accountActivityLog.count({ where }),
    ]);

    // Calculate quick stats for header cards
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalAttempts, todayAttempts, successCount, failedCount, lockedOrInactiveCount] = await Promise.all([
      prisma.accountActivityLog.count(),
      prisma.accountActivityLog.count({
        where: { createdAt: { gte: startOfToday } }
      }),
      prisma.accountActivityLog.count({
        where: { status: 'SUCCESS' }
      }),
      prisma.accountActivityLog.count({
        where: { status: 'FAILED' }
      }),
      prisma.accountActivityLog.count({
        where: {
          reason: { in: ['ACCOUNT_LOCKED', 'ACCOUNT_INACTIVE'] }
        }
      })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalAttempts,
        todayAttempts,
        successCount,
        failedCount,
        lockedOrInactiveCount,
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus Superadmin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(days) || days < 7) {
      return NextResponse.json({ error: 'Minimal retensi log adalah 7 hari untuk alasan audit' }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.accountActivityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Berhasil menghapus ${result.count} data log yang lebih dari ${days} hari yang lalu.`
    });
  } catch (error: any) {
    console.error('Error pruning activity logs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
