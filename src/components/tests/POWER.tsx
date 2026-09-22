'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UnansweredModal from './UnansweredModal';

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
  const [unansweredList, setUnansweredList] = useState<number[]>([]);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const router = useRouter();

  const DURATION_SECONDS = 15 * 60; // 15 menit di awal
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('test_timer_left_power') || localStorage.getItem('test_timer_left_powerleader');
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
    if (typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem('test_draft_answers_power');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setAnswers(parsed);
            setShowInstruction(false);
          }
        }
      } catch (e) {}
    }

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
    const val = optionIndex === 0 ? 'A' : 'B';
    const updated = {
      ...answers,
      [questionId]: val
    };
    setAnswers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_draft_answers_power', JSON.stringify(updated));
    }
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
      const res = await fetch('/api/score/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('powerResult', JSON.stringify(data));
          localStorage.removeItem('test_draft_answers_power');
          localStorage.removeItem('test_timer_left_power');
          localStorage.removeItem('test_timer_left_powerleader');
          localStorage.setItem('test_completed_power', 'true');
          localStorage.setItem('test_completed_powerleader', 'true');
        }
        await fetch('/api/answers/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testType: 'POWER LEADER', answers }) });
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
          localStorage.setItem('test_timer_left_power', '300');
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
          if (next > 0) localStorage.setItem('test_timer_left_power', String(next));
          else localStorage.removeItem('test_timer_left_power');
        }
        if (next <= 0) {
          clearInterval(interval);
          const unansweredNums: number[] = [];
          questions.forEach((q, idx) => {
            if (!answers[q.id]) unansweredNums.push(idx + 1);
          });
          if (unansweredNums.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('test_timer_left_power', '300');
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
              <li>Waktu pengerjaan <strong>15 menit</strong> (Wajib menyelesaikan seluruh soal).</li>
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
    <div style={{ padding: '40px 20px 160px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F8FAFC', minHeight: '100vh', position: 'relative' }}>

      {/* Floating Fixed Timer (Top-Left, No Emoji) */}
      <div 
        style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '20px', 
          zIndex: 1000, 
          background: timeLeft <= 180 ? '#fef2f2' : '#ffffff', 
          border: `2px solid ${timeLeft <= 180 ? '#ef4444' : '#0d9488'}`, 
          padding: '10px 18px', 
          borderRadius: '12px', 
          color: timeLeft <= 180 ? '#dc2626' : '#0d9488', 
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

      {/* In-App Unanswered Modal */}
      <UnansweredModal
        isOpen={showUnansweredModal}
        unansweredList={unansweredList}
        testTitle="POWER LEADER"
        onSelectQuestion={scrollToQuestion}
        onClose={() => setShowUnansweredModal(false)}
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 30px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
            POWER LEADER (50 Soal)
          </div>
        </div>
        
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
