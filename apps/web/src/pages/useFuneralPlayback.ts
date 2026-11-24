import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildFuneralScript, type Profile, type Run } from '@eulogy/shared';
import { movementDuration, type Beat } from '../components/chapelBlocking';
import { findFuneralRecording } from '../data/funeralAudio';
import { funeralPerformer } from '../data/funeralCast';

type Playback = { status: 'ready' | 'playing' | 'complete'; index: number; beat: Beat };
type Meter = {
  context: AudioContext;
  analyser: AnalyserNode;
  samples: Uint8Array<ArrayBuffer>;
  gain: GainNode;
};
const ready: Playback = { status: 'ready', index: 0, beat: 'silence' };

export function useFuneralPlayback(profile: Profile, run: Run, reduced: boolean) {
  const cues = useMemo(() => buildFuneralScript(profile, run), [profile, run]);
  const [state, setState] = useState<Playback>(ready);
  const [sound, setSound] = useState(true);
  const [voiceMode, setVoiceMode] = useState<'recording' | 'device' | 'captions'>('recording');
  const soundOn = useRef(true);
  const recording = useRef<HTMLAudioElement | null>(null);
  const meter = useRef<Meter | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const generation = useRef(0);

  const clearSound = useCallback(() => {
    const audio = recording.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;
      audio.pause();
    }
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
      window.speechSynthesis.cancel();
    }
  }, []);
  const cancel = useCallback(() => {
    generation.current++;
    window.clearTimeout(timer.current);
    clearSound();
  }, [clearSound]);
  useEffect(
    () => () => {
      cancel();
      if (meter.current) void meter.current.context.close().catch(() => {});
      meter.current = null;
      recording.current = null;
    },
    [cancel],
  );

  function unlock() {
    const audio = recording.current ?? new Audio();
    recording.current = audio;
    if (!meter.current && typeof AudioContext !== 'undefined') {
      try {
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        const gain = context.createGain();
        context.createMediaElementSource(audio).connect(analyser);
        analyser.connect(gain).connect(context.destination);
        meter.current = { context, analyser, samples: new Uint8Array(analyser.fftSize), gain };
      } catch {
        /* Native media still plays on devices without a Web Audio graph. */
      }
    }
    if (meter.current) {
      void meter.current.context.resume().catch(() => {});
      meter.current.gain.gain.value = soundOn.current ? 1 : 0;
    }
    audio.muted = !meter.current && !soundOn.current;
    return audio;
  }

  function play(index = 0, direct = false) {
    cancel();
    const token = generation.current;
    const audio = unlock();
    const current = () => generation.current === token;
    function later(fn: () => void, delay: number) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (current()) fn();
      }, delay);
    }
    function stage(index: number, audition = false) {
      if (!current()) return;
      clearSound();
      if (index >= cues.length) {
        setState({ status: 'complete', index: cues.length - 1, beat: 'silence' });
        return;
      }
      const cue = cues[index]!;
      const witness = profile.relatives.findIndex((relative) => relative.id === cue.relativeId);
      const show = (beat: Beat) => setState({ status: 'playing', index, beat });
      const next = () => stage(index + 1);
      if (!cue.speaks) {
        show('silence');
        later(next, 1900);
        return;
      }

      function speak() {
        show('speak');
        let finished = false;
        const finish = () => {
          if (finished || !current()) return;
          finished = true;
          clearSound();
          if (witness < 0) {
            later(next, 340);
            return;
          }
          show('return');
          later(next, reduced ? 220 : movementDuration(witness, 'return'));
        };
        const estimate = Math.max(2200, cue.text.trim().split(/\s+/u).length * 410 + 500);
        function deviceVoice() {
          if (!current() || finished) return;
          audio.onended = null;
          audio.onerror = null;
          audio.onplaying = null;
          later(finish, estimate);
          if (!soundOn.current || !('speechSynthesis' in window)) {
            setVoiceMode('captions');
            return;
          }
          const line = new SpeechSynthesisUtterance(cue.text);
          const cast = funeralPerformer(profile, cue) ?? '';
          const language = cast.startsWith('b') ? 'en-GB' : 'en-US';
          const voices = window.speechSynthesis
            .getVoices()
            .filter((voice) => voice.lang.startsWith('en'));
          const local = voices.filter((voice) => voice.lang === language);
          const options = local.length ? local : voices;
          line.voice = options[(witness + 1) % Math.max(options.length, 1)] ?? null;
          line.lang = line.voice?.lang ?? language;
          line.rate = 0.96;
          utterance.current = line;
          setVoiceMode('device');
          line.onstart = () => {
            if (current()) later(finish, Math.max(estimate * 2, 10000));
          };
          line.onend = finish;
          line.onerror = () => {
            if (current()) {
              setVoiceMode('captions');
              later(finish, estimate);
            }
          };
          window.speechSynthesis.speak(line);
        }
        const clip = findFuneralRecording(profile, cue);
        if (!clip) {
          deviceVoice();
          return;
        }
        setVoiceMode('recording');
        let failed = false;
        const fallback = () => {
          if (failed || !current() || finished) return;
          failed = true;
          audio.pause();
          deviceVoice();
        };
        audio.onended = finish;
        audio.onerror = fallback;
        audio.onplaying = () => {
          if (current()) later(finish, clip.durationMs + 1800);
        };
        audio.src = clip.src;
        later(fallback, 4500);
        void audio.play().catch(fallback);
      }
      if (witness < 0 || audition || reduced) {
        speak();
        return;
      }
      show('approach');
      later(speak, movementDuration(witness, 'approach'));
    }
    stage(index, direct);
  }
  function stop() {
    cancel();
    setState(ready);
  }
  function toggleSound() {
    const enabled = !soundOn.current;
    soundOn.current = enabled;
    setSound(enabled);
    if (meter.current) meter.current.gain.gain.value = enabled ? 1 : 0;
    else if (recording.current) recording.current.muted = !enabled;
    if (!enabled && utterance.current) {
      const line = utterance.current;
      line.onstart = null;
      line.onend = null;
      line.onerror = null;
      window.speechSynthesis.cancel();
      utterance.current = null;
      setVoiceMode('captions');
    }
  }
  const level = useCallback((): number | null => {
    const graph = meter.current;
    if (!graph || !recording.current || recording.current.paused) return null;
    graph.analyser.getByteTimeDomainData(graph.samples);
    let power = 0;
    for (const sample of graph.samples) power += ((sample - 128) / 128) ** 2;
    return Math.min(0.78, Math.max(0, (Math.sqrt(power / graph.samples.length) - 0.008) * 4.1));
  }, []);
  return { state, cues, sound, voiceMode, level, play, stop, toggleSound };
}
