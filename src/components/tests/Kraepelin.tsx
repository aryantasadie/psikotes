'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OFFICIAL_KRAEPELIN_MATRIX, getOfficialKraepelinColumn } from '@/lib/kraepelinMatrix';
import { 
  calculateKraepelinFullAnalysis, 
  getPankerNorm, 
  getTinkerNorm, 
  getJankerNorm, 
  getHankerNorm,
  KraepelinColumnDetail, 
  KraepelinAnalysisResult 
} from '@/lib/kraepelinScoring';

export type { KraepelinColumnDetail, KraepelinAnalysisResult };
export const getKraepelinPankerNorm = (raw: number) => getPankerNorm(raw).scale1to5;
export const getKraepelinTinkerNorm = (rawError: number) => getTinkerNorm(rawError).scale1to5;
export const getKraepelinJankerNorm = (rawRange: number) => getJankerNorm(rawRange).scale1to5;

/* ─── Practice Matrix Constants (5 Columns for Uji Coba) ─── */
const PRACTICE_TOTAL_COLUMNS = 5;
const PRACTICE_MATRIX: number[][] = [
  [3, 8, 4, 7, 2, 9, 5, 1, 6, 8, 3, 7, 4, 9, 2, 6, 5, 8, 1, 7, 4, 9, 3, 8, 5, 2, 7, 6],
  [6, 2, 9, 5, 8, 3, 7, 4, 1, 9, 5, 8, 2, 6, 4, 7, 3, 9, 8, 2, 5, 7, 1, 6, 4, 9, 3, 8],
  [5, 9, 1, 6, 4, 8, 2, 7, 3, 9, 6, 1, 8, 5, 3, 7, 2, 9, 4, 6, 8, 1, 7, 5, 3, 9, 2, 4],
  [8, 4, 7, 2, 9, 5, 3, 6, 8, 1, 7, 4, 9, 2, 5, 8, 3, 6, 1, 7, 4, 9, 2, 5, 8, 3, 7, 1],
  [2, 7, 5, 9, 3, 8, 4, 6, 1, 7, 5, 9, 2, 8, 4, 6, 3, 7, 9, 1, 5, 8, 4, 2, 7, 6, 3, 9],
];

