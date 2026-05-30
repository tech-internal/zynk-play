import { useCallback, useEffect, useState } from 'react';
import { fetchXpBalance, getAuthUserId } from '../api/xp';

type UseXpBalanceOptions = {
  enabled?: boolean;
};

export function useXpBalance(options: UseXpBalanceOptions = {}) {
  const { enabled = true } = options;
  const userId = getAuthUserId();
  const [availableXp, setAvailableXp] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!userId) {
        setLoading(false);
        setError('Sign in to view XP');
        return;
      }
      if (!silent) setLoading(true);
      setError(null);
      try {
        const balance = await fetchXpBalance(userId);
        setAvailableXp(balance.available_xp);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load XP balance');
        setAvailableXp(0);
      } finally {
        setLoading(false);
      }
    },
    [enabled, userId],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void load();
  }, [enabled, load]);

  const refresh = useCallback(() => load(true), [load]);

  return { availableXp, loading, error, refresh };
}
