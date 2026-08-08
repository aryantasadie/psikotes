'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchParticipants = () => {
    setLoading(true);
    fetch('/api/superadmin/reports')
      .then(res => res.json())
      .then(data => {
        setParticipants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleDelete = async (participantId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data peserta ini? Semua jawaban dan hasil akan hilang selamanya.')) return;
    
    try {
      const res = await fetch(`/api/superadmin/reports/${participantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setParticipants(participants.filter(p => p.id !== participantId));
      } else {
        alert(data.error || 'Gagal menghapus peserta');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem');
    }
  };

  const filtered = participants.filter(p => {
    const s = search.toLowerCase();
    const nameMatch = (p.user?.name || '').toLowerCase().includes(s);
    const companyMatch = (p.test?.jobPosition?.name || '').toLowerCase().includes(s);
    const bankTestMatch = (p.test?.title || '').toLowerCase().includes(s);
    return nameMatch || companyMatch || bankTestMatch;
  });

  return (
    <div className="section" style={{ padding: '2rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.25rem' }}>Hasil & Laporan Psikogram</h2>
          <p style={{ color: '#64748B' }}>Lihat analisis klasifikasi, grafik DISC, dan ekspor laporan PDF</p>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>Cari Laporan Asesmen</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Tinjau grafik psikogram dan hasil skor kalkulasi</p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Cari nama, perusahaan, atau bank tes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
          />
          <button className="btn-primary" style={{ padding: '0 2rem' }}>Cari</button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Tidak ada data ditemukan.</div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 0', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>NAMA PESERTA</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>PERUSAHAAN / POSISI</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>BANK TES</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>ALAT TES</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>TANGGAL UJIAN</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>STATUS PENILAIAN</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const companyPos = p.test?.jobPosition ? `${p.test.jobPosition.name}` : 'Unknown';
                  const testTools = p.test?.sequence ? JSON.parse(p.test.sequence).join(' + ') : (p.test?.title || '-');
                  const date = p.startTime ? new Date(p.startTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  const isCompleted = p.status === 'completed';
                  
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1.25rem 0', fontWeight: 600, color: '#1E293B' }}>{p.user.name}</td>
                      <td style={{ padding: '1.25rem 0', color: '#475569' }}>{companyPos}</td>
                      <td style={{ padding: '1.25rem 0', color: '#1E293B', fontWeight: 500 }}>{p.test?.title || '-'}</td>
                      <td style={{ padding: '1.25rem 0', color: '#475569' }}>
                        <span style={{ background: '#F1F5F9', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>{testTools}</span>
                      </td>
                      <td style={{ padding: '1.25rem 0', color: '#475569' }}>{date}</td>
                      <td style={{ padding: '1.25rem 0' }}>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          background: isCompleted ? '#DEF7EC' : '#FEF3C7', 
                          color: isCompleted ? '#03543F' : '#92400E', 
                          padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 500 
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isCompleted ? '#059669' : '#D97706' }}></span>
                          {isCompleted ? 'Selesai dinilai' : 'Menunggu nilai'}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 0', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link href={`/superadmin/reports/${p.id}`} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#475569', borderColor: '#CBD5E1', textDecoration: 'none' }}>
                          Lihat Laporan
                        </Link>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          style={{ padding: '0.4rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                          title="Hapus Peserta"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
