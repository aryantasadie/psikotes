'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export const DEFAULT_PRESET_MAPPING = [
  { category: "KEMAMPUAN KOGNITIF", aspects: [
    { name: "IQ / Kapasitas Intelektual", checked: true, instruments: ["WPT"] },
    { name: "Daya Analisa",              checked: true, instruments: ["IST Subtes 3"] },
    { name: "Logika Berpikir",           checked: true, instruments: ["IST Subtes 2","IST Subtes 6"] },
    { name: "Daya Abstraksi",            checked: true, instruments: ["IST Subtes 7"] },
    { name: "Problem Solving",           checked: true, instruments: ["IST Subtes 7"] },
  ]},
  { category: "SISI AFEKTIF", aspects: [
    { name: "Stabilitas Emosi",       checked: true, instruments: ["PAPI Skala E","PAPI Skala K"] },
    { name: "Kepekaan Emosi / Sosial",checked: true, instruments: ["PAPI Skala X","PAPI Skala O"] },
    { name: "Kepercayaan Diri",       checked: true, instruments: ["PAPI Skala X","PAPI Skala L","PAPI Skala S"] },
  ]},
  { category: "HUBUNGAN ANTAR MANUSIA", aspects: [
    { name: "Sosiabilitas", checked: true, instruments: ["PAPI Skala O","PAPI Skala S","PAPI Skala B","PAPI Skala X"] },
    { name: "Adaptasi",     checked: true, instruments: ["PAPI Skala S","PAPI Skala Z"] },
    { name: "Komunikasi",   checked: true, instruments: ["PAPI Skala S"] },
  ]},
  { category: "SIKAP KERJA", aspects: [
    { name: "Orientasi Berprestasi",  checked: true, instruments: ["PAPI Skala A","PAPI Skala G","PAPI Skala N"] },
    { name: "Daya Juang",             checked: true, instruments: ["PAPI Skala G","PAPI Skala A","PAPI Skala T","PAPI Skala V"] },
    { name: "Kedetailan",             checked: true, instruments: ["PAPI Skala D"] },
    { name: "Sistematika Kerja",      checked: true, instruments: ["PAPI Skala C","PAPI Skala W"] },
    { name: "Kecepatan Kerja",        checked: true, instruments: ["PAPI Skala T"] },
    { name: "Ketelitian Kerja",       checked: true, instruments: ["PAPI Skala D"] },
    { name: "Daya Tahan Stress",      checked: true, instruments: ["PAPI Skala E","PAPI Skala V"] },
    { name: "Kepemimpinan",           checked: true, instruments: ["PAPI Skala L","PAPI Skala P","PAPI Skala I"] },
    { name: "Inisiatif",              checked: true, instruments: ["PAPI Skala P","PAPI Skala I"] },
    { name: "Tanggung Jawab",         checked: true, instruments: ["PAPI Skala N","PAPI Skala P"] },
    { name: "Kerjasama",              checked: true, instruments: ["PAPI Skala B","PAPI Skala F"] },
    { name: "Pengambilan Keputusan",  checked: true, instruments: ["PAPI Skala I"] },
  ]},
];

