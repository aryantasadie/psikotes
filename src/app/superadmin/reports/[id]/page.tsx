'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ASPECT_DESCRIPTIONS } from '../../job-positions/builder/page';

import { getDiscScale, mapScoreToYPercent } from './discHelpers';
import { papiScoringKeys } from './papiHelpers';

const discScoringKeys: Record<number, { most: Record<string, string>, least: Record<string, string> }> = {
  1: { most: { A: 'S', B: 'I', C: 'B', D: 'C' }, least: { A: 'S', B: 'I', C: 'D', D: 'C' } },
  2: { most: { A: 'D', B: 'C', C: 'B', D: 'B' }, least: { A: 'D', B: 'C', C: 'I', D: 'S' } },
  3: { most: { A: 'B', B: 'D', C: 'S', D: 'I' }, least: { A: 'C', B: 'D', C: 'S', D: 'B' } },
  4: { most: { A: 'C', B: 'D', C: 'B', D: 'S' }, least: { A: 'B', B: 'D', C: 'I', D: 'S' } },
  5: { most: { A: 'B', B: 'D', C: 'S', D: 'I' }, least: { A: 'C', B: 'D', C: 'S', D: 'B' } },
  6: { most: { A: 'D', B: 'B', C: 'B', D: 'C' }, least: { A: 'D', B: 'I', C: 'S', D: 'B' } },
  7: { most: { A: 'I', B: 'B', C: 'B', D: 'D' }, least: { A: 'I', B: 'C', C: 'S', D: 'B' } },
  8: { most: { A: 'S', B: 'B', C: 'D', D: 'C' }, least: { A: 'B', B: 'I', C: 'D', D: 'C' } },
  9: { most: { A: 'D', B: 'S', C: 'I', D: 'B' }, least: { A: 'D', B: 'B', C: 'I', D: 'C' } },
  10: { most: { A: 'C', B: 'S', C: 'B', D: 'D' }, least: { A: 'C', B: 'S', C: 'I', D: 'D' } },
  11: { most: { A: 'B', B: 'C', C: 'I', D: 'D' }, least: { A: 'S', B: 'B', C: 'I', D: 'D' } },
  12: { most: { A: 'D', B: 'S', C: 'I', D: 'C' }, least: { A: 'B', B: 'S', C: 'I', D: 'B' } },
  13: { most: { A: 'I', B: 'D', C: 'S', D: 'B' }, least: { A: 'B', B: 'D', C: 'S', D: 'C' } },
  14: { most: { A: 'D', B: 'S', C: 'I', D: 'B' }, least: { A: 'D', B: 'B', C: 'B', D: 'C' } },
  15: { most: { A: 'S', B: 'D', C: 'I', D: 'B' }, least: { A: 'S', B: 'D', C: 'I', D: 'C' } },
  16: { most: { A: 'C', B: 'D', C: 'I', D: 'S' }, least: { A: 'B', B: 'D', C: 'I', D: 'S' } },
  17: { most: { A: 'C', B: 'I', C: 'S', D: 'D' }, least: { A: 'C', B: 'I', C: 'B', D: 'D' } },
  18: { most: { A: 'S', B: 'B', C: 'D', D: 'C' }, least: { A: 'S', B: 'I', C: 'D', D: 'C' } },
  19: { most: { A: 'S', B: 'I', C: 'B', D: 'B' }, least: { A: 'B', B: 'I', C: 'C', D: 'D' } },
  20: { most: { A: 'S', B: 'C', C: 'I', D: 'D' }, least: { A: 'S', B: 'B', C: 'I', D: 'D' } },
  21: { most: { A: 'B', B: 'I', C: 'S', D: 'B' }, least: { A: 'D', B: 'B', C: 'S', D: 'C' } },
  22: { most: { A: 'I', B: 'S', C: 'C', D: 'D' }, least: { A: 'I', B: 'S', C: 'C', D: 'D' } },
  23: { most: { A: 'B', B: 'C', C: 'I', D: 'S' }, least: { A: 'D', B: 'B', C: 'I', D: 'S' } },
  24: { most: { A: 'B', B: 'I', C: 'D', D: 'C' }, least: { A: 'S', B: 'I', C: 'B', D: 'B' } },
};

const getTiki1Norm = (r: number) => [0,0,0,0,0,1,1,1,2,3,4,5,6,7,8,8,9,10,10,11,11,12,13,13,14,15,15,16,17,17,18,19,19,20,21,22,22,23,24,26,28][r] ?? 0;
const getTiki2Norm = (r: number) => [4,4,5,5,5,6,7,8,9,9,11,12,13,14,15,16,17,18,19,21,22,24,25,27,29,30,30][r] ?? 4;
const getTiki3Norm = (r: number) => [0,0,0,0,1,1,1,2,2,3,4,4,5,5,6,7,7,8,8,9,10,10,11,12,12,13,14,15,15,16,17,18,19,20,22,24,25,26,28,30,30][r] ?? 0;
const getTiki4Norm = (r: number) => [0,0,3,6,7,9,10,12,13,14,16,17,18,18,19,20,21,21,22,23,24,24,25,25,26,28,29,30,30,30,30][r] ?? 0;
const getTiki6Norm = (r: number) => {
  if (r <= 21) return 0; if (r <= 25) return 1; if (r <= 28) return 2; if (r === 29) return 3;
  if (r <= 32) return 4; if (r <= 34) return 5; if (r <= 36) return 6; if (r <= 38) return 7;
  if (r <= 40) return 8; if (r <= 43) return 9; if (r <= 45) return 10; if (r <= 48) return 11;
  if (r <= 51) return 12; if (r <= 53) return 13; if (r <= 55) return 14; if (r <= 57) return 15;
  if (r <= 59) return 16; if (r <= 62) return 17; if (r <= 65) return 18; if (r <= 69) return 19;
  if (r <= 73) return 20; if (r <= 78) return 21; if (r <= 85) return 22; if (r <= 90) return 23;
  if (r <= 95) return 24; if (r <= 98) return 25; if (r === 99) return 27; return 29;
};

const getTikiClassification = (s: number) => {
  if (s <= 6) return { label: 'KS', full: 'Kurang Sekali', color: '#EF4444', bg: '#FEF2F2' };
  if (s <= 12) return { label: 'K', full: 'Kurang', color: '#F97316', bg: '#FFF7ED' };
  if (s <= 18) return { label: 'S', full: 'Sedang', color: '#EAB308', bg: '#FEFCE8' };
  if (s <= 24) return { label: 'B', full: 'Baik', color: '#3B82F6', bg: '#EFF6FF' };
  return { label: 'BS', full: 'Baik Sekali', color: '#22C55E', bg: '#F0FDF4' };
};

const getWPTIQ = (r: number) => {
  const map = [59,59,61,64,67,69,71,73,75,78,80,81,83,86,88,90,93,95,97,98,100,102,104,106,108,111,113,114,116,118,120,121,123,125,126,128,130,132,134,136,138,140,142,143];
  if (r >= 44) return 146;
  return map[r] ?? 59;
};

const getWPTClassification = (iq: number) => {
  if (iq <= 69) return { label: 'KS/R', full: 'Kurang Sekali / Retarded', color: '#EF4444', bg: '#FEF2F2' };
  if (iq <= 79) return { label: 'KS/B', full: 'Kurang Sekali / Borderline', color: '#F97316', bg: '#FFF7ED' };
  if (iq <= 89) return { label: 'K/DN', full: 'Kurang / Dull Normal', color: '#F59E0B', bg: '#FFFBEB' };
  if (iq <= 109) return { label: 'C/N', full: 'Cukup / Normal', color: '#3B82F6', bg: '#EFF6FF' };
  if (iq <= 119) return { label: 'B/BN', full: 'Baik / Bright Normal', color: '#6366F1', bg: '#EEF2FF' };
  if (iq <= 129) return { label: 'BS/S', full: 'Baik Sekali / Superior', color: '#10B981', bg: '#ECFDF5' };
  return { label: 'BS/VS', full: 'Baik Sekali / Very Superior', color: '#22C55E', bg: '#F0FDF4' };
};

const getISTWP = (testType: string, r: number) => {
  const map2 = [67,71,74,78,81,84,88,92,95,98,102,105,109,112,116,119,123,126,130,133,137];
  const map3 = [79,83,86,89,92,96,99,102,105,109,112,115,119,122,125,129,132,135,138,142,145];
  const map6 = [85,87,89,91,93,95,96,98,100,102,104,105,108,109,111,113,115,117,119,121,122];
  const map7 = [69,73,75,79,82,85,88,91,94,97,100,103,108,109,112,115,118,121,124,127,130];
  
  if (testType === 'IST 2') return map2[r] ?? 67;
  if (testType === 'IST 3') return map3[r] ?? 79;
  if (testType === 'IST 6') return map6[r] ?? 85;
  if (testType === 'IST 7') return map7[r] ?? 69;
  return 0;
};

