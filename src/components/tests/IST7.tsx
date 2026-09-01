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

export default function IST7() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/questions?testType=IST 7')
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
      await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'IST 7', answers })
      });
    } catch(e) { console.error(e); }
    localStorage.setItem('test_completed_ist7', 'true'); 
    router.push('/testee/session');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat soal IST 7...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Tidak ada soal IST 7 yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));
  const goToQuestion = (idx: number) => setCurrentIndex(idx);

  const handleAnswer = (val: string) => {
    const qItem = questions[currentIndex];
    if (qItem) {
      setAnswers({ ...answers, [qItem.id]: val });
    }
  };

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '780px', width: '100%', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#2c3e50', marginBottom: '16px', fontWeight: '800' }}>
            IST 7 - Bentuk Ruang (Penggabungan Potongan Gambar)
          </h2>
          
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '24px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '28px', lineHeight: '1.6', color: '#334155', fontSize: '15px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Waktu Pengerjaan:</strong> 7 Menit (Sistem otomatis berpindah jika waktu habis)</p>
            <p style={{ margin: '0 0 16px 0' }}>
              <strong>Petunjuk:</strong> Ditentukan sebuah bentuk yang terpotong menjadi beberapa bagian. Pilihlah dari 5 pilihan (A, B, C, D, E) bentuk utuh yang dapat tersusun jika potongan-potongan tersebut digabungkan tanpa ada bagian yang terbuang atau bertumpuk.
            </p>
            
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px', fontWeight: 800 }}>CONTOH PETUNJUK SOAL IST 7</h4>
              <img 
                src="/soal/ist7/contoh/contoh_1.jpeg" 
                alt="Contoh IST 7" 
                style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', border: '1px solid #cbd5e1', objectFit: 'contain' }} 
              />
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowInstruction(false)}
            style={{ 
              padding: '16px 40px', 
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
            Mulai Ujian IST 7
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  // Determine reference image based on question number:
  // Q1-12 (index 0-11): referensi.jpeg
  // Q13-20 (index 12-19): referensi2.jpeg
  const isFirstBatch = currentIndex < 12;
  const masterReferenceImg = isFirstBatch ? '/soal/ist7/referensi.jpeg' : '/soal/ist7/referensi2.jpeg';

  return (
    <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333', display: 'flex', alignItems: 'center', position: 'relative' }}>
      {/* Top Left Floating Timer (7 Min, Auto Submit) */}
      <TestTimer durationSeconds={7 * 60} autoSubmit={true} onTimeUp={handleFinish} isActive={!showInstruction} testName="IST 7" />

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        {/* Main Test Card */}
        <div style={{ flex: '1 1 600px', background: 'white', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '15px', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>Ujian Psikotes: {q.testType}</h2>
            <div style={{ background: '#34495e', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
              Soal {currentIndex + 1} / {questions.length}
            </div>
          </div>

          {/* Master Reference Image for IST 7 */}
          <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📌 Pilihan Bentuk Ruang Target (A, B, C, D, E) — {isFirstBatch ? 'Soal No. 1–12' : 'Soal No. 13–20'}
            </div>
            <img 
              src={masterReferenceImg} 
              alt="Referensi Bentuk Ruang IST 7" 
              style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #E2E8F0', background: '#FFFFFF' }} 
            />
          </div>

          {/* Question Pieces Image */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
              Potongan bentuk pada Soal No. {currentIndex + 1}:
            </div>
            <img 
              src={q.content} 
              alt={`Soal No. ${currentIndex + 1}`} 
              style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '12px', border: '1px solid #CBD5E1', objectFit: 'contain', display: 'inline-block' }} 
            />
          </div>

          {/* Options A, B, C, D, E */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '12px', 
            marginBottom: '36px', 
            maxWidth: '500px', 
            margin: '0 auto 36px' 
          }}>
            {['A', 'B', 'C', 'D', 'E'].map((opt) => {
              const isSelected = answers[q.id] === opt;
              return (
                <button 
                  key={opt}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px 10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: isSelected ? '#3498db' : '#f9f9f9',
                    color: isSelected ? 'white' : '#333',
                    border: isSelected ? '2px solid #2980b9' : '2px solid #ddd',
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #eaeaea', paddingTop: '20px' }}>
            <button 
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              style={{ padding: '12px 24px', background: currentIndex === 0 ? '#f5f5f5' : '#fff', color: currentIndex === 0 ? '#aaa' : '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              ← Sebelumnya
            </button>

            {currentIndex === questions.length - 1 ? (
              <button 
                type="button"
                onClick={handleFinish}
                style={{ padding: '12px 24px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)' }}
              >
                Selesai &amp; Kumpulkan
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleNext}
                style={{ padding: '12px 24px', background: '#34495e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)' }}
              >
                Selanjutnya →
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div style={{ width: '300px', flexShrink: 0, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'sticky', top: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #eaeaea', paddingBottom: '10px' }}>Daftar Soal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {questions.map((qItem, idx) => {
              const isAnswered = !!answers[qItem.id];
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
          
          <div style={{ marginTop: '25px', fontSize: '14px', color: '#666', borderTop: '2px solid #eaeaea', paddingTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '16px', height: '16px', background: '#2ecc71', borderRadius: '4px', marginRight: '10px' }}></div> 
              <span>Sudah Dijawab ({Object.keys(answers).length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '16px', height: '16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginRight: '10px' }}></div> 
              <span>Belum Dijawab ({questions.length - Object.keys(answers).length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
