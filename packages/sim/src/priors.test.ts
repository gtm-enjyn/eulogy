import { readFileSync } from 'node:fs';
import { describe, afterEach, expect, it, vi } from 'vitest';
import { defaultPriors } from './shocks';
import { priorRequests, researchPriors, telemEndpoint } from './priors';

afterEach(() => {
  vi.unstubAllGlobals();
});
describe('Telem search wire contract', () => {
  it('records the same five contextual requests as the published dry run', () => {
    const proof = JSON.parse(
      readFileSync(new URL('../../../data/telem/requests.json', import.meta.url), 'utf8'),
    );
    expect(proof).toMatchObject({
      mode: 'dry-run',
      endpoint: telemEndpoint,
      method: 'POST',
      bodies: priorRequests('louis-demo'),
    });
    expect(priorRequests('louis-demo')).toHaveLength(5);
  });
  it('retains usable normalized rows when another provider or one of its rows is invalid', async () => {
    const requests: { url: string; init?: RequestInit }[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init });
      const query = JSON.parse(String(init?.body)).user_input.query;
      if (!query.includes('burnout')) return new Response(null, { status: 429 });
      return Response.json({
        normalized_schema_version: 2,
        status: 'succeeded',
        preprocessor_runs: [
          { status: 'failed', output_payload: { error: 'upstream queue unavailable' } },
          {
            status: 'succeeded',
            output_payload: {
              results: [
                {
                  url: 'https://example.org/conflict',
                  summary: 'The burnout prevalence increased by 42%.',
                },
                { url: 'bad url', summary: 'A burnout prevalence of 99%.' },
                {
                  url: 'https://example.org/founder-study',
                  excerpt: 'Among the surveyed founders, 32.5% reported burnout.',
                },
              ],
            },
          },
        ],
      });
    };
    vi.stubGlobal('fetch', fetcher);
    const result = await researchPriors('test-profile', 'test-key');
    expect(requests).toHaveLength(5);
    expect(requests[0]?.url).toBe(telemEndpoint);
    expect(requests[0]?.init).toMatchObject({
      method: 'POST',
      headers: { Authorization: 'Bearer test-key' },
    });
    expect(JSON.parse(String(requests[0]?.init?.body)).metadata.context).toContain('test-profile');
    expect(result.burnout).toEqual({
      weight: 0.325,
      source_url: 'https://example.org/founder-study',
      snippet: 'Among the surveyed founders, 32.5% reported burnout.',
    });
    expect(result.breakup).toEqual(defaultPriors.breakup);
    expect(defaultPriors.burnout.source_url).toBeNull();
  });
  it('preserves all defaults offline and when no unique in-range percentage appears', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        preprocessor_runs: [
          {
            output_payload: {
              results: [
                {
                  url: 'https://example.org/study',
                  summary: 'Burnout ranged from 12% to 30%. A 140% burnout prevalence.',
                },
              ],
            },
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    expect(await researchPriors('id')).toEqual(defaultPriors);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await researchPriors('id', 'test-key')).toEqual(defaultPriors);
  });
});
