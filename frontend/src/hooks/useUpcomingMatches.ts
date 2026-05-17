import { useCallback, useEffect, useState } from 'react';
import {
  fetchAllUpcomingMatches,
  type UpcomingMatchesFeed,
} from '../api/sportsDb';

export function useUpcomingMatches() {
  const [feed, setFeed] = useState<UpcomingMatchesFeed>({ soccer: [], cricket: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUpcomingMatches();
      setFeed(data);
    } catch {
      setError('Could not load upcoming matches.');
      setFeed({ soccer: [], cricket: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { feed, loading, error, refresh: load };
}
