import { useCallback, useEffect, useState } from 'react';
import {
  DashboardMatch,
  DEFAULT_LEAGUE_ID,
  eventToDashboardMatch,
  fetchLiveSoccerEvents,
  fetchUpcomingLeagueEvents,
} from '../api/sportsDb';

type SportsMatchesState = {
  upcoming: DashboardMatch[];
  live: DashboardMatch[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useSportsMatches(leagueId = DEFAULT_LEAGUE_ID): SportsMatchesState {
  const [upcoming, setUpcoming] = useState<DashboardMatch[]>([]);
  const [live, setLive] = useState<DashboardMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [upcomingEvents, liveEvents] = await Promise.all([
        fetchUpcomingLeagueEvents(leagueId),
        fetchLiveSoccerEvents(),
      ]);
      setUpcoming(upcomingEvents.map((e) => eventToDashboardMatch(e)));
      setLive(liveEvents.map((e) => eventToDashboardMatch(e, true)));
    } catch {
      setError('Could not load match data. Showing cached layout.');
      setUpcoming([]);
      setLive([]);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  return { upcoming, live, loading, error, refresh: load };
}
