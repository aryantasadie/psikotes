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
  currentTestName?: string | null;
  timerRemaining?: number | null;
  completedTests?: string[];
  status?: string;
  isPaused?: boolean;
}

declare global {
  var __globalStreamStore: Map<number, StreamSession> | undefined;
  var __streamEvents: EventEmitter | undefined;
}

// In-memory global store attached to globalThis to prevent worker/module split in Next.js
const globalStreamStore = globalThis.__globalStreamStore || new Map<number, StreamSession>();
if (!globalThis.__globalStreamStore) {
  globalThis.__globalStreamStore = globalStreamStore;
}

export const streamEvents = globalThis.__streamEvents || new EventEmitter();
if (!globalThis.__streamEvents) {
  globalThis.__streamEvents = streamEvents;
  streamEvents.setMaxListeners(200);
}

// Batching Buffer Queue
let pendingBatchMap = new Map<number, StreamSession>();
let batchTimer: NodeJS.Timeout | null = null;

export function updateStreamSession(session: StreamSession) {
  const existing = globalStreamStore.get(session.participantId);
  const isOffline = session.status === 'offline';
  
  const updated: StreamSession = {
    participantId: session.participantId,
    name: session.name || existing?.name || `Participant ${session.participantId}`,
    username: session.username || existing?.username || `user_${session.participantId}`,
    testTitle: session.testTitle || existing?.testTitle || 'Psikotes Ujian',
    cameraFrameUrl: isOffline ? null : (session.cameraFrameUrl !== undefined ? session.cameraFrameUrl : (existing?.cameraFrameUrl || null)),
    screenFrameUrl: isOffline ? null : (session.screenFrameUrl !== undefined ? session.screenFrameUrl : (existing?.screenFrameUrl || null)),
    lastActive: isOffline ? 0 : Date.now(),
    violationCount: session.violationCount !== undefined ? session.violationCount : (existing?.violationCount || 0),
    latestViolationReason: session.latestViolationReason !== undefined ? session.latestViolationReason : existing?.latestViolationReason,
    currentTestName: session.currentTestName !== undefined ? session.currentTestName : existing?.currentTestName,
    timerRemaining: session.timerRemaining !== undefined ? session.timerRemaining : existing?.timerRemaining,
    completedTests: session.completedTests !== undefined ? session.completedTests : existing?.completedTests,
    status: session.status !== undefined ? session.status : (existing?.status || 'in_progress'),
    isPaused: session.isPaused !== undefined ? session.isPaused : (existing?.isPaused || false)
  };
  
  globalStreamStore.set(session.participantId, updated);
  pendingBatchMap.set(session.participantId, updated);

  // Instantly emit single update for real-time focus view
  streamEvents.emit('stream_update', updated);

  // Schedule batch flush every 300ms
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

export function getAllActiveStreams(maxAgeMs = 35000): StreamSession[] {
  const now = Date.now();
  const activeStreams: StreamSession[] = [];

  globalStreamStore.forEach((session, participantId) => {
    if (now - session.lastActive <= maxAgeMs) {
      activeStreams.push(session);
    } else {
      // Clean up dead stream after 3 minutes of inactivity
      if (now - session.lastActive > 180000) {
        globalStreamStore.delete(participantId);
      }
    }
  });

  return activeStreams;
}
