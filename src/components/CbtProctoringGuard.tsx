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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const webcamInitializing = useRef(false);
  const screenInitializing = useRef(false);

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

  // Helper to detect if device is mobile (phone/tablet)
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };

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
      // On mobile devices (like iPhones) where native fullscreen is restricted, mark active
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    }
  };

  // Initialize Webcam
  const setupWebcam = async () => {
    if (webcamActive || webcamInitializing.current || streamRef.current) return;
    webcamInitializing.current = true;

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setWebcamError('Browser memblokir kamera karena situs diakses via HTTP IP (bukan HTTPS). Akses via HTTPS Vercel atau http://localhost:3000.');
      setWebcamActive(false);
      webcamInitializing.current = false;
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWebcamError('Fitur kamera tidak didukung atau diblokir oleh browser pada perangkat ini.');
      setWebcamActive(false);
      webcamInitializing.current = false;
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
        try {
          await videoRef.current.play();
        } catch (e: any) {
          console.warn('Webcam video play interrupted:', e);
        }
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
    } finally {
      webcamInitializing.current = false;
    }
  };

  // Initialize Desktop/Mobile Screen Recording
  const setupScreenShare = async () => {
    if (screenActive || screenInitializing.current || screenStreamRef.current) return;
    screenInitializing.current = true;

    // 1. Mobile Smartphones (Android & iOS) Fallback: use High-Fidelity DOM Screen Capture
    if (isMobileDevice()) {
      setScreenActive(true);
      setScreenError(null);
      screenInitializing.current = false;
      return;
    }

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
        screenInitializing.current = false;

        existingStream.getVideoTracks()[0].onended = () => {
          setScreenActive(false);
        };
        return;
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      // Fallback for browsers without getDisplayMedia
      setScreenActive(true);
      setScreenError(null);
      screenInitializing.current = false;
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
        try {
          await screenVideoRef.current.play();
        } catch (e: any) {
          console.warn('Screen share video play interrupted:', e);
        }
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
      // Fallback to DOM capture on error
      setScreenActive(true);
      setScreenError(null);
    } finally {
      screenInitializing.current = false;
    }
  };

  useEffect(() => {
    setupWebcam();
    setupScreenShare();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        if (typeof window !== 'undefined') {
          (window as any).__cbtScreenStream = null;
        }
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

  const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  };

  const getScreenBase64 = async (): Promise<string | null> => {
    try {
      // 1. Priority 1: Real MediaStream Video Frame (desktop screen share active)
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

      // 2. Mobile Fallback: Activity info canvas (browser API does not support getDisplayMedia on mobile)
      const width = 760;
      const height = 480;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const pageTitle = document.title?.replace(' | HR Publik', '').replace(' - HR Publik', '').trim() || 'CBT Assessment';
      const testeeName = sessionStorage.getItem('testee_name') || localStorage.getItem('testee_name') || 'Peserta';
      const urlPath = window.location.pathname;

      // Determine module from URL
      let moduleLabel = 'Halaman Ujian';
      if (urlPath.includes('/tes/')) moduleLabel = 'Mengerjakan Soal CBT';
      else if (urlPath.includes('/session')) moduleLabel = 'Sesi Ujian Aktif';
      else if (urlPath.includes('/testee')) moduleLabel = 'Area Peserta';

      // Extract question progress from DOM
      let questionInfo = '';
      const progressEl = document.querySelector('[data-question], .question-progress, .soal-progress');
      if (progressEl) questionInfo = progressEl.textContent?.trim() || '';
      if (!questionInfo) {
        const h2s = document.querySelectorAll('h2, h3');
        h2s.forEach(el => {
          const t = el.textContent?.trim() || '';
          if (t.includes('Soal') || t.includes('/') || t.match(/\d+\s*\/\s*\d+/)) {
            questionInfo = t;
          }
        });
      }

      // === Background gradient ===
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#1E293B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // === Top bar ===
      ctx.fillStyle = '#1E40AF';
      ctx.fillRect(0, 0, width, 52);

      // HR Publik logo text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('HR Publik', 20, 22);
      ctx.fillStyle = '#93C5FD';
      ctx.font = '11px sans-serif';
      ctx.fillText('Assessment Engine — CBT Mobile Monitor', 20, 40);

      // Live badge (top right)
      ctx.fillStyle = '#EF4444';
      if (ctx.roundRect) ctx.roundRect(width - 106, 14, 86, 26, 6);
      else ctx.rect(width - 106, 14, 86, 26);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('● LIVE REC', width - 98, 31);

      // === Main card background ===
      ctx.fillStyle = '#1E293B';
      if (ctx.roundRect) ctx.roundRect(20, 68, width - 40, height - 88, 12);
      else ctx.rect(20, 68, width - 40, height - 88);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // === Active module badge ===
      ctx.fillStyle = '#0EA5E9';
      if (ctx.roundRect) ctx.roundRect(36, 84, 130, 24, 5);
      else ctx.rect(36, 84, 130, 24);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('AKTIF MENGERJAKAN', 44, 100);

      // === Page/Module title ===
      ctx.fillStyle = '#F1F5F9';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(moduleLabel, 36, 136);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText(pageTitle, 36, 158);

      // === Divider ===
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, 172);
      ctx.lineTo(width - 36, 172);
      ctx.stroke();

      // === Question progress row ===
      const infoY = 196;
      // Box 1: Progress soal
      ctx.fillStyle = '#0F172A';
      if (ctx.roundRect) ctx.roundRect(36, infoY, 200, 72, 8);
      else ctx.rect(36, infoY, 200, 72);
      ctx.fill();
      ctx.strokeStyle = '#1E40AF';
      ctx.stroke();
      ctx.fillStyle = '#60A5FA';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('PROGRESS SOAL', 52, infoY + 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(questionInfo || 'Sedang Aktif', 52, infoY + 40);
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText('soal diakses', 52, infoY + 58);

      // Box 2: Waktu rekam
      ctx.fillStyle = '#0F172A';
      if (ctx.roundRect) ctx.roundRect(252, infoY, 200, 72, 8);
      else ctx.rect(252, infoY, 200, 72);
      ctx.fill();
      ctx.strokeStyle = '#065F46';
      ctx.stroke();
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('WAKTU CAPTURE', 268, infoY + 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(timeStr, 268, infoY + 40);
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText('realtime', 268, infoY + 58);

      // Box 3: Device HP
      ctx.fillStyle = '#0F172A';
      if (ctx.roundRect) ctx.roundRect(468, infoY, 252, 72, 8);
      else ctx.rect(468, infoY, 252, 72);
      ctx.fill();
      ctx.strokeStyle = '#7C3AED';
      ctx.stroke();
      ctx.fillStyle = '#C4B5FD';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('PERANGKAT', 484, infoY + 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Smartphone (Mobile)', 484, infoY + 40);
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText('kamera aktif & dipantau', 484, infoY + 58);

      // === Status bar ===
      ctx.fillStyle = '#0F172A';
      if (ctx.roundRect) ctx.roundRect(36, infoY + 88, width - 72, 40, 8);
      else ctx.rect(36, infoY + 88, width - 72, 40);
      ctx.fill();

      // Status dot
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(56, infoY + 108, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Peserta aktif mengerjakan ujian — dipantau via kamera`, 72, infoY + 113);

      // === Footer ===
      const footY = height - 50;

      // Candidate name pill
      ctx.fillStyle = '#064E3B';
      if (ctx.roundRect) ctx.roundRect(36, footY, 280, 28, 6);
      else ctx.rect(36, footY, 280, 28);
      ctx.fill();
      ctx.fillStyle = '#6EE7B7';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`👤  ${testeeName}  (#${participantId || '—'})`, 50, footY + 18);

      // Date + time stamp
      ctx.fillStyle = '#64748B';
      ctx.font = '10px monospace';
      ctx.fillText(dateStr, width - 36 - ctx.measureText(dateStr).width, footY + 12);
      ctx.fillText(`Verifikasi: ${timeStr}`, width - 36 - ctx.measureText(`Verifikasi: ${timeStr}`).width, footY + 26);

      return canvas.toDataURL('image/jpeg', 0.85);
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
    if (!webcamActive) return;

    const streamInterval = setInterval(async () => {
      try {
        const testeeName = sessionStorage.getItem('testee_name') || localStorage.getItem('testee_name') || undefined;
        const currentPId = participantId || (localStorage.getItem('current_participant_id') ? parseInt(localStorage.getItem('current_participant_id')!, 10) : (sessionStorage.getItem('current_participant_id') ? parseInt(sessionStorage.getItem('current_participant_id')!, 10) : null));
        
        if (!currentPId) return;

        const cameraFrame = getWebcamWebPBase64();
        const screenFrame = await getScreenWebPBase64();
        if (cameraFrame || screenFrame) {
          await fetch('/api/stream/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: currentPId,
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

  // Audio beep on violation
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}
  };

  // Event Listener: Tab Switch & Window Blur Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Anda terdeteksi meninggalkan tab/halaman ujian (Alt+Tab / Pindah Tab)!');
        sendSecurityLog('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Jendela browser Anda kehilangan fokus (Alt+Tab / Pindah Jendela Aplikasi)!');
      sendSecurityLog('tab_switch');
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

  // Fullscreen Change Listener & Initial Enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS) {
        setShowFullscreenModal(true);
        sendSecurityLog('blur_fullscreen');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [participantId]);

  const handleViolation = (reason: string) => {
    playAlertTone();
    setViolationCount(prev => prev + 1);
    setViolationMessage(reason);
    setShowViolationModal(true);
  };

  const handleAcknowledgeAndFullscreen = async () => {
    setShowViolationModal(false);
    setShowFullscreenModal(false);
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
    } catch (e) {}
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

      {/* Main Content (Plain distraction-free testee view) */}
      <main style={{ minHeight: '100vh' }}>
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
      {showFullscreenModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
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
      {showViolationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
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
