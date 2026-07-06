import { useEffect, useMemo, useState } from 'react';
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

export default function Leaderboard() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
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

  const countryStats = useMemo(() => buildCountryStats(players), [players]);
  const maxCountryCount = Math.max(...countryStats.map(stat => stat.count), 1);
  const mapPath = useMemo(() => {
    const projection = geoEqualEarth()
      .scale(178)
      .translate([480, 238]);

    return geoPath(projection);
  }, []);

  return (
    <div className="page-shell">
      <header className="site-hero">
        <div className="hero-logo-lockup">
          <h1 className="tf2-logo" aria-label="slurs2.tf">
            <span>slurs</span>
            <small>2</small>
            <span>.tf</span>
          </h1>
          <p className="tf2-tagline">The most fun you can have online</p>
        </div>
      </header>

      <section className="content-panel country-panel">
        <div className="section-heading">
          <div>
            <h2 className="country-panel-title">Slurs by Country</h2>
          </div>
          <span className="badge">hurt people with passion</span>
        </div>

        {loading ? (
          <p className="status-text">Plotting country heat...</p>
        ) : (
          <div className="country-grid">
            <div className="world-map">
              {mapLoading ? (
                <p className="map-loading">Loading map data...</p>
              ) : (
                <svg viewBox="0 0 960 480" role="img" aria-label="World map showing slur totals by country">
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
                      >
                        <title>{stat ? `${countryName}: ${stat.count}` : `${countryName}: 0`}</title>
                      </path>
                    );
                  })}
                </svg>
              )}
              <div className="map-legend">
                <span>Low</span>
                <div />
                <span>High</span>
              </div>
            </div>

            <div className="country-rankings">
              {countryStats.slice(0, 8).map(stat => {
                const intensity = stat.count / maxCountryCount;
                const countryCode = getCountryCode(stat.country);
                const countryLabel = countryCode ? flagEmoji(countryCode) : stat.country;

                return (
                  <div className="country-row" key={stat.country}>
                    <span className="country-flag" aria-label={stat.country}>
                      {countryLabel}
                      <span className="country-code">{countryCode}</span>
                    </span>
                    <div className="country-meter">
                      <span style={{ width: `${Math.max(8, intensity * 100)}%` }} />
                    </div>
                    <strong>{stat.count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <main className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Current Intel</p>
            <h2>Top Offenders</h2>
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
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Country</th>
                  <th>Slur Count</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr className="leaderboard-row" key={p.steamId} onClick={() => navigate(`/player/${p.steamId}`)}>
                    <td>#{p.rank}</td>
                    <td>{p.steamName}</td>
                    <td>{p.country ?? '-'}</td>
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
