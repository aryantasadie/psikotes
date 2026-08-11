'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
}

export default function LiveStreamPage() {
  const [streamsMap, setStreamsMap] = useState<Map<number, LiveStreamItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [gridColumns, setGridColumns] = useState<number>(4);
  const [viewMode, setViewMode] = useState<'camera' | 'screen' | 'dual'>('dual');
  const [focusedParticipantId, setFocusedParticipantId] = useState<number | null>(null);
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;

    const connectSSE = () => {
      es = new EventSource('/api/stream/sse');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsSseConnected(true);
        setLoading(false);
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
            setLoading(false);
            setLastUpdated(new Date());
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
                });
              });
              return newMap;
            });
            setLastUpdated(new Date());
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
              });
              return newMap;
            });
            setLastUpdated(new Date());
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      es.onerror = () => {
        setIsSseConnected(false);
        fetchFallbackFeed();
      };
    };

    const fetchFallbackFeed = async () => {
      try {
        const res = await fetch('/api/stream/feed');
        if (res.ok) {
          const data = await res.json();
          setStreamsMap((prev) => {
            const newMap = new Map(prev);
            (data.streams || []).forEach((item: LiveStreamItem) => {
              newMap.set(item.participantId, item);
            });
            return newMap;
          });
          setLastUpdated(new Date());
        }
      } catch (e) {
        console.error('Fallback feed error:', e);
      } finally {
        setLoading(false);
      }
    };

    connectSSE();

    const fallbackInterval = setInterval(() => {
      if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
        fetchFallbackFeed();
      }
    }, 3000);

    return () => {
      if (es) {
        es.close();
      }
      clearInterval(fallbackInterval);
    };
  }, []);

  const streamsList = Array.from(streamsMap.values()).filter(s => Date.now() - s.lastActive < 60000);
  const focusedStream = streamsList.find(s => s.participantId === focusedParticipantId);

  return (
    <div className="p-6 bg-slate-900 min-h-[88vh] rounded-2xl text-slate-100 space-y-6">
      {/* Control Room Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-[20px] font-bold text-white">
              Live Stream Kamera & Layar (CCTV Control Room)
            </h2>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
              isSseConnected ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              {isSseConnected ? '⚡ SSE REALTIME STREAM (50+ PARTICIPANTS)' : 'POLLING FALLBACK'}
            </span>
          </div>
          <p className="text-[13px] text-slate-400">
            Penyiaran video kamera & layar pengerjaan 50+ peserta simultan secara realtime.
          </p>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Display Mode Switcher */}
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            {(['camera', 'screen', 'dual'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${
                  viewMode === mode ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'camera' ? '📷 Kamera' : mode === 'screen' ? '🖥️ Layar' : '🖼️ Dual View'}
              </button>
            ))}
          </div>

          {/* Grid Layout Selector */}
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            {[2, 3, 4, 5, 6].map(cols => (
              <button
                key={cols}
                onClick={() => setGridColumns(cols)}
                className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all ${
                  gridColumns === cols ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cols} Kolom
              </button>
            ))}
          </div>

          <div className="bg-slate-800 text-emerald-400 px-3.5 py-1.5 rounded-xl text-[12px] font-bold border border-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {streamsList.length} Stream Aktif
          </div>
        </div>
      </div>

      {/* Main Stream Monitor Area */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-[13px]">Memuat saluran video live stream WebP SSE…</div>
      ) : streamsList.length === 0 ? (
        <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-slate-900 text-sky-400 rounded-full flex items-center justify-center text-3xl mx-auto border border-sky-600">
            📹
          </div>
          <h3 className="text-[18px] font-bold text-white">
            Tidak Ada Stream Kamera & Layar Aktif saat Ini
          </h3>
          <p className="text-slate-400 text-[13px] leading-relaxed">
            Belum ada peserta yang menyiarkan tes. Saat peserta mulai membuka ujian, tayangan kamera & layar pengerjaan peserta akan langsung tampil otomatis di layar CCTV monitor ini.
          </p>
          <Link
            href="/superadmin/schedule"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm text-decoration-none"
          >
            + Buka / Buat Sesi Ujian Peserta
          </Link>
        </div>
      ) : focusedStream ? (
        /* SINGLE FOCUSED MONITOR VIEW */
        <div className="space-y-4">
          <button
            onClick={() => setFocusedParticipantId(null)}
            className="inline-flex items-center gap-1.5 bg-slate-800 text-sky-400 border border-sky-600 px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-slate-700 transition-colors"
          >
            ← Kembali ke Multi-Kamera CCTV Grid
          </button>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">SINGLE FOCUS MONITOR</span>
                <h2 className="text-[22px] font-bold text-white mt-0.5">{focusedStream.name}</h2>
                <p className="text-[13px] text-slate-400">User: @{focusedStream.username} • Modul: {focusedStream.testTitle}</p>
              </div>

              {focusedStream.violationCount > 0 && (
                <div className="bg-rose-950 text-rose-300 border border-rose-800 px-4 py-2 rounded-xl font-bold text-[13px]">
                  ⚠️ Pelanggaran Terdeteksi: {focusedStream.violationCount}x
                </div>
              )}
            </div>

            {/* Side-by-side Large Video Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Camera Stream */}
              <div className="bg-black rounded-xl overflow-hidden h-[380px] relative border border-slate-700 flex items-center justify-center">
                {focusedStream.cameraFrameUrl ? (
                  <img src={focusedStream.cameraFrameUrl} alt="Live Camera" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-slate-500 text-[12px]">Stream Kamera Tidak Tersedia</div>
                )}
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                  🔴 KAMERA PESERTA (REALTIME WebP)
                </span>
              </div>

              {/* Screen Stream */}
              <div className="bg-black rounded-xl overflow-hidden h-[380px] relative border border-slate-700 flex items-center justify-center">
                {focusedStream.screenFrameUrl ? (
                  <img src={focusedStream.screenFrameUrl} alt="Live Screen" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-slate-500 text-[12px]">Stream Layar Tidak Tersedia</div>
                )}
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                  🖥️ LAYAR PENGERJAAN PESERTA (LIVE)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MULTI-CAMERA CCTV GRID VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[13px] text-slate-400 font-semibold">
            <span>Menampilkan {streamsList.length} Stream Aktif • Diperbarui Realtime: {lastUpdated.toLocaleTimeString('id-ID')}</span>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
            {streamsList.map((stream) => {
              const isViolation = stream.violationCount > 0;

              return (
                <div
                  key={stream.participantId}
                  className={`bg-slate-800 rounded-xl border-2 overflow-hidden flex flex-col shadow-lg transition-all ${
                    isViolation ? 'border-rose-600' : 'border-slate-700'
                  }`}
                >
                  {/* Video Monitor Display */}
                  <div className={`relative bg-black overflow-hidden ${viewMode === 'dual' ? 'h-[280px]' : 'h-[200px]'}`}>
                    {viewMode === 'camera' && (
                      stream.cameraFrameUrl ? (
                        <img src={stream.cameraFrameUrl} alt={stream.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">Frame Kamera WebP…</div>
                      )
                    )}

                    {viewMode === 'screen' && (
                      stream.screenFrameUrl ? (
                        <img src={stream.screenFrameUrl} alt={stream.name} className="w-full h-full object-contain bg-slate-900" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">Frame Layar WebP…</div>
                      )
                    )}

                    {viewMode === 'dual' && (
                      <div className="flex flex-col h-full">
                        {/* Camera Top Half */}
                        <div className="h-1/2 border-b border-slate-700 relative bg-black flex items-center justify-center">
                          {stream.cameraFrameUrl ? (
                            <img src={stream.cameraFrameUrl} alt="Camera" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-500 text-[11px]">Menunggu Kamera…</div>
                          )}
                          <span className="absolute top-1 left-1 bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            📷 KAMERA
                          </span>
                        </div>

                        {/* Screen Bottom Half */}
                        <div className="h-1/2 relative bg-slate-900 flex items-center justify-center">
                          {stream.screenFrameUrl ? (
                            <img src={stream.screenFrameUrl} alt="Screen" className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-slate-500 text-[11px]">Menunggu Layar…</div>
                          )}
                          <span className="absolute top-1 left-1 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            🖥️ LAYAR
                          </span>
                        </div>
                      </div>
                    )}

                    {/* CCTV Overlay Badges */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        CAM-{stream.participantId}
                      </span>
                    </div>

                    {isViolation && (
                      <span className="absolute top-8 right-2 bg-rose-950 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-800">
                        ⚠️ {stream.violationCount} PELANGGARAN
                      </span>
                    )}

                    {/* Timestamp overlay */}
                    <div className="absolute bottom-1.5 right-2 bg-black/75 text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {new Date(stream.lastActive).toLocaleTimeString('id-ID')} REC
                    </div>
                  </div>

                  {/* Monitor Footer Info */}
                  <div className="p-3 bg-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-white truncate">{stream.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{stream.testTitle}</p>
                    </div>

                    <button
                      onClick={() => setFocusedParticipantId(stream.participantId)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors shrink-0"
                    >
                      🖥️ Focus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
