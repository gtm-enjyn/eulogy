import { Route, Routes } from 'react-router-dom';
import Intro from './pages/Intro';
import Onboarding from './pages/Onboarding';
import LivesGrid from './pages/LivesGrid';
import Chapel from './pages/Chapel';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/you" element={<Onboarding />} />
      <Route path="/lives" element={<LivesGrid />} />
      <Route path="/chapel" element={<Chapel />} />
    </Routes>
  );
}
