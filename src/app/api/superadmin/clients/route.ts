import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';


// GET: Fetch all Client companies (role = 'client')
export async function GET() {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'client' },
      include: {
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also get tests count for each client
    const testsCount = await prisma.test.groupBy({
      by: ['clientId'],
      _count: { id: true }
    });

    const testsMap: Record<number, number> = {};
    testsCount.forEach((t) => {
      if (t.clientId) testsMap[t.clientId] = t._count.id;
    });

    const result = clients.map((c) => ({
      ...c,
      totalBatches: testsMap[c.id] || 0
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Gagal mengambil data klien' }, { status: 500 });
  }
}

// POST: Add new Client company
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { name, username, email, phone, password, status } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Nama Perusahaan, Username, dan Password wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh akun lain' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = await prisma.user.create({
      data: {
        name,
        username,
        email: email || `${username}@klien.id`,
        phone: phone || null,
        password: hashedPassword,
        role: 'client',
        status: status || 'active'
      }
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan data klien' }, { status: 500 });
  }
}

// PUT: Update Client company
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    let { id, name, username, email, phone, password, status } = body;

    if (!id || !name || !username) {
      return NextResponse.json({ error: 'ID, Nama Perusahaan, dan Username wajib diisi' }, { status: 400 });
    }

    const updateData: any = {
      name,
      username,
      email: email || `${username}@klien.id`,
      phone: phone || null,
      status: status || 'active'
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedClient = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    });

    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data klien' }, { status: 500 });
  }
}

// DELETE: Delete Client company
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

    return NextResponse.json({ message: 'Data klien berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Gagal menghapus data klien' }, { status: 500 });
  }
}
