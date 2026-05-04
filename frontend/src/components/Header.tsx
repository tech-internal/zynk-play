import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearMockAuthSession, getMockAuthSession } from '../utils/authSession';
import { useI18n } from '../i18n';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string | null>(null);
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    const session = getMockAuthSession();
    setPhone(session?.phone_number ?? null);
  }, [location.pathname]);

  const logout = () => {
    clearMockAuthSession();
    setPhone(null);
    navigate('/login', { replace: true });
  };

  const displayPhone =
    phone && phone.length > 8 ? `${phone.slice(0, 4)}…${phone.slice(-3)}` : phone;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <svg className="navbar-logo-svg" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="headerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8e63c" />
                <stop offset="33%" stopColor="#ff6b35" />
                <stop offset="66%" stopColor="#e8356e" />
                <stop offset="100%" stopColor="#7b2d8b" />
              </linearGradient>
            </defs>
            <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <path d="M8 26 Q10 10 19 8 Q28 6 30 12 Q32 18 26 26" stroke="url(#headerLogoGrad)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="19" cy="22" r="4" fill="url(#headerLogoGrad)" opacity="0.9" />
          </svg>
          <span>
            Game<span className="text-gold">Palazio</span>
          </span>
        </Link>
        <div className="navbar-links">
          <Link to="/">{t('header.home', 'Home')}</Link>
          <Link to="/dashboard">{t('header.dashboard', 'Dashboard')}</Link>
          <Link to="/profile">{t('header.profile', 'Profile')}</Link>
          <Link to="/streaming">{t('header.streaming', 'Streaming')}</Link>
          <Link to="/gameplay">{t('header.gameplay', 'Gameplay')}</Link>
          <select
            className="navbar-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'fa' | 'ps')}
            aria-label="Language selector"
          >
            <option value="en">{t('lang.en', 'English')}</option>
            <option value="fa">{t('lang.fa', 'Dari')}</option>
            <option value="ps">{t('lang.ps', 'Pashto')}</option>
          </select>
          {phone ? (
            <>
              <span className="navbar-user" title={phone}>
                {displayPhone}
              </span>
              <button type="button" className="navbar-logout" onClick={logout}>
                {t('header.logout', 'Log out')}
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-login">
              {t('header.login', 'Log in')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
