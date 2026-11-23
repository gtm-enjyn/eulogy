import { daughterSpeaksIn, mutateRun, sampleRun, type Run } from '@eulogy/shared';

/** 20 deterministic variants of sampleRun, derived at build time. */
export const runs: Run[] = Array.from({ length: 20 }, (_, i) => mutateRun(sampleRun, i + 1));

export function pctDaughterSilent(list: Run[]): number {
  if (list.length === 0) return 0;
  const silent = list.filter((r) => !daughterSpeaksIn(r)).length;
  return Math.round((silent / list.length) * 100);
}
