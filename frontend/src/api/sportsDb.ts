/**
 * TheSportsDB free API (v1). Default key "3" works without signup.
 * Optional: set REACT_APP_SPORTSDB_API_KEY for higher limits / v2 livescores.
 */

const API_KEY = process.env.REACT_APP_SPORTSDB_API_KEY ?? '3';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

/** English Premier League — good coverage on free tier */
export const DEFAULT_LEAGUE_ID = '4328';
export const SOCCER_LEAGUE_ID = '4328';
export const CRICKET_LEAGUE_ID = '4460'; // Indian Premier League

export type NewsSport = 'soccer' | 'cricket';

export type SportsDbEvent = {
  idEvent: string;
  strEvent: string;
  strSport: string;
  idLeague?: string;
  strLeague: string;
  strLeagueBadge?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string;
  strTimestamp?: string;
  strStatus: string;
  strVenue?: string;
  strThumb?: string;
  strPoster?: string;
  strBanner?: string;
  strDescriptionEN?: string;
  strCountry?: string;
  strSeason?: string;
};

export type SportsNewsItem = {
  id: string;
  sport: NewsSport;
  kind: 'past' | 'next';
  title: string;
  summary: string;
  body: string;
  league: string;
  imageUrl?: string;
  bannerUrl?: string;
  publishedAt: string;
  homeTeam: string;
  awayTeam: string;
  homeBadgeUrl?: string;
  awayBadgeUrl?: string;
  venue?: string;
  status?: string;
  homeScore?: string | null;
  awayScore?: string | null;
  kickoffLabel?: string;
  season?: string;
};

export type SportsNewsFeed = {
  soccer: SportsNewsItem[];
  cricket: SportsNewsItem[];
};

export type UpcomingMatchesFeed = {
  soccer: DashboardMatch[];
  cricket: DashboardMatch[];
};

export type DashboardMatch = {
  id: string;
  sport?: NewsSport;
  tournament: string;
  time: string;
  period: string;
  day: string;
  home: { name: string; rank: string; badgeUrl?: string; accent: 'primary' | 'secondary' };
  away: { name: string; rank: string; badgeUrl?: string; accent: 'primary' | 'secondary' };
  isLive: boolean;
  homeScore?: string;
  awayScore?: string;
  statusLabel?: string;
};

const LIVE_STATUSES = new Set([
  '1H',
  '2H',
  'HT',
  'Live',
  'In Play',
  'Extra Time',
  'Penalties',
  'BT',
  'P',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
]);

export function isLiveEvent(event: SportsDbEvent): boolean {
  const status = (event.strStatus ?? '').trim();
  if (LIVE_STATUSES.has(status)) return true;
  if (/^\d/.test(status)) return true;
  const hasScore = event.intHomeScore != null && event.intHomeScore !== '';
  return hasScore && status !== 'Match Finished' && status !== 'Not Started';
}

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Sports API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchUpcomingLeagueEvents(
  leagueId = DEFAULT_LEAGUE_ID,
): Promise<SportsDbEvent[]> {
  const data = await fetchJson<{ events: SportsDbEvent[] | null }>(
    `/eventsnextleague.php?id=${leagueId}`,
  );
  return data.events ?? [];
}

export async function fetchPastLeagueEvents(
  leagueId = DEFAULT_LEAGUE_ID,
): Promise<SportsDbEvent[]> {
  const data = await fetchJson<{ events: SportsDbEvent[] | null }>(
    `/eventspastleague.php?id=${leagueId}`,
  );
  return data.events ?? [];
}

export async function fetchEventsToday(sport = 'Soccer'): Promise<SportsDbEvent[]> {
  const data = await fetchJson<{ events: SportsDbEvent[] | null }>(
    `/eventsday.php?d=${todayIso()}&s=${encodeURIComponent(sport)}`,
  );
  return data.events ?? [];
}

