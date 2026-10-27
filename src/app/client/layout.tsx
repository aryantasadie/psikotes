'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  CalendarPlus, 
  FileSpreadsheet, 
  LogOut, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'client' && role !== 'superadmin') {
        router.replace('/');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span className="text-sm font-medium">Memuat Portal Klien...</span>
      </div>
    );
  }

  const clientName = (session?.user as any)?.name || 'Perusahaan Mitra';

  const navItems = [
    {
      label: 'Dashboard',
      href: '/client',
      icon: LayoutDashboard,
      active: pathname === '/client',
    },
    {
      label: 'Buat Sesi Ujian',
      href: '/client/schedule',
      icon: CalendarPlus,
      active: pathname === '/client/schedule',
    },
    {
      label: 'Rekap & Hasil Asesmen',
      href: '/client/reports',
      icon: FileSpreadsheet,
      active: pathname === '/client/reports',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Portal Tag */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                HR
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900 tracking-tight">HR Publik</span>
                  <Badge variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200 font-bold">
                    Portal HRD Klien
                  </Badge>
                </div>
                <span className="text-xs text-slate-400">B2B Assessment & Talent Center</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                      item.active
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                  {clientName}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around bg-slate-50/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold ${
                  item.active ? 'bg-teal-600 text-white' : 'text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} HR Publik Assessment Platform. Seluruh data & instrumen psikotes terlindungi.
      </footer>
    </div>
  );
}
