'use client';

import { useState, useEffect } from 'react';
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
  Package,
  FileCheck2,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sliders,
  Briefcase,
  Lock,
  LockKeyhole,
  AlertTriangle
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
} from '@/components/ui/dialog';

// Daftar alat tes yang dapat dipilih bebas pada Mode Mandiri (Tanpa Psikogram)
const AVAILABLE_RAW_TESTS = [
  { id: 'WPT', name: 'WPT', desc: 'Tes Inteligensi Cepat (12 Menit)' },
  { id: 'CFIT', name: 'CFIT', desc: 'Tes Inteligensi Non-Verbal' },
  { id: 'TIKI', name: 'TIKI', desc: 'Tes Inteligensi Kolektif' },
  { id: 'IST', name: 'IST', desc: 'Struktur Inteligensi & Daya Analisa' },
  { id: 'DISC', name: 'DISC', desc: 'Gaya Kepribadian & Pola Kerja' },
  { id: 'PAPI KOSTICK', name: 'PAPI KOSTICK', desc: 'Dinamika Sikap & Motivasi' },
  { id: 'MSDT', name: 'MSDT', desc: 'Gaya Kepemimpinan Manajerial' },
  { id: 'Kraepelin', name: 'Kraepelin', desc: 'Ketahanan, Kecepatan & Ketelitian' },
  { id: 'Wartegg', name: 'Wartegg', desc: 'Eksplorasi Kepribadian Proyektif' },
];

