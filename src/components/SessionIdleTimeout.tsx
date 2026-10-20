'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

// Batas waktu tidak ada kegiatan: 3 Jam (3 * 60 * 60 * 1000 = 10.800.000 ms)
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000;
const STORAGE_KEY = 'last_user_activity_time';
const THROTTLE_MS = 10000; // Update ke localStorage maksimal 10 detik sekali untuk performa optimal

export default function SessionIdleTimeout() {
  const { status } = useSession();
  const lastSavedRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
      }
      return;
    }

    const performTimeoutLogout = () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      try {
        sessionStorage.setItem('session_timeout_notice', '1');
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      // Keluar dari fullscreen jika sedang dalam mode fullscreen
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch (e) {}
      }

      signOut({ callbackUrl: '/?reason=timeout' });
    };

    // Inisialisasi timestamp saat login / component mount
    const now = Date.now();
    const currentStored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!currentStored || isNaN(Number(currentStored))) {
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch (e) {}
      lastSavedRef.current = now;
    } else {
      const storedTime = Number(currentStored);
      // Jika saat tab/halaman dibuka kembali ternyata sudah lebih dari 3 jam tidak aktif
      if (now - storedTime >= INACTIVITY_TIMEOUT_MS) {
        performTimeoutLogout();
        return;
      }
      lastSavedRef.current = storedTime;
    }

    // Fungsi perbarui aktivitas user (dithrottle 10 detik)
    const updateActivity = () => {
      const currentTime = Date.now();
      if (currentTime - lastSavedRef.current > THROTTLE_MS) {
        lastSavedRef.current = currentTime;
        try {
          localStorage.setItem(STORAGE_KEY, String(currentTime));
        } catch (e) {}
      }
    };

    // Fungsi pengecekan apakah sudah idle >= 3 jam
    const checkIdle = () => {
      const storedTimeStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const lastActive = storedTimeStr ? Number(storedTimeStr) : lastSavedRef.current;
      if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
        performTimeoutLogout();
      }
    };

    // Event listener untuk berbagai aktivitas pengguna
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleUserActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cek ketika user kembali ke tab ini (tab focus / visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkIdle();
      }
    };

    window.addEventListener('focus', checkIdle);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sinkronisasi antar tab: jika tab lain update activity, perbarui ref lokal
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        lastSavedRef.current = Number(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);

    // Interval pemeriksaan berkala setiap 30 detik
    const intervalId = setInterval(checkIdle, 30000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener('focus', checkIdle);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [status]);

  return null;
}
