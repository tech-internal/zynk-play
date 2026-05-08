import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockSendOtp, mockVerifyOtp } from '../api/mockAuth';
import { fetchSubscriptionStatus } from '../api/subscriptions';
import { fetchUserProfile } from '../api/user';
import { isAuthenticated, saveMockAuthSession } from '../utils/authSession';
import { useI18n } from '../i18n';
import ApiLoaderOverlay from '../components/ApiLoaderOverlay';
import './LoginPage.css';

const COUNTRY_OPTIONS = [
  { label: 'Afghanistan (+93)', value: '+93' },
  { label: 'Pakistan (+92)', value: '+92' },
  { label: 'India (+91)', value: '+91' },
  { label: 'United Arab Emirates (+971)', value: '+971' },
  { label: 'Saudi Arabia (+966)', value: '+966' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'United States (+1)', value: '+1' },
];

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

  const resolvePostLoginPath = async (): Promise<string> => {
    try {
      const [profile, subStatus] = await Promise.all([fetchUserProfile(), fetchSubscriptionStatus()]);
      const needsOnboarding = !profile.profile_complete || !subStatus.has_active_subscription;
      return needsOnboarding ? '/profile?onboarding=1' : '/dashboard';
    } catch {
      return '/profile?onboarding=1';
    }
  };

  useEffect(() => {
    document.title = t('login.title', 'Sign in — Game Palazio');
    if (!isAuthenticated()) {
      return;
    }
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      const nextPath = await resolvePostLoginPath();
      if (!cancelled) {
        navigate(nextPath, { replace: true });
        setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setPageLoading(false);
    };
  }, [navigate, t]);

  const fullPhoneNumber = `${countryCode}${phone.trim()}`;
  const phoneDigits = phone.replace(/\D/g, '');
  const canSubmitPhone = phoneDigits.length >= 7 && !loading;
  const canSubmitOtp = otp.trim().length === 6 && !loading;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (phoneDigits.length < 7) {
      setError('Enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await mockSendOtp(`${countryCode}${phoneDigits}`);
      setSuccessMsg(res.message);
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP.');
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
      setError(err instanceof Error ? err.message : 'Could not resend code.');
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
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setPageLoading(true);
    try {
      const res = await mockVerifyOtp(trimmedPhone, code);
      saveMockAuthSession({
        phone_number: res.phone_number,
        loggedIn: true,
        country_code: countryCode,
        access_token: res.access,
        refresh_token: res.refresh,
        user_id: res.user?.id ?? null,
      });
      const nextPath = await resolvePostLoginPath();
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <ApiLoaderOverlay active={pageLoading} label="Preparing your cricket lobby..." />
      <aside className="login-brand" aria-hidden="false">
        <div className="login-brand-inner">
          <Link to="/" className="login-brand-logo">
            <svg className="login-logo-svg" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="loginLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c8e63c" />
                  <stop offset="50%" stopColor="#ff6b35" />
                  <stop offset="100%" stopColor="#7b2d8b" />
                </linearGradient>
              </defs>
              <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <path d="M8 26 Q10 10 19 8 Q28 6 30 12 Q32 18 26 26" stroke="url(#loginLogoGrad)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <circle cx="19" cy="22" r="4" fill="url(#loginLogoGrad)" />
            </svg>
            <span>
              Game<span className="login-logo-gold">Palazio</span>
            </span>
          </Link>
          <h2 className="login-brand-headline">{t('login.brand.headline', 'Play. Watch. One account.')}</h2>
          <p className="login-brand-copy">
            {t(
              'login.brand.copy',
              'Stream live matches and launch games in the browser — secured with a quick code sent to your phone.',
            )}
          </p>
          <ul className="login-brand-list">
            <li>
              <span className="login-check">✓</span> No password to remember
            </li>
            <li>
              <span className="login-check">✓</span> Built for big screens &amp; mobile
            </li>
            <li>
              <span className="login-check">✓</span> Cricket, streams, and more
            </li>
          </ul>
        </div>
        <div className="login-brand-glow" />
      </aside>

      <main className="login-main">
        <div className="login-main-bg" aria-hidden="true" />
        <div className="login-panel">
          <div className="login-stepper" aria-hidden="true">
            <div className={`login-stepper-dot ${step === 'phone' ? 'is-active' : 'is-complete'}`} />
            <span className="login-stepper-line" />
            <div className={`login-stepper-dot ${step === 'otp' ? 'is-active' : ''}`} />
          </div>
          <div className="login-panel-top">
            <p className="login-kicker">{t('login.step.signin', 'Sign in')}</p>
            <h1 className="login-heading">
              {step === 'phone' ? t('login.step.enterPhone', 'Enter your phone') : t('login.step.verify', 'Verify it’s you')}
            </h1>
            <p className="login-lede">
              {step === 'phone'
                ? 'We’ll text you a one-time code. Standard rates may apply.'
                : 'Enter the code we sent. Demo environment: use 123456.'}
            </p>
          </div>

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="login-form" noValidate>
              <label className="login-label" htmlFor="countryCode">
                {t('login.form.country', 'Country / region')}
              </label>
              <select
                id="countryCode"
                className="login-input login-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="login-label" htmlFor="phone">
                {t('login.form.mobile', 'Mobile number')}
              </label>
              <input
                id="phone"
                type="tel"
                className="login-input"
                placeholder="3001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                autoComplete="tel"
                autoFocus
                disabled={loading}
              />
              <p className="login-meta-hint">We'll send a secure 6-digit verification code.</p>
              {error && <p className="login-msg login-msg-error">{error}</p>}
              <button type="submit" className="login-btn-submit" disabled={!canSubmitPhone}>
                {loading ? t('login.form.sending', 'Sending code…') : t('login.form.continue', 'Continue')}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="login-form" noValidate>
              <p className="login-sent">
                Sent to <strong>{fullPhoneNumber}</strong>
              </p>
              {successMsg && <p className="login-msg login-msg-ok">{successMsg}</p>}
              <label className="login-label" htmlFor="otp">
                {t('login.form.code', '6-digit code')}
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="login-input login-input-otp"
                placeholder="0 0 0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                autoFocus
                disabled={loading}
              />
              <div className="login-otp-preview" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <span key={index} className={`login-otp-cell ${otp[index] ? 'is-filled' : ''}`}>
                    {otp[index] ?? ''}
                  </span>
                ))}
              </div>
              <p className="login-demo-hint">
                Try <kbd>123456</kbd>
              </p>
              {error && <p className="login-msg login-msg-error">{error}</p>}
              <div className="login-actions">
                <button
                  type="button"
                  className="login-btn-text"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  disabled={loading}
                >
                  ← Different number
                </button>
                <button type="submit" className="login-btn-submit login-btn-submit-inline" disabled={!canSubmitOtp}>
                  {loading ? t('login.form.signingIn', 'Signing in…') : t('login.form.signin', 'Sign in')}
                </button>
              </div>
              <button
                type="button"
                className="login-btn-text login-btn-resend"
                onClick={handleResendCode}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `${t('login.form.resend', 'Resend code')} ${resendCooldown}s` : t('login.form.resend', 'Resend code')}
              </button>
            </form>
          )}

          <p className="login-legal">
            By continuing you agree to our terms for streaming and gaming access.
          </p>
          <Link to="/" className="login-home-link">
            ← {t('login.form.backHome', 'Back to home')}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
