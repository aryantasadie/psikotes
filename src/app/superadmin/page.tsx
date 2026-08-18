'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/* ─── Types ──────────────────────────────────────────────── */
interface Report { id: number; name: string; position: string; status: string; }

/* ─── Static data ─────────────────────────────────────────── */
const METRICS = [
  {
    label: 'Proyek Assessment',
    value: '3',
    note: '2 aktif · 1 selesai',
    accent: 'teal',
    path: '/superadmin/schedule',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    label: 'Total Peserta',
    value: '182',
    note: 'Terdaftar di sistem',
    accent: 'indigo',
    path: '/superadmin/reports',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    label: 'Perlu QC Review',
    value: '14',
    note: 'Menunggu verifikasi psikolog',
    accent: 'amber',
    path: '/superadmin/reports',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    label: 'Laporan Final',
    value: '168',
    note: 'Siap diunduh klien',
    accent: 'emerald',
    path: '/superadmin/reports',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
] as const;

type Accent = typeof METRICS[number]['accent'];

const ACCENT: Record<Accent, { bg: string; text: string; border: string; val: string }> = {
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-100',    val: 'text-teal-700'    },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-100',  val: 'text-indigo-700'  },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   val: 'text-amber-700'   },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', val: 'text-emerald-700' },
};

const PROJECTS = [
  {
    id: 1,
    title: 'Seleksi Management Trainee — Finance & Accounting',
    company: 'PT Pertamina Training & Consulting',
    position: 'Management Trainee',
    batch: 'Batch 1 · 2026',
    total: 45, done: 40, qc: 5,
    status: 'Berlangsung',
    statusCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    pct: 89,
    barCls: 'bg-emerald-500',
  },
  {
    id: 2,
    title: 'Asesmen Manajerial & Kepemimpinan Senior',
    company: 'Bank Mandiri (Persero) Tbk',
    position: 'Branch Manager',
    batch: 'Batch Q3 · 2026',
    total: 28, done: 20, qc: 8,
    status: 'Perlu QC Review',
    statusCls: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    pct: 71,
    barCls: 'bg-amber-400',
  },
  {
    id: 3,
    title: 'Pemetaan Potensi & Minat Bakat Staf IT',
    company: 'TechCorp Indonesia',
    position: 'Senior Software Engineer',
    batch: 'Batch July · 2026',
    total: 109, done: 108, qc: 1,
    status: 'Selesai',
    statusCls: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    pct: 99,
    barCls: 'bg-slate-400',
  },
];

const WORKFLOW = [
  { n: 1, label: 'Setting Psikogram Posisi',             path: '/superadmin/job-positions', done: true  },
  { n: 2, label: 'Master Kompetensi & Alat Tes',         path: '/superadmin/psychograph',   done: true  },
  { n: 3, label: 'Buat Sesi & Generate Token Peserta',   path: '/superadmin/schedule',      done: false },
  { n: 4, label: 'Pantau Proctoring & Ujian Berlangsung',path: '/superadmin/proctor',        done: false },
  { n: 5, label: 'Kirim Laporan Hasil ke QC Review',     path: '/superadmin/reports',       done: false },
];

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
];

/* ─── Mini components ─────────────────────────────────────── */
const SvgIco = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);

const SectionTitle = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">{children}</h2>
    {action}
  </div>
);

/* ─── Page ────────────────────────────────────────────────── */
export default function SuperadminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'psikolog') {
      router.replace('/superadmin/reports');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetch('/api/superadmin/reports')
      .then(r => r.ok ? r.json() : [])
      .then(d => setReports(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  if (status === 'loading' || (session?.user as any)?.role === 'psikolog') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500">
        <p className="text-sm font-medium animate-pulse">Memuat halaman...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(m => {
          const a = ACCENT[m.accent];
          return (
            <Link key={m.label} href={m.path}>
              <Card className="p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${a.bg} ${a.text} ${a.border}`}>
                  <SvgIco d={m.icon} />
                </div>
                <p className={`text-[26px] font-black leading-none ${a.val}`}>{m.value}</p>
                <p className="text-[13px] font-semibold text-slate-700 mt-1">{m.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.note}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Date + quick actions bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-widest">{today}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Terdapat <span className="font-bold text-slate-800">14 laporan</span> menunggu QC Review dari psikolog.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/superadmin/schedule"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Buat Sesi Baru
          </Link>
          <Link href="/superadmin/reports"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors">
            Buka QC Review
          </Link>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: Projects */}
        <div className="lg:col-span-2">
          <SectionTitle action={
            <Link href="/superadmin/schedule" className="text-[12px] font-semibold text-teal-600 hover:text-teal-700">
              Lihat semua →
            </Link>
          }>
            Proyek Assessment Aktif
          </SectionTitle>

          <div className="space-y-3">
            {PROJECTS.map(p => (
              <Card key={p.id} className="p-5 hover:shadow-md hover:border-slate-300 transition-all">
                {/* Header row */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 leading-snug">{p.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.company} · {p.position}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${p.statusCls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.status}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-500">{p.batch}</span>
                  <span>{p.total} peserta</span>
                  {p.qc > 0 && (
                    <span className="text-amber-600 font-semibold">{p.qc} perlu QC</span>
                  )}
                </div>

                {/* Progress */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400">Progres pengerjaan</span>
                    <span className="font-semibold text-slate-600">{p.done} / {p.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${p.barCls}`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>

                {/* Action */}
                <div className="mt-4 flex justify-end">
                  <Link href="/superadmin/reports"
                    className="text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                    Buka QC Review →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Live proctoring */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Proctoring</p>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                LIVE
              </span>
            </div>
            <p className="text-[28px] font-black text-slate-900 leading-none">2</p>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">sesi ujian berlangsung</p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">47 peserta sedang mengerjakan</p>
            <Link href="/superadmin/proctor"
              className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold py-2.5 rounded-xl transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Pantau Sekarang
            </Link>
          </Card>

          {/* Workflow steps */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Alur Kerja Assessment</p>
            <ol className="space-y-2">
              {WORKFLOW.map(w => (
                <li key={w.n}>
                  <Link href={w.path}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      w.done
                        ? 'bg-teal-50 hover:bg-teal-100'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      w.done
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}>
                      {w.done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : w.n}
                    </span>
                    <span className={`flex-1 text-[12px] font-medium leading-snug ${w.done ? 'text-teal-700' : 'text-slate-600'}`}>
                      {w.label}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-slate-300 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          {/* Recent reports (live data) */}
          {reports.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peserta Terbaru</p>
                <Link href="/superadmin/reports" className="text-[11px] font-semibold text-teal-600 hover:text-teal-700">
                  Lihat semua →
                </Link>
              </div>
              <ul className="space-y-3">
                {reports.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {r.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{r.position ?? '—'}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                      r.status === 'done'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {r.status === 'done' ? 'Selesai' : 'Proses'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
