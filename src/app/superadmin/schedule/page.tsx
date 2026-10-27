'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Pencil, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Eye, 
  Video, 
  VideoOff, 
  Layers, 
  Loader2, 
  Building2, 
  Users, 
  FileSpreadsheet, 
  Sparkles,
  CheckCircle2,
  Clock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

interface BatchAccount {
  id: number;
  userId: number;
  username: string;
  name: string;
  status: string;
  password: string;
  failedAttempts?: number;
  lockedUntil?: string | null;
  isPermanentLocked?: boolean;
}

interface BatchSession {
  id: number;
  disableMedia?: boolean;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  clientId?: number | null;
  clientName: string;
  assignedTesters: string[];
  assignedTesterId?: number | null;
  totalParticipants: number;
  completedParticipants: number;
  participants: BatchAccount[];
}

const AVAILABLE_TEST_TOOLS = [
  { id: 'WPT', label: 'WPT' },
  { id: 'IST', label: 'IST' },
  { id: 'PAPI KOSTICK', label: 'PAPI KOSTICK' },
  { id: 'DISC', label: 'DISC' },
  { id: 'CFIT', label: 'CFIT' },
  { id: 'TIKI', label: 'TIKI' },
  { id: 'MSDT', label: 'MSDT' },
  { id: 'POWER', label: 'POWER' },
  { id: 'Kraepelin', label: 'Kraepelin' },
  { id: 'Wartegg', label: 'Wartegg' },
  { id: 'Tes Grafis', label: 'Tes Grafis' },
];

