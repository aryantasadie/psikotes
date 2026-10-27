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
  Loader2 
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

export default function PsychographPresetList() {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus Preset Kompetensi & Alat Tes ini?')) return;
    const res = await fetch(`/api/superadmin/psychograph/${id}`, { method: 'DELETE' });
    if (res.ok) setPresets(p => p.filter(x => x.id !== id));
    else alert('Gagal menghapus.');
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
                            onClick={() => handleDelete(preset.id)}
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
    </div>
  );
}
