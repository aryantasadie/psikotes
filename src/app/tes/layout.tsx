import CbtProctoringGuard from '@/components/CbtProctoringGuard';

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <CbtProctoringGuard>
      {children}
    </CbtProctoringGuard>
  );
}
