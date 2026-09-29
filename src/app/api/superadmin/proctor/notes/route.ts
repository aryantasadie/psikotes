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
    const participantId = searchParams.get('participantId');

    const whereClause: any = { logType: 'proctor_note' };
    if (participantId) {
      whereClause.participantId = parseInt(participantId, 10);
    }

    const notes = await prisma.securityLog.findMany({
      where: whereClause,
      include: {
        participant: {
          include: {
            user: {
              select: { name: true, username: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching proctor notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !['superadmin', 'tester', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized: Akses ditolak' }, { status: 401 });
    }

    const body = await req.json();
    const { participantId, note } = body;

    if (!participantId || !note || typeof note !== 'string' || !note.trim()) {
      return NextResponse.json({ error: 'participantId dan catatan wajib diisi' }, { status: 400 });
    }

    const safeParticipantId = parseInt(String(participantId), 10);
    if (isNaN(safeParticipantId)) {
      return NextResponse.json({ error: 'participantId tidak valid' }, { status: 400 });
    }

    const authorName = session.user?.name || 'Pengawas';
    const formattedNote = `[${authorName}] ${note.trim()}`;

    const newLog = await prisma.securityLog.create({
      data: {
        participantId: safeParticipantId,
        logType: 'proctor_note',
        mediaUrl: formattedNote,
      },
    });

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error('Error saving proctor note:', error);
    return NextResponse.json({ error: 'Gagal menyimpan catatan pengawas' }, { status: 500 });
  }
}
