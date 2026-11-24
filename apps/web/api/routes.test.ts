import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleProfile } from '@eulogy/shared';
import { get, put } from '@vercel/blob';
import { simulate } from './simulate';
import { runs } from './runs';
import { portraits } from './portraits';
import { upload } from './upload';
const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (path: string, body: string) => {
    storage.set(path, body);
    return { url: path };
  }),
  get: vi.fn(async (path: string) =>
    storage.has(path) ? { statusCode: 200, stream: new Response(storage.get(path)).body } : null,
  ),
  del: vi.fn(async (paths: string[]) => paths.forEach((p) => storage.delete(p))),
  issueSignedToken: vi.fn(async () => ({})),
  presignUrl: vi.fn(async () => ({
    presignedUrl:
      'https://store.private.blob.vercel-storage.com/portraits/input/mock?signature=test',
  })),
}));
const post = (data: unknown) =>
  new Request('https://demo.test/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
describe('Vercel functions', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    for (const k of [
      'ANTHROPIC_API_KEY',
      'AI_GATEWAY_API_KEY',
      'VERCEL_OIDC_TOKEN',
      'BLOB_READ_WRITE_TOKEN',
      'RUNWARE_API_KEY',
      'TELEM_API_KEY',
    ])
      vi.stubEnv(k, '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it('returns 501 without each endpoint credential, and 405 for wrong methods', async () => {
    for (const route of [simulate, portraits, upload]) {
      expect((await route(post({}))).status).toBe(501);
      expect((await route(new Request('https://demo.test/'))).status).toBe(405);
    }
    expect((await runs(new Request('https://demo.test/'))).status).toBe(501);
  });
  it('accepts either gateway credential and identifies a missing private store', async () => {
    for (const key of ['AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN']) {
      vi.stubEnv(key, 'test-gateway');
      const missing = await simulate(post({}));
      expect(missing.status).toBe(501);
      expect((await missing.json()).error).toContain('storage');
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test');
      expect((await simulate(post({}))).status).toBe(400);
      vi.stubEnv(key, '');
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    }
  });
  it('records twelve screenings privately and only replays the associated browser batch', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test');
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test');
    const fetchModel = vi.fn(async (_url: string, init: RequestInit) => {
      const call = JSON.parse(String(init.body));
      const ctx = JSON.parse(call.messages[0].content);
      const ids = sampleProfile.relatives.map((r) => r.id);
      const chapter = {
        scene: 'The kitchen clock stopped.',
        wealth: 0.2,
        health: 0.8,
        decisions: [{ actor: sampleProfile.id, action: 'Ask for help', reason: 'I need a hand.' }],
        relative_states: ids.map((relative_id) => ({
          relative_id,
          emotion: { valence: 0.4, arousal: 0.6 },
          relationship_score: 60,
          memory_update: 'I remember the stopped clock.',
        })),
        private_messages: [{ from: ids[0], to: ids[1], text: 'We stayed.' }],
        ...(ctx.chapter === 6
          ? {
              cause_of_death: 'old age',
              farewells: ids.map((relative_id) => ({
                relative_id,
                text: 'I remember the kitchen clock.',
                sentiment: 0.6,
              })),
            }
          : {}),
      };
      return Response.json({ content: [{ type: 'text', text: JSON.stringify(chapter) }] });
    });
    vi.stubGlobal('fetch', fetchModel);
    const response = await simulate(
      post({ ...sampleProfile, photoUrl: 'https://example.test/sensitive-token' }),
    );
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.summary.generation).toEqual({ claude: 72 });
    expect(result.runs).toHaveLength(12);
    expect(fetchModel).toHaveBeenCalledTimes(72);
    expect(String(fetchModel.mock.calls[0]?.[1].body)).not.toContain('sensitive-token');
    expect(put).toHaveBeenCalledTimes(13);
    const read = 'https://demo.test/api/runs?profile_id=' + sampleProfile.id;
    expect((await runs(new Request(read))).status).toBe(404);
    expect(get).not.toHaveBeenCalled();
    const headers = { cookie: response.headers.get('set-cookie')!.split(';')[0]! };
    expect(await (await runs(new Request(read, { headers }))).json()).toEqual(result);
    expect((await runs(new Request(read + 'x', { headers }))).status).toBe(404);
  });
  it('rejects non-images and untrusted portrait references before contacting a provider', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test');
    vi.stubEnv('RUNWARE_API_KEY', 'test');
    expect((await upload(post({ image: 'data:image/png;base64,YWJj' }))).status).toBe(400);
    expect(
      (await portraits(post({ ...sampleProfile, photoUrl: 'https://example.test/asset.jpg' })))
        .status,
    ).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });
  it('serves a short-lived private photo reference', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test');
    const image =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+auZsAAAAASUVORK5CYII=';
    const result = await upload(post({ image }));
    expect(result.status).toBe(200);
    expect((await result.json()).photoUrl).toContain('signature=');
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^portraits\/input\//),
      expect.any(Buffer),
      { access: 'private', contentType: 'image/png' },
    );
  });
});
