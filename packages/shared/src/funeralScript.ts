import { makeRng } from './rng';
import type { Eulogy, Profile, Run } from './schemas';

export interface FuneralCue {
  id: string;
  relativeId?: string;
  text: string;
  speaks: boolean;
  kind: 'opening' | 'witness';
}

function opening(name: string, run: Run): string {
  const cause = run.cause_of_death.trim().replace(/[.!?]+$/, '');
  if (!cause) return `${name} died at ${run.death_age}.`;
  const phrase =
    cause === 'an accident'
      ? 'in an accident'
      : 'of ' + (['stroke', 'heart attack'].includes(cause) ? 'a ' : '') + cause;
  const age = run.death_age;
  const final = run.years.at(-1);
  if (final?.generation === 'scripted') {
    const line = `${name} died ${phrase} at ${age}.`;
    const scene = final.shock.trim();
    return /\bsurvived[.!]$/iu.test(scene) && words(scene).length <= 14 ? `${scene} ${line}` : line;
  }
  return [
    `${name} died ${phrase} at ${age}.`,
    `At ${age}, ${name} died ${phrase}.`,
    `We remember ${name}, who died ${phrase} at ${age}.`,
  ][Math.abs(run.seed) % 3]!;
}

// The original simulator has six recurring objects. Each reading requires the
// exact object AND the witness's recorded account of staying or waiting.
const oldScenes = new Map<string, (name: string, stayed: boolean) => string>([
  [
    'There were two cups of tea on the kitchen table.',
    (name, stayed) =>
      stayed
        ? `Two cups of tea on the kitchen table. ${name} stayed with me.`
        : `Two cups of tea on the kitchen table, and I waited for ${name} until dark.`,
  ],
  [
    'The little blue chair by the door was empty.',
    (name, stayed) =>
      stayed
        ? `That little blue chair by the door was empty. But you stayed with me, ${name}.`
        : `I waited for you until dark, ${name}. I remember the empty blue chair by the door.`,
  ],
  [
    'I still have the paper ticket from the last train.',
    (name, stayed) =>
      stayed
        ? `I still have the paper ticket from the last train. That was the evening you stayed with me.`
        : `I waited for ${name} until dark. I still have the paper ticket from the last train.`,
  ],
  [
    'The telephone rang while the soup went cold.',
    (name, stayed) =>
      stayed
        ? `The telephone rang and the soup went cold. What I remember is that ${name} stayed.`
        : `The telephone rang while the soup went cold. I was still waiting for you at nightfall.`,
  ],
  [
    'I kept the envelope with my name in pencil.',
    (name, stayed) =>
      stayed
        ? `My name was on the envelope in pencil. I kept it, and I remember that ${name} stayed.`
        : `I kept the envelope with my name in pencil. I waited for you until dark.`,
  ],
  [
    'The brass key was still under the flowerpot.',
    (name, stayed) =>
      stayed
        ? `I remember the brass key under the flowerpot, and ${name} staying with me.`
        : `The brass key was still under the flowerpot. I was there until dark, waiting for ${name}.`,
  ],
]);

// Older runs record these choices in the imperative. Use the past tense only
// when the protagonist actually took that choice in the witness's chapter.
const rememberedChoices = new Map([
  ['Take the late meeting', 'took the late meeting'],
  ['Protect one evening at home', 'kept one evening free at home'],
  ['Ask for help', 'asked for help'],
]);

