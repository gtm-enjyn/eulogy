import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from './ui';
import { useDemo } from './store';
import { CONSOLE, PEOPLE, SOURCES, TOTAL_MESSAGES, type Source } from './connectData';

type Status = 'idle' | 'asking' | 'ok';
type Phase = 'sources' | 'analyze' | 'people';
const fmt = (n: number) => n.toLocaleString('en-US');

const Glyph: React.FC<{ id: string; color: string }> = ({ id, color }) => {
  const c = { stroke: color, fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'whatsapp': return <svg width="22" height="22" viewBox="0 0 24 24"><path {...c} d="M4 20l1.3-3.8A8 8 0 1 1 8.2 19L4 20z" /><path {...c} d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.4-1.9-.9-.9.9a4 4 0 0 1-2.2-2.2l.9-.9-.9-1.9L9 9.5z" /></svg>;
    case 'instagram': return <svg width="22" height="22" viewBox="0 0 24 24"><rect {...c} x="4" y="4" width="16" height="16" rx="4.5" /><circle {...c} cx="12" cy="12" r="3.6" /><circle cx="16.7" cy="7.3" r="1" fill={color} /></svg>;
    case 'imessage': return <svg width="22" height="22" viewBox="0 0 24 24"><path {...c} d="M12 4.5c4.7 0 8.5 3 8.5 6.7s-3.8 6.7-8.5 6.7c-.9 0-1.8-.1-2.6-.3L6 19.5l.9-2.9C5.1 15.4 3.5 13.5 3.5 11.2c0-3.7 3.8-6.7 8.5-6.7z" /></svg>;
    case 'snapchat': return <svg width="22" height="22" viewBox="0 0 24 24"><path {...c} d="M12 4c2.6 0 4.3 2 4.3 4.6v2.2c.6.2 1.3 0 1.7-.2-.1.9-1.1 1.3-1.7 1.6.5 1.4 1.9 2.4 3.2 2.7-.4.8-1.6.8-2.3 1-.1.5-.2 1-.4 1.2-.9-.1-1.9-.3-2.7.3-.7.5-1.3 1.1-2.1 1.1s-1.4-.6-2.1-1.1c-.8-.6-1.8-.4-2.7-.3-.2-.2-.3-.7-.4-1.2-.7-.2-1.9-.2-2.3-1 1.3-.3 2.7-1.3 3.2-2.7-.6-.3-1.6-.7-1.7-1.6.4.2 1.1.4 1.7.2V8.6C7.7 6 9.4 4 12 4z" /></svg>;
    default: return <svg width="22" height="22" viewBox="0 0 24 24"><rect {...c} x="3.5" y="5.5" width="17" height="13" rx="2" /><path {...c} d="M4 7l8 6 8-6" /></svg>;
  }
};

