'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Calendar, 
  Loader2,
  Coins,
  FileSpreadsheet,
  Eye,
  Radio,
  ArrowLeftRight,
  Package,
  Target,
  History,
  Clock,
  Sparkles,
  Plus,
  X,
  UserCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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

interface ConsumedCandidate {
  participantId: number;
  name: string;
  username: string;
  status: string;
  startTime?: string | null;
}

interface QuotaLedgerItem {
  id: number;
  quotaType: 'PACKAGE' | 'SINGLE';
  transactionType: 'TOPUP' | 'USAGE' | 'CONVERT' | 'EXPIRED' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  referenceDoc?: string | null;
  notes?: string | null;
  createdAt: string;
  testId?: number | null;
  testTitle?: string | null;
  testSpec?: string | null;
  consumedCandidatesCount: number;
  consumedCandidates: ConsumedCandidate[];
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
    wallet?: {
      quotaPackage: number;
      quotaSingle: number;
      quotaExpiredAt?: string | null;
    };
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
    quotaPackage?: number;
    quotaSingle?: number;
    quotaExpiredAt?: string | null;
  };
  batches: BatchSession[];
}

export default function ClientDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Tukar Kuota State
  const [convertModal, setConvertModal] = useState<{
    isOpen: boolean;
    direction: 'PACKAGE_TO_SINGLE' | 'SINGLE_TO_PACKAGE';
    amount: string;
    isSubmitting: boolean;
    error: string;
  }>({
    isOpen: false,
    direction: 'PACKAGE_TO_SINGLE',
    amount: '1',
    isSubmitting: false,
    error: '',
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/client/dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error('Error fetching client dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConvertSubmit = async () => {
    const n = parseInt(convertModal.amount, 10);
    if (isNaN(n) || n <= 0) {
      setConvertModal(prev => ({ ...prev, error: 'Jumlah konversi harus berupa angka positif (> 0).' }));
      return;
    }

    setConvertModal(prev => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      const res = await fetch('/api/client/quota/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: convertModal.direction,
          amount: n,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        alert(resData.message || 'Konversi kuota berhasil dilakukan!');
        setConvertModal(prev => ({ ...prev, isOpen: false }));
        fetchDashboardData();
      } else {
        setConvertModal(prev => ({ ...prev, error: resData.error || 'Gagal melakukan konversi kuota.' }));
      }
    } catch {
      setConvertModal(prev => ({ ...prev, error: 'Terjadi kesalahan jaringan.' }));
    } finally {
      setConvertModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

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
  const quotaPackage = data?.client?.wallet?.quotaPackage ?? stats.quota;
  const quotaSingle = data?.client?.wallet?.quotaSingle ?? 0;
  const expiredAt = data?.client?.wallet?.quotaExpiredAt;

  const getExpirationBadge = (dateStr?: string | null) => {
    if (!dateStr) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <Clock className="w-3 h-3 text-slate-400" /> Masa Aktif Tanpa Batas
        </span>
      );
    }
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = exp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (diffDays < 0) {
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs py-0.5 gap-1 font-bold">
          🔴 Kedaluwarsa ({formatted})
        </Badge>
      );
    }
    if (diffDays <= 14) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs py-0.5 gap-1 font-bold">
          🟡 Menipis ({diffDays} hari lagi - {formatted})
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-0.5 gap-1 font-bold">
        🟢 Aktif s/d {formatted}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── HEADER CARD: DUAL-WALLET & TUKAR KUOTA (DESAIN SERAGAM DASHBOARD) ── */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                Dompet Saldo Kuota (Dual-Wallet)
              </span>
              <div>{getExpirationBadge(expiredAt)}</div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Saldo Kuota Asesmen {data?.client?.name || 'Perusahaan'}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem menggunakan model <strong>Deduct on Start</strong> (anti-ghosting): Kuota hanya terpotong saat kandidat menekan <em>&quot;Mulai Tes&quot;</em> pertama kali. Link ujian yang belum dibuka tidak memotong kuota.
            </p>
            <div className="pt-1">
              <Link
                href="/client/quota"
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>Buka Log Pemakaian & Riwayat Transaksi Kuota Lengkap ↗</span>
              </Link>
            </div>
          </div>

          {/* Dual Wallet Display & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Wallet 1: Paket Asesmen */}
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 flex flex-col gap-0.5 min-w-[170px]">
              <span className="text-[11px] font-bold text-teal-900 uppercase flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600" />
                <span>Paket Asesmen</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-2xl font-black text-teal-950">{quotaPackage}</strong>
                <span className="text-xs text-teal-800 font-medium">Sesi</span>
              </div>
              <span className="text-[10px] text-teal-700">
                Kedaluwarsa: {expiredAt ? new Date(expiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
              </span>
            </div>

            {/* Wallet 2: Single Test */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3.5 flex flex-col gap-0.5 min-w-[170px]">
              <span className="text-[11px] font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Single Test</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-2xl font-black text-indigo-950">{quotaSingle}</strong>
                <span className="text-xs text-indigo-800 font-medium">Tes</span>
              </div>
              <span className="text-[10px] text-indigo-700">
                Kedaluwarsa: {expiredAt ? new Date(expiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{stats.totalParticipants}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {stats.completedParticipants} Selesai
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {stats.pendingParticipants} Berjalan
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

        {/* Card 4: Sisa Saldo Kuota */}
        <Link href="/client/schedule" className="block">
          <Card className="hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer h-full border-slate-200">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sisa Saldo Kuota
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{quotaPackage + quotaSingle}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  {quotaPackage} Paket
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {quotaSingle} Single
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Resume Jadwal Asesmen (Matching Image 1) ── */}
      <Card className="border-slate-200">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Resume Jadwal Asesmen</h2>
              <p className="text-xs text-slate-500">
                Daftar jadwal asesmen dimulai dari jadwal terdekat akan datang dan berlanjut
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs font-bold gap-1 self-start sm:self-auto">
              <Link href="/client/schedule">
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Jadwal Baru</span>
              </Link>
            </Button>
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

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-medium shadow-2xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{dateStr}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/client/proctor?batchId=${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors"
                          title="Buka pengawasan live proctoring sesi ini"
                        >
                          <Radio className="w-3.5 h-3.5 text-teal-600" />
                          <span>Pantau</span>
                        </Link>

                        <Link
                          href={`/client/reports?batchId=${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                          title="Buka rekap hasil nilai sesi ini"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                          <span>Nilai</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL KONVERSI / TUKAR KUOTA (1 PAKET = 3 SINGLE) ── */}
      <Dialog open={convertModal.isOpen} onOpenChange={(open) => !open && setConvertModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Tukar Saldo Kuota (Konversi)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Rasio Resmi: <strong>1 Kuota Paket Asesmen = 3 Kuota Single Test</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 text-xs">
            {convertModal.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {convertModal.error}
              </div>
            )}

            {/* Arah Konversi */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700">Pilih Arah Penukaran *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConvertModal(prev => ({ ...prev, direction: 'PACKAGE_TO_SINGLE', amount: '1', error: '' }))}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    convertModal.direction === 'PACKAGE_TO_SINGLE'
                      ? 'border-teal-500 bg-teal-50/70 text-teal-950 font-bold ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-teal-600" />
                    <span>Paket → Single</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Tukar 1 Paket jadi 3 Single Test
                  </span>
                  <span className="text-[10px] text-teal-800 font-semibold mt-1">
                    Tersedia: {quotaPackage} Paket
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConvertModal(prev => ({ ...prev, direction: 'SINGLE_TO_PACKAGE', amount: '1', error: '' }))}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    convertModal.direction === 'SINGLE_TO_PACKAGE'
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Single → Paket</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Tukar 3 Single jadi 1 Paket Asesmen
                  </span>
                  <span className="text-[10px] text-indigo-800 font-semibold mt-1">
                    Tersedia: {quotaSingle} Single
                  </span>
                </button>
              </div>
            </div>

            {/* Input Jumlah */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700">
                {convertModal.direction === 'PACKAGE_TO_SINGLE'
                  ? 'Jumlah Kuota Paket yang Ditukar'
                  : 'Jumlah Kuota Paket yang Ingin Diperoleh'} *
              </label>
              <Input
                type="number"
                min="1"
                value={convertModal.amount}
                onChange={(e) => setConvertModal(prev => ({ ...prev, amount: e.target.value, error: '' }))}
                className="h-9 text-xs font-bold"
              />
            </div>

            {/* Live Calculation Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Saldo yang Dikorbankan:</span>
                <span className="text-rose-700 font-bold">
                  {convertModal.direction === 'PACKAGE_TO_SINGLE'
                    ? `-${parseInt(convertModal.amount, 10) || 0} Kuota Paket`
                    : `-${(parseInt(convertModal.amount, 10) || 0) * 3} Kuota Single`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold border-t border-slate-200 pt-1.5">
                <span className="text-slate-600">Saldo yang Didapatkan:</span>
                <span className="text-emerald-700 font-bold">
                  {convertModal.direction === 'PACKAGE_TO_SINGLE'
                    ? `+${(parseInt(convertModal.amount, 10) || 0) * 3} Kuota Single Test`
                    : `+${parseInt(convertModal.amount, 10) || 0} Kuota Paket Asesmen`}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConvertModal(prev => ({ ...prev, isOpen: false }))}
              disabled={convertModal.isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConvertSubmit}
              disabled={convertModal.isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 cursor-pointer"
            >
              {convertModal.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{convertModal.isSubmitting ? 'Memproses...' : 'Tukar Kuota Sekarang'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
