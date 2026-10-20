'use client';

import { SessionProvider } from "next-auth/react";
import SessionIdleTimeout from "@/components/SessionIdleTimeout";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionIdleTimeout />
      {children}
    </SessionProvider>
  );
}
