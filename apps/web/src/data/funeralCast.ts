import type { FuneralCue, Profile, Relative } from '@eulogy/shared';

// These are stock performers. A second character with the same relationship
// gets a different performer, assigned in the order of the profile's cast.
const performers = {
  partner: ['af_heart', 'am_michael', 'bf_alice', 'am_puck'],
  child: ['af_bella', 'am_puck', 'af_sarah', 'bm_fable'],
  parent: ['bf_emma', 'am_fenrir', 'af_nicole', 'bm_fable'],
  sibling: ['af_kore', 'am_fenrir', 'am_puck', 'af_alloy'],
  friend: ['am_puck', 'af_sarah', 'bm_fable', 'af_alloy'],
  cofounder: ['am_michael', 'af_kore', 'bm_fable', 'af_alloy'],
  other: ['af_kore', 'bm_fable', 'af_alloy', 'am_puck'],
} as const satisfies Record<Relative['relation'], readonly string[]>;

export function funeralPerformer(
  profile: Pick<Profile, 'relatives'>,
  cue: Pick<FuneralCue, 'speaks' | 'kind' | 'relativeId'>,
): string | undefined {
  if (!cue.speaks) return undefined;
  if (cue.kind === 'opening') return 'bm_george';
  const relative = profile.relatives.find((person) => person.id === cue.relativeId);
  if (!relative) return undefined;
  const sameRelation = profile.relatives.filter((person) => person.relation === relative.relation);
  return performers[relative.relation][sameRelation.indexOf(relative)];
}
