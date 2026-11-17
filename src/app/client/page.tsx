'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Calendar, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BatchSession {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  clientName: string;
  totalParticipants: number;
  completedParticipants: number;
  completedReports: number;
  isCompleted: boolean;
}

interface DashboardData {
  client: {
    id: number;
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
    totalQuota: number;
    usedQuota: number;
    remainingQuota: number;
  };
  stats: {
    totalProjects: number;
    ongoingProjects: number;
    completedProjects: number;
    totalParticipants: number;
    completedParticipants: number;
    pendingParticipants: number;
    completedReports: number;
    pendingReports: number;
    quota: number;
  };
  batches: BatchSession[];
}

export default function ClientDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/client/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching client dashboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        <span className="text-sm font-medium">Memuat data dashboard...</span>
      </div>
    );
  }

  const stats = data?.stats || {
    totalProjects: 0,
    ongoingProjects: 0,
    completedProjects: 0,
    totalParticipants: 0,
    completedParticipants: 0,
    pendingParticipants: 0,
    completedReports: 0,
    pendingReports: 0,
    quota: 0,
  };

  const batches = data?.batches || [];

  return (
    <div className="flex flex-col gap-6">
      {/* ── 4 KPI Stat Cards Matching Image 1 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jumlah Semua Proyek */}
        <Link href="/client/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer h-full border-slate-200">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Jumlah Semua Proyek
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{stats.totalProjects}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {stats.ongoingProjects} Berjalan
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {stats.completedProjects} Selesai
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Jumlah Semua Peserta */}
        <Link href="/client/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer h-full border-slate-200">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Jumlah Semua Peserta
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{stats.totalParticipants}</p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">
                  Total akun peserta terdaftar
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Peserta Selesai Tes */}
        <Link href="/client/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer h-full border-slate-200">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Peserta Selesai Tes
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{stats.completedParticipants}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {stats.completedParticipants} Selesai Tes
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {stats.pendingParticipants} Belum Selesai
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Kuota */}
        <Link href="/client/reports" className="block">
          <Card className="hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer h-full border-slate-200">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Kuota
                  </span>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{stats.quota}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {stats.completedReports} Siap / Rilis
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {stats.pendingReports} Belum Diperiksa
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Resume Jadwal Asesmen (Matching Image 1) ── */}
      <Card className="border-slate-200">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-4 flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-slate-900">Resume Jadwal Asesmen</h2>
            <p className="text-xs text-slate-500">
              Daftar jadwal asesmen dimulai dari jadwal terdekat akan datang dan berlanjut
            </p>
          </div>

          {batches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              Belum ada jadwal sesi asesmen yang dibuat.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {batches.map(item => {
                const dateStr = item.startDate
                  ? new Date(item.startDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Belum Ditentukan';

                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            item.isCompleted
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.isCompleted ? 'Selesai' : 'Berjalan'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-700">{item.clientName}</span>
                        <span>•</span>
                        <span>Posisi: {item.jobPositionName}</span>
                        <span>•</span>
                        <span className="text-slate-500">{item.totalParticipants} Peserta</span>
                        <span>•</span>
                        <span className="text-teal-700 font-bold">{item.completedParticipants} Selesai Tes</span>
                        <span>•</span>
                        <span className="text-teal-700 font-bold">{item.completedReports || 0} Laporan Selesai</span>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-medium shadow-2xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
