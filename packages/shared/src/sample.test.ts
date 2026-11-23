import { describe, expect, it } from 'vitest';
import { ProfileSchema, RunSchema } from './schemas';
import { sampleProfile, sampleRun } from './sample';
import { mutateRun } from './mutate';

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

  it('mutateRun is deterministic and schema-valid', () => {
    const a = mutateRun(sampleRun, 42);
    const b = mutateRun(sampleRun, 42);
    expect(a).toEqual(b);
    expect(() => RunSchema.parse(a)).not.toThrow();
  });
});
