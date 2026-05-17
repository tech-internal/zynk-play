import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hubNavItems } from '../config/hubNav';
import { useEntitlements } from '../context/EntitlementsContext';
import { useI18n } from '../i18n';
import './AppBottomNav.css';

const iconFill = { fontVariationSettings: "'FILL' 1" } as const;

const AppBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { canWatchPlayEarn, loading, needsProfileCompletion, needsSubscription } = useEntitlements();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMessage, setGateMessage] = useState('');

  const premiumMessage = () => {
    if (needsProfileCompletion) {
      return t('gate.profile');
    }
    if (needsSubscription) {
      return t('gate.subscribe');
    }
    return t('gate.default');
  };

  const tryNavigate = (item: (typeof hubNavItems)[number]) => {
    if (item.premium && !loading && !canWatchPlayEarn) {
      setGateMessage(premiumMessage());
      setGateOpen(true);
      return;
    }
    navigate(item.to);
  };

  return (
    <>
      <nav className="app-bottom-nav" aria-label={t('a11y.mobileNav')}>
        {hubNavItems.map((item) => {
          const isActive = item.match(location.pathname, location.search);
          const content = (
            <>
              <div className={`app-bottom-nav__icon${isActive ? ' app-bottom-nav__icon--active' : ''}`}>
                <span
                  className="material-symbols-outlined"
                  style={isActive ? iconFill : undefined}
                  aria-hidden
                >
                  {item.icon}
                </span>
              </div>
              <span className="app-bottom-nav__label">{t(item.labelKey)}</span>
            </>
          );

          if (item.premium) {
            return (
              <button
                key={item.labelKey}
                type="button"
                className={`app-bottom-nav__link app-bottom-nav__link--btn${isActive ? ' app-bottom-nav__link--active' : ''}`}
                onClick={() => tryNavigate(item)}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.labelKey}
              to={item.to}
              className={`app-bottom-nav__link${isActive ? ' app-bottom-nav__link--active' : ''}`}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {gateOpen ? (
        <div className="app-bottom-gate-root" role="dialog" aria-modal="true" aria-labelledby="app-bottom-gate-title">
          <button
            type="button"
            className="app-bottom-gate-backdrop"
            aria-label={t('a11y.close')}
            onClick={() => setGateOpen(false)}
          />
          <div className="app-bottom-gate-panel">
            <h2 id="app-bottom-gate-title">{t('gate.title')}</h2>
            <p className="app-bottom-gate-body">{gateMessage}</p>
            <div className="app-bottom-gate-actions">
              <button
                type="button"
                className="app-bottom-gate-primary"
                onClick={() => {
                  setGateOpen(false);
                  navigate(needsProfileCompletion ? '/profile?onboarding=1' : '/subscription');
                }}
              >
                {needsProfileCompletion ? t('common.completeProfile') : t('common.viewPlans')}
              </button>
              <button type="button" className="app-bottom-gate-secondary" onClick={() => setGateOpen(false)}>
                {t('common.notNow')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AppBottomNav;
