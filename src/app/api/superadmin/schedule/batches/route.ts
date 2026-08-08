import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


// GET: Fetch all created Test Batches with participants & accounts
export async function GET() {
  try {
    const batches = await prisma.test.findMany({
      include: {
        jobPosition: {
          select: { id: true, name: true }
        },
        client: {
          select: { id: true, name: true, username: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { id: 'desc' }
    });

    // Also get tester assignments for each batch
    const testers = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'admin_tester', 'psikolog'] },
        assignedTestIds: { not: null }
      },
      select: { id: true, name: true, role: true, assignedTestIds: true }
    });

    const testerMap: Record<number, { id: number; name: string }[]> = {};
    testers.forEach((t) => {
      if (t.assignedTestIds) {
        try {
          const ids: number[] = JSON.parse(t.assignedTestIds);
          ids.forEach((testId) => {
            if (!testerMap[testId]) testerMap[testId] = [];
            testerMap[testId].push({ id: t.id, name: t.name });
          });
        } catch (e) {}
      }
    });

    const formattedBatches = batches.map((b) => {
      const totalCount = b.participants.length;
      const completedCount = b.participants.filter((p) => p.status === 'completed').length;
      const assignedTesterObjs = testerMap[b.id] || [];
      const assignedTesters = assignedTesterObjs.map(t => t.name);

      return {
        id: b.id,
        title: b.title,
        startDate: b.startDate,
        jobPositionId: b.jobPositionId,
        jobPositionName: b.jobPosition?.name || '-',
        clientId: b.clientId,
        clientName: b.client?.name || 'Umum / Internal',
        assignedTesters,
        assignedTesterId: assignedTesterObjs.length > 0 ? assignedTesterObjs[0].id : null,
        totalParticipants: totalCount,
        completedParticipants: completedCount,
        participants: b.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          name: p.user.name,
          status: p.status,
          password: p.plainPassword || '123456'
        }))
      };
    });

    return NextResponse.json(formattedBatches);
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Gagal mengambil data daftar batch' }, { status: 500 });
  }
}

// PUT: Edit batch session details (title, startDate, clientId, testerId)
export async function PUT(req: Request) {
  try {
    const { id, title, startDate, clientId, testerId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID batch wajib diisi' }, { status: 400 });
    }

    const testId = Number(id);

    // Update Test metadata
    await prisma.test.update({
      where: { id: testId },
      data: {
        title: title || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        clientId: clientId ? Number(clientId) : null
      }
    });

    // Update Tester assignment if provided
    if (testerId !== undefined) {
      const allUsers = await prisma.user.findMany({
        where: { assignedTestIds: { not: null } }
      });

      for (const u of allUsers) {
        if (u.assignedTestIds) {
          try {
            const ids: number[] = JSON.parse(u.assignedTestIds);
            if (ids.includes(testId) && u.id !== Number(testerId)) {
              const newIds = ids.filter(i => i !== testId);
              await prisma.user.update({
                where: { id: u.id },
                data: { assignedTestIds: JSON.stringify(newIds) }
              });
            }
          } catch (e) {}
        }
      }

      if (testerId) {
        const tester = await prisma.user.findUnique({ where: { id: Number(testerId) } });
        if (tester) {
          let currentAssigned: number[] = [];
          if (tester.assignedTestIds) {
            try { currentAssigned = JSON.parse(tester.assignedTestIds); } catch (e) {}
          }
          if (!currentAssigned.includes(testId)) {
            currentAssigned.push(testId);
            await prisma.user.update({
              where: { id: tester.id },
              data: { assignedTestIds: JSON.stringify(currentAssigned) }
            });
          }
        }
      }
    }

    return NextResponse.json({ message: 'Batch berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengedit batch' }, { status: 500 });
  }
}

// DELETE: Delete a batch session & all related participant data cleanly (Cascade)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID batch wajib diisi' }, { status: 400 });
    }

    const testId = Number(id);

    // 1. Find all questions for this test
    const questions = await prisma.question.findMany({
      where: { testId },
      select: { id: true }
    });
    const questionIds = questions.map((q) => q.id);

    // 2. Find all participants for this test
    const participants = await prisma.testParticipant.findMany({
      where: { testId },
      select: { id: true, userId: true }
    });
    const participantIds = participants.map((p) => p.id);
    const userIds = participants.map((p) => p.userId);

    // 3. Delete Answers (by participant OR question)
    const answerConditions = [];
    if (participantIds.length > 0) answerConditions.push({ participantId: { in: participantIds } });
    if (questionIds.length > 0) answerConditions.push({ questionId: { in: questionIds } });

    if (answerConditions.length > 0) {
      await prisma.answer.deleteMany({
        where: { OR: answerConditions }
      });
    }

    // 4. Delete participant child records (logs, raw, normalized, psychograph)
    if (participantIds.length > 0) {
      await prisma.securityLog.deleteMany({ where: { participantId: { in: participantIds } } });
      await prisma.testResultRaw.deleteMany({ where: { participantId: { in: participantIds } } });
      await prisma.testResultNormalized.deleteMany({ where: { participantId: { in: participantIds } } });
      await prisma.testResultPsychograph.deleteMany({ where: { participantId: { in: participantIds } } });
    }

    // 5. Delete Questions for this test
    if (questionIds.length > 0) {
      await prisma.question.deleteMany({ where: { testId } });
    }

    // 6. Delete TestParticipants for this test
    await prisma.testParticipant.deleteMany({ where: { testId } });

    // 7. Delete associated Users if they have no other active test participants
    if (userIds.length > 0) {
      const otherParticipants = await prisma.testParticipant.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true }
      });
      const otherUserIds = new Set(otherParticipants.map((op) => op.userId));
      const safeToDeleteUserIds = userIds.filter((uid) => !otherUserIds.has(uid));

      if (safeToDeleteUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: safeToDeleteUserIds } } });
      }
    }

    // 8. Clean up assignedTestIds from Testers/Admins
    const testers = await prisma.user.findMany({
      where: { assignedTestIds: { not: null } },
      select: { id: true, assignedTestIds: true }
    });
    for (const t of testers) {
      if (t.assignedTestIds) {
        try {
          const ids: number[] = JSON.parse(t.assignedTestIds);
          if (ids.includes(testId)) {
            const newIds = ids.filter((i) => i !== testId);
            await prisma.user.update({
              where: { id: t.id },
              data: { assignedTestIds: JSON.stringify(newIds) }
            });
          }
        } catch (e) {}
      }
    }

    // 9. Finally delete the Test
    await prisma.test.delete({ where: { id: testId } });

    return NextResponse.json({ message: 'Batch dan seluruh akun peserta berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus batch' }, { status: 500 });
  }
}
