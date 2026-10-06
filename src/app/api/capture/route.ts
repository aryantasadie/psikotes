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

    // Case 2: Image capture (Initial & 10min camera photos - Max 1x each per participant)
    if (image && typeof image === 'string') {
      // Ensure only 1x snapshot for initial and 10-minute checkpoints
      if (safeLogType === 'camera_awal' || safeLogType === 'camera_10min') {
        const existingPhoto = await prisma.securityLog.findFirst({
          where: {
            participantId: safeParticipantId,
            logType: safeLogType
          }
        });
        if (existingPhoto) {
          return NextResponse.json({ success: true, message: `Photo ${safeLogType} sudah tersimpan (1x only)`, log: existingPhoto });
        }
      }

      // Strip the base64 prefix if needed
      const rawBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
      const buffer = Buffer.from(rawBase64, 'base64');

      // Enforce 2MB size limit
      if (buffer.length > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran gambar melebihi batas 2MB' }, { status: 400 });
      }

      // Format as standard data URL so it works seamlessly on Vercel and VPS
      const mediaDataUrl = `data:image/jpeg;base64,${rawBase64}`;

      // Best effort optional disk write for VPS/local dev (never throw on read-only serverless)
      try {
        const uploadDir = path.join(process.cwd(), 'private_uploads', 'keamanan');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${safeParticipantId}_${safeLogType}_${Date.now()}.jpg`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
      } catch (fsErr) {
        // Expected on Vercel read-only filesystem, silently continue using database mediaDataUrl
      }

      // Save log to Prisma database
      const log = await prisma.securityLog.create({
        data: {
          participantId: safeParticipantId,
          logType: safeLogType,
          mediaUrl: mediaDataUrl
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
