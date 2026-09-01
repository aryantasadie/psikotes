'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestTimer from './TestTimer';

interface Question {
  id: number;
  testType: string;
  content: string;
  options: string[];
}

export default function TIKI2() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/questions?testType=TIKI 2')
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
        body: JSON.stringify({ testType: 'TIKI 2', answers })
      });
    } catch(e) { console.error(e); }
    localStorage.setItem('test_completed_tiki2', 'true'); 
    router.push('/testee/session');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat soal TIKI2...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Tidak ada soal TIKI2 yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => prev + 1);
  const handlePrev = () => setCurrentIndex(prev => prev - 1);

  const q = questions[currentIndex];

  const handleAnswer = (val: string) => {
    if (!q) return;
    const current = answers[q.id] || [];
    if (current.includes(val)) {
      setAnswers({ ...answers, [q.id]: current.filter(x => x !== val) });
    } else {
      if (current.length < 2) {
        setAnswers({ ...answers, [q.id]: [...current, val] });
      }
    }
  };

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>TIKI 2 - Gabungan Bagian</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Waktu Pengerjaan:</strong> 7 Menit (Otomatis berpindah jika waktu habis)</p>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Gambar di sebelah kiri merupakan bentuk yang terpotong. Di sebelah kanannya terdapat 6 gambar A,B,C,D,E,F. <strong>Dua diantaranya</strong> terbuat dari bagian-bagian yang terdapat disebelah kiri. Carilah kedua gambar tersebut!</p>
              
              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki2/contoh/contoh_1.jpeg" alt="Contoh 1" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 1 : Pilihlah jawaban dalam gambar yaitu B dan D</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki2/contoh/contoh_2.jpeg" alt="Contoh 2" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 2 : Pilihlah jawaban dalam gambar yaitu C dan F</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <img src="/soal/tiki2/contoh/contoh_3.jpeg" alt="Contoh 3" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 3 : Pilihlah jawaban dalam gambar yaitu E dan F</p>
              </div>

              <div>
                <img src="/soal/tiki2/contoh/contoh_4.jpeg" alt="Contoh 4" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                <p style={{ margin: '10px 0 0 0', color: '#2980b9', fontWeight: 'bold' }}>CONTOH 4 : Pilihlah jawaban dalam gambar yaitu A dan D</p>
              </div>
            </div>
          </div>
          <button 
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

  return (
    <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333', display: 'flex', alignItems: 'center', position: 'relative' }}>
      {/* Top Left Floating Timer (7 Min, Auto Submit) */}
      <TestTimer durationSeconds={7 * 60} autoSubmit={true} onTimeUp={handleFinish} isActive={!showInstruction} testName="TIKI 2" />

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        {/* Main Test Card */}
        <div style={{ flex: '1 1 600px', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '15px', marginBottom: '30px' }}>
            <h2 style={{ margin: 0 }}>Ujian Psikotes: {q.testType}</h2>
            <div style={{ background: '#34495e', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
              Soal {currentIndex + 1} / {questions.length}
            </div>
          </div>

          <div style={{ marginBottom: '40px', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src={q.content} alt="Soal" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', border: '1px solid #ddd', objectFit: 'contain' }} />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: (q.options && q.options.length > 0 && q.options.every(o => /^[A-Z]$/.test(o)) || q.testType === 'TIKI 6' || q.testType === 'TIKI 3') ? '1fr 1fr' : '1fr', 
            gap: '15px', 
            marginBottom: '40px', 
            maxWidth: '500px', 
            margin: '0 auto' 
          }}>
            {q.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = (answers[q.id] || []).includes(letter);
              return (
                <button 
                  key={idx}
                  onClick={() => handleAnswer(letter)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '15px 25px',
                    fontSize: '18px',
                    fontWeight: '600',
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
              )
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #eaeaea', paddingTop: '20px' }}>
            <button 
              disabled={currentIndex === 0}
              onClick={handlePrev}
              style={{ padding: '12px 24px', background: currentIndex === 0 ? '#f5f5f5' : '#fff', color: currentIndex === 0 ? '#aaa' : '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              ← Sebelumnya
            </button>

            {currentIndex === questions.length - 1 ? (
              <button 
                onClick={handleFinish}
                style={{ padding: '12px 24px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)' }}
              >
                Selesai & Kumpulkan
              </button>
            ) : (
              <button 
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
              const isAnswered = !!answers[qItem.id] && answers[qItem.id].length > 0;
              const isCurrent = currentIndex === idx;
              
              let bg = '#fff';
              let color = '#333';
              let border = '1px solid #ddd';

              if (isCurrent) {
                bg = '#34495e';
                color = 'white';
                border = '1px solid #34495e';
              } else if (isAnswered) {
                bg = '#f0fdf4';
                color = '#16a34a';
                border = '1px solid #bbf7d0';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    padding: '12px 0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: bg,
                    color: color,
                    border: border,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isCurrent ? '0 4px 10px rgba(52, 73, 94, 0.2)' : 'none'
                  }}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eaeaea', fontSize: '14px', color: '#666' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '16px', height: '16px', background: '#2ecc71', borderRadius: '4px', marginRight: '10px' }}></div>
              Sudah Dijawab ({Object.keys(answers).filter(k => (answers[parseInt(k)] || []).length > 0).length})
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '16px', height: '16px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', marginRight: '10px' }}></div>
              Belum Dijawab ({questions.length - Object.keys(answers).filter(k => (answers[parseInt(k)] || []).length > 0).length})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
