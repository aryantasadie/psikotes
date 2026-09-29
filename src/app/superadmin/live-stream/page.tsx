'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LiveStreamItem {
  participantId: number;
  name: string;
  username: string;
  testTitle?: string;
  cameraFrameUrl: string | null;
  screenFrameUrl: string | null;
  lastActive: number;
  violationCount: number;
  latestViolationReason?: string;
  currentTestName?: string | null;
  timerRemaining?: number | null;
  completedTests?: string[];
  status?: string;
  isPaused?: boolean;
}

interface ParticipantEntry {
  participantId: number;
  name: string;
  username: string;
  status: string;
  testTitle: string;
  batchId: number;
  cameraFrameUrl?: string | null;
  screenFrameUrl?: string | null;
  violationCount?: number;
  lastActive?: number;
  notes?: ProctorNote[];
  currentTest?: string | null;
  timerRemaining?: number | null;
  completedTests?: string[];
  sequence?: string[];
  nextTest?: string | null;
  isPaused?: boolean;
}

interface ProctorNote {
  id: number;
  participantId: number;
  mediaUrl: string;
  createdAt: string;
}

function formatSeconds(secs?: number | null): string {
  if (secs === undefined || secs === null || isNaN(secs) || secs < 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function cleanTestName(name?: string | null): string {
  if (!name) return '';
  return name.toUpperCase().replace(/[\s\-_]+/g, '');
}

export default function MonitoringPesertaPage() {
  const [streamsMap, setStreamsMap] = useState<Map<number, LiveStreamItem>>(new Map());
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [allNotes, setAllNotes] = useState<ProctorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<number>(() => Date.now());
  const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');
  const [viewMode, setViewMode] = useState<'camera' | 'screen' | 'dual'>('dual');
  const [isSseConnected, setIsSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Modals & Control States
  const [videoModalParticipant, setVideoModalParticipant] = useState<ParticipantEntry | null>(null);
  const [notesModalParticipant, setNotesModalParticipant] = useState<ParticipantEntry | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    action: 'stop_single' | 'stop_batch' | 'resume_batch' | 'resume_single';
    title: string;
    description: string;
    participantId?: number;
    batchId?: number;
    nextTest?: string;
  } | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch batches and notes
  const fetchBatchesAndNotes = async () => {
    try {
      const [batchesRes, notesRes] = await Promise.all([
        fetch('/api/superadmin/schedule/batches'),
        fetch('/api/superadmin/proctor/notes')
      ]);

      if (batchesRes.ok) {
        const bData = await batchesRes.json();
        const batchArr = Array.isArray(bData) ? bData : [];
        setBatches(batchArr);
        if (batchArr.length > 0 && selectedBatchId === 'all') {
          setSelectedBatchId(String(batchArr[0].id));
        }
      }

      if (notesRes.ok) {
        const nData = await notesRes.json();
        setAllNotes(nData.notes || []);
      }
    } catch (e) {
      console.error('Error fetching initial monitoring data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchesAndNotes();
  }, []);

  // Connect SSE for live camera/screen frames & live test/timer updates
  useEffect(() => {
    let es: EventSource | null = null;

    const connectSSE = () => {
      es = new EventSource('/api/stream/sse');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsSseConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'INIT' && Array.isArray(data.streams)) {
            setStreamsMap((prev) => {
              const newMap = new Map(prev);
              data.streams.forEach((item: LiveStreamItem) => {
                newMap.set(item.participantId, item);
              });
              return newMap;
            });
          } else if (data.type === 'BATCH_UPDATE' && Array.isArray(data.streams)) {
            setStreamsMap((prev) => {
              const newMap = new Map(prev);
              data.streams.forEach((item: LiveStreamItem) => {
                const existing = newMap.get(item.participantId);
                newMap.set(item.participantId, {
                  ...existing,
                  ...item,
                  cameraFrameUrl: item.cameraFrameUrl || existing?.cameraFrameUrl || null,
                  screenFrameUrl: item.screenFrameUrl || existing?.screenFrameUrl || null,
                  currentTestName: item.currentTestName || existing?.currentTestName,
                  timerRemaining: item.timerRemaining !== undefined ? item.timerRemaining : existing?.timerRemaining,
                  completedTests: item.completedTests || existing?.completedTests,
                  status: item.status || existing?.status,
                  isPaused: item.isPaused !== undefined ? item.isPaused : existing?.isPaused,
                });
              });
              return newMap;
            });
          } else if (data.type === 'UPDATE' && data.stream) {
            const item: LiveStreamItem = data.stream;
            setStreamsMap((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(item.participantId);
              newMap.set(item.participantId, {
                ...existing,
                ...item,
                cameraFrameUrl: item.cameraFrameUrl || existing?.cameraFrameUrl || null,
                screenFrameUrl: item.screenFrameUrl || existing?.screenFrameUrl || null,
                currentTestName: item.currentTestName || existing?.currentTestName,
                timerRemaining: item.timerRemaining !== undefined ? item.timerRemaining : existing?.timerRemaining,
                completedTests: item.completedTests || existing?.completedTests,
                status: item.status || existing?.status,
                isPaused: item.isPaused !== undefined ? item.isPaused : existing?.isPaused,
              });
              return newMap;
            });
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      es.onerror = () => {
        setIsSseConnected(false);
      };
    };

    connectSSE();

    return () => {
      if (es) es.close();
    };
  }, []);

  // Live timer tick & real-time online status refresh every 1s
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const now = Date.now();
      setNowTime(now);
      setStreamsMap(prev => {
        let changed = false;
        const newMap = new Map(prev);
        newMap.forEach((stream, pId) => {
          // Strictly verify that candidate is actively streaming/online right now
          const isOnline = Boolean(
            stream.lastActive && (now - stream.lastActive <= 40000) &&
            stream.status !== 'completed' &&
            stream.status !== 'stopped' &&
            stream.status !== 'offline'
          );

          // ONLY tick down if candidate is actively online, not paused, not stopped, not completed
          if (
            isOnline &&
            typeof stream.timerRemaining === 'number' &&
            stream.timerRemaining > 0 &&
            !stream.isPaused &&
            stream.status !== 'stopped' &&
            stream.status !== 'completed' &&
            stream.status !== 'offline'
          ) {
            newMap.set(pId, { ...stream, timerRemaining: stream.timerRemaining - 1 });
            changed = true;
          }
        });
        return changed ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // Strict Online Detector (heartbeat within 40s or active streaming frame)
  const isParticipantOnline = (p: ParticipantEntry | { lastActive?: number; cameraFrameUrl?: string | null; screenFrameUrl?: string | null; status?: string }): boolean => {
    if (p.status === 'completed' || p.status === 'stopped' || p.status === 'offline') return false;
    const now = nowTime;
    if (p.lastActive && (now - p.lastActive <= 40000)) {
      return true;
    }
    return false;
  };

  // Build unified list of participants strictly isolated by selected batch
  const participantsList: ParticipantEntry[] = [];
  const processedIds = new Set<number>();

  batches.forEach(b => {
    if (selectedBatchId !== 'all' && String(b.id) !== selectedBatchId) return;

    (b.participants || []).forEach((p: any) => {
      processedIds.add(p.id);
      const stream = streamsMap.get(p.id);
      const pNotes = allNotes.filter(n => n.participantId === p.id);

      const isParticipantPaused = stream?.isPaused !== undefined ? stream.isPaused : Boolean(p.isPaused);
      const currentActiveTest = stream?.currentTestName || p.currentTest;
      const timerLeft = stream?.timerRemaining !== undefined ? stream.timerRemaining : p.timerRemaining;
      const completedList = (stream?.completedTests && stream.completedTests.length > 0) ? stream.completedTests : (p.completedTests || []);

      participantsList.push({
        participantId: p.id,
        name: p.name,
        username: p.username,
        status: stream?.status || p.status,
        testTitle: b.title,
        batchId: b.id,
        cameraFrameUrl: stream?.cameraFrameUrl || null,
        screenFrameUrl: stream?.screenFrameUrl || null,
        violationCount: stream?.violationCount || 0,
        lastActive: stream?.lastActive,
        notes: pNotes,
        currentTest: currentActiveTest,
        timerRemaining: timerLeft,
        completedTests: completedList,
        sequence: b.sequence || [],
        nextTest: p.nextTest || null,
        isPaused: isParticipantPaused
      });
    });
  });

  // STRICT ISOLATION:
  // Only add unmatched streams if viewing 'all' batches, NEVER when a specific batch is selected!
  if (selectedBatchId === 'all') {
    streamsMap.forEach((stream, pId) => {
      if (!processedIds.has(pId)) {
        const pNotes = allNotes.filter(n => n.participantId === pId);
        participantsList.push({
          participantId: pId,
          name: stream.name,
          username: stream.username,
          status: stream.status || 'in_progress',
          testTitle: stream.testTitle || 'Sesi Ujian',
          batchId: 0,
          cameraFrameUrl: stream.cameraFrameUrl,
          screenFrameUrl: stream.screenFrameUrl,
          violationCount: stream.violationCount,
          lastActive: stream.lastActive,
          notes: pNotes,
          currentTest: stream.currentTestName || null,
          timerRemaining: stream.timerRemaining || null,
          completedTests: stream.completedTests || [],
          sequence: [],
          nextTest: null,
          isPaused: Boolean(stream.isPaused)
        });
      }
    });
  }

  // Live Counts for the current batch selection
  const totalInBatchCount = participantsList.length;
  const onlineInBatchCount = participantsList.filter(p => isParticipantOnline(p)).length;

  // Filter by search & online filter
  const filteredParticipants = participantsList.filter(p => {
    if (filterOnlineOnly && !isParticipantOnline(p)) {
      return false;
    }
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.testTitle.toLowerCase().includes(q) ||
      String(p.participantId).includes(q)
    );
  });

  // Current selected batch object
  const currentBatch = selectedBatchId !== 'all' ? batches.find(b => String(b.id) === selectedBatchId) : (batches.length > 0 ? batches[0] : null);

  // Check if Emergency Stop is currently active for this batch
  const isEmergencyActive = Boolean(
    currentBatch?.isPaused || 
    (currentBatch?.participants && currentBatch.participants.length > 0 && currentBatch.participants.some((p: any) => p.status === 'stopped'))
  );

  // Table sequence determination
  const allSequences = Array.from(new Set(batches.flatMap(b => b.sequence || [])));
  const tableSequence: string[] = (currentBatch && currentBatch.sequence && currentBatch.sequence.length > 0)
    ? currentBatch.sequence
    : (allSequences.length > 0 ? allSequences : ['WPT', 'PAPI KOSTICK', 'DISC', 'KRAEPELIN']);

  const pausedParticipantsInBatch = filteredParticipants.filter(p => p.isPaused && p.status !== 'completed' && p.status !== 'stopped');

  // Proctor Notes Handlers (Private to log, never sent to testee)
  const handleOpenNotesModal = (p: ParticipantEntry) => {
    setNotesModalParticipant(p);
    setNewNoteText('');
  };

  const handleSaveNote = async (participantId: number) => {
    if (!newNoteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/superadmin/proctor/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          note: newNoteText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAllNotes(prev => [data.log, ...prev]);
        setNewNoteText('');
      } else {
        alert('Gagal menyimpan catatan pengawas.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat menyimpan catatan.');
    } finally {
      setSavingNote(false);
    }
  };

  // Toggle pause specifically AFTER a given test
  const handleToggleBreakAfter = async (prevTest: string, nextTest: string) => {
    if (!currentBatch) {
      alert('Pilih salah satu sesi ujian terlebih dahulu.');
      return;
    }
    try {
      const res = await fetch('/api/superadmin/proctor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_test_pause',
          batchId: currentBatch.id,
          prevTest,
          nextTest
        })
      });
      if (res.ok) {
        await fetchBatchesAndNotes();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengubah jeda tes.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat mengubah jeda tes.');
    }
  };

  // 1-Click Emergency Toggle:
  // If Emergency Stop is active -> 1-CLICK RESUME IMMEDIATELY (no modal!)
  // If Emergency Stop is not active -> Opens confirm modal to prevent accidental click
  const handleEmergencyToggle = async () => {
    if (!currentBatch) return;

    if (isEmergencyActive) {
      // 1-CLICK INSTANT RESUME!
      setProcessingAction(true);
      try {
        const res = await fetch('/api/superadmin/proctor/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resume_batch',
            batchId: currentBatch.id
          })
        });
        if (res.ok) {
          await fetchBatchesAndNotes();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setProcessingAction(false);
      }
    } else {
      // Open confirmation before activating emergency stop
      setConfirmModal({
        action: 'stop_batch',
        batchId: currentBatch.id,
        title: 'Emergency Stop',
        description: `Apakah Anda yakin ingin menghentikan sementara seluruh sesi ujian peserta? Layar ujian semua peserta akan langsung dikunci.`
      });
    }
  };

  // Quick 1-Click Resume for all participants waiting at regular breaks
  const handleResumeAllWaiting = async (nextTest?: string) => {
    if (!currentBatch) return;
    setProcessingAction(true);
    try {
      const res = await fetch('/api/superadmin/proctor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume_batch',
          batchId: currentBatch.id,
          nextTest
        })
      });
      if (res.ok) {
        await fetchBatchesAndNotes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingAction(false);
    }
  };

  // Quick 1-Click Resume for a single participant (also restores stopped participant)
  const handleResumeSingle = async (participantId: number, nextTest?: string) => {
    try {
      const res = await fetch('/api/superadmin/proctor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume_participant',
          participantId,
          nextTest
        })
      });
      if (res.ok) {
        await fetchBatchesAndNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Execute Confirmed Proctor Action (Stop single / Stop batch)
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModal) return;
    setProcessingAction(true);

    try {
      const { action, participantId, batchId } = confirmModal;
      let bodyData: any = { action };

      if (action === 'stop_single') {
        bodyData = { action: 'stop_participant', participantId };
      } else if (action === 'stop_batch') {
        bodyData = { action: 'stop_batch', batchId: batchId || currentBatch?.id };
      }

      const res = await fetch('/api/superadmin/proctor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        await fetchBatchesAndNotes();
        setConfirmModal(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal memproses aksi.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat memproses aksi pengawas.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Check if break is active after prevTest (before nextTest).
  // Uses canonical format: "BREAK_AFTER_<CLEANPREV>" — exact match only, no fallbacks.
  const isBreakActiveAfter = (prevTest: string, _nextTest: string): boolean => {
    if (!currentBatch) return false;
    let pausedList: string[] = [];
    if (Array.isArray(currentBatch.pausedTests)) {
      pausedList = currentBatch.pausedTests;
    } else if (typeof currentBatch.pausedTests === 'string') {
      try { 
        const parsed = JSON.parse(currentBatch.pausedTests); 
        pausedList = Array.isArray(parsed) ? parsed : [currentBatch.pausedTests];
      } catch (e) { 
        pausedList = [currentBatch.pausedTests]; 
      }
    }
    const cleanPrev = cleanTestName(prevTest);   // e.g. "WPT" or "PAPIKOSTICK"
    const canonicalKey = `BREAK_AFTER_${cleanPrev}`;
    return pausedList.some((pt: string) => String(pt).toUpperCase() === canonicalKey);
  };

  return (
    <div className="section p-6 space-y-5">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Monitoring Peserta Ujian</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Pantau durasi sisa waktu, alur jeda antar subtes, dan kendalikan pengawasan kamera secara real-time
          </p>
        </div>

        {/* Header Right: Status & Mode View */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-[12px] font-medium text-slate-600 shadow-xs">
            <span className={`w-2 h-2 rounded-full ${isSseConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>{isSseConnected ? 'Terhubung' : 'Sinkronisasi'}</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                displayMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tabel Progres
            </button>
            <button
              onClick={() => setDisplayMode('grid')}
              className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                displayMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kamera & Layar
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Container Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Toolbar: Filter Sesi, Filter Online, Cari, & Emergency Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500 font-medium shrink-0">Sesi:</span>
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-[12px] text-slate-800 bg-white font-medium focus:outline-none focus:border-slate-400"
              >
                <option value="all">Semua Sesi Ujian</option>
                {batches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.title}</option>
                ))}
              </select>
            </div>

            {/* Filter Online Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterOnlineOnly(false)}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                  !filterOnlineOnly 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({totalInBatchCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterOnlineOnly(true)}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                  filterOnlineOnly 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${onlineInBatchCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Hanya Online ({onlineInBatchCount})</span>
              </button>
            </div>

            <div className="w-full sm:w-56">
              <input
                type="text"
                placeholder="Cari nama atau username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Action Buttons: Emergency Stop & Lanjutkan Semua */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Lanjutkan Peserta di Jeda (Jika ada) */}
            {pausedParticipantsInBatch.length > 0 && !isEmergencyActive && (
              <button
                onClick={() => handleResumeAllWaiting()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-[12px] transition-colors shadow-xs"
              >
                ▶ Lanjutkan {pausedParticipantsInBatch.length} Peserta di Jeda
              </button>
            )}

            {/* Emergency Stop / 1-Click Resume Button */}
            {isEmergencyActive ? (
              <button
                onClick={handleEmergencyToggle}
                disabled={processingAction}
                title="Klik sekali untuk melanjutkan sesi pengerjaan"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[12px] transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>▶</span>
                <span>Lanjutkan Sesi</span>
              </button>
            ) : (
              <button
                onClick={handleEmergencyToggle}
                className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-[12px] transition-colors"
              >
                Emergency Stop
              </button>
            )}
          </div>
        </div>

        {/* View Controls for Camera Mode (Tampilan Feed & Pilihan Kolom) */}
        {displayMode === 'grid' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Tampilan Feed:</span>
              <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                {(['camera', 'screen', 'dual'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      viewMode === mode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode === 'camera' ? 'Kamera' : mode === 'screen' ? 'Layar' : 'Dual View'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[12px] text-slate-400 font-medium">
              Menampilkan {filteredParticipants.length} Peserta
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {loading ? (
          <div className="py-14 text-center text-slate-400 text-[13px]">Memuat data monitoring peserta…</div>
        ) : displayMode === 'table' ? (
          /* ══════════════════════════════════════════════════════════════════════════
             TABEL PROGRES ATUR JEDA
             ══════════════════════════════════════════════════════════════════════════ */
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-[12px]">
              {/* Header */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  {/* Sticky Kolom Nama Peserta */}
                  <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-200 px-4 py-3 min-w-[200px] text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                    Nama Peserta
                  </th>

                  {/* Sticky Kolom Kontrol / Aksi Peserta */}
                  <th className="sticky left-[200px] z-20 bg-slate-50 border-r border-slate-200 px-3 py-3 min-w-[210px] text-[11px] uppercase tracking-wider text-slate-600 font-bold shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
                    Kontrol Peserta
                  </th>

                  {/* Kolom Tes & Kolom Jeda Bebas */}
                  {tableSequence.map((testName, idx) => {
                    const nextTestName = tableSequence[idx + 1];
                    const breakActive = nextTestName ? isBreakActiveAfter(testName, nextTestName) : false;

                    const waitingCountHere = nextTestName ? filteredParticipants.filter(p => {
                      if (!p.isPaused) return false;
                      const cDone = (p.completedTests || []).map(cleanTestName);
                      return cDone.includes(cleanTestName(testName)) && !cDone.includes(cleanTestName(nextTestName));
                    }).length : 0;

                    return (
                      <React.Fragment key={testName}>
                        {/* Header Tes */}
                        <th className="px-4 py-3 border-r border-slate-200 text-center min-w-[130px] font-bold text-slate-800 text-[12px]">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-mono font-medium">#{idx + 1}</span>
                            <span className="text-slate-900">{testName}</span>
                          </div>
                        </th>

                        {/* Header Kolom Jeda Bebas per Tes */}
                        {nextTestName && (
                          <th className={`px-2.5 py-2.5 border-r border-slate-300 text-center transition-colors ${
                            breakActive ? 'bg-slate-200/90 min-w-[50px] max-w-[60px]' : 'bg-slate-50 min-w-[135px]'
                          }`}>
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                                JEDA SESI
                              </span>
                              {breakActive ? (
                                <div className="space-y-1">
                                  <span className="inline-block bg-slate-800 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-2xs">
                                    Jeda Aktif
                                  </span>
                                  <button
                                    onClick={() => handleToggleBreakAfter(testName, nextTestName)}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold block mx-auto underline transition-colors"
                                  >
                                    Matikan
                                  </button>

                                  {waitingCountHere > 0 && (
                                    <button
                                      onClick={() => handleResumeAllWaiting(nextTestName)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded block mx-auto transition-colors shadow-2xs"
                                    >
                                      ▶ Lanjut ({waitingCountHere})
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleToggleBreakAfter(testName, nextTestName)}
                                  className="text-[10px] text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium shadow-2xs transition-colors"
                                  title={`Atur jeda setelah ${testName} sebelum masuk ${nextTestName}`}
                                >
                                  + Jeda stlh {testName}
                                </button>
                              )}
                            </div>
                          </th>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableSequence.length * 2 + 2}
                      className="px-4 py-10 text-center text-slate-400 italic text-[12px]"
                    >
                      {filterOnlineOnly 
                        ? 'Tidak ada peserta yang sedang online pada sesi ini.' 
                        : (search ? 'Tidak ada peserta yang cocok dengan kata kunci pencarian.' : 'Belum ada peserta pada sesi ini.')}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map(p => {
                    const isOnline = isParticipantOnline(p);
                    const isStopped = p.status === 'stopped';
                    const isCompleted = p.status === 'completed';

                    return (
                      <tr key={p.participantId} className="hover:bg-slate-50/70 transition-colors">
                        {/* Sticky Kolom Nama Peserta */}
                        <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-4 py-2.5 shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                                  }`}
                                  title={isOnline ? 'Online / Sedang Aktif' : 'Offline'}
                                />
                                <span className="font-bold text-slate-900 text-[13px] truncate">{p.name}</span>
                              </div>
                              <span className="text-slate-400 font-mono text-[10px] shrink-0">#{p.participantId}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono pl-3.5">@{p.username}</p>
                            <div className="pt-0.5 pl-3.5 flex items-center gap-1.5 flex-wrap">
                              {isStopped ? (
                                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded inline-block">
                                  Dihentikan
                                </span>
                              ) : p.isPaused ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded inline-block">
                                  Menyiapkan {p.nextTest || p.currentTest?.replace(/^Jeda stlh\s+/i, '') || 'Ujian'}
                                </span>
                              ) : isCompleted ? (
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded inline-block">
                                  Selesai
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded inline-block">
                                  {p.currentTest ? `Menyiapkan ${p.currentTest}` : 'Menyiapkan Ujian'}
                                </span>
                              )}
                              {isOnline && !isCompleted && !isStopped && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                                  Online
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Sticky Kolom Kontrol / Aksi Peserta */}
                        <td className="sticky left-[200px] z-10 bg-white border-r border-slate-200 px-3 py-2.5 shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isStopped || p.isPaused ? (
                              <button
                                onClick={() => handleResumeSingle(p.participantId, p.nextTest || undefined)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                                title="Lanjutkan pengerjaan peserta ini"
                              >
                                <span>▶</span>
                                <span>Lanjutkan</span>
                              </button>
                            ) : isCompleted ? (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                Selesai
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmModal({
                                  action: 'stop_single',
                                  participantId: p.participantId,
                                  title: 'Hentikan Ujian Peserta',
                                  description: `Hentikan pengerjaan ${p.name} (#${p.participantId})? Layar ujian peserta akan dikunci.`
                                })}
                                className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition-colors"
                              >
                                Hentikan
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenNotesModal(p)}
                              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] px-2 py-1 rounded-lg transition-colors font-medium"
                              title="Tulis catatan pengawasan ke log"
                            >
                              + Catatan
                            </button>

                            <button
                              onClick={() => setVideoModalParticipant(p)}
                              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] px-2 py-1 rounded-lg transition-colors font-medium"
                              title="Lihat feed kamera & layar"
                            >
                              Kamera
                            </button>
                          </div>
                        </td>

                        {/* Kolom Modul Tes */}
                        {tableSequence.map((testName, idx) => {
                          const testMatches = (t1?: string | null, t2?: string | null) => {
                            if (!t1 || !t2) return false;
                            const s1 = cleanTestName(t1);
                            const s2 = cleanTestName(t2);
                            return s1 === s2 || s1.includes(s2) || s2.includes(s1);
                          };

                          const isDone = (p.completedTests || []).some(ct => testMatches(ct, testName));
                          const nextTestName = tableSequence[idx + 1];
                          const breakActive = nextTestName ? isBreakActiveAfter(testName, nextTestName) : false;

                          // Apakah peserta sedang aktif di modul ini?
                          const isCurrentActiveTest = !isDone && !p.isPaused && p.status !== 'stopped' && (
                            testMatches(p.currentTest, testName) || 
                            testMatches(p.nextTest, testName) ||
                            (idx === 0 && (!p.completedTests || p.completedTests.length === 0))
                          );
                          const isStoppedAtThisTest = !isDone && (p.status === 'stopped') && (
                            testMatches(p.currentTest, testName) || testMatches(p.nextTest, testName) || idx === 0
                          );

                          return (
                            <React.Fragment key={testName}>
                              {/* Sel Modul Tes */}
                              <td
                                className={`border-r border-slate-200 px-3 py-3 text-center transition-colors ${
                                  isDone
                                    ? 'bg-slate-100/80 text-slate-400 font-medium select-none'
                                    : isCurrentActiveTest
                                      ? 'bg-white text-slate-900 font-bold'
                                      : isStoppedAtThisTest
                                        ? 'bg-rose-50/50 text-rose-700'
                                        : 'text-slate-300'
                                }`}
                              >
                                {isDone ? (
                                  <span className="text-slate-400 font-medium text-[11px]">
                                    Selesai
                                  </span>
                                ) : isCurrentActiveTest ? (
                                  <span className={`font-mono text-[13px] font-bold ${
                                    typeof p.timerRemaining === 'number' && p.timerRemaining < 60
                                      ? 'text-rose-600 animate-pulse'
                                      : 'text-slate-900'
                                  }`}>
                                    {formatSeconds(p.timerRemaining)}
                                  </span>
                                ) : isStoppedAtThisTest ? (
                                  <span className="text-rose-600 font-bold text-[12px]">
                                    Dihentikan
                                  </span>
                                ) : (
                                  <span className="font-mono text-[12px] select-none text-slate-400 font-medium">
                                    {idx === 0 && !p.isPaused && p.status !== 'stopped' ? '--:--' : '-'}
                                  </span>
                                )}
                              </td>

                              {/* Sel Kolom Jeda Antar Modul */}
                              {nextTestName && (
                                breakActive ? (
                                  <td className="border-r border-slate-300 bg-slate-300/80 px-1.5 py-3 text-center align-middle w-12 min-w-[48px] max-w-[56px]">
                                    <div className="flex flex-col items-center justify-center font-black text-slate-800 text-[11px] tracking-widest select-none leading-4">
                                      <span>J</span>
                                      <span>E</span>
                                      <span>D</span>
                                      <span>A</span>
                                    </div>
                                  </td>
                                ) : (
                                  <td className="border-r border-slate-200 px-2.5 py-3 text-center transition-colors bg-slate-50/40">
                                    <span className="text-slate-300 select-none">-</span>
                                  </td>
                                )
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════════
             GRID KAMERA & LAYAR DENGAN LOOK PROFESIONAL DAN TOMBOL HENTIKAN DI SEMUA KARTU
             ══════════════════════════════════════════════════════════════════════════ */
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {filteredParticipants.length === 0 ? (
              <div className="col-span-full py-14 text-center text-slate-400 text-[13px] bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                {filterOnlineOnly 
                  ? 'Tidak ada peserta yang sedang online pada sesi ini.' 
                  : (search ? 'Tidak ada peserta yang cocok dengan kata kunci pencarian.' : 'Belum ada peserta pada sesi ini.')}
              </div>
            ) : (
              filteredParticipants.map(participant => {
                const isOnline = isParticipantOnline(participant);
                const isViolation = (participant.violationCount || 0) > 0;
                const isStopped = participant.status === 'stopped';
                const isCompleted = participant.status === 'completed';

                return (
                  <div
                    key={participant.participantId}
                    className={`bg-white rounded-2xl border overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all duration-200 ${
                      isStopped 
                        ? 'border-rose-200 ring-1 ring-rose-200' 
                        : participant.isPaused 
                          ? 'border-amber-200 ring-1 ring-amber-100' 
                          : isViolation 
                            ? 'border-rose-300 ring-1 ring-rose-200' 
                            : 'border-slate-200'
                    }`}
                  >
                    {/* Video Monitor Frame: 16:10 aspect ratio, sleek dark canvas */}
                    <div className="relative bg-slate-950 aspect-[16/10] overflow-hidden flex items-center justify-center border-b border-slate-100">
                      {viewMode === 'camera' && (
                        participant.cameraFrameUrl ? (
                          <img src={participant.cameraFrameUrl} alt={participant.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 select-none">
                            <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            <span className="text-[11px] font-medium text-slate-400 tracking-wide">Kamera Siaga</span>
                          </div>
                        )
                      )}

                      {viewMode === 'screen' && (
                        participant.screenFrameUrl ? (
                          <img src={participant.screenFrameUrl} alt={participant.name} className="w-full h-full object-contain bg-slate-950" />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 select-none">
                            <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                            </svg>
                            <span className="text-[11px] font-medium text-slate-400 tracking-wide">Layar Siaga</span>
                          </div>
                        )
                      )}

                      {viewMode === 'dual' && (
                        <div className="grid grid-cols-2 w-full h-full divide-x divide-slate-800">
                          {/* Camera Left Half */}
                          <div className="relative bg-slate-950 flex items-center justify-center overflow-hidden">
                            {participant.cameraFrameUrl ? (
                              <img src={participant.cameraFrameUrl} alt="Kamera" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-slate-500 text-[10px]">Kamera</span>
                            )}
                            <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-slate-300 text-[8px] font-bold px-1.5 py-0.2 rounded">
                              KAMERA
                            </span>
                          </div>

                          {/* Screen Right Half */}
                          <div className="relative bg-slate-950 flex items-center justify-center overflow-hidden">
                            {participant.screenFrameUrl ? (
                              <img src={participant.screenFrameUrl} alt="Layar" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-slate-500 text-[10px]">Layar</span>
                            )}
                            <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-slate-300 text-[8px] font-bold px-1.5 py-0.2 rounded">
                              LAYAR
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Floating Pill: Status (Top-Left, inset 10px so never clipped) */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        {isStopped ? (
                          <span className="bg-rose-950/85 backdrop-blur-xs text-rose-300 border border-rose-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                            Dihentikan
                          </span>
                        ) : participant.isPaused ? (
                          <span className="bg-slate-900/85 backdrop-blur-xs text-amber-300 border border-amber-600/50 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                            Jeda
                          </span>
                        ) : isCompleted ? (
                          <span className="bg-slate-900/85 backdrop-blur-xs text-slate-300 border border-slate-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                            Selesai
                          </span>
                        ) : isOnline ? (
                          <span className="bg-slate-900/85 backdrop-blur-xs text-emerald-400 border border-emerald-600/50 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="bg-slate-900/85 backdrop-blur-xs text-slate-400 border border-slate-700/50 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Offline
                          </span>
                        )}

                        {isViolation && !isStopped && (
                          <span className="bg-rose-950/90 text-rose-300 border border-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                            {participant.violationCount}x
                          </span>
                        )}
                      </div>

                    {/* Floating Pill: ID Peserta (Top-Right) */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-slate-900/85 backdrop-blur-xs text-slate-300 border border-slate-700/60 text-[10px] font-mono px-2 py-0.5 rounded-full shadow-xs">
                        #{participant.participantId}
                      </span>
                    </div>
                  </div>

                  {/* Card Body & Controls */}
                  <div className="p-3.5 space-y-2.5 bg-white">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 truncate leading-snug">{participant.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">@{participant.username}</p>
                    </div>

                    {/* Active Test & Duration Strip */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium truncate max-w-[130px]">
                        {participant.isPaused 
                          ? ((participant.completedTests && participant.completedTests.length > 0) 
                              ? `Jeda stlh ${participant.completedTests[participant.completedTests.length - 1]}` 
                              : 'Sedang Jeda')
                          : isStopped
                            ? 'Ujian Dihentikan'
                            : (participant.currentTest || (isCompleted ? 'Semua Selesai' : 'Belum Mulai'))}
                      </span>
                      <span className={`font-mono font-bold ${
                        typeof participant.timerRemaining === 'number' && participant.timerRemaining < 60
                          ? 'text-rose-600 animate-pulse'
                          : 'text-slate-900'
                      }`}>
                        {formatSeconds(participant.timerRemaining)}
                      </span>
                    </div>

                    {/* Action Buttons: TOMBOL HENTIKAN / LANJUTKAN SELALU ADA DI SEMUA KARTU */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      {isStopped ? (
                        <button
                          onClick={() => handleResumeSingle(participant.participantId, participant.nextTest || undefined)}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                        >
                          <span>▶</span>
                          <span>Lanjutkan</span>
                        </button>
                      ) : participant.isPaused ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <button
                            onClick={() => handleResumeSingle(participant.participantId, participant.nextTest || undefined)}
                            className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                          >
                            <span>▶</span>
                            <span>Lanjut Sesi</span>
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              action: 'stop_single',
                              participantId: participant.participantId,
                              title: 'Hentikan Ujian Peserta',
                              description: `Hentikan pengerjaan ${participant.name} (#${participant.participantId})? Layar ujian akan dikunci.`
                            })}
                            className="py-1.5 px-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold transition-colors"
                          >
                            Hentikan
                          </button>
                        </div>
                      ) : isCompleted ? (
                        <button
                          onClick={() => setConfirmModal({
                            action: 'stop_single',
                            participantId: participant.participantId,
                            title: 'Kunci Akses Ujian Peserta',
                            description: `Kunci akses ujian untuk ${participant.name} (#${participant.participantId})?`
                          })}
                          className="flex-1 py-1.5 px-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-[11px] font-semibold transition-colors"
                        >
                          Kunci / Hentikan
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({
                            action: 'stop_single',
                            participantId: participant.participantId,
                            title: 'Hentikan Ujian Peserta',
                            description: `Hentikan pengerjaan ${participant.name} (#${participant.participantId})? Layar ujian peserta akan dikunci.`
                          })}
                          className="flex-1 py-1.5 px-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[12px] font-semibold transition-colors text-center"
                        >
                          Hentikan
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenNotesModal(participant)}
                        className="py-1.5 px-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-medium transition-colors text-center"
                        title="Tulis catatan pengawasan ke log"
                      >
                        + Catatan
                      </button>

                      <button
                        onClick={() => setVideoModalParticipant(participant)}
                        className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-medium transition-colors text-center"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        )}
      </div>

      {/* ── MODAL: Detail Feed Kamera & Layar ── */}
      {videoModalParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <span>Feed Langsung: {videoModalParticipant.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">#{videoModalParticipant.participantId}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  @{videoModalParticipant.username} • Sesi: {videoModalParticipant.testTitle}
                </p>
              </div>
              <button
                onClick={() => setVideoModalParticipant(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-[18px] leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 rounded-xl overflow-hidden h-[260px] relative border border-slate-200 flex items-center justify-center">
                {videoModalParticipant.cameraFrameUrl ? (
                  <img src={videoModalParticipant.cameraFrameUrl} alt="Kamera" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-slate-400 text-[11px]">Kamera Siaga</div>
                )}
                <span className="absolute top-2.5 left-2.5 bg-black/75 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  KAMERA
                </span>
              </div>

              <div className="bg-slate-950 rounded-xl overflow-hidden h-[260px] relative border border-slate-200 flex items-center justify-center">
                {videoModalParticipant.screenFrameUrl ? (
                  <img src={videoModalParticipant.screenFrameUrl} alt="Layar" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-slate-400 text-[11px]">Layar Siaga</div>
                )}
                <span className="absolute top-2.5 left-2.5 bg-black/75 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  LAYAR
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  handleOpenNotesModal(videoModalParticipant);
                  setVideoModalParticipant(null);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium"
              >
                + Tulis Catatan Log
              </button>

              <div className="flex items-center gap-2">
                {videoModalParticipant.status === 'stopped' ? (
                  <button
                    onClick={() => {
                      handleResumeSingle(videoModalParticipant.participantId, videoModalParticipant.nextTest || undefined);
                      setVideoModalParticipant(null);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs"
                  >
                    ▶ Lanjutkan Ujian
                  </button>
                ) : videoModalParticipant.isPaused ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        handleResumeSingle(videoModalParticipant.participantId, videoModalParticipant.nextTest || undefined);
                        setVideoModalParticipant(null);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold shadow-xs"
                    >
                      ▶ Lanjut Sesi
                    </button>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          action: 'stop_single',
                          participantId: videoModalParticipant.participantId,
                          title: 'Hentikan Ujian Peserta',
                          description: `Hentikan pengerjaan ${videoModalParticipant.name}? Layar ujian akan dikunci.`
                        });
                        setVideoModalParticipant(null);
                      }}
                      className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold"
                    >
                      Hentikan Ujian
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        action: 'stop_single',
                        participantId: videoModalParticipant.participantId,
                        title: 'Hentikan Ujian Peserta',
                        description: `Hentikan pengerjaan ${videoModalParticipant.name}? Layar ujian akan dikunci.`
                      });
                      setVideoModalParticipant(null);
                    }}
                    className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold"
                  >
                    Hentikan Ujian
                  </button>
                )}

                <button
                  onClick={() => setVideoModalParticipant(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Catatan Pengawas (Hanya Masuk ke Log, Tidak ke Layar Peserta) ── */}
      {notesModalParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-[14px] font-bold text-slate-900">
                Catatan Log: {notesModalParticipant.name}
              </h3>
              <button
                onClick={() => setNotesModalParticipant(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-[18px] leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Catatan pengawasan tersimpan ke berkas log pengawas/psikolog dan tidak ditampilkan ke layar peserta.
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="Tulis catatan kejadian pengawasan di sini…"
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveNote(notesModalParticipant.participantId)}
                  disabled={savingNote || !newNoteText.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded-xl text-[11px] transition-colors disabled:opacity-50"
                >
                  {savingNote ? 'Menyimpan…' : 'Simpan ke Log'}
                </button>
              </div>
            </div>

            {/* Riwayat Catatan */}
            <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Riwayat Catatan</p>
              {(notesModalParticipant.notes || []).length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">Belum ada catatan.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {(notesModalParticipant.notes || []).map(n => (
                    <div key={n.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px]">
                      <p className="text-slate-800">{n.mediaUrl}</p>
                      <p className="text-[9px] text-slate-400 text-right mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Konfirmasi Stop Single / Emergency Stop Aktif ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-xl text-slate-900">
            <h3 className="text-[14px] font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed">{confirmModal.description}</p>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={processingAction}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[11px] font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteConfirmedAction}
                disabled={processingAction}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                {processingAction ? 'Memproses…' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
