import React, { useEffect, useRef } from 'react';

export const Grain: React.FC = () => (
  <svg className="grain" aria-hidden>
    <filter id="g2"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width="100%" height="100%" filter="url(#g2)" />
  </svg>
);
export const Look: React.FC = () => (<><div className="vignette" /><Grain /></>);

export const Caption: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => (
  <div className="caption" style={right ? { left: 'auto', right: '4.5vw', borderLeft: 0, borderRight: '2px solid var(--amber)', paddingLeft: 0, paddingRight: 14, textAlign: 'right' } : undefined}>{children}</div>
);
export const Corner: React.FC<{ n: string; title: string; right?: boolean }> = ({ n, title, right }) => (
  <div className={`corner ${right ? 'corner-r' : ''}`}><span className="mono amber">{n}</span><span className="mono muted">{title}</span></div>
);
export const Step: React.FC<{ i: number }> = ({ i }) => (
  <div className="step">{['FACE', 'CONVERSATIONS', 'VOICE', 'SIMULATION', 'VERDICT'].map((s, k) => (<span key={s}>{k > 0 && ' · '}{k + 1 === i ? <b>{s}</b> : s}</span>))}</div>
);

/** Life-lines canvas: n polylines drifting left→right; some end amber. `progress` 0..1 draws them in; undefined = ambient loop. */
export const LifeLines: React.FC<{ n?: number; progress?: number; opacity?: number; markers?: boolean }> = ({ n = 64, progress, opacity = 0.9, markers }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const prog = useRef(progress);
  prog.current = progress;
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!;
    let raf = 0; const t0 = performance.now();
    const seed = (i: number) => { let s = (i * 7919 + 13) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
    const lines = Array.from({ length: n }, (_, i) => { const r = seed(i); const pts = Array.from({ length: 15 }, () => (r() - 0.5) * 70); const e = r(); return { pts, color: e < 0.1 ? 'rgba(232,163,90,0.95)' : e < 0.45 ? 'rgba(127,178,230,0.55)' : 'rgba(200,190,170,0.3)', death: 0.55 + r() * 0.45, y0: i / n }; });
    const draw = (now: number) => {
      const W = (c.width = c.clientWidth * devicePixelRatio), H = (c.height = c.clientHeight * devicePixelRatio);
      ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1.3 * devicePixelRatio;
      const p = prog.current ?? ((Math.sin((now - t0) / 6000) + 1) / 2) * 0.4 + 0.6;
      lines.forEach((l, i) => {
        ctx.beginPath(); const yb = (0.06 + l.y0 * 0.88) * H; const drift = prog.current === undefined ? Math.sin((now - t0) / 4000 + i) * 6 : 0;
        const upto = Math.min(p, l.death); let y = yb; let last: [number, number] | null = null;
        l.pts.forEach((d, k) => { const x = (k / 14) * W; y += d * (H / 1080); if (k / 14 <= upto) { if (k === 0) ctx.moveTo(x, y + drift); else ctx.lineTo(x, y + drift); last = [x, y + drift]; } });
        ctx.strokeStyle = l.color; ctx.globalAlpha = opacity; ctx.stroke();
        if (p >= l.death && last) { ctx.beginPath(); ctx.arc(last[0], last[1], 2.6 * devicePixelRatio, 0, Math.PI * 2); ctx.fillStyle = l.color; ctx.fill(); }
      });
      if (markers) { ctx.globalAlpha = 0.5; ctx.fillStyle = 'rgba(235,228,210,0.6)'; ctx.font = `${12 * devicePixelRatio}px Menlo, monospace`; [[0.08, '23'], [0.3, '31'], [0.55, '45'], [0.72, '52'], [0.98, '70']].forEach(([x, t]) => ctx.fillText(String(t), Number(x) * W, H - 10 * devicePixelRatio)); }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [n, opacity, markers]);
  return <canvas ref={ref} className="lines" />;
};

export function useCountUp(target: number, ms: number, start = true) {
  const [v, setV] = React.useState(0);
  useEffect(() => { if (!start) return; let raf = 0; const t0 = performance.now(); const tick = (t: number) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); setV(Math.round(target * e)); if (k < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [target, ms, start]);
  return v;
}
