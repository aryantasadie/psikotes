'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OFFICIAL_KRAEPELIN_MATRIX, getOfficialKraepelinColumn } from '@/lib/kraepelinMatrix';

export interface KraepelinColumnDetail {
  columnIdx: number;
  dikerjakan: number;
  benar: number;
  salah: number;
  digits: number[];
  userAnswers: (number | null)[];
}

export interface KraepelinResultData {
  pankerRaw: number;
  tinkerRaw: number;
  jankerRaw: number;
  pankerNorm: number;
  tinkerNorm: number;
  jankerNorm: number;
  hankerNorm: number;
  columnScores: number[];
  perKolomDetails: KraepelinColumnDetail[];
}

export const getKraepelinPankerNorm = (raw: number): number => {
  if (raw >= 18) return 5;
  if (raw >= 14) return 4;
  if (raw >= 12) return 3;
  if (raw >= 8) return 2;
  return 1;
};

export const getKraepelinTinkerNorm = (rawError: number): number => {
  if (rawError <= 2) return 5;
  if (rawError <= 6) return 4;
  if (rawError <= 10) return 3;
  if (rawError <= 19) return 2;
  return 1;
};

export const getKraepelinJankerNorm = (rawRange: number): number => {
  if (rawRange <= 3) return 5;
  if (rawRange <= 7) return 4;
  if (rawRange <= 9) return 3;
  if (rawRange <= 14) return 2;
  return 1;
};

