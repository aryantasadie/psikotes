import { getAllActiveStreams, streamEvents, StreamSession } from '@/lib/streamStore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || !['superadmin', 'tester', 'psikolog'].includes(userRole)) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Akses stream khusus pengawas' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const encoder = new TextEncoder();
  let pingInterval: NodeJS.Timeout;
  let onBatchUpdate: (batch: StreamSession[]) => void;
  let onSingleUpdate: (single: StreamSession) => void;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial active streams batch immediately on connection
      const initialStreams = getAllActiveStreams(25000);
      const initialData = `data: ${JSON.stringify({ type: 'INIT', streams: initialStreams })}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      // 2. Event listeners
      onBatchUpdate = (batchList: StreamSession[]) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'BATCH_UPDATE', streams: batchList })}\n\n`));
        } catch {}
      };
      onSingleUpdate = (updatedSession: StreamSession) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'UPDATE', stream: updatedSession })}\n\n`));
        } catch {}
      };

      streamEvents.on('batch_update', onBatchUpdate);
      streamEvents.on('stream_update', onSingleUpdate);

      pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 10000);
    },
    cancel() {
      // Automatic cleanup when client disconnects
      if (pingInterval) clearInterval(pingInterval);
      if (onBatchUpdate) streamEvents.off('batch_update', onBatchUpdate);
      if (onSingleUpdate) streamEvents.off('stream_update', onSingleUpdate);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
