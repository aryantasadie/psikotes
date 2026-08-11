'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedQCModal, setSelectedQCModal] = useState<any | null>(null);

  const fetchParticipants = () => {
    setLoading(true);
    fetch('/api/superadmin/reports')
      .then(res => res.json())
      .then(data => {
        setParticipants(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleDelete = async (participantId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data peserta ini? Semua jawaban dan hasil akan hilang selamanya.')) return;
    
    try {
      const res = await fetch(`/api/superadmin/reports/${participantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setParticipants(participants.filter(p => p.id !== participantId));
        if (selectedQCModal?.id === participantId) setSelectedQCModal(null);
      } else {
        alert(data.error || 'Gagal menghapus peserta');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem');
    }
  };

  const filtered = participants.filter(p => {
    const s = search.toLowerCase();
    const nameMatch = (p.user?.name || '').toLowerCase().includes(s);
    const usernameMatch = (p.user?.username || '').toLowerCase().includes(s);
    const posMatch = (p.jobPosition?.name || p.test?.jobPosition?.name || '').toLowerCase().includes(s);
    const clientMatch = (p.test?.client?.name || '').toLowerCase().includes(s);
    const batchMatch = (p.test?.title || '').toLowerCase().includes(s);
    return nameMatch || usernameMatch || posMatch || clientMatch || batchMatch;
  });

  return (
    <div className="section p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-slate-900">Laporan & QC Review Hasil Asesmen</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Tinjau kelengkapan jawaban peserta, pengawasan kamera, dan hasil skor psikogram</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Daftar Hasil Tes & Penilaian Peserta</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Filter berdasarkan nama peserta, nama jabatan, perusahaan klien, atau nama batch</p>
          </div>

          <div className="w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Cari peserta, posisi, klien, atau batch…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-400 placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-[13px]">Memuat data laporan & QC review…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[13px]">Tidak ada data hasil tes yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">NAMA PESERTA</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">PERUSAHAAN / POSISI</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">BANK TES / BATCH</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ALAT TES</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TANGGAL UJIAN</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">STATUS PENILAIAN</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const clientName = p.test?.client?.name || 'Umum / Internal';
                  const positionName = p.jobPosition?.name || p.test?.jobPosition?.name || p.test?.title?.split('-')[0]?.trim() || 'General';
                  const batchTitle = p.test?.title || '-';

                  let testToolsArr = [];
                  if (p.test?.sequence) {
                    try { testToolsArr = JSON.parse(p.test.sequence); } catch(e){}
                  }
                  const testToolsStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : (p.test?.title || '-');

                  const dateStr = p.startTime 
                    ? new Date(p.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : (p.test?.startDate ? new Date(p.test.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
                  
                  const isCompleted = p.status === 'completed';
                  const isReviewed = p.psychoResults?.status === 'RELEASED' || p.psychoResults?.status === 'REVIEWED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      {/* Nama Peserta */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-bold text-slate-900">{p.user?.name || '-'}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">@{p.user?.username}</p>
                      </td>

                      {/* Perusahaan / Posisi */}
                      <td className="px-4 py-3.5">
                        <p className="text-[12px] font-bold text-slate-800">{positionName}</p>
                        <p className="text-[11px] text-teal-700 font-medium mt-0.5">{clientName}</p>
                      </td>

                      {/* Bank Tes / Batch */}
                      <td className="px-4 py-3.5">
                        <p className="text-[12px] font-semibold text-slate-700 max-w-[200px] truncate" title={batchTitle}>
                          {batchTitle}
                        </p>
                      </td>

                      {/* Alat Tes */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-block max-w-[220px] truncate" title={testToolsStr}>
                          {testToolsStr}
                        </span>
                      </td>

                      {/* Tanggal Ujian */}
                      <td className="px-4 py-3.5 text-[12px] text-slate-600">
                        {dateStr}
                      </td>

                      {/* Status Penilaian */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isReviewed 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : (isCompleted 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200')
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isReviewed ? 'bg-emerald-500' : (isCompleted ? 'bg-amber-500' : 'bg-slate-400')}`}></span>
                          {isReviewed ? 'Laporan Rilis' : (isCompleted ? 'Selesai Dinilai' : 'Menunggu Nilai')}
                        </span>
                      </td>

                      {/* Aksi Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedQCModal(p)}
                            className="text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Cek Detail Jawaban & Pengawasan Kamera"
                          >
                            Cek Data QC
                          </button>
                          
                          <Link
                            href={`/superadmin/reports/${p.id}`}
                            className="text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm text-decoration-none"
                          >
                            Lihat Laporan
                          </Link>

                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="text-[11px] font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors"
                            title="Hapus Peserta"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QC DETAIL MODAL POPUP */}
      {selectedQCModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-md">
                  QC & Quality Assurance Detail
                </span>
                <h3 className="text-[16px] font-bold text-slate-900 mt-1.5">{selectedQCModal.user?.name}</h3>
                <p className="text-[12px] font-mono text-slate-400">Username: @{selectedQCModal.user?.username} | Password: {selectedQCModal.plainPassword || '123456'}</p>
              </div>

              <button
                onClick={() => setSelectedQCModal(null)}
                className="text-slate-400 hover:text-slate-600 text-[18px] font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Details */}
            <div className="grid grid-cols-2 gap-4 text-[12px]">
              
              {/* Box 1: Sesi & Jabatan */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perusahaan Klien & Posisi</p>
                <p className="font-bold text-slate-900 text-[13px]">
                  {selectedQCModal.jobPosition?.name || selectedQCModal.test?.jobPosition?.name || 'General'}
                </p>
                <p className="text-teal-700 font-semibold">
                  {selectedQCModal.test?.client?.name || 'Umum / Internal'}
                </p>
              </div>

              {/* Box 2: Batch & Status */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch Sesi & Status</p>
                <p className="font-semibold text-slate-800 truncate" title={selectedQCModal.test?.title}>
                  {selectedQCModal.test?.title || '-'}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedQCModal.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {selectedQCModal.status === 'completed' ? 'SELESAI (COMPLETED)' : 'MENUNGGU SELESAI'}
                </span>
              </div>

              {/* Box 3: Jawaban Terisi */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jawaban Terisi</p>
                <p className="font-bold text-slate-900 text-[14px]">
                  {selectedQCModal.answers?.length || 0} Soal Terjawab
                </p>
                <p className="text-slate-500 text-[11px]">
                  Alat Tes: {selectedQCModal.test?.sequence ? JSON.parse(selectedQCModal.test.sequence).join(', ') : '-'}
                </p>
              </div>

              {/* Box 4: Log Keamanan Kamera */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengawasan Kamera / Security</p>
                <p className="font-bold text-slate-900 text-[14px]">
                  {selectedQCModal.logs?.length || 0} Tangkapan Foto Log
                </p>
                <p className="text-emerald-700 text-[11px] font-medium">
                  {selectedQCModal.logs?.length > 0 ? '✓ Pengawasan Aktif' : 'Status Pengawasan Standar'}
                </p>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedQCModal(null)}
                className="px-4 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
              
              <Link
                href={`/superadmin/reports/${selectedQCModal.id}`}
                className="px-4 py-2 text-[12px] font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors shadow-sm text-decoration-none"
              >
                Buka Laporan Psikogram Full ➔
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