export default function KraepelinTest() {
  const router = useRouter();

  // Test Config Parameters
  const TOTAL_COLUMNS = 50;
  const COLUMN_DURATION = 15; // exactly 15 seconds per column
  const DIGITS_PER_COLUMN = 28; // 28 digits per column (27 addition pairs)

  // Test Phases: 'instruction' | 'practice' | 'practice_finished' | 'test' | 'submitting'
  const [phase, setPhase] = useState<'instruction' | 'practice' | 'practice_finished' | 'test' | 'submitting'>('instruction');

  // Live session states
  const [currentCol, setCurrentCol] = useState(0);
  const [currentPairIdx, setCurrentPairIdx] = useState(0); // 0 (bottom pair) to 26 (top pair)
  const [timeLeft, setTimeLeft] = useState(COLUMN_DURATION);
  const [showPindah, setShowPindah] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync atomic refs to prevent state race condition & input leakage during column transitions
  const currentColRef = useRef(0);
  currentColRef.current = currentCol;

  const currentPairIdxRef = useRef(0);
  currentPairIdxRef.current = currentPairIdx;

  const isTransitioningRef = useRef(false);
  isTransitioningRef.current = isTransitioning;

  const phaseRef = useRef<'instruction' | 'practice' | 'practice_finished' | 'test' | 'submitting'>('instruction');
  phaseRef.current = phase;

  // Active matrix & answers
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[][]>([]);
  const userAnswersRef = useRef<(number | null)[][]>([]);

  // Inner scroll container & item refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeColRef = useRef<HTMLDivElement | null>(null);
  const activePairRef = useRef<HTMLDivElement | null>(null);

  // Initial mount check (restore draft if candidate was disconnected during official test)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedColStr = localStorage.getItem('kraepelin_draft_col');
        const savedAnsStr = localStorage.getItem('kraepelin_draft_answers');
        if (savedColStr !== null && savedAnsStr !== null) {
          const parsedCol = parseInt(savedColStr, 10);
          const parsedAns = JSON.parse(savedAnsStr);
          if (!isNaN(parsedCol) && parsedCol >= 0 && parsedCol < TOTAL_COLUMNS && Array.isArray(parsedAns)) {
            const colAns = parsedAns[parsedCol];
            let firstEmptyPairIdx = 0;
            if (Array.isArray(colAns)) {
              const foundIdx = colAns.findIndex((ans: any) => ans === null || ans === undefined);
              if (foundIdx !== -1) firstEmptyPairIdx = foundIdx;
              else firstEmptyPairIdx = Math.max(0, colAns.length - 1);
            }

            const hasProgress = parsedCol > 0 || firstEmptyPairIdx > 0 || parsedAns.some((c: any[]) => Array.isArray(c) && c.some(x => x !== null));

            if (hasProgress) {
              const officialMatrix: number[][] = [];
              for (let c = 0; c < TOTAL_COLUMNS; c++) {
                officialMatrix.push([...getOfficialKraepelinColumn(c)]);
              }
              setMatrix(officialMatrix);
              setUserAnswers(parsedAns);
              userAnswersRef.current = parsedAns;
              setCurrentCol(parsedCol);
              setCurrentPairIdx(firstEmptyPairIdx);
              currentColRef.current = parsedCol;
              currentPairIdxRef.current = firstEmptyPairIdx;
              setPhase('test');
              return;
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore Kraepelin draft:', e);
      }
    }
  }, []);

  // Initialize Practice Mode
  const startPractice = () => {
    const practiceAns: (number | null)[][] = PRACTICE_MATRIX.map(col => new Array(col.length - 1).fill(null));
    setMatrix(PRACTICE_MATRIX);
    setUserAnswers(practiceAns);
    userAnswersRef.current = practiceAns;
    setCurrentCol(0);
    setCurrentPairIdx(0);
    currentColRef.current = 0;
    currentPairIdxRef.current = 0;
    setTimeLeft(COLUMN_DURATION);
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    setShowPindah(false);
    setPhase('practice');
  };

  // Initialize Official 50-Column Test
  const startOfficialTest = () => {
    const officialMatrix: number[][] = [];
    const officialAns: (number | null)[][] = [];
    for (let c = 0; c < TOTAL_COLUMNS; c++) {
      const colDigits = getOfficialKraepelinColumn(c);
      officialMatrix.push([...colDigits]);
      officialAns.push(new Array(colDigits.length - 1).fill(null));
    }

    setMatrix(officialMatrix);
    setUserAnswers(officialAns);
    userAnswersRef.current = officialAns;
    setCurrentCol(0);
    setCurrentPairIdx(0);
    currentColRef.current = 0;
    currentPairIdxRef.current = 0;
    setTimeLeft(COLUMN_DURATION);
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    setShowPindah(false);
    setPhase('test');
  };

  // Submit and finish official test
  const finishOfficialTest = async () => {
    setPhase('submitting');

    try {
      const currentAnswers = userAnswersRef.current.length > 0 ? userAnswersRef.current : userAnswers;

      // HANYA KIRIMKAN JAWABAN MENTAH KE SERVER (Kalkulasi skor dilakukan di backend)
      await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'KRAEPELIN',
          answers: currentAnswers
        })
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('kraepelin_draft_col');
        localStorage.removeItem('kraepelin_draft_answers');
        localStorage.setItem('test_completed_kraepelin', 'true');
        localStorage.setItem('test_completed_kreapelin', 'true');
      }
      router.push('/testee/session');
    } catch (e) {
      console.error('Failed to submit Kraepelin:', e);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kraepelin_draft_col');
        localStorage.removeItem('kraepelin_draft_answers');
        localStorage.setItem('test_completed_kraepelin', 'true');
        localStorage.setItem('test_completed_kreapelin', 'true');
      }
      router.push('/testee/session');
    }
  };

  // Unified single Column Advance function (called exactly once per column switch)
  const advanceColumn = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    const totalCols = phaseRef.current === 'practice' ? PRACTICE_TOTAL_COLUMNS : TOTAL_COLUMNS;
    const nextCol = currentColRef.current + 1;

    if (nextCol < totalCols) {
      currentColRef.current = nextCol;
      currentPairIdxRef.current = 0;
      setCurrentCol(nextCol);
      setCurrentPairIdx(0);
      setTimeLeft(COLUMN_DURATION);
      setShowPindah(true);

      if (phaseRef.current === 'test' && typeof window !== 'undefined') {
        localStorage.setItem('kraepelin_draft_col', String(nextCol));
        localStorage.setItem('kraepelin_draft_answers', JSON.stringify(userAnswersRef.current));
      }

      setTimeout(() => {
        setShowPindah(false);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, 700);
    } else {
      setShowPindah(false);
      setIsTransitioning(false);
      isTransitioningRef.current = false;

      if (phaseRef.current === 'practice') {
        setPhase('practice_finished');
      } else {
        finishOfficialTest();
      }
    }
  }, [TOTAL_COLUMNS]);

  // Dedicated 15-Second Timer (strictly 15s per column, resets cleanly on each column switch)
  useEffect(() => {
    if (phase !== 'practice' && phase !== 'test') return;

    let secondsRemaining = COLUMN_DURATION;
    setTimeLeft(COLUMN_DURATION);

    const timer = setInterval(() => {
      secondsRemaining -= 1;
      setTimeLeft(secondsRemaining);

      if (secondsRemaining <= 0) {
        advanceColumn();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentCol, advanceColumn]);

  // Auto-scroll keeping active pair centered in workspace viewport
  useEffect(() => {
    if (phase !== 'practice' && phase !== 'test') return;

    if (activePairRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const target = activePairRef.current;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const scrollOffsetY = targetRect.top - containerRect.top - containerRect.height / 2 + targetRect.height / 2;
      const scrollOffsetX = targetRect.left - containerRect.left - containerRect.width / 2 + targetRect.width / 2;

      container.scrollBy({
        top: scrollOffsetY,
        left: scrollOffsetX,
        behavior: 'smooth'
      });
    }
  }, [currentCol, currentPairIdx, phase]);

  const handleInputDigit = (digit: number) => {
    if ((phase !== 'practice' && phase !== 'test') || matrix.length === 0 || showPindah || isTransitioningRef.current || isTransitioning) {
      return;
    }

    const cCol = currentColRef.current;
    const cPair = currentPairIdxRef.current;
    const colDigits = matrix[cCol];
    if (!colDigits) return;

    // Record user answer
    setUserAnswers(prev => {
      const copy = prev.map(c => [...c]);
      if (copy[cCol]) {
        copy[cCol][cPair] = digit;
      }
      userAnswersRef.current = copy;
      if (phaseRef.current === 'test' && typeof window !== 'undefined') {
        localStorage.setItem('kraepelin_draft_answers', JSON.stringify(copy));
      }
      return copy;
    });

    // Advance pair safely
    if (cPair + 1 < DIGITS_PER_COLUMN - 1) {
      const nextPair = cPair + 1;
      currentPairIdxRef.current = nextPair;
      setCurrentPairIdx(nextPair);
    } else {
      advanceColumn();
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'practice' && phase !== 'test') return;
      if (isTransitioningRef.current || isTransitioning || showPindah) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        e.stopPropagation();
        handleInputDigit(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [phase, matrix, isTransitioning, showPindah]);

  /* ─── 1. INSTRUCTION / ONBOARDING SCREEN ─── */
  if (phase === 'instruction') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: '"Inter", system-ui, sans-serif' }}>
        <div style={{ maxWidth: '680px', width: '100%', background: '#FFFFFF', borderRadius: '24px', padding: '44px 36px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
          
          <div style={{ width: '60px', height: '60px', background: '#EFF6FF', color: '#2563EB', borderRadius: '20px', display: 'grid', placeItems: 'center', fontSize: '30px', margin: '0 auto 20px' }}>
            ⚡
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
            Tes Kraepelin (Kecepatan & Ketelitian Kerja)
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
            Standar Resmi Tes Kraepelin Psikologi
          </p>

          <div style={{ background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', textAlign: 'left', marginBottom: '32px', lineHeight: '1.6' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>
              Petunjuk Pengerjaan:
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Jumlahkan 2 angka yang berdekatan dari <strong>BAWAH ke ATAS</strong>.</li>
              <li>Jika hasil penjumlahan &ge; 10, ketikkan <strong>ANGKA SATUANNYA SAJA</strong> (Contoh: 8 + 7 = 15 &rarr; ketik <strong>5</strong>, 9 + 9 = 18 &rarr; ketik <strong>8</strong>).</li>
              <li>Setiap kolom memiliki batas waktu <strong>15 detik</strong>. Waktu dan perpindahan kolom berjalan otomatis di latar belakang.</li>
              <li>Ketika muncul peringatan <strong>PINDAH!</strong>, sistem akan otomatis beralih ke kolom berikutnya.</li>
              <li>Gunakan tombol angka <code>0</code> s.d. <code>9</code> pada keyboard laptop atau keypad layar.</li>
              <li>Sebelum tes resmi dimulai, Anda akan masuk ke <strong>Sesi Uji Coba / Latihan</strong> terlebih dahulu.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startPractice}
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
            Mulai Sesi Uji Coba Latihan →
          </button>
        </div>
      </div>
    );
  }

  /* ─── 2. PRACTICE FINISHED SCREEN (Proceed Only) ─── */
  if (phase === 'practice_finished') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: '"Inter", system-ui, sans-serif' }}>
        <div style={{ maxWidth: '600px', width: '100%', background: '#FFFFFF', borderRadius: '24px', padding: '44px 36px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
          
          <div style={{ width: '64px', height: '64px', background: '#ECFDF5', color: '#059669', borderRadius: '20px', display: 'grid', placeItems: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
            🎉
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
            Uji Coba Latihan Selesai
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
            Anda telah menyelesaikan sesi uji coba latihan. Jika Anda sudah memahami cara pengerjaan, silakan klik tombol di bawah untuk memulai tes Kraepelin yang sesungguhnya.
          </p>

          <div>
            <button
              type="button"
              onClick={startOfficialTest}
              style={{
                width: '100%',
                padding: '16px 32px',
                background: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(5,150,105,0.25)',
                transition: 'all 0.2s'
              }}
            >
              Mulai Tes Kraepelin Resmi →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── 3. SUBMITTING SCREEN ─── */
  if (phase === 'submitting') {
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

  /* ─── 4. LIVE TEST / PRACTICE CANVAS (Exact Same Clean Fullscreen CBT Interface) ─── */
  const rowIndices = Array.from({ length: DIGITS_PER_COLUMN }, (_, i) => DIGITS_PER_COLUMN - 1 - i);

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: '#FFFFFF', 
      color: '#0F172A', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: '"Inter", system-ui, sans-serif', 
      userSelect: 'none', 
      overflow: 'hidden' 
    }}>
      
      {/* Pindah Overlay Alert */}
      {showPindah && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'none' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#DC2626', textShadow: '0 4px 20px rgba(0,0,0,0.25)', letterSpacing: '3px', background: '#FFFFFF', padding: '16px 48px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            PINDAH!
          </div>
        </div>
      )}

      {/* Main Workspace Card Container */}
      <div style={{ 
        flex: 1, 
        padding: '12px 30px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden' 
      }}>
        <div 
          ref={scrollContainerRef}
          style={{ 
            maxWidth: '1100px', 
            width: '100%', 
            height: '100%',
            maxHeight: '480px',
            background: '#FFFFFF', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
            border: '1px solid #E2E8F0', 
            padding: '20px 0', 
            overflowX: 'auto', 
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Multi-Column Display with Centered Horizontal & Vertical Padding */}
          <div style={{ 
            display: 'inline-flex', 
            gap: '24px', 
            alignItems: 'flex-start', 
            padding: '200px calc(50% - 28px)',
            minWidth: '100%',
            justifyContent: 'flex-start'
          }}>
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
                    minWidth: '56px',
                    padding: '14px 10px',
                    borderRadius: '16px',
                    background: isActiveCol ? '#F0F6FF' : 'transparent',
                    border: isActiveCol ? '1.5px solid #BFDBFE' : '1.5px solid transparent',
                    transition: 'all 0.2s ease',
                    opacity: isActiveCol ? 1 : isPastCol ? 0.35 : 0.25
                  }}
                >
                  {/* Render from top row down to bottom row */}
                  {rowIndices.map((digitIdx) => {
                    const digitVal = colDigits[digitIdx];
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
                            height: '28px',
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
                              fontWeight: 800,
                              background: isSlotActive
                                ? '#EFF6FF'
                                : userAnsForSlot !== null && userAnsForSlot !== undefined
                                ? '#FFFFFF'
                                : '#F8FAFC',
                              color: isSlotActive
                                ? '#1D4ED8'
                                : userAnsForSlot !== null && userAnsForSlot !== undefined
                                ? '#0F172A'
                                : '#CBD5E1',
                              border: isSlotActive
                                ? '1.5px solid #93C5FD'
                                : userAnsForSlot !== null && userAnsForSlot !== undefined
                                ? '1.5px solid #CBD5E1'
                                : '1px solid #E2E8F0',
                              boxShadow: isSlotActive ? '0 0 10px rgba(147, 197, 253, 0.5)' : 'none',
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

      {/* Bottom Keypad Bar */}
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', background: '#FFFFFF', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '580px', width: '100%', justifyContent: 'center' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleInputDigit(digit)}
              style={{
                flex: 1,
                maxWidth: '52px',
                height: '46px',
                background: '#F8FAFC',
                color: '#1E293B',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#F8FAFC';
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
