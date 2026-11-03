// Shared psychograph scoring, normalization, and aspect resolution logic
// Used by reports review UI, PDF export, and Word DOCX export

export const ASPECT_DESCRIPTIONS: Record<string, string> = {
  "IQ / Kapasitas Intelektual": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Intelegensi umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Intelegensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Kemampuan Kognitif": "Kemampuan kognitif umum dalam memahami masalah dan menyerap informasi baru.",
  "Daya Analisa": "Mampu mengolah dan mengidentifikasi topik-topik serta keterkaitan dari informasi-informasi tersebut; menghubungkan & membandingkan data-data dari berbagai sumber, mengidentifikasi hubungan sebab akibat.",
  "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal.",
  "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan kemampuan berpikir antisipatif.",
  "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan, dengan mempertimbangkan efektivitas dari alternatif solusi yang dibuat.",
  "Pemahaman Verbal": "Kemampuan memahami konsep-konsep verbal, bahasa, dan instruksi tertulis secara akurat.",
  "Kemampuan Numerik": "Kemampuan mengolah data numerik, hitungan, dan penalaran kuantitatif secara cepat dan tepat.",
  "Daya Tangkap": "Kemampuan menyerap dan mencerna informasi baru dalam tempo yang cepat dan akurat.",
  "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh oleh situasi.",
  "Kepekaan": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati).",
  "Kepekaan Emosi / Sosial": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati).",
  "Kepercayaan Diri": "Yakin pada kemampuan dirinya, bisa bersikap tegas, asertif dan mandiri.",
  "Sosiabilitas": "Memiliki minat dan perhatian terhadap orang lain, mampu menciptakan relasi positif dalam berbagai situasi.",
  "Adaptasi": "Kemampuan menyesuaikan diri dengan lingkungan baru dan perubahan situasi kerja.",
  "Komunikasi": "Kemampuan menyampaikan ide dan gagasan dengan lugas, terstruktur, dan efektif.",
  "Orientasi Berprestasi": "Dorongan kuat untuk mencapai standar keunggulan, target kerja yang tinggi dan hasil kerja optimal.",
  "Motivasi Kerja": "Semangat kerja, ketekunan, dan dedikasi dalam menjalankan tugas-tugas organisasi.",
  "Daya Juang": "Kegigihan dan persistensi dalam menyelesaikan tugas meski menghadapi rintangan dan kesulitan.",
  "Kedetailan": "Kecermatan dalam menangani detail pekerjaan secara terstruktur dan teratur.",
  "Perhatian pada Kedetailan Kerja": "Kecermatan dalam menangani detail pekerjaan secara terstruktur dan teratur.",
  "Sistematika Kerja": "Kemampuan merencanakan, mengorganisasi, dan menyelesaikan tugas secara teratur dan metodis.",
  "Kecepatan Kerja": "Tempo penyelesaian pekerjaan secara tepat waktu dengan efisiensi tinggi.",
  "Ketelitian Kerja": "Akurasi tinggi dan minim kesalahan dalam menyelesaikan tugas operasional.",
  "Ketelitian": "Akurasi tinggi dan minim kesalahan dalam menyelesaikan tugas operasional.",
  "Daya Tahan Stress": "Kemampuan mempertahankan performa kerja yang optimal di bawah tekanan atau beban kerja tinggi.",
  "Daya Tahan terhadap Stress": "Kemampuan mempertahankan performa kerja yang optimal di bawah tekanan atau beban kerja tinggi.",
  "Kepemimpinan": "Kemampuan mengarahkan, memotivasi, dan mengkoordinasikan orang lain menuju pencapaian tujuan bersama.",
  "Daya Pimpin": "Kemampuan mengarahkan, memotivasi, dan mengkoordinasikan orang lain menuju pencapaian tujuan bersama.",
  "Inisiatif": "Proaktif dalam mengambil tindakan positif tanpa harus selalu menunggu instruksi formal.",
  "Tanggung Jawab": "Kesadaran dan komitmen penuh terhadap hasil kerja serta kesediaan menanggung risiko tugas.",
  "Kerjasama": "Kemampuan bersinergi dan membangun hubungan kerja yang harmonis di dalam tim kerja.",
  "Pengambilan Keputusan": "Kemampuan menentukan alternatif pilihan solusi secara rasional, cepat, dan tepat sasaran."
};

