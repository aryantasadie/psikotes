import { NextResponse } from 'next/server';

const papiScoringKeys: Record<number, { A: string, B: string }> = {
  "1": { "A": "G", "B": "E" },
  "2": { "A": "A", "B": "N" },
  "3": { "A": "P", "B": "A" },
  "4": { "A": "X", "B": "P" },
  "5": { "A": "B", "B": "X" },
  "6": { "A": "O", "B": "B" },
  "7": { "A": "Z", "B": "O" },
  "8": { "A": "K", "B": "Z" },
  "9": { "A": "F", "B": "K" },
  "10": { "A": "W", "B": "F" },
  "11": { "A": "G", "B": "C" },
  "12": { "A": "L", "B": "E" },
  "13": { "A": "P", "B": "N" },
  "14": { "A": "X", "B": "A" },
  "15": { "A": "B", "B": "P" },
  "16": { "A": "O", "B": "X" },
  "17": { "A": "Z", "B": "B" },
  "18": { "A": "K", "B": "O" },
  "19": { "A": "F", "B": "Z" },
  "20": { "A": "W", "B": "K" },
  "21": { "A": "G", "B": "D" },
  "22": { "A": "L", "B": "C" },
  "23": { "A": "I", "B": "E" },
  "24": { "A": "X", "B": "N" },
  "25": { "A": "B", "B": "A" },
  "26": { "A": "O", "B": "P" },
  "27": { "A": "Z", "B": "X" },
  "28": { "A": "K", "B": "B" },
  "29": { "A": "F", "B": "O" },
  "30": { "A": "W", "B": "Z" },
  "31": { "A": "G", "B": "R" },
  "32": { "A": "L", "B": "D" },
  "33": { "A": "I", "B": "C" },
  "34": { "A": "T", "B": "E" },
  "35": { "A": "B", "B": "N" },
  "36": { "A": "O", "B": "A" },
  "37": { "A": "Z", "B": "P" },
  "38": { "A": "K", "B": "X" },
  "39": { "A": "F", "B": "B" },
  "40": { "A": "W", "B": "O" },
  "41": { "A": "G", "B": "S" },
  "42": { "A": "L", "B": "R" },
  "43": { "A": "I", "B": "D" },
  "44": { "A": "T", "B": "C" },
  "45": { "A": "V", "B": "E" },
  "46": { "A": "O", "B": "N" },
  "47": { "A": "Z", "B": "A" },
  "48": { "A": "K", "B": "P" },
  "49": { "A": "F", "B": "X" },
  "50": { "A": "W", "B": "B" },
  "51": { "A": "G", "B": "V" },
  "52": { "A": "L", "B": "S" },
  "53": { "A": "I", "B": "R" },
  "54": { "A": "T", "B": "D" },
  "55": { "A": "V", "B": "C" },
  "56": { "A": "S", "B": "E" },
  "57": { "A": "Z", "B": "N" },
  "58": { "A": "K", "B": "A" },
  "59": { "A": "F", "B": "P" },
  "60": { "A": "W", "B": "X" },
  "61": { "A": "G", "B": "T" },
  "62": { "A": "L", "B": "V" },
  "63": { "A": "I", "B": "S" },
  "64": { "A": "T", "B": "R" },
  "65": { "A": "V", "B": "D" },
  "66": { "A": "S", "B": "C" },
  "67": { "A": "R", "B": "E" },
  "68": { "A": "K", "B": "N" },
  "69": { "A": "F", "B": "A" },
  "70": { "A": "W", "B": "P" },
  "71": { "A": "G", "B": "I" },
  "72": { "A": "L", "B": "T" },
  "73": { "A": "I", "B": "V" },
  "74": { "A": "T", "B": "S" },
  "75": { "A": "V", "B": "R" },
  "76": { "A": "S", "B": "D" },
  "77": { "A": "R", "B": "C" },
  "78": { "A": "D", "B": "E" },
  "79": { "A": "F", "B": "N" },
  "80": { "A": "W", "B": "A" },
  "81": { "A": "G", "B": "L" },
  "82": { "A": "L", "B": "I" },
  "83": { "A": "I", "B": "T" },
  "84": { "A": "T", "B": "V" },
  "85": { "A": "V", "B": "S" },
  "86": { "A": "S", "B": "R" },
  "87": { "A": "R", "B": "D" },
  "88": { "A": "D", "B": "C" },
  "89": { "A": "C", "B": "E" },
  "90": { "A": "W", "B": "N" }
};

const TRAITS = ['G', 'L', 'I', 'T', 'V', 'S', 'R', 'D', 'C', 'E', 'N', 'A', 'P', 'X', 'B', 'O', 'Z', 'K', 'F', 'W'];

export async function POST(request: Request) {
  try {
    const { answers, questions } = await request.json();
    
    // Initialize scores
    const scores: Record<string, number> = {};
    TRAITS.forEach(t => scores[t] = 0);

    let answeredCount = 0;

    const sortedQuestions = [...questions].sort((a: any, b: any) => a.id - b.id);

    sortedQuestions.forEach((q: any, idx: number) => {
      const qNum = idx + 1;
      const ans = answers[q.id];
      if (ans && papiScoringKeys[qNum]) {
        const selectedTrait = papiScoringKeys[qNum][ans as 'A' | 'B'];
        if (selectedTrait && scores[selectedTrait] !== undefined) {
          scores[selectedTrait]++;
          answeredCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      scores,
      answeredCount,
      totalQuestions: 90
    });
  } catch (error) {
    console.error("PAPI Scoring Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
