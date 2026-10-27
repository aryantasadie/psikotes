'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Coins, 
  CalendarPlus, 
  FileSpreadsheet, 
  Users, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface DashboardData {
  client: {
    id: number;
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    quotas: Record<string, number>;
    usedQuotas: Record<string, number>;
  };
  stats: {
    totalBatches: number;
    totalParticipants: number;
    completedParticipants: number;
  };
  recentBatches: Array<{
    id: number;
    title: string;
    startDate?: string | null;
    jobPositionName: string;
    testTools: string[];
    totalParticipants: number;
    completedParticipants: number;
  }>;
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
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span>Memuat data dashboard portal klien...</span>
      </div>
    );
  }

  if (!data || !data.client) {
    return (
      <div className="p-8 text-center text-slate-500">
        Gagal memuat profil klien. Silakan coba muat ulang halaman.
      </div>
    );
  }

  const { client, stats, recentBatches } = data;
  const quotaEntries = Object.entries(client.quotas || {}).filter(([_, q]) => q > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 to-teal-900 p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-teal-100 backdrop-blur-sm w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal Mandiri Rekrutmen Perusahaan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {client.name}
          </h1>
          <p className="text-sm text-teal-100/90 max-w-xl">
            Kelola sesi psikotes mandiri untuk kandidat Anda, pantau sisa kuota alat tes, dan unduh rekap nilai kelulusan secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="bg-white text-teal-900 hover:bg-teal-50 font-bold gap-2 shadow-md">
            <Link href="/client/schedule">
              <CalendarPlus className="w-4 h-4" />
              <span>Buat Sesi Ujian</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold gap-2">
            <Link href="/client/reports">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Lihat Hasil Nilai</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* SECTION: KUOTA ALAT TES */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Alokasi Saldo Kuota Alat Tes</h2>
          </div>
          <span className="text-xs text-slate-400">
            Kuota terpotong otomatis saat membuat akun ujian kandidat
          </span>
        </div>

        {quotaEntries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-400 text-xs">
              Belum ada kuota alat tes yang dialokasikan. Silakan hubungi Account Manager HR Publik untuk pengisian kuota.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quotaEntries.map(([testName, totalQuota]) => {
              const used = client.usedQuotas[testName] || 0;
              const remaining = Math.max(0, totalQuota - used);
              const percentage = Math.round((remaining / totalQuota) * 100);

              return (
                <Card key={testName} className="hover:border-teal-300 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                      {testName}
                    </CardDescription>
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-2xl font-extrabold text-slate-900">{remaining}</span>
                      <span className="text-xs text-slate-400 font-medium">/ {totalQuota} kuota</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          percentage > 30 ? 'bg-teal-600' : percentage > 10 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium pt-1 block">
                      Tersisa {percentage}%
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Total Sesi / Batch Ujian
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalBatches}</span>
              <span className="text-sm font-medium text-slate-500">Sesi</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-sky-50/50 border-sky-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-sky-700">
              Total Kandidat Terdaftar
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-sky-600">{stats.totalParticipants}</span>
              <span className="text-sm font-medium text-sky-700">Akun</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-emerald-700">
              Kandidat Selesai Ujian
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">{stats.completedParticipants}</span>
              <span className="text-sm font-medium text-emerald-700">Kandidat</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* SECTION: RECENT BATCHES */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Sesi Ujian Terbaru
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daftar batch rekrutmen yang dibuat oleh perusahaan Anda
              </CardDescription>
            </div>

            <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
              <Link href="/client/reports">
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Sesi & Tanggal</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Alat Tes yang Diujikan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Jumlah Kandidat</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status Pengerjaan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    Belum ada sesi ujian yang dibuat. Klik tombol &ldquo;Buat Sesi Ujian&rdquo; untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                recentBatches.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-900">{b.title}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {b.testTools.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-bold text-slate-900">
                      {b.totalParticipants} Kandidat
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{b.completedParticipants} / {b.totalParticipants} Selesai</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1">
                        <Link href={`/client/reports?batchId=${b.id}`}>
                          <span>Buka Hasil</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
