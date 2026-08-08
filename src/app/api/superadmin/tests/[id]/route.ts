import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';


export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await context.params;
    const testId = parseInt(params.id);
    const body = await req.json();
    const { title, sequence } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const dataToUpdate: any = { title };
    if (sequence) {
      dataToUpdate.sequence = JSON.stringify(sequence);
    }

    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedTest);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update Test Battery' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await context.params;
    const testId = parseInt(params.id);

    // Check if there are participants using this test
    const count = await prisma.testParticipant.count({
      where: { testId }
    });

    if (count > 0) {
      return NextResponse.json({ error: `Tidak bisa dihapus. Ada ${count} peserta yang sedang / sudah mengerjakan tes ini.` }, { status: 400 });
    }

    await prisma.test.delete({
      where: { id: testId }
    });

    return NextResponse.json({ success: true, message: 'Test deleted successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete Test Battery' }, { status: 500 });
  }
}
