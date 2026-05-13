import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/authSession';
import { useI18n } from '../i18n';
import './Header.css';

const navLinks: Array<{ label: string; to: string; match: (pathname: string, search: string) => boolean }> = [
  { label: 'Home', to: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Watch', to: '/streaming', match: (p) => p === '/streaming' },
  { label: 'Play', to: '/gameplay', match: (p) => p === '/gameplay' },
  {
    label: 'Earn',
    to: '/earn-share?view=earn',
    match: (p, s) => {
      if (p !== '/earn-share') return false;
      const v = new URLSearchParams(s).get('view');
      return v !== 'share';
    },
  },
  {
    label: 'Share',
    to: '/earn-share?view=share',
    match: (p, s) => p === '/earn-share' && new URLSearchParams(s).get('view') === 'share',
  },
];

const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useI18n();

  const authed = isAuthenticated();

  return (
    <header className="fv-top-header">
      <Link to="/dashboard" className="fv-top-header__brand">
        <div className="font-headline-lg text-primary tracking-wider uppercase">FANVERSE</div>
      </Link>
      {authed ? (
        <nav className="fv-top-header__nav hidden md:flex gap-8 items-center" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = link.match(location.pathname, location.search);
            return (
              <Link
                key={link.label}
                to={link.to}
                className={
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary hover:glow-sm transition-all duration-300'
                    : 'text-on-surface-variant font-medium hover:text-primary hover:glow-sm transition-all duration-300'
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      ) : (
        <div className="fv-top-header__nav-spacer" aria-hidden />
      )}
      <div className="fv-top-header__actions">
        {authed ? (
          <>
            <div className="fv-top-header__xp-chip">
              <span
                className="material-symbols-outlined fv-top-header__xp-icon"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden
              >
                stars
              </span>
              <span className="font-xp-counter">XP 1,240</span>
            </div>
            <div className="fv-top-header__icon-row">
              <button type="button" className="fv-top-header__icon-btn" aria-label="Notifications">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <Link to="/profile" className="fv-top-header__icon-btn" aria-label="Account">
                <span className="material-symbols-outlined">account_circle</span>
              </Link>
            </div>
          </>
        ) : (
          <Link to="/login" className="navbar-login">
            {t('header.login', 'Log in')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
