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
  FileText,
  User,
  X
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
  assignedPsikologs: string[];
  psikograms: string[];
  batteryTestStr: string;
  sequence: string[];
  totalParticipants: number;
  completedParticipants: number;
  completedReports: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const [participants, setParticipants] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'batch' | 'participant'>('batch');
  const [participantResults, setParticipantResults] = useState<any[]>([]);
  const [searchingParticipants, setSearchingParticipants] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounced server search for participants across batches
  useEffect(() => {
    if (searchMode !== 'participant') return;

    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setParticipantResults([]);
      setSearchingParticipants(false);
      return;
    }

    setSearchingParticipants(true);
    const timer = setTimeout(() => {
      fetch(`/api/superadmin/reports/search-participant?q=${encodeURIComponent(trimmed)}`)
        .then(res => res.json())
        .then(data => {
          setParticipantResults(data.participants || []);
          setSearchingParticipants(false);
        })
        .catch(err => {
          console.error('Search participant error:', err);
          setSearchingParticipants(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [search, searchMode]);

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

    const initialPsikograms: string[] = [];
    if (test.jobPosition?.name) {
      initialPsikograms.push(test.jobPosition.name);
    }

    batchesMap.set(testId, {
      id: testId,
      title,
      startDate,
      jobPositionName,
      clientName,
      assignedTesters: test.assignedTesters || [],
      assignedPsikologs: test.assignedPsikologs || [],
      psikograms: initialPsikograms,
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

      const initialPsikograms: string[] = [];
      if (p.jobPosition?.name) initialPsikograms.push(p.jobPosition.name);
      else if (testObj.jobPosition?.name) initialPsikograms.push(testObj.jobPosition.name);

      b = {
        id: testId,
        title,
        startDate,
        jobPositionName,
        clientName,
        assignedTesters: testObj.assignedTesters || [],
        assignedPsikologs: testObj.assignedPsikologs || [],
        psikograms: initialPsikograms,
        batteryTestStr,
        sequence: testToolsArr,
        totalParticipants: 0,
        completedParticipants: 0,
        completedReports: 0
      };
      batchesMap.set(testId, b);
    }

    if (p.jobPosition?.name && !b.psikograms.includes(p.jobPosition.name)) {
      b.psikograms.push(p.jobPosition.name);
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
    const psikogramMatch = (b.psikograms || []).some(psi => psi.toLowerCase().includes(s));
    return titleMatch || clientMatch || jobMatch || psikogramMatch;
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
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                {searchMode === 'batch' ? 'Daftar Batch Sesi Ujian & QC Review' : 'Pencarian Peserta Lintas Seluruh Batch'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {searchMode === 'batch' 
                  ? 'Seluruh batch aktif, jumlah peserta, dan riwayat status kelulusan asesmen'
                  : 'Cari peserta berdasarkan nama atau username untuk langsung melihat laporan dan asal batch-nya'}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Tombol Switch Mode: Cari Batch vs Cari Peserta */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('batch');
                    setSearch('');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    searchMode === 'batch'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cari Batch</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('participant');
                    setSearch('');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    searchMode === 'participant'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Cari Peserta</span>
                </button>
              </div>

              {/* Input Pencarian dengan tombol bersihkan (X) */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder={searchMode === 'batch' ? 'Cari batch, jabatan, atau klien…' : 'Ketik nama / username peserta…'} 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {searchMode === 'participant' ? (
            <Table containerClassName="max-h-[calc(100vh-295px)] min-h-[380px] overflow-auto">
              <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Nama & Akun Peserta</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Asal Batch Ujian</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Posisi / Jabatan</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Status Tes</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Status Evaluasi</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchingParticipants ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      Mencari data peserta di seluruh batch…
                    </TableCell>
                  </TableRow>
                ) : search.trim().length < 2 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Mode Pencarian Peserta Lintas Batch</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ketik minimal 2 huruf nama lengkap atau username peserta pada kolom pencarian di atas.</p>
                    </TableCell>
                  </TableRow>
                ) : participantResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada peserta yang cocok dengan kata kunci &quot;{search}&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  participantResults.map((p) => {
                    const isCompleted = p.status === 'completed';
                    const isReviewed = p.psychoResults?.status === 'RELEASED' || p.psychoResults?.status === 'REVIEWED';
                    const batchTitle = p.test?.title || 'Sesi Tanpa Judul';
                    const clientName = p.test?.client?.name || 'Umum / Internal';
                    const positionName = p.jobPosition?.name || p.test?.jobPosition?.name || 'Standar';

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Nama & Akun Peserta */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-900">{p.user?.name || 'Peserta'}</span>
                            <span className="text-xs font-mono text-slate-500">ID: {p.user?.username || '-'}</span>
                          </div>
                        </TableCell>

                        {/* Asal Batch Ujian */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-900">{batchTitle}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[11px] bg-slate-100 text-slate-700 border-slate-200">
                                <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                                {clientName}
                              </Badge>
                              {p.test?.startDate && (
                                <span className="text-[11px] text-slate-400">
                                  {new Date(p.test.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Posisi / Jabatan */}
                        <TableCell className="text-xs font-semibold text-slate-700">
                          {positionName}
                        </TableCell>

                        {/* Status Tes */}
                        <TableCell>
                          <Badge 
                            variant={isCompleted ? "success" : (p.status === 'in_progress' ? "warning" : "secondary")}
                            className="text-xs font-semibold gap-1 whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isCompleted ? 'Selesai Tes' : (p.status === 'in_progress' ? 'Sedang Tes' : 'Belum Mulai')}</span>
                          </Badge>
                        </TableCell>

                        {/* Status Evaluasi */}
                        <TableCell>
                          <Badge 
                            variant={isReviewed ? "success" : (isCompleted ? "warning" : "secondary")}
                            className="text-xs font-semibold gap-1 whitespace-nowrap"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isReviewed ? 'Laporan Rilis' : (isCompleted ? 'Menunggu Review' : 'Belum Ada')}</span>
                          </Badge>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Button asChild size="sm" className="h-8 px-3 text-xs gap-1 bg-teal-600 hover:bg-teal-700">
                              <Link href={`/superadmin/reports/${p.id}`}>
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat Laporan</span>
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1 text-slate-700">
                              <Link href={`/superadmin/reports/batch/${p.testId}`}>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Buka Batch</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Table containerClassName="max-h-[calc(100vh-295px)] min-h-[380px] overflow-auto">
              <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Nama Batch & Tanggal</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Psikogram</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Battery Test</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Klien Perusahaan</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 shadow-[inset_0_-1px_0_#e2e8f0]">Tim PJ</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 text-center whitespace-nowrap shadow-[inset_0_-1px_0_#e2e8f0]">
                    <div className="flex flex-col items-center">
                      <span>Progres Peserta</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase tracking-normal">Total • Tes • Laporan</span>
                    </div>
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 font-bold text-xs uppercase text-slate-500 py-3.5 text-right shadow-[inset_0_-1px_0_#e2e8f0]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      Memuat daftar batch laporan & QC review…
                    </TableCell>
                  </TableRow>
                ) : filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                      {userRole === 'superadmin' 
                        ? 'Belum ada batch hasil ujian yang ditemukan.' 
                        : 'Belum ada batch ujian yang ditugaskan kepada akun Anda. Silakan hubungi Superadmin.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((b) => (
                    <TableRow key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nama Batch & Tanggal */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                          <span className="text-xs font-bold text-slate-900 leading-snug">{b.title}</span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa Tanggal'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Psikogram (List psikogram jabatan yang dipakai) */}
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {b.psikograms && b.psikograms.length > 0 ? (
                            b.psikograms.map((psi, i) => (
                              <Badge key={i} variant="outline" className="text-[11px] font-semibold bg-purple-50 text-purple-700 border-purple-200 py-0.5 px-2">
                                {psi}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Standar Umum</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Battery Test (Ruang lebih lega, muat banyak tes ke samping) */}
                      <TableCell className="py-3">
                        <div className="flex flex-wrap items-center gap-1 min-w-[220px] leading-relaxed">
                          {b.sequence && b.sequence.length > 0 ? (
                            b.sequence.map((testName, i) => (
                              <span key={i} className="inline-flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10.5px] font-semibold border border-slate-200/90 whitespace-nowrap">
                                  {testName}
                                </span>
                                {i < b.sequence.length - 1 && (
                                  <span className="text-slate-400 text-[10px] font-bold">+</span>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-600 break-words whitespace-normal font-mono">{b.batteryTestStr}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Klien Perusahaan */}
                      <TableCell className="py-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{b.clientName}</span>
                        </div>
                      </TableCell>

                      {/* Tim PJ: Tester & Psikolog (Tampil nama PJ jika ada, strip jika kosong) */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          {/* Tester PJ */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 uppercase tracking-wider shrink-0">Tester</span>
                            {b.assignedTesters && b.assignedTesters.length > 0 ? (
                              <span className="text-xs font-semibold text-slate-800 truncate max-w-[110px]" title={b.assignedTesters.join(', ')}>
                                {b.assignedTesters.join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </div>
                          {/* Psikolog PJ */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase tracking-wider shrink-0">Psikolog</span>
                            {b.assignedPsikologs && b.assignedPsikologs.length > 0 ? (
                              <span className="text-xs font-semibold text-slate-800 truncate max-w-[110px]" title={b.assignedPsikologs.join(', ')}>
                                {b.assignedPsikologs.join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Progres Peserta (Dipress rapat jadi 1 grup ringkas: Total • Tes • Laporan) */}
                      <TableCell className="text-center py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-50/80 rounded-lg border border-slate-200/60 shadow-2xs">
                          {/* Total Peserta */}
                          <span 
                            className="text-xs font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            title={`Total Peserta: ${b.totalParticipants}`}
                          >
                            {b.totalParticipants}
                          </span>
                          {/* Peserta Selesai Tes */}
                          <span 
                            className={`inline-flex items-center justify-center text-xs font-bold font-mono px-2 py-0.5 rounded min-w-[28px] ${
                              b.completedParticipants > 0 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title={`Peserta Selesai Tes: ${b.completedParticipants}`}
                          >
                            {b.completedParticipants}
                          </span>
                          {/* Laporan Selesai Dibuat */}
                          <span 
                            className={`inline-flex items-center justify-center text-xs font-bold font-mono px-2 py-0.5 rounded min-w-[28px] ${
                              b.completedReports > 0 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title={`Laporan Selesai Dibuat: ${b.completedReports}`}
                          >
                            {b.completedReports}
                          </span>
                        </div>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right py-3">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button asChild size="sm" className="h-7 px-2.5 text-xs gap-1 bg-teal-600 hover:bg-teal-700">
                            <Link href={`/superadmin/reports/batch/${b.id}`}>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Akun</span>
                            </Link>
                          </Button>
                          {userRole === 'superadmin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteBatch(b)}
                              disabled={deletingId === b.id}
                              className="h-7 px-2 text-xs"
                              title="Hapus Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
