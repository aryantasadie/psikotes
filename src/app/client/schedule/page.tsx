'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarPlus, 
  Coins, 
  Copy, 
  FileSpreadsheet, 
  Sparkles, 
  Loader2, 
  Users, 
  Eye, 
  Calendar, 
  AlertCircle, 
  FileCheck2, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Lock, 
  AlertTriangle,
  VideoOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Konfigurasi Subtes IST
const SUBTEST_CONFIG: Record<string, {
  name: string;
  badge: string;
  desc: string;
  subtests: { id: string; label: string; desc?: string }[];
}> = {
  IST: {
    name: 'IST (Intelligence Structure Test)',
    badge: 'IST Subtes',
    desc: 'Pilih modul subtes IST yang akan diujikan pada sesi ini:',
    subtests: [
      { id: 'IST 2', label: 'IST 2', desc: 'WA - Hubungan Kata' },
      { id: 'IST 3', label: 'IST 3', desc: 'AN - Analogi' },
      { id: 'IST 6', label: 'IST 6', desc: 'ZR - Deret Angka' },
      { id: 'IST 7', label: 'IST 7', desc: 'FA - Memilih Bentuk' },
    ],
  },
};

interface BankPsikogramItem {
  id: number;
  name: string;
  description?: string | null;
  presetName: string;
  sequence?: string[];
  grayAreasCount: number;
  grayAreas?: Array<{ id: number; parameter: string; targetScore: number }>;
}

interface ClientBatch {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  presetName?: string;
  totalParticipants: number;
  completedParticipants: number;
  participants: Array<{
    id: number;
    name: string;
    username: string;
    status: string;
    password: string;
  }>;
}

