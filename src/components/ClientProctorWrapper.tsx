'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import CbtProctoringGuard from './CbtProctoringGuard';

export default function ClientProctorWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Wrap candidate routes under /tes or /testee with the proctoring guard
  const isCandidateRoute = pathname.startsWith('/tes') || pathname.startsWith('/testee');

  if (isCandidateRoute) {
    return <CbtProctoringGuard>{children}</CbtProctoringGuard>;
  }

  return <>{children}</>;
}
