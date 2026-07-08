import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlayer } from '../api/client';
import type { PlayerDetail } from '../types';

const COUNTRY_FLAG_CODES: Record<string, string> = {
  'united states of america': 'US',
  'united states': 'US',
  usa: 'US',
  us: 'US',
  'united kingdom': 'GB',
  'great britain': 'GB',
  uk: 'GB',
  gb: 'GB',
  england: 'GB',
  sweden: 'SE',
  se: 'SE',
  kazakhstan: 'KZ',
  kz: 'KZ',
  russia: 'RU',
  'russian federation': 'RU',
  'south korea': 'KR',
  korea: 'KR',
  'korea, republic of': 'KR',
  'north korea': 'KP',
  'korea, democratic people\'s republic of': 'KP',
  iran: 'IR',
  'iran, islamic republic of': 'IR',
  syria: 'SY',
  'syrian arab republic': 'SY',
  vietnam: 'VN',
  'viet nam': 'VN',
  laos: 'LA',
  'lao people\'s democratic republic': 'LA',
  tanzania: 'TZ',
  'tanzania, united republic of': 'TZ',
  bolivia: 'BO',
  'bolivia, plurinational state of': 'BO',
  venezuela: 'VE',
  'venezuela, bolivarian republic of': 'VE',
  moldova: 'MD',
  'moldova, republic of': 'MD',
  brunei: 'BN',
  'brunei darussalam': 'BN',
  'czech republic': 'CZ',
  czechia: 'CZ',
  macedonia: 'MK',
  'north macedonia': 'MK',
  unknown: 'UN',
};

const REGION_NAME_TO_CODE: Record<string, string> = (() => {
  try {
    const supportedValuesOf = (Intl as any).supportedValuesOf?.bind(Intl);

    if (typeof Intl !== 'undefined' && typeof supportedValuesOf === 'function' && typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' } as any);
      const codes = supportedValuesOf('region') as string[];

      return codes.reduce<Record<string, string>>((map, code) => {
        const name = displayNames.of(code);

        if (name) {
          map[name.toLowerCase()] = code;
        }

        return map;
      }, {});
    }
  } catch {
    // Ignore environments without region display names support.
  }

  return {};
})();

const normalizeCountry = (country: string) => country.trim().toLowerCase();

function getCountryCode(country: string) {
  const normalized = normalizeCountry(country);

  if (COUNTRY_FLAG_CODES[normalized]) {
    return COUNTRY_FLAG_CODES[normalized];
  }

  if (/^[a-z]{2}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (REGION_NAME_TO_CODE[normalized]) {
    return REGION_NAME_TO_CODE[normalized];
  }

  return 'UN';
}

function flagEmoji(code: string) {
  if (!code) {
    return '🏳️';
  }

  return String.fromCodePoint(...code.toUpperCase().split('').map(char => 0x1f1e6 + char.charCodeAt(0) - 65));
}

export default function PlayerProfile() {
  const { steamId } = useParams<{ steamId: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'slurs' | 'spicy'>('slurs');

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
          <h1>{player.steamName}</h1>
          <p className="hero-copy">
            <span className="player-country-badge" aria-label={player.country ?? 'Unknown country'}>
              <span className="player-country-flag">{flagEmoji(getCountryCode(player.country ?? 'Unknown'))}</span>
              <span className="player-country-code">{getCountryCode(player.country ?? 'Unknown')}</span>
            </span>
          </p>
        </div>
        <div className="profile-links">
          <a className="steam-link profile-link" href={`https://steamcommunity.com/profiles/${player.steamId}`} target="_blank" rel="noreferrer">
            <span className="profile-link-logo" aria-hidden="true">
              <img src="/Steam_icon_logo.svg.webp" alt="" />
            </span>
            <span className="profile-link-label">Steam</span>
          </a>
          <a className="steam-link profile-link" href={`https://etf2l.org/search/${player.steamId}/`} target="_blank" rel="noreferrer">
            <span className="profile-link-logo etf2l-logo" aria-hidden="true">
              <img src="/2018_etf2l_short_nobackground_dark.png" alt="" />
            </span>
            <span className="profile-link-label">ETF2L</span>
          </a>
          <a className="steam-link profile-link" href={`https://rgl.gg/Public/PlayerProfile?p=${player.steamId}`} target="_blank" rel="noreferrer">
            <span className="profile-link-logo" aria-hidden="true">
              <img src="/rgl_logo.png" alt="" />
            </span>
            <span className="profile-link-label">RGL</span>
          </a>
        </div>
      </header>

      <main className="content-panel">
        <div className="section-heading">
          <div>
            <h2 className="profile-section-title">Flagged Messages</h2>
          </div>
          <span className="badge">{player.slurInstances.length} entries</span>
        </div>

        <div className="message-tabs" role="tablist" aria-label="Message categories">
          <button
            type="button"
            className={`message-tab ${activeTab === 'slurs' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'slurs'}
            onClick={() => setActiveTab('slurs')}
          >
            Slurs
          </button>
          <button
            type="button"
            className={`message-tab ${activeTab === 'spicy' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'spicy'}
            onClick={() => setActiveTab('spicy')}
          >
            Spicy Words
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Log</th>
                <th>Message</th>
                <th>Date</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'slurs'
                ? player.slurInstances.filter(s => s.slurType === 0)
                : player.slurInstances.filter(s => s.slurType !== 0)
              ).map((s, i) => (
                <tr key={i}>
                  <td><a href={s.logUrl} target="_blank" rel="noreferrer">View Log</a></td>
                  <td className="message-cell">{s.message}</td>
                  <td>{new Date(s.messageDate).toLocaleDateString()}</td>
                  <td>{s.slurCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
