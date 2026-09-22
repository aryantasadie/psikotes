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

export default function DISC() {
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
      const saved = localStorage.getItem('test_timer_left_disc');
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
        const draft = localStorage.getItem('test_draft_answers_disc');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setAnswers(parsed);
            setShowInstruction(false);
          }
        }
      } catch (e) {}
    }

    fetch('/api/questions?testType=DISC')
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

  const handleSelect = (questionId: string, type: 'most' | 'least', optionPrefix: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      const currentMost = newAnswers[`${questionId}_most`];
      const currentLeast = newAnswers[`${questionId}_least`];

      if (type === 'most') {
        if (currentLeast === optionPrefix) {
          delete newAnswers[`${questionId}_least`];
        }
        newAnswers[`${questionId}_most`] = optionPrefix;
      } else {
        if (currentMost === optionPrefix) {
          delete newAnswers[`${questionId}_most`];
        }
        newAnswers[`${questionId}_least`] = optionPrefix;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('test_draft_answers_disc', JSON.stringify(newAnswers));
      }
      return newAnswers;
    });
  };

  const calculateProgress = () => {
    let answered = 0;
    questions.forEach(q => {
      if (answers[`${q.id}_most`] && answers[`${q.id}_least`]) {
        answered++;
      }
    });
    return Math.round((answered / (questions.length || 1)) * 100);
  };

  const handleSubmit = async () => {
    const unansweredNums: number[] = [];
    questions.forEach((q, idx) => {
      if (!answers[`${q.id}_most`] || !answers[`${q.id}_least`]) {
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
      const res = await fetch('/api/score/disc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetch('/api/answers/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testType: 'DISC', answers }) });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('test_draft_answers_disc');
          localStorage.removeItem('test_timer_left_disc');
          localStorage.setItem('discResult', JSON.stringify(data.scores));
          localStorage.setItem('test_completed_disc', 'true');
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
        if (!answers[`${q.id}_most`] || !answers[`${q.id}_least`]) {
          unansweredNums.push(idx + 1);
        }
      });
      if (unansweredNums.length > 0) {
        setTimeLeft(300); // Tambah +5 menit
        if (typeof window !== 'undefined') {
          localStorage.setItem('test_timer_left_disc', '300');
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
          if (next > 0) localStorage.setItem('test_timer_left_disc', String(next));
          else localStorage.removeItem('test_timer_left_disc');
        }
        if (next <= 0) {
          clearInterval(interval);
          const unansweredNums: number[] = [];
          questions.forEach((q, idx) => {
            if (!answers[`${q.id}_most`] || !answers[`${q.id}_least`]) unansweredNums.push(idx + 1);
          });
          if (unansweredNums.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('test_timer_left_disc', '300');
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

  const progress = calculateProgress();

  const scrollToQuestion = (num: number) => {
    const el = document.getElementById(`question-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Memuat soal DISC...</div>;
  if (questions.length === 0) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Tidak ada soal DISC yang tersedia.</div>;

  if (showInstruction) {
    return (
      <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}>DISC - Personality Profile</h2>
          <div style={{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Pengisian :</strong></p>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Test ini terdiri dari 24 Soal</li>
              <li>Setiap soal terdiri dari dua bagian. Bagian MOST ( Cenderung paling sesuai dengan diri ) dan LEAST ( cenderung paling tidak sesuai )</li>
              <li>Pilih SATU JAWABAN pada masing masing MOST &amp; LEAST</li>
              <li>Jawaban Most dan Least pada setiap no TIDAK BOLEH SAMA.</li>
              <li>Waktu pengerjaan 15 menit (Wajib menyelesaikan seluruh soal)</li>
              <li>Satu account hanya untuk satu kali kesempatan pengisian</li>
            </ol>
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

      {/* In-App Unanswered Modal */}
      <UnansweredModal
        isOpen={showUnansweredModal}
        unansweredList={unansweredList}
        testTitle="DISC"
        onSelectQuestion={scrollToQuestion}
        onClose={() => setShowUnansweredModal(false)}
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 30px', background: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
            DISC Profile (24 Soal)
          </div>
        </div>
        
        {/* Questions List */}
        <div style={{ padding: '40px' }}>
          {questions.map((q, qIndex) => (
            <div id={`question-${q.number}`} key={q.id} style={{ marginBottom: '50px', paddingBottom: '40px', borderBottom: qIndex === questions.length - 1 ? 'none' : '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ background: '#2c3e50', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  Soal No. {q.number}
                </div>
              </div>

              {/* Options Table */}
              <div style={{ background: '#f7fafc', borderRadius: '12px', overflow: 'hidden', border: '2px solid #cbd5e0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#edf2f7' }}>
                      <th style={{ padding: '15px 10px', width: '15%', textAlign: 'center', fontSize: '14px', color: '#4a5568', fontWeight: '700', borderRight: '2px solid #cbd5e0', borderBottom: '2px solid #cbd5e0' }}>
                        MOST (M)<br/><span style={{ fontSize: '12px', fontWeight: 'normal' }}>Paling Sesuai</span>
                      </th>
                      <th style={{ padding: '15px 10px', width: '15%', textAlign: 'center', fontSize: '14px', color: '#4a5568', fontWeight: '700', borderRight: '2px solid #cbd5e0', borderBottom: '2px solid #cbd5e0' }}>
                        LEAST (L)<br/><span style={{ fontSize: '12px', fontWeight: 'normal' }}>Paling Tidak Sesuai</span>
                      </th>
                      <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '14px', color: '#4a5568', fontWeight: '700', borderBottom: '2px solid #cbd5e0' }}>
                        Pernyataan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.options.map((opt, idx) => {
                      // Extract prefix (A, B, C, D)
                      const prefix = opt.charAt(0);
                      const isMost = answers[`${q.id}_most`] === prefix;
                      const isLeast = answers[`${q.id}_least`] === prefix;

                      return (
                        <tr key={idx} style={{ borderBottom: '2px solid #cbd5e0', background: isMost ? '#ebf8ff' : isLeast ? '#fff5f5' : 'white', transition: 'background 0.2s' }}>
                          <td style={{ padding: '15px 10px', textAlign: 'center', borderRight: '2px solid #cbd5e0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%' }}>
                              <input 
                                type="radio" 
                                name={`most_${q.id}`} 
                                checked={isMost}
                                onChange={() => handleSelect(q.id, 'most', prefix)}
                                style={{ transform: 'scale(1.5)', cursor: 'pointer', accentColor: '#3182ce' }}
                              />
                            </label>
                          </td>
                          <td style={{ padding: '15px 10px', textAlign: 'center', borderRight: '2px solid #cbd5e0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%' }}>
                              <input 
                                type="radio" 
                                name={`least_${q.id}`} 
                                checked={isLeast}
                                onChange={() => handleSelect(q.id, 'least', prefix)}
                                style={{ transform: 'scale(1.5)', cursor: 'pointer', accentColor: '#e53e3e' }}
                              />
                            </label>
                          </td>
                          <td style={{ padding: '15px 20px', fontSize: '16px', color: '#2d3748', lineHeight: '1.5', fontWeight: '500' }}>
                            {opt.replace(/^[A-D]\.\s*/i, '')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ))}

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
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
              {submitting ? 'Mengirim...' : 'Kumpulkan Jawaban'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
