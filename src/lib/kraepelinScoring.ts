/**
 * Official Kraepelin Scoring Engine
 * Implementasi Formula dan Tabel Norma Standar dari file "Skoring Tes Kraeplin.xlsx"
 */

export type KraepelinCategory = 'TS' | 'T' | 'CT' | 'S' | 'AR' | 'R' | 'RS';

export const KRAEPELIN_CATEGORY_LABELS: Record<KraepelinCategory, string> = {
  TS: 'Tinggi Sekali',
  T: 'Tinggi',
  CT: 'Cukup Tinggi',
  S: 'Sedang',
  AR: 'Agak Rendah',
  R: 'Rendah',
  RS: 'Rendah Sekali'
};

export interface KraepelinScoreItem {
  raw: number;
  ss: number; // Standard Score (35 - 99)
  category: KraepelinCategory;
  scale1to5: number;
  label: string;
}

export interface KraepelinColumnDetail {
  columnIdx: number;
  dikerjakan: number;
  benar: number;
  salah: number;
  digits: number[];
  userAnswers: (number | null)[];
}

export interface KraepelinAnalysisResult {
  xGarisTengah: number;
  bBenarAtas: number;
  cKosongBawah: number;
  panker: KraepelinScoreItem;
  tinker: KraepelinScoreItem;
  janker: KraepelinScoreItem;
  hanker: {
    score: number; // H = (SS Panker + SS Janker) / 2
    category: KraepelinCategory;
    scale1to5: number;
    label: string;
  };
  totalBenar: number;
  totalSalah: number;
  totalDikerjakan: number;
  columnScores: number[];
  maxScore: number;
  minScore: number;
  perKolomDetails: KraepelinColumnDetail[];
}

/**
 * Konversi Kategori & SS ke Skala Psikogram 1-5
 */
export function categoryToScale1to5(cat: KraepelinCategory): number {
  switch (cat) {
    case 'TS': return 5;
    case 'T': return 4;
    case 'CT': return 4;
    case 'S': return 3;
    case 'AR': return 2;
    case 'R': return 1;
    case 'RS': return 1;
    default: return 3;
  }
}

/**
 * 1. PANKER (Kecepatan Kerja)
 * Tabel Norma Lookup (Ambang Batas Bawah Raw Score)
 */
export function getPankerNorm(raw: number): KraepelinScoreItem {
  let ss = 35;
  let category: KraepelinCategory = 'RS';

  if (raw >= 20) { ss = 99; category = 'TS'; }
  else if (raw >= 19) { ss = 95; category = 'TS'; }
  else if (raw >= 18) { ss = 90; category = 'TS'; }
  else if (raw >= 17) { ss = 85; category = 'T'; }
  else if (raw >= 16) { ss = 80; category = 'T'; }
  else if (raw >= 15) { ss = 75; category = 'CT'; }
  else if (raw >= 14) { ss = 70; category = 'CT'; }
  else if (raw >= 13) { ss = 65; category = 'S'; }
  else if (raw >= 12) { ss = 60; category = 'S'; }
  else if (raw >= 11) { ss = 55; category = 'AR'; }
  else if (raw >= 10) { ss = 50; category = 'AR'; }
  else if (raw >= 9) { ss = 45; category = 'R'; }
  else if (raw >= 8) { ss = 40; category = 'R'; }
  else { ss = 35; category = 'RS'; }

  return {
    raw: parseFloat(raw.toFixed(2)),
    ss,
    category,
    scale1to5: categoryToScale1to5(category),
    label: `${ss} / ${category} (${KRAEPELIN_CATEGORY_LABELS[category]})`
  };
}

/**
 * 2. TINKER (Ketelitian Kerja)
 * Raw = Jumlah Jawaban Salah (semakin sedikit salah, SS semakin tinggi)
 */
export function getTinkerNorm(rawError: number): KraepelinScoreItem {
  let ss = 35;
  let category: KraepelinCategory = 'RS';

  if (rawError <= 0) { ss = 99; category = 'TS'; }
  else if (rawError === 1) { ss = 95; category = 'TS'; }
  else if (rawError === 2) { ss = 90; category = 'TS'; }
  else if (rawError === 3) { ss = 85; category = 'T'; }
  else if (rawError === 4) { ss = 80; category = 'T'; }
  else if (rawError === 5) { ss = 75; category = 'CT'; }
  else if (rawError === 6) { ss = 70; category = 'CT'; }
  else if (rawError <= 8) { ss = 65; category = 'S'; }
  else if (rawError <= 10) { ss = 60; category = 'S'; }
  else if (rawError <= 12) { ss = 55; category = 'AR'; }
  else if (rawError <= 15) { ss = 50; category = 'AR'; }
  else if (rawError <= 17) { ss = 45; category = 'R'; }
  else if (rawError <= 19) { ss = 40; category = 'R'; }
  else { ss = 35; category = 'RS'; }

  return {
    raw: rawError,
    ss,
    category,
    scale1to5: categoryToScale1to5(category),
    label: `${ss} / ${category} (${KRAEPELIN_CATEGORY_LABELS[category]})`
  };
}

