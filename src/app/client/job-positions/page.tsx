'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Calendar,
  Sliders,
  Layers,
  Briefcase,
  Loader2,
  CheckCircle2,
  Lock,
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

interface GrayArea {
  id: number;
  parameter: string;
  targetScore: number;
  indicator?: string | null;
}

interface JobPosition {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  psychographPreset?: {
    id: number;
    name: string;
    description?: string | null;
    mapping?: string;
  } | null;
  grayAreas: GrayArea[];
}

export default function ClientJobPositionsPage() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);

  useEffect(() => {
    fetch('/api/client/job-positions')
      .then(res => res.json())
      .then(data => {
        setPositions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching job positions:', err);
        setLoading(false);
      });
  }, []);

  const filteredPositions = positions.filter(pos => {
    const q = search.toLowerCase();
    const nameMatch = pos.name.toLowerCase().includes(q);
    const descMatch = (pos.description || '').toLowerCase().includes(q);
    const presetMatch = (pos.psychographPreset?.name || '').toLowerCase().includes(q);
    return nameMatch || descMatch || presetMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Daftar Standar Psikogram Jabatan
        </h2>
        <p className="text-sm text-slate-500">
          Acuan standar nilai minimum (Gray Area) dan paket baterai tes per posisi jabatan untuk perusahaan Anda
        </p>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200">
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
                placeholder="Cari jabatan, paket tes..."
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
                <TableHead className="font-bold text-xs uppercase text-slate-500">
                  Jabatan (Posisi)
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">
                  Dibuat Kapan
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">
                  Paket Alat Tes & Standar
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat standar psikogram jabatan...
                  </TableCell>
                </TableRow>
              ) : filteredPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    {search ? 'Tidak ada standar jabatan yang cocok.' : 'Belum ada standar psikogram jabatan.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPositions.map(pos => {
                  const dateStr = pos.createdAt
                    ? new Date(pos.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  const presetName = pos.psychographPreset?.name || 'Paket Kustom';
                  const grayAreaCount = pos.grayAreas ? pos.grayAreas.length : 0;

                  return (
                    <TableRow key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Jabatan (Posisi) */}
                      <TableCell>
                        <div className="flex items-center gap-3">
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

                      {/* 2. Dibuat Kapan */}
                      <TableCell className="text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>

                      {/* 3. Paket Alat Tes & Standar */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-bold text-slate-800">{presetName}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <Layers className="w-3 h-3 text-teal-600" />
                            {grayAreaCount} Aturan Gray Area
                          </span>
                        </div>
                      </TableCell>

                      {/* 4. Aksi: Read-Only View */}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPosition(pos)}
                          className="h-8 px-3 text-xs gap-1.5 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Standar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Dialog Read-Only: Detail Standar Gray Area & Baterai Tes ── */}
      <Dialog open={!!selectedPosition} onOpenChange={open => !open && setSelectedPosition(null)}>
        {selectedPosition && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                  <span>Standar Psikogram: {selectedPosition.name}</span>
                </DialogTitle>
                <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 text-xs">
                  Read Only
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                {selectedPosition.description || 'Acuan nilai standar kompetensi jabatan untuk penilaian psikotes'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {/* Info Baterai Tes */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Template Baterai Tes: {selectedPosition.psychographPreset?.name || 'Paket Kustom'}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-teal-700">
                    {selectedPosition.grayAreas.length} Indikator Kompetensi
                  </span>
                </div>
                {selectedPosition.psychographPreset?.description && (
                  <p className="text-xs text-slate-500">{selectedPosition.psychographPreset.description}</p>
                )}
              </div>

              {/* Table of Gray Area Scores */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead className="font-bold text-slate-600">No</TableHead>
                      <TableHead className="font-bold text-slate-600">Aspek Kompetensi</TableHead>
                      <TableHead className="font-bold text-slate-600 text-center">Standar Minimum (Gray Area)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPosition.grayAreas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-slate-400">
                          Belum ada aturan standar nilai minimum yang disetel.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedPosition.grayAreas.map((ga, idx) => (
                        <TableRow key={ga.id || idx} className="text-xs">
                          <TableCell className="font-medium text-slate-400 w-12">{idx + 1}</TableCell>
                          <TableCell className="font-bold text-slate-800">
                            <div>{ga.parameter}</div>
                            {ga.indicator && (
                              <div className="text-[11px] text-slate-400 font-normal">{ga.indicator}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              Rating {ga.targetScore} / 5
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPosition(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
