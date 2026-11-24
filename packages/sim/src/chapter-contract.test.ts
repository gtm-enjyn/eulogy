import { describe, expect, it, vi } from 'vitest';
import { sampleProfile, sampleRun, type Profile } from '@eulogy/shared';
import { clusterEnding, simulateRun } from './simulate';
import { summarize } from './generate';
import { validateChapter } from './chapter';

const partner = sampleProfile.relatives[0]!;
const profile: Profile = { ...sampleProfile, relatives: [partner] };
function reply(chapter: number, score = 55) {
  return {
    scene: 'The train arrives after supper.',
    decisions: [
      { actor: profile.id, action: 'Ask for help', reason: 'I want to make the last train.' },
    ],
    relative_states: [
      {
        relative_id: partner.id,
        emotion: { valence: 0.4, arousal: 0.6 },
        relationship_score: score,
        memory_update: 'I kept the train ticket.',
      },
    ],
    private_messages: [{ from: partner.id, to: 'destiny', text: 'Will there be another train?' }],
    wealth: 0,
    health: 0.75,
    ...(chapter === 6
      ? {
          cause_of_death: 'old age',
          farewells: [
            { relative_id: partner.id, text: 'I kept the train ticket.', sentiment: 0.64 },
          ],
        }
      : {}),
  };
}

describe('chapter and provenance contract', () => {
  it.each([
    [55, true],
    [54.99, false],
  ] as const)('applies the inclusive speech threshold at %s', async (score, speaks) => {
    const read = vi.fn(async (raw: object) => reply((raw as { chapter: number }).chapter, score));
    const run = await simulateRun(profile, 1, { read });
    expect(run.eulogies).toMatchObject([
      { relative_id: partner.id, speaks, text: 'I kept the train ticket.' },
    ]);
    expect(read).toHaveBeenCalledTimes(6);
    const summary = summarize([run], profile);
    expect(summary.pct_child_speaks).toBeNull();
    expect(summary.pct_partner_speaks).toBe(speaks ? 100 : 0);
    expect(summary.generation).toEqual({ claude: 6 });
    expect(
      new Set([
        run.years[0]!.decisions[0]!.actor,
        run.years[0]!.private_messages[0]!.from,
        run.years[0]!.private_messages[0]!.to,
      ]).size,
    ).toBe(3);
  });

  it('retries the same chapter, reuses memories, and counts fallback independently', async () => {
    const seen: { chapter: number; correction?: string; memories: string[] }[] = [];
    const read = vi.fn(async (raw: object, correction?: string) => {
      const input = raw as { chapter: number; relative_history: { memories: string[] }[] };
      seen.push({
        chapter: input.chapter,
        correction,
        memories: [...input.relative_history[0]!.memories],
      });
      const valid = reply(input.chapter);
      if (input.chapter === 2 && !correction) return { ...valid, relative_states: [] };
      if (input.chapter === 4) return { scene: 'Missing all other fields' };
      return valid;
    });
    const veto = vi.fn(async () => {});
    const run = await simulateRun(profile, 2, { read, onVeto: veto });
    expect(seen.map((s) => s.chapter)).toEqual([1, 2, 2, 3, 4, 4, 5, 6]);
    expect(seen[2]!.correction).toContain('each relative exactly once');
    expect(seen[1]!.memories).toEqual(['I kept the train ticket.']);
    expect(seen[2]!.memories).toEqual(seen[1]!.memories);
    expect(run.years.map((y) => y.generation)).toEqual([
      'claude',
      'claude',
      'claude',
      'fallback',
      'claude',
      'claude',
    ]);
    expect(veto).toHaveBeenCalledTimes(3);
    expect(summarize([run], profile).generation).toEqual({ claude: 5, fallback: 1 });
    const offline = await simulateRun(profile, 2, { mock: true, read });
    expect(read).toHaveBeenCalledTimes(8);
    expect(summarize([offline], profile).generation).toEqual({ mock: 6 });
  });
  it('rejects invalid cast identities before generation', async () => {
    const read = vi.fn();
    for (const conflicting of [
      [partner, partner],
      [{ ...partner, id: 'destiny' }],
      [{ ...partner, id: profile.id }],
    ]) {
      await expect(
        simulateRun({ ...profile, relatives: conflicting }, 1, { read }),
      ).rejects.toThrow('distinct cast IDs');
    }
    await expect(simulateRun({ ...profile, age: 105 }, 1, { read })).rejects.toThrow(
      'starting age',
    );
    expect(read).not.toHaveBeenCalled();
  });
  it('rejects a premature funeral, a score jump and unknown message recipients', () => {
    const valid = reply(1),
      scores = { [partner.id]: 55 };
    expect(() => validateChapter(reply(6), profile, 0, scores)).toThrow('chapter six');
    expect(() => validateChapter(reply(1, 0), profile, 0, scores)).toThrow('Destiny veto');
    expect(() =>
      validateChapter(
        { ...valid, private_messages: [{ from: partner.id, to: 'stranger', text: 'A letter.' }] },
        profile,
        0,
        scores,
      ),
    ).toThrow('another cast member');
    expect(() => validateChapter(valid, profile, 5, scores)).toThrow('farewell for each relative');
    expect(clusterEnding(sampleRun.eulogies, sampleProfile)).toBe(sampleRun.ending_cluster);
  });
});
