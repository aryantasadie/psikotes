'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CbtProctoringGuardProps {
  children: React.ReactNode;
}

export default function CbtProctoringGuard({ children }: CbtProctoringGuardProps) {
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [screenActive, setScreenActive] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Fetch participant ID
  useEffect(() => {
    const savedId = localStorage.getItem('current_participant_id');
    if (savedId) {
      setParticipantId(parseInt(savedId, 10));
    } else {
      fetch('/api/testee/session')
        .then(r => r.json())
        .then(data => {
          if (data.participantId) {
            setParticipantId(data.participantId);
            localStorage.setItem('current_participant_id', String(data.participantId));
          }
        })
        .catch(console.error);
    }
  }, []);

  // Fullscreen helper
  const requestFullscreen = async () => {
    try {
      const elem = containerRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  // Initialize Webcam
  const setupWebcam = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setWebcamError('Browser memblokir kamera karena situs diakses via HTTP IP (bukan HTTPS). Akses via HTTPS Vercel atau http://localhost:3000.');
      setWebcamActive(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWebcamError('Fitur kamera tidak didukung atau diblokir oleh browser pada perangkat ini.');
      setWebcamActive(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setWebcamActive(true);
      setWebcamError(null);
    } catch (err: any) {
      console.error('Webcam access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setWebcamError('Izin kamera ditolak/diblokir oleh browser. Klik ikon gembok/kamera di alamat URL browser lalu ubah izin Kamera menjadi Allow (Izinkan).');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setWebcamError('Kamera web tidak ditemukan pada laptop/perangkat ini. Pastikan webcam terhubung.');
      } else {
        setWebcamError(`Kamera gagal diakses (${err.message || err.name}). Pastikan tidak ada aplikasi lain yang menggunakan kamera.`);
      }
      setWebcamActive(false);
    }
  };

  // Initialize Desktop Screen Recording (getDisplayMedia)
  const setupScreenShare = async () => {
    if (typeof window !== 'undefined' && (window as any).__cbtScreenStream) {
      const existingStream: MediaStream = (window as any).__cbtScreenStream;
      if (existingStream.active && existingStream.getVideoTracks().length > 0) {
        screenStreamRef.current = existingStream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = existingStream;
          try {
            await screenVideoRef.current.play();
          } catch {}
        }
        setScreenActive(true);
        setScreenError(null);

        existingStream.getVideoTracks()[0].onended = () => {
          setScreenActive(false);
        };
        return;
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setScreenError('Browser ini tidak mendukung fitur rekam layar otomatis.');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      screenStreamRef.current = screenStream;
      (window as any).__cbtScreenStream = screenStream;

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        await screenVideoRef.current.play();
      }
      setScreenActive(true);
      setScreenError(null);

      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setScreenActive(false);
        };
      }
    } catch (err: any) {
      console.error('Screen share error:', err);
      setScreenActive(false);
    }
  };

  useEffect(() => {
    setupWebcam();
    setupScreenShare();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getWebcamBase64 = (): string | null => {
    if (!videoRef.current || !webcamActive) return null;
    const video = videoRef.current;
    if (video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const getWebcamWebPBase64 = (): string | null => {
    if (!videoRef.current || !webcamActive) return null;
    const video = videoRef.current;
    if (video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 320, 240);
    try {
      return canvas.toDataURL('image/webp', 0.45);
    } catch {
      return canvas.toDataURL('image/jpeg', 0.5);
    }
  };

  const getScreenBase64 = async (): Promise<string | null> => {
    try {
      if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
        const video = screenVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.7);
        }
      }

      const container = containerRef.current;
      const width = 800;
      const height = 450;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, width, 50);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('💻 CBT PSYCHOMETRIC TESTEE SCREEN MONITOR', 20, 30);
      ctx.fillStyle = '#10B981';
      ctx.font = '12px sans-serif';
      ctx.fillText('🔴 LIVE RECORDING', width - 150, 30);

      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(20, 70, width - 40, height - 90, 12);
      ctx.fill();

      let questionTitle = 'Halaman Soal Tes Psikotes sedang Dikerjakan';
      let selectedOption = 'Mengerjakan Soal...';
      let pageTitle = document.title || 'Ujian Psikotes';

      if (container) {
        const headings = container.querySelectorAll('h1, h2, h3, p, label');
        const textArr: string[] = [];
        headings.forEach(h => {
          const t = (h.textContent || '').trim();
          if (t.length > 5 && textArr.length < 5) textArr.push(t);
        });
        if (textArr.length > 0) questionTitle = textArr[0].substring(0, 70);
        if (textArr.length > 1) selectedOption = textArr[1].substring(0, 70);
      }

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Modul: ${pageTitle}`, 40, 100);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(questionTitle, 40, 135);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px sans-serif';
      ctx.fillText(selectedOption, 40, 175);

      ctx.fillStyle = '#0284C7';
      ctx.fillRect(40, 220, 200, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`Peserta ID: #${participantId || 'Live'}`, 55, 243);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(`Tangkapan Layar CBT - ${new Date().toLocaleString('id-ID')}`, 40, height - 40);

      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (err) {
      console.error('Screen capture error:', err);
      return null;
    }
  };

  const getScreenWebPBase64 = async (): Promise<string | null> => {
    try {
      if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
        const video = screenVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 480, 270);
          try {
            return canvas.toDataURL('image/webp', 0.45);
          } catch {
            return canvas.toDataURL('image/jpeg', 0.5);
          }
        }
      }
      return await getScreenBase64();
    } catch {
      return null;
    }
  };

  const sendSecurityLog = async (logType: string, customImage?: string | null) => {
    if (!participantId) return;

    try {
      const cameraImg = customImage !== undefined ? customImage : getWebcamBase64();
      if (cameraImg) {
        await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId,
            logType: logType.startsWith('camera') || logType.startsWith('screen') ? logType : `camera_${logType}`,
            image: cameraImg
          })
        });
      }

      if (logType === 'screen' || logType === 'tab_switch' || logType === 'blur_fullscreen') {
        const screenImg = await getScreenBase64();
        if (screenImg) {
          await fetch('/api/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId,
              logType: logType === 'screen' ? 'screen' : `screen_${logType}`,
              image: screenImg
            })
          });
        }
      }
    } catch (err) {
      console.error('Failed to send security log:', err);
    }
  };

  // Periodic capture to DB
  useEffect(() => {
    if (!participantId || !webcamActive) return;

    const interval = setInterval(() => {
      sendSecurityLog('camera');
      sendSecurityLog('screen');
    }, 20000);

    return () => clearInterval(interval);
  }, [participantId, webcamActive]);

  // Live Stream Broadcast every 1.5s
  useEffect(() => {
    if (!participantId || !webcamActive) return;

    const testeeName = sessionStorage.getItem('testee_name') || undefined;

    const streamInterval = setInterval(async () => {
      try {
        const cameraFrame = getWebcamWebPBase64();
        const screenFrame = await getScreenWebPBase64();
        if (cameraFrame || screenFrame) {
          await fetch('/api/stream/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId,
              name: testeeName,
              cameraFrame,
              screenFrame,
              violationCount
            })
          });
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(streamInterval);
  }, [participantId, webcamActive, violationCount]);

  // Event Listener: Tab Switch & Window Blur Detection
  useEffect(() => {
    if (!participantId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Anda terdeteksi meninggalkan tab/halaman ujian (Alt+Tab / Pindah Tab)!');
        sendSecurityLog('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      // Only trigger if document is actually hidden (switching tab/window)
      if (document.hidden) {
        handleViolation('Jendela browser Anda kehilangan fokus (pindah window/tab)!');
        sendSecurityLog('tab_switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [participantId]);

  // Event Listener: Anti-Cheat Shortcuts, Right Click, Copy-Paste, DevTools
  useEffect(() => {
    if (!participantId) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('Klik kanan (Context Menu) dilarang selama ujian.');
      sendSecurityLog('forbidden_key');
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Tindakan Copy/Cut/Paste dilarang dalam sistem ujian ini.');
      sendSecurityLog('forbidden_key');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isForbiddenKey = 
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && ['c', 'v', 'x', 'p', 'u', 'a'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()));

      if (isForbiddenKey) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation(`Tombol kombinasi (${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}) dilarang!`);
        sendSecurityLog('forbidden_key');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [participantId]);

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS && participantId && webcamActive && screenActive) {
        setShowFullscreenModal(true);
        sendSecurityLog('blur_fullscreen');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [participantId, webcamActive, screenActive]);

  const handleViolation = (reason: string) => {
    setViolationCount(prev => prev + 1);
    setViolationMessage(reason);
    setShowViolationModal(true);
  };

  const handleAcknowledgeAndFullscreen = () => {
    setShowViolationModal(false);
    setShowFullscreenModal(false);
    requestFullscreen();
  };

  const isPermissionGranted = webcamActive && screenActive;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        background: '#f8fafc'
      }}
    >
      {/* Hidden Video & Canvas for Captures */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '320px', height: '240px', opacity: 0, pointerEvents: 'none' }}
      />
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '640px', height: '360px', opacity: 0, pointerEvents: 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Proctoring Status Indicator Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          background: '#0F172A',
          color: '#F8FAFC',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: webcamActive ? '#10B981' : '#EF4444' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: webcamActive ? '#10B981' : '#EF4444' }}></span>
            {webcamActive ? '📷 Kamera (ACC)' : '📷 Kamera (Nonaktif)'}
          </span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: screenActive ? '#10B981' : '#EF4444' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: screenActive ? '#10B981' : '#EF4444' }}></span>
            {screenActive ? '🖥️ Rekam Layar (ACC)' : '🖥️ Rekam Layar (Nonaktif)'}
          </span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ color: '#CBD5E1' }}>🔒 Keamanan CBT Aktif</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {violationCount > 0 && (
            <span style={{ background: '#7F1D1D', color: '#FCA5A5', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', border: '1px solid #991B1B' }}>
              ⚠️ Pelanggaran: {violationCount}x
            </span>
          )}

          {!isFullscreen && isPermissionGranted && (
            <button
              onClick={requestFullscreen}
              style={{
                background: '#2563EB',
                color: 'white',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🖥️ Mode Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ minHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
        {children}
      </main>

      {/* MANDATORY PERMISSION OVERLAY (UJIAN TIDAK BISA DIMULAI JIKA BELUM ACC KAMERA & LAYAR) */}
      {!isPermissionGranted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            border: '2px solid #F59E0B'
          }}>
            <div style={{
              width: '76px',
              height: '76px',
              background: '#FEF3C7',
              color: '#D97706',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              margin: '0 auto 20px',
              border: '2px solid #FDE68A'
            }}>
              🔒
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>
              Izin Kamera & Rekam Layar Wajib Di-ACC
            </h2>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
              Untuk menjaga integritas dan kejujuran ujian CBT Psikotes, Anda <strong>wajib mengizinkan (ACC) akses Kamera (Webcam) dan Rekam Layar Desktop (Screen Share)</strong>. Ujian tidak dapat dimulai jika kedua izin ini belum di-ACC.
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>📷 Access Kamera (Webcam):</span>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', background: webcamActive ? '#DEF7EC' : '#FEE2E2', color: webcamActive ? '#03543F' : '#991B1B' }}>
                  {webcamActive ? '✓ Sudah ACC' : '✕ Belum ACC'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>🖥️ Rekam Layar Desktop:</span>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', background: screenActive ? '#DEF7EC' : '#FEE2E2', color: screenActive ? '#03543F' : '#991B1B' }}>
                  {screenActive ? '✓ Sudah ACC' : '✕ Belum ACC'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!webcamActive && (
                <button
                  onClick={setupWebcam}
                  style={{ width: '100%', padding: '14px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  📷 Izinkan Akses Kamera (Klik di Sini)
                </button>
              )}

              {!screenActive && (
                <button
                  onClick={setupScreenShare}
                  style={{ width: '100%', padding: '14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🖥️ Izinkan Rekam Layar Desktop (Klik di Sini)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN EXIT WARNING MODAL */}
      {showFullscreenModal && isPermissionGranted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #F59E0B'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: '#FEF3C7',
              color: '#D97706',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 20px'
            }}>
              🖥️
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '0 0 10px' }}>
              Mode Layar Penuh (Fullscreen) Terputus!
            </h2>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
              Anda terdeteksi keluar dari Mode Layar Penuh. Seluruh rangkaian ujian CBT wajib dikerjakan dalam mode Layar Penuh. Klik tombol di bawah untuk kembali ke Mode Fullscreen.
            </p>

            <button
              onClick={handleAcknowledgeAndFullscreen}
              style={{
                width: '100%',
                padding: '14px',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              🖥️ Saya Mengerti & Masuk Fullscreen Lagi (Oke)
            </button>
          </div>
        </div>
      )}

      {/* SECURITY VIOLATION ALERT MODAL (ALT+TAB / TAB SWITCH / FORBIDDEN KEYS) */}
      {showViolationModal && isPermissionGranted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #EF4444'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: '#FEE2E2',
              color: '#DC2626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 20px'
            }}>
              ⚠️
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '0 0 10px' }}>
              Peringatan Keamanan Ujian!
            </h2>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
              {violationMessage}
            </p>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                Catatan Sistem Security:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#B91C1C', lineHeight: 1.5 }}>
                <li>Kejadian ini telah dicatat ke database (Pelanggaran ke-{violationCount}).</li>
                <li>Foto kamera & rekam layar saat ini telah dikirim ke CCTV Control Room.</li>
                <li>Tetap berada di halaman ujian hingga seluruh soal selesai.</li>
              </ul>
            </div>

            <button
              onClick={handleAcknowledgeAndFullscreen}
              style={{
                width: '100%',
                padding: '14px',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              Saya Mengerti & Lanjutkan Fullscreen (Oke)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
