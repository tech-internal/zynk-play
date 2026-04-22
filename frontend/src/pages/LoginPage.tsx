import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockSendOtp, mockVerifyOtp } from '../api/mockAuth';
import { isAuthenticated, saveMockAuthSession } from '../utils/authSession';
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
  const [countryCode, setCountryCode] = useState('+93');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Sign in — Game Palazio';
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const fullPhoneNumber = `${countryCode}${phone.trim()}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      setError('Enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await mockSendOtp(`${countryCode}${phoneDigits}`);
      setSuccessMsg(res.message);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP.');
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
    try {
      const res = await mockVerifyOtp(trimmedPhone, code);
      saveMockAuthSession({
        phone_number: res.phone_number,
        loggedIn: true,
        country_code: countryCode,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
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
          <h2 className="login-brand-headline">Play. Watch. One account.</h2>
          <p className="login-brand-copy">
            Stream live matches and launch games in the browser — secured with a quick code sent to your phone.
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
          <div className="login-panel-top">
            <p className="login-kicker">Sign in</p>
            <h1 className="login-heading">{step === 'phone' ? 'Enter your phone' : 'Verify it’s you'}</h1>
            <p className="login-lede">
              {step === 'phone'
                ? 'We’ll text you a one-time code. Standard rates may apply.'
                : 'Enter the code we sent. Demo environment: use 123456.'}
            </p>
          </div>

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="login-form" noValidate>
              <label className="login-label" htmlFor="countryCode">
                Country / region
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
                Mobile number
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
              {error && <p className="login-msg login-msg-error">{error}</p>}
              <button type="submit" className="login-btn-submit" disabled={loading}>
                {loading ? 'Sending code…' : 'Continue'}
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
                6-digit code
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
                <button type="submit" className="login-btn-submit login-btn-submit-inline" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          <p className="login-legal">
            By continuing you agree to our terms for streaming and gaming access.
          </p>
          <Link to="/" className="login-home-link">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
