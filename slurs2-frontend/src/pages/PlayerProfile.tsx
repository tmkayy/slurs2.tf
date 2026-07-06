import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlayer } from '../api/client';
import type { PlayerDetail } from '../types';

export default function PlayerProfile() {
  const { steamId } = useParams<{ steamId: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!steamId) return;
    getPlayer(steamId)
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [steamId]);

  if (loading) {
    return (
      <div className="page-shell">
        <p className="status-text">Loading player dossier...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="page-shell">
        <Link className="back-link" to="/">Back to leaderboard</Link>
        <p className="status-text">Player not found.</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Link className="back-link" to="/">Back to leaderboard</Link>

      <header className="profile-header">
        <div>
          <p className="eyebrow">Player Dossier</p>
          <h1>{player.steamName}</h1>
          <p className="hero-copy">Country: {player.country ?? '-'}</p>
        </div>
        <a className="steam-link" href={`https://steamcommunity.com/profiles/${player.steamId}`} target="_blank" rel="noreferrer">
          Steam Profile
        </a>
      </header>

      <main className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chat Evidence</p>
            <h2>Flagged Messages</h2>
          </div>
          <span className="badge">{player.slurInstances.length} entries</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Message</th>
                <th>Date</th>
                <th>Count</th>
                <th>Type</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody>
              {player.slurInstances.map((s, i) => (
                <tr key={i}>
                  <td>{s.message}</td>
                  <td>{new Date(s.messageDate).toLocaleDateString()}</td>
                  <td>{s.slurCount}</td>
                  <td>{s.slurType === 0 ? 'Slur' : 'Spicy Word'}</td>
                  <td><a href={s.logUrl} target="_blank" rel="noreferrer">View Log</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
