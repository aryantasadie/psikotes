'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  CalendarDays,
  Target,
  ClipboardList,
  FileText,
  Radio,
  ShieldCheck,
  Building2,
  LogOut,
  Menu,
  ChevronRight,
  Bell,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─── Client Navigation Configuration Matching Design ───────────────────────── */
const CLIENT_SECTIONS = [
  {
    label: 'PUSAT KENDALI',
    items: [
      { label: 'Dashboard', path: '/client', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'MANAJEMEN PROYEK',
    items: [
      { label: 'Penjadwalan & Sesi',    path: '/client/schedule',      icon: CalendarDays },
      { label: 'Psikogram Jabatan',     path: '/client/job-positions', icon: Target },
      { label: 'Kompetensi & Alat Tes', path: '/client/psychograph',  icon: ClipboardList },
    ],
  },
  {
    label: 'HASIL & EVALUASI',
    items: [
      { label: 'Hasil & Laporan', path: '/client/reports',      icon: FileText },
      { label: 'Monitoring Tes',  path: '/client/proctor',      icon: Radio, badge: 'Live', live: true },
      { label: 'Log Pengawasan',  path: '/client/proctor-logs', icon: ShieldCheck },
    ],
  },
];

const CLIENT_PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/client':               { title: 'Dashboard Utama', crumb: 'Dashboard' },
  '/client/schedule':      { title: 'Penjadwalan & Sesi Ujian', crumb: 'Penjadwalan & Sesi' },
  '/client/job-positions': { title: 'Daftar Standar Psikogram Jabatan', crumb: 'Psikogram Jabatan' },
  '/client/psychograph':   { title: 'Kompetensi & Alat Tes', crumb: 'Kompetensi & Alat Tes' },
  '/client/reports':       { title: 'Hasil & Laporan Asesmen', crumb: 'Hasil & Laporan' },
  '/client/proctor':       { title: 'Monitoring Peserta Tes', crumb: 'Monitoring Tes' },
  '/client/proctor-logs':  { title: 'Log Pengawasan Ujian', crumb: 'Log Pengawasan' },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

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
  const initial = clientName.charAt(0).toUpperCase();

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + '/');

  const pageKey = Object.keys(CLIENT_PAGE_META).find(k =>
    k === '/client' ? pathname === k : pathname.startsWith(k)
  );
  const meta = pageKey ? CLIENT_PAGE_META[pageKey] : { title: 'Portal Klien HR Publik', crumb: 'Portal' };

  /* ── Sidebar Shared Markup ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="HR Publik" className="h-9 w-9 object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold leading-tight text-slate-900 truncate">HR Publik</p>
            <p className="text-[11px] font-semibold tracking-wider text-teal-600 uppercase truncate">
              Portal Klien Mitra
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {CLIENT_SECTIONS.map(sec => (
          <div key={sec.label} className="flex flex-col gap-1">
            <p className="px-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              {sec.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {sec.items.map(item => {
                const active = isActive(item.path, (item as any).exact);
                const IconComp = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-teal-50 text-teal-800 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <IconComp
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-teal-600' : 'text-slate-400'
                        }`}
                      />

                      <span className="flex-1 leading-snug">{item.label}</span>

                      {(item as any).badge && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tight">
                          {(item as any).badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 p-4 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 select-none">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{clientName}</p>
            <p className="text-xs text-slate-400 truncate">Perusahaan Mitra</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full justify-start text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-xs"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar dari Sistem
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-60 bg-white border-r border-slate-200 shadow-xs
        flex flex-col shrink-0
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <SidebarContent />
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar matching Image 1 */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-6 shrink-0">
          {/* Hamburger (Mobile) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(true)}
            className="lg:hidden text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb (Desktop) */}
          <div className="flex-1 min-w-0 hidden md:flex items-center gap-2 text-sm text-slate-400">
            <img src="/logo.png" alt="HR Publik" className="w-5 h-5 object-contain shrink-0" />
            <span className="font-medium text-slate-500">HR Publik</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-slate-800 truncate">{meta.crumb}</span>
          </div>

          {/* Mobile page title */}
          <div className="flex-1 flex items-center gap-2 md:hidden min-w-0">
            <img src="/logo.png" alt="HR Publik" className="w-5 h-5 object-contain shrink-0" />
            <p className="text-sm font-semibold text-slate-800 truncate">{meta.crumb}</p>
          </div>

          {/* Right Header: Notification + Avatar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-rose-500 rounded-full" />
            </Button>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 select-none">
              {initial}
            </div>
          </div>
        </header>

        {/* Page Heading */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 shrink-0">
          <h1 className="text-sm font-bold text-slate-900">{meta.title}</h1>
        </div>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
