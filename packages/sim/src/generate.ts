import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { ProfileSchema, RunSummarySchema, type Profile, type Run } from '@eulogy/shared';
import { z } from 'zod';
import { simulateRun, type SimulationOptions } from './simulate';

export async function simulateProfile(
  profile: Profile,
  options: SimulationOptions & { runs: number; onRun?: (run: Run) => void | Promise<void> },
) {
  ProfileSchema.parse(profile);
  const count = z.number().int().min(1).max(50).parse(options.runs);
  const runs: Run[] = new Array(count);
  let next = 0;
  async function worker() {
    while (next < count) {
      const index = next++;
      const run = await simulateRun(profile, index + 1, options);
      runs[index] = run;
      await options.onRun?.(run);
    }
  }
  await Promise.all(Array.from({ length: Math.min(count, 10) }, worker));
  return runs;
}
export function summarize(runs: Run[], profile: Profile) {
  const clusters: Record<string, number> = {},
    generation: Record<string, number> = {};
  for (const run of runs) {
    const key = run.ending_cluster ?? 'unknown';
    clusters[key] = (clusters[key] ?? 0) + 1;
    for (const year of run.years) {
      const source = year.generation ?? 'unknown';
      generation[source] = (generation[source] ?? 0) + 1;
    }
  }
  const percentage = (role: 'child' | 'partner') => {
    const ids = profile.relatives.filter((r) => r.relation === role).map((r) => r.id);
    if (!ids.length || !runs.length) return null;
    return (
      Math.round(
        (1000 *
          runs.filter((run) => run.eulogies.some((e) => e.speaks && ids.includes(e.relative_id)))
            .length) /
          runs.length,
      ) / 10
    );
  };
  const leading = Object.keys(clusters).sort(
    (a, b) => clusters[b]! - clusters[a]! || a.localeCompare(b),
  )[0];
  const score = (r: Run) => {
    const states = r.years.at(-1)?.relative_states ?? [];
    return states.reduce((s, v) => s + v.relationship_score, 0) / Math.max(1, states.length);
  };
  const best = [...runs].sort(
    (a, b) =>
      Number(b.ending_cluster === 'reconciled') - Number(a.ending_cluster === 'reconciled') ||
      score(b) - score(a),
  )[0];
  return RunSummarySchema.parse({
    n_runs: runs.length,
    clusters,
    generation,
    pct_daughter_speaks: percentage('child') ?? 0,
    pct_child_speaks: percentage('child'),
    pct_partner_speaks: percentage('partner'),
    best_run_id: best?.run_id,
    most_probable_run_id: runs.find((r) => r.ending_cluster === leading)?.run_id,
  });
}
export function writeOutputs(dir: string, profile: Profile, runs: Run[]) {
  mkdirSync(dir, { recursive: true });
  const id = z
    .string()
    .regex(/^[\w-]+$/)
    .parse(profile.id);
  const jsonlPath = join(dir, id + '.jsonl'),
    summaryPath = join(dir, id + '.summary.json');
  const summary = summarize(runs, profile);
  for (const [path, body] of [
    [jsonlPath, runs.map((r) => JSON.stringify(r)).join('\n') + '\n'],
    [summaryPath, JSON.stringify(summary, null, 2) + '\n'],
  ] as const) {
    const temporary = path + '.' + randomUUID() + '.tmp';
    writeFileSync(temporary, body);
    renameSync(temporary, path);
  }
  return { jsonlPath, summaryPath, summary };
}
