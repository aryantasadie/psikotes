'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
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

export default function ClientDashboardPage() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tests, setTests] = useState<ClientTest[]>([]);
  const [clientName, setClientName] = useState<string>('Client Perusahaan');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'candidates' | 'schedule'>('candidates');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  useEffect(() => {
    // Sync active tab from URL query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'schedule') {
        setActiveTab('schedule');
      } else {
        setActiveTab('candidates');
      }
    }

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

  const handleTabChange = (tab: 'candidates' | 'schedule') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
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

  const currentYear = new Date().getFullYear();

  // Helper to check if session test is active
  const isTestActive = (t: ClientTest) => {
    if (!t.startDate || !t.endDate) return false;
    const now = new Date();
    return now >= new Date(t.startDate) && now <= new Date(t.endDate);
  };

  const activeSchedulesCount = tests.filter(isTestActive).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-60 bg-white border-r border-slate-200 shadow-sm flex flex-col shrink-0">
        
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm leading-tight">HR Publik</p>
              <p className="text-teal-600 text-[10px] font-semibold tracking-widest uppercase">Assessment Engine</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 px-2.5 mb-1.5">
              Pusat Kendali
            </p>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => handleTabChange('candidates')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${
                    activeTab === 'candidates'
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={activeTab === 'candidates' ? 'text-teal-600' : 'text-slate-400'}>
                    📁
                  </span>
                  <span className="flex-1 leading-snug">Dashboard</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 px-2.5 mb-1.5">
              Manajemen Ujian
            </p>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => handleTabChange('candidates')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${
                    activeTab === 'candidates'
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={activeTab === 'candidates' ? 'text-teal-600' : 'text-slate-400'}>
                    📄
                  </span>
                  <span className="flex-1 leading-snug">Laporan Skor Per Tes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('schedule')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${
                    activeTab === 'schedule'
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={activeTab === 'schedule' ? 'text-teal-600' : 'text-slate-400'}>
                    📅
                  </span>
                  <span className="flex-1 leading-snug">Jadwal Sesi Ujian</span>
                </button>
              </li>
            </ul>
          </div>

        </nav>

        {/* Footer User Info */}
        <div className="border-t border-slate-100 px-4 py-4 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">{clientName}</p>
              <p className="text-[11px] text-slate-400 capitalize">Client</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            🚪 Keluar dari Sistem
          </button>
        </div>

      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-6 shrink-0">
          
          {/* Breadcrumb */}
          <div className="flex-1 min-w-0 hidden md:flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-500">HR Publik</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800 truncate">Dashboard</span>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 w-52 lg:w-64 focus-within:border-teal-400 focus-within:bg-white transition-all">
            <span className="text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Cari kandidat, sesi..."
              className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder-slate-400"
            />
          </div>

          {/* Role Indicator dropdown */}
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide hidden sm:inline">Peran:</span>
            <span className="text-[12px] font-bold text-teal-600">Client</span>
          </div>

          {/* Notification bell */}
          <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            🔔
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
            {clientName.charAt(0).toUpperCase()}
          </div>

        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Title Section */}
            <div>
              <h1 className="text-[1.3rem] font-extrabold text-slate-900">Dashboard Klien Perusahaan</h1>
            </div>

            {/* METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Perusahaan Mitra */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100">🏢</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perusahaan Mitra</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{clientName}</p>
                </div>
              </div>

              {/* Total Kandidat */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100">👥</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kandidat</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{totalCandidates}</p>
                </div>
              </div>

              {/* Sesi Ujian Dijadwalkan */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100">🗓️</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sesi Ujian Dijadwalkan</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{totalBatches}</p>
                </div>
              </div>

            </div>

            {/* TAB CONTENT: CANDIDATES */}
            {activeTab === 'candidates' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
                
                {/* Candidates Sub-Filters */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                  {/* Search bar */}
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 w-72 focus-within:border-teal-500 focus-within:bg-white transition-all bg-white">
                    <span className="text-slate-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Cari nama kandidat / username..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder-slate-400"
                    />
                  </div>

                  {/* Sesi Ujian select filter */}
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-slate-700 bg-white cursor-pointer outline-none focus:border-teal-500"
                  >
                    <option value="ALL">Semua Sesi Ujian ({tests.length})</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TABLE OF CANDIDATES */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 pl-2">NO</th>
                        <th className="pb-3">NAMA KANDIDAT</th>
                        <th className="pb-3">SESI UJIAN</th>
                        <th className="pb-3">STATUS</th>
                        <th className="pb-3">HASIL SKOR PER TES</th>
                        <th className="pb-3 text-right pr-2">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                            Memuat data kandidat...
                          </td>
                        </tr>
                      ) : filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                            Belum ada data kandidat.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((c, index) => (
                          <tr key={c.id} className="border-b border-slate-100 last:border-none text-[13px] text-slate-700 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 pl-2 font-semibold text-slate-400">{index + 1}</td>
                            <td className="py-4">
                              <div className="font-bold text-slate-900">{c.user.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.user.username}</div>
                            </td>
                            <td className="py-4">
                              <div className="font-semibold text-slate-800">{c.test?.title || 'Sesi Ujian'}</div>
                              <div className="text-[11px] text-teal-600 font-medium mt-0.5">{c.test?.jobPosition?.name || '-'}</div>
                            </td>
                            <td className="py-4">
                              {c.status === 'completed' ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                                  ✓ Selesai Ujian
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                                  • Belum Selesai
                                </span>
                              )}
                            </td>
                            <td className="py-4">
                              {c.psychoResults?.status === 'RELEASED' ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                                  Laporan Rilis & Final
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[12px]">Menunggu Rilis</span>
                              )}
                            </td>
                            <td className="py-4 text-right pr-2">
                              {c.psychoResults?.status === 'RELEASED' ? (
                                <Link
                                  href={`/report-pdf/${c.id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                                >
                                  📄 Lihat PDF Psikogram
                                </Link>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Menunggu rilis</span>
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

            {/* TAB CONTENT: SCHEDULE (JADWAL SESI UJIAN) */}
            {activeTab === 'schedule' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
                
                {/* Title and stats bar */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">Jadwal Sesi Ujian Perusahaan</h3>
                      <p className="text-[12px] text-slate-400 mt-0.5">Daftar sesi tes & jadwal kandidat yang telah disiapkan oleh Superadmin.</p>
                    </div>
                  </div>
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full text-[11px] font-bold">
                    {activeSchedulesCount} Sesi Aktif
                  </span>
                </div>

                {/* TABLE OF SCHEDULES */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 pl-2">ID SESI</th>
                        <th className="pb-3">NAMA SESI UJIAN</th>
                        <th className="pb-3">POSISI JABATAN</th>
                        <th className="pb-3">TANGGAL PELAKSANAAN</th>
                        <th className="pb-3">JUMLAH PESERTA</th>
                        <th className="pb-3 text-right pr-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                            Belum ada sesi tes yang dijadwalkan oleh Superadmin.
                          </td>
                        </tr>
                      ) : (
                        tests.map((t) => {
                          const isActive = isTestActive(t);
                          return (
                            <tr key={t.id} className="border-b border-slate-100 last:border-none text-[13px] text-slate-700 hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 pl-2 font-mono text-slate-400">#{t.id}</td>
                              <td className="py-4 font-bold text-slate-900">{t.title}</td>
                              <td className="py-4 font-semibold text-teal-600">{t.jobPosition?.name || 'Umum'}</td>
                              <td className="py-4 text-slate-500 font-medium">
                                <div>Mulai: {t.startDate ? new Date(t.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">Selesai: {t.endDate ? new Date(t.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                              </td>
                              <td className="py-4 font-bold text-slate-800">{t._count?.participants || 0} Orang</td>
                              <td className="py-4 text-right pr-2">
                                {isActive ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                    Aktif
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                    Selesai
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
