export const getDiscScale = (type: 'D' | 'I' | 'S' | 'C', diff: number) => {
  if (type === 'D') {
    if (diff <= -12) return 1; if (diff <= -10) return 2; if (diff <= -6) return 3;
    if (diff <= 0) return 4; if (diff <= 5) return 5; if (diff <= 9) return 6;
    if (diff <= 13) return 7; return 8;
  }
  if (type === 'I') {
    if (diff <= -9) return 1; if (diff <= -6) return 2; if (diff <= -3) return 3;
    if (diff <= -1) return 4; if (diff <= 2) return 5; if (diff <= 4) return 6;
    if (diff <= 7) return 7; return 8;
  }
  if (type === 'S') {
    if (diff <= -10) return 1; if (diff <= -8) return 2; if (diff <= -5) return 3;
    if (diff <= -1) return 4; if (diff <= 2) return 5; if (diff <= 5) return 6;
    if (diff <= 9) return 7; return 8;
  }
  if (type === 'C') {
    if (diff <= -13) return 1; if (diff <= -8) return 2; if (diff <= -5) return 3;
    if (diff <= -3) return 4; if (diff <= 0) return 5; if (diff <= 2) return 6;
    if (diff <= 4) return 7; return 8;
  }
  return 4;
};

export const mapScoreToYPercent = (metric: string, score: number) => {
  const getRow = () => {
    switch (metric) {
      case 'DM':
        if (score >= 21) return 12; if (score === 16) return 13; if (score === 15) return 14;
        if (score === 14) return 17; if (score === 13) return 18; if (score === 12) return 21;
        if (score === 11) return 22; if (score === 10) return 23; if (score === 9) return 25;
        if (score === 8) return 27; if (score === 7) return 28; if (score === 6) return 30;
        if (score === 5) return 32; if (score === 4) return 33; if (score === 3) return 35;
        if (score === 2) return 38; if (score === 1) return 41; if (score === 0) return 43;
        return 44;
      case 'IM':
        if (score >= 19) return 12; if (score === 11) return 13; if (score === 10) return 14;
        if (score === 9) return 15; if (score === 8) return 16; if (score === 7) return 17;
        if (score === 6) return 22; if (score === 5) return 23; if (score === 4) return 27;
        if (score === 3) return 32; if (score === 2) return 35; if (score === 1) return 40;
        return 44;
      case 'SM':
        if (score >= 20) return 12; if (score === 15) return 13; if (score === 14) return 14;
        if (score === 13) return 15; if (score === 12) return 16; if (score === 11) return 17;
        if (score === 10) return 18; if (score === 9) return 21; if (score === 8) return 23;
        if (score === 7) return 24; if (score === 6) return 27; if (score === 5) return 28;
        if (score === 4) return 31; if (score === 3) return 33; if (score === 2) return 37;
        if (score === 1) return 39; if (score === 0) return 42; return 44;
      case 'CM':
        if (score >= 12) return 12; if (score === 11) return 13; if (score === 10) return 14;
        if (score === 9) return 15; if (score === 8) return 16; if (score === 7) return 17;
        if (score === 6) return 23; if (score === 5) return 25; if (score === 4) return 28;
        if (score === 3) return 33; if (score === 2) return 37; if (score === 1) return 40;
        if (score === 0) return 43; return 44;
      case 'DL':
        if (score <= 0) return 12; if (score === 1) return 14; if (score === 2) return 19;
        if (score === 3) return 24; if (score === 4) return 26; if (score === 5) return 28;
        if (score === 6) return 30; if (score === 7) return 32; if (score === 8) return 33;
        if (score === 9) return 35; if (score === 10) return 36; if (score === 11) return 37;
        if (score === 12) return 39; if (score === 13) return 41; if (score === 14) return 42;
        if (score === 15) return 43; return 44;
      case 'IL':
        if (score <= 0) return 13; if (score === 1) return 15; if (score === 2) return 20;
        if (score === 3) return 24; if (score === 4) return 28; if (score === 5) return 30;
        if (score === 6) return 34; if (score === 7) return 37; if (score === 8) return 39;
        if (score === 9) return 41; if (score === 10) return 43; return 44;
      case 'SL':
        if (score <= 0) return 12; if (score === 1) return 13; if (score === 2) return 15;
        if (score === 3) return 20; if (score === 4) return 24; if (score === 5) return 26;
        if (score === 6) return 28; if (score === 7) return 32; if (score === 8) return 34;
        if (score === 9) return 36; if (score === 10) return 39; if (score === 11) return 41;
        if (score === 12) return 43; return 44;
      case 'CL':
        if (score <= 0) return 12; if (score === 1) return 13; if (score === 2) return 16;
        if (score === 3) return 20; if (score === 4) return 24; if (score === 5) return 26;
        if (score === 6) return 28; if (score === 7) return 30; if (score === 8) return 32;
        if (score === 9) return 35; if (score === 10) return 37; if (score === 11) return 41;
        if (score === 12) return 42; if (score === 13) return 43; return 44;
      case 'DC':
        if (score >= 21) return 12; if (score === 16) return 13; if (score === 15) return 14;
        if (score === 14) return 15; if (score === 13) return 16; if (score === 12) return 17;
        if (score === 10) return 18; if (score === 9) return 21; if (score === 8) return 22;
        if (score === 7) return 24; if (score === 6) return 25; if (score === 5) return 26;
        if (score === 4) return 27; if (score === 1) return 28; if (score === 0) return 29;
        if (score === -1) return 30; if (score === -2) return 31; if (score === -3) return 32;
        if (score === -4) return 33; if (score === -5) return 34; if (score === -6) return 35;
        if (score === -7) return 36; if (score === -9) return 37; if (score === -10) return 39;
        if (score === -11) return 41; if (score === -12) return 42; if (score === -13) return 43;
        return 44;
      case 'IC':
        if (score >= 10) return 12; if (score === 9) return 13; if (score === 8) return 14;
        if (score === 7) return 16; if (score === 6) return 17; if (score === 5) return 19;
        if (score === 4) return 21; if (score === 3) return 23; if (score === 2) return 26;
        if (score === 1) return 27; if (score === 0) return 28; if (score === -1) return 30;
        if (score === -2) return 33; if (score === -3) return 34; if (score === -4) return 36;
        if (score === -5) return 37; if (score === -6) return 39; if (score === -7) return 40;
        if (score === -8) return 42; if (score === -9) return 43; return 44;
      case 'SC':
        if (score >= 13) return 12; if (score === 12) return 13; if (score === 11) return 14;
        if (score === 10) return 15; if (score === 9) return 16; if (score === 8) return 17;
        if (score === 7) return 18; if (score === 6) return 20; if (score === 5) return 21;
        if (score === 4) return 22; if (score === 3) return 23; if (score === 1) return 26;
        if (score === 0) return 27; if (score === -1) return 30; if (score === -2) return 31;
        if (score === -3) return 32; if (score === -4) return 33; if (score === -5) return 34;
        if (score === -6) return 36; if (score === -7) return 37; if (score === -8) return 39;
        if (score === -9) return 40; if (score === -10) return 43; return 44;
      case 'CC':
        if (score >= 17) return 12; if (score === 7) return 13; if (score === 6) return 14;
        if (score === 5) return 15; if (score === 4) return 16; if (score === 3) return 19;
        if (score === 2) return 21; if (score === 1) return 23; if (score === 0) return 26;
        if (score === -1) return 27; if (score === -2) return 28; if (score === -3) return 30;
        if (score === -4) return 31; if (score === -5) return 35; if (score === -6) return 36;
        if (score === -7) return 37; if (score === -8) return 39; if (score === -9) return 40;
        if (score === -10) return 42; if (score === -11) return 43; return 44;
    }
    return 44;
  };
  
  const row = getRow();
  // 44 -> 0%, 12 -> 100%
  // (44 - row) / 32 * 100
  return ((44 - row) / 32) * 100;
};
