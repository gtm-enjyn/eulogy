import type { Run } from './schemas';
import { clamp, makeRng } from './rng';

const DAUGHTER_ID = 'lea';
const CAUSES = [
  'heart attack',
  'stroke',
  'pancreatic cancer',
  'car accident',
  'pneumonia',
  'old age',
] as const;

/**
 * Deterministically derive a variant of `base` from `seed`.
 * Placeholder for the real simulation: varies death age, relationship scores,
 * and flips whether the daughter speaks on ~30% of seeds.
 */
export function mutateRun(base: Run, seed: number): Run {
  const rng = makeRng(seed);
  const deathAge = 66 + Math.floor(rng() * 29); // 66..94
  const daughterSpeaks = rng() < 0.3;
  const cause = CAUSES[Math.floor(rng() * CAUSES.length)] ?? 'old age';
  const runId = `${base.profile_id}-${String(seed).padStart(4, '0')}`;

  const years = base.years
    .filter((y) => y.protagonist_age <= deathAge)
    .map((y) => ({
      ...y,
      run_id: runId,
      relative_states: y.relative_states.map((rs) => ({
        ...rs,
        relationship_score: Math.round(
          clamp(rs.relationship_score + (rng() - 0.5) * 30, 0, 100),
        ),
        emotion: {
          valence: clamp(rs.emotion.valence + (rng() - 0.5) * 0.4, -1, 1),
          arousal: clamp(rs.emotion.arousal + (rng() - 0.5) * 0.3, 0, 1),
        },
      })),
    }));

  const eulogies = base.eulogies.map((e) => {
    const sentiment = clamp(e.sentiment + (rng() - 0.5) * 0.4, -1, 1);
    if (e.relative_id === DAUGHTER_ID) {
      return daughterSpeaks
        ? {
            ...e,
            run_id: runId,
            speaks: true,
            sentiment: clamp(sentiment + 0.6, -1, 1),
            text: 'He was not there when I needed him. He was there, at the end, when I did not.',
          }
        : { ...e, run_id: runId, speaks: false, text: '', sentiment };
    }
    return { ...e, run_id: runId, sentiment };
  });

  const partner = eulogies.find((e) => e.relative_id === 'camille');
  const endingCluster = daughterSpeaks
    ? 'reconciled'
    : partner && partner.sentiment < 0
      ? 'estranged'
      : 'admired-alone';

  return {
    ...base,
    run_id: runId,
    seed,
    death_age: deathAge,
    cause_of_death: cause,
    years,
    eulogies,
    ending_cluster: endingCluster,
  };
}

export function daughterSpeaksIn(run: Run): boolean {
  return run.eulogies.some((e) => e.relative_id === DAUGHTER_ID && e.speaks);
}
