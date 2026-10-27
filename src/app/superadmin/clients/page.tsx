'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Mail, 
  Phone, 
  Loader2,
  Power,
  Coins
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const AVAILABLE_TESTS = [
  'Kraepelin',
  'WPT',
  'PAPI KOSTICK',
  'DISC',
  'CFIT',
  'IST',
  'TIKI',
  'MSDT',
  'Wartegg',
  'Tes Grafis',
];

interface ClientCompany {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  testQuotas?: string | null;
  usedQuotas?: string | null;
  logoUrl?: string | null;
  totalBatches?: number;
  createdAt: string;
}

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientCompany | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    testQuotas: {} as Record<string, number>,
  });

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
      testQuotas: {
        Kraepelin: 50,
        WPT: 50,
      },
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientCompany) => {
    setEditingClient(client);
    let parsedQuotas: Record<string, number> = {};
    if (client.testQuotas) {
      try {
        parsedQuotas = JSON.parse(client.testQuotas);
      } catch {}
    }

    setFormData({
      name: client.name || '',
      username: client.username || '',
      email: client.email || '',
      phone: client.phone || '',
      password: '',
      status: client.status || 'active',
      testQuotas: parsedQuotas,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleQuotaChange = (testName: string, val: string) => {
    const num = parseInt(val, 10);
    setFormData((prev) => ({
      ...prev,
      testQuotas: {
        ...prev.testQuotas,
        [testName]: isNaN(num) || num < 0 ? 0 : num,
      },
    }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setFormError('Nama Perusahaan dan Username Login wajib diisi.');
      return;
    }

    if (!editingClient && !formData.password.trim()) {
      setFormError('Password wajib diisi untuk akun Klien baru.');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/superadmin/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const bodyPayload = editingClient
        ? { id: editingClient.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchClients();
      } else {
        setFormError(data.error || 'Terjadi kesalahan saat menyimpan data klien.');
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: ClientCompany) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    const actionName = newStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Yakin ingin ${actionName} akun Klien "${client.name}"?`)) return;

    try {
      const res = await fetch('/api/superadmin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          name: client.name,
          username: client.username,
          status: newStatus,
        }),
      });
      if (res.ok) fetchClients();
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDeleteClient = async (client: ClientCompany) => {
    if (!confirm(`Hapus permanen akun Klien "${client.name}"? Data yang terhapus tidak dapat dikembalikan.`)) return;

    try {
      const res = await fetch(`/api/superadmin/clients?id=${client.id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchClients();
    } catch (e) {
      console.error('Failed to delete client:', e);
    }
  };

  const renderQuotasBadge = (client: ClientCompany) => {
    if (!client.testQuotas) {
      return <span className="text-xs text-slate-400 italic">Belum diset kuota</span>;
    }
    try {
      const quotas: Record<string, number> = JSON.parse(client.testQuotas);
      const used: Record<string, number> = client.usedQuotas ? JSON.parse(client.usedQuotas) : {};
      const entries = Object.entries(quotas).filter(([_, q]) => q > 0);
      if (entries.length === 0) {
        return <span className="text-xs text-slate-400 italic">0 Kuota</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {entries.map(([test, quota]) => {
            const u = used[test] || 0;
            const remaining = Math.max(0, quota - u);
            return (
              <Badge key={test} variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200 gap-1 font-semibold">
                <Coins className="w-3 h-3 text-teal-600" />
                <span>{test}: {remaining}/{quota}</span>
              </Badge>
            );
          })}
        </div>
      );
    } catch {
      return <span className="text-xs text-slate-400">-</span>;
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const totalBatchesCount = clients.reduce((acc, c) => acc + (c.totalBatches || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Klien Perusahaan (B2B HRD Portal)
          </h2>
          <p className="text-sm text-slate-500">
            Kelola akun portal mitra, atur alokasi kuota per alat tes, dan pantau penggunaan asesmen.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Tambah Klien Perusahaan</span>
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Total Perusahaan Mitra
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{totalClients}</span>
              <span className="text-sm font-medium text-slate-500">Perusahaan</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-emerald-700">
              Akun Klien Aktif
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">{activeClients}</span>
              <span className="text-sm font-medium text-emerald-700">Aktif</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-sky-50/50 border-sky-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-sky-700">
              Total Batch Klien
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-sky-600">{totalBatchesCount}</span>
              <span className="text-sm font-medium text-sky-700">Sesi Ujian</span>
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
                Daftar Perusahaan Mitra & Alokasi Kuota
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Data akses portal HRD, kuota tes aktif, dan ringkasan batch asesmen
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari perusahaan, username, email..."
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
                <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Perusahaan Klien</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Username Login</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Email & Kontak</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Alokasi Kuota Tes (Sisa/Total)</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Total Batch</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data klien perusahaan...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    Belum ada data perusahaan klien yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama Perusahaan */}
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{client.name}</span>
                      </div>
                    </TableCell>

                    {/* Username */}
                    <TableCell>
                      <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold">
                        {client.username}
                      </code>
                    </TableCell>

                    {/* Email & Kontak */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.email || `${client.username}@klien.id`}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Kuota Tes */}
                    <TableCell className="max-w-xs">
                      {renderQuotasBadge(client)}
                    </TableCell>

                    {/* Total Batch */}
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-semibold text-xs">
                        <Layers className="w-3 h-3" />
                        <span>{client.totalBatches || 0} Sesi</span>
                      </Badge>
                    </TableCell>

                    {/* Status Akun */}
                    <TableCell>
                      {client.status === 'active' ? (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(client)}
                          className="h-8 px-2.5 text-xs gap-1 text-slate-700"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit & Kuota</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(client)}
                          className={`h-8 px-2.5 text-xs gap-1 ${
                            client.status === 'active'
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{client.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClient(client)}
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

      {/* Modal Dialog (Add / Edit Client & Quotas) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingClient ? 'Edit Klien Perusahaan & Kuota' : 'Tambah Klien Perusahaan Baru'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nama Perusahaan / Instansi Klien <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: PT Bank Mandiri (Persero) Tbk"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Username Login Portal Klien <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: hrd_mandiri"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Email HRD</label>
                <Input
                  type="email"
                  placeholder="hrd@mandiri.co.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">No. WhatsApp</label>
                <Input
                  type="text"
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Status Akun</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors focus:border-teal-500 focus:outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Password Akun</label>
                <Input
                  type="password"
                  placeholder={editingClient ? 'Kosongkan jika tetap' : 'Password login'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Alokasi Kuota Per Alat Tes */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-teal-600" />
                  <span>Alokasi Kuota Pengerjaan Per Alat Tes</span>
                </span>
                <span className="text-[11px] text-slate-400">Isi jumlah kuota yang diberikan</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {AVAILABLE_TESTS.map((testName) => (
                  <div key={testName} className="flex flex-col gap-1 bg-white p-2 rounded-md border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{testName}</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.testQuotas[testName] ?? ''}
                      onChange={(e) => handleQuotaChange(testName, e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </div>
                ))}
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
                <span>{submitting ? 'Menyimpan...' : 'Simpan Klien & Kuota'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