/**
 * 3. JANKER (Stabilitas / Keajegan Kerja)
 * Raw = Nilai Tertinggi (Max) - Nilai Terendah (Min)
 */
export function getJankerNorm(rawRange: number): KraepelinScoreItem {
  let ss = 35;
  let category: KraepelinCategory = 'RS';

  if (rawRange <= 1) { ss = 99; category = 'TS'; }
  else if (rawRange === 2) { ss = 95; category = 'TS'; }
  else if (rawRange === 3) { ss = 90; category = 'TS'; }
  else if (rawRange === 4) { ss = 85; category = 'T'; }
  else if (rawRange === 5) { ss = 80; category = 'T'; }
  else if (rawRange === 6) { ss = 75; category = 'CT'; }
  else if (rawRange === 7) { ss = 70; category = 'CT'; }
  else if (rawRange === 8) { ss = 65; category = 'S'; }
  else if (rawRange === 9) { ss = 60; category = 'S'; }
  else if (rawRange === 10) { ss = 55; category = 'AR'; }
  else if (rawRange <= 12) { ss = 50; category = 'AR'; }
  else if (rawRange === 13) { ss = 45; category = 'R'; }
  else if (rawRange === 14) { ss = 40; category = 'R'; }
  else { ss = 35; category = 'RS'; }

  return {
    raw: rawRange,
    ss,
    category,
    scale1to5: categoryToScale1to5(category),
    label: `${ss} / ${category} (${KRAEPELIN_CATEGORY_LABELS[category]})`
  };
}

/**
 * 4. HANKER / H (Hasil Akhir / Ketahanan Kerja)
 * H = (SS Panker + SS Janker) / 2
 */
export function getHankerNorm(pankerSS: number, jankerSS: number) {
  const hScore = parseFloat(((pankerSS + jankerSS) / 2).toFixed(2));
  let category: KraepelinCategory = 'RS';

  if (hScore >= 90) category = 'TS';
  else if (hScore >= 80) category = 'T';
  else if (hScore >= 70) category = 'CT';
  else if (hScore >= 60) category = 'S';
  else if (hScore >= 50) category = 'AR';
  else if (hScore >= 40) category = 'R';
  else category = 'RS';

  return {
    score: hScore,
    category,
    scale1to5: categoryToScale1to5(category),
    label: `${hScore} / ${category} (${KRAEPELIN_CATEGORY_LABELS[category]})`
  };
}

/**
 * Hitung Keseluruhan Hasil Kraepelin dari Jawaban Matrix 50 Kolom
 */
export function calculateKraepelinFullAnalysis(
  matrix: number[][],
  userAnswers: (number | null)[][]
): KraepelinAnalysisResult {
  const TOTAL_COLUMNS = matrix.length || 50;
  const perKolomDetails: KraepelinColumnDetail[] = [];
  const columnScores: number[] = [];
  let totalBenar = 0;
  let totalSalah = 0;
  let totalDikerjakan = 0;

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
    totalDikerjakan += colDikerjakan;

    perKolomDetails.push({
      columnIdx: c,
      dikerjakan: colDikerjakan,
      benar: colBenar,
      salah: colSalah,
      digits: colDigits,
      userAnswers: answers
    });
  }

  // Cari Min dan Max dari skor kolom
  const maxScore = columnScores.length > 0 ? Math.max(...columnScores) : 0;
  const minScore = columnScores.length > 0 ? Math.min(...columnScores) : 0;

  // X = Garis Tengah (Ambil nilai tengah antara tertinggi dan terendah)
  const xGarisTengah = Math.round((maxScore + minScore) / 2) || 1;

  // B = Jumlah Benar di atas garis tengah X
  let bBenarAtas = 0;
  // C = Jumlah Kosong di garis tengah X dan ke bawah
  let cKosongBawah = 0;

  for (const score of columnScores) {
    if (score > xGarisTengah) {
      bBenarAtas += (score - xGarisTengah);
    } else if (score < xGarisTengah) {
      cKosongBawah += (xGarisTengah - score);
    }
  }

  // Rumus Resmi Panker dari Excel: ((X - 1) * 50 + (B - C)) / 50
  const pankerRawVal = ((xGarisTengah - 1) * TOTAL_COLUMNS + (bBenarAtas - cKosongBawah)) / TOTAL_COLUMNS;
  const panker = getPankerNorm(pankerRawVal);

  // Rumus Resmi Tinker: Jumlah Salah
  const tinker = getTinkerNorm(totalSalah);

  // Rumus Resmi Janker: Tertinggi - Terendah
  const jankerRawVal = maxScore - minScore;
  const janker = getJankerNorm(jankerRawVal);

  // Rumus Resmi Hanker: H = (SS Panker + SS Janker) / 2
  const hanker = getHankerNorm(panker.ss, janker.ss);

  return {
    xGarisTengah,
    bBenarAtas,
    cKosongBawah,
    panker,
    tinker,
    janker,
    hanker,
    totalBenar,
    totalSalah,
    totalDikerjakan,
    columnScores,
    maxScore,
    minScore,
    perKolomDetails
  };
}
