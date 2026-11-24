import { prisma } from './prisma';

export const STANDARD_TOOL_ORDER = [
  'WPT',
  'IST 2',
  'IST 3',
  'IST 6',
  'IST 7',
  'CFIT 1',
  'CFIT 2',
  'CFIT 3',
  'CFIT 4',
  'TIKI 1',
  'TIKI 2',
  'TIKI 3',
  'TIKI 4',
  'TIKI 6',
  'Kraepelin',
  'PAPI KOSTICK',
  'DISC',
  'MSDT',
  'Wartegg',
  'POWER',
];

export function normalizeToolName(tool: string): string {
  if (!tool) return '';
  const instLower = tool.toLowerCase().trim();
  if (tool === 'WPT' || instLower === 'wpt') return 'WPT';
  if (instLower.startsWith('tiki')) return tool;
  if (instLower.startsWith('ist subtes')) return tool.replace(/subtes\s+/i, '');
  if (instLower.startsWith('ist')) return tool;
  if (instLower.startsWith('papi')) return 'PAPI KOSTICK';
  if (instLower.startsWith('disc')) return 'DISC';
  if (instLower.startsWith('cfit')) return tool;
  if (instLower.startsWith('kraepelin') || instLower.startsWith('kreapelin')) return 'Kraepelin';
  if (instLower.startsWith('wartegg')) return 'Wartegg';
  if (instLower.startsWith('msdt')) return 'MSDT';
  if (instLower.startsWith('power')) return 'POWER';
  return tool;
}

export function sortSequence(tools: string[]): string[] {
  const toolSet = new Set(tools.map(normalizeToolName).filter(Boolean));
  const sorted: string[] = [];

  // First add standard tools in proper psychological test order
  for (const st of STANDARD_TOOL_ORDER) {
    if (toolSet.has(st)) {
      sorted.push(st);
      toolSet.delete(st);
    }
  }

  // Then add any remaining custom tools
  for (const remaining of toolSet) {
    sorted.push(remaining);
  }

  return sorted;
}

export async function resolveJobPositionSequence(jobPositionId: number): Promise<string[]> {
  const jobPosition = await prisma.jobPosition.findUnique({
    where: { id: Number(jobPositionId) },
    include: {
      psychographPreset: true,
      tests: {
        where: { sequence: { not: '' } },
        orderBy: { id: 'desc' },
      },
    },
  });

  if (!jobPosition) {
    return ['WPT', 'IST 2', 'IST 3', 'IST 6', 'IST 7', 'Kraepelin', 'PAPI KOSTICK', 'DISC'];
  }

  let baseSequence: string[] = [];

  // 1. Template test on psychographPreset with jobPositionId: null
  if (jobPosition.psychographPresetId) {
    const templateTest = await prisma.test.findFirst({
      where: {
        psychographPresetId: jobPosition.psychographPresetId,
        jobPositionId: null,
      },
      orderBy: { id: 'asc' },
    });
    if (templateTest?.sequence && templateTest.sequence.trim() !== '') {
      try {
        const parsed = JSON.parse(templateTest.sequence);
        if (Array.isArray(parsed) && parsed.length > 0) baseSequence = parsed;
      } catch (e) {}
    }
  }

  // 2. Any test on psychographPreset with valid sequence (length > 1)
  if (baseSequence.length === 0 && jobPosition.psychographPresetId) {
    const presetTests = await prisma.test.findMany({
      where: {
        psychographPresetId: jobPosition.psychographPresetId,
      },
      orderBy: { id: 'asc' },
    });
    for (const pt of presetTests) {
      if (pt.sequence && pt.sequence.trim() !== '') {
        try {
          const parsed = JSON.parse(pt.sequence);
          if (Array.isArray(parsed) && parsed.length > 1) {
            baseSequence = parsed;
            break;
          }
        } catch (e) {}
      }
    }
  }

  // 3. Tests directly on jobPosition
  if (baseSequence.length === 0 && jobPosition.tests.length > 0) {
    for (const jt of jobPosition.tests) {
      if (jt.sequence && jt.sequence.trim() !== '') {
        try {
          const parsed = JSON.parse(jt.sequence);
          if (Array.isArray(parsed) && parsed.length > 1) {
            baseSequence = parsed;
            break;
          }
        } catch (e) {}
      }
    }
  }

  // 4. Parse mapping JSON from psychographPreset
  if (baseSequence.length === 0 && jobPosition.psychographPreset?.mapping) {
    try {
      const mapping = JSON.parse(jobPosition.psychographPreset.mapping);
      const instrumentsSet = new Set<string>();
      mapping.forEach((cat: any) => {
        cat.aspects?.forEach((asp: any) => {
          if (asp.checked && Array.isArray(asp.instruments)) {
            asp.instruments.forEach((inst: string) => {
              if (!inst) return;
              const normalized = normalizeToolName(inst);
              if (normalized) instrumentsSet.add(normalized);
            });
          }
        });
      });
      if (instrumentsSet.size > 0) {
        baseSequence = Array.from(instrumentsSet);
      }
    } catch (e) {}
  }

  // 5. Default fallback
  if (baseSequence.length === 0) {
    baseSequence = ['WPT', 'IST 2', 'IST 3', 'IST 6', 'IST 7', 'Kraepelin', 'PAPI KOSTICK', 'DISC'];
  }

  return sortSequence(baseSequence);
}
