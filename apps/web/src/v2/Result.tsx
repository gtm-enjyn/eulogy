import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, useCountUp } from './ui';
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
    const partner = p.relatives.find((r) => r.relation === 'partner')?.name ?? 'Partner'; const mate = p.relatives.find((r) => ['cofounder', 'friend'].includes(r.relation))?.name ?? 'Theo';
    const names = [p.relatives[0]?.name, f?.name, mate, c?.name, partner, 'Kid 1', 'Kid 2', `${mate}'s kids`].map((x, i) => x ?? `Guest ${i + 1}`);
    const missing1 = new Set([f?.name, c?.name, 'Kid 1', 'Kid 2', `${mate}'s kids`]);
    return names.map((name) => ({ name, on1: !missing1.has(name) }));
  }, [p, f, c]);
  const pos = [[18, 22], [38, 14], [62, 14], [82, 22], [86, 78], [62, 86], [38, 86], [14, 78]];
  const full = life === 2; const count = full ? 9 : seats.filter((s) => s.on1).length + 1;
  const remind = () => { try { localStorage.setItem('eulogy.reminder', JSON.stringify({ who: c?.name, at: 'Sunday 18:00' })); } catch { /* ignore */ } setToast(`Sunday 6 pm · call ${c?.name ?? 'them'}. Saved.`); setTimeout(() => setToast(''), 2600); };

  if (phase === 'number') return (
    <Screen black step={5} caption={`mart_outcome_distribution · Bruin → DuckDB · ${n} runs`} action={<button className="btn ghost" onClick={() => setPhase('table')}>Show me the table →</button>}>
      <div className="center"><div className="stack" style={{ gap: 10 }}>
        <div className="display h2">In <span className="amber" style={{ fontVariantNumeric: 'tabular-nums' }}>{shown} %</span> of your lives,</div>
        <div className="display h2" style={{ opacity: shown >= pct ? 1 : 0, transition: 'opacity .8s' }}>{f?.name ?? 'her'}'s chair is empty.</div>
      </div></div>
    </Screen>
  );

  return (
    <Screen n="05" title="THE TABLE AT SEVENTY" step={5}
      footLeft={<><button className="btn ghost" onClick={() => setHow((h) => !h)}>How this was built</button><button className="btn ghost" onClick={() => nav('/')}>Start over</button></>}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '3vw', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', justifyItems: 'center', alignItems: 'center', gap: 14, minHeight: 0 }}>
          <div className="seg"><button className={life === 1 ? 'on' : ''} onClick={() => setLife(1)}>Life #001 · most likely</button><button className={life === 2 ? 'on' : ''} onClick={() => setLife(2)}>Life #212 · table full</button></div>
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', minHeight: 0 }}>
            <div className="table" data-fit>
              <div className="tabletop" />
              {[[35, 50], [50, 50], [65, 50]].map(([x, y], i) => <i key={i} className="candle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }} />)}
              <div className="chair you" style={{ left: '50%', top: '50%', width: 88, height: 88, margin: '-44px 0 0 -44px', overflow: 'hidden', padding: 0 }}>{portraits[2] ? <img src={portraits[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{p.name}<br /><span className="mono muted" style={{ fontSize: 12 }}>70</span></span>}</div>
              {seats.map((s, i) => (<div key={s.name} className={`chair ${(full || s.on1) ? 'on' : ''}`} style={{ left: `${pos[i]?.[0] ?? 50}%`, top: `${pos[i]?.[1] ?? 50}%`, transitionDelay: `${i * 90}ms` }}>{s.name}</div>))}
            </div>
          </div>
          <div className="display h3" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{count} plates · {full ? <span className="amber">{f?.name} stands for the toast.</span> : <span className="muted">{f?.name}'s chair is empty.</span>}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr)', gap: 14, minWidth: 0, minHeight: 0 }}>
          <div className="panel ledger" data-fit>
            <h4>Decision ledger · life #{full ? '212' : '001'}</h4>
            {(full ? L.two : L.one).map(([age, txt]) => (<div key={age} className="row"><div className="who">{age}</div><div className="txt" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt}</div></div>))}
          </div>
          <div className="panel" data-fit>
            <h4>Bruin · mart_decision_impact · n={n}</h4>
            <table className="mart"><thead><tr><th>year-1 action</th><th>full</th><th>without</th><th>lift</th></tr></thead><tbody>
              {MART.map((r, k) => (<tr key={r.action} className={k === 0 ? 'hl' : ''}><td>{r.action}</td><td>{r.with} %</td><td>{r.without} %</td><td className={r.lift > 0 ? 'ok' : 'bad'}>{r.lift > 0 ? '+' : ''}{r.lift}</td></tr>))}
            </tbody></table>
          </div>
          <div style={{ alignSelf: 'end', borderLeft: '3px solid var(--amber)', paddingLeft: 18, minWidth: 0 }} data-fit>
            <div className="label amber">One decision before {(p.age || 20) + 3}</div>
            <div className="display" style={{ marginTop: 4, fontSize: 'clamp(26px, 2.6vw, 40px)', lineHeight: 1.1 }}>Ask for help. <span className="amber">Call {c?.name ?? 'them'} first.</span></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <a className="btn primary" href="tel:">Call now</a>
              <button className="btn" onClick={remind}>Remind me Sunday</button>
              <button className="btn ghost" onClick={() => setLife(2)}>Replay life #212</button>
            </div>
          </div>
        </div>
      </div>
      {how && (
        <div className="panel drawer"><h4>Built in one day with</h4><ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><b>Bruin</b> — 12 pipeline assets, 11 quality checks, lineage raw → stg → mart. First screen = <code>mart_outcome_distribution</code>; lift table = <code>mart_decision_impact</code>. <code>bruin/eulogy/</code></li>
          <li><b>BAND</b> — one room per simulated life; public channel is the life, private @mentions are what they say behind your back; Destiny holds a veto and a human gate. <code>packages/sim/src/band.ts</code></li>
          <li><b>Telem</b> — Destiny fetches real base rates before rolling shocks; every query carries the agent's reasoning in <code>context</code>. <code>data/telem/requests.json</code></li>
          <li><b>Runware</b> — FLUX.1 Kontext ages your photo twice; TRELLIS.2 turns the +50 portrait into a 3D bust. <code>apps/web/src/v2/aging.ts</code></li>
          <li><b>Claude</b> — five agents with continuous emotional state and episodic memory, six chapters, zod on every output. <code>packages/sim/src/simulate.ts</code></li>
          <li><b>Conversations</b> — sample export in this demo; the real importer parses WhatsApp / Instagram / iMessage / Snapchat / Gmail exports locally and never uploads them. <code>apps/web/src/v2/connectData.ts</code></li>
          <li><b>3D chapel</b> — <button className="btn ghost" style={{ minHeight: 32, padding: '0 10px' }} onClick={() => nav('/chapel?screening=jules')}>Watch Jules’s service →</button></li>
        </ul></div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </Screen>
  );
}
