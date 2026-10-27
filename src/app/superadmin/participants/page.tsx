'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  ClipboardList,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  completedParticipants: number;
}

export default function ParticipantsPage() {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignedTests, setAssignedTests] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Navigation State
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/reports');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setParticipants(data.participants || []);
          setAssignedTests(data.assignedTests || []);
        } else {
          setParticipants(Array.isArray(data) ? data : []);
          setAssignedTests([]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch participants:', e);
    } finally {
      setLoading(false);
    }
  };

  // Group participants by Batch Session (Test)
  const batchesMap = new Map<number, BatchGroup>();

  // Pre-populate batchesMap with all assigned tests to ensure even empty ones are shown
  assignedTests.forEach(test => {
    const testId = test.id;
    const title = test.title || 'Sesi Tanpa Judul';
    const startDate = test.startDate;
    const clientName = test.client?.name || 'Umum / Internal';
    const jobPositionName = test.jobPosition?.name || '-';

    let batteryTestStr = '-';
    if (test.sequence) {
      try {
        const parsed = JSON.parse(test.sequence);
        if (Array.isArray(parsed) && parsed.length > 0) {
          batteryTestStr = parsed.join(' + ');
        }
      } catch (e) {}
    }

    batchesMap.set(testId, {
      id: testId,
      title,
      startDate,
      batteryTestStr,
      clientName,
      jobPositionName,
      totalParticipants: 0,
      completedParticipants: 0,
    });
  });

  // Calculate actual participant stats per batch
  participants.forEach((p) => {
    const testId = p.testId || p.test?.id;
    if (!testId) return;

    if (!batchesMap.has(testId)) {
      const title = p.test?.title || 'Sesi Tanpa Judul';
      const startDate = p.test?.startDate;
      const clientName = p.test?.client?.name || 'Umum / Internal';
      const jobPositionName = p.test?.jobPosition?.name || '-';

      let batteryTestStr = '-';
      if (p.test?.sequence) {
        try {
          const parsed = JSON.parse(p.test.sequence);
          if (Array.isArray(parsed) && parsed.length > 0) {
            batteryTestStr = parsed.join(' + ');
          }
        } catch (e) {}
      }

      batchesMap.set(testId, {
        id: testId,
        title,
        startDate,
        batteryTestStr,
        clientName,
        jobPositionName,
        totalParticipants: 0,
        completedParticipants: 0,
      });
    }

    const b = batchesMap.get(testId)!;
    b.totalParticipants += 1;
    if (p.status === 'completed') {
      b.completedParticipants += 1;
    }
  });

  const batchesList = Array.from(batchesMap.values());

  // Filter batches for Level 1 view
  const filteredBatches = batchesList.filter(b => {
    const s = search.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(s) ||
      (b.clientName || '').toLowerCase().includes(s) ||
      (b.jobPositionName || '').toLowerCase().includes(s)
    );
  });

  // Filter participants for Level 2 view (Specific Batch)
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

  // Metrics
  const totalParticipantsCount = participants.length;
  const totalCompleted = participants.filter((p) => p.status === 'completed').length;
  const totalInProgress = participants.filter((p) => p.status === 'in_progress').length;
  const totalPending = participants.filter((p) => p.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── KPI Cards (Always visible) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-black text-sky-800 leading-none">{batchesList.length}</span>
              <span className="text-xs font-semibold text-slate-700 mt-1">Total Sesi Ujian</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-black text-violet-800 leading-none">{totalParticipantsCount}</span>
              <span className="text-xs font-semibold text-slate-700 mt-1">Total Peserta</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-black text-emerald-800 leading-none">{totalCompleted}</span>
              <span className="text-xs font-semibold text-slate-700 mt-1">Selesai Ujian</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-black text-amber-800 leading-none">{totalInProgress}</span>
              <span className="text-xs font-semibold text-slate-700 mt-1">Sedang Mengerjakan</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-black text-slate-700 leading-none">{totalPending}</span>
              <span className="text-xs font-semibold text-slate-700 mt-1">Belum Mulai</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table Card ── */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-5">
          
          {/* Back Link or Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {selectedBatchId !== null ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBatchId(null);
                    setSearch('');
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar Sesi
                </Button>
                <div className="border-l border-slate-200 h-6 hidden sm:block"></div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-slate-900 text-sm">{currentBatch?.title}</h3>
                  <p className="text-xs text-slate-400">Klien: {currentBatch?.clientName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-slate-900 text-sm">Daftar Sesi Ujian & Peserta</h3>
                <p className="text-xs text-slate-400">Pilih salah satu sesi di bawah untuk melihat daftar akun dan data peserta.</p>
              </div>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={selectedBatchId !== null ? "Cari nama peserta / ID..." : "Cari batch, klien, posisi..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

          </div>

          {/* Dynamic Table Content */}
          {selectedBatchId === null ? (
            
            /* ── LEVEL 1: BATCH LIST VIEW ── */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Batch & Tanggal</TableHead>
                  <TableHead>Battery Test</TableHead>
                  <TableHead>Klien Perusahaan</TableHead>
                  <TableHead>Tester PJ</TableHead>
                  <TableHead>Jumlah Peserta</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      Memuat data sesi...
                    </TableCell>
                  </TableRow>
                ) : filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      Tidak ada batch sesi ujian yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900">{b.title}</span>
                          <span className="text-xs text-slate-400">
                            {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600 font-semibold text-xs">{b.batteryTestStr}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {b.clientName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary">
                          {session?.user?.name || 'Tester'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 text-xs">{b.totalParticipants} Peserta</span>
                          <span className="text-xs text-slate-400">
                            {b.completedParticipants}/{b.totalParticipants} Selesai
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBatchId(b.id);
                            setSearch('');
                          }}
                        >
                          Lihat Peserta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            
            /* ── LEVEL 2: PARTICIPANTS IN BATCH VIEW ── */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Peserta & Akun</TableHead>
                  <TableHead>Posisi / Jabatan</TableHead>
                  <TableHead>Battery Test</TableHead>
                  <TableHead>Status Pengerjaan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      Tidak ada peserta terdaftar di batch ini yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipants.map((p, index) => {
                    let testModules: string[] = [];
                    try {
                      testModules = JSON.parse(p.test.sequence || '[]');
                    } catch (e) {}

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold text-slate-400 text-xs">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-900">{p.user.name}</span>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                              ID: <span className="font-mono">{p.user.username}</span>
                              {p.plainPassword && (
                                <> &bull; Pass: <span className="font-mono text-teal-700 font-bold bg-teal-50 px-1 py-0.5 rounded text-xs">{p.plainPassword}</span></>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800 text-xs">
                          {p.test.jobPosition?.name || p.test.title || '-'}
                        </TableCell>
                        <TableCell>
                          {testModules.length > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              {testModules.join(' + ')}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 italic text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.status === 'completed' ? (
                            <Badge variant="success">
                              <CheckCircle2 className="h-3 w-3" />
                              Selesai Ujian
                            </Badge>
                          ) : p.status === 'in_progress' ? (
                            <Badge variant="warning">
                              <Clock className="h-3 w-3" />
                              Sedang Mengerjakan
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Menunggu Ujian
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status === 'completed' && (
                            <Link href={`/superadmin/reports/${p.id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-teal-500 text-teal-700 hover:bg-teal-50 font-semibold">
                                Lihat Hasil
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>

    </div>
  );
}
