import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAllXpTransactions,
  fetchXpBalance,
  fetchXpRules,
  getAuthUserId,
  type XpBalance,
  type XpCategory,
  type XpRule,
  type XpTransaction,
} from '../api/xp';
import { EARN_CATEGORY_ORDER, groupRulesByCategory, sumXpToday } from '../utils/xpDisplay';

const DEFAULT_DAILY_GOAL = 10;

type UseXpEarnHubOptions = {
  enabled?: boolean;
};

export function useXpEarnHub(options: UseXpEarnHubOptions = {}) {
  const { enabled = true } = options;
  const userId = getAuthUserId();
  const [balance, setBalance] = useState<XpBalance | null>(null);
  const [rules, setRules] = useState<XpRule[]>([]);
  const [credits, setCredits] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!enabled) return;
    if (!userId) {
      setLoading(false);
      setError('Sign in to view XP');
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [bal, ruleItems, txnItems] = await Promise.all([
        fetchXpBalance(userId),
        fetchXpRules({ is_active: true }),
        fetchAllXpTransactions(userId, { transaction_type: 'credit', per_page: 100 }),
      ]);
      setBalance(bal);
      setRules(ruleItems);
      setCredits(txnItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load XP data');
      setBalance(null);
      setRules([]);
      setCredits([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void load();
  }, [enabled, load]);

  const rulesByCategory = useMemo(() => groupRulesByCategory(rules), [rules]);

  const categoriesWithRules = useMemo(
    () => EARN_CATEGORY_ORDER.filter((cat) => rulesByCategory[cat]?.length > 0),
    [rulesByCategory],
  );

  const todayXp = useMemo(() => sumXpToday(credits), [credits]);

  const dailyGoal = useMemo(() => {
    const loginRule = rules.find((r) => r.event_code === 'LOGIN_DAILY');
    return loginRule?.daily_cap_xp ?? DEFAULT_DAILY_GOAL;
  }, [rules]);

  const availableXp = balance?.available_xp ?? 0;

  return {
    userId,
    balance,
    rules,
    credits,
    rulesByCategory,
    categoriesWithRules,
    todayXp,
    dailyGoal,
    availableXp,
    loading,
    error,
    refresh: () => load(true),
  };
}

export type { XpCategory, XpRule };
