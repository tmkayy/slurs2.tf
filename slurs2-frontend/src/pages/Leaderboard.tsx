import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { geoEqualEarth, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature as topojsonFeature } from 'topojson-client';
import type { GeometryCollection, Objects, Topology } from 'topojson-specification';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/client';
import type { PlayerSummary } from '../types';

interface CountryStat {
  country: string;
  count: number;
}

interface CountryFeature {
  id?: string | number;
  properties?: {
    name?: string;
  };
}

interface WorldAtlasObjects extends Objects {
  countries: GeometryCollection;
}

type WorldAtlasTopology = Topology<WorldAtlasObjects>;

const TOP_LEADERBOARD_LIMIT = 20;
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_ALIASES: Record<string, string[]> = {
  'united states of america': ['us', 'usa', 'united states'],
  'united kingdom': ['gb', 'uk', 'great britain', 'england'],
  russia: ['ru', 'russian federation'],
  'south korea': ['kr', 'korea', 'korea, republic of'],
  'north korea': ['kp', 'korea, democratic people\'s republic of'],
  iran: ['ir', 'iran, islamic republic of'],
  syria: ['sy', 'syrian arab republic'],
  vietnam: ['vn', 'viet nam'],
  laos: ['la', 'lao people\'s democratic republic'],
  tanzania: ['tz', 'tanzania, united republic of'],
  bolivia: ['bo', 'bolivia, plurinational state of'],
  venezuela: ['ve', 'venezuela, bolivarian republic of'],
  moldova: ['md', 'moldova, republic of'],
  brunei: ['bn', 'brunei darussalam'],
  'czech republic': ['cz', 'czechia'],
  macedonia: ['mk', 'north macedonia'],
};

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
    // Ignore environments that don't support region display names or supported values.
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

function CountryBadge({ country, className = 'leaderboard-country-badge' }: { country?: string | null; className?: string }) {
  const resolvedCountry = country?.trim() || '';

  if (!resolvedCountry) {
    return <span className={className}>-</span>;
  }

  const countryCode = getCountryCode(resolvedCountry);
  const countryLabel = countryCode ? flagEmoji(countryCode) : '🏳️';

  return (
    <span className={className} aria-label={resolvedCountry}>
      <span className="leaderboard-country-flag">{countryLabel}</span>
      <span className="leaderboard-country-code">{countryCode}</span>
    </span>
  );
}

function buildCountryStats(players: PlayerSummary[]) {
  const totals = new Map<string, CountryStat>();

  players.forEach(player => {
    const country = player.country?.trim() || 'Unknown';
    const key = normalizeCountry(country);
    const current = totals.get(key);

    if (current) {
      current.count += player.slurCount;
    } else {
      totals.set(key, { country, count: player.slurCount });
    }
  });

  return [...totals.values()].sort((a, b) => b.count - a.count);
}

function getCountryPlayers(countryName: string, players: PlayerSummary[]) {
  const normalizedName = normalizeCountry(countryName);
  const aliases = COUNTRY_ALIASES[normalizedName] ?? [];

  return players
    .filter(player => {
      const normalizedCountry = normalizeCountry(player.country?.trim() || 'Unknown');
      return normalizedCountry === normalizedName || aliases.includes(normalizedCountry);
    })
    .sort((a, b) => b.slurCount - a.slurCount || a.rank - b.rank);
}

function findCountryStat(countryName: string, countryStats: CountryStat[]) {
  const normalizedName = normalizeCountry(countryName);
  const aliases = COUNTRY_ALIASES[normalizedName] ?? [];

  return countryStats.find(stat => {
    const normalizedStat = normalizeCountry(stat.country);

    return normalizedStat === normalizedName || aliases.includes(normalizedStat);
  });
}

