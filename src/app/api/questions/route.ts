import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    // Tolak akses jika role bukan peserta (testee) atau superadmin/tester
    if (!['testee', 'user', 'superadmin', 'tester'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Portal klien dilarang mengakses bank soal' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('testType');
    
    // Keamanan: Wajib menyertakan parameter testType agar tidak bisa mendump seluruh isi bank soal sekaligus
    if (!testType && (userRole === 'testee' || userRole === 'user')) {
      return NextResponse.json({ success: false, error: 'Parameter testType wajib disertakan' }, { status: 400 });
    }

    // Jika peserta, validasi apakah modul ini memang dijadwalkan untuk sesi ujiannya
    if (userRole === 'testee' || userRole === 'user') {
      const userId = parseInt((session.user as any).id, 10);
      const participant = await prisma.testParticipant.findFirst({
        where: { userId },
        include: { test: true },
        orderBy: { id: 'desc' }
      });

      if (!participant || !participant.test) {
        return NextResponse.json({ success: false, error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
      }

      let sequence: string[] = [];
      try {
        sequence = JSON.parse(participant.test.sequence || '[]');
      } catch (e) {
        sequence = [];
      }

      // Normalisasi nama modul yang diminta
      const cleanRequested = (testType || '').toUpperCase().replace(/[\s\-_]+/g, '');
      const isAllowed = sequence.some(tool => {
        const cleanTool = tool.toUpperCase().replace(/[\s\-_]+/g, '');
        return cleanRequested.startsWith(cleanTool) || cleanTool.startsWith(cleanRequested);
      });

      if (sequence.length > 0 && !isAllowed) {
        return NextResponse.json({ success: false, error: 'Alat tes ini tidak terdaftar dalam jadwal ujian Anda' }, { status: 403 });
      }
    }

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

    const questions = await prisma.question.findMany({
      ...query,
      orderBy: { id: 'asc' }
    });
    
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
