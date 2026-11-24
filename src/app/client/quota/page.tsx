'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Coins, 
  Package, 
  Target, 
  ArrowLeftRight, 
  History, 
  Clock, 
  Eye, 
  Plus, 
  Loader2, 
  UserCheck 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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

interface WalletData {
  quotaPackage: number;
  quotaSingle: number;
  quotaExpiredAt?: string | null;
}

export default function ClientQuotaPage() {
  const [wallet, setWallet] = useState<WalletData>({ quotaPackage: 0, quotaSingle: 0, quotaExpiredAt: null });
  const [ledgers, setLedgers] = useState<QuotaLedgerItem[]>([]);
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

  // Modal Detail Peserta Terkonsumsi (Child Modal)
  const [candidateModal, setCandidateModal] = useState<{
    isOpen: boolean;
    ledger: QuotaLedgerItem | null;
  }>({
    isOpen: false,
    ledger: null,
  });

  const fetchQuotaData = async () => {
    try {
      const res = await fetch('/api/client/quota/ledger');
      if (res.ok) {
        const d = await res.json();
        if (d.wallet) {
          setWallet(d.wallet);
        }
        setLedgers(d.ledgers || []);
      }
    } catch (err) {
      console.error('Error fetching client quota ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaData();
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
        fetchQuotaData();
      } else {
        setConvertModal(prev => ({ ...prev, error: resData.error || 'Gagal melakukan konversi kuota.' }));
      }
    } catch {
      setConvertModal(prev => ({ ...prev, error: 'Terjadi kesalahan jaringan.' }));
    } finally {
      setConvertModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const getExpirationText = (dateStr?: string | null) => {
    if (!dateStr) return 'Tanpa Batas Kedaluwarsa';
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = exp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (diffDays < 0) return `🔴 Kedaluwarsa (${formatted})`;
    if (diffDays <= 14) return `🟡 Menipis (${diffDays} hari lagi - ${formatted})`;
    return `🟢 Aktif s/d ${formatted}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        <span className="text-sm font-medium">Memuat log kuota & mutasi...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── CARD SALDO DUAL-WALLET (DESAIN SERAGAM DASHBOARD) ── */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                Dompet Kuota Mitra
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Log Pemakaian & Saldo Kuota Asesmen
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kuota dipotong secara otomatis dengan sistem <strong>Deduct on Start</strong> saat kandidat menekan <em>&quot;Mulai Tes&quot;</em>. Pembuatan link ujian tidak memotong kuota.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Wallet 1: Paket Asesmen */}
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 flex flex-col gap-0.5 min-w-[170px]">
              <span className="text-[11px] font-bold text-teal-900 uppercase flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600" />
                <span>Paket Asesmen</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-2xl font-black text-teal-950">{wallet.quotaPackage}</strong>
                <span className="text-xs text-teal-800 font-medium">Sesi</span>
              </div>
              <span className="text-[10px] text-teal-700">
                Kedaluwarsa: {wallet.quotaExpiredAt ? new Date(wallet.quotaExpiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
              </span>
            </div>

            {/* Wallet 2: Single Test */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3.5 flex flex-col gap-0.5 min-w-[170px]">
              <span className="text-[11px] font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Single Test</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-2xl font-black text-indigo-950">{wallet.quotaSingle}</strong>
                <span className="text-xs text-indigo-800 font-medium">Tes</span>
              </div>
              <span className="text-[10px] text-indigo-700">
                Kedaluwarsa: {wallet.quotaExpiredAt ? new Date(wallet.quotaExpiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
              </span>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col justify-center shrink-0">
              <Button
                type="button"
                onClick={() => setConvertModal(prev => ({ ...prev, isOpen: true, error: '' }))}
                variant="outline"
                className="font-bold text-xs gap-2 border-slate-300 hover:bg-slate-50 cursor-pointer h-9 text-slate-800"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600" />
                <span>Tukar Kuota</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── BUKU MUTASI KUOTA SESI (AUDIT TRAIL UTAMA) ── */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <span>Buku Mutasi Kuota Asesmen</span>
              </h2>
              <p className="text-xs text-slate-500">
                Audit trail pencatatan resmi transaksi kuota: Top-Up, pemotongan per kandidat ujian, dan penukaran kuota.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total: <strong className="text-slate-900 font-bold">{ledgers.length}</strong> Riwayat
            </div>
          </div>

          {ledgers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              Belum ada riwayat mutasi kuota. Kuota Anda akan terpotong secara otomatis ketika peserta memulai pengerjaan ujian.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px]">
                    <TableHead className="font-bold">Waktu</TableHead>
                    <TableHead className="font-bold">Aktivitas</TableHead>
                    <TableHead className="font-bold">Sesi Ujian / Keterangan</TableHead>
                    <TableHead className="font-bold">Dompet</TableHead>
                    <TableHead className="font-bold text-right">Mutasi</TableHead>
                    <TableHead className="font-bold text-right">Saldo Akhir</TableHead>
                    <TableHead className="font-bold text-center">Rincian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {ledgers.map((l) => (
                    <TableRow key={l.id} className="hover:bg-slate-50/60">
                      <TableCell className="text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            l.transactionType === 'TOPUP'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : l.transactionType === 'USAGE'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : l.transactionType === 'CONVERT'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {l.transactionType === 'TOPUP' ? 'Top-Up Saldo' :
                           l.transactionType === 'USAGE' ? 'Sesi Ujian' :
                           l.transactionType === 'CONVERT' ? 'Tukar Kuota' : l.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-800 font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {l.testTitle || l.referenceDoc || 'Mutasi Kuota'}
                          </span>
                          {l.notes && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[280px]">
                              {l.notes}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700 text-[11px]">
                        {l.quotaType === 'PACKAGE' ? 'Paket Asesmen' : 'Single Test'}
                      </TableCell>
                      <TableCell className="text-right font-black">
                        <span className={l.amount > 0 ? 'text-emerald-700 font-black' : 'text-slate-900 font-bold'}>
                          {l.amount > 0 ? `+${l.amount}` : l.amount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {l.balanceAfter}
                      </TableCell>
                      <TableCell className="text-center">
                        {l.transactionType === 'USAGE' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setCandidateModal({ isOpen: true, ledger: l })}
                            className="h-7 px-2 text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200 gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-teal-600" />
                            <span>Lihat Peserta 👁️</span>
                          </Button>
                        )}
                        {l.transactionType !== 'USAGE' && (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    Tersedia: {wallet.quotaPackage} Paket
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
                    Tersedia: {wallet.quotaSingle} Single
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

      {/* ── MODAL DETAIL PESERTA TERKONSUMSI (CHILD MODAL) ── */}
      <Dialog open={candidateModal.isOpen} onOpenChange={(open) => !open && setCandidateModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Daftar Peserta Pemakai Kuota
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {candidateModal.ledger?.testTitle || 'Sesi Ujian'} • Kuota: {candidateModal.ledger?.quotaType === 'PACKAGE' ? 'Paket Asesmen' : 'Single Test'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-3 border border-slate-200 rounded-xl">
            {(!candidateModal.ledger?.consumedCandidates || candidateModal.ledger.consumedCandidates.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada kandidat di sesi ini yang mulai ujian (status masih pending).
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px]">
                    <TableHead className="w-10 text-center font-bold">No</TableHead>
                    <TableHead className="font-bold">Nama Kandidat</TableHead>
                    <TableHead className="font-bold">Username</TableHead>
                    <TableHead className="font-bold">Waktu Mulai</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {candidateModal.ledger.consumedCandidates.map((c, i) => (
                    <TableRow key={c.participantId} className="hover:bg-slate-50/50">
                      <TableCell className="text-center text-slate-400 font-mono text-[11px]">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {c.name}
                      </TableCell>
                      <TableCell className="font-mono text-slate-600 text-[11px]">
                        @{c.username}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500">
                        {c.startTime
                          ? new Date(c.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : 'Baru Mulai'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            c.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {c.status === 'completed' ? 'Selesai' : 'Mengerjakan'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCandidateModal(prev => ({ ...prev, isOpen: false }))}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
