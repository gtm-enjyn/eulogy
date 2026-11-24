import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Grain, KenBurns, Letterbox, Vignette, sec } from './ui';
import { Birth, Caption, Clip, Credits, Face, FiveLines, Ledger, LifeTag, Line, MartOverlay, PrivateLine, Reveal, ThousandLives } from './scenes';

export const FPS = 24;
const S = (s: number) => sec(s, FPS);
export const TOTAL_SECONDS = 98;
export const TOTAL_FRAMES = S(TOTAL_SECONDS);

// Flip to false if a generated clip is unusable; the still with push-in takes over.
const CLIPS = { chapel: true, cofounder: true, leaBowed: true, leaStand: true };

const Seq: React.FC<{ at: number; len: number; children: React.ReactNode; name?: string }> = ({ at, len, children, name }) => (
  <Sequence from={S(at)} durationInFrames={S(len)} name={name} layout="none">{children}</Sequence>
);

const Score: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const v = interpolate(t, [0, 8, 9, 44, 45.2, 51.5, 52.5, 83, 88, 90, 95], [0.3, 0.3, 0.5, 0.55, 0.05, 0.05, 0.55, 0.55, 0.35, 0.25, 0], { extrapolateRight: 'clamp' });
  return <Audio src={staticFile('audio/score.mp3')} volume={v} />;
};

