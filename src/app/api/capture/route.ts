import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const { image, text, participantId, logType } = await req.json();

    if ((!image && !text) || !participantId || !logType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeParticipantId = parseInt(participantId, 10);
    if (isNaN(safeParticipantId)) {
      return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const userRole = (session.user as any).role;

    if (userRole === 'testee' || userRole === 'user') {
      const participant = await prisma.testParticipant.findFirst({
        where: { id: safeParticipantId, userId }
      });
      if (!participant) {
        return NextResponse.json({ error: 'Forbidden: Akses tidak sah untuk peserta ini' }, { status: 403 });
      }
    }

    // Sanitize logType
    const safeLogType = String(logType || 'proctoring').replace(/[^a-zA-Z0-9_-]/g, '');

    // Case 1: Text-only log (e.g. Violation log without file)
    if (text && typeof text === 'string') {
      const log = await prisma.securityLog.create({
        data: {
          participantId: safeParticipantId,
          logType: safeLogType,
          mediaUrl: text.trim()
        }
      });
      return NextResponse.json({ success: true, log });
    }

    // Case 2: Image capture (Initial & 10min camera photos)
    if (image && typeof image === 'string') {
      // Strip the base64 prefix
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Enforce 2MB size limit
      if (buffer.length > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran gambar melebihi batas 2MB' }, { status: 400 });
      }

      // Simpan di luar public agar tidak bisa dibuka lewat URL publik (private_uploads)
      const uploadDir = path.join(process.cwd(), 'private_uploads', 'keamanan');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${safeParticipantId}_${safeLogType}_${Date.now()}.jpg`;
      const filepath = path.join(uploadDir, filename);

      // Save image to private local disk
      fs.writeFileSync(filepath, buffer);

      const mediaUrl = `/api/uploads/keamanan/${filename}`;

      // Save log to Prisma database
      const log = await prisma.securityLog.create({
        data: {
          participantId: safeParticipantId,
          logType: safeLogType,
          mediaUrl
        }
      });

      return NextResponse.json({ success: true, log });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error) {
    console.error('Error in capture API:', error);
    return NextResponse.json({ error: 'Failed to process capture' }, { status: 500 });
  }
}
