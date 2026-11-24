import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from './ui';
import { useDemo } from './store';
import { agePortrait } from './aging';

type Phase = 'live' | 'processing' | 'done' | 'nocam';
export default function Face() {
  const nav = useNavigate(); const { setPhoto, setPortraits, portraits, profile } = useDemo();
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('live'); const [shot, setShot] = useState<string>(); const [pct, setPct] = useState(0);

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 1280 }, audio: false })
      .then((s) => { stream.current = s; if (video.current) video.current.srcObject = s; })
      .catch(() => setPhase('nocam'));
    return () => stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const process = async (dataUrl: string) => {
    setShot(dataUrl); setPhoto(dataUrl); setPhase('processing'); setPct(0);
    stream.current?.getTracks().forEach((t) => t.stop());
    const t0 = performance.now(); const tick = setInterval(() => setPct(Math.min(96, ((performance.now() - t0) / 4200) * 100)), 100);
    const [res] = await Promise.all([agePortrait(dataUrl, profile.age || 25), new Promise((r) => setTimeout(r, 4200))]);
    clearInterval(tick); setPct(100); setPortraits(res); setPhase('done');
  };
  const capture = () => {
    const v = video.current; if (!v) return; const s = Math.min(v.videoWidth, v.videoHeight) || 720;
    const c = document.createElement('canvas'); c.width = s; c.height = s; const ctx = c.getContext('2d')!;
    ctx.translate(s, 0); ctx.scale(-1, 1); ctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, s, s);
    void process(c.toDataURL('image/jpeg', 0.92));
  };
  const upload = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => void process(String(r.result)); r.readAsDataURL(f); };

  const action = phase === 'done'
    ? <button className="btn primary" onClick={() => nav('/connect')}>Now, who do you talk to? →</button>
    : phase === 'processing' ? null : <button className="btn ghost" onClick={() => nav('/connect')}>Skip →</button>;

  return (
    <Screen n="01" title="YOUR FACE" step={1} caption={phase === 'done' ? 'Runware · FLUX.1 Kontext · identity-preserving aging' : 'Runware ages you twice · nothing leaves your browser'} action={action}>
      <div className="center">
        {phase !== 'done' && (
          <div className="stack" style={{ gap: 18 }}>
            <div className="view">
              {phase !== 'nocam' && <video ref={video} autoPlay playsInline muted style={{ display: shot ? 'none' : 'block' }} />}
              {shot && <img className="plain" src={shot} alt="" />}
              {phase === 'processing' && <div className="scan" />}
            </div>
            {phase === 'processing' ? (
              <div className="stack" style={{ gap: 10 }}>
                <div className="mono amber">RUNWARE · FLUX.1 KONTEXT · AGING {Math.round(pct)} %</div>
                <div className="progress"><i style={{ width: `${pct}%` }} /></div>
              </div>
            ) : phase === 'nocam' ? (
              <label className="btn primary" style={{ cursor: 'pointer' }}>Upload a photo<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
            ) : (
              <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
                <button className="shutter" onClick={capture} aria-label="Take photo"><i /></button>
                <label className="btn ghost" style={{ cursor: 'pointer' }}>Upload instead<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
              </div>
            )}
          </div>
        )}
        {phase === 'done' && (
          <div className="stack" style={{ gap: 24 }}>
            <div className="portraits">
              {portraits.map((p, i) => (
                <div key={i} className="stack" style={{ gap: 10 }}>
                  <div className="portrait" style={{ animationDelay: `${i * 350}ms` }}><img src={p} alt="" /></div>
                  <div className="mono muted">{['NOW', '+25 YEARS', '+50 YEARS'][i]}</div>
                </div>
              ))}
            </div>
            <h2 className="display h3" style={{ margin: 0 }}>This is you. This is you the week before.</h2>
          </div>
        )}
      </div>
    </Screen>
  );
}