export default function KraepelinTest() {
  const router = useRouter();

  // Test Config Parameters
  const TOTAL_COLUMNS = 50;
  const COLUMN_DURATION = 15; // 15 seconds per column
  const DIGITS_PER_COLUMN = 28; // 28 digits per column (27 addition pairs)

  const [onboarding, setOnboarding] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // Live session states
  const [currentCol, setCurrentCol] = useState(0);
  const [currentPairIdx, setCurrentPairIdx] = useState(0); // 0 (bottom pair) to 26 (top pair)
  const [timeLeft, setTimeLeft] = useState(COLUMN_DURATION);
  const [showPindah, setShowPindah] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Matrix data
  const [matrix, setMatrix] = useState<number[][]>([]);
  // User answers matrix: userAnswers[col][pairIdx]
  const [userAnswers, setUserAnswers] = useState<(number | null)[][]>([]);

  // Refs for auto-scrolling
  const activeColRef = useRef<HTMLDivElement | null>(null);
  const activePairRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Web Audio Synth for feedback sounds
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number, durationSec: number, type: OscillatorType = 'sine') => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + durationSec);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + durationSec);
      }
    } catch (e) {}
  };

  // Load Official Printed Kraepelin Test Paper Matrix on mount
  useEffect(() => {
    const newMatrix: number[][] = [];
    const newAnswers: (number | null)[][] = [];

    for (let c = 0; c < TOTAL_COLUMNS; c++) {
      const colDigits = getOfficialKraepelinColumn(c);
      newMatrix.push([...colDigits]);
      newAnswers.push(new Array(colDigits.length - 1).fill(null));
    }

    setMatrix(newMatrix);
    setUserAnswers(newAnswers);
  }, []);

  // Column countdown timer tick
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          triggerPindah();
          return COLUMN_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testStarted, testFinished, currentCol]);

  // Center active column horizontally
  useEffect(() => {
    if (activeColRef.current) {
      activeColRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentCol, testStarted]);

  // Keep active pair in view vertically
  useEffect(() => {
    if (activePairRef.current) {
      activePairRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [currentPairIdx, currentCol, testStarted]);

  const triggerPindah = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    playTone(880, 0.25, 'triangle'); // Pindah tone
    setShowPindah(true);
    setTimeout(() => {
      setShowPindah(false);
      setIsTransitioning(false);
    }, 800);

    if (currentCol + 1 < TOTAL_COLUMNS) {
      setCurrentCol(prev => prev + 1);
      setCurrentPairIdx(0);
      setTimeLeft(COLUMN_DURATION);
    } else {
      finishTest();
    }
  };

  const handleInputDigit = (digit: number) => {
    if (!testStarted || testFinished || matrix.length === 0 || showPindah || isTransitioning) return;

    const colDigits = matrix[currentCol];
    if (!colDigits) return;

    // In Kraepelin matrix:
    // Index 0 = Bottom (Row 1), Index 1 = Row 2, etc.
    // currentPairIdx = 0 is pair between Index 0 and Index 1
    const d1 = colDigits[currentPairIdx];
    const d2 = colDigits[currentPairIdx + 1];
    const expectedSum = (d1 + d2) % 10;

    // Record user answer
    setUserAnswers(prev => {
      const copy = prev.map(c => [...c]);
      copy[currentCol][currentPairIdx] = digit;
      return copy;
    });

    if (digit === expectedSum) {
      playTone(600, 0.08, 'sine');
    } else {
      playTone(250, 0.12, 'sawtooth');
    }

    // Move to next pair in column (moving upwards)
    if (currentPairIdx + 1 < DIGITS_PER_COLUMN - 1) {
      setCurrentPairIdx(prev => prev + 1);
    } else {
      triggerPindah();
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!testStarted || testFinished || isTransitioning || showPindah) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleInputDigit(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testStarted, testFinished, currentCol, currentPairIdx, matrix, isTransitioning, showPindah]);

  const finishTest = async () => {
    setTestStarted(false);
    setTestFinished(true);

    try {
      // 1. Calculate Per-Column Details and Raw Scores
      const perKolomDetails: KraepelinColumnDetail[] = [];
      const columnScores: number[] = [];
      let totalBenar = 0;
      let totalSalah = 0;

      for (let c = 0; c < TOTAL_COLUMNS; c++) {
        const colDigits = matrix[c] || [];
        const answers = userAnswers[c] || [];

        let colDikerjakan = 0;
        let colBenar = 0;
        let colSalah = 0;

        for (let p = 0; p < answers.length; p++) {
          const ans = answers[p];
          if (ans !== null && ans !== undefined) {
            colDikerjakan++;
            const expectedSum = (colDigits[p] + colDigits[p + 1]) % 10;

            if (ans === expectedSum) {
              colBenar++;
            } else {
              colSalah++;
            }
          }
        }

        columnScores.push(colBenar);
        totalBenar += colBenar;
        totalSalah += colSalah;

        perKolomDetails.push({
          columnIdx: c,
          dikerjakan: colDikerjakan,
          benar: colBenar,
          salah: colSalah,
          digits: colDigits,
          userAnswers: answers
        });
      }

      // 2. Calculate PANKER, TINKER, JANKER, HANKER
      const pankerRaw = parseFloat((totalBenar / TOTAL_COLUMNS).toFixed(2));
      const tinkerRaw = totalSalah;
      const validScores = columnScores.filter(s => s > 0);
      const maxScore = validScores.length > 0 ? Math.max(...validScores) : 0;
      const minScore = validScores.length > 0 ? Math.min(...validScores) : 0;
      const jankerRaw = maxScore - minScore;

      const pankerNorm = getKraepelinPankerNorm(pankerRaw);
      const tinkerNorm = getKraepelinTinkerNorm(tinkerRaw);
      const jankerNorm = getKraepelinJankerNorm(jankerRaw);
      const hankerNorm = Math.round((pankerNorm + tinkerNorm + jankerNorm) / 3);

      const resultPayload: KraepelinResultData = {
        pankerRaw,
        tinkerRaw,
        jankerRaw,
        pankerNorm,
        tinkerNorm,
        jankerNorm,
        hankerNorm,
        columnScores,
        perKolomDetails
      };

      // 3. Save to backend
      await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'KRAEPELIN',
          answers: resultPayload
        })
      });

      localStorage.setItem('kraepelinResult', JSON.stringify(resultPayload));
      localStorage.setItem('test_completed_kraepelin', 'true');
      localStorage.setItem('test_completed_kreapelin', 'true');

      router.push('/testee/session');
    } catch (err) {
      console.error('Error submitting Kraepelin test:', err);
      localStorage.setItem('test_completed_kraepelin', 'true');
      localStorage.setItem('test_completed_kreapelin', 'true');
      router.push('/testee/session');
    }
  };

  if (onboarding) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '"Inter", system-ui, sans-serif' }}>
        <div style={{ maxWidth: '680px', width: '100%', background: '#FFFFFF', borderRadius: '24px', padding: '44px 36px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#EFF6FF', color: '#2563EB', borderRadius: '20px', display: 'grid', placeItems: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
            ⚡
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
            Tes Kraepelin (Kecepatan Kerja)
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
            Standar Resmi 50 Kolom (Buku Tes Kraepelin Psikologi)
          </p>

          <div style={{ background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', textAlign: 'left', marginBottom: '32px', lineHeight: '1.6' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>
              Petunjuk Pengerjaan:
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Jumlahkan 2 angka yang berdekatan dari <strong>BAWAH ke ATAS</strong>.</li>
              <li>Jika hasil penjumlahan &ge; 10, ketikkan <strong>ANGKA SATUANNYA SAJA</strong> (Contoh: 8 + 7 = 15 &rarr; ketik <strong>5</strong>, 9 + 9 = 18 &rarr; ketik <strong>8</strong>).</li>
              <li>Setiap kolom memiliki batas waktu <strong>15 detik</strong>.</li>
              <li>Ketika terdengar bunyi nada dan muncul peringatan <strong>PINDAH!</strong>, sistem akan otomatis beralih ke kolom berikutnya.</li>
              <li>Gunakan tombol angka <code>0</code> s.d. <code>9</code> pada keyboard laptop atau tombol keypad di layar.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              setOnboarding(false);
              setTestStarted(true);
            }}
            style={{
              width: '100%',
              padding: '16px 32px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(37,99,235,0.25)',
              transition: 'all 0.2s'
            }}
          >
            Mulai Tes Kraepelin
          </button>
        </div>
      </div>
    );
  }

  if (testFinished) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'grid', placeItems: 'center', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>Menyimpan Hasil Kraepelin...</h2>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Mohon tunggu sebentar, hasil sedang dikirim ke server.</p>
        </div>
      </div>
    );
  }

  // Row Indices from Top (27) to Bottom (0)
  // Display row 28 (top) at the top, down to row 1 (bottom) at the bottom
  const rowIndices = Array.from({ length: DIGITS_PER_COLUMN }, (_, i) => DIGITS_PER_COLUMN - 1 - i);

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', color: '#0F172A', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", system-ui, sans-serif', userSelect: 'none', overflow: 'hidden' }}>
      
      {/* Pindah Overlay Alert */}
      {showPindah && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(239,68,68,0.25)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'none' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#DC2626', textShadow: '0 4px 20px rgba(0,0,0,0.3)', letterSpacing: '3px', background: '#FFFFFF', padding: '16px 48px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            PINDAH!
          </div>
        </div>
      )}

      {/* Top Header / Status Bar */}
      <div style={{ padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Subtle pill indicator on top center/left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
          <div style={{ width: '120px', height: '6px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((currentCol + 1) / TOTAL_COLUMNS) * 100}%`, background: '#2563EB', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        {/* Right Info: Kolom Aktif & Sisa Waktu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KOLOM AKTIF</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>Kolom {currentCol + 1}</div>
          </div>
          
          <div style={{ width: '1px', height: '32px', background: '#E2E8F0' }}></div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SISA WAKTU KOLOM</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: timeLeft <= 4 ? '#EF4444' : '#0F172A' }}>
              {timeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card Container */}
      <div style={{ flex: 1, padding: '0 36px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div 
          ref={scrollContainerRef}
          style={{ 
            maxWidth: '1200px', 
            width: '100%', 
            background: '#FFFFFF', 
            borderRadius: '24px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
            border: '1px solid #E2E8F0', 
            padding: '20px 24px', 
            overflowX: 'auto', 
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 180px)',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {/* Multi-Column Display (Horizontal layout of all 50 columns) */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', margin: '0 auto', padding: '10px 30px' }}>
            {matrix.map((colDigits, colIdx) => {
              const isActiveCol = colIdx === currentCol;
              const isPastCol = colIdx < currentCol;
              const colAnswers = userAnswers[colIdx] || [];

              return (
                <div
                  key={colIdx}
                  ref={isActiveCol ? activeColRef : null}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '58px',
                    padding: '14px 10px',
                    borderRadius: '16px',
                    background: isActiveCol ? '#EFF6FF' : 'transparent',
                    border: isActiveCol ? '2px solid #3B82F6' : '2px solid transparent',
                    boxShadow: isActiveCol ? '0 4px 20px rgba(59, 130, 246, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    opacity: isActiveCol ? 1 : isPastCol ? 0.35 : 0.25
                  }}
                >
                  {/* Render from top row (index 27) down to bottom row (index 0) */}
                  {rowIndices.map((digitIdx) => {
                    const digitVal = colDigits[digitIdx];
                    // pairIdx for slot directly below digitIdx (pair between digitIdx and digitIdx - 1)
                    // Pair 0 is between digitIdx 0 and digitIdx 1
                    // So slot below digitIdx corresponds to pairIdx = digitIdx - 1
                    const pairIdxBelow = digitIdx - 1;
                    const hasSlotBelow = digitIdx > 0;
                    const isSlotActive = isActiveCol && pairIdxBelow === currentPairIdx;
                    const userAnsForSlot = colAnswers[pairIdxBelow];

                    return (
                      <React.Fragment key={digitIdx}>
                        {/* Number Digit */}
                        <div
                          style={{
                            fontSize: isActiveCol ? '22px' : '18px',
                            fontWeight: isActiveCol ? 900 : 600,
                            color: isActiveCol ? '#0F172A' : '#94A3B8',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none'
                          }}
                        >
                          {digitVal}
                        </div>

                        {/* Answer Slot Circle between this digit and the digit below it */}
                        {hasSlotBelow && (
                          <div
                            ref={isSlotActive ? activePairRef : null}
                            style={{
                              width: isSlotActive ? '30px' : '24px',
                              height: isSlotActive ? '30px' : '24px',
                              borderRadius: '50%',
                              margin: '2px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isSlotActive ? '15px' : '13px',
                              fontWeight: 900,
                              background: isSlotActive
                                ? '#2563EB'
                                : userAnsForSlot !== null && userAnsForSlot !== undefined
                                ? '#EFF6FF'
                                : '#F8FAFC',
                              color: isSlotActive
                                ? '#FFFFFF'
                                : userAnsForSlot !== null && userAnsForSlot !== undefined
                                ? '#2563EB'
                                : '#CBD5E1',
                              border: isSlotActive
                                ? '2px solid #1D4ED8'
                                : userAnsForSlot !== null && userAnsForSlot !== undefined
                                ? '1.5px solid #93C5FD'
                                : '1px solid #E2E8F0',
                              boxShadow: isSlotActive ? '0 0 14px rgba(37, 99, 235, 0.55)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {userAnsForSlot !== null && userAnsForSlot !== undefined
                              ? userAnsForSlot
                              : '?'}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Keypad Bar */}
      <div style={{ padding: '0 0 20px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0',
            padding: '10px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
            <button
              key={digit}
              type="button"
              disabled={isTransitioning || showPindah}
              onClick={() => handleInputDigit(digit)}
              style={{
                width: '50px',
                height: '46px',
                background: isTransitioning || showPindah ? '#F1F5F9' : '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 800,
                color: isTransitioning || showPindah ? '#94A3B8' : '#0F172A',
                cursor: isTransitioning || showPindah ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onMouseOver={(e) => {
                if (!isTransitioning && !showPindah) {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.color = '#2563EB';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!isTransitioning && !showPindah) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#0F172A';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {digit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
