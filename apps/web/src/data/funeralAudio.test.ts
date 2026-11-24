import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildFuneralScript, ProfileSchema, RunSchema } from '@eulogy/shared';
import { findFuneralRecording } from './funeralAudio';
import manifest from './audio.json';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const jules = ProfileSchema.parse(JSON.parse(read('data/profiles/jules.json')));
const louis = ProfileSchema.parse(JSON.parse(read('data/profiles/louis.json')));
const julesRuns = RunSchema.array().parse(JSON.parse(read('data/screenings/jules.json')).runs);
const louisRuns = read('data/runs/louis-demo.jsonl')
  .trim()
  .split('\n')
  .map((s) => RunSchema.parse(JSON.parse(s)));

describe('chapel recordings', () => {
  it('plays every opening and speaking witness in both archives and leaves silent witnesses silent', () => {
    const referenced = new Set<string>();
    for (const [profile, runs] of [
      [jules, julesRuns],
      [louis, louisRuns],
    ] as const) {
      for (const run of runs) {
        for (const cue of buildFuneralScript(profile, run)) {
          const clip = findFuneralRecording(profile, cue);
          if (!cue.speaks) {
            expect(clip).toBeUndefined();
            continue;
          }
          expect(clip?.text).toBe(cue.text);
          expect(clip!.durationMs).toBeGreaterThan(200);
          referenced.add(clip!.src);
        }
      }
    }
    expect(referenced).toEqual(new Set(manifest.clips.map((clip) => clip.src)));
    for (const clip of manifest.clips) {
      const bytes = readFileSync(join(root, 'apps/web/public', clip.src));
      expect(bytes.length).toBeGreaterThan(500);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(clip.sha256);
    }
  });

  it('does not play an archived recording when a new run reuses its run and witness IDs', () => {
    const run = structuredClone(julesRuns[0]!);
    const first = run.eulogies.find((eulogy) => eulogy.speaks)!;
    const original = buildFuneralScript(jules, run).find(
      (cue) => cue.relativeId === first.relative_id,
    )!;
    expect(findFuneralRecording(jules, original)).toBeDefined();
    first.text = 'I packed the two red umbrellas we shared in November.';
    const revised = buildFuneralScript(jules, run).find(
      (cue) => cue.relativeId === first.relative_id,
    )!;
    expect(revised.id).toBe(original.id);
    expect(revised.text).not.toBe(original.text);
    expect(findFuneralRecording(jules, revised)).toBeUndefined();
  });

  it('gives the presider and each of Jules’s four witnesses a distinct library performer', () => {
    const cast = buildFuneralScript(jules, julesRuns[0]!)
      .filter((cue) => cue.speaks)
      .map((cue) => findFuneralRecording(jules, cue)!.voice);
    expect(new Set(cast).size).toBe(5);
  });
});
