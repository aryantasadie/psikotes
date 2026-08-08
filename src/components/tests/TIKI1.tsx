'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  testType: string;
  content: string;
  options: string[];
}

export default function TIKI1() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/questions?testType=TIKI 1')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuestions(data.questions);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat soal TIKI1...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Tidak ada soal TIKI1 yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => prev + 1);
  const handlePrev = () => setCurrentIndex(prev => prev - 1);

  const handleAnswer = (val: string) => setAnswers({ ...answers, [questions[currentIndex].id]: val });


  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>TIKI 1 - Berhitung</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>CONTOH SOAL</h4>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>18 + 7 = .....</p>
                <p style={{ margin: '0 0 5px 0' }}>A) 25 &nbsp; B) 26 &nbsp; C) 24 &nbsp; D) 23</p>
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#e74c3c', fontWeight: 'bold' }}>Jawaban: A (25)</p>
            </div>
    
          </div>
          <button 
            onClick={() => setShowInstruction(false)}
            style={{ padding: '18px 45px', fontSize: '18px', background: 'linear-gradient(to right, #3498db, #2980b9)', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(52, 152, 219, 0.3)', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333', display: 'flex', alignItems: 'center' }}>
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
          <h3 
            style={{ fontSize: '24px', textAlign: 'center', lineHeight: '1.5', margin: 0, color: '#333', whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: q.content }}
          />
        </div>


        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (q.options && q.options.length > 0 && q.options.every(o => /^[A-Z]$/.test(o)) || q.testType === 'TIKI 6' || q.testType === 'TIKI 3' || q.testType === 'TIKI 1') ? '1fr 1fr' : '1fr', 
          gap: '15px', 
          marginBottom: '40px', 
          maxWidth: '500px', 
          margin: '0 auto' 
        }}>
          {q.options && q.options.length > 0 ? q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = answers[q.id] === letter;
            const isSingleLetter = /^[A-Z]$/.test(opt);
            const isTiki6 = q.testType === 'TIKI 6';
            const isTiki3 = q.testType === 'TIKI 3';
            const isTiki1 = q.testType === 'TIKI 1';
            const isGrid = q.options.every(o => /^[A-Z]$/.test(o)) || isTiki6 || isTiki3 || isTiki1;
            const isLastOdd = isGrid && q.options.length % 2 !== 0 && idx === q.options.length - 1;
            
            let labelContent;
            if (isTiki6 || isSingleLetter) {
                labelContent = <span style={{ fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: opt }} />;
            } else {
                labelContent = (
                  <>
                    <span style={{ marginRight: '15px', fontWeight: 'bold', color: isSelected ? 'white' : '#888' }}>{letter})</span>
                    <span dangerouslySetInnerHTML={{ __html: opt }} />
                  </>
                );
            }

            return (
              <button 
                key={idx}
                onClick={() => handleAnswer(letter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: (isTiki6 || isSingleLetter) ? 'center' : 'flex-start',
                  gridColumn: isLastOdd ? '1 / -1' : 'auto',
                  padding: '15px 25px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: isSelected ? '#3498db' : '#f9f9f9',
                  color: isSelected ? 'white' : '#333',
                  border: isSelected ? '2px solid #2980b9' : '2px solid #ddd',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                {labelContent}
              </button>
            )
          }) : (
            <div style={{ gridColumn: '1 / -1', maxWidth: '300px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Ketik jawaban di sini..."
                value={(answers[q.id] as any) || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value as any })}
                style={{ width: '100%', padding: '15px', fontSize: '20px', textAlign: 'center', borderRadius: '12px', border: '2px solid #3498db', outline: 'none' }}
              />
            </div>
          )}
        </div>


        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #eaeaea', paddingTop: '20px' }}>
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            style={{ 
              padding: '12px 25px', 
              fontSize: '16px', 
              background: currentIndex === 0 ? '#f1f1f1' : '#f8f9fa', 
              color: currentIndex === 0 ? '#aaa' : '#555', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            &larr; Sebelumnya
          </button>
          {currentIndex === questions.length - 1 ? (
            <button 
              onClick={async () => {
                alert('Ujian Selesai! Menyimpan jawaban...');
                try {
                  await fetch('/api/answers/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ testType: 'TIKI 1', answers })
                  });
                } catch(e) { console.error(e); }
                localStorage.setItem('test_completed_tiki1', 'true'); 
                window.location.href = '/testee/session';
              }}
              style={{ padding: '12px 24px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)' }}
            >
              Selesai & Kumpulkan
            </button>
          ) : (
            <button 
              onClick={handleNext}
              style={{ padding: '12px 24px', background: '#34495e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)' }}
            >
              Selanjutnya &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div style={{ flex: '1 1 300px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', alignSelf: 'flex-start' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '20px' }}>Daftar Soal</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
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
            Sudah Dijawab ({Object.keys(answers).filter(k => answers[parseInt(k)] !== '').length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '16px', height: '16px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', marginRight: '10px' }}></div>
            Belum Dijawab ({questions.length - Object.keys(answers).filter(k => answers[parseInt(k)] !== '').length})
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
