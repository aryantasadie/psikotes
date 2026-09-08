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

export interface AspectItem {
  name: string;
  description?: string;
  checked: boolean;
  instruments: string[];
}

export interface CategoryGroup {
  category: string;
  aspects: AspectItem[];
}

const DEFAULT_MAPPING: CategoryGroup[] = [
  {
    category: "KEMAMPUAN KOGNITIF",
    aspects: [
      { name: "IQ / Kapasitas Intelektual", description: "Kemampuan inteligensi umum, pemahaman konsep, dan daya tangkap.", checked: true, instruments: ["WPT"] },
      { name: "Daya Analisa",              description: "Mampu mengolah dan mengidentifikasi topik serta keterkaitan data informasi.", checked: true, instruments: ["IST Subtes 3"] },
      { name: "Logika Berpikir",           description: "Kemampuan berpikir runtut, terarah, praktis dan logis.", checked: true, instruments: ["IST Subtes 2","IST Subtes 6"] },
      { name: "Daya Abstraksi",            description: "Kemampuan menelaah persoalan dari beberapa sudut pandang dan antisipatif.", checked: true, instruments: ["IST Subtes 7"] },
      { name: "Problem Solving",           description: "Kemampuan membuat keputusan solusi terhadap suatu permasalahan.", checked: true, instruments: ["IST Subtes 7"] },
    ]
  },
  {
    category: "SISI AFEKTIF",
    aspects: [
      { name: "Stabilitas Emosi",        description: "Kemampuan mengendalikan diri dan bersikap tenang dalam situasi tegang.", checked: true, instruments: ["PAPI Skala E","PAPI Skala K"] },
      { name: "Kepekaan Emosi / Sosial", description: "Mampu memahami perasaan orang lain dan berempati.", checked: true, instruments: ["PAPI Skala X","PAPI Skala O"] },
      { name: "Kepercayaan Diri",        description: "Yakin pada kemampuan dirinya, bersikap tegas dan asertif.", checked: true, instruments: ["PAPI Skala X","PAPI Skala L","PAPI Skala S"] },
    ]
  },
  {
    category: "HUBUNGAN ANTAR MANUSIA",
    aspects: [
      { name: "Sosiabilitas", description: "Minat dan perhatian terhadap relasi sosial serta komunikasi interpersonal.", checked: true, instruments: ["PAPI Skala O","PAPI Skala S","PAPI Skala B","PAPI Skala X"] },
      { name: "Adaptasi",     description: "Kemampuan menyesuaikan diri dengan lingkungan baru dan perubahan situasi.", checked: true, instruments: ["PAPI Skala S","PAPI Skala Z"] },
      { name: "Komunikasi",   description: "Kemampuan menyampaikan ide dan gagasan dengan lugas dan efektif.", checked: true, instruments: ["PAPI Skala S"] },
    ]
  },
  {
    category: "SIKAP KERJA",
    aspects: [
      { name: "Orientasi Berprestasi",  description: "Dorongan untuk mencapai target dan standar kinerja terbaik.", checked: true, instruments: ["PAPI Skala A","PAPI Skala G","PAPI Skala N"] },
      { name: "Daya Juang",             description: "Kegigihan untuk berusaha mencapai tujuan di tengah tantangan.", checked: true, instruments: ["PAPI Skala G","PAPI Skala A","PAPI Skala T","PAPI Skala V"] },
      { name: "Kedetailan",             description: "Kecermatan dan perhatian terhadap rincian dalam menyelesaikan tugas.", checked: true, instruments: ["PAPI Skala D"] },
      { name: "Sistematika Kerja",      description: "Kemampuan mengorganisir dan merencanakan pekerjaan secara terstruktur.", checked: true, instruments: ["PAPI Skala C","PAPI Skala W"] },
      { name: "Kecepatan Kerja",        description: "Tempo dan kecepatan pengerjaan tugas dalam batas waktu yang ditentukan.", checked: true, instruments: ["PAPI Skala T"] },
      { name: "Ketelitian Kerja",       description: "Tingkat akurasi dan ketepatan pengerjaan tugas tanpa kekeliruan.", checked: true, instruments: ["PAPI Skala D"] },
      { name: "Daya Tahan Stress",      description: "Ketahanan performa kerja saat berada di bawah tekanan tinggi.", checked: true, instruments: [] },
      { name: "Kepemimpinan",           description: "Kemampuan mengarahkan, mempengaruhi, dan memotivasi orang lain.", checked: true, instruments: ["PAPI Skala L","PAPI Skala P","PAPI Skala I"] },
      { name: "Inisiatif",              description: "Kemampuan mengambil langkah proaktif tanpa harus menunggu instruksi.", checked: true, instruments: ["PAPI Skala P"] },
      { name: "Tanggung Jawab",         description: "Komitmen menyelesaikan kewajiban dan menanggung konsekuensi tugas.", checked: true, instruments: ["PAPI Skala N","PAPI Skala P"] },
      { name: "Kerjasama",              description: "Kemampuan berkolaborasi dan mendukung rekan kerja dalam tim.", checked: true, instruments: ["PAPI Skala B","PAPI Skala F"] },
      { name: "Pengambilan Keputusan",  description: "Ketepatan dan keberanian dalam menentukan keputusan solusi.", checked: true, instruments: ["PAPI Skala I"] },
    ]
  },
];

