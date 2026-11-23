import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ProfileSchema, sampleProfile, type Profile } from '@eulogy/shared';
import { generateRuns, writeOutputs } from './generate';

// npm runs workspace scripts from the package dir; INIT_CWD is where the user invoked npm.
const BASE_DIR = process.env.INIT_CWD ?? process.cwd();

function loadProfile(path: string | undefined): Profile {
  if (!path) return sampleProfile;
  const raw = readFileSync(resolve(BASE_DIR, path), 'utf8');
  return ProfileSchema.parse(JSON.parse(raw));
}

function main(): void {
  const { values } = parseArgs({
    options: {
      profile: { type: 'string' },
      runs: { type: 'string', default: '20' },
      out: { type: 'string', default: 'data/runs' },
    },
  });

  const n = Number.parseInt(values.runs ?? '20', 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`--runs must be a positive integer, got "${values.runs}"`);
    process.exit(1);
  }

  const profile = loadProfile(values.profile);
  const runs = generateRuns(profile, n);
  const { jsonlPath, summaryPath, summary } = writeOutputs(
    resolve(BASE_DIR, values.out ?? 'data/runs'),
    profile.id,
    runs,
  );

  console.log(`wrote ${runs.length} runs -> ${jsonlPath}`);
  console.log(`summary -> ${summaryPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
