const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runKeepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [KeepAlive] Starting Supabase keep-alive ping...`);

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
    const noteText = `keepalive-ping-${Date.now()}`;
    const insertResult = await prisma.$queryRawUnsafe(`
      INSERT INTO "_supabase_keepalive" ("note", "created_at")
      VALUES ($1, NOW())
      RETURNING "id", "note", "created_at";
    `, noteText);

    const createdRecord = insertResult && insertResult[0];
    console.log(`[${timestamp}] [KeepAlive] Data dummy berhasil dibuat:`, createdRecord);

    // 3. Langsung hapus data dummy tersebut
    if (createdRecord && createdRecord.id) {
      const deletedCount = await prisma.$executeRawUnsafe(`
        DELETE FROM "_supabase_keepalive" WHERE "id" = $1;
      `, createdRecord.id);
      console.log(`[${timestamp}] [KeepAlive] Data dummy ID ${createdRecord.id} berhasil dihapus (${deletedCount} baris terhapus).`);
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "_supabase_keepalive";`);
      console.log(`[${timestamp}] [KeepAlive] Tabel _supabase_keepalive telah dibersihkan.`);
    }

    // 4. Pastikan tabel tetap bersih
    const remainingCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM "_supabase_keepalive";
    `);
    const count = remainingCount && remainingCount[0] ? remainingCount[0].count : 0;
    console.log(`[${timestamp}] [KeepAlive] Sisa baris di tabel _supabase_keepalive: ${count}`);

    console.log(`[${timestamp}] [KeepAlive] SUCCESS: Ping Supabase berhasil, database tetap aktif dan tidak akan dipause!`);
    return { success: true, createdRecord, remainingRows: count };
  } catch (error) {
    console.error(`[${timestamp}] [KeepAlive] ERROR executing keepalive:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runKeepAlive()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runKeepAlive };
