import {
  clamp,
  makeRng,
  RunSchema,
  type Eulogy,
  type Profile,
  type Run,
  type YearEvent,
} from '@eulogy/shared';
import {
  configuredReader,
  firstChoices,
  validateChapter,
  type Chapter,
  type ChapterReader,
} from './chapter';
import {
  causes,
  deathAge,
  defaultPriors,
  drawCause,
  drawShock,
  shockScenes,
  type Priors,
} from './shocks';

export interface SimulationOptions {
  mock?: boolean;
  read?: ChapterReader;
  priors?: Priors;
  onVeto?: (runId: string, index: number, reason: string) => Promise<void>;
  onYear?: (year: YearEvent) => Promise<void>;
  beforeFinal?: (runId: string) => Promise<void>;
}
export function clusterEnding(eulogies: Eulogy[], profile: Profile) {
  const speakers = eulogies.filter((e) => e.speaks);
  const has = (roles: string[]) =>
    profile.relatives.some(
      (r) => roles.includes(r.relation) && speakers.some((e) => e.relative_id === r.id),
    );
  if (speakers.length >= 3 && speakers.reduce((s, e) => s + e.sentiment, 0) / speakers.length > 0.3)
    return 'reconciled';
  if (speakers.length <= 1) return 'estranged';
  if (has(['cofounder', 'friend']) && !has(['child', 'partner'])) return 'admired_not_loved';
  return 'mixed';
}
function startLife(profile: Profile, seed: number) {
  const rng = makeRng(seed);
  const death = deathAge(profile, rng);
  const actors = profile.relatives.map((r) => ({
    id: r.id,
    score: 45 + Math.floor(rng() * 24),
    emotion: { valence: 0, arousal: 0.4 },
    memories: [] as string[],
  }));
  return {
    rng,
    death,
    actors,
    wealth: 0,
    health: 0.8,
    decisions: [] as string[],
    cause: drawCause(profile, rng),
  };
}
type Life = ReturnType<typeof startLife>;
type Context = ReturnType<typeof chapterContext>;
function chapterContext(profile: Profile, seed: number, life: Life, index: number, priors: Priors) {
  const offset = [2, 5, 10, 20, 35][index];
  const age =
    offset === undefined ? life.death : Math.min(profile.age + offset, life.death - (5 - index));
  const shock = drawShock(life.rng, priors);
  return {
    profile,
    seed,
    chapter: index + 1,
    age,
    death_age: life.death,
    shock,
    scene: shockScenes[shock],
    firstChoices,
    causes,
    relative_history: life.actors,
    protagonist: { wealth: life.wealth, health: life.health, decisions_so_far: life.decisions },
  };
}
const episodes = [
  'There were two cups of tea on the kitchen table.',
  'The little blue chair by the door was empty.',
  'I still have the paper ticket from the last train.',
  'The telephone rang while the soup went cold.',
  'I kept the envelope with my name in pencil.',
  'The brass key was still under the flowerpot.',
];
function fallbackYear(ctx: Context, life: Life): Chapter {
  const { profile } = ctx;
  const choice = firstChoices[Math.floor(life.rng() * firstChoices.length)] ?? firstChoices[0];
  const present = choice !== firstChoices[1];
  const scene = ctx.scene + '.';
  const relative_states = profile.relatives.map((r, i) => {
    const actor = life.actors[i]!;
    const close = present !== (r.relation === 'cofounder');
    const delta = (close ? 7 : -10) + Math.round((life.rng() - 0.5) * 16);
    const relationship_score = clamp(actor.score + delta, 0, 100);
    const detail =
      episodes[(ctx.chapter + i + Math.floor(life.rng() * episodes.length)) % episodes.length];
    const memory_update =
      detail +
      ' ' +
      (close ? profile.name + ' stayed with me.' : 'I waited for ' + profile.name + ' until dark.');
    return {
      relative_id: r.id,
      relationship_score,
      emotion: {
        valence: clamp((relationship_score - 50) / 50, -1, 1),
        arousal: 0.2 + life.rng() * 0.7,
      },
      memory_update,
    };
  });
  const narrator = profile.relatives[(ctx.chapter - 1) % profile.relatives.length]!;
  const reply = profile.relatives.find((r) => r.id !== narrator.id)?.id ?? 'destiny';
  return {
    scene,
    decisions: [
      {
        actor: profile.id,
        action: choice,
        reason: present
          ? 'I can leave the phone in my coat for one evening.'
          : 'If I miss this call, I fear the opportunity will go.',
      },
    ],
    relative_states,
    private_messages: [
      {
        from: narrator.id,
        to: reply,
        text: relative_states.find((r) => r.relative_id === narrator.id)!.memory_update,
      },
    ],
    wealth: clamp(life.wealth + (present ? -0.08 : 0.16), -1, 1),
    health: clamp(life.health - 0.04, 0, 1),
    cause_of_death: life.cause,
    farewells: relative_states.map((s, i) => ({
      relative_id: s.relative_id,
      sentiment: s.emotion.valence,
      text:
        (life.actors[i]!.memories[0] ?? s.memory_update) +
        ' ' +
        (s.relationship_score >= 55
          ? 'When I think of us, that is the evening I return to.'
          : 'I carry that evening with me. I cannot read this aloud.'),
    })),
  };
}
export async function simulateRun(
  profile: Profile,
  seed: number,
  options: SimulationOptions = {},
): Promise<Run> {
  const id = profile.id + '-' + String(seed).padStart(4, '0');
  const life = startLife(profile, seed),
    priors = options.priors ?? defaultPriors;
  const reader = options.mock ? undefined : (options.read ?? configuredReader());
  const years: YearEvent[] = [];
  let eulogies: Eulogy[] = [];
  for (let index = 0; index < 6; index++) {
    if (index === 5) await options.beforeFinal?.(id);
    const context = chapterContext(profile, seed, life, index, priors);
    let chapter: Chapter | undefined;
    let reason: string | undefined;
    if (reader)
      for (let attempt = 0; attempt < 2 && !chapter; attempt++) {
        try {
          chapter = validateChapter(
            await reader(context, reason),
            profile,
            index,
            Object.fromEntries(life.actors.map((r) => [r.id, r.score])),
          );
        } catch (error) {
          reason = error instanceof Error ? error.message : 'Invalid chapter';
          await options.onVeto?.(id, index, reason);
        }
      }
    const generation = chapter ? 'claude' : reader ? 'fallback' : 'mock';
    chapter ??= fallbackYear(context, life);
    const year: YearEvent = {
      run_id: id,
      year_index: index,
      protagonist_age: context.age,
      shock: chapter.scene,
      shock_key: context.shock,
      shock_source: priors[context.shock].source_url ? 'telem' : 'destiny',
      source_url: priors[context.shock].source_url ?? undefined,
      generation,
      decisions: chapter.decisions,
      relative_states: chapter.relative_states,
      private_messages: chapter.private_messages,
    };
    years.push(year);
    await options.onYear?.(year);
    for (const actor of life.actors) {
      const state = chapter.relative_states.find((s) => s.relative_id === actor.id)!;
      actor.score = state.relationship_score;
      actor.emotion = state.emotion;
      actor.memories.push(state.memory_update);
    }
    life.wealth = chapter.wealth;
    life.health = chapter.health;
    life.decisions.push(...chapter.decisions.map((d) => d.action));
    if (index === 5) {
      life.cause = chapter.cause_of_death!;
      eulogies = chapter.farewells!.map((e) => ({
        ...e,
        run_id: id,
        speaks: life.actors.find((a) => a.id === e.relative_id)!.score >= 55,
      }));
    }
  }
  // Fisher–Yates uses the run seed, including for the offline screening.
  for (let i = eulogies.length - 1; i > 0; i--) {
    const j = Math.floor(life.rng() * (i + 1));
    [eulogies[i], eulogies[j]] = [eulogies[j]!, eulogies[i]!];
  }
  return RunSchema.parse({
    run_id: id,
    profile_id: profile.id,
    seed,
    death_age: life.death,
    cause_of_death: life.cause,
    years,
    eulogies,
    ending_cluster: clusterEnding(eulogies, profile),
  });
}
