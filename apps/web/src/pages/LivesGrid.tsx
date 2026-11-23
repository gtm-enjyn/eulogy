import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { daughterSpeaksIn } from '@eulogy/shared';
import { pctDaughterSilent, runs } from '../data/runs';

export default function LivesGrid() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pct = pctDaughterSilent(runs);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const maxAge = 95;
    const rowH = h / runs.length;
    runs.forEach((run, i) => {
      const y = rowH * i + rowH / 2;
      const x1 = (run.death_age / maxAge) * (w - 40) + 20;
      ctx.strokeStyle = daughterSpeaksIn(run) ? '#e8b86d' : '#3a3a40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      ctx.fillStyle = '#8a8a93';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(String(run.death_age), x1 + 6, y + 4);
    });
  }, []);

  return (
    <div className="page">
      <h1>Tes vies</h1>
      <p className="stat">
        <strong>{pct} %</strong> of your lives: Léa does not speak
      </p>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 420, display: 'block', background: '#0a0a0b' }}
      />
      <p style={{ marginTop: 24 }}>
        <button onClick={() => navigate('/chapel')}>Entrer dans la chapelle</button>
      </p>
    </div>
  );
}
