import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ProfileSchema } from '@eulogy/shared';
import { z } from 'zod';
import { simulateProfile, writeOutputs } from '../packages/sim/src/generate';
import { modelCredential } from '../packages/sim/src/chapter';
import { researchPriors } from '../packages/sim/src/priors';

if (existsSync('.env')) process.loadEnvFile('.env');
const { values } = parseArgs({
  options: {
    profile: { type: 'string', default: 'data/profiles/louis.json' },
    runs: { type: 'string', default: '1000' },
    out: { type: 'string', default: '.local/ensemble' },
    live: { type: 'boolean' },
  },
});
const n = z.number().int().min(1).max(1000).parse(Number(values.runs));
const profile = ProfileSchema.parse(JSON.parse(readFileSync(values.profile!, 'utf8')));
if (values.live && !modelCredential())
  throw Error('Live mode requires an Anthropic or Vercel AI Gateway credential.');
const dir = resolve(values.out!);
mkdirSync(dir, { recursive: true });
const priors = await researchPriors(
  profile.id,
  values.live ? process.env.TELEM_API_KEY : undefined,
);
const runs = [];
for (let offset = 0; offset < n; offset += 50) {
  runs.push(
    ...(await simulateProfile(profile, {
      runs: Math.min(50, n - offset),
      seedOffset: offset,
      mock: !values.live,
      priors,
    })),
  );
}
const saved = writeOutputs(dir, profile, runs);
const report = {
  mode: values.live ? 'live-requested' : 'deterministic',
  profile_id: profile.id,
  unique_ids: new Set(runs.map((r) => r.run_id)).size,
  chapters: runs.reduce((sum, r) => sum + r.years.length, 0),
  sha256: createHash('sha256').update(readFileSync(saved.jsonlPath)).digest('hex'),
  ...saved.summary,
};
writeFileSync(join(dir, 'ensemble-proof.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
