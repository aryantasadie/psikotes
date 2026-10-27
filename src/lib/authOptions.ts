import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "masukkan username..." },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Extract IP & User-Agent safely
        let ipAddress: string | null = null;
        let userAgent: string | null = null;

        if (req?.headers) {
          if (typeof (req.headers as any).get === 'function') {
            const h = req.headers as any;
            ipAddress = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
            userAgent = h.get('user-agent') || null;
          } else {
            const h = req.headers as Record<string, any>;
            const xf = h['x-forwarded-for'];
            const xr = h['x-real-ip'];
            const ua = h['user-agent'];
            ipAddress = (Array.isArray(xf) ? xf[0] : typeof xf === 'string' ? xf.split(',')[0].trim() : (typeof xr === 'string' ? xr : null)) || null;
            userAgent = (Array.isArray(ua) ? ua[0] : typeof ua === 'string' ? ua : null) || null;
          }
        }

        const logActivity = async (data: {
          userId?: number;
          username: string;
          name?: string | null;
          role?: string | null;
          status: 'SUCCESS' | 'FAILED';
          reason: string;
        }) => {
          try {
            await prisma.accountActivityLog.create({
              data: {
                userId: data.userId,
                username: data.username,
                name: data.name,
                role: data.role,
                status: data.status,
                reason: data.reason,
                ipAddress,
                userAgent,
              }
            });
          } catch (e) {
            console.error('Failed to record AccountActivityLog:', e);
          }
        };

        const user = await prisma.user.findFirst({
          where: {
            username: { equals: credentials.username.trim(), mode: 'insensitive' }
          }
        });

        if (!user) {
          await logActivity({
            username: credentials.username.trim(),
            status: 'FAILED',
            reason: 'USER_NOT_FOUND',
          });
          throw new Error('INVALID_CREDENTIALS');
        }

        // 1. Verifikasi kecocokan password DULU (agar tidak membocorkan status akun jika password salah)
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const currentAttempts = user.failedAttempts || 0;
          const newFailedAttempts = currentAttempts + 1;
          const updateData: any = { failedAttempts: newFailedAttempts };

          // Jika sudah salah 15x, akun terkunci permanen di database
          if (newFailedAttempts >= 15) {
            updateData.isPermanentLocked = true;
            updateData.lockedUntil = null;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData
          });

          await logActivity({
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            status: 'FAILED',
            reason: 'WRONG_PASSWORD',
          });

          // PENTING: Selama password salah, jangan pernah bocorkan status akun terblokir! Selalu lempar INVALID_CREDENTIALS
          throw new Error('INVALID_CREDENTIALS');
        }

        // 2. Password BENAR (pemilik sah): Baru cek status akun
        if (user.status === 'inactive') {
          await logActivity({
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            status: 'FAILED',
            reason: 'ACCOUNT_INACTIVE',
          });
          throw new Error('ACCOUNT_INACTIVE');
        }

        if (user.isPermanentLocked) {
          await logActivity({
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            status: 'FAILED',
            reason: 'ACCOUNT_LOCKED',
          });
          throw new Error('LOCKED_PERMANENT');
        }

        // 3. Password Benar dan Akun Aktif: Reset semua counter kegagalan
        if (user.failedAttempts > 0 || user.lockedUntil || user.isPermanentLocked) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: 0,
              lockedUntil: null,
              isPermanentLocked: false
            }
          });
        }

        // Catat keberhasilan login
        await logActivity({
          userId: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          status: 'SUCCESS',
          reason: 'LOGIN_SUCCESS',
        });

        return {
          id: user.id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
          assignedTestIds: user.assignedTestIds
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.assignedTestIds = (user as any).assignedTestIds;
      } else if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { assignedTestIds: true, role: true }
          });
          if (dbUser) {
            token.assignedTestIds = dbUser.assignedTestIds;
            token.role = dbUser.role;
          }
        } catch (err) {
          console.warn('Retaining cached token');
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).assignedTestIds = token.assignedTestIds;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 3 * 60 * 60, // 3 jam (10.800 detik)
  },
  jwt: {
    maxAge: 3 * 60 * 60, // 3 jam (10.800 detik)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
