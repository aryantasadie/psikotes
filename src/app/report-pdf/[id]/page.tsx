'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

  // 1. JSON array check
  if (strUser.startsWith('[') && strKey.startsWith('[')) {
    try {
      const uArr = JSON.parse(strUser).map((x: any) => String(x).trim().toLowerCase()).sort();
      const kArr = JSON.parse(strKey).map((x: any) => String(x).trim().toLowerCase()).sort();
      if (JSON.stringify(uArr) === JSON.stringify(kArr)) return true;
    } catch (e) {}
  }

  // 2. Direct string equality (case-insensitive)
  const cleanU = strUser.toLowerCase().replace(/\s+/g, ' ');
  const cleanK = strKey.toLowerCase().replace(/\s+/g, ' ');
  if (cleanU === cleanK) return true;

  // 3. True/False (B / S) and option index equivalence
  if (cleanK === 's' && (cleanU === '2' || cleanU === 'salah' || cleanU === 's')) return true;
  if (cleanK === 'b' && (cleanU === '1' || cleanU === 'benar' || cleanU === 'b')) return true;
  if (cleanK === '2' && (cleanU === 's' || cleanU === 'salah')) return true;
  if (cleanK === '1' && (cleanU === 'b' || cleanU === 'benar')) return true;

  // 4. Multi-answer match: "2.4" vs "24", "2,4", "4,2", "2 dan 4", "25", "52", "BE"
  if (cleanK.includes('.') || cleanK.includes(',') || cleanK.includes(' ')) {
    const keyParts = cleanK.split(/[\.,\s]+/).filter(Boolean).sort();
    const userParts = cleanU.split(/[\.,\s]+/).filter(Boolean).sort();
    if (keyParts.length > 1 && keyParts.length === userParts.length) {
      if (JSON.stringify(keyParts) === JSON.stringify(userParts)) return true;
    }
  }

  // Multi-digit set matching (e.g. "25" vs "52", "14" vs "41", "1245")
  const combDigitsU = cleanU.replace(/\D/g, '').split('').sort().join('');
  const combDigitsK = cleanK.replace(/\D/g, '').split('').sort().join('');
  if (combDigitsU.length > 0 && combDigitsU === combDigitsK) return true;

  // Letter to number conversion for options (e.g. "BE" -> "25", "AD" -> "14", "ABDE" -> "1245")
  const letterToNumStr = (s: string) => s.toUpperCase().replace(/[^A-E]/g, '').split('').map(c => c.charCodeAt(0) - 64).sort().join('');
  if (letterToNumStr(cleanU) === combDigitsK && combDigitsK.length > 0) return true;
  if (combDigitsU === letterToNumStr(cleanK) && combDigitsU.length > 0) return true;

  // 5. Clean unit suffixes / currency symbols for numerical questions
  const cleanUnitAndText = (s: string) => {
    return s
      .toLowerCase()
      .replace(/[\$\u0024\€\£\¥]/g, '')
      .replace(/\b(sen|dolar|dollar|detik|det|menit|jam|hari|bulan|tahun|cm|meter|m|km|kg|gram|gr|rupiah|rp|orang|persen|%)\b/gi, '')
      .trim();
  };

  const strippedU = cleanUnitAndText(cleanU);
  const strippedK = cleanUnitAndText(cleanK);
  if (strippedU && strippedK && strippedU === strippedK) return true;

  // Special match for WPT No 27 (1/30 dollar = 3.33 cents / 3 1/3 cents)
  const isWpt27Key = cleanK === '1/30' || cleanK === '0.03' || cleanK === '0.033' || cleanK === '3 1/3' || cleanK === '3.33' || cleanK === '3,33';
  if (isWpt27Key) {
    const validWpt27Answers = ['1/30', '0.03', '0.033', '0.0333', '3 1/3', '3.33', '3,33', '3.3', '3,3', '3', '10/3', '3.333'];
    if (validWpt27Answers.includes(strippedU) || validWpt27Answers.includes(cleanU)) return true;
  }

  // 6. Fractions, decimals, and thousand separators
  const parseNumOrFraction = (val: string): number | null => {
    let s = cleanUnitAndText(val);
    
    // Thousand separator removal e.g. "1.000" or "25.000" or "1,000"
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    } else if (/^\d{1,3}(,\d{3})+$/.test(s)) {
      s = s.replace(/,/g, '');
    }

    // Mixed fraction e.g. "1 1/2" -> 1.5, "3 1/3" -> 3.3333, "2 3/4" -> 2.75
    const mixedMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const num = parseFloat(mixedMatch[2]);
      const den = parseFloat(mixedMatch[3]);
      if (den !== 0) return whole + (num / den);
    }

    // Simple fraction e.g. "1/8" -> 0.125, "1/30" -> 0.0333, "1/2" -> 0.5, "3/4" -> 0.75, "1/4" -> 0.25, "13/50" -> 0.26
    const fracMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
    if (fracMatch) {
      const num = parseFloat(fracMatch[1].replace(',', '.'));
      const den = parseFloat(fracMatch[2].replace(',', '.'));
      if (den !== 0) return num / den;
    }

    // Standard decimal with dot or comma e.g. "0.26", "0,26", "175.00", "175,00"
    const dec = s.replace(',', '.');
    const parsed = parseFloat(dec);
    if (!isNaN(parsed) && (String(parsed) === dec || !isNaN(Number(dec)))) {
      return parsed;
    }
    return null;
  };

  const numUser = parseNumOrFraction(cleanU);
  const numKey = parseNumOrFraction(cleanK);
  if (numUser !== null && numKey !== null) {
    if (Math.abs(numUser - numKey) < 0.001) return true;
  }

  // 7. Inverted / reversed input check (e.g. 42 vs 24 in IST 6 or series numbers)
  const revU = cleanU.split('').reverse().join('');
  if (revU === cleanK) return true;

  const digitsU = cleanU.replace(/\D/g, '');
  const digitsK = cleanK.replace(/\D/g, '');
  if (digitsU.length > 0 && digitsU.length === digitsK.length) {
    if (digitsU.split('').reverse().join('') === digitsK) return true;
  }

  // 8. Option prefix matching: e.g. "1" matches "1. JANUARI"
  if (cleanK.startsWith(cleanU + '.') || cleanK.startsWith(cleanU + ' ') || cleanK.startsWith(cleanU + ')')) {
    return true;
  }

  return false;
};

