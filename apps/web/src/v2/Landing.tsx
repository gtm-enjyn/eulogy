import { useNavigate } from 'react-router-dom';
import { LifeLines, Look } from './ui';
import { useDemo } from './store';

export default function Landing() {
  const nav = useNavigate(); const reset = useDemo((s) => s.reset);
  return (
    <div className="scene black bars">
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}><LifeLines n={64} opacity={0.6} /></div>
      <div className="center">
        <div className="stack" style={{ gap: 30 }}>
          <div className="label" style={{ letterSpacing: '0.3em' }}>EULOGY</div>
          <h1 className="display h1" style={{ margin: 0, maxWidth: '18ch' }}>Who will be at your table <span className="amber">when you're seventy?</span></h1>
          <p className="muted" style={{ fontSize: '1.15rem', margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>One photo. Your conversations. A thousand lives.</p>
          <button className="btn primary" onClick={() => { reset(); nav('/face'); }} style={{ marginTop: 10 }}>Begin</button>
        </div>
      </div>
      <div className="mono" style={{ position: 'absolute', bottom: '9.5vh', left: 0, right: 0, textAlign: 'center', color: 'var(--faint)' }}>Built in one day with Bruin · BAND · Telem · Runware · Claude</div>
      <Look />
    </div>
  );
}