const papiScoringKeys: Record<number, { A?: string; B?: string }> = {
  1: { A: 'G', B: 'E' }, 31: { A: 'G', B: 'R' }, 61: { A: 'G', B: 'T' },
  2: { A: 'A', B: 'N' }, 32: { A: 'L', B: 'D' }, 62: { A: 'L', B: 'V' },
  3: { A: 'P', B: 'A' }, 33: { A: 'I', B: 'C' }, 63: { A: 'I', B: 'S' },
  4: { A: 'X', B: 'P' }, 34: { A: 'T', B: 'E' }, 64: { A: 'T', B: 'R' },
  5: { A: 'B', B: 'X' }, 35: { A: 'B', B: 'N' }, 65: { A: 'V', B: 'D' },
  6: { A: 'O', B: 'B' }, 36: { A: 'O', B: 'A' }, 66: { A: 'S', B: 'C' },
  7: { A: 'Z', B: 'O' }, 37: { A: 'Z', B: 'P' }, 67: { A: 'R', B: 'E' },
  8: { A: 'K', B: 'Z' }, 38: { A: 'K', B: 'X' }, 68: { A: 'K', B: 'N' },
  9: { A: 'F', B: 'K' }, 39: { A: 'F', B: 'B' }, 69: { A: 'F', B: 'A' },
  10: { A: 'W', B: 'F' }, 40: { A: 'W', B: 'O' }, 70: { A: 'W', B: 'P' },
  11: { A: 'G', B: 'C' }, 41: { A: 'G', B: 'S' }, 71: { A: 'G', B: 'I' },
  12: { A: 'L', B: 'E' }, 42: { A: 'L', B: 'R' }, 72: { A: 'L', B: 'T' },
  13: { A: 'P', B: 'N' }, 43: { A: 'I', B: 'D' }, 73: { A: 'I', B: 'V' },
  14: { A: 'X', B: 'A' }, 44: { A: 'T', B: 'C' }, 74: { A: 'T', B: 'S' },
  15: { A: 'B', B: 'P' }, 45: { A: 'V', B: 'E' }, 75: { A: 'V', B: 'R' },
  16: { A: 'O', B: 'X' }, 46: { A: 'O', B: 'N' }, 76: { A: 'S', B: 'D' },
  17: { A: 'Z', B: 'B' }, 47: { A: 'Z', B: 'A' }, 77: { A: 'R', B: 'C' },
  18: { A: 'K', B: 'O' }, 48: { A: 'K', B: 'P' }, 78: { A: 'D', B: 'E' },
  19: { A: 'F', B: 'Z' }, 49: { A: 'F', B: 'X' }, 79: { A: 'F', B: 'N' },
  20: { A: 'W', B: 'K' }, 50: { A: 'W', B: 'B' }, 80: { A: 'W', B: 'A' },
  21: { A: 'G', B: 'D' }, 51: { A: 'G', B: 'V' }, 81: { A: 'G', B: 'L' },
  22: { A: 'L', B: 'C' }, 52: { A: 'L', B: 'S' }, 82: { A: 'L', B: 'I' },
  23: { A: 'I', B: 'E' }, 53: { A: 'I', B: 'R' }, 83: { A: 'I', B: 'T' },
  24: { A: 'X', B: 'N' }, 54: { A: 'T', B: 'D' }, 84: { A: 'T', B: 'V' },
  25: { A: 'B', B: 'A' }, 55: { A: 'V', B: 'C' }, 85: { A: 'V', B: 'S' },
  26: { A: 'O', B: 'P' }, 56: { A: 'S', B: 'E' }, 86: { A: 'S', B: 'R' },
  27: { A: 'Z', B: 'X' }, 57: { A: 'Z', B: 'N' }, 87: { A: 'R', B: 'D' },
  28: { A: 'K', B: 'B' }, 58: { A: 'K', B: 'A' }, 88: { A: 'D', B: 'C' },
  29: { A: 'F', B: 'O' }, 59: { A: 'F', B: 'P' }, 89: { A: 'C', B: 'E' },
  30: { A: 'W', B: 'Z' }, 60: { A: 'W', B: 'X' }, 90: { A: 'W', B: 'N' }
};

const getTiki1Norm = (r: number) => [0,0,0,0,0,1,1,1,2,3,4,5,6,7,8,8,9,10,10,11,11,12,13,13,14,15,15,16,17,17,18,19,19,20,21,22,22,23,24,26,28][r] ?? 0;
const getTiki2Norm = (r: number) => [4,4,5,5,5,6,7,8,9,9,11,12,13,14,15,16,17,18,19,21,22,24,25,27,29,30,30][r] ?? 4;
const getTiki3Norm = (r: number) => [0,0,0,0,1,1,1,2,2,3,4,4,5,5,6,7,7,8,8,9,10,10,11,12,12,13,14,15,15,16,17,18,19,20,22,24,25,26,28,30,30][r] ?? 0;
const getTiki4Norm = (r: number) => [0,0,3,6,7,9,10,12,13,14,16,17,18,18,19,20,21,21,22,23,24,24,25,25,26,28,29,30,30,30,30][r] ?? 0;

const getTiki6Norm = (r: number) => {
  if (r <= 21) return 0; if (r <= 25) return 1; if (r <= 28) return 2; if (r <= 32) return 3;
  if (r <= 36) return 4; if (r <= 40) return 5; if (r <= 44) return 6; if (r <= 47) return 7;
  if (r <= 51) return 8; if (r <= 53) return 9; if (r <= 56) return 10; if (r <= 58) return 11;
  if (r <= 60) return 12; if (r <= 62) return 13; if (r <= 64) return 14; if (r <= 65) return 15;
  if (r <= 67) return 16; if (r <= 69) return 17; if (r <= 71) return 18; if (r <= 72) return 19;
  if (r <= 73) return 20; if (r <= 78) return 21; if (r <= 85) return 22; if (r <= 90) return 23;
  if (r <= 95) return 24; if (r <= 98) return 25; if (r === 99) return 27; return 29;
};

const getTikiClassification = (s: number) => {
  if (s <= 6) return { label: 'KS', full: 'Kurang Sekali' };
  if (s <= 12) return { label: 'K', full: 'Kurang' };
  if (s <= 18) return { label: 'S', full: 'Sedang' };
  if (s <= 24) return { label: 'B', full: 'Baik' };
  return { label: 'BS', full: 'Baik Sekali' };
};