export const DEFAULT_PRESET_MAPPING = [
  {
    category: "KEMAMPUAN KOGNITIF",
    aspects: [
      { name: "IQ / Kapasitas Intelektual", checked: true, instruments: ["WPT"] },
      { name: "Daya Analisa", checked: true, instruments: ["IST Subtes 3"] },
      { name: "Logika Berpikir", checked: true, instruments: ["IST Subtes 2", "IST Subtes 6"] },
      { name: "Daya Abstraksi", checked: true, instruments: ["IST Subtes 7"] },
      { name: "Problem Solving", checked: true, instruments: ["IST Subtes 7"] }
    ]
  },
  {
    category: "SISI AFEKTIF",
    aspects: [
      { name: "Stabilitas Emosi", checked: true, instruments: ["PAPI Skala E", "PAPI Skala K"] },
      { name: "Kepekaan Emosi / Sosial", checked: true, instruments: ["PAPI Skala X", "PAPI Skala O"] },
      { name: "Kepercayaan Diri", checked: true, instruments: ["PAPI Skala X", "PAPI Skala L", "PAPI Skala S"] }
    ]
  },
  {
    category: "HUBUNGAN ANTAR MANUSIA",
    aspects: [
      { name: "Sosiabilitas", checked: true, instruments: ["PAPI Skala O", "PAPI Skala S", "PAPI Skala B", "PAPI Skala X"] },
      { name: "Adaptasi", checked: true, instruments: ["PAPI Skala S", "PAPI Skala Z"] },
      { name: "Komunikasi", checked: true, instruments: ["PAPI Skala S"] }
    ]
  },
  {
    category: "SIKAP KERJA",
    aspects: [
      { name: "Orientasi Berprestasi", checked: true, instruments: ["PAPI Skala A", "PAPI Skala G", "PAPI Skala N"] },
      { name: "Daya Juang", checked: true, instruments: ["PAPI Skala G", "PAPI Skala A", "PAPI Skala T", "PAPI Skala V"] },
      { name: "Kedetailan", checked: true, instruments: ["PAPI Skala D"] },
      { name: "Sistematika Kerja", checked: true, instruments: ["PAPI Skala C", "PAPI Skala W"] },
      { name: "Kecepatan Kerja", checked: true, instruments: ["PAPI Skala T"] },
      { name: "Ketelitian Kerja", checked: true, instruments: ["PAPI Skala D"] },
      { name: "Daya Tahan Stress", checked: true, instruments: ["PAPI Skala E", "PAPI Skala V"] },
      { name: "Kepemimpinan", checked: true, instruments: ["PAPI Skala L", "PAPI Skala P", "PAPI Skala I"] },
      { name: "Inisiatif", checked: true, instruments: ["PAPI Skala P", "PAPI Skala I"] },
      { name: "Tanggung Jawab", checked: true, instruments: ["PAPI Skala N", "PAPI Skala P"] },
      { name: "Kerjasama", checked: true, instruments: ["PAPI Skala B", "PAPI Skala F"] },
      { name: "Pengambilan Keputusan", checked: true, instruments: ["PAPI Skala I"] }
    ]
  }
];

