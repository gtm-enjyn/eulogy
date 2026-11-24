import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing, Sequence, OffthreadVideo, staticFile } from 'remotion';
import { Caption, KenBurns, Line, MONO, SANS, SERIF, TypeText, useFade } from './ui';

/* ---------- S1 Birth ---------- */
export const Birth: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // pulse synced to ~60bpm heartbeat
  const beat = Math.pow(Math.max(0, Math.sin((f / fps) * Math.PI * 2 * 1.0)), 6);
  const glow = interpolate(f, [0, 2 * fps], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence from={Math.round(1.6 * fps)} layout="none">
        <KenBurns src="img/i0.jpg" len={len - Math.round(1.6 * fps)} from={1.08} to={1.0} dim={0.25} fadeIn={40} fadeOut={20} />
      </Sequence>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 55%, rgba(255,184,112,${0.10 * glow + 0.12 * beat * glow}) 0%, rgba(0,0,0,0) 45%)` }} />
    </AbsoluteFill>
  );
};

/* ---------- S2 Five lines (the form) ---------- */
const FIELDS: [string, string][] = [
  ['Age · City', '31 · San Francisco'],
  ['What you actually do', 'Founder, pre-revenue. 14 hours a day.'],
  ['The thing people close to you complain about', 'Short-tempered.'],
  ['Who will be at your funeral', 'Léa, 2. "I\'m never there."'],
  ['Your biggest fear', 'Admired by strangers. Unknown to my kid.'],
];
export const FiveLines: React.FC<{ len: number }> = ({ len }) => {
  const { fps } = useVideoConfig();
  const o = useFade(len, 14, 18);
  const starts = [0.6, 2.6, 4.9, 6.9, 9.0];
  return (
    <AbsoluteFill style={{ background: '#050505', opacity: o, justifyContent: 'center' }}>
      <div style={{ marginLeft: 260, display: 'grid', gap: 34 }}>
        {FIELDS.map(([label, value], i) => {
          const sf = Math.round(starts[i] * fps);
          return (
            <Sequence key={label} from={sf} layout="none">
              <FieldRow label={label} value={value} />
            </Sequence>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
const FieldRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 20, color: 'rgba(235,228,210,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 46, color: '#ece7da' }}>
        <TypeText text={value} startFrame={6} cps={26} />
      </div>
    </div>
  );
};

/* ---------- S3 Face aging ---------- */
export const Face: React.FC<{ len: number }> = ({ len }) => {
  const { fps } = useVideoConfig();
  const third = Math.floor(len / 3);
  const ages = ['31', '56', '76'];
  const srcs = ['img/face31.jpg', 'img/face56.jpg', 'img/face76.jpg'];
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {srcs.map((s, i) => (
        <Sequence key={s} from={i * third} durationInFrames={i === 2 ? len - 2 * third : third + 12} layout="none">
          <KenBurns src={s} len={third + 12} from={1.0 + i * 0.02} to={1.04 + i * 0.02} dim={0.1} fadeIn={14} fadeOut={14} />
          <AgeTag age={ages[i]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
const AgeTag: React.FC<{ age: string }> = ({ age }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [10, 24], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', right: 120, bottom: 170, opacity: o, fontFamily: MONO, fontSize: 26, color: 'rgba(235,228,210,0.7)', letterSpacing: 2 }}>AGE {age}</div>
  );
};

/* ---------- S4 Thousand lives ---------- */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const LIVES = 64;
const lifePaths = Array.from({ length: LIVES }, (_, i) => {
  const r = rng(1000 + i * 7919);
  const pts: [number, number][] = [];
  const y0 = 40 + (i / LIVES) * 1000;
  let y = y0;
  const n = 14;
  for (let k = 0; k <= n; k++) {
    y += (r() - 0.5) * 70;
    pts.push([(k / n) * 1920, y]);
  }
  const end = r();
  const color = end < 0.08 ? '#e8a35a' : end < 0.4 ? 'rgba(127,178,230,0.55)' : 'rgba(200,190,170,0.35)';
  const death = 0.55 + r() * 0.45;
  return { pts, color, death };
});
const FEED = [
  'Camille → Anne: he wasn\'t at the birthday. Again.',
  'Jules → Camille: he said things in that meeting he can\'t take back.',
  'Anne → Léa: your father works like his father did.',
  'Léa → Camille: does he even know what grade I\'m in?',
  'Camille → Jules: I\'m not asking him anymore.',
  'Destiny: burnout, base rate 34 % (source: telem) — applied, year 9.',
  'Jules → Anne: he closed the round the week she was born.',
  'Léa → Anne: I don\'t know what to say about him.',
];
export const ThousandLives: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = useFade(len, 16, 20);
  const progress = interpolate(f, [0, len * 0.75], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const count = Math.floor(interpolate(f, [0.3 * fps, len * 0.8], [1, 1000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }));
  const feedIdx = Math.floor((f / fps) * 0.9);
  return (
    <AbsoluteFill style={{ background: '#030405', opacity: o }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {lifePaths.map((lp, i) => {
          const visible = lp.pts.filter((_, k) => k / (lp.pts.length - 1) <= Math.min(progress, lp.death));
          if (visible.length < 2) return null;
          const d = visible.map((p, k) => `${k === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
          const last = visible[visible.length - 1];
          const ended = progress >= lp.death;
          return (
            <g key={i}>
              <path d={d} stroke={lp.color} strokeWidth={1.4} fill="none" opacity={0.9} />
              {ended && <circle cx={last[0]} cy={last[1]} r={2.6} fill={lp.color} />}
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: 150, right: 110, textAlign: 'right' }}>
        <div style={{ fontFamily: SERIF, fontSize: 92, color: '#ece7da', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{count.toLocaleString('en-US')}</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: 'rgba(235,228,210,0.55)', letterSpacing: 2, marginTop: 10 }}>LIVES SIMULATED</div>
      </div>
      <div style={{ position: 'absolute', left: 90, right: 90, bottom: 235, fontFamily: MONO, fontSize: 20, color: 'rgba(235,228,210,0.5)', overflow: 'hidden', height: 30, whiteSpace: 'nowrap' }}>
        <span style={{ color: 'rgba(127,178,230,0.8)' }}>private channel</span>&nbsp;&nbsp;{FEED[feedIdx % FEED.length]}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S6/S7 Chapel with ledger + feed ---------- */
