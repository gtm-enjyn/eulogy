import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { sampleProfile } from '@eulogy/shared';
import { BandRooms } from './band';
import { simulateRun } from './simulate';

describe('BAND room routing', () => {
  it('records exact offline requests, directed whispers and a single room for concurrent writers', async () => {
    const fetcher = vi.fn();
    const band = await BandRooms.connect(sampleProfile, { dryRun: true, fetcher });
    const id = 'louis-0001';
    await Promise.all([band.openRoom(id), band.openRoom(id)]);
    await band.postPrivate(id, 0, 'lea', 'camille', 'Keep the letter.');
    await band.humanGate(id);
    expect(fetcher).not.toHaveBeenCalled();
    expect(band.requests.filter((x) => x.url.endsWith('/agent/chats'))).toHaveLength(1);
    expect(band.requests[0]?.body).toEqual({ chat: {} });
    const [whisper, gate] = band.requests.slice(-2).map((x) => x.body);
    expect(whisper).toMatchObject({
      message: {
        mentions: [{ name: 'Camille', handle: 'demo/camille' }],
        content: '@demo/camille Keep the letter.',
      },
    });
    expect(gate).toMatchObject({ message: { mentions: [{ name: 'Human observer' }] } });
    expect(band.messages[0]).toMatchObject({
      year_index: 0,
      from: 'lea',
      to: 'camille',
      channel: 'private',
      mode: 'dry-run',
    });
  });
  it('routes a director veto before retrying an invalid chapter', async () => {
    const band = await BandRooms.connect(sampleProfile, { dryRun: true, noGate: true });
    const read = vi.fn().mockResolvedValue({ scene: 42 });
    await simulateRun(sampleProfile, 1, {
      read,
      onVeto: band.veto,
      onYear: band.onYear,
      beforeFinal: band.humanGate,
    });
    expect(band.messages[0]).toMatchObject({
      channel: 'veto',
      from: 'destiny',
      to: sampleProfile.id,
    });
    expect(band.messages.filter((m) => m.channel === 'veto')).toHaveLength(12);
    expect(read).toHaveBeenCalledTimes(12);
  });
  it('sends live wire shapes with per-character credentials using a stubbed transport', async () => {
    const room = randomUUID(),
      human = randomUUID(),
      director = randomUUID();
    const cast = Object.fromEntries(
      [sampleProfile.id, ...sampleProfile.relatives.map((r) => r.id)].map((id) => [
        id,
        { id: randomUUID(), name: id, handle: id, key: id + '-token' },
      ]),
    );
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/me'))
        return Response.json({ data: { id: director, name: 'Destiny', handle: 'owner/destiny' } });
      if (init?.method === 'GET')
        return Response.json({
          data: [
            {
              sender_id: human,
              inserted_at: new Date(Date.now() + 1).toISOString(),
              content: '@destiny yes',
            },
          ],
        });
      return Response.json({ data: { id: room } });
    };
    const env = {
      BAND_AGENT_ID: director,
      BAND_AGENT_KEY: 'director-token',
      BAND_CAST_JSON: JSON.stringify({
        ...cast,
        human: { id: human, name: 'Observer', handle: 'observer' },
      }),
    };
    const band = await BandRooms.connect(sampleProfile, { env, fetcher });
    await band.postPrivate('louis-0001', 2, 'lea', 'camille', 'Here is the letter.');
    const last = calls.at(-1)!;
    expect(last.url).toBe('https://app.band.ai/api/v1/agent/chats/' + room + '/messages');
    expect(last.init?.headers).toMatchObject({ 'X-API-Key': 'lea-token' });
    expect(JSON.parse(String(last.init?.body)).message.mentions).toEqual([
      { id: cast.camille!.id, name: 'camille', handle: 'camille' },
    ]);
    await band.humanGate('louis-0001');
    expect(band.messages.at(-1)).toMatchObject({ channel: 'gate', from: 'human', to: 'destiny' });
    expect(JSON.stringify(band.requests)).not.toContain('-token');
  });
  it('recruits the project cast across all peer pages and leaves unrelated directory members out', async () => {
    const profile = { ...sampleProfile, relatives: [sampleProfile.relatives[0]!] };
    const director = randomUUID(),
      louis = randomUUID(),
      camille = randomUUID(),
      outsider = randomUUID(),
      unrelated = randomUUID();
    const added: string[] = [];
    const calls: string[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      const path = new URL(String(url));
      calls.push(path.pathname + path.search);
      if (path.pathname.endsWith('/me'))
        return Response.json({ data: { id: director, name: 'Destiny', handle: 'eulogy/destiny' } });
      if (path.pathname.endsWith('/peers')) {
        const peers =
          path.searchParams.get('page') === '1'
            ? [
                { id: outsider, name: 'Camille', handle: 'another-team/camille', type: 'Agent' },
                { id: louis, name: 'Louis', handle: 'eulogy/louis', type: 'Agent' },
              ]
            : [{ id: camille, name: 'Camille', handle: 'eulogy/camille', type: 'Agent' }];
        return Response.json({ data: peers, metadata: { total_pages: 2 } });
      }
      if (path.pathname.endsWith('/participants'))
        added.push(JSON.parse(String(init?.body)).participant.participant_id);
      return Response.json({ data: { id: randomUUID() } });
    };
    const env = {
      BAND_AGENT_ID: director,
      BAND_AGENT_KEY: 'example',
      BAND_CAST_JSON: JSON.stringify({
        another_cast: { id: unrelated, name: 'Another cast', handle: 'other/role' },
      }),
    };
    const band = await BandRooms.connect(profile, { env, noGate: true, fetcher });
    await band.openRoom('louis-0002');
    expect(calls).toContain('/api/v1/agent/peers?page=2&page_size=100');
    expect(added.sort()).toEqual([louis, camille].sort());
  });
  it('rejects a credential for a different director before opening a room', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ data: { id: randomUUID(), name: 'Different', handle: 'team/director' } }),
    );
    await expect(
      BandRooms.connect(sampleProfile, {
        env: { BAND_AGENT_ID: randomUUID(), BAND_AGENT_KEY: 'example' },
        noGate: true,
        fetcher,
      }),
    ).rejects.toThrow('does not match');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
