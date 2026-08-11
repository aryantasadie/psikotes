import CbtProctoringGuard from '@/components/CbtProctoringGuard';

export default function TesteeLayout({ children }: { children: React.ReactNode }) {
  return (
    <CbtProctoringGuard>
      {children}
    </CbtProctoringGuard>
  );
}
