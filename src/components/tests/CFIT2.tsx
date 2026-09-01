'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  testType: string;
  content: string;
  options: string[];
}

export default function CFIT2() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/questions?testType=CFIT 2')
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
        body: JSON.stringify({ testType: 'CFIT 2', answers })
      });
    } catch(e) { console.error(e); }
    localStorage.setItem('test_completed_cfit2', 'true'); 
    router.push('/testee/session');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat soal CFIT 2...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Tidak ada soal CFIT 2 yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));
  const goToQuestion = (idx: number) => setCurrentIndex(idx);

  const handleAnswer = (val: string) => {
    const qItem = questions[currentIndex];
    if (!qItem) return;
    const current = answers[qItem.id] || [];
    if (current.includes(val)) {
      setAnswers({ ...answers, [qItem.id]: current.filter(x => x !== val) });
    } else {
      if (current.length < 2) {
        setAnswers({ ...answers, [qItem.id]: [...current, val] });
      }
    }
  };

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>CFIT Skala 3 - Subtes 2</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Waktu Pengerjaan:</strong> 4 Menit</p>
            <p style={{ margin: '0 0 15px 0' }}>Pilihlah <strong>2 GAMBAR</strong> dari 5 pilihan yang memiliki karakteristik berbeda atau tidak sekelompok dengan gambar lainnya.</p>
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
  const currentAnswers = answers[q.id] || [];

  return (
    <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333', display: 'flex', alignItems: 'center', position: 'relative' }}>
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
            <img src={q.content} alt="Soal" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '15px', 
            marginBottom: '40px', 
            maxWidth: '500px', 
            margin: '0 auto 40px' 
          }}>
            {q.options.map((opt, idx) => {
              const letter = opt.charAt(0);
              const isSelected = currentAnswers.includes(letter);
              return (
                <button 
                  key={idx}
                  type="button"
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
              const isAnswered = answers[qItem.id] && answers[qItem.id].length > 0;
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
              <span>Sudah Dijawab ({Object.values(answers).filter(a => a.length > 0).length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '16px', height: '16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginRight: '10px' }}></div> 
              <span>Belum Dijawab ({questions.length - Object.values(answers).filter(a => a.length > 0).length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
