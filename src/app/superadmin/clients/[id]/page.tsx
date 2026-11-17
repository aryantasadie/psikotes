'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  Target,
  Coins,
  History,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  Pencil,
  Check,
  Loader2,
  Settings2,
  FileSpreadsheet,
  Briefcase,
  UserCheck,
  Phone,
  Mail,
  FolderOpen,
  ChevronRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
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

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clientId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab
  const initialTab = (searchParams.get('tab') as 'battery' | 'psychograph' | 'quota' | 'history') || 'battery';
  const [activeTab, setActiveTab] = useState<'battery' | 'psychograph' | 'quota' | 'history'>(initialTab);

  // Data State
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tab 1: Battery Test State
  const [batteryTestId, setBatteryTestId] = useState<number | null>(null);
  const [batteryTitle, setBatteryTitle] = useState<string>('');
  const [batterySequence, setBatterySequence] = useState<string[]>([]);
  const [savingBattery, setSavingBattery] = useState(false);

  // Tab 2: Job Positions State
  const [jobViewMode, setJobViewMode] = useState<'list' | 'builder'>('list');
  const [positionViewMode, setPositionViewMode] = useState<'grid' | 'table'>('table');
  const [clientJobPositions, setClientJobPositions] = useState<any[]>([]);
  const [psychographPresets, setPsychographPresets] = useState<any[]>([]);
  const [assignedJobIds, setAssignedJobIds] = useState<number[]>([]);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobName, setJobName] = useState<string>('');
  const [jobDesc, setJobDesc] = useState<string>('');
  const [jobPresetId, setJobPresetId] = useState<string>('');
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [flatAspects, setFlatAspects] = useState<string[]>([]);
  const [grayAreas, setGrayAreas] = useState<Record<string, { targetScore: number }>>({});
  const [savingJob, setSavingJob] = useState(false);

  // Tab 3: Quota & Profile State
  const [totalQuota, setTotalQuota] = useState<string>('100');
  const [savingQuota, setSavingQuota] = useState(false);

  // Tab 4: Batches History
  const [batches, setBatches] = useState<any[]>([]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/clients/${clientId}`);
      if (!res.ok) {
        throw new Error('Klien tidak ditemukan');
      }
      const data = await res.json();
      setClient(data.client);

      // Battery Test
      if (data.batteryTest) {
        setBatteryTestId(data.batteryTest.id);
        setBatteryTitle(data.batteryTest.title || `Baterai Tes Resmi - ${data.client.name}`);
        setBatterySequence(data.batteryTest.sequence || ['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
      }

      // Positions: ambil hanya posisi jabatan valid yang memiliki aturan gray area / preset aktif (sesuai database tabel psikogram)
      const rawPositions = [
        ...(data.positions.clientCustom || []),
        ...(data.positions.general || [])
      ];
      const validPositions = rawPositions.filter(p => (p.grayAreas && p.grayAreas.length > 0) || p.psychographPresetId);
      setClientJobPositions(validPositions);
      setAssignedJobIds(data.positions.assignedIds || [9]);

      // Presets
      setPsychographPresets(data.presets || []);

      // Quota
      setTotalQuota(String(data.client.totalQuota || 100));

      // Batches
      setBatches(data.batches || []);
    } catch (e) {
      console.error(e);
      setFlashMsg({ text: 'Gagal memuat data klien', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  // Sync tab with URL
  const handleTabChange = (tab: 'battery' | 'psychograph' | 'quota' | 'history') => {
    setActiveTab(tab);
    setJobViewMode('list');
    setFlashMsg(null);
    router.replace(`/superadmin/clients/${clientId}?tab=${tab}`, { scroll: false });
  };

  // Preset Mapping Parser for Job Position Builder
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

  // ─── TAB 1: BATTERY TEST HANDLERS ──────────────────────────────────────────
  const handleAddTest = (tool: string) => {
    setBatterySequence(prev => [...prev, tool]);
  };

  const handleRemoveTest = (idx: number) => {
    setBatterySequence(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveTest = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= batterySequence.length) return;
    const newSeq = [...batterySequence];
    const item = newSeq[idx];
    newSeq.splice(idx, 1);
    newSeq.splice(targetIdx, 0, item);
    setBatterySequence(newSeq);
  };

  const handleApplyBatteryTemplate = (preset: 'operator' | 'staff' | 'manager') => {
    if (preset === 'operator') {
      setBatterySequence(['WPT', 'Kraepelin', 'DISC']);
    } else if (preset === 'staff') {
      setBatterySequence(['WPT', 'Kraepelin', 'DISC', 'PAPI KOSTICK']);
    } else if (preset === 'manager') {
      setBatterySequence(['WPT', 'IST 2', 'IST 3', 'Kraepelin', 'DISC', 'PAPI KOSTICK', 'MSDT']);
    }
  };

  const handleSaveBatteryTest = async () => {
    if (batterySequence.length === 0) {
      alert('Pilih minimal satu modul tes untuk rangkaian Baterai Tes.');
      return;
    }

    setSavingBattery(true);
    setFlashMsg(null);
    try {
      const url = batteryTestId ? `/api/superadmin/tests/${batteryTestId}` : '/api/superadmin/tests';
      const method = batteryTestId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: batteryTitle.trim() || `Baterai Tes Resmi - ${client.name}`,
          sequence: batterySequence,
          clientId
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setBatteryTestId(saved.id);

        // Update license batteryTest
        await fetch('/api/superadmin/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: clientId,
            name: client.name,
            username: client.username,
            batteryTest: batterySequence,
            assignedJobPositionIds: assignedJobIds,
            totalQuota: parseInt(totalQuota, 10) || 100
          })
        });

        setFlashMsg({ text: 'Baterai Tes resmi mitra berhasil disimpan ke database!', type: 'success' });
      } else {
        const d = await res.json();
        setFlashMsg({ text: d.error || 'Gagal menyimpan Baterai Tes', type: 'error' });
      }
    } catch {
      setFlashMsg({ text: 'Terjadi kesalahan jaringan.', type: 'error' });
    } finally {
      setSavingBattery(false);
    }
  };

  // ─── TAB 2: JOB POSITION HANDLERS ──────────────────────────────────────────
  const toggleAssignedJob = async (jobId: number) => {
    const updatedIds = assignedJobIds.includes(jobId)
      ? assignedJobIds.filter(id => id !== jobId)
      : [...assignedJobIds, jobId];

    setAssignedJobIds(updatedIds);

    // Langsung autosave ke client license
    try {
      await fetch('/api/superadmin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clientId,
          name: client.name,
          username: client.username,
          batteryTest: batterySequence,
          assignedJobPositionIds: updatedIds,
          totalQuota: parseInt(totalQuota, 10) || 100
        })
      });
    } catch (e) {
      console.error(e);
    }
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
    if (!jobName.trim()) {
      alert('Nama Standar Jabatan harus diisi.');
      return;
    }
    if (!jobPresetId) {
      alert('Template Preset Psikogram harus dipilih.');
      return;
    }

    setSavingJob(true);
    setFlashMsg(null);
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
          clientId,
          grayAreas: flatAspects.map(a => ({
            parameter: a,
            targetScore: grayAreas[a]?.targetScore || 3
          }))
        })
      });

      if (res.ok) {
        const savedPos = await res.json();
        if (!editingJobId && savedPos.id) {
          setAssignedJobIds(prev => [...prev, savedPos.id]);
        }
        await fetchClientData();
        setJobViewMode('list');
        setFlashMsg({ text: 'Standar Psikogram Jabatan mitra berhasil disimpan ke database!', type: 'success' });
      } else {
        const d = await res.json();
        setFlashMsg({ text: d.error || 'Gagal menyimpan Standar Jabatan', type: 'error' });
      }
    } catch {
      setFlashMsg({ text: 'Terjadi kesalahan jaringan.', type: 'error' });
    } finally {
      setSavingJob(false);
    }
  };

  const getAspectDesc = (aspectName: string, directDesc?: string) => {
    if (directDesc && directDesc.trim()) return directDesc.trim();
    if (ASPECT_DESCRIPTIONS[aspectName]) return ASPECT_DESCRIPTIONS[aspectName];
    const norm = aspectName.trim().toLowerCase();
    for (const [k, v] of Object.entries(ASPECT_DESCRIPTIONS)) {
      if (k.toLowerCase() === norm) return v;
    }
    return '—';
  };

  // ─── TAB 3: QUOTA & PROFILE HANDLERS ───────────────────────────────────────
  const handleSaveQuotaAndProfile = async () => {
    const qNum = parseInt(totalQuota, 10);
    if (isNaN(qNum) || qNum < 0) {
      alert('Kuota kandidat harus berupa angka valid (>= 0).');
      return;
    }

    setSavingQuota(true);
    setFlashMsg(null);
    try {
      const res = await fetch('/api/superadmin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clientId,
          name: client.name,
          username: client.username,
          serviceScheme: client.serviceScheme || 'SKEMA_2_SAAS',
          batteryTest: batterySequence,
          assignedJobPositionIds: assignedJobIds,
          totalQuota: qNum
        })
      });

      if (res.ok) {
        setFlashMsg({ text: 'Alokasi kuota kandidat & profil mitra berhasil diperbarui!', type: 'success' });
        await fetchClientData();
      } else {
        const d = await res.json();
        setFlashMsg({ text: d.error || 'Gagal memperbarui kuota mitra.', type: 'error' });
      }
    } catch {
      setFlashMsg({ text: 'Terjadi kesalahan koneksi server.', type: 'error' });
    } finally {
      setSavingQuota(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-sm font-semibold">Memuat konfigurasi layanan mitra...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
        <p className="text-sm font-bold text-rose-600">Perusahaan klien tidak ditemukan.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/superadmin/clients">Kembali ke Daftar Klien</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ── HEADER HALAMAN (FULL PAGE BUKAN CARD POP-UP) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <Link
            href="/superadmin/clients"
            className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
            title="Kembali ke Daftar Klien"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 font-bold text-xs py-0.5">
                @{client.username}
              </Badge>
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold text-xs py-0.5">
                {client.serviceScheme}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pengaturan Baterai Tes resmi, Bank Standar Psikogram Jabatan & Kuota Kandidat Mitra
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
          <span className="text-slate-500">Saldo Kuota:</span>
          <strong className="text-teal-900 font-bold">
            {client.remainingQuota} <span className="font-normal text-slate-500">/ {client.totalQuota} Kandidat</span>
          </strong>
        </div>
      </div>

      {flashMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          flashMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <span>{flashMsg.text}</span>
          <button type="button" onClick={() => setFlashMsg(null)} className="text-xs underline font-bold cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* ── NAVIGASI TAB HALAMAN (BUKAN POP-UP) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('battery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'battery'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>1. Baterai Tes Mitra</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'battery' ? 'bg-white/20' : 'bg-slate-100'}`}>
            {batterySequence.length} Modul
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('psychograph')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'psychograph'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>2. Bank Psikogram Jabatan</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'psychograph' ? 'bg-white/20' : 'bg-slate-100'}`}>
            {clientJobPositions.length} Formasi
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('quota')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'quota'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>3. Alokasi Kuota & Profil</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>4. Riwayat Sesi Asesmen</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'history' ? 'bg-white/20' : 'bg-slate-100'}`}>
            {batches.length} Sesi
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: BATERAI TES RESMI MITRA (TAMPILAN BUILDER 2 KOLOM PERSIS SUPERADMIN)
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'battery' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KOLOM KIRI: Identitas & Urutan Pengerjaan Ujian */}
          <div className="flex flex-col gap-5">
            {/* Input Nama Paket */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Nama Paket Baterai Tes Mitra <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={batteryTitle}
                onChange={(e) => setBatteryTitle(e.target.value)}
                placeholder="Contoh: Baterai Tes Resmi - PT Maju Jaya"
                className="text-xs h-10"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Tersimpan di tabel <code>Test</code> dengan <code>clientId: {clientId}</code>. Rangkaian ini terkunci permanen untuk peserta mitra saat memilih Asesmen Jabatan.
              </p>
            </div>

            {/* Urutan Pengerjaan Ujian */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Urutan Pengerjaan Ujian ({batterySequence.length} Modul)
                  </h3>
                </div>
                <span className="text-[11px] text-teal-800 font-semibold">
                  Dikerjakan berurutan dari atas ke bawah
                </span>
              </div>

              {batterySequence.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  Belum ada alat tes di dalam rangkaian. Klik salah satu modul di kolom sebelah kanan untuk menambahkan.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {batterySequence.map((testName, idx) => (
                    <div
                      key={`${testName}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{testName}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveTest(idx, 'up')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Geser ke Atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === batterySequence.length - 1}
                          onClick={() => handleMoveTest(idx, 'down')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Geser ke Bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(idx)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer ml-1"
                          title="Hapus dari Urutan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  disabled={savingBattery || batterySequence.length === 0}
                  onClick={handleSaveBatteryTest}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 text-xs h-10 px-6"
                >
                  {savingBattery && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{savingBattery ? 'Menyimpan...' : 'Simpan Baterai Tes Mitra'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Bank Alat Tes yang Tersedia */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4 self-start">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bank Alat Tes yang Tersedia
                </h3>
                <p className="text-[11px] text-slate-500">
                  Klik alat tes untuk memasukkannya ke rangkaian ujian di sebelah kiri
                </p>
              </div>

              {/* Shortcut Template */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">Template:</span>
                <button
                  type="button"
                  onClick={() => handleApplyBatteryTemplate('operator')}
                  className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md cursor-pointer"
                >
                  Operator
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBatteryTemplate('staff')}
                  className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md cursor-pointer"
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBatteryTemplate('manager')}
                  className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md cursor-pointer"
                >
                  Manager
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_TEST_BATTERY.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleAddTest(tool)}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-slate-800 hover:text-teal-900 text-xs font-bold transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                >
                  <span>{tool}</span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: BANK PSIKOGRAM JABATAN (FULL PAGE BUILDER PERSIS SUPERADMIN)
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'psychograph' && (
        <div className="space-y-6">
          {jobViewMode === 'list' ? (
            /* SUB-VIEW 1: DAFTAR STANDAR JABATAN MITRA & PILIHAN AKTIF */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bank Standar Jabatan Mitra ({clientJobPositions.length} Formasi)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar formasi posisi jabatan yang dialokasikan untuk mitra ini, lengkap dengan target skor minimum Gray Area per aspek psikologis.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* View Mode Toggle: Tabel Persis Img 2 atau Kartu */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPositionViewMode('table')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        positionViewMode === 'table'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tabel Standar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPositionViewMode('grid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        positionViewMode === 'grid'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kartu
                    </button>
                  </div>

                  <Button
                    asChild
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 h-9 px-4"
                  >
                    <Link href={`/superadmin/job-positions/builder?fromClient=${clientId}`}>
                      <Plus className="w-4 h-4" />
                      <span>Buat Standar Baru</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* TAMPILAN 1: TABEL PERSIS STANDAR PSIKOGRAM (GAMBAR 2) */}
              {positionViewMode === 'table' ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-200">
                        <TableHead className="font-bold text-xs uppercase text-slate-600 w-12 text-center">Aktif</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-600">Jabatan (Posisi)</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-600">Perusahaan Mitra</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-600">Paket Alat Tes & Standar</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-600 text-right pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientJobPositions.map((pos) => {
                        const isChecked = assignedJobIds.includes(pos.id);
                        const isGeneral = !pos.clientId;
                        const presetName = pos.psychographPreset?.name || 'Paket Kustom';
                        const grayCount = pos.grayAreas?.length || 0;

                        return (
                          <TableRow 
                            key={pos.id} 
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isChecked ? 'bg-teal-50/20' : ''
                            }`}
                          >
                            {/* Checkbox Alokasi ke Mitra */}
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleAssignedJob(pos.id)}
                                className="w-4 h-4 rounded accent-teal-600 cursor-pointer align-middle"
                                title="Aktifkan untuk portal mitra"
                              />
                            </TableCell>

                            {/* 1. Jabatan */}
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                                  <Briefcase className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">{pos.name}</span>
                                    {isChecked && (
                                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-bold py-0">
                                        Aktif di Mitra
                                      </Badge>
                                    )}
                                  </div>
                                  {pos.description && (
                                    <span className="text-xs text-slate-400 line-clamp-1">{pos.description}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* 2. Perusahaan Mitra */}
                            <TableCell>
                              {isGeneral ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Umum / Semua Klien</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800">
                                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Khusus: {client.name}</span>
                                </div>
                              )}
                            </TableCell>

                            {/* 3. Paket Alat Tes & Standar */}
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-slate-800">
                                  {presetName}
                                </span>
                                <Badge variant="outline" className="w-fit text-xs bg-teal-50 text-teal-700 border-teal-200 gap-1 font-semibold py-0.5">
                                  <Layers className="w-3 h-3" />
                                  <span>{grayCount} Aturan Gray Area</span>
                                </Badge>
                              </div>
                            </TableCell>

                            {/* 4. Aksi: Edit Standar */}
                            <TableCell className="text-right pr-6">
                              <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 font-bold text-teal-700 hover:text-teal-900 hover:bg-teal-50 border-teal-200 shadow-2xs">
                                <Link href={`/superadmin/job-positions/builder?id=${pos.id}&fromClient=${clientId}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit Standar</span>
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* TAMPILAN 2: GRID KARTU (PERSIS DATA DATABASE ASLI) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientJobPositions.map((pos) => {
                    const isChecked = assignedJobIds.includes(pos.id);
                    const isGeneral = !pos.clientId;
                    const presetName = pos.psychographPreset?.name || 'Paket Kustom';
                    const grayCount = pos.grayAreas?.length || 0;

                    return (
                      <div
                        key={pos.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isChecked
                            ? 'bg-white border-teal-400 shadow-sm ring-1 ring-teal-400/50'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssignedJob(pos.id)}
                            className="w-4 h-4 rounded accent-teal-600 mt-1 cursor-pointer shrink-0"
                            title="Aktifkan untuk portal mitra"
                          />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 text-sm">{pos.name}</span>
                              {isGeneral ? (
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 font-bold py-0.5">
                                  Standar Umum
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-200 font-bold py-0.5">
                                  Khusus Mitra
                                </Badge>
                              )}
                            </div>
                            {pos.description && (
                              <p className="text-xs text-slate-500 mt-1">{pos.description}</p>
                            )}
                            <div className="flex flex-col gap-1 mt-2">
                              <span className="text-xs text-slate-700 font-medium">
                                Preset: <strong className="text-slate-900">{presetName}</strong>
                              </span>
                              <Badge variant="outline" className="w-fit text-[11px] bg-teal-50 text-teal-700 border-teal-200 gap-1 font-semibold py-0.5">
                                <Layers className="w-3 h-3" />
                                <span>{grayCount} Aturan Gray Area</span>
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                          <span className="text-slate-400 text-[11px]">
                            {isChecked ? '✓ Aktif di Portal Mitra' : 'Nonaktif'}
                          </span>
                          <Link
                            href={`/superadmin/job-positions/builder?id=${pos.id}&fromClient=${clientId}`}
                            className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-bold cursor-pointer text-xs transition-colors py-1 px-2.5 rounded-lg hover:bg-teal-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Standar</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* SUB-VIEW 2: FORM BUILDER STANDAR JABATAN & GRAY AREA (FULL PAGE 100% PERSIS SUPERADMIN) */
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setJobViewMode('list')}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Jabatan</span>
                </button>
                <h2 className="text-base font-bold text-slate-900">
                  {editingJobId ? 'Edit Standar Jabatan Mitra' : 'Buat Standar Jabatan Baru untuk Mitra'}
                </h2>
              </div>

              {/* Identitas Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Identitas Standar Jabatan</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Standar Jabatan <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="Contoh: Staff HR / Driver / Operator Pabrik"
                      className="text-xs h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Deskripsi Formasi (opsional)
                    </label>
                    <Input
                      type="text"
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                      placeholder="Contoh: Standar rekrutmen tahun 2026"
                      className="text-xs h-10"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Template Preset Psikogram & Baterai Tes <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={jobPresetId}
                      onChange={(e) => setJobPresetId(e.target.value)}
                      className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white"
                    >
                      <option value="">— Pilih Template Preset —</option>
                      {psychographPresets.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Gray Area Table */}
              {flatAspects.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Standar Gray Area — {flatAspects.length} Dimensi Psikologis
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Pilih level minimum target skor yang disyaratkan untuk formasi ini</p>
                    </div>

                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-slate-500">
                      {SCORE_LABELS.map((s) => (
                        <span key={s.value} className="flex items-center gap-1">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                            s.value >= 3 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                          }`}>{s.value}</span>
                          <span>{s.full}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase text-xs w-[45%]">Dimensi Psikologis</th>
                          {SCORE_LABELS.map((s) => (
                            <th key={s.value} className={`px-4 py-3 text-center font-bold uppercase text-xs ${
                              s.value >= 3 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'
                            }`}>
                              {s.label}<br/><span className="text-[10px] font-medium opacity-70">({s.full})</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeCategories.map((group) => (
                          <React.Fragment key={group.category}>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <td colSpan={6} className="px-6 py-2.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                                {group.category}
                              </td>
                            </tr>
                            {group.aspects.map((aspectItem: any) => {
                              const aspectName = aspectItem.name;
                              const aspectDesc = getAspectDesc(aspectName, aspectItem.description);
                              const selected = grayAreas[aspectName]?.targetScore || 3;

                              return (
                                <tr key={aspectName} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-semibold text-slate-900">{aspectName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-sm">{aspectDesc}</p>
                                  </td>
                                  {SCORE_LABELS.map((s) => (
                                    <td key={s.value} className={`px-4 py-4 text-center ${s.value >= 3 ? 'bg-teal-50/40' : ''}`}>
                                      <button
                                        type="button"
                                        onClick={() => setGrayAreas(prev => ({
                                          ...prev,
                                          [aspectName]: { targetScore: s.value }
                                        }))}
                                        className="flex items-center justify-center mx-auto cursor-pointer focus:outline-none"
                                      >
                                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          selected === s.value
                                            ? 'border-teal-500 bg-teal-500'
                                            : 'border-slate-300 hover:border-teal-400'
                                        }`}>
                                          {selected === s.value && (
                                            <span className="w-2 h-2 rounded-full bg-white" />
                                          )}
                                        </span>
                                      </button>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sticky Save Bar */}
              <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-slate-200 px-6 py-4 rounded-2xl flex justify-end gap-3 z-40 shadow-xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJobViewMode('list')}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={savingJob}
                  onClick={handleSaveJobPosition}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2"
                >
                  {savingJob && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{savingJob ? 'Menyimpan…' : 'Simpan Standar Jabatan Mitra'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: ALOKASI KUOTA KANDIDAT & PROFIL KLIEN
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quota' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Coins className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Alokasi Saldo Kuota Kandidat Mitra
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Sistem menghitung 1 Kuota = 1 Peserta Tuntas Mulai Ujian (Anti-Ghosting). Kuota tidak akan terpotong untuk kandidat yang mangkir / belum membuka sesi.
            </p>

            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[11px] text-slate-500 block">Total Kuota</span>
                <strong className="text-lg font-bold text-slate-900">{client.totalQuota}</strong>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-[11px] text-emerald-700 block">Terpakai</span>
                <strong className="text-lg font-bold text-emerald-900">{client.usedQuota}</strong>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
                <span className="text-[11px] text-teal-700 block">Sisa Kuota</span>
                <strong className="text-lg font-bold text-teal-900">{client.remainingQuota}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-slate-700 shrink-0">Ubah Total Kuota:</label>
              <Input
                type="number"
                min="0"
                value={totalQuota}
                onChange={(e) => setTotalQuota(e.target.value)}
                className="w-32 h-10 text-xs font-bold text-teal-900 bg-white"
              />
              <span className="text-xs text-slate-500">Kandidat</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                disabled={savingQuota}
                onClick={handleSaveQuotaAndProfile}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 text-xs"
              >
                {savingQuota && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{savingQuota ? 'Menyimpan...' : 'Perbarui Saldo Kuota'}</span>
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Informasi Perusahaan & Kontak PIC
              </h3>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">Nama Perusahaan</span>
                <strong className="text-slate-900">{client.name}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">Username Login Portal</span>
                <code className="text-teal-700 font-bold">@{client.username}</code>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">Nama PIC</span>
                <strong className="text-slate-900">{client.picName || 'Belum Diset'}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">Nomor WhatsApp</span>
                <strong className="text-slate-900">{client.phone || '-'}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">Email Korespondensi</span>
                <strong className="text-slate-900">{client.email || `${client.username}@klien.id`}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 4: RIWAYAT SESI ASESMEN KLIEN (FULL TABLE BUKAN CARD POP-UP)
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Sesi Ujian & Asesmen ({batches.length} Batch)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seluruh batch ujian yang pernah dijalankan untuk mitra {client.name}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHead className="w-12 text-center text-xs font-bold uppercase text-slate-500">No</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Nama Sesi / Batch</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Tanggal</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Skema</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase text-slate-500">Peserta Selesai</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Laporan</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    Belum ada riwayat sesi batch ujian untuk klien ini.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((b, idx) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/70">
                    <TableCell className="text-center text-xs text-slate-400">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{b.title}</span>
                        <span className="text-[11px] text-slate-500">{b.jobPositionName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          b.scheme.includes('Managed')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}
                      >
                        {b.scheme}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      <span className="text-emerald-700 font-bold">{b.completedParticipants}</span>
                      <span className="text-slate-400"> / {b.totalParticipants}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1 border-teal-200 text-teal-700 hover:bg-teal-50">
                        <Link href={`/superadmin/reports/batch/${b.id}`} target="_blank">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Rekap Nilai</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
