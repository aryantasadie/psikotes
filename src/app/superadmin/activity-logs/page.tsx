'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  CalendarDays,
  Globe,
  Laptop,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface ActivityLog {
  id: number;
  userId?: number | null;
  username: string;
  name?: string | null;
  role?: string | null;
  status: 'SUCCESS' | 'FAILED';
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface LogStats {
  totalAttempts: number;
  todayAttempts: number;
  successCount: number;
  failedCount: number;
  lockedOrInactiveCount: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ActivityLogsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    totalAttempts: 0,
    todayAttempts: 0,
    successCount: 0,
    failedCount: 0,
    lockedOrInactiveCount: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const [pruneDays, setPruneDays] = useState(30);
  const [pruning, setPruning] = useState(false);
  const [pruneMessage, setPruneMessage] = useState<string | null>(null);

  // Superadmin guard
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'superadmin') {
        router.replace('/');
      }
    }
  }, [session, authStatus, router]);

  const fetchLogs = useCallback(
    async (pageToFetch = pagination.page) => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        query.set('page', pageToFetch.toString());
        query.set('limit', '25');

        if (statusFilter !== 'ALL') {
          query.set('status', statusFilter);
        }
        if (reasonFilter !== 'ALL') {
          query.set('reason', reasonFilter);
        }
        if (search.trim()) {
          query.set('search', search.trim());
        }

        const res = await fetch(`/api/superadmin/activity-logs?${query.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat log aktivitas');

        const data = await responseToJson(res);
        setLogs(data.logs || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, statusFilter, reasonFilter, search]
  );

  async function responseToJson(res: Response) {
    return await res.json();
  }

  // Initial fetch and trigger on filter change
  useEffect(() => {
    fetchLogs(1);
  }, [statusFilter, reasonFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogs(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handlePruneLogs = async () => {
    setPruning(true);
    setPruneMessage(null);
    try {
      const res = await fetch(`/api/superadmin/activity-logs?days=${pruneDays}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membersihkan log');

      setPruneMessage(data.message || `Berhasil membersihkan data log yang lebih lama dari ${pruneDays} hari.`);
      setTimeout(() => {
        setIsPruneModalOpen(false);
        setPruneMessage(null);
        fetchLogs(1);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus log');
    } finally {
      setPruning(false);
    }
  };

  const parseUserAgent = (ua?: string | null) => {
    if (!ua) return 'Perangkat Tidak Diketahui';
    let browser = 'Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    let os = 'OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} • ${os}`;
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return (
        new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta',
        }).format(d) + ' WIB'
      );
    } catch (e) {
      return isoString;
    }
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role) {
      return (
        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">
          Tidak Terdaftar
        </Badge>
      );
    }
    switch (role.toLowerCase()) {
      case 'superadmin':
        return <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">Superadmin</Badge>;
      case 'psikolog':
        return <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">Psikolog</Badge>;
      case 'tester':
        return <Badge className="text-[10px] bg-teal-100 text-teal-700 border-teal-200">Tester</Badge>;
      case 'client':
        return <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Klien</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300">Peserta</Badge>;
    }
  };

  const getReasonBadge = (status: string, reason?: string | null) => {
    if (status === 'SUCCESS') {
      return (
        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Login Berhasil
        </Badge>
      );
    }

    switch (reason) {
      case 'WRONG_PASSWORD':
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 gap-1 font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Password Salah
          </Badge>
        );
      case 'USER_NOT_FOUND':
        return (
          <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 border-slate-200 gap-1 font-medium">
            <XCircle className="w-3 h-3 text-slate-500" />
            Username Tidak Ditemukan
          </Badge>
        );
      case 'ACCOUNT_LOCKED':
        return (
          <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200 gap-1 font-semibold">
            <Lock className="w-3 h-3 text-rose-600" />
            Akun Terkunci (Limit Salah)
          </Badge>
        );
      case 'ACCOUNT_INACTIVE':
        return (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            Akun Dinonaktifkan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200 gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            Gagal Autentikasi
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log Aktivitas Akun</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit rekam jejak setiap percobaan login (berhasil maupun gagal), pantau potensi ancaman brute-force, dan kelola retensi log.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
            className="h-9 gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPruneModalOpen(true)}
            className="h-9 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Log Lama</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Percobaan */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Percobaan</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalAttempts}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua riwayat tercatat</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <History className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Hari Ini */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Percobaan Hari Ini</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.todayAttempts}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sejak 00:00 WIB</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Login Berhasil */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Login Berhasil</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.successCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Autentikasi lolos</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Percobaan Gagal */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Percobaan Gagal</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.failedCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.lockedOrInactiveCount > 0 ? `${stats.lockedOrInactiveCount} akun kena sanksi` : 'Salah password/user'}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Rekam Jejak Autentikasi
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Menampilkan {logs.length} dari total {pagination.total} rekaman log.
            </CardDescription>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari username, nama, atau IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">Berhasil Saja</option>
              <option value="FAILED">Gagal Saja</option>
            </select>

            {/* Reason Filter */}
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Jenis Log</option>
              <option value="LOGIN_SUCCESS">Login Berhasil</option>
              <option value="WRONG_PASSWORD">Password Salah</option>
              <option value="USER_NOT_FOUND">User Tidak Ditemukan</option>
              <option value="ACCOUNT_LOCKED">Akun Terkunci</option>
              <option value="ACCOUNT_INACTIVE">Akun Nonaktif</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Waktu Akses</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Akun Pengguna</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Role</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Keterangan Audit</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Alamat IP</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 py-3.5">Perangkat & Browser</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                      Memuat data log aktivitas...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada riwayat aktivitas yang sesuai kriteria pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Waktu */}
                      <TableCell className="whitespace-nowrap">
                        <span className="text-xs font-mono text-slate-700">{formatTimestamp(log.createdAt)}</span>
                      </TableCell>

                      {/* Akun Pengguna */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{log.username}</span>
                          {log.name && <span className="text-[11px] text-slate-500">{log.name}</span>}
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {getRoleBadge(log.role)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {log.status === 'SUCCESS' ? (
                          <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                            Berhasil
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] bg-rose-50 text-rose-700 border-rose-200 font-semibold">
                            Gagal
                          </Badge>
                        )}
                      </TableCell>

                      {/* Keterangan */}
                      <TableCell>
                        {getReasonBadge(log.status, log.reason)}
                      </TableCell>

                      {/* Alamat IP */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.ipAddress || '127.0.0.1 (Local)'}</span>
                        </div>
                      </TableCell>

                      {/* Perangkat & Browser */}
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600" title={log.userAgent || ''}>
                          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{parseUserAgent(log.userAgent)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} baris data)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog: Bersihkan Log Lama */}
      <Dialog open={isPruneModalOpen} onOpenChange={setIsPruneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <Trash2 className="w-5 h-5" />
              <span>Bersihkan Data Log Lama</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Hapus log login yang sudah melewati batas waktu retensi untuk menghemat ruang penyimpanan database Supabase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Pilih Batas Waktu Retensi:
              </label>
              <select
                value={pruneDays}
                onChange={(e) => setPruneDays(parseInt(e.target.value, 10))}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value={7}>Lebih lama dari 7 hari yang lalu</option>
                <option value={14}>Lebih lama dari 14 hari yang lalu</option>
                <option value={30}>Lebih lama dari 30 hari yang lalu (Disarankan)</option>
                <option value={60}>Lebih lama dari 60 hari yang lalu</option>
                <option value={90}>Lebih lama dari 90 hari yang lalu</option>
              </select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Tindakan ini tidak dapat dibatalkan
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Data log yang dihapus tidak dapat dipulihkan kembali. Log terbaru yang berada dalam rentang waktu yang dipilih akan tetap tersimpan aman.
              </p>
            </div>

            {pruneMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pruneMessage}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPruneModalOpen(false)}
              disabled={pruning}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handlePruneLogs}
              disabled={pruning}
              className="text-xs gap-1.5"
            >
              {pruning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membersihkan...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Log Lama</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
