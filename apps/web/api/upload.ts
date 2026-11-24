import { randomUUID } from 'node:crypto';
import { del, issueSignedToken, presignUrl, put } from '@vercel/blob';
import { z } from 'zod';
import { checkRequest, json, readBody } from './contracts';

function signature(bytes: Buffer, mime: string) {
  if (mime === 'image/png')
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}
export async function upload(request: Request) {
  const invalid = checkRequest(request, 'POST', ['BLOB_READ_WRITE_TOKEN']);
  if (invalid) return invalid;
  const input = await readBody(request, z.object({ image: z.string().max(3_333_400) }), 3_334_000);
  if (input.error) return input.error;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    input.data.image,
  );
  if (!match) return json({ error: 'Expected a JPEG, PNG or WebP image.' }, 400);
  const mime = match[1]!,
    encoded = match[2]!,
    bytes = Buffer.from(encoded, 'base64');
  if (!signature(bytes, mime) || !bytes.length || bytes.length > 2_500_000)
    return json({ error: 'Invalid image.' }, 400);
  const path = 'portraits/input/' + randomUUID() + '.' + mime.slice(6);
  let created = false;
  try {
    await put(path, bytes, { access: 'private', contentType: mime });
    created = true;
    const token = await issueSignedToken({
      pathname: path,
      operations: ['get'],
      validUntil: Date.now() + 15 * 60_000,
    });
    const { presignedUrl } = await presignUrl(token, {
      operation: 'get',
      access: 'private',
      pathname: path,
    });
    return json({ photoUrl: z.string().url().parse(presignedUrl) });
  } catch {
    if (created) await del(path).catch(() => {});
    return json({ error: 'Photo storage is unavailable.' }, 502);
  }
}
export default { fetch: upload };