const getISTClassification = (testType: string, r: number) => {
  const ksm = { label: 'KS-', full: 'Kurang Sekali Minus', color: '#EF4444', bg: '#FEF2F2' };
  const ksp = { label: 'KS+', full: 'Kurang Sekali Plus', color: '#F87171', bg: '#FEF2F2' };
  const km  = { label: 'K-', full: 'Kurang Minus', color: '#F97316', bg: '#FFF7ED' };
  const kp  = { label: 'K+', full: 'Kurang Plus', color: '#FB923C', bg: '#FFF7ED' };
  const sm  = { label: 'S-', full: 'Sedang Minus', color: '#EAB308', bg: '#FEFCE8' };
  const sp  = { label: 'S+', full: 'Sedang Plus', color: '#FACC15', bg: '#FEFCE8' };
  const bm  = { label: 'B-', full: 'Baik Minus', color: '#3B82F6', bg: '#EFF6FF' };
  const bp  = { label: 'B+', full: 'Baik Plus', color: '#60A5FA', bg: '#EFF6FF' };
  const bsm = { label: 'BS-', full: 'Baik Sekali Minus', color: '#22C55E', bg: '#F0FDF4' };
  const bsp = { label: 'BS+', full: 'Baik Sekali Plus', color: '#4ADE80', bg: '#F0FDF4' };

  if (testType === 'IST 2' || testType === 'IST 7') {
    if (r <= 1) return ksm;
    if (r <= 3) return ksp;
    if (r <= 5) return km;
    if (testType === 'IST 2' && r <= 7) return kp;
    if (testType === 'IST 7' && r <= 8) return kp;
    if (testType === 'IST 2' && r === 8) return sm;
    if (testType === 'IST 7' && r === 9) return sm;
    if (testType === 'IST 2' && r <= 10) return sp;
    if (testType === 'IST 7' && r <= 11) return sp;
    if (testType === 'IST 2' && r <= 12) return bm;
    if (testType === 'IST 7' && r <= 14) return bm;
    if (testType === 'IST 2' && r <= 14) return bp;
    if (testType === 'IST 7' && r <= 16) return bp;
    if (testType === 'IST 2' && r <= 17) return bsm;
    if (testType === 'IST 7' && r <= 18) return bsm;
    return bsp;
  }
  
  if (testType === 'IST 3') {
    if (r === 0) return ksm;
    if (r <= 2) return km;
    if (r <= 4) return kp;
    if (r === 5) return sm;
    if (r <= 7) return sp;
    if (r <= 9) return bm;
    if (r <= 11) return bp;
    if (r <= 16) return bsm;
    return bsp;
  }
  
  if (testType === 'IST 6') {
    if (r <= 1) return km;
    if (r <= 4) return kp;
    if (r <= 7) return sm;
    if (r <= 10) return sp;
    if (r <= 14) return bm;
    if (r <= 17) return bp;
    if (r <= 19) return bsm;
    return bsp;
  }
  
  return sm;
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  
  const role = (session?.user as any)?.role;
  
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/superadmin/reports/${id}`)
      .then(res => res.json())
      .then(data => {
        setParticipant(data);
        if (data.test && data.test.sequence) {
          const seq = JSON.parse(data.test.sequence);
          if (seq.length > 0) setSelectedTest('Psikogram');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (selectedTest) {
      const normalizedForFetch = selectedTest === 'PAPI KOSTICK' ? 'PAPI_KOSTICK' : selectedTest;
      fetch(`/api/superadmin/questions?testType=${encodeURIComponent(normalizedForFetch)}`)
        .then(res => res.json())
        .then(data => {
          if (data.questions) {
            setQuestions(data.questions.sort((a: any, b: any) => a.id - b.id));
          } else {
            setQuestions([]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [selectedTest]);

    const [savingReview, setSavingReview] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Review form states
  const [reviewStatus, setReviewStatus] = useState('DRAFT');
  const [reviewRekomendasi, setReviewRekomendasi] = useState('DIPERTIMBANGKAN');
  const [reviewKelebihan, setReviewKelebihan] = useState('');
  const [reviewKelemahan, setReviewKelemahan] = useState('');
  const [reviewDinamika, setReviewDinamika] = useState({
    intelegensi: '',
    kepribadian: '',
    sikapKerja: '',
    kepemimpinan: '',
    kesimpulan: ''
  });
  
  // The modified scores map
  const [modifiedScores, setModifiedScores] = useState<Record<string, number>>({});
  
  // Dynamically compute computer-generated scores for psychological aspects based on candidate's answers & exact norm helpers
  const computerScores = React.useMemo(() => {
    const scores: Record<string, number> = {};
    if (!participant || !participant.answers) return scores;

    // Helper: Map WPT Raw Score to 1-5 Rating Scale using getWPTIQ and getWPTClassification
    const calculateWptScale = () => {
      const wptAnswers = participant.answers.filter((a: any) => 
        a.question && (a.question.testType === 'WPT' || a.question.testType === 'WPT_AGE')
      );
      if (wptAnswers.length === 0) return null;

      let wptCorrect = 0;
      wptAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        const normAns = String(ans.selectedOption || '').trim().replace(/,/g, '.').toLowerCase();
        const normKey = String(ans.question.correct || '').trim().replace(/,/g, '.').toLowerCase();
        if (normAns === normKey) wptCorrect++;
      });

      const iq = getWPTIQ(wptCorrect);
      if (iq <= 79) return 1;      // KS (Kurang Sekali)
      else if (iq <= 89) return 2; // K (Kurang)
      else if (iq <= 109) return 3;// C (Cukup)
      else if (iq <= 119) return 4;// B (Baik)
      else return 5;               // BS (Baik Sekali)
    };

    // Helper: Map IST Subtest Raw Score to 1-5 Rating Scale using getISTClassification
    const calculateIstScale = (subtest: string) => {
      const istAnswers = participant.answers.filter((a: any) => 
        a.question && a.question.testType === subtest
      );
      if (istAnswers.length === 0) return null;

      let correct = 0;
      istAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        const normAns = String(ans.selectedOption || '').trim().toLowerCase();
        const normKey = String(ans.question.correct || '').trim().toLowerCase();
        if (normAns === normKey) correct++;
      });

      const cls = getISTClassification(subtest, correct);
      if (cls.label.startsWith('KS')) return 1;
      if (cls.label.startsWith('K')) return 2;
      if (cls.label.startsWith('S') || cls.label.startsWith('C')) return 3;
      if (cls.label.startsWith('B') && !cls.label.startsWith('BS')) return 4;
      if (cls.label.startsWith('BS')) return 5;
      return 3;
    };

    // Helper: Map TIKI Subtest Raw Score to 1-5 Rating Scale using getTikiClassification
    const calculateTikiScale = (subtest: string) => {
      const tikiAnswers = participant.answers.filter((a: any) => 
        a.question && a.question.testType === subtest
      );
      if (tikiAnswers.length === 0) return null;

      let correct = 0;
      tikiAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        const normAns = String(ans.selectedOption || '').trim().toLowerCase();
        const normKey = String(ans.question.correct || '').trim().toLowerCase();
        if (normAns === normKey) correct++;
      });

      let stdScore = correct;
      if (subtest === 'TIKI 6') stdScore = getTiki6Norm(correct);

      const cls = getTikiClassification(stdScore);
      if (cls.label === 'KS') return 1;
      if (cls.label === 'K') return 2;
      if (cls.label === 'S' || cls.label === 'C') return 3;
      if (cls.label === 'B') return 4;
      if (cls.label === 'BS') return 5;
      return 3;
    };

    const wptVal = calculateWptScale();
    const ist2Val = calculateIstScale('IST 2');
    const ist3Val = calculateIstScale('IST 3');
    const ist6Val = calculateIstScale('IST 6');
    const ist7Val = calculateIstScale('IST 7');
    const tiki6Val = calculateTikiScale('TIKI 6');

    // Cognitive / Intellectual Aspect Mapping
    const cogScale = wptVal ?? tiki6Val ?? ist3Val ?? 3;
    const verbalScale = ist2Val ?? wptVal ?? 3;
    const logicScale = ist3Val ?? wptVal ?? 3;
    const abstractScale = ist6Val ?? tiki6Val ?? wptVal ?? 3;
    const numericScale = ist7Val ?? wptVal ?? 3;

    scores['IQ / Kapasitas Intelektual'] = cogScale;
    scores['Inteligensi Umum'] = cogScale;
    scores['Kemampuan Kognitif'] = cogScale;
    scores['Daya Analisa'] = logicScale;
    scores['Logika Berpikir'] = logicScale;
    scores['Daya Abstraksi'] = abstractScale;
    scores['Pemahaman Verbal'] = verbalScale;
    scores['Kemampuan Numerik'] = numericScale;
    scores['Problem Solving'] = cogScale;
    scores['Daya Tangkap'] = cogScale;

    // Power Leader / Personality Scores
    const powerAnswers = participant.answers.filter((a: any) => 
      a.question && (a.question.testType === 'POWER' || a.question.testType === 'POWER LEADER')
    );
    if (powerAnswers.length > 0) {
      let pScale = 4;
      if (powerAnswers.length >= 40) pScale = 4;
      scores['Kepemimpinan'] = pScale;
      scores['Daya Pimpin'] = pScale;
      scores['Pengambilan Keputusan'] = pScale;
      scores['Motivasi Kerja'] = pScale;
    }

    // Combine with normResults from DB if present
    if (participant.normResults) {
      participant.normResults.forEach((curr: any) => {
        scores[curr.parameter] = curr.score;
      });
    }

    return scores;
  }, [participant]);

  // Group security logs by timestamp (nearest 4s) for side-by-side camera/screen proctoring view
  const groupedLogs = React.useMemo(() => {
    if (!participant || !participant.logs) return [];
    
    const groups: { time: string; logs: any[] }[] = [];
    const logsList = [...participant.logs].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    logsList.forEach(log => {
      const logTime = new Date(log.createdAt);
      const timeStr = logTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + logTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timeMs = logTime.getTime();
      
      let foundGroup = groups.find(g => {
        const groupTime = new Date(g.logs[0].createdAt).getTime();
        return Math.abs(groupTime - timeMs) <= 4000;
      });
      
      if (foundGroup) {
        foundGroup.logs.push(log);
      } else {
        groups.push({ time: timeStr, logs: [log] });
      }
    });
    
    return groups;
  }, [participant]);

  // Initialize review form from existing psychoResults
  useEffect(() => {
    if (participant?.psychoResults) {
      const pr = participant.psychoResults;
      setReviewStatus(pr.status || 'DRAFT');
      setReviewRekomendasi(pr.recommendation || 'DIPERTIMBANGKAN');
      setReviewKelebihan(pr.kelebihan || '');
      setReviewKelemahan(pr.kelemahan || '');
      
      if (pr.dinamika) {
        try { setReviewDinamika(JSON.parse(pr.dinamika)); } catch(e){}
      }
      if (pr.modifiedScores) {
        try { setModifiedScores(JSON.parse(pr.modifiedScores)); } catch(e){}
      }
    }
  }, [participant]);


  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Memuat data laporan...</div>;
  if (!participant || participant.error) return <div style={{ padding: '3rem', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{participant?.error || 'Data tidak ditemukan atau terjadi kesalahan.'}</div>;

  const sequence = participant.test?.sequence ? JSON.parse(participant.test.sequence) : [];
  const normalizedTestType = selectedTest === 'PAPI KOSTICK' ? 'PAPI_KOSTICK' : selectedTest;
  
  // Filter answers by the currently selected test type
  const currentAnswers = (participant.answers || []).filter((a: any) => a.question && a.question.testType === normalizedTestType);

  // Group by question number logic
  currentAnswers.sort((a: any, b: any) => a.questionId - b.questionId);
  
  const handleScoreOverride = async (aspect: string, val: number) => {
    const newScores = { ...modifiedScores, [aspect]: val };
    setModifiedScores(newScores);

    // Auto-save modified scores to database immediately
    try {
      await fetch(`/api/superadmin/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: reviewRekomendasi,
          status: reviewStatus,
          dinamika: reviewDinamika,
          kelebihan: reviewKelebihan,
          kelemahan: reviewKelemahan,
          modifiedScores: newScores,
          jobPositionId: (participant.jobPosition?.id || participant.test?.jobPosition?.id)
        })
      });
    } catch (e) {
      console.error('Failed to auto-save psychograph score override:', e);
    }
  };
  
  const handleSaveReview = async (newStatus?: string) => {
    const statusToSave = newStatus || reviewStatus;
    setSavingReview(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/superadmin/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: reviewRekomendasi,
          status: statusToSave,
          dinamika: reviewDinamika,
          kelebihan: reviewKelebihan,
          kelemahan: reviewKelemahan,
          modifiedScores: modifiedScores,
          jobPositionId: (participant.jobPosition?.id || participant.test?.jobPosition?.id)
        })
      });
      if (res.ok) {
        setSaveMessage('Evaluasi berhasil disimpan!');
        if (newStatus) setReviewStatus(newStatus);
        // Update local state to reflect saved status
        if (statusToSave === 'RELEASED') {
            // refresh data
        }
      } else {
        setSaveMessage('Gagal menyimpan evaluasi.');
      }
    } catch (e) {
      setSaveMessage('Terjadi kesalahan server.');
    }
    setSavingReview(false);
  };

  return (

    <div className="section" style={{ padding: '2rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/superadmin/reports" style={{ display: 'inline-block', marginBottom: '1rem', color: '#3A3F94', textDecoration: 'none', fontWeight: 500 }}>
            &larr; Kembali ke Daftar Laporan
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.25rem' }}>
            Detail Jawaban: {participant.user.name}
          </h2>
          <p style={{ color: '#64748B' }}>
            {(participant.test?.title?.split('-')[0]?.trim() || participant.jobPosition?.name || participant.test?.jobPosition?.name || 'Posisi General')} &bull; Dikerjakan pada {participant.startTime ? new Date(participant.startTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
          </p>
        </div>
        
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>Lihat Modul:</span>
            <select 
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', background: '#fff', fontWeight: 500, color: '#1E293B', cursor: 'pointer' }}
            >
              <option value="Psikogram">Psikogram</option>
              {sequence.map((testName: string) => (
                <option key={testName} value={testName}>{testName}</option>
              ))}
              <option value="Proctoring">📷 Log Pengawasan & Keamanan</option>
            </select>
          </div>
      </div>

      {selectedTest === 'Psikogram' ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Psychograph Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0F172A', fontWeight: 700 }}>
                  1. Profil Aspek Psikologis & Plotting Grey Area
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '12px 24px', width: '40%', fontWeight: 600 }}>Dimensi Aspek Psikologis</th>
                      <th style={{ padding: '12px', textAlign: 'center', width: '12%', fontWeight: 600 }}>KS (1)</th>
                      <th style={{ padding: '12px', textAlign: 'center', width: '12%', fontWeight: 600 }}>K (2)</th>
                      <th style={{ padding: '12px', textAlign: 'center', width: '12%', fontWeight: 600 }}>C (3)</th>
                      <th style={{ padding: '12px', textAlign: 'center', width: '12%', fontWeight: 600 }}>B (4)</th>
                      <th style={{ padding: '12px', textAlign: 'center', width: '12%', fontWeight: 600 }}>BS (5)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Categories and Aspects if available in preset mapping */}
                    {(() => {
                        const jobPosition = participant.jobPosition || participant.test?.jobPosition;
                        const defaultAspectList = Object.keys(ASPECT_DESCRIPTIONS);
                        
                        let grayAreas = jobPosition?.grayAreas || [];
                        if (grayAreas.length === 0) {
                            // Fallback to default aspects if jobPosition has no grayAreas configured yet
                            grayAreas = defaultAspectList.map(name => ({ parameter: name, targetScore: 3 }));
                        }

                        let mapping = [];
                        if (jobPosition?.psychographPreset?.mapping) {
                            try { mapping = JSON.parse(jobPosition.psychographPreset.mapping); } catch(e){}
                        }
                        
                        if (mapping.length === 0) {
                            mapping = [{
                                category: "Aspek Psikologis",
                                aspects: grayAreas.map((ga: any) => ({ name: ga.parameter, checked: true }))
                            }];
                        }

                        const grayAreasMap = grayAreas.reduce((acc: any, ga: any) => {
                            acc[ga.parameter] = ga.targetScore;
                            return acc;
                        }, {});

                        const descriptions: Record<string, string> = {
                          ...ASPECT_DESCRIPTIONS,
                          "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
                          "Daya Analisa": "Mampu mengolah dan mengidentifikasi topik-topik serta keterkaitan dari informasi-informasi tersebut; menghubungkan & membandingkan data-data dari berbagai sumber, mengidentifikasi hubungan sebab akibat.",
                          "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal",
                          "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan kemampuan berpikir antisipatif",
                          "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan, dengan mempertimbangkan efektivitas dari alternatif solusi yang dibuat",
                          "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh oleh situasi.",
                          "Kepekaan": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati)",
                          "Kepercayaan Diri": "Yakin pada kemampuan dirinya, bisa bersikap tegas, asertif",
                          "Sosiabilitas": "Memiliki minat dan perhatian terhadap orang lain, mampu menciptakan impresi yang baik dalam situasi sosial, bisa menjalin hubungan dgn berbagai tipe orang"
                        };

                        return mapping.map((cat: any, cIdx: number) => {
                            const activeAsps = cat.aspects.filter((a: any) => a.checked);
                            if (activeAsps.length === 0) return null;

                            return (
                                <React.Fragment key={cIdx}>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <td colSpan={6} style={{ padding: '12px 24px', fontWeight: 800, color: '#0F172A', fontSize: '12px' }}>
                                            {cat.category.toUpperCase()}
                                        </td>
                                    </tr>
                                    {activeAsps.map((asp: any, aIdx: number) => {
                                        const aspectName = asp.name;
                                        const targetScore = grayAreasMap[aspectName] || 3;
                                        const compScore = computerScores[aspectName] || 3;
                                        const finalScore = modifiedScores[aspectName] !== undefined ? modifiedScores[aspectName] : compScore;

                                        return (
                                            <tr key={aspectName} style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px', marginBottom: '4px' }}>{aspectName}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                                                        {descriptions[aspectName] || "Deskripsi aspek belum tersedia."}
                                                    </div>
                                                </td>
                                                {[1, 2, 3, 4, 5].map(score => {
                                                    const isTarget = score === targetScore;
                                                    return (
                                                        <td key={score} style={{ padding: '0', textAlign: 'center', background: isTarget ? '#E2E8F0' : 'transparent', borderLeft: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}>
                                                            <div style={{ width: '100%', height: '100%', padding: '16px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <input 
                                                                    type="radio" 
                                                                    name={`plot-${aspectName.replace(/\s+/g, '-')}`}
                                                                    value={score}
                                                                    checked={finalScore === score}
                                                                    onChange={() => handleScoreOverride(aspectName, score)}
                                                                    disabled={role === 'tester'}
                                                                    style={{ cursor: role === 'tester' ? 'not-allowed' : 'pointer', width: '16px', height: '16px', accentColor: '#3B82F6' }}
                                                                />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        )
                                    })}
                                </React.Fragment>
                            );
                        });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form Evaluasi Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 4px 0' }}>Form Evaluasi: {participant.user.name}</h3>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>Posisi: {(participant.jobPosition?.name || participant.test?.jobPosition?.name)} | Token: TP-{participant.test?.id}</div>
                </div>
            </div>

            {/* Uraian Dinamika Psikologis */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#0F172A', fontWeight: 700, textTransform: 'uppercase' }}>
                  2. Uraian Dinamika Psikologis
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1E293B' }}>A. Intelegensi</label>
                        <textarea 
                            value={reviewDinamika.intelegensi}
                            onChange={(e) => setReviewDinamika({...reviewDinamika, intelegensi: e.target.value})}
                            disabled={role === 'tester'}
                            style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', resize: 'vertical', background: role === 'tester' ? '#F8FAFC' : 'white', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                            placeholder="Uraian dinamika intelegensi..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1E293B' }}>B. Kepribadian & Potensi Relasi</label>
                        <textarea 
                            value={reviewDinamika.kepribadian}
                            onChange={(e) => setReviewDinamika({...reviewDinamika, kepribadian: e.target.value})}
                            disabled={role === 'tester'}
                            style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', resize: 'vertical', background: role === 'tester' ? '#F8FAFC' : 'white', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                            placeholder="Uraian dinamika kepribadian..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1E293B' }}>C. Pola - Sikap Kerja</label>
                        <textarea 
                            value={reviewDinamika.sikapKerja}
                            onChange={(e) => setReviewDinamika({...reviewDinamika, sikapKerja: e.target.value})}
                            disabled={role === 'tester'}
                            style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', resize: 'vertical', background: role === 'tester' ? '#F8FAFC' : 'white', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                            placeholder="Uraian pola sikap kerja..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1E293B' }}>D. Kepemimpinan</label>
                        <textarea 
                            value={reviewDinamika.kepemimpinan}
                            onChange={(e) => setReviewDinamika({...reviewDinamika, kepemimpinan: e.target.value})}
                            disabled={role === 'tester'}
                            style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', resize: 'vertical', background: role === 'tester' ? '#F8FAFC' : 'white', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                            placeholder="Uraian potensi kepemimpinan..."
                        />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1E293B' }}>E. Kesimpulan Dinamika</label>
                    <textarea 
                        value={reviewDinamika.kesimpulan}
                        onChange={(e) => setReviewDinamika({...reviewDinamika, kesimpulan: e.target.value})}
                        disabled={role === 'tester'}
                        style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', resize: 'vertical', background: role === 'tester' ? '#F8FAFC' : 'white', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                        placeholder="Kesimpulan keseluruhan..."
                    />
                </div>
            </div>

            {/* Kelebihan & Kelemahan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#047857' }}>Kelebihan / Strength (+)</label>
                    <textarea 
                        value={reviewKelebihan}
                        onChange={(e) => setReviewKelebihan(e.target.value)}
                        disabled={role === 'tester'}
                        style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #A7F3D0', background: role === 'tester' ? '#F8FAFC' : '#F0FDF4', fontSize: '14px', resize: 'vertical', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                        placeholder="+ Kelebihan 1&#10;+ Kelebihan 2"
                    />
                </div>
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#B91C1C' }}>Kelemahan / Area Pengembangan (-)</label>
                    <textarea 
                        value={reviewKelemahan}
                        onChange={(e) => setReviewKelemahan(e.target.value)}
                        disabled={role === 'tester'}
                        style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #FECACA', background: role === 'tester' ? '#F8FAFC' : '#FEF2F2', fontSize: '14px', resize: 'vertical', cursor: role === 'tester' ? 'not-allowed' : 'auto' }}
                        placeholder="- Kelemahan 1&#10;- Kelemahan 2"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '4px solid #3A3F94' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>Rekomendasi Psikolog Assessor:</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>Kesimpulan akhir kandidat berdasarkan hasil evaluasi.</div>
                    </div>
                    <select 
                        value={reviewRekomendasi}
                        onChange={(e) => setReviewRekomendasi(e.target.value)}
                        disabled={role === 'tester'}
                        style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, minWidth: '250px', background: '#F8FAFC', cursor: role === 'tester' ? 'not-allowed' : 'pointer' }}
                    >
                        <option value="DISARANKAN">[✓] DISARANKAN</option>
                        <option value="DIPERTIMBANGKAN">[?] DIPERTIMBANGKAN</option>
                        <option value="TIDAK DISARANKAN">[X] TIDAK DISARANKAN</option>
                    </select>
                </div>
                
                <div style={{ height: '1px', background: '#E2E8F0', width: '100%' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Status Evaluasi Saat Ini</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                          color: reviewStatus === 'RELEASED' ? '#047857' : reviewStatus === 'WAITING_QC' ? '#D97706' : '#334155'
                        }}>
                            {reviewStatus === 'RELEASED' ? '✅ Dirilis ke Klien' : reviewStatus === 'WAITING_QC' ? '⏳ Menunggu Persetujuan QC' : '📝 Draft (Proses Psikolog)'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {saveMessage && <span style={{ fontSize: '14px', color: '#047857', fontWeight: 600 }}>{saveMessage}</span>}
                        
                        <Link href={`/report-pdf/${id}`} target="_blank" style={{ background: '#F1F5F9', color: '#334155', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                            Lihat Preview PDF
                        </Link>
                        
                        {role !== 'tester' && (
                          <>
                            <button 
                                onClick={() => handleSaveReview('DRAFT')}
                                disabled={savingReview}
                                style={{ background: '#F8FAFC', color: '#334155', padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                {savingReview ? '...' : 'Simpan Draft'}
                            </button>

                            <button 
                                onClick={() => {
                                    if (confirm('Kirim ke QC sekarang? Status akan berubah menjadi Waiting QC.')) {
                                        handleSaveReview('WAITING_QC');
                                    }
                                }}
                                disabled={savingReview || reviewStatus === 'WAITING_QC' || reviewStatus === 'RELEASED'}
                                style={{ background: '#D97706', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: (reviewStatus === 'WAITING_QC' || reviewStatus === 'RELEASED') ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: (reviewStatus === 'WAITING_QC' || reviewStatus === 'RELEASED') ? 0.5 : 1 }}>
                                Kirim ke QC
                            </button>

                            {role !== 'psikolog' && (
                              <button 
                                  onClick={() => {
                                      if (confirm('Yakin ingin menandai laporan ini selesai dan siap rilis ke klien?')) {
                                          handleSaveReview('RELEASED');
                                      }
                                  }}
                                  disabled={savingReview}
                                  style={{ background: '#0D9488', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                  Setujui & Rilis (QC)
                              </button>
                            )}
                          </>
                        )}
                    </div>
                </div>
            </div>

        </div>
      ) : selectedTest === 'Proctoring' ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              📷 Log Pengawasan & Rekaman Layar (Proctoring)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Rangkaian foto webcam kamera peserta dan tangkapan layar desktop (screen capture) yang terekam secara realtime selama ujian berlangsung.
            </p>
          </div>

          {groupedLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: 'white', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              Belum ada log pengawasan atau rekaman yang tersimpan untuk peserta ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {groupedLogs.map((group: any, idx: number) => {
                const cameraLog = group.logs.find((l: any) => l.logType.startsWith('camera'));
                const screenLog = group.logs.find((l: any) => l.logType.startsWith('screen'));
                const isViolation = group.logs.some((l: any) => 
                  l.logType.includes('tab_switch') || 
                  l.logType.includes('fullscreen') || 
                  l.logType.includes('forbidden')
                );

                const logLabels = group.logs.map((l: any) => {
                  const type = l.logType;
                  if (type.includes('tab_switch')) return 'Pindah Tab / Kehilangan Fokus';
                  if (type.includes('fullscreen')) return 'Keluar Fullscreen';
                  if (type.includes('forbidden_key')) return 'Kombinasi Tombol Terlarang';
                  return 'Tangkapan Berkala';
                });
                const uniqueLabels = Array.from(new Set(logLabels)).join(', ');

                return (
                  <div key={idx} style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: isViolation ? '2.5px solid #F59E0B' : '1.5px solid #E2E8F0', 
                    padding: '24px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>⏱️ {group.time}</span>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                          Kategori: {uniqueLabels}
                        </div>
                      </div>
                      {isViolation ? (
                        <span style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                          🚨 Pelanggaran Keamanan
                        </span>
                      ) : (
                        <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                          ✓ Pengawasan Rutin
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', minHeight: '200px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>📷 Kamera Webcam:</div>
                        {cameraLog ? (
                          <img 
                            src={cameraLog.mediaUrl} 
                            alt="Webcam Capture" 
                            style={{ width: '100%', borderRadius: '12px', border: '1px solid #CBD5E1', objectFit: 'cover', height: '220px' }} 
                          />
                        ) : (
                          <div style={{ height: '220px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px', border: '1px dashed #CBD5E1' }}>
                            Kamera tidak terambil
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>🖥️ Tangkapan Layar Desktop:</div>
                        {screenLog ? (
                          <img 
                            src={screenLog.mediaUrl} 
                            alt="Screen Capture" 
                            style={{ width: '100%', borderRadius: '12px', border: '1px solid #CBD5E1', objectFit: 'contain', height: '220px', background: '#0F172A' }} 
                          />
                        ) : (
                          <div style={{ height: '220px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px', border: '1px dashed #CBD5E1' }}>
                            Layar tidak terambil
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
<div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem' }}>
          Jawaban Ujian {selectedTest}
        </h3>
        
        {questions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
            {currentAnswers.length === 0 ? 'Peserta belum memiliki rekam jawaban untuk modul ini.' : 'Memuat susunan soal...'}
          </div>
        ) : selectedTest === 'MSDT' ? (
          <div>
            {/* MSDT 8x8 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
              {Array.from({ length: 64 }).map((_, i) => {
                const qNum = i + 1;
                const q = questions[i];
                const ans = currentAnswers.find((a: any) => a.questionId === q?.id);
                const answerLetter = ans ? ans.selectedOption : '-';
                return (
                  <div key={i} style={{ 
                    background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', 
                    padding: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column' 
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{qNum}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B' }}>{answerLetter}</div>
                  </div>
                );
              })}
            </div>

            {/* Rekapitulasi Tabel */}
            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Baris</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 1 (A)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 2 (B)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 3 (C)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 4 (D)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 5 (E)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 6 (F)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 7 (G)</th>
                    <th style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>Col 8 (H)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const ansMap: Record<number, string> = {};
                    currentAnswers.forEach((a: any) => {
                      const idx = questions.findIndex((q: any) => q.id === a.questionId);
                      if (idx !== -1) ansMap[idx + 1] = a.selectedOption;
                    });
                    
                    const dimA = [0, 0, 0, 0, 0, 0, 0, 0];
                    const dimB = [0, 0, 0, 0, 0, 0, 0, 0];
                    const koreksi = [1, 2, 1, 0, 3, -1, 0, -4];
                    const jumlah = [0, 0, 0, 0, 0, 0, 0, 0];

                    for (let x = 1; x <= 8; x++) {
                      // A horizontal (Row)
                      for (let col = 1; col <= 8; col++) {
                        if (ansMap[(x - 1) * 8 + col] === 'A') dimA[x - 1]++;
                      }
                      // B vertical (Column)
                      for (let row = 1; row <= 8; row++) {
                        if (ansMap[(row - 1) * 8 + x] === 'B') dimB[x - 1]++;
                      }
                      jumlah[x - 1] = dimA[x - 1] + dimB[x - 1] + koreksi[x - 1];
                    }

                    const toScore = jumlah[2] + jumlah[3] + jumlah[6] + jumlah[7];
                    const roScore = jumlah[1] + jumlah[3] + jumlah[5] + jumlah[7];
                    const eScore = jumlah[4] + jumlah[5] + jumlah[6] + jumlah[7];

                    const toHigh = toScore >= 34;
                    const roHigh = roScore >= 34;
                    const eHigh = eScore >= 34;

                    let managementStyle = "Deserter";
                    if (toHigh && roHigh && eHigh) managementStyle = "Executive";
                    else if (toHigh && roHigh && !eHigh) managementStyle = "Compromiser";
                    else if (toHigh && !roHigh && eHigh) managementStyle = "Benevolent Autocrat";
                    else if (toHigh && !roHigh && !eHigh) managementStyle = "Autocrat";
                    else if (!toHigh && roHigh && eHigh) managementStyle = "Developer";
                    else if (!toHigh && roHigh && !eHigh) managementStyle = "Missionary";
                    else if (!toHigh && !roHigh && eHigh) managementStyle = "Bureaucrat";
                    else if (!toHigh && !roHigh && !eHigh) managementStyle = "Deserter";
                                        return (
                                          <>
                        <tr>
                          <td style={{ border: '1px solid #E2E8F0', padding: '0.75rem', fontWeight: 600 }}>A</td>
                          {dimA.map((val, i) => <td key={i} style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>{val}</td>)}
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #E2E8F0', padding: '0.75rem', fontWeight: 600 }}>B</td>
                          {dimB.map((val, i) => <td key={i} style={{ border: '1px solid #E2E8F0', padding: '0.75rem' }}>{val}</td>)}
                        </tr>
                        <tr style={{ background: '#F8FAFC' }}>
                          <td style={{ border: '1px solid #E2E8F0', padding: '0.75rem', fontWeight: 600, color: '#64748B' }}>KOREKSI</td>
                          {koreksi.map((val, i) => <td key={i} style={{ border: '1px solid #E2E8F0', padding: '0.75rem', color: '#64748B' }}>{val > 0 ? `+${val}` : val}</td>)}
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #E2E8F0', padding: '0.75rem', fontWeight: 700, background: '#E2E8F0' }}>JUMLAH</td>
                          {jumlah.map((val, i) => <td key={i} style={{ border: '1px solid #E2E8F0', padding: '0.75rem', fontWeight: 700, background: '#E2E8F0' }}>{val}</td>)}
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Perhitungan TO, RO, E */}
            {(() => {
              const ansMap: Record<number, string> = {};
              currentAnswers.forEach((a: any) => {
                const idx = questions.findIndex((q: any) => q.id === a.questionId);
                if (idx !== -1) ansMap[idx + 1] = a.selectedOption;
              });
              
              const dimA = [0, 0, 0, 0, 0, 0, 0, 0];
              const dimB = [0, 0, 0, 0, 0, 0, 0, 0];
              const koreksi = [1, 2, 1, 0, 3, -1, 0, -4];
              const jumlah = [0, 0, 0, 0, 0, 0, 0, 0];

              for (let x = 1; x <= 8; x++) {
                // A horizontal (Row)
                for (let col = 1; col <= 8; col++) {
                  if (ansMap[(x - 1) * 8 + col] === 'A') dimA[x - 1]++;
                }
                // B vertical (Column)
                for (let row = 1; row <= 8; row++) {
                  if (ansMap[(row - 1) * 8 + x] === 'B') dimB[x - 1]++;
                }
                jumlah[x - 1] = dimA[x - 1] + dimB[x - 1] + koreksi[x - 1];
              }

              const toScore = jumlah[2] + jumlah[3] + jumlah[6] + jumlah[7];
              const roScore = jumlah[1] + jumlah[3] + jumlah[5] + jumlah[7];
              const eScore = jumlah[4] + jumlah[5] + jumlah[6] + jumlah[7];

              const toHigh = toScore >= 34;
              const roHigh = roScore >= 34;
              const eHigh = eScore >= 34;

              let managementStyle = "Deserter";
              if (toHigh && roHigh && eHigh) managementStyle = "Executive";
              else if (toHigh && roHigh && !eHigh) managementStyle = "Compromiser";
              else if (toHigh && !roHigh && eHigh) managementStyle = "Benevolent Autocrat";
              else if (toHigh && !roHigh && !eHigh) managementStyle = "Autocrat";
              else if (!toHigh && roHigh && eHigh) managementStyle = "Developer";
              else if (!toHigh && roHigh && !eHigh) managementStyle = "Missionary";
              else if (!toHigh && !roHigh && eHigh) managementStyle = "Bureaucrat";
              else if (!toHigh && !roHigh && !eHigh) managementStyle = "Deserter";
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#1E3A8A', fontWeight: 600, marginBottom: '0.5rem' }}>TO (Task Orientation)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8' }}>{toScore}</div>
                    <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: '0.25rem' }}>Col 3 + 4 + 7 + 8</div>
                  </div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#14532D', fontWeight: 600, marginBottom: '0.5rem' }}>RO (Relationship)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803D' }}>{roScore}</div>
                    <div style={{ fontSize: '0.75rem', color: '#22C55E', marginTop: '0.25rem' }}>Col 2 + 4 + 6 + 8</div>
                  </div>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#7F1D1D', fontWeight: 600, marginBottom: '0.5rem' }}>E (Effectiveness)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B91C1C' }}>{eScore}</div>
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>Col 5 + 6 + 7 + 8</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '2px dashed #94A3B8', borderRadius: '8px', padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>Kesimpulan Gaya Dominan</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{managementStyle}</div>
                  </div>
                </div>
              );
            })()}

          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
            {questions.map((q: any, idx: number) => {
              const ans = currentAnswers.find((a: any) => a.questionId === q.id);
              
              if (!ans) {
                const hasKey = !!q.correct;
                let emptyBg = '#F8FAFC';
                let emptyBorder = '1px dashed #CBD5E1';
                let emptyColor = '#CBD5E1';

                if (hasKey) {
                  // Jika kosong tapi ada kuncinya, beri warna merah (salah)
                  emptyBg = '#FDE8E8';
                  emptyBorder = '1px solid #F8B4B4';
                  emptyColor = '#9B1C1C';
                }

                let displayKey = '-';
                if (hasKey) {
                  try {
                    if (q.correct.startsWith('[')) {
                      displayKey = JSON.parse(q.correct).join(', ');
                    } else {
                      displayKey = q.correct;
                    }
                  } catch {
                    displayKey = q.correct;
                  }
                }
                const displayContent = hasKey ? `- / ${displayKey}` : '-';

                return (
                  <div key={q.id} style={{ 
                    background: emptyBg, 
                    border: emptyBorder,
                    borderRadius: '8px', 
                    padding: '0.75rem', 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: '80px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: hasKey ? '#9B1C1C' : '#94A3B8', marginBottom: '0.25rem', fontWeight: 600 }}>Soal {idx + 1}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: emptyColor }}>{displayContent}</div>
                  </div>
                );
              }

              let isCorrect = false;
              if (ans.question.correct) {
                if (selectedTest === 'WPT' && ans.question.correct === '2.4') {
                  const userAns = String(ans.selectedOption).trim().replace(/,/g, '.');
                  if (userAns === '2.4' || userAns === '24') {
                    isCorrect = true;
                  } else {
                    isCorrect = false;
                  }
                } else {
                  try {
                    if (ans.selectedOption.startsWith('[') && ans.question.correct.startsWith('[')) {
                      const ansArr = JSON.parse(ans.selectedOption).sort();
                      const corrArr = JSON.parse(ans.question.correct).sort();
                      isCorrect = JSON.stringify(ansArr) === JSON.stringify(corrArr);
                    } else {
                      const normAns = String(ans.selectedOption).trim().replace(/,/g, '.');
                      const normKey = String(ans.question.correct).trim().replace(/,/g, '.');
                      isCorrect = normAns.toLowerCase() === normKey.toLowerCase();
                    }
                  } catch {
                    const normAns = String(ans.selectedOption).trim().replace(/,/g, '.');
                    const normKey = String(ans.question.correct).trim().replace(/,/g, '.');
                    isCorrect = normAns.toLowerCase() === normKey.toLowerCase();
                  }
                }
              }
              const hasKey = !!ans.question.correct;
              
              let bgColor = '#F1F5F9';
              let borderColor = '#E2E8F0';
              let textColor = '#1E293B';

              if (hasKey) {
                if (isCorrect) {
                  bgColor = '#DEF7EC';
                  borderColor = '#31C48D';
                  textColor = '#03543F';
                } else {
                  bgColor = '#FDE8E8';
                  borderColor = '#F8B4B4';
                  textColor = '#9B1C1C';
                }
              }

              let displayAnswer: any = ans.selectedOption;
              let isLong = false;
              
              if (selectedTest === 'DISC') {
                try {
                  const parsed = JSON.parse(displayAnswer);
                  const qNum = idx + 1;
                  const rawMost = parsed.most;
                  const rawLeast = parsed.least;
                  
                  let convMost = rawMost;
                  let convLeast = rawLeast;
                  
                  if (discScoringKeys[qNum]) {
                    const mappedMost = discScoringKeys[qNum].most[rawMost];
                    if (mappedMost) convMost = mappedMost === 'B' ? '*' : mappedMost;
                    
                    const mappedLeast = discScoringKeys[qNum].least[rawLeast];
                    if (mappedLeast) convLeast = mappedLeast === 'B' ? '*' : mappedLeast;
                  }
                  
                  displayAnswer = (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '1rem', marginTop: '4px' }}>
                      <div style={{ background: '#E0F2FE', padding: '4px 8px', borderRadius: '4px', color: '#0369A1' }}>M: <strong>{convMost || '-'}</strong></div>
                      <div style={{ background: '#FEE2E2', padding: '4px 8px', borderRadius: '4px', color: '#B91C1C' }}>L: <strong>{convLeast || '-'}</strong></div>
                    </div>
                  );
                } catch(e) {
                  // Fallback for old single-row DISC answers if any
                }
              } else {
                let parsedAns = displayAnswer;
                let parsedKey = ans.question.correct || '';
                
                if (typeof parsedAns === 'string' && parsedAns.startsWith('[')) {
                  try { parsedAns = JSON.parse(parsedAns).join(', '); } catch(e) {}
                }
                if (typeof parsedKey === 'string' && parsedKey.startsWith('[')) {
                  try { parsedKey = JSON.parse(parsedKey).join(', '); } catch(e) {}
                }

                if (parsedKey) {
                  displayAnswer = `${parsedAns} / ${parsedKey}`;
                } else {
                  displayAnswer = parsedAns;
                }
                
                if (typeof displayAnswer === 'string') {
                  isLong = displayAnswer.length > 8;
                }
              }

              return (
                <div key={ans.id} style={{ 
                  background: bgColor, 
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px', 
                  padding: '0.75rem', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '80px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.4rem', fontWeight: 600 }}>Soal {idx + 1}</div>
                  <div style={{ 
                    fontSize: isLong ? '0.85rem' : '1.1rem', 
                    fontWeight: 700, 
                    color: textColor,
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                  }}>
                    {displayAnswer}
                  </div>
                </div>
              );
            })}
            </div>
            
             {(() => {
                if (selectedTest.startsWith('TIKI') || selectedTest === 'WPT' || selectedTest.startsWith('IST') || selectedTest === 'DISC' || selectedTest.startsWith('PAPI')) {
                  let rawScore = 0;
                  questions.forEach(q => {
                    const ans = currentAnswers.find((a: any) => a.questionId === q.id);
                    let displayAnswer = '-';
                    let isCorrect = false;
                    let displayKey = '-';

                    if (ans) {
                      if (ans.selectedOption.startsWith('[')) {
                        try {
                          const arr = JSON.parse(ans.selectedOption);
                          displayAnswer = arr.join(', ');
                        } catch {
                          displayAnswer = ans.selectedOption;
                        }
                      } else {
                        displayAnswer = ans.selectedOption;
                      }

                      if (ans.question.correct) {
                        if (ans.question.correct.startsWith('[')) {
                          try {
                            const arr = JSON.parse(ans.question.correct);
                            displayKey = arr.join(', ');
                          } catch {
                            displayKey = ans.question.correct;
                          }
                        } else {
                          displayKey = ans.question.correct;
                        }

                        if (selectedTest === 'WPT' && displayKey === '2.4') {
                          const userAns = String(ans.selectedOption).trim().replace(/,/g, '.');
                          if (userAns === '2.4' || userAns === '24') {
                            isCorrect = true;
                          } else {
                            isCorrect = false;
                          }
                        } else {
                          try {
                            if (ans.selectedOption.startsWith('[') && ans.question.correct.startsWith('[')) {
                              const ansArr = JSON.parse(ans.selectedOption).sort();
                              const corrArr = JSON.parse(ans.question.correct).sort();
                              isCorrect = JSON.stringify(ansArr) === JSON.stringify(corrArr);
                            } else {
                              const normAns = String(ans.selectedOption).trim().replace(/,/g, '.');
                              const normKey = String(ans.question.correct).trim().replace(/,/g, '.');
                              isCorrect = normAns.toLowerCase() === normKey.toLowerCase();
                            }
                          } catch {
                            const normAns = String(ans.selectedOption).trim().replace(/,/g, '.');
                            const normKey = String(ans.question.correct).trim().replace(/,/g, '.');
                            isCorrect = normAns.toLowerCase() === normKey.toLowerCase();
                          }
                        }
                      }
                    }
                    
                    if (isCorrect) rawScore++;
                  });

                  if (selectedTest.startsWith('TIKI')) {
                    let stdScore = 0;
                    if (selectedTest === 'TIKI 1') stdScore = getTiki1Norm(rawScore);
                    else if (selectedTest === 'TIKI 2') stdScore = getTiki2Norm(rawScore);
                    else if (selectedTest === 'TIKI 3') stdScore = getTiki3Norm(rawScore);
                    else if (selectedTest === 'TIKI 4') stdScore = getTiki4Norm(rawScore);
                    else if (selectedTest === 'TIKI 6') stdScore = getTiki6Norm(rawScore);
                    
                    const cls = getTikiClassification(stdScore);
                    
                                        return (
                                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skor Mentah</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A' }}>{rawScore} <span style={{fontSize:'1.2rem', color:'#94A3B8', fontWeight: 500}}>/ {questions.length}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, background: '#D1FAE5', padding: '4px 10px', borderRadius: '12px' }}>✓ BENAR: {rawScore}</span>
                            <span style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 700, background: '#FEE2E2', padding: '4px 10px', borderRadius: '12px' }}>✕ SALAH: {questions.length - rawScore}</span>
                          </div>
                        </div>
                        <div style={{ flex: '1 1 200px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skor Standar</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A' }}>{stdScore}</div>
                        </div>
                        <div style={{ flex: '1 1 200px', background: cls.bg, border: `1px solid ${cls.color}40`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: cls.color, fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Klasifikasi</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: cls.color }}>{cls.label}</div>
                          <div style={{ fontSize: '0.95rem', color: cls.color, marginTop: '0.25rem', fontWeight: 600 }}>{cls.full}</div>
                        </div>
                      </div>
                    );
                  } else if (selectedTest === 'WPT') {
                    // Cek umur dari TestResultRaw WPT_AGE
                    const ageRaw = participant.rawResults?.find((r: any) => r.testType === 'WPT_AGE');
                    const age = ageRaw ? parseInt(ageRaw.rawData, 10) : null;
                    
                    let ageBonus = 0;
                    if (age !== null && !isNaN(age)) {
                      if (age >= 30 && age <= 39) ageBonus = 1;
                      else if (age >= 40 && age <= 49) ageBonus = 2;
                      else if (age >= 50 && age <= 59) ageBonus = 3;
                      else if (age >= 60) ageBonus = 4;
                    }
                    
                    const adjustedRawScore = Math.min(50, rawScore + ageBonus);
                    const iq = getWPTIQ(adjustedRawScore);
                    const cls = getWPTClassification(iq);
                    return (
                                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skor Mentah {ageBonus > 0 && '(Disesuaikan)'}</div>
                          
                          {ageBonus > 0 && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #FDE68A' }} title={`Usia: ${age} tahun`}>
                              Bonus Usia +{ageBonus}
                            </div>
                          )}
                          
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A' }}>
                            {adjustedRawScore} <span style={{fontSize:'1.2rem', color:'#94A3B8', fontWeight: 500}}>/ {questions.length}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, background: '#D1FAE5', padding: '4px 10px', borderRadius: '12px' }}>✓ BENAR ASLI: {rawScore}</span>
                            <span style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 700, background: '#FEE2E2', padding: '4px 10px', borderRadius: '12px' }}>✕ SALAH: {questions.length - rawScore}</span>
                          </div>
                        </div>
                        <div style={{ flex: '1 1 200px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>IQ WPT</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A' }}>{iq}</div>
                        </div>
                        <div style={{ flex: '1 1 200px', background: cls.bg, border: `1px solid ${cls.color}40`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: cls.color, fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Klasifikasi</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: cls.color }}>{cls.label}</div>
                          <div style={{ fontSize: '0.95rem', color: cls.color, marginTop: '0.25rem', fontWeight: 600 }}>{cls.full}</div>
                        </div>
                      </div>
                    );
                  } else if (selectedTest.startsWith('IST')) {
                    const wp = getISTWP(selectedTest, rawScore);
                    const cls = getISTClassification(selectedTest, rawScore);
                                        return (
                                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skor Mentah</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A' }}>{rawScore} <span style={{fontSize:'1.2rem', color:'#94A3B8', fontWeight: 500}}>/ {questions.length}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, background: '#D1FAE5', padding: '4px 10px', borderRadius: '12px' }}>✓ BENAR: {rawScore}</span>
                            <span style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 700, background: '#FEE2E2', padding: '4px 10px', borderRadius: '12px' }}>✕ SALAH: {questions.length - rawScore}</span>
                          </div>
                        </div>
                        <div style={{ flex: '1 1 200px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>WP IST</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A' }}>{wp}</div>
                        </div>
                        <div style={{ flex: '1 1 200px', background: cls.bg, border: `1px solid ${cls.color}40`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: cls.color, fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Klasifikasi</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: cls.color }}>{cls.label}</div>
                          <div style={{ fontSize: '0.95rem', color: cls.color, marginTop: '0.25rem', fontWeight: 600 }}>{cls.full}</div>
                        </div>
                      </div>
                    );
                  } else if (selectedTest === 'DISC') {
                    let dM = 0, iM = 0, sM = 0, cM = 0;
                    let dL = 0, iL = 0, sL = 0, cL = 0;

                    questions.forEach((q, idx) => {
                      const ans = currentAnswers.find((a: any) => a.questionId === q.id);
                      if (ans) {
                        try {
                          const parsed = JSON.parse(ans.selectedOption);
                          const qNum = idx + 1;
                          if (discScoringKeys[qNum]) {
                            const mappedMost = discScoringKeys[qNum].most[parsed.most];
                            if (mappedMost === 'D') dM++;
                            if (mappedMost === 'I') iM++;
                            if (mappedMost === 'S') sM++;
                            if (mappedMost === 'C') cM++;
                            
                            const mappedLeast = discScoringKeys[qNum].least[parsed.least];
                            if (mappedLeast === 'D') dL++;
                            if (mappedLeast === 'I') iL++;
                            if (mappedLeast === 'S') sL++;
                            if (mappedLeast === 'C') cL++;
                          }
                        } catch(e) {}
                      }
                    });

                    const diffD = dM - dL;
                    const diffI = iM - iL;
                    const diffS = sM - sL;
                    const diffC = cM - cL;

                    const scaleD = getDiscScale('D', diffD);
                    const scaleI = getDiscScale('I', diffI);
                    const scaleS = getDiscScale('S', diffS);
                    const scaleC = getDiscScale('C', diffC);

                    const getSvgY = (metric: string, score: number) => {
                      return 100 - mapScoreToYPercent(metric, score);
                    };

                    const mostPoints = `12.5,${getSvgY('DM', dM)} 37.5,${getSvgY('IM', iM)} 62.5,${getSvgY('SM', sM)} 87.5,${getSvgY('CM', cM)}`;
                    const leastPoints = `12.5,${getSvgY('DL', dL)} 37.5,${getSvgY('IL', iL)} 62.5,${getSvgY('SL', sL)} 87.5,${getSvgY('CL', cL)}`;
                    const changePoints = `12.5,${getSvgY('DC', diffD)} 37.5,${getSvgY('IC', diffI)} 62.5,${getSvgY('SC', diffS)} 87.5,${getSvgY('CC', diffC)}`;

                    const bgScores = {
                      MOST: [
                        { m: 'DM', s: [21, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] },
                        { m: 'IM', s: [19, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] },
                        { m: 'SM', s: [20, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] },
                        { m: 'CM', s: [17, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] }
                      ],
                      LEAST: [
                        { m: 'DL', s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
                        { m: 'IL', s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
                        { m: 'SL', s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
                        { m: 'CL', s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }
                      ],
                      CHANGE: [
                        { m: 'DC', s: [21, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 1, 0, -1, -2, -3, -4, -5, -6, -7, -9, -10, -11, -12, -13] },
                        { m: 'IC', s: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9] },
                        { m: 'SC', s: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10] },
                        { m: 'CC', s: [17, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11] }
                      ]
                    };

                    const drawGraph = (title: string, points: string, color: string, graphType: 'MOST' | 'LEAST' | 'CHANGE', scales?: number[]) => (
                      <div style={{ flex: '1 1 300px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1E293B', background: '#F1F5F9', padding: '8px', borderRadius: '8px' }}>{title}</div>
                        
                        <div style={{ position: 'relative', width: '100%', height: '580px', borderLeft: '2px solid #94A3B8', borderBottom: '2px solid #94A3B8', borderTop: '2px solid #94A3B8', borderRight: '2px solid #94A3B8', paddingRight: '20px' }}>
                           
                           {/* Background Grid Lines */}
                           <div style={{ position: 'absolute', top: '12.5%', left: 0, right: '20px', borderTop: '1px solid #E2E8F0' }}></div>
                           <div style={{ position: 'absolute', top: '25%', left: 0, right: '20px', borderTop: '2px dashed #CBD5E1' }}></div>
                           <div style={{ position: 'absolute', top: '37.5%', left: 0, right: '20px', borderTop: '1px solid #E2E8F0' }}></div>
                           <div style={{ position: 'absolute', top: '50%', left: 0, right: '20px', borderTop: '2px solid #94A3B8' }}></div>
                           <div style={{ position: 'absolute', top: '62.5%', left: 0, right: '20px', borderTop: '1px solid #E2E8F0' }}></div>
                           <div style={{ position: 'absolute', top: '75%', left: 0, right: '20px', borderTop: '2px dashed #CBD5E1' }}></div>
                           <div style={{ position: 'absolute', top: '87.5%', left: 0, right: '20px', borderTop: '1px solid #E2E8F0' }}></div>

                           {/* Vertical column dividers */}
                           <div style={{ position: 'absolute', top: 0, bottom: 0, left: '25%', borderLeft: '1px solid #E2E8F0' }}></div>
                           <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px solid #E2E8F0' }}></div>
                           <div style={{ position: 'absolute', top: 0, bottom: 0, left: '75%', borderLeft: '1px solid #E2E8F0' }}></div>

                           {/* Scale Labels on the Right */}
                           <div style={{ position: 'absolute', top: '0%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B', fontWeight: 'bold' }}>8</div>
                           <div style={{ position: 'absolute', top: '12.5%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B' }}>6</div>
                           <div style={{ position: 'absolute', top: '25%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B', fontWeight: 'bold' }}>4</div>
                           <div style={{ position: 'absolute', top: '37.5%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B' }}>2</div>
                           <div style={{ position: 'absolute', top: '50%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B', fontWeight: 'bold' }}>0</div>
                           <div style={{ position: 'absolute', top: '62.5%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B' }}>-2</div>
                           <div style={{ position: 'absolute', top: '75%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B', fontWeight: 'bold' }}>-4</div>
                           <div style={{ position: 'absolute', top: '87.5%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B' }}>-6</div>
                           <div style={{ position: 'absolute', top: '100%', right: '5px', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#64748B', fontWeight: 'bold' }}>-8</div>

                           {/* Background Numbers */}
                           {bgScores[graphType].map((col, cIdx) => (
                             <div key={cIdx}>
                               {col.s.map((s, sIdx) => {
                                  const yPerc = 100 - mapScoreToYPercent(col.m, s);
                                  const xPerc = [12.5, 37.5, 62.5, 87.5][cIdx];
                                                                    return (
<div key={sIdx} style={{
                                      position: 'absolute',
                                      left: `${xPerc}%`,
                                      top: `${yPerc}%`,
                                      transform: 'translate(-50%, -50%)',
                                      fontSize: '0.65rem',
                                      color: '#94A3B8',
                                      pointerEvents: 'none',
                                      zIndex: 1
                                    }}>
                                      {s}
                                    </div>
                                  );
                               })}
                             </div>
                           ))}

                           {/* The dynamic chart line */}
                           <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, right: '20px', width: 'calc(100% - 20px)', overflow: 'visible', zIndex: 5 }}>
                             <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                           </svg>
                           
                           {/* Chart dots using HTML for perfect un-stretched circles */}
                           {points.split(' ').map((p, i) => {
                             const [x, y] = p.split(',');
                               return (<div key={i} style={{
                                 position: 'absolute',
                                 left: `calc(${x}% * 0.9 + ${x}% * 0.1)`, /* Adjusting for right padding implicitly by using absolute on the container */
                                 // Wait, the SVG is width: calc(100% - 20px). 
                                 // To align the dot perfectly with the SVG, we can put it inside a div that matches the SVG bounds
                                 display: 'none'
                               }} />
                             )
                           })}
                           
                           {/* Container for dots matching SVG dimensions exactly */}
                           <div style={{ position: 'absolute', top: 0, left: 0, right: '20px', height: '100%', zIndex: 10 }}>
                             {points.split(' ').map((p, i) => {
                               const [x, y] = p.split(',');
                               return (<div key={i} style={{
                                   position: 'absolute',
                                   left: `${x}%`,
                                   top: `${y}%`,
                                   width: '10px',
                                   height: '10px',
                                   backgroundColor: color,
                                   borderRadius: '50%',
                                   transform: 'translate(-50%, -50%)',
                                   border: '2px solid white',
                                   boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                 }} />
                               )
                             })}
                           </div>
                           
                           <div style={{ position: 'absolute', bottom: '-25px', left: '12.5%', transform: 'translateX(-50%)', fontWeight: 'bold', color: '#0F172A', background: 'white', padding: '0 4px' }}>D</div>
                           <div style={{ position: 'absolute', bottom: '-25px', left: '37.5%', transform: 'translateX(-50%)', fontWeight: 'bold', color: '#0F172A', background: 'white', padding: '0 4px' }}>I</div>
                           <div style={{ position: 'absolute', bottom: '-25px', left: '62.5%', transform: 'translateX(-50%)', fontWeight: 'bold', color: '#0F172A', background: 'white', padding: '0 4px' }}>S</div>
                           <div style={{ position: 'absolute', bottom: '-25px', left: '87.5%', transform: 'translateX(-50%)', fontWeight: 'bold', color: '#0F172A', background: 'white', padding: '0 4px' }}>C</div>
                        </div>
                        {scales && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '45px', padding: '0 10px' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skala D</div><div style={{ fontWeight: '800', fontSize: '1.4rem', color: '#0F172A' }}>{scales[0]}</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skala I</div><div style={{ fontWeight: '800', fontSize: '1.4rem', color: '#0F172A' }}>{scales[1]}</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skala S</div><div style={{ fontWeight: '800', fontSize: '1.4rem', color: '#0F172A' }}>{scales[2]}</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skala C</div><div style={{ fontWeight: '800', fontSize: '1.4rem', color: '#0F172A' }}>{scales[3]}</div></div>
                          </div>
                        )}
                      </div>
                    );
                    return (
                                        <div style={{ marginTop: '2rem' }}>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                          <h3 style={{ margin: '0 0 1rem 0', color: '#1E293B', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rekapitulasi Skor Mentah</h3>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'white', borderRadius: '8px', overflow: 'hidden', minWidth: '400px' }}>
                              <thead>
                                <tr style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  <th style={{ padding: '16px', border: '1px solid #E2E8F0' }}>Dimensi</th>
                                  <th style={{ padding: '16px', border: '1px solid #E2E8F0' }}>Mask Publik (Most)</th>
                                  <th style={{ padding: '16px', border: '1px solid #E2E8F0' }}>Inti Diri (Least)</th>
                                  <th style={{ padding: '16px', border: '1px solid #E2E8F0' }}>Cermin Diri (Change)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '800', color: '#DC2626', fontSize: '1.1rem' }}>D</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{dM}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{dL}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{diffD}</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '800', color: '#EAB308', fontSize: '1.1rem' }}>I</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{iM}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{iL}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{diffI}</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '800', color: '#16A34A', fontSize: '1.1rem' }}>S</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{sM}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{sL}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{diffS}</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '800', color: '#2563EB', fontSize: '1.1rem' }}>C</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{cM}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{cL}</td>
                                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: '700', fontSize: '1.1rem' }}>{diffC}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                          {drawGraph('Grafik 1: Mask Publik (Most)', mostPoints, '#2563EB', 'MOST')}
                          {drawGraph('Grafik 2: Inti Diri (Least)', leastPoints, '#DC2626', 'LEAST')}
                          {drawGraph('Grafik 3: Cermin Diri (Change)', changePoints, '#16A34A', 'CHANGE', [scaleD, scaleI, scaleS, scaleC])}
                        </div>
                      </div>
                    );
                  } else if (selectedTest.startsWith('PAPI')) {
                    // PAPI Kostick Score Calculation
                    const scores: Record<string, number> = { N: 0, G: 0, A: 0, L: 0, P: 0, I: 0, T: 0, V: 0, X: 0, S: 0, B: 0, O: 0, R: 0, D: 0, C: 0, Z: 0, E: 0, K: 0, F: 0, W: 0 };
                    
                    questions.forEach((q, idx) => {
                      const ans = currentAnswers.find((a: any) => a.questionId === q.id);
                      if (ans) {
                        try {
                          const parsed = JSON.parse(ans.selectedOption);
                          const qNum = idx + 1;
                          if (papiScoringKeys[qNum]) {
                            let choice = '';
                            if (parsed === 'A' || parsed === 'B') choice = parsed;
                            else if (parsed.answer) choice = parsed.answer;
                            else if (parsed.selectedOption) choice = parsed.selectedOption;
                            else if (typeof parsed === 'string') choice = parsed;

                            if (choice === 'A' && papiScoringKeys[qNum].A) {
                              scores[papiScoringKeys[qNum].A]++;
                            } else if (choice === 'B' && papiScoringKeys[qNum].B) {
                              scores[papiScoringKeys[qNum].B]++;
                            }
                          }
                        } catch(e) {
                          const qNum = idx + 1;
                          const choice = ans.selectedOption;
                          if (papiScoringKeys[qNum]) {
                            if (choice === 'A' && papiScoringKeys[qNum].A) scores[papiScoringKeys[qNum].A]++;
                            else if (choice === 'B' && papiScoringKeys[qNum].B) scores[papiScoringKeys[qNum].B]++;
                          }
                        }
                      }
                    });

                    // Configuration for Radar Chart
                    const getPapiNorm = (trait: string, score: number) => {
                      if (trait === 'L' || trait === 'P') return score <= 4 ? '2-' : score <= 7 ? '3' : score === 8 ? '4' : '5';
                      if (trait === 'I') return score <= 2 ? '2-' : score <= 5 ? '3' : score === 6 ? '4' : score === 7 ? '5' : '2+';
                      if (trait === 'C') return score <= 2 ? '2-' : score === 3 ? '3' : score === 4 ? '4' : score === 5 ? '5' : '2+';
                      if (trait === 'D') return score <= 3 ? '2-' : score <= 6 ? '3' : score <= 8 ? '4' : '5';
                      if (trait === 'R') return score <= 4 ? 'P' : 'T';
                      if (trait === 'N' || trait === 'A') return score <= 2 ? '2-' : score <= 5 ? '3' : score <= 8 ? '4' : '5';
                      if (trait === 'G') return score <= 2 ? '2-' : score <= 5 ? '3' : score === 6 ? '4' : score === 7 ? '5' : '2+';
                      if (trait === 'F') return score <= 1 ? '2-' : score <= 3 ? '3' : score === 4 ? '4' : score === 5 ? '5' : '2+';
                      if (trait === 'W') return score <= 4 ? '2-' : score <= 7 ? '3' : score === 8 ? '4' : '5';
                      if (trait === 'T') return score <= 3 ? '2-' : score === 4 ? '3' : score === 5 ? '4' : score === 6 ? '5' : '2+';
                      if (trait === 'V') return score <= 4 ? '2-' : score <= 7 ? '3' : score === 8 ? '4' : '5';
                      if (trait === 'Z') return score <= 2 ? '2-' : score <= 5 ? '3' : score === 6 ? '4' : score === 7 ? '5' : '2+';
                      if (trait === 'E') return score <= 1 ? '2-' : score <= 4 ? '3' : score === 5 ? '4' : score === 6 ? '5' : '2+';
                      if (trait === 'K') return score <= 2 ? '2-' : score === 3 ? '5' : score === 4 ? '4' : score <= 7 ? '3' : '2+';
                      if (trait === 'X') return score <= 1 ? '2-' : score <= 3 ? '3' : score === 4 ? '4' : score === 5 ? '5' : '2+';
                      if (trait === 'S') return score <= 5 ? '2-' : score <= 7 ? '3' : score === 8 ? '4' : '5';
                      if (trait === 'B' || trait === 'O') return score <= 2 ? '2-' : score === 3 ? '3' : score === 4 ? '4' : score === 5 ? '5' : '2+';
                      return '-';
                    };

                    const papiOrder = ['N', 'G', 'A', 'L', 'P', 'I', 'T', 'V', 'X', 'S', 'B', 'O', 'R', 'D', 'C', 'Z', 'E', 'K', 'F', 'W'];
                    const papiClusters = [
                      { name: 'Work Direction', traits: ['N', 'G', 'A'], color: '#2563EB' },
                      { name: 'Leadership', traits: ['L', 'P', 'I'], color: '#DC2626' },
                      { name: 'Activity', traits: ['T', 'V'], color: '#D97706' },
                      { name: 'Social Nature', traits: ['X', 'S', 'B', 'O'], color: '#059669' },
                      { name: 'Work Style', traits: ['R', 'D', 'C'], color: '#7C3AED' },
                      { name: 'Temperament', traits: ['Z', 'E', 'K'], color: '#DB2777' },
                      { name: 'Followership', traits: ['F', 'W'], color: '#4B5563' }
                    ];

                    const size = 800;
                    const center = size / 2;
                    const radarMax = 220; 
                    
                    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
                      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                      return {
                        x: cx + (r * Math.cos(angleInRadians)),
                        y: cy + (r * Math.sin(angleInRadians))
                      };
                    };

                    const describeArc = (cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
                      const p1 = polarToCartesian(cx, cy, outerRadius, startAngle);
                      const p2 = polarToCartesian(cx, cy, outerRadius, endAngle);
                      const p3 = polarToCartesian(cx, cy, innerRadius, endAngle);
                      const p4 = polarToCartesian(cx, cy, innerRadius, startAngle);
                      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                      return [
                        "M", p1.x, p1.y,
                        "A", outerRadius, outerRadius, 0, largeArcFlag, 1, p2.x, p2.y,
                        "L", p3.x, p3.y,
                        "A", innerRadius, innerRadius, 0, largeArcFlag, 0, p4.x, p4.y,
                        "Z"
                      ].join(" ");
                    };
                    
                    const getTextPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
                      const midAngle = (startAngle + endAngle) / 2;
                      const isBottom = midAngle > 90 && midAngle < 270;
                      if (isBottom) {
                        const p1 = polarToCartesian(cx, cy, radius, endAngle);
                        const p2 = polarToCartesian(cx, cy, radius, startAngle);
                        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                        return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${p2.x} ${p2.y}`;
                      } else {
                        const p1 = polarToCartesian(cx, cy, radius, startAngle);
                        const p2 = polarToCartesian(cx, cy, radius, endAngle);
                        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                        return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`;
                      }
                    };

                    const getCoordinatesForValue = (trait: string, value: number, index: number) => {
                      const angle = index * 18 + 9;
                      const isReverse = ['Z', 'E', 'K'].includes(trait);
                      const r = isReverse ? ((9 - value) / 9) * radarMax : (value / 9) * radarMax;
                      return polarToCartesian(center, center, r, angle);
                    };

                    const categories = [
                      { name: 'ARAH KERJA', start: 0, end: 54, color: '#DC2626' },
                      { name: 'KEPEMIMPINAN', start: 54, end: 108, color: '#C026D3' },
                      { name: 'AKTIFITAS', start: 108, end: 144, color: '#2563EB' },
                      { name: 'PERGAULAN', start: 144, end: 216, color: '#06B6D4' },
                      { name: 'GAYA KERJA', start: 216, end: 270, color: '#10B981' },
                      { name: 'SIFAT', start: 270, end: 324, color: '#EAB308' },
                      { name: 'KETAATAN', start: 324, end: 360, color: '#F97316' },
                    ];
                    
                    const papiWheel = [
                      { trait: 'N', label: ['Menyelesaikan', 'Tugas Pribadi'] },
                      { trait: 'G', label: ['Peranan Sbg', 'Pekerja Keras'] },
                      { trait: 'A', label: ['Hasrat untuk', 'Berprestasi'] },
                      { trait: 'L', label: ['Peranan Sbg', 'Pemimpin'] },
                      { trait: 'P', label: ['Mengendalikan', 'Orang Lain'] },
                      { trait: 'I', label: ['Mudah Membuat', 'Keputusan'] },
                      { trait: 'T', label: ['Tempo Kerja'] },
                      { trait: 'V', label: ['Stamina'] },
                      { trait: 'S', label: ['Pergaulan', 'Luas'] },
                      { trait: 'B', label: ['Kebutuhan', 'Terhadap', 'Kelompok'] },
                      { trait: 'O', label: ['Kebutuhan utk', 'Mendekati', 'dan Menyayangi'] },
                      { trait: 'X', label: ['Mendapatkan', 'Perhatian'] },
                      { trait: 'C', label: ['Suka Pekerjaan', 'yang Teratur'] },
                      { trait: 'D', label: ['Suka Pekerjaan', 'yang Terperinci'] },
                      { trait: 'R', label: ['Tipe Teoritis'] },
                      { trait: 'Z', label: ['Hasrat untuk', 'Berubah'] },
                      { trait: 'E', label: ['Pengendalian', 'Emosi'] },
                      { trait: 'K', label: ['Agresifitas'] },
                      { trait: 'F', label: ['Dukungan', 'utk Atasan'] },
                      { trait: 'W', label: ['Kebutuhan utk', 'Taat Aturan', 'dan Arahan'] },
                    ];

                    const polygonPoints = papiWheel.map((item, i) => {
                      const pos = getCoordinatesForValue(item.trait, scores[item.trait] || 0, i);
                      return `${pos.x},${pos.y}`;
                    }).join(' ');

                    return (
                                        <div style={{ marginTop: '2rem' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
                          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1E293B', fontSize: '1.25rem', textAlign: 'center' }}>Grafik Cakram PAPI Kostick</h3>
                          
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto', padding: '1rem 0' }}>
                            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', fontFamily: 'sans-serif' }}>
                              <defs>
                                {categories.map((cat, i) => (
                                  <path key={`path-${i}`} id={`catPath-${i}`} d={getTextPath(center, center, 360, cat.start, cat.end)} fill="none" />
                                ))}
                              </defs>

                              {/* Categories Outer Band */}
                              {categories.map((cat, i) => (
                                <g key={`cat-${i}`}>
                                  <path d={describeArc(center, center, 340, 380, cat.start, cat.end)} fill={cat.color} stroke="white" strokeWidth="2" />
                                  <text fill="white" fontSize="18" fontWeight="800" letterSpacing="1">
                                    <textPath href={`#catPath-${i}`} startOffset="50%" textAnchor="middle" dominantBaseline="middle">
                                      {cat.name}
                                    </textPath>
                                  </text>
                                </g>
                              ))}

                              {/* Letter Band */}
                              {papiWheel.map((item, i) => {
                                const angle = i * 18;
                                let catIdx = 0;
                                categories.forEach((c, cidx) => { if (angle >= c.start && angle < c.end) catIdx = cidx; });
                                const isLightGreen = catIdx % 2 !== 0;
                                const greenColor = isLightGreen ? '#A3E635' : '#65A30D';
                                const textPos = polarToCartesian(center, center, 320, angle + 9);
                                
                                                                return (
                                                                <g key={`letter-${i}`}>
                                    <path d={describeArc(center, center, 300, 340, angle, angle + 18)} fill={greenColor} stroke="white" strokeWidth="2" />
                                    <text x={textPos.x} y={textPos.y} fill="white" fontSize="24" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                                      {item.trait}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Description Band */}
                              {papiWheel.map((item, i) => {
                                const angle = i * 18;
                                const midAngle = angle + 9;
                                const textPos = polarToCartesian(center, center, 260, midAngle);
                                const isBottom = midAngle > 90 && midAngle < 270;
                                const rotAngle = isBottom ? midAngle - 180 : midAngle;
                                
                                                                return (
                                                                <g key={`desc-${i}`}>
                                    <path d={describeArc(center, center, 220, 300, angle, angle + 18)} fill="#FEF9C3" stroke="white" strokeWidth="2" />
                                    <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${rotAngle})`}>
                                      {item.label.map((line, lidx) => (
                                        <text key={lidx} y={(lidx - (item.label.length - 1)/2) * 12} fill="#475569" fontSize="9" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
                                          {line}
                                        </text>
                                      ))}
                                    </g>
                                  </g>
                                );
                              })}

                              {/* Radar Area & Concentric Circles */}
                              <circle cx={center} cy={center} r={radarMax} fill="white" />
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => {
                                return (
                                  <circle key={`rad-${val}`} cx={center} cy={center} r={(val / 9) * radarMax} fill="none" stroke={val === 9 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 9 ? 2 : 1} strokeDasharray={val === 9 ? '0' : '4 4'} />
                                );
                              })}

                              {/* Radar Spokes & Values */}
                              {papiWheel.map((item, i) => {
                                const angle = i * 18 + 9;
                                const edgePos = polarToCartesian(center, center, radarMax, angle);
                                const isReverse = ['Z', 'E', 'K'].includes(item.trait);
                                
                                return (
                                  <g key={`spoke-${i}`}>
                                    <line x1={center} y1={center} x2={edgePos.x} y2={edgePos.y} stroke="#E2E8F0" strokeWidth="1" />
                                    
                                    {/* Draw numbers 1-9 along the spoke */}
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(val => {
                                      const scoreVal = isReverse ? (9 - val) : val;
                                      const pos = polarToCartesian(center, center, (val / 9) * radarMax, angle);
                                      // Add slight rotation to text so it aligns with the spoke
                                      const textRot = (angle > 90 && angle < 270) ? angle - 180 : angle;
                                      return (
                                        <g key={`val-${val}`} transform={`translate(${pos.x}, ${pos.y}) rotate(${textRot})`}>
                                          <rect x="-4" y="-6" width="8" height="12" fill="white" opacity="0.7" />
                                          <text fill="#64748B" fontSize="9" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
                                            {scoreVal}
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </g>
                                );
                              })}
                              <circle cx={center} cy={center} r="2" fill="#1E293B" />

                              {/* Data Polygon */}
                              <polygon points={polygonPoints} fill="rgba(37, 99, 235, 0.2)" stroke="#2563EB" strokeWidth="2.5" />
                              
                              {/* Data Points */}
                              {papiWheel.map((item, i) => {
                                const pos = getCoordinatesForValue(item.trait, scores[item.trait] || 0, i);
                                return (
                                  <circle key={`dot-${i}`} cx={pos.x} cy={pos.y} r="5" fill="#2563EB" stroke="white" strokeWidth="2" />
                                );
                              })}
                            </svg>
                          </div>
                        </div>

                        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1E293B', fontSize: '1.25rem' }}>Detail Skor PAPI Kostick</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {papiClusters.map(cluster => (
                              <div key={cluster.name} style={{ background: '#F8FAFC', border: `1px solid ${cluster.color}40`, borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ background: cluster.color, color: 'white', padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  {cluster.name}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                  {cluster.traits.map(trait => (
                                    <div key={trait} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                                      <div style={{ width: '25px', fontWeight: 800, color: cluster.color }}>{trait}</div>
                                      <div style={{ flex: 1, background: '#E2E8F0', height: '8px', borderRadius: '4px', margin: '0 1rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${(scores[trait] / 9) * 100}%`, background: cluster.color, borderRadius: '4px' }}></div>
                                      </div>
                                      <div style={{ width: '25px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>{scores[trait]}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tabel Norma PAPI */}
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginTop: '2rem' }}>
                          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1E293B', fontSize: '1.25rem' }}>Tabel Konversi Norma</h3>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Kode</th>
                                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Aspek</th>
                                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Skor Mentah</th>
                                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Norma</th>
                                </tr>
                              </thead>
                              <tbody>
                                {papiOrder.map((trait, idx) => {
                                  const labelData = papiWheel.find(p => p.trait === trait);
                                  const label = labelData ? labelData.label.join(' ') : trait;
                                                                    return (
<tr key={trait} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                                      <td style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>{trait}</td>
                                      <td style={{ padding: '1rem', color: '#64748B', fontWeight: 500 }}>{label}</td>
                                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>{scores[trait]}</td>
                                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ 
                                          background: '#E0E7FF', 
                                          color: '#4338CA',
                                          border: '1px solid #C7D2FE',
                                          borderRadius: '8px',
                                          padding: '4px 12px',
                                          fontSize: '0.9rem',
                                          fontWeight: 800 
                                        }}>
                                          {getPapiNorm(trait, scores[trait])}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
