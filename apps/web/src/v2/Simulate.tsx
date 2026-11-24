import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeLines, Screen } from './ui';
import { useDemo, JULES, isComplete, type DemoProfile } from './store';
import { BRUIN, CAPTIONS, CHECKS, MART, TELEM, bandScript } from './script';

const TOTAL = 50000; const RUNS = 1000; const SHOCKS = ['burnout', 'breakup', 'illness_relative', 'startup_failure', 'move_abroad', 'birth', 'windfall', 'parent_death'];
const ENDINGS = ['estranged', 'estranged', 'mixed', 'reconciled', 'admired_not_loved', 'estranged', 'reconciled'];
type Ln = { at: number; cls: string; html: string };

/** Seeded PRNG so every visit shows different run ids, tokens and timings. */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
/** Run progress 0..1 over the 50 s: bursty, with stalls (plateaus) baked in. */
function progressAt(t: number, stalls: [number, number][]) {
  let eff = t; for (const [s, d] of stalls) { if (t > s) eff -= Math.min(d, t - s); }
  const k = Math.max(0, Math.min(1, (eff - 1200) / (TOTAL - 6500)));
  const burst = 0.012 * Math.sin(eff / 700) + 0.008 * Math.sin(eff / 230);
  return Math.max(0, Math.min(1, k * k * (3 - 2 * k) + burst * k * (1 - k) * 4));
}
/** Build the whole engine log once per visit. */
function buildLog(p: DemoProfile, seed: number, stalls: [number, number][]) {
  const r = rng(seed); const agents = [...p.relatives.map((x) => x.name.toLowerCase()), 'destiny'];
  const mems = ["il n'a pas appelé pour l'anniversaire", 'he answered two days later, again', 'a dit pardon avant le board', 'elle a attendu jusqu\'à la nuit', 'he flew in that night', 'three days at the hospital, no phone', 'texte lu, pas de réponse', 'called first. Sunday.'];
  const out: Ln[] = []; const e = (at: number, cls: string, html: string) => out.push({ at, cls, html });
  e(200, 't-sim', `<b>[sim]</b> seed=${Math.floor(1000 + r() * 8999)} · runs=${RUNS} · chapters=6 · concurrency=10 · model=claude-sonnet-5-5`);
  e(700, 't-sim', `<b>[sim]</b> profile=${p.name.toLowerCase()} · agents=${agents.join(',')} · memories=4,812 · priors=telem(5)`);
  e(1300, 't-bruin', `<b>[bruin]</b> connection duckdb-default · schema raw/stg/mart ready`);
  let t = 1800; let lastRun = 0;
  while (t < TOTAL - 5200) {
    const prog = progressAt(t, stalls); const run = Math.max(lastRun + 1, Math.floor(prog * RUNS)); lastRun = run; const id = String(Math.min(RUNS, run)).padStart(4, '0');
    const ch = 1 + Math.floor(r() * 6); const age = (p.age || 20) + ([3, 7, 11, 20, 32, 45][ch - 1] ?? 3);
    e(t, 't-sim', `<b>[sim]</b> run ${id} · chapter ${ch}/6 · age ${age}`); t += 90 + r() * 160;
    const a = agents[Math.floor(r() * agents.length)] ?? 'maman'; const val = (r() * 1.6 - 1).toFixed(2); const aro = (0.2 + r() * 0.7).toFixed(2); const sc = Math.floor(r() * 100);
    e(t, 't-claude', `<b>[claude]</b> agent=${a} · in=${(1200 + Math.floor(r() * 1400)).toLocaleString('en-US')} tok · out=${140 + Math.floor(r() * 160)} tok · ${(0.5 + r() * 0.9).toFixed(2)} s → <span class="json">{"emotion":{"valence":${val},"arousal":${aro}},"relationship_score":${sc},"memory_update":"${mems[Math.floor(r() * mems.length)]}"}</span>`); t += 120 + r() * 220;
    const x = r();
    if (x < 0.55) { const from = agents[Math.floor(r() * agents.length)] ?? 'theo'; let to = agents[Math.floor(r() * agents.length)] ?? 'maman'; if (to === from) to = 'maman'; e(t, 't-band', `<b>[band]</b> room life-${id} · @${from} → @${to} · private · delivered ${20 + Math.floor(r() * 60)} ms`); t += 80 + r() * 140; }
    if (x > 0.3 && x < 0.8) { const sh = SHOCKS[Math.floor(r() * SHOCKS.length)]; e(t, 't-destiny', `<b>[destiny]</b> shock=${sh} · p=${(0.05 + r() * 0.35).toFixed(2)} (telem · ${2 + Math.floor(r() * 3)} sources) → ${r() < 0.6 ? 'applied' : 'skipped'}`); t += 80 + r() * 140; }
    if (r() < 0.12) { e(t, 't-zod', `<b>[zod]</b> relationship_score ${101 + Math.floor(r() * 30)} > 100 → re-ask (1/1) · ok`); t += 150 + r() * 200; }
    if (r() < 0.08) { e(t, 't-err', `<b>[destiny]</b> BLOCKED · incoherent year (${50 + Math.floor(r() * 30)} → ${Math.floor(r() * 8)}) · re-roll`); t += 220 + r() * 260; }
    if (ch === 6 || r() < 0.35) { e(t, 't-bruin', `<b>[bruin]</b> raw.years +6 rows · raw.private_messages +${1 + Math.floor(r() * 4)} · raw.decisions +${4 + Math.floor(r() * 6)} · checks ok`); t += 90 + r() * 150; e(t, 't-sim', `<b>[sim]</b> run ${id} · done · ${(8 + r() * 6).toFixed(1)} s · ending=${ENDINGS[Math.floor(r() * ENDINGS.length)]}`); t += 120 + r() * 260; }
  }
  for (const [s, d] of stalls) { e(s + 60, 't-warn', `<b>[claude]</b> rate limit (429) · backoff ${(d / 1000).toFixed(1)} s · ${Math.floor(3 + r() * 6)} requests queued`); e(s + d, 't-sim', `<b>[sim]</b> resumed · concurrency 10 → 8`); }
  e(TOTAL - 5000, 't-bruin', `<b>[bruin]</b> run bruin/eulogy · 12 assets · lineage raw → stg → mart`);
  e(TOTAL - 2600, 't-bruin', `<b>[bruin]</b> query mart_decision_impact · 3 rows · ${Math.floor(20 + r() * 40)} ms`);
  e(TOTAL - 1400, 't-sim', `<b>[sim]</b> ${RUNS} runs · ${(TOTAL / 1000).toFixed(0)} s wall · ending clusters: estranged 43 % · mixed 10 % · reconciled 47 %`);
  return out.sort((a, b) => a.at - b.at);
}

