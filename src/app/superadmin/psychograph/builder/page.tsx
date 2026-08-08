'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Constants ───────────────────────────────────────────── */
const AVAILABLE_INSTRUMENTS = [
  "WPT","TIKI 1","TIKI 2","TIKI 3","TIKI 4","TIKI 6",
  "IST Subtes 1","IST Subtes 2","IST Subtes 3","IST Subtes 4",
  "IST Subtes 5","IST Subtes 6","IST Subtes 7","IST Subtes 8",
  "PAPI Skala L","PAPI Skala P","PAPI Skala I","PAPI Skala C","PAPI Skala D",
  "PAPI Skala R","PAPI Skala N","PAPI Skala G","PAPI Skala A","PAPI Skala F",
  "PAPI Skala W","PAPI Skala T","PAPI Skala V","PAPI Skala Z","PAPI Skala E",
  "PAPI Skala K","PAPI Skala X","PAPI Skala S","PAPI Skala B","PAPI Skala O",
  "Kraepelin (Panker)","Kraepelin (Tinker)","Kraepelin (Janker)",
  "Tes Grafis","Wartegg Subtes 5","Wartegg Subtes 7","Wartegg (Keseluruhan)",
  "DISC (D)","DISC (I)","DISC (S)","DISC (C)","CFIT 1","CFIT 2","CFIT 3","CFIT 4",
];

const DEFAULT_MAPPING = [
  { category: "KEMAMPUAN KOGNITIF", aspects: [
    { name: "IQ / Kapasitas Intelektual", checked: true, instruments: ["WPT"] },
    { name: "Daya Analisa",              checked: true, instruments: ["IST Subtes 3"] },
    { name: "Logika Berpikir",           checked: true, instruments: ["IST Subtes 2","IST Subtes 6"] },
    { name: "Daya Abstraksi",            checked: true, instruments: ["IST Subtes 7"] },
    { name: "Problem Solving",           checked: true, instruments: ["IST Subtes 7"] },
  ]},
  { category: "SISI AFEKTIF", aspects: [
    { name: "Stabilitas Emosi",       checked: true, instruments: ["PAPI Skala E","PAPI Skala K"] },
    { name: "Kepekaan Emosi / Sosial",checked: true, instruments: ["PAPI Skala X","PAPI Skala O"] },
    { name: "Kepercayaan Diri",       checked: true, instruments: ["PAPI Skala X","PAPI Skala L","PAPI Skala S"] },
  ]},
  { category: "HUBUNGAN ANTAR MANUSIA", aspects: [
    { name: "Sosiabilitas", checked: true, instruments: ["PAPI Skala O","PAPI Skala S","PAPI Skala B","PAPI Skala X"] },
    { name: "Adaptasi",     checked: true, instruments: ["PAPI Skala S","PAPI Skala Z"] },
    { name: "Komunikasi",   checked: true, instruments: ["PAPI Skala S"] },
  ]},
  { category: "SIKAP KERJA", aspects: [
    { name: "Orientasi Berprestasi",  checked: true, instruments: ["PAPI Skala A","PAPI Skala G","PAPI Skala N"] },
    { name: "Daya Juang",             checked: true, instruments: ["PAPI Skala G","PAPI Skala A","PAPI Skala T","PAPI Skala V"] },
    { name: "Kedetailan",             checked: true, instruments: ["PAPI Skala D"] },
    { name: "Sistematika Kerja",      checked: true, instruments: ["PAPI Skala C","PAPI Skala W"] },
    { name: "Kecepatan Kerja",        checked: true, instruments: ["PAPI Skala T"] },
    { name: "Ketelitian Kerja",       checked: true, instruments: ["PAPI Skala D"] },
    { name: "Daya Tahan Stress",      checked: true, instruments: [] },
    { name: "Kepemimpinan",           checked: true, instruments: ["PAPI Skala L","PAPI Skala P","PAPI Skala I"] },
    { name: "Inisiatif",              checked: true, instruments: ["PAPI Skala P"] },
    { name: "Tanggung Jawab",         checked: true, instruments: ["PAPI Skala N","PAPI Skala P"] },
    { name: "Kerjasama",              checked: true, instruments: ["PAPI Skala B","PAPI Skala F"] },
    { name: "Pengambilan Keputusan",  checked: true, instruments: ["PAPI Skala I"] },
  ]},
];

