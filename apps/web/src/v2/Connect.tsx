import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Caption, Corner, Look, Step } from './ui';
import { useDemo } from './store';
import { CONSOLE, PEOPLE, SOURCES, TOTAL_MESSAGES, type Source } from './connectData';

type Status = 'idle' | 'asking' | 'ok';
type Phase = 'sources' | 'analyze' | 'people';
const fmt = (n: number) => n.toLocaleString('en-US');

const Glyph: React.FC<{ id: string; color: string }> = ({ id, color }) => {
  const c = { stroke: color, fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'whatsapp': return <svg width="26" height="26" viewBox="0 0 24 24"><path {...c} d="M4 20l1.3-3.8A8 8 0 1 1 8.2 19L4 20z" /><path {...c} d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.4-1.9-.9-.9.9a4 4 0 0 1-2.2-2.2l.9-.9-.9-1.9L9 9.5z" /></svg>;
    case 'instagram': return <svg width="26" height="26" viewBox="0 0 24 24"><rect {...c} x="4" y="4" width="16" height="16" rx="4.5" /><circle {...c} cx="12" cy="12" r="3.6" /><circle cx="16.7" cy="7.3" r="1" fill={color} /></svg>;
    case 'imessage': return <svg width="26" height="26" viewBox="0 0 24 24"><path {...c} d="M12 4.5c4.7 0 8.5 3 8.5 6.7s-3.8 6.7-8.5 6.7c-.9 0-1.8-.1-2.6-.3L6 19.5l.9-2.9C5.1 15.4 3.5 13.5 3.5 11.2c0-3.7 3.8-6.7 8.5-6.7z" /></svg>;
    case 'snapchat': return <svg width="26" height="26" viewBox="0 0 24 24"><path {...c} d="M12 4c2.6 0 4.3 2 4.3 4.6v2.2c.6.2 1.3 0 1.7-.2-.1.9-1.1 1.3-1.7 1.6.5 1.4 1.9 2.4 3.2 2.7-.4.8-1.6.8-2.3 1-.1.5-.2 1-.4 1.2-.9-.1-1.9-.3-2.7.3-.7.5-1.3 1.1-2.1 1.1s-1.4-.6-2.1-1.1c-.8-.6-1.8-.4-2.7-.3-.2-.2-.3-.7-.4-1.2-.7-.2-1.9-.2-2.3-1 1.3-.3 2.7-1.3 3.2-2.7-.6-.3-1.6-.7-1.7-1.6.4.2 1.1.4 1.7.2V8.6C7.7 6 9.4 4 12 4z" /></svg>;
    default: return <svg width="26" height="26" viewBox="0 0 24 24"><rect {...c} x="3.5" y="5.5" width="17" height="13" rx="2" /><path {...c} d="M4 7l8 6 8-6" /></svg>;
  }
};

const Spark: React.FC<{ v: number[] }> = ({ v }) => {
  const max = Math.max(...v); const pts = v.map((y, i) => `${(i / (v.length - 1)) * 120},${28 - (y / max) * 26}`).join(' ');
  return <svg width="120" height="30" viewBox="0 0 120 30" aria-hidden><polyline points={pts} fill="none" stroke="var(--amber)" strokeWidth="1.4" opacity="0.9" /></svg>;
};

