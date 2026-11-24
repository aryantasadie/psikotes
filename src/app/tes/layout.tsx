import TestToolTracker from '@/components/TestToolTracker';

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TestToolTracker />
      {children}
    </>
  );
}
