'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BatchSession {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  clientName: string;
  totalParticipants: number;
  completedParticipants: number;
}

export default function SuperadminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [batches, setBatches] = useState<BatchSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'psikolog') {
      router.replace('/superadmin/reports');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetch('/api/superadmin/schedule/batches')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBatches(data);
        } else {
          // Default demo fallback if no batches yet
          setBatches([
            {
              id: 1,
              title: 'Seleksi Management Trainee — Finance & Accounting',
              startDate: new Date(Date.now() + 86400000).toISOString(),
              jobPositionName: 'Management Trainee',
              clientName: 'PT Pertamina Training & Consulting',
              totalParticipants: 45,
              completedParticipants: 40,
            },
            {
              id: 2,
              title: 'Asesmen Manajerial & Kepemimpinan Senior',
              startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
              jobPositionName: 'Branch Manager',
              clientName: 'Bank Mandiri (Persero) Tbk',
              totalParticipants: 28,
              completedParticipants: 20,
            },
            {
              id: 3,
              title: 'Pemetaan Potensi & Minat Bakat Staf IT',
              startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
              jobPositionName: 'Senior Software Engineer',
              clientName: 'TechCorp Indonesia',
              totalParticipants: 109,
              completedParticipants: 108,
            },
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (status === 'loading' || (session?.user as any)?.role === 'psikolog') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500">
        <p className="text-sm font-medium animate-pulse">Memuat dashboard...</p>
      </div>
    );
  }

  // Calculate metrics
  const totalProjects = batches.length;
  const completedProjects = batches.filter(
    b => b.totalParticipants > 0 && b.completedParticipants >= b.totalParticipants
  ).length;
  const ongoingProjects = totalProjects - completedProjects;

  const totalParticipants = batches.reduce((sum, b) => sum + (b.totalParticipants || 0), 0);
  const totalCompletedParticipants = batches.reduce((sum, b) => sum + (b.completedParticipants || 0), 0);
  const totalPendingParticipants = Math.max(0, totalParticipants - totalCompletedParticipants);

  // Sort batches starting from nearest upcoming / future dates
  const sortedBatches = [...batches].sort((a, b) => {
    const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return timeA - timeB;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── 3 KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Jumlah Semua Proyek */}
        <Link href="/superadmin/schedule" className="block">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Jumlah Semua Proyek</p>
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p className="text-[32px] font-black leading-none text-slate-900 mt-2">{totalProjects}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                {ongoingProjects} Berjalan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {completedProjects} Selesai
              </span>
            </div>
          </div>
        </Link>

        {/* Card 2: Jumlah Semua Peserta */}
        <Link href="/superadmin/schedule" className="block">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Jumlah Semua Peserta</p>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[32px] font-black leading-none text-slate-900 mt-2">{totalParticipants}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">
                Total akun peserta terdaftar dalam sistem
              </span>
            </div>
          </div>
        </Link>

        {/* Card 3: Status Laporan (Selesai vs Belum Selesai) */}
        <Link href="/superadmin/reports" className="block">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Status Laporan</p>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-[32px] font-black leading-none text-emerald-700">{totalCompletedParticipants}</p>
                <span className="text-[14px] font-bold text-slate-400">/ {totalPendingParticipants} dalam proses</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {totalCompletedParticipants} Selesai
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {totalPendingParticipants} Belum Selesai
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Resume Jadwal Asesmen (Full Width) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-[16px] font-bold text-slate-900">Resume Jadwal Asesmen</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Daftar jadwal asesmen dimulai dari jadwal terdekat akan datang dan berlanjut
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Memuat jadwal asesmen…
          </div>
        ) : sortedBatches.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
            Belum ada jadwal sesi asesmen yang dibuat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedBatches.map(item => {
              const isCompleted = item.totalParticipants > 0 && item.completedParticipants >= item.totalParticipants;
              const dateStr = item.startDate
                ? new Date(item.startDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Belum Ditentukan';

              return (
                <div key={item.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-[14px] font-bold text-slate-900">{item.title}</p>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}
                      >
                        {isCompleted ? 'Selesai' : 'Berjalan'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[12px] text-slate-500 flex-wrap">
                      <span className="font-semibold text-slate-700">{item.clientName}</span>
                      <span>•</span>
                      <span>Posisi: {item.jobPositionName}</span>
                      <span>•</span>
                      <span className="text-slate-400">{item.totalParticipants} Peserta</span>
                    </div>
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {dateStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
