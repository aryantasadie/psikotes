'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Constants ─────────────────────────────────────────── */
const SCORE_LABELS = [
  { value: 1, label: 'KS', full: 'Kurang Sekali' },
  { value: 2, label: 'K',  full: 'Kurang'        },
  { value: 3, label: 'C',  full: 'Cukup'         },
  { value: 4, label: 'B',  full: 'Baik'          },
  { value: 5, label: 'BS', full: 'Baik Sekali'   },
];

export const ASPECT_DESCRIPTIONS: Record<string, string> = {
  "IQ / Kapasitas Intelektual": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Daya Analisa": "Mampu mengolah dan mengidentifikasi topik-topik serta keterkaitan dari informasi-informasi tersebut; menghubungkan & membandingkan data-data dari berbagai sumber, mengidentifikasi hubungan sebab akibat.",
  "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal",
  "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan kemampuan berpikir antisipatif",
  "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan, dengan mempertimbangkan efektivitas dari alternatif solusi yang dibuat",
  "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh oleh situasi.",
  "Kepekaan Emosi / Sosial": "Kemampuan untuk memahami dan peka terhadap perasaan dan kebutuhan orang lain.",
  "Kepercayaan Diri": "Keyakinan pada kemampuan diri sendiri dalam menghadapi berbagai situasi.",
  "Sosiabilitas": "Kemampuan untuk bergaul dan menjalin hubungan dengan orang lain secara luas.",
  "Adaptasi": "Kemampuan untuk menyesuaikan diri dengan lingkungan atau situasi yang baru.",
  "Komunikasi": "Kemampuan untuk menyampaikan ide dan informasi dengan jelas dan efektif.",
  "Orientasi Berprestasi": "Dorongan untuk mencapai hasil yang terbaik dan menetapkan standar tinggi.",
  "Daya Juang": "Ketahanan dan keuletan dalam menghadapi hambatan dan kesulitan kerja.",
  "Kedetailan": "Kemampuan untuk memperhatikan hal-hal kecil agar tidak terjadi kesalahan.",
  "Sistematika Kerja": "Kemampuan untuk bekerja secara teratur, terencana dan prosedural.",
  "Kecepatan Kerja": "Kemampuan untuk menyelesaikan tugas dalam waktu yang singkat.",
  "Ketelitian Kerja": "Kemampuan untuk bekerja dengan akurat dan minim kesalahan.",
  "Daya Tahan Stress": "Kemampuan untuk tetap bekerja efektif di bawah tekanan.",
  "Kepemimpinan": "Kemampuan untuk mengarahkan, memotivasi, dan mengelola orang lain.",
  "Inisiatif": "Kemampuan untuk mengambil tindakan tanpa harus disuruh terlebih dahulu.",
  "Tanggung Jawab": "Kesediaan untuk menanggung risiko dan konsekuensi dari tugas yang diberikan.",
  "Kerjasama": "Kemampuan untuk bekerja secara sinergis dalam kelompok.",
  "Pengambilan Keputusan": "Kemampuan untuk memilih solusi terbaik dari berbagai alternatif dengan cepat dan tepat.",
};

type ActiveCategory = { category: string; aspects: string[] };

