import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // Untuk admin, kita kembalikan kunci jawaban (correct)
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch questions' }, { status: 500 });
  }
}