const ALL_TEST_MODULE_OPTIONS = [
  "WPT",
  "CFIT 1", "CFIT 2", "CFIT 3", "CFIT 4",
  "TIKI 1", "TIKI 2", "TIKI 3", "TIKI 4", "TIKI 6",
  "IST 1", "IST 2", "IST 3", "IST 4", "IST 5", "IST 6", "IST 7", "IST 8",
  "PAPI KOSTICK", "DISC", "MSDT", "POWER LEADER",
  "Kraepelin", "Wartegg", "Tes Grafis"
];

function getParentTests(mapping: any[]): string[] {
  const s = new Set<string>();
  mapping.forEach(cat => cat.aspects.forEach((asp: any) => {
    if (asp.checked) asp.instruments.forEach((inst: string) => {
      if (inst === "WPT") s.add("WPT");
      else if (inst.startsWith("TIKI")) s.add(inst);
      else if (inst.startsWith("IST Subtes")) s.add(inst.replace("Subtes ", ""));
      else if (inst.startsWith("PAPI")) s.add("PAPI KOSTICK");
      else if (inst.startsWith("DISC")) s.add("DISC");
      else if (inst.startsWith("CFIT")) s.add(inst);
      else s.add(inst);
    });
  }));
  return Array.from(s);
}

/* ─── Multi-select dropdown ───────────────────────────────── */
function InstrumentSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState('');
  const filtered = AVAILABLE_INSTRUMENTS.filter(i => i.toLowerCase().includes(q.toLowerCase()) && !selected.includes(i));

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 p-2 min-h-[40px] border border-slate-200 rounded-xl bg-white cursor-text focus-within:border-teal-400 transition-colors"
        onClick={() => setOpen(true)}
      >
        {selected.map(item => (
          <span key={item} className="flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
            {item}
            <button type="button" onClick={e => { e.stopPropagation(); onChange(selected.filter(i => i !== item)); }} className="text-teal-500 hover:text-teal-800 font-bold leading-none">×</button>
          </span>
        ))}
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? "Pilih instrumen…" : ""}
          className="border-none outline-none flex-1 min-w-[100px] text-[12px] bg-transparent text-slate-700 placeholder-slate-400"
        />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQ(''); }} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto z-20">
            {filtered.length > 0 ? filtered.map(item => (
              <button key={item} type="button" onClick={() => { onChange([...selected, item]); setQ(''); }}
                className="w-full text-left px-3.5 py-2 text-[12px] text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                {item}
              </button>
            )) : (
              <p className="px-3.5 py-2.5 text-[12px] text-slate-400">Tidak ditemukan</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function PsychographBuilder() {
  const [name, setName]         = useState('');
  const [mapping, setMapping]   = useState<any[]>(DEFAULT_MAPPING);
  const [sequence, setSequence] = useState<string[]>([]);
  const [dragIdx, setDragIdx]   = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [editId, setEditId]     = useState<number | null>(null);
  const router = useRouter();

  // Load existing or initialize
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
      setEditId(parseInt(id));
      fetch(`/api/superadmin/psychograph/${id}`)
        .then(r => r.json())
        .then(d => {
          if (d?.name) {
            setName(d.name);
            try { setMapping(JSON.parse(d.mapping)); } catch {}
            try { if (d.testSequence) setSequence(JSON.parse(d.testSequence)); } catch {}
          }
        });
    } else {
      // Default initial sequence from mapping
      setSequence(getParentTests(DEFAULT_MAPPING));
    }
  }, []);

  const handleAutoSync = () => {
    const required = getParentTests(mapping);
    setSequence(prev => {
      const nextSeq = [...prev];
      required.forEach(t => {
        if (!nextSeq.includes(t)) nextSeq.push(t);
      });
      return nextSeq;
    });
  };

  const handleAddManualModule = (moduleName: string) => {
    if (!moduleName) return;
    if (!sequence.includes(moduleName)) {
      setSequence(prev => [...prev, moduleName]);
    }
  };

  const handleRemoveModule = (idxToRemove: number) => {
    setSequence(prev => prev.filter((_, i) => i !== idxToRemove));
  };

  const toggleAspect = (ci: number, ai: number) => {
    const m = [...mapping];
    m[ci].aspects[ai].checked = !m[ci].aspects[ai].checked;
    setMapping(m);
  };

  const changeInstruments = (ci: number, ai: number, val: string[]) => {
    const m = [...mapping];
    m[ci].aspects[ai].instruments = val;
    setMapping(m);
  };

  const dragOver = (e: React.DragEvent, to: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === to) return;
    const s = [...sequence];
    const item = s.splice(dragIdx, 1)[0];
    s.splice(to, 0, item);
    setSequence(s);
    setDragIdx(to);
  };

  const handleSave = async () => {
    if (!name) return setError('Nama Preset Psikogram harus diisi.');
    setSaving(true); setError('');
    const url    = editId ? `/api/superadmin/psychograph/${editId}` : '/api/superadmin/psychograph';
    const method = editId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mapping, sequence }) });
    if (res.ok) router.push('/superadmin/psychograph');
    else { setError('Gagal menyimpan preset.'); setSaving(false); }
  };

  return (
    <div className="space-y-5 pb-24">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/psychograph"
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              {editId ? 'Edit Preset Psikogram' : 'Buat Preset Psikogram Baru'}
            </h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Tentukan aspek penilaian dan urutan baterai tes</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Nama Preset */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Preset</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Contoh: Template Manajerial, Template Staf Khusus…"
          className="w-full max-w-lg px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-400 transition-colors placeholder-slate-400"
        />
      </div>

      {/* Urutan Tes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Urutan Modul Tes (Baterai Tes)</p>
            <p className="text-[12px] text-slate-400 mt-1">
              Atur urutan pengerjaan modul. Anda dapat menambah modul manual, menghapus, atau menggeser urutan (drag & drop).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoSync}
            className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
            title="Tambahkan modul otomatis berdasarkan instrumen yang dipilih di bawah"
          >
            <span>⚡</span> Auto Sync dari Aspek
          </button>
        </div>

        {/* Dropdown Tambah Modul Manual */}
        <div className="mb-4">
          <select
            onChange={(e) => {
              handleAddManualModule(e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            className="w-full max-w-md px-3.5 py-2.5 border border-dashed border-teal-400 rounded-xl text-[12px] font-semibold text-teal-700 bg-teal-50/50 hover:bg-teal-50 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="" disabled>+ Tambahkan Modul Tes secara Manual...</option>
            {ALL_TEST_MODULE_OPTIONS.map(mod => (
              <option key={mod} value={mod} disabled={sequence.includes(mod)}>
                {mod} {sequence.includes(mod) ? '(Sudah Ada)' : ''}
              </option>
            ))}
          </select>
        </div>

        {sequence.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-[13px] text-slate-400">
            Belum ada modul tes. Tambahkan modul secara manual di atas atau klik "Auto Sync dari Aspek".
          </div>
        ) : (
          <div className="space-y-2">
            {sequence.map((test, idx) => (
              <div
                key={test}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={e => dragOver(e, idx)}
                onDrop={() => setDragIdx(null)}
                className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-grab select-none transition-all ${
                  dragIdx === idx ? 'opacity-40 bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span className="w-6 h-6 bg-teal-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center shrink-0">{idx + 1}</span>
                <span className="text-[13px] font-semibold text-slate-800 flex-1">{test}</span>
                
                {/* Tombol Hapus */}
                <button
                  type="button"
                  onClick={() => handleRemoveModule(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus modul ini dari urutan"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aspek Penilaian per Kategori */}
      {mapping.map((cat, ci) => (
        <div key={cat.category} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{cat.category}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {cat.aspects.map((asp: any, ai: number) => (
              <div key={asp.name} className={`p-5 flex items-start gap-5 ${!asp.checked ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox" checked={asp.checked} onChange={() => toggleAspect(ci, ai)}
                  className="mt-1 w-4 h-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
                <div className="w-52 shrink-0">
                  <p className={`text-[13px] font-semibold ${asp.checked ? 'text-slate-900' : 'text-slate-400'}`}>{asp.name}</p>
                </div>
                <div className={`flex-1 ${!asp.checked ? 'pointer-events-none' : ''}`}>
                  <p className="text-[11px] text-slate-400 font-medium mb-1.5">Alat Tes / Subtes</p>
                  <InstrumentSelect
                    selected={asp.instruments}
                    onChange={val => changeInstruments(ci, ai, val)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3 z-50">
        <Link href="/superadmin/psychograph"
          className="text-[13px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-colors">
          Batal
        </Link>
        <button
          onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan…</>
          ) : 'Simpan Preset Psikogram'}
        </button>
      </div>
    </div>
  );
}
