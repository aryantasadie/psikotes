import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const presets = await prisma.psychographPreset.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(presets);
  } catch (error) {
    console.error('Error fetching psychograph presets:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, mapping, sequence } = body;

    if (!name || !mapping) {
      return NextResponse.json({ error: 'Name and mapping are required' }, { status: 400 });
    }

    const newPreset = await prisma.psychographPreset.create({
      data: {
        name,
        mapping: JSON.stringify(mapping),
        tests: {
          create: {
            title: name,
            sequence: JSON.stringify(sequence || [])
          }
        }
      }
    });

    return NextResponse.json(newPreset);
  } catch (error) {
    console.error('Error creating psychograph preset:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
