import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockSendOtp, mockVerifyOtp } from '../api/mockAuth';
import { awardDailyLoginXp } from '../api/xp';
import { fetchSubscriptionStatus } from '../api/subscriptions';
import { fetchUserProfile } from '../api/user';
import { isAuthenticated, saveMockAuthSession } from '../utils/authSession';
import { useI18n, usePageTitle } from '../i18n';
import ApiLoaderOverlay from '../components/ApiLoaderOverlay';
import './LoginPage.css';

function maskPhoneDisplay(phone: string): string {
  const ccMatch = phone.match(/^\+\d+/);
  const cc = ccMatch?.[0] ?? '';
  const local = phone.slice(cc.length).replace(/\D/g, '');
  if (local.length < 4) {
    return phone;
  }
  const first = local[0];
  const last3 = local.slice(-3);
  return `${cc} ${first}•• ••• ${last3}`;
}

function formatResendTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const COUNTRY_OPTIONS = [
  { label: 'Afghanistan (+93)', value: '+93' },
  { label: 'Pakistan (+92)', value: '+92' },
  { label: 'India (+91)', value: '+91' },
  { label: 'United Arab Emirates (+971)', value: '+971' },
  { label: 'Saudi Arabia (+966)', value: '+966' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'United States (+1)', value: '+1' },
];