export default function SchedulePage() {
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [testers, setTesters] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form State
  const [positionName, setPositionName] = useState('');
  const [selectedJobPositionId, setSelectedJobPositionId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTesterId, setSelectedTesterId] = useState('');
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState('');
  const [disableMedia, setDisableMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Custom Test Tools Override State
  const [useCustomTools, setUseCustomTools] = useState(false);
  const [selectedCustomTools, setSelectedCustomTools] = useState<string[]>([]);

  // Result State
  const [generatedAccounts, setGeneratedAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // Batches List State
  const [batches, setBatches] = useState<BatchSession[]>([]);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(true);
  const [searchBatch, setSearchBatch] = useState<string>('');

  // Batch Detail Modal
  const [selectedBatchModal, setSelectedBatchModal] = useState<BatchSession | null>(null);

  // Edit Batch Modal State
  const [editingBatch, setEditingBatch] = useState<BatchSession | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editTesterId, setEditTesterId] = useState('');
  const [updatingBatch, setUpdatingBatch] = useState(false);

  useEffect(() => {
    fetchOptions();
    fetchBatches();
  }, []);

  const fetchOptions = () => {
    fetch('/api/superadmin/schedule/options')
      .then(res => res.json())
      .then(data => {
        if (data.jobPositions) setJobPositions(data.jobPositions);
        if (data.clients) setClients(data.clients);
        if (data.testers) setTesters(data.testers);
        setLoadingOptions(false);
      })
      .catch(err => {
        console.error('Failed to load options:', err);
        setLoadingOptions(false);
      });
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch('/api/superadmin/schedule/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data || []);
      }
    } catch (e) {
      console.error('Failed to load batches:', e);
    } finally {
      setLoadingBatches(false);
    }
  };

  const toggleCustomTool = (toolId: string) => {
    setSelectedCustomTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!selectedJobPositionId && selectedCustomTools.length === 0) {
      alert('Pilih minimal Standar Jabatan Posisi ATAU centang minimal satu Alat Tes yang diujikan!');
      return;
    }

    const n = parseInt(count);
    if (!prefix.trim() || isNaN(n) || n < 1 || n > 200) {
      alert('Prefix dan Jumlah Akun wajib diisi dengan benar (1 s/d 200).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/superadmin/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionName: positionName.trim() || undefined,
          jobPositionId: selectedJobPositionId ? parseInt(selectedJobPositionId) : null,
          clientId: selectedClientId ? parseInt(selectedClientId) : null,
          startDate: sessionDate,
          testerId: selectedTesterId ? parseInt(selectedTesterId) : null,
          prefix: prefix.trim().toLowerCase(),
          count: n,
          disableMedia,
          customTools: (useCustomTools || !selectedJobPositionId) ? selectedCustomTools : undefined
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedAccounts(data.accounts || []);
        setMessage(`Berhasil membuat Sesi Ujian "${data.testTitle}" dengan ${data.accounts?.length} akun peserta!`);
        fetchBatches();
      } else {
        alert(data.error || 'Terjadi kesalahan');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungkan ke server.');
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
      `Username: ${acc.username}\nPassword: ${acc.password}\nLink Portal: ${origin}`
    ).join('\n\n------------------------------\n\n');
    navigator.clipboard.writeText(text);
    alert('Berhasil menyalin format broadcast pesan peserta!');
  };

  const handleCopyBatchExcel = (batch: BatchSession) => {
    const header = 'No\tNama\tUsername\tPassword\tStatus\n';
    const rows = batch.participants.map((acc, i) => 
      `${i + 1}\t${acc.name}\t${acc.username}\t${acc.password}\t${acc.status}`
    ).join('\n');
    navigator.clipboard.writeText(header + rows);
    alert(`Berhasil menyalin kredensial ${batch.participants.length} akun (format Excel)!`);
  };

  const handleCopyBatchFormatted = (batch: BatchSession) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = batch.participants.map((acc) => 
      `Nama: ${acc.name}\nUsername: ${acc.username}\nPassword: ${acc.password}\nLink Portal: ${origin}`
    ).join('\n\n------------------------------\n\n');
    navigator.clipboard.writeText(text);
    alert(`Berhasil menyalin format pesan lengkap untuk ${batch.participants.length} peserta!`);
  };

  const handleUnlockParticipant = async (acc: BatchAccount) => {
    if (!confirm(`Buka kunci akun peserta "${acc.name}" (${acc.username})?`)) return;
    try {
      const res = await fetch('/api/superadmin/users/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: acc.userId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Akun peserta berhasil dibuka!');
        if (selectedBatchModal) {
          const updated = selectedBatchModal.participants.map(p =>
            p.userId === acc.userId ? { ...p, failedAttempts: 0, lockedUntil: null, isPermanentLocked: false } : p
          );
          setSelectedBatchModal({ ...selectedBatchModal, participants: updated });
        }
        fetchBatches();
      } else {
        alert(data.error || 'Gagal membuka kunci peserta');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleOpenEdit = (batch: BatchSession) => {
    setEditingBatch(batch);
    setEditTitle(batch.title || '');
    setEditDate(batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '');
    setEditClientId(batch.clientId ? String(batch.clientId) : '');
    setEditTesterId(batch.assignedTesterId ? String(batch.assignedTesterId) : '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setUpdatingBatch(true);
    try {
      const res = await fetch('/api/superadmin/schedule/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBatch.id,
          title: editTitle.trim(),
          startDate: editDate || null,
          clientId: editClientId ? parseInt(editClientId) : null,
          testerId: editTesterId ? parseInt(editTesterId) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Batch berhasil diperbarui!');
        setEditingBatch(null);
        fetchBatches();
      } else {
        alert(data.error || 'Gagal memperbarui batch');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan perubahan batch.');
    } finally {
      setUpdatingBatch(false);
    }
  };

  const handleDeleteBatch = async (batch: BatchSession) => {
    if (!confirm(`Yakin ingin menghapus permanen Batch "${batch.title}" beserta seluruh ${batch.totalParticipants} akun peserta?`)) return;

    try {
      const res = await fetch(`/api/superadmin/schedule/batches?id=${batch.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Batch berhasil dihapus');
        fetchBatches();
        if (selectedBatchModal?.id === batch.id) setSelectedBatchModal(null);
      } else {
        alert(`Gagal menghapus batch: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (e) {
      console.error('Failed to delete batch:', e);
      alert('Gagal menghapus batch.');
    }
  };

  const filteredBatches = batches.filter(b => {
    const q = searchBatch.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.jobPositionName || '').toLowerCase().includes(q) ||
      (b.clientName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sesi & Penjadwalan Ujian
        </h2>
        <p className="text-sm text-slate-500">
          Buat sesi tes baru, tentukan modul alat tes, generate token peserta, dan kelola kredensial
        </p>
      </div>

      {/* Grid: Form & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form Generate */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Buat Sesi & Akun Peserta
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Isi data sesi, standar jabatan / modul tes, tanggal, dan tester penanggung jawab
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              {/* Nama Sesi / Jabatan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nama Sesi / Jabatan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Staff Admin / Tes Mandiri WPT / Batch 1"
                  value={positionName}
                  onChange={e => setPositionName(e.target.value)}
                />
              </div>

              {/* Standar Jabatan */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Standar Jabatan Posisi <span className="text-slate-400 font-normal">(Opsional jika tes mandiri)</span>
                  </label>
                  {selectedJobPositionId && (
                    <button
                      type="button"
                      onClick={() => setSelectedJobPositionId('')}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold underline"
                    >
                      Batal pilih standar
                    </button>
                  )}
                </div>

                <select
                  value={selectedJobPositionId}
                  onChange={e => setSelectedJobPositionId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">— Tanpa Standar Jabatan (Pilih Alat Tes Mandiri) —</option>
                  {jobPositions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                {!selectedJobPositionId && (
                  <p className="text-xs text-teal-600 font-medium">
                    💡 Mode Tes Mandiri aktif: Anda dapat memilih alat tes secara mandiri di bawah.
                  </p>
                )}
              </div>

              {/* Alat Tes Manual Selection */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {selectedJobPositionId ? (
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
                    <span className="text-xs font-bold text-slate-800">
                      Pilih Alat Tes yang Diujikan <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-xs text-slate-400">Pilih minimal 1 alat tes</span>
                  </div>
                )}

                {(useCustomTools || !selectedJobPositionId) && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_TEST_TOOLS.map(tool => (
                        <label
                          key={tool.id}
                          className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-md border border-slate-200 transition-colors text-xs font-semibold text-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomTools.includes(tool.id)}
                            onChange={() => toggleCustomTool(tool.id)}
                            className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                          />
                          <span className="truncate">{tool.label}</span>
                        </label>
                      ))}
                    </div>
                    {selectedCustomTools.length > 0 ? (
                      <p className="text-xs text-teal-600 font-semibold">
                        ✓ {selectedCustomTools.length} tes terpilih: {selectedCustomTools.join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-rose-500 font-medium">
                        ⚠️ Belum ada alat tes yang dipilih. Silakan centang minimal 1 alat tes.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Klien & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Klien Perusahaan</label>
                  <select
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">— Umum / Internal —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.username})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Ujian <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tester */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Tester Penanggung Jawab</label>
                <select
                  value={selectedTesterId}
                  onChange={e => setSelectedTesterId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">— Tanpa Penugasan Spesifik —</option>
                  {testers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.role === 'psikolog' ? 'Psikolog Assessor' : 'Tester'})</option>
                  ))}
                </select>
              </div>

              {/* Prefix & Jumlah */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Prefix Username <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: mandiri"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                    required
                  />
                  <span className="text-xs text-slate-400">
                    Format: {prefix ? `${prefix}_001` : 'mandiri_001'}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Jumlah Akun <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="Max 200"
                    value={count}
                    onChange={e => setCount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Proctoring Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disableMedia}
                    onChange={e => setDisableMedia(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded accent-teal-600 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">
                      Matikan Kamera & Share Screen (Mode Ringan untuk 50+ Peserta)
                    </span>
                    <span className="text-xs text-slate-500 leading-normal">
                      Default: Kamera & Layar aktif. Centang opsi ini jika sesi ujian memiliki banyak peserta agar server ringan dan hemat bandwidth.
                    </span>
                  </div>
                </label>
                {disableMedia && (
                  <Badge variant="outline" className="w-fit bg-amber-50 text-amber-800 border-amber-200 gap-1 text-xs">
                    <VideoOff className="w-3.5 h-3.5" />
                    <span>Mode Ringan Aktif: Peserta tidak diminta webcam/rekam layar</span>
                  </Badge>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{submitting ? 'Memproses Sesi…' : 'Generate Akun Peserta'}</span>
              </Button>

              {message && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold text-center">
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Hasil Generate */}
        <Card className="flex flex-col">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base font-bold text-slate-900">
                  Hasil Generate Akun Baru
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Password acak unik langsung siap disalin & didistribusikan
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
                Belum ada akun baru yang dibuat pada formulir di sebelah kiri.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Username</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Password Acak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedAccounts.map((acc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs text-slate-400 font-medium">{idx + 1}</TableCell>
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

      {/* Main Table: Batches List */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Batch Sesi Ujian & Akun Peserta
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Seluruh batch aktif, kredensial peserta, dan monitoring kelengkapan ujian
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari batch, jabatan, klien…"
                value={searchBatch}
                onChange={e => setSearchBatch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Batch & Tanggal</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Battery Test</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Klien Perusahaan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Tester PJ</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Jumlah Akun</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBatches ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat daftar batch…
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                    Belum ada Batch Penjadwalan yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map(batch => (
                  <TableRow key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900">{batch.title}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa Tanggal'}
                          </span>
                        </div>
                        {batch.disableMedia ? (
                          <Badge variant="outline" className="w-fit text-xs bg-amber-50 text-amber-800 border-amber-200 gap-1 font-semibold">
                            <VideoOff className="w-3 h-3" />
                            <span>Mode Ringan</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit text-xs bg-slate-100 text-slate-600 border-slate-200 gap-1">
                            <Video className="w-3 h-3" />
                            <span>Cam & Layar</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-slate-700">
                      {batch.jobPositionName}
                    </TableCell>

                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.clientName}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {batch.assignedTesters.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {batch.assignedTesters.map((t, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Umum</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-900">{batch.totalParticipants} Akun</span>
                        <span className="text-xs text-slate-500">{batch.completedParticipants}/{batch.totalParticipants} Selesai</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(batch)}
                          className="h-8 px-2.5 text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit Batch & Penugasan Tester"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedBatchModal(batch)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail Akun</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBatch(batch)}
                          className="h-8 px-2 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Detail Akun & Password */}
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
                    Posisi: {selectedBatchModal.jobPositionName} · Klien: {selectedBatchModal.clientName} · Total: {selectedBatchModal.totalParticipants} Akun
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
                    <span>Excel</span>
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
                      <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Peserta</TableHead>
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
                          {acc.isPermanentLocked ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="destructive" className="text-xs gap-1 bg-rose-50 text-rose-700 border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                <span>Terkunci Permanen</span>
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlockParticipant(acc)}
                                className="h-6 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                                title="Buka Kunci Akun Peserta"
                              >
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                <span>Buka</span>
                              </Button>
                            </div>
                          ) : (acc.lockedUntil && new Date(acc.lockedUntil) > new Date()) ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="warning" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Terkunci (1.5m)</span>
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlockParticipant(acc)}
                                className="h-6 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                                title="Buka Kunci Akun Peserta"
                              >
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                <span>Buka</span>
                              </Button>
                            </div>
                          ) : acc.status === 'completed' ? (
                            <Badge variant="success" className="text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selesai</span>
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Belum</span>
                            </Badge>
                          )}
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
      {/* Modal Edit Batch Sesi & Tester */}
      <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        {editingBatch && (
          <DialogContent className="max-w-md p-6">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit Batch & Penugasan Tester
              </DialogTitle>
              <CardDescription className="text-xs text-slate-500">
                Ubah judul batch, tanggal ujian, mitra perusahaan, atau ganti Tester PJ.
              </CardDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 pt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nama / Judul Batch <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Contoh: Tes Mandiri (DISC) - PT ABC"
                  required
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Tanggal Ujian
                </label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Klien / Perusahaan</label>
                <select
                  value={editClientId}
                  onChange={e => setEditClientId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">— Umum / Internal —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.username})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Tester Penanggung Jawab (PJ)</label>
                <select
                  value={editTesterId}
                  onChange={e => setEditTesterId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">— Tanpa Penugasan Spesifik (Umum) —</option>
                  {testers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role === 'psikolog' ? 'Psikolog Assessor' : 'Tester Pengawas'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingBatch(null)}
                  disabled={updatingBatch}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingBatch || !editTitle.trim()}
                  className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700"
                >
                  {updatingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan…</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