const LEDGER_1 = [
  ['33', 'Series A closes the week Léa is born. Louis takes the call from the hospital corridor.'],
  ['36', 'Camille asks him to turn down the Lyon offer. He does. She stops mentioning it.'],
  ['41', 'Refuses the exit. Shouts at Jules in front of the team. Jules leaves.'],
  ['51', 'Léa moves abroad. Calls on birthdays.'],
  ['66', 'Sells the company. Nobody to tell first.'],
];
const LEDGER_2 = [
  ['33', 'Closes the company the month Léa turns two. Tells Camille before the board.'],
  ['36', 'Takes the Lyon offer with Camille. Smaller job. Sundays become real.'],
  ['41', 'Apologizes to Jules. Out loud. They build the second one together.'],
  ['51', 'Léa calls on Tuesdays. Not birthdays.'],
  ['66', 'Retires early. Léa is the first to know.'],
];
export const Ledger: React.FC<{ variant: 1 | 2; len: number }> = ({ variant, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = variant === 1 ? LEDGER_1 : LEDGER_2;
  const o = useFade(len, 16, 16);
  return (
    <div style={{ position: 'absolute', right: 70, top: 180, width: 560, opacity: o * 0.95 }}>
      <div style={{ fontFamily: MONO, fontSize: 18, color: 'rgba(232,163,90,0.9)', letterSpacing: 2, marginBottom: 14 }}>DECISION LEDGER · LIFE #{variant === 1 ? '001' : '212'}</div>
      {rows.map(([age, text], i) => {
        const show = interpolate(f, [i * 1.6 * fps, i * 1.6 * fps + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={age} style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 12, marginBottom: 12, opacity: show }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: '#e8a35a' }}>{age}</div>
            <div style={{ fontFamily: SANS, fontSize: 20, color: 'rgba(236,231,218,0.85)', lineHeight: 1.35 }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
};
export const PrivateLine: React.FC<{ text: string; len: number }> = ({ text, len }) => {
  const o = useFade(len, 12, 12);
  return (
    <div style={{ position: 'absolute', left: 90, bottom: 160, opacity: o, fontFamily: MONO, fontSize: 22, color: 'rgba(127,178,230,0.9)' }}>
      <span style={{ opacity: 0.6 }}>private · </span>{text}
    </div>
  );
};
export const Clip: React.FC<{ src: string; len: number; dim?: number; from?: number; to?: number }> = ({ src, len, dim = 0.1, from = 1.0, to = 1.03 }) => {
  const f = useCurrentFrame();
  const o = useFade(len, 16, 16);
  const s = interpolate(f, [0, len], [from, to], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: o, background: '#000' }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})` }} />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})` }} />
    </AbsoluteFill>
  );
};

