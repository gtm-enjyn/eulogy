import { type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../store/profile';

export default function Onboarding() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/lives');
  };

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <div className="page">
      <h1>Toi</h1>
      <form className="form-grid" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Prénom</label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="age">Âge</label>
          <input
            id="age"
            type="number"
            value={profile.age}
            onChange={(e) => setProfile({ age: num(e.target.value, profile.age) })}
          />
        </div>
        <div>
          <label htmlFor="city">Ville</label>
          <input
            id="city"
            value={profile.city}
            onChange={(e) => setProfile({ city: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="activity">Activité actuelle</label>
          <input
            id="activity"
            value={profile.currentActivity}
            onChange={(e) => setProfile({ currentActivity: e.target.value })}
          />
        </div>
        <div className="full">
          <label htmlFor="ambition">Ambition à 10 ans</label>
          <input
            id="ambition"
            value={profile.ambition10y}
            onChange={(e) => setProfile({ ambition10y: e.target.value })}
          />
        </div>
        <div className="full">
          <label htmlFor="traits">3 traits (séparés par des virgules)</label>
          <input
            id="traits"
            value={profile.traits.join(', ')}
            onChange={(e) => {
              const parts = e.target.value.split(',').map((t) => t.trim());
              const three: [string, string, string] = [parts[0] ?? '', parts[1] ?? '', parts[2] ?? ''];
              setProfile({ traits: three });
            }}
          />
        </div>
        <div>
          <label htmlFor="flaw">Défaut</label>
          <input
            id="flaw"
            value={profile.flaw}
            onChange={(e) => setProfile({ flaw: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="fear">Peur</label>
          <input
            id="fear"
            value={profile.fear}
            onChange={(e) => setProfile({ fear: e.target.value })}
          />
        </div>
        {(['sport', 'alcohol', 'sleep'] as const).map((h) => (
          <div key={h}>
            <label htmlFor={`habit-${h}`}>
              {h} ({profile.habits[h]}/10)
            </label>
            <input
              id={`habit-${h}`}
              type="range"
              min={0}
              max={10}
              value={profile.habits[h]}
              onChange={(e) =>
                setProfile({ habits: { ...profile.habits, [h]: num(e.target.value, 5) } })
              }
            />
          </div>
        ))}
        <div className="full">
          <label>Proches</label>
          <ul>
            {profile.relatives.map((r) => (
              <li key={r.id}>
                {r.name} — {r.relation}, {r.age}
              </li>
            ))}
          </ul>
        </div>
        <div className="full">
          <button type="submit">Voir mes vies</button>
        </div>
      </form>
    </div>
  );
}
