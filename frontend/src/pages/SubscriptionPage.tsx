import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchSubscriptionPlans,
  purchasePlan,
  type SubscriptionPlan,
} from '../api/subscriptions';
import { storePalzioCheckoutToken } from '../api/palzio';
import ScreenHeader from '../components/ScreenHeader';
import { useEntitlements } from '../context/EntitlementsContext';
import { useI18n } from '../i18n';
import './SubscriptionPage.css';

type BillingTab = { id: string; label: string; sub: string };

const FALLBACK_TABS: BillingTab[] = [
  { id: 'daily', label: 'Daily', sub: '24h pass' },
  { id: 'weekly', label: 'Weekly', sub: '7 days' },
  { id: 'season', label: 'Season', sub: '~90 days' },
];

const TAB_META: Record<string, { label: string; sub: string }> = {
  daily: { label: 'Daily', sub: '24h pass' },
  weekly: { label: 'Weekly', sub: '7 days' },
  season: { label: 'Season', sub: '~90 days' },
};

function sportFeatures(sport: 'soccer' | 'cricket'): string[] {
  if (sport === 'soccer') {
    return [
      'Live Afghan soccer & league coverage',
      'Full Watch + Play arena access',
      'Season highlights & replays',
    ];
  }
  return [
    'Live Afghan cricket & domestic fixtures',
    'Multi-cam streams & match-day hub',
    'Highlights & fan replays',
  ];
}

const SPORT_OFFERS = [
  {
    sport: 'soccer' as const,
    title: 'Afghan Soccer',
    icon: 'sports_soccer',
    pickEntitlements: ['game_and_streaming', 'game_only'] as string[],
    featured: true,
  },
  {
    sport: 'cricket' as const,
    title: 'Afghan Cricket',
    icon: 'sports_cricket',
    pickEntitlements: ['streaming_only', 'game_and_streaming'] as string[],
    featured: false,
  },
];

function resolveSportPlans(plans: SubscriptionPlan[], billingPeriod: string) {
  const periodPlans = plans.filter((p) => p.billing_period === billingPeriod);
  const usedIds = new Set<string>();

  return SPORT_OFFERS.map((offer) => {
    const plan = periodPlans.find(
      (p) => offer.pickEntitlements.includes(p.entitlement_type) && !usedIds.has(p.id),
    );
    if (plan) usedIds.add(plan.id);
    return { offer, plan: plan ?? null };
  }).filter((row): row is { offer: (typeof SPORT_OFFERS)[number]; plan: SubscriptionPlan } => row.plan !== null);
}

const SubscriptionPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { profile } = useEntitlements();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('weekly');

  const load = useCallback(async () => {
    setLoadError(null);
    setLoadingPlans(true);
    try {
      const list = await fetchSubscriptionPlans({ eligible_for_me: true });
      setPlans(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load plans.');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Fanverse Plus | Sovereign Fanverse';
    void load();
  }, [load]);

  const tabs: BillingTab[] = useMemo(() => {
    if (plans.length === 0) return FALLBACK_TABS;
    const seen = new Set<string>();
    const order: string[] = [];
    for (const p of plans) {
      if (!seen.has(p.billing_period)) {
        seen.add(p.billing_period);
        order.push(p.billing_period);
      }
    }
    const known = ['daily', 'weekly', 'season'].filter((k) => seen.has(k));
    const extras = order.filter((k) => !known.includes(k));
    return [...known, ...extras].map((id) => ({
      id,
      label: TAB_META[id]?.label ?? id,
      sub: TAB_META[id]?.sub ?? '',
    }));
  }, [plans]);

  useEffect(() => {
    if (tabs.length === 0) return;
    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const visiblePlans = useMemo(
    () => resolveSportPlans(plans, activeTab),
    [plans, activeTab],
  );

  const startCheckout = async (plan: SubscriptionPlan) => {
    if (plan.purchase_block_reason) return;
    if (!profile?.profile_complete) {
      navigate('/profile?onboarding=1');
      return;
    }
    setBuyError(null);
    setBuyingId(plan.id);
    try {
      const res = await purchasePlan(plan.id);
      storePalzioCheckoutToken(res.transaction_ref, res.checkout_token);
      const q = new URLSearchParams({
        transaction_ref: res.transaction_ref,
        checkout_token: res.checkout_token,
      });
      navigate(`/pay/palzio?${q.toString()}`);
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Checkout could not start.');
    } finally {
      setBuyingId(null);
    }
  };

  const profileIncomplete = Boolean(profile && !profile.profile_complete);

  return (
    <div className="subpage">
      <main className="subpage-main">
        <ScreenHeader title={t('sub.screenTitle')} />
        <section className="subpage-hero">
          <div className="subpage-hero-badge">
            <span className="subpage-label-gold">AFGHAN SOCCER · CRICKET</span>
          </div>
          <h1 className="subpage-title">
            FANVERSE <span className="subpage-title-accent">PLUS</span>
          </h1>
          <p className="subpage-lead">
            Choose your pass for Afghan soccer and cricket. Pick a billing period, then continue to secure checkout.
          </p>
          <div className="subpage-hero-links">
            <Link to="/dashboard" className="subpage-text-link">
              Dashboard
            </Link>
            <span className="subpage-hero-links-sep" aria-hidden>
              {'//'}
            </span>
            <Link to="/profile" className="subpage-text-link">
              Account
            </Link>
          </div>
          <div className="subpage-holo-line" aria-hidden />
        </section>

        {profileIncomplete && (
          <section className="subpage-inline-note" aria-live="polite">
            <p>
              Complete your profile (display name and handle) before checkout.{' '}
              <Link to="/profile?onboarding=1">Open profile</Link>
            </p>
          </section>
        )}

        <section className="subpage-pricing-v2" aria-label="Plans">
          <div className="subpage-period-tabs" role="tablist" aria-label="Billing period">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`subpage-period-tab${isActive ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="subpage-period-tab-label">{tab.label}</span>
                  {tab.sub && <span className="subpage-period-tab-sub">{tab.sub}</span>}
                </button>
              );
            })}
          </div>

          {loadingPlans && <p className="subpage-plans-status">Loading plans…</p>}

          {loadError && (
            <p className="subpage-plans-status subpage-plans-status--err">
              {loadError}{' '}
              <button type="button" className="subpage-retry-btn" onClick={() => void load()}>
                Retry
              </button>
            </p>
          )}

          {buyError && <p className="subpage-plans-status subpage-plans-status--err">{buyError}</p>}

          {!loadingPlans && !loadError && plans.length === 0 && (
            <p className="subpage-plans-status">No eligible plans are available right now.</p>
          )}

          {!loadingPlans && !loadError && plans.length > 0 && visiblePlans.length === 0 && (
            <p className="subpage-plans-status">No plans for this billing period.</p>
          )}

          <div className="subpage-plans-grid-v2" role="tabpanel">
            {visiblePlans.map(({ offer, plan }) => {
              const blocked = Boolean(plan.purchase_block_reason);
              const priceNum = Number(plan.price_afn);
              const priceDisplay = Number.isFinite(priceNum) ? priceNum.toLocaleString() : plan.price_afn;
              const busy = buyingId === plan.id;
              const featured = offer.featured;
              const features = sportFeatures(offer.sport);
              return (
                <article
                  key={plan.id}
                  className={`subpage-card${featured ? ' subpage-card--featured' : ''}${
                    blocked ? ' subpage-card--blocked' : ''
                  }`}
                >
                  {featured && <div className="subpage-card-pill">Best value</div>}
                  <div className="subpage-card-icon" aria-hidden>
                    <span className="material-symbols-outlined">{offer.icon}</span>
                  </div>
                  <h3 className="subpage-card-tier">{offer.title}</h3>
                  <p className="subpage-card-name">{plan.name}</p>

                  <div className="subpage-card-price-row">
                    <span className="subpage-card-price">{priceDisplay}</span>
                    <span className="subpage-card-currency">{plan.currency || 'AFN'}</span>
                  </div>
                  <p className="subpage-card-duration">{plan.duration_hours}h access</p>

                  {features.length > 0 && (
                    <ul className="subpage-card-features">
                      {features.map((f) => (
                        <li key={f}>
                          <span className="material-symbols-outlined" aria-hidden>
                            check_circle
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {blocked && plan.purchase_block_reason && (
                    <p className="subpage-card-block">{plan.purchase_block_reason}</p>
                  )}

                  <button
                    type="button"
                    className={`subpage-card-cta${featured ? ' subpage-card-cta--gold' : ''}`}
                    disabled={blocked || busy}
                    onClick={() => void startCheckout(plan)}
                  >
                    {busy
                      ? 'Starting…'
                      : profileIncomplete
                      ? 'Complete profile first'
                      : blocked
                      ? 'Unavailable'
                      : 'Continue to payment'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="subpage-trust">
          <p className="subpage-trust-line">NETWORK INFRASTRUCTURE BY AFGHAN WIRELESS</p>
          <div className="subpage-trust-icons" aria-hidden>
            <span className="material-symbols-outlined">security</span>
            <span className="material-symbols-outlined">verified_user</span>
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <p className="subpage-note">Checkout uses the Palzio mock gateway in this build.</p>
        </section>
      </main>

      <div className="subpage-silhouette" aria-hidden>
        <div className="subpage-holo-line subpage-silhouette-line" />
      </div>
    </div>
  );
};

export default SubscriptionPage;
