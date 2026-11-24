import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { MONO, SANS, SERIF, useFade } from './ui';

/* Demo fixtures mirroring apps/web/src/v2/connectData.ts */
const SOURCES: [string, string, string][] = [
  ['WhatsApp', '184 chats', '12,431 messages'],
  ['Instagram', '96 chats', '8,204 messages'],
  ['iMessage', '41 chats', '22,907 messages'],
  ['Snapchat', '58 chats', '3,118 messages'],
  ['Gmail', '1,204 threads', '2019 → 2026'],
];
const LOG = [
  'parsing whatsapp export (zip) … 184 chats',
  'normalizing 46,660 messages → 46,660 rows · dedupe 312',
  'language detect: fr 71 % · en 29 %',
  'embedding 46,660 messages · bge-m3 · 1,024-d · local',
  'per-contact features: volume · reply latency p50 · initiative ratio · valence · last contact',
  'clustering 312 contacts → 5 core · 19 close · 288 periphery',
  'extracting grievances: negative-valence messages addressed to you',
  'writing 4,812 memory vectors → 5 agents · done',
];
const PEOPLE: [string, string, string, string, string][] = [
  ['M', 'Maman', 'mother · 52', '6,412 msgs · you write first 18 %', '« Dis-moi juste si tu viens à Noël. »'],
  ['P', 'Papa', 'father · 55', '231 msgs · last real talk 4 months ago', '« Tu appelles quand tu as besoin de quelque chose. »'],
  ['I', 'Inès', 'sister · 16', '3,980 msgs · 61 % emoji-only', '« Tu sais même pas en quelle année je suis. »'],
  ['T', 'Theo', 'best friend · cofounder · 21', '18,207 msgs · 2 am peaks', '« Tu m\'as parlé comme à un stagiaire devant tout le monde. »'],
  ['C', 'Camille', 'partner · 21', '14,118 msgs · initiative 22 %', '« Je ne demande plus, c\'est plus simple. »'],
];

export const ConnectScene: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = len / fps / 10.6; // phases authored for a 10.6 s scene, stretched to len
  const t = f / fps / k;
  const o = useFade(len, 14, 16);
  // phases: 0–3.2 s sources connect one by one · 3.2–7.2 s console · 7.2–end people
  const connected = Math.floor(interpolate(t, [0.3, 3.0], [0, SOURCES.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const logN = Math.floor(interpolate(t, [3.3, 7.0], [0, LOG.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const embed = interpolate(t, [4.4, 6.2], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const peopleN = Math.floor(interpolate(t, [7.4, 9.6], [0, PEOPLE.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const consoleY = interpolate(t, [7.2, 7.9], [0, -40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: '#07080b', opacity: o }}>
      <div style={{ position: 'absolute', left: 90, top: 160, fontFamily: MONO, fontSize: 19, letterSpacing: 3, color: 'rgba(235,228,210,0.65)' }}>02 · YOUR CONVERSATIONS · PROCESSED LOCALLY</div>
      <div style={{ position: 'absolute', left: 90, top: 196, fontFamily: SERIF, fontSize: 40, color: '#ece7da' }}>Who do you actually talk to?</div>
      {/* sources */}
      <div style={{ position: 'absolute', left: 90, top: 262, display: 'flex', gap: 14 }}>
        {SOURCES.map(([name, a, b], i) => {
          const on = i < connected;
          return (
            <div key={name} style={{ width: 332, height: 96, border: `1px solid ${on ? 'rgba(111,207,143,0.6)' : 'rgba(255,255,255,0.12)'}`, background: on ? 'rgba(111,207,143,0.06)' : 'rgba(255,255,255,0.03)', padding: '14px 18px', transition: 'all .3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: SANS, fontSize: 22, color: '#ece7da', fontWeight: 600 }}>{name}</span>
                <span style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 1.5, color: on ? '#6fcf8f' : 'rgba(235,228,210,0.45)' }}>{on ? '● CONNECTED' : 'CONNECT'}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 15, color: 'rgba(235,228,210,0.6)', marginTop: 12, opacity: on ? 1 : 0 }}>{a} · {b}</div>
            </div>
          );
        })}
      </div>
      {/* console */}
      <div style={{ position: 'absolute', left: 90, top: 384 + consoleY, width: 1716, height: 230, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px', overflow: 'hidden', opacity: t > 3.2 ? 1 : 0 }}>
        {LOG.slice(0, logN).map((l, i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 17, color: i === logN - 1 ? '#ece7da' : 'rgba(235,228,210,0.6)', lineHeight: 1.55 }}>
            <span style={{ color: '#6fcf8f' }}>›</span> {l}
            {i === 3 && (
              <span style={{ display: 'inline-block', width: 260, height: 8, background: 'rgba(255,255,255,0.08)', marginLeft: 14, verticalAlign: 'middle' }}>
                <span style={{ display: 'block', width: `${embed}%`, height: '100%', background: '#e8a35a' }} />
              </span>
            )}
          </div>
        ))}
      </div>
      {/* people */}
      <div style={{ position: 'absolute', left: 90, top: 640, display: 'flex', gap: 14 }}>
        {PEOPLE.slice(0, peopleN).map(([ini, name, rel, stat, quote]) => (
          <div key={name} style={{ width: 332, height: 230, border: '1px solid rgba(232,163,90,0.35)', background: 'rgba(232,163,90,0.05)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(232,163,90,0.18)', border: '1px solid rgba(232,163,90,0.6)', display: 'grid', placeItems: 'center', fontFamily: SERIF, fontSize: 22, color: '#e8a35a' }}>{ini}</div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 26, color: '#ece7da', lineHeight: 1 }}>{name}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(235,228,210,0.55)', letterSpacing: 1, marginTop: 5 }}>{rel.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: 'rgba(235,228,210,0.6)', marginTop: 14 }}>{stat}</div>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: '#7fb2e6', fontStyle: 'italic', marginTop: 14, lineHeight: 1.3 }}>{quote}</div>
          </div>
        ))}
      </div>
      {peopleN >= PEOPLE.length && (
        <div style={{ position: 'absolute', right: 110, top: 200, fontFamily: SERIF, fontSize: 30, color: '#e8a35a', opacity: interpolate(t, [9.8, 10.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>The five people at your table →</div>
      )}
    </AbsoluteFill>
  );
};