async function resolvePostLoginPath(): Promise<string> {
  try {
    const [profile, subStatus] = await Promise.all([fetchUserProfile(), fetchSubscriptionStatus()]);
    const needsOnboarding = !profile.profile_complete || !subStatus.has_active_subscription;
    return needsOnboarding ? '/profile?onboarding=1' : '/dashboard';
  } catch {
    return '/profile?onboarding=1';
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [countryCode, setCountryCode] = useState('+93');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  usePageTitle('login.pageTitle', 'FANVERSE | Elite HUD Access');

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const next = await resolvePostLoginPath();
      if (!cancelled) {
        navigate(next, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const fullPhoneNumber = `${countryCode}${phone.trim()}`;
  const phoneDigits = phone.replace(/\D/g, '');
  const canSubmitPhone = phoneDigits.length >= 7 && !loading;
  const canSubmitOtp = otp.trim().length === 6 && !loading;
  const otpInputRef = React.useRef<HTMLInputElement>(null);
  const activeOtpIndex = Math.min(otp.length, 5);
  const resetToPhoneStep = () => {
    setStep('phone');
    setOtp('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (phoneDigits.length < 7) {
      setError(t('login.error.phone'));
      return;
    }
    setLoading(true);
    try {
      const res = await mockSendOtp(`${countryCode}${phoneDigits}`);
      setSuccessMsg(res.message);
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error.sendOtp'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown, step]);

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading || phoneDigits.length < 7) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await mockSendOtp(`${countryCode}${phoneDigits}`);
      setSuccessMsg(res.message);
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error.resend'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedPhone = fullPhoneNumber;
    const code = otp.trim();
    if (code.length !== 6) {
      setError(t('login.error.code'));
      return;
    }
    setLoading(true);
    setPageLoading(true);
    try {
      const res = await mockVerifyOtp(trimmedPhone, code);
      const userId = res.user?.id ?? null;
      saveMockAuthSession({
        phone_number: res.phone_number,
        loggedIn: true,
        country_code: countryCode,
        access_token: res.access,
        refresh_token: res.refresh,
        user_id: userId,
      });
      if (userId) {
        void awardDailyLoginXp(userId);
      }
      const nextPath = await resolvePostLoginPath();
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error.verify'));
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleAwccStub = () => {
    setError(null);
    setSuccessMsg(t('login.awccStub'));
  };

  if (step === 'otp') {
    return (
      <div className="login-page login-page--otp">
        <ApiLoaderOverlay active={pageLoading} label={t('login.entering')} />
        <main className="fv-otp-screen">
          <span className="fv-otp-corner fv-otp-corner--tl" aria-hidden="true" />
          <span className="fv-otp-corner fv-otp-corner--tr" aria-hidden="true" />
          <span className="fv-otp-corner fv-otp-corner--bl" aria-hidden="true" />
          <span className="fv-otp-corner fv-otp-corner--br" aria-hidden="true" />

          <div className="fv-otp-screen-content">
            <form onSubmit={handleVerify} className="fv-otp-form" noValidate>
              <div className="fv-otp-brand-row">
                <Link to="/" className="fv-otp-brand-logo">
                  {t('brand.fanverse')}
                </Link>
                <div className="fv-otp-brand-tag">{t('brand.tagline')}</div>
              </div>

              <div className="fv-otp-card">
                <h2 className="fv-otp-title">⬢ {t('login.verifyAccess')}</h2>
                <p className="fv-otp-sub">{t('login.otpSmsHint')}</p>
                <p className="fv-otp-phone">{maskPhoneDisplay(fullPhoneNumber)}</p>

                {successMsg ? <p className="fv-otp-msg fv-otp-msg--ok">{successMsg}</p> : null}

                <div
                  className="fv-otp-boxes"
                  role="group"
                  aria-label={t('login.otpPayload')}
                  onClick={() => otpInputRef.current?.focus()}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otp[index];
                    const boxClass = [
                      'fv-otp-box',
                      digit ? 'filled' : '',
                      index === activeOtpIndex && !loading ? 'active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <div key={index} className={boxClass} aria-hidden="true">
                        {digit ?? ''}
                      </div>
                    );
                  })}
                  <input
                    ref={otpInputRef}
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="fv-otp-input-hidden"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={loading}
                    aria-label={t('login.otpPayload')}
                  />
                </div>

                {resendCooldown > 0 ? (
                  <p className="fv-otp-timer">
                    {t('login.otpResendIn')} <span>{formatResendTimer(resendCooldown)}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="fv-otp-timer fv-otp-timer--btn"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    {t('login.form.resend')}
                  </button>
                )}

                {error ? <p className="fv-otp-msg fv-otp-msg--error">{error}</p> : null}

                <button type="submit" className="fv-btn-orange" disabled={!canSubmitOtp}>
                  ⚡ {loading ? t('login.form.signingIn') : t('login.verifyEnter')}
                </button>

                <div className="fv-otp-gap" aria-hidden="true" />

                <button
                  type="button"
                  className="fv-btn-ghost fv-btn-ghost--full"
                  onClick={resetToPhoneStep}
                  disabled={loading}
                >
                  ◇ {t('login.changeNumber')}
                </button>

                <div className="fv-otp-flex-spacer" aria-hidden="true" />

                <p className="fv-otp-secured">🔒 {t('login.otpSecured')}</p>
              </div>
            </form>
          </div>
        </main>
        <p className="fv-otp-demo-hint">
          {t('login.demoOtp')} <kbd>123456</kbd>
        </p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <ApiLoaderOverlay active={pageLoading} label={t('login.entering')} />
      <div className="login-stadium-bg" aria-hidden="true">
        <div className="login-scanline" />
      </div>

      <main className="login-shell">
        <header className="login-branding">
          <Link to="/" className="login-brand-title">
            {t('brand.fanverse')}
          </Link>
          <div className="login-brand-subrow">
            <div className="login-brand-bar" aria-hidden="true" />
            <span className="login-brand-tag">{t('brand.tagline')}</span>
            <div className="login-brand-bar" aria-hidden="true" />
          </div>
        </header>

        <div className="login-glass-panel">
          <div className="login-corner login-corner-tl" aria-hidden="true" />
          <div className="login-corner login-corner-tr" aria-hidden="true" />
          <div className="login-corner login-corner-bl" aria-hidden="true" />
          <div className="login-corner login-corner-br" aria-hidden="true" />

          <div className="login-panel-head">
              <div className="login-panel-head-row">
                <span className="material-symbols-outlined login-icon-pulse" aria-hidden="true">
                  security
                </span>
                <h1 className="login-heading">{t('login.eliteAccess')}</h1>
              </div>
              <p className="login-lede">{t('login.initAuth')}</p>
            </div>

          <form onSubmit={handleSendOtp} className="login-form" noValidate>
              <div className="login-field-block">
                <div className="login-field-label-row">
                  <label className="login-label" htmlFor="phone">
                    {t('login.mobileId')}
                  </label>
                  <span className="login-hud-chip">SECURE_CHANNEL_AF</span>
                </div>
                <div className="login-phone-group">
                  <div className="login-country-wrap">
                    <select
                      id="countryCode"
                      className="login-country-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loading}
                      aria-label="Country code"
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    className="login-input login-phone-input"
                    placeholder="7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    autoComplete="tel"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>
              {error && <p className="login-msg login-msg-error">{error}</p>}
              {successMsg && !error && <p className="login-msg login-msg-ok">{successMsg}</p>}
              <button type="submit" className="login-btn-submit" disabled={!canSubmitPhone}>
                {loading ? t('login.form.sending') : t('login.requestOtp')}
                <span className="material-symbols-outlined" aria-hidden="true">
                  bolt
                </span>
              </button>
            </form>

          <>
            <div className="login-divider" role="separator">
                <hr className="login-divider-line" />
                <span className="login-divider-label">{t('login.systemOverride')}</span>
                <hr className="login-divider-line" />
              </div>
              <div className="login-secondary-stack">
                <button type="button" className="login-btn-secondary-gold" onClick={handleAwccStub}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    fingerprint
                  </span>
                  {t('login.awccLogin')}
                </button>
                <Link to="/" className="login-btn-secondary-ghost">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    person_search
                  </span>
                  {t('login.guestProtocol')}
                </Link>
              </div>
          </>
        </div>

        <footer className="login-footer">
          <div className="login-footer-rule" aria-hidden="true">
            <div className="login-footer-line login-footer-line-l" />
            <span className="material-symbols-outlined">encrypted</span>
            <div className="login-footer-line login-footer-line-r" />
          </div>
          <p>{t('login.footerLegal')}</p>
        </footer>

        <div className="login-hud-dock" aria-hidden="true">
          <div className="login-hud-node">
            <span>NODE: KABUL_CENTRAL</span>
            <div className="login-hud-pulse" />
          </div>
          <div className="login-hud-icon-wrap">
            <span className="material-symbols-outlined">sports_esports</span>
          </div>
          <span className="login-hud-status">{t('login.arenaLive')}</span>
        </div>
      </main>
      <div className="login-vignette" aria-hidden="true" />
    </div>
  );
};

export default LoginPage;
