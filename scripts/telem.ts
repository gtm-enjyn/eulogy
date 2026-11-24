import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ProfileSchema } from '@eulogy/shared';
import { priorRequests, researchPriors, telemEndpoint } from '../packages/sim/src/priors';
if (existsSync('.env')) process.loadEnvFile('.env');
const profile = ProfileSchema.parse(JSON.parse(readFileSync('data/profiles/louis.json', 'utf8')));
const key = process.argv.includes('--dry-run') ? undefined : process.env.TELEM_API_KEY;
mkdirSync('data/telem', { recursive: true });
writeFileSync(
  'data/telem/requests.json',
  JSON.stringify(
    {
      mode: key ? 'live' : 'dry-run',
      method: 'POST',
      endpoint: telemEndpoint,
      bodies: priorRequests(profile.id),
    },
    null,
    2,
  ) + '\n',
);
writeFileSync(
  'data/priors/' + profile.id + '.json',
  JSON.stringify(await researchPriors(profile.id, key), null, 2) + '\n',
);
