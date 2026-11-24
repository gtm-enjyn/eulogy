import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Caption, Corner, Look, Step, useCountUp } from './ui';
import { useDemo, JULES, isComplete, focusRelative, callRelative } from './store';
import { MART, ledgers } from './script';

interface Marts { outcome_distribution?: { pct_child_speaks?: number; n_runs?: number; clusters?: Record<string, number> }[] }
export default function Result() {
  const nav = useNavigate(); const stored = useDemo((s) => s.profile); const portraits = useDemo((s) => s.portraits);
  const p = useMemo(() => (isComplete(stored) ? stored : JULES), [stored]);
  const f = focusRelative(p); const c = callRelative(p); const L = ledgers(p);
  const [pct, setPct] = useState(43); const [n, setN] = useState(30);
  const [phase, setPhase] = useState<'number' | 'table'>('number'); const [life, setLife] = useState<1 | 2>(1); const [toast, setToast] = useState(''); const [how, setHow] = useState(false);
  useEffect(() => { fetch('/data/marts.json').then((r) => r.json()).then((m: Marts) => { const o = m.outcome_distribution?.[0]; if (o?.pct_child_speaks != null) setPct(Math.round(100 - o.pct_child_speaks)); if (o?.n_runs) setN(o.n_runs); }).catch(() => undefined); }, []);
  useEffect(() => { const id = setTimeout(() => setPhase('table'), 6500); return () => clearTimeout(id); }, []);
  const shown = useCountUp(pct, 2200);
  const seats = useMemo(() => {
    const names = [p.relatives[0]?.name, f?.name, p.relatives[2]?.name, c?.name, 'Partner', 'Kid 1', 'Kid 2', 'Theo\'s kids'].map((x, i) => x ?? `Guest ${i + 1}`);
    const missing1 = new Set([f?.name, c?.name, 'Kid 1', 'Kid 2', 'Theo\'s kids']);
    return names.map((name) => ({ name, on1: !missing1.has(name) }));
  }, [p, f, c]);
  const pos = [[18, 22], [38, 14], [62, 14], [82, 22], [86, 78], [62, 86], [38, 86], [14, 78]];
  const full = life === 2; const count = full ? 9 : seats.filter((s) => s.on1).length + 1;
  const remind = () => { try { localStorage.setItem('eulogy.reminder', JSON.stringify({ who: c?.name, at: 'Sunday 18:00' })); } catch { /* ignore */ } setToast(`Sunday 6 pm · call ${c?.name ?? 'them'}. Saved.`); setTimeout(() => setToast(''), 2600); };

  if (phase === 'number') return (
    <div className="scene black bars"><Step i={4} />
      <div className="center"><div className="stack" style={{ gap: 10 }}>
        <div className="display h2">In <span className="amber" style={{ fontVariantNumeric: 'tabular-nums' }}>{shown} %</span> of your lives,</div>
        <div className="display h2" style={{ opacity: shown >= pct ? 1 : 0, transition: 'opacity .8s' }}>{f?.name ?? 'her'}'s chair is empty.</div>
      </div></div>
      <Caption>mart_outcome_distribution · Bruin → DuckDB · {n} runs · a relative sits at the table at 70 only if relationship_score ≥ 55 in the last chapter</Caption>
      <button className="btn ghost" style={{ position: 'absolute', right: '4.5vw', bottom: '9vh', zIndex: 7 }} onClick={() => setPhase('table')}>Show me the table →</button>
      <Look />
    </div>
  );

  return (
    <div className="scene bars"><Corner n="04" title="THE TABLE AT SEVENTY" /><Step i={4} />
      <div style={{ position: 'absolute', inset: '14vh 4.5vw 12vh', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3vw', overflow: 'hidden' }}>
        <div style={{ display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 22 }}>
          <div className="seg"><button className={life === 1 ? 'on' : ''} onClick={() => setLife(1)}>Life #001 · most likely</button><button className={life === 2 ? 'on' : ''} onClick={() => setLife(2)}>Life #212 · table full</button></div>
          <div className="table">
            <div className="tabletop" />
            {[[35, 50], [50, 50], [65, 50]].map(([x, y], i) => <i key={i} className="candle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }} />)}
            <div className="chair you" style={{ left: '50%', top: '50%', width: 86, height: 86, margin: '-43px 0 0 -43px', overflow: 'hidden', padding: 0 }}>{portraits[2] ? <img src={portraits[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{p.name}<br /><span className="mono muted" style={{ fontSize: '0.65rem' }}>70</span></span>}</div>
            {seats.map((s, i) => (<div key={s.name} className={`chair ${(full || s.on1) ? 'on' : ''}`} style={{ left: `${pos[i]?.[0] ?? 50}%`, top: `${pos[i]?.[1] ?? 50}%`, transitionDelay: `${i * 90}ms` }}>{s.name}</div>))}
          </div>
          <div className="display h3" style={{ textAlign: 'center' }}>{count} plates. {full ? <span className="amber">{f?.name} is standing to give the toast.</span> : <span className="muted">{f?.name}'s chair is empty.</span>}</div>
        </div>
        <div style={{ display: 'grid', alignContent: 'center', gap: 22, minWidth: 0 }}>
          <div className="panel" style={{ position: 'relative', inset: 'auto' }}>
            <h4>Decision ledger · life #{full ? '212' : '001'}</h4>
            {(full ? L.two : L.one).map(([age, txt]) => (<div key={age} className="row" style={{ gridTemplateColumns: '54px 1fr' }}><div className="who" style={{ fontSize: '1.1rem' }}>{age}</div><div className="txt">{txt}</div></div>))}
          </div>
          <div className="panel" style={{ position: 'relative', inset: 'auto' }}>
            <h4>What the pipeline found · Bruin · mart_decision_impact · n={n}</h4>
            <table className="mart"><thead><tr><th>year-1 action</th><th>table full · with</th><th>without</th><th>lift</th></tr></thead><tbody>
              {MART.map((r, k) => (<tr key={r.action} className={k === 0 ? 'hl' : ''}><td>{r.action}</td><td>{r.with} %</td><td>{r.without} %</td><td className={r.lift > 0 ? 'ok' : 'bad'}>{r.lift > 0 ? '+' : ''}{r.lift}</td></tr>))}
            </tbody></table>
          </div>
          <div style={{ borderLeft: '3px solid var(--amber)', paddingLeft: 20 }}>
            <div className="label amber">One decision before {(p.age || 20) + 3}</div>
            <div className="display h2" style={{ marginTop: 6 }}>Ask for help. <span className="amber">Call {c?.name ?? 'them'} first.</span></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <a className="btn primary" href="tel:">Call now</a>
              <button className="btn" onClick={remind}>Remind me Sunday</button>
              <button className="btn ghost" onClick={() => setLife(2)}>Replay life #212</button>
              <button className="btn ghost" onClick={() => setHow((h) => !h)}>How this was built</button>
            </div>
          </div>
        </div>
      </div>
      {how && (
        <div className="panel drawer"><h4>Built in one day with</h4><ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><b>Bruin</b> — 12 pipeline assets, 11 quality checks, lineage raw → stg → mart. The number on the first screen is <code>mart_outcome_distribution</code>; the lift table is <code>mart_decision_impact</code>. <code>bruin/eulogy/</code></li>
          <li><b>BAND</b> — one room per simulated life; public channel is the life, private @mentions are what they say behind your back; Destiny holds a veto and a human gate. <code>packages/sim/src/band.ts</code>, <code>data/runs/*.band.jsonl</code></li>
          <li><b>Telem</b> — Destiny fetches real base rates before rolling shocks; every query carries the agent's reasoning in <code>context</code>. <code>packages/sim/src/priors.ts</code>, <code>data/telem/requests.json</code></li>
          <li><b>Runware</b> — FLUX.1 Kontext ages your photo twice; TRELLIS.2 turns the +50 portrait into a 3D bust for the chapel. <code>apps/web/src/v2/aging.ts</code></li>
          <li><b>Claude</b> — five agents with continuous emotional state and episodic memory, six chapters, zod on every output, deterministic fallback. <code>packages/sim/src/simulate.ts</code></li>
          <li><b>This demo</b> — the 30 committed runs are real pipeline output; the 30-second show replays them with your names. <code>apps/web/README.md</code></li>
        </ul></div>
      )}
      {toast && <div className="toast">{toast}</div>}
      <div style={{ position: 'absolute', left: '4.5vw', bottom: '9vh', display: 'flex', gap: 10, zIndex: 7 }}>
        <button className="btn ghost" onClick={() => nav('/chapel?screening=jules')}>Watch Jules’s service (3D) →</button>
        <button className="btn ghost" onClick={() => nav('/')}>Start over</button>
      </div>
      <Look />
    </div>
  );
}
