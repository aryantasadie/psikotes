'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Coins, 
  Eye, 
  EyeOff, 
  Unlock, 
  ShieldAlert, 
  Clock, 
  FolderOpen, 
  Users, 
  Info, 
  Calendar, 
  FileSpreadsheet, 
  Briefcase, 
  UserCheck, 
  Package, 
  Sparkles, 
  ChevronRight,
  FileCheck2,
  Sliders,
  Check,
  PlusCircle,
  Settings2,
  Lock,
  LockKeyhole,
  ArrowUp,
  ArrowDown,
  X,
  Target,
  ArrowLeft
} from 'lucide-react';
import { ASPECT_DESCRIPTIONS } from '@/app/superadmin/job-positions/builder/page';

const SCORE_LABELS = [
  { value: 1, label: 'KS', full: 'Kurang Sekali' },
  { value: 2, label: 'K',  full: 'Kurang'        },
  { value: 3, label: 'C',  full: 'Cukup'         },
  { value: 4, label: 'B',  full: 'Baik'          },
  { value: 5, label: 'BS', full: 'Baik Sekali'   },
];

const AVAILABLE_TEST_BATTERY = [
  'WPT',
  'CFIT 1', 'CFIT 2', 'CFIT 3', 'CFIT 4',
  'TIKI 1', 'TIKI 2', 'TIKI 3', 'TIKI 4', 'TIKI 6',
  'IST 2', 'IST 3', 'IST 6', 'IST 7',
  'DISC', 'MSDT', 'PAPI KOSTICK', 'Kraepelin', 'Wartegg', 'Tes Grafis'
];
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Modul Instrumen Ujian HR Publik
const ALL_TEST_INSTRUMENTS = [
  { id: 'WPT', name: 'WPT', desc: 'Tes Inteligensi Cepat (12 Menit)' },
  { id: 'CFIT', name: 'CFIT', desc: 'Tes Inteligensi Non-Verbal' },
  { id: 'TIKI', name: 'TIKI', desc: 'Tes Inteligensi Kolektif' },
  { id: 'IST', name: 'IST', desc: 'Struktur Inteligensi & Daya Analisa' },
  { id: 'DISC', name: 'DISC', desc: 'Gaya Kepribadian & Pola Kerja' },
  { id: 'PAPI KOSTICK', name: 'PAPI KOSTICK', desc: 'Dinamika Sikap & Motivasi' },
  { id: 'MSDT', name: 'MSDT', desc: 'Gaya Kepemimpinan Manajerial' },
  { id: 'Kraepelin', name: 'Kraepelin', desc: 'Ketahanan, Kecepatan & Ketelitian' },
  { id: 'Wartegg', name: 'Wartegg', desc: 'Eksplorasi Kepribadian Proyektif' },
];

interface AvailableJobPosition {
  id: number;
  name: string;
  description?: string | null;
  psychographPresetId?: number | null;
  presetName: string;
  grayAreasCount?: number;
}

interface BatchSummaryItem {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  totalParticipants: number;
  completedParticipants: number;
  scheme: string;
  status: string;
}

