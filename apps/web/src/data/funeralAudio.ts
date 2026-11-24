import type { FuneralCue, Profile } from '@eulogy/shared';
import { funeralPerformer } from './funeralCast';
import manifest from './audio.json';

export interface FuneralRecording {
  cast: string;
  voice: string;
  text: string;
  src: string;
  durationMs: number;
}

const recordings: readonly FuneralRecording[] =
  'clips' in manifest && Array.isArray(manifest.clips) ? manifest.clips : [];

export function findFuneralRecording(
  profile: Pick<Profile, 'relatives'>,
  cue: Pick<FuneralCue, 'speaks' | 'kind' | 'relativeId' | 'text'>,
): FuneralRecording | undefined {
  const cast = funeralPerformer(profile, cue);
  if (!cast) return undefined;
  return recordings.find((clip) => clip.cast === cast && clip.text === cue.text);
}