const getWPTIQ = (r: number) => {
  const map = [59,59,61,64,67,69,71,73,75,78,80,81,83,86,88,90,93,95,97,98,100,102,104,106,108,111,113,114,116,118,120,121,123,125,126,128,130,132,134,136,138,140,142,143];
  if (r >= 44) return 146;
  return map[r] ?? 59;
};

const getISTClassification = (testType: string, r: number) => {
  const ksm = { label: 'KS-' };
  const ksp = { label: 'KS+' };
  const km  = { label: 'K-' };
  const kp  = { label: 'K+' };
  const sm  = { label: 'S-' };
  const sp  = { label: 'S+' };
  const bm  = { label: 'B-' };
  const bp  = { label: 'B+' };
  const bsm = { label: 'BS-' };
  const bsp = { label: 'BS+' };

  if (testType === 'IST 2' || testType === 'IST 7') {
    if (r <= 1) return ksm; if (r <= 3) return ksp; if (r <= 5) return km; if (r <= 7) return kp;
    if (r <= 9) return sm; if (r <= 11) return sp; if (r <= 13) return bm; if (r <= 15) return bp;
    if (r <= 17) return bsm; return bsp;
  } else if (testType === 'IST 3') {
    if (r <= 2) return ksm; if (r <= 4) return ksp; if (r <= 6) return km; if (r <= 8) return kp;
    if (r <= 11) return sm; if (r <= 14) return sp; if (r <= 16) return bm; if (r <= 18) return bp;
    if (r <= 19) return bsm; return bsp;
  } else if (testType === 'IST 6') {
    if (r <= 1) return ksm; if (r <= 3) return ksp; if (r <= 5) return km; if (r <= 7) return kp;
    if (r <= 9) return sm; if (r <= 12) return sp; if (r <= 14) return bm; if (r <= 16) return bp;
    if (r <= 18) return bsm; return bsp;
  }
  return sm;
};

export const getPapiNorm = (trait: string, score: number): string => {
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

export const getPapiNumericNorm = (trait: string, score: number): number => {
  const normStr = getPapiNorm(trait, score);
  if (normStr === '2-' || normStr === '2+' || normStr === '2') return 2;
  if (normStr === '1') return 1;
  if (normStr === '3' || normStr === 'P') return 3;
  if (normStr === '4' || normStr === 'T') return 4;
  if (normStr === '5') return 5;
  return 3;
};

export const checkAnswerMatch = (userAns: any, correctKey: any, testType?: string): boolean => {
  if (userAns === undefined || userAns === null || correctKey === undefined || correctKey === null) return false;

  const strUser = String(userAns).trim();
  const strKey = String(correctKey).trim();

  if (strUser.startsWith('[') && strKey.startsWith('[')) {
    try {
      const uArr = JSON.parse(strUser).map((x: any) => String(x).trim().toLowerCase()).sort();
      const kArr = JSON.parse(strKey).map((x: any) => String(x).trim().toLowerCase()).sort();
      if (JSON.stringify(uArr) === JSON.stringify(kArr)) return true;
    } catch (e) {}
  }

  const cleanU = strUser.toLowerCase().replace(/\s+/g, ' ');
  const cleanK = strKey.toLowerCase().replace(/\s+/g, ' ');
  if (cleanU === cleanK) return true;

  if (cleanK.includes('.') || cleanK.includes(',') || cleanK.includes(' ')) {
    const keyParts = cleanK.split(/[\.,\s]+/).filter(Boolean).sort();
    const userParts = cleanU.split(/[\.,\s]+/).filter(Boolean).sort();
    if (keyParts.length > 1 && keyParts.length === userParts.length) {
      if (JSON.stringify(keyParts) === JSON.stringify(userParts)) return true;
    }
  }

  const parseNumOrFraction = (val: string): number | null => {
    let s = val.trim().toLowerCase();
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');

    const mixedMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const num = parseFloat(mixedMatch[2]);
      const den = parseFloat(mixedMatch[3]);
      if (den !== 0) return whole + (num / den);
    }

    const fracMatch = s.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
    if (fracMatch) {
      const num = parseFloat(fracMatch[1].replace(',', '.'));
      const den = parseFloat(fracMatch[2].replace(',', '.'));
      if (den !== 0) return num / den;
    }

    const dec = s.replace(',', '.');
    const parsed = parseFloat(dec);
    if (!isNaN(parsed) && String(parsed) === dec || (!isNaN(parsed) && !isNaN(Number(dec)))) {
      return parsed;
    }
    return null;
  };

  const numUser = parseNumOrFraction(cleanU);
  const numKey = parseNumOrFraction(cleanK);
  if (numUser !== null && numKey !== null) {
    if (Math.abs(numUser - numKey) < 0.0001) return true;
  }

  const revU = cleanU.split('').reverse().join('');
  if (revU === cleanK) return true;

  const digitsU = cleanU.replace(/\D/g, '');
  const digitsK = cleanK.replace(/\D/g, '');
  if (digitsU.length > 0 && digitsU.length === digitsK.length) {
    if (digitsU.split('').reverse().join('') === digitsK) return true;
  }

  if (cleanK.startsWith(cleanU + '.') || cleanK.startsWith(cleanU + ' ') || cleanK.startsWith(cleanU + ')')) {
    return true;
  }

  return false;
};

