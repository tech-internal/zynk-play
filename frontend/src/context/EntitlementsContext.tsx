import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { awardDailyLoginXp, getAuthUserId } from '../api/xp';
import { fetchSubscriptionStatus, type SubscriptionStatusResponse } from '../api/subscriptions';
import { fetchUserProfile, type UserProfile } from '../api/user';
import { isAuthenticated } from '../utils/authSession';

export type EntitlementsContextValue = {
  profile: UserProfile | null;
  subStatus: SubscriptionStatusResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canWatchPlayEarn: boolean;
  needsProfileCompletion: boolean;
  needsSubscription: boolean;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [p, s] = await Promise.all([fetchUserProfile(), fetchSubscriptionStatus()]);
      setProfile(p);
      setSubStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load account');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    const userId = getAuthUserId();
    if (!userId) return;
    void awardDailyLoginXp(userId);
  }, []);

  const needsProfileCompletion = Boolean(profile && !profile.profile_complete);
  const needsSubscription = Boolean(profile && subStatus && !subStatus.has_active_subscription);
  const canWatchPlayEarn = Boolean(profile?.profile_complete && subStatus?.has_active_subscription);

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      profile,
      subStatus,
      loading,
      error,
      refresh,
      canWatchPlayEarn,
      needsProfileCompletion,
      needsSubscription,
    }),
    [profile, subStatus, loading, error, refresh, canWatchPlayEarn, needsProfileCompletion, needsSubscription],
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): EntitlementsContextValue {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) {
    throw new Error('useEntitlements must be used within EntitlementsProvider');
  }
  return ctx;
}
