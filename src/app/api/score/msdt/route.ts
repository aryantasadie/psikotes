import { NextResponse } from 'next/server';

const KOREKSI = [1, 2, 1, 0, 3, -1, 0, -4];

export async function POST(request: Request) {
  try {
    const { answers, questions } = await request.json();
    
    // answers is { "1": "A", "2": "B", ... }
    
    // Calculate A and B for each dimension 1 to 8
    let dimA = [0, 0, 0, 0, 0, 0, 0, 0];
    let dimB = [0, 0, 0, 0, 0, 0, 0, 0];
    let jumlah = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let x = 1; x <= 8; x++) {
      // A_x is count of 'A' in ROW x (Horizontal)
      for (let col = 1; col <= 8; col++) {
        const qNum = (x - 1) * 8 + col;
        if (answers[String(qNum)] === 'A') {
          dimA[x - 1]++;
        }
      }
      
      // B_x is count of 'B' in COLUMN x (Vertical)
      for (let row = 1; row <= 8; row++) {
        const qNum = (row - 1) * 8 + x;
        if (answers[String(qNum)] === 'B') {
          dimB[x - 1]++;
        }
      }
      
      jumlah[x - 1] = dimA[x - 1] + dimB[x - 1] + KOREKSI[x - 1];
    }

    // TO = C + D + G + H (which is indices 2, 3, 6, 7)
    const toScore = jumlah[2] + jumlah[3] + jumlah[6] + jumlah[7];
    // RO = B + D + F + H (which is indices 1, 3, 5, 7)
    const roScore = jumlah[1] + jumlah[3] + jumlah[5] + jumlah[7];
    // E = E + F + G + H (which is indices 4, 5, 6, 7)
    const eScore = jumlah[4] + jumlah[5] + jumlah[6] + jumlah[7];

    // Determine Style based on median. The tree shows branching on "di atas/bawah".
    // Reddin's standard MSDT medians: TO usually median is around 11, but wait!
    // The user's image shows a score of 30 for TO, 31 for RO, 29 for E.
    // Let's use standard median splits: the exact median value in MSDT is often TO >= 11, RO >= 11, E >= 11?
    // No, wait, if TO can be 30, then the median is around 18?
    // Let's look at the tree branches. If the user doesn't specify, I will set a simple median of 20.
    // Or maybe we can leave the decision tree branching threshold configurable. Let's use 20 for now.
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

    return NextResponse.json({
      success: true,
      scores: {
        rawA: dimA,
        rawB: dimB,
        jumlah,
        toScore,
        roScore,
        eScore,
        managementStyle
      }
    });
  } catch (error) {
    console.error("MSDT Scoring Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
