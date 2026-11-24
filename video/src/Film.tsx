import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Grain, KenBurns, Letterbox, Vignette, sec } from './ui';
import { Birth, Caption, Clip, Credits, Face, FiveLines, Ledger, LifeTag, Line, MartOverlay, PrivateLine, Reveal, ThousandLives } from './scenes';
import { BuiltWith, Rooftop, UnderTheHood } from './tech';

export const FPS = 24;
const S = (s: number) => sec(s, FPS);
export const TOTAL_SECONDS = 122;
export const TOTAL_FRAMES = S(TOTAL_SECONDS);

const CLIPS = { chapel: true, cofounder: true, leaBowed: true, leaStand: true };

const Seq: React.FC<{ at: number; len: number; children: React.ReactNode; name?: string }> = ({ at, len, children, name }) => (
  <Sequence from={S(at)} durationInFrames={S(len)} name={name} layout="none">{children}</Sequence>
);

const Score: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // main score 0–95 s: duck under the reveal (59.5–67.5), fade out 84–90 while the ending cue takes over
  const v = interpolate(t, [0, 8, 9, 43, 44, 58.5, 59.8, 67, 68, 84, 90], [0.3, 0.3, 0.5, 0.55, 0.45, 0.45, 0.04, 0.04, 0.55, 0.5, 0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/score.mp3')} volume={v} />;
};
const EndingCue: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const v = interpolate(t, [0, 4, 36, 44], [0, 0.6, 0.6, 0.0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/ending.mp3')} volume={v} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    {/* ---------- AUDIO ---------- */}
    <Score />
    <Seq at={86} len={45}><EndingCue /></Seq>
    <Sequence from={0} durationInFrames={S(12)} layout="none">
      <Audio src={staticFile('audio/heartbeat.mp3')} volume={(f) => interpolate(f, [0, S(1), S(8.5), S(11.5)], [0, 0.9, 0.9, 0], { extrapolateRight: 'clamp' })} />
    </Sequence>
    <Seq at={1.2} len={6}><Audio src={staticFile('audio/vo1.mp3')} /></Seq>
    <Seq at={9.0} len={6}><Audio src={staticFile('audio/vo2.mp3')} /></Seq>
    <Seq at={21.0} len={7.5}><Audio src={staticFile('audio/vo3b.mp3')} /></Seq>
    <Seq at={30.0} len={9.5}><Audio src={staticFile('audio/vo4.mp3')} /></Seq>
    <Seq at={43.4} len={17}><Audio src={staticFile('audio/vo_hood.mp3')} /></Seq>
    <Seq at={59.9} len={8}><Audio src={staticFile('audio/vo_reveal.mp3')} /></Seq>
    <Seq at={72.3} len={5.5}><Audio src={staticFile('audio/eulogy_cofounder.mp3')} /></Seq>
    <Seq at={83.8} len={4.5}><Audio src={staticFile('audio/vo5.mp3')} /></Seq>
    <Seq at={90.3} len={9.6}><Audio src={staticFile('audio/eulogy_lea2.mp3')} /></Seq>
    <Seq at={104.1} len={2.5}><Audio src={staticFile('audio/vo_three.mp3')} /></Seq>
    <Seq at={107.4} len={2.6}><Audio src={staticFile('audio/vo_call.mp3')} /></Seq>
    <Seq at={110.0} len={2.2}><Audio src={staticFile('audio/papa.mp3')} /></Seq>
    <Seq at={112.6} len={10.2}><Audio src={staticFile('audio/vo_close.mp3')} /></Seq>

    {/* ---------- S1 BIRTH 0–8.5 ---------- */}
    <Seq at={0} len={8.5} name="S1 Birth"><Birth len={S(8.5)} /></Seq>

    {/* ---------- S2 FIVE LINES 8.5–20.5 ---------- */}
    <Seq at={8.5} len={12} name="S2 Form"><FiveLines len={S(12)} /></Seq>
    <Seq at={15.8} len={4.5}><Caption len={S(4.5)} text="Profile → zod contract → agents: Maman, Inès, Theo, the daughter you don't have yet, Destiny. Each with goals, memory, a grievance." /></Seq>

    {/* ---------- S3 FACE 20.5–29.5 ---------- */}
    <Seq at={20.5} len={9} name="S3 Face"><Face len={S(9)} /></Seq>
    <Seq at={26.6} len={2.9}><Caption len={S(2.9)} text="Runware · FLUX.1 Kontext identity-preserving aging · TRELLIS.2 image→GLB bust in 32 s" /></Seq>

    {/* ---------- S4 THOUSAND LIVES 29.5–43 ---------- */}
    <Seq at={29.5} len={13.5} name="S4 Lives"><ThousandLives len={S(13.5)} /></Seq>
    <Seq at={33} len={3.3}><Caption len={S(3.3)} text="Monte Carlo over life trajectories · agents with continuous emotional state (valence, arousal) + episodic memory · Claude" /></Seq>
    <Seq at={36.4} len={3.3}><Caption len={S(3.3)} text="Same profile, different seed, different ending · 30 runs committed in the repo, 1,000 in the full config" /></Seq>
    <Seq at={39.8} len={3.0}><Caption len={S(3.0)} text="Eulogy rule: a relative speaks only if relationship_score ≥ 55 at the final chapter" /></Seq>

    {/* ---------- S4b UNDER THE HOOD 43–59.5 ---------- */}
    <Seq at={43} len={16.5} name="S4b Hood"><UnderTheHood len={S(16.5)} /></Seq>

    {/* ---------- S5 THE SENTENCE 59.5–67.5 (silence) ---------- */}
    <Seq at={59.5} len={8} name="S5 Reveal"><Reveal len={S(8)} /></Seq>
    <Seq at={64.6} len={2.9}><Caption len={S(2.9)} text="mart_outcome_distribution · Bruin pipeline → DuckDB · 30 runs · 13 estranged · 3 mixed · 14 reconciled" /></Seq>

    {/* ---------- S6 LIFE #001 67.5–87.5 ---------- */}
    <Seq at={67.5} len={5.8} name="S6 Chapel wide">
      {CLIPS.chapel ? <Clip src="clips/chapel.mp4" len={S(5.8)} dim={0.08} /> : <KenBurns src="img/chapel_wide.jpg" len={S(5.8)} from={1.0} to={1.06} />}
      <LifeTag len={S(5.8)} text="LIFE #001 · MOST PROBABLE · CLUSTER: ESTRANGED" />
    </Seq>
    <Seq at={72.8} len={6} name="S6 Cofounder">
      {CLIPS.cofounder ? <Clip src="clips/cofounder.mp4" len={S(6)} dim={0.12} /> : <KenBurns src="img/cofounder.jpg" len={S(6)} from={1.02} to={1.06} dim={0.1} />}
    </Seq>
    <Seq at={78.5} len={5.5} name="S6 Lea bowed">
      {CLIPS.leaBowed ? <Clip src="clips/lea_bowed.mp4" len={S(5.5)} dim={0.12} /> : <KenBurns src="img/lea_bowed.jpg" len={S(5.5)} from={1.0} to={1.05} dim={0.1} />}
    </Seq>
    <Seq at={79.7} len={4}><PrivateLine len={S(4)} text="Léa → Maman: I don't know what to say about him." /></Seq>
    <Seq at={83.7} len={4} name="S6 Bust"><KenBurns src="img/bust.jpg" len={S(4)} from={1.0} to={1.05} dim={0.15} /></Seq>
    <Seq at={72.8} len={14.7}><Ledger variant={1} len={S(14.7)} /></Seq>

    {/* ---------- S7 LIFE #212 87.5–103.5 ---------- */}
    <Seq at={87.5} len={2.6} name="S7 Title"><Line len={S(2.6)} text="Life number 212." size={48} color="rgba(236,231,218,0.85)" /></Seq>
    <Seq at={90} len={9.3} name="S7 Lea speaks">
      {CLIPS.leaStand ? <Clip src="clips/lea_stand.mp4" len={S(9.3)} dim={0.06} /> : <KenBurns src="img/lea_stand.jpg" len={S(9.3)} from={1.0} to={1.06} dim={0.05} />}
      <LifeTag len={S(9.3)} text="LIFE #212 · CLUSTER: RECONCILED" />
    </Seq>
    <Seq at={90.5} len={8.5}><Ledger variant={2} len={S(8.5)} /></Seq>
    <Seq at={99} len={4.5} name="S7 Chapel warm"><KenBurns src="img/chapel_wide.jpg" len={S(4.5)} from={1.06} to={1.0} dim={0.2} /></Seq>
    <Seq at={98.8} len={4.7}><MartOverlay len={S(4.7)} /></Seq>

    {/* ---------- S8 END 103.5–122 ---------- */}
    <Seq at={103.5} len={3.5} name="S8 Black"><AbsoluteFill style={{ background: '#000' }} /></Seq>
    <Seq at={106.8} len={6} name="S8 Rooftop"><Rooftop len={S(6)} /></Seq>
    <Seq at={112.6} len={8.2} name="S8 Built with"><BuiltWith len={S(8.2)} /></Seq>
    <Seq at={120.6} len={1.4} name="S8 Credits"><Credits len={S(1.4)} /></Seq>

    {/* ---------- GLOBAL LOOK ---------- */}
    <Vignette />
    <Grain opacity={0.07} />
    <Letterbox />
  </AbsoluteFill>
);
