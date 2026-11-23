import { useNavigate } from 'react-router-dom';

export default function Intro() {
  const navigate = useNavigate();
  return (
    <div className="center" style={{ background: '#000' }}>
      <div className="placeholder">BABY INTRO HERE</div>
      <button onClick={() => navigate('/you')}>Commencer</button>
    </div>
  );
}
