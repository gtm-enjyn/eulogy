import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Grain, KenBurns, Letterbox, Vignette, sec } from './ui';
import { Caption, Clip, Face, Ledger, PrivateLine, Reveal, ThousandLives } from './scenes';
import { BuiltWith, Rooftop, UnderTheHood } from './tech';
import { Chapter, MartQuery, NameCard, OpenCard, Question } from './final';
import { ConnectScene } from './connect';

export const FPS = 24;
const S = (s: number) => sec(s, FPS);
export const TOTAL_SECONDS = 90.6;
export const TOTAL_FRAMES = S(TOTAL_SECONDS);

const Seq: React.FC<{ at: number; len: number; children: React.ReactNode; name?: string }> = ({ at, len, children, name }) => (
  <Sequence from={S(at)} durationInFrames={S(len)} name={name} layout="none">{children}</Sequence>
);
const VO: React.FC<{ at: number; src: string; len?: number }> = ({ at, src, len = 20 }) => (
  <Seq at={at} len={len}><Audio src={staticFile(`audio/${src}.mp3`)} /></Seq>
);

const Score: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const v = interpolate(t, [0, 8, 9, 50, 51.199999999999996, 52.0, 55.800000000000004, 56.800000000000004, 72.5, 76.5], [0.3, 0.3, 0.5, 0.52, 0.5, 0.04, 0.04, 0.5, 0.5, 0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/score.mp3')} volume={v} />;
};
const EndingCue: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const v = interpolate(t, [0, 4, 20, 26], [0, 0.62, 0.62, 0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/ending.mp3')} volume={v} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Score />
    <Seq at={72.5} len={26}><EndingCue /></Seq>
    <Sequence from={0} durationInFrames={S(9)} layout="none">
      <Audio src={staticFile('audio/heartbeat.mp3')} volume={(f) => interpolate(f, [0, S(1), S(6), S(8.5)], [0, 0.6, 0.6, 0], { extrapolateRight: 'clamp' })} />
    </Sequence>
    <VO at={0.3} src="s1_f" />
    <VO at={8.2} src="n3_f" />
    <VO at={14.1} src="s_connect_f" />
    <VO at={28.8} src="n4_f" />
    <VO at={34.400000000000006} src="s_agents_f" />
    <VO at={51.6} src="n7_f" />
    <VO at={56.400000000000006} src="s_life1_f" />
    <VO at={65.19999999999999} src="s_pipeline_f" />
    <VO at={68.7} src="s_life212_f" />
    <VO at={77.0} src="toast_f" />
    <VO at={81.10000000000001} src="papa" />
    <VO at={84.3} src="s_close_f" />

    {/* 1 · tonight */}
    <Seq at={0.0} len={8.0} name="1 Dorm">
      <KenBurns src="img/dorm.jpg" len={S(8.0)} from={1.1} to={1.0} dim={0.3} fadeIn={30} fadeOut={12} />
      <OpenCard len={S(8.0)} />
      <NameCard name="JULES" sub="20 · PARIS → CHICAGO · CS & DATA" len={S(8.0)} right />
    </Seq>
    {/* 2 · the question */}
    <Seq at={8.0} len={5.9} name="2 Question"><Question len={S(5.9)} /></Seq>
    {/* 3 · conversations */}
    <Seq at={13.9} len={14.700000000000001} name="3 Connect"><ConnectScene len={S(14.700000000000001)} /></Seq>
    <Seq at={24.4} len={4.100000000000001}><Caption len={S(4.100000000000001)} right text="WhatsApp · Instagram · iMessage · Snapchat · Gmail exports, parsed in the browser · 46,660 messages → 5 agents, 4,812 memories" /></Seq>
    {/* 4 · aging */}
    <Seq at={28.6} len={5.600000000000001} name="4 Face"><Face len={S(5.600000000000001)} /></Seq>
    <Seq at={31.200000000000003} len={2.8000000000000016}><Caption len={S(2.8000000000000016)} text="Runware · FLUX.1 Kontext identity-preserving aging · TRELLIS.2 image→GLB bust" /></Seq>
    {/* 5 · agents */}
    <Seq at={34.2} len={10.0} name="5 Hood"><UnderTheHood len={S(10.0)} /></Seq>
    <Seq at={34.2} len={10.0}><Chapter n="HOW IT WORKS" title="6 AGENTS · 1 ROOM PER LIFE · 1 PIPELINE" len={S(10.0)} /></Seq>
    {/* 6 · a thousand times */}
    <Seq at={44.2} len={7.199999999999996} name="6 Lives"><ThousandLives len={S(7.199999999999996)} /></Seq>
    <Seq at={45.7} len={5.399999999999996}><Caption len={S(5.399999999999996)} text="Monte Carlo over life trajectories · same profile, new seed, new ending · a relative sits at the table at 70 only if relationship_score ≥ 55" /></Seq>
    {/* 7 · the number */}
    <Seq at={51.4} len={4.800000000000004} name="7 Reveal"><Reveal len={S(4.800000000000004)} /></Seq>
    <Seq at={54.0} len={2.100000000000004}><Caption len={S(2.100000000000004)} text="mart_outcome_distribution · Bruin → DuckDB · 30 runs · 13 estranged · 3 mixed · 14 reconciled" /></Seq>
    {/* 8 · life #001 */}
    <Seq at={56.2} len={6.2} name="8 Table empty clip"><Clip src="clips/table_empty.mp4" len={S(6.2)} dim={0.1} /></Seq>
    <Seq at={62.2} len={2.9} name="8 Table empty still"><KenBurns src="img/table_empty.jpg" len={S(2.9)} from={1.05} to={1.1} dim={0.2} fadeIn={10} fadeOut={10} /></Seq>
    <Seq at={56.400000000000006} len={8.7}><Chapter n="LIFE #001" title="THE MOST LIKELY ONE" len={S(8.7)} /></Seq>
    <Seq at={57.6} len={7.5}><Ledger variant={1} len={S(7.5)} interval={1.7} /></Seq>
    <Seq at={59.400000000000006} len={3.4}><PrivateLine len={S(3.4)} text="Inès → Maman: does he even know what year I'm in?" /></Seq>
    {/* 9 · the pipeline compares */}
    <Seq at={65.1} len={3.4} name="9 Mart"><MartQuery len={S(3.4)} /></Seq>
    {/* 10 · life #212 */}
    <Seq at={68.5} len={7.2} name="10 Table full clip"><Clip src="clips/table_full.mp4" len={S(7.2)} dim={0.04} /></Seq>
    <Seq at={75.5} len={4.4} name="10 Table full still"><KenBurns src="img/table_full.jpg" len={S(4.4)} from={1.05} to={1.1} dim={0.08} fadeIn={10} fadeOut={12} /></Seq>
    <Seq at={68.7} len={11.2}><Chapter n="LIFE #212" title="THE TABLE IS FULL" len={S(11.2)} /></Seq>
    <Seq at={69.7} len={10.2}><Ledger variant={2} len={S(10.2)} interval={1.8} /></Seq>
    <Seq at={76.9} len={3.0}><PrivateLine len={S(3.0)} text="Inès, standing: « To my brother. Who learned to call first. »" /></Seq>
    {/* 11 · tonight, again */}
    <Seq at={79.9} len={4.2} name="11 Rooftop"><Rooftop len={S(4.2)} /></Seq>
    {/* 12 · built with + title */}
    <Seq at={84.1} len={6.5} name="12 Built with"><BuiltWith len={S(6.5)} interval={0.75} title /></Seq>

    <Vignette />
    <Grain opacity={0.07} />
    <Letterbox />
  </AbsoluteFill>
);
