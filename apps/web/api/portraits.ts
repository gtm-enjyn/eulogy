import { z } from 'zod';
import { generatePortraits } from '../../../packages/sim/src/runware';
import { checkRequest, InputProfile, json, readBody } from './contracts';
const Artwork = z.object({
  portraits: z.array(z.string().url()).length(3),
  bustUrl: z.string().url(),
});
export async function portraits(request: Request) {
  const invalid = checkRequest(request, 'POST', ['RUNWARE_API_KEY']);
  if (invalid) return invalid;
  const input = await readBody(request, InputProfile, 30_000);
  if (input.error) return input.error;
  if (input.data.photoUrl) {
    const url = new URL(input.data.photoUrl);
    if (
      url.protocol !== 'https:' ||
      !url.hostname.endsWith('.private.blob.vercel-storage.com') ||
      !url.pathname.startsWith('/portraits/input/')
    )
      return json({ error: 'Use a photo from the upload endpoint.' }, 400);
  }
  try {
    return json(Artwork.parse(await generatePortraits(input.data, process.env.RUNWARE_API_KEY!)));
  } catch {
    return json({ error: 'Portrait generation is unavailable.' }, 502);
  }
}
export default { fetch: portraits };
