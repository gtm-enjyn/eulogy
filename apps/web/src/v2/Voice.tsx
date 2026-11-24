import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from './ui';
import { useDemo, isComplete, type DemoProfile } from './store';
import { extract } from './extract';

const PROMPTS = [
  'Say your name, your age, your city, and what you do all day.',
  'Name the people who matter. Their name, their age, where you two stand.',
  'What do they say you do wrong? In their words.',
  'Your biggest fear. One sentence.',
];
const DEMO_TEXT = "I'm Jules, 20, Paris then Chicago. Computer science and data, startup weekends, varsity tennis. My mother is 52 in Paris, we talk every two weeks, never about anything real. My sister Inès is 16. My best friend and cofounder Theo is 21. My father is 55, we haven't spoken in four months. I lose my temper. I apologize last. My biggest fear is ending up like my father: respected, alone.";
type Rec = { start(): void; stop(): void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
declare global { interface Window { webkitSpeechRecognition?: new () => Rec; SpeechRecognition?: new () => Rec } }

export default function Voice() {
  const nav = useNavigate(); const { profile, setProfile, setTranscript, useDemo: loadDemo, transcript, connected } = useDemo();
  const [i, setI] = useState(connected ? 2 : 0); const [on, setOn] = useState(false);
  const prefill = connected && !transcript ? profile.relatives.filter((r) => r.grievance).map((r) => `${r.name}: “${r.grievance}”`).join(' ') : '';
  const [finalTxt, setFinal] = useState(transcript || prefill); const [interim, setInterim] = useState('');
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const rec = useRef<Rec | null>(null); const silence = useRef<number | undefined>(undefined); const live = useRef<DemoProfile>(profile); const box = useRef<HTMLDivElement>(null);

  const apply = (text: string) => { const p = extract(text, live.current); live.current = p; setProfile(p); setTranscript(text); };
  const bump = () => { window.clearTimeout(silence.current); silence.current = window.setTimeout(() => setI((k) => Math.min(PROMPTS.length - 1, k + 1)), 2500); };
  useEffect(() => { box.current?.scrollTo({ top: 1e6 }); }, [finalTxt, interim]);

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
  const go = () => { stop(); nav('/simulate'); };
  const done = isComplete(profile);

  return (
    <Screen n="03" title="TELL US · NO TYPING" step={3}
      caption="Speech in · Claude extracts your profile · zod-validated"
      action={<button className="btn primary" disabled={!done} onClick={go}>{connected ? 'Looks right → simulate' : 'Live my life a thousand times →'}</button>}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '4vw', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto auto 1fr', gap: 18, alignContent: 'start', minHeight: 0 }}>
          <div className="mono muted">PROMPT {i + 1} / {PROMPTS.length}</div>
          <h2 className="display h3 amber" style={{ margin: 0, maxWidth: '30ch' }}>{PROMPTS[i]}</h2>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            {supported && (
              <button className={`pulse ${on ? 'on' : ''}`} onClick={on ? stop : start} aria-label="Microphone">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.6"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
            )}
            <div className="mono muted" style={{ minWidth: 150 }}>{on ? 'LISTENING · pause to advance' : supported ? 'TAP TO SPEAK' : 'TYPE BELOW'}</div>
            <button className="btn ghost" onClick={() => setI((k) => Math.min(PROMPTS.length - 1, k + 1))}>Next →</button>
            <button className="btn ghost" onClick={() => { loadDemo(); setFinal(DEMO_TEXT); setI(3); }}>Use demo profile</button>
          </div>
          {supported ? (
            <div className="transcript" ref={box} data-fit>{finalTxt}<span className="interim"> {interim}</span>{!finalTxt && !interim && <span className="muted" style={{ fontStyle: 'italic' }}>Your words appear here.</span>}</div>
          ) : (
            <textarea className="fallback" placeholder="Speech recognition needs Chrome. Type here instead." defaultValue={finalTxt} onChange={(e) => { setFinal(e.target.value); apply(e.target.value); }} />
          )}
        </div>
        <div className="panel" data-fit>
          <h4>Claude · profile extraction · live</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6, minHeight: 32 }}>
            {profile.name && <span className="chip amber">{profile.name}</span>}
            {profile.age > 0 && <span className="chip">{profile.age}</span>}
            {profile.city && <span className="chip">{profile.city}</span>}
            {profile.flaws.slice(0, 2).map((f) => <span key={f} className="chip muted">{f}</span>)}
          </div>
          <div className="stream down" style={{ justifyContent: 'flex-start' }}>
            {profile.relatives.slice(0, 5).map((r) => (
              <div className="prow" key={r.name + r.relation}>
                <div className="av">{r.name[0]}</div>
                <div style={{ minWidth: 0 }}>
                  <div><span className="nm">{r.name}</span><span className="rl">{r.relation}{r.age ? ` · ${r.age}` : ''}</span></div>
                  {(r.grievance || r.state) && <div className="gq">“{r.grievance ?? r.state}”</div>}
                </div>
                <div className="ms">{r.messages ? `${r.messages.toLocaleString('en-US')} msgs` : 'agent'}</div>
              </div>
            ))}
            {profile.relatives.length === 0 && <div className="muted" style={{ fontStyle: 'italic', fontSize: 15 }}>Agents appear here as you name people.</div>}
            {profile.fear && <div className="prow" style={{ borderBottom: 0 }}><div className="av" style={{ borderColor: 'rgba(127,178,230,0.5)', color: 'var(--blue)', background: 'rgba(127,178,230,0.1)' }}>!</div><div style={{ minWidth: 0 }}><div className="rl" style={{ marginLeft: 0 }}>fear</div><div className="gq" style={{ color: 'var(--fg)' }}>{profile.fear}</div></div><div /></div>}
          </div>
        </div>
      </div>
    </Screen>
  );
}
