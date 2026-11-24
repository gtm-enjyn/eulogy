import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import ChapelScene, { type Beat, type Shot } from '../components/ChapelScene';
import Ledger from '../components/Ledger';
import PrivateFeed from '../components/PrivateFeed';
import { getScreening } from '../data/screening';
import './chapel.css';
import audioFiles from '../data/audio.json';
const recordings: Record<string, string> = audioFiles;
class ProjectionBoundary extends Component<{ children: ReactNode }, { unavailable: boolean }> {
  state = { unavailable: false };
  static getDerivedStateFromError() {
    return { unavailable: true };
  }
  render() {
    if (this.state.unavailable)
      return (
        <div className="projection-unavailable" role="status">
          <img src="/textures/rose.png" alt="" />
          <p>The 3D projection is unavailable. The service continues with audio and captions.</p>
        </div>
      );
    return this.props.children;
  }
}
export default function Chapel() {
  const { profile, runs, summary } = getScreening();
  const initial = Math.max(
    0,
    runs.findIndex((r) => r.run_id === summary.most_probable_run_id),
  );
  const best = runs.findIndex((r) => r.run_id === summary.best_run_id);
  const anchor = best >= 0 ? best : initial;
  const playlist = [
    initial,
    ...Array.from({ length: runs.length }, (_, i) => (anchor + i) % runs.length).filter(
      (i) => i !== initial,
    ),
  ];
  const [position, setPosition] = useState(0),
    [part, setPart] = useState(0),
    [beat, setBeat] = useState<Beat>('approach'),
    [manual, setManual] = useState<Shot | null>(null),
    [sound, setSound] = useState(true);
  const index = playlist[position % playlist.length]!;
  const run = runs[index]!,
    speech = run.eulogies[part],
    speaker = profile.relatives.find((r) => r.id === speech?.relative_id);
  const sidebar = useRef<HTMLElement>(null);
  const phase = beat === 'approach' ? 0 : beat === 'return' ? 0.95 : 0.5;
  const chapter = Math.min(
    run.years.length - 1,
    Math.floor(((part + phase) * run.years.length) / Math.max(1, run.eulogies.length)),
  );
  useEffect(() => {
    const active = sidebar.current?.querySelector<HTMLElement>('.ledger-year.active');
    const ledger = active?.parentElement;
    if (!active || !ledger || ledger.clientHeight >= ledger.scrollHeight) return;
    const top = active.getBoundingClientRect().top - ledger.getBoundingClientRect().top;
    if (top < 0 || top + active.offsetHeight > ledger.clientHeight) ledger.scrollTop += top - 10;
  }, [chapter, run]);
  const next = () => {
    setPosition((i) => (i + 1) % playlist.length);
    setPart(0);
    setBeat('approach');
    setManual(null);
  };
  useEffect(() => {
    if (!speech) return;
    let timer: ReturnType<typeof setTimeout>,
      audio: HTMLAudioElement | undefined,
      utterance: SpeechSynthesisUtterance | undefined;
    const finish = () => setBeat('return');
    if (beat === 'approach')
      timer = setTimeout(
        () => setBeat(speech.speaks ? 'speak' : 'silence'),
        speech.speaks ? 1800 : 250,
      );
    if (beat === 'silence') timer = setTimeout(finish, 4200);
    if (beat === 'return')
      timer = setTimeout(() => {
        setPart((p) => (p + 1) % run.eulogies.length);
        setBeat('approach');
      }, 1600);
    if (beat === 'speak') {
      const duration = Math.max(3800, speech.text.split(/\s+/).length * 470);
      timer = setTimeout(finish, duration + 1200);
      const path = recordings[run.run_id + '/' + speech.relative_id];
      if (sound && path) {
        audio = new Audio(path);
        audio.onended = finish;
        audio.onloadedmetadata = () => {
          if (Number.isFinite(audio!.duration)) {
            clearTimeout(timer);
            timer = setTimeout(finish, audio!.duration * 1000 + 900);
          }
        };
        void audio.play().catch((error: DOMException) => {
          if (error.name === 'NotAllowedError') setSound(false);
        });
      } else if (sound && 'speechSynthesis' in window) {
        utterance = new SpeechSynthesisUtterance(speech.text);
        utterance.lang = 'en-US';
        utterance.onend = finish;
        window.speechSynthesis.speak(utterance);
      }
    }
    return () => {
      clearTimeout(timer);
      if (audio) {
        audio.onloadedmetadata = null;
        audio.onended = null;
        audio.pause();
      }
      if (utterance) {
        utterance.onend = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [speech, beat, run, sound]);
  const shot = manual ?? (!speech?.speaks ? 'front_row' : beat === 'speak' ? 'pulpit' : 'wide');
  return (
    <main className="theatre">
      <header className="film-bar">
        <Link to="/">Eulogy</Link>
        <span>The chapel</span>
        <Link to="/lives">Life atlas ↗</Link>
      </header>
      <div className="chapel">
        <div className="chapel-canvas">
          <ProjectionBoundary>
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 3.1, 9.8], fov: 46 }}
              gl={{ antialias: true }}
            >
              <Suspense fallback={null}>
                <ChapelScene
                  profile={profile}
                  speaker={speech?.speaks ? speech.relative_id : ''}
                  beat={beat}
                  shot={shot}
                />
              </Suspense>
            </Canvas>
          </ProjectionBoundary>
          <div className="shot-controls">
            {(['wide', 'pulpit', 'front_row'] as const).map((s) => (
              <button
                key={s}
                aria-pressed={s === shot}
                onClick={() => setManual((m) => (m === s ? null : s))}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
            <button onClick={() => setSound((s) => !s)}>{sound ? 'Mute' : 'Sound on'}</button>
          </div>
          <div className="subtitles">
            <small>
              {speaker?.name} · {speech?.speaks ? 'at the lectern' : 'unspoken'}
            </small>
            <p>{speech?.text}</p>
          </div>
        </div>
        <aside className="chapel-side" ref={sidebar}>
          <div className="run-title">
            <small>
              Life {index + 1} of {runs.length} · {run.ending_cluster?.replaceAll('_', ' ')}
            </small>
            <h1>{profile.name}’s service</h1>
            <p>
              Age {run.death_age} · {run.cause_of_death}
            </p>
            <button onClick={next}>Next life →</button>
          </div>
          <Ledger run={run} active={chapter} />
          <PrivateFeed
            run={run}
            chapter={
              beat === 'return' && part === run.eulogies.length - 1 ? run.years.length - 1 : chapter
            }
          />
        </aside>
      </div>
    </main>
  );
}
