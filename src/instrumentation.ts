export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Jalankan auto-keepalive hanya saat server berjalan (bukan saat static generation/build)
    try {
      const { prisma } = await import('@/lib/prisma');

      const pingKeepAlive = async () => {
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "_supabase_keepalive" (
              "id" SERIAL PRIMARY KEY,
              "note" TEXT NOT NULL,
              "created_at" TIMESTAMPTZ DEFAULT NOW()
            );
          `);

          const note = `auto-keepalive-${Date.now()}`;
          const res = await prisma.$queryRawUnsafe<any[]>(`
            INSERT INTO "_supabase_keepalive" ("note", "created_at")
            VALUES ($1, NOW())
            RETURNING "id";
          `, note);

          if (res && res[0]?.id) {
            await prisma.$executeRawUnsafe(`
              DELETE FROM "_supabase_keepalive" WHERE "id" = $1;
            `, res[0].id);
          } else {
            await prisma.$executeRawUnsafe(`DELETE FROM "_supabase_keepalive";`);
          }

          console.log(`[Instrumentation] [${new Date().toISOString()}] Supabase auto-keepalive ping executed.`);
        } catch (err) {
          console.error('[Instrumentation] Supabase keepalive error:', err);
        }
      };

      // Ping pertama kali 30 detik setelah server hidup
      const initialTimer = setTimeout(pingKeepAlive, 30 * 1000);
      initialTimer.unref();

      // Rutin ping setiap 24 jam
      const dailyTimer = setInterval(pingKeepAlive, 24 * 60 * 60 * 1000);
      dailyTimer.unref();
    } catch (e) {
      console.error('[Instrumentation] Register error:', e);
    }
  }
}
