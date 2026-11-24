import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Intro from './pages/Intro';
import Onboarding from './pages/Onboarding';
import LivesGrid from './pages/LivesGrid';

const Chapel = lazy(() => import('./pages/Chapel'));
const previousRoutes = {
  '/face': '/you',
  '/voice': '/you',
  '/simulate': '/lives',
  '/result': '/lives',
};

export default function App() {
  const { search, hash } = useLocation();
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/you" element={<Onboarding />} />
      <Route path="/lives" element={<LivesGrid />} />
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
      {Object.entries(previousRoutes).map(([path, pathname]) => (
        <Route
          key={path}
          path={path}
          element={<Navigate to={{ pathname, search, hash }} replace />}
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
