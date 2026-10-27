'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestTimer from './TestTimer';

interface Question {
  id: number;
  testType: string;
  content: string;
  options: string[];
}

export default function WPT() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore draft answers if available
    if (typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem('test_draft_answers_wpt');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setAnswers(parsed);
            setShowInstruction(false);
          }
        }
      } catch (e) {}
    }

    fetch('/api/questions?testType=WPT')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuestions(data.questions);
        }
        setLoading(false);
      });
  }, []);

  const handleFinish = async () => {
    try {
      const ageStr = sessionStorage.getItem('testee_age');
      await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testType: 'WPT', 
          answers,
          age: ageStr ? parseInt(ageStr, 10) : null 
        })
      });
    } catch(e) { console.error(e); }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('test_draft_answers_wpt');
      localStorage.removeItem('test_timer_left_wpt');
      localStorage.setItem('test_completed_wpt', 'true');
    }
    router.push('/testee/session');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat soal WPT...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Tidak ada soal WPT yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));
  const goToQuestion = (idx: number) => setCurrentIndex(idx);

  const q = questions[currentIndex];

  // Detect if current question is a multi-select question (e.g. No 23, 41, 49)
  const isMultiSelect = (
    currentIndex === 22 || // No 23
    currentIndex === 40 || // No 41
    currentIndex === 48 || // No 49
    (q && (
      q.content.toUpperCase().includes('DUA DARI') ||
      q.content.toUpperCase().includes('EMPAT DARI') ||
      q.content.toUpperCase().includes('CENTANG SEMUA') ||
      q.content.toUpperCase().includes('PILIH LEBIH DARI')
    ))
  );

  // Helper to extract option canonical key (e.g. "1", "2" or "A", "B", "S")
  const getOptionKey = (opt: string, idx: number): string => {
    if (!opt) return String(idx + 1);
    const trimmed = opt.trim();
    if (/^[A-Za-z]$/.test(trimmed)) return trimmed.toUpperCase();
    const letterMatch = trimmed.match(/^([A-Za-z])[\.\)]/);
    if (letterMatch) return letterMatch[1].toUpperCase();
    const numMatch = trimmed.match(/^(\d+)/);
    if (numMatch) return numMatch[1];
    return String(idx + 1);
  };

  // Helper to check if an option is selected
  const isOptionSelected = (qId: number, optKey: string, idx: number): boolean => {
    const raw = String(answers[qId] || '').trim();
    if (!raw) return false;
    if (isMultiSelect) {
      const letter = String.fromCharCode(65 + idx);
      const digit = String(idx + 1);
      return raw.includes(optKey) || raw.includes(letter) || raw.includes(digit);
    }
    
    const cleanRaw = raw.toUpperCase();
    const cleanKey = optKey.toUpperCase();

    // Exact match (e.g. "B" === "B", "S" === "S", "1" === "1")
    if (cleanRaw === cleanKey) return true;

    // For 2-option Benar/Salah questions, strictly compare key to prevent collision with index letter (B)
    if (q && q.options && q.options.length === 2 && (cleanKey === 'B' || cleanKey === 'S')) {
      return cleanRaw === cleanKey;
    }

    const letter = String.fromCharCode(65 + idx);
    const digit = String(idx + 1);
    return cleanRaw === letter || cleanRaw === digit;
  };

  // Single select handler
  const handleSingleAnswer = (val: string) => {
    if (!q) return;
    const updated = { ...answers, [q.id]: val };
    setAnswers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_draft_answers_wpt', JSON.stringify(updated));
    }
  };

  // Multi select toggle handler
  const handleToggleMultiOption = (optKey: string, idx: number) => {
    if (!q) return;
    const raw = String(answers[q.id] || '').trim();
    const letter = String.fromCharCode(65 + idx);
    const digit = String(idx + 1);
    const keyToUse = /^\d+$/.test(optKey) ? optKey : /^[A-Za-z]$/.test(optKey) ? optKey.toUpperCase() : digit;

    // Parse existing keys from raw string
    let currentKeys: string[] = [];
    if (/^\d+$/.test(raw)) {
      currentKeys = raw.split('');
    } else {
      currentKeys = raw.replace(/[^A-Za-z0-9]/g, '').split('');
    }

    if (currentKeys.includes(keyToUse) || currentKeys.includes(digit) || currentKeys.includes(letter)) {
      currentKeys = currentKeys.filter(k => k !== keyToUse && k !== digit && k !== letter);
    } else {
      currentKeys.push(keyToUse);
    }

    // Sort to keep consistent format (e.g. "14", "25", "1245")
    currentKeys.sort();
    const finalVal = currentKeys.join('');

    const updated = { ...answers, [q.id]: finalVal };
    setAnswers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_draft_answers_wpt', JSON.stringify(updated));
    }
  };

  if (showInstruction) {
    return (
      <div className="test-instruction-wrapper" style={{ padding: '16px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="test-instruction-card" style={{ maxWidth: '680px', width: '100%', background: 'white', padding: 'clamp(24px, 5vw, 45px)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 className="test-instruction-title" style={{ fontSize: 'clamp(22px, 5vw, 30px)', color: '#2c3e50', marginBottom: '16px', fontWeight: '800' }}>WPT - Wonderlic Personnel Test</h2>
          <div className="test-instruction-box" style={{ textAlign: 'left', background: '#f8fbff', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '28px', lineHeight: '1.7', color: '#444', fontSize: '15px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Waktu Pengerjaan:</strong> 12 Menit (Waktu berjalan otomatis di latar belakang dan tes akan otomatis selesai jika waktu habis)</p>
            <p style={{ margin: '0 0 10px 0' }}><strong>Jumlah Soal:</strong> 50 Soal</p>
            <p style={{ margin: '0 0 15px 0' }}>Tes ini terdiri dari berbagai jenis pertanyaan: logika kata, hitungan matematika, dan pola gambar. Beberapa soal dapat memiliki lebih dari 1 pilihan jawaban. Kerjakan secepat dan seteliti mungkin.</p>
            <div className="test-instruction-example" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Bulan terakhir pada tahun adalah?</p>
              <div className="test-example-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginBottom: '8px' }}>
                <span>1. Januari</span>
                <span>2. Maret</span>
                <span>3. Juli</span>
                <span>4. Desember</span>
                <span>5. Oktober</span>
              </div>
              <p style={{ margin: 0, color: '#27ae60', fontWeight: 'bold' }}>Jawaban: 4. Desember</p>
            </div>
          </div>
          <button 
            type="button"
            className="test-instruction-btn"
            onClick={() => {
              if (typeof window !== 'undefined' && ((window as any).__CBT_IS_PAUSED__ || (window as any).__CBT_IS_STOPPED__)) return;
              setShowInstruction(false);
            }}
            style={{ 
              padding: '16px 45px', 
              fontSize: '17px', 
              background: 'linear-gradient(to right, #3498db, #2980b9)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              boxShadow: '0 10px 20px rgba(52, 152, 219, 0.3)', 
              transition: 'transform 0.2s' 
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    );
  }

  const isShortOptions = Boolean(
    q && q.options && q.options.length > 0 &&
    q.options.every(o => /^[A-Za-z0-9]$/.test(o.trim()))
  );

  return (
    <div className="test-outer-container" style={{ fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100dvh', color: '#333', display: 'flex', alignItems: 'center', position: 'relative' }}>
      {/* Background Silent Timer (12 Min, Auto Submit) */}
      <TestTimer durationSeconds={12 * 60} autoSubmit={true} onTimeUp={handleFinish} isActive={!showInstruction} testName="WPT" />

      <div className="test-content-wrapper">
        {/* Main Test Card */}
        <div className="test-main-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '14px', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(17px, 4vw, 22px)', fontWeight: 800 }}>Ujian Psikotes: {q.testType}</h2>
            <div style={{ background: '#34495e', color: 'white', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>
              Soal {currentIndex + 1} / {questions.length}
            </div>
          </div>

          {/* Question Content */}
          <div style={{ marginBottom: '24px', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {isMultiSelect && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                <span>☑️</span> Anda dapat memilih lebih dari 1 jawaban pada soal ini
              </div>
            )}

            {q.content.includes('|||') ? (
              <>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 'clamp(15px, 3.8vw, 19px)', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: '1.4', wordBreak: 'break-word', width: '100%' }}>{q.content.split('|||')[0]}</h3>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden', marginBottom: '10px' }}>
                  <img 
                    src={q.content.split('|||')[1]} 
                    alt="Soal" 
                    className="test-image-responsive"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '280px', borderRadius: '8px', border: '1px solid #ddd' }} 
                  />
                </div>
              </>
            ) : (
              <h3 style={{ margin: 0, fontSize: 'clamp(15px, 3.8vw, 19px)', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: '1.4', wordBreak: 'break-word', width: '100%' }}>{q.content}</h3>
            )}
          </div>

          {/* Options Grid */}
          <div 
            className={`test-options-grid ${isShortOptions ? 'short-opts' : ''}`}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isShortOptions ? `repeat(${q.options?.length || 5}, 1fr)` : '1fr', 
              gap: '12px', 
              marginBottom: '32px', 
              maxWidth: '620px', 
              margin: '0 auto 32px',
              width: '100%'
            }}
          >
            {q.options && q.options.length > 0 ? q.options.map((opt, idx) => {
              const optKey = getOptionKey(opt, idx);
              const selected = isOptionSelected(q.id, optKey, idx);

              return (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (isMultiSelect) {
                      handleToggleMultiOption(optKey, idx);
                    } else {
                      handleSingleAnswer(optKey);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: isShortOptions ? '12px 14px' : '14px 18px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: selected ? '#EFF6FF' : '#FFFFFF',
                    color: selected ? '#1D4ED8' : '#334155',
                    border: selected ? '2px solid #3B82F6' : '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    textAlign: isShortOptions ? 'center' : 'left',
                    justifyContent: isShortOptions ? 'center' : 'flex-start'
                  }}
                >
                  {/* Indicator Box: Checkbox for Multi, Radio Circle for Single */}
                  {isMultiSelect ? (
                    <div className="radio-indicator" style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: selected ? '2px solid #2563EB' : '2px solid #94A3B8',
                      background: selected ? '#2563EB' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: isShortOptions ? '6px' : '12px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 900,
                      flexShrink: 0
                    }}>
                      {selected ? '✓' : ''}
                    </div>
                  ) : (
                    <div className="radio-indicator" style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: selected ? '2px solid #2563EB' : '2px solid #CBD5E1',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: isShortOptions ? '6px' : '12px',
                      flexShrink: 0
                    }}>
                      {selected && <div className="radio-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }} />}
                    </div>
                  )}

                  <span style={{ lineHeight: '1.4' }}>{opt}</span>
                </button>
              );
            }) : (
              <div style={{ gridColumn: '1 / -1', maxWidth: '300px', margin: '0 auto', width: '100%' }}>
                <input 
                  type="text" 
                  placeholder="Ketik jawaban di sini..."
                  value={(answers[q.id] as any) || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = { ...answers, [q.id]: val };
                    setAnswers(updated);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('test_draft_answers_wpt', JSON.stringify(updated));
                    }
                  }}
                  style={{ width: '100%', padding: '14px', fontSize: '18px', textAlign: 'center', borderRadius: '12px', border: '2px solid #3498db', outline: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="test-nav-controls" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #eaeaea', paddingTop: '20px', gap: '10px' }}>
            <button 
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              style={{ padding: '12px 20px', background: currentIndex === 0 ? '#f5f5f5' : '#fff', color: currentIndex === 0 ? '#aaa' : '#333', border: '1px solid #ccc', borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              ← Sebelumnya
            </button>

            {currentIndex === questions.length - 1 ? (
              <button 
                type="button"
                onClick={handleFinish}
                style={{ padding: '12px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)' }}
              >
                Selesai &amp; Kumpulkan
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleNext}
                style={{ padding: '12px 20px', background: '#34495e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)' }}
              >
                Selanjutnya →
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div className="test-sidebar-card">
          <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', borderBottom: '2px solid #eaeaea', paddingBottom: '10px', fontWeight: 800 }}>Daftar Soal</h3>
          <div className="test-sidebar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {questions.map((qItem, idx) => {
              const val = answers[qItem.id];
              const isAnswered = val !== undefined && val !== null && String(val).trim() !== '';
              const isCurrent = currentIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToQuestion(idx)}
                  style={{
                    height: '40px',
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid #2c3e50' : (isAnswered ? '1px solid #2ecc71' : '1px solid #ccc'),
                    background: isCurrent ? '#2c3e50' : (isAnswered ? '#2ecc71' : '#fff'),
                    color: (isCurrent || isAnswered) ? 'white' : '#333',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    padding: 0
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div style={{ marginTop: '20px', fontSize: '13px', color: '#666', borderTop: '2px solid #eaeaea', paddingTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '14px', height: '14px', background: '#2ecc71', borderRadius: '4px', marginRight: '8px' }}></div> 
              <span>Sudah Dijawab ({Object.values(answers).filter(v => v !== undefined && v !== null && String(v).trim() !== '').length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '14px', height: '14px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginRight: '8px' }}></div> 
              <span>Belum Dijawab ({questions.length - Object.values(answers).filter(v => v !== undefined && v !== null && String(v).trim() !== '').length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
