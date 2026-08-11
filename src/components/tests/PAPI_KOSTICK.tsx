'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  number: number;
  content: string;
  options: string[];
  is_image: boolean;
};

export default function PAPI() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/questions?testType=PAPI_KOSTICK')
      .then(res => res.json())
      .then(data => {
        if (data.questions) {
          const qs = data.questions.sort((a: Question, b: Question) => Number(a.id) - Number(b.id));
          const mappedQs = qs.map((q: any, i: number) => ({ ...q, number: i + 1 }));
          setQuestions(mappedQs);
        } else {
          setQuestions([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching questions:", err);
        setLoading(false);
      });
  }, []);

  const handleSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex === 0 ? 'A' : 'B'
    }));
  };

  const calculateProgress = () => {
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / (questions.length || 1)) * 100);
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    
    // COMMENTED OUT FOR TESTING
    // if (unanswered.length > 0) {
    //   alert(`Harap selesaikan semua soal! Terdapat ${unanswered.length} soal yang belum terisi.`);
    //   return;
    // }

    setSubmitting(true);
    try {
      await fetch('/api/answers/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testType: 'PAPI_KOSTICK', answers }) });
      const res = await fetch('/api/score/papi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('papiResult', JSON.stringify(data.scores));
        localStorage.setItem('test_completed_papi', 'true');
        localStorage.setItem('test_completed_papikostick', 'true');
        router.push('/testee/session');
      } else {
        console.error("Gagal mengirim jawaban.");
      }
    } catch (e) {
      console.error(e);
      console.error("Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Memuat soal PAPI Kostick...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Tidak ada soal PAPI Kostick yang tersedia.</div>;

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>PAPI Kostick Test</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Instruksi Pengerjaan:</strong></p>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Tes ini terdiri dari <strong>90 pasang pernyataan</strong>.</li>
              <li>Pilihlah salah satu dari dua pernyataan (A atau B) yang <strong>paling menggambarkan diri Anda</strong>.</li>
              <li>Terkadang, Anda mungkin merasa kedua pernyataan sangat cocok dengan Anda, atau sebaliknya, tidak ada yang cocok sama sekali. Anda tetap diwajibkan untuk memilih salah satu yang <em>relatif lebih mendekati</em>.</li>
              <li>Tidak ada jawaban benar atau salah dalam tes ini. Jawablah secara spontan dan jujur.</li>
            </ul>
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

  const progress = calculateProgress();

  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Inter", sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Progress */}
        <div style={{ padding: '30px 40px', background: '#fff', borderBottom: '1px solid #edf2f7', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4a5568' }}>Tingkat Penyelesaian</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3182ce' }}>{progress}% ({Object.keys(answers).length}/90)</div>
          </div>
          <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to right, #4299e1, #3182ce)', width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ padding: '40px' }}>
          {questions.map((q, qIndex) => (
            <div key={q.id} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: qIndex === questions.length - 1 ? 'none' : '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ background: '#2c3e50', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  No. {q.number}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {q.options.map((opt, idx) => {
                  const letter = idx === 0 ? 'A' : 'B';
                  const isSelected = answers[q.id] === letter;
                  
                  return (
                    <label 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '18px 25px', 
                        background: isSelected ? '#ebf8ff' : '#f8fbff', 
                        border: isSelected ? '2px solid #3182ce' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px rgba(49, 130, 206, 0.15)' : 'none'
                      }}
                    >
                      <input 
                        type="radio" 
                        name={`papi_${q.id}`} 
                        checked={isSelected}
                        onChange={() => handleSelect(q.id, idx)}
                        style={{ transform: 'scale(1.3)', cursor: 'pointer', accentColor: '#3182ce', marginRight: '20px' }}
                      />
                      <div style={{ fontSize: '16px', color: '#2d3748', lineHeight: '1.5', fontWeight: isSelected ? '600' : 'normal' }}>
                        <strong style={{ marginRight: '10px', color: isSelected ? '#3182ce' : '#718096' }}>{letter}.</strong>
                        {opt}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '20px 60px',
                fontSize: '20px',
                background: submitting ? '#a0aec0' : 'linear-gradient(135deg, #48bb78, #38a169)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 10px 25px rgba(72, 187, 120, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {submitting ? 'Menyimpan...' : 'Submit'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
