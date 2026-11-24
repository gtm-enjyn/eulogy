import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ProfileSchema } from '@eulogy/shared';
import { bust, portraits, renderTasks, RUNWARE_URL, textures } from '../packages/sim/src/runware';
if (existsSync('.env')) process.loadEnvFile('.env');
const profile = ProfileSchema.parse(JSON.parse(readFileSync('data/profiles/louis.json', 'utf8')));
const key = process.env.RUNWARE_API_KEY;
const dry = process.argv.includes('--dry-run') || !key;
mkdirSync('data/runware', { recursive: true });
const photos = portraits(profile),
  materials = textures();
if (dry) {
  const reference = { ...profile, photoUrl: 'https://example.org/demo/portrait.jpg' };
  const task = bust('https://example.org/demo/aged-portrait.jpg');
  const batches = [
    portraits(reference),
    photos,
    materials,
    [task],
    [{ taskType: 'getResponse', taskUUID: task.taskUUID }],
  ];
  writeFileSync(
    'data/runware/requests.json',
    JSON.stringify(
      { mode: 'dry-run', endpoint: RUNWARE_URL, method: 'POST', bodies: batches },
      null,
      2,
    ) + '\n',
  );
} else {
  const images = await renderTasks(photos, key);
  const [bustUrl] = await renderTasks([bust(images[2]!)], key);
  const tiles = await renderTasks(materials, key);
  for (const [i, name] of ['rose', 'floor', 'wood'].entries()) {
    const r = await fetch(tiles[i]!);
    if (!r.ok) throw Error('Texture download failed');
    writeFileSync('apps/web/public/textures/' + name + '.png', Buffer.from(await r.arrayBuffer()));
  }
  const model = await fetch(bustUrl!);
  if (!model.ok) throw Error('Bust download failed');
  mkdirSync('apps/web/public/models', { recursive: true });
  writeFileSync('apps/web/public/models/louis-bust.glb', Buffer.from(await model.arrayBuffer()));
  writeFileSync(
    'data/runware/result.json',
    JSON.stringify({ portraits: images, bustUrl }, null, 2) + '\n',
  );
}
