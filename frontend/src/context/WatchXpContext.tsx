import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAllXpTransactions,
  fetchXpBalance,
  fetchXpRules,
  getAuthUserId,
  triggerXpEvent,
  type XpRule,
} from '../api/xp';
import { sumXpToday } from '../utils/xpDisplay';
import { isAuthenticated } from '../utils/authSession';

type WatchXpContextValue = {
  availableXp: number;
  todayWatchXp: number;
  perAwardXp: number;
  countdownSeconds: number;
  sessionStarted: boolean;
  loading: boolean;
  startSession: () => void;
  refresh: () => Promise<void>;
};

type WatchCachePayload = {
  availableXp: number;
  todayWatchXp: number;
  perAwardXp: number;
  countdownSeconds: number;
  sessionStarted: boolean;
  updatedAt: number;
};

const DEFAULT_INTERVAL_SECONDS = 300;
const WATCH_CACHE_TTL_MS = 2 * 60 * 1000;
const WATCH_REFRESH_MS = 60 * 1000;

const WatchXpContext = createContext<WatchXpContextValue | null>(null);

function cacheKey(userId: string): string {
  return `watch-xp-cache:${userId}`;
}

function readCache(userId: string): WatchCachePayload | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WatchCachePayload;
    if (Date.now() - parsed.updatedAt > WATCH_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: Omit<WatchCachePayload, 'updatedAt'>): void {
  try {
    window.localStorage.setItem(cacheKey(userId), JSON.stringify({ ...data, updatedAt: Date.now() }));
  } catch {
    // ignore storage failures
  }
}

export function WatchXpProvider({ children }: { children: React.ReactNode }) {
  const userId = getAuthUserId();
  const awardingRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const countdownRef = useRef(DEFAULT_INTERVAL_SECONDS);
  const [watchRule, setWatchRule] = useState<XpRule | null>(null);
  const [availableXp, setAvailableXp] = useState(0);
  const [todayWatchXp, setTodayWatchXp] = useState(0);
  const [perAwardXp, setPerAwardXp] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(DEFAULT_INTERVAL_SECONDS);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  const hydrateFromCache = useCallback(() => {
    if (!userId) return;
    const cached = readCache(userId);
    if (!cached) return;
    setAvailableXp(cached.availableXp);
    setTodayWatchXp(cached.todayWatchXp);
    setPerAwardXp(cached.perAwardXp);
    setCountdownSeconds(cached.countdownSeconds);
    setSessionStarted(cached.sessionStarted);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId || !isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      const [balance, watchRules, txns] = await Promise.all([
        fetchXpBalance(userId),
        fetchXpRules({ category: 'watch', is_active: true }),
        fetchAllXpTransactions(userId, {
          transaction_type: 'credit',
          category: 'watch',
          per_page: 100,
        }),
      ]);
      const selectedRule =
        watchRules
          .filter((r) => r.event_code.startsWith('WATCH_STREAM_') && r.cooldown_seconds > 0)
          .sort((a, b) => a.cooldown_seconds - b.cooldown_seconds)[0] ??
        watchRules.find((r) => r.cooldown_seconds > 0) ??
        null;

      const resolvedInterval = selectedRule?.cooldown_seconds ?? DEFAULT_INTERVAL_SECONDS;
      const resolvedPerAward = selectedRule?.base_xp ?? 0;
      const resolvedToday = sumXpToday(txns);

      setWatchRule(selectedRule);
      setAvailableXp(balance.available_xp);
      setTodayWatchXp(resolvedToday);
      setPerAwardXp(resolvedPerAward);
      setCountdownSeconds((prev) => {
        if (prev <= 0 || prev > resolvedInterval) return resolvedInterval;
        return prev;
      });

      writeCache(userId, {
        availableXp: balance.available_xp,
        todayWatchXp: resolvedToday,
        perAwardXp: resolvedPerAward,
        countdownSeconds: countdownRef.current,
        sessionStarted: sessionStartedRef.current,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const startSession = useCallback(() => {
    setSessionStarted(true);
  }, []);

  useEffect(() => {
    hydrateFromCache();
    void refresh();
  }, [hydrateFromCache, refresh]);

  useEffect(() => {
    countdownRef.current = countdownSeconds;
  }, [countdownSeconds]);

  useEffect(() => {
    sessionStartedRef.current = sessionStarted;
  }, [sessionStarted]);

  useEffect(() => {
    if (!userId) return;
    writeCache(userId, {
      availableXp,
      todayWatchXp,
      perAwardXp,
      countdownSeconds,
      sessionStarted,
    });
  }, [userId, availableXp, todayWatchXp, perAwardXp, countdownSeconds, sessionStarted]);

  useEffect(() => {
    if (!sessionStarted || !isAuthenticated()) return;
    const timer = window.setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionStarted]);

  useEffect(() => {
    if (!sessionStarted || !userId || !watchRule || countdownSeconds > 0 || awardingRef.current) return;

    const intervalSeconds = watchRule.cooldown_seconds || DEFAULT_INTERVAL_SECONDS;
    const award = async () => {
      awardingRef.current = true;
      try {
        const bucket = Math.floor(Date.now() / (intervalSeconds * 1000));
        const result = await triggerXpEvent({
          event_code: watchRule.event_code,
          user_id: userId,
          idempotency_key: `watch-global-${watchRule.event_code}-${userId}-${bucket}`,
          source_metadata: { source: 'global_watch_session', action: 'watch_interval' },
          unit_count: 1,
        });
        const gained = Math.max(0, result.xp_awarded ?? watchRule.base_xp ?? 0);
        setTodayWatchXp((prev) => prev + gained);
        setAvailableXp(result.new_balance);
      } catch {
        // Keep cycle alive even on occasional API failures.
      } finally {
        setCountdownSeconds(intervalSeconds);
        awardingRef.current = false;
      }
    };
    void award();
  }, [sessionStarted, userId, watchRule, countdownSeconds]);

  useEffect(() => {
    if (!userId || !sessionStarted) return;
    const refreshTimer = window.setInterval(() => {
      void refresh();
    }, WATCH_REFRESH_MS);
    return () => window.clearInterval(refreshTimer);
  }, [userId, sessionStarted, refresh]);

  const value = useMemo<WatchXpContextValue>(
    () => ({
      availableXp,
      todayWatchXp,
      perAwardXp,
      countdownSeconds,
      sessionStarted,
      loading,
      startSession,
      refresh,
    }),
    [availableXp, todayWatchXp, perAwardXp, countdownSeconds, sessionStarted, loading, startSession, refresh],
  );

  return <WatchXpContext.Provider value={value}>{children}</WatchXpContext.Provider>;
}

export function useWatchXp(): WatchXpContextValue {
  const ctx = useContext(WatchXpContext);
  if (ctx) return ctx;
  return {
    availableXp: 0,
    todayWatchXp: 0,
    perAwardXp: 0,
    countdownSeconds: DEFAULT_INTERVAL_SECONDS,
    sessionStarted: false,
    loading: false,
    startSession: () => {},
    refresh: async () => {},
  };
}