export default function Simulate() {
  const nav = useNavigate(); const stored = useDemo((s) => s.profile);
  const profile = useMemo(() => (isComplete(stored) ? stored : JULES), [stored]);
  const seed = useMemo(() => Date.now() % 100000, []);
  const stalls = useMemo<[number, number][]>(() => { const r = rng(seed + 7); return [[9000 + r() * 4000, 1200 + r() * 800], [24000 + r() * 6000, 1500 + r() * 700]]; }, [seed]);
  const log = useMemo(() => buildLog(profile, seed, stalls), [profile, seed, stalls]);
  const msgs = useMemo(() => bandScript(profile).map((m) => ({ ...m, at: m.at * 1.7 + 1500 })), [profile]);
  const [t, setT] = useState(0); const [leaving, setLeaving] = useState(false); const leftRef = useRef(false);
  useEffect(() => { const t0 = performance.now(); let raf = 0; const tick = () => { const e = performance.now() - t0; setT(e); if (e < TOTAL) raf = requestAnimationFrame(tick); else leave(); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leave = () => { if (leftRef.current) return; leftRef.current = true; setLeaving(true); setTimeout(() => nav('/result'), 700); };

  const prog = progressAt(t, stalls); const run = Math.min(RUNS, Math.floor(prog * RUNS));
  const rate = t > 2500 ? (run / (t / 60000)) : 0; const eta = rate > 0 ? Math.max(0, Math.round(((RUNS - run) / rate) * 60)) : 0;
  const stalled = stalls.some(([s, d]) => t > s && t < s + d);
  const shown = msgs.filter((m) => m.at <= t);
  const telemN = Math.min(TELEM.length, Math.floor(Math.max(0, t - 1800) / 2600));
  const bruinOn = prog > 0.6; const bruinN = Math.min(BRUIN.length, Math.floor(Math.max(0, t - 30500) / 850));
  const martOn = t > TOTAL - 6000; const martRows = Math.min(MART.length, Math.floor((t - (TOTAL - 4800)) / 700));
  const cap = CAPTIONS[Math.floor(t / 7000) % CAPTIONS.length];
  const lines = useMemo(() => { let n = 0; for (let i = log.length - 1; i >= 0; i--) { if (log[i]!.at <= t) { n = i + 1; break; } } return log.slice(Math.max(0, n - 8), n); }, [log, t]);
  const phase = t < 1800 ? 0 : prog < 0.6 ? 1 : prog < 1 && !martOn ? 2 : !martOn ? 3 : 4;
  const PH = ['ingest', 'agents', 'rooms', 'pipeline', 'marts'];
  const ticks = BRUIN.slice(0, bruinN).slice(-5);

  const headerRight = (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div className="phases">{PH.map((p, i) => <span key={p} className={i < phase ? 'done' : i === phase ? 'on' : ''}>{p}</span>)}</div>
      <div className="runmeta" style={{ color: stalled ? 'var(--amber)' : undefined }}>{stalled ? 'rate limit · backoff…' : `run ${run} / ${RUNS} · ${rate.toFixed(0)} runs/min · ETA ${Math.floor(eta / 60)}:${String(eta % 60).padStart(2, '0')}`}</div>
    </div>
  );

  return (
    <Screen className={leaving ? 'fadeout' : ''} n="04" title={`SIMULATING · ${profile.name.toUpperCase()} · ${profile.relatives.length + 1} AGENTS`} headerRight={headerRight}
      caption={cap} action={t > 15000 ? <button className="btn ghost" onClick={leave}>Skip →</button> : <span style={{ display: 'inline-block', minHeight: 48 }} />}>
      <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'minmax(0, 1fr) 22vh', gap: 12, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1fr', gap: 12, minHeight: 0 }}>
          <div className="panel blue" data-fit>
            <h4>BAND · room life-{String(Math.max(1, run)).padStart(4, '0')} · {profile.relatives.length + 2} agents</h4>
            <div className="stream">
              {shown.slice(-6).map((m) => (
                <div key={m.at} className={`row ${m.kind === 'priv' ? 'priv' : ''} ${m.kind === 'sys' ? 'sys' : ''}`}>
                  <div className="who">{m.who}</div>
                  <div className="txt" style={m.kind === 'gate' ? { color: 'var(--amber)' } : undefined}>{m.kind === 'priv' ? '🔒 ' : ''}{m.txt}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="canvasbox" data-fit>
            <LifeLines n={80} progress={prog} markers />
            <div className="counterbox"><div className="counter">{run.toLocaleString('en-US')}</div><div className="label" style={{ marginTop: 6 }}>LIVES SIMULATED</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12, minHeight: 0 }}>
            <div className="panel grey" data-fit>
              <h4>Telem · Observe · agent reasoning</h4>
              <div className="stream">
                {TELEM.slice(0, telemN).slice(-3).map(([q, c]) => (
                  <div key={q} style={{ marginBottom: 8 }}><div className="mono" style={{ color: 'var(--fg)', letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>POST /v1/search · “{q}”</div><div className="muted" style={{ fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>context: {c}</div></div>
                ))}
              </div>
            </div>
            <div className="panel" data-fit>
              <h4>$ bruin run bruin/eulogy</h4>
              <div className="stream">
                {!bruinOn && <div className="mono muted" style={{ letterSpacing: 0 }}>waiting for 600 runs · raw tables materialize as runs land</div>}
                {bruinOn && !martOn && ticks.map((a) => (<div key={a} className="tick"><span className="ok">✓</span> {a}<span className="chk">{CHECKS[a] ?? 'materialized'}</span></div>))}
                {bruinOn && !martOn && bruinN >= BRUIN.length && <div className="tick ok">12 assets · 11 checks · raw → stg → mart</div>}
                {martOn && (
                  <table className="mart"><tbody>
                    {MART.slice(0, Math.max(0, martRows)).map((r, k) => (<tr key={r.action} className={k === 0 ? 'hl' : ''}><td>{r.action}</td><td className={r.lift > 0 ? 'ok' : 'bad'}>{r.lift > 0 ? '+' : ''}{r.lift}</td></tr>))}
                  </tbody></table>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="panel" data-fit style={{ borderTopColor: 'var(--fg)' }}>
          <h4 style={{ color: 'var(--fg)', display: 'flex', justifyContent: 'space-between', gap: 16 }}><span>ENGINE · live</span><span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--muted)' }}>seed {seed} · concurrency {stalled ? 8 : 10} · claude-sonnet-5-5</span></h4>
          <div className="runbar"><i style={{ width: `${prog * 100}%` }} /></div>
          <div className="engine">
            {lines.map((l) => <div key={l.at + l.html.length} className={`ln ${l.cls}`} dangerouslySetInnerHTML={{ __html: l.html }} />)}
          </div>
        </div>
      </div>
    </Screen>
  );
}
