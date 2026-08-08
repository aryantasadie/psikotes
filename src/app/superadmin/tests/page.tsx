'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestBatteryList() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = () => {
    setLoading(true);
    fetch('/api/superadmin/tests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTests(data);
        } else {
          setTests([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (testId: number, count: number) => {
    if (count > 0) {
      alert(`Tidak bisa menghapus! Ada ${count} peserta yang terhubung dengan tes ini.`);
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus Bank Tes ini?')) return;
    
    try {
      const res = await fetch(`/api/superadmin/tests/${testId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setTests(tests.filter(t => t.id !== testId));
      } else {
        alert(data.error || 'Gagal menghapus');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem');
    }
  };

  return (
    <section className="page active" data-page="bank-tes">
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-head" style={{ marginBottom: '20px', padding: 0 }}>
          <div>
            <h2>Daftar Baterai Tes</h2>
            <div className="sub">Kelola rangkaian ujian yang akan dikerjakan peserta</div>
          </div>
          <Link href="/superadmin/tests/builder" className="btn-primary" style={{ textDecoration: 'none' }}>
            + Buat Baterai Tes Baru
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Memuat daftar tes...</p>
        ) : tests.length === 0 ? (
          <div style={{ background: 'var(--surface-2)', padding: '40px', borderRadius: '12px', textAlign: 'center', color: 'var(--faint)' }}>
            Belum ada Baterai Tes yang dibuat.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {tests.map(test => {
              let sequence = [];
              try {
                sequence = JSON.parse(test.sequence || '[]');
              } catch(e) {}

              return (
                <div key={test.id} style={{ border: '1px solid var(--line)', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 800 }}>{test.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {sequence.map((testName: string, idx: number) => (
                        <span key={idx} style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          {idx + 1}. {testName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link 
                        href={`/superadmin/tests/builder?id=${test.id}`}
                        style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--ink)', textDecoration: 'none' }}
                      >
                        Edit Baterai
                      </Link>
                      <button 
                        onClick={() => handleDelete(test.id, test._count?.participants || 0)}
                        style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626' }}
                      >
                        Hapus
                      </button>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Peserta: <strong style={{ color: 'var(--ink)' }}>{test._count?.participants || 0}</strong></span>
                    <span style={{ fontSize: '12px', color: 'var(--faint)' }}>Dibuat: {new Date(test.startDate).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