export default function Connect() {
  const nav = useNavigate(); const setConnected = useDemo((s) => s.setConnected);
  const [status, setStatus] = useState<Record<string, Status>>(() => Object.fromEntries(SOURCES.map((s) => [s.id, 'idle'])));
  const [sheet, setSheet] = useState<Source | null>(null);
  const [phase, setPhase] = useState<Phase>('sources');
  const [lines, setLines] = useState<number>(0); const [bar, setBar] = useState(0); const [people, setPeople] = useState(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const connectOne = (s: Source) => new Promise<void>((resolve) => {
    setSheet(s); setStatus((st) => ({ ...st, [s.id]: 'asking' }));
    later(() => { setStatus((st) => ({ ...st, [s.id]: 'ok' })); setSheet(null); later(resolve, 350); }, 1200 + Math.random() * 800);
  });
  const connectAll = async () => { for (const s of SOURCES) if (status[s.id] !== 'ok') await connectOne(s); };
  const allOk = useMemo(() => SOURCES.every((s) => status[s.id] === 'ok'), [status]);

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

  const confirm = () => {
    setConnected(PEOPLE.map((p) => ({ name: p.name, age: p.age, relation: p.relation, state: p.state, grievance: p.grievance, messages: p.messages })));
    nav('/voice');
  };
  const ready = people >= PEOPLE.length;
  const caption = phase === 'sources' ? '5 exports · read-only · parsed in your browser' : phase === 'analyze' ? `${fmt(TOTAL_MESSAGES)} messages · processed locally` : '5 people · 4,812 memories · local';
  const action = phase === 'sources'
    ? <button className="btn primary" onClick={() => void connectAll()} disabled={!!sheet}>Connect all</button>
    : phase === 'people' ? <button className="btn primary" onClick={confirm} disabled={!ready}>These are my people →</button> : null;
  const visibleLines = CONSOLE.slice(0, lines).slice(phase === 'people' ? -3 : -5);
  const firstIdx = Math.max(0, lines - visibleLines.length);

  return (
    <Screen n="02" title="YOUR CONVERSATIONS" step={2} caption={caption} action={action}>
      <div style={{ height: '100%', display: 'grid', gridTemplateRows: phase === 'sources' ? 'auto auto 1fr' : phase === 'analyze' ? 'auto 1fr' : 'auto auto 1fr', gap: 14, minHeight: 0 }}>
        {phase === 'sources' && <h2 className="display h2" style={{ margin: '0 0 6px' }}>Who do you <span className="amber">actually</span> talk to?</h2>}

        <div className="sources">
          {SOURCES.map((s) => {
            const st = status[s.id];
            return (
              <div key={s.id} className={`source ${st === 'ok' ? 'ok' : ''}`} style={{ ['--c' as string]: s.color }} data-fit>
                <div className="src-head"><Glyph id={s.id} color={s.color} /><span className="src-name">{s.name}</span></div>
                {st === 'ok' ? <span className="mono ok" style={{ fontSize: 12.5 }}>● ON</span> : phase === 'sources' ? <button className="btn src-btn" disabled={!!sheet} onClick={() => void connectOne(s)}>{st === 'asking' ? '…' : 'Connect'}</button> : null}
                <div className="src-meta">{st === 'ok' ? <>{fmt(s.chats)} {s.kind} · {fmt(s.messages)} messages</> : 'read-only · local'}</div>
              </div>
            );
          })}
        </div>

        {phase === 'sources' && <div />}

        {phase !== 'sources' && (
          <div className="panel" data-fit style={{ minHeight: 0 }}>
            <h4>eulogy import · analysis · local</h4>
            <div className="console">
              {visibleLines.map(([, txt, kind], k) => {
                const i = firstIdx + k;
                return (
                  <div key={i} className={`cl ${kind}`}>
                    <span className="ts">{String(i).padStart(2, '0')}</span>{txt}
                    {kind === 'bar' && <span className="progress" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 14, width: 220 }}><i style={{ width: `${bar * 100}%` }} /></span>}
                  </div>
                );
              })}
              {lines < CONSOLE.length && <div className="cl info cursor">▍</div>}
            </div>
          </div>
        )}

        {phase === 'people' && (
          <div className="people">
            {PEOPLE.slice(0, people).map((p) => (
              <div key={p.name} className="person" data-fit>
                <div className="p-head"><div className="avatar">{p.name[0]}</div><div style={{ minWidth: 0 }}><div className="name">{p.name}</div><div className="sub">{p.relationLabel} · {p.age}</div></div></div>
                <div className="stat">{fmt(p.messages)} msgs · you write first {p.youFirst} %</div>
                <div className="griev">“{p.grievance}”</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sheet && (
        <div className="sheet-wrap">
          <div className="sheet">
            <div className="src-head" style={{ marginBottom: 12 }}><Glyph id={sheet.id} color={sheet.color} /><span className="src-name">{sheet.name}</span></div>
            <div className="display h3" style={{ marginBottom: 10 }}>Allow Eulogy to read your {sheet.name} export?</div>
            <div className="mono muted">read-only · processed locally · revoke any time</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}><span className="spin" /><span className="mono muted">authorizing…</span></div>
          </div>
        </div>
      )}
    </Screen>
  );
}
