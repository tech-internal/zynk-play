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

  useEffect(() => {
    document.title = 'FANVERSE | Elite HUD Access';
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

  const handleAwccStub = () => {
    setError(null);
    setSuccessMsg('Encrypted AWCC federated login is not enabled in this build.');
  };

  return (
    <div className="login-page">
      <ApiLoaderOverlay active={pageLoading} label="Preparing your cricket lobby..." />
      <div className="login-stadium-bg" aria-hidden="true">
        <div className="login-scanline" />
      </div>

      <main className="login-shell">
        <header className="login-branding">
          <Link to="/" className="login-brand-title">
            FANVERSE
          </Link>
          <div className="login-brand-subrow">
            <div className="login-brand-bar" aria-hidden="true" />
            <span className="login-brand-tag">Elite HUD System</span>
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
                {step === 'phone' ? 'security' : 'verified_user'}
              </span>
              <h1 className="login-heading">{step === 'phone' ? 'ELITE ACCESS' : 'VERIFY TOKEN'}</h1>
            </div>
            <p className="login-lede">
              {step === 'phone' ? 'Initialize encrypted authentication' : 'Confirm one-time passkey to enter'}
            </p>
          </div>

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="login-form" noValidate>
              <div className="login-field-block">
                <div className="login-field-label-row">
                  <label className="login-label" htmlFor="phone">
                    Mobile ID
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
                {loading ? t('login.form.sending', 'Sending code…') : 'REQUEST OTP'}
                <span className="material-symbols-outlined" aria-hidden="true">
                  bolt
                </span>
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="login-form" noValidate>
              <p className="login-sent">
                Sent to <strong>{fullPhoneNumber}</strong>
              </p>
              {successMsg && <p className="login-msg login-msg-ok">{successMsg}</p>}
              <div className="login-field-block">
                <div className="login-field-label-row">
                  <label className="login-label" htmlFor="otp">
                    OTP Payload
                  </label>
                  <span className="login-hud-chip">ROTATING_KEY_6</span>
                </div>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="login-input login-input-otp"
                  placeholder="• • • • • •"
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
              </div>
              <p className="login-demo-hint">
                Demo OTP: <kbd>123456</kbd>
              </p>
              {error && <p className="login-msg login-msg-error">{error}</p>}
              <div className="login-actions">
                <button type="button" className="login-btn-text" onClick={resetToPhoneStep} disabled={loading}>
                  Different number
                </button>
                <button type="submit" className="login-btn-submit login-btn-submit-inline" disabled={!canSubmitOtp}>
                  {loading ? t('login.form.signingIn', 'Signing in…') : 'VERIFY & ENTER'}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    sports_esports
                  </span>
                </button>
              </div>
              <button
                type="button"
                className="login-btn-text login-btn-resend"
                onClick={handleResendCode}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `${t('login.form.resend', 'Resend code')} ${resendCooldown}s`
                  : t('login.form.resend', 'Resend code')}
              </button>
            </form>
          )}

          {step === 'phone' && (
            <>
              <div className="login-divider" role="separator">
                <hr className="login-divider-line" />
                <span className="login-divider-label">System override</span>
                <hr className="login-divider-line" />
              </div>
              <div className="login-secondary-stack">
                <button type="button" className="login-btn-secondary-gold" onClick={handleAwccStub}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    fingerprint
                  </span>
                  Encrypted AWCC login
                </button>
                <Link to="/" className="login-btn-secondary-ghost">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    person_search
                  </span>
                  Guest protocol
                </Link>
              </div>
            </>
          )}
        </div>

        <footer className="login-footer">
          <div className="login-footer-rule" aria-hidden="true">
            <div className="login-footer-line login-footer-line-l" />
            <span className="material-symbols-outlined">encrypted</span>
            <div className="login-footer-line login-footer-line-r" />
          </div>
          <p>
            Access restricted to authorized personnel. End-to-end encryption active via AF-CyberLink v4.2.
          </p>
        </footer>

        <div className="login-hud-dock" aria-hidden="true">
          <div className="login-hud-node">
            <span>NODE: KABUL_CENTRAL</span>
            <div className="login-hud-pulse" />
          </div>
          <div className="login-hud-icon-wrap">
            <span className="material-symbols-outlined">sports_esports</span>
          </div>
          <span className="login-hud-status">Arena status: Live</span>
        </div>
      </main>
      <div className="login-vignette" aria-hidden="true" />
    </div>
  );
};

export default LoginPage;