function getCountryFill(count: number, maxCount: number) {
  const intensity = count / maxCount;
  const lightness = 76 - intensity * 38;
  const saturation = 48 + intensity * 44;

  return `hsl(4 ${saturation}% ${lightness}%)`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const dragStateRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getLeaderboard()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(geoUrl)
      .then(response => response.json())
      .then((topology: WorldAtlasTopology) => {
        const countryCollection = topojsonFeature(topology, topology.objects.countries) as {
          features: CountryFeature[];
        };

        setCountries(countryCollection.features);
      })
      .finally(() => setMapLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedCountry]);

  const countryStats = useMemo(() => buildCountryStats(players), [players]);
  const maxCountryCount = Math.max(...countryStats.map(stat => stat.count), 1);
  const visibleCountryStats = showAllCountries ? countryStats : countryStats.slice(0, 8);
  const selectedCountryPlayers = useMemo(
    () => (selectedCountry ? getCountryPlayers(selectedCountry, players) : []),
    [players, selectedCountry],
  );
  const visibleSelectedCountryPlayers = useMemo(
    () => selectedCountryPlayers.slice(0, TOP_LEADERBOARD_LIMIT),
    [selectedCountryPlayers],
  );
  const topPlayers = useMemo(() => players.slice(0, TOP_LEADERBOARD_LIMIT), [players]);
  const mapPath = useMemo(() => {
    const projection = geoEqualEarth()
      .scale(178)
      .translate([480, 238]);

    return geoPath(projection);
  }, []);

  const handleZoom = (delta: number) => {
    setZoomLevel(current => clamp(current + delta, 1, 6));
  };

  const handleMapWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    handleZoom(event.deltaY < 0 ? 0.15 : -0.15);
  };

  const handleMapPointerDown = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (event.button !== 0 || zoomLevel <= 1) {
      return;
    }

    event.preventDefault();
    setIsDraggingMap(true);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX,
      panY,
    };
  };

  const handleMapPointerMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (!isDraggingMap || !dragStateRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    const nextPanX = dragStateRef.current.panX + deltaX;
    const nextPanY = dragStateRef.current.panY + deltaY;

    setPanX(nextPanX);
    setPanY(nextPanY);
    dragStateRef.current = {
      ...dragStateRef.current,
      startX: event.clientX,
      startY: event.clientY,
      panX: nextPanX,
      panY: nextPanY,
    };
  };

  const handleMapPointerUp = () => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
    }

    setIsDraggingMap(false);
  };

  const closeSelectedCountry = () => {
    if (!selectedCountry) {
      return;
    }

    setIsClosingModal(true);
    window.setTimeout(() => {
      setSelectedCountry(null);
      setIsClosingModal(false);
    }, 180);
  };

  return (
    <div className="page-shell">
      <header className="site-hero">
        <div className="hero-logo-lockup" style={{ 
          background: 'transparent', 
          border: 'none', 
          boxShadow: 'none',
          transform: 'none',
          padding: 0,
          width: '100%'
        }}>
          <img 
            src="/Slurs_tf2_logo.png" 
            alt="slurs2.tf" 
            className="site-logo"
            style={{ 
              maxWidth: '1500px', 
              width: '100%', 
              height: 'auto',
              display: 'block',
              margin: '0 auto'
            }}
          />
          <p className="tf2-tagline" style={{ marginTop: '-28px' }}>The most fun you can have online</p>
        </div>
      </header>

      <section className="content-panel country-panel">
        <div className="section-heading">
          <div>
            <h2 className="country-panel-title">Slurs by Country</h2>
          </div>
          <div className="section-heading-actions">
            {countryStats.length > 8 && (
              <button
                type="button"
                className="view-all-button"
                onClick={() => setShowAllCountries(value => !value)}
              >
                {showAllCountries ? 'Show less' : 'View all'}
              </button>
            )}
            <span className="badge">hurt people with passion</span>
          </div>
        </div>

        {loading ? (
          <p className="status-text">Plotting country heat...</p>
        ) : (
          <div className="country-grid">
            <div className="world-map">
              {mapLoading ? (
                <p className="map-loading">Loading map data...</p>
              ) : (
                <svg
                  viewBox="0 0 960 480"
                  role="img"
                  aria-label="World map showing slur totals by country"
                  onWheel={handleMapWheel}
                  onMouseDown={handleMapPointerDown}
                  onMouseMove={handleMapPointerMove}
                  onMouseUp={handleMapPointerUp}
                  onMouseLeave={handleMapPointerUp}
                  style={{ cursor: isDraggingMap ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default' }}
                >
                  <g transform={`translate(${480 + panX} ${240 + panY}) scale(${zoomLevel}) translate(-480 -240)`}>
                    {countries.map(country => {
                      const countryName = country.properties?.name ?? '';
                      const stat = findCountryStat(countryName, countryStats);
                      const fill = stat ? getCountryFill(stat.count, maxCountryCount) : '#3a332d';
                      const pathData = mapPath(country as GeoPermissibleObjects);

                      if (!pathData) {
                        return null;
                      }

                      return (
                        <path
                          key={country.id ?? countryName}
                          d={pathData}
                          fill={fill}
                          stroke="#1f1815"
                          strokeWidth={0.45}
                          tabIndex={0}
                          aria-label={stat ? `${countryName}: ${stat.count}` : `${countryName}: 0`}
                          onClick={() => stat && setSelectedCountry(stat.country)}
                          onKeyDown={event => {
                            if ((event.key === 'Enter' || event.key === ' ') && stat) {
                              event.preventDefault();
                              setSelectedCountry(stat.country);
                            }
                          }}
                        >
                          <title>{stat ? `${countryName}: ${stat.count}` : `${countryName}: 0`}</title>
                        </path>
                      );
                    })}
                  </g>
                </svg>
              )}
              <div className="map-legend">
                <span>Low</span>
                <div />
                <span>High</span>
              </div>
            </div>

            <div className="country-rankings">
              {visibleCountryStats.map(stat => {
                const intensity = stat.count / maxCountryCount;
                const countryCode = getCountryCode(stat.country);
                const countryLabel = countryCode ? flagEmoji(countryCode) : stat.country;

                return (
                  <button
                    type="button"
                    className="country-row"
                    key={stat.country}
                    onClick={() => setSelectedCountry(stat.country)}
                  >
                    <span className="country-flag" aria-label={stat.country}>
                      {countryLabel}
                      <span className="country-code">{countryCode}</span>
                    </span>
                    <div className="country-meter">
                      <span style={{ width: `${Math.max(8, intensity * 100)}%` }} />
                    </div>
                    <strong>{stat.count}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {selectedCountry && (
        <div
          className={`country-modal-backdrop${isClosingModal ? ' closing' : ''}`}
          role="dialog"
          aria-modal="true"
          onClick={closeSelectedCountry}
        >
          <div className="country-modal" onClick={event => event.stopPropagation()}>
            <div className="country-modal-header">
              <div className="country-modal-title-wrap">
                <p className="eyebrow">Local leaderboard</p>
                <h3>
                  <span className="country-modal-flag">
                    {flagEmoji(getCountryCode(selectedCountry))}
                  </span>
                  <span className="country-modal-code">{getCountryCode(selectedCountry)}</span>
                </h3>
              </div>
              <button type="button" className="modal-close" onClick={closeSelectedCountry}>
                Close
              </button>
            </div>
            <div
              className="country-modal-list"
              onWheel={event => event.stopPropagation()}
            >
              {visibleSelectedCountryPlayers.length > 0 ? (
                visibleSelectedCountryPlayers.map(player => (
                  <button
                    key={player.steamId}
                    type="button"
                    className="country-player-row"
                    onClick={() => navigate(`/player/${player.steamId}`)}
                  >
                    <span className="country-player-main">
                      <span className="country-player-rank">#{player.rank}</span>
                      <span>{player.steamName}</span>
                    </span>
                    <strong>{player.slurCount}</strong>
                  </button>
                ))
              ) : (
                <p className="status-text">No players logged for this country yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="content-panel">
        <div className="section-heading">
          <div>
            <h2>Leaderboard</h2>
          </div>
          <span className="badge">{players.length} players</span>
        </div>

        {loading ? (
          <p className="status-text">Loading field reports...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="leaderboard-rank-header">Rank</th>
                  <th>Player</th>
                  <th>Country</th>
                  <th>Slur Count</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map(p => (
                  <tr className="leaderboard-row" key={p.steamId} onClick={() => navigate(`/player/${p.steamId}`)}>
                    <td className="leaderboard-rank-cell">#{p.rank}</td>
                    <td>{p.steamName}</td>
                    <td>
                      <CountryBadge country={p.country} />
                    </td>
                    <td>{p.slurCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}