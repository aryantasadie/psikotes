'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Building2, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Loader2,
  Eye
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

interface Participant {
  id: number;
  userId: number;
  testId: number;
  status: string;
  plainPassword?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  user: {
    name: string;
    username: string;
  };
  test: {
    id: number;
    title: string;
    sequence?: string | null;
    startDate?: string | null;
    client?: {
      name: string;
    } | null;
    jobPosition?: {
      name: string;
    } | null;
  };
  logs?: {
    id: number;
    logType: string;
    mediaUrl: string;
    createdAt: string;
  }[];
}

interface TestBatch {
  id: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  sequence?: string | null;
  client?: {
    name: string;
  } | null;
  jobPosition?: {
    name: string;
  } | null;
}

interface BatchGroup {
  id: number;
  title: string;
  startDate?: string | null;
  batteryTestStr: string;
  clientName: string;
  jobPositionName: string;
  totalParticipants: number;
  completedCount: number;
  inProgressCount: number;
  violationCount: number;
}

export default function ProctoringCenterPage() {
  const { data: session, status: authStatus } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignedTests, setAssignedTests] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Navigation States
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

  const navigateTo = (batchId: number | null, participantId: number | null) => {
    setSelectedBatchId(batchId);
    setSelectedParticipantId(participantId);
    setSearch('');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (batchId !== null) params.set('batchId', String(batchId));
      if (participantId !== null) params.set('participantId', String(participantId));
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({ batchId, participantId }, '', newUrl);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readUrlState = () => {
        const params = new URLSearchParams(window.location.search);
        const bId = params.get('batchId');
        const pId = params.get('participantId');
        setSelectedBatchId(bId && !isNaN(Number(bId)) ? Number(bId) : null);
        setSelectedParticipantId(pId && !isNaN(Number(pId)) ? Number(pId) : null);
      };
      readUrlState();
      window.addEventListener('popstate', readUrlState);
      return () => window.removeEventListener('popstate', readUrlState);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/proctor');
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setAssignedTests(data.assignedTests || []);
      }
    } catch (e) {
      console.error('Failed to load proctoring data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group participants by Batch
  const batchesMap = new Map<number, BatchGroup>();

  assignedTests.forEach(test => {
    const testId = test.id;
    const title = test.title || 'Sesi Tanpa Judul';
    const startDate = test.startDate;
    const clientName = test.client?.name || 'Umum / Internal';
    const jobPositionName = test.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

    let testToolsArr = [];
    if (test.sequence) {
      try { testToolsArr = JSON.parse(test.sequence); } catch {}
    }
    const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'Standar';

    batchesMap.set(testId, {
      id: testId,
      title,
      startDate,
      batteryTestStr,
      clientName,
      jobPositionName,
      totalParticipants: 0,
      completedCount: 0,
      inProgressCount: 0,
      violationCount: 0,
    });
  });

  participants.forEach(p => {
    const testId = p.testId || p.test?.id || 0;
    let b = batchesMap.get(testId);
    if (!b) {
      const testObj = p.test || ({} as any);
      const title = testObj.title || 'Sesi Tanpa Judul';
      const startDate = p.startTime || testObj.startDate;
      const clientName = testObj.client?.name || 'Umum / Internal';
      const jobPositionName = p.test?.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

      let testToolsArr = [];
      if (testObj.sequence) {
        try { testToolsArr = JSON.parse(testObj.sequence); } catch {}
      }
      const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'Standar';

      b = {
        id: testId,
        title,
        startDate,
        batteryTestStr,
        clientName,
        jobPositionName,
        totalParticipants: 0,
        completedCount: 0,
        inProgressCount: 0,
        violationCount: 0,
      };
      batchesMap.set(testId, b);
    }

    b.totalParticipants += 1;
    if (p.status === 'completed') {
      b.completedCount += 1;
    } else if (p.status === 'in_progress') {
      b.inProgressCount += 1;
    }
    
    const candidateViolations = (p.logs || []).filter((l) => 
      l.logType.includes('tab_switch') || 
      l.logType.includes('fullscreen') || 
      l.logType.includes('forbidden') ||
      l.logType.includes('violation')
    ).length;

    b.violationCount += candidateViolations;
  });

  const batchesList = Array.from(batchesMap.values());

  const filteredBatches = batchesList.filter(b => {
    const s = search.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(s) ||
      (b.clientName || '').toLowerCase().includes(s) ||
      (b.jobPositionName || '').toLowerCase().includes(s)
    );
  });

  const currentBatch = batchesList.find(b => b.id === selectedBatchId);
  const filteredParticipants = participants
    .filter(p => p.testId === selectedBatchId)
    .filter(p => {
      const s = search.toLowerCase();
      return (
        (p.user.name || '').toLowerCase().includes(s) ||
        (p.user.username || '').toLowerCase().includes(s) ||
        (p.test.jobPosition?.name || '').toLowerCase().includes(s)
      );
    });

  const currentParticipant = participants.find(p => p.id === selectedParticipantId);

  return (
    <div className="flex flex-col gap-6">
      {/* Main Container Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {selectedParticipantId !== null ? (
              /* Breadcrumbs Level 3 */
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo(selectedBatchId ?? currentParticipant?.testId ?? null, null)}
                  className="gap-1.5 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Daftar Peserta</span>
                </Button>
                <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Log Pengawasan: {currentParticipant?.user.name}
                    </CardTitle>
                    {currentParticipant?.status === 'completed' ? (
                      <Badge variant="success" className="text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Selesai</span>
                      </Badge>
                    ) : currentParticipant?.status === 'in_progress' ? (
                      <Badge variant="warning" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Mengerjakan</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Belum Mulai</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Username: {currentParticipant?.user.username}
                  </CardDescription>
                </div>
              </div>
            ) : selectedBatchId !== null ? (
              /* Breadcrumbs Level 2 */
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo(null, null)}
                  className="gap-1.5 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Daftar Sesi</span>
                </Button>
                <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base font-bold text-slate-900">
                    {currentBatch?.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Klien: {currentBatch?.clientName}
                  </CardDescription>
                </div>
              </div>
            ) : (
              /* Title Level 1 */
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base font-bold text-slate-900">
                  Log Pengawasan: Rekaman Layar & Kamera
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tinjau rekaman kamera dan tangkapan layar desktop untuk mendeteksi kecurangan
                </CardDescription>
              </div>
            )}

            {/* Search Box */}
            {selectedParticipantId === null && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={selectedBatchId !== null ? "Cari nama peserta / ID..." : "Cari batch, klien..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* LEVEL 3: TIMELINE VIEW */}
          {selectedParticipantId !== null ? (
            <div className="p-6">
              {(!currentParticipant?.logs || currentParticipant.logs.length === 0) ? (
                <div className="py-12 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl text-sm">
                  Belum ada rekaman foto kamera dan log keamanan yang tersimpan untuk peserta ini.
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
                  {[...currentParticipant.logs]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((log: any, idx: number) => {
                      const logTime = new Date(log.createdAt);
                      const timeStr = logTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + logTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

                      const isProctorNote = log.logType === 'proctor_note';
                      const isPhoto = log.logType.includes('camera') || log.logType.includes('initial') || log.logType.includes('photo') || log.mediaUrl.startsWith('data:image') || log.mediaUrl.startsWith('/api/uploads/') || log.mediaUrl.startsWith('/uploads/') || log.mediaUrl.endsWith('.jpg') || log.mediaUrl.endsWith('.png') || log.mediaUrl.endsWith('.webp');

                      if (isProctorNote) {
                        return (
                          <div key={log.id || idx} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Catatan Pengawas • {timeStr}</span>
                              </span>
                              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                                Catatan Khusus
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-800 font-medium pl-2 border-l-2 border-amber-400">
                              {log.mediaUrl}
                            </p>
                          </div>
                        );
                      }

                      if (!isPhoto) {
                        return (
                          <div key={log.id || idx} className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Log Pelanggaran Ujian • {timeStr}</span>
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                Pelanggaran
                              </Badge>
                            </div>
                            <div className="bg-white/80 border border-rose-100 rounded-lg p-2.5 text-xs text-slate-800 font-semibold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>{log.mediaUrl}</span>
                            </div>
                          </div>
                        );
                      }

                      const isInitial = log.logType.includes('awal') || log.logType.includes('initial');
                      const is10Min = log.logType.includes('10min');
                      const photoBadge = isInitial ? 'Foto Awal (Identitas)' : is10Min ? 'Foto Menit ke-10 (1x)' : 'Pengawasan Kamera';
                      const imgUrl = log.mediaUrl.startsWith('/uploads/') ? log.mediaUrl.replace('/uploads/', '/api/uploads/') : log.mediaUrl;

                      return (
                        <div key={log.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-900">{timeStr}</span>
                              <span className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                <span>{photoBadge}</span>
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
                              {isInitial ? 'Verifikasi Identitas' : is10Min ? 'Verifikasi Menit ke-10' : 'Pengawasan Kamera'}
                            </Badge>
                          </div>

                          <div className="max-w-md flex flex-col gap-1.5">
                            <img
                              src={imgUrl}
                              alt="Webcam Capture"
                              className="w-full max-h-72 object-cover border border-slate-200 rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : selectedBatchId !== null ? (
            /* LEVEL 2: CANDIDATE LIST */
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-xs font-bold uppercase text-slate-500">No</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Peserta & Akun</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Posisi / Jabatan</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Status Pengerjaan</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Status Keamanan</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                      Tidak ada peserta terdaftar di batch ini yang sesuai dengan kriteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipants.map((p, index) => {
                    const candidateViolations = (p.logs || []).filter((l) => 
                      l.logType.includes('tab_switch') || 
                      l.logType.includes('fullscreen') || 
                      l.logType.includes('forbidden') ||
                      l.logType.includes('violation')
                    ).length;

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="text-xs font-semibold text-slate-400">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-900">{p.user.name}</span>
                            <span className="text-xs font-mono text-slate-400">{p.user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-700">
                          {p.test.jobPosition?.name || p.test.title || '-'}
                        </TableCell>
                        <TableCell>
                          {p.status === 'completed' ? (
                            <Badge variant="success" className="text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selesai Ujian</span>
                            </Badge>
                          ) : p.status === 'in_progress' ? (
                            <Badge variant="warning" className="text-xs gap-1">
                              <Clock className="w-3 h-3 animate-spin" />
                              <span>Sedang Mengerjakan</span>
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Belum Mulai</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {candidateViolations > 0 ? (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              <span>{candidateViolations}x Pelanggaran</span>
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-xs gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Aman</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => navigateTo(selectedBatchId ?? p.testId, p.id)}
                            className="h-8 px-3 text-xs gap-1"
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
          ) : (
            /* LEVEL 1: BATCH LIST */
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Batch & Tanggal</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Klien Perusahaan</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Tester PJ</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Jumlah Peserta</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Status Keamanan</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      Memuat data pengawasan...
                    </TableCell>
                  </TableRow>
                ) : filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                      Tidak ada batch sesi ujian yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((b) => (
                    <TableRow key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900">{b.title}</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.clientName}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                          Tim Pengawas
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-900">{b.totalParticipants} Peserta</span>
                          <span className="text-xs text-slate-500">
                            {b.completedCount} Selesai · {b.inProgressCount} Mengerjakan
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {b.violationCount > 0 ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>{b.violationCount}x Pelanggaran</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xs gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Aman</span>
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => navigateTo(b.id, null)}
                          className="h-8 px-3 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Akun</span>
                        </Button>
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
