import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ProfileSchema, sampleProfile } from '@eulogy/shared';
import { simulateProfile, writeOutputs } from './generate';
import { defaultPriors, PriorsSchema } from './shocks';
import { researchPriors } from './priors';

const root = process.env.INIT_CWD ?? process.cwd();
async function main() {
  if (existsSync(resolve(root, '.env'))) process.loadEnvFile(resolve(root, '.env'));
  const { values } = parseArgs({
    options: {
      profile: { type: 'string' },
      runs: { type: 'string', default: '30' },
      out: { type: 'string', default: 'data/runs' },
      mock: { type: 'boolean' },
    },
  });
  const profile = values.profile
    ? ProfileSchema.parse(JSON.parse(readFileSync(resolve(root, values.profile), 'utf8')))
    : sampleProfile;
  const priorPath = resolve(root, 'data/priors', profile.id + '.json');
  const priors =
    !values.mock && process.env.TELEM_API_KEY
      ? await researchPriors(profile.id, process.env.TELEM_API_KEY)
      : existsSync(priorPath)
        ? PriorsSchema.parse(JSON.parse(readFileSync(priorPath, 'utf8')))
        : defaultPriors;
  const mock = values.mock || !process.env.ANTHROPIC_API_KEY;
  if (mock) console.log('DEGRADED · deterministic offline simulation');
  const runs = await simulateProfile(profile, { runs: Number(values.runs), mock, priors });
  const { jsonlPath, summary } = writeOutputs(resolve(root, values.out!), profile, runs);
  console.log(jsonlPath, JSON.stringify(summary, null, 2));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
