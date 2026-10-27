'use client';

import React, { useState } from 'react';
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
  ShieldAlert,
  Building2,
  Users,
  LogOut,
  Menu,
  ChevronRight,
  Bell,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─── Navigation config ────────────────────────────────────── */
const SECTIONS = [
  {
    label: 'Pusat Kendali',
    items: [
      { label: 'Dashboard', path: '/superadmin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Manajemen Proyek',
    items: [
      { label: 'Penjadwalan & Sesi',    path: '/superadmin/schedule',      icon: CalendarDays },
      { label: 'Psikogram Jabatan',     path: '/superadmin/job-positions', icon: Target },
      { label: 'Kompetensi & Alat Tes', path: '/superadmin/psychograph',  icon: ClipboardList },
    ],
  },
  {
    label: 'Hasil & Evaluasi',
    items: [
      { label: 'Hasil & Laporan',       path: '/superadmin/reports',     icon: FileText },
      { label: 'Monitoring Tes',        path: '/superadmin/live-stream', icon: Radio, badge: 'Live', live: true },
      { label: 'Log Pengawasan',        path: '/superadmin/proctor',     icon: ShieldAlert },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { label: 'Klien Perusahaan',  path: '/superadmin/clients', icon: Building2 },
      { label: 'Manajemen Tim',     path: '/superadmin/team',    icon: Users },
      { label: 'Log Aktivitas Akun', path: '/superadmin/activity-logs', icon: History },
    ],
  },
];

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/superadmin':               { title: 'Dashboard Utama',             crumb: 'Dashboard' },
  '/superadmin/schedule':      { title: 'Penjadwalan & Sesi Ujian',    crumb: 'Penjadwalan & Sesi' },
  '/superadmin/job-positions': { title: 'Daftar Standar Psikogram Jabatan', crumb: 'Psikogram Jabatan' },
  '/superadmin/psychograph':   { title: 'Kompetensi & Alat Tes',       crumb: 'Kompetensi & Alat Tes' },
  '/superadmin/reports':       { title: 'Hasil & Laporan',             crumb: 'Hasil & Laporan' },
  '/superadmin/live-stream':   { title: 'Monitoring Peserta Tes',      crumb: 'Monitoring Tes' },
  '/superadmin/proctor':       { title: 'Log Pengawasan',              crumb: 'Log Pengawasan' },
  '/superadmin/clients':       { title: 'Klien Perusahaan',            crumb: 'Klien' },
  '/superadmin/team':          { title: 'Manajemen Tim',               crumb: 'Tim' },
  '/superadmin/activity-logs': { title: 'Log Aktivitas Akun & Autentikasi', crumb: 'Log Aktivitas' },
  '/superadmin/participants':  { title: 'Daftar Peserta Ujian',        crumb: 'Peserta Ujian' },
};

/* ─── Component ────────────────────────────────────────────── */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);

  const role      = session?.user ? (session.user as any).role : null;
  const name      = session?.user?.name ?? 'Administrator';
  const initial   = name.charAt(0).toUpperCase();

  // Redirect psychologist to reports directly
  React.useEffect(() => {
    if (role === 'psikolog' && pathname === '/superadmin') {
      router.replace('/superadmin/reports');
    }
  }, [role, pathname, router]);

  // Dynamically filter sections based on role
  let filteredSections: typeof SECTIONS = [];
  if (role === 'superadmin') {
    filteredSections = SECTIONS;
  } else if (role === 'psikolog') {
    filteredSections = [
      {
        label: 'Hasil & Evaluasi',
        items: [
          { label: 'Hasil & Laporan', path: '/superadmin/reports', icon: FileText },
        ],
      },
    ];
  } else if (role === 'tester') {
    filteredSections = [
      {
        label: 'Hasil & Evaluasi',
        items: [
          { label: 'Daftar Peserta', path: '/superadmin/participants', icon: Users },
          { label: 'Hasil & Laporan', path: '/superadmin/reports', icon: FileText },
          { label: 'Monitoring Tes', path: '/superadmin/live-stream', icon: Radio, badge: 'Live', live: true },
          { label: 'Log Pengawasan', path: '/superadmin/proctor', icon: ShieldAlert },
        ],
      },
    ];
  }

  const isActive  = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + '/');

  const pageKey   = Object.keys(PAGE_META).find(k =>
    k === '/superadmin' ? pathname === k : pathname.startsWith(k)
  );
  const meta      = pageKey ? PAGE_META[pageKey] : { title: 'HR Publik Engine', crumb: '—' };

  /* ── Sidebar shared markup ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">

      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="HR Publik" className="h-9 w-9 object-contain shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-bold leading-tight text-slate-900">HR Publik</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Assessment Engine</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {filteredSections.map(sec => (
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
                          ? 'bg-teal-50 text-teal-800 font-semibold'
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
                        <Badge
                          variant={(item as any).live ? 'live' : 'primary'}
                          className="px-1.5 py-0 text-xs"
                        >
                          {(item as any).badge}
                        </Badge>
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full justify-start text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Keluar dari Sistem
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-60 bg-white border-r border-slate-200 shadow-xs
        flex flex-col shrink-0
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-6 shrink-0">

          {/* Hamburger */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(true)}
            className="lg:hidden text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0 hidden md:flex items-center gap-2 text-sm text-slate-400">
            <img src="/logo.png" alt="HR Publik" className="w-5 h-5 object-contain shrink-0" />
            <span className="font-medium text-slate-500">HR Publik</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-slate-800 truncate">{meta.crumb}</span>
          </div>

          {/* Mobile: page title */}
          <div className="flex-1 flex items-center gap-2 md:hidden min-w-0">
            <img src="/logo.png" alt="HR Publik" className="w-5 h-5 object-contain shrink-0" />
            <p className="text-sm font-semibold text-slate-800 truncate">{meta.crumb}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notif */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-rose-500 rounded-full" />
            </Button>

            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 select-none">
              {initial}
            </div>
          </div>
        </header>

        {/* Page heading */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 shrink-0">
          <h1 className="text-sm font-bold text-slate-900">{meta.title}</h1>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
