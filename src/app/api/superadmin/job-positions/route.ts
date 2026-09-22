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
    const jobPositions = await prisma.jobPosition.findMany({
      include: {
        psychographPreset: true,
        grayAreas: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(jobPositions);
  } catch (error) {
    console.error('Error fetching job positions:', error);
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
    const { name, description, psychographPresetId, grayAreas } = body;

    if (!name || !psychographPresetId) {
      return NextResponse.json({ error: 'Name and psychographPresetId are required' }, { status: 400 });
    }

    const newJobPosition = await prisma.jobPosition.create({
      data: {
        name,
        description,
        psychographPresetId: parseInt(psychographPresetId),
        grayAreas: {
          create: (grayAreas || []).map((ga: any) => ({
            parameter: ga.parameter,
            targetScore: ga.targetScore
          }))
        }
      }
    });

    return NextResponse.json(newJobPosition);
  } catch (error) {
    console.error('Error creating job position:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
