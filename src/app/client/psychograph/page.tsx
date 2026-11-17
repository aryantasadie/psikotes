'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Calendar,
  Layers,
  Loader2,
  Eye,
  CheckCircle2,
  Lock,
  Package,
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

interface CategoryMapping {
  category: string;
  aspects: Array<{
    name: string;
    description?: string;
    checked?: boolean;
    instruments?: string[];
  }>;
}

interface PsychographPreset {
  id: number;
  name: string;
  description?: string | null;
  mapping: string;
  createdAt: string;
  jobPositions?: Array<{ id: number; name: string }>;
  sequence?: string[];
}

export default function ClientPsychographPage() {
  const [presets, setPresets] = useState<PsychographPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PsychographPreset | null>(null);

  useEffect(() => {
    fetch('/api/client/psychograph')
      .then(res => res.json())
      .then(data => {
        setPresets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching client psychograph presets:', err);
        setLoading(false);
      });
  }, []);

  const filteredPresets = presets.filter(preset => {
    const q = search.toLowerCase();
    const nameMatch = preset.name.toLowerCase().includes(q);
    const descMatch = (preset.description || '').toLowerCase().includes(q);
    return nameMatch || descMatch;
  });

  // Helper untuk normalisasi nama alat tes utama (menggabungkan subtes/skala ke nama tes induk)
  const normalizeToolName = (tool: string): string => {
    const t = tool.trim();
    if (/PAPI/i.test(t)) return 'PAPI KOSTICK';
    if (/IST/i.test(t)) return 'IST';
    if (/CFIT/i.test(t)) return 'CFIT';
    if (/TIKI/i.test(t)) return 'TIKI';
    if (/WPT/i.test(t)) return 'WPT';
    if (/DISC/i.test(t)) return 'DISC';
    if (/MSDT/i.test(t)) return 'MSDT';
    if (/Kraepelin|KRAEPELIN/i.test(t)) return 'Kraepelin';
    if (/Wartegg|WARTEGG/i.test(t)) return 'Wartegg';
    if (/POWER|Power/i.test(t)) return 'POWER LEADER';
    return t;
  };

  // Helper untuk parsing mapping dan instrumen
  const parsePresetDetails = (preset: PsychographPreset) => {
    let categories: CategoryMapping[] = [];

    try {
      const parsed = JSON.parse(preset.mapping || '[]');
      if (Array.isArray(parsed)) {
        categories = parsed;
      }
    } catch {}

    // Urutan modul baterai tes sesuai urutan resmi preset di builder (Image 2)
    let instruments: string[] = [];
    if (Array.isArray(preset.sequence) && preset.sequence.length > 0) {
      instruments = preset.sequence;
    } else {
      // Fallback jika belum tersimpan sequence di test: ambil dari instrumen aspek
      const fallbackSet = new Set<string>();
      categories.forEach(cat => {
        (cat.aspects || []).forEach((asp: any) => {
          if (asp.instruments && Array.isArray(asp.instruments)) {
            asp.instruments.forEach((inst: string) => {
              if (inst && typeof inst === 'string') {
                fallbackSet.add(normalizeToolName(inst));
              }
            });
          }
        });
      });
      instruments = Array.from(fallbackSet);
    }

    return {
      categories,
      instruments,
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Kompetensi & Alat Tes
        </h2>
        <p className="text-sm text-slate-500">
          Daftar paket baterai tes resmi dan profil pemetaan kompetensi psikogram untuk perusahaan Anda
        </p>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Profil Kompetensi & Baterai Tes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daftar template penilaian psikotes dan instrumen alat tes yang digunakan
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kompetensi, alat tes..."
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
                  Profil Kompetensi & Alat Tes
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">
                  Dibuat Kapan
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data kompetensi...
                  </TableCell>
                </TableRow>
              ) : filteredPresets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-sm">
                    {search ? 'Tidak ada profil kompetensi yang cocok.' : 'Belum ada profil kompetensi.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPresets.map(preset => {
                  const dateStr = preset.createdAt
                    ? new Date(preset.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <TableRow key={preset.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Profil Kompetensi & Alat Tes */}
                      <TableCell>
                        <div className="flex items-center gap-3">
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

                      {/* 2. Dibuat Kapan */}
                      <TableCell className="text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>

                      {/* 3. Aksi: Read-Only View */}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPreset(preset)}
                          className="h-8 px-3 text-xs gap-1.5 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Baterai Tes</span>
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

      {/* ── Dialog Read-Only: Detail Baterai Tes & Aspek Kompetensi ── */}
      <Dialog open={!!selectedPreset} onOpenChange={open => !open && setSelectedPreset(null)}>
        {selectedPreset && (() => {
          const { categories, instruments } = parsePresetDetails(selectedPreset);

          return (
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-teal-600" />
                    <span>Template Baterai Tes: {selectedPreset.name}</span>
                  </DialogTitle>
                </div>
                {selectedPreset.description && (
                  <DialogDescription className="text-xs text-slate-500 mt-1">
                    {selectedPreset.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="flex flex-col gap-4 py-2">
                {/* Alat Tes yang Digunakan */}
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-700" />
                      <span>Alat Tes yang Diujikan (Baterai Tes)</span>
                    </span>
                    <span className="text-[11px] font-bold text-teal-800">
                      {instruments.length} Alat Tes
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {instruments.length === 0 ? (
                      <span className="text-xs text-slate-500">Standar Baterai Tes HR Publik</span>
                    ) : (
                      instruments.map((inst, idx) => (
                        <span
                          key={inst}
                          className="bg-white border border-teal-200 text-teal-950 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                        >
                          {idx + 1}. {inst}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Daftar Kategori & Aspek Penilaian */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Aspek Penilaian & Pemetaan Kompetensi
                  </h4>

                  {categories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Format aspek kompetensi belum dikonfigurasi.
                    </div>
                  ) : (
                    categories.map((cat, cIdx) => (
                      <div key={cIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            {cat.category}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {cat.aspects?.length || 0} Aspek
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {(cat.aspects || []).map((asp, aIdx) => (
                            <div key={aIdx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-800">{asp.name}</span>
                                {asp.description && (
                                  <span className="text-[11px] text-slate-500">{asp.description}</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 shrink-0">
                                {Array.from(new Set((asp.instruments || []).map(t => normalizeToolName(t)))).map(tool => (
                                  <span
                                    key={tool}
                                    className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700"
                                  >
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPreset(null)}
                  className="text-xs"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}
