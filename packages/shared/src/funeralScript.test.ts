import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildFuneralScript } from './funeralScript';
import { sampleProfile, sampleRun } from './sample';
import { ProfileSchema, RunSchema, type Run } from './schemas';

const data = (path: string) =>
  readFileSync(new URL('../../../data/' + path, import.meta.url), 'utf8');
const louis = ProfileSchema.parse(JSON.parse(data('profiles/louis.json')));
const archive = data('runs/louis-demo.jsonl')
  .trim()
  .split('\n')
  .map((line) => RunSchema.parse(JSON.parse(line)));
const jules = ProfileSchema.parse(JSON.parse(data('profiles/jules.json')));
const scenarios = RunSchema.array().parse(JSON.parse(data('screenings/jules.json')).runs);

describe('the words heard at the funeral', () => {
  it('keeps the archived order, speech eligibility and cause across all thirty Louis screenings', () => {
    const before = JSON.stringify(archive);
    const readings = new Set<string>();
    for (const run of archive) {
      const [opening, ...witnesses] = buildFuneralScript(louis, run);
      expect(opening).toMatchObject({ id: 'destiny-opening', kind: 'opening', speaks: true });
      expect(opening!.text).toContain(louis.name);
      expect(opening!.text).toContain(String(run.death_age));
      expect(opening!.text).toContain(run.cause_of_death);
      expect(witnesses.map((cue) => [cue.relativeId, cue.speaks])).toEqual(
        run.eulogies.map((eulogy) => [eulogy.relative_id, eulogy.speaks]),
      );
      const spoken = witnesses.filter((cue) => cue.speaks);
      spoken.forEach((cue) => readings.add(cue.text));
      expect(new Set(spoken.map((cue) => cue.text)).size).toBe(spoken.length);
      for (const cue of witnesses) {
        if (!cue.speaks) {
          expect(cue.text).toBe('');
          continue;
        }
        const object = ['tea', 'chair', 'ticket', 'telephone', 'envelope', 'key'].find((word) =>
          cue.text.toLowerCase().includes(word),
        );
        const remembered = /wait(?:ed|ing)/iu.test(cue.text)
          ? 'I waited for Louis'
          : 'Louis stayed with me';
        expect(object).toBeDefined();
        const age = /^(?:At |You were )(\d+)/u.exec(cue.text)?.[1];
        if (age) {
          const year = run.years.find((entry) => entry.protagonist_age === Number(age))!;
          const decision = year.decisions.find((entry) => entry.actor === louis.id)!.action;
          const choice = {
            'Take the late meeting': 'took the late meeting',
            'Ask for help': 'asked for help',
            'Protect one evening at home': 'kept one evening free at home',
          }[decision];
          expect(cue.text).toContain(choice);
          expect(
            year.relative_states.find((state) => state.relative_id === cue.relativeId)!
              .memory_update,
          ).toContain(object);
          continue;
        }
        expect(
          run.years.some((year) =>
            year.relative_states.some(
              (state) =>
                state.relative_id === cue.relativeId &&
                state.memory_update.includes(object!) &&
                state.memory_update.includes(remembered),
            ),
          ),
        ).toBe(true);
      }
    }
    expect(readings.size).toBeGreaterThan(40);
    expect(JSON.stringify(archive)).toBe(before);
    const replay: Run = JSON.parse(before)[0];
    replay.years.forEach((year) => delete year.generation);
    expect(buildFuneralScript(louis, replay)).toEqual(buildFuneralScript(louis, archive[0]!));
    expect(buildFuneralScript(louis, replay)[0]!.text).toBe('At 90, Louis died in an accident.');
  });

  it('reads the two scripted Jules endings verbatim, including the surviving neighbor only where recorded', () => {
    const [fire, hospital] = scenarios;
    expect(buildFuneralScript(jules, fire!)[0]!.text).toBe(
      'The neighbor Jules carried out of the fire survived. Jules died of smoke inhalation at 46.',
    );
    expect(buildFuneralScript(jules, hospital!)[0]!.text).toBe(
      'Jules died of heart failure at 58.',
    );
    for (const run of scenarios) {
      expect(buildFuneralScript(jules, run).slice(1)).toEqual(
        run.eulogies.map((farewell) => ({
          id: 'witness-' + farewell.relative_id,
          relativeId: farewell.relative_id,
          kind: 'witness',
          speaks: farewell.speaks,
          text: farewell.speaks ? farewell.text : '',
        })),
      );
    }
    expect(
      buildFuneralScript(jules, hospital!)
        .filter((cue) => cue.kind === 'witness' && cue.speaks)
        .map((cue) => cue.relativeId),
    ).toEqual(['ines']);
  });

  it('retains a short model-authored farewell grounded in the same witness’s memory', () => {
    const run = structuredClone(sampleRun);
    const farewell = run.eulogies.find((e) => e.relative_id === 'jules')!;
    farewell.text = 'I still carry the cracked compass. You let me steer.';
    run.years.forEach((year) => {
      year.generation = 'claude';
      year.relative_states.find((state) => state.relative_id === 'jules')!.memory_update =
        'The cracked compass was in my coat.';
    });
    expect(
      buildFuneralScript(sampleProfile, run).find((cue) => cue.relativeId === 'jules')?.text,
    ).toBe(farewell.text);
    expect(
      buildFuneralScript(sampleProfile, sampleRun).find((cue) => cue.relativeId === 'lea')?.text,
    ).toBe('');
  });

  it('uses only the named witness’s own decision when an older archive has no memory for them', () => {
    const run = structuredClone(sampleRun);
    for (const year of run.years) {
      delete year.generation;
      year.relative_states = [];
      year.decisions = [
        { actor: 'jules', action: 'Leave at six', reason: 'I wanted to make the last ferry.' },
        { actor: 'anne', action: 'Open a drawer', reason: 'There was a red scarf in the drawer.' },
      ];
    }
    const script = buildFuneralScript({ ...sampleProfile, name: 'Robin' }, run);
    expect(script[0]!.text).toContain('Robin');
    expect(script.find((cue) => cue.relativeId === 'jules')!.text).toContain(
      'I wanted to make the last ferry.',
    );
    expect(script.find((cue) => cue.relativeId === 'jules')!.text).not.toContain('scarf');
    expect(script.find((cue) => cue.relativeId === 'anne')!.text).toContain(
      'There was a red scarf in the drawer.',
    );
  });
});
