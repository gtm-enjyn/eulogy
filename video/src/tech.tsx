import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Img, staticFile, Easing } from 'remotion';
import { MONO, SANS, SERIF, useFade } from './ui';

/* Real data pulled from the repo (data/runs/louis-demo.band.jsonl, bruin/eulogy/assets, data/telem/requests.json, apps/web/public/data/marts.json). */
const BAND_LINES: [string, string, string, boolean][] = [
  ['destiny', 'all', 'Age 23. An old family photograph resurfaces at a funeral.', false],
  ['jules', 'all', 'Take the late meeting — if I miss this call the round is gone.', false],
  ['maman', 'all', 'The telephone rang while the soup went cold. I waited until dark.', false],
  ['maman', '@ines', 'He only calls when he needs something. Don\'t tell him I said that.', true],
  ['theo', '@maman', 'He said things in that meeting he can\'t take back.', true],
  ['ines', '@maman', 'Does he even know what year I\'m in?', true],
  ['destiny', '@human', 'Approve the funeral? Reply yes or skip and mention Destiny.', true],
  ['destiny', 'all', 'BLOCKED: incoherent year (score jump 61 → 4). Re-rolling.', false],
];
const BRUIN_ASSETS = ['raw_runs', 'raw_years', 'raw_decisions', 'raw_relatives', 'raw_relative_states', 'raw_private_messages', 'raw_eulogies', 'stg_eulogies', 'stg_outcomes', 'mart_outcome_distribution', 'mart_decision_impact', 'mart_turning_points'];
const BRUIN_CHECKS: Record<string, string> = { raw_runs: 'not_null · unique · positive', raw_relative_states: 'between 0 and 100', raw_eulogies: 'sentiment ∈ [-1, 1]', stg_eulogies: 'accepted_values(relation)', mart_decision_impact: 'n ≥ 3' };
const TELEM: [string, string][] = [
  ['divorce prevalence among US entrepreneurs', 'Destiny needs the breakup base rate to calibrate shock weights'],
  ['alcohol-related illness prevalence, US adults', 'Destiny needs the illness base rate for a 3/10 drinker'],
  ['founder burnout prevalence cohort study', 'Destiny needs the burnout base rate for 14h/day'],
  ['startup failure rate within 5 years', 'Destiny needs the failure base rate for year 2'],
];

