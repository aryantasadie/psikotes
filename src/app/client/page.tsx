'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface Candidate {
  id: number;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  user: {
    name: string;
    username: string;
  };
  test: {
    id: number;
    title: string;
    startDate?: string | null;
    jobPosition?: { name: string } | null;
  };
  psychoResults?: {
    status: string;
    recommendation: string;
  } | null;
}

interface ClientTest {
  id: number;
  title: string;
  startDate?: string | null;
  jobPosition?: { name: string } | null;
  _count?: { participants: number };
}

export default function ClientDashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tests, setTests] = useState<ClientTest[]>([]);
  const [clientName, setClientName] = useState<string>('HRD Perusahaan');
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/reports');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.participants || []);
        setTests(data.tests || []);
        if (data.clientName) setClientName(data.clientName);
      }
    } catch (e) {
      console.error('Failed to fetch client data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      (c.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.user.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.test?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.test?.jobPosition?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesBatch =
      selectedBatchId === 'ALL'
        ? true
        : c.test?.id === parseInt(selectedBatchId);

    return matchesSearch && matchesBatch;
  });

  const totalBatches = tests.length;
  const totalCandidates = candidates.length;
  const releasedReportsCount = candidates.filter(
    (c) => c.psychoResults?.status === 'RELEASED'
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            background: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                color: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)',
              }}
            >
              🏢
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Portal HRD Klien — {clientName}
              </h1>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                Monitoring Hasil Tes & Laporan Rekrutmen Khusus Perusahaan Anda
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              padding: '9px 18px',
              background: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Logout Akun
          </button>
        </header>

        {/* METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          
          {/* TOTAL BATCH */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              BATCH SESI UJIAN
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
              {totalBatches} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Sesi</span>
            </div>
          </div>

          {/* TOTAL KANDIDAT */}
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369A1', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              TOTAL KANDIDAT
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7' }}>
              {totalCandidates} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0369A1' }}>Peserta</span>
            </div>
          </div>

          {/* LAPORAN RILIS */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              LAPORAN FINAL SIAP
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A' }}>
              {releasedReportsCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#15803D' }}>Kandidat</span>
            </div>
          </div>

        </div>

        {/* MAIN DATA TABLE CARD */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          
          {/* FILTER BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Search Box */}
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
              <input
                type="text"
                placeholder="Cari kandidat, username, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                }}
              />
            </div>

            {/* Batch Filter */}
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Semua Batch Sesi Ujian ({tests.length})</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  📌 {t.title} ({t._count?.participants || 0} kandidat)
                </option>
              ))}
            </select>
          </div>

          {/* TABLE */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    KANDIDAT PESERTA
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    BATCH & JABATAN
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    STATUS PENGERJAAN
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    STATUS LAPORAN
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>
                    AKSI LAPORAN
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      Memuat data kandidat...
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      Belum ada data kandidat untuk perusahaan Anda.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      
                      {/* KANDIDAT */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                          {c.user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          ID: <span style={{ fontFamily: 'monospace' }}>{c.user.username}</span>
                        </div>
                      </td>

                      {/* BATCH & JABATAN */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                          {c.test?.title || 'Sesi Ujian'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 500 }}>
                          Posisi: {c.test?.jobPosition?.name || '-'}
                        </div>
                      </td>

                      {/* STATUS PENGERJAAN */}
                      <td style={{ padding: '14px 16px' }}>
                        {c.status === 'completed' ? (
                          <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                            ✓ Selesai Ujian
                          </span>
                        ) : (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                            • Belum Selesai
                          </span>
                        )}
                      </td>

                      {/* STATUS LAPORAN */}
                      <td style={{ padding: '14px 16px' }}>
                        {c.psychoResults?.status === 'RELEASED' ? (
                          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                            🟢 Rilis & Final
                          </span>
                        ) : c.psychoResults?.status === 'WAITING_QC' ? (
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                            🟡 Verifikasi QC
                          </span>
                        ) : (
                          <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                            ⚪ Proses Evaluasi
                          </span>
                        )}
                      </td>

                      {/* AKSI */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {c.psychoResults?.status === 'RELEASED' ? (
                          <Link
                            href={`/report-pdf/${c.id}`}
                            target="_blank"
                            style={{
                              background: '#0D9488',
                              color: 'white',
                              padding: '7px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            📄 Lihat PDF Psikogram
                          </Link>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                            Menunggu rilis
                          </span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
