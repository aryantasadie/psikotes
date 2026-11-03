'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Briefcase, 
  Building2, 
  Calendar, 
  Layers, 
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Users,
  FolderOpen,
  Info
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
  DialogFooter,
} from '@/components/ui/dialog';

export default function JobPositionList() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog State: Keamanan Relasi Data & Konfirmasi Hapus
  const [blockedData, setBlockedData] = useState<{
    isOpen: boolean;
    positionName: string;
    batches: Array<{
      id: number;
      title: string;
      clientName?: string;
      participantCount?: number;
      startDate?: string;
    }>;
  } | null>(null);

  const [confirmDeleteData, setConfirmDeleteData] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
    isDeleting: boolean;
  } | null>(null);

  const fetchPositions = () => {
    setLoading(true);
    fetch('/api/superadmin/job-positions')
      .then(r => r.json())
      .then(d => {
        setPositions(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleInitiateDelete = (pos: any) => {
    // Keamanan 1: Jika sudah terdeteksi ada batch ujian aktif (ada peserta) terkait, blokir dengan popup informatif
    const realBatches = (pos.tests || []).filter((t: any) => {
      const count = typeof t.participantCount === 'number' ? t.participantCount : (t._count?.participants ?? 0);
      return count > 0;
    });

    if (realBatches.length > 0) {
      setBlockedData({
        isOpen: true,
        positionName: pos.name,
        batches: realBatches.map((t: any) => ({
          id: t.id,
          title: t.title,
          clientName: t.client?.name || 'Umum / Semua Klien',
          participantCount: typeof t.participantCount === 'number' ? t.participantCount : (t._count?.participants ?? 0),
          startDate: t.startDate
        }))
      });
      return;
    }

    // Jika belum terhubung ke batch manapun, buka konfirmasi hapus aman
    setConfirmDeleteData({
      isOpen: true,
      id: pos.id,
      name: pos.name,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteData) return;
    setConfirmDeleteData(prev => prev ? { ...prev, isDeleting: true } : null);

    try {
      const res = await fetch(`/api/superadmin/job-positions/${confirmDeleteData.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setConfirmDeleteData(null);
        if (data.code === 'HAS_CONNECTED_DATA') {
          setBlockedData({
            isOpen: true,
            positionName: confirmDeleteData.name,
            batches: data.connectedBatches || []
          });
        } else {
          alert(data.error || 'Gagal menghapus standar psikogram jabatan.');
        }
        return;
      }

      setPositions(p => p.filter(x => x.id !== confirmDeleteData.id));
      setConfirmDeleteData(null);
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
      setConfirmDeleteData(null);
    }
  };

  const filteredPositions = positions.filter(pos => {
    const q = search.toLowerCase();
    const nameMatch = (pos.name || '').toLowerCase().includes(q);
    const presetMatch = (pos.psychographPreset?.name || '').toLowerCase().includes(q);
    const clientMatch = (pos.tests || []).some((t: any) => (t.client?.name || '').toLowerCase().includes(q));
    return nameMatch || presetMatch || clientMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Standar Psikogram Jabatan
          </h2>
          <p className="text-sm text-slate-500">
            Kelola standar nilai minimum (Gray Area) dan paket baterai tes per posisi jabatan
          </p>
        </div>

        <Button asChild className="gap-2 self-start sm:self-auto">
          <Link href="/superadmin/job-positions/builder">
            <Plus className="w-4 h-4" />
            <span>Buat Standar Psikogram</span>
          </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Tabel Standar Psikogram
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daftar settingan posisi jabatan beserta acuan paket alat tes & target gray area
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari jabatan, perusahaan, paket tes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Jabatan (Posisi)</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Perusahaan Mitra</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Dibuat Kapan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Paket Alat Tes & Standar</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data standar psikogram…
                  </TableCell>
                </TableRow>
              ) : filteredPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    {search ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Belum ada standar psikogram jabatan yang dibuat.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPositions.map(pos => {
                  const clientNames = Array.from(
                    new Set(
                      (pos.tests || [])
                        .map((t: any) => t.client?.name)
                        .filter(Boolean)
                    )
                  );
                  const displayClient = clientNames.length > 0 ? clientNames.join(', ') : 'Umum / Semua Klien';

                  const dateStr = pos.createdAt
                    ? new Date(pos.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <TableRow key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Jabatan */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-900">{pos.name}</span>
                            {pos.description && (
                              <span className="text-xs text-slate-400 line-clamp-1">{pos.description}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Perusahaan */}
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{displayClient}</span>
                        </div>
                      </TableCell>

                      {/* 3. Dibuat kapan */}
                      <TableCell className="text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>

                      {/* 4. Paket Alat Tes */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-800">
                            {pos.psychographPreset?.name || 'Paket Kustom'}
                          </span>
                          <Badge variant="outline" className="w-fit text-xs bg-teal-50 text-teal-700 border-teal-200 gap-1 font-semibold">
                            <Layers className="w-3 h-3" />
                            <span>{pos.grayAreas?.length || 0} Aturan Gray Area</span>
                          </Badge>
                        </div>
                      </TableCell>

                      {/* 5. Aksi */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                            <Link href={`/superadmin/job-positions/builder?id=${pos.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Standar</span>
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleInitiateDelete(pos)}
                            className="h-8 px-2.5 text-xs gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP MODAL: STANDAR JABATAN TIDAK BISA DIHAPUS KARENA TERHUBUNG KE BATCH
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(blockedData?.isOpen)} onOpenChange={(open) => !open && setBlockedData(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs mb-1">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Tidak Dapat Dihapus
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed text-center">
              Standar psikogram jabatan <strong className="text-slate-900 font-bold">&quot;{blockedData?.positionName}&quot;</strong> saat ini masih aktif digunakan pada <strong className="text-amber-700 font-bold">{blockedData?.batches.length || 0} batch ujian</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Daftar Batch Terkait */}
          <div className="mt-1 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Daftar Batch Ujian yang Menggunakan Standar Ini:</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {blockedData?.batches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-bold text-slate-900 truncate">
                      {batch.title}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{batch.clientName || 'Umum'}</span>
                    </span>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                    <Users className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{batch.participantCount || 0} Peserta</span>
                  </Badge>
                </div>
              ))}
            </div>

            {/* Kotak Petunjuk Ramah untuk Pengguna Awam */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11.5px] text-amber-900 leading-relaxed flex items-start gap-2.5 mt-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Petunjuk:</strong> Agar hasil penilaian psikogram peserta pada batch di atas tidak rusak, Anda perlu mengubah standar jabatan pada batch tersebut atau menghapus batch-nya terlebih dahulu di menu <strong>Penjadwalan & Sesi</strong>.
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 sm:justify-center">
            <Button
              type="button"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              onClick={() => setBlockedData(null)}
            >
              Saya Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP MODAL: KONFIRMASI HAPUS (STANDAR BEBAS RELASI)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(confirmDeleteData?.isOpen)} onOpenChange={(open) => !open && setConfirmDeleteData(null)}>
        <DialogContent className="max-w-sm p-6 text-center">
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Hapus Standar Psikogram?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed text-center">
              Apakah Anda yakin ingin menghapus standar jabatan <strong className="text-slate-900 font-bold">&quot;{confirmDeleteData?.name}&quot;</strong>? Standar ini belum digunakan oleh batch manapun dan aman dihapus.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setConfirmDeleteData(null)}
              disabled={confirmDeleteData?.isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1 text-xs font-semibold"
              onClick={handleConfirmDelete}
              disabled={confirmDeleteData?.isDeleting}
            >
              {confirmDeleteData?.isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Menghapus…</span>
                </>
              ) : (
                'Ya, Hapus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
