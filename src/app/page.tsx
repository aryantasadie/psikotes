'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Clock, Eye, EyeOff, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeoutNotice, setTimeoutNotice] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<number>(0);
  const router = useRouter();

  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds >= 3600) {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Cek status lock perangkat saat halaman dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('hrp_login_device_lock');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.lockedUntil && parsed.lockedUntil > Date.now()) {
            const remaining = Math.ceil((parsed.lockedUntil - Date.now()) / 1000);
            setLockCountdown(remaining);
            if (parsed.attempts >= 15) {
              setError('Akses login dari perangkat ini telah diblokir selama 3 jam karena melebihi batas keamanan. Silakan hubungi Superadmin.');
            } else {
              setError(`Terlalu banyak percobaan masuk yang salah. Harap tunggu ${formatCountdown(remaining)} sebelum mencoba lagi.`);
            }
          }
        }
      } catch (e) {}

      const isTimeoutSession = sessionStorage.getItem('session_timeout_notice');
      const urlParams = new URLSearchParams(window.location.search);
      const isTimeoutQuery = urlParams.get('reason') === 'timeout';

      if (isTimeoutSession === '1' || isTimeoutQuery) {
        setTimeoutNotice(true);
        sessionStorage.removeItem('session_timeout_notice');
      }
    }
  }, []);

  // Timer interval countdown untuk lockout perangkat
  useEffect(() => {
    if (lockCountdown <= 0) return;

    const interval = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setError('');
          return 0;
        }
        const updated = prev - 1;
        try {
          const raw = localStorage.getItem('hrp_login_device_lock');
          const attempts = raw ? (JSON.parse(raw)?.attempts || 0) : 0;
          if (attempts >= 15) {
            setError(`Akses login dari perangkat ini telah diblokir (${formatCountdown(updated)}). Silakan hubungi Superadmin.`);
          } else {
            setError(`Terlalu banyak percobaan masuk yang salah. Harap tunggu ${formatCountdown(updated)} sebelum mencoba lagi.`);
          }
        } catch (e) {}
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockCountdown > 0) return;

    setError('');
    setTimeoutNotice(false);
    setLoading(true);

    // 1. Immediately request fullscreen on user click gesture (synchronous)
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (fErr) {
      console.warn(fErr);
    }

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setLoading(false);
        try {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        } catch {}

        if (res.error === 'ACCOUNT_INACTIVE') {
          setError('Akun Anda saat ini berstatus nonaktif. Silakan hubungi Superadmin.');
        } else if (res.error === 'LOCKED_PERMANENT') {
          setError('Akun Anda telah dinonaktifkan / terkunci secara permanen. Silakan hubungi Superadmin untuk membuka akses.');
        } else {
          // Kesalahan kredensial (username atau password salah)
          let attempts = 0;
          try {
            const raw = localStorage.getItem('hrp_login_device_lock');
            if (raw) {
              const parsed = JSON.parse(raw);
              attempts = Number(parsed.attempts) || 0;
            }
          } catch (e) {}

          const newAttempts = attempts + 1;
          let cooldown = 0;

          // Progressive Backoff: 5x -> 1m, 8x -> 1.5m, 11x -> 2m, 15x -> 3 jam
          if (newAttempts >= 15) {
            cooldown = 3 * 60 * 60; // 3 jam (10800 detik)
          } else if (newAttempts >= 11) {
            cooldown = 120; // 2 menit
          } else if (newAttempts >= 8) {
            cooldown = 90; // 1.5 menit
          } else if (newAttempts >= 5) {
            cooldown = 60; // 1 menit
          }

          try {
            localStorage.setItem('hrp_login_device_lock', JSON.stringify({
              attempts: newAttempts,
              lockedUntil: cooldown > 0 ? Date.now() + cooldown * 1000 : 0
            }));
          } catch (e) {}

          if (cooldown > 0) {
            setLockCountdown(cooldown);
            if (newAttempts >= 15) {
              setError('Akses login dari perangkat ini telah diblokir selama 3 jam karena melebihi batas percobaan keamanan. Silakan hubungi Superadmin.');
            } else {
              setError(`Terlalu banyak percobaan masuk yang salah. Harap tunggu ${formatCountdown(cooldown)} sebelum mencoba lagi.`);
            }
          } else {
            setError('Username atau kata sandi tidak valid.');
          }
        }
      } else {
        // Login berhasil: bersihkan device lock
        try {
          localStorage.removeItem('hrp_login_device_lock');
        } catch (e) {}

        const sessionData = await getSession();
        const role = sessionData?.user ? (sessionData.user as any).role : undefined;

        if (role === 'superadmin') {
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
          router.push('/superadmin');
          router.refresh();
        } else if (role === 'tester') {
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
          router.push('/superadmin/live-stream');
          router.refresh();
        } else if (role === 'psikolog') {
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
          router.push('/superadmin/reports');
          router.refresh();
        } else if (role === 'client') {
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
          router.push('/client');
          router.refresh();
        } else if (role === 'testee' || role === 'user') {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('cbt_consent_granted');
            localStorage.removeItem('cbt_consent_granted');
          }
          router.push('/testee/session');
          router.refresh();
        } else {
          setLoading(false);
          setError('Akses ditolak: Peran (Role) tidak terdaftar.');
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi sistem.');
      setLoading(false);
      try {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient & Grid Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-slate-200/80 shadow-2xl">
        <CardContent className="p-8 flex flex-col gap-6">
          
          {/* Header Branding */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="flex justify-center pb-1">
              <img 
                src="/logo.png" 
                alt="HR Publik Logo" 
                className="h-16 w-auto object-contain mx-auto"
              />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                HR Publik Engine
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Portal Psikotes & Assessment Center Engine
              </p>
            </div>
          </div>

          {/* Alert Timeout Notice */}
          {timeoutNotice && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-700" />
              <span>Sesi Anda telah berakhir otomatis karena tidak ada kegiatan selama 3 jam. Silakan masuk kembali.</span>
            </div>
          )}

          {/* Alert Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Username / ID Pengguna
              </label>
              <Input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading || lockCountdown > 0}
                placeholder="Masukkan username atau ID pengguna..."
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kata Sandi / Password
              </label>
              <div className="relative flex items-center">
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading || lockCountdown > 0}
                  placeholder={lockCountdown > 0 ? "Menunggu waktu jeda selesai..." : "Masukkan kata sandi..."}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer p-1"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || lockCountdown > 0}
              size="lg"
              className="w-full mt-2"
            >
              {lockCountdown > 0 ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>{lockCountdown >= 3600 ? `Akses Diblokir (${formatCountdown(lockCountdown)})` : `Tunggu (${formatCountdown(lockCountdown)})`}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{loading ? 'Memeriksa Otentikasi...' : 'Masuk Portal'}</span>
                </>
              )}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
