import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Caption, Corner, Look, Step } from './ui';
import { useDemo, isComplete, type DemoProfile } from './store';
import { extract } from './extract';

const PROMPTS = [
  'Say your name, your age, your city, and what you actually do all day.',
  'Name the people who matter. For each: their name, their age, and where you two stand today.',
  'What do they say you do wrong? Say it in their words.',
  'Your biggest fear. One sentence.',
];
type Rec = { start(): void; stop(): void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
declare global { interface Window { webkitSpeechRecognition?: new () => Rec; SpeechRecognition?: new () => Rec } }

export default function Voice() {
  const nav = useNavigate(); const { profile, setProfile, setTranscript, useDemo: loadDemo, transcript, connected } = useDemo();
  const [i, setI] = useState(connected ? 2 : 0); const [on, setOn] = useState(false); const prefill = connected && !transcript ? profile.relatives.filter((r) => r.grievance).map((r) => `${r.name}: “${r.grievance}”`).join(' ') : '';
  const [finalTxt, setFinal] = useState(transcript || prefill); const [interim, setInterim] = useState('');
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const rec = useRef<Rec | null>(null); const silence = useRef<number | undefined>(undefined); const live = useRef<DemoProfile>(profile);

  const apply = (text: string) => { const p = extract(text, live.current); live.current = p; setProfile(p); setTranscript(text); };
  const bump = () => { window.clearTimeout(silence.current); silence.current = window.setTimeout(() => setI((k) => Math.min(PROMPTS.length - 1, k + 1)), 2500); };

  const start = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Ctor) return;
    const r = new Ctor(); r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    r.onresult = (e) => { let f = '', it = ''; for (let k = 0; k < e.results.length; k++) { const res = e.results[k]; if (!res) continue; if (res.isFinal) f += res[0].transcript + ' '; else it += res[0].transcript; } setFinal(f); setInterim(it); apply(f + ' ' + it); bump(); };
    r.onend = () => { if (rec.current === r) { try { r.start(); } catch { setOn(false); } } };
    r.onerror = () => setOn(false);
    rec.current = r; r.start(); setOn(true);
  };
  const stop = () => { const r = rec.current; rec.current = null; r?.stop(); setOn(false); };
  useEffect(() => () => { rec.current?.stop(); rec.current = null; }, []);

  const done = isComplete(profile);
  return (
    <div className="scene bars">
      <Corner n="03" title="TELL US · NO TYPING" /><Step i={3} />
      <div style={{ position: 'absolute', inset: '14vh 4.5vw 14vh 4.5vw', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '4vw' }}>
        <div style={{ display: 'grid', alignContent: 'center', gap: 28 }}>
          <div className="mono muted">PROMPT {i + 1} / {PROMPTS.length}</div>
          <div className="display h3 amber" style={{ maxWidth: '26ch' }}>{PROMPTS[i]}</div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {supported ? (
              <button className={`pulse ${on ? 'on' : ''}`} onClick={on ? stop : start} aria-label="Microphone">
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.6"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
            ) : (
              <textarea className="fallback" placeholder="Speech recognition needs Chrome. Type here instead." defaultValue={finalTxt} onChange={(e) => { setFinal(e.target.value); apply(e.target.value); }} />
            )}
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="mono muted">{on ? 'LISTENING · pause 2.5 s to advance' : supported ? 'TAP TO SPEAK' : ''}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn ghost" onClick={() => setI((k) => Math.min(PROMPTS.length - 1, k + 1))}>Next prompt →</button>
                <button className="btn ghost" onClick={() => { loadDemo(); setFinal("I'm Jules, 20, Paris then Chicago. Computer science and data, startup weekends, varsity tennis. My mother is 52 in Paris, we talk every two weeks, never about anything real. My sister Inès is 16. My best friend and cofounder Theo is 21. My father is 55, we haven't spoken in four months. I lose my temper. I apologize last. My biggest fear is ending up like my father: respected, alone."); setI(3); }}>Use demo profile</button>
              </div>
            </div>
          </div>
          <div className="transcript">{finalTxt}<span className="interim"> {interim}</span>{!finalTxt && !interim && <span className="muted" style={{ fontStyle: 'italic' }}>Your words appear here.</span>}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className={`btn ${done ? 'primary' : ''}`} disabled={!done} style={{ opacity: done ? 1 : 0.4 }} onClick={() => { stop(); nav('/simulate'); }}>Live my life a thousand times</button>
            {connected && <button className="btn ghost" onClick={() => { stop(); nav('/simulate'); }}>Looks right? Skip to the simulation →</button>}
          </div>
        </div>
        <div className="panel" style={{ position: 'relative', inset: 'auto', overflow: 'auto' }}>
          <h4>Claude · profile extraction · live</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {profile.name && <span className="chip amber">{profile.name}</span>}
            {profile.age > 0 && <span className="chip">{profile.age}</span>}
            {profile.city && <span className="chip">{profile.city}</span>}
          </div>
          {profile.activity && <div className="card" style={{ marginBottom: 12 }}><div className="sub">What you do</div><div style={{ marginTop: 6 }}>{profile.activity}</div></div>}
          <div style={{ display: 'grid', gap: 10 }}>
            {profile.relatives.map((r) => (
              <div className="card" key={r.name + r.relation}><div className="name">{r.name}{r.age ? <span className="muted" style={{ fontSize: '1rem' }}> · {r.age}</span> : null}</div><div className="sub">{r.relation} · agent{r.messages ? ` · ${r.messages.toLocaleString('en-US')} msgs` : ''}</div>{(r.grievance || r.state) && <div className="q" style={r.grievance ? { color: 'var(--blue)' } : undefined}>“{r.grievance ?? r.state}”</div>}</div>
            ))}
          </div>
          {profile.flaws.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>{profile.flaws.map((f) => <span key={f} className="chip">{f}</span>)}</div>}
          {profile.fear && <div className="card" style={{ marginTop: 12, borderLeftColor: 'var(--blue)' }}><div className="sub">Fear</div><div style={{ marginTop: 6, fontStyle: 'italic' }}>{profile.fear}</div></div>}
          {profile.relatives.length === 0 && <div className="muted" style={{ fontStyle: 'italic' }}>Agents appear here as you name people.</div>}
        </div>
      </div>
      <Caption>Web Speech API streams your words · a Claude extraction pass turns them into a zod-validated Profile: one agent per person, each with goals, memory, a grievance</Caption>
      <Look />
    </div>
  );
}
