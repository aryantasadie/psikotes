'use client';

import React, { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';

interface CbtProctoringGuardProps {
  children: React.ReactNode;
}

export default function CbtProctoringGuard({ children }: CbtProctoringGuardProps) {
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [screenActive, setScreenActive] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamInitializing = useRef(false);
  const screenInitializing = useRef(false);

  // Hydration sync & participant ID fetch
  useEffect(() => {
    setMounted(true);
    const hasConsent = sessionStorage.getItem('cbt_consent_granted') === 'true';
    if (hasConsent) {
      setConsentGranted(true);
    }

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

  // Real-time proctor status listener (heartbeat every 1.2s)
  useEffect(() => {
    let isMounted = true;

    const checkProctorStatus = async () => {
      try {
        const res = await fetch('/api/testee/session');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const stopped = Boolean(data.isStopped);
        const paused = Boolean(data.isPaused);

        if (typeof window !== 'undefined') {
          (window as any).__CBT_IS_STOPPED__ = stopped;
          (window as any).__CBT_IS_PAUSED__ = stopped ? false : paused;
        }

        setIsStopped(stopped);
        setIsPaused(stopped ? false : paused);
        if (data.pausedMessage) setPausedMessage(data.pausedMessage);
      } catch (e) {}
    };

    const interval = setInterval(checkProctorStatus, 1200);
    checkProctorStatus();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
    if (streamRef.current) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      setWebcamActive(true);
      return;
    }
    if (webcamInitializing.current) return;
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
    if (!consentGranted) return;

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
  }, [consentGranted]);

  // Keep videoRef synced with streamRef across component updates
  useEffect(() => {
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  const getWebcamBase64 = (): string | null => {
    if (!streamRef.current) return null;
    if (videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      const video = videoRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.7);
        }
      }
    }
    return null;
  };

  const getWebcamWebPBase64 = (): string | null => {
    if (!streamRef.current) return null;
    if (videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      const video = videoRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
          try {
            return canvas.toDataURL('image/webp', 0.45);
          } catch {
            return canvas.toDataURL('image/jpeg', 0.5);
          }
        }
      }
    }
    return null;
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
      if (screenVideoRef.current) {
        const targetStream = screenStreamRef.current || (typeof window !== 'undefined' ? (window as any).__cbtScreenStream : null);
        if (targetStream && screenVideoRef.current.srcObject !== targetStream) {
          screenVideoRef.current.srcObject = targetStream;
          screenVideoRef.current.play().catch(() => {});
        }
      }
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

  const lastViolationTimeRef = useRef<{ [key: string]: number }>({});

  const getTestAndTimerInfo = () => {
    if (typeof window === 'undefined') return 'Belum Mulai Tes';

    const path = window.location.pathname.toLowerCase();
    
    // If currently on onboarding page
    if (path.includes('/testee/session')) {
      return 'Belum Mulai Tes';
    }

    let activeTestName = localStorage.getItem('cbt_active_test');
    if (!activeTestName) {
      if (path.includes('/tes/')) {
        const slug = path.split('/tes/')[1]?.split('/')[0] || '';
        if (slug.includes('cfit1')) activeTestName = 'CFIT 1';
        else if (slug.includes('cfit2')) activeTestName = 'CFIT 2';
        else if (slug.includes('cfit3')) activeTestName = 'CFIT 3';
        else if (slug.includes('cfit4')) activeTestName = 'CFIT 4';
        else if (slug.includes('ist2')) activeTestName = 'IST 2';
        else if (slug.includes('ist3')) activeTestName = 'IST 3';
        else if (slug.includes('ist6')) activeTestName = 'IST 6';
        else if (slug.includes('ist7')) activeTestName = 'IST 7';
        else if (slug.includes('tiki1')) activeTestName = 'TIKI 1';
        else if (slug.includes('tiki2')) activeTestName = 'TIKI 2';
        else if (slug.includes('tiki3')) activeTestName = 'TIKI 3';
        else if (slug.includes('tiki4')) activeTestName = 'TIKI 4';
        else if (slug.includes('tiki6')) activeTestName = 'TIKI 6';
        else if (slug.includes('wpt')) activeTestName = 'WPT';
        else if (slug.includes('papi')) activeTestName = 'PAPI Kostick';
        else if (slug.includes('disc')) activeTestName = 'DISC';
        else if (slug.includes('msdt')) activeTestName = 'MSDT';
        else if (slug.includes('power')) activeTestName = 'Power Leader';
        else if (slug.includes('kraepelin') || slug.includes('kreapelin')) activeTestName = 'Kraepelin';
      }
    }

    // Check active timer
    let timerRemaining: number | null = null;
    const savedTimer = localStorage.getItem('cbt_active_timer_left');
    if (savedTimer !== null) {
      const parsedTimer = parseInt(savedTimer, 10);
      if (!isNaN(parsedTimer) && parsedTimer >= 0) {
        timerRemaining = parsedTimer;
      }
    }

    if (!activeTestName && timerRemaining === null) {
      return 'Belum Mulai Tes';
    }

    if (activeTestName && timerRemaining !== null) {
      const m = Math.floor(timerRemaining / 60);
      const s = timerRemaining % 60;
      return `Tes: ${activeTestName} (Sisa Waktu: ${m}:${s < 10 ? '0' : ''}${s})`;
    } else if (activeTestName) {
      return `Tes: ${activeTestName}`;
    }

    return 'Belum Mulai Tes';
  };

  const sendViolationLog = async (logType: string, label: string, detailMsg?: string) => {
    const currentPId = participantId || (typeof window !== 'undefined' && localStorage.getItem('current_participant_id') ? parseInt(localStorage.getItem('current_participant_id')!, 10) : null);
    if (!currentPId) return;

    // Throttle / Debounce duplicate violations within 3s
    const now = Date.now();
    const lastTime = lastViolationTimeRef.current[logType] || 0;
    if (now - lastTime < 3000) return;
    lastViolationTimeRef.current[logType] = now;

    try {
      const testAndTimer = getTestAndTimerInfo();
      const text = `${label} — ${testAndTimer}${detailMsg ? ` (${detailMsg})` : ''}`;

      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: currentPId,
          logType,
          text
        })
      });
    } catch (err) {
      console.error('Failed to send violation log:', err);
    }
  };

  const capturePhoto = async (photoType: 'camera_awal' | 'camera_10min') => {
    const currentPId = participantId || (typeof window !== 'undefined' && localStorage.getItem('current_participant_id') ? parseInt(localStorage.getItem('current_participant_id')!, 10) : null);
    if (!currentPId) return;

    try {
      const cameraImg = getWebcamBase64();
      if (!cameraImg) return;

      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: currentPId,
          logType: photoType,
          image: cameraImg
        })
      });
    } catch (err) {
      console.error(`Failed to capture photo (${photoType}):`, err);
    }
  };

  // 📸 Trigger Foto 1 (Awal - 1x) & Foto 2 (Tepat 10 Menit Kemudian - 1x Saja)
  useEffect(() => {
    if (!participantId || !webcamActive) return;

    const p1DoneKey = `cbt_photo1_done_${participantId}`;
    const p2DoneKey = `cbt_photo2_done_${participantId}`;
    const p1TimeKey = `cbt_photo1_timestamp_${participantId}`;

    const isP1Done = () => localStorage.getItem(p1DoneKey) === 'true' || localStorage.getItem('cbt_photo1_done') === 'true';
    const isP2Done = () => localStorage.getItem(p2DoneKey) === 'true' || localStorage.getItem('cbt_photo2_done') === 'true';

    // Handler event Foto Awal (saat submit nama & tgl lahir)
    const handleInitialTrigger = () => {
      if (!isP1Done()) {
        localStorage.setItem(p1DoneKey, 'true');
        localStorage.setItem('cbt_photo1_done', 'true');
        setTimeout(() => {
          capturePhoto('camera_awal');
        }, 1200);
      }
    };

    window.addEventListener('cbt:trigger-initial-photo', handleInitialTrigger);

    // Cek jika timestamp awal sudah ada tapi belum sempat ter-capture
    const photo1Time = localStorage.getItem(p1TimeKey) || localStorage.getItem('cbt_photo1_timestamp');
    if (photo1Time && !isP1Done()) {
      localStorage.setItem(p1DoneKey, 'true');
      localStorage.setItem('cbt_photo1_done', 'true');
      setTimeout(() => {
        capturePhoto('camera_awal');
      }, 1500);
    }

    // Timer checker untuk Foto ke-2 (HANYA 1X tepat saat mencapai 10 Menit setelah start)
    let timerChecker: NodeJS.Timeout | null = null;
    if (!isP2Done()) {
      timerChecker = setInterval(() => {
        const p1TimeStr = localStorage.getItem(p1TimeKey) || localStorage.getItem('cbt_photo1_timestamp');
        if (isP2Done()) {
          if (timerChecker) clearInterval(timerChecker);
          return;
        }

        if (p1TimeStr) {
          const p1Time = parseInt(p1TimeStr, 10);
          if (!isNaN(p1Time)) {
            const elapsed = Date.now() - p1Time;
            // Tepat saat elapsed >= 10 menit (600,000 ms) -> ambil 1x saja lalu stop timer
            if (elapsed >= 10 * 60 * 1000) {
              localStorage.setItem(p2DoneKey, 'true');
              localStorage.setItem('cbt_photo2_done', 'true');
              if (timerChecker) clearInterval(timerChecker);
              capturePhoto('camera_10min');
            }
          }
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('cbt:trigger-initial-photo', handleInitialTrigger);
      if (timerChecker) clearInterval(timerChecker);
    };
  }, [participantId, webcamActive]);

  // Live Stream Broadcast every 1.5s
  useEffect(() => {
    const broadcastNow = async () => {
      try {
        const testeeName = sessionStorage.getItem('testee_name') || localStorage.getItem('testee_name') || undefined;
        const currentPId = participantId || (localStorage.getItem('current_participant_id') ? parseInt(localStorage.getItem('current_participant_id')!, 10) : (sessionStorage.getItem('current_participant_id') ? parseInt(sessionStorage.getItem('current_participant_id')!, 10) : null));
        
        if (!currentPId) return;

        const cameraFrame = getWebcamWebPBase64();
        const screenFrame = await getScreenWebPBase64();

        // Determine active test name
        let activeTestName = localStorage.getItem('cbt_active_test');
        if (!activeTestName && typeof window !== 'undefined') {
          const path = window.location.pathname.toLowerCase();
          if (path.includes('/tes/')) {
            const slug = path.split('/tes/')[1] || '';
            if (slug.includes('cfit1')) activeTestName = 'CFIT 1';
            else if (slug.includes('cfit2')) activeTestName = 'CFIT 2';
            else if (slug.includes('cfit3')) activeTestName = 'CFIT 3';
            else if (slug.includes('cfit4')) activeTestName = 'CFIT 4';
            else if (slug.includes('ist2')) activeTestName = 'IST 2';
            else if (slug.includes('ist3')) activeTestName = 'IST 3';
            else if (slug.includes('ist6')) activeTestName = 'IST 6';
            else if (slug.includes('ist7')) activeTestName = 'IST 7';
            else if (slug.includes('tiki1')) activeTestName = 'TIKI 1';
            else if (slug.includes('tiki2')) activeTestName = 'TIKI 2';
            else if (slug.includes('tiki3')) activeTestName = 'TIKI 3';
            else if (slug.includes('tiki4')) activeTestName = 'TIKI 4';
            else if (slug.includes('tiki6')) activeTestName = 'TIKI 6';
            else if (slug.includes('wpt')) activeTestName = 'WPT';
            else if (slug.includes('papi')) activeTestName = 'PAPI Kostick';
            else if (slug.includes('disc')) activeTestName = 'DISC';
            else if (slug.includes('msdt')) activeTestName = 'MSDT';
            else if (slug.includes('power')) activeTestName = 'Power Leader';
            else if (slug.includes('kraepelin') || slug.includes('kreapelin')) activeTestName = 'Kraepelin';
          }
        }

        // Determine timer remaining
        let timerRemaining: number | null = null;
        const savedTimer = localStorage.getItem('cbt_active_timer_left');
        if (savedTimer !== null) {
          const parsedTimer = parseInt(savedTimer, 10);
          if (!isNaN(parsedTimer) && parsedTimer >= 0) {
            timerRemaining = parsedTimer;
          }
        }

        // Completed tests list
        const completedTests: string[] = [];
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('test_completed_') && localStorage.getItem(k) === 'true') {
              const rawSlug = k.replace('test_completed_', '').toUpperCase();
              completedTests.push(rawSlug);
            }
          }
        }

        await fetch('/api/stream/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentPId,
            name: testeeName,
            cameraFrame,
            screenFrame,
            violationCount,
            currentTestName: activeTestName,
            timerRemaining,
            completedTests,
            status: isStopped ? 'stopped' : 'in_progress',
            isPaused: isPaused
          })
        });
      } catch (e) {}
    };

    broadcastNow();
    const streamInterval = setInterval(broadcastNow, 1500);

    const handleUnload = () => {
      const currentPId = participantId || (typeof window !== 'undefined' && localStorage.getItem('current_participant_id') ? parseInt(localStorage.getItem('current_participant_id')!, 10) : null);
      if (currentPId && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/stream/broadcast', JSON.stringify({
          participantId: currentPId,
          status: 'offline'
        }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(streamInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [participantId, webcamActive, screenActive, violationCount, isStopped, isPaused]);

  // Audio beep on violation (disabled per request)
  const playAlertTone = () => {};

  // Event Listener: Tab Switch & Window Blur Detection
  useEffect(() => {
    if (!consentGranted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Anda terdeteksi meninggalkan tab/halaman ujian (Alt+Tab / Pindah Tab)!');
        sendViolationLog('tab_switch', 'Pindah Tab / Keluar Halaman Ujian');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Jendela browser Anda kehilangan fokus (Alt+Tab / Pindah Jendela Aplikasi)!');
      sendViolationLog('tab_switch', 'Jendela Browser Kehilangan Fokus (Pindah Aplikasi)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [participantId, consentGranted]);

  // Event Listener: Anti-Cheat Shortcuts, Right Click, Copy-Paste, DevTools
  useEffect(() => {
    if (!consentGranted) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('Klik kanan (Context Menu) dilarang selama ujian.');
      sendViolationLog('forbidden_key', 'Klik Kanan (Context Menu)');
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Tindakan Copy/Cut/Paste dilarang dalam sistem ujian ini.');
      sendViolationLog('forbidden_key', 'Tindakan Copy/Paste');
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
        const keyLabel = `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
        handleViolation(`Tombol kombinasi (${keyLabel}) dilarang!`);
        sendViolationLog('forbidden_key', 'Tombol Shortcut Terlarang', keyLabel);
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
  }, [participantId, consentGranted]);

  // Fullscreen Change Listener & Initial Enforcement
  useEffect(() => {
    if (!consentGranted) return;

    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS) {
        setShowFullscreenModal(true);
        sendViolationLog('blur_fullscreen', 'Keluar Mode Fullscreen');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [participantId, consentGranted]);

  const handleViolation = (reason: string) => {
    if (!consentGranted) return;
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

  // Cegah hydration mismatch antara SSR dan Client
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          height: '100%',
          width: '100%',
          background: '#f8fafc'
        }}
      >
        <main style={{ minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    );
  }

  // TAHAP AWAL: Lembar Persetujuan Data & Rekaman (Sebelum Meminta Izin Kamera / Layar)
  if (!consentGranted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F8FAFC',
          color: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <div
          style={{
            maxWidth: '660px',
            width: '100%',
            background: '#FFFFFF',
            padding: '44px 40px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)'
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 16px 0',
              letterSpacing: '-0.3px'
            }}
          >
            Sebelum Memulai
          </h1>

          <p style={{ fontSize: '15px', color: '#334155', margin: '0 0 20px 0', fontWeight: 500 }}>
            Dalam psikotes ini:
          </p>

          <ul
            style={{
              listStyleType: 'disc',
              paddingLeft: '22px',
              margin: '0 0 24px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              fontSize: '14.5px',
              lineHeight: '1.6',
              color: '#334155'
            }}
          >
            <li>
              <strong style={{ color: '#0F172A' }}>Kamera dan layar perangkat akan direkam</strong> selama proses berlangsung.
            </li>
            <li>
              Jawaban dan respons akan digunakan untuk <strong style={{ color: '#0F172A' }}>penilaian dan analisis psikologis</strong> sesuai tujuan asesmen.
            </li>
            <li>
              Data pribadi, hasil tes, dan rekaman akan <strong style={{ color: '#0F172A' }}>dijaga kerahasiaannya</strong> dan hanya digunakan sesuai keperluan.
            </li>
            <li>
              Data disimpan secara aman dan <strong style={{ color: '#0F172A' }}>dihapus dari sistem setelah 15 hari</strong>, kecuali terdapat kewajiban hukum yang mengharuskan penyimpanan lebih lama.
            </li>
            <li style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderLeft: '4px solid #0F172A', padding: '12px 16px', borderRadius: '8px', listStyleType: 'none', marginLeft: '-22px', color: '#1E293B' }}>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>PENTING (Izin Rekam Layar):</span> Saat jendela izin browser muncul setelah menekan tombol Lanjut, pastikan memilih opsi <strong style={{ color: '#0F172A', textDecoration: 'underline' }}>Entire Screen (Seluruh Layar)</strong> agar sistem asesmen dapat mendeteksi layar ujian dengan benar.
            </li>
          </ul>

          <div style={{ marginBottom: '28px', borderTop: '1px solid #E2E8F0', paddingTop: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{
                  width: '19px',
                  height: '19px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#0F172A'
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: '1.5' }}>
                Saya mengerti dan bersedia mengikuti psikotes serta memberikan persetujuan atas pemrosesan data saya.
              </span>
            </label>
          </div>

          <div>
            <button
              onClick={() => {
                if (consentChecked) {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('cbt_consent_granted', 'true');
                  }
                  setConsentGranted(true);
                  setupScreenShare();
                  setupWebcam();
                }
              }}
              disabled={!consentChecked}
              style={{
                padding: '13px 36px',
                background: consentChecked ? '#0F172A' : '#E2E8F0',
                color: consentChecked ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: consentChecked ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: consentChecked ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'
              }}
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* UJIAN DIHENTIKAN MODAL (IMAGE 1) */}
      {isStopped && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(248, 250, 252, 0.98)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '44px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)',
            border: '1px solid #fee2e2'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              margin: '0 auto 20px auto'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              Ujian Dihentikan
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
              Pengerjaan ujian Anda telah dihentikan oleh pengawas. Silakan hubungi pengawas atau panitia jika ada pertanyaan.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: '#fef2f2',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#991b1b',
              fontWeight: 600
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                display: 'inline-block'
              }}></span>
              Menunggu arahan pengawas...
            </div>
          </div>
        </div>
      )}

      {/* UJIAN SEDANG DIJEDA MODAL */}
      {isPaused && !isStopped && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 24px auto'
            }}>
              ⏸️
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
              Ujian Sedang Dijeda
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              {pausedMessage || 'Pengawas sedang menjeda jalannya tes ini. Waktu tes dan pengerjaan Anda dibekukan sementara hingga pengawas melanjutkan tes.'}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              background: '#f1f5f9',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#475569',
              fontWeight: 600
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'inline-block'
              }}></span>
              Menunggu instruksi pengawas...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
