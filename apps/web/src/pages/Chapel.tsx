import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { sampleProfile } from '@eulogy/shared';
import ChapelScene from '../components/ChapelScene';
import Ledger from '../components/Ledger';
import PrivateFeed from '../components/PrivateFeed';
import { runs } from '../data/runs';

export default function Chapel() {
  const [index, setIndex] = useState(0);
  const run = runs[index % runs.length] ?? runs[0];
  if (!run) return null;

  return (
    <div className="chapel">
      <div className="chapel-canvas">
        <Canvas camera={{ position: [0, 2.2, 7], fov: 50 }} shadows>
          <Suspense fallback={null}>
            <ChapelScene relatives={sampleProfile.relatives} />
          </Suspense>
        </Canvas>
      </div>
      <aside className="chapel-side">
        <div>
          <h2>
            Vie {index + 1} / {runs.length} · mort à {run.death_age} ({run.cause_of_death})
          </h2>
          <button onClick={() => setIndex((i) => (i + 1) % runs.length)}>Vie suivante</button>
        </div>
        <Ledger run={run} />
        <PrivateFeed run={run} />
      </aside>
    </div>
  );
}
