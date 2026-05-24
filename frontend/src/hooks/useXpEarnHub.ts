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

export function useXpEarnHub() {
  const userId = getAuthUserId();
  const [balance, setBalance] = useState<XpBalance | null>(null);
  const [rules, setRules] = useState<XpRule[]>([]);
  const [credits, setCredits] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError('Sign in to view XP');
      return;
    }
    setLoading(true);
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
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

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
    refresh: load,
  };
}

export type { XpCategory, XpRule };