const sentenceBreaks = new Intl.Segmenter('en', { granularity: 'sentence' });
const words = (line: string) => line.trim().split(/\s+/u);
function fragments(text: string): string[] {
  return [...sentenceBreaks.segment(text.trim())].flatMap(({ segment }) => {
    const line = segment.trim();
    const clauses =
      words(line).length > 28 ? line.split(/\s*[;—]\s*|,\s+(?=and I |but I )/u) : [line];
    return clauses.filter(Boolean).map((clause) => {
      if (words(clause).length > 28) return words(clause).slice(0, 28).join(' ') + '…';
      return /[.!?…]["”’']?$/u.test(clause) ? clause : clause + '.';
    });
  });
}

const commonWords = new Set(
  'about after again came could from have just once only same that them then there they this time very what when will with would your years'.split(
    ' ',
  ),
);
function details(line: string): Set<string> {
  return new Set(
    (line.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
      (word) => (word.length >= 4 || /^\d+$/u.test(word)) && !commonWords.has(word),
    ),
  );
}
function overlap(a: string, b: string): number {
  const bWords = details(b);
  return [...details(a)].filter((word) => bWords.has(word)).length;
}

function spokenFarewell(
  profile: Profile,
  run: Run,
  eulogy: Eulogy,
  used: Set<string>,
  random: () => number,
): string {
  const id = eulogy.relative_id;
  const farewell = eulogy.text.trim();
  if (run.years.at(-1)?.generation === 'scripted') return farewell;
  const memories = run.years.flatMap((year) =>
    year.relative_states
      .filter((state) => state.relative_id === id && state.memory_update.trim())
      .map((state) => ({ year, text: state.memory_update.trim() })),
  );
  if (
    /(?:When I think of us, that is the evening I return to\.|I carry that evening with me\. I cannot read this aloud\.)$/u.test(
      farewell,
    )
  ) {
    const cadence = (Math.abs(run.seed) + run.eulogies.indexOf(eulogy)) % 4;
    const readings = memories.flatMap(({ year, text: memory }) => {
      const stayed = memory.endsWith(` ${profile.name} stayed with me.`);
      const ending = stayed
        ? ` ${profile.name} stayed with me.`
        : ` I waited for ${profile.name} until dark.`;
      if (!memory.endsWith(ending)) return [];
      const image = memory.slice(0, -ending.length);
      const read = oldScenes.get(image);
      if (!read) return [];
      const decision = year.decisions.find((item) => item.actor === profile.id);
      const choice = decision && rememberedChoices.get(decision.action);
      let text = read(profile.name, stayed);
      if (cadence && choice) {
        const age = year.protagonist_age;
        text =
          cadence % 2 === 0
            ? `At ${age}, ${profile.name} ${choice}. ${image}`
            : `You were ${age} when you ${choice}. ${image}`;
      }
      const rank =
        (used.has(image) ? 0 : 8) +
        (used.has(ending) ? 0 : 3) +
        (!cadence && farewell.startsWith(memory) ? 2 : 0) +
        random();
      return [{ image, ending, text, rank }];
    });
    const best = readings.sort((a, b) => b.rank - a.rank)[0];
    if (best) {
      used.add(best.image);
      used.add(best.ending);
      return best.text;
    }
  }

  // An authored farewell keeps its own voice. Find an episode belonging to
  // this speaker; for historical records without memories use their own reason.
  const lines = fragments(farewell);
  const records = memories.length
    ? memories.map((memory) => memory.text)
    : run.years.flatMap((year) =>
        year.decisions
          .filter((decision) => decision.actor === id)
          .map((decision) => decision.reason.trim() || decision.action),
      );
  const anchors = [...new Set(records.flatMap(fragments))];
  if (!anchors.length)
    return lines
      .slice(0, 2)
      .filter((line, index) => index === 0 || words(lines[0]! + ' ' + line).length <= 32)
      .join(' ');
  const candidates = anchors.map((anchor) => ({
    anchor,
    rank:
      (lines.includes(anchor) ? 20 : 0) +
      Math.max(0, ...lines.map((line) => overlap(line, anchor))) +
      (used.has(anchor) ? -8 : 0) +
      random(),
  }));
  const { anchor } = candidates.sort((a, b) => b.rank - a.rank)[0]!;
  used.add(anchor);
  if (
    lines.length <= 2 &&
    words(farewell).length <= 32 &&
    lines.some((line) => line === anchor || overlap(line, anchor) >= 2)
  )
    return farewell;
  const continuation = lines
    .flatMap((line) => {
      if (words(line).length <= 18) return [line];
      const thought = line.split(/,\s+(?:and|but)\s+I\b/u)[0]!;
      return thought === line ? [] : fragments(thought);
    })
    .filter((line) => /\b(I|my|we|our|you)\b/iu.test(line))
    .filter((line) => line !== anchor && words(anchor + ' ' + line).length <= 32)
    .map((line, index) => ({
      line,
      rank: overlap(anchor, line) + (index + 1) / (lines.length + 1),
    }))
    .sort((a, b) => b.rank - a.rank)[0]?.line;
  return continuation ? `${anchor} ${continuation}` : anchor;
}

export function buildFuneralScript(profile: Profile, run: Run): FuneralCue[] {
  const used = new Set<string>();
  const random = makeRng(run.seed);
  return [
    { id: 'destiny-opening', kind: 'opening', text: opening(profile.name, run), speaks: true },
    ...run.eulogies.map((eulogy): FuneralCue => ({
      id: 'witness-' + eulogy.relative_id,
      kind: 'witness',
      relativeId: eulogy.relative_id,
      speaks: eulogy.speaks,
      text: eulogy.speaks ? spokenFarewell(profile, run, eulogy, used, random) : '',
    })),
  ];
}
