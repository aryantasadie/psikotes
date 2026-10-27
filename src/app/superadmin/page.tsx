'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
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
  completedReports?: number;
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
      <div className="flex flex-col items-center justify-center min-h-72 text-slate-500">
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
  const totalReviewedReports = batches.reduce((sum, b) => sum + (b.completedReports || 0), 0);
  const totalPendingReports = Math.max(0, totalParticipants - totalReviewedReports);

  // Sort batches starting from nearest upcoming / future dates
  const sortedBatches = [...batches].sort((a, b) => {
    const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return timeA - timeB;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ── 4 KPI Cards: Proyek, Peserta, Peserta Selesai Tes (Kiri), Laporan Selesai Diperiksa (Kanan) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Jumlah Semua Proyek */}
        <Link href="/superadmin/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Semua Proyek</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{totalProjects}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <Badge variant="primary" className="gap-1 text-[11px] py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                  {ongoingProjects} Berjalan
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[11px] py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {completedProjects} Selesai
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Jumlah Semua Peserta */}
        <Link href="/superadmin/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Semua Peserta</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{totalParticipants}</p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">
                  Total akun peserta terdaftar
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Peserta Selesai Tes (Kiri) - Angka langsung, palet warna teal */}
        <Link href="/superadmin/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Peserta Selesai Tes</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{totalCompletedParticipants}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <Badge variant="primary" className="gap-1 text-[11px] py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                  {totalCompletedParticipants} Selesai Tes
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[11px] py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {totalPendingParticipants} Belum Selesai
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Laporan Selesai Diperiksa (Kanan) - Angka langsung, palet warna emerald */}
        <Link href="/superadmin/reports" className="block">
          <Card className="hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Laporan Selesai Diperiksa</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{totalReviewedReports}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <Badge variant="success" className="gap-1 text-[11px] py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {totalReviewedReports} Siap / Rilis
                </Badge>
                <Badge variant="warning" className="gap-1 text-[11px] py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {totalPendingReports} Belum Diperiksa
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Resume Jadwal Asesmen (Full Width) ── */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-4 flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-slate-900">Resume Jadwal Asesmen</h2>
            <p className="text-xs text-slate-500">
              Daftar jadwal asesmen dimulai dari jadwal terdekat akan datang dan berlanjut
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
              <div className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <Badge variant={isCompleted ? 'secondary' : 'primary'}>
                          {isCompleted ? 'Selesai' : 'Berjalan'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-700">{item.clientName}</span>
                        <span>•</span>
                        <span>Posisi: {item.jobPositionName}</span>
                        <span>•</span>
                        <span className="text-slate-400">{item.totalParticipants} Peserta</span>
                        <span>•</span>
                        <span className="text-teal-700 font-semibold">{item.completedParticipants} Selesai Tes</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{item.completedReports || 0} Laporan Selesai</span>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <Badge variant="outline" className="gap-1.5 py-1 text-slate-600 bg-slate-50 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {dateStr}
                      </Badge>
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
