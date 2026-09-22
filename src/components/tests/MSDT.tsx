'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestTimer from './TestTimer';
import UnansweredModal from './UnansweredModal';

type Question = {
  id: string;
  number: number;
  content: string;
  options: string[];
  is_image: boolean;
};

export default function MSDT() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  const [unansweredList, setUnansweredList] = useState<number[]>([]);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const router = useRouter();

  const DURATION_SECONDS = 20 * 60;
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('test_timer_left_msdt');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= DURATION_SECONDS) {
          return parsed;
        }
      }
    }
    return DURATION_SECONDS;
  });

  useEffect(() => {
    // Restore draft answers if available
    if (typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem('test_draft_answers_msdt');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setAnswers(parsed);
            setShowInstruction(false);
          }
        }
      } catch (e) {}
    }

    fetch('/api/questions?testType=MSDT')
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
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: optionIndex === 0 ? 'A' : 'B'
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('test_draft_answers_msdt', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    const unansweredNums: number[] = [];
    questions.forEach((q, idx) => {
      if (!answers[q.id]) {
        unansweredNums.push(idx + 1);
      }
    });
    
    if (unansweredNums.length > 0) {
      setUnansweredList(unansweredNums);
      setShowUnansweredModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/score/msdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetch('/api/answers/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testType: 'MSDT', answers }) });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('test_draft_answers_msdt');
          localStorage.removeItem('test_timer_left_msdt');
          localStorage.setItem('msdtResult', JSON.stringify(data));
          localStorage.setItem('test_completed_msdt', 'true');
        }
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

  useEffect(() => {
    if (showInstruction) return;

    if (timeLeft <= 0) {
      const unansweredNums: number[] = [];
      questions.forEach((q, idx) => {
        if (!answers[q.id]) {
          unansweredNums.push(idx + 1);
        }
      });
      if (unansweredNums.length > 0) {
        setTimeLeft(300); // Tambah +5 menit
        if (typeof window !== 'undefined') {
          localStorage.setItem('test_timer_left_msdt', '300');
        }
        setUnansweredList(unansweredNums);
        setShowUnansweredModal(true);
      } else {
        handleSubmit();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (typeof window !== 'undefined') {
          if (next > 0) localStorage.setItem('test_timer_left_msdt', String(next));
          else localStorage.removeItem('test_timer_left_msdt');
        }
        if (next <= 0) {
          clearInterval(interval);
          const unansweredNums: number[] = [];
          questions.forEach((q, idx) => {
            if (!answers[q.id]) unansweredNums.push(idx + 1);
          });
          if (unansweredNums.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('test_timer_left_msdt', '300');
            }
            setUnansweredList(unansweredNums);
            setShowUnansweredModal(true);
            return 300; // Tambah +5 menit
          } else {
            handleSubmit();
            return 0;
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showInstruction, timeLeft, questions, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToQuestion = (num: number) => {
    const el = document.getElementById(`question-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Memuat soal MSDT...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Tidak ada soal MSDT yang tersedia.</div>;

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>Management Style Diagnosis Test (MSDT)</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Instruksi Pelaksanaan:</strong></p>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Tes ini terdiri dari <strong>64 pasang pernyataan</strong>.</li>
              <li>Tentukan pernyataan mana yang <strong>paling menggambarkan</strong> apa yang biasanya Anda lakukan dalam pekerjaan sehari-hari.</li>
              <li>Mungkin ada pernyataan yang membingungkan atau terasa cocok dua-duanya/tidak ada yang cocok sama sekali. Anda tetap diminta menentukan <strong>satu pilihan (A atau B)</strong> secara instingtif.</li>
              <li>Waktu pengerjaan <strong>20 menit</strong> (Wajib menyelesaikan seluruh 64 soal).</li>
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

  return (
    <div style={{ padding: '40px 20px 160px 20px', fontFamily: '"Inter", sans-serif', background: '#f0f2f5', minHeight: '100vh', position: 'relative' }}>

      {/* In-App Unanswered Modal */}
      <UnansweredModal
        isOpen={showUnansweredModal}
        unansweredList={unansweredList}
        testTitle="MSDT"
        onSelectQuestion={scrollToQuestion}
        onClose={() => setShowUnansweredModal(false)}
      />

      {/* Floating Fixed Timer (Top-Left, No Emoji) */}
      <div 
        style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '20px', 
          zIndex: 1000, 
          background: timeLeft <= 180 ? '#fef2f2' : '#ffffff', 
          border: `2px solid ${timeLeft <= 180 ? '#ef4444' : '#3b82f6'}`, 
          padding: '10px 18px', 
          borderRadius: '12px', 
          color: timeLeft <= 180 ? '#dc2626' : '#1d4ed8', 
          fontWeight: 800, 
          fontSize: '15px', 
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>Sisa Waktu:</span>
        <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 900 }}>{formatTime(timeLeft)}</span>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 30px', background: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
            MSDT (64 Soal)
          </div>
        </div>

        {/* Questions List */}
        <div style={{ padding: '40px' }}>
          {questions.map((q, qIndex) => (
            <div id={`question-${q.number}`} key={q.id} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: qIndex === questions.length - 1 ? 'none' : '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ background: '#2c3e50', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
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
                        name={`msdt_${q.id}`} 
                        checked={isSelected}
                        onChange={() => handleSelect(q.id, idx)}
                        style={{ transform: 'scale(1.3)', cursor: 'pointer', accentColor: '#3182ce', marginRight: '20px' }}
                      />
                      <div style={{ fontSize: '16px', color: '#2d3748', lineHeight: '1.5', fontWeight: isSelected ? '600' : 'normal' }}>
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
              type="button"
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
              {submitting ? 'Menyimpan...' : 'Kumpulkan Jawaban'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