interface ClientCompany {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  picName?: string | null;
  status: string;
  license?: string | null;
  serviceScheme?: string;
  batteryTest?: string[];
  assignedJobPositionIds?: number[];
  totalQuota?: number;
  usedQuota?: number;
  logoUrl?: string | null;
  totalBatches?: number;
  totalCandidates?: number;
  completedCandidates?: number;
  managedBatches?: number;
  saasBatches?: number;
  batches?: BatchSummaryItem[];
  failedAttempts?: number;
  lockedUntil?: string | null;
  isPermanentLocked?: boolean;
  createdAt: string;
}

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [availableJobPositions, setAvailableJobPositions] = useState<AvailableJobPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');

  // Modal State Profil Klien (Tambah / Edit Profil)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientCompany | null>(null);

  // Modal State: Konfigurasi Mitra (Battery Test Kunci, Bank Psikogram, Kuota)
  const [configClient, setConfigClient] = useState<ClientCompany | null>(null);
  const [configTab, setConfigTab] = useState<'battery' | 'psychograph' | 'profile'>('battery');
  const [configAssignedJobs, setConfigAssignedJobs] = useState<number[]>([9]);
  const [configQuota, setConfigQuota] = useState<string>('100');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configMsg, setConfigMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // State Builder Baterai Tes Mitra (Tampilan Test Builder Superadmin)
  const [batteryTestId, setBatteryTestId] = useState<number | null>(null);
  const [batteryTitle, setBatteryTitle] = useState<string>('');
  const [batterySequence, setBatterySequence] = useState<string[]>(['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
  const [savingBattery, setSavingBattery] = useState<boolean>(false);

  // State Builder Psikogram Jabatan & Gray Area Mitra (Tampilan Job Position Builder Superadmin)
  const [clientJobPositions, setClientJobPositions] = useState<any[]>([]);
  const [psychographPresets, setPsychographPresets] = useState<any[]>([]);
  const [jobViewMode, setJobViewMode] = useState<'list' | 'builder'>('list');
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobName, setJobName] = useState<string>('');
  const [jobDesc, setJobDesc] = useState<string>('');
  const [jobPresetId, setJobPresetId] = useState<string>('');
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [flatAspects, setFlatAspects] = useState<string[]>([]);
  const [grayAreas, setGrayAreas] = useState<Record<string, { targetScore: number }>>({});
  const [savingJob, setSavingJob] = useState<boolean>(false);

  // Modal State: Detail Riwayat Batch Klien
  const [viewBatchesClient, setViewBatchesClient] = useState<ClientCompany | null>(null);

  // Dialog State: Keamanan Relasi Data & Konfirmasi Hapus
  const [blockedData, setBlockedData] = useState<{
    isOpen: boolean;
    clientName: string;
    totalBatches: number;
    batches?: Array<{ id: number; title: string; participantCount?: number; startDate?: string }>;
  } | null>(null);

  const [confirmDeleteData, setConfirmDeleteData] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
    isDeleting: boolean;
  } | null>(null);

  // Form State Klien Profil
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    picName: '',
    password: '',
    status: 'active',
    serviceScheme: 'SKEMA_2_SAAS',
    totalQuota: '100',
    batteryTest: ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'] as string[],
    assignedJobPositionIds: [9] as number[]
  });

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showClientPassword, setShowClientPassword] = useState<boolean>(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/clients');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setClients(data);
        } else if (data && Array.isArray(data.clients)) {
          setClients(data.clients);
          if (Array.isArray(data.jobPositions)) {
            setAvailableJobPositions(data.jobPositions);
          }
        } else {
          setClients([]);
        }
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
      picName: '',
      password: '',
      status: 'active',
      serviceScheme: 'SKEMA_2_SAAS',
      totalQuota: '100',
      batteryTest: ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'],
      assignedJobPositionIds: [9] // Default Standar Umum
    });
    setFormError('');
    setShowClientPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientCompany) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      username: client.username || '',
      email: client.email || '',
      phone: client.phone || '',
      picName: client.picName || '',
      password: '',
      status: client.status || 'active',
      serviceScheme: client.serviceScheme || 'SKEMA_2_SAAS',
      totalQuota: String(client.totalQuota || 0),
      batteryTest: client.batteryTest || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK'],
      assignedJobPositionIds: client.assignedJobPositionIds || [9]
    });
    setFormError('');
    setShowClientPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setFormError('Nama Perusahaan dan Username wajib diisi.');
      return;
    }

    if (formData.serviceScheme !== 'SKEMA_1_MANAGED' && !editingClient && !formData.password.trim()) {
      setFormError('Password wajib diisi untuk akun Klien Portal SaaS.');
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

  // ════════════════════════════════════════════════════════════════════════════
  // MODAL: KONFIGURASI SAAS MITRA (BATTERY TEST FIX, BANK PSIKOGRAM, KUOTA)
  // MENGGUNAKAN SISTEM, BUILDER & DATABASE YANG SAMA DENGAN SUPERADMIN
  // ════════════════════════════════════════════════════════════════════════════
  const fetchClientJobPositions = async (cId: number) => {
    try {
      const res = await fetch(`/api/superadmin/job-positions?clientId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setClientJobPositions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch client job positions:', e);
    }
  };

  const fetchPresetsList = async () => {
    try {
      const res = await fetch('/api/superadmin/psychograph');
      if (res.ok) {
        const data = await res.json();
        setPsychographPresets(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch presets:', e);
    }
  };

  const handleOpenConfigModal = async (client: ClientCompany) => {
    setConfigClient(client);
    setConfigTab('battery');
    setConfigMsg(null);
    setJobViewMode('list');
    setEditingJobId(null);
    setConfigQuota(String(client.totalQuota || 100));
    setConfigAssignedJobs(client.assignedJobPositionIds && client.assignedJobPositionIds.length > 0 ? client.assignedJobPositionIds : [9]);

    // 1. Fetch Baterai Tes resmi klien dari tabel Test (clientId = client.id)
    try {
      const resTests = await fetch(`/api/superadmin/tests?clientId=${client.id}`);
      if (resTests.ok) {
        const testsData = await resTests.json();
        const clientTest = Array.isArray(testsData) ? testsData.find((t: any) => t.clientId === client.id) : null;
        if (clientTest) {
          setBatteryTestId(clientTest.id);
          setBatteryTitle(clientTest.title || `Baterai Tes Resmi - ${client.name}`);
          try {
            const parsedSeq = JSON.parse(clientTest.sequence || '[]');
            setBatterySequence(Array.isArray(parsedSeq) && parsedSeq.length > 0 ? parsedSeq : (client.batteryTest || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']));
          } catch {
            setBatterySequence(client.batteryTest || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
          }
        } else {
          setBatteryTestId(null);
          setBatteryTitle(`Baterai Tes Resmi - ${client.name}`);
          setBatterySequence(client.batteryTest || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
        }
      }
    } catch {
      setBatteryTestId(null);
      setBatteryTitle(`Baterai Tes Resmi - ${client.name}`);
      setBatterySequence(client.batteryTest || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
    }

    // 2. Fetch Job Positions klien & Preset Psikogram
    fetchClientJobPositions(client.id);
    fetchPresetsList();
  };

  // Parser aspek saat template psikogram berubah di Builder Jabatan
  useEffect(() => {
    if (!jobPresetId || psychographPresets.length === 0) {
      setActiveCategories([]);
      setFlatAspects([]);
      return;
    }
    const preset = psychographPresets.find(p => String(p.id) === String(jobPresetId));
    if (!preset?.mapping) return;
    try {
      const mapping = JSON.parse(preset.mapping);
      const cats: any[] = [];
      const flat: string[] = [];

      mapping.forEach((cat: any) => {
        const active = (cat.aspects || [])
          .filter((a: any) => a.checked)
          .map((a: any) => ({ name: a.name, description: a.description || '' }));

        if (active.length > 0) {
          cats.push({ category: cat.category, aspects: active });
          active.forEach((a: any) => flat.push(a.name));
        }
      });

      setActiveCategories(cats);
      setFlatAspects(flat);
      setGrayAreas(prev => {
        const updated = { ...prev };
        flat.forEach(a => {
          if (!updated[a]) updated[a] = { targetScore: 3 };
        });
        return updated;
      });
    } catch {}
  }, [jobPresetId, psychographPresets]);

  // Handler Baterai Tes (Sama seperti TestBuilder Superadmin)
  const handleAddTestToSequence = (testName: string) => {
    setBatterySequence(prev => [...prev, testName]);
  };

  const handleRemoveTestFromSequence = (index: number) => {
    setBatterySequence(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveTestSequence = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= batterySequence.length) return;
    const newSeq = [...batterySequence];
    const item = newSeq[index];
    newSeq.splice(index, 1);
    newSeq.splice(targetIdx, 0, item);
    setBatterySequence(newSeq);
  };

  const handleApplyBatteryPreset = (preset: 'staff' | 'operator' | 'manager') => {
    if (preset === 'operator') {
      setBatterySequence(['WPT', 'Kraepelin', 'DISC']);
    } else if (preset === 'staff') {
      setBatterySequence(['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
    } else if (preset === 'manager') {
      setBatterySequence(['WPT', 'IST 2', 'IST 3', 'Kraepelin', 'DISC', 'PAPI KOSTICK', 'MSDT']);
    }
  };

  const handleSaveBatteryTest = async () => {
    if (!configClient) return;
    if (batterySequence.length === 0) {
      alert('Pilih minimal satu modul tes untuk rangkaian Baterai Tes mitra ini.');
      return;
    }
    setSavingBattery(true);
    setConfigMsg(null);
    try {
      // 1. Simpan langsung ke database Test (dengan clientId mitra)
      const url = batteryTestId ? `/api/superadmin/tests/${batteryTestId}` : '/api/superadmin/tests';
      const method = batteryTestId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: batteryTitle.trim() || `Baterai Tes Resmi - ${configClient.name}`,
          sequence: batterySequence,
          clientId: configClient.id
        })
      });

      if (res.ok) {
        const savedTest = await res.json();
        setBatteryTestId(savedTest.id);

        // 2. Sinkronkan ke license user mitra
        await fetch('/api/superadmin/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: configClient.id,
            name: configClient.name,
            username: configClient.username,
            batteryTest: batterySequence,
            assignedJobPositionIds: configAssignedJobs,
            totalQuota: parseInt(configQuota, 10) || 100
          })
        });

        setConfigMsg({ text: 'Baterai Tes resmi mitra berhasil disimpan ke database!', type: 'success' });
        fetchClients();
      } else {
        const errData = await res.json();
        setConfigMsg({ text: errData.error || 'Gagal menyimpan Baterai Tes', type: 'error' });
      }
    } catch {
      setConfigMsg({ text: 'Terjadi kesalahan koneksi server.', type: 'error' });
    } finally {
      setSavingBattery(false);
    }
  };

  // Handler Psikogram Jabatan Mitra (Sama seperti JobPositionBuilder Superadmin)
  const toggleConfigJob = (jobId: number) => {
    setConfigAssignedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleStartCreateJob = () => {
    setEditingJobId(null);
    setJobName('');
    setJobDesc('');
    setJobPresetId(psychographPresets[0]?.id ? String(psychographPresets[0].id) : '');
    setGrayAreas({});
    setJobViewMode('builder');
  };

  const handleStartEditJob = (pos: any) => {
    setEditingJobId(pos.id);
    setJobName(pos.name);
    setJobDesc(pos.description || '');
    setJobPresetId(pos.psychographPresetId ? String(pos.psychographPresetId) : '');
    const map: Record<string, { targetScore: number }> = {};
    (pos.grayAreas || []).forEach((ga: any) => {
      map[ga.parameter] = { targetScore: ga.targetScore };
    });
    setGrayAreas(map);
    setJobViewMode('builder');
  };

  const handleSaveJobPosition = async () => {
    if (!configClient) return;
    if (!jobName.trim()) {
      alert('Nama Standar Jabatan harus diisi.');
      return;
    }
    if (!jobPresetId) {
      alert('Template Psikogram harus dipilih.');
      return;
    }

    setSavingJob(true);
    setConfigMsg(null);
    try {
      const url = editingJobId ? `/api/superadmin/job-positions/${editingJobId}` : '/api/superadmin/job-positions';
      const method = editingJobId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: jobName.trim(),
          description: jobDesc.trim(),
          psychographPresetId: parseInt(jobPresetId),
          clientId: configClient.id,
          grayAreas: flatAspects.map(a => ({
            parameter: a,
            targetScore: grayAreas[a]?.targetScore || 3
          }))
        })
      });

      if (res.ok) {
        const savedPos = await res.json();
        if (!editingJobId && savedPos.id) {
          setConfigAssignedJobs(prev => [...prev, savedPos.id]);
        }
        await fetchClientJobPositions(configClient.id);
        fetchClients();
        setJobViewMode('list');
        setConfigMsg({ text: 'Standar Psikogram Jabatan mitra berhasil disimpan ke database!', type: 'success' });
      } else {
        const errData = await res.json();
        setConfigMsg({ text: errData.error || 'Gagal menyimpan Standar Jabatan', type: 'error' });
      }
    } catch {
      setConfigMsg({ text: 'Terjadi kesalahan koneksi server.', type: 'error' });
    } finally {
      setSavingJob(false);
    }
  };

  const getAspectDescription = (aspectName: string, directDesc?: string) => {
    if (directDesc && directDesc.trim()) return directDesc.trim();
    if (ASPECT_DESCRIPTIONS[aspectName]) return ASPECT_DESCRIPTIONS[aspectName];
    const norm = aspectName.trim().toLowerCase();
    for (const [k, v] of Object.entries(ASPECT_DESCRIPTIONS)) {
      if (k.toLowerCase() === norm) return v;
    }
    return '—';
  };

  const handleSaveProfileAndQuota = async () => {
    if (!configClient) return;
    const qNum = parseInt(configQuota, 10);
    if (isNaN(qNum) || qNum < 0) {
      alert('Kuota kandidat harus berupa angka valid (>= 0).');
      return;
    }

    setSavingConfig(true);
    setConfigMsg(null);
    try {
      const res = await fetch('/api/superadmin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: configClient.id,
          name: configClient.name,
          username: configClient.username,
          serviceScheme: configClient.serviceScheme || 'SKEMA_2_SAAS',
          batteryTest: batterySequence,
          assignedJobPositionIds: configAssignedJobs,
          totalQuota: qNum
        }),
      });

      if (res.ok) {
        setConfigMsg({ text: 'Alokasi kuota & profil mitra berhasil diperbarui!', type: 'success' });
        fetchClients();
      } else {
        const data = await res.json();
        setConfigMsg({ text: data.error || 'Gagal menyimpan kuota mitra.', type: 'error' });
      }
    } catch {
      setConfigMsg({ text: 'Terjadi kesalahan jaringan.', type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // DELETE & STATUS HANDLING
  // ════════════════════════════════════════════════════════════════════════════
  const handleInitiateDeleteClient = (client: ClientCompany) => {
    if (client.totalBatches && client.totalBatches > 0) {
      setBlockedData({
        isOpen: true,
        clientName: client.name,
        totalBatches: client.totalBatches,
        batches: (client.batches || []).map(b => ({
          id: b.id,
          title: b.title,
          participantCount: b.totalParticipants,
          startDate: b.startDate || undefined
        }))
      });
      return;
    }

    setConfirmDeleteData({
      isOpen: true,
      id: client.id,
      name: client.name,
      isDeleting: false
    });
  };

  const handleConfirmDeleteClient = async () => {
    if (!confirmDeleteData) return;
    setConfirmDeleteData(prev => prev ? { ...prev, isDeleting: true } : null);

    try {
      const res = await fetch(`/api/superadmin/clients?id=${confirmDeleteData.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setConfirmDeleteData(null);
        if (data.code === 'HAS_CONNECTED_DATA') {
          setBlockedData({
            isOpen: true,
            clientName: confirmDeleteData.name,
            totalBatches: data.connectedBatches?.length || 1,
            batches: data.connectedBatches || []
          });
        } else {
          alert(data.error || 'Gagal menghapus data klien.');
        }
        return;
      }

      setConfirmDeleteData(null);
      fetchClients();
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
      setConfirmDeleteData(null);
    }
  };

  const handleUnlockClient = async (client: ClientCompany) => {
    if (!confirm(`Buka kunci akun Klien "${client.name}" (${client.username})?`)) return;

    try {
      const res = await fetch('/api/superadmin/users/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: client.id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Akun klien berhasil dibuka kembali!');
        fetchClients();
      } else {
        alert(data.error || 'Gagal membuka kunci akun');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const renderSchemeBadge = (scheme?: string) => {
    if (scheme === 'SKEMA_1_MANAGED') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-bold text-xs py-0.5">
          <Briefcase className="w-3 h-3 text-blue-600" />
          <span>Skema 1: Managed</span>
        </Badge>
      );
    }
    if (scheme === 'SKEMA_2_SAAS') {
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 gap-1 font-bold text-xs py-0.5">
          <Coins className="w-3 h-3 text-teal-600" />
          <span>Skema 2: SaaS Platform</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 font-bold text-xs py-0.5">
        <Layers className="w-3 h-3 text-purple-600" />
        <span>Hybrid (1 & 2)</span>
      </Badge>
    );
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = (
        (c.name || '').toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.picName || '').toLowerCase().includes(q)
      );

      const matchScheme = 
        schemeFilter === 'all' || 
        (schemeFilter === 'managed' && c.serviceScheme === 'SKEMA_1_MANAGED') ||
        (schemeFilter === 'saas' && c.serviceScheme === 'SKEMA_2_SAAS') ||
        (schemeFilter === 'hybrid' && c.serviceScheme === 'HYBRID');

      return matchSearch && matchScheme;
    });
  }, [clients, search, schemeFilter]);

  const stats = useMemo(() => {
    const total = clients.length;
    const managedCount = clients.filter(c => c.serviceScheme === 'SKEMA_1_MANAGED').length;
    const saasCount = clients.filter(c => c.serviceScheme === 'SKEMA_2_SAAS').length;
    const hybridCount = clients.filter(c => c.serviceScheme === 'HYBRID').length;
    const totalBatches = clients.reduce((acc, c) => acc + (c.totalBatches || 0), 0);
    const totalCandidates = clients.reduce((acc, c) => acc + (c.totalCandidates || 0), 0);
    return { total, managedCount, saasCount, hybridCount, totalBatches, totalCandidates };
  }, [clients]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            Manajemen Klien Perusahaan (B2B SaaS Hub)
          </h2>
          <p className="text-sm text-slate-500">
            Kunci <strong>Battery Test</strong> resmi, sediakan <strong>Bank Psikogram Jabatan</strong>, dan atur kuota ujian untuk masing-masing mitra.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="gap-2 self-start sm:self-auto font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Tambah Klien Perusahaan</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Perusahaan</p>
              <h3 className="text-xl font-black text-slate-900">{stats.total} <span className="text-xs font-normal text-slate-500">Mitra</span></h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase">Skema 1: Managed</p>
              <h3 className="text-xl font-black text-blue-900">{stats.managedCount} Klien</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-teal-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-100 text-teal-700">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-700 uppercase">Skema 2: SaaS</p>
              <h3 className="text-xl font-black text-teal-900">{stats.saasCount} Klien</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-700 uppercase">Hybrid (1 & 2)</p>
              <h3 className="text-xl font-black text-purple-900">{stats.hybridCount} Klien</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Klien Mitra, Setting Battery Test & Bank Psikogram
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Total Riwayat: <strong>{stats.totalBatches} Sesi Ujian</strong> ({stats.totalCandidates} Peserta Terdaftar)
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Filter Skema */}
              <select
                value={schemeFilter}
                onChange={e => setSchemeFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
              >
                <option value="all">Semua Skema Layanan</option>
                <option value="managed">Skema 1: Managed Assessment</option>
                <option value="saas">Skema 2: B2B SaaS Platform</option>
                <option value="hybrid">Hybrid (1 & 2)</option>
              </select>

              {/* Search Field */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari perusahaan, PIC, atau username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                <TableHead className="font-bold text-xs uppercase text-slate-500">Perusahaan Klien</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Skema</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Kontak PIC</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Battery Test & Bank Psikogram</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Saldo Kuota</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-center w-48">Rekap Asesmen</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data klien perusahaan...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    Belum ada data perusahaan klien yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const remaining = Math.max(0, (client.totalQuota || 0) - (client.usedQuota || 0));
                  const jobsCount = client.assignedJobPositionIds?.length || 0;

                  return (
                    <TableRow key={client.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nama Perusahaan (Link ke Halaman Kelola Klien) */}
                      <TableCell className="font-semibold text-slate-900">
                        <Link href={`/superadmin/clients/${client.id}`} className="flex items-center gap-2.5 group">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 font-bold text-xs group-hover:bg-teal-100 transition-colors">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{client.name}</span>
                            <code className="text-xs text-slate-400 font-mono">@{client.username}</code>
                          </div>
                        </Link>
                      </TableCell>

                      {/* Skema Layanan */}
                      <TableCell>
                        {renderSchemeBadge(client.serviceScheme)}
                      </TableCell>

                      {/* Kontak & PIC dalam 1 Kolom */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate max-w-[170px]">{client.picName || 'PIC Belum Diset'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{client.phone || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{client.email || `${client.username}@klien.id`}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Battery Test & Bank Psikogram (Link ke Halaman Builder Klien) */}
                      <TableCell className="max-w-xs">
                        <div className="flex flex-col gap-1.5">
                          {/* Battery Test Kunci */}
                          <Link
                            href={`/superadmin/clients/${client.id}?tab=battery`}
                            className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-teal-900 group"
                            title="Klik untuk setting urutan Baterai Tes resmi mitra"
                          >
                            <LockKeyhole className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="font-bold text-teal-950">Battery:</span>
                            <span className="truncate max-w-[180px] font-medium text-slate-600 group-hover:underline">
                              {client.batteryTest?.join(' • ') || 'WPT • Kraepelin • DISC'}
                            </span>
                          </Link>

                          {/* Bank Psikogram */}
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/superadmin/clients/${client.id}?tab=psychograph`}
                              className="inline-flex"
                            >
                              <Badge variant="outline" className="text-[10px] bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border-slate-200 hover:border-teal-300 font-semibold gap-1 py-0 cursor-pointer transition-colors">
                                <FileCheck2 className="w-2.5 h-2.5 text-slate-500" />
                                <span>{jobsCount} Jabatan di Bank Psikogram</span>
                              </Badge>
                            </Link>
                          </div>

                          {/* Tombol Cepat Buka Halaman Pengaturan */}
                          <Link
                            href={`/superadmin/clients/${client.id}`}
                            className="text-[10px] font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 self-start pt-0.5"
                          >
                            <Settings2 className="w-3 h-3" />
                            <span>Buka Halaman Pengaturan Mitra</span>
                          </Link>
                        </div>
                      </TableCell>

                      {/* Saldo Kuota */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">
                            {remaining} <span className="text-[11px] text-slate-500 font-normal">/ {client.totalQuota || 0} Kandidat</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {client.usedQuota || 0} Sesi Terpakai
                          </span>
                        </div>
                      </TableCell>

                      {/* Rekap Asesmen (Link ke Halaman Riwayat Sesi) */}
                      <TableCell className="text-center">
                        <Link
                          href={`/superadmin/clients/${client.id}?tab=history`}
                          className="w-full p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-all text-left flex flex-col gap-0.5 cursor-pointer group shadow-2xs block"
                          title="Klik untuk melihat seluruh riwayat batch asesmen klien ini"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700 flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                              {client.totalBatches || 0} Sesi Ujian
                            </span>
                            <span className="text-[10px] text-teal-600 font-bold group-hover:underline flex items-center">
                              Buka <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Total: <strong className="text-slate-700 font-bold">{client.totalCandidates || 0} Peserta</strong>
                          </span>
                        </Link>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Tombol Masuk ke Halaman Pengaturan Mitra */}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 text-teal-700 border-teal-200 hover:bg-teal-50 font-bold"
                            title="Buka Halaman Setting Baterai & Psikogram Mitra"
                          >
                            <Link href={`/superadmin/clients/${client.id}`}>
                              <Settings2 className="w-3.5 h-3.5 text-teal-600" />
                              <span>Kelola</span>
                            </Link>
                          </Button>

                          {(client.isPermanentLocked || (client.lockedUntil && new Date(client.lockedUntil) > new Date())) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleUnlockClient(client)}
                              className="h-8 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              title="Buka kunci akun"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(client)}
                            className="h-8 px-2 text-xs gap-1 text-slate-700 font-semibold"
                            title="Edit profil klien"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInitiateDeleteClient(client)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Klien"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>



      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: TAMBAH / EDIT KLIEN PERUSAHAAN (PROFIL DASAR)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              {editingClient ? 'Edit Profil Klien Perusahaan' : 'Tambah Klien Perusahaan Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Isi data perusahaan, PIC, kredensial login, dan kuota awal klien.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
            {/* PILIHAN SKEMA LAYANAN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800">
                Pilih Skema Layanan B2B <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label 
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                    formData.serviceScheme === 'SKEMA_1_MANAGED'
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="serviceScheme"
                      value="SKEMA_1_MANAGED"
                      checked={formData.serviceScheme === 'SKEMA_1_MANAGED'}
                      onChange={() => setFormData({ ...formData, serviceScheme: 'SKEMA_1_MANAGED' })}
                      className="accent-blue-600"
                    />
                    <span className="text-xs font-bold text-blue-900">Skema 1: Managed</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">Terima Beres (Full Service)</span>
                </label>

                <label 
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                    formData.serviceScheme === 'SKEMA_2_SAAS'
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="serviceScheme"
                      value="SKEMA_2_SAAS"
                      checked={formData.serviceScheme === 'SKEMA_2_SAAS'}
                      onChange={() => setFormData({ ...formData, serviceScheme: 'SKEMA_2_SAAS' })}
                      className="accent-teal-600"
                    />
                    <span className="text-xs font-bold text-teal-900">Skema 2: SaaS</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">Sewa Platform & Mandiri</span>
                </label>

                <label 
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                    formData.serviceScheme === 'HYBRID'
                      ? 'border-purple-500 bg-purple-50/50 shadow-xs ring-1 ring-purple-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="serviceScheme"
                      value="HYBRID"
                      checked={formData.serviceScheme === 'HYBRID'}
                      onChange={() => setFormData({ ...formData, serviceScheme: 'HYBRID' })}
                      className="accent-purple-600"
                    />
                    <span className="text-xs font-bold text-purple-900">Hybrid (1 & 2)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">Fleksibel (SaaS + Managed)</span>
                </label>
              </div>
            </div>

            {/* INFORMASI PERUSAHAAN & PIC */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nama Perusahaan / Instansi Klien <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: PT Sumber Alfaria Trijaya Tbk"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Nama PIC, WA, Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Nama PIC / Kontak HRD</label>
                <Input
                  type="text"
                  placeholder="Contoh: Bpk. Budi Santoso"
                  value={formData.picName}
                  onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">No. WhatsApp PIC</label>
                <Input
                  type="text"
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Email Resmi HRD</label>
                <Input
                  type="email"
                  placeholder="hrd@perusahaan.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: alfamart_hrd"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Password Login {formData.serviceScheme === 'SKEMA_1_MANAGED' ? '(Opsional)' : <span className="text-rose-500">*</span>}
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showClientPassword ? 'text' : 'password'}
                    placeholder={editingClient ? 'Kosongkan jika tidak diubah' : formData.serviceScheme === 'SKEMA_1_MANAGED' ? 'Otomatis dibuat jika kosong' : 'Password login klien'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientPassword(prev => !prev)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer p-1"
                    tabIndex={-1}
                  >
                    {showClientPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Status Akun</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="active">Aktif (Dapat Mengakses Sesi)</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Kuota Awal Kandidat</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={formData.totalQuota}
                  onChange={(e) => setFormData({ ...formData, totalQuota: e.target.value })}
                  className="h-9 text-xs font-bold text-teal-900"
                />
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
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Klien'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP MODAL: BLOKIR HAPUS KLIEN BERISI BATCH
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(blockedData?.isOpen)} onOpenChange={(open) => !open && setBlockedData(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs mb-1">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Tidak Dapat Dihapus
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed text-center">
              Perusahaan klien <strong className="text-slate-900 font-bold">&quot;{blockedData?.clientName}&quot;</strong> saat ini masih memiliki <strong className="text-amber-700 font-bold">{blockedData?.totalBatches || 0} batch jadwal ujian</strong> aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl flex flex-col gap-2 my-1">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              Perlindungan Relasi Integritas Data:
            </span>
            <p className="text-[11px] text-amber-900/90 leading-normal">
              Penghapusan perusahaan ini diblokir secara otomatis oleh sistem karena akan memutus integritas data relasi pada ribuan lembar jawaban peserta, log rekaman proctoring, serta rekap skor psikogram yang sudah tersimpan di arsip.
            </p>
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button
              type="button"
              variant="default"
              onClick={() => setBlockedData(null)}
              className="w-full sm:w-auto font-bold bg-slate-800 hover:bg-slate-900"
            >
              Saya Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP MODAL: KONFIRMASI HAPUS KLIEN BERSIH (0 BATCH)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(confirmDeleteData?.isOpen)} onOpenChange={(open) => !open && setConfirmDeleteData(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs mb-1">
              <Trash2 className="w-7 h-7" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Hapus Klien Perusahaan?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 text-center">
              Apakah Anda yakin ingin menghapus akun klien <strong className="text-slate-900 font-bold">&quot;{confirmDeleteData?.name}&quot;</strong>?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-slate-500 text-center">
            Perusahaan ini belum memiliki histori sesi ujian, sehingga dapat dihapus dengan aman dari sistem. Tindakan ini tidak dapat dibatalkan.
          </p>

          <DialogFooter className="sm:justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteData(null)}
              disabled={confirmDeleteData?.isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteClient}
              disabled={confirmDeleteData?.isDeleting}
              className="gap-2 font-bold"
            >
              {confirmDeleteData?.isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{confirmDeleteData?.isDeleting ? 'Menghapus...' : 'Ya, Hapus Klien'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
