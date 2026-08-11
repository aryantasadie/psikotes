'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        // Ambil session untuk mengecek role
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        const role = sessionData?.user?.role;

        if (role === 'superadmin' || role === 'admin' || role === 'psikolog') {
          // Exit fullscreen for admins
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
          router.push('/superadmin');
          router.refresh();
        } else if (role === 'client') {
          // Exit fullscreen for clients
          try {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } catch {}
          router.push('/client');
          router.refresh();
        } else if (role === 'testee' || role === 'user') {
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient & Grid Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-8 relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30">
            HR
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
            HR Publik Engine
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Portal Psikotes & Assessment Center Engine
          </p>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl text-center font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Username / ID Pengguna
            </label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="Contoh: superadmin..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all placeholder-slate-400"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kata Sandi / Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Masukkan kata sandi..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all placeholder-slate-400"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Memeriksa Otentikasi...' : 'Masuk Portal'}
          </button>
        </form>

        {/* Account Quick Guide Helper */}
        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-500">Akun Pengujian Demo:</p>
          <p><span className="font-bold text-slate-700">Superadmin:</span> superadmin / 123456</p>
          <p><span className="font-bold text-slate-700">Client:</span> hrd_perusahaan / 123456</p>
          <p><span className="font-bold text-slate-700">Kandidat:</span> budi_kandidat / 123456</p>
        </div>

      </div>
    </div>
  );
}
