'use client';

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Calendar,
  Layers,
  Award
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

interface CandidateResult {
  id: number;
  name: string;
  username: string;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  scores: Record<string, any>;
  recommendation?: string;
}

interface BatchReport {
  batchId: number;
  batchTitle: string;
  startDate?: string | null;
  jobPositionName: string;
  totalCandidates: number;
  completedCandidates: number;
  candidates: CandidateResult[];
}

export default function ClientReportsPage() {
  const [reports, setReports] = useState<BatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  useEffect(() => {
    fetch('/api/client/reports')
      .then(res => res.json())
      .then(d => {
        setReports(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Filter candidates based on selected batch and search
  const filteredBatches = reports.filter(b => 
    selectedBatchId === 'all' || String(b.batchId) === selectedBatchId
  );

  const allFilteredCandidates: Array<CandidateResult & { batchTitle: string }> = [];
  filteredBatches.forEach(b => {
    b.candidates.forEach(c => {
      const q = search.toLowerCase();
      if ((c.name || '').toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q)) {
        allFilteredCandidates.push({
          ...c,
          batchTitle: b.batchTitle
        });
      }
    });
  });

  const handleExportExcel = () => {
    if (allFilteredCandidates.length === 0) {
      alert('Tidak ada data kandidat untuk diekspor.');
      return;
    }

    let header = 'No\tNama Kandidat\tUsername\tSesi Ujian\tStatus\tHasil WPT\tHasil Kraepelin\tRekomendasi\n';
    let rows = allFilteredCandidates.map((c, i) => {
      const wpt = c.scores['WPT'] ? `Skor: ${c.scores['WPT'].score} (IQ: ${c.scores['WPT'].iq})` : '-';
      const kraepelin = c.scores['Kraepelin'] ? `Kecepatan: ${c.scores['Kraepelin'].kecepatan}, Ketelitian: ${c.scores['Kraepelin'].ketelitian}` : '-';
      const rec = c.recommendation || '-';
      return `${i + 1}\t${c.name}\t${c.username}\t${c.batchTitle}\t${c.status === 'completed' ? 'Selesai' : 'Belum'}\t${wpt}\t${kraepelin}\t${rec}`;
    }).join('\n');

    navigator.clipboard.writeText(header + rows);
    alert('Berhasil menyalin seluruh rekap nilai kandidat ke clipboard (format Excel)! Silakan paste langsung di Microsoft Excel atau Google Sheets.');
  };

  const renderScoresSummary = (scores: Record<string, any>) => {
    const keys = Object.keys(scores);
    if (keys.length === 0) {
      return <span className="text-xs text-slate-400 italic">Belum ada skor</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {scores['Kraepelin'] && (
          <div className="text-xs">
            <span className="font-bold text-slate-800">Kraepelin: </span>
            <span className="text-slate-600">
              Panker {scores['Kraepelin'].kecepatan} · Tianker {scores['Kraepelin'].ketelitian}
            </span>
          </div>
        )}
        {scores['WPT'] && (
          <div className="text-xs">
            <span className="font-bold text-slate-800">WPT: </span>
            <span className="text-slate-600">
              Skor {scores['WPT'].score} (IQ {scores['WPT'].iq})
            </span>
          </div>
        )}
        {scores['DISC'] && (
          <div className="text-xs">
            <span className="font-bold text-slate-800">DISC: </span>
            <span className="text-slate-600">Tipe {scores['DISC'].profile}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Rekap & Hasil Asesmen Kandidat
          </h2>
          <p className="text-sm text-slate-500">
            Tinjau ringkasan nilai ujian kandidat dan unduh rekap nilai kelulusan secara mandiri.
          </p>
        </div>

        <Button
          onClick={handleExportExcel}
          variant="outline"
          className="gap-2 self-start sm:self-auto font-bold text-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Salin Rekap Tabel Excel</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Kandidat & Skor Ujian
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Data nilai resmi dan ringkasan performa per alat tes
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Batch Filter Dropdown */}
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="h-9 w-full sm:w-56 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="all">Semua Sesi / Batch</option>
                {reports.map(b => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchTitle}
                  </option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama atau username…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Kandidat & Akun</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Sesi Ujian</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Status Pengerjaan</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Ringkasan Skor Tes</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Rekomendasi Asesmen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data hasil asesmen...
                  </TableCell>
                </TableRow>
              ) : allFilteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                    Belum ada data kandidat yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                allFilteredCandidates.map((c, idx) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="text-xs text-slate-400 font-medium">{idx + 1}</TableCell>
                    
                    {/* Nama & Username */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-900">{c.name}</span>
                        <code className="text-xs text-slate-500 font-mono">{c.username}</code>
                      </div>
                    </TableCell>

                    {/* Sesi */}
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {c.batchTitle}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {c.status === 'completed' ? (
                        <Badge variant="success" className="text-xs gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Belum Selesai</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Ringkasan Skor (Tanpa Kunci Jawaban) */}
                    <TableCell>
                      {renderScoresSummary(c.scores)}
                    </TableCell>

                    {/* Rekomendasi */}
                    <TableCell className="text-right">
                      {c.recommendation && c.recommendation !== 'Dalam Penilaian' ? (
                        <Badge 
                          variant={
                            c.recommendation.toLowerCase().includes('disarankan') && !c.recommendation.toLowerCase().includes('tidak')
                              ? 'success'
                              : c.recommendation.toLowerCase().includes('tidak')
                              ? 'destructive'
                              : 'warning'
                          } 
                          className="text-xs font-bold"
                        >
                          {c.recommendation}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Dalam Penilaian</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
