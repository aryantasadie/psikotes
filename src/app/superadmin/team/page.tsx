'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Pencil, 
  Trash2, 
  Power, 
  ShieldCheck, 
  Award, 
  Users, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  EyeOff,
  Unlock,
  ShieldAlert,
  Clock
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
} from '@/components/ui/dialog';

interface TestBatch {
  id: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  jobPosition?: { name: string } | null;
}

interface TeamMember {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  license?: string | null;
  role: string;
  status: string;
  assignedTestIds?: string | null;
  failedAttempts?: number;
  lockedUntil?: string | null;
  isPermanentLocked?: boolean;
  createdAt: string;
}

export default function TeamManagementPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [availableTests, setAvailableTests] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'tester',
    status: 'active',
    license: '',
    password: '',
    assignedTestIds: [] as number[],
  });

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showTeamPassword, setShowTeamPassword] = useState<boolean>(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.users || []);
        setAvailableTests(data.tests || []);
      }
    } catch (e) {
      console.error('Failed to fetch team data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      role: 'tester',
      status: 'active',
      license: '',
      password: '',
      assignedTestIds: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    let parsedAssigned: number[] = [];
    if (member.assignedTestIds) {
      try {
        parsedAssigned = JSON.parse(member.assignedTestIds);
      } catch {}
    }

    setFormData({
      name: member.name || '',
      role: member.role || 'tester',
      status: member.status || 'active',
      license: member.license || '',
      password: '',
      assignedTestIds: parsedAssigned,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleBatchCheck = (testId: number) => {
    setFormData((prev) => {
      const exists = prev.assignedTestIds.includes(testId);
      const updated = exists
        ? prev.assignedTestIds.filter((id) => id !== testId)
        : [...prev.assignedTestIds, testId];
      return { ...prev, assignedTestIds: updated };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Nama Lengkap wajib diisi.');
      return;
    }

    if (!editingMember && !formData.password.trim()) {
      setFormError('Password wajib diisi untuk anggota tim baru.');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/superadmin/team';
      const method = editingMember ? 'PUT' : 'POST';
      const bodyPayload = editingMember
        ? { id: editingMember.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchTeamData();
      } else {
        setFormError(data.error || 'Terjadi kesalahan saat menyimpan data.');
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const actionName = newStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Yakin ingin ${actionName} akun ${member.name}?`)) return;

    try {
      const res = await fetch('/api/superadmin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          name: member.name,
          username: member.username,
          role: member.role,
          status: newStatus,
        }),
      });
      if (res.ok) fetchTeamData();
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!confirm(`Hapus permanen anggota tim "${member.name}"? Data yang terhapus tidak dapat dikembalikan.`)) return;

    try {
      const res = await fetch(`/api/superadmin/team?id=${member.id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchTeamData();
    } catch (e) {
      console.error('Failed to delete member:', e);
    }
  };

  const handleUnlockUser = async (member: TeamMember) => {
    if (!confirm(`Buka kunci akun "${member.name}" (${member.username})? Status kunci dan counter salah akan direset.`)) return;

    try {
      const res = await fetch('/api/superadmin/users/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Akun berhasil dibuka kembali!');
        fetchTeamData();
      } else {
        alert(data.error || 'Gagal membuka kunci akun');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const filteredTeam = team.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.license || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL'
        ? true
        : roleFilter === 'superadmin'
        ? m.role === 'superadmin'
        : roleFilter === 'psikolog'
        ? m.role === 'psikolog'
        : m.role === 'tester';

    return matchesSearch && matchesRole;
  });

  const totalPersonnel = team.length;
  const psikologCount = team.filter((m) => m.role === 'psikolog').length;
  const testerCount = team.filter((m) => m.role === 'tester').length;
  const superAdminCount = team.filter((m) => m.role === 'superadmin').length;

  const getRoleBadge = (role: string) => {
    if (role === 'superadmin') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Super Admin</span>
        </Badge>
      );
    }
    if (role === 'psikolog') {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold text-xs gap-1">
          <Award className="w-3.5 h-3.5" />
          <span>Psikolog Assessor</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-bold text-xs gap-1">
        <Users className="w-3.5 h-3.5" />
        <span>Tester</span>
      </Badge>
    );
  };

  const renderAssignedBatches = (member: TeamMember) => {
    if (member.role === 'superadmin') {
      return (
        <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
          🌐 Akses Semua Sesi
        </span>
      );
    }
    if (!member.assignedTestIds) {
      return <span className="text-slate-400 text-xs italic">Belum ditugaskan ke Batch</span>;
    }

    try {
      const ids: number[] = JSON.parse(member.assignedTestIds);
      if (!Array.isArray(ids) || ids.length === 0) {
        return <span className="text-slate-400 text-xs italic">Belum ditugaskan ke Batch</span>;
      }

      const assigned = availableTests.filter((t) => ids.includes(t.id));
      if (assigned.length === 0) {
        return <span className="text-slate-500 text-xs">Batch #{ids.join(', #')}</span>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {assigned.map((t, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium"
            >
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{t.title}</span>
            </span>
          ))}
        </div>
      );
    } catch {
      return <span className="text-slate-400 text-xs">{member.assignedTestIds}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pengelolaan Tim Psikotes & Penugasan Batch
          </h2>
          <p className="text-sm text-slate-500">
            Kelola akun personel tim, hak akses peran, serta penugasan Batch / Sesi Ujian untuk Tester.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="gap-2 self-start sm:self-auto">
          <UserPlus className="w-4 h-4" />
          <span>Tambah Anggota Tim</span>
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Total Tim
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{totalPersonnel}</span>
              <span className="text-sm font-medium text-slate-500">Personel</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-purple-700">
              Psikolog Assessor
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-purple-700">{psikologCount}</span>
              <span className="text-sm font-medium text-purple-600">Personel</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-sky-50/50 border-sky-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-sky-700">
              Tester Operasional
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-sky-600">{testerCount}</span>
              <span className="text-sm font-medium text-sky-700">Personel</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-emerald-700">
              Super Admin
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">{superAdminCount}</span>
              <span className="text-sm font-medium text-emerald-700">Personel</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Personel Tim Psikotes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Hak akses dan alokasi sesi ujian psikotes berbasis peran
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama, SIPP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">Semua Peran</option>
                <option value="superadmin">Super Admin</option>
                <option value="psikolog">Psikolog Assessor</option>
                <option value="tester">Tester</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Personel & Lisensi</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Peran / Role</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Penugasan Batch</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status Akun</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data tim...
                  </TableCell>
                </TableRow>
              ) : filteredTeam.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    Tidak ada anggota tim yang sesuai dengan kriteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeam.map((member) => (
                  <TableRow key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama & Lisensi */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-900">{member.name}</span>
                        <span className="text-xs text-slate-500">
                          {member.license || (member.role === 'superadmin' ? 'Super Administrator / System Architect' : member.role === 'psikolog' ? 'Psikolog Assessor' : 'Tester Operasional')}
                        </span>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      {getRoleBadge(member.role)}
                    </TableCell>

                    {/* Penugasan */}
                    <TableCell className="max-w-xs">
                      {renderAssignedBatches(member)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {member.isPermanentLocked ? (
                        <Badge variant="destructive" className="gap-1 font-semibold text-xs bg-rose-50 text-rose-700 border-rose-200">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>Terkunci Permanen</span>
                        </Badge>
                      ) : (member.lockedUntil && new Date(member.lockedUntil) > new Date()) ? (
                        <Badge variant="warning" className="gap-1 font-semibold text-xs bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Terkunci (1.5m)</span>
                        </Badge>
                      ) : member.status === 'active' ? (
                        <Badge variant="success" className="gap-1 font-semibold text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 font-semibold text-xs">
                          <XCircle className="w-3 h-3" />
                          <span>Nonaktif</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {(member.isPermanentLocked || (member.lockedUntil && new Date(member.lockedUntil) > new Date())) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUnlockUser(member)}
                            className="h-8 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Buka Kunci</span>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(member)}
                          className="h-8 px-2.5 text-xs gap-1 text-slate-700"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(member)}
                          className={`h-8 px-2.5 text-xs gap-1 ${
                            member.status === 'active'
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{member.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMember(member)}
                          className="h-8 px-2 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Dialog (Add / Edit Team Member) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingMember ? 'Edit Anggota Tim Psikotes' : 'Tambah Anggota Tim Psikotes'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitForm} autoComplete="off" className="flex flex-col gap-4">
            <input type="text" name="prevent_autofill_username" className="hidden" tabIndex={-1} autoComplete="off" />
            <input type="password" name="prevent_autofill_password" className="hidden" tabIndex={-1} autoComplete="new-password" />

            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: Dra. Ani Suryani, M.Psi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoComplete="off"
              />
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Peran / Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="tester">Tester</option>
                  <option value="psikolog">Psikolog Assessor</option>
                  <option value="superadmin">Super Administrator</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Status Akun</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            {/* Batch Assignments */}
            {formData.role !== 'superadmin' && (
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <label className="text-xs font-bold text-slate-800">
                  🎯 Penugasan Batch (Sesi Ujian)
                </label>
                <p className="text-xs text-slate-500">
                  Pilih Batch / Sesi Ujian mana saja yang dapat diakses oleh {formData.role === 'psikolog' ? 'Psikolog' : 'Tester'} ini.
                </p>

                {availableTests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada Batch / Sesi Ujian yang dibuat di menu Penjadwalan.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableTests.map((t) => {
                      const isChecked = formData.assignedTestIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            isChecked 
                              ? 'bg-teal-50/80 border-teal-200 text-teal-900 font-semibold' 
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBatchCheck(t.id)}
                            className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span>{t.title} <span className="text-slate-400 font-normal">(ID: {t.id})</span></span>
                            {t.jobPosition?.name && (
                              <span className="text-[11px] text-slate-500">Jabatan: {t.jobPosition.name}</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Lisensi SIPP */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Lisensi SIPP / Spesialisasi / Catatan
              </label>
              <Input
                type="text"
                placeholder="Contoh: 554-12/SIPP-HIPSI/2022 (Klinis & Industri)"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Password Akun
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showTeamPassword ? 'text' : 'password'}
                  placeholder={editingMember ? 'Kosongkan jika tidak diubah' : 'Masukkan password baru'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowTeamPassword(prev => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer p-1"
                  aria-label={showTeamPassword ? 'Sembunyikan password' : 'Lihat password'}
                  title={showTeamPassword ? 'Sembunyikan password' : 'Lihat password'}
                  tabIndex={-1}
                >
                  {showTeamPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Personel'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
