'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

/* ─── SVG icon atom ───────────────────────────────────────── */
const Ico = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const P = {
  home:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  intake:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  tes:      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  schedule: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  report:   "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  proctor:  "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  client:   "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  team:     "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  logout:   "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  burger:   "M4 6h16M4 12h16M4 18h16",
  bell:     "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  chevron:  "M9 5l7 7-7 7",
};

/* ─── Navigation config ────────────────────────────────────── */
const SECTIONS = [
  {
    label: 'Pusat Kendali',
    items: [
      { label: 'Dashboard', path: '/superadmin', icon: 'home', exact: true },
    ],
  },
  {
    label: 'Manajemen Proyek',
    items: [
      { label: 'Setting Psikogram',    path: '/superadmin/job-positions', icon: 'intake' },
      { label: 'Kompetensi & Alat Tes', path: '/superadmin/psychograph',  icon: 'tes' },
      { label: 'Sesi & Penjadwalan',    path: '/superadmin/schedule',      icon: 'schedule', badge: 'Aktif' },
    ],
  },
  {
    label: 'Hasil & Evaluasi',
    items: [
      { label: 'Laporan & QC Review',   path: '/superadmin/reports',     icon: 'report' },
      { label: 'Live Stream CCTV',      path: '/superadmin/live-stream', icon: 'proctor', badge: 'Live', live: true },
      { label: 'Proctoring Center',     path: '/superadmin/proctor',     icon: 'proctor' },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { label: 'Klien Perusahaan',  path: '/superadmin/clients', icon: 'client' },
      { label: 'Manajemen Tim',     path: '/superadmin/team',    icon: 'team'   },
    ],
  },
];

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/superadmin':               { title: 'Dashboard Utama',             crumb: 'Dashboard' },
  '/superadmin/job-positions': { title: 'Setting Psikogram Posisi',    crumb: 'Setting Psikogram' },
  '/superadmin/psychograph':   { title: 'Master Kompetensi & Alat Tes',crumb: 'Kompetensi & Alat Tes' },
  '/superadmin/schedule':      { title: 'Sesi Ujian & Penjadwalan',    crumb: 'Penjadwalan' },
  '/superadmin/reports':       { title: 'Laporan & QC Review',         crumb: 'Laporan' },
  '/superadmin/live-stream':   { title: 'Live Stream CCTV Control Room', crumb: 'Live Stream CCTV' },
  '/superadmin/proctor':       { title: 'Proctoring Center',           crumb: 'Proctoring' },
  '/superadmin/clients':       { title: 'Klien Perusahaan',            crumb: 'Klien' },
  '/superadmin/team':          { title: 'Manajemen Tim',               crumb: 'Tim' },
};

/* ─── Component ────────────────────────────────────────────── */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);
  const [q,    setQ]      = useState('');

  const role      = (session?.user as any)?.role ?? 'superadmin';
  const name      = session?.user?.name ?? 'Administrator';
  const initial   = name.charAt(0).toUpperCase();

  const isActive  = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + '/');

  const pageKey   = Object.keys(PAGE_META).find(k =>
    k === '/superadmin' ? pathname === k : pathname.startsWith(k)
  );
  const meta      = pageKey ? PAGE_META[pageKey] : { title: 'HR Publik Engine', crumb: '—' };

  /* ── Sidebar shared markup ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-900 font-bold text-sm leading-tight">HR Publik</p>
            <p className="text-teal-600 text-[10px] font-semibold tracking-widest uppercase">Assessment Engine</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {SECTIONS.map(sec => (
          <div key={sec.label}>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 px-2.5 mb-1.5">
              {sec.label}
            </p>
            <ul className="space-y-0.5">
              {sec.items.map(item => {
                const active = isActive(item.path, (item as any).exact);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {/* Active indicator */}
                      <span className={`shrink-0 ${active ? 'text-teal-600' : 'text-slate-400'}`}>
                        <Ico d={P[item.icon as keyof typeof P]} size={16} />
                      </span>

                      <span className="flex-1 leading-snug">{item.label}</span>

                      {(item as any).badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide ${
                          (item as any).live
                            ? 'bg-rose-50 text-rose-500 border border-rose-200'
                            : 'bg-teal-50 text-teal-600 border border-teal-200'
                        }`}>
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
      <div className="border-t border-slate-100 px-4 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">{name}</p>
            <p className="text-[11px] text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <Ico d={P.logout} size={14} />
          Keluar dari Sistem
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-60 bg-white border-r border-slate-200 shadow-sm
        flex flex-col shrink-0
        transition-transform duration-250 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-6 shrink-0">

          {/* Hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Ico d={P.burger} size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0 hidden md:flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-500">HR Publik</span>
            <Ico d={P.chevron} size={12} />
            <span className="font-semibold text-slate-800 truncate">{meta.crumb}</span>
          </div>

          {/* Mobile: page title */}
          <p className="flex-1 text-sm font-semibold text-slate-800 truncate md:hidden">{meta.crumb}</p>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 w-52 lg:w-64 focus-within:border-teal-400 focus-within:bg-white transition-all">
            <span className="text-slate-400"><Ico d={P.search} size={14} /></span>
            <input
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Cari kandidat, token, proyek…"
              className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder-slate-400"
            />
          </div>

          {/* Role switcher */}
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide hidden sm:inline">Peran:</span>
            <select
              value={role}
              onChange={e => {
                const v = e.target.value;
                if (v === 'client') router.push('/client');
                else if (v === 'testee') router.push('/testee/session');
                else router.push('/superadmin');
              }}
              className="bg-transparent text-[12px] font-bold text-teal-600 focus:outline-none cursor-pointer"
            >
              <option value="superadmin">Superadmin</option>
              <option value="psikolog">Psikolog</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="testee">Peserta Tes</option>
            </select>
          </div>

          {/* Notif */}
          <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <Ico d={P.bell} size={17} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer">
            {initial}
          </div>
        </header>

        {/* Page heading */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 shrink-0">
          <h1 className="text-[15px] font-bold text-slate-900">{meta.title}</h1>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
