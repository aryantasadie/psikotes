import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  try {
    // 1. Pastikan tabel _supabase_keepalive ada di PostgreSQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_supabase_keepalive" (
        "id" SERIAL PRIMARY KEY,
        "note" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Buat data dummy
    const noteText = `keepalive-api-${Date.now()}`;
    const insertResult = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "_supabase_keepalive" ("note", "created_at")
      VALUES ($1, NOW())
      RETURNING "id", "note", "created_at";
    `, noteText);

    const createdRecord = insertResult && insertResult[0];

    // 3. Langsung hapus data dummy tersebut
    let deletedCount = 0;
    if (createdRecord?.id) {
      deletedCount = await prisma.$executeRawUnsafe(`
        DELETE FROM "_supabase_keepalive" WHERE "id" = $1;
      `, createdRecord.id);
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "_supabase_keepalive";`);
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase keepalive ping successful: dummy data created and immediately deleted.',
      createdRecord,
      deletedCount,
      timestamp,
    });
  } catch (error: any) {
    console.error('[KeepAlive API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Keepalive execution failed',
        timestamp,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
