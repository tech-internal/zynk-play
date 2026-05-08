import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getMockAuthSession } from '../utils/authSession';
import { storePalzioCheckoutToken } from '../api/palzio';
import {
  cancelSubscription,
  fetchPaymentHistory,
  fetchSubscriptionHistory,
  fetchSubscriptionPlans,
  fetchSubscriptionStatus,
  purchasePlan,
  type PaymentTransactionRow,
  type SubscriptionPlan,
  type SubscriptionStatusResponse,
  type UserSubscriptionRow,
} from '../api/subscriptions';
import { fetchUserProfile, updateUserProfile, type UserProfile } from '../api/user';
import ApiLoaderOverlay from '../components/ApiLoaderOverlay';
import './ProfilePage.css';

const periodLabels: Record<string, string> = {
  daily: 'Daily pass',
  weekly: 'Weekly',
  season: 'Season (~3 mo)',
};

const entitlementLabels: Record<string, string> = {
  game_only: 'Game only',
  game_and_streaming: 'Game + streaming',
  streaming_only: 'Streaming only',
};

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type TabId = 'account' | 'subscriptions' | 'transactions';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getMockAuthSession();
  const [tab, setTab] = useState<TabId>('account');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [history, setHistory] = useState<UserSubscriptionRow[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [txns, setTxns] = useState<PaymentTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: '',
    full_name: '',
    email: '',
    country: '',
  });

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, st, hist, pls, txs] = await Promise.all([
        fetchUserProfile(),
        fetchSubscriptionStatus(),
        fetchSubscriptionHistory(),
        fetchSubscriptionPlans(),
        fetchPaymentHistory(),
      ]);
      setProfile(me);
      setStatus(st);
      setHistory(hist);
      setPlans(pls);
      setTxns(txs);
      setAccountForm({
        username: me.username ?? '',
        full_name: me.full_name ?? '',
        email: me.email ?? '',
        country: me.country ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Game Palazio | Profile';
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('paid') !== '1') return;
    navigate({ pathname: '/profile', search: '' }, { replace: true });
    void loadAll();
    setTab('subscriptions');
  }, [location.search, navigate, loadAll]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedBlocked = Boolean(selectedPlan?.purchase_block_reason);
  const onboardingRequested = new URLSearchParams(location.search).get('onboarding') === '1';
  const needsProfile = Boolean(profile && !profile.profile_complete);
  const needsSubscription = Boolean(status && !status.has_active_subscription);
  const isOnboardingFlow = onboardingRequested || needsProfile || needsSubscription;
  const onboardingStep = needsProfile ? 1 : needsSubscription ? 2 : 3;

  useEffect(() => {
    if (!isOnboardingFlow || loading) return;
    if (needsProfile && tab !== 'account') {
      setTab('account');
      return;
    }
    if (!needsProfile && needsSubscription && tab !== 'subscriptions') {
      setTab('subscriptions');
    }
  }, [isOnboardingFlow, loading, needsProfile, needsSubscription, tab]);

  const handlePurchase = async () => {
    if (!selectedPlanId || selectedBlocked) {
      setError(selectedBlocked ? 'This plan is not available for your current access.' : 'Select a plan first.');
      return;
    }
    setPurchaseBusy(true);
    setError(null);
    try {
      const checkout = await purchasePlan(selectedPlanId);
      storePalzioCheckoutToken(checkout.transaction_ref, checkout.checkout_token);
      navigate(`/pay/palzio?transaction_ref=${encodeURIComponent(checkout.transaction_ref)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed.');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this subscription? It will show as cancelled in your history.')) return;
    setError(null);
    try {
      await cancelSubscription(id);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel.');
    }
  };

  const handleSaveAccount = async () => {
    const trimmedUsername = accountForm.username.trim();
    const trimmedName = accountForm.full_name.trim();
    const trimmedEmail = accountForm.email.trim();

    if (isOnboardingFlow) {
      if (trimmedUsername.length < 3) {
        setError('Please choose a username with at least 3 characters.');
        return;
      }
      if (trimmedName.length < 2) {
        setError('Please enter your full name to continue.');
        return;
      }
      if (!looksLikeEmail(trimmedEmail)) {
        setError('Please enter a valid email address to continue.');
        return;
      }
    }

    setAccountBusy(true);
    setError(null);
    try {
      const updated = await updateUserProfile({
        username: trimmedUsername.length ? trimmedUsername : null,
        full_name: trimmedName,
        email: trimmedEmail,
        country: accountForm.country.trim(),
      });
      setProfile(updated);
      if (isOnboardingFlow && updated.profile_complete) {
        setTab('subscriptions');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.');
    } finally {
      setAccountBusy(false);
    }
  };

  const tabTitle =
    tab === 'account' ? 'Account' : tab === 'subscriptions' ? 'Subscriptions & billing' : 'Transactions';
  const overlayLabel = loading
    ? 'Loading your player profile...'
    : accountBusy
      ? 'Saving your profile...'
      : purchaseBusy
        ? 'Preparing secure checkout...'
        : 'Syncing account...';

  return (
    <div className="profile-page">
      <ApiLoaderOverlay active={loading || accountBusy || purchaseBusy} label={overlayLabel} />
      <section className="profile-hero">
        <div className="profile-hero-inner">
          <p className="profile-kicker">Account</p>
          <h1 className="profile-title">{tabTitle}</h1>
          <p className="profile-lede">
            Mobile sign-in: <strong>{session?.phone_number ?? profile?.phone_number ?? '—'}</strong>. Use the tabs
            below to edit your profile, manage plans, or review payments.
          </p>
          {isOnboardingFlow && (
            <div className="profile-onboarding-strip" role="status" aria-live="polite">
              <p className="profile-onboarding-title">
                {onboardingStep < 3
                  ? `Step ${onboardingStep} of 2: ${onboardingStep === 1 ? 'Complete profile' : 'Choose plan and pay'}`
                  : 'Onboarding complete'}
              </p>
              <p className="profile-onboarding-copy">
                {onboardingStep === 1
                  ? 'Add your profile details first, then continue to subscription.'
                  : onboardingStep === 2
                    ? 'Select a plan and finish payment now to unlock streaming and gameplay.'
                    : 'Your account is ready. You can now use all features.'}
              </p>
            </div>
          )}
          <div className="profile-actions">
            <Link to="/dashboard" className="btn-gold profile-btn">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="profile-container">
        <nav className="profile-tabs" aria-label="Profile sections">
          <button
            type="button"
            className={`profile-tab ${tab === 'account' ? 'active' : ''}`}
            onClick={() => setTab('account')}
          >
            Account
          </button>
          <button
            type="button"
            className={`profile-tab ${tab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setTab('subscriptions')}
          >
            Subscriptions
          </button>
          <button
            type="button"
            className={`profile-tab ${tab === 'transactions' ? 'active' : ''}`}
            onClick={() => setTab('transactions')}
          >
            Transactions
          </button>
        </nav>

        {loading && <p className="profile-muted">Loading…</p>}
        {error && <p className="profile-error">{error}</p>}

        {!loading && tab === 'account' && profile && (
          <section className="profile-card">
            <h2>Your details</h2>
            <p className="profile-muted">
              Username must be unique. Mobile comes from OTP sign-in and cannot be changed here.
            </p>
            {isOnboardingFlow && (
              <div className="profile-onboarding-card">
                <strong>Complete your profile to continue</strong>
                <p>
                  Fill username, full name, and email. Once saved, we will take you straight to plans and payment.
                </p>
              </div>
            )}
            <div className="profile-account-form">
              <div className="profile-field">
                <label htmlFor="pf-phone">Mobile</label>
                <input id="pf-phone" type="text" value={profile.phone_number} disabled autoComplete="tel" />
                <p className="profile-field-hint">Verified at login.</p>
              </div>
              <div className="profile-field">
                <label htmlFor="pf-user">Username</label>
                <input
                  id="pf-user"
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm((s) => ({ ...s, username: e.target.value }))}
                  autoComplete="username"
                  maxLength={30}
                  placeholder="Choose a unique handle"
                />
                <p className="profile-field-hint">Letters, digits, underscores; at least 3 characters.</p>
              </div>
              <div className="profile-field">
                <label htmlFor="pf-name">Full name</label>
                <input
                  id="pf-name"
                  type="text"
                  value={accountForm.full_name}
                  onChange={(e) => setAccountForm((s) => ({ ...s, full_name: e.target.value }))}
                  autoComplete="name"
                  placeholder="Your full name"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="pf-email">Email</label>
                <input
                  id="pf-email"
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm((s) => ({ ...s, email: e.target.value }))}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="pf-country">Country / region</label>
                <input
                  id="pf-country"
                  type="text"
                  value={accountForm.country}
                  onChange={(e) => setAccountForm((s) => ({ ...s, country: e.target.value }))}
                  autoComplete="country-name"
                  placeholder="Optional"
                />
              </div>
              <button type="button" className="btn-gold profile-buy" disabled={accountBusy} onClick={() => void handleSaveAccount()}>
                {accountBusy ? 'Saving…' : 'Save profile'}
              </button>
              {isOnboardingFlow && (
                <button
                  type="button"
                  className="profile-secondary-btn"
                  onClick={() => setTab('subscriptions')}
                  disabled={!profile.profile_complete}
                >
                  Continue to plans
                </button>
              )}
              {profile.profile_complete ? (
                <p className="profile-muted" style={{ margin: 0 }}>
                  Profile looks complete. You can still update any field.
                </p>
              ) : (
                <p className="profile-muted" style={{ margin: 0 }}>
                  Add a username and full name to complete your public profile.
                </p>
              )}
            </div>
          </section>
        )}

        {!loading && tab === 'subscriptions' && status && (
          <>
            {isOnboardingFlow && (
              <section className="profile-card profile-card-focus">
                <h2>Choose a plan and pay now</h2>
                <p className="profile-muted">
                  Your account is set up. Pick a plan below and complete Palzio checkout to start watching and playing.
                </p>
              </section>
            )}
            <section className="profile-card">
              <h2>Current access</h2>
              <ul className="profile-entitlements">
                <li>
                  <span>Games</span>
                  <strong className={status.has_game_entitlement ? 'ok' : 'no'}>
                    {status.has_game_entitlement ? 'Included' : 'Not subscribed'}
                  </strong>
                </li>
                <li>
                  <span>Streaming</span>
                  <strong className={status.has_streaming_entitlement ? 'ok' : 'no'}>
                    {status.has_streaming_entitlement ? 'Included' : 'Not subscribed'}
                  </strong>
                </li>
                <li>
                  <span>Free trial (streaming)</span>
                  <strong>{status.can_use_trial ? 'Available once' : 'Already used'}</strong>
                </li>
              </ul>
              <p className="profile-muted" style={{ marginTop: '14px', marginBottom: 0 }}>
                You can keep at most one active game pass and one streaming pass (or one combined bundle when you
                start fresh). If you already have streaming, buy a <strong>game-only</strong> pass to add games — not
                the bundle. The API blocks overlapping purchases.
              </p>
            </section>

            <section className="profile-card">
              <h2>Buy or renew</h2>
              <p className="profile-muted">
                Prices in AFN. Ineligible plans are greyed out. Checkout uses Palzio (mock PSP).
              </p>
              <div className="profile-plan-grid">
                {plans.map((p) => {
                  const blocked = Boolean(p.purchase_block_reason);
                  return (
                    <label
                      key={p.id}
                      className={`profile-plan ${selectedPlanId === p.id ? 'selected' : ''} ${blocked ? 'profile-plan--locked' : ''}`}
                      title={blocked ? p.purchase_block_reason ?? undefined : undefined}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={selectedPlanId === p.id}
                        disabled={blocked}
                        onChange={() => setSelectedPlanId(p.id)}
                      />
                      <span className="profile-plan-name">{p.name}</span>
                      <span className="profile-plan-meta">
                        {periodLabels[p.billing_period] ?? p.billing_period} ·{' '}
                        {entitlementLabels[p.entitlement_type] ?? p.entitlement_type}
                      </span>
                      <span className="profile-plan-price">
                        {p.price_afn} {p.currency}
                      </span>
                      {blocked && p.purchase_block_reason && (
                        <span className="profile-plan-block-hint">{p.purchase_block_reason}</span>
                      )}
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-gold profile-buy"
                disabled={purchaseBusy || !selectedPlanId || selectedBlocked}
                onClick={() => void handlePurchase()}
              >
                {purchaseBusy ? 'Starting checkout…' : 'Pay with Palzio (mock)'}
              </button>
              {status.has_active_subscription && (
                <p className="profile-muted" style={{ marginBottom: 0, marginTop: 12 }}>
                  You already have active access. <Link to="/dashboard">Go to dashboard</Link>.
                </p>
              )}
            </section>

            {history.length > 0 && (
              <section className="profile-card">
                <h2>Subscription history</h2>
                <div className="profile-table-wrap">
                  <table className="profile-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Entitlement</th>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Paid (AFN)</th>
                        <th>Mobile</th>
                        <th>Ends</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id}>
                          <td>{row.plan_name_snapshot || row.plan?.name || '—'}</td>
                          <td>{entitlementLabels[row.entitlement_type] ?? row.entitlement_type}</td>
                          <td>{periodLabels[row.billing_period] ?? row.billing_period}</td>
                          <td>{row.status}</td>
                          <td>{row.price_paid_afn ?? '—'}</td>
                          <td>{row.purchase_phone_number || '—'}</td>
                          <td>{new Date(row.end_at).toLocaleString()}</td>
                          <td>
                            {row.status === 'active' && row.is_active && (
                              <button type="button" className="profile-link-btn" onClick={() => void handleCancel(row.id)}>
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {!loading && tab === 'transactions' && (
          <section className="profile-card">
            <h2>Payment transactions</h2>
            <p className="profile-muted">All checkout attempts and outcomes for your account.</p>
            {txns.length === 0 ? (
              <p className="profile-muted">No transactions yet.</p>
            ) : (
              <div className="profile-table-wrap">
                <table className="profile-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.created_at).toLocaleString()}</td>
                        <td>{t.plan?.name ?? '—'}</td>
                        <td>
                          {t.amount} {t.currency}
                        </td>
                        <td>{t.status}</td>
                        <td>{t.payment_method ?? '—'}</td>
                        <td style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{t.transaction_ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
