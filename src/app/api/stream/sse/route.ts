import { getAllActiveStreams, streamEvents, StreamSession } from '@/lib/streamStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial active streams batch immediately on connection
      const initialStreams = getAllActiveStreams(25000);
      const initialData = `data: ${JSON.stringify({ type: 'INIT', streams: initialStreams })}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      // 2. Listener for high-concurrency batched frame updates
      const onBatchUpdate = (batchList: StreamSession[]) => {
        try {
          const payload = `data: ${JSON.stringify({ type: 'BATCH_UPDATE', streams: batchList })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed by client
        }
      };

      // 3. Listener for single stream update (for focus view)
      const onSingleUpdate = (updatedSession: StreamSession) => {
        try {
          const payload = `data: ${JSON.stringify({ type: 'UPDATE', stream: updatedSession })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed by client
        }
      };

      streamEvents.on('batch_update', onBatchUpdate);
      streamEvents.on('stream_update', onSingleUpdate);

      // 4. Heartbeat ping every 10 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 10000);

      // 5. Cleanup when client disconnects
      return () => {
        clearInterval(pingInterval);
        streamEvents.off('batch_update', onBatchUpdate);
        streamEvents.off('stream_update', onSingleUpdate);
      };
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
