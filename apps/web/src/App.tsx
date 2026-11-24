import { Route, Routes } from 'react-router-dom';
import Landing from './v2/Landing';
import Face from './v2/Face';
import Connect from './v2/Connect';
import Voice from './v2/Voice';
import Simulate from './v2/Simulate';
import Result from './v2/Result';
import { lazy, Suspense } from 'react';
import LivesGrid from './pages/LivesGrid';
import Onboarding from './pages/Onboarding';
const Chapel = lazy(() => import('./pages/Chapel'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/face" element={<Face />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/voice" element={<Voice />} />
      <Route path="/simulate" element={<Simulate />} />
      <Route path="/result" element={<Result />} />
      <Route path="/lives" element={<LivesGrid />} />
      <Route path="/you" element={<Onboarding />} />
      <Route
        path="/chapel"
        element={
          <Suspense
            fallback={
              <main className="page" role="status">
                Opening the chapel…
              </main>
            }
          >
            <Chapel />
          </Suspense>
        }
      />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