const ALL_TEST_MODULE_OPTIONS = [
  "WPT",
  "CFIT 1", "CFIT 2", "CFIT 3", "CFIT 4",
  "TIKI 1", "TIKI 2", "TIKI 3", "TIKI 4", "TIKI 6",
  "IST 1", "IST 2", "IST 3", "IST 4", "IST 5", "IST 6", "IST 7", "IST 8",
  "PAPI KOSTICK", "DISC", "MSDT", "POWER LEADER",
  "Kraepelin", "Wartegg", "Tes Grafis"
];

function getParentTests(mapping: CategoryGroup[]): string[] {
  const s = new Set<string>();
  mapping.forEach(cat => cat.aspects.forEach((asp: AspectItem) => {
    if (asp.checked && Array.isArray(asp.instruments)) asp.instruments.forEach((inst: string) => {
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
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
  const [mapping, setMapping]   = useState<CategoryGroup[]>(DEFAULT_MAPPING);
  const [sequence, setSequence] = useState<string[]>([]);
  const [dragIdx, setDragIdx]   = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [editId, setEditId]     = useState<number | null>(null);
  const router = useRouter();

  // Aspect Modal State (Add / Edit)
  const [aspectModalOpen, setAspectModalOpen]   = useState(false);
  const [aspectModalMode, setAspectModalMode]   = useState<'create' | 'edit'>('create');
  const [editCatIdx, setEditCatIdx]             = useState<number>(0);
  const [editAspIdx, setEditAspIdx]             = useState<number | null>(null);
  const [modalCategory, setModalCategory]       = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCatInput, setCustomCatInput]     = useState<string>('');
  const [modalName, setModalName]               = useState<string>('');
  const [modalDesc, setModalDesc]               = useState<string>('');
  const [modalInstruments, setModalInstruments] = useState<string[]>([]);
  const [modalChecked, setModalChecked]         = useState<boolean>(true);
  const [modalError, setModalError]             = useState<string>('');

  // Category Modal State (Add Category)
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName]     = useState('');
  const [catModalError, setCatModalError] = useState('');

  // Category Rename Modal
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameCatIdx, setRenameCatIdx]       = useState<number | null>(null);
  const [renameInput, setRenameInput]         = useState('');

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
            try { 
              const parsed = JSON.parse(d.mapping);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMapping(parsed);
              }
            } catch {}
            try { if (d.testSequence) setSequence(JSON.parse(d.testSequence)); } catch {}
          }
        });
    } else {
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
    const m = JSON.parse(JSON.stringify(mapping));
    m[ci].aspects[ai].checked = !m[ci].aspects[ai].checked;
    setMapping(m);
  };

  const changeInstruments = (ci: number, ai: number, val: string[]) => {
    const m = JSON.parse(JSON.stringify(mapping));
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

  /* ─── Category Actions ─────────────────────────────────── */
  const handleOpenAddCategory = () => {
    setNewCatName('');
    setCatModalError('');
    setCatModalOpen(true);
  };

  const handleSaveNewCategory = () => {
    const trimmed = newCatName.trim().toUpperCase();
    if (!trimmed) {
      setCatModalError('Nama kategori tidak boleh kosong.');
      return;
    }
    if (mapping.some(c => c.category.toUpperCase() === trimmed)) {
      setCatModalError('Kategori dengan nama tersebut sudah ada.');
      return;
    }
    setMapping(prev => [...prev, { category: trimmed, aspects: [] }]);
    setCatModalOpen(false);
  };

  const handleOpenRenameCategory = (ci: number) => {
    setRenameCatIdx(ci);
    setRenameInput(mapping[ci].category);
    setRenameModalOpen(true);
  };

  const handleSaveRenameCategory = () => {
    if (renameCatIdx === null) return;
    const trimmed = renameInput.trim().toUpperCase();
    if (!trimmed) return;
    const m = JSON.parse(JSON.stringify(mapping));
    m[renameCatIdx].category = trimmed;
    setMapping(m);
    setRenameModalOpen(false);
  };

  const handleDeleteCategory = (ci: number) => {
    const cat = mapping[ci];
    if (cat.aspects.length > 0) {
      if (!confirm(`Kategori "${cat.category}" memiliki ${cat.aspects.length} aspek. Yakin ingin menghapus seluruh kategori dan aspek di dalamnya?`)) {
        return;
      }
    }
    setMapping(prev => prev.filter((_, idx) => idx !== ci));
  };

  /* ─── Aspect Actions ───────────────────────────────────── */
  const handleOpenAddAspect = (defaultCategory?: string) => {
    setAspectModalMode('create');
    setEditAspIdx(null);
    setModalError('');
    setModalName('');
    setModalDesc('');
    setModalInstruments([]);
    setModalChecked(true);

    const initialCat = defaultCategory || (mapping[0]?.category || 'KEMAMPUAN KOGNITIF');
    setModalCategory(initialCat);
    setIsCustomCategory(false);
    setCustomCatInput('');
    setAspectModalOpen(true);
  };

  const handleOpenEditAspect = (ci: number, ai: number) => {
    const asp = mapping[ci].aspects[ai];
    setAspectModalMode('edit');
    setEditCatIdx(ci);
    setEditAspIdx(ai);
    setModalError('');
    setModalCategory(mapping[ci].category);
    setIsCustomCategory(false);
    setCustomCatInput('');
    setModalName(asp.name);
    setModalDesc(asp.description || '');
    setModalInstruments(asp.instruments || []);
    setModalChecked(asp.checked);
    setAspectModalOpen(true);
  };

  const handleDeleteAspect = (ci: number, ai: number) => {
    const aspName = mapping[ci].aspects[ai].name;
    if (!confirm(`Hapus aspek "${aspName}" dari preset?`)) return;
    const m = JSON.parse(JSON.stringify(mapping));
    m[ci].aspects.splice(ai, 1);
    setMapping(m);
  };

  const handleSaveAspectModal = () => {
    const trimmedName = modalName.trim();
    if (!trimmedName) {
      setModalError('Nama aspek psikologis harus diisi.');
      return;
    }

    let targetCatName = isCustomCategory ? customCatInput.trim().toUpperCase() : modalCategory.trim().toUpperCase();
    if (!targetCatName) {
      setModalError('Kategori harus dipilih atau diisi.');
      return;
    }

    const m: CategoryGroup[] = JSON.parse(JSON.stringify(mapping));

    if (aspectModalMode === 'create') {
      // Find or create category
      let cat = m.find(c => c.category.toUpperCase() === targetCatName);
      if (!cat) {
        cat = { category: targetCatName, aspects: [] };
        m.push(cat);
      }
      cat.aspects.push({
        name: trimmedName,
        description: modalDesc.trim(),
        checked: modalChecked,
        instruments: modalInstruments,
      });
    } else {
      // Edit existing
      if (editAspIdx !== null && editCatIdx !== null) {
        const oldCat = m[editCatIdx];
        if (oldCat.category.toUpperCase() === targetCatName) {
          // Same category
          oldCat.aspects[editAspIdx] = {
            name: trimmedName,
            description: modalDesc.trim(),
            checked: modalChecked,
            instruments: modalInstruments,
          };
        } else {
          // Moved to another category
          oldCat.aspects.splice(editAspIdx, 1);
          let newCat = m.find(c => c.category.toUpperCase() === targetCatName);
          if (!newCat) {
            newCat = { category: targetCatName, aspects: [] };
            m.push(newCat);
          }
          newCat.aspects.push({
            name: trimmedName,
            description: modalDesc.trim(),
            checked: modalChecked,
            instruments: modalInstruments,
          });
        }
      }
    }

    setMapping(m);
    setAspectModalOpen(false);
  };

  /* ─── Save Full Preset to DB ────────────────────────────── */
  const handleSave = async () => {
    if (!name.trim()) return setError('Nama Preset Psikogram harus diisi.');
    if (mapping.length === 0 || mapping.every(c => c.aspects.length === 0)) {
      return setError('Preset harus memiliki minimal 1 aspek penilaian.');
    }
    setSaving(true); 
    setError('');
    const url    = editId ? `/api/superadmin/psychograph/${editId}` : '/api/superadmin/psychograph';
    const method = editId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: name.trim(), mapping, sequence }) 
      });
      if (res.ok) {
        router.push('/superadmin/psychograph');
      } else { 
        const d = await res.json();
        setError(d.error || 'Gagal menyimpan preset.'); 
        setSaving(false); 
      }
    } catch (e: any) {
      setError('Terjadi kesalahan saat menyimpan: ' + (e.message || 'Network error'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/psychograph"
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">
              {editId ? 'Edit Preset Psikogram' : 'Buat Preset Psikogram Baru'}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Kelola aspek penilaian, deskripsi, instrumen tes, dan urutan baterai tes.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="text-[12px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="text-teal-600 font-bold">+</span> Tambah Kategori
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddAspect()}
            className="text-[12px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Tambah Aspek Penilaian
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/></svg>
          {error}
        </div>
      )}

      {/* Nama Preset */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Preset Psikogram</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Contoh: Template Manajerial, Template Staf Khusus, Standar Officer…"
          className="w-full max-w-lg px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors placeholder-slate-400"
        />
      </div>

      {/* Urutan Tes (Baterai Tes) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Urutan Modul Tes (Baterai Tes)</p>
            <p className="text-[12px] text-slate-400 mt-1">
              Atur urutan modul pengerjaan peserta. Tambahkan modul manual, hapus, atau geser urutan (drag & drop).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoSync}
            className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
            title="Sinkronkan modul otomatis berdasarkan instrumen yang digunakan pada aspek di bawah"
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

      {/* ── Aspek Penilaian per Kategori ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Pemetaan Kategori & Aspek Psikologis</h3>
            <p className="text-[12px] text-slate-500">Centang aspek yang dinilai, atur alat tes, atau klik tombol edit/tambah untuk kustomisasi.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>+</span> Kategori Baru
          </button>
        </div>

        {mapping.map((cat, ci) => {
          const activeCount = cat.aspects.filter(a => a.checked).length;
          return (
            <div key={ci} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
              {/* Category Header */}
              <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider">{cat.category}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                    {activeCount} / {cat.aspects.length} Aktif
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAddAspect(cat.category)}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    title={`Tambah aspek ke ${cat.category}`}
                  >
                    <span>+</span> Tambah Aspek
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenRenameCategory(ci)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                    title="Ubah nama kategori"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(ci)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus kategori ini"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Aspects List */}
              {cat.aspects.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-[12px]">
                  Kategori ini belum memiliki aspek. Klik <button onClick={() => handleOpenAddAspect(cat.category)} className="text-teal-600 font-bold hover:underline">+ Tambah Aspek</button> untuk menambahkan.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cat.aspects.map((asp, ai) => (
                    <div key={ai} className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-4 transition-colors ${!asp.checked ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/30'}`}>
                      <div className="flex items-start gap-3 md:w-72 shrink-0">
                        <input
                          type="checkbox" checked={asp.checked} onChange={() => toggleAspect(ci, ai)}
                          className="mt-1 w-4 h-4 rounded accent-teal-600 cursor-pointer shrink-0"
                          title={asp.checked ? "Nonaktifkan aspek ini" : "Aktifkan aspek ini"}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold ${asp.checked ? 'text-slate-900' : 'text-slate-500'}`}>
                            {asp.name}
                          </p>
                          {asp.description ? (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {asp.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              (Belum ada deskripsi)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Instruments selector */}
                      <div className={`flex-1 min-w-0 ${!asp.checked ? 'pointer-events-none' : ''}`}>
                        <p className="text-[11px] text-slate-400 font-semibold mb-1">Alat Tes / Subtes Rujukan</p>
                        <InstrumentSelect
                          selected={asp.instruments || []}
                          onChange={val => changeInstruments(ci, ai, val)}
                        />
                      </div>

                      {/* Action buttons (Edit / Delete) */}
                      <div className="flex items-center gap-1 shrink-0 self-end md:self-start md:mt-6">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAspect(ci, ai)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
                          title="Edit nama, deskripsi, atau kategori aspek ini"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAspect(ci, ai)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Hapus aspek ini"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 flex justify-between items-center z-30 shadow-lg">
        <div className="text-[12px] text-slate-500 font-medium">
          Total Kategori: <span className="font-bold text-slate-700">{mapping.length}</span> &bull; Total Aspek: <span className="font-bold text-slate-700">{mapping.reduce((acc, c) => acc + c.aspects.length, 0)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/superadmin/psychograph"
            className="text-[13px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-colors">
            Batal
          </Link>
          <button
            onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan ke Database…</>
            ) : 'Simpan Preset Psikogram'}
          </button>
        </div>
      </div>

      {/* ─── MODAL: Add / Edit Aspect ─── */}
      {aspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[15px] font-bold text-slate-900">
                {aspectModalMode === 'create' ? 'Tambah Aspek Penilaian' : 'Edit Aspek Penilaian'}
              </h3>
              <button
                type="button"
                onClick={() => setAspectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium px-3.5 py-2 rounded-xl">
                  {modalError}
                </div>
              )}

              {/* Kategori Select */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Aspek
                </label>
                <div className="space-y-2">
                  <select
                    value={isCustomCategory ? '__CUSTOM__' : modalCategory}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setModalCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 bg-white focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    {mapping.map(c => (
                      <option key={c.category} value={c.category}>{c.category}</option>
                    ))}
                    <option value="__CUSTOM__">+ Buat Kategori Baru...</option>
                  </select>

                  {isCustomCategory && (
                    <input
                      type="text"
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      placeholder="Masukkan nama kategori baru (mis: KEMAMPUAN MOTORIK)"
                      className="w-full px-3.5 py-2 border border-teal-300 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-500 bg-teal-50/30"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Nama Aspek */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Aspek Psikologis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={e => setModalName(e.target.value)}
                  placeholder="Mis: Daya Analisa, Critical Thinking, Orientasi Prestasi…"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Deskripsi Aspek */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi Aspek (Muncul di Hasil Laporan & PDF)
                </label>
                <textarea
                  rows={3}
                  value={modalDesc}
                  onChange={e => setModalDesc(e.target.value)}
                  placeholder="Jelaskan definisi aspek ini untuk laporan evaluasi..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[12px] text-slate-900 focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-400"
                />
              </div>

              {/* Alat Tes / Subtes Rujukan */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alat Tes / Subtes Rujukan
                </label>
                <InstrumentSelect
                  selected={modalInstruments}
                  onChange={val => setModalInstruments(val)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Pilih subtes rujukan untuk kalkulasi otomatis skor psikogram.</p>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalCheck"
                  checked={modalChecked}
                  onChange={e => setModalChecked(e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                />
                <label htmlFor="modalCheck" className="text-[12px] font-semibold text-slate-700 cursor-pointer">
                  Aktifkan penilaian untuk aspek ini dalam preset
                </label>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAspectModalOpen(false)}
                className="px-4 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAspectModal}
                className="px-5 py-2 text-[12px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
              >
                {aspectModalMode === 'create' ? 'Tambahkan ke Preset' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Category ─── */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[15px] font-bold text-slate-900">Tambah Kategori Baru</h3>
              <button type="button" onClick={() => setCatModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {catModalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium px-3.5 py-2 rounded-xl">{catModalError}</div>
              )}
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">Nama Kategori</label>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Mis: KEMAMPUAN MOTORIK, POTENSI KEPRIBADIAN…"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-500"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveNewCategory(); }}
              />
              <p className="text-[11px] text-slate-400">Nama kategori akan otomatis diubah menjadi huruf besar.</p>
            </div>
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setCatModalOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">Batal</button>
              <button type="button" onClick={handleSaveNewCategory} className="px-5 py-2 text-[12px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm">Buat Kategori</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Rename Category ─── */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[15px] font-bold text-slate-900">Ubah Nama Kategori</h3>
              <button type="button" onClick={() => setRenameModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">Nama Kategori</label>
              <input
                type="text"
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-teal-500"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveRenameCategory(); }}
              />
            </div>
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setRenameModalOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">Batal</button>
              <button type="button" onClick={handleSaveRenameCategory} className="px-5 py-2 text-[12px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
