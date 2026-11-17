'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Camera,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  RefreshCw,
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

interface Participant {
  id: number;
  userId: number;
  testId: number;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  user: {
    id: number;
    name: string;
    username: string;
    email?: string | null;
  };
  test: {
    id: number;
    title: string;
    sequence?: string | null;
    startDate?: string | null;
    jobPosition?: {
      name: string;
    } | null;
  };
  logs?: Array<{
    id: number;
    logType: string;
    mediaUrl: string;
    createdAt: string;
  }>;
}

export default function ClientProctorLogsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [inspectParticipant, setInspectParticipant] = useState<Participant | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/proctor-logs');
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error('Error fetching proctor logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const batches = Array.from(
    new Map(
      participants.map(p => [p.test.id, { id: p.test.id, title: p.test.title }])
    ).values()
  );

  const filteredParticipants = participants.filter(p => {
    const q = search.toLowerCase();
    const matchQuery =
      p.user.name.toLowerCase().includes(q) ||
      p.user.username.toLowerCase().includes(q) ||
      p.test.title.toLowerCase().includes(q);

    if (selectedBatchId !== 'all') {
      return matchQuery && String(p.test.id) === selectedBatchId;
    }
    return matchQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Log Pengawasan & Integritas Ujian</span>
          </h2>
          <p className="text-sm text-slate-500">
            Audit rekam jejak pengawasan kamera dan integritas sesi pengerjaan ujian kandidat
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-1.5 text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </Button>
      </div>

      {/* Main Filter & Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari kandidat / username..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                <option value="all">Semua Sesi Ujian ({batches.length})</option>
                {batches.map(b => (
                  <option key={b.id} value={String(b.id)}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
              Total {filteredParticipants.length} Kandidat
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Kandidat</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Sesi & Formasi</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-center">Status Ujian</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-center">Rekam Kamera</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat log pengawasan...
                  </TableCell>
                </TableRow>
              ) : filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    {search ? 'Tidak ada data peserta yang cocok.' : 'Belum ada log pengawasan peserta.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map(item => {
                  const logCount = item.logs ? item.logs.length : 0;
                  const isCompleted = item.status === 'completed';
                  const isInProgress = item.status === 'in_progress';

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Nama & Username */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-900">{item.user.name}</span>
                          <span className="text-xs font-mono text-slate-500">{item.user.username}</span>
                        </div>
                      </TableCell>

                      {/* 2. Sesi & Formasi */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-800">{item.test.title}</span>
                          <span className="text-[11px] text-slate-400">
                            {item.test.jobPosition?.name || 'Umum'}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Status Ujian */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isInProgress
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Selesai
                            </>
                          ) : isInProgress ? (
                            <>
                              <Clock className="w-3 h-3 text-teal-600" />
                              Sedang Ujian
                            </>
                          ) : (
                            'Belum Mulai'
                          )}
                        </span>
                      </TableCell>

                      {/* 4. Rekam Kamera */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                            logCount > 0
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{logCount} Foto Snapshot</span>
                        </span>
                      </TableCell>

                      {/* 5. Aksi */}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectParticipant(item)}
                          className="h-8 px-2.5 text-xs gap-1 border-slate-200 hover:bg-teal-50 hover:text-teal-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Log</span>
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

      {/* ── Dialog Detail Snapshot & Audit ── */}
      <Dialog open={!!inspectParticipant} onOpenChange={open => !open && setInspectParticipant(null)}>
        {inspectParticipant && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-600" />
                  <span>Audit Pengawasan: {inspectParticipant.user.name}</span>
                </DialogTitle>
                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200">
                  {inspectParticipant.user.username}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Sesi: {inspectParticipant.test.title} • Posisi: {inspectParticipant.test.jobPosition?.name || 'Umum'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <strong>Mulai:</strong>{' '}
                  {inspectParticipant.startTime
                    ? new Date(inspectParticipant.startTime).toLocaleTimeString('id-ID')
                    : '—'}
                </div>
                <div>
                  <strong>Selesai:</strong>{' '}
                  {inspectParticipant.endTime
                    ? new Date(inspectParticipant.endTime).toLocaleTimeString('id-ID')
                    : '—'}
                </div>
                <div>
                  <strong>Total Snapshot:</strong> {inspectParticipant.logs?.length || 0}
                </div>
              </div>

              {/* Gallery of photos */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Galeri Snapshot Kamera Pengawas
                </h4>

                {!inspectParticipant.logs || inspectParticipant.logs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Belum ada foto snapshot kamera untuk kandidat ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {inspectParticipant.logs.map((log, lIdx) => (
                      <div
                        key={log.id || lIdx}
                        className="flex flex-col gap-1 p-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative">
                          <img
                            src={log.mediaUrl}
                            alt={`Audit Snapshot ${lIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span className="font-semibold uppercase truncate">{log.logType || 'Audit'}</span>
                          <span>
                            {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