export const Film: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* ---------- AUDIO ---------- */}
      <Score />
      <Sequence from={0} durationInFrames={S(12)} layout="none">
        <Audio src={staticFile('audio/heartbeat.mp3')} volume={(f) => interpolate(f, [0, S(1), S(8.5), S(11.5)], [0, 0.9, 0.9, 0], { extrapolateRight: 'clamp' })} />
      </Sequence>
      <Seq at={1.2} len={6}><Audio src={staticFile('audio/vo1.mp3')} volume={1} /></Seq>
      <Seq at={9.0} len={6}><Audio src={staticFile('audio/vo2.mp3')} volume={1} /></Seq>
      <Seq at={21.0} len={7.5}><Audio src={staticFile('audio/vo3.mp3')} volume={1} /></Seq>
      <Seq at={30.0} len={9.5}><Audio src={staticFile('audio/vo4.mp3')} volume={1} /></Seq>
      <Seq at={56.8} len={5.5}><Audio src={staticFile('audio/eulogy_cofounder.mp3')} volume={1} /></Seq>
      <Seq at={68.3} len={4.5}><Audio src={staticFile('audio/vo5.mp3')} volume={1} /></Seq>
      <Seq at={74.8} len={9}><Audio src={staticFile('audio/eulogy_lea.mp3')} volume={1} /></Seq>
      <Seq at={88.6} len={2.5}><Audio src={staticFile('audio/vo6.mp3')} volume={1} /></Seq>

      {/* ---------- S1 BIRTH 0–8.5 ---------- */}
      <Seq at={0} len={8.5} name="S1 Birth"><Birth len={S(8.5)} /></Seq>

      {/* ---------- S2 FIVE LINES 8.5–20.5 ---------- */}
      <Seq at={8.5} len={12} name="S2 Form"><FiveLines len={S(12)} /></Seq>
      <Seq at={15.8} len={4.5}><Caption len={S(4.5)} text="Profile → zod contract → 4 relative agents + Protagonist + Destiny, each with goals, memory, a grievance" /></Seq>

      {/* ---------- S3 FACE 20.5–29.5 ---------- */}
      <Seq at={20.5} len={9} name="S3 Face"><Face len={S(9)} /></Seq>
      <Seq at={26.6} len={2.9}><Caption len={S(2.9)} text="Runware · FLUX.1 Kontext identity-preserving aging · TRELLIS.2 image→GLB bust in 32 s" /></Seq>

      {/* ---------- S4 THOUSAND LIVES 29.5–45 ---------- */}
      <Seq at={29.5} len={15.5} name="S4 Lives"><ThousandLives len={S(15.5)} /></Seq>
      <Seq at={33} len={3.5}><Caption len={S(3.5)} text="Monte Carlo over life trajectories · agents with continuous emotional state (valence, arousal) + episodic memory · Claude" /></Seq>
      <Seq at={36.6} len={3.9}><Caption len={S(3.9)} text="BAND · one room per life · public channel = your life · private @mentions = what they say when you're not there · Destiny holds a veto" /></Seq>
      <Seq at={40.6} len={3.9}><Caption len={S(3.9)} text="Telem · shock priors fetched live from real base rates · every query carries the agent's reasoning in its trace" /></Seq>

      {/* ---------- S5 THE SENTENCE 45–52 (silence) ---------- */}
      <Seq at={45} len={7} name="S5 Reveal"><Reveal len={S(7)} /></Seq>
      <Seq at={49.4} len={2.6}><Caption len={S(2.6)} text="mart_outcome_distribution · Bruin pipeline → DuckDB · 30 runs · 6 quality checks passed" /></Seq>

      {/* ---------- S6 LIFE #001 52–72 ---------- */}
      <Seq at={52} len={5.8} name="S6 Chapel wide">
        {CLIPS.chapel ? <Clip src="clips/chapel.mp4" len={S(5.8)} dim={0.08} /> : <KenBurns src="img/chapel_wide.jpg" len={S(5.8)} from={1.0} to={1.06} />}
        <LifeTag len={S(5.8)} text="LIFE #001 · MOST PROBABLE · 61 % OF RUNS" />
      </Seq>
      <Seq at={57.3} len={6} name="S6 Cofounder">
        {CLIPS.cofounder ? <Clip src="clips/cofounder.mp4" len={S(6)} dim={0.12} /> : <KenBurns src="img/cofounder.jpg" len={S(6)} from={1.02} to={1.06} dim={0.1} />}
      </Seq>
      <Seq at={63} len={5.5} name="S6 Lea bowed">
        {CLIPS.leaBowed ? <Clip src="clips/lea_bowed.mp4" len={S(5.5)} dim={0.12} /> : <KenBurns src="img/lea_bowed.jpg" len={S(5.5)} from={1.0} to={1.05} dim={0.1} />}
      </Seq>
      <Seq at={64.2} len={4}><PrivateLine len={S(4)} text="Léa → Anne: I don't know what to say about him." /></Seq>
      <Seq at={68.2} len={4} name="S6 Bust">
        <KenBurns src="img/bust.jpg" len={S(4)} from={1.0} to={1.05} dim={0.15} />
      </Seq>
      <Seq at={57.3} len={14.7}><Ledger variant={1} len={S(14.7)} /></Seq>

      {/* ---------- S7 LIFE #212 72–88 ---------- */}
      <Seq at={72} len={2.6} name="S7 Title"><Line len={S(2.6)} text="Life number 212." size={48} color="rgba(236,231,218,0.85)" /></Seq>
      <Seq at={74.5} len={8.8} name="S7 Lea speaks">
        {CLIPS.leaStand ? <Clip src="clips/lea_stand.mp4" len={S(8.8)} dim={0.06} /> : <KenBurns src="img/lea_stand.jpg" len={S(8.8)} from={1.0} to={1.06} dim={0.05} />}
        <LifeTag len={S(8.8)} text="LIFE #212 · RECONCILED · 8 % OF RUNS" />
      </Seq>
      <Seq at={75} len={8}><Ledger variant={2} len={S(8)} /></Seq>
      <Seq at={83} len={5} name="S7 Chapel warm">
        <KenBurns src="img/chapel_wide.jpg" len={S(5)} from={1.06} to={1.0} dim={0.2} />
      </Seq>
      <Seq at={82.8} len={5.2}><MartOverlay len={S(5.2)} /></Seq>

      {/* ---------- S8 END 88–98 ---------- */}
      <Seq at={88} len={10} name="S8 End"><AbsoluteFill style={{ background: '#000' }} /></Seq>
      <Seq at={90.8} len={2.9}><Line len={S(2.9)} text="Happy Thanksgiving." size={56} /></Seq>
      <Seq at={93.6} len={4.4}><Credits len={S(4.4)} /></Seq>

      {/* ---------- GLOBAL LOOK ---------- */}
      <Vignette />
      <Grain opacity={0.07} />
      <Letterbox />
    </AbsoluteFill>
  );
};
