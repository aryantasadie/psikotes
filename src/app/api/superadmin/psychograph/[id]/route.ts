import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const preset = await prisma.psychographPreset.findUnique({
      where: { id: parseInt(id) },
      include: { tests: true }
    });
    
    if (!preset) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    const responseData = {
      ...preset,
      testSequence: preset.tests && preset.tests.length > 0 ? preset.tests[0].sequence : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching psychograph preset:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    const { name, mapping, sequence } = body;

    const updated = await prisma.psychographPreset.update({
      where: { id: parseInt(id) },
      data: {
        name,
        mapping: JSON.stringify(mapping)
      }
    });

    await prisma.test.updateMany({
      where: { psychographPresetId: updated.id },
      data: {
        title: name,
        sequence: JSON.stringify(sequence || [])
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating psychograph preset:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.psychographPreset.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting psychograph preset:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
