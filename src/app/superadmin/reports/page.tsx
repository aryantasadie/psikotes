'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BatchSessionGroup {
  id: number;
  title: string;
  startDate?: string | null;
  jobPositionName: string;
  clientName: string;
  assignedTesters: string[];
  batteryTestStr: string;
  totalParticipants: number;
  completedParticipants: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'tester') {
      router.replace('/superadmin/participants');
    }
  }, [session, status, router]);

  const fetchParticipants = () => {
    setLoading(true);
    fetch('/api/superadmin/reports')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setParticipants(data.participants || []);
          setAssignedTests(data.assignedTests || []);
        } else {
          setParticipants(Array.isArray(data) ? data : []);
          setAssignedTests([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'tester') {
      fetchParticipants();
    }
  }, [status, session]);

  if (status === 'loading' || (session?.user as any)?.role === 'tester') {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Memuat...</div>;
  }

  // Group participants by Batch Session (Test)
  const batchesMap = new Map<number, BatchSessionGroup>();

  // Pre-populate batchesMap with all assigned tests to guarantee empty batches are displayed
  assignedTests.forEach(test => {
    const testId = test.id;
    const title = test.title || 'Sesi Tanpa Judul';
    const startDate = test.startDate;
    const clientName = test.client?.name || 'Umum / Internal';
    const jobPositionName = test.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

    let testToolsArr = [];
    if (test.sequence) {
      try { testToolsArr = JSON.parse(test.sequence); } catch(e){}
    }
    const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'coba';

    let assignedTesters = ['aku'];

    batchesMap.set(testId, {
      id: testId,
      title,
      startDate,
      jobPositionName,
      clientName,
      assignedTesters,
      batteryTestStr,
      totalParticipants: 0,
      completedParticipants: 0
    });
  });

  participants.forEach(p => {
    const testId = p.testId || p.test?.id || 0;
    
    let b = batchesMap.get(testId);
    if (!b) {
      const testObj = p.test || {};
      const title = testObj.title || 'Sesi Tanpa Judul';
      const startDate = p.startTime || testObj.startDate;
      const clientName = testObj.client?.name || 'Umum / Internal';
      const jobPositionName = p.jobPosition?.name || testObj.jobPosition?.name || title.split('-')[0]?.trim() || 'General';

      let testToolsArr = [];
      if (testObj.sequence) {
        try { testToolsArr = JSON.parse(testObj.sequence); } catch(e){}
      }
      const batteryTestStr = testToolsArr.length > 0 ? testToolsArr.join(' + ') : 'coba';

      let assignedTesters = ['aku'];

      b = {
        id: testId,
        title,
        startDate,
        jobPositionName,
        clientName,
        assignedTesters,
        batteryTestStr,
        totalParticipants: 0,
        completedParticipants: 0
      };
      batchesMap.set(testId, b);
    }

    b.totalParticipants += 1;
    if (p.status === 'completed') {
      b.completedParticipants += 1;
    }
  });

  const batchesList = Array.from(batchesMap.values());

  // Filter batches based on search
  const filteredBatches = batchesList.filter(b => {
    const s = search.toLowerCase();
    const titleMatch = (b.title || '').toLowerCase().includes(s);
    const clientMatch = (b.clientName || '').toLowerCase().includes(s);
    const jobMatch = (b.jobPositionName || '').toLowerCase().includes(s);
    return titleMatch || clientMatch || jobMatch;
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

      {/* Main Batch Table (Gambar 1 Layout) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Daftar Batch Sesi Ujian & QC Review</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Seluruh batch yang dibuat, jumlah peserta, dan riwayat status penilaian</p>
          </div>

          <div className="w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Cari batch, jabatan, atau klien…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-400 placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-[13px]">Memuat daftar batch laporan & QC review…</div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[13px]">Belum ada batch hasil ujian yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">NAMA BATCH & TANGGAL</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">BATTERY TEST</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">KLIEN PERUSAHAAN</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TESTER PJ</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">JUMLAH PESERTA</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    {/* Nama Batch & Tanggal */}
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-bold text-slate-900">{b.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '11 Agustus 2026'}
                      </p>
                    </td>

                    {/* Battery Test */}
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-700">
                      {b.batteryTestStr}
                    </td>

                    {/* Klien Perusahaan */}
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        {b.clientName}
                      </span>
                    </td>

                    {/* Tester PJ */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {b.assignedTesters.map((t, i) => (
                          <span key={i} className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Jumlah Peserta */}
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] font-bold text-slate-900">{b.totalParticipants} Peserta</p>
                      <p className="text-[11px] text-slate-400">{b.completedParticipants}/{b.totalParticipants} Selesai</p>
                    </td>

                    {/* Aksi: Navigate to Dedicated Route /superadmin/reports/batch/[id] */}
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/superadmin/reports/batch/${b.id}`}
                        className="inline-block text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-sm text-decoration-none"
                      >
                        Lihat Akun
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
