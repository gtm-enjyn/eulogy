import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Corner, LifeLines, Look, useCountUp } from './ui';
import { useDemo, JULES, isComplete } from './store';
import { BRUIN, CAPTIONS, CHECKS, MART, TELEM, bandScript } from './script';

const TOTAL = 30000;
export default function Simulate() {
  const nav = useNavigate(); const stored = useDemo((s) => s.profile);
  const profile = useMemo(() => (isComplete(stored) ? stored : JULES), [stored]);
  const msgs = useMemo(() => bandScript(profile), [profile]);
  const [t, setT] = useState(0); const [leaving, setLeaving] = useState(false);
  useEffect(() => { const t0 = performance.now(); let raf = 0; const tick = () => { const e = performance.now() - t0; setT(e); if (e < TOTAL) raf = requestAnimationFrame(tick); else leave(); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leave = () => { setLeaving(true); setTimeout(() => nav('/result'), 700); };
  const lives = useCountUp(1000, 26000);
  const rooms = Math.min(1000, Math.floor((t / 26000) * 1000));
  const progress = Math.min(1, t / 26000);
  const shown = msgs.filter((m) => m.at <= t);
  const telemN = Math.min(TELEM.length, Math.floor(Math.max(0, t - 1500) / 2600));
  const bruinN = Math.min(BRUIN.length, Math.floor(Math.max(0, t - 9000) / 900));
  const martOn = t > 22000; const martRows = Math.min(MART.length, Math.floor((t - 23500) / 700));
  const cap = CAPTIONS[Math.floor(t / 5500) % CAPTIONS.length];
  return (
    <div className={`scene bars ${leaving ? 'fadeout' : ''}`}>
      <Corner n="03" title={`SIMULATING · ${profile.name.toUpperCase()} · ${profile.relatives.length + 1} AGENTS · ROOM ${rooms}/1000`} />
      <div style={{ position: 'absolute', inset: '7vh 0', opacity: 0.9 }}><LifeLines n={80} progress={progress} markers /></div>
      <div style={{ position: 'absolute', left: '50%', top: '14vh', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 4, pointerEvents: 'none' }}>
        <div className="counter">{lives.toLocaleString('en-US')}</div>
        <div className="label" style={{ marginTop: 8 }}>LIVES SIMULATED</div>
      </div>
      <div className="panel blue" style={{ left: '4.5vw', top: '16vh', width: '27vw', bottom: '16vh' }}>
        <h4>BAND · room life-{String(Math.max(1, rooms)).padStart(4, '0')} · {profile.relatives.length + 2} agents</h4>
        <div style={{ display: 'grid' }}>
          {shown.slice(-9).map((m) => (
            <div key={m.at} className={`row ${m.kind === 'priv' ? 'priv' : ''} ${m.kind === 'sys' ? 'sys' : ''}`}>
              <div className="who">{m.who}</div>
              <div className="txt" style={m.kind === 'gate' ? { color: 'var(--amber)' } : undefined}>{m.kind === 'priv' ? '🔒 ' : ''}{m.txt}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel grey" style={{ right: '4.5vw', top: '16vh', width: '27vw', height: '30vh' }}>
        <h4>Telem · Observe · agent reasoning traces</h4>
        {TELEM.slice(0, telemN).map(([q, c]) => (
          <div key={q} className="row" style={{ gridTemplateColumns: '1fr' }}><div className="mono" style={{ color: 'var(--fg)', fontSize: '0.78rem', letterSpacing: 0 }}>POST /v1/search · “{q}”</div><div className="muted" style={{ fontSize: '0.82rem' }}>context: {c}</div></div>
        ))}
      </div>
      <div className="panel" style={{ right: '4.5vw', top: '48.5vh', width: '27vw', bottom: '16vh' }}>
        <h4>$ bruin run bruin/eulogy</h4>
        {!martOn && BRUIN.slice(0, bruinN).map((a) => (<div key={a} className="tick"><span className="ok">✓</span> {a}<span className="chk">{CHECKS[a] ?? 'materialized'}</span></div>))}
        {!martOn && bruinN >= BRUIN.length && <div className="tick ok" style={{ marginTop: 8 }}>12 assets · 11 checks passed · lineage raw → stg → mart</div>}
        {martOn && (
          <div>
            <div className="tick" style={{ whiteSpace: 'normal', color: 'var(--muted)' }}>$ bruin query -q "select action, lift from mart_decision_impact order by lift desc"</div>
            <table className="mart" style={{ marginTop: 10 }}><thead><tr><th>year-1 action</th><th>with</th><th>without</th><th>lift</th></tr></thead><tbody>
              {MART.slice(0, Math.max(0, martRows)).map((r, k) => (<tr key={r.action} className={k === 0 ? 'hl' : ''}><td>{r.action}</td><td>{r.with} %</td><td>{r.without} %</td><td className={r.lift > 0 ? 'ok' : 'bad'}>{r.lift > 0 ? '+' : ''}{r.lift}</td></tr>))}
            </tbody></table>
          </div>
        )}
      </div>
      <div className="caption" style={{ left: '50%', transform: 'translateX(-50%)', maxWidth: '40vw', textAlign: 'center', borderLeft: 0, paddingLeft: 0, bottom: '9vh' }}>{cap}</div>
      {t > 8000 && <button className="btn ghost" style={{ position: 'absolute', right: '4.5vw', bottom: '9vh', zIndex: 7 }} onClick={leave}>Skip →</button>}
      <Look />
    </div>
  );
}
