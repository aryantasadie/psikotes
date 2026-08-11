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
  endDate?: string | null;
  jobPosition?: { name: string } | null;
  _count?: { participants: number };
}

interface SecurityLog {
  id: number;
  logType: string;
  mediaUrl: string;
  createdAt: string;
  participant: {
    user: {
      name: string;
    };
    test: {
      title: string;
    };
  };
}

export default function ClientDashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tests, setTests] = useState<ClientTest[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [clientName, setClientName] = useState<string>('HRD Perusahaan');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'candidates' | 'schedules' | 'security'>('candidates');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  useEffect(() => {
    fetchClientData();
    fetchSchedules();
    fetchTokenLogs();
  }, []);

  const fetchClientData = async () => {
    try {
      const res = await fetch('/api/client/reports');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.participants || []);
        setTests(data.tests || []);
        if (data.clientName) setClientName(data.clientName);
      }
    } catch (e) {
      console.error('Failed to fetch client reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/client/schedule');
      if (res.ok) {
        const data = await res.json();
        if (data.tests) setTests(data.tests);
      }
    } catch (e) {
      console.error('Failed to fetch schedules:', e);
    }
  };

  const fetchTokenLogs = async () => {
    try {
      const res = await fetch('/api/client/token-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch token logs:', e);
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
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* GLOWING TOP BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', padding: '2rem 1.5rem', borderBottom: '4px solid #0D9488' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                background: 'rgba(13, 148, 136, 0.2)',
                border: '2.5px solid #0D9488',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                boxShadow: '0 8px 16px rgba(13, 148, 136, 0.15)',
              }}
            >
              🏢
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#0D9488', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>
                HR PUBLIK ASSESSMENT
              </div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                Portal HRD Klien — {clientName}
              </h1>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              padding: '10px 20px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseOut={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            Log Out Akun
          </button>

        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div style={{ maxWidth: '1200px', margin: '-1.5rem auto 1.5rem', padding: '0 1.5rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          {/* Sesi Ujian */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', fontSize: '22px', justifyContent: 'center' }}>📅</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>BATCH SESI UJIAN</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {totalBatches} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Sesi</span>
              </div>
            </div>
          </div>

          {/* Total Kandidat */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', fontSize: '22px', justifyContent: 'center' }}>👥</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TOTAL KANDIDAT</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
                {totalCandidates} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Peserta</span>
              </div>
            </div>
          </div>

          {/* Laporan Siap */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', fontSize: '22px', justifyContent: 'center' }}>🟢</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>LAPORAN FINAL SIAP</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                {releasedReportsCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Kandidat</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CORE CONTAINER */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 3rem', boxSizing: 'border-box' }}>
        
        {/* INTERACTIVE NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', borderBottom: '2px solid #CBD5E1', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('candidates')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'candidates' ? '#0D9488' : 'transparent',
              color: activeTab === 'candidates' ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📋 Daftar Kandidat & Laporan
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'schedules' ? '#0D9488' : 'transparent',
              color: activeTab === 'schedules' ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📅 Jadwal Sesi (Batch)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'security' ? '#0D9488' : 'transparent',
              color: activeTab === 'security' ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🛡️ Log Keamanan & Monitor
          </button>
        </div>

        {/* TAB 1: CANDIDATES */}
        {activeTab === 'candidates' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            
            {/* FILTER BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              
              {/* Search Box */}
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Cari nama, username, batch..."
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
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      KANDIDAT PESERTA
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      BATCH & JABATAN
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      STATUS PENGERJAAN
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      STATUS LAPORAN
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
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
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                            {c.user.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            ID: <span style={{ fontFamily: 'monospace' }}>{c.user.username}</span>
                          </div>
                        </td>

                        {/* BATCH & JABATAN */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                            {c.test?.title || 'Sesi Ujian'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#0D9488', fontWeight: 600, marginTop: '2px' }}>
                            Posisi: {c.test?.jobPosition?.name || '-'}
                          </div>
                        </td>

                        {/* STATUS PENGERJAAN */}
                        <td style={{ padding: '16px' }}>
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
                        <td style={{ padding: '16px' }}>
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
                        <td style={{ padding: '16px', textAlign: 'right' }}>
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
                                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
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
        )}

        {/* TAB 2: SCHEDULES */}
        {activeTab === 'schedules' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Jadwal Sesi Ujian (Batch) Aktif
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {tests.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', gridColumn: '1/-1' }}>
                  Belum ada jadwal sesi ujian yang ditugaskan ke Anda.
                </div>
              ) : (
                tests.map((t) => (
                  <div key={t.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', background: '#F8FAFC' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px', marginBottom: '8px' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                      Posisi: <strong style={{ color: '#0D9488' }}>{t.jobPosition?.name || 'Umum'}</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                      <div>📅 <strong>Mulai:</strong> {t.startDate ? new Date(t.startDate).toLocaleString('id-ID') : '-'}</div>
                      <div>📅 <strong>Selesai:</strong> {t.endDate ? new Date(t.endDate).toLocaleString('id-ID') : '-'}</div>
                      <div style={{ marginTop: '4px', fontWeight: 700, color: '#334155' }}>
                        👤 Terdaftar: {t._count?.participants || 0} Kandidat
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY LOGS */}
        {activeTab === 'security' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Log Keamanan & Pemantauan Kandidat
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748B', fontSize: '0.85rem' }}>
              Log aktivitas realtime dari seluruh kandidat yang mengikuti ujian di bawah batch Anda.
            </p>

            <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                  Belum ada log aktivitas keamanan masuk.
                </div>
              ) : (
                logs.map((log) => {
                  let badgeBg = '#F1F5F9';
                  let badgeText = '#475569';
                  let icon = '📝';

                  if (log.logType === 'camera') {
                    badgeBg = '#ECFDF5';
                    badgeText = '#047857';
                    icon = '📷';
                  } else if (log.logType === 'screen') {
                    badgeBg = '#EFF6FF';
                    badgeText = '#1D4ED8';
                    icon = '🖥️';
                  } else if (log.logType === 'blur_fullscreen' || log.logType?.includes('blur')) {
                    badgeBg = '#FEF2F2';
                    badgeText = '#B91C1C';
                    icon = '⚠️';
                  }

                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        background: '#FAF5FF',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px' }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {log.participant?.user?.name || 'Peserta'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            {log.participant?.test?.title || 'Sesi Ujian'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            background: badgeBg,
                            color: badgeText,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.logType === 'blur_fullscreen' ? 'Pindah Tab/Alt+Tab' : log.logType}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                          {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
