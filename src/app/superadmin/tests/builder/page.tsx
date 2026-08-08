'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const AVAILABLE_TESTS = [
  'CFIT 1', 'CFIT 2', 'CFIT 3', 'CFIT 4',
  'WPT', 
  'TIKI 1', 'TIKI 2', 'TIKI 3', 'TIKI 4', 'TIKI 6',
  'IST 2', 'IST 3', 'IST 6', 'IST 7',
  'DISC', 'MSDT', 'PAPI KOSTICK', 'POWER'
];

export default function TestBuilder() {
  const [title, setTitle] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setEditId(parseInt(id));
      fetch('/api/superadmin/tests')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const test = data.find(t => t.id === parseInt(id));
            if (test) {
              setTitle(test.title);
              try {
                setSequence(JSON.parse(test.sequence || '[]'));
              } catch(e) {}
            }
          }
        });
    }
  }, []);

  const handleAddTest = (test: string) => {
    setSequence([...sequence, test]);
  };

  const handleRemoveTest = (index: number) => {
    const newSeq = [...sequence];
    newSeq.splice(index, 1);
    setSequence(newSeq);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Fix for Firefox
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedIndex === null || draggedIndex === index) return;

    const newSeq = [...sequence];
    const draggedItem = newSeq[draggedIndex];
    newSeq.splice(draggedIndex, 1);
    newSeq.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setSequence(newSeq);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!title) return setError('Judul Paket Ujian harus diisi.');
    if (sequence.length === 0) return setError('Tambahkan minimal 1 alat tes ke dalam paket.');

    setSaving(true);
    setError('');

    try {
      const url = editId ? `/api/superadmin/tests/${editId}` : '/api/superadmin/tests';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sequence })
      });

      if (res.ok) {
        router.push('/superadmin/tests');
      } else {
        setError('Gagal menyimpan baterai tes.');
        setSaving(false);
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
      setSaving(false);
    }
  };

  return (
    <section className="page active" data-page="bank-tes">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
        <Link href="/superadmin/tests" className="btn-ghost" style={{ padding: '8px 12px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Kembali
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
          {editId ? 'Edit Baterai Tes' : 'Racik Baterai Tes Baru'}
        </h2>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Column: Form & Sequence Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Title Input */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#161A2C' }}>Nama Paket Ujian (Baterai)</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Rekrutmen SPV 2026"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E4E7EF', fontSize: '15px', outlineColor: '#3A3F94' }}
            />
          </div>

          {/* Sequence Area (Drop Target) */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexGrow: 1 }}>
            <h2 style={{ margin: '0 0 15px', fontSize: '16px', color: '#161A2C' }}>Urutan Pengerjaan Ujian</h2>
            <p style={{ margin: '0 0 20px', color: '#69728A', fontSize: '13px' }}>Geser (Drag & Drop) kotak di bawah ini untuk mengubah urutan pengerjaan bagi peserta tes.</p>
            
            {sequence.length === 0 ? (
              <div style={{ border: '2px dashed #D3D8E4', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#98A0B3', fontSize: '14px' }}>
                Klik alat tes di sebelah kanan untuk menambahkan ke urutan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sequence.map((test, index) => (
                  <div
                    key={`${test}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: draggedIndex === index ? '#F7F8FB' : '#FFFFFF',
                      border: '1px solid #E4E7EF', borderRadius: '8px', cursor: 'grab',
                      boxShadow: draggedIndex === index ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                      opacity: draggedIndex === index ? 0.5 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#98A0B3', cursor: 'grab' }}>☰</span>
                      <strong style={{ color: '#3A3F94' }}>{index + 1}.</strong>
                      <span style={{ fontWeight: 600, color: '#161A2C' }}>{test}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveTest(index); }}
                      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 'bold', padding: '4px 8px', position: 'relative', zIndex: 10 }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '16px', background: '#3A3F94', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(58, 63, 148, 0.2)' }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Baterai Tes'}
          </button>
        </div>

        {/* Right Column: Available Tests */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 15px', fontSize: '16px', color: '#161A2C' }}>Daftar Alat Tes Tersedia</h2>
          <p style={{ margin: '0 0 20px', color: '#69728A', fontSize: '13px' }}>Klik tombol (+) untuk menambahkan tes ini ke dalam Baterai.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {AVAILABLE_TESTS.map(test => (
              <div 
                key={test} 
                onClick={() => handleAddTest(test)}
                style={{ 
                  border: '1px solid #E4E7EF', borderRadius: '8px', padding: '12px', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#3A3F94'; e.currentTarget.style.background = '#EBECF8'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#E4E7EF'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#161A2C' }}>{test}</span>
                <span style={{ color: '#3A3F94', fontWeight: 'bold' }}>+</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
