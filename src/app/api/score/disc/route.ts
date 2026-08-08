import { NextResponse } from 'next/server';

const scoringKeys: Record<number, { most: Record<string, string>, least: Record<string, string> }> = {
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

export async function POST(req: Request) {
  try {
    const { answers, questions } = await req.json();

    let scores = {
      most: { D: 0, I: 0, S: 0, C: 0 },
      least: { D: 0, I: 0, S: 0, C: 0 },
      diff: { D: 0, I: 0, S: 0, C: 0 },
      profile: { D: 0, I: 0, S: 0, C: 0 }
    };

    for (const q of questions) {
      const qNum = q.number;
      const ansMost = answers[`${q.id}_most`]; // "A", "B", "C", "D"
      const ansLeast = answers[`${q.id}_least`];

      if (!scoringKeys[qNum]) continue;

      if (ansMost) {
        const valMost = scoringKeys[qNum].most[ansMost];
        if (valMost && valMost !== 'B') scores.most[valMost as 'D'|'I'|'S'|'C']++;
      }
      
      if (ansLeast) {
        const valLeast = scoringKeys[qNum].least[ansLeast];
        if (valLeast && valLeast !== 'B') scores.least[valLeast as 'D'|'I'|'S'|'C']++;
      }
    }

    scores.diff.D = scores.most.D - scores.least.D;
    scores.diff.I = scores.most.I - scores.least.I;
    scores.diff.S = scores.most.S - scores.least.S;
    scores.diff.C = scores.most.C - scores.least.C;

    const getProfileD = (diff: number) => {
        if (diff <= -12) return 1;
        if (diff <= -10) return 2;
        if (diff <= -6) return 3;
        if (diff <= 0) return 4;
        if (diff <= 5) return 5;
        if (diff <= 9) return 6;
        if (diff <= 13) return 7;
        return 8;
    };
    const getProfileI = (diff: number) => {
        if (diff <= -9) return 1;
        if (diff <= -6) return 2;
        if (diff <= -3) return 3;
        if (diff <= -1) return 4;
        if (diff <= 2) return 5;
        if (diff <= 4) return 6;
        if (diff <= 7) return 7;
        return 8;
    };
    const getProfileS = (diff: number) => {
        if (diff <= -10) return 1;
        if (diff <= -8) return 2;
        if (diff <= -5) return 3;
        if (diff <= -1) return 4;
        if (diff <= 2) return 5;
        if (diff <= 5) return 6;
        if (diff <= 9) return 7;
        return 8;
    };
    const getProfileC = (diff: number) => {
        if (diff <= -13) return 1;
        if (diff <= -8) return 2;
        if (diff <= -5) return 3;
        if (diff <= -3) return 4;
        if (diff <= 0) return 5;
        if (diff <= 2) return 6;
        if (diff <= 4) return 7;
        return 8;
    };

    scores.profile.D = getProfileD(scores.diff.D);
    scores.profile.I = getProfileI(scores.diff.I);
    scores.profile.S = getProfileS(scores.diff.S);
    scores.profile.C = getProfileC(scores.diff.C);

    return NextResponse.json({ success: true, scores });
  } catch (error) {
    console.error("Error scoring DISC:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
