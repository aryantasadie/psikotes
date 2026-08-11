'use client';

import { useState, useEffect } from 'react';

interface BatchAccount {
  id: number;
  userId: number;
  username: string;
  name: string;
  status: string;
  password: string;
}

interface BatchSession {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  clientName: string;
  assignedTesters: string[];
  totalParticipants: number;
  completedParticipants: number;
  participants: BatchAccount[];
}

const AVAILABLE_TEST_TOOLS = [
  { id: 'WPT', label: 'WPT' },
  { id: 'IST', label: 'IST' },
  { id: 'PAPI KOSTICK', label: 'PAPI KOSTICK' },
  { id: 'DISC', label: 'DISC' },
  { id: 'CFIT', label: 'CFIT' },
  { id: 'TIKI', label: 'TIKI' },
  { id: 'MSDT', label: 'MSDT' },
  { id: 'POWER', label: 'POWER' },
  { id: 'Kraepelin', label: 'Kraepelin' },
  { id: 'Wartegg', label: 'Wartegg' },
  { id: 'Tes Grafis', label: 'Tes Grafis' },
];

export default function SchedulePage() {
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [testers, setTesters] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form State
  const [positionName, setPositionName] = useState('');
  const [selectedJobPositionId, setSelectedJobPositionId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTesterId, setSelectedTesterId] = useState('');
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom Test Tools Override State (Simplified)
  const [useCustomTools, setUseCustomTools] = useState(false);
  const [selectedCustomTools, setSelectedCustomTools] = useState<string[]>([]);

  // Result State (New Generation)
  const [generatedAccounts, setGeneratedAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // Batches List State
  const [batches, setBatches] = useState<BatchSession[]>([]);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(true);
  const [searchBatch, setSearchBatch] = useState<string>('');

  // Batch Detail Modal
  const [selectedBatchModal, setSelectedBatchModal] = useState<BatchSession | null>(null);

  useEffect(() => {
    fetchOptions();
    fetchBatches();
  }, []);

  const fetchOptions = () => {
    fetch('/api/superadmin/schedule/options')
      .then(res => res.json())
      .then(data => {
        if (data.jobPositions) setJobPositions(data.jobPositions);
        if (data.clients) setClients(data.clients);
        if (data.testers) setTesters(data.testers);
        setLoadingOptions(false);
      })
      .catch(err => {
        console.error('Failed to load options:', err);
        setLoadingOptions(false);
      });
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch('/api/superadmin/schedule/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    } finally {
      setLoadingBatches(false);
    }
  };

  const toggleCustomTool = (toolId: string) => {
    if (selectedCustomTools.includes(toolId)) {
      setSelectedCustomTools(selectedCustomTools.filter(t => t !== toolId));
    } else {
      setSelectedCustomTools([...selectedCustomTools, toolId]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobPositionId || !prefix || !count) return;

    if (useCustomTools && selectedCustomTools.length === 0) {
      alert('Silakan pilih minimal 1 alat tes spesifik yang akan diujikan.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    setGeneratedAccounts([]);

    try {
      const payload: any = {
        positionName: positionName.trim(),
        testId: parseInt(selectedJobPositionId),
        sessionDate,
        clientId: selectedClientId ? parseInt(selectedClientId) : null,
        testerId: selectedTesterId ? parseInt(selectedTesterId) : null,
        prefix: prefix.trim(),
        count: parseInt(count)
      };

      if (useCustomTools && selectedCustomTools.length > 0) {
        payload.customSequence = selectedCustomTools;
      }

      const res = await fetch('/api/superadmin/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setGeneratedAccounts(data.accounts);
        fetchBatches();
      } else {
        setMessage(data.error || 'Terjadi kesalahan saat membuat sesi');
      }
    } catch (err) {
      setMessage('Gagal menghubungi server');
    }

    setSubmitting(false);
  };

  // Salin Tabular Excel
  const handleCopyNewExcel = () => {
    const text = generatedAccounts.map(acc => `${acc.username}\t${acc.password}`).join('\n');
    navigator.clipboard.writeText(`Username\tPassword\n${text}`);
    alert('Berhasil disalin ke Clipboard format Excel!');
  };

  // Salin Format WA/Pesan untuk Dikirim ke Peserta
  const handleCopyNewFormatted = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = generatedAccounts.map((acc, i) => 
      `[Peserta ${i+1}]\nUsername: ${acc.username}\nPassword: ${acc.password}\nLink Login: ${origin}`
    ).join('\n\n------------------------------\n\n');
    navigator.clipboard.writeText(text);
    alert('Berhasil menyalin format pesan lengkap (siap dikirim ke peserta via WA/Email)!');
  };

  const handleCopyBatchExcel = (batch: BatchSession) => {
    const text = batch.participants.map(acc => `${acc.username}\t${acc.password}`).join('\n');
    navigator.clipboard.writeText(`Username\tPassword\n${text}`);
    alert(`Berhasil menyalin kredensial ${batch.participants.length} akun (format Excel)!`);
  };

  const handleCopyBatchFormatted = (batch: BatchSession) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = batch.participants.map((acc, i) => 
      `Nama: ${acc.name}\nUsername: ${acc.username}\nPassword: ${acc.password}\nLink Portal: ${origin}`
    ).join('\n\n------------------------------\n\n');
    navigator.clipboard.writeText(text);
    alert(`Berhasil menyalin format pesan lengkap untuk ${batch.participants.length} peserta!`);
  };

  const handleDeleteBatch = async (batch: BatchSession) => {
    if (!confirm(`Yakin ingin menghapus permanen Batch "${batch.title}" beserta seluruh ${batch.totalParticipants} akun peserta?`)) return;

    try {
      const res = await fetch(`/api/superadmin/schedule/batches?id=${batch.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Batch berhasil dihapus');
        fetchBatches();
        if (selectedBatchModal?.id === batch.id) setSelectedBatchModal(null);
      } else {
        alert(`Gagal menghapus batch: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (e: any) {
      console.error('Failed to delete batch:', e);
      alert('Gagal menghapus batch.');
    }
  };

  const filteredBatches = batches.filter(b => {
    return (
      (b.title || '').toLowerCase().includes(searchBatch.toLowerCase()) ||
      (b.jobPositionName || '').toLowerCase().includes(searchBatch.toLowerCase()) ||
      (b.clientName || '').toLowerCase().includes(searchBatch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Sesi & Penjadwalan Ujian</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Buat sesi tes baru, tentukan modul alat tes, generate token peserta, dan kelola kredensial</p>
        </div>
      </div>

      {/* SECTION 1: FORM GENERATE & RESULT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Form Generate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-[14px] font-bold text-slate-900">Buat Sesi & Akun Peserta</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Isi Nama Jabatan, Standar Jabatan Posisi, Klien, Alat Tes, Tanggal Ujian, dan Tester</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">

            {/* Nama Jabatan / Batch */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Nama Jabatan / Batch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Staff Admin / Management Trainee"
                value={positionName}
                onChange={e => setPositionName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white placeholder-slate-400"
                required
              />
            </div>

            {/* Standar Jabatan */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Standar Jabatan Posisi <span className="text-rose-500">*</span>
              </label>
              {loadingOptions ? (
                <p className="text-[12px] text-slate-400">Memuat Standar Jabatan…</p>
              ) : (
                <select
                  value={selectedJobPositionId}
                  onChange={e => setSelectedJobPositionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white"
                  required
                >
                  <option value="">— Pilih Standar Jabatan —</option>
                  {jobPositions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Selection Mode Override for Test Tools (Simplified & Clean) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useCustomTools}
                  onChange={e => {
                    setUseCustomTools(e.target.checked);
                    if (!e.target.checked) setSelectedCustomTools([]);
                  }}
                  className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                />
                <span className="text-[12px] font-semibold text-slate-700">Pilih alat tes manual (opsional / diluar template)</span>
              </label>

              {useCustomTools && (
                <div className="pl-5 pt-1 space-y-2">
                  <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 text-[12px] text-slate-600">
                    {AVAILABLE_TEST_TOOLS.map(tool => (
                      <label key={tool.id} className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedCustomTools.includes(tool.id)}
                          onChange={() => toggleCustomTool(tool.id)}
                          className="w-3 h-3 rounded accent-teal-600 cursor-pointer"
                        />
                        <span className="truncate">{tool.label}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCustomTools.length > 0 && (
                    <p className="text-[11px] text-teal-600 font-medium pt-1">
                      Tes terpilih ({selectedCustomTools.length}): {selectedCustomTools.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Klien & Tanggal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Klien Perusahaan</label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">— Umum / Internal —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.username})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Tanggal Ujian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white"
                  required
                />
              </div>
            </div>

            {/* Tester */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Tester Penanggung Jawab</label>
              <select
                value={selectedTesterId}
                onChange={e => setSelectedTesterId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white"
              >
                <option value="">— Tanpa Penugasan Spesifik —</option>
                {testers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.role === 'psikolog' ? 'Psikolog Assessor' : 'Admin Tester'})</option>
                ))}
              </select>
            </div>

            {/* Prefix & Jumlah */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Prefix Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: mandiri"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white placeholder-slate-400"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: {prefix ? `${prefix}_001` : 'mandiri_001'}
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Jumlah Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  placeholder="Max 200"
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 bg-white placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Memproses Sesi…' : 'Generate Akun Peserta'}
            </button>

            {message && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[12px] font-semibold text-center">
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Hasil Generate Akun Baru */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">Hasil Generate Akun Baru</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Password acak unik per peserta langsung ditampilkan & siap dikirim</p>
            </div>

            {generatedAccounts.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyNewFormatted}
                  className="text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  Salin Format Pesan
                </button>
                <button
                  onClick={handleCopyNewExcel}
                  className="text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Salin Excel
                </button>
              </div>
            )}
          </div>

          {generatedAccounts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-[12px]">
              Belum ada akun baru yang dibuat pada form di sebelah kiri.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl max-h-[480px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No</th>
                    <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</th>
                    <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password Acak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedAccounts.map((acc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 text-[12px] text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-3.5 py-2.5 text-[12px] font-bold text-slate-900">{acc.username}</td>
                      <td className="px-3.5 py-2.5 text-[12px] font-mono font-bold text-teal-700 bg-teal-50/50 rounded">{acc.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 2: DAFTAR BATCH SESSIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Daftar Batch Sesi Ujian & Akun Peserta</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Seluruh batch yang dibuat, password plain peserta, dan riwayat status</p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari batch, jabatan, klien…"
              value={searchBatch}
              onChange={e => setSearchBatch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-400 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Batch & Tanggal</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">BATTERY TEST</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Klien Perusahaan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tester PJ</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Akun</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingBatches ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-[12px]">
                    Memuat daftar batch…
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-[12px]">
                    Belum ada Batch Penjadwalan yang dibuat.
                  </td>
                </tr>
              ) : (
                filteredBatches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-bold text-slate-900">{batch.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa Tanggal'}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-700">
                      {batch.jobPositionName}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        {batch.clientName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {batch.assignedTesters.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {batch.assignedTesters.map((t, i) => (
                            <span key={i} className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Umum</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-[12px] font-bold text-slate-900">{batch.totalParticipants} Akun</p>
                      <p className="text-[11px] text-slate-400">{batch.completedParticipants}/{batch.totalParticipants} Selesai</p>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedBatchModal(batch)}
                          className="text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          Lihat Akun & Password
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch)}
                          className="text-[11px] font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LIHAT DETAIL AKUN & PASSWORD BATCH */}
      {selectedBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">{selectedBatchModal.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Posisi: {selectedBatchModal.jobPositionName} · Klien: {selectedBatchModal.clientName} · Total: {selectedBatchModal.totalParticipants} Akun
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyBatchFormatted(selectedBatchModal)}
                  className="text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Salin Format Pesan
                </button>
                <button
                  onClick={() => handleCopyBatchExcel(selectedBatchModal)}
                  className="text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Salin Excel
                </button>
                <button
                  onClick={() => setSelectedBatchModal(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content / Table */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No</th>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Peserta</th>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</th>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password Plain</th>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBatchModal.participants.map((acc, idx) => (
                      <tr key={acc.id} className="hover:bg-slate-50">
                        <td className="px-3.5 py-2.5 text-[12px] text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-3.5 py-2.5 text-[12px] font-semibold text-slate-900">{acc.name}</td>
                        <td className="px-3.5 py-2.5 text-[12px] font-bold text-slate-900">{acc.username}</td>
                        <td className="px-3.5 py-2.5 text-[12px] font-mono font-bold text-teal-700 bg-teal-50/50 rounded">{acc.password}</td>
                        <td className="px-3.5 py-2.5">
                          {acc.status === 'completed' ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Selesai
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              Belum
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
