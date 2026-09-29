'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PsychographPresetList() {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPresets = () => {
    setLoading(true);
    fetch('/api/superadmin/psychograph')
      .then(r => r.json())
      .then(d => {
        setPresets(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus Preset Kompetensi & Alat Tes ini?')) return;
    const res = await fetch(`/api/superadmin/psychograph/${id}`, { method: 'DELETE' });
    if (res.ok) setPresets(p => p.filter(x => x.id !== id));
    else alert('Gagal menghapus.');
  };

  const filteredPresets = presets.filter(preset => {
    const q = search.toLowerCase();
    const nameMatch = (preset.name || '').toLowerCase().includes(q);
    const clientMatch = (preset.tests || []).some((t: any) => (t.client?.name || '').toLowerCase().includes(q));
    const positionMatch = (preset.jobPositions || []).some((jp: any) => (jp.name || '').toLowerCase().includes(q));
    return nameMatch || clientMatch || positionMatch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Daftar Kompetensi & Alat Tes</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Kelola template aspek penilaian kompetensi, instrumen alat tes, dan psikogram
          </p>
        </div>
        <Link
          href="/superadmin/psychograph/builder"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Template Kompetensi
        </Link>
      </div>

      {/* Main Standard Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Table Search & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Tabel Kompetensi & Alat Tes</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Daftar seluruh baterai instrumen tes dan aspek penilaian per profil
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari kompetensi, alat tes, perusahaan…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-400 placeholder-slate-400 bg-white"
            />
          </div>
        </div>

        {/* Standardized Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Profil Kompetensi & Alat Tes</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Untuk Perusahaan Mana</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dibuat Kapan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Aspek Penilaian</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-[12px]">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data kompetensi & alat tes…
                  </td>
                </tr>
              ) : filteredPresets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-[12px]">
                    {search ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Belum ada template kompetensi & alat tes yang dibuat.'}
                  </td>
                </tr>
              ) : (
                filteredPresets.map(preset => {
                  let mapping: any[] = [];
                  try {
                    mapping = JSON.parse(preset.mapping || '[]');
                  } catch {}

                  const totalAspects = mapping.reduce(
                    (acc: number, cat: any) =>
                      acc + (cat.aspects || []).filter((a: any) => a.checked !== false).length,
                    0
                  );

                  const clientNames = Array.from(
                    new Set(
                      (preset.tests || [])
                        .map((t: any) => t.client?.name)
                        .filter(Boolean)
                    )
                  );
                  const displayCompany = clientNames.length > 0 ? clientNames.join(', ') : 'Standar Umum / Multi Klien';

                  const dateStr = preset.createdAt
                    ? new Date(preset.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={preset.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Nama profil / template */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-bold text-slate-900">{preset.name}</p>
                        {preset.jobPositions && preset.jobPositions.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Digunakan di: {preset.jobPositions.map((jp: any) => jp.name).join(', ')}
                          </p>
                        )}
                      </td>

                      {/* 2. Untuk perusahaan mana */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md inline-block">
                          {displayCompany}
                        </span>
                      </td>

                      {/* 3. Dibuat kapan */}
                      <td className="px-4 py-3.5 text-[12px] text-slate-500">
                        {dateStr}
                      </td>

                      {/* 4. Total aspek nya berapa */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {totalAspects} Aspek Penilaian
                        </span>
                      </td>

                      {/* 5. Aksi */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/superadmin/psychograph/builder?id=${preset.id}`}
                            className="text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit Template
                          </Link>
                          <button
                            onClick={() => handleDelete(preset.id)}
                            className="text-[11px] font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
