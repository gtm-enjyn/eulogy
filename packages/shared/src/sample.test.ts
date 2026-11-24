import { describe, expect, it } from 'vitest';
import { ProfileSchema, RunSchema } from './schemas';
import { sampleProfile, sampleRun } from './sample';

describe('sample data', () => {
  it('sampleProfile matches ProfileSchema', () => {
    expect(() => ProfileSchema.parse(sampleProfile)).not.toThrow();
  });

  it('sampleRun matches RunSchema', () => {
    const parsed = RunSchema.parse(sampleRun);
    expect(parsed.death_age).toBe(78);
    expect(parsed.years.map((y) => y.protagonist_age)).toEqual([33, 36, 41, 51, 66, 78]);
    expect(parsed.eulogies.find((e) => e.relative_id === 'lea')?.speaks).toBe(false);
  });

  it('keeps spoken and unspoken fixture text consistent with the final relationship scores', () => {
    const scores = new Map(
      sampleRun.years.at(-1)!.relative_states.map((s) => [s.relative_id, s.relationship_score]),
    );
    for (const e of sampleRun.eulogies) {
      expect(e.speaks).toBe(scores.get(e.relative_id)! >= 55);
      expect(e.text.trim()).not.toBe('');
    }
    expect(sampleRun.years.every((y) => y.generation === 'mock')).toBe(true);
  });
  it('rejects contradictory generated records at the JSON boundary and still reads untagged historical records', () => {
    const copied = structuredClone(sampleRun);
    copied.eulogies[0]!.speaks = false;
    expect(RunSchema.safeParse(copied).success).toBe(false);
    const missing = structuredClone(sampleRun);
    missing.years.pop();
    expect(RunSchema.safeParse(missing).success).toBe(false);
    copied.years.forEach((y) => delete y.generation);
    expect(RunSchema.safeParse(copied).success).toBe(true);
  });
});