export default function ClientSchedulePage() {
  const [batteryTest, setBatteryTest] = useState<string[]>(['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
  const [bankPsikogram, setBankPsikogram] = useState<BankPsikogramItem[]>([]);
  const [totalQuota, setTotalQuota] = useState<number>(0);
  const [usedQuota, setUsedQuota] = useState<number>(0);
  const [remainingQuota, setRemainingQuota] = useState<number>(0);
  const [quotaPackage, setQuotaPackage] = useState<number>(0);
  const [quotaSingle, setQuotaSingle] = useState<number>(0);
  const [quotaExpiredAt, setQuotaExpiredAt] = useState<string | null>(null);

  // Auto-convert Dialog State (Bab 3.2 Jalur Otomatis Spesifikasi)
  const [convertPrompt, setConvertPrompt] = useState<{
    isOpen: boolean;
    message: string;
    neededSingle: number;
    neededPackage: number;
    totalSingleNeeded?: number;
    numTools?: number;
    availableSingle: number;
    availablePackage: number;
  } | null>(null);

  const [batches, setBatches] = useState<ClientBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State matching Image 5
  const [sessionName, setSessionName] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>(''); // "" = Tanpa Psikogram Jabatan (Pilih Alat Tes Mandiri)
  const [useCustomTools, setUseCustomTools] = useState(false);
  const [selectedCustomTools, setSelectedCustomTools] = useState<string[]>([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState('');
  const [disableMedia, setDisableMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Subtest IST Modal
  const [activeSubtestModal, setActiveSubtestModal] = useState<string | null>(null);

  // Result state
  const [generatedAccounts, setGeneratedAccounts] = useState<any[]>([]);

  // Detail Batch Modal
  const [selectedBatchModal, setSelectedBatchModal] = useState<ClientBatch | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/client/schedule');
      if (res.ok) {
        const d = await res.json();
        setBatteryTest(d.batteryTest || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
        const bank: BankPsikogramItem[] = d.bankPsikogram || [];
        setBankPsikogram(bank);
        setTotalQuota(d.totalQuota || 0);
        setUsedQuota(d.usedQuota || 0);
        setRemainingQuota(d.remainingQuota || 0);
        setQuotaPackage(d.quotaPackage ?? (d.remainingQuota || 0));
        setQuotaSingle(d.quotaSingle ?? 0);
        setQuotaExpiredAt(d.quotaExpiredAt || null);
        setBatches(d.batches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tool Toggle Helpers
  const toggleTool = (toolId: string) => {
    setSelectedCustomTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const istSubtests = SUBTEST_CONFIG.IST.subtests.map(s => s.id);
  const selectedIstCount = istSubtests.filter(id => selectedCustomTools.includes(id)).length;
  const isIstChecked = selectedIstCount > 0;

  const toggleIstGroup = () => {
    if (isIstChecked) {
      // Uncheck all IST
      setSelectedCustomTools(prev => prev.filter(t => !istSubtests.includes(t)));
    } else {
      // Check all IST
      setSelectedCustomTools(prev => Array.from(new Set([...prev, ...istSubtests])));
    }
  };

  const selectAllSubtests = (ids: string[]) => {
    setSelectedCustomTools(prev => Array.from(new Set([...prev, ...ids])));
  };

  const unselectAllSubtests = (ids: string[]) => {
    setSelectedCustomTools(prev => prev.filter(t => !ids.includes(t)));
  };

  // Submit Handler (Mendukung Jalur Otomatis Konversi Kuota - Bab 3.2 Spesifikasi)
  const handleGenerate = async (e?: React.FormEvent, forceAutoConvert = false) => {
    if (e) e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const n = parseInt(count, 10);
    if (!sessionName.trim()) {
      setFormError('Nama Sesi / Jabatan wajib diisi.');
      return;
    }

    const isMandiri = !selectedJobId;
    const mode = isMandiri ? 'CUSTOM_TEST' : 'PSIKOGRAM';

    if (isMandiri && selectedCustomTools.length === 0) {
      setFormError('Belum ada alat tes yang dipilih. Silakan centang minimal 1 alat tes pada pilihan di atas.');
      return;
    }

    if (!isMandiri && useCustomTools && selectedCustomTools.length === 0) {
      setFormError('Anda mengaktifkan kustomisasi alat tes manual. Silakan centang minimal 1 alat tes.');
      return;
    }

    if (!prefix.trim()) {
      setFormError('Prefix username wajib diisi.');
      return;
    }

    if (isNaN(n) || n < 1 || n > 200) {
      setFormError('Jumlah akun peserta harus berupa angka valid antara 1 sampai 200.');
      return;
    }

    if (mode === 'CUSTOM_TEST') {
      const numTools = selectedCustomTools.length;
      const totalSingleNeeded = numTools * n;

      if (quotaSingle < totalSingleNeeded) {
        setFormError(`Sisa saldo Single Test Anda (${quotaSingle}) tidak mencukupi untuk membuat sesi ${n} peserta dengan ${numTools} alat tes (Dibutuhkan: ${totalSingleNeeded} Single Test). Silakan lakukan konversi kuota di menu Kuota atau hubungi admin untuk isi ulang.`);
        return;
      }
    } else {
      if (quotaPackage < n) {
        setFormError(`Sisa Kuota Paket Asesmen Anda (${quotaPackage}) tidak mencukupi untuk membuat sesi ${n} peserta. Silakan hubungi admin untuk isi ulang kuota.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/client/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName,
          mode,
          jobPositionId: !isMandiri ? Number(selectedJobId) : null,
          selectedTools: (useCustomTools || isMandiri) ? selectedCustomTools : [],
          sessionDate,
          prefix: prefix.trim().toLowerCase(),
          count: n,
          disableMedia,
          autoConvert: forceAutoConvert,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setConvertPrompt(null);
        setGeneratedAccounts(data.accounts || []);
        setFormSuccess(data.message || 'Sesi ujian dan akun peserta berhasil dibuat!');
        setSessionName('');
        setPrefix('');
        setCount('');
        setSelectedJobId('');
        setUseCustomTools(false);
        setSelectedCustomTools([]);
        setDisableMedia(false);
        fetchData();
      } else {
        if (data.code === 'CAN_CONVERT_QUOTA') {
          // Tampilkan dialog interaktif Jalur Otomatis Penjadwalan (Bab 3.2 Spesifikasi)
          setConvertPrompt({
            isOpen: true,
            message: data.error,
            neededSingle: data.neededSingle,
            neededPackage: data.neededPackage,
            totalSingleNeeded: data.totalSingleNeeded,
            numTools: data.numTools,
            availableSingle: data.availableSingle,
            availablePackage: data.availablePackage,
          });
        } else {
          setFormError(data.error || 'Terjadi kesalahan saat memproses sesi.');
        }
      }
    } catch {
      setFormError('Gagal menghubungkan ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyNewExcel = () => {
    const header = 'No\tUsername\tPassword\n';
    const rows = generatedAccounts.map((acc, i) => `${i + 1}\t${acc.username}\t${acc.password}`).join('\n');
    navigator.clipboard.writeText(header + rows);
    alert('Berhasil menyalin format tabel Excel ke clipboard!');
  };

  const handleCopyNewFormatted = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = generatedAccounts.map((acc) => 
      `Nama: ${acc.name}\nUsername: ${acc.username}\nPassword: ${acc.password}\nLink Portal Ujian: ${origin}`
    ).join('\n\n------------------------------\n\n');
    navigator.clipboard.writeText(text);
    alert('Berhasil menyalin format broadcast pesan untuk kandidat!');
  };

  const handleCopyBatchExcel = (batch: ClientBatch) => {
    const header = 'No\tNama\tUsername\tPassword\tStatus\n';
    const rows = batch.participants.map((acc, i) => 
      `${i + 1}\t${acc.name}\t${acc.username}\t${acc.password}\t${acc.status}`
    ).join('\n');
    navigator.clipboard.writeText(header + rows);
    alert(`Berhasil menyalin kredensial ${batch.participants.length} akun ke Excel!`);
  };

  const handleCopyBatchFormatted = (batch: ClientBatch) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = batch.participants.map((acc) => 
      `Nama: ${acc.name}\nUsername: ${acc.username}\nPassword: ${acc.password}\nLink Portal Ujian: ${origin}`
    ).join('\n\n------------------------------\n\n');
    navigator.clipboard.writeText(text);
    alert(`Berhasil menyalin format pesan untuk ${batch.participants.length} kandidat!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span>Memuat data penjadwalan & formasi...</span>
      </div>
    );
  }

  const selectedJobObj = bankPsikogram.find(j => String(j.id) === selectedJobId);

  return (
    <div className="flex flex-col gap-6">
      {/* ── 3 INFO CARDS: Sisa Kuota, Formasi Terdaftar, Battery Test ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo Kuota Kandidat (Dual-Wallet B2B) */}
        <Card className="border-teal-200 bg-teal-50/40">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-teal-700" />
                <span>Sisa Kuota Kandidat</span>
              </span>
              <Badge variant="outline" className="text-[10px] bg-teal-100 text-teal-800 border-teal-300 font-bold">
                {quotaExpiredAt ? `s/d ${new Date(quotaExpiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Aktif'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-white/80 p-2 rounded-lg border border-teal-100">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">Paket Asesmen</span>
                <span className="text-xl font-black text-teal-950">{quotaPackage} <span className="text-xs font-normal text-teal-700">Sesi</span></span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-teal-100">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">Single Test</span>
                <span className="text-xl font-black text-teal-950">{quotaSingle} <span className="text-xs font-normal text-teal-700">Tes</span></span>
              </div>
            </div>
            <span className="text-[10px] text-teal-700">
              1 Paket = 1 Sesi Jabatan (Bisa ditukar jadi 3 Single Test). Anti-Ghosting.
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Bank Psikogram Formasi */}
        <Card className="border-slate-200 bg-slate-50/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Bank Psikogram Jabatan</span>
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-slate-700 border-slate-300 font-bold">
                {bankPsikogram.length} Formasi
              </Badge>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {bankPsikogram.length} Standar Formasi Tersedia
            </p>
            <span className="text-[10px] text-slate-500">
              Target Gray Area otomatis diaplikasikan bila memilih formasi jabatan.
            </span>
          </CardContent>
        </Card>

        {/* Card 3: Status Baterai Tes */}
        <Card className="border-slate-200 bg-slate-50/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Baterai Tes Standar</span>
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-slate-700 border-slate-300 font-bold">
                {batteryTest.length} Alat Tes
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {batteryTest.map((t, idx) => (
                <span key={t} className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs">
                  {idx + 1}. {t}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── GRID FORM (MATCHING IMAGE 5) & RESULT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form Card matching Image 5 */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Buat Sesi & Akun Peserta
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Isi data sesi, psikogram jabatan / modul tes, tanggal, dan tester penanggung jawab
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5">
            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg font-semibold text-center">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              {/* 1. Nama Sesi / Jabatan * */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Nama Sesi / Jabatan <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Staff Admin / Tes Mandiri WPT / Batch 1"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              {/* 2. Psikogram Jabatan (Opsional jika tes mandiri) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    Psikogram Jabatan <span className="text-slate-400 font-normal">(Opsional jika tes mandiri)</span>
                  </label>
                  {selectedJobId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJobId('');
                        setUseCustomTools(false);
                        setSelectedCustomTools([]);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold underline cursor-pointer"
                    >
                      Batal pilih psikogram
                    </button>
                  )}
                </div>
                <select
                  value={selectedJobId}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedJobId(val);
                    if (val) {
                      const found = bankPsikogram.find(j => String(j.id) === val);
                      if (found && (!sessionName.trim() || bankPsikogram.some(j => j.name === sessionName.trim()))) {
                        setSessionName(found.name);
                      }
                    }
                    setUseCustomTools(false);
                    setSelectedCustomTools([]);
                    if (formError) setFormError('');
                  }}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">— Tanpa Psikogram Jabatan (Pilih Alat Tes Mandiri) —</option>
                  {bankPsikogram.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.name}
                    </option>
                  ))}
                </select>

                {/* Helper / Status Note Matching Image 5 */}
                {!selectedJobId ? (
                  <span className="text-xs text-teal-700 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>💡</span>
                    <span>Mode Tes Mandiri aktif: Anda dapat memilih alat tes secara mandiri di bawah.</span>
                  </span>
                ) : (
                  <span className="text-xs text-teal-700 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>💡</span>
                    <span>Formasi terpilih: Menggunakan standar baterai tes dan acuan Gray Area dari {selectedJobObj?.name}.</span>
                  </span>
                )}
              </div>

              {/* 3. Pilihan Alat Tes */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {selectedJobId ? (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useCustomTools}
                      onChange={e => {
                        setUseCustomTools(e.target.checked);
                        if (!e.target.checked) setSelectedCustomTools([]);
                      }}
                      className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">Pilih alat tes manual (kustomisasi template)</span>
                  </label>
                ) : (
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Pilih Alat Tes yang Diujikan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">Pilih minimal 1 alat tes</span>
                  </div>
                )}

                {(useCustomTools || !selectedJobId) && (
                  <>
                    {/* Checkbox Grid 3 Kolom Matching Image 5 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Row 1, Col 1: WPT */}
                      <div
                        onClick={() => toggleTool('WPT')}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          selectedCustomTools.includes('WPT')
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedCustomTools.includes('WPT')}
                            readOnly
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs">WPT</span>
                        </div>
                      </div>

                      {/* Row 1, Col 2: IST with Pilih ▾ */}
                      <div
                        onClick={toggleIstGroup}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          isIstChecked
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isIstChecked}
                            readOnly
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs">IST</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubtestModal('IST');
                          }}
                          className="text-[11px] text-slate-500 hover:text-teal-700 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/50 flex items-center gap-0.5"
                        >
                          <span>{selectedIstCount > 0 ? `${selectedIstCount} Subtes` : 'Pilih'}</span>
                          <span className="text-[9px]">▾</span>
                        </button>
                      </div>

                      {/* Row 1, Col 3: PAPI KOSTICK */}
                      <div
                        onClick={() => toggleTool('PAPI KOSTICK')}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          selectedCustomTools.includes('PAPI KOSTICK')
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedCustomTools.includes('PAPI KOSTICK')}
                            readOnly
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs">PAPI KOSTICK</span>
                        </div>
                      </div>

                      {/* Row 2, Col 1: DISC */}
                      <div
                        onClick={() => toggleTool('DISC')}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          selectedCustomTools.includes('DISC')
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedCustomTools.includes('DISC')}
                            readOnly
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs">DISC</span>
                        </div>
                      </div>

                      {/* Row 2, Col 2: MSDT */}
                      <div
                        onClick={() => toggleTool('MSDT')}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          selectedCustomTools.includes('MSDT')
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedCustomTools.includes('MSDT')}
                            readOnly
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs">MSDT</span>
                        </div>
                      </div>

                      {/* Row 2, Col 3: Kraepelin */}
                      <div
                        onClick={() => toggleTool('Kraepelin')}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          selectedCustomTools.includes('Kraepelin')
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedCustomTools.includes('Kraepelin')}
                            readOnly
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs">Kraepelin</span>
                        </div>
                      </div>
                    </div>

                    {/* Validation message if no tools selected matching Image 5 */}
                    {selectedCustomTools.length === 0 && (
                      <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-2">
                        <span>⚠️</span>
                        <span>Belum ada alat tes yang dipilih. Silakan centang minimal 1 alat tes.</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 4. Tanggal Ujian * */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Tanggal Ujian <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              {/* 5. Prefix Username * & Jumlah Akun * (2 Columns matching Image 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Prefix Username <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: mandiri"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                    required
                    className="h-10 text-xs"
                  />
                  <span className="text-[11px] text-slate-400">
                    Format: {prefix ? `${prefix}_001` : 'mandiri_001'}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Jumlah Akun <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="Max 200"
                    value={count}
                    onChange={e => {
                      setCount(e.target.value);
                      if (formError) setFormError('');
                    }}
                    required
                    className={`h-10 text-xs transition-colors ${
                      (() => {
                        const countNum = parseInt(count, 10);
                        if (isNaN(countNum) || countNum <= 0) return '';
                        if (!selectedJobId) {
                          const totalNeeded = selectedCustomTools.length * countNum;
                          return totalNeeded > quotaSingle ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-50/20' : '';
                        }
                        return countNum > quotaPackage ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-50/20' : '';
                      })()
                    }`}
                  />
                  {(() => {
                    const countNum = parseInt(count, 10);
                    const isMandiri = !selectedJobId;

                    if (isMandiri) {
                      const numTools = selectedCustomTools.length;
                      const hasCount = !isNaN(countNum) && countNum > 0;
                      const totalSingleNeeded = numTools * (hasCount ? countNum : 0);

                      if (numTools === 0) {
                        return (
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                            <span>Pilih minimal 1 modul alat tes di atas untuk menghitung kuota.</span>
                          </span>
                        );
                      }

                      if (!hasCount) {
                        return (
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            Perhitungan: {numTools} alat tes × jumlah peserta = total Single Test.
                          </span>
                        );
                      }

                      if (totalSingleNeeded > quotaSingle) {
                        const canConvert = quotaPackage > 0;
                        return (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col gap-1 mt-1 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-rose-800 text-[11px] flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                <span>Kuota Single Kurang ({quotaSingle}/{totalSingleNeeded} Tes)</span>
                              </span>
                              {canConvert && (
                                <Link
                                  href="/client/quota"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shrink-0"
                                >
                                  <span>Konversi Kuota</span>
                                  <span className="text-[9px]">→</span>
                                </Link>
                              )}
                            </div>
                            <p className="text-[10px] text-rose-700 leading-tight">
                              Silakan lakukan konversi kuota atau hubungi admin untuk isi ulang. Pembuatan akun diblokir.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between mt-0.5">
                          <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Kebutuhan: {numTools} alat tes × {countNum} peserta = <b>{totalSingleNeeded} Single Test</b></span>
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Saldo Cukup ({quotaSingle} tes)
                          </span>
                        </div>
                      );
                    }

                    // Mode Paket Asesmen
                    if (isNaN(countNum) || countNum <= 0) return null;
                    if (countNum > quotaPackage) {
                      return (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col gap-1 mt-1 animate-in fade-in duration-200">
                          <span className="font-bold text-rose-800 text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>Kuota Paket Kurang ({quotaPackage}/{countNum} Sesi)</span>
                          </span>
                          <p className="text-[10px] text-rose-700 leading-tight">
                            Silakan hubungi admin untuk isi ulang kuota. Pembuatan akun diblokir.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* 6. Checklist Matikan Kamera & Share Screen (Mode Ringan) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disableMedia}
                    onChange={e => setDisableMedia(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded accent-teal-600 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">
                      Matikan Kamera & Share Screen (Mode Ringan)
                    </span>
                    <span className="text-xs text-slate-500 leading-normal">
                      Default: Pengawasan kamera aktif. Centang opsi ini jika Anda ingin menonaktifkan kamera & rekam layar peserta agar ujian lebih hemat kuota dan server ringan.
                    </span>
                  </div>
                </label>
                {disableMedia && (
                  <Badge variant="outline" className="w-fit bg-amber-50 text-amber-800 border-amber-200 gap-1 text-xs">
                    <VideoOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mode Ringan Aktif: Peserta tidak diminta izin webcam / kamera pengawas</span>
                  </Badge>
                )}
              </div>

              {/* Alert kecil di atas tombol jika ada syarat belum lengkap */}
              {((!selectedJobId && selectedCustomTools.length === 0) || (Boolean(selectedJobId) && useCustomTools && selectedCustomTools.length === 0)) && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Pilih minimal 1 modul alat tes pada bagian "Pilih Alat Tes yang Diujikan" di atas.</span>
                </div>
              )}

              {/* Alert Blokir jika kuota tidak mencukupi */}
              {(() => {
                const countNum = parseInt(count, 10);
                if (isNaN(countNum) || countNum <= 0) return null;
                const isMandiri = !selectedJobId;
                const isBlocked = isMandiri
                  ? (selectedCustomTools.length > 0 && selectedCustomTools.length * countNum > quotaSingle)
                  : (countNum > quotaPackage);

                if (!isBlocked) return null;

                return (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pembuatan akun diblokir karena kuota tidak mencukupi. Silakan konversi kuota atau hubungi admin.</span>
                  </div>
                );
              })()}

              {/* Submit Button */}
              {(() => {
                const countNum = parseInt(count, 10);
                const isMandiri = !selectedJobId;
                const hasValidCount = !isNaN(countNum) && countNum > 0;
                let isBlocked = false;

                if (isMandiri) {
                  const totalNeeded = selectedCustomTools.length * (hasValidCount ? countNum : 0);
                  // BLOCK jika alat tes belum dipilih ATAU jika saldo Single Test kurang!
                  if (selectedCustomTools.length === 0 || (hasValidCount && totalNeeded > quotaSingle)) {
                    isBlocked = true;
                  }
                } else {
                  if (useCustomTools && selectedCustomTools.length === 0) {
                    isBlocked = true;
                  }
                  // BLOCK jika kuota paket kurang!
                  if (hasValidCount && countNum > quotaPackage) {
                    isBlocked = true;
                  }
                }

                return (
                  <Button
                    type="submit"
                    disabled={submitting || isBlocked}
                    className="w-full mt-2 gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 shadow-xs cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Sesi & Akun...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Buat Sesi & Generate Akun</span>
                      </>
                    )}
                  </Button>
                );
              })()}
            </form>
          </CardContent>
        </Card>

        {/* Right Result Card */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Hasil Generate Kredensial Akun
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {generatedAccounts.length > 0 
                    ? `${generatedAccounts.length} akun siap dibagikan kepada kandidat`
                    : 'Akun yang baru digenerate akan tampil di sini'}
                </CardDescription>
              </div>

              {generatedAccounts.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyNewExcel} className="h-8 text-xs gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copy Excel</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopyNewFormatted} className="h-8 text-xs gap-1">
                    <Copy className="w-3.5 h-3.5 text-teal-600" />
                    <span>Copy WA</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {generatedAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-2">
                <Users className="w-10 h-10 text-slate-300 stroke-1" />
                <p className="text-xs font-medium">Belum ada akun yang baru digenerate pada formulir ini.</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Isi nama sesi, tentukan alat tes atau psikogram jabatan, lalu klik tombol generate untuk membuat username dan password ujian secara instan.
                </p>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Nama</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Username</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedAccounts.map((acc, index) => (
                      <TableRow key={acc.id} className="hover:bg-slate-50/70">
                        <TableCell className="text-xs text-slate-400 font-mono">{index + 1}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{acc.name}</TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                            {acc.username}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            {acc.password}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table: Batches List */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">
            Riwayat Sesi Ujian & Rekap Kredensial Batch
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Daftar sesi ujian yang telah dibuat oleh perusahaan Anda. Klik &quot;Lihat Akun&quot; untuk menyalin kredensial peserta.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-bold uppercase text-slate-500 w-12">No</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Sesi</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Formasi / Tipe Ujian</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Tanggal</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">Peserta Selesai</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    Belum ada riwayat sesi ujian yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch, index) => (
                  <TableRow key={batch.id} className="hover:bg-slate-50/70">
                    <TableCell className="text-xs text-slate-400">{index + 1}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-900">{batch.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[11px] font-semibold ${
                          batch.jobPositionName.includes('Bebas')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {batch.jobPositionName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {batch.startDate ? new Date(batch.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      <span className="text-emerald-700">{batch.completedParticipants}</span>
                      <span className="text-slate-400"> / {batch.totalParticipants}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBatchModal(batch)}
                        className="h-7 text-xs gap-1 border-teal-200 text-teal-700 hover:bg-teal-50"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Lihat Akun</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal Pemilihan Subtes IST ── */}
      <Dialog open={!!activeSubtestModal} onOpenChange={(open) => !open && setActiveSubtestModal(null)}>
        {activeSubtestModal && SUBTEST_CONFIG[activeSubtestModal] && (
          <DialogContent className="max-w-md p-6">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-base font-bold text-slate-900">
                  Pilih Subtes {activeSubtestModal}
                </DialogTitle>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  {SUBTEST_CONFIG[activeSubtestModal].subtests.filter(s => selectedCustomTools.includes(s.id)).length} Terpilih
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {SUBTEST_CONFIG[activeSubtestModal].desc}
              </p>
            </DialogHeader>

            <div className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUBTEST_CONFIG[activeSubtestModal].subtests.map((subtest) => {
                  const isChecked = selectedCustomTools.includes(subtest.id);
                  return (
                    <label
                      key={subtest.id}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all text-xs select-none ${
                        isChecked
                          ? 'bg-teal-50 border-teal-400 text-teal-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTool(subtest.id)}
                        className="w-4 h-4 rounded accent-teal-600 cursor-pointer shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{subtest.label}</span>
                        {subtest.desc && (
                          <span className="text-[10px] text-slate-400 font-normal truncate">{subtest.desc}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectAllSubtests(SUBTEST_CONFIG[activeSubtestModal].subtests.map(s => s.id))}
                  className="text-xs h-8"
                >
                  Pilih Semua
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => unselectAllSubtests(SUBTEST_CONFIG[activeSubtestModal].subtests.map(s => s.id))}
                  className="text-xs h-8 text-slate-500 hover:text-rose-600"
                >
                  Kosongkan
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveSubtestModal(null)}
                className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white px-4 font-semibold"
              >
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal Detail Akun Batch */}
      <Dialog open={!!selectedBatchModal} onOpenChange={(open) => !open && setSelectedBatchModal(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Daftar Akun: {selectedBatchModal?.title}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total {selectedBatchModal?.participants.length} akun peserta pada sesi ini.
                </p>
              </div>
              {selectedBatchModal && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopyBatchExcel(selectedBatchModal)} className="h-8 text-xs gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copy Excel</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCopyBatchFormatted(selectedBatchModal)} className="h-8 text-xs gap-1">
                    <Copy className="w-3.5 h-3.5 text-teal-600" />
                    <span>Copy WA</span>
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10 text-xs font-bold uppercase text-slate-500">No</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Nama</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Username</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Password</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBatchModal?.participants.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-slate-400 font-mono">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">{p.name}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-slate-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                        {p.username}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {p.password}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${
                          p.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                            : p.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Konfirmasi Auto-Convert Kuota (Bab 3.2 Spesifikasi) ── */}
      <Dialog open={Boolean(convertPrompt?.isOpen)} onOpenChange={(open) => !open && setConvertPrompt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Tukar Kuota & Lanjutkan Penjadwalan?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Kuota Single Test tidak mencukupi untuk jumlah peserta yang diminta.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-teal-950 flex flex-col gap-2">
              <p className="font-semibold text-xs leading-relaxed">
                {convertPrompt?.message}
              </p>
              <div className="border-t border-teal-200/80 pt-2 flex flex-col gap-1 text-[11px] text-teal-900">
                {convertPrompt?.totalSingleNeeded ? (
                  <div className="flex justify-between">
                    <span>Total Kebutuhan Kuota:</span>
                    <strong>{convertPrompt.totalSingleNeeded} Single Test ({convertPrompt.numTools} alat tes × peserta)</strong>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>Sisa Saldo Single Test Saat Ini:</span>
                  <strong>{convertPrompt?.availableSingle} Tes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Saldo Paket Asesmen:</span>
                  <strong>{convertPrompt?.availablePackage} Sesi</strong>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold border-t border-teal-200/60 pt-1">
                  <span>Akan Ditukar:</span>
                  <span>{convertPrompt?.neededPackage} Paket → {Number(convertPrompt?.neededPackage || 0) * 3} Single Test</span>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              Dengan melanjutkan, sistem akan langsung mencatat transaksi pertukaran di Buku Besar Kuota dan menerbitkan akun ujian peserta.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConvertPrompt(null)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleGenerate(undefined, true)}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Memproses...' : 'Tukar & Buat Jadwal'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
