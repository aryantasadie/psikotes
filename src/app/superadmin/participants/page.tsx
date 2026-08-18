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
    startDate?: string | null;
    client?: {
      name: string;
    } | null;
    jobPosition?: {
      name: string;
    } | null;
  };
}

interface TestBatch {
  id: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  sequence?: string | null;
  client?: {
    name: string;
  } | null;
  jobPosition?: {
    name: string;
  } | null;
}

interface BatchGroup {
  id: number;
  title: string;
  startDate?: string | null;
  batteryTestStr: string;
  clientName: string;
  jobPositionName: string;
  totalParticipants: number;
  completedParticipants: number;
}

export default function ParticipantsPage() {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignedTests, setAssignedTests] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Navigation State
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/reports');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setParticipants(data.participants || []);
          setAssignedTests(data.assignedTests || []);
        } else {
          setParticipants(Array.isArray(data) ? data : []);
          setAssignedTests([]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch participants:', e);
    } finally {
      setLoading(false);
    }
  };

  // Group participants by Batch Session (Test)
  const batchesMap = new Map<number, BatchGroup>();

  // Pre-populate batchesMap with all assigned tests to ensure even empty ones are shown
  assignedTests.forEach(test => {
    const testId = test.id;
    const title = test.title || 'Sesi Tanpa Judul';
    const startDate = test.startDate;
    const clientName = test.client?.name || 'Umum / Internal';
    const jobPositionName = test.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

    let testToolsArr = [];
    if (test.sequence) {
      try { testToolsArr = JSON.parse(test.sequence); } catch(e){}
    }
    const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'coba';

    batchesMap.set(testId, {
      id: testId,
      title,
      startDate,
      batteryTestStr,
      clientName,
      jobPositionName,
      totalParticipants: 0,
      completedParticipants: 0
    });
  });

  // Count participants for each batch
  participants.forEach(p => {
    const testId = p.testId || p.test?.id || 0;
    let b = batchesMap.get(testId);
    if (!b) {
      const testObj = p.test || {};
      const title = testObj.title || 'Sesi Tanpa Judul';
      const startDate = p.startTime || testObj.startDate;
      const clientName = testObj.client?.name || 'Umum / Internal';
      const jobPositionName = p.test?.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

      let testToolsArr = [];
      if (testObj.sequence) {
        try { testToolsArr = JSON.parse(testObj.sequence); } catch(e){}
      }
      const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'coba';

      b = {
        id: testId,
        title,
        startDate,
        batteryTestStr,
        clientName,
        jobPositionName,
        totalParticipants: 0,
        completedParticipants: 0
      };
      batchesMap.set(testId, b);
    }

    b.totalParticipants += 1;
    if (p.status === 'completed') {
      b.completedParticipants += 1;
    }
  });

  const batchesList = Array.from(batchesMap.values());

  // Filter batches for Level 1 view
  const filteredBatches = batchesList.filter(b => {
    const s = search.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(s) ||
      (b.clientName || '').toLowerCase().includes(s) ||
      (b.jobPositionName || '').toLowerCase().includes(s)
    );
  });

  // Filter participants for Level 2 view (Specific Batch)
  const currentBatch = batchesList.find(b => b.id === selectedBatchId);
  const filteredParticipants = participants
    .filter(p => p.testId === selectedBatchId)
    .filter(p => {
      const s = search.toLowerCase();
      return (
        (p.user.name || '').toLowerCase().includes(s) ||
        (p.user.username || '').toLowerCase().includes(s) ||
        (p.test.jobPosition?.name || '').toLowerCase().includes(s)
      );
    });

  // Metrics
  const totalCompleted = participants.filter((p) => p.status === 'completed').length;
  const totalInProgress = participants.filter((p) => p.status === 'in_progress').length;
  const totalPending = participants.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* ── KPI Cards (Always visible) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-600 flex items-center justify-center mb-3 text-lg">📁</div>
          <p className="text-[26px] font-black leading-none text-sky-700">{batchesList.length}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Total Sesi Ujian</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 text-lg">👥</div>
          <p className="text-[26px] font-black leading-none text-emerald-700">{totalCompleted}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Selesai Ujian</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 flex items-center justify-center mb-3 text-lg">⏳</div>
          <p className="text-[26px] font-black leading-none text-amber-700">{totalInProgress}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Sedang Mengerjakan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 flex items-center justify-center mb-3 text-lg">📝</div>
          <p className="text-[26px] font-black leading-none text-slate-600">{totalPending}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Belum Mulai</p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        
        {/* Back Link or Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {selectedBatchId !== null ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedBatchId(null);
                  setSearch('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-colors"
              >
                &larr; Kembali ke Daftar Sesi
              </button>
              <div className="border-l border-slate-200 h-6 hidden sm:block"></div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{currentBatch?.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Klien: {currentBatch?.clientName}</p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Daftar Sesi Ujian & Peserta</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pilih salah satu sesi di bawah untuk melihat daftar akun dan data peserta.</p>
            </div>
          )}

          {/* Search Box */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-72 bg-slate-50 focus-within:border-teal-400 focus-within:bg-white transition-all">
            <span className="text-slate-400">🔍</span>
            <input
              type="text"
              placeholder={selectedBatchId !== null ? "Cari nama peserta / ID..." : "Cari batch, klien, posisi..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder-slate-400"
            />
          </div>

        </div>

        {/* Dynamic Table Content */}
        {selectedBatchId === null ? (
          
          /* ── LEVEL 1: BATCH LIST VIEW ── */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">NAMA BATCH & TANGGAL</th>
                  <th className="pb-3">BATTERY TEST</th>
                  <th className="pb-3">KLIEN PERUSAHAAN</th>
                  <th className="pb-3">TESTER PJ</th>
                  <th className="pb-3">JUMLAH PESERTA</th>
                  <th className="pb-3 text-right pr-2">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      Memuat data sesi...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      Tidak ada batch sesi ujian yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 last:border-none text-[13px] text-slate-700 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-slate-600 font-semibold">{b.batteryTestStr}</span>
                      </td>
                      <td className="py-4">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-bold inline-block">
                          {b.clientName}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold inline-block">
                          aku
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="font-bold text-slate-800">{b.totalParticipants} Peserta</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {b.completedParticipants}/{b.totalParticipants} Selesai
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => {
                            setSelectedBatchId(b.id);
                            setSearch('');
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-[12px] transition-colors shadow-sm cursor-pointer"
                        >
                          Lihat Peserta
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          
          /* ── LEVEL 2: PARTICIPANTS IN BATCH VIEW ── */
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
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      Tidak ada peserta terdaftar di batch ini yang sesuai dengan pencarian.
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
        )}

      </div>

    </div>
  );
}
