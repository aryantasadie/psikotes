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
  const DIGITS_PER_COLUMN = 28; // 28 digits per column (27 addition pairs per official printed test paper)

  const [onboarding, setOnboarding] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // Live session states
  const [currentCol, setCurrentCol] = useState(0);
  const [currentPairIdx, setCurrentPairIdx] = useState(0); // 0 to DIGITS_PER_COLUMN - 2
  const [timeLeft, setTimeLeft] = useState(COLUMN_DURATION);
  const [showPindah, setShowPindah] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Matrix data: 20 columns, each has array of random digits [0..9]
  const [matrix, setMatrix] = useState<number[][]>([]);
  // User answers matrix: userAnswers[colIdx][pairIdx] = user input digit or null
  const [userAnswers, setUserAnswers] = useState<(number | null)[][]>([]);

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
    // In Kraepelin, addition is from BOTTOM to TOP:
    // pairIdx 0 adds digit at (DIGITS_PER_COLUMN - 1) and (DIGITS_PER_COLUMN - 2)
    const idxBottom = DIGITS_PER_COLUMN - 1 - currentPairIdx;
    const idxTop = idxBottom - 1;

    if (idxTop < 0) return;

    const d1 = colDigits[idxBottom];
    const d2 = colDigits[idxTop];
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

    // Move to next pair in column
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
    setSubmitting(true);

    // Compute detailed column scores & raw norms
    const columnScores: number[] = [];
    const perKolomDetails: KraepelinColumnDetail[] = [];

    for (let c = 0; c < TOTAL_COLUMNS; c++) {
      const colDigits = matrix[c] || [];
      const colAns = userAnswers[c] || [];
      let dikerjakan = 0;
      let benar = 0;
      let salah = 0;

      for (let p = 0; p < DIGITS_PER_COLUMN - 1; p++) {
        const uAns = colAns[p];
        if (uAns !== null && uAns !== undefined) {
          dikerjakan++;
          const idxBottom = DIGITS_PER_COLUMN - 1 - p;
          const idxTop = idxBottom - 1;
          const d1 = colDigits[idxBottom];
          const d2 = colDigits[idxTop];
          const expected = (d1 + d2) % 10;

          if (uAns === expected) {
            benar++;
          } else {
            salah++;
          }
        }
      }

      columnScores.push(dikerjakan);
      perKolomDetails.push({
        columnIdx: c + 1,
        dikerjakan,
        benar,
        salah,
        digits: colDigits,
        userAnswers: colAns
      });
    }

    // Calculate PANKER
    const sortedScores = [...columnScores].sort((a, b) => a - b);
    const midIdx = Math.floor(sortedScores.length / 2);
    const medianX = sortedScores.length % 2 !== 0
      ? sortedScores[midIdx]
      : Math.round((sortedScores[midIdx - 1] + sortedScores[midIdx]) / 2);

    let B = 0;
    let C = 0;
    for (let c = 0; c < TOTAL_COLUMNS; c++) {
      const s = columnScores[c];
      if (s > medianX) B += (s - medianX);
      else if (s < medianX) C += (medianX - s);
    }

    const pankerRaw = medianX > 0 ? (((medianX - 1) * 50 + (B - C)) / 50) : 0;

    // Calculate TINKER (total wrong answers)
    const tinkerRaw = perKolomDetails.reduce((sum, k) => sum + k.salah, 0);

    // Calculate JANKER (max - min)
    const maxScore = Math.max(...columnScores);
    const minScore = Math.min(...columnScores);
    const jankerRaw = maxScore - minScore;

    // Calculate Norms
    const pankerNorm = getKraepelinPankerNorm(pankerRaw);
    const tinkerNorm = getKraepelinTinkerNorm(tinkerRaw);
    const jankerNorm = getKraepelinJankerNorm(jankerRaw);
    const hankerNorm = Math.floor((pankerNorm + jankerNorm) / 2);

    const resultData: KraepelinResultData = {
      pankerRaw: parseFloat(pankerRaw.toFixed(1)),
      tinkerRaw,
      jankerRaw,
      pankerNorm,
      tinkerNorm,
      jankerNorm,
      hankerNorm,
      columnScores,
      perKolomDetails
    };

    try {
      localStorage.setItem('kraepelinResult', JSON.stringify(resultData));
      localStorage.setItem('test_completed_kraepelin', 'true');
      localStorage.setItem('test_completed_kreapelin', 'true');

      // Submit to backend API
      await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'KRAEPELIN',
          answers: resultData
        })
      });
    } catch (e) {
      console.error('Error submitting Kraepelin result:', e);
    } finally {
      setSubmitting(false);
      router.push('/testee/session');
    }
  };

  const handleStartTestClick = () => {
    setOnboarding(false);
    setTestStarted(true);
    setCurrentCol(0);
    setCurrentPairIdx(0);
    setTimeLeft(COLUMN_DURATION);
  };

  // Render Onboarding / Instruction Screen
  if (onboarding) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2A55', color: '#FFFFFF', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '600px', width: '100%', background: '#123B72', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ color: '#FBBF24', fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
            📊 PETUNJUK TES KRAEPELIN / KREAPELIN
          </div>
          <p style={{ color: '#93C5FD', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Anda akan diberikan deretan angka secara vertikal. Tugas Anda adalah menjumlahkan 2 angka yang berdekatan dari <strong>BAWAH ke ATAS</strong>. Tuliskan <strong>angka satuannya saja</strong> dari hasil penjumlahan.
          </p>

          {/* Visual Example Box */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', marginBottom: '12px' }}>
              Contoh Cara Penjumlahan:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
              <div style={{ background: '#0D1E3D', border: '1px solid #3B82F6', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFF' }}>4</div>
                <div style={{ color: '#34D399', fontSize: '12px', fontWeight: 700, margin: '4px 0' }}>↑ Jawab 3 (9+4=13)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFF' }}>9</div>
                <div style={{ color: '#34D399', fontSize: '12px', fontWeight: 700, margin: '4px 0' }}>↑ Jawab 5 (6+9=15)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFF' }}>6</div>
              </div>
              <div style={{ textAlign: 'left', fontSize: '13px', color: '#E2E8F0', lineHeight: '1.6' }}>
                <div><strong>1. Penjumlahan Pertama:</strong></div>
                <div style={{ color: '#34D399', fontWeight: 700 }}>6 + 9 = 15 → Ketik 5</div>
                <div style={{ marginTop: '8px' }}><strong>2. Penjumlahan Kedua:</strong></div>
                <div style={{ color: '#34D399', fontWeight: 700 }}>9 + 4 = 13 → Ketik 3</div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Jumlah Kolom</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{TOTAL_COLUMNS} Kolom</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Waktu / Kolom</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{COLUMN_DURATION} Detik</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Total Waktu</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>5 Menit</div>
            </div>
          </div>

          <button
            onClick={handleStartTestClick}
            style={{ width: '100%', padding: '16px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.4)', transition: 'all 0.2s' }}
          >
            ▶ MULAI TES KRAEPELIN SEKARANG
          </button>
        </div>
      </div>
    );
  }

  if (testFinished) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2A55', color: '#FFF', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2>Mengirim & Menyimpan Hasil Kraepelin...</h2>
          <p style={{ color: '#94A3B8' }}>Mohon tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  // Active Test Screen UI
  const currentDigits = matrix[currentCol] || [];
  const currentColAnswers = userAnswers[currentCol] || [];

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8FF', color: '#1E293B', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif', userSelect: 'none', overflow: 'hidden' }}>
      
      {/* Pindah Overlay Alert */}
      {showPindah && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(185,28,28,0.3)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' }}>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: '#DC2626', textShadow: '0 4px 20px rgba(0,0,0,0.5)', letterSpacing: '2px' }}>
            PINDAH!
          </div>
        </div>
      )}

      {/* Top Header / Progress Bar */}
      <div style={{ background: '#0A2A55', color: '#FFF', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase' }}>KOLOM AKTIF</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24' }}>Kolom {currentCol + 1} / {TOTAL_COLUMNS}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase' }}>SISA WAKTU KOLOM</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: timeLeft <= 4 ? '#EF4444' : '#60A5FA' }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Progress Bar Visual Line */}
      <div style={{ height: '6px', background: '#E2E8F0', width: '100%' }}>
        <div style={{ height: '100%', width: `${(timeLeft / COLUMN_DURATION) * 100}%`, background: timeLeft <= 4 ? '#EF4444' : '#2563EB', transition: 'width 1s linear' }} />
      </div>

      {/* Main Workspace: Kraepelin Column Grid Display */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#F1F5F9', overflow: 'hidden' }}>
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #CBD5E1', padding: '24px 40px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '320px' }}>
          
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '16px', textTransform: 'uppercase' }}>
            Arah Penjumlahan: Bawah ke Atas (Ketik Angka Satuan)
          </div>

          {/* Render Active Vertical Digit Column (Showing 7 digits window around focus) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {(() => {
              // Current pair focus indexes
              const idxBottom = DIGITS_PER_COLUMN - 1 - currentPairIdx;
              const idxTop = idxBottom - 1;

              // Render digits around active pair
              const visibleIndices: number[] = [];
              for (let i = idxTop - 2; i <= idxBottom + 2; i++) {
                if (i >= 0 && i < DIGITS_PER_COLUMN) {
                  visibleIndices.push(i);
                }
              }

              return visibleIndices.map(digitIdx => {
                const digitVal = currentDigits[digitIdx];
                const isTopActive = digitIdx === idxTop;
                const isBottomActive = digitIdx === idxBottom;
                const isActivePair = isTopActive || isBottomActive;

                // Answer associated with pair starting from digitIdx (if digitIdx is top of pair)
                const pairIndexForThisDigit = DIGITS_PER_COLUMN - 1 - digitIdx - 1;
                const userAns = currentColAnswers[pairIndexForThisDigit];

                return (
                  <React.Fragment key={digitIdx}>
                    <div style={{
                      width: '64px',
                      height: '54px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 800,
                      background: isActivePair ? '#DBEAFE' : '#F8FAFC',
                      color: isActivePair ? '#1D4ED8' : '#64748B',
                      border: isActivePair ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      boxShadow: isActivePair ? '0 0 12px rgba(37,99,235,0.3)' : 'none',
                      transition: 'all 0.15s'
                    }}>
                      {digitVal}
                    </div>

                    {/* Display input slot indicator between top and bottom active numbers */}
                    {isTopActive && (
                      <div style={{
                        background: '#2563EB',
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 800,
                        animation: 'pulse 1s infinite'
                      }}>
                        {userAns !== null && userAns !== undefined ? userAns : '?'}
                      </div>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* On-Screen Keypad for Touch / Click Support */}
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '400px', width: '100%' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
            <button
              key={digit}
              type="button"
              disabled={isTransitioning || showPindah}
              onClick={() => handleInputDigit(digit)}
              style={{
                height: '52px',
                background: isTransitioning || showPindah ? '#E2E8F0' : '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 800,
                color: isTransitioning || showPindah ? '#94A3B8' : '#0F172A',
                cursor: isTransitioning || showPindah ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.1s'
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
