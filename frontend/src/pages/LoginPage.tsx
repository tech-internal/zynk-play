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
    // Session already exists: avoid calling onboarding/subscription APIs again.
    navigate('/dashboard', { replace: true });
  }, [navigate, t]);

  const fullPhoneNumber = `${countryCode}${phone.trim()}`;
  const phoneDigits = phone.replace(/\D/g, '');
  const canSubmitPhone = phoneDigits.length >= 7 && !loading;
  const canSubmitOtp = otp.trim().length === 6 && !loading;
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
    <div className="login-page">
      <ApiLoaderOverlay active={pageLoading} label="Preparing your cricket lobby..." />
      <div className="login-stadium-bg" aria-hidden="true">
        <div className="login-calligraphy-overlay">
          <span>افغانستان</span>
        </div>
      </div>

      <main className="login-shell">
        <header className="login-branding">
          <Link to="/" className="login-brand-title">
            GAME PLAZIO
          </Link>
          <div className="login-brand-line" />
        </header>

        <div className="login-panel">
          <div className="login-panel-top">
            <h1 className="login-heading">{step === 'phone' ? 'SOVEREIGN ACCESS' : 'VERIFY ACCESS'}</h1>
            <p className="login-lede">{step === 'phone' ? 'Watch and Play • Enter the Arena' : 'Enter the 6-digit OTP we sent to your number'}</p>
          </div>

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="login-form" noValidate>
              <label className="login-label" htmlFor="phone">
                Phone Number
              </label>
              <div className="login-phone-group">
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
              {error && <p className="login-msg login-msg-error">{error}</p>}
              <button type="submit" className="login-btn-submit" disabled={!canSubmitPhone}>
                {loading ? t('login.form.sending', 'Sending code…') : 'REQUEST OTP'}
                <span className="login-btn-arrow">→</span>
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
                OTP Code
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
              <p className="login-demo-hint">Demo OTP: <kbd>123456</kbd></p>
              {error && <p className="login-msg login-msg-error">{error}</p>}
              <div className="login-actions">
                <button
                  type="button"
                  className="login-btn-text"
                  onClick={resetToPhoneStep}
                  disabled={loading}
                >
                  Different number
                </button>
                <button type="submit" className="login-btn-submit login-btn-submit-inline" disabled={!canSubmitOtp}>
                  {loading ? t('login.form.signingIn', 'Signing in…') : 'VERIFY & ENTER'}
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

          <div className="login-disclaimer">
            <p>Identity verified via secure Afghan mobile networks.</p>
          </div>
        </div>

        <footer className="login-footer">
          <p>
            By entering Game Plazio, you agree to the Digital Sovereign Charter and Privacy Protocol.
            Securely encrypted by AF-CyberLink.
          </p>
        </footer>

        <div className="login-live-orb" aria-hidden="true">
          <div className="login-live-icon">🏟</div>
          <span>LIVE ARENA</span>
        </div>
      </main>
      <div className="login-vignette" aria-hidden="true" />
    </div>
  );
};

export default LoginPage;
