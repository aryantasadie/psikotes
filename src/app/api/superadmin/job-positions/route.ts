import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const onlyClient = searchParams.get('onlyClient') === 'true';

    let whereClause: any = {};
    if (clientIdParam) {
      const cId = parseInt(clientIdParam);
      if (onlyClient) {
        whereClause = { clientId: cId };
      } else {
        whereClause = {
          OR: [
            { clientId: cId },
            { clientId: null }
          ]
        };
      }
    }

    const jobPositions = await prisma.jobPosition.findMany({
      where: whereClause,
      include: {
        psychographPreset: true,
        grayAreas: true,
        client: {
          select: { id: true, name: true, username: true }
        },
        tests: {
          where: {
            participants: { some: {} }
          },
          select: {
            id: true,
            title: true,
            startDate: true,
            client: { select: { id: true, name: true } },
            _count: { select: { participants: true } }
          }
        },
        _count: {
          select: {
            tests: true,
            testParticipants: true
          }
        }
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
    const { name, description, psychographPresetId, grayAreas, clientId } = body;

    if (!name || !psychographPresetId) {
      return NextResponse.json({ error: 'Name and psychographPresetId are required' }, { status: 400 });
    }

    const newJobPosition = await prisma.jobPosition.create({
      data: {
        name,
        description,
        psychographPresetId: parseInt(psychographPresetId),
        clientId: clientId ? parseInt(clientId) : null,
        grayAreas: {
          create: (grayAreas || []).map((ga: any) => ({
            parameter: ga.parameter,
            targetScore: ga.targetScore
          }))
        }
      },
      include: {
        psychographPreset: true,
        grayAreas: true,
        client: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(newJobPosition);
  } catch (error) {
    console.error('Error creating job position:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