/* ---------- S5 / S7 overlays ---------- */
export const Reveal: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pct = interpolate(f, [0.4 * fps, 2.4 * fps], [0, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const o2 = interpolate(f, [2.2 * fps, 3.0 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(f, [len - 14, len], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', opacity: out }}>
      <div style={{ textAlign: 'center', maxWidth: 1400 }}>
        <div style={{ fontFamily: SERIF, fontSize: 60, color: '#ece7da', lineHeight: 1.3 }}>
          In <span style={{ fontVariantNumeric: 'tabular-nums', color: '#e8a35a' }}>{Math.round(pct)} %</span> of your lives,
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 60, color: '#ece7da', lineHeight: 1.3, opacity: o2 }}>Léa does not speak at your funeral.</div>
      </div>
    </AbsoluteFill>
  );
};
export const MartOverlay: React.FC<{ len: number }> = ({ len }) => {
  const o = useFade(len, 16, 14);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', opacity: o }}>
      <div style={{ margin: '0 0 200px 90px', maxWidth: 1000, background: 'rgba(0,0,0,0.55)', padding: '26px 30px', borderLeft: '3px solid #e8a35a' }}>
        <div style={{ fontFamily: SERIF, fontSize: 38, color: '#ece7da', lineHeight: 1.3 }}>
          In 100 % of the lives where Léa speaks, you made one decision before 33.
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 38, color: '#e8a35a', lineHeight: 1.3, marginTop: 6 }}>In 94 %, the same one.</div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: 'rgba(235,228,210,0.6)', marginTop: 16 }}>mart_decision_impact · lift per year-1 decision · DuckDB · lineage raw.runs → stg_eulogies → mart_decision_impact</div>
      </div>
    </AbsoluteFill>
  );
};
export const LifeTag: React.FC<{ text: string; len: number }> = ({ text, len }) => {
  const o = useFade(len, 10, 10);
  return <div style={{ position: 'absolute', left: 90, top: 170, opacity: o, fontFamily: MONO, fontSize: 22, color: 'rgba(235,228,210,0.75)', letterSpacing: 2 }}>{text}</div>;
};
export const Credits: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 18, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', opacity: o }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 96, color: '#ece7da', letterSpacing: 6 }}>EULOGY</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: 'rgba(235,228,210,0.6)', letterSpacing: 3, marginTop: 10 }}>TRACK 1 · AGENT ANIMATED FILM</div>
        <div style={{ fontFamily: SANS, fontSize: 26, color: 'rgba(235,228,210,0.85)', marginTop: 46, letterSpacing: 1 }}>Bruin &nbsp;·&nbsp; BAND &nbsp;·&nbsp; Telem &nbsp;·&nbsp; Runware &nbsp;·&nbsp; Claude</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: 'rgba(235,228,210,0.5)', marginTop: 22 }}>github.com/gtm-enjyn/eulogy</div>
      </div>
    </AbsoluteFill>
  );
};
export { Caption, Line };
