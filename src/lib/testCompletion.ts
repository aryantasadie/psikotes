import { prisma } from '@/lib/prisma';

/**
 * Standard utility for checking test and report completion.
 * A participant is considered to have completed the CBT test if:
 * 1. Their status is explicitly 'completed', OR
 * 2. Every test tool in their batch sequence has a corresponding entry in
 *    either TestResultRaw or Answer.
 */

export const normalizeSlug = (s: string) => (s || '').toUpperCase().replace(/[\s\-_]+/g, '');

export function parseSequence(sequence: string | null | undefined): string[] {
  if (!sequence) return [];
  try {
    const parsed = JSON.parse(sequence);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function isSequenceFinished(sequence: string[], finishedTypes: Iterable<string>): boolean {
  if (!sequence || sequence.length === 0) return false;
  const done = new Set<string>();
  for (const t of finishedTypes) done.add(normalizeSlug(t));

  return sequence.every((tool) => {
    const s = normalizeSlug(tool);
    return (
      done.has(s) ||
      (s.includes('KRAEPELIN') && (done.has('KRAEPELIN') || done.has('KREAPELIN'))) ||
      (s.includes('DISC') && done.has('DISC')) ||
      (s.includes('WPT') && done.has('WPT')) ||
      (s.includes('MSDT') && done.has('MSDT')) ||
      (s.includes('POWER') && (done.has('POWER') || done.has('POWERLEADER'))) ||
      (s.includes('PAPI') && (done.has('PAPI') || done.has('PAPIKOSTICK')))
    );
  });
}

export function isParticipantCompleted(
  participant: {
    status?: string | null;
    rawResults?: { testType: string }[];
    answers?: { question?: { testType?: string } }[];
  },
  sequence: string[]
): boolean {
  if (participant.status === 'completed') return true;
  if (!sequence || sequence.length === 0) return false;

  const doneTypes: string[] = [];
  if (participant.rawResults) {
    participant.rawResults.forEach((r) => doneTypes.push(r.testType));
  }
  if (participant.answers) {
    participant.answers.forEach((a) => {
      if (a.question?.testType) doneTypes.push(a.question.testType);
    });
  }

  return isSequenceFinished(sequence, doneTypes);
}

export function isReportDone(status: string | null | undefined): boolean {
  return status === 'RELEASED' || status === 'REVIEWED';
}
