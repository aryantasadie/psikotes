'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestTimer from './TestTimer';
import UnansweredModal from './UnansweredModal';

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
  const [unansweredList, setUnansweredList] = useState<number[]>([]);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
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

  const handleManualSubmit = () => {
    const emptyNums: number[] = [];
    questions.forEach((q, idx) => {
      if (!answers[q.id]) {
        emptyNums.push(idx + 1);
      }
    });

    if (emptyNums.length > 0) {
      setUnansweredList(emptyNums);
      setShowUnansweredModal(true);
      return;
    }

    handleFinish();
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat soal IST7...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Tidak ada soal IST7 yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));
  const goToQuestion = (idx: number) => setCurrentIndex(idx);

  const handleAnswer = (val: string) => {
    const q = questions[currentIndex];
    if (q) {
      setAnswers({ ...answers, [q.id]: val });
    }
  };

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '750px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>IST 7 - Bentuk Ruang</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Waktu Pengerjaan:</strong> 7 Menit (Otomatis berpindah jika waktu habis)</p>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>PETUNJUK &amp; CONTOH SOAL</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '15px', lineHeight: '1.6' }}>
                Carilah di antara bentuk-bentuk yang ditentukan (A, B, C, D, E), bentuk yang dapat dibangun dengan cara menyusun potongan-potongan pada soal sedemikian rupa, sehingga tidak ada kelebihan sudut atau ruang di antaranya.
              </p>
              
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img src="/soal/ist7/contoh/contoh_1.jpeg" alt="Contoh Soal IST 7" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'inline-block' }} />
              </div>

              <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                <div>• <strong>Soal 07:</strong> Potongan membentuk lingkaran utuh &rarr; <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Jawaban A</span></div>
                <div>• <strong>Soal 08:</strong> Potongan membentuk kerucut &rarr; <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Jawaban E</span></div>
                <div>• <strong>Soal 09:</strong> Potongan membentuk setengah lingkaran &rarr; <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Jawaban B</span></div>
                <div>• <strong>Soal 10:</strong> Potongan membentuk segitiga siku &rarr; <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Jawaban D</span></div>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowInstruction(false)}
            style={{ padding: '18px 45px', fontSize: '18px', background: 'linear-gradient(to right, #3498db, #2980b9)', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(52, 152, 219, 0.3)', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  // Nomor 1-12 (index 0-11) menggunakan referensi.jpeg, Nomor 13-20 (index 12-19) menggunakan referensi2.jpeg
  const isFirstBatch = currentIndex < 12;
  const masterReferenceImg = isFirstBatch ? '/soal/ist7/referensi.jpeg' : '/soal/ist7/referensi2.jpeg';

  return (
    <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333', display: 'flex', alignItems: 'center', position: 'relative' }}>
      {/* Top Left Floating Timer (7 Min, Auto Submit) */}
      <TestTimer durationSeconds={7 * 60} autoSubmit={true} onTimeUp={handleFinish} isActive={!showInstruction} testName="IST 7" />

      {/* In-App Unanswered Modal */}
      <UnansweredModal
        isOpen={showUnansweredModal}
        unansweredList={unansweredList}
        testTitle="IST 7 (Bentuk Ruang)"
        onSelectQuestion={(num) => goToQuestion(num - 1)}
        onClose={() => setShowUnansweredModal(false)}
      />

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
              const isSelected = answers[q.id] === opt || answers[q.id] === opt.toLowerCase();
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
                    fontSize: '20px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: isSelected ? '#2563EB' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#0F172A',
                    border: isSelected ? '2px solid #1D4ED8' : '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt}
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
              style={{ padding: '12px 24px', background: currentIndex === 0 ? '#f5f5f5' : '#fff', color: currentIndex === 0 ? '#aaa' : '#333', border: '1px solid #ccc', borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              ← Sebelumnya
            </button>

            {currentIndex === questions.length - 1 ? (
              <button 
                type="button"
                onClick={handleManualSubmit}
                style={{ padding: '12px 24px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)' }}
              >
                Selesai &amp; Kumpulkan
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleNext}
                style={{ padding: '12px 24px', background: '#34495e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)' }}
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