export const papiScoringKeys: Record<number, { A?: string; B?: string }> = {
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

export const getTiki1Norm = (r: number) => [0,0,0,0,0,1,1,1,2,3,4,5,6,7,8,8,9,10,10,11,11,12,13,13,14,15,15,16,17,17,18,19,19,20,21,22,22,23,24,26,28][r] ?? 0;
export const getTiki2Norm = (r: number) => [4,4,5,5,5,6,7,8,9,9,11,12,13,14,15,16,17,18,19,21,22,24,25,27,29,30,30][r] ?? 4;
export const getTiki3Norm = (r: number) => [0,0,0,0,1,1,1,2,2,3,4,4,5,5,6,7,7,8,8,9,10,10,11,12,12,13,14,15,15,16,17,18,19,20,22,24,25,26,28,30,30][r] ?? 0;
export const getTiki4Norm = (r: number) => [0,0,3,6,7,9,10,12,13,14,16,17,18,18,19,20,21,21,22,23,24,24,25,25,26,28,29,30,30,30,30][r] ?? 0;

export const getTiki6Norm = (r: number) => {
  if (r <= 21) return 0; if (r <= 25) return 1; if (r <= 28) return 2; if (r === 29) return 3;
  if (r <= 32) return 4; if (r <= 34) return 5; if (r <= 36) return 6; if (r <= 38) return 7;
  if (r <= 40) return 8; if (r <= 43) return 9; if (r <= 45) return 10; if (r <= 48) return 11;
  if (r <= 51) return 12; if (r <= 53) return 13; if (r <= 55) return 14; if (r <= 57) return 15;
  if (r <= 59) return 16; if (r <= 62) return 17; if (r <= 65) return 18; if (r <= 69) return 19;
  if (r <= 73) return 20; if (r <= 78) return 21; if (r <= 85) return 22; if (r <= 90) return 23;
  if (r <= 95) return 24; if (r <= 98) return 25; if (r === 99) return 27; return 29;
};

export const getTikiClassification = (s: number) => {
  if (s <= 6) return { label: 'KS', full: 'Kurang Sekali' };
  if (s <= 12) return { label: 'K', full: 'Kurang' };
  if (s <= 18) return { label: 'S', full: 'Sedang' };
  if (s <= 24) return { label: 'B', full: 'Baik' };
  return { label: 'BS', full: 'Baik Sekali' };
};

export const getWPTIQ = (r: number) => {
  const map = [59,59,61,64,67,69,71,73,75,78,80,81,83,86,88,90,93,95,97,98,100,102,104,106,108,111,113,114,116,118,120,121,123,125,126,128,130,132,134,136,138,140,142,143];
  if (r >= 44) return 146;
  return map[r] ?? 59;
};

export const getWPTClassification = (iq: number) => {
  if (iq <= 69) return { label: 'KS/R', full: 'Kurang Sekali / Retarded' };
  if (iq <= 79) return { label: 'KS/B', full: 'Kurang Sekali / Borderline' };
  if (iq <= 89) return { label: 'K/DN', full: 'Kurang / Dull Normal' };
  if (iq <= 109) return { label: 'C/N', full: 'Cukup / Normal' };
  if (iq <= 119) return { label: 'B/BN', full: 'Baik / Bright Normal' };
  if (iq <= 129) return { label: 'BS/S', full: 'Baik Sekali / Superior' };
  return { label: 'BS/VS', full: 'Baik Sekali / Very Superior' };
};

export const getISTClassification = (testType: string, r: number) => {
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

export const getPapiNorm = (trait: string, score: number): string => {
  if (trait === 'L' || trait === 'P') return score <= 4 ? '2-' : score <= 7 ? '3' : score === 8 ? '4' : '5';
  if (trait === 'I') return score <= 2 ? '2-' : score <= 5 ? '3' : score === 6 ? '4' : score === 7 ? '5' : '2+';
  if (trait === 'C') return score <= 2 ? '2-' : score === 3 ? '3' : score === 4 ? '4' : score === 5 ? '5' : '2+';
  if (trait === 'D') return score <= 3 ? '2-' : score <= 6 ? '3' : score === 8 ? '4' : '5';
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

    // Standard decimal
    const num = parseFloat(s.replace(',', '.'));
    if (!isNaN(num)) return num;

    return null;
  };

  const parsedU = parseNumOrFraction(cleanU);
  const parsedK = parseNumOrFraction(cleanK);
  if (parsedU !== null && parsedK !== null) {
    if (Math.abs(parsedU - parsedK) < 0.01) return true;
  }

  return false;
};

// ==========================================
// CANONICAL ASPECT NORMALIZATION & ALIASES
// ==========================================
export function getCanonicalAspectKey(name: string): string {
  if (!name) return '';
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (
    clean.includes('intelegensi') ||
    clean.includes('inteligensi') ||
    clean.includes('kapasitasintelektual') ||
    clean.includes('kognitif') ||
    clean === 'iq'
  ) {
    return 'inteligensi_umum';
  }
  if (clean.includes('dayaanalisa') || clean.includes('analisa') || clean.includes('analisis')) {
    return 'daya_analisa';
  }
  if (clean.includes('logikaberpikir') || clean.includes('penalaranlogis') || clean.includes('logika')) {
    return 'logika_berpikir';
  }
  if (clean.includes('dayaabstraksi') || clean.includes('abstraksi')) {
    return 'daya_abstraksi';
  }
  if (clean.includes('problemsolving') || clean.includes('pemecahanmasalah')) {
    return 'problem_solving';
  }
  if (clean.includes('pemahamanverbal') || clean.includes('verbal')) {
    return 'pemahaman_verbal';
  }
  if (clean.includes('kemampuannumerik') || clean.includes('numerik') || clean.includes('hitung')) {
    return 'kemampuan_numerik';
  }
  if (clean.includes('dayatangkap')) {
    return 'daya_tangkap';
  }
  if (clean.includes('stabilitasemosi') || clean.includes('kestabilanemosi') || clean.includes('emosi')) {
    if (clean.includes('kepekaan')) return 'kepekaan';
    return 'stabilitas_emosi';
  }
  if (clean.includes('kepekaan')) {
    return 'kepekaan';
  }
  if (clean.includes('kepercayaandiri') || clean.includes('percayadiri')) {
    return 'kepercayaan_diri';
  }
  if (clean.includes('sosiabilitas') || clean.includes('sosial')) {
    return 'sosiabilitas';
  }
  if (clean.includes('adaptasi') || clean.includes('penyesuaiandiri')) {
    return 'adaptasi';
  }
  if (clean.includes('komunikasi')) {
    return 'komunikasi';
  }
  if (clean.includes('orientasiberprestasi') || clean.includes('motivasiberprestasi') || clean.includes('prestasikerja')) {
    return 'orientasi_berprestasi';
  }
  if (clean.includes('motivasikerja') || clean.includes('motivasi')) {
    return 'motivasi_kerja';
  }
  if (clean.includes('dayajuang') || clean.includes('keuletan')) {
    return 'daya_juang';
  }
  if (clean.includes('kedetailan') || clean.includes('perhatianpadakedetailan') || clean.includes('detail')) {
    return 'kedetailan';
  }
  if (clean.includes('sistematikakerja') || clean.includes('sistematika') || clean.includes('keteraturan')) {
    return 'sistematika_kerja';
  }
  if (clean.includes('kecepatankerja') || clean.includes('kecepatan')) {
    return 'kecepatan_kerja';
  }
  if (clean.includes('ketelitiankerja') || clean.includes('ketelitian')) {
    return 'ketelitian_kerja';
  }
  if (clean.includes('dayatahanstress') || clean.includes('dayatahanterhadapstress') || clean.includes('tahanstress') || clean.includes('stress')) {
    return 'daya_tahan_stress';
  }
  if (clean.includes('kepemimpinan') || clean.includes('dayapimpin') || clean.includes('leadership')) {
    return 'kepemimpinan';
  }
  if (clean.includes('inisiatif')) {
    return 'inisiatif';
  }
  if (clean.includes('tanggungjawab')) {
    return 'tanggung_jawab';
  }
  if (clean.includes('kerjasama') || clean.includes('teamwork')) {
    return 'kerjasama';
  }
  if (clean.includes('pengambilankeputusan') || clean.includes('putusankeputusan') || clean.includes('keputusan')) {
    return 'pengambilan_keputusan';
  }

  return clean;
}

export function lookupAspectScore(dict: Record<string, number> | null | undefined, aspectName: string): number | undefined {
  if (!dict || typeof dict !== 'object' || !aspectName) return undefined;

  // 1. Direct exact key lookup
  if (dict[aspectName] !== undefined && typeof dict[aspectName] === 'number') {
    return dict[aspectName];
  }

  // 2. Case-insensitive exact match
  const cleanTarget = aspectName.trim().toLowerCase();
  for (const [k, v] of Object.entries(dict)) {
    if (k.trim().toLowerCase() === cleanTarget && typeof v === 'number') {
      return v;
    }
  }

  // 3. Canonical alias match
  const canonTarget = getCanonicalAspectKey(aspectName);
  for (const [k, v] of Object.entries(dict)) {
    if (getCanonicalAspectKey(k) === canonTarget && typeof v === 'number') {
      return v;
    }
  }

  return undefined;
}

export function resolveTargetScore(
  aspectName: string,
  grayAreasMap: Record<string, number> | null | undefined,
  fallback = 3
): number {
  const target = lookupAspectScore(grayAreasMap, aspectName);
  if (target !== undefined) return target;
  return fallback;
}

export function resolveFinalAspectScore(
  aspectName: string,
  modifiedScores: Record<string, number> | null | undefined,
  computerScores: Record<string, number> | null | undefined,
  fallback = 3
): number {
  // 1. Manual psychologist overrides have top priority
  const mod = lookupAspectScore(modifiedScores, aspectName);
  if (mod !== undefined) return mod;

  // 2. Computer scores calculated from actual test results
  const comp = lookupAspectScore(computerScores, aspectName);
  if (comp !== undefined) return comp;

  // 3. Fallback to standard 3
  return fallback;
}

const avgFloor = (...items: (number | null | undefined)[]) => {
  const valid = items.filter((n): n is number => typeof n === 'number' && !isNaN(n));
  if (valid.length === 0) return 3;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.max(1, Math.min(5, Math.floor(sum / valid.length)));
};

// ==========================================
// FULL COMPUTER SCORES CALCULATION
// ==========================================
export function calculateComputerScores(participant: any): Record<string, number> {
  const scores: Record<string, number> = {};
  if (!participant) return scores;

  const answers = Array.isArray(participant.answers) ? participant.answers : [];
  const rawResults = Array.isArray(participant.rawResults) ? participant.rawResults : [];

  // 1. WPT Scale
  const calculateWptScale = (): number | null => {
    const wptAnswers = answers.filter((a: any) =>
      a.question && (a.question.testType === 'WPT' || a.question.testType === 'WPT_AGE')
    );
    if (wptAnswers.length === 0) return null;

    let wptCorrect = 0;
    wptAnswers.forEach((ans: any) => {
      if (!ans.question || !ans.question.correct) return;
      if (checkAnswerMatch(ans.selectedOption, ans.question.correct, 'WPT')) wptCorrect++;
    });

    const ageRaw = rawResults.find((r: any) => r.testType === 'WPT_AGE');
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
    if (iq <= 89) return 2;
    if (iq <= 109) return 3;
    if (iq <= 119) return 4;
    return 5;
  };

  // 2. IST Scales (IST 1 to 9)
  const calculateIstScale = (subtest: string): number | null => {
    const istAnswers = answers.filter((a: any) =>
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

  // 3. TIKI Scales (TIKI 1, 2, 3, 4, 6)
  const calculateTikiScale = (subtest: string): number | null => {
    const tikiAnswers = answers.filter((a: any) =>
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

  // 4. PAPI KOSTICK
  const papiRaw: Record<string, number> = {
    N: 0, G: 0, A: 0, L: 0, P: 0, I: 0, T: 0, V: 0, X: 0, S: 0,
    B: 0, O: 0, R: 0, D: 0, C: 0, Z: 0, E: 0, K: 0, F: 0, W: 0
  };
  let hasPapi = false;
  const papiQuestions = answers
    .filter((a: any) => a.question && (a.question.testType === 'PAPI' || a.question.testType === 'PAPI_KOSTICK' || a.question.testType === 'PAPI KOSTICK'))
    .map((a: any) => a.question)
    .filter((q: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === q.id) === i)
    .sort((a: any, b: any) => a.id - b.id);

  if (papiQuestions.length > 0) {
    hasPapi = true;
    papiQuestions.forEach((q: any, idx: number) => {
      const ans = answers.find((a: any) => a.questionId === q.id);
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

  // 5. Kraepelin Scales
  const kraepelinRawObj = rawResults.find((r: any) => r.testType === 'KRAEPELIN' || r.testType === 'KREAPELIN');
  let kraepelinNorms: { pankerNorm?: number; tinkerNorm?: number; jankerNorm?: number; hankerNorm?: number } = {};
  if (kraepelinRawObj && kraepelinRawObj.rawData) {
    try {
      const parsed = JSON.parse(kraepelinRawObj.rawData);
      if (parsed.panker?.scale1to5) kraepelinNorms.pankerNorm = parsed.panker.scale1to5;
      else if (parsed.pankerNorm) kraepelinNorms.pankerNorm = parsed.pankerNorm;

      if (parsed.tinker?.scale1to5) kraepelinNorms.tinkerNorm = parsed.tinker.scale1to5;
      else if (parsed.tinkerNorm) kraepelinNorms.tinkerNorm = parsed.tinkerNorm;

      if (parsed.janker?.scale1to5) kraepelinNorms.jankerNorm = parsed.janker.scale1to5;
      else if (parsed.jankerNorm) kraepelinNorms.jankerNorm = parsed.jankerNorm;

      if (parsed.hanker?.scale1to5) kraepelinNorms.hankerNorm = parsed.hanker.scale1to5;
      else if (parsed.hankerNorm) kraepelinNorms.hankerNorm = parsed.hankerNorm;
    } catch (e) {}
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

  // Base Cognitive Scales
  const cogScale = wptVal ?? tiki6Val ?? ist3Val ?? 3;
  const verbalScale = avgFloor(ist2Val, tiki3Val, wptVal);
  const logicScale = avgFloor(ist3Val, ist6Val, wptVal);
  const abstractScale = avgFloor(ist4Val, ist6Val, ist7Val, ist8Val, tiki6Val, wptVal);
  const numericScale = avgFloor(ist5Val, ist6Val, tiki1Val, wptVal);
  const catchScale = avgFloor(ist1Val, ist9Val, wptVal);
  const problemScale = avgFloor(cogScale, logicScale, wptVal);

  // Populate canonical cognitive aspects with alias keys
  scores['IQ / Kapasitas Intelektual'] = cogScale;
  scores['Inteligensi Umum'] = cogScale;
  scores['Intelegensi umum'] = cogScale;
  scores['Intelegensi Umum'] = cogScale;
  scores['Kemampuan Kognitif'] = cogScale;
  scores['Daya Analisa'] = logicScale;
  scores['Logika Berpikir'] = logicScale;
  scores['Daya Abstraksi'] = abstractScale;
  scores['Pemahaman Verbal'] = verbalScale;
  scores['Kemampuan Numerik'] = numericScale;
  scores['Problem Solving'] = problemScale;
  scores['Daya Tangkap'] = catchScale;

  if (hasPapi) {
    scores['Orientasi Berprestasi'] = getPapiNumericNorm('A', papiRaw.A);
    scores['Motivasi Kerja'] = avgFloor(getPapiNumericNorm('A', papiRaw.A), getPapiNumericNorm('G', papiRaw.G));
    scores['Daya Juang'] = avgFloor(getPapiNumericNorm('G', papiRaw.G), getPapiNumericNorm('N', papiRaw.N), getPapiNumericNorm('A', papiRaw.A));
    scores['Kedetailan'] = getPapiNumericNorm('D', papiRaw.D);
    scores['Perhatian pada Kedetailan Kerja'] = getPapiNumericNorm('D', papiRaw.D);
    scores['Ketelitian Kerja'] = avgFloor(getPapiNumericNorm('D', papiRaw.D), getPapiNumericNorm('W', papiRaw.W));
    scores['Ketelitian'] = avgFloor(getPapiNumericNorm('D', papiRaw.D), getPapiNumericNorm('W', papiRaw.W));
    scores['Sistematika Kerja'] = avgFloor(getPapiNumericNorm('C', papiRaw.C), getPapiNumericNorm('W', papiRaw.W));
    scores['Kecepatan Kerja'] = getPapiNumericNorm('T', papiRaw.T);
    scores['Daya Tahan Stress'] = avgFloor(getPapiNumericNorm('E', papiRaw.E), getPapiNumericNorm('V', papiRaw.V));
    scores['Daya Tahan terhadap Stress'] = avgFloor(getPapiNumericNorm('E', papiRaw.E), getPapiNumericNorm('V', papiRaw.V));
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
  }

  // Override / refine with preset dynamic mapping instruments
  const jobPosition = participant.jobPosition || participant.test?.jobPosition;
  const preset = jobPosition?.psychographPreset || participant.test?.psychographPreset;
  let presetMapping: any[] = [];
  if (preset?.mapping) {
    try {
      presetMapping = JSON.parse(preset.mapping);
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

  // Pre-calculated norm results in DB (if any)
  if (Array.isArray(participant.normResults)) {
    participant.normResults.forEach((curr: any) => {
      if (curr.parameter && typeof curr.score === 'number') {
        scores[curr.parameter] = curr.score;
      }
    });
  }

  return scores;
}
