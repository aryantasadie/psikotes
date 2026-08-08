import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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
