import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Profile, YearEvent } from '@eulogy/shared';
import { z } from 'zod';

const base = 'https://app.band.ai/api/v1/agent';
const Member = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  handle: z.string().min(1),
  key: z.string().min(1).optional(),
});
type Member = z.infer<typeof Member>;
type Cast = Record<string, Member>;
const channel = z.enum(['public', 'private', 'veto', 'gate']);
const Message = z.object({
  run_id: z.string(),
  year_index: z.number().int(),
  channel,
  from: z.string(),
  to: z.string(),
  text: z.string(),
  mode: z.enum(['live', 'dry-run']),
});
export type BandMessage = z.infer<typeof Message>;
interface Exchange {
  run_id: string;
  method: 'GET' | 'POST' | 'PATCH';
  url: string;
  body?: unknown;
}
const objectResponse = z.object({ data: z.unknown() });
function sampleId(name: string) {
  const h = createHash('sha256')
    .update('eulogy-band-fixture:' + name)
    .digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '4' + h.slice(13, 16),
    '8' + h.slice(17, 20),
    h.slice(20, 32),
  ].join('-');
}
function roleNames(p: Profile): Record<string, string> {
  return Object.fromEntries([
    ['destiny', 'Destiny'],
    [p.id, p.name],
    ...p.relatives.map((r) => [r.id, r.name]),
  ]);
}
function dryCast(p: Profile): Cast {
  return Object.fromEntries(
    Object.entries({ ...roleNames(p), human: 'Human observer' }).map(([id, name]) => [
      id,
      { id: sampleId(id), name, handle: 'demo/' + id },
    ]),
  );
}
interface Options {
  dryRun?: boolean;
  noGate?: boolean;
  env?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
}
const PeerPage = z.object({
  data: z.array(Member.extend({ type: z.enum(['Agent', 'User']) })),
  metadata: z.object({ total_pages: z.number().int().nonnegative().optional() }).optional(),
});
async function bandRead(path: string, key: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(base + path, {
    method: 'GET',
    headers: { 'X-API-Key': key },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('BAND ' + path.split('?')[0] + ' returned HTTP ' + response.status);
  return response.json();
}
async function ownedPeers(owner: string, key: string, fetcher: typeof fetch) {
  const peers: Member[] = [];
  let page = 1,
    total = 1;
  while (page <= total) {
    const result = PeerPage.parse(
      await bandRead('/peers?page=' + page + '&page_size=100', key, fetcher),
    );
    peers.push(
      ...result.data.filter((p) => p.type === 'Agent' && p.handle.startsWith(owner + '/')),
    );
    total = result.metadata?.total_pages ?? page;
    page++;
  }
  return peers;
}
export class BandRooms {
  readonly messages: BandMessage[] = [];
  readonly requests: Exchange[] = [];
  private rooms = new Map<string, Promise<string>>();
  private constructor(
    readonly profile: Profile,
    readonly mode: 'dry-run' | 'live',
    private cast: Cast,
    private noGate: boolean,
    private fetcher: typeof fetch,
  ) {}
  static async connect(profile: Profile, options: Options = {}) {
    const env = options.env ?? process.env;
    const fetcher = options.fetcher ?? fetch;
    if (options.dryRun || !env.BAND_AGENT_KEY || !env.BAND_AGENT_ID)
      return new BandRooms(profile, 'dry-run', dryCast(profile), Boolean(options.noGate), fetcher);
    const configured = z.record(Member).parse(JSON.parse(env.BAND_CAST_JSON || '{}'));
    const names = roleNames(profile);
    const director = z
      .object({ data: Member })
      .parse(await bandRead('/me', env.BAND_AGENT_KEY, fetcher)).data;
    if (director.id !== env.BAND_AGENT_ID)
      throw Error('BAND_AGENT_ID does not match the authenticated agent');
    const cast: Cast = Object.fromEntries(
      Object.entries(configured).filter(([id]) => id === 'human' || Object.hasOwn(names, id)),
    );
    cast.destiny = { ...director, key: env.BAND_AGENT_KEY };
    const required = Object.keys(names).filter((id) => !cast[id]);
    if (required.length) {
      const owner = director.handle.split('/')[0]!;
      const peers = await ownedPeers(owner, env.BAND_AGENT_KEY, fetcher);
      for (const id of required) {
        const matches = peers.filter(
          (p) => p.id !== director.id && (p.name === names[id] || p.handle === owner + '/' + id),
        );
        if (matches.length !== 1)
          throw Error('BAND needs a unique cast mapping for ' + id + ' in BAND_CAST_JSON');
        cast[id] = matches[0]!;
      }
    }
    if (new Set(Object.values(cast).map((p) => p.id)).size !== Object.keys(cast).length)
      throw Error('BAND cast roles must identify distinct participants');
    if (!options.noGate && !cast.human)
      throw Error('BAND needs a human observer in BAND_CAST_JSON, or --no-gate');
    return new BandRooms(profile, 'live', cast, Boolean(options.noGate), fetcher);
  }
  private async request(
    run: string,
    method: Exchange['method'],
    path: string,
    body?: unknown,
    sender = 'destiny',
  ): Promise<unknown> {
    const url = base + path;
    this.requests.push({ run_id: run, method, url, ...(body === undefined ? {} : { body }) });
    if (this.mode === 'dry-run') return { data: { id: sampleId(run) } };
    const key = this.cast[sender]?.key ?? this.cast.destiny!.key!;
    const response = await this.fetcher(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw Error('BAND ' + method + ' ' + path + ' returned HTTP ' + response.status);
    if (response.status === 204) return {};
    return objectResponse.parse(await response.json());
  }
  openRoom(run: string): Promise<string> {
    const existing = this.rooms.get(run);
    if (existing) return existing;
    const promise = this.createRoom(run);
    this.rooms.set(run, promise);
    return promise;
  }
  private async createRoom(run: string) {
    const result = await this.request(run, 'POST', '/chats', { chat: {} });
    const id = z.object({ data: z.object({ id: z.string().uuid() }) }).parse(result).data.id;
    await this.request(run, 'PATCH', '/chats/' + id, { chat: { title: 'life-' + run } });
    for (const [role, actor] of Object.entries(this.cast)) {
      if (role !== 'destiny')
        await this.request(run, 'POST', '/chats/' + id + '/participants', {
          participant: { participant_id: actor.id, role: 'member' },
        });
    }
    return id;
  }
  private async post(
    run: string,
    year: number,
    kind: BandMessage['channel'],
    from: string,
    to: string[],
    text: string,
  ) {
    const room = await this.openRoom(run);
    const sender = this.mode === 'dry-run' || this.cast[from]?.key ? from : 'destiny';
    const recipients = to.filter((id) => this.cast[id] && id !== sender);
    // A single-key director already receives messages addressed to itself.
    // Acknowledge the writing relative without mentioning a third character.
    if (!recipients.length) recipients.push(from === 'destiny' ? this.profile.id : from);
    const mentions = recipients.map((id) => {
      const p = this.cast[id]!;
      return { id: p.id, name: p.name, handle: p.handle };
    });
    const content =
      mentions.map((p) => '@' + p.handle).join(' ') +
      ' ' +
      (sender === from ? '' : this.cast[from]!.name + ': ') +
      text;
    await this.request(
      run,
      'POST',
      '/chats/' + room + '/messages',
      { message: { content, mentions } },
      sender,
    );
    this.messages.push(
      Message.parse({
        run_id: run,
        year_index: year,
        channel: kind,
        from,
        to: to.join(','),
        text,
        mode: this.mode,
      }),
    );
  }
  postPublic(run: string, year: number, from: string, text: string) {
    return this.post(
      run,
      year,
      'public',
      from,
      Object.keys(roleNames(this.profile)).filter((id) => id !== from),
      text,
    );
  }
  postPrivate(run: string, year: number, from: string, to: string, text: string) {
    return this.post(run, year, 'private', from, [to], text);
  }
  veto = (run: string, index: number, reason: string) =>
    this.post(
      run,
      index,
      'veto',
      'destiny',
      [this.profile.id],
      'BLOCKED: incoherent year, re-rolling. ' + reason,
    );
  humanGate = async (run: string) => {
    if (this.noGate) {
      this.messages.push({
        run_id: run,
        year_index: 5,
        channel: 'gate',
        from: 'destiny',
        to: 'human',
        text: 'Gate skipped.',
        mode: this.mode,
      });
      return;
    }
    const start = Date.now();
    await this.post(
      run,
      5,
      'gate',
      'destiny',
      ['human'],
      'Approve the funeral? Reply yes or skip and mention Destiny.',
    );
    const room = await this.openRoom(run);
    if (this.mode === 'dry-run') return;
    const replies = z.object({
      data: z.array(
        z.object({ sender_id: z.string(), content: z.string(), inserted_at: z.string() }),
      ),
    });
    while (Date.now() - start < 60000) {
      const { data } = replies.parse(
        await this.request(run, 'GET', '/chats/' + room + '/messages?sort_order=desc&limit=30'),
      );
      const reply = data.find(
        (m) =>
          m.sender_id === this.cast.human!.id &&
          Date.parse(m.inserted_at) >= start &&
          /^(yes|skip)$/i.test(m.content.replace(/@\[\[[^\]]+\]\]|@\S+/g, '').trim()),
      );
      if (reply) {
        this.messages.push({
          run_id: run,
          year_index: 5,
          channel: 'gate',
          from: 'human',
          to: 'destiny',
          text: reply.content,
          mode: this.mode,
        });
        return;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw Error('Human approval is still pending for ' + run);
  };
  onYear = async (year: YearEvent) => {
    const run = year.run_id,
      i = year.year_index;
    await this.postPublic(run, i, 'destiny', 'Age ' + year.protagonist_age + '. ' + year.shock);
    for (const d of year.decisions)
      await this.postPublic(run, i, d.actor, d.action + ' — ' + d.reason);
    for (const state of year.relative_states)
      await this.postPublic(run, i, state.relative_id, state.memory_update);
    for (const m of year.private_messages) await this.postPrivate(run, i, m.from, m.to, m.text);
  };
  save(out: string, proofDir?: string) {
    mkdirSync(out, { recursive: true });
    const messages = [...this.messages].sort(
      (a, b) => a.run_id.localeCompare(b.run_id) || a.year_index - b.year_index,
    );
    const name = z
      .string()
      .regex(/^[\w-]+$/)
      .parse(this.profile.id);
    function atomic(path: string, body: string) {
      const tmp = path + '.' + randomUUID() + '.tmp';
      writeFileSync(tmp, body);
      renameSync(tmp, path);
    }
    atomic(
      join(out, name + '.band.jsonl'),
      messages.map((m) => JSON.stringify(m)).join('\n') + '\n',
    );
    if (proofDir) {
      mkdirSync(proofDir, { recursive: true });
      const first = messages[0]?.run_id;
      atomic(
        join(proofDir, 'requests.json'),
        JSON.stringify(
          {
            mode: this.mode,
            run_id: first,
            requests: this.requests.filter((r) => r.run_id === first),
          },
          null,
          2,
        ) + '\n',
      );
    }
  }
}
