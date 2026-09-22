import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isApi = path.startsWith("/api/");

    // 1. Jika tidak ada sesi/token
    if (!token) {
      if (isApi) {
        return NextResponse.json(
          { error: "Unauthorized: Sesi tidak ditemukan atau kedaluwarsa" }, 
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    const role = (token.role as string) || "";

    // 2. Proteksi Rute Superadmin & Staf
    if ((path.startsWith("/superadmin") || path.startsWith("/api/superadmin")) && 
        !["superadmin", "tester", "psikolog"].includes(role)) {
      if (isApi) {
        return NextResponse.json({ error: "Forbidden: Akses ditolak untuk role ini" }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 3. Proteksi Rute Ujian & Peserta
    if ((path.startsWith("/testee") || path.startsWith("/tes/") || path.startsWith("/api/testee")) && 
        role !== "testee" && role !== "user") {
      if (isApi) {
        return NextResponse.json({ error: "Forbidden: Khusus peserta tes aktif" }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 4. Proteksi PDF Report (Hanya staf atau klien)
    if (path.startsWith("/report-pdf") && !["superadmin", "tester", "psikolog", "client"].includes(role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 5. Proteksi Stream Feed & SSE (Hanya pengawas/staf)
    if ((path.startsWith("/api/stream/feed") || path.startsWith("/api/stream/sse")) && 
        !["superadmin", "tester", "psikolog"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Akses stream khusus pengawas" }, { status: 403 });
    }

    // 6. Proteksi Uploads Privat (Khusus staf)
    if (path.startsWith("/api/uploads") && 
        !["superadmin", "tester", "psikolog"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Khusus staf pengawas ujian" }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Untuk API route, izinkan lewat ke fungsi middleware agar bisa merespons JSON 401 (bukan redirect)
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: '/',
    }
  }
);

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/testee/:path*",
    "/tes/:path*",
    "/report-pdf/:path*",
    "/api/superadmin/:path*",
    "/api/testee/:path*",
    "/api/stream/feed",
    "/api/stream/sse",
    "/api/uploads/:path*",
  ],
};
