import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Grain, KenBurns, Letterbox, Vignette, sec } from './ui';
import { Caption, Clip, Credits, Face, FiveLines, Ledger, PrivateLine, Reveal, ThousandLives } from './scenes';
import { BuiltWith, Rooftop, UnderTheHood } from './tech';
import { Chapter, MartQuery, NameCard, OpenCard, Question, Statement } from './final';

export const FPS = 24;
const S = (s: number) => sec(s, FPS);
export const TOTAL_SECONDS = 146.5;
export const TOTAL_FRAMES = S(TOTAL_SECONDS);

const CLIPS = { tableEmpty: true, tableFull: true };

const Seq: React.FC<{ at: number; len: number; children: React.ReactNode; name?: string }> = ({ at, len, children, name }) => (
  <Sequence from={S(at)} durationInFrames={S(len)} name={name} layout="none">{children}</Sequence>
);
const VO: React.FC<{ at: number; src: string; len?: number }> = ({ at, src, len = 25 }) => (
  <Seq at={at} len={len}><Audio src={staticFile(`audio/${src}.mp3`)} /></Seq>
);

const Score: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // 0–95 s: under the reveal (72–79) nearly silent; fade out 92–97 while the ending cue takes over
  const v = interpolate(t, [0, 10, 11, 60, 61, 72.5, 73.8, 80, 81, 93.5, 98.5], [0.28, 0.28, 0.45, 0.5, 0.42, 0.42, 0.04, 0.04, 0.5, 0.5, 0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/score.mp3')} volume={v} />;
};
const EndingCue: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const v = interpolate(t, [0, 5, 40, 45], [0, 0.6, 0.6, 0.0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/ending.mp3')} volume={v} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    {/* ---------- AUDIO ---------- */}
    <Score />
    <Seq at={97.5} len={45}><EndingCue /></Seq>
    <Sequence from={0} durationInFrames={S(11)} layout="none">
      <Audio src={staticFile('audio/heartbeat.mp3')} volume={(f) => interpolate(f, [0, S(1), S(7), S(10.5)], [0, 0.7, 0.7, 0], { extrapolateRight: 'clamp' })} />
    </Sequence>
    <VO at={0.8} src="n1" />
    <VO at={11.0} src="n2" />
    <VO at={25.8} src="n3" />
    <VO at={32.3} src="n4" />
    <VO at={38.8} src="n5" />
    <VO at={61.3} src="n6" />
    <VO at={73.9} src="n7" />
    <VO at={81.3} src="n8" />
    <VO at={98.2} src="n9" />
    <VO at={105.3} src="n10" />
    <VO at={117.1} src="toast" />
    <VO at={121.3} src="n12" />
    <VO at={125.8} src="n13" />
    <VO at={130.8} src="papa" />
    <VO at={135.5} src="n14" />

    {/* ---------- 1. COLD OPEN 0–10.5 : the dorm, tonight ---------- */}
    <Seq at={0} len={10.5} name="1 Dorm">
      <KenBurns src="img/dorm.jpg" len={S(10.5)} from={1.1} to={1.0} dim={0.3} fadeIn={36} fadeOut={14} />
      <OpenCard len={S(10.5)} />
    </Seq>

    {/* ---------- 2. WHO HE IS 10.5–25.5 ---------- */}
    <Seq at={10.5} len={4.8} name="2 Portrait">
      <KenBurns src="img/jules20.jpg" len={S(4.8)} from={1.0} to={1.05} dim={0.1} fadeIn={12} fadeOut={12} />
      <NameCard name="JULES" sub="20 · PARIS → CHICAGO · CS & DATA" len={S(4.8)} />
    </Seq>
    <Seq at={15.2} len={10.3} name="2 Form"><FiveLines len={S(10.3)} /></Seq>
    <Seq at={21.2} len={4.2}><Caption len={S(4.2)} text="Profile → zod contract → five agents: Maman, Inès, Theo, Papa, Destiny. Each with goals, memory, a grievance." /></Seq>

    {/* ---------- 3. THE QUESTION 25.5–32 ---------- */}
    <Seq at={25.5} len={6.5} name="3 Question"><Question len={S(6.5)} /></Seq>

    {/* ---------- 4. AGING 32–38.5 ---------- */}
    <Seq at={32} len={6.5} name="4 Face"><Face len={S(6.5)} /></Seq>
    <Seq at={35.4} len={3}><Caption len={S(3)} text="Runware · FLUX.1 Kontext identity-preserving aging · TRELLIS.2 image→GLB bust in 32 s" /></Seq>

    {/* ---------- 5. THE AGENTS 38.5–61 ---------- */}
    <Seq at={38.5} len={22.5} name="5 Hood"><UnderTheHood len={S(22.5)} /></Seq>
    <Seq at={38.5} len={22.5}><Chapter n="HOW IT WORKS" title="5 AGENTS · 1 ROOM PER LIFE · 1 PIPELINE" len={S(22.5)} /></Seq>

    {/* ---------- 6. A THOUSAND TIMES 61–72 ---------- */}
    <Seq at={61} len={12.5} name="6 Lives"><ThousandLives len={S(12.5)} /></Seq>
    <Seq at={64.5} len={3.4}><Caption len={S(3.4)} text="Monte Carlo over life trajectories · same profile, new seed, new ending · 30 runs committed, 1,000 in the full config" /></Seq>
    <Seq at={68.1} len={3.4}><Caption len={S(3.4)} text="Table rule: a relative sits at the table at 70 only if relationship_score ≥ 55 in the last chapter" /></Seq>

    {/* ---------- 7. THE NUMBER 72–79 (silence) ---------- */}
    <Seq at={73.5} len={7} name="7 Reveal"><Reveal len={S(7)} /></Seq>
    <Seq at={77.7} len={2.6}><Caption len={S(2.6)} text="mart_outcome_distribution · Bruin → DuckDB · 30 runs · 13 estranged · 3 mixed · 14 reconciled" /></Seq>

    {/* ---------- 8. LIFE #001 79–96.5 ---------- */}
    <Seq at={80.5} len={6.2} name="8 Table empty clip">
      {CLIPS.tableEmpty ? <Clip src="clips/table_empty.mp4" len={S(6.2)} dim={0.1} /> : <KenBurns src="img/table_empty.jpg" len={S(6.2)} from={1.0} to={1.05} dim={0.1} />}
    </Seq>
    <Seq at={86.5} len={11.5} name="8 Table empty still"><KenBurns src="img/table_empty.jpg" len={S(11.5)} from={1.05} to={1.12} dim={0.2} fadeIn={14} fadeOut={14} /></Seq>
    <Seq at={80.7} len={17.2}><Chapter n="LIFE #001" title="THE MOST LIKELY ONE" len={S(17.2)} /></Seq>
    <Seq at={83.8} len={14.1}><Ledger variant={1} len={S(14.1)} interval={3.6} /></Seq>
    <Seq at={88} len={4}><PrivateLine len={S(4)} text="Inès → Maman: does he even know what year I'm in?" /></Seq>

    {/* ---------- 9. THE PIPELINE COMPARES 96.5–103.5 ---------- */}
    <Seq at={98} len={7} name="9 Mart"><MartQuery len={S(7)} /></Seq>

    {/* ---------- 10. LIFE #212 103.5–119.5 ---------- */}
    <Seq at={105} len={7.2} name="10 Table full clip">
      {CLIPS.tableFull ? <Clip src="clips/table_full.mp4" len={S(7.2)} dim={0.04} /> : <KenBurns src="img/table_full.jpg" len={S(7.2)} from={1.0} to={1.05} dim={0.04} />}
    </Seq>
    <Seq at={112} len={9} name="10 Table full still"><KenBurns src="img/table_full.jpg" len={S(9)} from={1.05} to={1.1} dim={0.08} fadeIn={14} fadeOut={16} /></Seq>
    <Seq at={105.2} len={15.6}><Chapter n="LIFE #212" title="THE TABLE IS FULL" len={S(15.6)} /></Seq>
    <Seq at={107} len={13.5}><Ledger variant={2} len={S(13.5)} interval={2.7} /></Seq>
    <Seq at={116.9} len={4}><PrivateLine len={S(4)} text="Inès, standing: « To my brother. Who learned to call first. »" /></Seq>

    {/* ---------- 11. WHAT IT IS 119.5–124 ---------- */}
    <Seq at={121} len={4.6} name="11 Statement"><Statement len={S(4.6)} lines={["That's the product.", 'Not a prediction.', 'A rehearsal.']} accentLast /></Seq>

    {/* ---------- 12. TONIGHT 124–133.5 ---------- */}
    <Seq at={125.5} len={3.8} name="12 Laptop"><KenBurns src="img/laptop.jpg" len={S(3.8)} from={1.0} to={1.06} dim={0.15} fadeIn={12} fadeOut={12} /></Seq>
    <Seq at={129.1} len={6.2} name="12 Rooftop"><Rooftop len={S(6.2)} /></Seq>

    {/* ---------- 13. BUILT WITH + TITLE 133.5–145 ---------- */}
    <Seq at={135.1} len={8.6} name="13 Built with"><BuiltWith len={S(8.6)} /></Seq>
    <Seq at={143.5} len={3} name="13 Credits"><Credits len={S(3)} /></Seq>

    {/* ---------- GLOBAL LOOK ---------- */}
    <Vignette />
    <Grain opacity={0.07} />
    <Letterbox />
  </AbsoluteFill>
);
