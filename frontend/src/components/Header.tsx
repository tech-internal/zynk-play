import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { headerNavLabelKeys, hubNavItems } from '../config/hubNav';
import { MOCK_UNREAD_NOTIFICATIONS } from '../pages/NotificationsPage';
import { isAuthenticated } from '../utils/authSession';
import { useI18n } from '../i18n';
import { useWatchXp } from '../context/WatchXpContext';
import './Header.css';

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB_Wbsw0hQWsYwD-_YNEHotpTrAJZu8tMLqc9eSkKUMKEeR7GjjeL-_N6G_Rj_fPod8HTOzTfJe774fzq_Zx2jYMKqvhY7DlS_UupjSQsesKoF0VgCPRJOoIYiweXb5rSwUrNHgfEEXXaXK1i-HvgyTW3TTYTqHlH7_QiR9-vTbcGKZuPAnGdRv1ItR6BxyzHGGyDrEF8tJ4lYtbv7m1YpIJYoWufKGbye0WsRQiCUFXChsqV0xRRjQe1BJOC8hiqik731RXwEmcQNX';

const headerNav = hubNavItems.filter((item) =>
  (headerNavLabelKeys as readonly string[]).includes(item.labelKey),
);

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useI18n();
  const authed = isAuthenticated();
  const { availableXp, countdownSeconds, sessionStarted, loading } = useWatchXp();

  return (
    <header className="fv-top-header">
      <div className="fv-top-header__left">
        <Link
          to={authed ? '/dashboard' : '/'}
          className="fv-top-header__brand"
          aria-label={t('header.homeAria')}
        >
          <h1 className="fv-top-header__logo">
            {t('brand.fanverse')}
            <span className="fv-top-header__logo-accent">{t('brand.elite')}</span>
          </h1>
        </Link>
        {authed ? (
          <nav className="fv-top-header__nav" aria-label={t('a11y.primaryNav')}>
            {headerNav.map((link) => {
              const isActive = link.match(location.pathname, location.search);
              return (
                <Link
                  key={link.labelKey}
                  to={link.to}
                  className={`fv-top-header__nav-link${isActive ? ' fv-top-header__nav-link--active' : ''}`}
                >
                  {t(link.labelKey)}
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
              <span className="fv-top-header__rank-label">{t('header.eliteRank')}</span>
              <div className="fv-top-header__rank-row">
                <span className="fv-top-header__rank-xp">
                  {loading ? '...' : availableXp.toLocaleString()}
                  <span className="fv-top-header__rank-xp-unit">XP</span>
                </span>
              </div>
              <span className="fv-top-header__watch-timer">
                {sessionStarted ? `Watch +XP in ${formatCountdown(countdownSeconds)}` : 'Start watch to earn XP'}
              </span>
            </div>
            <div className="fv-top-header__tools">
              <div className="fv-top-header__notify-wrap">
                <Link
                  to="/notifications"
                  className="fv-top-header__icon-btn"
                  aria-label={t('header.notifications')}
                >
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
                {MOCK_UNREAD_NOTIFICATIONS > 0 ? (
                  <span className="fv-top-header__notify-badge" aria-hidden>
                    {MOCK_UNREAD_NOTIFICATIONS}
                  </span>
                ) : null}
              </div>
              <Link to="/settings" className="fv-top-header__icon-btn" aria-label={t('header.settings')}>
                <span className="material-symbols-outlined">settings</span>
              </Link>
              <Link to="/profile" className="fv-top-header__avatar-wrap" aria-label={t('header.profile')}>
                <img className="fv-top-header__avatar" src={AVATAR_URL} alt="" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="fv-top-header__tools fv-top-header__tools--guest">
              <div className="fv-top-header__notify-wrap">
                <Link to="/login" className="fv-top-header__icon-btn" aria-label={t('header.notifications')}>
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
              </div>
              <Link to="/login" className="fv-top-header__icon-btn" aria-label={t('header.settings')}>
                <span className="material-symbols-outlined">settings</span>
              </Link>
              <Link to="/login" className="fv-top-header__avatar-wrap" aria-label={t('header.profile')}>
                <img className="fv-top-header__avatar" src={AVATAR_URL} alt="" />
              </Link>
            </div>
            <Link to="/login" className="fv-top-header__login">
              {t('header.login')}
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
