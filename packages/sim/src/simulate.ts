import { mutateRun, sampleRun, type Profile, type Run } from '@eulogy/shared';

/**
 * Simulate one full life for `profile` using `seed`.
 *
 * // TODO(louis): replace with Claude-driven simulation, see docs/02-simulation-spec.md
 * For now this deterministically mutates the hand-written sampleRun so the
 * rest of the pipeline (jsonl, summary, web) has realistic data to chew on.
 */
export function simulateRun(profile: Profile, seed: number): Run {
  const base: Run = { ...sampleRun, profile_id: profile.id };
  return mutateRun(base, seed);
}
