'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BatchParticipantsReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [test, setTest] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBatchData = () => {
    setLoading(true);
    fetch(`/api/superadmin/reports/batch/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.test) setTest(data.test);
        if (data.participants) setParticipants(data.participants);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) fetchBatchData();
  }, [id]);

  const handleDeleteParticipant = async (participantId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data peserta ini? Semua jawaban dan hasil akan hilang selamanya.')) return;
    
    try {
      const res = await fetch(`/api/superadmin/reports/${participantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setParticipants(participants.filter(p => p.id !== participantId));
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
    return nameMatch || usernameMatch;
  });

  let testToolsArr = [];
  if (test?.sequence) {
    try { testToolsArr = JSON.parse(test.sequence); } catch(e){}
  }
  const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'coba';
  const clientName = test?.client?.name || 'Umum / Internal';
  const positionName = test?.jobPosition?.name || test?.title?.split('-')[0]?.trim() || 'General';

  return (
    <div className="section p-6 space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          href="/superadmin/reports"
          className="text-[12px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 mb-2 text-decoration-none"
        >
          ← Kembali ke Daftar Batch Ujian
        </Link>
        <h2 className="text-[20px] font-bold text-slate-900">
          Daftar Akun Peserta: {test?.title || 'Memuat Batch…'}
        </h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Klien: <span className="font-semibold text-slate-700">{clientName}</span> | Total <span className="font-bold text-slate-900">{participants.length} Peserta</span>
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Rincian Akun & Laporan Peserta</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Cari berdasarkan nama lengkap atau username peserta</p>
          </div>

          <div className="w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Cari nama lengkap atau username…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-400 placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-[13px]">Memuat daftar akun peserta…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[13px]">Tidak ada peserta ditemukan di batch ini.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">NAMA PESERTA & AKUN</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">POSISI / JABATAN</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">BATTERY TEST</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">STATUS PENILAIAN</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const fullName = p.user?.name || 'Peserta';
                  const username = p.user?.username || 'user';
                  const displayName = `${fullName} - ${username}`;

                  const isCompleted = p.status === 'completed';
                  const isReviewed = p.psychoResults?.status === 'RELEASED' || p.psychoResults?.status === 'REVIEWED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      {/* Nama Peserta & Akun: Format "Nama Lengkap - Username" */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-bold text-slate-900">{displayName}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">Plain Pass: {p.plainPassword || '123456'}</p>
                      </td>

                      {/* Posisi / Jabatan */}
                      <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-800">
                        {positionName}
                      </td>

                      {/* Battery Test */}
                      <td className="px-4 py-3.5 text-[12px] text-slate-600">
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                          {batteryTestStr}
                        </span>
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

                      {/* Aksi: Lihat Laporan */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/superadmin/reports/${p.id}`}
                            className="text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm text-decoration-none"
                          >
                            Lihat Laporan
                          </Link>

                          <button 
                            onClick={() => handleDeleteParticipant(p.id)}
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
    </div>
  );
}
