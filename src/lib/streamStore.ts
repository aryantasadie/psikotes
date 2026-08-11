import { EventEmitter } from 'events';

export interface StreamSession {
  participantId: number;
  name: string;
  username: string;
  testTitle?: string;
  cameraFrameUrl: string | null;
  screenFrameUrl: string | null;
  lastActive: number;
  violationCount: number;
  latestViolationReason?: string;
}

// In-memory global store & event emitter for ultra-fast SSE live streaming
const globalStreamStore = new Map<number, StreamSession>();
export const streamEvents = new EventEmitter();

// Increase max listeners for up to 100 concurrent admin SSE connections
streamEvents.setMaxListeners(100);

// Batching Buffer Queue for high-concurrency scaling (50+ participants)
let pendingBatchMap = new Map<number, StreamSession>();
let batchTimer: NodeJS.Timeout | null = null;

export function updateStreamSession(session: StreamSession) {
  const existing = globalStreamStore.get(session.participantId);
  
  const updated: StreamSession = {
    ...session,
    cameraFrameUrl: session.cameraFrameUrl || existing?.cameraFrameUrl || null,
    screenFrameUrl: session.screenFrameUrl || existing?.screenFrameUrl || null,
    lastActive: Date.now()
  };
  
  globalStreamStore.set(session.participantId, updated);
  pendingBatchMap.set(session.participantId, updated);

  // Instantly emit single update for real-time focus view
  streamEvents.emit('stream_update', updated);

  // Schedule batch flush every 300ms to optimize network overhead for 50+ candidates
  if (!batchTimer) {
    batchTimer = setTimeout(flushBatchUpdates, 300);
  }
}

function flushBatchUpdates() {
  batchTimer = null;
  if (pendingBatchMap.size > 0) {
    const batchList = Array.from(pendingBatchMap.values());
    pendingBatchMap = new Map();
    streamEvents.emit('batch_update', batchList);
  }
}

export function getAllActiveStreams(maxAgeMs = 25000): StreamSession[] {
  const now = Date.now();
  const activeStreams: StreamSession[] = [];

  globalStreamStore.forEach((session, participantId) => {
    if (now - session.lastActive <= maxAgeMs) {
      activeStreams.push(session);
    } else {
      // Clean up dead stream after 2 minutes of inactivity
      if (now - session.lastActive > 120000) {
        globalStreamStore.delete(participantId);
      }
    }
  });

  return activeStreams;
}
