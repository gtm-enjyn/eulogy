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
});
