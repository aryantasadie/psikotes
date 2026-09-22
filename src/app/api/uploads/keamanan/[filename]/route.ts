import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // 1. Validasi Autentikasi Pengawas
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['superadmin', 'tester', 'psikolog'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Khusus staf pengawas ujian' }, { status: 403 });
    }

    // 2. Sanitasi Nama File (Mencegah Path Traversal)
    const { filename } = await params;
    const safeFilename = path.basename(filename);
    
    // Check private_uploads first, fallback to public uploads if migrating
    let filePath = path.join(process.cwd(), 'private_uploads', 'keamanan', safeFilename);
    if (!fs.existsSync(filePath)) {
      const legacyPath = path.join(process.cwd(), 'public', 'uploads', 'keamanan', safeFilename);
      if (fs.existsSync(legacyPath)) {
        filePath = legacyPath;
      } else {
        return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
      }
    }

    // 3. Baca dan Stream Gambar
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error: any) {
    console.error('Error serving private image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
