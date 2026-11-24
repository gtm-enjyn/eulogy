import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './intro.css';
const lines = ['You were born.', "You don't remember it.", "Let's skip to now."];
export default function Intro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const times = [800, 2800, 4800].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => times.forEach(clearTimeout);
  }, []);
  function enter() {
    try {
      const ac = new AudioContext();
      const osc = ac.createOscillator(),
        gain = ac.createGain();
      osc.frequency.value = 54;
      gain.gain.setValueAtTime(0.001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.3);
      osc.onended = () => {
        void ac.close();
      };
    } catch {
      /* A silent opening also supports autoplay restrictions. */
    }
    navigate('/you');
  }
  return (
    <main className="opening">
      <header>Eulogy</header>
      <div className="light" aria-hidden="true" />
      <div className="opening-copy">
        <h1 aria-live="polite" key={step}>
          {step ? lines[step - 1] : 'Eulogy'}
        </h1>
        <button onClick={enter}>
          Tell us where you are <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
