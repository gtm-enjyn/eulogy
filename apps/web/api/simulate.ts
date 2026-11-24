import { randomUUID } from 'node:crypto';
import { del, put } from '@vercel/blob';
import { simulateProfile, summarize } from '../../../packages/sim/src/generate';
import { researchPriors } from '../../../packages/sim/src/priors';
import { Batch, checkRequest, InputProfile, json, Manifest, readBody } from './contracts';

export async function simulate(request: Request) {
  const invalid = checkRequest(request, 'POST', []);
  if (invalid) return invalid;
  if (
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.AI_GATEWAY_API_KEY &&
    !process.env.VERCEL_OIDC_TOKEN
  )
    return json({ error: 'The live model is not configured.' }, 501);
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return json({ error: 'Private run storage is not configured.' }, 501);
  const input = await readBody(request, InputProfile, 30_000);
  if (input.error) return input.error;
  const profile = { ...input.data, photoUrl: undefined, portraits: undefined, bustUrl: undefined };
  const batch = randomUUID(),
    prefix = 'runs/' + profile.id + '/' + batch;
  const uploaded: string[] = [];
  try {
    const priors = await researchPriors(profile.id, process.env.TELEM_API_KEY);
    const runs = await simulateProfile(profile, { runs: 12, priors });
    const reply = Batch.parse({
      profile_id: profile.id,
      runs,
      run_ids: runs.map((r) => r.run_id),
      summary: summarize(runs, profile),
    });
    const writes = await Promise.allSettled(
      runs.map(async (run) => {
        const blob = await put(prefix + '/' + run.seed + '.json', JSON.stringify(run), {
          access: 'private',
          contentType: 'application/json',
        });
        uploaded.push(blob.url);
      }),
    );
    if (writes.some((result) => result.status === 'rejected')) throw Error('Incomplete batch');
    await put(prefix + '/manifest.json', JSON.stringify(Manifest.parse(reply)), {
      access: 'private',
      contentType: 'application/json',
    });
    return json(reply, 200, {
      'Set-Cookie':
        'eulogy_batch=' +
        batch +
        '; Path=/api/runs; HttpOnly; Secure; SameSite=Strict; Max-Age=86400',
    });
  } catch {
    if (uploaded.length) await del(uploaded).catch(() => {});
    return json({ error: 'The live screening could not be completed.' }, 502);
  }
}
export default { fetch: simulate };
