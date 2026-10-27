'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeoutNotice, setTimeoutNotice] = useState(false);
  const router = useRouter();

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
        setError('Username atau password salah.');
        setLoading(false);
        // Exit fullscreen on failed login
        try {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        } catch {}
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

          {/* Alert Timeout Notice */}
          {timeoutNotice && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-700" />
              <span>Sesi Anda telah berakhir otomatis karena tidak ada kegiatan selama 3 jam. Silakan masuk kembali.</span>
            </div>
          )}

          {/* Alert Error */}
          {error && (
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
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Masukkan username atau ID pengguna..."
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kata Sandi / Password
              </label>
              <Input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Masukkan kata sandi..."
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              size="lg"
              className="w-full mt-2"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Memeriksa Otentikasi...' : 'Masuk Portal'}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
