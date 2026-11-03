'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Layers, 
  Building2, 
  Calendar, 
  Sliders, 
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Briefcase,
  FolderOpen,
  Users,
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

export default function PsychographPresetList() {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog State: Keamanan Relasi Data & Konfirmasi Hapus
  const [blockedData, setBlockedData] = useState<{
    isOpen: boolean;
    presetName: string;
    positions: Array<{ id: number; name: string }>;
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

  const fetchPresets = () => {
    setLoading(true);
    fetch('/api/superadmin/psychograph')
      .then(r => r.json())
      .then(d => {
        setPresets(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleInitiateDelete = (preset: any) => {
    // Hanya hitung batch yang benar-benar aktif (memiliki peserta > 0), abaikan shell dummy internal
    const realBatches = (preset.tests || []).filter((t: any) => {
      const count = typeof t.participantCount === 'number' ? t.participantCount : (t._count?.participants ?? 0);
      return count > 0;
    });

    const hasPositions = preset.jobPositions && preset.jobPositions.length > 0;
    const hasBatches = realBatches.length > 0;

    // Keamanan 1: Jika terdeteksi ada standar jabatan atau batch ujian aktif yang memakai template ini
    if (hasPositions || hasBatches) {
      setBlockedData({
        isOpen: true,
        presetName: preset.name,
        positions: (preset.jobPositions || []).map((jp: any) => ({
          id: jp.id,
          name: jp.name
        })),
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

    // Jika bebas relasi, buka konfirmasi hapus
    setConfirmDeleteData({
      isOpen: true,
      id: preset.id,
      name: preset.name,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteData) return;
    setConfirmDeleteData(prev => prev ? { ...prev, isDeleting: true } : null);

    try {
      const res = await fetch(`/api/superadmin/psychograph/${confirmDeleteData.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setConfirmDeleteData(null);
        if (data.code === 'HAS_CONNECTED_DATA') {
          setBlockedData({
            isOpen: true,
            presetName: confirmDeleteData.name,
            positions: data.connectedPositions || [],
            batches: data.connectedBatches || []
          });
        } else {
          alert(data.error || 'Gagal menghapus template kompetensi.');
        }
        return;
      }

      setPresets(p => p.filter(x => x.id !== confirmDeleteData.id));
      setConfirmDeleteData(null);
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
      setConfirmDeleteData(null);
    }
  };

  const filteredPresets = presets.filter(preset => {
    const q = search.toLowerCase();
    const nameMatch = (preset.name || '').toLowerCase().includes(q);
    const clientMatch = (preset.tests || []).some((t: any) => (t.client?.name || '').toLowerCase().includes(q));
    const positionMatch = (preset.jobPositions || []).some((jp: any) => (jp.name || '').toLowerCase().includes(q));
    return nameMatch || clientMatch || positionMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Kompetensi & Alat Tes
          </h2>
          <p className="text-sm text-slate-500">
            Kelola template aspek penilaian kompetensi, instrumen alat tes, dan psikogram
          </p>
        </div>

        <Button asChild className="gap-2 self-start sm:self-auto">
          <Link href="/superadmin/psychograph/builder">
            <Plus className="w-4 h-4" />
            <span>Buat Template Kompetensi</span>
          </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Tabel Kompetensi & Alat Tes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daftar seluruh baterai instrumen tes dan aspek penilaian per profil
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kompetensi, alat tes, perusahaan…"
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
                <TableHead className="font-bold text-xs uppercase text-slate-500">Profil Kompetensi & Alat Tes</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Perusahaan Mitra</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Dibuat Kapan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Total Aspek Penilaian</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data kompetensi…
                  </TableCell>
                </TableRow>
              ) : filteredPresets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    {search ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Belum ada template kompetensi yang dibuat.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPresets.map(preset => {
                  let aspectCount = 0;
                  try {
                    const parsed = JSON.parse(preset.aspects || '[]');
                    aspectCount = Array.isArray(parsed) ? parsed.length : 0;
                  } catch {}

                  const clientNames = Array.from(
                    new Set(
                      (preset.tests || [])
                        .map((t: any) => t.client?.name)
                        .filter(Boolean)
                    )
                  );
                  const displayClient = clientNames.length > 0 ? clientNames.join(', ') : 'Umum / Semua Klien';

                  const dateStr = preset.createdAt
                    ? new Date(preset.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <TableRow key={preset.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Profil */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                            <Sliders className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-900">{preset.name}</span>
                            {preset.description && (
                              <span className="text-xs text-slate-400 line-clamp-1">{preset.description}</span>
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

                      {/* 4. Total Aspek */}
                      <TableCell>
                        <Badge variant="outline" className="w-fit text-xs bg-teal-50 text-teal-700 border-teal-200 gap-1 font-semibold">
                          <Layers className="w-3 h-3" />
                          <span>{aspectCount} Aspek Penilaian</span>
                        </Badge>
                      </TableCell>

                      {/* 5. Aksi */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                            <Link href={`/superadmin/psychograph/builder?id=${preset.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Template</span>
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleInitiateDelete(preset)}
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
          POPUP MODAL: TEMPLATE KOMPETENSI TIDAK BISA DIHAPUS KARENA TERHUBUNG
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
              Template kompetensi & alat tes <strong className="text-slate-900 font-bold">&quot;{blockedData?.presetName}&quot;</strong> tidak dapat dihapus karena saat ini masih aktif menjadi acuan pada data berikut:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1 space-y-3">
            {/* Bagian 1: Standar Jabatan Terkait */}
            {blockedData?.positions && blockedData.positions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Digunakan oleh {blockedData.positions.length} Standar Jabatan:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                  {blockedData.positions.map((pos) => (
                    <Badge
                      key={pos.id}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 text-slate-800 font-medium"
                    >
                      {pos.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian 2: Batch Ujian Terkait */}
            {blockedData?.batches && blockedData.batches.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Digunakan pada {blockedData.batches.length} Batch Ujian:</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {blockedData.batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 truncate">
                          {batch.title}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {batch.clientName}
                        </span>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[11px] bg-white border border-slate-200">
                        <Users className="w-3 h-3 mr-1 text-slate-400" />
                        <span>{batch.participantCount || 0}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kotak Petunjuk Ramah untuk Pengguna Awam */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11.5px] text-amber-900 leading-relaxed flex items-start gap-2.5 mt-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Petunjuk:</strong> Template ini merupakan acuan perhitungan skor psikogram. Agar nilai psikotes tidak rusak, silakan ganti template pada standar jabatan atau batch terkait terlebih dahulu sebelum menghapus template ini.
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
          POPUP MODAL: KONFIRMASI HAPUS TEMPLATE (BEBAS RELASI)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(confirmDeleteData?.isOpen)} onOpenChange={(open) => !open && setConfirmDeleteData(null)}>
        <DialogContent className="max-w-sm p-6 text-center">
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Hapus Template Kompetensi?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed text-center">
              Apakah Anda yakin ingin menghapus template <strong className="text-slate-900 font-bold">&quot;{confirmDeleteData?.name}&quot;</strong>? Template ini belum digunakan oleh standar jabatan manapun dan aman dihapus.
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
