import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clearMockAuthSession } from '../utils/authSession';
import { updateUserProfile } from '../api/user';
import { useEntitlements } from '../context/EntitlementsContext';
import ScreenHeader from '../components/ScreenHeader';
import { useI18n, usePageTitle } from '../i18n';
import './ProfilePage.css';

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCOhN2JII_NaJMChEafkeG_8nOJy6WpaaL00AjYhusN-PyUhmlozyh0LvppigFkjmcs_namjKPzALGzyI8XSPV9kdNiyb6MgftXVsz0ipPxkMCo_838vYImH3O4dp1fxYY5ZFtmjo5pnwSYdO2M9zMPzAPW2OhRn-gvcI2yzkf3ZrE3S6A5nl_ArZ-OiVdI3pdcm2CgCDFfI6tt4A2T_Q91qaNWWHsrKMZ7JvJsQML4sy-LNzL9VZQllio8N5hlianRa7eI-xkXS8p8';

function formatJoined(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(d);
  } catch {
    return '—';
  }
}

const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  usePageTitle('profile.pageTitle', 'Fanverse - User Profile');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, subStatus, loading, error, refresh, needsProfileCompletion, needsSubscription } =
    useEntitlements();

  const onboarding = searchParams.get('onboarding') === '1';
  const paidOk = searchParams.get('paid') === '1';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [languages, setLanguages] = useState('');

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? '');
    setFullName(profile.full_name ?? '');
    setEmail(profile.email ?? '');
    setCountry(profile.country ?? '');
    setLanguages(profile.languages ?? '');
  }, [profile]);

  const handleLogout = () => {
    clearMockAuthSession();
    navigate('/login', { replace: true });
  };

  const displayHandle = useMemo(() => {
    if (!profile) return '…';
    const u = (profile.username ?? '').trim();
    if (u) return u.toUpperCase();
    const n = (profile.full_name ?? '').trim();
    if (n) return n.toUpperCase();
    return profile.phone_number;
  }, [profile]);

  const commsDisplay = useMemo(() => {
    if (!profile) return '—';
    const e = (profile.email ?? '').trim();
    return e || profile.phone_number;
  }, [profile]);

  const dismissPaid = () => {
    searchParams.delete('paid');
    setSearchParams(searchParams, { replace: true });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setFormError(null);
    setSaving(true);
    try {
      await updateUserProfile({
        username: username.trim() || null,
        full_name: fullName.trim(),
        email: email.trim(),
        country: country.trim(),
        languages: languages.trim(),
      });
      await refresh();
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const sectorDisplay = (profile?.country ?? '').trim() || '—';
  const langDisplay = (profile?.languages ?? '').trim() || '—';
  const nameDisplay = (profile?.full_name ?? '').trim() || '—';

  return (
    <div className="fv-profile-root">
      <main className="fv-profile-main">
        <ScreenHeader title={t('profile.screenTitle')} />
        {paidOk && (
          <div className="fv-profile-banner fv-profile-banner--ok" role="status">
            <span>{t('profile.paymentOk')}</span>
            <button type="button" className="fv-profile-banner-dismiss" onClick={dismissPaid}>
              Dismiss
            </button>
          </div>
        )}

        {onboarding && (needsProfileCompletion || needsSubscription) && (
          <div className="fv-profile-banner" role="region" aria-label="Setup checklist">
            <div>
              <strong>{t('profile.finishSetup')}</strong>
              <ol className="fv-profile-onboard-steps">
                <li className={!needsProfileCompletion ? 'is-done' : ''}>{t('profile.stepProfile')}</li>
                <li className={!needsSubscription ? 'is-done' : ''}>{t('profile.stepPlan')}</li>
              </ol>
            </div>
            {!needsProfileCompletion ? (
              <Link to="/subscription" className="fv-profile-banner-cta">
                Choose plan
              </Link>
            ) : (
              <button type="button" className="fv-profile-banner-cta" onClick={() => setEditing(true)}>
                Edit profile
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="fv-profile-banner fv-profile-banner--err">
            {error}
            <button type="button" className="fv-profile-banner-dismiss" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        )}

        <section className="fv-profile-hero">
          <div className="fv-profile-avatar-block">
            <div className="fv-profile-avatar-frame">
              <img src={AVATAR_URL} alt="User Avatar" className="fv-profile-avatar-img" />
            </div>
            <div className="fv-profile-verified" aria-hidden>
              <span className="material-symbols-outlined fv-ms-fill">verified</span>
            </div>
          </div>
          <div className="fv-profile-hero-copy">
            <div className="fv-profile-kicker">
              <span className="fv-profile-kicker-bar" />
              <span className="fv-profile-kicker-text">SOVEREIGN ATHLETE</span>
            </div>
            <h1 className="fv-profile-title">{loading && !profile ? '…' : displayHandle}</h1>
            <div className="fv-profile-meta-row">
              <span className="fv-profile-rank-pill">
                {subStatus?.has_active_subscription ? 'Plus active' : 'Free tier'}
              </span>
              <span className="fv-profile-joined">
                <span className="material-symbols-outlined fv-profile-joined-icon">calendar_today</span>
                Joined {formatJoined(profile?.created_at)}
              </span>
            </div>
            <div className="fv-profile-xp-pill" aria-label="Account status">
              <span className="fv-profile-xp-label">ID</span>
              <span className="fv-profile-xp-value" style={{ fontSize: '0.75rem' }}>
                {(profile?.id ?? '').slice(0, 8) || '—'}
              </span>
            </div>
          </div>
        </section>

        <section className="fv-profile-grid">
          <div className="fv-profile-col fv-profile-col--main">
            <div className="fv-glass fv-hud-border fv-elite-card">
              <div className="fv-elite-watermark" aria-hidden>
                <span className="material-symbols-outlined">shield</span>
              </div>
              <div className="fv-elite-inner">
                <div className="fv-elite-head">
                  <div>
                    <h3 className="fv-elite-title">FANVERSE ELITE HUD</h3>
                    <p className="fv-elite-desc">
                      {subStatus?.has_active_subscription
                        ? 'Your subscription is active. Watch, play, and earn are unlocked on supported plans.'
                        : 'Subscribe to unlock live streams, games, and earn features.'}
                    </p>
                  </div>
                  <div className={`fv-standby-pill${subStatus?.has_active_subscription ? ' fv-standby-pill--live' : ''}`}>
                    <span className="material-symbols-outlined fv-ms-fill">
                      {subStatus?.has_active_subscription ? 'lock_open' : 'lock'}
                    </span>
                    <span className="fv-standby-label">{subStatus?.has_active_subscription ? 'ACTIVE' : 'STANDBY'}</span>
                  </div>
                </div>
                <div className="fv-elite-features">
                  <div className="fv-elite-feature">
                    <span className="material-symbols-outlined">sports_esports</span>
                    <div className="fv-elite-feature-title">PLAY</div>
                    <div className="fv-elite-feature-sub">
                      {profile?.has_game_entitlement ? 'UNLOCKED' : 'LOCKED'}
                    </div>
                  </div>
                  <div className="fv-elite-feature">
                    <span className="material-symbols-outlined">sensors</span>
                    <div className="fv-elite-feature-title">WATCH</div>
                    <div className="fv-elite-feature-sub">
                      {profile?.has_streaming_entitlement ? 'UNLOCKED' : 'LOCKED'}
                    </div>
                  </div>
                </div>
                <Link to="/subscription" className="fv-btn-elite">
                  {subStatus?.has_active_subscription ? 'MANAGE PLUS' : 'INITIALIZE ELITE UPGRADE'}
                  <span className="material-symbols-outlined">bolt</span>
                </Link>
              </div>
            </div>

            <div className="fv-glass fv-id-card">
              <h4 className="fv-section-heading">
                <span className="material-symbols-outlined">id_card</span>
                Personal Identification
              </h4>

              {editing ? (
                <form className="fv-profile-edit-form" onSubmit={saveProfile}>
                  <div className="fv-id-grid">
                    <label className="fv-id-field">
                      <span>Public handle</span>
                      <input value={username} onChange={(ev) => setUsername(ev.target.value)} maxLength={30} />
                    </label>
                    <label className="fv-id-field">
                      <span>Full name</span>
                      <input value={fullName} onChange={(ev) => setFullName(ev.target.value)} maxLength={120} />
                    </label>
                    <label className="fv-id-field">
                      <span>Comms (email)</span>
                      <input type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} />
                    </label>
                    <label className="fv-id-field">
                      <span>Country / region</span>
                      <input value={country} onChange={(ev) => setCountry(ev.target.value)} maxLength={80} />
                    </label>
                    <label className="fv-id-field fv-id-field--full">
                      <span>Languages</span>
                      <input
                        value={languages}
                        onChange={(ev) => setLanguages(ev.target.value)}
                        placeholder="e.g. Dari, Pashto, English"
                        maxLength={200}
                      />
                    </label>
                  </div>
                  {formError && <p className="fv-profile-form-error">{formError}</p>}
                  <div className="fv-id-footer fv-id-footer--row">
                    <button type="submit" className="fv-btn-modify" disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="fv-btn-modify fv-btn-modify--ghost" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="fv-id-grid">
                    <div className="fv-id-field">
                      <label>Subject Name</label>
                      <div>{loading && !profile ? '…' : nameDisplay}</div>
                    </div>
                    <div className="fv-id-field">
                      <label>Comms Channel</label>
                      <div>{loading && !profile ? '…' : commsDisplay}</div>
                    </div>
                    <div className="fv-id-field">
                      <label>Assigned Sector</label>
                      <div>{loading && !profile ? '…' : sectorDisplay}</div>
                    </div>
                    <div className="fv-id-field">
                      <label>Primary Interface</label>
                      <div>{loading && !profile ? '…' : langDisplay}</div>
                    </div>
                  </div>
                  <div className="fv-id-footer">
                    <button type="button" className="fv-btn-modify" onClick={() => setEditing(true)}>
                      <span className="material-symbols-outlined">edit_square</span>
                      Modify Parameters
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fv-profile-col fv-profile-col--side">
            <div className="fv-glass fv-side-card">
              <h4 className="fv-section-heading">
                <span className="material-symbols-outlined">hub</span>
                Uplink Nodes
              </h4>
              <div className="fv-uplink-row">
                <div className="fv-uplink-left">
                  <div className="fv-uplink-icon-wrap">
                    <span className="material-symbols-outlined">cell_tower</span>
                  </div>
                  <div>
                    <div className="fv-uplink-name">MOBILE UPLINK</div>
                    <div className="fv-uplink-status">
                      {loading && !profile ? '…' : profile?.phone_number ?? 'SECURE LINK'}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined fv-ms-fill fv-uplink-check">verified_user</span>
              </div>
              <button type="button" className="fv-btn-uplink" disabled>
                + Establish New Uplink
              </button>
            </div>

            <div className="fv-glass fv-side-card">
              <h4 className="fv-section-heading">
                <span className="material-symbols-outlined">settings_input_component</span>
                System Config
              </h4>
              <div className="fv-settings-list">
                <Link to="/history" className="fv-setting-row fv-setting-row--link">
                  <div className="fv-setting-left">
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span>Transaction Ledger</span>
                  </div>
                  <span className="material-symbols-outlined fv-chevron">chevron_right</span>
                </Link>
                <button type="button" className="fv-setting-row fv-setting-row--danger" onClick={handleLogout}>
                  <div className="fv-setting-left">
                    <span className="material-symbols-outlined">power_settings_new</span>
                    <span>Terminate Session</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="fv-profile-foot-mark">
              <div className="fv-foot-version">FANVERSE HUD 2.1</div>
              <div className="fv-foot-sub">Optimized by Afghan Telecom</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
