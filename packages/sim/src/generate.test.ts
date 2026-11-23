import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { RunSchema, RunSummarySchema, sampleProfile } from '@eulogy/shared';
import { generateRuns, summarize, writeOutputs } from './generate';

const dir = mkdtempSync(join(tmpdir(), 'eulogy-sim-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('sim generate', () => {
  it('produces 5 schema-valid runs with distinct ids', () => {
    const runs = generateRuns(sampleProfile, 5);
    expect(runs).toHaveLength(5);
    for (const r of runs) expect(() => RunSchema.parse(r)).not.toThrow();
    expect(new Set(runs.map((r) => r.run_id)).size).toBe(5);
  });

  it('writes jsonl and summary', () => {
    const runs = generateRuns(sampleProfile, 5);
    const { jsonlPath, summaryPath, summary } = writeOutputs(dir, sampleProfile.id, runs);
    const lines = readFileSync(jsonlPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(5);
    for (const line of lines) expect(() => RunSchema.parse(JSON.parse(line))).not.toThrow();
    const onDisk = RunSummarySchema.parse(JSON.parse(readFileSync(summaryPath, 'utf8')));
    expect(onDisk).toEqual(summary);
    expect(summarize(runs).n_runs).toBe(5);
  });
});
