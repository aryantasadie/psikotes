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

        const user = await prisma.user.findFirst({
          where: {
            username: { equals: credentials.username.trim(), mode: 'insensitive' }
          }
        });

        if (!user) {
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

          // PENTING: Selama password salah, jangan pernah bocorkan status akun terblokir! Selalu lempar INVALID_CREDENTIALS
          throw new Error('INVALID_CREDENTIALS');
        }

        // 2. Password BENAR (pemilik sah): Baru cek status akun
        if (user.status === 'inactive') {
          throw new Error('ACCOUNT_INACTIVE');
        }

        if (user.isPermanentLocked) {
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
