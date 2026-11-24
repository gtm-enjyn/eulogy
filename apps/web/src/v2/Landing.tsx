import { useNavigate } from 'react-router-dom';
import { LifeLines, Look } from './ui';
import { useDemo } from './store';

export default function Landing() {
  const nav = useNavigate(); const reset = useDemo((s) => s.reset);
  return (
    <div className="scene black bars">
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}><LifeLines n={64} opacity={0.6} /></div>
      <div className="frame" style={{ gridTemplateRows: 'minmax(0, 1fr) auto' }}>
        <main className="content">
          <div className="center">
            <div className="stack" style={{ gap: 26 }}>
              <div className="label" style={{ letterSpacing: '0.3em' }}>EULOGY</div>
              <h1 className="display h1" style={{ margin: 0, maxWidth: '18ch' }}>Who will be at your table <span className="amber">when you're seventy?</span></h1>
              <p className="muted" style={{ fontSize: 18, margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>One photo. Your conversations. A thousand lives.</p>
              <button className="btn primary" onClick={() => { reset(); nav('/face'); }} style={{ marginTop: 6, padding: '0 36px' }}>Begin</button>
            </div>
          </div>
        </main>
        <footer className="band bottom" style={{ justifyContent: 'center' }}>
          <div className="mono" style={{ color: 'var(--faint)' }}>Built in one day with Bruin · BAND · Telem · Runware · Claude</div>
        </footer>
      </div>
      <Look />
    </div>
  );
}