/* ─── Page ──────────────────────────────────────────────── */
export default function JobPositionBuilder() {
  const [name, setName]                     = useState('');
  const [description, setDescription]       = useState('');
  const [presetId, setPresetId]             = useState('');
  const [presets, setPresets]               = useState<any[]>([]);
  const [activeCategories, setActiveCategories] = useState<ActiveCategory[]>([]);
  const [flatAspects, setFlatAspects]       = useState<string[]>([]);
  const [grayAreas, setGrayAreas]           = useState<Record<string, { targetScore: number }>>({});
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');
  const [editId, setEditId]                 = useState<number | null>(null);
  const [updatedAt, setUpdatedAt]           = useState<string | null>(null);
  const router = useRouter();

  // Load preset list
  useEffect(() => {
    fetch('/api/superadmin/psychograph')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPresets(d); });
  }, []);

  // Load existing position if editing
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    setEditId(parseInt(id));
    fetch(`/api/superadmin/job-positions/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d?.name) return;
        setName(d.name);
        setDescription(d.description || '');
        setPresetId(d.psychographPresetId?.toString() || '');
        if (d.updatedAt) {
          setUpdatedAt(new Date(d.updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }));
        }
        if (d.grayAreas) {
          const map: Record<string, { targetScore: number }> = {};
          d.grayAreas.forEach((ga: any) => { map[ga.parameter] = { targetScore: ga.targetScore }; });
          setGrayAreas(map);
        }
      });
  }, []);

  // Parse aspects when preset changes
  useEffect(() => {
    if (!presetId) { setActiveCategories([]); setFlatAspects([]); return; }
    const preset = presets.find(p => p.id.toString() === presetId);
    if (!preset?.mapping) return;
    try {
      const mapping = JSON.parse(preset.mapping);
      const cats: ActiveCategory[] = [];
      const flat: string[] = [];
      mapping.forEach((cat: any) => {
        const active = cat.aspects.filter((a: any) => a.checked).map((a: any) => a.name);
        if (active.length > 0) { cats.push({ category: cat.category, aspects: active }); flat.push(...active); }
      });
      setActiveCategories(cats);
      setFlatAspects(flat);
      setGrayAreas(prev => {
        const updated = { ...prev };
        flat.forEach(a => { if (!updated[a]) updated[a] = { targetScore: 3 }; });
        return updated;
      });
    } catch {}
  }, [presetId, presets]);

  const handleSave = async () => {
    if (!name) return setError('Nama Standar Jabatan harus diisi.');
    if (!presetId) return setError('Template Psikogram harus dipilih.');
    setSaving(true); setError('');
    const url    = editId ? `/api/superadmin/job-positions/${editId}` : '/api/superadmin/job-positions';
    const method = editId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, description, psychographPresetId: presetId,
        grayAreas: flatAspects.map(a => ({ parameter: a, targetScore: grayAreas[a]?.targetScore || 3 })),
      }),
    });
    if (res.ok) router.push('/superadmin/job-positions');
    else { const d = await res.json(); setError(d.error || 'Gagal menyimpan.'); setSaving(false); }
  };

  return (
    <div className="space-y-5 pb-24">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/job-positions"
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              {editId ? 'Edit Standar Jabatan' : 'Buat Standar Jabatan Baru'}
            </h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Tentukan standar Gray Area minimum per aspek psikologis</p>
          </div>
        </div>
        {updatedAt && (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
            Diperbarui: {updatedAt}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* ── Identitas Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-5">Identitas Standar Jabatan</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Nama Standar Jabatan <span className="text-rose-500">*</span></label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Contoh: Manager PT Maju Jaya"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 transition-colors placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Deskripsi <span className="text-slate-400 font-normal">(opsional)</span></label>
            <input
              type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Standar rekrutmen tahun 2026"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 transition-colors placeholder-slate-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Template Psikogram & Baterai Tes <span className="text-rose-500">*</span></label>
            <select
              value={presetId} onChange={e => setPresetId(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 transition-colors bg-white"
            >
              <option value="">— Pilih Template —</option>
              {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Memilih template akan memuat semua aspek penilaian aktif untuk dikonfigurasi standar minimum-nya.
            </p>
          </div>
        </div>
      </div>

      {/* ── Gray Area Table ── */}
      {flatAspects.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Table header bar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold text-slate-800">
                Standar Gray Area — {flatAspects.length} Aspek Psikologis
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pilih level minimum yang disyaratkan untuk posisi ini</p>
            </div>
            {/* Legend */}
            <div className="hidden md:flex items-center gap-3 text-[10px] font-semibold text-slate-400">
              {SCORE_LABELS.map(s => (
                <span key={s.value} className="flex items-center gap-1">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${
                    s.value >= 3 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                  }`}>{s.value}</span>
                  {s.full}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">Dimensi Psikologis</th>
                  {SCORE_LABELS.map(s => (
                    <th key={s.value} className={`px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                      s.value >= 3 ? 'text-teal-600 bg-teal-50/60' : 'text-slate-400'
                    }`}>
                      {s.label}<br/><span className="text-[9px] font-medium normal-case tracking-normal opacity-70">({s.full})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeCategories.map((group, gi) => (
                  <React.Fragment key={group.category}>
                    {/* Category row */}
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <td colSpan={6} className="px-6 py-2.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                          {group.category}
                        </span>
                      </td>
                    </tr>
                    {/* Aspect rows */}
                    {group.aspects.map((aspect, ai) => {
                      const selected = grayAreas[aspect]?.targetScore || 3;
                      return (
                        <tr key={aspect} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-[13px] font-semibold text-slate-900">{aspect}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed max-w-sm">
                              {ASPECT_DESCRIPTIONS[aspect] || '—'}
                            </p>
                          </td>
                          {SCORE_LABELS.map(s => (
                            <td key={s.value} className={`px-4 py-4 text-center ${s.value >= 3 ? 'bg-teal-50/40' : ''}`}>
                              <label className="flex items-center justify-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`aspect-${gi}-${ai}`}
                                  value={s.value}
                                  checked={selected === s.value}
                                  onChange={() => setGrayAreas(prev => ({
                                    ...prev,
                                    [aspect]: { ...prev[aspect], targetScore: s.value },
                                  }))}
                                  className="sr-only"
                                />
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  selected === s.value
                                    ? 'border-teal-500 bg-teal-500'
                                    : 'border-slate-300 group-hover:border-teal-400'
                                }`}>
                                  {selected === s.value && (
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                  )}
                                </span>
                              </label>
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

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3 z-50">
        <Link href="/superadmin/job-positions"
          className="text-[13px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-colors">
          Batal
        </Link>
        <button
          onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan…</>
          ) : 'Simpan Standar Jabatan'}
        </button>
      </div>
    </div>
  );
}