interface BankPsikogramItem {
  id: number;
  name: string;
  description?: string | null;
  presetName: string;
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
  const [batches, setBatches] = useState<ClientBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [sessionName, setSessionName] = useState('');
  const [mode, setMode] = useState<'PSIKOGRAM' | 'CUSTOM_TEST'>('PSIKOGRAM');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCustomTools, setSelectedCustomTools] = useState<string[]>(['WPT', 'Kraepelin']);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Result state
  const [generatedAccounts, setGeneratedAccounts] = useState<any[]>([]);

  // Detail Modal
  const [selectedBatchModal, setSelectedBatchModal] = useState<ClientBatch | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
        setBatches(d.batches || []);

        if (bank.length > 0 && !selectedJobId) {
          // Cari Standar Umum atau pilih yang pertama
          const generalJob = bank.find(j => j.id === 9 || j.name.toLowerCase().includes('standar umum')) || bank[0];
          setSelectedJobId(String(generalJob.id));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomTool = (toolId: string) => {
    setSelectedCustomTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const n = parseInt(count, 10);
    if (!prefix.trim() || isNaN(n) || n < 1 || n > 200) {
      setFormError('Prefix dan jumlah peserta harus valid (1 - 200).');
      return;
    }

    if (remainingQuota < n) {
      setFormError(`Sisa kuota akun Anda tersisa ${remainingQuota} kandidat. Permintaan: ${n} kandidat. Silakan hubungi Superadmin HR Publik.`);
      return;
    }

    if (mode === 'PSIKOGRAM' && !selectedJobId) {
      setFormError('Pilih formasi jabatan dari Bank Psikogram Anda.');
      return;
    }

    if (mode === 'CUSTOM_TEST' && selectedCustomTools.length === 0) {
      setFormError('Pilih minimal satu alat tes untuk mode tes mandiri.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/client/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName,
          mode,
          jobPositionId: mode === 'PSIKOGRAM' ? Number(selectedJobId) : null,
          selectedTools: mode === 'CUSTOM_TEST' ? selectedCustomTools : batteryTest,
          sessionDate,
          prefix: prefix.trim().toLowerCase(),
          count: n,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedAccounts(data.accounts || []);
        setFormSuccess(data.message || 'Sesi ujian berhasil dibuat!');
        fetchData();
      } else {
        setFormError(data.error || 'Terjadi kesalahan saat memproses sesi.');
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
        <span>Memuat data konfigurasi akun perusahaan...</span>
      </div>
    );
  }

  const selectedJobObj = bankPsikogram.find(j => String(j.id) === selectedJobId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-teal-600" />
          <span>Buat Sesi Ujian & Generate Akun Kandidat</span>
        </h2>
        <p className="text-sm text-slate-500">
          Jadwalkan asesmen menggunakan <strong>Battery Test resmi & Bank Psikogram</strong> perusahaan Anda, atau buat sesi tes mandiri bebas.
        </p>
      </div>

      {/* ── 3 INFO CARDS: BATTERY TEST (LOCKED), BANK PSIKOGRAM, SALDO KUOTA ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Battery Test Resmi (Locked) */}
        <Card className="border-teal-200 bg-teal-50/40">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-700" />
                <span>Battery Test Resmi (Fix)</span>
              </span>
              <Badge variant="outline" className="text-[10px] bg-teal-100 text-teal-800 border-teal-300 font-bold">
                Terkunci
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {batteryTest.map((t, idx) => (
                <span key={t} className="bg-white border border-teal-200 text-teal-950 px-2 py-0.5 rounded text-[11px] font-bold shadow-2xs">
                  {idx + 1}. {t}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-teal-700 mt-0.5">
              Standar rangkaian tes resmi yang di-assign oleh HR Publik untuk perusahaan Anda.
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Bank Psikogram */}
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
            <p className="text-xs font-bold text-slate-900 mt-1">
              {bankPsikogram.length} Formasi Jabatan Terdaftar
            </p>
            <span className="text-[10px] text-slate-500">
              Lengkap dengan target grey area kompetensi per jabatan & Standar Umum (Cukup Semua).
            </span>
          </CardContent>
        </Card>

        {/* Card 3: Saldo Kuota Kandidat */}
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                <span>Sisa Kuota Kandidat</span>
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-bold">
                Aktif
              </Badge>
            </div>
            <h3 className="text-xl font-black text-amber-950 mt-1">
              {remainingQuota} <span className="text-xs font-normal text-amber-800">/ {totalQuota} Kandidat</span>
            </h3>
            <span className="text-[10px] text-amber-700">
              {usedQuota} kuota telah terpakai. 1 Kuota = 1 Peserta Tuntas (Anti-Ghosting).
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Form & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form Card */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Formulir Penjadwalan Sesi Ujian
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Tentukan jenis pelaksanaan ujian dan buat akun login untuk kandidat
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
              {/* Nama Sesi / Batch */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nama Sesi Ujian / Batch Lowongan <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Rekrutmen Staff HR - Gelombang 1"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  required
                />
              </div>

              {/* ── PILIHAN MODE PELAKSANAAN SESUAI DIAGRAM ── */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800">
                  Pilih Mode Pelaksanaan Ujian <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Opsi 1: Asesmen Jabatan (Dengan Lembar Psikogram) */}
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-1.5 ${
                      mode === 'PSIKOGRAM'
                        ? 'bg-teal-50/70 border-teal-500 shadow-xs ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scheduleMode"
                        value="PSIKOGRAM"
                        checked={mode === 'PSIKOGRAM'}
                        onChange={() => setMode('PSIKOGRAM')}
                        className="accent-teal-600 cursor-pointer"
                      />
                      <span className="font-bold text-slate-900 text-xs">Asesmen Jabatan</span>
                    </div>
                    <span className="text-[11px] text-teal-800 font-semibold pl-5">
                      ✓ Termasuk Lembar Psikogram Jabatan
                    </span>
                    <span className="text-[10px] text-slate-500 pl-5 leading-tight">
                      Menggunakan Battery Test resmi perusahaan & dicocokkan dengan target grey area jabatan.
                    </span>
                  </label>

                  {/* Opsi 2: Pilih Tes Bebas (Tanpa Lembar Psikogram) */}
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-1.5 ${
                      mode === 'CUSTOM_TEST'
                        ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-1 ring-amber-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scheduleMode"
                        value="CUSTOM_TEST"
                        checked={mode === 'CUSTOM_TEST'}
                        onChange={() => setMode('CUSTOM_TEST')}
                        className="accent-amber-600 cursor-pointer"
                      />
                      <span className="font-bold text-slate-900 text-xs">Pilih Tes Bebas</span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-semibold pl-5">
                      ⚠️ Tanpa Lembar Psikogram
                    </span>
                    <span className="text-[10px] text-slate-500 pl-5 leading-tight">
                      Bebas memilih alat tes apa saja. Hasil ujian berupa rekap nilai skor per alat tes.
                    </span>
                  </label>
                </div>
              </div>

              {/* ── KONTEN DINAMIS SESUAI MODE YANG DIPILIH ── */}
              {mode === 'PSIKOGRAM' ? (
                /* Sub-Pilihan Mode 1: Pilih Jabatan dari Bank Psikogram */
                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
                      <span>Pilih Formasi Jabatan dari Bank Psikogram Anda <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[10px] text-teal-700 font-bold">Grey Area Otomatis Aktif</span>
                  </div>

                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(e.target.value)}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Formasi Jabatan --</option>
                    {bankPsikogram.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.name} (Preset: {job.presetName} - {job.grayAreasCount} Aspek Standar)
                      </option>
                    ))}
                  </select>

                  {/* Info Terkunci Battery Test */}
                  <div className="bg-white p-2.5 rounded-lg border border-teal-200/90 text-xs flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                      <Lock className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>Battery Test Terkunci Otomatis:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {batteryTest.map((t, idx) => (
                        <span key={t} className="bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {idx + 1}. {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-emerald-800 font-medium mt-1">
                      📋 Hasil ujian kandidat otomatis dikomputasi ke Lembar Psikogram: <strong>{selectedJobObj?.presetName || 'Standar HR Publik'}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                /* Sub-Pilihan Mode 2: Bebas Pilih Alat Tes (Tanpa Psikogram) */
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-700" />
                      <span>Pilih Alat Tes yang Mau Diujikan <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[10px] text-amber-800 font-bold">{selectedCustomTools.length} Tes Terpilih</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {AVAILABLE_RAW_TESTS.map(t => {
                      const isChecked = selectedCustomTools.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-white border-amber-400 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-400'
                              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCustomTool(t.id)}
                            className="w-4 h-4 rounded accent-amber-600 mt-0.5 cursor-pointer shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{t.name}</span>
                            <span className="text-[10px] text-slate-500 leading-tight">{t.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="p-2 rounded bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Perhatian:</strong> Sesuai ketentuan, sesi dengan pemilihan tes mandiri bebas ini hanya menghasilkan skor nilai per alat tes, dan <strong>tidak menghasilkan lembar psikogram kelayakan jabatan</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Tanggal & Prefix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal Pelaksanaan</label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Prefix Username <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: hrp"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Akun: {prefix || '...'}_001, {prefix || '...'}_002, dst.
                  </span>
                </div>
              </div>

              {/* Jumlah Peserta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Jumlah Kandidat yang Diuji <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="Contoh: 25"
                    value={count}
                    onChange={e => setCount(e.target.value)}
                    required
                  />
                  <span className="text-xs text-slate-500 shrink-0 font-medium">Orang</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || remainingQuota <= 0}
                className="w-full mt-2 gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Sesi & Akun...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Akun Ujian Kandidat</span>
                  </>
                )}
              </Button>
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
                    <span>Copy Format WA</span>
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
                  Pilih mode ujian dan tentukan jumlah peserta di sebelah kiri, lalu klik tombol generate untuk membuat username dan password ujian secara instan.
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

      {/* History Batches Table */}
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
    </div>
  );
}
