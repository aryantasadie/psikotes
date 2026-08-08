import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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
          create: grayAreas.map((ga: any) => ({
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
