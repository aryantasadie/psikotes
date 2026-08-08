'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MSDTResultPage() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('msdtResult');
    if (saved) {
      setResult(JSON.parse(saved));
    }
  }, []);

  if (!result) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>
        <h2>Belum ada data hasil tes MSDT.</h2>
        <Link href="/tes/msdt">Kembali ke Tes</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Inter", sans-serif', background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        
        <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#1e293b', fontWeight: '800' }}>Hasil Tes Kepemimpinan MSDT</h1>
        
        <div style={{ background: '#f1f5f9', padding: '30px', borderRadius: '16px', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#3b82f6', fontSize: '32px' }}>{result.managementStyle || "Menunggu Kunci Jawaban"}</h2>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
            {result.message || "Gaya manajemen Reddin"}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{result.toScore || 0}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Task Orientation</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{result.roScore || 0}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Relation Orientation</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{result.eScore || 0}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Effectiveness</div>
          </div>
        </div>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{ padding: '15px 40px', fontSize: '16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
            Kembali ke Beranda
          </button>
        </Link>
      </div>
    </div>
  );
}
