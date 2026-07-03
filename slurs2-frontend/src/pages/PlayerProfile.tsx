import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  if (loading) return <p>Loading...</p>;
  if (!player) return <p>Player not found.</p>;

  return (
    <div>
      <h1>{player.steamName}</h1>
      <p>Country: {player.country ?? '—'}</p>
      <p>
        <a href={`https://steamcommunity.com/profiles/${player.steamId}`} target="_blank" rel="noreferrer">
          Steam Profile
        </a>
      </p>
      <h2>Flagged Messages</h2>
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
  );
}