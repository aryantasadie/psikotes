'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  logs?: {
    id: number;
    logType: string;
    mediaUrl: string;
    createdAt: string;
  }[];
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
  violationCount: number;
}

export default function ProctoringCenterPage() {
  const { data: session, status: authStatus } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignedTests, setAssignedTests] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Navigation States
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

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
      console.error('Failed to fetch participants for proctoring:', e);
    } finally {
      setLoading(false);
    }
  };

  // Group participants by Batch Session (Test)
  const batchesMap = new Map<number, BatchGroup>();

  // Pre-populate batchesMap with all assigned tests to guarantee empty batches are displayed
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
      violationCount: 0
    });
  });

  // Count participants and violations for each batch
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
        violationCount: 0
      };
      batchesMap.set(testId, b);
    }

    b.totalParticipants += 1;
    
    // Count safety violations in logs
    const candidateViolations = (p.logs || []).filter((l) => 
      l.logType.includes('tab_switch') || 
      l.logType.includes('fullscreen') || 
      l.logType.includes('forbidden')
    ).length;

    b.violationCount += candidateViolations;
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

  // Level 3 view (Specific Candidate logs)
  const currentParticipant = participants.find(p => p.id === selectedParticipantId);

  // Group security logs by timestamp (nearest 4s) for side-by-side camera/screen view
  const groupedLogs = (() => {
    if (!currentParticipant || !currentParticipant.logs) return [];
    
    const groups: { time: string; logs: any[] }[] = [];
    const logsList = [...currentParticipant.logs].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    logsList.forEach(log => {
      const logTime = new Date(log.createdAt);
      const timeStr = logTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + logTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timeMs = logTime.getTime();
      
      let foundGroup = groups.find(g => {
        const groupTime = new Date(g.logs[0].createdAt).getTime();
        return Math.abs(groupTime - timeMs) <= 4000;
      });
      
      if (foundGroup) {
        foundGroup.logs.push(log);
      } else {
        groups.push({ time: timeStr, logs: [log] });
      }
    });
    
    return groups;
  })();

  // Global metrics
  const totalViolationsCount = participants.reduce((acc, p) => {
    const pV = (p.logs || []).filter((l) => 
      l.logType.includes('tab_switch') || 
      l.logType.includes('fullscreen') || 
      l.logType.includes('forbidden')
    ).length;
    return acc + pV;
  }, 0);

  const totalMonitoredCandidates = participants.length;

  return (
    <div className="space-y-6">
      
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-600 flex items-center justify-center mb-3 text-lg">📁</div>
          <p className="text-[26px] font-black leading-none text-sky-700">{batchesList.length}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Total Sesi Pengawasan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 flex items-center justify-center mb-3 text-lg">👥</div>
          <p className="text-[26px] font-black leading-none text-violet-700">{totalMonitoredCandidates}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Total Peserta Diawasi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 flex items-center justify-center mb-3 text-lg">🚨</div>
          <p className="text-[26px] font-black leading-none text-rose-700">{totalViolationsCount}</p>
          <p className="text-[13px] font-semibold text-slate-700 mt-1">Total Pelanggaran Keamanan</p>
        </div>
      </div>

      {/* ── Main View Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {selectedParticipantId !== null ? (
            /* Breadcrumbs for Level 3 (Timeline Logs) */
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedParticipantId(null);
                  setSearch('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-colors"
              >
                &larr; Kembali ke Daftar Peserta
              </button>
              <div className="border-l border-slate-200 h-6 hidden sm:block"></div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Log Keamanan: {currentParticipant?.user.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Username: {currentParticipant?.user.username}</p>
              </div>
            </div>
          ) : selectedBatchId !== null ? (
            /* Breadcrumbs for Level 2 (Participant List in Batch) */
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
            /* Title for Level 1 (Batch overview) */
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Proctoring Center: Pengawasan Layar & Kamera</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tinjau rekaman kamera dan tangkapan layar desktop untuk mendeteksi kecurangan.</p>
            </div>
          )}

          {/* Search Box (only visible on list views) */}
          {selectedParticipantId === null && (
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-72 bg-slate-50 focus-within:border-teal-400 focus-within:bg-white transition-all">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder={selectedBatchId !== null ? "Cari nama peserta / ID..." : "Cari batch, klien..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder-slate-400"
              />
            </div>
          )}

        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* VIEW ROUTING */}
        
        {selectedParticipantId !== null ? (
          
          /* ── LEVEL 3: TIMELINE VIEW ── */
          <div className="space-y-4">
            
            {groupedLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-slate-200 border-dashed rounded-2xl text-sm">
                Belum ada rekaman layar dan kamera yang tersimpan untuk peserta ini.
              </div>
            ) : (
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                {groupedLogs.map((group, idx) => {
                  const cameraLog = group.logs.find(l => l.logType.startsWith('camera'));
                  const screenLog = group.logs.find(l => l.logType.startsWith('screen'));
                  const isViolation = group.logs.some(l => 
                    l.logType.includes('tab_switch') || 
                    l.logType.includes('fullscreen') || 
                    l.logType.includes('forbidden')
                  );

                  const logLabels = group.logs.map((l: any) => {
                    const type = l.logType;
                    if (type.includes('tab_switch')) return 'Pindah Tab / Jendela';
                    if (type.includes('fullscreen')) return 'Keluar Mode Fullscreen';
                    if (type.includes('forbidden_key')) return 'Pemberian Shortcut Terlarang';
                    return 'Tangkapan Berkala';
                  });
                  const uniqueLabels = Array.from(new Set(logLabels)).join(', ');

                  return (
                    <div key={idx} className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 transition-all ${isViolation ? 'border-amber-400 bg-amber-50/10' : 'border-slate-200'}`}>
                      
                      {/* Log Header */}
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <span className="text-[13px] font-extrabold text-slate-900">⏱️ {group.time}</span>
                          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Kategori: {uniqueLabels}</div>
                        </div>
                        {isViolation ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            🚨 Pelanggaran Keamanan
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            ✓ Pengawasan Rutin
                          </span>
                        )}
                      </div>

                      {/* Side-by-Side Images */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Webcam Capture */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-500">📷 Kamera Depan (Webcam):</div>
                          {cameraLog ? (
                            <img
                              src={cameraLog.mediaUrl}
                              alt="Webcam Capture"
                              className="w-full h-44 object-cover border border-slate-200 rounded-xl"
                            />
                          ) : (
                            <div className="h-44 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                              Foto wajah tidak tersedia
                            </div>
                          )}
                        </div>

                        {/* Screen Capture */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-500">🖥️ Layar Monitor (Screen Capture):</div>
                          {screenLog ? (
                            <img
                              src={screenLog.mediaUrl}
                              alt="Screen Capture"
                              className="w-full h-44 object-contain border border-slate-200 bg-slate-950 rounded-xl"
                            />
                          ) : (
                            <div className="h-44 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                              Rekaman layar tidak tersedia
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        ) : selectedBatchId !== null ? (
          
          /* ── LEVEL 2: CANDIDATE LIST IN BATCH ── */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">NO</th>
                  <th className="pb-3">NAMA PESERTA & AKUN</th>
                  <th className="pb-3">POSISI / JABATAN</th>
                  <th className="pb-3">JUMLAH PELANGGARAN</th>
                  <th className="pb-3 text-right pr-2">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      Tidak ada peserta terdaftar di batch ini yang sesuai dengan kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, index) => {
                    const candidateViolations = (p.logs || []).filter((l) => 
                      l.logType.includes('tab_switch') || 
                      l.logType.includes('fullscreen') || 
                      l.logType.includes('forbidden')
                    ).length;

                    return (
                      <tr key={p.id} className="border-b border-slate-100 last:border-none text-[13px] text-slate-700 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pl-2 font-semibold text-slate-400">{index + 1}</td>
                        <td className="py-4">
                          <div className="font-bold text-slate-900">{p.user.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            ID: <span className="font-mono">{p.user.username}</span>
                          </div>
                        </td>
                        <td className="py-4 font-semibold text-slate-800">
                          {p.test.jobPosition?.name || p.test.title || '-'}
                        </td>
                        <td className="py-4">
                          {candidateViolations > 0 ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-[11px] font-black inline-block">
                              ⚠️ Terdeteksi {candidateViolations}x Pelanggaran
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold inline-block">
                              ✓ Aman (Tidak Ada)
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => {
                              setSelectedParticipantId(p.id);
                              setSearch('');
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-[12px] transition-colors shadow-sm cursor-pointer"
                          >
                            Lihat Log Pengawasan
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        ) : (
          
          /* ── LEVEL 1: BATCH LIST VIEW ── */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">NAMA BATCH & TANGGAL</th>
                  <th className="pb-3">KLIEN PERUSAHAAN</th>
                  <th className="pb-3">TESTER PJ</th>
                  <th className="pb-3">STATUS PELANGGARAN BATCH</th>
                  <th className="pb-3 text-right pr-2">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      Memuat data pengawasan...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
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
                      <td className="py-4 font-semibold text-slate-800">
                        {b.clientName}
                      </td>
                      <td className="py-4">
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold inline-block">
                          aku
                        </span>
                      </td>
                      <td className="py-4">
                        {b.violationCount > 0 ? (
                          <div>
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-black inline-block">
                              🚨 {b.violationCount}x Pelanggaran
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">{b.totalParticipants} Peserta diawasi</div>
                          </div>
                        ) : (
                          <div>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                              ✓ Aman (Bersih)
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">{b.totalParticipants} Peserta diawasi</div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => {
                            setSelectedBatchId(b.id);
                            setSearch('');
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-[12px] transition-colors shadow-sm cursor-pointer"
                        >
                          Lihat Akun
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
