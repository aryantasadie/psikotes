'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Building2, 
  Users, 
  Search, 
  Trash2, 
  Eye, 
  Loader2, 
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { isParticipantCompleted, parseSequence } from '@/lib/testCompletion';
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

interface BatchSessionGroup {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  clientName: string;
  assignedTesters: string[];
  batteryTestStr: string;
  sequence: string[];
  totalParticipants: number;
  completedParticipants: number;
  completedReports: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (!['superadmin', 'psikolog', 'tester'].includes(userRole)) {
        router.replace('/');
      }
    }
  }, [session, status, router]);

  const fetchParticipants = () => {
    setLoading(true);
    fetch('/api/superadmin/reports')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setParticipants(data.participants || []);
          setAssignedTests(data.assignedTests || []);
        } else {
          setParticipants(Array.isArray(data) ? data : []);
          setAssignedTests([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDeleteBatch = async (batch: BatchSessionGroup) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permanen Batch "${batch.title}"?\n\nSemua data terkait (${batch.totalParticipants} peserta, seluruh jawaban tes, rekaman kamera/keamanan, dan hasil psikogram) akan dihapus permanen.`)) {
      return;
    }

    setDeletingId(batch.id);
    try {
      const res = await fetch(`/api/superadmin/schedule/batches?id=${batch.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Batch dan seluruh data peserta berhasil dihapus');
        fetchParticipants();
      } else {
        alert(`Gagal menghapus batch: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (e) {
      console.error('Failed to delete batch:', e);
      alert('Terjadi kesalahan saat menghapus batch.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && ['superadmin', 'psikolog', 'tester'].includes((session?.user as any)?.role)) {
      fetchParticipants();
    }
  }, [status, session]);

  if (status === 'loading' || !['superadmin', 'psikolog', 'tester'].includes((session?.user as any)?.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span>Memuat data laporan…</span>
      </div>
    );
  }

  // Group participants by Batch Session
  const batchesMap = new Map<number, BatchSessionGroup>();

  assignedTests.forEach(test => {
    const testId = test.id;
    const title = test.title || 'Sesi Tanpa Judul';
    const startDate = test.startDate;
    const clientName = test.client?.name || 'Umum / Internal';
    const jobPositionName = test.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

    const testToolsArr = parseSequence(test.sequence);
    const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'Standar';

    batchesMap.set(testId, {
      id: testId,
      title,
      startDate,
      jobPositionName,
      clientName,
      assignedTesters: ['Tim Pengawas'],
      batteryTestStr,
      sequence: testToolsArr,
      totalParticipants: 0,
      completedParticipants: 0,
      completedReports: 0
    });
  });

  participants.forEach(p => {
    const testId = p.testId || p.test?.id || 0;
    
    let b = batchesMap.get(testId);
    if (!b) {
      const testObj = p.test || {};
      const title = testObj.title || 'Sesi Tanpa Judul';
      const startDate = p.startTime || testObj.startDate;
      const clientName = testObj.client?.name || 'Umum / Internal';
      const jobPositionName = p.jobPosition?.name || testObj.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

      const testToolsArr = parseSequence(testObj.sequence);
      const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'Standar';

      b = {
        id: testId,
        title,
        startDate,
        jobPositionName,
        clientName,
        assignedTesters: ['Tim Pengawas'],
        batteryTestStr,
        sequence: testToolsArr,
        totalParticipants: 0,
        completedParticipants: 0,
        completedReports: 0
      };
      batchesMap.set(testId, b);
    }

    b.totalParticipants += 1;
    if (isParticipantCompleted(p, b.sequence || [])) {
      b.completedParticipants += 1;
    }
    if (p.psychoResults && ['REVIEWED', 'RELEASED'].includes(p.psychoResults.status)) {
      b.completedReports += 1;
    }
  });

  const batchesList = Array.from(batchesMap.values());

  const filteredBatches = batchesList.filter(b => {
    const s = search.toLowerCase();
    const titleMatch = (b.title || '').toLowerCase().includes(s);
    const clientMatch = (b.clientName || '').toLowerCase().includes(s);
    const jobMatch = (b.jobPositionName || '').toLowerCase().includes(s);
    return titleMatch || clientMatch || jobMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Laporan & QC Review Hasil Asesmen
        </h2>
        <p className="text-sm text-slate-500">
          Tinjau kelengkapan jawaban peserta, integritas pengawasan, dan hasil skor psikogram
        </p>
      </div>

      {/* Main Batch Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Batch Sesi Ujian & QC Review
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Seluruh batch aktif, jumlah peserta, dan riwayat status kelulusan asesmen
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Cari batch, jabatan, atau klien…" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Batch & Tanggal</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Battery Test</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Klien Perusahaan</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Tester PJ</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Jumlah Peserta</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Peserta Selesai Tes</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Laporan Selesai Dibuat</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat daftar batch laporan & QC review…
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    Belum ada batch hasil ujian yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama Batch & Tanggal */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900">{b.title}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa Tanggal'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Battery Test */}
                    <TableCell className="text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{b.batteryTestStr}</span>
                      </div>
                    </TableCell>

                    {/* Klien Perusahaan */}
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.clientName}</span>
                      </div>
                    </TableCell>

                    {/* Tester PJ */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {b.assignedTesters.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    {/* Jumlah Peserta */}
                    <TableCell>
                      <span className="text-xs font-bold text-slate-900">{b.totalParticipants} Peserta</span>
                    </TableCell>

                    {/* Peserta Selesai Tes (Angka langsung, tanpa per total, warna standar) */}
                    <TableCell>
                      <Badge 
                        variant={b.completedParticipants > 0 ? "success" : "secondary"}
                        className="text-xs font-semibold gap-1 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{b.completedParticipants} Selesai</span>
                      </Badge>
                    </TableCell>

                    {/* Laporan Selesai Dibuat (Angka langsung, tanpa per total) */}
                    <TableCell>
                      <Badge 
                        variant={b.completedReports > 0 ? "success" : "secondary"}
                        className="text-xs font-semibold gap-1 whitespace-nowrap"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{b.completedReports} Selesai</span>
                      </Badge>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button asChild size="sm" className="h-8 px-3 text-xs gap-1">
                          <Link href={`/superadmin/reports/batch/${b.id}`}>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Akun</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBatch(b)}
                          disabled={deletingId === b.id}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === b.id ? 'Menghapus…' : 'Hapus'}</span>
                        </Button>
                      </div>
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
