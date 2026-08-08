import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET: Fetch team personnel and available Test/Batch list
export async function GET(req: Request) {
  try {
    const [users, tests] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: {
            in: ['superadmin', 'psikolog', 'admin', 'admin_tester']
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.test.findMany({
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          jobPosition: {
            select: { name: true }
          }
        },
        orderBy: { id: 'desc' }
      })
    ]);

    return NextResponse.json({ users, tests });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Gagal mengambil data tim' }, { status: 500 });
  }
}

// POST: Add new team member with Batch assignment
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { name, username, email, phone, license, role, status, password, assignedTestIds } = body;

    if (!name || !password || !role) {
      return NextResponse.json({ error: 'Nama Lengkap, Password, dan Role wajib diisi' }, { status: 400 });
    }

    // Auto-generate username from name if not provided
    if (!username || username.trim() === '') {
      username = name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    }

    // Ensure username uniqueness
    let existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      username = `${username}_${Date.now().toString().slice(-4)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const formattedAssignedTests = Array.isArray(assignedTestIds)
      ? JSON.stringify(assignedTestIds)
      : typeof assignedTestIds === 'string'
      ? assignedTestIds
      : null;

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email: email || `${username}@psikotes.id`,
        phone: phone || null,
        license: license || null,
        password: hashedPassword,
        role: role || 'admin',
        status: status || 'active',
        assignedTestIds: formattedAssignedTests
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan anggota tim' }, { status: 500 });
  }
}

// PUT: Update team member and Batch assignment
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    let { id, name, username, email, phone, license, role, status, password, assignedTestIds } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID dan Nama Lengkap wajib diisi' }, { status: 400 });
    }

    if (!username || username.trim() === '') {
      username = name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    }

    const formattedAssignedTests = Array.isArray(assignedTestIds)
      ? JSON.stringify(assignedTestIds)
      : typeof assignedTestIds === 'string'
      ? assignedTestIds
      : null;

    const updateData: any = {
      name,
      username,
      license: license || null,
      role,
      status: status || 'active',
      assignedTestIds: formattedAssignedTests
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data tim' }, { status: 500 });
  }
}

// DELETE: Delete team member
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ message: 'Anggota tim berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Gagal menghapus anggota tim' }, { status: 500 });
  }
}
