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
  AlertCircle
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

interface ClientBatch {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
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
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [usedQuotas, setUsedQuotas] = useState<Record<string, number>>({});
  const [batches, setBatches] = useState<ClientBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [sessionName, setSessionName] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
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
        setQuotas(d.quotas || {});
        setUsedQuotas(d.usedQuotas || {});
        setBatches(d.batches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]
    );
  };

  // Calculate available tools (quota > 0)
  const availableToolsList = Object.entries(quotas).map(([testName, total]) => {
    const used = usedQuotas[testName] || 0;
    const remaining = Math.max(0, total - used);
    return { testName, total, used, remaining };
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (selectedTools.length === 0) {
      setFormError('Pilih minimal satu alat tes yang akan diujikan.');
      return;
    }

    const n = parseInt(count, 10);
    if (!prefix.trim() || isNaN(n) || n < 1 || n > 200) {
      setFormError('Prefix dan jumlah peserta harus valid (1 - 200).');
      return;
    }

    // Check quota
    for (const tool of selectedTools) {
      const toolTotal = quotas[tool] || 0;
      const toolUsed = usedQuotas[tool] || 0;
      const rem = toolTotal - toolUsed;
      if (rem < n) {
        setFormError(`Sisa kuota untuk tes ${tool} hanya tersisa ${rem}. Tidak mencukupi untuk ${n} kandidat.`);
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
          selectedTools,
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
        <span>Memuat data penjadwalan mandiri...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Buat Sesi Ujian & Generate Akun Kandidat
        </h2>
        <p className="text-sm text-slate-500">
          Gunakan kuota alat tes Anda untuk membuat token login ujian bagi kandidat rekrutmen.
        </p>
      </div>

      {/* Grid: Form & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Formulir Sesi Asesmen Mandiri
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Tentukan modul tes yang diujikan dan jumlah kandidat yang mengikuti
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
              {/* Nama Sesi / Posisi */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nama Sesi / Posisi Lowongan <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Staff Keuangan / Batch 1 MT 2026"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  required
                />
              </div>

              {/* Pilihan Alat Tes */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pilih Alat Tes (Sesuai Kuota Anda)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Pilih minimal 1 tes</span>
                </div>

                {availableToolsList.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                    Anda belum memiliki alokasi kuota alat tes aktif. Hubungi admin HR Publik untuk pengisian kuota.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableToolsList.map(({ testName, remaining }) => {
                      const isSelected = selectedTools.includes(testName);
                      const isOutOfQuota = remaining <= 0;

                      return (
                        <label
                          key={testName}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isOutOfQuota
                              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              disabled={isOutOfQuota}
                              checked={isSelected}
                              onChange={() => toggleTool(testName)}
                              className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                            />
                            <span className="truncate">{testName}</span>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${remaining > 0 ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-400'}`}>
                            Sisa: {remaining}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tanggal & Prefix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal Ujian</label>
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
                    placeholder="Contoh: bni"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Format: {prefix ? `${prefix}_001` : 'bni_001'}
                  </span>
                </div>
              </div>

              {/* Jumlah Peserta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Jumlah Kandidat <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  placeholder="Contoh: 25"
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  required
                />
                <span className="text-[10px] text-slate-400">
                  Jumlah akun kandidat yang akan digenerate dan memotong saldo kuota
                </span>
              </div>

              <Button
                type="submit"
                disabled={submitting || availableToolsList.length === 0}
                className="w-full gap-2 mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{submitting ? 'Memproses Akun…' : 'Generate Akun Kandidat'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Result Card */}
        <Card className="flex flex-col">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base font-bold text-slate-900">
                  Hasil Akun Baru
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kredensial login kandidat siap dibagikan
                </CardDescription>
              </div>

              {generatedAccounts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleCopyNewFormatted}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Format Pesan</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyNewExcel}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Salin Excel</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col justify-center">
            {generatedAccounts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada akun baru yang digenerate. Isi formulir di sebelah kiri untuk membuat akun ujian kandidat.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Kandidat</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Username</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedAccounts.map((acc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs text-slate-400 font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">{acc.name}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-900">{acc.username}</TableCell>
                        <TableCell>
                          <code className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
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

      {/* SECTION: RIWAYAT BATCH KLIEN */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">
            Daftar Sesi Ujian yang Dibuat
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Seluruh batch asesmen perusahaan Anda beserta kredensial akun peserta
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Sesi & Tanggal</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Posisi / Kategori</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Jumlah Kandidat</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status Pengerjaan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    Belum ada sesi ujian yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map(batch => (
                  <TableRow key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-900">{batch.title}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-slate-700">
                      {batch.jobPositionName}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-slate-900">
                      {batch.totalParticipants} Akun
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                        {batch.completedParticipants} / {batch.totalParticipants} Selesai
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedBatchModal(batch)}
                        className="h-8 px-2.5 text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Kredensial Akun</span>
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
        {selectedBatchModal && (
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-5 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {selectedBatchModal.title}
                  </DialogTitle>
                  <p className="text-xs text-slate-500">
                    Total: {selectedBatchModal.totalParticipants} Kandidat · Selesai: {selectedBatchModal.completedParticipants}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCopyBatchFormatted(selectedBatchModal)}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Format Pesan</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyBatchExcel(selectedBatchModal)}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Salin Excel</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Kandidat</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Username</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Password</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBatchModal.participants.map((acc, idx) => (
                      <TableRow key={acc.id}>
                        <TableCell className="text-xs text-slate-400 font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-900">{acc.name}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-900">{acc.username}</TableCell>
                        <TableCell>
                          <code className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                            {acc.password}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={acc.status === 'completed' ? 'success' : 'secondary'} className="text-xs">
                            {acc.status === 'completed' ? 'Selesai' : 'Belum'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
