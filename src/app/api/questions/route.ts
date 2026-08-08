import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('testType');
  
  try {
    const query: any = {};
    if (testType) {
      if (testType === 'POWER' || testType === 'POWER LEADER' || testType === 'POWER_LEADER') {
        query.where = { testType: { in: ['POWER', 'POWER LEADER', 'POWER_LEADER'] } };
      } else if (testType === 'PAPI' || testType === 'PAPI_KOSTICK' || testType === 'PAPI KOSTICK') {
        query.where = { testType: { in: ['PAPI', 'PAPI_KOSTICK', 'PAPI KOSTICK'] } };
      } else if (testType === 'IST') {
        query.where = { testType: { startsWith: 'IST' } };
      } else if (testType === 'CFIT') {
        query.where = { testType: { startsWith: 'CFIT' } };
      } else if (testType === 'TIKI') {
        query.where = { testType: { startsWith: 'TIKI' } };
      } else {
        query.where = { testType };
      }
    }
    const questions = await prisma.question.findMany(query);
    
    // Hilangkan informasi kunci jawaban (correct) demi keamanan sisi klien
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      testType: q.testType,
      content: q.content,
      options: JSON.parse(q.options || "[]")
    }));
    
    return NextResponse.json({ success: true, questions: sanitizedQuestions });
  } catch (error) {
    console.error("Gagal menarik data soal:", error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
