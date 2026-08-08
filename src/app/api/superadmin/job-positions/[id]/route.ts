import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: parseInt(id) },
      include: {
        psychographPreset: true,
        grayAreas: true
      }
    });
    
    if (!jobPosition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(jobPosition);
  } catch (error) {
    console.error('Error fetching job position:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { name, description, psychographPresetId, grayAreas } = body;

    await prisma.psychographGrayArea.deleteMany({
      where: { jobPositionId: parseInt(id) }
    });

    const updated = await prisma.jobPosition.update({
      where: { id: parseInt(id) },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating job position:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await prisma.psychographGrayArea.deleteMany({
      where: { jobPositionId: parseInt(id) }
    });

    await prisma.jobPosition.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job position:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
