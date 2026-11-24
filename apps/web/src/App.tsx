import { Route, Routes } from 'react-router-dom';
import Landing from './v2/Landing';
import Face from './v2/Face';
import Voice from './v2/Voice';
import Simulate from './v2/Simulate';
import Result from './v2/Result';
import Chapel from './pages/Chapel';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/face" element={<Face />} />
      <Route path="/voice" element={<Voice />} />
      <Route path="/simulate" element={<Simulate />} />
      <Route path="/result" element={<Result />} />
      <Route path="/chapel" element={<Chapel />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
