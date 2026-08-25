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
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <BrowserRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/player/:steamId" element={<PlayerProfile />} />
      </Routes>

      <footer className="site-footer">
        <div className="footer-links">
          <a className="footer-link" href="https://steamcommunity.com/id/tmkay_/" target="_blank" rel="noreferrer">@tmk_</a>
          <button className="footer-link footer-button" onClick={() => setAboutOpen(true)}>about the project</button>
        </div>
      </footer>

      {aboutOpen && (
        <div className="about-modal-overlay" role="dialog" aria-modal="true">
          <div className="about-modal">
            <button className="about-close" onClick={() => setAboutOpen(false)} aria-label="Close">×</button>
            <h3>About this project</h3>
            <p>
              I made this for fun because the original creator removed his site. I will probably not bother hosting this, because idc enough to pay for the resources the hate speech detection model needs to run. The entire front-end is vibe coded (thx cake for making the logo img) and i used claude for some parts of the back-end, so don't expect quality.
            </p>
            <p className="about-signature">xoxo Hari</p>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
