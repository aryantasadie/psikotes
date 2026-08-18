'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Participant {
  id: number;
  userId: number;
  testId: number;
  status: string;
  plainPassword?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  user: {
    name: string;
    username: string;
  };
  test: {
    id: number;
    title: string;
    sequence?: string | null;
    jobPosition?: {
      name: string;
    } | null;
  };
  psychoResults?: {
    status: string;
  } | null;
}

export default function ParticipantsPage() {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/reports');
      if (res.ok) {
        const data = await res.json();
        // The API returns { participants: [...] } or list directly depending on structure
        const list = Array.isArray(data) ? data : data.participants || [];
        setParticipants(list);
      }
    } catch (e) {
      console.error('Failed to fetch participants:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered List
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      (p.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.test.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.test.jobPosition?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesBatch =
      selectedBatch === 'ALL'
        ? true
        : p.test.title === selectedBatch;

    return matchesSearch && matchesBatch;
  });

  // Extract unique batches for selection filter
  const uniqueBatches = Array.from(new Set(participants.map((p) => p.test.title)));

  // Metrics
  const total = filteredParticipants.length;
  const completed = filteredParticipants.filter((p) => p.status === 'completed').length;
  const inProgress = filteredParticipants.filter((p) => p.status === 'in_progress').length;
  const pending = filteredParticipants.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-600 flex items-center justify-center mb-3 text-lg">👥</div>
          <p className="text-[26px] font-black leading-none text-sky-700">{total}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Total Kandidat</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 text-lg">✅</div>
          <p className="text-[26px] font-black leading-none text-emerald-700">{completed}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Selesai Ujian</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 flex items-center justify-center mb-3 text-lg">⏳</div>
          <p className="text-[26px] font-black leading-none text-amber-700">{inProgress}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Sedang Mengerjakan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 flex items-center justify-center mb-3 text-lg">📝</div>
          <p className="text-[26px] font-black leading-none text-slate-600">{pending}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Belum Memulai</p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-72 bg-slate-50 focus-within:border-teal-400 focus-within:bg-white transition-all">
            <span className="text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Cari kandidat, batch, posisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder-slate-400"
            />
          </div>

          {/* Batch Selector Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 bg-white cursor-pointer outline-none focus:border-teal-500"
          >
            <option value="ALL">Semua Sesi Ujian ({uniqueBatches.length})</option>
            {uniqueBatches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">NO</th>
                <th className="pb-3">NAMA PESERTA & AKUN</th>
                <th className="pb-3">POSISI / JABATAN</th>
                <th className="pb-3">BATTERY TEST</th>
                <th className="pb-3">STATUS PENGERJAAN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Memuat data peserta...
                  </td>
                </tr>
              ) : filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Belum ada data peserta yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, index) => {
                  let testModules: string[] = [];
                  try {
                    testModules = JSON.parse(p.test.sequence || '[]');
                  } catch (e) {}

                  return (
                    <tr key={p.id} className="border-b border-slate-100 last:border-none text-[13px] text-slate-700 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-2 font-semibold text-slate-400">{index + 1}</td>
                      <td className="py-4">
                        <div className="font-bold text-slate-900">{p.user.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ID: <span className="font-mono">{p.user.username}</span>
                          {p.plainPassword && (
                            <> &bull; Plain Pass: <span className="font-mono text-slate-500 font-semibold">{p.plainPassword}</span></>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-slate-800">
                        {p.test.jobPosition?.name || p.test.title || '-'}
                      </td>
                      <td className="py-4">
                        {testModules.length > 0 ? (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                            {testModules.join(' + ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        {p.status === 'completed' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                            ✓ Selesai Ujian
                          </span>
                        ) : p.status === 'in_progress' ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                            • Sedang Mengerjakan
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                            Menunggu Ujian
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

    </div>
  );
}
