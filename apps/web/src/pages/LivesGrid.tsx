import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { getScreening } from '../data/screening';
import './atlas.css';
const colors: Record<string, string> = {
  reconciled: '#d5b681',
  mixed: '#8cabc1',
  estranged: '#b6747d',
  admired_not_loved: '#a395be',
};
const outcome = z.object({
  profile_id: z.string(),
  n_runs: z.number(),
  pct_child_speaks: z.number().nullable(),
});
const impact = z.object({
  profile_id: z.string(),
  action: z.string(),
  lift: z.number(),
  n: z.number(),
  n_without: z.number(),
});
const Marts = z.object({
  outcome_distribution: z.array(outcome),
  decision_impact: z.array(impact),
});
export default function LivesGrid() {
  const { profile, runs, summary } = getScreening(),
    canvas = useRef<HTMLCanvasElement>(null);
  const [marts, setMarts] = useState<z.infer<typeof Marts> | null>(null),
    [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    fetch('/data/marts.json', { signal: c.signal })
      .then((r) => r.json())
      .then((raw) => setMarts(Marts.parse(raw)))
      .catch(() => {});
    return () => c.abort();
  }, []);
  const selected = marts?.outcome_distribution.find(
    (r) => r.profile_id === profile.id && r.n_runs === runs.length,
  );
  const decision = marts?.decision_impact
    .filter((r) => r.profile_id === profile.id)
    .sort((a, b) => b.lift - a.lift)[0];
  const children = profile.relatives.filter((r) => r.relation === 'child');
  const pct = selected ? selected.pct_child_speaks : summary.pct_child_speaks;
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let progress = 0;
    const start = performance.now();
    function draw() {
      if (!el || !ctx) return;
      const w = el.clientWidth,
        h = el.clientHeight;
      const dpi = Math.min(devicePixelRatio, 2);
      el.width = Math.round(w * dpi);
      el.height = Math.round(h * dpi);
      ctx.scale(dpi, dpi);
      ctx.clearRect(0, 0, w, h);
      const pad = 32,
        min = profile.age,
        max = Math.max(...runs.map((r) => r.death_age));
      const x = (age: number) => pad + ((age - min) / Math.max(1, max - min)) * (w - pad * 2);
      ctx.font = '11px monospace';
      for (let age = Math.ceil(min / 10) * 10; age <= max; age += 10) {
        ctx.fillStyle = '#bcafa3';
        ctx.fillText('Age ' + age, x(age) - 14, 17);
        ctx.strokeStyle = '#393337';
        ctx.beginPath();
        ctx.moveTo(x(age), 28);
        ctx.lineTo(x(age), h - 8);
        ctx.stroke();
      }
      runs.forEach((r, i) => {
        const y = 30 + ((i + 0.5) * (h - 40)) / runs.length;
        const limit = profile.age + (max - min) * progress;
        const end = x(Math.min(r.death_age, limit));
        ctx.strokeStyle = colors[r.ending_cluster ?? ''] ?? '#aaa';
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(end, y);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.globalAlpha = 1;
        for (const event of r.years) {
          if (event.protagonist_age > limit) continue;
          ctx.beginPath();
          ctx.arc(
            x(event.protagonist_age),
            y,
            event.year_index === r.years.length - 1 ? 3.3 : 1.9,
            0,
            2 * Math.PI,
          );
          ctx.fill();
        }
      });
    }
    function tick(now: number) {
      progress = reduced ? 1 : Math.min(1, (now - start) / 2800);
      draw();
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setRevealed(true);
    }
    frame = requestAnimationFrame(tick);
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [profile, runs]);
  return (
    <main className="atlas">
      <header className="film-bar">
        <Link to="/">Eulogy</Link>
        <span>Life atlas</span>
        <Link to="/you">Your profile ↗</Link>
      </header>
      <article>
        <p className="origin">
          {Object.keys(summary.generation ?? {}).join(' / ') === 'mock'
            ? 'Recorded deterministic screening'
            : 'Simulation screening'}{' '}
          · {profile.name}
        </p>
        <h1>One life, lived {runs.length} ways.</h1>
        <div className="atlas-chart">
          <canvas ref={canvas} aria-label={runs.length + ' lifelines, one dot per chapter'} />
          <ul>
            {Object.entries(summary.clusters).map(([name, n]) => (
              <li key={name}>
                <i style={{ background: colors[name] }} />
                {name.replaceAll('_', ' ')} · {n}
              </li>
            ))}
          </ul>
        </div>
        <div className={'reveal ' + (revealed ? 'ready' : '')}>
          <div>
            <small>{selected ? 'Bruin · outcome distribution' : 'Run summary'}</small>
            <h2>
              {pct == null || !children.length ? (
                'Each ending leaves a different voice in the room.'
              ) : (
                <>
                  In <em>{Number((100 - pct).toFixed(1))}%</em> of these lives,{' '}
                  {children.length === 1
                    ? children[0]!.name + ' stays silent'
                    : 'none of the children speak'}{' '}
                  at the funeral.
                </>
              )}
            </h2>
            {decision && (
              <p>
                “{decision.action}” in the first chapter was associated with{' '}
                {decision.lift > 0 ? '+' : ''}
                {decision.lift} percentage points in child speech ({decision.n} lives with the
                decision, {decision.n_without} without).
              </p>
            )}
          </div>
          <Link className="enter" to="/chapel">
            Enter the chapel →
          </Link>
        </div>
      </article>
    </main>
  );
}
