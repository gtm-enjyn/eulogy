import { ProfileSchema, RunSchema, RunSummarySchema } from '@eulogy/shared';
import { z } from 'zod';
import profileJson from '../../../../data/profiles/louis.json';
import julesProfile from '../../../../data/profiles/jules.json';
import julesData from '../../../../data/screenings/jules.json';
import raw from '../../../../data/runs/louis-demo.jsonl?raw';
import summaryJson from '../../../../data/runs/louis-demo.summary.json';

export const ScreeningSchema = z.object({
  profile: ProfileSchema,
  runs: z.array(RunSchema).min(1),
  summary: RunSummarySchema,
});
export const demo = ScreeningSchema.parse({
  profile: profileJson,
  runs: raw
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line)),
  summary: summaryJson,
});
export const julesScreening = ScreeningSchema.parse({ profile: julesProfile, ...julesData });
export const screeningQuery = (sample: string | null) =>
  sample === 'jules' || sample === 'louis' ? '?screening=' + sample : '';
export type Screening = z.infer<typeof ScreeningSchema>;
let current: Screening | undefined;
export function saveScreening(value: Screening) {
  current = ScreeningSchema.parse(value);
  try {
    sessionStorage.setItem('eulogy.screening', JSON.stringify(current));
  } catch {
    /* The current session can continue in memory. */
  }
}
export function getScreening(sample: string | null = null): Screening {
  if (sample === 'jules') return julesScreening;
  if (sample === 'louis') return demo;
  if (current) return current;
  try {
    const value = sessionStorage.getItem('eulogy.screening');
    if (value) {
      const result = ScreeningSchema.safeParse(JSON.parse(value));
      if (result.success) return (current = result.data);
    }
  } catch {
    /* Use the published screening when storage is unavailable. */
  }
  return demo;
}
