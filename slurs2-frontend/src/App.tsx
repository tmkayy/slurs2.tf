import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/player/:steamId" element={<PlayerProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;