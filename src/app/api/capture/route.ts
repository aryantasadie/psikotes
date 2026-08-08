import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';


export async function POST(req: Request) {
  try {
    const { image, participantId, logType } = await req.json();

    if (!image || !participantId || !logType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strip the base64 prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create uploads directory safely
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'keamanan');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${participantId}_${logType}_${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Save image to local disk
    fs.writeFileSync(filepath, buffer);

    const mediaUrl = `/uploads/keamanan/${filename}`;

    // Save log to Prisma SQLite database
    const log = await prisma.securityLog.create({
      data: {
        participantId: parseInt(participantId, 10),
        logType,
        mediaUrl
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error in capture API:', error);
    return NextResponse.json({ error: 'Failed to process capture' }, { status: 500 });
  }
}
