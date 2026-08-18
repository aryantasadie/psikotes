import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const role = token.role as string;

    // Route protections based on role
    if (path.startsWith("/superadmin") && !["superadmin", "tester", "psikolog"].includes(role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (path.startsWith("/testee") && role !== "testee" && role !== "user") {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Existing test routes like /tes/wpt or /tes/cfit1 should only be accessible by testee or user
    if (path.startsWith("/tes/") && role !== "testee" && role !== "user") {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/', // Will be customized per role later if needed
    }
  }
);

export const config = {
  matcher: [
    "/superadmin/:path*", 
    "/testee/:path*",
    "/tes/:path*"
  ],
};
