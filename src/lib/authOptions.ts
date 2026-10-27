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

        // 1. Cek apakah status akun nonaktif
        if (user.status === 'inactive') {
          throw new Error('ACCOUNT_INACTIVE');
        }

        // 2. Cek apakah akun terkunci permanen
        if (user.isPermanentLocked) {
          throw new Error('LOCKED_PERMANENT');
        }

        // 3. Cek apakah akun sedang dalam periode kunci sementara (1.5 menit / 90 detik)
        if (user.lockedUntil) {
          const now = Date.now();
          const lockTime = new Date(user.lockedUntil).getTime();
          if (lockTime > now) {
            const remainingSec = Math.ceil((lockTime - now) / 1000);
            throw new Error(`LOCKED_TEMP:${remainingSec}`);
          } else {
            // Waktu cooldown telah berakhir, bersihkan lockedUntil
            await prisma.user.update({
              where: { id: user.id },
              data: { lockedUntil: null }
            });
          }
        }

        // 4. Verifikasi kecocokan password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const currentAttempts = user.failedAttempts || 0;
          const newFailedAttempts = currentAttempts + 1;

          // Siklus 1: Percobaan salah ke-5 -> Kunci sementara 1.5 menit (90 detik)
          if (newFailedAttempts === 5) {
            const lockedUntil = new Date(Date.now() + 90 * 1000);
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedAttempts: newFailedAttempts,
                lockedUntil: lockedUntil
              }
            });
            throw new Error('LOCKED_TEMP:90');
          }

          // Siklus 1: Masih di bawah 5 kali salah -> Beritahu sisa kesempatan
          if (newFailedAttempts < 5) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedAttempts: newFailedAttempts }
            });
            const remaining = 5 - newFailedAttempts;
            throw new Error(`ATTEMPTS_REMAINING:${remaining}`);
          }

          // Siklus 2: Terjadi setelah kunci sementara berakhir (percobaan ke-6, 7, 8)
          // Jika salah 3x lagi (total 8 kali salah) -> Kunci Permanen
          if (newFailedAttempts >= 8) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedAttempts: newFailedAttempts,
                lockedUntil: null,
                isPermanentLocked: true
              }
            });
            throw new Error('LOCKED_PERMANENT');
          } else {
            // Percobaan ke-6 atau ke-7: Peringatan kesempatan terakhir
            await prisma.user.update({
              where: { id: user.id },
              data: { failedAttempts: newFailedAttempts }
            });
            const remainingSecondCycle = 8 - newFailedAttempts;
            throw new Error(`ATTEMPTS_REMAINING_FINAL:${remainingSecondCycle}`);
          }
        }

        // 5. Password Benar: Reset semua counter kegagalan dan status kunci
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
