import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import bcrypt from 'bcryptjs';

// PUT: Update participant name, password, or account status
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 403 });
    }

    const body = await req.json();
    const { participantId, userId, name, password, status } = body;

    if (!participantId || !userId) {
      return NextResponse.json({ error: 'ID peserta atau ID user tidak valid' }, { status: 400 });
    }

    const updateUserData: any = {};
    if (name) updateUserData.name = name.trim();
    if (status) updateUserData.status = status; // 'active' | 'inactive'
    if (password && password.trim()) {
      updateUserData.password = await bcrypt.hash(password.trim(), 10);
    }

    // Update user
    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: updateUserData,
      });
    }

    // Update participant plainPassword if password changed
    if (password && password.trim()) {
      await prisma.testParticipant.update({
        where: { id: Number(participantId) },
        data: { plainPassword: password.trim() },
      });
    }

    return NextResponse.json({ success: true, message: 'Data peserta berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating participant:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data peserta' }, { status: 500 });
  }
}

// DELETE: Delete participant and associated records
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const participantId = Number(searchParams.get('id'));

    if (!participantId || isNaN(participantId)) {
      return NextResponse.json({ error: 'ID peserta tidak valid' }, { status: 400 });
    }

    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId },
      select: { id: true, userId: true }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Peserta tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.answer.deleteMany({ where: { participantId } }),
      prisma.testResultRaw.deleteMany({ where: { participantId } }),
      prisma.testResultPsychograph.deleteMany({ where: { participantId } }),
      prisma.testResultNormalized.deleteMany({ where: { participantId } }),
      prisma.securityLog.deleteMany({ where: { participantId } }),
      prisma.testParticipant.delete({ where: { id: participantId } })
    ]);

    return NextResponse.json({ success: true, message: 'Peserta berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting participant:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus peserta' }, { status: 500 });
  }
}
