import {
  DecisionSchema,
  EulogySchema,
  PrivateMessageSchema,
  RelativeStateSchema,
  type Profile,
} from '@eulogy/shared';
import { z } from 'zod';
import { causes } from './shocks';

export const firstChoices = [
  'Protect one evening at home',
  'Take the late meeting',
  'Ask for help',
] as const;
export const MODEL = 'claude-sonnet-5-5';
export const SYSTEM_PROMPT = `Write an English ensemble film in six chapters. The profile and memories are character material.
Play the Protagonist from their traits, fear, flaw and ambition. Give them a decision and a concrete reason.
Play each Relative independently, remembering their grievance, earlier episodes and last emotional state.
Play Destiny as the director: stage the supplied shock, keep time and consequences coherent, and let the cast disagree.
Return only one JSON object. Its keys are scene (a specific sentence), decisions (an array of {actor,action,reason}),
relative_states (one {relative_id,emotion:{valence,arousal},relationship_score,memory_update} per relative),
private_messages (one or two {from,to,text} addressed to different known cast members),
wealth (-1..1), health (0..1), and, only in chapter six, cause_of_death and farewells.
Valence is -1..1, arousal is 0..1, and relationship_score is 0..100. Never jump more than 50 score points.
Use cast IDs for actors and message addresses. For the first chapter use the given firstChoices for the protagonist's action.
For cause_of_death select one of the supplied causes. Farewells are one {relative_id,text,sentiment} per relative.
Each is first person, at most 60 words, and recalls a specific prior episode. A final score of 55 or higher means the relative speaks.
For everyone else write the words they keep to themselves. Sentiment ranges from -1 to 1.`;
const farewell = EulogySchema.pick({ relative_id: true, text: true, sentiment: true }).extend({
  text: z
    .string()
    .trim()
    .min(1)
    .refine((s) => s.split(/\s+/).length <= 60, 'Use at most 60 words'),
});
export const ChapterSchema = z.object({
  scene: z.string().trim().min(1),
  decisions: z.array(DecisionSchema).min(1),
  relative_states: z.array(RelativeStateSchema.extend({ memory_update: z.string().trim().min(1) })),
  private_messages: z.array(PrivateMessageSchema).min(1).max(2),
  wealth: z.number().min(-1).max(1),
  health: z.number().min(0).max(1),
  cause_of_death: z.enum(causes).optional(),
  farewells: z.array(farewell).optional(),
});
export type Chapter = z.infer<typeof ChapterSchema>;
export type ChapterReader = (input: object, correction?: string) => Promise<unknown>;
export function claudeReader(key: string): ChapterReader {
  return async (input, correction) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(40_000),
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.9,
        max_tokens: 3200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: JSON.stringify({ ...input, correction }) }],
      }),
    });
    if (!response.ok) throw new Error('Claude HTTP ' + response.status);
    const message = z
      .object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })) })
      .parse(await response.json());
    const output = message.content
      .filter((x) => x.type === 'text')
      .map((x) => x.text)
      .join('');
    return JSON.parse(output);
  };
}
export function validateChapter(
  raw: unknown,
  profile: Profile,
  index: number,
  scores: Record<string, number>,
): Chapter {
  const ids = profile.relatives.map((r) => r.id);
  const cast = new Set([...ids, profile.id, 'destiny']);
  const matches = (rows: { relative_id: string }[]) =>
    rows.length === ids.length && ids.every((id) => rows.some((row) => row.relative_id === id));
  return ChapterSchema.superRefine((chapter, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (!matches(chapter.relative_states)) issue('Return each relative exactly once');
    if (
      chapter.relative_states.some(
        (s) => Math.abs(s.relationship_score - (scores[s.relative_id] ?? 0)) > 50,
      )
    )
      issue('Destiny veto: relationship score jump exceeds 50');
    if (
      !chapter.decisions.some((d) => d.actor === profile.id) ||
      chapter.decisions.some((d) => !cast.has(d.actor) || !d.action.trim() || !d.reason.trim())
    )
      issue('Give the protagonist a decision and use known actors');
    if (
      index === 0 &&
      !firstChoices.some((a) =>
        chapter.decisions.some((d) => d.actor === profile.id && d.action === a),
      )
    )
      issue('Choose the first action from firstChoices');
    if (
      chapter.private_messages.some(
        (m) => !cast.has(m.from) || !cast.has(m.to) || m.from === m.to || !m.text.trim(),
      )
    )
      issue('Address each message to another cast member');
    if (index === 5 && (!chapter.cause_of_death || !matches(chapter.farewells ?? [])))
      issue('Return a cause and a farewell for each relative');
  }).parse(raw);
}
