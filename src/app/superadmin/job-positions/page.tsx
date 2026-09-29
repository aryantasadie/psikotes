'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JobPositionList() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPositions = () => {
    setLoading(true);
    fetch('/api/superadmin/job-positions')
      .then(r => r.json())
      .then(d => {
        setPositions(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus Standar Psikogram Posisi ini?')) return;
    const res = await fetch(`/api/superadmin/job-positions/${id}`, { method: 'DELETE' });
    if (res.ok) setPositions(p => p.filter(x => x.id !== id));
    else alert('Gagal menghapus.');
  };

  const filteredPositions = positions.filter(pos => {
    const q = search.toLowerCase();
    const nameMatch = (pos.name || '').toLowerCase().includes(q);
    const presetMatch = (pos.psychographPreset?.name || '').toLowerCase().includes(q);
    const clientMatch = (pos.tests || []).some((t: any) => (t.client?.name || '').toLowerCase().includes(q));
    return nameMatch || presetMatch || clientMatch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Daftar Standar Psikogram Jabatan</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Kelola standar nilai minimum (Gray Area) dan paket baterai tes per posisi jabatan
          </p>
        </div>
        <Link
          href="/superadmin/job-positions/builder"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Standar Psikogram
        </Link>
      </div>

      {/* Main Standard Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Table Search & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Tabel Standar Psikogram</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Daftar settingan posisi jabatan beserta acuan paket alat tes & target gray area
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari jabatan, perusahaan, paket tes…"
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
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jabatan (Posisi)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Untuk Perusahaan Mana</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dibuat Kapan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paket Alat Tes & Standar</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-[12px]">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data standar psikogram…
                  </td>
                </tr>
              ) : filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-[12px]">
                    {search ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Belum ada standar psikogram jabatan yang dibuat.'}
                  </td>
                </tr>
              ) : (
                filteredPositions.map(pos => {
                  const clientNames = Array.from(
                    new Set(
                      (pos.tests || [])
                        .map((t: any) => t.client?.name)
                        .filter(Boolean)
                    )
                  );
                  const displayClient = clientNames.length > 0 ? clientNames.join(', ') : 'Umum / Semua Klien';

                  const dateStr = pos.createdAt
                    ? new Date(pos.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={pos.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Jabatan apa (sebagai judul) */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-bold text-slate-900">{pos.name}</p>
                        {pos.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{pos.description}</p>
                        )}
                      </td>

                      {/* 2. Untuk perusahaan mana */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md inline-block">
                          {displayClient}
                        </span>
                      </td>

                      {/* 3. Dibuat kapan */}
                      <td className="px-4 py-3.5 text-[12px] text-slate-500">
                        {dateStr}
                      </td>

                      {/* 4. Ikut settingan paket alat tes yang mana */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <p className="text-[12px] font-semibold text-slate-800">
                            {pos.psychographPreset?.name || 'Paket Kustom'}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md">
                            {pos.grayAreas?.length || 0} Aturan Gray Area
                          </span>
                        </div>
                      </td>

                      {/* 5. Aksi */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/superadmin/job-positions/builder?id=${pos.id}`}
                            className="text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit Standar
                          </Link>
                          <button
                            onClick={() => handleDelete(pos.id)}
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
