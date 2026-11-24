import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { RunSchema, RunSummarySchema, sampleProfile, type Eulogy } from '@eulogy/shared';
import { simulateProfile, summarize, writeOutputs } from './generate';
import { clusterEnding, simulateRun } from './simulate';

const dir = mkdtempSync(join(tmpdir(), 'eulogy-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
describe('simulation', () => {
  it('replays thirty six-chapter lives with precise funeral eligibility', async () => {
    const runs = await simulateProfile(sampleProfile, { runs: 30, mock: true });
    const saved = writeOutputs(dir, sampleProfile, runs);
    expect(RunSummarySchema.parse(JSON.parse(readFileSync(saved.summaryPath, 'utf8')))).toEqual(
      saved.summary,
    );
    expect(readFileSync(saved.jsonlPath, 'utf8').trim().split('\n').length).toBe(30);
    expect(new Set(runs.map((r) => r.run_id)).size).toBe(30);
    expect(Object.keys(saved.summary.clusters).length).toBeGreaterThan(1);
    for (const run of runs) {
      RunSchema.parse(run);
      expect(run.years.length).toBe(6);
      expect(run.years.at(-1)?.protagonist_age).toBe(run.death_age);
      for (const e of run.eulogies) {
        const last = run.years
          .at(-1)!
          .relative_states.find((s) => s.relative_id === e.relative_id)!;
        expect(e.speaks).toBe(last.relationship_score >= 55);
        expect(e.text.length).toBeGreaterThan(0);
      }
    }
    expect(await simulateRun(sampleProfile, 1, { mock: true })).toEqual(runs[0]);
  });
  it('retries each invalid output once and records the deterministic fallback', async () => {
    const read = vi.fn().mockResolvedValue({ scene: 123 });
    const run = await simulateRun(sampleProfile, 9, { read });
    expect(read).toHaveBeenCalledTimes(12);
    expect(read.mock.calls[1]?.[1]).toBeTruthy();
    expect(run.years.every((y) => y.generation === 'fallback')).toBe(true);
  });
  it('uses cast roles for clusters and handles a profile without a child', async () => {
    const speech = (id: string): Eulogy => ({
      run_id: 'r',
      relative_id: id,
      speaks: true,
      sentiment: 0.8,
      text: 'I remember.',
    });
    expect(clusterEnding([speech('jules')], sampleProfile)).toBe('estranged');
    expect(clusterEnding([speech('anne'), speech('jules')], sampleProfile)).toBe(
      'admired_not_loved',
    );
    expect(clusterEnding(['camille', 'lea', 'anne'].map(speech), sampleProfile)).toBe('reconciled');
    const profile = { ...sampleProfile, age: 70, relatives: [sampleProfile.relatives[0]!] };
    const result = await simulateRun(profile, 3, { mock: true });
    expect(summarize([result], profile).pct_child_speaks).toBeNull();
    expect(
      result.years.every((y, i, a) => i === 0 || a[i - 1]!.protagonist_age < y.protagonist_age),
    ).toBe(true);
  });
});
