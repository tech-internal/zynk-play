import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { hubNavItems } from '../config/hubNav';
import { MOCK_UNREAD_NOTIFICATIONS } from '../pages/NotificationsPage';
import { isAuthenticated } from '../utils/authSession';
import { useI18n } from '../i18n';
import './Header.css';

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB_Wbsw0hQWsYwD-_YNEHotpTrAJZu8tMLqc9eSkKUMKEeR7GjjeL-_N6G_Rj_fPod8HTOzTfJe774fzq_Zx2jYMKqvhY7DlS_UupjSQsesKoF0VgCPRJOoIYiweXb5rSwUrNHgfEEXXaXK1i-HvgyTW3TTYTqHlH7_QiR9-vTbcGKZuPAnGdRv1ItR6BxyzHGGyDrEF8tJ4lYtbv7m1YpIJYoWufKGbye0WsRQiCUFXChsqV0xRRjQe1BJOC8hiqik731RXwEmcQNX';

/** Desktop header links */
const headerNav = hubNavItems.filter((item) =>
  ['Home', 'Play', 'Wallet', 'Earn', 'Share'].includes(item.label),
);

const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useI18n();
  const authed = isAuthenticated();

  return (
    <header className="fv-top-header">
      <div className="fv-top-header__left">
        <Link to={authed ? '/dashboard' : '/'} className="fv-top-header__brand" aria-label="FANVERSE ELITE home">
          <h1 className="fv-top-header__logo">
            FANVERSE<span className="fv-top-header__logo-accent">ELITE</span>
          </h1>
        </Link>
        {authed ? (
          <nav className="fv-top-header__nav" aria-label="Primary">
            {headerNav.map((link) => {
              const isActive = link.match(location.pathname, location.search);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`fv-top-header__nav-link${isActive ? ' fv-top-header__nav-link--active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
      <div className="fv-top-header__actions">
        {authed ? (
          <>
            <div className="fv-top-header__rank">
              <span className="fv-top-header__rank-label">ELITE RANK</span>
              <div className="fv-top-header__rank-row">
                <span className="fv-top-header__rank-xp">
                  1,240
                  <span className="fv-top-header__rank-xp-unit">XP</span>
                </span>
              </div>
            </div>
            <div className="fv-top-header__tools">
              <div className="fv-top-header__notify-wrap">
                <Link to="/notifications" className="fv-top-header__icon-btn" aria-label="Notifications">
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
                {MOCK_UNREAD_NOTIFICATIONS > 0 ? (
                  <span className="fv-top-header__notify-badge" aria-hidden>
                    {MOCK_UNREAD_NOTIFICATIONS}
                  </span>
                ) : null}
              </div>
              <Link to="/settings" className="fv-top-header__icon-btn" aria-label="Settings">
                <span className="material-symbols-outlined">settings</span>
              </Link>
              <Link to="/profile" className="fv-top-header__avatar-wrap" aria-label="Profile">
                <img className="fv-top-header__avatar" src={AVATAR_URL} alt="" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="fv-top-header__tools fv-top-header__tools--guest">
              <div className="fv-top-header__notify-wrap">
                <Link to="/login" className="fv-top-header__icon-btn" aria-label="Notifications">
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
              </div>
              <Link to="/login" className="fv-top-header__icon-btn" aria-label="Settings">
                <span className="material-symbols-outlined">settings</span>
              </Link>
              <Link to="/login" className="fv-top-header__avatar-wrap" aria-label="Profile">
                <img className="fv-top-header__avatar" src={AVATAR_URL} alt="" />
              </Link>
            </div>
            <Link to="/login" className="fv-top-header__login">
              {t('header.login', 'Log in')}
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
