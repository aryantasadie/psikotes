'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Camera, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Users, 
  Eye, 
  Loader2,
  XCircle,
  Building2
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
  DialogDescription,
} from '@/components/ui/dialog';

interface ParticipantItem {
  id: number;
  userId: number;
  testId: number;
  status: string;
  currentTest: string;
  isPaused: boolean;
  startTime?: string | null;
  endTime?: string | null;
  user: {
    id: number;
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
  };
  test: {
    id: number;
    title: string;
    jobPositionName: string;
    sequence: string[];
    isPaused: boolean;
  };
  latestPhotoUrl: string | null;
  latestPhotoType: string | null;
  photoLogs: Array<{ id: number; logType: string; mediaUrl: string; createdAt: string }>;
  violationCount: number;
}

interface BatchItem {
  id: number;
  title: string;
  jobPositionName: string;
  isPaused: boolean;
  startDate?: string | null;
}

export default function ClientProctorPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [activePhotoModal, setActivePhotoModal] = useState<ParticipantItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/client/proctor');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error('Error fetching proctor data:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto polling setiap 8 detik agar tidak membebani server
    const interval = setInterval(() => {
      fetchData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchBatch = selectedBatchId === 'all' || String(p.testId) === selectedBatchId;
      const query = search.toLowerCase().trim();
      const matchSearch = !query || 
        p.user.name.toLowerCase().includes(query) || 
        p.user.username.toLowerCase().includes(query) ||
        p.test.title.toLowerCase().includes(query);
      return matchBatch && matchSearch;
    });
  }, [participants, selectedBatchId, search]);

  const stats = useMemo(() => {
    const total = filteredParticipants.length;
    const inProgress = filteredParticipants.filter(p => p.status === 'in_progress').length;
    const completed = filteredParticipants.filter(p => p.status === 'completed').length;
    const pending = filteredParticipants.filter(p => p.status === 'pending').length;
    const paused = filteredParticipants.filter(p => p.isPaused).length;
    return { total, inProgress, completed, pending, paused };
  }, [filteredParticipants]);

  const currentBatch = useMemo(() => {
    if (selectedBatchId === 'all') return null;
    return batches.find(b => String(b.id) === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const handleToggleBatchPause = async () => {
    if (!currentBatch) return;
    const nextAction = currentBatch.isPaused ? 'resume_batch' : 'pause_batch';
    const confirmMsg = currentBatch.isPaused 
      ? `Lanjutkan pengerjaan ujian untuk seluruh peserta di sesi "${currentBatch.title}"?`
      : `Jeda pengerjaan ujian untuk seluruh peserta di sesi "${currentBatch.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/client/proctor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextAction,
          batchId: currentBatch.id
        })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengubah status jeda sesi');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopParticipant = async (p: ParticipantItem) => {
    if (!window.confirm(`Hentikan ujian untuk ${p.user.name} (${p.user.username})? Peserta tidak akan bisa melanjutkan ujian.`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/client/proctor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop_participant',
          participantId: p.id
        })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghentikan peserta');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-teal-600" />
            Live Monitor Ujian (Proctoring)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pantau kehadiran, foto kamera pengawas, dan progres pengerjaan kandidat Anda secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>Perbarui Data</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Peserta</p>
              <h3 className="text-xl font-black text-slate-900">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Sedang Ujian</p>
              <h3 className="text-xl font-black text-amber-700">{stats.inProgress}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Selesai</p>
              <h3 className="text-xl font-black text-emerald-700">{stats.completed}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Belum Mulai</p>
              <h3 className="text-xl font-black text-slate-700">{stats.pending}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Batch Controls */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
              {/* Batch Selector */}
              <div className="w-full sm:w-64">
                <select
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="all">Semua Sesi Ujian ({batches.length})</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} {b.isPaused ? '⏸️ (Dijeda)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Cari nama atau username..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Quick Batch Control Button */}
            {currentBatch && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Button
                  variant={currentBatch.isPaused ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleBatchPause}
                  disabled={actionLoading}
                  className={`gap-1.5 text-xs font-bold ${
                    currentBatch.isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-amber-700 border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {currentBatch.isPaused ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>Lanjutkan Sesi Ini</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      <span>Jeda Sesi Ini</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants Live Table */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Daftar Kandidat Terpantau</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Foto webcam diambil berkala di awal dan setiap 10 menit sebagai bukti kehadiran otentik.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs gap-1 border-teal-200 text-teal-700 bg-teal-50">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            Live Monitoring
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Kandidat</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Sesi & Posisi</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Ujian Berjalan</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Kamera Pengawas</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data monitor live...
                  </TableCell>
                </TableRow>
              ) : filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada kandidat yang sesuai dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((p, idx) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="text-xs text-slate-400 font-medium">{idx + 1}</TableCell>
                    
                    {/* Nama & Username */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{p.user.name}</span>
                        <code className="text-xs text-slate-500 font-mono">{p.user.username}</code>
                      </div>
                    </TableCell>

                    {/* Sesi */}
                    <TableCell>
                      <div className="flex flex-col max-w-xs">
                        <span className="text-xs font-semibold text-slate-800 truncate">{p.test.title}</span>
                        <span className="text-xs text-slate-500">{p.test.jobPositionName}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {p.status === 'completed' ? (
                        <Badge variant="success" className="text-xs gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </Badge>
                      ) : p.status === 'stopped' ? (
                        <Badge variant="destructive" className="text-xs gap-1 font-semibold">
                          <XCircle className="w-3 h-3" />
                          <span>Dihentikan</span>
                        </Badge>
                      ) : p.isPaused ? (
                        <Badge variant="warning" className="text-xs gap-1 font-semibold">
                          <PauseCircle className="w-3 h-3" />
                          <span>Dijeda</span>
                        </Badge>
                      ) : p.status === 'in_progress' ? (
                        <Badge variant="warning" className="text-xs gap-1 font-semibold bg-amber-50 text-amber-700 border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          <span>Sedang Tes</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1 text-slate-600">
                          <Clock className="w-3 h-3" />
                          <span>Belum Mulai</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Subtes Berjalan */}
                    <TableCell className="text-xs text-slate-700 font-medium">
                      {p.status === 'completed' ? (
                        <span className="text-emerald-700 font-semibold">Semua Tes Tuntas</span>
                      ) : p.status === 'pending' ? (
                        <span className="text-slate-400 italic">Menunggu Login</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-800">
                          {p.currentTest || 'Ujian'}
                        </span>
                      )}
                    </TableCell>

                    {/* Kamera Snapshot */}
                    <TableCell>
                      {p.latestPhotoUrl ? (
                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => setActivePhotoModal(p)}
                        >
                          <div className="relative w-10 h-10 rounded border border-slate-300 overflow-hidden bg-slate-100 flex-shrink-0">
                            <img 
                              src={p.latestPhotoUrl} 
                              alt="Snapshot" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-teal-700 group-hover:underline flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              Foto Valid
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {p.latestPhotoType?.replace('_', ' ') || 'Webcam'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1 italic">
                          <Camera className="w-3.5 h-3.5 text-slate-300" />
                          Belum ada foto
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      {p.status === 'in_progress' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStopParticipant(p)}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8"
                        >
                          Hentikan
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Preview Foto Pengawas */}
      <Dialog open={!!activePhotoModal} onOpenChange={(open) => !open && setActivePhotoModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Camera className="w-5 h-5 text-teal-600" />
              Bukti Kehadiran Kamera Pengawas
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kandidat: <strong>{activePhotoModal?.user.name}</strong> ({activePhotoModal?.user.username}) &bull; Sesi: {activePhotoModal?.test.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {activePhotoModal?.photoLogs && activePhotoModal.photoLogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePhotoModal.photoLogs.map(log => (
                  <div key={log.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1.5">
                    <div className="relative aspect-video rounded overflow-hidden bg-slate-200">
                      <img 
                        src={log.mediaUrl} 
                        alt={log.logType} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600 px-1">
                      <span className="font-bold capitalize">{log.logType.replace('_', ' ')}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                Belum ada foto snapshot yang tersimpan untuk peserta ini.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