export default function ReportPdfPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const id = params.id as string;
  const [participant, setParticipant] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/?callbackUrl=/report-pdf/${id}`);
    } else if (session?.user) {
      const userRole = (session.user as any)?.role;
      if (!['superadmin', 'psikolog'].includes(userRole)) {
        router.replace('/');
      }
    }
  }, [session, status, router, id]);

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
    const papiQuestions = participant.answers
      .filter((a: any) => a.question && (a.question.testType === 'PAPI' || a.question.testType === 'PAPI_KOSTICK' || a.question.testType === 'PAPI KOSTICK'))
      .map((a: any) => a.question)
      .filter((q: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === q.id) === i)
      .sort((a: any, b: any) => a.id - b.id);

    if (papiQuestions.length > 0) {
      hasPapi = true;
      papiQuestions.forEach((q: any, idx: number) => {
        const ans = participant.answers.find((a: any) => a.questionId === q.id);
        if (ans) {
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

    // Kraepelin Scale Parsing
    const kraepelinRawObj = participant.rawResults?.find((r: any) => r.testType === 'KRAEPELIN' || r.testType === 'KREAPELIN');
    let kraepelinNorms: { pankerNorm?: number; tinkerNorm?: number; jankerNorm?: number; hankerNorm?: number } = {};
    if (kraepelinRawObj && kraepelinRawObj.rawData) {
      try {
        const parsed = JSON.parse(kraepelinRawObj.rawData);
        if (parsed.pankerNorm) kraepelinNorms.pankerNorm = parsed.pankerNorm;
        if (parsed.tinkerNorm) kraepelinNorms.tinkerNorm = parsed.tinkerNorm;
        if (parsed.jankerNorm) kraepelinNorms.jankerNorm = parsed.jankerNorm;
        if (parsed.hankerNorm) kraepelinNorms.hankerNorm = parsed.hankerNorm;
      } catch (e) {}
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
      
      // Kraepelin Scales
      if (clean.includes('KRAEPELIN') || clean.includes('KREAPELIN') || clean.includes('PANKER') || clean.includes('TINKER') || clean.includes('JANKER') || clean.includes('HANKER')) {
        if (clean.includes('PANKER') || clean.includes('KECEPATAN')) return kraepelinNorms.pankerNorm ?? 3;
        if (clean.includes('TINKER') || clean.includes('KETELITIAN')) return kraepelinNorms.tinkerNorm ?? 3;
        if (clean.includes('JANKER') || clean.includes('KEAJEGAN') || clean.includes('STABILITAS')) return kraepelinNorms.jankerNorm ?? 3;
        if (clean.includes('HANKER') || clean.includes('KETAHANAN')) return kraepelinNorms.hankerNorm ?? 3;
        return kraepelinNorms.pankerNorm ?? 3;
      }

      if (hasPapi && clean.includes('PAPI')) {
        const papiTraitsList = ['N','G','A','L','P','I','T','V','X','S','B','O','R','D','C','Z','E','K','F','W'];
        const words = clean.split(/\s+/);
        const trait = words.reverse().find(w => papiTraitsList.includes(w)) || '';
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

  if (!participant) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Memuat dokumen cetak...</div>;

  const jobPosition = participant.test?.jobPosition || participant.jobPosition;
  const psychoResults = participant.psychoResults || {};
  let dinamika: {
    intelegensi: string;
    kepribadian: string;
    sikapKerja: string;
    kepemimpinan: string;
    kesimpulan: string;
    psychologistName?: string;
    psychologistSipp?: string;
    signatureUrl?: string;
  } = { 
    intelegensi: '', 
    kepribadian: '', 
    sikapKerja: '', 
    kepemimpinan: '', 
    kesimpulan: '',
    psychologistName: '',
    psychologistSipp: '',
    signatureUrl: ''
  };
  if (psychoResults.dinamika) {
    try {
      const parsed = JSON.parse(psychoResults.dinamika);
      dinamika = { ...dinamika, ...parsed };
    } catch(e){}
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
    "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal.",
    "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan berpikir antisipatif.",
    "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan dengan mempertimbangkan alternatif solusi.",
    "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh emosi.",
    "Kepekaan": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati).",
    "Kepercayaan Diri": "Yakin pada kapasitas dirinya, bisa bersikap tegas, asertif dan mandiri.",
    "Sosiabilitas": "Memiliki minat dan perhatian terhadap orang lain, mampu menciptakan relasi positif dalam berbagai situasi.",
    "Orientasi Berprestasi": "Dorongan kuat untuk mencapai standar keunggulan, target kerja yang tinggi dan hasil kerja optimal.",
    "Daya Juang": "Kegigihan dan persistensi dalam menyelesaikan tugas meski menghadapi rintangan.",
    "Kedetailan": "Kecermatan dalam menangani detail pekerjaan secara terstruktur dan teratur.",
    "Sistematika Kerja": "Kemampuan merencanakan, mengorganisasi, dan menyelesaikan tugas secara teratur dan metodis.",
    "Kecepatan Kerja": "Tempo penyelesaian pekerjaan secara tepat waktu dengan efisiensi tinggi.",
    "Ketelitian Kerja": "Akurasi tinggi dan minim kesalahan dalam menyelesaikan tugas operasional.",
    "Daya Tahan Stress": "Kemampuan mempertahankan performa kerja yang optimal di bawah tekanan atau beban kerja tinggi.",
    "Kepemimpinan": "Kapasitas mengarahkan, mempengaruhi, dan menggerakkan orang lain menuju pencapaian tujuan bersama.",
    "Inisiatif": "Tindakan proaktif untuk mengambil peluang atau menyelesaikan masalah tanpa harus selalu diarahkan.",
    "Tanggung Jawab": "Komitmen penuh terhadap tugas, wewenang, dan integritas kerja.",
    "Kerjasama": "Kemampuan bersinergi dan berkontribusi secara konstruktif dalam tim kerja.",
    "Pengambilan Keputusan": "Ketegasan dalam menentukan pilihan dan solusi terbaik secara efektif dan bertanggung jawab."
  };

  const candidateName = participant.user?.name || '-';
  const candidatePosition = participant.test?.title?.split('-')[0]?.trim() || jobPosition?.name || '-';
  const testDate = participant.startTime ? new Date(participant.startTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const recommendation = psychoResults.recommendation || 'DIPERTIMBANGKAN';

  return (
    <div className="report-wrapper" style={{ background: '#F1F5F9', minHeight: '100vh', padding: '24px 16px', fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif' }}>
      
      {/* Top Action Toolbar (No-Print) */}
      <div className="no-print" style={{ background: '#0F172A', padding: '14px 24px', borderRadius: '10px', marginBottom: '16px', maxWidth: '920px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', color: 'white', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Laporan Hasil Evaluasi Psikologis
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
            {candidateName} &bull; {candidatePosition} &bull; Format Standar HVS (2 Halaman)
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a 
            href={`/api/superadmin/reports/${id}/export-docx`}
            download={`Laporan_Psikotes_${candidateName.replace(/\s+/g, '_')}.docx`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#1D4ED8', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #3B82F6', transition: 'all 0.2s' }}
          >
            Unduh Word (.docx)
          </a>
          <button 
            onClick={() => window.print()} 
            style={{ background: '#059669', color: 'white', padding: '8px 16px', border: '1px solid #10B981', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(5,150,105,0.3)' }}
          >
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Tips Cetak Banner (No-Print) */}
      <div className="no-print" style={{ maxWidth: '920px', margin: '-8px auto 16px auto', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#1E40AF', gap: '8px' }}>
        <span>
          <strong>Panduan Cetak PDF:</strong> Pilih <em>Tujuan: Simpan sebagai PDF</em> dan pastikan centang <strong>"Grafik latar belakang" (Background graphics)</strong> agar warna target dan skor tercetak tajam.
        </span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          .no-print, .page-divider {
            display: none !important;
          }
          .a4-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 14mm 8mm 14mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .a4-page:first-of-type {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-page:last-of-type {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }

        @media screen {
          .a4-page {
            background: white;
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            margin: 0 auto;
            box-shadow: 0 4px 25px rgba(0,0,0,0.1);
            padding: 10mm 14mm 8mm 14mm;
            box-sizing: border-box;
            color: #1E293B;
            position: relative;
            border-radius: 3px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .page-divider {
            max-width: 210mm;
            margin: 16px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 11px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .page-divider::before, .page-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #CBD5E1;
          }
        }
      `}} />

      {/* Page 1 Badge */}
      <div className="page-divider no-print">
        <span>Halaman 1 dari 2 &bull; Psikogram & Standar Kompetensi</span>
      </div>

      {/* Page 1: Kop, Biodata & Psychogram Table */}
      <div className="a4-page">
        {/* Header / Kop Surat Resmi */}
        <div style={{ paddingBottom: '4px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="HR Publik Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  HR PUBLIK CONSULTING & ASSESSMENT CENTER
                </div>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                  Lembaga Layanan Psikologi Terapan & Evaluasi Potensi SDM
                </div>
                <div style={{ fontSize: '8px', color: '#64748B', marginTop: '1px' }}>
                  Assessment Center &bull; Rekrutmen & Seleksi &bull; Konsultasi Pengembangan SDM
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', border: '1px solid #94A3B8', background: '#F8FAFC', padding: '2px 8px', fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155', borderRadius: '3px' }}>
                CONFIDENTIAL
              </div>
              <div style={{ fontSize: '8px', color: '#64748B', marginTop: '3px' }}>
                Ref: HRP/EVA/{participant.id?.toString().padStart(4, '0')}/{new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Garis Ganda Kop Surat Resmi */}
          <div style={{ marginTop: '6px', borderBottom: '1.5px solid #0F172A' }}></div>
          <div style={{ marginTop: '1.5px', borderBottom: '0.5px solid #94A3B8' }}></div>
        </div>

        {/* Document Title */}
        <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
          <h1 style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            LAPORAN HASIL EVALUASI PSIKOLOGIS
          </h1>
          <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '1px' }}>
            INDIVIDUAL PSYCHOLOGICAL DIAGNOSTIC & COMPETENCY MATRIX
          </div>
        </div>

        {/* Candidate Information Table (Tabel Biodata Resmi) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px', border: '1px solid #CBD5E1' }}>
          <tbody>
            <tr>
              <td style={{ width: '17%', padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                Nama Lengkap
              </td>
              <td style={{ width: '33%', padding: '3px 8px', fontWeight: 800, color: '#0F172A', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                {candidateName}
              </td>
              <td style={{ width: '18%', padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                Posisi / Jabatan
              </td>
              <td style={{ width: '32%', padding: '3px 8px', fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #CBD5E1' }}>
                {candidatePosition}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1' }}>
                Tanggal Evaluasi
              </td>
              <td style={{ padding: '3px 8px', color: '#0F172A', fontWeight: 600, borderRight: '1px solid #CBD5E1' }}>
                {testDate}
              </td>
              <td style={{ padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1' }}>
                Status Laporan
              </td>
              <td style={{ padding: '3px 8px', color: '#0F172A', fontWeight: 700 }}>
                {psychoResults.status === 'RELEASED' ? 'RELEASED (RESMI / FINAL)' : 'CONFIDENTIAL REVIEW (INTERNAL)'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Psychogram Matrix Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', lineHeight: '1.2', border: '1px solid #0F172A' }}>
          <thead>
            <tr style={{ background: '#1E293B', color: 'white' }}>
              <th style={{ padding: '5px 6px', textAlign: 'left', width: '27%', fontWeight: 800, border: '1px solid #1E293B', fontSize: '9px' }}>ASPEK & DIMENSI</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', width: '43%', fontWeight: 800, border: '1px solid #1E293B', fontSize: '9px' }}>DEFINISI OPERASIONAL</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px' }}>KS (1)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px' }}>K (2)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px' }}>C (3)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px' }}>B (4)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px' }}>BS (5)</th>
            </tr>
          </thead>
          <tbody>
            {mapping.map((cat: any, cIdx: number) => {
              const activeAsps = cat.aspects ? cat.aspects.filter((a: any) => a.checked) : [];
              if (activeAsps.length === 0) return null;

              return (
                <React.Fragment key={cIdx}>
                  <tr style={{ background: '#F1F5F9', borderTop: '1px solid #0F172A', borderBottom: '1px solid #94A3B8' }}>
                    <td colSpan={7} style={{ padding: '4px 6px', fontWeight: 800, color: '#0F172A', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {cat.category}
                    </td>
                  </tr>
                  {activeAsps.map((asp: any, aIdx: number) => {
                    const aspectName = asp.name;
                    const targetScore = grayAreasMap[aspectName] || 3;
                    const compScore = computerScores[aspectName] || 3;
                    const finalScore = modifiedScores[aspectName] !== undefined ? modifiedScores[aspectName] : compScore;
                    const isLast = aIdx === activeAsps.length - 1;

                    return (
                      <tr key={aspectName} style={{ borderBottom: isLast ? '1px solid #94A3B8' : '1px solid #E2E8F0' }}>
                        <td style={{ padding: '3px 6px', fontWeight: 700, color: '#0F172A', verticalAlign: 'middle', borderRight: '1px solid #CBD5E1', fontSize: '9px' }}>
                          {aspectName}
                        </td>
                        <td style={{ padding: '3px 6px', color: '#475569', verticalAlign: 'middle', borderRight: '1px solid #CBD5E1', fontSize: '8px', lineHeight: '1.25' }}>
                          {asp.description || descriptions[aspectName] || '-'}
                        </td>
                        {[1, 2, 3, 4, 5].map(score => {
                          const isTarget = score === targetScore;
                          const isPlot = finalScore === score;
                          return (
                            <td 
                              key={score} 
                              style={{ 
                                padding: '0', 
                                textAlign: 'center', 
                                verticalAlign: 'middle', 
                                background: isTarget ? '#E2E8F0' : 'transparent', 
                                borderLeft: '1px solid #CBD5E1', 
                                borderRight: '1px solid #CBD5E1' 
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '18px' }}>
                                {isPlot ? (
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F172A' }}></div>
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

        {/* Legend */}
        <div style={{ marginTop: '8px', padding: '5px 8px', background: '#F8FAFC', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '9px', background: '#E2E8F0', border: '1px solid #94A3B8' }}></span>
              <strong style={{ color: '#334155' }}>Standar Profil Jabatan (Target)</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0F172A' }}></span>
              <strong style={{ color: '#0F172A' }}>Skor Capaian Individu Peserta</strong>
            </span>
          </div>
          <div>
            <span>1: Kurang Sekali &bull; 2: Kurang &bull; 3: Cukup &bull; 4: Baik &bull; 5: Baik Sekali</span>
          </div>
        </div>
      </div>

      {/* Page 2 Badge */}
      <div className="page-divider no-print">
        <span>Halaman 2 dari 2 &bull; Kesimpulan, Dinamika & Pengesahan</span>
      </div>

      {/* Page 2: Rekomendasi, Dinamika, Kelebihan/Kelemahan & Tanda Tangan */}
      <div className="a4-page">
        
        {/* Page 2 Mini Header Resmi */}
        <div style={{ borderBottom: '1.5px solid #0F172A', paddingBottom: '5px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <div>
            <strong style={{ color: '#0F172A' }}>HR PUBLIK ASSESSMENT CENTER</strong> &bull; Laporan Evaluasi Psikologis
          </div>
          <div>
            Kandidat: <strong style={{ color: '#0F172A' }}>{candidateName}</strong> &bull; Jabatan: <strong style={{ color: '#0F172A' }}>{candidatePosition}</strong>
          </div>
        </div>

        {/* 1. Rekomendasi Box (Clean Corporate Executive) */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.03em', marginBottom: '6px' }}>
            I. KESIMPULAN REKOMENDASI JABATAN
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* DISARANKAN */}
            <div style={{ 
              padding: '11px 10px', 
              borderRadius: '4px',
              border: recommendation === 'DISARANKAN' ? '2px solid #059669' : '1px solid #E2E8F0', 
              background: recommendation === 'DISARANKAN' ? '#ECFDF5' : '#FAFAFA',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: recommendation === 'DISARANKAN' ? '#047857' : '#94A3B8' }}>
                DISARANKAN
              </div>
              <div style={{ fontSize: '8.5px', color: recommendation === 'DISARANKAN' ? '#065F46' : '#94A3B8', marginTop: '3px', lineHeight: '1.3' }}>
                Memenuhi seluruh kompetensi psikologis yang dipersyaratkan.
              </div>
            </div>

            {/* DIPERTIMBANGKAN */}
            <div style={{ 
              padding: '11px 10px', 
              borderRadius: '4px',
              border: recommendation === 'DIPERTIMBANGKAN' ? '2px solid #D97706' : '1px solid #E2E8F0', 
              background: recommendation === 'DIPERTIMBANGKAN' ? '#FFFBEB' : '#FAFAFA',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: recommendation === 'DIPERTIMBANGKAN' ? '#B45309' : '#94A3B8' }}>
                DIPERTIMBANGKAN
              </div>
              <div style={{ fontSize: '8.5px', color: recommendation === 'DIPERTIMBANGKAN' ? '#92400E' : '#94A3B8', marginTop: '3px', lineHeight: '1.3' }}>
                Memenuhi kualifikasi dasar dengan beberapa catatan pengembangan.
              </div>
            </div>

            {/* TIDAK DISARANKAN */}
            <div style={{ 
              padding: '11px 10px', 
              borderRadius: '4px',
              border: recommendation === 'TIDAK DISARANKAN' ? '2px solid #DC2626' : '1px solid #E2E8F0', 
              background: recommendation === 'TIDAK DISARANKAN' ? '#FEF2F2' : '#FAFAFA',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: recommendation === 'TIDAK DISARANKAN' ? '#B91C1C' : '#94A3B8' }}>
                TIDAK DISARANKAN
              </div>
              <div style={{ fontSize: '8.5px', color: recommendation === 'TIDAK DISARANKAN' ? '#991B1B' : '#94A3B8', marginTop: '3px', lineHeight: '1.3' }}>
                Belum memenuhi standar kompetensi minimal posisi jabatan.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dinamika Psikologis (Formal Diagnostic Evaluation) */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.03em', marginBottom: '6px' }}>
            II. DINAMIKA PSIKOLOGIS & DESKRIPSI KOMPETENSI
          </div>
          
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '11px 14px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '9px', color: '#1E293B', lineHeight: '1.45', textAlign: 'justify' }}>
            <div>
              <strong style={{ color: '#0F172A' }}>A. Kapasitas Inteligensi & Kemampuan Kognitif:</strong>{' '}
              <span>{dinamika.intelegensi || '-'}</span>
            </div>

            <div>
              <strong style={{ color: '#0F172A' }}>B. Dinamika Kepribadian & Relasi Sosial:</strong>{' '}
              <span>{dinamika.kepribadian || '-'}</span>
            </div>

            <div>
              <strong style={{ color: '#0F172A' }}>C. Sikap & Pola Kerja Operasional:</strong>{' '}
              <span>{dinamika.sikapKerja || '-'}</span>
            </div>

            <div>
              <strong style={{ color: '#0F172A' }}>D. Potensi Kepemimpinan & Pengambilan Keputusan:</strong>{' '}
              <span>{dinamika.kepemimpinan || '-'}</span>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '6px', marginTop: '2px' }}>
              <strong style={{ color: '#0F172A' }}>E. Kesimpulan Profil Keseluruhan:</strong>{' '}
              <span style={{ fontWeight: 600 }}>{dinamika.kesimpulan || '-'}</span>
            </div>
          </div>
        </div>

        {/* 3. Kelebihan & Kelemahan (Formal 2-Column Table) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.03em', marginBottom: '6px' }}>
            III. RINGKASAN KOMPETENSI (STRENGTHS & DEVELOPMENT AREAS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ border: '1px solid #A7F3D0', borderTop: '3px solid #059669', background: '#F0FDF4', borderRadius: '4px', padding: '8px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#047857', letterSpacing: '0.02em', marginBottom: '4px' }}>
                POIN KEKUATAN UTAMA (KEY STRENGTHS)
              </div>
              <div style={{ fontSize: '8.5px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                {psychoResults.kelebihan || '-'}
              </div>
            </div>

            <div style={{ border: '1px solid #FED7AA', borderTop: '3px solid #D97706', background: '#FFFBEB', borderRadius: '4px', padding: '8px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#B45309', letterSpacing: '0.02em', marginBottom: '4px' }}>
                AREA PENGEMBANGAN (DEVELOPMENT AREAS)
              </div>
              <div style={{ fontSize: '8.5px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                {psychoResults.kelemahan || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Pengesahan & Tanda Tangan Psikolog Assessor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '16px' }}>
          <div style={{ fontSize: '8px', color: '#64748B', maxWidth: '360px', lineHeight: '1.4' }}>
            <em>*Dokumen ini merupakan hasil evaluasi psikologis yang bersifat RAHASIA (CONFIDENTIAL). Interpretasi hasil asesmen hanya dapat dilakukan oleh Psikolog yang berwenang untuk tujuan seleksi dan penempatan SDM.</em>
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ fontSize: '9px', color: '#334155', marginBottom: '2px' }}>
              Semarang, {testDate !== '-' ? testDate : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
              Psikolog Pemeriksa / Assessor,
            </div>

            {/* Signature Slot */}
            <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
              {dinamika.signatureUrl ? (
                <img 
                  src={dinamika.signatureUrl} 
                  alt="Tanda Tangan Digital" 
                  style={{ maxHeight: '54px', maxWidth: '160px', objectFit: 'contain' }} 
                />
              ) : (
                <div style={{ height: '50px' }}></div>
              )}
            </div>

            <div style={{ borderBottom: '1px solid #0F172A', paddingBottom: '1px', marginBottom: '2px', fontSize: '10.5px', fontWeight: 800, color: '#0F172A' }}>
              <u>{dinamika.psychologistName || '( Nama Lengkap Psikolog Pemeriksa )'}</u>
            </div>
            <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600 }}>
              No. SIPP: {dinamika.psychologistSipp || '-'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
