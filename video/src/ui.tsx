import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

export const SERIF = 'Georgia, "Times New Roman", serif';
export const MONO = '"SF Mono", Menlo, Consolas, monospace';
export const SANS = 'Inter, -apple-system, "Helvetica Neue", Arial, sans-serif';

export const sec = (s: number, fps: number) => Math.round(s * fps);

/** Fade helper: 0→1 over `inF` frames at start, 1→0 over `outF` frames at the end of `len`. */
export const useFade = (len: number, inF = 18, outF = 18) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, inF], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b = interpolate(f, [len - outF, len], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return Math.min(a, b);
};

export const Letterbox: React.FC = () => {
  const bar = (1080 - 1080 / 1.35) / 2; // ~2.0:1 feel on 16:9, keeps faces big
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000' }} />
    </>
  );
};

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => {
  const f = useCurrentFrame();
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 1000} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  );
};

export const Vignette: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)', pointerEvents: 'none' }} />
);

/** Still image with a slow push-in and optional drift. */
export const KenBurns: React.FC<{ src: string; len: number; from?: number; to?: number; dx?: number; dy?: number; dim?: number; fadeIn?: number; fadeOut?: number }> = ({ src, len, from = 1.0, to = 1.05, dx = 0, dy = 0, dim = 0, fadeIn = 18, fadeOut = 18 }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, len], [from, to], { easing: Easing.inOut(Easing.quad), extrapolateRight: 'clamp' });
  const x = interpolate(f, [0, len], [0, dx]);
  const y = interpolate(f, [0, len], [0, dy]);
  const o = useFade(len, fadeIn, fadeOut);
  return (
    <AbsoluteFill style={{ opacity: o, background: '#000' }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s}) translate(${x}px, ${y}px)` }} />
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})` }} />}
    </AbsoluteFill>
  );
};

/** Text revealed character by character. */
export const TypeText: React.FC<{ text: string; startFrame?: number; cps?: number; style?: React.CSSProperties; cursor?: boolean }> = ({ text, startFrame = 0, cps = 28, style, cursor = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - startFrame) / fps) * cps)));
  const done = n >= text.length;
  const blink = Math.floor(f / 12) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {cursor && (!done || blink) && <span style={{ opacity: 0.8 }}>▍</span>}
    </span>
  );
};

/** Small monospace technical caption, bottom-left, fades in/out within its own Sequence. */
export const Caption: React.FC<{ text: string; len: number; right?: boolean }> = ({ text, len, right }) => {
  const o = useFade(len, 10, 12);
  return (
    <div style={{ position: 'absolute', bottom: 150, [right ? 'right' : 'left']: 90, maxWidth: 820, opacity: o, fontFamily: MONO, fontSize: 21, letterSpacing: 0.2, color: 'rgba(235,228,210,0.78)', lineHeight: 1.45, borderLeft: right ? undefined : '2px solid rgba(232,163,90,0.8)', borderRight: right ? '2px solid rgba(232,163,90,0.8)' : undefined, paddingLeft: right ? 0 : 16, paddingRight: right ? 16 : 0, textAlign: right ? 'right' : 'left' }}>
      {text}
    </div>
  );
};

/** Centered serif line on black. */
export const Line: React.FC<{ text: string; len: number; size?: number; delay?: number; color?: string }> = ({ text, len, size = 54, delay = 0, color = '#ece7da' }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [delay, delay + 20, len - 16, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: o }}>
      <div style={{ fontFamily: SERIF, fontSize: size, color, textAlign: 'center', maxWidth: 1300, lineHeight: 1.25, letterSpacing: 0.3 }}>{text}</div>
    </AbsoluteFill>
  );
};
