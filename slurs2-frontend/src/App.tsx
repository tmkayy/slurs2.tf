import { useState, type FormEvent } from 'react';
import { BrowserRouter, Link, Routes, Route, useNavigate } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';

function TopBar() {
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playerId = searchId.trim();

    if (playerId) {
      navigate(`/player/${encodeURIComponent(playerId)}`);
      setSearchId('');
    }
  };

  return (
    <header className="top-bar">
      <Link className="top-brand" to="/">
        slurs2.tf
      </Link>
      <form className="top-search" onSubmit={handleSearch}>
        <label htmlFor="top-player-search">Player ID</label>
        <input
          id="top-player-search"
          value={searchId}
          onChange={event => setSearchId(event.target.value)}
          placeholder="7656119..."
          inputMode="numeric"
          autoComplete="off"
        />
        <button type="submit">Search</button>
      </form>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/player/:steamId" element={<PlayerProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