export async function fetchLiveSoccerEvents(): Promise<SportsDbEvent[]> {
  const today = await fetchEventsToday('Soccer');
  const live = today.filter(isLiveEvent);
  if (live.length > 0) return live;

  try {
    const res = await fetch('https://www.thesportsdb.com/api/v2/json/livescore/soccer', {
      headers: { 'X-API-KEY': API_KEY },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      livescore?: Array<{
        idEvent: string;
        strEvent: string;
        strSport: string;
        strLeague: string;
        strHomeTeam: string;
        strAwayTeam: string;
        strHomeTeamBadge?: string;
        strAwayTeamBadge?: string;
        intHomeScore: string;
        intAwayScore: string;
        strStatus: string;
        dateEvent: string;
        strEventTime?: string;
      }>;
    };
    return (data.livescore ?? []).map((row) => ({
      idEvent: row.idEvent,
      strEvent: row.strEvent,
      strSport: row.strSport,
      strLeague: row.strLeague,
      strHomeTeam: row.strHomeTeam,
      strAwayTeam: row.strAwayTeam,
      strHomeTeamBadge: row.strHomeTeamBadge,
      strAwayTeamBadge: row.strAwayTeamBadge,
      intHomeScore: row.intHomeScore,
      intAwayScore: row.intAwayScore,
      dateEvent: row.dateEvent,
      strTime: row.strEventTime ?? '',
      strStatus: row.strStatus,
    }));
  } catch {
    return [];
  }
}

function buildNewsBody(e: SportsDbEvent, kind: 'past' | 'next'): string {
  const parts: string[] = [];
  const desc = (e.strDescriptionEN ?? '').trim();
  if (desc) parts.push(desc);

  const { time, period } = formatEventTime12h(e);
  const kickoff = `${formatEventDateLabel(e)} at ${time} ${period}`;
  parts.push(
    kind === 'past'
      ? `Full-time result from ${e.strLeague}${e.strSeason ? ` (${e.strSeason})` : ''}.`
      : `Fixture scheduled in ${e.strLeague}${e.strSeason ? ` (${e.strSeason})` : ''}.`,
  );
  parts.push(`Kickoff: ${kickoff}.`);

  if (e.strVenue) parts.push(`Venue: ${e.strVenue}${e.strCountry ? `, ${e.strCountry}` : ''}.`);
  if (e.strStatus) parts.push(`Status: ${e.strStatus}.`);

  if (kind === 'past' && e.intHomeScore != null && e.intAwayScore != null) {
    parts.push(
      `Final score — ${e.strHomeTeam} ${e.intHomeScore}, ${e.strAwayTeam} ${e.intAwayScore}.`,
    );
  } else if (kind === 'next') {
    parts.push(`${e.strHomeTeam} host ${e.strAwayTeam} in this upcoming ${e.strSport.toLowerCase()} match.`);
  }

  return parts.join('\n\n');
}

function eventToNewsItem(e: SportsDbEvent, sport: NewsSport, kind: 'past' | 'next'): SportsNewsItem {
  const kickoff = formatEventTime12h(e);
  const base = {
    sport,
    kind,
    league: e.strLeague,
    publishedAt: e.dateEvent,
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    homeBadgeUrl: e.strHomeTeamBadge,
    awayBadgeUrl: e.strAwayTeamBadge,
    venue: e.strVenue,
    status: e.strStatus,
    homeScore: e.intHomeScore,
    awayScore: e.intAwayScore,
    kickoffLabel: `${formatEventDateLabel(e)} · ${kickoff.time} ${kickoff.period}`,
    season: e.strSeason,
    bannerUrl: e.strBanner ?? e.strPoster,
    body: buildNewsBody(e, kind),
  };

  if (kind === 'past') {
    return {
      ...base,
      id: `${sport}-past-${e.idEvent}`,
      title: e.strEvent,
      summary: formatResultSummary(e),
      imageUrl: e.strThumb ?? e.strPoster ?? e.strHomeTeamBadge,
    };
  }
  return {
    ...base,
    id: `${sport}-next-${e.idEvent}`,
    title: `Upcoming: ${e.strHomeTeam} vs ${e.strAwayTeam}`,
    summary: `${e.strLeague} · ${e.strVenue ?? 'TBC'} · ${formatEventDateLabel(e)}`,
    imageUrl: e.strThumb ?? e.strPoster ?? e.strLeagueBadge,
  };
}

async function fetchLeagueNews(leagueId: string, sport: NewsSport): Promise<SportsNewsItem[]> {
  const [past, upcoming, today] = await Promise.all([
    fetchPastLeagueEvents(leagueId),
    fetchUpcomingLeagueEvents(leagueId),
    fetchEventsToday(sport === 'soccer' ? 'Soccer' : 'Cricket'),
  ]);

  const fromPast = past.slice(0, 10).map((e) => eventToNewsItem(e, sport, 'past'));
  const fromUpcoming = upcoming.slice(0, 6).map((e) => eventToNewsItem(e, sport, 'next'));
  const fromToday = today
    .filter((e) => e.idLeague === leagueId || e.strSport === (sport === 'soccer' ? 'Soccer' : 'Cricket'))
    .slice(0, 6)
    .map((e) =>
      e.strStatus === 'Not Started'
        ? eventToNewsItem(e, sport, 'next')
        : eventToNewsItem(e, sport, 'past'),
    );

  const seen = new Set<string>();
  const merged: SportsNewsItem[] = [];
  for (const item of [...fromPast, ...fromToday, ...fromUpcoming]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

export async function fetchSportsNews(leagueId = DEFAULT_LEAGUE_ID): Promise<SportsNewsItem[]> {
  const feed = await fetchSportsNewsFeed();
  if (leagueId === CRICKET_LEAGUE_ID) return feed.cricket;
  return feed.soccer;
}

export async function fetchSportsNewsFeed(): Promise<SportsNewsFeed> {
  const [soccer, cricket] = await Promise.all([
    fetchLeagueNews(SOCCER_LEAGUE_ID, 'soccer'),
    fetchLeagueNews(CRICKET_LEAGUE_ID, 'cricket'),
  ]);
  return { soccer, cricket };
}

function formatResultSummary(e: SportsDbEvent): string {
  const score =
    e.intHomeScore != null && e.intAwayScore != null
      ? `${e.intHomeScore}–${e.intAwayScore}`
      : 'Final';
  const venue = e.strVenue ? ` at ${e.strVenue}` : '';
  return `${e.strLeague} · ${score}${venue}`;
}

function parseEventDate(event: SportsDbEvent): Date {
  if (event.strTimestamp) {
    const d = new Date(event.strTimestamp);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const time = (event.strTime ?? '12:00:00').slice(0, 8);
  return new Date(`${event.dateEvent}T${time}`);
}

export function formatEventDateLabel(event: SportsDbEvent): string {
  const d = parseEventDate(event);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((eventDay.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatEventTime12h(event: SportsDbEvent): { time: string; period: string } {
  const d = parseEventDate(event);
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const time = m > 0 ? `${h12}:${String(m).padStart(2, '0')}` : String(h12);
  return { time, period };
}

export function eventToDashboardMatch(
  event: SportsDbEvent,
  live = false,
  sport?: NewsSport,
): DashboardMatch {
  const { time, period } = formatEventTime12h(event);
  const liveNow = live || isLiveEvent(event);
  const resolvedSport =
    sport ?? (event.strSport === 'Cricket' ? 'cricket' : 'soccer');
  return {
    id: event.idEvent,
    sport: resolvedSport,
    tournament: event.strLeague.toUpperCase(),
    time: liveNow && event.intHomeScore != null ? `${event.intHomeScore}–${event.intAwayScore}` : time,
    period: liveNow && event.intHomeScore != null ? 'LIVE' : period,
    day: liveNow ? (event.strStatus || 'Live') : formatEventDateLabel(event),
    home: {
      name: event.strHomeTeam,
      rank: liveNow ? event.strStatus : 'HOME',
      badgeUrl: event.strHomeTeamBadge,
      accent: 'secondary',
    },
    away: {
      name: event.strAwayTeam,
      rank: event.strVenue ?? 'AWAY',
      badgeUrl: event.strAwayTeamBadge,
      accent: 'primary',
    },
    isLive: liveNow,
    homeScore: event.intHomeScore ?? undefined,
    awayScore: event.intAwayScore ?? undefined,
    statusLabel: event.strStatus,
  };
}

export async function fetchAllUpcomingMatches(): Promise<UpcomingMatchesFeed> {
  const [soccerEvents, cricketEvents] = await Promise.all([
    fetchUpcomingLeagueEvents(SOCCER_LEAGUE_ID),
    fetchUpcomingLeagueEvents(CRICKET_LEAGUE_ID),
  ]);
  return {
    soccer: soccerEvents.map((e) => eventToDashboardMatch(e, false, 'soccer')),
    cricket: cricketEvents.map((e) => eventToDashboardMatch(e, false, 'cricket')),
  };
}
