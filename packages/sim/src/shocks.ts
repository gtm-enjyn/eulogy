import { clamp, type Profile } from '@eulogy/shared';
import { z } from 'zod';
import defaults from '../../../data/priors/default.json';

export const shockScenes = {
  illness_self: 'A clinic appointment changes the plans for the week',
  illness_relative: 'Someone close needs company in a hospital waiting room',
  startup_success: 'The first major contract arrives on a family weekend',
  startup_failure: 'An empty order book forces a difficult choice at home',
  breakup: 'A suitcase appears beside the front door',
  birth: 'A newborn turns the household schedule upside down',
  move_abroad: 'A job offer comes with a one-way ticket',
  parent_death: 'An old family photograph resurfaces at a funeral',
  burnout: 'An alarm rings through a morning too exhausted to begin',
  windfall: 'An unexpected cheque arrives in the post',
  affair_discovered: 'A message on an unlocked screen changes dinner',
  lawsuit: 'A letter from a lawyer interrupts breakfast',
} as const;
export type Shock = keyof typeof shockScenes;
const prior = z.object({
  weight: z.number().finite().nonnegative(),
  source_url: z.string().url().nullable(),
  snippet: z.string(),
});
export const PriorsSchema = z.object(
  Object.fromEntries(Object.keys(shockScenes).map((k) => [k, prior])) as Record<
    Shock,
    typeof prior
  >,
);
export type Priors = z.infer<typeof PriorsSchema>;
export const defaultPriors = PriorsSchema.parse(defaults);
export function drawShock(rng: () => number, priors: Priors): Shock {
  const entries = Object.keys(shockScenes) as Shock[];
  const total = entries.reduce((sum, key) => sum + priors[key].weight, 0);
  if (total === 0) return drawShock(rng, defaultPriors);
  let value = rng() * total;
  for (const key of entries) {
    value -= priors[key].weight;
    if (value < 0) return key;
  }
  return 'burnout';
}
export function deathAge(profile: Profile, rng: () => number): number {
  const { alcohol, sleep, sport } = profile.habits;
  const normal =
    Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, rng()))) * Math.cos(2 * Math.PI * rng());
  return clamp(
    Math.round(
      81 - Number(alcohol >= 7) * 4 - Number(sleep <= 3) * 3 + Number(sport >= 5) * 3 + normal * 6,
    ),
    profile.age + 6,
    96,
  );
}
export const causes = [
  'heart disease',
  'stroke',
  'cancer',
  'pneumonia',
  'an accident',
  'respiratory illness',
  'organ failure',
  'old age',
] as const;
export function drawCause(profile: Profile, rng: () => number) {
  const weights = [
    3 + (10 - profile.habits.sport) / 5,
    2,
    3,
    1,
    1,
    1,
    1 + profile.habits.alcohol / 3,
    2 + profile.habits.sleep / 3,
  ];
  let sample = rng() * weights.reduce((a, b) => a + b, 0);
  return causes[weights.findIndex((w) => (sample -= w) < 0)] ?? 'old age';
}
