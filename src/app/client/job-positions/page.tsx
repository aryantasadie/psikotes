'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Calendar,
  Layers,
  Briefcase,
  Loader2,
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

const SCORE_LABELS = [
  { value: 1, label: 'KS', full: 'Kurang Sekali' },
  { value: 2, label: 'K',  full: 'Kurang'        },
  { value: 3, label: 'C',  full: 'Cukup'         },
  { value: 4, label: 'B',  full: 'Baik'          },
  { value: 5, label: 'BS', full: 'Baik Sekali'   },
];

const ASPECT_DESCRIPTIONS: Record<string, string> = {
  "IQ / Kapasitas Intelektual": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Intelegensi umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Daya Analisa": "Mampu mengolah dan mengidentifikasi keterkaitan data; menghubungkan informasi dari berbagai sumber.",
  "Logika Berpikir": "Kemampuan berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal.",
  "Daya Abstraksi": "Kemampuan menelaah persoalan dari beberapa sudut pandang dan berpikir antisipatif.",
  "Problem Solving": "Kemampuan membuat keputusan terhadap permasalahan dengan mempertimbangkan alternatif solusi.",
  "Stabilitas Emosi": "Kemampuan mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh.",
  "Kepekaan Emosi / Sosial": "Kemampuan memahami dan peka terhadap perasaan dan kebutuhan orang lain.",
  "Kepercayaan Diri": "Keyakinan pada kemampuan diri sendiri dalam menghadapi berbagai situasi tantangan.",
  "Sosiabilitas": "Kemampuan bergaul dan menjalin hubungan dengan orang lain secara luas.",
  "Adaptasi": "Kemampuan menyesuaikan diri dengan lingkungan atau situasi yang baru secara fleksibel.",
  "Komunikasi": "Kemampuan menyampaikan ide dan informasi dengan jelas, lugas dan persuasif.",
  "Orientasi Berprestasi": "Dorongan untuk mencapai hasil kerja terbaik dan melampaui standar target.",
  "Daya Juang": "Ketahanan, keuletan dan kegigihan dalam menghadapi hambatan dan kesulitan kerja.",
  "Kedetailan": "Kemampuan memperhatikan rincian hal-hal kecil agar pekerjaan minim kesalahan.",
  "Sistematika Kerja": "Kemampuan bekerja secara teratur, terencana, rapi dan prosedural.",
  "Kecepatan Kerja": "Kemampuan menyelesaikan tugas dalam tempo waktu yang singkat dan tanggap.",
  "Ketelitian Kerja": "Kemampuan bekerja dengan akurat, teliti dan konsisten minim kesalahan.",
  "Daya Tahan Stress": "Kemampuan untuk tetap bekerja secara produktif dan tenang di bawah tekanan tinggi.",
  "Kepemimpinan": "Kemampuan mengarahkan, memotivasi, dan mengkoordinasikan orang lain menuju tujuan.",
  "Inisiatif": "Kemampuan mengambil tindakan proaktif tanpa harus selalu menunggu instruksi atasan.",
  "Tanggung Jawab": "Kesediaan menanggung risiko dan menuntaskan komitmen atas tugas yang diemban.",
  "Kerjasama": "Kemampuan bersinergi dan berkontribusi positif dalam kelompok kerja tim.",
  "Pengambilan Keputusan": "Kemampuan menentukan langkah solusi terbaik dari berbagai alternatif secara cepat dan tepat.",
};

