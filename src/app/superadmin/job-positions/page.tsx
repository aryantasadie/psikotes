'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JobPositionList() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = () => {
    setLoading(true);
    fetch('/api/superadmin/job-positions')
      .then(r => r.json())
      .then(d => { setPositions(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPositions(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus Standar Jabatan ini?')) return;
    const res = await fetch(`/api/superadmin/job-positions/${id}`, { method: 'DELETE' });
    if (res.ok) setPositions(p => p.filter(x => x.id !== id));
    else alert('Gagal menghapus.');
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Daftar Standar Jabatan</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Kelola standar nilai minimum (Gray Area) per posisi jabatan</p>
        </div>
        <Link
          href="/superadmin/job-positions/builder"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Buat Standar Jabatan
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data standar jabatan…
        </div>
      ) : positions.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <p className="text-slate-500 font-semibold text-sm">Belum ada Standar Jabatan</p>
          <p className="text-slate-400 text-xs mt-1">Klik tombol di atas untuk membuat standar jabatan pertama.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map(pos => (
            <div key={pos.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900">{pos.name}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Template Psikogram: <span className="font-semibold text-slate-600">{pos.psychographPreset?.name || '—'}</span>
                </p>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {pos.grayAreas?.length || 0} Aturan Gray Area
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/superadmin/job-positions/builder?id=${pos.id}`}
                  className="text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-colors"
                >
                  Edit Standar
                </Link>
                <button
                  onClick={() => handleDelete(pos.id)}
                  className="text-[12px] font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
