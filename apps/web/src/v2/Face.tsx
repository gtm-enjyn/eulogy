import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Caption, Corner, Look, Step } from './ui';
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

  return (
    <div className="scene bars">
      <Corner n="01" title="YOUR FACE" /><Step i={1} />
      <div className="center">
        {phase !== 'done' && (
          <div className="stack">
            <div className="view">
              {phase === 'nocam' ? <div className="center muted" style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem' }}>No camera. Upload a photo.</div> : <video ref={video} autoPlay playsInline muted style={{ display: shot ? 'none' : 'block' }} />}
              {shot && <img className="plain" src={shot} alt="" />}
              {phase === 'processing' && <div className="scan" />}
            </div>
            {phase === 'processing' ? (
              <div className="stack" style={{ gap: 12 }}>
                <div className="mono amber">RUNWARE · FLUX.1 KONTEXT · AGING {Math.round(pct)} %</div>
                <div className="progress"><i style={{ width: `${pct}%` }} /></div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 14 }}>
                {phase === 'live' && <button className="shutter" onClick={capture} aria-label="Take photo"><i /></button>}
                <label className="btn ghost" style={{ cursor: 'pointer' }}>Upload instead<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
                <button className="btn ghost" onClick={() => nav('/connect')}>Skip</button>
              </div>
            )}
          </div>
        )}
        {phase === 'done' && (
          <div className="stack" style={{ gap: 34 }}>
            <div className="portraits">
              {portraits.map((p, i) => (
                <div key={i} className="stack" style={{ gap: 12, animationDelay: `${i * 300}ms` }}>
                  <div className="portrait" style={{ animationDelay: `${i * 350}ms` }}><img src={p} alt="" /></div>
                  <div className="mono muted">{['NOW', '+25 YEARS', '+50 YEARS'][i]}</div>
                </div>
              ))}
            </div>
            <h2 className="display h3" style={{ margin: 0 }}>This is you. This is you the week before.</h2>
            <button className="btn primary" onClick={() => nav('/connect')}>Now, who do you talk to?</button>
          </div>
        )}
      </div>
      <Caption>{phase === 'done' ? 'Runware · FLUX.1 Kontext (bfl:3@1) identity-preserving aging · the +50 portrait becomes a TRELLIS.2 3D bust by the coffin in the chapel' : 'One photo. Runware ages it twice. Nothing leaves your browser unless a Runware key is set.'}</Caption>
      <Look />
    </div>
  );
}
