import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileSchema, RelationSchema, type Relative, type Profile } from '@eulogy/shared';
import { z } from 'zod';
import { demo, saveScreening, ScreeningSchema } from '../data/screening';
import { useProfileStore } from '../store/profile';
import './onboarding.css';

const choices = [
  'ambitious',
  'disciplined',
  'generous',
  'loyal',
  'curious',
  'charismatic',
  'stubborn',
  'anxious',
  'competitive',
  'calm',
  'impulsive',
  'workaholic',
];
const flaws = [
  'short-tempered',
  'avoids conflict',
  'never present',
  'controlling',
  'jealous',
  'drinks too much',
  'lies to protect people',
  'puts work before everyone',
  "can't apologize",
  'spends recklessly',
];
const required = z.string().trim().min(1, 'Please fill in this field.');
const FormProfile = ProfileSchema.extend({
  name: required,
  age: z.number().int().min(16).max(70),
  city: required,
  currentActivity: required,
  fear: required,
  ambition10y: required,
  flaw: required,
  traits: z.array(required).length(3, 'Choose exactly three traits.'),
  relatives: z
    .array(
      ProfileSchema.shape.relatives.element.extend({
        name: required,
        relationshipState: required,
        grievance: required,
      }),
    )
    .min(1)
    .max(4),
});
type TextKey = 'name' | 'city' | 'currentActivity' | 'fear' | 'ambition10y';
async function post(path: string, body: unknown) {
  const response = await fetch('/api/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw Error('HTTP ' + response.status);
  return response.json();
}
export default function Onboarding() {
  const navigate = useNavigate(),
    profile = useProfileStore((s) => s.profile),
    set = useProfileStore((s) => s.setProfile);
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [photo, setPhoto] = useState(''),
    [notice, setNotice] = useState(''),
    [camera, setCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => {
    if (camera && video.current) video.current.srcObject = stream.current;
  }, [camera]);
  function stopCamera() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCamera(false);
  }
  async function webcam() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: true });
      setCamera(true);
    } catch {
      setNotice('Camera unavailable. You can upload a photo.');
    }
  }
  function capture() {
    if (!video.current?.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = Math.round((480 * video.current.videoHeight) / video.current.videoWidth);
    c.getContext('2d')?.drawImage(video.current, 0, 0, c.width, c.height);
    setPhoto(c.toDataURL('image/jpeg', 0.8));
    stopCamera();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = FormProfile.safeParse(profile);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const sessionProfile: Profile = { ...parsed.data, id: crypto.randomUUID() };
    stopCamera();
    try {
      if (photo) {
        try {
          const uploaded = z
            .object({ photoUrl: z.string().url() })
            .parse(await post('upload', { image: photo }));
          sessionProfile.photoUrl = uploaded.photoUrl;
        } catch {
          setNotice('Photo upload unavailable. Continuing with your written profile.');
        }
      }
      try {
        const faces = z
          .object({
            portraits: z.array(z.string().url()).max(3),
            bustUrl: z.string().url().optional(),
          })
          .parse(await post('portraits', sessionProfile));
        sessionProfile.portraits = faces.portraits;
        Object.assign(sessionProfile, faces.bustUrl ? { bustUrl: faces.bustUrl } : {});
        set(sessionProfile);
      } catch {
        /* Optional artwork can be generated independently. */
      }
      const response = await post('simulate', sessionProfile);
      saveScreening(ScreeningSchema.parse({ ...response, profile: sessionProfile }));
      sessionStorage.removeItem('eulogy.offline');
    } catch {
      saveScreening(demo);
      sessionStorage.setItem('eulogy.offline', 'true');
    } finally {
      setBusy(false);
      navigate('/lives');
    }
  }
  const error = (key: string) => (errors[key] ? <small role="alert">{errors[key]}</small> : null);
  const field = (key: TextKey, label: string, hint: string) => (
    <label>
      {label}
      <input value={profile[key]} onChange={(e) => set({ [key]: e.target.value })} />
      <small>{hint}</small>
      {error(key)}
    </label>
  );
  function changeRelative(i: number, patch: Partial<Relative>) {
    set({ relatives: profile.relatives.map((r, n) => (n === i ? { ...r, ...patch } : r)) });
  }
  return (
    <main className="profile-form">
      <header className="film-bar">
        <Link to="/">Eulogy</Link>
        <span>Your profile</span>
        <Link to="/lives" onClick={() => saveScreening(demo)}>
          Watch Louis’s lives ↗
        </Link>
      </header>
      <form noValidate onSubmit={submit}>
        <h1>Where you are now.</h1>
        <fieldset>
          <legend>Now</legend>
          <div className="fields">
            {field('name', 'Name', 'What people call you.')}
            <label>
              Age
              <input
                type="number"
                min="16"
                max="70"
                value={profile.age || ''}
                onChange={(e) => set({ age: Number(e.target.value) })}
              />
              <small>Where the six chapters begin.</small>
              {error('age')}
            </label>
            {field('city', 'City', 'Where you wake up.')}
            {field('currentActivity', 'Your days', 'What you actually do all day.')}
          </div>
        </fieldset>
        <fieldset>
          <legend>Who you are</legend>
          <p>Choose three traits.</p>
          <div className="chips">
            {[...new Set([...choices, ...profile.traits])].filter(Boolean).map((t) => (
              <button
                type="button"
                key={t}
                aria-pressed={profile.traits.includes(t)}
                onClick={() =>
                  set({
                    traits: profile.traits.includes(t)
                      ? profile.traits.filter((v) => v !== t)
                      : profile.traits.length < 3
                        ? [...profile.traits, t]
                        : profile.traits,
                  })
                }
              >
                {t}
              </button>
            ))}
          </div>
          {error('traits')}
          <div className="fields">
            <label>
              Flaw
              <input
                list="flaws"
                value={profile.flaw}
                onChange={(e) => set({ flaw: e.target.value })}
              />
              <datalist id="flaws">
                {flaws.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </datalist>
              <small>What people close to you complain about.</small>
              {error('flaw')}
            </label>
            {field('fear', 'Fear', 'What keeps you awake?')}
            {field(
              'ambition10y',
              'Ambition',
              'Where you want to be at age ' + (profile.age + 10) + '.',
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend>The people in the front row</legend>
          {profile.relatives.map((r, i) => (
            <div className="person fields" key={r.id}>
              {(['name', 'relationshipState', 'grievance'] as const).map((k) => (
                <label key={k}>
                  {
                    {
                      name: 'Name',
                      relationshipState: 'Where you stand today',
                      grievance: 'What they wish you understood',
                    }[k]
                  }
                  <input
                    value={r[k]}
                    onChange={(e) => changeRelative(i, { [k]: e.target.value })}
                  />
                  {error('relatives.' + i + '.' + k)}
                </label>
              ))}
              <label>
                Relationship
                <select
                  value={r.relation}
                  onChange={(e) =>
                    changeRelative(i, { relation: RelationSchema.parse(e.target.value) })
                  }
                >
                  {RelationSchema.options.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Age
                <input
                  type="number"
                  min="0"
                  value={r.age}
                  onChange={(e) => changeRelative(i, { age: Number(e.target.value) })}
                />
                {error('relatives.' + i + '.age')}
              </label>
              {profile.relatives.length > 1 && (
                <button
                  type="button"
                  onClick={() => set({ relatives: profile.relatives.filter((_, n) => n !== i) })}
                >
                  Remove {r.name || 'person'}
                </button>
              )}
            </div>
          ))}
          {profile.relatives.length < 4 && (
            <button
              type="button"
              onClick={() =>
                set({
                  relatives: [
                    ...profile.relatives,
                    {
                      id: crypto.randomUUID(),
                      name: '',
                      age: 30,
                      relation: 'friend',
                      grievance: '',
                      relationshipState: '',
                    },
                  ],
                })
              }
            >
              + Add someone
            </button>
          )}
        </fieldset>
        <fieldset>
          <legend>Body</legend>
          {(['sport', 'alcohol', 'sleep'] as const).map((k) => (
            <label key={k}>
              {
                {
                  sport: 'Hours of sport each week',
                  alcohol: 'Drinks each week',
                  sleep: 'Nights with seven hours of sleep',
                }[k]
              }{' '}
              · {profile.habits[k]}
              <input
                type="range"
                min="0"
                max="10"
                value={profile.habits[k]}
                onChange={(e) =>
                  set({ habits: { ...profile.habits, [k]: Number(e.target.value) } })
                }
              />
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Your face</legend>
          <p>An optional photo for your aged portrait.</p>
          <button type="button" onClick={webcam}>
            Take a photo
          </button>
          <label>
            Upload a photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2_500_000) {
                  setNotice('Choose an image smaller than 2.5 MB.');
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setPhoto(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {camera && (
            <>
              <video ref={video} autoPlay muted playsInline />
              <button type="button" onClick={capture}>
                Capture
              </button>
              <button type="button" onClick={stopCamera}>
                Close camera
              </button>
            </>
          )}
          {photo && <img src={photo} alt="Selected portrait" />}
          {profile.portraits?.map((url, i) => (
            <img src={url} alt={'Portrait ' + (i + 1)} key={url} />
          ))}
        </fieldset>
        {notice && <p role="status">{notice}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Preparing your lives…' : 'Simulate my lives →'}
        </button>
      </form>
    </main>
  );
}