export default function ReportPdfPage() {
  const params = useParams();
  const id = params.id as string;
  const [participant, setParticipant] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/superadmin/reports/${id}`)
      .then(res => res.json())
      .then(data => setParticipant(data));
  }, [id]);

  const computerScores = React.useMemo(() => {
    const scores: Record<string, number> = {};
    if (!participant || !participant.answers) return scores;

    const calculateWptScale = () => {
      const wptAnswers = participant.answers.filter((a: any) => 
        a.question && (a.question.testType === 'WPT' || a.question.testType === 'WPT_AGE')
      );
      if (wptAnswers.length === 0) return null;

      let wptCorrect = 0;
      wptAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        if (checkAnswerMatch(ans.selectedOption, ans.question.correct, 'WPT')) wptCorrect++;
      });

      const ageRaw = participant.rawResults?.find((r: any) => r.testType === 'WPT_AGE');
      const age = ageRaw ? parseInt(ageRaw.rawData, 10) : null;
      let ageBonus = 0;
      if (age !== null && !isNaN(age)) {
        if (age >= 30 && age <= 39) ageBonus = 1;
        else if (age >= 40 && age <= 49) ageBonus = 2;
        else if (age >= 50 && age <= 59) ageBonus = 3;
        else if (age >= 60) ageBonus = 4;
      }

      const adjustedRawScore = Math.min(50, wptCorrect + ageBonus);
      const iq = getWPTIQ(adjustedRawScore);
      if (iq <= 79) return 1;
      else if (iq <= 89) return 2;
      else if (iq <= 109) return 3;
      else if (iq <= 119) return 4;
      else return 5;
    };

    const calculateIstScale = (subtest: string) => {
      const istAnswers = participant.answers.filter((a: any) => 
        a.question && a.question.testType === subtest
      );
      if (istAnswers.length === 0) return null;

      let correct = 0;
      istAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        if (checkAnswerMatch(ans.selectedOption, ans.question.correct, subtest)) correct++;
      });

      const cls = getISTClassification(subtest, correct);
      if (cls.label.startsWith('KS')) return 1;
      if (cls.label.startsWith('K')) return 2;
      if (cls.label.startsWith('S') || cls.label.startsWith('C')) return 3;
      if (cls.label.startsWith('B') && !cls.label.startsWith('BS')) return 4;
      if (cls.label.startsWith('BS')) return 5;
      return 3;
    };

    const calculateTikiScale = (subtest: string) => {
      const tikiAnswers = participant.answers.filter((a: any) => 
        a.question && a.question.testType === subtest
      );
      if (tikiAnswers.length === 0) return null;

      let correct = 0;
      tikiAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        if (checkAnswerMatch(ans.selectedOption, ans.question.correct, subtest)) correct++;
      });

      let stdScore = correct;
      if (subtest === 'TIKI 1') stdScore = getTiki1Norm(correct);
      else if (subtest === 'TIKI 2') stdScore = getTiki2Norm(correct);
      else if (subtest === 'TIKI 3') stdScore = getTiki3Norm(correct);
      else if (subtest === 'TIKI 4') stdScore = getTiki4Norm(correct);
      else if (subtest === 'TIKI 6') stdScore = getTiki6Norm(correct);

      const cls = getTikiClassification(stdScore);
      if (cls.label === 'KS') return 1;
      if (cls.label === 'K') return 2;
      if (cls.label === 'S' || cls.label === 'C') return 3;
      if (cls.label === 'B') return 4;
      if (cls.label === 'BS') return 5;
      return 3;
    };

    const avgFloor = (...items: (number | null | undefined)[]) => {
      const valid = items.filter((n): n is number => typeof n === 'number' && !isNaN(n));
      if (valid.length === 0) return 3;
      const sum = valid.reduce((a, b) => a + b, 0);
      return Math.max(1, Math.min(5, Math.floor(sum / valid.length)));
    };

    // PAPI Raw
    const papiRaw: Record<string, number> = { N: 0, G: 0, A: 0, L: 0, P: 0, I: 0, T: 0, V: 0, X: 0, S: 0, B: 0, O: 0, R: 0, D: 0, C: 0, Z: 0, E: 0, K: 0, F: 0, W: 0 };
    let hasPapi = false;
    const rawPapiAnswers = participant.answers.filter((a: any) => 
      a.question && (a.question.testType === 'PAPI' || a.question.testType === 'PAPI_KOSTICK' || a.question.testType === 'PAPI KOSTICK')
    );
    if (rawPapiAnswers.length > 0) {
      hasPapi = true;
      const sortedPapi = [...rawPapiAnswers].sort((a: any, b: any) => (a.question?.id || a.questionId) - (b.question?.id || b.questionId));
      sortedPapi.forEach((ans: any, idx: number) => {
        const qNum = idx + 1;
        let choice = '';
        try {
          const parsed = JSON.parse(ans.selectedOption);
          if (parsed === 'A' || parsed === 'B') choice = parsed;
          else if (parsed.answer) choice = parsed.answer;
          else if (parsed.selectedOption) choice = parsed.selectedOption;
          else if (typeof parsed === 'string') choice = parsed;
        } catch (e) {
          choice = ans.selectedOption;
        }
        if (papiScoringKeys[qNum]) {
          if (choice === 'A' && papiScoringKeys[qNum].A) papiRaw[papiScoringKeys[qNum].A]++;
          else if (choice === 'B' && papiScoringKeys[qNum].B) papiRaw[papiScoringKeys[qNum].B]++;
        }
      });
    }

    const wptVal = calculateWptScale();
    const ist1Val = calculateIstScale('IST 1');
    const ist2Val = calculateIstScale('IST 2');
    const ist3Val = calculateIstScale('IST 3');
    const ist4Val = calculateIstScale('IST 4');
    const ist5Val = calculateIstScale('IST 5');
    const ist6Val = calculateIstScale('IST 6');
    const ist7Val = calculateIstScale('IST 7');
    const ist8Val = calculateIstScale('IST 8');
    const ist9Val = calculateIstScale('IST 9');
    const tiki1Val = calculateTikiScale('TIKI 1');
    const tiki2Val = calculateTikiScale('TIKI 2');
    const tiki3Val = calculateTikiScale('TIKI 3');
    const tiki4Val = calculateTikiScale('TIKI 4');
    const tiki6Val = calculateTikiScale('TIKI 6');

    const cogScale = wptVal ?? tiki6Val ?? ist3Val ?? 3;
    const verbalScale = avgFloor(ist2Val, tiki3Val, wptVal);
    const logicScale = avgFloor(ist3Val, ist6Val, wptVal);
    const abstractScale = avgFloor(ist4Val, ist6Val, ist7Val, ist8Val, tiki6Val, wptVal);
    const numericScale = avgFloor(ist5Val, ist6Val, tiki1Val, wptVal);
    const catchScale = avgFloor(ist1Val, ist9Val, wptVal);

    scores['IQ / Kapasitas Intelektual'] = cogScale;
    scores['Inteligensi Umum'] = cogScale;
    scores['Kemampuan Kognitif'] = cogScale;
    scores['Daya Analisa'] = logicScale;
    scores['Logika Berpikir'] = logicScale;
    scores['Daya Abstraksi'] = abstractScale;
    scores['Pemahaman Verbal'] = verbalScale;
    scores['Kemampuan Numerik'] = numericScale;
    scores['Problem Solving'] = avgFloor(cogScale, logicScale, wptVal);
    scores['Daya Tangkap'] = catchScale;

    if (hasPapi) {
      scores['Orientasi Berprestasi'] = getPapiNumericNorm('A', papiRaw.A);
      scores['Daya Juang'] = avgFloor(getPapiNumericNorm('G', papiRaw.G), getPapiNumericNorm('N', papiRaw.N), getPapiNumericNorm('A', papiRaw.A));
      scores['Kedetailan'] = getPapiNumericNorm('D', papiRaw.D);
      scores['Ketelitian Kerja'] = avgFloor(getPapiNumericNorm('D', papiRaw.D), getPapiNumericNorm('W', papiRaw.W));
      scores['Sistematika Kerja'] = avgFloor(getPapiNumericNorm('C', papiRaw.C), getPapiNumericNorm('W', papiRaw.W));
      scores['Kecepatan Kerja'] = getPapiNumericNorm('T', papiRaw.T);
      scores['Daya Tahan Stress'] = avgFloor(getPapiNumericNorm('E', papiRaw.E), getPapiNumericNorm('V', papiRaw.V));
      scores['Stabilitas Emosi'] = getPapiNumericNorm('E', papiRaw.E);
      scores['Kepekaan Emosi / Sosial'] = getPapiNumericNorm('O', papiRaw.O);
      scores['Kepekaan'] = getPapiNumericNorm('O', papiRaw.O);
      scores['Kepercayaan Diri'] = avgFloor(getPapiNumericNorm('X', papiRaw.X), getPapiNumericNorm('K', papiRaw.K), getPapiNumericNorm('L', papiRaw.L));
      scores['Sosiabilitas'] = getPapiNumericNorm('S', papiRaw.S);
      scores['Adaptasi'] = getPapiNumericNorm('Z', papiRaw.Z);
      scores['Komunikasi'] = avgFloor(getPapiNumericNorm('S', papiRaw.S), getPapiNumericNorm('X', papiRaw.X));
      scores['Kerjasama'] = avgFloor(getPapiNumericNorm('B', papiRaw.B), getPapiNumericNorm('O', papiRaw.O), getPapiNumericNorm('F', papiRaw.F));
      scores['Inisiatif'] = avgFloor(getPapiNumericNorm('I', papiRaw.I), getPapiNumericNorm('Z', papiRaw.Z), getPapiNumericNorm('K', papiRaw.K));
      scores['Tanggung Jawab'] = avgFloor(getPapiNumericNorm('N', papiRaw.N), getPapiNumericNorm('F', papiRaw.F));
      scores['Kepemimpinan'] = avgFloor(getPapiNumericNorm('L', papiRaw.L), getPapiNumericNorm('P', papiRaw.P), getPapiNumericNorm('I', papiRaw.I));
      scores['Daya Pimpin'] = avgFloor(getPapiNumericNorm('L', papiRaw.L), getPapiNumericNorm('P', papiRaw.P));
      scores['Pengambilan Keputusan'] = avgFloor(getPapiNumericNorm('I', papiRaw.I), getPapiNumericNorm('P', papiRaw.P));
      scores['Motivasi Kerja'] = avgFloor(getPapiNumericNorm('A', papiRaw.A), getPapiNumericNorm('G', papiRaw.G));
    }

    const getInstrumentScore = (inst: string): number | null => {
      const clean = inst.trim().toUpperCase();
      if (clean === 'WPT') return wptVal;
      if (clean.includes('TIKI 1')) return tiki1Val;
      if (clean.includes('TIKI 2')) return tiki2Val;
      if (clean.includes('TIKI 3')) return tiki3Val;
      if (clean.includes('TIKI 4')) return tiki4Val;
      if (clean.includes('TIKI 6')) return tiki6Val;
      if (clean.includes('IST') && (clean.includes('1') || clean.includes('SUBTES 1'))) return ist1Val;
      if (clean.includes('IST') && (clean.includes('2') || clean.includes('SUBTES 2'))) return ist2Val;
      if (clean.includes('IST') && (clean.includes('3') || clean.includes('SUBTES 3'))) return ist3Val;
      if (clean.includes('IST') && (clean.includes('4') || clean.includes('SUBTES 4'))) return ist4Val;
      if (clean.includes('IST') && (clean.includes('5') || clean.includes('SUBTES 5'))) return ist5Val;
      if (clean.includes('IST') && (clean.includes('6') || clean.includes('SUBTES 6'))) return ist6Val;
      if (clean.includes('IST') && (clean.includes('7') || clean.includes('SUBTES 7'))) return ist7Val;
      if (clean.includes('IST') && (clean.includes('8') || clean.includes('SUBTES 8'))) return ist8Val;
      if (clean.includes('IST') && (clean.includes('9') || clean.includes('SUBTES 9'))) return ist9Val;
      
      if (hasPapi && clean.includes('PAPI')) {
        const match = clean.match(/SKALA\s*([A-Z])|PAPI\s*([A-Z])/i);
        const trait = match ? (match[1] || match[2]).toUpperCase() : '';
        if (trait && papiRaw[trait] !== undefined) {
          return getPapiNumericNorm(trait, papiRaw[trait]);
        }
      }
      return null;
    };

    const jobPosition = participant.jobPosition || participant.test?.jobPosition;
    let presetMapping: any[] = [];
    if (jobPosition?.psychographPreset?.mapping) {
      try {
        presetMapping = JSON.parse(jobPosition.psychographPreset.mapping);
      } catch (e) {}
    }
    if (!Array.isArray(presetMapping) || presetMapping.length === 0) {
      presetMapping = DEFAULT_PRESET_MAPPING;
    }

    if (Array.isArray(presetMapping)) {
      presetMapping.forEach((cat: any) => {
        if (Array.isArray(cat.aspects)) {
          cat.aspects.forEach((asp: any) => {
            if (asp.name && Array.isArray(asp.instruments) && asp.instruments.length > 0) {
              const instScores = asp.instruments
                .map((inst: string) => getInstrumentScore(inst))
                .filter((s: any): s is number => typeof s === 'number' && !isNaN(s));
              if (instScores.length > 0) {
                scores[asp.name] = avgFloor(...instScores);
              }
            }
          });
        }
      });
    }

    if (participant.normResults) {
      participant.normResults.forEach((curr: any) => {
        scores[curr.parameter] = curr.score;
      });
    }

    return scores;
  }, [participant]);

  if (!participant) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat dokumen cetak...</div>;

  const jobPosition = participant.test?.jobPosition || participant.jobPosition;
  const psychoResults = participant.psychoResults || {};
  let dinamika = { intelegensi: '', kepribadian: '', sikapKerja: '', kepemimpinan: '', kesimpulan: '' };
  if (psychoResults.dinamika) {
    try { dinamika = JSON.parse(psychoResults.dinamika); } catch(e){}
  }
  let modifiedScores: Record<string, number> = {};
  if (psychoResults.modifiedScores) {
    try { modifiedScores = JSON.parse(psychoResults.modifiedScores); } catch(e){}
  }

  const defaultAspectList = [
    "Inteligensi Umum", "Daya Analisa", "Logika Berpikir", "Daya Abstraksi", "Problem Solving",
    "Stabilitas Emosi", "Kepekaan", "Kepercayaan Diri", "Sosiabilitas", "Kerjasama",
    "Motivasi Kerja", "Ketelitian", "Daya Tahan Kerja", "Kepemimpinan", "Daya Pimpin",
    "Pengambilan Keputusan", "Kemampuan Kognitif", "Pemahaman Verbal", "Kemampuan Numerik", "Daya Tangkap"
  ];

  let grayAreas = jobPosition?.grayAreas || [];
  if (grayAreas.length === 0) {
    grayAreas = defaultAspectList.map(name => ({ parameter: name, targetScore: 3 }));
  }

  let mapping = [];
  if (jobPosition?.psychographPreset?.mapping) {
    try { mapping = JSON.parse(jobPosition.psychographPreset.mapping); } catch(e){}
  }
  if (!mapping || mapping.length === 0) {
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
    "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
    "Daya Analisa": "Mampu mengolah dan mengidentifikasi topik-topik serta keterkaitan dari informasi-informasi tersebut; menghubungkan & membandingkan data-data dari berbagai sumber, mengidentifikasi hubungan sebab akibat.",
    "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal",
    "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan kemampuan berpikir antisipatif",
    "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan, dengan mempertimbangkan efektivitas dari alternatif solusi yang dibuat",
    "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh oleh situasi.",
    "Kepekaan": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati)",
    "Kepercayaan Diri": "Yakin pada kemampuan dirinya, bisa bersikap tegas, asertif",
    "Sosiabilitas": "Memiliki minat dan perhatian terhadap orang lain, mampu menciptakan impresi yang baik dalam situasi sosial, bisa menjalin hubungan dgn berbagai tipe orang",
  };

  return (
    <div style={{ background: '#E2E8F0', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Print Trigger & Warning */}
      <div className="no-print" style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', maxWidth: '900px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ color: '#0F172A', fontWeight: 600 }}>Tampilan cetak PDF siap. Pastikan opsi "Background graphics" diaktifkan pada pengaturan cetak.</div>
        <button onClick={() => window.print()} style={{ background: '#2563EB', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cetak ke PDF</button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { size: A4; margin: 15mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .a4-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 20mm;
          box-sizing: border-box;
          color: #1E293B;
        }
      `}} />

      {/* Page 1 */}
      <div className="a4-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', textTransform: 'uppercase' }}>LAPORAN HASIL EVALUASI PSIKOLOGIS</h1>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>HR PUBLIK ASSESSMENT CENTER & CONSULTING</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <div style={{ color: '#64748B' }}>Posisi: <span style={{ color: '#0F172A', fontWeight: 700 }}>{participant.test?.title?.split('-')[0]?.trim() || jobPosition?.name || '-'}</span></div>
            <div style={{ color: '#64748B' }}>Nama Peserta: <span style={{ color: '#0F172A', fontWeight: 700 }}>{participant.user?.name || '-'}</span></div>
          </div>
        </div>

        {/* Psychograph Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', lineHeight: '1.4' }}>
          <thead>
            <tr style={{ borderTop: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
              <th style={{ padding: '8px', textAlign: 'left', width: '25%', fontWeight: 700 }}>DIMENSI</th>
              <th style={{ padding: '8px', textAlign: 'left', width: '45%', fontWeight: 700 }}>DESKRIPSI</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>KS</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>K</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>C</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>B</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>BS</th>
            </tr>
          </thead>
          <tbody>
            {mapping.map((cat: any, cIdx: number) => {
              const activeAsps = cat.aspects ? cat.aspects.filter((a: any) => a.checked) : [];
              if (activeAsps.length === 0) return null;

              return (
                <React.Fragment key={cIdx}>
                  <tr style={{ background: '#F1F5F9' }}>
                    <td colSpan={7} style={{ padding: '8px', fontWeight: 800, color: '#1E293B' }}>
                      {cat.category.toUpperCase()}
                    </td>
                  </tr>
                  {activeAsps.map((asp: any, aIdx: number) => {
                    const aspectName = asp.name;
                    const targetScore = grayAreasMap[aspectName] || 3;
                    const compScore = computerScores[aspectName] || 3;
                    const finalScore = modifiedScores[aspectName] !== undefined ? modifiedScores[aspectName] : compScore;
                    const isLast = aIdx === activeAsps.length - 1;

                    return (
                      <tr key={aspectName} style={{ borderBottom: isLast ? '1px solid #CBD5E1' : '1px dotted #E2E8F0' }}>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#334155', verticalAlign: 'top' }}>{aspectName}</td>
                        <td style={{ padding: '8px', color: '#64748B', verticalAlign: 'top', paddingRight: '16px' }}>{descriptions[aspectName] || '-'}</td>
                        {[1, 2, 3, 4, 5].map(score => {
                          const isTarget = score === targetScore;
                          const isPlot = finalScore === score;
                          return (
                            <td key={score} style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle', background: isTarget ? '#F1F5F9' : 'transparent', borderLeft: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                {isPlot ? (
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0D9488', boxShadow: '0 0 0 3px #CCFBF1' }}></div>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="page-break"></div>

      {/* Page 2 */}
      <div className="a4-page" style={{ marginTop: '20px' }}>
        
        {/* Rekomendasi Box */}
        <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '12px', color: '#1E293B' }}>REKOMENDASI :</div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: psychoResults.recommendation === 'DISARANKAN' ? '#047857' : '#94A3B8', fontWeight: psychoResults.recommendation === 'DISARANKAN' ? 700 : 500 }}>
              <div style={{ width: '16px', height: '16px', background: psychoResults.recommendation === 'DISARANKAN' ? '#047857' : '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '10px' }}>✓</div>
              DISARANKAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: psychoResults.recommendation === 'DIPERTIMBANGKAN' ? '#D97706' : '#94A3B8', fontWeight: psychoResults.recommendation === 'DIPERTIMBANGKAN' ? 700 : 500 }}>
              <div style={{ width: '16px', height: '16px', background: psychoResults.recommendation === 'DIPERTIMBANGKAN' ? '#D97706' : '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '10px' }}>✓</div>
              DIPERTIMBANGKAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: psychoResults.recommendation === 'TIDAK DISARANKAN' ? '#B91C1C' : '#94A3B8', fontWeight: psychoResults.recommendation === 'TIDAK DISARANKAN' ? 700 : 500 }}>
              <div style={{ width: '16px', height: '16px', background: psychoResults.recommendation === 'TIDAK DISARANKAN' ? '#B91C1C' : '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '10px' }}>✓</div>
              TIDAK DISARANKAN
            </div>
          </div>
        </div>

        {/* Dinamika Box */}
        <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '16px', color: '#1E293B' }}>DINAMIKA PSIKOLOGIS :</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Intelegensi:</span> {dinamika.intelegensi || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Kepribadian & Potensi Relasi:</span> {dinamika.kepribadian || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Pola - Sikap Kerja:</span> {dinamika.sikapKerja || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Kepemimpinan:</span> {dinamika.kepemimpinan || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Kesimpulan:</span> {dinamika.kesimpulan || '-'}</li>
          </ul>
        </div>

        {/* Kelebihan Kelemahan */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <div style={{ flex: 1, border: '1px solid #A7F3D0', borderRadius: '8px', padding: '16px', background: '#F0FDF4' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#047857' }}>KELEBIHAN :</div>
            <div style={{ fontSize: '13px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {psychoResults.kelebihan || '-'}
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', background: '#FEF2F2' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#B91C1C' }}>KELEMAHAN :</div>
            <div style={{ fontSize: '13px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {psychoResults.kelemahan || '-'}
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', width: '250px' }}>
            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '80px' }}>Psikolog Pemeriksa,</div>
            <div style={{ borderBottom: '1px solid #0F172A', paddingBottom: '4px', marginBottom: '4px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              (Nama Psikolog)
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>No. SIPP: -</div>
          </div>
        </div>

      </div>
    </div>
  );
}