const Panel: React.FC<{ title: string; x: number; w: number; children: React.ReactNode; accent: string }> = ({ title, x, w, children, accent }) => (
  <div style={{ position: 'absolute', left: x, top: 185, width: w, bottom: 150, background: 'rgba(8,9,12,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${accent}`, padding: '18px 22px', overflow: 'hidden' }}>
    <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: accent, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

export const UnderTheHood: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = useFade(len, 16, 18);
  const k = len / fps / 16.5; // stretch the reveal timing with the scene length
  const t = f / fps / k;
  const bandN = Math.floor(interpolate(t, [0.3, 9], [0, BAND_LINES.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const bruinN = Math.floor(interpolate(t, [2, 11], [0, BRUIN_ASSETS.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const telemN = Math.floor(interpolate(t, [4, 12], [0, TELEM.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const bg = interpolate(f, [0, len], [1.0, 1.06]);
  return (
    <AbsoluteFill style={{ background: '#000', opacity: o }}>
      <Img src={staticFile('img/dorm.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${bg})`, filter: 'brightness(0.35) saturate(0.7)' }} />
      <Panel title="BAND ROOM · life-0001 · 6 agents" x={90} w={640} accent="#7fb2e6">
        {BAND_LINES.slice(0, bandN).map(([from, to, text, priv], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, marginBottom: 14, opacity: priv ? 0.95 : 0.8 }}>
            <div style={{ fontFamily: MONO, fontSize: 18, color: priv ? '#7fb2e6' : '#e8a35a' }}>{from}{priv ? ' ' + to : ''}</div>
            <div style={{ fontFamily: SANS, fontSize: 20, color: priv ? 'rgba(200,222,245,0.95)' : 'rgba(236,231,218,0.85)', lineHeight: 1.3, fontStyle: priv ? 'italic' : 'normal' }}>{priv ? '🔒 ' : ''}{text}</div>
          </div>
        ))}
      </Panel>
      <Panel title="$ bruin run bruin/eulogy" x={750} w={560} accent="#e8a35a">
        {BRUIN_ASSETS.slice(0, bruinN).map((a) => (
          <div key={a} style={{ fontFamily: MONO, fontSize: 18, color: 'rgba(236,231,218,0.85)', marginBottom: 9, whiteSpace: 'nowrap' }}>
            <span style={{ color: '#6fcf8f' }}>✓</span> {a.padEnd(24, ' ')}<span style={{ color: 'rgba(235,228,210,0.45)' }}>{BRUIN_CHECKS[a] ?? 'materialized'}</span>
          </div>
        ))}
        {bruinN >= BRUIN_ASSETS.length && (
          <div style={{ fontFamily: MONO, fontSize: 18, color: '#6fcf8f', marginTop: 12 }}>12 assets · 11 checks passed · lineage raw → stg → mart · DuckDB</div>
        )}
      </Panel>
      <Panel title="TELEM · OBSERVE · agent reasoning traces" x={1330} w={500} accent="#c9c2b4">
        {TELEM.slice(0, telemN).map(([q, ctx], i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 17, color: 'rgba(236,231,218,0.9)' }}>POST /v1/search · "{q}"</div>
            <div style={{ fontFamily: SANS, fontSize: 17, color: 'rgba(201,194,180,0.75)', lineHeight: 1.3 }}>context: {ctx}</div>
          </div>
        ))}
      </Panel>
    </AbsoluteFill>
  );
};

const SPONSORS: [string, string][] = [
  ['Bruin', '12 pipeline assets, 11 quality checks, lineage raw → stg → mart. The number on screen comes from mart_outcome_distribution.'],
  ['BAND', 'One room per simulated life. Public channel is the life, private @mentions are what they say behind your back. Destiny holds a veto and a human gate.'],
  ['Telem', 'Destiny fetches real base rates before rolling the dice. Every query carries the agent\'s reasoning into the Observe trace.'],
  ['Runware', 'FLUX.1 Kontext ages your face. TRELLIS.2 turns it into a 3D bust by the coffin in 32 seconds.'],
  ['Claude', 'Six agents, six chapters, continuous emotional state and episodic memory. Zod on every output, deterministic fallback, never a crash.'],
];
export const BuiltWith: React.FC<{ len: number; interval?: number; title?: boolean }> = ({ len, interval = 1.5, title = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = useFade(len, 14, 14);
  return (
    <AbsoluteFill style={{ background: '#000', opacity: o, justifyContent: 'center' }}>
      <div style={{ marginLeft: 200, width: 1520 }}>
        {title && <div style={{ fontFamily: SERIF, fontSize: 84, color: '#ece7da', letterSpacing: 6, marginBottom: 6 }}>EULOGY</div>}
        {title && <div style={{ fontFamily: SERIF, fontSize: 28, color: 'rgba(235,228,210,0.85)', marginBottom: 28 }}>A thousand lives. One decision. Yours. · github.com/louisktj/eulogy</div>}
        <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 3, color: 'rgba(235,228,210,0.55)', marginBottom: 26 }}>BUILT IN ONE DAY WITH</div>
        {SPONSORS.map(([name, text], i) => {
          const a = interpolate(f, [i * interval * fps, i * interval * fps + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, marginBottom: 22, opacity: a, transform: `translateY(${(1 - a) * 8}px)` }}>
              <div style={{ fontFamily: SERIF, fontSize: 40, color: '#e8a35a' }}>{name}</div>
              <div style={{ fontFamily: SANS, fontSize: 25, color: 'rgba(236,231,218,0.88)', lineHeight: 1.35, paddingTop: 9 }}>{text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Rooftop: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = useFade(len, 20, 16);
  const s = interpolate(f, [0, len], [1.08, 1.0], { easing: Easing.out(Easing.quad) });
  const sub = interpolate(f, [1.2 * fps, 1.5 * fps, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', opacity: o }}>
      <Img src={staticFile('img/rooftop.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 165, textAlign: 'center', opacity: sub, fontFamily: SERIF, fontSize: 40, color: '#ece7da', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>« Papa ? … C'est moi. »</div>
    </AbsoluteFill>
  );
};