export default function Connect() {
  const nav = useNavigate(); const setConnected = useDemo((s) => s.setConnected);
  const [status, setStatus] = useState<Record<string, Status>>(() => Object.fromEntries(SOURCES.map((s) => [s.id, 'idle'])));
  const [sheet, setSheet] = useState<Source | null>(null);
  const [phase, setPhase] = useState<Phase>('sources');
  const [lines, setLines] = useState<number>(0); const [bar, setBar] = useState(0); const [people, setPeople] = useState(0);
  const timers = useRef<number[]>([]); const logRef = useRef<HTMLDivElement>(null);
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const connectOne = (s: Source) => new Promise<void>((resolve) => {
    setSheet(s); setStatus((st) => ({ ...st, [s.id]: 'asking' }));
    later(() => { setStatus((st) => ({ ...st, [s.id]: 'ok' })); setSheet(null); later(resolve, 350); }, 1200 + Math.random() * 800);
  });
  const connectAll = async () => { for (const s of SOURCES) if (status[s.id] !== 'ok') await connectOne(s); };
  const allOk = useMemo(() => SOURCES.every((s) => status[s.id] === 'ok'), [status]);

  // once every source is connected, run the analysis console, then reveal the people
  useEffect(() => {
    if (!allOk || phase !== 'sources') return;
    setPhase('analyze'); let at = 400;
    CONSOLE.forEach(([delay, , kind], i) => {
      at += delay + Math.random() * 220;
      later(() => { setLines(i + 1); if (kind === 'bar') { const t0 = performance.now(); const tick = window.setInterval(() => { const k = Math.min(1, (performance.now() - t0) / 2600); setBar(k); if (k >= 1) clearInterval(tick); }, 60); timers.current.push(tick as unknown as number); } }, at);
      if (kind === 'bar') at += 2600;
    });
    later(() => { setPhase('people'); PEOPLE.forEach((_, i) => later(() => setPeople(i + 1), 250 + i * 380)); }, at + 700);
  }, [allOk, phase]);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [lines]);

  const confirm = () => {
    setConnected(PEOPLE.map((p) => ({ name: p.name, age: p.age, relation: p.relation, state: p.state, grievance: p.grievance, messages: p.messages })));
    nav('/voice');
  };
  const okCount = SOURCES.filter((s) => status[s.id] === 'ok').length;

  return (
    <div className="scene bars">
      <Corner n="02" title="YOUR CONVERSATIONS" /><Step i={2} />
      <div style={{ position: 'absolute', inset: '13vh 4.5vw 17vh', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24 }}>
          <div>
            <h2 className="display h2" style={{ margin: 0 }}>Who do you <span className="amber">actually</span> talk to?</h2>
            <p className="muted" style={{ margin: '8px 0 0', maxWidth: '64ch', fontSize: '1.02rem', lineHeight: 1.45 }}>Eulogy reads the last five years of your conversations and finds the five people who will be at your table. Nothing leaves your browser.</p>
          </div>
          {phase === 'sources' && <button className="btn primary" onClick={() => void connectAll()} disabled={!!sheet}>Connect all</button>}
          {phase !== 'sources' && <div className="mono muted">{okCount}/5 SOURCES · {fmt(TOTAL_MESSAGES)} MESSAGES · LOCAL</div>}
        </div>

        {phase === 'sources' && (
          <div className="sources">
            {SOURCES.map((s) => {
              const st = status[s.id];
              return (
                <div key={s.id} className={`source ${st === 'ok' ? 'ok' : ''}`} style={{ ['--c' as string]: s.color }}>
                  <div className="src-head"><Glyph id={s.id} color={s.color} /><span className="src-name">{s.name}</span></div>
                  {st === 'ok' ? (
                    <div className="src-meta"><div className="ok">● Connected</div><div>{fmt(s.chats)} {s.kind} · {fmt(s.messages)} messages</div><div className="muted">{s.span}</div></div>
                  ) : (
                    <div className="src-meta muted">Export · read-only · processed locally</div>
                  )}
                  {st !== 'ok' && <button className="btn" style={{ padding: '10px 18px', fontSize: '0.9rem' }} disabled={!!sheet} onClick={() => void connectOne(s)}>{st === 'asking' ? 'Connecting…' : 'Connect'}</button>}
                </div>
              );
            })}
          </div>
        )}

        {phase === 'analyze' && (
          <div className="panel" style={{ position: 'relative', inset: 'auto', display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
            <h4>eulogy import · analysis · local</h4>
            <div className="console" ref={logRef}>
              {CONSOLE.slice(0, lines).map(([, txt, kind], i) => (
                <div key={i} className={`cl ${kind}`}>
                  <span className="ts">{String(i).padStart(2, '0')}</span>{txt}
                  {kind === 'bar' && <div className="progress" style={{ marginTop: 6, width: 420 }}><i style={{ width: `${bar * 100}%` }} /></div>}
                </div>
              ))}
              {lines < CONSOLE.length && <div className="cl info cursor">▍</div>}
            </div>
          </div>
        )}

        {phase === 'people' && (
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 16, minHeight: 0 }}>
            <div className="mono ok">done · 5 people · 4,812 memories · 11.8 s</div>
            <div className="people">
              {PEOPLE.slice(0, people).map((p) => (
                <div key={p.name} className="person">
                  <div className="p-head"><div className="avatar">{p.name[0]}</div><div><div className="name">{p.name}</div><div className="sub">{p.relationLabel} · {p.age}</div></div><button className="edit" aria-label="Edit">edit</button></div>
                  <div className="p-stats">
                    <div><span className="k">messages</span><span className="v">{fmt(p.messages)}</span></div>
                    <div><span className="k">writes first</span><span className="v">you {p.youFirst} % · them {100 - p.youFirst} %</span></div>
                    <div><span className="k">last real conversation</span><span className="v">{p.lastReal}</span></div>
                  </div>
                  <Spark v={p.monthly} />
                  <div className="griev">“{p.grievance}”</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <button className="btn primary" onClick={confirm} disabled={people < PEOPLE.length} style={{ opacity: people < PEOPLE.length ? 0.4 : 1 }}>These are my people →</button>
              <span className="muted" style={{ fontSize: '0.9rem' }}>Each becomes an agent with memory, mood and a grievance.</span>
            </div>
          </div>
        )}
      </div>

      {sheet && (
        <div className="sheet-wrap">
          <div className="sheet">
            <div className="src-head" style={{ marginBottom: 14 }}><Glyph id={sheet.id} color={sheet.color} /><span className="src-name">{sheet.name}</span></div>
            <div className="display h3" style={{ marginBottom: 10 }}>Allow Eulogy to read your {sheet.name} export?</div>
            <ul className="mono muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}><li>read-only</li><li>processed locally, never uploaded</li><li>revoke any time</li></ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}><span className="spin" /><span className="mono muted">authorizing…</span></div>
          </div>
        </div>
      )}
      <Caption>{phase === 'sources' ? 'Exports are parsed in the browser · embeddings on WebGPU (bge-m3) · per-contact features: volume, reply latency, initiative ratio, valence · nothing leaves your device' : phase === 'analyze' ? 'HDBSCAN on message features + embeddings finds your core five · grievances are quoted from messages with valence < −0.4 addressed to you' : 'Each person becomes a Claude agent seeded with 4,812 memories from your own conversations · their grievance is their opening state'}</Caption>
      <Look />
    </div>
  );
}
