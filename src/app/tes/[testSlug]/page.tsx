import CFIT1 from '@/components/tests/CFIT1';
import CFIT2 from '@/components/tests/CFIT2';
import CFIT3 from '@/components/tests/CFIT3';
import CFIT4 from '@/components/tests/CFIT4';
import IST2 from '@/components/tests/IST2';
import IST3 from '@/components/tests/IST3';
import IST6 from '@/components/tests/IST6';
import IST7 from '@/components/tests/IST7';
import TIKI1 from '@/components/tests/TIKI1';
import TIKI2 from '@/components/tests/TIKI2';
import TIKI3 from '@/components/tests/TIKI3';
import TIKI4 from '@/components/tests/TIKI4';
import TIKI6 from '@/components/tests/TIKI6';
import WPT from '@/components/tests/WPT';
import PAPI_KOSTICK from '@/components/tests/PAPI_KOSTICK';
import DISC from '@/components/tests/DISC';
import MSDT from '@/components/tests/MSDT';
import POWER from '@/components/tests/POWER';

export default async function TestPage({ params }: { params: Promise<{ testSlug: string }> }) {
  const resolvedParams = await params;
  const testSlug = resolvedParams.testSlug.toLowerCase().replace(/[\s\-_]+/g, '');

  if (testSlug.includes('cfit1')) return <CFIT1 />;
  if (testSlug.includes('cfit2')) return <CFIT2 />;
  if (testSlug.includes('cfit3')) return <CFIT3 />;
  if (testSlug.includes('cfit4')) return <CFIT4 />;
  if (testSlug.includes('ist2')) return <IST2 />;
  if (testSlug.includes('ist3')) return <IST3 />;
  if (testSlug.includes('ist6')) return <IST6 />;
  if (testSlug.includes('ist7')) return <IST7 />;
  if (testSlug.includes('tiki1')) return <TIKI1 />;
  if (testSlug.includes('tiki2')) return <TIKI2 />;
  if (testSlug.includes('tiki3')) return <TIKI3 />;
  if (testSlug.includes('tiki4')) return <TIKI4 />;
  if (testSlug.includes('tiki6')) return <TIKI6 />;
  if (testSlug.includes('wpt')) return <WPT />;
  if (testSlug.includes('papi')) return <PAPI_KOSTICK />;
  if (testSlug.includes('disc')) return <DISC />;
  if (testSlug.includes('msdt')) return <MSDT />;
  if (testSlug.includes('power')) return <POWER />;

  // Jika tidak ditemukan
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Modul Ujian Belum Tersedia</h1>
      <p>Modul untuk kode '{testSlug}' belum diimplementasikan atau tidak ditemukan.</p>
    </div>
  );
}
