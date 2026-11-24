import { existsSync, readFileSync } from 'node:fs';
import { ProfileSchema, RunSchema } from '@eulogy/shared';
import { BandRooms } from '../packages/sim/src/band';
if (existsSync('.env')) process.loadEnvFile('.env');
const profile = ProfileSchema.parse(JSON.parse(readFileSync('data/profiles/louis.json', 'utf8')));
const rooms = await BandRooms.connect(profile, {
  dryRun: process.argv.includes('--dry-run'),
  noGate: process.argv.includes('--no-gate'),
});
const runs = readFileSync('data/runs/' + profile.id + '.jsonl', 'utf8')
  .trim()
  .split('\n')
  .map((line) => RunSchema.parse(JSON.parse(line)));
for (const run of runs) {
  for (const year of run.years) {
    if (year.year_index === 5) await rooms.humanGate(run.run_id);
    await rooms.onYear(year);
  }
}
rooms.save('data/runs', 'data/band');
console.log(rooms.mode, runs.length + ' rooms, ' + rooms.messages.length + ' transcript events');
