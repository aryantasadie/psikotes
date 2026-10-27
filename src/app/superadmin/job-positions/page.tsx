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

export default function JobPositionList() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus Standar Psikogram Posisi ini?')) return;
    const res = await fetch(`/api/superadmin/job-positions/${id}`, { method: 'DELETE' });
    if (res.ok) setPositions(p => p.filter(x => x.id !== id));
    else alert('Gagal menghapus.');
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
                            onClick={() => handleDelete(pos.id)}
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
