import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { MONO, SANS, SERIF, TypeText, useFade } from './ui';

/** Lower-left name card: "JULES · 20 · Paris → Chicago". */
export const NameCard: React.FC<{ name: string; sub: string; len: number; right?: boolean }> = ({ name, sub, len, right }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12, len - 12, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const x = interpolate(f, [0, 12], [-14, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <div style={{ position: 'absolute', [right ? 'right' : 'left']: 110, bottom: 190, opacity: o, transform: `translateX(${x}px)`, borderLeft: right ? undefined : '3px solid #e8a35a', borderRight: right ? '3px solid #e8a35a' : undefined, paddingLeft: right ? 0 : 18, paddingRight: right ? 18 : 0, textAlign: right ? 'right' : 'left' }}>
      <div style={{ fontFamily: SERIF, fontSize: 46, color: '#ece7da', letterSpacing: 1, lineHeight: 1.05, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 20, color: 'rgba(235,228,210,0.75)', letterSpacing: 2, marginTop: 8, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{sub}</div>
    </div>
  );
};

/** Small chapter label, top-left. */
export const Chapter: React.FC<{ n: string; title: string; len: number }> = ({ n, title, len }) => {
  const o = useFade(len, 10, 10);
  return (
    <div style={{ position: 'absolute', left: 90, top: 160, opacity: o, display: 'flex', gap: 14, alignItems: 'baseline' }}>
      <span style={{ fontFamily: MONO, fontSize: 20, color: '#e8a35a', letterSpacing: 2 }}>{n}</span>
      <span style={{ fontFamily: MONO, fontSize: 20, color: 'rgba(235,228,210,0.7)', letterSpacing: 2 }}>{title}</span>
    </div>
  );
};

/** Black screen, one typed question. */
export const Question: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [len - 14, len], [1, 0], { extrapolateLeft: 'clamp' });
  const line2 = interpolate(f, [2.9 * fps, 3.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', opacity: out }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 64, color: '#ece7da', lineHeight: 1.25 }}>
          <TypeText text="Who will be at your table" startFrame={Math.round(0.6 * fps)} cps={22} cursor={false} />
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 64, color: '#e8a35a', lineHeight: 1.25, opacity: line2 }}>when you're seventy?</div>
      </div>
    </AbsoluteFill>
  );
};

/** Opening card: place and date, typed. */
export const OpenCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = interpolate(f, [0, 8, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 110, top: 190, opacity: o, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: 'rgba(235,228,210,0.85)', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
      <TypeText text="THANKSGIVING · 2026 · CHICAGO · 11:12 PM" startFrame={Math.round(0.4 * fps)} cps={24} cursor={false} />
    </div>
  );
};

/** The Bruin mart query, typed in a terminal with results appearing. Real numbers from marts.json. */
const ROWS: [string, string, string, string][] = [
  ['Ask for help', '70.0 %', '50.0 %', '+20'],
  ['Protect one evening at home', '62.5 %', '54.5 %', '+8'],
  ['Take the late meeting', '41.7 %', '66.7 %', '−25'],
];
export const MartQuery: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = useFade(len, 10, 12);
  const k = len / fps / 7; // authored for 7 s
  const rowsShown = Math.floor(interpolate(f, [3.2 * k * fps, 4.6 * k * fps], [0, ROWS.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const hl = interpolate(f, [4.8 * k * fps, 5.4 * k * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#050607', opacity: o, justifyContent: 'center' }}>
      <div style={{ marginLeft: 160, width: 1600 }}>
        <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 2, color: '#e8a35a', marginBottom: 22 }}>BRUIN · DUCKDB · mart_decision_impact · lineage raw.runs → raw.decisions → stg_eulogies → mart</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: 'rgba(236,231,218,0.9)', lineHeight: 1.5 }}>
          <span style={{ color: '#6fcf8f' }}>$</span>{' '}
          <TypeText text={`bruin query -c duckdb-default -q "select action, pct_speaks_with, pct_speaks_without, lift from mart_decision_impact order by lift desc"`} startFrame={4} cps={Math.round(60 / k)} cursor={false} />
        </div>
        <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 24, color: 'rgba(236,231,218,0.85)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '560px 260px 260px 140px', color: 'rgba(235,228,210,0.5)', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', opacity: rowsShown > 0 ? 1 : 0 }}>
            <span>action (year 1)</span><span>table full · with</span><span>without</span><span>lift</span>
          </div>
          {ROWS.slice(0, rowsShown).map(([a, w, wo, l], i) => (
            <div key={a} style={{ display: 'grid', gridTemplateColumns: '560px 260px 260px 140px', padding: '10px 0', background: i === 0 ? `rgba(232,163,90,${0.14 * hl})` : 'transparent', color: i === 0 ? '#ece7da' : 'rgba(236,231,218,0.8)' }}>
              <span>{a}</span><span>{w}</span><span>{wo}</span><span style={{ color: l.startsWith('+') ? '#6fcf8f' : '#e07a5f' }}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, fontFamily: SANS, fontSize: 20, color: 'rgba(235,228,210,0.6)', opacity: hl }}>n = 30 runs · 11 quality checks passed · the same query runs on 1,000 runs in the full config</div>
      </div>
    </AbsoluteFill>
  );
};

/** A single line of text on black, used for "That's the product." */
export const Statement: React.FC<{ lines: string[]; len: number; accentLast?: boolean }> = ({ lines, len, accentLast }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [len - 14, len], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', opacity: out }}>
      <div style={{ textAlign: 'center' }}>
        {lines.map((l, i) => {
          const o = interpolate(f, [(0.4 + i * 1.1) * fps, (0.8 + i * 1.1) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <div key={l} style={{ fontFamily: SERIF, fontSize: 58, lineHeight: 1.3, color: accentLast && i === lines.length - 1 ? '#e8a35a' : '#ece7da', opacity: o }}>{l}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
