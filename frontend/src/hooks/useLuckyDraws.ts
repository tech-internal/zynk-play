import { useCallback, useEffect, useState } from 'react';
import {
  enterLuckyDraw,
  fetchLuckyDrawAnnouncements,
  fetchLuckyDraws,
  type EnterLuckyDrawResult,
  type LuckyDraw,
  type LuckyDrawAnnouncement,
} from '../api/luckyDraw';

export function useLuckyDraws() {
  const [draws, setDraws] = useState<LuckyDraw[]>([]);
  const [announcements, setAnnouncements] = useState<LuckyDrawAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [openDraws, recentWinners] = await Promise.all([
        fetchLuckyDraws({ status: 'open' }),
        fetchLuckyDrawAnnouncements(),
      ]);
      setDraws(openDraws);
      setAnnouncements(recentWinners);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load lucky draws');
      setDraws([]);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enter = useCallback(
    async (drawId: string): Promise<EnterLuckyDrawResult> => {
      setEnteringId(drawId);
      try {
        const result = await enterLuckyDraw(drawId);
        await load(true);
        return result;
      } finally {
        setEnteringId(null);
      }
    },
    [load],
  );

  return {
    draws,
    announcements,
    loading,
    error,
    enteringId,
    refresh: load,
    enter,
  };
}
