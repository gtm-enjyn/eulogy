import type { DemoProfile, Relation, Relative } from './store';

const REL: [RegExp, Relation][] = [
  [/\b(mom|mother|maman|mum)\b/i, 'mother'], [/\b(dad|father|papa)\b/i, 'father'], [/\bsister\b/i, 'sister'], [/\bbrother\b/i, 'brother'],
  [/\b(girlfriend|boyfriend|wife|husband|partner)\b/i, 'partner'], [/\bco-?founder\b/i, 'cofounder'], [/\b(best friend|friend|roommate)\b/i, 'friend'],
  [/\b(daughter|son|kid)\b/i, 'child'],
];
const STOP = new Set(['I', 'My', 'The', 'And', 'But', 'She', 'He', 'They', 'We', 'In', 'At', 'On', 'So', 'Then', 'Also', 'Her', 'His', 'Computer', 'Science', 'Paris', 'Chicago', 'London', 'Berlin', 'New', 'York', 'San', 'Francisco', 'Monday', 'Sunday', 'Tennis', 'Startup', 'University', 'France', 'America', 'Thanksgiving']);
const CITY = /\b(?:in|from|live in|living in|based in|moved to)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/;

/** Light heuristic extraction from a running transcript. Good enough for a live card panel. */
export function extract(t: string, prev: DemoProfile): DemoProfile {
  const text = t.replace(/\s+/g, ' ').trim();
  const out: DemoProfile = { ...prev, relatives: [...prev.relatives], flaws: [...prev.flaws] };
  const nm = text.match(/\b(?:my name is|I am|I'm|this is|call me)\s+([A-Z][a-zA-Z\-éèï]+)/) ?? text.match(/^([A-Z][a-zA-Z\-éèï]+)\b/);
  const nmv = nm?.[1]; if (nmv && !STOP.has(nmv) && !out.name) out.name = nmv;
  const age = text.match(/\b(?:I am|I'm|aged|age)\s+(\d{2})\b/) ?? text.match(/\b(\d{2})\s*(?:years? old|yo)\b/);
  const agev = age?.[1]; if (agev && !out.age) out.age = Number(agev);
  const cityv = text.match(CITY)?.[1]; if (cityv && !out.city && !/^(?:My|The)$/.test(cityv)) out.city = cityv;
  const act = text.match(/\b(?:I (?:study|work|do|build|am building|run|play|code)[^.?!]*)/i); if (act && !out.activity) out.activity = act[0].slice(0, 110);
  // relatives: "my sister Inès, 16" / "Inès, my sister, she's 16" / "my father, we haven't spoken"
  const sentences = text.split(/(?<=[.?!])\s+|,\s+(?=my |and my )/i);
  for (const s of sentences) {
    const rel = REL.find(([re]) => re.test(s)); if (!rel) continue;
    const names = [...s.matchAll(/\b([A-Z][a-zA-Zéèï-]{2,})\b/g)].map((m) => m[1] ?? '').filter((n) => n && !STOP.has(n) && n !== out.name);
    const ageM = s.match(/\b(\d{2})\b/)?.[1];
    const name = names[0] ?? ({ mother: 'Maman', father: 'Papa', sister: 'Sister', brother: 'Brother', partner: 'Partner', friend: 'Friend', cofounder: 'Cofounder', child: 'Kid', other: 'Someone' } as Record<Relation, string>)[rel[1]];
    const existing = out.relatives.find((r) => r.name === name || (r.relation === rel[1] && !names[0]));
    const state = s.replace(/^(and |my )/i, '').slice(0, 90);
    const r: Relative = { name, relation: rel[1], age: ageM ? Number(ageM) : existing?.age, state: /(we|he|she|haven|never|talk|speak|call)/i.test(s) ? state : existing?.state };
    if (existing) Object.assign(existing, r); else if (out.relatives.length < 6) out.relatives.push(r);
  }
  const flawM = text.match(/\b(?:I (?:am|get|lose|never|always|forget|don't|can't)[^.?!]{3,60})/gi);
  if (flawM) for (const f of flawM) { const c = f.replace(/^I /, '').trim(); if (!out.flaws.includes(c) && out.flaws.length < 4 && /temper|angry|late|sorry|apolog|listen|call|forget|ego|selfish|work|busy/i.test(c)) out.flaws.push(c.charAt(0).toUpperCase() + c.slice(1)); }
  const fear = text.match(/\b(?:my (?:biggest )?fear is|I(?:'m| am) (?:scared|afraid) (?:of|that)|ending up)[^.?!]*/i); if (fear) out.fear = fear[0].slice(0, 120);
  return out;
}
