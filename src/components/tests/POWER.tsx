'use client';
import React, { useState, useEffect } from 'react';

type Question = {
  id: string;
  number: number;
  content: string;
  options: string[];
  is_image: boolean;
};

export default function POWER() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  useEffect(() => {
    fetch('/api/questions?testType=POWER')
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

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    
    if (unanswered.length > 0) {
            return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/score/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('powerResult', JSON.stringify(data));
        await fetch('/api/answers/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testType: 'POWER LEADER', answers }) });
        localStorage.setItem('test_completed_power', 'true');
        localStorage.setItem('test_completed_powerleader', 'true');
        window.location.href = '/testee/session';
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

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0D9488' }}>Memuat soal POWER LEADER...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#64748B' }}>Tidak ada soal POWER LEADER yang tersedia.</div>;

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '45px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0F172A', marginBottom: '20px', fontWeight: '800' }}>POWER LEADER Test</h2>
          <div style={{ textAlign: 'left', background: '#F0FDFA', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #0D9488', marginBottom: '35px', lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Instruksi Pelaksanaan:</strong></p>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Tes ini terdiri dari <strong>50 pasang pernyataan</strong>.</li>
              <li>Pilihlah salah satu jawaban yang menggambarkan <strong>karakteristik atau kesesuaian dengan diri Anda</strong> dalam mengambil sebuah keputusan.</li>
              <li>Berikan jawaban secara spontan, A atau B.</li>
            </ul>
          </div>
          <button 
            onClick={() => setShowInstruction(false)}
            style={{ padding: '16px 45px', fontSize: '16px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#0F766E'}
            onMouseOut={(e) => e.currentTarget.style.background = '#0D9488'}
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        
        <div style={{ padding: '40px' }}>
          {questions.map((q, qIndex) => (
            <div key={q.id} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: qIndex === questions.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ background: '#0F172A', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '15px' }}>
                  Soal No. {q.number}
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
                        background: isSelected ? '#F0FDFA' : '#F8FAFC', 
                        border: isSelected ? '2px solid #0D9488' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="radio" 
                        name={`power_${q.id}`} 
                        checked={isSelected}
                        onChange={() => handleSelect(q.id, idx)}
                        style={{ transform: 'scale(1.3)', cursor: 'pointer', accentColor: '#0D9488', marginRight: '20px' }}
                      />
                      <div style={{ fontSize: '15px', color: '#0F172A', lineHeight: '1.5', fontWeight: 'normal' }}>
                        {opt}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '16px 50px',
                fontSize: '16px',
                background: submitting ? '#94A3B8' : '#0D9488',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => { if(!submitting) e.currentTarget.style.background = '#0F766E' }}
              onMouseOut={(e) => { if(!submitting) e.currentTarget.style.background = '#0D9488' }}
            >
              {submitting ? 'Menyimpan...' : 'Kumpulkan Jawaban'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
