import { get } from '@vercel/blob';
import { z } from 'zod';
import { Batch, checkRequest, Id, json, Manifest } from './contracts';
async function read(path: string) {
  const blob = await get(path, { access: 'private' });
  if (!blob || blob.statusCode !== 200) return null;
  return new Response(blob.stream).json();
}
export async function runs(request: Request) {
  const invalid = checkRequest(request, 'GET', ['BLOB_READ_WRITE_TOKEN']);
  if (invalid) return invalid;
  const profile = Id.safeParse(new URL(request.url).searchParams.get('profile_id'));
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('eulogy_batch='))
    ?.slice('eulogy_batch='.length);
  const batch = z.string().uuid().safeParse(cookie);
  if (!profile.success || !batch.success) return json({ error: 'Screening unavailable.' }, 404);
  const prefix = 'runs/' + profile.data + '/' + batch.data;
  try {
    const saved = await read(prefix + '/manifest.json');
    if (!saved) return json({ error: 'Screening unavailable.' }, 404);
    const manifest = Manifest.parse(saved);
    const records = await Promise.all(
      manifest.run_ids.map((_, i) => read(prefix + '/' + (i + 1) + '.json')),
    );
    return json(Batch.parse({ ...manifest, runs: records }));
  } catch {
    return json({ error: 'The screening could not be read.' }, 502);
  }
}
export default { fetch: runs };
