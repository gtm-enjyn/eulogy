import type { DemoProfile } from './store';
import { focusRelative, callRelative } from './store';

export const TELEM = [
  ['Study estimating divorce prevalence among US entrepreneurs', 'Destiny needs evidence about breakup to calibrate the shock weights'],
  ['US cohort prevalence alcohol related illness among adults', 'Destiny needs evidence about illness_self to calibrate the shock weights'],
  ['Survey percentage of startup founders reporting burnout', 'Destiny needs evidence about burnout to calibrate the shock weights'],
  ['US share of new businesses failing within five years BLS', 'Destiny needs evidence about startup_failure to calibrate the shock weights'],
  ['Share of adult children living abroad apart from their parents', 'Destiny needs evidence about move_abroad to calibrate the shock weights'],
] as const;
export const BRUIN = ['raw_runs', 'raw_years', 'raw_decisions', 'raw_relatives', 'raw_relative_states', 'raw_private_messages', 'raw_eulogies', 'stg_eulogies', 'stg_outcomes', 'mart_outcome_distribution', 'mart_decision_impact', 'mart_turning_points'];
export const CHECKS: Record<string, string> = { raw_runs: 'not_null · unique · positive', raw_relative_states: 'between 0 and 100', raw_eulogies: 'sentiment ∈ [-1, 1]', stg_eulogies: 'accepted_values(relation)', mart_decision_impact: 'n ≥ 3', raw_years: 'not_null', raw_decisions: 'not_null' };
export const MART = [
  { action: 'Ask for help', with: 70.0, without: 50.0, lift: 20 },
  { action: 'Protect one evening at home', with: 62.5, without: 54.5, lift: 8 },
  { action: 'Take the late meeting', with: 41.7, without: 66.7, lift: -25 },
];
export const CAPTIONS = [
  'Claude · 5 agents · continuous emotional state (valence, arousal) · episodic memory · zod on every output',
  'BAND · one room per simulated life · public channel = the life · private @mentions = what they say behind your back',
  'Telem · Destiny fetches real base rates before rolling the dice · every query carries the agent\'s reasoning',
  'Bruin · 12 assets · raw → stg → mart · quality checks on every table · DuckDB',
  'Runware · FLUX.1 Kontext aging · TRELLIS.2 image→GLB bust in 32 s',
];

export interface Msg { at: number; who: string; txt: string; kind: 'pub' | 'priv' | 'sys' | 'gate' }
/** BAND room script with the user's real names. Times in ms. */
export function bandScript(p: DemoProfile): Msg[] {
  const you = p.name || 'You'; const f = focusRelative(p); const c = callRelative(p);
  const r = (i: number) => p.relatives[i % Math.max(1, p.relatives.length)]?.name ?? 'Maman';
  const F = f?.name ?? r(1), C = c?.name ?? r(0), M = r(0), T = r(2);
  return [
    { at: 400, who: 'destiny', txt: `Age ${p.age + 3}. A funding round closes the week of ${F}'s recital.`, kind: 'pub' },
    { at: 1500, who: you, txt: 'Take the late meeting — if I miss this call the round is gone.', kind: 'pub' },
    { at: 2600, who: M, txt: 'The telephone rang while the soup went cold. I waited until dark.', kind: 'pub' },
    { at: 3700, who: `${M} @${F}`, txt: `He only calls when he needs something. Don't tell him I said that.`, kind: 'priv' },
    { at: 5000, who: 'destiny', txt: `Age ${p.age + 11}. Burnout, base rate 34 % (source: telem). Applied.`, kind: 'pub' },
    { at: 6100, who: `${T} @${M}`, txt: 'He said things in that meeting he can\'t take back.', kind: 'priv' },
    { at: 7300, who: 'destiny', txt: 'BLOCKED: incoherent year (relationship_score 61 → 4). Re-rolling.', kind: 'sys' },
    { at: 8600, who: `${F} @${M}`, txt: `Does he even know what year I'm in?`, kind: 'priv' },
    { at: 10000, who: 'destiny', txt: `Age ${p.age + 32}. ${C} is in hospital. ${you} is in a board meeting.`, kind: 'pub' },
    { at: 11400, who: you, txt: 'Fly tonight — nothing here matters more.', kind: 'pub' },
    { at: 12600, who: `${C} @${M}`, txt: 'He came. He sat there for three days.', kind: 'priv' },
    { at: 14000, who: 'destiny @human', txt: 'Approve the final chapter? Reply yes or skip and mention Destiny.', kind: 'gate' },
    { at: 15200, who: 'human', txt: 'yes', kind: 'pub' },
    { at: 16400, who: 'destiny', txt: `Room 847/1000 closed · ending_cluster = reconciled · ${F} at the table.`, kind: 'pub' },
  ];
}

export function ledgers(p: DemoProfile) {
  const f = focusRelative(p)?.name ?? 'your sister'; const c = callRelative(p)?.name ?? 'your father'; const t = p.relatives.find((r) => ['cofounder', 'friend'].includes(r.relation))?.name ?? 'Theo';
  const a = p.age || 20;
  return {
    one: [[a + 3, `Takes the late meeting instead of ${f}'s recital.`], [a + 11, `Shouts at ${t} in front of the team. ${t} leaves.`], [a + 32, `${c} dies. They never spoke.`], [70, 'Thanksgiving. One plate.']] as [number, string][],
    two: [[a + 3, `Asks for help. Calls ${c} first. Says sorry out loud.`], [a + 11, `Apologizes to ${t} before the board does. They build the second one together.`], [a + 32, `${c} at the table. Every year.`], [70, 'Thanksgiving. Nine plates.']] as [number, string][],
  };
}
