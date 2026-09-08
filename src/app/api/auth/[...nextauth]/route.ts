import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest } from "next/server";

const authHandler = NextAuth(authOptions);

const handler = async (
  req: NextRequest,
  ctx: { params?: Promise<{ nextauth?: string[] }> | { nextauth?: string[] } }
) => {
  const resolvedParams = ctx?.params ? await ctx.params : undefined;
  return authHandler(req as any, { params: resolvedParams } as any);
};

export const dynamic = "force-dynamic";
export { handler as GET, handler as POST };


