import { z } from 'zod';
import { defaultPriors, PriorsSchema, type Shock } from './shocks';
export const telemEndpoint = 'https://router.telem.ai/v1/search';
const searches: { shock: Shock; query: string; term: RegExp }[] = [
  {
    shock: 'breakup',
    query: 'Study estimating divorce prevalence among US entrepreneurs',
    term: /divorc/i,
  },
  {
    shock: 'illness_self',
    query: 'US cohort prevalence alcohol related illness among adults',
    term: /illness|disease/i,
  },
  {
    shock: 'burnout',
    query: 'Survey percentage of startup founders reporting burnout',
    term: /burnout/i,
  },
  {
    shock: 'startup_failure',
    query: 'US share of new businesses failing within five years BLS',
    term: /fail|clos/i,
  },
  {
    shock: 'move_abroad',
    query: 'Share of adult children living abroad apart from their parents survey',
    term: /abroad/i,
  },
];
export function priorRequests(id: string) {
  return searches.map((s) => ({
    user_input: { query: s.query },
    search: { num_results: 3 },
    postprocessor_names: [],
    metadata: {
      context:
        'Destiny needs evidence about ' +
        s.shock +
        ' to calibrate the fictional shock weights for profile ' +
        id +
        '.',
    },
  }));
}
const Hit = z.object({
  url: z
    .string()
    .url()
    .regex(/^https?:\/\//i),
  summary: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
});
const Search = z.object({ preprocessor_runs: z.array(z.unknown()) });
const Provider = z.object({
  status: z.string().optional(),
  output_payload: z.object({ results: z.array(z.unknown()) }),
});
function* searchHits(response: unknown) {
  const result = Search.parse(response);
  for (const entry of result.preprocessor_runs) {
    const provider = Provider.safeParse(entry);
    if (!provider.success || provider.data.status === 'failed' || provider.data.status === 'error')
      continue;
    for (const raw of provider.data.output_payload.results) {
      const hit = Hit.safeParse(raw);
      if (hit.success) yield hit.data;
    }
  }
}
export async function researchPriors(id: string, key?: string) {
  const priors = PriorsSchema.parse(defaultPriors);
  if (!key) return priors;
  await Promise.all(
    priorRequests(id).map(async (body, index) => {
      const definition = searches[index]!;
      try {
        const response = await fetch(telemEndpoint, {
          method: 'POST',
          signal: AbortSignal.timeout(10000),
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) return;
        for (const hit of searchHits(await response.json())) {
          const sentences = (hit.summary ?? hit.excerpt ?? '').split(/(?<=[.!?])\s+/);
          for (const snippet of sentences) {
            const values = [...snippet.matchAll(/\b(\d{1,3}(?:\.\d+)?)\s*%/g)];
            if (
              values.length !== 1 ||
              !definition.term.test(snippet) ||
              /increas|decreas|confidence interval/i.test(snippet)
            )
              continue;
            const weight = Number(values[0]![1]) / 100;
            if (weight <= 0 || weight > 1) continue;
            priors[definition.shock] = { weight, source_url: hit.url, snippet };
            return;
          }
        }
      } catch {
        /* Unavailable or ambiguous sources leave this individual default intact. */
      }
    }),
  );
  return PriorsSchema.parse(priors);
}
