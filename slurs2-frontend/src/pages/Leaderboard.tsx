import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/client';
import type { PlayerSummary } from '../types';

export default function Leaderboard() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getLeaderboard()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Slur Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Country</th>
            <th>Slur Count</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.steamId} onClick={() => navigate(`/player/${p.steamId}`)} style={{ cursor: 'pointer' }}>
              <td>#{p.rank}</td>
              <td>{p.steamName}</td>
              <td>{p.country ?? '—'}</td>
              <td>{p.slurCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}