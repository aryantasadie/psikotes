import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(role)) {
    return NextResponse.json({ error: 'Akses ditolak: Khusus staf penguji' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('testType');
  
  try {
    const query: any = {
      orderBy: { id: 'asc' },
      take: 200
    };
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
    
    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch questions' }, { status: 500 });
  }
}
