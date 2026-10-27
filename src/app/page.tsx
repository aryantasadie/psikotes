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
  const [isPermanentLocked, setIsPermanentLocked] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string>('');
  const router = useRouter();

  // Timer interval countdown untuk lockout sementara
  useEffect(() => {
    if (lockCountdown <= 0) return;

    const interval = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockCountdown]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Cek apakah akun sudah dibuka kunci oleh Admin
  const handleCheckUnlock = async () => {
    if (!username.trim()) return;
    try {
      const res = await fetch(`/api/auth/check-lock?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      if (!data.isLocked) {
        setLockCountdown(0);
        setIsPermanentLocked(false);
        setError('');
        setCheckMessage('Akun Anda sudah aktif kembali! Silakan masukkan kata sandi.');
        setTimeout(() => setCheckMessage(''), 4000);
      } else if (data.lockType === 'temporary') {
        setLockCountdown(data.remainingSeconds || 0);
        setIsPermanentLocked(false);
        setCheckMessage(`Akun masih terkunci sementara: ${formatCountdown(data.remainingSeconds || 0)} tersisa.`);
        setTimeout(() => setCheckMessage(''), 4000);
      } else if (data.lockType === 'permanent') {
        setIsPermanentLocked(true);
        setLockCountdown(0);
        setError('Akun Anda telah terkunci permanen. Silakan hubungi Superadmin.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTimeoutSession = sessionStorage.getItem('session_timeout_notice');
      const urlParams = new URLSearchParams(window.location.search);
      const isTimeoutQuery = urlParams.get('reason') === 'timeout';

      if (isTimeoutSession === '1' || isTimeoutQuery) {
        setTimeoutNotice(true);
        sessionStorage.removeItem('session_timeout_notice');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Exit fullscreen on failed login
        try {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        } catch {}

        if (res.error === 'LOCKED_PERMANENT') {
          setIsPermanentLocked(true);
          setLockCountdown(0);
          setError('Akun Anda telah terkunci secara permanen demi alasan keamanan karena terlalu banyak percobaan gagal. Silakan hubungi Superadmin untuk membuka akses.');
        } else if (res.error.startsWith('LOCKED_TEMP:')) {
          const seconds = parseInt(res.error.split(':')[1], 10) || 90;
          setLockCountdown(seconds);
          setIsPermanentLocked(false);
          setError('');
        } else if (res.error.startsWith('ATTEMPTS_REMAINING:')) {
          const remaining = res.error.split(':')[1];
          setError(`Username atau kata sandi salah. Sisa kesempatan: ${remaining} kali sebelum akun terkunci sementara.`);
        } else if (res.error.startsWith('ATTEMPTS_REMAINING_FINAL:')) {
          const remaining = res.error.split(':')[1];
          setError(`Username atau kata sandi salah. Peringatan: Sisa kesempatan ${remaining} kali sebelum akun terkunci PERMANEN!`);
        } else if (res.error === 'ACCOUNT_INACTIVE') {
          setError('Akun Anda saat ini berstatus nonaktif. Silakan hubungi Superadmin.');
        } else {
          setError('Username atau password salah.');
        }
      } else {
        // Ambil session secara aman dengan getSession()
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

          {/* Alert Success / Unlocked Check Message */}
          {checkMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{checkMessage}</span>
            </div>
          )}

          {/* Alert Lockout Sementara dengan Countdown Timer */}
          {lockCountdown > 0 && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl text-center flex flex-col items-center gap-2.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Akun Terkunci Sementara</span>
              </div>
              <div className="text-3xl font-black font-mono text-amber-600 tracking-wider">
                {formatCountdown(lockCountdown)}
              </div>
              <p className="text-xs text-amber-700 leading-relaxed max-w-xs">
                Terlalu banyak percobaan kata sandi salah. Silakan tunggu hingga waktu habis atau hubungi Superadmin.
              </p>
              <button
                type="button"
                onClick={handleCheckUnlock}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 underline mt-0.5 cursor-pointer"
              >
                Sudah dibuka oleh Admin? Cek status sekarang
              </button>
            </div>
          )}

          {/* Alert Lockout Permanen */}
          {isPermanentLocked && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl text-center flex flex-col items-center gap-2 shadow-xs">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Akun Terkunci Permanen</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Akun ini telah dinonaktifkan demi alasan keamanan karena percobaan salah berulang kali. Silakan hubungi <strong>Superadmin</strong> untuk membuka kunci akun Anda.
              </p>
              <button
                type="button"
                onClick={handleCheckUnlock}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 underline mt-0.5 cursor-pointer"
              >
                Sudah dibuka oleh Admin? Cek status sekarang
              </button>
            </div>
          )}

          {/* Alert Timeout Notice */}
          {timeoutNotice && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-700" />
              <span>Sesi Anda telah berakhir otomatis karena tidak ada kegiatan selama 3 jam. Silakan masuk kembali.</span>
            </div>
          )}

          {/* Alert Error */}
          {error && !isPermanentLocked && lockCountdown <= 0 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs">
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
                onChange={e => {
                  setUsername(e.target.value);
                  if (isPermanentLocked) setIsPermanentLocked(false);
                }}
                required
                disabled={loading}
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
                  disabled={loading || lockCountdown > 0 || isPermanentLocked}
                  placeholder={lockCountdown > 0 ? "Akun terkunci sementara..." : isPermanentLocked ? "Akun terkunci permanen..." : "Masukkan kata sandi..."}
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
              disabled={loading || lockCountdown > 0 || isPermanentLocked}
              size="lg"
              className="w-full mt-2"
            >
              {lockCountdown > 0 ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Terkunci Sementara ({formatCountdown(lockCountdown)})</span>
                </>
              ) : isPermanentLocked ? (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  <span>Akun Terkunci Permanen</span>
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
