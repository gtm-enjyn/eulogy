import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { daughterSpeaksIn, RunSchema, type Profile, type Run, type RunSummary } from '@eulogy/shared';
import { simulateRun } from './simulate';

export function generateRuns(profile: Profile, n: number): Run[] {
  const runs: Run[] = [];
  for (let seed = 1; seed <= n; seed++) {
    runs.push(RunSchema.parse(simulateRun(profile, seed)));
  }
  return runs;
}

export function summarize(runs: Run[]): RunSummary {
  const clusters: Record<string, number> = {};
  let speaks = 0;
  for (const r of runs) {
    if (daughterSpeaksIn(r)) speaks++;
    const key = r.ending_cluster ?? 'unknown';
    clusters[key] = (clusters[key] ?? 0) + 1;
  }
  return {
    n_runs: runs.length,
    pct_daughter_speaks: runs.length ? Math.round((speaks / runs.length) * 1000) / 10 : 0,
    clusters,
  };
}

export function writeOutputs(outDir: string, profileId: string, runs: Run[]): {
  jsonlPath: string;
  summaryPath: string;
  summary: RunSummary;
} {
  mkdirSync(outDir, { recursive: true });
  const jsonlPath = join(outDir, `${profileId}.jsonl`);
  const summaryPath = join(outDir, `${profileId}.summary.json`);
  writeFileSync(jsonlPath, runs.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(runs);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');
  return { jsonlPath, summaryPath, summary };
}