const getCategoryForAspect = (aspectName: string): string => {
  const norm = aspectName.toLowerCase();
  if (norm.includes('iq') || norm.includes('intelegensi') || norm.includes('inteligensi') || norm.includes('analisa') || norm.includes('logika') || norm.includes('abstraksi') || norm.includes('problem')) {
    return 'KEMAMPUAN KOGNITIF';
  }
  if (norm.includes('emosi') || norm.includes('percaya diri') || norm.includes('sikap') || norm.includes('stabilitas')) {
    return 'SISI AFEKTIF';
  }
  if (norm.includes('sosial') || norm.includes('adaptasi') || norm.includes('komunikasi') || norm.includes('relasi') || norm.includes('kerjasama')) {
    return 'HUBUNGAN ANTAR MANUSIA';
  }
  if (norm.includes('juang') || norm.includes('detail') || norm.includes('sistematika') || norm.includes('kecepatan') || norm.includes('ketelitian') || norm.includes('stress') || norm.includes('tanggung jawab') || norm.includes('prestasi') || norm.includes('inisiatif')) {
    return 'SIKAP KERJA';
  }
  if (norm.includes('pimpin') || norm.includes('kepemimpinan') || norm.includes('keputusan')) {
    return 'KEPEMIMPINAN';
  }
  return 'DIMENSI KOMPETENSI';
};

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

  // Group Gray Areas by Psychological Category
  const groupedGrayAreas = React.useMemo(() => {
    if (!selectedPosition?.grayAreas) return {};
    const groups: Record<string, GrayArea[]> = {};

    selectedPosition.grayAreas.forEach(ga => {
      const cat = getCategoryForAspect(ga.parameter);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ga);
    });

    return groups;
  }, [selectedPosition]);

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

      {/* ── Dialog Tampilan Bentuk Psikogram Asli ── */}
      <Dialog open={!!selectedPosition} onOpenChange={open => !open && setSelectedPosition(null)}>
        {selectedPosition && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                  <span>Standar Lembar Psikogram: {selectedPosition.name}</span>
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                {selectedPosition.description || 'Acuan matriks profil kelayakan dan standar nilai minimum (Gray Area) per aspek psikologis'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {/* Header Info & Legend */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-800">
                    Template: {selectedPosition.psychographPreset?.name || 'Paket Kustom'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-teal-700">
                    {selectedPosition.grayAreas.length} Dimensi Penilaian
                  </span>
                </div>

                {/* Legend Skor Psikogram */}
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 flex-wrap">
                  {SCORE_LABELS.map(s => (
                    <span key={s.value} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        s.value >= 3 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.value}
                      </span>
                      <span>{s.label} ({s.full})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Matriks Tabel Bentuk Psikogram */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider w-[48%]">
                          Dimensi Psikologis / Aspek Kompetensi
                        </th>
                        {SCORE_LABELS.map(s => (
                          <th
                            key={s.value}
                            className={`px-2 py-3 text-center text-xs font-bold uppercase tracking-wider w-[10%] ${
                              s.value >= 3 ? 'text-teal-700 bg-teal-50/50' : 'text-slate-500'
                            }`}
                          >
                            <div>{s.label}</div>
                            <div className="text-[9px] font-medium normal-case text-slate-400">({s.value})</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPosition.grayAreas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                            Belum ada pengaturan standar Gray Area untuk posisi ini.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(groupedGrayAreas).map(([category, items]) => (
                          <React.Fragment key={category}>
                            {/* Baris Kategori Psikogram */}
                            <tr className="bg-slate-100/70 border-y border-slate-200">
                              <td colSpan={6} className="px-4 py-2 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                {category}
                              </td>
                            </tr>

                            {/* Baris Aspek-aspek */}
                            {items.map((ga, idx) => {
                              const desc = ASPECT_DESCRIPTIONS[ga.parameter] || ga.indicator || '—';
                              const target = ga.targetScore || 3;

                              return (
                                <tr key={ga.id || idx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                  {/* Aspek & Deskripsi */}
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-bold text-slate-900">{ga.parameter}</span>
                                      <span className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
                                        {desc}
                                      </span>
                                    </div>
                                  </td>

                                  {/* 5 Kolom Matriks Rating (1 - 5) */}
                                  {SCORE_LABELS.map(s => {
                                    const isTarget = s.value === target;

                                    return (
                                      <td
                                        key={s.value}
                                        className={`px-2 py-3 text-center align-middle border-l border-slate-100 ${
                                          s.value >= 3 ? 'bg-teal-50/20' : ''
                                        }`}
                                      >
                                        {isTarget ? (
                                          <div className="flex flex-col items-center justify-center gap-0.5">
                                            <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                              {s.value}
                                            </div>
                                            <span className="text-[9px] font-bold text-teal-800">
                                              Target
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-auto" />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
